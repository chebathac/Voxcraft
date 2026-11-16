import React, { useState, useEffect } from 'react';
import { RotateCcw, Smartphone, X } from 'lucide-react';

interface OrientationLockProps {
  onDismiss?: () => void;
}

export const OrientationLock: React.FC<OrientationLockProps> = ({ onDismiss }) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;
      // Detect if device is mobile touch screen AND portrait
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isTall = window.innerHeight > window.innerWidth * 1.15;
      setIsPortrait(isTouch && isTall);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleLockLandscape = async () => {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        await (screen.orientation as unknown as { lock: (mode: string) => Promise<void> }).lock('landscape');
      }
    } catch {
      // Browsers may reject lock without fullscreen
    }
  };

  if (!isPortrait || dismissed) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-6 text-center text-white backdrop-blur-md animate-in fade-in">
      <button
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        aria-label="Dismiss orientation notice"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
        <Smartphone className="h-12 w-12 text-emerald-400 rotate-90 transition-transform duration-700" />
        <RotateCcw className="absolute h-8 w-8 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
      </div>

      <h2
        className="text-2xl sm:text-3xl font-extrabold text-amber-400 drop-shadow-[2px_2px_0px_#000]"
        style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
      >
        Rotate Your Device
      </h2>

      <p className="mt-3 max-w-xs text-sm text-neutral-300">
        VoxelCraft is built for wide landscape panoramic exploration! Please turn your phone sideways for the full 3D voxel experience.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleLockLandscape}
          className="cursor-pointer rounded-lg border-2 border-t-white border-l-white border-b-[#222] border-r-[#222] bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-xl hover:bg-emerald-500 active:translate-y-0.5 transition-all text-sm"
          style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
        >
          Auto Rotate Screen
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="cursor-pointer rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/20 transition-all"
        >
          Play in Portrait Anyway
        </button>
      </div>
    </div>
  );
};
