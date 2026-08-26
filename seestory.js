/* See Story - remove the paywall overlay and un-blur the article. */
(() => {
  const STYLE_ID = "see-story-style";
  const KILL = [
    "#aid-overlay",
    "amedia-yokohama-incentive",
    "amedia-yokohama-paywall",
    "article-incentive",
  ];
  const BLUR = ".aid-background-blur";

  let removed = 0;

  const injectStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      ${KILL.join(",\n      ")} { display: none !important; }
      ${BLUR} {
        filter: none !important;
        -webkit-filter: none !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
        max-height: none !important;
        overflow: visible !important;
        -webkit-mask-image: none !important;
        mask-image: none !important;
      }
      html, body { overflow: auto !important; position: static !important; }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const clean = () => {
    for (const sel of KILL) {
      for (const el of document.querySelectorAll(sel)) {
        el.remove();
        removed++;
      }
    }
    for (const el of document.querySelectorAll(BLUR)) {
      // inline !important beats our stylesheet, so clear it on the element too
      el.style.removeProperty("filter");
      el.style.removeProperty("-webkit-filter");
      el.style.setProperty("filter", "none", "important");
    }
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      el.style.setProperty("overflow", "auto", "important");
      el.style.removeProperty("position");
    }
  };

  injectStyle();
  clean();

  // The page re-renders the overlay after hydration, so keep watching.
  if (!window.__seeStoryObserver) {
    const observer = new MutationObserver(() => {
      injectStyle();
      clean();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.__seeStoryObserver = observer;
    // Stop after a while; no point observing forever.
    setTimeout(() => {
      observer.disconnect();
      window.__seeStoryObserver = null;
    }, 30000);
  }

  return { removed };
})();
