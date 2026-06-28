import { useMemo } from 'react';
import type { MinigameConfig, MinigameResult } from '../../types/minigame';
import { defaultMinigameConfig } from '../../types/minigame';
import { applyHazards } from '../../engine/hazardEngine';
import { applyStress } from '../../engine/stressEngine';
import { applyShards } from '../../engine/shardEngine';
import { useGameStore, getEquippedWeapon } from '../../store/useGameStore';
import type { HazardType, SoulShard } from '../../types/game';
import { RhythmBar } from './RhythmBar';
import { TensionMeter } from './TensionMeter';
import { LockpickGame } from './LockpickGame';

interface Props {
  type: MinigameConfig['type'];
  difficulty?: number;
  hazardOverrides?: HazardType[];
  shardOverrides?: (SoulShard | null)[];
  label?: string;
  onComplete: (result: MinigameResult) => void;
}

export function MinigameHost({ type, difficulty = 0.3, hazardOverrides, shardOverrides, label, onComplete }: Props) {
  const run = useGameStore(s => s.run);
  const weapon = getEquippedWeapon(run);

  const config = useMemo(() => {
    let cfg = defaultMinigameConfig({ type, difficulty, label });
    const hazards = hazardOverrides ?? (run.currentStratum >= 0 ? [] : []);
    cfg = applyHazards(cfg, hazards);
    cfg = applyStress(cfg, run.stress);
    const shards = shardOverrides ?? weapon?.equippedShards ?? [];
    cfg = applyShards(cfg, shards);
    return cfg;
  }, [type, difficulty, hazardOverrides, shardOverrides, run.stress, weapon, label]);

  switch (config.type) {
    case 'rhythm':
      return <RhythmBar config={config} onComplete={onComplete} />;
    case 'tension':
      return <TensionMeter config={config} onComplete={onComplete} label={label} />;
    case 'lockpick':
      return <LockpickGame config={config} onComplete={onComplete} />;
    default:
      return <RhythmBar config={config} onComplete={onComplete} />;
  }
}
