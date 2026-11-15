import { BlockType } from './types';

export type GearTierId = 'none' | 'wood' | 'stone' | 'iron' | 'gold' | 'diamond' | 'netherite';

export interface ToolTierDef {
  id: Exclude<GearTierId, 'none'>;
  name: string;
  speedMultiplier: number;
  maxDurability: number;
  damageBonus: number;
  color: string;
  upgradeCost: { block: BlockType; count: number; label: string }[];
}

export interface ArmorTierDef {
  id: GearTierId;
  name: string;
  damageReduction: number; // 0..0.72
  maxDurability: number;
  color: string;
  upgradeCost: { block: BlockType; count: number; label: string }[];
}

export const TOOL_TIERS: Record<Exclude<GearTierId, 'none'>, ToolTierDef> = {
  wood: {
    id: 'wood',
    name: 'Wood Gear',
    speedMultiplier: 1.15,
    maxDurability: 59,
    damageBonus: 0,
    color: '#a16207',
    upgradeCost: [],
  },
  stone: {
    id: 'stone',
    name: 'Stone Gear',
    speedMultiplier: 1.5,
    maxDurability: 131,
    damageBonus: 1,
    color: '#78716c',
    upgradeCost: [{ block: BlockType.COBBLESTONE, count: 4, label: 'Cobblestone' }],
  },
  iron: {
    id: 'iron',
    name: 'Iron Gear',
    speedMultiplier: 1.95,
    maxDurability: 250,
    damageBonus: 2,
    color: '#cbd5e1',
    upgradeCost: [{ block: BlockType.IRON_ORE, count: 4, label: 'Iron Ore' }],
  },
  gold: {
    id: 'gold',
    name: 'Gold Gear',
    speedMultiplier: 2.65,
    maxDurability: 96,
    damageBonus: 2,
    color: '#facc15',
    upgradeCost: [{ block: BlockType.GOLD_ORE, count: 4, label: 'Gold Ore' }],
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Gear',
    speedMultiplier: 2.55,
    maxDurability: 1561,
    damageBonus: 3,
    color: '#22d3ee',
    upgradeCost: [{ block: BlockType.DIAMOND_ORE, count: 4, label: 'Diamond Ore' }],
  },
  netherite: {
    id: 'netherite',
    name: 'Netherite Gear',
    speedMultiplier: 3.15,
    maxDurability: 2031,
    damageBonus: 5,
    color: '#57534e',
    upgradeCost: [
      { block: BlockType.OBSIDIAN, count: 3, label: 'Obsidian' },
      { block: BlockType.GOLD_BLOCK, count: 1, label: 'Block of Gold' },
    ],
  },
};

export const ARMOR_TIERS: Record<GearTierId, ArmorTierDef> = {
  none: {
    id: 'none',
    name: 'No Armor',
    damageReduction: 0,
    maxDurability: 0,
    color: '#475569',
    upgradeCost: [],
  },
  wood: {
    id: 'wood',
    name: 'Leather / Wood Armor',
    damageReduction: 0.16,
    maxDurability: 80,
    color: '#92400e',
    upgradeCost: [{ block: BlockType.PLANKS_OAK, count: 6, label: 'Oak Planks' }],
  },
  stone: {
    id: 'stone',
    name: 'Chainmail Armor',
    damageReduction: 0.28,
    maxDurability: 165,
    color: '#94a3b8',
    upgradeCost: [{ block: BlockType.CHAIN, count: 4, label: 'Chain' }],
  },
  iron: {
    id: 'iron',
    name: 'Iron Armor',
    damageReduction: 0.42,
    maxDurability: 240,
    color: '#cbd5e1',
    upgradeCost: [{ block: BlockType.IRON_ORE, count: 6, label: 'Iron Ore' }],
  },
  gold: {
    id: 'gold',
    name: 'Gold Armor',
    damageReduction: 0.36,
    maxDurability: 180,
    color: '#fbbf24',
    upgradeCost: [{ block: BlockType.GOLD_ORE, count: 6, label: 'Gold Ore' }],
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Armor',
    damageReduction: 0.58,
    maxDurability: 528,
    color: '#22d3ee',
    upgradeCost: [{ block: BlockType.DIAMOND_ORE, count: 6, label: 'Diamond Ore' }],
  },
  netherite: {
    id: 'netherite',
    name: 'Netherite Armor',
    damageReduction: 0.72,
    maxDurability: 592,
    color: '#44403c',
    upgradeCost: [
      { block: BlockType.OBSIDIAN, count: 4, label: 'Obsidian' },
      { block: BlockType.DIAMOND_BLOCK, count: 1, label: 'Block of Diamond' },
    ],
  },
};

export interface EnchantmentsState {
  fortune: number; // 0..3: multiplies ore & crop drops
  fireAspect: number; // 0..2: cooks animal drops & lights candles
  efficiency: number; // 0..3: +22% mining speed per level
  unbreaking: number; // 0..3: chance to skip durability loss
}

export type PotionId = 'swiftness' | 'strength' | 'regeneration' | 'fire_resistance';

export interface PotionDef {
  id: PotionId;
  name: string;
  durationSec: number;
  color: string;
  description: string;
  cost: { block: BlockType; count: number; label: string }[];
}

export const POTION_CATALOG: Record<PotionId, PotionDef> = {
  swiftness: {
    id: 'swiftness',
    name: 'Potion of Swiftness',
    durationSec: 45,
    color: '#38bdf8',
    description: '+38% movement and sprint speed',
    cost: [
      { block: BlockType.SUGAR_CANE, count: 2, label: 'Sugar Cane' },
      { block: BlockType.GLASS, count: 1, label: 'Glass' },
    ],
  },
  strength: {
    id: 'strength',
    name: 'Potion of Strength',
    durationSec: 45,
    color: '#ef4444',
    description: '+4 bonus melee combat damage',
    cost: [
      { block: BlockType.GLOWSTONE, count: 1, label: 'Glowstone' },
      { block: BlockType.GLASS, count: 1, label: 'Glass' },
    ],
  },
  regeneration: {
    id: 'regeneration',
    name: 'Potion of Regeneration',
    durationSec: 30,
    color: '#f472b6',
    description: 'Rapidly restores +1 HP every 1.6s',
    cost: [
      { block: BlockType.MELON_BLOCK, count: 1, label: 'Melon' },
      { block: BlockType.GOLD_ORE, count: 1, label: 'Gold Ore' },
    ],
  },
  fire_resistance: {
    id: 'fire_resistance',
    name: 'Potion of Fire Resistance',
    durationSec: 60,
    color: '#fb923c',
    description: 'Complete immunity to Lava & fire damage',
    cost: [
      { block: BlockType.NETHERRACK, count: 2, label: 'Netherrack' },
      { block: BlockType.GLOWSTONE, count: 1, label: 'Glowstone' },
    ],
  },
};

export function formatDurabilityLabel(
  tierName: string,
  durability: number,
  maxDurability: number,
  showExactNumbers: boolean
): string {
  if (maxDurability <= 0) return tierName;
  if (showExactNumbers) {
    return `${tierName} (${durability}/${maxDurability})`;
  }
  const pct = Math.round((durability / maxDurability) * 100);
  return `${tierName} (${pct}%)`;
}

export function getFortuneDropCount(block: BlockType, fortuneLevel: number): number {
  const isFortuneTarget =
    block === BlockType.COAL_ORE ||
    block === BlockType.IRON_ORE ||
    block === BlockType.GOLD_ORE ||
    block === BlockType.DIAMOND_ORE ||
    block === BlockType.WHEAT_CROP ||
    block === BlockType.CARROT_CROP ||
    block === BlockType.POTATO_CROP ||
    block === BlockType.BEETROOT_CROP ||
    block === BlockType.MELON_BLOCK;

  if (!isFortuneTarget || fortuneLevel <= 0) return 1;
  const bonus = Math.floor(Math.random() * (fortuneLevel + 1));
  return 1 + bonus;
}
