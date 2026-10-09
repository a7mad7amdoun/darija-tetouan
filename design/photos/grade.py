"""One colour grade for every photograph of Tetouan on the site, so they sit
in the same palette as TetouTalk's identity instead of each bringing its own.

What it does:
  - hard blue skies become a softer, lighter dusty blue, so they sit beside
    the medina green instead of shouting over it
  - greens move toward the medina green; golds and oranges calm toward sand
  - a little less saturation overall, a soft S-curve with lifted blacks and
    rolled-off whites, like print
  - deep shadows lean toward the medina green; highlights toward limewash

Reads design/photos/ungraded/<name>.jpg (byte-identical copies of what was
served before grading), writes assets/photos/<name>.jpg (2400px) and
<name>-sm.jpg (1200px). Run again to re-grade; delete the outputs and copy the
ungraded files back to undo. Authoring-time only - the site needs none of it.

    python3 -m venv venv && venv/bin/pip install numpy pillow
    venv/bin/python design/photos/grade.py            # grade everything in data/photos.js
    venv/bin/python design/photos/grade.py --sheet out.jpg whitecity goldenhour   # before/after only
"""
import os, re, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(HERE, 'ungraded')
OUT = os.path.join(ROOT, 'assets', 'photos')

SHADOW = np.array([0.035, 0.19, 0.135])   # the medina green, darkened
HIGH = np.array([1.0, 0.972, 0.918])      # warm limewash
LUMA = np.array([0.2126, 0.7152, 0.0722])

def rgb2hsv(x):
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    mx, mn = x.max(-1), x.min(-1); d = mx - mn
    hh = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    hh[rr] = ((g - b)[rr] / d[rr]) % 6
    hh[gg] = (b - r)[gg] / d[gg] + 2
    hh[bb] = (r - g)[bb] / d[bb] + 4
    return np.stack([hh * 60.0, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx], -1)

def hsv2rgb(h):
    H, S, V = h[..., 0] / 60.0, h[..., 1], h[..., 2]
    C = V * S; X = C * (1 - np.abs(H % 2 - 1)); m = V - C
    z = np.zeros_like(H); i = np.floor(H).astype(int) % 6
    r = np.choose(i, [C, X, z, z, X, C]); g = np.choose(i, [X, C, C, X, z, z]); b = np.choose(i, [z, z, X, C, C, X])
    return np.stack([r + m, g + m, b + m], -1)

def band(hue, centre, width):
    """1 at the centre of a hue band, easing to 0 at +-width (degrees, wrapping)"""
    d = np.abs((hue - centre + 180) % 360 - 180)
    return np.clip(1 - d / width, 0, 1) ** 0.8

def toward(hue, target, amount):
    d = (target - hue + 180) % 360 - 180
    return (hue + d * amount) % 360

def grade(im):
    x = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    h = rgb2hsv(x); H, Sa, V = h[..., 0], h[..., 1], h[..., 2]
    blue = band(H, 215, 45); green = band(H, 140, 55); warm = band(H, 32, 30)
    # blue skies: softer and lighter, a little toward a dusty sky blue
    H = toward(H, 208, 0.35 * blue)
    Sa = Sa * (1 - 0.40 * blue)
    V = V + (1 - V) * 0.14 * blue
    # greens: toward the medina green, kept deep
    H = toward(H, 152, 0.45 * green)
    # golds and oranges: calmer, toward sand
    Sa = Sa * (1 - 0.18 * warm)
    Sa = Sa * 0.9
    x = hsv2rgb(np.stack([H, np.clip(Sa, 0, 1), np.clip(V, 0, 1)], -1))
    s = x - 0.10 * np.sin(2 * np.pi * x) / (2 * np.pi)       # soft S
    x = 0.045 + 0.935 * s                                     # lifted blacks, rolled whites
    L = x @ LUMA
    ws = (1 - L) ** 2.2 * 0.24                                # shadows lean green
    wh = L ** 3 * 0.07                                        # highlights lean limewash
    x = x * (1 - ws - wh)[..., None] + SHADOW * ws[..., None] + HIGH * wh[..., None]
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))

def keys():
    js = open(os.path.join(ROOT, 'data', 'photos.js'), encoding='utf-8').read()
    return re.findall(r"file:\s*'([^']+)\.jpg'", js)

def main(argv):
    if argv[:1] == ['--sheet']:
        out, names = argv[1], argv[2:]
        tiles = []
        for n in names:
            a = Image.open(os.path.join(SRC, n + '.jpg')).convert('RGB'); a.thumbnail((520, 520))
            b = grade(a)
            t = Image.new('RGB', (a.width * 2 + 8, a.height), (255, 255, 255))
            t.paste(a, (0, 0)); t.paste(b, (a.width + 8, 0)); tiles.append(t)
        W = max(t.width for t in tiles); H = sum(t.height + 8 for t in tiles)
        sheet = Image.new('RGB', (W, H), (255, 255, 255)); y = 0
        for t in tiles: sheet.paste(t, (0, y)); y += t.height + 8
        sheet.save(out, quality=88); return
    for n in keys():
        src = os.path.join(SRC, n + '.jpg')
        if not os.path.exists(src): print('skip (no ungraded copy):', n); continue
        g = grade(Image.open(src))
        g.save(os.path.join(OUT, n + '.jpg'), quality=86, optimize=True, progressive=True)
        sm = g.resize((1200, round(g.height * 1200 / g.width)), Image.LANCZOS)
        sm.save(os.path.join(OUT, n + '-sm.jpg'), quality=82, optimize=True, progressive=True)
        print('graded', n, g.size)

if __name__ == '__main__':
    main(sys.argv[1:])
