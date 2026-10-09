# RPG Origins — reprise obligatoire

**À chaque démarrage ou reprise, AVANT toute modification** : lire `production/RESUME.md`, `production/STATE.json`, `production/TASKS.md` et le registre d'images (`tools/images/ledger/ledger.jsonl`, budget : `production/IMAGE_BUDGET.json`).

- Dépôt : `rambouraxel-del/rpg-origins`. Branche autorisée pour cette réalisation : `claude/rpg-origins-complete` (orpheline, vide au départ). Aucun merge, rebase, force-push ; ne touche ni `main` ni les autres branches ni le site publié.
- Sources de vérité (dans `docs/`) : `RPG_Origins_Bible_Narrative_v1.md` (faits narratifs, IDs), `RPG_Origins_Regles_Gameplay_v0_1.md` (systèmes), `RPG_Origins_Cahier_Technique_Production_v1.md` (architecture, assets, budget). Mission complète : `docs/RPG_Origins_Prompt_One_Shot.md`.
- Utilisateur : pilote sans être développeur ; réponses **courtes, en français**. Pas de Pull Request sauf demande.
- Stack : Phaser / TypeScript / Vite, écran fixe 960×540 (16:9), caméra fixe. Contrôles : `npm run typecheck`, `npm run build`, `npm test`.
- Style n°9 : références dans `assets-src/style-reference/` (ne pas modifier). Rendu peint, non pixel art.
- **Budget GPT Image : 15 € cumulés pour tout le jeu** (12 € de plan + 3 € de protection compris), toutes sessions/branches. Uniquement via `npm run image:*`. Réserver avant d'envoyer, 1 résultat par appel, ≤1 correction payante par besoin, aucune relance auto, jamais de clé dans le dépôt. Source financière unique : le registre `ledger.jsonl`.
- Checkpoints : petites tâches, mise à jour de `production/*`, commit + push sur la branche après chaque unité cohérente. WIP = marqué WIP.
- **Terminé** = aventure complète jouable (prologue, 10 chapitres, 61 scènes, 12 quêtes secondaires, 2 épilogues + crédits), sauvegarde/reprise, deux routes vérifiées, build statique, licences/crédits, budget respecté. Sinon : ne pas déclarer terminé.
