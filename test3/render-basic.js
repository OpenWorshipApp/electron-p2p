const { isMain } = window.electronAPI;

function consoleLog(...args) {
  console.log(...args);
  const p = document.createElement("p");
  p.textContent = args.join(" ");
  document.getElementById("message").appendChild(p);
}
function wMessage(message) {
  consoleLog('w', Date.now());
  consoleLog(message);
}
window.wSend = (message) => {
  if (window.screenWindow) {
    consoleLog('w', Date.now());
    window.screenWindow.wMessage(message);
  }
}
