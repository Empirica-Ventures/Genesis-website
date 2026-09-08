// Shared session helpers for the members' upload page.
//
// Auth model: a single shared team password (UPLOAD_PASSWORD env var) gates
// the page. On success we set a signed, HttpOnly cookie so the browser
// doesn't need to resend the password on every request. There are no
// per-user accounts — anyone with the password is "a member".
'use strict';

const crypto = require('crypto');

const COOKIE_NAME = 'genesis_upload_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function createSessionCookie() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `ok.${expiresAt}`;
  const signature = sign(payload);
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return (
    `${COOKIE_NAME}=${payload}.${signature}; ` +
    `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isAuthenticated(req) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const value = cookies[COOKIE_NAME];
    if (!value) return false;

    const lastDot = value.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = value.slice(0, lastDot);
    const signature = value.slice(lastDot + 1);

    const [status, expiresAtStr] = payload.split('.');
    if (status !== 'ok') return false;

    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    // Fail closed: any error (e.g. missing SESSION_SECRET) means "not authenticated".
    return false;
  }
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthenticated };
