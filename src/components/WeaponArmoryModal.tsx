import React, { useState, useMemo } from 'react';
import {
  WEAPON_CATALOG,
  ALL_WEAPON_IDS,
  WeaponId,
  getWeaponIconUrl,
  RESOURCE_POUCH_DISPLAY,
  getIngredientOwned,
  canCraftWeapon,
} from '../game/weapons';
import { ResourceBag } from '../game/storage';
import { Swords, X, Check, Zap, Lock, Hammer } from 'lucide-react';

interface WeaponArmoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  resourceBag: ResourceBag;
  onEquipWeapon: (id: WeaponId) => void;
  onCraftWeapon: (id: WeaponId) => void;
}

type FilterMode = 'All' | 'Unlocked' | 'Craftable' | 'Rare' | 'Epic' | 'Mythic' | 'Starter';

const TIER_FILTERS: FilterMode[] = [
  'All',
  'Unlocked',
  'Craftable',
  'Rare',
  'Epic',
  'Mythic',
  'Starter',
];

export const WeaponArmoryModal: React.FC<WeaponArmoryModalProps> = ({
  isOpen,
  onClose,
  equippedWeapon,
  unlockedWeapons,
  resourceBag,
  onEquipWeapon,
  onCraftWeapon,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('All');

  const icons = useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of ALL_WEAPON_IDS) {
      map[id] = getWeaponIconUrl(id);
    }
    return map;
  }, []);

  if (!isOpen) return null;

  const unlockedSet = new Set(unlockedWeapons);
  const weapons = ALL_WEAPON_IDS.map((id) => WEAPON_CATALOG[id]).filter((w) => {
    if (filterMode === 'All') return true;
    if (filterMode === 'Unlocked') return unlockedSet.has(w.id);
    if (filterMode === 'Craftable') return !unlockedSet.has(w.id) && canCraftWeapon(w.id, resourceBag);
    return w.tier === filterMode;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm select-none">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Weapon Forge &amp; Armory</h2>
              <p className="text-xs text-slate-400">
                Equipped:{' '}
                <span className="font-semibold text-amber-300">
                  {WEAPON_CATALOG[equippedWeapon].name}
                </span>{' '}
                · Mine deep ores &amp; defeat villains to craft weapons
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Close weapon forge"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mined & Looted Resource Pouch */}
        <div className="border-b border-white/10 bg-[#0b1016] px-4 py-2 sm:px-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Your Mined &amp; Looted Materials
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RESOURCE_POUCH_DISPLAY.map((res) => {
              const owned = getIngredientOwned(resourceBag, res.acceptBlocks);
              return (
                <div
                  key={res.label}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                    owned > 0
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-[2px] border border-black/40 shrink-0"
                    style={{ backgroundColor: res.color }}
                  />
                  <span>{res.label}:</span>
                  <span className="font-bold tabular-nums">{owned}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier / Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 bg-[#0d1218] px-4 py-2 sm:px-6">
          {TIER_FILTERS.map((mode) => {
            const active = filterMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Weapons Grid */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto p-4 sm:p-6">
          {weapons.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs text-slate-400">
              No weapons match this filter yet. Mine deep underground or defeat incoming villains to gather materials!
            </div>
          ) : (
            weapons.map((w) => {
              const isUnlocked = unlockedSet.has(w.id);
              const isEquipped = equippedWeapon === w.id;
              const craftable = !isUnlocked && canCraftWeapon(w.id, resourceBag);

              const tierBadge =
                w.tier === 'Mythic'
                  ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-300'
                  : w.tier === 'Epic'
                  ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                  : w.tier === 'Rare'
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                  : 'border-white/15 bg-white/5 text-slate-300';

              return (
                <div
                  key={w.id}
                  className={`flex flex-col justify-between gap-2.5 rounded-xl border p-3 transition-all ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-500/15 shadow-lg'
                      : isUnlocked
                      ? 'border-emerald-500/35 bg-[#0b1016]'
                      : craftable
                      ? 'border-cyan-400/45 bg-[#0f1722]'
                      : 'border-white/10 bg-[#0b1016]/85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#161e29] p-1.5">
                        <img
                          src={icons[w.id]}
                          alt={w.name}
                          className={`h-full w-full object-contain ${!isUnlocked && !craftable ? 'opacity-60' : ''}`}
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {!isUnlocked && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-white/25">
                            <Lock className="h-2.5 w-2.5 text-amber-300" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-white">{w.name}</span>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${tierBadge}`}>
                            {w.tier}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] font-semibold text-emerald-400 tabular-nums">
                          DMG {w.damage} · Reach {w.range.toFixed(1)}m
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                          <span className="truncate">{w.specialLabel}</span>
                        </div>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          onEquipWeapon(w.id);
                          onClose();
                        }}
                        className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-bold cursor-pointer transition-all ${
                          isEquipped
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500 hover:text-slate-950'
                        }`}
                      >
                        {isEquipped ? (
                          <span className="flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span>Equip</span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!craftable}
                        onClick={() => {
                          if (craftable) {
                            onCraftWeapon(w.id);
                            onClose();
                          }
                        }}
                        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${
                          craftable
                            ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 cursor-pointer shadow-md'
                            : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {craftable ? <Hammer className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        <span>{craftable ? 'Craft' : 'Locked'}</span>
                      </button>
                    )}
                  </div>

                  {/* Crafting Recipe Requirements for Locked Weapons */}
                  {!isUnlocked && w.recipe.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2">
                      <span className="text-[10px] font-semibold text-slate-400">Needs:</span>
                      {w.recipe.map((ing) => {
                        const have = getIngredientOwned(resourceBag, ing.acceptBlocks);
                        const ok = have >= ing.count;
                        return (
                          <span
                            key={ing.label}
                            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                              ok
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                            }`}
                          >
                            <span
                              className="h-2 w-2 rounded-[1px]"
                              style={{ backgroundColor: ing.color }}
                            />
                            <span>
                              {ing.label} {Math.min(have, ing.count)}/{ing.count}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
