# Tests réellement exécutés
(aucun pour l'instant)

## 2026-10-09 — T0.4 harnais images (branche claude/rpg-origins-complete)
- `npm run typecheck:tools` : OK (0 erreur).
- `npm run test:images` : 36 tests passés, 0 échec (faux serveur local, aucun appel payant). Budget cumulé en euros, 12 € planifiés / 15 € absolu, conversion bornée, réservations comptées, une image par appel (CLI), checkpoint poussé avant envoi (non exercé en test : registre temporaire).

## 2026-10-09 — Lot 1 (WIP) moteur : `npx tsc --noEmit` OK ; e2e Playwright `tools/e2e/temoin.mjs` : démarrage nouvelle partie, dialogue, déplacement, collision, choix, sortie testés en rendu logiciel (swiftshader). Aucune erreur console hors avertissements GPU.
