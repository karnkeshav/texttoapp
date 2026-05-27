'use strict';
/**
 * firestoreService.js — Firebase Admin + Firestore user management
 *
 * Initialised lazily on first call so the server still starts if
 * FIREBASE_* env vars are missing (e.g. local dev without Firestore).
 *
 * User document path: /users/{uid}
 * Fields:
 *   uid         string   — Google sub (unique per Google account)
 *   email       string
 *   name        string
 *   picture     string   — profile photo URL
 *   provider    string   — 'google' | 'github'
 *   createdAt   timestamp
 *   lastLogin   timestamp
 *   githubLogin string?  — set when user later connects GitHub
 */

let _admin = null;
let _db    = null;

function getAdmin() {
  if (_admin) return _admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[Firestore] FIREBASE_* env vars not set — user persistence disabled');
    return null;
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          // Render stores multiline values with literal \n — replace them
          privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    _admin = admin;
    _db    = admin.firestore();
    console.log('[Firestore] Connected to project:', FIREBASE_PROJECT_ID);
    return admin;
  } catch (err) {
    console.error('[Firestore] Init error:', err.message);
    return null;
  }
}

/**
 * Upsert a user record. Safe to call on every login.
 * Creates the document on first login, updates lastLogin + name/picture on subsequent logins.
 */
async function upsertUser({ uid, email, name, picture, provider = 'google', githubLogin }) {
  const admin = getAdmin();
  if (!admin || !_db) return; // Firestore not configured — silently skip

  try {
    const ref = _db.collection('users').doc(uid);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const snap = await ref.get();
    if (snap.exists) {
      const update = { lastLogin: now, name, picture };
      if (githubLogin) update.githubLogin = githubLogin;
      await ref.update(update);
    } else {
      const data = { uid, email, name, picture, provider, createdAt: now, lastLogin: now };
      if (githubLogin) data.githubLogin = githubLogin;
      await ref.set(data);
    }
  } catch (err) {
    // Non-fatal — log and continue
    console.error('[Firestore] upsertUser error:', err.message);
  }
}

/**
 * Attach a GitHub login to an existing Google-authed user.
 */
async function linkGitHub(uid, githubLogin) {
  const admin = getAdmin();
  if (!admin || !_db) return;
  try {
    await _db.collection('users').doc(uid).update({
      githubLogin,
      githubLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[Firestore] linkGitHub error:', err.message);
  }
}

module.exports = { upsertUser, linkGitHub };
