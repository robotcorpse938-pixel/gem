import { useState, useRef, useCallback } from 'react';
import type { MinigameConfig, MinigameResult } from '../../types/minigame';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useKeyPress } from '../../hooks/useKeyPress';

interface Tumbler {
  pos: number;
  dir: number;
  zoneMin: number;
  zoneMax: number;
  set: boolean;
}

function makeTumbler(difficulty: number, index: number): Tumbler {
  const spread = 30 - difficulty * 15; // zone width shrinks with difficulty
  const center = 25 + (index * 20) % 50;
  return {
    pos: Math.random() * 100,
    dir: index % 2 === 0 ? 1 : -1,
    zoneMin: center - spread / 2,
    zoneMax: center + spread / 2,
    set: false,
  };
}

interface Props {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}

export function LockpickGame({ config, onComplete }: Props) {
  const tumblerCount = 3 + Math.floor(config.difficulty * 2);
  const [tumblers, setTumblers] = useState<Tumbler[]>(() =>
    Array.from({ length: tumblerCount }, (_, i) => makeTumbler(config.difficulty, i))
  );
  const [activeTumbler, setActiveTumbler] = useState(0);
  const [feedback, setFeedback] = useState<'set' | 'reset' | null>(null);
  const [tension, setTension] = useState(0);
  const doneRef = useRef(false);
  const tumblersRef = useRef(tumblers);

  const speed = (18 + config.difficulty * 16) * config.speedMultiplier;

  useAnimationFrame((dt) => {
    if (doneRef.current) return;

    setTumblers(prev => {
      const next = prev.map((t, i) => {
        if (t.set) return t;
        let p = t.pos + t.dir * speed * dt;
        let d = t.dir;
        if (p >= 100) { p = 100; d = -1; }
        if (p <= 0) { p = 0; d = 1; }

        // Tremor: zones drift
        let zm = t.zoneMin;
        let zx = t.zoneMax;
        if (config.tremor > 0) {
          const drift = Math.sin(Date.now() * 0.003 + i) * config.tremor * 0.2;
          zm = Math.max(5, zm + drift);
          zx = Math.min(95, zx + drift);
        }

        return { ...t, pos: p, dir: d, zoneMin: zm, zoneMax: zx };
      });
      tumblersRef.current = next;
      return next;
    });
  });

  const handleSet = useCallback(() => {
    if (doneRef.current) return;
    const t = tumblersRef.current[activeTumbler];
    if (!t || t.set) return;

    const inZone = t.pos >= t.zoneMin && t.pos <= t.zoneMax;

    if (inZone) {
      setFeedback('set');
      setTension(prev => Math.max(0, prev - 15));
      setTimeout(() => setFeedback(null), 400);

      setTumblers(prev => {
        const next = prev.map((tumbler, i) =>
          i === activeTumbler ? { ...tumbler, set: true } : tumbler
        );
        tumblersRef.current = next;

        const allSet = next.every(t => t.set);
        if (allSet) {
          doneRef.current = true;
          onComplete({ success: true, quality: 'good', stressChange: -5, staminaCost: 10 });
        } else {
          // Move to next unsolved tumbler
          const nextIdx = next.findIndex((t, i) => i > activeTumbler && !t.set);
          setActiveTumbler(nextIdx !== -1 ? nextIdx : next.findIndex(t => !t.set));
        }
        return next;
      });
    } else {
      setFeedback('reset');
      const newTension = tension + 25;
      setTension(newTension);
      setTimeout(() => setFeedback(null), 400);

      // Reset all unset tumblers
      setTumblers(prev => {
        const next = prev.map(t => t.set ? t : { ...t, pos: Math.random() * 100 });
        tumblersRef.current = next;
        return next;
      });
      setActiveTumbler(0);

      if (newTension >= 100) {
        doneRef.current = true;
        onComplete({ success: false, quality: 'fail', stressChange: 18, staminaCost: 10 });
      }
    }
  }, [activeTumbler, tension, onComplete]);

  useKeyPress('Space', handleSet);

  const opacity = Math.max(0.3, 1 - config.opacityDrop);
  const tremorOffset = config.tremor > 0 ? Math.sin(Date.now() * 0.01) * config.tremor * 0.25 : 0;

  return (
    <div className="flex flex-col items-center gap-5 select-none" style={{ opacity }}>
      <div className="text-center">
        <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: '#68a8e8' }}>
          {config.label || 'LOCKPICK — SET TUMBLERS'}
        </p>
        <p className="text-xs" style={{ color: '#6b6b8a' }}>
          Press [Space] when tumbler is in the glowing zone
        </p>
      </div>

      {/* Tension meter */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs mb-1" style={{ color: '#6b6b8a', fontFamily: 'Share Tech Mono, monospace' }}>
          <span>LOCK TENSION</span>
          <span style={{ color: tension > 70 ? '#c0392b' : '#6b6b8a' }}>{tension}%</span>
        </div>
        <div className="h-1.5 rounded overflow-hidden" style={{ background: '#0d0d1a' }}>
          <div
            className="h-full rounded transition-all"
            style={{ width: `${tension}%`, background: tension > 70 ? '#c0392b' : '#c49a28' }}
          />
        </div>
      </div>

      {/* Tumblers */}
      <div
        className="w-full max-w-sm space-y-3"
        style={{ transform: `translateX(${tremorOffset}px)` }}
      >
        {tumblers.map((t, i) => (
          <div key={i} className="relative">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-xs font-display tracking-widest w-20"
                style={{ color: t.set ? '#4ec49a' : i === activeTumbler ? '#c49a28' : '#3a3a5c', fontFamily: 'Share Tech Mono, monospace' }}
              >
                PIN {i + 1} {t.set ? '✓' : i === activeTumbler ? '▶' : ''}
              </span>
            </div>
            <div
              className="relative h-8 rounded overflow-hidden"
              style={{
                background: '#0d0d1a',
                border: `1px solid ${t.set ? '#4ec49a40' : i === activeTumbler ? '#c49a2840' : '#1c1c35'}`,
              }}
            >
              {/* Zone */}
              {!t.set && (
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${t.zoneMin}%`,
                    width: `${t.zoneMax - t.zoneMin}%`,
                    background: i === activeTumbler ? 'rgba(196,154,40,0.2)' : 'rgba(78,196,154,0.1)',
                    border: `1px solid ${i === activeTumbler ? 'rgba(196,154,40,0.5)' : 'rgba(78,196,154,0.3)'}`,
                  }}
                />
              )}
              {/* Pin */}
              {t.set ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-xs" style={{ color: '#4ec49a' }}>SET</span>
                </div>
              ) : (
                <div
                  className="absolute top-0.5 bottom-0.5 w-2 rounded"
                  style={{
                    left: `${t.pos}%`,
                    transform: 'translateX(-50%)',
                    background: i === activeTumbler ? '#c49a28' : '#4a4a6a',
                    boxShadow: i === activeTumbler ? '0 0 8px #c49a28' : 'none',
                  }}
                />
              )}
              {/* Noise ghost pins */}
              {config.noiseLevel > 0.3 && !t.set && i === activeTumbler && (
                <div
                  className="absolute top-0.5 bottom-0.5 w-1 rounded opacity-30"
                  style={{
                    left: `${(t.pos + 25 + Math.sin(Date.now() * 0.01) * 10) % 100}%`,
                    transform: 'translateX(-50%)',
                    background: '#8888aa',
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {feedback && (
        <div className="h-6 flex items-center">
          <span
            className="font-display text-lg"
            style={{ color: feedback === 'set' ? '#4ec49a' : '#c0392b' }}
          >
            {feedback === 'set' ? 'PIN SET' : 'SLIPPED — RESET'}
          </span>
        </div>
      )}

      <button
        onPointerDown={handleSet}
        className="w-full max-w-sm py-3 rounded border font-display text-sm tracking-widest uppercase transition-all active:scale-95"
        style={{ borderColor: '#68a8e850', background: '#68a8e810', color: '#68a8e8' }}
      >
        SET PIN — [Space] or Tap
      </button>
    </div>
  );
}
