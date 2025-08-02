async function initConnection(oldP, mainSignalData = null, onError = () => { }) {
  if (oldP !== null && !oldP.destroyed) {
    console.log("Destroying old peer connection...");
    oldP.destroy();
  }
  console.log("Initializing peer connection...");
  const newP = new window.electronAPI.SimplePeer({
    initiator: !mainSignalData,
    trickle: false,
  });
  newP.on("connect", () => {
    console.log("Peer connected");
    setState("connected");
  });
  newP.on("data", (data) => {
    console.log(Date.now());
    console.log(data.toString());
  });
  newP.on("error", (err) => {
    console.log("error", err);
    onError(err);
  });
  let signalData = null;
  setState("connecting");
  if (mainSignalData) {
    console.log("Applying main signal data...");
    signalData = await new Promise((resolve) => {
      newP.once("signal", (newSignalData) => {
        console.log("Peer signal data generated");
        resolve(newSignalData);
      });
      newP.signal(mainSignalData);
    });
  } else {
    console.log("Generating main signal data...");
    signalData = await new Promise((resolve) => {
      newP.once("signal", (newSignalData) => {
        console.log("Main signal data generated");
        resolve(newSignalData);
      });
    });
  }
  return { p: newP, signalData };
}

if (isMain) {
  async function init() {
    connectionController.onPeerPData = () => { };
    console.log("Initializing main peer connection...");
    let isInitError = false;
    const pData = await initConnection(connectionController.mainP, null, () => {
      if (isInitError) return;
      isInitError = true;
      init();
    });
    const { p } = pData;
    p.on("close", () => {
      setState("disconnected");
      init();
    });
    connectionController.onPeerPData = (peerPData) => {
      console.log("Setting peer signal data");
      p.signal(peerPData.signalData);
    }
    connectionController.mainPData = pData;
  }
  init();
}
