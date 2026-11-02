/**
 * Pixel Football Showdown - State-based AI Engine
 * Intelligent, fair, and fun football AI with 3 distinct difficulty profiles:
 * Easy, Medium, and Hard.
 */

class FootballAI {
  constructor(player, difficulty = 'medium') {
    this.player = player;
    this.difficulty = difficulty;

    // AI state machine
    this.state = 'DEFEND';
    this.stateTimer = 0;
    this.reactionTimer = 0;
    this.lastDecisionInput = { moveX: 0, moveY: 0, kick: false, sprint: false };

    // Charge state tracker
    this.isChargingKick = false;
    this.chargeDuration = 0;
    this.chargeTarget = 0;

    // Apply difficulty tuning
    this.applyDifficulty(difficulty);
  }

  applyDifficulty(diff) {
    this.difficulty = diff;
    switch (diff) {
      case 'easy':
        this.reactionDelay = 14; // ~230ms reaction lag
        this.predictionFrames = 5;
        this.shotAccuracy = 0.65;
        this.chargeChance = 0.2;
        this.defenseTetherX = 720; // Defends deep
        this.player.speedMultiplier = 0.78;
        break;

      case 'medium':
        this.reactionDelay = 7; // ~110ms reaction lag
        this.predictionFrames = 15;
        this.shotAccuracy = 0.88;
        this.chargeChance = 0.55;
        this.defenseTetherX = 640;
        this.player.speedMultiplier = 0.95;
        break;

      case 'hard':
        this.reactionDelay = 2; // ~30ms instant reaction
        this.predictionFrames = 26;
        this.shotAccuracy = 0.98;
        this.chargeChance = 0.85;
        this.defenseTetherX = 570;
        this.player.speedMultiplier = 1.05;
        break;
    }
  }

  /**
   * Evaluates pitch situation and returns input commands for the AI player
   * @param {Ball} ball
   * @param {Player} opponent
   * @returns {{ moveX: number, moveY: number, kick: boolean, sprint: boolean }}
   */
  think(ball, opponent) {
    const geom = PITCH_GEOMETRY;
    const p = this.player;

    // Reaction delay throttle to simulate human reflex
    this.reactionTimer++;
    if (this.reactionTimer < this.reactionDelay && this.lastDecisionInput) {
      // Continue executing last input, but handle active kick charging
      if (this.isChargingKick) {
        this.chargeDuration++;
        if (this.chargeDuration >= this.chargeTarget) {
          this.isChargingKick = false;
          return { ...this.lastDecisionInput, kick: false };
        }
        return { ...this.lastDecisionInput, kick: true };
      }
      return this.lastDecisionInput;
    }
    this.reactionTimer = 0;

    // 1. Predict future ball location based on velocity
    const predX = ball.x + ball.vx * this.predictionFrames;
    const predY = ball.y + ball.vy * this.predictionFrames;

    // Distances
    const distToBall = Physics.dist(p.x, p.y, ball.x, ball.y);
    const oppDistToBall = Physics.dist(opponent.x, opponent.y, ball.x, ball.y);
    const ownGoalX = geom.pitchRight;
    const ownGoalY = geom.centerY;
    const targetGoalX = geom.pitchLeft;
    const targetGoalY = geom.centerY;

    // In possession check (close to ball and facing target)
    const hasPossession = distToBall < p.radius + ball.radius + 14 && ball.z < 26;

    // Determine state
    // Emergency Clear: ball is deep in own penalty area
    if (ball.x > geom.penaltyRight.x && distToBall < 110) {
      this.state = 'CLEAR_DANGER';
    } else if (hasPossession) {
      // In shooting distance from opponent's goal?
      if (p.x < geom.centerX + 120) {
        this.state = 'SHOOT';
      } else {
        this.state = 'ATTACK';
      }
    } else if (distToBall < oppDistToBall + 40 || ball.x > geom.centerX - 50) {
      // Ball is reachable or on AI's half
      this.state = 'CHASE_BALL';
    } else {
      this.state = 'DEFEND';
    }

    let moveX = 0;
    let moveY = 0;
    let kick = false;
    let sprint = false;

    switch (this.state) {
      case 'CLEAR_DANGER': {
        // Run towards ball aggressively and boot it away
        const dx = ball.x - p.x;
        const dy = ball.y - p.y;
        moveX = dx;
        moveY = dy;
        sprint = true;

        if (distToBall < p.radius + ball.radius + 18) {
          kick = true;
        }
        break;
      }

      case 'SHOOT': {
        // Aim for corners of player's goal
        const targetCornerY = ball.y > geom.centerY ? geom.goalTop + 15 : geom.goalBottom - 15;
        const dx = targetGoalX - p.x;
        const dy = targetCornerY - p.y;

        moveX = dx;
        moveY = dy;

        if (this.difficulty === 'hard' && Math.random() < this.chargeChance && !this.isChargingKick) {
          this.isChargingKick = true;
          this.chargeDuration = 0;
          this.chargeTarget = 8 + Math.floor(Math.random() * 12);
          kick = true;
        } else {
          kick = true;
        }
        break;
      }

      case 'ATTACK': {
        // Dribble forward towards opponent's goal while zigzagging to avoid opponent
        let targetX = targetGoalX + 100;
        let targetY = geom.centerY;

        // Cut around defending opponent
        if (opponent.x < p.x && Math.abs(opponent.y - p.y) < 50) {
          targetY = opponent.y > geom.centerY ? geom.pitchTop + 60 : geom.pitchBottom - 60;
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        moveX = dx;
        moveY = dy;
        sprint = distToBall < 30 && p.stamina > 40;

        // Occasional tap kick or power drive if in range
        if (p.x < 420 && Math.random() < 0.25) {
          kick = true;
        }
        break;
      }

      case 'CHASE_BALL': {
        // Move towards intercept point of the ball
        let targetX = predX;
        let targetY = predY;

        // If ball is bouncing very high, wait under its landing spot
        if (ball.z > 35) {
          targetX = ball.x;
          targetY = ball.y;
        }

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        moveX = dx;
        moveY = dy;

        // Sprint when racing for the ball
        sprint = distToBall > 60 && p.stamina > 30;

        // Kick if within reach
        if (distToBall < p.radius + ball.radius + 12) {
          kick = true;
        }
        break;
      }

      case 'DEFEND':
      default: {
        // Position between ball and own goal
        const targetX = Math.min(this.defenseTetherX, (ball.x + ownGoalX) * 0.5);
        // Track ball Y but clamp to goal area
        const targetY = Physics.clamp(ball.y, geom.goalTop - 25, geom.goalBottom + 25);

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        moveX = dx;
        moveY = dy;

        // If opponent comes close with ball, challenge them!
        if (oppDistToBall < 25 && distToBall < 70) {
          moveX = ball.x - p.x;
          moveY = ball.y - p.y;
          sprint = true;
          if (distToBall < p.radius + ball.radius + 10) {
            kick = true;
          }
        }
        break;
      }
    }

    // Normalize movement vectors
    const mag = Math.sqrt(moveX * moveX + moveY * moveY);
    if (mag > 0.001) {
      moveX /= mag;
      moveY /= mag;
    } else {
      moveX = 0;
      moveY = 0;
    }

    this.lastDecisionInput = { moveX, moveY, kick, sprint };
    return this.lastDecisionInput;
  }
}

window.FootballAI = FootballAI;
