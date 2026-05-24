import {
  World,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  Follower,
  FollowBehavior,
  ScreenSpace,
  InputComponent,
  Mesh,
  Group,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  PlaneGeometry,
  RingGeometry,
  TorusGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector3,
  Vector2,
  Quaternion,
  Raycaster,
  AmbientLight,
  PointLight,
  DirectionalLight,
  Fog,
  EdgesGeometry,
  LineSegments,
  AdditiveBlending,
  Float32BufferAttribute,
  BufferGeometry,
  DoubleSide,
} from '@iwsdk/core';

import { AudioManager } from './audio';
import { AISystem } from './ai';
import { PowerUpManager } from './powerups';
import { EffectsManager } from './effects';
import { UIManager } from './ui';
import { Environment } from './environment';
import { TableThemes, TableTheme } from './themes';

// ─── TYPES ───
export type GameState = 'title' | 'modeselect' | 'difficulty' | 'countdown' | 'playing' | 'paused' | 'gameover' | 'leaderboard' | 'achievements' | 'settings' | 'help' | 'matchhistory' | 'stats';
export type GameMode = 'classic' | 'timed' | 'powerup' | 'survival' | 'tournament' | 'practice';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface Stats {
  totalGames: number;
  totalWins: number;
  totalGoals: number;
  totalGoalsConceded: number;
  longestStreak: number;
  bestScore: number;
  totalPlayTime: number;
  powerUpsCollected: number;
  bestCombo: number;
  shieldBlocks: number;
  themesPlayed: Set<number> | number[];
  modeStats: Record<string, { wins: number; losses: number }>;
  maxDeficit: number;
}

interface MatchRecord {
  playerScore: number;
  cpuScore: number;
  won: boolean;
  mode: string;
  difficulty: string;
  date: string;
  combo: number;
  duration: number;
}

// ─── CONSTANTS ───
const TABLE_WIDTH = 1.2;
const TABLE_LENGTH = 2.0;
const TABLE_HEIGHT = 0.9;
const RAIL_HEIGHT = 0.06;
const RAIL_WIDTH = 0.05;
const PUCK_RADIUS = 0.04;
const PUCK_HEIGHT = 0.015;
const MALLET_RADIUS = 0.055;
const MALLET_HEIGHT = 0.03;
const GOAL_WIDTH = 0.35;
const FRICTION = 0.997;
const MAX_PUCK_SPEED = 4.0;
const SCORE_TO_WIN = 7;

// ─── MAIN ───
async function main() {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' },
    input: { canvasPointerEvents: true },
    features: {
      grabbing: true,
      locomotion: false,
      physics: false,
      spatialUI: true,
    },
    render: {
      near: 0.01,
      far: 200,
      camera: { position: [0, 1.6, 0.8], lookAt: [0, TABLE_HEIGHT, -0.2] },
    },
  } as any);

  // ─── GAME STATE ───
  let gameState: GameState = 'title';
  let gameMode: GameMode = 'classic';
  let difficulty: Difficulty = 'medium';
  let playerScore = 0;
  let cpuScore = 0;
  let streak = 0;
  let currentStreak = 0;
  let gameTime = 0;
  let timedSeconds = 60;
  let survivalBalls = 3;
  let tournamentRound = 0;
  let tournamentWins = 0;
  let comboMultiplier = 1;
  let comboTimer = 0;
  let goalCooldown = 0;
  let isPowerUpMode = false;
  let currentThemeIndex = 0;
  let achievementsUnlocked: Set<string> = new Set();
  let countdownValue = 3;
  let countdownTimer = 0;
  let isPracticeMode = false;

  // Load saved state
  const savedTheme = localStorage.getItem('neon-hockey-theme');
  if (savedTheme) currentThemeIndex = parseInt(savedTheme) || 0;
  const savedAchievements = localStorage.getItem('neon-hockey-achievements');
  if (savedAchievements) {
    try { achievementsUnlocked = new Set(JSON.parse(savedAchievements)); } catch {}
  }
  let stats: Stats = {
    totalGames: 0, totalWins: 0, totalGoals: 0, totalGoalsConceded: 0,
    longestStreak: 0, bestScore: 0, totalPlayTime: 0, powerUpsCollected: 0,
    bestCombo: 1, shieldBlocks: 0, themesPlayed: [], modeStats: {},
    maxDeficit: 0,
  };
  const savedStats = localStorage.getItem('neon-hockey-stats');
  if (savedStats) {
    try {
      const parsed = JSON.parse(savedStats);
      stats = { ...stats, ...parsed };
      // Ensure themesPlayed is a proper array
      if (!Array.isArray(stats.themesPlayed)) stats.themesPlayed = [];
      if (!stats.modeStats) stats.modeStats = {};
    } catch {}
  }

  // Match history
  let matchHistory: MatchRecord[] = [];
  const savedHistory = localStorage.getItem('neon-hockey-history');
  if (savedHistory) { try { matchHistory = JSON.parse(savedHistory); } catch {} }

  function saveStats() {
    localStorage.setItem('neon-hockey-stats', JSON.stringify({
      ...stats,
      themesPlayed: Array.from(stats.themesPlayed),
    }));
  }
  function saveAchievements() {
    localStorage.setItem('neon-hockey-achievements', JSON.stringify([...achievementsUnlocked]));
  }
  function saveMatchHistory() {
    localStorage.setItem('neon-hockey-history', JSON.stringify(matchHistory.slice(0, 50)));
  }

  // ─── TABLE GEOMETRY ───
  const tableGroup = new Group();
  world.scene.add(tableGroup);
  tableGroup.position.set(0, TABLE_HEIGHT, -0.5);

  const theme = TableThemes[currentThemeIndex];

  // Table surface
  const surfaceGeo = new PlaneGeometry(TABLE_WIDTH, TABLE_LENGTH);
  const surfaceMat = new MeshStandardMaterial({
    color: new Color(theme.surfaceColor),
    roughness: 0.3,
    metalness: 0.6,
    emissive: new Color(theme.surfaceEmissive),
    emissiveIntensity: 0.15,
  });
  const surface = new Mesh(surfaceGeo, surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  tableGroup.add(surface);

  // Center line
  const centerLineGeo = new PlaneGeometry(TABLE_WIDTH - 0.04, 0.003);
  const centerLineMat = new MeshBasicMaterial({ color: new Color(theme.accentColor), transparent: true, opacity: 0.6 });
  const centerLine = new Mesh(centerLineGeo, centerLineMat);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = 0.001;
  tableGroup.add(centerLine);

  // Center circle
  const centerCircleGeo = new RingGeometry(0.12, 0.125, 48);
  const centerCircleMat = new MeshBasicMaterial({ color: new Color(theme.accentColor), transparent: true, opacity: 0.5, side: DoubleSide });
  const centerCircle = new Mesh(centerCircleGeo, centerCircleMat);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.001;
  tableGroup.add(centerCircle);

  // Center dot
  const centerDotGeo = new CylinderGeometry(0.015, 0.015, 0.002, 16);
  const centerDotMat = new MeshBasicMaterial({ color: new Color(theme.accentColor) });
  const centerDot = new Mesh(centerDotGeo, centerDotMat);
  centerDot.position.y = 0.001;
  tableGroup.add(centerDot);

  // Face-off circles (decorative dots at quarter positions)
  const faceOffDotGeo = new CylinderGeometry(0.008, 0.008, 0.002, 12);
  const faceOffDotMat = new MeshBasicMaterial({ color: new Color(theme.accentColor), transparent: true, opacity: 0.4 });
  for (const [fx, fz] of [[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.5], [0.3, 0.5]]) {
    const dot = new Mesh(faceOffDotGeo, faceOffDotMat);
    dot.position.set(fx, 0.001, fz);
    tableGroup.add(dot);
    // Ring around dot
    const ring = new Mesh(new RingGeometry(0.04, 0.045, 16), new MeshBasicMaterial({
      color: new Color(theme.accentColor), transparent: true, opacity: 0.2, side: DoubleSide,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(fx, 0.001, fz);
    tableGroup.add(ring);
  }

  // Rails
  const rails: Mesh[] = [];
  function createRail(x: number, z: number, w: number, d: number) {
    const geo = new BoxGeometry(w, RAIL_HEIGHT, d);
    const mat = new MeshStandardMaterial({
      color: new Color(theme.railColor),
      emissive: new Color(theme.railEmissive),
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    const rail = new Mesh(geo, mat);
    rail.position.set(x, RAIL_HEIGHT / 2, z);
    tableGroup.add(rail);

    const edges = new EdgesGeometry(geo);
    const line = new LineSegments(edges, new LineBasicMaterial({ color: new Color(theme.accentColor), transparent: true, opacity: 0.5 }));
    line.position.copy(rail.position);
    tableGroup.add(line);

    rails.push(rail);
    return rail;
  }

  // Side rails
  createRail(-TABLE_WIDTH / 2 - RAIL_WIDTH / 2, 0, RAIL_WIDTH, TABLE_LENGTH + RAIL_WIDTH * 2);
  createRail(TABLE_WIDTH / 2 + RAIL_WIDTH / 2, 0, RAIL_WIDTH, TABLE_LENGTH + RAIL_WIDTH * 2);

  // Top rails (with goal gap)
  const sideSegWidth = (TABLE_WIDTH - GOAL_WIDTH) / 2;
  createRail(-TABLE_WIDTH / 2 + sideSegWidth / 2, -TABLE_LENGTH / 2 - RAIL_WIDTH / 2, sideSegWidth, RAIL_WIDTH);
  createRail(TABLE_WIDTH / 2 - sideSegWidth / 2, -TABLE_LENGTH / 2 - RAIL_WIDTH / 2, sideSegWidth, RAIL_WIDTH);

  // Bottom rails (with goal gap)
  createRail(-TABLE_WIDTH / 2 + sideSegWidth / 2, TABLE_LENGTH / 2 + RAIL_WIDTH / 2, sideSegWidth, RAIL_WIDTH);
  createRail(TABLE_WIDTH / 2 - sideSegWidth / 2, TABLE_LENGTH / 2 + RAIL_WIDTH / 2, sideSegWidth, RAIL_WIDTH);

  // Goal zones
  for (const zSide of [-1, 1]) {
    const goalGeo = new PlaneGeometry(GOAL_WIDTH, 0.04);
    const goalMat = new MeshBasicMaterial({
      color: zSide < 0 ? new Color('#ff4444') : new Color('#44ff44'),
      transparent: true,
      opacity: 0.6,
    });
    const goalStrip = new Mesh(goalGeo, goalMat);
    goalStrip.rotation.x = -Math.PI / 2;
    goalStrip.position.set(0, 0.002, zSide * (TABLE_LENGTH / 2 + 0.01));
    tableGroup.add(goalStrip);
  }

  // Table legs
  const boundaryGlowMeshes: Mesh[] = [];
  for (const [lx, lz] of [[-0.5, -0.85], [0.5, -0.85], [-0.5, 0.85], [0.5, 0.85]]) {
    const legGeo = new CylinderGeometry(0.025, 0.03, TABLE_HEIGHT - 0.02, 8);
    const legMat = new MeshStandardMaterial({
      color: 0x222233,
      emissive: new Color(theme.accentColor),
      emissiveIntensity: 0.1,
      metalness: 0.9,
    });
    const leg = new Mesh(legGeo, legMat);
    leg.position.set(lx * (TABLE_WIDTH / 2 + 0.03), -(TABLE_HEIGHT / 2) + 0.01, lz);
    tableGroup.add(leg);
  }

  // ─── BOUNDARY EDGE GLOW ───
  // Thin glowing strips along table edges for visual flair
  const edgeGlowGeo = new PlaneGeometry(TABLE_WIDTH + 0.06, 0.02);
  const sideEdgeGeo = new PlaneGeometry(0.02, TABLE_LENGTH + 0.06);
  const edgeGlowMat = new MeshBasicMaterial({
    color: new Color(theme.accentColor),
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
  });
  // Top and bottom edges
  const topEdgeGlow = new Mesh(edgeGlowGeo, edgeGlowMat.clone());
  topEdgeGlow.rotation.x = -Math.PI / 2;
  topEdgeGlow.position.set(0, 0.003, -TABLE_LENGTH / 2 - RAIL_WIDTH);
  tableGroup.add(topEdgeGlow);
  boundaryGlowMeshes.push(topEdgeGlow);

  const bottomEdgeGlow = new Mesh(edgeGlowGeo, edgeGlowMat.clone());
  bottomEdgeGlow.rotation.x = -Math.PI / 2;
  bottomEdgeGlow.position.set(0, 0.003, TABLE_LENGTH / 2 + RAIL_WIDTH);
  tableGroup.add(bottomEdgeGlow);
  boundaryGlowMeshes.push(bottomEdgeGlow);

  // Left and right edges
  const leftEdgeGlow = new Mesh(sideEdgeGeo, edgeGlowMat.clone());
  leftEdgeGlow.rotation.x = -Math.PI / 2;
  leftEdgeGlow.position.set(-TABLE_WIDTH / 2 - RAIL_WIDTH, 0.003, 0);
  tableGroup.add(leftEdgeGlow);
  boundaryGlowMeshes.push(leftEdgeGlow);

  const rightEdgeGlow = new Mesh(sideEdgeGeo, edgeGlowMat.clone());
  rightEdgeGlow.rotation.x = -Math.PI / 2;
  rightEdgeGlow.position.set(TABLE_WIDTH / 2 + RAIL_WIDTH, 0.003, 0);
  tableGroup.add(rightEdgeGlow);
  boundaryGlowMeshes.push(rightEdgeGlow);

  // ─── PUCK ───
  const puckGeo = new CylinderGeometry(PUCK_RADIUS, PUCK_RADIUS, PUCK_HEIGHT, 24);
  const puckMat = new MeshStandardMaterial({
    color: new Color(theme.puckColor),
    emissive: new Color(theme.puckColor),
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.4,
  });
  const puck = new Mesh(puckGeo, puckMat);
  puck.position.set(0, PUCK_HEIGHT / 2 + 0.002, 0);
  tableGroup.add(puck);

  // Puck glow
  const puckGlowGeo = new CylinderGeometry(PUCK_RADIUS * 1.5, PUCK_RADIUS * 1.5, 0.003, 24);
  const puckGlowMat = new MeshBasicMaterial({
    color: new Color(theme.puckColor),
    transparent: true,
    opacity: 0.3,
    blending: AdditiveBlending,
  });
  const puckGlow = new Mesh(puckGlowGeo, puckGlowMat);
  puckGlow.position.set(0, 0.001, 0);
  tableGroup.add(puckGlow);

  let puckVx = 0;
  let puckVz = 0;

  // ─── PLAYER MALLET ───
  const playerMalletGeo = new CylinderGeometry(MALLET_RADIUS, MALLET_RADIUS, MALLET_HEIGHT, 24);
  const playerMalletMat = new MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00ff88,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.3,
  });
  const playerMallet = new Mesh(playerMalletGeo, playerMalletMat);
  playerMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, TABLE_LENGTH * 0.35);
  tableGroup.add(playerMallet);

  const playerRingGeo = new RingGeometry(MALLET_RADIUS, MALLET_RADIUS + 0.008, 24);
  const playerRingMat = new MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5, side: DoubleSide });
  const playerRing = new Mesh(playerRingGeo, playerRingMat);
  playerRing.rotation.x = -Math.PI / 2;
  playerRing.position.set(0, MALLET_HEIGHT + 0.004, TABLE_LENGTH * 0.35);
  tableGroup.add(playerRing);

  // ─── CPU MALLET ───
  const cpuMalletMat = new MeshStandardMaterial({
    color: 0xff4466,
    emissive: 0xff4466,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.3,
  });
  const cpuMallet = new Mesh(playerMalletGeo.clone(), cpuMalletMat);
  cpuMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, -TABLE_LENGTH * 0.35);
  tableGroup.add(cpuMallet);

  const cpuRingMat = new MeshBasicMaterial({ color: 0xff4466, transparent: true, opacity: 0.5, side: DoubleSide });
  const cpuRing = new Mesh(playerRingGeo.clone(), cpuRingMat);
  cpuRing.rotation.x = -Math.PI / 2;
  cpuRing.position.set(0, MALLET_HEIGHT + 0.004, -TABLE_LENGTH * 0.35);
  tableGroup.add(cpuRing);

  let prevPlayerMalletX = 0;
  let prevPlayerMalletZ = TABLE_LENGTH * 0.35;

  // ─── SYSTEMS ───
  const audio = new AudioManager();
  const ai = new AISystem();
  const powerUps = new PowerUpManager(tableGroup, TABLE_WIDTH, TABLE_LENGTH, theme);
  const effects = new EffectsManager(tableGroup, theme);
  const env = new Environment(world.scene, theme);
  const ui = new UIManager(world, gameState);

  // ─── MOUSE / POINTER STATE ───
  const mousePos = new Vector2(0, 0);
  const raycaster = new Raycaster();
  let isPointerDown = false;

  if (container) {
    container.addEventListener('pointermove', (e) => {
      mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    container.addEventListener('pointerdown', () => { isPointerDown = true; });
    container.addEventListener('pointerup', () => { isPointerDown = false; });
  }

  // ─── BASE CAMERA POSITION (for shake) ───
  const baseCameraPos = new Vector3(0, 1.6, 0.8);

  // ─── HELPER FUNCTIONS ───
  function resetPuck() {
    puck.position.set(0, PUCK_HEIGHT / 2 + 0.002, 0);
    puckGlow.position.set(0, 0.001, 0);
    puckVx = 0;
    puckVz = 0;
    goalCooldown = 1.0;
  }

  function startCountdown() {
    countdownValue = 3;
    countdownTimer = 0;
    changeState('countdown');
    ui.showCountdown('3');
    audio.playCountdownTick();
  }

  function startGame() {
    playerScore = 0;
    cpuScore = 0;
    currentStreak = 0;
    gameTime = 0;
    comboMultiplier = 1;
    comboTimer = 0;
    survivalBalls = 3;
    timedSeconds = 60;
    isPowerUpMode = gameMode === 'powerup';
    isPracticeMode = gameMode === 'practice';
    stats.maxDeficit = 0;
    resetPuck();
    playerMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, TABLE_LENGTH * 0.35);
    cpuMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, -TABLE_LENGTH * 0.35);
    powerUps.clearAll();
    if (isPowerUpMode) powerUps.scheduleSpawn();

    // Hide CPU in practice mode
    cpuMallet.visible = !isPracticeMode;
    cpuRing.visible = !isPracticeMode;

    // Reset mallet scales
    playerMallet.scale.setScalar(1);
    cpuMallet.scale.setScalar(1);
    playerRing.scale.setScalar(1);
    cpuRing.scale.setScalar(1);

    audio.playGameStart();
    changeState('playing');
  }

  function startGameWithCountdown() {
    playerScore = 0;
    cpuScore = 0;
    currentStreak = 0;
    gameTime = 0;
    comboMultiplier = 1;
    comboTimer = 0;
    survivalBalls = 3;
    timedSeconds = 60;
    isPowerUpMode = gameMode === 'powerup';
    isPracticeMode = gameMode === 'practice';
    stats.maxDeficit = 0;
    resetPuck();
    playerMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, TABLE_LENGTH * 0.35);
    cpuMallet.position.set(0, MALLET_HEIGHT / 2 + 0.002, -TABLE_LENGTH * 0.35);
    powerUps.clearAll();

    cpuMallet.visible = !isPracticeMode;
    cpuRing.visible = !isPracticeMode;

    playerMallet.scale.setScalar(1);
    cpuMallet.scale.setScalar(1);
    playerRing.scale.setScalar(1);
    cpuRing.scale.setScalar(1);

    startCountdown();
  }

  function endGame(won: boolean) {
    stats.totalGames++;
    if (won) stats.totalWins++;
    stats.totalGoals += playerScore;
    stats.totalGoalsConceded += cpuScore;
    if (currentStreak > stats.longestStreak) stats.longestStreak = currentStreak;
    if (playerScore > stats.bestScore) stats.bestScore = playerScore;
    if (comboMultiplier > stats.bestCombo) stats.bestCombo = comboMultiplier;
    stats.totalPlayTime += gameTime;

    // Track mode stats
    if (!stats.modeStats[gameMode]) stats.modeStats[gameMode] = { wins: 0, losses: 0 };
    if (won) stats.modeStats[gameMode].wins++;
    else stats.modeStats[gameMode].losses++;

    // Track theme usage
    const themesArr = Array.isArray(stats.themesPlayed) ? stats.themesPlayed : [];
    if (!themesArr.includes(currentThemeIndex)) {
      themesArr.push(currentThemeIndex);
      stats.themesPlayed = themesArr;
    }

    saveStats();

    // Save match record
    matchHistory.unshift({
      playerScore,
      cpuScore,
      won,
      mode: gameMode,
      difficulty,
      date: new Date().toISOString(),
      combo: comboMultiplier,
      duration: gameTime,
    });
    saveMatchHistory();

    saveToLeaderboard();

    checkAchievements(won);

    if (gameMode === 'tournament') {
      if (won) {
        tournamentWins++;
        if (tournamentRound < 3) {
          tournamentRound++;
          ui.showMessage(`Round ${tournamentRound + 1}!`, 2000);
          setTimeout(() => startGameWithCountdown(), 2500);
          return;
        }
        unlockAchievement('tournament_champion');
      }
    }

    changeState('gameover');
    ui.updateGameOver(playerScore, cpuScore, won, gameMode, comboMultiplier);
    audio.playGameEnd(won);
  }

  function changeState(newState: GameState) {
    gameState = newState;
    ui.setState(newState);
  }

  function onGoal(playerScored: boolean) {
    if (goalCooldown > 0) return;

    // Shield check — blocks goals against player
    if (!playerScored && powerUps.isShieldActive()) {
      puckVz = -Math.abs(puckVz) * 1.2; // Bounce back hard
      effects.shieldBlockEffect(puck.position.x, TABLE_LENGTH / 2);
      audio.playShieldBlock();
      ui.showMessage('SHIELD BLOCK!', 1200);
      stats.shieldBlocks++;
      saveStats();
      return;
    }

    if (playerScored) {
      playerScore++;
      currentStreak++;
      if (currentStreak > 1) {
        comboMultiplier = Math.min(5, 1 + (currentStreak - 1) * 0.5);
        comboTimer = 3;
      }
      effects.goalEffect(puck.position.x, puck.position.z, true);
      audio.playGoalScored();
      ui.showMessage(currentStreak > 2 ? `STREAK x${currentStreak}!` : 'GOAL!', 1500);
    } else {
      cpuScore++;
      currentStreak = 0;
      comboMultiplier = 1;
      // Track max deficit for comeback achievement
      const deficit = cpuScore - playerScore;
      if (deficit > stats.maxDeficit) stats.maxDeficit = deficit;
      effects.goalEffect(puck.position.x, puck.position.z, false);
      audio.playGoalConceded();
    }

    // Notify AI for adaptive difficulty
    ai.onGoal(playerScored);

    ui.updateHUD(playerScore, cpuScore, gameTime, comboMultiplier, gameMode, timedSeconds, survivalBalls);

    // Practice mode: no win condition, just reset
    if (isPracticeMode) {
      resetPuck();
      return;
    }

    // Check win condition
    if (gameMode === 'classic' || gameMode === 'powerup' || gameMode === 'tournament') {
      if (playerScore >= SCORE_TO_WIN) { endGame(true); return; }
      if (cpuScore >= SCORE_TO_WIN) { endGame(false); return; }
    } else if (gameMode === 'survival') {
      if (!playerScored) {
        survivalBalls--;
        if (survivalBalls <= 0) { endGame(playerScore > 0); return; }
      }
    }

    resetPuck();
  }

  function unlockAchievement(id: string) {
    if (achievementsUnlocked.has(id)) return;
    achievementsUnlocked.add(id);
    saveAchievements();
    audio.playAchievement();
    ui.showMessage('Achievement Unlocked!', 2000);
  }

  function checkAchievements(won: boolean) {
    if (won) unlockAchievement('first_win');
    if (won && cpuScore === 0) unlockAchievement('shutout');
    if (playerScore >= 7 && won) unlockAchievement('champion');
    if (currentStreak >= 3) unlockAchievement('hat_trick');
    if (currentStreak >= 5) unlockAchievement('on_fire');
    if (currentStreak >= 7) unlockAchievement('unstoppable');
    if (stats.totalGames >= 10) unlockAchievement('veteran');
    if (stats.totalGames >= 50) unlockAchievement('dedicated');
    if (stats.totalGames >= 100) unlockAchievement('century_goals');
    if (stats.totalGoals >= 100) unlockAchievement('century');
    if (stats.totalWins >= 25) unlockAchievement('quarter_century');
    if (difficulty === 'hard' && won) unlockAchievement('hard_winner');
    if (difficulty === 'hard' && won && cpuScore === 0) unlockAchievement('perfect_game');
    if (gameMode === 'survival' && playerScore >= 10) unlockAchievement('survivor');
    if (gameMode === 'timed' && playerScore >= 10) unlockAchievement('speed_demon');
    if (stats.powerUpsCollected >= 20) unlockAchievement('collector');
    if (stats.powerUpsCollected >= 50) unlockAchievement('power_player');
    if (comboMultiplier >= 4) unlockAchievement('combo_master');
    if (won && gameTime < 60) unlockAchievement('speed_run');
    if (stats.totalPlayTime >= 1800) unlockAchievement('marathon');
    if (stats.shieldBlocks >= 5) unlockAchievement('shield_master');
    const themesArr = Array.isArray(stats.themesPlayed) ? stats.themesPlayed : [];
    if (themesArr.length >= 5) unlockAchievement('theme_explorer');
    if (won && stats.maxDeficit >= 4) unlockAchievement('comeback_king');
  }

  // ─── LEADERBOARD ───
  function saveToLeaderboard() {
    const entries = JSON.parse(localStorage.getItem('neon-hockey-leaderboard') || '[]');
    entries.push({
      score: playerScore,
      opponent: cpuScore,
      mode: gameMode,
      difficulty,
      date: new Date().toISOString(),
      combo: comboMultiplier,
    });
    entries.sort((a: any, b: any) => b.score - a.score);
    localStorage.setItem('neon-hockey-leaderboard', JSON.stringify(entries.slice(0, 20)));
  }

  // ─── APPLY THEME ───
  function applyTheme(idx: number) {
    currentThemeIndex = idx;
    const t = TableThemes[idx];
    localStorage.setItem('neon-hockey-theme', String(idx));

    surfaceMat.color.set(t.surfaceColor);
    surfaceMat.emissive.set(t.surfaceEmissive);
    centerLineMat.color.set(t.accentColor);
    centerCircleMat.color.set(t.accentColor);
    centerDotMat.color.set(t.accentColor);
    puckMat.color.set(t.puckColor);
    puckMat.emissive.set(t.puckColor);
    puckGlowMat.color.set(t.puckColor);

    env.applyTheme(t);
    effects.setTheme(t);
    powerUps.setTheme(t);
  }

  // ─── UI CALLBACKS ───
  ui.onButtonClick = () => audio.playButtonClick();
  ui.onStartGame = () => startGameWithCountdown();
  ui.onModeSelect = () => changeState('modeselect');
  ui.onSetMode = (mode: GameMode) => {
    gameMode = mode;
    if (mode === 'practice') {
      // Practice mode: skip difficulty select, use easy AI or no AI
      difficulty = 'easy';
      ai.setDifficulty('easy');
      startGameWithCountdown();
    } else {
      changeState('difficulty');
    }
  };
  ui.onSetDifficulty = (diff: Difficulty) => {
    difficulty = diff;
    ai.setDifficulty(diff);
    if (gameMode === 'tournament') { tournamentRound = 0; tournamentWins = 0; }
    startGameWithCountdown();
  };
  ui.onResume = () => changeState('playing');
  ui.onQuit = () => {
    powerUps.clearAll();
    cpuMallet.visible = true;
    cpuRing.visible = true;
    changeState('title');
  };
  ui.onRematch = () => startGameWithCountdown();
  ui.onShowLeaderboard = () => {
    const entries = JSON.parse(localStorage.getItem('neon-hockey-leaderboard') || '[]');
    ui.updateLeaderboard(entries);
    changeState('leaderboard');
  };
  ui.onShowAchievements = () => {
    ui.updateAchievements(achievementsUnlocked);
    changeState('achievements');
  };
  ui.onShowSettings = () => changeState('settings');
  ui.onShowHelp = () => changeState('help');
  ui.onShowStats = () => {
    ui.updateStats(stats, achievementsUnlocked.size, stats.bestCombo, stats.modeStats);
    changeState('stats');
  };
  ui.onShowHistory = () => {
    ui.updateMatchHistory(matchHistory);
    changeState('matchhistory');
  };
  ui.onBack = () => changeState('title');
  ui.onChangeTheme = (dir: number) => {
    let idx = currentThemeIndex + dir;
    if (idx < 0) idx = TableThemes.length - 1;
    if (idx >= TableThemes.length) idx = 0;
    applyTheme(idx);
    ui.updateSettingsTheme(TableThemes[idx].name);
  };
  ui.onSetVolume = (type: string, delta: number) => {
    audio.adjustVolume(type, delta);
  };

  // ─── UPDATE LOOP ───
  let prevTime = performance.now();
  const tablePlane = new PlaneGeometry(TABLE_WIDTH * 2, TABLE_LENGTH * 2);
  const tablePlaneMesh = new Mesh(tablePlane, new MeshBasicMaterial({ visible: false }));
  tablePlaneMesh.rotation.x = -Math.PI / 2;
  tablePlaneMesh.position.y = 0.005;
  tableGroup.add(tablePlaneMesh);

  function update() {
    requestAnimationFrame(update);

    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;

    // Update effects & environment always
    effects.update(dt);
    env.update(dt);

    // Boundary glow pulse
    const glowPulse = 0.3 + Math.sin(performance.now() / 1000 * 1.5) * 0.15;
    for (const glow of boundaryGlowMeshes) {
      (glow.material as any).opacity = glowPulse;
    }

    if (goalCooldown > 0) goalCooldown -= dt;

    // ─── COUNTDOWN STATE ───
    if (gameState === 'countdown') {
      countdownTimer += dt;
      if (countdownTimer >= 1) {
        countdownTimer -= 1;
        countdownValue--;
        if (countdownValue <= 0) {
          if (isPowerUpMode) powerUps.scheduleSpawn();
          audio.playGameStart();
          changeState('playing');
        } else {
          ui.showCountdown(String(countdownValue));
          audio.playCountdownTick();
        }
      }
      return;
    }

    if (gameState !== 'playing') return;

    gameTime += dt;

    // Combo decay
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        comboMultiplier = 1;
        currentStreak = 0;
      }
    }

    // Timed mode countdown
    if (gameMode === 'timed') {
      timedSeconds -= dt;
      // Beep on last 5 seconds
      if (timedSeconds <= 5 && timedSeconds > 0) {
        const sec = Math.ceil(timedSeconds);
        const prevSec = Math.ceil(timedSeconds + dt);
        if (sec !== prevSec) audio.playCountdownTick();
      }
      if (timedSeconds <= 0) {
        endGame(playerScore > cpuScore);
        return;
      }
    }

    // ─── Apply mallet scale from power-ups ───
    const pScale = powerUps.playerMalletScale;
    const cScale = powerUps.cpuMalletScale;
    playerMallet.scale.setScalar(pScale);
    playerRing.scale.setScalar(pScale);
    cpuMallet.scale.setScalar(cScale);
    cpuRing.scale.setScalar(cScale);

    const effectiveMalletR = MALLET_RADIUS * pScale;
    const effectiveCpuMalletR = MALLET_RADIUS * cScale;

    // ─── Player mallet control (browser) ───
    const camera = (world as any).renderer?.xr?.isPresenting ? null : (world as any).camera;
    if (camera) {
      raycaster.setFromCamera(mousePos, camera);
      const hits = raycaster.intersectObject(tablePlaneMesh);
      if (hits.length > 0) {
        const point = tableGroup.worldToLocal(hits[0].point.clone());
        const targetX = Math.max(-TABLE_WIDTH / 2 + effectiveMalletR, Math.min(TABLE_WIDTH / 2 - effectiveMalletR, point.x));
        const targetZ = Math.max(0.05, Math.min(TABLE_LENGTH / 2 - effectiveMalletR, point.z));

        prevPlayerMalletX = playerMallet.position.x;
        prevPlayerMalletZ = playerMallet.position.z;
        playerMallet.position.x += (targetX - playerMallet.position.x) * 0.3;
        playerMallet.position.z += (targetZ - playerMallet.position.z) * 0.3;
        playerRing.position.x = playerMallet.position.x;
        playerRing.position.z = playerMallet.position.z;
      }

      // Screen shake
      const shake = effects.getShakeOffset();
      camera.position.set(
        baseCameraPos.x + shake.x,
        baseCameraPos.y + shake.y,
        baseCameraPos.z + shake.z,
      );
    }

    // ─── VR controller input ───
    const rightGamepad = world.input?.xr?.gamepads?.right;
    if (rightGamepad) {
      const rSpace = (world as any).playerSpaceEntities?.gripSpaces?.right;
      if (rSpace) {
        const gripPos = new Vector3();
        rSpace.object3D.getWorldPosition(gripPos);
        const localPos = tableGroup.worldToLocal(gripPos.clone());

        const targetX = Math.max(-TABLE_WIDTH / 2 + effectiveMalletR, Math.min(TABLE_WIDTH / 2 - effectiveMalletR, localPos.x));
        const targetZ = Math.max(0.05, Math.min(TABLE_LENGTH / 2 - effectiveMalletR, localPos.z));

        prevPlayerMalletX = playerMallet.position.x;
        prevPlayerMalletZ = playerMallet.position.z;
        playerMallet.position.x = targetX;
        playerMallet.position.z = targetZ;
        playerRing.position.x = playerMallet.position.x;
        playerRing.position.z = playerMallet.position.z;
      }

      if (rightGamepad.getButtonDown(InputComponent.B_Button)) {
        changeState('paused');
      }
    }

    // Keyboard pause
    if (world.input?.keyboard?.getKeyDown('Escape')) {
      changeState('paused');
    }

    // ─── AI Mallet Control (skip in practice mode) ───
    if (!isPracticeMode) {
      const aiMove = ai.update(dt, puck.position.x, puck.position.z, puckVx, puckVz,
        cpuMallet.position.x, cpuMallet.position.z, TABLE_WIDTH, TABLE_LENGTH, effectiveCpuMalletR);
      const prevCpuX = cpuMallet.position.x;
      const prevCpuZ = cpuMallet.position.z;
      cpuMallet.position.x += (aiMove.x - cpuMallet.position.x) * 0.15;
      cpuMallet.position.z += (aiMove.z - cpuMallet.position.z) * 0.15;
      cpuMallet.position.z = Math.max(-TABLE_LENGTH / 2 + effectiveCpuMalletR, Math.min(-0.05, cpuMallet.position.z));
      cpuMallet.position.x = Math.max(-TABLE_WIDTH / 2 + effectiveCpuMalletR, Math.min(TABLE_WIDTH / 2 - effectiveCpuMalletR, cpuMallet.position.x));
      cpuRing.position.x = cpuMallet.position.x;
      cpuRing.position.z = cpuMallet.position.z;

      // CPU mallet collision (used in puck physics below)
      var prevCpuMalletX = prevCpuX;
      var prevCpuMalletZ = prevCpuZ;
    }

    // ─── PUCK PHYSICS ───
    // Magnet effect — gently pull puck toward player mallet
    if (powerUps.magnetActive) {
      const mdx = playerMallet.position.x - puck.position.x;
      const mdz = playerMallet.position.z - puck.position.z;
      const mDist = Math.sqrt(mdx * mdx + mdz * mdz);
      if (mDist > 0.08 && mDist < 0.6) {
        const pullStrength = 0.4 * (1 - mDist / 0.6);
        puckVx += (mdx / mDist) * pullStrength * dt * 10;
        puckVz += (mdz / mDist) * pullStrength * dt * 10;
      }
    }

    const substeps = 4;
    const subDt = dt / substeps;
    for (let s = 0; s < substeps; s++) {
      puck.position.x += puckVx * subDt;
      puck.position.z += puckVz * subDt;

      // Wall bounces
      const halfW = TABLE_WIDTH / 2 - PUCK_RADIUS;
      if (puck.position.x < -halfW) { puck.position.x = -halfW; puckVx = Math.abs(puckVx); audio.playWallHit(); effects.wallSpark(puck.position.x, puck.position.z); }
      if (puck.position.x > halfW) { puck.position.x = halfW; puckVx = -Math.abs(puckVx); audio.playWallHit(); effects.wallSpark(puck.position.x, puck.position.z); }

      const halfL = TABLE_LENGTH / 2 - PUCK_RADIUS;
      const goalHalfW = GOAL_WIDTH / 2;

      // CPU goal (negative Z)
      if (puck.position.z < -halfL) {
        if (Math.abs(puck.position.x) < goalHalfW) {
          onGoal(true);
          break;
        } else {
          puck.position.z = -halfL;
          puckVz = Math.abs(puckVz);
          audio.playWallHit();
          effects.wallSpark(puck.position.x, puck.position.z);
        }
      }

      // Player goal (positive Z)
      if (puck.position.z > halfL) {
        if (Math.abs(puck.position.x) < goalHalfW) {
          onGoal(false);
          break;
        } else {
          puck.position.z = halfL;
          puckVz = -Math.abs(puckVz);
          audio.playWallHit();
          effects.wallSpark(puck.position.x, puck.position.z);
        }
      }

      // Player mallet collision
      const dxP = puck.position.x - playerMallet.position.x;
      const dzP = puck.position.z - playerMallet.position.z;
      const distP = Math.sqrt(dxP * dxP + dzP * dzP);
      const minDistP = PUCK_RADIUS + effectiveMalletR;
      if (distP < minDistP && distP > 0.001) {
        const nx = dxP / distP;
        const nz = dzP / distP;
        puck.position.x = playerMallet.position.x + nx * minDistP;
        puck.position.z = playerMallet.position.z + nz * minDistP;
        const malletVx = (playerMallet.position.x - prevPlayerMalletX) / subDt;
        const malletVz = (playerMallet.position.z - prevPlayerMalletZ) / subDt;
        const relVn = puckVx * nx + puckVz * nz;
        puckVx = puckVx - 2 * relVn * nx + malletVx * 0.6;
        puckVz = puckVz - 2 * relVn * nz + malletVz * 0.6;
        const spd = Math.sqrt(puckVx * puckVx + puckVz * puckVz);
        if (spd > MAX_PUCK_SPEED) {
          puckVx = (puckVx / spd) * MAX_PUCK_SPEED;
          puckVz = (puckVz / spd) * MAX_PUCK_SPEED;
        }
        audio.playMalletHit(spd / MAX_PUCK_SPEED);
        effects.malletHitEffect(puck.position.x, puck.position.z, true);
      }

      // CPU mallet collision (only if not practice mode)
      if (!isPracticeMode) {
        const dxC = puck.position.x - cpuMallet.position.x;
        const dzC = puck.position.z - cpuMallet.position.z;
        const distC = Math.sqrt(dxC * dxC + dzC * dzC);
        const minDistC = PUCK_RADIUS + effectiveCpuMalletR;
        if (distC < minDistC && distC > 0.001) {
          const nx = dxC / distC;
          const nz = dzC / distC;
          puck.position.x = cpuMallet.position.x + nx * minDistC;
          puck.position.z = cpuMallet.position.z + nz * minDistC;
          const cpuVx = (cpuMallet.position.x - (prevCpuMalletX ?? cpuMallet.position.x)) / subDt;
          const cpuVz = (cpuMallet.position.z - (prevCpuMalletZ ?? cpuMallet.position.z)) / subDt;
          const relVn = puckVx * nx + puckVz * nz;
          puckVx = puckVx - 2 * relVn * nx + cpuVx * 0.6;
          puckVz = puckVz - 2 * relVn * nz + cpuVz * 0.6;
          const spd = Math.sqrt(puckVx * puckVx + puckVz * puckVz);
          if (spd > MAX_PUCK_SPEED) {
            puckVx = (puckVx / spd) * MAX_PUCK_SPEED;
            puckVz = (puckVz / spd) * MAX_PUCK_SPEED;
          }
          audio.playMalletHit(spd / MAX_PUCK_SPEED);
          effects.malletHitEffect(puck.position.x, puck.position.z, false);
        }
      }

      // Friction
      puckVx *= FRICTION;
      puckVz *= FRICTION;
      const totalSpd = Math.sqrt(puckVx * puckVx + puckVz * puckVz);
      if (totalSpd < 0.005) { puckVx = 0; puckVz = 0; }
    }

    // Update puck glow position
    puckGlow.position.x = puck.position.x;
    puckGlow.position.z = puck.position.z;

    const speed = Math.sqrt(puckVx * puckVx + puckVz * puckVz);
    (puckGlowMat as any).opacity = 0.2 + Math.min(0.5, speed * 0.15);

    // Puck trail
    effects.updateTrail(dt, puck.position.x, puck.position.z, speed);

    // Power-up mode
    if (isPowerUpMode) {
      const collected = powerUps.update(dt, puck.position.x, puck.position.z,
        playerMallet.position.x, playerMallet.position.z);
      if (collected) {
        stats.powerUpsCollected++;
        saveStats();
        audio.playPowerUp();
        ui.showMessage(`${collected.name}!`, 1500);
        effects.powerUpCollectEffect(playerMallet.position.x, playerMallet.position.z, collected.color);

        // Activate effect
        powerUps.activateEffect(collected);

        // Speed boost immediate effect
        if (collected.type === 'speed') {
          puckVx *= 1.5;
          puckVz *= 1.5;
        }
      }

      // Update shield position
      powerUps.updateShieldPosition(TABLE_LENGTH / 2);

      // Update power-up HUD
      ui.updatePowerUpHUD(powerUps.activeEffects);
    }

    // Update HUD
    ui.updateHUD(playerScore, cpuScore, gameTime, comboMultiplier, gameMode, timedSeconds, survivalBalls);
  }

  update();
}

main().catch(console.error);
