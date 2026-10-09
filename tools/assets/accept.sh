#!/bin/sh
# Usage : tools/assets/accept.sh <id_lieu> <code_aperçu> "<note>"  — verdict OK enregistré dans le registre puis décor intégré (WebP 960x540).
ID="$1"; CODE="$2"; NOTE="$3"
npm run -s image:review -- --file "public/assets/generated/$ID.png" --verdict ok --code "$CODE" --note "$NOTE" 2>&1 | grep -v Warning | tail -1 || exit 1
python3 -I tools/assets/integrate_decor.py "$ID" "public/assets/generated/$ID.png"
