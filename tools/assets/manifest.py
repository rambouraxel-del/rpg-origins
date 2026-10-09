#!/usr/bin/env python3
"""Régénère production/ASSETS.json depuis le registre d'images (source financière et de revue) + les imports manuels."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
ledger = [json.loads(l) for l in (root / 'tools/images/ledger/ledger.jsonl').read_text().splitlines() if l.strip()]
res = {e['id']: e for e in ledger if e['ev'] == 'reserve'}
settle = {e['id']: e for e in ledger if e['ev'] == 'settle'}
reviews = {}
for e in ledger:
    if e['ev'] == 'review': reviews[e['id']] = e
assets = [
    {"id": "style9-reference-decor", "file": "assets-src/style-reference/style9-reference-decor.png", "origin": "importé de main c5448b4", "license": "fourni par l'utilisateur", "status": "référence officielle"},
    {"id": "style9-reference-character", "file": "assets-src/style-reference/style9-reference-character.png", "origin": "importé de main c5448b4", "license": "fourni par l'utilisateur", "status": "référence officielle"},
    {"id": "hero9-dirs", "file": "public/assets/hero-style9/hero9-dirs.png", "origin": "importé de main c5448b4 : 8 vues extraites de la planche de référence", "license": "projet", "status": "accepté (héros ; animation = oscillation par code)"},
    {"id": "forest-style9", "file": "public/assets/areas/forest-style9.png", "origin": "importé de main c5448b4 (réduction du décor de référence)", "license": "projet", "status": "écran-titre seulement"},
]
for rid, r in res.items():
    s = settle.get(rid)
    if not s or not s.get('files'): continue
    rv = reviews.get(rid)
    for f in s['files']:
        name = Path(f).stem
        kind = 'decor' if (root / 'public/assets/areas' / f'{name}.webp').exists() else 'sprite'
        assets.append({
            "id": name, "kind": kind, "source": f"assets-src/{'decors' if kind=='decor' else 'sprites'}/{name}.webp",
            "game_file": f"public/assets/areas/{name}.webp" if kind == 'decor' else None,
            "origin": "GPT Image via tools/images (image:edit ancré sur la référence de style n°9)", "ledger_id": rid, "quality": r.get('quality'), "size": r.get('size'),
            "calculated_usd": s.get('obsUsd'), "estimated_reserved_usd": r.get('estUsd'), "license": "création originale (sortie GPT Image) — usage commercial permis par les conditions d'OpenAI",
            "uses": r.get('purpose'), "status": ("accepté" if rv and rv.get('verdict') == 'ok' else "rejeté" if rv else "non évalué"), "review_note": rv.get('note') if rv else None,
        })
out = {"generated_by": "tools/assets/manifest.py", "note": "Coûts = calculés depuis les tokens, jamais la facture OpenAI. Source financière : tools/images/ledger/ledger.jsonl.", "assets": assets}
(root / 'production/ASSETS.json').write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n')
print(len(assets), 'assets')
