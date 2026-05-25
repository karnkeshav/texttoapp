/* ── AppBuilder chat interface ──────────────────────────────────── */

let isStreaming = false;
let isNewConversation = true;
const pendingFiles = new Map(); // fileId → { repoName, files }
let fileIdCounter = 0;

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  autoResize(document.getElementById('chatInput'));
});

// ── User profile ─────────────────────────────────────────────────
async function loadUser() {
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    if (!data.authenticated) { window.location.href = '/'; return; }
    const { login, name, avatarUrl } = data.user;

    const avatarEl = document.getElementById('userAvatar');
    if (avatarUrl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${login}" />`;
    } else {
      avatarEl.textContent = (name || login)[0].toUpperCase();
    }
    document.getElementById('userName').textContent = name || `@${login}`;
  } catch {
    window.location.href = '/';
  }
}


// ── New conversation ─────────────────────────────────────────────
function startNewConversation() {
  // Reset AG session flag so the next message gets a fresh session_id on the server
  isNewConversation = true;

  // Clear the chat UI
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';

  // Re-inject welcome screen
  container.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <div class="welcome-icon">⚡</div>
      <h2 class="welcome-title">What do you want to build?</h2>
      <p class="welcome-sub">
        Describe any app or website in plain English. AppBuilder will ask you a few questions,
        then create your complete, live website — completely free.
      </p>
    </div>`;

  document.getElementById('chatInput').placeholder =
    'Describe the app you want to build…';

  closeSidebar();
  setStatus('Ready', false);
}

// ── Sidebar (mobile) ─────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Textarea auto-resize ─────────────────────────────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function handleInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Sending a message ─────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isStreaming) return;

  // Clear welcome screen on first message
  hideWelcome();

  // Show user message
  appendMessage('user', text);
  input.value = '';
  autoResize(input);

  // Disable input while streaming
  setStreaming(true);

  // Placeholder AI bubble with typing indicator
  const aiMsgId = appendMessage('ai', null);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        newConversation: isNewConversation,
      }),
    });

    isNewConversation = false;

    if (!res.ok) throw new Error('Server error');

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let aiText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event.type === 'chunk') {
            aiText += event.text;
            updateAIBubble(aiMsgId, aiText);
          } else if (event.type === 'status') {
            setStatus(event.message, true);
          } else if (event.type === 'done') {
            aiText = event.text;
            updateAIBubble(aiMsgId, aiText);
            checkForCode(aiText);
          } else if (event.type === 'error') {
            updateAIBubble(aiMsgId, `⚠️ ${event.message}`);
          }
        } catch (_) {}
      }
    }
  } catch (err) {
    updateAIBubble(aiMsgId, '⚠️ Something went wrong. Please try again.');
    console.error(err);
  } finally {
    setStreaming(false);
    setStatus('Ready', false);
    scrollToBottom();
  }
}

// ── UI helpers ────────────────────────────────────────────────────
function hideWelcome() {
  const w = document.getElementById('welcomeScreen');
  if (w) w.remove();
}

let msgCounter = 0;
function appendMessage(role, text) {
  const id = `msg-${++msgCounter}`;
  const container = document.getElementById('chatMessages');
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.id = id;

  if (role === 'user') {
    div.innerHTML = `
      <div class="msg-avatar user">👤</div>
      <div class="msg-body">
        <div class="msg-meta">${now}</div>
        <div class="msg-bubble">${escapeHtml(text)}</div>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="msg-avatar ai">⚡</div>
      <div class="msg-body">
        <div class="msg-meta">AppBuilder · ${now}</div>
        <div class="msg-bubble" id="${id}-bubble">
          ${text === null ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : renderMarkdown(text)}
        </div>
      </div>
    `;
  }

  container.appendChild(div);
  scrollToBottom();
  return id;
}

function updateAIBubble(msgId, text) {
  const bubble = document.getElementById(`${msgId}-bubble`);
  if (!bubble) return;
  bubble.innerHTML = renderMarkdown(text);
  scrollToBottom();
}

function scrollToBottom() {
  const c = document.getElementById('chatMessages');
  c.scrollTop = c.scrollHeight;
}

function setStreaming(active) {
  isStreaming = active;
  document.getElementById('sendBtn').disabled = active;
  document.getElementById('chatInput').disabled = active;
}

function setStatus(text, thinking = false) {
  document.getElementById('statusText').textContent = text;
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot' + (thinking ? ' thinking' : '');
}

// ── Code detection & auto-deploy ─────────────────────────────────
function checkForCode(text) {
  const htmlMatch = text.match(/```html\s*([\s\S]*?)```/i);
  if (!htmlMatch) return;

  // Extract REPO_NAME from the AI response (e.g. "REPO_NAME: portfolio-site")
  const repoMatch = text.match(/REPO_NAME:\s*([a-z0-9][a-z0-9\-]{1,48}[a-z0-9])/i);
  const repoName  = repoMatch
    ? repoMatch[1].toLowerCase()
    : `appbuilder-${Date.now().toString(36)}`;

  const files = [{ path: 'index.html', content: htmlMatch[1].trim() }];
  const cssMatch = text.match(/```css\s*([\s\S]*?)```/i);
  const jsMatch  = text.match(/```(?:javascript|js)\s*([\s\S]*?)```/i);
  if (cssMatch) files.push({ path: 'style.css',  content: cssMatch[1].trim() });
  if (jsMatch)  files.push({ path: 'script.js',  content: jsMatch[1].trim() });

  showDeployPrompt(repoName, files);
}

function showDeployPrompt(repoName, files) {
  const fileId = `fid-${++fileIdCounter}`;
  pendingFiles.set(fileId, { repoName, files });

  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = 'padding:16px 0;max-width:780px;align-self:flex-start;width:100%;';
  div.innerHTML = `
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:14px;padding:24px;">
      <div style="font-size:16px;font-weight:700;margin-bottom:8px;">🚀 Your app is ready to deploy!</div>
      <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
        AppBuilder will create a new public GitHub repository called
        <strong style="color:var(--purple-light);">${repoName}</strong>,
        push your code, and enable GitHub Pages — automatically.
      </p>
      <button data-fileid="${fileId}" onclick="deployToGitHub(this.dataset.fileid, this)"
              style="background:var(--grad-main);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:var(--font);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        Deploy to GitHub Pages
      </button>
    </div>
  `;
  container.appendChild(div);
  scrollToBottom();
}

async function deployToGitHub(fileId, btn) {
  const pending = pendingFiles.get(fileId);
  if (!pending) return;

  btn.disabled = true;
  btn.innerHTML = '<span style="opacity:0.7">Creating repo &amp; deploying…</span>';

  const { repoName, files } = pending;

  try {
    const res  = await fetch('/api/github/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName, files, description: `Built with AppBuilder` }),
    });
    const data = await res.json();
    const card = btn.closest('div[style]');

    if (data.success) {
      card.innerHTML = `
        <div class="push-success">
          <h4>🎉 Your app is live!</h4>
          <p style="font-size:14px;color:var(--text-2);margin-bottom:16px;">
            A new repository was created and GitHub Pages is deploying your site. It'll be live within ~60 seconds.
          </p>
          <p style="margin-bottom:8px;">
            🔗 <strong>Live URL:</strong>
            <a href="${data.pagesUrl}" target="_blank" style="color:var(--purple-light);">${data.pagesUrl}</a>
          </p>
          <p style="margin-bottom:0;">
            📁 <strong>Repository:</strong>
            <a href="${data.repoUrl}" target="_blank" style="color:var(--purple-light);">${data.repoUrl}</a>
          </p>
        </div>
      `;
    } else {
      btn.disabled = false;
      btn.textContent = 'Retry deployment';
      card.querySelector('p').textContent = `Error: ${data.error}`;
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Retry deployment';
  }
  scrollToBottom();
}

// ── Markdown → HTML (lightweight) ─────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = escapeHtml(text);

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Code blocks (must come before inline code)
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Numbered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Bullet lists
  html = html.replace(/((?:^[•\-\*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[•\-\*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Paragraphs (double newlines)
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<(?:h[123]|ul|ol|pre)>)/g, '$1');
  html = html.replace(/(<\/(?:h[123]|ul|ol|pre)>)<\/p>/g, '$1');

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
