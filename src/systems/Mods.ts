// Modificateurs du héros issus de l'équipement et des améliorations (règles §7 et §9) : gains modestes, plafonnés.
import { hub } from '../game';
import { EQUIPMENT } from '../data/items';

export interface HeroMods { strike: number; def: number; speed: number; cost: number; dodge: number; sprint: number; reach: number; heal: number; pulse: number; weave: number; veil: number; bond: number; support: number }

export function heroMods(): HeroMods {
  const s = hub.state;
  const m: HeroMods = { strike: 0, def: 0, speed: 0, cost: 0, dodge: 0, sprint: 0, reach: 0, heal: 0, pulse: 0, weave: 0, veil: 0, bond: 0, support: 0 };
  for (const id of Object.values(s.equipment.slots)) {
    const e = id ? EQUIPMENT[id] : undefined;
    if (!e) continue;
    m.strike += e.strike ?? 0; m.def += e.def ?? 0; m.speed += e.speed ?? 0; m.cost += e.cost ?? 0; m.dodge += e.dodge ?? 0;
  }
  const u = s.hero.spent;
  if (u.dmg) m.def += 0.1; if (u.heal) m.heal += 0.15; if (u.dodge) m.dodge += 0.1; if (u.bond) m.bond += 0.2;
  if (u.cost) m.cost += 0.1; if (u.pulse) m.pulse += 0.15; if (u.weave) m.weave += 0.15; if (u.veil) m.veil += 0.15;
  if (u.sprint) m.sprint += 0.1; if (u.reach) m.reach += 0.15; if (u.support) m.support += 0.25;
  m.def = Math.min(0.4, m.def); m.cost = Math.min(0.3, m.cost); m.dodge = Math.min(0.35, m.dodge); m.speed = Math.min(0.15, m.speed);
  return m;
}
