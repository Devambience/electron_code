const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Initialize settings store
const store = new Store();

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'src/assets/icons/icon.png'),
    frame: true,
    backgroundColor: '#1e1e1e',
  });

  // Load the index.html of the app
  mainWindow.loadFile('renderer/index.html');

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create the application menu
  createMenu();

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          },
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFile();
          },
        },
        {
          label: 'Open Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            openFolder();
          },
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          },
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            saveFileAs();
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          },
        },
      ],
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
        { role: 'delete' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu-find');
          },
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu-replace');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('toggle-sidebar');
          },
        },
        {
          label: 'Toggle Terminal',
          accelerator: 'CmdOrCtrl+`',
          click: () => {
            mainWindow.webContents.send('toggle-terminal');
          },
        },
        { type: 'separator' },
        {
          label: 'Toggle Line Numbers',
          click: () => {
            mainWindow.webContents.send('toggle-line-numbers');
          },
        },
        {
          label: 'Toggle Word Wrap',
          click: () => {
            mainWindow.webContents.send('toggle-word-wrap');
          },
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
      ],
    },
    {
      label: 'Terminal',
      submenu: [
        {
          label: 'New Terminal',
          accelerator: 'CmdOrCtrl+Shift+`',
          click: () => {
            mainWindow.webContents.send('new-terminal');
          },
        },
        {
          label: 'Clear Terminal',
          click: () => {
            mainWindow.webContents.send('clear-terminal');
          },
        },
      ],
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              click: () => {
                mainWindow.webContents.send('change-theme', 'light');
              },
            },
            {
              label: 'Dark',
              click: () => {
                mainWindow.webContents.send('change-theme', 'dark');
              },
            },
          ],
        },
        {
          label: 'Edit Settings',
          click: () => {
            mainWindow.webContents.send('open-settings');
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About Electron Code Editor',
              message: 'Electron Code Editor v1.0.0',
              detail: 'A lightweight cross-platform IDE built with Electron.js',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function openFile() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'js', 'py', 'html', 'css', 'json', 'ts', 'jsx', 'tsx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      mainWindow.webContents.send('file-opened', { filePath, content });
    } catch (err) {
      dialog.showErrorBox('Error', `Failed to open file: ${err.message}`);
    }
  }
}

async function openFolder() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!canceled && filePaths.length > 0) {
    const folderPath = filePaths[0];
    mainWindow.webContents.send('folder-opened', folderPath);
  }
}

async function saveFileAs() {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md', 'js', 'py', 'html', 'css', 'json', 'ts', 'jsx', 'tsx'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (!canceled && filePath) {
    mainWindow.webContents.send('save-file-as', filePath);
  }
}

// IPC Handlers
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = items.map(item => {
      return {
        name: item.name,
        isDirectory: item.isDirectory(),
        path: path.join(dirPath, item.name),
      };
    });
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('create-file', async (event, { parentDir, fileName }) => {
  try {
    const filePath = path.join(parentDir, fileName);
    fs.writeFileSync(filePath, '', 'utf8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('create-directory', async (event, { parentDir, dirName }) => {
  try {
    const dirPath = path.join(parentDir, dirName);
    fs.mkdirSync(dirPath);
    return { success: true, dirPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('rename-item', async (event, { oldPath, newName }) => {
  try {
    const dirPath = path.dirname(oldPath);
    const newPath = path.join(dirPath, newName);
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      fs.rmdirSync(itemPath, { recursive: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-settings', async () => {
  return store.get('settings', {
    theme: 'dark',
    fontSize: 14,
    wordWrap: true,
    lineNumbers: true,
    autoSave: true,
    tabSize: 2,
    showIndentGuides: true,
  });
});

ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  return { success: true };
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);

  // Show error dialog to user
  if (mainWindow) {
    dialog.showErrorBox(
      'An error occurred',
      `An unexpected error occurred: ${error.message}\n\nThe application may need to restart.`
    );
  }
});

// Register custom protocol handler for your app (optional)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('electron-code-editor', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('electron-code-editor');
}

// Handle file/protocol arguments on macOS
app.on('open-file', (event, path) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('file-opened-from-system', path);
  } else {
    // Store the path to be opened when the window is created
    app.whenReady().then(() => {
      mainWindow.webContents.send('file-opened-from-system', path);
    });
  }
});

// Handle deep linking
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Check for protocol links or file paths in the command line args
    const url = commandLine.find(arg => arg.startsWith('electron-code-editor://'));
    if (url) {
      mainWindow.webContents.send('deep-link', url);
    }
  }
});
