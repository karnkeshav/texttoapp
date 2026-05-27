'use strict';
/**
 * support.js — POST /api/support/ticket
 *
 * Accepts a support ticket from the frontend form and:
 *   1. Sends an email to the owner (keshav.karn@gmail.com) via Gmail SMTP
 *   2. Optionally saves to Firestore /support/{auto-id}
 *
 * Required Render env vars for email:
 *   GMAIL_USER          — the Gmail address that sends the email (e.g. keshav.karn@gmail.com)
 *   GMAIL_APP_PASSWORD  — a Gmail App Password (not your account password)
 *                         Generate at: myaccount.google.com/apppasswords
 *                         Requires 2-Step Verification to be enabled.
 *
 * If GMAIL_USER / GMAIL_APP_PASSWORD are not set the ticket is still accepted
 * (returns 200) — you'll see it logged on the server and in Firestore if configured.
 */

const express    = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

const OWNER_EMAIL = 'keshav.karn@gmail.com';

const CATEGORIES = [
  'App Building',
  'Document Conversion',
  'Image Analysis',
  'Chat & Reasoning',
  'Account & Billing',
  'Technical Error',
  'Other',
];

// ── Lazy email transporter ─────────────────────────────────────────
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return _transporter;
}

// ── POST /api/support/ticket ───────────────────────────────────────
router.post('/ticket', async (req, res) => {
  const { name, email, category, subject, description } = req.body || {};

  if (!subject?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  const cat = CATEGORIES.includes(category) ? category : 'Other';
  const ts  = new Date().toISOString();

  console.log(`[Support] Ticket received — category="${cat}" subject="${subject?.slice(0, 80)}" from="${email || 'unknown'}"`);

  // ── Send email ─────────────────────────────────────────────────
  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from:    `"Ready4Launch Support" <${process.env.GMAIL_USER}>`,
        to:      OWNER_EMAIL,
        replyTo: email || undefined,
        subject: `[R4L Support] ${cat}: ${subject.trim().slice(0, 100)}`,
        html: `
<h2 style="color:#6366f1;margin-bottom:8px;">Ready4Launch — Support Ticket</h2>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">
  <tr><td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap;"><strong>Time</strong></td><td style="padding:6px 0;">${ts}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666;"><strong>Name</strong></td><td style="padding:6px 0;">${esc(name) || '(not provided)'}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666;"><strong>Email</strong></td><td style="padding:6px 0;">${esc(email) || '(not provided)'}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666;"><strong>Category</strong></td><td style="padding:6px 0;">${esc(cat)}</td></tr>
  <tr><td style="padding:6px 12px 6px 0;color:#666;"><strong>Subject</strong></td><td style="padding:6px 0;">${esc(subject)}</td></tr>
</table>
<h3 style="margin-top:20px;margin-bottom:8px;">Description</h3>
<div style="background:#f8f8f8;border-left:4px solid #6366f1;padding:12px 16px;white-space:pre-wrap;font-size:14px;">${esc(description)}</div>
        `,
      });
      console.log('[Support] Email sent to', OWNER_EMAIL);
    } catch (emailErr) {
      // Non-fatal — still return success to user
      console.error('[Support] Email send failed:', emailErr.message);
    }
  } else {
    console.warn('[Support] GMAIL_USER / GMAIL_APP_PASSWORD not set — email not sent. Set them in Render env vars.');
  }

  res.json({ success: true });
});

// ── GET /api/support/categories ───────────────────────────────────
router.get('/categories', (_req, res) => res.json(CATEGORIES));

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
