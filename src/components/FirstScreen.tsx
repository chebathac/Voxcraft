import React, { useState, useEffect } from 'react';
import {
  Globe,
  Hammer,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Play,
  Share2,
  User,
  RefreshCw,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  ActiveMapSession,
  SavedCustomMap,
  loadMyMaps,
  saveMyMap,
  deleteMyMap,
  buildInviteUrl,
} from '../game/storage';
import { DEFAULT_MINECRAFT_SKINS } from '../game/skins';
import { soundFX } from '../game/audio';

interface FirstScreenProps {
  playerName: string;
  playerSkin: string;
  onUpdateProfile: (name: string, skin: string) => void;
  onEnterMap: (session: ActiveMapSession) => void;
  initialJoinCode?: string;
  initialJoinSeed?: number;
  initialJoinName?: string;
}

export const FirstScreen: React.FC<FirstScreenProps> = ({
  playerName,
  playerSkin,
  onUpdateProfile,
  onEnterMap,
  initialJoinCode = '',
  initialJoinSeed,
  initialJoinName,
}) => {
  const [nameInput, setNameInput] = useState(playerName);
  const [selectedSkin, setSelectedSkin] = useState(playerSkin);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Live server stats
  const [commonPlayers, setCommonPlayers] = useState(0);
  const [totalOnline, setTotalOnline] = useState(0);

  // Build Own Map state
  const [customMapName, setCustomMapName] = useState('My Survival Land');
  const [customSeed, setCustomSeed] = useState(() => Math.floor(10000 + Math.random() * 89999));
  const [myMaps, setMyMaps] = useState<SavedCustomMap[]>(() => loadMyMaps());
  const [isCreatingMap, setIsCreatingMap] = useState(false);

  // Join Friend's Map state
  const [joinCode, setJoinCode] = useState(initialJoinCode.toUpperCase());
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Poll live player counts
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok && active) {
          const data = await res.json();
          setCommonPlayers(data.commonPlayers ?? 0);
          setTotalOnline(data.onlinePlayers ?? 0);
        }
      } catch {
        // Ignore offline poll
      }
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const syncProfile = () => {
    const cleanName = nameInput.trim().slice(0, 16) || 'Steve';
    onUpdateProfile(cleanName, selectedSkin);
  };

  const handleEnterCommonMap = () => {
    soundFX.playPop();
    syncProfile();
    onEnterMap({
      code: 'COMMON',
      name: 'Common World',
      seed: 12345,
      isCommon: true,
    });
  };

  const handleCreateOwnMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingMap) return;
    setIsCreatingMap(true);
    soundFX.playPop();
    syncProfile();

    const cleanName = customMapName.trim().slice(0, 28) || 'My World';
    try {
      const res = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          seed: customSeed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const saved: SavedCustomMap = {
          code: data.code,
          name: data.name,
          seed: data.seed,
          createdAt: Date.now(),
        };
        setMyMaps(saveMyMap(saved));
        onEnterMap({
          code: data.code,
          name: data.name,
          seed: data.seed,
          isCommon: false,
        });
      }
    } catch {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let fallbackCode = '';
      for (let i = 0; i < 6; i++) fallbackCode += chars[Math.floor(Math.random() * chars.length)];
      const saved: SavedCustomMap = {
        code: fallbackCode,
        name: cleanName,
        seed: customSeed,
        createdAt: Date.now(),
      };
      setMyMaps(saveMyMap(saved));
      onEnterMap({
        code: fallbackCode,
        name: cleanName,
        seed: customSeed,
        isCommon: false,
      });
    } finally {
      setIsCreatingMap(false);
    }
  };

  const handleEnterSavedMap = async (map: SavedCustomMap) => {
    soundFX.playPop();
    syncProfile();
    try {
      await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: map.name,
          seed: map.seed,
          preferredCode: map.code,
        }),
      });
    } catch {
      // Ignore offline fallback
    }
    onEnterMap({
      code: map.code,
      name: map.name,
      seed: map.seed,
      isCommon: false,
    });
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 4) {
      setJoinError('Enter a 4–8 character map code (e.g. K7M9P2).');
      return;
    }

    setJoinError(null);
    setIsJoining(true);
    soundFX.playPop();
    syncProfile();

    if (cleanCode === 'COMMON') {
      handleEnterCommonMap();
      setIsJoining(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (typeof initialJoinSeed === 'number' && Number.isFinite(initialJoinSeed) && cleanCode === initialJoinCode) {
        params.set('seed', String(initialJoinSeed));
      }
      if (initialJoinName && cleanCode === initialJoinCode) {
        params.set('name', initialJoinName);
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/maps/${encodeURIComponent(cleanCode)}${query}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setJoinError(errData.error || `Unable to join map "${cleanCode}".`);
        setIsJoining(false);
        return;
      }

      const data = await res.json();
      onEnterMap({
        code: data.code,
        name: data.name,
        seed: data.seed,
        isCommon: !!data.isCommon,
      });
    } catch {
      setJoinError('Could not reach multiplayer server. Please check your connection.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    soundFX.playPop();
    setCopiedId(`code-${code}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyInviteLink = (map: SavedCustomMap) => {
    const url = buildInviteUrl(map.code, map.seed, map.name);
    navigator.clipboard.writeText(url);
    soundFX.playPop();
    setCopiedId(`link-${map.code}`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const skins = Object.values(DEFAULT_MINECRAFT_SKINS);
  const activeSkinDef = DEFAULT_MINECRAFT_SKINS[selectedSkin] || DEFAULT_MINECRAFT_SKINS.steve;

  return (
    <div
      className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-y-auto bg-[#0b1016] px-4 py-8 sm:px-8 text-slate-100 select-none"
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16, 185, 129, 0.14), transparent 70%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 48px 48px, 48px 48px',
      }}
    >
      <div className="relative z-10 flex w-full max-w-6xl flex-col gap-6">
        {/* Clean Brand Header */}
        <header className="flex flex-col items-center text-center gap-2">
          <h1
            className="text-3xl sm:text-5xl font-bold tracking-wider text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: '"Silkscreen", monospace' }}
          >
            VOXELCRAFT
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-400">
            <span>Multiplayer Voxel Sandbox</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-emerald-400 tabular-nums">
              {totalOnline} Player{totalOnline === 1 ? '' : 's'} Online
            </span>
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </button>
            )}
          </div>
        </header>

        {/* Player Profile Strip */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#131b23]/95 p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 shadow-inner"
              style={{ backgroundColor: activeSkinDef.shirtColor }}
            >
              <User className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="player-name-input" className="text-xs font-medium text-slate-400">
                Player Name
              </label>
              <input
                id="player-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={syncProfile}
                maxLength={16}
                placeholder="Steve"
                className="w-48 sm:w-56 rounded-lg border border-white/15 bg-[#0b1016] px-3 py-1.5 text-sm font-semibold text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Character Skin Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-1.5">Character Skin</span>
            {skins.map((s) => {
              const active = selectedSkin === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSkin(s.id);
                    onUpdateProfile(nameInput.trim().slice(0, 16) || 'Steve', s.id);
                    soundFX.playPop();
                  }}
                  className={`min-h-[36px] rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-[#0b1016] text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Three Primary Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* 1. COMMON MAP */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131b23]/95 p-6 shadow-xl">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Common Map</h2>
                    <p className="text-xs text-slate-400">Public shared world</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400 tabular-nums whitespace-nowrap">
                  {commonPlayers} online
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Enter the shared public world where explorers gather, mine ores across biomes, and build together in real time.
              </p>

              <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4 text-xs text-slate-400 font-mono tabular-nums">
                <span>Code: COMMON</span>
                <span aria-hidden="true">·</span>
                <span>Seed: 12345</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEnterCommonMap}
              className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-emerald-400 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Play Common Map</span>
            </button>
          </div>

          {/* 2. BUILD OWN MAP */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131b23]/95 p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
                  <Hammer className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Build Own Map</h2>
                  <p className="text-xs text-slate-400">Private world with unique code</p>
                </div>
              </div>

              <form onSubmit={handleCreateOwnMap} className="mt-4 flex flex-col gap-3">
                <div>
                  <label htmlFor="custom-map-name" className="block text-xs font-medium text-slate-400 mb-1">
                    Map Name
                  </label>
                  <input
                    id="custom-map-name"
                    type="text"
                    value={customMapName}
                    onChange={(e) => setCustomMapName(e.target.value)}
                    maxLength={28}
                    placeholder="My Survival Land"
                    className="w-full rounded-xl border border-white/15 bg-[#0b1016] px-3 py-2 text-sm font-medium text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="custom-map-seed" className="block text-xs font-medium text-slate-400 mb-1">
                    Terrain Seed
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="custom-map-seed"
                      type="number"
                      value={customSeed}
                      onChange={(e) => setCustomSeed(parseInt(e.target.value, 10) || 10000)}
                      className="flex-1 rounded-xl border border-white/15 bg-[#0b1016] px-3 py-2 text-sm font-mono tabular-nums text-white focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSeed(Math.floor(10000 + Math.random() * 89999));
                        soundFX.playPop();
                      }}
                      className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#0b1016] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/30 hover:text-white transition-colors whitespace-nowrap"
                      title="Generate random terrain seed"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Random</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingMap}
                  className="mt-1 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-400 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  <Hammer className="h-4 w-4" />
                  <span>{isCreatingMap ? 'Creating Map...' : 'Create & Get Map Code'}</span>
                </button>
              </form>

              {/* Saved Custom Maps List */}
              {myMaps.length > 0 && (
                <div className="mt-5 border-t border-white/10 pt-3">
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    Your Saved Maps ({myMaps.length})
                  </div>
                  <div className="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1">
                    {myMaps.map((m) => (
                      <div
                        key={m.code}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1016] px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-white">{m.name}</div>
                          <div className="text-[11px] font-mono text-amber-400 tabular-nums">
                            {m.code}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(m.code)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                            title="Copy Map Code"
                          >
                            {copiedId === `code-${m.code}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(m)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300 hover:bg-cyan-500/20"
                            title="Copy Shareable Invite Link"
                          >
                            {copiedId === `link-${m.code}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEnterSavedMap(m)}
                            className="flex h-8 items-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 whitespace-nowrap"
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            onClick={() => setMyMaps(deleteMyMap(m.code))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-rose-400 hover:bg-rose-500/20"
                            title="Delete Saved Map"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. INVITE & JOIN */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131b23]/95 p-6 shadow-xl">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Invite &amp; Join</h2>
                  <p className="text-xs text-slate-400">Enter a friend&apos;s map code</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Every created map generates a unique 6-character code. Enter your friend&apos;s code or open their invite link to play in the same world together.
              </p>

              <form onSubmit={handleJoinByCode} className="mt-5 flex flex-col gap-3">
                <div>
                  <label htmlFor="join-map-code" className="block text-xs font-medium text-slate-400 mb-1">
                    Friend&apos;s Map Code
                  </label>
                  <input
                    id="join-map-code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                      setJoinError(null);
                    }}
                    placeholder="K7M9P2"
                    className="w-full rounded-xl border border-white/15 bg-[#0b1016] px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.3em] text-white uppercase placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {joinError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                    {joinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="mt-1 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg hover:bg-cyan-400 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>{isJoining ? 'Connecting...' : 'Enter With Code'}</span>
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400 leading-relaxed">
              Inside any map, tap <span className="font-semibold text-slate-200">Invite</span> or click the map code in the top-left HUD to copy a direct link for friends.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
