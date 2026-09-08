'use strict';

module.exports = {
  // Folder (pathname prefix) inside the Blob store where member uploads live.
  PREFIX: 'member-uploads/',
  // How many of the most recent files to keep. On every successful upload,
  // anything beyond this count (oldest first) is deleted automatically.
  MAX_FILES: parseInt(process.env.MAX_FILES || '30', 10),
  // Per-file size cap. Uploads go browser -> Blob storage directly (not
  // through this serverless function), so this is just a policy limit, not
  // a workaround for Vercel's ~4.5MB serverless request body cap.
  MAX_UPLOAD_BYTES: parseInt(process.env.MAX_UPLOAD_MB || '200', 10) * 1024 * 1024,
};
