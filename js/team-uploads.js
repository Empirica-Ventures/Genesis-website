(() => {
  'use strict';

  const loginCard = document.getElementById('login-card');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const passwordInput = document.getElementById('password');

  const workspace = document.getElementById('workspace');
  const logoutBtn = document.getElementById('logout-btn');
  const uploadError = document.getElementById('upload-error');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadList = document.getElementById('upload-list');

  const filesList = document.getElementById('files-list');
  const retentionNote = document.getElementById('retention-note');

  function showWorkspace() {
    loginCard.style.display = 'none';
    workspace.classList.add('is-visible');
    loadFiles();
  }

  function showLogin() {
    workspace.classList.remove('is-visible');
    loginCard.style.display = '';
  }

  function setError(el, message) {
    if (!message) {
      el.classList.remove('is-visible');
      el.textContent = '';
      return;
    }
    el.textContent = message;
    el.classList.add('is-visible');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  // ── Check session on load ──────────────────────────────────────────
  async function checkSession() {
    try {
      const res = await fetch('/api/files', { credentials: 'same-origin' });
      if (res.ok) {
        showWorkspace();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  // ── Login ───────────────────────────────────────────────────────────
  loginCard.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError(loginError, '');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking…';

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.value }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        passwordInput.value = '';
        showWorkspace();
      } else {
        setError(loginError, data.error || 'Something went wrong. Try again.');
      }
    } catch {
      setError(loginError, 'Network error. Try again.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Enter';
    }
  });

  // ── Logout ──────────────────────────────────────────────────────────
  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // ignore network errors on logout
    }
    showLogin();
  });

  // ── Load + render file list ────────────────────────────────────────
  async function loadFiles() {
    try {
      const res = await fetch('/api/files', { credentials: 'same-origin' });
      if (res.status === 401) {
        showLogin();
        return;
      }
      const data = await res.json();
      renderFiles(data.files || [], data.limit);
    } catch {
      filesList.innerHTML = '<p class="empty">Couldn’t load files. Refresh to try again.</p>';
    }
  }

  function renderFiles(files, limit) {
    if (files.length === 0) {
      filesList.innerHTML = '<p class="empty">No files uploaded yet.</p>';
      retentionNote.textContent = '';
      return;
    }

    filesList.innerHTML = files
      .map(
        (f) => `
        <div class="file-row">
          <span class="name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span>
          <span class="meta">${formatSize(f.size)} · ${formatDate(f.uploadedAt)}</span>
          <a class="download" href="${escapeAttr(f.url)}">Download</a>
        </div>`
      )
      .join('');

    if (typeof limit === 'number') {
      retentionNote.textContent = `Showing the ${limit} most recent files — older uploads are deleted automatically to save space.`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
  }

  // ── Uploading ───────────────────────────────────────────────────────
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) uploadFiles(fileInput.files);
    fileInput.value = '';
  });

  function uploadFiles(fileListObj) {
    setError(uploadError, '');
    Array.from(fileListObj).forEach(uploadOne);
  }

  function uploadOne(file) {
    const row = document.createElement('div');
    row.className = 'upload-list__item';
    row.innerHTML = `
      <span class="name">${escapeHtml(file.name)}</span>
      <span class="progress-track"><span class="progress-fill"></span></span>
      <span class="status">0%</span>
    `;
    uploadList.appendChild(row);

    const fill = row.querySelector('.progress-fill');
    const status = row.querySelector('.status');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      fill.style.width = `${pct}%`;
      status.textContent = `${pct}%`;
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        fill.style.width = '100%';
        status.textContent = 'Done';
        status.classList.add('is-done');
        loadFiles();
        setTimeout(() => row.remove(), 2500);
      } else {
        let message = 'Upload failed';
        try {
          message = JSON.parse(xhr.responseText).error || message;
        } catch {
          // ignore parse errors
        }
        if (xhr.status === 401) {
          showLogin();
          return;
        }
        status.textContent = message;
        status.classList.add('is-error');
        setError(uploadError, `${file.name}: ${message}`);
      }
    });

    xhr.addEventListener('error', () => {
      status.textContent = 'Network error';
      status.classList.add('is-error');
    });

    xhr.send(file);
  }

  checkSession();
})();
