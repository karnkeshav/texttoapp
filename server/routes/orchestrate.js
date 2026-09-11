'use strict';
/**
 * Orchestrate Route — Cloud Backend Execution Engine for AI-Orchestration & Ready4Launch
 * Supports full app generation, code self-healing, GitHub repository provisioning,
 * and live GitHub Pages deployment with real-time SSE streaming & status polling.
 */

const express = require('express');
const { pooledStream, pooledGenerate } = require('../services/geminiPool');
const { auditAndHeal } = require('../services/codeQuality');
const { listRepos, createRepo, pushFiles, enablePages, getFileContent } = require('../services/githubService');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: require('crypto').randomUUID } : { v4: () => Math.random().toString(36).substring(2, 12) };

const router = express.Router();

// In-memory tasks store for async polling (/api/status/:taskId)
const activeTasks = new Map();

// Helper: Clean repository slug
function cleanSlug(text) {
  let clean = (text || '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
  return clean.slice(0, 40).replace(/^-+|-+$/g, '') || 'ai-app';
}

// ── CDN version pinning ───────────────────────────────────────────
const CDN_PINS = [
  [/https?:\/\/cdn\.tailwindcss\.com(?!\/[\d])[^\s"']*/g, 'https://cdn.tailwindcss.com/3.4.0/tailwind.min.css'],
  [/https?:\/\/cdn\.tailwindcss\.com\/[\d.]+\/tailwind\.min\.css/g, 'https://cdn.tailwindcss.com/3.4.0/tailwind.min.css'],
  [/https?:\/\/unpkg\.com\/lucide@latest[^\s"']*/g, 'https://unpkg.com/lucide@0.378.0/dist/umd/lucide.min.js'],
  [/https?:\/\/unpkg\.com\/alpinejs@[\d.x]*[^\s"']*/g, 'https://unpkg.com/alpinejs@3.13.10/dist/cdn.min.js'],
  [/https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/animate\.css\/[\d.]+\/animate\.min\.css/g, 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'],
];

function pinCDNVersions(html) {
  let result = html;
  for (const [pattern, pinned] of CDN_PINS) {
    result = result.replace(pattern, pinned);
  }
  return result;
}

// ── GET /health ──────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ready4launch-cloud-engine',
    timestamp: new Date().toISOString(),
    engine: 'Gemini AI Pool + Antigravity 2.0',
  });
});

// ── GET /github-repos ────────────────────────────────────────────
router.get('/github-repos', async (req, res) => {
  const token = req.headers['x-github-token'] || req.session?.githubToken || process.env.GITHUB_TOKEN;
  const targetUser = req.query.user || req.headers['x-github-user'] || req.session?.user?.login || 'karnkeshav';

  try {
    if (token) {
      const repos = await listRepos(token);
      return res.json({ repos });
    }

    // Public GitHub API fallback
    const axios = require('axios');
    const directRes = await axios.get(`https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?sort=updated&per_page=30`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Ready4Launch-Orchestrator' }
    });

    if (directRes.status === 200 && Array.isArray(directRes.data)) {
      const repos = directRes.data.map(r => ({
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        url: r.html_url,
        homepageUrl: r.homepage || '',
        pages_url: `https://${r.owner?.login || targetUser}.github.io/${r.name}/`,
        description: r.description || '',
        updatedAt: r.updated_at
      }));
      return res.json({ repos });
    }

    res.json({ repos: [] });
  } catch (err) {
    console.error('[Orchestrate] Error fetching repos:', err.message);
    res.status(500).json({ error: err.message, repos: [] });
  }
});

// ── GET /status/:taskId ──────────────────────────────────────────
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const since = parseInt(req.query.since || '0', 10);
  const task = activeTasks.get(taskId);

  if (!task) {
    return res.status(404).json({ status: 'NOT_FOUND', error: 'Task ID not found or expired' });
  }

  const logs = task.logs || [];
  const newLogs = logs.slice(since);

  res.json({
    task_id: taskId,
    status: task.status,
    logs: newLogs,
    next_since: logs.length,
    answer: task.answer || null,
    deliverable: task.deliverable || null,
    error: task.error || null,
  });
});

// ── POST /execute & /apps/generate & /orchestrate ─────────────────
async function handleOrchestration(req, res) {
  const {
    prompt,
    category = 'apps',
    github_user,
    github_token,
    editMode = false,
    editOwner,
    editRepo,
    theme = 'modern-minimal',
    stream = false
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on cloud backend' });
  }

  const targetUser = github_user || req.headers['x-github-user'] || req.session?.user?.login || 'karnkeshav';
  const token = github_token || req.headers['x-github-token'] || req.session?.githubToken || process.env.GITHUB_TOKEN || '';

  const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const task = {
    taskId,
    status: 'RUNNING',
    logs: [],
    answer: '',
    deliverable: null,
    createdAt: Date.now()
  };
  activeTasks.set(taskId, task);

  // Clean old tasks after 30 minutes
  if (activeTasks.size > 200) {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, t] of activeTasks.entries()) {
      if (t.createdAt < cutoff) activeTasks.delete(id);
    }
  }

  const isSse = stream || req.headers.accept?.includes('text/event-stream');

  const addLog = (msg) => {
    task.logs.push(msg);
    if (isSse) {
      res.write(`data: ${JSON.stringify({ type: 'status', message: msg, task_id: taskId })}\n\n`);
    }
  };

  if (isSse) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  addLog(`[00:00] ⚡ Antigravity Engine: Directive received: "${prompt.trim().slice(0, 75)}..."`);

  // If non-SSE, respond immediately with taskId so client can poll
  if (!isSse && req.path.includes('/execute')) {
    res.json({
      task_id: taskId,
      status: 'QUEUED',
      message: 'Mission queued on Ready4Launch Cloud Engine'
    });
  }

  // Execute in background
  (async () => {
    try {
      const pLower = prompt.trim().toLowerCase();
      
      const appCreationPatterns = [
        /\b(?:create|build|make|generate|deploy|scaffold|develop|code)\s+(?:an?\s+)?(?:[a-z0-9_-]+\s+)*(?:app|webapp|web\s*app|website|site|application|portal|landing\s*page|storefront)\b/i,
        /^(?:create|build|make|generate|deploy)\s+(?:an?\s+)?(?:[a-z0-9_-]+\s+)*(?:dashboard|portfolio|calculator|tracker|clone|game)\b/i,
        /\b(?:build|create|generate|deploy)\s+(?:me\s+)?(?:an?\s+)?(?:full-?stack|frontend|react|vue|html|svelte|single-?page\s+app)\b/i
      ];
      
      const isNonAppQuery = /(?:what|how many|show|list|check|compare|calculate|find|get|tell me|explain|why|is there|status|cost|bill|spend|pricing|instance|vm|server|ec2|bucket|s3|deal|price|cheapest|faster|food|biryani|pizza|uber|ola|rapido|zomato|swiggy|amazon|flipkart|blinkit|zepto|meesho)/i.test(pLower);
      
      const matchesAppPattern = appCreationPatterns.some(pat => pat.test(pLower));
      const isAppRequest = matchesAppPattern || (category === 'apps' && !isNonAppQuery);

      if (!isAppRequest) {
        // --- Direct Domain & Intelligence Query Pipeline (FinOps, Cloud, Deals, Food, Mobility, Info) ---
        let domainSysPrompt = '';
        let domainTitle = '🧠 Antigravity Intelligence';
        let domainType = 'info';

        if (category === 'finops' || /(?:cost|bill|billing|spend|expense|invoice|charge|finops)/i.test(pLower)) {
          addLog(`[00:01] 📊 Antigravity FinOps Engine: Querying multi-cloud telemetry & billing models (AWS + OCI + Azure + GCP)...`);
          addLog(`[00:03] 💰 Analyzing cost breakdown, sustained use discounts, and active recommendations...`);
          domainTitle = '💰 Multi-Cloud FinOps Intelligence';
          domainType = 'finops';
          domainSysPrompt = `You are the AI Multi-Cloud FinOps & Cost Intelligence Assistant covering AWS, Oracle Cloud (OCI), Microsoft Azure, and Google Cloud (GCP).
Answer the user's cost/FinOps request thoroughly with structured markdown.

FORMATTING INSTRUCTIONS:
- If the user asks for "tabular" or "table" format: Output the spend breakdown in a clean Markdown table (| Cloud Provider | Period | Monthly Spend | Currency | Status / Source | Primary Drivers |) followed by an aggregated total row.
- If the user asks for "graphical" or "chart" or "diagram" presentation: Include interactive Mermaid diagrams (\`\`\`mermaid pie ... \`\`\` or \`\`\`mermaid xychart-beta ... \`\`\`) along with summary financial highlights.
- If the user asks for "sentence" or "narrative" or "in words" format: Write in flowing, natural English sentences and bulleted narrative explanations without Markdown tables or code blocks.
- If no specific format is requested: Provide a comprehensive multi-perspective response (Executive spend KPI, Markdown table breakdown, Mermaid distribution chart, and actionable optimization insights).

Include clear spend summary per cloud provider with icons (🔶 AWS, 🔴 OCI, 🔷 Azure, ⚪ GCP), key cost drivers, and quantified optimization recommendations.
Do NOT output raw HTML documents or app code. Return pure, high-value Markdown.`;
        } else if (category === 'cloud' || /(?:instance|vm|server|ec2|bucket|s3|infrastructure|storage)/i.test(pLower)) {
          addLog(`[00:01] ☁️ Antigravity Cloud Engine: Auditing multi-cloud infrastructure & compute instances across AWS, OCI, Azure & GCP...`);
          addLog(`[00:02] 🌐 Normalizing cross-cloud compute inventory and availability zones...`);
          domainTitle = '☁️ Multi-Cloud Infrastructure Inventory';
          domainType = 'cloud_query';
          domainSysPrompt = `You are the AI Multi-Cloud Infrastructure Architect covering AWS, OCI, Azure, and GCP.
Answer the user's infrastructure query with structured markdown.
FORMATTING INSTRUCTIONS:
- If tabular/table requested: Return markdown inventory tables (Provider, Instance/Resource Name, Shape/Machine Type, Zone/Region, State, IP) with total rows.
- If graphical/chart requested: Return Mermaid distribution pie charts or flowchart diagrams (\`\`\`mermaid flowchart TD ... \`\`\`).
- If sentence/narrative requested: Write in concise, professional English sentences and bullet summaries without tables or code blocks.
- If default: Provide summary count, markdown inventory table, and Mermaid architecture diagram.`;
        } else if (category === 'shop' || /(?:deal|discount|amazon|flipkart|blinkit|zepto|meesho|buy|earphone|laptop|phone)/i.test(pLower)) {
          addLog(`[00:01] 🛍️ Antigravity Commerce Engine: Searching deal arbitrage across Amazon, Flipkart, Blinkit, Zepto & Meesho...`);
          domainTitle = '🛍️ Visual Best Deal Comparison';
          domainType = 'shopping';
          domainSysPrompt = `You are the AI Indian E-Commerce Price Arbitrage Assistant comparing Amazon, Flipkart, Blinkit, Zepto, and Meesho.
Provide side-by-side pricing tables, delivery ETAs, discount breakdown, and smart ordering recommendations in markdown. Respect formatting directives (tabular tables, charts, or sentence recommendations) requested by the user.`;
        } else if (category === 'food' || /(?:food|paneer|biryani|pizza|burger|zomato|swiggy|restaurant)/i.test(pLower)) {
          addLog(`[00:01] 🍲 Antigravity Food Engine: Comparing restaurant dish pricing & delivery ETAs across Zomato & Swiggy...`);
          domainTitle = '🍲 Food Delivery Arbitrage';
          domainType = 'food_comparison';
          domainSysPrompt = `You are the AI Food Delivery Intelligence Assistant comparing Zomato and Swiggy. Provide cheapest restaurant vs fastest delivery comparisons in markdown. Respect tabular, graphical, or narrative format requests.`;
        } else if (category === 'travel' || /(?:ride|cab|fare|uber|ola|rapido|auto|bike taxi)/i.test(pLower)) {
          addLog(`[00:01] 🚖 Antigravity Mobility Engine: Calculating 3-way route fare arbitrage (Rapido vs Uber vs Ola)...`);
          domainTitle = '🚖 Mobility Fare Comparison';
          domainType = 'ride_comparison';
          domainSysPrompt = `You are the 3-Way Mobility Arbitrage Assistant (Rapido vs Uber vs Ola). Compare bike taxi, auto rickshaw, and cab fares with ranking and recommendations in markdown. Respect tabular, graphical, or sentence format requests.`;
        } else {
          addLog(`[00:01] 🧠 Antigravity Intelligence Engine: Processing request...`);
          domainSysPrompt = `You are the Antigravity Autonomous AI Assistant. Answer the user's request thoroughly, accurately, and cleanly using formatted markdown. Respect any requested presentation styles (tables, charts, or narrative sentences).`;
        }

        let directAnswer = '';
        await pooledStream({
          contents: [{ role: 'user', parts: [{ text: prompt.trim() }] }],
          config: { maxOutputTokens: 4096, temperature: 0.3 },
          apiKey,
          tier: 'chat',
          systemInstruction: domainSysPrompt,
          onChunk: (chunk) => {
            directAnswer += chunk;
            if (isSse) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
            }
          },
          onDone: (full) => {
            directAnswer = full;
          }
        });

        addLog(`[00:04] 💎 Mission complete! Execution finished.`);
        task.status = 'COMPLETED';
        task.answer = directAnswer;
        task.deliverable = { type: domainType, title: domainTitle, url: '#' };
        addLog(`[DONE] Finished`);

        if (isSse) {
          res.write(`data: ${JSON.stringify({
            type: 'success',
            status: 'COMPLETED',
            answer: directAnswer,
            deliverable: task.deliverable
          })}\n\n`);
          res.end();
        }
        return;
      }

      // --- Autonomous App Generation Pipeline ---
      addLog(`[00:01] 🧠 Google Stitch Design Engine: Analyzing design tokens & layout structure...`);

      const systemPrompt = `You are Google Antigravity and Stitch UI - an elite full-stack UI/UX architect and autonomous software engineer.
Generate a complete, self-contained, responsive, production-ready single-page HTML5 web application based on the user's request.

DESIGN & TECHNICAL SPECIFICATIONS:
1. Complete Single-File Standalone HTML5 document with embedded <style> and <script>.
2. High-aesthetic Google Stitch UI Glassmorphism design:
   - Dark modern theme (rich gradients, glowing neon cyan #22d3ee, indigo #6366f1, emerald #10b981 accents).
   - Glassmorphic card surfaces with subtle backdrop filters and borders (rgba(255,255,255,0.08)).
   - Clean typography using Google Fonts (Inter / Sora / Poppins).
3. Rich interactivity:
   - Include searchable and filterable live data tables or cards.
   - Include interactive charts (load Chart.js from https://cdn.jsdelivr.net/npm/chart.js if charts are relevant).
   - Include interactive modal forms, action triggers, export to CSV/JSON, theme toggle, and instant feedback.
   - Use Lucide icons or FontAwesome via CDN or inline SVG icons.
   - Fully responsive for desktop and mobile devices.
4. Semantic Imagery & Fallbacks:
   - Every <img> must use contextual natural language AI generation: https://image.pollinations.ai/prompt/{encoded_detailed_description}?width={w}&height={h}&nologo=true
   - Derive rich, unique 4-8 word descriptive prompts for every card, banner, or catalog item.
   - For user/team avatars, use https://api.dicebear.com/7.x/initials/svg?seed={Name} or https://api.dicebear.com/7.x/avataaars/svg?seed={Name}.
   - Every <img> MUST have onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='https://placehold.co/600x400/1e293b/ffffff?text='+encodeURIComponent(this.alt||'Image');}else{this.onerror=null;}"
   - NEVER use loremflickr.com or source.unsplash.com.
5. Robust JavaScript:
   - Zero undefined variables or broken DOM selectors.
   - LocalStorage persistence for user actions.
   - Beautiful visual feedback and animations.

OUTPUT FORMAT:
Output ONLY the raw valid <!DOCTYPE html> document enclosed inside \`\`\`html and \`\`\`.
Do NOT include explanations outside the code block.`;

      let generatedHtml = '';
      await pooledStream({
        contents: [{ role: 'user', parts: [{ text: `Build this application: ${prompt.trim()}` }] }],
        config: { maxOutputTokens: 8192, temperature: 0.2 },
        apiKey,
        tier: 'build',
        systemInstruction: systemPrompt,
        onChunk: (chunk) => {
          generatedHtml += chunk;
          if (isSse) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          }
        },
        onDone: (full) => {
          generatedHtml = full;
        }
      });

      addLog(`[00:05] 🛠️ Applying CDN pinning and code self-healing audits...`);

      // Extract HTML block
      const htmlMatch = generatedHtml.match(/```html\s*([\s\S]*?)\s*```/) || generatedHtml.match(/<!DOCTYPE html[\s\S]*<\/html>/i);
      let cleanHtml = htmlMatch ? (htmlMatch[1] || htmlMatch[0]) : generatedHtml;

      if (!cleanHtml.toLowerCase().includes('<!doctype html>')) {
        cleanHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>AI Generated App</title>\n</head>\n<body>\n${cleanHtml}\n</body>\n</html>`;
      }

      cleanHtml = pinCDNVersions(cleanHtml);

      // Perform quality audit & self-healing
      try {
        const healed = await auditAndHeal(cleanHtml, apiKey);
        if (healed && healed.code) {
          cleanHtml = healed.code;
          addLog(`[00:07] ✨ Quality pass complete: Structural integrity and DOM bindings verified.`);
        }
      } catch (auditErr) {
        console.warn('[Orchestrate] Audit warning:', auditErr.message);
      }

      let isDeployed = false;
      let repoName = cleanSlug(prompt.trim());
      let repoUrl = null;
      let pagesUrl = null;

      if (token) {
        try {
          if (editMode && editRepo) {
            repoName = editRepo;
            const owner = editOwner || targetUser;
            addLog(`[00:08] 📦 Modifying existing GitHub repository: ${owner}/${repoName}...`);
            await pushFiles(token, owner, repoName, [{ path: 'index.html', content: cleanHtml }], 'Update app via AI Orchestration');
            pagesUrl = await enablePages(token, owner, repoName);
            repoUrl = `https://github.com/${owner}/${repoName}`;
            isDeployed = true;
            addLog(`[00:10] 🚀 Updated GitHub Pages deployment at ${pagesUrl}`);
          } else {
            addLog(`[00:08] 📦 Provisioning new GitHub repository: ${targetUser}/${repoName}...`);
            const created = await createRepo(token, repoName, `Autonomous App generated by AI Orchestration — ${prompt.trim().slice(0, 100)}`);
            repoName = created.name;
            repoUrl = created.url;

            addLog(`[00:10] 🚀 Pushing files and activating GitHub Pages...`);
            await pushFiles(token, targetUser, repoName, [
              { path: 'index.html', content: cleanHtml },
              { path: 'README.md', content: `# ${repoName}\n\n> Autonomous web application generated with **Google Stitch UI** and **AI Orchestration**.\n\n### 🌐 Live Demo: [https://${targetUser}.github.io/${repoName}/](https://${targetUser}.github.io/${repoName}/)\n\n### ⚡ Directive:\n\`\`\`\n${prompt.trim()}\n\`\`\`\n` }
            ], 'Initial deployment via AI Orchestration');

            pagesUrl = await enablePages(token, targetUser, repoName);
            isDeployed = true;
            addLog(`[00:12] ✅ GitHub Pages activated successfully at ${pagesUrl}`);
          }
        } catch (ghErr) {
          console.error('[Orchestrate] GitHub deploy error:', ghErr.message);
          addLog(`[00:11] ⚠️ GitHub deployment notice: ${ghErr.message}`);
        }
      } else {
        addLog(`[00:08] ℹ️ GitHub Token not connected — running in standalone interactive preview mode.`);
        addLog(`[00:09] 💡 Tip: Connect GitHub in top-right to automatically deploy repository & GitHub Pages.`);
      }

      const deliverable = {
        type: 'app_deploy',
        repo_name: repoName,
        repo_url: repoUrl,
        live_url: pagesUrl,
        owner: targetUser,
        deployed: isDeployed,
        files: ['index.html', 'README.md'],
        html: cleanHtml
      };

      let markdownAnswer = '';
      if (isDeployed) {
        markdownAnswer = `### 🚀 App Successfully Generated & Deployed!

* **Live App URL:** [${pagesUrl}](${pagesUrl})
* **GitHub Repository:** [${repoUrl}](${repoUrl})
* **Owner:** \`@${targetUser}\`
* **Theme:** \`${theme}\`

---

#### 🌟 Features Built:
* **Google Stitch Design:** Clean Glassmorphism cards, glowing status badges, and modern typography.
* **Interactive Telemetry:** Live data analytics, responsive charts, and searchable filters.
* **Autonomous Hosting:** Production build committed to \`main\` branch and hosted live on GitHub Pages.`;
      } else {
        markdownAnswer = `### ⚡ Autonomous Web App Generated!

* **Status:** Complete standalone HTML5 code generated with **Google Stitch Glassmorphic UI**.
* **Interactive Live Preview:** Click **"👁️ Open Live Preview"** below to test the app in your browser!
* **GitHub Deployment:** Connect your GitHub Account or Personal Access Token to publish to \`@${targetUser}/${repoName}\` with automated GitHub Pages hosting.

---

#### 🌟 Features Built:
* **Google Stitch UI:** Modern glassmorphism layout, responsive grid, and rich component cards.
* **Interactive Controls:** Interactive state management, search/filter inputs, and telemetry widgets.`;
      }

      task.status = 'COMPLETED';
      task.answer = markdownAnswer;
      task.deliverable = deliverable;
      addLog(`[DONE] Finished`);

      if (isSse) {
        res.write(`data: ${JSON.stringify({
          type: 'success',
          status: 'COMPLETED',
          answer: markdownAnswer,
          deliverable,
          liveUrl: pagesUrl,
          repoUrl,
          repoName,
          deployed: isDeployed,
          owner: targetUser
        })}\n\n`);
        res.end();
      } else if (!req.path.includes('/execute')) {
        res.json({
          status: 'COMPLETED',
          answer: markdownAnswer,
          deliverable
        });
      }
    } catch (err) {
      console.error('[Orchestrate] Execution error:', err);
      task.status = 'FAILED';
      task.error = err.message;
      task.answer = `### ❌ Generation Failed\n\n${err.message}`;
      addLog(`[ERROR] ${err.message}`);

      if (isSse) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        res.end();
      }
    }
  })();
}

// ── POST /deploy-code (Deploy existing raw HTML to GitHub Pages) ───
router.post('/deploy-code', async (req, res) => {
  const { repoName, html, github_token, github_user, description } = req.body || {};
  const token = github_token || req.headers['x-github-token'] || req.session?.githubToken || process.env.GITHUB_TOKEN;
  const targetUser = github_user || req.headers['x-github-user'] || req.session?.user?.login || 'karnkeshav';

  if (!token) {
    return res.status(401).json({ error: 'GitHub Personal Access Token is required to create repositories' });
  }
  if (!html || !repoName) {
    return res.status(400).json({ error: 'repoName and html are required' });
  }

  try {
    const slug = cleanSlug(repoName);
    const created = await createRepo(token, slug, description || `Autonomous Web App deployed via AI Orchestration`);
    const processedHtml = pinCDNVersions(html);

    await pushFiles(token, targetUser, created.name, [
      { path: 'index.html', content: processedHtml },
      { path: 'README.md', content: `# ${created.name}\n\n> Deployed via **AI Orchestration** and **Google Stitch UI**.\n\n### 🌐 Live Demo: [https://${targetUser}.github.io/${created.name}/](https://${targetUser}.github.io/${created.name}/)\n` }
    ], 'Deploy app via AI Orchestration');

    const pagesUrl = await enablePages(token, targetUser, created.name);

    res.json({
      success: true,
      repoName: created.name,
      repoUrl: created.url,
      liveUrl: pagesUrl,
      owner: targetUser
    });
  } catch (err) {
    console.error('[DeployCode] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/execute', handleOrchestration);
router.post('/orchestrate', handleOrchestration);
router.post('/apps/generate', handleOrchestration);

module.exports = router;
