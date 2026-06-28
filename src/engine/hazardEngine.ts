import type { MinigameConfig } from '../types/minigame';
import type { HazardType } from '../types/game';

export function applyHazards(config: MinigameConfig, hazards: HazardType[]): MinigameConfig {
  let result = { ...config };
  for (const h of hazards) {
    switch (h) {
      case 'tremor':
        result.tremor += 5;
        break;
      case 'noise':
        result.noiseLevel = Math.min(1, result.noiseLevel + 0.4);
        break;
      case 'darkness':
        result.opacityDrop = Math.min(0.6, result.opacityDrop + 0.35);
        break;
      case 'fear':
        result.speedMultiplier *= 1.4;
        result.ghostBar = true;
        break;
      case 'time_pressure':
        if (!result.timeLimit) result.timeLimit = 8000;
        else result.timeLimit = Math.min(result.timeLimit, 8000);
        break;
      case 'wet':
        result.tremor += 3;
        break;
    }
  }
  return result;
}
