// Service de sauvegarde : écrit l'état courant, recharge, gère les effets "save".
import { hub } from '../game';
import { onEffect, newState } from '../core/state';
import { readSlot, writeSlot, type SlotId } from '../core/save';

let ready = false;
export function initSaves(): void {
  if (ready) return;
  ready = true;
  onEffect((_s, e) => { if (e.op === 'save') saveTo(e.slot); });
}

export function saveTo(slot: SlotId): boolean {
  try { writeSlot(slot, hub.state); return true; } catch { hub.ui?.toast("Sauvegarde impossible (stockage du navigateur indisponible)."); return false; }
}

export function autoSave(): void { saveTo('auto'); }

export function loadFrom(slot: SlotId): boolean {
  const s = readSlot(slot);
  if (!s) return false;
  hub.state = s;
  return true;
}

export function freshGame(): void { hub.state = newState(); }
