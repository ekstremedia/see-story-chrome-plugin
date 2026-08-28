# Recipes

Rules other people found useful. Options page → **Add rule** → paste.

These are user configuration, not part of the extension — nothing here ships in
the package.

---

## Amedia local newspapers (`blv.no`, `an.no`, `rb.no`, …)

The article text is blurred and an overlay sits on top of it. The blur and the
scroll lock are handled by the built-in toggles; the overlay needs a rule.

```
Name:   Amedia overlay
Hosts:  *.blv.no, *.an.no, *.rb.no
Hide:   #aid-overlay
        amedia-yokohama-incentive
        article-incentive
```

The blurred wrapper is `.aid-background-blur { filter: blur(5px) }` in the
site's `story.css`, so **Remove CSS blur** alone clears it.

---

## A generic modal + backdrop

Most cookie walls and newsletter modals are one dialog plus one dimmed backdrop:

```
Hosts:  *
Hide:   .modal-backdrop
        [role="dialog"][aria-modal="true"]
```

Keep this one narrow — `*` means every site you click on, and some pages use a
real modal for something you actually want.

---

## A clamped "read more" block

When the text is cut off at a fixed height and faded out, the fade is handled by
**Remove fade-out masks**; the height clamp needs CSS:

```
Hosts:  example.com
CSS:    .article-body { max-height: none !important; overflow: visible !important; }
```

---

Got one worth sharing? Open a PR adding it here.
