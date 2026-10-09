// Estimation avant appel, calcul après appel (à partir des tokens renvoyés). Ce sont des CALCULS, jamais la facture.
// Deux incertitudes SÉPARÉES : le prix par token (pricing.rates) et le nombre de tokens d'une génération (pricing.tokenEstimates).
import type { ModelPricing, Pricing } from './config.ts';

export interface CostInput {
  model: string;
  quality: string;
  size: string;
  n: number;
  promptChars: number;
  inputImages: number;
}

export function modelPricing(pricing: Pricing, model: string): ModelPricing {
  const p = pricing.models[model];
  if (!p) throw new Error(`Modèle sans tarif connu : "${model}". Ajoutez-le dans tools/images/pricing.json avant de l'utiliser.`);
  return p;
}

export function parseSize(size: string): { w: number; h: number } {
  const m = /^(\d+)x(\d+)$/.exec(size);
  if (!m) throw new Error(`Taille invalide : "${size}" (attendu : 1536x864).`);
  return { w: Number(m[1]), h: Number(m[2]) };
}

export interface TokenEstimate {
  output: number;
  textInput: number;
  imageInput: number;
}

/** Tokens attendus, toujours majorés par tokenEstimates.safetyFactor et relevés au maximum déjà observé (tokens/Mpx par qualité). */
export function estimateTokens(pricing: Pricing, c: CostInput, observedPerMp: Record<string, number> = {}): TokenEstimate {
  const p = modelPricing(pricing, c.model);
  const table = p.outputTokensPerMegapixel[c.quality];
  if (table === undefined) throw new Error(`Qualité inconnue : "${c.quality}" (attendu : ${Object.keys(p.outputTokensPerMegapixel).join(', ')}).`);
  const { w, h } = parseSize(c.size);
  const perMp = Math.max(table, observedPerMp[c.quality] ?? 0);
  const f = pricing.tokenEstimates.safetyFactor;
  return {
    output: c.n * ((w * h) / 1e6) * perMp * f,
    textInput: (Math.ceil(c.promptChars / 3) + 50) * f,
    imageInput: c.inputImages * p.imageInputTokensEstimate * f,
  };
}

/** Coût estimé avant l'appel. Si les prix ne sont pas vérifiés, multiplicateur supplémentaire. */
export function estimateUsd(pricing: Pricing, c: CostInput, observedPerMp: Record<string, number> = {}): number {
  const p = modelPricing(pricing, c.model);
  const t = estimateTokens(pricing, c, observedPerMp);
  const usd = (t.textInput * p.textInputPer1M + t.imageInput * p.imageInputPer1M + t.output * p.imageOutputPer1M) / 1e6;
  return usd * (pricing.rates.verified ? 1 : pricing.rates.unverifiedRatesFactor);
}

/** Coût calculé après appel depuis `usage` ; null si l'API n'a pas renvoyé d'usage exploitable. */
export function computeUsd(pricing: Pricing, model: string, usage: any): number | null {
  if (!usage || typeof usage.output_tokens !== 'number') return null;
  const p = modelPricing(pricing, model);
  const d = usage.input_tokens_details ?? {};
  const imageIn = d.image_tokens ?? 0;
  const textIn = d.text_tokens ?? Math.max(0, (usage.input_tokens ?? 0) - imageIn);
  return (textIn * p.textInputPer1M + imageIn * p.imageInputPer1M + usage.output_tokens * p.imageOutputPer1M) / 1e6;
}
