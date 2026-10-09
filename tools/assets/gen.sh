#!/bin/sh
# Usage : tools/assets/gen.sh <id_lieu> <code_inventaire> "<description de la composition>" "<scènes utilisatrices>"
# Génère UN décor (edit ancré sur la référence de style) via le harnais, puis crée l'aperçu à inspecter. Aucun contournement du harnais.
ID="$1"; CODE="$2"; SPEC="$3"; SCENES="$4"
npm run -s image:edit -- --input assets-src/style-reference/style9-reference-decor.png \
  --prompt "$(cat production/prompts/style9-short.txt) $SPEC" \
  --purpose "Décor du lieu $ID pour les scènes $SCENES (jeu complet RPG Origins)" \
  --target "public/assets/areas/$ID.webp (lieu $ID)" \
  --reuse-checked "Inventaire examiné : aucun décor existant pour $ID ; transformation par code impossible (contenu absent)" \
  --inventory-code "$CODE" --output "$ID.png" --task "decor-$ID" 2>&1 | grep -v -E "Warning|trace-warnings" || exit 1
npm run -s image:inspect -- --file "public/assets/generated/$ID.png" 2>&1 | grep -E "Aperçu"
