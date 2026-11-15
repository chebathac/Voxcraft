import * as THREE from 'three';

const BLOCK_OFFSET = 1048576; // 2^20: supports [-1,048,576 .. +1,048,575]
const BLOCK_STRIDE_Z = 2097152; // 2^21
const BLOCK_STRIDE_Y = 4398046511104; // 2^42 (fits safely in 53-bit IEEE-754 integer up to Y=255)

const CHUNK_OFFSET = 131072; // 2^17
const CHUNK_STRIDE = 262144; // 2^18

const CELL_OFFSET_XZ = 131072; // 2^17
const CELL_STRIDE_XZ = 262144; // 2^18
const CELL_OFFSET_Y = 2048; // 2^11
const CELL_STRIDE_Y_MULT = 68719476736; // 2^36

/**
 * Lossless 50-bit integer spatial hash for integer voxel coordinates (wx, wy, wz).
 * Avoids string allocations (`"${wx},${wy},${wz}"`) on hot movement/mining paths.
 */
export function hashBlockCoords3D(wx: number, wy: number, wz: number): number {
  const ix = Math.floor(wx);
  const iy = Math.floor(wy);
  const iz = Math.floor(wz);
  if (
    iy >= 0 &&
    iy <= 255 &&
    ix >= -BLOCK_OFFSET &&
    ix < BLOCK_OFFSET &&
    iz >= -BLOCK_OFFSET &&
    iz < BLOCK_OFFSET
  ) {
    return iy * BLOCK_STRIDE_Y + (iz + BLOCK_OFFSET) * BLOCK_STRIDE_Z + (ix + BLOCK_OFFSET);
  }
  // Safe fallback prime mix for out-of-bounds coordinates
  return ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) >>> 0;
}

/**
 * Lossless integer hash for 2D chunk coordinates (cx, cz).
 */
export function hashChunkCoords2D(cx: number, cz: number): number {
  const icx = Math.floor(cx);
  const icz = Math.floor(cz);
  if (
    icx >= -CHUNK_OFFSET &&
    icx < CHUNK_OFFSET &&
    icz >= -CHUNK_OFFSET &&
    icz < CHUNK_OFFSET
  ) {
    return (icz + CHUNK_OFFSET) * CHUNK_STRIDE + (icx + CHUNK_OFFSET);
  }
  return ((icx * 73856093) ^ (icz * 83492791)) >>> 0;
}

/**
 * Lossless numeric hash for 3D spatial grid cell coordinates (cx, cy, cz).
 */
export function hashCell3D(cx: number, cy: number, cz: number): number {
  if (
    cx >= -CELL_OFFSET_XZ &&
    cx < CELL_OFFSET_XZ &&
    cz >= -CELL_OFFSET_XZ &&
    cz < CELL_OFFSET_XZ &&
    cy >= -CELL_OFFSET_Y &&
    cy < CELL_OFFSET_Y
  ) {
    return (cy + CELL_OFFSET_Y) * CELL_STRIDE_Y_MULT + (cz + CELL_OFFSET_XZ) * CELL_STRIDE_XZ + (cx + CELL_OFFSET_XZ);
  }
  return ((cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791)) >>> 0;
}

export interface SpatialEntry<T extends { id: string }> {
  item: T;
  cellKey: number;
  cx: number;
  cy: number;
  cz: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Dynamic 3D Spatial Hash Grid for O(1) entity cell updates and O(k) neighborhood queries.
 * Dramatically cuts CPU load during movement, AI steering, projectile checks, and raycasts
 * in high-population areas.
 */
export class SpatialHash3D<T extends { id: string }> {
  public readonly cellSize: number;
  private readonly invCellSize: number;
  private buckets: Map<number, T[]> = new Map();
  private entries: Map<string, SpatialEntry<T>> = new Map();
  private visitedIds: Set<string> = new Set();

  constructor(cellSize = 8) {
    this.cellSize = Math.max(1, cellSize);
    this.invCellSize = 1 / this.cellSize;
  }

  public get size(): number {
    return this.entries.size;
  }

  public get bucketCount(): number {
    return this.buckets.size;
  }

  public upsert(item: T, x: number, y: number, z: number): void {
    const cx = Math.floor(x * this.invCellSize);
    const cy = Math.floor(y * this.invCellSize);
    const cz = Math.floor(z * this.invCellSize);
    const cellKey = hashCell3D(cx, cy, cz);

    const existing = this.entries.get(item.id);
    if (existing) {
      existing.item = item;
      existing.x = x;
      existing.y = y;
      existing.z = z;
      if (existing.cellKey === cellKey) {
        return; // Same 3D cell: zero bucket mutation!
      }
      this.removeFromBucket(existing.cellKey, item.id);
      existing.cellKey = cellKey;
      existing.cx = cx;
      existing.cy = cy;
      existing.cz = cz;
      this.addToBucket(cellKey, item);
      return;
    }

    this.entries.set(item.id, { item, cellKey, cx, cy, cz, x, y, z });
    this.addToBucket(cellKey, item);
  }

  public remove(id: string): boolean {
    const existing = this.entries.get(id);
    if (!existing) return false;
    this.removeFromBucket(existing.cellKey, id);
    this.entries.delete(id);
    return true;
  }

  public clear(): void {
    this.buckets.clear();
    this.entries.clear();
    this.visitedIds.clear();
  }

  private addToBucket(cellKey: number, item: T): void {
    let bucket = this.buckets.get(cellKey);
    if (!bucket) {
      bucket = [item];
      this.buckets.set(cellKey, bucket);
    } else {
      bucket.push(item);
    }
  }

  private removeFromBucket(cellKey: number, id: string): void {
    const bucket = this.buckets.get(cellKey);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i].id === id) {
        const last = bucket.length - 1;
        if (i !== last) {
          bucket[i] = bucket[last];
        }
        bucket.pop();
        if (bucket.length === 0) {
          this.buckets.delete(cellKey);
        }
        return;
      }
    }
  }

  /**
   * Queries all entities whose hashed anchor falls within `radius` (3D Euclidean).
   * Caller can pass a reusable `out` array to eliminate per-frame GC allocations.
   */
  public queryRadius(
    x: number,
    y: number,
    z: number,
    radius: number,
    out: T[] = [],
    filter?: (item: T) => boolean
  ): T[] {
    out.length = 0;
    if (this.entries.size === 0 || radius < 0) return out;

    const minCx = Math.floor((x - radius) * this.invCellSize);
    const maxCx = Math.floor((x + radius) * this.invCellSize);
    const minCy = Math.floor((y - radius) * this.invCellSize);
    const maxCy = Math.floor((y + radius) * this.invCellSize);
    const minCz = Math.floor((z - radius) * this.invCellSize);
    const maxCz = Math.floor((z + radius) * this.invCellSize);
    const radiusSq = radius * radius;

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const bucket = this.buckets.get(hashCell3D(cx, cy, cz));
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i++) {
            const item = bucket[i];
            if (filter && !filter(item)) continue;
            const entry = this.entries.get(item.id);
            if (!entry) continue;
            const dx = entry.x - x;
            const dy = entry.y - y;
            const dz = entry.z - z;
            if (dx * dx + dy * dy + dz * dz <= radiusSq) {
              out.push(item);
            }
          }
        }
      }
    }
    return out;
  }

  /**
   * Queries all entities whose anchor position lies within the axis-aligned 3D bounding box.
   */
  public queryBox(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    out: T[] = [],
    filter?: (item: T) => boolean
  ): T[] {
    out.length = 0;
    if (this.entries.size === 0) return out;

    const minCx = Math.floor(minX * this.invCellSize);
    const maxCx = Math.floor(maxX * this.invCellSize);
    const minCy = Math.floor(minY * this.invCellSize);
    const maxCy = Math.floor(maxY * this.invCellSize);
    const minCz = Math.floor(minZ * this.invCellSize);
    const maxCz = Math.floor(maxZ * this.invCellSize);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const bucket = this.buckets.get(hashCell3D(cx, cy, cz));
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i++) {
            const item = bucket[i];
            if (filter && !filter(item)) continue;
            const entry = this.entries.get(item.id);
            if (!entry) continue;
            if (
              entry.x >= minX &&
              entry.x <= maxX &&
              entry.y >= minY &&
              entry.y <= maxY &&
              entry.z >= minZ &&
              entry.z <= maxZ
            ) {
              out.push(item);
            }
          }
        }
      }
    }
    return out;
  }

  /**
   * Broad-phase 3D ray traversal across spatial hash cells (with 1-cell vertical/lateral
   * margin to handle entity bounding boxes straddling cell borders).
   */
  public queryRay(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    out: T[] = [],
    filter?: (item: T) => boolean
  ): T[] {
    out.length = 0;
    if (this.entries.size === 0 || maxDistance <= 0) return out;

    const endX = origin.x + direction.x * maxDistance;
    const endY = origin.y + direction.y * maxDistance;
    const endZ = origin.z + direction.z * maxDistance;

    // For short/medium interaction & melee rays, a padded bounding box over the ray segment
    // covers only a handful of 3D cells and eliminates edge-clipping misses.
    if (maxDistance <= 20) {
      const padXZ = 2.0;
      const padYBottom = 3.2; // catches tall entities whose feet sit below ray height
      const padYTop = 1.5;
      return this.queryBox(
        Math.min(origin.x, endX) - padXZ,
        Math.min(origin.y, endY) - padYBottom,
        Math.min(origin.z, endZ) - padXZ,
        Math.max(origin.x, endX) + padXZ,
        Math.max(origin.y, endY) + padYTop,
        Math.max(origin.z, endZ) + padXZ,
        out,
        filter
      );
    }

    // Long rays: 3D DDA traversal across spatial hash cells
    this.visitedIds.clear();
    let cx = Math.floor(origin.x * this.invCellSize);
    let cy = Math.floor(origin.y * this.invCellSize);
    let cz = Math.floor(origin.z * this.invCellSize);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = stepX !== 0 ? Math.abs(this.cellSize / direction.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(this.cellSize / direction.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(this.cellSize / direction.z) : Infinity;

    let tMaxX = stepX > 0 ? ((cx + 1) * this.cellSize - origin.x) / direction.x : stepX < 0 ? (cx * this.cellSize - origin.x) / direction.x : Infinity;
    let tMaxY = stepY > 0 ? ((cy + 1) * this.cellSize - origin.y) / direction.y : stepY < 0 ? (cy * this.cellSize - origin.y) / direction.y : Infinity;
    let tMaxZ = stepZ > 0 ? ((cz + 1) * this.cellSize - origin.z) / direction.z : stepZ < 0 ? (cz * this.cellSize - origin.z) / direction.z : Infinity;

    let dist = 0;
    let steps = 0;
    while (dist <= maxDistance && steps < 64) {
      steps++;
      for (let dy = -1; dy <= 0; dy++) {
        const bucket = this.buckets.get(hashCell3D(cx, cy + dy, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const item = bucket[i];
          if (this.visitedIds.has(item.id)) continue;
          if (filter && !filter(item)) continue;
          this.visitedIds.add(item.id);
          out.push(item);
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          cx += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
        } else {
          cz += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          cy += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
        } else {
          cz += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
        }
      }
    }

    return out;
  }
}
