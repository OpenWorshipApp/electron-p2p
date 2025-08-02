class ConnectionController {
  _mainPData = null;
  onPeerPData = () => { };
  onMainPData = () => { };

  get mainSignalData() {
    return this._mainPData ? this._mainPData.signalData : null;
  }

  get mainP() {
    return this._mainPData ? this._mainPData.p : null;
  }

  get mainPData() {
    return this._mainPData;
  }

  set mainPData(pData) {
    this._mainPData = pData;
    this.onMainPData(pData.signalData);
  }
}

window.connectionController = new ConnectionController();

function toggleScreenOpener() {
  const domOpener = document.getElementById("main-open-screen");
  const domCloser = document.getElementById("main-close-screen");
  if (window.screenWindow) {
    domOpener.style.display = "none";
    domCloser.style.display = "block";
  } else {
    domOpener.style.display = "block";
    domCloser.style.display = "none";
  }
}

function openScreenWindow() {
  console.log('open');
  let windowFeatures = "popup,top=0,left=0,width=400,height=400,scrollbars=yes,resizable=no,toolbar=no,location=no,status=no,menubar=no";
  const handle = window.open(
    location.href,
    "screen",
    windowFeatures,
  );
  if (!handle) {
    alert("Failed to open window. Please allow pop-ups for this site.");
    return;
  }
  window.screenWindow = handle;
  window.addEventListener("beforeunload", () => {
    if (handle) {
      handle.close();
    }
  });
  handle.addEventListener("load", () => {
    connectionController.onMainPData = async () => {
      if (
        connectionController.mainSignalData === null ||
        connectionController.mainP === null ||
        !handle
      ) {
        console.log("Window is not ready for connection");
        return;
      }
      const peerPData = await handle.initConnection(
        null, connectionController.mainSignalData,
      );
      connectionController.onPeerPData(peerPData);
    }
    handle.addEventListener("beforeunload", () => {
      connectionController.onMainPData = () => { };
      delete window.screenWindow;
      toggleScreenOpener();
    });
    handle.document.getElementById("close-screen").style.display = "";
    handle.wSend = wMessage;
    if (connectionController.mainPData) {
      connectionController.onMainPData();
    }
  });
  toggleScreenOpener();
}

function closeScreenWindow() {
  window.screenWindow.close();
}

if (isMain) {
  toggleScreenOpener();
}
