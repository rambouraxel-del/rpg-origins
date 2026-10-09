# RPG Origins — instructions pour Claude Code

RPG 2D en style non-pixel art n°9, jouable dans le navigateur (Phaser + TypeScript + Vite), déployé sur GitHub Pages à chaque push sur `main`.
Voir `README.md` pour la structure et `docs/images-openai.md` pour le pipeline d'images.

## Collaboration

- L'utilisateur pilote le produit sans être développeur : réponses **courtes, en français**, solutions simples.
- Travail sur `main` ; ne crée pas de Pull Request sauf demande explicite.
- Avant de rendre la main : `npm run build` doit passer (typage + build). Commandes : `npm run dev`, `npm run build`, `npm run test:images`.
- Ne modifie pas l'architecture du jeu sans besoin ; garde l'écran fixe 960×540 (16:9), caméra fixe.

## Style visuel n°9 (références officielles)

**Les deux images de `assets-src/style-reference/` sont les références principales du style n°9** (ne les modifie ni ne les remplace sans demande de l'utilisateur) :
- `style9-reference-decor.png` : décor de forêt (clairière, cascade, ruisseau, pierres moussues, arbres, clôtures).
- `style9-reference-character.png` : planche de personnage en 8 vues (face, trois-quarts, profil, dos) sur fond blanc.
(PNG convertis sans perte depuis les JPEG fournis. Le héros pixel art actuel et les décors déjà intégrés sont **provisoires** ; la référence est celle-ci.)

**Description du style n°9**
- RPG 2D en vue top-down légèrement inclinée.
- Rendu illustré / peint, **non pixel art**.
- Formes simples, lisibles, propres et stylisées.
- Palette colorée, lumineuse, harmonieuse.
- Ombrage doux et stylisé.
- Décors fantasy lisibles, favorables au gameplay (zone jouable claire au centre, bords encadrés par un feuillage plus sombre).
- Personnages stylisés chibi / SD : grosse tête, petit corps, silhouette claire.
- Cohérence visuelle entre décors et personnages.
- À éviter : réalisme, textures trop détaillées, semi-réalisme, styles trop sombres.

**Ce que montrent les références** (à respecter) :
- *Décor* : feuillages en masses simples à trois valeurs de vert (clair, moyen, sombre), sans détail de feuille par feuille ; troncs bruns chauds ; eau turquoise vive ; pierres gris bleuté avec touches de mousse ; chemins de terre ocre en plaques douces ; petites fleurs blanches et roses en accents ; contours des formes nets mais sans trait noir marqué.
- *Personnage* : cheveux argentés en mèches simples avec une mèche relevée, grands yeux bleus, fin contour brun foncé autour de la silhouette, aplats avec ombres douces ; tenue bleu roi à liserés dorés avec broche en gemme bleue, ceinture, gants et bottes bruns, cape crème doublée de bleu bordée d'or ; palette limitée (bleu, crème, or, brun).

**Règles d'utilisation pour toute génération ou édition d'asset**
1. **Regarde les références** avant de rédiger le prompt : elles sont les deux premières vignettes de la planche de `npm run image:inventory` (le code exigé n'est lisible qu'en ouvrant cette planche).
2. **Mets le style dans le prompt** (en anglais), par exemple : « 2D RPG, slightly tilted top-down view, illustrated painted look (not pixel art), simple clean readable stylized shapes, colorful bright harmonious palette, soft stylized shading, readable gameplay-friendly fantasy environment; characters are stylized chibi/SD with a big head, small body and clear silhouette; consistent look between environment and characters; avoid realism, overly detailed textures, semi-realism and dark moods ».
3. **Ancrage possible** : passer la référence adaptée (décor ou personnage) en `--input` de `image:edit` pour ancrer le style d'un contenu nouveau. Ce procédé n'a pas encore été validé en pratique : à vérifier sur le premier essai, puis noter ici le résultat.
4. **Au verdict** (`image:inspect` puis `image:review`), compare l'image aux références : un résultat réaliste, sombre, trop texturé, semi-réaliste ou en pixel art est un `fail` (raison `style`).
5. Ne copie pas les références telles quelles : elles servent à fixer le style, pas à être reproduites.

## Assets graphiques : le réflexe (sans attendre qu'on te le demande)

Dès qu'une tâche demande un visuel nouveau ou modifié (décor, variante d'ambiance, sprite, tuile, icône, élément d'interface), applique ce qui suit **de toi-même**.

1. **Réutiliser d'abord.** Regarde `public/assets/`, `assets-src/` et les zones existantes (`src/world/areas/`). Si un asset convient, utilise-le. Si une transformation par code suffit (redimensionner, recadrer, miroir, rotation, teinte), fais-la par code (ex. Pillow en Python) : **aucune génération**.
2. **Générer seulement si le jeu en tire un bénéfice concret** (contenu absent, ambiance impossible à obtenir par code). Jamais pour expérimenter ou « voir ce que ça donne ».
3. **Éditer plutôt que générer** quand il faut garder la composition d'un asset existant (`image:edit`) ; générer (`image:generate`) pour un contenu nouveau.
4. **Qualité `low` par défaut.** Ne monte (`medium`, puis `high`) qu'après deux échecs documentés en `low`, avec `--quality-reason`. Taille par défaut `1536x864` (une taille plus petite comme 1024×576 est refusée par l'API).
5. **Suivre le déroulé complet de `docs/images-openai.md`** : `image:inventory` → regarder la planche (outil Read ; ses premières vignettes sont les références du style n°9) et lire le code → `image:generate` / `image:edit` → `image:inspect` → regarder l'aperçu et juger honnêtement → `image:review`. Les codes ne se devinent pas : ils ne se lisent qu'en ouvrant les images. Pas de validation humaine nécessaire tant que les garde-fous passent.
6. **Un verdict `fail` doit être honnête** (composition modifiée, style qui s'écarte du style n°9, objets ajoutés ou perdus, artefacts). Après deux échecs comparables, change d'approche ou traite par code ; ne boucle pas.
7. **Intégrer l'asset retenu** : réduire au format du jeu (décors 960×540, voir `public/assets/areas/`), le placer dans `public/assets/…`, garder l'original dans `assets-src/`, adapter les collisions/sorties de la zone si le décor change, puis vérifier `npm run build`. Les essais restent dans `public/assets/generated/` (ignoré par git).
8. **Garder le définitif sur GitHub** : commit des assets intégrés (`public/assets/…`, `assets-src/…`).
9. **Registre des dépenses** : après toute utilisation du pipeline, commite et pousse `tools/images/ledger/ledger.jsonl` (même s'il n'y a eu que des refus ou inventaires), avec les assets. Sans cela, les compteurs sont perdus à la recréation de l'environnement.

## Règles qui ne se contournent pas

- Tout appel OpenAI pour des images passe par `npm run image:*`. **Jamais** de `curl`/script direct vers l'API, jamais de modification manuelle de `ledger.jsonl`, `config.json` ou `pricing.json`, jamais de variable d'environnement pour relever un plafond.
- Plafonds (bloquants en code) : 5 images par appel, 100 par session, 10 $ par mois avec 20 % de marge. Une réponse `BLOQUÉ [CODE]` se corrige à la cause (lire le message) ; ne cherche pas à la contourner. `--override-reason` seulement si la justification est réelle.
- Si `BUDGET` ou `SESSION_LIMIT` bloque : arrête de générer, utilise un provisoire ou une transformation par code, et préviens l'utilisateur en une phrase.
- Au début d'une session qui touchera aux images : `npm run image:status` (budget, session, persistance).
- Coûts : toujours les annoncer comme **calculés/estimés, pas la facture OpenAI**. Aucune garantie de plafond mensuel global (voir les limites de persistance dans la doc).
- Les tarifs et plafonds ne sont modifiables que par l'utilisateur (`tools/images/pricing.json`, `config.json`).
