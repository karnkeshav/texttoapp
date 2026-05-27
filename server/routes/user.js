'use strict';
/**
 * user.js — member profile + package purchase
 *
 * Routes:
 *   GET  /api/user/profile   — full profile (package, usage, history)
 *   POST /api/user/package   — activate a package (mock purchase for now)
 */

const express = require('express');
const { getUserProfile, setPackage, PACKAGES } = require('../services/firestoreService');
const { uidFromSession } = require('../middleware/packageGate');

const router = express.Router();

function requireAnyAuth(req, res, next) {
  const uid = uidFromSession(req.session);
  if (!uid) return res.status(401).json({ error: 'Sign in required' });
  req.uid = uid;
  next();
}

// ── GET /api/user/profile ──────────────────────────────────────────
router.get('/profile', requireAnyAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.uid);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error('[User] profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/user/packages ─────────────────────────────────────────
// Returns the package catalogue so the frontend can render pricing cards.
router.get('/packages', (req, res) => {
  const catalogue = [
    {
      id:          'demo',
      name:        'Demo',
      tagline:     'Try it free for 5 days',
      price:       'Free',
      priceSub:    '5-day trial',
      features:    [
        '2 builds per day',
        '2 chat sessions per day',
        '2 document conversions per day',
        '2 image analyses per day',
        'Instant publish (Cloudflare)',
        'GitHub Pages deploy',
      ],
      highlight:   false,
      cta:         'Start Free Trial',
    },
    {
      id:          'starter',
      name:        'Starter',
      tagline:     'For individuals & students',
      price:       '$19',
      priceSub:    'per month',
      features:    [
        '20 builds per day',
        '20 chat sessions per day',
        '20 document conversions per day',
        '20 image analyses per day',
        'Instant publish (Cloudflare)',
        'GitHub Pages deploy',
        'Activity history',
      ],
      highlight:   true,
      cta:         'Get Starter',
    },
    {
      id:          'pro',
      name:        'Pro',
      tagline:     'For teams & power users',
      price:       '$49',
      priceSub:    'per month',
      features:    [
        'Unlimited builds',
        'Unlimited chat',
        'Unlimited conversions',
        'Unlimited image analyses',
        'Instant publish (Cloudflare)',
        'GitHub Pages deploy',
        'Full activity history',
        'Priority AI access',
      ],
      highlight:   false,
      cta:         'Get Pro',
    },
  ];
  res.json(catalogue);
});

// ── POST /api/user/package ─────────────────────────────────────────
// In production this would validate a payment receipt first.
// For now it immediately activates the chosen package.
router.post('/package', requireAnyAuth, async (req, res) => {
  const { packageType } = req.body;

  if (!PACKAGES[packageType]) {
    return res.status(400).json({ error: `Unknown package: ${packageType}` });
  }

  try {
    await setPackage(req.uid, packageType);

    const pkg      = PACKAGES[packageType];
    const expiry   = new Date();
    expiry.setDate(expiry.getDate() + pkg.daysValid);

    res.json({
      success:     true,
      package:     packageType,
      packageName: pkg.name,
      expiresAt:   expiry.toISOString(),
      message:     `${pkg.name} activated! ${pkg.daysValid}-day access starts now.`,
    });
  } catch (err) {
    console.error('[User] setPackage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
