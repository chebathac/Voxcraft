import * as THREE from 'three';
import { BlockType, DimensionId, RaycastHit } from './types';
import { BLOCK_DEFS, textureManager } from './textures';
import { TerrainGenerator } from './terrain';
import {
  SpatialHash3D,
  hashBlockCoords3D,
  hashChunkCoords2D,
} from './spatialHash';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 48;
const SUBCELL_SIZE = 8;
const SUBCELLS_XZ = CHUNK_SIZE / SUBCELL_SIZE; // 2
const SUBCELLS_Y = CHUNK_HEIGHT / SUBCELL_SIZE; // 6
const SUBCELL_COUNT = SUBCELLS_XZ * SUBCELLS_Y * SUBCELLS_XZ; // 24
const MAX_UNLOADED_BLOCK_CACHE = 16384;

export type WorldEntityKind = 'mob' | 'drop' | 'player';

export interface WorldEntity<T = unknown> {
  id: string;
  kind: WorldEntityKind;
  position: THREE.Vector3;
  radius?: number;
  data?: T;
}

export interface ChunkKey {
  cx: number;
  cz: number;
}

export class VoxelWorld {
  public scene: THREE.Scene;
  public terrain: TerrainGenerator;
  public dimension: DimensionId = 'overworld';
  
  // Storage: chunkKey ("cx,cz") -> 3D Uint8Array [CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]
  private chunks: Map<string, Uint8Array> = new Map();
  // Numeric 2D chunk spatial hash: hashChunkCoords2D(cx, cz) -> chunk Uint8Array (zero string alloc)
  private chunkHashMap: Map<number, Uint8Array> = new Map();
  // 8x8x8 3D sub-cell occupancy masks per loaded chunk (0 = guaranteed pure AIR, 1 = may contain blocks)
  private subCellSolidMask: Map<number, Uint8Array> = new Map();
  // Mesh per chunk: chunkKey -> THREE.Group containing sub-meshes
  private chunkMeshes: Map<string, THREE.Group> = new Map();
  // Dirty chunks waiting for rebuild
  private dirtyChunks: Set<string> = new Set();
  // Per-chunk delta index for fast chunk generation without 12k string keys
  private chunkDeltas: Map<string, Map<number, BlockType>> = new Map();
  
  // Persistent world deltas: "x,y,z" -> BlockType
  public deltas: Map<string, BlockType> = new Map();
  // Numeric 3D spatial hash mirror of deltas for zero-allocation hot lookups
  private deltaSpatialHash: Map<number, BlockType> = new Map();
  // Bounded 3D spatial hash cache for unloaded procedural terrain queries
  private unloadedBlockHash: Map<number, BlockType> = new Map();

  // 3D Spatial Hash Grid (8x8x8m cells) for mobs, dropped items, and remote players
  public readonly entityHash: SpatialHash3D<WorldEntity> = new SpatialHash3D<WorldEntity>(8);

  // Callback whenever a block is placed or destroyed
  public onBlockModified?: (wx: number, wy: number, wz: number, blockType: BlockType, deltas: Map<string, BlockType>) => void;

  // Highlight wireframe for targeted block
  public highlightMesh: THREE.LineSegments;

  constructor(scene: THREE.Scene, seed = 12345, initialDeltas?: Map<string, BlockType>) {
    this.scene = scene;
    this.terrain = new TerrainGenerator(seed);

    if (initialDeltas) {
      for (const [key, blockId] of initialDeltas) {
        this.deltas.set(key, blockId);
        const parts = key.split(',');
        if (parts.length === 3) {
          const wx = parseInt(parts[0], 10);
          const wy = parseInt(parts[1], 10);
          const wz = parseInt(parts[2], 10);
          if (Number.isFinite(wx) && Number.isFinite(wy) && Number.isFinite(wz)) {
            this.deltaSpatialHash.set(hashBlockCoords3D(wx, wy, wz), blockId);
            this.indexChunkDelta(wx, wy, wz, blockId);
          }
        }
      }
    }

    // Build highlight wireframe
    const boxGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const wireGeo = new THREE.WireframeGeometry(boxGeo);
    boxGeo.dispose();
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
      depthTest: true,
      transparent: true,
      opacity: 0.75,
    });
    this.highlightMesh = new THREE.LineSegments(wireGeo, wireMat);
    this.highlightMesh.visible = false;
    this.highlightMesh.renderOrder = 999;
    this.scene.add(this.highlightMesh);
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public worldToChunkCoord(v: number): number {
    return Math.floor(v / CHUNK_SIZE);
  }

  public worldToLocalCoord(v: number): number {
    const rem = v % CHUNK_SIZE;
    return rem < 0 ? rem + CHUNK_SIZE : rem;
  }

  // Get index in chunk array
  private getBlockIndex(lx: number, ly: number, lz: number): number {
    return (ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx;
  }

  private getSubCellIndex(lx: number, wy: number, lz: number): number {
    return (((wy >> 3) * SUBCELLS_XZ + (lz >> 3)) * SUBCELLS_XZ) + (lx >> 3);
  }

  private indexChunkDelta(wx: number, wy: number, wz: number, blockType: BlockType): void {
    if (wy < 0 || wy >= CHUNK_HEIGHT || !Number.isFinite(wx) || !Number.isFinite(wy) || !Number.isFinite(wz)) return;
    const cx = this.worldToChunkCoord(wx);
    const cz = this.worldToChunkCoord(wz);
    const cKey = this.getChunkKey(cx, cz);
    let cd = this.chunkDeltas.get(cKey);
    if (!cd) {
      cd = new Map();
      this.chunkDeltas.set(cKey, cd);
    }
    const lx = this.worldToLocalCoord(wx);
    const lz = this.worldToLocalCoord(wz);
    cd.set(this.getBlockIndex(lx, wy, lz), blockType);
  }

  // Generate raw chunk data if not loaded
  public getOrCreateChunk(cx: number, cz: number): Uint8Array {
    const chunkNumKey = hashChunkCoords2D(cx, cz);
    const existing = this.chunkHashMap.get(chunkNumKey);
    if (existing) return existing;

    const key = this.getChunkKey(cx, cz);
    const chunk = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const mask = new Uint8Array(SUBCELL_COUNT);
    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;

    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wz = startZ + lz;
      const scz = lz >> 3;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const wx = startX + lx;
        const scx = lx >> 3;
        for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
          const b = this.terrain.getBlockAt(wx, ly, wz);
          chunk[(ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx] = b;
          if (b !== BlockType.AIR) {
            mask[((ly >> 3) * SUBCELLS_XZ + scz) * SUBCELLS_XZ + scx] = 1;
          }
        }
      }
    }

    const cd = this.chunkDeltas.get(key);
    if (cd) {
      for (const [idx, blockId] of cd) {
        chunk[idx] = blockId;
        if (blockId !== BlockType.AIR) {
          const ly = Math.floor(idx / (CHUNK_SIZE * CHUNK_SIZE));
          const rem = idx - ly * CHUNK_SIZE * CHUNK_SIZE;
          const lz = Math.floor(rem / CHUNK_SIZE);
          const lx = rem - lz * CHUNK_SIZE;
          mask[this.getSubCellIndex(lx, ly, lz)] = 1;
        }
      }
    }

    this.chunks.set(key, chunk);
    this.chunkHashMap.set(chunkNumKey, chunk);
    this.subCellSolidMask.set(chunkNumKey, mask);
    this.dirtyChunks.add(key);
    return chunk;
  }

  // Query block at world coordinates using zero-allocation 3D spatial hashing
  public getBlock(wx: number, wy: number, wz: number): BlockType {
    const iy = Math.floor(wy);
    if (iy < 0 || iy >= CHUNK_HEIGHT) return BlockType.AIR;

    const ix = Math.floor(wx);
    const iz = Math.floor(wz);
    const bHash = hashBlockCoords3D(ix, iy, iz);
    const deltaVal = this.deltaSpatialHash.get(bHash);
    if (deltaVal !== undefined) {
      return deltaVal;
    }

    const cx = Math.floor(ix / CHUNK_SIZE);
    const cz = Math.floor(iz / CHUNK_SIZE);
    const chunkNumKey = hashChunkCoords2D(cx, cz);
    const chunk = this.chunkHashMap.get(chunkNumKey);

    if (chunk) {
      const lx = ix - cx * CHUNK_SIZE;
      const lz = iz - cz * CHUNK_SIZE;
      return chunk[(iy * CHUNK_SIZE + lz) * CHUNK_SIZE + lx];
    }

    // 3D spatial hash cache for unloaded procedural terrain queries
    const cached = this.unloadedBlockHash.get(bHash);
    if (cached !== undefined) {
      return cached;
    }
    const generated = this.terrain.getBlockAt(ix, iy, iz);
    if (this.unloadedBlockHash.size >= MAX_UNLOADED_BLOCK_CACHE) {
      this.unloadedBlockHash.clear();
    }
    this.unloadedBlockHash.set(bHash, generated);
    return generated;
  }

  // Fast AABB solid-block check using chunk-cached & numeric 3D spatial hash lookups
  public isBoxSolid(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): boolean {
    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX);
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(CHUNK_HEIGHT - 1, Math.floor(maxY));
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ);

    if (y0 > y1) return false;

    let cachedCx = 0x7fffffff;
    let cachedCz = 0x7fffffff;
    let cachedChunk: Uint8Array | undefined;
    let cachedMask: Uint8Array | undefined;

    for (let z = z0; z <= z1; z++) {
      const cz = Math.floor(z / CHUNK_SIZE);
      const lz = z - cz * CHUNK_SIZE;
      for (let x = x0; x <= x1; x++) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const lx = x - cx * CHUNK_SIZE;

        if (cx !== cachedCx || cz !== cachedCz) {
          cachedCx = cx;
          cachedCz = cz;
          const chunkNumKey = hashChunkCoords2D(cx, cz);
          cachedChunk = this.chunkHashMap.get(chunkNumKey);
          cachedMask = this.subCellSolidMask.get(chunkNumKey);
        }

        for (let y = y0; y <= y1; y++) {
          if (cachedMask && cachedMask[this.getSubCellIndex(lx, y, lz)] === 0) {
            continue;
          }

          let block: BlockType;
          const bHash = hashBlockCoords3D(x, y, z);
          const deltaVal = this.deltaSpatialHash.get(bHash);
          if (deltaVal !== undefined) {
            block = deltaVal;
          } else if (cachedChunk) {
            block = cachedChunk[(y * CHUNK_SIZE + lz) * CHUNK_SIZE + lx];
          } else {
            const cached = this.unloadedBlockHash.get(bHash);
            if (cached !== undefined) {
              block = cached;
            } else {
              block = this.terrain.getBlockAt(x, y, z);
              if (this.unloadedBlockHash.size >= MAX_UNLOADED_BLOCK_CACHE) {
                this.unloadedBlockHash.clear();
              }
              this.unloadedBlockHash.set(bHash, block);
            }
          }

          if (
            block !== BlockType.AIR &&
            block !== BlockType.WATER &&
            block !== BlockType.NETHER_PORTAL &&
            block !== BlockType.REDSTONE_DUST &&
            block !== BlockType.REDSTONE_DUST_ON &&
            block !== BlockType.TORCH &&
            block !== BlockType.REDSTONE_TORCH &&
            block !== BlockType.POPPY &&
            block !== BlockType.DANDELION &&
            block !== BlockType.TORCHFLOWER &&
            block !== BlockType.WILDFLOWER &&
            block !== BlockType.WHEAT_CROP &&
            block !== BlockType.CARROT_CROP &&
            block !== BlockType.POTATO_CROP &&
            block !== BlockType.BEETROOT_CROP &&
            block !== BlockType.SUGAR_CANE &&
            block !== BlockType.BAMBOO
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Query highest non-air surface block at (wx, wz) for top-down minimap rendering
  public getTopBlock(wx: number, wz: number, maxScanY: number = CHUNK_HEIGHT - 1): { block: BlockType; y: number } {
    const ix = Math.floor(wx);
    const iz = Math.floor(wz);
    const cx = Math.floor(ix / CHUNK_SIZE);
    const cz = Math.floor(iz / CHUNK_SIZE);
    const chunkNumKey = hashChunkCoords2D(cx, cz);
    const chunk = this.chunkHashMap.get(chunkNumKey);
    const mask = this.subCellSolidMask.get(chunkNumKey);
    const lx = ix - cx * CHUNK_SIZE;
    const lz = iz - cz * CHUNK_SIZE;

    const startY = Math.min(CHUNK_HEIGHT - 1, Math.max(0, maxScanY));

    if (chunk) {
      for (let ly = startY; ly >= 0; ly--) {
        if (mask && mask[this.getSubCellIndex(lx, ly, lz)] === 0) {
          ly = (ly & ~7); // Jump straight to bottom of empty 8x8x8 spatial sub-cell
          continue;
        }
        const deltaVal = this.deltaSpatialHash.get(hashBlockCoords3D(ix, ly, iz));
        const block =
          deltaVal !== undefined
            ? deltaVal
            : chunk[(ly * CHUNK_SIZE + lz) * CHUNK_SIZE + lx];

        if (block !== BlockType.AIR) {
          return { block, y: ly };
        }
      }
    } else {
      for (let ly = startY; ly >= 0; ly--) {
        const bHash = hashBlockCoords3D(ix, ly, iz);
        const deltaVal = this.deltaSpatialHash.get(bHash);
        if (deltaVal !== undefined) {
          if (deltaVal !== BlockType.AIR) return { block: deltaVal, y: ly };
        } else {
          let block = this.unloadedBlockHash.get(bHash);
          if (block === undefined) {
            block = this.terrain.getBlockAt(ix, ly, iz);
            if (this.unloadedBlockHash.size >= MAX_UNLOADED_BLOCK_CACHE) {
              this.unloadedBlockHash.clear();
            }
            this.unloadedBlockHash.set(bHash, block);
          }
          if (block !== BlockType.AIR) return { block, y: ly };
        }
      }
    }

    return { block: BlockType.BEDROCK, y: 0 };
  }

  // Set block at world coordinates (with chunk dirtying, 3D spatial hash sync, and delta persistence)
  public setBlock(wx: number, wy: number, wz: number, blockType: BlockType, silent = false): void {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;

    const ix = Math.floor(wx);
    const iy = Math.floor(wy);
    const iz = Math.floor(wz);
    const bHash = hashBlockCoords3D(ix, iy, iz);
    const cx = Math.floor(ix / CHUNK_SIZE);
    const cz = Math.floor(iz / CHUNK_SIZE);
    const chunkNumKey = hashChunkCoords2D(cx, cz);

    if (this.deltaSpatialHash.get(bHash) === blockType) {
      const loaded = this.chunkHashMap.get(chunkNumKey);
      if (loaded) {
        const lx = ix - cx * CHUNK_SIZE;
        const lz = iz - cz * CHUNK_SIZE;
        if (loaded[(iy * CHUNK_SIZE + lz) * CHUNK_SIZE + lx] === blockType) return;
      }
    }

    const deltaKey = `${ix},${iy},${iz}`;
    this.deltas.set(deltaKey, blockType);
    this.deltaSpatialHash.set(bHash, blockType);
    this.unloadedBlockHash.delete(bHash);
    this.indexChunkDelta(ix, iy, iz, blockType);

    const key = this.getChunkKey(cx, cz);
    const chunk = this.getOrCreateChunk(cx, cz);

    const lx = ix - cx * CHUNK_SIZE;
    const lz = iz - cz * CHUNK_SIZE;
    chunk[(iy * CHUNK_SIZE + lz) * CHUNK_SIZE + lx] = blockType;

    if (blockType !== BlockType.AIR) {
      const mask = this.subCellSolidMask.get(chunkNumKey);
      if (mask) {
        mask[this.getSubCellIndex(lx, iy, lz)] = 1;
      }
    }

    this.dirtyChunks.add(key);

    // If on boundary, mark neighbor chunks dirty so neighboring faces update
    if (lx === 0) this.dirtyChunks.add(this.getChunkKey(cx - 1, cz));
    if (lx === CHUNK_SIZE - 1) this.dirtyChunks.add(this.getChunkKey(cx + 1, cz));
    if (lz === 0) this.dirtyChunks.add(this.getChunkKey(cx, cz - 1));
    if (lz === CHUNK_SIZE - 1) this.dirtyChunks.add(this.getChunkKey(cx, cz + 1));

    if (!silent) {
      this.onBlockModified?.(ix, iy, iz, blockType, this.deltas);
    }
  }

  // Apply remote delta snapshot without forcing distant unloaded chunks into memory
  public applyDeltasBatch(entries: [string, number][]): boolean {
    let touchedLoadedChunk = false;
    for (let i = 0; i < entries.length; i++) {
      const [key, rawId] = entries[i];
      const blockType = rawId as BlockType;
      if (this.deltas.get(key) === blockType) continue;

      const parts = key.split(',');
      if (parts.length !== 3) continue;
      const wx = parseInt(parts[0], 10);
      const wy = parseInt(parts[1], 10);
      const wz = parseInt(parts[2], 10);
      if (wy < 0 || wy >= CHUNK_HEIGHT || !Number.isFinite(wx) || !Number.isFinite(wz)) continue;

      const bHash = hashBlockCoords3D(wx, wy, wz);
      this.deltas.set(key, blockType);
      this.deltaSpatialHash.set(bHash, blockType);
      this.unloadedBlockHash.delete(bHash);
      this.indexChunkDelta(wx, wy, wz, blockType);

      const cx = this.worldToChunkCoord(wx);
      const cz = this.worldToChunkCoord(wz);
      const chunkNumKey = hashChunkCoords2D(cx, cz);
      const loaded = this.chunkHashMap.get(chunkNumKey);
      if (loaded) {
        const cKey = this.getChunkKey(cx, cz);
        const lx = this.worldToLocalCoord(wx);
        const lz = this.worldToLocalCoord(wz);
        loaded[this.getBlockIndex(lx, wy, lz)] = blockType;
        if (blockType !== BlockType.AIR) {
          const mask = this.subCellSolidMask.get(chunkNumKey);
          if (mask) {
            mask[this.getSubCellIndex(lx, wy, lz)] = 1;
          }
        }
        this.dirtyChunks.add(cKey);
        if (lx === 0) this.dirtyChunks.add(this.getChunkKey(cx - 1, cz));
        if (lx === CHUNK_SIZE - 1) this.dirtyChunks.add(this.getChunkKey(cx + 1, cz));
        if (lz === 0) this.dirtyChunks.add(this.getChunkKey(cx, cz - 1));
        if (lz === CHUNK_SIZE - 1) this.dirtyChunks.add(this.getChunkKey(cx, cz + 1));
        touchedLoadedChunk = true;
      }
    }
    return touchedLoadedChunk;
  }

  // Clear all player block modifications
  public clearAllDeltas(): void {
    this.deltas.clear();
    this.deltaSpatialHash.clear();
    this.unloadedBlockHash.clear();
    this.chunkDeltas.clear();
    // Mark all existing loaded chunks dirty to regenerate from procedural seed
    for (const key of this.chunks.keys()) {
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr, 10);
      const cz = parseInt(czStr, 10);
      const chunkNumKey = hashChunkCoords2D(cx, cz);
      this.chunks.delete(key);
      this.chunkHashMap.delete(chunkNumKey);
      this.subCellSolidMask.delete(chunkNumKey);
      this.getOrCreateChunk(cx, cz);
      this.dirtyChunks.add(key);
    }
  }

  // Switch active dimension (Overworld <-> Nether <-> End) cleanly
  public setDimension(dim: DimensionId, newDeltas: Map<string, BlockType>): void {
    this.dimension = dim;
    this.terrain.dimension = dim;

    for (const group of this.chunkMeshes.values()) {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      this.scene.remove(group);
    }
    this.chunkMeshes.clear();
    this.chunks.clear();
    this.chunkHashMap.clear();
    this.subCellSolidMask.clear();
    this.dirtyChunks.clear();
    this.deltas.clear();
    this.deltaSpatialHash.clear();
    this.unloadedBlockHash.clear();
    this.chunkDeltas.clear();

    for (const [key, blockId] of newDeltas) {
      this.deltas.set(key, blockId);
      const parts = key.split(',');
      if (parts.length === 3) {
        const wx = parseInt(parts[0], 10);
        const wy = parseInt(parts[1], 10);
        const wz = parseInt(parts[2], 10);
        if (Number.isFinite(wx) && Number.isFinite(wy) && Number.isFinite(wz)) {
          this.deltaSpatialHash.set(hashBlockCoords3D(wx, wy, wz), blockId);
          this.indexChunkDelta(wx, wy, wz, blockId);
        }
      }
    }
  }

  // Check if a block face should be rendered (face culling)
  private shouldRenderFace(neighborBlock: BlockType, currentBlock: BlockType): boolean {
    if (neighborBlock === BlockType.AIR) return true;

    const currentDef = BLOCK_DEFS[currentBlock];
    const neighborDef = BLOCK_DEFS[neighborBlock];

    if (currentDef?.isTransparent) {
      return neighborBlock !== currentBlock;
    }

    return !!neighborDef?.isTransparent;
  }

  // Re-mesh dirty chunks (optionally capped per frame for zero-lag streaming)
  public updateMeshes(maxCount = Infinity, focusX?: number, focusZ?: number): void {
    if (this.dirtyChunks.size === 0) return;

    let keysToBuild = Array.from(this.dirtyChunks);
    if (maxCount < keysToBuild.length && focusX !== undefined && focusZ !== undefined) {
      const fcx = this.worldToChunkCoord(focusX);
      const fcz = this.worldToChunkCoord(focusZ);
      keysToBuild.sort((a, b) => {
        const [ax, az] = a.split(',').map(Number);
        const [bx, bz] = b.split(',').map(Number);
        const da = (ax - fcx) * (ax - fcx) + (az - fcz) * (az - fcz);
        const db = (bx - fcx) * (bx - fcx) + (bz - fcz) * (bz - fcz);
        return da - db;
      });
    }

    const limit = Math.min(maxCount, keysToBuild.length);
    for (let i = 0; i < limit; i++) {
      const key = keysToBuild[i];
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr, 10);
      const cz = parseInt(czStr, 10);

      this.buildChunkMesh(cx, cz);
      this.dirtyChunks.delete(key);
    }
  }

  public hasPendingMeshes(): boolean {
    return this.dirtyChunks.size > 0;
  }

  // Face geometries & data for fast greedy/culled meshing
  private buildChunkMesh(cx: number, cz: number): void {
    const key = this.getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;

    // Dispose old mesh
    const oldMeshGroup = this.chunkMeshes.get(key);
    if (oldMeshGroup) {
      oldMeshGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      this.scene.remove(oldMeshGroup);
      this.chunkMeshes.delete(key);
    }

    // Collect geometry data grouped by BlockType
    const blockBatches = new Map<BlockType, {
      positions: number[];
      normals: number[];
      uvs: number[];
      colors: number[];
      groups: { start: number; count: number; materialIndex: number }[];
    }>();

    const startX = cx * CHUNK_SIZE;
    const startZ = cz * CHUNK_SIZE;
    const chunkNegX = this.chunks.get(this.getChunkKey(cx - 1, cz));
    const chunkPosX = this.chunks.get(this.getChunkKey(cx + 1, cz));
    const chunkNegZ = this.chunks.get(this.getChunkKey(cx, cz - 1));
    const chunkPosZ = this.chunks.get(this.getChunkKey(cx, cz + 1));

    const isOccluder = (b: BlockType): boolean =>
      b !== BlockType.AIR && !BLOCK_DEFS[b]?.isTransparent;

    const sampleFast = (wx: number, wy: number, wz: number): BlockType => {
      if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR;
      const lxLocal = wx - startX;
      const lzLocal = wz - startZ;
      if (lxLocal >= 0 && lxLocal < CHUNK_SIZE) {
        if (lzLocal >= 0 && lzLocal < CHUNK_SIZE) {
          return chunk[(wy * CHUNK_SIZE + lzLocal) * CHUNK_SIZE + lxLocal];
        }
        if (lzLocal === -1 && chunkNegZ) {
          return chunkNegZ[(wy * CHUNK_SIZE + (CHUNK_SIZE - 1)) * CHUNK_SIZE + lxLocal];
        }
        if (lzLocal === CHUNK_SIZE && chunkPosZ) {
          return chunkPosZ[wy * CHUNK_SIZE * CHUNK_SIZE + lxLocal];
        }
      } else if (lzLocal >= 0 && lzLocal < CHUNK_SIZE) {
        if (lxLocal === -1 && chunkNegX) {
          return chunkNegX[(wy * CHUNK_SIZE + lzLocal) * CHUNK_SIZE + (CHUNK_SIZE - 1)];
        }
        if (lxLocal === CHUNK_SIZE && chunkPosX) {
          return chunkPosX[(wy * CHUNK_SIZE + lzLocal) * CHUNK_SIZE];
        }
      }
      return this.getBlock(wx, wy, wz);
    };

    const AO_CURVE = [0.56, 0.72, 0.86, 1.0];
    const FACE_SHADE = [0.89, 0.89, 1.0, 0.72, 0.94, 0.94]; // +X, -X, +Y, -Y, +Z, -Z

    // Faces: [dirX, dirY, dirZ, faceIdx, [v0, v1, v2, v3], normal]
    const FACES = [
      // Right (+X)
      { dir: [1, 0, 0], norm: [1, 0, 0], faceIdx: 0, corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
      // Left (-X)
      { dir: [-1, 0, 0], norm: [-1, 0, 0], faceIdx: 1, corners: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
      // Top (+Y)
      { dir: [0, 1, 0], norm: [0, 1, 0], faceIdx: 2, corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
      // Bottom (-Y)
      { dir: [0, -1, 0], norm: [0, -1, 0], faceIdx: 3, corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
      // Front (+Z)
      { dir: [0, 0, 1], norm: [0, 0, 1], faceIdx: 4, corners: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
      // Back (-Z)
      { dir: [0, 0, -1], norm: [0, 0, -1], faceIdx: 5, corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
    ];

    const QUAD_UVS: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];

    const cornerShade: [number, number, number, number] = [1, 1, 1, 1];

    for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const block = chunk[this.getBlockIndex(lx, ly, lz)];
          if (block === BlockType.AIR) continue;

          const wx = startX + lx;
          const wz = startZ + lz;
          const isEmissive =
            block === BlockType.LAVA ||
            block === BlockType.GLOWSTONE ||
            !!BLOCK_DEFS[block as BlockType]?.isLightEmitter;
          const isWaterOrGlass =
            block === BlockType.WATER ||
            block === BlockType.GLASS ||
            block === BlockType.NETHER_PORTAL ||
            block === BlockType.BEACON;

          for (const face of FACES) {
            const nlx = lx + face.dir[0];
            const nly = ly + face.dir[1];
            const nlz = lz + face.dir[2];

            let neighbor: BlockType;
            if (nly < 0 || nly >= CHUNK_HEIGHT) {
              neighbor = BlockType.AIR;
            } else if (nlx >= 0 && nlx < CHUNK_SIZE && nlz >= 0 && nlz < CHUNK_SIZE) {
              neighbor = chunk[(nly * CHUNK_SIZE + nlz) * CHUNK_SIZE + nlx];
            } else {
              neighbor = this.getBlock(wx + face.dir[0], nly, wz + face.dir[2]);
            }

            if (this.shouldRenderFace(neighbor, block)) {
              if (!blockBatches.has(block)) {
                blockBatches.set(block, { positions: [], normals: [], uvs: [], colors: [], groups: [] });
              }
              const batch = blockBatches.get(block)!;

              const c = face.corners;
              const startVertex = batch.positions.length / 3;
              const fShade = isEmissive ? 1.0 : FACE_SHADE[face.faceIdx];

              const px = wx + face.dir[0];
              const py = ly + face.dir[1];
              const pz = wz + face.dir[2];

              for (let k = 0; k < 4; k++) {
                if (isEmissive || isWaterOrGlass) {
                  cornerShade[k] = isEmissive ? 1.0 : fShade * 0.96;
                  continue;
                }
                const sx = face.dir[0] === 0 ? (c[k][0] === 1 ? 1 : -1) : 0;
                const sy = face.dir[1] === 0 ? (c[k][1] === 1 ? 1 : -1) : 0;
                const sz = face.dir[2] === 0 ? (c[k][2] === 1 ? 1 : -1) : 0;

                let s1 = 0;
                let s2 = 0;
                let cr = 0;
                if (face.dir[0] !== 0) {
                  s1 = isOccluder(sampleFast(px, py + sy, pz)) ? 1 : 0;
                  s2 = isOccluder(sampleFast(px, py, pz + sz)) ? 1 : 0;
                  cr = isOccluder(sampleFast(px, py + sy, pz + sz)) ? 1 : 0;
                } else if (face.dir[1] !== 0) {
                  s1 = isOccluder(sampleFast(px + sx, py, pz)) ? 1 : 0;
                  s2 = isOccluder(sampleFast(px, py, pz + sz)) ? 1 : 0;
                  cr = isOccluder(sampleFast(px + sx, py, pz + sz)) ? 1 : 0;
                } else {
                  s1 = isOccluder(sampleFast(px + sx, py, pz)) ? 1 : 0;
                  s2 = isOccluder(sampleFast(px, py + sy, pz)) ? 1 : 0;
                  cr = isOccluder(sampleFast(px + sx, py + sy, pz)) ? 1 : 0;
                }
                const aoIdx = s1 && s2 ? 0 : 3 - (s1 + s2 + cr);
                cornerShade[k] = AO_CURVE[aoIdx] * fShade;
              }

              // Flip quad diagonal when needed to prevent ambient occlusion interpolation artifacts
              const flipDiag = cornerShade[0] + cornerShade[2] < cornerShade[1] + cornerShade[3];
              const triIndices = flipDiag ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];

              for (let t = 0; t < 6; t++) {
                const idx = triIndices[t];
                batch.positions.push(wx + c[idx][0], ly + c[idx][1], wz + c[idx][2]);
                batch.normals.push(face.norm[0], face.norm[1], face.norm[2]);
                batch.uvs.push(QUAD_UVS[idx][0], QUAD_UVS[idx][1]);
                const sh = cornerShade[idx];
                batch.colors.push(sh, sh, sh);
              }

              batch.groups.push({
                start: startVertex,
                count: 6,
                materialIndex: face.faceIdx,
              });
            }
          }
        }
      }
    }

    if (blockBatches.size === 0) return;

    const group = new THREE.Group();

    for (const [blockType, batch] of blockBatches) {
      if (batch.positions.length === 0) continue;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(batch.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(batch.uvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(batch.colors, 3));

      const mat = textureManager.getChunkBlockMaterials(blockType);

      if (Array.isArray(mat)) {
        for (const g of batch.groups) {
          geometry.addGroup(g.start, g.count, g.materialIndex);
        }
      }

      const mesh = new THREE.Mesh(geometry, mat);
      const isTransparent = !!BLOCK_DEFS[blockType]?.isTransparent;
      mesh.castShadow = !isTransparent || blockType === BlockType.LEAVES_OAK || blockType === BlockType.LEAVES_CHERRY;
      mesh.receiveShadow = blockType !== BlockType.LAVA;

      if (isTransparent) {
        mesh.renderOrder = blockType === BlockType.WATER ? 10 : 5;
      }

      group.add(mesh);
    }

    this.scene.add(group);
    this.chunkMeshes.set(key, group);
  }

  // Load chunks in a grid around player and unload distant chunks to keep FPS & RAM steady
  public loadAround(playerX: number, playerZ: number, radius = 2, maxBuildPerFrame = Infinity): void {
    const centerCx = this.worldToChunkCoord(playerX);
    const centerCz = this.worldToChunkCoord(playerZ);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        this.getOrCreateChunk(centerCx + dx, centerCz + dz);
      }
    }

    // Evict far-away chunk meshes & data to prevent memory/draw-call creep
    const unloadRadius = radius + 2;
    for (const key of Array.from(this.chunkMeshes.keys())) {
      const [cxStr, czStr] = key.split(',');
      const cx = parseInt(cxStr, 10);
      const cz = parseInt(czStr, 10);
      if (Math.abs(cx - centerCx) > unloadRadius || Math.abs(cz - centerCz) > unloadRadius) {
        const group = this.chunkMeshes.get(key);
        if (group) {
          group.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
            }
          });
          this.scene.remove(group);
        }
        this.chunkMeshes.delete(key);
        this.chunks.delete(key);
        const chunkNumKey = hashChunkCoords2D(cx, cz);
        this.chunkHashMap.delete(chunkNumKey);
        this.subCellSolidMask.delete(chunkNumKey);
        this.dirtyChunks.delete(key);
      }
    }

    this.updateMeshes(maxBuildPerFrame, playerX, playerZ);
  }

  // 3D Spatial Entity Indexing API (used by MobManager, DroppedItemManager, MultiplayerClient)
  public registerEntity(entity: WorldEntity): void {
    this.entityHash.upsert(entity, entity.position.x, entity.position.y, entity.position.z);
  }

  public updateEntitySpatial(entity: WorldEntity): void {
    this.entityHash.upsert(entity, entity.position.x, entity.position.y, entity.position.z);
  }

  public unregisterEntity(id: string): void {
    this.entityHash.remove(id);
  }

  public queryEntitiesInRadius(
    x: number,
    y: number,
    z: number,
    radius: number,
    kind?: WorldEntityKind,
    out: WorldEntity[] = []
  ): WorldEntity[] {
    return this.entityHash.queryRadius(
      x,
      y,
      z,
      radius,
      out,
      kind ? (e) => e.kind === kind : undefined
    );
  }

  public queryEntitiesInBox(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    kind?: WorldEntityKind,
    out: WorldEntity[] = []
  ): WorldEntity[] {
    return this.entityHash.queryBox(
      minX,
      minY,
      minZ,
      maxX,
      maxY,
      maxZ,
      out,
      kind ? (e) => e.kind === kind : undefined
    );
  }

  public queryEntitiesAlongRay(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
    kind?: WorldEntityKind,
    out: WorldEntity[] = []
  ): WorldEntity[] {
    return this.entityHash.queryRay(
      origin,
      direction,
      maxDistance,
      out,
      kind ? (e) => e.kind === kind : undefined
    );
  }

  public getSpatialStats(): {
    blockCacheSize: number;
    deltaCount: number;
    chunkCount: number;
    entityCount: number;
    entityBucketCount: number;
  } {
    return {
      blockCacheSize: this.unloadedBlockHash.size,
      deltaCount: this.deltaSpatialHash.size,
      chunkCount: this.chunkHashMap.size,
      entityCount: this.entityHash.size,
      entityBucketCount: this.entityHash.bucketCount,
    };
  }

  // Fast Digital Differential Analyzer (DDA) raycast with chunk-cached 3D spatial hash lookups
  public raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance = 6.0): RaycastHit | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

    let tMaxX = stepX > 0 ? (x + 1 - origin.x) * tDeltaX : (origin.x - x) * tDeltaX;
    let tMaxY = stepY > 0 ? (y + 1 - origin.y) * tDeltaY : (origin.y - y) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (z + 1 - origin.z) * tDeltaZ : (origin.z - z) * tDeltaZ;

    let normal: [number, number, number] = [0, 0, 0];
    let distance = 0;

    let cachedCx = 0x7fffffff;
    let cachedCz = 0x7fffffff;
    let cachedChunk: Uint8Array | undefined;
    let cachedMask: Uint8Array | undefined;

    while (distance <= maxDistance) {
      let block = BlockType.AIR;
      if (y >= 0 && y < CHUNK_HEIGHT) {
        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        if (cx !== cachedCx || cz !== cachedCz) {
          cachedCx = cx;
          cachedCz = cz;
          const chunkNumKey = hashChunkCoords2D(cx, cz);
          cachedChunk = this.chunkHashMap.get(chunkNumKey);
          cachedMask = this.subCellSolidMask.get(chunkNumKey);
        }

        const lx = x - cx * CHUNK_SIZE;
        const lz = z - cz * CHUNK_SIZE;
        if (cachedChunk && cachedMask) {
          if (cachedMask[this.getSubCellIndex(lx, y, lz)] !== 0) {
            const deltaVal = this.deltaSpatialHash.get(hashBlockCoords3D(x, y, z));
            block =
              deltaVal !== undefined
                ? deltaVal
                : cachedChunk[(y * CHUNK_SIZE + lz) * CHUNK_SIZE + lx];
          }
        } else {
          block = this.getBlock(x, y, z);
        }
      }

      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          blockPosition: [x, y, z],
          neighborPosition: [x + normal[0], y + normal[1], z + normal[2]],
          normal,
          blockType: block,
          distance,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normal = [-stepX, 0, 0];
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          normal = [0, -stepY, 0];
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = [0, 0, -stepZ];
        }
      }
    }

    return null;
  }

  // Update highlight box position
  public updateHighlight(hit: RaycastHit | null): void {
    if (hit) {
      this.highlightMesh.position.set(
        hit.blockPosition[0] + 0.5,
        hit.blockPosition[1] + 0.5,
        hit.blockPosition[2] + 0.5
      );
      this.highlightMesh.visible = true;
    } else {
      this.highlightMesh.visible = false;
    }
  }

  // Dispose all meshes and spatial hashes
  public dispose(): void {
    for (const group of this.chunkMeshes.values()) {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      this.scene.remove(group);
    }
    this.chunkMeshes.clear();
    this.chunks.clear();
    this.chunkHashMap.clear();
    this.subCellSolidMask.clear();
    this.deltaSpatialHash.clear();
    this.unloadedBlockHash.clear();
    this.entityHash.clear();
    this.scene.remove(this.highlightMesh);
    this.highlightMesh.geometry.dispose();
  }
}
