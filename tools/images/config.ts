// Configuration : fichiers config.json / pricing.json, surchargeables par variables d'environnement.
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
  verified: boolean;
  checkedOn: string | null;
  unverifiedSafetyFactor: number;
  models: Record<string, ModelPricing>;
}

export interface Paths {
  ledger: string;
  detailLog: string;
  outputDir: string;
  apiBase: string;
}

export const DEFAULT_MODEL = 'gpt-image-2.5-flare';
export const DEFAULT_QUALITY = 'low';
export const DEFAULT_SIZE = '1536x864';

const readJson = (name: string) => JSON.parse(readFileSync(join(HERE, name), 'utf8'));

/** Relu à chaque appel (les tests changent l'environnement). Les plafonds de sécurité ne peuvent qu'être resserrés par l'env. */
export function loadConfig(): Config {
  const cfg: Config = readJson('config.json');
  const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
  cfg.monthlyBudgetUsd = num(process.env.IMAGE_MONTHLY_BUDGET_USD) ?? cfg.monthlyBudgetUsd;
  cfg.maxImagesPerSession = num(process.env.IMAGE_SESSION_LIMIT) ?? cfg.maxImagesPerSession;
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
  };
}

/** Identifiant de session : permet de distinguer les compteurs entre sessions Claude Code. */
export function sessionId(): string {
  return (
    process.env.IMAGE_SESSION_ID ||
    process.env.CLAUDE_CODE_REMOTE_SESSION_ID ||
    process.env.CLAUDE_CODE_SESSION_ID ||
    'unknown-session'
  );
}
