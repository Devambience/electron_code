const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize store for app settings
const store = new Store();

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-file')
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ['openFile']
            });
            if (!canceled) {
              mainWindow.webContents.send('menu-open-file', filePaths[0]);
            }
          }
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              properties: ['openDirectory']
            });
            if (!canceled) {
              mainWindow.webContents.send('menu-open-folder', filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save')
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-find')
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow.webContents.send('menu-replace')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow.webContents.send('menu-toggle-sidebar')
        },
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => mainWindow.webContents.send('menu-toggle-terminal')
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+Shift+`',
          click: () => mainWindow.webContents.send('menu-new-terminal')
        },
        {
          label: 'Clear Terminal',
          click: () => mainWindow.webContents.send('menu-clear-terminal')
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Open Settings',
          click: () => mainWindow.webContents.send('menu-open-settings')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = entries.map(entry => {
      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(dirPath, entry.name)
      };
    });
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-file', async (event, filePath) => {
  try {
    await fs.promises.writeFile(filePath, '', 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-path', async (event, oldPath, newPath) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-path', async (event, pathToDelete) => {
  try {
    const stats = await fs.promises.stat(pathToDelete);
    if (stats.isDirectory()) {
      await fs.promises.rmdir(pathToDelete, { recursive: true });
    } else {
      await fs.promises.unlink(pathToDelete);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handlers for settings
ipcMain.handle('get-settings', (event) => {
  const defaultSettings = {
    theme: 'dark',
    fontSize: 14,
    wordWrap: true,
    showLineNumbers: true,
    tabSize: 2,
    autoSave: false
  };
  
  // Return stored settings or defaults
  return store.get('settings', defaultSettings);
});

ipcMain.handle('save-settings', (event, settings) => {const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: __dirname + "/preload.js",
      nodeIntegration: false
    }
  });

  win.loadFile("renderer/index.html");
}

app.whenReady().then(createWindow);

  store.set('settings', settings);
  return { success: true };
});

// Show file dialog for save as
ipcMain.handle('show-save-dialog', async (event, defaultPath) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath
  });
  return { canceled, filePath };
});
