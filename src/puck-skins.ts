// Puck skin system for Neon Hockey VR
import {
  Mesh, CylinderGeometry, SphereGeometry, TorusGeometry, RingGeometry,
  MeshStandardMaterial, MeshBasicMaterial, Color, AdditiveBlending, Group, DoubleSide,
} from '@iwsdk/core';

export interface PuckSkin {
  id: string;
  name: string;
  color: string;
  emissiveColor: string;
  emissiveIntensity: number;
  glowColor: string;
  glowOpacity: number;
  trailColor: string;
  metalness: number;
  roughness: number;
  icon: string;
  unlockCondition?: string; // description for locked skins
}

export const PUCK_SKINS: PuckSkin[] = [
  {
    id: 'default',
    name: 'Classic Neon',
    color: '#ff6600',
    emissiveColor: '#ff6600',
    emissiveIntensity: 0.8,
    glowColor: '#ff6600',
    glowOpacity: 0.3,
    trailColor: '#ff6600',
    metalness: 0.3,
    roughness: 0.4,
    icon: '🟠',
  },
  {
    id: 'plasma',
    name: 'Plasma Core',
    color: '#ff00ff',
    emissiveColor: '#ff44ff',
    emissiveIntensity: 1.0,
    glowColor: '#ff00ff',
    glowOpacity: 0.4,
    trailColor: '#ff66ff',
    metalness: 0.2,
    roughness: 0.3,
    icon: '🟣',
  },
  {
    id: 'ice',
    name: 'Frozen Disc',
    color: '#88ddff',
    emissiveColor: '#44aaff',
    emissiveIntensity: 0.6,
    glowColor: '#66ccff',
    glowOpacity: 0.35,
    trailColor: '#88eeff',
    metalness: 0.7,
    roughness: 0.15,
    icon: '🔵',
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    color: '#ffcc00',
    emissiveColor: '#ff8800',
    emissiveIntensity: 1.2,
    glowColor: '#ffaa00',
    glowOpacity: 0.45,
    trailColor: '#ffdd44',
    metalness: 0.4,
    roughness: 0.2,
    icon: '🟡',
  },
  {
    id: 'toxic',
    name: 'Toxic Waste',
    color: '#44ff00',
    emissiveColor: '#33cc00',
    emissiveIntensity: 0.9,
    glowColor: '#44ff00',
    glowOpacity: 0.35,
    trailColor: '#66ff44',
    metalness: 0.2,
    roughness: 0.5,
    icon: '🟢',
    unlockCondition: 'Win 10 games',
  },
  {
    id: 'crimson',
    name: 'Blood Moon',
    color: '#ff2222',
    emissiveColor: '#cc0000',
    emissiveIntensity: 0.9,
    glowColor: '#ff3333',
    glowOpacity: 0.4,
    trailColor: '#ff4444',
    metalness: 0.5,
    roughness: 0.25,
    icon: '🔴',
    unlockCondition: 'Win on Hard difficulty',
  },
];

export function getUnlockedSkins(achievements: Set<string>, stats: { totalWins: number }): Set<string> {
  const unlocked = new Set<string>(['default', 'plasma', 'ice', 'solar']);
  // Toxic — need 10 wins
  if (stats.totalWins >= 10) unlocked.add('toxic');
  // Crimson — need hard winner achievement
  if (achievements.has('hard_winner')) unlocked.add('crimson');
  return unlocked;
}

export function getSavedPuckSkin(): string {
  return localStorage.getItem('neon-hockey-puck-skin') || 'default';
}

export function savePuckSkin(id: string): void {
  localStorage.setItem('neon-hockey-puck-skin', id);
}

export function getPuckSkinById(id: string): PuckSkin {
  return PUCK_SKINS.find(s => s.id === id) || PUCK_SKINS[0];
}
