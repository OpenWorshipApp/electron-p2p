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
  let windowFeatures = (
    "popup,top=0,left=0,width=400,height=400,scrollbars=yes,resizable=no," +
    "toolbar=no,location=no,status=no,menubar=no"
  );
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
    handle.addEventListener("beforeunload", () => {
      delete window.screenWindow;
      toggleScreenOpener();
    });
    handle.document.getElementById("close-screen").style.display = "";
    handle.wSend = wMessage;
  });
  toggleScreenOpener();
}

function closeScreenWindow() {
  window.screenWindow.close();
}

if (isMain) {
  toggleScreenOpener();
}
