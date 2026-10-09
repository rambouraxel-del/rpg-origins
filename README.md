# RPG Origins

RPG 2D en style non-pixel art n°9, jouable dans le navigateur (Phaser + TypeScript + Vite).

## Lancer en local

```bash
npm install
npm run dev        # puis ouvrir l'adresse affichée (http://localhost:5173)
npm run build      # vérification TypeScript + build dans dist/
```

## Rendu

Style non-pixel art n°9 : rendu lissé (`pixelArt` désactivé, pas de `image-rendering: pixelated`). Résolution interne 960×540 (16:9),
mise à l'échelle de la fenêtre avec lissage. Exception temporaire : le héros est encore en pixel art et garde un filtrage NEAREST
(`applyHeroTextureFilter` dans `entities/Player.ts`), à retirer quand il passera au style n°9.

### Prototype style n°9 (branche `proto/style9`)

Forêt avec le décor de référence (`public/assets/areas/forest-style9.png`) et héros extrait de la planche de référence
(8 poses statiques, `public/assets/hero-style9/hero9-dirs.png`, généré par `tools/extract-style9-hero.py`).
Ajouter `?art=legacy` à l'adresse pour revenir aux anciens assets, conservés tels quels.

## Contrôles

Déplacement : ZQSD, WASD ou flèches. Maj : courir.

Mode débogage : ajouter `?debug` à l'adresse pour afficher les collisions.

## Structure

```
src/
  config.ts                   Résolution interne (960x540, 16:9), vitesse, calques d'affichage
  main.ts                     Configuration Phaser
  scenes/BootScene.ts         Charge les images (décors, héros) et crée les animations
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
