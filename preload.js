const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  dbExec: (query) => ipcRenderer.invoke('db-exec', query),
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: (path) => ipcRenderer.invoke('restore-database', path)
});

