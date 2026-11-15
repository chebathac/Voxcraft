import * as THREE from 'three';

export interface MinecraftSkinDef {
  id: string;
  name: string;
  title: string;
  skinTone: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  shoesColor: string;
  accentColor?: string;
  eyeColor: string;
  isSlim?: boolean; // Alex, Efe, Makena, Ari use 3-pixel slim arms
  description: string;
}

export const DEFAULT_MINECRAFT_SKINS: Record<string, MinecraftSkinDef> = {
  steve: {
    id: 'steve',
    name: 'Steve',
    title: 'The Iconic Miner',
    skinTone: '#c68e65',
    hairColor: '#4a2f1b',
    shirtColor: '#00a8b5', // vibrant cyan teal
    pantsColor: '#2b3987', // deep blue jeans
    shoesColor: '#4d4d4d', // gray sneakers
    eyeColor: '#2b448a',
    isSlim: false,
    description: 'The legendary original Minecraft explorer.',
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    title: 'Wilderness Survivalist',
    skinTone: '#e8b595',
    hairColor: '#b85428', // bright orange ginger
    shirtColor: '#5b8731', // moss green tunic
    pantsColor: '#583f2a', // brown trousers
    shoesColor: '#6a6866', // grey boots
    eyeColor: '#1d5e30',
    isSlim: true,
    description: 'Agile explorer with ginger hair and green tunic.',
  },
  noor: {
    id: 'noor',
    name: 'Noor',
    title: 'Bold Engineer',
    skinTone: '#78462b', // rich dark skin
    hairColor: '#1f130b', // curly dark brown/black
    shirtColor: '#a62624', // red collared jacket over black
    pantsColor: '#1e5f56', // deep teal pants
    shoesColor: '#2d2d2d',
    accentColor: '#1a1a1a',
    eyeColor: '#30180d',
    isSlim: false,
    description: 'Crimson-jacketed explorer with teal trousers.',
  },
  sunny: {
    id: 'sunny',
    name: 'Sunny',
    title: 'Farmstead Artisan',
    skinTone: '#b57c52',
    hairColor: '#222222', // black bowl cut
    shirtColor: '#63843a', // green collared shirt under denim
    pantsColor: '#3d6199', // classic blue denim overalls
    shoesColor: '#403020',
    eyeColor: '#2d1c10',
    isSlim: false,
    description: 'Energetic builder wearing denim overalls.',
  },
  ari: {
    id: 'ari',
    name: 'Ari',
    title: 'Forest Weaver',
    skinTone: '#e3ad84',
    hairColor: '#a64223', // red ginger hair tied back
    shirtColor: '#dca442', // warm ochre yellow sweater
    pantsColor: '#2d3345', // navy trousers
    shoesColor: '#57483b',
    eyeColor: '#335035',
    isSlim: true,
    description: 'Warm yellow sweater with dark denim trousers.',
  },
  zuri: {
    id: 'zuri',
    name: 'Zuri',
    title: 'Athletic Runner',
    skinTone: '#543220', // deep brown tone
    hairColor: '#111111',
    shirtColor: '#b82a24', // red athletic shirt with white accent
    pantsColor: '#a89476', // tan khaki cargo trousers
    shoesColor: '#2b2b2b',
    accentColor: '#ffffff',
    eyeColor: '#1a120c',
    isSlim: false,
    description: 'Sporty red top with tan khaki cargo trousers.',
  },
  efe: {
    id: 'efe',
    name: 'Efe',
    title: 'Night Sky Jeweler',
    skinTone: '#87563c',
    hairColor: '#80598a', // lavender purple dyed crop
    shirtColor: '#6ca8a8', // pastel turquoise short-sleeve
    pantsColor: '#281c30', // dark violet trousers
    shoesColor: '#cfa936', // shimmering golden boots
    accentColor: '#cfa936',
    eyeColor: '#402a48',
    isSlim: true,
    description: 'Lavender hair, turquoise shirt, and golden boots.',
  },
  kai: {
    id: 'kai',
    name: 'Kai',
    title: 'Royal Alchemist',
    skinTone: '#e6bca3',
    hairColor: '#d6b856', // golden blonde hair
    shirtColor: '#4a3363', // royal lavender/purple hoodie with gold trim
    pantsColor: '#322540', // dark plum trousers
    shoesColor: '#b83b3b', // red and white sneakers
    accentColor: '#e0b838',
    eyeColor: '#30426b',
    isSlim: false,
    description: 'Blonde hair with royal purple trimmed coat.',
  },
  makena: {
    id: 'makena',
    name: 'Makena',
    title: 'Highlands Pathfinder',
    skinTone: '#4a2c1d', // warm dark skin
    hairColor: '#1c130d', // dark braids
    shirtColor: '#cf9c27', // sunshine yellow shirt with braids
    pantsColor: '#78262f', // rich burgundy red trousers
    shoesColor: '#2a221e',
    eyeColor: '#241710',
    isSlim: true,
    description: 'Braided hair, sunshine yellow top, and burgundy trousers.',
  },
};

// Procedural 3D Character Material Generator for any of the 9 skins
export function getSkinMaterials(skinId: string) {
  const def = DEFAULT_MINECRAFT_SKINS[skinId] || DEFAULT_MINECRAFT_SKINS.steve;

  const skinMat = new THREE.MeshLambertMaterial({ color: def.skinTone });
  const hairMat = new THREE.MeshLambertMaterial({ color: def.hairColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: def.shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: def.pantsColor });
  const shoesMat = new THREE.MeshLambertMaterial({ color: def.shoesColor });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: def.eyeColor });

  return {
    def,
    skinMat,
    hairMat,
    shirtMat,
    pantsMat,
    shoesMat,
    eyeMat,
    pupilMat,
  };
}
