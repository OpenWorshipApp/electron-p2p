const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("node:path");

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
  win.webContents.setWindowOpenHandler((handler) => {
    console.log("Window open handler:", handler.url);
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
  return win;
}

let mainWindow = null;
app.whenReady().then(async () => {
  mainWindow = createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("popup-loaded", () => {
  mainWindow.webContents.send("popup-loaded");
  mainWindow.webContents
    .executeJavaScript(`
      window.initForPopupWindowConnection(true);
    `);
});