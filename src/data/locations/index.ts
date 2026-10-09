import type { LocationDef } from '../../core/types';
import { PALACE } from './palace';
import { FOREST } from './forest';
import { LISIERE } from './lisiere';
import { RIVER } from './river';
import { MIRAL } from './miral';
import { STELLAR } from './stellar';
import { VALLEY } from './valley';

/** Les 27 lieux de la bible (§21.1). Le contenu de chaque lieu est décrit en données ; les fonds sont des WebP 960x540. */
export const LOCATIONS: LocationDef[] = [...PALACE, ...FOREST, ...LISIERE, ...RIVER, ...MIRAL, ...STELLAR, ...VALLEY];
