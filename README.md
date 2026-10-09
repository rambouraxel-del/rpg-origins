# RPG Origins — La mémoire du monde

RPG 2D d'exploration narrative en style peint n°9 (non pixel art), jouable dans le navigateur (Phaser 4 + TypeScript + Vite).
Écrans fixes 960×540 (16:9), déplacement libre, dialogues, énigmes, infiltration, combat en temps réel avec pause de réflexion, sept pouvoirs, trois compagnons, quêtes secondaires, deux fins.

- Lancer, tester, déployer : [`docs/LANCEMENT.md`](docs/LANCEMENT.md)
- Sources de vérité : [`docs/RPG_Origins_Bible_Narrative_v1.md`](docs/RPG_Origins_Bible_Narrative_v1.md) (récit), [`docs/RPG_Origins_Regles_Gameplay_v0_1.md`](docs/RPG_Origins_Regles_Gameplay_v0_1.md) (systèmes), [`docs/RPG_Origins_Cahier_Technique_Production_v1.md`](docs/RPG_Origins_Cahier_Technique_Production_v1.md) (production)
- Suivi de production : [`production/`](production/) (`RESUME.md`, `STATE.json`, `TASKS.md`, `COVERAGE.csv`, `TESTS.md`, `DECISIONS.md`, `ASSETS.json`, `IMAGE_BUDGET.json`)

## Structure
```
src/core/        état de jeu, effets idempotents, sauvegardes (export/import)
src/systems/     Director (exécute les scènes de données), Combat, Stealth, Actor, Audio procédural, Éditeur de zones
src/scenes/      Boot, Title, World (lieu générique), UI (HUD, dialogues, menus)
src/ui/          menus, énigmes, choix final, épilogues, crédits
src/data/        contenu éditable : scenes/ (61 scènes), quests/ (12 quêtes), locations/ (27 lieux), items, powers, balance…
public/assets/   fonds (areas/), personnages (chars/), héros (hero-style9/)
assets-src/      références de style n°9, originaux des décors et des planches de personnages
tools/           harnais d'images (budget), validation des données, outils d'assets, tests e2e
```

## Contenu en données
Un fichier de scène est une suite d'étapes (`say`, `reach`, `inspect`, `talk`, `choice`, `puzzle`, `combat`, `guide`, `stealth`, `move`, `if`, `gate`, `finalChoice`, `end`…) et d'effets d'une liste fermée (`flag`, `power`, `item`, `quest`, `trust`, `chapter`, `party`, `journal`, `save`…). Aucun code arbitraire dans les données. `npm run validate` contrôle les identifiants, les ancres, les sorties et l'accessibilité réelle de chaque zone.
