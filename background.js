const AMEDIA_SCRIPT_ID = "clear-view-amedia-auto";
const pendingBadges = new Map(); // tabId -> { total, timer }

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") chrome.runtime.openOptionsPage();
  await syncAmediaContentScript();
});
chrome.runtime.onStartup.addListener(syncAmediaContentScript);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && "autoAmedia" in changes) syncAmediaContentScript();
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:/.test(tab.url || "")) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["clearview.js"],
    });
  } catch {
    await setBadge(tab.id, null);
  }
});

// clearview.js reports here whether it ran from the toolbar click (allFrames,
// so one message per frame) or from the auto-registered Amedia content
// script (single frame) — debounce so a multi-frame page's badge shows the
// sum instead of whichever frame's message lands last.
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "clear-view-result" || sender.tab?.id == null) return;
  const tabId = sender.tab.id;
  const entry = pendingBadges.get(tabId) || { total: 0, timer: null };
  entry.total += message.changed;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    pendingBadges.delete(tabId);
    setBadge(tabId, entry.total);
  }, 100);
  pendingBadges.set(tabId, entry);
});

/** (Re)registers or unregisters the auto-run Amedia content script to match
 * the autoAmedia setting. The host permission itself is static (manifest.json
 * host_permissions) and always granted - this only controls whether the
 * script actually runs on those sites. */
async function syncAmediaContentScript() {
  const { host_permissions: origins = [] } = chrome.runtime.getManifest();
  if (!origins.length) return;
  const { autoAmedia = true } = await chrome.storage.sync.get({ autoAmedia: true });
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [AMEDIA_SCRIPT_ID] });
  if (autoAmedia && existing.length === 0) {
    await chrome.scripting.registerContentScripts([
      { id: AMEDIA_SCRIPT_ID, js: ["clearview.js"], matches: origins, runAt: "document_idle" },
    ]);
  } else if (!autoAmedia && existing.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: [AMEDIA_SCRIPT_ID] });
  }
}

async function setBadge(tabId, changed) {
  const ok = typeof changed === "number";
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: ok ? (changed ? "#2e7d32" : "#616161") : "#c62828",
  });
  await chrome.action.setBadgeText({ tabId, text: ok ? String(changed) : "!" });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 2500);
}
