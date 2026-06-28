import { useState } from 'react';
import type { InventoryItem } from '../../types/game';
import { SOUL_SHARDS } from '../../data/items';
import { useGameStore } from '../../store/useGameStore';

const GRID_COLS = 10;
const GRID_ROWS = 12;
const CELL_SIZE = 36;

function buildOccupancyMap(items: InventoryItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items) {
    if (!item.gridOrigin) continue;
    const [oc, or_] = item.gridOrigin;
    for (const [dc, dr] of item.footprint) {
      map[`${oc + dc},${or_ + dr}`] = item.instanceId;
    }
  }
  return map;
}

interface Props {
  onClose: () => void;
}

export function InventoryGrid({ onClose }: Props) {
  const run = useGameStore(s => s.run);
  const equipWeapon = useGameStore(s => s.equipWeapon);
  const useConsumable = useGameStore(s => s.useConsumable);
  const slotShard = useGameStore(s => s.slotShard);

  const [selected, setSelected] = useState<string | null>(null);
  const [, setShardTarget] = useState<{ weaponId: string; slotIndex: number } | null>(null);

  const occupancy = buildOccupancyMap(run.inventory.filter(i => i.gridOrigin !== null));
  const selectedItem = run.inventory.find(i => i.instanceId === selected) ?? null;

  const handleCellClick = (c: number, r: number) => {
    const id = occupancy[`${c},${r}`];
    if (!id) { setSelected(null); return; }
    setSelected(prev => prev === id ? null : id);
  };

  const handleUseItem = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'weapon') {
      equipWeapon(selectedItem.instanceId);
      setSelected(null);
    } else if (selectedItem.type === 'consumable') {
      useConsumable(selectedItem.instanceId);
      setSelected(null);
    } else if (selectedItem.type === 'shard') {
      // Start shard-slotting mode — pick weapon
      setShardTarget(null);
    }
  };

  const handleSlotShard = (weaponId: string, slotIdx: number) => {
    if (!selectedItem || selectedItem.type !== 'shard') return;
    slotShard(weaponId, slotIdx, selectedItem.instanceId);
    setSelected(null);
    setShardTarget(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(4,4,6,0.92)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative rounded border overflow-hidden flex flex-col"
        style={{
          background: '#08080f',
          borderColor: '#2a2a4a',
          width: 'min(95vw, 820px)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#1c1c35' }}>
          <h2 className="font-display text-sm tracking-widest uppercase" style={{ color: '#c49a28' }}>
            INVENTORY — SOUL BINDINGS
          </h2>
          <button onClick={onClose} className="text-xs font-display tracking-widest" style={{ color: '#4a4a6a' }}>
            [ESC] CLOSE
          </button>
        </div>

        <div className="flex overflow-auto">
          {/* Grid */}
          <div className="p-4 flex-shrink-0">
            <div
              className="relative border rounded overflow-hidden"
              style={{
                borderColor: '#1c1c35',
                background: '#0a0a12',
                width: GRID_COLS * CELL_SIZE,
                height: GRID_ROWS * CELL_SIZE,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: GRID_ROWS }).map((_, r) =>
                Array.from({ length: GRID_COLS }).map((_, c) => (
                  <div
                    key={`${c}-${r}`}
                    onClick={() => handleCellClick(c, r)}
                    className="absolute border cursor-pointer hover:bg-white/5 transition-colors"
                    style={{
                      left: c * CELL_SIZE,
                      top: r * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderColor: '#111122',
                    }}
                  />
                ))
              )}

              {/* Items */}
              {run.inventory.filter(i => i.gridOrigin).map(item => {
                const [oc, or_] = item.gridOrigin!;
                const maxC = Math.max(...item.footprint.map(([dc]) => dc));
                const maxR = Math.max(...item.footprint.map(([, dr]) => dr));
                const isSelected = selected === item.instanceId;
                const isEquipped = run.equippedWeaponId === item.instanceId;
                return (
                  <div
                    key={item.instanceId}
                    onClick={() => setSelected(prev => prev === item.instanceId ? null : item.instanceId)}
                    className="absolute rounded cursor-pointer transition-all"
                    style={{
                      left: oc * CELL_SIZE + 2,
                      top: or_ * CELL_SIZE + 2,
                      width: (maxC + 1) * CELL_SIZE - 4,
                      height: (maxR + 1) * CELL_SIZE - 4,
                      background: `${item.color}22`,
                      border: `1px solid ${isSelected ? item.color : item.color + '50'}`,
                      boxShadow: isSelected ? `0 0 12px ${item.color}60` : isEquipped ? `0 0 6px ${item.color}30` : 'none',
                    }}
                  >
                    <div className="h-full flex flex-col items-center justify-center p-0.5">
                      <p className="text-center leading-tight" style={{
                        color: item.color,
                        fontSize: '9px',
                        fontFamily: 'Share Tech Mono, monospace',
                        wordBreak: 'break-word',
                      }}>
                        {item.name.replace(' Shard', '').replace(' Blade', '').replace(' Dagger', '')}
                      </p>
                      {isEquipped && (
                        <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#4ec49a' }} />
                      )}
                      {item.tainted && (
                        <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#8888aa' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-2 text-center" style={{ color: '#2a2a4a', fontFamily: 'Share Tech Mono, monospace' }}>
              {GRID_COLS}×{GRID_ROWS} GRID — CLICK ITEM TO SELECT
            </p>
          </div>

          {/* Item Detail Panel */}
          <div className="flex-1 p-4 min-w-48 border-l" style={{ borderColor: '#1c1c35' }}>
            {selectedItem ? (
              <div className="space-y-3">
                <div>
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: selectedItem.color }}>
                    {selectedItem.type.toUpperCase()}
                  </p>
                  <h3 className="font-display text-lg" style={{ color: '#e0e0f8' }}>{selectedItem.name}</h3>
                  {selectedItem.tainted && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#8888aa20', color: '#8888aa', fontFamily: 'Share Tech Mono, monospace' }}>
                      HOLLOW-TAINTED
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed" style={{ color: '#8888aa' }}>{selectedItem.description}</p>

                {/* Stats */}
                {Object.entries(selectedItem.stats).filter(([, v]) => v).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(selectedItem.stats).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                        <span style={{ color: '#4a4a6a' }}>{k.toUpperCase()}</span>
                        <span style={{ color: selectedItem.color }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Shard slots for weapons */}
                {selectedItem.type === 'weapon' && selectedItem.shardSlots > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-display tracking-widest uppercase" style={{ color: '#4a4a6a' }}>SOUL SHARD SLOTS</p>
                    {Array.from({ length: selectedItem.shardSlots }).map((_, i) => {
                      const shard = selectedItem.equippedShards[i];
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded px-2 py-1.5 border cursor-pointer hover:opacity-80"
                          style={{ borderColor: shard ? shard.color + '40' : '#2a2a4a', background: shard ? shard.color + '10' : '#0a0a12' }}
                          onClick={() => handleSlotShard(selectedItem.instanceId, i)}
                        >
                          <div
                            className="w-3 h-3 flex-shrink-0"
                            style={{
                              background: shard ? shard.color : '#2a2a4a',
                              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                            }}
                          />
                          <span className="text-xs" style={{ color: shard ? shard.color : '#3a3a5c', fontFamily: 'Share Tech Mono, monospace' }}>
                            {shard ? shard.name : `SLOT ${i + 1} — EMPTY`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Shard description */}
                {selectedItem.type === 'shard' && (
                  <div className="rounded p-2 border text-xs" style={{ borderColor: selectedItem.color + '30', background: selectedItem.color + '08', color: '#a0a0c0' }}>
                    {SOUL_SHARDS[selectedItem.id]?.description}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {selectedItem.type === 'weapon' && (
                    <button
                      onClick={handleUseItem}
                      className="w-full py-2 rounded border font-display text-xs tracking-widest uppercase transition-all"
                      style={{
                        borderColor: run.equippedWeaponId === selectedItem.instanceId ? '#4ec49a50' : selectedItem.color + '40',
                        background: run.equippedWeaponId === selectedItem.instanceId ? '#4ec49a10' : 'transparent',
                        color: run.equippedWeaponId === selectedItem.instanceId ? '#4ec49a' : selectedItem.color,
                      }}
                    >
                      {run.equippedWeaponId === selectedItem.instanceId ? 'EQUIPPED' : 'EQUIP WEAPON'}
                    </button>
                  )}
                  {selectedItem.type === 'consumable' && (
                    <button
                      onClick={handleUseItem}
                      className="w-full py-2 rounded border font-display text-xs tracking-widest uppercase transition-all"
                      style={{ borderColor: '#4ec49a40', background: '#4ec49a10', color: '#4ec49a' }}
                    >
                      USE ITEM
                    </button>
                  )}
                  {selectedItem.type === 'shard' && (
                    <p className="text-xs text-center" style={{ color: '#4a4a6a' }}>Select a weapon socket to slot this shard</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center" style={{ color: '#2a2a4a' }}>
                <p className="font-display text-xs tracking-widest uppercase mb-2">NO ITEM SELECTED</p>
                <p className="text-xs">Click an item in the grid to inspect it</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
