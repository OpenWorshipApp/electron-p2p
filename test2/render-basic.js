const { isMain, ipcRenderer } = window.electronAPI;

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

function pSend(message) {
  console.log(Date.now());
  connectionController.mainP?.send(message);
}

ipcRenderer.on("message", (_event, message) => {
  console.log("e", Date.now());
  console.log(message);
});
function eSend(message) {
  console.log("e", Date.now());
  ipcRenderer.send("message", message);
}

function wMessage(message) {
  console.log('w', Date.now());
  console.log(message);
}
window.wSend = (message) => {
  if (window.screenWindow) {
    console.log('w', Date.now());
    window.screenWindow.wMessage(message);
  }
}

function send(message, isForceE = false) {
  if (stateDiv.style.color !== "green" || isForceE) {
    eSend(message);
  } else {
    pSend(message);
  }
}
