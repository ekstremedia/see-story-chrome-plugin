/*
 * Clear View - injected on toolbar click.
 *
 * Three generic passes (CSS blur, fade-out masks, scroll locks) plus whatever
 * per-site rules the user has written in the options page.
 */
(async () => {
  const DEFAULTS = {
    unblur: true,
    unfade: true,
    unlockScroll: true,
    watchSeconds: 30,
    rules: [],
  };

  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };
  const STYLE_ID = "clear-view-style";
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

  const sweep = () => {
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
      const observer = new MutationObserver((mutations) => {
        // A restyled element has to be looked at again, so drop it from `seen`.
        for (const m of mutations) {
          if (m.type === "attributes" && !m.target.hasAttribute(MARK)) seen.delete(m.target);
        }
        injectStyle();
        sweep();
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

  return { changed };
})();
