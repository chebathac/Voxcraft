import Redis, { Cluster } from 'ioredis';
import crypto from 'crypto';

export type ClusterMode = 'redis-cluster' | 'redis-single' | 'standalone';

type RedisConnection = Redis | Cluster;

export interface RemotePlayerSnapshot {
  id: string;
  nodeId: string;
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

export type ClusterMoveTuple = [string, number, number, number, number, number, number, number];

export type ClusterRoomEvent =
  | {
      type: 'block_update';
      originNodeId: string;
      roomCode: string;
      x: number;
      y: number;
      z: number;
      blockId: number;
      playerId: string;
    }
  | {
      type: 'chat';
      originNodeId: string;
      roomCode: string;
      id: string;
      sender: string;
      text: string;
      timestamp: number;
      isSystem?: boolean;
    }
  | {
      type: 'player_joined';
      originNodeId: string;
      roomCode: string;
      player: RemotePlayerSnapshot;
    }
  | {
      type: 'player_left';
      originNodeId: string;
      roomCode: string;
      playerId: string;
    }
  | {
      type: 'player_moves';
      originNodeId: string;
      roomCode: string;
      moves: ClusterMoveTuple[];
    };

export interface ClusterNodeHeartbeat {
  nodeId: string;
  totalPlayers: number;
  shardCounts: Record<string, number>;
  updatedAt: number;
}

export interface PersistedRoomMeta {
  code: string;
  name: string;
  seed: number;
  isCommon: boolean;
  createdAt: number;
}

const CHANNEL_PREFIX = 'voxel:events:';
// Shared hash tag {nodes} keeps the node registry in a single hash slot across Redis Cluster shards
const NODE_REGISTRY_KEY = 'voxel:{nodes}:registry';
const ROOM_META_PREFIX = 'voxel:room:';
const ROOM_DELTAS_PREFIX = 'voxel:deltas:';

function parseClusterNodes(clusterEnv?: string, redisUrl?: string | null): string[] {
  const raw = clusterEnv?.trim();
  if (raw) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('MY_'));
  }
  if (redisUrl && redisUrl.includes(',')) {
    return redisUrl
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('MY_'));
  }
  return [];
}

function createRedisConnection(
  redisUrl: string | null,
  clusterNodes: string[]
): { client: RedisConnection; isCluster: boolean } {
  const redisOptions = {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    enableOfflineQueue: false,
    connectTimeout: 4000,
    retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 300, 3000)),
  };

  if (clusterNodes.length > 0) {
    const parsedNodes = clusterNodes.map((entry) => {
      const cleaned = entry.replace(/^rediss?:\/\//, '');
      const [host, portStr] = cleaned.split(':');
      return { host: host || '127.0.0.1', port: parseInt(portStr || '6379', 10) || 6379 };
    });
    const cluster = new Cluster(parsedNodes, {
      redisOptions,
      enableOfflineQueue: false,
      clusterRetryStrategy: (times: number) => (times > 4 ? null : Math.min(times * 400, 3000)),
      scaleReads: 'slave',
    });
    return { client: cluster, isCluster: true };
  }

  return {
    client: new Redis(redisUrl as string, redisOptions),
    isCluster: false,
  };
}

export class ClusterBus {
  public readonly nodeId: string;
  public readonly redisUrl: string | null;
  public readonly clusterNodes: string[];
  public mode: ClusterMode = 'standalone';
  public redisConnected = false;
  public redisConnecting = false;

  private cmdClient: RedisConnection | null = null;
  private pubClient: RedisConnection | null = null;
  private subClient: RedisConnection | null = null;
  private remoteNodes: Map<string, ClusterNodeHeartbeat> = new Map();
  private subscribedRooms: Set<string> = new Set();
  private onRoomEventHandler?: (event: ClusterRoomEvent) => void;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private getLocalStatsFn?: () => { totalPlayers: number; shardCounts: Record<string, number> };
  private startupFailures = 0;
  private everConnected = false;

  constructor() {
    this.nodeId =
      process.env.NODE_ID?.trim() ||
      `node-${crypto.randomBytes(3).toString('hex')}`;
    const rawUrl = process.env.REDIS_URL?.trim() || null;
    this.redisUrl = rawUrl && !rawUrl.startsWith('MY_') ? rawUrl : null;
    this.clusterNodes = parseClusterNodes(process.env.REDIS_CLUSTER_NODES, this.redisUrl);
  }

  public get hasRedisConfig(): boolean {
    return Boolean(this.redisUrl || this.clusterNodes.length > 0);
  }

  private fallbackToStandalone(reason: string): void {
    if (this.mode === 'standalone' && !this.cmdClient && !this.pubClient && !this.subClient) {
      return;
    }
    console.warn(`[ClusterBus:${this.nodeId}] ${reason} — falling back to standalone node mode.`);
    this.mode = 'standalone';
    this.redisConnected = false;
    this.redisConnecting = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    const clients = [this.cmdClient, this.pubClient, this.subClient];
    this.cmdClient = null;
    this.pubClient = null;
    this.subClient = null;
    for (const c of clients) {
      try {
        c?.disconnect();
      } catch {
        // Ignore disconnect errors during fallback
      }
    }
  }

  public async init(
    onRoomEvent: (event: ClusterRoomEvent) => void,
    getLocalStats: () => { totalPlayers: number; shardCounts: Record<string, number> }
  ): Promise<void> {
    this.onRoomEventHandler = onRoomEvent;
    this.getLocalStatsFn = getLocalStats;

    if (!this.hasRedisConfig) {
      this.mode = 'standalone';
      this.redisConnected = false;
      return;
    }

    this.redisConnecting = true;
    try {
      const cmdConn = createRedisConnection(this.redisUrl, this.clusterNodes);
      const pubConn = createRedisConnection(this.redisUrl, this.clusterNodes);
      const subConn = createRedisConnection(this.redisUrl, this.clusterNodes);

      this.cmdClient = cmdConn.client;
      this.pubClient = pubConn.client;
      this.subClient = subConn.client;

      const targetMode: ClusterMode = cmdConn.isCluster ? 'redis-cluster' : 'redis-single';

      const handleRedisError = (role: string, err: Error) => {
        if (!this.cmdClient && !this.pubClient && !this.subClient) return;
        if (!this.everConnected) {
          this.startupFailures += 1;
          if (this.startupFailures >= 3) {
            this.fallbackToStandalone(`Redis ${role} unavailable (${err.message})`);
          }
          return;
        }
        console.warn(`[ClusterBus:${this.nodeId}] Redis ${role} error:`, err.message);
      };

      this.cmdClient.on('ready', () => {
        this.everConnected = true;
        this.redisConnected = true;
        this.redisConnecting = false;
        this.mode = targetMode;
        void this.syncClusterHeartbeats();
        console.log(
          `[ClusterBus] Node ${this.nodeId} joined ${targetMode} (${
            this.clusterNodes.length > 0 ? this.clusterNodes.join(',') : this.redisUrl
          })`
        );
      });
      this.subClient.on('ready', () => {
        if (this.subscribedRooms.size > 0 && this.subClient) {
          const channels = Array.from(this.subscribedRooms).map((code) => `${CHANNEL_PREFIX}${code}`);
          void this.subClient.subscribe(...channels).catch(() => {
            // Ignore transient subscribe errors on reconnect
          });
        }
      });

      this.cmdClient.on('error', (err: Error) => handleRedisError('cmd', err));
      this.pubClient.on('error', (err: Error) => handleRedisError('pub', err));
      this.subClient.on('error', (err: Error) => handleRedisError('sub', err));

      // Handle Redis Cluster per-node socket errors cleanly so EventEmitter never throws
      this.cmdClient.on('node error', (err: Error) => handleRedisError('cluster-cmd-node', err));
      this.pubClient.on('node error', (err: Error) => handleRedisError('cluster-pub-node', err));
      this.subClient.on('node error', (err: Error) => handleRedisError('cluster-sub-node', err));

      // Selective per-room Pub/Sub (no global wildcard): pods only receive events for rooms they host
      this.subClient.on('message', (_channel: string, raw: string) => {
        try {
          const evt = JSON.parse(raw) as ClusterRoomEvent;
          if (!evt || evt.originNodeId === this.nodeId) return;
          if (!this.subscribedRooms.has(evt.roomCode)) return;
          this.onRoomEventHandler?.(evt);
        } catch {
          // Ignore malformed cluster pubsub payload
        }
      });

      // Periodic 5s node heartbeat & remote cluster discovery (only executes once ready)
      this.heartbeatTimer = setInterval(() => {
        void this.syncClusterHeartbeats();
      }, 5000);

      // Fail-safe: if Redis has not connected within 5s at boot, fall back cleanly to standalone
      setTimeout(() => {
        if (!this.everConnected && !this.redisConnected) {
          this.fallbackToStandalone('Redis initial connection timed out');
        }
      }, 5000).unref();
    } catch (err) {
      this.fallbackToStandalone(
        `Redis initialization error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  public subscribeRoom(roomCode: string): void {
    const clean = roomCode.trim().toUpperCase();
    if (!clean || this.subscribedRooms.has(clean)) return;
    this.subscribedRooms.add(clean);

    if (this.mode !== 'standalone' && this.subClient && this.redisConnected) {
      void this.subClient.subscribe(`${CHANNEL_PREFIX}${clean}`).catch((err: Error) => {
        console.warn(`[ClusterBus:${this.nodeId}] Subscribe ${clean} failed:`, err.message);
      });
    }
  }

  public unsubscribeRoom(roomCode: string): void {
    const clean = roomCode.trim().toUpperCase();
    if (!clean || !this.subscribedRooms.has(clean)) return;
    this.subscribedRooms.delete(clean);

    if (this.mode !== 'standalone' && this.subClient && this.redisConnected) {
      void this.subClient.unsubscribe(`${CHANNEL_PREFIX}${clean}`).catch(() => {
        // Ignore transient unsubscribe failure
      });
    }
  }

  private async syncClusterHeartbeats(): Promise<void> {
    if (!this.cmdClient || !this.redisConnected || !this.getLocalStatsFn) return;
    try {
      const now = Date.now();
      const stats = this.getLocalStatsFn();
      const beat: ClusterNodeHeartbeat = {
        nodeId: this.nodeId,
        totalPlayers: stats.totalPlayers,
        shardCounts: stats.shardCounts,
        updatedAt: now,
      };
      await this.cmdClient.hset(NODE_REGISTRY_KEY, this.nodeId, JSON.stringify(beat));

      const rawMap = await this.cmdClient.hgetall(NODE_REGISTRY_KEY);
      const nextNodes = new Map<string, ClusterNodeHeartbeat>();
      const staleIds: string[] = [];

      for (const [id, raw] of Object.entries(rawMap)) {
        try {
          const parsed = JSON.parse(raw) as ClusterNodeHeartbeat;
          if (parsed?.nodeId && now - parsed.updatedAt < 18000) {
            nextNodes.set(parsed.nodeId, parsed);
          } else {
            staleIds.push(id);
          }
        } catch {
          staleIds.push(id);
        }
      }

      if (staleIds.length > 0) {
        void this.cmdClient.hdel(NODE_REGISTRY_KEY, ...staleIds).catch(() => {});
      }
      this.remoteNodes = nextNodes;
    } catch {
      // Non-fatal heartbeat retry next cycle
    }
  }

  public getClusterSummary(localPlayers: number, localCommonPlayers: number) {
    if (this.mode === 'standalone' || this.remoteNodes.size === 0) {
      return {
        nodeId: this.nodeId,
        clusterMode: this.mode,
        redisConnected: this.redisConnected,
        subscribedRooms: this.subscribedRooms.size,
        activeNodes: 1,
        onlinePlayers: localPlayers,
        commonPlayers: localCommonPlayers,
      };
    }

    let totalOnline = 0;
    let totalCommon = 0;
    for (const node of this.remoteNodes.values()) {
      if (node.nodeId === this.nodeId) {
        totalOnline += localPlayers;
        totalCommon += localCommonPlayers;
      } else {
        totalOnline += node.totalPlayers;
        for (const [code, count] of Object.entries(node.shardCounts || {})) {
          if (code === 'COMMON' || code.startsWith('COMMON#')) {
            totalCommon += count;
          }
        }
      }
    }

    return {
      nodeId: this.nodeId,
      clusterMode: this.mode,
      redisConnected: this.redisConnected,
      subscribedRooms: this.subscribedRooms.size,
      activeNodes: Math.max(1, this.remoteNodes.size),
      onlinePlayers: totalOnline,
      commonPlayers: totalCommon,
    };
  }

  public getClusterShardOccupancy(shardCode: string, localCount: number): number {
    if (this.mode === 'standalone' || this.remoteNodes.size === 0) {
      return localCount;
    }
    let total = localCount;
    for (const node of this.remoteNodes.values()) {
      if (node.nodeId === this.nodeId) continue;
      total += node.shardCounts?.[shardCode] || 0;
    }
    return total;
  }

  public publishRoomEvent(event: ClusterRoomEvent): void {
    if (this.mode === 'standalone' || !this.pubClient || !this.redisConnected) return;
    try {
      void this.pubClient.publish(`${CHANNEL_PREFIX}${event.roomCode}`, JSON.stringify(event)).catch(() => {});
    } catch {
      // Non-blocking fanout
    }
  }

  public async saveRoomMeta(meta: PersistedRoomMeta): Promise<void> {
    if (this.mode === 'standalone' || !this.cmdClient || !this.redisConnected) return;
    try {
      await this.cmdClient.hset(`${ROOM_META_PREFIX}${meta.code}`, {
        code: meta.code,
        name: meta.name,
        seed: String(meta.seed),
        isCommon: meta.isCommon ? '1' : '0',
        createdAt: String(meta.createdAt),
      });
    } catch {
      // Non-fatal cache write
    }
  }

  public async loadRoomFromCluster(code: string): Promise<{
    meta: PersistedRoomMeta | null;
    deltas: [string, number][];
  }> {
    if (this.mode === 'standalone' || !this.cmdClient || !this.redisConnected) {
      return { meta: null, deltas: [] };
    }
    try {
      const [metaHash, deltasHash] = await Promise.all([
        this.cmdClient.hgetall(`${ROOM_META_PREFIX}${code}`),
        this.cmdClient.hgetall(`${ROOM_DELTAS_PREFIX}${code}`),
      ]);

      const meta: PersistedRoomMeta | null =
        metaHash && metaHash.code
          ? {
              code: metaHash.code,
              name: metaHash.name || `Map ${code}`,
              seed: parseInt(metaHash.seed, 10) || 12345,
              isCommon: metaHash.isCommon === '1',
              createdAt: parseInt(metaHash.createdAt, 10) || Date.now(),
            }
          : null;

      const deltas: [string, number][] = [];
      if (deltasHash) {
        for (const [k, v] of Object.entries(deltasHash)) {
          const num = parseInt(v, 10);
          if (Number.isFinite(num)) {
            deltas.push([k, num]);
          }
        }
      }

      return { meta, deltas };
    } catch {
      return { meta: null, deltas: [] };
    }
  }

  public saveBlockDelta(roomCode: string, key: string, blockId: number): void {
    if (this.mode === 'standalone' || !this.cmdClient || !this.redisConnected) return;
    try {
      void this.cmdClient.hset(`${ROOM_DELTAS_PREFIX}${roomCode}`, key, String(blockId)).catch(() => {});
    } catch {
      // Non-blocking delta write
    }
  }

  public saveBlockDeltasBatch(roomCode: string, entries: [string, number][]): void {
    if (this.mode === 'standalone' || !this.cmdClient || !this.redisConnected || entries.length === 0) {
      return;
    }
    try {
      const args: Record<string, string> = {};
      for (const [k, v] of entries.slice(0, 20000)) {
        args[k] = String(v);
      }
      void this.cmdClient.hset(`${ROOM_DELTAS_PREFIX}${roomCode}`, args).catch(() => {});
    } catch {
      // Non-blocking batch write
    }
  }

  public async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    try {
      if (this.cmdClient && this.redisConnected) {
        await this.cmdClient.hdel(NODE_REGISTRY_KEY, this.nodeId);
      }
      this.subscribedRooms.clear();
      await Promise.allSettled([
        this.cmdClient?.quit(),
        this.pubClient?.quit(),
        this.subClient?.quit(),
      ]);
    } catch {
      // Ignore shutdown errors
    }
  }
}
