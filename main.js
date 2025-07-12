const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");

let mainUuid;
const windows = {};
const pSignalData = {};
function otherWindows(uuid) {
  return Object.keys(windows)
    .filter((key) => {
      return key !== uuid;
    })
    .map((key) => {
      return windows[key];
    });
}
function createWindow(isMain = false) {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        preload: path.join(__dirname, (isMain ? "main-" : "") + "preload.js"),
      },
    });
    win.webContents.openDevTools();
    win.loadFile("index.html");
    if (isMain) {
      ipcMain.once("signal", (_event, { uuid, data }) => {
        mainUuid = uuid;
        pSignalData[mainUuid] = data;
        windows[mainUuid] = win;
        resolve();
      });
    } else {
      ipcMain.once("signal", (_event, { uuid, data }) => {
        pSignalData[uuid] = data;
        windows[uuid] = win;
        ipcMain.once("connect", () => {
          resolve();
        });
        windows[mainUuid].webContents.send("signal", data);
      });
      win.webContents.once("did-finish-load", () => {
        win.webContents.send("signal", pSignalData[mainUuid]);
      });
    }
  });
}

app.whenReady().then(async () => {
  await createWindow(true);
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.on("message", (_event, { uuid, message }) => {
  console.log(uuid, message);
  otherWindows(uuid).forEach((peer) => {
    peer.webContents.send("message", message);
  });
});
