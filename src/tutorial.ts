// Tutorial system for Neon Hockey VR
// Shows progressive tips on first play

export interface TutorialStep {
  id: string;
  text: string;
  vrText?: string; // alternate text for VR mode
  duration: number; // ms
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    text: 'Welcome to Neon Hockey!',
    duration: 2500,
  },
  {
    id: 'mallet',
    text: 'Move your mouse to control the mallet',
    vrText: 'Move your right controller to control the mallet',
    duration: 3000,
  },
  {
    id: 'goal',
    text: 'Hit the puck into your opponent\'s goal',
    duration: 3000,
  },
  {
    id: 'defense',
    text: 'Defend your goal — don\'t let the puck pass!',
    duration: 3000,
  },
  {
    id: 'score',
    text: 'First to 7 goals wins the match',
    duration: 2500,
  },
  {
    id: 'streak',
    text: 'Consecutive goals build your combo multiplier',
    duration: 3000,
  },
  {
    id: 'pause',
    text: 'Press ESC to pause (or B button in VR)',
    vrText: 'Press B button to pause',
    duration: 2500,
  },
  {
    id: 'go',
    text: 'Good luck! 🏒',
    duration: 2000,
  },
];

export class TutorialSystem {
  private steps: TutorialStep[];
  private currentIndex = 0;
  private timer = 0;
  private active = false;
  private isVR = false;
  private onShowMessage: ((text: string, duration: number) => void) | null = null;
  private completed = false;

  constructor() {
    this.steps = [...TUTORIAL_STEPS];
    this.completed = localStorage.getItem('neon-hockey-tutorial-done') === 'true';
  }

  get isActive(): boolean { return this.active; }
  get isCompleted(): boolean { return this.completed; }

  shouldShow(): boolean {
    return !this.completed;
  }

  start(isVR: boolean, onShowMessage: (text: string, duration: number) => void) {
    if (this.completed) return;
    this.isVR = isVR;
    this.onShowMessage = onShowMessage;
    this.active = true;
    this.currentIndex = 0;
    this.timer = 0;
    this.showCurrent();
  }

  private showCurrent() {
    if (this.currentIndex >= this.steps.length) {
      this.finish();
      return;
    }
    const step = this.steps[this.currentIndex];
    const text = (this.isVR && step.vrText) ? step.vrText : step.text;
    this.onShowMessage?.(text, step.duration);
  }

  update(dt: number) {
    if (!this.active) return;
    this.timer += dt * 1000;
    const step = this.steps[this.currentIndex];
    if (this.timer >= step.duration + 500) { // 500ms gap between steps
      this.timer = 0;
      this.currentIndex++;
      this.showCurrent();
    }
  }

  skip() {
    this.finish();
  }

  private finish() {
    this.active = false;
    this.completed = true;
    localStorage.setItem('neon-hockey-tutorial-done', 'true');
  }

  reset() {
    this.completed = false;
    localStorage.removeItem('neon-hockey-tutorial-done');
  }
}
