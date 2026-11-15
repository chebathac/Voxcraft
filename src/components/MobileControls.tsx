import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Pickaxe,
  Hammer,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Plane,
  Shield,
  Layers,
  Footprints,
  SlidersHorizontal,
  Gamepad2,
  Compass,
  Hand,
  X,
  Play,
  Swords,
  Menu,
} from 'lucide-react';
import { ControlScheme, ControlSettings } from '../game/storage';

interface MobileControlsProps {
  controlSettings: ControlSettings;
  onUpdateControlSettings: (patch: Partial<ControlSettings>) => void;
  onAnalogMove: (vec: { x: number; y: number }) => void;
  onDirectionChange: (dir: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => void;
  onJumpPress: (pressed: boolean) => void;
  onMinePress: (pressed: boolean) => void;
  onAttackPress?: () => void;
  onPlacePress: () => void;
  onContinuousPlace?: (active: boolean) => void;
  onTowerUp?: () => void;
  onBridgeForward?: () => void;
  onSneakToggle?: () => void;
  isSneaking?: boolean;
  onFlyToggle: () => void;
  isFlying: boolean;
  targetBlockName?: string | null;
  onOpenMenu?: () => void;
}

const SCHEME_OPTIONS: { id: ControlScheme; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: 'joystick',
    label: 'Joystick',
    hint: 'Floating 360° analog thumbstick with auto-sprint rim',
    icon: <Gamepad2 className="h-4 w-4" />,
  },
  {
    id: 'dpad',
    label: 'D-Pad',
    hint: 'Classic 4-way crosshair pad for accurate bridging & building',
    icon: <Compass className="h-4 w-4" />,
  },
  {
    id: 'swipe',
    label: 'Swipe Pad',
    hint: 'Minimal drag-anywhere left zone + optional auto-walk',
    icon: <Hand className="h-4 w-4" />,
  },
];

export const MobileControls: React.FC<MobileControlsProps> = ({
  controlSettings,
  onUpdateControlSettings,
  onAnalogMove,
  onDirectionChange,
  onJumpPress,
  onMinePress,
  onAttackPress,
  onPlacePress,
  onContinuousPlace,
  onTowerUp,
  onBridgeForward,
  onSneakToggle,
  isSneaking = false,
  onFlyToggle,
  isFlying,
  targetBlockName = null,
  onOpenMenu,
}) => {
  const { scheme, lookSensitivity, autoJump, tapScreenToBuild } = controlSettings;

  // Settings drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Floating Joystick / Swipe Pad state
  const moveZoneRef = useRef<HTMLDivElement>(null);
  const activeMovePointerId = useRef<number | null>(null);
  const [isMoveActive, setIsMoveActive] = useState(false);
  const [stickOrigin, setStickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSprintRim, setIsSprintRim] = useState(false);

  // D-Pad slide tracking
  const dpadRef = useRef<HTMLDivElement>(null);
  const activeDpadPointerId = useRef<number | null>(null);
  const [dpadActiveDir, setDpadActiveDir] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Auto-walk toggle for Swipe Pad mode
  const [autoWalk, setAutoWalk] = useState(false);

  // Continuous Build / Auto-Place timer
  const [isContinuousBuilding, setIsContinuousBuilding] = useState(false);
  const continuousBuildIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STICK_RADIUS = 46;

  const onAnalogMoveRef = useRef(onAnalogMove);
  onAnalogMoveRef.current = onAnalogMove;
  const onDirectionChangeRef = useRef(onDirectionChange);
  onDirectionChangeRef.current = onDirectionChange;

  // Reset movement cleanly only when switching control schemes
  useEffect(() => {
    activeMovePointerId.current = null;
    activeDpadPointerId.current = null;
    setIsMoveActive(false);
    setStickOrigin(null);
    setKnobOffset({ x: 0, y: 0 });
    setIsSprintRim(false);
    setAutoWalk(false);
    setDpadActiveDir({ forward: false, backward: false, left: false, right: false });
    onAnalogMoveRef.current({ x: 0, y: 0 });
    onDirectionChangeRef.current({ forward: false, backward: false, left: false, right: false });
  }, [scheme]);

  // Keep auto-walk running smoothly when enabled in Swipe mode
  useEffect(() => {
    if (scheme === 'swipe' && autoWalk && !isMoveActive) {
      onAnalogMove({ x: 0, y: 0.78 });
    }
  }, [scheme, autoWalk, isMoveActive, onAnalogMove]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (continuousBuildIntervalRef.current) {
        clearInterval(continuousBuildIntervalRef.current);
      }
    };
  }, []);

  // --- FLOATING ANALOG JOYSTICK & SWIPE PAD HANDLERS ---
  const updateAnalogFromPointer = useCallback(
    (clientX: number, clientY: number, originX: number, originY: number) => {
      const dx = clientX - originX;
      const dy = clientY - originY;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(dist, STICK_RADIUS);
      const angle = Math.atan2(dy, dx);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;
      setKnobOffset({ x: kx, y: ky });

      const ratio = clampedDist / STICK_RADIUS;
      if (ratio < 0.14) {
        setIsSprintRim(false);
        onAnalogMove({ x: 0, y: 0 });
        return;
      }

      // Rescale smoothly from deadzone (0.14..1.0 -> 0..1.0)
      const smoothMag = (ratio - 0.14) / 0.86;
      const unitX = Math.cos(angle);
      const unitY = Math.sin(angle);

      setIsSprintRim(ratio > 0.88);
      // Screen Y down is backward (-y), screen Y up is forward (+y)
      onAnalogMove({
        x: unitX * smoothMag,
        y: -unitY * smoothMag,
      });
    },
    [onAnalogMove]
  );

  const handleMovePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeMovePointerId.current !== null) return;
    activeMovePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture failure on synthetic events
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    // Clamp floating anchor inside pad bounds so ring never clips off-edge
    const clampedOriginX = Math.max(48, Math.min(rect.width - 48, localX));
    const clampedOriginY = Math.max(48, Math.min(rect.height - 48, localY));

    setStickOrigin({ x: clampedOriginX, y: clampedOriginY });
    setIsMoveActive(true);
    setAutoWalk(false);
    updateAnalogFromPointer(
      e.clientX,
      e.clientY,
      rect.left + clampedOriginX,
      rect.top + clampedOriginY
    );
  };

  const handleMovePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeMovePointerId.current || !stickOrigin || !moveZoneRef.current) return;
    e.stopPropagation();
    const rect = moveZoneRef.current.getBoundingClientRect();
    updateAnalogFromPointer(
      e.clientX,
      e.clientY,
      rect.left + stickOrigin.x,
      rect.top + stickOrigin.y
    );
  };

  const handleMovePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeMovePointerId.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activeMovePointerId.current = null;
    setIsMoveActive(false);
    setStickOrigin(null);
    setKnobOffset({ x: 0, y: 0 });
    setIsSprintRim(false);
    onAnalogMove({ x: 0, y: 0 });
  };

  // --- CLASSIC D-PAD SLIDE-ACROSS HANDLERS ---
  const computeDpadDirection = useCallback(
    (clientX: number, clientY: number) => {
      if (!dpadRef.current) return;
      const rect = dpadRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);

      // Center deadzone hits Sneak button separately, but slide outside center moves smoothly
      if (Math.hypot(dx, dy) < 0.28) {
        const neutral = { forward: false, backward: false, left: false, right: false };
        setDpadActiveDir(neutral);
        onDirectionChange(neutral);
        return;
      }

      const next = {
        forward: dy < -0.25,
        backward: dy > 0.25,
        left: dx < -0.25,
        right: dx > 0.25,
      };
      setDpadActiveDir(next);
      onDirectionChange(next);
    },
    [onDirectionChange]
  );

  const handleDpadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeDpadPointerId.current !== null) return;
    activeDpadPointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    computeDpadDirection(e.clientX, e.clientY);
  };

  const handleDpadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeDpadPointerId.current) return;
    e.stopPropagation();
    computeDpadDirection(e.clientX, e.clientY);
  };

  const handleDpadPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activeDpadPointerId.current) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    activeDpadPointerId.current = null;
    const neutral = { forward: false, backward: false, left: false, right: false };
    setDpadActiveDir(neutral);
    onDirectionChange(neutral);
  };

  // --- CONTINUOUS EASY-BUILD HANDLERS ---
  const startContinuousBuild = useCallback(() => {
    setIsContinuousBuilding(true);
    onPlacePress();
    onContinuousPlace?.(true);

    if (continuousBuildIntervalRef.current) clearInterval(continuousBuildIntervalRef.current);
    continuousBuildIntervalRef.current = setInterval(() => {
      onPlacePress();
    }, 160);
  }, [onPlacePress, onContinuousPlace]);

  const stopContinuousBuild = useCallback(() => {
    setIsContinuousBuilding(false);
    onContinuousPlace?.(false);
    if (continuousBuildIntervalRef.current) {
      clearInterval(continuousBuildIntervalRef.current);
      continuousBuildIntervalRef.current = null;
    }
  }, [onContinuousPlace]);

  const activeSchemeMeta = SCHEME_OPTIONS.find((s) => s.id === scheme) || SCHEME_OPTIONS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 select-none overflow-hidden font-mono">
      {/* Quick Control Switcher, Separate Menu Button & Target Label */}
      <div className="pointer-events-none absolute top-[122px] left-2 sm:top-3 sm:left-1/2 sm:-translate-x-1/2 flex flex-col items-start sm:items-center gap-1.5 z-30">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setIsSettingsOpen((prev) => !prev)}
          className="pointer-events-auto flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/25 bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md hover:bg-black/85 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          title="Switch Mobile Control Style & Sensitivity"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
          <span>Controls: {activeSchemeMeta.label}</span>
        </button>

        {onOpenMenu && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setIsSettingsOpen(false);
              onOpenMenu();
            }}
            className="pointer-events-auto flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-400/45 bg-black/75 px-3 py-1 text-[11px] font-bold text-emerald-200 shadow-lg backdrop-blur-md hover:bg-emerald-500/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            title="Open Game Menu & Tools"
          >
            <Menu className="h-3.5 w-3.5 text-emerald-400" />
            <span>Menu</span>
          </button>
        )}

        {targetBlockName && (
          <div className="rounded bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm border border-emerald-400/30 whitespace-nowrap">
            Target: {targetBlockName}
          </div>
        )}
      </div>

      {/* Control System Switcher & Sensitivity Panel */}
      {isSettingsOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="pointer-events-auto fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,360px)] rounded-2xl border border-white/20 bg-neutral-950/95 p-4 text-white shadow-2xl backdrop-blur-lg"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold tracking-wide">Mobile Control System</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
              aria-label="Close control settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 3 Control Scheme Cards */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SCHEME_OPTIONS.map((opt) => {
              const selected = scheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateControlSettings({ scheme: opt.id })}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 min-h-[58px] text-[11px] font-bold transition-all active:scale-95 ${
                    selected
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-md'
                      : 'border-white/15 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  {opt.icon}
                  <span className="whitespace-nowrap">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-300 mb-3 leading-snug">
            {activeSchemeMeta.hint}
          </p>

          {/* Sensitivity Slider */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-neutral-300">Touch Look Speed</span>
              <span className="font-bold text-amber-300 tabular-nums">{lookSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.2"
              step="0.1"
              value={lookSensitivity}
              onChange={(e) => onUpdateControlSettings({ lookSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Smooth Gameplay Toggles */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onUpdateControlSettings({ autoJump: !autoJump })}
              className="flex min-h-[44px] items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              <span className="text-neutral-200">Auto-Jump 1-Block Ledges</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  autoJump ? 'bg-emerald-500/25 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {autoJump ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateControlSettings({ tapScreenToBuild: !tapScreenToBuild })}
              className="flex min-h-[44px] items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
            >
              <span className="text-neutral-200">Tap Screen to Place Block</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  tapScreenToBuild ? 'bg-emerald-500/25 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {tapScreenToBuild ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== LEFT MOVEMENT ZONE ==================== */}
      {/* SCHEME 1: FLOATING ANALOG JOYSTICK */}
      {scheme === 'joystick' && (
        <div
          ref={moveZoneRef}
          onPointerDown={handleMovePointerDown}
          onPointerMove={handleMovePointerMove}
          onPointerUp={handleMovePointerEnd}
          onPointerCancel={handleMovePointerEnd}
          onTouchStart={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute bottom-20 left-2 sm:bottom-10 sm:left-6 h-40 w-40 touch-none"
        >
          {/* Floating Base (anchors where thumb touches, or rests bottom-left) */}
          <div
            className={`absolute flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 backdrop-blur-md transition-colors ${
              isSprintRim
                ? 'border-amber-400 bg-amber-950/45 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
                : 'border-white/30 bg-black/45 shadow-2xl'
            }`}
            style={{
              left: stickOrigin ? stickOrigin.x : '50%',
              top: stickOrigin ? stickOrigin.y : '54%',
            }}
          >
            <div className="absolute h-full w-[1px] bg-white/10" />
            <div className="absolute h-[1px] w-full bg-white/10" />
            {isSprintRim && (
              <span className="absolute -top-5 text-[9px] font-bold tracking-wider text-amber-300 drop-shadow">
                SPRINT
              </span>
            )}

            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/75 bg-gradient-to-br from-neutral-100/90 to-neutral-400/90 shadow-xl"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            >
              <Footprints className="h-5 w-5 text-neutral-800" />
            </div>
          </div>
        </div>
      )}

      {/* SCHEME 2: CLASSIC MINECRAFT CROSSHAIR D-PAD */}
      {scheme === 'dpad' && (
        <div className="pointer-events-auto absolute bottom-24 left-3 sm:bottom-10 sm:left-7 flex flex-col items-center">
          <div
            ref={dpadRef}
            onPointerDown={handleDpadPointerDown}
            onPointerMove={handleDpadPointerMove}
            onPointerUp={handleDpadPointerEnd}
            onPointerCancel={handleDpadPointerEnd}
            onTouchStart={(e) => e.stopPropagation()}
            className="grid grid-cols-3 grid-rows-3 gap-1 rounded-2xl border border-white/20 bg-black/35 p-1.5 backdrop-blur-sm touch-none shadow-2xl"
          >
            {/* Top-Left Diagonal Visual */}
            <div
              className={`h-11 w-11 rounded-lg border border-white/10 ${
                dpadActiveDir.forward && dpadActiveDir.left ? 'bg-amber-400/40' : 'bg-black/20'
              }`}
            />
            {/* Forward */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                dpadActiveDir.forward
                  ? 'border-amber-300 bg-amber-500/80 text-black'
                  : 'border-white/25 bg-black/55 text-white'
              }`}
            >
              <ArrowUp className="h-5 w-5" />
            </div>
            {/* Top-Right Diagonal Visual */}
            <div
              className={`h-11 w-11 rounded-lg border border-white/10 ${
                dpadActiveDir.forward && dpadActiveDir.right ? 'bg-amber-400/40' : 'bg-black/20'
              }`}
            />

            {/* Left */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                dpadActiveDir.left
                  ? 'border-amber-300 bg-amber-500/80 text-black'
                  : 'border-white/25 bg-black/55 text-white'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </div>
            {/* Center Sneak Button */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSneakToggle?.();
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                isSneaking
                  ? 'border-indigo-300 bg-indigo-500 text-white'
                  : 'border-white/25 bg-neutral-800/80 text-neutral-200'
              }`}
              title="Toggle Sneak / Edge Safe"
            >
              <Shield className="h-4 w-4" />
            </button>
            {/* Right */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                dpadActiveDir.right
                  ? 'border-amber-300 bg-amber-500/80 text-black'
                  : 'border-white/25 bg-black/55 text-white'
              }`}
            >
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Bottom-Left */}
            <div className="h-11 w-11 rounded-lg border border-white/10 bg-black/20" />
            {/* Backward */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                dpadActiveDir.backward
                  ? 'border-amber-300 bg-amber-500/80 text-black'
                  : 'border-white/25 bg-black/55 text-white'
              }`}
            >
              <ArrowDown className="h-5 w-5" />
            </div>
            {/* Bottom-Right */}
            <div className="h-11 w-11 rounded-lg border border-white/10 bg-black/20" />
          </div>
        </div>
      )}

      {/* SCHEME 3: SWIPE MOVE (SPLIT-SCREEN FREE TOUCH + AUTO-WALK) */}
      {scheme === 'swipe' && (
        <div className="pointer-events-none absolute bottom-22 left-2 sm:bottom-10 sm:left-6 flex flex-col items-start gap-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              const next = !autoWalk;
              setAutoWalk(next);
              if (!next) onAnalogMove({ x: 0, y: 0 });
            }}
            className={`pointer-events-auto flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-sm active:scale-95 transition-all ${
              autoWalk
                ? 'border-emerald-300 bg-emerald-600/85 text-white'
                : 'border-white/25 bg-black/55 text-white/90'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>{autoWalk ? 'Auto-Walk: ON' : 'Auto-Walk'}</span>
          </button>

          <div
            ref={moveZoneRef}
            onPointerDown={handleMovePointerDown}
            onPointerMove={handleMovePointerMove}
            onPointerUp={handleMovePointerEnd}
            onPointerCancel={handleMovePointerEnd}
            onTouchStart={(e) => e.stopPropagation()}
            className="pointer-events-auto relative flex h-36 w-40 items-center justify-center rounded-2xl border border-dashed border-white/25 bg-black/20 backdrop-blur-[2px] touch-none"
          >
            {!isMoveActive ? (
              <div className="flex flex-col items-center text-center px-2 text-white/75">
                <Hand className="h-5 w-5 mb-1 text-amber-300" />
                <span className="text-[10px] font-bold">Swipe to Walk</span>
                <span className="text-[9px] text-white/60">Push far to sprint</span>
              </div>
            ) : (
              stickOrigin && (
                <div
                  className={`absolute flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${
                    isSprintRim ? 'border-amber-400 bg-amber-500/20' : 'border-white/40 bg-white/10'
                  }`}
                  style={{ left: stickOrigin.x, top: stickOrigin.y }}
                >
                  <div
                    className="h-10 w-10 rounded-full bg-white/85 shadow-lg"
                    style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ==================== RIGHT SIDE ACTION & EASY-BUILD ARC ==================== */}
      <div className="pointer-events-auto absolute bottom-24 right-3 sm:bottom-10 sm:right-6 flex flex-col items-end gap-2">
        {/* Row 1: Combat Strike, Bridge, Tower Up, Sneak */}
        <div className="flex items-center gap-1.5">
          {onAttackPress && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onAttackPress();
              }}
              className="flex h-11 px-3 items-center gap-1.5 rounded-xl border border-amber-400/70 bg-amber-600/75 text-white shadow-lg active:scale-95 active:bg-amber-500 touch-none"
              title="Strike / Attack with Equipped Weapon"
            >
              <Swords className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Hit</span>
            </button>
          )}

          {onBridgeForward && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onBridgeForward();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/60 bg-cyan-950/75 text-cyan-300 shadow-lg active:scale-95 active:bg-cyan-700 touch-none"
              title="Bridge Forward"
            >
              <Layers className="h-5 w-5" />
            </button>
          )}

          {onTowerUp && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onTowerUp();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-400/60 bg-yellow-950/75 text-yellow-300 shadow-lg active:scale-95 active:bg-yellow-700 touch-none"
              title="Tower Up"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}

          {onSneakToggle && scheme !== 'dpad' && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSneakToggle();
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all active:scale-95 touch-none ${
                isSneaking
                  ? 'border-indigo-400 bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.75)]'
                  : 'border-white/30 bg-black/60 text-white hover:bg-black/80'
              }`}
              title="Sneak / Edge Guard"
            >
              <Shield className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Row 2: Mine, Continuous Easy-Build Place, Jump & Fly */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore
              }
              onMinePress(true);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onMinePress(false);
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              onMinePress(false);
            }}
            className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 border-red-400/80 bg-red-600/60 text-white shadow-xl backdrop-blur-sm active:scale-95 active:bg-red-600 touch-none"
            title="Hold to Mine"
          >
            <Pickaxe className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase mt-0.5">Mine</span>
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Ignore
              }
              startContinuousBuild();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              stopContinuousBuild();
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              stopContinuousBuild();
            }}
            className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 transition-all active:scale-95 touch-none ${
              isContinuousBuilding
                ? 'border-emerald-300 bg-emerald-500 text-white scale-105 shadow-[0_0_20px_rgba(16,185,129,0.85)]'
                : 'border-emerald-400/80 bg-emerald-600/60 text-white shadow-xl backdrop-blur-sm'
            }`}
            title="Place Block (Hold for rapid build)"
          >
            <Hammer className="h-6 w-6" />
            <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">
              {isContinuousBuilding ? 'Build' : 'Place'}
            </span>
          </button>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // Ignore
                }
                onJumpPress(true);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onJumpPress(false);
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onJumpPress(false);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-amber-400/80 bg-amber-500/60 text-white shadow-xl backdrop-blur-sm active:scale-95 active:bg-amber-500 touch-none"
              title="Jump / Fly Up"
            >
              <ArrowUp className="h-6 w-6" />
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                onFlyToggle();
              }}
              className={`flex h-11 w-12 items-center justify-center rounded-xl border text-xs font-bold transition-all active:scale-95 touch-none ${
                isFlying
                  ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                  : 'border-white/25 bg-black/55 text-white'
              }`}
              title="Toggle Flying"
            >
              <Plane className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
