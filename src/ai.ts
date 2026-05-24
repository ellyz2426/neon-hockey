// Enhanced AI opponent system for Neon Hockey VR
// Features: prediction with wall bounces, personality, adaptive aggression,
// directional shot aim, defensive positioning, state machine

type AIState = 'defend' | 'attack' | 'intercept' | 'idle';

export class AISystem {
  private speed = 2.5;
  private reactionDelay = 0.1;
  private accuracy = 0.85;
  private aggressiveness = 0.3;
  private jitterAmount = 0.01;
  private thinkTimer = 0;
  private targetX = 0;
  private targetZ = -0.35;
  private decisionInterval = 0.15;

  // Adaptive difficulty
  private goalDifferential = 0; // player - cpu
  private adaptiveOffset = 0; // -0.2 to +0.2 modifier
  private baseAccuracy = 0.85;
  private baseSpeed = 2.5;

  // AI state machine
  private state: AIState = 'idle';
  private shotAimOffset = 0; // Offset for aiming shots at player goal edges
  private shotTimer = 0;

  // Personality
  private patience = 0.5; // 0 = always rushes, 1 = always waits
  private shotVariety = 0.5; // 0 = always center, 1 = random angles

  setDifficulty(diff: string) {
    switch (diff) {
      case 'easy':
        this.speed = 1.8;
        this.baseSpeed = 1.8;
        this.reactionDelay = 0.2;
        this.accuracy = 0.6;
        this.baseAccuracy = 0.6;
        this.aggressiveness = 0.15;
        this.jitterAmount = 0.03;
        this.decisionInterval = 0.25;
        this.patience = 0.7;
        this.shotVariety = 0.3;
        break;
      case 'medium':
        this.speed = 2.5;
        this.baseSpeed = 2.5;
        this.reactionDelay = 0.1;
        this.accuracy = 0.82;
        this.baseAccuracy = 0.82;
        this.aggressiveness = 0.35;
        this.jitterAmount = 0.012;
        this.decisionInterval = 0.15;
        this.patience = 0.5;
        this.shotVariety = 0.5;
        break;
      case 'hard':
        this.speed = 3.5;
        this.baseSpeed = 3.5;
        this.reactionDelay = 0.03;
        this.accuracy = 0.95;
        this.baseAccuracy = 0.95;
        this.aggressiveness = 0.55;
        this.jitterAmount = 0.005;
        this.decisionInterval = 0.08;
        this.patience = 0.3;
        this.shotVariety = 0.7;
        break;
    }
    this.goalDifferential = 0;
    this.adaptiveOffset = 0;
  }

  /** Notify AI of goal scored */
  onGoal(playerScored: boolean) {
    this.goalDifferential += playerScored ? 1 : -1;
    // Adaptive: if player is winning, AI gets slightly better
    if (this.goalDifferential > 2) {
      this.adaptiveOffset = Math.min(0.15, (this.goalDifferential - 2) * 0.03);
    } else if (this.goalDifferential < -2) {
      this.adaptiveOffset = Math.max(-0.1, (this.goalDifferential + 2) * 0.02);
    } else {
      this.adaptiveOffset = 0;
    }
    this.accuracy = Math.max(0.3, Math.min(0.98, this.baseAccuracy + this.adaptiveOffset));
    this.speed = this.baseSpeed * (1 + this.adaptiveOffset * 0.5);
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
    this.shotTimer += dt;

    if (this.thinkTimer < this.decisionInterval) {
      return { x: this.targetX, z: this.targetZ };
    }
    this.thinkTimer = 0;

    const halfW = tableW / 2 - malletR;
    const halfL = tableL / 2;

    const puckSpeed = Math.sqrt(puckVx * puckVx + puckVz * puckVz);
    const puckApproaching = puckVz < -0.1;
    const puckInCpuHalf = puckZ < 0;
    const puckNearGoal = puckZ < -halfL * 0.6;

    // Determine AI state
    if (puckNearGoal && puckApproaching) {
      this.state = 'defend';
    } else if (puckInCpuHalf && puckSpeed < 0.5) {
      this.state = 'attack';
    } else if (puckApproaching || puckInCpuHalf) {
      this.state = 'intercept';
    } else {
      this.state = 'idle';
    }

    switch (this.state) {
      case 'defend': {
        // Priority: block the goal
        const predX = this.predictPuckX(puckX, puckZ, puckVx, puckVz, halfW, halfL, -halfL + malletR);
        this.targetX = predX * this.accuracy + malletX * (1 - this.accuracy);
        this.targetZ = -halfL * 0.85; // Stay near goal
        break;
      }

      case 'attack': {
        // Move toward puck and try to shoot it toward player goal
        // Aim for edges of player goal for harder saves
        if (this.shotTimer > 2) {
          this.shotAimOffset = (Math.random() - 0.5) * this.shotVariety * 0.2;
          this.shotTimer = 0;
        }
        this.targetX = puckX + this.shotAimOffset;
        this.targetZ = Math.max(-halfL + malletR, puckZ - 0.08);
        break;
      }

      case 'intercept': {
        // Predict where puck will be and move to intercept
        const predX = this.predictPuckX(puckX, puckZ, puckVx, puckVz, halfW, halfL, malletZ);
        const shouldRush = this.aggressiveness > Math.random() && !puckNearGoal;

        if (shouldRush) {
          this.targetX = predX * this.accuracy + malletX * (1 - this.accuracy);
          this.targetZ = Math.max(-halfL + malletR, puckZ - 0.1);
        } else {
          this.targetX = predX * this.accuracy + malletX * (1 - this.accuracy);
          this.targetZ = -halfL * 0.55;
        }

        // Add inaccuracy jitter
        this.targetX += (Math.random() - 0.5) * this.jitterAmount * 2;
        break;
      }

      case 'idle': {
        // Return to defensive center with some drift
        const centerX = 0 + (Math.random() - 0.5) * 0.08;
        const centerZ = -halfL * 0.5;
        this.targetX = centerX;
        this.targetZ = centerZ;
        break;
      }
    }

    // Clamp
    this.targetX = Math.max(-halfW, Math.min(halfW, this.targetX));
    this.targetZ = Math.max(-halfL + malletR, Math.min(-0.05, this.targetZ));

    return { x: this.targetX, z: this.targetZ };
  }

  /** Predict where puck will reach a target Z position */
  private predictPuckX(
    px: number, pz: number, vx: number, vz: number,
    halfW: number, halfL: number, targetZ: number,
  ): number {
    let predX = px;
    let predZ = pz;
    let pvx = vx;
    let pvz = vz;

    const predDt = 0.015;
    const maxSteps = 60;

    for (let i = 0; i < maxSteps; i++) {
      predX += pvx * predDt;
      predZ += pvz * predDt;

      // Wall bounces
      if (predX < -halfW) { predX = -halfW; pvx = Math.abs(pvx); }
      if (predX > halfW) { predX = halfW; pvx = -Math.abs(pvx); }

      // Reached target Z?
      if (predZ <= targetZ) break;
      if (predZ >= halfL) break; // Player goal, won't reach us
    }

    return predX;
  }
}
