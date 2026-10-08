"""Convertit chaque GIF animé de assets-src/hero/ en bande PNG horizontale (public/assets/hero/).
Usage : python3 tools/gif-to-strip.py   (nécessite Pillow)"""
from pathlib import Path
from PIL import Image

src, out = Path('assets-src/hero'), Path('public/assets/hero')
out.mkdir(parents=True, exist_ok=True)
for gif in sorted(src.glob('*.gif')):
    im = Image.open(gif)
    n = im.n_frames
    w = h = 92  # taille de case commune ; les GIF plus petits sont centrés, pieds alignés (y=78)
    strip = Image.new('RGBA', (w * n, h), (0, 0, 0, 0))
    for i in range(n):
        im.seek(i)
        f = im.convert('RGBA')
        strip.paste(f, (i * w + (w - f.width) // 2, 78 - f.height if f.height < h else 0))
    strip.save(out / f'{gif.stem}.png', optimize=True)
    print(f'{gif.stem}: {n} frames')
