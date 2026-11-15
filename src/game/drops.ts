import * as THREE from 'three';
import { BlockType } from './types';
import { BLOCK_DEFS, textureManager } from './textures';
import { soundFX } from './audio';
import type { VoxelWorld, WorldEntity } from './world';

export interface DroppedItemEntity {
  id: string;
  mesh: THREE.Mesh;
  blockType: BlockType;
  count: number;
  velocity: THREE.Vector3;
  baseY: number;
  bobTime: number;
  age: number;
  isMagnetized: boolean;
  spatialHandle?: WorldEntity<DroppedItemEntity>;
}

export function getDropForBlock(blockType: BlockType): { dropType: BlockType; count: number; name: string } {
  switch (blockType) {
    case BlockType.STONE:
      return { dropType: BlockType.COBBLESTONE, count: 1, name: 'Cobblestone' };
    case BlockType.GRASS:
      return { dropType: BlockType.DIRT, count: 1, name: 'Dirt' };
    case BlockType.COAL_ORE:
      return { dropType: BlockType.TORCH, count: 2, name: 'Torches' };
    case BlockType.DIAMOND_ORE:
      return { dropType: BlockType.DIAMOND_BLOCK, count: 1, name: 'Diamond Gem' };
    case BlockType.GOLD_ORE:
      return { dropType: BlockType.GOLD_BLOCK, count: 1, name: 'Raw Gold' };
    case BlockType.IRON_ORE:
      return { dropType: BlockType.IRON_ORE, count: 1, name: 'Iron Ore' };
    case BlockType.LEAVES_OAK:
    case BlockType.LEAVES_CHERRY:
      return { dropType: BlockType.TORCH, count: 1, name: 'Stick & Sapling' };
    default:
      return { dropType: blockType, count: 1, name: BLOCK_DEFS[blockType]?.name || 'Block' };
  }
}

export class DroppedItemManager {
  public scene: THREE.Scene;
  public world?: VoxelWorld;
  public items: DroppedItemEntity[] = [];
  public onCollect?: (blockType: BlockType, count: number, name: string) => void;

  private itemGeometry: THREE.BoxGeometry;
  private idCounter = 1;
  private readonly tmpTarget = new THREE.Vector3();
  private readonly magnetQueryBuf: WorldEntity[] = [];
  private readonly magnetizedIds: Set<string> = new Set();

  constructor(scene: THREE.Scene, world?: VoxelWorld) {
    this.scene = scene;
    this.world = world;
    // Miniature 3D floating block
    this.itemGeometry = new THREE.BoxGeometry(0.26, 0.26, 0.26);
  }

  public spawnDrop(x: number, y: number, z: number, blockType: BlockType): void {
    if (blockType === BlockType.AIR || blockType === BlockType.BEDROCK) return;

    const { dropType, count } = getDropForBlock(blockType);
    const mat = textureManager.getBlockMaterials(dropType);

    const mesh = new THREE.Mesh(this.itemGeometry, mat);
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.castShadow = true;

    this.scene.add(mesh);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 1.8,
      2.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 1.8
    );

    const id = `drop-${this.idCounter++}`;
    const entity: DroppedItemEntity = {
      id,
      mesh,
      blockType: dropType,
      count,
      velocity: vel,
      baseY: y + 0.25,
      bobTime: Math.random() * 10,
      age: 0,
      isMagnetized: false,
    };

    if (this.world) {
      const handle: WorldEntity<DroppedItemEntity> = {
        id,
        kind: 'drop',
        position: mesh.position,
        radius: 0.26,
        data: entity,
      };
      entity.spatialHandle = handle;
      this.world.registerEntity(handle);
    }

    this.items.push(entity);
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    const clampedDelta = Math.min(delta, 0.08);
    if (this.items.length === 0) return;

    // Query nearby drops via VoxelWorld's 3D Spatial Hash for magnetic pickup in O(k)
    this.magnetizedIds.clear();
    if (this.world) {
      const nearby = this.world.queryEntitiesInRadius(
        playerPos.x,
        playerPos.y + 0.6,
        playerPos.z,
        3.1,
        'drop',
        this.magnetQueryBuf
      );
      for (let j = 0; j < nearby.length; j++) {
        this.magnetizedIds.add(nearby[j].id);
      }
    }

    this.tmpTarget.set(playerPos.x, playerPos.y + 0.8, playerPos.z);

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.age += clampedDelta;
      item.bobTime += clampedDelta * 3.5;

      const inMagnetRange = this.world
        ? this.magnetizedIds.has(item.id)
        : item.mesh.position.distanceToSquared(playerPos) < 2.8 * 2.8;

      if (inMagnetRange) {
        const distSq = item.mesh.position.distanceToSquared(playerPos);
        if (distSq < 2.8 * 2.8 || item.isMagnetized) {
          item.isMagnetized = true;
          item.mesh.position.lerp(this.tmpTarget, clampedDelta * 7.5);
          if (item.spatialHandle && this.world) {
            this.world.updateEntitySpatial(item.spatialHandle);
          }

          if (distSq < 0.75 * 0.75) {
            soundFX.playPop();
            const def = BLOCK_DEFS[item.blockType];
            this.onCollect?.(item.blockType, item.count, def?.name || 'Item');

            if (item.spatialHandle && this.world) {
              this.world.unregisterEntity(item.id);
            }
            this.scene.remove(item.mesh);
            this.items.splice(i, 1);
            continue;
          }
        }
      } else {
        // Normal physics & bobbing
        if (item.velocity.y > 0 || item.mesh.position.y > item.baseY) {
          item.velocity.y -= 14 * clampedDelta;
          item.mesh.position.addScaledVector(item.velocity, clampedDelta);
          if (item.mesh.position.y <= item.baseY) {
            item.mesh.position.y = item.baseY;
            item.velocity.set(0, 0, 0);
          }
          if (item.spatialHandle && this.world) {
            this.world.updateEntitySpatial(item.spatialHandle);
          }
        } else {
          item.mesh.position.y = item.baseY + Math.sin(item.bobTime) * 0.08;
        }
      }

      // Continuous 3D rotation
      item.mesh.rotation.y += 2.2 * clampedDelta;
      item.mesh.rotation.x = Math.sin(item.bobTime * 0.7) * 0.15;

      // Despawn after 120s
      if (item.age > 120) {
        if (item.spatialHandle && this.world) {
          this.world.unregisterEntity(item.id);
        }
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
      }
    }
  }

  public clearAll(): void {
    for (const item of this.items) {
      if (item.spatialHandle && this.world) {
        this.world.unregisterEntity(item.id);
      }
      this.scene.remove(item.mesh);
    }
    this.items = [];
  }

  public dispose(): void {
    this.clearAll();
    this.itemGeometry.dispose();
  }
}
