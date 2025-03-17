const { Menu } = require('electron');

const template = [
  {
    label: 'File',
    submenu: [{ label: 'Open', click: () => console.log('Open clicked') }]
  },
  { label: 'Edit' },
  { label: 'View' },
  { label: 'Terminal' },
  { label: 'Settings' }
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));