  // --- REVAMPED ZERO-ALLOCATION PARTICLE POOL ENGINE (SUBPHASE A.1) ---
  window.particles = window.particles || [];
  window.ParticlePool = {
    pool: [],
    poolIndex: 0,
    maxPoolSize: 1500,

    init() {
      this.pool = [];
      for (let i = 0; i < this.maxPoolSize; i++) {
        this.pool.push({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          size: 0,
          color: "#fff",
          alpha: 1,
          life: 0,
          maxLife: 0,
          gravity: 0,
          fade: false,
          drag: 1.0,
          style: "circle",
          angle: 0,
          spinSpeed: 0,
          scale: 1.0,
          scaleDecay: 0.0,
          active: false,
        });
      }
      this.poolIndex = 0;
    },

    get(x, y, vx, vy, size, color, alpha, life, arg9, arg10, arg11, arg12) {
      if (this.pool.length === 0) {
        this.init();
      }
      let pt = this.pool[this.poolIndex];
      this.poolIndex = (this.poolIndex + 1) % this.maxPoolSize;

      pt.x = x || 0;
      pt.y = y || 0;
      pt.vx = vx || 0;
      pt.vy = vy || 0;
      pt.size = size !== undefined ? size : 2;
      pt.color = color || "#ffffff";
      pt.alpha = alpha !== undefined ? alpha : 1.0;
      pt.life = life !== undefined ? life : 30;

      // Reset physics and styles to default base values
      pt.maxLife = pt.life;
      pt.gravity = 0;
      pt.fade = false;
      pt.drag = 1.0;
      pt.style = "circle";
      pt.angle = 0;
      pt.spinSpeed = 0;
      pt.scale = 1.0;
      pt.scaleDecay = 0.0;
      pt.active = true;

      // Smart Parameter Extraction supporting variable argument configurations (Subphase A.1)
      if (typeof arg11 === "boolean") {
        pt.maxLife = arg9 || pt.life;
        pt.gravity = typeof arg10 === "number" ? arg10 : 0;
        pt.fade = arg11;
        if (arg12 !== undefined) pt.drag = arg12;
      } else if (typeof arg10 === "boolean") {
        pt.fade = arg10;
        pt.gravity = typeof arg11 === "number" ? arg11 : 0;
        pt.maxLife = typeof arg9 === "number" ? arg9 : pt.life;
      } else if (typeof arg9 === "boolean") {
        pt.fade = arg9;
        pt.gravity = typeof arg10 === "number" ? arg10 : 0;
        if (typeof arg11 === "number") pt.drag = arg11;
      } else {
        if (typeof arg9 === "number") pt.maxLife = arg9 || pt.life;
        if (typeof arg10 === "number") pt.gravity = arg10;
        if (typeof arg11 === "boolean") pt.fade = arg11;
        if (typeof arg11 === "number") pt.drag = arg11;
        if (typeof arg12 === "number") pt.drag = arg12;
      }

      if (!pt.maxLife || pt.maxLife <= 0) pt.maxLife = pt.life;
      if (pt.drag === 0 || pt.drag === undefined || pt.drag < 0) pt.drag = 1.0;

      return pt;
    },

    recycle(pt) {
      pt.active = false;
    },
  };
  window.ParticlePool.init();

  export function spawnResonantAegisRipple(x, y) {
      if (!window.particles || !window.ParticlePool) return;
      let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : {};
      let aoeMult = pStats.areaRadiusMult || 1.0;

      // 1. Spawning high-density golden runic shards (Velocity scaled by AoE Multiplier)
      for (let i = 0; i < 14; i++) {
        let angle = (i * Math.PI * 2) / 14 + window.randFloat(-0.15, 0.15);
        let speed = window.randFloat(3.2, 5.8) * aoeMult;
        let life = window.randInt(20, 35);
        let pt = window.ParticlePool.get(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - window.randFloat(0.5, 1.5),
          window.randFloat(2.0, 4.0),
          Math.random() < 0.6 ? "#f1c40f" : "#ffd700",
          0.95,
          life,
          life,
          0.15, // light gravity to pull debris down
          true,
          0.92, // deceleration drag
        );
        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.25, 0.25);
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }

      // 2. Spawning expanding floor dust waves (Velocity scaled by AoE Multiplier)
      for (let i = 0; i < 14; i++) {
        let angle = (i * Math.PI * 2) / 14 + window.randFloat(-0.1, 0.1);
        let speed = window.randFloat(2.0, 3.8) * aoeMult;
        let life = window.randInt(15, 25);
        let pt = window.ParticlePool.get(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.45, // flat ellipse scatter
          window.randFloat(3.5, 6.0),
          "#b58700", // sand-gold
          0.75,
          life,
          life,
          0.0,
          true,
          0.88, // rapid deceleration
        );
        pt.style = "glowing_orb";
        pt.scaleDecay = 0.02;
        window.particles.push(pt);
      }
    }

  // Unified Earth-Breaker Bash visual spawner lives in entities.js

  // Intercept and bind any local particle pool assignments to unified ParticlePool (Subphase A.1)
  let existingCombatVisuals = window.combatVisuals;
  Object.defineProperty(window, "combatVisuals", {
    configurable: true,
    enumerable: true,
    get() {
      return this._combatVisuals;
    },
    set(val) {
      this._combatVisuals = val;
      if (val) val.particlePool = window.ParticlePool;
    },
  });
  if (existingCombatVisuals) {
    window.combatVisuals = existingCombatVisuals;
  }

  // --- POLYSCOPIC COMBAT IMPACT ENGINE (SUBPHASE C.2) ---
  export function spawnCombatImpactParticles(
    worldX,
    worldY,
    isCrit,
    dirX,
    dirY,
  ) {
    if (!window.particles || !window.ParticlePool) return;

    let speedMult = isCrit ? 1.4 : 1.0;
    let streakCount = isCrit ? 8 : 4;
    let shardCount = isCrit ? 6 : 3;

    // A. Spawn high-speed directional motion streaks
    for (let i = 0; i < streakCount; i++) {
      let angleOffset = window.randFloat(-0.5, 0.5);
      let baseAngle = Math.atan2(dirY, dirX) + angleOffset;
      let velocity = window.randFloat(4.5, 8.5) * speedMult;

      let vx = Math.cos(baseAngle) * velocity;
      let vy = Math.sin(baseAngle) * velocity;
      let life = window.randInt(11, 18);

      let color = isCrit
        ? Math.random() < 0.6
          ? "#ffd700"
          : "#ffffff"
        : Math.random() < 0.5
          ? "#f39c12"
          : "#e67e22";

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        vx,
        vy,
        window.randFloat(1.4, 2.4) * speedMult,
        color,
        0.95,
        life,
        life,
        0, // straight trails do not drop instantly
        true,
        0.88, // drag pulls back streak tails
      );
      pt.style = "streak";
      window.particles.push(pt);
    }

    // B. Spawn tumbling directional organic/metal shards
    for (let i = 0; i < shardCount; i++) {
      let angleOffset = window.randFloat(-0.8, 0.8);
      let baseAngle = Math.atan2(dirY, dirX) + angleOffset;
      let velocity = window.randFloat(2.0, 4.8) * speedMult;

      let vx = Math.cos(baseAngle) * velocity;
      let vy = Math.sin(baseAngle) * velocity;
      let life = window.randInt(14, 24);

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        vx,
        vy,
        window.randFloat(1.6, 3.2),
        isCrit ? "#ffffff" : "#c0392b", // Crimson blood or hot iron splinters
        0.9,
        life,
        life,
        0.14, // light gravity pulls shards down
        true,
        0.94, // standard air friction
      );
      pt.style = "polygon";
      pt.angle = Math.random() * Math.PI * 2;
      pt.spinSpeed = window.randFloat(-0.24, 0.24);
      pt.scaleDecay = 0.025;
      window.particles.push(pt);
    }

    // C. Spawn brilliant critical cross flares (critical strikes only)
    if (isCrit) {
      for (let i = 0; i < 3; i++) {
        let speedX = window.randFloat(-1.8, 1.8);
        let speedY = window.randFloat(-1.8, 1.8);
        let life = window.randInt(20, 28);

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          speedX,
          speedY,
          window.randFloat(4.0, 6.5),
          "#ffffff",
          1.0,
          life,
          life,
          0,
          true,
          0.9,
        );
        pt.style = "sparkle_star";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.06, 0.06);
        pt.scaleDecay = 0.02;
        window.particles.push(pt);
      }
    }
  }

