require.config({ paths: { 'vs': 'path/to/monaco/vs' } });
require(['vs/editor/editor.main'], () => {
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: '// Start coding here',
    language: 'javascript',
    theme: 'vs-dark',
    lineNumbers: 'on',
    folding: true,
    autoClosingBrackets: 'always',
    wordWrap: 'on'
  });
  window.editor = editor; // Expose for other scripts
});