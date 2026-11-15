import * as THREE from 'three';
import { VoxelWorld, WorldEntity } from './world';
import { Player } from './player';
import { BlockType } from './types';
import { DroppedItemManager } from './drops';
import { soundFX } from './audio';
import { BLOCK_DEFS } from './textures';

export type MobCategory = 'hostile' | 'boss' | 'friendly' | 'passive';
export type MobMoveMode = 'ground' | 'fly' | 'swim';

export type MobType =
  // Hostile ("Bad Guys")
  | 'creeper'
  | 'zombie'
  | 'husk'
  | 'drowned'
  | 'skeleton'
  | 'wither_skeleton'
  | 'spider'
  | 'enderman'
  | 'witch'
  | 'pillager'
  | 'evoker'
  | 'phantom'
  | 'blaze'
  | 'slime'
  | 'guardian'
  | 'ghast'
  | 'ravager'
  | 'warden'
  | 'creaking'
  | 'piglin'
  // Bosses
  | 'ender_dragon'
  | 'wither'
  // Friendly / Guardians
  | 'villager'
  | 'wandering_trader'
  | 'iron_golem'
  | 'snow_golem'
  // Passive Animals
  | 'pig'
  | 'cow'
  | 'mooshroom'
  | 'sheep'
  | 'chicken'
  | 'wolf'
  | 'fox'
  | 'polar_bear'
  | 'bee'
  | 'parrot'
  | 'frog'
  | 'panda'
  | 'horse'
  | 'camel'
  | 'llama'
  | 'turtle'
  | 'axolotl'
  | 'squid'
  | 'rabbit'
  | 'cat'
  | 'sniffer';

export interface MobDefinition {
  type: MobType;
  name: string;
  category: MobCategory;
  moveMode: MobMoveMode;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  isRanged?: boolean;
  width: number;
  height: number;
  primaryColor: string;
  accentColor: string;
  drops: BlockType[];
  biomes?: string[];
  description: string;
}

export const MOB_CATALOG: Record<MobType, MobDefinition> = {
  // === HOSTILE ("BAD GUYS") ===
  creeper: {
    type: 'creeper',
    name: 'Creeper',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 2.8,
    damage: 10,
    attackRange: 2.6,
    width: 0.65,
    height: 1.7,
    primaryColor: '#43a047',
    accentColor: '#1b5e20',
    drops: [BlockType.TNT, BlockType.COAL_ORE],
    description: 'Silent green stalker that hisses and explodes when close.',
  },
  zombie: {
    type: 'zombie',
    name: 'Zombie',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 2.5,
    damage: 3,
    attackRange: 1.7,
    width: 0.65,
    height: 1.9,
    primaryColor: '#4caf50',
    accentColor: '#00acc1',
    drops: [BlockType.IRON_ORE, BlockType.DIRT],
    description: 'Undead night walker that relentlessly pursues players.',
  },
  husk: {
    type: 'husk',
    name: 'Husk',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 22,
    speed: 2.6,
    damage: 4,
    attackRange: 1.7,
    width: 0.65,
    height: 1.9,
    primaryColor: '#a1887f',
    accentColor: '#6d4c41',
    drops: [BlockType.SAND, BlockType.GOLD_ORE],
    biomes: ['desert'],
    description: 'Sun-hardened desert zombie immune to daylight.',
  },
  drowned: {
    type: 'drowned',
    name: 'Drowned',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 2.5,
    damage: 3,
    attackRange: 1.8,
    width: 0.65,
    height: 1.9,
    primaryColor: '#26a69a',
    accentColor: '#4dd0e1',
    drops: [BlockType.GOLD_ORE, BlockType.WATER],
    description: 'Glowing ocean undead roaming shorelines and rivers.',
  },
  skeleton: {
    type: 'skeleton',
    name: 'Skeleton',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 2.7,
    damage: 3,
    attackRange: 11.5,
    isRanged: true,
    width: 0.6,
    height: 1.9,
    primaryColor: '#e0e0e0',
    accentColor: '#9e9e9e',
    drops: [BlockType.COBBLESTONE, BlockType.TORCH],
    description: 'Sharp-eyed archer firing rapid arrows from range.',
  },
  wither_skeleton: {
    type: 'wither_skeleton',
    name: 'Wither Skeleton',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 26,
    speed: 3.1,
    damage: 5,
    attackRange: 1.9,
    width: 0.72,
    height: 2.35,
    primaryColor: '#262626',
    accentColor: '#525252',
    drops: [BlockType.COAL_ORE, BlockType.GOLD_BLOCK],
    description: 'Towering obsidian-boned warrior wielding a dark blade.',
  },
  spider: {
    type: 'spider',
    name: 'Spider',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 16,
    speed: 3.7,
    damage: 3,
    attackRange: 1.8,
    width: 1.15,
    height: 0.85,
    primaryColor: '#2b2422',
    accentColor: '#ef4444',
    drops: [BlockType.WOOL_WHITE, BlockType.COAL_ORE],
    description: 'Swift eight-legged predator with glowing red eyes.',
  },
  enderman: {
    type: 'enderman',
    name: 'Enderman',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 40,
    speed: 3.6,
    damage: 6,
    attackRange: 2.1,
    width: 0.7,
    height: 2.85,
    primaryColor: '#171717',
    accentColor: '#d946ef',
    drops: [BlockType.DIAMOND_ORE, BlockType.GRASS],
    description: 'Tall shadow wanderer that teleports mid-combat.',
  },
  witch: {
    type: 'witch',
    name: 'Witch',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 26,
    speed: 2.4,
    damage: 4,
    attackRange: 10.0,
    isRanged: true,
    width: 0.65,
    height: 2.05,
    primaryColor: '#6b21a8',
    accentColor: '#22c55e',
    drops: [BlockType.GLOWSTONE, BlockType.GLASS],
    description: 'Hat-wearing alchemist hurling arcane potion orbs.',
  },
  pillager: {
    type: 'pillager',
    name: 'Pillager',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 24,
    speed: 2.8,
    damage: 4,
    attackRange: 11.0,
    isRanged: true,
    width: 0.65,
    height: 1.95,
    primaryColor: '#64748b',
    accentColor: '#7f1d1d',
    drops: [BlockType.IRON_ORE, BlockType.WOOD_OAK],
    description: 'Crossbow raider patrolling across plains and hills.',
  },
  evoker: {
    type: 'evoker',
    name: 'Evoker',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 28,
    speed: 2.6,
    damage: 5,
    attackRange: 10.5,
    isRanged: true,
    width: 0.65,
    height: 1.95,
    primaryColor: '#334155',
    accentColor: '#eab308',
    drops: [BlockType.GOLD_BLOCK, BlockType.DIAMOND_ORE],
    description: 'Gold-robed illager mage summoning mystic bolts.',
  },
  phantom: {
    type: 'phantom',
    name: 'Phantom',
    category: 'hostile',
    moveMode: 'fly',
    maxHealth: 20,
    speed: 4.5,
    damage: 4,
    attackRange: 2.2,
    width: 1.35,
    height: 0.65,
    primaryColor: '#312e81',
    accentColor: '#4ade80',
    drops: [BlockType.GLASS, BlockType.COAL_ORE],
    description: 'Winged night sky glider that swoops down on explorers.',
  },
  blaze: {
    type: 'blaze',
    name: 'Blaze',
    category: 'hostile',
    moveMode: 'fly',
    maxHealth: 22,
    speed: 2.7,
    damage: 4,
    attackRange: 12.0,
    isRanged: true,
    width: 0.75,
    height: 1.8,
    primaryColor: '#f59e0b',
    accentColor: '#fef08a',
    drops: [BlockType.GLOWSTONE, BlockType.GOLD_ORE],
    description: 'Hovering fiery sentinel surrounded by orbiting blaze rods.',
  },
  slime: {
    type: 'slime',
    name: 'Slime',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 16,
    speed: 2.5,
    damage: 3,
    attackRange: 1.5,
    width: 1.0,
    height: 1.0,
    primaryColor: '#4ade80',
    accentColor: '#166534',
    drops: [BlockType.LEAVES_OAK, BlockType.GLASS],
    description: 'Translucent emerald cube hopping across terrain.',
  },
  guardian: {
    type: 'guardian',
    name: 'Guardian',
    category: 'hostile',
    moveMode: 'swim',
    maxHealth: 30,
    speed: 3.1,
    damage: 4,
    attackRange: 8.5,
    isRanged: true,
    width: 0.95,
    height: 0.95,
    primaryColor: '#14b8a6',
    accentColor: '#fb923c',
    drops: [BlockType.WATER, BlockType.DIAMOND_ORE],
    description: 'Spiky prismarine cyclops patrolling waterways.',
  },
  ghast: {
    type: 'ghast',
    name: 'Ghast',
    category: 'hostile',
    moveMode: 'fly',
    maxHealth: 24,
    speed: 2.3,
    damage: 6,
    attackRange: 16.0,
    isRanged: true,
    width: 2.2,
    height: 2.4,
    primaryColor: '#f8fafc',
    accentColor: '#cbd5e1',
    drops: [BlockType.TNT, BlockType.GLOWSTONE],
    description: 'Giant floating white spirit launching explosive fireballs.',
  },
  ravager: {
    type: 'ravager',
    name: 'Ravager',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 60,
    speed: 3.3,
    damage: 7,
    attackRange: 2.4,
    width: 1.45,
    height: 1.9,
    primaryColor: '#475569',
    accentColor: '#1e293b',
    drops: [BlockType.IRON_ORE, BlockType.GOLD_BLOCK],
    description: 'Heavy armored horned beast charging with massive knockback.',
  },
  warden: {
    type: 'warden',
    name: 'Warden',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 100,
    speed: 3.2,
    damage: 9,
    attackRange: 2.6,
    width: 1.15,
    height: 2.8,
    primaryColor: '#0f2933',
    accentColor: '#22d3ee',
    drops: [BlockType.SCULK, BlockType.DIAMOND_BLOCK],
    description: 'Colossal sculk titan that hunts by sound vibrations—sneaking stays quiet.',
  },
  creaking: {
    type: 'creaking',
    name: 'Creaking',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 32,
    speed: 3.9,
    damage: 5,
    attackRange: 2.0,
    width: 0.75,
    height: 2.45,
    primaryColor: '#5c534c',
    accentColor: '#f97316',
    drops: [BlockType.PALE_OAK_LOG, BlockType.PALE_OAK_LEAVES],
    biomes: ['pale_garden'],
    description: 'Eerie Pale Garden tree stalker that freezes solid when you look directly at it.',
  },
  piglin: {
    type: 'piglin',
    name: 'Piglin',
    category: 'hostile',
    moveMode: 'ground',
    maxHealth: 22,
    speed: 3.1,
    damage: 4,
    attackRange: 2.0,
    width: 0.65,
    height: 1.9,
    primaryColor: '#d97706',
    accentColor: '#fbbf24',
    drops: [BlockType.GOLD_ORE, BlockType.NETHERRACK],
    description: 'Gold-obsessed Nether warrior patrolling crimson basalt fortresses.',
  },

  // === BOSSES ===
  ender_dragon: {
    type: 'ender_dragon',
    name: 'Ender Dragon',
    category: 'boss',
    moveMode: 'fly',
    maxHealth: 140,
    speed: 5.5,
    damage: 7,
    attackRange: 18.0,
    isRanged: true,
    width: 3.2,
    height: 2.2,
    primaryColor: '#18181b',
    accentColor: '#c026d3',
    drops: [BlockType.DRAGON_EGG, BlockType.DIAMOND_BLOCK, BlockType.GOLD_BLOCK],
    description: 'Legendary winged dragon circling the void with ender breath.',
  },
  wither: {
    type: 'wither',
    name: 'Wither',
    category: 'boss',
    moveMode: 'fly',
    maxHealth: 120,
    speed: 3.8,
    damage: 6,
    attackRange: 16.0,
    isRanged: true,
    width: 1.8,
    height: 2.8,
    primaryColor: '#1c1917',
    accentColor: '#38bdf8',
    drops: [BlockType.NETHER_STAR, BlockType.DIAMOND_BLOCK, BlockType.TNT],
    description: 'Three-headed floating dark boss dropping Nether Stars for Beacons.',
  },

  // === FRIENDLY / GUARDIANS ===
  villager: {
    type: 'villager',
    name: 'Villager',
    category: 'friendly',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 1.8,
    damage: 0,
    attackRange: 0,
    width: 0.65,
    height: 1.95,
    primaryColor: '#8d6e63',
    accentColor: '#22c55e',
    drops: [BlockType.CRAFTING_TABLE, BlockType.BOOKSHELF],
    description: 'Peaceful robed townsfolk exploring nearby paths.',
  },
  wandering_trader: {
    type: 'wandering_trader',
    name: 'Wandering Trader',
    category: 'friendly',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 1.9,
    damage: 0,
    attackRange: 0,
    width: 0.65,
    height: 1.95,
    primaryColor: '#1d4ed8',
    accentColor: '#facc15',
    drops: [BlockType.GOLD_ORE, BlockType.GLASS],
    description: 'Blue-cloaked traveling merchant wandering across biomes.',
  },
  iron_golem: {
    type: 'iron_golem',
    name: 'Iron Golem',
    category: 'friendly',
    moveMode: 'ground',
    maxHealth: 80,
    speed: 2.4,
    damage: 11,
    attackRange: 2.3,
    width: 1.15,
    height: 2.65,
    primaryColor: '#e5e7eb',
    accentColor: '#65a30d',
    drops: [BlockType.IRON_ORE, BlockType.GOLD_ORE],
    description: 'Mighty mossy-iron protector that smashes hostile mobs.',
  },
  snow_golem: {
    type: 'snow_golem',
    name: 'Snow Golem',
    category: 'friendly',
    moveMode: 'ground',
    maxHealth: 16,
    speed: 2.0,
    damage: 2,
    attackRange: 9.0,
    isRanged: true,
    width: 0.65,
    height: 1.85,
    primaryColor: '#f8fafc',
    accentColor: '#f97316',
    drops: [BlockType.SNOW, BlockType.PUMPKIN],
    description: 'Pumpkin-headed snow sentry pelting bad guys with snowballs.',
  },

  // === PASSIVE ANIMALS ===
  pig: {
    type: 'pig',
    name: 'Pig',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 10,
    speed: 1.8,
    damage: 0,
    attackRange: 0,
    width: 0.85,
    height: 0.85,
    primaryColor: '#f9a8d4',
    accentColor: '#f472b6',
    drops: [BlockType.DIRT],
    description: 'Cheerful pink farm pig trotting across grassy meadows.',
  },
  cow: {
    type: 'cow',
    name: 'Cow',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 10,
    speed: 1.7,
    damage: 0,
    attackRange: 0,
    width: 0.9,
    height: 1.35,
    primaryColor: '#5d4037',
    accentColor: '#f5f5f4',
    drops: [BlockType.GRASS],
    description: 'Spotted pasture cow grazing calmly in plains.',
  },
  mooshroom: {
    type: 'mooshroom',
    name: 'Mooshroom',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 12,
    speed: 1.8,
    damage: 0,
    attackRange: 0,
    width: 0.9,
    height: 1.35,
    primaryColor: '#dc2626',
    accentColor: '#fef2f2',
    drops: [BlockType.WOOL_RED],
    description: 'Scarlet mushroom-topped cow roaming wild groves.',
  },
  sheep: {
    type: 'sheep',
    name: 'Sheep',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 8,
    speed: 1.8,
    damage: 0,
    attackRange: 0,
    width: 0.85,
    height: 1.15,
    primaryColor: '#f5f5f5',
    accentColor: '#e7d3be',
    drops: [BlockType.WOOL_WHITE],
    description: 'Fluffy wool-coated sheep wandering across meadows.',
  },
  chicken: {
    type: 'chicken',
    name: 'Chicken',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 6,
    speed: 2.1,
    damage: 0,
    attackRange: 0,
    width: 0.5,
    height: 0.7,
    primaryColor: '#ffffff',
    accentColor: '#f59e0b',
    drops: [BlockType.WOOL_WHITE],
    description: 'Flapping white chicken pecking along hillsides.',
  },
  wolf: {
    type: 'wolf',
    name: 'Wolf',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 12,
    speed: 2.6,
    damage: 0,
    attackRange: 0,
    width: 0.7,
    height: 0.85,
    primaryColor: '#d4d4d8',
    accentColor: '#52525b',
    drops: [BlockType.WOOD_OAK],
    biomes: ['forest', 'mountains', 'plains'],
    description: 'Alert timber wolf roaming forest edges.',
  },
  fox: {
    type: 'fox',
    name: 'Fox',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 10,
    speed: 2.9,
    damage: 0,
    attackRange: 0,
    width: 0.65,
    height: 0.65,
    primaryColor: '#ea580c',
    accentColor: '#fff7ed',
    drops: [BlockType.LEAVES_OAK],
    biomes: ['forest', 'cherry', 'autumn'],
    description: 'Quick orange woodland fox darting between trees.',
  },
  polar_bear: {
    type: 'polar_bear',
    name: 'Polar Bear',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 26,
    speed: 2.1,
    damage: 0,
    attackRange: 0,
    width: 1.2,
    height: 1.35,
    primaryColor: '#f8fafc',
    accentColor: '#cbd5e1',
    drops: [BlockType.SNOW],
    biomes: ['mountains'],
    description: 'Mighty white arctic bear striding over high peaks.',
  },
  bee: {
    type: 'bee',
    name: 'Bee',
    category: 'passive',
    moveMode: 'fly',
    maxHealth: 8,
    speed: 2.7,
    damage: 0,
    attackRange: 0,
    width: 0.55,
    height: 0.55,
    primaryColor: '#facc15',
    accentColor: '#1f2937',
    drops: [BlockType.GOLD_ORE],
    biomes: ['cherry', 'plains', 'forest'],
    description: 'Buzzing golden striped bee fluttering over blossoms.',
  },
  parrot: {
    type: 'parrot',
    name: 'Parrot',
    category: 'passive',
    moveMode: 'fly',
    maxHealth: 6,
    speed: 3.1,
    damage: 0,
    attackRange: 0,
    width: 0.45,
    height: 0.65,
    primaryColor: '#ef4444',
    accentColor: '#3b82f6',
    drops: [BlockType.WOOL_BLUE],
    biomes: ['forest', 'cherry'],
    description: 'Colorful tropical bird gliding above forest canopies.',
  },
  frog: {
    type: 'frog',
    name: 'Frog',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 8,
    speed: 2.1,
    damage: 0,
    attackRange: 0,
    width: 0.55,
    height: 0.45,
    primaryColor: '#65a30d',
    accentColor: '#d9f99d',
    drops: [BlockType.LEAVES_OAK],
    description: 'Springy green marsh frog hopping near lakes.',
  },
  panda: {
    type: 'panda',
    name: 'Panda',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 18,
    speed: 1.5,
    damage: 0,
    attackRange: 0,
    width: 1.0,
    height: 1.15,
    primaryColor: '#f8fafc',
    accentColor: '#18181b',
    drops: [BlockType.LEAVES_CHERRY],
    biomes: ['cherry', 'forest'],
    description: 'Gentle black-and-white panda lounging in blossom groves.',
  },
  horse: {
    type: 'horse',
    name: 'Horse',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 20,
    speed: 3.0,
    damage: 0,
    attackRange: 0,
    width: 0.95,
    height: 1.55,
    primaryColor: '#92400e',
    accentColor: '#f5f5f4',
    drops: [BlockType.PLANKS_OAK],
    biomes: ['plains'],
    description: 'Fast galloping steed roaming open plains.',
  },
  camel: {
    type: 'camel',
    name: 'Camel',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 24,
    speed: 2.2,
    damage: 0,
    attackRange: 0,
    width: 1.0,
    height: 2.0,
    primaryColor: '#d97706',
    accentColor: '#fde68a',
    drops: [BlockType.SAND],
    biomes: ['desert'],
    description: 'Tall desert camel striding gracefully across dunes.',
  },
  llama: {
    type: 'llama',
    name: 'Llama',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 16,
    speed: 2.0,
    damage: 0,
    attackRange: 0,
    width: 0.85,
    height: 1.75,
    primaryColor: '#fef3c7',
    accentColor: '#b45309',
    drops: [BlockType.WOOL_WHITE],
    biomes: ['mountains', 'plains'],
    description: 'Highland llama with patterned saddle blanket.',
  },
  turtle: {
    type: 'turtle',
    name: 'Turtle',
    category: 'passive',
    moveMode: 'swim',
    maxHealth: 16,
    speed: 1.4,
    damage: 0,
    attackRange: 0,
    width: 0.85,
    height: 0.45,
    primaryColor: '#16a34a',
    accentColor: '#86efac',
    drops: [BlockType.SAND],
    description: 'Armored green sea turtle cruising coastal waters.',
  },
  axolotl: {
    type: 'axolotl',
    name: 'Axolotl',
    category: 'passive',
    moveMode: 'swim',
    maxHealth: 14,
    speed: 2.0,
    damage: 0,
    attackRange: 0,
    width: 0.7,
    height: 0.4,
    primaryColor: '#f9a8d4',
    accentColor: '#ec4899',
    drops: [BlockType.WATER],
    description: 'Playful pink aquatic salamander with feathery gills.',
  },
  squid: {
    type: 'squid',
    name: 'Glow Squid',
    category: 'passive',
    moveMode: 'swim',
    maxHealth: 10,
    speed: 1.8,
    damage: 0,
    attackRange: 0,
    width: 0.75,
    height: 1.15,
    primaryColor: '#06b6d4',
    accentColor: '#67e8f9',
    drops: [BlockType.GLOWSTONE],
    description: 'Luminous cyan underwater squid drifting with trailing tentacles.',
  },
  rabbit: {
    type: 'rabbit',
    name: 'Rabbit',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 6,
    speed: 2.9,
    damage: 0,
    attackRange: 0,
    width: 0.45,
    height: 0.55,
    primaryColor: '#d6b38b',
    accentColor: '#ffffff',
    drops: [BlockType.GRASS],
    description: 'Quick long-eared bunny bounding across turf and sand.',
  },
  cat: {
    type: 'cat',
    name: 'Ocelot Cat',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 10,
    speed: 2.6,
    damage: 0,
    attackRange: 0,
    width: 0.55,
    height: 0.65,
    primaryColor: '#fbbf24',
    accentColor: '#78350f',
    drops: [BlockType.WOOL_WHITE],
    description: 'Nimble spotted feline with bright emerald eyes.',
  },
  sniffer: {
    type: 'sniffer',
    name: 'Sniffer',
    category: 'passive',
    moveMode: 'ground',
    maxHealth: 18,
    speed: 1.4,
    damage: 0,
    attackRange: 0,
    width: 1.45,
    height: 1.35,
    primaryColor: '#991b1b',
    accentColor: '#15803d',
    drops: [BlockType.GRASS, BlockType.LEAVES_CHERRY],
    description: 'Gentle mossy-shelled ancient creature with golden snout.',
  },
};

export const ALL_MOB_TYPES = Object.keys(MOB_CATALOG) as MobType[];

export interface NpcTradeOffer {
  id: string;
  label: string;
  costBlock: BlockType;
  costCount: number;
  rewardBlock: BlockType;
  rewardCount: number;
}

export interface NpcInteractionData {
  id: string;
  type: MobType;
  name: string;
  role: string;
  primaryColor: string;
  accentColor: string;
  greetings: string[];
  tips: string[];
  giftBlock: BlockType;
  giftCount: number;
  giftReadyInSec: number;
  canHeal: boolean;
  canEscort: boolean;
  escortRemainingSec: number;
  nearbyHostileCount: number;
  trades: NpcTradeOffer[];
}

export interface MobEntity {
  id: string;
  def: MobDefinition;
  group: THREE.Group;
  head?: THREE.Object3D;
  limbs: THREE.Object3D[];
  wings?: THREE.Object3D[];
  orbitGroup?: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  health: number;
  maxHealth: number;
  hurtTimer: number;
  isHurtFlashing: boolean;
  isFuseFlashing: boolean;
  creeperFuse: number; // 0..1.35s
  hissPlayed: boolean;
  attackCooldown: number;
  wanderTimer: number;
  wanderAngle: number;
  animTime: number;
  age: number;
  // Interactive NPC metadata
  npcName?: string;
  npcRole?: string;
  npcVariant?: number;
  interactCooldownUntil?: number;
  followTimer?: number;
  greetedPlayer?: boolean;
  alertTimer?: number;
  isNamed?: boolean;
  isPermanentBaby?: boolean;
  hasHelmet?: boolean;
  isFrozenByGaze?: boolean;
  spatialHandle?: WorldEntity<MobEntity>;
}

interface MobProjectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  explosive: boolean;
  fromFriendly: boolean;
  age: number;
}

export interface TargetedMobInfo {
  id: string;
  name: string;
  npcRole?: string;
  category: MobCategory;
  health: number;
  maxHealth: number;
}

export interface RadarMobPoint {
  id: string;
  x: number;
  z: number;
  category: MobCategory;
  name: string;
}

const MAX_ACTIVE_MOBS_DESKTOP = 22;
const MAX_ACTIVE_MOBS_MOBILE = 14;
const MAX_HOSTILES_DESKTOP = 5;
const MAX_HOSTILES_MOBILE = 3;

const VILLAGER_PERSONAS: { name: string; role: string }[] = [
  { name: 'Elder Rowan', role: 'Master Builder' },
  { name: 'Smithy Kael', role: 'Ore Blacksmith' },
  { name: 'Mason Bram', role: 'Stone Mason' },
  { name: 'Scholar Lyra', role: 'World Explorer' },
];

const TRADER_PERSONAS: { name: string; role: string }[] = [
  { name: 'Merchant Lira', role: 'Traveling Merchant' },
  { name: 'Nomad Fenn', role: 'Rare Relic Trader' },
];

export class MobManager {
  public scene: THREE.Scene;
  public world: VoxelWorld;
  public mobs: MobEntity[] = [];
  private projectiles: MobProjectile[] = [];
  private particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];

  private geoCache: Map<string, THREE.BufferGeometry> = new Map();
  private matCache: Map<string, THREE.MeshStandardMaterial> = new Map();
  private texCache: Map<string, THREE.CanvasTexture> = new Map();
  private hurtMat: THREE.MeshStandardMaterial;
  private fuseMat: THREE.MeshStandardMaterial;

  private maxActiveMobs: number;
  private maxHostiles: number;
  private spawnTimer: number = 1.0;
  private graceTimer: number = 25.0; // Brief calm exploration window before bad guys appear around map
  private graceEndedNotified: boolean = false;
  private waveTimer: number = 35.0; // Starts counting only after starter grace ends
  private waveNumber: number = 0;
  private progressScore: number = 0;
  private threatTier: number = 1; // 1 (Weakest) .. 5 (Bosses)
  private highestAnnouncedTier: number = 1;
  private idCounter: number = 1;
  private rngState: number;
  private nearbyEntityBuf: WorldEntity[] = [];
  private rayQueryBuf: WorldEntity[] = [];

  public onMobKilled?: (def: MobDefinition, killedMob?: MobEntity) => void;
  public onVillainWave?: (waveNumber: number, villainNames: string[]) => void;
  public onTierUp?: (tier: number, title: string, detail: string) => void;
  public onGraceEnd?: () => void;
  public onBlocksExploded?: (changes: { x: number; y: number; z: number; block: BlockType }[]) => void;

  constructor(scene: THREE.Scene, world: VoxelWorld, seed = 12345) {
    this.scene = scene;
    this.world = world;
    this.rngState = (seed ^ 0x5f3759df) >>> 0 || 12345;
    const isMobile =
      typeof window !== 'undefined' &&
      ((window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 768);
    this.maxActiveMobs = isMobile ? MAX_ACTIVE_MOBS_MOBILE : MAX_ACTIVE_MOBS_DESKTOP;
    this.maxHostiles = isMobile ? MAX_HOSTILES_MOBILE : MAX_HOSTILES_DESKTOP;

    this.hurtMat = new THREE.MeshStandardMaterial({
      color: 0xff3b3b,
      emissive: 0xaa1111,
      emissiveIntensity: 0.65,
      roughness: 0.6,
    });
    this.fuseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });
  }

  public static getThreatTierFromScore(score: number): number {
    if (score >= 420) return 5;
    if (score >= 240) return 4;
    if (score >= 120) return 3;
    if (score >= 45) return 2;
    return 1;
  }

  public static getTierMeta(tier: number): { title: string; detail: string } {
    switch (tier) {
      case 5:
        return { title: 'Tier 5 · Apex & Bosses', detail: 'Warden, Ender Dragon & Wither now stalk the world!' };
      case 4:
        return { title: 'Tier 4 · Elite Raiders', detail: 'Endermen, Wither Skeletons, Evokers & Ravagers unlocked!' };
      case 3:
        return { title: 'Tier 3 · Dangerous Wilds', detail: 'Pillagers, Witches, Phantoms & Blazes now patrol!' };
      case 2:
        return { title: 'Tier 2 · Rising Threats', detail: 'Skeletons, Creepers, Husks & Drowned have appeared!' };
      default:
        return { title: 'Tier 1 · Starter Skirmish', detail: 'Slimes, Spiders & Zombies wander nearby.' };
    }
  }

  public setProgressScore(score: number, silent = false): void {
    this.progressScore = Math.max(0, score);
    const nextTier = MobManager.getThreatTierFromScore(this.progressScore);
    this.threatTier = nextTier;
    // Veteran players re-entering a progressed map still enjoy a brief calm landing window
    if (silent && this.progressScore >= 90) {
      this.graceTimer = Math.min(this.graceTimer, 20.0);
    }
    if (nextTier > this.highestAnnouncedTier) {
      this.highestAnnouncedTier = nextTier;
      if (!silent) {
        const meta = MobManager.getTierMeta(nextTier);
        this.onTierUp?.(nextTier, meta.title, meta.detail);
      }
    }
  }

  public getThreatTier(): number {
    return this.threatTier;
  }

  private rand(): number {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return this.rngState / 4294967296;
  }

  private getBoxGeo(w: number, h: number, d: number): THREE.BufferGeometry {
    const key = `${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    let geo = this.geoCache.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.geoCache.set(key, geo);
    }
    return geo;
  }

  private getColorMat(hex: string, options?: { transparent?: boolean; opacity?: number; emissive?: string; emissiveIntensity?: number }): THREE.MeshStandardMaterial {
    const key = `${hex}_${options?.transparent ? 1 : 0}_${options?.opacity ?? 1}_${options?.emissive ?? ''}_${options?.emissiveIntensity ?? 0}`;
    let mat = this.matCache.get(key);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.85,
        metalness: 0.05,
        transparent: !!options?.transparent,
        opacity: options?.opacity ?? 1,
        emissive: options?.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
        emissiveIntensity: options?.emissiveIntensity ?? 0,
      });
      this.matCache.set(key, mat);
    }
    return mat;
  }

  private getFaceMat(key: string, grid: string[], palette: Record<string, string>, emissiveHex?: string): THREE.MeshStandardMaterial {
    const cacheKey = `face_${key}`;
    let mat = this.matCache.get(cacheKey);
    if (mat) return mat;

    const size = grid.length;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < size; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        ctx.fillStyle = palette[ch] || '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.texCache.set(cacheKey, tex);

    mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.04,
      emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color(0x000000),
      emissiveMap: emissiveHex ? tex : undefined,
      emissiveIntensity: emissiveHex ? 0.35 : 0,
    });
    this.matCache.set(cacheKey, mat);
    return mat;
  }

  private makeBox(w: number, h: number, d: number, mat: THREE.Material | THREE.Material[]): THREE.Mesh {
    const mesh = new THREE.Mesh(this.getBoxGeo(w, h, d), mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.origMat = mat;
    return mesh;
  }

  private buildFaceBox(w: number, h: number, d: number, bodyMat: THREE.MeshStandardMaterial, faceMat: THREE.MeshStandardMaterial): THREE.Mesh {
    // Three.js BoxGeometry material order: +X, -X, +Y, -Y, +Z, -Z.
    // Mobs face -Z forward so yaw=0 aligns with look direction (-Z).
    const mats = [bodyMat, bodyMat, bodyMat, bodyMat, bodyMat, faceMat];
    return this.makeBox(w, h, d, mats);
  }

  private createMobMesh(def: MobDefinition): {
    group: THREE.Group;
    head?: THREE.Object3D;
    limbs: THREE.Object3D[];
    wings?: THREE.Object3D[];
    orbitGroup?: THREE.Object3D;
  } {
    const group = new THREE.Group();
    const limbs: THREE.Object3D[] = [];
    const wings: THREE.Object3D[] = [];
    let head: THREE.Object3D | undefined;
    let orbitGroup: THREE.Object3D | undefined;

    const pMat = this.getColorMat(def.primaryColor);
    const aMat = this.getColorMat(def.accentColor);
    const darkMat = this.getColorMat('#18181b');
    const eyeWhite = this.getColorMat('#ffffff');
    const blackMat = this.getColorMat('#09090b');

    switch (def.type) {
      case 'creaking': {
        const barkMat = this.getColorMat('#59504a');
        const eyeGlow = this.getColorMat('#f97316', { emissive: '#f97316', emissiveIntensity: 0.9 });
        const body = this.makeBox(0.54, 1.35, 0.34, barkMat);
        body.position.y = 1.25;
        group.add(body);

        const headMesh = this.makeBox(0.46, 0.62, 0.42, barkMat);
        headMesh.position.set(0.06, 2.15, 0);
        const eye1 = this.makeBox(0.09, 0.08, 0.05, eyeGlow);
        eye1.position.set(-0.1, 0.08, -0.22);
        const eye2 = this.makeBox(0.09, 0.08, 0.05, eyeGlow);
        eye2.position.set(0.11, 0.02, -0.22);
        const eye3 = this.makeBox(0.08, 0.07, 0.05, eyeGlow);
        eye3.position.set(0.01, -0.1, -0.22);
        headMesh.add(eye1, eye2, eye3);
        group.add(headMesh);
        head = headMesh;

        [-0.38, 0.38].forEach((ax, idx) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.85, 0);
          const arm = this.makeBox(0.16, 1.15, 0.16, idx === 0 ? barkMat : aMat);
          arm.position.y = -0.52;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });
        [-0.16, 0.16].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.68, 0);
          const leg = this.makeBox(0.18, 0.68, 0.18, barkMat);
          leg.position.y = -0.34;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }
      case 'piglin': {
        const skinMat = this.getColorMat('#e7a675');
        const goldArmor = this.getColorMat('#fbbf24');
        const body = this.makeBox(0.5, 0.72, 0.28, aMat);
        body.position.y = 1.06;
        group.add(body);

        const headMesh = this.makeBox(0.48, 0.48, 0.48, skinMat);
        headMesh.position.y = 1.66;
        const snout = this.makeBox(0.24, 0.16, 0.12, skinMat);
        snout.position.set(0, -0.05, -0.26);
        const crest = this.makeBox(0.5, 0.14, 0.5, goldArmor);
        crest.position.set(0, 0.2, 0);
        headMesh.add(snout, crest);
        group.add(headMesh);
        head = headMesh;

        [-0.36, 0.36].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.38, 0);
          const arm = this.makeBox(0.2, 0.68, 0.2, skinMat);
          arm.position.y = -0.3;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });
        [-0.13, 0.13].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.7, 0);
          const leg = this.makeBox(0.22, 0.7, 0.22, pMat);
          leg.position.y = -0.35;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }
      case 'creeper': {
        const body = this.makeBox(0.5, 0.78, 0.32, pMat);
        body.position.y = 0.78;
        group.add(body);

        const faceMat = this.getFaceMat('creeper', [
          'gggggggg',
          'gddggddg',
          'gddggddg',
          'gggdgggg',
          'ggdddggg',
          'ggdddggg',
          'ggdgdggg',
          'gggggggg',
        ], { g: '#43a047', d: '#111827' });
        const headMesh = this.buildFaceBox(0.48, 0.48, 0.48, pMat, faceMat);
        headMesh.position.y = 1.41;
        group.add(headMesh);
        head = headMesh;

        const legOffsets = [
          [-0.14, 0.39, -0.18],
          [0.14, 0.39, -0.18],
          [-0.14, 0.39, 0.18],
          [0.14, 0.39, 0.18],
        ];
        legOffsets.forEach(([lx, ly, lz]) => {
          const pivot = new THREE.Group();
          pivot.position.set(lx, ly, lz);
          const leg = this.makeBox(0.2, 0.39, 0.2, aMat);
          leg.position.y = -0.195;
          pivot.add(leg);
          group.add(pivot);
          limbs.push(pivot);
        });
        break;
      }

      case 'zombie':
      case 'husk':
      case 'drowned': {
        const skinColor = def.type === 'husk' ? '#b09b7c' : def.type === 'drowned' ? '#38b2ac' : '#52a447';
        const shirtColor = def.type === 'husk' ? '#7c6f5b' : def.type === 'drowned' ? '#1d4044' : '#00acc1';
        const pantsColor = def.type === 'husk' ? '#5c5346' : def.type === 'drowned' ? '#134e4a' : '#3949ab';
        const skinMat = this.getColorMat(skinColor);
        const shirtMat = this.getColorMat(shirtColor);
        const pantsMat = this.getColorMat(pantsColor);

        const torso = this.makeBox(0.5, 0.72, 0.26, shirtMat);
        torso.position.y = 1.06;
        group.add(torso);

        const faceMat = this.getFaceMat(`face_${def.type}`, [
          'ssssssss',
          'ssssssss',
          'sddssdds',
          'sddssdds',
          'sssdssss',
          'ssddddss',
          'ssssssss',
          'ssssssss',
        ], {
          s: skinColor,
          d: def.type === 'drowned' ? '#22d3ee' : '#1f2937',
        }, def.type === 'drowned' ? '#22d3ee' : undefined);

        const headMesh = this.buildFaceBox(0.46, 0.46, 0.46, skinMat, faceMat);
        headMesh.position.y = 1.65;
        group.add(headMesh);
        head = headMesh;

        // Zombie outstretched arms
        [-0.35, 0.35].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.38, 0);
          const arm = this.makeBox(0.2, 0.65, 0.2, skinMat);
          arm.position.set(0, -0.25, -0.22);
          arm.rotation.x = Math.PI / 2.2;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });

        [-0.13, 0.13].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.7, 0);
          const leg = this.makeBox(0.22, 0.7, 0.22, pantsMat);
          leg.position.y = -0.35;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'skeleton':
      case 'wither_skeleton': {
        const isWither = def.type === 'wither_skeleton';
        const scale = isWither ? 1.2 : 1.0;
        const boneMat = this.getColorMat(isWither ? '#27272a' : '#e5e7eb');
        const faceMat = this.getFaceMat(`face_${def.type}`, [
          'bbbbbbbb',
          'bbbbbbbb',
          'bwwbbwwb',
          'bwwbbwwb',
          'bbbbbbbb',
          'bddddddB'.toLowerCase(),
          'bwbwbwbw',
          'bbbbbbbb',
        ], {
          b: isWither ? '#27272a' : '#e5e7eb',
          w: isWither ? '#52525b' : '#18181b',
          d: '#18181b',
        });

        const ribcage = this.makeBox(0.44 * scale, 0.7 * scale, 0.2 * scale, boneMat);
        ribcage.position.y = 1.05 * scale;
        group.add(ribcage);

        const headMesh = this.buildFaceBox(0.46 * scale, 0.46 * scale, 0.46 * scale, boneMat, faceMat);
        headMesh.position.y = 1.64 * scale;
        group.add(headMesh);
        head = headMesh;

        [-0.32 * scale, 0.32 * scale].forEach((ax, idx) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.36 * scale, 0);
          const arm = this.makeBox(0.12 * scale, 0.65 * scale, 0.12 * scale, boneMat);
          arm.position.y = -0.28 * scale;
          armPivot.add(arm);
          if (idx === 1) {
            if (isWither) {
              const sword = this.makeBox(0.08, 0.7, 0.14, this.getColorMat('#52525b'));
              sword.position.set(0, -0.58, -0.22);
              sword.rotation.x = Math.PI / 3;
              armPivot.add(sword);
            } else {
              const bow = this.makeBox(0.08, 0.5, 0.12, this.getColorMat('#78350f'));
              bow.position.set(0, -0.35, -0.26);
              armPivot.add(bow);
            }
          }
          group.add(armPivot);
          limbs.push(armPivot);
        });

        [-0.13 * scale, 0.13 * scale].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.7 * scale, 0);
          const leg = this.makeBox(0.12 * scale, 0.7 * scale, 0.12 * scale, boneMat);
          leg.position.y = -0.35 * scale;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'enderman': {
        const body = this.makeBox(0.46, 0.78, 0.24, darkMat);
        body.position.y = 1.85;
        group.add(body);

        const faceMat = this.getFaceMat('enderman', [
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
          'ppwbbwpp',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
        ], { b: '#111111', p: '#e879f9', w: '#f5d0fe' }, '#d946ef');
        const headMesh = this.buildFaceBox(0.46, 0.46, 0.46, darkMat, faceMat);
        headMesh.position.y = 2.48;
        group.add(headMesh);
        head = headMesh;

        // Held grass block
        const grassBlock = this.makeBox(0.36, 0.36, 0.36, this.getColorMat('#4ade80'));
        grassBlock.position.set(0, 1.5, -0.45);
        group.add(grassBlock);

        [-0.31, 0.31].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 2.2, 0);
          const arm = this.makeBox(0.13, 1.25, 0.13, darkMat);
          arm.position.set(0, -0.58, -0.15);
          arm.rotation.x = 0.4;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });

        [-0.14, 0.14].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 1.46, 0);
          const leg = this.makeBox(0.13, 1.46, 0.13, darkMat);
          leg.position.y = -0.73;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'spider': {
        const abdomen = this.makeBox(0.68, 0.48, 0.72, pMat);
        abdomen.position.set(0, 0.45, 0.42);
        const thorax = this.makeBox(0.46, 0.38, 0.44, pMat);
        thorax.position.set(0, 0.42, -0.12);
        group.add(abdomen, thorax);

        const faceMat = this.getFaceMat('spider', [
          'bbbbbbbb',
          'brrbbbrr',
          'bbbbbbbb',
          'brbbrbbr',
          'bbbbbbbb',
          'bwwbbwwb',
          'bbbbbbbb',
          'bbbbbbbb',
        ], { b: '#27201e', r: '#ef4444', w: '#991b1b' }, '#ef4444');
        const headMesh = this.buildFaceBox(0.44, 0.38, 0.4, pMat, faceMat);
        headMesh.position.set(0, 0.44, -0.52);
        group.add(headMesh);
        head = headMesh;

        // 8 Spider legs
        for (let side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            const pivot = new THREE.Group();
            pivot.position.set(side * 0.25, 0.42, -0.3 + i * 0.24);
            const leg = this.makeBox(0.62, 0.1, 0.1, darkMat);
            leg.position.set(side * 0.3, -0.14, 0);
            leg.rotation.z = side * -0.45;
            pivot.add(leg);
            group.add(pivot);
            limbs.push(pivot);
          }
        }
        break;
      }

      case 'villager':
      case 'wandering_trader':
      case 'witch':
      case 'pillager':
      case 'evoker': {
        const robeColor =
          def.type === 'villager'
            ? '#795548'
            : def.type === 'wandering_trader'
            ? '#1d4ed8'
            : def.type === 'witch'
            ? '#581c87'
            : def.type === 'pillager'
            ? '#475569'
            : '#1e293b';
        const skinColor = def.type === 'pillager' || def.type === 'evoker' ? '#94a3b8' : '#d6a582';
        const robeMat = this.getColorMat(robeColor);
        const skinMat = this.getColorMat(skinColor);

        const body = this.makeBox(0.52, 0.95, 0.34, robeMat);
        body.position.y = 0.95;
        group.add(body);

        const trim = this.makeBox(0.56, 0.18, 0.36, aMat);
        trim.position.y = 0.65;
        group.add(trim);

        // Tall Villager/Illager head + iconic nose
        const faceMat = this.getFaceMat(`face_${def.type}`, [
          'ssssssss',
          'sbbbbbbS'.toLowerCase(),
          'swesssew',
          'sssnnsss',
          'sssnnsss',
          'ssssssss',
          'ssmmmmss',
          'ssssssss',
        ], {
          s: skinColor,
          b: '#1f2937',
          w: '#ffffff',
          e: def.type === 'villager' || def.type === 'wandering_trader' ? '#16a34a' : '#334155',
          n: skinColor,
          m: '#57534e',
        });
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.68;
        const headMesh = this.buildFaceBox(0.46, 0.54, 0.46, skinMat, faceMat);
        const nose = this.makeBox(0.12, 0.2, 0.14, skinMat);
        nose.position.set(0, -0.06, -0.28);
        headGroup.add(headMesh, nose);

        if (def.type === 'witch') {
          const brim = this.makeBox(0.72, 0.08, 0.72, darkMat);
          brim.position.y = 0.28;
          const cone = this.makeBox(0.42, 0.35, 0.42, darkMat);
          cone.position.y = 0.48;
          const band = this.makeBox(0.45, 0.08, 0.45, this.getColorMat('#22c55e'));
          band.position.y = 0.35;
          headGroup.add(brim, cone, band);
        } else if (def.type === 'wandering_trader') {
          const hood = this.makeBox(0.5, 0.2, 0.5, this.getColorMat('#1e40af'));
          hood.position.y = 0.22;
          headGroup.add(hood);
        }

        group.add(headGroup);
        head = headGroup;

        // Crossbow for Pillager
        if (def.type === 'pillager') {
          const bow = this.makeBox(0.42, 0.1, 0.38, this.getColorMat('#78350f'));
          bow.position.set(0.15, 1.15, -0.38);
          group.add(bow);
        }

        [-0.14, 0.14].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.48, 0);
          const leg = this.makeBox(0.22, 0.48, 0.24, darkMat);
          leg.position.y = -0.24;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'iron_golem': {
        const ironMat = this.getColorMat('#e2e8f0');
        const vineMat = this.getColorMat('#65a30d');
        const torso = this.makeBox(0.95, 0.95, 0.52, ironMat);
        torso.position.y = 1.65;
        const waist = this.makeBox(0.56, 0.35, 0.36, ironMat);
        waist.position.y = 1.02;
        const vine = this.makeBox(0.98, 0.22, 0.54, vineMat);
        vine.position.y = 1.85;
        group.add(torso, waist, vine);

        const faceMat = this.getFaceMat('iron_golem', [
          'iiiiiiii',
          'ibbbbbbi',
          'irriirri',
          'iiinniii',
          'iiinniii',
          'iiiiiiii',
          'iiinniii',
          'iiiiiiii',
        ], { i: '#e2e8f0', b: '#475569', r: '#dc2626', n: '#cbd5e1' });
        const headGroup = new THREE.Group();
        headGroup.position.y = 2.38;
        const headMesh = this.buildFaceBox(0.48, 0.54, 0.48, ironMat, faceMat);
        const nose = this.makeBox(0.14, 0.22, 0.14, ironMat);
        nose.position.set(0, -0.06, -0.28);
        headGroup.add(headMesh, nose);
        group.add(headGroup);
        head = headGroup;

        [-0.64, 0.64].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 2.05, 0);
          const arm = this.makeBox(0.28, 1.35, 0.28, ironMat);
          arm.position.y = -0.62;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });

        [-0.24, 0.24].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.85, 0);
          const leg = this.makeBox(0.32, 0.85, 0.34, ironMat);
          leg.position.y = -0.42;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'snow_golem': {
        const snowMat = this.getColorMat('#f8fafc');
        const bottom = this.makeBox(0.65, 0.62, 0.65, snowMat);
        bottom.position.y = 0.31;
        const mid = this.makeBox(0.54, 0.56, 0.54, snowMat);
        mid.position.y = 0.9;
        group.add(bottom, mid);

        const pumpkinFace = this.getFaceMat('snow_golem', [
          'oooooooo',
          'oodooddo',
          'oodooddo',
          'oooooooo',
          'oddddddo',
          'odododdo',
          'oooooooo',
          'oooooooo',
        ], { o: '#ea580c', d: '#1c1917' });
        const headMesh = this.buildFaceBox(0.48, 0.48, 0.48, this.getColorMat('#ea580c'), pumpkinFace);
        headMesh.position.y = 1.42;
        group.add(headMesh);
        head = headMesh;

        [-0.38, 0.38].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.05, 0);
          const stick = this.makeBox(0.42, 0.08, 0.08, this.getColorMat('#78350f'));
          stick.position.x = Math.sign(ax) * 0.18;
          armPivot.add(stick);
          group.add(armPivot);
          limbs.push(armPivot);
        });
        break;
      }

      case 'warden': {
        const sculkMat = this.getColorMat('#0f2933');
        const glowCyan = this.getColorMat('#22d3ee', { emissive: '#06b6d4', emissiveIntensity: 0.7 });
        const chestMat = this.getFaceMat('warden_chest', [
          'ssssssss',
          'sccccccs',
          'scddddcs',
          'scdccdcs',
          'scddddcs',
          'sccccccs',
          'ssssssss',
          'ssssssss',
        ], { s: '#0f2933', c: '#22d3ee', d: '#083344' }, '#22d3ee');

        const torso = this.buildFaceBox(0.95, 1.1, 0.55, sculkMat, chestMat);
        torso.position.y = 1.48;
        group.add(torso);

        const headGroup = new THREE.Group();
        headGroup.position.y = 2.28;
        const headMesh = this.makeBox(0.7, 0.62, 0.52, sculkMat);
        const mouth = this.makeBox(0.4, 0.16, 0.04, glowCyan);
        mouth.position.set(0, -0.1, -0.27);
        const hornL = this.makeBox(0.22, 0.44, 0.14, glowCyan);
        hornL.position.set(-0.44, 0.18, 0);
        const hornR = this.makeBox(0.22, 0.44, 0.14, glowCyan);
        hornR.position.set(0.44, 0.18, 0);
        headGroup.add(headMesh, mouth, hornL, hornR);
        group.add(headGroup);
        head = headGroup;

        [-0.64, 0.64].forEach((ax) => {
          const armPivot = new THREE.Group();
          armPivot.position.set(ax, 1.95, 0);
          const arm = this.makeBox(0.32, 1.25, 0.32, sculkMat);
          arm.position.y = -0.58;
          armPivot.add(arm);
          group.add(armPivot);
          limbs.push(armPivot);
        });

        [-0.26, 0.26].forEach((lx) => {
          const legPivot = new THREE.Group();
          legPivot.position.set(lx, 0.92, 0);
          const leg = this.makeBox(0.34, 0.92, 0.34, sculkMat);
          leg.position.y = -0.46;
          legPivot.add(leg);
          group.add(legPivot);
          limbs.push(legPivot);
        });
        break;
      }

      case 'ender_dragon': {
        const bodyMat = this.getColorMat('#18181b');
        const spineMat = this.getColorMat('#52525b');
        const eyePurple = this.getColorMat('#d946ef', { emissive: '#c026d3', emissiveIntensity: 0.9 });

        const body = this.makeBox(1.1, 0.9, 2.2, bodyMat);
        body.position.y = 0.9;
        group.add(body);

        const neck = this.makeBox(0.42, 0.42, 1.1, bodyMat);
        neck.position.set(0, 1.1, -1.4);
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.2, -2.05);
        const skull = this.makeBox(0.65, 0.56, 0.85, bodyMat);
        const snout = this.makeBox(0.48, 0.3, 0.45, spineMat);
        snout.position.set(0, -0.08, -0.55);
        const eyeL = this.makeBox(0.14, 0.1, 0.1, eyePurple);
        eyeL.position.set(-0.22, 0.08, -0.43);
        const eyeR = this.makeBox(0.14, 0.1, 0.1, eyePurple);
        eyeR.position.set(0.22, 0.08, -0.43);
        headGroup.add(skull, snout, eyeL, eyeR);
        group.add(neck, headGroup);
        head = headGroup;

        const tail = this.makeBox(0.35, 0.35, 1.8, bodyMat);
        tail.position.set(0, 0.95, 1.9);
        group.add(tail);

        // Two articulated dragon wings
        [-1, 1].forEach((side) => {
          const wingPivot = new THREE.Group();
          wingPivot.position.set(side * 0.55, 1.2, -0.2);
          const wingMembrane = this.makeBox(2.4, 0.08, 1.5, this.getColorMat('#27272a'));
          wingMembrane.position.set(side * 1.2, 0, 0.15);
          const wingBone = this.makeBox(2.45, 0.14, 0.16, spineMat);
          wingBone.position.set(side * 1.2, 0.04, -0.55);
          wingPivot.add(wingMembrane, wingBone);
          group.add(wingPivot);
          wings.push(wingPivot);
        });
        break;
      }

      case 'wither': {
        const wMat = this.getColorMat('#1c1917');
        const glowMat = this.getColorMat('#bae6fd', { emissive: '#38bdf8', emissiveIntensity: 0.7 });
        const spine = this.makeBox(0.35, 1.5, 0.3, wMat);
        spine.position.y = 1.2;
        const ribs = this.makeBox(1.1, 0.2, 0.25, wMat);
        ribs.position.y = 1.55;
        const ribs2 = this.makeBox(0.95, 0.18, 0.25, wMat);
        ribs2.position.y = 1.18;
        const shoulder = this.makeBox(1.5, 0.28, 0.32, wMat);
        shoulder.position.y = 1.95;
        group.add(spine, ribs, ribs2, shoulder);

        // 3 Wither Heads!
        const headXs = [-0.58, 0, 0.58];
        headXs.forEach((hx, idx) => {
          const hg = new THREE.Group();
          const sz = idx === 1 ? 0.52 : 0.38;
          hg.position.set(hx, idx === 1 ? 2.3 : 2.15, 0);
          const hBox = this.makeBox(sz, sz, sz, wMat);
          const eL = this.makeBox(sz * 0.24, sz * 0.16, 0.04, glowMat);
          eL.position.set(-sz * 0.22, sz * 0.08, -sz * 0.51);
          const eR = this.makeBox(sz * 0.24, sz * 0.16, 0.04, glowMat);
          eR.position.set(sz * 0.22, sz * 0.08, -sz * 0.51);
          hg.add(hBox, eL, eR);
          group.add(hg);
          if (idx === 1) head = hg;
        });
        break;
      }

      case 'blaze': {
        const fireMat = this.getColorMat('#facc15', { emissive: '#f59e0b', emissiveIntensity: 0.7 });
        const headMesh = this.makeBox(0.48, 0.48, 0.48, fireMat);
        headMesh.position.y = 1.35;
        group.add(headMesh);
        head = headMesh;

        orbitGroup = new THREE.Group();
        orbitGroup.position.y = 0.95;
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const rod = this.makeBox(0.11, 0.55, 0.11, fireMat);
          rod.position.set(Math.cos(ang) * 0.45, (i % 2) * 0.22 - 0.1, Math.sin(ang) * 0.45);
          orbitGroup.add(rod);
        }
        group.add(orbitGroup);
        break;
      }

      case 'slime': {
        const outerMat = this.getColorMat('#4ade80', { transparent: true, opacity: 0.72 });
        const innerMat = this.getColorMat('#16a34a');
        const outer = this.makeBox(0.95, 0.95, 0.95, outerMat);
        outer.position.y = 0.475;
        const inner = this.makeBox(0.58, 0.58, 0.58, innerMat);
        inner.position.y = 0.475;
        const eyeL = this.makeBox(0.14, 0.14, 0.06, blackMat);
        eyeL.position.set(-0.18, 0.56, -0.31);
        const eyeR = this.makeBox(0.14, 0.14, 0.06, blackMat);
        eyeR.position.set(0.18, 0.56, -0.31);
        group.add(inner, eyeL, eyeR, outer);
        break;
      }

      case 'ghast': {
        const ghostMat = this.getColorMat('#f8fafc');
        const faceMat = this.getFaceMat('ghast', [
          'wwwwwwww',
          'wwwwwwww',
          'wddwwddw',
          'wrrwwrrw',
          'wwwwwwww',
          'wwwddwww',
          'wwdwwdww',
          'wwwwwwww',
        ], { w: '#f8fafc', d: '#475569', r: '#ef4444' });
        const cube = this.buildFaceBox(1.85, 1.85, 1.85, ghostMat, faceMat);
        cube.position.y = 1.4;
        group.add(cube);
        head = cube;

        for (let i = 0; i < 6; i++) {
          const tentacle = this.makeBox(0.16, 0.75, 0.16, aMat);
          tentacle.position.set(-0.6 + (i % 3) * 0.6, 0.25, -0.35 + Math.floor(i / 3) * 0.7);
          group.add(tentacle);
          limbs.push(tentacle);
        }
        break;
      }

      case 'phantom': {
        const body = this.makeBox(0.42, 0.2, 0.85, pMat);
        body.position.y = 0.35;
        const faceMat = this.getFaceMat('phantom', [
          'bbbbbbbb',
          'bggbbggb',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
          'bbbbbbbb',
        ], { b: '#1e1b4b', g: '#4ade80' }, '#4ade80');
        const headMesh = this.buildFaceBox(0.46, 0.24, 0.38, pMat, faceMat);
        headMesh.position.set(0, 0.35, -0.58);
        group.add(body, headMesh);
        head = headMesh;

        [-1, 1].forEach((side) => {
          const wp = new THREE.Group();
          wp.position.set(side * 0.21, 0.38, -0.1);
          const wing = this.makeBox(0.85, 0.06, 0.55, this.getColorMat('#3730a3'));
          wing.position.x = side * 0.42;
          wp.add(wing);
          group.add(wp);
          wings.push(wp);
        });
        break;
      }

      case 'guardian': {
        const body = this.makeBox(0.85, 0.85, 0.85, pMat);
        body.position.y = 0.55;
        const eye = this.makeBox(0.32, 0.32, 0.08, eyeWhite);
        eye.position.set(0, 0.55, -0.44);
        const pupil = this.makeBox(0.14, 0.2, 0.1, this.getColorMat('#ea580c'));
        pupil.position.set(0, 0.55, -0.45);
        const tail = this.makeBox(0.28, 0.28, 0.65, aMat);
        tail.position.set(0, 0.55, 0.72);
        group.add(body, eye, pupil, tail);
        limbs.push(tail);
        break;
      }

      case 'ravager': {
        const armorMat = this.getColorMat('#475569');
        const body = this.makeBox(1.2, 1.05, 1.55, armorMat);
        body.position.y = 1.05;
        group.add(body);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.2, -1.05);
        const skull = this.makeBox(0.75, 0.75, 0.72, this.getColorMat('#64748b'));
        const hornL = this.makeBox(0.16, 0.45, 0.16, this.getColorMat('#e2e8f0'));
        hornL.position.set(-0.42, 0.22, -0.2);
        hornL.rotation.x = 0.5;
        const hornR = this.makeBox(0.16, 0.45, 0.16, this.getColorMat('#e2e8f0'));
        hornR.position.set(0.42, 0.22, -0.2);
        hornR.rotation.x = 0.5;
        headGroup.add(skull, hornL, hornR);
        group.add(headGroup);
        head = headGroup;

        [
          [-0.44, 0.6, -0.55],
          [0.44, 0.6, -0.55],
          [-0.44, 0.6, 0.55],
          [0.44, 0.6, 0.55],
        ].forEach(([lx, ly, lz]) => {
          const pivot = new THREE.Group();
          pivot.position.set(lx, ly, lz);
          const leg = this.makeBox(0.34, 0.6, 0.34, aMat);
          leg.position.y = -0.3;
          pivot.add(leg);
          group.add(pivot);
          limbs.push(pivot);
        });
        break;
      }

      case 'bee': {
        const body = this.makeBox(0.42, 0.38, 0.58, pMat);
        body.position.y = 0.55;
        const stripe = this.makeBox(0.44, 0.4, 0.14, blackMat);
        stripe.position.set(0, 0.55, 0.08);
        const eyeL = this.makeBox(0.1, 0.12, 0.04, blackMat);
        eyeL.position.set(-0.12, 0.58, -0.3);
        const eyeR = this.makeBox(0.1, 0.12, 0.04, blackMat);
        eyeR.position.set(0.12, 0.58, -0.3);
        group.add(body, stripe, eyeL, eyeR);

        [-1, 1].forEach((side) => {
          const wp = new THREE.Group();
          wp.position.set(side * 0.2, 0.76, -0.04);
          const wing = this.makeBox(0.32, 0.03, 0.24, this.getColorMat('#e0f2fe', { transparent: true, opacity: 0.75 }));
          wing.position.x = side * 0.16;
          wp.add(wing);
          group.add(wp);
          wings.push(wp);
        });
        break;
      }

      case 'chicken':
      case 'parrot': {
        const isParrot = def.type === 'parrot';
        const body = this.makeBox(0.36, 0.38, 0.48, pMat);
        body.position.y = 0.42;
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.68, -0.2);
        const hMesh = this.makeBox(0.28, 0.3, 0.28, pMat);
        const beak = this.makeBox(0.14, 0.1, 0.16, this.getColorMat('#f59e0b'));
        beak.position.set(0, -0.02, -0.2);
        headGroup.add(hMesh, beak);
        group.add(body, headGroup);
        head = headGroup;

        [-1, 1].forEach((side) => {
          const wp = new THREE.Group();
          wp.position.set(side * 0.19, 0.52, 0);
          const wMesh = this.makeBox(0.06, 0.24, 0.36, isParrot ? aMat : pMat);
          wMesh.position.y = -0.1;
          wp.add(wMesh);
          group.add(wp);
          wings.push(wp);
        });

        [-0.09, 0.09].forEach((lx) => {
          const lp = new THREE.Group();
          lp.position.set(lx, 0.24, 0);
          const leg = this.makeBox(0.06, 0.24, 0.06, this.getColorMat('#f59e0b'));
          leg.position.y = -0.12;
          lp.add(leg);
          group.add(lp);
          limbs.push(lp);
        });
        break;
      }

      case 'squid':
      case 'axolotl':
      case 'turtle': {
        if (def.type === 'squid') {
          const headBox = this.makeBox(0.55, 0.65, 0.55, pMat);
          headBox.position.y = 0.85;
          group.add(headBox);
          for (let i = 0; i < 4; i++) {
            const tent = this.makeBox(0.1, 0.52, 0.1, aMat);
            tent.position.set((i % 2 === 0 ? -1 : 1) * 0.15, 0.3, (i < 2 ? -1 : 1) * 0.15);
            group.add(tent);
            limbs.push(tent);
          }
        } else {
          const shell = this.makeBox(0.55, 0.26, 0.72, pMat);
          shell.position.y = 0.24;
          const headGroup = new THREE.Group();
          headGroup.position.set(0, 0.28, -0.45);
          const hMesh = this.makeBox(0.32, 0.24, 0.28, aMat);
          headGroup.add(hMesh);
          group.add(shell, headGroup);
          head = headGroup;
        }
        break;
      }

      case 'frog':
      case 'rabbit': {
        const body = this.makeBox(0.42, 0.28, 0.48, pMat);
        body.position.y = 0.24;
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.36, -0.2);
        const hMesh = this.makeBox(0.34, 0.24, 0.28, pMat);
        headGroup.add(hMesh);
        if (def.type === 'rabbit') {
          const earL = this.makeBox(0.08, 0.28, 0.08, pMat);
          earL.position.set(-0.09, 0.24, 0);
          const earR = this.makeBox(0.08, 0.28, 0.08, pMat);
          earR.position.set(0.09, 0.24, 0);
          headGroup.add(earL, earR);
        } else {
          const eyeL = this.makeBox(0.1, 0.1, 0.1, aMat);
          eyeL.position.set(-0.12, 0.14, -0.05);
          const eyeR = this.makeBox(0.1, 0.1, 0.1, aMat);
          eyeR.position.set(0.12, 0.14, -0.05);
          headGroup.add(eyeL, eyeR);
        }
        group.add(body, headGroup);
        head = headGroup;
        break;
      }

      // Quadrupeds: pig, cow, mooshroom, sheep, wolf, fox, polar_bear, panda, horse, camel, llama, cat, sniffer
      default: {
        const isTall = def.type === 'camel' || def.type === 'horse' || def.type === 'llama';
        const isWide = def.type === 'sniffer' || def.type === 'polar_bear' || def.type === 'panda';
        const bodyW = isWide ? 0.82 : def.type === 'wolf' || def.type === 'fox' || def.type === 'cat' ? 0.42 : 0.64;
        const bodyH = isWide ? 0.68 : def.type === 'wolf' || def.type === 'fox' || def.type === 'cat' ? 0.4 : 0.56;
        const bodyL = isTall ? 1.05 : def.type === 'wolf' || def.type === 'fox' || def.type === 'cat' ? 0.78 : 0.95;
        const legH = isTall ? 0.85 : def.type === 'wolf' || def.type === 'fox' || def.type === 'cat' ? 0.34 : 0.48;

        const body = this.makeBox(bodyW, bodyH, bodyL, pMat);
        body.position.y = legH + bodyH / 2;
        group.add(body);

        // Distinctive dorsal features
        if (def.type === 'mooshroom') {
          const shroom1 = this.makeBox(0.18, 0.24, 0.18, this.getColorMat('#ef4444'));
          shroom1.position.set(-0.1, legH + bodyH + 0.12, 0.1);
          const shroom2 = this.makeBox(0.16, 0.2, 0.16, this.getColorMat('#ffffff'));
          shroom2.position.set(0.12, legH + bodyH + 0.1, -0.16);
          group.add(shroom1, shroom2);
        } else if (def.type === 'camel') {
          const hump = this.makeBox(0.55, 0.34, 0.45, pMat);
          hump.position.set(0, legH + bodyH + 0.16, 0);
          group.add(hump);
        } else if (def.type === 'sniffer') {
          const moss = this.makeBox(0.86, 0.16, 1.0, aMat);
          moss.position.set(0, legH + bodyH + 0.06, 0);
          group.add(moss);
        }

        const headGroup = new THREE.Group();
        const headY = isTall ? legH + bodyH + 0.42 : legH + bodyH * 0.62;
        const headZ = -bodyL / 2 - (isTall ? 0.12 : 0.22);
        headGroup.position.set(0, headY, headZ);

        if (isTall) {
          const neck = this.makeBox(0.28, 0.56, 0.28, pMat);
          neck.position.set(0, -0.24, 0.14);
          headGroup.add(neck);
        }

        const headSize = isWide ? 0.54 : def.type === 'cat' || def.type === 'fox' || def.type === 'wolf' ? 0.36 : 0.46;
        const headMesh = this.makeBox(headSize, headSize, headSize, def.type === 'sheep' ? aMat : pMat);
        const eyeL = this.makeBox(0.08, 0.08, 0.04, blackMat);
        eyeL.position.set(-headSize * 0.26, headSize * 0.1, -headSize / 2 - 0.01);
        const eyeR = this.makeBox(0.08, 0.08, 0.04, blackMat);
        eyeR.position.set(headSize * 0.26, headSize * 0.1, -headSize / 2 - 0.01);
        headGroup.add(headMesh, eyeL, eyeR);

        if (def.type === 'pig' || def.type === 'sniffer') {
          const snout = this.makeBox(headSize * 0.5, headSize * 0.32, 0.14, def.type === 'sniffer' ? this.getColorMat('#facc15') : aMat);
          snout.position.set(0, -headSize * 0.12, -headSize / 2 - 0.06);
          headGroup.add(snout);
        } else if (def.type === 'cow' || def.type === 'mooshroom') {
          const hornL = this.makeBox(0.08, 0.16, 0.08, aMat);
          hornL.position.set(-headSize * 0.45, headSize * 0.45, 0);
          const hornR = this.makeBox(0.08, 0.16, 0.08, aMat);
          hornR.position.set(headSize * 0.45, headSize * 0.45, 0);
          headGroup.add(hornL, hornR);
        }

        group.add(headGroup);
        head = headGroup;

        const legW = Math.min(0.24, bodyW * 0.32);
        [
          [-bodyW * 0.32, legH, -bodyL * 0.34],
          [bodyW * 0.32, legH, -bodyL * 0.34],
          [-bodyW * 0.32, legH, bodyL * 0.34],
          [bodyW * 0.32, legH, bodyL * 0.34],
        ].forEach(([lx, ly, lz]) => {
          const pivot = new THREE.Group();
          pivot.position.set(lx, ly, lz);
          const leg = this.makeBox(legW, legH, legW, def.type === 'sheep' || def.type === 'panda' ? aMat : pMat);
          leg.position.y = -legH / 2;
          pivot.add(leg);
          group.add(pivot);
          limbs.push(pivot);
        });
        break;
      }
    }

    return { group, head, limbs, wings, orbitGroup };
  }

  public summonMob(type: MobType, nearPos: THREE.Vector3, lookDir?: THREE.Vector3): MobEntity | null {
    const def = MOB_CATALOG[type];
    if (!def) return null;

    // Keep cap reasonable for smooth mobile FPS
    if (this.mobs.length >= this.maxActiveMobs + 6) {
      const oldest = this.mobs.shift();
      if (oldest) {
        this.world.unregisterEntity(oldest.id);
        this.scene.remove(oldest.group);
      }
    }

    const forward = lookDir
      ? new THREE.Vector3(lookDir.x, 0, lookDir.z).normalize()
      : new THREE.Vector3(0, 0, -1);
    if (forward.lengthSq() < 0.01) forward.set(0, 0, -1);

    const sx = nearPos.x + forward.x * 5.0 + (this.rand() - 0.5) * 2.0;
    const sz = nearPos.z + forward.z * 5.0 + (this.rand() - 0.5) * 2.0;
    const groundY = this.findSurfaceY(Math.floor(sx), Math.floor(sz), Math.floor(nearPos.y));
    const sy = def.moveMode === 'fly' ? groundY + (def.category === 'boss' ? 8.5 : 4.5) : groundY + 0.1;

    const mob = this.spawnAt(def, sx, sy, sz);
    if (def.category === 'boss' || def.type === 'warden') {
      soundFX.playBossRoar();
    } else {
      soundFX.playPop();
    }
    return mob;
  }

  private spawnAt(def: MobDefinition, x: number, y: number, z: number, hpScale = 1): MobEntity {
    const built = this.createMobMesh(def);
    built.group.position.set(x, y, z);
    this.scene.add(built.group);

    const scaledMaxHp = Math.max(4, Math.round(def.maxHealth * hpScale));

    let npcName: string | undefined;
    let npcRole: string | undefined;
    let npcVariant: number | undefined;
    if (def.category === 'friendly') {
      npcVariant = this.idCounter;
      if (def.type === 'villager') {
        const persona = VILLAGER_PERSONAS[npcVariant % VILLAGER_PERSONAS.length];
        npcName = persona.name;
        npcRole = persona.role;
      } else if (def.type === 'wandering_trader') {
        const persona = TRADER_PERSONAS[npcVariant % TRADER_PERSONAS.length];
        npcName = persona.name;
        npcRole = persona.role;
      } else if (def.type === 'iron_golem') {
        npcName = 'Iron Sentinel';
        npcRole = 'Village Guardian';
      } else if (def.type === 'snow_golem') {
        npcName = 'Frosty Pip';
        npcRole = 'Snow Sentry';
      }
    }

    const hasHelmet = def.type === 'zombie' && this.rand() < 0.28;
    if (hasHelmet && built.head) {
      const helm = this.makeBox(0.54, 0.22, 0.54, this.getColorMat('#94a3b8'));
      helm.position.set(0, 0.18, 0);
      built.head.add(helm);
    }

    const entity: MobEntity = {
      id: `mob-${this.idCounter++}`,
      def,
      group: built.group,
      head: built.head,
      limbs: built.limbs,
      wings: built.wings,
      orbitGroup: built.orbitGroup,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      yaw: this.rand() * Math.PI * 2,
      health: scaledMaxHp,
      maxHealth: scaledMaxHp,
      hurtTimer: 0,
      isHurtFlashing: false,
      isFuseFlashing: false,
      creeperFuse: 0,
      hissPlayed: false,
      attackCooldown: 0.5 + this.rand() * 0.8,
      wanderTimer: 1.5 + this.rand() * 3.0,
      wanderAngle: this.rand() * Math.PI * 2,
      animTime: this.rand() * 10,
      age: 0,
      npcName,
      npcRole,
      npcVariant,
      interactCooldownUntil: 0,
      followTimer: 0,
      greetedPlayer: false,
      hasHelmet,
    };

    const spatialHandle: WorldEntity<MobEntity> = {
      id: entity.id,
      kind: 'mob',
      position: entity.position,
      radius: def.width * 0.62,
      data: entity,
    };
    entity.spatialHandle = spatialHandle;
    this.world.registerEntity(spatialHandle);

    this.mobs.push(entity);
    return entity;
  }

  public emitSoundVibration(pos: THREE.Vector3, radius = 22): void {
    const nearby = this.world.queryEntitiesInRadius(pos.x, pos.y, pos.z, radius, 'mob', this.nearbyEntityBuf);
    for (let i = 0; i < nearby.length; i++) {
      const m = nearby[i].data as MobEntity | undefined;
      if (m && m.def.type === 'warden' && m.health > 0) {
        m.alertTimer = 14.0;
        this.spawnMobParticles(m.position.clone().add(new THREE.Vector3(0, 1.8, 0)), '#22d3ee', 6);
      }
    }
  }

  public igniteCreeper(mob: MobEntity): boolean {
    if (mob.def.type !== 'creeper' || mob.health <= 0) return false;
    mob.creeperFuse = Math.max(mob.creeperFuse, 0.95);
    if (!mob.hissPlayed) {
      mob.hissPlayed = true;
      soundFX.playCreeperHiss();
    }
    this.spawnMobParticles(mob.position, '#f97316', 10);
    return true;
  }

  public applyNameTag(mob: MobEntity, customLabel?: string): void {
    mob.isNamed = true;
    mob.npcName = customLabel || `${mob.def.name} ★`;
    this.spawnMobParticles(mob.position, '#fbbf24', 10);
    soundFX.playPop();
  }

  public applyGoldenDandelion(mob: MobEntity): boolean {
    if (mob.def.category !== 'passive' || mob.health <= 0) return false;
    mob.isPermanentBaby = true;
    mob.group.scale.setScalar(0.55);
    this.spawnMobParticles(mob.position, '#facc15', 12);
    soundFX.playRegen();
    return true;
  }

  public hasBeesNear(pos: THREE.Vector3, radius = 16): boolean {
    const nearby = this.world.queryEntitiesInRadius(pos.x, pos.y, pos.z, radius, 'mob', this.nearbyEntityBuf);
    for (let i = 0; i < nearby.length; i++) {
      const m = nearby[i].data as MobEntity | undefined;
      if (m && m.def.type === 'bee' && m.health > 0) return true;
    }
    return false;
  }

  private findSurfaceY(wx: number, wz: number, hintY: number): number {
    const maxY = Math.min(46, Math.max(28, hintY + 12));
    for (let y = maxY; y >= 2; y--) {
      const b = this.world.getBlock(wx, y, wz);
      const above = this.world.getBlock(wx, y + 1, wz);
      if (b !== BlockType.AIR && b !== BlockType.WATER && above === BlockType.AIR) {
        return y + 1;
      }
    }
    return this.world.terrain.getHeight(wx, wz) + 1;
  }

  private isSolidAt(x: number, y: number, z: number): boolean {
    const b = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return b !== BlockType.AIR && b !== BlockType.WATER;
  }

  private getHostilePoolForTier(tier: number, biome: string, isNight: boolean): MobType[] {
    if (this.world.dimension === 'nether') {
      return ['piglin', 'wither_skeleton', 'blaze', 'ghast'];
    }
    if (this.world.dimension === 'end') {
      return ['enderman', 'enderman', 'phantom'];
    }

    // Tier 1 (Weakest early game): Slime, Spider, Zombie
    const pool: MobType[] = ['slime', 'spider', 'zombie'];
    if (biome === 'pale_garden') {
      pool.push('creaking', 'creaking', 'creaking');
    }
    if (tier >= 2) {
      pool.push('skeleton', 'creeper');
      if (biome === 'desert') pool.push('husk', 'husk');
    }
    if (tier >= 3) {
      pool.push('pillager', 'witch');
      if (isNight) pool.push('phantom', 'blaze');
    }
    if (tier >= 4) {
      pool.push('enderman', 'wither_skeleton', 'evoker', 'ravager');
      if (isNight) pool.push('ghast');
    }
    if (tier >= 5 && this.rand() < 0.08) {
      pool.push('warden');
    }
    return pool;
  }

  private pickAmbientMobType(isNight: boolean, biome: string, inWater: boolean, allowHostiles: boolean): MobType {
    if (this.world.dimension === 'nether') {
      if (allowHostiles && this.rand() < 0.78) {
        const netherPool: MobType[] = ['piglin', 'wither_skeleton', 'blaze', 'ghast'];
        return netherPool[Math.floor(this.rand() * netherPool.length)];
      }
      return this.rand() < 0.65 ? 'piglin' : 'wandering_trader';
    }
    if (this.world.dimension === 'end') {
      if (allowHostiles && !this.mobs.some((m) => m.def.type === 'ender_dragon') && this.rand() < 0.14) {
        return 'ender_dragon';
      }
      return 'enderman';
    }

    if (inWater) {
      const passiveWater: MobType[] = ['squid', 'axolotl', 'turtle', 'frog'];
      if (!allowHostiles) {
        return passiveWater[Math.floor(this.rand() * passiveWater.length)];
      }
      const waterHostiles: MobType[] = this.threatTier >= 4 ? ['drowned', 'guardian'] : this.threatTier >= 2 ? ['drowned'] : [];
      if (waterHostiles.length > 0 && this.rand() < (isNight ? 0.14 : 0.04)) {
        return waterHostiles[Math.floor(this.rand() * waterHostiles.length)];
      }
      return passiveWater[Math.floor(this.rand() * passiveWater.length)];
    }

    const r = this.rand();
    // Reduced hostile spawn rates so exploration & building remain enjoyable
    const nightHostileChance = Math.min(0.28, 0.12 + (this.threatTier - 1) * 0.04);
    const dayHostileChance = Math.min(0.10, 0.03 + (this.threatTier - 1) * 0.015);

    if (allowHostiles && (isNight || biome === 'pale_garden')) {
      const chance = biome === 'pale_garden' ? 0.35 : nightHostileChance;
      if (r < chance) {
        const hostiles = this.getHostilePoolForTier(this.threatTier, biome, true);
        return hostiles[Math.floor(this.rand() * hostiles.length)];
      }
      const nightFriendly: MobType[] = ['iron_golem', 'snow_golem', 'villager', 'wolf', 'fox', 'cat'];
      return nightFriendly[Math.floor(this.rand() * nightFriendly.length)];
    }

    if (allowHostiles && r < dayHostileChance) {
      const dayBad = this.getHostilePoolForTier(this.threatTier, biome, false);
      return dayBad[Math.floor(this.rand() * dayBad.length)];
    }

    if (r < (allowHostiles ? dayHostileChance + 0.22 : 0.24)) {
      const guardians: MobType[] = ['villager', 'villager', 'wandering_trader', 'iron_golem', 'snow_golem'];
      return guardians[Math.floor(this.rand() * guardians.length)];
    }

    const biomePool: MobType[] = ['pig', 'cow', 'sheep', 'chicken', 'rabbit', 'horse', 'bee', 'cat', 'sniffer'];
    if (biome === 'desert') biomePool.push('camel', 'camel', 'rabbit');
    if (biome === 'cherry' || biome === 'forest') biomePool.push('fox', 'panda', 'parrot', 'bee', 'wolf');
    if (biome === 'mountains') biomePool.push('polar_bear', 'llama', 'wolf');
    if (biome === 'plains') biomePool.push('mooshroom', 'frog', 'horse', 'cow', 'sheep');

    return biomePool[Math.floor(this.rand() * biomePool.length)];
  }

  private setEntityMaterialMode(mob: MobEntity, mode: 'normal' | 'hurt' | 'fuse'): void {
    const wantHurt = mode === 'hurt';
    const wantFuse = mode === 'fuse';
    if (mob.isHurtFlashing === wantHurt && mob.isFuseFlashing === wantFuse) return;

    mob.isHurtFlashing = wantHurt;
    mob.isFuseFlashing = wantFuse;

    mob.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.userData.origMat) {
        obj.material = wantHurt ? this.hurtMat : wantFuse ? this.fuseMat : obj.userData.origMat;
      }
    });
  }

  private spawnMobParticles(pos: THREE.Vector3, hex: string, count = 12): void {
    const geo = this.getBoxGeo(0.14, 0.14, 0.14);
    const mat = this.getColorMat(hex);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.7,
        pos.y + 0.4 + Math.random() * 0.8,
        pos.z + (Math.random() - 0.5) * 0.7
      );
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4.5 + 1.5,
        (Math.random() - 0.5) * 5
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: 0.45 + Math.random() * 0.35 });
    }
  }

  private fireProjectile(
    origin: THREE.Vector3,
    target: THREE.Vector3,
    speed: number,
    damage: number,
    colorHex: string,
    explosive = false,
    fromFriendly = false
  ): void {
    const dir = target.clone().sub(origin).normalize();
    const geo = this.getBoxGeo(explosive ? 0.28 : 0.16, explosive ? 0.28 : 0.16, explosive ? 0.28 : 0.45);
    const mat = this.getColorMat(colorHex, { emissive: colorHex, emissiveIntensity: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.lookAt(target);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      position: origin.clone(),
      velocity: dir.multiplyScalar(speed),
      damage,
      explosive,
      fromFriendly,
      age: 0,
    });
  }

  private triggerExplosion(center: THREE.Vector3, radius: number, player: Player, maxDamage: number): void {
    soundFX.playExplosion();
    this.spawnMobParticles(center, '#f97316', 18);
    this.spawnMobParticles(center, '#d4d4d8', 12);

    // Damage player if nearby (blocks placed between feet/body and blast block most blast damage!)
    const distToPlayer = center.distanceTo(player.position);
    if (distToPlayer < radius * 2.4) {
      const feetTarget = new THREE.Vector3(player.position.x, player.position.y + 0.45, player.position.z);
      let isShielded = false;
      for (let s = 1; s <= 5; s++) {
        const t = s / 6;
        const sx = Math.floor(THREE.MathUtils.lerp(center.x, feetTarget.x, t));
        const sy = Math.floor(THREE.MathUtils.lerp(center.y, feetTarget.y, t));
        const sz = Math.floor(THREE.MathUtils.lerp(center.z, feetTarget.z, t));
        const blockAt = this.world.getBlock(sx, sy, sz);
        if (blockAt !== BlockType.AIR && blockAt !== BlockType.WATER && blockAt !== BlockType.LAVA) {
          isShielded = true;
          break;
        }
      }

      const falloff = Math.max(0.25, 1 - distToPlayer / (radius * 2.6));
      const occlusionMult = isShielded ? 0.25 : 1.0;
      const dmg = Math.max(1, Math.round(maxDamage * falloff * occlusionMult));
      player.takeDamage(dmg);
      const push = player.position.clone().sub(center);
      push.y = 0.6;
      if (push.lengthSq() > 0.001) push.normalize();
      player.velocity.addScaledVector(push, 7.5 * falloff * occlusionMult);
    }

    // Protect player spawn safe-zone (r < 10) and high blast-resistance blocks (Chain, Obsidian, End Stone, etc.)
    if (Math.hypot(center.x, center.z) >= 10) {
      const cx = Math.floor(center.x);
      const cy = Math.floor(center.y);
      const cz = Math.floor(center.z);
      const rInt = Math.ceil(radius);
      const changes: { x: number; y: number; z: number; block: BlockType }[] = [];

      for (let dy = -rInt; dy <= rInt; dy++) {
        for (let dz = -rInt; dz <= rInt; dz++) {
          for (let dx = -rInt; dx <= rInt; dx++) {
            if (dx * dx + dy * dy + dz * dz <= radius * radius) {
              const bx = cx + dx;
              const by = cy + dy;
              const bz = cz + dz;
              if (by <= 1) continue;
              const existing = this.world.getBlock(bx, by, bz);
              const blastRes = BLOCK_DEFS[existing]?.blastResistance ?? 1;
              if (
                existing !== BlockType.AIR &&
                existing !== BlockType.BEDROCK &&
                existing !== BlockType.WATER &&
                existing !== BlockType.LAVA &&
                blastRes < 6
              ) {
                this.world.setBlock(bx, by, bz, BlockType.AIR);
                changes.push({ x: bx, y: by, z: bz, block: BlockType.AIR });
              }
            }
          }
        }
      }

      if (changes.length > 0) {
        this.onBlocksExploded?.(changes);
      }
    }
  }

  public raycastMob(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance = 4.8): { mob: MobEntity; distance: number } | null {
    let closest: { mob: MobEntity; distance: number } | null = null;
    const candidates = this.world.queryEntitiesAlongRay(origin, direction, maxDistance + 1.5, 'mob', this.rayQueryBuf);
    const ray = new THREE.Ray(origin, direction);
    const hitPt = new THREE.Vector3();
    const boxMin = new THREE.Vector3();
    const boxMax = new THREE.Vector3();
    const box = new THREE.Box3();

    for (let i = 0; i < candidates.length; i++) {
      const mob = candidates[i].data as MobEntity | undefined;
      if (!mob || mob.health <= 0) continue;
      const halfW = mob.def.width * 0.62;
      boxMin.set(mob.position.x - halfW, mob.position.y - 0.05, mob.position.z - halfW);
      boxMax.set(mob.position.x + halfW, mob.position.y + mob.def.height + 0.1, mob.position.z + halfW);
      box.set(boxMin, boxMax);

      if (ray.intersectBox(box, hitPt)) {
        const dist = origin.distanceTo(hitPt);
        if (dist <= maxDistance && (!closest || dist < closest.distance)) {
          closest = { mob, distance: dist };
        }
      }
    }

    return closest;
  }

  public attackMob(mob: MobEntity, damage: number, knockDir: THREE.Vector3, dropManager?: DroppedItemManager): boolean {
    if (mob.health <= 0) return false;
    mob.health = Math.max(0, mob.health - damage);
    mob.hurtTimer = 0.2;
    if (mob.def.category === 'hostile' || mob.def.category === 'boss') {
      mob.alertTimer = 12.0;
    }
    soundFX.playMobHit();

    // Knockback
    const kb = knockDir.clone();
    kb.y = 0;
    if (kb.lengthSq() > 0.001) kb.normalize();
    mob.velocity.x = kb.x * 5.2;
    mob.velocity.z = kb.z * 5.2;
    if (mob.def.moveMode === 'ground') {
      mob.velocity.y = Math.max(mob.velocity.y, 3.8);
    }

    this.spawnMobParticles(mob.position, mob.def.primaryColor, 6);

    // Enderman evasive warp when hit
    if (mob.def.type === 'enderman' && mob.health > 0) {
      soundFX.playEndermanWarp();
      const angle = this.rand() * Math.PI * 2;
      const dist = 4 + this.rand() * 4;
      const nx = mob.position.x + Math.cos(angle) * dist;
      const nz = mob.position.z + Math.sin(angle) * dist;
      const ny = this.findSurfaceY(Math.floor(nx), Math.floor(nz), Math.floor(mob.position.y));
      mob.position.set(nx, ny, nz);
    }

    if (mob.health <= 0) {
      this.killMob(mob, dropManager);
      return true;
    }
    return false;
  }

  private killMob(mob: MobEntity, dropManager?: DroppedItemManager): void {
    this.spawnMobParticles(mob.position, mob.def.primaryColor, 14);
    this.spawnMobParticles(mob.position, '#ffffff', 6);
    soundFX.playPop();

    if (dropManager && mob.def.drops.length > 0) {
      const dropCount = mob.def.type === 'drowned' ? mob.def.drops.length : 1;
      for (let d = 0; d < dropCount; d++) {
        const dropBlock = mob.def.type === 'drowned'
          ? mob.def.drops[d]
          : mob.def.drops[Math.floor(this.rand() * mob.def.drops.length)];
        dropManager.spawnDrop(
          Math.floor(mob.position.x),
          Math.floor(mob.position.y + 0.5),
          Math.floor(mob.position.z),
          dropBlock
        );
      }
    }

    this.world.unregisterEntity(mob.id);
    this.scene.remove(mob.group);
    const idx = this.mobs.indexOf(mob);
    if (idx !== -1) this.mobs.splice(idx, 1);
    this.onMobKilled?.(mob.def, mob);
  }

  public clearAllMobs(): number {
    const count = this.mobs.length;
    for (const m of this.mobs) {
      this.world.unregisterEntity(m.id);
      this.scene.remove(m.group);
    }
    this.mobs = [];
    return count;
  }

  public getRadarMobs(): RadarMobPoint[] {
    return this.mobs.map((m) => ({
      id: m.id,
      x: m.position.x,
      z: m.position.z,
      category: m.def.category,
      name: m.def.name,
    }));
  }

  public isInteractableNpc(mob: MobEntity): boolean {
    return mob.def.category === 'friendly' && mob.health > 0;
  }

  public getMobDisplayName(mob: MobEntity): string {
    return mob.npcName ? `${mob.npcName}` : mob.def.name;
  }

  public getMobById(id: string): MobEntity | null {
    return this.mobs.find((m) => m.id === id && m.health > 0) || null;
  }

  public raycastInteractableNpc(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance = 5.5
  ): MobEntity | null {
    const hit = this.raycastMob(origin, direction, maxDistance);
    if (hit && this.isInteractableNpc(hit.mob)) {
      return hit.mob;
    }
    return null;
  }

  public findNearestInteractableNpc(pos: THREE.Vector3, maxDistance = 4.2): MobEntity | null {
    let best: MobEntity | null = null;
    let bestDist = maxDistance;
    const nearby = this.world.queryEntitiesInRadius(pos.x, pos.y, pos.z, maxDistance + 1.5, 'mob', this.nearbyEntityBuf);
    for (let i = 0; i < nearby.length; i++) {
      const m = nearby[i].data as MobEntity | undefined;
      if (!m || !this.isInteractableNpc(m)) continue;
      const d = m.position.distanceTo(pos);
      if (d <= bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best;
  }

  public triggerNpcReaction(mobId: string, colorHex = '#34d399'): void {
    const mob = this.getMobById(mobId);
    if (!mob) return;
    if (mob.def.moveMode === 'ground') {
      mob.velocity.y = Math.max(mob.velocity.y, 2.8);
    }
    this.spawnMobParticles(mob.position, colorHex, 8);
    soundFX.playPop();
  }

  public setNpcFollow(mobId: string, seconds = 30): void {
    const mob = this.getMobById(mobId);
    if (!mob) return;
    mob.followTimer = seconds;
    this.triggerNpcReaction(mobId, '#38bdf8');
  }

  public markNpcGiftClaimed(mobId: string, cooldownSec = 45): void {
    const mob = this.getMobById(mobId);
    if (!mob) return;
    mob.interactCooldownUntil = Date.now() + cooldownSec * 1000;
    this.triggerNpcReaction(mobId, '#fbbf24');
  }

  public getNpcInteractionData(mob: MobEntity): NpcInteractionData {
    const now = Date.now();
    const giftReadyInSec = mob.interactCooldownUntil
      ? Math.max(0, Math.ceil((mob.interactCooldownUntil - now) / 1000))
      : 0;
    const nearby = this.world.queryEntitiesInRadius(mob.position.x, mob.position.y, mob.position.z, 45, 'mob', this.nearbyEntityBuf);
    let nearbyHostileCount = 0;
    for (let i = 0; i < nearby.length; i++) {
      const m = nearby[i].data as MobEntity | undefined;
      if (m && (m.def.category === 'hostile' || m.def.category === 'boss')) {
        nearbyHostileCount++;
      }
    }

    const name = mob.npcName || mob.def.name;
    const role = mob.npcRole || 'Friendly Companion';

    if (mob.def.type === 'wandering_trader') {
      return {
        id: mob.id,
        type: mob.def.type,
        name,
        role,
        primaryColor: mob.def.primaryColor,
        accentColor: mob.def.accentColor,
        greetings: [
          `Ah, a traveler! I carry rare blocks from distant sectors of this 32,000-block world.`,
          `Welcome, builder! Care to trade some stone or sand for rare ores and glowstone?`,
          `Good to see friendly faces out here—most monsters steer clear of well-lit plazas!`,
        ],
        tips: [
          'Tip: Place Glowstone or Torches around your camp to spot incoming night patrols early.',
          'Tip: Check the Weapon Armory anytime—Iron & Diamond Ore unlocks stronger blades.',
          'Tip: Every 256 blocks across the world holds a new regional plaza for settlers!',
        ],
        giftBlock: BlockType.GLOWSTONE,
        giftCount: 1,
        giftReadyInSec,
        canHeal: true,
        canEscort: false,
        escortRemainingSec: 0,
        nearbyHostileCount,
        trades: [
          {
            id: 'trader_iron',
            label: 'Smelted Iron Supply',
            costBlock: BlockType.COBBLESTONE,
            costCount: 4,
            rewardBlock: BlockType.IRON_ORE,
            rewardCount: 2,
          },
          {
            id: 'trader_gold',
            label: 'Merchant Gold',
            costBlock: BlockType.SAND,
            costCount: 5,
            rewardBlock: BlockType.GOLD_ORE,
            rewardCount: 2,
          },
          {
            id: 'trader_diamond',
            label: 'Rare Diamond Shard',
            costBlock: BlockType.WOOD_OAK,
            costCount: 6,
            rewardBlock: BlockType.DIAMOND_ORE,
            rewardCount: 1,
          },
        ],
      };
    }

    if (mob.def.type === 'iron_golem') {
      return {
        id: mob.id,
        type: mob.def.type,
        name,
        role,
        primaryColor: mob.def.primaryColor,
        accentColor: mob.def.accentColor,
        greetings: [
          `*Heavy metallic hum* Sector perimeter secure. ${
            nearbyHostileCount === 0
              ? 'No bad guys detected nearby.'
              : `${nearbyHostileCount} bad guy${nearbyHostileCount > 1 ? 's' : ''} spotted within 45m!`
          }`,
          `I stand watch over builders and villagers. Call on me whenever you want an escort.`,
        ],
        tips: [
          `Perimeter Scan: ${nearbyHostileCount} hostile mob${nearbyHostileCount === 1 ? '' : 's'} nearby.`,
          'Tip: Iron Golems automatically charge any Zombie, Creeper, or Raider within 16 blocks.',
          'Tip: Ask me to Escort & Guard if you are heading into caves or night terrain!',
        ],
        giftBlock: BlockType.IRON_ORE,
        giftCount: 1,
        giftReadyInSec,
        canHeal: false,
        canEscort: true,
        escortRemainingSec: Math.ceil(mob.followTimer || 0),
        nearbyHostileCount,
        trades: [
          {
            id: 'golem_brick',
            label: 'Fortress Brick Bundle',
            costBlock: BlockType.DIRT,
            costCount: 4,
            rewardBlock: BlockType.BRICK,
            rewardCount: 4,
          },
          {
            id: 'golem_iron',
            label: 'Forged Iron Chunk',
            costBlock: BlockType.COBBLESTONE,
            costCount: 5,
            rewardBlock: BlockType.IRON_ORE,
            rewardCount: 2,
          },
        ],
      };
    }

    if (mob.def.type === 'snow_golem') {
      return {
        id: mob.id,
        type: mob.def.type,
        name,
        role,
        primaryColor: mob.def.primaryColor,
        accentColor: mob.def.accentColor,
        greetings: [
          `Brrr-illiant day for building! Need snowballs for defense or cool blocks for your roof?`,
          `Stay frosty, friend! I'll pelt any sneaky bad guys who wander too close.`,
        ],
        tips: [
          'Tip: Snow Golems fire ranged snowballs to distract and knock back hostiles.',
          'Tip: You can press [R] anytime near a friendly NPC to chat or trade!',
        ],
        giftBlock: BlockType.SNOW,
        giftCount: 3,
        giftReadyInSec,
        canHeal: false,
        canEscort: true,
        escortRemainingSec: Math.ceil(mob.followTimer || 0),
        nearbyHostileCount,
        trades: [
          {
            id: 'snow_glass',
            label: 'Crystal Ice Glass',
            costBlock: BlockType.SAND,
            costCount: 3,
            rewardBlock: BlockType.GLASS,
            rewardCount: 4,
          },
          {
            id: 'snow_pumpkin',
            label: 'Harvest Pumpkin',
            costBlock: BlockType.GRASS,
            costCount: 4,
            rewardBlock: BlockType.PUMPKIN,
            rewardCount: 2,
          },
        ],
      };
    }

    // Default: Villager (Builder / Blacksmith / Mason / Scholar)
    return {
      id: mob.id,
      type: mob.def.type,
      name,
      role,
      primaryColor: mob.def.primaryColor,
      accentColor: mob.def.accentColor,
      greetings: [
        `Hello neighbor! I'm ${name}, your local ${role}. Building something grand today?`,
        `Great to meet you! Bring me wood, dirt, or stone and I'll share crafted supplies.`,
        `Nice and peaceful around here! Let me know if you need torches, books, or ore.`,
      ],
      tips: [
        'Tip: Press [C] for the Crafting Table or [B] for the Furnace to smelt ores.',
        'Tip: Right-click or press [R] on any Villager, Trader, or Golem to interact!',
        'Tip: Dig deep underground for Coal, Iron, Gold, and sparkling Diamond Ore.',
      ],
      giftBlock: BlockType.TORCH,
      giftCount: 3,
      giftReadyInSec,
      canHeal: true,
      canEscort: false,
      escortRemainingSec: 0,
      nearbyHostileCount,
      trades: [
        {
          id: 'villager_planks',
          label: 'Builder Timber Pack',
          costBlock: BlockType.DIRT,
          costCount: 4,
          rewardBlock: BlockType.PLANKS_OAK,
          rewardCount: 6,
        },
        {
          id: 'villager_books',
          label: 'Study Bookshelf',
          costBlock: BlockType.WOOD_OAK,
          costCount: 3,
          rewardBlock: BlockType.BOOKSHELF,
          rewardCount: 2,
        },
        {
          id: 'villager_coal',
          label: 'Mining Coal & Torches',
          costBlock: BlockType.COBBLESTONE,
          costCount: 4,
          rewardBlock: BlockType.COAL_ORE,
          rewardCount: 2,
        },
      ],
    };
  }

  public update(delta: number, player: Player, timeOfDay: number, dropManager: DroppedItemManager): void {
    const dt = Math.min(delta, 0.06);
    const isNight = timeOfDay < 0.23 || timeOfDay > 0.77;

    // 0. Starter Grace Period (bad guys wait until player settles in or advances)
    if (this.graceTimer > 0) {
      this.graceTimer = Math.max(0, this.graceTimer - dt);
      if (this.graceTimer === 0 && !this.graceEndedNotified) {
        this.graceEndedNotified = true;
        this.onGraceEnd?.();
      }
    }

    let activeHostiles = 0;
    let activeFriendlies = 0;
    for (const m of this.mobs) {
      if (m.def.category === 'hostile' || m.def.category === 'boss') activeHostiles++;
      else if (m.def.category === 'friendly') activeFriendlies++;
    }

    const allowHostiles = this.graceTimer <= 0 && activeHostiles < this.maxHostiles;
    const hostileHpScale =
      this.threatTier === 1 ? 0.85 : this.threatTier === 2 ? 0.95 : this.threatTier === 3 ? 1.0 : this.threatTier === 4 ? 1.1 : 1.2;

    // 1. Dynamic Biome & Day/Night Spawning around Player
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.mobs.length < 8 ? 1.1 : 3.0;

      if (this.mobs.length < this.maxActiveMobs) {
        // Ensure at least 2 friendly interactive NPCs exist nearby so the world feels alive
        if (activeFriendlies < 2) {
          const angle = this.rand() * Math.PI * 2;
          const radius = 9 + this.rand() * 10;
          const sx = player.position.x + Math.cos(angle) * radius;
          const sz = player.position.z + Math.sin(angle) * radius;
          const surfaceY = this.findSurfaceY(Math.floor(sx), Math.floor(sz), Math.floor(player.position.y));
          const npcType: MobType =
            activeFriendlies === 0 ? 'villager' : this.rand() < 0.65 ? 'villager' : 'wandering_trader';
          this.spawnAt(MOB_CATALOG[npcType], sx, surfaceY + 0.1, sz, 1);
        } else {
          // Pick a well-spaced position around the map using 3D spatial hash so mobs start separate
          let sx = player.position.x;
          let sz = player.position.z;
          for (let attempt = 0; attempt < 8; attempt++) {
            const angle = this.rand() * Math.PI * 2;
            const radius = 22 + this.rand() * 28;
            const cx = player.position.x + Math.cos(angle) * radius;
            const cz = player.position.z + Math.sin(angle) * radius;
            sx = cx;
            sz = cz;
            const near = this.world.queryEntitiesInRadius(cx, player.position.y, cz, 20, 'mob', this.nearbyEntityBuf);
            let tooCloseToHostile = false;
            for (let n = 0; n < near.length; n++) {
              const m = near[n].data as MobEntity | undefined;
              if (m && (m.def.category === 'hostile' || m.def.category === 'boss') && Math.hypot(m.position.x - cx, m.position.z - cz) < 20) {
                tooCloseToHostile = true;
                break;
              }
            }
            if (!tooCloseToHostile) break;
          }

          const wx = Math.floor(sx);
          const wz = Math.floor(sz);
          const biome = this.world.terrain.getBiome(wx, wz);

          const surfaceY = this.findSurfaceY(wx, wz, Math.floor(player.position.y));
          const belowBlock = this.world.getBlock(wx, surfaceY - 1, wz);
          const atBlock = this.world.getBlock(wx, surfaceY, wz);
          const inWater = belowBlock === BlockType.WATER || atBlock === BlockType.WATER || surfaceY <= 8;

          const chosenType = this.pickAmbientMobType(isNight, biome, inWater, allowHostiles);
          const def = MOB_CATALOG[chosenType];
          const spawnY =
            def.moveMode === 'fly'
              ? surfaceY + (def.category === 'boss' ? 10 : 4.5 + this.rand() * 4)
              : def.moveMode === 'swim'
              ? Math.max(7.2, surfaceY - 0.5)
              : surfaceY + 0.1;

          const isBad = def.category === 'hostile' || def.category === 'boss';
          this.spawnAt(def, sx, spawnY, sz, isBad ? hostileHpScale : 1);
        }
      }

      // Bosses (Ender Dragon / Wither) ONLY patrol overhead once player reaches Tier 5 and hostiles are under cap
      if (
        allowHostiles &&
        this.threatTier >= 5 &&
        isNight &&
        !this.mobs.some((m) => m.def.category === 'boss') &&
        this.rand() < 0.06
      ) {
        const bossType: MobType = this.rand() < 0.5 ? 'ender_dragon' : 'wither';
        const ang = this.rand() * Math.PI * 2;
        this.spawnAt(
          MOB_CATALOG[bossType],
          player.position.x + Math.cos(ang) * 32,
          player.position.y + 14,
          player.position.z + Math.sin(ang) * 32,
          1.0
        );
      }
    }

    // 1b. Occasional Villain Patrols (spread across different directions of the map)
    if (this.graceTimer <= 0 && player.health > 0) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.waveTimer = isNight ? 55 : 85;
        const maxWaveHostiles = Math.min(this.maxHostiles, Math.max(2, 1 + Math.floor(this.threatTier * 0.8)));

        if (activeHostiles < maxWaveHostiles && this.mobs.length < this.maxActiveMobs + 2) {
          this.waveNumber += 1;
          const baseCount = this.threatTier >= 4 ? 2 : 1;
          const count = Math.min(baseCount, Math.max(1, maxWaveHostiles - activeHostiles));

          const playerBiome = this.world.terrain.getBiome(
            Math.floor(player.position.x),
            Math.floor(player.position.z)
          );
          const pool = this.getHostilePoolForTier(this.threatTier, playerBiome, isNight);

          const spawnedNames: string[] = [];
          const baseAng = this.rand() * Math.PI * 2;
          for (let w = 0; w < count; w++) {
            const vType = pool[Math.floor(this.rand() * pool.length)];
            const def = MOB_CATALOG[vType];
            // Spread wave spawns to distinct distant sectors of the map and away from existing bad guys
            let sectorAngle = baseAng + (w * Math.PI * 2) / Math.max(1, count) + (this.rand() - 0.5) * 0.9;
            let vx = player.position.x;
            let vz = player.position.z;
            for (let attempt = 0; attempt < 6; attempt++) {
              const tryAngle = sectorAngle + attempt * 0.85;
              const dist = 24 + this.rand() * 18;
              const tx = player.position.x + Math.cos(tryAngle) * dist;
              const tz = player.position.z + Math.sin(tryAngle) * dist;
              vx = tx;
              vz = tz;
              const near = this.world.queryEntitiesInRadius(tx, player.position.y, tz, 18, 'mob', this.nearbyEntityBuf);
              const crowded = near.some((e) => {
                const m = e.data as MobEntity | undefined;
                return m && (m.def.category === 'hostile' || m.def.category === 'boss') && Math.hypot(m.position.x - tx, m.position.z - tz) < 18;
              });
              if (!crowded) {
                sectorAngle = tryAngle;
                break;
              }
            }
            const groundY = this.findSurfaceY(Math.floor(vx), Math.floor(vz), Math.floor(player.position.y));
            const vy = def.moveMode === 'fly' ? groundY + 4.5 : groundY + 0.1;
            const entity = this.spawnAt(def, vx, vy, vz, hostileHpScale);
            entity.wanderAngle = sectorAngle + Math.PI * 0.5 + (this.rand() - 0.5);
            entity.yaw = entity.wanderAngle;
            spawnedNames.push(def.name);
          }

          if (spawnedNames.length > 0) {
            this.onVillainWave?.(this.waveNumber, spawnedNames);
          }
        }
      }
    }

    // 2. Update each active mob
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      mob.age += dt;
      mob.animTime += dt;
      mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);
      if (mob.followTimer && mob.followTimer > 0) {
        mob.followTimer = Math.max(0, mob.followTimer - dt);
      }
      if (mob.alertTimer && mob.alertTimer > 0) {
        mob.alertTimer = Math.max(0, mob.alertTimer - dt);
      }

      const distToPlayer = mob.position.distanceTo(player.position);

      // Despawn far mobs (> 64m), EXCEPT Named Pets/Mobs & Permanent Babies & Bosses
      if (distToPlayer > 64 && mob.def.category !== 'boss' && !mob.isNamed && !mob.isPermanentBaby) {
        this.world.unregisterEntity(mob.id);
        this.scene.remove(mob.group);
        this.mobs.splice(i, 1);
        continue;
      }

      // Hurt flash timer
      if (mob.hurtTimer > 0) {
        mob.hurtTimer -= dt;
        this.setEntityMaterialMode(mob, 'hurt');
      } else if (mob.creeperFuse > 0) {
        const blink = Math.sin(mob.creeperFuse * 26) > 0;
        this.setEntityMaterialMode(mob, blink ? 'fuse' : 'normal');
      } else {
        this.setEntityMaterialMode(mob, 'normal');
      }

      // Determine AI Target (bad guys wander separately & attack ANY player they find!)
      let targetPos: THREE.Vector3 | null = null;
      let targetMob: MobEntity | null = null;
      let targetIsLocalPlayer = false;
      let chaseSpeed = mob.def.speed;
      let isInteractingWithPlayer = false;

      if (mob.def.category === 'hostile' || mob.def.category === 'boss') {
        let aggroDist =
          mob.def.category === 'boss'
            ? isNight ? 40 : 34
            : mob.def.isRanged
            ? isNight ? 26 : 22
            : isNight ? 22 : 18;

        // Warden reacts to sound vibrations; sneaking near it hides you unless vibration alerted!
        if (mob.def.type === 'warden') {
          aggroDist = player.isSneaking && (mob.alertTimer || 0) <= 0 ? 4.0 : 24.0;
        }
        let bestPlayerDist = aggroDist;

        if (player.health > 0 && (distToPlayer < bestPlayerDist || (mob.alertTimer || 0) > 0)) {
          bestPlayerDist = distToPlayer;
          targetPos = player.position;
          targetIsLocalPlayer = true;
        }

        // Also detect any nearby multiplayer player via VoxelWorld's 3D spatial hash
        const nearbyPlayers = this.world.queryEntitiesInRadius(
          mob.position.x,
          mob.position.y,
          mob.position.z,
          aggroDist,
          'player',
          this.nearbyEntityBuf
        );
        for (let pIdx = 0; pIdx < nearbyPlayers.length; pIdx++) {
          const pEnt = nearbyPlayers[pIdx];
          const pd = mob.position.distanceTo(pEnt.position);
          if (pd < bestPlayerDist) {
            bestPlayerDist = pd;
            targetPos = pEnt.position;
            targetIsLocalPlayer = false;
          }
        }
      } else if (mob.def.type === 'iron_golem' || mob.def.type === 'snow_golem') {
        // Guardians query nearby 3D spatial cells to protect players from hostile/boss mobs in O(k)
        let bestD = 18;
        const nearby = this.world.queryEntitiesInRadius(mob.position.x, mob.position.y, mob.position.z, 18, 'mob', this.nearbyEntityBuf);
        for (let n = 0; n < nearby.length; n++) {
          const other = nearby[n].data as MobEntity | undefined;
          if (other && (other.def.category === 'hostile' || other.def.category === 'boss') && other.health > 0) {
            const d = mob.position.distanceTo(other.position);
            if (d < bestD) {
              bestD = d;
              targetMob = other;
              targetPos = other.position;
            }
          }
        }
      }

      // Friendly NPC proximity awareness & escort behavior
      if (mob.def.category === 'friendly' && !targetMob && player.health > 0) {
        if ((mob.followTimer || 0) > 0 && distToPlayer > 3.6 && distToPlayer < 32) {
          targetPos = player.position;
          chaseSpeed = Math.max(mob.def.speed, 2.8);
        } else if (distToPlayer <= 6.2) {
          isInteractingWithPlayer = true;
          const dx = player.position.x - mob.position.x;
          const dz = player.position.z - mob.position.z;
          mob.yaw = Math.atan2(-dx, -dz);
          if (mob.head) {
            mob.head.rotation.x = Math.sin(mob.animTime * 4.2) * 0.1;
          }
          if (!mob.greetedPlayer && distToPlayer <= 4.2) {
            mob.greetedPlayer = true;
            if (mob.def.moveMode === 'ground') {
              mob.velocity.y = Math.max(mob.velocity.y, 2.6);
            }
            this.spawnMobParticles(mob.position, '#34d399', 6);
          }
        } else if (mob.head) {
          mob.head.rotation.x = 0;
        }
      }

      // Creeper Fuse Mechanics
      if (mob.def.type === 'creeper') {
        const distToTarget = targetPos ? mob.position.distanceTo(targetPos) : Infinity;
        if (targetPos && distToTarget < 3.0) {
          if (!mob.hissPlayed) {
            mob.hissPlayed = true;
            soundFX.playCreeperHiss();
          }
          mob.creeperFuse += dt;
          const swell = 1 + Math.sin(mob.creeperFuse * 18) * 0.08 + mob.creeperFuse * 0.18;
          mob.group.scale.set(swell, 1 + mob.creeperFuse * 0.1, swell);
          chaseSpeed *= 0.25;

          if (mob.creeperFuse >= 1.35) {
            this.triggerExplosion(mob.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 2.2, player, 10);
            this.world.unregisterEntity(mob.id);
            this.scene.remove(mob.group);
            this.mobs.splice(i, 1);
            continue;
          }
        } else {
          mob.creeperFuse = Math.max(0, mob.creeperFuse - dt * 1.5);
          if (mob.creeperFuse === 0) {
            mob.hissPlayed = false;
            mob.group.scale.set(1, 1, 1);
          }
        }
      }

      // Steering & Movement AI
      let moveX = 0;
      let moveZ = 0;

      if (targetPos) {
        const dx = targetPos.x - mob.position.x;
        const dz = targetPos.z - mob.position.z;
        const horizDist = Math.hypot(dx, dz);
        mob.yaw = Math.atan2(-dx, -dz);

        if (mob.def.isRanged && horizDist < mob.def.attackRange * 0.75) {
          // Strafe / keep firing distance
          moveX = 0;
          moveZ = 0;
        } else if (horizDist > 0.4) {
          moveX = (dx / horizDist) * chaseSpeed;
          moveZ = (dz / horizDist) * chaseSpeed;
        }

        // Combat Attacks
        const dist3D = mob.position.distanceTo(targetPos);
        if (dist3D <= mob.def.attackRange && mob.attackCooldown <= 0) {
          if (targetMob) {
            // Guardian attacking hostile mob
            if (mob.def.isRanged) {
              mob.attackCooldown = 1.1;
              this.fireProjectile(
                mob.position.clone().add(new THREE.Vector3(0, 1.35, 0)),
                targetMob.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
                14,
                mob.def.damage,
                '#ffffff',
                false,
                true
              );
            } else {
              mob.attackCooldown = 0.9;
              this.attackMob(
                targetMob,
                mob.def.damage,
                targetMob.position.clone().sub(mob.position),
                dropManager
              );
            }
          } else if (mob.def.category !== 'friendly' && mob.def.type !== 'creeper') {
            // Hostile / Boss attacking Player
            if (mob.def.isRanged) {
              mob.attackCooldown = mob.def.category === 'boss' ? 1.6 : 2.1;
              soundFX.playBowShoot();
              const isExplosive = mob.def.type === 'ghast' || mob.def.type === 'wither' || mob.def.type === 'ender_dragon';
              const projColor =
                mob.def.type === 'blaze' || mob.def.type === 'ghast'
                  ? '#f97316'
                  : mob.def.type === 'witch' || mob.def.type === 'ender_dragon'
                  ? '#d946ef'
                  : mob.def.type === 'wither'
                  ? '#38bdf8'
                  : mob.def.type === 'guardian'
                  ? '#2dd4bf'
                  : '#fef3c7';
              this.fireProjectile(
                mob.position.clone().add(new THREE.Vector3(0, mob.def.height * 0.75, 0)),
                targetPos.clone().add(new THREE.Vector3(0, 1.1, 0)),
                mob.def.category === 'boss' ? 16 : 13,
                mob.def.damage,
                projColor,
                isExplosive,
                false
              );
            } else {
              mob.attackCooldown = 1.15;
              if (targetIsLocalPlayer) {
                player.takeDamage(mob.def.damage);
                const knock = player.position.clone().sub(mob.position);
                knock.y = 0;
                if (knock.lengthSq() > 0.001) knock.normalize();
                player.velocity.x += knock.x * (mob.def.type === 'ravager' ? 9 : 4.5);
                player.velocity.z += knock.z * (mob.def.type === 'ravager' ? 9 : 4.5);
              } else {
                this.spawnMobParticles(targetPos.clone().add(new THREE.Vector3(0, 1.0, 0)), '#ef4444', 5);
              }
            }
          }
        }
      } else if (isInteractingWithPlayer) {
        moveX = 0;
        moveZ = 0;
      } else {
        // Independent Roaming Wander AI across the map
        const isHostileWander = mob.def.category === 'hostile' || mob.def.category === 'boss';
        mob.wanderTimer -= dt;
        if (mob.wanderTimer <= 0) {
          mob.wanderTimer = isHostileWander ? 3.2 + this.rand() * 4.5 : 2.0 + this.rand() * 3.5;
          mob.wanderAngle += (this.rand() - 0.5) * (isHostileWander ? 1.8 : 2.6);

          // Keep roaming bad guys loosely within the active ~52m world ring without walking straight to player
          if (isHostileWander && distToPlayer > 48) {
            const inwardAngle = Math.atan2(-(player.position.x - mob.position.x), -(player.position.z - mob.position.z));
            mob.wanderAngle = inwardAngle + (this.rand() < 0.5 ? 0.75 : -0.75);
          }
        }

        // Continuously keep wandering bad guys split apart so they roam separate areas of the map
        if (isHostileWander) {
          const nearby = this.world.queryEntitiesInRadius(mob.position.x, mob.position.y, mob.position.z, 11, 'mob', this.nearbyEntityBuf);
          for (let n = 0; n < nearby.length; n++) {
            const other = nearby[n].data as MobEntity | undefined;
            if (!other || other === mob) continue;
            if (other.def.category !== 'hostile' && other.def.category !== 'boss') continue;
            const ox = mob.position.x - other.position.x;
            const oz = mob.position.z - other.position.z;
            const oDist = Math.hypot(ox, oz);
            if (oDist > 0.01 && oDist < 10.5) {
              mob.wanderAngle = Math.atan2(-ox, -oz);
              break;
            }
          }
        }

        const idleSpeed = mob.def.speed * (isHostileWander ? 0.65 : 0.45);
        moveX = -Math.sin(mob.wanderAngle) * idleSpeed;
        moveZ = -Math.cos(mob.wanderAngle) * idleSpeed;
        mob.yaw = mob.wanderAngle;
      }

      // Strong anti-clumping separation force via 3D spatial hash (keeps bad guys separate)
      if (mob.def.category === 'hostile' || mob.def.category === 'boss') {
        let sepX = 0;
        let sepZ = 0;
        const sepRadius = targetPos ? 2.8 : 9.0;
        const sepGain = targetPos ? 2.4 : 3.4;
        const nearby = this.world.queryEntitiesInRadius(mob.position.x, mob.position.y, mob.position.z, sepRadius, 'mob', this.nearbyEntityBuf);
        for (let n = 0; n < nearby.length; n++) {
          const other = nearby[n].data as MobEntity | undefined;
          if (!other || other === mob) continue;
          if (other.def.category !== 'hostile' && other.def.category !== 'boss') continue;
          const sx = mob.position.x - other.position.x;
          const sz = mob.position.z - other.position.z;
          const sDist = Math.hypot(sx, sz);
          if (sDist > 0.001 && sDist < sepRadius) {
            const push = (sepRadius - sDist) / sepRadius;
            sepX += (sx / sDist) * push;
            sepZ += (sz / sDist) * push;
          }
        }
        moveX += sepX * sepGain;
        moveZ += sepZ * sepGain;
      }

      // Creaking Gaze Freeze Mechanic: freezes completely while player looks directly at it!
      if (mob.def.type === 'creaking') {
        const playerLook = new THREE.Vector3(0, 0, -1).applyEuler(player.rotation);
        const toMob = mob.position.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(player.position.clone().add(new THREE.Vector3(0, 1.6, 0)));
        const dLen = toMob.length();
        const isWatched = dLen > 0.1 && dLen < 28 && player.cameraMode !== 'top_view' && playerLook.dot(toMob.normalize()) > 0.72;
        mob.isFrozenByGaze = isWatched;
        if (isWatched) {
          moveX = 0;
          moveZ = 0;
          mob.velocity.x = 0;
          mob.velocity.z = 0;
        }
      }

      // Apply horizontal velocity smoothly while preserving knockback decay
      if (!mob.isFrozenByGaze) {
        mob.velocity.x = THREE.MathUtils.lerp(mob.velocity.x, moveX, Math.min(1, dt * 6));
        mob.velocity.z = THREE.MathUtils.lerp(mob.velocity.z, moveZ, Math.min(1, dt * 6));
      }

      if (mob.def.moveMode === 'fly') {
        const desiredAlt =
          (targetPos ? targetPos.y : this.findSurfaceY(Math.floor(mob.position.x), Math.floor(mob.position.z), Math.floor(mob.position.y))) +
          (mob.def.category === 'boss' ? 7.5 : mob.def.type === 'bee' || mob.def.type === 'parrot' ? 2.2 : 3.8);
        const bob = Math.sin(mob.animTime * 2.4) * 0.7;
        mob.velocity.y = THREE.MathUtils.clamp((desiredAlt + bob - mob.position.y) * 2.2, -4, 4);
        mob.position.addScaledVector(mob.velocity, dt);
      } else if (mob.def.moveMode === 'swim') {
        const targetY = 7.4 + Math.sin(mob.animTime * 2.0) * 0.45;
        mob.velocity.y = THREE.MathUtils.clamp((targetY - mob.position.y) * 2.5, -2.5, 2.5);
        mob.position.x += mob.velocity.x * dt;
        mob.position.z += mob.velocity.z * dt;
        mob.position.y += mob.velocity.y * dt;
      } else {
        // Ground Voxel Collision + Step-Up / Jump
        mob.velocity.y -= 22 * dt;
        mob.velocity.y = Math.max(-28, mob.velocity.y);

        const nextX = mob.position.x + mob.velocity.x * dt;
        if (!this.isSolidAt(nextX, mob.position.y + 0.35, mob.position.z) && !this.isSolidAt(nextX, mob.position.y + 1.15, mob.position.z)) {
          mob.position.x = nextX;
        } else if (!this.isSolidAt(nextX, mob.position.y + 1.35, mob.position.z)) {
          mob.velocity.y = Math.max(mob.velocity.y, 7.2);
        } else {
          mob.wanderAngle += Math.PI * 0.6;
          if (targetPos) {
            mob.position.z += Math.sign(targetPos.z - mob.position.z || 1) * chaseSpeed * dt * 0.6;
          }
        }

        const nextZ = mob.position.z + mob.velocity.z * dt;
        if (!this.isSolidAt(mob.position.x, mob.position.y + 0.35, nextZ) && !this.isSolidAt(mob.position.x, mob.position.y + 1.15, nextZ)) {
          mob.position.z = nextZ;
        } else if (!this.isSolidAt(mob.position.x, mob.position.y + 1.35, nextZ)) {
          mob.velocity.y = Math.max(mob.velocity.y, 7.2);
        } else {
          mob.wanderAngle += Math.PI * 0.6;
          if (targetPos) {
            mob.position.x += Math.sign(targetPos.x - mob.position.x || 1) * chaseSpeed * dt * 0.6;
          }
        }

        const nextY = mob.position.y + mob.velocity.y * dt;
        if (mob.velocity.y <= 0 && this.isSolidAt(mob.position.x, nextY, mob.position.z)) {
          mob.position.y = Math.floor(nextY) + 1.0;
          mob.velocity.y = 0;
          if (mob.def.type === 'slime' || mob.def.type === 'frog' || mob.def.type === 'rabbit') {
            if (Math.hypot(mob.velocity.x, mob.velocity.z) > 0.5) {
              mob.velocity.y = 5.4;
            }
          }
        } else if (mob.velocity.y > 0 && this.isSolidAt(mob.position.x, nextY + mob.def.height, mob.position.z)) {
          mob.velocity.y = 0;
        } else {
          mob.position.y = Math.max(1, nextY);
        }
      }

      // Sync Transform, Spatial Hash Cell & Limb/Wing Animations
      mob.group.position.copy(mob.position);
      mob.group.rotation.y = mob.yaw;
      if (mob.spatialHandle) {
        this.world.updateEntitySpatial(mob.spatialHandle);
      }

      const speedMag = Math.hypot(mob.velocity.x, mob.velocity.z);
      if (mob.limbs.length > 0) {
        const swing = speedMag > 0.3 ? Math.sin(mob.animTime * 9.0) * 0.55 : 0;
        mob.limbs.forEach((limb, idx) => {
          limb.rotation.x = idx % 2 === 0 ? swing : -swing;
        });
      }
      if (mob.wings && mob.wings.length > 0) {
        const flap = Math.sin(mob.animTime * (mob.def.type === 'bee' ? 28 : 8)) * 0.55;
        mob.wings.forEach((w, idx) => {
          w.rotation.z = idx % 2 === 0 ? flap : -flap;
        });
      }
      if (mob.orbitGroup) {
        mob.orbitGroup.rotation.y += dt * 3.0;
      }
    }

    // 3. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.age += dt;
      proj.position.addScaledVector(proj.velocity, dt);
      proj.mesh.position.copy(proj.position);

      let removeProj = proj.age > 3.5;

      // Hit terrain
      if (!removeProj && this.isSolidAt(proj.position.x, proj.position.y, proj.position.z)) {
        if (proj.explosive) {
          this.triggerExplosion(proj.position, 1.8, player, proj.damage);
        } else {
          this.spawnMobParticles(proj.position, '#e5e7eb', 4);
        }
        removeProj = true;
      }

      // Hit player or hostile mob
      if (!removeProj && !proj.fromFriendly) {
        const pCenter = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
        if (proj.position.distanceTo(pCenter) < 0.95) {
          if (proj.explosive) {
            this.triggerExplosion(proj.position, 1.8, player, proj.damage);
          } else {
            player.takeDamage(proj.damage);
          }
          removeProj = true;
        }
      } else if (!removeProj && proj.fromFriendly) {
        const nearby = this.world.queryEntitiesInRadius(proj.position.x, proj.position.y - 0.6, proj.position.z, 2.2, 'mob', this.nearbyEntityBuf);
        for (let n = 0; n < nearby.length; n++) {
          const m = nearby[n].data as MobEntity | undefined;
          if (m && (m.def.category === 'hostile' || m.def.category === 'boss')) {
            const dx = proj.position.x - m.position.x;
            const dy = proj.position.y - (m.position.y + m.def.height * 0.5);
            const dz = proj.position.z - m.position.z;
            if (dx * dx + dy * dy + dz * dz < 1.1 * 1.1) {
              this.attackMob(m, proj.damage, proj.velocity, dropManager);
              removeProj = true;
              break;
            }
          }
        }
      }

      if (removeProj) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 4. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.velocity.y -= 16 * dt;
      pt.mesh.position.addScaledVector(pt.velocity, dt);
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  public dispose(): void {
    for (const m of this.mobs) {
      this.world.unregisterEntity(m.id);
      this.scene.remove(m.group);
    }
    this.mobs = [];
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
    for (const pt of this.particles) {
      this.scene.remove(pt.mesh);
    }
    this.particles = [];

    for (const g of this.geoCache.values()) g.dispose();
    for (const m of this.matCache.values()) m.dispose();
    for (const t of this.texCache.values()) t.dispose();
    this.hurtMat.dispose();
    this.fuseMat.dispose();
    this.geoCache.clear();
    this.matCache.clear();
    this.texCache.clear();
  }
}
