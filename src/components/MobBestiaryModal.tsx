import React, { useState } from 'react';
import { MOB_CATALOG, ALL_MOB_TYPES, MobCategory, MobType } from '../game/mobs';
import { X, Skull, Shield, Sparkles, Heart, Trash2, Plus } from 'lucide-react';

interface MobBestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSummonMob: (type: MobType) => void;
  onClearMobs: () => void;
  activeMobCount: number;
}

const CATEGORY_TABS: { id: 'all' | MobCategory; label: string }[] = [
  { id: 'all', label: 'All Creatures' },
  { id: 'hostile', label: 'Bad Guys' },
  { id: 'boss', label: 'Bosses' },
  { id: 'friendly', label: 'Guardians' },
  { id: 'passive', label: 'Animals' },
];

export const MobBestiaryModal: React.FC<MobBestiaryModalProps> = ({
  isOpen,
  onClose,
  onSummonMob,
  onClearMobs,
  activeMobCount,
}) => {
  const [filter, setFilter] = useState<'all' | MobCategory>('all');

  if (!isOpen) return null;

  const filteredMobs = ALL_MOB_TYPES.map((t) => MOB_CATALOG[t]).filter((m) =>
    filter === 'all' ? true : m.category === filter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm select-none">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-400">
              <Skull className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Creatures &amp; Mobs</h2>
              <p className="text-xs text-slate-400">
                Active in world: <span className="font-semibold text-emerald-400 tabular-nums">{activeMobCount}</span> · Tap any mob to summon ahead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearMobs}
              className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              aria-label="Close mobs menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 bg-[#0d1218] px-4 py-2.5 sm:px-6">
          {CATEGORY_TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mob Cards Grid */}
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto p-4 sm:p-6">
          {filteredMobs.map((mob) => {
            const catColor =
              mob.category === 'boss'
                ? 'text-fuchsia-300 border-fuchsia-500/30 bg-fuchsia-500/10'
                : mob.category === 'hostile'
                ? 'text-rose-300 border-rose-500/25 bg-rose-500/10'
                : mob.category === 'friendly'
                ? 'text-cyan-300 border-cyan-500/25 bg-cyan-500/10'
                : 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10';

            return (
              <div
                key={mob.type}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1016] p-3 hover:border-white/25 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Pixel Swatch Emblem */}
                  <div
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${mob.primaryColor}, ${mob.accentColor})`,
                    }}
                  >
                    {mob.category === 'boss' ? (
                      <Sparkles className="h-5 w-5 text-white drop-shadow" />
                    ) : mob.category === 'hostile' ? (
                      <Skull className="h-5 w-5 text-white drop-shadow" />
                    ) : mob.category === 'friendly' ? (
                      <Shield className="h-5 w-5 text-white drop-shadow" />
                    ) : (
                      <Heart className="h-5 w-5 text-white drop-shadow" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-white">{mob.name}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${catColor}`}>
                        {mob.category}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400 tabular-nums">
                      HP {mob.maxHealth} {mob.damage > 0 ? `· ATK ${mob.damage}` : '· Peaceful'}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{mob.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSummonMob(mob.type);
                    onClose();
                  }}
                  className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                  title={`Summon ${mob.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Spawn</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
