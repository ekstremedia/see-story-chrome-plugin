const DEFAULTS = {
  clearStyling: true,
  hideConsent: false,
  hideAds: false,
  watchSeconds: 30,
  rules: [],
};

const STRINGS = {
  nb: {
    tagline: "Fjerner betalingsmurer hos Amedia. Klikk ikonet for å rydde andre sider.",
    secAuto: "Automatisk",
    autoTitle: "På Amedia-sider",
    autoNote: "Rydder betalingsmuren mens siden lastes.",
    grantsSummary: "Hva Chrome gir tilgang til",
    grantsBody:
      "Tilgang til de 75 Amedia-domenene, ikke noe mer. Alt annet krever fortsatt klikk. Slår du det av, kalles <code>chrome.permissions.remove()</code>, så ingenting blir liggende igjen.",
    secClick: "Ved klikk",
    stylingTitle: "Fjern betalingsmur-stiling",
    stylingNote: "Fjerner uskarphet, uttoningsmasker og scroll-låser.",
    consentTitle: "Skjul samtykkedialoger",
    consentNote: "Å skjule er ikke å svare, så siden spør igjen ved neste lasting.",
    adsTitle: "Skjul annonser",
    adsNote:
      "Bare på Amedia-sider. Annonseflater, karuseller og sponsede saker lastes fortsatt, dette tar tilbake plassen de tok.",
    watchTitle: "Fortsett å rydde",
    watchNote: "Sekunder. Sider tegnes på nytt etter lasting. 0 slår det av.",
    secRules: "Regler per side",
    addRule: "Legg til regel",
    rulesNote:
      "Skjul elementene du oppgir, på vertsnavnene du oppgir. Finn en selektor med høyreklikk &rarr; Undersøk.",
    empty: "Ingenting ennå. Legg til en regel for det bryterne ikke fanger.",
    export: "Eksporter",
    import: "Importer",
    ruleName: "Regelnavn",
    hosts: "Verter",
    hostsHint: "kommaseparert &middot; <code>example.com</code>, <code>*.example.com</code>, <code>*</code>",
    selectors: "Selektorer som skjules",
    selectorsHint: "én per linje",
    extraCss: "Ekstra CSS",
    extraCssHint: "settes inn som den er",
    enabled: "På",
    delete: "Slett",
    saved: "Lagret.",
    autoOn: "Automatikk på.",
    autoOff: "Automatikk av.",
    imported: "Importert.",
    saveFailed: "Kunne ikke lagre",
    permFailed: "Kunne ikke endre det",
    importFailed: "Ikke en gyldig innstillingsfil",
  },
  en: {
    tagline: "Clears Amedia paywalls. Click the icon to clear any other page.",
    secAuto: "Automatic",
    autoTitle: "On Amedia sites",
    autoNote: "Clears the paywall as the page loads.",
    grantsSummary: "What Chrome grants",
    grantsBody:
      "Access to the 75 Amedia domains, nothing else. Everywhere else stays click-only. Turning it off calls <code>chrome.permissions.remove()</code>, so nothing is left granted.",
    secClick: "On click",
    stylingTitle: "Clear paywall styling",
    stylingNote: "Removes blur, fade-out masks and scroll locks.",
    consentTitle: "Hide consent dialogs",
    consentNote: "Hiding is not answering, so the site asks again next load.",
    adsTitle: "Hide ads",
    adsNote:
      "Amedia sites only. Slots, carousels and sponsored posts still load, this reclaims the space they took.",
    watchTitle: "Keep re-applying",
    watchNote: "Seconds. Pages re-render after loading. 0 turns it off.",
    secRules: "Per-site rules",
    addRule: "Add rule",
    rulesNote: "Hide elements you name, on hosts you name. Find a selector with right-click &rarr; Inspect.",
    empty: "Nothing yet. Add a rule for whatever the toggles miss.",
    export: "Export",
    import: "Import",
    ruleName: "Rule name",
    hosts: "Hosts",
    hostsHint: "comma separated &middot; <code>example.com</code>, <code>*.example.com</code>, <code>*</code>",
    selectors: "Selectors to hide",
    selectorsHint: "one per line",
    extraCss: "Extra CSS",
    extraCssHint: "injected as-is",
    enabled: "Enabled",
    delete: "Delete",
    saved: "Saved.",
    autoOn: "Auto-apply on.",
    autoOff: "Auto-apply off.",
    imported: "Imported.",
    saveFailed: "Could not save",
    permFailed: "Could not change that",
    importFailed: "Not a valid settings file",
  },
};

let lang = "nb";
const t = (key) => (STRINGS[lang] || STRINGS.nb)[key] ?? key;

// The table is authored here, not user input, so innerHTML is the simplest way
// to keep the <code> spans inside a handful of these strings.
const applyLang = (root = document) => {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll("[data-i18n]")) el.innerHTML = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-attr]")) {
    // "title aria-label:key" sets both attributes from one key
    const [attrs, key] = el.dataset.i18nAttr.split(":");
    for (const attr of attrs.trim().split(/\s+/)) el.setAttribute(attr, t(key));
  }
  for (const button of document.querySelectorAll(".lang-btn")) {
    button.classList.toggle("is-on", button.dataset.lang === lang);
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  }
};

const $ = (id) => document.getElementById(id);
const TOGGLES = ["clearStyling", "hideConsent", "hideAds"];
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
    queueSave();
  });
  for (const el of node.querySelectorAll("[data-field]")) {
    el.addEventListener(el.type === "checkbox" ? "change" : "input", queueSave);
  }
  applyLang(node);
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

const AMEDIA_ORIGINS = chrome.runtime.getManifest().optional_host_permissions || [];

const load = async () => {
  ({ lang } = await chrome.storage.sync.get({ lang: "nb" }));
  applyLang();
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  for (const key of TOGGLES) $(key).checked = Boolean(settings[key]);
  $("watchSeconds").value = settings.watchSeconds;
  rulesEl.replaceChildren();
  settings.rules.forEach(addRule);
  refreshEmpty();
  $("autoAmedia").checked = AMEDIA_ORIGINS.length
    ? await chrome.permissions.contains({ origins: AMEDIA_ORIGINS })
    : false;
  $("autoAmedia").disabled = AMEDIA_ORIGINS.length === 0;
};

$("autoAmedia").addEventListener("change", async (event) => {
  const checkbox = event.target;
  if (!AMEDIA_ORIGINS.length) return;
  try {
    if (checkbox.checked) {
      const granted = await chrome.permissions.request({ origins: AMEDIA_ORIGINS });
      checkbox.checked = granted;
      if (granted) say(t("autoOn"));
    } else {
      await chrome.permissions.remove({ origins: AMEDIA_ORIGINS });
      say(t("autoOff"));
    }
  } catch (e) {
    // The checkbox must never claim access Chrome did not actually grant.
    checkbox.checked = await chrome.permissions.contains({ origins: AMEDIA_ORIGINS });
    say(`${t("permFailed")}: ${e.message}`);
  }
});

const save = async () => {
  const settings = {
    watchSeconds: Math.max(0, Math.min(300, Number($("watchSeconds").value) || 0)),
    rules: readRules().filter((r) => r.match || r.hide || r.css),
  };
  for (const key of TOGGLES) settings[key] = $(key).checked;
  try {
    await chrome.storage.sync.set(settings);
    say(t("saved"));
  } catch (e) {
    // sync storage caps a single item at 8 KB
    say(`${t("saveFailed")}: ${e.message}`);
  }
};

// Auto-save instead of a Save button: nothing to forget to press. Debounced
// because the rule fields fire on every keystroke and chrome.storage.sync
// caps how many writes it takes per minute.
//
// load() needs no guard against this - it only assigns to .value/.checked,
// and a programmatic assignment fires no change or input event.
let saveTimer = null;
function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 400);
}

for (const button of document.querySelectorAll(".lang-btn")) {
  button.addEventListener("click", () => {
    lang = button.dataset.lang;
    applyLang();
    // Its own key, so it stays out of the settings export and never reaches
    // clearview.js, which has no use for it.
    chrome.storage.sync.set({ lang }).catch(() => {});
  });
}

for (const key of TOGGLES) $(key).addEventListener("change", queueSave);
$("watchSeconds").addEventListener("input", queueSave);

$("add").addEventListener("click", () => addRule().querySelector('[data-field="name"]').focus());

$("export").addEventListener("click", async () => {
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "amediaid-settings.json";
  a.click();
  // Revoking in the same tick can cancel the download before Chrome reads it.
  setTimeout(() => URL.revokeObjectURL(url), 0);
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
    say(t("imported"));
  } catch (e) {
    say(`${t("importFailed")}: ${e.message}`);
  }
  event.target.value = "";
});

load();
