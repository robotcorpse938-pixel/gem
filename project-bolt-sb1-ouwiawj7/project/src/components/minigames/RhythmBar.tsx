import { useState, useRef, useCallback } from 'react';
import type { MinigameConfig, MinigameResult } from '../../types/minigame';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useKeyPress } from '../../hooks/useKeyPress';

interface Props {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
}

export function RhythmBar({ config, onComplete }: Props) {
  const [barPos, setBarPos] = useState(0); // 0-100
  const [feedback, setFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
  const [hitsNeeded] = useState(3);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const directionRef = useRef(1);
  const doneRef = useRef(false);
  const barPosRef = useRef(0);

  const speed = 28 * (1 + config.barSpeedBonus) * config.speedMultiplier;
  const baseWindowSize = 22 - config.windowShrink * 14;
  const tremorShiftRef = useRef(0);

  // Window center oscillates if tremorWindow shard
  const windowCenterRef = useRef(50);

  useAnimationFrame((dt) => {
    if (doneRef.current) return;

    // Move bar
    barPosRef.current += directionRef.current * speed * dt;
    if (barPosRef.current >= 100) { barPosRef.current = 100; directionRef.current = -1; }
    if (barPosRef.current <= 0) { barPosRef.current = 0; directionRef.current = 1; }

    // Tremor oscillation
    if (config.tremor > 0) {
      tremorShiftRef.current = Math.sin(Date.now() * 0.01) * config.tremor * 0.3;
    }

    // Tremor window shard — window center oscillates
    if (config.tremorWindow) {
      windowCenterRef.current = 50 + Math.sin(Date.now() * 0.003) * 15;
    }

    setBarPos(barPosRef.current);
  });

  const handleHit = useCallback(() => {
    if (doneRef.current) return;
    const pos = barPosRef.current;
    const center = windowCenterRef.current;
    const hw = baseWindowSize / 2;
    const perfectHw = hw * 0.35;

    const dist = Math.abs(pos - center);
    let quality: 'perfect' | 'good' | 'miss' = 'miss';
    if (dist <= perfectHw) quality = 'perfect';
    else if (dist <= hw) quality = 'good';

    setFeedback(quality);
    setTimeout(() => setFeedback(null), 300);

    if (quality === 'miss') {
      const newMisses = misses + 1;
      setMisses(newMisses);
      if (newMisses >= 3) {
        doneRef.current = true;
        onComplete({ success: false, quality: 'fail', stressChange: 15, staminaCost: 12 });
      }
    } else {
      const newHits = hits + 1;
      setHits(newHits);
      if (newHits >= hitsNeeded) {
        doneRef.current = true;
        const sc = quality === 'perfect' ? -8 : -3;
        onComplete({ success: true, quality, stressChange: sc, staminaCost: 10 });
      }
    }
  }, [misses, hits, hitsNeeded, baseWindowSize, onComplete]);

  useKeyPress('Space', handleHit);

  const wc = windowCenterRef.current;
  const hw = baseWindowSize / 2;
  const ghostPos = config.ghostBar ? (barPosRef.current + 18) % 100 : null;

  const tremorStyle = config.tremor > 0
    ? { transform: `translateX(${tremorShiftRef.current}px)` }
    : {};

  const opacity = Math.max(0.3, 1 - config.opacityDrop);

  return (
    <div className="flex flex-col items-center gap-5 select-none" style={{ opacity }}>
      <div className="text-center">
        <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: '#c49a28' }}>
          {config.label || 'COMBAT — RHYTHM STRIKE'}
        </p>
        <p className="text-sm" style={{ color: '#6b6b8a' }}>
          Hits: <span style={{ color: '#4ec49a' }}>{hits}/{hitsNeeded}</span>
          &nbsp;·&nbsp; Misses: <span style={{ color: '#c0392b' }}>{misses}/3</span>
        </p>
      </div>

      {/* Track */}
      <div className="relative w-full max-w-sm" style={tremorStyle}>
        <div
          className="relative h-12 rounded overflow-hidden"
          style={{ background: '#0d0d1a', border: '1px solid #2a2a4a' }}
        >
          {/* Hit window */}
          <div
            className="absolute top-0 h-full rounded"
            style={{
              left: `${wc - hw}%`,
              width: `${baseWindowSize}%`,
              background: 'rgba(78,196,154,0.18)',
              border: '1px solid rgba(78,196,154,0.4)',
            }}
          />
          {/* Perfect zone */}
          {config.perfectZoneBonus && (
            <div
              className="absolute top-0 h-full rounded"
              style={{
                left: `${wc - hw * 0.35}%`,
                width: `${baseWindowSize * 0.35}%`,
                background: 'rgba(196,154,40,0.3)',
                border: '1px solid rgba(196,154,40,0.6)',
              }}
            />
          )}
          {/* Ghost bar (fear cascade) */}
          {ghostPos !== null && (
            <div
              className="absolute top-1 bottom-1 w-2 rounded"
              style={{ left: `${ghostPos}%`, background: 'rgba(136,136,170,0.3)', transform: 'translateX(-50%)' }}
            />
          )}
          {/* Main bar */}
          <div
            className="absolute top-1 bottom-1 w-2.5 rounded transition-none"
            style={{
              left: `${barPos}%`,
              transform: 'translateX(-50%)',
              background: feedback === 'perfect' ? '#c49a28' : feedback === 'good' ? '#4ec49a' : feedback === 'miss' ? '#c0392b' : '#e0e0f8',
              boxShadow: `0 0 10px ${feedback === 'perfect' ? '#c49a28' : feedback === 'good' ? '#4ec49a' : '#e0e0f8'}`,
            }}
          />
          {/* Noise fake indicators */}
          {config.noiseLevel > 0 && Array.from({ length: Math.floor(config.noiseLevel * 3) }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full w-0.5"
              style={{
                left: `${20 + i * 25 + Math.sin(Date.now() * 0.002 + i) * 10}%`,
                background: 'rgba(136,136,170,0.2)',
              }}
            />
          ))}
        </div>

        {/* Feedback flash */}
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-display text-lg font-bold"
              style={{ color: feedback === 'perfect' ? '#c49a28' : feedback === 'good' ? '#4ec49a' : '#c0392b' }}
            >
              {feedback === 'perfect' ? 'PERFECT' : feedback === 'good' ? 'HIT' : 'MISS'}
            </span>
          </div>
        )}
      </div>

      <button
        onPointerDown={handleHit}
        className="w-full max-w-sm py-3 rounded border font-display text-sm tracking-widest uppercase transition-all active:scale-95"
        style={{ borderColor: '#4ec49a50', background: '#4ec49a10', color: '#4ec49a' }}
      >
        STRIKE — [Space] or Tap
      </button>
    </div>
  );
}
