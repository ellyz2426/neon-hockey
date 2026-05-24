// Visual effects for Neon Hockey VR — trails, particles, screenshake
import {
  Group, Mesh, SphereGeometry, CylinderGeometry, RingGeometry, PlaneGeometry,
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

interface TrailPoint {
  mesh: Mesh;
  life: number;
  maxLife: number;
}

export class EffectsManager {
  private parent: Group;
  private theme: TableTheme;
  private particles: Particle[] = [];
  private maxParticles = 100;
  private sphereGeo = new SphereGeometry(0.008, 6, 6);
  private trailGeo = new SphereGeometry(0.006, 4, 4);
  private goalFlashMeshes: Mesh[] = [];

  // Puck trail
  private trail: TrailPoint[] = [];
  private trailTimer = 0;
  private trailInterval = 0.02; // spawn every 20ms when moving fast
  private maxTrail = 30;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  private shakeOffset = new Vector3();

  // Countdown
  private countdownMeshes: Mesh[] = [];

  constructor(parent: Group, theme: TableTheme) {
    this.parent = parent;
    this.theme = theme;
  }

  setTheme(t: TableTheme) { this.theme = t; }

  // ─── Screen Shake ───
  triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  getShakeOffset(): Vector3 {
    return this.shakeOffset;
  }

  private updateShake(dt: number) {
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += dt;
      const t = 1 - (this.shakeTimer / this.shakeDuration);
      const intensity = this.shakeIntensity * t;
      this.shakeOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.5,
        (Math.random() - 0.5) * intensity * 0.3,
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
  }

  // ─── Puck Trail ───
  updateTrail(dt: number, puckX: number, puckZ: number, speed: number) {
    this.trailTimer += dt;

    // Only spawn trail points when puck is moving fast enough
    if (speed > 0.3 && this.trailTimer >= this.trailInterval && this.trail.length < this.maxTrail) {
      this.trailTimer = 0;
      const brightness = Math.min(1, speed / 3);
      const mat = new MeshBasicMaterial({
        color: new Color(this.theme.puckColor),
        transparent: true,
        opacity: 0.4 * brightness,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(this.trailGeo, mat);
      mesh.position.set(puckX, 0.01, puckZ);
      mesh.scale.setScalar(0.5 + brightness * 0.8);
      this.parent.add(mesh);
      this.trail.push({ mesh, life: 0.3 + brightness * 0.2, maxLife: 0.3 + brightness * 0.2 });
    }

    // Update existing trail points
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const tp = this.trail[i];
      tp.life -= dt;
      if (tp.life <= 0) {
        this.parent.remove(tp.mesh);
        (tp.mesh.material as MeshBasicMaterial).dispose();
        this.trail.splice(i, 1);
        continue;
      }
      const alpha = tp.life / tp.maxLife;
      (tp.mesh.material as any).opacity = alpha * 0.4;
      tp.mesh.scale.setScalar(alpha * 0.8);
    }
  }

  // ─── Particles ───
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
    const count = 20;
    for (let i = 0; i < count; i++) {
      this.spawnParticle(x, 0.03, z, color, 1.5, 1.0);
    }

    // Extra shimmer particles
    for (let i = 0; i < 8; i++) {
      this.spawnParticle(x + (Math.random() - 0.5) * 0.2, 0.05, z, '#ffffff', 0.6, 0.4);
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

    // Second delayed ring
    setTimeout(() => {
      const ring2 = new Mesh(ringGeo.clone(), ringMat.clone());
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.set(0, 0.004, z);
      this.parent.add(ring2);
      this.goalFlashMeshes.push(ring2);
    }, 150);

    // Screen shake
    this.triggerShake(playerScored ? 0.015 : 0.025, 0.4);
  }

  // Power-up collect effect
  powerUpCollectEffect(x: number, z: number, color: string) {
    for (let i = 0; i < 12; i++) {
      this.spawnParticle(x, 0.04, z, color, 1.0, 0.6);
    }
    // Ring burst
    const ringGeo = new RingGeometry(0.02, 0.15, 16);
    const ringMat = new MeshBasicMaterial({
      color: new Color(color),
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      side: 2,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.005, z);
    this.parent.add(ring);
    this.goalFlashMeshes.push(ring); // reuse flash mesh cleanup
  }

  // Shield block effect
  shieldBlockEffect(x: number, z: number) {
    for (let i = 0; i < 10; i++) {
      this.spawnParticle(x, 0.02, z, '#00ffaa', 0.7, 0.4);
    }
    this.triggerShake(0.008, 0.2);
  }

  update(dt: number) {
    // Update shake
    this.updateShake(dt);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parent.remove(p.mesh);
        (p.mesh.material as MeshBasicMaterial).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 2.5 * dt; // gravity

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
