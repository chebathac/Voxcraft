import React, { useState } from 'react';
import { CameraViewMode } from '../game/player';
import { buildInviteUrl } from '../game/storage';
import {
  Eye,
  Plane,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Package,
  Hammer,
  MessageSquare,
  User,
  Share2,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Check,
  Heart,
  Flame,
  LogOut,
  Swords,
  Skull,
  Sparkles,
  Wrench,
} from 'lucide-react';

interface BottomControlDockProps {
  health: number;
  onTakeDamage: () => void;
  cameraMode: CameraViewMode;
  onCameraModeChange: (mode: CameraViewMode) => void;
  isFlying: boolean;
  onToggleFlying: () => void;
  timeOfDay: number;
  onTimeChange: (time: number) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenFurnace?: () => void;
  onOpenWeapons?: () => void;
  onOpenMobs?: () => void;
  onOpenChat: () => void;
  onOpenSkinSelector: () => void;
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
  mapCode?: string;
  mapSeed?: number;
  mapName?: string;
  onBackToMenu?: () => void;
  onOpenEmotes?: () => void;
  onOpenStation?: () => void;
  isHoeMode?: boolean;
  onToggleHoeMode?: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  health,
  onTakeDamage,
  cameraMode,
  onCameraModeChange,
  isFlying,
  onToggleFlying,
  timeOfDay,
  onTimeChange,
  autoCycle,
  onToggleAutoCycle,
  isMuted,
  onToggleMute,
  onOpenInventory,
  onOpenCrafting,
  onOpenFurnace,
  onOpenWeapons,
  onOpenMobs,
  onOpenChat,
  onOpenSkinSelector,
  showMobileControls,
  onToggleMobileControls,
  mapCode = 'COMMON',
  mapSeed,
  mapName,
  onBackToMenu,
  onOpenEmotes,
  onOpenStation,
  isHoeMode = false,
  onToggleHoeMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== 'undefined' &&
    ((window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 768)
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = buildInviteUrl(mapCode, mapSeed, mapName);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div
      className="pointer-events-auto fixed z-40 transition-transform duration-300 font-mono select-none"
      style={{
        bottom: '84px', // Sits cleanly above mobile & desktop hotbars
        left: '50%',
        transform: isCollapsed ? 'translate(-50%, calc(100% + 16px))' : 'translateX(-50%)',
        maxWidth: 'min(940px, 94vw)',
      }}
    >
      {/* Collapse / Expand Tab Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex min-h-[32px] items-center gap-1.5 rounded-t-lg border-t border-x border-neutral-700 bg-neutral-900/90 px-3 py-1 text-[11px] font-semibold text-neutral-300 shadow-lg hover:bg-neutral-800 hover:text-white transition-colors whitespace-nowrap"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="h-3 w-3 text-amber-400" />
              <span>Menu / Tools</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 text-amber-400" />
              <span>Hide Menu</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-950/90 p-2 shadow-2xl backdrop-blur-md text-xs text-neutral-300">
        {/* Camera Views */}
        <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900/80 p-0.5">
          <button
            onClick={() => onCameraModeChange('first')}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
              cameraMode === 'first' ? 'bg-amber-500 font-bold text-black' : 'hover:text-white'
            }`}
            title="First Person (Press F5)"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>1st</span>
          </button>
          <button
            onClick={() => onCameraModeChange('third_back')}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
              cameraMode === 'third_back' ? 'bg-amber-500 font-bold text-black' : 'hover:text-white'
            }`}
            title="Third Person Back (Press F5)"
          >
            <span>3rd Back</span>
          </button>
          <button
            onClick={() => onCameraModeChange('third_front')}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
              cameraMode === 'third_front' ? 'bg-amber-500 font-bold text-black' : 'hover:text-white'
            }`}
            title="Third Person Front (Press F5)"
          >
            <span>3rd Front</span>
          </button>
          <button
            onClick={() => onCameraModeChange('top_view')}
            className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
              cameraMode === 'top_view' ? 'bg-amber-500 font-bold text-black' : 'hover:text-white'
            }`}
            title="Overhead Top View (Press F5)"
          >
            <span>Top View</span>
          </button>
        </div>

        {/* Flight Mode */}
        <button
          onClick={onToggleFlying}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all ${
            isFlying
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-semibold'
              : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800'
          }`}
          title="Toggle Flight (Double Tap Space)"
        >
          <Plane className="h-3.5 w-3.5" />
          <span>Flight: {isFlying ? 'ON' : 'OFF'}</span>
        </button>

        {/* Day / Night Control */}
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1">
          {timeOfDay > 0.25 && timeOfDay < 0.75 ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-300" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={timeOfDay}
            onChange={(e) => onTimeChange(parseFloat(e.target.value))}
            className="w-16 accent-amber-500 cursor-pointer"
            title="Time of Day"
          />
          <button
            onClick={onToggleAutoCycle}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              autoCycle ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-500'
            }`}
          >
            Cycle: {autoCycle ? 'Auto' : 'Static'}
          </button>
        </div>

        {/* Audio Mute */}
        <button
          onClick={onToggleMute}
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 hover:bg-neutral-800 hover:text-white"
          title="Toggle Procedural Audio"
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
        </button>

        {/* Damage Test Button */}
        <button
          onClick={onTakeDamage}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-2.5 py-1.5 text-red-300 hover:bg-red-900/50 active:scale-95 transition-transform"
          title="Simulate Damage (-4 HP / 2 Hearts) to watch Heart Meter drop & regenerate over time"
        >
          <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400" />
          <span>Hurt (-4 HP)</span>
        </button>

        {/* Inventory ('E') */}
        <button
          onClick={onOpenInventory}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 hover:bg-neutral-800 hover:text-white"
          title="Open Inventory (E)"
        >
          <Package className="h-3.5 w-3.5 text-amber-400" />
          <span>Inventory (E)</span>
        </button>

        {/* Crafting Table ('C') */}
        <button
          onClick={onOpenCrafting}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-amber-300 hover:bg-amber-500/20"
          title="Open Crafting Table (C)"
        >
          <Hammer className="h-3.5 w-3.5 text-amber-400" />
          <span>Crafting (C)</span>
        </button>

        {/* Furnace ('B') */}
        {onOpenFurnace && (
          <button
            onClick={onOpenFurnace}
            className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-orange-300 hover:bg-orange-500/20"
            title="Open Furnace Smelter (B)"
          >
            <Flame className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
            <span>Furnace (B)</span>
          </button>
        )}

        {/* Weapons Armory */}
        {onOpenWeapons && (
          <button
            onClick={onOpenWeapons}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-amber-300 hover:bg-amber-500/25"
            title="Equip Swords, Axes, Scythes & Energy Blades"
          >
            <Swords className="h-3.5 w-3.5 text-amber-400" />
            <span>Weapons</span>
          </button>
        )}

        {/* Mobs / Creatures */}
        {onOpenMobs && (
          <button
            onClick={onOpenMobs}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-rose-300 hover:bg-rose-500/25"
            title="Spawn & View Creatures / Bad Guys"
          >
            <Skull className="h-3.5 w-3.5 text-rose-400" />
            <span>Mobs</span>
          </button>
        )}

        {/* Emotes & Coin Shop ('G') */}
        {onOpenEmotes && (
          <button
            onClick={onOpenEmotes}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-amber-300 hover:bg-amber-500/25"
            title="Emotes & Achievements Shop (G)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Emotes (G)</span>
          </button>
        )}

        {/* Enchants, Gear & Portals ('V') */}
        {onOpenStation && (
          <button
            onClick={onOpenStation}
            className="flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/15 px-2.5 py-1.5 text-fuchsia-300 hover:bg-fuchsia-500/25"
            title="Gear Tiers, Enchants, Potions & Dimensions (V)"
          >
            <Wrench className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>Gear &amp; Portals (V)</span>
          </button>
        )}

        {/* Hoe Mode ('Q') */}
        {onToggleHoeMode && (
          <button
            onClick={onToggleHoeMode}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all ${
              isHoeMode
                ? 'border-lime-400 bg-lime-500/20 text-lime-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800'
            }`}
            title="Toggle Hoe Mode (Q) to till Farmland & fast-clear sculk/leaves"
          >
            <span>Hoe (Q): {isHoeMode ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* Chat ('T') */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 hover:bg-neutral-800 hover:text-white"
          title="Open Chat (T)"
        >
          <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
          <span>Chat (T)</span>
        </button>

        {/* Character Skin */}
        <button
          onClick={onOpenSkinSelector}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 hover:bg-neutral-800 hover:text-white"
          title="Change Skin & Name"
        >
          <User className="h-3.5 w-3.5 text-indigo-400" />
          <span>Skin</span>
        </button>

        {/* Mobile Touch Overlay Toggle */}
        <button
          onClick={onToggleMobileControls}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 ${
            showMobileControls
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
              : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800'
          }`}
          title="Toggle Mobile Touch Controls"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Touch</span>
        </button>

        {/* Share Multiplayer Map Code / Invite Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1.5 text-amber-300 hover:bg-amber-500/25"
          title={mapCode !== 'COMMON' ? `Copy Invite Link (Code: ${mapCode})` : 'Copy Link to Invite Friends'}
        >
          {copiedLink ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">
                {mapCode !== 'COMMON' ? `Copied ${mapCode}!` : 'Copied!'}
              </span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              <span>{mapCode !== 'COMMON' ? `Invite (${mapCode})` : 'Invite'}</span>
            </>
          )}
        </button>

        {/* Return to First Screen / Switch Maps */}
        {onBackToMenu && (
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="Return to Map Selection Screen"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span>Maps</span>
          </button>
        )}
      </div>
    </div>
  );
};
