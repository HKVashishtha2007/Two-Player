/**
 * Pixel Football Showdown - Master Canvas Renderer
 * Renders the retro 16-bit stadium:
 * - Purple-blue pixel city skyline & starry night sky
 * - Drifting pixel clouds & stadium floodlights
 * - Brown wooden fence & cheering crowd
 * - Striped emerald green pitch & accurate white markings
 * - 2.5D goals with 3D mesh nets and post physics
 * - Confetti, particles, and retro screen shake
 */

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;   // 960
    this.height = canvas.height; // 540

    // Prevent blurry smoothing for authentic retro pixel aesthetic
    this.ctx.imageSmoothingEnabled = false;

    // Drifting clouds in skyline
    this.clouds = [
      { x: 50,  y: 25, speed: 0.15, width: 70, height: 18 },
      { x: 300, y: 40, speed: 0.22, width: 110, height: 24 },
      { x: 620, y: 20, speed: 0.18, width: 85, height: 20 },
      { x: 840, y: 45, speed: 0.25, width: 95, height: 22 }
    ];

    // Pre-generated skyline buildings (x, width, height, windowPattern)
    this.skylineBuildings = this._generateSkyline();

    // Spectator crowd bobbing along the fence
    this.crowd = this._generateCrowd();

    // Particle systems
    this.particles = [];
    this.confetti = [];

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.enableScreenShake = true;

    // Net vibration / ripple timers
    this.leftNetVibrate = 0;
    this.rightNetVibrate = 0;
  }

  _generateSkyline() {
    const buildings = [];
    let curX = 0;
    while (curX < 980) {
      const bWidth = 28 + Math.floor(Math.random() * 45);
      const bHeight = 45 + Math.floor(Math.random() * 65);
      const style = Math.floor(Math.random() * 3);
      buildings.push({
        x: curX,
        w: bWidth,
        h: bHeight,
        style: style,
        antenna: Math.random() < 0.4
      });
      curX += bWidth - 4; // slight overlap
    }
    return buildings;
  }

  _generateCrowd() {
    const crowd = [];
    const colors = ['#1e88e5', '#e53935', '#fdd835', '#43a047', '#f8f9fa', '#8e24aa', '#fb8c00'];
    const skinTones = ['#f6d8ae', '#dfa87a', '#a6724a', '#ffe0bd'];

    for (let x = 70; x < 890; x += 14) {
      crowd.push({
        x: x,
        shirtColor: colors[Math.floor(Math.random() * colors.length)],
        skinColor: skinTones[Math.floor(Math.random() * skinTones.length)],
        hasHat: Math.random() < 0.35,
        hatColor: colors[Math.floor(Math.random() * colors.length)],
        hasFlag: Math.random() < 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    return crowd;
  }

  triggerScreenShake(intensity = 6, duration = 14) {
    if (!this.enableScreenShake) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  spawnConfetti(count = 90) {
    const colors = ['#ff0055', '#ffea00', '#00f0ff', '#38b000', '#ffffff', '#ff7700', '#a855f7'];
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * this.width,
        y: -10 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        w: 4 + Math.random() * 4,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 180 + Math.random() * 120
      });
    }
  }

  spawnSparks(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.5,
        color: '#ffea00',
        life: 18 + Math.random() * 12
      });
    }
  }

  updateParticles() {
    // Confetti update
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx + Math.sin(c.life * 0.08) * 0.8;
      c.y += c.vy;
      c.rot += c.rotSpeed;
      c.life--;
      if (c.y > this.height || c.life <= 0) {
        this.confetti.splice(i, 1);
      }
    }

    // Spark particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Drifting clouds
    for (let cloud of this.clouds) {
      cloud.x += cloud.speed;
      if (cloud.x > this.width + 120) {
        cloud.x = -cloud.width - 20;
      }
    }

    // Net vibration damp
    if (this.leftNetVibrate > 0) this.leftNetVibrate--;
    if (this.rightNetVibrate > 0) this.rightNetVibrate--;

    // Screen shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  /**
   * Main Render Call
   */
  render(gameState, dt = 1) {
    const ctx = this.ctx;
    this.updateParticles();

    ctx.save();

    // 1. Screen Shake offset
    if (this.shakeDuration > 0 && this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    // 2. Render Background Elements (Sky, City Skyline, Floodlights, Fence, Crowd)
    this.renderStadiumBackground(ctx);

    // 3. Render Pitch Turf & Striping
    this.renderPitchTurf(ctx);

    // 4. Render Pitch White Markings
    this.renderPitchMarkings(ctx);

    // 5. Render Left and Right Goals (Back Nets & Posts)
    this.renderGoals(ctx);

    // 6. Render Players and Ball sorted by Y coordinate for correct 2.5D depth
    const entities = [
      gameState.player1,
      gameState.player2,
      gameState.ball
    ].filter(Boolean);

    entities.sort((a, b) => a.y - b.y);

    for (let entity of entities) {
      entity.draw(ctx);
    }

    // 7. Render Goal Crossbars & Front Posts (in front of ball/players if they are inside goal)
    this.renderGoalForeground(ctx);

    // 8. Render Corner Flags
    this.renderCornerFlags(ctx);

    // 9. Render Atmospheric Floodlight Beams
    this.renderFloodlightGlows(ctx);

    // 10. Render Particles & Confetti
    this.renderParticlesAndConfetti(ctx);

    ctx.restore();
  }

  /**
   * Stadium Skyline, Sky, Fence, and Crowd
   */
  renderStadiumBackground(ctx) {
    // 1. Sky Gradient: Twilight Indigo to Deep Purple
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 140);
    skyGrad.addColorStop(0, '#10142b');
    skyGrad.addColorStop(0.5, '#201844');
    skyGrad.addColorStop(1, '#3b1c5a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 145);

    // Pixel stars
    ctx.fillStyle = '#ffffff';
    const starCoords = [
      [35, 15], [110, 28], [240, 18], [380, 12], [510, 24],
      [640, 14], [750, 32], [880, 16], [920, 36], [180, 42]
    ];
    for (let s of starCoords) {
      const flicker = Math.sin(Date.now() * 0.005 + s[0]) > 0.2;
      if (flicker) {
        ctx.fillRect(s[0], s[1], 2, 2);
      }
    }

    // Drifting Pixel Clouds
    for (let c of this.clouds) {
      this.drawPixelCloud(ctx, c.x, c.y, c.width, c.height);
    }

    // 2. City Skyline: Distant Silhouettes
    ctx.fillStyle = '#181534';
    for (let b of this.skylineBuildings) {
      const topY = 142 - b.h;
      ctx.fillRect(b.x, topY, b.w, b.h);

      // Antenna on top
      if (b.antenna) {
        ctx.fillStyle = '#2d265a';
        ctx.fillRect(b.x + Math.floor(b.w / 2), topY - 12, 2, 12);
        // Blinking red beacon
        if (Math.sin(Date.now() * 0.004 + b.x) > 0) {
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(b.x + Math.floor(b.w / 2) - 1, topY - 14, 4, 3);
        }
        ctx.fillStyle = '#181534';
      }

      // Lit Windows
      const winCols = Math.floor(b.w / 8);
      const winRows = Math.floor((b.h - 16) / 10);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          const pseudoHash = (b.x * 13 + r * 7 + c * 17) % 10;
          if (pseudoHash > 4) {
            ctx.fillStyle = pseudoHash > 8 ? '#ffea00' : (pseudoHash > 6 ? '#00f0ff' : '#ffa07a');
            ctx.fillRect(b.x + 4 + c * 7, topY + 8 + r * 8, 3, 4);
          }
        }
      }
      ctx.fillStyle = '#181534';
    }

    // 3. Floodlight Towers (Far Left & Far Right)
    this.drawFloodlightTower(ctx, 40, 140);
    this.drawFloodlightTower(ctx, 920, 140);

    // 4. Spectator Crowd along fence
    const crowdTime = Date.now() * 0.007;
    for (let spec of this.crowd) {
      const bobY = Math.sin(crowdTime + spec.phase) > 0.4 ? -2 : 0;
      const cy = 138 + bobY;

      // Shirt
      ctx.fillStyle = spec.shirtColor;
      ctx.fillRect(spec.x - 4, cy - 6, 8, 8);

      // Head
      ctx.fillStyle = spec.skinColor;
      ctx.fillRect(spec.x - 3, cy - 12, 6, 6);

      // Hat
      if (spec.hasHat) {
        ctx.fillStyle = spec.hatColor;
        ctx.fillRect(spec.x - 4, cy - 14, 8, 3);
      }

      // Waving Flag
      if (spec.hasFlag) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(spec.x + 4, cy - 18, 1, 14); // flagpole
        ctx.fillStyle = spec.shirtColor;
        const wave = Math.sin(crowdTime * 2 + spec.phase) * 2;
        ctx.fillRect(spec.x + 5, cy - 18 + wave, 6, 4);
      }
    }

    // 5. Brown Wooden Fence behind pitch
    this.renderWoodenFence(ctx, 0, 140, this.width, 18);
  }

  drawPixelCloud(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(78, 56, 115, 0.45)';
    ctx.fillRect(x + 10, y + 4, w - 20, h - 4);
    ctx.fillRect(x + 4, y + 8, w - 8, h - 8);
    ctx.fillStyle = 'rgba(110, 84, 158, 0.55)';
    ctx.fillRect(x + 14, y + 6, w - 30, h - 8);
    ctx.restore();
  }

  drawFloodlightTower(ctx, x, groundY) {
    ctx.save();
    ctx.strokeStyle = '#2d334d';
    ctx.lineWidth = 2;

    // Metal truss mast
    ctx.beginPath();
    ctx.moveTo(x - 8, groundY);
    ctx.lineTo(x - 4, 30);
    ctx.lineTo(x + 4, 30);
    ctx.lineTo(x + 8, groundY);
    ctx.stroke();

    // Cross braces
    for (let y = 45; y < groundY; y += 22) {
      ctx.beginPath();
      ctx.moveTo(x - 7, y);
      ctx.lineTo(x + 7, y);
      ctx.stroke();
    }

    // Light head fixture
    ctx.fillStyle = '#1a1f33';
    ctx.fillRect(x - 14, 22, 28, 10);

    // Glowing bulb array
    ctx.fillStyle = '#fff4cc';
    for (let i = -10; i <= 10; i += 7) {
      ctx.fillRect(x + i, 24, 4, 6);
    }
    ctx.restore();
  }

  renderWoodenFence(ctx, x, y, width, height) {
    ctx.save();
    // Fence base horizontal beam
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(x, y + 4, width, 6);
    ctx.fillRect(x, y + 11, width, 4);

    // Vertical wooden fence planks
    const plankWidth = 10;
    for (let px = x; px < width; px += plankWidth + 2) {
      ctx.fillStyle = (px % 4 === 0) ? '#734828' : '#85532f';
      ctx.fillRect(px, y, plankWidth, height);

      // Plank top pointed tip
      ctx.fillStyle = '#613c22';
      ctx.fillRect(px + 1, y - 2, plankWidth - 2, 2);

      // Plank woodgrain shadow & nails
      ctx.fillStyle = '#422817';
      ctx.fillRect(px, y, 1, height);
      ctx.fillRect(px + plankWidth - 1, y, 1, height);
      ctx.fillRect(px + 4, y + 6, 2, 2); // nail
      ctx.fillRect(px + 4, y + 13, 2, 2); // nail
    }
    ctx.restore();
  }

  /**
   * Vibrant Green Grass Turf with Alternating Mowed Stripes
   */
  renderPitchTurf(ctx) {
    const geom = PITCH_GEOMETRY;

    // Pitch surrounding border / apron
    ctx.fillStyle = '#267300';
    ctx.fillRect(0, geom.pitchTop - 2, this.width, geom.pitchBottom - geom.pitchTop + 36);

    // Playable turf area with vertical emerald green stripes
    const stripeWidth = 53;
    const colorLight = '#38b000';
    const colorDark  = '#2d8a00';

    let isLight = true;
    for (let x = geom.pitchLeft; x < geom.pitchRight; x += stripeWidth) {
      const sw = Math.min(stripeWidth, geom.pitchRight - x);
      ctx.fillStyle = isLight ? colorLight : colorDark;
      ctx.fillRect(x, geom.pitchTop, sw, geom.pitchBottom - geom.pitchTop);
      isLight = !isLight;
    }
  }

  /**
   * White Markings on the Pitch
   */
  renderPitchMarkings(ctx) {
    const geom = PITCH_GEOMETRY;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.5;

    // 1. Outer Touchlines & Goal lines
    ctx.strokeRect(geom.pitchLeft, geom.pitchTop, geom.pitchRight - geom.pitchLeft, geom.pitchBottom - geom.pitchTop);

    // 2. Halfway Line
    ctx.beginPath();
    ctx.moveTo(geom.centerX, geom.pitchTop);
    ctx.lineTo(geom.centerX, geom.pitchBottom);
    ctx.stroke();

    // 3. Center Circle & Center Spot
    ctx.beginPath();
    ctx.arc(geom.centerX, geom.centerY, geom.centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(geom.centerX, geom.centerY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Left Penalty Box & 6-Yard Box
    ctx.strokeRect(geom.penaltyLeft.x, geom.penaltyLeft.y, geom.penaltyLeft.w, geom.penaltyLeft.h);
    ctx.strokeRect(geom.sixYardLeft.x, geom.sixYardLeft.y, geom.sixYardLeft.w, geom.sixYardLeft.h);

    // Left Penalty Spot
    ctx.beginPath();
    ctx.arc(geom.pitchLeft + 100, geom.centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Left Penalty Arc (D-box)
    ctx.beginPath();
    ctx.arc(geom.pitchLeft + 100, geom.centerY, 40, -0.65, 0.65);
    ctx.stroke();

    // 5. Right Penalty Box & 6-Yard Box
    ctx.strokeRect(geom.penaltyRight.x, geom.penaltyRight.y, geom.penaltyRight.w, geom.penaltyRight.h);
    ctx.strokeRect(geom.sixYardRight.x, geom.sixYardRight.y, geom.sixYardRight.w, geom.sixYardRight.h);

    // Right Penalty Spot
    ctx.beginPath();
    ctx.arc(geom.pitchRight - 100, geom.centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Penalty Arc (D-box)
    ctx.beginPath();
    ctx.arc(geom.pitchRight - 100, geom.centerY, 40, Math.PI - 0.65, Math.PI + 0.65);
    ctx.stroke();

    // 6. Corner Arcs
    const cornerR = 12;
    // Top-Left
    ctx.beginPath(); ctx.arc(geom.pitchLeft, geom.pitchTop, cornerR, 0, Math.PI / 2); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.arc(geom.pitchLeft, geom.pitchBottom, cornerR, -Math.PI / 2, 0); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.arc(geom.pitchRight, geom.pitchTop, cornerR, Math.PI / 2, Math.PI); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.arc(geom.pitchRight, geom.pitchBottom, cornerR, Math.PI, Math.PI * 1.5); ctx.stroke();

    ctx.restore();
  }

  /**
   * 2.5D Goals: Back Mesh Nets, Goal Frames, and Depths
   */
  renderGoals(ctx) {
    const geom = PITCH_GEOMETRY;

    // --- LEFT GOAL ---
    ctx.save();
    // Left Net Interior Grass (darker shade due to net shadow)
    ctx.fillStyle = '#1e5e00';
    ctx.fillRect(geom.leftGoal.backX, geom.leftGoal.topY, geom.leftGoal.frontX - geom.leftGoal.backX, geom.leftGoal.bottomY - geom.leftGoal.topY);

    // Left Net Diamond/Grid Pattern with vibration
    const vibL = this.leftNetVibrate > 0 ? (Math.random() - 0.5) * 2 : 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1;

    // Horizontal net lines
    for (let y = geom.leftGoal.topY; y <= geom.leftGoal.bottomY; y += 8) {
      ctx.beginPath();
      ctx.moveTo(geom.leftGoal.backX + vibL, y);
      ctx.lineTo(geom.leftGoal.frontX, y);
      ctx.stroke();
    }
    // Vertical net lines
    for (let x = geom.leftGoal.backX; x <= geom.leftGoal.frontX; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x + vibL, geom.leftGoal.topY);
      ctx.lineTo(x, geom.leftGoal.bottomY);
      ctx.stroke();
    }

    // Left Goal back frame posts
    ctx.strokeStyle = '#2b3652';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(geom.leftGoal.backX, geom.leftGoal.topY, geom.leftGoal.frontX - geom.leftGoal.backX, geom.leftGoal.bottomY - geom.leftGoal.topY);
    ctx.restore();

    // --- RIGHT GOAL ---
    ctx.save();
    // Right Net Interior Grass
    ctx.fillStyle = '#1e5e00';
    ctx.fillRect(geom.rightGoal.frontX, geom.rightGoal.topY, geom.rightGoal.backX - geom.rightGoal.frontX, geom.rightGoal.bottomY - geom.rightGoal.topY);

    // Right Net Diamond/Grid Pattern with vibration
    const vibR = this.rightNetVibrate > 0 ? (Math.random() - 0.5) * 2 : 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1;

    for (let y = geom.rightGoal.topY; y <= geom.rightGoal.bottomY; y += 8) {
      ctx.beginPath();
      ctx.moveTo(geom.rightGoal.frontX, y);
      ctx.lineTo(geom.rightGoal.backX + vibR, y);
      ctx.stroke();
    }
    for (let x = geom.rightGoal.frontX; x <= geom.rightGoal.backX; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, geom.rightGoal.topY);
      ctx.lineTo(x + vibR, geom.rightGoal.bottomY);
      ctx.stroke();
    }

    // Right Goal back frame
    ctx.strokeStyle = '#2b3652';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(geom.rightGoal.frontX, geom.rightGoal.topY, geom.rightGoal.backX - geom.rightGoal.frontX, geom.rightGoal.bottomY - geom.rightGoal.topY);
    ctx.restore();
  }

  /**
   * Goal Foreground (Front white posts, vertical beams, crossbar, and back support struts)
   */
  renderGoalForeground(ctx) {
    const geom = PITCH_GEOMETRY;
    const barZ = geom.goalCrossbarZ; // 42px height in Z
    ctx.save();

    // Helper to draw realistic 2.5D goal structure
    const drawGoalStructure = (frontX, backX, topY, bottomY, isLeft) => {
      // 1. Post ground base shadows
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(frontX, topY + 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(frontX, bottomY + 2, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Diagonal support struts extending into net
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(frontX, topY - barZ);
      ctx.lineTo(backX, topY);
      ctx.moveTo(frontX, bottomY - barZ);
      ctx.lineTo(backX, bottomY);
      ctx.stroke();

      // 3. Upright vertical posts (from turf up to crossbar height)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(frontX, topY);
      ctx.lineTo(frontX, topY - barZ);
      ctx.moveTo(frontX, bottomY);
      ctx.lineTo(frontX, bottomY - barZ);
      ctx.stroke();

      // Outlines for posts
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.strokeRect(frontX - 2.5, topY - barZ, 5, barZ);
      ctx.strokeRect(frontX - 2.5, bottomY - barZ, 5, barZ);

      // 4. Horizontal Crossbar (connecting top of posts)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(frontX, topY - barZ);
      ctx.lineTo(frontX, bottomY - barZ);
      ctx.stroke();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(frontX - 2.5, topY - barZ, 5, bottomY - topY);

      // 5. Post circular caps
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;
      [
        [frontX, topY - barZ],
        [frontX, bottomY - barZ],
        [frontX, topY],
        [frontX, bottomY]
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    };

    // Draw Left Goal (attacks to right)
    drawGoalStructure(geom.leftGoal.frontX, geom.leftGoal.backX, geom.leftGoal.topY, geom.leftGoal.bottomY, true);

    // Draw Right Goal (attacks to left)
    drawGoalStructure(geom.rightGoal.frontX, geom.rightGoal.backX, geom.rightGoal.topY, geom.rightGoal.bottomY, false);

    ctx.restore();
  }

  /**
   * Corner Flags with waving flutter animation
   */
  renderCornerFlags(ctx) {
    const geom = PITCH_GEOMETRY;
    const time = Date.now() * 0.008;
    const corners = [
      { x: geom.pitchLeft, y: geom.pitchTop },
      { x: geom.pitchLeft, y: geom.pitchBottom },
      { x: geom.pitchRight, y: geom.pitchTop },
      { x: geom.pitchRight, y: geom.pitchBottom }
    ];

    ctx.save();
    for (let c of corners) {
      // Staff
      ctx.strokeStyle = '#f8f9fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x, c.y - 12);
      ctx.stroke();

      // Waving pennant flag
      const flutter = Math.sin(time + c.x) * 2;
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - 12);
      ctx.lineTo(c.x + 8, c.y - 8 + flutter);
      ctx.lineTo(c.x, c.y - 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Volumetric Floodlight Cones casting soft warmth onto the pitch
   */
  renderFloodlightGlows(ctx) {
    ctx.save();
    // Left beam
    const leftBeam = ctx.createRadialGradient(40, 30, 10, 240, 330, 420);
    leftBeam.addColorStop(0, 'rgba(255, 244, 180, 0.09)');
    leftBeam.addColorStop(1, 'rgba(255, 244, 180, 0)');
    ctx.fillStyle = leftBeam;
    ctx.fillRect(0, 0, this.width, this.height);

    // Right beam
    const rightBeam = ctx.createRadialGradient(920, 30, 10, 720, 330, 420);
    rightBeam.addColorStop(0, 'rgba(255, 244, 180, 0.09)');
    rightBeam.addColorStop(1, 'rgba(255, 244, 180, 0)');
    ctx.fillStyle = rightBeam;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  /**
   * Particles & Confetti Rendering
   */
  renderParticlesAndConfetti(ctx) {
    ctx.save();
    // 1. Confetti
    for (let c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }

    // 2. Sparks
    for (let p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    }
    ctx.restore();
  }
}

window.Renderer = Renderer;
