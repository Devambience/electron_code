document.getElementById('search-btn').addEventListener('click', () => {
    window.editor.getAction('actions.find').run();
  });