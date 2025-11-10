const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// node-fetch v2 (installed) returns a CommonJS function
const nodeFetch = require('node-fetch');
// fetch-cookie may export function as default or directly depending on bundler/version
let fetchCookieRaw = require('fetch-cookie');
if (fetchCookieRaw && typeof fetchCookieRaw !== 'function' && fetchCookieRaw.default) fetchCookieRaw = fetchCookieRaw.default;
const fetchCookie = fetchCookieRaw;
const { CookieJar } = require('tough-cookie');

// secure storage and local store
const keytar = require('keytar');
const Store = require('electron-store');
const localStore = new Store({ name: 'my-vue-app-store', defaults: {
  user_profile: { username: 'demo', name: 'Demo User', email: 'demo@example.com' },
  demo_credentials: { username: 'demo', password: 'demo123' },
  players: [
    { id: 1, nombre: 'Juan Perez', category: 'A', acudiente_id: 1 },
    { id: 2, nombre: 'Maria Gomez', category: 'B', acudiente_id: 2 }
  ],
  acudientes: [
    { id: 1, nombre: 'Carlos Perez', telefono: '555-1111' },
    { id: 2, nombre: 'Ana Gomez', telefono: '555-2222' }
  ],
  categories: [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' }
  ]
} });

// detect dev mode set by electron:serve script
const isDev = process.env.ELECTRON_DEV === '1' || process.env.NODE_ENV === 'development';

// Simple cookie-aware fetch wrapper for main process
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(nodeFetch, jar);

async function proxyRequest({ method = 'GET', url, headers = {}, body }) {
  const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
  const options = { method, headers };
  if (body) {
    options.body = typeof body === 'object' ? JSON.stringify(body) : body;
    options.headers = { 'Content-Type': 'application/json', ...headers };
  }
  const res = await fetchWithCookies(fullUrl, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { data = text; }
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), data };
}

ipcMain.handle('api-request', async (event, req) => {
  try {
    const result = await proxyRequest(req);
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Keytar handlers
ipcMain.handle('secure-set', async (event, { service, account, secret }) => {
  await keytar.setPassword(service, account, secret);
  return true;
});
ipcMain.handle('secure-get', async (event, { service, account }) => {
  return await keytar.getPassword(service, account);
});
ipcMain.handle('secure-delete', async (event, { service, account }) => {
  return await keytar.deletePassword(service, account);
});

// Electron-store handlers
ipcMain.handle('store-get', (event, { key }) => {
  return localStore.get(key);
});
ipcMain.handle('store-set', (event, { key, value }) => {
  localStore.set(key, value);
  return true;
});
ipcMain.handle('store-delete', (event, { key }) => {
  localStore.delete(key);
  return true;
});
ipcMain.handle('store-keys', (event) => {
  return Object.keys(localStore.store || {});
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    const url = 'http://localhost:8080';
    win.loadURL(url).catch(err => {
      console.error('Failed to load dev server:', err);
    });
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load packaged index.html:', err);
    });
  }

  // Log console messages from renderer to help debugging blank windows
  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`Renderer console (${level}): ${message} -- ${sourceId}:${line}`);
  });

  // Open devtools if explicitly requested
  if (process.env.OPEN_DEVTOOLS === '1') {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
