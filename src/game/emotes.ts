export type EmoteSource = 'free' | 'achievement' | 'shop';

export type EmoteId =
  // Free / Default
  | 'over_there'
  | 'simple_clap'
  | 'wave'
  | 'the_woodpunch'
  // Achievement Unlocked
  | 'the_hammer'
  | 'diamonds_to_you'
  | 'the_pickaxe'
  | 'faceplant'
  | 'fake_death'
  // Coin Shop
  | 'over_here'
  | 'breakdance'
  | 'chatting'
  | 'sad_sigh'
  | 'anger_management'
  | 'aeroplane'
  | 'back_handsprings'
  | 'the_elytra';

export type AchievementId =
  | 'acquire_hardware'
  | 'diamonds_to_you'
  | 'adventuring_time'
  | 'cow_tipper'
  | 'cheating_death';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  rewardCoins: number;
  unlocksEmote: EmoteId;
}

export interface EmoteDef {
  id: EmoteId;
  name: string;
  source: EmoteSource;
  cost: number; // 0 for free/achievement
  achievementId?: AchievementId;
  unlockHint: string;
  duration: number; // seconds
  accentColor: string;
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  acquire_hardware: {
    id: 'acquire_hardware',
    name: 'Acquire Hardware',
    description: 'Mine Iron Ore or forge Iron-tier gear',
    rewardCoins: 180,
    unlocksEmote: 'the_hammer',
  },
  diamonds_to_you: {
    id: 'diamonds_to_you',
    name: 'Diamonds to you!',
    description: 'Discover Diamond Ore or trade with an NPC',
    rewardCoins: 260,
    unlocksEmote: 'diamonds_to_you',
  },
  adventuring_time: {
    id: 'adventuring_time',
    name: 'Adventuring Time',
    description: 'Explore multiple biomes or travel to another dimension',
    rewardCoins: 240,
    unlocksEmote: 'the_pickaxe',
  },
  cow_tipper: {
    id: 'cow_tipper',
    name: 'Cow Tipper',
    description: 'Defeat a Cow or harvest pasture animals',
    rewardCoins: 160,
    unlocksEmote: 'faceplant',
  },
  cheating_death: {
    id: 'cheating_death',
    name: 'Cheating Death',
    description: 'Save yourself with a Water Bucket MLG or survive lethal danger',
    rewardCoins: 320,
    unlocksEmote: 'fake_death',
  },
};

export const EMOTE_CATALOG: EmoteDef[] = [
  // Free / Default
  {
    id: 'over_there',
    name: 'Over There!',
    source: 'free',
    cost: 0,
    unlockHint: 'Free / Default',
    duration: 2.0,
    accentColor: '#38bdf8',
  },
  {
    id: 'simple_clap',
    name: 'Simple Clap',
    source: 'free',
    cost: 0,
    unlockHint: 'Free / Default',
    duration: 2.2,
    accentColor: '#34d399',
  },
  {
    id: 'wave',
    name: 'Wave',
    source: 'free',
    cost: 0,
    unlockHint: 'Free / Default',
    duration: 2.2,
    accentColor: '#fbbf24',
  },
  {
    id: 'the_woodpunch',
    name: 'The Woodpunch',
    source: 'free',
    cost: 0,
    unlockHint: 'Free',
    duration: 1.8,
    accentColor: '#a16207',
  },
  // Achievement Unlocks
  {
    id: 'the_hammer',
    name: 'The Hammer',
    source: 'achievement',
    cost: 0,
    achievementId: 'acquire_hardware',
    unlockHint: 'Unlock via Acquire Hardware achievement',
    duration: 2.2,
    accentColor: '#cbd5e1',
  },
  {
    id: 'diamonds_to_you',
    name: 'Silly / Diamonds To You!',
    source: 'achievement',
    cost: 0,
    achievementId: 'diamonds_to_you',
    unlockHint: 'Unlock via Diamonds to you! achievement',
    duration: 2.4,
    accentColor: '#22d3ee',
  },
  {
    id: 'the_pickaxe',
    name: 'The Pickaxe',
    source: 'achievement',
    cost: 0,
    achievementId: 'adventuring_time',
    unlockHint: 'Unlock via Adventuring Time achievement',
    duration: 2.2,
    accentColor: '#818cf8',
  },
  {
    id: 'faceplant',
    name: 'Faceplant',
    source: 'achievement',
    cost: 0,
    achievementId: 'cow_tipper',
    unlockHint: 'Unlock via Cow Tipper achievement',
    duration: 2.3,
    accentColor: '#fb7185',
  },
  {
    id: 'fake_death',
    name: 'Fake Death',
    source: 'achievement',
    cost: 0,
    achievementId: 'cheating_death',
    unlockHint: 'Unlock via Cheating Death achievement',
    duration: 2.8,
    accentColor: '#f43f5e',
  },
  // Coin Shop Emotes
  {
    id: 'over_here',
    name: 'Over Here!',
    source: 'shop',
    cost: 310,
    unlockHint: '310 Coins',
    duration: 2.2,
    accentColor: '#60a5fa',
  },
  {
    id: 'breakdance',
    name: 'Breakdance',
    source: 'shop',
    cost: 660,
    unlockHint: '660 Coins',
    duration: 3.2,
    accentColor: '#c084fc',
  },
  {
    id: 'chatting',
    name: 'Chatting',
    source: 'shop',
    cost: 160,
    unlockHint: '160 Coins',
    duration: 2.2,
    accentColor: '#4ade80',
  },
  {
    id: 'sad_sigh',
    name: 'Sad Sigh',
    source: 'shop',
    cost: 310,
    unlockHint: '310 Coins',
    duration: 2.4,
    accentColor: '#94a3b8',
  },
  {
    id: 'anger_management',
    name: 'Anger Management',
    source: 'shop',
    cost: 160,
    unlockHint: '160 Coins',
    duration: 2.2,
    accentColor: '#ef4444',
  },
  {
    id: 'aeroplane',
    name: 'Aeroplane',
    source: 'shop',
    cost: 310,
    unlockHint: '310 Coins',
    duration: 2.8,
    accentColor: '#38bdf8',
  },
  {
    id: 'back_handsprings',
    name: 'Back Handsprings',
    source: 'shop',
    cost: 660,
    unlockHint: '660 Coins',
    duration: 2.8,
    accentColor: '#f59e0b',
  },
  {
    id: 'the_elytra',
    name: 'The Elytra',
    source: 'shop',
    cost: 660,
    unlockHint: '660 Coins',
    duration: 3.0,
    accentColor: '#a855f7',
  },
];

export const EMOTE_BY_ID: Record<EmoteId, EmoteDef> = EMOTE_CATALOG.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<EmoteId, EmoteDef>
);

export interface EmotePose {
  rootOffsetY: number;
  rootRotX: number;
  rootRotY: number;
  rootRotZ: number;
  headRotX: number;
  headRotY: number;
  leftArmX: number;
  leftArmZ: number;
  rightArmX: number;
  rightArmZ: number;
  leftLegX: number;
  rightLegX: number;
}

const ZERO_POSE: EmotePose = {
  rootOffsetY: 0,
  rootRotX: 0,
  rootRotY: 0,
  rootRotZ: 0,
  headRotX: 0,
  headRotY: 0,
  leftArmX: 0,
  leftArmZ: 0,
  rightArmX: 0,
  rightArmZ: 0,
  leftLegX: 0,
  rightLegX: 0,
};

/**
 * Computes crisp procedural 3D character poses for every emote so players see
 * full-body motion in 3rd-person, Front-view, Top-view, and 1st-person hand swings.
 */
export function computeEmotePose(id: EmoteId, elapsed: number, duration: number): EmotePose {
  const pose = { ...ZERO_POSE };
  const t = Math.min(1, Math.max(0, elapsed / Math.max(0.1, duration)));
  const env = Math.sin(t * Math.PI); // Smooth ease-in / ease-out envelope
  const s8 = Math.sin(elapsed * 8);
  const s12 = Math.sin(elapsed * 12);

  switch (id) {
    case 'over_there':
      pose.rightArmX = -1.65 * env;
      pose.headRotY = -0.35 * env;
      pose.rootRotY = -0.2 * env;
      break;
    case 'simple_clap':
      pose.leftArmX = -1.25 * env;
      pose.rightArmX = -1.25 * env;
      pose.leftArmZ = (0.35 + Math.abs(s12) * 0.35) * env;
      pose.rightArmZ = -(0.35 + Math.abs(s12) * 0.35) * env;
      break;
    case 'wave':
      pose.rightArmX = -2.4 * env;
      pose.rightArmZ = (0.35 + s12 * 0.45) * env;
      pose.headRotY = 0.2 * Math.sin(elapsed * 4);
      break;
    case 'the_woodpunch':
      pose.rightArmX = (-1.4 + s12 * 0.75) * env;
      pose.leftArmX = -0.6 * env;
      pose.rootRotY = s12 * 0.25 * env;
      break;
    case 'the_hammer':
      pose.leftArmX = (-2.1 + Math.abs(s8) * 1.6) * env;
      pose.rightArmX = (-2.1 + Math.abs(s8) * 1.6) * env;
      pose.rootRotX = (0.28 * Math.abs(s8)) * env;
      break;
    case 'diamonds_to_you':
      pose.leftArmX = -1.3 * env;
      pose.rightArmX = -1.3 * env;
      pose.rootOffsetY = Math.abs(s8) * 0.32 * env;
      pose.rootRotY = Math.sin(elapsed * 5) * 0.45 * env;
      break;
    case 'the_pickaxe':
      pose.rightArmX = (-2.2 + Math.sin(elapsed * 10) * 1.3) * env;
      pose.leftArmX = (-1.1 + Math.sin(elapsed * 10) * 0.6) * env;
      pose.leftLegX = -0.25 * env;
      pose.rightLegX = 0.25 * env;
      break;
    case 'faceplant': {
      const fall = Math.min(1, t * 2.2) * (t > 0.8 ? (1 - t) * 5 : 1);
      pose.rootRotX = 1.48 * fall;
      pose.rootOffsetY = -0.55 * fall;
      pose.leftArmX = -1.1 * fall;
      pose.rightArmX = -1.1 * fall;
      break;
    }
    case 'fake_death': {
      const drop = Math.min(1, t * 2.4) * (t > 0.82 ? (1 - t) * 5.5 : 1);
      pose.rootRotZ = 1.48 * drop;
      pose.rootOffsetY = -0.5 * drop;
      pose.leftArmZ = 0.65 * drop;
      pose.rightArmZ = -0.65 * drop;
      pose.headRotX = 0.4 * drop;
      break;
    }
    case 'over_here':
      pose.leftArmX = -2.6 * env;
      pose.rightArmX = -2.6 * env;
      pose.leftArmZ = (0.3 + s12 * 0.35) * env;
      pose.rightArmZ = -(0.3 + s12 * 0.35) * env;
      pose.rootOffsetY = Math.abs(s12) * 0.38 * env;
      break;
    case 'breakdance':
      pose.rootOffsetY = 0.45 * env;
      pose.rootRotX = Math.PI * env;
      pose.rootRotY = elapsed * 7.5;
      pose.leftLegX = Math.sin(elapsed * 11) * 0.9 * env;
      pose.rightLegX = -Math.sin(elapsed * 11) * 0.9 * env;
      pose.leftArmX = -2.1 * env;
      pose.rightArmX = -2.1 * env;
      break;
    case 'chatting':
      pose.leftArmX = (-0.8 + Math.sin(elapsed * 9) * 0.35) * env;
      pose.rightArmX = (-0.9 - Math.sin(elapsed * 9) * 0.35) * env;
      pose.headRotX = Math.sin(elapsed * 7) * 0.18 * env;
      pose.headRotY = Math.sin(elapsed * 3.5) * 0.28 * env;
      break;
    case 'sad_sigh':
      pose.headRotX = 0.55 * env;
      pose.rootRotX = 0.16 * env;
      pose.leftArmX = -0.15 * env;
      pose.rightArmX = -0.15 * env;
      pose.rootOffsetY = -0.08 * Math.sin(elapsed * 3) * env;
      break;
    case 'anger_management':
      pose.leftArmX = (-1.6 + s12 * 0.7) * env;
      pose.rightArmX = (-1.6 - s12 * 0.7) * env;
      pose.rootOffsetY = Math.abs(Math.sin(elapsed * 14)) * 0.25 * env;
      pose.headRotY = Math.sin(elapsed * 18) * 0.2 * env;
      break;
    case 'aeroplane':
      pose.leftArmZ = 1.45 * env;
      pose.rightArmZ = -1.45 * env;
      pose.rootRotZ = Math.sin(elapsed * 4) * 0.35 * env;
      pose.rootRotX = 0.2 * env;
      pose.rootOffsetY = 0.25 * env;
      break;
    case 'back_handsprings':
      pose.rootOffsetY = Math.abs(Math.sin(t * Math.PI * 3)) * 0.95 * env;
      pose.rootRotX = -t * Math.PI * 4;
      pose.leftArmX = -2.7 * env;
      pose.rightArmX = -2.7 * env;
      break;
    case 'the_elytra':
      pose.rootOffsetY = 0.65 * env + Math.sin(elapsed * 5) * 0.18 * env;
      pose.rootRotX = 1.05 * env;
      pose.leftArmZ = 0.95 * env;
      pose.rightArmZ = -0.95 * env;
      pose.leftLegX = 0.25 * env;
      pose.rightLegX = 0.25 * env;
      break;
  }

  return pose;
}
