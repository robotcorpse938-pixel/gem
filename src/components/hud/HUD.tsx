import { useGameStore } from '../../store/useGameStore';

function Bar({ value, max, color, label, sublabel }: {
  value: number; max: number; color: string; label: string; sublabel?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-xs font-display tracking-widest uppercase" style={{ color, fontSize: '10px' }}>{label}</span>
        <span className="text-xs" style={{ color, fontFamily: 'Share Tech Mono, monospace', fontSize: '11px' }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded overflow-hidden" style={{ background: '#111122' }}>
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${pct * 100}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      {sublabel && (
        <p className="text-xs mt-0.5" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>{sublabel}</p>
      )}
    </div>
  );
}

export function HUD() {
  const run = useGameStore(s => s.run);
  const saving = useGameStore(s => s.saving);

  const stressLabel =
    run.stress >= 75 ? 'BREAKING' :
    run.stress >= 50 ? 'STRAINED' :
    run.stress >= 25 ? 'UNEASY' : 'STEADY';

  const stratumName = run.currentStratum >= 0 && run.currentStratum < 3
    ? ['I — THE THRESHOLD', 'II — DROWNED HALLS', 'III — THE OSSUARY'][run.currentStratum]
    : 'THE ABYSS';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-2"
      style={{ background: 'linear-gradient(to top, #040406ee, transparent)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Location + save indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display tracking-widest uppercase" style={{ color: '#3a3a5c', fontSize: '10px' }}>
            STRATUM {stratumName}
          </span>
          {saving && <span className="text-xs" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>SAVING...</span>}
          <span className="text-xs" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>
            DEBT: {run.soulDebt}
          </span>
        </div>

        {/* Bars */}
        <div className="flex gap-3">
          <Bar value={run.hp} max={run.maxHp} color="#c0392b" label="HP" />
          <Bar value={run.stamina} max={run.maxStamina} color="#4ec49a" label="STAMINA" />
          <Bar
            value={run.stress} max={100}
            color={run.stress >= 75 ? '#8b5cf6' : run.stress >= 50 ? '#e05a20' : run.stress >= 25 ? '#c49a28' : '#6b6b8a'}
            label="STRESS"
            sublabel={stressLabel}
          />
        </div>
      </div>
    </div>
  );
}
