import React, { useState } from 'react';
import { X, Sparkles, Shield, Wrench, FlaskConical, Globe, Flame, Check } from 'lucide-react';
import {
  TOOL_TIERS,
  ARMOR_TIERS,
  POTION_CATALOG,
  GearTierId,
  EnchantmentsState,
  PotionId,
  formatDurabilityLabel,
} from '../game/progression';
import { DimensionId } from '../game/types';
import { soundFX } from '../game/audio';

interface EnchantPotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolTier: Exclude<GearTierId, 'none'>;
  armorTier: GearTierId;
  toolDurability: number;
  armorDurability: number;
  enchantments: EnchantmentsState;
  showAdvancedTooltips: boolean;
  activePotions: Partial<Record<PotionId, number>>;
  dimension: DimensionId;
  coins: number;
  onUpgradeTool: (tier: Exclude<GearTierId, 'none'>) => void;
  onUpgradeArmor: (tier: GearTierId) => void;
  onRepairGear: () => void;
  onEnchantUpgrade: (key: keyof EnchantmentsState) => void;
  onToggleAdvancedTooltips: () => void;
  onBrewPotion: (id: PotionId) => void;
  onTravelDimension: (dim: DimensionId) => void;
}

const ENCHANT_INFO: {
  key: keyof EnchantmentsState;
  name: string;
  maxLevel: number;
  costCoins: number;
  desc: string;
}[] = [
  {
    key: 'fortune',
    name: 'Fortune',
    maxLevel: 3,
    costCoins: 140,
    desc: 'Multiplies ore and harvested crop drops when mining.',
  },
  {
    key: 'fireAspect',
    name: 'Fire Aspect',
    maxLevel: 2,
    costCoins: 160,
    desc: 'Lights candles on hit and cooks animal meat drops instantly!',
  },
  {
    key: 'efficiency',
    name: 'Efficiency',
    maxLevel: 3,
    costCoins: 120,
    desc: '+22% block mining & chopping speed per level.',
  },
  {
    key: 'unbreaking',
    name: 'Unbreaking',
    maxLevel: 3,
    costCoins: 110,
    desc: 'Reduces tool & armor durability wear on use.',
  },
];

const TOOL_ORDER: Exclude<GearTierId, 'none'>[] = ['wood', 'stone', 'iron', 'gold', 'diamond', 'netherite'];
const ARMOR_ORDER: GearTierId[] = ['wood', 'stone', 'iron', 'gold', 'diamond', 'netherite'];

export const EnchantPotionModal: React.FC<EnchantPotionModalProps> = ({
  isOpen,
  onClose,
  toolTier,
  armorTier,
  toolDurability,
  armorDurability,
  enchantments,
  showAdvancedTooltips,
  activePotions,
  dimension,
  coins,
  onUpgradeTool,
  onUpgradeArmor,
  onRepairGear,
  onEnchantUpgrade,
  onToggleAdvancedTooltips,
  onBrewPotion,
  onTravelDimension,
}) => {
  const [tab, setTab] = useState<'gear' | 'potions' | 'dimensions'>('gear');

  if (!isOpen) return null;

  const curTool = TOOL_TIERS[toolTier];
  const curArmor = ARMOR_TIERS[armorTier];

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm font-mono select-none">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Gear, Enchanting, Potions &amp; Portals
              </h2>
              <p className="text-xs text-slate-400">
                Coins: <span className="font-bold text-amber-300">{coins}c</span> · Current Realm:{' '}
                <span className="font-bold text-cyan-300 uppercase">{dimension}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Close Station"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#0b1016] px-4 py-2.5 sm:px-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setTab('gear');
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer ${
              tab === 'gear'
                ? 'border-fuchsia-400 bg-fuchsia-500/20 text-fuchsia-200'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Gear &amp; Enchants</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setTab('potions');
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer ${
              tab === 'potions'
                ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Brewing Stand</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setTab('dimensions');
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 cursor-pointer ${
              tab === 'dimensions'
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Dimension Portals</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {tab === 'gear' && (
            <>
              {/* Active Gear Status + F3+H Tooltip Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Wrench className="h-3.5 w-3.5" />
                      Active Tools
                    </span>
                    <span>Speed {curTool.speedMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatDurabilityLabel(
                      curTool.name,
                      toolDurability,
                      curTool.maxDurability,
                      showAdvancedTooltips
                    )}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(100, (toolDurability / curTool.maxDurability) * 100))}%`,
                        backgroundColor: curTool.color,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                      <Shield className="h-3.5 w-3.5" />
                      Active Armor
                    </span>
                    <span>-{Math.round(curArmor.damageReduction * 100)}% Damage</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatDurabilityLabel(
                      curArmor.name,
                      armorDurability,
                      curArmor.maxDurability,
                      showAdvancedTooltips
                    )}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width:
                          curArmor.maxDurability > 0
                            ? `${Math.max(0, Math.min(100, (armorDurability / curArmor.maxDurability) * 100))}%`
                            : '0%',
                        backgroundColor: curArmor.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3.5 py-2.5 text-xs">
                <button
                  type="button"
                  onClick={onToggleAdvancedTooltips}
                  className="flex items-center gap-2 font-semibold text-slate-200 hover:text-white cursor-pointer"
                >
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      showAdvancedTooltips
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    F3 + H: {showAdvancedTooltips ? 'EXACT NUMBERS ON' : 'PERCENTAGE'}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">Toggle exact durability readout</span>
                </button>

                <button
                  type="button"
                  onClick={onRepairGear}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-bold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                >
                  Repair Gear (40 Coins)
                </button>
              </div>

              {/* Tiered Tool & Armor Upgrades */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2.5">
                    Tool Tiers (Wood → Netherite)
                  </div>
                  <div className="space-y-1.5">
                    {TOOL_ORDER.map((id) => {
                      const def = TOOL_TIERS[id];
                      const active = toolTier === id;
                      return (
                        <div
                          key={id}
                          className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${
                            active
                              ? 'border-amber-400 bg-amber-500/15'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: def.color }}
                            />
                            <div>
                              <div className="font-bold text-white">{def.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {def.speedMultiplier}x · {def.maxDurability} dur · +{def.damageBonus} atk
                              </div>
                            </div>
                          </div>
                          {active ? (
                            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Equipped
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpgradeTool(id)}
                              className="rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-500 hover:text-slate-950 cursor-pointer"
                            >
                              Equip / Forge
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b1016] p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2.5">
                    Armor Tiers (Wood → Netherite)
                  </div>
                  <div className="space-y-1.5">
                    {ARMOR_ORDER.map((id) => {
                      const def = ARMOR_TIERS[id];
                      const active = armorTier === id;
                      return (
                        <div
                          key={id}
                          className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${
                            active
                              ? 'border-cyan-400 bg-cyan-500/15'
                              : 'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-sm"
                              style={{ backgroundColor: def.color }}
                            />
                            <div>
                              <div className="font-bold text-white">{def.name}</div>
                              <div className="text-[10px] text-slate-400">
                                -{Math.round(def.damageReduction * 100)}% dmg · {def.maxDurability} dur
                              </div>
                            </div>
                          </div>
                          {active ? (
                            <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Equipped
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onUpgradeArmor(id)}
                              className="rounded bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-cyan-500 hover:text-slate-950 cursor-pointer"
                            >
                              Equip / Forge
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Enchanting Table */}
              <div className="rounded-xl border border-fuchsia-500/30 bg-[#0b1016] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-300 mb-3">
                  Enchanting Table
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ENCHANT_INFO.map((ench) => {
                    const level = enchantments[ench.key];
                    const maxed = level >= ench.maxLevel;
                    const cost = ench.costCoins * (level + 1);
                    const canAfford = coins >= cost;
                    return (
                      <div
                        key={ench.key}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">
                            {ench.name}{' '}
                            <span className="text-fuchsia-300">
                              {level > 0 ? `Lv.${level}` : 'Lv.0'}
                            </span>{' '}
                            / {ench.maxLevel}
                          </div>
                          <div className="text-[11px] text-slate-400">{ench.desc}</div>
                        </div>
                        <button
                          type="button"
                          disabled={maxed || !canAfford}
                          onClick={() => onEnchantUpgrade(ench.key)}
                          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                            maxed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : canAfford
                              ? 'bg-fuchsia-500 text-white hover:bg-fuchsia-400 cursor-pointer'
                              : 'bg-white/10 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {maxed ? 'MAXED' : `Imbue (${cost}c)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'potions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(POTION_CATALOG) as PotionId[]).map((pid) => {
                const p = POTION_CATALOG[pid];
                const rem = activePotions[pid] ?? 0;
                return (
                  <div
                    key={pid}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0b1016] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <h3 className="text-sm font-bold text-white">{p.name}</h3>
                        </div>
                        <span className="text-[11px] text-slate-400">{p.durationSec}s</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-300">{p.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                      {rem > 0 ? (
                        <span className="text-xs font-bold text-emerald-400">
                          Active ({Math.ceil(rem)}s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">90 Coins</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onBrewPotion(pid)}
                        className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
                      >
                        Brew &amp; Drink
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'dimensions' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    id: 'overworld',
                    name: 'The Overworld',
                    desc: 'Forests, Cherry Groves, Pale Garden (Creaking), Ancient Cities (Sculk), and Villages.',
                    accent: 'border-emerald-400/50 bg-emerald-950/30 text-emerald-200',
                    btn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
                  },
                  {
                    id: 'nether',
                    name: 'The Nether',
                    desc: 'Crimson wasteland of Netherrack, Lava lakes, Nether Brick fortresses, Piglins, Blazes & Wither.',
                    accent: 'border-rose-500/50 bg-rose-950/35 text-rose-200',
                    btn: 'bg-rose-500 hover:bg-rose-400 text-white',
                  },
                  {
                    id: 'end',
                    name: 'The End',
                    desc: 'Floating End Stone islands over the starry void with Obsidian pillars, Endermen & Ender Dragon.',
                    accent: 'border-fuchsia-500/50 bg-fuchsia-950/35 text-fuchsia-200',
                    btn: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white',
                  },
                ] as const
              ).map((d) => {
                const isHere = dimension === d.id;
                return (
                  <div
                    key={d.id}
                    className={`flex flex-col justify-between rounded-xl border p-4 ${d.accent}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <Flame className="h-4 w-4" />
                        <span>{d.name}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300 leading-relaxed">{d.desc}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isHere}
                      onClick={() => {
                        onTravelDimension(d.id);
                        onClose();
                      }}
                      className={`mt-4 w-full rounded-lg py-2 text-xs font-bold transition-all ${
                        isHere ? 'bg-white/15 text-slate-300 cursor-default' : `${d.btn} cursor-pointer`
                      }`}
                    >
                      {isHere ? 'Current Dimension' : `Enter ${d.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
