const { isMain, ipcRenderer, SimplePeer } = window.electronAPI;

const h2 = document.createElement("h2");
h2.textContent = isMain ? "Main" : "";
h2.style.color = isMain ? "blue" : "black";
document.body.appendChild(h2);
const stateDiv = document.createElement("div");
document.body.appendChild(stateDiv);
function setState(state) {
  if (state === "connecting") {
    stateDiv.textContent = "State: Connecting...";
    stateDiv.style.color = "orange";
  } else if (state === "connected") {
    stateDiv.textContent = "State: Connected";
    stateDiv.style.color = "green";
  } else if (state === "disconnected") {
    stateDiv.textContent = "State: Disconnected";
    stateDiv.style.color = "red";
  }
}

const waitSeconds = 2;
const connectionResolvers = [];
function resolveAll(isSuccess) {
  while (connectionResolvers.length) {
    const [_id, resolver] = connectionResolvers.shift();
    resolver(isSuccess);
  }
}
window.connectPeer = (id, signalData) => {
  if (!window.p) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    console.log("Setting peer signal data");
    const timeout = setTimeout(() => {
      console.log("Connection timed out");
      resolveAll(false);
    }, 10000);
    connectionResolvers.push([
      id,
      (isSuccess) => {
        clearTimeout(timeout);
        resolve(isSuccess);
      },
    ]);
    window.p.signal(signalData);
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
      console.log(
        "Failed to connect to main window, retrying in " +
          waitSeconds +
          " seconds..."
      );
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
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
  console.log("Initializing peer connection...");
  if (window.p) {
    if (!window.p.destroyed) {
      window.p.destroy();
    }
    window.p = null;
  }
  setState("connecting");
  const p = new SimplePeer({
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

// ----------------------
function pSend(message) {
  console.log(Date.now());
  window.p?.send(message);
}

ipcRenderer.on("message", (_event, message) => {
  console.log("e", Date.now());
  console.log(message);
});
function eSend(message) {
  console.log(Date.now());
  ipcRenderer.send("message", message);
}

function send(message, isForceE = false) {
  if (stateDiv.style.color !== "green" || isForceE) {
    eSend(message);
  } else {
    pSend(message);
  }
}

function createWindow(isMain = false) {
  ipcRenderer.send("create-peer", isMain);
}
