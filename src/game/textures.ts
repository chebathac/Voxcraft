import * as THREE from 'three';
import { BlockType, BlockDef } from './types';

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.AIR]: {
    id: BlockType.AIR,
    name: 'Air',
    category: 'special',
    soundType: 'grass',
    hardness: 0,
    iconColor: 'transparent',
  },
  [BlockType.GRASS]: {
    id: BlockType.GRASS,
    name: 'Grass Block',
    category: 'nature',
    soundType: 'grass',
    hardness: 0.5,
    iconColor: '#5b8e3a',
  },
  [BlockType.DIRT]: {
    id: BlockType.DIRT,
    name: 'Dirt',
    category: 'nature',
    soundType: 'dirt',
    hardness: 0.5,
    iconColor: '#866043',
  },
  [BlockType.STONE]: {
    id: BlockType.STONE,
    name: 'Stone',
    category: 'building',
    soundType: 'stone',
    hardness: 1.2,
    iconColor: '#757575',
  },
  [BlockType.COBBLESTONE]: {
    id: BlockType.COBBLESTONE,
    name: 'Cobblestone',
    category: 'building',
    soundType: 'stone',
    hardness: 1.2,
    iconColor: '#5c5c5c',
  },
  [BlockType.WOOD_OAK]: {
    id: BlockType.WOOD_OAK,
    name: 'Oak Log',
    category: 'nature',
    soundType: 'wood',
    hardness: 1.0,
    iconColor: '#6d5432',
  },
  [BlockType.LEAVES_OAK]: {
    id: BlockType.LEAVES_OAK,
    name: 'Oak Leaves',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.2,
    iconColor: '#3d7826',
  },
  [BlockType.WOOD_CHERRY]: {
    id: BlockType.WOOD_CHERRY,
    name: 'Cherry Log',
    category: 'nature',
    soundType: 'wood',
    hardness: 1.0,
    iconColor: '#532938',
  },
  [BlockType.LEAVES_CHERRY]: {
    id: BlockType.LEAVES_CHERRY,
    name: 'Cherry Leaves',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.2,
    iconColor: '#e88ba9',
  },
  [BlockType.PLANKS_OAK]: {
    id: BlockType.PLANKS_OAK,
    name: 'Oak Planks',
    category: 'building',
    soundType: 'wood',
    hardness: 0.8,
    iconColor: '#a07d4f',
  },
  [BlockType.BRICK]: {
    id: BlockType.BRICK,
    name: 'Bricks',
    category: 'building',
    soundType: 'stone',
    hardness: 1.2,
    iconColor: '#964332',
  },
  [BlockType.GLASS]: {
    id: BlockType.GLASS,
    name: 'Glass',
    category: 'building',
    isTransparent: true,
    soundType: 'glass',
    hardness: 0.3,
    iconColor: '#c5e2ec',
  },
  [BlockType.SAND]: {
    id: BlockType.SAND,
    name: 'Sand',
    category: 'nature',
    soundType: 'sand',
    hardness: 0.5,
    iconColor: '#d6c88f',
  },
  [BlockType.WATER]: {
    id: BlockType.WATER,
    name: 'Water',
    category: 'nature',
    isTransparent: true,
    isFluid: true,
    soundType: 'grass',
    hardness: 999,
    iconColor: '#2b5ea8',
  },
  [BlockType.LAVA]: {
    id: BlockType.LAVA,
    name: 'Lava',
    category: 'special',
    isLightEmitter: true,
    isFluid: true,
    soundType: 'stone',
    hardness: 999,
    iconColor: '#d8520e',
  },
  [BlockType.GOLD_ORE]: {
    id: BlockType.GOLD_ORE,
    name: 'Gold Ore',
    category: 'ores',
    soundType: 'stone',
    hardness: 1.5,
    iconColor: '#e5be37',
  },
  [BlockType.IRON_ORE]: {
    id: BlockType.IRON_ORE,
    name: 'Iron Ore',
    category: 'ores',
    soundType: 'stone',
    hardness: 1.4,
    iconColor: '#c7a389',
  },
  [BlockType.DIAMOND_ORE]: {
    id: BlockType.DIAMOND_ORE,
    name: 'Diamond Ore',
    category: 'ores',
    soundType: 'stone',
    hardness: 1.8,
    iconColor: '#4dedf4',
  },
  [BlockType.COAL_ORE]: {
    id: BlockType.COAL_ORE,
    name: 'Coal Ore',
    category: 'ores',
    soundType: 'stone',
    hardness: 1.2,
    iconColor: '#333333',
  },
  [BlockType.DIAMOND_BLOCK]: {
    id: BlockType.DIAMOND_BLOCK,
    name: 'Diamond Block',
    category: 'building',
    soundType: 'stone',
    hardness: 2.0,
    iconColor: '#5ff2e8',
  },
  [BlockType.GOLD_BLOCK]: {
    id: BlockType.GOLD_BLOCK,
    name: 'Block of Gold',
    category: 'building',
    soundType: 'stone',
    hardness: 1.8,
    iconColor: '#f9d332',
  },
  [BlockType.TNT]: {
    id: BlockType.TNT,
    name: 'TNT',
    category: 'special',
    soundType: 'grass',
    hardness: 0.1,
    iconColor: '#db3226',
  },
  [BlockType.BOOKSHELF]: {
    id: BlockType.BOOKSHELF,
    name: 'Bookshelf',
    category: 'building',
    soundType: 'wood',
    hardness: 0.8,
    iconColor: '#8a6538',
  },
  [BlockType.CRAFTING_TABLE]: {
    id: BlockType.CRAFTING_TABLE,
    name: 'Crafting Table',
    category: 'special',
    soundType: 'wood',
    hardness: 0.9,
    iconColor: '#855b32',
  },
  [BlockType.FURNACE]: {
    id: BlockType.FURNACE,
    name: 'Furnace',
    category: 'special',
    soundType: 'stone',
    hardness: 1.5,
    iconColor: '#686868',
  },
  [BlockType.BEDROCK]: {
    id: BlockType.BEDROCK,
    name: 'Bedrock',
    category: 'building',
    soundType: 'stone',
    hardness: 9999,
    iconColor: '#222222',
  },
  [BlockType.GLOWSTONE]: {
    id: BlockType.GLOWSTONE,
    name: 'Glowstone',
    category: 'special',
    isLightEmitter: true,
    soundType: 'glass',
    hardness: 0.4,
    iconColor: '#edd072',
  },
  [BlockType.PUMPKIN]: {
    id: BlockType.PUMPKIN,
    name: 'Pumpkin',
    category: 'nature',
    soundType: 'wood',
    hardness: 0.8,
    iconColor: '#c76e18',
  },
  [BlockType.TORCH]: {
    id: BlockType.TORCH,
    name: 'Torch',
    category: 'special',
    isLightEmitter: true,
    isTransparent: true,
    soundType: 'wood',
    hardness: 0.1,
    iconColor: '#f5c347',
  },
  [BlockType.SNOW]: {
    id: BlockType.SNOW,
    name: 'Snow Block',
    category: 'nature',
    soundType: 'grass',
    hardness: 0.4,
    iconColor: '#f0f5f5',
  },
  [BlockType.WOOL_RED]: {
    id: BlockType.WOOL_RED,
    name: 'Red Wool',
    category: 'building',
    soundType: 'wool',
    hardness: 0.5,
    iconColor: '#a02b28',
  },
  [BlockType.WOOL_BLUE]: {
    id: BlockType.WOOL_BLUE,
    name: 'Blue Wool',
    category: 'building',
    soundType: 'wool',
    hardness: 0.5,
    iconColor: '#2c439b',
  },
  [BlockType.WOOL_WHITE]: {
    id: BlockType.WOOL_WHITE,
    name: 'White Wool',
    category: 'building',
    soundType: 'wool',
    hardness: 0.5,
    iconColor: '#e9ecef',
  },
  [BlockType.CACTUS]: {
    id: BlockType.CACTUS,
    name: 'Cactus',
    category: 'nature',
    soundType: 'wool',
    hardness: 0.4,
    iconColor: '#527d26',
  },
  [BlockType.FARMLAND]: {
    id: BlockType.FARMLAND,
    name: 'Farmland',
    category: 'nature',
    soundType: 'dirt',
    hardness: 0.5,
    iconColor: '#5d3e23',
  },
  [BlockType.WHEAT_CROP]: {
    id: BlockType.WHEAT_CROP,
    name: 'Wheat Crop',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#eab308',
  },
  [BlockType.CARROT_CROP]: {
    id: BlockType.CARROT_CROP,
    name: 'Carrots',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#f97316',
  },
  [BlockType.POTATO_CROP]: {
    id: BlockType.POTATO_CROP,
    name: 'Potatoes',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#ca8a04',
  },
  [BlockType.BEETROOT_CROP]: {
    id: BlockType.BEETROOT_CROP,
    name: 'Beetroots',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#be123c',
  },
  [BlockType.MELON_BLOCK]: {
    id: BlockType.MELON_BLOCK,
    name: 'Melon',
    category: 'nature',
    isCrop: true,
    soundType: 'wood',
    hardness: 0.7,
    iconColor: '#84cc16',
  },
  [BlockType.SUGAR_CANE]: {
    id: BlockType.SUGAR_CANE,
    name: 'Sugar Cane',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#a3e635',
  },
  [BlockType.BAMBOO]: {
    id: BlockType.BAMBOO,
    name: 'Bamboo',
    category: 'nature',
    isTransparent: true,
    isCrop: true,
    isFastHoeClear: true,
    soundType: 'wood',
    hardness: 0.2,
    iconColor: '#65a30d',
  },
  [BlockType.POPPY]: {
    id: BlockType.POPPY,
    name: 'Poppy',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.1,
    iconColor: '#ef4444',
  },
  [BlockType.DANDELION]: {
    id: BlockType.DANDELION,
    name: 'Dandelion',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.1,
    iconColor: '#facc15',
  },
  [BlockType.TORCHFLOWER]: {
    id: BlockType.TORCHFLOWER,
    name: 'Torchflower',
    category: 'nature',
    isTransparent: true,
    isLightEmitter: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.15,
    iconColor: '#fb923c',
  },
  [BlockType.WILDFLOWER]: {
    id: BlockType.WILDFLOWER,
    name: 'Wildflowers',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.1,
    iconColor: '#f472b6',
  },
  [BlockType.BEEHIVE]: {
    id: BlockType.BEEHIVE,
    name: 'Beehive',
    category: 'special',
    soundType: 'wood',
    hardness: 0.6,
    iconColor: '#d97706',
  },
  [BlockType.GOLDEN_DANDELION]: {
    id: BlockType.GOLDEN_DANDELION,
    name: 'Golden Dandelion',
    category: 'special',
    isTransparent: true,
    soundType: 'grass',
    hardness: 0.1,
    iconColor: '#fde047',
  },
  [BlockType.BONE_MEAL]: {
    id: BlockType.BONE_MEAL,
    name: 'Bone Meal',
    category: 'nature',
    soundType: 'sand',
    hardness: 0.2,
    iconColor: '#f8fafc',
  },
  [BlockType.SCULK]: {
    id: BlockType.SCULK,
    name: 'Sculk Block',
    category: 'nature',
    isFastHoeClear: true,
    soundType: 'dirt',
    hardness: 0.6,
    iconColor: '#0e7490',
  },
  [BlockType.PALE_OAK_LOG]: {
    id: BlockType.PALE_OAK_LOG,
    name: 'Pale Oak Log',
    category: 'nature',
    soundType: 'wood',
    hardness: 1.0,
    iconColor: '#9ca3af',
  },
  [BlockType.PALE_OAK_LEAVES]: {
    id: BlockType.PALE_OAK_LEAVES,
    name: 'Pale Oak Leaves',
    category: 'nature',
    isTransparent: true,
    isFastHoeClear: true,
    soundType: 'grass',
    hardness: 0.2,
    iconColor: '#cbd5e1',
  },
  [BlockType.OBSIDIAN]: {
    id: BlockType.OBSIDIAN,
    name: 'Obsidian',
    category: 'building',
    blastResistance: 1200,
    soundType: 'stone',
    hardness: 3.0,
    iconColor: '#312e81',
  },
  [BlockType.NETHERRACK]: {
    id: BlockType.NETHERRACK,
    name: 'Netherrack',
    category: 'building',
    soundType: 'stone',
    hardness: 0.5,
    iconColor: '#7f1d1d',
  },
  [BlockType.NETHER_BRICK]: {
    id: BlockType.NETHER_BRICK,
    name: 'Nether Bricks',
    category: 'building',
    blastResistance: 6.0,
    soundType: 'stone',
    hardness: 1.4,
    iconColor: '#450a0a',
  },
  [BlockType.SOUL_SAND]: {
    id: BlockType.SOUL_SAND,
    name: 'Soul Sand',
    category: 'nature',
    soundType: 'sand',
    hardness: 0.5,
    iconColor: '#574237',
  },
  [BlockType.NETHER_PORTAL]: {
    id: BlockType.NETHER_PORTAL,
    name: 'Nether Portal',
    category: 'special',
    isTransparent: true,
    isLightEmitter: true,
    soundType: 'glass',
    hardness: 1.0,
    iconColor: '#9333ea',
  },
  [BlockType.END_STONE]: {
    id: BlockType.END_STONE,
    name: 'End Stone',
    category: 'building',
    blastResistance: 9.0,
    soundType: 'stone',
    hardness: 1.6,
    iconColor: '#e9e6a8',
  },
  [BlockType.END_PORTAL_FRAME]: {
    id: BlockType.END_PORTAL_FRAME,
    name: 'End Portal',
    category: 'special',
    isLightEmitter: true,
    blastResistance: 1200,
    soundType: 'stone',
    hardness: 2.5,
    iconColor: '#0f766e',
  },
  [BlockType.DRAGON_EGG]: {
    id: BlockType.DRAGON_EGG,
    name: 'Dragon Egg',
    category: 'special',
    isLightEmitter: true,
    blastResistance: 9.0,
    soundType: 'stone',
    hardness: 1.5,
    iconColor: '#a855f7',
  },
  [BlockType.BEACON]: {
    id: BlockType.BEACON,
    name: 'Beacon',
    category: 'special',
    isLightEmitter: true,
    isTransparent: true,
    blastResistance: 6.0,
    soundType: 'glass',
    hardness: 1.2,
    iconColor: '#38bdf8',
  },
  [BlockType.REDSTONE_DUST]: {
    id: BlockType.REDSTONE_DUST,
    name: 'Redstone Dust',
    category: 'ores',
    soundType: 'stone',
    hardness: 0.15,
    iconColor: '#7f1d1d',
  },
  [BlockType.REDSTONE_DUST_ON]: {
    id: BlockType.REDSTONE_DUST_ON,
    name: 'Redstone (Powered)',
    category: 'ores',
    isLightEmitter: true,
    soundType: 'stone',
    hardness: 0.15,
    iconColor: '#ff2222',
  },
  [BlockType.REDSTONE_TORCH]: {
    id: BlockType.REDSTONE_TORCH,
    name: 'Redstone Torch',
    category: 'special',
    isLightEmitter: true,
    isTransparent: true,
    soundType: 'wood',
    hardness: 0.15,
    iconColor: '#ef4444',
  },
  [BlockType.PISTON]: {
    id: BlockType.PISTON,
    name: 'Piston',
    category: 'special',
    soundType: 'stone',
    hardness: 0.8,
    iconColor: '#a8a29e',
  },
  [BlockType.COMPARATOR]: {
    id: BlockType.COMPARATOR,
    name: 'Comparator',
    category: 'special',
    isLightEmitter: true,
    soundType: 'stone',
    hardness: 0.25,
    iconColor: '#b91c1c',
  },
  [BlockType.WATER_BUCKET]: {
    id: BlockType.WATER_BUCKET,
    name: 'Water Bucket',
    category: 'special',
    soundType: 'stone',
    hardness: 0.2,
    iconColor: '#38bdf8',
  },
  [BlockType.FLINT_AND_STEEL]: {
    id: BlockType.FLINT_AND_STEEL,
    name: 'Flint & Steel',
    category: 'special',
    soundType: 'stone',
    hardness: 0.2,
    iconColor: '#f59e0b',
  },
  [BlockType.CANDLE]: {
    id: BlockType.CANDLE,
    name: 'Candle',
    category: 'special',
    isTransparent: true,
    soundType: 'wool',
    hardness: 0.15,
    iconColor: '#fde68a',
  },
  [BlockType.CANDLE_LIT]: {
    id: BlockType.CANDLE_LIT,
    name: 'Lit Candle',
    category: 'special',
    isTransparent: true,
    isLightEmitter: true,
    soundType: 'wool',
    hardness: 0.15,
    iconColor: '#fbbf24',
  },
  [BlockType.CHAIN]: {
    id: BlockType.CHAIN,
    name: 'Iron Chain',
    category: 'building',
    isTransparent: true,
    blastResistance: 6.0, // Matches solid iron block blast resistance!
    soundType: 'stone',
    hardness: 1.5,
    iconColor: '#64748b',
  },
  [BlockType.NAME_TAG]: {
    id: BlockType.NAME_TAG,
    name: 'Name Tag',
    category: 'special',
    soundType: 'wood',
    hardness: 0.2,
    iconColor: '#fcd34d',
  },
  [BlockType.ENCHANTING_TABLE]: {
    id: BlockType.ENCHANTING_TABLE,
    name: 'Enchanting Table',
    category: 'special',
    isLightEmitter: true,
    blastResistance: 1200,
    soundType: 'stone',
    hardness: 1.8,
    iconColor: '#7c3aed',
  },
  [BlockType.BREWING_STAND]: {
    id: BlockType.BREWING_STAND,
    name: 'Brewing Stand',
    category: 'special',
    isLightEmitter: true,
    soundType: 'stone',
    hardness: 0.8,
    iconColor: '#ea580c',
  },
  [BlockType.NETHER_STAR]: {
    id: BlockType.NETHER_STAR,
    name: 'Nether Star',
    category: 'ores',
    isLightEmitter: true,
    soundType: 'glass',
    hardness: 0.3,
    iconColor: '#f0f9ff',
  },
  [BlockType.HAY_BALE]: {
    id: BlockType.HAY_BALE,
    name: 'Hay Bale',
    category: 'building',
    soundType: 'grass',
    hardness: 0.5,
    iconColor: '#eab308',
  },
};

// Procedural Canvas Texture Generator (Zero 404 dependencies!)
class TextureManager {
  private textures: Map<string, THREE.CanvasTexture> = new Map();
  private materials: Map<BlockType, THREE.Material | THREE.Material[]> = new Map();
  private chunkMaterials: Map<BlockType, THREE.Material | THREE.Material[]> = new Map();

  // Helper to create a 16x16 canvas
  private createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // Create THREE.CanvasTexture configured with NearestFilter and SRGBColorSpace
  private createTextureFromCanvas(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Deterministic noise for procedural pixel variations
  private pseudoRand(x: number, y: number, seed = 42): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  public getTexture(name: string): THREE.CanvasTexture {
    if (this.textures.has(name)) {
      return this.textures.get(name)!;
    }

    const { canvas, ctx } = this.createCanvas();

    switch (name) {
      case 'grass_top': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 101);
            const r2 = this.pseudoRand(x >> 1, y >> 1, 107);
            const g = 122 + Math.floor((r * 0.65 + r2 * 0.35) * 48);
            const highlight = r > 0.88 ? 14 : r < 0.14 ? -12 : 0;
            ctx.fillStyle = `rgb(${Math.floor((g + highlight) * 0.43)}, ${Math.min(255, g + highlight)}, ${Math.floor((g + highlight) * 0.25)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'grass_side': {
        // Rich textured dirt base
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 202);
            const dirtVal = 66 + Math.floor(r * 34);
            const pebble = r > 0.9 ? -12 : 0;
            ctx.fillStyle = `rgb(${dirtVal + 34 + pebble}, ${dirtVal + 7 + pebble}, ${dirtVal - 14 + pebble})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        // Lush overhanging grass fringe + 1px dark rim shadow underneath
        for (let x = 0; x < 16; x++) {
          const depth = 3 + Math.floor(this.pseudoRand(x, 0, 303) * 3);
          for (let y = 0; y < depth; y++) {
            const r = this.pseudoRand(x, y, 101);
            const g = 122 + Math.floor(r * 46);
            ctx.fillStyle = `rgb(${Math.floor(g * 0.43)}, ${g}, ${Math.floor(g * 0.25)})`;
            ctx.fillRect(x, y, 1, 1);
          }
          if (depth < 16) {
            ctx.fillStyle = 'rgba(28, 18, 10, 0.38)';
            ctx.fillRect(x, depth, 1, 1);
          }
        }
        break;
      }

      case 'dirt': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 404);
            const val = 64 + Math.floor(r * 36);
            const grit = r > 0.87 ? -10 : r < 0.12 ? 8 : 0;
            ctx.fillStyle = `rgb(${val + 36 + grit}, ${val + 10 + grit}, ${val - 12 + grit})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'stone': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 505);
            const band = this.pseudoRand(x >> 2, y >> 1, 509);
            const val = 104 + Math.floor((r * 0.55 + band * 0.45) * 38);
            ctx.fillStyle = `rgb(${val}, ${val + 1}, ${val + 3})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'cobblestone': {
        ctx.fillStyle = '#5f6166';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 606);
            const val = 88 + Math.floor(r * 52);
            const isBorder = (x % 4 === 0) || (y % 4 === 0 && ((x / 4) | 0) % 2 === 0);
            if (isBorder && r < 0.72) {
              ctx.fillStyle = '#383a3f';
            } else if ((x % 4 === 1 || y % 4 === 1) && r > 0.55) {
              ctx.fillStyle = `rgb(${Math.min(200, val + 18)}, ${Math.min(200, val + 18)}, ${Math.min(205, val + 20)})`;
            } else {
              ctx.fillStyle = `rgb(${val}, ${val}, ${val + 2})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wood_oak_side': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const ridge = x % 4 === 0 ? -16 : x % 4 === 1 ? 10 : 0;
            const r = this.pseudoRand(x, y, 707);
            const val = 88 + ridge + Math.floor(r * 24);
            ctx.fillStyle = `rgb(${Math.floor(val * 1.12)}, ${Math.floor(val * 0.82)}, ${Math.floor(val * 0.5)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wood_oak_top': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const dist = Math.hypot(x - 7.5, y - 7.5);
            const ring = Math.sin(dist * 1.55) > 0 ? 132 : 162;
            const r = this.pseudoRand(x, y, 808);
            const val = ring + Math.floor(r * 18);
            if (dist > 6.7) {
              ctx.fillStyle = '#523b23';
            } else {
              ctx.fillStyle = `rgb(${Math.floor(val * 1.06)}, ${Math.floor(val * 0.88)}, ${Math.floor(val * 0.58)})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'leaves_oak': {
        ctx.clearRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 909);
            if (r > 0.18) {
              const g = 108 + Math.floor(r * 74);
              const tip = r > 0.84 ? 18 : 0;
              ctx.fillStyle = `rgb(${Math.floor(g * 0.34) + tip}, ${Math.min(255, g + tip)}, ${Math.floor(g * 0.23)})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'wood_cherry_side': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 111);
            const val = 60 + Math.floor(r * 25);
            ctx.fillStyle = `rgb(${val + 35}, ${val - 15}, ${val + 5})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'leaves_cherry': {
        ctx.clearRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 222);
            if (r > 0.2) {
              const p = 180 + Math.floor(r * 60);
              ctx.fillStyle = `rgb(${p}, ${Math.floor(p * 0.65)}, ${Math.floor(p * 0.8)})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'planks_oak': {
        ctx.fillStyle = '#b38e58';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 333);
            const isSeam = y % 4 === 0;
            if (isSeam) {
              ctx.fillStyle = '#6d502d';
            } else {
              const val = 145 + Math.floor(r * 30);
              ctx.fillStyle = `rgb(${val + 20}, ${val}, ${val - 35})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'brick': {
        ctx.fillStyle = '#c0c0c0'; // mortar
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          const row = Math.floor(y / 4);
          const isHorizontalMortar = y % 4 === 0;
          for (let x = 0; x < 16; x++) {
            const offset = (row % 2 === 0) ? 0 : 4;
            const isVerticalMortar = (x + offset) % 8 === 0;
            if (isHorizontalMortar || isVerticalMortar) {
              ctx.fillStyle = '#b5b5b5';
            } else {
              const r = this.pseudoRand(x, y, 444);
              const red = 150 + Math.floor(r * 40);
              ctx.fillStyle = `rgb(${red}, ${Math.floor(red * 0.45)}, ${Math.floor(red * 0.35)})`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'glass': {
        ctx.clearRect(0, 0, 16, 16);
        // Frosted cyan edges with glare
        ctx.fillStyle = 'rgba(215, 240, 255, 0.65)';
        ctx.strokeRect(0.5, 0.5, 15, 15);
        // Diagonal highlight streak
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let i = 2; i < 7; i++) {
          ctx.fillRect(i, i, 1, 1);
        }
        for (let i = 8; i < 12; i++) {
          ctx.fillRect(i, i - 3, 1, 1);
        }
        break;
      }

      case 'sand': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 555);
            const val = 190 + Math.floor(r * 35);
            ctx.fillStyle = `rgb(${val + 15}, ${val}, ${val - 45})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'water': {
        ctx.fillStyle = 'rgba(28, 108, 206, 0.78)';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const wave = Math.sin((x + y * 2) * 0.65);
            const r = this.pseudoRand(x, y, 666);
            if (wave > 0.55 && r > 0.45) {
              ctx.fillStyle = 'rgba(135, 208, 255, 0.86)';
              ctx.fillRect(x, y, 1, 1);
            } else if (r > 0.65) {
              ctx.fillStyle = 'rgba(58, 148, 240, 0.82)';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'lava': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 777);
            if (r > 0.72) {
              ctx.fillStyle = '#fff066';
            } else if (r > 0.32) {
              ctx.fillStyle = '#f25d16';
            } else {
              ctx.fillStyle = '#9b1c0c';
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'diamond_ore':
      case 'gold_ore':
      case 'iron_ore':
      case 'coal_ore': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 505);
            const band = this.pseudoRand(x >> 2, y >> 1, 509);
            const val = 100 + Math.floor((r * 0.55 + band * 0.45) * 36);
            ctx.fillStyle = `rgb(${val}, ${val + 1}, ${val + 3})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        const oreColor =
          name === 'diamond_ore' ? '#3eeef8' :
          name === 'gold_ore' ? '#fad332' :
          name === 'iron_ore' ? '#dba987' : '#242428';
        const glintColor =
          name === 'diamond_ore' ? '#c8ffff' :
          name === 'gold_ore' ? '#fff7b2' :
          name === 'iron_ore' ? '#f6dfd0' : '#4a4a52';
        for (let y = 1; y < 14; y++) {
          for (let x = 1; x < 14; x++) {
            const r = this.pseudoRand(x, y, 888);
            if (r > 0.83) {
              ctx.fillStyle = 'rgba(30,30,36,0.5)';
              ctx.fillRect(x + 1, y + 1, 2, 2);
              ctx.fillStyle = oreColor;
              ctx.fillRect(x, y, 2, 2);
              ctx.fillStyle = glintColor;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'diamond_block': {
        ctx.fillStyle = '#4dedf4';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#a6ffff';
        ctx.strokeRect(1, 1, 14, 14);
        ctx.fillStyle = '#2db8bf';
        ctx.strokeRect(2, 2, 12, 12);
        break;
      }

      case 'gold_block': {
        ctx.fillStyle = '#f7d33b';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#fff48f';
        ctx.strokeRect(1, 1, 14, 14);
        ctx.fillStyle = '#c29d15';
        ctx.strokeRect(2, 2, 12, 12);
        break;
      }

      case 'tnt_side': {
        ctx.fillStyle = '#d63326';
        ctx.fillRect(0, 0, 16, 16);
        // White band with TNT text
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 5, 16, 6);
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 5px sans-serif';
        ctx.fillText('TNT', 2, 10);
        break;
      }

      case 'tnt_top': {
        ctx.fillStyle = '#c82e22';
        ctx.fillRect(0, 0, 16, 16);
        // Fuse in center
        ctx.fillStyle = '#e8d28a';
        ctx.fillRect(6, 6, 4, 4);
        ctx.fillStyle = '#111111';
        ctx.fillRect(7, 7, 2, 2);
        break;
      }

      case 'bookshelf': {
        ctx.fillStyle = '#9e7344'; // wood frame
        ctx.fillRect(0, 0, 16, 16);
        const bookColors = ['#a82b2b', '#2b5ea8', '#2d8c3f', '#966326', '#4a2ba8', '#2b8ca8'];
        // Two shelves
        [2, 9].forEach((shelfY) => {
          ctx.fillStyle = '#5c3e21';
          ctx.fillRect(1, shelfY, 14, 5);
          for (let bx = 2; bx < 14; bx += 2) {
            ctx.fillStyle = bookColors[(bx + shelfY) % bookColors.length];
            ctx.fillRect(bx, shelfY, 1, 5);
          }
        });
        break;
      }

      case 'crafting_table_top': {
        ctx.fillStyle = '#a67d4f';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#5c4125';
        ctx.strokeRect(1, 1, 14, 14);
        // 3x3 grid
        ctx.strokeStyle = '#5c4125';
        ctx.beginPath();
        ctx.moveTo(6, 2); ctx.lineTo(6, 14);
        ctx.moveTo(10, 2); ctx.lineTo(10, 14);
        ctx.moveTo(2, 6); ctx.lineTo(14, 6);
        ctx.moveTo(2, 10); ctx.lineTo(14, 10);
        ctx.stroke();
        break;
      }

      case 'crafting_table_side': {
        ctx.fillStyle = '#8f683e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#4f351c';
        ctx.strokeRect(0, 0, 16, 16);
        // mini tools motif
        ctx.fillStyle = '#c7c7c7';
        ctx.fillRect(4, 5, 2, 6);
        ctx.fillRect(10, 5, 2, 6);
        break;
      }

      case 'furnace_front': {
        ctx.fillStyle = '#6e6e6e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#222222';
        // arch oven door
        ctx.fillRect(4, 7, 8, 7);
        ctx.fillStyle = '#ff7b00';
        ctx.fillRect(6, 10, 4, 3);
        break;
      }

      case 'bedrock': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 999);
            const val = 20 + Math.floor(r * 50);
            ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'glowstone': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1212);
            const g = 190 + Math.floor(r * 50);
            ctx.fillStyle = `rgb(${g}, ${Math.floor(g * 0.85)}, ${Math.floor(g * 0.4)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'pumpkin_side': {
        ctx.fillStyle = '#d97418';
        ctx.fillRect(0, 0, 16, 16);
        // vertical ribs
        for (let x = 0; x < 16; x += 3) {
          ctx.fillStyle = '#aa5209';
          ctx.fillRect(x, 0, 1, 16);
        }
        break;
      }

      case 'pumpkin_face': {
        ctx.fillStyle = '#d97418';
        ctx.fillRect(0, 0, 16, 16);
        for (let x = 0; x < 16; x += 3) {
          ctx.fillStyle = '#aa5209';
          ctx.fillRect(x, 0, 1, 16);
        }
        // Carved face
        ctx.fillStyle = '#221100';
        ctx.fillRect(3, 4, 3, 3);
        ctx.fillRect(10, 4, 3, 3);
        ctx.fillRect(7, 7, 2, 2);
        ctx.fillRect(4, 11, 8, 2);
        ctx.fillRect(3, 10, 2, 2);
        ctx.fillRect(11, 10, 2, 2);
        break;
      }

      case 'snow': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1313);
            const val = 235 + Math.floor(r * 20);
            ctx.fillStyle = `rgb(${val - 5}, ${val}, ${val + 5})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wool_red':
      case 'wool_blue':
      case 'wool_white': {
        const base =
          name === 'wool_red' ? [160, 40, 40] :
          name === 'wool_blue' ? [45, 70, 170] : [230, 230, 235];
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1414);
            const mod = (r - 0.5) * 30;
            ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, base[0] + mod))}, ${Math.max(0, Math.min(255, base[1] + mod))}, ${Math.max(0, Math.min(255, base[2] + mod))})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'cactus': {
        ctx.fillStyle = '#527d26';
        ctx.fillRect(0, 0, 16, 16);
        // Vertical ribs
        ctx.fillStyle = '#3c5d1b';
        for (let x = 1; x < 16; x += 4) {
          ctx.fillRect(x, 0, 1, 16);
        }
        // Spines
        ctx.fillStyle = '#1c2e0b';
        for (let y = 2; y < 16; y += 4) {
          ctx.fillRect(2, y, 1, 1);
          ctx.fillRect(6, y + 2, 1, 1);
          ctx.fillRect(10, y, 1, 1);
          ctx.fillRect(14, y + 2, 1, 1);
        }
        break;
      }

      case 'farmland': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const furrow = y % 4 === 0 ? -18 : 6;
            const r = this.pseudoRand(x, y, 1515);
            const v = 72 + furrow + Math.floor(r * 16);
            ctx.fillStyle = `rgb(${v + 24}, ${v + 4}, ${v - 18})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'wheat_crop':
      case 'carrot_crop':
      case 'potato_crop':
      case 'beetroot_crop':
      case 'sugar_cane':
      case 'bamboo': {
        ctx.clearRect(0, 0, 16, 16);
        const stalk =
          name === 'wheat_crop' ? '#eab308' :
          name === 'sugar_cane' ? '#a3e635' :
          name === 'bamboo' ? '#65a30d' : '#16a34a';
        const tip =
          name === 'wheat_crop' ? '#fef08a' :
          name === 'carrot_crop' ? '#f97316' :
          name === 'potato_crop' ? '#ca8a04' :
          name === 'beetroot_crop' ? '#e11d48' :
          name === 'bamboo' ? '#84cc16' : '#d9f99d';
        for (let x = 2; x < 15; x += 4) {
          ctx.fillStyle = stalk;
          ctx.fillRect(x, 4, 2, 12);
          ctx.fillStyle = tip;
          ctx.fillRect(x - 1, 1, 3, 4);
        }
        break;
      }

      case 'melon': {
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(0, 0, 16, 16);
        for (let x = 0; x < 16; x += 4) {
          ctx.fillStyle = '#365314';
          ctx.fillRect(x, 0, 1, 16);
          ctx.fillStyle = '#a3e635';
          ctx.fillRect(x + 2, 0, 1, 16);
        }
        break;
      }

      case 'poppy':
      case 'dandelion':
      case 'torchflower':
      case 'wildflower':
      case 'golden_dandelion': {
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(7, 7, 2, 9);
        ctx.fillRect(5, 11, 2, 2);
        ctx.fillRect(9, 10, 2, 2);
        ctx.fillStyle =
          name === 'poppy' ? '#ef4444' :
          name === 'torchflower' ? '#fb923c' :
          name === 'wildflower' ? '#f472b6' :
          name === 'golden_dandelion' ? '#fde047' : '#facc15';
        ctx.fillRect(5, 2, 6, 5);
        ctx.fillStyle = name === 'torchflower' ? '#fef08a' : '#78350f';
        ctx.fillRect(7, 4, 2, 2);
        break;
      }

      case 'beehive': {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(0, 4, 16, 1);
        ctx.fillRect(0, 10, 16, 1);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(4, 6, 8, 2);
        break;
      }

      case 'sculk': {
        ctx.fillStyle = '#07222b';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1616);
            if (r > 0.78) {
              ctx.fillStyle = r > 0.92 ? '#22d3ee' : '#0891b2';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'pale_oak_log': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1717);
            const v = (x % 4 === 0 ? 115 : 155) + Math.floor(r * 25);
            ctx.fillStyle = `rgb(${v}, ${v + 2}, ${v + 6})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'pale_oak_leaves': {
        ctx.clearRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1818);
            if (r > 0.2) {
              const v = 175 + Math.floor(r * 55);
              ctx.fillStyle = `rgb(${v}, ${v + 5}, ${v + 12})`;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'obsidian': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 1919);
            ctx.fillStyle = r > 0.8 ? '#4c1d95' : r > 0.4 ? '#1e1b4b' : '#09090b';
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'netherrack': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 2020);
            const red = 95 + Math.floor(r * 55);
            ctx.fillStyle = `rgb(${red}, ${Math.floor(red * 0.28)}, ${Math.floor(red * 0.28)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'nether_brick': {
        ctx.fillStyle = '#2a090c';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const offset = Math.floor(y / 4) % 2 === 0 ? 0 : 4;
            if (y % 4 === 0 || (x + offset) % 8 === 0) {
              ctx.fillStyle = '#190507';
            } else {
              const r = this.pseudoRand(x, y, 2121);
              ctx.fillStyle = `rgb(${64 + Math.floor(r * 22)}, 22, 26)`;
            }
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'soul_sand': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 2222);
            const v = 55 + Math.floor(r * 28);
            ctx.fillStyle = `rgb(${v + 24}, ${v + 10}, ${v})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'nether_portal': {
        ctx.fillStyle = 'rgba(147, 51, 234, 0.78)';
        ctx.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            if (this.pseudoRand(x, y, 2323) > 0.65) {
              ctx.fillStyle = 'rgba(216, 180, 254, 0.85)';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
        break;
      }

      case 'end_stone': {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const r = this.pseudoRand(x, y, 2424);
            const v = 200 + Math.floor(r * 35);
            ctx.fillStyle = `rgb(${v}, ${v}, ${Math.floor(v * 0.72)})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        break;
      }

      case 'end_portal_frame': {
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#111827';
        ctx.fillRect(3, 3, 10, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(6, 6, 4, 4);
        break;
      }

      case 'dragon_egg': {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#c026d3';
        ctx.fillRect(4, 3, 8, 10);
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(6, 5, 4, 4);
        break;
      }

      case 'beacon': {
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(2, 2, 12, 12);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(5, 5, 6, 6);
        break;
      }

      case 'redstone_dust':
      case 'redstone_dust_on': {
        const lit = name === 'redstone_dust_on';
        ctx.fillStyle = lit ? '#450a0a' : '#291515';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = lit ? '#ff2a2a' : '#7f1d1d';
        ctx.fillRect(6, 0, 4, 16);
        ctx.fillRect(0, 6, 16, 4);
        if (lit) {
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(7, 7, 2, 2);
        }
        break;
      }

      case 'redstone_torch': {
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#855832';
        ctx.fillRect(6, 6, 4, 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(5, 2, 6, 5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(7, 3, 2, 2);
        break;
      }

      case 'piston': {
        ctx.fillStyle = '#78716c';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, 0, 16, 4);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(6, 6, 4, 6);
        break;
      }

      case 'comparator': {
        ctx.fillStyle = '#a8a29e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(3, 10, 3, 4);
        ctx.fillRect(10, 10, 3, 4);
        ctx.fillRect(7, 3, 2, 4);
        break;
      }

      case 'chain': {
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(6, 0, 4, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(7, 1, 2, 4);
        ctx.fillRect(7, 7, 2, 4);
        ctx.fillRect(7, 13, 2, 3);
        break;
      }

      case 'candle':
      case 'candle_lit': {
        ctx.clearRect(0, 0, 16, 16);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(6, 6, 4, 10);
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(7, 4, 2, 2);
        if (name === 'candle_lit') {
          ctx.fillStyle = '#fb923c';
          ctx.fillRect(6, 1, 4, 3);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(7, 2, 2, 2);
        }
        break;
      }

      case 'enchanting_table': {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 16, 5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(4, 2, 2, 2);
        ctx.fillRect(10, 2, 2, 2);
        break;
      }

      case 'brewing_stand': {
        ctx.fillStyle = '#44403c';
        ctx.fillRect(0, 12, 16, 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(7, 2, 2, 10);
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(3, 8, 4, 4);
        ctx.fillRect(9, 8, 4, 4);
        break;
      }

      case 'hay_bale': {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#ca8a04';
        for (let y = 0; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(4, 0, 2, 16);
        ctx.fillRect(10, 0, 2, 16);
        break;
      }

      case 'util_item': {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(2, 2, 12, 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(4, 4, 8, 8);
        break;
      }

      default: {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 16, 16);
      }
    }

    const texture = this.createTextureFromCanvas(canvas);
    this.textures.set(name, texture);
    return texture;
  }

  // Returns either a single Material or a 6-face Material array [Right, Left, Top, Bottom, Front, Back]
  public getBlockMaterials(blockType: BlockType): THREE.Material | THREE.Material[] {
    if (this.materials.has(blockType)) {
      return this.materials.get(blockType)!;
    }

    let mat: THREE.Material | THREE.Material[];

    switch (blockType) {
      case BlockType.GRASS: {
        const top = new THREE.MeshLambertMaterial({ map: this.getTexture('grass_top') });
        const bottom = new THREE.MeshLambertMaterial({ map: this.getTexture('dirt') });
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('grass_side') });
        // Order: +X, -X, +Y, -Y, +Z, -Z
        mat = [side, side, top, bottom, side, side];
        break;
      }

      case BlockType.WOOD_OAK: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('wood_oak_side') });
        const top = new THREE.MeshLambertMaterial({ map: this.getTexture('wood_oak_top') });
        mat = [side, side, top, top, side, side];
        break;
      }

      case BlockType.WOOD_CHERRY: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('wood_cherry_side') });
        const top = new THREE.MeshLambertMaterial({ map: this.getTexture('wood_oak_top') });
        mat = [side, side, top, top, side, side];
        break;
      }

      case BlockType.LEAVES_OAK: {
        mat = new THREE.MeshLambertMaterial({
          map: this.getTexture('leaves_oak'),
          transparent: true,
          alphaTest: 0.25,
        });
        break;
      }

      case BlockType.LEAVES_CHERRY: {
        mat = new THREE.MeshLambertMaterial({
          map: this.getTexture('leaves_cherry'),
          transparent: true,
          alphaTest: 0.25,
        });
        break;
      }

      case BlockType.GLASS: {
        mat = new THREE.MeshLambertMaterial({
          map: this.getTexture('glass'),
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        break;
      }

      case BlockType.WATER: {
        mat = new THREE.MeshLambertMaterial({
          map: this.getTexture('water'),
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });
        break;
      }

      case BlockType.LAVA: {
        mat = new THREE.MeshBasicMaterial({
          map: this.getTexture('lava'),
        });
        break;
      }

      case BlockType.TNT: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('tnt_side') });
        const top = new THREE.MeshLambertMaterial({ map: this.getTexture('tnt_top') });
        mat = [side, side, top, top, side, side];
        break;
      }

      case BlockType.CRAFTING_TABLE: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('crafting_table_side') });
        const top = new THREE.MeshLambertMaterial({ map: this.getTexture('crafting_table_top') });
        const bottom = new THREE.MeshLambertMaterial({ map: this.getTexture('planks_oak') });
        mat = [side, side, top, bottom, side, side];
        break;
      }

      case BlockType.FURNACE: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('stone') });
        const front = new THREE.MeshLambertMaterial({ map: this.getTexture('furnace_front') });
        mat = [side, side, side, side, front, side];
        break;
      }

      case BlockType.PUMPKIN: {
        const side = new THREE.MeshLambertMaterial({ map: this.getTexture('pumpkin_side') });
        const front = new THREE.MeshLambertMaterial({ map: this.getTexture('pumpkin_face') });
        mat = [side, side, side, side, front, side];
        break;
      }

      case BlockType.GLOWSTONE:
      case BlockType.REDSTONE_DUST_ON:
      case BlockType.REDSTONE_TORCH:
      case BlockType.CANDLE_LIT:
      case BlockType.END_PORTAL_FRAME:
      case BlockType.DRAGON_EGG:
      case BlockType.BEACON:
      case BlockType.TORCHFLOWER: {
        const emMapName =
          blockType === BlockType.GLOWSTONE ? 'glowstone' :
          blockType === BlockType.REDSTONE_DUST_ON ? 'redstone_dust_on' :
          blockType === BlockType.REDSTONE_TORCH ? 'redstone_torch' :
          blockType === BlockType.CANDLE_LIT ? 'candle_lit' :
          blockType === BlockType.END_PORTAL_FRAME ? 'end_portal_frame' :
          blockType === BlockType.DRAGON_EGG ? 'dragon_egg' :
          blockType === BlockType.BEACON ? 'beacon' : 'torchflower';
        const isCutout =
          blockType === BlockType.REDSTONE_TORCH ||
          blockType === BlockType.CANDLE_LIT ||
          blockType === BlockType.TORCHFLOWER;
        mat = new THREE.MeshBasicMaterial({
          map: this.getTexture(emMapName),
          transparent: isCutout,
          alphaTest: isCutout ? 0.25 : 0,
        });
        break;
      }

      case BlockType.NETHER_PORTAL: {
        mat = new THREE.MeshBasicMaterial({
          map: this.getTexture('nether_portal'),
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        });
        break;
      }

      case BlockType.WHEAT_CROP:
      case BlockType.CARROT_CROP:
      case BlockType.POTATO_CROP:
      case BlockType.BEETROOT_CROP:
      case BlockType.SUGAR_CANE:
      case BlockType.BAMBOO:
      case BlockType.POPPY:
      case BlockType.DANDELION:
      case BlockType.WILDFLOWER:
      case BlockType.GOLDEN_DANDELION:
      case BlockType.PALE_OAK_LEAVES:
      case BlockType.CHAIN:
      case BlockType.CANDLE: {
        const cutMapName =
          blockType === BlockType.WHEAT_CROP ? 'wheat_crop' :
          blockType === BlockType.CARROT_CROP ? 'carrot_crop' :
          blockType === BlockType.POTATO_CROP ? 'potato_crop' :
          blockType === BlockType.BEETROOT_CROP ? 'beetroot_crop' :
          blockType === BlockType.SUGAR_CANE ? 'sugar_cane' :
          blockType === BlockType.BAMBOO ? 'bamboo' :
          blockType === BlockType.POPPY ? 'poppy' :
          blockType === BlockType.DANDELION ? 'dandelion' :
          blockType === BlockType.WILDFLOWER ? 'wildflower' :
          blockType === BlockType.GOLDEN_DANDELION ? 'golden_dandelion' :
          blockType === BlockType.PALE_OAK_LEAVES ? 'pale_oak_leaves' :
          blockType === BlockType.CHAIN ? 'chain' : 'candle';
        mat = new THREE.MeshLambertMaterial({
          map: this.getTexture(cutMapName),
          transparent: true,
          alphaTest: 0.25,
        });
        break;
      }

      default: {
        const mapName =
          blockType === BlockType.DIRT ? 'dirt' :
          blockType === BlockType.STONE ? 'stone' :
          blockType === BlockType.COBBLESTONE ? 'cobblestone' :
          blockType === BlockType.PLANKS_OAK ? 'planks_oak' :
          blockType === BlockType.BRICK ? 'brick' :
          blockType === BlockType.SAND ? 'sand' :
          blockType === BlockType.GOLD_ORE ? 'gold_ore' :
          blockType === BlockType.IRON_ORE ? 'iron_ore' :
          blockType === BlockType.DIAMOND_ORE ? 'diamond_ore' :
          blockType === BlockType.COAL_ORE ? 'coal_ore' :
          blockType === BlockType.DIAMOND_BLOCK ? 'diamond_block' :
          blockType === BlockType.GOLD_BLOCK ? 'gold_block' :
          blockType === BlockType.BOOKSHELF ? 'bookshelf' :
          blockType === BlockType.BEDROCK ? 'bedrock' :
          blockType === BlockType.SNOW ? 'snow' :
          blockType === BlockType.WOOL_RED ? 'wool_red' :
          blockType === BlockType.WOOL_BLUE ? 'wool_blue' :
          blockType === BlockType.WOOL_WHITE ? 'wool_white' :
          blockType === BlockType.CACTUS ? 'cactus' :
          blockType === BlockType.FARMLAND ? 'farmland' :
          blockType === BlockType.MELON_BLOCK ? 'melon' :
          blockType === BlockType.BEEHIVE ? 'beehive' :
          blockType === BlockType.SCULK ? 'sculk' :
          blockType === BlockType.PALE_OAK_LOG ? 'pale_oak_log' :
          blockType === BlockType.OBSIDIAN ? 'obsidian' :
          blockType === BlockType.NETHERRACK ? 'netherrack' :
          blockType === BlockType.NETHER_BRICK ? 'nether_brick' :
          blockType === BlockType.SOUL_SAND ? 'soul_sand' :
          blockType === BlockType.END_STONE ? 'end_stone' :
          blockType === BlockType.REDSTONE_DUST ? 'redstone_dust' :
          blockType === BlockType.PISTON ? 'piston' :
          blockType === BlockType.COMPARATOR ? 'comparator' :
          blockType === BlockType.ENCHANTING_TABLE ? 'enchanting_table' :
          blockType === BlockType.BREWING_STAND ? 'brewing_stand' :
          blockType === BlockType.HAY_BALE ? 'hay_bale' :
          blockType === BlockType.WATER_BUCKET ||
          blockType === BlockType.FLINT_AND_STEEL ||
          blockType === BlockType.BONE_MEAL ||
          blockType === BlockType.NAME_TAG ||
          blockType === BlockType.NETHER_STAR
            ? 'util_item'
            : 'stone';

        mat = new THREE.MeshLambertMaterial({ map: this.getTexture(mapName) });
      }
    }

    this.materials.set(blockType, mat);
    return mat;
  }

  // Returns chunk-meshed materials with vertexColors enabled for baked voxel Ambient Occlusion
  public getChunkBlockMaterials(blockType: BlockType): THREE.Material | THREE.Material[] {
    if (this.chunkMaterials.has(blockType)) {
      return this.chunkMaterials.get(blockType)!;
    }

    const base = this.getBlockMaterials(blockType);
    const cloneWithVC = (m: THREE.Material): THREE.Material => {
      const cloned = m.clone();
      cloned.vertexColors = true;
      cloned.needsUpdate = true;
      return cloned;
    };

    const vcMat = Array.isArray(base) ? base.map(cloneWithVC) : cloneWithVC(base);
    this.chunkMaterials.set(blockType, vcMat);
    return vcMat;
  }
}

export const textureManager = new TextureManager();
