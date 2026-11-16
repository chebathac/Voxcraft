import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  ClusterBus,
  ClusterMoveTuple,
  ClusterRoomEvent,
  RemotePlayerSnapshot,
} from './server/clusterBus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 65536 });

function readCliArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const prefix = `${flag}=`;
  const eqArg = process.argv.find((a) => a.startsWith(prefix));
  return eqArg ? eqArg.slice(prefix.length) : null;
}

const cliPort = readCliArg('--port');
const cliHost = readCliArg('--host');
const PORT = cliPort ? parseInt(cliPort, 10) : process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = cliHost || '0.0.0.0';
const ROOMS_SNAPSHOT_FILE = path.join(__dirname, '.voxelcraft-rooms.json');

// Large-crowd scaling & spatial interest constants (500+ shards x 160 = 80,000+ users per map)
const SHARD_PLAYER_CAP = Math.max(20, parseInt(process.env.SHARD_PLAYER_CAP || '160', 10) || 160);
const INTEREST_RADIUS = 96;
const MAX_SYNC_PEERS = 48;
const WS_BACKPRESSURE_LIMIT = 65536; // 64 KB per-client send buffer guard
const NETWORK_CAPACITY_TARGET = 80_000;
const WORLD_HALF_SIZE = 16000;
const SECTOR_SPACING = 256;

function getShardSectorCenter(roomCode: string): { x: number; z: number; shardIndex: number } {
  const hashParts = roomCode.split('#');
  const shardIndex = hashParts.length > 1 ? Math.max(0, (parseInt(hashParts[1], 10) || 1) - 1) : 0;
  if (shardIndex === 0) return { x: 0, z: 0, shardIndex: 0 };

  let x = 0;
  let z = 0;
  let dx = 1;
  let dz = 0;
  let segmentLength = 1;
  let segmentPassed = 0;
  for (let i = 0; i < shardIndex; i++) {
    x += dx;
    z += dz;
    segmentPassed++;
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      const tmp = dx;
      dx = -dz;
      dz = tmp;
      if (dz === 0) segmentLength++;
    }
  }
  const maxGrid = Math.floor((WORLD_HALF_SIZE - 128) / SECTOR_SPACING);
  const clampedX = Math.max(-maxGrid, Math.min(maxGrid, x));
  const clampedZ = Math.max(-maxGrid, Math.min(maxGrid, z));
  return { x: clampedX * SECTOR_SPACING, z: clampedZ * SECTOR_SPACING, shardIndex };
}

const clusterBus = new ClusterBus();
let isShuttingDown = false;

interface PlayerState {
  id: string;
  name: string;
  skin: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  isSneaking: boolean;
  isFlying: boolean;
  isSwinging: boolean;
  heldBlock: number;
  lastUpdate: number;
}

interface RoomChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface RoomClient {
  ws: WebSocket | null;
  isAlive: boolean;
  state: PlayerState;
  msgCount: number;
  msgWindowStart: number;
}

interface MapRoom {
  code: string;
  baseCode: string;
  name: string;
  seed: number;
  isCommon: boolean;
  createdAt: number;
  players: Map<string, RoomClient>;
  remotePeers: Map<string, RemotePlayerSnapshot>;
  dirtyMovers: Set<string>;
  dirtyRemoteMovers: Set<string>;
  worldDeltas: Map<string, number>;
  chatLog: RoomChatMessage[];
  hydratedFromCluster?: boolean;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

// Deterministic seed derived from a room code so any server instance builds the exact same world for that code
function seedFromCode(code: string): number {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 10000 + (Math.abs(hash) % 89999);
}

// Multi-map room registry (always initialized with the public COMMON world)
const rooms = new Map<string, MapRoom>();

function getOrCreateCommonRoom(): MapRoom {
  let common = rooms.get('COMMON');
  if (!common) {
    common = {
      code: 'COMMON',
      baseCode: 'COMMON',
      name: 'Common World',
      seed: 12345,
      isCommon: true,
      createdAt: Date.now(),
      players: new Map(),
      remotePeers: new Map(),
      dirtyMovers: new Set(),
      dirtyRemoteMovers: new Set(),
      worldDeltas: new Map(),
      chatLog: [],
    };
    rooms.set('COMMON', common);
  }
  return common;
}

async function hydrateRoomFromCluster(room: MapRoom): Promise<void> {
  if (room.hydratedFromCluster || clusterBus.mode === 'standalone') return;
  room.hydratedFromCluster = true;
  const { meta, deltas } = await clusterBus.loadRoomFromCluster(room.code);
  if (meta) {
    room.name = meta.name;
    room.seed = meta.seed;
    room.isCommon = meta.isCommon;
    room.createdAt = meta.createdAt;
  } else {
    void clusterBus.saveRoomMeta({
      code: room.code,
      name: room.name,
      seed: room.seed,
      isCommon: room.isCommon,
      createdAt: room.createdAt,
    });
  }
  for (const [k, v] of deltas) {
    if (!room.worldDeltas.has(k)) {
      room.worldDeltas.set(k, v);
    }
  }
}

function getOrCreateRoom(code: string, name?: string, seed?: number): MapRoom {
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9#]/g, '').slice(0, 14);
  if (cleanCode === 'COMMON' || !cleanCode) {
    return getOrCreateCommonRoom();
  }

  const baseCode = cleanCode.split('#')[0];
  let room = rooms.get(cleanCode);
  if (!room) {
    const baseRoom = rooms.get(baseCode);
    room = {
      code: cleanCode,
      baseCode,
      name: (name || baseRoom?.name || `Map ${baseCode}`).slice(0, 32),
      seed:
        typeof seed === 'number' && Number.isFinite(seed)
          ? Math.floor(seed)
          : baseRoom?.seed ?? seedFromCode(baseCode),
      isCommon: baseCode === 'COMMON',
      createdAt: Date.now(),
      players: new Map(),
      remotePeers: new Map(),
      dirtyMovers: new Set(),
      dirtyRemoteMovers: new Set(),
      worldDeltas: baseRoom ? new Map(baseRoom.worldDeltas) : new Map(),
      chatLog: [],
    };
    rooms.set(cleanCode, room);
    void clusterBus.saveRoomMeta({
      code: room.code,
      name: room.name,
      seed: room.seed,
      isCommon: room.isCommon,
      createdAt: room.createdAt,
    });
    scheduleSnapshotSave();
  }
  return room;
}

// Auto-shard into #2, #3... across the ENTIRE cluster when an active shard reaches SHARD_PLAYER_CAP
function resolveShardForJoin(baseCodeInput: string, name?: string, seed?: number): MapRoom {
  const baseCode = baseCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'COMMON';
  const primary = getOrCreateRoom(baseCode, name, seed);
  if (clusterBus.getClusterShardOccupancy(baseCode, primary.players.size) < SHARD_PLAYER_CAP) {
    return primary;
  }

  let shardIdx = 2;
  while (shardIdx < 50000) {
    const shardCode = `${baseCode}#${shardIdx}`;
    const existing = rooms.get(shardCode);
    const localOccupancy = existing ? existing.players.size : 0;
    if (clusterBus.getClusterShardOccupancy(shardCode, localOccupancy) < SHARD_PLAYER_CAP) {
      return existing || getOrCreateRoom(shardCode, primary.name, primary.seed);
    }
    shardIdx++;
  }
  return primary;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function filterNearbyPlayers(room: MapRoom, targetId: string, tx: number, tz: number): PlayerState[] {
  const candidates: { distSq: number; state: PlayerState }[] = [];
  const maxDistSq = INTEREST_RADIUS * INTEREST_RADIUS;

  for (const [id, client] of room.players) {
    if (id === targetId) continue;
    const dx = client.state.x - tx;
    const dz = client.state.z - tz;
    const distSq = dx * dx + dz * dz;
    if (distSq <= maxDistSq) {
      candidates.push({ distSq, state: client.state });
    }
  }

  for (const [id, remote] of room.remotePeers) {
    if (id === targetId || room.players.has(id)) continue;
    const dx = remote.x - tx;
    const dz = remote.z - tz;
    const distSq = dx * dx + dz * dz;
    if (distSq <= maxDistSq) {
      candidates.push({ distSq, state: remote });
    }
  }

  if (candidates.length > MAX_SYNC_PEERS) {
    candidates.sort((a, b) => a.distSq - b.distSq);
    candidates.length = MAX_SYNC_PEERS;
  }
  return candidates.map((c) => c.state);
}

// Persist created rooms & block edits to local snapshot so server restarts keep active maps
let saveSnapshotTimer: ReturnType<typeof setTimeout> | null = null;

function saveRoomsSnapshotNow() {
  try {
    const serialized: {
      code: string;
      name: string;
      seed: number;
      isCommon: boolean;
      createdAt: number;
      worldDeltas: [string, number][];
    }[] = [];

    for (const room of rooms.values()) {
      // Keep snapshot compact: persist rooms with edits or recently created custom rooms
      if (room.isCommon || room.worldDeltas.size > 0 || Date.now() - room.createdAt < 1000 * 60 * 60 * 24 * 7) {
        serialized.push({
          code: room.code,
          name: room.name,
          seed: room.seed,
          isCommon: room.isCommon,
          createdAt: room.createdAt,
          worldDeltas: Array.from(room.worldDeltas.entries()).slice(-20000),
        });
      }
    }

    fs.writeFileSync(ROOMS_SNAPSHOT_FILE, JSON.stringify(serialized), 'utf8');
  } catch (err) {
    console.warn('[Server] Failed to save room snapshot:', err);
  }
}

function scheduleSnapshotSave() {
  if (saveSnapshotTimer) clearTimeout(saveSnapshotTimer);
  saveSnapshotTimer = setTimeout(saveRoomsSnapshotNow, 2500);
}

function loadRoomsSnapshot() {
  try {
    if (!fs.existsSync(ROOMS_SNAPSHOT_FILE)) return;
    const raw = fs.readFileSync(ROOMS_SNAPSHOT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (!item || typeof item.code !== 'string') continue;
      const room: MapRoom = {
        code: item.code,
        baseCode: item.code.split('#')[0],
        name: typeof item.name === 'string' ? item.name : `Map ${item.code}`,
        seed: typeof item.seed === 'number' ? item.seed : seedFromCode(item.code),
        isCommon: item.code === 'COMMON' || item.code.startsWith('COMMON#'),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
        players: new Map(),
        remotePeers: new Map(),
        dirtyMovers: new Set(),
        dirtyRemoteMovers: new Set(),
        worldDeltas: new Map(Array.isArray(item.worldDeltas) ? item.worldDeltas : []),
        chatLog: [],
      };
      rooms.set(room.code, room);
    }
  } catch (err) {
    console.warn('[Server] Failed to load room snapshot:', err);
  }
}

loadRoomsSnapshot();
getOrCreateCommonRoom();

// Room-scoped broadcast helper with backpressure guard (skips congested mobile sockets)
function broadcastToRoom(room: MapRoom, message: object, excludeId?: string) {
  const data = JSON.stringify(message);
  for (const [id, client] of room.players) {
    if (
      id !== excludeId &&
      client.ws &&
      client.ws.readyState === WebSocket.OPEN &&
      client.ws.bufferedAmount < WS_BACKPRESSURE_LIMIT
    ) {
      client.ws.send(data);
    }
  }
}

// 20Hz Spatial Interest-Filtered Batch Tick Loop + Cross-Node Redis Fanout
type MoveTuple = [string, number, number, number, number, number, number, number];
setInterval(() => {
  const maxDistSq = INTEREST_RADIUS * INTEREST_RADIUS;

  for (const room of rooms.values()) {
    const hasLocalMovers = room.dirtyMovers.size > 0;
    const hasRemoteMovers = room.dirtyRemoteMovers.size > 0;
    if (!hasLocalMovers && !hasRemoteMovers) continue;

    const moverStates: { id: string; tuple: MoveTuple; x: number; z: number }[] = [];
    const localOutTuples: ClusterMoveTuple[] = [];

    for (const moverId of room.dirtyMovers) {
      const m = room.players.get(moverId);
      if (!m) continue;
      const flags =
        (m.state.isSneaking ? 1 : 0) |
        (m.state.isFlying ? 2 : 0) |
        (m.state.isSwinging ? 4 : 0);
      const tuple: MoveTuple = [
        moverId,
        round2(m.state.x),
        round2(m.state.y),
        round2(m.state.z),
        round3(m.state.yaw),
        round3(m.state.pitch),
        flags,
        m.state.heldBlock,
      ];
      moverStates.push({ id: moverId, x: m.state.x, z: m.state.z, tuple });
      localOutTuples.push(tuple);
    }
    room.dirtyMovers.clear();

    // Forward local movers across Redis cluster so players on sibling nodes see smooth 20Hz movement
    if (localOutTuples.length > 0 && clusterBus.mode === 'redis-cluster') {
      clusterBus.publishRoomEvent({
        type: 'player_moves',
        originNodeId: clusterBus.nodeId,
        roomCode: room.code,
        moves: localOutTuples,
      });
    }

    for (const remoteId of room.dirtyRemoteMovers) {
      const rp = room.remotePeers.get(remoteId);
      if (!rp) continue;
      const flags = (rp.isSneaking ? 1 : 0) | (rp.isFlying ? 2 : 0) | (rp.isSwinging ? 4 : 0);
      moverStates.push({
        id: remoteId,
        x: rp.x,
        z: rp.z,
        tuple: [
          remoteId,
          round2(rp.x),
          round2(rp.y),
          round2(rp.z),
          round3(rp.yaw),
          round3(rp.pitch),
          flags,
          rp.heldBlock,
        ],
      });
    }
    room.dirtyRemoteMovers.clear();

    if (moverStates.length === 0 || room.players.size === 0) continue;

    for (const [receiverId, receiver] of room.players) {
      if (
        !receiver.ws ||
        receiver.ws.readyState !== WebSocket.OPEN ||
        receiver.ws.bufferedAmount >= WS_BACKPRESSURE_LIMIT
      ) {
        continue;
      }

      const rx = receiver.state.x;
      const rz = receiver.state.z;
      const batch: MoveTuple[] = [];

      for (let i = 0; i < moverStates.length; i++) {
        const mv = moverStates[i];
        if (mv.id === receiverId) continue;
        const dx = mv.x - rx;
        const dz = mv.z - rz;
        if (dx * dx + dz * dz <= maxDistSq) {
          batch.push(mv.tuple);
          if (batch.length >= MAX_SYNC_PEERS) break;
        }
      }

      if (batch.length > 0) {
        receiver.ws.send(JSON.stringify({ type: 'world_tick', moves: batch }));
      }
    }
  }
}, 50);

// Room-scoped system chat helper (syncs across sibling nodes in Redis cluster)
let chatSeq = 0;

function pushRoomChat(
  room: MapRoom,
  sender: string,
  text: string,
  isSystem = false,
  fromCluster = false,
  existingMsg?: RoomChatMessage
) {
  const msg: RoomChatMessage = existingMsg ?? {
    id: `msg-${Date.now()}-${++chatSeq}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text,
    timestamp: Date.now(),
    isSystem,
  };
  if (room.chatLog.some((m) => m.id === msg.id)) {
    return msg;
  }
  room.chatLog.push(msg);
  if (room.chatLog.length > 60) {
    room.chatLog.shift();
  }
  broadcastToRoom(room, {
    type: 'chat',
    ...msg,
  });
  if (!fromCluster) {
    clusterBus.publishRoomEvent({
      type: 'chat',
      originNodeId: clusterBus.nodeId,
      roomCode: room.code,
      ...msg,
    });
  }
  return msg;
}

// Explicit WebSocket upgrade handler so Vite middlewares never conflict with game sockets
server.on('upgrade', (req, socket, head) => {
  const urlStr = req.url || '/';
  const parsed = new URL(urlStr, `http://localhost:${PORT}`);

  // Handle dedicated /ws path OR root upgrades carrying ?room=
  if (parsed.pathname === '/ws' || (parsed.pathname === '/' && parsed.searchParams.has('room'))) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});

wss.on('connection', (ws: WebSocket, req) => {
  const playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const urlObj = new URL(req.url || '/ws', `http://localhost:${PORT}`);
  const requestedRoom = (urlObj.searchParams.get('room') || 'COMMON').trim().toUpperCase();
  const requestedSeed = urlObj.searchParams.get('seed');
  const requestedName = urlObj.searchParams.get('mapName') || undefined;

  const room = resolveShardForJoin(
    requestedRoom,
    requestedName,
    requestedSeed ? parseInt(requestedSeed, 10) : undefined
  );
  void hydrateRoomFromCluster(room);

  const defaultState: PlayerState = {
    id: playerId,
    name: `Crafter_${playerId.slice(-4)}`,
    skin: 'steve',
    x: 0,
    y: 20,
    z: 0,
    yaw: 0,
    pitch: 0,
    isSneaking: false,
    isFlying: false,
    isSwinging: false,
    heldBlock: 1,
    lastUpdate: Date.now(),
  };

  const clientEntry: RoomClient = {
    ws,
    isAlive: true,
    state: defaultState,
    msgCount: 0,
    msgWindowStart: Date.now(),
  };
  const wasEmpty = room.players.size === 0;
  room.players.set(playerId, clientEntry);
  if (wasEmpty) {
    clusterBus.subscribeRoom(room.code);
  }

  ws.on('pong', () => {
    clientEntry.isAlive = true;
  });

  // Send initial handshake scoped to this shard + nearby peers across nodes + sector spawn center
  const initialDeltas: [string, number][] = Array.from(room.worldDeltas.entries()).slice(-20000);
  const spawnCenter = getShardSectorCenter(room.code);
  const activePlayers = filterNearbyPlayers(room, playerId, spawnCenter.x, spawnCenter.z);

  ws.send(
    JSON.stringify({
      type: 'init',
      playerId,
      roomCode: room.code,
      mapName: room.name,
      seed: room.seed,
      spawnCenter,
      nodeId: clusterBus.nodeId,
      worldDeltas: initialDeltas,
      players: activePlayers,
    })
  );

  ws.on('message', (raw: string) => {
    clientEntry.isAlive = true;
    const now = Date.now();
    if (now - clientEntry.msgWindowStart > 1000) {
      clientEntry.msgWindowStart = now;
      clientEntry.msgCount = 0;
    }
    clientEntry.msgCount++;
    // Rate-limit abusive floods (>75 packets/sec)
    if (clientEntry.msgCount > 75) return;

    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong', timestamp: now }));
        }
        return;
      }

      if (msg.type === 'join') {
        const p = room.players.get(playerId);
        if (p) {
          p.state.name = String(msg.name || p.state.name).slice(0, 18);
          p.state.skin = String(msg.skin || 'steve').slice(0, 24);
          if (typeof msg.x === 'number' && Number.isFinite(msg.x)) p.state.x = msg.x;
          if (typeof msg.y === 'number' && Number.isFinite(msg.y)) p.state.y = msg.y;
          if (typeof msg.z === 'number' && Number.isFinite(msg.z)) p.state.z = msg.z;
          p.state.lastUpdate = now;

          broadcastToRoom(
            room,
            {
              type: 'player_joined',
              player: p.state,
            },
            playerId
          );
          clusterBus.publishRoomEvent({
            type: 'player_joined',
            originNodeId: clusterBus.nodeId,
            roomCode: room.code,
            player: { ...p.state, nodeId: clusterBus.nodeId },
          });

          pushRoomChat(
            room,
            'Server',
            `${p.state.name} joined ${room.isCommon ? 'Common World' : `${room.name} [${room.code}]`}!`,
            true
          );
        }
      } else if (msg.type === 'sync_deltas') {
        if (Array.isArray(msg.deltas) && room.worldDeltas.size === 0) {
          const accepted: [string, number][] = [];
          for (const entry of msg.deltas.slice(0, 20000)) {
            if (Array.isArray(entry) && entry.length === 2) {
              const [k, v] = entry;
              if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v)) {
                room.worldDeltas.set(k, v);
                accepted.push([k, v]);
              }
            }
          }
          clusterBus.saveBlockDeltasBatch(room.code, accepted);
          scheduleSnapshotSave();
        }
      } else if (msg.type === 'player_update') {
        const p = room.players.get(playerId);
        if (
          p &&
          typeof msg.x === 'number' &&
          Number.isFinite(msg.x) &&
          typeof msg.y === 'number' &&
          Number.isFinite(msg.y) &&
          typeof msg.z === 'number' &&
          Number.isFinite(msg.z)
        ) {
          p.state.x = msg.x;
          p.state.y = msg.y;
          p.state.z = msg.z;
          if (typeof msg.yaw === 'number' && Number.isFinite(msg.yaw)) p.state.yaw = msg.yaw;
          if (typeof msg.pitch === 'number' && Number.isFinite(msg.pitch)) p.state.pitch = msg.pitch;
          p.state.isSneaking = !!msg.isSneaking;
          p.state.isFlying = !!msg.isFlying;
          p.state.isSwinging = !!msg.isSwinging;
          if (typeof msg.heldBlock === 'number' && Number.isFinite(msg.heldBlock)) {
            p.state.heldBlock = msg.heldBlock;
          }
          p.state.lastUpdate = now;
          room.dirtyMovers.add(playerId);
        }
      } else if (msg.type === 'block_update') {
        if (
          typeof msg.x === 'number' &&
          Number.isFinite(msg.x) &&
          typeof msg.y === 'number' &&
          Number.isFinite(msg.y) &&
          typeof msg.z === 'number' &&
          Number.isFinite(msg.z) &&
          typeof msg.blockId === 'number' &&
          Number.isFinite(msg.blockId)
        ) {
          const bx = Math.floor(msg.x);
          const by = Math.floor(msg.y);
          const bz = Math.floor(msg.z);
          if (by >= 0 && by < 64) {
            const key = `${bx},${by},${bz}`;
            const blockId = Math.floor(msg.blockId);
            room.worldDeltas.set(key, blockId);
            clusterBus.saveBlockDelta(room.code, key, blockId);
            scheduleSnapshotSave();

            broadcastToRoom(
              room,
              {
                type: 'block_update',
                x: bx,
                y: by,
                z: bz,
                blockId,
                playerId,
              },
              playerId
            );
            clusterBus.publishRoomEvent({
              type: 'block_update',
              originNodeId: clusterBus.nodeId,
              roomCode: room.code,
              x: bx,
              y: by,
              z: bz,
              blockId,
              playerId,
            });
          }
        }
      } else if (msg.type === 'chat') {
        const p = room.players.get(playerId);
        const text = String(msg.text || '').trim().slice(0, 200);
        if (text && p) {
          pushRoomChat(room, p.state.name, text, false);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    const p = room.players.get(playerId);
    const playerName = p?.state.name || 'A crafter';
    room.players.delete(playerId);

    broadcastToRoom(room, {
      type: 'player_left',
      id: playerId,
    });
    clusterBus.publishRoomEvent({
      type: 'player_left',
      originNodeId: clusterBus.nodeId,
      roomCode: room.code,
      playerId,
    });
    pushRoomChat(room, 'Server', `${playerName} left the map`, true);

    if (room.players.size === 0) {
      clusterBus.unsubscribeRoom(room.code);
      room.remotePeers.clear();
      room.dirtyRemoteMovers.clear();
    }
  });
});

// 20-second keepalive heartbeat + stale HTTP/WS player cleanup
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const [id, client] of room.players) {
      if (client.ws) {
        if (!client.isAlive || client.ws.readyState === WebSocket.CLOSED) {
          room.players.delete(id);
          broadcastToRoom(room, { type: 'player_left', id });
          clusterBus.publishRoomEvent({
            type: 'player_left',
            originNodeId: clusterBus.nodeId,
            roomCode: room.code,
            playerId: id,
          });
          continue;
        }
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      } else {
        // HTTP-polled fallback player expires after 12s without sync
        if (now - client.state.lastUpdate > 12000) {
          const leftName = client.state.name;
          room.players.delete(id);
          broadcastToRoom(room, { type: 'player_left', id });
          clusterBus.publishRoomEvent({
            type: 'player_left',
            originNodeId: clusterBus.nodeId,
            roomCode: room.code,
            playerId: id,
          });
          pushRoomChat(room, 'Server', `${leftName} left the map`, true);
        }
      }
    }

    if (room.players.size === 0) {
      clusterBus.unsubscribeRoom(room.code);
      room.remotePeers.clear();
      room.dirtyRemoteMovers.clear();
      continue;
    }

    // Prune stale remote cluster peers (> 20s without update)
    for (const [remoteId, remotePeer] of room.remotePeers) {
      if (now - remotePeer.lastUpdate > 20000) {
        room.remotePeers.delete(remoteId);
        broadcastToRoom(room, { type: 'player_left', id: remoteId });
      }
    }
  }
}, 20000);

// Hybrid HTTP Sync Fallback endpoint (used automatically when a friend's network/proxy blocks WebSockets)
app.post('/api/rooms/:code/sync', async (req, res) => {
  const cleanCode = String(req.params.code || 'COMMON').trim().toUpperCase();
  const body = req.body || {};
  const seedNum = typeof body.seed === 'number' && Number.isFinite(body.seed) ? body.seed : undefined;
  const mapNameStr = typeof body.mapName === 'string' ? body.mapName : undefined;
  const room = getOrCreateRoom(cleanCode, mapNameStr, seedNum);
  await hydrateRoomFromCluster(room);

  let playerId = typeof body.playerId === 'string' && body.playerId ? body.playerId : '';
  let isNew = false;

  if (!playerId || !room.players.has(playerId)) {
    if (!playerId) {
      playerId = `http-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    isNew = true;
  }

  const existing = room.players.get(playerId);
  const state: PlayerState = existing
    ? existing.state
    : {
        id: playerId,
        name: String(body.name || `Crafter_${playerId.slice(-4)}`).slice(0, 18),
        skin: String(body.skin || 'steve'),
        x: Number(body.x) || 0,
        y: Number(body.y) || 20,
        z: Number(body.z) || 0,
        yaw: Number(body.yaw) || 0,
        pitch: Number(body.pitch) || 0,
        isSneaking: !!body.isSneaking,
        isFlying: !!body.isFlying,
        isSwinging: !!body.isSwinging,
        heldBlock: Number(body.heldBlock) || 1,
        lastUpdate: Date.now(),
      };

  if (!isNew) {
    if (typeof body.name === 'string') state.name = body.name.slice(0, 18);
    if (typeof body.skin === 'string') state.skin = body.skin;
    if (typeof body.x === 'number') state.x = body.x;
    if (typeof body.y === 'number') state.y = body.y;
    if (typeof body.z === 'number') state.z = body.z;
    if (typeof body.yaw === 'number') state.yaw = body.yaw;
    if (typeof body.pitch === 'number') state.pitch = body.pitch;
    state.isSneaking = !!body.isSneaking;
    state.isFlying = !!body.isFlying;
    state.isSwinging = !!body.isSwinging;
    if (typeof body.heldBlock === 'number') state.heldBlock = body.heldBlock;
    state.lastUpdate = Date.now();
    room.dirtyMovers.add(playerId);
  } else {
    const wasEmpty = room.players.size === 0;
    room.players.set(playerId, {
      ws: null,
      isAlive: true,
      state,
      msgCount: 0,
      msgWindowStart: Date.now(),
    });
    if (wasEmpty) {
      clusterBus.subscribeRoom(room.code);
    }
    broadcastToRoom(room, { type: 'player_joined', player: state }, playerId);
    clusterBus.publishRoomEvent({
      type: 'player_joined',
      originNodeId: clusterBus.nodeId,
      roomCode: room.code,
      player: { ...state, nodeId: clusterBus.nodeId },
    });
    pushRoomChat(
      room,
      'Server',
      `${state.name} joined ${room.isCommon ? 'Common World' : `${room.name} [${room.code}]`}!`,
      true
    );
  }

  // Sync host deltas if room is empty
  if (Array.isArray(body.deltas) && room.worldDeltas.size === 0) {
    const accepted: [string, number][] = [];
    for (const entry of body.deltas.slice(0, 20000)) {
      if (Array.isArray(entry) && entry.length === 2) {
        const [k, v] = entry;
        if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v)) {
          room.worldDeltas.set(k, v);
          accepted.push([k, v]);
        }
      }
    }
    clusterBus.saveBlockDeltasBatch(room.code, accepted);
    scheduleSnapshotSave();
  }

  // Process any block updates sent during this HTTP sync
  if (Array.isArray(body.blockUpdates)) {
    for (const upd of body.blockUpdates) {
      if (upd && typeof upd.x === 'number' && typeof upd.y === 'number' && typeof upd.z === 'number') {
        const bx = Math.floor(upd.x);
        const by = Math.floor(upd.y);
        const bz = Math.floor(upd.z);
        const blockId = Number(upd.blockId);
        const key = `${bx},${by},${bz}`;
        room.worldDeltas.set(key, blockId);
        clusterBus.saveBlockDelta(room.code, key, blockId);
        broadcastToRoom(room, { type: 'block_update', x: bx, y: by, z: bz, blockId, playerId }, playerId);
        clusterBus.publishRoomEvent({
          type: 'block_update',
          originNodeId: clusterBus.nodeId,
          roomCode: room.code,
          x: bx,
          y: by,
          z: bz,
          blockId,
          playerId,
        });
      }
    }
    scheduleSnapshotSave();
  }

  // Process any queued chat messages
  if (Array.isArray(body.chatMessages)) {
    for (const text of body.chatMessages) {
      const cleanText = String(text || '').trim().slice(0, 200);
      if (cleanText) {
        pushRoomChat(room, state.name, cleanText, false);
      }
    }
  }

  const sinceChatTs = typeof body.sinceChatTs === 'number' ? body.sinceChatTs : 0;
  const newChats = room.chatLog.filter((m) => m.timestamp > sinceChatTs);
  const nearbyPlayers = filterNearbyPlayers(room, playerId, state.x, state.z);

  res.json({
    playerId,
    roomCode: room.code,
    mapName: room.name,
    seed: room.seed,
    players: nearbyPlayers,
    worldDeltas: isNew ? Array.from(room.worldDeltas.entries()).slice(-20000) : undefined,
    newChats,
  });
});

// API route: Create a new private/custom map room with unique invite code
app.post('/api/maps', (req, res) => {
  const { name, seed, preferredCode } = req.body || {};

  let code =
    typeof preferredCode === 'string' && preferredCode.trim().length >= 4
      ? preferredCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
      : generateRoomCode();

  while (code === 'COMMON' || (rooms.has(code) && !preferredCode)) {
    code = generateRoomCode();
  }

  const numericSeed =
    typeof seed === 'number' && Number.isFinite(seed) ? Math.floor(seed) : seedFromCode(code);

  const room = getOrCreateRoom(code, typeof name === 'string' ? name : undefined, numericSeed);
  scheduleSnapshotSave();

  res.json({
    code: room.code,
    name: room.name,
    seed: room.seed,
    onlinePlayers: room.players.size,
  });
});

// API route: Validate & inspect a map code so friends can enter seamlessly (auto-restores valid codes across restarts/instances)
app.get('/api/maps/:code', async (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 4 || code.length > 8) {
    res.status(400).json({ exists: false, error: 'Map code must be 4 to 8 letters/numbers (e.g. K7M9P2).' });
    return;
  }

  let room = rooms.get(code);
  let autoCreated = false;
  if (!room) {
    // Allow valid 6-char map codes (or invite link params) to spin up consistently with deterministic seed
    const qSeed = req.query.seed ? parseInt(String(req.query.seed), 10) : undefined;
    const qName = typeof req.query.name === 'string' ? req.query.name : undefined;
    room = getOrCreateRoom(code, qName, qSeed);
    autoCreated = true;
  }

  await hydrateRoomFromCluster(room);

  res.json({
    exists: true,
    autoCreated,
    code: room.code,
    name: room.name,
    seed: room.seed,
    isCommon: room.isCommon,
    onlinePlayers: clusterBus.getClusterShardOccupancy(room.code, room.players.size),
    totalBlockEdits: room.worldDeltas.size,
  });
});

// AI-Powered NPC Dialogue via Gemini 2.0
app.post('/api/npc/chat', async (req, res) => {
  const { npcName, npcRole, playerMessage, context } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallbackReplies: Record<string, string> = {
      Blacksmith: "Keep your blade sharp and your armor repaired! The Nether beasts don't show mercy.",
      Alchemist: "Potions of Swiftness and Fire Resistance are essential if you plan to venture into the Nether caves.",
      Farmer: "Wheat grows best near fresh water, and bone meal will speed up your crops immediately!",
      Cartographer: "I chart the uncharted lands! Keep an eye on your mini-map for dangerous mob swarms.",
      Guide: "Welcome traveler! Mine deep for diamonds, craft obsidian for portals, and conquer the Ender Dragon!",
    };
    const reply = fallbackReplies[npcRole] || `Greetings, traveler! I am ${npcName || 'a humble villager'}. Watch out for creepers after dark!`;
    return res.json({ reply, source: 'offline-lore' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are ${npcName || 'a Minecraft NPC villager'}, whose role in the village is ${npcRole || 'Guide'}.
Context: ${context || 'A player in the 3D voxel world of VoxelCraft has approached you to talk.'}
Player says: "${playerMessage || 'Hello!'}"
Reply in 1-2 concise, atmospheric, in-character sentences suitable for a medieval voxel RPG. Stay immersive and helpful.`,
    });
    return res.json({ reply: response.text || "Safe travels, friend!", source: 'gemini-ai' });
  } catch (err: any) {
    return res.json({ reply: `Stay alert, friend! The wilderness is dangerous tonight.`, source: 'fallback', error: err?.message });
  }
});

// Kubernetes / Load-Balancer Liveness & Readiness Probes
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, nodeId: clusterBus.nodeId });
});

app.get('/readyz', (_req, res) => {
  if (isShuttingDown) {
    res.status(503).json({ ready: false, reason: 'draining' });
    return;
  }
  if (process.env.REQUIRE_REDIS === 'true' && !clusterBus.redisConnected) {
    res.status(503).json({ ready: false, reason: 'redis_required' });
    return;
  }
  res.status(200).json({
    ready: true,
    nodeId: clusterBus.nodeId,
    mode: clusterBus.mode,
    redisConnecting: clusterBus.redisConnecting,
  });
});

// API route for health check and cluster-wide server info
app.get('/api/status', (_req, res) => {
  let localPlayers = 0;
  let localCommonPlayers = 0;
  for (const room of rooms.values()) {
    localPlayers += room.players.size;
    if (room.isCommon) localCommonPlayers += room.players.size;
  }
  const common = getOrCreateCommonRoom();
  const clusterSummary = clusterBus.getClusterSummary(localPlayers, localCommonPlayers);

  res.json({
    status: 'ok',
    ...clusterSummary,
    localPlayers,
    activeRooms: rooms.size,
    shardCap: SHARD_PLAYER_CAP,
    capacityTarget: NETWORK_CAPACITY_TARGET,
    worldSize: `${WORLD_HALF_SIZE * 2}x${WORLD_HALF_SIZE * 2}`,
    totalBlockEdits: common.worldDeltas.size,
    timestamp: Date.now(),
  });
});

// Serve static assets from public
app.use(express.static(path.join(__dirname, 'public')));

function handleRemoteClusterEvent(evt: ClusterRoomEvent) {
  const room = rooms.get(evt.roomCode);
  if (!room || room.players.size === 0) return;
  switch (evt.type) {
    case 'block_update': {
      room.worldDeltas.set(`${evt.x},${evt.y},${evt.z}`, evt.blockId);
      broadcastToRoom(room, {
        type: 'block_update',
        x: evt.x,
        y: evt.y,
        z: evt.z,
        blockId: evt.blockId,
        playerId: evt.playerId,
      });
      break;
    }
    case 'chat': {
      pushRoomChat(room, evt.sender, evt.text, evt.isSystem, true, {
        id: evt.id,
        sender: evt.sender,
        text: evt.text,
        timestamp: evt.timestamp,
        isSystem: evt.isSystem,
      });
      break;
    }
    case 'player_joined': {
      room.remotePeers.set(evt.player.id, evt.player);
      broadcastToRoom(room, {
        type: 'player_joined',
        player: evt.player,
      });
      break;
    }
    case 'player_left': {
      room.remotePeers.delete(evt.playerId);
      room.dirtyRemoteMovers.delete(evt.playerId);
      broadcastToRoom(room, {
        type: 'player_left',
        id: evt.playerId,
      });
      break;
    }
    case 'player_moves': {
      const now = Date.now();
      for (const [id, x, y, z, yaw, pitch, flags, heldBlock] of evt.moves) {
        const existing = room.remotePeers.get(id);
        if (existing) {
          existing.x = x;
          existing.y = y;
          existing.z = z;
          existing.yaw = yaw;
          existing.pitch = pitch;
          existing.isSneaking = (flags & 1) !== 0;
          existing.isFlying = (flags & 2) !== 0;
          existing.isSwinging = (flags & 4) !== 0;
          existing.heldBlock = heldBlock;
          existing.lastUpdate = now;
        } else {
          room.remotePeers.set(id, {
            id,
            nodeId: evt.originNodeId,
            name: `Crafter_${id.slice(-4)}`,
            skin: 'steve',
            x,
            y,
            z,
            yaw,
            pitch,
            isSneaking: (flags & 1) !== 0,
            isFlying: (flags & 2) !== 0,
            isSwinging: (flags & 4) !== 0,
            heldBlock,
            lastUpdate: now,
          });
        }
        room.dirtyRemoteMovers.add(id);
      }
      break;
    }
  }
}

// Graceful Pod Scale-Down / Drain Handler
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Server:${clusterBus.nodeId}] Received ${signal}, draining sockets...`);
  saveRoomsSnapshotNow();

  for (const room of rooms.values()) {
    for (const client of room.players.values()) {
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1001, 'Server scaling');
      }
    }
  }

  await clusterBus.shutdown();
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 4000).unref();
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

// Set up Vite or static serving + ClusterBus initialization
async function setupVite() {
  void clusterBus.init(handleRemoteClusterEvent, () => {
    let totalPlayers = 0;
    const shardCounts: Record<string, number> = {};
    for (const room of rooms.values()) {
      const sz = room.players.size;
      if (sz > 0) {
        totalPlayers += sz;
        shardCounts[room.code] = sz;
      }
    }
    return { totalPlayers, shardCounts };
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, HOST, () => {
    console.log(
      `VoxelCraft node ${clusterBus.nodeId} [${clusterBus.mode}] listening on http://${HOST}:${PORT}`
    );
  });
}

setupVite().catch(console.error);
