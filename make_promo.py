"""Generate Chrome Web Store listing artwork into store/.

  store/icon128-store.png   128x128, 96x96 artwork + 16px transparent padding
  store/promo-440x280.png   small promo tile (required for good placement)
  store/promo-1400x560.png  marquee tile (optional)

Run: python3 make_promo.py
"""
import os

from PIL import Image

from make_icons import BG1, BG2, compose


def gradient(size):
    w, h = size
    img = Image.new("RGBA", size)
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = (x / (w - 1) + y / (h - 1)) / 2
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(BG1, BG2))
    return img


def main():
    os.makedirs("store", exist_ok=True)
    master = compose()

    # Store icon: the store wants 16px of breathing room inside a 128px canvas.
    padded = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    padded.paste(master.resize((96, 96), Image.LANCZOS), (16, 16))
    padded.save("store/icon128-store.png")

    # Promo tiles: the icon on a filled gradient, no text (store guidance).
    for w, h, art in ((440, 280, 200), (1400, 560, 400)):
        tile = gradient((w, h))
        icon = master.resize((art, art), Image.LANCZOS)
        tile.paste(icon, ((w - art) // 2, (h - art) // 2), icon)
        tile.convert("RGB").save(f"store/promo-{w}x{h}.png")

    print("wrote store/icon128-store.png, store/promo-440x280.png, store/promo-1400x560.png")


if __name__ == "__main__":
    main()
