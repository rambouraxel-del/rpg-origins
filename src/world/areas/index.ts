import type { AreaConfig, AreaId } from '../types';
import { clearing } from './clearing';
import { forest } from './forest';
import { sanctuary } from './sanctuary';

export const AREAS: Record<AreaId, AreaConfig> = { forest, clearing, sanctuary };

export const START_AREA: AreaId = 'forest';
