'use strict';
/**
 * cloudflareService.js
 *
 * Deploys static files to Cloudflare Pages via the Direct Upload API (v2).
 * Each call creates (or reuses) a project, uploads all files content-addressed,
 * and creates a new deployment.
 *
 * Required env vars:
 *   CLOUDFLARE_ACCOUNT_ID  — found in the Cloudflare dashboard → right sidebar
 *   CLOUDFLARE_API_TOKEN   — create at dash.cloudflare.com/profile/api-tokens
 *                            with "Cloudflare Pages: Edit" permission
 */

const axios    = require('axios');
const FormData = require('form-data');
const crypto   = require('crypto');

const CF_API = 'https://api.cloudflare.com/client/v4';

// ── Helpers ───────────────────────────────────────────────────────

function sanitizeName(raw) {
  return (raw || 'r4l-site')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'r4l-site';
}

function sha256hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function guessMime(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css'))  return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js'))   return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.svg'))  return 'image/svg+xml';
  if (filePath.endsWith('.png'))  return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.ico'))  return 'image/x-icon';
  return 'application/octet-stream';
}

function cfHeaders(extra = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  return { Authorization: `Bearer ${token}`, ...extra };
}

function accountPath(subPath) {
  const id = process.env.CLOUDFLARE_ACCOUNT_ID;
  return `${CF_API}/accounts/${id}${subPath}`;
}

// ── Core functions ────────────────────────────────────────────────

/**
 * Creates the Pages project if it doesn't exist yet.
 * Returns the project name (may differ if name was taken).
 */
async function ensureProject(projectName) {
  const url = accountPath('/pages/projects');
  try {
    await axios.post(
      url,
      { name: projectName, production_branch: 'main' },
      { headers: cfHeaders({ 'Content-Type': 'application/json' }) }
    );
    console.log(`[CF] Created project: ${projectName}`);
  } catch (err) {
    const status = err.response?.status;
    // 400 / 409 = project already exists — that's fine, continue
    if (status !== 400 && status !== 409) {
      const detail = JSON.stringify(err.response?.data || err.message);
      throw new Error(`Cloudflare project creation failed (${status}): ${detail}`);
    }
  }
  return projectName;
}

/**
 * Deploy an array of { path, content } objects to Cloudflare Pages.
 *
 * @param {Array<{path: string, content: string|Buffer}>} files
 * @param {string} [projectNameHint]  - preferred project name (sanitised internally)
 * @returns {{ url: string, projectName: string, deploymentId: string }}
 */
async function deployToCloudflare(files, projectNameHint) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error(
      'Cloudflare is not configured. Add CLOUDFLARE_ACCOUNT_ID and ' +
      'CLOUDFLARE_API_TOKEN to the server environment variables.'
    );
  }

  const projectName = sanitizeName(projectNameHint || `r4l-${Date.now().toString(36)}`);
  await ensureProject(projectName);

  // Build content-addressed manifest
  // CF Pages v2: manifest maps "/path" → sha256hex; each file part is named by its hash
  const manifest  = {};
  const hashToFile = new Map(); // deduplicate identical files

  for (const file of files) {
    const buf  = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, 'utf8');
    const hash = sha256hex(buf);
    const fp   = file.path.startsWith('/') ? file.path : `/${file.path}`;
    manifest[fp] = hash;
    if (!hashToFile.has(hash)) {
      hashToFile.set(hash, { buf, path: file.path });
    }
  }

  // Build multipart form
  const form = new FormData();
  form.append('manifest', JSON.stringify(manifest), {
    contentType: 'application/json',
    filename:    'manifest.json',
  });
  for (const [hash, { buf, path: fp }] of hashToFile) {
    form.append(hash, buf, {
      filename:    hash,      // CF expects hash as filename
      contentType: guessMime(fp),
    });
  }

  const deployUrl = accountPath(`/pages/projects/${projectName}/deployments`);
  const res = await axios.post(deployUrl, form, {
    headers: cfHeaders(form.getHeaders()),
    maxContentLength: Infinity,
    maxBodyLength:    Infinity,
  });

  const deployment = res.data?.result || {};
  const liveUrl    = deployment.url || `https://${projectName}.pages.dev`;

  console.log(`[CF] Deployed → ${liveUrl}  (deployId: ${deployment.id})`);
  return {
    url:          liveUrl,
    projectName,
    deploymentId: deployment.id || null,
  };
}

module.exports = { deployToCloudflare };
