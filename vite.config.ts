import { defineConfig } from 'vite';

// base relatif : fonctionne sur GitHub Pages (https://<user>.github.io/rpg-origins/) comme en local.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 }, // Phaser seul pèse ~1,4 Mo
});
