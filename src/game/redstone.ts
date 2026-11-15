import { VoxelWorld } from './world';
import { BlockType } from './types';

const DIRS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const IMMOVABLE_BLOCKS = new Set<BlockType>([
  BlockType.BEDROCK,
  BlockType.OBSIDIAN,
  BlockType.CHAIN,
  BlockType.END_PORTAL_FRAME,
  BlockType.NETHER_PORTAL,
]);

function isRedstoneDust(b: BlockType): boolean {
  return b === BlockType.REDSTONE_DUST || b === BlockType.REDSTONE_DUST_ON;
}

function isPowerSource(b: BlockType): boolean {
  return b === BlockType.REDSTONE_TORCH;
}

/**
 * Propagates Redstone signal from nearby Redstone Torches & Comparators across dust wires
 * and triggers adjacent Pistons to push movable blocks forward cleanly.
 */
export function updateRedstoneAround(world: VoxelWorld, cx: number, cy: number, cz: number, radius = 8): number {
  const poweredDust = new Set<string>();
  const dustNodes: [number, number, number][] = [];
  const pistons: [number, number, number][] = [];
  const queue: [number, number, number, number][] = [];

  for (let y = Math.max(1, cy - 3); y <= Math.min(46, cy + 3); y++) {
    for (let z = cz - radius; z <= cz + radius; z++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const b = world.getBlock(x, y, z);
        if (isPowerSource(b)) {
          for (const [dx, dy, dz] of DIRS) {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;
            const nb = world.getBlock(nx, ny, nz);
            if (isRedstoneDust(nb) || nb === BlockType.COMPARATOR) {
              const key = `${nx},${ny},${nz}`;
              if (!poweredDust.has(key)) {
                poweredDust.add(key);
                queue.push([nx, ny, nz, 12]);
              }
            }
          }
        } else if (isRedstoneDust(b)) {
          dustNodes.push([x, y, z]);
        } else if (b === BlockType.PISTON) {
          pistons.push([x, y, z]);
        }
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const [x, y, z, power] = queue[head++];
    if (power <= 1) continue;
    const here = world.getBlock(x, y, z);
    const nextPower = here === BlockType.COMPARATOR ? 12 : power - 1;

    for (const [dx, dy, dz] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      const nb = world.getBlock(nx, ny, nz);
      if (isRedstoneDust(nb) || nb === BlockType.COMPARATOR) {
        const key = `${nx},${ny},${nz}`;
        if (!poweredDust.has(key)) {
          poweredDust.add(key);
          queue.push([nx, ny, nz, nextPower]);
        }
      }
    }
  }

  let changed = 0;
  for (const [x, y, z] of dustNodes) {
    const key = `${x},${y},${z}`;
    const shouldBeOn = poweredDust.has(key);
    const cur = world.getBlock(x, y, z);
    const desired = shouldBeOn ? BlockType.REDSTONE_DUST_ON : BlockType.REDSTONE_DUST;
    if (cur !== desired) {
      world.setBlock(x, y, z, desired, false);
      changed++;
    }
  }

  // Trigger powered Pistons: push an adjacent non-redstone block outward by 1 voxel
  for (const [px, py, pz] of pistons) {
    let isPowered = false;
    for (const [dx, dy, dz] of DIRS) {
      const nb = world.getBlock(px + dx, py + dy, pz + dz);
      if (nb === BlockType.REDSTONE_TORCH || nb === BlockType.REDSTONE_DUST_ON || nb === BlockType.COMPARATOR) {
        isPowered = true;
        break;
      }
    }
    if (!isPowered) continue;

    // Look for an adjacent movable solid block opposite or perpendicular to power to push
    for (const [dx, dy, dz] of DIRS) {
      if (dy < 0) continue;
      const tx = px + dx;
      const ty = py + dy;
      const tz = pz + dz;
      const target = world.getBlock(tx, ty, tz);
      if (
        target !== BlockType.AIR &&
        target !== BlockType.WATER &&
        !isRedstoneDust(target) &&
        target !== BlockType.REDSTONE_TORCH &&
        target !== BlockType.PISTON &&
        target !== BlockType.COMPARATOR &&
        !IMMOVABLE_BLOCKS.has(target)
      ) {
        const destX = tx + dx;
        const destY = ty + dy;
        const destZ = tz + dz;
        if (destY > 1 && destY < 47 && world.getBlock(destX, destY, destZ) === BlockType.AIR) {
          world.setBlock(destX, destY, destZ, target, false);
          world.setBlock(tx, ty, tz, BlockType.AIR, false);
          changed += 2;
          break;
        }
      }
    }
  }

  return changed;
}
