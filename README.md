# RPG Origins

RPG 2D pixel art 16-bit jouable dans le navigateur (Phaser + TypeScript + Vite).

## Lancer en local

```bash
npm install
npm run dev        # puis ouvrir l'adresse affichée (http://localhost:5173)
npm run build      # vérification TypeScript + build dans dist/
```

## Contrôles

Déplacement : ZQSD, WASD ou flèches. Maj : courir.

Mode débogage : ajouter `?debug` à l'adresse pour afficher les collisions.

## Structure

```
src/
  config.ts                   Résolution (480x270, 16:9), vitesse, calques d'affichage
  main.ts                     Configuration Phaser
  scenes/BootScene.ts         Génère les graphismes provisoires
  scenes/WorldScene.ts        Affiche une zone à partir de sa configuration
  entities/Player.ts          Personnage
  systems/InputController.ts  Clavier
  world/types.ts              Format d'une zone (décor, apparitions, sorties, collisions...)
  world/areas/*.ts            Une zone par fichier : forêt, clairière, sanctuaire
public/assets/              Images du jeu (décors 960x540, bandes d'animation du héros)
assets-src/                 Sources originales (décors, GIF du héros)
tools/gif-to-strip.py       Convertit les GIF du héros en bandes PNG
```

Collisions : chaque zone liste des rectangles `walkable` (où les pieds du héros peuvent aller) ;
tout le reste est un obstacle. Un décor se remplace en gardant le même nom de fichier.

Ajouter une zone : créer un fichier dans `src/world/areas/`, l'ajouter à `index.ts`
et à `AreaId` dans `types.ts`, puis la relier par une sortie (`exits`).

## Déploiement

Chaque push sur `main` déploie automatiquement sur GitHub Pages
(Settings → Pages → Source : **GitHub Actions**).
