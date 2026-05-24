// Daily Challenge system for Neon Hockey VR
// Generates a unique challenge each day based on the date seed

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  objective: string;
  rules: ChallengeRules;
  bonusMultiplier: number;
  icon: string;
}

export interface ChallengeRules {
  timeLimit?: number;       // seconds, 0 = unlimited
  targetScore?: number;     // score needed to win
  maxConceded?: number;     // max goals allowed
  noPowerUps?: boolean;     // disable power-ups
  bigPuck?: boolean;        // 1.5x puck size
  tinyMallet?: boolean;     // 0.7x player mallet
  fastPuck?: boolean;       // higher base puck speed
  noFriction?: boolean;     // puck doesn't slow down
  mirrorControls?: boolean; // inverted X axis
  difficulty: 'easy' | 'medium' | 'hard';
}

// Pool of challenge templates
const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  {
    title: 'Shutout Master',
    description: 'Win without conceding a single goal',
    objective: 'Win 7-0',
    rules: { targetScore: 7, maxConceded: 0, difficulty: 'medium' },
    bonusMultiplier: 2.0,
    icon: '🛡',
  },
  {
    title: 'Speed Demon',
    description: 'Score 5 goals in under 60 seconds',
    objective: 'Score 5 in 60s',
    rules: { targetScore: 5, timeLimit: 60, difficulty: 'easy' },
    bonusMultiplier: 1.8,
    icon: '⚡',
  },
  {
    title: 'Against the Odds',
    description: 'Beat the hard AI opponent',
    objective: 'Win on Hard',
    rules: { targetScore: 7, difficulty: 'hard' },
    bonusMultiplier: 2.5,
    icon: '🔥',
  },
  {
    title: 'Purist',
    description: 'Win a clean game with no power-up assistance',
    objective: 'Win without power-ups',
    rules: { targetScore: 7, noPowerUps: true, difficulty: 'medium' },
    bonusMultiplier: 1.5,
    icon: '✨',
  },
  {
    title: 'Big Puck Chaos',
    description: 'The puck is huge! Adapt your defense',
    objective: 'Win with big puck',
    rules: { targetScore: 7, bigPuck: true, difficulty: 'medium' },
    bonusMultiplier: 1.6,
    icon: '🟠',
  },
  {
    title: 'Tiny Mallet',
    description: 'Your mallet is shrunk — precision is key',
    objective: 'Win with tiny mallet',
    rules: { targetScore: 7, tinyMallet: true, difficulty: 'medium' },
    bonusMultiplier: 2.0,
    icon: '🔬',
  },
  {
    title: 'Hyper Hockey',
    description: 'The puck moves faster than ever',
    objective: 'Win with fast puck',
    rules: { targetScore: 7, fastPuck: true, difficulty: 'medium' },
    bonusMultiplier: 1.8,
    icon: '💨',
  },
  {
    title: 'Slippery Ice',
    description: 'No friction — the puck never slows down',
    objective: 'Win on slippery ice',
    rules: { targetScore: 5, noFriction: true, difficulty: 'easy' },
    bonusMultiplier: 2.0,
    icon: '🧊',
  },
  {
    title: 'Mirror Match',
    description: 'Controls are inverted — left is right!',
    objective: 'Win with mirrored controls',
    rules: { targetScore: 7, mirrorControls: true, difficulty: 'easy' },
    bonusMultiplier: 2.2,
    icon: '🪞',
  },
  {
    title: 'Blitz Mode',
    description: 'Score as many goals as possible in 45 seconds',
    objective: 'Score 8+ goals in 45s',
    rules: { targetScore: 8, timeLimit: 45, difficulty: 'easy' },
    bonusMultiplier: 2.0,
    icon: '⏱',
  },
  {
    title: 'Endurance',
    description: 'Win a long game against a tough opponent',
    objective: 'Win 10-0 or better',
    rules: { targetScore: 10, maxConceded: 3, difficulty: 'medium' },
    bonusMultiplier: 2.5,
    icon: '💪',
  },
  {
    title: 'Handicap Hero',
    description: 'Tiny mallet vs hard AI — ultimate test',
    objective: 'Win with handicap',
    rules: { targetScore: 5, tinyMallet: true, difficulty: 'hard' },
    bonusMultiplier: 3.0,
    icon: '🏆',
  },
  {
    title: 'Lightning Round',
    description: 'Score 3 goals in 30 seconds flat',
    objective: 'Score 3 in 30s',
    rules: { targetScore: 3, timeLimit: 30, difficulty: 'easy' },
    bonusMultiplier: 1.5,
    icon: '⚡',
  },
  {
    title: 'Fortress',
    description: 'Win while allowing at most 1 goal against you',
    objective: 'Win conceding ≤1',
    rules: { targetScore: 7, maxConceded: 1, difficulty: 'medium' },
    bonusMultiplier: 1.8,
    icon: '🏰',
  },
];

/** Simple seeded random from date string */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = (hash * 16807) % 2147483647;
    return (hash - 1) / 2147483646;
  };
}

export function getDailyChallenge(): DailyChallenge {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const rng = seededRandom(dateStr);
  const idx = Math.floor(rng() * CHALLENGE_TEMPLATES.length);
  const template = CHALLENGE_TEMPLATES[idx];
  return { ...template, id: `daily-${dateStr}` };
}

export function isDailyChallengeCompleted(): boolean {
  const challenge = getDailyChallenge();
  const completed = localStorage.getItem('neon-hockey-daily-completed');
  return completed === challenge.id;
}

export function completeDailyChallenge(): void {
  const challenge = getDailyChallenge();
  localStorage.setItem('neon-hockey-daily-completed', challenge.id);
  // Track streak
  const streakData = JSON.parse(localStorage.getItem('neon-hockey-daily-streak') || '{"streak":0,"lastDate":""}');
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streakData.lastDate === yesterday) {
    streakData.streak++;
  } else if (streakData.lastDate !== today) {
    streakData.streak = 1;
  }
  streakData.lastDate = today;
  localStorage.setItem('neon-hockey-daily-streak', JSON.stringify(streakData));
}

export function getDailyStreak(): number {
  const streakData = JSON.parse(localStorage.getItem('neon-hockey-daily-streak') || '{"streak":0,"lastDate":""}');
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streakData.lastDate === today || streakData.lastDate === yesterday) {
    return streakData.streak;
  }
  return 0;
}
