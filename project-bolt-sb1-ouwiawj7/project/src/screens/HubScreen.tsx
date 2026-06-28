import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { marekVossDialogue, sisterAelithDialogue, gorvethDialogue } from '../data/npcs';
import { DialogueBox } from '../components/dialogue/DialogueBox';
import { InventoryGrid } from '../components/inventory/InventoryGrid';
import { makeItem, makeShardItem } from '../data/items';

const NPC_INFO = {
  marekVoss: {
    name: 'Marek Voss',
    title: 'Compact Inquisitor, Second Rank',
    color: '#c49a28',
    description: 'The Compact\'s representative in Ashfeld. Provides contracts and the seal to Stratum 3. Watch him carefully.',
    location: 'The Compact Outpost — Upper District',
  },
  sisterAelith: {
    name: 'Sister Aelith',
    title: 'Hollow Scholar, Former Compact Theologian',
    color: '#68a8e8',
    description: 'The only person alive who can read the deep sigil-language. Lives in self-imposed exile in the lower district.',
    location: 'The Lower Archive — Below the Seep',
  },
  gorveth: {
    name: 'Gorveth the Unbound',
    title: 'Unbinder Cell Leader',
    color: '#4ec49a',
    description: 'Commands the Unbinder cell in Ashfeld. Controls access to the Hollow Seam. Does not forgive easily.',
    location: 'The Lower District — Unmarked Door',
  },
};

const VENDORS = [
  { id: 'alchemist', name: 'The Alchemist', color: '#88b84a', description: 'Sells consumables and containment equipment.' },
  { id: 'blacksmith', name: 'The Armorer', color: '#6b6b8a', description: 'Basic weapons and shard insertion services.' },
];

export function HubScreen() {
  const run = useGameStore(s => s.run);
  const setScreen = useGameStore(s => s.setScreen);
  const addItem = useGameStore(s => s.addItem);
  const changeStress = useGameStore(s => s.changeStress);
  const changeStamina = useGameStore(s => s.changeStamina);

  const [activeDialogue, setActiveDialogue] = useState<'marekVoss' | 'sisterAelith' | 'gorveth' | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showVendor, setShowVendor] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleRest = () => {
    changeStress(-20);
    changeStamina(40);
    notify('You rested at the inn. Stress reduced. Stamina restored.');
  };

  const hasSeal = run.inventory.some(i => i.id === 'compact_seal');
  const canDescend = hasSeal || run.worldFlags.marekVoss === 'allied';

  const handleDescend = () => {
    if (!canDescend) {
      notify('You need Voss\'s Compact Seal to open the Stratum 3 gate.');
      return;
    }
    setScreen('dungeon');
  };

  const handleBuyItem = (itemId: string, _cost: string) => {
    const item = makeItem(itemId, { gridOrigin: null });
    // Auto-place in inventory
    const allItems = run.inventory;
    let placed = false;
    for (let r = 0; r < 12 && !placed; r++) {
      for (let c = 0; c < 10 && !placed; c++) {
        const origin: [number, number] = [c, r];
        const footprint = item.footprint;
        const occ: Record<string, boolean> = {};
        allItems.forEach(i => {
          if (!i.gridOrigin) return;
          i.footprint.forEach(([dc, dr]) => {
            occ[`${i.gridOrigin![0]+dc},${i.gridOrigin![1]+dr}`] = true;
          });
        });
        const fits = footprint.every(([dc, dr]) => {
          const cc = c + dc; const rr = r + dr;
          return cc >= 0 && cc < 10 && rr >= 0 && rr < 12 && !occ[`${cc},${rr}`];
        });
        if (fits) { item.gridOrigin = origin; placed = true; }
      }
    }
    addItem(item);
    notify(`Purchased: ${item.name}`);
    setShowVendor(null);
  };

  const handleBuyShard = (shardId: string) => {
    const item = makeShardItem(shardId);
    item.gridOrigin = null;
    // Try to find free 1x1 cell
    const occ: Record<string, boolean> = {};
    run.inventory.forEach(i => {
      if (!i.gridOrigin) return;
      i.footprint.forEach(([dc, dr]) => {
        occ[`${i.gridOrigin![0]+dc},${i.gridOrigin![1]+dr}`] = true;
      });
    });
    for (let r = 0; r < 12 && !item.gridOrigin; r++) {
      for (let c = 0; c < 10 && !item.gridOrigin; c++) {
        if (!occ[`${c},${r}`]) item.gridOrigin = [c, r];
      }
    }
    addItem(item);
    notify(`Acquired: ${item.name}`);
    setShowVendor(null);
  };

  const dialogueTree = activeDialogue === 'marekVoss' ? marekVossDialogue
    : activeDialogue === 'sisterAelith' ? sisterAelithDialogue
    : activeDialogue === 'gorveth' ? gorvethDialogue : null;

  return (
    <div className="min-h-screen" style={{ background: '#040406' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#1c1c35', background: '#08080f' }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-base tracking-widest uppercase" style={{ color: '#c49a28' }}>ASHFELD</h1>
            <p className="text-xs" style={{ color: '#3a3a5c', fontFamily: 'Share Tech Mono, monospace' }}>THE BLIGHTED HUB — LAST SAFE GROUND</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInventory(true)}
              className="px-3 py-1.5 rounded border text-xs font-display tracking-widest uppercase transition-all hover:bg-white/5"
              style={{ borderColor: '#2a2a4a', color: '#6b6b8a' }}
            >
              INVENTORY
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 pb-24 space-y-6">

        {/* Atmosphere text */}
        <div className="rounded border p-4" style={{ borderColor: '#1c1c35', background: '#08080f' }}>
          <p className="text-sm italic leading-relaxed" style={{ color: '#6b6b8a', fontFamily: 'Crimson Pro, serif' }}>
            Ashfeld breathes. The Seep bleeds brackish light through the fissure at dusk — a slow, attentive glow that watches the city the way a wound watches a body. The lower districts are quiet. Three more merchants closed their stalls last week. Nobody asks where they went.
          </p>
        </div>

        {/* NPCs */}
        <section>
          <h2 className="font-display text-xs tracking-widest uppercase mb-3" style={{ color: '#4a4a6a' }}>
            PERSONS OF INTEREST
          </h2>
          <div className="space-y-2">
            {(Object.keys(NPC_INFO) as (keyof typeof NPC_INFO)[]).map(npcId => {
              const info = NPC_INFO[npcId];
              const state = run.worldFlags[npcId];
              const isHostile = state === 'hostile';
              const isDead = state === 'dead';
              const isAllied = state === 'allied';
              return (
                <button
                  key={npcId}
                  onClick={() => !isDead && !isHostile && setActiveDialogue(npcId)}
                  disabled={isDead || isHostile}
                  className="w-full text-left rounded border p-4 transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: info.color + (isAllied ? '60' : '25'), background: isAllied ? info.color + '08' : '#08080f' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm" style={{ color: info.color }}>{info.name}</span>
                        {isAllied && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#4ec49a20', color: '#4ec49a', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>ALLIED</span>}
                        {isDead && <span className="text-xs" style={{ color: '#c0392b', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>DEAD</span>}
                        {isHostile && <span className="text-xs" style={{ color: '#c0392b', fontFamily: 'Share Tech Mono, monospace', fontSize: '10px' }}>HOSTILE</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#4a4a6a', fontFamily: 'Share Tech Mono, monospace' }}>{info.title}</p>
                      <p className="text-sm mt-1 leading-snug" style={{ color: '#6b6b8a' }}>{info.description}</p>
                    </div>
                    {!isDead && !isHostile && (
                      <span className="text-xs flex-shrink-0" style={{ color: info.color + '60', fontFamily: 'Share Tech Mono, monospace' }}>SPEAK →</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Services */}
        <section>
          <h2 className="font-display text-xs tracking-widest uppercase mb-3" style={{ color: '#4a4a6a' }}>
            SERVICES
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {VENDORS.map(v => (
              <button
                key={v.id}
                onClick={() => setShowVendor(v.id)}
                className="text-left rounded border p-3 transition-all hover:bg-white/5"
                style={{ borderColor: v.color + '30', background: '#08080f' }}
              >
                <p className="font-display text-xs tracking-widest uppercase" style={{ color: v.color }}>{v.name}</p>
                <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>{v.description}</p>
              </button>
            ))}
            <button
              onClick={handleRest}
              className="text-left rounded border p-3 transition-all hover:bg-white/5"
              style={{ borderColor: '#507830' + '30', background: '#08080f' }}
            >
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: '#88b84a' }}>INN — REST</p>
              <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>Reduce stress −20. Restore stamina +40.</p>
            </button>
          </div>
        </section>

        {/* Descent */}
        <section>
          <h2 className="font-display text-xs tracking-widest uppercase mb-3" style={{ color: '#4a4a6a' }}>
            THE ABYSS
          </h2>
          <div className="rounded border p-4 space-y-3" style={{ borderColor: '#c0392b20', background: '#08080f' }}>
            <p className="text-sm italic" style={{ color: '#6b6b8a', fontFamily: 'Crimson Pro, serif' }}>
              Three strata lie between you and the Warden of the Deep. The gate to Stratum 3 requires the Compact Seal — obtain it from Voss, or find another way through.
            </p>
            {!canDescend && (
              <p className="text-xs" style={{ color: '#c0392b', fontFamily: 'Share Tech Mono, monospace' }}>
                BLOCKED — Requires Compact Seal or Voss's cooperation
              </p>
            )}
            <button
              onClick={handleDescend}
              className="w-full py-3 rounded border font-display text-sm tracking-widest uppercase transition-all"
              style={{
                borderColor: canDescend ? '#c0392b60' : '#2a2a4a',
                background: canDescend ? '#c0392b10' : 'transparent',
                color: canDescend ? '#c0392b' : '#3a3a5c',
              }}
            >
              {canDescend ? 'DESCEND INTO THE ABYSS' : 'GATE LOCKED — NEED SEAL'}
            </button>
          </div>
        </section>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded border text-sm font-display tracking-widest"
          style={{ background: '#08080f', borderColor: '#c49a2860', color: '#c49a28' }}
        >
          {notification}
        </div>
      )}

      {/* Dialogue */}
      {dialogueTree && (
        <DialogueBox tree={dialogueTree} onClose={() => setActiveDialogue(null)} />
      )}

      {/* Inventory */}
      {showInventory && <InventoryGrid onClose={() => setShowInventory(false)} />}

      {/* Vendor modal */}
      {showVendor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(4,4,6,0.9)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowVendor(null); }}
        >
          <div className="rounded border p-6 space-y-4 w-full max-w-sm" style={{ background: '#08080f', borderColor: '#2a2a4a' }}>
            <h3 className="font-display text-sm tracking-widest uppercase" style={{ color: '#c49a28' }}>
              {showVendor === 'alchemist' ? 'THE ALCHEMIST' : 'THE ARMORER'}
            </h3>
            {showVendor === 'alchemist' && (
              <div className="space-y-2">
                <VendorItem name="Calming Draft" desc="Stress −30" color="#4ec49a" onClick={() => handleBuyItem('calming_draft', '—')} />
                <VendorItem name="Stamina Root" desc="Stamina +40" color="#88b84a" onClick={() => handleBuyItem('stamina_root', '—')} />
              </div>
            )}
            {showVendor === 'blacksmith' && (
              <div className="space-y-2">
                <VendorItem name="Soul Blade" desc="Weapon — 1 shard slot" color="#c49a28" onClick={() => handleBuyItem('soul_blade', '—')} />
                <VendorItem name="Velocity Shard" desc="Bar speed +35%" color="#e05a20" onClick={() => handleBuyShard('velocity')} />
                <VendorItem name="Precision Shard" desc="Window shrinks, perfect zone bonus" color="#68a8e8" onClick={() => handleBuyShard('precision')} />
                <VendorItem name="Tremor Shard" desc="Oscillating hit window" color="#507830" onClick={() => handleBuyShard('tremor_shard')} />
              </div>
            )}
            <button onClick={() => setShowVendor(null)} className="w-full py-2 text-xs font-display tracking-widest" style={{ color: '#4a4a6a' }}>
              LEAVE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorItem({ name, desc, color, onClick }: { name: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded border p-3 transition-all hover:bg-white/5"
      style={{ borderColor: color + '30', background: '#0a0a12' }}
    >
      <p className="font-display text-xs tracking-widest uppercase" style={{ color }}>{name}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6b6b8a' }}>{desc} — Free (demo)</p>
    </button>
  );
}
