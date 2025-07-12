const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");

const mainData = {
  id: null,
  signalData: null,
};
function checkIsMainId(id) {
  return mainData.id === id;
}
const windows = {};
function otherWindows(id) {
  return Object.keys(windows)
    .filter((key) => {
      const keyId = parseInt(key, 10);
      if (checkIsMainId(id)) {
        return keyId !== id;
      }
      return checkIsMainId(keyId);
    })
    .map((key) => {
      return windows[key];
    });
}

function createWindow(isMain = false) {
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
  const id = win.webContents.id;
  if (isMain) {
    mainData.id = id;
  }
  windows[id] = win;
  win.on("closed", () => {
    if (isMain) {
      mainData.id = null;
      mainData.signalData = null;
    }
    delete windows[id];
  });
}

async function createAllWindows() {
  createWindow(true);
  while (true) {
    if (mainData.signalData !== null) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  createWindow();
}

app.whenReady().then(async () => {
  createAllWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createAllWindows();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("create-peer", (_event, isMain) => {
  createWindow(isMain);
});

ipcMain.on("main-signal-data", (_event, signalData) => {
  mainData.signalData = signalData;
});
ipcMain.on("ask-for-main-signal", (event) => {
  event.returnValue = mainData.signalData;
});
ipcMain.on("give-signal-for-main", (event, { signalData, returnEventName }) => {
  const mainWindow = windows[mainData.id];
  if (!mainWindow) {
    event.sender.send(returnEventName, false);
    return;
  }
  mainWindow.webContents
    .executeJavaScript(`window.connectPeer(${signalData});`)
    .then((isSuccess) => {
      event.sender.send(returnEventName, isSuccess);
    });
});

ipcMain.on("message", (event, message) => {
  const id = event.sender.id;
  console.log("Received message from", id, ":", message);
  otherWindows(id).forEach((peer) => {
    peer.webContents.send("message", message);
  });
});
