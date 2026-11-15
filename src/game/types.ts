export type DimensionId = 'overworld' | 'nether' | 'end';

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD_OAK = 5,
  LEAVES_OAK = 6,
  WOOD_CHERRY = 7,
  LEAVES_CHERRY = 8,
  PLANKS_OAK = 9,
  BRICK = 10,
  GLASS = 11,
  SAND = 12,
  WATER = 13,
  LAVA = 14,
  GOLD_ORE = 15,
  IRON_ORE = 16,
  DIAMOND_ORE = 17,
  COAL_ORE = 18,
  DIAMOND_BLOCK = 19,
  GOLD_BLOCK = 20,
  TNT = 21,
  BOOKSHELF = 22,
  CRAFTING_TABLE = 23,
  FURNACE = 24,
  BEDROCK = 25,
  GLOWSTONE = 26,
  PUMPKIN = 27,
  TORCH = 28,
  SNOW = 29,
  WOOL_RED = 30,
  WOOL_BLUE = 31,
  WOOL_WHITE = 32,
  CACTUS = 33,
  // Gardening, Farming & Nature
  FARMLAND = 34,
  WHEAT_CROP = 35,
  CARROT_CROP = 36,
  POTATO_CROP = 37,
  BEETROOT_CROP = 38,
  MELON_BLOCK = 39,
  SUGAR_CANE = 40,
  BAMBOO = 41,
  POPPY = 42,
  DANDELION = 43,
  TORCHFLOWER = 44,
  WILDFLOWER = 45,
  BEEHIVE = 46,
  GOLDEN_DANDELION = 47,
  BONE_MEAL = 48,
  // Biomes, Dimensions & Boss Trophies
  SCULK = 49,
  PALE_OAK_LOG = 50,
  PALE_OAK_LEAVES = 51,
  OBSIDIAN = 52,
  NETHERRACK = 53,
  NETHER_BRICK = 54,
  SOUL_SAND = 55,
  NETHER_PORTAL = 56,
  END_STONE = 57,
  END_PORTAL_FRAME = 58,
  DRAGON_EGG = 59,
  BEACON = 60,
  // Redstone Engineering
  REDSTONE_DUST = 61,
  REDSTONE_DUST_ON = 62,
  REDSTONE_TORCH = 63,
  PISTON = 64,
  COMPARATOR = 65,
  // Multi-use Tricks, Stations & Quirks
  WATER_BUCKET = 66,
  FLINT_AND_STEEL = 67,
  CANDLE = 68,
  CANDLE_LIT = 69,
  CHAIN = 70,
  NAME_TAG = 71,
  ENCHANTING_TABLE = 72,
  BREWING_STAND = 73,
  NETHER_STAR = 74,
  HAY_BALE = 75,
}

export interface BlockDef {
  id: BlockType;
  name: string;
  category: 'building' | 'nature' | 'ores' | 'special';
  isTransparent?: boolean;
  isLightEmitter?: boolean;
  isFluid?: boolean;
  isCrop?: boolean;
  isFastHoeClear?: boolean;
  blastResistance?: number; // >= 6 survives explosions like solid iron/obsidian
  soundType: 'grass' | 'dirt' | 'stone' | 'wood' | 'glass' | 'sand' | 'wool';
  hardness: number; // break time in seconds
  iconColor: string;
}

export interface PlayerData {
  id: string;
  name: string;
  skin: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  isSneaking: boolean;
  isFlying: boolean;
  isSwinging: boolean;
  heldBlock: BlockType;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RaycastHit {
  blockPosition: [number, number, number];
  neighborPosition: [number, number, number];
  normal: [number, number, number];
  blockType: BlockType;
  distance: number;
}
