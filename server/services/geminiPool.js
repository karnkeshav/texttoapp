'use strict';
/**
 * geminiPool.js — Multi-SDK, multi-model Gemini fallback pool
 *
 * Discovery results (run scripts/discover-models.js to re-check):
 *   ✅ gemini-2.5-flash  — new SDK (@google/genai v2)   — generateContent + Stream
 *   ✅ gemini-2.5-flash  — legacy SDK (@google/generative-ai) — generateContent + Stream
 *   ❌ gemini-2.0-*      — limit:0 (no free-tier quota on this project)
 *   ❌ gemini-1.5-*      — 404 (not on v1beta endpoint)
 *   ❌ gemini-2.5-pro    — limit:0 (needs billing)
 *
 * Pool behaviour:
 *   - Round-robins through all slots on every call
 *   - On 429 / quota error: marks that slot as cooling down for COOLDOWN_MS
 *   - On 404 / unknown: marks slot as permanently dead for this process lifetime
 *   - Tries every active slot before giving up
 *   - On exhaustion: re-tries cooled-down slots once with a short extra wait
 *
 * Adding models when you enable billing: just push more entries to POOL_CONFIG.
 */

const { GoogleGenAI }        = require('@google/genai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Pool configuration ────────────────────────────────────────────
// Order = priority. First slot is tried first on every request.
const POOL_CONFIG = [
  // Slot 0 — new SDK, fast non-streaming (plan phase / repair pass)
  { sdk: 'new',    model: 'gemini-2.5-flash', mode: 'generate'  },
  // Slot 1 — legacy SDK, non-streaming (backup for slot 0)
  { sdk: 'legacy', model: 'gemini-2.5-flash', mode: 'generate'  },
  // Slot 2 — new SDK, streaming (main chat generation)
  { sdk: 'new',    model: 'gemini-2.5-flash', mode: 'stream'    },
  // Slot 3 — legacy SDK, streaming (backup for slot 2)
  { sdk: 'legacy', model: 'gemini-2.5-flash', mode: 'stream'    },
  // ── Add billing-enabled models here when available ──────────────
  // { sdk: 'new',    model: 'gemini-2.5-pro',   mode: 'generate'  },
  // { sdk: 'new',    model: 'gemini-2.0-flash',  mode: 'generate'  },
  // { sdk: 'new',    model: 'gemini-2.0-flash',  mode: 'stream'    },
];

const COOLDOWN_MS = 60_000; // 1 min cooldown after 429

// ── Slot state tracking ───────────────────────────────────────────
const slotState = POOL_CONFIG.map(() => ({
  coolUntil: 0,  // epoch ms — 0 means available
  dead:      false, // 404 / permanent error
}));

function isAvailable(i) {
  return !slotState[i].dead && Date.now() >= slotState[i].coolUntil;
}

function markCooling(i) {
  slotState[i].coolUntil = Date.now() + COOLDOWN_MS;
  const slot = POOL_CONFIG[i];
  console.warn(`[GeminiPool] Slot ${i} (${slot.sdk}/${slot.model}) cooling for ${COOLDOWN_MS / 1000}s`);
}

function markDead(i) {
  slotState[i].dead = true;
  const slot = POOL_CONFIG[i];
  console.error(`[GeminiPool] Slot ${i} (${slot.sdk}/${slot.model}) marked dead — will not retry`);
}

function isQuotaError(err) {
  const msg = err?.message || String(err);
  return msg.includes('"code":429') || msg.includes('429') ||
         msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') ||
         err?.status === 429;
}

function isNotFound(err) {
  const msg = err?.message || String(err);
  return msg.includes('"code":404') || msg.includes('NOT_FOUND') ||
         msg.includes('no longer available') || msg.includes('not found for API');
}

// ── Helpers to extract text from SDK responses ────────────────────
function extractText(response, sdk) {
  if (sdk === 'legacy') {
    // Legacy SDK: response.response.text() is a function
    return typeof response?.response?.text === 'function'
      ? response.response.text()
      : '';
  }
  // New SDK: .text getter (works with thinkingBudget:0), fallback to candidates
  return response?.text
    ?? response?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text
    ?? '';
}

// ── Per-SDK generateContent wrappers ─────────────────────────────
async function newSDKGenerate(model, contents, config, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  return ai.models.generateContent({
    model,
    contents,
    config: { ...config, thinkingConfig: { thinkingBudget: 0 } },
  });
}

async function legacySDKGenerate(model, contents, config, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: config.maxOutputTokens,
      temperature:     config.temperature,
      ...(config.responseMimeType ? { responseMimeType: config.responseMimeType } : {}),
    },
  });
  // Legacy SDK expects a flat string or Content[] — convert
  const prompt = Array.isArray(contents)
    ? contents.map(c => c.parts.map(p => p.text).join('')).join('\n')
    : contents;
  return m.generateContent(prompt);
}

// ── Per-SDK generateContentStream wrappers ───────────────────────
async function newSDKStream(model, contents, config, apiKey, systemInstruction) {
  const ai = new GoogleGenAI({ apiKey });
  return ai.models.generateContentStream({
    model,
    contents,
    config: { ...config, systemInstruction },
  });
}

async function legacySDKStream(model, contents, config, apiKey, systemInstruction) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: config.maxOutputTokens,
      temperature:     config.temperature,
    },
  });
  const prompt = Array.isArray(contents)
    ? contents.map(c => c.parts.map(p => p.text).join('')).join('\n')
    : contents;
  const result = await m.generateContentStream(prompt);
  // Wrap legacy stream to match new SDK's async iterable interface
  return {
    [Symbol.asyncIterator]: async function* () {
      for await (const chunk of result.stream) {
        yield { text: chunk.text() };
      }
    },
  };
}

// ── Public: one-shot generation (plan phase, repair pass, diagnose) ─
/**
 * Tries generate slots in order, falls back on quota errors.
 * @param {object} opts
 * @param {Array}  opts.contents   - [{role, parts:[{text}]}]
 * @param {object} opts.config     - {temperature, maxOutputTokens, ...}
 * @param {string} opts.apiKey
 * @returns {Promise<string>}      - extracted text
 */
async function pooledGenerate({ contents, config, apiKey }) {
  const generateSlots = POOL_CONFIG
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => slot.mode === 'generate');

  // First pass — try available slots
  for (const { slot, i } of generateSlots) {
    if (!isAvailable(i)) continue;
    try {
      const raw = slot.sdk === 'new'
        ? await newSDKGenerate(slot.model, contents, config, apiKey)
        : await legacySDKGenerate(slot.model, contents, config, apiKey);
      const text = extractText(raw, slot.sdk);
      console.log(`[GeminiPool] generate ✅ slot ${i} (${slot.sdk}/${slot.model})`);
      return text;
    } catch (err) {
      if (isQuotaError(err)) { markCooling(i); continue; }
      if (isNotFound(err))   { markDead(i);    continue; }
      throw err; // unexpected — surface immediately
    }
  }

  // Second pass — wait out the shortest cooldown and retry once
  const cooling = generateSlots
    .filter(({ i }) => !slotState[i].dead && slotState[i].coolUntil > 0)
    .sort((a, b) => slotState[a.i].coolUntil - slotState[b.i].coolUntil);

  if (cooling.length > 0) {
    const { slot, i } = cooling[0];
    const wait = Math.max(0, slotState[i].coolUntil - Date.now());
    console.warn(`[GeminiPool] All slots cooling — waiting ${Math.ceil(wait / 1000)}s for slot ${i}`);
    await new Promise(r => setTimeout(r, wait + 500));
    try {
      const raw = slot.sdk === 'new'
        ? await newSDKGenerate(slot.model, contents, config, apiKey)
        : await legacySDKGenerate(slot.model, contents, config, apiKey);
      const text = extractText(raw, slot.sdk);
      console.log(`[GeminiPool] generate ✅ slot ${i} after cooldown`);
      return text;
    } catch (err) {
      if (isQuotaError(err)) markCooling(i);
    }
  }

  const err = new Error('All Gemini pool slots exhausted — quota exceeded on all models/SDKs');
  err.code = 'GEMINI_POOL_EXHAUSTED';
  throw err;
}

// ── Public: streaming generation (main chat) ─────────────────────
/**
 * Streams through pool slots. Falls back to next slot on quota error.
 * @param {object} opts
 * @param {Array}  opts.contents
 * @param {object} opts.config
 * @param {string} opts.apiKey
 * @param {string} opts.systemInstruction
 * @param {Function} opts.onChunk   - (text: string) => void
 * @param {Function} opts.onDone    - (fullText: string) => void
 */
async function pooledStream({ contents, config, apiKey, systemInstruction, onChunk, onDone }) {
  const streamSlots = POOL_CONFIG
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => slot.mode === 'stream');

  for (const { slot, i } of streamSlots) {
    if (!isAvailable(i)) continue;
    try {
      const stream = slot.sdk === 'new'
        ? await newSDKStream(slot.model, contents, config, apiKey, systemInstruction)
        : await legacySDKStream(slot.model, contents, config, apiKey, systemInstruction);

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) { fullText += text; onChunk(text); }
      }
      console.log(`[GeminiPool] stream ✅ slot ${i} (${slot.sdk}/${slot.model})`);
      onDone(fullText);
      return;
    } catch (err) {
      if (isQuotaError(err)) { markCooling(i); continue; }
      if (isNotFound(err))   { markDead(i);    continue; }
      throw err;
    }
  }

  // Cooldown wait fallback (same as generate)
  const cooling = streamSlots
    .filter(({ i }) => !slotState[i].dead && slotState[i].coolUntil > 0)
    .sort((a, b) => slotState[a.i].coolUntil - slotState[b.i].coolUntil);

  if (cooling.length > 0) {
    const { slot, i } = cooling[0];
    const wait = Math.max(0, slotState[i].coolUntil - Date.now());
    console.warn(`[GeminiPool] All stream slots cooling — waiting ${Math.ceil(wait / 1000)}s for slot ${i}`);
    await new Promise(r => setTimeout(r, wait + 500));
    try {
      const stream = slot.sdk === 'new'
        ? await newSDKStream(slot.model, contents, config, apiKey, systemInstruction)
        : await legacySDKStream(slot.model, contents, config, apiKey, systemInstruction);
      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) { fullText += text; onChunk(text); }
      }
      console.log(`[GeminiPool] stream ✅ slot ${i} after cooldown`);
      onDone(fullText);
      return;
    } catch (err) {
      if (isQuotaError(err)) markCooling(i);
    }
  }

  const err = new Error('All Gemini stream pool slots exhausted — quota exceeded on all models/SDKs');
  err.code = 'GEMINI_POOL_EXHAUSTED';
  throw err;
}

// ── Pool status (for diagnose endpoint) ──────────────────────────
function poolStatus() {
  return POOL_CONFIG.map((slot, i) => ({
    slot: i,
    sdk:  slot.sdk,
    model: slot.model,
    mode: slot.mode,
    available: isAvailable(i),
    dead: slotState[i].dead,
    coolUntil: slotState[i].coolUntil > Date.now()
      ? new Date(slotState[i].coolUntil).toISOString()
      : null,
  }));
}

module.exports = { pooledGenerate, pooledStream, poolStatus };
