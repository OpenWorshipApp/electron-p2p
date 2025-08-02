const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");

function getWindows(id, isSelf = false) {
  const allWindows = BrowserWindow.getAllWindows();
  if (isSelf) {
    return allWindows.filter((win) => win.webContents.id === id);
  }
  return allWindows.filter((win) => win.webContents.id !== id);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "main-preload.js"),
    },
  });
  win.webContents.openDevTools();
  win.loadFile("index.html");
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.log("Window open handler:", url);
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          preload: path.join(__dirname, "preload.js"),
        },
      }
    };
  });
}

app.whenReady().then(async () => {
  createWindow();

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

ipcMain.on("message", (event, message) => {
  const id = event.sender.id;
  console.log("Received message from", id, ":", message);
  getWindows(id).forEach((peer) => {
    peer.webContents.send("message", message);
  });
});
