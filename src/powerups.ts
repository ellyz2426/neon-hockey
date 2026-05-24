// Power-up system for Neon Hockey VR
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry,
  MeshStandardMaterial, MeshBasicMaterial, Color, AdditiveBlending,
} from '@iwsdk/core';
import { TableTheme } from './themes';

export interface PowerUpType {
  name: string;
  type: 'speed' | 'shield' | 'magnet' | 'multi' | 'shrink' | 'giant';
  color: string;
  duration: number;
}

const POWER_UP_TYPES: PowerUpType[] = [
  { name: 'Speed Boost', type: 'speed', color: '#ffaa00', duration: 5 },
  { name: 'Shield', type: 'shield', color: '#00ffaa', duration: 8 },
  { name: 'Puck Magnet', type: 'magnet', color: '#ff44ff', duration: 6 },
  { name: 'Shrink Opponent', type: 'shrink', color: '#ff4444', duration: 7 },
  { name: 'Giant Mallet', type: 'giant', color: '#44ff44', duration: 6 },
];

interface ActivePowerUp {
  mesh: Group;
  glow: Mesh;
  type: PowerUpType;
  x: number;
  z: number;
  age: number;
  bobPhase: number;
}

export class PowerUpManager {
  private parent: Group;
  private tableW: number;
  private tableL: number;
  private theme: TableTheme;
  private active: ActivePowerUp[] = [];
  private spawnTimer = 0;
  private spawnInterval = 6;

  constructor(parent: Group, tableW: number, tableL: number, theme: TableTheme) {
    this.parent = parent;
    this.tableW = tableW;
    this.tableL = tableL;
    this.theme = theme;
  }

  setTheme(t: TableTheme) { this.theme = t; }

  scheduleSpawn() {
    this.spawnTimer = this.spawnInterval;
  }

  clearAll() {
    for (const p of this.active) {
      this.parent.remove(p.mesh);
      this.parent.remove(p.glow);
    }
    this.active = [];
    this.spawnTimer = 0;
  }

  private spawn() {
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    const x = (Math.random() - 0.5) * (this.tableW * 0.6);
    const z = (Math.random() - 0.5) * (this.tableL * 0.3);

    const group = new Group();
    const sphereGeo = new SphereGeometry(0.025, 16, 16);
    const sphereMat = new MeshStandardMaterial({
      color: new Color(type.color),
      emissive: new Color(type.color),
      emissiveIntensity: 0.8,
      metalness: 0.3,
    });
    const sphere = new Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    // Ring around it
    const ringGeo = new TorusGeometry(0.035, 0.004, 8, 24);
    const ringMat = new MeshBasicMaterial({ color: new Color(type.color), transparent: true, opacity: 0.6 });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.set(x, 0.04, z);
    this.parent.add(group);

    // Glow
    const glowGeo = new SphereGeometry(0.04, 8, 8);
    const glowMat = new MeshBasicMaterial({
      color: new Color(type.color),
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
    });
    const glow = new Mesh(glowGeo, glowMat);
    glow.position.set(x, 0.04, z);
    this.parent.add(glow);

    this.active.push({ mesh: group, glow, type, x, z, age: 0, bobPhase: Math.random() * Math.PI * 2 });
  }

  update(dt: number, puckX: number, puckZ: number, malletX: number, malletZ: number): PowerUpType | null {
    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.active.length < 3) {
      this.spawn();
      this.spawnTimer = this.spawnInterval;
    }

    let collected: PowerUpType | null = null;

    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.age += dt;
      p.bobPhase += dt * 3;

      // Bob animation
      p.mesh.position.y = 0.04 + Math.sin(p.bobPhase) * 0.01;
      p.glow.position.y = p.mesh.position.y;

      // Rotate ring
      if (p.mesh.children[1]) {
        p.mesh.children[1].rotation.z += dt * 2;
      }

      // Glow pulse
      (p.glow.material as any).opacity = 0.2 + Math.sin(p.age * 4) * 0.15;

      // Check collision with player mallet
      const dx = p.x - malletX;
      const dz = p.z - malletZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.08) {
        collected = p.type;
        this.parent.remove(p.mesh);
        this.parent.remove(p.glow);
        this.active.splice(i, 1);
        continue;
      }

      // Expire after 10s
      if (p.age > 10) {
        this.parent.remove(p.mesh);
        this.parent.remove(p.glow);
        this.active.splice(i, 1);
      }
    }

    return collected;
  }
}
