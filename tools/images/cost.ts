// Estimation avant appel, calcul après appel (à partir des tokens renvoyés par l'API).
// Ce sont des CALCULS, jamais une garantie du montant facturé.
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

/** Estimation prudente (jetons de sortie par mégapixel, multiplicateur si tarifs non vérifiés). */
export function estimateUsd(pricing: Pricing, c: CostInput): number {
  const p = modelPricing(pricing, c.model);
  const perMp = p.outputTokensPerMegapixel[c.quality];
  if (perMp === undefined) throw new Error(`Qualité inconnue : "${c.quality}" (attendu : ${Object.keys(p.outputTokensPerMegapixel).join(', ')}).`);
  const { w, h } = parseSize(c.size);
  const outputTokens = c.n * ((w * h) / 1e6) * perMp;
  const textTokens = Math.ceil(c.promptChars / 3) + 50;
  const imageTokens = c.inputImages * p.imageInputTokensEstimate;
  const usd = (textTokens * p.textInputPer1M + imageTokens * p.imageInputPer1M + outputTokens * p.imageOutputPer1M) / 1e6;
  return usd * (pricing.verified ? 1 : pricing.unverifiedSafetyFactor);
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
