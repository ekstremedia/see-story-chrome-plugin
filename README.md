# See Story

Chrome extension. One click on the toolbar icon:

1. Removes `#aid-overlay` (and the `amedia-yokohama-incentive` / `article-incentive` blocks inside it).
2. Overrides `.aid-background-blur { filter: blur(5px) }` with `filter: none !important`, so the text and images are readable.
3. Unlocks page scrolling.

A `MutationObserver` re-applies both for 30 seconds after the click, because the page re-renders the overlay after hydration.

Keyboard shortcut: `Alt+Shift+S`.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. **Load unpacked** → select this folder.
4. Pin the icon, open an article, click it.

Uses `activeTab`, so it only touches a page when you click. No host permissions, no background network access.
# see-story-chrome-plugin
