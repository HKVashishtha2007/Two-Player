/**
 * Pixel Football Showdown - Football Entity & Physics
 * 2.5D ball with height, shadow, bounces, spin, and retro pixel-art rendering.
 */

class Ball {
  constructor(x = 480, y = 330) {
    this.initialX = x;
    this.initialY = y;
    this.reset(x, y);

    this.radius = 7;
    this.mass = 1.0;
    this.gravity = 0.28;
    this.groundFriction = 0.982;
    this.airDrag = 0.994;
    this.bounceRestitution = 0.68;

    // Trail particles for power shots
    this.trail = [];
    this.lastKickedBy = null;
    this.inGoal = false;
  }

  reset(x = this.initialX, y = this.initialY) {
    this.x = x;
    this.y = y;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.rotation = 0;
    this.spin = 0;
    this.inGoal = false;
    this.trail = [];
    this.lastKickedBy = null;
  }

  /**
   * Applies kick impulse to the ball
   * @param {number} dirX - Normalized X direction
   * @param {number} dirY - Normalized Y direction
   * @param {number} power - Kick force
   * @param {number} lift - Vertical loft (Z)
   * @param {string} kickerId - Player id
   */
  kick(dirX, dirY, power, lift = 1.0, kickerId = null) {
    this.vx = dirX * power;
    this.vy = dirY * power;
    this.vz = Math.max(1.5, lift);
    this.spin = (dirX * 0.2 + (Math.random() - 0.5) * 0.1) * power;
    this.lastKickedBy = kickerId;
  }

  update(dt = 1) {
    // 1. Trail effect for fast balls
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 5.5 || this.z > 8) {
      this.trail.push({
        x: this.x,
        y: this.y - this.z,
        radius: this.radius * (0.8 + Math.min(0.4, speed / 15)),
        alpha: 0.5,
        color: speed > 10 ? '#ffea00' : '#ffffff'
      });
      if (this.trail.length > 8) {
        this.trail.shift();
      }
    } else if (this.trail.length > 0) {
      this.trail.shift();
    }

    // Decay trail
    for (let t of this.trail) {
      t.alpha *= 0.75;
    }

    // 2. Position updates
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    // 3. Vertical (Z) physics & bounces
    if (this.z > 0) {
      this.vz -= this.gravity * dt;
      this.vx *= this.airDrag;
      this.vy *= this.airDrag;
    } else {
      this.z = 0;
      if (Math.abs(this.vz) > 0.8) {
        this.vz = -this.vz * this.bounceRestitution;
        if (Math.abs(this.vz) > 1.2 && window.soundSystem) {
          window.soundSystem.playBounce(Math.min(1.0, Math.abs(this.vz) / 4));
        }
      } else {
        this.vz = 0;
      }
      // Turf rolling friction
      this.vx *= this.groundFriction;
      this.vy *= this.groundFriction;
    }

    // 4. Ball rotation
    this.rotation += (this.vx * 0.08 + this.spin * 0.05) * dt;

    // Stop near-zero velocities
    if (Math.abs(this.vx) < 0.04 && Math.abs(this.vy) < 0.04 && this.z === 0) {
      this.vx = 0;
      this.vy = 0;
      this.spin = 0;
    }
  }

  draw(ctx) {
    // 1. Draw motion trail
    for (let i = 0; i < this.trail.length; i++) {
      const tr = this.trail[i];
      if (tr.alpha > 0.05) {
        ctx.save();
        ctx.globalAlpha = tr.alpha * 0.6;
        ctx.fillStyle = tr.color;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, tr.radius * (i / this.trail.length), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. Draw ground shadow at (x, y)
    const shadowScale = Math.max(0.3, 1 - this.z / 140);
    const shadowAlpha = Math.max(0.12, 0.45 * (1 - this.z / 180));
    ctx.save();
    ctx.fillStyle = `rgba(10, 20, 10, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      this.x,
      this.y + 4,
      this.radius * shadowScale * 1.15,
      this.radius * shadowScale * 0.55,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 3. Draw pixel-art football at (x, y - z)
    const drawY = this.y - this.z;
    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.rotate(this.rotation);

    // Ball Base (Crisp White Circle with dark pixel outline)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Retro Pixel Soccer Ball Patches (Pentagon center and edges)
    ctx.fillStyle = '#111827';

    // Center pentagon
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * (this.radius * 0.42);
      const py = Math.sin(angle) * (this.radius * 0.42);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Outer patch spots
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = Math.cos(angle) * (this.radius * 0.78);
      const py = Math.sin(angle) * (this.radius * 0.78);

      ctx.beginPath();
      ctx.arc(px, py, this.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Connecting seams
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * (this.radius * 0.42), Math.sin(angle) * (this.radius * 0.42));
      ctx.lineTo(px, py);
      ctx.stroke();
    }

    // Ball specular highlight (retro 3D shine)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.Ball = Ball;
