import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { VoxelWorld } from './game/world';
import { Player, CameraViewMode } from './game/player';
import { MinecraftSky } from './game/sky';
import { MultiplayerClient, ConnectionTransport } from './game/multiplayer';
import { BlockType, ChatMessage, DimensionId } from './game/types';
import { BLOCK_DEFS } from './game/textures';
import { soundFX } from './game/audio';
import {
  loadSavedHotbar,
  saveHotbar,
  loadSavedInventory,
  saveInventory,
  loadSavedWorldDeltas,
  saveWorldDeltasDebounced,
  saveWorldDeltasImmediate,
  loadPlayerMeta,
  savePlayerMeta,
  clearAllSavedData,
  DEFAULT_HOTBAR,
  DEFAULT_INVENTORY,
  ActiveMapSession,
  ControlSettings,
  loadControlSettings,
  saveControlSettings,
  ResourceBag,
  loadUnlockedWeapons,
  saveUnlockedWeapons,
  loadEquippedWeapon,
  saveEquippedWeapon,
  loadResourceBag,
  saveResourceBag,
  PlayerProgressStats,
  loadPlayerProgress,
  savePlayerProgress,
  GraphicsQuality,
  loadAccountProgression,
  saveAccountProgression,
  PersistedAccountState,
} from './game/storage';
import { DroppedItemManager } from './game/drops';
import {
  MobManager,
  MOB_CATALOG,
  MobType,
  NpcTradeOffer,
  RadarMobPoint,
  TargetedMobInfo,
} from './game/mobs';
import { WeaponId, WEAPON_CATALOG, consumeWeaponRecipe } from './game/weapons';
import {
  ACHIEVEMENTS,
  AchievementId,
  EMOTE_BY_ID,
  EmoteId,
} from './game/emotes';
import {
  TOOL_TIERS,
  ARMOR_TIERS,
  POTION_CATALOG,
  GearTierId,
  EnchantmentsState,
  PotionId,
  formatDurabilityLabel,
  getFortuneDropCount,
} from './game/progression';
import { updateRedstoneAround } from './game/redstone';
import { applyBoneMeal, tickNatureGrowth } from './game/farming';
import { FirstScreen } from './components/FirstScreen';
import { HUD } from './components/HUD';
import { ChatOverlay } from './components/ChatOverlay';
import { InventoryModal, SortMode } from './components/InventoryModal';
import { CraftingTableModal } from './components/CraftingTableModal';
import { FurnaceModal } from './components/FurnaceModal';
import { SkinSelector } from './components/SkinSelector';
import { MobBestiaryModal } from './components/MobBestiaryModal';
import { WeaponArmoryModal } from './components/WeaponArmoryModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { NpcInteractModal } from './components/NpcInteractModal';
import { BottomControlDock } from './components/BottomControlDock';
import { MobileControls } from './components/MobileControls';
import { EmotesModal } from './components/EmotesModal';
import { EnchantPotionModal } from './components/EnchantPotionModal';
import { OrientationLock } from './components/OrientationLock';

export default function App() {
  const initialInvite = React.useMemo(() => {
    if (typeof window === 'undefined') return { code: '', seed: undefined as number | undefined, name: undefined as string | undefined };
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('map') || '').trim().toUpperCase();
    const rawSeed = params.get('seed');
    const parsedSeed = rawSeed ? parseInt(rawSeed, 10) : undefined;
    const name = params.get('name') || undefined;
    return {
      code,
      seed: typeof parsedSeed === 'number' && Number.isFinite(parsedSeed) ? parsedSeed : undefined,
      name,
    };
  }, []);

  const savedMeta = React.useMemo(() => loadPlayerMeta(), []);
  const [playerName, setPlayerName] = useState(() => savedMeta?.playerName || 'Steve');
  const [playerSkin, setPlayerSkin] = useState(() => savedMeta?.playerSkin || 'steve');
  const [activeMap, setActiveMap] = useState<ActiveMapSession | null>(null);

  const handleUpdateProfile = useCallback((name: string, skin: string) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    savePlayerMeta({ playerName: name, playerSkin: skin });
  }, []);

  if (!activeMap) {
    return (
      <FirstScreen
        playerName={playerName}
        playerSkin={playerSkin}
        onUpdateProfile={handleUpdateProfile}
        onEnterMap={(session) => setActiveMap(session)}
        initialJoinCode={initialInvite.code}
        initialJoinSeed={initialInvite.seed}
        initialJoinName={initialInvite.name}
      />
    );
  }

  return (
    <VoxelGameSession
      key={`${activeMap.code}-${activeMap.seed}`}
      activeMap={activeMap}
      playerName={playerName}
      playerSkin={playerSkin}
      onUpdateProfile={handleUpdateProfile}
      onBackToMenu={() => {
        document.exitPointerLock?.();
        setActiveMap(null);
      }}
    />
  );
}

interface VoxelGameSessionProps {
  activeMap: ActiveMapSession;
  playerName: string;
  playerSkin: string;
  onUpdateProfile: (name: string, skin: string) => void;
  onBackToMenu: () => void;
}

function VoxelGameSession({
  activeMap,
  playerName,
  playerSkin,
  onUpdateProfile,
  onBackToMenu,
}: VoxelGameSessionProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // Game references
  const worldRef = useRef<VoxelWorld | null>(null);
  const playerRef = useRef<Player | null>(null);
  const skyRef = useRef<MinecraftSky | null>(null);
  const multiplayerRef = useRef<MultiplayerClient | null>(null);
  const dropManagerRef = useRef<DroppedItemManager | null>(null);
  const mobManagerRef = useRef<MobManager | null>(null);

  // LocalStorage saved metadata and room-scoped deltas
  const savedMetaRef = useRef(loadPlayerMeta());
  const initialDeltasRef = useRef<Map<string, BlockType>>(loadSavedWorldDeltas(activeMap.code));
  const [savedDeltaCount, setSavedDeltaCount] = useState<number>(() => initialDeltasRef.current.size);

  // React state for HUD & Inventory
  const [isLocked, setIsLocked] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(() => savedMetaRef.current?.selectedSlot ?? 0);
  const [hotbar, setHotbar] = useState<BlockType[]>(() => loadSavedHotbar());
  const [inventory, setInventory] = useState<(BlockType | null)[]>(() => loadSavedInventory());

  // Fresh refs for event listeners and tick updates
  const hotbarRef = useRef(hotbar);
  hotbarRef.current = hotbar;
  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const selectedSlotRef = useRef(selectedSlot);
  selectedSlotRef.current = selectedSlot;

  const [playerPos, setPlayerPos] = useState({ x: 0, y: 16, z: 0 });
  const [playerYaw, setPlayerYaw] = useState(0);
  const [biome, setBiome] = useState('plains');
  const [fps, setFps] = useState(60);
  const [onlineCount, setOnlineCount] = useState(1);
  const [connectionTransport, setConnectionTransport] = useState<ConnectionTransport>('connecting');
  const [breakProgress, setBreakProgress] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('first');
  const [timeOfDay, setTimeOfDay] = useState(0.4);
  const [autoCycle, setAutoCycle] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Floating resource pickup notice (+1 Diamond Gem, etc.)
  const [pickupNotice, setPickupNotice] = useState<{ text: string; iconColor: string; id: number } | null>(null);

  // Player Health State (20 HP = 10 Hearts)
  const [health, setHealth] = useState(20);
  const [maxHealth] = useState(20);
  const [isTakingDamage, setIsTakingDamage] = useState(false);
  const [hunger, setHunger] = useState(20);
  const [maxHunger] = useState(20);
  const [xp, setXp] = useState(0);
  const [xpLevel, setXpLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [blocksMinedTotal, setBlocksMinedTotal] = useState(0);
  const [mobsKilledTotal, setMobsKilledTotal] = useState(0);
  const [timeSurvivedSec, setTimeSurvivedSec] = useState(0);

  // Modals & Overlays
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isFurnaceOpen, setIsFurnaceOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSkinOpen, setIsSkinOpen] = useState(false);
  const [isWeaponsOpen, setIsWeaponsOpen] = useState(false);
  const [isMobsOpen, setIsMobsOpen] = useState(false);
  const [isGameSettingsOpen, setIsGameSettingsOpen] = useState(false);
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [npcRefreshTick, setNpcRefreshTick] = useState(0);
  const [nearbyNpc, setNearbyNpc] = useState<{ id: string; name: string; role: string } | null>(null);
  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponId[]>(() => loadUnlockedWeapons() as WeaponId[]);
  const unlockedWeaponsRef = useRef<WeaponId[]>(unlockedWeapons);
  unlockedWeaponsRef.current = unlockedWeapons;
  const [equippedWeapon, setEquippedWeapon] = useState<WeaponId>(() => loadEquippedWeapon() as WeaponId);
  const equippedWeaponRef = useRef<WeaponId>(equippedWeapon);
  equippedWeaponRef.current = equippedWeapon;
  const [resourceBag, setResourceBag] = useState<ResourceBag>(() => loadResourceBag());
  const resourceBagRef = useRef<ResourceBag>(resourceBag);
  resourceBagRef.current = resourceBag;
  const [villainAlert, setVillainAlert] = useState<{ wave: number; text: string } | null>(null);
  const villainAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAttackTimeRef = useRef(0);
  const [radarMobs, setRadarMobs] = useState<RadarMobPoint[]>([]);
  const [targetedMob, setTargetedMob] = useState<TargetedMobInfo | null>(null);
  const [activeMobCount, setActiveMobCount] = useState(0);
  const [showMobileControls, setShowMobileControls] = useState(() =>
    typeof window !== 'undefined' &&
    ((window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 768)
  );
  const [controlSettings, setControlSettings] = useState<ControlSettings>(() => loadControlSettings());
  const controlSettingsRef = useRef(controlSettings);
  controlSettingsRef.current = controlSettings;
  const progressStatsRef = useRef<PlayerProgressStats>(loadPlayerProgress(activeMap.code));
  const applyGraphicsRef = useRef<((quality: GraphicsQuality) => void) | null>(null);
  const placeOrInteractRef = useRef<(() => void) | null>(null);
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;
  const playerSkinRef = useRef(playerSkin);
  playerSkinRef.current = playerSkin;

  // Emotes, Achievements, Coins, Tiered Gear, Enchantments, Potions & Dimensions State
  const initialAccountRef = useRef<PersistedAccountState>(loadAccountProgression());
  const [coins, setCoins] = useState(() => initialAccountRef.current.coins);
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  const [unlockedEmotes, setUnlockedEmotes] = useState<EmoteId[]>(
    () => initialAccountRef.current.unlockedEmotes as EmoteId[]
  );
  const unlockedEmotesRef = useRef(unlockedEmotes);
  unlockedEmotesRef.current = unlockedEmotes;

  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementId[]>(
    () => initialAccountRef.current.unlockedAchievements as AchievementId[]
  );
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  unlockedAchievementsRef.current = unlockedAchievements;

  const [toolTier, setToolTier] = useState<Exclude<GearTierId, 'none'>>(
    () => (initialAccountRef.current.toolTier as Exclude<GearTierId, 'none'>) || 'wood'
  );
  const toolTierRef = useRef(toolTier);
  toolTierRef.current = toolTier;

  const [armorTier, setArmorTier] = useState<GearTierId>(
    () => (initialAccountRef.current.armorTier as GearTierId) || 'none'
  );
  const armorTierRef = useRef(armorTier);
  armorTierRef.current = armorTier;

  const [toolDurability, setToolDurability] = useState(() => initialAccountRef.current.toolDurability);
  const toolDurabilityRef = useRef(toolDurability);
  toolDurabilityRef.current = toolDurability;

  const [armorDurability, setArmorDurability] = useState(() => initialAccountRef.current.armorDurability);
  const armorDurabilityRef = useRef(armorDurability);
  armorDurabilityRef.current = armorDurability;

  const [enchantments, setEnchantments] = useState<EnchantmentsState>(
    () => initialAccountRef.current.enchantments
  );
  const enchantmentsRef = useRef(enchantments);
  enchantmentsRef.current = enchantments;

  const [showAdvancedTooltips, setShowAdvancedTooltips] = useState(
    () => initialAccountRef.current.showAdvancedTooltips
  );
  const showAdvancedTooltipsRef = useRef(showAdvancedTooltips);
  showAdvancedTooltipsRef.current = showAdvancedTooltips;

  const [dimension, setDimension] = useState<DimensionId>('overworld');
  const [isEmotesOpen, setIsEmotesOpen] = useState(false);
  const [isStationOpen, setIsStationOpen] = useState(false);
  const [isHoeMode, setIsHoeMode] = useState(false);
  const [activePotions, setActivePotions] = useState<Partial<Record<PotionId, number>>>({});
  const [activeEmoteName, setActiveEmoteName] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] = useState<{ name: string; rewardCoins: number } | null>(null);
  const [f3Notice, setF3Notice] = useState<string | null>(null);
  const seenBiomesRef = useRef<Set<string>>(new Set(['plains']));
  const isF3HeldRef = useRef(false);

  const persistAccountSnapshot = useCallback((overrides?: Partial<PersistedAccountState>) => {
    const snap: PersistedAccountState = {
      coins: coinsRef.current,
      unlockedEmotes: unlockedEmotesRef.current,
      unlockedAchievements: unlockedAchievementsRef.current,
      toolTier: toolTierRef.current,
      armorTier: armorTierRef.current,
      toolDurability: toolDurabilityRef.current,
      armorDurability: armorDurabilityRef.current,
      enchantments: enchantmentsRef.current,
      showAdvancedTooltips: showAdvancedTooltipsRef.current,
      ...overrides,
    };
    saveAccountProgression(snap);
  }, []);

  const addCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setCoins((prev) => {
      const next = prev + amount;
      coinsRef.current = next;
      persistAccountSnapshot({ coins: next });
      return next;
    });
  }, [persistAccountSnapshot]);

  const unlockAchievement = useCallback((id: AchievementId) => {
    if (unlockedAchievementsRef.current.includes(id)) return;
    const def = ACHIEVEMENTS[id];
    if (!def) return;

    const nextAch = [...unlockedAchievementsRef.current, id];
    unlockedAchievementsRef.current = nextAch;
    setUnlockedAchievements(nextAch);

    const nextEmotes = unlockedEmotesRef.current.includes(def.unlocksEmote)
      ? unlockedEmotesRef.current
      : [...unlockedEmotesRef.current, def.unlocksEmote];
    unlockedEmotesRef.current = nextEmotes;
    setUnlockedEmotes(nextEmotes);

    const nextCoins = coinsRef.current + def.rewardCoins;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);

    persistAccountSnapshot({
      unlockedAchievements: nextAch,
      unlockedEmotes: nextEmotes,
      coins: nextCoins,
    });

    soundFX.playRegen();
    setAchievementToast({ name: def.name, rewardCoins: def.rewardCoins });
    setTimeout(() => {
      setAchievementToast((curr) => (curr?.name === def.name ? null : curr));
    }, 3600);
  }, [persistAccountSnapshot]);

  const computeProgressScore = useCallback((stats: PlayerProgressStats, weaponId: WeaponId): number => {
    const wDmg = WEAPON_CATALOG[weaponId]?.damage ?? 3;
    return (
      stats.blocksMined * 2 +
      stats.oresFound * 9 +
      stats.mobsDefeated * 20 +
      Math.floor(stats.playSeconds / 6) +
      Math.max(0, wDmg - 3) * 10
    );
  }, []);

  const syncProgressionToMobs = useCallback(
    (silent = false) => {
      if (!mobManagerRef.current) return;
      const score = computeProgressScore(progressStatsRef.current, equippedWeaponRef.current);
      mobManagerRef.current.setProgressScore(score, silent);
    },
    [computeProgressScore]
  );

  const handleUpdateControlSettings = useCallback((patch: Partial<ControlSettings>) => {
    setControlSettings((prev) => {
      const next = { ...prev, ...patch };
      saveControlSettings(next);
      if (playerRef.current) {
        playerRef.current.autoJump = next.autoJump;
        playerRef.current.lookSensitivity = next.lookSensitivity;
      }
      if (patch.graphicsQuality) {
        applyGraphicsRef.current?.(patch.graphicsQuality);
      }
      return next;
    });
  }, []);

  const handleAnalogMove = useCallback((vec: { x: number; y: number }) => {
    if (playerRef.current) {
      playerRef.current.analogMove = vec;
    }
  }, []);

  const handleDirectionChange = useCallback(
    (dir: { forward: boolean; backward: boolean; left: boolean; right: boolean }) => {
      if (playerRef.current) {
        playerRef.current.keys.forward = dir.forward;
        playerRef.current.keys.backward = dir.backward;
        playerRef.current.keys.left = dir.left;
        playerRef.current.keys.right = dir.right;
      }
    },
    []
  );

  const [touchRing, setTouchRing] = useState<{ x: number; y: number; mining: boolean } | null>(null);
  const [isSneaking, setIsSneaking] = useState(false);
  const [targetBlockName, setTargetBlockName] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; x: number; z: number; name?: string }[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'System',
      text: 'Welcome to VoxelCraft Multiplayer! Explore, mine, craft, and build together.',
      timestamp: Date.now(),
      isSystem: true,
    },
  ]);

  // Handle pointer lock request
  const requestPointerLock = useCallback(() => {
    if (canvasMountRef.current) {
      canvasMountRef.current.requestPointerLock?.();
    }
  }, []);

  // Update selected slot & persist to localStorage
  const handleSelectSlot = useCallback((idx: number) => {
    setSelectedSlot(idx);
    savePlayerMeta({ selectedSlot: idx });
    if (playerRef.current) {
      playerRef.current.selectedSlot = idx;
      playerRef.current.updateHeldBlockMesh();
    }
    soundFX.playPop();
  }, []);

  // Set block in hotbar from inventory & persist to localStorage
  const handleSetHotbarBlock = useCallback((slot: number, block: BlockType) => {
    setHotbar((prev) => {
      const next = [...prev];
      next[slot] = block;
      saveHotbar(next);
      return next;
    });
    if (playerRef.current) {
      playerRef.current.hotbar[slot] = block;
      playerRef.current.updateHeldBlockMesh();
    }
  }, []);

  // Set single slot in 27-slot inventory & persist to localStorage
  const handleSetInventorySlot = useCallback((slot: number, block: BlockType | null) => {
    setInventory((prev) => {
      const next = [...prev];
      next[slot] = block;
      saveInventory(next);
      return next;
    });
  }, []);

  // Swap item between 27-slot inventory and 9-slot hotbar & persist both
  const handleSwapInventoryHotbar = useCallback((invSlot: number, hotbarSlot: number) => {
    setInventory((prevInv) => {
      const nextInv = [...prevInv];
      setHotbar((prevHotbar) => {
        const nextHotbar = [...prevHotbar];
        const hotbarItem = nextHotbar[hotbarSlot];
        const invItem = nextInv[invSlot];

        if (invItem !== null) {
          nextHotbar[hotbarSlot] = invItem;
          nextInv[invSlot] = hotbarItem;
        } else {
          nextInv[invSlot] = hotbarItem;
        }

        saveHotbar(nextHotbar);
        saveInventory(nextInv);
        if (playerRef.current) {
          playerRef.current.hotbar = [...nextHotbar];
          playerRef.current.updateHeldBlockMesh();
        }
        return nextHotbar;
      });
      return nextInv;
    });
  }, []);

  // Sort 27-slot inventory by category, name, or hardness & persist
  const handleSortInventory = useCallback((mode: SortMode) => {
    setInventory((prev) => {
      const items = prev.filter((item): item is BlockType => item !== null);
      const emptyCount = prev.length - items.length;

      const categoryPriority: Record<string, number> = {
        building: 1,
        nature: 2,
        ores: 3,
        special: 4,
      };

      items.sort((a, b) => {
        const defA = BLOCK_DEFS[a];
        const defB = BLOCK_DEFS[b];
        if (!defA || !defB) return 0;

        if (mode === 'category') {
          const catA = categoryPriority[defA.category] ?? 99;
          const catB = categoryPriority[defB.category] ?? 99;
          if (catA !== catB) return catA - catB;
          return defA.name.localeCompare(defB.name);
        } else if (mode === 'name') {
          return defA.name.localeCompare(defB.name);
        } else if (mode === 'hardness') {
          return defB.hardness - defA.hardness || defA.name.localeCompare(defB.name);
        }
        return 0;
      });

      const next = [...items, ...Array(emptyCount).fill(null)];
      saveInventory(next);
      return next;
    });
  }, []);

  // Reset all saved data (inventory, hotbar, forged weapons, resource bag, and current map blocks)
  const handleResetStorage = useCallback(() => {
    clearAllSavedData(activeMap.code);
    const freshHotbar = [...DEFAULT_HOTBAR];
    const freshInventory = [...DEFAULT_INVENTORY];
    setHotbar(freshHotbar);
    setInventory(freshInventory);
    saveHotbar(freshHotbar);
    saveInventory(freshInventory);
    setUnlockedWeapons(['hand']);
    saveUnlockedWeapons(['hand']);
    setEquippedWeapon('hand');
    saveEquippedWeapon('hand');
    setResourceBag({});
    saveResourceBag({});
    progressStatsRef.current = { blocksMined: 0, oresFound: 0, mobsDefeated: 0, playSeconds: 0 };
    savePlayerProgress(activeMap.code, progressStatsRef.current);
    mobManagerRef.current?.setProgressScore(0, true);
    if (playerRef.current) {
      playerRef.current.hotbar = [...freshHotbar];
      playerRef.current.setWeapon('hand');
      playerRef.current.updateHeldBlockMesh();
    }
    if (worldRef.current) {
      worldRef.current.clearAllDeltas();
    }
    setSavedDeltaCount(0);
    setChatMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, sender: 'System', text: 'All saved inventory, hotbar, crafted weapons, and world edits have been reset to default!', timestamp: Date.now(), isSystem: true },
    ]);
  }, [activeMap.code]);

  // Toggle flying mode
  const handleToggleFlying = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.isFlying = !playerRef.current.isFlying;
      setIsFlying(playerRef.current.isFlying);
      soundFX.playPop();
    }
  }, []);

  // Change camera mode
  const handleCameraModeChange = useCallback((mode: CameraViewMode) => {
    setCameraMode(mode);
    if (playerRef.current) {
      playerRef.current.cameraMode = mode;
    }
  }, []);

  // Cycle camera mode (1st -> 3rd Back -> 3rd Front -> Top View)
  const cycleCameraMode = useCallback(() => {
    setCameraMode((prev) => {
      const next: CameraViewMode =
        prev === 'first'
          ? 'third_back'
          : prev === 'third_back'
          ? 'third_front'
          : prev === 'third_front'
          ? 'top_view'
          : 'first';
      if (playerRef.current) playerRef.current.cameraMode = next;
      return next;
    });
  }, []);

  // Equip only crafted/unlocked weapons cleanly in 1st, 3rd, and Top View hands
  const handleEquipWeapon = useCallback((id: WeaponId) => {
    if (!unlockedWeaponsRef.current.includes(id)) {
      soundFX.playPop();
      return;
    }
    setEquippedWeapon(id);
    saveEquippedWeapon(id);
    if (playerRef.current) {
      playerRef.current.setWeapon(id);
    }
    syncProgressionToMobs();
    soundFX.playPop();
  }, [syncProgressionToMobs]);

  // Craft a weapon by consuming mined/looted materials from resourceBag
  const handleCraftWeapon = useCallback((id: WeaponId) => {
    const remaining = consumeWeaponRecipe(id, resourceBagRef.current);
    if (!remaining) return;

    setResourceBag(remaining);
    saveResourceBag(remaining);

    setUnlockedWeapons((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      saveUnlockedWeapons(next);
      return next;
    });

    setEquippedWeapon(id);
    saveEquippedWeapon(id);
    if (playerRef.current) {
      playerRef.current.setWeapon(id);
    }
    syncProgressionToMobs();
    soundFX.playPlace('stone');
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: 'System',
        text: `Crafted & equipped ${WEAPON_CATALOG[id].name}!`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  }, [syncProgressionToMobs]);

  const grantItemToPlayer = useCallback((itemType: BlockType, count: number) => {
    const def = BLOCK_DEFS[itemType];
    setPickupNotice({
      text: `+${count} ${def?.name || 'Item'}`,
      iconColor: def?.iconColor || '#888',
      id: Date.now(),
    });
    setTimeout(() => {
      setPickupNotice((curr) => (curr && curr.text.includes(def?.name || '') ? null : curr));
    }, 2500);

    setResourceBag((prevBag) => {
      const nextBag: ResourceBag = {
        ...prevBag,
        [itemType]: (prevBag[itemType] || 0) + count,
      };
      saveResourceBag(nextBag);
      return nextBag;
    });

    setHotbar((prevHotbar) => {
      if (prevHotbar.includes(itemType)) return prevHotbar;
      const emptyIdx = prevHotbar.indexOf(BlockType.AIR);
      if (emptyIdx !== -1) {
        const nextHotbar = [...prevHotbar];
        nextHotbar[emptyIdx] = itemType;
        saveHotbar(nextHotbar);
        if (playerRef.current) {
          playerRef.current.hotbar = [...nextHotbar];
          playerRef.current.updateHeldBlockMesh();
        }
        return nextHotbar;
      }
      setInventory((prevInv) => {
        if (prevInv.includes(itemType)) return prevInv;
        const emptyInvIdx = prevInv.indexOf(null);
        if (emptyInvIdx !== -1) {
          const nextInv = [...prevInv];
          nextInv[emptyInvIdx] = itemType;
          saveInventory(nextInv);
          return nextInv;
        }
        return prevInv;
      });
      return prevHotbar;
    });
  }, []);

  const openNpcInteraction = useCallback((npcId: string) => {
    const mobMgr = mobManagerRef.current;
    if (!mobMgr) return;
    const mob = mobMgr.getMobById(npcId);
    if (!mob || !mobMgr.isInteractableNpc(mob)) return;
    document.exitPointerLock?.();
    mobMgr.triggerNpcReaction(npcId);
    setActiveNpcId(npcId);
    setNpcRefreshTick((t) => t + 1);
  }, []);

  const handlePlayEmote = useCallback((id: EmoteId) => {
    const player = playerRef.current;
    if (!player) return;
    player.playEmote(id);
    setActiveEmoteName(EMOTE_BY_ID[id]?.name || null);
  }, []);

  const handleBuyEmote = useCallback((id: EmoteId) => {
    const def = EMOTE_BY_ID[id];
    if (!def || def.source !== 'shop') return;
    if (unlockedEmotesRef.current.includes(id) || coinsRef.current < def.cost) return;

    const nextCoins = coinsRef.current - def.cost;
    const nextEmotes = [...unlockedEmotesRef.current, id];
    coinsRef.current = nextCoins;
    unlockedEmotesRef.current = nextEmotes;
    setCoins(nextCoins);
    setUnlockedEmotes(nextEmotes);
    persistAccountSnapshot({ coins: nextCoins, unlockedEmotes: nextEmotes });
    soundFX.playRegen();
  }, [persistAccountSnapshot]);

  const handleToggleHoeMode = useCallback(() => {
    setIsHoeMode((prev) => {
      const next = !prev;
      if (playerRef.current) playerRef.current.isHoeMode = next;
      soundFX.playPop();
      return next;
    });
  }, []);

  const handleToggleAdvancedTooltips = useCallback(() => {
    setShowAdvancedTooltips((prev) => {
      const next = !prev;
      showAdvancedTooltipsRef.current = next;
      persistAccountSnapshot({ showAdvancedTooltips: next });
      setF3Notice(`F3 + H Exact Durability Tooltips: ${next ? 'ON' : 'OFF'}`);
      setTimeout(() => setF3Notice(null), 2200);
      soundFX.playPop();
      return next;
    });
  }, [persistAccountSnapshot]);

  const handleUpgradeTool = useCallback((tier: Exclude<GearTierId, 'none'>) => {
    const def = TOOL_TIERS[tier];
    toolTierRef.current = tier;
    toolDurabilityRef.current = def.maxDurability;
    setToolTier(tier);
    setToolDurability(def.maxDurability);
    if (playerRef.current) {
      playerRef.current.toolSpeedMultiplier = def.speedMultiplier;
    }
    if (tier === 'iron') {
      unlockAchievement('acquire_hardware');
    }
    persistAccountSnapshot({ toolTier: tier, toolDurability: def.maxDurability });
    soundFX.playPlace('stone');
  }, [persistAccountSnapshot, unlockAchievement]);

  const handleUpgradeArmor = useCallback((tier: GearTierId) => {
    const def = ARMOR_TIERS[tier];
    armorTierRef.current = tier;
    armorDurabilityRef.current = def.maxDurability;
    setArmorTier(tier);
    setArmorDurability(def.maxDurability);
    if (playerRef.current) {
      playerRef.current.armorReduction = def.damageReduction;
    }
    if (tier === 'iron') {
      unlockAchievement('acquire_hardware');
    }
    persistAccountSnapshot({ armorTier: tier, armorDurability: def.maxDurability });
    soundFX.playPlace('stone');
  }, [persistAccountSnapshot, unlockAchievement]);

  const handleRepairGear = useCallback(() => {
    if (coinsRef.current < 40) return;
    const nextCoins = coinsRef.current - 40;
    const maxTool = TOOL_TIERS[toolTierRef.current].maxDurability;
    const maxArmor = ARMOR_TIERS[armorTierRef.current].damageReduction > 0 ? ARMOR_TIERS[armorTierRef.current].maxDurability : 0;
    coinsRef.current = nextCoins;
    toolDurabilityRef.current = maxTool;
    armorDurabilityRef.current = maxArmor;
    setCoins(nextCoins);
    setToolDurability(maxTool);
    setArmorDurability(maxArmor);
    persistAccountSnapshot({ coins: nextCoins, toolDurability: maxTool, armorDurability: maxArmor });
    soundFX.playRegen();
  }, [persistAccountSnapshot]);

  const handleEnchantUpgrade = useCallback((key: keyof EnchantmentsState) => {
    const maxMap: Record<keyof EnchantmentsState, number> = { fortune: 3, fireAspect: 2, efficiency: 3, unbreaking: 3 };
    const baseCost: Record<keyof EnchantmentsState, number> = { fortune: 140, fireAspect: 160, efficiency: 120, unbreaking: 110 };
    const cur = enchantmentsRef.current[key];
    if (cur >= maxMap[key]) return;
    const cost = baseCost[key] * (cur + 1);
    if (coinsRef.current < cost) return;

    const nextCoins = coinsRef.current - cost;
    const nextEnch: EnchantmentsState = { ...enchantmentsRef.current, [key]: cur + 1 };
    coinsRef.current = nextCoins;
    enchantmentsRef.current = nextEnch;
    setCoins(nextCoins);
    setEnchantments(nextEnch);
    if (playerRef.current) {
      playerRef.current.efficiencyLevel = nextEnch.efficiency;
    }
    persistAccountSnapshot({ coins: nextCoins, enchantments: nextEnch });
    soundFX.playRegen();
  }, [persistAccountSnapshot]);

  const handleBrewPotion = useCallback((id: PotionId) => {
    const def = POTION_CATALOG[id];
    if (!def || coinsRef.current < 90) return;
    const nextCoins = coinsRef.current - 90;
    coinsRef.current = nextCoins;
    setCoins(nextCoins);
    persistAccountSnapshot({ coins: nextCoins });
    playerRef.current?.applyPotion(id, def.durationSec);
    setActivePotions({ ...(playerRef.current?.activePotions || {}) });
  }, [persistAccountSnapshot]);

  const handleTravelDimension = useCallback((targetDim: DimensionId) => {
    const world = worldRef.current;
    const sky = skyRef.current;
    const player = playerRef.current;
    const mobMgr = mobManagerRef.current;
    if (!world || !sky || !player) return;

    saveWorldDeltasImmediate(world.deltas, activeMap.code, world.dimension);
    const nextDeltas = loadSavedWorldDeltas(activeMap.code, targetDim);
    world.setDimension(targetDim, nextDeltas);
    sky.setDimension(targetDim);
    mobMgr?.clearAllMobs();

    const groundY = world.terrain.getHeight(0, 0);
    player.position.set(0.5, Math.max(12, groundY + 1.5), 0.5);
    player.velocity.set(0, 0, 0);
    world.loadAround(player.position.x, player.position.z, 2);

    setDimension(targetDim);
    if (targetDim !== 'overworld') {
      unlockAchievement('adventuring_time');
    }
    soundFX.playEndermanWarp();
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-dim`,
        sender: 'System',
        text: `Entered ${targetDim === 'overworld' ? 'The Overworld' : targetDim === 'nether' ? 'The Nether' : 'The End'}!`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  }, [activeMap.code, unlockAchievement]);

  // Strike nearby/targeted mob with equipped weapon (or talk if bare-hand clicking a friendly NPC)
  const handleWeaponStrike = useCallback((): boolean => {
    const player = playerRef.current;
    const mobMgr = mobManagerRef.current;
    const dropMgr = dropManagerRef.current;
    if (!player || !mobMgr) return false;

    const weapon = WEAPON_CATALOG[equippedWeaponRef.current] || WEAPON_CATALOG.hand;
    const now = performance.now() / 1000;
    if (now - lastAttackTimeRef.current < weapon.cooldown) return false;

    player.swingHand();

    const eyePos = player.position.clone();
    eyePos.y += player.eyeHeight;
    const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(player.rotation);

    let hitMob = mobMgr.raycastMob(eyePos, lookDir, weapon.range)?.mob || null;

    // Bare-hand clicking a friendly NPC opens interaction instead of punching them
    if (hitMob && mobMgr.isInteractableNpc(hitMob) && equippedWeaponRef.current === 'hand') {
      openNpcInteraction(hitMob.id);
      return true;
    }

    // Forgiving melee cone assist for mobile / Top View combat (prioritizes hostile/boss mobs)
    if (!hitMob) {
      const fwdXZ = new THREE.Vector3(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y));
      let bestDist = weapon.range * 0.9;
      for (const m of mobMgr.mobs) {
        if (m.health <= 0 || m.def.category === 'friendly') continue;
        const toMob = new THREE.Vector3(
          m.position.x - player.position.x,
          0,
          m.position.z - player.position.z
        );
        const dist = Math.hypot(toMob.x, toMob.z);
        if (dist <= bestDist && Math.abs(m.position.y - player.position.y) < 3.2) {
          const dir = dist > 0.01 ? toMob.clone().divideScalar(dist) : fwdXZ;
          if (dir.dot(fwdXZ) > 0.45 || dist < 1.8) {
            bestDist = dist;
            hitMob = m;
          }
        }
      }
    }

    if (!hitMob) return false;

    lastAttackTimeRef.current = now;
    let totalDmg = weapon.damage + TOOL_TIERS[toolTierRef.current].damageBonus;
    if ((player.activePotions.strength ?? 0) > 0) totalDmg += 4;
    if (enchantmentsRef.current.fireAspect > 0) totalDmg += 2;
    if (weapon.special === 'fire') totalDmg += 2;
    if (weapon.special === 'void') totalDmg += 3;

    // Critical Hit: attacking while falling in mid-air deals 1.5x damage + 3D starburst particles
    const isCritical = !player.isGrounded && player.velocity.y < -0.2;
    if (isCritical) {
      totalDmg = Math.round(totalDmg * 1.5);
      player.spawnCriticalHitParticles(hitMob.position.x, hitMob.position.y + 0.8, hitMob.position.z);
    }

    const knock = hitMob.position.clone().sub(player.position).multiplyScalar(weapon.knockback);
    mobMgr.attackMob(hitMob, totalDmg, knock, dropMgr || undefined);

    if (weapon.special === 'lifesteal') {
      player.heal(1);
    }

    // Cleave / Lightning AoE hits nearby hostile mobs
    if (weapon.special === 'aoe' || weapon.special === 'lightning') {
      let extraHits = 0;
      for (const other of [...mobMgr.mobs]) {
        if (other === hitMob || other.health <= 0 || other.def.category === 'friendly') continue;
        if (other.position.distanceTo(hitMob.position) <= 3.2) {
          mobMgr.attackMob(
            other,
            Math.max(2, Math.round(totalDmg * 0.6)),
            other.position.clone().sub(player.position),
            dropMgr || undefined
          );
          extraHits++;
          if (extraHits >= 2) break;
        }
      }
    }

    return true;
  }, [openNpcInteraction]);

  const handleSummonMob = useCallback((type: MobType) => {
    const player = playerRef.current;
    const mobMgr = mobManagerRef.current;
    if (!player || !mobMgr) return;
    const lookDir = new THREE.Vector3(0, 0, -1).applyEuler(player.rotation);
    const spawned = mobMgr.summonMob(type, player.position, lookDir);
    if (spawned) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          sender: 'System',
          text: `Summoned ${spawned.def.name} ahead!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    }
  }, []);

  // Handle taking damage
  const handleTakeDamage = useCallback((amount: number = 4) => {
    if (playerRef.current) {
      playerRef.current.takeDamage(amount);
    }
  }, []);

  // Handle player respawn
  const handleRespawn = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.respawn();
      setIsTakingDamage(false);
      requestPointerLock();
    }
  }, [requestPointerLock]);

  // Execute chat command
  const handleExecuteCommand = useCallback((cmd: string) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();

    if (command === '/spawn') {
      playerRef.current?.findSpawnPosition();
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: 'Teleported to world spawn point.', timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/fly') {
      handleToggleFlying();
    } else if (command === '/time') {
      const timeVal = parts[1] === 'day' ? 0.45 : parts[1] === 'night' ? 0.0 : 0.5;
      setTimeOfDay(timeVal);
      skyRef.current?.setTime(timeVal);
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Time set to ${parts[1] || 'noon'}.`, timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/damage') {
      const dmg = parseInt(parts[1], 10) || 4;
      playerRef.current?.takeDamage(dmg);
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Player took ${dmg} damage.`, timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/heal') {
      const hp = parseInt(parts[1], 10) || 4;
      playerRef.current?.heal(hp);
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Healed player for ${hp} HP.`, timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/save') {
      if (worldRef.current) {
        saveWorldDeltasImmediate(worldRef.current.deltas, activeMap.code);
      }
      saveHotbar(hotbarRef.current);
      saveInventory(inventoryRef.current);
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Game state saved to LocalStorage! (${worldRef.current?.deltas.size || 0} modified blocks)`, timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/resetworld') {
      handleResetStorage();
    } else if (command === '/kill') {
      playerRef.current?.takeDamage(20);
    } else if (command === '/topview') {
      handleCameraModeChange('top_view');
    } else if (command === '/summon') {
      const arg = (parts[1] || 'creeper').toLowerCase() as MobType;
      if (MOB_CATALOG[arg]) {
        handleSummonMob(arg);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: `${Date.now()}`, sender: 'System', text: `Unknown mob "${arg}". Examples: creeper, zombie, skeleton, enderman, warden, ender_dragon, wither, iron_golem, villager, bee.`, timestamp: Date.now(), isSystem: true },
        ]);
      }
    } else if (command === '/mobs' && parts[1] === 'clear') {
      const removed = mobManagerRef.current?.clearAllMobs() || 0;
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Cleared ${removed} active mobs.`, timestamp: Date.now(), isSystem: true },
      ]);
    } else if (command === '/weapon') {
      const arg = (parts[1] || '').toLowerCase() as WeaponId;
      if (WEAPON_CATALOG[arg]) {
        if (!unlockedWeaponsRef.current.includes(arg)) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}`,
              sender: 'System',
              text: `${WEAPON_CATALOG[arg].name} is locked! Mine & loot resources, then craft it in the Weapon Forge.`,
              timestamp: Date.now(),
              isSystem: true,
            },
          ]);
        } else {
          handleEquipWeapon(arg);
          setChatMessages((prev) => [
            ...prev,
            { id: `${Date.now()}`, sender: 'System', text: `Equipped ${WEAPON_CATALOG[arg].name}!`, timestamp: Date.now(), isSystem: true },
          ]);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: `${Date.now()}`, sender: 'System', text: `Unlocked weapons: ${unlockedWeaponsRef.current.join(', ')}. Craft more in the Weapon Forge!`, timestamp: Date.now(), isSystem: true },
        ]);
      }
    } else if (command === '/clear') {
      setChatMessages([]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, sender: 'System', text: `Unknown command: ${command}. Try /spawn, /fly, /topview, /summon creeper, /weapon void_obsidian, /time day, /save.`, timestamp: Date.now(), isSystem: true },
      ]);
    }
  }, [handleToggleFlying, handleResetStorage, handleCameraModeChange, handleSummonMob, handleEquipWeapon]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isMobileViewport =
      (window.matchMedia?.('(pointer: coarse)').matches ?? false) || window.innerWidth < 768;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 220);

    // Renderer (tuned dynamically by graphicsQuality for smooth Play Store mobile & crisp desktop)
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl && !isMobileViewport,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Mandatory RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // World & Terrain with room seed and persisted local storage deltas
    const world = new VoxelWorld(scene, activeMap.seed, initialDeltasRef.current);
    worldRef.current = world;

    // Persist all block modifications (place / break) directly to localStorage for this map & dimension
    world.onBlockModified = (_wx, _wy, _wz, _blockType, deltas) => {
      saveWorldDeltasDebounced(deltas, activeMap.code, 500, world.dimension);
    };

    // Sky & Lighting
    const sky = new MinecraftSky(scene);
    skyRef.current = sky;

    let chunkLoadRadius = 2;
    const applyQuality = (quality: GraphicsQuality) => {
      const targetPr =
        isSoftwareGl
          ? 1
          : quality === 'smooth'
          ? Math.min(window.devicePixelRatio, 1.0)
          : quality === 'high'
          ? Math.min(window.devicePixelRatio, isMobileViewport ? 1.75 : 2.0)
          : Math.min(window.devicePixelRatio, isMobileViewport ? 1.35 : 1.75);
      renderer.setPixelRatio(targetPr);
      renderer.shadowMap.enabled = !isSoftwareGl && (quality === 'high' || (!isMobileViewport && quality === 'balanced'));
      renderer.shadowMap.needsUpdate = true;
      chunkLoadRadius = !isMobileViewport && quality === 'high' ? 3 : 2;
      sky.applyGraphicsQuality(quality, isMobileViewport, isSoftwareGl);
    };
    applyQuality(controlSettingsRef.current.graphicsQuality);
    applyGraphicsRef.current = applyQuality;

    // Player Controller
    const player = new Player(camera, world, scene);
    playerRef.current = player;
    player.setSkin(playerSkinRef.current);
    player.setWeapon(equippedWeaponRef.current);
    player.hotbar = [...hotbarRef.current];
    player.selectedSlot = selectedSlotRef.current;
    player.autoJump = controlSettingsRef.current.autoJump;
    player.lookSensitivity = controlSettingsRef.current.lookSensitivity;
    player.toolSpeedMultiplier = TOOL_TIERS[toolTierRef.current].speedMultiplier;
    player.efficiencyLevel = enchantmentsRef.current.efficiency;
    player.armorReduction = ARMOR_TIERS[armorTierRef.current].damageReduction;
    player.updateHeldBlockMesh();

    player.onHealthChange = (newHealth) => {
      setHealth(newHealth);
    };

    player.onHungerChange = (newHunger) => {
      setHunger(newHunger);
    };

    player.onXpChange = (newXp, newLevel, newToNext) => {
      setXp(newXp);
      setXpLevel(newLevel);
      setXpToNextLevel(newToNext);
    };

    let damageTimeout: ReturnType<typeof setTimeout> | null = null;
    player.onDamage = () => {
      setIsTakingDamage(true);
      if (damageTimeout) clearTimeout(damageTimeout);
      damageTimeout = setTimeout(() => {
        setIsTakingDamage(false);
      }, 350);
    };

    player.onFallSaved = () => {
      unlockAchievement('cheating_death');
    };

    player.onArmorHit = () => {
      if (ARMOR_TIERS[armorTierRef.current].damageReduction <= 0) return;
      const skipChance = enchantmentsRef.current.unbreaking * 0.22;
      if (Math.random() < skipChance) return;
      const next = Math.max(0, armorDurabilityRef.current - 1);
      armorDurabilityRef.current = next;
      setArmorDurability(next);
      persistAccountSnapshot({ armorDurability: next });
    };

    player.onToolBreakTick = () => {
      const skipChance = enchantmentsRef.current.unbreaking * 0.24;
      if (Math.random() < skipChance) return;
      const maxD = TOOL_TIERS[toolTierRef.current].maxDurability;
      const next = toolDurabilityRef.current <= 1 ? maxD : toolDurabilityRef.current - 1;
      toolDurabilityRef.current = next;
      setToolDurability(next);
      persistAccountSnapshot({ toolDurability: next });
    };

    // Dropped Items Manager (Mine blocks -> floating spinning 3D drops with 3D spatial hash pickup)
    const dropManager = new DroppedItemManager(scene, world);
    dropManagerRef.current = dropManager;

    // 3D Voxel Mobs & Creatures Engine (Active in BOTH Common Map and Own Created Worlds)
    const mobManager = new MobManager(scene, world, activeMap.seed);
    mobManagerRef.current = mobManager;
    mobManager.setProgressScore(
      computeProgressScore(progressStatsRef.current, equippedWeaponRef.current),
      true
    );

    mobManager.onMobKilled = (def, killedMob) => {
      if (def.type === 'cow') {
        unlockAchievement('cow_tipper');
      }
      if (enchantmentsRef.current.fireAspect > 0 && def.category === 'passive' && killedMob) {
        addCoins(12);
        dropManager.spawnDrop(
          Math.floor(killedMob.position.x),
          Math.floor(killedMob.position.y + 0.5),
          Math.floor(killedMob.position.z),
          BlockType.HAY_BALE
        );
      }
      if (def.category === 'hostile' || def.category === 'boss') {
        addCoins(def.category === 'boss' ? 120 : 25);
        progressStatsRef.current.mobsDefeated += 1;
        savePlayerProgress(activeMap.code, progressStatsRef.current);
        mobManager.setProgressScore(
          computeProgressScore(progressStatsRef.current, equippedWeaponRef.current)
        );
      } else {
        addCoins(6);
      }
    };

    mobManager.onGraceEnd = () => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-grace`,
          sender: 'System',
          text: 'Starter calm period ended — weak Slimes, Spiders & Zombies now roam nearby.',
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    mobManager.onTierUp = (_tier, title, detail) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-tier`,
          sender: 'Alert',
          text: `${title}: ${detail}`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    player.onBlockBreak = (bx, by, bz, oldBlock) => {
      if (!player.isSneaking) {
        mobManager.emitSoundVibration(player.position, 22);
      }
      const dropCount = getFortuneDropCount(oldBlock, enchantmentsRef.current.fortune);
      for (let d = 0; d < dropCount; d++) {
        dropManager.spawnDrop(bx, by, bz, oldBlock);
      }
      updateRedstoneAround(world, bx, by, bz);
      world.updateMeshes(2, player.position.x, player.position.z);
      multiplayerRef.current?.sendBlockChange(bx, by, bz, BlockType.AIR);
      progressStatsRef.current.blocksMined += 1;
      setBlocksMinedTotal((prev) => prev + 1);
      player.addXp(
        oldBlock === BlockType.DIAMOND_ORE ? 8 :
        oldBlock === BlockType.GOLD_ORE ? 4 :
        oldBlock === BlockType.IRON_ORE ? 2 : 1
      );
      if (oldBlock === BlockType.IRON_ORE) unlockAchievement('acquire_hardware');
      if (oldBlock === BlockType.DIAMOND_ORE) unlockAchievement('diamonds_to_you');
      if (
        oldBlock === BlockType.COAL_ORE ||
        oldBlock === BlockType.IRON_ORE ||
        oldBlock === BlockType.GOLD_ORE ||
        oldBlock === BlockType.DIAMOND_ORE
      ) {
        progressStatsRef.current.oresFound += 1;
        addCoins(oldBlock === BlockType.DIAMOND_ORE ? 20 : oldBlock === BlockType.GOLD_ORE ? 10 : 5);
      } else {
        addCoins(1);
      }
      mobManager.setProgressScore(
        computeProgressScore(progressStatsRef.current, equippedWeaponRef.current)
      );
    };

    dropManager.onCollect = (itemType: BlockType, count: number, name: string) => {
      const def = BLOCK_DEFS[itemType];
      setPickupNotice({
        text: `+${count} ${name}`,
        iconColor: def?.iconColor || '#888',
        id: Date.now(),
      });

      // Automatically clear after 2.5s
      setTimeout(() => {
        setPickupNotice((curr) => (curr && curr.text.includes(name) ? null : curr));
      }, 2500);

      // Record mined & looted resource for Weapon Forge crafting
      setResourceBag((prevBag) => {
        const nextBag: ResourceBag = {
          ...prevBag,
          [itemType]: (prevBag[itemType] || 0) + count,
        };
        saveResourceBag(nextBag);
        return nextBag;
      });

      // Add to hotbar or inventory
      setHotbar((prevHotbar) => {
        const nextHotbar = [...prevHotbar];
        const emptyIdx = nextHotbar.indexOf(BlockType.AIR);
        if (emptyIdx !== -1) {
          nextHotbar[emptyIdx] = itemType;
          saveHotbar(nextHotbar);
          if (playerRef.current) {
            playerRef.current.hotbar = [...nextHotbar];
            playerRef.current.updateHeldBlockMesh();
          }
          return nextHotbar;
        }

        // Hotbar is full; add to inventory
        setInventory((prevInv) => {
          const nextInv = [...prevInv];
          const emptyInvIdx = nextInv.indexOf(null);
          if (emptyInvIdx !== -1) {
            nextInv[emptyInvIdx] = itemType;
            saveInventory(nextInv);
            return nextInv;
          }
          return prevInv;
        });

        return nextHotbar;
      });
    };

    player.onDeath = () => {
      setIsTakingDamage(true);
      document.exitPointerLock?.();
    };

    // Room-Scoped Multiplayer Client
    const multiplayer = new MultiplayerClient(
      world,
      scene,
      activeMap.code,
      activeMap.seed,
      activeMap.name,
      playerNameRef.current,
      playerSkinRef.current
    );
    multiplayerRef.current = multiplayer;

    multiplayer.onChatMessage = (msg) => {
      setChatMessages((prev) =>
        prev.some((existing) => existing.id === msg.id)
          ? prev
          : [...prev.slice(-99), msg]
      );
    };

    multiplayer.onPlayerCountChange = (count) => {
      setOnlineCount(count);
    };

    multiplayer.onConnectionChange = (_connected, transport) => {
      setConnectionTransport(transport);
    };

    multiplayer.onShardAssigned = ({ x, z }) => {
      player.setSpawnSector(x, z, false);
      // If player has not wandered away from initial spawn, relocate smoothly into their shard's regional plaza
      if ((x !== 0 || z !== 0) && Math.hypot(player.position.x, player.position.z) < 8) {
        player.setSpawnSector(x, z, true);
        world.loadAround(player.position.x, player.position.z, chunkLoadRadius, 4);
      }
    };

    mobManager.onBlocksExploded = (changes) => {
      for (const ch of changes) {
        multiplayer.sendBlockChange(ch.x, ch.y, ch.z, ch.block);
      }
    };

    mobManager.onVillainWave = (waveNumber, villainNames) => {
      const summary = villainNames.join(', ');
      setVillainAlert({ wave: waveNumber, text: summary });
      if (villainAlertTimerRef.current) clearTimeout(villainAlertTimerRef.current);
      villainAlertTimerRef.current = setTimeout(() => {
        setVillainAlert(null);
      }, 4500);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${waveNumber}`,
          sender: 'Alert',
          text: `Villains are coming! (Wave ${waveNumber}): ${summary}`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    mobManager.onMobKilled = (def) => {
      setMobsKilledTotal((prev) => prev + 1);
      const xpGain = def.category === 'boss' ? 50 : def.category === 'hostile' ? 15 : 4;
      player.addXp(xpGain);
    };

    const survivalTimer = setInterval(() => {
      setTimeSurvivedSec((prev) => prev + 1);
    }, 1000);

    // Load initial chunks around spawn
    world.loadAround(player.position.x, player.position.z, chunkLoadRadius);

    // Track pointer lock changes
    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === container;
      setIsLocked(locked);
    };
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Helper for interacting with NPCs, Crafting Table / Furnace / Stations, Tools, or placing blocks
    const handlePlaceOrInteract = () => {
      tmpEye.copy(player.position);
      tmpEye.y += player.eyeHeight;
      tmpLook.set(0, 0, -1).applyEuler(player.rotation);
      const heldBlock = player.getSelectedBlock();

      // 1. Check aimed mob for Name Tag, Golden Dandelion, Flint & Steel on Creeper, or NPC chat
      const aimedMobHit = mobManager.raycastMob(tmpEye, tmpLook, 5.5);
      if (aimedMobHit) {
        const hitMob = aimedMobHit.mob;
        if (heldBlock === BlockType.FLINT_AND_STEEL && hitMob.def.type === 'creeper') {
          mobManager.igniteCreeper(hitMob);
          return;
        }
        if (heldBlock === BlockType.NAME_TAG) {
          mobManager.applyNameTag(hitMob);
          return;
        }
        if (heldBlock === BlockType.GOLDEN_DANDELION && mobManager.applyGoldenDandelion(hitMob)) {
          return;
        }
        if (mobManager.isInteractableNpc(hitMob)) {
          openNpcInteraction(hitMob.id);
          return;
        }
      }

      // 2. Water Bucket MLG save works even mid-air below player if no block targeted
      if (heldBlock === BlockType.WATER_BUCKET) {
        const targetPos = player.currentTarget
          ? player.currentTarget.neighborPosition
          : ([Math.floor(player.position.x), Math.floor(player.position.y - 0.5), Math.floor(player.position.z)] as [number, number, number]);
        world.setBlock(targetPos[0], targetPos[1], targetPos[2], BlockType.WATER);
        world.updateMeshes(2, player.position.x, player.position.z);
        soundFX.playPlace('stone');
        if (player.velocity.y < -11.5) {
          unlockAchievement('cheating_death');
        }
        return;
      }

      // 3. Eating edible crops / food
      const isFood = (
        heldBlock === BlockType.CARROT_CROP ||
        heldBlock === BlockType.POTATO_CROP ||
        heldBlock === BlockType.MELON_BLOCK ||
        heldBlock === BlockType.BEETROOT_CROP ||
        heldBlock === BlockType.WHEAT_CROP
      );
      if (isFood && player.hunger < player.maxHunger) {
        player.eatFood(heldBlock === BlockType.MELON_BLOCK ? 4 : 3);
        setF3Notice('+Food consumed! Hunger restored.');
        setTimeout(() => setF3Notice(null), 1600);
        return;
      }

      if (player.currentTarget) {
        const [bx, by, bz] = player.currentTarget.blockPosition;
        const targetType = player.currentTarget.blockType;

        if (targetType === BlockType.FURNACE) {
          document.exitPointerLock?.();
          setIsFurnaceOpen(true);
          soundFX.playPop();
          return;
        }
        if (targetType === BlockType.CRAFTING_TABLE) {
          document.exitPointerLock?.();
          setIsCraftingOpen(true);
          soundFX.playPop();
          return;
        }
        if (targetType === BlockType.ENCHANTING_TABLE || targetType === BlockType.BREWING_STAND) {
          document.exitPointerLock?.();
          setIsStationOpen(true);
          soundFX.playPop();
          return;
        }
        if (targetType === BlockType.NETHER_PORTAL) {
          handleTravelDimension(world.dimension === 'nether' ? 'overworld' : 'nether');
          return;
        }
        if (targetType === BlockType.END_PORTAL_FRAME) {
          handleTravelDimension(world.dimension === 'end' ? 'overworld' : 'end');
          return;
        }

        // Flint & Steel lights Candles & Obsidian Nether Portals
        if (heldBlock === BlockType.FLINT_AND_STEEL) {
          if (targetType === BlockType.CANDLE) {
            world.setBlock(bx, by, bz, BlockType.CANDLE_LIT);
            world.updateMeshes(2, player.position.x, player.position.z);
            soundFX.playPlace('stone');
            return;
          }
          if (targetType === BlockType.OBSIDIAN) {
            const [nx, ny, nz] = player.currentTarget.neighborPosition;
            world.setBlock(nx, ny, nz, BlockType.NETHER_PORTAL);
            world.updateMeshes(2, player.position.x, player.position.z);
            soundFX.playEndermanWarp();
            return;
          }
        }

        // Bone Meal fertilizes grass, crops, bamboo, and sugarcane
        if (heldBlock === BlockType.BONE_MEAL) {
          const grown = applyBoneMeal(world, bx, by, bz);
          if (grown > 0) {
            world.updateMeshes(2, player.position.x, player.position.z);
            soundFX.playRegen();
          }
          return;
        }

        // Hoe mode tills Grass / Dirt into Farmland
        if (player.isHoeMode && (targetType === BlockType.GRASS || targetType === BlockType.DIRT)) {
          world.setBlock(bx, by, bz, BlockType.FARMLAND);
          world.updateMeshes(2, player.position.x, player.position.z);
          soundFX.playPlace('dirt');
          return;
        }
      }

      const success = player.placeBlock();
      if (success && player.currentTarget) {
        const [nx, ny, nz] = player.currentTarget.neighborPosition;
        if (
          heldBlock === BlockType.REDSTONE_DUST ||
          heldBlock === BlockType.REDSTONE_TORCH ||
          heldBlock === BlockType.PISTON ||
          heldBlock === BlockType.COMPARATOR
        ) {
          updateRedstoneAround(world, nx, ny, nz);
        }
        if (!player.isSneaking) {
          mobManager.emitSoundVibration(player.position, 18);
        }
        world.updateMeshes(2, player.position.x, player.position.z);
        multiplayer.sendBlockChange(nx, ny, nz, heldBlock);
      }
    };
    placeOrInteractRef.current = handlePlaceOrInteract;

    // Free PC & Laptop Mouse/Trackpad State (supports both FPS Pointer Lock & Unlocked Drag-Look)
    let dragState: {
      active: boolean;
      button: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      moved: boolean;
      mineTimer: ReturnType<typeof setTimeout> | null;
    } | null = null;

    // Mouse movement (Locked FPS mouse OR Unlocked mouse/trackpad drag-look)
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        player.handleMouseMove(e.movementX, e.movementY);
        return;
      }

      if (dragState?.active) {
        const totalDist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
        if (totalDist > 5 && !dragState.moved) {
          dragState.moved = true;
          if (dragState.mineTimer) {
            clearTimeout(dragState.mineTimer);
            dragState.mineTimer = null;
          }
          player.isBreaking = false;
          player.breakProgress = 0;
        }

        if (dragState.moved) {
          const dx = e.clientX - dragState.lastX;
          const dy = e.clientY - dragState.lastY;
          player.handleMouseMove(dx * 1.35, dy * 1.35);
        }

        dragState.lastX = e.clientX;
        dragState.lastY = e.clientY;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    // Mouse clicks on 3D Canvas (Left = Mine/Drag-Look, Right = Place/Interact, Double-Click = FPS Lock)
    const canvasEl = renderer.domElement;

    const onCanvasMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        if (e.button === 0) {
          const hitMob = handleWeaponStrike();
          if (!hitMob) {
            player.isBreaking = true;
          }
        } else if (e.button === 2) {
          e.preventDefault();
          handlePlaceOrInteract();
        }
        return;
      }

      // Unlocked free PC/laptop mouse mode
      if (e.button === 2) e.preventDefault();

      const mineTimer =
        e.button === 0
          ? setTimeout(() => {
              if (dragState?.active && !dragState.moved) {
                const hitMob = handleWeaponStrike();
                if (!hitMob) {
                  player.isBreaking = true;
                }
              }
            }, 140)
          : null;

      dragState = {
        active: true,
        button: e.button,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        moved: false,
        mineTimer,
      };
    };

    const onMouseUp = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        if (e.button === 0) {
          player.isBreaking = false;
          player.breakProgress = 0;
        }
        return;
      }

      if (dragState?.active) {
        if (dragState.mineTimer) {
          clearTimeout(dragState.mineTimer);
        }

        if (!dragState.moved && dragState.button === 2) {
          handlePlaceOrInteract();
        }
        dragState = null;
      }

      if (e.button === 0) {
        player.isBreaking = false;
        player.breakProgress = 0;
      }
    };

    const onCanvasDblClick = () => {
      if (document.pointerLockElement !== container) {
        container.requestPointerLock?.();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvasEl.addEventListener('mousedown', onCanvasMouseDown);
    canvasEl.addEventListener('dblclick', onCanvasDblClick);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);

    // Full-Screen Touch Reacting System directly on 3D Canvas
    // - Touch & drag anywhere: silky smooth camera rotation (with exponential micro-damping)
    // - Optional (when Tap Screen to Build is ON): touch & hold mines, quick tap places/interacts
    canvasEl.style.touchAction = 'none';
    let pendingLookX = 0;
    let pendingLookY = 0;

    let touchState: {
      id: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      startTime: number;
      dragged: boolean;
      mining: boolean;
      holdTimer: ReturnType<typeof setTimeout> | null;
    } | null = null;

    const onCanvasTouchStart = (e: TouchEvent) => {
      if (touchState !== null) return;
      const t = e.changedTouches[0];
      if (!t) return;

      const allowTapBuild = controlSettingsRef.current.tapScreenToBuild;
      if (allowTapBuild) {
        setTouchRing({ x: t.clientX, y: t.clientY, mining: false });
      }

      const holdTimer = allowTapBuild
        ? setTimeout(() => {
            if (touchState && !touchState.dragged && touchState.id === t.identifier) {
              touchState.mining = true;
              player.isBreaking = true;
              setTouchRing({ x: touchState.lastX, y: touchState.lastY, mining: true });
            }
          }, 260)
        : null;

      touchState = {
        id: t.identifier,
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
        startTime: performance.now(),
        dragged: false,
        mining: false,
        holdTimer,
      };
    };

    const onCanvasTouchMove = (e: TouchEvent) => {
      if (!touchState) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchState.id) {
          e.preventDefault();
          const dist = Math.hypot(t.clientX - touchState.startX, t.clientY - touchState.startY);
          if (dist > 8 && !touchState.dragged) {
            touchState.dragged = true;
            if (touchState.holdTimer) {
              clearTimeout(touchState.holdTimer);
              touchState.holdTimer = null;
            }
            if (touchState.mining) {
              touchState.mining = false;
              player.isBreaking = false;
              player.breakProgress = 0;
            }
            setTouchRing(null);
          }

          const dx = t.clientX - touchState.lastX;
          const dy = t.clientY - touchState.lastY;
          touchState.lastX = t.clientX;
          touchState.lastY = t.clientY;

          // Accumulate into smooth look buffer processed per frame
          pendingLookX += dx * 0.0044;
          pendingLookY += dy * 0.0044;
          break;
        }
      }
    };

    const onCanvasTouchEnd = (e: TouchEvent) => {
      if (!touchState) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchState.id) {
          if (touchState.holdTimer) clearTimeout(touchState.holdTimer);
          setTouchRing(null);

          if (touchState.mining) {
            player.isBreaking = false;
            player.breakProgress = 0;
          } else if (
            controlSettingsRef.current.tapScreenToBuild &&
            !touchState.dragged &&
            performance.now() - touchState.startTime < 240
          ) {
            handlePlaceOrInteract();
          }

          touchState = null;
          break;
        }
      }
    };

    canvasEl.addEventListener('touchstart', onCanvasTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    canvasEl.addEventListener('touchend', onCanvasTouchEnd);
    canvasEl.addEventListener('touchcancel', onCanvasTouchEnd);

    // Scroll wheel for hotbar selection (works both locked and unlocked over canvas)
    const onWheel = (e: WheelEvent) => {
      if (document.pointerLockElement === container || e.target === canvasEl) {
        setSelectedSlot((prev) => {
          const delta = Math.sign(e.deltaY);
          const next = (prev + delta + 9) % 9;
          player.selectedSlot = next;
          player.updateHeldBlockMesh();
          soundFX.playPop();
          return next;
        });
      }
    };
    window.addEventListener('wheel', onWheel);

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'F3') {
        e.preventDefault();
        isF3HeldRef.current = true;
        return;
      }

      if (e.code === 'KeyH' && isF3HeldRef.current) {
        e.preventDefault();
        handleToggleAdvancedTooltips();
        return;
      }

      switch (e.code) {
        case 'KeyW':
          player.keys.forward = true;
          break;
        case 'KeyS':
          player.keys.backward = true;
          break;
        case 'KeyA':
          player.keys.left = true;
          break;
        case 'KeyD':
          player.keys.right = true;
          break;
        case 'Space':
          player.keys.jump = true;
          player.handleJumpPress();
          setIsFlying(player.isFlying);
          if (!player.isSneaking) {
            mobManager.emitSoundVibration(player.position, 18);
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          player.keys.sneak = true;
          player.isSneaking = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          player.keys.sprint = true;
          player.isSprinting = true;
          break;
        case 'KeyE':
          e.preventDefault();
          setIsInventoryOpen((prev) => {
            if (!prev) document.exitPointerLock?.();
            return !prev;
          });
          break;
        case 'KeyC':
          e.preventDefault();
          setIsCraftingOpen((prev) => {
            if (!prev) document.exitPointerLock?.();
            return !prev;
          });
          break;
        case 'KeyB':
          e.preventDefault();
          setIsFurnaceOpen((prev) => {
            if (!prev) document.exitPointerLock?.();
            return !prev;
          });
          break;
        case 'KeyG':
          e.preventDefault();
          setIsEmotesOpen((prev) => {
            if (!prev) document.exitPointerLock?.();
            return !prev;
          });
          break;
        case 'KeyV':
          e.preventDefault();
          setIsStationOpen((prev) => {
            if (!prev) document.exitPointerLock?.();
            return !prev;
          });
          break;
        case 'KeyQ':
          e.preventDefault();
          handleToggleHoeMode();
          break;
        case 'KeyT':
          e.preventDefault();
          document.exitPointerLock?.();
          setIsChatOpen(true);
          break;
        case 'KeyF':
          player.isFlying = !player.isFlying;
          setIsFlying(player.isFlying);
          soundFX.playPop();
          break;
        case 'KeyR': {
          tmpEye.copy(player.position);
          tmpEye.y += player.eyeHeight;
          tmpLook.set(0, 0, -1).applyEuler(player.rotation);
          const npc =
            mobManager.raycastInteractableNpc(tmpEye, tmpLook, 5.5) ||
            mobManager.findNearestInteractableNpc(player.position, 4.5);
          if (npc) {
            e.preventDefault();
            openNpcInteraction(npc.id);
          }
          break;
        }
        case 'F5':
          e.preventDefault();
          cycleCameraMode();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9': {
          const slot = parseInt(e.key, 10) - 1;
          setSelectedSlot(slot);
          player.selectedSlot = slot;
          player.updateHeldBlockMesh();
          soundFX.playPop();
          break;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        isF3HeldRef.current = false;
        return;
      }
      switch (e.code) {
        case 'KeyW':
          player.keys.forward = false;
          break;
        case 'KeyS':
          player.keys.backward = false;
          break;
        case 'KeyA':
          player.keys.left = false;
          break;
        case 'KeyD':
          player.keys.right = false;
          break;
        case 'Space':
          player.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          player.keys.sneak = false;
          player.isSneaking = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          player.keys.sprint = false;
          player.isSprinting = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Game loop
    let frameId = 0;
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let lastChunkX = world.worldToChunkCoord(player.position.x);
    let lastChunkZ = world.worldToChunkCoord(player.position.z);
    let lastBiomeCheck = 0;
    let lastHudSync = 0;
    let lastBreakVal = 0;
    const tmpEye = new THREE.Vector3();
    const tmpLook = new THREE.Vector3();

    let lastProgressSync = performance.now();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);

      // FPS counter
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = now;
      }

      // Smoothly drain buffered touch look deltas for jitter-free 60fps mobile camera motion
      if (Math.abs(pendingLookX) > 0.0001 || Math.abs(pendingLookY) > 0.0001) {
        const blend = Math.min(1, delta * 28);
        const stepX = pendingLookX * blend;
        const stepY = pendingLookY * blend;
        player.handleLookDelta(stepX, stepY);
        pendingLookX -= stepX;
        pendingLookY -= stepY;
      }

      // Update Player
      player.update(delta);

      // Update Player Progression & Threat Tier every 5s
      if (now - lastProgressSync >= 5000) {
        lastProgressSync = now;
        progressStatsRef.current.playSeconds += 5;
        savePlayerProgress(activeMap.code, progressStatsRef.current);
        mobManager.setProgressScore(
          computeProgressScore(progressStatsRef.current, equippedWeaponRef.current)
        );
      }

      // Update Mobs & Creatures AI (Active in both Common & Own Maps)
      mobManager.update(delta, player, sky.timeOfDay, dropManager);

      // Update floating item drops & magnetic pickup
      dropManager.update(delta, player.position);

      if (Math.abs(player.breakProgress - lastBreakVal) > 0.01 || (player.breakProgress === 0 && lastBreakVal !== 0)) {
        lastBreakVal = player.breakProgress;
        setBreakProgress(player.breakProgress);
      }

      // Update Sky & Sun (including drifting ProceduralCloudLayer)
      sky.update(delta, player.position);

      // Update Multiplayer networking & other player avatars
      multiplayer.sendUpdate({
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        yaw: player.rotation.y,
        pitch: player.rotation.x,
        isSneaking: player.isSneaking,
        isFlying: player.isFlying,
        isSwinging: player.isSwinging,
        heldBlock: player.getSelectedBlock(),
      });
      multiplayer.update(delta);

      // Smooth 10Hz HUD, Mini-Map, Mob Target, Potions & Multiplayer Radar sync
      if (now - lastHudSync > 100) {
        lastHudSync = now;
        setPlayerPos({ x: player.position.x, y: player.position.y, z: player.position.z });
        setPlayerYaw(player.rotation.y);
        setOtherPlayers(multiplayer.getOtherPlayersList());
        setRadarMobs(mobManager.getRadarMobs());
        setActiveMobCount(mobManager.mobs.length);
        setIsSneaking(player.isSneaking);
        setSavedDeltaCount(world.deltas.size);
        setActivePotions({ ...player.activePotions });
        setActiveEmoteName(player.activeEmote ? EMOTE_BY_ID[player.activeEmote.id]?.name || null : null);
        setTargetBlockName(
          player.currentTarget ? BLOCK_DEFS[player.currentTarget.blockType]?.name || null : null
        );

        tmpEye.copy(player.position);
        tmpEye.y += player.eyeHeight;
        tmpLook.set(0, 0, -1).applyEuler(player.rotation);
        const wRange = WEAPON_CATALOG[equippedWeaponRef.current]?.range ?? 5;
        const aimMob = mobManager.raycastMob(tmpEye, tmpLook, Math.max(wRange, 5.5));
        setTargetedMob(
          aimMob
            ? {
                id: aimMob.mob.id,
                name: mobManager.getMobDisplayName(aimMob.mob),
                npcRole: aimMob.mob.npcRole,
                category: aimMob.mob.def.category,
                health: aimMob.mob.health,
                maxHealth: aimMob.mob.maxHealth,
              }
            : null
        );
        const nearNpc = mobManager.findNearestInteractableNpc(player.position, 4.2);
        setNearbyNpc(
          nearNpc
            ? {
                id: nearNpc.id,
                name: mobManager.getMobDisplayName(nearNpc),
                role: nearNpc.npcRole || 'Friendly NPC',
              }
            : null
        );
      }

      // Stream chunks on boundary cross & smoothly flush any pending dirty meshes (1 per frame)
      const currChunkX = world.worldToChunkCoord(player.position.x);
      const currChunkZ = world.worldToChunkCoord(player.position.z);
      if (currChunkX !== lastChunkX || currChunkZ !== lastChunkZ) {
        lastChunkX = currChunkX;
        lastChunkZ = currChunkZ;
        world.loadAround(player.position.x, player.position.z, chunkLoadRadius, 2);
      } else if (world.hasPendingMeshes()) {
        world.updateMeshes(1, player.position.x, player.position.z);
      }
      if (now - lastBiomeCheck > 2400) {
        lastBiomeCheck = now;
        const curBiome = world.terrain.getBiome(player.position.x, player.position.z);
        setBiome(curBiome);
        if (!seenBiomesRef.current.has(curBiome)) {
          seenBiomesRef.current.add(curBiome);
          if (seenBiomesRef.current.size >= 3) {
            unlockAchievement('adventuring_time');
          }
        }
        // Periodic crop, sugarcane, bamboo & bee pollination growth in Overworld
        if (world.dimension === 'overworld') {
          tickNatureGrowth(
            world,
            player.position.x,
            player.position.y,
            player.position.z,
            sky.timeOfDay,
            mobManager.hasBeesNear(player.position)
          );
        }
      }

      // Render
      renderer.render(scene, camera);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      applyGraphicsRef.current = null;
      placeOrInteractRef.current = null;
      savePlayerProgress(activeMap.code, progressStatsRef.current);
      cancelAnimationFrame(frameId);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('mousemove', onMouseMove);
      canvasEl.removeEventListener('mousedown', onCanvasMouseDown);
      canvasEl.removeEventListener('dblclick', onCanvasDblClick);
      canvasEl.removeEventListener('touchstart', onCanvasTouchStart);
      canvasEl.removeEventListener('touchmove', onCanvasTouchMove);
      canvasEl.removeEventListener('touchend', onCanvasTouchEnd);
      canvasEl.removeEventListener('touchcancel', onCanvasTouchEnd);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);

      if (villainAlertTimerRef.current) {
        clearTimeout(villainAlertTimerRef.current);
        villainAlertTimerRef.current = null;
      }
      clearInterval(survivalTimer);
      soundFX.stopMusic();
      mobManager.dispose();
      dropManager.dispose();
      multiplayer.dispose();
      world.dispose();
      sky.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeMap.code, activeMap.name, activeMap.seed, computeProgressScore, cycleCameraMode, handleWeaponStrike]);

  const handleShareInvite = useCallback(() => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?map=${encodeURIComponent(activeMap.code)}&seed=${encodeURIComponent(activeMap.seed)}&name=${encodeURIComponent(activeMap.name)}`;
    if (navigator.share) {
      navigator.share({
        title: `Join my VoxelCraft World: ${activeMap.name}`,
        text: `Play 3D VoxelCraft with me! Map Code: ${activeMap.code}`,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteUrl);
      setF3Notice('Copied invite link to clipboard!');
      setTimeout(() => setF3Notice(null), 2500);
    }
  }, [activeMap.code, activeMap.name, activeMap.seed]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none touch-none">
      {/* Mobile Orientation Warning & Auto-Rotate */}
      <OrientationLock />

      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 cursor-crosshair touch-none" />

      {/* Minecraft HUD Overlay */}
      <HUD
        hotbar={hotbar}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSelectSlot}
        playerPos={playerPos}
        playerYaw={playerYaw}
        biome={biome}
        fps={fps}
        onlineCount={onlineCount}
        breakProgress={breakProgress}
        isFlying={isFlying}
        isLocked={isLocked}
        onLockPointer={requestPointerLock}
        health={health}
        maxHealth={maxHealth}
        isTakingDamage={isTakingDamage}
        onRespawn={handleRespawn}
        onDamageTest={() => handleTakeDamage(4)}
        world={worldRef.current}
        pickupNotice={pickupNotice}
        otherPlayers={otherPlayers}
        radarMobs={radarMobs}
        terrainVersion={savedDeltaCount}
        targetedMob={targetedMob}
        nearbyNpc={nearbyNpc}
        onInteractNpc={(npcId) => openNpcInteraction(npcId)}
        equippedWeapon={equippedWeapon}
        onOpenWeapons={() => {
          document.exitPointerLock?.();
          setIsWeaponsOpen(true);
        }}
        onOpenMobs={() => {
          document.exitPointerLock?.();
          setIsMobsOpen(true);
        }}
        cameraMode={cameraMode}
        onCycleCamera={cycleCameraMode}
        onBackToMenu={onBackToMenu}
        onOpenSettings={() => {
          document.exitPointerLock?.();
          setIsGameSettingsOpen(true);
        }}
        villainAlert={villainAlert}
        showMobileControls={showMobileControls}
        hasModalOpen={isInventoryOpen || isCraftingOpen || isFurnaceOpen || isChatOpen || isSkinOpen || isWeaponsOpen || isMobsOpen || isGameSettingsOpen || isEmotesOpen || isStationOpen || Boolean(activeNpcId)}
        mapCode={activeMap.code}
        mapName={activeMap.name}
        isCommonMap={activeMap.isCommon}
        connectionTransport={connectionTransport}
        dimension={dimension}
        coins={coins}
        toolLabel={formatDurabilityLabel(
          TOOL_TIERS[toolTier].name,
          toolDurability,
          TOOL_TIERS[toolTier].maxDurability,
          showAdvancedTooltips
        )}
        armorLabel={
          armorTier !== 'none'
            ? formatDurabilityLabel(
                ARMOR_TIERS[armorTier].name,
                armorDurability,
                ARMOR_TIERS[armorTier].maxDurability,
                showAdvancedTooltips
              )
            : undefined
        }
        showAdvancedTooltips={showAdvancedTooltips}
        activePotions={activePotions}
        isHoeMode={isHoeMode}
        onToggleHoeMode={handleToggleHoeMode}
        onOpenEmotes={() => {
          document.exitPointerLock?.();
          setIsEmotesOpen(true);
        }}
        onOpenStation={() => {
          document.exitPointerLock?.();
          setIsStationOpen(true);
        }}
        activeEmoteName={activeEmoteName}
        achievementToast={achievementToast}
        f3Notice={f3Notice}
        hunger={hunger}
        maxHunger={maxHunger}
        xp={xp}
        xpLevel={xpLevel}
        xpToNextLevel={xpToNextLevel}
        blocksMinedTotal={blocksMinedTotal}
        mobsKilledTotal={mobsKilledTotal}
        timeSurvivedSec={timeSurvivedSec}
        onShareInvite={handleShareInvite}
      />

      {/* Chat Overlay */}
      <ChatOverlay
        messages={chatMessages}
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        onSendMessage={(text) => {
          multiplayerRef.current?.sendChat(text);
        }}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* Inventory & Backpack Modal with LocalStorage persistence */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          requestPointerLock();
        }}
        selectedSlot={selectedSlot}
        hotbar={hotbar}
        inventory={inventory}
        onSetHotbarBlock={handleSetHotbarBlock}
        onSetInventorySlot={handleSetInventorySlot}
        onSwapInventoryHotbar={handleSwapInventoryHotbar}
        onSortInventory={handleSortInventory}
        onResetStorage={handleResetStorage}
        savedDeltaCount={savedDeltaCount}
        onOpenCrafting={() => {
          document.exitPointerLock?.();
          setIsCraftingOpen(true);
        }}
      />

      {/* Crafting Table 3x3 Workbench Modal */}
      <CraftingTableModal
        isOpen={isCraftingOpen}
        onClose={() => {
          setIsCraftingOpen(false);
          requestPointerLock();
        }}
        hotbar={hotbar}
        selectedSlot={selectedSlot}
        onSetHotbarBlock={handleSetHotbarBlock}
      />

      {/* Furnace Smelting Workstation Modal */}
      <FurnaceModal
        isOpen={isFurnaceOpen}
        onClose={() => {
          setIsFurnaceOpen(false);
          requestPointerLock();
        }}
        hotbar={hotbar}
        selectedSlot={selectedSlot}
        onSetHotbarBlock={handleSetHotbarBlock}
      />

      {/* Skin / Profile Selector */}
      <SkinSelector
        isOpen={isSkinOpen}
        onClose={() => {
          setIsSkinOpen(false);
          requestPointerLock();
        }}
        currentName={multiplayerRef.current?.myName || playerName}
        currentSkin={multiplayerRef.current?.mySkin || playerSkin}
        onSave={(name, skin) => {
          onUpdateProfile(name, skin);
          if (playerRef.current) {
            playerRef.current.setSkin(skin);
          }
          if (multiplayerRef.current) {
            multiplayerRef.current.myName = name;
            multiplayerRef.current.mySkin = skin;
            multiplayerRef.current.send({
              type: 'join',
              name,
              skin,
            });
          }
        }}
      />

      {/* Weapons Forge & Armory Modal */}
      <WeaponArmoryModal
        isOpen={isWeaponsOpen}
        onClose={() => {
          setIsWeaponsOpen(false);
          requestPointerLock();
        }}
        equippedWeapon={equippedWeapon}
        unlockedWeapons={unlockedWeapons}
        resourceBag={resourceBag}
        onEquipWeapon={handleEquipWeapon}
        onCraftWeapon={handleCraftWeapon}
      />

      {/* Creatures & Mobs Bestiary Modal */}
      <MobBestiaryModal
        isOpen={isMobsOpen}
        onClose={() => {
          setIsMobsOpen(false);
          requestPointerLock();
        }}
        onSummonMob={handleSummonMob}
        onClearMobs={() => {
          const count = mobManagerRef.current?.clearAllMobs() || 0;
          setActiveMobCount(0);
          setChatMessages((prev) => [
            ...prev,
            { id: `${Date.now()}`, sender: 'System', text: `Cleared ${count} mobs.`, timestamp: Date.now(), isSystem: true },
          ]);
        }}
        activeMobCount={activeMobCount}
      />

      {/* Interactive Friendly NPC Talk & Trade Modal */}
      <NpcInteractModal
        isOpen={Boolean(activeNpcId)}
        npcData={(() => {
          void npcRefreshTick;
          if (!activeNpcId || !mobManagerRef.current) return null;
          const mob = mobManagerRef.current.getMobById(activeNpcId);
          return mob ? mobManagerRef.current.getNpcInteractionData(mob) : null;
        })()}
        resourceBag={resourceBag}
        playerHealth={health}
        playerMaxHealth={maxHealth}
        onClose={() => {
          setActiveNpcId(null);
          requestPointerLock();
        }}
        onTalk={(npcId) => {
          mobManagerRef.current?.triggerNpcReaction(npcId, '#38bdf8');
        }}
        onClaimGift={(npcId, block, count) => {
          mobManagerRef.current?.markNpcGiftClaimed(npcId, 45);
          grantItemToPlayer(block, count);
          setNpcRefreshTick((t) => t + 1);
        }}
        onTrade={(npcId, offer: NpcTradeOffer) => {
          const currentOwned = resourceBagRef.current[offer.costBlock] || 0;
          if (currentOwned < offer.costCount) return false;
          setResourceBag((prevBag) => {
            const nextBag: ResourceBag = { ...prevBag };
            nextBag[offer.costBlock] = Math.max(0, (nextBag[offer.costBlock] || 0) - offer.costCount);
            if (nextBag[offer.costBlock] === 0) delete nextBag[offer.costBlock];
            saveResourceBag(nextBag);
            return nextBag;
          });
          grantItemToPlayer(offer.rewardBlock, offer.rewardCount);
          if (offer.rewardBlock === BlockType.DIAMOND_ORE) {
            unlockAchievement('diamonds_to_you');
          }
          mobManagerRef.current?.triggerNpcReaction(npcId, '#fbbf24');
          setNpcRefreshTick((t) => t + 1);
          return true;
        }}
        onHealPlayer={(npcId, amount) => {
          playerRef.current?.heal(amount);
          mobManagerRef.current?.triggerNpcReaction(npcId, '#34d399');
        }}
        onEscort={(npcId, seconds) => {
          mobManagerRef.current?.setNpcFollow(npcId, seconds);
          setNpcRefreshTick((t) => t + 1);
        }}
      />

      {/* Emotes, Achievements & Coin Shop Modal */}
      <EmotesModal
        isOpen={isEmotesOpen}
        onClose={() => {
          setIsEmotesOpen(false);
          requestPointerLock();
        }}
        coins={coins}
        unlockedEmotes={unlockedEmotes}
        unlockedAchievements={unlockedAchievements}
        activeEmoteName={activeEmoteName}
        onPlayEmote={handlePlayEmote}
        onBuyEmote={handleBuyEmote}
      />

      {/* Gear Tiers, Enchanting Table, Brewing Stand & Dimension Portals Modal */}
      <EnchantPotionModal
        isOpen={isStationOpen}
        onClose={() => {
          setIsStationOpen(false);
          requestPointerLock();
        }}
        toolTier={toolTier}
        armorTier={armorTier}
        toolDurability={toolDurability}
        armorDurability={armorDurability}
        enchantments={enchantments}
        showAdvancedTooltips={showAdvancedTooltips}
        activePotions={activePotions}
        dimension={dimension}
        coins={coins}
        onUpgradeTool={handleUpgradeTool}
        onUpgradeArmor={handleUpgradeArmor}
        onRepairGear={handleRepairGear}
        onEnchantUpgrade={handleEnchantUpgrade}
        onToggleAdvancedTooltips={handleToggleAdvancedTooltips}
        onBrewPotion={handleBrewPotion}
        onTravelDimension={handleTravelDimension}
      />

      {/* In-Game 3-Dot Settings Modal */}
      <GameSettingsModal
        isOpen={isGameSettingsOpen}
        onClose={() => {
          setIsGameSettingsOpen(false);
          requestPointerLock();
        }}
        cameraMode={cameraMode}
        onCameraModeChange={handleCameraModeChange}
        controlSettings={controlSettings}
        onUpdateControlSettings={handleUpdateControlSettings}
        showMobileControls={showMobileControls}
        onToggleMobileControls={() => setShowMobileControls((prev) => !prev)}
        isFlying={isFlying}
        onToggleFlying={handleToggleFlying}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted((prev) => {
            const next = !prev;
            soundFX.setMuted(next);
            return next;
          });
        }}
        timeOfDay={timeOfDay}
        onTimeChange={(val) => {
          setTimeOfDay(val);
          skyRef.current?.setTime(val);
        }}
        autoCycle={autoCycle}
        onToggleAutoCycle={() => {
          setAutoCycle((prev) => {
            const next = !prev;
            if (skyRef.current) skyRef.current.autoCycle = next;
            return next;
          });
        }}
        onOpenWeapons={() => {
          document.exitPointerLock?.();
          setIsWeaponsOpen(true);
        }}
        onOpenMobs={() => {
          document.exitPointerLock?.();
          setIsMobsOpen(true);
        }}
        onOpenInventory={() => {
          document.exitPointerLock?.();
          setIsInventoryOpen(true);
        }}
        onOpenCrafting={() => {
          document.exitPointerLock?.();
          setIsCraftingOpen(true);
        }}
        onOpenFurnace={() => {
          document.exitPointerLock?.();
          setIsFurnaceOpen(true);
        }}
        onOpenChat={() => {
          document.exitPointerLock?.();
          setIsChatOpen(true);
        }}
        onOpenSkinSelector={() => {
          document.exitPointerLock?.();
          setIsSkinOpen(true);
        }}
        onOpenEmotes={() => {
          document.exitPointerLock?.();
          setIsEmotesOpen(true);
        }}
        onOpenStation={() => {
          document.exitPointerLock?.();
          setIsStationOpen(true);
        }}
        dimension={dimension}
        onTravelDimension={handleTravelDimension}
        onBackToMenu={onBackToMenu}
        mapCode={activeMap.code}
        mapSeed={activeMap.seed}
        mapName={activeMap.name}
      />

      {/* Collapsible Bottom Control Dock (Desktop mode — mobile uses Menu button below Controls) */}
      {!showMobileControls && (
      <BottomControlDock
        health={health}
        onTakeDamage={() => handleTakeDamage(4)}
        cameraMode={cameraMode}
        onCameraModeChange={handleCameraModeChange}
        isFlying={isFlying}
        onToggleFlying={handleToggleFlying}
        timeOfDay={timeOfDay}
        onTimeChange={(val) => {
          setTimeOfDay(val);
          skyRef.current?.setTime(val);
        }}
        autoCycle={autoCycle}
        onToggleAutoCycle={() => {
          setAutoCycle((prev) => {
            const next = !prev;
            if (skyRef.current) skyRef.current.autoCycle = next;
            return next;
          });
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted((prev) => {
            const next = !prev;
            soundFX.setMuted(next);
            return next;
          });
        }}
        onOpenInventory={() => {
          document.exitPointerLock?.();
          setIsInventoryOpen(true);
        }}
        onOpenCrafting={() => {
          document.exitPointerLock?.();
          setIsCraftingOpen(true);
        }}
        onOpenFurnace={() => {
          document.exitPointerLock?.();
          setIsFurnaceOpen(true);
        }}
        onOpenWeapons={() => {
          document.exitPointerLock?.();
          setIsWeaponsOpen(true);
        }}
        onOpenMobs={() => {
          document.exitPointerLock?.();
          setIsMobsOpen(true);
        }}
        onOpenChat={() => {
          document.exitPointerLock?.();
          setIsChatOpen(true);
        }}
        onOpenSkinSelector={() => {
          document.exitPointerLock?.();
          setIsSkinOpen(true);
        }}
        showMobileControls={showMobileControls}
        onToggleMobileControls={() => setShowMobileControls(!showMobileControls)}
        mapCode={activeMap.code}
        mapSeed={activeMap.seed}
        mapName={activeMap.name}
        onBackToMenu={onBackToMenu}
        onOpenEmotes={() => {
          document.exitPointerLock?.();
          setIsEmotesOpen(true);
        }}
        onOpenStation={() => {
          document.exitPointerLock?.();
          setIsStationOpen(true);
        }}
        isHoeMode={isHoeMode}
        onToggleHoeMode={handleToggleHoeMode}
      />
      )}

      {/* Touch Screen Feedback Ring (Tap to place / Hold to mine) */}
      {touchRing && (
        <div
          className={`pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-150 ${
            touchRing.mining
              ? 'h-14 w-14 border-red-400 bg-red-500/20 animate-pulse'
              : 'h-10 w-10 border-white/75 bg-white/10'
          }`}
          style={{ left: touchRing.x, top: touchRing.y }}
        />
      )}

      {/* Multi-Control Mobile System & Easy-Build Action Buttons */}
      {showMobileControls && (
        <MobileControls
          controlSettings={controlSettings}
          onUpdateControlSettings={handleUpdateControlSettings}
          onAnalogMove={handleAnalogMove}
          onDirectionChange={handleDirectionChange}
          onJumpPress={(pressed) => {
            if (playerRef.current) {
              playerRef.current.keys.jump = pressed;
              if (pressed) playerRef.current.handleJumpPress();
            }
          }}
          onMinePress={(pressed) => {
            if (playerRef.current) {
              if (pressed) {
                const hitMob = handleWeaponStrike();
                if (!hitMob) {
                  playerRef.current.isBreaking = true;
                }
              } else {
                playerRef.current.isBreaking = false;
                playerRef.current.breakProgress = 0;
              }
            }
          }}
          onAttackPress={handleWeaponStrike}
          onPlacePress={() => {
            if (placeOrInteractRef.current) {
              placeOrInteractRef.current();
              return;
            }
            const p = playerRef.current;
            if (p) {
              const success = p.placeBlock();
              if (success && p.currentTarget) {
                worldRef.current?.updateMeshes(2, p.position.x, p.position.z);
                const [nx, ny, nz] = p.currentTarget.neighborPosition;
                multiplayerRef.current?.sendBlockChange(nx, ny, nz, p.getSelectedBlock());
              }
            }
          }}
          onTowerUp={() => {
            if (playerRef.current) {
              const bx = Math.floor(playerRef.current.position.x);
              const by = Math.floor(playerRef.current.position.y);
              const bz = Math.floor(playerRef.current.position.z);
              const success = playerRef.current.towerUp();
              if (success) {
                worldRef.current?.updateMeshes(2, playerRef.current.position.x, playerRef.current.position.z);
                multiplayerRef.current?.sendBlockChange(bx, by, bz, playerRef.current.getSelectedBlock());
              }
            }
          }}
          onBridgeForward={() => {
            if (playerRef.current) {
              const p = playerRef.current;
              const dirX = -Math.sin(p.rotation.y);
              const dirZ = -Math.cos(p.rotation.y);
              const tx = Math.floor(p.position.x + dirX * 1.1);
              const ty = Math.floor(p.position.y - 0.2);
              const tz = Math.floor(p.position.z + dirZ * 1.1);
              const success = p.bridgeForward();
              if (success) {
                worldRef.current?.updateMeshes(2, p.position.x, p.position.z);
                multiplayerRef.current?.sendBlockChange(tx, ty, tz, p.getSelectedBlock());
              }
            }
          }}
          onSneakToggle={() => {
            if (playerRef.current) {
              const next = !playerRef.current.isSneaking;
              playerRef.current.isSneaking = next;
              playerRef.current.keys.sneak = next;
              setIsSneaking(next);
              soundFX.playPop();
            }
          }}
          isSneaking={isSneaking}
          onFlyToggle={handleToggleFlying}
          isFlying={isFlying}
          targetBlockName={targetBlockName}
          onOpenMenu={() => {
            document.exitPointerLock?.();
            setIsGameSettingsOpen(true);
          }}
        />
      )}
    </div>
  );
}
