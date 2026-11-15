import React from 'react';
import {
  X,
  Settings,
  Eye,
  Gamepad2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Plane,
  Smartphone,
  Swords,
  Skull,
  Package,
  Hammer,
  Flame,
  User,
  LogOut,
  Share2,
  Check,
  Zap,
  MessageSquare,
  Sparkles,
  Globe,
} from 'lucide-react';
import { CameraViewMode } from '../game/player';
import { DimensionId } from '../game/types';
import { ControlScheme, ControlSettings, GraphicsQuality, buildInviteUrl } from '../game/storage';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraMode: CameraViewMode;
  onCameraModeChange: (mode: CameraViewMode) => void;
  controlSettings: ControlSettings;
  onUpdateControlSettings: (patch: Partial<ControlSettings>) => void;
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
  isFlying: boolean;
  onToggleFlying: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  timeOfDay: number;
  onTimeChange: (time: number) => void;
  autoCycle: boolean;
  onToggleAutoCycle: () => void;
  onOpenWeapons: () => void;
  onOpenMobs: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenFurnace: () => void;
  onOpenChat?: () => void;
  onOpenSkinSelector: () => void;
  onOpenEmotes?: () => void;
  onOpenStation?: () => void;
  dimension?: DimensionId;
  onTravelDimension?: (dim: DimensionId) => void;
  onBackToMenu: () => void;
  mapCode: string;
  mapSeed: number;
  mapName: string;
}

const CAMERA_MODES: { id: CameraViewMode; label: string }[] = [
  { id: 'first', label: '1st Person' },
  { id: 'third_back', label: '3rd Back' },
  { id: 'third_front', label: '3rd Front' },
  { id: 'top_view', label: 'Top View' },
];

const CONTROL_SCHEMES: { id: ControlScheme; label: string }[] = [
  { id: 'joystick', label: 'Joystick' },
  { id: 'dpad', label: 'D-Pad' },
  { id: 'swipe', label: 'Swipe Pad' },
];

const GRAPHICS_QUALITIES: { id: GraphicsQuality; label: string; desc: string }[] = [
  { id: 'smooth', label: 'Ultra Smooth', desc: 'Max FPS • Zero Lag' },
  { id: 'balanced', label: 'Balanced', desc: 'Crisp & Smooth' },
  { id: 'high', label: 'High HD', desc: 'Far View • Sharp' },
];

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  cameraMode,
  onCameraModeChange,
  controlSettings,
  onUpdateControlSettings,
  showMobileControls,
  onToggleMobileControls,
  isFlying,
  onToggleFlying,
  isMuted,
  onToggleMute,
  timeOfDay,
  onTimeChange,
  autoCycle,
  onToggleAutoCycle,
  onOpenWeapons,
  onOpenMobs,
  onOpenInventory,
  onOpenCrafting,
  onOpenFurnace,
  onOpenChat,
  onOpenSkinSelector,
  onOpenEmotes,
  onOpenStation,
  dimension = 'overworld',
  onTravelDimension,
  onBackToMenu,
  mapCode,
  mapSeed,
  mapName,
}) => {
  const [copiedInvite, setCopiedInvite] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(buildInviteUrl(mapCode, mapSeed, mapName));
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm select-none">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Game Settings</h2>
              <p className="text-xs text-slate-400">
                World: <span className="font-semibold text-amber-300">{mapName}</span> ({mapCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Close game settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
          {/* Camera Perspective */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>Camera Perspective</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CAMERA_MODES.map((m) => {
                const active = cameraMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onCameraModeChange(m.id)}
                    className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-white/10 bg-[#0b1016] text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Performance / Zero-Lag Graphics Mode */}
          <section>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Performance &amp; Zero-Lag Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GRAPHICS_QUALITIES.map((q) => {
                const active = controlSettings.graphicsQuality === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onUpdateControlSettings({ graphicsQuality: q.id })}
                    className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-[#0b1016] text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold">{q.label}</span>
                    <span className="text-[10px] text-slate-400">{q.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Controls & Touch Settings */}
          <section className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Controls &amp; Touch</span>
              </div>
              <button
                type="button"
                onClick={onToggleMobileControls}
                className={`flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  showMobileControls
                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-white/15 bg-white/5 text-slate-400'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Touch Pad: {showMobileControls ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {CONTROL_SCHEMES.map((s) => {
                const active = controlSettings.scheme === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onUpdateControlSettings({ scheme: s.id })}
                    className={`min-h-[40px] rounded-lg border px-2 py-1.5 text-xs font-bold cursor-pointer ${
                      active
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300">Touch Look Sensitivity</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {controlSettings.lookSensitivity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.2"
                step="0.1"
                value={controlSettings.lookSensitivity}
                onChange={(e) =>
                  onUpdateControlSettings({ lookSensitivity: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateControlSettings({ autoJump: !controlSettings.autoJump })}
                className="flex min-h-[42px] items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs cursor-pointer hover:bg-white/10"
              >
                <span>Auto-Jump Ledges</span>
                <span className={controlSettings.autoJump ? 'font-bold text-emerald-400' : 'text-slate-500'}>
                  {controlSettings.autoJump ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateControlSettings({ tapScreenToBuild: !controlSettings.tapScreenToBuild })
                }
                className="flex min-h-[42px] items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs cursor-pointer hover:bg-white/10"
              >
                <span>Tap Screen to Build</span>
                <span className={controlSettings.tapScreenToBuild ? 'font-bold text-emerald-400' : 'text-slate-500'}>
                  {controlSettings.tapScreenToBuild ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </section>

          {/* Audio, Flight & World Time */}
          <section className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onToggleMute}
                className="flex min-h-[42px] items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                  <span>Sound FX</span>
                </span>
                <span className={isMuted ? 'text-rose-400' : 'text-emerald-400'}>
                  {isMuted ? 'MUTED' : 'ON'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleFlying}
                className="flex min-h-[42px] items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-amber-400" />
                  <span>Flight Mode</span>
                </span>
                <span className={isFlying ? 'text-amber-300' : 'text-slate-500'}>
                  {isFlying ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {timeOfDay > 0.25 && timeOfDay < 0.75 ? (
                <Sun className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-300 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">World Time</span>
                  <button
                    type="button"
                    onClick={onToggleAutoCycle}
                    className="text-[11px] font-semibold text-amber-300 hover:underline cursor-pointer"
                  >
                    Cycle: {autoCycle ? 'Auto' : 'Paused'}
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={timeOfDay}
                  onChange={(e) => onTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Game Menus & Quick Tools */}
          <section>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Game Tools &amp; Loadout
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWeapons();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
              >
                <Swords className="h-4 w-4 text-amber-400" />
                <span>Weapons</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMobs();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/20 cursor-pointer"
              >
                <Skull className="h-4 w-4 text-rose-400" />
                <span>Mobs &amp; Bosses</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInventory();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <Package className="h-4 w-4 text-amber-400" />
                <span>Inventory</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCrafting();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <Hammer className="h-4 w-4 text-emerald-400" />
                <span>Crafting</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFurnace();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <Flame className="h-4 w-4 text-orange-400" />
                <span>Furnace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSkinSelector();
                }}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
              >
                <User className="h-4 w-4 text-indigo-400" />
                <span>Skin &amp; Name</span>
              </button>
              {onOpenChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenChat();
                  }}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-cyan-400" />
                  <span>Chat (T)</span>
                </button>
              )}
              {onOpenEmotes && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEmotes();
                  }}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Emotes &amp; Shop (G)</span>
                </button>
              )}
              {onOpenStation && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStation();
                  }}
                  className="flex min-h-[44px] items-center gap-2 rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/20 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-fuchsia-400" />
                  <span>Enchants &amp; Gear (V)</span>
                </button>
              )}
            </div>
          </section>

          {onTravelDimension && (
            <section>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>Dimensions</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['overworld', 'nether', 'end'] as DimensionId[]).map((dim) => (
                  <button
                    key={dim}
                    type="button"
                    disabled={dimension === dim}
                    onClick={() => {
                      onTravelDimension(dim);
                      onClose();
                    }}
                    className={`min-h-[40px] rounded-xl border px-3 py-2 text-xs font-bold uppercase cursor-pointer ${
                      dimension === dim
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-white/10 bg-[#0b1016] text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {dim}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Actions: Invite & Leave World */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCopyInvite}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 cursor-pointer"
            >
              {copiedInvite ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              <span>{copiedInvite ? `Copied Code ${mapCode}!` : `Copy Invite (${mapCode})`}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBackToMenu();
              }}
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Back to Maps Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
