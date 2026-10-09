# Licences et provenance

## Code et moteur (dépendances)
- Phaser 4.2.1 — MIT — https://phaser.io
- Vite 8 — MIT — https://vite.dev
- TypeScript 7 — Apache-2.0 — https://www.typescriptlang.org (outil de développement, absent du jeu livré)

## Images
Aucune image externe. Tous les décors et personnages sont des créations originales produites avec l'outil de génération d'images du projet (modèle configuré dans `tools/images/`), à partir des références de style n°9 fournies par l'auteur, puis retouchées par code (détourage, mise à l'échelle). Registre complet : `tools/images/ledger/ledger.jsonl` ; inventaire : `production/ASSETS.json`.
Le héros utilise 8 vues extraites de la planche de référence fournie par l'auteur.

## Audio
Aucune ressource externe : la musique et les effets sont synthétisés en direct par WebAudio (`src/systems/Audio.ts`). Aucune obligation d'attribution.

## Polices
Police système (Georgia / Times) : aucune police embarquée.
