// AI opponent system for Neon Hockey VR

export class AISystem {
  private speed = 2.5;
  private reactionDelay = 0.1;
  private accuracy = 0.85;
  private aggressiveness = 0.3;
  private jitterAmount = 0.01;
  private thinkTimer = 0;
  private targetX = 0;
  private targetZ = -0.35;
  private lastDecisionTime = 0;
  private decisionInterval = 0.15;

  setDifficulty(diff: string) {
    switch (diff) {
      case 'easy':
        this.speed = 1.8;
        this.reactionDelay = 0.2;
        this.accuracy = 0.65;
        this.aggressiveness = 0.15;
        this.jitterAmount = 0.025;
        this.decisionInterval = 0.25;
        break;
      case 'medium':
        this.speed = 2.5;
        this.reactionDelay = 0.1;
        this.accuracy = 0.82;
        this.aggressiveness = 0.35;
        this.jitterAmount = 0.012;
        this.decisionInterval = 0.15;
        break;
      case 'hard':
        this.speed = 3.5;
        this.reactionDelay = 0.03;
        this.accuracy = 0.95;
        this.aggressiveness = 0.55;
        this.jitterAmount = 0.005;
        this.decisionInterval = 0.08;
        break;
    }
  }

  update(
    dt: number,
    puckX: number, puckZ: number,
    puckVx: number, puckVz: number,
    malletX: number, malletZ: number,
    tableW: number, tableL: number,
    malletR: number,
  ): { x: number; z: number } {
    this.thinkTimer += dt;
    if (this.thinkTimer < this.decisionInterval) {
      return { x: this.targetX, z: this.targetZ };
    }
    this.thinkTimer = 0;

    const halfW = tableW / 2 - malletR;
    const halfL = tableL / 2;

    // Puck coming toward CPU?
    const puckApproaching = puckVz < -0.1;
    const puckInCpuHalf = puckZ < 0;

    if (puckApproaching || puckInCpuHalf) {
      // Predict where puck will be
      let predX = puckX;
      let predZ = puckZ;
      let vx = puckVx;
      let vz = puckVz;

      // Simple prediction with wall bounces
      const predSteps = 30;
      const predDt = 0.02;
      for (let i = 0; i < predSteps; i++) {
        predX += vx * predDt;
        predZ += vz * predDt;
        if (predX < -halfW) { predX = -halfW; vx = Math.abs(vx); }
        if (predX > halfW) { predX = halfW; vx = -Math.abs(vx); }
        if (predZ < -halfL) break;
      }

      // Add inaccuracy
      predX += (Math.random() - 0.5) * this.jitterAmount * 2;

      // Go offensive or defensive
      if (puckInCpuHalf && this.aggressiveness > Math.random()) {
        // Aggressive — move toward puck to hit it back
        this.targetX = predX * this.accuracy + malletX * (1 - this.accuracy);
        this.targetZ = Math.max(-halfL + malletR, predZ - 0.1);
      } else {
        // Defensive — stay back, track puck X
        this.targetX = predX * this.accuracy + malletX * (1 - this.accuracy);
        this.targetZ = -halfL * 0.65;
      }
    } else {
      // Puck in player half going away — return to center defense
      this.targetX = 0 + (Math.random() - 0.5) * 0.05;
      this.targetZ = -halfL * 0.6;
    }

    // Clamp
    this.targetX = Math.max(-halfW, Math.min(halfW, this.targetX));
    this.targetZ = Math.max(-halfL + malletR, Math.min(-0.05, this.targetZ));

    return { x: this.targetX, z: this.targetZ };
  }
}
