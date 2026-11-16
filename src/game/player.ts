import * as THREE from 'three';
import { VoxelWorld } from './world';
import { BlockType, RaycastHit } from './types';
import { soundFX } from './audio';
import { BLOCK_DEFS, textureManager } from './textures';
import { WORLD_HALF_SIZE } from './terrain';
import { getSkinMaterials } from './skins';
import { WeaponId, createWeapon3DMesh } from './weapons';
import { EmoteId, EMOTE_BY_ID, computeEmotePose } from './emotes';
import { PotionId } from './progression';

// Shared geometry & cached materials for zero-GC mining debris particles
const SHARED_PARTICLE_GEO = new THREE.BoxGeometry(0.11, 0.11, 0.11);
const PARTICLE_MAT_CACHE = new Map<BlockType, THREE.MeshBasicMaterial>();
function getParticleMaterial(blockType: BlockType): THREE.MeshBasicMaterial {
  let mat = PARTICLE_MAT_CACHE.get(blockType);
  if (!mat) {
    const def = BLOCK_DEFS[blockType];
    mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(def?.iconColor || '#888888') });
    PARTICLE_MAT_CACHE.set(blockType, mat);
  }
  return mat;
}

export type CameraViewMode = 'first' | 'third_back' | 'third_front' | 'top_view';

export class Player {
  public camera: THREE.PerspectiveCamera;
  public world: VoxelWorld;
  public scene: THREE.Scene;

  // Position & Velocity
  public position: THREE.Vector3 = new THREE.Vector3(0, 16, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // Input states
  public keys: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
    sprint: false,
  };

  // Continuous analog movement vector from touch joystick / swipe (-1 to +1)
  public analogMove: { x: number; y: number } = { x: 0, y: 0 };
  public autoJump: boolean = true;
  public lookSensitivity: number = 1.0;

  // State flags
  public isGrounded: boolean = false;
  public isFlying: boolean = false;
  public isInWater: boolean = false;
  public isSneaking: boolean = false;
  public isSprinting: boolean = false;
  public isSwinging: boolean = false;

  // Camera mode
  public cameraMode: CameraViewMode = 'first';

  // Player Health & Regeneration (20 HP = 10 hearts)
  public health: number = 20;
  public maxHealth: number = 20;
  public damageTilt: number = 0;
  private lastDamageTime: number = 0;
  private regenTimer: number = 0;
  private hazardDamageTimer: number = 0;
  private tmpEyeVec = new THREE.Vector3();
  private tmpLookVec = new THREE.Vector3();
  private tmpDirVec = new THREE.Vector3();
  public spawnCenter: { x: number; z: number } = { x: 0, z: 0 };

  // Health & gameplay event callbacks
  public onHealthChange?: (health: number, maxHealth: number) => void;
  public onDamage?: (damage: number) => void;
  public onDeath?: () => void;
  public onBlockBreak?: (bx: number, by: number, bz: number, oldBlock: BlockType) => void;
  public onFallSaved?: () => void;
  public onArmorHit?: (damage: number) => void;
  public onToolBreakTick?: (block: BlockType) => void;
  public onHungerChange?: (hunger: number, maxHunger: number) => void;
  public onXpChange?: (xp: number, level: number, xpToNextLevel: number) => void;

  // Hunger & Experience System
  public hunger: number = 20;
  public maxHunger: number = 20;
  private hungerDrainTimer: number = 0;
  private hungerStarveTimer: number = 0;
  public xp: number = 0;
  public xpLevel: number = 1;
  public xpToNextLevel: number = 100;
  private swimArmPhase: number = 0;

  // Emotes, Gear, Potions & Utility modes
  public activeEmote: { id: EmoteId; startedAt: number; duration: number } | null = null;
  public toolSpeedMultiplier: number = 1.15;
  public efficiencyLevel: number = 0;
  public armorReduction: number = 0;
  public isHoeMode: boolean = false;
  public activePotions: Partial<Record<PotionId, number>> = {};
  private potionRegenTimer: number = 0;
  private maxFallSpeedBeforeWater: number = 0;

  // Hotbar active slot & block
  public hotbar: BlockType[] = [
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.PLANKS_OAK,
    BlockType.COBBLESTONE,
    BlockType.BRICK,
    BlockType.GLASS,
    BlockType.WOOD_OAK,
    BlockType.TORCH,
  ];
  public selectedSlot: number = 0;

  // Breaking progress
  public isBreaking: boolean = false;
  public breakProgress: number = 0; // 0.0 to 1.0
  public currentTarget: RaycastHit | null = null;

  public currentSkin: string = 'steve';
  public equippedWeapon: WeaponId = 'hand';

  // Hand & Held Item Group in 1st Person
  public handGroup: THREE.Group;
  public armMesh: THREE.Mesh;
  public sleeveMesh: THREE.Mesh;
  public heldBlockMesh: THREE.Mesh;
  public fpWeaponMount: THREE.Group;
  private handSwingTime: number = 0;

  // 3rd Person Character Model
  public thirdPersonGroup: THREE.Group;
  public tpHead: THREE.Group;
  public tpBody: THREE.Mesh;
  public tpLeftArm: THREE.Group;
  public tpRightArm: THREE.Group;
  public tpLeftLeg: THREE.Group;
  public tpRightLeg: THREE.Group;
  public tpHeldItemMesh: THREE.Mesh;
  public tpWeaponMount: THREE.Group;
  private walkCycleTime: number = 0;

  // Voxel Break & Critical Hit Particles
  public particleGroup: THREE.Group;
  private activeParticles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];
  private critParticles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];

  // Dynamic 3D Viewmodel & Animation dynamics
  private walkBobPhase: number = 0;
  private landingBob: number = 0;
  private wasGrounded: boolean = true;
  public isEating: boolean = false;
  public eatingTime: number = 0;

  // Footstep accumulator
  private stepDistance: number = 0;

  // AABB dimensions
  public radius = 0.3; // 0.6 total width/depth
  public height = 1.8;
  public eyeHeight = 1.62;

  // Double space tap detection for flying
  private lastJumpPressTime: number = 0;

  constructor(camera: THREE.PerspectiveCamera, world: VoxelWorld, scene: THREE.Scene) {
    this.camera = camera;
    this.world = world;
    this.scene = scene;

    const { def, skinMat, hairMat, shirtMat, pantsMat, shoesMat, eyeMat, pupilMat } = getSkinMaterials(this.currentSkin);

    // 1. Build first-person hand & sleeve
    this.handGroup = new THREE.Group();
    
    // Forearm / hand (bare skin)
    const armGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
    this.armMesh = new THREE.Mesh(armGeo, skinMat);
    this.armMesh.position.set(0.35, -0.4, -0.55);
    this.armMesh.rotation.set(-0.3, 0.1, 0.15);
    this.handGroup.add(this.armMesh);

    // Shirt sleeve
    const sleeveGeo = new THREE.BoxGeometry(0.22, 0.24, 0.22);
    this.sleeveMesh = new THREE.Mesh(sleeveGeo, shirtMat);
    this.sleeveMesh.position.set(0.35, -0.22, -0.55);
    this.sleeveMesh.rotation.set(-0.3, 0.1, 0.15);
    this.handGroup.add(this.sleeveMesh);

    // Held Block Preview in 1st Person
    const blockGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const blockMat = textureManager.getBlockMaterials(this.hotbar[0]);
    this.heldBlockMesh = new THREE.Mesh(blockGeo, blockMat);
    this.heldBlockMesh.position.set(0.28, -0.28, -0.55);
    this.handGroup.add(this.heldBlockMesh);

    // Held Weapon Mount in 1st Person
    this.fpWeaponMount = new THREE.Group();
    this.fpWeaponMount.position.set(0.32, -0.26, -0.58);
    this.fpWeaponMount.rotation.set(-0.65, 0.25, -0.15);
    this.fpWeaponMount.visible = false;
    this.handGroup.add(this.fpWeaponMount);

    this.camera.add(this.handGroup);
    this.scene.add(this.camera);

    // 2. Build 3rd Person Full Character Model (Steve/Alex/Noor/Sunny/Ari/Zuri/Efe/Kai/Makena)
    this.thirdPersonGroup = new THREE.Group();
    this.thirdPersonGroup.visible = false;

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.tpBody = new THREE.Mesh(torsoGeo, shirtMat);
    this.tpBody.position.set(0, 1.075, 0);
    this.thirdPersonGroup.add(this.tpBody);

    // Head
    this.tpHead = new THREE.Group();
    this.tpHead.position.set(0, 1.45, 0);
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), skinMat);
    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), hairMat);
    hairMesh.position.set(0, 0.16, 0);

    const eyeGeo = new THREE.PlaneGeometry(0.08, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 0.02, -0.245);
    leftEye.rotation.y = Math.PI;
    const leftPupil = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), pupilMat);
    leftPupil.position.set(-0.1, 0.02, -0.246);
    leftPupil.rotation.y = Math.PI;

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 0.02, -0.245);
    rightEye.rotation.y = Math.PI;
    const rightPupil = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), pupilMat);
    rightPupil.position.set(0.14, 0.02, -0.246);
    rightPupil.rotation.y = Math.PI;

    this.tpHead.add(headMesh, hairMesh, leftEye, leftPupil, rightEye, rightPupil);
    this.thirdPersonGroup.add(this.tpHead);

    // Arms
    const armW = def.isSlim ? 0.19 : 0.23;
    const tpArmGeo = new THREE.BoxGeometry(armW, 0.72, 0.22);

    this.tpLeftArm = new THREE.Group();
    this.tpLeftArm.position.set(-(0.25 + armW / 2), 1.4, 0);
    const tpLeftMesh = new THREE.Mesh(tpArmGeo, shirtMat);
    tpLeftMesh.position.set(0, -0.32, 0);
    this.tpLeftArm.add(tpLeftMesh);
    this.thirdPersonGroup.add(this.tpLeftArm);

    this.tpRightArm = new THREE.Group();
    this.tpRightArm.position.set(0.25 + armW / 2, 1.4, 0);
    const tpRightMesh = new THREE.Mesh(tpArmGeo, shirtMat);
    tpRightMesh.position.set(0, -0.32, 0);
    this.tpRightArm.add(tpRightMesh);

    // 3rd Person Held Block in right hand
    this.tpHeldItemMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), blockMat);
    this.tpHeldItemMesh.position.set(0, -0.62, -0.16);
    this.tpRightArm.add(this.tpHeldItemMesh);

    // 3rd Person Held Weapon Mount in right hand
    this.tpWeaponMount = new THREE.Group();
    this.tpWeaponMount.position.set(0, -0.64, -0.18);
    this.tpWeaponMount.rotation.set(-Math.PI / 2.2, 0, 0);
    this.tpWeaponMount.visible = false;
    this.tpRightArm.add(this.tpWeaponMount);

    this.thirdPersonGroup.add(this.tpRightArm);

    // Legs
    const tpLegGeo = new THREE.BoxGeometry(0.24, 0.52, 0.24);
    const tpShoeGeo = new THREE.BoxGeometry(0.245, 0.2, 0.245);

    this.tpLeftLeg = new THREE.Group();
    this.tpLeftLeg.position.set(-0.13, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(tpLegGeo, pantsMat);
    leftLegMesh.position.set(0, -0.26, 0);
    const leftShoeMesh = new THREE.Mesh(tpShoeGeo, shoesMat);
    leftShoeMesh.position.set(0, -0.62, 0);
    this.tpLeftLeg.add(leftLegMesh, leftShoeMesh);
    this.thirdPersonGroup.add(this.tpLeftLeg);

    this.tpRightLeg = new THREE.Group();
    this.tpRightLeg.position.set(0.13, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(tpLegGeo, pantsMat);
    rightLegMesh.position.set(0, -0.26, 0);
    const rightShoeMesh = new THREE.Mesh(tpShoeGeo, shoesMat);
    rightShoeMesh.position.set(0, -0.62, 0);
    this.tpRightLeg.add(rightLegMesh, rightShoeMesh);
    this.thirdPersonGroup.add(this.tpRightLeg);

    this.scene.add(this.thirdPersonGroup);

    // Particle debris group
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Spawn on solid ground
    this.findSpawnPosition();
  }

  // Switch player skin to any of the 9 official Minecraft default skins
  public setSkin(skinId: string): void {
    this.currentSkin = skinId;
    const { skinMat, hairMat, shirtMat, pantsMat, shoesMat, pupilMat } = getSkinMaterials(skinId);

    // 1st Person
    this.armMesh.material = skinMat;
    this.sleeveMesh.material = shirtMat;

    // 3rd Person
    this.tpBody.material = shirtMat;
    this.tpHead.children.forEach((c) => {
      if (c instanceof THREE.Mesh) {
        if (c.geometry instanceof THREE.BoxGeometry && c.geometry.parameters.height === 0.2) {
          c.material = hairMat;
        } else if (c.geometry instanceof THREE.BoxGeometry) {
          c.material = skinMat;
        }
      }
    });
    this.tpLeftArm.children.forEach(c => { if (c instanceof THREE.Mesh) c.material = shirtMat; });
    this.tpRightArm.children.forEach(c => { if (c instanceof THREE.Mesh && c !== this.tpHeldItemMesh) c.material = shirtMat; });
  }

  // Find clear surface at assigned regional sector plaza (or origin)
  public setSpawnSector(cx: number, cz: number, teleportNow = false): void {
    this.spawnCenter = { x: cx, z: cz };
    if (teleportNow) {
      this.findSpawnPosition();
    }
  }

  public findSpawnPosition(): void {
    const sx = this.spawnCenter.x;
    const sz = this.spawnCenter.z;
    const groundY = this.world.terrain.getHeight(sx, sz);
    this.position.set(sx + 0.5, groundY + 1.1, sz + 0.5);
    this.velocity.set(0, 0, 0);
  }

  public getSelectedBlock(): BlockType {
    return this.hotbar[this.selectedSlot] ?? BlockType.GRASS;
  }

  public updateHeldBlockMesh(): void {
    const block = this.getSelectedBlock();
    const mat = textureManager.getBlockMaterials(block);
    this.heldBlockMesh.material = mat;
    if (this.tpHeldItemMesh) {
      this.tpHeldItemMesh.material = mat;
    }
  }

  public setWeapon(weaponId: WeaponId): void {
    this.equippedWeapon = weaponId;
    const disposeMount = (mount: THREE.Group) => {
      while (mount.children.length > 0) {
        const child = mount.children[0];
        child.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
            else o.material.dispose();
          }
        });
        mount.remove(child);
      }
    };

    disposeMount(this.fpWeaponMount);
    disposeMount(this.tpWeaponMount);

    if (weaponId === 'hand') {
      this.fpWeaponMount.visible = false;
      this.tpWeaponMount.visible = false;
      this.heldBlockMesh.visible = true;
      this.tpHeldItemMesh.visible = true;
    } else {
      const fpMesh = createWeapon3DMesh(weaponId);
      const tpMesh = createWeapon3DMesh(weaponId);
      this.fpWeaponMount.add(fpMesh);
      this.tpWeaponMount.add(tpMesh);
      this.fpWeaponMount.visible = true;
      this.tpWeaponMount.visible = true;
      this.heldBlockMesh.visible = false;
      this.tpHeldItemMesh.visible = false;
    }
  }

  public handleMouseMove(movementX: number, movementY: number): void {
    const sensitivity = 0.0022;
    this.rotation.y -= movementX * sensitivity;
    this.rotation.x -= movementY * sensitivity;
    // Clamp pitch between -89 and +89 degrees
    this.rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.rotation.x));
  }

  // Smooth look/turning delta for virtual joysticks and touch pan
  public handleLookDelta(deltaYaw: number, deltaPitch: number): void {
    const sens = this.lookSensitivity || 1.0;
    this.rotation.y -= deltaYaw * sens;
    this.rotation.x -= deltaPitch * sens;
    this.rotation.x = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.rotation.x));
  }

  public handleJumpPress(): void {
    const now = performance.now();
    if (now - this.lastJumpPressTime < 320) {
      // Double tap space: toggle flight!
      this.isFlying = !this.isFlying;
      this.velocity.y = 0;
      soundFX.playPop();
    }
    this.lastJumpPressTime = now;
  }

  public playEmote(id: EmoteId): void {
    const def = EMOTE_BY_ID[id];
    if (!def) return;
    this.activeEmote = {
      id,
      startedAt: performance.now(),
      duration: def.duration,
    };
    soundFX.playPop();
  }

  public applyPotion(id: PotionId, durationSec: number): void {
    this.activePotions[id] = durationSec;
    soundFX.playRegen();
  }

  public takeDamage(amount: number): void {
    if (amount <= 0 || this.health <= 0) return;
    const mitigated = Math.max(1, Math.round(amount * (1 - this.armorReduction)));
    if (this.armorReduction > 0) {
      this.onArmorHit?.(amount);
    }
    this.health = Math.max(0, this.health - mitigated);
    this.lastDamageTime = performance.now();
    this.damageTilt = (Math.random() > 0.5 ? 1 : -1) * 0.16;
    soundFX.playHurt();
    this.onDamage?.(mitigated);
    this.onHealthChange?.(this.health, this.maxHealth);

    if (this.health === 0) {
      soundFX.playDeath();
      this.onDeath?.();
    }
  }

  public heal(amount: number): void {
    if (this.health <= 0 || this.health >= this.maxHealth || amount <= 0) return;
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.health > oldHealth) {
      soundFX.playRegen();
      this.onHealthChange?.(this.health, this.maxHealth);
    }
  }

  public respawn(): void {
    this.health = this.maxHealth;
    this.findSpawnPosition();
    this.velocity.set(0, 0, 0);
    this.damageTilt = 0;
    this.onHealthChange?.(this.health, this.maxHealth);
  }

  public swingHand(): void {
    this.handSwingTime = 0.28;
    this.isSwinging = true;
  }

  // Spawn breaking particle explosion using shared pooled geometry & cached materials
  public spawnBreakParticles(x: number, y: number, z: number, blockType: BlockType): void {
    const pMat = getParticleMaterial(blockType);
    const particleCount = 8;

    while (this.activeParticles.length >= 64) {
      const oldest = this.activeParticles.shift();
      if (oldest) this.particleGroup.remove(oldest.mesh);
    }

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(SHARED_PARTICLE_GEO, pMat);
      mesh.position.set(
        x + 0.2 + Math.random() * 0.6,
        y + 0.2 + Math.random() * 0.6,
        z + 0.2 + Math.random() * 0.6
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        Math.random() * 4.0 + 1.5,
        (Math.random() - 0.5) * 4.5
      );

      this.particleGroup.add(mesh);
      this.activeParticles.push({ mesh, velocity: vel, life: 0.45 + Math.random() * 0.25 });
    }
  }

  // Trigger eating animation (hand raises to mouth with chewing motion)
  public startEating(): void {
    this.isEating = true;
    this.eatingTime = 1.2;
    soundFX.playEat();
  }

  // Restore hunger and trigger eating animation
  public eatFood(restoreAmount: number = 4): void {
    this.startEating();
    this.hunger = Math.min(this.maxHunger, this.hunger + restoreAmount);
    this.onHungerChange?.(this.hunger, this.maxHunger);
  }

  // Experience and leveling system
  public addXp(amount: number): void {
    if (amount <= 0) return;
    this.xp += amount;
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.xpLevel += 1;
      this.xpToNextLevel = Math.floor(100 * Math.pow(1.15, this.xpLevel - 1));
      soundFX.playLevelUp();
    }
    this.onXpChange?.(this.xp, this.xpLevel, this.xpToNextLevel);
  }

  // Spawn 3D critical hit starburst particles
  public spawnCriticalHitParticles(x: number, y: number, z: number): void {
    const critMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const count = 12;
    soundFX.playCrit();

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(SHARED_PARTICLE_GEO, critMat);
      mesh.position.set(x, y, z);
      const angle = (i / count) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 2.5 + 0.8,
        Math.sin(angle) * speed
      );
      this.particleGroup.add(mesh);
      this.critParticles.push({ mesh, velocity: vel, life: 0.35 + Math.random() * 0.2 });
    }
  }

  public updateParticles(delta: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= delta;
      p.velocity.y -= 18 * delta; // particle gravity
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.rotation.x += 4 * delta;
      p.mesh.rotation.y += 3 * delta;

      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        this.activeParticles.splice(i, 1);
      }
    }

    for (let i = this.critParticles.length - 1; i >= 0; i--) {
      const cp = this.critParticles[i];
      cp.life -= delta;
      cp.velocity.y -= 12 * delta;
      cp.mesh.position.addScaledVector(cp.velocity, delta);
      cp.mesh.rotation.x += 6 * delta;
      cp.mesh.rotation.z += 6 * delta;
      const scale = Math.max(0.01, cp.life * 2.5);
      cp.mesh.scale.set(scale, scale, scale);

      if (cp.life <= 0) {
        this.particleGroup.remove(cp.mesh);
        this.critParticles.splice(i, 1);
      }
    }
  }

  // AABB collision box check against voxel world (via 3D spatial hash)
  private isBoxColliding(pos: THREE.Vector3): boolean {
    return this.world.isBoxSolid(
      pos.x - this.radius,
      pos.y,
      pos.z - this.radius,
      pos.x + this.radius,
      pos.y + this.height,
      pos.z + this.radius
    );
  }

  // Check if player's head/body is in water
  private checkWater(): boolean {
    const feetBlock = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
    const waistBlock = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.8), Math.floor(this.position.z));
    return feetBlock === BlockType.WATER || waistBlock === BlockType.WATER;
  }

  // Main physics & update loop
  public update(delta: number): void {
    const clampedDelta = Math.min(delta, 0.05);

    const wasInWater = this.isInWater;
    this.isInWater = this.checkWater();

    if (!this.isInWater && this.velocity.y < -10.5) {
      this.maxFallSpeedBeforeWater = Math.min(this.maxFallSpeedBeforeWater, this.velocity.y);
    }
    if (!wasInWater && this.isInWater && this.maxFallSpeedBeforeWater < -12.0) {
      this.maxFallSpeedBeforeWater = 0;
      this.onFallSaved?.();
    }
    if (this.isGrounded) {
      this.maxFallSpeedBeforeWater = 0;
    }

    // Tick active potion timers & Regeneration effect
    for (const key of Object.keys(this.activePotions) as PotionId[]) {
      const rem = this.activePotions[key];
      if (rem !== undefined) {
        const next = rem - clampedDelta;
        if (next <= 0) delete this.activePotions[key];
        else this.activePotions[key] = next;
      }
    }
    if ((this.activePotions.regeneration ?? 0) > 0 && this.health > 0 && this.health < this.maxHealth) {
      this.potionRegenTimer += clampedDelta;
      if (this.potionRegenTimer >= 1.6) {
        this.potionRegenTimer = 0;
        this.heal(1);
      }
    } else {
      this.potionRegenTimer = 0;
    }

    // Movement speed calculations
    const analogMag = Math.hypot(this.analogMove.x, this.analogMove.y);
    const isAnalogActive = analogMag > 0.05;
    const isAutoSprinting = isAnalogActive && analogMag > 0.88 && !this.isSneaking;
    const effectiveSprint = this.isSprinting || isAutoSprinting;

    let baseSpeed = 4.3; // m/s
    if (effectiveSprint) baseSpeed *= 1.35;
    if ((this.activePotions.swiftness ?? 0) > 0) baseSpeed *= 1.38;
    if (this.isSneaking) baseSpeed *= 0.45;
    if (this.isFlying) baseSpeed *= 2.2;
    if (this.isInWater && !this.isFlying) baseSpeed *= 0.65;

    // Determine move vector in horizontal XZ plane (combines digital keys & smooth analog vector)
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(this.rotation.y), 0, -Math.cos(this.rotation.y));
    const right = new THREE.Vector3(Math.cos(this.rotation.y), 0, -Math.sin(this.rotation.y));

    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    if (isAnalogActive && moveDir.lengthSq() === 0) {
      moveDir.addScaledVector(forward, this.analogMove.y);
      moveDir.addScaledVector(right, this.analogMove.x);
      const clampedMag = Math.min(1, analogMag);
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        this.velocity.x = moveDir.x * baseSpeed * clampedMag;
        this.velocity.z = moveDir.z * baseSpeed * clampedMag;
      }
    } else if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * baseSpeed;
      this.velocity.z = moveDir.z * baseSpeed;
    } else {
      // Decelerate smoothly
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
      if (Math.abs(this.velocity.x) < 0.05) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.05) this.velocity.z = 0;
    }

    // Vertical physics
    if (this.isFlying) {
      this.velocity.y = 0;
      if (this.keys.jump) this.velocity.y = baseSpeed;
      if (this.keys.sneak) this.velocity.y = -baseSpeed;
    } else if (this.isInWater) {
      // Water buoyancy & swimming
      if (this.keys.jump) {
        this.velocity.y = 3.0;
      } else {
        this.velocity.y = Math.max(-2.0, this.velocity.y - 8.0 * clampedDelta);
      }
    } else {
      // Normal Gravity
      const gravity = 25.0;
      this.velocity.y -= gravity * clampedDelta;
      this.velocity.y = Math.max(-35.0, this.velocity.y);

      // Jump
      if (this.keys.jump && this.isGrounded) {
        this.velocity.y = 8.8;
        this.isGrounded = false;
        soundFX.playJump();
      }
    }

    // Perform Axis-Aligned Collision Detection (X, then Z, then Y)
    let blockedHorizontally = false;

    // 1. Move X
    const newPosX = this.position.clone();
    newPosX.x += this.velocity.x * clampedDelta;
    if (!this.isBoxColliding(newPosX)) {
      this.position.x = newPosX.x;
    } else {
      // Step-up check (auto step up slabs / 0.5 height)
      const stepPos = newPosX.clone();
      stepPos.y += 0.55;
      if (this.isGrounded && !this.isBoxColliding(stepPos)) {
        this.position.copy(stepPos);
      } else {
        if (Math.abs(this.velocity.x) > 0.2) blockedHorizontally = true;
        this.velocity.x = 0;
      }
    }

    // 2. Move Z
    const newPosZ = this.position.clone();
    newPosZ.z += this.velocity.z * clampedDelta;
    if (!this.isBoxColliding(newPosZ)) {
      this.position.z = newPosZ.z;
    } else {
      const stepPos = newPosZ.clone();
      stepPos.y += 0.55;
      if (this.isGrounded && !this.isBoxColliding(stepPos)) {
        this.position.copy(stepPos);
      } else {
        if (Math.abs(this.velocity.z) > 0.2) blockedHorizontally = true;
        this.velocity.z = 0;
      }
    }

    // Smooth Mobile Auto-Jump: automatically hop onto 1-block ledges when walking forward
    if (
      this.autoJump &&
      blockedHorizontally &&
      this.isGrounded &&
      !this.isFlying &&
      !this.isSneaking &&
      moveDir.lengthSq() > 0.05
    ) {
      const probePos = this.position.clone();
      probePos.x += moveDir.x * 0.45;
      probePos.z += moveDir.z * 0.45;
      probePos.y += 1.08;
      if (!this.isBoxColliding(probePos)) {
        this.velocity.y = 8.8;
        this.isGrounded = false;
        soundFX.playJump();
      }
    }

    // 3. Move Y
    const prevVelY = this.velocity.y;
    const newPosY = this.position.clone();
    newPosY.y += this.velocity.y * clampedDelta;
    if (!this.isBoxColliding(newPosY)) {
      this.position.y = newPosY.y;
      this.isGrounded = false;
    } else {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
        // Fall damage calculation if not in flight mode
        if (!this.isFlying && prevVelY < -13.5) {
          const fallSpeed = -prevVelY;
          const dmg = Math.max(1, Math.round((fallSpeed - 12.5) * 1.3));
          this.takeDamage(dmg);
        }
      }
      this.velocity.y = 0;
    }

    // Clamp inside 32,000 x 32,000 playable world borders
    const maxBound = WORLD_HALF_SIZE - 2;
    if (this.position.x > maxBound) this.position.x = maxBound;
    else if (this.position.x < -maxBound) this.position.x = -maxBound;
    if (this.position.z > maxBound) this.position.z = maxBound;
    else if (this.position.z < -maxBound) this.position.z = -maxBound;

    // Hazard damage check (Lava / Cactus)
    const feetBlock = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
    const waistBlock = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.8), Math.floor(this.position.z));

    const hasFireRes = (this.activePotions.fire_resistance ?? 0) > 0;
    if ((feetBlock === BlockType.LAVA || waistBlock === BlockType.LAVA) && !hasFireRes) {
      this.hazardDamageTimer += clampedDelta;
      if (this.hazardDamageTimer >= 0.75) {
        this.hazardDamageTimer = 0;
        this.takeDamage(3);
      }
    } else {
      this.hazardDamageTimer = Math.max(0, this.hazardDamageTimer - clampedDelta);
    }

    // Hunger Mechanics & Starvation
    const isMoving = Math.hypot(this.velocity.x, this.velocity.z) > 0.1;
    if (isMoving && !this.isFlying) {
      this.hungerDrainTimer += clampedDelta;
      const drainInterval = this.isSprinting ? 12 : 32;
      if (this.hungerDrainTimer >= drainInterval) {
        this.hungerDrainTimer = 0;
        if (this.hunger > 0) {
          this.hunger = Math.max(0, this.hunger - 1);
          this.onHungerChange?.(this.hunger, this.maxHunger);
        }
      }
    }

    if (this.hunger === 0) {
      this.hungerStarveTimer += clampedDelta;
      if (this.hungerStarveTimer >= 4.0) {
        this.hungerStarveTimer = 0;
        if (this.health > 1) {
          this.takeDamage(1);
        }
      }
    } else {
      this.hungerStarveTimer = 0;
    }

    // Natural Health Regeneration over time (requires hunger >= 16)
    if (this.health > 0 && this.health < this.maxHealth && this.hunger >= 16) {
      const timeSinceDamage = performance.now() - this.lastDamageTime;
      if (timeSinceDamage >= 3000) {
        this.regenTimer += clampedDelta;
        if (this.regenTimer >= 3.5) {
          this.regenTimer = 0;
          this.heal(1);
        }
      } else {
        this.regenTimer = 0;
      }
    } else {
      this.regenTimer = 0;
    }

    // Decay damage camera tilt smoothly
    if (Math.abs(this.damageTilt) > 0.001) {
      this.damageTilt *= Math.pow(0.04, clampedDelta);
    } else {
      this.damageTilt = 0;
    }

    // Prevent falling into void (damage and reset)
    if (this.position.y < -4) {
      this.takeDamage(4);
      if (this.position.y < -12 || this.health <= 0) {
        this.respawn();
      }
    }

    // Footsteps
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.isGrounded && horizontalSpeed > 0.5) {
      this.stepDistance += horizontalSpeed * clampedDelta;
      if (this.stepDistance > (this.isSprinting ? 1.7 : 2.2)) {
        this.stepDistance = 0;
        const groundBlock = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z));
        const soundType = BLOCK_DEFS[groundBlock]?.soundType || 'grass';
        soundFX.playStep(soundType === 'stone' ? 'stone' : soundType === 'wood' ? 'wood' : 'grass');
      }
    }

    // Landing spring bounce dynamics
    if (!this.wasGrounded && this.isGrounded) {
      this.landingBob = Math.min(0.065, Math.abs(this.velocity.y) * 0.008);
    }
    this.wasGrounded = this.isGrounded;
    if (this.landingBob > 0.0005) {
      this.landingBob *= Math.pow(0.04, clampedDelta);
    } else {
      this.landingBob = 0;
    }

    // Dynamic 3D Viewmodel Walk & Sprint Bobbing
    const idleBob = Math.sin(performance.now() * 0.003) * 0.015;
    if (this.isGrounded && horizontalSpeed > 0.3) {
      this.walkBobPhase += clampedDelta * (this.isSprinting ? 12.5 : 8.5);
      const bobX = Math.cos(this.walkBobPhase * 0.5) * (this.isSprinting ? 0.024 : 0.014);
      const bobY = Math.abs(Math.sin(this.walkBobPhase)) * (this.isSprinting ? 0.028 : 0.018);
      this.handGroup.position.x = bobX;
      this.handGroup.position.y = idleBob - bobY - this.landingBob;
    } else {
      this.walkBobPhase = 0;
      this.handGroup.position.x = 0;
      this.handGroup.position.y = idleBob - this.landingBob;
    }

    // Eating Food Motion
    if (this.eatingTime > 0) {
      this.eatingTime -= clampedDelta;
      const chew = Math.sin(performance.now() * 0.035) * 0.015;
      this.handGroup.position.x = -0.06 + chew;
      this.handGroup.position.y = 0.1 + chew;
      this.handGroup.position.z = -0.12;
      this.heldBlockMesh.rotation.x = 0.6;
      if (this.eatingTime <= 0) {
        this.isEating = false;
        this.handGroup.position.set(0, 0, 0);
        this.heldBlockMesh.rotation.set(0, 0, 0);
      }
    }

    // Authentic Sweeping Slash / Mining Arc Animation
    if (this.handSwingTime > 0) {
      this.handSwingTime -= clampedDelta;
      const t = 1 - (this.handSwingTime / 0.28);
      const sinT = Math.sin(t * Math.PI);
      // Multi-axis slash curve: pitch down + yaw swipe + roll tilt + forward thrust
      this.handGroup.rotation.x = sinT * 0.82;
      this.handGroup.rotation.y = -sinT * 0.42;
      this.handGroup.rotation.z = -sinT * 0.32;
      this.handGroup.position.z = -sinT * 0.08;
      this.heldBlockMesh.rotation.x = sinT * 1.35;
      this.fpWeaponMount.rotation.x = -0.65 + sinT * 1.45;
      this.fpWeaponMount.rotation.z = -0.15 - sinT * 0.65;
    } else if (this.eatingTime <= 0) {
      this.handGroup.rotation.set(0, 0, 0);
      this.handGroup.position.z = 0;
      this.heldBlockMesh.rotation.set(0, 0, 0);
      this.fpWeaponMount.rotation.set(-0.65, 0.25, -0.15);
      this.isSwinging = false;
    }

    // Dynamic FOV punch during sprint (only update projection matrix when FOV changes noticeably)
    const targetFov = this.isSprinting && horizontalSpeed > 1 ? 82 : 75;
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 10, clampedDelta);
    if (Math.abs(nextFov - this.camera.fov) > 0.04) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }

    // Position Camera according to CameraMode
    this.updateCameraTransform();

    // Raycast target block
    this.updateTarget();

    // Handle ongoing block breaking
    this.updateBreaking(clampedDelta);

    // Update active particle debris
    this.updateParticles(clampedDelta);
  }

  // Camera placement based on 1st, 3rd person, or Top View
  private updateCameraTransform(): void {
    const eyePos = this.tmpEyeVec.copy(this.position);
    eyePos.y += this.isSneaking ? this.eyeHeight - 0.2 : this.eyeHeight;

    // Resolve active emote pose if running
    let emotePose: ReturnType<typeof computeEmotePose> | null = null;
    if (this.activeEmote) {
      const elapsed = (performance.now() - this.activeEmote.startedAt) / 1000;
      if (elapsed >= this.activeEmote.duration) {
        this.activeEmote = null;
      } else {
        emotePose = computeEmotePose(this.activeEmote.id, elapsed, this.activeEmote.duration);
      }
    }

    if (this.cameraMode === 'first') {
      this.camera.position.copy(eyePos);
      this.camera.rotation.copy(this.rotation);
      this.camera.rotation.z += this.damageTilt;
      if (emotePose) {
        this.handGroup.rotation.x += emotePose.rightArmX * 0.35;
        this.handGroup.rotation.z += emotePose.rightArmZ * 0.45;
        this.handGroup.position.y += emotePose.rootOffsetY * 0.35;
      }
      this.handGroup.visible = true;
      this.thirdPersonGroup.visible = false;
    } else {
      this.handGroup.visible = false;
      this.thirdPersonGroup.visible = true;
      this.thirdPersonGroup.position.copy(this.position);

      if (emotePose) {
        this.thirdPersonGroup.position.y += emotePose.rootOffsetY;
        this.thirdPersonGroup.rotation.x = emotePose.rootRotX;
        this.thirdPersonGroup.rotation.y = this.rotation.y + emotePose.rootRotY;
        this.thirdPersonGroup.rotation.z = emotePose.rootRotZ;
        this.tpHead.rotation.x = this.rotation.x + emotePose.headRotX;
        this.tpHead.rotation.y = emotePose.headRotY;
        this.tpLeftArm.rotation.x = emotePose.leftArmX;
        this.tpLeftArm.rotation.z = emotePose.leftArmZ;
        this.tpRightArm.rotation.x = emotePose.rightArmX;
        this.tpRightArm.rotation.z = emotePose.rightArmZ;
        this.tpLeftLeg.rotation.x = emotePose.leftLegX;
        this.tpRightLeg.rotation.x = emotePose.rightLegX;
      } else {
        this.thirdPersonGroup.rotation.set(0, this.rotation.y, 0);
        this.tpHead.rotation.x = this.rotation.x;
        this.tpHead.rotation.y = 0;
        this.tpLeftArm.rotation.z = 0;
        this.tpRightArm.rotation.z = 0;

        // Walk & Swimming cycle animation in 3rd person & top view
        const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (this.isInWater) {
          const swimTime = performance.now() * 0.008;
          this.thirdPersonGroup.rotation.x = 0.4;
          const paddle = Math.sin(swimTime) * 0.8;
          const kick = Math.cos(swimTime) * 0.5;
          this.tpLeftArm.rotation.x = paddle;
          this.tpRightArm.rotation.x = -paddle;
          this.tpLeftLeg.rotation.x = kick;
          this.tpRightLeg.rotation.x = -kick;
        } else {
          this.thirdPersonGroup.rotation.x = 0;
          if (horizontalSpeed > 0.1 && this.isGrounded) {
            this.walkCycleTime += 0.08 * (this.isSprinting ? 1.4 : 1.0);
            const swing = Math.sin(this.walkCycleTime * 10) * 0.65;
            this.tpLeftLeg.rotation.x = swing;
            this.tpRightLeg.rotation.x = -swing;
            this.tpLeftArm.rotation.x = -swing;
            this.tpRightArm.rotation.x = swing;
          } else {
            this.tpLeftLeg.rotation.x *= 0.8;
            this.tpRightLeg.rotation.x *= 0.8;
            this.tpLeftArm.rotation.x *= 0.8;
            this.tpRightArm.rotation.x *= 0.8;
          }
        }

        if (this.isSwinging) {
          this.tpRightArm.rotation.x = -1.1 + Math.sin(performance.now() * 0.02) * 0.5;
        }
      }

      if (this.cameraMode === 'top_view') {
        // Elevated smooth Top-Down Tactical View aligned with player facing yaw
        const sinY = Math.sin(this.rotation.y);
        const cosY = Math.cos(this.rotation.y);
        this.camera.position.set(
          this.position.x + sinY * 4.8,
          this.position.y + 13.5,
          this.position.z + cosY * 4.8
        );
        this.camera.lookAt(
          this.position.x - sinY * 1.4,
          this.position.y + 0.8,
          this.position.z - cosY * 1.4
        );
      } else if (this.cameraMode === 'third_back') {
        const backDist = 3.8;
        this.tmpDirVec.set(
          Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
          -Math.sin(this.rotation.x),
          Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
        );
        this.camera.position.copy(eyePos).addScaledVector(this.tmpDirVec, backDist);
        this.camera.lookAt(eyePos);
      } else {
        // 3rd person front
        const frontDist = 3.4;
        this.tmpDirVec.set(
          -Math.sin(this.rotation.y) * Math.cos(this.rotation.x),
          Math.sin(this.rotation.x),
          -Math.cos(this.rotation.y) * Math.cos(this.rotation.x)
        );
        this.camera.position.copy(eyePos).addScaledVector(this.tmpDirVec, frontDist);
        this.camera.lookAt(eyePos);
      }
    }
  }

  // Raycast from camera center to find targeted block
  private updateTarget(): void {
    const eyePos = this.tmpEyeVec.copy(this.position);
    eyePos.y += this.eyeHeight;

    const lookDir = this.tmpLookVec.set(0, 0, -1);
    lookDir.applyEuler(this.rotation);

    this.currentTarget = this.world.raycast(eyePos, lookDir, 6.0);
    this.world.updateHighlight(this.currentTarget);
  }

  // Handle continuous block break progress when left mouse button is held
  private updateBreaking(delta: number): void {
    if (!this.isBreaking || !this.currentTarget) {
      this.breakProgress = 0;
      return;
    }

    const hit = this.currentTarget;
    const def = BLOCK_DEFS[hit.blockType];
    const hardness = def?.hardness ?? 0.5;

    // Hardness 999 is unbreakable (Bedrock / fluids)
    if (hardness >= 900) {
      this.breakProgress = 0;
      return;
    }

    this.swingHand();

    // Advance break progress with tool tier speed, Efficiency enchant, & Hoe fast-clear
    let speedMult = this.toolSpeedMultiplier * (1 + 0.22 * this.efficiencyLevel);
    if (this.isHoeMode && def?.isFastHoeClear) {
      speedMult *= 4.0;
    }
    this.breakProgress += (delta * speedMult) / hardness;

    // Play periodic crack ticks
    if (Math.random() < 0.18) {
      soundFX.playBreak(def?.soundType || 'stone');
    }

    if (this.breakProgress >= 1.0) {
      // Block broken!
      this.breakBlock(hit);
      this.breakProgress = 0;
    }
  }

  public breakBlock(hit: RaycastHit): void {
    const [bx, by, bz] = hit.blockPosition;
    const oldBlock = hit.blockType;

    this.world.setBlock(bx, by, bz, BlockType.AIR);
    soundFX.playBreak(BLOCK_DEFS[oldBlock]?.soundType || 'stone');
    this.spawnBreakParticles(bx, by, bz, oldBlock);
    this.onToolBreakTick?.(oldBlock);
    this.onBlockBreak?.(bx, by, bz, oldBlock);
  }

  public placeBlock(): boolean {
    if (!this.currentTarget) return false;

    const [nx, ny, nz] = this.currentTarget.neighborPosition;
    const blockToPlace = this.getSelectedBlock();
    if (blockToPlace === BlockType.AIR) return false;

    // Check if placing block inside player's own bounding box!
    const minX = this.position.x - this.radius;
    const maxX = this.position.x + this.radius;
    const minY = this.position.y;
    const maxY = this.position.y + this.height;
    const minZ = this.position.z - this.radius;
    const maxZ = this.position.z + this.radius;

    const blockMinX = nx;
    const blockMaxX = nx + 1;
    const blockMinY = ny;
    const blockMaxY = ny + 1;
    const blockMinZ = nz;
    const blockMaxZ = nz + 1;

    // AABB intersection test
    const intersectsPlayer = (
      minX < blockMaxX && maxX > blockMinX &&
      minY < blockMaxY && maxY > blockMinY &&
      minZ < blockMaxZ && maxZ > blockMinZ
    );

    if (intersectsPlayer) {
      return false; // Can't suffocate inside block
    }

    this.world.setBlock(nx, ny, nz, blockToPlace);
    soundFX.playPlace(BLOCK_DEFS[blockToPlace]?.soundType || 'stone');
    this.swingHand();
    return true;
  }

  // Easy building helper: Scaffold / Pillar Up (places block under feet and lifts player)
  public towerUp(): boolean {
    const blockToPlace = this.getSelectedBlock();
    if (blockToPlace === BlockType.AIR) return false;

    const bx = Math.floor(this.position.x);
    const by = Math.floor(this.position.y);
    const bz = Math.floor(this.position.z);

    this.world.setBlock(bx, by, bz, blockToPlace);
    this.position.y = by + 1.05;
    this.velocity.y = 2.0;
    soundFX.playPlace(BLOCK_DEFS[blockToPlace]?.soundType || 'stone');
    this.swingHand();
    return true;
  }

  // Easy building helper: Bridge Forward (places block in front at ground level)
  public bridgeForward(): boolean {
    const blockToPlace = this.getSelectedBlock();
    if (blockToPlace === BlockType.AIR) return false;

    const dirX = -Math.sin(this.rotation.y);
    const dirZ = -Math.cos(this.rotation.y);

    const targetX = Math.floor(this.position.x + dirX * 1.1);
    const targetY = Math.floor(this.position.y - 0.2);
    const targetZ = Math.floor(this.position.z + dirZ * 1.1);

    if (this.world.getBlock(targetX, targetY, targetZ) === BlockType.AIR) {
      this.world.setBlock(targetX, targetY, targetZ, blockToPlace);
      soundFX.playPlace(BLOCK_DEFS[blockToPlace]?.soundType || 'stone');
      this.swingHand();
      return true;
    }
    return false;
  }
}
