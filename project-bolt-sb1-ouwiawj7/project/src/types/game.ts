export type Screen = 'title' | 'hub' | 'dungeon' | 'boss' | 'ending';

export type NPCState = 'alive' | 'dead' | 'hostile' | 'allied';
export type Outcome = 'victory' | 'death' | 'damnation';

export interface WorldFlags {
  marekVoss: NPCState;
  sisterAelith: NPCState;
  gorveth: NPCState;
  wardenDefeated: boolean;
  compactHostile: boolean;
  unbinderAllied: boolean;
  aelithTranslationAvailable: boolean;
  gorvethSeamOpen: boolean;
}

export interface SoulShard {
  id: string;
  name: string;
  type: 'velocity' | 'precision' | 'leech' | 'tremor' | 'hollow';
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'unique';
  color: string;
}

export interface InventoryItem {
  id: string;
  instanceId: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'shard' | 'key';
  footprint: [number, number][]; // [col, row] offsets
  gridOrigin: [number, number] | null;
  shardSlots: number;
  equippedShards: (SoulShard | null)[];
  stats: Record<string, number>;
  description: string;
  tainted: boolean;
  color: string;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  damage: number;
  stressOnHit: number;
  difficulty: number; // 0-1
  staminaCost: number;
  souldDebtOnKill: number;
  lootTable: string[];
}

export interface Room {
  id: string;
  type: 'combat' | 'loot' | 'npc' | 'rest' | 'hazard' | 'boss_approach';
  title: string;
  description: string;
  enemy?: Enemy;
  loot?: string[]; // item ids
  npcId?: string;
  hazards: HazardType[];
  cleared: boolean;
  stressOnEnter?: number;
}

export interface Stratum {
  id: number;
  name: string;
  description: string;
  ambientHazards: HazardType[];
  rooms: Room[];
  color: string;
}

export type HazardType = 'tremor' | 'noise' | 'darkness' | 'fear' | 'time_pressure' | 'wet';

export interface RunState {
  sessionId: string;
  screen: Screen;
  startTime: number;

  // Player resources
  hp: number;
  maxHp: number;
  stress: number;
  stamina: number;
  maxStamina: number;
  soulDebt: number;

  // Position
  currentStratum: number;
  currentRoomIndex: number;
  stratumRooms: Room[][];

  // World
  worldFlags: WorldFlags;

  // Inventory
  inventory: InventoryItem[];
  equippedWeaponId: string | null;

  // Boss
  wardenPhase: number;
  wardenPhaseCleared: boolean[];

  // Meta
  outcome: Outcome | null;
  runStartMs: number;
}
