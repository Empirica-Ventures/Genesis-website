// POST /api/login  { password: string }
// Checks the shared team password and, on success, sets a signed session
// cookie used by /api/files and /api/upload.
'use strict';

const crypto = require('crypto');
const { createSessionCookie } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.UPLOAD_PASSWORD;
  if (!expected || !process.env.SESSION_SECRET) {
    console.error('Missing UPLOAD_PASSWORD or SESSION_SECRET env var');
    return res.status(500).json({ error: 'Server is not configured yet' });
  }

  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    // Small fixed delay to make online brute-forcing slower.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  return res.status(200).json({ ok: true });
};
