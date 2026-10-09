// Enregistre tout le contenu (lieux, scènes, quêtes) dans le registre central.
import { hub } from '../game';
import { LOCATIONS } from './locations';
import { SCENES } from './scenes';
import { QUESTS } from './quests';

export function registerContent(): void {
  for (const l of LOCATIONS) hub.locations.set(l.id, l);
  for (const s of SCENES) hub.scenes.set(s.id, s);
  for (const q of QUESTS) hub.quests.set(q.id, q as never);
}
