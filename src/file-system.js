const fs = require('fs').promises;
const { ipcMain } = require('electron');

ipcMain.handle('open-file', async (event, path) => {
  const files = await fs.readdir(path, { withFileTypes: true });
  return files.map(f => ({ name: f.name, isDir: f.isDirectory() }));
});