#!/bin/sh
# Usage : tools/assets/reject.sh <id_lieu> <code_aperçu> <raison> "<note>"  (raisons : style|composition|artefact|contenu)
ID="$1"; CODE="$2"; REASON="$3"; NOTE="$4"
npm run -s image:review -- --file "public/assets/generated/$ID.png" --verdict fail --reason "$REASON" --code "$CODE" --note "$NOTE" 2>&1 | grep -v Warning | tail -1
