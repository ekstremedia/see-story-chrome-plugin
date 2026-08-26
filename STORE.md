# Chrome Web Store submission

Everything the listing asks for, written out. Copy the fields straight into the
[developer dashboard](https://chrome.google.com/webstore/devconsole).

## Before you start

- A one-time developer registration fee, paid with a Google account. Use an
  address you will keep — **the developer email cannot be changed later**;
  moving to another one means a new account and a support-form item transfer.
- New publishers may have at most **two** published extensions to start with.
- Upload limit is 2 GB. Ours is ~20 KB.

Build the package:

```bash
python3 make_store_zip.py     # -> dist/clear-view-2.0.0.zip
python3 make_promo.py         # -> store/ artwork
./make_screenshots.sh 01-options   # sway + grim, see below
```

## Store listing tab

**Name**

```
Clear View
```

**Short description** (132 characters max — this one is 108)

```
One click to strip CSS blur, fade-out masks and scroll locks from a page, plus your own per-site element rules.
```

**Detailed description**

```
Some pages are unreadable by design: the text is blurred, faded out behind a
gradient, or the page refuses to scroll. Clear View undoes that rendering with
one click on the toolbar icon.

What a click does:

• Removes CSS blur — clears filter: blur() and backdrop-filter from every
  element on the page.
• Removes fade-out masks — clears the gradient mask-image that fades text out
  at the bottom of a clamped block.
• Unlocks scrolling — restores overflow on the page when something pinned it.
• Applies your own rules — hide any elements you name, on the hosts you name,
  plus any extra CSS you want injected.

Each of the three built-in steps is a toggle you control in the options page.
Per-site rules are yours to write: give a host pattern, a list of CSS selectors,
and optionally some CSS. Export and import them as JSON.

Pages often re-render after loading, so the extension keeps re-applying your
settings for 30 seconds after the click, then stops. The badge shows how many
elements it changed.

Privacy: the extension has no host permissions, so it has no standing access to
any website. Chrome grants it one tab, at the moment you click the icon, and
that access ends when you navigate away. It makes no network requests, has no
server, and collects nothing. Your rules are kept in Chrome's own synced
storage.

Open source, MIT licensed:
https://github.com/ekstremedia/see-story-chrome-plugin
```

**Category** — Tools · **Language** — English

## Graphics

| Asset | Size | File |
|-------|------|------|
| Store icon | 128x128 PNG, 96x96 artwork with 16px transparent padding | `store/icon128-store.png` |
| Screenshots | 1280x800 (or 640x400), 1 to 5, full bleed, square corners | `store/screenshots/*.png` |
| Small promo tile | 440x280 | `store/promo-440x280.png` |
| Marquee tile | 1400x560, optional | `store/promo-1400x560.png` |

Screenshots must show the real thing. `./make_screenshots.sh <name>` opens a
throwaway Chrome profile with the extension loaded at 1280x800, waits for you to
arrange the shot, then grabs the focused window with `grim` and pads or crops it
to exactly 1280x800. Worth taking three: the options page, a blurred page, and
the same page after a click.

Skipping the small promo tile pushes the listing down in store search, so upload
it even though it is nominally optional.

## Privacy tab

**Single purpose**

```
Clear View changes how the page in the active tab is rendered, on demand: it
removes CSS blur filters, gradient fade-out masks and scroll locks, and hides
elements the user has listed in their own per-site rules.
```

**Permission justifications**

| Permission | Justification |
|---|---|
| `activeTab` | The extension needs access to the tab the user clicked the toolbar icon on, in order to change how that page renders. activeTab limits this to that single tab, at that moment, and the access expires on navigation. No other access is requested. |
| `scripting` | Required to inject the script that applies the user's settings into the page. It is injected only in response to the user clicking the toolbar icon. |
| `storage` | Stores the user's own settings — three toggles, a duration, and any per-site rules they wrote. Nothing else is stored, and it never leaves the browser. |

**Remote code** — No, the extension does not use remote code. All logic ships in
the package.

**Data usage** — tick "does not collect user data", then all three certification
checkboxes (no selling, no unrelated use, no creditworthiness use).

**Privacy policy URL**

```
https://github.com/ekstremedia/see-story-chrome-plugin/blob/main/PRIVACY.md
```

## Distribution tab

Public, free, all regions. No test credentials needed — the extension needs no
login, so leave the test instructions field empty.

## After submitting

Review depends on what the extension does; a small, permission-light,
single-purpose extension is the fast case, but budget days rather than hours,
and watch the developer email for review mail.

If a review is rejected, the mail names the policy section. Fix, bump `version`
in `manifest.json`, rebuild the zip, upload as a new version.

## One thing to know

Extensions whose purpose is presented as getting around a publisher's paywall
have been removed from the store before. Clear View is a general rendering
utility and ships with an empty rule list — it names no site and no publisher.
Keep the listing copy that way: describe what it does to CSS, not what any
particular site is doing to you.
