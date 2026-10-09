#!/bin/sh
# Affiche le chemin de la planche d'inventaire (à ouvrir avec Read pour lire le code).
npm run -s image:inventory 2>&1 | grep -E "Planche"
