const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFileAs: (filePath) => ipcRenderer.invoke('save-file-as', filePath),
  
  // Directory operations
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  createFile: (data) => ipcRenderer.invoke('create-file', data),
  createDirectory: (data) => ipcRenderer.invoke('create-directory', data),
  renameItem: (data) => ipcRenderer.invoke('rename-item', data),
  deleteItem: (itemPath) => ipcRenderer.invoke('delete-item', itemPath),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Listen to menu events
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
  onMenuReplace: (callback) => ipcRenderer.on('menu-replace', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback),
  onFolderOpened: (callback) => ipcRenderer.on('folder-opened', callback),
  onSaveFileAs: (callback) => ipcRenderer.on('save-file-as', callback),
  onToggleSidebar: (callback) => ipcRenderer.on('toggle-sidebar', callback),
  onToggleTerminal: (callback) => ipcRenderer.on('toggle-terminal', callback),
  onToggleLineNumbers: (callback) => ipcRenderer.on('toggle-line-numbers', callback),
  onToggleWordWrap: (callback) => ipcRenderer.on('toggle-word-wrap', callback),
  onNewTerminal: (callback) => ipcRenderer.on('new-terminal', callback),
  onClearTerminal: (callback) => ipcRenderer.on('clear-terminal', callback),
  onChangeTheme: (callback) => ipcRenderer.on('change-theme', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
  onFileOpenedFromSystem: (callback) => ipcRenderer.on('file-opened-from-system', callback),
  onDeepLink: (callback) => ipcRenderer.on('deep-link', callback),
  
  // Remove event listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
