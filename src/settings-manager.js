const fs = require('fs').promises;
ipcMain.handle('get-settings', async () => {
  return JSON.parse(await fs.readFile('settings.json', 'utf8'));
});