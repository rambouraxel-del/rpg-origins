import { ART_SET } from '../../artSet';
import type { AreaConfig, AreaId } from '../types';
import { clearing } from './clearing';
import { forest } from './forest';
import { forestStyle9 } from './forest-style9';
import { sanctuary } from './sanctuary';

export const AREAS: Record<AreaId, AreaConfig> = {
  forest: ART_SET === 'style9' ? forestStyle9 : forest,
  clearing,
  sanctuary,
};

export const START_AREA: AreaId = 'forest';
