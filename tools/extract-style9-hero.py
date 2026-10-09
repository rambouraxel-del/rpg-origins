"""Prototype style n°9 : extrait les 8 orientations du personnage de référence (fond transparent).

Usage : python3 tools/extract-style9-hero.py [hauteur_en_jeu]
Entrée  : assets-src/style-reference/style9-reference-character.png (non modifiée)
Sorties : assets-src/style9-proto/hero/<direction>.png  (pleine résolution, fond transparent)
          public/assets/hero-style9/hero9-dirs.png       (bande de 8 cases à la taille du jeu)
Ordre des cases : down, down-right, right, up-right, up, up-left, left, down-left.
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path('assets-src/style-reference/style9-reference-character.png')
OUT_FULL = Path('assets-src/style9-proto/hero')
OUT_GAME = Path('public/assets/hero-style9/hero9-dirs.png')
# Case de la planche (4 x 2) -> direction
ORDER = ['down', 'down-right', 'right', 'up-right', 'up', 'up-left', 'left', 'down-left']
GAME_HEIGHT = int(sys.argv[1]) if len(sys.argv) > 1 else 76  # hauteur de la plus grande pose en jeu (px)

img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int16)
H, W, _ = img.shape
light = img.min(axis=2) >= 228  # fond blanc (tolérance JPEG)

# 1. Fond = pixels clairs reliés aux bords (le contour brun du personnage arrête le remplissage).
bg = np.zeros((H, W), bool)
q = deque((y, x) for y in range(H) for x in (0, W - 1) if light[y, x])
q.extend((y, x) for x in range(W) for y in (0, H - 1) if light[y, x])
for y, x in q:
    bg[y, x] = True
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not bg[ny, nx] and light[ny, nx]:
            bg[ny, nx] = True
            q.append((ny, nx))

# 2. Composantes du premier plan, attribuées à la case la plus proche de leur centre.
fg = ~bg
label = np.zeros((H, W), np.int32)
comps = []
for sy, sx in zip(*np.nonzero(fg)):
    if label[sy, sx]:
        continue
    n = len(comps) + 1
    label[sy, sx] = n
    q = deque([(sy, sx)])
    pix = []
    while q:
        y, x = q.popleft()
        pix.append((y, x))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not label[ny, nx]:
                    label[ny, nx] = n
                    q.append((ny, nx))
    comps.append(np.array(pix))
cw, ch = W / 4, H / 2
pose_mask = [np.zeros((H, W), bool) for _ in range(8)]
for pix in comps:
    if len(pix) < 40:  # poussières JPEG
        continue
    cy, cx = pix.mean(axis=0)
    cell = min(int(cy // ch), 1) * 4 + min(int(cx // cw), 3)
    pose_mask[cell][pix[:, 0], pix[:, 1]] = True

# 3. Alpha : opaque à l'intérieur ; liseré (2 px contre le fond) décontaminé du blanc.
near_bg = bg.copy()
for _ in range(2):
    g = near_bg.copy()
    g[1:, :] |= near_bg[:-1, :]; g[:-1, :] |= near_bg[1:, :]; g[:, 1:] |= near_bg[:, :-1]; g[:, :-1] |= near_bg[:, 1:]
    near_bg = g
alpha = np.where(bg, 0.0, 1.0)
fringe = fg & near_bg
a_f = np.clip((255 - img.min(axis=2)) / 225.0, 0.0, 1.0)
alpha[fringe] = a_f[fringe]
rgb = img.astype(np.float64)
safe = np.maximum(alpha, 1e-3)[..., None]
unblended = np.clip((rgb - (1 - alpha[..., None]) * 255) / safe, 0, 255)
rgb = np.where(fringe[..., None], unblended, rgb)

# 4. Découpe : cadre commun, pieds alignés en bas, centrés sur les pieds.
crops = []
for i, m in enumerate(pose_mask):
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    feet = m[max(y1 - int((y1 - y0) * 0.08), y0):y1]
    fx = int(np.nonzero(feet.any(axis=0))[0].mean())
    rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    rgba[..., :3] = rgb[y0:y1, x0:x1].round().astype(np.uint8)
    rgba[..., 3] = (np.where(m[y0:y1, x0:x1], alpha[y0:y1, x0:x1], 0) * 255).round().astype(np.uint8)
    crops.append((Image.fromarray(rgba, 'RGBA'), fx - x0))
pad = 8
half = max(max(fx, im.width - fx) for im, fx in crops) + pad
frame_w, frame_h = 2 * half, max(im.height for im, _ in crops) + pad
OUT_FULL.mkdir(parents=True, exist_ok=True)
frames = []
for (im, fx), name in zip(crops, ORDER):
    f = Image.new('RGBA', (frame_w, frame_h), (0, 0, 0, 0))
    f.paste(im, (half - fx, frame_h - pad // 2 - im.height))
    f.save(OUT_FULL / f'{name}.png', optimize=True)
    frames.append(f)

# 5. Taille du jeu : réduction uniforme (proportions conservées), en alpha prémultiplié.
scale = GAME_HEIGHT / (frame_h - pad)
gw, gh = round(frame_w * scale), round(frame_h * scale)
strip = Image.new('RGBA', (gw * 8, gh), (0, 0, 0, 0))
for i, f in enumerate(frames):
    strip.paste(f.convert('RGBa').resize((gw, gh), Image.LANCZOS).convert('RGBA'), (i * gw, 0))
OUT_GAME.parent.mkdir(parents=True, exist_ok=True)
strip.save(OUT_GAME, optimize=True)
print(f'cadre source {frame_w}x{frame_h} -> jeu {gw}x{gh} (échelle {scale:.4f}), {len(comps)} composantes')
