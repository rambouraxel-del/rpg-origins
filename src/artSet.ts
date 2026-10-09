// Prototype style n°9 : choix du jeu d'assets. Par défaut "style9" sur cette branche ;
// ajouter ?art=legacy à l'adresse pour revenir aux anciens assets (héros pixel art, ancien décor de forêt).
export type ArtSet = 'style9' | 'legacy';

export const ART_SET: ArtSet = new URLSearchParams(location.search).get('art') === 'legacy' ? 'legacy' : 'style9';
