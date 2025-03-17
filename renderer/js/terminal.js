const Terminal = require('xterm').Terminal;
const term = new Terminal();
term.open(document.getElementById('terminal'));
term.onData(data => {
  window.electronAPI.terminalCommand(data).then(output => term.write(output));
});