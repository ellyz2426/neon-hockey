// Environment for Neon Hockey VR
import {
  AmbientLight, PointLight, DirectionalLight, Fog, Color,
  Mesh, BoxGeometry, SphereGeometry, TorusGeometry, ConeGeometry,
  PlaneGeometry, EdgesGeometry, LineSegments, LineBasicMaterial,
  MeshBasicMaterial, MeshStandardMaterial, AdditiveBlending, Group,
  BufferGeometry, Float32BufferAttribute,
} from '@iwsdk/core';
import { TableTheme } from './themes';

export class Environment {
  private scene: any;
  private theme: TableTheme;
  private gridFloor: LineSegments | null = null;
  private gridCeiling: LineSegments | null = null;
  private decorations: Mesh[] = [];
  private particles: Mesh[] = [];
  private tableLights: PointLight[] = [];
  private ambientLight: AmbientLight;

  constructor(scene: any, theme: TableTheme) {
    this.scene = scene;
    this.theme = theme;

    // Fog
    scene.fog = new Fog(new Color(theme.envFogColor), 2, 15);
    scene.background = new Color(theme.envFogColor);

    // Ambient
    this.ambientLight = new AmbientLight(0x111122, 0.4);
    scene.add(this.ambientLight);

    // Table lights
    const lightPositions = [
      [0, 1.5, -0.5],
      [-0.4, 1.3, -0.5],
      [0.4, 1.3, -0.5],
    ];
    const lightColors = [theme.accentColor, theme.envAccent1, theme.envAccent2];
    for (let i = 0; i < 3; i++) {
      const light = new PointLight(new Color(lightColors[i]), 0.8, 4);
      light.position.set(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
      scene.add(light);
      this.tableLights.push(light);
    }

    // Grid floor
    this.createGrid(0, -0.01, theme.envGridColor, 0.15);
    // Grid ceiling
    this.createGrid(3.5, 0, theme.envGridColor, 0.08);

    // Wireframe decorations
    this.createDecorations(theme);

    // Ambient particles
    this.createParticles(theme);
  }

  private createGrid(y: number, offset: number, color: string, opacity: number) {
    const size = 12;
    const divisions = 24;
    const step = size / divisions;
    const vertices: number[] = [];

    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const pos = i * step;
      vertices.push(-size / 2, y, pos, size / 2, y, pos);
      vertices.push(pos, y, -size / 2, pos, y, size / 2);
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    const mat = new LineBasicMaterial({ color: new Color(color), transparent: true, opacity });
    const grid = new LineSegments(geo, mat);
    this.scene.add(grid);

    if (y < 1) this.gridFloor = grid;
    else this.gridCeiling = grid;
  }

  private createDecorations(theme: TableTheme) {
    const shapes = [
      () => new TorusGeometry(0.2, 0.02, 8, 24),
      () => new BoxGeometry(0.3, 0.3, 0.3),
      () => new SphereGeometry(0.15, 8, 8),
      () => new ConeGeometry(0.15, 0.3, 6),
    ];

    for (let i = 0; i < 12; i++) {
      const geo = shapes[i % shapes.length]();
      const edges = new EdgesGeometry(geo);
      const color = i % 2 === 0 ? theme.envAccent1 : theme.envAccent2;
      const mat = new LineBasicMaterial({ color: new Color(color), transparent: true, opacity: 0.3 });
      const mesh = new LineSegments(edges, mat) as any;
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        0.5 + Math.random() * 2.5,
        (Math.random() - 0.5) * 8 - 2,
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = { rotSpeed: 0.2 + Math.random() * 0.5, bobSpeed: 0.3 + Math.random() * 0.5, bobPhase: Math.random() * Math.PI * 2, baseY: mesh.position.y };
      this.scene.add(mesh);
      this.decorations.push(mesh as any);
    }
  }

  private createParticles(theme: TableTheme) {
    const geo = new SphereGeometry(0.015, 4, 4);
    for (let i = 0; i < 40; i++) {
      const color = i % 3 === 0 ? theme.envAccent1 : (i % 3 === 1 ? theme.envAccent2 : theme.accentColor);
      const mat = new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3,
        blending: AdditiveBlending,
      });
      const mesh = new Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        0.3 + Math.random() * 3,
        (Math.random() - 0.5) * 10 - 1,
      );
      mesh.userData = { bobPhase: Math.random() * Math.PI * 2, driftX: (Math.random() - 0.5) * 0.05, driftZ: (Math.random() - 0.5) * 0.05 };
      this.scene.add(mesh);
      this.particles.push(mesh);
    }
  }

  applyTheme(t: TableTheme) {
    this.theme = t;
    this.scene.fog = new Fog(new Color(t.envFogColor), 2, 15);
    this.scene.background = new Color(t.envFogColor);

    // Update lights
    const colors = [t.accentColor, t.envAccent1, t.envAccent2];
    this.tableLights.forEach((l, i) => l.color.set(colors[i]));

    // Update grids
    if (this.gridFloor) (this.gridFloor.material as any).color.set(t.envGridColor);
    if (this.gridCeiling) (this.gridCeiling.material as any).color.set(t.envGridColor);
  }

  update(dt: number) {
    // Animate decorations
    for (const d of this.decorations) {
      const ud = d.userData;
      d.rotation.x += ud.rotSpeed * dt;
      d.rotation.y += ud.rotSpeed * 0.7 * dt;
      d.position.y = ud.baseY + Math.sin(performance.now() / 1000 * ud.bobSpeed + ud.bobPhase) * 0.1;
    }

    // Animate particles
    for (const p of this.particles) {
      const ud = p.userData;
      ud.bobPhase += dt * 0.5;
      p.position.y += Math.sin(ud.bobPhase) * 0.002;
      p.position.x += ud.driftX * dt;
      p.position.z += ud.driftZ * dt;
      (p.material as any).opacity = 0.2 + Math.sin(ud.bobPhase * 2) * 0.15;
    }
  }
}
