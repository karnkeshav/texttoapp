'use strict';
/**
 * cloudflare.js  — POST /api/cloudflare/deploy
 *
 * Receives built files from the frontend and deploys them
 * to Cloudflare Pages via the Direct Upload API.
 *
 * No authentication required — we use Ready4Launch's own
 * Cloudflare credentials (env vars) for every deployment.
 *
 * Body: { files: [{path, content}], projectName?: string }
 */

const express = require('express');
const { deployToCloudflare } = require('../services/cloudflareService');
const { auditAndHeal }       = require('../services/codeQuality');

const router = express.Router();

router.post('/cloudflare/deploy', async (req, res) => {
  const { files, projectName } = req.body || {};

  if (!Array.isArray(files) || !files.length) {
    return res.status(400).json({ error: 'files array is required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model  = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    // ── 1. Audit + auto-heal HTML files ──────────────────────────
    let auditFailure = null;
    const auditedFiles = await Promise.all(files.map(async (file) => {
      if (!file.path.endsWith('.html')) return file;
      try {
        const { code, healed, attempts } = await auditAndHeal(file.content, apiKey, model);
        if (healed) console.log(`[CF Audit] Healed ${file.path} in ${attempts} attempt(s)`);
        return { ...file, content: code };
      } catch (auditErr) {
        if (auditErr.code === 'CODE_AUDIT_FAILED') {
          auditFailure = auditErr;
          return file;
        }
        throw auditErr;
      }
    }));

    if (auditFailure) {
      return res.status(422).json({
        error:   'code_audit_failed',
        message: 'The generated code has structural issues that could not be auto-repaired.',
        issues:  auditFailure.issues,
      });
    }

    // ── 2. Deploy to Cloudflare Pages ────────────────────────────
    const result = await deployToCloudflare(auditedFiles, projectName);

    res.json({
      success:      true,
      url:          result.url,
      projectName:  result.projectName,
      deploymentId: result.deploymentId,
    });
  } catch (err) {
    console.error('[Cloudflare deploy route]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
