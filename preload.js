const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const path = require('path');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // File system operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  createFile: (filePath) => ipcRenderer.invoke('create-file', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteItem: (itemPath) => ipcRenderer.invoke('delete-item', itemPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings) => ipcRenderer.invoke('set-settings', settings),
  
  // System information
  getOsInfo: () => ({
    platform: os.platform(),
    homedir: os.homedir()
  }),
  
  // Listen for events from main process
  on: (channel, callback) => {
    const validChannels = [
      'menu-new-file',
      'menu-open-file',
      'menu-open-folder',
      'menu-save-file',
      'menu-save-file-as',
      'menu-find',
      'menu-replace',
      'menu-toggle-sidebar',
      'menu-toggle-terminal',
      'menu-toggle-word-wrap',
      'menu-toggle-line-numbers',
      'menu-new-terminal',
      'menu-clear-terminal',
      'menu-open-settings'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Add listener for one-time events
  once: (channel, callback) => {
    const validChannels = [
      'menu-new-file',
      'menu-open-file',
      'menu-open-folder',
      'menu-save-file',
      'menu-save-file-as',
      'menu-find',
      'menu-replace',
      'menu-toggle-sidebar',
      'menu-toggle-terminal',
      'menu-toggle-word-wrap',
      'menu-toggle-line-numbers',
      'menu-new-terminal',
      'menu-clear-terminal',
      'menu-open-settings'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.once(channel, (event, ...args) => callback(...args));
    }
  },
  
  // Terminal operations
  createTerminal: (options) => ipcRenderer.invoke('create-terminal', options),
  sendToTerminal: (terminalId, data) => ipcRenderer.invoke('send-to-terminal', terminalId, data),
  resizeTerminal: (terminalId, cols, rows) => ipcRenderer.invoke('resize-terminal', terminalId, cols, rows),
  killTerminal: (terminalId) => ipcRenderer.invoke('kill-terminal', terminalId),
  
  // Path manipulation utilities
  path: {
    join: (...args) => path.join(...args),
    dirname: (p) => path.dirname(p),
    basename: (p) => path.basename(p),
    extname: (p) => path.extname(p)
  }
});

// Listen for drag and drop events
document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    for (const file of e.dataTransfer.files) {
      // We use a custom event to handle dropped files/folders in the renderer
      const event = new CustomEvent('file-dropped', {
        detail: {
          path: file.path,
          isDirectory: false // We'll determine this in the renderer
        }
      });
      document.dispatchEvent(event);
    }
  });
});