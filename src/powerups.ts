// Power-up system for Neon Hockey VR — fully implemented effects
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, TorusGeometry, RingGeometry,
  MeshStandardMaterial, MeshBasicMaterial, Color, AdditiveBlending, DoubleSide,
} from '@iwsdk/core';
import { TableTheme } from './themes';

export interface PowerUpType {
  name: string;
  type: 'speed' | 'shield' | 'magnet' | 'shrink' | 'giant';
  color: string;
  duration: number;
  icon: string;
}

const POWER_UP_TYPES: PowerUpType[] = [
  { name: 'Speed Boost', type: 'speed', color: '#ffaa00', duration: 5, icon: '⚡' },
  { name: 'Shield', type: 'shield', color: '#00ffaa', duration: 8, icon: '🛡' },
  { name: 'Puck Magnet', type: 'magnet', color: '#ff44ff', duration: 6, icon: '🧲' },
  { name: 'Shrink Opponent', type: 'shrink', color: '#ff4444', duration: 7, icon: '🔻' },
  { name: 'Giant Mallet', type: 'giant', color: '#44ff44', duration: 6, icon: '🔷' },
];

interface SpawnedPowerUp {
  mesh: Group;
  glow: Mesh;
  type: PowerUpType;
  x: number;
  z: number;
  age: number;
  bobPhase: number;
}

export interface ActiveEffect {
  type: PowerUpType;
  remaining: number;
  duration: number;
}

export class PowerUpManager {
  private parent: Group;
  private tableW: number;
  private tableL: number;
  private theme: TableTheme;
  private spawned: SpawnedPowerUp[] = [];
  private spawnTimer = 0;
  private spawnInterval = 6;

  // Active effects
  activeEffects: ActiveEffect[] = [];

  // Shield visual
  private shieldMesh: Mesh | null = null;

  // Mallet scale modifiers
  playerMalletScale = 1.0;
  cpuMalletScale = 1.0;

  // Magnet strength
  magnetActive = false;

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
    for (const p of this.spawned) {
      this.parent.remove(p.mesh);
      this.parent.remove(p.glow);
    }
    this.spawned = [];
    this.spawnTimer = 0;
    this.activeEffects = [];
    this.playerMalletScale = 1.0;
    this.cpuMalletScale = 1.0;
    this.magnetActive = false;
    if (this.shieldMesh) {
      this.parent.remove(this.shieldMesh);
      this.shieldMesh = null;
    }
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

    this.spawned.push({ mesh: group, glow, type, x, z, age: 0, bobPhase: Math.random() * Math.PI * 2 });
  }

  activateEffect(type: PowerUpType) {
    // Remove existing effect of same type
    this.activeEffects = this.activeEffects.filter(e => e.type.type !== type.type);
    this.activeEffects.push({ type, remaining: type.duration, duration: type.duration });

    switch (type.type) {
      case 'shield':
        this.createShield();
        break;
      case 'magnet':
        this.magnetActive = true;
        break;
      case 'shrink':
        this.cpuMalletScale = 0.6;
        break;
      case 'giant':
        this.playerMalletScale = 1.6;
        break;
    }
  }

  private createShield() {
    if (this.shieldMesh) this.parent.remove(this.shieldMesh);
    const geo = new RingGeometry(0.16, 0.18, 24);
    const mat = new MeshBasicMaterial({
      color: new Color('#00ffaa'),
      transparent: true,
      opacity: 0.5,
      side: DoubleSide,
      blending: AdditiveBlending,
    });
    this.shieldMesh = new Mesh(geo, mat);
    this.shieldMesh.rotation.x = -Math.PI / 2;
    // Position will be updated in updateShield
    this.parent.add(this.shieldMesh);
  }

  isShieldActive(): boolean {
    return this.activeEffects.some(e => e.type.type === 'shield');
  }

  /** Move shield to follow the player goal zone */
  updateShieldPosition(goalZ: number) {
    if (this.shieldMesh) {
      this.shieldMesh.position.set(0, 0.01, goalZ);
    }
  }

  updateEffects(dt: number) {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.remaining -= dt;
      if (effect.remaining <= 0) {
        // Remove effect
        switch (effect.type.type) {
          case 'shield':
            if (this.shieldMesh) {
              this.parent.remove(this.shieldMesh);
              this.shieldMesh = null;
            }
            break;
          case 'magnet':
            this.magnetActive = false;
            break;
          case 'shrink':
            this.cpuMalletScale = 1.0;
            break;
          case 'giant':
            this.playerMalletScale = 1.0;
            break;
        }
        this.activeEffects.splice(i, 1);
      }
    }

    // Pulse shield
    if (this.shieldMesh) {
      const t = performance.now() / 1000;
      (this.shieldMesh.material as any).opacity = 0.3 + Math.sin(t * 4) * 0.2;
      this.shieldMesh.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    }
  }

  update(dt: number, puckX: number, puckZ: number, malletX: number, malletZ: number): PowerUpType | null {
    // Update active effects
    this.updateEffects(dt);

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.spawned.length < 3) {
      this.spawn();
      this.spawnTimer = this.spawnInterval;
    }

    let collected: PowerUpType | null = null;

    for (let i = this.spawned.length - 1; i >= 0; i--) {
      const p = this.spawned[i];
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
        this.spawned.splice(i, 1);
        continue;
      }

      // Expire after 10s
      if (p.age > 10) {
        this.parent.remove(p.mesh);
        this.parent.remove(p.glow);
        this.spawned.splice(i, 1);
      }
    }

    return collected;
  }
}
