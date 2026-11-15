import * as THREE from 'three';
import { BlockType } from './types';
import { ResourceBag } from './storage';

export type WeaponSpecial = 'none' | 'fire' | 'lifesteal' | 'aoe' | 'void' | 'frost' | 'lightning';

export type WeaponId =
  | 'hand'
  | 'void_obsidian'
  | 'emerald_katana'
  | 'crimson_battleaxe'
  | 'shadow_broadsword'
  | 'golden_cutlass'
  | 'solar_flame'
  | 'frostbite_blade'
  | 'plasma_energy'
  | 'void_scythe'
  | 'gold_waraxe'
  | 'amethyst_blade'
  | 'butcher_cleaver'
  | 'royal_paladin'
  | 'ruby_greatsword'
  | 'cyber_katana'
  | 'venom_blade'
  | 'phantom_spectral'
  | 'abyssal_scimitar';

export interface WeaponIngredient {
  label: string;
  acceptBlocks: BlockType[];
  count: number;
  color: string;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  tier: 'Starter' | 'Rare' | 'Epic' | 'Mythic';
  damage: number;
  range: number;
  cooldown: number; // seconds between strikes
  knockback: number;
  special: WeaponSpecial;
  specialLabel: string;
  bladeColor: string;
  edgeColor: string;
  guardColor: string;
  handleColor: string;
  emissiveColor?: string;
  shape: 'sword' | 'katana' | 'axe' | 'scythe' | 'energy' | 'cleaver' | 'greatsword';
  grid: string[]; // 10x10 diagonal pixel art for crisp UI icon & 3D blade accent
  recipe: WeaponIngredient[];
}

const ING_WOOD = (count: number): WeaponIngredient => ({
  label: 'Wood Log',
  acceptBlocks: [BlockType.WOOD_OAK, BlockType.WOOD_CHERRY, BlockType.PLANKS_OAK],
  count,
  color: '#8d6539',
});
const ING_STONE = (count: number): WeaponIngredient => ({
  label: 'Cobblestone',
  acceptBlocks: [BlockType.COBBLESTONE, BlockType.STONE],
  count,
  color: '#757575',
});
const ING_COAL = (count: number): WeaponIngredient => ({
  label: 'Coal / Torch',
  acceptBlocks: [BlockType.TORCH, BlockType.COAL_ORE],
  count,
  color: '#f5c347',
});
const ING_IRON = (count: number): WeaponIngredient => ({
  label: 'Iron Ore',
  acceptBlocks: [BlockType.IRON_ORE],
  count,
  color: '#c7a389',
});
const ING_GOLD = (count: number): WeaponIngredient => ({
  label: 'Gold',
  acceptBlocks: [BlockType.GOLD_BLOCK, BlockType.GOLD_ORE],
  count,
  color: '#f9d332',
});
const ING_DIAMOND = (count: number): WeaponIngredient => ({
  label: 'Diamond',
  acceptBlocks: [BlockType.DIAMOND_BLOCK, BlockType.DIAMOND_ORE],
  count,
  color: '#4dedf4',
});
const ING_GLOW = (count: number): WeaponIngredient => ({
  label: 'Glowstone',
  acceptBlocks: [BlockType.GLOWSTONE],
  count,
  color: '#edd072',
});
const ING_GLASS = (count: number): WeaponIngredient => ({
  label: 'Sand / Glass',
  acceptBlocks: [BlockType.GLASS, BlockType.SAND],
  count,
  color: '#c5e2ec',
});
const ING_TNT = (count: number): WeaponIngredient => ({
  label: 'TNT',
  acceptBlocks: [BlockType.TNT],
  count,
  color: '#db3226',
});

export const WEAPON_CATALOG: Record<WeaponId, WeaponDef> = {
  hand: {
    id: 'hand',
    name: 'Bare Hand',
    tier: 'Starter',
    damage: 3,
    range: 4.5,
    cooldown: 0.28,
    knockback: 1.0,
    special: 'none',
    specialLabel: 'Standard Punch',
    bladeColor: '#d6a582',
    edgeColor: '#b98360',
    guardColor: '#d6a582',
    handleColor: '#d6a582',
    shape: 'sword',
    grid: [
      '..........',
      '..........',
      '..........',
      '...bbbb...',
      '..bbbbbb..',
      '..beeeeb..',
      '..bbbbbb..',
      '...bbbb...',
      '..........',
      '..........',
    ],
    recipe: [],
  },
  void_obsidian: {
    id: 'void_obsidian',
    name: 'Void Obsidian Blade',
    tier: 'Mythic',
    damage: 14,
    range: 5.5,
    cooldown: 0.3,
    knockback: 1.6,
    special: 'void',
    specialLabel: 'Void Shockwave +4 DMG',
    bladeColor: '#3b0764',
    edgeColor: '#c026d3',
    guardColor: '#1e1b4b',
    handleColor: '#09090b',
    emissiveColor: '#a855f7',
    shape: 'greatsword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebbe',
      '.....ebbb.',
      '....ebbb..',
      '..ggbbb...',
      '...ggb....',
      '..h.gg....',
      '.h........',
      'g.........',
    ],
    recipe: [ING_STONE(4), ING_GLOW(2), ING_DIAMOND(3)],
  },
  emerald_katana: {
    id: 'emerald_katana',
    name: 'Emerald Katana',
    tier: 'Epic',
    damage: 9,
    range: 5.4,
    cooldown: 0.2,
    knockback: 1.1,
    special: 'none',
    specialLabel: 'Ultra-Fast Combo',
    bladeColor: '#10b981',
    edgeColor: '#6ee7b7',
    guardColor: '#1f2937',
    handleColor: '#374151',
    emissiveColor: '#34d399',
    shape: 'katana',
    grid: [
      '........ee',
      '.......eb.',
      '......eb..',
      '.....eb...',
      '....eb....',
      '...eb.....',
      '..gg......',
      '.hg.......',
      'h.........',
      '..........',
    ],
    recipe: [ING_IRON(3), ING_WOOD(2), ING_DIAMOND(1)],
  },
  crimson_battleaxe: {
    id: 'crimson_battleaxe',
    name: 'Crimson Battleaxe',
    tier: 'Mythic',
    damage: 13,
    range: 4.8,
    cooldown: 0.44,
    knockback: 2.1,
    special: 'aoe',
    specialLabel: 'Heavy Cleave AoE',
    bladeColor: '#dc2626',
    edgeColor: '#fca5a5',
    guardColor: '#94a3b8',
    handleColor: '#334155',
    emissiveColor: '#ef4444',
    shape: 'axe',
    grid: [
      '....ee....',
      '..eebbbe..',
      '.ebbbbbbe.',
      '.ebgbgbbe.',
      '..eeggee..',
      '....hh....',
      '...hh.....',
      '..hh......',
      '.hh.......',
      'g.........',
    ],
    recipe: [ING_IRON(3), ING_TNT(2), ING_DIAMOND(2)],
  },
  shadow_broadsword: {
    id: 'shadow_broadsword',
    name: 'Shadow Broadsword',
    tier: 'Epic',
    damage: 11,
    range: 5.2,
    cooldown: 0.34,
    knockback: 1.5,
    special: 'lifesteal',
    specialLabel: '+1 HP Lifesteal',
    bladeColor: '#27272a',
    edgeColor: '#71717a',
    guardColor: '#ef4444',
    handleColor: '#18181b',
    shape: 'greatsword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebbe',
      '.....ebbb.',
      '....ebbb..',
      '..ggbbb...',
      '...ggb....',
      '..h.g.....',
      '.h........',
      'g.........',
    ],
    recipe: [ING_IRON(3), ING_STONE(3), ING_DIAMOND(1)],
  },
  golden_cutlass: {
    id: 'golden_cutlass',
    name: 'Golden Cutlass',
    tier: 'Rare',
    damage: 8,
    range: 4.8,
    cooldown: 0.25,
    knockback: 1.2,
    special: 'none',
    specialLabel: 'Swift Slash',
    bladeColor: '#e2e8f0',
    edgeColor: '#ffffff',
    guardColor: '#eab308',
    handleColor: '#92400e',
    shape: 'katana',
    grid: [
      '.......eee',
      '......ebbb',
      '.....ebbb.',
      '....ebbb..',
      '...ebbb...',
      '..ggbb....',
      '..hgg.....',
      '.h.g......',
      'g.........',
      '..........',
    ],
    recipe: [ING_WOOD(2), ING_GOLD(2)],
  },
  solar_flame: {
    id: 'solar_flame',
    name: 'Solar Flame Blade',
    tier: 'Mythic',
    damage: 13,
    range: 5.2,
    cooldown: 0.3,
    knockback: 1.5,
    special: 'fire',
    specialLabel: 'Blazing Fire Burst',
    bladeColor: '#f97316',
    edgeColor: '#fde047',
    guardColor: '#1f2937',
    handleColor: '#7c2d12',
    emissiveColor: '#fb923c',
    shape: 'greatsword',
    grid: [
      '.......eee',
      '......ebee',
      '.....ebbb.',
      '....ebbb..',
      '...ebbb...',
      '..ebbb....',
      '..ggb.....',
      '.hgg......',
      'h.........',
      '..........',
    ],
    recipe: [ING_GOLD(3), ING_GLOW(2), ING_DIAMOND(2)],
  },
  frostbite_blade: {
    id: 'frostbite_blade',
    name: 'Frostbite Runeblade',
    tier: 'Epic',
    damage: 10,
    range: 5.1,
    cooldown: 0.29,
    knockback: 1.4,
    special: 'frost',
    specialLabel: 'Frost Slow',
    bladeColor: '#06b6d4',
    edgeColor: '#cffafe',
    guardColor: '#0f172a',
    handleColor: '#1e293b',
    emissiveColor: '#22d3ee',
    shape: 'sword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebb.',
      '.....ebb..',
      '....ebb...',
      '..ggbb....',
      '...gg.....',
      '..h.g.....',
      '.h........',
      '..........',
    ],
    recipe: [ING_IRON(2), ING_GLASS(2), ING_DIAMOND(1)],
  },
  plasma_energy: {
    id: 'plasma_energy',
    name: 'Plasma Energy Sword',
    tier: 'Mythic',
    damage: 14,
    range: 5.4,
    cooldown: 0.24,
    knockback: 1.4,
    special: 'lightning',
    specialLabel: 'Arc Lightning Cleave',
    bladeColor: '#0ea5e9',
    edgeColor: '#67e8f9',
    guardColor: '#1e1b4b',
    handleColor: '#312e81',
    emissiveColor: '#38bdf8',
    shape: 'energy',
    grid: [
      '.......e.e',
      '......eb.e',
      '.....eb.eb',
      '....eb.eb.',
      '...eb.eb..',
      '..eb.eb...',
      '.gg.gg....',
      '.hhhh.....',
      '..........',
      '..........',
    ],
    recipe: [ING_GLOW(3), ING_IRON(2), ING_DIAMOND(3)],
  },
  void_scythe: {
    id: 'void_scythe',
    name: 'Reaper Scythe',
    tier: 'Mythic',
    damage: 13,
    range: 5.8,
    cooldown: 0.4,
    knockback: 1.8,
    special: 'lifesteal',
    specialLabel: 'Long Reach + Lifesteal',
    bladeColor: '#71717a',
    edgeColor: '#e4e4e7',
    guardColor: '#d4d4d8',
    handleColor: '#3f3f46',
    shape: 'scythe',
    grid: [
      '..eeeeee..',
      '.ebbbbbbe.',
      'eb.....gbe',
      '........hh',
      '.......hh.',
      '......hh..',
      '.....hh...',
      '....hh....',
      '...hh.....',
      '..hh......',
    ],
    recipe: [ING_IRON(4), ING_STONE(3), ING_DIAMOND(2)],
  },
  gold_waraxe: {
    id: 'gold_waraxe',
    name: 'Sunforged Waraxe',
    tier: 'Rare',
    damage: 10,
    range: 4.8,
    cooldown: 0.38,
    knockback: 1.9,
    special: 'aoe',
    specialLabel: 'Spin Cleave',
    bladeColor: '#eab308',
    edgeColor: '#fef08a',
    guardColor: '#ca8a04',
    handleColor: '#78350f',
    emissiveColor: '#facc15',
    shape: 'axe',
    grid: [
      '....eee...',
      '...ebbbe..',
      '..ebbbbe..',
      '..ebbbg...',
      '...eegh...',
      '....hh....',
      '...hh.....',
      '..hh......',
      '.hh.......',
      'g.........',
    ],
    recipe: [ING_GOLD(3), ING_WOOD(2), ING_IRON(1)],
  },
  amethyst_blade: {
    id: 'amethyst_blade',
    name: 'Amethyst Greatsword',
    tier: 'Epic',
    damage: 11,
    range: 5.1,
    cooldown: 0.3,
    knockback: 1.4,
    special: 'void',
    specialLabel: 'Arcane Surge',
    bladeColor: '#8b5cf6',
    edgeColor: '#ddd6fe',
    guardColor: '#4c1d95',
    handleColor: '#1f2937',
    emissiveColor: '#a78bfa',
    shape: 'sword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebbe',
      '.....ebb..',
      '....ebb...',
      '..ggbb....',
      '...gg.....',
      '..h.g.....',
      '.h........',
      'g.........',
    ],
    recipe: [ING_GOLD(2), ING_GLOW(2), ING_DIAMOND(1)],
  },
  butcher_cleaver: {
    id: 'butcher_cleaver',
    name: 'Iron War Cleaver',
    tier: 'Rare',
    damage: 9,
    range: 4.6,
    cooldown: 0.32,
    knockback: 1.6,
    special: 'none',
    specialLabel: 'Heavy Chop',
    bladeColor: '#cbd5e1',
    edgeColor: '#f8fafc',
    guardColor: '#475569',
    handleColor: '#166534',
    shape: 'cleaver',
    grid: [
      '......eeee',
      '.....ebbbe',
      '....ebbbbe',
      '...ebbbbe.',
      '..ebbbbe..',
      '..ebbbe...',
      '...hh.....',
      '..hh......',
      '.hh.......',
      '..........',
    ],
    recipe: [ING_STONE(3), ING_WOOD(2), ING_IRON(1)],
  },
  royal_paladin: {
    id: 'royal_paladin',
    name: 'Paladin Sapphire Blade',
    tier: 'Epic',
    damage: 11,
    range: 5.1,
    cooldown: 0.29,
    knockback: 1.4,
    special: 'frost',
    specialLabel: 'Holy Impact',
    bladeColor: '#0284c7',
    edgeColor: '#7dd3fc',
    guardColor: '#f59e0b',
    handleColor: '#451a03',
    emissiveColor: '#38bdf8',
    shape: 'sword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebb.',
      '.....ebb..',
      '....ebb...',
      '..ggbb....',
      '...gg.....',
      '..h.g.....',
      '.g........',
      '..........',
    ],
    recipe: [ING_GOLD(2), ING_IRON(2), ING_DIAMOND(1)],
  },
  ruby_greatsword: {
    id: 'ruby_greatsword',
    name: 'Crimson Ruby Edge',
    tier: 'Epic',
    damage: 12,
    range: 5.2,
    cooldown: 0.33,
    knockback: 1.5,
    special: 'fire',
    specialLabel: 'Crimson Ignite',
    bladeColor: '#b91c1c',
    edgeColor: '#f87171',
    guardColor: '#ef4444',
    handleColor: '#450a0a',
    emissiveColor: '#dc2626',
    shape: 'greatsword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebb.',
      '.....ebb..',
      '....ebb...',
      '.gggbb....',
      '...gg.....',
      '..h.g.....',
      '.h........',
      'g.........',
    ],
    recipe: [ING_IRON(2), ING_COAL(2), ING_DIAMOND(1)],
  },
  cyber_katana: {
    id: 'cyber_katana',
    name: 'Cyber Neon Katana',
    tier: 'Epic',
    damage: 10,
    range: 5.6,
    cooldown: 0.19,
    knockback: 1.0,
    special: 'lightning',
    specialLabel: 'Fastest Neon Strike',
    bladeColor: '#0f172a',
    edgeColor: '#22d3ee',
    guardColor: '#e2e8f0',
    handleColor: '#020617',
    emissiveColor: '#06b6d4',
    shape: 'katana',
    grid: [
      '........ee',
      '.......eb.',
      '......eb..',
      '.....eb...',
      '....eb....',
      '...eb.....',
      '..gg......',
      '.hh.......',
      'h.........',
      '..........',
    ],
    recipe: [ING_IRON(2), ING_GLOW(2), ING_DIAMOND(1)],
  },
  venom_blade: {
    id: 'venom_blade',
    name: 'Venom Viper Blade',
    tier: 'Rare',
    damage: 9,
    range: 5.0,
    cooldown: 0.27,
    knockback: 1.3,
    special: 'lifesteal',
    specialLabel: 'Toxic Drain',
    bladeColor: '#4d7c0f',
    edgeColor: '#bef264',
    guardColor: '#365314',
    handleColor: '#1a2e05',
    emissiveColor: '#84cc16',
    shape: 'sword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebb.',
      '.....ebb..',
      '....ebb...',
      '..ggbb....',
      '...gg.....',
      '..h.g.....',
      '.h........',
      '..........',
    ],
    recipe: [ING_STONE(3), ING_WOOD(2), ING_COAL(2)],
  },
  phantom_spectral: {
    id: 'phantom_spectral',
    name: 'Spectral Ghost Blade',
    tier: 'Epic',
    damage: 11,
    range: 5.3,
    cooldown: 0.26,
    knockback: 1.4,
    special: 'frost',
    specialLabel: 'Ethereal Slash',
    bladeColor: '#cbd5e1',
    edgeColor: '#ffffff',
    guardColor: '#94a3b8',
    handleColor: '#64748b',
    emissiveColor: '#e2e8f0',
    shape: 'sword',
    grid: [
      '........ee',
      '.......ebe',
      '......ebb.',
      '.....ebb..',
      '....ebb...',
      '..ggbb....',
      '...gg.....',
      '..h.g.....',
      '.h........',
      '..........',
    ],
    recipe: [ING_GLASS(2), ING_GLOW(2), ING_DIAMOND(1)],
  },
  abyssal_scimitar: {
    id: 'abyssal_scimitar',
    name: 'Abyssal Fang Blade',
    tier: 'Mythic',
    damage: 14,
    range: 5.4,
    cooldown: 0.28,
    knockback: 1.7,
    special: 'void',
    specialLabel: 'Shadow Burst',
    bladeColor: '#09090b',
    edgeColor: '#e4e4e7',
    guardColor: '#27272a',
    handleColor: '#000000',
    emissiveColor: '#71717a',
    shape: 'katana',
    grid: [
      '........ee',
      '.......eb.',
      '......eb..',
      '.....eb...',
      '....ebb...',
      '..gggbb...',
      '..hgg.....',
      '.h........',
      '..........',
      '..........',
    ],
    recipe: [ING_GOLD(3), ING_TNT(2), ING_DIAMOND(3)],
  },
};

export const ALL_WEAPON_IDS = Object.keys(WEAPON_CATALOG) as WeaponId[];

export const RESOURCE_POUCH_DISPLAY: WeaponIngredient[] = [
  ING_WOOD(0),
  ING_STONE(0),
  ING_COAL(0),
  ING_IRON(0),
  ING_GOLD(0),
  ING_DIAMOND(0),
  ING_GLOW(0),
  ING_GLASS(0),
  ING_TNT(0),
];

export function getIngredientOwned(bag: ResourceBag, acceptBlocks: BlockType[]): number {
  let total = 0;
  for (const b of acceptBlocks) {
    total += bag[b] || 0;
  }
  return total;
}

export function canCraftWeapon(id: WeaponId, bag: ResourceBag): boolean {
  const def = WEAPON_CATALOG[id];
  if (!def || def.recipe.length === 0) return true;
  return def.recipe.every((ing) => getIngredientOwned(bag, ing.acceptBlocks) >= ing.count);
}

export function consumeWeaponRecipe(id: WeaponId, bag: ResourceBag): ResourceBag | null {
  if (!canCraftWeapon(id, bag)) return null;
  const def = WEAPON_CATALOG[id];
  const next: ResourceBag = { ...bag };
  for (const ing of def.recipe) {
    let remaining = ing.count;
    for (const b of ing.acceptBlocks) {
      if (remaining <= 0) break;
      const have = next[b] || 0;
      if (have > 0) {
        const take = Math.min(have, remaining);
        next[b] = have - take;
        if (next[b] <= 0) delete next[b];
        remaining -= take;
      }
    }
  }
  return next;
}

const iconDataUrlCache = new Map<WeaponId, string>();

export function getWeaponIconUrl(id: WeaponId): string {
  const existing = iconDataUrlCache.get(id);
  if (existing) return existing;

  const def = WEAPON_CATALOG[id];
  const size = 10;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const palette: Record<string, string> = {
    b: def.bladeColor,
    e: def.edgeColor,
    g: def.guardColor,
    h: def.handleColor,
  };

  for (let y = 0; y < def.grid.length; y++) {
    const row = def.grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch !== '.' && palette[ch]) {
        ctx.fillStyle = palette[ch];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const url = canvas.toDataURL();
  iconDataUrlCache.set(id, url);
  return url;
}

/**
 * Builds a lightweight 3D blocky pixel-art weapon mesh to hold in 1st-person & 3rd-person / Top-View hands.
 */
export function createWeapon3DMesh(id: WeaponId): THREE.Group {
  const group = new THREE.Group();
  if (id === 'hand') return group;

  const def = WEAPON_CATALOG[id];
  const bladeMat = new THREE.MeshStandardMaterial({
    color: def.bladeColor,
    roughness: 0.35,
    metalness: 0.45,
    emissive: def.emissiveColor ? new THREE.Color(def.emissiveColor) : new THREE.Color(0x000000),
    emissiveIntensity: def.emissiveColor ? 0.38 : 0,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: def.edgeColor,
    roughness: 0.25,
    metalness: 0.55,
    emissive: def.emissiveColor ? new THREE.Color(def.emissiveColor) : new THREE.Color(0x000000),
    emissiveIntensity: def.emissiveColor ? 0.6 : 0,
  });
  const guardMat = new THREE.MeshStandardMaterial({ color: def.guardColor, roughness: 0.5, metalness: 0.3 });
  const handleMat = new THREE.MeshStandardMaterial({ color: def.handleColor, roughness: 0.8 });

  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.055), handleMat);
  handle.position.y = 0.05;
  group.add(handle);

  if (def.shape === 'axe') {
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), handleMat);
    shaft.position.y = 0.34;
    const headCore = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.07), guardMat);
    headCore.position.y = 0.56;
    const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.04), bladeMat);
    bladeL.position.set(-0.14, 0.56, 0);
    const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.04), edgeMat);
    bladeR.position.set(0.14, 0.56, 0);
    group.add(shaft, headCore, bladeL, bladeR);
  } else if (def.shape === 'scythe') {
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.05), handleMat);
    pole.position.y = 0.42;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.08), guardMat);
    collar.position.y = 0.8;
    const bladeMain = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 0.04), bladeMat);
    bladeMain.position.set(-0.2, 0.82, 0);
    const bladeTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.04), edgeMat);
    bladeTip.position.set(-0.38, 0.71, 0);
    group.add(pole, collar, bladeMain, bladeTip);
  } else if (def.shape === 'energy') {
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.07), guardMat);
    guard.position.y = 0.18;
    const prongL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.55, 0.04), edgeMat);
    prongL.position.set(-0.065, 0.48, 0);
    const prongR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.55, 0.04), bladeMat);
    prongR.position.set(0.065, 0.48, 0);
    group.add(guard, prongL, prongR);
  } else if (def.shape === 'cleaver') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.52, 0.04), bladeMat);
    blade.position.set(-0.04, 0.42, 0);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.045), edgeMat);
    edge.position.set(-0.14, 0.42, 0);
    group.add(blade, edge);
  } else {
    const isKatana = def.shape === 'katana';
    const isGreat = def.shape === 'greatsword';
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(isKatana ? 0.16 : isGreat ? 0.3 : 0.24, 0.065, 0.08),
      guardMat
    );
    guard.position.y = 0.18;
    const bladeH = isKatana ? 0.68 : isGreat ? 0.72 : 0.58;
    const bladeW = isKatana ? 0.065 : isGreat ? 0.14 : 0.1;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(bladeW, bladeH, 0.036), bladeMat);
    blade.position.y = 0.18 + bladeH / 2;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(bladeW * 0.42, bladeH + 0.04, 0.042), edgeMat);
    edge.position.set(isKatana ? -bladeW * 0.35 : 0, 0.2 + bladeH / 2, 0);
    group.add(guard, blade, edge);
  }

  return group;
}
