import axios from 'axios';

function getCookie(name) {
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}

function createBrowserApi() {
  const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
  });

  api.interceptors.request.use(config => {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) config.headers['X-CSRFToken'] = csrftoken;
    return config;
  });

  return api;
}

let isRefreshing = false;
let refreshQueue = [];
function addToQueue(resolve, reject) { refreshQueue.push({ resolve, reject }); }
function resolveQueue() { refreshQueue.forEach(p => p.resolve()); refreshQueue = []; }
function rejectQueue(err) { refreshQueue.forEach(p => p.reject(err)); refreshQueue = []; }

function attachResponseInterceptor(api) {
  api.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;
      if (!originalRequest) return Promise.reject(error);

      const status = error.response ? error.response.status : null;
      if (originalRequest.url && originalRequest.url.includes('/api/auth/refresh/')) {
        return Promise.reject(error);
      }

      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => { addToQueue(resolve, reject); }).then(() => api(originalRequest)).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;
        try {
          if (api.defaults.withCredentials) {
            await api.post('/api/auth/refresh/');
            isRefreshing = false;
            resolveQueue();
            return api(originalRequest);
          } else {
            isRefreshing = false;
            return Promise.reject(error);
          }
        } catch (refreshErr) {
          isRefreshing = false;
          rejectQueue(refreshErr);
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }
  );
}

// Detect if running inside Electron renderer
const isElectron = typeof window !== 'undefined' && window && ((window.process && window.process.type === 'renderer') || (typeof navigator !== 'undefined' && /electron/i.test(navigator.userAgent)));

let api;

if (isElectron && typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.apiRequest === 'function') {
  // Helper: attempt remote, otherwise fallback to local store exposed by preload
  const callRemote = async (req) => {
    const res = await window.electronAPI.apiRequest(req);
    if (res && res.ok) return res.result;
    throw new Error(res && res.error ? res.error : 'remote-failed');
  };

  const readLocal = async (key) => {
    try { return await window.electronAPI.localStore.get(key); } catch (e) { return null; }
  };
  const writeLocal = async (key, value) => {
    try { await window.electronAPI.localStore.set(key, value); return true; } catch (e) { return false; }
  };

  // Basic local CRUD helpers for list resources
  const getListKey = (url) => {
    if (url.startsWith('/api/players')) return 'players';
    if (url.startsWith('/api/acudientes')) return 'acudientes';
    if (url.startsWith('/api/categories')) return 'categories';
    return null;
  };

  const localGet = async (url) => {
    // special case: auth/me
    if (url.startsWith('/api/auth/me')) {
      const profile = await readLocal('user_profile');
      return { status: 200, data: profile || null };
    }
    const key = getListKey(url);
    if (!key) throw new Error('no-local-key');
    const list = (await readLocal(key)) || [];
    // GET by id
    const m = url.match(/\/api\/[a-z]+\/(\d+)\/?$/);
    if (m) {
      const id = Number(m[1]);
      return { status: 200, data: list.find(i => Number(i.id) === id) || null };
    }
    return { status: 200, data: list };
  };

  const localPost = async (url, body) => {
    const key = getListKey(url);
    if (!key) throw new Error('no-local-key');
    const list = (await readLocal(key)) || [];
    const newItem = { ...body, id: Date.now() };
    list.push(newItem);
    await writeLocal(key, list);
    return { status: 201, data: newItem };
  };

  const localPatch = async (url, body) => {
    const key = getListKey(url);
    if (!key) throw new Error('no-local-key');
    const m = url.match(/\/api\/[a-z]+\/(\d+)\/?$/);
    if (!m) throw new Error('no-id');
    const id = Number(m[1]);
    const list = (await readLocal(key)) || [];
    const idx = list.findIndex(i => Number(i.id) === id);
    if (idx === -1) return { status: 404 };
    list[idx] = { ...list[idx], ...body };
    await writeLocal(key, list);
    return { status: 200, data: list[idx] };
  };

  const localDelete = async (url) => {
    const key = getListKey(url);
    if (!key) throw new Error('no-local-key');
    const m = url.match(/\/api\/[a-z]+\/(\d+)\/?$/);
    if (!m) throw new Error('no-id');
    const id = Number(m[1]);
    let list = (await readLocal(key)) || [];
    list = list.filter(i => Number(i.id) !== id);
    await writeLocal(key, list);
    return { status: 204 };
  };

  // login fallback: try remote; if remote fails use keytar/local demo
  const localLogin = async (credentials) => {
    try {
      // check secure credential first
      const stored = await window.electronAPI.secure.getCredential('my-vue-app', credentials.username || credentials.email);
      if (stored && stored === credentials.password) {
        const profile = (await readLocal('user_profile')) || { username: credentials.username || credentials.email };
        return { status: 200, data: profile };
      }
    } catch (e) {
      // continue to demo fallback
    }
    // demo credentials in store
    const demo = await readLocal('demo_credentials');
    if (demo && (credentials.username === demo.username || credentials.email === demo.username) && credentials.password === demo.password) {
      const profile = (await readLocal('user_profile')) || { username: demo.username, name: 'Demo User', email: 'demo@example.com' };
      return { status: 200, data: profile };
    }
    return { status: 401, data: { detail: 'Invalid credentials' } };
  };

  api = {
    defaults: { withCredentials: false },
    get: async (url, config) => {
      try {
        const r = await callRemote({ method: 'GET', url, headers: (config && config.headers) || {} });
        return r;
      } catch (e) {
        return localGet(url);
      }
    },
    post: async (url, data, config) => {
      // auth/login route special handling
      if (url.includes('/api/auth/login/')) {
        try {
          const r = await callRemote({ method: 'POST', url, body: data, headers: (config && config.headers) || {} });
          // if login succeeded remotely, store secure credential
          if (r && r.status && (r.status === 200 || r.status === 204)) {
            try { await window.electronAPI.secure.setCredential('my-vue-app', data.username || data.email, data.password); } catch (e) { console.warn('secure set failed', e); }
          }
          return r;
        } catch (e) {
          return localLogin(data);
        }
      }

      try {
        const r = await callRemote({ method: 'POST', url, body: data, headers: (config && config.headers) || {} });
        return r;
      } catch (e) {
        return localPost(url, data);
      }
    },
    put: async (url, data, config) => {
      try {
        const r = await callRemote({ method: 'PUT', url, body: data, headers: (config && config.headers) || {} });
        return r;
      } catch (e) {
        return localPatch(url, data);
      }
    },
    patch: async (url, data, config) => {
      try {
        const r = await callRemote({ method: 'PATCH', url, body: data, headers: (config && config.headers) || {} });
        return r;
      } catch (e) {
        return localPatch(url, data);
      }
    },
    delete: async (url, config) => {
      try {
        const r = await callRemote({ method: 'DELETE', url, headers: (config && config.headers) || {} });
        return r;
      } catch (e) {
        return localDelete(url);
      }
    }
  };

} else {
  api = createBrowserApi();
  attachResponseInterceptor(api);
}

export default api;
