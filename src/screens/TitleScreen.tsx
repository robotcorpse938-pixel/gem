import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { loadRun, getStoredSessionId, storeSessionId } from '../lib/persistence';
import type { RunState } from '../types/game';

export function TitleScreen() {
  const startNewRun = useGameStore(s => s.startNewRun);
  const setScreen = useGameStore(s => s.setScreen);
  const loadSave = useGameStore(s => s.loadSave);
  const [savedRun, setSavedRun] = useState<RunState | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const id = getStoredSessionId();
      if (id) {
        const saved = await loadRun(id);
        if (saved && saved.screen !== 'ending' && saved.screen !== 'title') {
          setSavedRun(saved);
        }
      }
      setChecking(false);
    };
    check();
  }, []);

  const handleNewRun = () => {
    startNewRun();
    setScreen('hub');
  };

  const handleContinue = () => {
    if (!savedRun) return;
    loadSave(savedRun);
    storeSessionId(savedRun.sessionId);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #040406, #08080f 60%, #0d0d1a)' }}
    >
      {/* Sigil */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ opacity: 0.05 }}>
          <circle cx="250" cy="250" r="230" fill="none" stroke="#c49a28" strokeWidth="0.5" strokeDasharray="4 8" />
          <circle cx="250" cy="250" r="180" fill="none" stroke="#c49a28" strokeWidth="0.3" />
          <circle cx="250" cy="250" r="120" fill="none" stroke="#c0392b" strokeWidth="0.5" strokeDasharray="2 6" />
          <polygon points="250,30 456,380 44,380" fill="none" stroke="#c49a28" strokeWidth="0.4" />
          <polygon points="250,470 44,120 456,120" fill="none" stroke="#c49a28" strokeWidth="0.4" />
          <circle cx="250" cy="250" r="6" fill="none" stroke="#c49a28" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-lg w-full space-y-8">
        <div>
          <p className="font-display text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#c49a28', fontFamily: 'Share Tech Mono, monospace' }}>
            A GRIM FANTASY RPG
          </p>
          <h1
            className="font-display font-black leading-none mb-1"
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: '#f0f0ff' }}
          >
            THE SOUL-BINDER'S
          </h1>
          <h1
            className="font-display font-black leading-none"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              color: '#c49a28',
              textShadow: '0 0 40px rgba(196,154,40,0.3)',
            }}
          >
            ABYSS
          </h1>
        </div>

        <p className="text-base italic leading-relaxed" style={{ color: '#6b6b8a', fontFamily: 'Crimson Pro, serif' }}>
          Every action is a test. Every failure, a permanent scar.
          Descend into the Abyss. Face the Warden. Choose your allies carefully.
        </p>

        <div className="space-y-3">
          {checking ? (
            <p className="text-xs font-display tracking-widest" style={{ color: '#3a3a5c' }}>CHECKING SAVE...</p>
          ) : (
            <>
              {savedRun && (
                <button
                  onClick={handleContinue}
                  className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all hover:-translate-y-0.5"
                  style={{ borderColor: '#4ec49a50', background: '#4ec49a08', color: '#4ec49a' }}
                >
                  CONTINUE RUN — STRATUM {savedRun.currentStratum + 1}
                </button>
              )}
              <button
                onClick={handleNewRun}
                className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all hover:-translate-y-0.5"
                style={{ borderColor: '#c49a2840', background: '#c49a2808', color: '#c49a28' }}
              >
                {savedRun ? 'ABANDON & NEW RUN' : 'BEGIN THE DESCENT'}
              </button>
            </>
          )}
        </div>

        {/* How to play */}
        <div className="rounded border p-4 text-left space-y-2" style={{ borderColor: '#1c1c35', background: '#08080f80' }}>
          <p className="font-display text-xs tracking-widest uppercase mb-2" style={{ color: '#4a4a6a' }}>HOW TO PLAY</p>
          <HowToItem icon="▸" text="Every combat, dialogue, and lock uses a real-time minigame — no dice rolls." />
          <HowToItem icon="▸" text="[Space] or tap the button to interact with minigames." />
          <HowToItem icon="▸" text="Talk to NPCs in Ashfeld before descending — their fate shapes the world." />
          <HowToItem icon="▸" text="Buy gear, slot Soul Shards into weapons, and manage your Stress and Stamina." />
          <HowToItem icon="▸" text="The Warden has four mechanical phases. Strip each layer to reach its core." />
          <HowToItem icon="▸" text="Failures are permanent. The world remembers." />
        </div>
      </div>
    </div>
  );
}

function HowToItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="flex-shrink-0 text-xs mt-0.5" style={{ color: '#c49a28' }}>{icon}</span>
      <p className="text-xs leading-relaxed" style={{ color: '#6b6b8a' }}>{text}</p>
    </div>
  );
}
