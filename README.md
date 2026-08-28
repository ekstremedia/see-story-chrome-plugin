# Clear View

A small Chrome extension that makes an unreadable page readable again — with one
click. It strips CSS blur, gradient fade-outs and scroll locks from the `http`
or `https` page you are on, and can hide elements you name yourself, per site.

Nothing runs until you invoke it, no host permissions, no background activity,
no data collected — except on known Amedia local newspaper sites, which it
auto-clears on page load by default (a toggle in options turns that off).

![Before and after: on the left an article with a dialog over it and the text
blurred out, on the right the same article with the dialog gone and both the
photo and the text readable.](img/illustrasjon.jpeg)

<p align="center"><em>Left: a dialog over blurred text. Right: after one click.</em></p>

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

### 1. Download

**[⬇ Download the latest release](https://github.com/ekstremedia/see-story-chrome-plugin/releases/latest)** —
grab the `.zip` under **Assets**.

Every version is listed on the
[releases page](https://github.com/ekstremedia/see-story-chrome-plugin/releases).

Then **unzip it**, and keep the folder somewhere you will not delete it — Chrome
loads the extension from that folder every time it starts, so moving or deleting
the folder removes the extension.

### 2. Load it into Chrome

It is not on the Chrome Web Store yet, so Chrome has to be told to load it from
your own disk:

1. Open a new tab and go to `chrome://extensions`.
2. Turn on **Developer mode** — the switch in the top right corner.
3. Click **Load unpacked**, and pick the folder you unzipped.
4. Click the puzzle-piece icon in the toolbar, then the pin next to **Clear View**,
   so the icon stays visible.

The options page opens by itself the first time. Open a page and click the icon.
Chrome warns about developer-mode extensions every time it starts; that warning
is about unpacked extensions in general, not about this one.

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

That is the whole list for every site except the Amedia ones below — no
`host_permissions`, so the extension has **no** standing access to any other
site. `activeTab` grants one tab, only at the moment you invoke the extension —
by clicking the icon or pressing the keyboard shortcut, which does the same
thing — and it expires on navigation.

`storage` holds your own rules. Nothing is sent to the author or to any server;
the extension has none. Chrome itself syncs `chrome.storage.sync` across your
own Chrome profile through Google if you have Chrome Sync turned on. See
[PRIVACY.md](PRIVACY.md).

### Auto-apply on Amedia sites (on by default)

Amedia's paywalled articles all share the same markup — an `#aid-overlay` box
holding the subscribe prompt, and `.aid-background-blur` blurring the text
under it — so the extension un-blurs the article automatically on page load,
no click needed, on that domain list only (`host_permissions` in
`manifest.json`). This is the one exception to "no host permissions" above:
those domains are standing access from the moment the extension loads, whether
or not you ever use the feature — that's what makes the zero-click part
possible (Chrome will only grant on-demand access, `optional_host_permissions`,
in response to a real click, which defeats "automatic").

Options page → **Auto-apply on known Amedia local-newspaper sites** turns the
behavior off. The domains stay declared in the manifest either way; turning it
off just stops the content script from running on them.

The domain list itself is maintained in [`amedia-domains.tsv`](amedia-domains.tsv)
— add or remove a line, then run `python3 sync_amedia_domains.py` to regenerate
`manifest.json`. A domain only belongs there if it's both Amedia-owned and
actually serves the `#aid-overlay`/`acdn.no` markup — see the file's header.

## Files

```
manifest.json      Manifest V3
background.js      Toolbar click -> inject into all frames -> set the badge.
                   Also (un)registers the auto Amedia content script.
clearview.js       The passes above; runs in the page, reads your settings
options.html/.js/.css   Rule editor
amedia-domains.tsv   Amedia auto-apply domain list (see Auto-apply section above)
sync_amedia_domains.py   Regenerates manifest.json from amedia-domains.tsv
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
