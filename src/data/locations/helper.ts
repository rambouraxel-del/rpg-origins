// Fabrique de lieux : génère les rectangles de sortie et les apparitions "from_<lieu>" à partir d'une description compacte.
import type { ExitDef, Facing, Hotspot, LocationDef, Pt, Rect } from '../../core/types';

export interface ExitSpec { side: 'left' | 'right' | 'up' | 'down'; at: number; to: string; label?: string; cond?: ExitDef['cond']; lockedText?: string; /** Nom d'apparition dans le lieu cible (défaut : from_<ce lieu>) */ spawn?: string }

export interface LocSpec {
  id: string; name: string; bg: string;
  walk: Rect[]; blocks?: Rect[]; occluders?: LocationDef['occluders'];
  anchors: Record<string, Pt>; features: Record<string, Rect>;
  exits: ExitSpec[]; hotspots?: Hotspot[]; rest?: Rect; mapPos?: { x: number; y: number };
  spawns?: LocationDef['spawns'];
}

const FACE: Record<ExitSpec['side'], Facing> = { left: 'right', right: 'left', up: 'down', down: 'up' };

export function loc(s: LocSpec): LocationDef {
  const spawns: LocationDef['spawns'] = { default: { x: 480, y: 400 }, ...(s.anchors.start ? { default: s.anchors.start } : {}), ...(s.spawns ?? {}) };
  const exits: ExitDef[] = s.exits.map((e) => {
    const rect: Rect = e.side === 'left' ? { x: 0, y: e.at - 55, w: 26, h: 110 } : e.side === 'right' ? { x: 934, y: e.at - 55, w: 26, h: 110 } : e.side === 'up' ? { x: e.at - 60, y: 120, w: 120, h: 34 } : { x: e.at - 60, y: 506, w: 120, h: 34 };
    const pos: Pt = e.side === 'left' ? { x: 70, y: e.at } : e.side === 'right' ? { x: 890, y: e.at } : e.side === 'up' ? { x: e.at, y: 190 } : { x: e.at, y: 468 };
    spawns[`from_${e.to}`] = { ...pos, face: FACE[e.side] };
    return { id: `${s.id}>${e.to}`, rect, to: e.to, spawn: e.spawn ?? `from_${s.id}`, label: e.label, cond: e.cond, lockedText: e.lockedText };
  });
  return { id: s.id, name: s.name, bg: s.bg, walk: s.walk, blocks: s.blocks, occluders: s.occluders, spawns, anchors: s.anchors, features: s.features, exits, hotspots: s.hotspots, rest: s.rest, mapPos: s.mapPos };
}
