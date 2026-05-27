'use strict';
const express = require('express');
const axios   = require('axios');
const { getUser } = require('../services/githubService');

const router = express.Router();

// ══════════════════════════════════════════════════════════════════
// GITHUB OAUTH  (the only auth method — needed for Build + deploy)
// ══════════════════════════════════════════════════════════════════

// Step 1 — redirect to GitHub
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope:        'repo user',
    state:        Math.random().toString(36).slice(2),
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2 — GitHub redirects back here
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');

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
    if (error || !access_token) return res.redirect('/?error=oauth_failed');

    const githubUser = await getUser(access_token);

    req.session.githubToken = access_token;
    req.session.githubUser  = githubUser;
    req.session.user = {
      login:    githubUser.login,
      name:     githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatarUrl || null,
      provider: 'github',
    };

    console.log(`[Auth] GitHub login: ${githubUser.login}`);
    res.redirect('/app');
  } catch (err) {
    console.error('[Auth] GitHub callback error:', err.message);
    res.redirect('/?error=oauth_error');
  }
});

// ── Shared ────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/status', (req, res) => {
  const hasGitHub = !!req.session.githubToken;
  if (!hasGitHub) {
    return res.json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user:      req.session.user,
    hasGitHub: true,
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
