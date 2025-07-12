const { isMain, ipcRenderer, SimplePeer } = window.electronAPI;

const h2 = document.createElement("h2");
h2.textContent = isMain ? "Main" : "";
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
  } else {
    stateDiv.textContent = "";
  }
}
setState();
if (isMain) {
  const button = document.createElement("button");
  button.textContent = "Create Peer";
  button.onclick = () => {
    ipcRenderer.send("create-peer");
  };
  document.body.appendChild(button);
}

const p = new SimplePeer({
  initiator: isMain,
  trickle: false,
});
p.on("error", (err) => {
  console.log("error", err);
});
if (isMain) {
  console.log("Generating main signal data...");
  p.on("signal", (signalData) => {
    ipcRenderer.send("main-signal-data", JSON.stringify(signalData));
    console.log("Main signal data sent:");
  });
  p.on("close", () => {
    setState("disconnected");
  });
} else {
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
  const waitSeconds = 2;
  async function attemptConnect(signalData) {
    setState("connecting");
    const isSuccess = await sendSignalToMain(signalData);
    setState(isSuccess ? "connected" : "disconnected");
    if (!isSuccess) {
      console.log(
        "Failed to connect to main window, retrying in " +
          waitSeconds +
          " seconds..."
      );
      setTimeout(() => {
        attemptConnect(signalData);
      }, waitSeconds * 1000);
      return;
    }
  }
  p.on("signal", (signalData) => {
    attemptConnect(JSON.stringify(signalData));
  });

  function loadMainSignalData() {
    const signalData = ipcRenderer.sendSync("ask-for-main-signal");
    if (signalData !== null) {
      try {
        p.signal(signalData);
        return;
      } catch (error) {
        console.error("Error setting main signal data:", error);
      }
    }
    console.log(
      "Unable to set main signal data. Retrying in " +
        waitSeconds +
        " seconds..."
    );
    setTimeout(loadMainSignalData, waitSeconds * 1000);
  }
  p.on("close", () => {
    setState("disconnected");
    loadMainSignalData();
  });
  loadMainSignalData();
}
const connectionResolvers = {};
p.on("connect", () => {
  setState("connected");
  while (connectionResolvers.length) {
    const resolver = connectionResolvers.shift();
    resolver();
  }
});
window.connectPeer = (id, signalData) => {
  const promise = new Promise((resolve) => {
    setState("connecting");
    connectionResolvers[id] = () => {
      setState("connected");
      resolve();
    };
    p.signal(signalData);
  });
  return promise;
};

// ----------------------
p.on("data", (data) => {
  console.log(Date.now());
  console.log(data.toString());
});
function pSend(message) {
  console.log(Date.now());
  p.send(message);
}

ipcRenderer.on("message", (_event, message) => {
  console.log("e", Date.now());
  console.log(message);
});
function eSend(message) {
  console.log(Date.now());
  ipcRenderer.send("message", message);
}

function send(message) {
  if (stateDiv.style.color === "green") {
    pSend(message);
  } else {
    eSend(message);
  }
}
