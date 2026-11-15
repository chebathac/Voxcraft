import * as THREE from 'three';
import { PlayerData, ChatMessage, BlockType } from './types';
import { VoxelWorld, WorldEntity } from './world';
import { textureManager } from './textures';
import { getSkinMaterials } from './skins';

export type ConnectionTransport = 'ws' | 'http' | 'connecting' | 'offline';

const REMOTE_RENDER_DISTANCE = 96;
const NAMEPLATE_VISIBLE_DISTANCE = 32;

// Shared immutable geometries across all remote players (eliminates GPU buffer duplication)
let SHARED_GEOS: {
  torso: THREE.BoxGeometry;
  head: THREE.BoxGeometry;
  hair: THREE.BoxGeometry;
  eye: THREE.PlaneGeometry;
  pupil: THREE.PlaneGeometry;
  armStd: THREE.BoxGeometry;
  armSlim: THREE.BoxGeometry;
  held: THREE.BoxGeometry;
  leg: THREE.BoxGeometry;
  shoe: THREE.BoxGeometry;
} | null = null;

function getSharedPlayerGeos() {
  if (!SHARED_GEOS) {
    SHARED_GEOS = {
      torso: new THREE.BoxGeometry(0.5, 0.75, 0.25),
      head: new THREE.BoxGeometry(0.48, 0.48, 0.48),
      hair: new THREE.BoxGeometry(0.5, 0.2, 0.5),
      eye: new THREE.PlaneGeometry(0.08, 0.05),
      pupil: new THREE.PlaneGeometry(0.04, 0.05),
      armStd: new THREE.BoxGeometry(0.23, 0.72, 0.22),
      armSlim: new THREE.BoxGeometry(0.19, 0.72, 0.22),
      held: new THREE.BoxGeometry(0.2, 0.2, 0.2),
      leg: new THREE.BoxGeometry(0.24, 0.52, 0.24),
      shoe: new THREE.BoxGeometry(0.245, 0.2, 0.245),
    };
  }
  return SHARED_GEOS;
}

export interface RemotePlayerMesh {
  name: string;
  group: THREE.Group;
  head: THREE.Group;
  body: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  heldItemMesh: THREE.Mesh;
  nameSprite: THREE.Sprite;
  targetPos: THREE.Vector3;
  targetYaw: number;
  targetPitch: number;
  isSneaking: boolean;
  isFlying: boolean;
  isSwinging: boolean;
  heldBlock: BlockType;
  walkCycle: number;
}

export class MultiplayerClient {
  public socket: WebSocket | null = null;
  public myId: string = '';
  public myName: string = 'Crafter';
  public mySkin: string = 'steve';
  public isConnected: boolean = false;
  public transport: ConnectionTransport = 'connecting';
  public ping: number = 24;
  public roomCode: string = 'COMMON';
  public mapName: string = 'Common World';
  public seed: number = 12345;

  public world: VoxelWorld;
  public scene: THREE.Scene;

  // Remote players registry
  public remotePlayers: Map<string, RemotePlayerMesh> = new Map();
  private remoteSpatialHandles: Map<string, WorldEntity<RemotePlayerMesh>> = new Map();
  private nearbyRemoteBuf: WorldEntity[] = [];
  private visibleRemoteIds: Set<string> = new Set();

  // Callbacks
  public onChatMessage?: (msg: ChatMessage) => void;
  public onConnectionChange?: (connected: boolean, transport: ConnectionTransport) => void;
  public onPlayerCountChange?: (count: number) => void;
  public onShardAssigned?: (center: { x: number; z: number; shardIndex: number }) => void;

  private lastSentTime: number = 0;
  private lastSentState = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, heldBlock: 1, flags: 0 };
  private isDisposed: boolean = false;
  private isMobileViewport: boolean =
    typeof window !== 'undefined' &&
    ((window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 768);
  private tmpPrevPos = new THREE.Vector3();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private httpFallbackTimer: ReturnType<typeof setInterval> | null = null;
  private wsRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private wsConnectWatchdog: ReturnType<typeof setTimeout> | null = null;

  // Latest local state & outbound queues (used by HTTP hybrid fallback)
  private latestLocalState = {
    x: 0,
    y: 20,
    z: 0,
    yaw: 0,
    pitch: 0,
    isSneaking: false,
    isFlying: false,
    isSwinging: false,
    heldBlock: BlockType.GRASS,
  };
  private queuedHttpBlockUpdates: { x: number; y: number; z: number; blockId: number }[] = [];
  private queuedHttpChats: string[] = [];
  private lastHttpChatTs: number = 0;
  private httpSyncInFlight: boolean = false;
  private hasSyncedInitialDeltas: boolean = false;
  private seenChatIds: Set<string> = new Set();

  constructor(
    world: VoxelWorld,
    scene: THREE.Scene,
    roomCode = 'COMMON',
    seed = 12345,
    mapName = 'Common World',
    playerName = 'Crafter',
    playerSkin = 'steve'
  ) {
    this.world = world;
    this.scene = scene;
    this.roomCode = roomCode.trim().toUpperCase() || 'COMMON';
    this.seed = seed;
    this.mapName = mapName;
    this.myName = playerName;
    this.mySkin = playerSkin;
    this.connect();
  }

  private updateConnectionState(connected: boolean, transport: ConnectionTransport) {
    this.isConnected = connected;
    this.transport = transport;
    this.onConnectionChange?.(connected, transport);
  }

  private emitChatOnce(msg: ChatMessage): void {
    const id = msg.id || `${msg.timestamp}-${msg.sender}-${msg.text}`;
    if (this.seenChatIds.has(id)) return;
    this.seenChatIds.add(id);
    if (this.seenChatIds.size > 250) {
      const oldest = this.seenChatIds.values().next().value;
      if (oldest) this.seenChatIds.delete(oldest);
    }
    if (typeof msg.timestamp === 'number' && msg.timestamp > this.lastHttpChatTs) {
      this.lastHttpChatTs = msg.timestamp;
    }
    this.onChatMessage?.({ ...msg, id });
  }

  public connect(): void {
    if (this.isDisposed) return;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.wsConnectWatchdog) {
      clearTimeout(this.wsConnectWatchdog);
      this.wsConnectWatchdog = null;
    }
    if (this.socket) {
      const prevSocket = this.socket;
      this.socket = null;
      prevSocket.onopen = null;
      prevSocket.onmessage = null;
      prevSocket.onclose = null;
      prevSocket.onerror = null;
      if (prevSocket.readyState === WebSocket.OPEN || prevSocket.readyState === WebSocket.CONNECTING) {
        prevSocket.close();
      }
    }

    this.updateConnectionState(false, 'connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const params = new URLSearchParams({
      room: this.roomCode,
      seed: String(this.seed),
      mapName: this.mapName,
    });
    // Dedicated /ws path prevents reverse-proxy or Vite root upgrade conflicts
    const wsUrl = `${protocol}//${window.location.host}/ws?${params.toString()}`;

    try {
      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      // If WebSocket handshake doesn't open within 3.5s, start HTTP sync fallback immediately
      if (this.wsConnectWatchdog) clearTimeout(this.wsConnectWatchdog);
      this.wsConnectWatchdog = setTimeout(() => {
        if (!this.isDisposed && ws.readyState !== WebSocket.OPEN) {
          this.startHttpFallback();
        }
      }, 3500);

      ws.onopen = () => {
        if (this.isDisposed) return;
        if (this.wsConnectWatchdog) {
          clearTimeout(this.wsConnectWatchdog);
          this.wsConnectWatchdog = null;
        }
        this.stopHttpFallback();
        this.updateConnectionState(true, 'ws');

        // Sync saved local deltas into empty server room
        if (this.world.deltas.size > 0 && !this.hasSyncedInitialDeltas) {
          this.hasSyncedInitialDeltas = true;
          this.send({
            type: 'sync_deltas',
            deltas: Array.from(this.world.deltas.entries()),
          });
        }

        // Send join announce
        this.send({
          type: 'join',
          name: this.myName,
          skin: this.mySkin,
          x: this.latestLocalState.x,
          y: this.latestLocalState.y,
          z: this.latestLocalState.z,
        });

        // 15s keepalive ping to prevent proxy idle timeout
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping' });
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          // Ignore malformed message
        }
      };

      ws.onclose = () => {
        if (this.wsConnectWatchdog) {
          clearTimeout(this.wsConnectWatchdog);
          this.wsConnectWatchdog = null;
        }
        if (this.pingTimer) {
          clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (!this.isDisposed) {
          this.startHttpFallback();
          if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              this.connect();
            }, 4000);
          }
        }
      };

      ws.onerror = () => {
        if (!this.isDisposed) {
          this.startHttpFallback();
        }
      };
    } catch {
      if (!this.isDisposed) {
        this.startHttpFallback();
      }
    }
  }

  // Automatic HTTP polling fallback if WebSocket is blocked by a mobile network or proxy
  private startHttpFallback(): void {
    if (this.isDisposed || this.httpFallbackTimer) return;
    this.updateConnectionState(true, 'http');

    const runHttpSync = async () => {
      if (this.isDisposed || this.httpSyncInFlight) return;
      this.httpSyncInFlight = true;

      const blockUpdates = this.queuedHttpBlockUpdates.splice(0, this.queuedHttpBlockUpdates.length);
      const chatMessages = this.queuedHttpChats.splice(0, this.queuedHttpChats.length);

      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(this.roomCode)}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: this.myId || undefined,
            name: this.myName,
            skin: this.mySkin,
            seed: this.seed,
            mapName: this.mapName,
            ...this.latestLocalState,
            sinceChatTs: this.lastHttpChatTs,
            blockUpdates,
            chatMessages,
            deltas:
              !this.hasSyncedInitialDeltas && this.world.deltas.size > 0
                ? Array.from(this.world.deltas.entries())
                : undefined,
          }),
        });

        if (!res.ok) {
          this.updateConnectionState(false, 'offline');
          this.httpSyncInFlight = false;
          return;
        }

        const data = await res.json();
        this.hasSyncedInitialDeltas = true;
        this.updateConnectionState(true, 'http');

        if (data.playerId) {
          this.myId = data.playerId;
        }

        // Apply world deltas from room without forcing unloaded distant chunks into RAM
        if (Array.isArray(data.worldDeltas)) {
          const changed = this.world.applyDeltasBatch(data.worldDeltas as [string, number][]);
          if (changed) this.world.updateMeshes(2, this.latestLocalState.x, this.latestLocalState.z);
        }

        // Reconcile players list
        if (Array.isArray(data.players)) {
          const activeIds = new Set<string>();
          for (const p of data.players as PlayerData[]) {
            if (p.id === this.myId) continue;
            activeIds.add(p.id);
            const existing = this.remotePlayers.get(p.id);
            if (!existing) {
              this.addRemotePlayer(p);
            } else {
              existing.targetPos.set(p.x, p.y, p.z);
              existing.targetYaw = p.yaw;
              existing.targetPitch = p.pitch;
              existing.isSneaking = !!p.isSneaking;
              existing.isFlying = !!p.isFlying;
              existing.isSwinging = !!p.isSwinging;
              if (p.heldBlock !== existing.heldBlock) {
                existing.heldBlock = p.heldBlock;
                existing.heldItemMesh.material = textureManager.getBlockMaterials(p.heldBlock);
              }
            }
          }
          for (const id of Array.from(this.remotePlayers.keys())) {
            if (!activeIds.has(id)) {
              this.removeRemotePlayer(id);
            }
          }
          this.onPlayerCountChange?.(this.remotePlayers.size + 1);
        }

        // Process new chat messages
        if (Array.isArray(data.newChats)) {
          for (const c of data.newChats as ChatMessage[]) {
            if (c.timestamp >= this.lastHttpChatTs) {
              this.emitChatOnce(c);
            }
          }
        }
      } catch {
        this.updateConnectionState(false, 'offline');
      } finally {
        this.httpSyncInFlight = false;
      }
    };

    runHttpSync();
    this.httpFallbackTimer = setInterval(runHttpSync, 150);

    // Periodically retry upgrading back to WebSocket
    if (!this.wsRetryTimer) {
      this.wsRetryTimer = setTimeout(() => {
        this.wsRetryTimer = null;
        if (!this.isDisposed && this.transport === 'http') {
          this.connect();
        }
      }, 15000);
    }
  }

  private stopHttpFallback(): void {
    if (this.httpFallbackTimer) {
      clearInterval(this.httpFallbackTimer);
      this.httpFallbackTimer = null;
    }
    if (this.wsRetryTimer) {
      clearTimeout(this.wsRetryTimer);
      this.wsRetryTimer = null;
    }
  }

  public send(obj: object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    }
  }

  private handleMessage(msg: {
    type: string;
    playerId?: string;
    roomCode?: string;
    spawnCenter?: { x: number; z: number; shardIndex: number };
    player?: PlayerData;
    players?: PlayerData[];
    moves?: [string, number, number, number, number, number, number, number][];
    worldDeltas?: [string, number][];
    x?: number;
    y?: number;
    z?: number;
    blockId?: number;
    id?: string;
    yaw?: number;
    pitch?: number;
    isSneaking?: boolean;
    isFlying?: boolean;
    isSwinging?: boolean;
    heldBlock?: number;
    sender?: string;
    text?: string;
    timestamp?: number;
    isSystem?: boolean;
  }): void {
    switch (msg.type) {
      case 'pong':
        break;

      case 'init': {
        this.myId = msg.playerId || '';
        if (msg.roomCode) {
          this.roomCode = msg.roomCode;
        }
        if (msg.spawnCenter) {
          this.onShardAssigned?.(msg.spawnCenter);
        }
        if (msg.worldDeltas) {
          const touched = this.world.applyDeltasBatch(msg.worldDeltas);
          if (touched) {
            this.world.updateMeshes(2, this.latestLocalState.x, this.latestLocalState.z);
          }
        }

        if (msg.players) {
          for (const p of msg.players) {
            if (p.id !== this.myId) {
              this.addRemotePlayer(p);
            }
          }
          this.onPlayerCountChange?.(this.remotePlayers.size + 1);
        }
        break;
      }

      case 'player_joined': {
        if (msg.player && msg.player.id !== this.myId) {
          this.addRemotePlayer(msg.player);
          this.onPlayerCountChange?.(this.remotePlayers.size + 1);
        }
        break;
      }

      case 'player_left': {
        if (msg.id) {
          this.removeRemotePlayer(msg.id);
          this.onPlayerCountChange?.(this.remotePlayers.size + 1);
        }
        break;
      }

      case 'world_tick': {
        if (Array.isArray(msg.moves)) {
          for (let i = 0; i < msg.moves.length; i++) {
            const [id, x, y, z, yaw, pitch, flags, heldBlock] = msg.moves[i];
            if (!id || id === this.myId) continue;
            let remote = this.remotePlayers.get(id);
            if (!remote) {
              this.addRemotePlayer({
                id,
                name: `Crafter_${id.slice(-4)}`,
                skin: 'steve',
                x,
                y,
                z,
                yaw,
                pitch,
                isSneaking: !!(flags & 1),
                isFlying: !!(flags & 2),
                isSwinging: !!(flags & 4),
                heldBlock,
              });
              this.onPlayerCountChange?.(this.remotePlayers.size + 1);
              remote = this.remotePlayers.get(id);
            }
            if (remote) {
              remote.targetPos.set(x, y, z);
              remote.targetYaw = yaw;
              remote.targetPitch = pitch;
              remote.isSneaking = !!(flags & 1);
              remote.isFlying = !!(flags & 2);
              remote.isSwinging = !!(flags & 4);
              if (heldBlock !== remote.heldBlock) {
                remote.heldBlock = heldBlock;
                remote.heldItemMesh.material = textureManager.getBlockMaterials(heldBlock);
              }
            }
          }
        }
        break;
      }

      case 'player_moved': {
        if (msg.id && msg.id !== this.myId) {
          const remote = this.remotePlayers.get(msg.id);
          if (remote) {
            remote.targetPos.set(msg.x ?? 0, msg.y ?? 0, msg.z ?? 0);
            remote.targetYaw = msg.yaw ?? 0;
            remote.targetPitch = msg.pitch ?? 0;
            remote.isSneaking = !!msg.isSneaking;
            remote.isFlying = !!msg.isFlying;
            remote.isSwinging = !!msg.isSwinging;

            if (msg.heldBlock !== undefined && msg.heldBlock !== remote.heldBlock) {
              remote.heldBlock = msg.heldBlock;
              remote.heldItemMesh.material = textureManager.getBlockMaterials(remote.heldBlock);
            }
          }
        }
        break;
      }

      case 'block_update': {
        if (msg.x !== undefined && msg.y !== undefined && msg.z !== undefined && msg.blockId !== undefined) {
          if (this.world.getBlock(msg.x, msg.y, msg.z) !== msg.blockId) {
            this.world.setBlock(msg.x, msg.y, msg.z, msg.blockId as BlockType, true);
            this.world.updateMeshes(2, this.latestLocalState.x, this.latestLocalState.z);
          }
        }
        break;
      }

      case 'chat': {
        if (this.onChatMessage && msg.sender && msg.text) {
          this.emitChatOnce({
            id: msg.id || `${Date.now()}`,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
            isSystem: msg.isSystem,
          });
        }
        break;
      }
    }
  }

  // Create Steve/Alex 3D voxel character model using shared geometry cache
  private createCharacterMesh(name: string, skin: string): RemotePlayerMesh {
    const group = new THREE.Group();
    const geos = getSharedPlayerGeos();

    const { def, skinMat, hairMat, shirtMat, pantsMat, shoesMat, eyeMat, pupilMat } = getSkinMaterials(skin);

    const body = new THREE.Mesh(geos.torso, shirtMat);
    body.position.set(0, 1.075, 0);
    group.add(body);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.45, 0);

    const headMesh = new THREE.Mesh(geos.head, skinMat);
    headGroup.add(headMesh);

    const hairMesh = new THREE.Mesh(geos.hair, hairMat);
    hairMesh.position.set(0, 0.16, 0);
    headGroup.add(hairMesh);

    const leftEye = new THREE.Mesh(geos.eye, eyeMat);
    leftEye.position.set(-0.12, 0.02, -0.245);
    leftEye.rotation.y = Math.PI;
    const leftPupil = new THREE.Mesh(geos.pupil, pupilMat);
    leftPupil.position.set(-0.1, 0.02, -0.246);
    leftPupil.rotation.y = Math.PI;

    const rightEye = new THREE.Mesh(geos.eye, eyeMat);
    rightEye.position.set(0.12, 0.02, -0.245);
    rightEye.rotation.y = Math.PI;
    const rightPupil = new THREE.Mesh(geos.pupil, pupilMat);
    rightPupil.position.set(0.14, 0.02, -0.246);
    rightPupil.rotation.y = Math.PI;

    headGroup.add(leftEye, leftPupil, rightEye, rightPupil);
    group.add(headGroup);

    const armW = def.isSlim ? 0.19 : 0.23;
    const armGeo = def.isSlim ? geos.armSlim : geos.armStd;
    const leftArm = new THREE.Group();
    leftArm.position.set(-(0.25 + armW / 2), 1.4, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.position.set(0, -0.32, 0);
    leftArm.add(leftArmMesh);
    group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.25 + armW / 2, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.position.set(0, -0.32, 0);
    rightArm.add(rightArmMesh);

    const heldMat = textureManager.getBlockMaterials(BlockType.GRASS);
    const heldItemMesh = new THREE.Mesh(geos.held, heldMat);
    heldItemMesh.position.set(0, -0.62, -0.16);
    rightArm.add(heldItemMesh);

    group.add(rightArm);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.13, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(geos.leg, pantsMat);
    leftLegMesh.position.set(0, -0.26, 0);
    const leftShoeMesh = new THREE.Mesh(geos.shoe, shoesMat);
    leftShoeMesh.position.set(0, -0.62, 0);
    leftLeg.add(leftLegMesh, leftShoeMesh);
    group.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.13, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(geos.leg, pantsMat);
    rightLegMesh.position.set(0, -0.26, 0);
    const rightShoeMesh = new THREE.Mesh(geos.shoe, shoesMat);
    rightShoeMesh.position.set(0, -0.62, 0);
    rightLeg.add(rightLegMesh, rightShoeMesh);
    group.add(rightLeg);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect(10, 10, 236, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const nameSprite = new THREE.Sprite(spriteMat);
    nameSprite.position.set(0, 2.1, 0);
    nameSprite.scale.set(1.6, 0.4, 1);
    group.add(nameSprite);

    this.scene.add(group);

    return {
      name,
      group,
      head: headGroup,
      body,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      heldItemMesh,
      nameSprite,
      targetPos: new THREE.Vector3(0, 16, 0),
      targetYaw: 0,
      targetPitch: 0,
      isSneaking: false,
      isFlying: false,
      isSwinging: false,
      heldBlock: BlockType.GRASS,
      walkCycle: 0,
    };
  }

  public addRemotePlayer(p: PlayerData): void {
    if (this.remotePlayers.has(p.id)) return;
    const mesh = this.createCharacterMesh(p.name, p.skin);
    mesh.name = p.name;
    mesh.group.position.set(p.x, p.y, p.z);
    mesh.targetPos.set(p.x, p.y, p.z);
    mesh.targetYaw = p.yaw;
    mesh.targetPitch = p.pitch;
    mesh.heldBlock = p.heldBlock;
    mesh.heldItemMesh.material = textureManager.getBlockMaterials(p.heldBlock);
    this.remotePlayers.set(p.id, mesh);
    const spatialHandle: WorldEntity<RemotePlayerMesh> = {
      id: `player:${p.id}`,
      kind: 'player',
      position: mesh.targetPos,
      radius: 0.4,
      data: mesh,
    };
    this.remoteSpatialHandles.set(p.id, spatialHandle);
    this.world.registerEntity(spatialHandle);
  }

  public removeRemotePlayer(id: string): void {
    const mesh = this.remotePlayers.get(id);
    if (mesh) {
      this.scene.remove(mesh.group);
      const spriteMat = mesh.nameSprite.material as THREE.SpriteMaterial;
      spriteMat.map?.dispose();
      spriteMat.dispose();
      this.remotePlayers.delete(id);
    }
    this.visibleRemoteIds.delete(id);
    if (this.remoteSpatialHandles.has(id)) {
      this.world.unregisterEntity(`player:${id}`);
      this.remoteSpatialHandles.delete(id);
    }
  }

  // Send quantized local player state at 20Hz when moving, or 1Hz heartbeat when idle
  public sendUpdate(playerData: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    isSneaking: boolean;
    isFlying: boolean;
    isSwinging: boolean;
    heldBlock: BlockType;
  }): void {
    this.latestLocalState = { ...playerData };
    const now = performance.now();
    const elapsed = now - this.lastSentTime;
    if (elapsed < 50) return;

    const flags =
      (playerData.isSneaking ? 1 : 0) |
      (playerData.isFlying ? 2 : 0) |
      (playerData.isSwinging ? 4 : 0);
    const changed =
      Math.abs(playerData.x - this.lastSentState.x) > 0.015 ||
      Math.abs(playerData.y - this.lastSentState.y) > 0.015 ||
      Math.abs(playerData.z - this.lastSentState.z) > 0.015 ||
      Math.abs(playerData.yaw - this.lastSentState.yaw) > 0.02 ||
      Math.abs(playerData.pitch - this.lastSentState.pitch) > 0.02 ||
      flags !== this.lastSentState.flags ||
      playerData.heldBlock !== this.lastSentState.heldBlock;

    if (!changed && elapsed < 1000) return;

    this.lastSentTime = now;
    this.lastSentState = {
      x: playerData.x,
      y: playerData.y,
      z: playerData.z,
      yaw: playerData.yaw,
      pitch: playerData.pitch,
      heldBlock: playerData.heldBlock,
      flags,
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'player_update',
        x: Math.round(playerData.x * 100) / 100,
        y: Math.round(playerData.y * 100) / 100,
        z: Math.round(playerData.z * 100) / 100,
        yaw: Math.round(playerData.yaw * 1000) / 1000,
        pitch: Math.round(playerData.pitch * 1000) / 1000,
        isSneaking: playerData.isSneaking,
        isFlying: playerData.isFlying,
        isSwinging: playerData.isSwinging,
        heldBlock: playerData.heldBlock,
      });
    }
  }

  public sendBlockChange(x: number, y: number, z: number, blockId: BlockType): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'block_update',
        x,
        y,
        z,
        blockId,
      });
    } else {
      this.queuedHttpBlockUpdates.push({ x, y, z, blockId });
    }
  }

  public sendChat(text: string): void {
    if (!text.trim()) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        type: 'chat',
        text,
      });
    } else {
      this.queuedHttpChats.push(text.trim());
    }
  }

  public update(delta: number): void {
    if (this.remotePlayers.size === 0) return;

    const lx = this.latestLocalState.x;
    const ly = this.latestLocalState.y;
    const lz = this.latestLocalState.z;
    const maxRenderDistSq = REMOTE_RENDER_DISTANCE * REMOTE_RENDER_DISTANCE;
    const maxNameDistSq = NAMEPLATE_VISIBLE_DISTANCE * NAMEPLATE_VISIBLE_DISTANCE;
    const maxVisible = this.isMobileViewport ? 36 : 60;

    // Keep spatial hash cells synchronized for active remote players
    for (const handle of this.remoteSpatialHandles.values()) {
      this.world.updateEntitySpatial(handle);
    }

    // Query only nearby players within render distance via 3D spatial hash
    const nearby = this.world.queryEntitiesInRadius(
      lx,
      ly,
      lz,
      REMOTE_RENDER_DISTANCE,
      'player',
      this.nearbyRemoteBuf
    );

    const nextVisible = new Set<string>();
    let visibleCount = 0;

    for (let i = 0; i < nearby.length; i++) {
      const handle = nearby[i];
      const remote = handle.data as RemotePlayerMesh | undefined;
      if (!remote) continue;

      const dx = remote.targetPos.x - lx;
      const dz = remote.targetPos.z - lz;
      const distSq = dx * dx + dz * dz;
      if (distSq > maxRenderDistSq || visibleCount >= maxVisible) {
        continue;
      }

      const rawId = handle.id.slice(7);
      nextVisible.add(rawId);
      visibleCount++;

      remote.group.visible = true;
      remote.nameSprite.visible = distSq <= maxNameDistSq;

      this.tmpPrevPos.copy(remote.group.position);
      remote.group.position.lerp(remote.targetPos, 0.22);
      remote.group.rotation.y = THREE.MathUtils.damp(remote.group.rotation.y, remote.targetYaw, 12, delta);
      remote.head.rotation.x = THREE.MathUtils.damp(remote.head.rotation.x, remote.targetPitch, 12, delta);

      const moveDistance = remote.group.position.distanceTo(this.tmpPrevPos);
      const isMoving = moveDistance > 0.005;

      if (isMoving && !remote.isFlying) {
        remote.walkCycle += delta * 10;
        const swing = Math.sin(remote.walkCycle) * 0.6;
        remote.leftLeg.rotation.x = swing;
        remote.rightLeg.rotation.x = -swing;
        remote.leftArm.rotation.x = -swing;
        remote.rightArm.rotation.x = swing;
      } else {
        remote.leftLeg.rotation.x = THREE.MathUtils.damp(remote.leftLeg.rotation.x, 0, 10, delta);
        remote.rightLeg.rotation.x = THREE.MathUtils.damp(remote.rightLeg.rotation.x, 0, 10, delta);
        remote.leftArm.rotation.x = THREE.MathUtils.damp(remote.leftArm.rotation.x, 0, 10, delta);
        remote.rightArm.rotation.x = THREE.MathUtils.damp(remote.rightArm.rotation.x, 0, 10, delta);
      }

      if (remote.isSwinging) {
        remote.rightArm.rotation.x = -1.1 + Math.sin(performance.now() * 0.02) * 0.5;
      }
    }

    // Hide any previously visible player that moved outside render range
    for (const prevId of this.visibleRemoteIds) {
      if (!nextVisible.has(prevId)) {
        const prevRemote = this.remotePlayers.get(prevId);
        if (prevRemote) prevRemote.group.visible = false;
      }
    }
    this.visibleRemoteIds = nextVisible;
  }

  public getOtherPlayersList(): { id: string; x: number; z: number; name?: string }[] {
    const list: { id: string; x: number; z: number; name?: string }[] = [];
    for (const [id, remote] of this.remotePlayers.entries()) {
      list.push({
        id,
        x: remote.group.position.x,
        z: remote.group.position.z,
        name: remote.name,
      });
    }
    return list;
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.wsConnectWatchdog) {
      clearTimeout(this.wsConnectWatchdog);
      this.wsConnectWatchdog = null;
    }
    this.stopHttpFallback();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    for (const remote of this.remotePlayers.values()) {
      this.scene.remove(remote.group);
      const spriteMat = remote.nameSprite.material as THREE.SpriteMaterial;
      spriteMat.map?.dispose();
      spriteMat.dispose();
    }
    for (const id of this.remoteSpatialHandles.keys()) {
      this.world.unregisterEntity(`player:${id}`);
    }
    this.remoteSpatialHandles.clear();
    this.visibleRemoteIds.clear();
    this.remotePlayers.clear();
    this.seenChatIds.clear();
  }
}
