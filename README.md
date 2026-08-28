# AmediAid

One click and the paywall is gone on Norway's Amedia local papers. Or no click
at all, if you want it automatic.

![Before and after: on the left an article with a dialog over it and the text
blurred out, on the right the same article with the dialog gone and both the
photo and the text readable.](img/illustrasjon.jpeg)

<p align="center"><em>Left: a dialog over blurred text. Right: after AmediAid clears it.</em></p>

## Install

Not on the Chrome Web Store, and never will be. It names a publisher and
offers to walk through its paywall, which is the kind of thing the Store
removes extensions for. GitHub only, on purpose.

1. Download the [latest release](https://github.com/ekstremedia/AmediAid/releases/latest)
   and unzip it somewhere permanent. Chrome loads the extension from that
   folder on every start.
2. Go to `chrome://extensions`, turn on **Developer mode**.
3. **Load unpacked**, pick the folder.
4. Pin the icon from the puzzle-piece menu.

Click the icon on any page, or press <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>.
The badge shows how many elements changed.

## Settings

The options page is Norwegian by default, with an NB / EN switch.

| Setting | What it does | Default |
|---|---|---|
| On Amedia sites | Clears the paywall as the page loads, no click. Asks Chrome for the 75 domains in [`amedia-domains.tsv`](amedia-domains.tsv) and nothing else. Off calls `chrome.permissions.remove()`. | off |
| Clear paywall styling | Removes blur, fade-out masks and scroll locks. | on |
| Hide consent dialogs | Hides the Sourcepoint dialog and its scroll lock. Hiding is not answering, so the site asks again. | off |
| Hide ads | Amedia only. Ad slots, marketplace carousels, sponsored posts. They still load, this just reclaims the space. | off |
| Keep re-applying | Seconds a `MutationObserver` keeps re-applying, since pages re-render after loading. 0 turns it off. | 30 |
| Per-site rules | Your own selectors and CSS, per host, for anything the toggles miss. | none |

Settings live in `chrome.storage.sync`, so they follow your Chrome profile.
Export and Import move them as JSON.

## Amedia sites

Every Amedia paper ships the same markup: an `#aid-overlay` box holding the
subscribe prompt, `.aid-background-blur` over the article text. AmediAid hides
one and clears the other whenever it runs.

A domain belongs in [`amedia-domains.tsv`](amedia-domains.tsv) only if it is
both Amedia-owned and actually serving that markup. The file's header records
how each of the 75 was checked. Edit it, then regenerate `manifest.json`:

```sh
python3 sync_amedia_domains.py
```

## Permissions

```json
"permissions": ["scripting", "activeTab", "storage"]
```

That is the whole list for every site except the Amedia domains above, and
those are opt-in. `activeTab` grants one tab, at the moment you invoke the
extension, and expires on navigation.

Nothing is sent anywhere. There is no server, no network request of its own,
no analytics. `storage` holds your settings, which Google syncs across your own
profile if you have Chrome Sync on.

## License

MIT, see [LICENSE](LICENSE).
