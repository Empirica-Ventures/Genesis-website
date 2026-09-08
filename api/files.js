// GET /api/files — lists uploaded files, newest first. Requires a valid
// session cookie (see /api/login).
'use strict';

const { list } = require('@vercel/blob');
const { isAuthenticated } = require('./_auth');
const { PREFIX, MAX_FILES } = require('./_config');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });

    const files = blobs
      .map((blob) => ({
        url: blob.downloadUrl,
        name: blob.pathname.slice(PREFIX.length),
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({ files, limit: MAX_FILES });
  } catch (err) {
    console.error('Failed to list files', err);
    return res.status(500).json({ error: 'Failed to list files' });
  }
};
