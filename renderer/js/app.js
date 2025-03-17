import { initMonacoEditor } from './editor.js';
import { initSidebar } from './sidebar.js';
import { initTerminal } from './terminal.js';
import { initTabs } from './tabs.js';
import { initSearch } from './search.js';
import { initSettings } from './settings.js';

// Global state
window.state = {
  editor: null,
  models: {},
  currentFile: null,
  currentDirectory: null,
  tabs: [],
  activeTab: null,
  terminals: [],
  activeTerminal: null,
  settings: {},
  isDarkTheme: true,
  isTerminalOpen: true,
  isSidebarOpen: true
};

// Initialize the application
async function initApp() {
  try {
    // Load settings
    await initSettings();
    
    // Initialize Monaco editor
    await initMonacoEditor();
    
    // Initialize sidebar
    initSidebar();
    
    // Initialize terminal
    initTerminal();
    
    // Initialize tabs
    initTabs();
    
    // Initialize search
    initSearch();
    
    // Register event listeners
    registerEventListeners();
    
    // Apply initial theme
    applyTheme();
    
    console.log('Code Editor initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// Register global event listeners
function registerEventListeners() {
  // Listen for menu events from main process
  window.api.on('menu-new-file', () => {
    createNewFile();
  });
  
  window.api.on('menu-open-file', (filePath) => {
    openFile(filePath);
  });
  
  window.api.on('menu-open-folder', (folderPath) => {
    openFolder(folderPath);
  });

  window.api.on('menu-save-file', () => {
    saveCurrentFile();
  });
  
  window.api.on('menu-save-file-as', () => {
    saveCurrentFileAs();
  });
  
  window.api.on('menu-find', () => {
    toggleSearchPanel(true);
  });
  
  window.api.on('menu-replace', () => {
    toggleSearchPanel(true, true);
  });
  
  window.api.on('menu-toggle-sidebar', () => {
    toggleSidebar();
  });
  
  window.api.on('menu-toggle-terminal', () => {
    toggleTerminal();
  });
  
  window.api.on('menu-toggle-word-wrap', () => {
    toggleWordWrap();
  });
  
  window.api.on('menu-toggle-line-numbers', () => {
    toggleLineNumbers();
  });
  
  window.api.on('menu-new-terminal', () => {
    createNewTerminal();
  });
  
  window.api.on('menu-clear-terminal', () => {
    clearActiveTerminal();
  });
  
  window.api.on('menu-open-settings', () => {
    openSettings();
  });
  
  // Listen for file drops
  document.addEventListener('file-dropped', (event) => {
    const path = event.detail.path;
    
    // Check if it's a directory or file
    fs.stat(path, (err, stats) => {
      if (err) return console.error(err);
      
      if (stats.isDirectory()) {
        openFolder(path);
      } else {
        openFile(path);
      }
    });
  });
  
  // Window resize event
  window.addEventListener('resize', () => {
    if (window.state.editor) {
      window.state.editor.layout();
    }
  });
}

// Create a new untitled file
function createNewFile() {
  const model = monaco.editor.createModel('', 'plaintext');
  const id = `untitled-${Date.now()}`;
  
  window.state.models[id] = {
    model,
    path: null,
    isUntitled: true,
    isDirty: false
  };
  
  addTab({
    id,
    title: 'Untitled',
    path: null,
    isUntitled: true
  });
}

// Open file
async function openFile(filePath) {
  try {
    const result = await window.api.readFile(filePath);
    
    if (result.success) {
      const fileName = window.api.path.basename(filePath);
      const fileExt = window.api.path.extname(filePath).toLowerCase();
      const language = getLanguageFromExt(fileExt);
      
      // Check if file is already open
      const existingTabIndex = window.state.tabs.findIndex(tab => tab.path === filePath);
      if (existingTabIndex !== -1) {
        setActiveTab(existingTabIndex);
        return;
      }
      
      const model = monaco.editor.createModel(result.content, language);
      const id = `file-${Date.now()}`;
      
      window.state.models[id] = {
        model,
        path: filePath,
        isUntitled: false,
        isDirty: false
      };
      
      addTab({
        id,
        title: fileName,
        path: filePath,
        isUntitled: false
      });
    } else {
      console.error('Failed to open file:', result.error);
    }
  } catch (error) {
    console.error('Error opening file:', error);
  }
}

// Open folder
async function openFolder(folderPath) {
  try {
    const result = await window.api.readDirectory(folderPath);
    
    if (result.success) {
      window.state.currentDirectory = folderPath;
      
      // Update sidebar with folder contents
      updateFileExplorer(folderPath, result.items);
      
      // Show folder name in UI
      document.title = `Code Editor - ${window.api.path.basename(folderPath)}`;
    } else {
      console.error('Failed to open folder:', result.error);
    }
  } catch (error) {
    console.error('Error opening folder:', error);
  }
}

// Save current file
async function saveCurrentFile() {
  if (!window.state.activeTab) return;
  
  const tab = window.state.tabs[window.state.activeTab];
  const modelInfo = window.state.models[tab.id];
  
  if (!modelInfo) return;
  
  if (modelInfo.isUntitled) {
    // If untitled, save as
    await saveCurrentFileAs();
  } else {
    // Save to existing path
    const content = modelInfo.model.getValue();
    
    try {
      const result = await window.api.writeFile(modelInfo.path, content);
      
      if (result.success) {
        modelInfo.isDirty = false;
        updateTabTitle(window.state.activeTab);
      } else {
        console.error('Failed to save file:', result.error);
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }
}

// Save current file as
async function saveCurrentFileAs() {
  if (!window.state.activeTab) return;
  
  const tab = window.state.tabs[window.state.activeTab];
  const modelInfo = window.state.models[tab.id];
  
  if (!modelInfo) return;
  
  try {
    const result = await window.api.showSaveDialog();
    
    if (result.success && !result.canceled) {
      const content = modelInfo.model.getValue();
      const saveResult = await window.api.writeFile(result.filePath, content);
      
      if (saveResult.success) {
        // Update model info
        modelInfo.path = result.filePath;
        modelInfo.isUntitled = false;
        modelInfo.isDirty = false;
        
        // Update tab info
        tab.title = window.api.path.basename(result.filePath);
        tab.path = result.filePath;
        tab.isUntitled = false;
        
        // Update UI
        updateTabTitle(window.state.activeTab);
      } else {
        console.error('Failed to save file:', saveResult.error);
      }
    }
  } catch (error) {
    console.error('Error in save as:', error);
  }
}

// Toggle sidebar
function toggleSidebar() {
  window.state.isSidebarOpen = !window.state.isSidebarOpen;
  
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed', !window.state.isSidebarOpen);
  
  // Update editor layout
  window.state.editor.layout();
}

// Toggle terminal
function toggleTerminal() {
  window.state.isTerminalOpen = !window.state.isTerminalOpen;
  
  const terminalContainer = document.getElementById('terminal-container');
  terminalContainer.classList.toggle('collapsed', !window.state.isTerminalOpen);
  
  // Update editor layout
  window.state.editor.layout();
  
  // If opening terminal, ensure the active terminal is updated
  if (window.state.isTerminalOpen && window.state.activeTerminal !== null) {
    const terminal = window.state.terminals[window.state.activeTerminal];
    if (terminal && terminal.xterm) {
      terminal.xterm.focus();
      terminal.xterm.fit();
    }
  }
}

// Toggle word wrap
function toggleWordWrap() {
  const currentValue = window.state.editor.getOption(monaco.editor.EditorOption.wordWrap);
  const newValue = currentValue === 'off' ? 'on' : 'off';
  
  window.state.editor.updateOptions({ wordWrap: newValue });
  
  // Update settings
  window.state.settings.wordWrap = newValue;
  saveSettings();
}

// Toggle line numbers
function toggleLineNumbers() {
  const currentValue = window.state.editor.getOption(monaco.editor.EditorOption.lineNumbers);
  const newValue = currentValue === 'on' ? 'off' : 'on';
  
  window.state.editor.updateOptions({ lineNumbers: newValue });
  
  // Update settings
  window.state.settings.lineNumbers = newValue;
  saveSettings();
}

// Toggle search panel
function toggleSearchPanel(show = true, showReplace = false) {
  const searchPanel = document.getElementById('search-panel');
  searchPanel.classList.toggle('visible', show);
  
  if (show) {
    const searchInput = document.getElementById('search-input');
    const replaceInput = document.getElementById('replace-input');
    
    // Show/hide replace input
    replaceInput.style.display = showReplace ? 'block' : 'none';
    
    // Focus search input
    searchInput.focus();
    searchInput.select();
  }
}

// Open settings
function openSettings() {
  // Create a new tab with settings JSON
  const settingsJson = JSON.stringify(window.state.settings, null, 2);
  const model = monaco.editor.createModel(settingsJson, 'json');
  const id = `settings-${Date.now()}`;
  
  window.state.models[id] = {
    model,
    path: 'settings.json',
    isUntitled: false,
    isDirty: false,
    isSettings: true
  };
  
  addTab({
    id,
    title: 'Settings',
    path: 'settings.json',
    isUntitled: false,
    isSettings: true
  });
}

// Apply theme based on settings
function applyTheme() {
  const isDark = window.state.settings.theme === 'dark';
  window.state.isDarkTheme = isDark;
  
  // Update CSS theme
  const themeStylesheet = document.getElementById('theme-stylesheet');
  themeStylesheet.href = isDark ? 'styles/themes/dark.css' : 'styles/themes/light.css';
  
  // Update Monaco editor theme
  monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
}

// Save settings
async function saveSettings() {
  try {
    await window.api.setSettings(window.state.settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Get language ID from file extension
function getLanguageFromExt(ext) {
  const langMap = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'javascript',
    '.tsx': 'typescript',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.py': 'python',
    '.md': 'markdown',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'cpp',
    '.java': 'java',
    '.go': 'go',
    '.php': 'php',
    '.rb': 'ruby',
    '.rs': 'rust',
    '.sh': 'shell',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml'
  };
  
  return langMap[ext] || 'plaintext';
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);