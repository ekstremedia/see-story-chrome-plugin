const AMEDIA_SCRIPT_ID = "clear-view-amedia-auto";
const pendingBadges = new Map(); // tabId -> { total, timer }

// (Re)registers or unregisters the auto-run Amedia content script to match
// whether its optional host permission is currently granted. Off by default -
// granting it requires the user to check the options-page box, which is the
// user gesture Chrome requires for chrome.permissions.request() anyway.
//
// Queued through amediaSync rather than called directly: onInstalled,
// onStartup and onAdded/onRemoved can all fire close together, and two
// overlapping calls could each read a stale permission state and leave the
// registration out of sync with it.
let amediaSync = Promise.resolve();
const syncAmediaContentScript = () => (amediaSync = amediaSync.catch(() => {}).then(syncAmediaContentScriptNow));

async function syncAmediaContentScriptNow() {
  const { optional_host_permissions: origins = [] } = chrome.runtime.getManifest();
  if (!origins.length) return;
  const has = await chrome.permissions.contains({ origins });
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [AMEDIA_SCRIPT_ID] });
  if (has && existing.length === 0) {
    await chrome.scripting.registerContentScripts([
      { id: AMEDIA_SCRIPT_ID, js: ["clearview.js"], matches: origins, runAt: "document_idle" },
    ]);
  } else if (!has && existing.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: [AMEDIA_SCRIPT_ID] });
  }
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") chrome.runtime.openOptionsPage();
  await syncAmediaContentScript();
});
chrome.runtime.onStartup.addListener(syncAmediaContentScript);
chrome.permissions.onAdded.addListener(syncAmediaContentScript);
chrome.permissions.onRemoved.addListener(syncAmediaContentScript);

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

// Every call here can reject if the tab closed first, so it swallows its own
// errors: the callers are a message listener and a catch block, neither of
// which has anywhere to put a rejection except the service worker console.
async function setBadge(tabId, changed) {
  const ok = typeof changed === "number";
  try {
    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: ok ? (changed ? "#2e7d32" : "#616161") : "#c62828",
    });
    await chrome.action.setBadgeText({ tabId, text: ok ? String(changed) : "!" });
  } catch {
    return;
  }
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {}), 2500);
}
