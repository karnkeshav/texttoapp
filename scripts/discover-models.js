'use strict';
/**
 * discover-models.js
 * Probes every Gemini model candidate on both SDKs using the key in .env
 * Reports which ones work → used to build the model pool in geminiPool.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleGenAI }     = require('@google/genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('No GEMINI_API_KEY in .env'); process.exit(1); }

// All plausible models to test
const CANDIDATES = [
  // Gemini 2.5 family
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.5-pro',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.5-pro-preview-06-05',
  // Gemini 2.0 family
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp',
  'gemini-2.0-pro-exp',
  // Gemini 1.5 family
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  // Legacy preview names
  'gemini-3.1-flash-lite-preview',
];

const PAD = 44;

// ── New SDK (@google/genai v2) ─────────────────────────────────────
async function testNewSDK(model) {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const r = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: 'Say: ok' }] }],
    config: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } },
  });
  const text = r.text ?? r.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim().slice(0, 20) || '(empty response)';
}

// ── New SDK streaming (@google/genai v2) ──────────────────────────
async function testNewSDKStream(model) {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const stream = await ai.models.generateContentStream({
    model,
    contents: [{ role: 'user', parts: [{ text: 'Say: ok' }] }],
    config: { maxOutputTokens: 10 },
  });
  let out = '';
  for await (const chunk of stream) { out += chunk.text || ''; }
  return out.trim().slice(0, 20) || '(empty stream)';
}

// ── Legacy SDK (@google/generative-ai) ───────────────────────────
async function testLegacySDK(model) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const m = genAI.getGenerativeModel({ model });
  const result = await m.generateContent('Say: ok');
  const text = result.response.text();
  return text.trim().slice(0, 20) || '(empty response)';
}

// ── Legacy SDK streaming ──────────────────────────────────────────
async function testLegacyStream(model) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const m = genAI.getGenerativeModel({ model });
  const result = await m.generateContentStream('Say: ok');
  let out = '';
  for await (const chunk of result.stream) {
    out += chunk.text() || '';
  }
  return out.trim().slice(0, 20) || '(empty stream)';
}

function status(ok, msg) {
  return ok ? `✅ ${msg}` : `❌ ${msg}`;
}

async function probe(model) {
  const row = { model, newSDK: null, newStream: null, legacySDK: null, legacyStream: null };

  // Test all 4 in parallel
  const [nRes, nStr, lRes, lStr] = await Promise.allSettled([
    testNewSDK(model),
    testNewSDKStream(model),
    testLegacySDK(model),
    testLegacyStream(model),
  ]);

  row.newSDK     = nRes.status === 'fulfilled' ? nRes.value    : classify(nRes.reason);
  row.newStream  = nStr.status === 'fulfilled' ? nStr.value    : classify(nStr.reason);
  row.legacySDK  = lRes.status === 'fulfilled' ? lRes.value    : classify(lRes.reason);
  row.legacyStream = lStr.status === 'fulfilled' ? lStr.value  : classify(lStr.reason);

  return row;
}

function classify(err) {
  const msg = err?.message || String(err);
  const code = msg.match(/"code":(\d+)/)?.[1];
  const stat = msg.match(/"status":"([^"]+)"/)?.[1];
  if (code === '429') return `QUOTA_429`;
  if (code === '404') return `NOT_FOUND_404`;
  if (code === '403') return `FORBIDDEN_403`;
  if (msg.includes('limit: 0')) return `LIMIT_ZERO`;
  return `ERR_${code || stat || msg.slice(0, 20)}`;
}

(async () => {
  console.log('\n' + '═'.repeat(110));
  console.log('  GEMINI MODEL DISCOVERY — both SDKs, same API key');
  console.log('═'.repeat(110));
  console.log(
    `  ${'MODEL'.padEnd(PAD)} ${'NEW-SDK'.padEnd(22)} ${'NEW-STREAM'.padEnd(22)} ${'LEGACY-SDK'.padEnd(22)} LEGACY-STREAM`
  );
  console.log('─'.repeat(110));

  const working = { newSDK: [], newStream: [], legacySDK: [], legacyStream: [] };

  for (const model of CANDIDATES) {
    process.stdout.write(`  ${model.padEnd(PAD)} ...`);
    const r = await probe(model);

    const cols = [
      r.newSDK, r.newStream, r.legacySDK, r.legacyStream,
    ].map(v => {
      const ok = v && !v.startsWith('QUOTA') && !v.startsWith('NOT_FOUND') &&
                 !v.startsWith('ERR') && !v.startsWith('LIMIT') && !v.startsWith('FORBIDDEN');
      return ok ? `✅ ${v}`.padEnd(22) : `❌ ${v}`.padEnd(22);
    });

    process.stdout.write(`\r  ${model.padEnd(PAD)} ${cols.join(' ')}\n`);

    const ok = v => v && !v.startsWith('QUOTA') && !v.startsWith('NOT_FOUND') &&
                    !v.startsWith('ERR') && !v.startsWith('LIMIT') && !v.startsWith('FORBIDDEN');
    if (ok(r.newSDK))      working.newSDK.push(model);
    if (ok(r.newStream))   working.newStream.push(model);
    if (ok(r.legacySDK))   working.legacySDK.push(model);
    if (ok(r.legacyStream)) working.legacyStream.push(model);
  }

  console.log('═'.repeat(110));
  console.log('\n✅ WORKING MODELS SUMMARY:');
  console.log('  New SDK  (generateContent):       ', working.newSDK.join(', ') || 'none');
  console.log('  New SDK  (generateContentStream): ', working.newStream.join(', ') || 'none');
  console.log('  Legacy SDK (generateContent):     ', working.legacySDK.join(', ') || 'none');
  console.log('  Legacy SDK (generateContentStream):', working.legacyStream.join(', ') || 'none');
  console.log('');
})();
