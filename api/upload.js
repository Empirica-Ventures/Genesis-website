// POST /api/upload — token endpoint for client (browser -> Blob) uploads.
//
// The file itself never passes through this serverless function; the
// browser uploads straight to Vercel Blob storage using a short-lived token
// minted here. This matters on Hobby: Vercel's serverless functions cap
// request bodies at roughly 4.5MB, which would break real-world uploads
// (team PDFs regularly run 10-70MB). The @vercel/blob "client upload"
// pattern exists specifically to route around that cap. See
// js/team-uploads.js and js/vendor/vercel-blob-client.js for the browser
// side of this handshake.
//
// This same endpoint is called twice, for two different, distinguishable
// requests:
//   1. By the logged-in browser, to request a token (checked against our
//      session cookie in onBeforeGenerateToken below).
//   2. By Vercel's Blob service itself, after the upload completes, to
//      run onUploadCompleted. This request has no session cookie — it's
//      authenticated separately by @vercel/blob via a signed header, which
//      handleUpload() verifies internally before invoking our callback.
'use strict';

const { handleUpload } = require('@vercel/blob/client');
const { list, del } = require('@vercel/blob');
const { isAuthenticated } = require('./_auth');
const { PREFIX, MAX_FILES, MAX_UPLOAD_BYTES } = require('./_config');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleUpload({
      request: req,
      body: req.body,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAuthenticated(req)) {
          throw new Error('Not authenticated');
        }
        if (!pathname.startsWith(PREFIX) || pathname.includes('..')) {
          throw new Error('Invalid destination path');
        }
        return {
          addRandomSuffix: false,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        };
      },
      onUploadCompleted: async () => {
        await enforceRetention();
      },
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Upload token/callback failed', err);
    const status = err && /not authenticated/i.test(err.message || '') ? 401 : 400;
    return res.status(status).json({ error: (err && err.message) || 'Upload failed' });
  }
};

// Keep only the MAX_FILES most recently uploaded files; delete the rest.
async function enforceRetention() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  const sorted = blobs.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const stale = sorted.slice(MAX_FILES).map((blob) => blob.url);
  if (stale.length > 0) {
    await del(stale);
  }
}
