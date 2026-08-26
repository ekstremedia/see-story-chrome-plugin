chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") chrome.runtime.openOptionsPage();
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:/.test(tab.url || "")) return;
  try {
    const frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["clearview.js"],
    });
    const changed = frames.reduce((n, f) => n + (f.result?.changed || 0), 0);
    await setBadge(tab.id, changed);
  } catch {
    await setBadge(tab.id, null);
  }
});

async function setBadge(tabId, changed) {
  const ok = typeof changed === "number";
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: ok ? (changed ? "#2e7d32" : "#616161") : "#c62828",
  });
  await chrome.action.setBadgeText({ tabId, text: ok ? String(changed) : "!" });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 2500);
}
