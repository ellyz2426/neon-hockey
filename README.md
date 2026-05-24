# 🎯 Neon Darts VR

A holodeck-style VR darts game built with [IWSDK](https://iwsdk.dev) (Immersive Web SDK). Play classic darts in a glowing neon arena — works in VR headsets and desktop browsers.

🔗 **[Play Live](https://ellyz2426.github.io/neon-darts/)**

## Features

### 🎮 8 Game Modes
- **501** — Count down from 501, finish on a double. Checkout calculator shows optimal finish routes.
- **Cricket** — Close 15–20 and bulls. Score on your opponent's open numbers. Live scoreboard tracks marks.
- **Around the Clock** — Hit 1 through 20 in sequence.
- **Shanghai** — Score only on the round number. Hit single + double + triple for an instant win!
- **Killer** — Claim your number with a double, gain 3 lives, then eliminate opponents by hitting their doubles!
- **Tournament** — 8-round single elimination bracket. AI escalates in difficulty each round. Win all 8 to become champion.
- **Daily Challenge** — New seeded challenge every day with specific targets and dart limits. Track your completion streak.
- **Practice** — Free throw with running averages. No opponent, no pressure.

### 🤖 AI Opponent
- 3 difficulty levels: Easy, Medium, Hard
- Strategic targeting per mode (T20 setup, cricket priority, killer targeting)
- 8 named tournament opponents with escalating difficulty

### 👥 Multiplayer
- **VS CPU** — Challenge the AI at any difficulty
- **VS Friend** — Local 2-player mode with turn alternation

### 🎨 Visual Design
- Holodeck neon environment: glowing grid floor/ceiling, ambient particles, wireframe decorations
- Accurate dartboard geometry with segment numbers and glowing wire dividers
- Neon dart trails with skin-specific colors
- Hit particle effects with burst effects on triples and bullseyes
- Board hit flash effects (color-coded by multiplier)
- Score popups that float at the hit location
- Streak ring effects on combos
- Board animations (intro spin, hit wobble, bullseye wobble, victory spin, idle breathing)
- Sound visualizer — reactive ring pulsing on the dartboard
- Camera shake system (7 presets: hit, triple, bullseye, miss, win, elimination, bust)
- Ambient particle system (40 floating neon orbs + 200-particle dust cloud)

### 🏆 Progression & Tracking
- **50 achievements** across gameplay, skill, dedication, and discovery categories
- **Match history** — persistent game log with stats (50 games, win rate, favorite mode)
- **Player profile** — nickname, avatar color, hand preference, volume/haptic settings
- **Per-mode leaderboards** — separate top-20 per game mode + global top-50
- **Combo/streak system** — feedback on consecutive scoring throws
- **Scoring highlights** — per-turn summary with letter grade (S+/S/A/B/C/D)
- **Throw history HUD** — current turn's darts with live scores

### 🎯 Gameplay Systems
- **15 dart skins** (10 standard + 5 premium: Void Walker, Solar Wind, Quantum Shift, Blood Moon, Diamond Dust)
- **5 board themes** with theme selector
- **501 checkout calculator** — shows optimal double-out routes
- **Cricket scoreboard** — marks and points for all 7 numbers
- **Power-up system** — 6 types (Steady Hand, Double Score, Triple Threat, Zen Focus, Lucky Bounce, Second Wind), earned via combos
- **Training drills** — 7 focused drills (doubles, triples, bullseyes, checkout, sectors, consistency, speed)
- **Tutorial system** — 6-step onboarding for new players
- **Warm-up throws** — 3 practice throws before competitive games (with skip)
- **Throw replay** — records throw trajectories for slow-motion playback
- **Commentator system** — weighted random commentary for 20 event types
- **Notification manager** — priority queue, color-coded by type, auto-dismiss

### 🎧 Audio
- **24+ procedural sounds** — throw whoosh, board thud, score chimes, miss thud, achievement arpeggio
- Game start/end fanfares, turn change pips, combo crescendos
- Ambient drone (55Hz sine + triangle pad + LFO)
- Volume controls: Master, SFX, Music (with profile persistence)
- VR haptic feedback: throw, hit, miss, combo, charging, game over, elimination patterns (togglable)

### 🕶️ XR + Browser
- Full VR controller support: right trigger charge/release, controller aim, B pause
- Laser pointer interaction with all PanelUI menus and buttons
- Browser fallback: mouse aim, left-click charge/release, ESC pause
- Dual-runtime: works in VR headsets and desktop/mobile browsers

## Controls

| Action | VR | Browser |
|--------|----|----- ---|
| Aim | Point controller at board | Move mouse |
| Charge | Hold right trigger | Hold left click |
| Throw | Release trigger | Release click |
| Pause | B button | ESC key |
| Menu navigation | Laser pointer + trigger | Mouse click |

## Spatial UI

All UI is built with IWSDK PanelUI — **33 `.uikitml` spatial panels**, zero HTML DOM overlays. Every menu, HUD, scoreboard, and settings screen renders correctly in XR.

Panel inventory: title, modeselect, difficulty, hud, power, throwhistory, checkout, cricket, announce, pause, gameover, leaderboard, leaderboard-v2, achievements, settings, help, stats, message, tournament, tournhud, tournresult, daily, dailyhud, killer, history, profile, warmup, powerup, tutorial, training, drillhud, turnsummary, notification.

## Tech Stack

- **IWSDK 0.4.1** — WebXR framework
- **PanelUI / UIKit** — Spatial UI system (33 `.uikitml` templates)
- **Procedural Web Audio API** — All sounds generated at runtime
- **Three.js** (via @iwsdk/core) — 3D rendering
- **localStorage** — Persistent stats, achievements, profiles, leaderboards, match history

## Build

```bash
npm install
npm run build    # Production build → dist/
npm run dev      # Development server with IWSDK CLI
```

## Project Structure

```
src/
  index.ts             — Main entry, input handling, game loop
  game.ts              — Game state machine, rules for 6 core modes
  dartboard.ts         — Board geometry, scoring math, number labels
  darts.ts             — Dart throwing, flight physics, trails
  ai.ts                — AI opponent targeting and noise model
  ui.ts                — 33 PanelUI panels, all game UI
  audio.ts             — Procedural Web Audio (24+ sounds)
  achievements.ts      — 50 achievements with persistence
  achievements-v2.ts   — Extended achievement definitions
  stats.ts             — Statistics tracking with localStorage
  effects.ts           — Hit particle system
  checkout.ts          — 501 checkout route calculator
  skins.ts             — 15 dart skins with visual customization
  dart-skins-v2.ts     — Premium skin definitions with rarity
  combo.ts             — Combo/streak tracking system
  environment.ts       — Holodeck neon environment
  tournament.ts        — 8-round single elimination bracket
  daily-challenge.ts   — Seeded daily challenges with streaks
  killer.ts            — Killer mode logic (lives, elimination)
  board-themes.ts      — 5 selectable board themes
  match-history.ts     — Persistent match log with stats
  profile.ts           — Player profile with preferences
  haptics.ts           — VR haptic feedback patterns
  streak-effects.ts    — Visual streak rings on combos
  dart-trail.ts        — Neon vapor trails behind thrown darts
  board-hit-effects.ts — Color-coded glow/flash on impacts
  camera-shake.ts      — 7 preset camera shake patterns
  warmup.ts            — Pre-game warm-up throws
  mode-leaderboard.ts  — Per-mode leaderboards
  throw-replay.ts      — Throw recording and slow-mo playback
  power-ups.ts         — 6 power-up types, combo-earned
  tutorial.ts          — 6-step onboarding for new players
  training-drills.ts   — 7 focused training exercises
  commentator.ts       — Weighted random commentary
  board-animator.ts    — Board intro, wobble, spin, breathing
  sound-visualizer.ts  — Reactive audio visualization rings
  notifications.ts     — Priority queue notification manager
  scoring-highlights.ts— Per-turn summary with letter grades
  score-popup.ts       — Floating 3D score popups at hit points
  aim-cursor.ts        — Board crosshair/cursor
  particles.ts         — Ambient particle system (orbs + dust)
  object-pool.ts       — Generic object pool for performance
ui/
  33 .uikitml templates — PanelUI spatial panels for all game UI
```

## Build Stats

- **Round 1** (45 min): 24 files, 3,023 lines — core game, 6 modes, AI, VR controls, 13 panels
- **Round 2** (55 min): 36 files, 4,321 lines — practice, VS friend, cricket scoreboard, checkout calc, dart skins, combos, throw history
- **Round 3** (65 min): 41 files, 5,618 lines — tournament, daily challenge, 5 board themes, score popups, aim cursor, 22 panels
- **Round 4** (120 min): 75 files, 10,414 lines — killer mode, match history, player profiles, haptics, camera shake, power-ups, training drills, tutorial, commentator, board animations, notifications, scoring grades, 33 panels
- **Round 5** (final): 75 files, 10,700+ lines — integrated premium skins (15 total), wired 50 achievements, comprehensive documentation

---

Built with IWSDK 0.4.1 by [ellyz2426](https://github.com/ellyz2426)
