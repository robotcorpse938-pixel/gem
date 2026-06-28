import type { SoulShard, InventoryItem } from '../types/game';

export const SOUL_SHARDS: Record<string, SoulShard> = {
  velocity: {
    id: 'velocity',
    name: 'Velocity Shard',
    type: 'velocity',
    description: 'The rhythm bar moves 35% faster. Window size unchanged — more hits per second, more risk per second.',
    rarity: 'uncommon',
    color: '#e05a20',
  },
  precision: {
    id: 'precision',
    name: 'Precision Shard',
    type: 'precision',
    description: 'Hit window shrinks 40%. A perfect inner zone activates — land it for 2.5x damage.',
    rarity: 'rare',
    color: '#68a8e8',
  },
  leech: {
    id: 'leech',
    name: 'Leech Shard',
    type: 'leech',
    description: 'Successful hits restore 8 stamina. A drain gauge fills passively — if full, the effect reverses.',
    rarity: 'rare',
    color: '#c0392b',
  },
  tremor_shard: {
    id: 'tremor_shard',
    name: 'Tremor Shard',
    type: 'tremor',
    description: 'The hit window oscillates — sometimes wider, sometimes narrower. High variance.',
    rarity: 'common',
    color: '#507830',
  },
  hollow: {
    id: 'hollow',
    name: 'Hollow Shard',
    type: 'hollow',
    description: 'Replaces the rhythm bar with a 2D resonance field. Massive potential. Fatal if misused.',
    rarity: 'unique',
    color: '#8888aa',
  },
};

export const ITEMS: Record<string, Omit<InventoryItem, 'instanceId' | 'gridOrigin' | 'equippedShards'>> = {
  hollow_cleaver: {
    id: 'hollow_cleaver',
    name: 'Hollow Cleaver',
    type: 'weapon',
    footprint: [[0,0],[0,1],[0,2],[0,3],[0,4]],
    shardSlots: 2,
    stats: { damage: 35, staminaCost: 12 },
    description: 'A blade half-dissolved by the Hollow. Cuts what armor cannot stop.',
    tainted: true,
    color: '#8888aa',
  },
  soul_blade: {
    id: 'soul_blade',
    name: 'Soul Blade',
    type: 'weapon',
    footprint: [[0,0],[0,1],[0,2],[0,3]],
    shardSlots: 1,
    stats: { damage: 25, staminaCost: 10 },
    description: 'Standard-issue Compact weapon. Reliable. Untainted.',
    tainted: false,
    color: '#c49a28',
  },
  iron_dagger: {
    id: 'iron_dagger',
    name: 'Iron Dagger',
    type: 'weapon',
    footprint: [[0,0],[0,1],[0,2]],
    shardSlots: 1,
    stats: { damage: 15, staminaCost: 8 },
    description: 'Short and honest. No soul-binding. No complications.',
    tainted: false,
    color: '#6b6b8a',
  },
  calming_draft: {
    id: 'calming_draft',
    name: 'Calming Draft',
    type: 'consumable',
    footprint: [[0,0]],
    shardSlots: 0,
    stats: { stressReduction: 30 },
    description: 'Reduces stress by 30. Tastes of ash and river water.',
    tainted: false,
    color: '#4ec49a',
  },
  stamina_root: {
    id: 'stamina_root',
    name: 'Stamina Root',
    type: 'consumable',
    footprint: [[0,0]],
    shardSlots: 0,
    stats: { staminaRestore: 40 },
    description: 'Chew it. Blink away the bitterness. Keep moving.',
    tainted: false,
    color: '#88b84a',
  },
  lead_box: {
    id: 'lead_box',
    name: 'Lead Containment Box',
    type: 'key',
    footprint: [[0,0],[1,0]],
    shardSlots: 0,
    stats: {},
    description: 'Isolates tainted items. Prevents corruption spread.',
    tainted: false,
    color: '#4a4a6a',
  },
  compact_seal: {
    id: 'compact_seal',
    name: "Voss's Compact Seal",
    type: 'key',
    footprint: [[0,0]],
    shardSlots: 0,
    stats: {},
    description: 'The seal to Stratum 3. Given by Voss — or taken from his body.',
    tainted: false,
    color: '#c49a28',
  },
};

export function makeItem(id: string, overrides: Partial<InventoryItem> = {}): InventoryItem {
  const template = ITEMS[id];
  if (!template) throw new Error(`Unknown item id: ${id}`);
  return {
    ...template,
    instanceId: `${id}_${Math.random().toString(36).slice(2, 9)}`,
    gridOrigin: null,
    equippedShards: Array(template.shardSlots).fill(null),
    ...overrides,
  };
}

export function makeShardItem(shardId: string): InventoryItem {
  const shard = SOUL_SHARDS[shardId];
  if (!shard) throw new Error(`Unknown shard id: ${shardId}`);
  return {
    id: shardId,
    instanceId: `shard_${shardId}_${Math.random().toString(36).slice(2, 9)}`,
    name: shard.name,
    type: 'shard',
    footprint: [[0, 0]],
    gridOrigin: null,
    shardSlots: 0,
    equippedShards: [],
    stats: {},
    description: shard.description,
    tainted: false,
    color: shard.color,
  };
}
