# Neon Hockey VR

Holodeck-themed VR air hockey built with [IWSDK](https://iwsdk.dev) 0.4.1. Full physics-based puck mechanics, AI opponent with adaptive difficulty, 8 game modes, power-ups, daily challenges, and a neon wireframe aesthetic. Play in VR or in the browser.

**Play:** [https://ellyz2426.github.io/neon-hockey/](https://ellyz2426.github.io/neon-hockey/)

## Features

### Gameplay
- **Physics-based puck**: 4-substep integration, mallet velocity transfer, wall rebounds, friction, speed clamping
- **AI opponent**: State machine with prediction, wall-bounce simulation, adaptive difficulty (gets harder when losing), 3 base difficulty levels
- **8 game modes**: Classic, Time Attack, Power-Up, Survival, Tournament, Practice, 2-Player Local, Daily Challenge
- **Power-up system**: Speed Boost, Shield, Puck Magnet, Shrink Opponent, Giant Mallet — spawn in Power-Up mode
- **Daily challenges**: 14 unique challenge templates, date-seeded selection, streak tracking
- **2-player local**: Mouse vs WASD/Arrows on one screen
- **Combo system**: Consecutive goals build multiplier up to x5 with decay timer
- **VR charged power shot**: Hold trigger to charge, release near puck for 1.8x velocity boost

### Customization
- **5 table themes**: Neon Holodeck, Crimson Arena, Toxic Green, Cyberpunk, Arctic Frost
- **6 puck skins**: Classic Neon, Plasma Core, Frozen Disc, Solar Flare, Toxic Waste, Blood Moon (2 unlock via progression)
- **6 mallet skins**: Neon Green, Electric Blue, Hot Pink, Gold Rush, Void Walker, Chrome (2 unlock via progression)
- **5 camera angles**: Classic, Overhead, Close Up, Cinematic, Broadcast

### Progression
- **36 achievements**: First Victory through Full Wardrobe, including daily challenge streaks, 2P milestones, and skin collection
- **Leaderboard**: Top 20 scores, sorted and timestamped
- **Match history**: Persistent records of last 50 matches
- **Comprehensive stats**: Overall, records, per-mode W/L breakdowns
- **Daily streak tracking**: Consecutive daily challenge completions

### Polish
- **Slow-motion goal replay**: 1.2s at 0.25x time scale on every goal
- **Victory confetti**: Particle burst celebration on game end
- **Pre-game countdown**: 3-2-1 with audio ticks
- **Tutorial system**: 8 progressive steps for first-time players, VR-aware
- **Puck trail effect**: Speed-based glowing trail particles
- **Screen shake**: On goals (stronger for conceded)
- **Boundary edge glow**: Pulsing neon strips along table edges

### Audio
- **20+ procedural SFX**: Mallet hits (intensity-scaled), wall bounces, goal horns, achievement jingles
- **Button click audio** on all UI interactions
- **Ambient soundscape**: Bass drone, triangle pad with LFO, shimmer layer
- **Countdown beeps** for last 5 seconds in timed modes
- **Charged shot SFX**: Rising sweep on charge, burst on release

### Technical
- **Dual runtime**: VR (Meta Quest) + browser (mouse/keyboard control)
- **19 PanelUI templates**: All spatial UI via `.uikitml`, zero HTML DOM overlays
- **XR controller support**: Grip-mapped mallet, trigger charge, B-button pause
- **Holodeck environment**: Neon grid floor/ceiling, floating wireframe decorations, 40 ambient particles, fog

## Controls

### Browser
| Control | Action |
|---------|--------|
| **Mouse** | Move mallet (Player 1) |
| **WASD / Arrows** | Move mallet (Player 2 in 2P mode) |
| **ESC** | Pause game |

### VR
| Control | Action |
|---------|--------|
| **Right Hand** | Move mallet (grip position maps to table) |
| **Trigger Hold** | Charge power shot (release near puck) |
| **B Button** | Pause |
| **Pointer / Thumbstick** | Menu interaction / navigation |

## Game Modes

| Mode | Description |
|------|-------------|
| Classic | First to 7 goals wins |
| Time Attack | 60 seconds, most goals wins |
| Power-Up | Power-ups spawn on the table — collect with your mallet |
| Survival | 3 lives, score as many goals as you can |
| Tournament | 4 rounds with escalating AI difficulty |
| Practice | Free play, no opponent |
| 2 Player Local | Mouse (P1) vs WASD/Arrows (P2) on one screen |
| Daily Challenge | Unique challenge every day — 14 templates, streak tracking |

## Tech Stack

- **IWSDK** 0.4.1 (WebXR framework)
- **PanelUI** — `.uikitml` spatial UI templates (19 panels)
- **Web Audio API** — Procedural sound effects + ambient music
- **Vite** — Build tooling with uikitml compilation

## Project Structure

```
src/
  index.ts           — Main game loop, physics, table geometry, state management
  ai.ts              — AI opponent with prediction and adaptive difficulty
  audio.ts           — Procedural Web Audio (20+ SFX + ambient music)
  camera-angles.ts   — 5 camera angle presets
  daily-challenge.ts — 14 challenge templates with date-seeded selection
  effects.ts         — Particles, trails, screen shake, confetti
  environment.ts     — Holodeck environment (grids, decorations, particles, lights)
  mallet-skins.ts    — 6 mallet skins with unlock progression
  powerups.ts        — Power-up spawning, collection, and effects
  puck-skins.ts      — 6 puck skins with unlock progression
  themes.ts          — 5 table color themes
  tutorial.ts        — 8-step tutorial system
  ui.ts              — PanelUI manager (19 panels, event wiring, state)
ui/
  19 .uikitml templates — All game UI (menus, HUD, settings, skins, etc.)
```

## Build Stats

- **13 source files** + **19 `.uikitml` templates** = 32 total files
- **~5,800 lines** of TypeScript + markup
- 36 achievements, 8 game modes, 6 puck skins, 6 mallet skins, 5 themes, 5 camera angles
- Zero HTML DOM UI — all spatial PanelUI
- 14 daily challenge templates

## Build & Deploy

```bash
npm install
npm run build
# Deploy dist/ to GitHub Pages
```

## License

MIT
