"""Build the Chrome Web Store upload package.

Ships only what the extension needs at runtime - no build scripts, no repo
documentation, no icon master.

Run: python3 make_store_zip.py
"""
import json
import os
import zipfile

SHIP = [
    "manifest.json",
    "background.js",
    "clearview.js",
    "options.html",
    "options.js",
    "options.css",
    "icons/icon16.png",
    "icons/icon32.png",
    "icons/icon48.png",
    "icons/icon128.png",
    "LICENSE",
]


def main():
    version = json.load(open("manifest.json"))["version"]
    os.makedirs("dist", exist_ok=True)
    out = f"dist/clear-view-{version}.zip"

    missing = [f for f in SHIP if not os.path.exists(f)]
    if missing:
        raise SystemExit(f"missing: {', '.join(missing)}")

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for f in SHIP:
            z.write(f, f)

    print(f"{out}  {os.path.getsize(out)} bytes")
    for f in SHIP:
        print(f"  {f}")


if __name__ == "__main__":
    main()
