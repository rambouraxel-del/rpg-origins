# RPG Origins — lancer, tester, déployer

## Jouer en local
```
npm ci
npm run dev        # http://localhost:5173
```
Commandes : ZQSD / WASD / flèches (déplacement), Maj (course), **E** (agir), clic gauche (frapper), Espace (esquive), clic droit (pouvoir), 1 / 2 (raccourcis de pouvoirs), R (soutien du compagnon), F (soin), V (Voile), **Tab** (pause de réflexion en combat), I (inventaire), J (journal), M (carte), Échap (menu).

## Mode développement (jamais dans les menus du jeu)
Ouvrir `http://localhost:5173/?dev=1` : **F2** affiche les zones, **F3** ouvre le mini-éditeur de zones (outils 1 à 6 : marche, obstacle, sortie, zone, ancre, premier plan ; Retour arrière annule ; **P** exporte le JSON du lieu, **O** réimporte ; l'export/réimport est sans perte).

## Contrôles automatiques
```
npm run typecheck      # TypeScript
npm run validate       # 61 scènes, 12 quêtes, 27 lieux : IDs, ancres, sorties symétriques, accessibilité (grille 6 px)
npm run test:images    # garde-fous du budget d'images, serveur factice : aucun appel payant
npm run build          # build statique dans dist/
npx vite preview --port 4173 &   # puis, avec Chromium/Playwright :
node tools/e2e/persist.mjs       # sauvegardes
node tools/e2e/autoplay.mjs A    # parcours automatisé route A (B spare|abandon ; --quests)
```

## Déploiement
Le build est statique et relatif (`base: './'`) : il fonctionne dans n'importe quel sous-dossier GitHub Pages.
- `.github/workflows/build.yml` : construit à chaque push de la branche, publie un artefact, **ne déploie pas**.
- `.github/workflows/pages-deploy.yml` : déploiement **manuel**, exige de taper `REMPLACER LE SITE` ; il remplacerait le site actuel. À n'utiliser que sur autorisation expresse.

## Production d'images (développeur uniquement)
Plafond : **15 € cumulés pour tout le jeu** (12 € planifiés + 3 € de protection), 1 image par appel, réservation poussée avant l'envoi. Voir `docs/images-openai.md` et `CLAUDE.md`. Le jeu livré n'appelle aucune API et ne contient aucune clé.
