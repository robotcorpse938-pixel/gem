import type { MinigameConfig } from '../types/minigame';
import type { SoulShard } from '../types/game';

export function applyShards(config: MinigameConfig, shards: (SoulShard | null)[]): MinigameConfig {
  let result = { ...config };
  for (const shard of shards) {
    if (!shard) continue;
    switch (shard.type) {
      case 'velocity':
        result.barSpeedBonus += 0.35;
        break;
      case 'precision':
        result.windowShrink += 0.4;
        result.perfectZoneBonus = true;
        break;
      case 'leech':
        result.leechActive = true;
        break;
      case 'tremor':
        result.tremorWindow = true;
        break;
      case 'hollow':
        result.barSpeedBonus += 0.2;
        result.windowShrink += 0.2;
        result.perfectZoneBonus = true;
        break;
    }
  }
  return result;
}
