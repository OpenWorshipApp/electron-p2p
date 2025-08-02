class ConnectionController {
  _mainPData = null;
  onPeerPData = () => { };
  onMainPData = () => { };

  get signalData() {
    return this._mainPData ? this._mainPData.signalData : null;
  }

  get p() {
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

const connectionController = new ConnectionController();

function toggleScreenOpener() {
  const domOpener = document.getElementById("open-screen");
  const domCloser = document.getElementById("close-screen");
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
    if (window.screenWindow) {
      window.screenWindow.close();
    }
  });
  connectionController.onMainPData = async () => {
    if (connectionController.signalData === null || connectionController.p === null) {
      console.log("No P data available");
      return;
    }
    console.log("Main signal data updated:", connectionController.signalData);
    const peerPData = await window.screenWindow.initConnection(
      connectionController.signalData,
    );
    connectionController.onPeerPData(peerPData);
  }
  if (connectionController.mainPData) {
    connectionController.onMainPData();
  }
  toggleScreenOpener();
}

function closeScreenWindow() {
  if (window.screenWindow) {
    window.screenWindow.close();
    delete window.screenWindow;
  }
  toggleScreenOpener();
}

if (isMain) {
  toggleScreenOpener();
}
