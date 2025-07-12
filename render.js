const { isMain, uuid, ipcRenderer, SimplePeer } = window.electronAPI;
const h2 = document.createElement("h2");
h2.textContent = (isMain ? "(Main)" : "") + `UUID: ${uuid}`;
document.body.appendChild(h2);
const p = new SimplePeer({
  initiator: isMain,
  trickle: false,
});
p.on("error", (err) => {
  console.log("error", err);
});
p.on("signal", (data) => {
  ipcRenderer.send("signal", {
    uuid,
    data: JSON.stringify(data),
  });
});
p.on("connect", () => {
  ipcRenderer.send("connect", {
    uuid,
  });
});
ipcRenderer.on("signal", (_event, data) => {
  p.signal(data);
});

p.on("data", (data) => {
  console.log(Date.now());
  console.log(data.toString());
});
function pSend(message) {
  console.log(Date.now());
  p.send(message);
}

ipcRenderer.on("message", (_event, message) => {
  console.log(Date.now());
  console.log(message);
});
function eSend(message) {
  console.log(Date.now());
  ipcRenderer.send("message", {
    uuid,
    message,
  });
}
