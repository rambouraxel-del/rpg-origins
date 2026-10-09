#!/usr/bin/env python3
"""Superpose une grille numérotée (pas de 60 px, repère 960x540) sur un ou plusieurs décors, pour lire les coordonnées des zones.
Usage : python3 -I tools/assets/grid.py <sortie.png> <id_lieu> [<id_lieu2> ...]  (les lieux sont empilés verticalement)"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root = Path(__file__).resolve().parents[2]
out = Path(sys.argv[1]); ids = sys.argv[2:]
font = ImageFont.load_default()
tiles = []
for i in ids:
    im = Image.open(root / 'public' / 'assets' / 'areas' / f'{i}.webp').convert('RGB').resize((960, 540))
    d = ImageDraw.Draw(im, 'RGBA')
    for x in range(0, 960, 60):
        d.line([(x, 0), (x, 540)], fill=(255, 255, 255, 110 if x % 120 == 0 else 55), width=1)
        d.text((x + 2, 2), str(x), fill=(255, 255, 0, 255), font=font)
    for y in range(0, 540, 60):
        d.line([(0, y), (960, y)], fill=(255, 255, 255, 110 if y % 120 == 0 else 55), width=1)
        d.text((2, y + 2), str(y), fill=(0, 255, 255, 255), font=font)
    d.rectangle([0, 520, 140, 540], fill=(0, 0, 0, 200)); d.text((4, 524), i, fill=(255, 255, 255, 255), font=font)
    tiles.append(im)
sheet = Image.new('RGB', (960, 540 * len(tiles)))
for k, t in enumerate(tiles): sheet.paste(t, (0, 540 * k))
sheet.save(out)
print(out)
