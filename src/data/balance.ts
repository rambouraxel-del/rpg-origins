// Valeurs d'équilibrage centralisées (règles de gameplay §5.5 et §7).
export const BALANCE = {
  hero: { hp: 100, energy: 100, strike: 18, strikeInterval: 0.55, dodgeCooldown: 2, dodgeDist: 90, dodgeTime: 0.18, regenCombat: 6, regenFree: 12, regenDelay: 2, healItem: 35, maxHealItems: 5 },
  powerCost: { low: 20, high: 30 },
  powerCooldown: { low: 6, high: 10 },
  enemy: {
    automate: { hp: 60, speed: 62, windup: 0.8, damage: 12, range: 40, reach: 52 },
    sentinelle: { hp: 50, speed: 40, windup: 1.0, damage: 14, range: 300, reach: 300 },
    pompage: { hp: 70, speed: 50, windup: 0.9, damage: 12, range: 44, reach: 54 },
    soldat: { hp: 80, speed: 70, windup: 0.75, damage: 16, range: 42, reach: 54 },
  },
  tiers: { chapters: [3, 5, 7, 9], hp: 10, energy: 5, points: 2 },
  histoireDamageFactor: 0.6,
  veil: { duration: 5, cost: 20 },
} as const;
