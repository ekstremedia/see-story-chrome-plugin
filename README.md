# AmediAid

A Chrome extension that clears Amedia's local-newspaper paywalls — no
subscription needed. It also works as a one-click, un-blur-any-page tool on
any other site.

Nothing runs until you invoke it, no host permissions, no background activity,
no data collected. Optionally, turn on auto-apply for the ~75 Amedia domains
listed in [`amedia-domains.tsv`](amedia-domains.tsv) and it clears those on
page load too, no click needed — off by default, on when you ask for it.

![Before and after: on the left an article with a dialog over it and the text
blurred out, on the right the same article with the dialog gone and both the
photo and the text readable.](img/illustrasjon.jpeg)

<p align="center"><em>Left: a dialog over blurred text. Right: after AmediAid clears it.</em></p>

---

## Amedia sites

Amedia's paywalled articles all share the same markup: an `#aid-overlay` box
holding the subscribe prompt, and `.aid-background-blur` blurring the article
text under it. AmediAid always hides that box and clears that blur when it
runs on an Amedia page — whether you click the toolbar icon, or turn on
**Auto-apply on known Amedia local-newspaper sites** in options so it runs by
itself on page load, no click needed, on the domain list in
[`amedia-domains.tsv`](amedia-domains.tsv) — add or remove a line, then run
`python3 sync_amedia_domains.py` to regenerate `manifest.json`. A domain only
belongs there if it's both Amedia-owned and actually serves that markup — see
the file's header for how each one was verified.

Auto-apply is off by default. Turning it on asks Chrome to grant
`optional_host_permissions` for that domain list only — nothing else, and
nothing standing until you ask for it. Turning it back off calls
`chrome.permissions.remove()`, so nothing is left granted. Either way, a
manual click on an Amedia page always clears it.

**This is exactly why AmediAid isn't on the Chrome Web Store and never will
be** — it names a specific publisher and offers to bypass its paywall
automatically, which is a pattern the Store has removed extensions for
before. GitHub is the only distribution channel, on purpose.

## Everywhere else — one click

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

### Per-site rules

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

## Install

Not on the Chrome Web Store — see above. Load it from source instead:

1. Clone or [download this repo](https://github.com/ekstremedia/AmediAid/archive/refs/heads/main.zip)
   and unzip it somewhere you won't delete — Chrome loads the extension from
   that folder every time it starts.
2. Open a new tab, go to `chrome://extensions`.
3. Turn on **Developer mode** — the switch in the top right corner.
4. Click **Load unpacked**, and pick the folder.
5. Click the puzzle-piece icon in the toolbar, then the pin next to
   **AmediAid**, so the icon stays visible.

The options page opens by itself the first time. Chrome warns about
developer-mode extensions every time it starts; that warning is about unpacked
extensions in general, not about this one.

## Permissions

```json
"permissions": ["scripting", "activeTab", "storage"]
```

That is the whole list for every site except the Amedia domain list above — no
standing access there. `activeTab` grants one tab, only at the moment you
invoke the extension — by clicking the icon or pressing the keyboard shortcut,
which does the same thing — and it expires on navigation.

`storage` holds your own settings and rules. Nothing is sent to the author or
to any server; the extension has none, makes no network requests of its own,
and collects nothing. Chrome itself syncs `chrome.storage.sync` across your own
Chrome profile through Google if you have Chrome Sync turned on.

## Files

```
manifest.json          Manifest V3 - see host_permissions for the Amedia domain list
background.js          Toolbar click -> inject into all frames -> set the badge.
                        Also (un)registers the auto Amedia content script.
clearview.js            The passes above; runs in the page, reads your settings
options.html/.js/.css   Settings page
amedia-domains.tsv      Amedia auto-apply domain list, source of truth
sync_amedia_domains.py  Regenerates manifest.json from amedia-domains.tsv
icons/                  16 / 32 / 48 / 128 + a 512 master
make_icons.py           Regenerates icons/ (needs Pillow)
```

## License

MIT — see [LICENSE](LICENSE).
