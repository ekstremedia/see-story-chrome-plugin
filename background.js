chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:/.test(tab.url || "")) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["seestory.js"],
    });
    await setBadge(tab.id, result);
  } catch (e) {
    await setBadge(tab.id, null);
  }
});

async function setBadge(tabId, result) {
  const ok = result && result.removed >= 0;
  await chrome.action.setBadgeBackgroundColor({ tabId, color: ok ? "#2e7d32" : "#c62828" });
  await chrome.action.setBadgeText({ tabId, text: ok ? String(result.removed) : "!" });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 2500);
}
