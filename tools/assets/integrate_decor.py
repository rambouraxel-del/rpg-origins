#!/usr/bin/env python3
"""Intègre un décor généré : original conservé dans assets-src/decors/, version jeu 960x540 en WebP dans public/assets/areas/.
Usage : python3 -I tools/assets/integrate_decor.py <id_lieu> <fichier_source.png>"""
import sys
from pathlib import Path
from PIL import Image

loc, src = sys.argv[1], Path(sys.argv[2])
root = Path(__file__).resolve().parents[2]
dst_src = root / 'assets-src' / 'decors' / f'{loc}.webp'
dst_src.parent.mkdir(parents=True, exist_ok=True)
Image.open(src).convert('RGB').save(dst_src, 'WEBP', quality=94, method=4)
im = Image.open(src).convert('RGB')
if abs(im.width / im.height - 16 / 9) > 0.02:
    print('ATTENTION : ratio non 16:9', im.size)
out = root / 'public' / 'assets' / 'areas' / f'{loc}.webp'
out.parent.mkdir(parents=True, exist_ok=True)
im.resize((960, 540), Image.LANCZOS).save(out, 'WEBP', quality=90, method=6)
print(f'{loc}: {im.size} -> 960x540 ({out.stat().st_size // 1024} Ko)')
