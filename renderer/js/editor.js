// Initialize Monaco Editor
export async function initMonacoEditor() {
  return new Promise((resolve, reject) => {
    require(['vs/editor/editor.main'], () => {
      try {
        // Create editor instance
        window.state.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
          value: '',
          language: 'plaintext',
          theme: window.state.settings.theme === 'light' ? 'vs' : 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: window.state.settings.minimap || false },
          scrollBeyondLastLine: false,
          lineNumbers: window.state.settings.lineNumbers || 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'blink',
          cursorSmoothCaretAnimation: true,
          smoothScrolling: true,
          contextmenu: true,
          fontSize: window.state.settings.fontSize || 14,
          fontFamily: window.state.settings.fontFamily || "'Consolas', 'Courier New', monospace",
          wordWrap: window.state.settings.wordWrap || 'off',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          folding: true,
          foldingHighlight: true,
          renderWhitespace: 'none',
          copyWithSyntaxHighlighting: true,
          autoIndent: 'full',
          formatOnType: true,
          formatOnPaste: true,
          tabSize: window.state.settings.tabSize || 4,
          insertSpaces: window.state.settings.insertSpaces !== false,
          detectIndentation: true,
          multiCursorModifier: 'alt',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoSurround: 'languageDefined',
          links: true,
          mouseWheelZoom: true,
        });

        // Register change event for dirty indicator
        window.state.editor.onDidChangeModelContent((event) => {
          if (window.state.activeTab !== null) {
            const tab = window.state.tabs[window.state.activeTab];
            const model = window.state.models[tab.id];
            
            if (model && !model.isDirty) {
              model.isDirty = true;
              updateTabTitle(window.state.activeTab);
            }
            
            // Handle settings file changes
            if (model && model.isSettings) {
              try {
                const content = model.model.getValue();
                const newSettings = JSON.parse(content);
                window.state.settings = newSettings;
                applyTheme();
              } catch (error) {
                // Invalid JSON, ignore
              }
            }
          }
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Set active model in editor
export function setEditorModel(modelId) {
  if (!window.state.models[modelId]) return;
  
  const modelInfo = window.state.models[modelId];
  window.state.editor.setModel(modelInfo.model);
  
  // Apply language-specific settings
  const language = modelInfo.model.getLanguageId();
  applyLanguageSettings(language);
}

// Apply language-specific settings to editor
function applyLanguageSettings(language) {
  // Default settings for all languages
  const defaultSettings = {
    tabSize: window.state.settings.tabSize || 4,
    insertSpaces: window.state.settings.insertSpaces !== false
  };
  
  // Language-specific settings
  const languageSettings = {
    'python': {
      tabSize: 4,
      insertSpaces: true
    },
    'javascript': {
      tabSize: 2,
      insertSpaces: true
    },
    'typescript': {
      tabSize: 2,
      insertSpaces: true
    },
    'html': {
      tabSize: 2,
      insertSpaces: true
    },
    'css': {
      tabSize: 2,