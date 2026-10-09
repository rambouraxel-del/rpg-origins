// Configuration : fichiers config.json / pricing.json. Les variables d'environnement ne peuvent que RESSERRER les plafonds.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export interface Config {
  monthlyBudgetUsd: number;
  safetyMargin: number;
  maxImagesPerCall: number;
  maxImagesPerSession: number;
  similarityThreshold: number;
  maxComparableFailures: number;
  inventoryMaxAgeMinutes: number;
  recoveredLedger: { monthlyBudgetUsd: number; maxImagesPerSession: number };
}

export interface ModelPricing {
  textInputPer1M: number;
  imageInputPer1M: number;
  imageOutputPer1M: number;
  outputTokensPerMegapixel: Record<string, number>;
  imageInputTokensEstimate: number;
}

export interface Pricing {
  rates: { verified: boolean; tier?: string; source?: string; checkedOn: string | null; verifiedBy?: string; unverifiedRatesFactor: number };
  tokenEstimates: { safetyFactor: number; note?: string };
  models: Record<string, ModelPricing>;
}

export interface Paths {
  ledger: string;
  detailLog: string;
  outputDir: string;
  apiBase: string;
  assetsRoot: string;
  proofDir: string;
  styleRefDir: string;
}

export const DEFAULT_MODEL = 'gpt-image-2.5-flare';
export const DEFAULT_QUALITY = 'low';
export const DEFAULT_SIZE = '1536x864';
export const UNKNOWN_SESSION = 'unknown-session';

const readJson = (name: string) => JSON.parse(readFileSync(join(HERE, name), 'utf8'));

/** Une variable d'environnement ne peut jamais relever une valeur : elle ne fait que la réduire (valeur invalide ou supérieure = ignorée). */
export function capped(base: number, env: string | undefined): number {
  if (env === undefined || env.trim() === '') return base;
  const v = Number(env);
  return Number.isFinite(v) && v >= 0 ? Math.min(base, v) : base;
}

/** Relu à chaque appel (les tests changent l'environnement). */
export function loadConfig(): Config {
  const cfg: Config = readJson('config.json');
  cfg.monthlyBudgetUsd = capped(cfg.monthlyBudgetUsd, process.env.IMAGE_MONTHLY_BUDGET_USD);
  cfg.maxImagesPerSession = capped(cfg.maxImagesPerSession, process.env.IMAGE_SESSION_LIMIT);
  return cfg;
}

export function loadPricing(): Pricing {
  return readJson('pricing.json');
}

export function paths(): Paths {
  return {
    ledger: process.env.IMAGE_LEDGER_FILE ?? join(HERE, 'ledger', 'ledger.jsonl'),
    detailLog: process.env.IMAGE_DETAIL_LOG ?? 'logs/image-generations.jsonl',
    outputDir: process.env.IMAGE_OUTPUT_DIR ?? 'public/assets/generated',
    apiBase: process.env.IMAGE_API_BASE ?? 'https://api.openai.com/v1/images',
    assetsRoot: process.env.IMAGE_ASSETS_ROOT ?? 'public/assets',
    proofDir: process.env.IMAGE_PROOF_DIR ?? 'logs/proofs',
    styleRefDir: process.env.IMAGE_STYLE_REF_DIR ?? 'assets-src/style-reference',
  };
}

export interface SessionInfo {
  id: string;
  reliable: boolean;
  source: string;
}

/**
 * Identifiant de session Claude Code Cloud. Fiable seulement s'il vient de IMAGE_SESSION_ID (explicite) ou de
 * CLAUDE_CODE_REMOTE_SESSION_ID (forme cse_..., identique à l'identifiant de la session dans l'URL claude.ai/code).
 * CLAUDE_CODE_SESSION_ID (uuid de conversation locale) n'est volontairement PAS utilisé : il peut changer à la reprise.
 * Sans identifiant fiable : toutes les générations partagent un seul compteur "unknown-session" (limites conservatrices).
 */
export function sessionInfo(): SessionInfo {
  const explicit = process.env.IMAGE_SESSION_ID?.trim();
  if (explicit) return { id: explicit, reliable: true, source: 'IMAGE_SESSION_ID' };
  const remote = process.env.CLAUDE_CODE_REMOTE_SESSION_ID?.trim();
  if (remote && /^cse_[A-Za-z0-9]{10,}$/.test(remote)) return { id: remote, reliable: true, source: 'CLAUDE_CODE_REMOTE_SESSION_ID' };
  return { id: UNKNOWN_SESSION, reliable: false, source: 'aucun identifiant fiable' };
}

export const sessionId = () => sessionInfo().id;
