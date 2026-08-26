# See Story

A tiny Chrome extension that removes the reading overlay Amedia newspaper sites
(`blv.no`, `an.no`, `rb.no`, …) draw over an article, and un-blurs the text
underneath — with one click.

It does by hand what you would otherwise do in DevTools every single time:
delete one `<div>`, untick one CSS property.

![Before and after: on the left an article with a dialog over it and the text
blurred out, on the right the same article with the dialog gone and both the
photo and the text readable.](img/illustrasjon.jpeg)

<p align="center"><em>Left: a dialog over blurred text. Right: after one click.</em></p>

---

## What it does

Clicking the toolbar icon runs three steps on the active tab:

| # | Step | Detail |
|---|------|--------|
| 1 | Remove the overlay | Deletes `#aid-overlay` and the `amedia-yokohama-incentive`, `amedia-yokohama-paywall` and `article-incentive` elements inside it. |
| 2 | Un-blur the article | The site's `story.css` sets `.aid-background-blur { filter: blur(5px) }`. The extension injects `filter: none !important` and also clears any inline `filter` on those elements. |
| 3 | Unlock scrolling | Restores `overflow` on `<html>` and `<body>`, which the overlay pins to `hidden`. |

The page re-renders the overlay after hydration, so a `MutationObserver` keeps
re-applying all three for **30 seconds** after the click, then disconnects.

The badge on the icon briefly shows how many elements were removed (green), or
`!` if the script could not run on that page (red).

## Install

Not on the Chrome Web Store — load it unpacked:

1. Clone or download this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. **Load unpacked** → pick this folder.
5. Pin the icon, open an article, click.

Keyboard shortcut: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (rebind at
`chrome://extensions/shortcuts`).

## Permissions

```json
"permissions": ["scripting", "activeTab"]
```

That is the whole list. No `host_permissions`, so the extension has **no**
standing access to any site: `activeTab` grants access to one tab when you
click the icon or press the keyboard shortcut, persists across same-origin
navigation, and is revoked when the tab closes or navigates to a different
origin. Nothing runs in the background, nothing is stored, nothing leaves your
browser.

## Files

```
manifest.json   Manifest V3
background.js   Toolbar click → inject the script into all frames, set the badge
seestory.js     The three steps above
icons/          16 / 32 / 48 / 128 px
make_icons.py   Regenerates the icons (needs Pillow)
```

The icon is the idea in one picture: four lines of article text, blurred on the
left, sharp on the right.

## Adapting it to another site

Both lists live at the top of `seestory.js`:

```js
const KILL = ["#aid-overlay", "amedia-yokohama-incentive", /* … */];
const BLUR = ".aid-background-blur";
```

Add your selectors there. Everything else is generic.

## Note

This only changes how a page already loaded into *your* browser is rendered —
the same edit you can make in DevTools. It does not fetch, unlock or download
anything you were not already served, so on a hard paywall (where the body text
is never sent to the browser) there is simply nothing underneath to reveal.
Local journalism is worth paying for; if a site is useful to you, subscribe.

## License

MIT
