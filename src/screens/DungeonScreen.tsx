import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { STRATA } from '../data/strata';
import { MinigameHost } from '../components/minigames/MinigameHost';
import { InventoryGrid } from '../components/inventory/InventoryGrid';
import { makeItem } from '../data/items';
import type { MinigameResult } from '../types/minigame';
import type { Room } from '../types/game';

type Phase = 'exploring' | 'combat' | 'loot' | 'rest' | 'hazard' | 'result';

export function DungeonScreen() {
  const run = useGameStore(s => s.run);
  const setScreen = useGameStore(s => s.setScreen);
  const changeHp = useGameStore(s => s.changeHp);
  const changeStress = useGameStore(s => s.changeStress);
  const changeStamina = useGameStore(s => s.changeStamina);
  const changeSoulDebt = useGameStore(s => s.changeSoulDebt);
  const clearCurrentRoom = useGameStore(s => s.clearCurrentRoom);
  const setRoomIndex = useGameStore(s => s.setRoomIndex);
  const setStratum = useGameStore(s => s.setStratum);
  const addItem = useGameStore(s => s.addItem);
  const endRun = useGameStore(s => s.endRun);

  const [phase, setPhase] = useState<Phase>('exploring');
  const [enemyHp, setEnemyHp] = useState(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [resultMsg, setResultMsg] = useState('');
  const [showInventory, setShowInventory] = useState(false);
  const [lootPicked, setLootPicked] = useState<string[]>([]);

  const stratumData = STRATA[run.currentStratum];
  const roomsInStratum = run.stratumRooms[run.currentStratum] ?? [];
  const currentRoom: Room | undefined = roomsInStratum[run.currentRoomIndex];
  const activeHazards = useGameStore(s => s.getActiveHazards)();

  const weapon = run.inventory.find(i => i.instanceId === run.equippedWeaponId);
  const weaponDamage = weapon?.stats.damage ?? 15;

  // Start combat
  const handleEnterRoom = () => {
    if (!currentRoom) return;
    if (currentRoom.cleared) return handleNextRoom();

    if (currentRoom.stressOnEnter) {
      changeStress(currentRoom.stressOnEnter);
    }

    switch (currentRoom.type) {
      case 'combat':
        setEnemyHp(currentRoom.enemy!.maxHp);
        setCombatLog([`You face: ${currentRoom.enemy!.name}`]);
        setPhase('combat');
        break;
      case 'loot':
        setLootPicked([]);
        setPhase('loot');
        break;
      case 'rest':
        setPhase('rest');
        break;
      case 'hazard':
        setPhase('hazard');
        break;
      default:
        handleNextRoom();
    }
  };

  const handleCombatResult = (result: MinigameResult) => {
    changeStamina(-result.staminaCost);
    changeStress(result.stressChange);

    if (result.success) {
      const dmg = Math.floor(weaponDamage * (result.quality === 'perfect' ? 2 : 1));
      const newHp = enemyHp - dmg;
      setCombatLog(prev => [...prev.slice(-4), `HIT — ${dmg} damage dealt.${result.quality === 'perfect' ? ' PERFECT STRIKE.' : ''}`]);
      setEnemyHp(newHp);

      if (newHp <= 0) {
        // Enemy defeated
        const enemy = currentRoom?.enemy;
        if (enemy?.souldDebtOnKill) changeSoulDebt(enemy.souldDebtOnKill);
        if (enemy?.lootTable?.length) {
          enemy.lootTable.forEach(itemId => {
            try {
              const item = makeItem(itemId, { gridOrigin: null });
              // find free cell
              const occ: Record<string, boolean> = {};
              run.inventory.forEach(i => {
                if (!i.gridOrigin) return;
                i.footprint.forEach(([dc, dr]) => { occ[`${i.gridOrigin![0]+dc},${i.gridOrigin![1]+dr}`] = true; });
              });
              for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 10; c++) {
                  if (!occ[`${c},${r}`] && !item.gridOrigin) item.gridOrigin = [c, r];
                }
              }
              addItem(item);
            } catch { /* unknown item */ }
          });
        }
        setResultMsg(`${enemy?.name ?? 'Enemy'} defeated.${enemy?.lootTable?.length ? ' Loot added to inventory.' : ''}`);
        clearCurrentRoom();
        setPhase('result');
      }
    } else {
      const dmg = currentRoom?.enemy?.damage ?? 15;
      const stressHit = currentRoom?.enemy?.stressOnHit ?? 8;
      changeHp(-dmg);
      changeStress(stressHit);
      setCombatLog(prev => [...prev.slice(-4), `MISS — You take ${dmg} damage.`]);

      if (run.hp - dmg <= 0) {
        endRun('death');
      }
    }
  };

  const handlePickLoot = (itemId: string) => {
    if (lootPicked.includes(itemId)) return;
    try {
      const item = makeItem(itemId, { gridOrigin: null });
      const occ: Record<string, boolean> = {};
      run.inventory.forEach(i => {
        if (!i.gridOrigin) return;
        i.footprint.forEach(([dc, dr]) => { occ[`${i.gridOrigin![0]+dc},${i.gridOrigin![1]+dr}`] = true; });
      });
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 10; c++) {
          if (!occ[`${c},${r}`] && !item.gridOrigin) item.gridOrigin = [c, r];
        }
      }
      addItem(item);
      setLootPicked(prev => [...prev, itemId]);
    } catch { /* skip */ }
  };

  const handleNextRoom = () => {
    clearCurrentRoom();
    setPhase('exploring');
    setResultMsg('');
    setCombatLog([]);

    const totalRooms = roomsInStratum.length;
    if (run.currentRoomIndex + 1 >= totalRooms) {
      // Stratum complete — go to next stratum or boss
      const nextStratum = run.currentStratum + 1;
      if (nextStratum >= STRATA.length) {
        setScreen('boss');
      } else {
        setStratum(nextStratum);
      }
    } else {
      setRoomIndex(run.currentRoomIndex + 1);
    }
  };

  const handleFlee = () => {
    changeStress(20);
    changeHp(-10);
    setResultMsg('You fled. Stress +20. HP −10.');
    setPhase('result');
  };

  if (!currentRoom || !stratumData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#040406' }}>
        <div className="text-center space-y-4">
          <p className="font-display text-xl" style={{ color: '#c49a28' }}>STRATUM CLEARED</p>
          <button onClick={() => setScreen('boss')} className="px-6 py-3 rounded border font-display text-sm tracking-widest uppercase" style={{ borderColor: '#c0392b60', color: '#c0392b' }}>
            DESCEND TO THE WARDEN
          </button>
        </div>
      </div>
    );
  }

  const hazardNames = activeHazards.map(h => h.replace('_', ' ').toUpperCase()).join(' · ');

  return (
    <div className="min-h-screen pb-24" style={{ background: '#040406' }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-40" style={{ borderColor: '#1c1c35', background: '#08080fee' }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: stratumData.color }}>
              STRATUM {stratumData.id} — {stratumData.name.toUpperCase()}
            </p>
            <p className="text-xs" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace' }}>
              ROOM {run.currentRoomIndex + 1}/{roomsInStratum.length}
              {hazardNames ? ` · HAZARDS: ${hazardNames}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInventory(true)}
              className="px-3 py-1.5 rounded border text-xs font-display tracking-widest uppercase"
              style={{ borderColor: '#2a2a4a', color: '#6b6b8a' }}
            >
              INV
            </button>
            <button
              onClick={() => setScreen('hub')}
              className="px-3 py-1.5 rounded border text-xs font-display tracking-widest uppercase"
              style={{ borderColor: '#2a2a4a', color: '#6b6b8a' }}
            >
              RETREAT
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: '#111122' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((run.currentRoomIndex) / roomsInStratum.length) * 100}%`,
            background: stratumData.color,
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

        {/* Hazard warning */}
        {activeHazards.length > 0 && (
          <div className="rounded border px-4 py-2" style={{ borderColor: '#c0392b20', background: '#c0392b08' }}>
            <p className="text-xs font-display tracking-widest uppercase" style={{ color: '#c0392b' }}>
              ACTIVE HAZARDS: {hazardNames}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>
              All minigames in this stratum are affected.
            </p>
          </div>
        )}

        {/* Room card */}
        <div className="rounded border p-5 space-y-3" style={{ borderColor: stratumData.color + '30', background: '#08080f' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-display tracking-widest uppercase mb-1" style={{ color: stratumData.color + '80', fontFamily: 'Share Tech Mono, monospace' }}>
                {currentRoom.type.toUpperCase()}
              </p>
              <h2 className="font-display text-xl" style={{ color: '#e0e0f8' }}>{currentRoom.title}</h2>
            </div>
            {currentRoom.cleared && (
              <span className="text-xs px-2 py-1 rounded" style={{ background: '#4ec49a15', color: '#4ec49a', fontFamily: 'Share Tech Mono, monospace' }}>CLEARED</span>
            )}
          </div>
          <p className="text-base italic leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Crimson Pro, serif' }}>
            {currentRoom.description}
          </p>
        </div>

        {/* Phase content */}
        {phase === 'exploring' && (
          <div className="space-y-3">
            {currentRoom.type === 'combat' && currentRoom.enemy && (
              <div className="rounded border p-4 space-y-2" style={{ borderColor: '#c0392b25' }}>
                <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#c0392b' }}>ENEMY</p>
                <p className="font-display text-lg" style={{ color: '#e0e0f8' }}>{currentRoom.enemy.name}</p>
                <p className="text-sm" style={{ color: '#6b6b8a' }}>{currentRoom.enemy.description}</p>
                <div className="flex gap-4 text-xs" style={{ fontFamily: 'Share Tech Mono, monospace', color: '#4a4a6a' }}>
                  <span>HP: <span style={{ color: '#c0392b' }}>{currentRoom.enemy.hp}</span></span>
                  <span>DMG: <span style={{ color: '#e05a20' }}>{currentRoom.enemy.damage}</span></span>
                  <span>DIFFICULTY: <span style={{ color: '#c49a28' }}>{Math.round(currentRoom.enemy.difficulty * 100)}%</span></span>
                </div>
              </div>
            )}
            <button
              onClick={handleEnterRoom}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
              style={{
                borderColor: stratumData.color + '50',
                background: stratumData.color + '0a',
                color: stratumData.color,
              }}
            >
              {currentRoom.type === 'combat' ? 'ENGAGE' :
               currentRoom.type === 'loot' ? 'SEARCH ROOM' :
               currentRoom.type === 'rest' ? 'REST HERE' :
               currentRoom.type === 'hazard' ? 'NAVIGATE HAZARD' : 'ENTER'}
            </button>
          </div>
        )}

        {phase === 'combat' && currentRoom.enemy && (
          <div className="space-y-4">
            {/* Enemy HP */}
            <div className="rounded border p-3" style={{ borderColor: '#c0392b25' }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-display text-xs tracking-widest uppercase" style={{ color: '#c0392b' }}>
                  {currentRoom.enemy.name}
                </span>
                <span className="text-xs" style={{ color: '#c0392b', fontFamily: 'Share Tech Mono, monospace' }}>
                  {Math.max(0, enemyHp)}/{currentRoom.enemy.maxHp} HP
                </span>
              </div>
              <div className="h-2 rounded overflow-hidden" style={{ background: '#111122' }}>
                <div
                  className="h-full rounded transition-all duration-300"
                  style={{ width: `${(Math.max(0, enemyHp) / currentRoom.enemy.maxHp) * 100}%`, background: '#c0392b' }}
                />
              </div>
            </div>

            {/* Combat log */}
            {combatLog.length > 0 && (
              <div className="rounded border p-3 space-y-1" style={{ borderColor: '#1c1c35', background: '#0a0a12' }}>
                {combatLog.slice(-3).map((log, i) => (
                  <p key={i} className="text-xs" style={{ color: '#6b6b8a', fontFamily: 'Share Tech Mono, monospace' }}>{log}</p>
                ))}
              </div>
            )}

            {/* Minigame */}
            <div className="rounded border p-5" style={{ borderColor: stratumData.color + '25', background: '#0a0a14' }}>
              <MinigameHost
                type="rhythm"
                difficulty={currentRoom.enemy.difficulty}
                hazardOverrides={activeHazards as never}
                label={`ATTACK — ${currentRoom.enemy.name.toUpperCase()}`}
                onComplete={handleCombatResult}
              />
            </div>

            <button
              onClick={handleFlee}
              className="w-full py-2 rounded border text-xs font-display tracking-widest uppercase"
              style={{ borderColor: '#3a3a5c', color: '#4a4a6a' }}
            >
              FLEE — (Stress +20, HP −10)
            </button>
          </div>
        )}

        {phase === 'loot' && currentRoom.loot && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: '#6b6b8a' }}>You find:</p>
            <div className="space-y-2">
              {currentRoom.loot.map(itemId => {
                const picked = lootPicked.includes(itemId);
                const displayName = itemId.replace(/_item$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <button
                    key={itemId}
                    onClick={() => handlePickLoot(itemId)}
                    disabled={picked}
                    className="w-full text-left rounded border p-3 transition-all disabled:opacity-50"
                    style={{ borderColor: picked ? '#4ec49a30' : '#2a2a4a', background: picked ? '#4ec49a08' : '#0a0a12' }}
                  >
                    <span className="text-sm font-display tracking-widest uppercase text-xs" style={{ color: picked ? '#4ec49a' : '#a0a0c0' }}>
                      {picked ? '✓ ' : '+ '}{displayName}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleNextRoom}
              className="w-full py-2.5 rounded border font-display text-xs tracking-widest uppercase transition-all"
              style={{ borderColor: stratumData.color + '40', color: stratumData.color }}
            >
              CONTINUE
            </button>
          </div>
        )}

        {phase === 'rest' && (
          <div className="space-y-3">
            <div className="rounded border p-4 text-center space-y-2" style={{ borderColor: '#4ec49a25', background: '#4ec49a05' }}>
              <p className="font-display text-sm tracking-widest uppercase" style={{ color: '#4ec49a' }}>REST POINT</p>
              <p className="text-sm" style={{ color: '#6b6b8a' }}>Stress −25 · Stamina fully restored</p>
            </div>
            <button
              onClick={() => {
                changeStress(-25);
                changeStamina(100);
                clearCurrentRoom();
                setPhase('exploring');
                handleNextRoom();
              }}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase"
              style={{ borderColor: '#4ec49a50', background: '#4ec49a08', color: '#4ec49a' }}
            >
              REST AND CONTINUE
            </button>
          </div>
        )}

        {phase === 'hazard' && (
          <div className="space-y-4">
            <div className="rounded border p-4" style={{ borderColor: '#e05a2030', background: '#e05a2008' }}>
              <p className="font-display text-xs tracking-widest uppercase mb-2" style={{ color: '#e05a20' }}>
                HAZARD NAVIGATION — LOCKPICK REQUIRED
              </p>
              <p className="text-sm" style={{ color: '#8888aa' }}>
                You must navigate past a hazardous mechanism. A failed pick means damage and stress.
              </p>
            </div>
            <div className="rounded border p-5" style={{ borderColor: '#e05a2025', background: '#0a0a14' }}>
              <MinigameHost
                type="lockpick"
                difficulty={0.4 + run.currentStratum * 0.1}
                hazardOverrides={activeHazards as never}
                label="NAVIGATE HAZARD — LOCKPICK"
                onComplete={(result) => {
                  changeStamina(-result.staminaCost);
                  changeStress(result.stressChange);
                  if (!result.success) {
                    changeHp(-15);
                  }
                  setResultMsg(result.success ? 'Hazard navigated.' : 'You stumbled. HP −15.');
                  clearCurrentRoom();
                  setPhase('result');
                }}
              />
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-3">
            <div className="rounded border p-4 text-center" style={{ borderColor: '#2a2a4a', background: '#0a0a12' }}>
              <p className="text-sm" style={{ color: '#a0a0c0' }}>{resultMsg}</p>
            </div>
            <button
              onClick={handleNextRoom}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase"
              style={{ borderColor: stratumData.color + '40', color: stratumData.color }}
            >
              ADVANCE
            </button>
          </div>
        )}
      </div>

      {showInventory && <InventoryGrid onClose={() => setShowInventory(false)} />}
    </div>
  );
}
