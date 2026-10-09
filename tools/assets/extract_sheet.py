#!/usr/bin/env python3
"""Découpe une planche de personnages sur fond blanc : détourage (remplissage depuis les bords), séparation par colonnes vides,
mise à l'échelle commune, export RGBA dans public/assets/chars/ + original conservé en assets-src/sprites/.
Usage : python3 -I tools/assets/extract_sheet.py <planche.png> <nom1> <nom2> ... [--ground]   (de gauche à droite, une ligne ; plusieurs lignes : séparer par '/' )"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[2]
src = Path(sys.argv[1])
cuts = None
for a_ in sys.argv[2:]:
    if a_.startswith('--cuts='): cuts = [int(v) for v in a_.split('=')[1].split(',')]
names = [a for a in sys.argv[2:] if not a.startswith('--')]
rows_spec = ' '.join(names).split('/')
rows_spec = [r.split() for r in rows_spec]
TARGET_H = 168  # hauteur commune (px) d'un adulte ; l'affichage la ramène à ~66 px

im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)

def bg_mask(a):
    """Fond = pixels quasi blancs reliés aux bords (remplissage par balayage)."""
    h, w, _ = a.shape
    near = (a.min(axis=2) >= 236)
    bg = np.zeros((h, w), bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or bg[y, x] or not near[y, x]: continue
        bg[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    return bg

bg = bg_mask(a)
alpha = (~bg).astype(np.uint8) * 255
# bord doux : érosion légère du fond blanc résiduel autour des contours
al = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
alpha = np.asarray(al)
rgba = np.dstack([np.asarray(im), alpha]).astype(np.uint8)
full = Image.fromarray(rgba, 'RGBA')

fg = alpha > 20
H, W = fg.shape
# lignes : bandes horizontales vides
rowsum = fg.sum(axis=1)
bands, inb, start = [], False, 0
for y in range(H):
    if rowsum[y] > 0 and not inb: inb, start = True, y
    if rowsum[y] == 0 and inb:
        inb = False
        if y - start > 40: bands.append((start, y))
if inb: bands.append((start, H))
if len(bands) != len(rows_spec):
    # repli : une seule bande si une seule ligne attendue
    if len(rows_spec) == 1: bands = [(0, H)]
    else: sys.exit(f'{len(bands)} bandes trouvées, {len(rows_spec)} attendues')

out_dir = root / 'public' / 'assets' / 'chars'
out_dir.mkdir(parents=True, exist_ok=True)
(root / 'assets-src' / 'sprites').mkdir(parents=True, exist_ok=True)
Image.open(src).convert('RGB').save(root / 'assets-src' / 'sprites' / f'{src.stem}.webp', 'WEBP', quality=94, method=4)

crops = []
for (y0, y1), spec in zip(bands, rows_spec):
    col = fg[y0:y1].sum(axis=0).copy()
    if cuts:
        for cx in cuts: col[max(0, cx - 6):cx + 6] = 0  # coupes manuelles entre personnages qui se touchent
    segs, ins, s0 = [], False, 0
    for x in range(W):
        if col[x] > 0 and not ins: ins, s0 = True, x
        gap = col[x:x + 8].sum() == 0 if x + 8 <= W else True
        if ins and col[x] == 0 and gap:
            ins = False
            if x - s0 > 20: segs.append((s0, x))
    if ins: segs.append((s0, W))
    if len(segs) != len(spec): sys.exit(f'ligne {y0}-{y1}: {len(segs)} personnages trouvés, {len(spec)} attendus ({segs})')
    for (x0, x1), name in zip(segs, spec):
        sub = fg[y0:y1, x0:x1]
        ys = np.where(sub.any(axis=1))[0]
        crops.append((name, full.crop((x0, y0 + ys[0], x1, y0 + ys[-1] + 1))))

max_h = max(c.height for _, c in crops)
scale = TARGET_H / np.median([c.height for _, c in crops])
for name, c in crops:
    nw, nh = max(1, round(c.width * scale)), max(1, round(c.height * scale))
    r = c.resize((nw, nh), Image.LANCZOS)
    # cadre commun : pieds en bas, centré, marge 4 px
    canvas = Image.new('RGBA', (nw + 8, nh + 6), (0, 0, 0, 0))
    canvas.paste(r, (4, 3), r)
    canvas.save(out_dir / f'{name}.png')
    print(f'{name}: {canvas.size}')
del max_h
