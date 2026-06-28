import { useState, useRef } from 'react';
import type { MinigameConfig, MinigameResult } from '../../types/minigame';
import { useAnimationFrame } from '../../hooks/useAnimationFrame';
import { useKeyHold } from '../../hooks/useKeyPress';

interface Props {
  config: MinigameConfig;
  onComplete: (result: MinigameResult) => void;
  label?: string;
}

export function TensionMeter({ config, onComplete, label }: Props) {
  const [gaugeValue, setGaugeValue] = useState(50);
  const [, setSuccessAcc] = useState(0);
  const [, setPhase] = useState<'playing' | 'done'>('playing');
  const [feedback, setFeedback] = useState<string | null>(null);

  const gaugeRef = useRef(50);
  const successRef = useRef(0);
  const doneRef = useRef(false);
  const timeRef = useRef(0);
  const isHeld = useKeyHold('Space');

  const requiredDuration = 2.5 + config.difficulty * 1.5; // 2.5–4s
  const oscillationSpeed = 25 + config.difficulty * 20;
  const phaseRef = useRef(0);

  // Agreement zone: center 30% of gauge
  const zoneMin = 35;
  const zoneMax = 65;

  useAnimationFrame((dt) => {
    if (doneRef.current) return;

    timeRef.current += dt;
    const timeLimitMs = config.timeLimit ?? 20000;
    if (timeRef.current * 1000 > timeLimitMs) {
      doneRef.current = true;
      setPhase('done');
      onComplete({ success: false, quality: 'fail', stressChange: 20, staminaCost: 12 });
      return;
    }

    // Oscillate gauge — more chaotic at high difficulty
    phaseRef.current += dt * oscillationSpeed * config.speedMultiplier;
    const base = 50 + Math.sin(phaseRef.current * 0.08) * 35;
    const chaos = config.difficulty > 0.5 ? Math.sin(phaseRef.current * 0.22) * 12 : 0;
    gaugeRef.current = Math.max(5, Math.min(95, base + chaos));

    // Noise: add fake spikes
    const noiseSpike = config.noiseLevel > 0 && Math.random() < config.noiseLevel * 0.05
      ? (Math.random() - 0.5) * 20 : 0;
    setGaugeValue(gaugeRef.current + noiseSpike);

    // Accumulate success if held and in zone
    const inZone = gaugeRef.current >= zoneMin && gaugeRef.current <= zoneMax;
    if (isHeld()) {
      if (inZone) {
        successRef.current += dt;
        setSuccessAcc(successRef.current);
      } else {
        successRef.current = Math.max(0, successRef.current - dt * 1.5);
        setSuccessAcc(successRef.current);
      }
    }

    if (successRef.current >= requiredDuration) {
      doneRef.current = true;
      setPhase('done');
      setFeedback('SUCCESS');
      onComplete({ success: true, quality: 'good', stressChange: -5, staminaCost: 12 });
    }
  });


  const opacity = Math.max(0.35, 1 - config.opacityDrop);
  const progress = Math.min(1, successRef.current / requiredDuration);
  const inZone = gaugeValue >= zoneMin && gaugeValue <= zoneMax;
  const tremorOffset = config.tremor > 0 ? Math.sin(Date.now() * 0.015) * config.tremor * 0.4 : 0;

  return (
    <div className="flex flex-col items-center gap-5 select-none" style={{ opacity }}>
      <div className="text-center">
        <p className="font-display text-xs tracking-widest uppercase mb-1" style={{ color: '#e05a20' }}>
          {label || config.label || 'PERSUASION — TENSION HOLD'}
        </p>
        <p className="text-xs" style={{ color: '#6b6b8a' }}>Hold [Space] or button while needle is in the zone</p>
      </div>

      {/* Gauge */}
      <div
        className="relative w-full max-w-sm"
        style={{ transform: `translateX(${tremorOffset}px)` }}
      >
        <div
          className="relative h-14 rounded overflow-hidden"
          style={{ background: '#0d0d1a', border: '1px solid #2a2a4a' }}
        >
          {/* Agreement zone */}
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${zoneMin}%`,
              width: `${zoneMax - zoneMin}%`,
              background: 'rgba(78,196,154,0.12)',
              border: '1px solid rgba(78,196,154,0.35)',
            }}
          />
          {/* Zone label */}
          <div
            className="absolute top-1 text-xs font-display tracking-widest"
            style={{ left: `${zoneMin + 3}%`, color: 'rgba(78,196,154,0.5)' }}
          >
            ZONE
          </div>

          {/* Needle */}
          <div
            className="absolute top-0 h-full w-1 rounded transition-none"
            style={{
              left: `${gaugeValue}%`,
              transform: 'translateX(-50%)',
              background: inZone ? '#4ec49a' : '#e05a20',
              boxShadow: `0 0 8px ${inZone ? '#4ec49a' : '#e05a20'}`,
              transition: 'background 0.1s, box-shadow 0.1s',
            }}
          />
        </div>

        {/* Success accumulator */}
        <div className="mt-2 h-1.5 rounded overflow-hidden" style={{ background: '#111122' }}>
          <div
            className="h-full rounded transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(to right, #4ec49a, #c49a28)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: '#4a4a6a', fontFamily: 'Share Tech Mono, monospace' }}>
            HOLD PROGRESS
          </span>
          <span className="text-xs" style={{ color: '#4ec49a', fontFamily: 'Share Tech Mono, monospace' }}>
            {Math.floor(progress * 100)}%
          </span>
        </div>
      </div>

      {feedback && (
        <p className="font-display text-xl" style={{ color: '#4ec49a' }}>{feedback}</p>
      )}

      <button
        onPointerDown={() => { /* handled via key */ }}
        className="w-full max-w-sm py-3 rounded border font-display text-sm tracking-widest uppercase transition-all active:scale-95"
        style={{
          borderColor: '#e05a2050',
          background: '#e05a2010',
          color: '#e05a20',
        }}
      >
        HOLD [Space] or Hold Button
      </button>
    </div>
  );
}
