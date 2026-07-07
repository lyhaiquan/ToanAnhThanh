// Cầu nối an toàn cho trang settings nội bộ (contextIsolation bật).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tat', {
  getServerUrl: () => ipcRenderer.invoke('settings:get'),
  saveServerUrl: (url) => ipcRenderer.invoke('settings:save', url),
});
