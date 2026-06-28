
export type MinigameType = 'rhythm' | 'tension' | 'lockpick' | 'surgery';
export type MinigameQuality = 'perfect' | 'good' | 'fail';

export interface MinigameConfig {
  type: MinigameType;
  difficulty: number;       // 0-1
  timeLimit?: number;       // ms, optional hard cap
  label?: string;           // flavor text shown above minigame
  // Hazard params (applied by host)
  tremor: number;           // shake amplitude in px
  noiseLevel: number;       // 0-1, adds ghost indicators
  opacityDrop: number;      // 0-1, partial UI fade
  speedMultiplier: number;  // bar/oscillation speed factor
  ghostBar: boolean;        // second offset bar (fear cascade)
  // Shard params (applied by shard engine)
  barSpeedBonus: number;    // velocity shard
  windowShrink: number;     // precision shard, 0-1
  perfectZoneBonus: boolean;// precision shard
  leechActive: boolean;     // leech shard
  tremorWindow: boolean;    // tremor shard — window oscillates
}

export interface MinigameResult {
  success: boolean;
  quality: MinigameQuality;
  stressChange: number;
  staminaCost: number;
}

export function defaultMinigameConfig(overrides: Partial<MinigameConfig> = {}): MinigameConfig {
  return {
    type: 'rhythm',
    difficulty: 0.3,
    tremor: 0,
    noiseLevel: 0,
    opacityDrop: 0,
    speedMultiplier: 1,
    ghostBar: false,
    barSpeedBonus: 0,
    windowShrink: 0,
    perfectZoneBonus: false,
    leechActive: false,
    tremorWindow: false,
    ...overrides,
  };
}
