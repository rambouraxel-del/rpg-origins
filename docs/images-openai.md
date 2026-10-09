# Génération et édition d'images (OpenAI)

Outil pour créer ou modifier des assets du jeu. Aucune clé dans le code : l'accès à `api.openai.com` et
l'authentification sont gérés par l'environnement (Network Secret). Les commandes `npm run` activent
`NODE_USE_ENV_PROXY=1`, nécessaire pour passer par le proxy du cloud.

## Déroulé obligatoire (4 étapes)

```bash
# 1. Examiner les assets existants : produit une planche de contact avec un code dessiné dedans
npm run image:inventory -- --query "mots du besoin"
#    → ouvrir la planche (outil Read), regarder les assets, lire le code à 4 chiffres en haut à gauche

# 2. Générer (ou image:edit) en fournissant le code lu
npm run image:generate -- --prompt "..." --purpose "..." --target "..." --reuse-checked "..." --inventory-code 1234

# 3. Inspecter le résultat : produit un aperçu avec un nouveau code dessiné dedans
npm run image:inspect -- --file public/assets/generated/x.png
#    → ouvrir l'aperçu (outil Read), juger l'image, lire le code

# 4. Enregistrer le verdict en fournissant le code lu
npm run image:review -- --file public/assets/generated/x.png --verdict ok|fail --code 5678 [--reason style|composition|artefact|contenu]

npm run image:status     # consommation, plafonds, session, persistance
npm run test:images      # 35 tests des garde-fous (faux serveur local : aucun appel payant)
```

Options de génération : `--model` (défaut `gpt-image-2.5-flare`), `--quality` (défaut `low`), `--size` (défaut `1536x864` ;
les tailles trop petites sont refusées par l'API), `--n` (1 à 5), `--output`, `--task`, `--overwrite`.

## Preuves d'examen : ce qu'elles prouvent et ne prouvent pas

Les champs `--purpose` / `--reuse-checked` sont de simples déclarations. Ils ne suffisent donc pas : le code lit en plus
une **preuve d'examen visuel**. Le code n'est jamais affiché en texte par l'outil ; il n'est dessiné que dans l'image
(le registre n'en garde que l'empreinte). Pour le lire, il faut ouvrir l'image.

- **Avant** : un inventaire est requis pour chaque génération. Il est à usage unique, lié à la session, valable 2 h, et
  invalidé si les assets du jeu changent depuis (`NO_INVENTORY`, `INVENTORY_INVALID`, `INVENTORY_EXPIRED`, `INVENTORY_STALE`).
- **Après** : aucun verdict sans le code de l'aperçu de cette image, et si le fichier est modifié entre-temps le verdict est refusé
  (`INSPECTION_REQUIRED`, `INSPECTION_STALE`). Tant qu'une image générée n'a pas de verdict, aucune nouvelle génération
  de la même tâche n'est possible (`REVIEW_PENDING`). Avec `--n` > 1, chaque image doit être inspectée et évaluée.

Limite : cela prouve que l'image a été rendue puis lue (code dans les pixels), pas que le jugement est bon. C'est un garde-fou
contre l'oubli et la paresse, pas contre un contournement volontaire.

## Autres garde-fous (bloquants, vérifiés en code avant tout appel)

| Contrôle | Comportement |
|---|---|
| 5 images max par appel | `MAX_PER_CALL` |
| 100 images max par session, toutes commandes confondues | `SESSION_LIMIT` |
| Budget mensuel 10 $, marge de sécurité 20 % | refus si dépense comptée + estimation > 8 $ (`BUDGET`) |
| Bénéfice et réutilisation | `--purpose`, `--target`, `--reuse-checked` obligatoires ; assets au nom proche listés |
| Transformation par code | redimensionner, recadrer, miroir, rotation, teinte… refusés (`CODE_TRANSFORM`) sauf `--override-reason` |
| Qualité minimale | `low` par défaut ; autre qualité exige `--quality-reason` |
| Redondance | prompt trop proche d'un résultat accepté → `REDUNDANT` |
| Pas de boucle d'échecs | après 2 échecs comparables, `--new-approach` + prompt nettement différent (`REPEATED_FAILURE`) |
| Erreur API | arrêt immédiat, aucune nouvelle tentative. Requête refusée (4xx) ou jamais partie (DNS, connexion refusée) : rien compté. Autre erreur (5xx, coupure) : estimation conservée |

**Les variables d'environnement ne peuvent que resserrer les plafonds.** `IMAGE_SESSION_LIMIT` et `IMAGE_MONTHLY_BUDGET_USD`
sont plafonnées par `tools/images/config.json` (`min(config, env)`) ; une valeur supérieure, négative ou invalide est ignorée.
Aucun autre réglage ne désactive un plafond.

## Comptabilité

- **Prix par token** (`pricing.json › rates`) : tarifs Standard de GPT Image 2.5 Flare, **5 $ texte entrant, 8 $ image entrante,
  30 $ image sortante par million de tokens**. Source : https://developers.openai.com/api/docs/guides/image-generation.
  Ces valeurs ont été fournies par l'utilisateur d'après cette source ; **l'outil ne les a pas recoupées** (la page est
  inaccessible depuis l'environnement cloud). Si `rates.verified` passe à `false`, les estimations sont multipliées par 2.
- **Nombre de tokens d'une génération** (`pricing.json › tokenEstimates`) : incertitude distincte, car ce nombre n'est connu
  qu'après l'appel. L'estimation avant appel = table prudente de tokens par mégapixel × `safetyFactor` (2), relevée au maximum
  réellement observé dans le registre pour la même qualité, jamais abaissée.
- **Estimé** (avant l'appel) et **calculé** (après, depuis les tokens renvoyés × prix) sont tracés séparément dans le registre.
  Aucun des deux n'est la facture OpenAI. Les plafonds utilisent le calculé s'il existe, sinon l'estimé.
- Registre : `tools/images/ledger/ledger.jsonl` (versionné, ajout seul : réservation, règlement ou libération, inventaires,
  inspections, revues). Journal détaillé avec les prompts : `logs/image-generations.jsonl` (ignoré par git).

## Identifiant de session

Les compteurs sont par session Claude Code Cloud. L'identifiant vient de `CLAUDE_CODE_REMOTE_SESSION_ID` (forme `cse_…`,
même suffixe que l'identifiant de session dans l'URL claude.ai/code ; vérifié dans cet environnement), ou de `IMAGE_SESSION_ID`.
`CLAUDE_CODE_SESSION_ID` (uuid de conversation locale) est volontairement ignoré : il peut changer à la reprise d'une session.
**Sans identifiant fiable**, toutes les exécutions partagent un seul compteur `unknown-session` sur le mois, avec un plafond
conservateur de 20 images. `image:status` indique si l'identifiant est fiable.

## Persistance du registre et sessions parallèles : limites

Ce système **ne garantit pas** un plafond mensuel global.

- Le registre est un fichier du dépôt. Claude Code Cloud recrée l'environnement : **seul ce qui est commité et poussé survit**
  (vérifié par test : un clone ne contient pas les lignes non commitées). `image:status` signale si le registre a des
  modifications non commitées. **Commitez et poussez le registre à la fin de chaque session de génération.**
- Si le fichier disparaît, il est recréé en **mode récupéré** : plafonds conservateurs (1 $ pour le mois, 20 images par session).
- Deux sessions ou branches en parallèle ont chacune leur copie : leurs dépenses ne s'additionnent qu'**après fusion** ; pendant ce
  temps chacune peut consommer jusqu'au budget. Le fichier `.gitattributes` applique `merge=union` au registre : les fusions
  gardent les lignes des deux côtés sans conflit (vérifié par test), mais ne rattrapent pas un dépassement déjà commis.
- Les dépenses hors de cet outil (autre clé, console OpenAI, autre projet) ne sont pas vues.
- La seule protection réellement globale est la limite de dépense configurée côté OpenAI (compte/projet). Les garde-fous de
  l'outil la complètent, ils ne la remplacent pas.

## Utilisation depuis le code

`tools/images/openai-images.ts` exporte `generateImage()`, `editImage()`, `createInventory()`, `createInspection()` et
`reviewImage()` (mêmes champs que la CLI). Les images vont dans `public/assets/generated/` (ignoré par git) ; on déplace les
images retenues dans `public/assets/areas/`.
