const pty = require('node-pty');
const { ipcMain } = require('electron');

const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {});

ipcMain.handle('terminal-command', async (event, cmd) => {
  return new Promise(resolve => {
    ptyProcess.write(cmd + '\r');
    ptyProcess.onData(data => resolve(data));
  });
});