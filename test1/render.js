const waitSeconds = 2;
const connectionResolvers = [];
function resolveAll(isSuccess) {
  while (connectionResolvers.length) {
    const resolver = connectionResolvers.shift();
    resolver(isSuccess);
  }
}
window.connectPeer = (signalData) => {
  const p = window.p;
  if (!p) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    console.log("Setting peer signal data");
    const timeout = setTimeout(() => {
      console.log("Connection timed out");
      resolveAll(false);
    }, 5000);
    connectionResolvers.push((isSuccess) => {
      clearTimeout(timeout);
      resolve(isSuccess);
    });
    p.signal(signalData);
  });
};

function initMain(p) {
  console.log("Generating main signal data...");
  p.on("signal", (signalData) => {
    ipcRenderer.send("main-signal-data", JSON.stringify(signalData));
    console.log("Main signal data sent");
  });
}

function initPeer(p) {
  function sendSignalToMain(signalData) {
    return new Promise((resolve) => {
      const returnEventName = "signal-received";
      ipcRenderer.once(returnEventName, (_event, isSuccess) => {
        resolve(isSuccess);
      });
      ipcRenderer.send("give-signal-for-main", {
        signalData,
        returnEventName,
      });
    });
  }
  p.on("signal", async (signalData) => {
    console.log("Sending signal to main...");
    const isSuccess = await sendSignalToMain(JSON.stringify(signalData));
    if (!isSuccess) {
      p.destroy();
      return;
    }
  });

  function loadMainSignalData() {
    setState("connecting");
    console.log("Asking for main signal data...");
    const signalData = ipcRenderer.sendSync("ask-for-main-signal");
    if (signalData !== null) {
      console.log("Setting main signal data");
      p.signal(signalData);
      return;
    }
    console.log("Main signal data not found, destroying peer");
    p.destroy();
  }
  loadMainSignalData();
}
let timeOutId = null;
function reInit() {
  if (timeOutId !== null) {
    clearTimeout(timeOutId);
  }
  timeOutId = setTimeout(() => {
    timeOutId = null;
    init();
  }, waitSeconds * 1000);
}
function init() {
  if (isMain) {
    ipcRenderer.send("main-signal-data", null);
  }
  console.log("Initializing peer connection...");
  resolveAll(false);
  if (window.p) {
    if (!window.p.destroyed) {
      window.p.destroy();
    }
    window.p = null;
  }
  setState("connecting");
  const p = new window.electronAPI.SimplePeer({
    initiator: isMain,
    trickle: false,
  });
  p.on("error", (err) => {
    console.log("error", err);
    reInit();
  });
  p.on("connect", () => {
    console.log("Peer connected");
    setState("connected");
    resolveAll(true);
  });
  if (isMain) {
    ipcRenderer.send("main-signal-data", null);
    initMain(p);
  } else {
    initPeer(p);
  }
  p.on("data", (data) => {
    console.log(Date.now());
    console.log(data.toString());
  });
  p.on("close", () => {
    setState("disconnected");
    reInit();
  });
  window.p = p;
}

init();
