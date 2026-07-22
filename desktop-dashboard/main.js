const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const { readFileSync, writeFileSync, existsSync } = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

// This app ships its own frontend (the CRA bundle in src/, built to build/)
// and never depends on the website's Next.js frontend — it's a fully
// standalone admin viewer that only talks to the backend API. In dev that
// bundle is served by react-scripts on port 3001; once packaged, it's the
// local build/index.html file bundled into the app itself.
function getConfigPath() {
  return path.join(app.getPath('userData'), 'api-config.json');
}

function getStoredApiUrl() {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      return config.apiUrl || null;
    }
  } catch (error) {
    console.warn('Could not read API URL preference:', error);
  }
  return null;
}

function buildCsp(environment) {
  const isLocal = environment === 'development';
  // 'unsafe-eval'/'unsafe-inline' for scripts are only needed by the CRA dev
  // server (webpack HMR/React Refresh) — a packaged build needs neither.
  // connect-src allowing http://localhost:* is NOT tied to dev though: the
  // admin panel is allowed to point at a local backend (localhost:4000) in
  // BOTH a dev run and a packaged build, via the Settings modal's URL picker.
  return [
    "default-src 'self'",
    isLocal ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob: http://localhost:*",
    "connect-src 'self' http://localhost:* ws://localhost:* https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function createWindow() {
  const startUrl = isDev
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, 'build', 'index.html')}`;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'icon', process.platform === 'win32' ? 'logo.ico' : 'logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: true,
    },
  });

  // Set Content Security Policy - strict but allows necessary connections
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = buildCsp(isDev ? 'development' : 'production');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
      },
    });
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 /* ERR_ABORTED: superseded navigation, not a real failure */) return;
    showLoadErrorPage(validatedURL || startUrl, errorDescription);
  });

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Shown instead of a blank white window if the dev server isn't up yet (dev)
// or the bundled build files are missing/corrupted (packaged, should not
// normally happen).
function showLoadErrorPage(failedUrl, errorDescription) {
  if (!mainWindow) return;
  const safeUrl = escapeHtml(failedUrl);
  const safeDescription = escapeHtml(errorDescription || '');
  const hint = isDev
    ? "Vérifiez que le serveur de développement est démarré (npm run dev:react, port 3001)."
    : "Le bundle de l'application semble manquant ou corrompu.";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Makhmal Admin</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#180a0e;color:#fff;font-family:-apple-system,Segoe UI,Arial,sans-serif;}
  .card{max-width:460px;text-align:center;padding:40px 32px;}
  h1{font-size:19px;margin:0 0 12px;color:#fff;font-weight:700;}
  p{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;margin:0 0 8px;}
  code{display:block;margin-top:10px;padding:9px 14px;background:rgba(255,255,255,0.06);border-radius:8px;font-size:11px;word-break:break-all;color:#e8ddd0;}
  a.retry{display:inline-block;margin-top:22px;padding:10px 26px;background:#7a1f30;color:#fff;text-decoration:none;border-radius:999px;font-size:13px;font-weight:600;}
  a.retry:hover{background:#8f2438;}
</style></head>
<body>
  <div class="card">
    <h1>Connexion impossible</h1>
    <p>L'application n'a pas pu se charger. ${hint}</p>
    <code>${safeUrl}</code>
    <p style="margin-top:14px;">${safeDescription}</p>
    <a class="retry" href="${safeUrl}">Réessayer</a>
  </div>
</body></html>`;
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
}

// IPC Handlers
ipcMain.handle('get-api-url', () => {
  // Priority: 1. Saved user preference, 2. Environment variable, 3. Default local
  const savedUrl = getStoredApiUrl();
  return savedUrl || process.env.REACT_APP_API_URL || 'http://localhost:4000';
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Allow user to override API URL (stored in userData), used by the Settings
// modal's Local/Railway picker so the choice survives app restarts even if
// localStorage is ever cleared.
ipcMain.handle('set-api-url', async (_event, url) => {
  try {
    writeFileSync(getConfigPath(), JSON.stringify({ apiUrl: url }), 'utf8');

    if (mainWindow) {
      mainWindow.webContents.send('api-url-changed', url);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save API URL:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-api-url-preference', () => {
  return getStoredApiUrl();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (_event, contents) => {
  // Links that open a new window (target="_blank") go to the system browser
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
    if (navigationUrl.startsWith('http')) {
      shell.openExternal(navigationUrl);
    }
  });
});

// Handle certificate errors (for self-signed certs in development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1'))) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
