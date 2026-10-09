#!/bin/sh
# Usage : tools/assets/gen_sprite.sh <id_planche> <code_inventaire> "<description des personnages>" "<scènes utilisatrices>"
# Génère UNE planche de personnages (edit ancré sur la planche de référence de style) via le harnais, puis l'aperçu à inspecter.
ID="$1"; CODE="$2"; SPEC="$3"; SCENES="$4"
npm run -s image:edit -- --input assets-src/style-reference/style9-reference-character.png \
  --prompt "$(cat production/prompts/style9-char.txt) $SPEC" \
  --purpose "Sprites des personnages de la planche $ID pour les scènes $SCENES (jeu complet RPG Origins)" \
  --target "public/assets/chars/ (planche $ID, découpée par code)" \
  --reuse-checked "Inventaire examiné : seul le héros existe (planche de référence) ; aucun asset externe documenté compatible ; découpe par code impossible, personnages absents" \
  --inventory-code "$CODE" --output "sheet_$ID.png" --task "sprites-$ID" 2>&1 | grep -v -E "Warning|trace-warnings" || exit 1
npm run -s image:inspect -- --file "public/assets/generated/sheet_$ID.png" 2>&1 | grep -E "Aperçu"
