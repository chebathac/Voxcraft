import React, { useRef, useEffect, useState, useMemo } from 'react';
import { VoxelWorld, CHUNK_SIZE } from '../game/world';
import { BlockType } from '../game/types';
import { BLOCK_DEFS } from '../game/textures';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarMobPoint } from '../game/mobs';

interface MiniMapProps {
  world: VoxelWorld | null;
  playerPos: { x: number; y: number; z: number };
  playerYaw: number;
  biome: string;
  otherPlayers?: { id: string; x: number; z: number; name?: string }[];
  mobs?: RadarMobPoint[];
  terrainVersion?: number;
}

// Map color overrides for top-down visibility
const MAP_BLOCK_COLORS: Record<number, string> = {
  [BlockType.AIR]: 'rgba(0,0,0,0)',
  [BlockType.GRASS]: '#4c7a2b',
  [BlockType.DIRT]: '#866043',
  [BlockType.STONE]: '#727272',
  [BlockType.COBBLESTONE]: '#5a5a5a',
  [BlockType.WOOD_OAK]: '#6b5130',
  [BlockType.LEAVES_OAK]: '#27621a',
  [BlockType.WOOD_CHERRY]: '#532938',
  [BlockType.LEAVES_CHERRY]: '#d46b8f',
  [BlockType.PLANKS_OAK]: '#b88748',
  [BlockType.BRICK]: '#9c493b',
  [BlockType.GLASS]: '#b8d8ec',
  [BlockType.SAND]: '#d4c782',
  [BlockType.WATER]: '#2f68b3',
  [BlockType.LAVA]: '#e65100',
  [BlockType.GOLD_ORE]: '#f5d442',
  [BlockType.IRON_ORE]: '#cca283',
  [BlockType.DIAMOND_ORE]: '#4dd0e1',
  [BlockType.COAL_ORE]: '#303030',
  [BlockType.DIAMOND_BLOCK]: '#33e6f2',
  [BlockType.GOLD_BLOCK]: '#ffeb3b',
  [BlockType.TNT]: '#d32f2f',
  [BlockType.BOOKSHELF]: '#795548',
  [BlockType.CRAFTING_TABLE]: '#8d6e63',
  [BlockType.FURNACE]: '#616161',
  [BlockType.BEDROCK]: '#212121',
  [BlockType.GLOWSTONE]: '#ffb300',
  [BlockType.PUMPKIN]: '#ef6c00',
  [BlockType.TORCH]: '#ffe082',
  [BlockType.SNOW]: '#ffffff',
  [BlockType.WOOL_RED]: '#b71c1c',
  [BlockType.WOOL_BLUE]: '#1a237e',
  [BlockType.WOOL_WHITE]: '#eeeeee',
  [BlockType.CACTUS]: '#2e7d32',
};

// Shading utility for elevation depth
function adjustBrightness(hex: string, percent: number): string {
  if (!hex || hex.startsWith('rgba')) return hex;
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `rgb(${R}, ${G}, ${B})`;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  world,
  playerPos,
  playerYaw,
  biome,
  otherPlayers = [],
  mobs = [],
  terrainVersion = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const terrainCacheRef = useRef<{
    canvas: HTMLCanvasElement;
    bx: number;
    bz: number;
    radius: number;
    version: number;
    world: VoxelWorld | null;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(2); // 1 = 32 blocks, 2 = 24 blocks, 3 = 16 blocks
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Radius of world blocks shown
  const blockRadius = zoomLevel === 1 ? 32 : zoomLevel === 2 ? 24 : 16;
  const canvasSize = 148; // CSS pixels

  // Current chunk calculation
  const currentChunkX = Math.floor(playerPos.x / CHUNK_SIZE);
  const currentChunkZ = Math.floor(playerPos.z / CHUNK_SIZE);

  // Cardinal direction facing
  const facing = useMemo(() => {
    // playerYaw in radians: normalize to 0..2PI
    const norm = ((-playerYaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const deg = (norm * 180) / Math.PI;
    if (deg >= 315 || deg < 45) return 'N (-Z)';
    if (deg >= 45 && deg < 135) return 'W (-X)';
    if (deg >= 135 && deg < 225) return 'S (+Z)';
    return 'E (+X)';
  }, [playerYaw]);

  // Canvas top-down render loop with cached terrain layer for zero-lag 60fps mobile gameplay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !world || isCollapsed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== canvasSize * dpr || canvas.height !== canvasSize * dpr) {
      canvas.width = canvasSize * dpr;
      canvas.height = canvasSize * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pxCenter = canvasSize / 2;
    const pxPerBlock = canvasSize / (blockRadius * 2);

    const playerBlockX = Math.floor(playerPos.x);
    const playerBlockZ = Math.floor(playerPos.z);

    // Rebuild offscreen terrain bitmap only when player moves to a new block, zooms, or edits blocks
    const cached = terrainCacheRef.current;
    const needsTerrainRebuild =
      !cached ||
      cached.bx !== playerBlockX ||
      cached.bz !== playerBlockZ ||
      cached.radius !== blockRadius ||
      cached.version !== terrainVersion ||
      cached.world !== world;

    let offscreen: HTMLCanvasElement;
    if (needsTerrainRebuild) {
      offscreen = cached?.canvas || document.createElement('canvas');
      offscreen.width = canvasSize;
      offscreen.height = canvasSize;
      const tCtx = offscreen.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#222222';
        tCtx.fillRect(0, 0, canvasSize, canvasSize);

        for (let dz = -blockRadius; dz <= blockRadius; dz++) {
          for (let dx = -blockRadius; dx <= blockRadius; dx++) {
            const wx = playerBlockX + dx;
            const wz = playerBlockZ + dz;

            const top = world.getTopBlock(wx, wz);
            const northTop = world.getTopBlock(wx, wz - 1);

            const baseColor =
              MAP_BLOCK_COLORS[top.block] ||
              BLOCK_DEFS[top.block]?.iconColor ||
              '#555555';

            let finalColor = baseColor;
            if (top.y > northTop.y) {
              finalColor = adjustBrightness(baseColor, 16);
            } else if (top.y < northTop.y) {
              finalColor = adjustBrightness(baseColor, -16);
            }

            const screenX = pxCenter + dx * pxPerBlock;
            const screenY = pxCenter + dz * pxPerBlock;

            tCtx.fillStyle = finalColor;
            tCtx.fillRect(
              Math.floor(screenX),
              Math.floor(screenY),
              Math.ceil(pxPerBlock),
              Math.ceil(pxPerBlock)
            );
          }
        }
      }
      terrainCacheRef.current = {
        canvas: offscreen,
        bx: playerBlockX,
        bz: playerBlockZ,
        radius: blockRadius,
        version: terrainVersion,
        world,
      };
    } else {
      offscreen = cached.canvas;
    }

    // 1. Blit cached terrain bitmap instantaneously
    ctx.drawImage(offscreen, 0, 0, canvasSize, canvasSize);

    // 3. Render Local Chunk Boundaries Grid (subtle grid for neighboring chunks + current chunk highlight)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    const minChunkX = Math.floor((playerBlockX - blockRadius) / CHUNK_SIZE);
    const maxChunkX = Math.floor((playerBlockX + blockRadius) / CHUNK_SIZE);
    const minChunkZ = Math.floor((playerBlockZ - blockRadius) / CHUNK_SIZE);
    const maxChunkZ = Math.floor((playerBlockZ + blockRadius) / CHUNK_SIZE);

    for (let cx = minChunkX; cx <= maxChunkX + 1; cx++) {
      const lineX = pxCenter + (cx * CHUNK_SIZE - playerPos.x) * pxPerBlock;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, canvasSize);
      ctx.stroke();
    }
    for (let cz = minChunkZ; cz <= maxChunkZ + 1; cz++) {
      const lineZ = pxCenter + (cz * CHUNK_SIZE - playerPos.z) * pxPerBlock;
      ctx.beginPath();
      ctx.moveTo(0, lineZ);
      ctx.lineTo(canvasSize, lineZ);
      ctx.stroke();
    }

    // Draw current 16x16 chunk border in highlighted gold
    const chunkOriginX = currentChunkX * CHUNK_SIZE;
    const chunkOriginZ = currentChunkZ * CHUNK_SIZE;
    const chunkScreenX = pxCenter + (chunkOriginX - playerPos.x) * pxPerBlock;
    const chunkScreenZ = pxCenter + (chunkOriginZ - playerPos.z) * pxPerBlock;
    const chunkScreenSize = CHUNK_SIZE * pxPerBlock;

    ctx.strokeStyle = '#f59e0b'; // Amber-400
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(chunkScreenX, chunkScreenZ, chunkScreenSize, chunkScreenSize);
    ctx.setLineDash([]);

    // 3.5. Render live creatures & bad guys (red/magenta for hostile/boss, emerald for friendly/animals)
    for (const mob of mobs) {
      const relX = mob.x - playerPos.x;
      const relZ = mob.z - playerPos.z;
      if (Math.abs(relX) <= blockRadius && Math.abs(relZ) <= blockRadius) {
        const mx = pxCenter + relX * pxPerBlock;
        const mz = pxCenter + relZ * pxPerBlock;
        ctx.fillStyle =
          mob.category === 'boss'
            ? '#e879f9'
            : mob.category === 'hostile'
            ? '#ef4444'
            : mob.category === 'friendly'
            ? '#38bdf8'
            : '#4ade80';
        ctx.beginPath();
        ctx.arc(mx, mz, mob.category === 'boss' ? 3.5 : 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render other online players (in-range dots + off-range edge beacons)
    for (const other of otherPlayers) {
      const relX = other.x - playerPos.x;
      const relZ = other.z - playerPos.z;
      const inRange = Math.abs(relX) <= blockRadius && Math.abs(relZ) <= blockRadius;

      if (inRange) {
        const otherScreenX = pxCenter + relX * pxPerBlock;
        const otherScreenZ = pxCenter + relZ * pxPerBlock;

        // Subtle pulse ring around remote player
        ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
        ctx.beginPath();
        ctx.arc(otherScreenX, otherScreenZ, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Remote player dot
        ctx.fillStyle = '#06b6d4'; // Cyan
        ctx.beginPath();
        ctx.arc(otherScreenX, otherScreenZ, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Remote player label
        if (other.name) {
          ctx.fillStyle = '#e0f2fe';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(other.name.slice(0, 8), otherScreenX, otherScreenZ - 6);
        }
      } else {
        // Clamp off-screen remote player onto the minimap border edge
        const margin = 9;
        const halfInner = pxCenter - margin;
        const maxAbs = Math.max(Math.abs(relX), Math.abs(relZ), 0.001);
        const edgeX = pxCenter + (relX / maxAbs) * halfInner;
        const edgeZ = pxCenter + (relZ / maxAbs) * halfInner;

        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(edgeX, edgeZ, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#083344';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 5. Render Player Position Marker & Direction Cone
    ctx.save();
    ctx.translate(pxCenter, pxCenter);

    // Heading cone (FOV sight angle)
    const yaw = -playerYaw; // Yaw direction
    ctx.rotate(yaw);

    // Subtle FOV vision cone
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 24, -Math.PI / 4 - Math.PI / 2, Math.PI / 4 - Math.PI / 2);
    ctx.closePath();
    ctx.fill();

    // Directional Player Arrow (Red/White Minecraft Compass Pointer)
    ctx.beginPath();
    ctx.moveTo(0, -9); // Tip facing forward (-Z in world)
    ctx.lineTo(5, 5);  // Right fin
    ctx.lineTo(0, 2);  // Rear indent
    ctx.lineTo(-5, 5); // Left fin
    ctx.closePath();

    ctx.fillStyle = '#ef4444'; // Red pointer
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();

    // 6. Draw Compass Indicators (N, S, E, W) along border
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // North (-Z = top)
    ctx.fillStyle = '#ef4444';
    ctx.fillText('N', pxCenter, 8);

    // South (+Z = bottom)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('S', pxCenter, canvasSize - 8);

    // West (-X = left)
    ctx.fillText('W', 8, pxCenter);

    // East (+X = right)
    ctx.fillText('E', canvasSize - 8, pxCenter);

    // Subtle crosshair tick in center
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pxCenter - 3, pxCenter);
    ctx.lineTo(pxCenter + 3, pxCenter);
    ctx.moveTo(pxCenter, pxCenter - 3);
    ctx.lineTo(pxCenter, pxCenter + 3);
    ctx.stroke();
  }, [world, playerPos.x, playerPos.y, playerPos.z, playerYaw, blockRadius, canvasSize, isCollapsed, currentChunkX, currentChunkZ, otherPlayers, mobs, terrainVersion]);

  return (
    <div className="pointer-events-auto absolute top-2 right-2 sm:top-4 sm:right-4 z-30 origin-top-right scale-[0.72] sm:scale-100 select-none font-mono">
      {/* Studio Mini-Map Frame */}
      <div className="flex flex-col items-end gap-1">
        <div className="relative rounded-xl border border-white/15 bg-neutral-950/80 p-1.5 shadow-2xl backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1 text-[10px] font-bold text-neutral-200">
            <div className="flex items-center gap-1.5">
              <Compass className="h-3 w-3 text-amber-400" />
              <span style={{ fontFamily: '"Silkscreen", monospace' }}>MAP</span>
              <span className="text-[9px] text-amber-300 font-normal">{facing}</span>
            </div>

            {/* Controls: Zoom & Collapse */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => (z === 3 ? 1 : ((z + 1) as 1 | 2 | 3)))}
                className="flex h-4 w-5 items-center justify-center rounded bg-white/10 text-[9px] text-white hover:bg-white/20 transition-colors"
                title={`Zoom Level: ${zoomLevel}x (Click to cycle)`}
              >
                {zoomLevel}x
              </button>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex h-4 w-4 items-center justify-center rounded bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white transition-colors"
                title={isCollapsed ? 'Expand Mini-Map' : 'Minimize Mini-Map'}
              >
                {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Minimap Body */}
          {!isCollapsed && (
            <div className="relative mt-1.5">
              {/* Canvas 2D Surface Viewport */}
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black">
                <canvas
                  ref={canvasRef}
                  style={{
                    width: `${canvasSize}px`,
                    height: `${canvasSize}px`,
                    imageRendering: 'pixelated',
                  }}
                  className="block cursor-crosshair"
                />
              </div>

              {/* Sub-panel Info */}
              <div className="mt-1.5 flex flex-col gap-0.5 rounded-lg bg-black/50 px-2 py-1.5 text-[10px] text-neutral-300 border border-white/10 tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Pos</span>
                  <span className="font-bold text-white">
                    {Math.floor(playerPos.x)}, {Math.floor(playerPos.y)}, {Math.floor(playerPos.z)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Chunk</span>
                  <span className="font-semibold text-amber-300">
                    [{currentChunkX}, {currentChunkZ}]
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Biome</span>
                  <span className="capitalize text-emerald-400">{biome}</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-0.5 mt-0.5">
                  <span className="text-neutral-400">Nearby</span>
                  <span className="font-semibold text-cyan-300">
                    {otherPlayers.length} player{otherPlayers.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
