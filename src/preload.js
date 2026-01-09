const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
  maximizeWindow: () => ipcRenderer.send('window-control', 'maximize'),
  closeWindow: () => ipcRenderer.send('window-control', 'close'),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  // Optical systems management
  loadSystems: () => ipcRenderer.invoke('load-systems'),
  saveSystem: (folderPath, systemName, systemData) => ipcRenderer.invoke('save-system', folderPath, systemName, systemData),
  deleteSystem: (folderPath, systemName) => ipcRenderer.invoke('delete-system', folderPath, systemName),
  createFolder: (parentPath, folderName) => ipcRenderer.invoke('create-folder', parentPath, folderName),
  deleteFolder: (folderPath) => ipcRenderer.invoke('delete-folder', folderPath),
  // File dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content)
});
