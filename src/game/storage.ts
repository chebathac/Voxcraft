import { BlockType, DimensionId } from './types';

// LocalStorage Keys
export const STORAGE_KEYS = {
  HOTBAR: 'voxelcraft_player_hotbar',
  INVENTORY: 'voxelcraft_player_inventory',
  WORLD_DELTAS: 'voxelcraft_world_deltas',
  PLAYER_META: 'voxelcraft_player_meta',
  MY_MAPS: 'voxelcraft_my_maps',
  CONTROL_SETTINGS: 'voxelcraft_control_settings',
  UNLOCKED_WEAPONS: 'voxelcraft_unlocked_weapons',
  EQUIPPED_WEAPON: 'voxelcraft_equipped_weapon',
  RESOURCE_BAG: 'voxelcraft_resource_bag',
  SURVIVAL_V2: 'voxelcraft_survival_v2',
  PLAYER_PROGRESS: 'voxelcraft_player_progress',
  ACCOUNT_PROGRESSION: 'voxelcraft_account_progression_v1',
} as const;

export type ControlScheme = 'joystick' | 'dpad' | 'swipe';
export type GraphicsQuality = 'smooth' | 'balanced' | 'high';

export interface ControlSettings {
  scheme: ControlScheme;
  lookSensitivity: number;
  autoJump: boolean;
  tapScreenToBuild: boolean;
  graphicsQuality: GraphicsQuality;
}

export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  scheme: 'joystick',
  lookSensitivity: 1.0,
  autoJump: true,
  tapScreenToBuild: true,
  graphicsQuality: 'balanced',
};

export interface SavedCustomMap {
  code: string;
  name: string;
  seed: number;
  createdAt: number;
}

export interface ActiveMapSession {
  code: string; // 'COMMON' or 6-char map code
  name: string;
  seed: number;
  isCommon: boolean;
}

// Default 9 Hotbar slots
export const DEFAULT_HOTBAR: BlockType[] = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.PLANKS_OAK,
  BlockType.COBBLESTONE,
  BlockType.BRICK,
  BlockType.GLASS,
  BlockType.WOOD_OAK,
  BlockType.TORCH,
];

// Default 27 Main Inventory slots (3 rows of 9 — no free ores/gems; mine or fight villains!)
export const DEFAULT_INVENTORY: (BlockType | null)[] = [
  // Row 1: Basic Building & Nature
  BlockType.WOOD_CHERRY,
  BlockType.LEAVES_OAK,
  BlockType.LEAVES_CHERRY,
  BlockType.SAND,
  BlockType.SNOW,
  BlockType.PUMPKIN,
  BlockType.BOOKSHELF,
  null,
  null,

  // Row 2: Empty slots reserved for mined ores, gems & loot
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,

  // Row 3: Workstations & Colored Wool
  BlockType.CRAFTING_TABLE,
  BlockType.FURNACE,
  BlockType.WOOL_WHITE,
  BlockType.WOOL_RED,
  BlockType.WOOL_BLUE,
  null,
  null,
  null,
  null,
];

export type ResourceBag = Record<number, number>;

export function ensureSurvivalDefaults(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!localStorage.getItem(STORAGE_KEYS.SURVIVAL_V2)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
      localStorage.setItem(STORAGE_KEYS.UNLOCKED_WEAPONS, JSON.stringify(['hand']));
      localStorage.setItem(STORAGE_KEYS.EQUIPPED_WEAPON, 'hand');
      localStorage.setItem(STORAGE_KEYS.RESOURCE_BAG, JSON.stringify({}));
      localStorage.setItem(STORAGE_KEYS.SURVIVAL_V2, '1');
    }
  } catch (err) {
    console.warn('[Storage] Failed survival migration:', err);
  }
}

export function loadUnlockedWeapons(): string[] {
  if (typeof window === 'undefined') return ['hand'];
  ensureSurvivalDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNLOCKED_WEAPONS);
    if (!raw) return ['hand'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const clean = parsed.filter((w): w is string => typeof w === 'string');
      return clean.includes('hand') ? clean : ['hand', ...clean];
    }
  } catch (err) {
    console.warn('[Storage] Failed to load unlocked weapons:', err);
  }
  return ['hand'];
}

export function saveUnlockedWeapons(weapons: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(['hand', ...weapons]));
    localStorage.setItem(STORAGE_KEYS.UNLOCKED_WEAPONS, JSON.stringify(unique));
  } catch (err) {
    console.warn('[Storage] Failed to save unlocked weapons:', err);
  }
}

export function loadEquippedWeapon(): string {
  if (typeof window === 'undefined') return 'hand';
  ensureSurvivalDefaults();
  try {
    const unlocked = loadUnlockedWeapons();
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPPED_WEAPON);
    if (raw && unlocked.includes(raw)) return raw;
  } catch {
    // Fallback
  }
  return 'hand';
}

export function saveEquippedWeapon(weaponId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPPED_WEAPON, weaponId);
  } catch (err) {
    console.warn('[Storage] Failed to save equipped weapon:', err);
  }
}

export function loadResourceBag(): ResourceBag {
  if (typeof window === 'undefined') return {};
  ensureSurvivalDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESOURCE_BAG);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const out: ResourceBag = {};
      for (const [k, v] of Object.entries(parsed)) {
        const id = Number(k);
        if (Number.isFinite(id) && typeof v === 'number' && v > 0) {
          out[id] = Math.floor(v);
        }
      }
      return out;
    }
  } catch (err) {
    console.warn('[Storage] Failed to load resource bag:', err);
  }
  return {};
}

export function saveResourceBag(bag: ResourceBag): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RESOURCE_BAG, JSON.stringify(bag));
  } catch (err) {
    console.warn('[Storage] Failed to save resource bag:', err);
  }
}

export interface PlayerSavedMeta {
  selectedSlot?: number;
  playerName?: string;
  playerSkin?: string;
  health?: number;
  x?: number;
  y?: number;
  z?: number;
  lastSaved?: number;
}

export interface PlayerProgressStats {
  blocksMined: number;
  oresFound: number;
  mobsDefeated: number;
  playSeconds: number;
}

const DEFAULT_PROGRESS: PlayerProgressStats = {
  blocksMined: 0,
  oresFound: 0,
  mobsDefeated: 0,
  playSeconds: 0,
};

function getProgressStorageKey(roomCode = 'COMMON'): string {
  const clean = roomCode.trim().toUpperCase() || 'COMMON';
  return `${STORAGE_KEYS.PLAYER_PROGRESS}_${clean}`;
}

export function loadPlayerProgress(roomCode = 'COMMON'): PlayerProgressStats {
  if (typeof window === 'undefined') return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(getProgressStorageKey(roomCode));
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      blocksMined: typeof parsed?.blocksMined === 'number' && parsed.blocksMined > 0 ? Math.floor(parsed.blocksMined) : 0,
      oresFound: typeof parsed?.oresFound === 'number' && parsed.oresFound > 0 ? Math.floor(parsed.oresFound) : 0,
      mobsDefeated: typeof parsed?.mobsDefeated === 'number' && parsed.mobsDefeated > 0 ? Math.floor(parsed.mobsDefeated) : 0,
      playSeconds: typeof parsed?.playSeconds === 'number' && parsed.playSeconds > 0 ? Math.floor(parsed.playSeconds) : 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function savePlayerProgress(roomCode: string, stats: PlayerProgressStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getProgressStorageKey(roomCode), JSON.stringify(stats));
  } catch (err) {
    console.warn('[Storage] Failed to save player progress:', err);
  }
}

export function getDeltaStorageKey(roomCode = 'COMMON', dimension: DimensionId = 'overworld'): string {
  const clean = roomCode.trim().toUpperCase() || 'COMMON';
  const base = clean === 'COMMON' ? STORAGE_KEYS.WORLD_DELTAS : `${STORAGE_KEYS.WORLD_DELTAS}_${clean}`;
  return dimension === 'overworld' ? base : `${base}_${dimension.toUpperCase()}`;
}

export interface PersistedAccountState {
  coins: number;
  unlockedEmotes: string[];
  unlockedAchievements: string[];
  toolTier: string;
  armorTier: string;
  toolDurability: number;
  armorDurability: number;
  enchantments: {
    fortune: number;
    fireAspect: number;
    efficiency: number;
    unbreaking: number;
  };
  showAdvancedTooltips: boolean;
}

const DEFAULT_ACCOUNT_STATE: PersistedAccountState = {
  coins: 350,
  unlockedEmotes: ['over_there', 'simple_clap', 'wave', 'the_woodpunch'],
  unlockedAchievements: [],
  toolTier: 'wood',
  armorTier: 'none',
  toolDurability: 59,
  armorDurability: 0,
  enchantments: { fortune: 0, fireAspect: 0, efficiency: 0, unbreaking: 0 },
  showAdvancedTooltips: false,
};

export function loadAccountProgression(): PersistedAccountState {
  if (typeof window === 'undefined') return { ...DEFAULT_ACCOUNT_STATE, enchantments: { ...DEFAULT_ACCOUNT_STATE.enchantments } };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT_PROGRESSION);
    if (!raw) return { ...DEFAULT_ACCOUNT_STATE, enchantments: { ...DEFAULT_ACCOUNT_STATE.enchantments } };
    const parsed = JSON.parse(raw);
    return {
      coins: typeof parsed?.coins === 'number' && parsed.coins >= 0 ? Math.floor(parsed.coins) : DEFAULT_ACCOUNT_STATE.coins,
      unlockedEmotes: Array.isArray(parsed?.unlockedEmotes)
        ? Array.from(new Set([...DEFAULT_ACCOUNT_STATE.unlockedEmotes, ...parsed.unlockedEmotes.filter((x: unknown): x is string => typeof x === 'string')]))
        : [...DEFAULT_ACCOUNT_STATE.unlockedEmotes],
      unlockedAchievements: Array.isArray(parsed?.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((x: unknown): x is string => typeof x === 'string')
        : [],
      toolTier: typeof parsed?.toolTier === 'string' ? parsed.toolTier : 'wood',
      armorTier: typeof parsed?.armorTier === 'string' ? parsed.armorTier : 'none',
      toolDurability: typeof parsed?.toolDurability === 'number' ? Math.max(0, Math.floor(parsed.toolDurability)) : 59,
      armorDurability: typeof parsed?.armorDurability === 'number' ? Math.max(0, Math.floor(parsed.armorDurability)) : 0,
      enchantments: {
        fortune: typeof parsed?.enchantments?.fortune === 'number' ? Math.min(3, Math.max(0, parsed.enchantments.fortune)) : 0,
        fireAspect: typeof parsed?.enchantments?.fireAspect === 'number' ? Math.min(2, Math.max(0, parsed.enchantments.fireAspect)) : 0,
        efficiency: typeof parsed?.enchantments?.efficiency === 'number' ? Math.min(3, Math.max(0, parsed.enchantments.efficiency)) : 0,
        unbreaking: typeof parsed?.enchantments?.unbreaking === 'number' ? Math.min(3, Math.max(0, parsed.enchantments.unbreaking)) : 0,
      },
      showAdvancedTooltips: Boolean(parsed?.showAdvancedTooltips),
    };
  } catch {
    return { ...DEFAULT_ACCOUNT_STATE, enchantments: { ...DEFAULT_ACCOUNT_STATE.enchantments } };
  }
}

export function saveAccountProgression(state: PersistedAccountState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_PROGRESSION, JSON.stringify(state));
  } catch (err) {
    console.warn('[Storage] Failed to save account progression:', err);
  }
}

/**
 * Load saved custom maps created by this user
 */
export function loadMyMaps(): SavedCustomMap[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MY_MAPS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (m) => m && typeof m.code === 'string' && typeof m.name === 'string' && typeof m.seed === 'number'
      );
    }
  } catch (err) {
    console.warn('[Storage] Failed to load my maps:', err);
  }
  return [];
}

/**
 * Save or update a custom map entry
 */
export function saveMyMap(map: SavedCustomMap): SavedCustomMap[] {
  if (typeof window === 'undefined') return [map];
  const existing = loadMyMaps().filter((m) => m.code !== map.code);
  const next = [map, ...existing].slice(0, 20);
  try {
    localStorage.setItem(STORAGE_KEYS.MY_MAPS, JSON.stringify(next));
  } catch (err) {
    console.warn('[Storage] Failed to save custom map:', err);
  }
  return next;
}

/**
 * Delete a saved custom map entry & its local deltas
 */
export function deleteMyMap(code: string): SavedCustomMap[] {
  if (typeof window === 'undefined') return [];
  const next = loadMyMaps().filter((m) => m.code !== code);
  try {
    localStorage.setItem(STORAGE_KEYS.MY_MAPS, JSON.stringify(next));
    localStorage.removeItem(getDeltaStorageKey(code));
  } catch (err) {
    console.warn('[Storage] Failed to delete custom map:', err);
  }
  return next;
}

/**
 * Safely load hotbar from localStorage
 */
export function loadSavedHotbar(): BlockType[] {
  if (typeof window === 'undefined') return [...DEFAULT_HOTBAR];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOTBAR);
    if (!raw) return [...DEFAULT_HOTBAR];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 9) {
      return parsed.map((item) => (typeof item === 'number' ? (item as BlockType) : BlockType.GRASS));
    }
  } catch (err) {
    console.warn('[Storage] Failed to load saved hotbar:', err);
  }
  return [...DEFAULT_HOTBAR];
}

/**
 * Safely save hotbar to localStorage
 */
export function saveHotbar(hotbar: BlockType[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.HOTBAR, JSON.stringify(hotbar));
  } catch (err) {
    console.warn('[Storage] Failed to save hotbar:', err);
  }
}

/**
 * Safely load 27-slot inventory from localStorage
 */
export function loadSavedInventory(): (BlockType | null)[] {
  if (typeof window === 'undefined') return [...DEFAULT_INVENTORY];
  ensureSurvivalDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!raw) return [...DEFAULT_INVENTORY];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 27) {
      return parsed.map((item) => (item === null || typeof item === 'number' ? item : null));
    }
  } catch (err) {
    console.warn('[Storage] Failed to load saved inventory:', err);
  }
  return [...DEFAULT_INVENTORY];
}

/**
 * Safely save 27-slot inventory to localStorage
 */
export function saveInventory(inventory: (BlockType | null)[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  } catch (err) {
    console.warn('[Storage] Failed to save inventory:', err);
  }
}

/**
 * Safely load modified world block changes (deltas) for a specific map room from localStorage
 * Returns a Map of "x,y,z" -> BlockType
 */
export function loadSavedWorldDeltas(
  roomCode = 'COMMON',
  dimension: DimensionId = 'overworld'
): Map<string, BlockType> {
  const map = new Map<string, BlockType>();
  if (typeof window === 'undefined') return map;

  try {
    const raw = localStorage.getItem(getDeltaStorageKey(roomCode, dimension));
    if (!raw) return map;
    const parsed: Record<string, number> = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [key, blockId] of Object.entries(parsed)) {
        if (typeof blockId === 'number') {
          map.set(key, blockId as BlockType);
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to load saved world deltas:', err);
  }
  return map;
}

/**
 * Convert Map of deltas to plain object and save to localStorage for the active room & dimension
 */
export function saveWorldDeltasImmediate(
  deltas: Map<string, BlockType>,
  roomCode = 'COMMON',
  dimension: DimensionId = 'overworld'
): void {
  if (typeof window === 'undefined') return;
  try {
    const obj: Record<string, number> = {};
    for (const [k, v] of deltas.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(getDeltaStorageKey(roomCode, dimension), JSON.stringify(obj));
  } catch (err) {
    console.warn('[Storage] Failed to save world deltas:', err);
  }
}

// Debounce timer for saving world changes efficiently
let saveDeltasTimer: ReturnType<typeof setTimeout> | null = null;
let pendingDeltasToSave: { deltas: Map<string, BlockType>; roomCode: string; dimension: DimensionId } | null = null;

/**
 * Debounced world delta saver (writes to localStorage 500ms after last block placed/broken)
 */
export function saveWorldDeltasDebounced(
  deltas: Map<string, BlockType>,
  roomCode = 'COMMON',
  delayMs = 500,
  dimension: DimensionId = 'overworld'
): void {
  pendingDeltasToSave = { deltas, roomCode, dimension };
  if (saveDeltasTimer) clearTimeout(saveDeltasTimer);

  saveDeltasTimer = setTimeout(() => {
    if (pendingDeltasToSave) {
      saveWorldDeltasImmediate(
        pendingDeltasToSave.deltas,
        pendingDeltasToSave.roomCode,
        pendingDeltasToSave.dimension
      );
      pendingDeltasToSave = null;
    }
  }, delayMs);
}

// Flush pending saves on page exit / unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingDeltasToSave) {
      saveWorldDeltasImmediate(
        pendingDeltasToSave.deltas,
        pendingDeltasToSave.roomCode,
        pendingDeltasToSave.dimension
      );
    }
  });
  window.addEventListener('pagehide', () => {
    if (pendingDeltasToSave) {
      saveWorldDeltasImmediate(
        pendingDeltasToSave.deltas,
        pendingDeltasToSave.roomCode,
        pendingDeltasToSave.dimension
      );
    }
  });
}

/**
 * Load player meta (selected hotbar slot, name, skin, health, position)
 */
export function loadPlayerMeta(): PlayerSavedMeta | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_META);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[Storage] Failed to load player meta:', err);
    return null;
  }
}

/**
 * Save player meta
 */
export function savePlayerMeta(meta: PlayerSavedMeta): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPlayerMeta() || {};
    const updated = { ...existing, ...meta, lastSaved: Date.now() };
    localStorage.setItem(STORAGE_KEYS.PLAYER_META, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Storage] Failed to save player meta:', err);
  }
}

/**
 * Clear VoxelCraft localStorage data for the active map and inventory
 */
export function clearAllSavedData(roomCode = 'COMMON'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.HOTBAR);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(getDeltaStorageKey(roomCode, 'overworld'));
    localStorage.removeItem(getDeltaStorageKey(roomCode, 'nether'));
    localStorage.removeItem(getDeltaStorageKey(roomCode, 'end'));
    localStorage.removeItem(STORAGE_KEYS.PLAYER_META);
    localStorage.removeItem(STORAGE_KEYS.UNLOCKED_WEAPONS);
    localStorage.removeItem(STORAGE_KEYS.EQUIPPED_WEAPON);
    localStorage.removeItem(STORAGE_KEYS.RESOURCE_BAG);
    localStorage.removeItem(getProgressStorageKey(roomCode));
  } catch (err) {
    console.warn('[Storage] Failed to clear local storage:', err);
  }
}

/**
 * Inspect storage statistics
 */
export function getStorageStats(roomCode = 'COMMON'): { deltaCount: number; approximateBytes: number } {
  if (typeof window === 'undefined') return { deltaCount: 0, approximateBytes: 0 };
  try {
    const rawDeltas = localStorage.getItem(getDeltaStorageKey(roomCode)) || '{}';
    const parsed = JSON.parse(rawDeltas);
    const deltaCount = Object.keys(parsed).length;
    let approximateBytes = 0;
    for (const key of Object.values(STORAGE_KEYS)) {
      const item = localStorage.getItem(key);
      if (item) approximateBytes += item.length * 2; // UTF-16
    }
    return { deltaCount, approximateBytes };
  } catch {
    return { deltaCount: 0, approximateBytes: 0 };
  }
}

/**
 * Load mobile/touch control preferences
 */
export function loadControlSettings(): ControlSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_CONTROL_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTROL_SETTINGS);
    if (!raw) return { ...DEFAULT_CONTROL_SETTINGS };
    const parsed = JSON.parse(raw);
    const validSchemes: ControlScheme[] = ['joystick', 'dpad', 'swipe'];
    const validQualities: GraphicsQuality[] = ['smooth', 'balanced', 'high'];
    return {
      scheme: validSchemes.includes(parsed?.scheme) ? parsed.scheme : DEFAULT_CONTROL_SETTINGS.scheme,
      lookSensitivity:
        typeof parsed?.lookSensitivity === 'number' && parsed.lookSensitivity >= 0.4 && parsed.lookSensitivity <= 3.0
          ? parsed.lookSensitivity
          : DEFAULT_CONTROL_SETTINGS.lookSensitivity,
      autoJump: typeof parsed?.autoJump === 'boolean' ? parsed.autoJump : DEFAULT_CONTROL_SETTINGS.autoJump,
      tapScreenToBuild:
        typeof parsed?.tapScreenToBuild === 'boolean'
          ? parsed.tapScreenToBuild
          : DEFAULT_CONTROL_SETTINGS.tapScreenToBuild,
      graphicsQuality: validQualities.includes(parsed?.graphicsQuality)
        ? parsed.graphicsQuality
        : DEFAULT_CONTROL_SETTINGS.graphicsQuality,
    };
  } catch (err) {
    console.warn('[Storage] Failed to load control settings:', err);
    return { ...DEFAULT_CONTROL_SETTINGS };
  }
}

/**
 * Save mobile/touch control preferences
 */
export function saveControlSettings(settings: ControlSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONTROL_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('[Storage] Failed to save control settings:', err);
  }
}

/**
 * Check if running inside private AI Studio developer preview (ais-dev-*)
 */
export function isDevPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('ais-dev-');
}

/**
 * Resolve the public shareable base URL (automatically converts private ais-dev-* host to public ais-pre-*)
 */
export function getPublicShareBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const { protocol, host, pathname } = window.location;
  const publicHost = host.startsWith('ais-dev-') ? host.replace(/^ais-dev-/, 'ais-pre-') : host;
  return `${protocol}//${publicHost}${pathname}`;
}

/**
 * Build a full shareable friend invite URL carrying room code, seed, and map name
 */
export function buildInviteUrl(code: string, seed?: number, name?: string): string {
  const base = getPublicShareBaseUrl();
  if (!code || code === 'COMMON') return base;
  const params = new URLSearchParams({ map: code });
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    params.set('seed', String(seed));
  }
  if (name) {
    params.set('name', name);
  }
  return `${base}?${params.toString()}`;
}


