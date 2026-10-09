#!/bin/sh
# Usage : tools/assets/accept_sheet.sh <id_planche> <code_aperçu> "<note>" <noms des personnages, gauche→droite ; '/' sépare les lignes>
ID="$1"; CODE="$2"; NOTE="$3"; shift 3
npm run -s image:review -- --file "public/assets/generated/sheet_$ID.png" --verdict ok --code "$CODE" --note "$NOTE" 2>&1 | grep -v Warning | tail -1 || exit 1
python3 -I tools/assets/extract_sheet.py "public/assets/generated/sheet_$ID.png" "$@"
