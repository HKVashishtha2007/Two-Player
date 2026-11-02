/**
 * Pixel Football Showdown - Player Entity & Pixel Art Renderer
 * Handles movement, stamina, sprint, kick charging, procedural pixel animations.
 */

class Player {
  constructor(config = {}) {
    this.id = config.id || 'p1';
    this.name = config.name || 'PLAYER 1';
    this.isHuman = config.isHuman !== undefined ? config.isHuman : true;

    this.x = config.x || 240;
    this.y = config.y || 330;
    this.startX = this.x;
    this.startY = this.y;

    this.vx = 0;
    this.vy = 0;
    this.radius = 13; // collision circle radius
    this.baseSpeed = 3.0;
    this.speedMultiplier = 1.0;
    this.sprintMultiplier = 1.45;

    // Direction and facing
    this.facingX = this.id === 'p1' ? 1 : -1;
    this.facingY = 0;

    // Visual Customizations
    this.primaryColor = config.primaryColor || (this.id === 'p1' ? '#1E88E5' : '#F5F5F5');
    this.secondaryColor = config.secondaryColor || '#FFFFFF';
    this.skinColor = config.skinColor || '#f6d8ae';
    this.hairColor = config.hairColor || '#2c1810';
    this.hairStyle = config.hairStyle || (this.id === 'p1' ? 'spiky' : 'headband');
    this.shortsColor = config.shortsColor || (this.id === 'p1' ? '#0d47a1' : '#212121');
    this.socksColor = config.socksColor || this.primaryColor;
    this.number = config.number || (this.id === 'p1' ? 10 : 7);

    // Gameplay States
    this.isSprinting = false;
    this.stamina = 100;
    this.kickCharging = false;
    this.kickCharge = 0.0;
    this.kickCooldown = 0;
    this.kickAnimationTicks = 0;
    this.celebrationTimer = 0;

    // Animation cycle
    this.animFrame = 0;
    this.animTimer = 0;

    // Match statistics
    this.stats = {
      shots: 0,
      shotsOnTarget: 0,
      possessionTicks: 0,
      saves: 0,
      tackles: 0
    };
  }

  reset(x = this.startX, y = this.startY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facingX = this.id === 'p1' ? 1 : -1;
    this.facingY = 0;
    this.isSprinting = false;
    this.stamina = 100;
    this.kickCharging = false;
    this.kickCharge = 0;
    this.kickCooldown = 0;
    this.kickAnimationTicks = 0;
    this.celebrationTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(input, dt = 1, ball = null) {
    if (this.celebrationTimer > 0) {
      this.celebrationTimer -= dt;
      this.vx = 0;
      this.vy = 0;
      this.animTimer += 0.2 * dt;
      return;
    }

    if (this.kickCooldown > 0) {
      this.kickCooldown -= dt;
    }
    if (this.kickAnimationTicks > 0) {
      this.kickAnimationTicks -= dt;
    }

    // Process Sprint & Stamina
    const wantsSprint = input.sprint && (input.moveX !== 0 || input.moveY !== 0);
    if (wantsSprint && this.stamina > 10) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - 0.7 * dt);
    } else {
      this.isSprinting = false;
      this.stamina = Math.min(100, this.stamina + 0.35 * dt);
    }

    // Speed calculation
    const currentSpeed = this.baseSpeed * this.speedMultiplier * (this.isSprinting ? this.sprintMultiplier : 1.0);

    // Normalize movement vector
    let mx = input.moveX || 0;
    let my = input.moveY || 0;
    const mag = Math.sqrt(mx * mx + my * my);

    if (mag > 0.001) {
      mx /= mag;
      my /= mag;
      this.vx = mx * currentSpeed;
      this.vy = my * currentSpeed;

      // Update facing orientation
      this.facingX = mx;
      this.facingY = my;

      // Advance running animation
      this.animTimer += (this.isSprinting ? 0.35 : 0.22) * dt;
      this.animFrame = Math.floor(this.animTimer) % 4;
    } else {
      // Decelerate when no input
      this.vx *= 0.7;
      this.vy *= 0.7;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
      if (Math.abs(this.vy) < 0.05) this.vy = 0;
      this.animFrame = 0;
    }

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Pitch constraint
    Physics.constrainPlayerToPitch(this);

    // Kick charging logic
    if (input.kick) {
      if (!this.kickCharging) {
        this.kickCharging = true;
        this.kickCharge = 0.05;
      } else {
        // Charge power up to 1.0 in ~0.55s
        this.kickCharge = Math.min(1.0, this.kickCharge + 0.032 * dt);
      }

      if (this.id === 'p1') {
        const touchFill = document.getElementById('touch-kick-charge');
        if (touchFill) touchFill.style.height = `${Math.round(this.kickCharge * 100)}%`;
      }
    } else {
      // Button was released: discharge kick!
      if (this.kickCharging) {
        this.dischargeKick(ball, this.kickCharge);
        this.kickCharging = false;
        this.kickCharge = 0;

        if (this.id === 'p1') {
          const touchFill = document.getElementById('touch-kick-charge');
          if (touchFill) touchFill.style.height = '0%';
        }
      }
    }

    // Automatic subtle dribbling push when walking into the ball
    if (ball && !this.kickCharging && this.kickCooldown <= 0) {
      this.handleBallDribble(ball);
    }
  }

  /**
   * Discharges a kick towards facing or goal direction
   */
  dischargeKick(ball, chargeRatio) {
    if (!ball || this.kickCooldown > 0) return;

    // Calculate distance to ball
    const dist = Physics.dist(this.x, this.y, ball.x, ball.y);
    const kickRange = this.radius + ball.radius + 14;

    if (dist <= kickRange && ball.z < 28) {
      this.kickAnimationTicks = 12; // Show kick pose
      this.kickCooldown = 15; // Prevent machine-gun kicking

      // Direction: blend facing direction with opponent goal direction
      const oppGoalX = this.id === 'p1' ? PITCH_GEOMETRY.pitchRight + 20 : PITCH_GEOMETRY.pitchLeft - 20;
      const oppGoalY = PITCH_GEOMETRY.centerY + (Math.random() - 0.5) * 50;

      let kx = this.facingX;
      let ky = this.facingY;

      // If nearly standing still, aim towards opponent goal
      if (Math.abs(kx) < 0.1 && Math.abs(ky) < 0.1) {
        const gdx = oppGoalX - this.x;
        const gdy = oppGoalY - this.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy) || 1;
        kx = gdx / gdist;
        ky = gdy / gdist;
      }

      // Normalize
      const kmag = Math.sqrt(kx * kx + ky * ky) || 1;
      kx /= kmag;
      ky /= kmag;

      // Calculate kick power
      // Normal tap kick: 8.5, Max charged shot: 16.5
      const power = 8.5 + chargeRatio * 8.5;
      const lift = 1.2 + chargeRatio * 4.8;

      ball.kick(kx, ky, power, lift, this.id);

      // Record shot stats
      this.stats.shots++;
      const isHeadingToGoal = (this.id === 'p1' && kx > 0.4) || (this.id === 'p2' && kx < -0.4);
      if (isHeadingToGoal) {
        this.stats.shotsOnTarget++;
      }

      // Play audio
      if (window.soundSystem) {
        window.soundSystem.playKick(chargeRatio);
      }
    }
  }

  /**
   * Smooth natural ball dribble when in contact
   */
  handleBallDribble(ball) {
    const col = Physics.checkCircleCollision(
      { x: this.x, y: this.y, radius: this.radius },
      { x: ball.x, y: ball.y, radius: ball.radius }
    );

    if (col.collided && ball.z < 18) {
      // Push ball forward in direction of player motion
      const pSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      let pushX = col.normalX;
      let pushY = col.normalY;

      if (pSpeed > 0.5) {
        pushX = this.vx / pSpeed;
        pushY = this.vy / pSpeed;
      }

      // Reposition ball outside overlap
      ball.x += col.normalX * col.overlap;
      ball.y += col.normalY * col.overlap;

      // Soft dribble impulse
      const dribbleSpeed = Math.max(pSpeed * 1.15, 2.8);
      ball.vx = pushX * dribbleSpeed;
      ball.vy = pushY * dribbleSpeed;
      ball.vz = Math.max(ball.vz, 0.4);
      ball.lastKickedBy = this.id;

      this.stats.possessionTicks++;
    }
  }

  /**
   * Draws the pixel-art player character on canvas
   */
  draw(ctx) {
    ctx.save();

    // 1. Drop shadow beneath feet
    ctx.fillStyle = 'rgba(12, 22, 12, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 6, this.radius * 1.15, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Base coordinates for pixel body
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Direction flip: default faces right; if facing left, mirror horizontally
    const faceLeft = this.facingX < -0.1;
    ctx.translate(px, py);
    if (faceLeft) {
      ctx.scale(-1, 1);
    }

    // Determine animation pose
    const isKicking = this.kickAnimationTicks > 0;
    const isCelebrating = this.celebrationTimer > 0;
    const isMoving = Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1;

    // Leg offsets based on 4-frame run cycle
    let legL_X = -4, legL_Y = 2;
    let legR_X = 2, legR_Y = 2;

    if (isKicking) {
      legR_X = 7; legR_Y = -1; // Kicking foot extended forward
      legL_X = -5; legL_Y = 3; // Plant foot behind
    } else if (isCelebrating) {
      legL_Y = -1; legR_Y = -1; // jumping
    } else if (isMoving) {
      const legOffsets = [
        { l: -4, r: 2 },
        { l: -2, r: 0 },
        { l: 2, r: -4 },
        { l: 0, r: -2 }
      ];
      const cur = legOffsets[this.animFrame] || { l: -3, r: 1 };
      legL_X = cur.l;
      legR_X = cur.r;
    }

    // --- LEGS & CLEATS ---
    // Left Leg / Cleat
    ctx.fillStyle = this.socksColor;
    ctx.fillRect(legL_X, legL_Y, 3, 5);
    ctx.fillStyle = '#111827'; // Black football cleat
    ctx.fillRect(legL_X - 1, legL_Y + 5, 5, 2);

    // Right Leg / Cleat
    ctx.fillStyle = this.socksColor;
    ctx.fillRect(legR_X, legR_Y, 3, 5);
    ctx.fillStyle = '#111827';
    ctx.fillRect(legR_X, legR_Y + 5, 5, 2);

    // --- SHORTS ---
    ctx.fillStyle = this.shortsColor;
    ctx.fillRect(-6, -4, 11, 7);
    ctx.fillStyle = '#000000'; // Belt / trim
    ctx.fillRect(-6, -5, 11, 1);

    // --- TORSO / JERSEY ---
    ctx.fillStyle = this.primaryColor;
    ctx.fillRect(-7, -15, 13, 11);

    // Team jersey secondary accent stripe
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-7, -11, 13, 2);

    // Black outline for retro pixel definition
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-7, -15, 13, 18);

    // Player squad number on back/chest
    ctx.fillStyle = this.secondaryColor;
    ctx.font = '6px monospace';
    ctx.fillText(`${this.number}`, -3, -7);

    // --- ARMS ---
    if (isCelebrating) {
      // Arms raised high in victory!
      ctx.fillStyle = this.skinColor;
      ctx.fillRect(-9, -21, 3, 7);
      ctx.fillRect(5, -21, 3, 7);
    } else {
      ctx.fillStyle = this.primaryColor; // Short sleeves
      ctx.fillRect(-9, -15, 3, 4);
      ctx.fillRect(5, -15, 3, 4);

      ctx.fillStyle = this.skinColor; // Forearms / hands
      const armSwing = isMoving ? (this.animFrame % 2 === 0 ? 2 : -2) : 0;
      ctx.fillRect(-9, -11 + armSwing, 3, 4);
      ctx.fillRect(5, -11 - armSwing, 3, 4);
    }

    // --- HEAD & FACE ---
    const headBob = isMoving ? (this.animFrame % 2 === 0 ? 1 : 0) : 0;
    const hy = -24 + headBob;

    // Face skin
    ctx.fillStyle = this.skinColor;
    ctx.fillRect(-5, hy, 10, 9);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-5, hy, 10, 9);

    // Retro pixel eyes
    ctx.fillStyle = '#111827';
    ctx.fillRect(1, hy + 3, 2, 2); // Front eye
    ctx.fillRect(-3, hy + 3, 2, 2); // Rear eye

    // Cute mouth / smile
    ctx.fillStyle = isCelebrating ? '#d90429' : '#111827';
    ctx.fillRect(0, hy + 6, 2, 1);

    // --- HAIR & ACCESSORIES ---
    ctx.fillStyle = this.hairColor;
    if (this.hairStyle === 'spiky') {
      ctx.fillRect(-6, hy - 4, 12, 4);
      ctx.fillRect(-4, hy - 6, 4, 2);
      ctx.fillRect(0, hy - 6, 4, 2);
    } else if (this.hairStyle === 'headband') {
      ctx.fillRect(-6, hy - 3, 12, 4);
      // Neon Headband!
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(-6, hy, 12, 2);
    } else {
      // Classic Afro / Curly
      ctx.fillRect(-7, hy - 4, 14, 5);
      ctx.fillRect(-7, hy, 2, 4);
    }

    ctx.restore();

    // --- OVERHEAD UI (Player Badge, Kick Charge Meter, Stamina) ---
    this.drawOverheadUI(ctx);
  }

  /**
   * Draws overhead tag and power shot charge bar
   */
  drawOverheadUI(ctx) {
    const ox = Math.round(this.x);
    const oy = Math.round(this.y - 32);

    // 1. Kick Charge Bar (when charging kick)
    if (this.kickCharging && this.kickCharge > 0.05) {
      const barW = 26;
      const barH = 5;
      const bx = ox - barW / 2;
      const by = oy - 8;

      // Background border
      ctx.fillStyle = '#000000';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

      // Color shifts from green -> yellow -> red
      let fillCol = '#22c55e';
      if (this.kickCharge > 0.65) fillCol = '#ef4444';
      else if (this.kickCharge > 0.35) fillCol = '#eab308';

      ctx.fillStyle = fillCol;
      ctx.fillRect(bx, by, barW * this.kickCharge, barH);
    }

    // 2. Overhead Player Marker (P1 / P2 / CPU)
    ctx.save();
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    let tagText = this.id === 'p1' ? 'P1' : (this.isHuman ? 'P2' : 'CPU');
    let tagColor = this.id === 'p1' ? '#38bdf8' : (this.isHuman ? '#f87171' : '#facc15');

    // Marker floating bounce
    const bounceY = oy - 2 + Math.sin(Date.now() * 0.008) * 1.5;

    // Text drop-shadow for retro pop
    ctx.fillStyle = '#000000';
    ctx.fillText(tagText, ox + 1, bounceY + 1);
    ctx.fillStyle = tagColor;
    ctx.fillText(tagText, ox, bounceY);

    // Little downward arrow
    ctx.beginPath();
    ctx.moveTo(ox - 3, bounceY + 2);
    ctx.lineTo(ox + 3, bounceY + 2);
    ctx.lineTo(ox, bounceY + 5);
    ctx.closePath();
    ctx.fillStyle = tagColor;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders a static preview on team select canvas
   */
  static renderPreview(canvas, primaryColor, secondaryColor, hairStyle, number, id = 'p1', showTag = false) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dummy = new Player({
      id: id,
      x: canvas.width / 2,
      y: canvas.height / 2 + 10,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      hairStyle: hairStyle,
      number: number
    });
    dummy.facingX = id === 'p1' ? 1 : -1;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    dummy.draw(ctx);
    ctx.restore();
  }
}

window.Player = Player;
