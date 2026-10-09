# Point de reprise

Branche : `claude/rpg-origins-complete` (orpheline). Worktree local : `/home/user/rpg-origins-complete`.
Phase : Lot 1 (moteur). Importés : docs, références style n°9, harnais images adapté (15 €), forêt+héros style9 provisoires.

Fait (voir git log) : moteur Phaser complet en WIP — `src/core` (état, effets idempotents, sauvegardes+export/import), `src/systems` (Director = exécute les scènes de données, Combat avec pause, Stealth, Editor `?dev=1` F3), `src/scenes` (World, UI, Title, Boot), `src/ui` (menus, énigmes, fin/épilogues). Contenu actuel = scène témoin temporaire (`src/data/scenes/index.ts`, `locations/index.ts`).

Commandes : `npm ci`, `npm run typecheck`, `npm run build`, `npx vite --port 5173` puis `node tools/e2e/temoin.mjs` (Playwright), `npm run test:images`, `npm run image:status`.

Prochaines actions :
1. Écrire les 61 scènes + 12 quêtes en données (`src/data/scenes/*.ts`, `src/data/quests/*.ts`) avec ancres symboliques (`at: 'center'`).
2. Lister les ancres/zones requises par lieu → prompts de décors → générer via `npm run image:*` (1 image/appel) → renseigner walk/blocks/anchors/features/exits des 27 lieux avec l'éditeur.
3. Sprites des compagnons/PNJ (planches), puis tests complets des deux routes.

Relance : « Reprends RPG Origins sur la branche enregistrée. Lis production/RESUME.md, vérifie l'état et poursuis sans recommencer. »
