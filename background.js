// ======================== RTL Smart Companion - Background ========================

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("rtlEnabled", (data) => {
    if (data.rtlEnabled === undefined) {
      chrome.storage.sync.set({ rtlEnabled: true });
    }
    updateIcon(data.rtlEnabled !== false);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get("rtlEnabled", (data) => {
    updateIcon(data.rtlEnabled !== false);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStatus") {
    chrome.storage.sync.get("rtlEnabled", (data) => {
      sendResponse({ enabled: data.rtlEnabled !== false });
    });
    return true;
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get("rtlEnabled", (data) => {
    const currentState = data.rtlEnabled !== false;
    const newState = !currentState;

    chrome.storage.sync.set({ rtlEnabled: newState }, () => {
      updateIcon(newState);
      chrome.tabs
        .sendMessage(tab.id, { action: "toggleRTL", enabled: newState })
        .catch(() => {});
    });
  });
});

function updateIcon(enabled) {
  chrome.action.setIcon({
    path: {
      16: `icons/icon16.png`,
      48: `icons/icon48.png`,
      128: `icons/icon128.png`,
    },
  });

  chrome.action.setTitle({
    title: enabled
      ? "RTL Smart Companion - فعال (کلیک برای غیرفعال)"
      : "RTL Smart Companion - غیرفعال (کلیک برای فعال)",
  });
}
