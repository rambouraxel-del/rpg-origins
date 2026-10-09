// Épilogues déterministes (bible §23.3) : ordre fixe — situation politique, Lisière, Nara, Soren, Tessa, Ilyra, objets, dernier plan.
import type { GameState } from '../core/state';

const q = (s: GameState, id: string) => s.quests[id] === 'completed';

export function buildEpilogue(s: GameState, route: 'A' | 'B'): string[] {
  const f = s.flags;
  const L: string[] = [];
  if (route === 'A') {
    L.push('Un an plus tard. Eïra est libre, les puits répondent. Un conseil public examine les prélèvements ; Vaelor et Ravel sont jugés sur des documents conservés. Les réfugiés stellaires ont des abris au sol — avec des disputes, et la possibilité de les discuter.');
    L.push('Lisière a de nouvelles maisons modestes.' + (q(s, 'q01') ? ' Au dispensaire, les nouveaux venus apprennent les règles du puits.' : '') + (q(s, 'q05') ? ' Près du moulin, un atelier mixte forme apprentis veilleurs et mécaniciens.' : '') + (q(s, 'q09') ? ' Sur la table commune : un pain partagé qui porte ses deux noms.' : ''));
    L.push('Nara ouvre le sentier dont elle parlait.' + (q(s, 'q04') ? ' La balise de son père est remise en place ; elle poursuit son travail.' : '') + (q(s, 'q06') ? ' Ilan transmet son métier de messager aux nouvelles recrues.' : '') + (f.nara_relationship === 'romance' ? ' Elle revient seule au bassin, et dit tout bas ce qu\'elle n\'a pas pu dire.' : ' Elle revient au bassin, avec ses amis.'));
    L.push('Soren lit le témoignage d\'Elyan devant ceux qui choisissent de venir ; il y inclut sa peur et son ascendance.' + (q(s, 'q07') ? ' Les archives, désormais, se tiennent à plusieurs voix.' : '') + (q(s, 'q08') ? ' Un banc porte la marque d\'attente : « pour celui dont nous gardons la place ».' : '') + (q(s, 'q12') ? ' Un registre de restitution est ouvert à qui cherche.' : ''));
    L.push('Tessa a fait descendre sa mère de l\'Aube Basse.' + (q(s, 'q10') ? ' Leur première rencontre évoque la lettre arrivée un soir.' : ' Elles ont commencé par chercher leurs noms sur les listes d\'accueil.') + (q(s, 'q11') ? ' Le jeune technicien témoigne devant le contrôle public.' : ''));
    if (f.ilyra_support === 'accepted') L.push('Ilyra travaille sous contrôle partagé et témoigne sur son rôle ; sa responsabilité est reconnue, pas effacée.');
    L.push((q(s, 'q02') ? 'Dans le jardin de mémoire, le dessin de Lume : un homme avec une branche, pas une couronne. ' : '') + (q(s, 'q03') ? 'Les plants de Méline poussent côte à côte. ' : '') + (f.ribbon_state === 'entrusted' ? 'Le ruban de Mira est confié à Nara.' : 'Le ruban est resté parmi les affaires d\'Elyan.'));
    L.push('« Il y a encore tant de choses que tu aurais détesté manquer. » — Un oiseau clair passe sur l\'eau vivante.');
  } else {
    L.push('Le réseau est stabilisé. Les cités veilleurs ont perdu leurs conseils ; les archives qui ne servent pas aux machines sont détruites. Ysane ' + (f.b_mercy === 'spare' ? 'survit, captive.' : 'a été exécutée.') + ' Son gouvernement n\'existe plus.');
    L.push(f.b_mercy === 'spare' ? 'Nara, Soren et Tessa vivent, derrière une barrière. Nara refuse le ruban offert comme réconciliation.' : 'Nara et Tessa sont mortes en résistant. Soren est conservé pour traduire les archives, puis emprisonné.');
    L.push(f.b_archive_cache ? 'Le carnet de Soren, original, repose dans une cache. Une mémoire est protégée — pas une civilisation.' : 'Le carnet de Soren est resté sous contrôle royal.');
    L.push((q(s, 'q01') ? 'La technique de la pompe est reprise dans les jardins, sans mention de son auteur. ' : '') + (q(s, 'q05') ? 'L\'entente du moulin est citée comme preuve que toute la conquête était bénéfique. ' : '') + (q(s, 'q09') ? 'Le pain partagé est devenu un plat royal nommé d\'après la maison Aster. ' : '') + (q(s, 'q08') ? 'Les bancs d\'attente sont démontés. ' : ''));
    L.push(f.ilyra_support === 'accepted' ? 'Ilyra est réaffectée par Vaelor ; son aide initiale ne la rend pas libre.' : 'Ilyra poursuit ses travaux sous les ordres de Vaelor.');
    L.push(({ full: 'Elyan a tout dit à Mira ; elle a cessé de fredonner en apprenant l\'origine de la mélodie.', journey_only: 'Elyan n\'a parlé que du voyage ; Mira fredonne pendant qu\'il regarde la conduite.', silent: 'Elyan n\'a rien dit. Mira chante, et il regarde la conduite.' } as Record<string, string>)[String(f.b_truth_told ?? 'silent')]);
    L.push('Sous la pierre du bassin, un battement persiste, contraint, mais vivant. Un automate diffuse le chant d\'un oiseau.');
  }
  return L.filter((l) => l.trim());
}
