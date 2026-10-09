// Les 61 scènes principales et finales dans l'ordre canonique (bible §21.2).
import type { SceneDef } from '../../core/types';
import { PROLOGUE } from './ch0';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3 } from './ch3';
import { CH4 } from './ch4';
import { CH5 } from './ch5';
import { CH6 } from './ch6';
import { CH7 } from './ch7';
import { CH8 } from './ch8';
import { CH9 } from './ch9';
import { CH10 } from './ch10';
import { ENDINGS } from './endings';

export const SCENES: SceneDef[] = [...PROLOGUE, ...CH1, ...CH2, ...CH3, ...CH4, ...CH5, ...CH6, ...CH7, ...CH8, ...CH9, ...CH10, ...ENDINGS];
