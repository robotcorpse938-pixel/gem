import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { recordRunHistory } from '../lib/persistence';

export function EndingScreen() {
  const run = useGameStore(s => s.run);
  const startNewRun = useGameStore(s => s.startNewRun);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (!recorded && run.outcome) {
      setRecorded(true);
      recordRunHistory({
        sessionId: run.sessionId,
        outcome: run.outcome,
        stratumReached: run.currentStratum + 1,
        soulDebt: run.soulDebt,
        stressAtEnd: run.stress,
        durationSeconds: Math.floor((Date.now() - run.runStartMs) / 1000),
        worldFlags: run.worldFlags,
      });
    }
  }, [run.outcome, recorded]);

  const isDeath = run.outcome === 'death';
  const isVictory = run.outcome === 'victory';

  const accentColor = isVictory ? '#8888aa' : isDeath ? '#c0392b' : '#c49a28';

  const title = isVictory
    ? 'THE WARDEN IS STILL'
    : isDeath
    ? 'YOU HAVE FALLEN'
    : 'BOUND TO THE HOLLOW';

  const endings: Record<string, { heading: string; body: string[] }> = {
    victory_aelith: {
      heading: 'The Measured Release',
      body: [
        'Sister Aelith\'s translation holds. The sigils in Stratum 12 activate in sequence, one soul at a time — a slow exhale across centuries of captivity.',
        'The Hollow recedes. Not gone. But quieter. The city of Ashfeld breathes more easily for the first time in living memory.',
        'Aelith will spend the rest of her life finishing the work. She does not mind.',
      ],
    },
    victory_standard: {
      heading: 'The Severing',
      body: [
        'The Warden is still. The binding is broken.',
        'The Hollow continues. Slower, perhaps, now that the knot anchoring it here is gone. Or perhaps the same. You have bought something. You are not sure how much.',
        'Ashfeld does not notice. It rarely does.',
      ],
    },
    death: {
      heading: 'The Abyss Takes Its Due',
      body: [
        'The world continues. Ashfeld breathes. The Seep bleeds its brackish light.',
        'Someone will come after you. They always do. They will find your notes, your marks on the walls, your failed attempts scratched into stone.',
        'They will know someone was here. They will not know your name.',
      ],
    },
    damnation: {
      heading: 'Bound',
      body: [
        'The soul debt accumulated faster than you could pay it. The Hollow took what was owed.',
        'You are still there. In the walls of the Abyss, in the residual resonance, in the low hum that future explorers will notice and not be able to explain.',
        'You are part of it now. Like everyone else who paid the price before you.',
      ],
    },
  };

  const endingKey = isVictory
    ? (run.worldFlags.aelithTranslationAvailable && run.worldFlags.sisterAelith === 'allied' ? 'victory_aelith' : 'victory_standard')
    : isDeath ? 'death' : 'damnation';

  const ending = endings[endingKey];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12" style={{ background: '#040406' }}>
      <div className="w-full max-w-xl space-y-8">
        {/* Outcome badge */}
        <div className="text-center">
          <span
            className="inline-block font-display text-xs tracking-[0.4em] uppercase px-4 py-1.5 rounded border mb-4"
            style={{
              color: accentColor,
              borderColor: accentColor + '40',
              background: accentColor + '08',
            }}
          >
            {isVictory ? 'VICTORY' : isDeath ? 'DEATH' : 'DAMNATION'}
          </span>
          <h1 className="font-display font-black" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#f0f0ff' }}>
            {title}
          </h1>
        </div>

        {/* Ending text */}
        <div className="space-y-4">
          <p className="font-display text-sm tracking-widest uppercase" style={{ color: accentColor }}>
            {ending.heading}
          </p>
          {ending.body.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Run stats */}
        <div className="rounded border p-5 space-y-2" style={{ borderColor: '#1c1c35', background: '#08080f' }}>
          <p className="font-display text-xs tracking-widest uppercase mb-3" style={{ color: '#4a4a6a' }}>RUN RECORD</p>
          <Stat label="Stratum Reached" value={`${run.currentStratum + 1} / 3`} />
          <Stat label="Soul Debt Accumulated" value={String(run.soulDebt)} color={run.soulDebt > 30 ? '#8888aa' : undefined} />
          <Stat label="Final Stress" value={`${run.stress}%`} color={run.stress > 70 ? '#c0392b' : undefined} />
          <Stat
            label="Allies"
            value={[
              run.worldFlags.marekVoss === 'allied' && 'Voss',
              run.worldFlags.sisterAelith === 'allied' && 'Aelith',
              run.worldFlags.gorveth === 'allied' && 'Gorveth',
            ].filter(Boolean).join(', ') || 'None'}
          />
          <Stat label="Warden Phases Cleared" value={`${run.wardenPhaseCleared.filter(Boolean).length} / 4`} />
          <Stat label="Duration" value={`${Math.floor((Date.now() - run.runStartMs) / 60000)}m ${Math.floor(((Date.now() - run.runStartMs) % 60000) / 1000)}s`} />
        </div>

        {/* World state consequences */}
        <div className="space-y-1">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#4a4a6a' }}>WORLD STATE</p>
          <WorldFlag label="Marek Voss" value={run.worldFlags.marekVoss} />
          <WorldFlag label="Sister Aelith" value={run.worldFlags.sisterAelith} />
          <WorldFlag label="Gorveth" value={run.worldFlags.gorveth} />
          <WorldFlag label="Compact" value={run.worldFlags.compactHostile ? 'hostile' : 'neutral'} />
          <WorldFlag label="Warden" value={run.worldFlags.wardenDefeated ? 'defeated' : 'active'} />
        </div>

        {/* New run */}
        <button
          onClick={startNewRun}
          className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
          style={{ borderColor: accentColor + '40', background: accentColor + '08', color: accentColor }}
        >
          BEGIN ANOTHER RUN
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs" style={{ color: '#4a4a6a', fontFamily: 'Share Tech Mono, monospace' }}>{label}</span>
      <span className="text-xs" style={{ color: color ?? '#a0a0c0', fontFamily: 'Share Tech Mono, monospace' }}>{value}</span>
    </div>
  );
}

function WorldFlag({ label, value }: { label: string; value: string }) {
  const color = value === 'allied' || value === 'defeated' ? '#4ec49a'
    : value === 'hostile' || value === 'dead' ? '#c0392b'
    : '#4a4a6a';
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs" style={{ color: '#4a4a6a', fontFamily: 'Share Tech Mono, monospace' }}>{label}</span>
      <span className="text-xs uppercase" style={{ color, fontFamily: 'Share Tech Mono, monospace' }}>{value}</span>
    </div>
  );
}
