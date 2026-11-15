import { VoxelWorld } from './world';
import { BlockType } from './types';

/**
 * Checks whether farmland at (x, y, z) is hydrated by water within 4 blocks horizontally.
 */
export function isFarmlandHydrated(world: VoxelWorld, x: number, y: number, z: number): boolean {
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = 0; dy <= 1; dy++) {
        if (world.getBlock(x + dx, y + dy, z + dz) === BlockType.WATER) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Checks whether a crop has light (daylight or nearby torch/glowstone/lit candle) to keep growing at night.
 */
export function hasCropLight(world: VoxelWorld, x: number, y: number, z: number, timeOfDay: number): boolean {
  const isDay = timeOfDay >= 0.22 && timeOfDay <= 0.78;
  if (isDay) return true;
  for (let dz = -4; dz <= 4; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -1; dy <= 2; dy++) {
        const b = world.getBlock(x + dx, y + dy, z + dz);
        if (b === BlockType.TORCH || b === BlockType.GLOWSTONE || b === BlockType.CANDLE_LIT || b === BlockType.BEACON) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Bone Meal instant fertilization:
 * - On GRASS: spawns Poppy, Dandelion, or Wildflower nearby
 * - On Sugar Cane / Bamboo: grows +1 vertical stalk
 * - On Farmland: sprouts Wheat / Carrots / Potatoes / Beetroots
 */
export function applyBoneMeal(world: VoxelWorld, bx: number, by: number, bz: number): number {
  const target = world.getBlock(bx, by, bz);
  let grown = 0;

  if (target === BlockType.SUGAR_CANE || target === BlockType.BAMBOO) {
    let topY = by;
    while (topY < 45 && world.getBlock(bx, topY + 1, bz) === target) {
      topY++;
    }
    if (topY < 45 && world.getBlock(bx, topY + 1, bz) === BlockType.AIR) {
      world.setBlock(bx, topY + 1, bz, target);
      return 1;
    }
    return 0;
  }

  if (target === BlockType.FARMLAND && world.getBlock(bx, by + 1, bz) === BlockType.AIR) {
    const crops = [BlockType.WHEAT_CROP, BlockType.CARROT_CROP, BlockType.POTATO_CROP, BlockType.BEETROOT_CROP];
    world.setBlock(bx, by + 1, bz, crops[Math.floor(Math.random() * crops.length)]);
    return 1;
  }

  if (target === BlockType.WHEAT_CROP || target === BlockType.CARROT_CROP || target === BlockType.POTATO_CROP || target === BlockType.BEETROOT_CROP) {
    // Spread ripe crop to neighboring empty farmland or sprout melon nearby
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = bx + dx;
        const nz = bz + dz;
        if (world.getBlock(nx, by - 1, nz) === BlockType.FARMLAND && world.getBlock(nx, by, nz) === BlockType.AIR) {
          world.setBlock(nx, by, nz, target);
          grown++;
        } else if ((dx === 1 || dz === 1) && world.getBlock(nx, by - 1, nz) === BlockType.DIRT && world.getBlock(nx, by, nz) === BlockType.AIR && Math.random() < 0.35) {
          world.setBlock(nx, by, nz, BlockType.MELON_BLOCK);
          grown++;
        }
      }
    }
    return grown;
  }

  if (target === BlockType.GRASS) {
    const flowers = [BlockType.WILDFLOWER, BlockType.WILDFLOWER, BlockType.POPPY, BlockType.DANDELION];
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = bx + dx;
        const nz = bz + dz;
        if (world.getBlock(nx, by, nz) === BlockType.GRASS && world.getBlock(nx, by + 1, nz) === BlockType.AIR && Math.random() < 0.45) {
          world.setBlock(nx, by + 1, nz, flowers[Math.floor(Math.random() * flowers.length)]);
          grown++;
        }
      }
    }
    return grown;
  }

  return 0;
}

/**
 * Periodic farm/nature growth tick around player:
 * Hydrated & lit crops sprout melons/extra stalks, and nearby Bees speed up crop growth!
 */
export function tickNatureGrowth(
  world: VoxelWorld,
  px: number,
  py: number,
  pz: number,
  timeOfDay: number,
  hasBeesNearby: boolean
): void {
  const cx = Math.floor(px);
  const cy = Math.floor(py);
  const cz = Math.floor(pz);
  const attempts = hasBeesNearby ? 6 : 3;

  for (let i = 0; i < attempts; i++) {
    const rx = cx + Math.floor((Math.random() - 0.5) * 20);
    const rz = cz + Math.floor((Math.random() - 0.5) * 20);
    const ry = Math.max(2, Math.min(44, cy + Math.floor((Math.random() - 0.5) * 6)));
    const b = world.getBlock(rx, ry, rz);

    if (b === BlockType.SUGAR_CANE || b === BlockType.BAMBOO) {
      if (world.getBlock(rx, ry + 1, rz) === BlockType.AIR && world.getBlock(rx, ry - 2, rz) !== b) {
        world.setBlock(rx, ry + 1, rz, b);
      }
    } else if (
      (b === BlockType.WHEAT_CROP || b === BlockType.CARROT_CROP || b === BlockType.POTATO_CROP || b === BlockType.BEETROOT_CROP) &&
      isFarmlandHydrated(world, rx, ry - 1, rz) &&
      hasCropLight(world, rx, ry, rz, timeOfDay)
    ) {
      // Check adjacent empty farmland or dirt to sprout Melon or spread crop
      const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const [dx, dz] = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = rx + dx;
      const nz = rz + dz;
      const below = world.getBlock(nx, ry - 1, nz);
      if (world.getBlock(nx, ry, nz) === BlockType.AIR) {
        if (below === BlockType.DIRT && Math.random() < 0.35) {
          world.setBlock(nx, ry, nz, BlockType.MELON_BLOCK);
        } else if (below === BlockType.FARMLAND) {
          world.setBlock(nx, ry, nz, b);
        }
      }
    }
  }
}
