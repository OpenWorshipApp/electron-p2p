const { ipcRenderer } = require("electron");
const SimplePeer = require("simple-peer");

window.electronAPI = {
  SimplePeer,
  ipcRenderer,
  isMain: false,
};
