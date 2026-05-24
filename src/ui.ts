// UI Manager for Neon Hockey VR — all PanelUI, zero HTML DOM
// Supports: title, mode select (6 modes), difficulty, HUD, message, pause,
// game over, leaderboard, achievements, settings, help, power-up HUD, countdown,
// match history, stats
import {
  PanelUI, PanelDocument, UIKitDocument,
  Follower, FollowBehavior, ScreenSpace, Vector3,
} from '@iwsdk/core';
import type { GameState, GameMode, Difficulty } from './index';
import type { ActiveEffect } from './powerups';

type ClickHandler = (() => void) | null;

export class UIManager {
  private world: any;
  private entities: Map<string, any> = new Map();
  private docs: Map<string, UIKitDocument | null> = new Map();
  private currentState: GameState;

  // Callbacks
  onStartGame: (() => void) | null = null;
  onModeSelect: (() => void) | null = null;
  onSetMode: ((mode: GameMode) => void) | null = null;
  onSetDifficulty: ((diff: Difficulty) => void) | null = null;
  onResume: (() => void) | null = null;
  onQuit: (() => void) | null = null;
  onRematch: (() => void) | null = null;
  onShowLeaderboard: (() => void) | null = null;
  onShowAchievements: (() => void) | null = null;
  onShowSettings: (() => void) | null = null;
  onShowHelp: (() => void) | null = null;
  onShowStats: (() => void) | null = null;
  onShowHistory: (() => void) | null = null;
  onBack: (() => void) | null = null;
  onChangeTheme: ((dir: number) => void) | null = null;
  onSetVolume: ((type: string, delta: number) => void) | null = null;

  // Audio callback for button clicks
  onButtonClick: (() => void) | null = null;

  constructor(world: any, initialState: GameState) {
    this.world = world;
    this.currentState = initialState;
    this.createPanels();
  }

  private createPanel(name: string, config: string, options: {
    position?: [number, number, number];
    maxWidth?: number;
    maxHeight?: number;
    follower?: boolean;
    offsetPosition?: [number, number, number];
    screenSpace?: { width: string; bottom: string; right?: string; left?: string };
  }) {
    const entity = this.world.createTransformEntity(undefined, { persistent: true });

    if (options.position) {
      entity.object3D!.position.set(...options.position);
    }

    entity.addComponent(PanelUI, {
      config,
      maxWidth: options.maxWidth || 0.8,
      maxHeight: options.maxHeight || 0.6,
    });

    if (options.follower) {
      entity.addComponent(Follower, {
        target: this.world.player.head,
        offsetPosition: options.offsetPosition || [0, -0.1, -0.5],
        behavior: FollowBehavior.PivotY,
        speed: 5,
        tolerance: 0.3,
      });
    }

    if (options.screenSpace) {
      entity.addComponent(ScreenSpace, {
        width: options.screenSpace.width,
        height: 'auto',
        bottom: options.screenSpace.bottom,
        right: options.screenSpace.right,
        left: options.screenSpace.left,
        zOffset: 0.25,
      });
    }

    this.entities.set(name, entity);
    this.docs.set(name, null);

    return entity;
  }

  private createPanels() {
    // Title — world space, in front of player
    this.createPanel('title', '/ui/title.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.0,
      maxHeight: 0.8,
    });

    // Mode select
    this.createPanel('modeselect', '/ui/modeselect.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.0,
      maxHeight: 1.0,
    });

    // Difficulty select
    this.createPanel('difficulty', '/ui/difficulty.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 0.8,
      maxHeight: 0.7,
    });

    // HUD — head-following
    this.createPanel('hud', '/ui/hud.json', {
      maxWidth: 0.35,
      maxHeight: 0.12,
      follower: true,
      offsetPosition: [0, 0.18, -0.5],
    });

    // Message toast — head-following
    this.createPanel('message', '/ui/message.json', {
      maxWidth: 0.3,
      maxHeight: 0.08,
      follower: true,
      offsetPosition: [0, 0.05, -0.5],
    });

    // Power-up HUD — head-following, bottom-left
    this.createPanel('poweruphud', '/ui/poweruphud.json', {
      maxWidth: 0.25,
      maxHeight: 0.15,
      follower: true,
      offsetPosition: [-0.25, -0.12, -0.5],
    });

    // Countdown — head-following, center
    this.createPanel('countdown', '/ui/countdown.json', {
      maxWidth: 0.25,
      maxHeight: 0.25,
      follower: true,
      offsetPosition: [0, 0, -0.6],
    });

    // Pause
    this.createPanel('pause', '/ui/pause.json', {
      position: [0, 1.5, -1.2],
      maxWidth: 0.7,
      maxHeight: 0.5,
    });

    // Game over
    this.createPanel('gameover', '/ui/gameover.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 0.9,
      maxHeight: 0.7,
    });

    // Leaderboard
    this.createPanel('leaderboard', '/ui/leaderboard.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 0.9,
      maxHeight: 0.8,
    });

    // Achievements
    this.createPanel('achievements', '/ui/achievements.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.0,
      maxHeight: 0.9,
    });

    // Settings
    this.createPanel('settings', '/ui/settings.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 0.9,
      maxHeight: 0.8,
    });

    // Help
    this.createPanel('help', '/ui/help.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.0,
      maxHeight: 0.9,
    });

    // Match History
    this.createPanel('matchhistory', '/ui/matchhistory.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.1,
      maxHeight: 0.9,
    });

    // Stats
    this.createPanel('stats', '/ui/stats.json', {
      position: [0, 1.5, -1.5],
      maxWidth: 1.0,
      maxHeight: 0.9,
    });

    // Wire button events after a short delay to let panels load
    setTimeout(() => this.wireEvents(), 500);
    setTimeout(() => this.wireEvents(), 1500);
    setTimeout(() => this.wireEvents(), 3000);
  }

  private getDoc(name: string): UIKitDocument | null {
    let doc = this.docs.get(name);
    if (doc) return doc;
    const entity = this.entities.get(name);
    if (!entity) return null;
    doc = entity.getValue(PanelDocument, 'document') as UIKitDocument | undefined;
    if (doc) this.docs.set(name, doc);
    return doc || null;
  }

  private setText(doc: UIKitDocument | null, id: string, text: string) {
    if (!doc) return;
    const el = doc.getElementById(id);
    if (el && el.text) el.text.value = text;
  }

  private wireBtn(doc: UIKitDocument | null, id: string, handler: () => void) {
    if (!doc) return;
    const el = doc.getElementById(id);
    if (el) el.addEventListener('click', () => {
      this.onButtonClick?.();
      handler();
    });
  }

  wireEvents() {
    // Title
    const titleDoc = this.getDoc('title');
    this.wireBtn(titleDoc, 'play-btn', () => this.onModeSelect?.());
    this.wireBtn(titleDoc, 'leaderboard-btn', () => this.onShowLeaderboard?.());
    this.wireBtn(titleDoc, 'achievements-btn', () => this.onShowAchievements?.());
    this.wireBtn(titleDoc, 'settings-btn', () => this.onShowSettings?.());
    this.wireBtn(titleDoc, 'help-btn', () => this.onShowHelp?.());
    this.wireBtn(titleDoc, 'stats-btn', () => this.onShowStats?.());
    this.wireBtn(titleDoc, 'history-btn', () => this.onShowHistory?.());

    // Mode select (6 modes)
    const modeDoc = this.getDoc('modeselect');
    this.wireBtn(modeDoc, 'classic-btn', () => this.onSetMode?.('classic'));
    this.wireBtn(modeDoc, 'timed-btn', () => this.onSetMode?.('timed'));
    this.wireBtn(modeDoc, 'powerup-btn', () => this.onSetMode?.('powerup'));
    this.wireBtn(modeDoc, 'survival-btn', () => this.onSetMode?.('survival'));
    this.wireBtn(modeDoc, 'tournament-btn', () => this.onSetMode?.('tournament'));
    this.wireBtn(modeDoc, 'practice-btn', () => this.onSetMode?.('practice'));
    this.wireBtn(modeDoc, 'mode-back-btn', () => this.onBack?.());

    // Difficulty
    const diffDoc = this.getDoc('difficulty');
    this.wireBtn(diffDoc, 'easy-btn', () => this.onSetDifficulty?.('easy'));
    this.wireBtn(diffDoc, 'medium-btn', () => this.onSetDifficulty?.('medium'));
    this.wireBtn(diffDoc, 'hard-btn', () => this.onSetDifficulty?.('hard'));
    this.wireBtn(diffDoc, 'diff-back-btn', () => this.onModeSelect?.());

    // Pause
    const pauseDoc = this.getDoc('pause');
    this.wireBtn(pauseDoc, 'resume-btn', () => this.onResume?.());
    this.wireBtn(pauseDoc, 'quit-btn', () => this.onQuit?.());

    // Game over
    const goDoc = this.getDoc('gameover');
    this.wireBtn(goDoc, 'rematch-btn', () => this.onRematch?.());
    this.wireBtn(goDoc, 'go-menu-btn', () => this.onQuit?.());

    // Leaderboard
    const lbDoc = this.getDoc('leaderboard');
    this.wireBtn(lbDoc, 'lb-back-btn', () => this.onBack?.());

    // Achievements
    const achDoc = this.getDoc('achievements');
    this.wireBtn(achDoc, 'ach-back-btn', () => this.onBack?.());

    // Settings
    const setDoc = this.getDoc('settings');
    this.wireBtn(setDoc, 'theme-prev-btn', () => this.onChangeTheme?.(-1));
    this.wireBtn(setDoc, 'theme-next-btn', () => this.onChangeTheme?.(1));
    this.wireBtn(setDoc, 'master-up-btn', () => this.onSetVolume?.('master', 0.1));
    this.wireBtn(setDoc, 'master-down-btn', () => this.onSetVolume?.('master', -0.1));
    this.wireBtn(setDoc, 'sfx-up-btn', () => this.onSetVolume?.('sfx', 0.1));
    this.wireBtn(setDoc, 'sfx-down-btn', () => this.onSetVolume?.('sfx', -0.1));
    this.wireBtn(setDoc, 'music-up-btn', () => this.onSetVolume?.('music', 0.1));
    this.wireBtn(setDoc, 'music-down-btn', () => this.onSetVolume?.('music', -0.1));
    this.wireBtn(setDoc, 'set-back-btn', () => this.onBack?.());

    // Help
    const helpDoc = this.getDoc('help');
    this.wireBtn(helpDoc, 'help-back-btn', () => this.onBack?.());

    // Match History
    const mhDoc = this.getDoc('matchhistory');
    this.wireBtn(mhDoc, 'mh-back-btn', () => this.onBack?.());

    // Stats
    const statsDoc = this.getDoc('stats');
    this.wireBtn(statsDoc, 'stats-back-btn', () => this.onBack?.());

    // Set initial visibility
    this.setState(this.currentState);
  }

  setState(state: GameState) {
    this.currentState = state;
    const panels = ['title', 'modeselect', 'difficulty', 'hud', 'message', 'pause',
      'gameover', 'leaderboard', 'achievements', 'settings', 'help', 'poweruphud',
      'countdown', 'matchhistory', 'stats'];
    const visible: Record<string, string[]> = {
      'title': ['title'],
      'modeselect': ['modeselect'],
      'difficulty': ['difficulty'],
      'playing': ['hud'],
      'countdown': ['hud', 'countdown'],
      'paused': ['hud', 'pause'],
      'gameover': ['gameover'],
      'leaderboard': ['leaderboard'],
      'achievements': ['achievements'],
      'settings': ['settings'],
      'help': ['help'],
      'matchhistory': ['matchhistory'],
      'stats': ['stats'],
    };

    const show = visible[state] || [];
    for (const name of panels) {
      const entity = this.entities.get(name);
      if (entity && entity.object3D) {
        entity.object3D.visible = show.includes(name);
      }
    }
  }

  showMessage(text: string, duration: number) {
    const doc = this.getDoc('message');
    this.setText(doc, 'msg-text', text);
    const entity = this.entities.get('message');
    if (entity && entity.object3D) {
      entity.object3D.visible = true;
      setTimeout(() => {
        if (entity.object3D && this.currentState === 'playing') {
          entity.object3D.visible = false;
        }
      }, duration);
    }
  }

  showCountdown(number: string) {
    const doc = this.getDoc('countdown');
    this.setText(doc, 'countdown-text', number);
  }

  showPowerUpHud(show: boolean) {
    const entity = this.entities.get('poweruphud');
    if (entity && entity.object3D) {
      entity.object3D.visible = show;
    }
  }

  updatePowerUpHUD(effects: ActiveEffect[]) {
    const doc = this.getDoc('poweruphud');
    if (!doc) return;

    const show = effects.length > 0;
    this.showPowerUpHud(show);
    if (!show) return;

    for (let i = 0; i < 3; i++) {
      const effect = effects[i];
      if (effect) {
        this.setText(doc, `pu-icon-${i}`, effect.type.icon);
        this.setText(doc, `pu-name-${i}`, effect.type.name);
        this.setText(doc, `pu-timer-${i}`, `${Math.ceil(effect.remaining)}s`);
      } else {
        this.setText(doc, `pu-icon-${i}`, '');
        this.setText(doc, `pu-name-${i}`, '');
        this.setText(doc, `pu-timer-${i}`, '');
      }
    }
  }

  updateHUD(playerScore: number, cpuScore: number, time: number, combo: number, mode: GameMode, timedSecs: number, survivalBalls: number) {
    const doc = this.getDoc('hud');
    if (!doc) return;
    this.setText(doc, 'player-score', String(playerScore));
    this.setText(doc, 'cpu-score', String(cpuScore));

    if (mode === 'timed') {
      this.setText(doc, 'info-text', `Time: ${Math.ceil(timedSecs)}s`);
    } else if (mode === 'survival') {
      this.setText(doc, 'info-text', `Lives: ${survivalBalls}`);
    } else if (mode === 'practice') {
      this.setText(doc, 'info-text', `Free Play`);
    } else if (combo > 1) {
      this.setText(doc, 'info-text', `Combo x${combo.toFixed(1)}`);
    } else {
      this.setText(doc, 'info-text', 'First to 7');
    }
  }

  updateGameOver(playerScore: number, cpuScore: number, won: boolean, mode: GameMode, combo: number) {
    const doc = this.getDoc('gameover');
    if (!doc) return;
    this.setText(doc, 'result-text', won ? 'VICTORY!' : 'DEFEAT');
    this.setText(doc, 'final-score', `${playerScore} - ${cpuScore}`);
    this.setText(doc, 'go-mode', mode.toUpperCase());
    this.setText(doc, 'go-combo', combo > 1 ? `Best combo: x${combo.toFixed(1)}` : '');
  }

  updateLeaderboard(entries: any[]) {
    const doc = this.getDoc('leaderboard');
    if (!doc) return;
    for (let i = 0; i < 10; i++) {
      const entry = entries[i];
      if (entry) {
        this.setText(doc, `lb-rank-${i}`, `#${i + 1}`);
        this.setText(doc, `lb-score-${i}`, `${entry.score}-${entry.opponent}`);
        this.setText(doc, `lb-mode-${i}`, entry.mode || '');
      } else {
        this.setText(doc, `lb-rank-${i}`, `#${i + 1}`);
        this.setText(doc, `lb-score-${i}`, '---');
        this.setText(doc, `lb-mode-${i}`, '');
      }
    }
  }

  updateAchievements(unlocked: Set<string>) {
    const doc = this.getDoc('achievements');
    if (!doc) return;
    const total = ACHIEVEMENT_LIST.length;
    const count = unlocked.size;
    this.setText(doc, 'ach-count', `${count} / ${total}`);
    ACHIEVEMENT_LIST.forEach((ach, i) => {
      const isUnlocked = unlocked.has(ach.id);
      this.setText(doc, `ach-name-${i}`, isUnlocked ? ach.name : '???');
      this.setText(doc, `ach-desc-${i}`, isUnlocked ? ach.desc : 'Locked');
    });
  }

  updateSettingsTheme(name: string) {
    const doc = this.getDoc('settings');
    this.setText(doc, 'theme-name', name);
  }

  updateMatchHistory(matches: any[]) {
    const doc = this.getDoc('matchhistory');
    if (!doc) return;
    this.setText(doc, 'mh-count', `${matches.length} matches played`);
    for (let i = 0; i < 10; i++) {
      const m = matches[i];
      if (m) {
        this.setText(doc, `mh-rank-${i}`, `#${i + 1}`);
        this.setText(doc, `mh-result-${i}`, m.won ? 'WIN' : 'LOSS');
        this.setText(doc, `mh-score-${i}`, `${m.playerScore}-${m.cpuScore}`);
        this.setText(doc, `mh-mode-${i}`, m.mode.toUpperCase());
        this.setText(doc, `mh-diff-${i}`, m.difficulty || '---');
        const date = new Date(m.date);
        this.setText(doc, `mh-date-${i}`, `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`);
      } else {
        this.setText(doc, `mh-rank-${i}`, `#${i + 1}`);
        this.setText(doc, `mh-result-${i}`, '---');
        this.setText(doc, `mh-score-${i}`, '---');
        this.setText(doc, `mh-mode-${i}`, '---');
        this.setText(doc, `mh-diff-${i}`, '---');
        this.setText(doc, `mh-date-${i}`, '---');
      }
    }
  }

  updateStats(stats: any, achievementCount: number, bestCombo: number, modeStats: Record<string, { wins: number; losses: number }>) {
    const doc = this.getDoc('stats');
    if (!doc) return;
    this.setText(doc, 'stat-games', String(stats.totalGames));
    this.setText(doc, 'stat-wins', String(stats.totalWins));
    const winrate = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;
    this.setText(doc, 'stat-winrate', `${winrate}%`);
    this.setText(doc, 'stat-goals', String(stats.totalGoals));
    this.setText(doc, 'stat-conceded', String(stats.totalGoalsConceded));
    const goaldiff = stats.totalGoals - stats.totalGoalsConceded;
    this.setText(doc, 'stat-goaldiff', `${goaldiff >= 0 ? '+' : ''}${goaldiff}`);
    this.setText(doc, 'stat-best', String(stats.bestScore));
    this.setText(doc, 'stat-streak', String(stats.longestStreak));
    this.setText(doc, 'stat-combo', `x${bestCombo.toFixed(1)}`);
    this.setText(doc, 'stat-powerups', String(stats.powerUpsCollected));
    const mins = Math.floor(stats.totalPlayTime / 60);
    this.setText(doc, 'stat-time', mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
    this.setText(doc, 'stat-achcount', `${achievementCount}/${ACHIEVEMENT_LIST.length}`);

    for (const mode of ['classic', 'timed', 'powerup', 'survival', 'tournament']) {
      const ms = modeStats[mode] || { wins: 0, losses: 0 };
      this.setText(doc, `stat-mode-${mode}`, `${ms.wins}W / ${ms.losses}L`);
    }
  }
}

export const ACHIEVEMENT_LIST = [
  { id: 'first_win', name: 'First Victory', desc: 'Win your first game' },
  { id: 'shutout', name: 'Shutout', desc: 'Win without conceding a goal' },
  { id: 'champion', name: 'Champion', desc: 'Win with a score of 7' },
  { id: 'hat_trick', name: 'Hat Trick', desc: 'Score 3 goals in a row' },
  { id: 'on_fire', name: 'On Fire', desc: 'Score 5 goals in a row' },
  { id: 'unstoppable', name: 'Unstoppable', desc: 'Score 7 goals in a row' },
  { id: 'veteran', name: 'Veteran', desc: 'Play 10 games' },
  { id: 'dedicated', name: 'Dedicated', desc: 'Play 50 games' },
  { id: 'century', name: 'Century', desc: 'Score 100 total goals' },
  { id: 'quarter_century', name: 'Quarter Century', desc: 'Win 25 games' },
  { id: 'hard_winner', name: 'Hard Hitter', desc: 'Win on Hard difficulty' },
  { id: 'survivor', name: 'Survivor', desc: 'Score 10 in Survival mode' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Score 10 in Timed mode' },
  { id: 'collector', name: 'Collector', desc: 'Collect 20 power-ups' },
  { id: 'combo_master', name: 'Combo Master', desc: 'Reach x4 combo multiplier' },
  { id: 'tournament_champion', name: 'Tournament Champ', desc: 'Win a full tournament' },
  // New achievements (Round 3)
  { id: 'perfect_game', name: 'Perfect Game', desc: 'Win 7-0 on Hard difficulty' },
  { id: 'speed_run', name: 'Speed Run', desc: 'Win in under 60 seconds' },
  { id: 'power_player', name: 'Power Player', desc: 'Collect 50 total power-ups' },
  { id: 'marathon', name: 'Marathon', desc: 'Play for 30 minutes total' },
  { id: 'shield_master', name: 'Shield Master', desc: 'Block 5 goals with shields' },
  { id: 'theme_explorer', name: 'Theme Explorer', desc: 'Play on all 5 table themes' },
  { id: 'comeback_king', name: 'Comeback King', desc: 'Win after being down 0-4' },
  { id: 'century_goals', name: 'Century Player', desc: 'Play 100 total games' },
];
