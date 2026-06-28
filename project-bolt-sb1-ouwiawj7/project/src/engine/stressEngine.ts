import type { MinigameConfig } from '../types/minigame';

const STRESS_THRESHOLDS = [
  { threshold: 75, speedMult: 1.5, tremorAdd: 4, ghostBar: true,  opacityDrop: 0.2, windowShrink: 0.1 },
  { threshold: 50, speedMult: 1.3, tremorAdd: 2, ghostBar: false, opacityDrop: 0.1, windowShrink: 0.05 },
  { threshold: 25, speedMult: 1.1, tremorAdd: 1, ghostBar: false, opacityDrop: 0,   windowShrink: 0 },
] as const;

export function applyStress(config: MinigameConfig, stress: number): MinigameConfig {
  let result = { ...config };
  for (const tier of STRESS_THRESHOLDS) {
    if (stress >= tier.threshold) {
      result.speedMultiplier *= tier.speedMult;
      result.tremor += tier.tremorAdd;
      result.ghostBar = result.ghostBar || tier.ghostBar;
      result.opacityDrop = Math.min(0.7, result.opacityDrop + tier.opacityDrop);
      result.windowShrink = Math.min(0.6, result.windowShrink + tier.windowShrink);
      break;
    }
  }
  return result;
}

export function stressChangeFromMinigame(success: boolean, quality: string): number {
  if (!success) return 15;
  if (quality === 'perfect') return -8;
  return -3;
}
