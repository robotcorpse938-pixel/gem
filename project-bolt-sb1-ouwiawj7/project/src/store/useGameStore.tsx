import React, { createContext, useContext, useReducer } from 'react';
import type { RunState, WorldFlags, InventoryItem } from '../types/game';
import { makeItem, SOUL_SHARDS } from '../data/items';
import { STRATA } from '../data/strata';
import { saveRun } from '../lib/persistence';

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultWorldFlags(): WorldFlags {
  return {
    marekVoss: 'alive', sisterAelith: 'alive', gorveth: 'alive',
    wardenDefeated: false, compactHostile: false, unbinderAllied: false,
    aelithTranslationAvailable: false, gorvethSeamOpen: false,
  };
}

function buildStratumRooms() {
  return STRATA.map(s => s.rooms.map(r => ({ ...r, cleared: false })));
}

export function defaultRunState(): RunState {
  const sessionId = generateSessionId();
  const startWeapon = makeItem('iron_dagger', { gridOrigin: [0, 0] });
  const consumable = makeItem('calming_draft', { gridOrigin: [3, 0] });
  return {
    sessionId, screen: 'title', startTime: Date.now(),
    hp: 100, maxHp: 100, stress: 0, stamina: 100, maxStamina: 100, soulDebt: 0,
    currentStratum: 0, currentRoomIndex: 0,
    stratumRooms: buildStratumRooms(),
    worldFlags: defaultWorldFlags(),
    inventory: [startWeapon, consumable],
    equippedWeaponId: startWeapon.instanceId,
    wardenPhase: 0, wardenPhaseCleared: [false, false, false, false],
    outcome: null, runStartMs: Date.now(),
  };
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function findFreeCell(inventory: InventoryItem[]): [number, number] | null {
  const occ: Record<string, boolean> = {};
  inventory.forEach(i => {
    if (!i.gridOrigin) return;
    i.footprint.forEach(([dc, dr]) => { occ[`${i.gridOrigin![0]+dc},${i.gridOrigin![1]+dr}`] = true; });
  });
  for (let r = 0; r < 12; r++) for (let c = 0; c < 10; c++) if (!occ[`${c},${r}`]) return [c, r];
  return null;
}

// ─── Store interface (flat, mirrors old Zustand API) ─────────────────────────

export interface GameStore {
  run: RunState;
  saving: boolean;
  setScreen: (screen: RunState['screen']) => void;
  changeHp: (delta: number) => void;
  changeStress: (delta: number) => void;
  changeStamina: (delta: number) => void;
  changeSoulDebt: (delta: number) => void;
  setStratum: (index: number) => void;
  setRoomIndex: (index: number) => void;
  clearCurrentRoom: () => void;
  getActiveHazards: () => string[];
  applyFlagEffect: (effect: string) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (instanceId: string) => void;
  equipWeapon: (instanceId: string) => void;
  useConsumable: (instanceId: string) => void;
  slotShard: (weaponId: string, slot: number, shardId: string) => void;
  clearWardenPhase: (phase: number) => void;
  startNewRun: () => void;
  endRun: (outcome: RunState['outcome']) => void;
  persistSave: () => void;
  loadSave: (state: RunState) => void;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_SCREEN'; screen: RunState['screen'] }
  | { type: 'CHANGE_HP'; delta: number }
  | { type: 'CHANGE_STRESS'; delta: number }
  | { type: 'CHANGE_STAMINA'; delta: number }
  | { type: 'CHANGE_SOUL_DEBT'; delta: number }
  | { type: 'SET_STRATUM'; index: number }
  | { type: 'SET_ROOM_INDEX'; index: number }
  | { type: 'CLEAR_CURRENT_ROOM' }
  | { type: 'APPLY_FLAG_EFFECT'; effect: string }
  | { type: 'ADD_ITEM'; item: InventoryItem }
  | { type: 'REMOVE_ITEM'; instanceId: string }
  | { type: 'EQUIP_WEAPON'; instanceId: string }
  | { type: 'USE_CONSUMABLE'; instanceId: string }
  | { type: 'SLOT_SHARD'; weaponId: string; slot: number; shardId: string }
  | { type: 'CLEAR_WARDEN_PHASE'; phase: number }
  | { type: 'NEW_RUN' }
  | { type: 'END_RUN'; outcome: RunState['outcome'] }
  | { type: 'LOAD_SAVE'; state: RunState };

function runReducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen };
    case 'CHANGE_HP': return { ...state, hp: clamp(state.hp + action.delta, 0, state.maxHp) };
    case 'CHANGE_STRESS': return { ...state, stress: clamp(state.stress + action.delta, 0, 100) };
    case 'CHANGE_STAMINA': return { ...state, stamina: clamp(state.stamina + action.delta, 0, state.maxStamina) };
    case 'CHANGE_SOUL_DEBT': return { ...state, soulDebt: Math.max(0, state.soulDebt + action.delta) };
    case 'SET_STRATUM': return { ...state, currentStratum: action.index, currentRoomIndex: 0 };
    case 'SET_ROOM_INDEX': return { ...state, currentRoomIndex: action.index };
    case 'CLEAR_CURRENT_ROOM': {
      const rooms = state.stratumRooms.map((stratum, si) =>
        stratum.map((room, ri) =>
          si === state.currentStratum && ri === state.currentRoomIndex ? { ...room, cleared: true } : room
        )
      );
      return { ...state, stratumRooms: rooms };
    }
    case 'APPLY_FLAG_EFFECT': {
      const flags = { ...state.worldFlags };
      let inventory = [...state.inventory];
      action.effect.split(',').forEach(part => {
        const [key, value] = part.trim().split('=');
        if (key === 'giveCompactSeal') {
          if (!inventory.some(i => i.id === 'compact_seal')) {
            const seal = makeItem('compact_seal', { gridOrigin: findFreeCell(inventory) });
            inventory = [...inventory, seal];
          }
        } else if (key in flags) {
          (flags as Record<string, unknown>)[key] = value === 'true' ? true : value === 'false' ? false : value;
        }
      });
      return { ...state, worldFlags: flags, inventory };
    }
    case 'ADD_ITEM': return { ...state, inventory: [...state.inventory, action.item] };
    case 'REMOVE_ITEM': return {
      ...state,
      inventory: state.inventory.filter(i => i.instanceId !== action.instanceId),
      equippedWeaponId: state.equippedWeaponId === action.instanceId ? null : state.equippedWeaponId,
    };
    case 'EQUIP_WEAPON': return { ...state, equippedWeaponId: action.instanceId };
    case 'USE_CONSUMABLE': {
      const item = state.inventory.find(i => i.instanceId === action.instanceId);
      if (!item) return state;
      return {
        ...state,
        stress: item.stats.stressReduction ? clamp(state.stress - item.stats.stressReduction, 0, 100) : state.stress,
        stamina: item.stats.staminaRestore ? clamp(state.stamina + item.stats.staminaRestore, 0, state.maxStamina) : state.stamina,
        hp: item.stats.hpRestore ? clamp(state.hp + item.stats.hpRestore, 0, state.maxHp) : state.hp,
        inventory: state.inventory.filter(i => i.instanceId !== action.instanceId),
      };
    }
    case 'SLOT_SHARD': {
      const shard = state.inventory.find(i => i.instanceId === action.shardId);
      if (!shard || shard.type !== 'shard') return state;
      const shardDef = SOUL_SHARDS[shard.id];
      if (!shardDef) return state;
      return {
        ...state,
        inventory: state.inventory
          .map(item => {
            if (item.instanceId !== action.weaponId) return item;
            const newShards = [...item.equippedShards];
            newShards[action.slot] = shardDef;
            return { ...item, equippedShards: newShards };
          })
          .filter(i => i.instanceId !== action.shardId),
      };
    }
    case 'CLEAR_WARDEN_PHASE': {
      const cleared = [...state.wardenPhaseCleared];
      cleared[action.phase] = true;
      return { ...state, wardenPhaseCleared: cleared, wardenPhase: action.phase + 1 };
    }
    case 'NEW_RUN': return defaultRunState();
    case 'END_RUN': return { ...state, outcome: action.outcome, screen: 'ending' };
    case 'LOAD_SAVE': return action.state;
    default: return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const GameContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [run, dispatch] = useReducer(runReducer, undefined, defaultRunState);
  const [saving, setSaving] = React.useState(false);
  const runRef = React.useRef(run);
  runRef.current = run;

  React.useEffect(() => {
    if (run.screen === 'title') return;
    setSaving(true);
    saveRun(run).finally(() => setSaving(false));
  }, [run]);

  const store: GameStore = React.useMemo(() => ({
    run, saving,
    setScreen: (screen) => dispatch({ type: 'SET_SCREEN', screen }),
    changeHp: (delta) => dispatch({ type: 'CHANGE_HP', delta }),
    changeStress: (delta) => dispatch({ type: 'CHANGE_STRESS', delta }),
    changeStamina: (delta) => dispatch({ type: 'CHANGE_STAMINA', delta }),
    changeSoulDebt: (delta) => dispatch({ type: 'CHANGE_SOUL_DEBT', delta }),
    setStratum: (index) => dispatch({ type: 'SET_STRATUM', index }),
    setRoomIndex: (index) => dispatch({ type: 'SET_ROOM_INDEX', index }),
    clearCurrentRoom: () => dispatch({ type: 'CLEAR_CURRENT_ROOM' }),
    getActiveHazards: () => {
      const r = runRef.current;
      if (r.currentStratum < 0 || r.currentStratum >= r.stratumRooms.length) return [];
      const stratum = STRATA[r.currentStratum];
      const room = r.stratumRooms[r.currentStratum]?.[r.currentRoomIndex];
      return Array.from(new Set([...stratum.ambientHazards, ...(room?.hazards ?? [])]));
    },
    applyFlagEffect: (effect) => dispatch({ type: 'APPLY_FLAG_EFFECT', effect }),
    addItem: (item) => dispatch({ type: 'ADD_ITEM', item }),
    removeItem: (instanceId) => dispatch({ type: 'REMOVE_ITEM', instanceId }),
    equipWeapon: (instanceId) => dispatch({ type: 'EQUIP_WEAPON', instanceId }),
    useConsumable: (instanceId) => dispatch({ type: 'USE_CONSUMABLE', instanceId }),
    slotShard: (weaponId, slot, shardId) => dispatch({ type: 'SLOT_SHARD', weaponId, slot, shardId }),
    clearWardenPhase: (phase) => dispatch({ type: 'CLEAR_WARDEN_PHASE', phase }),
    startNewRun: () => dispatch({ type: 'NEW_RUN' }),
    endRun: (outcome) => dispatch({ type: 'END_RUN', outcome }),
    persistSave: () => { saveRun(runRef.current); },
    loadSave: (state) => dispatch({ type: 'LOAD_SAVE', state }),
  }), [run, saving]);

  return <GameContext.Provider value={store}>{children}</GameContext.Provider>;
}

// ─── useGameStore (selector hook, same API as Zustand) ───────────────────────

export function useGameStore<T>(selector: (store: GameStore) => T): T {
  const store = useContext(GameContext);
  if (!store) throw new Error('useGameStore must be inside GameProvider');
  return selector(store);
}

// Legacy static .getState() for the one place in BossScreen that uses it
useGameStore.getState = (): GameStore => {
  throw new Error('useGameStore.getState() not available in Context mode — use the hook');
};

export function getEquippedWeapon(run: RunState) {
  if (!run.equippedWeaponId) return null;
  return run.inventory.find(i => i.instanceId === run.equippedWeaponId) ?? null;
}
