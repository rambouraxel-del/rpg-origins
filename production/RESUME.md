# Point de reprise

Branche : `claude/rpg-origins-complete` (orpheline, remote rambouraxel-del/rpg-origins). Worktree : `/home/user/rpg-origins-complete`.
Phase : contenu complet en données + 27 décors générés ; reste : sprites personnages, audio, autoplay des 2 routes, finition, livraison.

État réel (voir `production/COVERAGE.csv`, `TASKS.md`, `TESTS.md`) :
- Moteur WIP compilé (`src/`) ; 61 scènes + 12 quêtes écrites en données (`src/data/scenes/*.ts`, `src/data/quests/index.ts`), 27 lieux (`src/data/locations/*.ts`) avec zones de marche relevées sur grilles (`tools/assets/grid.py`).
- Validateur : `npm run validate` (OK). Décors : 27 WebP 960×540 dans `public/assets/areas/` (originaux : `assets-src/decors/`), générés via `tools/assets/gen.sh` (1 image/appel, ~0,06 € réservés chacun ; `npm run image:status`).
- Personnages = silhouettes provisoires (`src/systems/Actor.ts`) sauf Elyan (planche de référence).

Commandes : `npm ci` · `npm run typecheck` · `npm run validate` · `npm run build` · `npx vite --port 5173` puis `node tools/e2e/smoke.mjs` · `npm run test:images` · `npm run image:status`.
Génération d'image (jamais en direct) : `tools/assets/next_inventory.sh` → lire le code sur la planche → `tools/assets/gen.sh <id> <code> "<description>" "<scènes>"` → regarder l'aperçu → `tools/assets/accept.sh|reject.sh`.

Prochaines actions :
1. Sprites : planches de personnages (4 par image) via harnais, extraction par code (`tools/assets/`), branchement dans `src/data/chardefs.ts`.
2. `tools/e2e/autoplay.mjs` : parcours automatisé complet des routes A et B + 12 quêtes (puzzle API) ; contrôle d'accessibilité des zones (BFS) dans `tools/data/validate.ts`.
3. Audio procédural (WebAudio) ; crédits ; workflow de build GitHub Pages **sans** déploiement automatique ; captures de contrôle des lieux.

Relance : « Reprends RPG Origins sur la branche enregistrée. Lis production/RESUME.md, vérifie l'état et poursuis sans recommencer. »
