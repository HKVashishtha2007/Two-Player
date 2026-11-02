/**
 * Pixel Football Showdown - Physics & Collision Engine
 * Provides pitch boundaries, goal geometry, vector math, and collision detection.
 */

const PITCH_GEOMETRY = {
  // Pitch outer and inner coordinates in 960x540 canvas space
  canvasWidth: 960,
  canvasHeight: 540,

  // Playable field boundary
  pitchLeft: 56,
  pitchRight: 904,
  pitchTop: 155,
  pitchBottom: 505,

  // Center coordinates
  centerX: 480,
  centerY: 330,
  centerCircleRadius: 65,

  // Goals
  goalTop: 270,
  goalBottom: 390,
  goalHeight: 120, // difference between bottom and top
  goalDepth: 42,
  goalCrossbarZ: 42, // Height of the crossbar in Z axis
  postRadius: 5,

  // Left Goal Box
  leftGoal: {
    backX: 14,
    frontX: 56,
    topY: 270,
    bottomY: 390,
    topPost: { x: 56, y: 270, r: 5 },
    bottomPost: { x: 56, y: 390, r: 5 }
  },

  // Right Goal Box
  rightGoal: {
    backX: 946,
    frontX: 904,
    topY: 270,
    bottomY: 390,
    topPost: { x: 904, y: 270, r: 5 },
    bottomPost: { x: 904, y: 390, r: 5 }
  },

  // Penalty areas
  penaltyLeft: { x: 56, y: 220, w: 140, h: 220 },
  penaltyRight: { x: 764, y: 220, w: 140, h: 220 },
  sixYardLeft: { x: 56, y: 275, w: 55, h: 110 },
  sixYardRight: { x: 849, y: 275, w: 55, h: 110 },
};

class Physics {
  /**
   * Distance between two 2D points
   */
  static dist(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Clamp a value between min and max
   */
  static clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /**
   * Circle vs Circle collision detection and resolution
   */
  static checkCircleCollision(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = c1.radius + c2.radius;

    if (dist < minDist && dist > 0.0001) {
      // Overlap amount
      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;

      return {
        collided: true,
        normalX: nx,
        normalY: ny,
        overlap: overlap,
        dist: dist
      };
    }
    return { collided: false };
  }

  /**
   * Circle vs Point / Post collision
   */
  static checkCirclePointCollision(cx, cy, cr, px, py, pr = 0) {
    const dx = cx - px;
    const dy = cy - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = cr + pr;

    if (dist < minDist && dist > 0.0001) {
      return {
        collided: true,
        normalX: dx / dist,
        normalY: dy / dist,
        overlap: minDist - dist
      };
    }
    return { collided: false };
  }

  /**
   * Keep player inside pitch bounds
   */
  static constrainPlayerToPitch(player) {
    const r = player.radius;
    const geom = PITCH_GEOMETRY;

    // Disallow leaving pitch playing area
    if (player.x - r < geom.pitchLeft) {
      player.x = geom.pitchLeft + r;
      player.vx = 0;
    } else if (player.x + r > geom.pitchRight) {
      player.x = geom.pitchRight - r;
      player.vx = 0;
    }

    if (player.y - r < geom.pitchTop) {
      player.y = geom.pitchTop + r;
      player.vy = 0;
    } else if (player.y + r > geom.pitchBottom) {
      player.y = geom.pitchBottom - r;
      player.vy = 0;
    }
  }

  /**
   * Resolve ball collisions with pitch borders, wooden fence, goalposts, and nets
   */
  static handleBallBoundariesAndGoals(ball, onPostHit, onNetHit, onGoal) {
    const geom = PITCH_GEOMETRY;
    const r = ball.radius;

    // 1. Goalpost Collisions (Left Goal top & bottom posts, Right Goal top & bottom posts)
    const posts = [
      geom.leftGoal.topPost,
      geom.leftGoal.bottomPost,
      geom.rightGoal.topPost,
      geom.rightGoal.bottomPost
    ];

    for (let post of posts) {
      const col = Physics.checkCirclePointCollision(ball.x, ball.y, r, post.x, post.y, post.r);
      // Only hit post if ball is below crossbar height
      if (col.collided && ball.z <= geom.goalCrossbarZ + 8) {
        // Push ball out
        ball.x += col.normalX * col.overlap;
        ball.y += col.normalY * col.overlap;

        // Reflect velocity with bounce restitution
        const dot = ball.vx * col.normalX + ball.vy * col.normalY;
        if (dot < 0) {
          ball.vx -= 1.8 * dot * col.normalX;
          ball.vy -= 1.8 * dot * col.normalY;
        }

        // Add little vertical pop and spin
        ball.vz = Math.max(1.5, ball.vz * 0.7);

        if (onPostHit) onPostHit(post.x, post.y);
      }
    }

    // 1b. Horizontal Crossbar Collision check (ball hits the bar at crossbar height)
    // Left goal line crossbar
    if (Math.abs(ball.x - geom.pitchLeft) < r + 4 && ball.y >= geom.goalTop && ball.y <= geom.goalBottom) {
      if (Math.abs(ball.z - geom.goalCrossbarZ) < 7) {
        ball.vz = -Math.abs(ball.vz) * 0.75;
        ball.vx = Math.abs(ball.vx) * 0.8; // Bounce right back into field
        if (onPostHit) onPostHit(geom.pitchLeft, ball.y);
      }
    }
    // Right goal line crossbar
    if (Math.abs(ball.x - geom.pitchRight) < r + 4 && ball.y >= geom.goalTop && ball.y <= geom.goalBottom) {
      if (Math.abs(ball.z - geom.goalCrossbarZ) < 7) {
        ball.vz = -Math.abs(ball.vz) * 0.75;
        ball.vx = -Math.abs(ball.vx) * 0.8; // Bounce left back into field
        if (onPostHit) onPostHit(geom.pitchRight, ball.y);
      }
    }

    // 2. Goal Net and Goal Line checks
    // Left Goal area check
    if (ball.x < geom.pitchLeft) {
      // Is inside goal mouth vertical bounds?
      if (ball.y >= geom.goalTop && ball.y <= geom.goalBottom) {
        // Goal scored for Right Team (Team 2)!
        if (!ball.inGoal && ball.x < geom.pitchLeft - 10 && ball.z < geom.goalCrossbarZ) {
          ball.inGoal = true;
          if (onGoal) onGoal('p2'); // Player 2 scores in left goal
        }

        // Net containment
        if (ball.x - r < geom.leftGoal.backX) {
          ball.x = geom.leftGoal.backX + r;
          ball.vx = -ball.vx * 0.25;
          if (onNetHit) onNetHit();
        }
        if (ball.y - r < geom.goalTop) {
          ball.y = geom.goalTop + r;
          ball.vy = -ball.vy * 0.3;
        } else if (ball.y + r > geom.goalBottom) {
          ball.y = geom.goalBottom - r;
          ball.vy = -ball.vy * 0.3;
        }
        // Damping inside the net
        ball.vx *= 0.88;
        ball.vy *= 0.88;
      } else {
        // Outside goal mouth: bounce off end line
        ball.x = geom.pitchLeft + r;
        ball.vx = -ball.vx * 0.7;
        ball.spin *= -0.5;
        if (window.soundSystem) window.soundSystem.playBounce(0.5);
      }
    }

    // Right Goal area check
    if (ball.x > geom.pitchRight) {
      if (ball.y >= geom.goalTop && ball.y <= geom.goalBottom) {
        // Goal scored for Left Team (Team 1)!
        if (!ball.inGoal && ball.x > geom.pitchRight + 10 && ball.z < geom.goalCrossbarZ) {
          ball.inGoal = true;
          if (onGoal) onGoal('p1'); // Player 1 scores in right goal
        }

        // Net containment
        if (ball.x + r > geom.rightGoal.backX) {
          ball.x = geom.rightGoal.backX - r;
          ball.vx = -ball.vx * 0.25;
          if (onNetHit) onNetHit();
        }
        if (ball.y - r < geom.goalTop) {
          ball.y = geom.goalTop + r;
          ball.vy = -ball.vy * 0.3;
        } else if (ball.y + r > geom.goalBottom) {
          ball.y = geom.goalBottom - r;
          ball.vy = -ball.vy * 0.3;
        }
        ball.vx *= 0.88;
        ball.vy *= 0.88;
      } else {
        // Outside goal mouth: bounce off end line
        ball.x = geom.pitchRight - r;
        ball.vx = -ball.vx * 0.7;
        ball.spin *= -0.5;
        if (window.soundSystem) window.soundSystem.playBounce(0.5);
      }
    }

    // 3. Top Wooden Fence boundary
    if (ball.y - r < geom.pitchTop) {
      ball.y = geom.pitchTop + r;
      ball.vy = Math.abs(ball.vy) * 0.75; // Bounce downwards
      if (Math.abs(ball.vy) > 0.8 && window.soundSystem) {
        window.soundSystem.playBounce(0.6);
      }
    }

    // 4. Bottom Sideline boundary
    if (ball.y + r > geom.pitchBottom) {
      ball.y = geom.pitchBottom - r;
      ball.vy = -Math.abs(ball.vy) * 0.75; // Bounce upwards
      if (Math.abs(ball.vy) > 0.8 && window.soundSystem) {
        window.soundSystem.playBounce(0.6);
      }
    }
  }
}

window.Physics = Physics;
window.PITCH_GEOMETRY = PITCH_GEOMETRY;
