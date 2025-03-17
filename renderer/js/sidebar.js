const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('drop', async (e) => {
  e.preventDefault();
  const folderPath = e.dataTransfer.files[0].path;
  const files = await window.electronAPI.openFile(folderPath);
  // Render file tree (simplified example)
  sidebar.innerHTML = `<ul>${files.map(f => `<li>${f.name}</li>`).join('')}</ul>`;
});

sidebar.addEventListener('dragover', (e) => e.preventDefault());