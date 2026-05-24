// Visual effects for Neon Hockey VR
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, RingGeometry,
  MeshBasicMaterial, Color, AdditiveBlending, Vector3,
} from '@iwsdk/core';
import { TableTheme } from './themes';

interface Particle {
  mesh: Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export class EffectsManager {
  private parent: Group;
  private theme: TableTheme;
  private particles: Particle[] = [];
  private maxParticles = 80;
  private sphereGeo = new SphereGeometry(0.008, 6, 6);
  private goalFlashMeshes: Mesh[] = [];

  constructor(parent: Group, theme: TableTheme) {
    this.parent = parent;
    this.theme = theme;
  }

  setTheme(t: TableTheme) { this.theme = t; }

  private spawnParticle(x: number, y: number, z: number, color: string, speed: number, spread: number) {
    if (this.particles.length >= this.maxParticles) return;

    const mat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(this.sphereGeo, mat);
    mesh.position.set(x, y, z);
    this.parent.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const upSpread = Math.random() * spread * 0.5;
    this.particles.push({
      mesh,
      vx: Math.cos(angle) * speed * (0.5 + Math.random()),
      vy: upSpread + speed * 0.3,
      vz: Math.sin(angle) * speed * (0.5 + Math.random()),
      life: 0.5 + Math.random() * 0.5,
      maxLife: 0.5 + Math.random() * 0.5,
    });
  }

  malletHitEffect(x: number, z: number, isPlayer: boolean) {
    const color = isPlayer ? '#00ff88' : '#ff4466';
    const count = 8;
    for (let i = 0; i < count; i++) {
      this.spawnParticle(x, 0.02, z, color, 0.8, 0.5);
    }
  }

  wallSpark(x: number, z: number) {
    for (let i = 0; i < 5; i++) {
      this.spawnParticle(x, 0.02, z, this.theme.accentColor, 0.5, 0.3);
    }
  }

  goalEffect(x: number, z: number, playerScored: boolean) {
    const color = playerScored ? '#44ff44' : '#ff4444';
    const count = 15;
    for (let i = 0; i < count; i++) {
      this.spawnParticle(x, 0.03, z, color, 1.2, 0.8);
    }

    // Flash ring
    const ringGeo = new RingGeometry(0.05, 0.4, 24);
    const ringMat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      side: 2,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.003, z);
    this.parent.add(ring);
    this.goalFlashMeshes.push(ring);
    // Remove after animation in update
  }

  update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parent.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 2 * dt; // gravity

      const alpha = p.life / p.maxLife;
      (p.mesh.material as any).opacity = alpha * 0.9;
      p.mesh.scale.setScalar(0.5 + alpha * 0.5);
    }

    // Update goal flash rings
    for (let i = this.goalFlashMeshes.length - 1; i >= 0; i--) {
      const ring = this.goalFlashMeshes[i];
      ring.scale.multiplyScalar(1 + dt * 4);
      (ring.material as any).opacity -= dt * 2;
      if ((ring.material as any).opacity <= 0) {
        this.parent.remove(ring);
        ring.geometry.dispose();
        (ring.material as MeshBasicMaterial).dispose();
        this.goalFlashMeshes.splice(i, 1);
      }
    }
  }
}
