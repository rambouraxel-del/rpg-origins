# Génération et édition d'images (OpenAI)

Outil en ligne de commande pour créer ou modifier des assets du jeu. Aucune clé dans le code :
l'accès à `api.openai.com` et l'authentification sont gérés par l'environnement (Network Secret).

## Commandes

```bash
# Générer
npm run image:generate -- --prompt "Une clairière magique, vue de dessus" --output clairiere-v2.png

# Modifier une image existante (--mask optionnel : zones transparentes = à modifier)
npm run image:edit -- --input public/assets/areas/forest.png --prompt "Ajoute de la brume" --output forest-brume.png

npm run typecheck:tools   # vérifie le TypeScript de l'outil
```

Options : `--prompt` (obligatoire), `--output` (nom de fichier), `--model` (défaut `gpt-image-2.5-flare`),
`--quality` (défaut `low`), `--size` (défaut `1536x864`), `--n` (1 à 5).

## Résultats

- Images : `public/assets/generated/` (PNG décodé depuis le base64, puis vérifié : fichier présent, signature PNG, dimensions).
- Journal : `logs/image-generations.jsonl`, une ligne par appel (date, modèle, qualité, taille, prompt,
  fichiers, dimensions, consommation en tokens renvoyée par l'API, ou l'erreur).
  Pas de tarif codé en dur : le coût se déduit des tokens journalisés.

## Garde-fous

- 5 images maximum par commande ; une commande = une tâche.
- Aucune nouvelle tentative automatique : en cas d'erreur API, arrêt immédiat (code de sortie 1) et erreur journalisée.
- Une taille trop petite est refusée par l'API (ex. 1024x576) ; 1536x864 fonctionne.

## Utilisation depuis le code

`tools/images/openai-images.ts` exporte `generateImage()` et `editImage()` (mêmes options que la CLI).
Les lancer avec `NODE_USE_ENV_PROXY=1` (déjà fait par les commandes npm) pour passer par le proxy du cloud.

Les images générées ne font pas partie du jeu tant qu'elles ne sont pas déplacées dans `public/assets/areas/`
ou référencées par une zone.
