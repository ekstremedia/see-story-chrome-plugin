/*
 * AmediAid - auto-registered on Amedia sites, and injected on toolbar click
 * everywhere else.
 *
 * Hides the Amedia paywall box, plus three generic passes (CSS blur,
 * fade-out masks, scroll locks) and whatever per-site rules the user has
 * written in the options page.
 */
(async () => {
  const DEFAULTS = {
    unblur: true,
    unfade: true,
    unlockScroll: true,
    hideConsent: false,
    hideAds: false,
    watchSeconds: 30,
    rules: [],
  };

  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  const STYLE_ID = "clear-view-style";
  // Sourcepoint is the consent platform Amedia runs (its state shows up as the
  // _sp_user_consent_* keys and the consentUUID cookie). Its container ids
  // carry a per-site account number - sp_message_container_1234 - so match on
  // the prefix rather than any one site's id.
  const CONSENT_SELECTOR =
    'div[id^="sp_message_container_"], iframe[id^="sp_message_iframe_"], .sp_veil';
  // Amedia's own ad markup: <bazaar-ad> slots (toppbanner-1, skyskraper-1,
  // takeover-1 ...) plus the wrappers that reserve their height, which would
  // otherwise leave a gap where the ad was. advantage-wrapper is deliberately
  // not here - it carries subscriber benefits, not advertising.
  const AD_SELECTOR = [
    "bazaar-ad",
    "bazaar-ad-config",
    "bazaar-config",
    "challenge-ad",
    "smart-banner",
    ".am-bazaar-ad",
    ".maelstrom-topbanner",
    ".maelstrom-sticky-sky",
  ].join(", ");
  const MARK = "data-clear-view";
  const MAX_ELEMENTS = 20000; // don't crawl a pathological page forever
  const seen = new WeakSet();

  let changed = 0;

  /** "*.example.com" / "example.com" / "*" against the current hostname. */
  const hostMatches = (pattern) => {
    const p = pattern.trim().toLowerCase();
    if (!p) return false;
    if (p === "*") return true;
    const host = location.hostname.toLowerCase();
    if (p.startsWith("*.")) {
      const base = p.slice(2);
      return host === base || host.endsWith("." + base);
    }
    return host === p;
  };

  const activeRules = settings.rules.filter(
    (r) => r && r.enabled !== false && (r.match || "").split(",").some(hostMatches),
  );

  const ruleSelectors = activeRules.flatMap((r) =>
    (r.hide || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const ruleCss = activeRules
    .map((r) => (r.css || "").trim())
    .filter(Boolean)
    .join("\n");

  const injectStyle = () => {
    const css = [
      ruleSelectors.length ? `${ruleSelectors.join(",\n")} { display: none !important; }` : "",
      // Amedia's paywall prompt box - see amedia-domains.tsv for the CMS this targets.
      `#aid-overlay { display: none !important; }`,
      // The Sourcepoint consent dialog ("Personverninnstillinger"), off unless
      // asked for. Hiding it leaves consent unrecorded, so Sourcepoint
      // re-renders it on the next load and the observer below hides it again.
      //
      // Hiding the dialog does not lift the scroll lock behind it. Sourcepoint
      // puts the class on <html> and locks <body> as a descendant:
      //
      //   .sp-message-open body { overflow: hidden !important; position: fixed !important; }
      //
      // so the override has to out-specify a (0,1,1) !important rule, not just
      // match it - a tie would be settled by stylesheet order, which is not
      // ours to control. It rides with this setting rather than with "Unlock
      // scrolling": hiding the dialog is what leaves the page locked, so the
      // same switch owns putting scrolling back.
      settings.hideConsent
        ? `${CONSENT_SELECTOR} { display: none !important; }
html.sp-message-open body,
html[${MARK}~="unlock"] body,
html[${MARK}~="unlock"] body[${MARK}~="unlock"],
html[${MARK}~="unlock"] {
  overflow: auto !important;
  position: static !important;
  top: auto !important;
}`
        : "",
      // Amedia's ad slots, off unless asked for. This only hides them: a
      // content script cannot stop the requests, which would take
      // declarativeNetRequest and a rule set. The ads still load.
      settings.hideAds ? `${AD_SELECTOR} { display: none !important; }` : "",
      settings.unblur
        ? `[${MARK}~="blur"] { filter: none !important; -webkit-filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`
        : "",
      settings.unfade
        ? `[${MARK}~="fade"] { -webkit-mask-image: none !important; mask-image: none !important; }`
        : "",
      settings.unlockScroll
        ? `html[${MARK}~="scroll"], body[${MARK}~="scroll"] { overflow: auto !important; position: static !important; }`
        : "",
      ruleCss,
    ]
      .filter(Boolean)
      .join("\n");

    if (!css) return;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  };

  const mark = (el, token) => {
    const current = (el.getAttribute(MARK) || "").split(/\s+/).filter(Boolean);
    if (current.includes(token)) return false;
    current.push(token);
    el.setAttribute(MARK, current.join(" "));
    return true;
  };

  /** An inline !important wins over the page's own inline styles too. */
  const forceNone = (el, props) => {
    for (const p of props) el.style.setProperty(p, "none", "important");
  };

  /** Undo a consent dialog's scroll lock, whichever way the page applied it. */
  const unlockPage = () => {
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      // Guard the remove(): taking a class off that was never there would
      // still churn the observer this script installs.
      if (el.classList.contains("sp-message-open")) el.classList.remove("sp-message-open");
      if (mark(el, "unlock")) changed++;
      // Inline !important, not removeProperty: the lock comes from a
      // stylesheet rule that is itself !important, so there is no inline
      // declaration to remove and only an inline !important outranks it.
      el.style.setProperty("overflow", "auto", "important");
      el.style.setProperty("position", "static", "important");
      el.style.setProperty("top", "auto", "important");
    }
  };

  const sweep = () => {
    const overlay = document.getElementById("aid-overlay");
    if (overlay && mark(overlay, "amedia")) changed++;

    const consent = settings.hideConsent ? document.querySelectorAll(CONSENT_SELECTOR) : [];
    for (const el of consent) {
      if (mark(el, "consent")) changed++;
    }
    // Only once a dialog was actually found - html/body must not be touched on
    // a page that never locked anything.
    if (consent.length) unlockPage();

    if (settings.hideAds) {
      for (const el of document.querySelectorAll(AD_SELECTOR)) {
        if (mark(el, "ad")) changed++;
      }
    }

    for (const sel of ruleSelectors) {
      let matches;
      try {
        matches = document.querySelectorAll(sel);
      } catch {
        continue; // the user typed something querySelectorAll won't parse
      }
      for (const el of matches) {
        el.remove();
        changed++;
      }
    }

    if (settings.unblur || settings.unfade) {
      const all = document.querySelectorAll("*");
      const limit = Math.min(all.length, MAX_ELEMENTS);
      for (let i = 0; i < limit; i++) {
        const el = all[i];
        if (seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);

        if (
          settings.unblur &&
          (cs.filter.includes("blur(") || cs.backdropFilter?.includes("blur("))
        ) {
          if (mark(el, "blur")) changed++;
          forceNone(el, ["filter", "-webkit-filter", "backdrop-filter", "-webkit-backdrop-filter"]);
        }

        if (settings.unfade) {
          const maskImage = cs.maskImage || cs.webkitMaskImage || "none";
          if (maskImage !== "none" && maskImage.includes("gradient")) {
            if (mark(el, "fade")) changed++;
            forceNone(el, ["mask-image", "-webkit-mask-image"]);
          }
        }
      }
    }

    if (settings.unlockScroll) {
      for (const el of [document.documentElement, document.body]) {
        if (!el) continue;
        const cs = getComputedStyle(el);
        if (cs.overflow === "hidden" || cs.overflowY === "hidden" || cs.position === "fixed") {
          if (mark(el, "scroll")) changed++;
          el.style.setProperty("overflow", "auto", "important");
          el.style.removeProperty("position");
        }
      }
    }
  };

  injectStyle();
  sweep();

  // Pages re-render after hydration, so keep re-applying for a while.
  const watchMs = Math.max(0, Number(settings.watchSeconds) || 0) * 1000;
  if (watchMs) {
    if (!window.__clearViewObserver) {
      // forceNone() writes inline styles, which this observer watches, so an
      // unthrottled sweep re-triggers itself - and every sweep is a
      // getComputedStyle pass over the whole document. Coalesce the batches a
      // hydrating page fires into one pass. A timer rather than rAF, so a page
      // loaded in a background tab still settles before the watch window ends.
      let passTimer = null;
      const schedulePass = () => {
        if (passTimer !== null) return;
        passTimer = setTimeout(() => {
          passTimer = null;
          injectStyle();
          sweep();
        }, 50);
      };
      const observer = new MutationObserver((mutations) => {
        // A restyled element has to be looked at again, so drop it from `seen`.
        for (const m of mutations) {
          if (m.type === "attributes" && !m.target.hasAttribute(MARK)) seen.delete(m.target);
        }
        schedulePass();
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      window.__clearViewObserver = observer;
    }
    // Each click gets a full window.
    clearTimeout(window.__clearViewTimeout);
    window.__clearViewTimeout = setTimeout(() => {
      window.__clearViewObserver?.disconnect();
      window.__clearViewObserver = null;
      window.__clearViewTimeout = null;
    }, watchMs);
  }

  chrome.runtime.sendMessage({ type: "clear-view-result", changed }).catch(() => {});
})();
