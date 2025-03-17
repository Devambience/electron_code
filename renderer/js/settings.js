async function loadSettings() {
    const settings = await window.electronAPI.getSettings();
    monaco.editor.setTheme(settings.theme || 'vs-dark');
  }