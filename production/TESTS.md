# Tests réellement exécutés
(aucun pour l'instant)

## 2026-10-09 — T0.4 harnais images (branche claude/rpg-origins-complete)
- `npm run typecheck:tools` : OK (0 erreur).
- `npm run test:images` : 36 tests passés, 0 échec (faux serveur local, aucun appel payant). Budget cumulé en euros, 12 € planifiés / 15 € absolu, conversion bornée, réservations comptées, une image par appel (CLI), checkpoint poussé avant envoi (non exercé en test : registre temporaire).

## 2026-10-09 — Lot 1 (WIP) moteur : `npx tsc --noEmit` OK ; e2e Playwright `tools/e2e/temoin.mjs` : démarrage nouvelle partie, dialogue, déplacement, collision, choix, sortie testés en rendu logiciel (swiftshader). Aucune erreur console hors avertissements GPU.

## 2026-10-09 — Vérification de bout en bout (rendu logiciel swiftshader, build `dist` via vite preview)
Limite honnête : l'autoplay déplace le héros par téléportation/clics pilotés (API `__hub`), il ne remplace pas une partie manuelle.
- `npm run validate` : 61/61 scènes, 12/12 quêtes, 27/27 lieux, accessibilité BFS, zones/sorties OK.
- `npm run test:images` : 36/36 (faux serveur, aucun appel payant).
- Autoplay route A (12 quêtes) : fin A, épilogue A, 0 erreur console. Variante A (Ilyra refusée, confession partielle, sans quêtes) : fin A atteinte, 0 erreur.
- Autoplay route B : variante « épargner » atteinte jusqu'à l'épilogue ; variante « abandon » 58/58 scènes, épilogue B correct, 0 erreur.
- `persist.mjs` : 8/8 (écriture/lecture, export/import, fichiers corrompus refusés, migration, récompense unique, rechargement + Continuer, difficulté).
- `editor.mjs` : export/réimport identique, modification détectée. `audio.mjs` : démarrage OK, 0 erreur.
- `production/verified.json` et `evidence/` régénérés ; `COVERAGE.csv` : 73 lignes.
- Non testé : manette, remappage des touches (non implémentés), performances sur GPU réel, partie manuelle complète.
