"""Convertit chaque GIF animé de assets-src/hero/ en bande PNG horizontale (public/assets/hero/).
Usage : python3 tools/gif-to-strip.py   (nécessite Pillow)"""
from pathlib import Path
from PIL import Image

src, out = Path('assets-src/hero'), Path('public/assets/hero')
out.mkdir(parents=True, exist_ok=True)
for gif in sorted(src.glob('*.gif')):
    im = Image.open(gif)
    w, h, n = im.width, im.height, im.n_frames
    strip = Image.new('RGBA', (w * n, h), (0, 0, 0, 0))
    for i in range(n):
        im.seek(i)
        strip.paste(im.convert('RGBA'), (i * w, 0))
    strip.save(out / f'{gif.stem}.png', optimize=True)
    print(f'{gif.stem}: {n} frames de {w}x{h}')
