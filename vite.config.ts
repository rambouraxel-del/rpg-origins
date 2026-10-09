import { defineConfig, type Plugin } from 'vite';
import { rmSync } from 'node:fs';

/** Les essais d'images (public/assets/generated, ignorés par git) ne doivent jamais partir dans le build livré. */
const dropGenerated = (): Plugin => ({
  name: 'drop-generated-assets',
  apply: 'build',
  closeBundle() { rmSync('dist/assets/generated', { recursive: true, force: true }); },
});

// base relatif : fonctionne sur GitHub Pages (https://<user>.github.io/<dépôt>/) comme en local.
export default defineConfig({
  base: './',
  plugins: [dropGenerated()],
  build: { chunkSizeWarningLimit: 2000 }, // Phaser seul pèse ~1,4 Mo
});
