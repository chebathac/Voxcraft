import { BlockType, DimensionId } from './types';

export const WORLD_HALF_SIZE = 16000; // 32,000 x 32,000 blocks (>1B surface blocks)
export const SECTOR_SPACING = 256;

// Spiral grid mapping shard index (0, 1, 2, ...) to distributed 256-block town plazas
export function getSectorCenter(sectorIndex: number): { x: number; z: number } {
  const idx = Math.max(0, Math.floor(sectorIndex));
  if (idx === 0) return { x: 0, z: 0 };

  let x = 0;
  let z = 0;
  let dx = 1;
  let dz = 0;
  let segmentLength = 1;
  let segmentPassed = 0;

  for (let i = 0; i < idx; i++) {
    x += dx;
    z += dz;
    segmentPassed++;
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      const tmp = dx;
      dx = -dz;
      dz = tmp;
      if (dz === 0) {
        segmentLength++;
      }
    }
  }

  const maxGrid = Math.floor((WORLD_HALF_SIZE - 128) / SECTOR_SPACING);
  const clampedX = Math.max(-maxGrid, Math.min(maxGrid, x));
  const clampedZ = Math.max(-maxGrid, Math.min(maxGrid, z));
  return { x: clampedX * SECTOR_SPACING, z: clampedZ * SECTOR_SPACING };
}

// Fast 2D & 3D value noise generator with octave octaves
export class TerrainGenerator {
  public seed: number;
  public dimension: DimensionId = 'overworld';

  constructor(seed = 12345, dimension: DimensionId = 'overworld') {
    this.seed = seed;
    this.dimension = dimension;
  }

  // Pseudo-random hash
  private hash2d(x: number, z: number): number {
    const n = Math.sin(x * 12.9898 + z * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private hash3d(x: number, y: number, z: number): number {
    const n = Math.sin(x * 12.9898 + y * 45.164 + z * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  // Smooth interpolated 2D noise
  public noise2d(x: number, z: number): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;

    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const n00 = this.hash2d(ix, iz);
    const n10 = this.hash2d(ix + 1, iz);
    const n01 = this.hash2d(ix, iz + 1);
    const n11 = this.hash2d(ix + 1, iz + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;

    return nx0 * (1 - sz) + nx1 * sz;
  }

  // Fractal Brownian Motion (octaves) for realistic terrain height
  public fbm2d(x: number, z: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2d(x * frequency, z * frequency) * amplitude;
      max += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value / max;
  }

  private getNearestSectorOffset(x: number, z: number): { dx: number; dz: number; dist: number; isOrigin: boolean } {
    const sx = Math.round(x / SECTOR_SPACING) * SECTOR_SPACING;
    const sz = Math.round(z / SECTOR_SPACING) * SECTOR_SPACING;
    const dx = x - sx;
    const dz = z - sz;
    return { dx, dz, dist: Math.hypot(dx, dz), isOrigin: sx === 0 && sz === 0 };
  }

  // Get surface height at world (x, z)
  public getHeight(x: number, z: number): number {
    if (this.dimension === 'nether') {
      const { dist: distFromSector } = this.getNearestSectorOffset(x, z);
      if (distFromSector < 12) return 12;
      const n = this.fbm2d(x * 0.03, z * 0.03, 3);
      return Math.floor(8 + n * 14);
    }
    if (this.dimension === 'end') {
      const d = Math.hypot(x, z);
      if (d < 26) return 12;
      const islandNoise = this.fbm2d(x * 0.035 + 17, z * 0.035 + 17, 3);
      return islandNoise > 0.52 ? Math.floor(10 + (islandNoise - 0.52) * 16) : 12;
    }

    // Distance from nearest regional 256-block sector plaza (keeps spawn & outpost plazas flat)
    const { dist: distFromSector } = this.getNearestSectorOffset(x, z);

    // Continental macro noise
    const macro = this.fbm2d(x * 0.015, z * 0.015, 3);
    // Mountain ridges
    const mountain = Math.pow(this.fbm2d((x + 100) * 0.03, (z + 100) * 0.03, 4), 2.2);
    // Detail hills
    const hills = this.fbm2d(x * 0.06, z * 0.06, 2) * 4;

    const baseHeight = 11;
    let height = baseHeight + (macro * 6) + (mountain * 18) + hills;

    // Smooth flat clearing near each sector plaza
    if (distFromSector < 12) {
      return 12; // Flat constructed ground level at y = 12
    }
    if (distFromSector < 22) {
      const blend = (distFromSector - 12) / 10;
      height = 12 * (1 - blend) + height * blend;
    }

    return Math.floor(height);
  }

  // Cave carver using 3D noise
  public isCave(x: number, y: number, z: number, surfaceHeight: number): boolean {
    if (this.getNearestSectorOffset(x, z).dist < 18) return false; // Protect plaza ground levels from caves
    if (y <= 2 || y >= surfaceHeight - 2) return false;
    const noise = Math.sin(x * 0.18) * Math.cos(y * 0.22) * Math.sin(z * 0.18) +
      Math.cos(x * 0.08 + y * 0.1) * Math.sin(z * 0.08);
    return noise > 1.25;
  }

  // Biome determination across all 3 dimensions
  public getBiome(
    x: number,
    z: number
  ):
    | 'plains'
    | 'mountains'
    | 'cherry'
    | 'autumn'
    | 'desert'
    | 'forest'
    | 'pale_garden'
    | 'nether_wastes'
    | 'the_end' {
    if (this.dimension === 'nether') return 'nether_wastes';
    if (this.dimension === 'end') return 'the_end';

    const height = this.getHeight(x, z);
    if (height > 20) return 'mountains';

    const tempNoise = this.noise2d(x * 0.015 + 40, z * 0.015 + 40);
    const humidNoise = this.noise2d(x * 0.02 + 120, z * 0.02 + 120);

    if (tempNoise > 0.68 && height <= 16) return 'desert';
    if (tempNoise < 0.32) return 'autumn';
    if (humidNoise > 0.56 && humidNoise < 0.65 && tempNoise >= 0.32 && tempNoise <= 0.68) return 'pale_garden';
    if (humidNoise > 0.65) return 'cherry';
    if (humidNoise < 0.35) return 'forest';
    return 'plains';
  }

  // Generate structure overlays across Overworld, Nether, and The End
  public getBlockAt(x: number, y: number, z: number): BlockType {
    if (this.dimension === 'nether') {
      return this.getNetherBlockAt(x, y, z);
    }
    if (this.dimension === 'end') {
      return this.getEndBlockAt(x, y, z);
    }
    // Bedrock floor
    if (y === 0) return BlockType.BEDROCK;

    // Constructed Ground Level at World Spawn & every 256-block Regional Sector Plaza
    const sector = this.getNearestSectorOffset(x, z);
    if (sector.dist < 10) {
      const lx = sector.dx;
      const lz = sector.dz;
      // Above ground structures: Lanterns, Workstation, Benches
      if (y > 12) {
        // Corner Lantern Posts
        if ((Math.abs(lx) === 5 && Math.abs(lz) === 5) || (Math.abs(lx) === 6 && lz === 0) || (lx === 0 && Math.abs(lz) === 6)) {
          if (y >= 13 && y <= 14) return BlockType.WOOD_OAK;
          if (y === 15) return BlockType.GLOWSTONE; // Glowstone street lamp
        }
        // Workstation at (3, 13, 2)
        if (lx === 3 && lz === 2 && y === 13) return BlockType.CRAFTING_TABLE;
        if (lx === 3 && lz === 3 && y === 13) return BlockType.FURNACE;
        if (lx === 3 && lz === 1 && y === 13) return BlockType.BOOKSHELF;
        if (lx === 3 && lz === -1 && y === 13) return BlockType.ENCHANTING_TABLE;
        if (lx === 3 && lz === -2 && y === 13) return BlockType.BREWING_STAND;
        // Starter garden patch & beehive on plaza edge
        if (lx === -4 && lz === 3 && y === 13) return BlockType.BEEHIVE;
        if (lx === -5 && lz === 3 && y === 13) return BlockType.POPPY;
        if (lx === -5 && lz === 2 && y === 13) return BlockType.DANDELION;
        // Benches
        if (lx === -3 && Math.abs(lz) <= 1 && y === 13) return BlockType.PLANKS_OAK;

        return BlockType.AIR;
      }

      // Ground level at y = 12
      if (y === 12) {
        // Center plaza (0, 0)
        if (Math.abs(lx) <= 2 && Math.abs(lz) <= 2) {
          if (lx === 0 && lz === 0) return BlockType.STONE;
          return BlockType.BRICK;
        }
        // Small hydrated garden water canal
        if (lx === -5 && lz === 4) return BlockType.WATER;
        if (lx === -6 && (lz === 3 || lz === 4)) return BlockType.FARMLAND;
        // Cross cobblestone pathways
        if (Math.abs(lx) <= 1 || Math.abs(lz) <= 1) {
          return BlockType.COBBLESTONE;
        }
        // Surrounding grass lawn
        return BlockType.GRASS;
      }

      // Foundation below spawn ground
      if (y >= 9 && y <= 11) return BlockType.DIRT;
      if (y >= 1 && y <= 8) return BlockType.STONE;
      return BlockType.BEDROCK;
    }

    const surfaceHeight = this.getHeight(x, z);
    const biome = this.getBiome(x, z);
    const waterLevel = 8;

    // Ancient Ruin Landmark at (x = 32, z = -32)
    const ruinBlock = this.getRuinsBlock(x, y, z);
    if (ruinBlock !== BlockType.AIR) return ruinBlock;

    // Underground Caves, Grottoes & Ancient City Sculk Pockets
    if (this.isCave(x, y, z, surfaceHeight)) {
      if (y <= 4) return BlockType.LAVA; // Lava pools in deep caves
      if (y <= waterLevel) return BlockType.WATER;
      // Ceiling glowstone crystals in deep caves
      if (y === 11 && this.hash3d(x, y, z) > 0.96) return BlockType.GLOWSTONE;
      return BlockType.AIR;
    }

    // Ancient City Sculk layer deep underground
    if (y >= 1 && y <= 4 && surfaceHeight >= 11 && this.noise2d(x * 0.08 + 70, z * 0.08 + 70) > 0.72) {
      if (y === 4 && this.hash3d(x, y, z) > 0.92) return BlockType.OBSIDIAN;
      if (y <= 3) return BlockType.SCULK;
    }

    // Water level
    if (y > surfaceHeight && y <= waterLevel) {
      return BlockType.WATER;
    }

    // Above surface: air, cacti, trees, flora, crops, pumpkins, or landmarks
    if (y > surfaceHeight) {
      // Check Treehouse landmark (near x = 14, z = 14)
      const treehouseBlock = this.getTreehouseBlock(x, y, z);
      if (treehouseBlock !== BlockType.AIR) return treehouseBlock;

      // Check Autumn Camp landmark (near x = -14, z = 14)
      const campBlock = this.getCampsiteBlock(x, y, z);
      if (campBlock !== BlockType.AIR) return campBlock;

      // Desert Cacti
      if (biome === 'desert' && surfaceHeight > waterLevel) {
        const cactusChance = this.hash2d(x, z);
        if (cactusChance > 0.975) {
          const cactusHeight = 2 + Math.floor((cactusChance - 0.975) * 80);
          if (y <= surfaceHeight + cactusHeight) {
            return BlockType.CACTUS;
          }
        }
      }

      // Sugar Cane & Bamboo along shorelines
      if (surfaceHeight >= waterLevel && surfaceHeight <= waterLevel + 2) {
        const reedChance = this.hash2d(x + 31, z - 19);
        if (reedChance > 0.965 && y <= surfaceHeight + 3) {
          return biome === 'cherry' || biome === 'forest' ? BlockType.BAMBOO : BlockType.SUGAR_CANE;
        }
      }

      // Wildflowers, Poppies, Dandelions & Melons on grass biomes
      if (surfaceHeight > waterLevel && y === surfaceHeight + 1 && biome !== 'desert' && biome !== 'mountains') {
        const floraRand = this.hash2d(x * 1.7, z * 1.7);
        if (floraRand > 0.988) return BlockType.POPPY;
        if (floraRand > 0.976) return BlockType.DANDELION;
        if (floraRand > 0.967) return BlockType.WILDFLOWER;
        if (biome === 'forest' && floraRand > 0.963) return BlockType.MELON_BLOCK;
      }

      // Autumn Pumpkin Patches
      if (biome === 'autumn' && y === surfaceHeight + 1) {
        const pumpkinChance = this.hash2d(x, z);
        if (pumpkinChance > 0.97) return BlockType.PUMPKIN;
      }

      // Natural trees
      const treeBlock = this.getTreeBlock(x, y, z);
      if (treeBlock !== BlockType.AIR) return treeBlock;

      return BlockType.AIR;
    }

    // Surface block
    if (y === surfaceHeight) {
      if (surfaceHeight <= waterLevel + 1) {
        return BlockType.SAND;
      }
      if (biome === 'desert') {
        return BlockType.SAND;
      }
      if (surfaceHeight >= 22) {
        return BlockType.SNOW;
      }
      if (biome === 'mountains' && surfaceHeight >= 18) {
        return BlockType.STONE;
      }
      return BlockType.GRASS;
    }

    // Sub-surface (keep shallow layers free of exposed ores)
    if (y >= surfaceHeight - 4) {
      if (surfaceHeight <= waterLevel + 1 || biome === 'desert') return BlockType.SAND;
      if (biome === 'mountains' && surfaceHeight >= 18) return BlockType.STONE;
      return BlockType.DIRT;
    }

    // Deep underground ores only (never openly seen on surface or shallow cliffs)
    if (y <= surfaceHeight - 5) {
      const oreRand = this.hash3d(x, y, z);
      if (oreRand > 0.94) {
        const exposed = this.isExposedToAir(x, y, z);
        if (y <= 5 && !exposed && oreRand > 0.986) return BlockType.DIAMOND_ORE;
        if (y <= 8 && !exposed && oreRand > 0.974) return BlockType.GOLD_ORE;
        if (y <= 11 && oreRand > 0.958 && (!exposed || (y <= 7 && oreRand > 0.988))) {
          return BlockType.IRON_ORE;
        }
        if (y <= 14 && oreRand > 0.94 && (!exposed || (y <= 8 && oreRand > 0.985))) {
          return BlockType.COAL_ORE;
        }
      }
    }

    return BlockType.STONE;
  }

  // Returns true if any 6-neighbor is above terrain surface or carved cave air
  private isExposedToAir(x: number, y: number, z: number): boolean {
    const dirs = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    for (let i = 0; i < 6; i++) {
      const nx = x + dirs[i][0];
      const ny = y + dirs[i][1];
      const nz = z + dirs[i][2];
      const nh = this.getHeight(nx, nz);
      if (ny > nh) return true;
      if (this.isCave(nx, ny, nz, nh)) return true;
    }
    return false;
  }

  // Generates natural procedural trees
  private getTreeBlock(x: number, y: number, z: number): BlockType {
    // Trees spawn on grid centers
    const gridX = Math.floor(x / 6) * 6 + 3;
    const gridZ = Math.floor(z / 6) * 6 + 3;

    // Fast spatial early-out before computing noise/height/biome
    const dx = Math.abs(x - gridX);
    const dz = Math.abs(z - gridZ);
    if (dx > 2 || dz > 2) return BlockType.AIR;

    // Avoid sector plaza clear zones & origin landmark zones
    if (this.getNearestSectorOffset(gridX, gridZ).dist < 10) return BlockType.AIR;
    if (Math.hypot(gridX - 14, gridZ - 14) < 12) return BlockType.AIR;
    if (Math.hypot(gridX + 14, gridZ - 14) < 10) return BlockType.AIR;

    const treeChance = this.hash2d(gridX, gridZ);
    if (treeChance < 0.6) return BlockType.AIR; // only some grids have trees

    const groundY = this.getHeight(gridX, gridZ);
    if (groundY <= 8 || groundY >= 23) return BlockType.AIR; // no trees under water or on snow peaks

    const trunkHeight = 5 + Math.floor(treeChance * 3);
    const leafBase = groundY + trunkHeight - 2;
    const leafTop = groundY + trunkHeight + 2;
    if (y <= groundY || y > leafTop) return BlockType.AIR;

    const biome = this.getBiome(gridX, gridZ);
    const logType =
      biome === 'cherry'
        ? BlockType.WOOD_CHERRY
        : biome === 'pale_garden'
        ? BlockType.PALE_OAK_LOG
        : BlockType.WOOD_OAK;
    const leafType =
      biome === 'cherry'
        ? BlockType.LEAVES_CHERRY
        : biome === 'pale_garden'
        ? BlockType.PALE_OAK_LEAVES
        : BlockType.LEAVES_OAK;

    // Trunk
    if (dx === 0 && dz === 0 && y <= groundY + trunkHeight) {
      return logType;
    }

    // Foliage canopy
    if (y >= leafBase && y <= leafTop) {
      const radius = y >= leafTop - 1 ? 1 : 2;
      if (dx <= radius && dz <= radius && !(dx === radius && dz === radius && (y === leafTop || this.hash3d(x, y, z) > 0.5))) {
        if (!(dx === 0 && dz === 0 && y <= groundY + trunkHeight)) {
          return leafType;
        }
      }
    }

    // Occasional pumpkins on autumn ground
    if (biome === 'autumn' && treeChance > 0.9 && x === gridX + 1 && z === gridZ + 1 && y === groundY + 1) {
      return BlockType.PUMPKIN;
    }

    return BlockType.AIR;
  }

  // Landmark 1: The Grand Treehouse (from user attachment 1)
  private getTreehouseBlock(x: number, y: number, z: number): BlockType {
    const cx = 14;
    const cz = 14;
    const groundY = this.getHeight(cx, cz);

    const trunkRadius = 1;
    const treehouseY = groundY + 11;
    const canopyY = treehouseY + 8;

    const dx = x - cx;
    const dz = z - cz;
    const dist = Math.hypot(dx, dz);

    // Massive central trunk
    if (dist <= trunkRadius && y > groundY && y <= canopyY) {
      return BlockType.WOOD_OAK;
    }

    // Winding wooden spiral staircase wrapping the trunk
    if (y > groundY && y < treehouseY) {
      const stepIndex = y - groundY;
      const angle = (stepIndex * 0.7) % (Math.PI * 2);
      const stairX = Math.round(cx + Math.cos(angle) * 2.2);
      const stairZ = Math.round(cz + Math.sin(angle) * 2.2);
      if (x === stairX && z === stairZ) {
        return BlockType.PLANKS_OAK;
      }
    }

    // Treehouse living deck (wooden platform)
    if (y === treehouseY) {
      if (dist <= 4.5) return BlockType.PLANKS_OAK;
    }

    // Treehouse deck railings
    if (y === treehouseY + 1) {
      if (dist >= 4.0 && dist <= 4.8) return BlockType.WOOD_OAK;
    }

    // Treehouse Cabin walls & interior (from y = treehouseY + 1 to y = treehouseY + 4)
    if (y > treehouseY && y <= treehouseY + 4) {
      const hx = Math.abs(dx - 1);
      const hz = Math.abs(dz - 1);
      if (hx <= 3 && hz <= 3) {
        // Walls
        if (hx === 3 || hz === 3) {
          // Windows
          if ((hx === 3 && hz === 1) || (hz === 3 && hx === 1)) {
            if (y === treehouseY + 2 || y === treehouseY + 3) return BlockType.GLASS;
          }
          // Doorway
          if (dx === -2 && dz === 1 && (y === treehouseY + 1 || y === treehouseY + 2)) {
            return BlockType.AIR;
          }
          return BlockType.PLANKS_OAK;
        }
        // Interior furnishings
        if (hx === 1 && hz === 2 && y === treehouseY + 1) return BlockType.BOOKSHELF;
        if (hx === 2 && hz === 1 && y === treehouseY + 1) return BlockType.CRAFTING_TABLE;
        if (hx === 0 && hz === 0 && y === treehouseY + 3) return BlockType.GLOWSTONE; // ceiling lamp
      }
    }

    // Cabin Roof (A-frame / Cobblestone roof like attachment 1)
    if (y === treehouseY + 5) {
      const hx = Math.abs(dx - 1);
      const hz = Math.abs(dz - 1);
      if (hx <= 3.5 && hz <= 3.5) return BlockType.COBBLESTONE;
    }
    if (y === treehouseY + 6) {
      const hx = Math.abs(dx - 1);
      const hz = Math.abs(dz - 1);
      if (hx <= 2.5 && hz <= 2.5) return BlockType.COBBLESTONE;
    }

    // Giant tree umbrella canopy on top (huge lush leaves dome)
    if (y >= canopyY && y <= canopyY + 4) {
      const dy = y - canopyY;
      const canopyRadius = 7 - dy * 1.2;
      if (dist <= canopyRadius) {
        if (y === canopyY && dist >= 4 && (dx + dz) % 3 === 0) {
          return BlockType.GLOWSTONE; // hanging lantern glow
        }
        return BlockType.LEAVES_OAK;
      }
    }

    return BlockType.AIR;
  }

  // Landmark 2: Cozy Autumn Campsite (from user attachment 3)
  private getCampsiteBlock(x: number, y: number, z: number): BlockType {
    const cx = -14;
    const cz = 14;
    const groundY = this.getHeight(cx, cz);

    const dx = x - cx;
    const dz = z - cz;

    // Pitched A-Frame White Tent (x in [-3..3], z in [-2..2])
    if (dz >= -2 && dz <= 2) {
      // Tent ridge and slopes
      const ax = Math.abs(dx);
      if (ax === 2 && y === groundY + 1) return BlockType.WOOL_WHITE;
      if (ax === 1 && y === groundY + 2) return BlockType.WOOL_WHITE;
      if (ax === 0 && y === groundY + 3) return BlockType.WOOL_WHITE;
      // Sleeping mat inside
      if (ax === 0 && dz === 0 && y === groundY + 1) return BlockType.WOOL_RED;
    }

    // Log bench seating
    if (dz === 4 && Math.abs(dx) <= 2 && y === groundY + 1) {
      return BlockType.WOOD_OAK;
    }

    // Campfire in center
    if (dx === 0 && dz === 3 && y === groundY + 1) {
      return BlockType.GLOWSTONE; // Warm glowing fire pit
    }

    // Chest / Crafting table at tent entrance
    if (dx === -2 && dz === 3 && y === groundY + 1) {
      return BlockType.CRAFTING_TABLE;
    }

    // Pumpkins around camp
    if (((dx === 3 && dz === 3) || (dx === -3 && dz === 1) || (dx === 2 && dz === 5)) && y === groundY + 1) {
      return BlockType.PUMPKIN;
    }

    return BlockType.AIR;
  }

  // Landmark 3: Ancient Desert/Mountain Ruins Shrine at (x = 34, z = -34)
  private getRuinsBlock(x: number, y: number, z: number): BlockType {
    const rx = 34;
    const rz = -34;
    const dx = x - rx;
    const dz = z - rz;
    const groundY = this.getHeight(rx, rz);

    if (Math.abs(dx) > 4 || Math.abs(dz) > 4) return BlockType.AIR;

    // Platform foundation
    if (y === groundY) {
      return (Math.abs(dx) + Math.abs(dz)) % 2 === 0 ? BlockType.BRICK : BlockType.COBBLESTONE;
    }

    // 4 Corner Pillars (height = 4)
    if (Math.abs(dx) === 3 && Math.abs(dz) === 3) {
      if (y >= groundY + 1 && y <= groundY + 4) return BlockType.BRICK;
      if (y === groundY + 5) return BlockType.GLOWSTONE; // Torch/lantern top
    }

    // Central Shrine Pedestal (stone/brick on surface; rare resources buried in depth)
    if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) {
      if (y === groundY + 1) {
        if (dx === 0 && dz === 0) return BlockType.BRICK;
        return BlockType.COBBLESTONE;
      }
      if (dx === 0 && dz === 0 && y === groundY + 2) {
        return BlockType.BOOKSHELF;
      }
      if (dx === 0 && dz === 0 && y === 4) {
        return BlockType.DIAMOND_ORE;
      }
      if ((Math.abs(dx) + Math.abs(dz) === 1) && y === 4) {
        return BlockType.GOLD_ORE;
      }
    }

    return BlockType.AIR;
  }

  // The Nether: Crimson netherrack caverns, lava oceans, Soul Sand, Glowstone & Nether Fortresses
  private getNetherBlockAt(x: number, y: number, z: number): BlockType {
    if (y === 0 || y >= 46) return BlockType.BEDROCK;

    // Safe Nether Hub Fortress Platform near spawn & sector plazas
    const sector = this.getNearestSectorOffset(x, z);
    if (sector.dist < 10) {
      const lx = sector.dx;
      const lz = sector.dz;
      if (y === 12) {
        if (Math.abs(lx) <= 2 && Math.abs(lz) <= 2) return BlockType.OBSIDIAN;
        return BlockType.NETHER_BRICK;
      }
      if (y < 12) return y >= 10 ? BlockType.NETHER_BRICK : BlockType.NETHERRACK;
      // Glowing Nether Brick Pillars & Return Portal
      if (Math.abs(lx) === 5 && Math.abs(lz) === 5 && y >= 13 && y <= 16) {
        return y === 16 ? BlockType.GLOWSTONE : BlockType.NETHER_BRICK;
      }
      if (lx === 4 && Math.abs(lz) <= 2 && y >= 13 && y <= 17) {
        if (Math.abs(lz) === 2 || y === 13 || y === 17) return BlockType.OBSIDIAN;
        return BlockType.NETHER_PORTAL;
      }
      return BlockType.AIR;
    }

    // Ceiling Glowstone & Netherrack Roof
    if (y >= 41) {
      if (y === 41 && this.hash3d(x, y, z) > 0.94) return BlockType.GLOWSTONE;
      return BlockType.NETHERRACK;
    }

    const h = this.getHeight(x, z);
    const lavaLevel = 7;

    // Nether Fortress Ruins around (26, -26)
    const fdx = x - 26;
    const fdz = z + 26;
    if (Math.abs(fdx) <= 6 && Math.abs(fdz) <= 6) {
      if (y === 13) return BlockType.NETHER_BRICK;
      if (Math.abs(fdx) === 6 && Math.abs(fdz) === 6 && y >= 14 && y <= 19) return BlockType.NETHER_BRICK;
      if ((Math.abs(fdx) === 6 || Math.abs(fdz) === 6) && y === 14 && (fdx + fdz) % 2 === 0) return BlockType.NETHER_BRICK;
    }

    if (y > h && y <= lavaLevel) return BlockType.LAVA;
    if (y > h) return BlockType.AIR;

    if (y === h && h <= lavaLevel + 2 && this.noise2d(x * 0.09, z * 0.09) > 0.55) {
      return BlockType.SOUL_SAND;
    }
    if (y <= h - 2 && this.hash3d(x, y, z) > 0.965) return BlockType.GOLD_ORE;
    if (y <= h - 4 && this.hash3d(x + 9, y, z - 9) > 0.985) return BlockType.DIAMOND_ORE;
    return BlockType.NETHERRACK;
  }

  // The End: Void islands, Obsidian Dragon Pillars & Central End Portal Altar
  private getEndBlockAt(x: number, y: number, z: number): BlockType {
    const distOrigin = Math.hypot(x, z);

    // Central Obsidian Pillars (ring at r ~ 18) topped with Glowstone Crystal
    const pillars: [number, number][] = [
      [16, 16],
      [-16, 16],
      [16, -16],
      [-16, -16],
      [22, 0],
      [-22, 0],
    ];
    for (const [px, pz] of pillars) {
      if (Math.abs(x - px) <= 1 && Math.abs(z - pz) <= 1) {
        if (y >= 8 && y <= 24) return BlockType.OBSIDIAN;
        if (y === 25 && x === px && z === pz) return BlockType.GLOWSTONE;
      }
    }

    // Central End Return Fountain & Bedrock Pedestal
    if (distOrigin < 5) {
      if (y === 12) return distOrigin < 2.2 ? BlockType.END_PORTAL_FRAME : BlockType.END_STONE;
      if (y >= 8 && y <= 11) return BlockType.END_STONE;
      if (x === 0 && z === 0 && y >= 13 && y <= 15) return BlockType.BEDROCK;
      if (x === 0 && z === 0 && y === 16) return BlockType.TORCH;
      return BlockType.AIR;
    }

    // Main Central Island
    if (distOrigin < 29) {
      const edgeDrop = distOrigin > 23 ? Math.floor((distOrigin - 23) * 0.8) : 0;
      const topY = 12;
      const bottomY = Math.max(5, 6 + edgeDrop);
      if (y >= bottomY && y <= topY) return BlockType.END_STONE;
      return BlockType.AIR;
    }

    // Outer Floating End Cities & Islands
    const islandNoise = this.fbm2d(x * 0.035 + 17, z * 0.035 + 17, 3);
    if (islandNoise > 0.54) {
      const topY = Math.floor(10 + (islandNoise - 0.54) * 16);
      const bottomY = Math.max(5, topY - Math.floor(3 + (islandNoise - 0.54) * 18));
      if (y >= bottomY && y <= topY) return BlockType.END_STONE;
    }
    return BlockType.AIR;
  }
}
