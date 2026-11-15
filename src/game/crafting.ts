import { BlockType } from './types';
import { BLOCK_DEFS } from './textures';

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'building' | 'decorations' | 'blocks' | 'special';
  output: {
    block: BlockType;
    count: number;
  };
  // Grid pattern: rows of length 1-3. null or BlockType.AIR = empty
  pattern?: (BlockType | null)[][];
  // For shapeless recipes: simple bag of ingredients
  shapeless?: BlockType[];
  description: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // 1. Oak Planks from Oak Log
  {
    id: 'oak_planks',
    name: 'Oak Planks',
    category: 'building',
    output: { block: BlockType.PLANKS_OAK, count: 4 },
    shapeless: [BlockType.WOOD_OAK],
    description: 'Refine raw oak logs into durable construction planks.',
  },
  // 2. Planks from Cherry Log
  {
    id: 'cherry_planks',
    name: 'Cherry Wood Planks',
    category: 'building',
    output: { block: BlockType.PLANKS_OAK, count: 4 },
    shapeless: [BlockType.WOOD_CHERRY],
    description: 'Mill cherry logs into building lumber.',
  },
  // 3. Crafting Table from 4 Planks (2x2)
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    category: 'special',
    output: { block: BlockType.CRAFTING_TABLE, count: 1 },
    pattern: [
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
    ],
    description: 'Assemble 4 planks into an advanced 3x3 work bench.',
  },
  // 4. Furnace from 8 Cobblestone (ring)
  {
    id: 'furnace',
    name: 'Furnace',
    category: 'special',
    output: { block: BlockType.FURNACE, count: 1 },
    pattern: [
      [BlockType.COBBLESTONE, BlockType.COBBLESTONE, BlockType.COBBLESTONE],
      [BlockType.COBBLESTONE, null, BlockType.COBBLESTONE],
      [BlockType.COBBLESTONE, BlockType.COBBLESTONE, BlockType.COBBLESTONE],
    ],
    description: 'Chisel an 8-stone firebox for smelting.',
  },
  // 5. Torches from Coal + Plank/Stick (vertical stack)
  {
    id: 'torches',
    name: 'Torches',
    category: 'decorations',
    output: { block: BlockType.TORCH, count: 4 },
    pattern: [
      [BlockType.COAL_ORE],
      [BlockType.PLANKS_OAK],
    ],
    description: 'Mount coal onto wood to produce 4 bright light sources.',
  },
  // 6. Bricks from 4 Stone (2x2)
  {
    id: 'bricks',
    name: 'Bricks',
    category: 'building',
    output: { block: BlockType.BRICK, count: 4 },
    pattern: [
      [BlockType.STONE, BlockType.STONE],
      [BlockType.STONE, BlockType.STONE],
    ],
    description: 'Kiln-fire stones into architectural red bricks.',
  },
  // 7. Bookshelf: 6 Planks + 3 Glass/Sand (top & bottom rows)
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'decorations',
    output: { block: BlockType.BOOKSHELF, count: 1 },
    pattern: [
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
      [BlockType.GLASS, BlockType.GLASS, BlockType.GLASS],
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
    ],
    description: 'Frame decorative shelving with display cases.',
  },
  // 8. TNT: 4 Sand + 5 Dirt/Coal
  {
    id: 'tnt',
    name: 'TNT Explosive',
    category: 'special',
    output: { block: BlockType.TNT, count: 1 },
    pattern: [
      [BlockType.COAL_ORE, BlockType.SAND, BlockType.COAL_ORE],
      [BlockType.SAND, BlockType.COAL_ORE, BlockType.SAND],
      [BlockType.COAL_ORE, BlockType.SAND, BlockType.COAL_ORE],
    ],
    description: 'Combine volatile coal powder and dense sand for mining charges.',
  },
  // 9. Block of Diamond: 9 Diamond Ores
  {
    id: 'diamond_block',
    name: 'Block of Diamond',
    category: 'blocks',
    output: { block: BlockType.DIAMOND_BLOCK, count: 1 },
    pattern: [
      [BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE],
      [BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE],
      [BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE, BlockType.DIAMOND_ORE],
    ],
    description: 'Compress 9 raw diamonds into an ultra-luxurious gem monolith.',
  },
  // 10. Block of Gold: 9 Gold Ores
  {
    id: 'gold_block',
    name: 'Block of Gold',
    category: 'blocks',
    output: { block: BlockType.GOLD_BLOCK, count: 1 },
    pattern: [
      [BlockType.GOLD_ORE, BlockType.GOLD_ORE, BlockType.GOLD_ORE],
      [BlockType.GOLD_ORE, BlockType.GOLD_ORE, BlockType.GOLD_ORE],
      [BlockType.GOLD_ORE, BlockType.GOLD_ORE, BlockType.GOLD_ORE],
    ],
    description: 'Forge 9 gold ores into a solid lustrous gilded block.',
  },
  // 11. Glowstone: 4 Sand + 4 Gold or 2x2 Gold Ores
  {
    id: 'glowstone',
    name: 'Glowstone',
    category: 'special',
    output: { block: BlockType.GLOWSTONE, count: 1 },
    pattern: [
      [BlockType.GOLD_ORE, BlockType.TORCH],
      [BlockType.TORCH, BlockType.GOLD_ORE],
    ],
    description: 'Fuse gold resonance with torches to create radiant glowstone.',
  },
  // 12. Glass from Sand + Torch
  {
    id: 'glass',
    name: 'Clear Glass',
    category: 'building',
    output: { block: BlockType.GLASS, count: 2 },
    pattern: [
      [BlockType.SAND],
      [BlockType.TORCH],
    ],
    description: 'Vitrify silica sand with high torch heat into translucent glass.',
  },
  // 13. White Wool from 4 Grass blocks
  {
    id: 'white_wool',
    name: 'White Wool',
    category: 'building',
    output: { block: BlockType.WOOL_WHITE, count: 2 },
    pattern: [
      [BlockType.GRASS, BlockType.GRASS],
      [BlockType.GRASS, BlockType.GRASS],
    ],
    description: 'Weave wild organic fibers into soft building wool.',
  },
  // 14. Red Wool from White Wool + TNT / Pumpkin
  {
    id: 'red_wool',
    name: 'Red Wool',
    category: 'building',
    output: { block: BlockType.WOOL_RED, count: 1 },
    shapeless: [BlockType.WOOL_WHITE, BlockType.BRICK],
    description: 'Dye neutral wool with rich terracotta pigments.',
  },
  // 15. Blue Wool from White Wool + Water
  {
    id: 'blue_wool',
    name: 'Blue Wool',
    category: 'building',
    output: { block: BlockType.WOOL_BLUE, count: 1 },
    shapeless: [BlockType.WOOL_WHITE, BlockType.DIAMOND_ORE],
    description: 'Infuse soft wool with luminous cyan gemstone dyes.',
  },
  // 16. Jack-O'-Lantern (Glowstone) from Pumpkin + Torch
  {
    id: 'pumpkin_lamp',
    name: 'Jack-O\'-Lantern',
    category: 'decorations',
    output: { block: BlockType.GLOWSTONE, count: 1 },
    pattern: [
      [BlockType.PUMPKIN],
      [BlockType.TORCH],
    ],
    description: 'Insert a flickering torch into a carved autumn pumpkin.',
  },
  // 17. Name Tag (Paper/Sugar Cane + Gold Ore)
  {
    id: 'name_tag',
    name: 'Name Tag',
    category: 'special',
    output: { block: BlockType.NAME_TAG, count: 1 },
    shapeless: [BlockType.SUGAR_CANE, BlockType.GOLD_ORE],
    description: 'Craft from paper fibers & gold nugget to keep pets from despawning.',
  },
  // 18. Chain (Blast-resistant decorative iron chain)
  {
    id: 'chain',
    name: 'Iron Chain',
    category: 'decorations',
    output: { block: BlockType.CHAIN, count: 3 },
    pattern: [
      [BlockType.IRON_ORE],
      [BlockType.IRON_ORE],
      [BlockType.IRON_ORE],
    ],
    description: 'Forge heavy iron links matching solid iron blast resistance.',
  },
  // 19. Beacon (Glass + Nether Star + Obsidian)
  {
    id: 'beacon',
    name: 'Beacon',
    category: 'special',
    output: { block: BlockType.BEACON, count: 1 },
    pattern: [
      [BlockType.GLASS, BlockType.GLASS, BlockType.GLASS],
      [BlockType.GLASS, BlockType.NETHER_STAR, BlockType.GLASS],
      [BlockType.OBSIDIAN, BlockType.OBSIDIAN, BlockType.OBSIDIAN],
    ],
    description: 'Harness a Wither Nether Star inside obsidian and glass.',
  },
  // 20. Redstone Dust
  {
    id: 'redstone_dust',
    name: 'Redstone Dust',
    category: 'special',
    output: { block: BlockType.REDSTONE_DUST, count: 6 },
    shapeless: [BlockType.COAL_ORE, BlockType.GOLD_ORE],
    description: 'Conductive mineral wire for pistons and logic circuits.',
  },
  // 21. Redstone Torch
  {
    id: 'redstone_torch',
    name: 'Redstone Torch',
    category: 'special',
    output: { block: BlockType.REDSTONE_TORCH, count: 2 },
    pattern: [
      [BlockType.REDSTONE_DUST],
      [BlockType.PLANKS_OAK],
    ],
    description: 'Continuous redstone power emitter.',
  },
  // 22. Piston
  {
    id: 'piston',
    name: 'Piston',
    category: 'special',
    output: { block: BlockType.PISTON, count: 1 },
    pattern: [
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
      [BlockType.COBBLESTONE, BlockType.IRON_ORE, BlockType.COBBLESTONE],
      [BlockType.COBBLESTONE, BlockType.REDSTONE_DUST, BlockType.COBBLESTONE],
    ],
    description: 'Pushes adjacent blocks when powered by Redstone.',
  },
  // 23. Redstone Comparator
  {
    id: 'comparator',
    name: 'Redstone Comparator',
    category: 'special',
    output: { block: BlockType.COMPARATOR, count: 1 },
    pattern: [
      [null, BlockType.REDSTONE_TORCH, null],
      [BlockType.REDSTONE_TORCH, BlockType.REDSTONE_DUST, BlockType.REDSTONE_TORCH],
      [BlockType.STONE, BlockType.STONE, BlockType.STONE],
    ],
    description: 'Compares and relays signal strength across redstone circuits.',
  },
  // 24. Water Bucket
  {
    id: 'water_bucket',
    name: 'Water Bucket',
    category: 'special',
    output: { block: BlockType.WATER_BUCKET, count: 1 },
    pattern: [
      [BlockType.IRON_ORE, BlockType.GLASS, BlockType.IRON_ORE],
      [null, BlockType.IRON_ORE, null],
    ],
    description: 'Place right before landing to nullify fall damage (MLG)!',
  },
  // 25. Flint and Steel
  {
    id: 'flint_and_steel',
    name: 'Flint and Steel',
    category: 'special',
    output: { block: BlockType.FLINT_AND_STEEL, count: 1 },
    shapeless: [BlockType.IRON_ORE, BlockType.COAL_ORE],
    description: 'Ignite Obsidian Nether Portals, Candles, or Creepers on command.',
  },
  // 26. Candle
  {
    id: 'candle',
    name: 'Wax Candle',
    category: 'decorations',
    output: { block: BlockType.CANDLE, count: 2 },
    pattern: [
      [BlockType.TORCH],
      [BlockType.WOOL_WHITE],
    ],
    description: 'Light with Flint & Steel or Fire Aspect.',
  },
  // 27. Enchanting Table
  {
    id: 'enchanting_table',
    name: 'Enchanting Table',
    category: 'special',
    output: { block: BlockType.ENCHANTING_TABLE, count: 1 },
    pattern: [
      [null, BlockType.BOOKSHELF, null],
      [BlockType.DIAMOND_ORE, BlockType.OBSIDIAN, BlockType.DIAMOND_ORE],
      [BlockType.OBSIDIAN, BlockType.OBSIDIAN, BlockType.OBSIDIAN],
    ],
    description: 'Imbue Fortune, Fire Aspect, Efficiency, and Unbreaking.',
  },
  // 28. Brewing Stand
  {
    id: 'brewing_stand',
    name: 'Brewing Stand',
    category: 'special',
    output: { block: BlockType.BREWING_STAND, count: 1 },
    pattern: [
      [null, BlockType.GLOWSTONE, null],
      [BlockType.COBBLESTONE, BlockType.COBBLESTONE, BlockType.COBBLESTONE],
    ],
    description: 'Brew Swiftness, Strength, Regeneration, and Fire Resistance potions.',
  },
  // 29. Beehive
  {
    id: 'beehive',
    name: 'Beehive',
    category: 'decorations',
    output: { block: BlockType.BEEHIVE, count: 1 },
    pattern: [
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
      [BlockType.DANDELION, BlockType.POPPY, BlockType.DANDELION],
      [BlockType.PLANKS_OAK, BlockType.PLANKS_OAK, BlockType.PLANKS_OAK],
    ],
    description: 'Attracts bees to pollinate nearby farm crops.',
  },
  // 30. Bone Meal
  {
    id: 'bone_meal',
    name: 'Bone Meal',
    category: 'special',
    output: { block: BlockType.BONE_MEAL, count: 4 },
    shapeless: [BlockType.LEAVES_OAK, BlockType.SAND],
    description: 'Instant plant fertilizer; spawns wildflowers on grass.',
  },
  // 31. Golden Dandelion
  {
    id: 'golden_dandelion',
    name: 'Golden Dandelion',
    category: 'special',
    output: { block: BlockType.GOLDEN_DANDELION, count: 1 },
    shapeless: [BlockType.DANDELION, BlockType.GOLD_ORE],
    description: 'Feed to a baby passive mob to keep it tiny permanently!',
  },
  // 32. Hay Bale
  {
    id: 'hay_bale',
    name: 'Hay Bale',
    category: 'blocks',
    output: { block: BlockType.HAY_BALE, count: 1 },
    pattern: [
      [BlockType.WHEAT_CROP, BlockType.WHEAT_CROP],
      [BlockType.WHEAT_CROP, BlockType.WHEAT_CROP],
    ],
    description: 'Compact harvested wheat into a rustic farm bale.',
  },
];

// Helper to extract the tight bounding box of non-empty slots in a 3x3 grid
function getSubGrid(grid: (BlockType | null)[]): {
  subgrid: (BlockType | null)[][];
  width: number;
  height: number;
} {
  let minR = 3, maxR = -1, minC = 3, maxC = -1;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const item = grid[r * 3 + c];
      if (item !== null && item !== BlockType.AIR) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) {
    return { subgrid: [], width: 0, height: 0 };
  }

  const height = maxR - minR + 1;
  const width = maxC - minC + 1;
  const subgrid: (BlockType | null)[][] = [];

  for (let r = minR; r <= maxR; r++) {
    const row: (BlockType | null)[] = [];
    for (let c = minC; c <= maxC; c++) {
      const item = grid[r * 3 + c];
      row.push(item !== null && item !== BlockType.AIR ? item : null);
    }
    subgrid.push(row);
  }

  return { subgrid, width, height };
}

// Check recipe matching for a 3x3 crafting grid
export function matchRecipe(grid: (BlockType | null)[]): CraftingRecipe | null {
  const { subgrid, width, height } = getSubGrid(grid);

  // If grid is completely empty
  if (width === 0 || height === 0) return null;

  // Flatten items for shapeless matching
  const nonAirItems = grid.filter((item): item is BlockType => item !== null && item !== BlockType.AIR);

  for (const recipe of CRAFTING_RECIPES) {
    // 1. Shapeless recipe check
    if (recipe.shapeless) {
      if (recipe.shapeless.length === nonAirItems.length) {
        const remaining = [...nonAirItems];
        let matches = true;
        for (const req of recipe.shapeless) {
          const idx = remaining.indexOf(req);
          if (idx === -1) {
            matches = false;
            break;
          }
          remaining.splice(idx, 1);
        }
        if (matches && remaining.length === 0) {
          return recipe;
        }
      }
    }

    // 2. Shaped pattern check
    if (recipe.pattern) {
      const pat = recipe.pattern;
      const patH = pat.length;
      const patW = pat[0].length;

      if (patH === height && patW === width) {
        let patternMatches = true;
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            const expected = pat[r][c] || null;
            const actual = subgrid[r][c] || null;
            if (expected !== actual) {
              patternMatches = false;
              break;
            }
          }
          if (!patternMatches) break;
        }

        if (patternMatches) {
          return recipe;
        }
      }
    }
  }

  return null;
}
