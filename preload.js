const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  terminalCommand: (cmd) => ipcRenderer.invoke('terminal-command', cmd)
});