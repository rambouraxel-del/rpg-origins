# Génération et édition d'images (OpenAI)

Outil pour créer ou modifier des assets du jeu. Aucune clé dans le code : l'accès à `api.openai.com`
et l'authentification sont gérés par l'environnement (Network Secret). Les commandes `npm run` activent
`NODE_USE_ENV_PROXY=1`, nécessaire pour passer par le proxy du cloud.

## Commandes

```bash
npm run image:status     # consommation, plafonds restants, état des tarifs
npm run image:generate -- --prompt "..." --purpose "..." --target "..." --reuse-checked "..." [--output x.png]
npm run image:edit     -- --input src.png --prompt "..." --purpose "..." --target "..." --reuse-checked "..." [--mask m.png]
npm run image:review   -- --file public/assets/generated/x.png --verdict ok|fail [--reason style|composition|artefact|contenu]
npm run test:images      # tests des garde-fous (faux serveur local : aucun appel payant)
npm run typecheck:tools
```

Options : `--model` (défaut `gpt-image-2.5-flare`), `--quality` (défaut `low`), `--size` (défaut `1536x864`,
les tailles trop petites sont refusées par l'API), `--n` (1 à 5), `--task`, `--overwrite`.

## Garde-fous techniques (bloquants, vérifiés en code avant tout appel)

| Contrôle | Comportement |
|---|---|
| 5 images max par appel | refus (`MAX_PER_CALL`) |
| 100 images max par session, toutes commandes confondues | refus (`SESSION_LIMIT`) |
| Budget mensuel (10 $ par défaut) avec marge de sécurité de 20 % | refus si dépense comptée + estimation > 80 % du budget (`BUDGET`) |
| Bénéfice pour le jeu | `--purpose` (≥ 15 car.) et `--target` obligatoires |
| Réutilisation d'abord | `--reuse-checked` obligatoire (assets examinés, pourquoi pas de transformation par code) ; les assets au nom proche sont listés |
| Transformation par code | redimensionner, recadrer, miroir, rotation, teinte… sont refusés (`CODE_TRANSFORM`), sauf `--override-reason` |
| Qualité minimale | `low` par défaut ; autre qualité exige `--quality-reason` |
| Redondance | prompt trop proche d'un résultat déjà accepté → refus (`REDUNDANT`) |
| Revue obligatoire | pas de nouvelle génération d'une tâche tant que le résultat précédent n'est pas évalué (`REVIEW_PENDING`) |
| Pas de boucle d'échecs | après 2 échecs comparables, il faut `--new-approach` et un prompt nettement différent (`REPEATED_FAILURE`) |
| Erreur API | arrêt immédiat, aucune nouvelle tentative automatique ; erreur 4xx = rien compté, autre erreur = estimation conservée |

Les plafonds (session, budget, 5 par appel) ne se contournent par aucune option. L'environnement ne peut
que les resserrer : `IMAGE_MONTHLY_BUDGET_USD`, `IMAGE_SESSION_LIMIT`. Les valeurs par défaut sont dans
`tools/images/config.json`.

## Déroulé recommandé après une génération

1. L'outil vérifie le PNG (signature, dimensions, image vide ou transparente) et signale les problèmes techniques.
2. Regarder l'image, puis enregistrer le verdict avec `image:review` (`ok` ou `fail` + catégorie).
3. Si une correction locale suffit (recadrage, redimensionnement, retouche de couleur), la faire par code
   plutôt que de regénérer. Régénérer seulement pour un changement significatif.

## Comptabilité

- Registre : `tools/images/ledger/ledger.jsonl` (versionné, ajout seul). Un appel = « réservation »
  (estimation avant appel) puis « règlement » (calcul depuis les tokens renvoyés), ou « libération ».
  Le journal détaillé avec les prompts complets est `logs/image-generations.jsonl` (ignoré par git).
- **Estimé** = calcul prudent avant l'appel. **Calculé** = tokens réellement renvoyés × tarifs configurés.
  Ni l'un ni l'autre n'est la facture OpenAI. Les plafonds utilisent le montant calculé s'il existe, sinon l'estimation.
- Tarifs : `tools/images/pricing.json`. **Ils sont actuellement NON VÉRIFIÉS** (valeurs de référence prudentes) ;
  tant que `verified` est `false`, toutes les estimations sont doublées. Les vérifier sur
  https://platform.openai.com/docs/pricing, puis passer `verified` à `true` et renseigner `checkedOn`.

## Limites de persistance (à lire)

Ce système **ne garantit pas** un plafond mensuel global :

- Le registre vit dans le dépôt. Claude Code Cloud recrée l'environnement : **les dépenses d'une session ne
  survivent que si le registre est commité et poussé**. Pensez à `git add tools/images/ledger && git commit` après avoir généré.
- Deux branches ou deux sessions parallèles ont chacune leur copie du registre : leurs dépenses ne s'additionnent
  qu'après fusion.
- Les dépenses faites hors de cet outil (autre clé, autre projet, console OpenAI) ne sont pas vues.
- Si le registre disparaît, il est recréé en **mode récupéré** : plafonds conservateurs (1 $ pour le mois, 20 images par session).
- Le seul plafond réellement global est celui qu'on règle côté OpenAI (limite de dépense du compte/projet).
  C'est la vraie protection du budget ; les garde-fous ci-dessus la complètent.

## Utilisation depuis le code

`tools/images/openai-images.ts` exporte `generateImage()`, `editImage()` et `reviewImage()` (mêmes champs que la CLI).
Les images vont dans `public/assets/generated/` (ignoré par git) ; on déplace les images retenues dans `public/assets/areas/`.
