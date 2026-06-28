import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { MinigameHost } from '../components/minigames/MinigameHost';
import { makeShardItem } from '../data/items';
import type { MinigameResult } from '../types/minigame';

const PHASES = [
  {
    number: 0,
    name: 'The Iron Mantle',
    color: '#8888aa',
    description: 'Soul-bound plate that resists all damage. You must find the resonance frequency and shatter it.',
    minigame: 'rhythm' as const,
    difficulty: 0.5,
    label: 'RESONANCE SHATTERING — STRIKE THE FREQUENCY',
    hitsNeeded: 4,
    failPenalty: 'The Warden slams the earth. Tremor modifier activates on the next phase.',
    successFlavor: 'The armor shatters in chunks. The Warden staggers — a brief opening.',
  },
  {
    number: 1,
    name: 'The Will Cage',
    color: '#68a8e8',
    description: 'A psionic barrier that reflects damage as soul debt. Break through with sustained will.',
    minigame: 'tension' as const,
    difficulty: 0.65,
    label: 'COUNTER-WILL — HOLD AGAINST THE WARDEN\'S MIND',
    failPenalty: 'Soul debt +15. Your next equipped shard weakens temporarily.',
    successFlavor: 'The cage shatters. The Hollow-fragment within the Warden screams.',
  },
  {
    number: 2,
    name: 'The Hollow Chorus',
    color: '#c0392b',
    description: 'The Hollow energy field surrounding the Warden. You must isolate the anchor frequency.',
    minigame: 'lockpick' as const,
    difficulty: 0.7,
    label: 'FREQUENCY ISOLATION — PICK THE HOLLOW\'S LOCK',
    failPenalty: 'The chorus expands. Darkness penalty on all remaining phases.',
    successFlavor: 'The Hollow Chorus silences. The Warden\'s movements slow.',
  },
  {
    number: 3,
    name: 'The Binding Core',
    color: '#e05a20',
    description: 'The physical soul-bind itself — the knot tying Hollow to body. Strike it precisely and relentlessly.',
    minigame: 'rhythm' as const,
    difficulty: 0.8,
    label: 'SOUL SEVERING — STRIKE THE CORE',
    failPenalty: 'The Warden rises into berserker state. All previous phases must be re-cleared.',
    successFlavor: 'The binding frays. The Warden collapses. Two consciousnesses separate.',
  },
];

export function BossScreen() {
  const run = useGameStore(s => s.run);
  const clearWardenPhase = useGameStore(s => s.clearWardenPhase);
  const changeHp = useGameStore(s => s.changeHp);
  const changeStress = useGameStore(s => s.changeStress);
  const changeStamina = useGameStore(s => s.changeStamina);
  const changeSoulDebt = useGameStore(s => s.changeSoulDebt);
  const addItem = useGameStore(s => s.addItem);
  const endRun = useGameStore(s => s.endRun);

  const [phase, setPhase] = useState<'approach' | 'fighting' | 'phase_result' | 'victory'>('approach');
  const [currentPhaseResult, setCurrentPhaseResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [extraDarkness, setExtraDarkness] = useState(false);
  const [rerunFrom, setRerunFrom] = useState<number | null>(null);

  const currentPhaseIndex = rerunFrom ?? run.wardenPhase;
  const phaseData = PHASES[currentPhaseIndex];
  const isVossAllied = run.worldFlags.marekVoss === 'allied';

  const handleMinigameComplete = (result: MinigameResult) => {
    changeStamina(-result.staminaCost);
    changeStress(result.stressChange);

    if (result.success) {
      clearWardenPhase(currentPhaseIndex);
      setCurrentPhaseResult({ success: true, msg: phaseData.successFlavor });
      setRerunFrom(null);
      setPhase('phase_result');
    } else {
      // Failure consequences
      if (currentPhaseIndex === 1) changeSoulDebt(15);
      if (currentPhaseIndex === 2) setExtraDarkness(true);
      if (currentPhaseIndex === 3) {
        // Reset all phases
        setRerunFrom(0);
        changeStress(25);
        changeHp(-20);
        setCurrentPhaseResult({ success: false, msg: `${phaseData.failPenalty} The Warden rises again. You must start over.` });
      } else {
        changeHp(-20);
        setCurrentPhaseResult({ success: false, msg: `${phaseData.failPenalty} HP −20. Press on.` });
      }
      setPhase('phase_result');
    }
  };

  const handleNextPhase = () => {
    if (run.hp <= 0) { endRun('death'); return; }

    const nextPhase = rerunFrom !== null ? rerunFrom : currentPhaseIndex + 1;
    if (nextPhase >= PHASES.length && rerunFrom === null) {
      // All phases cleared
      const hollowShard = makeShardItem('hollow');
      hollowShard.gridOrigin = null;
      addItem(hollowShard);
      setPhase('victory');
    } else {
      setPhase('fighting');
    }
  };

  // Determine effective difficulty for phase — Voss bonus on phase 2
  const effectiveDifficulty = (phaseData && isVossAllied && currentPhaseIndex === 2)
    ? Math.max(0.2, phaseData.difficulty - 0.25)
    : phaseData?.difficulty ?? 0.5;

  const hazards: string[] = [];
  if (extraDarkness) hazards.push('darkness');
  if (run.stress >= 75) hazards.push('fear');

  return (
    <div className="min-h-screen pb-24" style={{ background: '#040406' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#1c1c35', background: '#08080f' }}>
        <div className="max-w-2xl mx-auto px-5 py-3">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#8888aa' }}>
            STRATUM 12 — THE THRESHOLD OF THE DEEP
          </p>
          <p className="text-xs" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace' }}>
            THE WARDEN OF THE DEEP
          </p>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="border-b" style={{ borderColor: '#1c1c35' }}>
        <div className="max-w-2xl mx-auto px-5 py-2 flex gap-1">
          {PHASES.map((p, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded"
              style={{
                background: run.wardenPhaseCleared[i]
                  ? p.color
                  : i === currentPhaseIndex
                  ? p.color + '60'
                  : '#1c1c35',
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {phase === 'approach' && (
          <div className="space-y-5">
            {/* Warden description */}
            <div className="rounded border p-6 space-y-3" style={{ borderColor: '#8888aa30', background: '#08080f' }}>
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#8888aa' }}>MECHANICAL PUZZLE BOSS</p>
              <h1 className="font-display text-3xl" style={{ color: '#f0f0ff' }}>THE WARDEN OF THE DEEP</h1>
              <p className="text-base italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
                It was once a Compact Inquisitor — a soul-binder of extraordinary skill who attempted to bind the Hollow itself. The attempt worked, partially. The Hollow now inhabits the Warden's body alongside what remains of the Inquisitor, and the two consciousness fragments war for control of every action.
              </p>
              <p className="text-base italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
                It is not a monster. It is a system error given form.
              </p>
            </div>

            {/* Voss intel */}
            {isVossAllied && (
              <div className="rounded border p-4" style={{ borderColor: '#c49a2840', background: '#c49a2808' }}>
                <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: '#c49a28' }}>
                  VOSS'S INTEL — PHASE 3 ADVANTAGE
                </p>
                <p className="text-sm" style={{ color: '#a0a0c0' }}>
                  Voss told you the Hollow Chorus resonates at the frequency of regret. Phase 3 difficulty reduced — the lock opens wider than it should.
                </p>
              </div>
            )}

            {/* Phase overview */}
            <div className="space-y-2">
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#4a4a6a' }}>DEFENSE LAYERS</p>
              {PHASES.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border px-3 py-2"
                  style={{
                    borderColor: run.wardenPhaseCleared[i] ? p.color + '40' : '#1c1c35',
                    background: run.wardenPhaseCleared[i] ? p.color + '08' : '#08080f',
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="font-display text-xs tracking-widest uppercase flex-1" style={{ color: run.wardenPhaseCleared[i] ? p.color : '#6b6b8a' }}>
                    {p.name}
                  </span>
                  {run.wardenPhaseCleared[i] && (
                    <span className="text-xs" style={{ color: '#4ec49a', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>STRIPPED</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('fighting')}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
              style={{ borderColor: '#8888aa60', background: '#8888aa10', color: '#8888aa' }}
            >
              BEGIN THE ENCOUNTER
            </button>
          </div>
        )}

        {phase === 'fighting' && phaseData && (
          <div className="space-y-5">
            {/* Phase header */}
            <div className="rounded border p-5 space-y-2" style={{ borderColor: phaseData.color + '35', background: '#08080f' }}>
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: phaseData.color + '80', fontFamily: 'Share Tech Mono, monospace' }}>
                PHASE {currentPhaseIndex + 1} / {PHASES.length}
              </p>
              <h2 className="font-display text-2xl" style={{ color: phaseData.color }}>{phaseData.name}</h2>
              <p className="text-sm italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
                {phaseData.description}
              </p>
              {isVossAllied && currentPhaseIndex === 2 && (
                <p className="text-xs" style={{ color: '#c49a28', fontFamily: 'Share Tech Mono, monospace' }}>
                  ★ VOSS INTEL ACTIVE — difficulty reduced
                </p>
              )}
            </div>

            {/* Minigame */}
            <div className="rounded border p-5" style={{ borderColor: phaseData.color + '25', background: '#0a0a14' }}>
              <MinigameHost
                key={`phase-${currentPhaseIndex}-${rerunFrom}`}
                type={phaseData.minigame}
                difficulty={effectiveDifficulty}
                hazardOverrides={hazards as never}
                label={phaseData.label}
                onComplete={handleMinigameComplete}
              />
            </div>
          </div>
        )}

        {phase === 'phase_result' && currentPhaseResult && (
          <div className="space-y-4">
            <div
              className="rounded border p-5 text-center space-y-2"
              style={{
                borderColor: currentPhaseResult.success ? '#4ec49a30' : '#c0392b30',
                background: currentPhaseResult.success ? '#4ec49a05' : '#c0392b05',
              }}
            >
              <p
                className="font-display text-2xl"
                style={{ color: currentPhaseResult.success ? '#4ec49a' : '#c0392b' }}
              >
                {currentPhaseResult.success ? 'LAYER STRIPPED' : 'PHASE FAILED'}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#a0a0c0' }}>{currentPhaseResult.msg}</p>
            </div>

            {run.hp <= 0 ? (
              <button
                onClick={() => endRun('death')}
                className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase"
                style={{ borderColor: '#c0392b60', color: '#c0392b' }}
              >
                YOU HAVE FALLEN
              </button>
            ) : (
              <button
                onClick={handleNextPhase}
                className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
                style={{
                  borderColor: currentPhaseResult.success ? '#8888aa50' : '#c0392b40',
                  color: currentPhaseResult.success ? '#8888aa' : '#e05a20',
                }}
              >
                {currentPhaseResult.success
                  ? (currentPhaseIndex + 1 >= PHASES.length ? 'DELIVER THE FINAL BLOW' : 'PRESS THE ADVANTAGE')
                  : 'RISE — CONTINUE THE FIGHT'}
              </button>
            )}
          </div>
        )}

        {phase === 'victory' && (
          <div className="space-y-5">
            <div className="rounded border p-6 space-y-3 text-center" style={{ borderColor: '#8888aa40', background: '#08080f' }}>
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#8888aa' }}>THE BINDING IS SEVERED</p>
              <h2 className="font-display text-3xl" style={{ color: '#f0f0ff' }}>THE WARDEN IS STILL</h2>
              <p className="text-base italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
                The Hollow-half dissipates. The Inquisitor's fragment speaks one sentence — a name you don't recognise, or perhaps do — before dissolving into the dark.
              </p>
              <p className="text-base italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
                The Hollow Shard falls from the body. Warm. Still resonating.
              </p>
            </div>
            <div className="rounded border p-4 text-center" style={{ borderColor: '#8888aa30', background: '#8888aa08' }}>
              <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: '#8888aa' }}>HOLLOW SHARD — ACQUIRED</p>
              <p className="text-xs" style={{ color: '#6b6b8a' }}>The most powerful soul shard. Added to inventory.</p>
            </div>
            <button
              onClick={() => endRun('victory')}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
              style={{ borderColor: '#8888aa50', background: '#8888aa10', color: '#8888aa' }}
            >
              ASCEND — END THE RUN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
