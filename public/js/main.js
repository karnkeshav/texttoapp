/* ── Landing page JS ───────────────────────────────────────────── */

// ── Particle canvas ──────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#7c3aed', '#3b82f6', '#06b6d4', '#a78bfa'];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Demo typing animation ────────────────────────────────────────
(function initDemoTyping() {
  const cursor = document.getElementById('typingCursor');
  const aiMsg  = document.getElementById('demoAiMsg');
  const aiBubble = document.getElementById('demoAiBubble');
  if (!cursor) return;

  // Each entry: [user prompt, AI reply, delay before showing AI reply]
  const demos = [
    {
      user: 'Build me a photographer portfolio with gallery, contact form, dark theme.',
      ai:   'Perfect! A few quick questions:\n1. Gallery style — masonry grid or clean 3-column?\n2. Portraits, landscapes, or events?\n3. Want a "Book a session" button?\n\nI\'ll build and deploy it to GitHub Pages automatically! 🚀',
    },
    {
      user: 'Generate a cyberpunk cityscape at sunset, neon lights, ultra-detailed.',
      ai:   'Generating with Google Imagen 3... ✨\n\nHere\'s your image! You can refine it — try "make it more vibrant" or "change to oil painting style".',
    },
    {
      user: 'Convert this quarterly report to Word, Excel and a PowerPoint deck.',
      ai:   'I\'ll create all three formats for you! The Excel version will have regional data in separate sheets, and the PPT will have one slide per section.\n\n📝 Word · 📊 Excel · 📑 PowerPoint — download buttons below.',
    },
    {
      user: 'What\'s the compound interest on $10,000 at 7% for 20 years?',
      ai:   'After 20 years:\n• Final value: $38,696.84\n• Interest earned: $28,696.84\n• Effective multiplier: 3.87×\n\nYear 10 checkpoint: $19,671.51 (nearly doubled!) 📈',
    },
  ];

  let demoIdx = 0;
  let charIdx  = 0;
  let phase    = 'user'; // 'user' | 'wait' | 'ai' | 'pause'
  let currentText = '';

  function typeNext() {
    const demo = demos[demoIdx];

    if (phase === 'user') {
      const target = demo.user;
      if (charIdx < target.length) {
        currentText += target[charIdx++];
        cursor.textContent = currentText;
        setTimeout(typeNext, 22);
      } else {
        phase = 'wait';
        charIdx = 0;
        currentText = '';
        setTimeout(typeNext, 700);
      }

    } else if (phase === 'wait') {
      if (aiMsg) aiMsg.style.display = '';
      if (aiBubble) aiBubble.textContent = '';
      phase = 'ai';
      setTimeout(typeNext, 100);

    } else if (phase === 'ai') {
      const target = demo.ai;
      if (charIdx < target.length) {
        currentText += target[charIdx++];
        if (aiBubble) aiBubble.textContent = currentText;
        setTimeout(typeNext, 16);
      } else {
        phase = 'pause';
        setTimeout(typeNext, 3800);
      }

    } else if (phase === 'pause') {
      // Reset for next demo
      demoIdx = (demoIdx + 1) % demos.length;
      charIdx  = 0;
      currentText = '';
      phase = 'user';
      cursor.textContent = '';
      if (aiMsg) aiMsg.style.display = 'none';
      if (aiBubble) aiBubble.textContent = '';
      setTimeout(typeNext, 500);
    }
  }

  setTimeout(typeNext, 1400);
})();

// ── Nav scroll effect ────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  nav.style.background = window.scrollY > 20
    ? 'rgba(8,9,14,0.95)'
    : 'rgba(8,9,14,0.8)';
});

// ── Mobile nav ───────────────────────────────────────────────────
function toggleMobileMenu() {
  const actions = document.querySelector('.nav-actions');
  if (!actions) return;
  const isOpen = actions.style.display === 'flex';
  actions.style.cssText = isOpen
    ? ''
    : 'display:flex;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:rgba(8,9,14,0.98);padding:20px;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08);z-index:99;';
}

// ── Setup accordion ──────────────────────────────────────────────
function toggleStep(n) {
  const step = document.querySelector(`.setup-step[data-step="${n}"]`);
  if (!step) return;
  const isOpen = step.classList.contains('open');
  document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('open'));
  if (!isOpen) step.classList.add('open');
}

// Open first step by default
window.addEventListener('DOMContentLoaded', () => {
  toggleStep(1);
  checkAuthStatus();
});

// ── Tab switching in setup ───────────────────────────────────────
function switchTab(btn, tabId) {
  const parent = btn.closest('.setup-step-body');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ── Checklist ────────────────────────────────────────────────────
function updateChecklist() {
  const checkboxes = document.querySelectorAll('.check-item input[type="checkbox"]');
  const allChecked = Array.from(checkboxes).every(c => c.checked);
  const readySection = document.getElementById('readySection');
  if (readySection) readySection.style.display = allChecked ? 'block' : 'none';
}

// ── Auth status ──────────────────────────────────────────────────
async function checkAuthStatus() {
  try {
    const res = await fetch('/auth/status');
    const data = await res.json();
    if (data.authenticated) {
      // Update ALL sign-in buttons on the page to "Go to app"
      document.querySelectorAll('a[href="/auth/github"]').forEach(btn => {
        btn.href = '/app';
        btn.textContent = '';
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          Open Ready4Launch →`;
        btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      });
    }
  } catch (_) {}
}

// ── Start building ───────────────────────────────────────────────
function startBuilding() {
  window.location.href = '/auth/github';
}

// ── Intersection observer for entrance animations ─────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.step-card, .cap-card, .feature-card, .setup-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
