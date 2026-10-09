// Validateur des données de jeu : IDs, scènes, quêtes, lieux, ancres, sorties, effets. Lancé par `npm run validate` (bundle rolldown -> node).
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { SCENES } from '../../src/data/scenes/index';
import { LOCATIONS } from '../../src/data/locations/index';
import { QUESTS } from '../../src/data/quests/index';
import { CHARS } from '../../src/data/chardefs';
import { NARRATIVE, EQUIPMENT } from '../../src/data/items';
import { POWERS } from '../../src/data/powers';
import type { Area, Effect, LocationDef, Place, SceneDef, Step } from '../../src/core/types';

const errors: string[] = [];
const warns: string[] = [];
const err = (m: string) => errors.push(m);

const CANON = [
  'P01', 'P02', 'P03', 'P04', 'P05',
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((c) => [1, 2, 3, 4, 5].map((s) => `C${String(c).padStart(2, '0')}S${String(s).padStart(2, '0')}`)),
  'A01', 'A02', 'A03', 'B01', 'B02', 'B03',
];

const locs = new Map<string, LocationDef>(LOCATIONS.map((l) => [l.id, l]));
const LOCATION_IDS = ['palace_garden', 'palace_hall', 'palace_portal', 'forest_arrival', 'forest_crossing', 'lisiere_square', 'lisiere_well', 'root_shrine', 'river_bank', 'river_relay', 'water_shrine', 'miral_gate', 'memory_garden', 'memory_shrine', 'stellar_dock', 'stellar_command', 'stellar_lab', 'chronal_chamber', 'occupied_archive', 'archive_core', 'valley_camp', 'valley_relay', 'valley_bridge', 'valley_outlook', 'core_approach', 'core_gate', 'planet_heart'];

/** anchors/features requis par lieu : { anchors: Set, features: Set, any: Set (nom indifférent) } */
const reachNeeds = new Map<string, Set<string>>();
const need = new Map<string, { anchor: Set<string>; feature: Set<string>; any: Set<string>; spawns: Set<string> }>();
const need_of = (id: string) => { let n = need.get(id); if (!n) { n = { anchor: new Set(), feature: new Set(), any: new Set(), spawns: new Set() }; need.set(id, n); } return n; };

const effectIds = (loc: string, e: Effect | undefined, ctx: string) => {
  if (!e) return;
  if (e.op === 'item' && !NARRATIVE[e.id]) err(`${ctx}: objet inconnu « ${e.id} »`);
  if (e.op === 'equip' && !EQUIPMENT[e.id]) err(`${ctx}: équipement inconnu « ${e.id} »`);
  if (e.op === 'power' && !POWERS[e.id]) err(`${ctx}: pouvoir inconnu « ${e.id} »`);
  if (e.op === 'quest' && !QUESTS.some((q) => q.id === e.id)) err(`${ctx}: quête inconnue « ${e.id} »`);
  if (e.op === 'discover' && !LOCATION_IDS.includes(e.loc)) err(`${ctx}: lieu inconnu « ${e.loc} »`);
  void loc;
};

function walkSteps(steps: Step[], loc: string, ctx: string, hot: Set<string>, onLoc: (l: string) => void, speakers: Set<string>): string {
  let cur = loc;
  const place = (p: Place | undefined, kind: 'anchor' | 'any') => { if (typeof p === 'string') need_of(cur)[kind].add(p); };
  const area = (a: Area | undefined) => { if (typeof a === 'string') { need_of(cur).any.add(a); (reachNeeds.get(cur) ?? reachNeeds.set(cur, new Set()).get(cur)!).add(a); } };
  const say = (lines: { who: string }[]) => { for (const l of lines) speakers.add(l.who); };
  steps.forEach((s, i) => {
    const c = `${ctx}#${i}`;
    switch (s.t) {
      case 'say': say(s.lines); s.effects?.forEach((e) => effectIds(cur, e, c)); break;
      case 'reach': area(s.zone); s.effects?.forEach((e) => effectIds(cur, e, c)); break;
      case 'inspect': for (const t of s.targets) if (!hot.has(t)) err(`${c}: point d'intérêt « ${t} » introuvable`); break;
      case 'talk': say(s.lines); for (const o of s.choices ?? []) { say(o.lines ?? []); o.effects?.forEach((e) => effectIds(cur, e, c)); } s.effects?.forEach((e) => effectIds(cur, e, c)); break;
      case 'choice': for (const o of s.options) { say(o.lines ?? []); o.effects?.forEach((e) => effectIds(cur, e, c)); } break;
      case 'puzzle': break;
      case 'combat': for (const e of s.enemies) place(e.at, 'anchor'); break;
      case 'guide': for (const g of s.groups) { place(g.from, 'anchor'); place(g.to, 'anchor'); } break;
      case 'stealth': place(s.start, 'anchor'); area(s.goal); for (const p of s.patrols) for (const q of p.path) place(q, 'anchor'); break;
      case 'move': if (!LOCATION_IDS.includes(s.loc)) err(`${c}: lieu inconnu « ${s.loc} »`); need_of(s.loc).spawns.add(s.spawn); cur = s.loc; onLoc(cur); break;
      case 'set': s.effects.forEach((e) => effectIds(cur, e, c)); break;
      case 'if': { const a = walkSteps(s.then, cur, `${c}.then`, hot, onLoc, speakers); const b = walkSteps(s.otherwise ?? [], cur, `${c}.else`, hot, onLoc, speakers); cur = a === b ? a : cur; break; }
      case 'gate': need_of(cur).feature.add(s.at); (reachNeeds.get(cur) ?? reachNeeds.set(cur, new Set()).get(cur)!).add(s.at); break;
      default: break;
    }
  });
  return cur;
}

const hotspotIds = (l: LocationDef | undefined, extra: { id: string }[] | undefined) => new Set([...(l?.hotspots ?? []).map((h) => h.id), ...(extra ?? []).map((h) => h.id)]);

// ------------------------------------------------------------ scènes
const byId = new Map<string, SceneDef>();
for (const s of SCENES) { if (byId.has(s.id)) err(`scène en double : ${s.id}`); byId.set(s.id, s); }
if (SCENES.length !== 61) err(`61 scènes attendues, ${SCENES.length} trouvées`);
CANON.forEach((id, i) => {
  const s = byId.get(id);
  if (!s) { err(`scène manquante : ${id}`); return; }
  const exp = CANON[i + 1];
  const nexts = id === 'C10S05' ? ['A01', 'B01'] : id === 'A03' || id === 'B03' ? [] : exp ? [exp] : [];
  if (id === 'C10S05') { if (s.next !== null && s.next !== undefined) err('C10S05 : next doit être null (branche)'); }
  else if (id === 'A03' || id === 'B03') { if (s.next) err(`${id} : fin de route, next doit être null`); }
  else if (id === 'A01' && s.next !== 'A02' || id === 'A02' && s.next !== 'A03') err(`${id} : chaîne A cassée`);
  else if (id === 'B01' && s.next !== 'B02' || id === 'B02' && s.next !== 'B03') err(`${id} : chaîne B cassée`);
  else if (!/^[AB]/.test(id) && s.next !== exp) err(`${id} : next = ${s.next} (attendu ${exp})`);
  void nexts;
});
const speakers = new Set<string>();
for (const s of SCENES) {
  const l = locs.get(s.loc);
  if (!LOCATION_IDS.includes(s.loc)) err(`${s.id}: lieu inconnu « ${s.loc} »`);
  need_of(s.loc);
  if (s.spawn && s.spawn !== 'default') need_of(s.loc).spawns.add(s.spawn);
  for (const a of s.actors ?? []) { if (!CHARS[a.id]) err(`${s.id}: personnage inconnu « ${a.id} »`); if (typeof a.at === 'string') need_of(s.loc).anchor.add(a.at); }
  for (const h of s.hotspots ?? []) if (h.at) need_of(s.loc).feature.add(h.at);
  for (const p of s.party ?? []) if (!CHARS[p]) err(`${s.id}: compagnon inconnu « ${p} »`);
  const hot = hotspotIds(l, s.hotspots);
  const lastLoc = walkSteps(s.steps, s.loc, s.id, hot, () => undefined, speakers);
  for (const a of s.ambient ?? []) a.lines.forEach((x) => speakers.add(x.who));
  s.onComplete?.forEach((e) => effectIds(lastLoc, e, `${s.id}:onComplete`));
  if (s.next && !byId.has(s.next)) err(`${s.id}: next inconnu « ${s.next} »`);
}
// ------------------------------------------------------------ quêtes
if (QUESTS.length !== 12) err(`12 quêtes attendues, ${QUESTS.length} trouvées`);
for (let i = 1; i <= 12; i++) if (!QUESTS.some((q) => q.id === `q${String(i).padStart(2, '0')}`)) err(`quête manquante : q${i}`);
for (const q of QUESTS) {
  q.stages.forEach((st, i) => {
    const c = `${q.id}.stage${i}`;
    if (!LOCATION_IDS.includes(st.loc)) err(`${c}: lieu inconnu « ${st.loc} »`);
    need_of(st.loc).feature.add(st.entry.at);
    for (const a of st.actors ?? []) { if (!CHARS[a.id]) err(`${c}: personnage inconnu « ${a.id} »`); if (typeof a.at === 'string') need_of(st.loc).anchor.add(a.at); }
    for (const h of st.hotspots ?? []) if (h.at) need_of(st.loc).feature.add(h.at);
    walkSteps(st.steps, st.loc, c, hotspotIds(locs.get(st.loc), st.hotspots), () => undefined, speakers);
  });
  q.rewards.forEach((e) => effectIds('', e, `${q.id}:rewards`));
}
for (const sp of speakers) if (sp !== 'narr' && !CHARS[sp]) err(`locuteur inconnu « ${sp} »`);

// ------------------------------------------------------------ lieux
if (locs.size === LOCATION_IDS.length) {
  for (const id of LOCATION_IDS) if (!locs.has(id)) err(`lieu manquant : ${id}`);
}
for (const l of LOCATIONS) {
  if (!LOCATION_IDS.includes(l.id)) err(`lieu hors répertoire : ${l.id}`);
  if (l.walk.length === 0) err(`${l.id}: aucune zone de marche`);
  for (const [n, p] of Object.entries(l.spawns)) if (!inWalk(l, p.x, p.y)) err(`${l.id}: apparition « ${n} » hors zone de marche (${p.x},${p.y})`);
  for (const [n, p] of Object.entries(l.anchors)) if (!inWalk(l, p.x, p.y)) err(`${l.id}: ancre « ${n} » hors zone de marche (${p.x},${p.y})`);
  for (const e of l.exits) {
    const t = locs.get(e.to);
    if (!t) { warns.push(`${l.id}: sortie vers « ${e.to} » (lieu non encore défini)`); continue; }
    if (!t.spawns[e.spawn]) err(`${l.id}: sortie vers ${e.to}: apparition « ${e.spawn} » absente`);
    if (!t.exits.some((x) => x.to === l.id)) err(`${l.id}: sortie vers ${e.to} sans retour symétrique`);
  }
  const n = need.get(l.id);
  if (n) {
    for (const a of n.anchor) if (!l.anchors[a] && !l.features[a]) err(`${l.id}: ancre requise « ${a} » absente`);
    for (const a of n.feature) if (!l.features[a]) err(`${l.id}: zone requise « ${a} » absente`);
    for (const a of n.any) if (!l.features[a] && !l.anchors[a]) err(`${l.id}: ancre ou zone requise « ${a} » absente`);
    for (const a of n.spawns) if (!l.spawns[a]) err(`${l.id}: apparition requise « ${a} » absente`);
  }
  for (const h of l.hotspots ?? []) if (h.at && !l.features[h.at]) err(`${l.id}: point d'intérêt ${h.id} : zone « ${h.at} » absente`);
}
// ------------------------------------------------------------ accessibilité réelle (grille 6 px depuis l'apparition par défaut)
function reachable(l: LocationDef): { has: (x: number, y: number) => boolean; near: (r: { x: number; y: number; w: number; h: number }, d: number) => boolean; inside: (r: { x: number; y: number; w: number; h: number }) => boolean } {
  const C = 6, W = Math.ceil(960 / C), H = Math.ceil(540 / C);
  const ok = (x: number, y: number) => inWalk(l, x, y);
  const seen = new Uint8Array(W * H);
  const start = l.spawns.default ?? l.spawns[Object.keys(l.spawns)[0]];
  const q: number[] = [Math.round(start.x / C) + Math.round(start.y / C) * W];
  seen[q[0]] = 1;
  while (q.length) {
    const i = q.pop()!;
    const cx = i % W, cy = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = nx + ny * W;
      if (seen[j] || !ok(nx * C, ny * C)) continue;
      seen[j] = 1; q.push(j);
    }
  }
  const has = (x: number, y: number) => { const cx = Math.round(x / C), cy = Math.round(y / C); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && seen[nx + ny * W]) return true; } return false; };
  const inside = (r: { x: number; y: number; w: number; h: number }) => { for (let y = r.y; y <= r.y + r.h; y += C) for (let x = r.x; x <= r.x + r.w; x += C) { const nx = Math.round(x / C), ny = Math.round(y / C); if (nx >= 0 && ny >= 0 && nx < W && ny < H && seen[nx + ny * W]) return true; } return false; };
  const near = (r: { x: number; y: number; w: number; h: number }, d: number) => inside({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });
  return { has, near, inside };
}
for (const l of LOCATIONS) {
  const R = reachable(l);
  for (const [n, p] of Object.entries(l.spawns)) if (!R.has(p.x, p.y)) err(`${l.id}: apparition « ${n} » inaccessible depuis l'apparition par défaut`);
  for (const [n, p] of Object.entries(l.anchors)) if (!R.has(p.x, p.y)) err(`${l.id}: ancre « ${n} » inaccessible`);
  for (const e of l.exits) if (!R.inside(e.rect)) err(`${l.id}: sortie ${e.id} inaccessible`);
  const rn = reachNeeds.get(l.id);
  for (const [n, r] of Object.entries(l.features)) {
    if (rn?.has(n)) { if (!R.inside(r) && !(l.anchors[n])) err(`${l.id}: zone d'objectif « ${n} » : aucune case accessible à l'intérieur`); }
    else if (!R.near(r, 66)) err(`${l.id}: zone « ${n} » hors de portée d'interaction (aucune case accessible à moins de 66 px)`);
  }
  if (l.rest && !R.near(l.rest, 60)) err(`${l.id}: puits inaccessible`);
  // une zone d'objectif ou d'interaction ne doit pas chevaucher une sortie : se tenir dedans déclencherait un changement de lieu
  for (const [n, r] of Object.entries(l.features)) {
    if (n.startsWith('exit_')) continue;
    for (const e of l.exits) {
      const ex = e.rect;
      const ov = r.x < ex.x + ex.w && r.x + r.w > ex.x && r.y < ex.y + ex.h && r.y + r.h > ex.y;
      if (!ov) continue;
      // chevauchement toléré si aucune case accessible de la zone n'est dans la sortie
      let hit = false;
      for (let y = Math.max(r.y, ex.y); y <= Math.min(r.y + r.h, ex.y + ex.h) && !hit; y += 6) for (let x = Math.max(r.x, ex.x); x <= Math.min(r.x + r.w, ex.x + ex.w) && !hit; x += 6) if (R.has(x, y) && inWalk(l, x, y)) hit = true;
      if (hit) err(`${l.id}: la zone « ${n} » chevauche la sortie ${e.id} (accessible) : se tenir dedans déclencherait la sortie`);
    }
  }
}

function inWalk(l: LocationDef, x: number, y: number): boolean {
  const inR = (r: { x: number; y: number; w: number; h: number }) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  return l.walk.some(inR) && !(l.blocks ?? []).some(inR);
}

const mode = process.argv[2];
if (mode === '--needs') {
  const out: Record<string, { anchors: string[]; features: string[]; spawns: string[] }> = {};
  for (const id of LOCATION_IDS) {
    const n = need.get(id); if (!n) continue;
    out[id] = { anchors: [...n.anchor].sort(), features: [...new Set([...n.feature, ...n.any])].sort(), spawns: [...n.spawns].sort() };
  }
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}
if (mode === '--coverage') {
  const verified: string[] = existsSync('production/verified.json') ? (JSON.parse(readFileSync('production/verified.json', 'utf8')).scenes ?? []) : [];
  const verifiedQ: string[] = existsSync('production/verified.json') ? (JSON.parse(readFileSync('production/verified.json', 'utf8')).quests ?? []) : [];
  const rows = ['type,id,titre,lieu,etapes,lignes_texte,fond_image,implementation,verification'];
  const lines = (steps: Step[]): number => steps.reduce((n, s) => n + (s.t === 'say' ? s.lines.length : s.t === 'talk' ? s.lines.length : 0) + (s.t === 'if' ? lines(s.then) + lines(s.otherwise ?? []) : 0), 0);
  const bgOk = (id: string) => { const l = locs.get(id); return l && existsSync('public/' + l.bg) && !/forest-style9/.test(l.bg) ? 'oui' : l && /forest-style9/.test(l.bg) ? 'provisoire' : 'non'; };
  for (const s of SCENES) rows.push(['scene', s.id, `"${s.title}"`, s.loc, s.steps.length, lines(s.steps), bgOk(s.loc), 'données+moteur', verified.includes(s.id) ? 'vérifié (e2e)' : 'à vérifier'].join(','));
  for (const q of QUESTS) rows.push(['quete', q.id, `"${q.title}"`, q.stages.map((x) => x.loc).join('|'), q.stages.reduce((n, x) => n + x.steps.length, 0), q.stages.reduce((n, x) => n + lines(x.steps), 0), q.stages.map((x) => bgOk(x.loc)).join('|'), 'données+moteur', verifiedQ.includes(q.id) ? 'vérifié (e2e)' : 'à vérifier'].join(','));
  writeFileSync('production/COVERAGE.csv', rows.join('\n') + '\n');
  console.log(`COVERAGE.csv : ${rows.length - 1} lignes`);
  process.exit(0);
}
console.log(`Scènes : ${SCENES.length}/61 — quêtes : ${QUESTS.length}/12 — lieux définis : ${LOCATIONS.length}/${LOCATION_IDS.length}`);
for (const w of warns) console.log('avertissement :', w);
if (errors.length) { console.log(`${errors.length} erreur(s) :`); for (const e of errors) console.log(' -', e); process.exit(1); }
console.log('Données valides.');
