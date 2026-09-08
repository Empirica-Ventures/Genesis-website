// POST /api/upload — streams the request body straight into Vercel Blob
// storage. Requires a valid session cookie (see /api/login).
//
// The client sends the raw file as the request body (not multipart form
// data) and tells us the original filename via the X-Filename header. See
// js/team-uploads.js for the matching client code.
'use strict';

const crypto = require('crypto');
const { put, list, del } = require('@vercel/blob');
const { isAuthenticated } = require('./_auth');
const { PREFIX, MAX_FILES, MAX_UPLOAD_BYTES } = require('./_config');

// We stream the incoming request straight into Blob storage rather than
// buffering it ourselves, so turn off Vercel's automatic body parsing.
module.exports = handler;
module.exports.config = { api: { bodyParser: false } };

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const rawName = req.headers['x-filename'];
  if (!rawName) {
    return res.status(400).json({ error: 'Missing X-Filename header' });
  }

  let filename;
  try {
    filename = decodeURIComponent(String(rawName));
  } catch {
    return res.status(400).json({ error: 'Invalid filename encoding' });
  }
  filename = filename.replace(/[\\/]/g, '_').trim().slice(0, 200);
  if (!filename) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return res.status(413).json({
      error: `File too large. Max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)}MB per file.`,
    });
  }

  const uniquePrefix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const pathname = `${PREFIX}${uniquePrefix}-${filename}`;

  try {
    const blob = await put(pathname, req, {
      access: 'public',
      addRandomSuffix: false,
      contentType: req.headers['content-type'] || 'application/octet-stream',
    });

    await enforceRetention();

    return res.status(200).json({
      ok: true,
      file: { url: blob.downloadUrl, name: filename },
    });
  } catch (err) {
    console.error('Upload failed', err);
    const message = err && err.name && err.name.startsWith('Blob') ? err.message : 'Upload failed';
    return res.status(500).json({ error: message });
  }
}

// Keep only the MAX_FILES most recently uploaded files; delete the rest.
async function enforceRetention() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const sorted = blobs.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const stale = sorted.slice(MAX_FILES).map((blob) => blob.url);
  if (stale.length > 0) {
    await del(stale);
  }
}
