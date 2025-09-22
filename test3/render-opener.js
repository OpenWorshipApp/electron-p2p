"use strict";

const POPUP_NAME = "popup_window";
const SESSION_STORAGE_KEY = 'hasOpeningPopupWindow';
const WINDOW_FEATURES = (
  "popup,top=0,left=0,width=400,height=400,scrollbars=yes,resizable=no," +
  "toolbar=no,location=no,status=no,menubar=no"
);

function openPopupWindow() {
  return window.open(
    location.href,
    POPUP_NAME,
    WINDOW_FEATURES,
  );
}


function checkPopupWindowOpening() {
  const handler = window._popupWindowHandler;
  const isOpening = handler && !handler.closed;
  if (isOpening) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
  } else {
    delete window._popupWindowHandler;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return isOpening;
}

window.getPopupWindowHandler = () => {
  if (!checkPopupWindowOpening()) {
    return null;
  }
  return window._popupWindowHandler;
};

function togglePopupWindowOpener() {
  const domOpener = document.getElementById("main-open-popup");
  const domCloser = document.getElementById("main-close-popup");
  if (checkPopupWindowOpening()) {
    domOpener.style.display = "none";
    domCloser.style.display = "block";
  } else {
    domOpener.style.display = "block";
    domCloser.style.display = "none";
  }
}

window.initForPopupWindowConnection = function (isForce = false) {
  if (isForce || sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true') {
    const existingPopup = window.open('', POPUP_NAME);
    if (existingPopup && !existingPopup.closed) {
      initPopupWindowHandler(existingPopup);
    }
  }
  togglePopupWindowOpener();
}

function initPopupWindowHandler(popupWindowHandler) {
  window._popupWindowHandler = popupWindowHandler;
  popupWindowHandler.closePopup = closePopupWindow;
  checkPopupWindowOpening();
  popupWindowHandler.wSend = wMessage;
}

function closePopupWindow() {
  window.getPopupWindowHandler()?.close();
  delete window._popupWindowHandler;
  togglePopupWindowOpener();
}

if (isMain) {
  initForPopupWindowConnection();
} else {
  window.addEventListener("load", () => {
    window.document.getElementById("close-popup").style.display = "";
    ipcRenderer.send('popup-loaded');
  });
}
