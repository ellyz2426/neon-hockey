# Neon Hockey VR

Holodeck-themed VR air hockey built with [IWSDK](https://iwsdk.dev) 0.4.1. Physics-based puck mechanics, AI opponent, 5 game modes, power-ups, and neon wireframe aesthetic.

**Play:** [https://ellyz2426.github.io/neon-hockey/](https://ellyz2426.github.io/neon-hockey/)

## Features

- **Physics-based puck**: Substep integration, mallet velocity transfer, wall rebounds, friction, speed clamping
- **AI opponent**: 3 difficulty levels (Easy/Medium/Hard) with prediction, accuracy noise, aggression tuning
- **5 game modes**: Classic (first to 7), Time Attack (60s), Power-Up, Survival (3 lives), Tournament (4 rounds)
- **Power-up system**: Speed Boost, Shield, Puck Magnet, Shrink Opponent, Giant Mallet — spawn on table in Power-Up mode
- **5 table themes**: Neon Holodeck, Crimson Arena, Toxic Green, Cyberpunk, Arctic Frost
- **16 achievements**: First Victory, Shutout, Hat Trick, On Fire, Unstoppable, Hard Hitter, Speed Demon, and more
- **Combo system**: Consecutive goals build multiplier (up to x5)
- **Dual runtime**: VR (Meta Quest) + browser (mouse control)
- **All spatial UI**: 11 PanelUI `.uikitml` templates, zero HTML DOM overlays
- **Procedural audio**: Mallet hits, wall bounces, goal fanfares, power-up chimes, ambient drone
- **Particle effects**: Mallet sparks, wall sparks, goal explosions, goal flash rings
- **Holodeck environment**: Neon grid floor/ceiling, floating wireframe decorations, ambient particles, fog

## Controls

### Browser
- **Mouse** — Move mallet (tracks on table surface)
- **ESC** — Pause

### VR
- **Right hand** — Move mallet (grip position maps to table)
- **B button** — Pause
- **Trigger/pointer** — Menu interaction
- **Thumbstick** — Menu navigation

## Game Modes

| Mode | Description |
|------|-------------|
| Classic | First to 7 goals wins |
| Time Attack | 60 seconds, most goals wins |
| Power-Up | Power-ups spawn on the table — collect them with your mallet |
| Survival | 3 lives, score as many goals as you can |
| Tournament | 4 rounds with escalating AI difficulty |

## Tech Stack

- **IWSDK** 0.4.1 (WebXR framework)
- **PanelUI** — `.uikitml` spatial UI templates
- **Web Audio API** — Procedural sound effects + ambient music
- **Vite** — Build tooling

## Project Structure

```
src/
  index.ts       — Main game loop, physics, table geometry
  ai.ts          — AI opponent with prediction and difficulty scaling
  audio.ts       — Procedural Web Audio sound effects + ambient music
  effects.ts     — Particle effects, goal flashes, wall sparks
  environment.ts — Holodeck environment (grids, decorations, particles, lights)
  powerups.ts    — Power-up spawning, collection, and effects
  themes.ts      — 5 table color themes
  ui.ts          — PanelUI manager (all 11 panels, event wiring, state)
ui/
  title.uikitml        — Title screen
  modeselect.uikitml   — Mode selection
  difficulty.uikitml   — Difficulty selection
  hud.uikitml          — Head-following score HUD
  message.uikitml      — Head-following message toast
  pause.uikitml        — Pause menu
  gameover.uikitml     — Game over screen
  leaderboard.uikitml  — Top 10 leaderboard
  achievements.uikitml — 16 achievements
  settings.uikitml     — Theme + volume settings
  help.uikitml         — Controls + mode reference
```

## Build Stats

- **8 source files** + **11 `.uikitml` templates** = 19 total
- **~2,900 lines** of code
- Zero HTML DOM UI — all spatial PanelUI
- Zero TypeScript errors

## Build & Deploy

```bash
npm install
npm run build
# Deploy dist/ to GitHub Pages
```

## License

MIT
