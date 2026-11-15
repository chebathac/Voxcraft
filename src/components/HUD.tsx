import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { BlockType, DimensionId } from '../game/types';
import { BLOCK_DEFS } from '../game/textures';
import { VoxelWorld } from '../game/world';
import { ConnectionTransport } from '../game/multiplayer';
import { MiniMap } from './MiniMap';
import { RadarMobPoint, TargetedMobInfo } from '../game/mobs';
import { WeaponId, WEAPON_CATALOG, getWeaponIconUrl } from '../game/weapons';
import { CameraViewMode } from '../game/player';
import { POTION_CATALOG, PotionId } from '../game/progression';

interface HUDProps {
  hotbar: BlockType[];
  selectedSlot: number;
  onSelectSlot: (index: number) => void;
  playerPos: { x: number; y: number; z: number };
  playerYaw?: number;
  biome: string;
  fps: number;
  onlineCount: number;
  breakProgress: number;
  isFlying: boolean;
  isLocked: boolean;
  onLockPointer: () => void;
  health: number;
  maxHealth: number;
  isTakingDamage: boolean;
  onRespawn?: () => void;
  onDamageTest?: () => void;
  world?: VoxelWorld | null;
  pickupNotice?: { text: string; iconColor: string; id: number } | null;
  otherPlayers?: { id: string; x: number; z: number; name?: string }[];
  radarMobs?: RadarMobPoint[];
  terrainVersion?: number;
  targetedMob?: TargetedMobInfo | null;
  nearbyNpc?: { id: string; name: string; role: string } | null;
  onInteractNpc?: (npcId: string) => void;
  equippedWeapon?: WeaponId;
  onOpenWeapons?: () => void;
  onOpenMobs?: () => void;
  cameraMode?: CameraViewMode;
  onCycleCamera?: () => void;
  onBackToMenu?: () => void;
  onOpenSettings?: () => void;
  villainAlert?: { wave: number; text: string } | null;
  showMobileControls?: boolean;
  hasModalOpen?: boolean;
  mapCode?: string;
  mapName?: string;
  isCommonMap?: boolean;
  connectionTransport?: ConnectionTransport;
  dimension?: DimensionId;
  coins?: number;
  toolLabel?: string;
  armorLabel?: string;
  showAdvancedTooltips?: boolean;
  activePotions?: Partial<Record<PotionId, number>>;
  isHoeMode?: boolean;
  onToggleHoeMode?: () => void;
  onOpenEmotes?: () => void;
  onOpenStation?: () => void;
  activeEmoteName?: string | null;
  achievementToast?: { name: string; rewardCoins: number } | null;
  f3Notice?: string | null;
}

// Pixel-perfect Minecraft Heart Component (9x9 pixel art)
const MinecraftHeart: React.FC<{
  type: 'full' | 'half' | 'empty';
  isFlashing?: boolean;
  bounce?: boolean;
  delayIndex?: number;
}> = ({ type, isFlashing, bounce, delayIndex = 0 }) => {
  return (
    <div
      className={`relative inline-block h-[18px] w-[18px] transition-transform ${
        bounce ? 'animate-bounce' : ''
      }`}
      style={{
        animationDuration: bounce ? '0.5s' : undefined,
        animationDelay: bounce ? `${(delayIndex % 4) * 80}ms` : undefined,
      }}
    >
      <svg
        viewBox="0 0 9 9"
        className="h-full w-full drop-shadow-[1px_1px_0px_#000]"
        style={{ shapeRendering: 'crispEdges' }}
      >
        {/* Outer Black Pixel Outline */}
        <path
          d="M1 0h2v1h-2z M5 0h2v1h-2z M0 1h1v3h-1z M3 1h2v1h-2z M7 1h1v3h-1z M1 4h1v1h-1z M6 4h1v1h-1z M2 5h1v1h-1z M5 5h1v1h-1z M3 6h2v1h-2z M4 7h1v1h-1z"
          fill="#111111"
        />
        {/* Dark Red/Brown Empty Background */}
        <path
          d="M1 1h2v3h-2z M5 1h2v3h-2z M3 2h2v4h-2z M2 4h1v1h-1z M5 4h1v1h-1z M3 5h2v1h-2z"
          fill="#371010"
        />

        {/* Half or Full Red / Flashing Fill */}
        {type !== 'empty' && (
          <>
            {/* Left Lobe (Filled for both Half and Full) */}
            <path
              d="M1 1h2v3h-1v-1h-1z M2 4h1v1h-1z M3 2h1v4h-1z"
              fill={isFlashing ? '#ffffff' : '#e61c24'}
            />
            {/* White Glint Pixel */}
            {!isFlashing && (
              <rect x="1" y="1" width="1" height="1" fill="#ffffff" />
            )}
            {/* Light Red Highlight */}
            {!isFlashing && (
              <path d="M2 1h1v1h-1z M1 2h1v1h-1z" fill="#ff7575" />
            )}

            {/* Right Lobe (Only for Full Heart) */}
            {type === 'full' && (
              <>
                <path
                  d="M5 1h2v3h-1v1h-1z M4 2h1v4h-1z"
                  fill={isFlashing ? '#ffffff' : '#e61c24'}
                />
                {!isFlashing && (
                  <path d="M5 1h1v1h-1z" fill="#ff7575" />
                )}
              </>
            )}
          </>
        )}
      </svg>
    </div>
  );
};

export const HUD: React.FC<HUDProps> = ({
  hotbar,
  selectedSlot,
  onSelectSlot,
  playerPos,
  playerYaw = 0,
  biome,
  fps,
  onlineCount,
  breakProgress,
  isFlying,
  isLocked,
  onLockPointer,
  health,
  maxHealth,
  isTakingDamage,
  onRespawn,
  onDamageTest,
  world = null,
  pickupNotice = null,
  otherPlayers = [],
  radarMobs = [],
  terrainVersion = 0,
  targetedMob = null,
  nearbyNpc = null,
  onInteractNpc,
  equippedWeapon = 'hand',
  onOpenWeapons,
  onOpenMobs,
  cameraMode = 'first',
  onCycleCamera,
  onBackToMenu,
  onOpenSettings,
  villainAlert = null,
  showMobileControls = false,
  hasModalOpen = false,
  mapCode = 'COMMON',
  mapName = 'Common World',
  isCommonMap = true,
  connectionTransport = 'connecting',
  dimension = 'overworld',
  coins = 0,
  toolLabel,
  armorLabel,
  showAdvancedTooltips = false,
  activePotions = {},
  isHoeMode = false,
  onToggleHoeMode,
  onOpenEmotes,
  onOpenStation,
  activeEmoteName = null,
  achievementToast = null,
  f3Notice = null,
}) => {
  const [copiedMapCode, setCopiedMapCode] = React.useState(false);
  const currentBlockDef = BLOCK_DEFS[hotbar[selectedSlot]];
  const weaponDef = WEAPON_CATALOG[equippedWeapon] || WEAPON_CATALOG.hand;
  const weaponIconUrl = React.useMemo(() => getWeaponIconUrl(equippedWeapon), [equippedWeapon]);
  const cameraLabel =
    cameraMode === 'top_view'
      ? 'Top View'
      : cameraMode === 'third_back'
      ? '3rd Back'
      : cameraMode === 'third_front'
      ? '3rd Front'
      : '1st View';
  const isLowHealth = health > 0 && health <= 4;
  const isRegenerating = health > 0 && health < maxHealth;

  const transportLabel =
    connectionTransport === 'ws'
      ? 'Live'
      : connectionTransport === 'http'
      ? 'Synced'
      : connectionTransport === 'connecting'
      ? 'Connecting...'
      : 'Offline';

  const transportColor =
    connectionTransport === 'ws'
      ? 'text-emerald-400'
      : connectionTransport === 'http'
      ? 'text-cyan-300'
      : connectionTransport === 'connecting'
      ? 'text-amber-300'
      : 'text-rose-400';

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono">
      {/* Red Damage Vignette Flash Screen Effect */}
      <div
        className={`pointer-events-none absolute inset-0 z-40 transition-opacity duration-200 ${
          isTakingDamage ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(220, 20, 20, 0.45) 80%, rgba(180, 0, 0, 0.75) 100%)',
        }}
      />

      {/* Center Minecraft Crosshair (+) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-[2px] bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
          <div className="absolute h-[2px] w-4 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
          {/* Mining Progress Ring */}
          {breakProgress > 0 && (
            <div className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <svg className="h-full w-full -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.5)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#ff3333"
                  strokeWidth="3"
                  strokeDasharray="100.5"
                  strokeDashoffset={100.5 * (1 - breakProgress)}
                  className="transition-all duration-75"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Targeted Creature / Boss Health Bar */}
      {targetedMob && (
        <div className="pointer-events-none absolute top-[calc(50%+26px)] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-neutral-950/85 px-2.5 py-1 shadow-xl backdrop-blur-sm">
            <span
              className={`text-[11px] font-bold ${
                targetedMob.category === 'boss'
                  ? 'text-fuchsia-300'
                  : targetedMob.category === 'hostile'
                  ? 'text-rose-300'
                  : targetedMob.category === 'friendly'
                  ? 'text-cyan-300'
                  : 'text-emerald-300'
              }`}
            >
              {targetedMob.name}
            </span>
            {targetedMob.npcRole && (
              <span className="text-[10px] text-cyan-200/80">· {targetedMob.npcRole}</span>
            )}
            <span className="text-[10px] text-neutral-300 tabular-nums">
              {Math.ceil(targetedMob.health)}/{targetedMob.maxHealth}
            </span>
          </div>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-black/75 border border-white/15">
            <div
              className={`h-full transition-all duration-100 ${
                targetedMob.category === 'boss'
                  ? 'bg-fuchsia-500'
                  : targetedMob.category === 'hostile'
                  ? 'bg-rose-500'
                  : targetedMob.category === 'friendly'
                  ? 'bg-cyan-400'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (targetedMob.health / targetedMob.maxHealth) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Friendly NPC Interaction Prompt (when aiming at or standing near an NPC) */}
      {!hasModalOpen && health > 0 && (targetedMob?.category === 'friendly' || nearbyNpc) && (
        <div
          className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 z-25 ${
            targetedMob ? 'top-[calc(50%+68px)]' : 'top-[calc(50%+28px)]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              const targetId =
                targetedMob?.category === 'friendly' ? targetedMob.id : nearbyNpc?.id;
              if (targetId) onInteractNpc?.(targetId);
            }}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-neutral-950/90 px-3 py-1.5 text-[11px] font-bold text-cyan-200 shadow-2xl backdrop-blur-md hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Talk &amp; Trade: {targetedMob?.category === 'friendly' ? targetedMob.name : nearbyNpc?.name}
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-200">
              Right-Click / R
            </span>
          </button>
        </div>
      )}

      {/* Top Left: Back + 3-Dot Settings + Compact Studio Telemetry & Map Info */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-col gap-1.5 text-[11px] sm:text-xs text-white/90 max-w-[66vw] sm:max-w-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          {onBackToMenu && (
            <button
              type="button"
              onClick={onBackToMenu}
              className="flex h-8 items-center gap-1 rounded-lg border border-white/15 bg-neutral-950/85 px-2.5 text-xs font-bold text-slate-100 shadow-lg backdrop-blur-md hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
              title="Back to Map Selection"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-amber-300" />
              <span>Back</span>
            </button>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-neutral-950/85 text-slate-100 shadow-lg backdrop-blur-md hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
              title="Game Settings"
              aria-label="Open Game Settings"
            >
              <MoreVertical className="h-4 w-4 text-emerald-300" />
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-neutral-950/75 px-2.5 py-1 backdrop-blur-md shadow-lg">
            <span
              className="hidden sm:inline font-bold text-amber-300 tracking-wide text-xs sm:text-sm whitespace-nowrap"
              style={{ fontFamily: '"Silkscreen", monospace' }}
            >
              VoxelCraft
            </span>
            <span className="hidden sm:inline text-white/25" aria-hidden="true">·</span>
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 tabular-nums">
              {fps} FPS
            </span>
            <span className="text-white/25" aria-hidden="true">·</span>
            <span className="text-[10px] sm:text-[11px] font-medium text-cyan-300 tabular-nums">
              {onlineCount} Online
            </span>
            <span className="text-white/25" aria-hidden="true">·</span>
            <span className={`text-[10px] sm:text-[11px] font-semibold ${transportColor}`}>
              {transportLabel}
            </span>
            {isFlying && (
              <>
                <span className="text-white/25" aria-hidden="true">·</span>
                <span className="text-[10px] font-bold text-amber-300 uppercase">
                  Flying
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] sm:text-[11px] text-neutral-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tabular-nums">
          <span>
            {playerPos.x.toFixed(0)}, {playerPos.y.toFixed(0)}, {playerPos.z.toFixed(0)}
          </span>
          <span className="text-white/40" aria-hidden="true">·</span>
          <span className="text-emerald-300 capitalize">{biome}</span>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
          <span className="rounded-md bg-neutral-950/75 px-2 py-0.5 text-neutral-200 border border-white/10 backdrop-blur-sm truncate max-w-[110px] sm:max-w-none">
            {isCommonMap ? 'Common Map' : mapName}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mapCode);
              setCopiedMapCode(true);
              setTimeout(() => setCopiedMapCode(false), 1800);
            }}
            className="rounded-md border border-amber-400/40 bg-neutral-950/80 px-2 py-0.5 font-bold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap"
            title="Click to copy Map Code for friends"
          >
            {copiedMapCode ? 'Copied Code!' : `Code: ${mapCode}`}
          </button>
          {onCycleCamera && (
            <button
              type="button"
              onClick={onCycleCamera}
              className={`rounded-md border px-2 py-0.5 font-semibold transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap ${
                cameraMode === 'top_view'
                  ? 'border-cyan-400/60 bg-cyan-500/25 text-cyan-200'
                  : 'border-white/15 bg-neutral-950/80 text-slate-200 hover:bg-white/10'
              }`}
              title="Switch Camera View (1st / 3rd / Top View)"
            >
              {cameraLabel}
            </button>
          )}
          {onOpenWeapons && (
            <button
              type="button"
              onClick={onOpenWeapons}
              className="flex items-center gap-1 rounded-md border border-amber-400/35 bg-neutral-950/80 px-2 py-0.5 font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap"
              title="Open Weapons Armory"
            >
              <img
                src={weaponIconUrl}
                alt={weaponDef.name}
                className="h-3.5 w-3.5"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="hidden sm:inline">{weaponDef.name}</span>
              <span className="sm:hidden">Weapon</span>
            </button>
          )}
          {onOpenMobs && (
            <button
              type="button"
              onClick={onOpenMobs}
              className="rounded-md border border-rose-400/35 bg-neutral-950/80 px-2 py-0.5 font-semibold text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap"
              title="Spawn Creatures & Bad Guys"
            >
              Mobs
            </button>
          )}
          {onOpenEmotes && (
            <button
              type="button"
              onClick={onOpenEmotes}
              className="rounded-md border border-amber-400/40 bg-neutral-950/80 px-2 py-0.5 font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap"
              title="Emotes & Achievement Shop (Press G)"
            >
              Emotes · {coins}c
            </button>
          )}
          {onOpenStation && (
            <button
              type="button"
              onClick={onOpenStation}
              className="rounded-md border border-fuchsia-400/40 bg-neutral-950/80 px-2 py-0.5 font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20 transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap"
              title="Gear Tiers, Enchanting, Potions & Portals (Press V)"
            >
              Gear &amp; Portals
            </button>
          )}
          {onToggleHoeMode && (
            <button
              type="button"
              onClick={onToggleHoeMode}
              className={`rounded-md border px-2 py-0.5 font-semibold transition-colors cursor-pointer backdrop-blur-sm whitespace-nowrap ${
                isHoeMode
                  ? 'border-lime-400 bg-lime-500/25 text-lime-200'
                  : 'border-white/15 bg-neutral-950/80 text-slate-300 hover:bg-white/10'
              }`}
              title="Toggle Hoe Mode (Press Q): Till Farmland & clear leaves/sculk fast"
            >
              {isHoeMode ? 'Hoe: ON' : 'Hoe'}
            </button>
          )}
          <span
            className={`rounded-md border px-2 py-0.5 font-bold uppercase text-[10px] ${
              dimension === 'nether'
                ? 'border-rose-500/50 bg-rose-950/80 text-rose-200'
                : dimension === 'end'
                ? 'border-fuchsia-500/50 bg-fuchsia-950/80 text-fuchsia-200'
                : 'border-emerald-500/40 bg-emerald-950/70 text-emerald-200'
            }`}
          >
            {dimension === 'overworld' ? 'Overworld' : dimension === 'nether' ? 'The Nether' : 'The End'}
          </span>
        </div>
      </div>

      {/* Non-blocking PC / Laptop Mouse Control Prompt */}
      {!isLocked && !showMobileControls && !hasModalOpen && health > 0 && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/15 bg-neutral-950/85 px-3 py-1.5 shadow-xl backdrop-blur-md">
            <button
              onClick={onLockPointer}
              className="rounded-lg bg-emerald-500 px-3 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              Lock Mouse (FPS)
            </button>
            <span className="hidden sm:inline text-[11px] text-slate-300 whitespace-nowrap">
              or drag mouse freely · Scroll to switch block · Right-Click to place
            </span>
          </div>
        </div>
      )}

      {/* Achievement Unlocked / F3+H / Active Emote Toasts */}
      {achievementToast && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-amber-400 bg-neutral-950/95 px-4 py-2 shadow-2xl">
            <span className="text-amber-300 text-xs font-extrabold uppercase">Achievement!</span>
            <span className="text-xs font-bold text-white">{achievementToast.name}</span>
            <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[11px] font-bold text-amber-300">
              +{achievementToast.rewardCoins}c
            </span>
          </div>
        </div>
      )}

      {(f3Notice || activeEmoteName) && (
        <div className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 z-30">
          <div className="rounded-lg border border-cyan-400/40 bg-neutral-950/85 px-3 py-1 text-[11px] font-bold text-cyan-200 shadow-lg backdrop-blur-sm">
            {f3Notice || `Emote: ${activeEmoteName}`}
          </div>
        </div>
      )}

      {/* Incoming Villains Wave Banner */}
      {villainAlert && health > 0 && (
        <div className="pointer-events-none absolute top-28 sm:top-24 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/60 bg-rose-950/90 px-3.5 py-1.5 shadow-2xl backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-rose-100 whitespace-nowrap">
              Villains Coming (Wave {villainAlert.wave}):{' '}
              <span className="text-amber-300">{villainAlert.text}</span>
            </span>
          </div>
        </div>
      )}

      {/* Minecraft "You Died!" Death Screen */}
      {health === 0 && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#400000]/80 backdrop-blur-sm select-none">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1
              className="text-5xl font-extrabold tracking-wider text-red-500 drop-shadow-[3px_3px_0px_#000000]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              You Died!
            </h1>
            <p
              className="text-base font-bold text-neutral-200 drop-shadow-[2px_2px_0px_#000000]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              Score: <span className="text-amber-400">42</span>
            </p>

            <button
              onClick={onRespawn}
              className="mt-3 cursor-pointer rounded border-2 border-t-white border-l-white border-b-[#222222] border-r-[#222222] bg-[#757575] px-8 py-3 text-base font-bold text-white shadow-2xl transition-all hover:bg-[#888888] active:translate-y-0.5"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              Respawn
            </button>
          </div>
        </div>
      )}

      {/* Top Right: Real-time 2D Canvas Mini-Map Overlay */}
      <MiniMap
        world={world}
        playerPos={playerPos}
        playerYaw={playerYaw}
        biome={biome}
        otherPlayers={otherPlayers}
        mobs={radarMobs}
        terrainVersion={terrainVersion}
      />

      {/* Resource Pickup Notification Toast */}
      {pickupNotice && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 z-20">
          <div className="flex items-center gap-2 rounded border-2 border-t-white border-l-white border-b-[#2c2c2c] border-r-[#2c2c2c] bg-black/85 px-3 py-1.5 shadow-2xl backdrop-blur-sm">
            <div
              className="h-4 w-4 rounded-[1px] shadow-sm flex-shrink-0"
              style={{ backgroundColor: pickupNotice.iconColor, border: '1px solid rgba(0,0,0,0.5)' }}
            />
            <span
              className="text-xs font-bold text-amber-300 drop-shadow-[1px_1px_0px_#000]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              {pickupNotice.text}
            </span>
          </div>
        </div>
      )}

      {/* Active Potions & Gear Durability (F3+H) Readout */}
      {(toolLabel || Object.keys(activePotions).length > 0) && (
        <div className="pointer-events-none hidden sm:flex absolute bottom-28 left-4 z-20 flex-col gap-1 text-[11px]">
          {toolLabel && (
            <div className="rounded-lg border border-white/15 bg-neutral-950/80 px-2.5 py-1 text-slate-200 backdrop-blur-sm">
              <div>{toolLabel}</div>
              {armorLabel && <div className="text-cyan-300">{armorLabel}</div>}
              {showAdvancedTooltips && (
                <div className="text-[10px] text-amber-300">F3+H Tooltips: Exact Durability</div>
              )}
            </div>
          )}
          {Object.entries(activePotions).map(([pid, rem]) => {
            const pDef = POTION_CATALOG[pid as PotionId];
            if (!pDef || !rem) return null;
            return (
              <div
                key={pid}
                className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-neutral-950/85 px-2.5 py-0.5 text-[10px] font-bold text-white"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pDef.color }} />
                <span>{pDef.name.replace('Potion of ', '')}</span>
                <span className="text-emerald-300 tabular-nums">{Math.ceil(rem)}s</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Block Name Floating Tooltip */}
      {currentBlockDef && (
        <div className="hidden sm:block absolute bottom-28 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div
            className="rounded bg-black/75 px-3 py-1 text-sm font-bold text-white drop-shadow-[1px_1px_0px_#000]"
            style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
          >
            {currentBlockDef.name}
            {showAdvancedTooltips && (
              <span className="ml-2 text-[11px] font-normal text-slate-300">
                #{currentBlockDef.id}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Minecraft Controls Section: Hearts + Hunger + Exp Bar + Hotbar */}
      <div className="pointer-events-auto absolute bottom-2 sm:bottom-3 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-0.5 sm:gap-1 max-w-[98vw]">
        
        {/* Minecraft Health & Hunger Bar */}
        <div className="flex w-full max-w-[332px] sm:max-w-[400px] items-center justify-between px-1 text-xs select-none">
          {/* 10 Hearts (Player Health Meter) */}
          <div
            className="flex items-center gap-[1px] sm:gap-0.5 cursor-pointer group origin-left scale-[0.82] sm:scale-100"
            title={`Health: ${health} / ${maxHealth} HP (${(health / 2).toFixed(1)} Hearts)${
              isRegenerating ? ' • Natural Regeneration Active' : ''
            }`}
            onClick={onDamageTest}
          >
            {Array.from({ length: 10 }).map((_, i) => {
              const heartMax = (i + 1) * 2;
              let type: 'full' | 'half' | 'empty' = 'empty';
              if (health >= heartMax) {
                type = 'full';
              } else if (health === heartMax - 1) {
                type = 'half';
              }

              return (
                <MinecraftHeart
                  key={i}
                  type={type}
                  isFlashing={isTakingDamage}
                  bounce={isLowHealth}
                  delayIndex={i}
                />
              );
            })}

            {/* Health Number & Regeneration Indicator */}
            <span
              className="ml-1 text-[11px] font-bold text-white/90 drop-shadow-[1px_1px_0px_#000]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              {health}
              {isRegenerating && (
                <span className="ml-1 text-[9px] text-emerald-400 font-normal">
                  +1
                </span>
              )}
            </span>
          </div>

          {/* 10 Hunger Drumsticks */}
          <div className="flex items-center gap-[1px] sm:gap-0.5 origin-right scale-[0.78] sm:scale-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="text-[#d97c36] drop-shadow-[1px_1px_0px_#000] text-sm leading-none">
                🍗
              </span>
            ))}
          </div>
        </div>

        {/* Experience / Level Bar */}
        <div className="relative flex h-1.5 sm:h-2 w-full max-w-[332px] sm:max-w-[400px] items-center rounded-sm border border-black bg-[#1b2b1b]">
          <div className="h-full w-[65%] bg-gradient-to-r from-[#55ff55] to-[#80ff80] shadow-[0_0_4px_#55ff55]" />
          <span
            className="absolute left-1/2 -top-3 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-[#80ff80] drop-shadow-[1px_1px_0px_#000]"
            style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
          >
            42
          </span>
        </div>

        {/* Minecraft 9-Slot Hotbar (fits 360px+ mobile screens cleanly) */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl border border-white/15 bg-neutral-950/80 p-1 shadow-2xl backdrop-blur-md">
          {hotbar.map((blockType, idx) => {
            const def = BLOCK_DEFS[blockType];
            const isSelected = selectedSlot === idx;

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`relative flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg transition-all ${
                  isSelected
                    ? 'border-2 border-white bg-white/25 scale-105 shadow-[0_0_12px_rgba(255,255,255,0.45)] z-10'
                    : 'border border-white/10 bg-white/5 hover:bg-white/15'
                }`}
              >
                {/* Slot Number */}
                <span className="hidden sm:inline absolute top-0.5 left-1 text-[10px] font-bold text-white/60">
                  {idx + 1}
                </span>

                {/* Block Icon Preview */}
                <div
                  className="h-5 w-5 sm:h-7 sm:w-7 rounded-[3px] shadow-sm"
                  style={{
                    backgroundColor: def?.iconColor || '#888',
                    border: '1px solid rgba(0,0,0,0.45)',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
