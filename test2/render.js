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

function generateMainSignalData(p) {
  return new Promise((resolve) => {
    setState("connecting");
    console.log("Generating main signal data...");
    p.once("signal", (signalData) => {
      console.log("Main signal data sent");
      resolve(JSON.stringify(signalData));
    });
  });
}

function initPeer(p, signalData) {
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
  p.signal(signalData);
}
let timeOutId = null;
function reInit() {
  if (timeOutId !== null) {
    clearTimeout(timeOutId);
  }
  timeOutId = setTimeout(() => {
    timeOutId = null;
    initConnection();
  }, waitSeconds * 1000);
}

async function initConnection(p, mainSignalData) {
  console.log("Initializing peer connection...");
  if (p !== null && !p.destroyed) {
    p.destroy();
  }
  const p = new window.electronAPI.SimplePeer({
    initiator: !mainSignalData,
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
  p.on("data", (data) => {
    console.log(Date.now());
    console.log(data.toString());
  });
  p.on("close", () => {
    setState("disconnected");
    reInit();
  });
  let signalData = null;
  setState("connecting");
  if (mainSignalData) {
    console.log("Applying main signal data...");
    signalData = await new Promise((resolve) => {
      p.once("signal", (newSignalData) => {
        console.log("Peer signal data generated");
        resolve(JSON.stringify(newSignalData));
      });
      p.signal(signalData);
    });
  } else {
    console.log("Generating main signal data...");
    signalData = await new Promise((resolve) => {
      p.once("signal", (newSignalData) => {
        console.log("Main signal data generated");
        resolve(JSON.stringify(newSignalData));
      });
    });
  }
  return { p, signalData };
}

if (isMain) {
  initConnection().then((pData) => {
    connectionController.onPeerPData = (peerPData) => {
      pData.p.setRemoteDescription(peerPData);
    }
    connectionController.mainPData = pData;
  });
}
