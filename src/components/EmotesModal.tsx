import React, { useState } from 'react';
import { X, Sparkles, Coins, Trophy, Lock, Play, CheckCircle2 } from 'lucide-react';
import {
  EMOTE_CATALOG,
  ACHIEVEMENTS,
  EmoteId,
  EmoteSource,
  AchievementId,
} from '../game/emotes';
import { soundFX } from '../game/audio';

interface EmotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  unlockedEmotes: EmoteId[];
  unlockedAchievements: AchievementId[];
  activeEmoteName: string | null;
  onPlayEmote: (id: EmoteId) => void;
  onBuyEmote: (id: EmoteId) => void;
}

export const EmotesModal: React.FC<EmotesModalProps> = ({
  isOpen,
  onClose,
  coins,
  unlockedEmotes,
  unlockedAchievements,
  activeEmoteName,
  onPlayEmote,
  onBuyEmote,
}) => {
  const [filter, setFilter] = useState<'all' | EmoteSource>('all');

  if (!isOpen) return null;

  const filtered = EMOTE_CATALOG.filter((e) => filter === 'all' || e.source === filter);
  const allAchievements = Object.values(ACHIEVEMENTS);

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm font-mono select-none">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Emotes &amp; Achievements</h2>
              <p className="text-xs text-slate-400">
                {unlockedEmotes.length}/{EMOTE_CATALOG.length} Emotes Unlocked ·{' '}
                {unlockedAchievements.length}/{allAchievements.length} Achievements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="tabular-nums">{coins} Coins</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer"
              aria-label="Close Emotes"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0b1016] px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap gap-1.5 text-xs font-bold">
            {(
              [
                { id: 'all', label: `All (${EMOTE_CATALOG.length})` },
                { id: 'free', label: 'Free (4)' },
                { id: 'achievement', label: 'Achievements (5)' },
                { id: 'shop', label: 'Coin Shop (8)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setFilter(tab.id);
                }}
                className={`rounded-lg border px-3 py-1.5 transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeEmoteName && (
            <span className="text-xs font-bold text-emerald-300 animate-pulse">
              Performing: {activeEmoteName}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Emote Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((emote) => {
              const isUnlocked = unlockedEmotes.includes(emote.id);
              const canAfford = emote.source === 'shop' && coins >= emote.cost;

              return (
                <div
                  key={emote.id}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                    isUnlocked
                      ? 'border-emerald-500/35 bg-[#0f1722]'
                      : 'border-white/10 bg-[#0b1016]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-sm shrink-0"
                          style={{ backgroundColor: emote.accentColor }}
                        />
                        <h3 className="text-sm font-bold text-white leading-tight">{emote.name}</h3>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          emote.source === 'free'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : emote.source === 'achievement'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {emote.source === 'shop' ? `${emote.cost}c` : emote.source}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">
                      {emote.unlockHint}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {emote.duration.toFixed(1)}s anim
                    </span>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          onPlayEmote(emote.id);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Play Emote</span>
                      </button>
                    ) : emote.source === 'shop' ? (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyEmote(emote.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          canAfford
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-95 cursor-pointer'
                            : 'bg-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        <span>Buy ({emote.cost})</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        <Lock className="h-3 w-3 text-cyan-400" />
                        <span>Achievement</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Achievement Progress Tracker */}
          <div className="rounded-xl border border-white/10 bg-[#0b1016] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Achievements &amp; Coin Rewards</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allAchievements.map((ach) => {
                const done = unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-2.5 text-xs ${
                      done
                        ? 'border-emerald-500/40 bg-emerald-950/25'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Trophy className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-white">{ach.name}</div>
                        <div className="text-[11px] text-slate-400">{ach.description}</div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      +{ach.rewardCoins}c
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
