const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  apiRequest: (req) => ipcRenderer.invoke('api-request', req),
  // secure credentials (keytar)
  secure: {
    setCredential: (service, account, secret) => ipcRenderer.invoke('secure-set', { service, account, secret }),
    getCredential: (service, account) => ipcRenderer.invoke('secure-get', { service, account }),
    deleteCredential: (service, account) => ipcRenderer.invoke('secure-delete', { service, account })
  },
  // local storage using electron-store
  localStore: {
    get: (key) => ipcRenderer.invoke('store-get', { key }),
    set: (key, value) => ipcRenderer.invoke('store-set', { key, value }),
    delete: (key) => ipcRenderer.invoke('store-delete', { key }),
    keys: () => ipcRenderer.invoke('store-keys')
  }
});
