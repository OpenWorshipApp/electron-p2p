const { ipcRenderer } = require("electron");
const SimplePeer = require("simple-peer");

window.electronAPI = {
  SimplePeer,
  ipcRenderer,
  uuid: Date.now().toString(36),
  isMain: true,
};
