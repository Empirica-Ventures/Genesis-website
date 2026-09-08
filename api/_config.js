'use strict';

module.exports = {
  // Folder (pathname prefix) inside the Blob store where member uploads live.
  PREFIX: 'member-uploads/',
  // How many of the most recent files to keep. On every successful upload,
  // anything beyond this count (oldest first) is deleted automatically.
  MAX_FILES: parseInt(process.env.MAX_FILES || '30', 10),
  // Hard cap enforced before we even start streaming to Blob storage.
  // Vercel's own request body limit (varies by plan) is enforced regardless.
  MAX_UPLOAD_BYTES: 50 * 1024 * 1024, // 50 MB
};
