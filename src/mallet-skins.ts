// Mallet skin system for Neon Hockey VR
export interface MalletSkin {
  id: string;
  name: string;
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  ringColor: string;
  ringOpacity: number;
  metalness: number;
  roughness: number;
  icon: string;
  unlockCondition?: string;
}

export const MALLET_SKINS: MalletSkin[] = [
  {
    id: 'default_green',
    name: 'Neon Green',
    color: '#00ff88',
    emissiveColor: '#00ff88',
    emissiveIntensity: 0.6,
    ringColor: '#00ff88',
    ringOpacity: 0.5,
    metalness: 0.4,
    roughness: 0.3,
    icon: '🟢',
  },
  {
    id: 'electric_blue',
    name: 'Electric Blue',
    color: '#00aaff',
    emissiveColor: '#0088ff',
    emissiveIntensity: 0.7,
    ringColor: '#00ccff',
    ringOpacity: 0.5,
    metalness: 0.5,
    roughness: 0.2,
    icon: '🔵',
  },
  {
    id: 'hot_pink',
    name: 'Hot Pink',
    color: '#ff44aa',
    emissiveColor: '#ff2288',
    emissiveIntensity: 0.7,
    ringColor: '#ff66bb',
    ringOpacity: 0.5,
    metalness: 0.3,
    roughness: 0.3,
    icon: '💗',
  },
  {
    id: 'gold',
    name: 'Gold Rush',
    color: '#ffd700',
    emissiveColor: '#ffaa00',
    emissiveIntensity: 0.8,
    ringColor: '#ffd700',
    ringOpacity: 0.6,
    metalness: 0.8,
    roughness: 0.15,
    icon: '🥇',
  },
  {
    id: 'void',
    name: 'Void Walker',
    color: '#6633ff',
    emissiveColor: '#4422cc',
    emissiveIntensity: 0.9,
    ringColor: '#7744ff',
    ringOpacity: 0.5,
    metalness: 0.3,
    roughness: 0.4,
    icon: '🟣',
    unlockCondition: 'Win 25 games',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    color: '#cccccc',
    emissiveColor: '#ffffff',
    emissiveIntensity: 0.4,
    ringColor: '#ffffff',
    ringOpacity: 0.6,
    metalness: 0.95,
    roughness: 0.05,
    icon: '⬜',
    unlockCondition: 'Unlock 20 achievements',
  },
];

export function getUnlockedMalletSkins(achievements: Set<string>, stats: { totalWins: number }): Set<string> {
  const unlocked = new Set<string>(['default_green', 'electric_blue', 'hot_pink', 'gold']);
  if (stats.totalWins >= 25) unlocked.add('void');
  if (achievements.size >= 20) unlocked.add('chrome');
  return unlocked;
}

export function getSavedMalletSkin(): string {
  return localStorage.getItem('neon-hockey-mallet-skin') || 'default_green';
}

export function saveMalletSkin(id: string): void {
  localStorage.setItem('neon-hockey-mallet-skin', id);
}

export function getMalletSkinById(id: string): MalletSkin {
  return MALLET_SKINS.find(s => s.id === id) || MALLET_SKINS[0];
}
