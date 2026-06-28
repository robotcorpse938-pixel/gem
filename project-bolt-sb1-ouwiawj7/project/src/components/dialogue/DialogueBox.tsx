import { useState } from 'react';
import type { DialogueTree, DialogueChoice } from '../../data/npcs';
import { MinigameHost } from '../minigames/MinigameHost';
import type { MinigameResult } from '../../types/minigame';
import { useGameStore } from '../../store/useGameStore';

interface Props {
  tree: DialogueTree;
  onClose: () => void;
}

export function DialogueBox({ tree, onClose }: Props) {
  const applyFlagEffect = useGameStore(s => s.applyFlagEffect);
  const [currentNodeId, setCurrentNodeId] = useState(tree.rootNode);
  const [minigameChoice, setMinigameChoice] = useState<DialogueChoice | null>(null);
  const [ponrResult, setPonrResult] = useState<'pending' | 'success' | 'fail' | null>(null);
  const [ended, setEnded] = useState(false);

  const currentNode = tree.nodes[currentNodeId];

  const handleChoice = (choice: DialogueChoice) => {
    if (choice.isPONR) {
      setMinigameChoice(choice);
      setPonrResult('pending');
      return;
    }
    if (choice.effect) applyFlagEffect(choice.effect);
    if (choice.next) {
      const nextNode = tree.nodes[choice.next];
      if (nextNode?.effect) applyFlagEffect(nextNode.effect);
      setCurrentNodeId(choice.next);
      if (nextNode?.isEnd) setEnded(true);
    } else {
      setEnded(true);
    }
  };

  const handleMinigameComplete = (result: MinigameResult) => {
    if (!minigameChoice) return;
    setPonrResult(result.success ? 'success' : 'fail');
    const nextId = result.success ? minigameChoice.successNext : minigameChoice.failNext;
    if (nextId) {
      const nextNode = tree.nodes[nextId];
      if (nextNode?.effect) applyFlagEffect(nextNode.effect);
      setTimeout(() => {
        setMinigameChoice(null);
        setPonrResult(null);
        setCurrentNodeId(nextId);
        if (nextNode?.isEnd) setEnded(true);
      }, 1200);
    }
  };

  if (!currentNode) return null;

  const npcColor = {
    marekVoss: '#c49a28',
    sisterAelith: '#68a8e8',
    gorveth: '#4ec49a',
  }[tree.npcId] ?? '#c8c8e8';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
      style={{ background: 'rgba(4,4,6,0.85)' }}
    >
      <div
        className="relative w-full max-w-2xl rounded border overflow-hidden"
        style={{ background: '#08080f', borderColor: npcColor + '40' }}
      >
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: npcColor }} />
        <span className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: npcColor }} />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: npcColor }} />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: npcColor }} />

        {/* Speaker */}
        <div className="px-5 pt-4 pb-2 border-b" style={{ borderColor: npcColor + '25' }}>
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: npcColor }}>
            {currentNode.speaker}
          </p>
        </div>

        {/* Body */}
        <div className="p-5">
          {minigameChoice && ponrResult === 'pending' ? (
            <div className="space-y-4">
              <div className="rounded border p-3 mb-4" style={{ borderColor: '#e05a2030', background: '#e05a2008' }}>
                <p className="text-xs font-display tracking-widest uppercase mb-1" style={{ color: '#e05a20' }}>
                  POINT OF NO RETURN
                </p>
                <p className="text-sm" style={{ color: '#8888aa' }}>
                  This conversation cannot be undone. The outcome is permanent.
                </p>
              </div>
              <MinigameHost
                type={minigameChoice.minigameType ?? 'tension'}
                difficulty={minigameChoice.minigameDifficulty ?? 0.6}
                label="PERSUASION CHECK — HOLD TO CONVINCE"
                onComplete={handleMinigameComplete}
              />
            </div>
          ) : ponrResult === 'success' ? (
            <div className="text-center py-4">
              <p className="font-display text-2xl" style={{ color: '#4ec49a' }}>SUCCESS</p>
              <p className="text-sm mt-1" style={{ color: '#8888aa' }}>The conversation tips in your favour.</p>
            </div>
          ) : ponrResult === 'fail' ? (
            <div className="text-center py-4">
              <p className="font-display text-2xl" style={{ color: '#c0392b' }}>FAILED</p>
              <p className="text-sm mt-1" style={{ color: '#8888aa' }}>The thread has pulled. Something unravels.</p>
            </div>
          ) : ended ? (
            <div className="space-y-4">
              <p className="text-lg leading-relaxed" style={{ color: '#c8c8e8', fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>
                "{currentNode.text}"
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded border font-display text-xs tracking-widest uppercase transition-all"
                style={{ borderColor: npcColor + '40', color: npcColor, background: npcColor + '08' }}
              >
                [LEAVE]
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg leading-relaxed" style={{ color: '#c8c8e8', fontFamily: 'Crimson Pro, serif', fontStyle: 'italic' }}>
                "{currentNode.text}"
              </p>
              <div className="space-y-2 pt-2">
                {currentNode.choices.map((choice, i) => {
                  const isPONR = choice.isPONR;
                  return (
                    <button
                      key={i}
                      onClick={() => handleChoice(choice)}
                      className="w-full text-left py-2.5 px-3 rounded border transition-all hover:bg-white/5"
                      style={{
                        borderColor: isPONR ? '#c0392b50' : npcColor + '25',
                        color: isPONR ? '#e05a20' : '#a0a0c0',
                        background: isPONR ? '#c0392b08' : 'transparent',
                      }}
                    >
                      <span className="mr-2" style={{ color: isPONR ? '#c0392b' : npcColor + '60', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {choice.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
