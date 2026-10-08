# RPG Origins

RPG 2D pixel art 16-bit jouable dans le navigateur (Phaser + TypeScript + Vite).

## Lancer en local

```bash
npm install
npm run dev        # puis ouvrir l'adresse affichée (http://localhost:5173)
npm run build      # vérification TypeScript + build dans dist/
```

## Contrôles

Déplacement : ZQSD, WASD ou flèches.

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
```

Ajouter une zone : créer un fichier dans `src/world/areas/`, l'ajouter à `index.ts`
et à `AreaId` dans `types.ts`, puis la relier par une sortie (`exits`).

## Déploiement

Chaque push sur `main` déploie automatiquement sur GitHub Pages
(Settings → Pages → Source : **GitHub Actions**).
