const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // File system operations
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
    createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
    createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
    renamePath: (oldPath, newPath) => ipcRenderer.invoke('rename-path', oldPath, newPath),
    deletePath: (pathToDelete) => ipcRenderer.invoke('delete-path', pathToDelete),
    
    // Dialog operations
    showSaveDialog: (defaultPath) => ipcRenderer.invoke('show-save-dialog', defaultPath),
    
    // Settings operations
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    
    // Menu event listeners
    onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
    onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
    onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', callback),
    onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
    onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', callback),
    onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
    onMenuReplace: (callback) => ipcRenderer.on('menu-replace', callback),
    onMenuToggleSidebar: (callback) => ipcRenderer.on('menu-toggle-sidebar', callback),
    onMenuToggleTerminal: (callback) => ipcRenderer.on('menu-toggle-terminal', callback),
    onMenuNewTerminal: (callback) => ipcRenderer.on('menu-new-terminal', callback),
    onMenuClearTerminal: (callback) => ipcRenderer.on('menu-clear-terminal', callback),
    onMenuOpenSettings: (callback) => ipcRenderer.on('menu-open-settings', callback),
    
    // Remove event listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);
