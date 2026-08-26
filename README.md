# Clear View

A small Chrome extension that makes an unreadable page readable again — with one
click. It strips CSS blur, gradient fade-outs and scroll locks from the `http`
or `https` page you are on, and can hide elements you name yourself, per site.

Nothing runs until you invoke it. No host permissions, no background activity,
no data collected.

![Before and after: on the left an article with a dialog over it and the text
blurred out, on the right the same article with the dialog gone and both the
photo and the text readable.](img/illustrasjon.jpeg)

<p align="center"><em>Left: a dialog over blurred text. Right: after one click.</em></p>

---

## What a click does

| Step | Detail | Default |
|------|--------|---------|
| Remove blur | Clears `filter: blur()` and `backdrop-filter` from every element, up to the first 20 000 inspected. | on |
| Remove fade-out masks | Clears gradient `mask-image` — the trick that fades text out at the bottom of a clamped block. | on |
| Unlock scrolling | Restores `overflow` on `<html>` and `<body>` when something pinned them to `hidden`. | on |
| Per-site rules | Hides selectors you listed for this host, and injects your extra CSS. | none |

Pages re-render after loading, so a `MutationObserver` re-applies everything for
30 seconds after the click (configurable, 0 turns it off). The badge shows how
many elements were changed.

Keyboard shortcut: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>, rebindable at
`chrome://extensions/shortcuts`.

## Install

Not on the Chrome Web Store yet — load it unpacked:

1. Clone or download this repo.
2. Open `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. **Load unpacked** → pick this folder.
5. Pin the icon, open a page, click.

## Rules

Options page → **Add rule**. A rule has four fields:

| Field | Meaning |
|-------|---------|
| Hosts | Comma separated. `example.com`, `*.example.com`, or `*` for every site. |
| Hide these selectors | One per line. Matching elements are removed from the DOM. |
| Extra CSS | Injected as-is. Good for `max-height: none !important` and similar. |
| Enabled | Off keeps the rule around without applying it. |

Find a selector with right-click → **Inspect**, then right-click the node in
DevTools → **Copy** → **Copy selector**.

Rules live in `chrome.storage.sync`, so they follow your Chrome profile. Export
and Import move them as JSON. Sync caps one item at 8 KB, which is a few hundred
selectors.

### Example: a reading overlay

Site draws a full-page `<div id="reading-overlay">` over the article and blurs
the text underneath. The blur is handled by the built-in toggle; the overlay
needs a rule:

```
Hosts:     *.example.com
Hide:      #reading-overlay
```

## Permissions

```json
"permissions": ["scripting", "activeTab", "storage"]
```

That is the whole list, and there is no `host_permissions`, so the extension has
**no** standing access to any site. `activeTab` grants one tab, only at the
moment you invoke the extension — by clicking the icon or pressing the keyboard
shortcut, which does the same thing — and it expires on navigation.

`storage` holds your own rules. Nothing is sent to the author or to any server;
the extension has none. Chrome itself syncs `chrome.storage.sync` across your
own Chrome profile through Google if you have Chrome Sync turned on. See
[PRIVACY.md](PRIVACY.md).

## Files

```
manifest.json      Manifest V3
background.js      Toolbar click -> inject into all frames -> set the badge
clearview.js       The passes above; runs in the page, reads your settings
options.html/.js/.css   Rule editor
icons/             16 / 32 / 48 / 128 + a 512 master
make_icons.py      Regenerates icons/ (needs Pillow)
make_store_zip.py  Builds the Chrome Web Store upload package
STORE.md           Store listing copy and submission checklist
```

## Build the store package

```bash
python3 make_store_zip.py     # -> dist/clear-view-<version>.zip
```

## License

MIT — see [LICENSE](LICENSE).
