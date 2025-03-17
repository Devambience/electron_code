const tabs = document.getElementById('tabs');
let openTabs = [];

function addTab(file) {
  const tab = document.createElement('div');
  tab.textContent = file.name;
  tab.draggable = true;
  tab.addEventListener('click', () => window.editor.setModel(file.model));
  tabs.appendChild(tab);
  openTabs.push({ tab, model: file.model });
}