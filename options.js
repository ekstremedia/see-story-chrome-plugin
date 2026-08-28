const DEFAULTS = {
  unblur: true,
  unfade: true,
  unlockScroll: true,
  autoAmedia: true,
  watchSeconds: 30,
  rules: [],
};

const $ = (id) => document.getElementById(id);
const TOGGLES = ["unblur", "unfade", "unlockScroll", "autoAmedia"];
const rulesEl = $("rules");

const readRules = () =>
  [...rulesEl.querySelectorAll(".rule")].map((el) => {
    const field = (name) => el.querySelector(`[data-field="${name}"]`);
    return {
      enabled: field("enabled").checked,
      name: field("name").value.trim(),
      match: field("match").value.trim(),
      hide: field("hide").value.trim(),
      css: field("css").value.trim(),
    };
  });

const addRule = (rule = {}) => {
  const node = $("rule-template").content.firstElementChild.cloneNode(true);
  const field = (name) => node.querySelector(`[data-field="${name}"]`);
  field("enabled").checked = rule.enabled !== false;
  field("name").value = rule.name || "";
  field("match").value = rule.match || "";
  field("hide").value = rule.hide || "";
  field("css").value = rule.css || "";
  node.querySelector('[data-action="delete"]').addEventListener("click", () => {
    node.remove();
    refreshEmpty();
  });
  rulesEl.appendChild(node);
  refreshEmpty();
  return node;
};

const refreshEmpty = () => {
  $("empty").hidden = rulesEl.children.length > 0;
};

const say = (message) => {
  $("status").textContent = message;
  setTimeout(() => ($("status").textContent = ""), 2500);
};

const load = async () => {
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  for (const key of TOGGLES) $(key).checked = Boolean(settings[key]);
  $("watchSeconds").value = settings.watchSeconds;
  rulesEl.replaceChildren();
  settings.rules.forEach(addRule);
  refreshEmpty();
};

const save = async () => {
  const settings = {
    watchSeconds: Math.max(0, Math.min(300, Number($("watchSeconds").value) || 0)),
    rules: readRules().filter((r) => r.match || r.hide || r.css),
  };
  for (const key of TOGGLES) settings[key] = $(key).checked;
  try {
    await chrome.storage.sync.set(settings);
    say("Saved.");
  } catch (e) {
    // sync storage caps a single item at 8 KB
    say(`Could not save: ${e.message}`);
  }
};

$("add").addEventListener("click", () => addRule().querySelector('[data-field="name"]').focus());
$("save").addEventListener("click", save);

$("export").addEventListener("click", async () => {
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "amediaid-settings.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("import").addEventListener("click", () => $("file").click());

$("file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.rules)) throw new Error("no rules array");
    // A malformed rule breaks both this page and the injected script, so
    // check every entry before anything is written.
    data.rules.forEach((rule, i) => {
      if (!rule || typeof rule !== "object") throw new Error(`rule ${i + 1} is not an object`);
      for (const field of ["name", "match", "hide", "css"]) {
        if (rule[field] !== undefined && typeof rule[field] !== "string") {
          throw new Error(`rule ${i + 1}: ${field} is not text`);
        }
      }
      if (rule.enabled !== undefined && typeof rule.enabled !== "boolean") {
        throw new Error(`rule ${i + 1}: enabled is not true or false`);
      }
    });
    await chrome.storage.sync.set({ ...DEFAULTS, ...data });
    await load();
    say("Imported.");
  } catch (e) {
    say(`Not a valid settings file: ${e.message}`);
  }
  event.target.value = "";
});

load();
