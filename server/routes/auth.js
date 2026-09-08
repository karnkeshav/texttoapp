'use strict';
const express = require('express');
const axios   = require('axios');
const { getUser } = require('../services/githubService');
const { upsertUser, linkGitHub } = require('../services/firestoreService');

const router = express.Router();

// ── Helper ────────────────────────────────────────────────────────
function isAuthenticated(req) {
  return !!(req.session?.googleUser || req.session?.githubToken || req.headers['x-github-token']);
}

function sendAuthResponse(res, success, errCode = null, authPayload = null) {
  const targetUrl = success ? '/app' : `/?error=${errCode || 'auth_failed'}`;
  const title = success ? 'Signed In — Ready4Launch' : 'Authentication Issue';
  const heading = success ? '⚡ Welcome to Ready4Launch' : '⚠️ Authentication Issue';
  const subtitle = success ? 'Redirecting to your workspace...' : `Sign in was not completed (${errCode || 'error'}). Closing...`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      padding: 2.25rem 2rem;
      text-align: center;
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 700; color: #fff; }
    p { margin: 0; font-size: 0.9rem; color: #94a3b8; line-height: 1.5; }
    .spinner {
      margin: 1.25rem auto 0;
      width: 28px;
      height: 28px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <h2>${heading}</h2>
    <p>${subtitle}</p>
    <div class="spinner"></div>
  </div>
  <script>
    (function() {
      const targetUrl = ${JSON.stringify(targetUrl)};
      const success = ${JSON.stringify(success)};
      const payload = ${JSON.stringify(authPayload || {})};

      // 1. Save locally in popup storage
      try {
        if (payload.githubToken) localStorage.setItem('r4l_gh_token', payload.githubToken);
        if (payload.user) localStorage.setItem('r4l_user', JSON.stringify(payload.user));
        localStorage.setItem('r4l_auth_payload', JSON.stringify(payload));
        localStorage.setItem('r4l_auth_event', JSON.stringify({ time: Date.now(), success: success, payload: payload, target: targetUrl }));
      } catch (e) {}

      // 2. BroadcastChannel to any other frame / tab
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('r4l_auth_channel');
          bc.postMessage({ type: 'AUTH_COMPLETE', success: success, payload: payload, target: targetUrl });
          bc.close();
        }
      } catch (e) {}

      // 3. postMessage to window.opener
      try {
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: 'AUTH_COMPLETE', success: success, payload: payload, target: targetUrl }, '*');
          } catch (e) {}
          try {
            if (typeof window.opener.handleAuthSync === 'function') {
              window.opener.handleAuthSync(payload);
            } else if (typeof window.opener.loadUser === 'function') {
              window.opener.loadUser();
            }
          } catch (e) {}
          setTimeout(function() { window.close(); }, 600);
          return;
        }
      } catch (e) {}

      // 4. Standalone fallback (no opener / direct navigation)
      setTimeout(function() {
        window.location.href = targetUrl;
      }, 600);
    })();
  </script>
</body>
</html>`;

  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
}

// ══════════════════════════════════════════════════════════════════
// GOOGLE OAUTH  (primary — creates the secure workspace)
// ══════════════════════════════════════════════════════════════════

router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope:        'openid email profile',
    access_type:  'online',
    state:        Math.random().toString(36).slice(2),
    prompt:       'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return sendAuthResponse(res, false, 'google_cancelled');

  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
      grant_type:    'authorization_code',
    });

    const { access_token } = tokenRes.data;
    if (!access_token) return sendAuthResponse(res, false, 'google_token_failed');

    const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { sub: uid, email, name, picture } = profileRes.data;

    if (!uid || !email) return sendAuthResponse(res, false, 'google_profile_failed');

    // Persist to Firestore (non-blocking)
    upsertUser({ uid, email, name, picture, provider: 'google' }).catch(() => {});

    req.session.googleUser = { uid, email, name, picture };
    req.session.user = {
      login:    email,
      name:     name || email,
      avatarUrl: picture || null,
      provider: 'google',
      uid,
    };

    console.log(`[Auth] Google login: ${email}`);
    return sendAuthResponse(res, true, null, {
      googleUser: req.session.googleUser,
      user: req.session.user,
    });
  } catch (err) {
    console.error('[Auth] Google callback error:', err.message);
    return sendAuthResponse(res, false, 'google_oauth_error');
  }
});

// ══════════════════════════════════════════════════════════════════
// GITHUB OAUTH  (secondary — needed for Deploy to GitHub Pages)
// ══════════════════════════════════════════════════════════════════

router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope:        'repo user',
    state:        Math.random().toString(36).slice(2),
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return sendAuthResponse(res, false, 'no_code');

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error } = tokenRes.data;
    if (error || !access_token) {
      console.error('[Auth] GitHub token error:', tokenRes.data);
      return sendAuthResponse(res, false, error || 'oauth_failed');
    }

    req.session.githubToken = access_token;
    const githubUser = await getUser(access_token);
    req.session.githubUser = githubUser;

    if (req.session.googleUser) {
      // Already signed in with Google — this is "Connect GitHub"
      req.session.user = { ...req.session.user, githubLogin: githubUser.login };
      if (req.session.googleUser.uid) {
        linkGitHub(req.session.googleUser.uid, githubUser.login).catch(() => {});
      }
    } else {
      // GitHub-only login
      req.session.user = {
        login:       githubUser.login,
        name:        githubUser.name || githubUser.login,
        avatarUrl:   githubUser.avatarUrl || null,
        provider:    'github',
        githubLogin: githubUser.login,
      };
      upsertUser({
        uid:        `gh_${githubUser.login}`,
        email:      githubUser.email || `${githubUser.login}@github`,
        name:       githubUser.name || githubUser.login,
        picture:    githubUser.avatarUrl || null,
        provider:   'github',
        githubLogin: githubUser.login,
      }).catch(() => {});
    }

    console.log(`[Auth] GitHub connected: ${githubUser.login}`);
    return sendAuthResponse(res, true, null, {
      githubToken: access_token,
      githubUser: githubUser,
      user: req.session.user,
    });
  } catch (err) {
    console.error('[Auth] GitHub callback error:', err.message);
    return sendAuthResponse(res, false, 'oauth_error');
  }
});

// ══════════════════════════════════════════════════════════════════
// SHARED
// ══════════════════════════════════════════════════════════════════

router.post('/sync-session', (req, res) => {
  const { githubToken, user, googleUser } = req.body || {};
  if (githubToken) {
    req.session.githubToken = githubToken;
  }
  if (googleUser) {
    req.session.googleUser = googleUser;
  }
  if (user) {
    req.session.user = {
      ...(req.session.user || {}),
      ...user,
      githubLogin: user.githubLogin || user.login || req.session?.user?.githubLogin,
    };
  }
  req.session.save((err) => {
    if (err) console.warn('[Auth] sync-session save error:', err.message);
    res.json({
      ok: true,
      authenticated: true,
      user: req.session.user,
      hasGitHub: !!(req.session?.githubToken || req.headers['x-github-token']),
      hasGoogle: !!req.session?.googleUser,
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/status', (req, res) => {
  const token = req.headers['x-github-token'] || req.session?.githubToken;
  const hasGitHub = !!token;
  const hasGoogle = !!req.session?.googleUser;

  if (!isAuthenticated(req) && !token) {
    return res.json({ authenticated: false });
  }

  const user = req.session?.user || {};
  res.json({
    authenticated: true,
    user,
    hasGoogle,
    hasGitHub,
  });
});

// ── Test-only bypass ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'test') {
  router.get('/test-login', (req, res) => {
    req.session.githubToken = 'test-token';
    req.session.user = { login: 'testuser', name: 'Test User', avatarUrl: null, provider: 'github' };
    res.json({ ok: true, user: 'testuser' });
  });
}

module.exports = router;
