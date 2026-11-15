import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Gift, Heart, Shield, ArrowRightLeft, Sparkles } from 'lucide-react';
import { NpcInteractionData, NpcTradeOffer } from '../game/mobs';
import { BLOCK_DEFS } from '../game/textures';
import { BlockType } from '../game/types';
import { ResourceBag } from '../game/storage';

interface NpcInteractModalProps {
  isOpen: boolean;
  npcData: NpcInteractionData | null;
  resourceBag: ResourceBag;
  playerHealth: number;
  playerMaxHealth: number;
  onClose: () => void;
  onTalk: (npcId: string) => void;
  onClaimGift: (npcId: string, block: BlockType, count: number) => void;
  onTrade: (npcId: string, offer: NpcTradeOffer) => boolean;
  onHealPlayer: (npcId: string, amount: number) => void;
  onEscort: (npcId: string, seconds: number) => void;
}

export const NpcInteractModal: React.FC<NpcInteractModalProps> = ({
  isOpen,
  npcData,
  resourceBag,
  playerHealth,
  playerMaxHealth,
  onClose,
  onTalk,
  onClaimGift,
  onTrade,
  onHealPlayer,
  onEscort,
}) => {
  const [speechText, setSpeechText] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [healUsed, setHealUsed] = useState(false);

  useEffect(() => {
    if (isOpen && npcData) {
      setSpeechText(npcData.greetings[0] || `Hello! Good to see you around.`);
      setTipIndex(0);
      setHealUsed(false);
    }
  }, [isOpen, npcData?.id]);

  if (!isOpen || !npcData) return null;

  const giftDef = BLOCK_DEFS[npcData.giftBlock];
  const giftReady = npcData.giftReadyInSec <= 0;
  const needsHeal = playerHealth < playerMaxHealth;

  const handleAskTip = () => {
    const pool = [...npcData.tips, ...npcData.greetings];
    const nextIdx = (tipIndex + 1) % pool.length;
    setTipIndex(nextIdx);
    setSpeechText(pool[nextIdx]);
    onTalk(npcData.id);
  };

  const handleGift = () => {
    if (!giftReady) return;
    onClaimGift(npcData.id, npcData.giftBlock, npcData.giftCount);
    setSpeechText(
      `Here you go — take ${npcData.giftCount}x ${giftDef?.name || 'Supplies'}! Put them to good use.`
    );
  };

  const handleHeal = () => {
    if (!npcData.canHeal || healUsed || !needsHeal) return;
    onHealPlayer(npcData.id, 6);
    setHealUsed(true);
    setSpeechText('Rest a moment and take this warm herbal tonic (+6 HP)!');
  };

  const handleEscort = () => {
    if (!npcData.canEscort) return;
    onEscort(npcData.id, 30);
    setSpeechText('Right behind you! I will follow and guard you for the next 30 seconds.');
  };

  const handleTradeClick = (offer: NpcTradeOffer) => {
    const ok = onTrade(npcData.id, offer);
    const rewardDef = BLOCK_DEFS[offer.rewardBlock];
    const costDef = BLOCK_DEFS[offer.costBlock];
    if (ok) {
      setSpeechText(
        `Pleasure trading! Enjoy your ${offer.rewardCount}x ${rewardDef?.name || 'Items'}.`
      );
    } else {
      setSpeechText(
        `You need ${offer.costCount}x ${costDef?.name || 'Materials'} in your mined pouch for that trade.`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm select-none">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl border border-white/15 bg-[#121820] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${npcData.primaryColor}, ${npcData.accentColor})`,
              }}
            >
              <Sparkles className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{npcData.name}</h2>
                <span className="rounded-md border border-cyan-400/35 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                  {npcData.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {npcData.nearbyHostileCount === 0
                  ? 'Area Calm · Friendly NPC ready to talk & trade'
                  : `${npcData.nearbyHostileCount} bad guy${npcData.nearbyHostileCount > 1 ? 's' : ''} detected nearby`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white cursor-pointer"
            aria-label="Close NPC dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Speech Bubble */}
          <div className="rounded-xl border border-cyan-400/25 bg-[#0b1016] p-3.5 sm:p-4 shadow-inner">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
              {npcData.name} says:
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">{speechText}</p>
          </div>

          {/* Quick Interactive Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleAskTip}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-100 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              <span>Chat / Ask World Tip</span>
            </button>

            <button
              type="button"
              disabled={!giftReady}
              onClick={handleGift}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${
                giftReady
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-[0.98] cursor-pointer'
                  : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Gift className="h-4 w-4" />
              <span>
                {giftReady
                  ? `Claim Gift (+${npcData.giftCount} ${giftDef?.name || 'Item'})`
                  : `Gift Ready in ${npcData.giftReadyInSec}s`}
              </span>
            </button>

            {npcData.canHeal && (
              <button
                type="button"
                disabled={healUsed || !needsHeal}
                onClick={handleHeal}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all sm:col-span-2 ${
                  !healUsed && needsHeal
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 active:scale-[0.98] cursor-pointer'
                    : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span>
                  {!needsHeal
                    ? 'Health Already Full'
                    : healUsed
                    ? 'Tonic Given (+6 HP)'
                    : 'Receive Healing Tonic (+6 HP)'}
                </span>
              </button>
            )}

            {npcData.canEscort && (
              <button
                type="button"
                onClick={handleEscort}
                className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-3.5 py-2.5 text-xs font-bold text-sky-200 hover:bg-sky-500/25 active:scale-[0.98] transition-all cursor-pointer sm:col-span-2"
              >
                <Shield className="h-4 w-4" />
                <span>
                  {npcData.escortRemainingSec > 0
                    ? `Following & Guarding (${npcData.escortRemainingSec}s left — Refresh 30s)`
                    : 'Follow & Protect Me (30s)'}
                </span>
              </button>
            )}
          </div>

          {/* Resource Trades */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span>Barter &amp; Supply Trades (Uses Mined Pouch)</span>
            </div>
            <div className="space-y-2">
              {npcData.trades.map((offer) => {
                const costDef = BLOCK_DEFS[offer.costBlock];
                const rewardDef = BLOCK_DEFS[offer.rewardBlock];
                const owned = resourceBag[offer.costBlock] || 0;
                const affordable = owned >= offer.costCount;

                return (
                  <div
                    key={offer.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
                        <span
                          className="h-3.5 w-3.5 rounded-[2px] border border-black/40 shrink-0"
                          style={{ backgroundColor: costDef?.iconColor || '#777' }}
                        />
                        <span className="font-semibold text-slate-200">
                          {offer.costCount}x {costDef?.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold tabular-nums ${
                            affordable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ({owned})
                        </span>
                      </div>

                      <span className="text-slate-500 text-xs">→</span>

                      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs">
                        <span
                          className="h-3.5 w-3.5 rounded-[2px] border border-black/40 shrink-0"
                          style={{ backgroundColor: rewardDef?.iconColor || '#777' }}
                        />
                        <span className="font-bold text-emerald-200">
                          {offer.rewardCount}x {rewardDef?.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => handleTradeClick(offer)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        affordable
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 cursor-pointer'
                          : 'bg-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Trade
                    </button>
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
