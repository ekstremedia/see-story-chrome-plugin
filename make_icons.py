"""Regenerate icons/. Run: python3 make_icons.py"""
from PIL import Image, ImageDraw, ImageFilter

S = 512                      # render big, downscale for clean edges
BG1 = (24, 68, 140, 255)     # deep blue
BG2 = (46, 130, 214, 255)    # lighter blue
INK = (255, 255, 255, 255)


def background():
    grad = Image.new("RGBA", (S, S))
    d = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        d.line(
            [(0, y), (S, y)],
            fill=tuple(round(a + (b - a) * t) for a, b in zip(BG1, BG2)),
        )
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=112, fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def text_lines():
    """Four bars standing in for lines of article text."""
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    widths = (368, 368, 368, 244)
    y = 132
    for w in widths:
        h = 46 if y == 132 else 40
        d.rounded_rectangle([72, y, 72 + w, y + h], radius=h // 2, fill=INK)
        y += h + 42
    return layer


def compose():
    img = background()
    sharp = text_lines()
    blurred = sharp.filter(ImageFilter.GaussianBlur(14))

    # left half blurred, right half sharp -> the "de-blur" idea in one glance
    split = S // 2
    half = Image.new("L", (S, S), 0)
    ImageDraw.Draw(half).rectangle([split, 0, S, S], fill=255)
    half = half.filter(ImageFilter.GaussianBlur(3))   # soften the seam

    lines = Image.composite(sharp, blurred, half)
    img.alpha_composite(lines)

    # divider marking where the blur stops
    d = ImageDraw.Draw(img)
    d.line([(split, 84), (split, S - 84)], fill=(255, 255, 255, 150), width=6)
    return img


def main():
    master = compose()
    master.save("icons/icon.png")
    for n in (16, 32, 48, 128):
        master.resize((n, n), Image.LANCZOS).save(f"icons/icon{n}.png")
    print("wrote icons/icon{,16,32,48,128}.png")


if __name__ == "__main__":
    main()
