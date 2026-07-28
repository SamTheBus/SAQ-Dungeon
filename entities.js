(function () {
  // Scoped Date wrapper referencing window.Date to bypass local temporal dead zone checks
  const ScopedDate = class extends window.Date {
    static now() {
      return window.Date.now();
    }
  };
  const Date = ScopedDate;

  // Static particle themes to avoid runtime array allocations on entity death
  window.PARTICLE_THEMES = {
    slag_slime: ["#2ecc71", "#27ae60", "#a3fd83", "#111116"],
    rust_nibbler: ["#d35400", "#e67e22", "#7f8c8d", "#5c3a21"],
    corroded_golem: ["#2ecc71", "#34495e", "#1abc9c", "#111116"],
    animated_armor: ["#34495e", "#5d6d7e", "#00d2ff", "#1a252f"],
    cursed_blade: ["#9b59b6", "#8e44ad", "#e84393", "#111116"],
    mimic_shield: ["#2c3e50", "#7f8c8d", "#f1c40f", "#e74c3c"],
    gold_dungeon: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    coin_elemental: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    hoard_mimic: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    gilded_scuttler: ["#ffd700", "#f1c40f", "#b7950b", "#ffffff"],
    mat_dungeon: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    swamp_basilisk: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    toxic_fly: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    marsh_ghost: ["#2ecc71", "#27ae60", "#9b59b6", "#1abc9c"],
    equip_dungeon: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    golem: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    gargoyle: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    wyrmling: ["#34495e", "#5d6d7e", "#7f8c8d", "#1a252f"],
    magma_elemental: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    lava_serpent: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    hell_bat: ["#ff5500", "#d35400", "#e74c3c", "#2c0e08"],
    void_orb: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_crawler: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_spectre: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    void_wraith: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    rift_drifter: ["#9b59b6", "#8e44ad", "#e84393", "#110221"],
    clockwork_scarab: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    temporal_watcher: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    clockwork_drone: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    star_weaver: ["#dca04c", "#f1c40f", "#b7950b", "#7f8c8d"],
    neon_spider: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    cyber_wraith: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    wireframe_orb: ["#00d2ff", "#ff007f", "#3498db", "#ffffff"],
    prestige_boss: ["#d35400", "#ff3300", "#111116", "#ffeaa7"],
    aegis_goliath: ["#3498db", "#2980b9", "#7f8c8d", "#ffffff"],
    chronos_arbitrator: ["#f1c40f", "#dca04c", "#7f8c8d", "#111116"],
    nexus_overseer: ["#ff007f", "#e84393", "#00b894", "#111111"],
    default_slime: ["#2ecc71", "#27ae60", "#a3fd83"],
    tier1: ["#3498db", "#ecf0f1", "#bdc3c7"],
    tier2: ["#e74c3c", "#e67e22", "#2c0e08"],
    tier3: ["#27ae60", "#1b4f30", "#9b59b6"],
    tier4: ["#8e44ad", "#e84393", "#0d011a"],
    pottery_clay: ["#d35400", "#e67e22", "#ba4a00", "#7f8c8d"],
    ancient_urn: ["#2980b9", "#3498db", "#111827", "#f1c40f"],
    wooden_barrel: ["#5c3a21", "#78350f", "#3d1d0b", "#475569"],
  };

  /* ==========================================================================
     PRIMARY PURPOSE: High-Fidelity Cel-Shaded Entity Rendering,
     Advanced Combat Resolution Visuals, and Particle Spawners.
     ========================================================================= */

  // === MEMORY-SAFE COMBAT VISUALS POOLING ENGINE ===

  class PoolParticle {
    constructor() {
      this.active = false;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.radius = 0;
      this.color = "#ffffff";
      this.alpha = 1;
      this.life = 0;
      this.maxLife = 0;
      this.gravity = 0.25;
      this.fade = false;
      this.growth = 0;
    }

    init(
      x,
      y,
      vx,
      vy,
      radius,
      color,
      alpha = 1,
      life = 30,
      gravity = 0.25,
      fade = false,
      growth = 0,
    ) {
      this.active = true;
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.radius = radius;
      this.color = color;
      this.alpha = alpha;
      this.life = life;
      this.maxLife = life;
      this.gravity = gravity;
      this.fade = fade;
      this.growth = growth;
    }
  }

  class ParticlePool {
    constructor(size = 500) {
      this.pool = Array.from({ length: size }, () => new PoolParticle());
    }

    get(x, y, vx, vy, radius, color, alpha, life, gravity, fade, growth) {
      let p = this.pool.find((item) => !item.active);
      if (!p) {
        p = new PoolParticle();
        this.pool.push(p);
      }
      p.init(x, y, vx, vy, radius, color, alpha, life, gravity, fade, growth);
      return p;
    }
  }

  class PoolCombatEffect {
    constructor() {
      this.active = false;
      this.type = "slash";
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = -0.4;
      this.amount = 0;
      this.color = "#ffffff";
      this.life = 0;
      this.maxLife = 40;
      this.text = "";
      this.isCumulative = false;
      this.targetId = null;
    }

    init(
      type,
      x,
      y,
      vx,
      vy,
      amount,
      color,
      life = 40,
      text = "",
      isCumulative = false,
      targetId = null,
    ) {
      this.active = true;
      this.type = type;
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.amount = amount;
      this.color = color;
      this.life = life;
      this.maxLife = life;
      this.text = text;
      this.isCumulative = isCumulative;
      this.targetId = targetId;
    }
  }

  class CombatEffectPool {
    constructor(size = 150) {
      this.pool = Array.from({ length: size }, () => new PoolCombatEffect());
    }

    get(type, x, y, vx, vy, amount, color, life, text, isCumulative, targetId) {
      let e = this.pool.find((item) => !item.active);
      if (!e) {
        e = new PoolCombatEffect();
        this.pool.push(e);
      }
      e.init(
        type,
        x,
        y,
        vx,
        vy,
        amount,
        color,
        life,
        text,
        isCumulative,
        targetId,
      );
      return e;
    }
  }

  class CombatVisualsEngine {
    constructor() {
      this.particlePool = new ParticlePool(500);
      this.effectPool = new CombatEffectPool(150);
      this.beams = [];
      this.projectiles = [];
      this.screenShakeTimer = 0;
      this.screenShakeIntensity = 0;
    }

    formatNumber(val) {
      if (val === null || val === undefined) return "0";
      return typeof window.formatNumber === "function"
        ? window.formatNumber(val)
        : String(val);
    }

    triggerScreenShake(intensity = 6, duration = 12) {
      this.screenShakeIntensity = intensity;
      this.screenShakeTimer = duration;
    }

    spawnBeam(
      x,
      color = "#f1c40f",
      life = 45,
      followPlayer = false,
      offsetX = 0,
    ) {
      this.beams.push({ x, color, life, maxLife: life, followPlayer, offsetX });
    }

    spawnProjectile(x, y, vx, vy, type = "standard", radius = 10) {
      this.projectiles.push({
        x,
        y,
        vx,
        vy,
        type,
        r: radius,
        pulseOffset: Math.random() * 10,
      });
    }

    spawnProjectileImpact(x, y, type = "standard") {
      let isEco = window.playerStats && window.playerStats.ecoMode;
      let count = isEco ? 4 : 12;
      let colors = ["#e74c3c", "#f1c40f"];
      let speed = 4;

      if (type === "thorn") {
        colors = ["#2ecc71", "#27ae60", "#a3fd83", "#5c3a21"];
        speed = 3.5;
      } else if (type === "frost") {
        colors = ["#38bdf8", "#e0f2fe", "#ffffff", "#0284c7"];
        speed = 4.5;
      } else if (type === "fireball") {
        colors = ["#ff5500", "#e67e22", "#f1c40f", "#2c0e08"];
        speed = 5;
      } else if (type === "maelstrom") {
        colors = ["#2ecc71", "#a3fd83", "#1e8449"];
        speed = 3;
      } else if (type === "void") {
        colors = ["#e84393", "#8e44ad", "#00ffff", "#110221"];
        speed = 5.5;
      } else if (type === "boss_nova") {
        colors = ["#ffd700", "#ff3300", "#ffffff", "#e67e22"];
        speed = 6;
      }

      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = window.randFloat(1, speed);
        let life = window.randInt(12, 25);
        this.particlePool.get(
          x,
          y,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel,
          window.randFloat(1.2, 3.2),
          colors[Math.floor(Math.random() * colors.length)],
          1,
          life,
          0.1,
          true,
          0,
        );
      }
    }

    spawnParticles(x, y, count = 15, theme = "default", speed = 4) {
      const colors = window.PARTICLE_THEMES[theme] ||
        window.PARTICLE_THEMES.default_slime || [
          "#2ecc71",
          "#27ae60",
          "#a3fd83",
        ];
      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let vel = (Math.random() * 0.8 + 0.2) * speed;
        let life = Math.floor(Math.random() * 20 + 25);
        this.particlePool.get(
          x,
          y,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel - (Math.random() * 2 + 1),
          Math.random() * 3 + 1.5,
          colors[Math.floor(Math.random() * colors.length)],
          1,
          life,
          0.25,
          true,
          0,
        );
      }
    }

    spawnDamageEffect(
      x,
      y,
      amount,
      type = "slash",
      isCrit = false,
      targetObj = null,
    ) {
      let hitColor = "#ecf0f1";
      let offsetX = (Math.random() - 0.5) * 30;
      let offsetY = (Math.random() - 0.5) * 20 - 10;
      let targetId = targetObj ? targetObj.id : null;

      if (targetObj && targetObj.isBoss && targetObj.maxHp) {
        let numericAmt =
          typeof amount === "object"
            ? amount.m * Math.pow(10, amount.e)
            : amount;
        let numericMaxHp =
          typeof targetObj.maxHp === "object"
            ? targetObj.maxHp.m * Math.pow(10, targetObj.maxHp.e)
            : targetObj.maxHp;
        if (numericAmt >= numericMaxHp * 0.6) {
          const funnyPhrases = [
            "OUCH!!",
            "OW!!!",
            "OWWY!!",
            "OOF",
            "MY SPINE!!",
            "NOT THE FACE!!",
            "STOP IT!!",
            "BRUH!!!",
            "REALLY?!",
            "HELP!!",
            "WTF?!",
            "RUDE!!",
            "EMOTIONAL DAMAGE",
            "MY LEG!",
          ];
          targetObj.funnyText =
            funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)];
          targetObj.funnyTextTimer = 60;
        }
      }

      if (isCrit) {
        this.effectPool.get(
          "crit",
          x + offsetX,
          y + offsetY,
          (Math.random() - 0.5) * 2.4,
          -(Math.random() * 1.0 + 1.0),
          amount,
          "#e74c3c",
          45,
          "",
          false,
          targetId,
        );
      } else {
        if (type === "lightning") hitColor = "#f1c40f";
        else if (type === "fire") hitColor = "#e67e22";
        else if (type === "frost") hitColor = "#3498db";
        else if (type === "echo") hitColor = "#9b59b6";
        else if (type === "counter" || type === "shield_bash")
          hitColor = "#f1c40f";
        else if (type === "aegis_counter") hitColor = "#9b59b6";
        else if (type === "parry_counter" || type === "riposte")
          hitColor = "#a855f7";
        else if (type === "bleed") hitColor = "#960018";
        else if (type === "poison") hitColor = "#2ecc71";
        else if (type === "dagger") hitColor = "#a5b1c2";
        else if (type === "decay") hitColor = "#ff007f";
        else if (type === "distortion") hitColor = "#ff2200";
        else if (type === "static") hitColor = "#e74c3c";

        this.effectPool.get(
          type,
          x + offsetX,
          y + offsetY,
          (Math.random() - 0.5) * 2.4,
          -(Math.random() * 0.9 + 0.6),
          amount,
          hitColor,
          40,
          "",
          false,
          targetId,
        );
      }

      let activeEffects = this.effectPool.pool.filter((e) => e.active);
      let existingTotal = activeEffects.find(
        (e) => e.isCumulative && e.targetId === targetId && e.life > 0,
      );
      if (existingTotal) {
        let addVal =
          typeof amount === "object"
            ? amount.m * Math.pow(10, amount.e)
            : amount;
        let curVal =
          typeof existingTotal.amount === "object"
            ? existingTotal.amount.m * Math.pow(10, existingTotal.amount.e)
            : existingTotal.amount;
        existingTotal.amount = curVal + addVal;
        existingTotal.text = `TOTAL: ${this.formatNumber(existingTotal.amount)}`;
        existingTotal.life = 55;
        existingTotal.x = x - 25;
        existingTotal.y = y - 35;
      } else {
        this.effectPool.get(
          "cumulative",
          x - 25,
          y - 35,
          0,
          -0.4,
          amount,
          "#f1c40f",
          55,
          `TOTAL: ${this.formatNumber(amount)}`,
          true,
          targetId,
        );
      }
    }

    update() {
      if (this.screenShakeTimer > 0) {
        this.screenShakeTimer--;
      }

      this.particlePool.pool.forEach((pt) => {
        if (!pt.active) return;
        pt.life--;
        if (pt.life <= 0) {
          pt.active = false;
          return;
        }
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += pt.gravity;
        pt.radius += pt.growth;
        if (pt.fade && pt.maxLife > 0) {
          pt.alpha = pt.life / pt.maxLife;
        }
      });

      this.effectPool.pool.forEach((eff) => {
        if (!eff.active) return;
        eff.life--;
        if (eff.life <= 0) {
          eff.active = false;
          return;
        }
        eff.x += eff.vx;
        eff.y += eff.vy;
      });

      for (let i = this.beams.length - 1; i >= 0; i--) {
        let bm = this.beams[i];
        bm.life--;
        if (bm.life <= 0) this.beams.splice(i, 1);
      }

      let isEco = window.playerStats && window.playerStats.ecoMode;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        let spawnChance = isEco ? 0.25 : 0.65;
        if (Math.random() < spawnChance) {
          let trailColor = "#38bdf8";
          let grav = 0;
          let pRadius = Math.random() * 2 + 1.2;
          let pLife = 16;

          if (p.type === "thorn") {
            trailColor = Math.random() > 0.5 ? "#2ecc71" : "#a3fd83";
            grav = -0.05;
          } else if (p.type === "frost") {
            trailColor = Math.random() > 0.4 ? "#e0f2fe" : "#38bdf8";
            grav = 0.02;
          } else if (p.type === "fireball") {
            trailColor = Math.random() > 0.3 ? "#e67e22" : "#f1c40f";
            grav = -0.08;
          } else if (p.type === "maelstrom") {
            trailColor = Math.random() > 0.5 ? "#2ecc71" : "#1e8449";
            grav = 0.12;
          } else if (p.type === "void") {
            trailColor = Math.random() > 0.5 ? "#e84393" : "#8e44ad";
            grav = 0;
          } else if (p.type === "boss_nova") {
            trailColor = Math.random() > 0.4 ? "#ffd700" : "#ff3300";
            grav = -0.04;
          }

          this.particlePool.get(
            p.x - p.vx * 0.5 + (Math.random() - 0.5) * 3,
            p.y - p.vy * 0.5 + (Math.random() - 0.5) * 3,
            -p.vx * 0.25 + (Math.random() - 0.5) * 0.8,
            -p.vy * 0.25 + (Math.random() - 0.5) * 0.8,
            pRadius,
            trailColor,
            0.9,
            pLife,
            grav,
            true,
            0,
          );
        }

        if (p.x < -100 || p.x > 3000 || p.y < -100 || p.y > 3000) {
          this.projectiles.splice(i, 1);
        }
      }
    }

    render(ctx) {
      ctx.save();

      if (this.screenShakeTimer > 0) {
        let rx = (Math.random() - 0.5) * this.screenShakeIntensity;
        let ry = (Math.random() - 0.5) * this.screenShakeIntensity;
        ctx.translate(rx, ry);
      }

      this.beams.forEach((bm) => {
        ctx.save();
        ctx.globalAlpha = (bm.life / bm.maxLife) * 0.75;
        let bx =
          bm.followPlayer && window.player
            ? window.player.x + (bm.offsetX || 0)
            : bm.x;
        let by = window.player
          ? window.player.y
          : window.DungeonCamera
            ? window.DungeonCamera.y
            : 0;
        let beamGrad = ctx.createLinearGradient(bx - 20, 0, bx + 20, 0);
        beamGrad.addColorStop(0, "rgba(255,255,255,0)");
        beamGrad.addColorStop(0.5, bm.color);
        beamGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = beamGrad;
        ctx.fillRect(bx - 25, by - 10000, 50, 20000);
        ctx.restore();
      });

      this.projectiles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);

        let angle = Math.atan2(p.vy, p.vx);
        let time = Date.now();
        let r = p.r + Math.sin(time / 80 + p.pulseOffset) * 1.5;

        if (p.type === "thorn") {
          // --- THORN SPIKE / VINE NEEDLE ---
          ctx.rotate(angle);
          ctx.fillStyle = "#4a2d18";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          ctx.moveTo(r * 2.2, 0);
          ctx.lineTo(-r * 1.2, -r * 0.65);
          ctx.lineTo(-r * 0.5, 0);
          ctx.lineTo(-r * 1.2, r * 0.65);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Poison Tip Highlight
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.moveTo(r * 2.2, 0);
          ctx.lineTo(r * 0.6, -r * 0.35);
          ctx.lineTo(r * 0.6, r * 0.35);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = "#a3fd83";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-r * 0.5, 0);
          ctx.lineTo(r * 2.0, 0);
          ctx.stroke();
        } else if (p.type === "frost") {
          // --- FACETED ICE CRYSTAL LANCE ---
          ctx.rotate(angle);
          ctx.fillStyle = "#dff9fb";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          ctx.moveTo(r * 2.0, 0);
          ctx.lineTo(0, -r * 0.75);
          ctx.lineTo(-r * 1.5, 0);
          ctx.lineTo(0, r * 0.75);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Ice Specular Facets
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.moveTo(r * 2.0, 0);
          ctx.lineTo(0, 0);
          ctx.lineTo(0, r * 0.75);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(r * 2.0, 0);
          ctx.lineTo(0, -r * 0.75);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === "fireball") {
          // --- FLAMING MOLTEN COMET ---
          ctx.rotate(angle);

          // Outer Flame Tail
          ctx.fillStyle = "#c0392b";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Flame Mantle
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.arc(r * 0.3, 0, r * 0.85, 0, Math.PI * 2);
          ctx.fill();

          // White-Hot Core
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.arc(r * 0.5, 0, r * 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(r * 0.6, 0, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "maelstrom") {
          // --- ACIDIC WOBBLING GLOBULE ---
          let wobbleX = Math.sin(time / 60 + p.pulseOffset) * 2;
          let wobbleY = Math.cos(time / 60 + p.pulseOffset) * 2;

          ctx.fillStyle = "#2ecc71";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, r + wobbleX, r - wobbleY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#a3fd83";
          ctx.beginPath();
          ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
          ctx.arc(r * 0.2, r * 0.2, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "void") {
          // --- VOID SINGULARITY ORB ---
          let rot = time / 300;

          // Back Event Horizon Ring
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = 1.5;
          ctx.save();
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 2.0, r * 0.65, 0, Math.PI, 0);
          ctx.stroke();
          ctx.restore();

          // Black Hole Core
          ctx.fillStyle = "#0c011a";
          ctx.strokeStyle = "#ff007f";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Front Event Horizon Ring
          ctx.strokeStyle = "#e84393";
          ctx.lineWidth = 1.8;
          ctx.save();
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 2.0, r * 0.65, 0, 0, Math.PI);
          ctx.stroke();
          ctx.restore();
        } else if (p.type === "boss_nova") {
          // --- OVERLORD PLASMA ORB ---
          ctx.rotate(angle);

          ctx.fillStyle = "#ff3300";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(r * 0.4, 0, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // --- STANDARD ENERGY BOLT ---
          ctx.fillStyle = "#3498db";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });

      this.particlePool.pool.forEach((pt) => {
        if (!pt.active) return;
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      this.effectPool.pool.forEach((eff) => {
        if (!eff.active) return;
        ctx.save();
        let hx = eff.x;
        let hy = eff.y;

        if (eff.type === "regen") {
          ctx.beginPath();
          ctx.moveTo(hx, hy - 4);
          ctx.bezierCurveTo(hx - 4, hy - 9, hx - 9, hy - 4, hx - 9, hy + 1);
          ctx.quadraticCurveTo(hx - 9, hy + 6, hx, hy + 12);
          ctx.quadraticCurveTo(hx + 9, hy + 6, hx + 9, hy + 1);
          ctx.bezierCurveTo(hx + 9, hy - 4, hx + 4, hy - 9, hx, hy - 4);
          ctx.closePath();
          ctx.fillStyle = "#e74c3c";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(hx - 2.5, hy - 3.5, 1.5, 0, Math.PI * 2);
          ctx.fill();

          let text = `+${this.formatNumber(eff.amount)}`;
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = eff.color || "#2ecc71";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "crit") {
          let fixedAngle = 0.35;
          let spikes = 6;

          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            let angle = (i * Math.PI) / spikes + fixedAngle;
            let r = i % 2 === 0 ? 14 : 3.5;
            ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fillStyle = "#e74c3c";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            let angle = (i * Math.PI) / spikes + fixedAngle;
            let r = i % 2 === 0 ? 9 : 2.5;
            ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fillStyle = "#f1c40f";
          ctx.fill();

          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            let angle = (i * Math.PI) / spikes + fixedAngle;
            let r = i % 2 === 0 ? 5.5 : 1.5;
            ctx.lineTo(hx + Math.cos(angle) * r, hy + Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          let text = this.formatNumber(eff.amount);
          ctx.font = "900 18px 'Arial Black', Impact, sans-serif";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 16, hy + 5);

          let textGrad = ctx.createLinearGradient(
            hx + 16,
            hy - 10,
            hx + 16,
            hy + 10,
          );
          textGrad.addColorStop(0, "#fff200");
          textGrad.addColorStop(0.5, "#f39c12");
          textGrad.addColorStop(1, "#ee5253");
          ctx.fillStyle = textGrad;
          ctx.fillText(text, hx + 16, hy + 5);
        } else if (eff.type === "block") {
          ctx.beginPath();
          ctx.moveTo(hx - 6, hy - 6);
          ctx.lineTo(hx + 6, hy - 6);
          ctx.quadraticCurveTo(hx + 6, hy, hx + 5, hy + 3);
          ctx.quadraticCurveTo(hx, hy + 10, hx, hy + 10);
          ctx.quadraticCurveTo(hx - 5, hy + 3, hx - 6, hy);
          ctx.closePath();
          ctx.fillStyle = "#3498db";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(hx, hy - 5);
          ctx.lineTo(hx, hy + 8);
          ctx.moveTo(hx - 4, hy + 1);
          ctx.lineTo(hx + 4, hy + 1);
          ctx.stroke();

          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText("BLOCK", hx + 13, hy + 4);
          ctx.fillStyle = "#3498db";
          ctx.fillText("BLOCK", hx + 13, hy + 4);
        } else if (eff.type === "parry") {
          ctx.save();
          ctx.translate(hx, hy);

          ctx.save();
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = "#ecf0f1";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(-2.5, -18, 5, 22);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f1c40f";
          ctx.fillRect(-6, 4, 12, 3);
          ctx.strokeRect(-6, 4, 12, 3);
          ctx.restore();

          ctx.save();
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = "#ecf0f1";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.rect(-2.5, -18, 5, 22);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f1c40f";
          ctx.fillRect(-6, 4, 12, 3);
          ctx.strokeRect(-6, 4, 12, 3);
          ctx.restore();

          ctx.restore();

          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText("PARRY", hx + 13, hy + 4);
          ctx.fillStyle = "#9b59b6";
          ctx.fillText("PARRY", hx + 13, hy + 4);
        } else if (eff.type === "barrier") {
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4.0;
          ctx.beginPath();
          ctx.arc(hx, hy, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "#9b59b6";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(hx, hy, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.stroke();

          let text = `BARRIER -${this.formatNumber(eff.amount)}`;
                    ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#9b59b6";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "lightning") {
          ctx.beginPath();
          ctx.moveTo(hx + 2.5, hy - 9);
          ctx.lineTo(hx - 5, hy + 1.5);
          ctx.lineTo(hx - 0.5, hy + 1.5);
          ctx.lineTo(hx - 4.5, hy + 10);
          ctx.lineTo(hx + 4.5, hy - 0.5);
          ctx.lineTo(hx, hy - 0.5);
          ctx.closePath();
          ctx.fillStyle = "#f1c40f";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#f1c40f";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "fire") {
          ctx.beginPath();
          ctx.moveTo(hx, hy - 9);
          ctx.quadraticCurveTo(hx - 7, hy - 2, hx - 7, hy + 4);
          ctx.quadraticCurveTo(hx - 7, hy + 9.5, hx, hy + 9.5);
          ctx.quadraticCurveTo(hx + 7, hy + 9.5, hx + 7, hy + 4);
          ctx.quadraticCurveTo(hx + 7, hy - 2, hx, hy - 9);
          ctx.closePath();
          ctx.fillStyle = "#e67e22";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(hx, hy - 4);
          ctx.quadraticCurveTo(hx - 4, hy + 1, hx - 4, hy + 5.5);
          ctx.quadraticCurveTo(hx - 4, hy + 8, hx, hy + 8);
          ctx.quadraticCurveTo(hx + 4, hy + 8, hx + 4, hy + 5.5);
          ctx.quadraticCurveTo(hx + 4, hy + 1, hx, hy - 4);
          ctx.closePath();
          ctx.fillStyle = "#f1c40f";
          ctx.fill();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#e67e22";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "frost") {
          ctx.beginPath();
          ctx.moveTo(hx, hy - 9);
          ctx.lineTo(hx + 6, hy);
          ctx.lineTo(hx, hy + 9);
          ctx.lineTo(hx - 6, hy);
          ctx.closePath();
          ctx.fillStyle = "#dff9fb";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#3498db";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "bleed") {
          ctx.fillStyle = "#c0392b";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(hx, hy - 8);
          ctx.quadraticCurveTo(hx - 6, hy, hx - 6, hy + 4);
          ctx.quadraticCurveTo(hx - 6, hy + 9, hx, hy + 9);
          ctx.quadraticCurveTo(hx + 6, hy + 9, hx + 6, hy + 4);
          ctx.quadraticCurveTo(hx + 6, hy - 2, hx, hy - 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#960018";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "poison") {
          ctx.beginPath();
          ctx.arc(hx, hy, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#2ecc71";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.fill();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#2ecc71";
          ctx.fillText(text, hx + 14, hy + 4);
        } else if (eff.type === "echo") {
          ctx.fillStyle = "#9b59b6";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.arc(hx, hy - 2, 6, Math.PI, 0, false);
          ctx.quadraticCurveTo(hx + 6, hy + 6, hx + 3, hy + 8);
          ctx.lineTo(hx - 3, hy + 8);
          ctx.quadraticCurveTo(hx - 6, hy + 6, hx - 6, hy - 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          let text = this.formatNumber(eff.amount);
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 14, hy + 4);
          ctx.fillStyle = "#9b59b6";
          ctx.fillText(text, hx + 14, hy + 4);
        } else {
          let text = eff.text || this.formatNumber(eff.amount);
          ctx.font = "bold 16px sans-serif";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 4;
          ctx.lineJoin = "miter";
          ctx.strokeText(text, eff.x, eff.y);
          ctx.fillStyle = eff.color || "#ffffff";
          ctx.fillText(text, eff.x, eff.y);
        }

        ctx.restore();
      });

      ctx.restore();
    }

    drawTargetHealthBar(ctx, target) {
      if (!target || !target.hp || target.hp <= 0) return;

      let bHp =
        typeof target.hp === "object"
          ? target.hp.m * Math.pow(10, target.hp.e)
          : target.hp;
      let bMaxHp =
        typeof target.maxHp === "object"
          ? target.maxHp.m * Math.pow(10, target.maxHp.e)
          : target.maxHp;
      let hpPct = Math.max(0, Math.min(1, bHp / bMaxHp));

      target.trailingPct =
        target.trailingPct !== undefined ? target.trailingPct : hpPct;
      if (target.trailingPct > hpPct) {
        target.trailingPct = Math.max(hpPct, target.trailingPct - 0.015);
      } else {
        target.trailingPct = hpPct;
      }

      ctx.save();

      if (
        target.isBoss ||
        target.type === "dungeon_boss" ||
        target.type === "dungeon_miniboss" ||
        target.type === "boss" ||
        target.type === "aegis_goliath" ||
        target.type === "chronos_arbitrator" ||
        target.type === "nexus_overseer" ||
        target.type === "gilded_vault_keeper" ||
        target.type === "corrosive_abomination" ||
        target.type === "hooktail" ||
        target.type === "overlord_iron_vault"
      ) {
        let barW = Math.min(420, ctx.canvas.width * 0.5);
        let barH = 12;
        let barX = (ctx.canvas.width - barW) / 2;
        let barY = 52;

        let isAegis =
          target.type === "aegis_goliath" ||
          target.visualType === "aegis_goliath" ||
          (target.name && target.name.toLowerCase().includes("aegis"));

        if (isAegis) {
          this.drawAegisGoliathBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isChronos =
          target.type === "chronos_arbitrator" ||
          target.visualType === "chronos_arbitrator" ||
          (target.name && target.name.toLowerCase().includes("chronos"));

        if (isChronos) {
          this.drawChronosArbitratorBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isNexus =
          target.type === "nexus_overseer" ||
          target.visualType === "nexus_overseer" ||
          (target.name && target.name.toLowerCase().includes("nexus"));

        if (isNexus) {
          this.drawNexusOverseerBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isGilded =
          target.type === "gilded_vault_keeper" ||
          target.visualType === "gilded_vault_keeper" ||
          (target.name && target.name.toLowerCase().includes("vault keeper")) ||
          (target.name && target.name.toLowerCase().includes("gilded"));

        if (isGilded) {
          this.drawGildedVaultKeeperBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isCorrosive =
          target.type === "corrosive_abomination" ||
          target.visualType === "corrosive_abomination" ||
          (target.name && target.name.toLowerCase().includes("corrosive")) ||
          (target.name && target.name.toLowerCase().includes("abomination"));

        if (isCorrosive) {
          this.drawCorrosiveAbominationBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isHooktail =
          target.type === "hooktail" ||
          target.type === "prestige_boss" ||
          target.visualType === "hooktail" ||
          (target.name && target.name.toLowerCase().includes("hooktail")) ||
          (target.name && target.name.toLowerCase().includes("calamity"));

        if (isHooktail) {
          this.drawHooktailBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        let isOverlord =
          target.type === "overlord_iron_vault" ||
          target.visualType === "overlord_iron_vault" ||
          (target.name && target.name.toLowerCase().includes("overlord")) ||
          (target.name && target.name.toLowerCase().includes("iron vault"));

        if (isOverlord) {
          this.drawOverlordIronVaultBossBar(
            ctx,
            target,
            hpPct,
            bHp,
            bMaxHp,
            barX,
            barY,
            barW,
            barH,
          );
          ctx.restore();
          return;
        }

        this.drawStandardBossBar(
          ctx,
          target,
          hpPct,
          bHp,
          bMaxHp,
          barX,
          barY,
          barW,
          barH,
        );
        ctx.restore();
        return;
      } else if (hpPct < 1.0) {
        let barW = target.w || 30;
        let barX = target.x;
        let barY = target.y - 12;

        ctx.fillStyle = "#111111";
        ctx.fillRect(barX, barY, barW, 6);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(barX, barY, target.trailingPct * barW, 6);

        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(barX, barY, hpPct * barW, 6);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX, barY, barW, 6);

        this.drawStatusDots(
                  ctx,
                  barX,
                  barY - 6,
                  target.bleedStacks || 0,
                  "#e74c3c",
                );
                this.drawStatusDots(
                  ctx,
                  barX,
                  barY - 12,
                  target.poisonStacks || 0,
                  "#2ecc71",
                );

                // Render 3x Multi-Stack Buff Badges above Mob Healthbar
                if (target.buffStacks) {
                  let badgeY = barY - 18;
                  let badgeParts = [];
                  if ((target.buffStacks.haste || 0) > 0) badgeParts.push({ text: `Haste ${target.buffStacks.haste}x`, col: "#00d2ff" });
                  if ((target.buffStacks.def || 0) > 0) badgeParts.push({ text: `Def ${target.buffStacks.def}x`, col: "#3498db" });
                  if ((target.buffStacks.atk || 0) > 0) badgeParts.push({ text: `Atk ${target.buffStacks.atk}x`, col: "#e74c3c" });

                  badgeParts.forEach((bp) => {
                    ctx.font = "bold 8px monospace";
                    ctx.strokeStyle = "#000000";
                    ctx.lineWidth = 2.0;
                    ctx.strokeText(bp.text, barX, badgeY);
                    ctx.fillStyle = bp.col;
                    ctx.fillText(bp.text, barX, badgeY);
                    badgeY -= 9;
                  });
                }
              }

              ctx.restore();
            }

    drawAegisGoliathBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.aegis_goliath) || {
        title: "AEGIS GOLIATH",
        subtitle: "COSMIC SHIELD WARDEN",
        primaryColor: "#00d2ff",
        secondaryColor: "#3498db",
      };

      let pulse = Math.sin(time / 140) * 0.15 + 0.85;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = theme.primaryColor;

      ctx.fillStyle = "#050c18";
      ctx.strokeStyle = theme.primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 6].forEach((offsetX) => {
        let bracketX = barX + offsetX;
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = theme.primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bracketX, barY - 1);
        ctx.lineTo(bracketX + 8, barY + barH / 2);
        ctx.lineTo(bracketX, barY + barH + 1);
        ctx.lineTo(bracketX - 4, barY + barH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.arc(bracketX + 2, barY + barH / 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#e0f2fe";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#00ffff");
        fillGrad.addColorStop(0.5, "#00d2ff");
        fillGrad.addColorStop(1, "#1d4ed8");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let scanX = barX + ((time / 6) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(scanX, barY + 1, 6, barH - 2);
      }

      ctx.strokeStyle = "rgba(15, 23, 42, 0.9)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#00d2ff";
        ctx.fillRect(notchX - 1, barY - 1, 2, 2);
        ctx.fillRect(notchX - 1, barY + barH - 1, 2, 2);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#00d2ff";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} HP (${(hpPct * 100).toFixed(1)}%)`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#e0f2fe";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#00ffff";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawChronosArbitratorBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.chronos_arbitrator) || {
        title: "CHRONOS ARBITRATOR",
        subtitle: "THE CLOCKWORK GOD",
        primaryColor: "#f1c40f",
        secondaryColor: "#d35400",
      };

      let pulse = Math.sin(time / 160) * 0.15 + 0.85;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = "#f1c40f";

      ctx.fillStyle = "#1c120c";
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 14].forEach((offsetX, idx) => {
        let gearX = barX + offsetX;
        let gearY = barY + barH / 2;
        let gearRad = 11;
        let gearRot = (time / 800) * (idx === 0 ? 1 : -1);

        ctx.save();
        ctx.translate(gearX, gearY);

        ctx.save();
        ctx.rotate(gearRot);
        ctx.fillStyle = "#d4af37";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, gearRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let teeth = 6;
        for (let i = 0; i < teeth; i++) {
          let toothAngle = (i * Math.PI * 2) / teeth;
          ctx.save();
          ctx.rotate(toothAngle);
          ctx.fillRect(-2, -gearRad - 2, 4, 4);
          ctx.strokeRect(-2, -gearRad - 2, 4, 4);
          ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = "#fdf6e2";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(0, 0, gearRad - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let handAngle = (time / (idx === 0 ? 600 : 1200)) % (Math.PI * 2);
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(handAngle) * 4.5, Math.sin(handAngle) * 4.5);
        ctx.stroke();

        ctx.restore();
      });

      ctx.fillStyle = "#ffeaa7";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#ffeaa7");
        fillGrad.addColorStop(0.5, "#f1c40f");
        fillGrad.addColorStop(1, "#d35400");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let sweepX = barX + ((time / 5) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fillRect(sweepX, barY + 1, 5, barH - 2);
      }

      ctx.strokeStyle = "rgba(28, 18, 12, 0.9)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(notchX - 1.5, barY - 2, 3, 3);
        ctx.fillRect(notchX - 1.5, barY + barH - 1, 3, 3);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#f1c40f";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} HP (${(hpPct * 100).toFixed(1)}%)`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#ffeaa7";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#ffd700";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawNexusOverseerBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let isGlitching = isLowHp || Math.sin(time / 40) > 0.88;

      let tremorX = isGlitching
        ? (Math.random() - 0.5) * (isLowHp ? 4.0 : 2.0)
        : 0;
      let tremorY = isGlitching
        ? (Math.random() - 0.5) * (isLowHp ? 3.0 : 1.5)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.nexus_overseer) || {
        title: "NEXUS OVERSEER",
        subtitle: "CYBERSPACE SINGULARITY",
        primaryColor: "#ff007f",
        secondaryColor: "#00f0ff",
      };

      let pulse = Math.sin(time / 100) * 0.2 + 0.8;
      ctx.shadowBlur = 14 * pulse;
      ctx.shadowColor = "#ff007f";

      ctx.fillStyle = "#09090e";
      ctx.strokeStyle = "#ff007f";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [2]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.5;
      [-20, barW + 12].forEach((offsetX) => {
        let bracketX = barX + offsetX;
        ctx.beginPath();
        ctx.moveTo(bracketX, barY - 4);
        ctx.lineTo(bracketX + (offsetX < 0 ? 6 : -6), barY - 4);
        ctx.moveTo(bracketX, barY - 4);
        ctx.lineTo(bracketX, barY + 2);

        ctx.moveTo(bracketX, barY + barH + 4);
        ctx.lineTo(bracketX + (offsetX < 0 ? 6 : -6), barY + barH + 4);
        ctx.moveTo(bracketX, barY + barH + 4);
        ctx.lineTo(bracketX, barY + barH - 2);
        ctx.stroke();
      });

      [-14, barW + 14].forEach((offsetX, idx) => {
        let nodeX = barX + offsetX;
        let nodeY = barY + barH / 2;
        let rot = (time / 400) * (idx === 0 ? 1 : -1);

        ctx.save();
        ctx.translate(nodeX, nodeY);
        ctx.rotate(rot);

        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-5, -5, 10, 10);

        ctx.fillStyle = "#ff007f";
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      });

      ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.fillRect(barX, barY + 1, trailingWidth, barH - 2);
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#00f0ff");
        fillGrad.addColorStop(0.5, "#ff007f");
        fillGrad.addColorStop(1, "#8e44ad");
        ctx.fillStyle = fillGrad;
        ctx.fillRect(barX, barY + 1, fillWidth, barH - 2);

        let sweepX = barX + ((time / 3) % fillWidth);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sweepX, barY + 1, 4, barH - 2);

        if (Math.random() < 0.35) {
          let glitchBlockX = barX + Math.random() * (fillWidth - 10);
          ctx.fillStyle = "#00f0ff";
          ctx.fillRect(glitchBlockX, barY + 1, 8, barH - 2);
        }
      }

      ctx.strokeStyle = "rgba(9, 9, 14, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#00f0ff";
        ctx.fillRect(notchX - 1, barY - 2, 2, 3);
        ctx.fillRect(notchX - 1, barY + barH - 1, 2, 3);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();

      if (isGlitching) {
        ctx.fillStyle = "rgba(0, 240, 255, 0.8)";
        ctx.fillText(bossTitle, barX + barW / 2 - 1.5, barY - 6);
        ctx.fillStyle = "rgba(255, 0, 127, 0.8)";
        ctx.fillText(bossTitle, barX + barW / 2 + 1.5, barY - 6);
      }

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#ff007f";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[SYSTEM_HP: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#00f0ff";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#00f0ff";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawGildedVaultKeeperBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.gilded_vault_keeper) || {
        title: "GILDED VAULT KEEPER",
        subtitle: "MIDAS TREASURY OVERSEER",
        primaryColor: "#ffd700",
        secondaryColor: "#b58700",
      };

      let pulse = Math.sin(time / 140) * 0.18 + 0.82;
      ctx.shadowBlur = 14 * pulse;
      ctx.shadowColor = "#ffd700";

      ctx.fillStyle = "#1e1107";
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 14].forEach((offsetX) => {
        let coinX = barX + offsetX;
        let coinY = barY + barH / 2;

        ctx.fillStyle = "#b58700";
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(coinX, coinY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(coinX, coinY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#111116";
        ctx.beginPath();
        ctx.arc(coinX, coinY - 1.5, 2, 0, Math.PI * 2);
        ctx.rect(coinX - 1.2, coinY - 1, 2.4, 4);
        ctx.fill();
      });

      ctx.fillStyle = "#fff1a8";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#ffffff");
        fillGrad.addColorStop(0.3, "#ffd700");
        fillGrad.addColorStop(0.8, "#d4ac0d");
        fillGrad.addColorStop(1, "#b58700");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let gleamX = barX + ((time / 4) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.fillRect(gleamX, barY + 1, 6, barH - 2);
      }

      ctx.strokeStyle = "rgba(30, 17, 7, 0.9)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(notchX, barY - 1, 2, 0, Math.PI * 2);
        ctx.arc(notchX, barY + barH + 1, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#ffd700";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[TREASURY_HP: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#fff1a8";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#ffd700";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawCorrosiveAbominationBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 3.0 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 3.0 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.corrosive_abomination) || {
        title: "CORROSIVE ABOMINATION",
        subtitle: "TOXIC SLUDGE OVERSEER",
        primaryColor: "#2ecc71",
        secondaryColor: "#00ff88",
      };

      let pulse = Math.sin(time / 110) * 0.2 + 0.8;
      ctx.shadowBlur = 14 * pulse;
      ctx.shadowColor = "#2ecc71";

      ctx.fillStyle = "#091a10";
      ctx.strokeStyle = "#2ecc71";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 14].forEach((offsetX) => {
        let podX = barX + offsetX;
        let podY = barY + barH / 2;

        ctx.fillStyle = "#112618";
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(podX, podY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        let bubPulse = 4 + Math.sin(time / 120) * 1.5;
        ctx.fillStyle = "#a3fd83";
        ctx.beginPath();
        ctx.arc(podX, podY, bubPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "rgba(163, 253, 131, 0.4)";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#a3fd83");
        fillGrad.addColorStop(0.5, "#2ecc71");
        fillGrad.addColorStop(1, "#186a3b");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        for (let i = 0; i < 6; i++) {
          let bubbleProgress = (time / (120 + i * 20) + i * 40) % fillWidth;
          let bubbleX = barX + bubbleProgress;
          let bubbleY = barY + 3 + Math.sin(time / 100 + i) * 2;
          let bubbleRad = 1.2 + (i % 3) * 0.8;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, bubbleRad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = "rgba(9, 26, 16, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#a3fd83";
        ctx.fillRect(notchX - 1, barY - 2, 2, 3);
        ctx.fillRect(notchX - 1, barY + barH - 1, 2, 3);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#2ecc71";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[BIO_MASS: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#a3fd83";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#a3fd83";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawHooktailBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 3.5 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 3.5 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.hooktail) || {
        title: "HOOKTAIL",
        subtitle: "THE SCARLET DRAGON CALAMITY",
        primaryColor: "#ff3300",
        secondaryColor: "#e74c3c",
      };

      let pulse = Math.sin(time / 90) * 0.2 + 0.8;
      ctx.shadowBlur = 16 * pulse;
      ctx.shadowColor = "#ff3300";

      ctx.fillStyle = "#1c0404";
      ctx.strokeStyle = "#ff3300";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 6].forEach((offsetX, idx) => {
        let bracketX = barX + offsetX;
        let isLeft = idx === 0;

        ctx.fillStyle = "#5a0e0e";
        ctx.strokeStyle = "#ff3300";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(bracketX + 4, barY - 4);
          ctx.lineTo(bracketX - 6, barY + barH / 2);
          ctx.lineTo(bracketX + 4, barY + barH + 4);
          ctx.lineTo(bracketX, barY + barH / 2);
        } else {
          ctx.moveTo(bracketX, barY - 4);
          ctx.lineTo(bracketX + 10, barY + barH / 2);
          ctx.lineTo(bracketX, barY + barH + 4);
          ctx.lineTo(bracketX + 4, barY + barH / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffeaa7";
        ctx.beginPath();
        ctx.arc(
          bracketX + (isLeft ? -1 : 5),
          barY + barH / 2,
          1.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      ctx.fillStyle = "rgba(255, 234, 167, 0.45)";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#ffeaa7");
        fillGrad.addColorStop(0.4, "#ff5500");
        fillGrad.addColorStop(1, "#960018");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let sweepX = barX + ((time / 3) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillRect(sweepX, barY + 1, 5, barH - 2);

        for (let i = 0; i < 5; i++) {
          let sparkX = barX + ((time / (100 + i * 15) + i * 50) % fillWidth);
          let sparkY = barY + 2 + Math.sin(time / 80 + i) * 2;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sparkX, sparkY, 1.8, 1.8);
        }
      }

      ctx.strokeStyle = "rgba(28, 4, 4, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#ff3300";
        ctx.beginPath();
        ctx.moveTo(notchX - 2, barY - 2);
        ctx.lineTo(notchX + 2, barY - 2);
        ctx.lineTo(notchX, barY + 1);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(notchX - 2, barY + barH + 2);
        ctx.lineTo(notchX + 2, barY + barH + 2);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.closePath();
        ctx.fill();
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#ff3300";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[DRAGON_VITALITY: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#ffeaa7";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#ff5500";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawOverlordIronVaultBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 3.0 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 3.0 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let theme = (window.BOSS_BAR_THEMES &&
        window.BOSS_BAR_THEMES.overlord_iron_vault) || {
        title: "OVERLORD IRON VAULT",
        subtitle: "THE UNBREAKABLE STEEL OVERLORD",
        primaryColor: "#e67e22",
        secondaryColor: "#7f8c8d",
      };

      let pulse = Math.sin(time / 130) * 0.15 + 0.85;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = "#e67e22";

      ctx.fillStyle = "#151922";
      ctx.strokeStyle = "#7f8c8d";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [4]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#bdc3c7";
      [-14, barW + 10].forEach((rx) => {
        [barY, barY + barH - 2].forEach((ry) => {
          ctx.beginPath();
          ctx.arc(barX + rx, ry, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      [-14, barW + 6].forEach((offsetX, idx) => {
        let bracketX = barX + offsetX;
        let isLeft = idx === 0;

        ctx.fillStyle = "#2c3e50";
        ctx.strokeStyle = "#bdc3c7";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (isLeft) {
          ctx.moveTo(bracketX + 6, barY - 3);
          ctx.lineTo(bracketX - 6, barY + barH / 2);
          ctx.lineTo(bracketX + 6, barY + barH + 3);
          ctx.lineTo(bracketX + 2, barY + barH / 2);
        } else {
          ctx.moveTo(bracketX, barY - 3);
          ctx.lineTo(bracketX + 12, barY + barH / 2);
          ctx.lineTo(bracketX, barY + barH + 3);
          ctx.lineTo(bracketX + 4, barY + barH / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff5500";
        ctx.beginPath();
        ctx.arc(
          bracketX + (isLeft ? 0 : 6),
          barY + barH / 2,
          1.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      ctx.fillStyle = "#ffeaa7";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [2]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#ffeaa7");
        fillGrad.addColorStop(0.4, "#e67e22");
        fillGrad.addColorStop(0.8, "#d35400");
        fillGrad.addColorStop(1, "#2c3e50");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [2]);
        ctx.fill();

        let sweepX = barX + ((time / 4) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(sweepX, barY + 1, 5, barH - 2);
      }

      ctx.strokeStyle = "rgba(21, 25, 34, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#e67e22";
        ctx.fillRect(notchX - 1.5, barY - 2, 3, 3);
        ctx.fillRect(notchX - 1.5, barY + barH - 1, 3, 3);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || theme.title).toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#e67e22";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[ARMOR_INTEGRITY: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#ffeaa7";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#e67e22";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawStandardBossBar(
      ctx,
      target,
      hpPct,
      bHp,
      bMaxHp,
      barX,
      barY,
      barW,
      barH,
    ) {
      let time = Date.now();
      let isLowHp = hpPct < 0.2;
      let tremorX = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;
      let tremorY = isLowHp
        ? (Math.random() - 0.5) * 2.5 * (1.0 - hpPct / 0.2)
        : 0;

      ctx.save();
      ctx.translate(tremorX, tremorY);

      let pulse = Math.sin(time / 120) * 0.15 + 0.85;
      ctx.shadowBlur = 10 * pulse;
      ctx.shadowColor = "#e74c3c";

      ctx.fillStyle = "#111116";
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      [-14, barW + 6].forEach((offsetX) => {
        let bracketX = barX + offsetX;
        ctx.fillStyle = "#2c3e50";
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bracketX, barY - 1);
        ctx.lineTo(bracketX + 8, barY + barH / 2);
        ctx.lineTo(bracketX, barY + barH + 1);
        ctx.lineTo(bracketX - 4, barY + barH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.arc(bracketX + 2, barY + barH / 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#ffffff";
      let fillWidth = Math.max(0, barW * hpPct);
      let trailingWidth = Math.max(0, barW * target.trailingPct);
      if (trailingWidth > 0) {
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, trailingWidth, barH - 2, [3]);
        ctx.fill();
      }

      if (fillWidth > 0) {
        let fillGrad = ctx.createLinearGradient(
          barX,
          barY,
          barX + fillWidth,
          barY,
        );
        fillGrad.addColorStop(0, "#ff6b6b");
        fillGrad.addColorStop(0.5, "#e74c3c");
        fillGrad.addColorStop(1, "#960018");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let sweepX = barX + ((time / 5) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fillRect(sweepX, barY + 1, 5, barH - 2);
      }

      ctx.strokeStyle = "rgba(17, 17, 22, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(notchX - 1, barY - 1, 2, 2);
        ctx.fillRect(notchX - 1, barY + barH - 1, 2, 2);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.font = "900 12px monospace";

      let bossTitle = (target.name || "STAGE WARDEN").toUpperCase();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.5;
      ctx.strokeText(bossTitle, barX + barW / 2, barY - 6);
      ctx.fillStyle = "#e74c3c";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} HP (${(hpPct * 100).toFixed(1)}%)`;
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(hpStr, barX + barW / 2, barY + barH + 4);

      if (target.funnyTextTimer > 0 && target.funnyText) {
        target.funnyTextTimer--;
        ctx.font = "900 12px 'Arial Black', Impact, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeText(target.funnyText, barX + barW / 2, barY + barH / 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(target.funnyText, barX + barW / 2, barY + barH / 2);
      }

      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 16,
        target.bleedStacks || 0,
        "#e74c3c",
      );
      this.drawStatusDots(
        ctx,
        barX + (barW - 55) / 2,
        barY + barH + 24,
        target.poisonStacks || 0,
        "#2ecc71",
      );

      ctx.restore();
    }

    drawStatusDots(ctx, startX, y, stacks, color) {
      if (stacks <= 0) return;
      let dotSize = 2.0;
      let dotSpacing = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
          startX + i * (dotSize * 2 + dotSpacing) + dotSize,
          y,
          dotSize,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = i < stacks ? color : "rgba(44, 62, 80, 0.7)";
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  window.combatVisuals = new CombatVisualsEngine();

  // Initialize central RenderEngine Namespace
  window.RenderEngine = {
    getStageTier() {
      let st = window.playerStats.stage;
      if (st <= 100) return 0; // Forest (Stages 1-100)
      if (st <= 200) return 1; // Peaks/Ruins (Stages 101-200)
      if (st <= 300) return 2; // Inferno (Stages 201-300)
      if (st <= 400) return 3; // Swamp (Stages 301-400)
      if (st <= 500) return 4; // Void (Stages 401-500)
      if (st <= 600) return 5; // Temporal Sanctorum (Stages 501-600)
      if (st <= 700) return 6; // Cyberspace Nexus (Stages 601-700)

      // Deterministic pseudorandom cycle every 100 stages after Stage 700
      let blockIndex = Math.floor((st - 1) / 100); // e.g. 7 for Stages 701-800, 8 for 801-900
      let seedVal = Math.sin(blockIndex) * 10000;
      return Math.floor((seedVal - Math.floor(seedVal)) * 7); // Deterministically returns 0 to 6
    },
  };

  // Legacy Compatibility Aliases to protect references
  window.getStageTier = () => window.RenderEngine.getStageTier();

  // --- VISUAL EFFECT & PARTICLE SPAWNERS ---

  // Append spawnHitSparks & spawnDeathParticles inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnHitSparks(x, y, isCrit = false, dirX = 1, dirY = 0) {
      if (
        window.playerStats &&
        window.playerStats.ecoMode &&
        window.particles.length > 120
      )
        return;
      if (window.particles.length > 250) return;
      let count = isCrit ? 10 : 5;
      if (window.playerStats && window.playerStats.ecoMode) {
        count = Math.max(2, Math.floor(count * 0.4));
      }
      let baseAngle = Math.atan2(dirY, dirX);
      let colors = isCrit
        ? ["#ffffff", "#ffd700", "#ff4757"]
        : ["#ffffff", "#eccc68", "#f1c40f"];

      for (let i = 0; i < count; i++) {
        let spread = (Math.random() - 0.5) * (Math.PI * 0.65);
        let angle = baseAngle + spread;
        let speed = window.randFloat(3.0, isCrit ? 8.0 : 5.5);
        let life = window.randInt(10, 22);

        window.particles.push(
          window.ParticlePool.get(
            x,
            y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            window.randFloat(1.2, isCrit ? 3.2 : 2.2),
            colors[Math.floor(Math.random() * colors.length)],
            1.0,
            life,
            life,
            0.15,
            true,
          ),
        );
      }
    },

    spawnDeathParticles(x, y, mobType) {
      if (window.playerStats.ecoMode && window.particles.length > 100) return;
      if (window.particles.length > 200) return;
      let count = 15;
      if (window.playerStats && window.playerStats.ecoMode) {
        count = Math.max(2, Math.floor(count * 0.25)); // 75% fewer death debris elements in Eco Mode
      }
      let colors = ["#2ecc71", "#27ae60", "#a3fd83"]; // Default Slime Green
      let speed = 4;

      // Dynamically match debris colors to the exact monster type / theme
      if (window.mob) {
        let vType = window.mob.visualType;
        let isGoldDungeon =
          window.playerStats.currentDungeon === "gold" &&
          window.playerStats.isDungeonMode;
        let isMatDungeon =
          window.playerStats.currentDungeon === "mat" &&
          window.playerStats.isDungeonMode;
        let isEquipDungeon =
          window.playerStats.currentDungeon === "equip" &&
          window.playerStats.isDungeonMode;

        if (isGoldDungeon) {
          colors = window.PARTICLE_THEMES.gold_dungeon;
        } else if (isMatDungeon) {
          colors = window.PARTICLE_THEMES.mat_dungeon;
        } else if (isEquipDungeon) {
          colors = window.PARTICLE_THEMES.equip_dungeon;
        } else if (vType && window.PARTICLE_THEMES[vType]) {
          colors = window.PARTICLE_THEMES[vType];
        } else if (window.mob.type && window.PARTICLE_THEMES[window.mob.type]) {
          colors = window.PARTICLE_THEMES[window.mob.type];
        } else if (
          mobType === "rift_guardian" ||
          mobType === "void_spectre" ||
          mobType === "void_crawler" ||
          mobType === "void_orb"
        ) {
          count = 45;
          colors = window.PARTICLE_THEMES.void_orb;
          speed = 6;
        } else if (mobType === "boss" || mobType === "dungeon_boss") {
          count = 40;
          colors = ["#e74c3c", "#e67e22", "#f1c40f", "#ffffff"];
          speed = 7;
        } else if (mobType === "prestige_boss") {
          count = 60;
          colors = window.PARTICLE_THEMES.prestige_boss;
          speed = 8;
        } else if (mobType === "dungeon_miniboss") {
          count = 25;
          colors = ["#1abc9c", "#16a085", "#34495e"];
          speed = 5;
        } else {
          let tier = window.getStageTier();
          if (tier === 1) colors = window.PARTICLE_THEMES.tier1;
          else if (tier === 2) colors = window.PARTICLE_THEMES.tier2;
          else if (tier === 3) colors = window.PARTICLE_THEMES.tier3;
          else if (tier === 4) colors = window.PARTICLE_THEMES.tier4;
        }
      }

      for (let i = 0; i < count; i++) {
        let angle = Math.random() * Math.PI * 2;
        let velocity = window.randFloat(1, speed);
        let randLife = window.randInt(25, 45);
        window.particles.push(
          window.ParticlePool.get(
            x,
            y,
            Math.cos(angle) * velocity,
            Math.sin(angle) * velocity - window.randFloat(1, 3),
            window.randFloat(1.5, 4.5),
            colors[Math.floor(Math.random() * colors.length)],
            1,
            randLife,
            randLife,
            undefined,
            true,
          ),
        );
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnDeathParticles = (x, y, mobType) =>
    window.RenderEngine.spawnDeathParticles(x, y, mobType);

  // Append spawnTemperParticles inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnTemperParticles(isSuccess) {
      let cvs = document.getElementById("gameCanvas");
      let w = cvs ? cvs.width : 750;
      let h = cvs ? cvs.height : 250;
      let colors = isSuccess
        ? ["#f1c40f", "#2ecc71", "#ffffff"]
        : ["#7f8c8d", "#c0392b", "#2c3e50"];

      for (let i = 0; i < 50; i++) {
        window.particles.push(
          window.ParticlePool.get(
            w / 2,
            h / 2,
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
            Math.random() * 4 + 1.5,
            colors[Math.floor(Math.random() * colors.length)],
            1,
            isSuccess ? 45 : 30,
          ),
        );
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnTemperParticles = (isSuccess) =>
    window.RenderEngine.spawnTemperParticles(isSuccess);

  // Append spawnPurchaseCelebration inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnPurchaseCelebration(theme, color, rarity) {
      if (window.playerStats.ecoMode && window.particles.length > 100) return;
      if (window.particles.length > 200) return;
      let cvs = document.getElementById("gameCanvas");
      let spawnX = cvs ? cvs.width / 2 : 375;
      let spawnY = cvs ? cvs.height / 2 : 125;

      let count = 25;
      if (window.playerStats && window.playerStats.ecoMode) {
        count = Math.max(5, Math.floor(count * 0.25)); // 75% fewer celebration elements in Eco Mode
      }
      let speed = 5;
      let text = "✦ PURCHASED! ✦";

      if (theme === "gacha") {
        count = 55;
        speed = 8;
        text = "✦ DISPENSED! ✦";
      } else if (theme === "altar") {
        count = 65;
        speed = 11;
        text = "✦ RIFT OPENED! ✦";
      } else if (theme === "alchemy") {
        count = 20;
        speed = 4;
        text = "✦ BREWED! ✦";
      } else if (theme === "mail") {
        count = 35;
        speed = 6;
        text = "✦ GIFT CLAIMED! ✦";
      } else if (theme === "paragon") {
        count = 75;
        speed = 12;
        text = "✦ MATRIX INFUSED! ✦";
      } else if (theme === "upgrade") {
        count = 45;
        speed = 7;
        text = "✦ ATTUNEMENT AWAKENED! ✦";
      }

      if (rarity === 5 || rarity === "UNIQUE") {
        count = Math.floor(count * 2.5);
        speed *= 1.4;
        text =
          rarity === "UNIQUE" ? "✨ UNIQUE TROPHY! ✨" : "🔥 MYTHIC PULL! 🔥";
      } else if (rarity === 4) {
        count = Math.floor(count * 1.8);
        speed *= 1.2;
        text = "🌟 LEGENDARY PULL! 🌟";
      }

      for (let i = 0; i < count; i++) {
        window.particles.push(
          window.ParticlePool.get(
            spawnX + window.randFloat(-15, 15),
            spawnY + window.randFloat(-10, 10),
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.7) * speed - 2.5,
            window.randFloat(
              1.5,
              rarity === 5 || rarity === "UNIQUE" ? 5.0 : 3.5,
            ),
            color || "#f1c40f",
            1,
            window.randInt(25, 60),
          ),
        );
      }

      window.effects.push({
        x: spawnX - 70,
        y: spawnY - 15,
        text: text,
        color: color || "#f1c40f",
        life: 80,
      });

      if (
        rarity === 5 ||
        rarity === 4 ||
        rarity === "UNIQUE" ||
        theme === "altar"
      ) {
        window.beams.push({
          x: spawnX,
          color: color || "#f1c40f",
          life: 50,
          maxLife: 50,
        });
        if (cvs) {
          cvs.classList.add("shake");
          setTimeout(() => cvs.classList.remove("shake"), 400);
        }
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnPurchaseCelebration = (theme, color, rarity) =>
    window.RenderEngine.spawnPurchaseCelebration(theme, color, rarity);

  // Append spawnDamageEffect inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    spawnDamageEffect(
      x,
      y,
      amount,
      type = "slash",
      isCrit = false,
      targetObj = null,
    ) {
      if (typeof x !== "number" || typeof y !== "number") {
        isCrit = !!amount;
        type = y || "slash";
        amount = x;

        if (
          window.mob &&
          window.mob.hp &&
          window.mob.hp.gt &&
          window.mob.hp.gt(0)
        ) {
          x = window.mob.x + window.mob.w / 2;
          y = window.mob.y + window.mob.h / 2;
          targetObj = window.mob;
        } else if (window.player) {
          x = window.player.x;
          y = window.player.y - 12;
          targetObj = window.player;
        } else {
          return;
        }
      }

      if (window.combatVisuals) {
        window.combatVisuals.spawnDamageEffect(
          x,
          y,
          amount,
          type,
          isCrit,
          targetObj,
        );
        if (isCrit) {
          window.combatVisuals.triggerScreenShake(4, 8);
        }
      }
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.spawnDamageEffect = (amount, type, isCrit) =>
    window.RenderEngine.spawnDamageEffect(amount, type, isCrit);

  // Append renderNemesisPreview inside window.RenderEngine
  Object.assign(window.RenderEngine, {
    renderNemesisPreview(mobData) {
      if (window.nemesisAnimFrameId) {
        cancelAnimationFrame(window.nemesisAnimFrameId);
        window.nemesisAnimFrameId = null;
      }

      const dCanvas = document.getElementById("death-enemy-canvas");
      if (!dCanvas) return;
      const dCtx = dCanvas.getContext("2d");

      if (!mobData) {
        dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);
        dCtx.fillStyle = "#c0392b";
        dCtx.font = "bold 11px monospace";
        dCtx.textAlign = "center";
        dCtx.textBaseline = "middle";
        dCtx.fillText("[NO TARGET]", dCanvas.width / 2, dCanvas.height / 2);
        return;
      }

      let renderMob = { ...mobData };
      renderMob.flashTimer = 0;

      let maxDim = Math.max(renderMob.w, renderMob.h);
      let scale = maxDim > 0 ? (dCanvas.width * 0.8) / maxDim : 1.0;

      function animLoop() {
        let summaryModal = document.getElementById("summary-modal");
        if (!summaryModal || summaryModal.style.display === "none") {
          window.nemesisAnimFrameId = null;
          return;
        }

        dCtx.clearRect(0, 0, dCanvas.width, dCanvas.height);
        dCtx.save();
        dCtx.translate(dCanvas.width / 2, dCanvas.height / 2);
        dCtx.scale(scale, scale);
        dCtx.translate(
          -(renderMob.x + renderMob.w / 2),
          -(renderMob.y + renderMob.h / 2),
        );
        window.RenderEngine.drawSingleMob(dCtx, renderMob);
        dCtx.restore();

        window.nemesisAnimFrameId = requestAnimationFrame(animLoop);
      }

      animLoop();
    },
  });

  // Legacy Compatibility Aliases to protect references
  window.renderNemesisPreview = (mobData) =>
    window.RenderEngine.renderNemesisPreview(mobData);

  // --- CORE MOB DRAWING ENGINE ---

  // Bind high-performance delegated proxy method to window.RenderEngine
  window.RenderEngine.drawSingleMob = (c, m) => window.drawSingleMob(c, m);

  window.drawSingleMob = function (c, m) {
    if (!m) return;
    let t = m.visualTier;
    let rx = m.recoilX || 0;
    let ry = m.recoilY || 0;
    let facing = m.facing !== undefined ? m.facing : -1;

    c.save();
    c.translate(rx, ry);

    if (facing === 1) {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      c.translate(cx, cy);
      c.scale(-1, 1);
      c.translate(-cx, -cy);
    }

    // Ground Drop Shadow & Elite Aura Pass
        c.save();
        let mCx = m.x + m.w / 2;
        let mCy = m.y + m.h - 2;
        let mobShadowW = m.w * 0.45;
        let mobShadowH = Math.max(3, m.h * 0.15);

        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(mCx, mCy, mobShadowW, mobShadowH, 0, 0, Math.PI * 2);
        c.fill();

        // Render Blood Berserker Death Detonation Warning Circle
        if (m.isDetonating && m.detonationTimer > 0) {
          let pulse = Math.sin(Date.now() / 50) * 4;
          c.strokeStyle = "#e74c3c";
          c.lineWidth = 2.0;
          c.setLineDash([6, 4]);
          c.beginPath();
          c.arc(mCx, mCy - m.h / 2, 100 + pulse, 0, Math.PI * 2);
          c.stroke();
          c.setLineDash([]);

          c.fillStyle = "rgba(231, 76, 60, 0.12)";
          c.beginPath();
          c.arc(mCx, mCy - m.h / 2, 100 + pulse, 0, Math.PI * 2);
          c.fill();
        }

        // Render Elite Commander Ground Runic Aura Ring & Laser Tethers
        if (m.eliteAffix) {
          let auraColor = "#00d2ff";
          let buffKey = "haste";

          if (m.eliteAffix === "vitality_weaver") { auraColor = "#2ecc71"; buffKey = null; }
          else if (m.eliteAffix === "iron_citadel") { auraColor = "#3498db"; buffKey = "def"; }
          else if (m.eliteAffix === "swift_commander") { auraColor = "#00d2ff"; buffKey = "haste"; }
          else if (m.eliteAffix === "blood_berserker") { auraColor = "#e74c3c"; buffKey = "atk"; }
          else if (m.eliteAffix === "nullifier") { auraColor = "#a855f7"; buffKey = null; }

          let rot = (Date.now() / 400) % (Math.PI * 2);
          c.strokeStyle = auraColor;
          c.lineWidth = 1.8;
          c.setLineDash([4, 4]);
          c.save();
          c.translate(mCx, mCy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, m.w * 0.9, m.w * 0.45, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Draw Translucent Laser Tether Links to Buffed Minion Allies
          if (buffKey && window.activeDungeonMobs) {
            c.strokeStyle = auraColor;
            c.lineWidth = 1.2;
            c.globalAlpha = 0.35;
            c.setLineDash([2, 2]);

            window.activeDungeonMobs.forEach((m2) => {
              if (m2 === m || !m2.buffStacks || (m2.buffStacks[buffKey] || 0) <= 0) return;
              let m2Cx = m2.x + (m2.w || 24) / 2;
              let m2Cy = m2.y + (m2.h || 24) / 2;

              c.beginPath();
              c.moveTo(mCx, mCy - m.h / 2);
              c.lineTo(m2Cx, m2Cy);
              c.stroke();
            });
            c.setLineDash([]);
            c.globalAlpha = 1.0;
          }
        }
        c.restore();

    let penWidth =
      m.type === "boss" ||
      m.type === "dungeon_boss" ||
      m.type === "prestige_boss" ||
      m.type === "rift_guardian" ||
      m.type === "aegis_goliath" ||
      m.type === "chronos_arbitrator" ||
      m.type === "nexus_overseer"
        ? 2.4
        : 1.8;
    c.strokeStyle = "#000000";
    c.lineWidth = penWidth;
    c.lineJoin = "round";

    if (m.flashTimer > 0) {
      c.fillStyle = "#ffffff";
    } else {
      c.fillStyle =
        m.type === "boss" ||
        m.type === "dungeon_boss" ||
        m.type === "dungeon_miniboss"
          ? "#34495e"
          : "#555";
    }

    if (m.type === "mob") {
      if (m.isRare) {
        c.save();
        let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
        let auraGrad = c.createRadialGradient(
          m.x + m.w / 2,
          m.y + m.h / 2,
          2,
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
        );
        auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
        auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.restore();
      }

      let vType = m.visualType;
      if (!vType) {
        let fallbacks = {
          0: "slime",
          1: "golem",
          2: "magma_elemental",
          3: "marsh_ghost",
          4: "void_orb",
        };
        vType = fallbacks[t] || "slime";
      }

      if (vType === "slime") {
        let squish = Math.sin(Date.now() / 100) * 2.0;
        let wScale = (m.w / 2) * 0.7 + squish;
        let hScale = (m.h / 2) * 0.7 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 6 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else if (m.isRare) {
          slimeGrad.addColorStop(0, "#ffeaa7");
          slimeGrad.addColorStop(1, "#f1c40f");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#2ecc71");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.15, hScale * 0.95, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.6)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.4,
            cy - hScale * 0.4,
            wScale * 0.25,
            hScale * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.save();
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 2.5;
          c.beginPath();
          let stemTopY = cy - hScale * 0.95;
          c.moveTo(cx, stemTopY);
          c.quadraticCurveTo(cx - 2, stemTopY - 8, cx + 4, stemTopY - 12);
          c.stroke();

          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.ellipse(
            cx + 4,
            stemTopY - 12,
            5,
            2.5,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.strokeStyle = "#000000";
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();

          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.3;
          let eyeOffsetY = hScale * 0.1;
          let eyeRadius = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(
            cx - eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.arc(
            cx + eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.strokeStyle = "#1e272e";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(cx, cy + hScale * 0.05, wScale * 0.12, 0, Math.PI);
          c.stroke();

          c.fillStyle = "rgba(231, 76, 60, 0.4)";
          c.beginPath();
          c.ellipse(
            cx - eyeOffsetX - 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.ellipse(
            cx + eyeOffsetX + 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "coin_elemental") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 150) * 3;

        // Precompute coordinates and depth state for the 6 orbiting gold coins
        let coinsList = [];
        for (let i = 0; i < 6; i++) {
          let angle = Date.now() / 600 + (i * Math.PI * 2) / 6;
          let dist = 18 + Math.sin(Date.now() / 150 + i) * 3;
          let ox = cx + Math.cos(angle) * dist * 1.3;
          let oy = cy + Math.sin(angle) * dist * 0.5;
          let isBehind = Math.sin(angle) < 0; // True if positioned behind core

          let rot = angle * 2;
          let cw = 6 * Math.abs(Math.sin(rot));
          let ch = 6;

          coinsList.push({ ox, oy, cw, ch, isBehind });
        }

        let drawCoinPiece = (cn) => {
          c.save();
          c.translate(cn.ox, cn.oy);
          c.rotate(Math.PI / 12);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.ellipse(0, 0, cn.cw + 1.2, cn.ch + 1.2, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.beginPath();
            c.ellipse(0, 0, cn.cw, cn.ch, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#b7950b";
            c.lineWidth = 0.8;
            c.beginPath();
            c.ellipse(0, 0, cn.cw * 0.8, cn.ch * 0.8, 0, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.beginPath();
            c.ellipse(
              -cn.cw * 0.3,
              -cn.ch * 0.3,
              cn.cw * 0.25,
              cn.ch * 0.2,
              Math.PI / 4,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        };

        // 1. Draw BACK half of orbiting rings first (Math.PI to 2*Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();
        c.restore();

        // 2. Draw BACK coins
        coinsList.forEach((cn) => {
          if (cn.isBehind) drawCoinPiece(cn);
        });

        // 3. Draw central glowing nucleus core
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 10);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#ffd700");
        coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();

        // 4. Draw FRONT half of orbiting rings (0 to Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();
        c.restore();

        // 5. Draw FRONT coins
        coinsList.forEach((cn) => {
          if (!cn.isBehind) drawCoinPiece(cn);
        });
      } else if (vType === "hoard_mimic") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let snap = Math.abs(Math.sin(time / 200));
        let lidAngle = -snap * 0.45;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18";
        c.beginPath();
        c.rect(cx - 15, cy - 8, 30, 16);
        c.fill();
        c.stroke();

        c.fillStyle = "#ffd700";
        c.beginPath();
        c.ellipse(cx, cy - 8, 12, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#ffd700";
        c.strokeStyle = "#4d2e1a";
        c.lineWidth = 1;
        for (let i = -12; i <= 12; i += 6) {
          c.beginPath();
          c.moveTo(cx + i - 2, cy - 8 - lidAngle * 10);
          c.lineTo(cx + i, cy - 4 - lidAngle * 10);
          c.lineTo(cx + i + 2, cy - 8 - lidAngle * 10);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(cx + i - 2, cy - 8);
          c.lineTo(cx + i, cy - 11);
          c.lineTo(cx + i + 2, cy - 8);
          c.closePath();
          c.fill();
          c.stroke();
        }

        if (m.flashTimer === 0) {
          let tSway = Math.sin(time / 80) * 6;
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 3.5;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(cx, cy - 8);
          c.quadraticCurveTo(
            cx - 6 + tSway / 2,
            cy - 12,
            cx - 12 + tSway,
            cy - 16,
          );
          c.stroke();
          c.fillStyle = "#8e44ad";
          c.beginPath();
          c.arc(cx - 12 + tSway, cy - 16, 2, 0, Math.PI * 2);
          c.fill();
        }

        c.save();
        c.translate(cx + 15, cy - 8);
        c.rotate(lidAngle);
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.beginPath();
        c.rect(-30, -10, 30, 10);
        c.fill();
        c.stroke();
        c.fillStyle = "#7f8c8d";
        c.fillRect(-17, -10, 4, 10);
        c.strokeRect(-17, -10, 4, 10);
        c.fillStyle = "#ffd700";
        c.fillRect(-16, -2, 2, 5);
        c.strokeRect(-16, -2, 2, 5);
        c.restore();

        if (
          snap > 0.6 &&
          Math.random() < 0.1 &&
          window.particles.length < 250 &&
          !window.isGamePaused
        ) {
          window.particles.push({
            x: cx + window.randFloat(-8, 8),
            y: cy - 9,
            vx: window.randFloat(-1, 1),
            vy: -window.randFloat(1, 2.5),
            radius: window.randFloat(1, 2),
            color: "#ffd700",
            alpha: 0.9,
            life: window.randInt(15, 30),
          });
        }
      } else if (vType === "gilded_scuttler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let legWalk = Math.sin(time / 60) * 3;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
        c.lineWidth = 2.4;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 12;
          c.beginPath();
          c.moveTo(legX, cy + 4);
          c.lineTo(legX + i * 6 + legWalk * i, cy + 12);
          c.stroke();

          c.beginPath();
          c.moveTo(legX - i * 4, cy + 4);
          c.lineTo(legX - i * 10 - legWalk * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.ellipse(cx - 10, cy - 2, 4, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx - 12, cy - 2);
        c.quadraticCurveTo(cx - 18, cy - 8 + legWalk, cx - 22, cy - 4);
        c.quadraticCurveTo(cx - 16, cy, cx - 12, cy - 2);
        c.fill();
        c.stroke();

        let sAngle = Math.PI / 12 + Math.sin(time / 150) * 0.05;
        c.save();
        c.translate(cx + 2, cy - 2);
        c.rotate(sAngle);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#967507";
        c.beginPath();
        c.arc(0, 0, 13.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#b7950b";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(0, 0, 10, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-4, -4);
          c.lineTo(4, 4);
          c.moveTo(4, -4);
          c.lineTo(-4, 4);
          c.moveTo(0, -5);
          c.lineTo(0, 5);
          c.stroke();

          c.fillStyle = "rgba(255, 255, 255, 0.8)";
          c.beginPath();
          c.arc(-5, -5, 2, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.beginPath();
          c.arc(cx - 12, cy - 3, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "golem") {
        let hover = Math.sin(Date.now() / 120) * 2.5;
        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d"; // Granite grey
        let trimColor = m.flashTimer > 0 ? "#ffffff" : "#95a5a6"; // Light stone
        let runeColor = m.isRare ? "#ff007f" : "#00d2ff"; // Glowing sapphire

        // Levitating Stone Shoulders
        c.fillStyle = trimColor;
        c.beginPath();
        c.roundRect(m.x + 2, m.y + 2 + hover, 6, 8, [1]);
        c.roundRect(m.x + m.w - 8, m.y + 2 + hover, 6, 8, [1]);
        c.fill();
        c.stroke();

        // Main Granite Torso
        c.fillStyle = bodyColor;
        c.beginPath();
        c.roundRect(m.x + 3, m.y + 12 + hover, m.w - 6, m.h - 14, [6]);
        c.fill();
        c.stroke();

        // Chiseled Head
        c.fillStyle = trimColor;
        c.beginPath();
        c.roundRect(m.x + 6, m.y + 4 + hover, m.w - 12, 10, [2]);
        c.fill();
        c.stroke();

        // Glowing Core Eye
        if (m.flashTimer === 0) {
          c.fillStyle = runeColor;
          c.shadowBlur = 8;
          c.shadowColor = runeColor;
          c.beginPath();
          c.rect(m.x + 9, m.y + 8 + hover, m.w - 18, 2.5);
          c.fill();
          c.shadowBlur = 0;
        }

        // Giant Fists
        c.fillStyle = bodyColor;
        c.beginPath();
        c.roundRect(m.x - 5, m.y + 14 + hover, 8, 12, [3]);
        c.roundRect(m.x + m.w - 3, m.y + 14 + hover, 8, 12, [3]);
        c.fill();
        c.stroke();

        // Crystals on Fists
        c.fillStyle = runeColor;
        c.beginPath();
        c.arc(m.x - 1, m.y + 18 + hover, 1.5, 0, Math.PI * 2);
        c.arc(m.x + m.w + 1, m.y + 18 + hover, 1.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Crystal geode core fissure
        if (m.flashTimer === 0) {
          c.strokeStyle = runeColor;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(m.x + m.w / 2, m.y + 15 + hover);
          c.lineTo(m.x + m.w / 2, m.y + m.h - 11 + hover);
          c.moveTo(m.x + m.w / 2 - 3, m.y + 21 + hover);
          c.lineTo(m.x + m.w / 2 + 3, m.y + 21 + hover);
          c.stroke();
        }
      } else if (vType === "wyrmling") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
        let bodyColor =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#8e44ad" : "#3498db"; // Sky blue scale
        let ringColor = m.isRare ? "#ff007f" : "rgba(255, 255, 255, 0.55)"; // Swirling frost

        // Segmented winged body drakes
        for (let i = 3; i >= 0; i--) {
          let segX = cx + i * 8;
          let segY = cy + Math.sin(Date.now() / 150 - i) * 5;

          // Swirling icy particles orbiting the segmented tail
          if (m.flashTimer === 0) {
            c.strokeStyle = ringColor;
            c.lineWidth = 1.2;
            c.save();
            c.translate(segX, segY);
            c.rotate(Date.now() / 250 + i);
            c.beginPath();
            c.ellipse(0, 0, 11 - i * 1.5, 4 - i * 0.5, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
          }

          c.fillStyle = bodyColor;
          c.beginPath();
          c.arc(segX, segY, 8.5 - i * 1.3, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        // Feathered Drake Head
        c.fillStyle = bodyColor;
        c.beginPath();
        c.arc(cx, cy - 13, 8.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // White beak/horns
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.moveTo(cx - 3, cy - 20);
        c.lineTo(cx, cy - 26);
        c.lineTo(cx + 3, cy - 20);
        c.closePath();
        c.fill();
        c.stroke();

        // Sub-zero frost vapors
        if (m.flashTimer === 0) {
          c.fillStyle = "#81ecec";
          c.shadowBlur = 6;
          c.shadowColor = "#81ecec";
          c.beginPath();
          c.arc(cx - 3, cy - 14, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 14, 1.5, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;

          if (Math.random() < 0.15 && !window.isGamePaused) {
            window.particles.push({
              x: cx + window.randFloat(-5, 5),
              y: cy - 14,
              vx: -window.randFloat(1, 3),
              vy: window.randFloat(-1, 1),
              radius: window.randFloat(1, 2.2),
              color: m.isRare ? "#ff007f" : "#ffffff",
              alpha: 0.85,
              life: window.randInt(12, 22),
            });
          }
        }
      } else if (vType === "rift_drifter") {
        let hover = Math.sin(Date.now() / 110) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 12);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, "#e84393");
        coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8e44ad";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          let angle = Date.now() / 180 + (i * Math.PI * 2) / 3;
          let sx = cx + Math.cos(angle) * 16;
          let sy = cy + Math.sin(angle) * 8;
          c.beginPath();
          c.moveTo(sx, sy - 4);
          c.lineTo(sx + 3, sy);
          c.lineTo(sx, sy + 4);
          c.lineTo(sx - 3, sy);
          c.closePath();
          c.fill();
          c.stroke();
        }
      } else if (vType === "star_weaver") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 130) * 4;
        c.save();
        c.strokeStyle = "#3498db";
        c.lineWidth = 1.8;
        c.shadowBlur = 10;
        c.shadowColor = "#3498db";
        c.beginPath();
        c.moveTo(cx, cy - 12);
        c.lineTo(cx + 10, cy);
        c.lineTo(cx + 6, cy + 10);
        c.lineTo(cx - 6, cy + 10);
        c.lineTo(cx - 10, cy);
        c.closePath();
        c.stroke();
        c.fillStyle = "#ffffff";
        let joints = [
          [cx, cy - 12],
          [cx + 10, cy],
          [cx + 6, cy + 10],
          [cx - 6, cy + 10],
          [cx - 10, cy],
        ];
        joints.forEach((j) => {
          c.beginPath();
          c.arc(j[0], j[1], 2.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        });
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let legYOffset = i < 2 ? -4 : 4;
          let swing = Math.sin(Date.now() / 80 + i) * 6;
          c.beginPath();
          c.moveTo(cx + 10 * side, cy + legYOffset);
          c.lineTo(cx + 22 * side + swing, cy + legYOffset - 4);
          c.lineTo(cx + 26 * side + swing, cy + legYOffset + 14);
          c.stroke();
        }
        c.restore();
      } else if (vType === "void_wraith") {
        let hover = Math.sin(Date.now() / 150) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 - 2 + hover;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b0a2a";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(cx, cy - 16);
        c.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy + 14);
        c.lineTo(cx - 4, cy + 8);
        c.lineTo(cx, cy + 18);
        c.lineTo(cx + 4, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.quadraticCurveTo(cx + 13, cy - 6, cx, cy - 16);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(Date.now() / 100) * 3;
          c.beginPath();
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 16 + clawSwing, cy + 4);
          c.lineTo(cx - 20 + clawSwing, cy + 1);
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 17 + clawSwing, cy + 7);
          c.stroke();
          c.fillStyle = "#e84393";
          c.shadowBlur = 6;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.ellipse(cx - 3, cy - 5, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 1, cy - 5, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
      } else if (vType === "sprout") {
        let squish = Math.sin(Date.now() / 110) * 1.5;
        let wScale = (m.w / 2 + squish) * 0.65;
        let hScale = (m.h / 2 - squish) * 0.65;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 4;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
        c.beginPath();
        c.ellipse(
          cx,
          cy - hScale * 0.4,
          wScale * 0.65,
          hScale * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.22;
          let eyeY = cy - hScale * 0.45;
          let eyeSize = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(231, 76, 60, 0.45)";
          c.beginPath();
          c.ellipse(cx - eyeOffsetX - 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.ellipse(cx + eyeOffsetX + 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.fill();
        }
        let capY = cy - hScale * 1.05;
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f1c40f" : "#ff6b1a";
        c.beginPath();
        c.ellipse(cx, capY, wScale * 1.25, hScale * 0.85, 0, Math.PI, 0);
        c.lineTo(cx + wScale * 1.25, capY + hScale * 0.1);
        c.quadraticCurveTo(
          cx,
          capY + hScale * 0.4,
          cx - wScale * 1.25,
          capY + hScale * 0.1,
        );
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.5)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.5,
            capY - hScale * 0.35,
            wScale * 0.3,
            hScale * 0.15,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "thorn_wyrm") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 130;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          c.beginPath();
          c.moveTo(segX, segY + 2);
          c.lineTo(segX - 2, segY + 7 + Math.sin(time * 2 + i) * 2);
          c.stroke();
        }
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#e67e22" : "#27ae60";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#f1c40f" : "#1e8449";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.quadraticCurveTo(
              segX + 3,
              segY - radius - 4,
              segX,
              segY - radius - 5,
            );
            c.quadraticCurveTo(
              segX - 2,
              segY - radius - 2,
              segX - 1,
              segY - radius,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f39c12" : "#2ecc71";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3;
        c.beginPath();
        c.arc(hX, hY, 6.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = m.isRare ? "#ffea75" : "#2ecc71";
          c.beginPath();
          c.moveTo(hX - 2, hY - 5);
          c.quadraticCurveTo(hX - 7, hY - 10, hX - 9, hY - 9);
          c.quadraticCurveTo(hX - 5, hY - 4, hX - 1, hY - 4);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(hX - 2.5, hY - 1, 1.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#1e272e";
          c.beginPath();
          c.arc(hX - 3, hY - 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "gargoyle") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let wings = Math.sin(Date.now() / 90) * 11;
        let skinColor = m.flashTimer > 0 ? "#ffffff" : "#4a5568"; // Moss-gray ruins stone
        let wingColor = m.flashTimer > 0 ? "#ffffff" : "#2f3640"; // Weathered slate
        let eyeColor = m.isRare ? "#00ffff" : "#f39c12"; // Glowing amber

        // Weathered chiseled ruin wings
        c.fillStyle = wingColor;
        c.beginPath();
        c.moveTo(cx - 3, cy);
        c.lineTo(cx - 24, cy - 14 + wings);
        c.lineTo(cx - 18, cy + 4);
        c.lineTo(cx - 22, cy + 12);
        c.lineTo(cx - 8, cy + 5);
        c.closePath();
        c.moveTo(cx + 3, cy);
        c.lineTo(cx + 24, cy - 14 + wings);
        c.lineTo(cx + 18, cy + 4);
        c.lineTo(cx + 22, cy + 12);
        c.lineTo(cx + 8, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // Main moss-grown stone torso
        c.fillStyle = skinColor;
        c.beginPath();
        c.ellipse(cx, cy + 6, 8.5, 11.5, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Mossy patches
        if (m.flashTimer === 0) {
          c.fillStyle = "#164d1f";
          c.beginPath();
          c.ellipse(cx - 3, cy + 3, 3, 4, Math.PI / 4, 0, Math.PI * 2);
          c.ellipse(cx + 4, cy + 8, 2.5, 3, -Math.PI / 4, 0, Math.PI * 2);
          c.fill();
        }

        // Masonry Head
        c.fillStyle = skinColor;
        c.beginPath();
        c.arc(cx, cy - 10, 7.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Chiseled horns
        c.fillStyle = wingColor;
        c.beginPath();
        c.moveTo(cx - 6, cy - 14);
        c.quadraticCurveTo(cx - 12, cy - 22, cx - 14, cy - 20);
        c.lineTo(cx - 2, cy - 12);
        c.closePath();
        c.moveTo(cx + 6, cy - 14);
        c.quadraticCurveTo(cx + 12, cy - 22, cx + 14, cy - 20);
        c.lineTo(cx + 2, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();

        // Glowing Amber Eyes
        if (m.flashTimer === 0) {
          c.fillStyle = eyeColor;
          c.shadowBlur = 6;
          c.shadowColor = eyeColor;
          c.beginPath();
          c.arc(cx - 2.5, cy - 11, 1.6, 0, Math.PI * 2);
          c.arc(cx + 2.5, cy - 11, 1.6, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }

        // Wields a tiny weathered stone relic greatsword
        c.fillStyle = "#95a5a6";
        c.beginPath();
        c.moveTo(cx - 10, cy + 2);
        c.lineTo(cx - 22, cy + 12);
        c.lineTo(cx - 19, cy + 15);
        c.lineTo(cx - 7, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // Weathered hilt inscription
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ffd700";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(cx - 13, cy + 5);
          c.lineTo(cx - 18, cy + 10);
          c.stroke();
        }
      } else if (vType === "magma_elemental") {
        let flicker = Math.sin(Date.now() / 60) * 3;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0805";
        c.beginPath();
        c.roundRect(cx - 14, cy - 6, 28, 22, [4]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ff5500";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - 6, cy);
          c.stroke();
        }
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.moveTo(cx - 14, cy);
        c.quadraticCurveTo(cx - 24 - flicker, cy + 4, cx - 20, cy + 12);
        c.lineTo(cx - 11, cy + 6);
        c.moveTo(cx + 14, cy);
        c.quadraticCurveTo(cx + 24 + flicker, cy + 4, cx + 20, cy + 12);
        c.lineTo(cx + 11, cy + 6);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d110b";
        c.beginPath();
        c.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#e67e22";
        c.beginPath();
        c.moveTo(cx - 6, cy - 18);
        c.quadraticCurveTo(cx, cy - 28 - flicker, cx + 6, cy - 18);
        c.quadraticCurveTo(cx + 3, cy - 12, cx - 3, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "lava_serpent") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 140;
        if (
          Math.random() < 0.15 &&
          window.particles.length < 200 &&
          !window.isGamePaused
        ) {
          window.particles.push({
            x: cx + window.randFloat(0, 15),
            y: cy - 6,
            vx: -window.randFloat(0.5, 1.5),
            vy: -window.randFloat(1, 2.5),
            radius: window.randFloat(1, 2),
            color: "rgba(230, 126, 34, 0.4)",
            alpha: 0.8,
            life: window.randInt(15, 30),
          });
        }
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff8c00" : "#1c0905";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ffffff" : "#ff3300";
            c.beginPath();
            c.arc(segX, segY, radius * 0.45, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#2c110c";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 2, segY - radius - 3);
            c.lineTo(segX - 3, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff4500" : "#110200";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 6, hY - 6);
        c.lineTo(hX - 7, hY - 5);
        c.lineTo(hX - 8, hY + 1);
        c.lineTo(hX + 6, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#e67e22";
          c.beginPath();
          c.moveTo(hX + 2, hY - 5);
          c.quadraticCurveTo(hX + 7, hY - 11, hX + 10, hY - 10);
          c.lineTo(hX + 3, hY - 2);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 1, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "hell_bat") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 3;
        let batWing = Math.sin(Date.now() / 70) * 11;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e1f26";
        c.beginPath();
        c.ellipse(cx, cy, 7, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#962d22";
        c.beginPath();
        c.moveTo(cx - 5, cy - 2);
        c.quadraticCurveTo(
          cx - 18,
          cy - 12 - batWing,
          cx - 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx - 12, cy, cx - 5, cy - 2);
        c.moveTo(cx + 5, cy - 2);
        c.quadraticCurveTo(
          cx + 18,
          cy - 12 - batWing,
          cx + 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx + 12, cy, cx + 5, cy - 2);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ff6b6b";
          c.beginPath();
          c.arc(cx - 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.arc(cx + 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "swamp_basilisk") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 150;
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#1a3a22";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ff007f" : "#9b59b6";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 1, segY - radius - 4);
            c.lineTo(segX - 2, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#122c19";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 7, hY - 7);
        c.lineTo(hX - 8, hY - 3);
        c.lineTo(hX - 7, hY + 4);
        c.lineTo(hX + 7, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(hX - 6, hY - 1);
          c.lineTo(hX - 8, hY + 2);
          c.lineTo(hX - 4, hY + 1);
          c.closePath();
          c.fill();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "toxic_fly") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 4;
        let wing = Math.sin(Date.now() / 60) * 11;
        c.fillStyle = "rgba(46, 204, 113, 0.4)";
        c.beginPath();
        c.ellipse(cx - 7, cy - 4, 5, 12 + wing, -Math.PI / 4, 0, Math.PI * 2);
        c.ellipse(cx + 7, cy - 4, 5, 12 + wing, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71";
        c.beginPath();
        c.ellipse(cx, cy + 9, 5, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      } else if (vType === "marsh_ghost") {
        // Render a wispy, translucent, floating swamp phantom
        let hover = Math.sin(Date.now() / 140) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Translucent glowing trail
        let glowTime = Date.now() / 200;
        let trailGrad = c.createLinearGradient(cx, cy - 10, cx, cy + 22);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(46, 204, 113, 0.7)");
          trailGrad.addColorStop(0.5, "rgba(155, 89, 182, 0.4)");
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 12, cy - 4);
        c.quadraticCurveTo(cx - 16, cy + 8, cx - 4, cy + 22);
        c.lineTo(cx + 4, cy + 22);
        c.quadraticCurveTo(cx + 16, cy + 8, cx + 12, cy - 4);
        c.closePath();
        c.fill();

        // Wispy spirit head
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111a14";
        c.strokeStyle = "#000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 10, 9, Math.PI, 0);
        c.lineTo(cx + 9, cy + 2);
        c.quadraticCurveTo(cx + 6, cy + 8, cx, cy + 12);
        c.quadraticCurveTo(cx - 6, cy + 8, cx - 9, cy + 2);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          // Glowing swamp eyes
          c.fillStyle = "#55efc4";
          c.shadowBlur = 6;
          c.shadowColor = "#55efc4";
          c.beginPath();
          c.arc(cx - 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
        c.restore();
      } else if (vType === "void_orb") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 800;

        // 1. Draw BACK segment of the gravity ring first (Math.PI to 2*Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, Math.PI, 0); // Upper arc (behind core)
          c.stroke();
          c.restore();
        }

        // 2. Draw Void Orb core sphere
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the gravity ring last (0 to Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, 0, Math.PI); // Lower arc (in front of core)
          c.stroke();
          c.restore();
        }
      } else if (vType === "void_crawler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 150;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          c.beginPath();
          c.moveTo(segX, segY + 1);
          c.lineTo(segX - 3, segY + 9 + Math.sin(time * 3.5 + i) * 2.5);
          c.stroke();
        }
        for (let i = 6; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#1a022b";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.strokeStyle = "#8e44ad";
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(segX - 1, segY - radius + 2);
            c.lineTo(segX + 1, segY - radius + 2);
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#11001c";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.arc(hX, hY, 6.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(hX - 2, hY - 4);
          c.quadraticCurveTo(
            hX - 9,
            hY - 9 + Math.sin(time * 3) * 2.5,
            hX - 14,
            hY - 6 + Math.sin(time * 3) * 2.5,
          );
          c.stroke();
          c.fillStyle = "#ff007f";
          c.beginPath();
          c.arc(hX - 3, hY - 2, 1.0, 0, Math.PI * 2);
          c.arc(hX - 1, hY - 1, 0.8, 0, Math.PI * 2);
          c.arc(hX - 3, hY + 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "void_spectre") {
        // Render a floating ethereal void phantom cloaked in cosmic energy
        let hover = Math.sin(Date.now() / 150) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Swirling Void Aura Backplate (Translucent glowing trail)
        let trailGrad = c.createLinearGradient(cx, cy - 14, cx, cy + 24);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(142, 68, 173, 0.75)"); // Deep void purple
          trailGrad.addColorStop(0.5, "rgba(232, 67, 147, 0.4)"); // Hot magenta pink
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 14, cy - 5);
        c.quadraticCurveTo(cx - 18, cy + 10, cx - 5, cy + 24);
        c.lineTo(cx + 5, cy + 24);
        c.quadraticCurveTo(cx + 18, cy + 10, cx + 14, cy - 5);
        c.closePath();
        c.fill();

        // Main cloaked phantom torso (Wispy obsidian hood/robes)
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a"; // Pitch void black
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 11, 8.5, Math.PI, 0); // Hood crown
        c.lineTo(cx + 8.5, cy + 4);
        c.quadraticCurveTo(cx + 5, cy + 12, cx, cy + 16); // Robe trail point
        c.quadraticCurveTo(cx - 5, cy + 12, cx - 8.5, cy + 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Spooky glowing eyes inside the dark hood
        if (m.flashTimer === 0) {
          c.fillStyle = "#e84393"; // Intense magenta neon
          c.shadowBlur = 8;
          c.shadowColor = "#e84393";
          c.beginPath();
          // Slanted sinister phantom slits
          c.ellipse(cx - 3, cy - 10, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 3, cy - 10, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0; // Reset
        }

        // Claws of the Spectre (Floating segmented dark arms on sides)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(Date.now() / 110) * 3;
          // Left Claw
          c.beginPath();
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 16 + clawSwing, cy - 1);
          c.lineTo(cx - 19 + clawSwing, cy - 4);
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 17 + clawSwing, cy + 3);
          c.stroke();
          // Right Claw
          c.beginPath();
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 16 - clawSwing, cy - 1);
          c.lineTo(cx + 19 - clawSwing, cy - 4);
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 17 - clawSwing, cy + 3);
          c.stroke();
        }
        c.restore();
      } else if (vType === "clockwork_scarab") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
        c.beginPath();
        c.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(cx, cy - 9);
          c.lineTo(cx, cy + 9);
          c.stroke();
          c.save();
          c.translate(cx, cy);
          c.rotate((Date.now() / 1500) % (Math.PI * 2));
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(0, 0, 4, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.restore();
        }
        c.strokeStyle = "#7a5c1f";
        c.lineWidth = 1.8;
        for (let i = -1; i <= 1; i += 2) {
          let legSwing = Math.sin(Date.now() / 80 + i) * 3;
          c.beginPath();
          c.moveTo(cx + 6 * i, cy);
          c.lineTo(cx + 14 * i + legSwing, cy + 6);
          c.stroke();
          c.beginPath();
          c.moveTo(cx + 6 * i, cy - 4);
          c.lineTo(cx + 15 * i + legSwing, cy - 6);
          c.stroke();
        }
      } else if (vType === "neon_spider") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
        c.lineWidth = 2.0;
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let yDir = i < 2 ? -1 : 1;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + 12 * side, cy + 4 * yDir);
          c.lineTo(cx + 16 * side, cy + 14 * yDir);
          c.stroke();
        }
      } else if (vType === "wireframe_orb") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
        c.lineWidth = 1.5;
        c.save();
        c.translate(cx, cy);
        c.rotate(Date.now() / 600);
        c.strokeRect(-10, -10, 20, 20);
        c.restore();
      } else if (vType === "animated_armor") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        if (m.flashTimer === 0) {
          c.save();
          c.strokeStyle = "rgba(0, 210, 255, 0.4)";
          c.lineWidth = 4;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";
          c.beginPath();
          c.roundRect(cx - 14, cy - 14, 28, 30, [4]);
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.ellipse(cx - 18, cy - 8, 7, 5, -Math.PI / 6, 0, Math.PI * 2);
        c.ellipse(cx + 18, cy - 8, 7, 5, Math.PI / 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(cx - 12, cy - 12);
        c.lineTo(cx + 12, cy - 12);
        c.lineTo(cx + 9, cy + 12);
        c.lineTo(cx - 9, cy + 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#00d2ff";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx, cy - 8);
          c.lineTo(cx, cy + 8);
          c.moveTo(cx - 4, cy);
          c.lineTo(cx + 4, cy);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
        c.beginPath();
        c.roundRect(cx - 8, cy - 28, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.fillRect(cx - 5, cy - 22, 10, 2.5);
        }

        c.save();
        c.translate(cx + 12, cy + 6);
        c.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.05);
        c.fillStyle = "rgba(0, 210, 255, 0.25)";
        c.strokeStyle = "#00d2ff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-2, 0);
        c.lineTo(2, 0);
        c.lineTo(1.5, -24);
        c.lineTo(-1.5, -24);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      } else if (vType === "cursed_blade") {
        let hover = Math.sin(Date.now() / 110) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 500;

        c.save();
        c.translate(cx, cy);
        c.rotate(rot);

        if (
          m.flashTimer === 0 &&
          !window.isGamePaused &&
          Math.random() < 0.2 &&
          window.particles.length < 250
        ) {
          window.particles.push(
            window.ParticlePool.get(
              cx + window.randFloat(-15, 15),
              cy + window.randFloat(-15, 15),
              window.randFloat(-0.5, 0.5),
              -window.randFloat(1, 2),
              window.randFloat(1.5, 3),
              "#9b59b6",
              0.8,
              window.randInt(15, 30),
            ),
          );
        }

        if (m.flashTimer === 0) {
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#9b59b6";
          c.strokeStyle = "rgba(155, 89, 182, 0.3)";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-3, -22);
          c.lineTo(3, -22);
          c.lineTo(4, 12);
          c.lineTo(-4, 12);
          c.closePath();
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111116";
        c.beginPath();
        c.moveTo(-4, -16);
        c.lineTo(0, -22);
        c.lineTo(4, -14);
        c.lineTo(3.5, 12);
        c.lineTo(-3.5, 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#e84393";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(-2, -6);
          c.lineTo(2, -2);
          c.lineTo(-1, 4);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.beginPath();
        c.roundRect(-8, 12, 16, 4, [1]);
        c.fill();
        c.stroke();

        c.fillStyle = "#4a154b";
        c.fillRect(-2, 16, 4, 10);
        c.strokeRect(-2, 16, 4, 10);

        c.fillStyle = "#9b59b6";
        c.beginPath();
        c.arc(0, 27, 2.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
      } else if (vType === "mimic_shield") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let breathe = Math.sin(time / 140) * 2;
        let eyeBlink = Math.sin(time / 800);

        c.save();
        c.translate(cx, cy);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.moveTo(-16, -16);
        c.lineTo(16, -16);
        c.lineTo(18, 2);
        c.lineTo(0, 22);
        c.lineTo(-18, 2);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-13, -13);
        c.lineTo(13, -13);
        c.lineTo(15, 1);
        c.lineTo(0, 18);
        c.lineTo(-15, 1);
        c.closePath();
        c.stroke();

        let mouthOpen = Math.max(1, 3.5 + breathe);
        c.fillStyle = "#110202";
        c.beginPath();
        c.ellipse(0, 2, 8, mouthOpen, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#f1c40f";
        c.strokeStyle = "#000000";
        c.lineWidth = 1;
        let tOffsets = [-5, -2, 2, 5];
        tOffsets.forEach((dx) => {
          c.beginPath();
          c.moveTo(dx - 1.2, 2 - mouthOpen);
          c.lineTo(dx, 2 - mouthOpen + 3);
          c.lineTo(dx + 1.2, 2 - mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(dx - 1.2, 2 + mouthOpen);
          c.lineTo(dx, 2 + mouthOpen - 3);
          c.lineTo(dx + 1.2, 2 + mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();
        });

        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.ellipse(0, -7, 6, 4, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (eyeBlink > -0.85) {
            c.fillStyle = "#e74c3c";
            c.beginPath();
            c.arc(0, -7, 2.5, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, -7, 0.8, 2.2, 0, 0, Math.PI * 2);
            c.fill();
          } else {
            c.strokeStyle = "#000";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-6, -7);
            c.lineTo(6, -7);
            c.stroke();
          }
        }

        c.restore();
      } else if (vType === "slag_slime") {
        let squish = Math.sin(Date.now() / 100) * 3.5;
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#27ae60");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.2, hScale * 0.9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (
          m.flashTimer === 0 &&
          !window.isGamePaused &&
          Math.random() < 0.25
        ) {
          let bY = cy - hScale * 0.7;
          let bX = cx + window.randFloat(-wScale * 0.5, wScale * 0.5);
          c.fillStyle = "rgba(46, 204, 113, 0.6)";
          c.beginPath();
          c.arc(bX, bY, window.randFloat(2, 4), 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        if (m.flashTimer === 0) {
          c.fillStyle = "#7f8c8d";
          c.beginPath();
          c.moveTo(cx - 4, cy - 2);
          c.lineTo(cx + 4, cy - 5);
          c.lineTo(cx + 2, cy + 3);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#110202";
          let eyeOffsetX = wScale * 0.35;
          let eyeOffsetY = hScale * 0.1;
          c.beginPath();
          c.arc(cx - eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#1e272e";
          c.fillRect(cx - 8, cy + hScale * 0.3, 3, 5);
          c.fillRect(cx + 4, cy + hScale * 0.2, 2, 4);
        }
      } else if (vType === "rust_nibbler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let legSway = Math.sin(time / 80) * 4;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.lineWidth = 2.2;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 10;
          c.beginPath();
          c.moveTo(legX, cy + 2);
          c.lineTo(legX + i * 8 + legSway * i, cy + 12);
          c.stroke();
          c.beginPath();
          c.moveTo(legX, cy + 2);
          c.lineTo(legX - i * 8 - legSway * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.ellipse(cx, cy, 14, 8, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.strokeStyle = "#000";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(cx - 6, cy - 7);
        c.lineTo(cx - 6, cy + 7);
        c.moveTo(cx, cy - 8);
        c.lineTo(cx, cy + 8);
        c.moveTo(cx + 6, cy - 7);
        c.lineTo(cx + 6, cy + 7);
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21";
        c.beginPath();
        c.arc(cx + 12, cy - 1, 5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#e67e22";
        c.lineWidth = 1.5;
        let antSway = Math.sin(time / 100) * 3;
        c.beginPath();
        c.moveTo(cx + 15, cy - 3);
        c.quadraticCurveTo(
          cx + 20,
          cy - 10 + antSway,
          cx + 24,
          cy - 8 + antSway,
        );
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx + 14, cy - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "corroded_golem") {
        let hover = Math.sin(Date.now() / 130) * 2;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 15, cy - 10, 30, 20, [3]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(cx - 8, cy - 4);
          c.lineTo(cx - 2, cy + 2);
          c.lineTo(cx + 6, cy - 6);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e";
        c.beginPath();
        c.arc(cx - 18, cy - 6, 6, 0, Math.PI * 2);
        c.arc(cx + 18, cy - 6, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(cx - 15, cy + 2);
          c.quadraticCurveTo(cx - 22, cy + 12, cx - 18, cy + 18);
          c.moveTo(cx + 15, cy + 2);
          c.quadraticCurveTo(cx + 22, cy + 12, cx + 18, cy + 18);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 22, cy + 14, 8, 8, [2]);
        c.roundRect(cx + 14, cy + 14, 8, 8, [2]);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 8, cy - 24, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.shadowBlur = 8;
          c.shadowColor = "#2ecc71";
          c.fillRect(cx - 6, cy - 18, 12, 3);
          c.shadowBlur = 0;
        }
      }

      if (m.isRare) {
        c.save();
        let glowTime = Date.now() / 200;
        let hx = m.x + m.w / 2;
        let hy = m.y - 10 + Math.sin(glowTime) * 2.5;
        c.strokeStyle = "#f1c40f";
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(hx, hy, 11, 3.2, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#ffffff";
        for (let i = 0; i < 3; i++) {
          let sparkAngle = glowTime + i * ((Math.PI * 2) / 3);
          let sx = hx + Math.cos(sparkAngle) * 11;
          let sy = hy + Math.sin(sparkAngle) * 3.2;
          c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
        }
        c.restore();
      }
    } else if (m.type === "rift_guardian" || m.type === "aegis_goliath") {
      let hover = Math.sin(Date.now() / 150) * 8;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;
      c.save();
      c.translate(cx, cy);
      for (let i = 0; i < 3; i++) {
        let pulseScale = 1.0 + Math.sin(Date.now() / 250 + i * 2) * 0.12;
        let rot = Date.now() / 1200 + (i * Math.PI) / 3;
        let size = 45 * pulseScale;
        c.save();
        c.rotate(rot);
        c.strokeStyle =
          m.flashTimer > 0 ? "#ffffff" : "rgba(52, 152, 219, 0.45)";
        c.lineWidth = 1.5;
        c.beginPath();
        for (let side = 0; side < 6; side++) {
          let angle = (side * Math.PI) / 3;
          c.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        c.closePath();
        c.stroke();
        c.restore();
      }
      c.save();
      c.strokeStyle = "#2c3e50";
      c.lineWidth = 2.5;
      for (let i = -1; i <= 1; i += 2) {
        let chainSway = Math.sin(Date.now() / 300 + i * 1.5) * 4;
        c.beginPath();
        c.moveTo(i * 20, -50);
        c.quadraticCurveTo(i * 25, 0, i * 15 + chainSway, 30);
        c.stroke();
      }
      c.restore();
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -18);
      c.lineTo(16, -18);
      c.lineTo(22, -4);
      c.lineTo(0, 24);
      c.lineTo(-22, -4);
      c.lineTo(-16, -18);
      c.closePath();
      c.fill();
      c.stroke();
      if (m.flashTimer === 0) {
        let pulseRad = 6 + Math.sin(Date.now() / 100) * 1.5;
        let runicGlow = c.createRadialGradient(0, -2, 1, 0, -2, pulseRad + 8);
        runicGlow.addColorStop(0, "#ffffff");
        runicGlow.addColorStop(0.3, "#2ecc71");
        runicGlow.addColorStop(0.8, "#3498db");
        runicGlow.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = runicGlow;
        c.beginPath();
        c.arc(0, -2, pulseRad + 8, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -10);
        c.lineTo(0, 6);
        c.moveTo(-7, -2);
        c.lineTo(7, -2);
        c.stroke();
      }
      for (let i = 0; i < 3; i++) {
        let angle = Date.now() / 300 + (i * Math.PI * 2) / 3;
        let px = Math.cos(angle) * 35;
        let py = Math.sin(angle) * 12;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#34495e";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(px - 5, py - 7, 10, 14, [2]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.arc(px, py, 1.8, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
    } else if (m.type === "chronos_arbitrator") {
      let hover = Math.sin(Date.now() / 200) * 8;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;
      c.save();
      c.translate(cx, cy);
      let drawVectorGear = (ctx, x, y, radius, teeth, rot, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : color;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < teeth; i++) {
          let teethAngle = (i * Math.PI * 2) / teeth;
          ctx.save();
          ctx.rotate(teethAngle);
          ctx.beginPath();
          ctx.rect(-3, -radius - 3, 6, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = "#111116";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
        for (let i = 0; i < 4; i++) {
          let angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * (radius * 0.6),
            Math.sin(angle) * (radius * 0.6),
            2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      };
      drawVectorGear(
        c,
        -35,
        -28,
        22,
        10,
        -((Date.now() / 400) % (Math.PI * 2)),
        "#7f8c8d",
      );
      drawVectorGear(
        c,
        38,
        24,
        25,
        12,
        ((Date.now() / 500) % (Math.PI * 2)) + 0.5,
        "#d35400",
      );
      drawVectorGear(
        c,
        0,
        0,
        44,
        16,
        (Date.now() / 1500) % (Math.PI * 2),
        "#f1c40f",
      );
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -25);
      c.quadraticCurveTo(-20, -20, -20, 0);
      c.lineTo(-12, 28);
      c.lineTo(12, 28);
      c.lineTo(20, 0);
      c.quadraticCurveTo(20, -20, 0, -25);
      c.closePath();
      c.fill();
      c.stroke();
      if (m.flashTimer === 0) {
        c.strokeStyle = "#1a0f02";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-10, -10);
        c.lineTo(-4, -4);
        c.lineTo(-8, 2);
        c.moveTo(10, -8);
        c.lineTo(6, -2);
        c.stroke();
        c.fillStyle = "#ffffff";
        c.shadowBlur = 8;
        c.shadowColor = "#f1c40f";
        c.beginPath();
        c.arc(-6, -5, 3, 0, Math.PI * 2);
        c.arc(6, -5, 3, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
      c.strokeStyle = "#111116";
      c.lineWidth = 2.5;
      c.lineCap = "round";
      let hrAngle = Date.now() / 10000;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
      c.stroke();
      let minAngle = Date.now() / 1800;
      c.strokeStyle = "#d35400";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24);
      c.stroke();
      c.restore();
    } else if (m.type === "nexus_overseer") {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
      let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0);
      let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
      c.save();
      c.translate(px, py);
      c.rotate(Date.now() / 800);
      c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
      c.lineWidth = 2.0;
      let cycle = Math.floor(Date.now() / 5000) % 3;
      if (cycle === 0) {
        c.strokeRect(-18, -18, 36, 36);
        c.strokeRect(-12, -12, 24, 24);
        c.beginPath();
        c.moveTo(-18, -18);
        c.lineTo(-12, -12);
        c.moveTo(18, -18);
        c.lineTo(12, -12);
        c.moveTo(-18, 18);
        c.lineTo(-12, 12);
        c.moveTo(18, 18);
        c.lineTo(12, 12);
        c.stroke();
      } else if (cycle === 1) {
        c.beginPath();
        c.moveTo(0, -22);
        c.lineTo(-18, 14);
        c.lineTo(18, 14);
        c.closePath();
        c.moveTo(0, -22);
        c.lineTo(0, 18);
        c.lineTo(-18, 14);
        c.moveTo(0, 18);
        c.lineTo(18, 14);
        c.stroke();
      } else {
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          let angle = (i * Math.PI * 2) / 5;
          c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
        }
        c.closePath();
        c.stroke();
      }
      if (m.flashTimer === 0) {
        let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
        c.fillStyle = "#00b894";
        c.beginPath();
        c.arc(0, 0, eyePulse, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = "#ff007f";
        c.fillRect(-1.2, -4, 2.4, 8);
      }
      c.restore();
    } else if (
      m.type === "dungeon_boss" ||
      m.type === "gilded_vault_keeper" ||
      m.type === "corrosive_abomination" ||
      m.type === "overlord_iron_vault" ||
      m.visualType === "gilded_vault_keeper" ||
      m.visualType === "corrosive_abomination" ||
      m.visualType === "overlord_iron_vault"
    ) {
      let bounce = 0;
      let coreColor = "#9b59b6";
      let glowColor = "#e84393";
      let shadowColor = "#1a052e";
      if (m.isCrucible) {
        bounce = Math.sin(Date.now() / 150) * 4;
        coreColor = m.flashTimer > 0 ? "#ffffff" : "#9b59b6";
        let rot1 = Date.now() / 700;
        let rot2 = -Date.now() / 500;

        // 1. Draw BACK segment of the core orbital rings first (angles Math.PI to 2*Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Back segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        // Ring 2 Back segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.restore();

        // 2. Draw Main Boss Torso
        c.fillStyle = shadowColor;
        c.beginPath();
        c.moveTo(m.x + m.w / 2, m.y + bounce);
        c.lineTo(m.x + m.w, m.y + m.h * 0.4 + bounce);
        c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x, m.y + m.h * 0.4 + bounce);
        c.closePath();
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;
        c.stroke();

        if (m.flashTimer === 0) {
          let coreRadius = 8 + Math.sin(Date.now() / 100) * 3;
          c.fillStyle = coreColor;
          c.shadowBlur = 12;
          c.shadowColor = coreColor;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 - 10 + bounce,
            coreRadius,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();
          c.shadowBlur = 0;
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(m.x + m.w / 2, m.y + m.h / 2 - 10 + bounce, 3, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#2c3e50";
        c.beginPath();
        c.moveTo(m.x + m.w * 0.3, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.1,
          m.y - 15 + bounce,
          m.x + m.w * 0.05,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.4, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(m.x + m.w * 0.7, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.9,
          m.y - 15 + bounce,
          m.x + m.w * 0.95,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.6, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the core orbital rings last (angles 0 to Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Front segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        // Ring 2 Front segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.restore();
      } else {
        let dType = window.playerStats.currentDungeon || "gold";
        if (dType === "gold") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cy = by + bh - 5;

          let coinRows = [
            { y: cy, count: 9, size: 10, shift: 0 },
            { y: cy - 5, count: 7, size: 9, shift: 6 },
            { y: cy - 10, count: 5, size: 9, shift: 12 },
            { y: cy - 15, count: 3, size: 8, shift: 18 },
          ];

          coinRows.forEach((row) => {
            let startX = bx + row.shift;
            let spacing = (bw - row.shift * 2) / (row.count + 1);
            for (let i = 1; i <= row.count; i++) {
              let coinX = startX + i * spacing + Math.sin(row.y + i * 2) * 2;
              let coinY = row.y;
              let scaleW = row.size;
              let scaleH = row.size * 0.45;
              let angle = Math.sin(coinX * 0.05) * 0.25;

              c.save();
              c.translate(coinX, coinY);
              c.rotate(angle);

              c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#916900";
              c.beginPath();
              c.ellipse(0, 0, scaleW + 0.8, scaleH + 0.8, 0, 0, Math.PI * 2);
              c.fill();
              c.stroke();

              if (m.flashTimer === 0) {
                let goldGrad = c.createLinearGradient(
                  -scaleW,
                  -scaleH,
                  scaleW,
                  scaleH,
                );
                goldGrad.addColorStop(0, "#fff1a8");
                goldGrad.addColorStop(0.5, "#ffd700");
                goldGrad.addColorStop(1, "#b58700");
                c.fillStyle = goldGrad;
                c.beginPath();
                c.ellipse(0, 0, scaleW, scaleH, 0, 0, Math.PI * 2);
                c.fill();

                c.strokeStyle = "#805c00";
                c.lineWidth = 0.8;
                c.beginPath();
                c.ellipse(
                  0,
                  0,
                  scaleW * 0.78,
                  scaleH * 0.78,
                  0,
                  0,
                  Math.PI * 2,
                );
                c.stroke();

                c.fillStyle = "rgba(255, 255, 255, 0.85)";
                c.beginPath();
                c.ellipse(
                  -scaleW * 0.35,
                  -scaleH * 0.35,
                  scaleW * 0.22,
                  scaleH * 0.18,
                  Math.PI / 4,
                  0,
                  Math.PI * 2,
                );
                c.fill();
              }
              c.restore();
            }
          });

          let hover = Math.sin(Date.now() / 150) * 4;
          let idolX = bx + bw / 2;
          let idolY = cy - 28 + hover;
          let time = Date.now();

          // 1. DRAW GIANT SHIELD/SWORD WINGS BEHIND
          let wingFlap = Math.sin(time / 120) * 0.12;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b"; // Golden/Bronze shields
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;

          for (let side = -1; side <= 1; side += 2) {
            c.save();
            c.translate(idolX + side * 12, idolY - 4);
            c.rotate(side * (Math.PI / 6 + wingFlap));

            // Draw shield wing
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(side * 36, -15);
            c.lineTo(side * 28, 12);
            c.lineTo(side * 32, 25);
            c.lineTo(side * 8, 15);
            c.closePath();
            c.fill();
            c.stroke();

            // Shiny inner plate on shield
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
            c.beginPath();
            c.moveTo(side * 4, -2);
            c.lineTo(side * 32, -13);
            c.lineTo(side * 25, 10);
            c.closePath();
            c.fill();
            c.stroke();

            c.restore();
          }

          // 2. DRAW THE ANCIENT TREASURY CHEST BODY (Golem Torso)
          let lidAngle = -Math.abs(Math.sin(time / 240)) * 0.35; // Chest snapping open/close

          // Draw Lower Chest Box
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18"; // Mahogany wood
          c.beginPath();
          c.roundRect(idolX - 16, idolY - 4, 32, 18, [3]);
          c.fill();
          c.stroke();

          // Iron Corner Bands on the box
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#333339";
          c.fillRect(idolX - 16, idolY - 4, 4, 18);
          c.strokeRect(
            m.flashTimer > 0 ? idolX - 16 : idolX - 16,
            idolY - 4,
            4,
            18,
          );
          c.fillRect(idolX + 12, idolY - 4, 4, 18);
          c.strokeRect(
            m.flashTimer > 0 ? idolX + 12 : idolX + 12,
            idolY - 4,
            4,
            18,
          );

          // 3. DRAW GLOWING RUBY SOUL-CORE (Inside Mouth / Chest Opening)
          if (m.flashTimer === 0) {
            let corePulse = 6 + Math.sin(time / 90) * 2;
            let coreGrad = c.createRadialGradient(
              idolX,
              idolY - 4,
              1,
              idolX,
              idolY - 4,
              corePulse,
            );
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.3, "#ff0055"); // Ruby Core
            coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(idolX, idolY - 4, corePulse + 6, 0, Math.PI * 2);
            c.fill();

            // Draw jagged golden teeth lining the chest rims
            c.fillStyle = "#f1c40f";
            let teethX = [-12, -6, 0, 6, 12];
            teethX.forEach((dx) => {
              // Upper hanging teeth (on the lid, rotates with it)
              c.save();
              c.translate(idolX, idolY - 4);
              c.rotate(lidAngle);
              c.beginPath();
              c.moveTo(dx - 1.8, 0);
              c.lineTo(dx, 4);
              c.lineTo(dx + 1.8, 0);
              c.closePath();
              c.fill();
              c.stroke();
              c.restore();

              // Lower teeth (static)
              c.beginPath();
              c.moveTo(idolX + dx - 1.8, idolY - 4);
              c.lineTo(idolX + dx, idolY - 7);
              c.lineTo(idolX + dx + 1.8, idolY - 4);
              c.closePath();
              c.fill();
              c.stroke();
            });
          }

          // 4. DRAW CHEST LID (Pivoting Head)
          c.save();
          c.translate(idolX, idolY - 4);
          c.rotate(lidAngle);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21"; // Bright mahogany
          c.beginPath();
          c.roundRect(-16, -11, 32, 11, [4, 4, 1, 1]);
          c.fill();
          c.stroke();

          // Gilded decorative bands on lid
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.fillRect(-15, -11, 3, 11);
          c.strokeRect(-15, -11, 3, 11);
          c.fillRect(12, -11, 3, 11);
          c.strokeRect(12, -11, 3, 11);

          // Giant Gold lock latch
          c.fillRect(-2, -3, 4, 6);
          c.strokeRect(-2, -3, 4, 6);
          c.fillStyle = "#111";
          c.beginPath();
          c.arc(0, 0, 1.2, 0, Math.PI * 2);
          c.fill();

          // Floating Crown of Gold bars above the lid
          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.shadowBlur = 8;
            c.shadowColor = "#ffd700";
            c.beginPath();
            c.moveTo(-8, -15);
            c.lineTo(-12, -21);
            c.lineTo(-6, -18);
            c.lineTo(0, -26); // Tall center point
            c.lineTo(6, -18);
            c.lineTo(12, -21);
            c.lineTo(8, -15);
            c.closePath();
            c.fill();
            c.stroke();
            c.shadowBlur = 0;
          }

          c.restore();

          // 5. GIANT CLAW ARMS (Made of fused gold bars)
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          let armSwing = Math.sin(time / 100) * 4;

          // Left Arm
          c.beginPath();
          c.roundRect(idolX - 26 + armSwing, idolY + 1, 7, 12, [2]);
          c.fill();
          c.stroke();
          // Left Claws
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.beginPath();
          c.moveTo(idolX - 26 + armSwing, idolY + 13);
          c.lineTo(idolX - 29 + armSwing, 18 + idolY);
          c.lineTo(idolX - 23 + armSwing, idolY + 13);
          c.closePath();
          c.fill();
          c.stroke();

          // Right Arm
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.roundRect(idolX + 19 - armSwing, idolY + 1, 7, 12, [2]);
          c.fill();
          c.stroke();
          // Right Claws
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
          c.beginPath();
          c.moveTo(idolX + 19 - armSwing, idolY + 13);
          c.lineTo(idolX + 22 - armSwing, 18 + idolY);
          c.lineTo(idolX + 26 - armSwing, idolY + 13);
          c.closePath();
          c.fill();
          c.stroke();

          // 6. REAL-TIME EMBER AND SPARK EMISSION
          if (
            !window.isGamePaused &&
            Math.random() < 0.22 &&
            window.particles.length < 250
          ) {
            window.particles.push({
              x: idolX + window.randFloat(-10, 10),
              y: idolY + 4,
              vx: window.randFloat(-1.8, 1.8),
              vy: -window.randFloat(1.2, 3.2),
              radius: window.randFloat(2, 4.2),
              color: Math.random() > 0.4 ? "#f1c40f" : "#ff5500", // Gold and lava sparks
              alpha: 0.95,
              life: window.randInt(25, 45),
            });
          }
        } else if (dType === "mat") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cx = bx + bw / 2;
          let cy = by + bh - 10;
          let time = Date.now();

          c.save();
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "rgba(39, 174, 96, 0.4)";
          c.beginPath();
          c.ellipse(cx, cy, bw * 0.75, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          let wpRot = (time / 180) % (Math.PI * 2);
          c.strokeStyle = "rgba(46, 204, 113, 0.8)";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(wpRot);
          c.beginPath();
          c.ellipse(0, 0, bw * 0.6, 6, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          c.save();
          c.translate(cx, cy);
          c.rotate(-wpRot * 1.5);
          c.beginPath();
          c.ellipse(0, 0, bw * 0.4, 4, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
          c.restore();

          let pulseHeight = Math.sin(time / 120) * 5;
          let vortexTopY = by + 20 + pulseHeight;
          let vortexWidth = bw * 0.6;

          let vortexGrad = c.createLinearGradient(
            cx - vortexWidth / 2,
            by,
            cx + vortexWidth / 2,
            cy,
          );
          if (m.flashTimer > 0) {
            vortexGrad.addColorStop(0, "#ffffff");
            vortexGrad.addColorStop(1, "#ffffff");
          } else {
            vortexGrad.addColorStop(0, "#2ecc71");
            vortexGrad.addColorStop(0.5, "#27ae60");
            vortexGrad.addColorStop(1, "#1e8449");
          }

          c.fillStyle = vortexGrad;
          c.beginPath();
          c.moveTo(cx - vortexWidth * 0.4, cy);
          c.quadraticCurveTo(
            cx - vortexWidth * 0.75,
            (cy + vortexTopY) / 2,
            cx - vortexWidth * 0.5,
            vortexTopY,
          );
          c.bezierCurveTo(
            cx - vortexWidth * 0.2,
            vortexTopY - 12,
            cx + vortexWidth * 0.2,
            vortexTopY - 12,
            cx + vortexWidth * 0.5,
            vortexTopY,
          );
          c.quadraticCurveTo(
            cx + vortexWidth * 0.75,
            (cy + vortexTopY) / 2,
            cx + vortexWidth * 0.4,
            cy,
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#27ae60";
          for (let i = -1; i <= 1; i += 2) {
            let sway = Math.sin(time / 140 + i * 2) * 8;
            let pX = cx + i * vortexWidth * 0.4;
            let pY = cy - 22;

            c.beginPath();
            c.moveTo(pX, pY);
            c.quadraticCurveTo(
              pX + i * 22 + sway,
              pY - 15 + sway / 2,
              pX + i * 35 + sway,
              pY + 4 + sway,
            );
            c.quadraticCurveTo(
              pX + i * 22 + sway,
              pY - 5 + sway / 2,
              pX,
              pY + 8,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.arc(cx, vortexTopY + 14, 8, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "#9b59b6";
            c.beginPath();
            c.arc(cx, vortexTopY + 14, 3.5, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.fillStyle = "#000000";
            c.beginPath();
            c.arc(cx - 0.5, vortexTopY + 14, 1.5, 0, Math.PI * 2);
            c.fill();

            let eyeOffsets = [
              { dx: -12, dy: 30, r: 4, color: "#e74c3c" },
              { dx: 14, dy: 24, r: 5, color: "#f1c40f" },
              { dx: -6, dy: 44, r: 3, color: "#3498db" },
            ];
            eyeOffsets.forEach((eye) => {
              let ex = cx + eye.dx;
              let ey = vortexTopY + eye.dy;
              c.fillStyle = "#ffffff";
              c.beginPath();
              c.arc(ex, ey, eye.r, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.fillStyle = eye.color;
              c.beginPath();
              c.arc(ex, ey, eye.r * 0.5, 0, Math.PI * 2);
              c.fill();
              c.stroke();
            });

            c.fillStyle = "rgba(46, 204, 113, 0.6)";
            c.beginPath();
            c.arc(cx - 10, vortexTopY + 2, 4, 0, Math.PI * 2);
            c.arc(cx + 8, vortexTopY + 6, 5, 0, Math.PI * 2);
            c.fill();
          }

          if (m.flashTimer === 0) {
            let dropProgress = (time / 6) % 35;
            c.fillStyle = "#2ecc71";
            c.beginPath();
            c.ellipse(
              cx - 8,
              vortexTopY + 15 + dropProgress,
              1.5,
              3,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
            let dropProgress2 = (time / 8 + 15) % 40;
            c.fillStyle = "#7bed9f";
            c.beginPath();
            c.ellipse(
              cx + 10,
              vortexTopY + 10 + dropProgress2,
              1.2,
              2.5,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        } else if (dType === "equip") {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cx = bx + bw / 2;
          let cy = by + bh / 2;
          let time = Date.now();
          let hover = Math.sin(time / 200) * 5;

          c.save();
          let shardOrbitAngle = time / 600;
          let shardCount = 5;
          c.translate(cx, cy + hover);
          for (let i = 0; i < shardCount; i++) {
            let angle = shardOrbitAngle + (i * Math.PI * 2) / shardCount;
            let sx = Math.cos(angle) * (bw * 0.78);
            let sy = Math.sin(angle) * 12;

            c.save();
            c.translate(sx, sy);
            c.rotate(angle * 1.5);

            c.strokeStyle = "rgba(52, 152, 219, 0.65)";
            c.fillStyle = "rgba(52, 152, 219, 0.18)";
            c.lineWidth = 1.2;

            if (i % 2 === 0) {
              c.beginPath();
              c.moveTo(0, -10);
              c.lineTo(2.5, 2);
              c.lineTo(1, 10);
              c.lineTo(-1, 10);
              c.lineTo(-2.5, 2);
              c.closePath();
              c.fill();
              c.stroke();
            } else {
              c.beginPath();
              c.moveTo(-5, -6);
              c.lineTo(5, -6);
              c.lineTo(4, 2);
              c.lineTo(0, 8);
              c.lineTo(-4, 2);
              c.closePath();
              c.fill();
              c.stroke();
            }
            c.restore();
          }
          c.restore();

          let suitY = cy - 8 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;

          c.beginPath();
          c.roundRect(cx - 26, suitY - 14, 11, 11, [3]);
          c.roundRect(cx + 15, suitY - 14, 11, 11, [3]);
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(cx - 15, suitY - 8);
          c.lineTo(cx + 15, suitY - 8);
          c.lineTo(cx + 12, suitY + 18);
          c.lineTo(cx, suitY + 28);
          c.lineTo(cx - 12, suitY + 18);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let corePulse = 4 + Math.sin(time / 80) * 1.5;
            let furnaceGrad = c.createRadialGradient(
              cx,
              suitY + 4,
              1,
              cx,
              suitY + 4,
              corePulse + 6,
            );
            furnaceGrad.addColorStop(0, "#ffffff");
            furnaceGrad.addColorStop(0.4, "#e67e22");
            furnaceGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
            c.fillStyle = furnaceGrad;
            c.beginPath();
            c.arc(cx, suitY + 4, corePulse + 6, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = "#1a252f";
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(cx - 6, suitY + 4);
            c.lineTo(cx + 6, suitY + 4);
            c.moveTo(cx, suitY - 2);
            c.lineTo(cx, suitY + 10);
            c.stroke();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
          c.beginPath();
          c.roundRect(cx - 9, suitY - 32, 18, 16, [4]);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = "#ff5500";
            c.beginPath();
            c.rect(cx - 6, suitY - 25, 12, 2.5);
            c.fill();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
          c.beginPath();
          c.ellipse(cx - 22, suitY + 12, 4.5, 4.5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "#5d6d7e";
          c.lineWidth = 3.0;
          c.beginPath();
          c.moveTo(cx - 22, suitY + 12);
          c.lineTo(cx - 18, cy + 32 + hover);
          c.stroke();

          let ax = cx - 18;
          let ay = cy + 32 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b1d22";
          c.beginPath();
          c.moveTo(ax - 18, ay - 8);
          c.lineTo(ax + 18, ay - 8);
          c.quadraticCurveTo(ax + 10, ay, ax + 14, ay + 14);
          c.lineTo(ax - 14, ay + 14);
          c.quadraticCurveTo(ax - 10, ay, ax - 18, ay - 8);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(ax - 18, ay - 8);
          c.quadraticCurveTo(ax - 28, ay - 11, ax - 30, ay - 5);
          c.quadraticCurveTo(ax - 18, ay, ax - 18, ay + 2);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let heatGrad = c.createLinearGradient(
              ax - 20,
              ay - 7,
              ax + 15,
              ay - 2,
            );
            heatGrad.addColorStop(0, "#ffeaa7");
            heatGrad.addColorStop(0.5, "#d35400");
            heatGrad.addColorStop(1, "rgba(27, 29, 34, 0)");
            c.fillStyle = heatGrad;
            c.beginPath();
            c.rect(ax - 15, ay - 7, 28, 4);
            c.fill();
          }
        }
      }
    } else if (
      m.type === "prestige_boss" ||
      m.type === "hooktail" ||
      m.visualType === "hooktail"
    ) {
      let hoverY = Math.sin(Date.now() / 150) * 6;
      let jawOpen = Math.abs(Math.sin(Date.now() / 400)) * 12;
      c.save();
      c.translate(m.x, m.y + hoverY);
      let baseW = 70;
      let baseH = 80;
      let scaleX = m.w / baseW;
      let scaleY = m.h / baseH;
      c.scale(scaleX, scaleY);

      let auraGlow = c.createRadialGradient(
        baseW / 2,
        baseH / 2,
        10,
        baseW / 2,
        baseH / 2,
        100,
      );
      auraGlow.addColorStop(0, "rgba(231, 76, 60, 0.45)");
      auraGlow.addColorStop(0.5, "rgba(142, 68, 173, 0.15)");
      auraGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = auraGlow;
      c.beginPath();
      c.arc(baseW / 2 + 30, baseH / 2, 80, 0, Math.PI * 2);
      c.fill();

      for (let i = 6; i >= 1; i--) {
        let segX = baseW / 2 + i * 18;
        let segY = baseH / 2 + Math.sin(Date.now() / 180 + i * 0.7) * 8;
        c.save();
        c.fillStyle = i % 2 === 0 ? "#111116" : "#5a0e0e";
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
        c.beginPath();
        c.arc(segX, segY, 26 - i * 2.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();

        if (
          !window.isGamePaused &&
          Math.random() < 0.2 &&
          window.particles.length < 200
        ) {
          window.particles.push({
            x: m.x + segX * scaleX,
            y: m.y + hoverY + segY * scaleY - 30,
            vx: window.randFloat(-0.4, 0.2),
            vy: -window.randFloat(1.2, 2.2),
            gravity: -0.06,
            radius: window.randFloat(3.0, 5.0),
            growth: 0.15,
            color: "rgba(30, 30, 35, 0.65)",
            alpha: 0.75,
            fade: true,
            maxLife: 80,
            life: window.randInt(60, 80),
          });
        }
      }

      c.save();
      c.fillStyle = "#d35400";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(baseW - 25, -20);
      c.quadraticCurveTo(baseW + 5, -50, baseW + 22, -45);
      c.quadraticCurveTo(baseW - 3, -25, baseW - 30, -5);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.fillStyle = "#110202";
      c.strokeStyle = "#e74c3c";
      c.lineWidth = 3 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let wingFlap = Math.sin(Date.now() / 100) * 12;
      c.translate(baseW / 2 + 50, baseH / 2 + 10);
      c.rotate((wingFlap * Math.PI) / 180);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(50, -30);
      c.lineTo(60, 5);
      c.lineTo(40, 15);
      c.lineTo(55, 35);
      c.lineTo(5, 22);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
      c.beginPath();
      c.moveTo(baseW - 5, -15);
      c.lineTo(baseW - 20, 10);
      c.lineTo(baseW - 15, -25);
      c.lineTo(baseW - 35, 12);
      c.lineTo(5, 5);
      c.lineTo(-10, 18);
      c.lineTo(-15, 30);
      c.lineTo(5, 38);
      c.lineTo(baseW - 10, 38);
      c.lineTo(baseW, 15);
      c.closePath();
      c.fill();
      c.stroke();

      if (m.flashTimer === 0) {
        c.fillStyle = "#ff0000";
        c.beginPath();
        c.ellipse(22, 18, 8, 6, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#f1c40f";
        c.beginPath();
        c.ellipse(22, 18, 2, 5, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c2833";
      c.beginPath();
      c.moveTo(-10, 18);
      c.lineTo(-26, 23);
      c.lineTo(-10, 28);
      c.closePath();
      c.fill();
      c.stroke();
      c.save();
      c.translate(15, 38);
      c.rotate((-jawOpen * Math.PI) / 180);
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#631c15";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-25, 4);
      c.lineTo(5, 15);
      c.lineTo(baseW - 15, 10);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#ffeaa7";
      c.beginPath();
      c.moveTo(-15, 2);
      c.lineTo(-12, 9);
      c.lineTo(-9, 2);
      c.fill();
      c.restore();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let tailSwayTime = Date.now() / 150;
      for (let i = 1; i <= 6; i++) {
        let segmentSway = Math.sin(tailSwayTime - i * 0.4) * (i * 2.0);
        let segX = 100 + i * 12 + segmentSway;
        let segY = 48 - i * 4 + i * i * 0.5;
        let r = 18 - i * 2.0;
        c.fillStyle = i % 2 === 0 ? "#111116" : "#4a0a0a";
        c.beginPath();
        c.arc(segX, segY, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      let tipSway = Math.sin(tailSwayTime - 6 * 0.4) * 12;
      let tipX = 100 + 72 + tipSway;
      let tipY = 48 - 24 + 18;
      c.fillStyle = "#d35400";
      c.beginPath();
      c.moveTo(tipX, tipY);
      c.quadraticCurveTo(tipX + 18, tipY - 8, tipX + 28, tipY - 22);
      c.quadraticCurveTo(tipX + 12, tipY - 14, tipX + 2, tipY - 4);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
      c.restore();
    } else {
      let currentTier = t !== undefined ? t : window.getStageTier();
      let bounce = 0;

      if (currentTier === 0) {
        c.save();
        let centerBossX = m.x + m.w / 2;
        let centerBossY = m.y + m.h / 2;
        c.translate(centerBossX, centerBossY);
        c.scale(0.5, 0.5);
        c.translate(-centerBossX, -centerBossY);

        // Background glow layer for Rare targets to immediately signify high-tier spawns
        if (m.isRare) {
          c.save();
          let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
          let auraGrad = c.createRadialGradient(
            m.x + m.w / 2,
            m.y + m.h / 2,
            2,
            m.x + m.w / 2,
            m.y + m.h / 2,
            Math.max(m.w, m.h) * 1.15 * auraPulse,
          );
          auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
          auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
          auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          c.fillStyle = auraGrad;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2,
            Math.max(m.w, m.h) * 1.15 * auraPulse,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.restore();
        }

        // Wrap with a pivot coordinate space to organic-sway and breathe from the root base
        c.save();
        let ox = m.x + m.w / 2;
        let oy = m.y + m.h;
        let sway = Math.sin(Date.now() / 240) * 0.035;
        let breatheW = 1 + Math.sin(Date.now() / 150) * 0.015;
        let breatheH = 1 + Math.cos(Date.now() / 150) * 0.008;

        c.translate(ox, oy);
        c.rotate(sway);
        c.scale(breatheW, breatheH);
        c.translate(-ox, -oy);

        // ==========================================
        // 1. HORRIFIC JAGGED ARACHNOID TREANT LEGS (ROOT OVERHAUL)
        // ==========================================
        let legColorDark = m.flashTimer > 0 ? "#ffffff" : "#221105";
        let legColorMid = m.flashTimer > 0 ? "#ffffff" : "#3b1e0a";
        let legColorHighlight = m.flashTimer > 0 ? "#ffffff" : "#512c14";

        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;

        let legYBase = m.y + m.h - 10;
        let legOffsets = [
          { dx: -12, stretchX: -36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -6, stretchX: -26, kneeY: -25, tipY: 10, col: legColorMid },
          { dx: 6, stretchX: 26, kneeY: -25, tipY: 10, col: legColorHighlight },
          { dx: 12, stretchX: 36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -16, stretchX: -46, kneeY: -5, tipY: 10, col: legColorDark },
          { dx: 16, stretchX: 46, kneeY: -5, tipY: 10, col: legColorDark },
        ];

        legOffsets.forEach((leg, index) => {
          let legRootX = m.x + m.w / 2 + leg.dx;
          let kneeX = legRootX + leg.stretchX * 0.6;
          let kneeY =
            legYBase + leg.kneeY + Math.sin(Date.now() / 120 + index) * 3;
          let tipX = legRootX + leg.stretchX;
          let tipY = m.y + m.h + leg.tipY;

          c.fillStyle = leg.col;
          c.beginPath();
          c.moveTo(legRootX, legYBase);
          c.quadraticCurveTo(
            kneeX - 4 * Math.sign(leg.stretchX),
            kneeY - 4,
            kneeX,
            kneeY,
          );
          c.lineTo(tipX, tipY);
          c.lineTo(tipX - 5 * Math.sign(leg.stretchX), tipY);
          c.lineTo(kneeX - 4 * Math.sign(leg.stretchX), kneeY + 4);
          c.lineTo(legRootX, legYBase + 8);
          c.closePath();
          c.fill();
          c.stroke();
        });

        // Dangling silk cocoon swaying beneath the lower canopy
        if (m.flashTimer === 0) {
          c.save();
          let cocoonSway = Math.sin(Date.now() / 180) * 0.12;
          c.translate(m.x + m.w * 0.25, m.y + m.h * 0.25);
          c.rotate(cocoonSway);

          c.strokeStyle = "rgba(255, 255, 255, 0.45)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(0, 18);
          c.stroke();

          c.fillStyle = "rgba(235, 235, 240, 0.9)";
          c.strokeStyle = "#222";
          c.lineWidth = 1;
          c.beginPath();
          c.ellipse(0, 26, 6, 10, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "rgba(255, 255, 255, 0.75)";
          c.beginPath();
          c.moveTo(-4, 20);
          c.lineTo(4, 32);
          c.moveTo(4, 20);
          c.lineTo(-4, 32);
          c.stroke();
          c.restore();
        }

        // ==========================================
        // 2. TWISTED ANCIENT TRUNK & STRIATIONS
        // ==========================================
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#462810";
        c.beginPath();
        c.moveTo(m.x + m.w * 0.32, m.y + m.h * 0.3); // Left shoulder
        c.quadraticCurveTo(
          m.x + m.w * 0.2,
          m.y + m.h * 0.6,
          m.x + m.w * 0.12,
          m.y + m.h - 12,
        ); // Left flare
        c.lineTo(m.x + m.w * 0.88, m.y + m.h - 12); // Right base flare
        c.quadraticCurveTo(
          m.x + m.w * 0.8,
          m.y + m.h * 0.6,
          m.x + m.w * 0.68,
          m.y + m.h * 0.3,
        ); // Right shoulder
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#5d381b"; // Midtone wood plates
          c.beginPath();
          c.moveTo(m.x + m.w * 0.35, m.y + m.h * 0.35);
          c.bezierCurveTo(
            m.x + m.w * 0.25,
            m.y + m.h * 0.6,
            m.x + m.w * 0.3,
            m.y + m.h * 0.75,
            m.x + m.w * 0.22,
            m.y + m.h - 13,
          );
          c.lineTo(m.x + m.w * 0.78, m.y + m.h - 13);
          c.bezierCurveTo(
            m.x + m.w * 0.7,
            m.y + m.h * 0.75,
            m.x + m.w * 0.75,
            m.y + m.h * 0.6,
            m.x + m.w * 0.65,
            m.y + m.h * 0.32,
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.strokeStyle = "#251205";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.44, m.y + m.h * 0.32);
          c.quadraticCurveTo(
            m.x + m.w * 0.38,
            m.y + m.h * 0.55,
            m.x + m.w * 0.42,
            m.y + m.h - 14,
          );
          c.moveTo(m.x + m.w * 0.56, m.y + m.h * 0.32);
          c.quadraticCurveTo(
            m.x + m.w * 0.62,
            m.y + m.h * 0.58,
            m.x + m.w * 0.58,
            m.y + m.h - 14,
          );
          c.moveTo(m.x + m.w * 0.25, m.y + m.h * 0.52);
          c.quadraticCurveTo(
            m.x + m.w * 0.18,
            m.y + m.h * 0.75,
            m.x + m.w * 0.26,
            m.y + m.h - 14,
          );
          c.stroke();

          c.strokeStyle = "#1b7a43";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.75);
          c.quadraticCurveTo(
            m.x + m.w * 0.5,
            m.y + m.h * 0.68,
            m.x + m.w * 0.72,
            m.y + m.h * 0.72,
          );
          c.stroke();
        }

        // ==========================================
        // 3. GLOWING GREEN RIFT RUNES & COBWEBS
        // ==========================================
        if (m.flashTimer === 0) {
          let runeGlow = Math.abs(Math.sin(Date.now() / 250)) * 0.7 + 0.3;
          c.save();
          c.strokeStyle = `rgba(0, 255, 136, ${runeGlow})`;
          c.lineWidth = 2.2;
          c.shadowBlur = 10;
          c.shadowColor = "#00ff88";
          c.beginPath();
          c.moveTo(m.x + m.w * 0.25, m.y + m.h * 0.65);
          c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.72);
          c.lineTo(m.x + m.w * 0.27, m.y + m.h * 0.77);
          c.moveTo(m.x + m.w * 0.75, m.y + m.h * 0.65);
          c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.72);
          c.lineTo(m.x + m.w * 0.73, m.y + m.h * 0.77);
          c.stroke();
          c.restore();

          // Webbing strands around the trunk body
          c.strokeStyle = "rgba(255, 255, 255, 0.12)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.18, m.y + m.h * 0.45);
          c.quadraticCurveTo(
            m.x + m.w * 0.3,
            m.y + m.h * 0.48,
            m.x + m.w * 0.24,
            m.y + m.h * 0.6,
          );
          c.moveTo(m.x + m.w * 0.82, m.y + m.h * 0.45);
          c.quadraticCurveTo(
            m.x + m.w * 0.7,
            m.y + m.h * 0.48,
            m.x + m.w * 0.76,
            m.y + m.h * 0.6,
          );
          c.stroke();
        }

        // ==========================================
        // 4. CLAW BRACKETS (ARMS)
        // ==========================================
        let armColor = m.flashTimer > 0 ? "#ffffff" : "#462810";

        c.fillStyle = armColor;
        c.beginPath();
        c.moveTo(m.x + m.w * 0.28, m.y + m.h * 0.32);
        c.quadraticCurveTo(
          m.x - 22,
          m.y + m.h * 0.28,
          m.x - 28,
          m.y + m.h * 0.5,
        ); // Elbow joint
        c.lineTo(m.x - 18, m.y + m.h * 0.52);
        c.quadraticCurveTo(
          m.x - 8,
          m.y + m.h * 0.34,
          m.x + m.w * 0.28,
          m.y + m.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x - 28, m.y + m.h * 0.5);
        c.lineTo(m.x - 34, m.y + m.h * 0.64);
        c.lineTo(m.x - 24, m.y + m.h * 0.52);
        c.lineTo(m.x - 18, m.y + m.h * 0.67);
        c.lineTo(m.x - 15, m.y + m.h * 0.51);
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x + m.w * 0.72, m.y + m.h * 0.32);
        c.quadraticCurveTo(
          m.x + m.w + 22,
          m.y + m.h * 0.24,
          m.x + m.w + 28,
          m.y + m.h * 0.15,
        ); // Elbow joint
        c.lineTo(m.x + m.w + 19, m.y + m.h * 0.12);
        c.quadraticCurveTo(
          m.x + m.w + 10,
          m.y + m.h * 0.28,
          m.x + m.w * 0.72,
          m.y + m.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(m.x + m.w + 28, m.y + m.h * 0.15);
        c.lineTo(m.x + m.w + 36, m.y + m.h * 0.08);
        c.lineTo(m.x + m.w + 24, m.y + m.h * 0.12);
        c.lineTo(m.x + m.w + 30, m.y + m.h * 0.2);
        c.lineTo(m.x + m.w + 19, m.y + m.h * 0.14);
        c.closePath();
        c.fill();
        c.stroke();

        // ==========================================
        // 5. SPIDER-TREANT VISAGE (8 GLOWING Crimson EYES & DRIFTING VENOM)
        // ==========================================
        let eyeCenterY = m.y + m.h * 0.38;
        let mouthCenterY = m.y + m.h * 0.52;

        // 8 Glowing Crimson Spider Eyes in an arachnid cluster layout
        if (m.flashTimer === 0) {
          c.save();
          c.fillStyle = "#ff0055"; // Arachnid crimson glow
          c.shadowBlur = 10;
          c.shadowColor = "#ff0055";

          let eyeCluster = [
            { dx: -10, dy: -2, rx: 4, ry: 4, rot: 0 },
            { dx: 10, dy: -2, rx: 4, ry: 4, rot: 0 },
            { dx: -4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
            { dx: 4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
            { dx: -15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
            { dx: 15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
            { dx: -6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
            { dx: 6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
          ];

          eyeCluster.forEach((eye) => {
            c.beginPath();
            c.ellipse(
              m.x + m.w * 0.5 + eye.dx,
              eyeCenterY + eye.dy,
              eye.rx,
              eye.ry,
              eye.rot,
              0,
              Math.PI * 2,
            );
            c.fill();
          });
          c.restore();

          c.strokeStyle = "#150802";
          c.lineWidth = 3.0;
          c.beginPath();
          c.moveTo(m.x + m.w * 0.32, eyeCenterY - 10);
          c.quadraticCurveTo(
            m.x + m.w * 0.5,
            eyeCenterY - 4,
            m.x + m.w * 0.68,
            eyeCenterY - 10,
          );
          c.stroke();
        }

        // Gaping Jagged Mouth Hollow (Glowing Green Rift Core)
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0802"; // Void interior
        c.beginPath();
        c.ellipse(
          m.x + m.w * 0.5,
          mouthCenterY,
          m.w * 0.22,
          m.h * 0.09,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.save();
          let mouthPulse = 1.0 + Math.sin(Date.now() / 100) * 0.08;
          let mouthGrad = c.createRadialGradient(
            m.x + m.w * 0.5,
            mouthCenterY,
            2,
            m.x + m.w * 0.5,
            mouthCenterY,
            m.w * 0.22 * mouthPulse,
          );
          mouthGrad.addColorStop(0, "#ffffff");
          mouthGrad.addColorStop(0.4, "#00ff88");
          mouthGrad.addColorStop(0.8, "#2ecc71");
          mouthGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
          c.fillStyle = mouthGrad;
          c.shadowBlur = 15;
          c.shadowColor = "#00ff88";

          c.beginPath();
          c.ellipse(
            m.x + m.w * 0.5,
            mouthCenterY,
            m.w * 0.22,
            m.h * 0.09,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.restore();

          // Broken trunk teeth
          c.fillStyle = "#2d1607";
          c.strokeStyle = "#000000";
          c.lineWidth = 1.5;

          let tX = m.x + m.w * 0.5;
          let tY = mouthCenterY;
          let mW = m.w * 0.22;
          let mH = m.h * 0.09;

          let upperTeeth = [
            { ox: -mW * 0.7, oy: -mH * 0.3, len: 6 },
            { ox: -mW * 0.3, oy: -mH * 0.6, len: 10 },
            { ox: 0, oy: -mH * 0.8, len: 11 },
            { ox: mW * 0.3, oy: -mH * 0.6, len: 10 },
            { ox: mW * 0.7, oy: -mH * 0.3, len: 6 },
          ];
          upperTeeth.forEach((tooth) => {
            c.beginPath();
            c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
            c.lineTo(tX + tooth.ox, tY + tooth.oy + tooth.len);
            c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
            c.closePath();
            c.fill();
            c.stroke();
          });

          let lowerTeeth = [
            { ox: -mW * 0.5, oy: mH * 0.4, len: 8 },
            { ox: -mW * 0.15, oy: mH * 0.7, len: 10 },
            { ox: mW * 0.15, oy: mH * 0.7, len: 10 },
            { ox: mW * 0.5, oy: mH * 0.4, len: 8 },
          ];
          lowerTeeth.forEach((tooth) => {
            c.beginPath();
            c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
            c.lineTo(tX + tooth.ox, tY + tooth.oy - tooth.len);
            c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
            c.closePath();
            c.fill();
            c.stroke();
          });

          // Dripping Green Slime/Venom droplets
          let venomOffset = (Date.now() / 8) % 35;
          c.fillStyle = "#00ff88";
          c.beginPath();
          c.ellipse(tX - 8, tY + 4 + venomOffset, 1.2, 3, 0, 0, Math.PI * 2);
          c.ellipse(
            tX + 10,
            tY + 2 + venomOffset * 0.8,
            1.0,
            2.5,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }

        // 6. Multi-Layer Foliage Canopy (Isolated sub-paths to prevent intersecting connecting lines)
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h * 0.08;
        let r = m.w * 0.9;

        let drawCleanClump = (x, y, radius, color) => {
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : color;
          c.beginPath();
          c.arc(x, y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        };

        // Layer 1: Base Deep Forest Green
        let color1 = "#1a461e";
        drawCleanClump(cx, cy, r, color1);
        drawCleanClump(cx - r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx + r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx, cy - r * 0.5, r * 0.85, color1);

        // Layer 2: Vibrant Mid-Green
        let color2 = "#2ecc71";
        drawCleanClump(cx, cy, r * 0.8, color2);
        drawCleanClump(cx - r * 0.4, cy - r * 0.5, r * 0.6, color2);
        drawCleanClump(cx + r * 0.4, cy - r * 0.5, r * 0.6, color2);

        // Layer 3: Highlighted vibrant light-green (Adds foliage depth)
        let color3 = "#52be80";
        drawCleanClump(cx - r * 0.2, cy - r * 0.3, r * 0.4, color3);
        drawCleanClump(cx + r * 0.2, cy - r * 0.3, r * 0.4, color3);

        // 7. Hanging moss/ivy strands swaying dynamically
        if (m.flashTimer === 0) {
          c.fillStyle = "#164d1f";
          for (let i = 0; i < 5; i++) {
            let ivyOffset = -r * 0.6 + i * r * 0.3;
            let ivyX = cx + ivyOffset;
            let ivyY = cy + r * 0.3;
            let ivySway = Math.sin(Date.now() / 200 + i) * 4;
            c.beginPath();
            c.moveTo(ivyX - 3.5, ivyY);
            c.quadraticCurveTo(
              ivyX + ivySway,
              ivyY + 16,
              ivyX + ivySway + 1,
              ivyY + 24,
            );
            c.quadraticCurveTo(
              ivyX + 4.5 + ivySway,
              ivyY + 16,
              ivyX + 3.5,
              ivyY,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }

        // 8. Glowing Eldritch "Forest-Eye" Fruits (Pulsing glowing eyes peering from leaves)
        if (m.flashTimer === 0) {
          if (!m.appleOffsets) {
            m.appleOffsets = [];
            let count = window.randInt(4, 7);
            for (let i = 0; i < count; i++) {
              let angle = window.randFloat(0, Math.PI * 2);
              let dist = window.randFloat(0, r * 0.8);
              m.appleOffsets.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist - r * 0.1,
                sizeMod: window.randFloat(0.9, 1.25),
                eyeRot: window.randFloat(-Math.PI / 10, Math.PI / 10),
              });
            }
          }
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#ff2200";

          let eyePulse = 1 + Math.sin(Date.now() / 150) * 0.08;

          m.appleOffsets.forEach((ap) => {
            let appleX = cx + ap.dx;
            let appleY = cy + ap.dy;
            let rRadius = m.w * 0.11 * ap.sizeMod * eyePulse;

            c.save();
            c.translate(appleX, appleY);
            c.rotate(ap.eyeRot);

            // Dual-color Eldritch Eye radial gradient (Glow center to crimson edge)
            let fruitGrad = c.createRadialGradient(0, 0, 1, 0, 0, rRadius);
            fruitGrad.addColorStop(0, "#ffffff");
            fruitGrad.addColorStop(0.3, "#f1c40f"); // Yellow iris ring
            fruitGrad.addColorStop(0.7, "#d35400"); // Rich orange boundary
            fruitGrad.addColorStop(1, "#c0392b"); // Crimson base
            c.fillStyle = fruitGrad;

            c.beginPath();
            c.arc(0, 0, rRadius, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            // Menacing black reptilian slit pupil right in the center!
            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, 0, rRadius * 0.2, rRadius * 0.7, 0, 0, Math.PI * 2);
            c.fill();

            // Micro white specular highlight reflecting light
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.arc(
              -rRadius * 0.25,
              -rRadius * 0.25,
              rRadius * 0.15,
              0,
              Math.PI * 2,
            );
            c.fill();

            c.restore();
          });
          c.restore();
        }
        c.restore();
        c.restore(); // Close master 50% boss scale transform
      } else if (currentTier === 1) {
        let bounceOffset = Math.sin(Date.now() / 200) * 3;
        let blockColor = m.flashTimer > 0 ? "#ffffff" : "#3b3f46";
        let shadowColor = m.flashTimer > 0 ? "#ffffff" : "#1f2126";
        let lavaColor = "#ff2200";

        c.fillStyle = shadowColor;
        c.beginPath();
        c.rect(m.x + 4, m.y + m.h - 16, m.w - 8, 16);
        c.fill();
        c.stroke();
        c.fillStyle = blockColor;
        c.beginPath();
        c.rect(m.x + 8, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();
        c.beginPath();
        c.rect(m.x + m.w - 20, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x - 2, m.y + 24 + bounceOffset, m.w + 4, m.h - 40, [10]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x, m.y + 26 + bounceOffset, m.w, m.h - 44, [8]);
        c.fill();
        c.stroke();

        c.fillStyle = "#121316";
        c.beginPath();
        c.roundRect(m.x - 10, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.roundRect(m.x + m.w - 4, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x + 8, m.y + 4 + bounceOffset, m.w - 16, 22, [6]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x + 10, m.y + 6 + bounceOffset, m.w - 20, 18, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = lavaColor;
          c.shadowBlur = 15;
          c.shadowColor = lavaColor;

          c.beginPath();
          c.moveTo(m.x + 14, m.y + 11 + bounceOffset);
          c.lineTo(m.x + 22, m.y + 16 + bounceOffset);
          c.lineTo(m.x + 14, m.y + 18 + bounceOffset);
          c.closePath();

          c.moveTo(m.x + m.w - 14, m.y + m.h - 14 + bounceOffset);
          c.lineTo(m.x + m.w - 22, m.y + m.h - 16 + bounceOffset);
          c.lineTo(m.x + m.w - 14, m.y + m.h - 18 + bounceOffset);
          c.closePath();
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }

        if (m.flashTimer === 0) {
          c.strokeStyle = lavaColor;
          c.shadowBlur = 10;
          c.shadowColor = lavaColor;
          c.lineWidth = 2.5;

          c.beginPath();
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w - 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w / 2, m.y + m.h - 22 + bounceOffset);
          c.stroke();

          let coreGrad = c.createRadialGradient(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            1,
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
          );
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.3, "#ff3b30");
          coreGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }
      } else {
        if (currentTier === 2) {
          // TIER 2: Revamped Inferno Boss (Brimstone Colossus - Ignis)
          let bounce = Math.sin(Date.now() / 150) * 3.5;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Heavy Jagged Charcoal Obsidian shoulders (curved pauldrons)
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c1c1f"; // deep charcoal
          c.beginPath();
          c.moveTo(cx - 28, cy + 30);
          c.lineTo(cx - 22, cy - 5);
          c.lineTo(cx - 32, cy - 14); // shoulder point
          c.lineTo(cx - 10, cy - 10);
          c.lineTo(cx, cy); // neck joint
          c.lineTo(cx + 10, cy - 10);
          c.lineTo(cx + 32, cy - 14); // shoulder point
          c.lineTo(cx + 22, cy - 5);
          c.lineTo(cx + 28, cy + 30);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing magma fissures running down the armor plates
          if (m.flashTimer === 0) {
            c.strokeStyle = "#d35400";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(cx - 20, cy + 10);
            c.lineTo(cx - 8, cy + 22);
            c.lineTo(cx - 14, cy + 26);
            c.moveTo(cx + 20, cy + 10);
            c.lineTo(cx + 8, cy + 22);
            c.lineTo(cx + 14, cy + 26);
            c.stroke();
          }

          // Molten core in the center flaring
          if (m.flashTimer === 0) {
            let corePulse = 10 + Math.sin(Date.now() / 80) * 3;
            let coreGrad = c.createRadialGradient(
              cx,
              cy + 16,
              2,
              cx,
              cy + 16,
              corePulse,
            );
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#f39c12");
            coreGrad.addColorStop(1, "rgba(231, 76, 60, 0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy + 16, corePulse, 0, Math.PI * 2);
            c.fill();
          }

          // Giant sulfur-horned helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2f3238";
          c.beginPath();
          c.roundRect(cx - 12, cy - 26, 24, 20, [3]);
          c.fill();
          c.stroke();

          // Massive curved horns curling up from helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e67e22";
          c.beginPath();
          // Left
          c.moveTo(cx - 11, cy - 20);
          c.quadraticCurveTo(cx - 25, cy - 40, cx - 28, cy - 35);
          c.lineTo(cx - 8, cy - 14);
          c.closePath();
          // Right
          c.moveTo(cx + 11, cy - 20);
          c.quadraticCurveTo(cx + 25, cy - 40, cx + 28, cy - 35);
          c.lineTo(cx + 8, cy - 14);
          c.closePath();
          c.fill();
          c.stroke();

          // Molten iron visor slit
          if (m.flashTimer === 0) {
            c.fillStyle = "#ff3b30";
            c.beginPath();
            c.rect(cx - 8, cy - 18, 16, 3);
            c.fill();
          }
        } else if (currentTier === 3) {
          // TIER 3: Swamp Bog-Colossus Boss (Root-entangled swamp elemental)
          let bounce = Math.sin(Date.now() / 170) * 3;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Tangled wooden root body
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d1e12";
          c.beginPath();
          c.roundRect(cx - 22, cy - 10, 44, 50, [10]);
          c.fill();
          c.stroke();

          // Mossy/Leafy swamp shoulders
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#143d1f";
          c.beginPath();
          c.ellipse(cx - 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.ellipse(cx + 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Bog face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a120a";
          c.beginPath();
          c.arc(cx, cy - 22, 12, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Glowing toxic green swamp eyes
            c.fillStyle = "#2ecc71";
            c.beginPath();
            c.arc(cx - 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.arc(cx + 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 4) {
          // TIER 4: Void Overseer Boss (Levitating levitational multi-eyed space singularity)
          let hover = Math.sin(Date.now() / 140) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 - 10 + hover;

          // Swirling cosmic aura backplate
          if (m.flashTimer === 0) {
            let coreGrad = c.createRadialGradient(cx, cy, 2, cx, cy, 28);
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#9b59b6");
            coreGrad.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy, 28, 0, Math.PI * 2);
            c.fill();
          }

          // Central obsidian core plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
          c.beginPath();
          c.moveTo(cx, cy - 20);
          c.lineTo(cx + 18, cy);
          c.lineTo(cx, cy + 20);
          c.lineTo(cx - 18, cy);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blinking pink void watch eyes
            c.fillStyle = "#ff007f";
            c.beginPath();
            c.arc(cx, cy, 3.5, 0, Math.PI * 2);
            c.arc(cx - 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx - 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 5) {
          // TIER 5: Gilded Clockwork Sphinx (Temporal Sanctorum Campaign Warden)
          let bounce = Math.sin(Date.now() / 150) * 4;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Sphinx lion torso & sand wings
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
          c.beginPath();
          c.ellipse(cx, cy + 15, 18, 22, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Golden Pharaoh Headdress
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
          c.beginPath();
          c.moveTo(cx, cy - 28);
          c.lineTo(cx - 18, cy - 10);
          c.lineTo(cx - 12, cy + 6);
          c.lineTo(cx, cy - 2);
          c.lineTo(cx + 12, cy + 6);
          c.lineTo(cx + 18, cy - 10);
          c.closePath();
          c.fill();
          c.stroke();

          // Sphinx Face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e5c185";
          c.beginPath();
          c.roundRect(cx - 8, cy - 18, 16, 18, [3]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blank white glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 6;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.arc(cx + 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }
        } else if (currentTier === 6) {
          // TIER 6: Grid Centurion (Cyberspace Nexus Campaign Warden)
          let hover = Math.sin(Date.now() / 120) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Floating neon vector shield
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
          c.lineWidth = 1.5;
          c.save();
          c.translate(cx - 24, cy + 4);
          c.rotate(Date.now() / 500);
          c.strokeRect(-8, -8, 16, 16);
          c.restore();

          // Visor helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23";
          c.beginPath();
          c.roundRect(cx - 12, cy - 18, 24, 22, [4]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Visor
            c.fillStyle = "#00d2ff";
            c.beginPath();
            c.rect(cx - 8, cy - 11, 16, 4);
            c.fill();

            // Falling green matrix cape code blocks
            c.fillStyle = "rgba(46, 204, 113, 0.65)";
            for (let i = 0; i < 3; i++) {
              let offset = (i - 1) * 8;
              let yProgress = (Date.now() / 6 + i * 20) % 20;
              c.fillRect(cx + offset - 1, cy + 4 + yProgress, 2, 8);
            }
          }
        } else if (currentTier === 7) {
          // TIER 7: Chronos Arbitrator (The Clockwork God - exclusive T2 Altar Summon)
          let hover = Math.sin(Date.now() / 200) * 8;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Glowing brass gear halo
          let gearAngle = (Date.now() / 4000) % (Math.PI * 2);
          c.save();
          c.translate(cx, cy);
          c.rotate(gearAngle);
          c.strokeStyle = "#f1c40f";
          c.lineWidth = 2.0;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : "rgba(241, 196, 15, 0.08)";
          c.beginPath();
          c.arc(0, 0, 42, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          for (let i = 0; i < 8; i++) {
            c.rotate(Math.PI / 4);
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
            c.beginPath();
            c.rect(-5, -50, 10, 10);
            c.fill();
            c.stroke();
          }
          c.restore();

          // Cracked Ivory Mask Plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(cx, cy - 25);
          c.quadraticCurveTo(cx - 20, cy - 20, cx - 20, cy);
          c.lineTo(cx - 12, cy + 28);
          c.lineTo(cx + 12, cy + 28);
          c.lineTo(cx + 20, cy);
          c.quadraticCurveTo(cx + 20, cy - 20, cx, cy - 25);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Shimmering cracks
            c.strokeStyle = "#1a0f02";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(cx - 10, cy - 10);
            c.lineTo(cx - 4, cy - 4);
            c.lineTo(cx - 8, cy + 2);
            c.moveTo(cx + 10, cy - 8);
            c.lineTo(cx + 6, cy - 2);
            c.stroke();

            // White glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 8;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 6, cy - 5, 3, 0, Math.PI * 2);
            c.arc(cx + 6, cy - 5, 3, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }

          c.strokeStyle = "#111116";
          c.lineWidth = 2.5;
          c.lineCap = "round";
          let hrAngle = Date.now() / 10000;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
          c.stroke();
          let minAngle = Date.now() / 1800;
          c.strokeStyle = "#d35400";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(minAngle) * 22, Math.sin(minAngle) * 22);
          c.stroke();
          c.restore();
        } else {
          // TIER 8+: Nexus Overseer (The Glitch Singularity - exclusive T3 Altar Summon)
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2;
          let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
          let px = cx + (isGlitchedFrame ? window.randFloat(-4, 4) : 0);
          let py = cy + (isGlitchedFrame ? window.randFloat(-3, 3) : 0);
          c.save();
          c.translate(px, py);
          c.rotate(Date.now() / 800);
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
          c.lineWidth = 2.0;
          let cycle = Math.floor(Date.now() / 5000) % 3;
          if (cycle === 0) {
            c.strokeRect(-18, -18, 36, 36);
            c.strokeRect(-12, -12, 24, 24);
            c.beginPath();
            c.moveTo(-18, -18);
            c.lineTo(-12, -12);
            c.moveTo(18, -18);
            c.lineTo(12, -12);
            c.moveTo(-18, 18);
            c.lineTo(-12, 12);
            c.moveTo(18, 18);
            c.lineTo(12, 12);
            c.stroke();
          } else if (cycle === 1) {
            c.beginPath();
            c.moveTo(0, -22);
            c.lineTo(-18, 14);
            c.lineTo(18, 14);
            c.closePath();
            c.moveTo(0, -22);
            c.lineTo(0, 18);
            c.lineTo(-18, 14);
            c.moveTo(0, 18);
            c.lineTo(18, 14);
            c.stroke();
          } else {
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.closePath();
            c.stroke();
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.moveTo(0, 0);
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.stroke();
          }
          c.restore();
          if (m.flashTimer === 0) {
            let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
            c.fillStyle = "#00b894";
            c.beginPath();
            c.arc(px, py, eyePulse, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#000000";
            c.lineWidth = 1.5;
            c.stroke();
            c.fillStyle = "#ff007f";
            c.fillRect(px - 1.2, -4, 2.4, 8);
          }
        }
      }
    }
    c.restore();
  };
  // --- MISSING DPS CALCULATOR ---
  window.calculateActiveDps = function () {
    const now = window.nowMs || Date.now();
    let startIdx = 0;
    // Scan forward in-place to calculate expired record counts
    while (
      startIdx < window.damageHistory.length &&
      now - window.damageHistory[startIdx].time > 3000
    ) {
      startIdx++;
    }
    if (startIdx > 0) {
      window.damageHistory.splice(0, startIdx);
    }
    if (window.damageHistory.length === 0) return "0.0";
    let totalDamage = 0;
    for (let i = 0; i < window.damageHistory.length; i++) {
      totalDamage += window.damageHistory[i].amount;
    }
    let avgDps = totalDamage / 3;
    return window.formatNumber(avgDps);
  };

  window.drawSingleHero = function (
      ctx,
      x,
      y,
      scale,
      equippedSlots,
      playerStats,
      bounce,
      options = {},
    ) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      let equipped = equippedSlots ? { ...equippedSlots } : {};
      let stats = playerStats || {};

      // Ground Drop Shadow Pass (Ambient Occlusion)
          ctx.save();
          let shadowScale = Math.max(0.65, 1.0 - Math.abs(bounce) * 0.05);
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.beginPath();
          ctx.ellipse(0, 16, 11 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Active Buff & Elixir Ground Aura Ring Pass
          if (
            stats &&
            (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
          ) {
          let activeAuras = [];
          let getAtkCol = (s) => (s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71");
          let getHpCol = (s) => (s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c");
          let getDefCol = (s) => (s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db");
          let getHasteCol = (s) => (s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f");

          if ((stats.atkPotionRuns || 0) > 0) activeAuras.push(getAtkCol(stats.atkPotionStrength || 0.1));
          if ((stats.hpPotionRuns || 0) > 0) activeAuras.push(getHpCol(stats.hpPotionStrength || 0.1));
          if ((stats.defPotionRuns || 0) > 0) activeAuras.push(getDefCol(stats.defPotionStrength || 0.1));
          if ((stats.hastePotionRuns || 0) > 0) activeAuras.push(getHasteCol(stats.hastePotionStrength || 1));
          if ((stats.xpPotionRuns || 0) > 0) activeAuras.push("#c084fc");
          if ((stats.dropPotionRuns || 0) > 0) activeAuras.push("#34d399");
          if ((stats.qlyPotionRuns || 0) > 0) activeAuras.push("#f472b6");
          if (stats.frenzyTimer > 0) activeAuras.push("#f1c40f");
          if (stats.astralAwakeningTimer > 0) activeAuras.push("#00d2ff");
          if (stats.purifiedAegisTimer > 0) activeAuras.push("#2ecc71");

          if (activeAuras.length > 0) {
            ctx.save();
            let time = Date.now();
            let auraRot = (time / 400) % (Math.PI * 2);

            activeAuras.forEach((col, idx) => {
              let rx = 15 + idx * 3;
              let ry = 7 + idx * 1.5;
              let pulse = Math.sin(time / 200 + idx) * 1.2;

              ctx.save();
              ctx.translate(0, 16);
              ctx.rotate(idx % 2 === 0 ? auraRot : -auraRot);
              ctx.strokeStyle = col;
              ctx.lineWidth = 1.2;
              ctx.setLineDash([5, 3]);
              ctx.beginPath();
              ctx.ellipse(0, 0, rx + pulse, ry + pulse * 0.5, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            });
            ctx.restore();
          }
        }

    const penHero = 1.8;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;
        ctx.lineJoin = "round";

        // Phase 4: Spectral Cosmetic Projection Interceptor
    if (stats.projectSpectralCosmetic && stats.activeSpectralResonance) {
      let resonance = stats.activeSpectralResonance;
      if (resonance === "weapon_staff") {
        equipped.weapon = {
          isUniqueStaff: true,
          type: "weapon",
          name: "Phoenix Ignition Staff",
        };
      } else if (resonance === "weapon_sword") {
        equipped.weapon = {
          isUniqueSword: true,
          type: "weapon",
          name: "Sanguine Reaver",
        };
      } else if (resonance === "weapon_singularity") {
        equipped.weapon = {
          isUniqueSingularity: true,
          type: "weapon",
          name: "Void-Sovereign Greatsword",
        };
      } else if (resonance === "weapon_maelstrom") {
        equipped.weapon = {
          isUniqueMaelstrom: true,
          type: "weapon",
          name: "Maelstrom Gale-Glaive",
        };
      } else if (resonance === "shield_aegis") {
        equipped.subweapon = {
          isUniqueAegis: true,
          type: "subweapon",
          subType: "shield",
          name: "Void-Warped Bulwark",
        };
      } else if (resonance === "tome_watch") {
        equipped.subweapon = {
          isUniqueWatch: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronos Pocket-Watch",
        };
      } else if (resonance === "tome_chronicle") {
        equipped.subweapon = {
          isUniqueChronicle: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronicle of past Lives",
        };
      } else if (resonance === "boots_warpcore") {
        equipped.boots = {
          isUniqueWarpCore: true,
          type: "boots",
          name: "Warp-Core Greaves",
        };
      } else if (resonance === "helmet_tempest") {
        equipped.helmet = {
          isUniqueTempest: true,
          type: "helmet",
          name: "Crown of Tempests",
        };
      } else if (resonance === "dagger_viper") {
        equipped.subweapon = {
          isUniqueViper: true,
          type: "subweapon",
          subType: "dagger",
          name: "Viper's Perfect Stiletto",
        };
      } else if (resonance === "tome_conduit") {
        equipped.subweapon = {
          isUniqueConduit: true,
          type: "subweapon",
          subType: "tome",
          name: "Conduit of the Lexicon",
        };
      }
    }

    // Custom visual skin color profiles for future cosmetic extensibility (with fallback mapping for leaderboards & clan rosters)
    let skin =
      stats.cosmeticSkin ||
      stats.cosmetic_skin ||
      (equipped && (equipped.cosmeticSkin || equipped.cosmetic_skin)) ||
      "default";
    let bodyColor = "#95a5a6";
    let armorColor = "#bdc3c7";
    let capeColor = "#c0392b";
    let eyeColor = stats.frenzyTimer > 0 ? "#f1c40f" : "#e74c3c";

    if (skin === "void") {
      bodyColor = "#2c1130";
      armorColor = "#510a74";
      capeColor = "#8e44ad";
    } else if (skin === "crimson") {
      bodyColor = "#1a0202";
      armorColor = "#960018";
      capeColor = "#111116";
    } else if (skin === "gilded") {
      bodyColor = "#ffd700";
      armorColor = "#b7950b";
      capeColor = "#111111";
    } else if (skin === "celestial") {
      bodyColor = "#0f172a";
      armorColor = "#00d2ff";
      capeColor = "#ffffff";
      eyeColor = "#00d2ff";
    }

    const drawSubweapon = () => {
      if (!equipped.subweapon) return;
      const subType = equipped.subweapon.subType;
      let isAegis = equipped.subweapon.isUniqueAegis;
      let isWatch = equipped.subweapon.isUniqueWatch;
      let isChronicle = equipped.subweapon.isUniqueChronicle;

      if (subType === "shield") {
        // Heavy defensive arm sway rotation
        let sway = Math.sin(Date.now() / 320) * 0.05;

        ctx.save();
        ctx.translate(16, 2 + bounce);
        ctx.rotate(-sway + 0.1); // Held forward with heroic clearance

        let shieldItem = equipped.subweapon;
        let noun =
          shieldItem && shieldItem.noun ? shieldItem.noun.toLowerCase() : "";
        let tierColor = window.getTierColor(
          shieldItem ? shieldItem.statsRolled : 0,
        );

        if (isAegis) {
          // --- UNIQUE: VOID-WARPED BULWARK ---
          ctx.fillStyle = "#25033c";
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(6, -8);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          ctx.strokeStyle = "#e84393";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 6);
          ctx.moveTo(-5, 0);
          ctx.lineTo(5, 0);
          ctx.stroke();
        } else if (noun.includes("kite")) {
          // --- KITE SHIELD (Tall & Rounded Taper) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-5.5, -9);
          ctx.quadraticCurveTo(0, -11, 5.5, -9); // Curved top
          ctx.lineTo(7, -1);
          ctx.lineTo(0, 11); // Long pointer
          ctx.lineTo(-7, -1);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Central heraldry cross matching quality tier
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -8.5);
          ctx.lineTo(0, 8);
          ctx.moveTo(-4.5, -1.5);
          ctx.lineTo(4.5, -1.5);
          ctx.stroke();
        } else if (noun.includes("tower")) {
          // --- TOWER SHIELD (Heavy Protective Rectangle) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.roundRect(-7, -9.5, 14, 19, [1.5]);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Inward border frame matching quality tier
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.roundRect(-5, -7.5, 10, 15, [1]);
          ctx.stroke();

          // Central horizontal reinforcing band
          ctx.strokeStyle = "#1c1c1f";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
        } else if (noun.includes("buckler")) {
          // --- BUCKLER (Small Circular Shield) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.arc(0, 1, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Quality indicator ring
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 1, 6.5, 0, Math.PI * 2);
          ctx.stroke();

          // Core steel boss center rivet
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else {
          // --- DEFAULT / HEATER SHIELD (The exact shape you love) ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(6, -8);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero + 0.5;
          ctx.stroke();

          // Draw inner quality-aligned framing border
          ctx.beginPath();
          ctx.moveTo(-4, -6.5);
          ctx.lineTo(4, -6.5);
          ctx.lineTo(5.5, -0.5);
          ctx.lineTo(0, 7.5);
          ctx.lineTo(-5.5, -0.5);
          ctx.closePath();
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Searing Steel Glint Sweep (Diagonal light reflections)
        let glintTime = (Date.now() / 2000) % 1.0;
        if (glintTime < 0.3) {
          let glintY = -9.5 + (glintTime / 0.3) * 19;
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-6, glintY);
          ctx.lineTo(6, glintY - 3);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // Orbiting Void Sparks (Aegis Unique only)
        if (
          isAegis &&
          (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
        ) {
          ctx.save();
          ctx.translate(16, 2 + bounce);
          ctx.rotate(-sway + 0.1);
          let orbitTime = Date.now() / 250;
          ctx.fillStyle = "#110221";
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = 1.0;
          for (let i = 0; i < 2; i++) {
            let angle = orbitTime + i * Math.PI;
            let ox = Math.cos(angle) * 14;
            let oy = Math.sin(angle) * 6;
            ctx.beginPath();
            ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }

        // Active Block Forcefield Flash centred on the Hero
        let timeSinceBlock = Date.now() - (stats.recentBlockTime || 0);
        if (
          timeSinceBlock < 250 &&
          (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
        ) {
          let opacity = (250 - timeSinceBlock) / 250;
          let currentR = 24 + (1.0 - opacity) * 6;
          ctx.save();
          ctx.strokeStyle = tierColor;
          ctx.fillStyle = window.hexToRgba
            ? window.hexToRgba(tierColor, 0.15 * opacity)
            : `rgba(52, 152, 219, ${0.15 * opacity})`;
          ctx.lineWidth = 2.0;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            let angle = (i * Math.PI) / 3;
            let hx = Math.cos(angle) * currentR;
            let hy = Math.sin(angle) * currentR + 4 + bounce;
            ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      } else if (subType === "tome") {
        ctx.save();
        let tomeFloat = Math.sin(Date.now() / 200) * 5;
        ctx.translate(25, -15 + bounce + tomeFloat); // Elevated and extended further forward to float heroically
        ctx.rotate(Math.PI / 12);
        ctx.rotate(Math.PI / 12);

        let tomeItem = equipped.subweapon;
        let isUniqueConduit = tomeItem && tomeItem.isUniqueConduit;

        // Unified Rarity/Stars Resolver (Uniques are treated as 5★)
        let stars = tomeItem
          ? tomeItem.statsRolled === "UNIQUE"
            ? 5
            : tomeItem.statsRolled || 0
          : 0;
        if (isWatch || isChronicle || isUniqueConduit) {
          stars = 5;
        }

        let tierColor = window.getTierColor(
          tomeItem
            ? tomeItem.statsRolled === "UNIQUE"
              ? 5
              : tomeItem.statsRolled
            : 0,
        );
        if (isWatch) tierColor = "#d4af37";
        else if (isChronicle) tierColor = "#f1c40f";
        else if (isUniqueConduit) tierColor = "#9b59b6";

        let rgbVals = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "155, 89, 182";

        // 3D Orbital properties
        let R = 15;
        let R_minor = 7;
        let orbitTime = Date.now() / 280;

        // Parametric calculation of points on 3D-tilted orbital planes
        let getOrbPos = (i) => {
          let phi = i * (Math.PI / stars) + Math.PI / 12;
          let theta = orbitTime + i * ((Math.PI * 2) / stars);

          let ox =
            R * Math.cos(theta) * Math.cos(phi) -
            R_minor * Math.sin(theta) * Math.sin(phi);
          let oy =
            R * Math.cos(theta) * Math.sin(phi) +
            R_minor * Math.sin(theta) * Math.cos(phi) -
            1;
          let oz = Math.sin(theta); // Depth indicator

          return { ox, oy, oz, phi };
        };

        // 1. Draw continuous translucent orbit rings behind the Tome
        if (stars > 0) {
          ctx.save();
          ctx.lineWidth = 0.6;
          for (let i = 0; i < stars; i++) {
            let pos = getOrbPos(i);
            ctx.strokeStyle = `rgba(${rgbVals}, 0.08)`;
            ctx.beginPath();
            ctx.ellipse(0, -1, R, R_minor, pos.phi, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. Draw orbs that are rotating behind the book (oz < 0)
        if (stars > 0) {
          for (let i = 0; i < stars; i++) {
            let pos = getOrbPos(i);
            if (pos.oz < 0) {
              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = tierColor;
              ctx.beginPath();
              ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        // 3. Draw Book / Unique Tome Core Body Graphics
        if (isWatch) {
          ctx.fillStyle = "#d4af37";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fdf6e2";
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 1.2;
          let clockTime = Date.now() / 300;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(clockTime) * 4.5, Math.sin(clockTime) * 4.5);
          ctx.stroke();
        } else if (isChronicle) {
          ctx.fillStyle = "#111116";
          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-5, -7, 10, 14, [1.5]);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.fillRect(3.5, -6, 1.5, 12);
          let pulseRad = 12 + Math.sin(Date.now() / 150) * 2;
          ctx.strokeStyle = "rgba(241, 196, 15, 0.25)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isUniqueConduit) {
          // --- UNIQUE: CONDUIT OF THE LEXICON ---
          ctx.fillStyle = "#0c0515"; // Deep occult violet cover
          ctx.strokeStyle = "#9b59b6";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-5, -7, 10, 14, [1.5]);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(3.5, -6, 1.5, 12); // Paper edges
          ctx.fillStyle = "#2ecc71"; // Emerald core emblem
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          let pulseRad = 12 + Math.sin(Date.now() / 150) * 2;
          ctx.strokeStyle = "rgba(46, 204, 113, 0.25)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          let noun =
            tomeItem && tomeItem.noun ? tomeItem.noun.toLowerCase() : "";

          // Magical Rarity Glow Aura (Behind-the-book baseline)
          let auraRadius = 14 + Math.sin(Date.now() / 150) * 4;
          let auraGrad = ctx.createRadialGradient(0, -1, 1, 0, -1, auraRadius);
          auraGrad.addColorStop(0, `rgba(${rgbVals}, 0.65)`);
          auraGrad.addColorStop(0.5, `rgba(${rgbVals}, 0.2)`);
          auraGrad.addColorStop(1, `rgba(${rgbVals}, 0)`);
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, -1, auraRadius, 0, Math.PI * 2);
          ctx.fill();

          // Resolve custom Book Cover styles
          let coverColor = "#8e44ad"; // Default magic purple
          if (noun.includes("grimoire"))
            coverColor = "#1b002a"; // Deep occult black
          else if (noun.includes("codex"))
            coverColor = "#784212"; // Antique brass/bronze
          else if (noun.includes("lexicon"))
            coverColor = "#1b4f72"; // Scholar blue
          else if (noun.includes("chronicle")) coverColor = "#4d1a00"; // Rustic relic leather

          ctx.fillStyle = coverColor;
          ctx.beginPath();
          ctx.roundRect(-6, -8, 12, 14, [1.5]);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.stroke();

          // Draw book spine on left binding edge
          ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
          ctx.fillRect(-6, -8, 3, 14);

          // Draw paper edges on the right
          ctx.fillStyle = "#f5f5dc";
          ctx.beginPath();
          ctx.rect(4, -7, 1.5, 12);
          ctx.fill();
          ctx.stroke();

          // Render detailed central cover glyphs
          ctx.save();
          if (noun.includes("grimoire")) {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(1, -1, 2.2, -Math.PI / 2, Math.PI / 2, false);
            ctx.quadraticCurveTo(2.0, -1, 1, -3.2);
            ctx.closePath();
            ctx.fill();
          } else if (noun.includes("codex")) {
            ctx.strokeStyle = "#bdc3c7";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(1, -1, 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 1, 0, Math.PI * 2);
            ctx.fill();
          } else if (noun.includes("lexicon")) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.ellipse(1, -1, 2.5, 1.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 0.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (noun.includes("chronicle")) {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.moveTo(-1, -3);
            ctx.lineTo(3, -3);
            ctx.lineTo(1, -1);
            ctx.lineTo(3, 1);
            ctx.lineTo(-1, 1);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = tierColor;
            ctx.beginPath();
            ctx.arc(1, -1, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. Draw orbs that are rotating in front of the book (oz >= 0)
        if (stars > 0) {
          for (let i = 0; i < stars; i++) {
            let pos = getOrbPos(i);
            if (pos.oz >= 0) {
              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = tierColor;
              ctx.beginPath();
              ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        ctx.restore();
      } else if (subType === "dagger") {
        let dItem = equipped.subweapon;
        let stars = dItem
          ? dItem.statsRolled === "UNIQUE"
            ? 5
            : dItem.statsRolled || 0
          : 0;
        let tierColor = window.getTierColor(
          dItem ? (dItem.statsRolled === "UNIQUE" ? 5 : dItem.statsRolled) : 0,
        );
        if (dItem && dItem.isUniqueViper) tierColor = "#2ecc71";

        // Dynamic breathing sway rotation
        let sway = Math.sin(Date.now() / 240) * 0.08;

        ctx.save();
        ctx.translate(14, 6 + bounce); // Extended forward to match sword reach
        ctx.rotate((Math.PI * 3) / 4 - sway); // Rotate 180 degrees so the blade points out/forward (away from face)

        // 1. Draw Hilt Grip & Core Pommel
        ctx.fillStyle = "#1c1c1f"; // Dark metallic hilt core
        ctx.beginPath();
        ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Custom pommel core gem matching active tier color
        ctx.fillStyle = tierColor;
        ctx.beginPath();
        ctx.arc(0, 10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5c3a21"; // Padded wood hilt
        ctx.beginPath();
        ctx.rect(-1.5, 3, 3, 7);
        ctx.fill();
        ctx.stroke();

        // 2. Resolve Custom Guards & Blades based on specific Dagger sub-class
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;

        let noun = dItem && dItem.noun ? dItem.noun.toLowerCase() : "";

        if (noun.includes("kris")) {
          // Serpentine Kris Guard
          ctx.fillStyle = tierColor;
          ctx.beginPath();
          ctx.moveTo(-6, 3);
          ctx.lineTo(6, 3);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wavy/Serpentine Kris Blade
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath();
          ctx.moveTo(-2.5, 3);
          ctx.lineTo(-1.2, -1);
          ctx.lineTo(-2.5, -4.5);
          ctx.lineTo(-1.2, -8);
          ctx.lineTo(0, -14); // Sharp wavy tip
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.5, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Contrast Highlight Line
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.5, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("baselard")) {
          // Broad cross H-guard
          ctx.fillStyle = tierColor;
          ctx.fillRect(-6, 1.5, 12, 2);
          ctx.strokeRect(-6, 1.5, 12, 2);
          // Secondary matching H-pommel
          ctx.fillRect(-5, 9, 10, 2);
          ctx.strokeRect(-5, 9, 10, 2);

          // Broad diamond-point blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-3, 1.5);
          ctx.lineTo(0, -14); // tip
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("dirk")) {
          // Standard wide iron guard disc
          ctx.fillStyle = "#343a40";
          ctx.beginPath();
          ctx.ellipse(0, 3, 5, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Heavy single-edged wedge blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 3);
          ctx.lineTo(-2.2, -10); // Flat blunt back edge
          ctx.lineTo(0, -14); // Blade point
          ctx.lineTo(2.2, 3); // Curved cutting slope front
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 3);
          ctx.closePath();
          ctx.fill();
        } else if (dItem && dItem.isUniqueViper) {
          // --- UNIQUE: VIPER'S PERFECT STILETTO ---
          ctx.fillStyle = "#1e272e"; // Dark hilt
          ctx.beginPath();
          ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = "#2ecc71"; // Emerald pommel gem
          ctx.beginPath();
          ctx.arc(0, 10, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#4a2306"; // Dark leather wrap
          ctx.beginPath();
          ctx.rect(-1.5, 3, 3, 7);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#f1c40f"; // Gold crossguard
          ctx.beginPath();
          ctx.moveTo(-7, 3);
          ctx.lineTo(7, 3);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Poison-etched serpentine blade
          ctx.fillStyle = "#0c1711"; // Dark obsidian core
          ctx.strokeStyle = "#2ecc71"; // Poison green edge glow
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-2.5, 3);
          ctx.lineTo(-1, -3);
          ctx.lineTo(-2, -8);
          ctx.lineTo(0, -15); // sharp tip
          ctx.lineTo(2, -8);
          ctx.lineTo(1, -3);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Acidic fuller lines
          ctx.strokeStyle = "#2ecc71";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, -12);
          ctx.stroke();
        } else if (noun.includes("main")) {
          // Main-Gauche Curved Parrying Guard
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-7, 3);
          ctx.quadraticCurveTo(0, -1.5, 7, 3);
          ctx.stroke();
          // Finger protective basket loop
          ctx.beginPath();
          ctx.arc(0, 5.5, 3.5, 0, Math.PI);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Narrow stiletto needle blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-1.8, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
        } else {
          // Default Stiletto Needle structure
          ctx.fillStyle = tierColor; // Guard matching quality tier
          ctx.beginPath();
          ctx.moveTo(-8, 3);
          ctx.quadraticCurveTo(0, -2, 8, 3);
          ctx.quadraticCurveTo(0, 2, -8, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Straight thin piercing blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 2.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 2.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Procedural Metallic Glint Sweep Overlay
        let glintTime = (Date.now() / 1500) % 1.0;
        if (glintTime < 0.3) {
          let glintY = 10 - (glintTime / 0.3) * 24;
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-2, glintY);
          ctx.lineTo(2, glintY - 2.5);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // 4. Quality-Scaled Active Spark Trails (Spirals off the moving blade tip)
        if (!window.isGamePaused && options.isMainHero && stars > 0) {
          let spawnChance = window.playerStats.ecoMode ? 0.08 : 0.25;
          if (Math.random() < spawnChance * stars) {
            let theta = (Math.PI * 3) / 4 - sway; // Align particle emission angle with updated blade direction
            let worldTipX = x + (14 + 14 * Math.sin(theta)) * scale; // Align tip spawn origin with hand translation
            let worldTipY = y + (6 + bounce - 14 * Math.cos(theta)) * scale;

            window.particles.push(
              window.ParticlePool.get(
                worldTipX,
                worldTipY,
                -Math.cos(theta) * window.randFloat(0.3, 0.8) -
                  (window.playerStats.isDungeonMode ? 1.5 : 0),
                -window.randFloat(0.2, 0.6) + bounce * 0.05,
                window.randFloat(0.8, 1.8),
                tierColor,
                0.85,
                window.randInt(15, 30),
                undefined,
                undefined,
                true, // Fade out over time
              ),
            );
          }
        }

        // 5. Rising elemental vapor matching equipped quality color!
        let dRgb = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "46, 204, 113";
        let mistCycle = (Date.now() / 150) % 6;
        ctx.fillStyle = `rgba(${dRgb}, ${0.55 - mistCycle / 12})`;
        ctx.beginPath();
        ctx.arc(0, -16 - mistCycle, 1.2 + mistCycle / 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawBodyAndCostume = () => {
      let costume =
        stats.equippedCostume ||
        stats.equipped_costume ||
        (equipped && (equipped.equippedCostume || equipped.equipped_costume)) ||
        "knight";

      switch (costume) {
        case "shinobi":
          {
            let shinobiGiColor = skin === "default" ? "#15151c" : bodyColor;
            let shinobiMaskColor = skin === "default" ? "#0d0d10" : armorColor;
            let shinobiSashColor = skin === "default" ? "#3498db" : armorColor;
            let shinobiScarfColor = capeColor;
            let shinobiEyeColor = eyeColor;

            // 1. Single angled Katana Sheath on the Back (Classic 3/4 profile)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            ctx.save();
            ctx.translate(-5, 2 + bounce);
            ctx.rotate(-Math.PI / 3.5); // Angled back-left
            ctx.fillStyle = "#111115"; // Black sheath
            ctx.fillRect(-2, -14, 4, 18);
            ctx.strokeRect(-2, -14, 4, 18);

            // Guard & Hilt
            ctx.fillStyle = "#d4af37"; // Golden guard
            ctx.fillRect(-4, -16, 8, 2.5);
            ctx.strokeRect(-4, -16, 8, 2.5);

            ctx.fillStyle = shinobiSashColor; // Wrapped hilt matching color accents
            ctx.fillRect(-2, -23, 4, 7);
            ctx.strokeRect(-2, -23, 4, 7);
            ctx.fillStyle = "#111";
            // Diamond wraps on hilt
            ctx.fillRect(-1, -21, 2, 2);
            ctx.fillRect(-1, -18, 2, 2);
            ctx.restore();
            ctx.restore();

            // 2. Flowing Scarf / Shinobi Ribbons (Procedural Inertia & Wind-Drag Lerping)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.fillStyle = shinobiScarfColor;
            ctx.lineJoin = "round";

            let isMoving =
              options.isMoving !== undefined
                ? options.isMoving
                : options.isMainHero && window.player && window.player.isMoving;

            // Initialize or update persistent procedural weight on the character state object
            if (playerStats.scarfWeight === undefined) {
              try {
                playerStats.scarfWeight = 0.0;
              } catch (e) {
                playerStats = { ...playerStats, scarfWeight: 0.0 };
              }
            }

            let targetWeight = isMoving ? 1.0 : 0.0;
            try {
              playerStats.scarfWeight +=
                (targetWeight - playerStats.scarfWeight) * 0.12;
            } catch (e) {}
            let w = playerStats.scarfWeight || 0.0;

            // Query fully resolved movement speed dynamically (checking fast cache first)
            let resolvedSpeed = 10;
            if (
              window.cachedPlayerStats &&
              window.cachedPlayerStats.moveSpeed
            ) {
              resolvedSpeed = window.cachedPlayerStats.moveSpeed;
            } else if (typeof window.resolvePlayerStats === "function") {
              let rp = window.resolvePlayerStats();
              if (rp && rp.moveSpeed) resolvedSpeed = rp.moveSpeed;
            }

            // Dynamic wind-drag velocity ratio capped comfortably above target max
            let speedRatio = Math.min(1.2, resolvedSpeed / 500.0);

            // Variable wave frequency and tighter, rapid flutters at high speeds
            let waveFreq = 0.1 + speedRatio * 0.16;
            let ampY = Math.max(1.5, 4.0 - 2.5 * speedRatio);
            let ampX = 1.0 + 2.0 * speedRatio;

            let waveCycle = Date.now() * waveFreq;
            let flutterY1 = Math.sin(waveCycle / 12) * ampY;
            let flutterY2 = Math.cos(waveCycle / 15) * (ampY * 0.85);
            let flutterX = Math.cos(waveCycle / 12) * ampX;

            // Idle breathing waves (low-frequency, slow sag)
            let idleSway1 = Math.sin(Date.now() / 800) * 1.5;
            let idleSway2 = Math.cos(Date.now() / 1000) * 1.0;

            // --- TOP RIBBON TAIL INTERPOLATION ---
            let cpX1_idle = -12 + idleSway1;
            let cpY1_idle = 4 + bounce;
            let cpX1_run = -12 - 18 * speedRatio + flutterX;
            let cpY1_run = 4 - 6 * speedRatio + flutterY1 + bounce;

            let epX1_idle = -14 + idleSway1;
            let epY1_idle = 12 + idleSway2 + bounce;
            let epX1_run = -16 - 36 * speedRatio + flutterX * 1.5;
            let epY1_run = 8 - 10 * speedRatio + flutterY2 + bounce;

            // Blended control/end points
            let cpX1 = cpX1_idle + (cpX1_run - cpX1_idle) * w;
            let cpY1 = cpY1_idle + (cpY1_run - cpY1_idle) * w;
            let epX1 = epX1_idle + (epX1_run - epX1_idle) * w;
            let epY1 = epY1_idle + (epY1_run - epY1_idle) * w;

            // Draw Top Ribbon
            ctx.beginPath();
            ctx.moveTo(-6, -2 + bounce);
            ctx.quadraticCurveTo(cpX1, cpY1, epX1, epY1);
            ctx.lineTo(epX1 + 4 * (1 - w), epY1 + 2 * w);
            ctx.quadraticCurveTo(cpX1 + 4, cpY1 + 4, -6, 2 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // --- BOTTOM RIBBON TAIL INTERPOLATION ---
            let cpX2_idle = -10 + idleSway2;
            let cpY2_idle = 10 + bounce;
            let cpX2_run = -10 - 16 * speedRatio - flutterX;
            let cpY2_run = 10 - 8 * speedRatio - flutterY1 + bounce;

            let epX2_idle = -11 + idleSway2;
            let epY2_idle = 24 + idleSway1 + bounce;
            let epX2_run = -14 - 34 * speedRatio - flutterX * 1.5;
            let epY2_run = 18 - 16 * speedRatio - flutterY2 + bounce;

            // Blended control/end points
            let cpX2 = cpX2_idle + (cpX2_run - cpX2_idle) * w;
            let cpY2 = cpY2_idle + (cpY2_run - cpY2_idle) * w;
            let epX2 = epX2_idle + (epX2_run - epX2_idle) * w;
            let epY2 = epY2_idle + (epY2_run - epY2_idle) * w;

            // Draw Bottom Ribbon
            ctx.beginPath();
            ctx.moveTo(-6, 2 + bounce);
            ctx.quadraticCurveTo(cpX2, cpY2, epX2, epY2);
            ctx.lineTo(epX2 + 4 * (1 - w), epY2 + 2 * w);
            ctx.quadraticCurveTo(cpX2 + 4, cpY2 + 4, -6, 5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 3. Side-Profile Stealth Gi (Body)
            ctx.fillStyle = shinobiGiColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16); // Centered body box
            ctx.fill();
            ctx.stroke();

            // Crossed Gi collar lapels (facing right, so front overlap slopes from left down to right)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(2, 9 + bounce);
            ctx.moveTo(3, bounce);
            ctx.lineTo(-3, 11 + bounce);
            ctx.stroke();

            // 4. Sash Belt with Back-Flowing Ties
            ctx.fillStyle = shinobiSashColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.rect(-9, 7 + bounce, 15, 3.5);
            ctx.fill();
            ctx.stroke();

            // Belt ribbons flowing back-left
            ctx.save();
            ctx.fillStyle = shinobiSashColor;
            ctx.translate(-8, 9 + bounce);
            ctx.rotate(-Math.PI / 6 + Math.sin(Date.now() / 100) * 0.12);
            ctx.beginPath();
            ctx.rect(-1.5, 0, 3, 11);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 5. Right-Facing Masked Hood (Head)
            ctx.fillStyle = shinobiGiColor;
            ctx.beginPath();
            // Left-weighted round hood representing head looking right
            ctx.roundRect(-10, -14 + bounce, 18, 16, [6, 4, 4, 6]);
            ctx.fill();
            ctx.stroke();

            // Face Opening (Slit offset to the right, showing right-facing orientation)
            ctx.fillStyle = shinobiMaskColor;
            ctx.beginPath();
            ctx.roundRect(-2, -11 + bounce, 9, 6, [2]);
            ctx.fill();
            ctx.stroke();

            // Forehead Protector Plate (Headband / Hitai-ate tilted right)
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.rect(-7, -14 + bounce, 12, 3);
            ctx.fill();
            ctx.stroke();

            // Headband ties blowing back-left
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            ctx.fillStyle = shinobiGiColor;
            ctx.translate(-10, -12 + bounce);
            ctx.rotate(-Math.PI / 4 + Math.sin(Date.now() / 90) * 0.15);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-8, -2);
            ctx.lineTo(-6, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 6. Single Focused, Intense Glowing Eye looking right
            ctx.fillStyle = shinobiEyeColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = shinobiEyeColor;
            ctx.beginPath();
            // Tilted focused single ninja eye slot
            ctx.moveTo(1, -9 + bounce);
            ctx.lineTo(5, -9 + bounce);
            ctx.lineTo(4, -7.5 + bounce);
            ctx.lineTo(1.5, -8 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          break;

        case "archmage":
          {
            // Recolor default skin robes to a gorgeous high-fantasy purple/gold/crimson theme
            let robeColor = skin === "default" ? "#34225c" : bodyColor;
            let trimColor = skin === "default" ? "#f1c40f" : armorColor;
            let sashColor = skin === "default" ? "#e74c3c" : capeColor;

            // 1. High Sorcerer Collar (frames the back of the neck)
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.moveTo(-10, bounce - 4);
            ctx.quadraticCurveTo(-14, bounce - 18, -11, bounce - 14); // collar peak back-left
            ctx.lineTo(-4, bounce - 10);
            ctx.lineTo(2, bounce - 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Flowing Back Cape (sweeps back-left with motion drag)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(-16, 10 + bounce, -18, 16 + bounce);
            ctx.lineTo(-6, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Main Robe Torso (canted for a right-facing posture)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(-12, 16 + bounce);
            ctx.lineTo(6, 16 + bounce);
            ctx.lineTo(5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Flared casting sleeves
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.lineTo(-13, 8 + bounce);
            ctx.lineTo(-7, 10 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(5, bounce);
            ctx.lineTo(11, 8 + bounce);
            ctx.lineTo(5, 10 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Crossed Robe Lapels & Gold Trim down front overlap
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(4, 9 + bounce);
            ctx.stroke();

            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.moveTo(-2, bounce);
            ctx.lineTo(4, 9 + bounce);
            ctx.lineTo(1, 11 + bounce);
            ctx.lineTo(-5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.lineWidth = penHero;

            // 3. Ornate Sash Belt & Back-flowing ribbon (wind-drag)
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.rect(-9, 8 + bounce, 15, 3.5);
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = sashColor;
            ctx.translate(-9, 10 + bounce);
            ctx.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.1); // sweeps back-left
            ctx.beginPath();
            ctx.rect(-2, 0, 4, 11);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Glowing chest crystal amulet
            ctx.fillStyle = "#00d2ff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00d2ff";
            ctx.beginPath();
            ctx.moveTo(-1, 2 + bounce);
            ctx.lineTo(1.5, 4 + bounce);
            ctx.lineTo(-1, 6 + bounce);
            ctx.lineTo(-3.5, 4 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 4. Majestic Flowing White Beard (Blowing backwards/left from right-facing chin)
            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.moveTo(3, -4 + bounce); // originates at chin
            ctx.bezierCurveTo(-1, 2 + bounce, -12, 1 + bounce, -14, 8 + bounce); // flows left
            ctx.quadraticCurveTo(-15, 12 + bounce, -12, 13 + bounce); // tail curl
            ctx.bezierCurveTo(-9, 10 + bounce, -2, 6 + bounce, 2, 2 + bounce); // returns
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Beard combed texture highlights
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(1, -2 + bounce);
            ctx.quadraticCurveTo(-3, 3 + bounce, -10, 8 + bounce);
            ctx.moveTo(2, 0 + bounce);
            ctx.quadraticCurveTo(-1, 5 + bounce, -6, 9 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Hood Cowl Base (Open to the right, rounded to the back-left)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.roundRect(-9, -15 + bounce, 16, 16, [8, 2, 2, 8]);
            ctx.fill();
            ctx.stroke();

            // Cowl Interior Deep Arcane Shadow
            ctx.fillStyle = "#111116";
            ctx.beginPath();
            ctx.roundRect(-2, -13 + bounce, 8, 12, [2, 6, 6, 2]);
            ctx.fill();
            ctx.stroke();

            // 6. Angled Ornate Wizard Hat Brim
            ctx.save();
            ctx.translate(-1, -15 + bounce);
            ctx.rotate(Math.PI / 18); // Tilted forward slightly
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Curved Pointy Hat Cone (Curving backwards/left)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-10, -15 + bounce);
            ctx.bezierCurveTo(
              -15,
              -24 + bounce,
              -16,
              -30 + bounce,
              -14,
              -36 + bounce,
            ); // curved slouch tip
            ctx.quadraticCurveTo(-10, -32 + bounce, 7, -15 + bounce); // right side slant down
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gilded Hat Band
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.moveTo(-10, -15 + bounce);
            ctx.lineTo(-12, -18 + bounce);
            ctx.lineTo(6, -17 + bounce);
            ctx.lineTo(7, -15 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Golden Hat Buckle
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.rect(-3, -19 + bounce, 5, 4);
            ctx.fill();
            ctx.stroke();

            // 7. Arcane Glowing Eye (Peering right from deep shadow)
            ctx.fillStyle = "#00e5ff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00e5ff";
            ctx.beginPath();
            ctx.moveTo(1, -9 + bounce);
            ctx.lineTo(4.5, -9 + bounce);
            ctx.lineTo(3.5, -7.5 + bounce);
            ctx.lineTo(1.5, -8 + bounce);
            ctx.closePath();
            ctx.fill();

            // 8. Floating Orb/Runic Sparks (Orbiting behind shoulders)
            let cycle = Date.now() / 250;
            let runeX = -16 + Math.sin(cycle) * 2;
            let runeY = -4 + Math.cos(cycle) * 3 + bounce;
            ctx.fillStyle = "#00e5ff";
            ctx.shadowColor = "#00e5ff";
            ctx.beginPath();
            ctx.moveTo(runeX, runeY - 3);
            ctx.lineTo(runeX + 2, runeY);
            ctx.lineTo(runeX, runeY + 3);
            ctx.lineTo(runeX - 2, runeY);
            ctx.closePath();
            ctx.fill();

            let runeX2 = -12 + Math.cos(cycle + 2) * 1.5;
            let runeY2 = -12 + Math.sin(cycle + 2) * 2 + bounce;
            ctx.fillStyle = "#9b59b6";
            ctx.shadowColor = "#9b59b6";
            ctx.beginPath();
            ctx.moveTo(runeX2, runeY2 - 2);
            ctx.lineTo(runeX2 + 1.5, runeY2);
            ctx.lineTo(runeX2, runeY2 + 2);
            ctx.lineTo(runeX2 - 1.5, runeY2);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0; // reset
          }
          break;

        case "cyber":
          {
            // Localized color mapping for sleek cybernetic default elements
            let suitColor = skin === "default" ? "#0f172a" : bodyColor; // Sleek carbon slate-black
            let plateColor = skin === "default" ? "#1e293b" : armorColor; // Steel panel grey
            let neonColor = skin === "default" ? "#00f0ff" : eyeColor; // Luminescent neon cyan

            // 1. Active Jetpack Thruster & Exhaust Plume (Streams back-left)
            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.roundRect(-12, 1 + bounce, 5, 10, [2]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111827";
            ctx.save();
            ctx.translate(-11, 6 + bounce);
            ctx.rotate(Math.PI / 6); // Angled down-left
            ctx.beginPath();
            ctx.moveTo(0, -3.5);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.lineTo(0, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pulsating glowing plasma plume
            let plumeCycle = Date.now() / 60;
            let plumeLength = 12 + Math.sin(plumeCycle) * 3;
            ctx.fillStyle = neonColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.moveTo(-4, -3);
            ctx.quadraticCurveTo(
              -4 - plumeLength * 0.6,
              -1 + Math.cos(plumeCycle) * 1.5,
              -4 - plumeLength,
              0,
            );
            ctx.quadraticCurveTo(
              -4 - plumeLength * 0.6,
              1 + Math.cos(plumeCycle) * 1.5,
              -4,
              3,
            );
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            ctx.restore();

            // 2. Sleek Carbon Torso & Limb Plating
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.lineTo(-9, 14 + bounce);
            ctx.lineTo(5, 14 + bounce);
            ctx.lineTo(5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // High-tech shoulder guard pauldrons
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.roundRect(-9, bounce - 2, 4, 6, [1.5]);
            ctx.roundRect(4, bounce - 2, 4, 6, [1.5]);
            ctx.fill();
            ctx.stroke();

            // 3. Neon Grid Circuit Pipes
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-4, 2 + bounce);
            ctx.lineTo(-4, 11 + bounce);
            ctx.lineTo(2, 11 + bounce);
            ctx.moveTo(0, 5 + bounce);
            ctx.lineTo(4, 5 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 4. Pulsating Chest Arc Reactor Core
            let corePulse = 2.4 + Math.sin(Date.now() / 150) * 0.8;
            ctx.fillStyle = "#ffffff"; // pure white core
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.arc(2, 6 + bounce, corePulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Sleek Right-Facing Aerodynamic Helmet
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.moveTo(-10, -14 + bounce);
            ctx.quadraticCurveTo(-11, -16 + bounce, -8, -16 + bounce); // round back
            ctx.lineTo(4, -14 + bounce); // sleek top
            ctx.quadraticCurveTo(8, -12 + bounce, 7, -5 + bounce); // front jaw curve
            ctx.lineTo(3, 1 + bounce); // chin
            ctx.lineTo(-7, 1 + bounce); // neck seal
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Ear-Com Node & Antenna on the back-left
            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.arc(-8, -7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-8, -7 + bounce);
            ctx.lineTo(-12, -15 + bounce); // angled antenna
            ctx.stroke();

            ctx.fillStyle = neonColor;
            ctx.beginPath();
            ctx.arc(-12, -15 + bounce, 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 6. Streamlined Glowing Visor (Facing Right)
            ctx.fillStyle = neonColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.moveTo(-2, -11 + bounce);
            ctx.lineTo(4, -11 + bounce);
            ctx.quadraticCurveTo(7.5, -9 + bounce, 6.5, -5 + bounce); // sleek curved visor front
            ctx.lineTo(2, -5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 7. Floating Holographic HUD target reticle in front of visor
            let hudTime = Date.now() / 500;
            let hudX = 13;
            let hudY = -7 + bounce;
            ctx.strokeStyle = "rgba(0, 240, 255, 0.45)"; // Translucent holographic cyan
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(hudX, hudY, 5, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshair ticks
            ctx.beginPath();
            ctx.moveTo(hudX - 7, hudY);
            ctx.lineTo(hudX - 5, hudY);
            ctx.moveTo(hudX + 5, hudY);
            ctx.lineTo(hudX + 7, hudY);
            ctx.moveTo(hudX, hudY - 7);
            ctx.lineTo(hudX, hudY - 5);
            ctx.moveTo(hudX, hudY + 5);
            ctx.lineTo(hudX, hudY + 7);
            ctx.stroke();
          }
          break;

        case "jackolantern":
          {
            // Localized color mapping for organic seasonal elements
            let pumpkinColor = skin === "default" ? "#e67e22" : bodyColor; // Pumpkin Orange
            let leafColor1 = skin === "default" ? "#c0392b" : capeColor; // Maple Red
            let leafColor2 = skin === "default" ? "#d35400" : armorColor; // Oak Orange
            let stemColor = skin === "default" ? "#27ae60" : capeColor; // Mossy green stem
            let glowColor = skin === "default" ? "#ff9f43" : eyeColor; // Inside candle flame glow (flame tint)

            // Dynamic wind/motion billow values
            let capeSway = Math.sin(Date.now() / 150) * 3;

            // 1. Layered Back-flowing Autumn Leaf Cape (sweeps and billows left)
            ctx.fillStyle = leafColor1;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(
              -15 + capeSway * 0.5,
              6 + bounce,
              -17 + capeSway,
              16 + bounce,
            );
            ctx.lineTo(-4, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Overlapping secondary leaf layer
            ctx.fillStyle = leafColor2;
            ctx.beginPath();
            ctx.moveTo(-4, bounce + 2);
            ctx.quadraticCurveTo(
              -11 + capeSway * 0.4,
              10 + bounce,
              -13 + capeSway * 0.8,
              16 + bounce,
            );
            ctx.lineTo(-2, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Leaf vein serrations waving in the wind
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-17 + capeSway, 16 + bounce);
            ctx.lineTo(-14 + capeSway * 0.7, 13 + bounce);
            ctx.lineTo(-13 + capeSway * 0.8, 16 + bounce);
            ctx.lineTo(-9 + capeSway * 0.5, 12 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 2. Vine-Woven Spooky Chestplate & Pauldrons
            ctx.fillStyle = "#1e130c"; // Dark earthy under-girth
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            // Intersecting thorny branches
            ctx.strokeStyle = "#5c3a21";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-6, 2 + bounce);
            ctx.lineTo(4, 14 + bounce);
            ctx.moveTo(4, 2 + bounce);
            ctx.lineTo(-6, 14 + bounce);
            ctx.moveTo(-7, 8 + bounce);
            ctx.lineTo(5, 8 + bounce);
            ctx.stroke();

            // Internal Magma cracks
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-4, 4 + bounce);
            ctx.lineTo(2, 10 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Leaf tattered shoulder guards
            ctx.fillStyle = leafColor2;
            ctx.beginPath();
            ctx.roundRect(-10, bounce - 2, 4, 5, [1]);
            ctx.roundRect(4, bounce - 2, 4, 5, [1]);
            ctx.fill();
            ctx.stroke();

            // 3. Swirling Autumn Leaf Orbit (Swirls around feet in 3D perspective!)
            for (let i = 0; i < 3; i++) {
              let leafT =
                (Date.now() / 1000 + i * ((Math.PI * 2) / 3)) % (Math.PI * 2);
              let lx = Math.cos(leafT) * 12;
              let ly = 16 + Math.sin(leafT) * 3 + bounce;
              ctx.fillStyle = i % 2 === 0 ? leafColor1 : leafColor2;
              ctx.save();
              ctx.translate(lx, ly);
              ctx.rotate(leafT * 2.5);
              ctx.beginPath();
              ctx.ellipse(0, 0, 3, 1.3, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }

            // 4. Ribbed Pumpkin Head with Rotational Breathing Wobble
            let pX = -1;
            let pY = -7 + bounce;
            let pRad = 11.0; // Slightly scaled up for a more epic "pumpkin head" presence!

            let headWobble = Math.sin(Date.now() / 180) * 0.05;

            ctx.save();
            ctx.translate(pX, pY);
            ctx.rotate(headWobble);

            // Base Pumpkin sphere
            ctx.fillStyle = pumpkinColor;
            ctx.beginPath();
            ctx.arc(0, 0, pRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Spherical ribs wrap (creates 3D volume facing right)
            ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, pRad * 0.7, pRad, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, pRad * 0.35, pRad, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Curly Green Stem (Sways back-left based on head rotation)
            let stemSway = Math.sin(Date.now() / 140) * 0.15;
            ctx.save();
            ctx.translate(0, -pRad);
            ctx.rotate(stemSway - Math.PI / 8);
            ctx.strokeStyle = stemColor;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-3, -6, -5, -4);
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Carved Face with Real-Time Candle Flicker
            let candleFlicker = 0.85 + Math.sin(Date.now() / 60) * 0.15;
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 10 * candleFlicker;
            ctx.shadowColor = glowColor;

            // Slanted sinister single eye
            ctx.beginPath();
            ctx.moveTo(2, -3);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 0.5);
            ctx.closePath();
            ctx.fill();

            // Toothy grin curving upwards to the right
            ctx.beginPath();
            ctx.moveTo(-2, 2.5);
            ctx.lineTo(1, 5.5);
            ctx.lineTo(3, 3.5);
            ctx.lineTo(6, 6.5);
            ctx.lineTo(8, 1.5); // smile tip curves up
            ctx.lineTo(5, 3.5);
            ctx.lineTo(3, 1.5);
            ctx.lineTo(1, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            // Deep black bevel outlines inside carved sections for high contrast
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, -3);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 0.5);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-2, 2.5);
            ctx.lineTo(1, 5.5);
            ctx.lineTo(3, 3.5);
            ctx.lineTo(6, 6.5);
            ctx.lineTo(8, 1.5);
            ctx.lineTo(5, 3.5);
            ctx.lineTo(3, 1.5);
            ctx.lineTo(1, 3.5);
            ctx.closePath();
            ctx.stroke();

            ctx.restore(); // Restore head transform matrix

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 6. Zero-Allocation Deterministic Drifting Embers (drifts back-left and rises!)
            for (let i = 0; i < 4; i++) {
              let seed = Math.sin(i * 123.45);
              let t = (Date.now() / 1100 + seed * 5) % 1.0; // normalised 0 to 1 loop over 1.1s
              let sparkX = pX - 2 - t * 18 + Math.sin(t * Math.PI * 2) * 2;
              let sparkY = pY - pRad + 2 - t * 22 + bounce;
              let alpha = 1.0 - t;
              ctx.fillStyle = `rgba(230, 126, 34, ${alpha * 0.85})`;
              ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
            }
          }
          break;

        case "santashelper":
          {
            let coatColor = skin === "default" ? "#d63031" : capeColor;
            let coatShadow = skin === "default" ? "#962d22" : bodyColor;
            let trimColor = "#ffffff"; // Fluffy white fur trim stays snow-white
            let goldColor = skin === "default" ? "#f1c40f" : armorColor;
            let leatherColor = "#2d3436"; // Charcoal leather belt
            let skinColor = "#ffddca"; // Healthy holiday skin
            let beardColor = "#ffffff"; // Pure white beard
            let beardShadow = "#cbd5e1"; // Beard shading depth

            // --- MOVEMENT & DIRECTION LERPING ---
            let isMoving =
              options.isMainHero && (!window.mob || !window.mob.isStopped);
            let stats = playerStats || window.playerStats || {};

            if (stats.santaSackSway === undefined) {
              stats.santaSackSway = 0;
            }
            let targetSway = isMoving ? 1.0 : 0.0;
            stats.santaSackSway += (targetSway - stats.santaSackSway) * 0.1;
            let swayWeight = stats.santaSackSway || 0;

            let time = Date.now();
            let capeSway = Math.sin(time / 130) * (1.8 + swayWeight * 2.5);
            let windFlutter = Math.sin(time / 90) * (0.5 + swayWeight * 1.5);

            // 1. ROYAL VELVET CLOAK (OVERLAPPING LAYERS & PROCEDURAL FLUTTER)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Back shadow cape layer
            ctx.fillStyle = coatShadow;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.quadraticCurveTo(
              -15 + capeSway * 0.5,
              6 + bounce,
              -20 + capeSway + windFlutter,
              16 + bounce,
            );
            ctx.lineTo(-4, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Main bright velvet cape layer
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(
              -12 + capeSway * 0.4,
              7 + bounce,
              -17 + capeSway,
              15.5 + bounce,
            );
            ctx.lineTo(-2, 15.5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Shimmering golden border
            ctx.strokeStyle = goldColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5, 1 + bounce);
            ctx.quadraticCurveTo(
              -11 + capeSway * 0.4,
              7.5 + bounce,
              -15.5 + capeSway,
              14.5 + bounce,
            );
            ctx.stroke();

            // Reset line width
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Soft fluffy white trim on Cape Bottom
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            let hemX = -17 + capeSway;
            let hemY = 15.5 + bounce;
            ctx.ellipse(hemX, hemY, 4, 2, 0, 0, Math.PI * 2);
            ctx.ellipse(hemX + 3, hemY + 0.5, 3.5, 1.8, 0, 0, Math.PI * 2);
            ctx.ellipse(hemX + 6.5, hemY + 0.8, 3.2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 2. GIANT BURLAP TOY/SOUL SACK (SLUNG BACK-LEFT)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            let sackX = -12 - swayWeight * 2;
            let sackY = 5 + bounce;
            ctx.translate(sackX, sackY);
            ctx.rotate(-Math.PI / 10 + Math.sin(time / 200) * 0.05);

            // Draw Sack Shadow Backing
            ctx.fillStyle = "#6f4e37"; // Deep burlap brown shadow
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Main Sack Body
            let sackGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 8.5);
            sackGrad.addColorStop(0, "#a05a2c");
            sackGrad.addColorStop(1, "#7d471b");
            ctx.fillStyle = sackGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 7.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Green holiday patch with tiny stitches
            ctx.fillStyle = "#27ae60";
            ctx.beginPath();
            ctx.rect(-3, -5, 4.5, 4.5);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -5);
            ctx.lineTo(-3, -0.5);
            ctx.moveTo(1.5, -5);
            ctx.lineTo(1.5, -0.5);
            ctx.moveTo(-3, -5);
            ctx.lineTo(1.5, -5);
            ctx.moveTo(-3, -0.5);
            ctx.lineTo(1.5, -0.5);
            ctx.stroke();

            // Golden ropes binding the sack mouth
            ctx.strokeStyle = goldColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(4, -3, 4, Math.PI * 0.6, Math.PI * 1.5);
            ctx.stroke();

            // Golden tie knot
            ctx.fillStyle = goldColor;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.ellipse(4.5, -3, 2, 1.2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 3. COZY CRIMSON SANTA COAT & BELT (BODY)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Main coat block
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            // Shaded coat contours
            ctx.fillStyle = coatShadow;
            ctx.beginPath();
            ctx.rect(-8, bounce, 4, 16);
            ctx.fill();

            // Center fluffy white fur lining down the front
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.roundRect(-2.5, bounce, 5, 16, [1.5]);
            ctx.fill();
            ctx.stroke();

            // Gold buttons flanking center line
            ctx.fillStyle = goldColor;
            ctx.beginPath();
            ctx.arc(-4.5, 4 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(-4.5, 12 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(3.5, 4 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(3.5, 12 + bounce, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Leather Charcoal Belt
            ctx.fillStyle = leatherColor;
            ctx.beginPath();
            ctx.rect(-8.5, 7.5 + bounce, 15, 4);
            ctx.fill();
            ctx.stroke();

            // Giant Gold Buckle with cutout frame
            ctx.fillStyle = goldColor;
            ctx.beginPath();
            ctx.rect(-3.5, 6 + bounce, 7, 7);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = leatherColor;
            ctx.beginPath();
            ctx.rect(-1.5, 8 + bounce, 3, 3);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 4. SANTA'S CHEERFUL HEAD BASE (PEEKING SKIN, EYES, & FLUFFY BEARD)
            ctx.save();

            // Fill head skin
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
            ctx.fill();

            // Fluffy White Back Hair (behind ears/brim)
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.arc(-8, -9 + bounce, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-7, -4 + bounce, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4b. THE MAJESTIC FLOATING BEARD (Drawn with individual path calls to prevent intersecting line bugs)
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            let beardCircles = [
              { x: 6, y: -3, r: 3.5 }, // Right cheek
              { x: 8.5, y: 1.5, r: 4.5 }, // Right mid
              { x: 7.5, y: 6.5, r: 5 }, // Right lower
              { x: 3, y: 9.5, r: 5.5 }, // Bottom center
              { x: -3, y: 8.5, r: 5 }, // Left lower
              { x: -6.5, y: 4, r: 4.5 }, // Left mid
              { x: -6, y: -1, r: 3.5 }, // Left cheek
            ];

            beardCircles.forEach((bc) => {
              ctx.beginPath();
              ctx.arc(bc.x, bc.y + bounce, bc.r, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });

            // Draw central mustache (overlaps the beard base)
            ctx.beginPath();
            ctx.ellipse(
              0.5,
              -4.5 + bounce,
              4,
              2.2,
              -Math.PI / 10,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(
              5.5,
              -4.5 + bounce,
              4,
              2.2,
              Math.PI / 10,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();

            // 4c. EYES & EYEBROWS (Rendered over the top of the beard to guarantee 100% absolute visibility)
            ctx.fillStyle = "#1c1c1e"; // Solid black friendly eyes
            ctx.beginPath();
            ctx.arc(-2, -9 + bounce, 1.6, 0, Math.PI * 2);
            ctx.arc(3.5, -9 + bounce, 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Sparkly white eye glints
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-2.4, -9.4 + bounce, 0.5, 0, Math.PI * 2);
            ctx.arc(3.1, -9.4 + bounce, 0.5, 0, Math.PI * 2);
            ctx.fill();

            // White eyebrows
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(-4.5, -13 + bounce, 4, 2, [1]);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(1.5, -13 + bounce, 4, 2, [1]);
            ctx.fill();
            ctx.stroke();

            // Soft red cheek blush
            ctx.fillStyle = "rgba(231, 76, 60, 0.35)";
            ctx.beginPath();
            ctx.ellipse(-3.5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
            ctx.ellipse(5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rosy Button Nose
            ctx.fillStyle = "#ff8a80";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.arc(3, -5.5 + bounce, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 5. RED VELVET FLOPPY SANTA CAP WITH INTEGRATED SWAY
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Fluffy white cap brim sitting right at the crown
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.roundRect(-10.5, -16.5 + bounce, 18.5, 4.5, [2]);
            ctx.fill();
            ctx.stroke();

            // Draw the main red cap dome (solid bean-hat backing structure)
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-10, -16 + bounce);
            ctx.quadraticCurveTo(-8, -25 + bounce, -1, -25 + bounce);
            ctx.quadraticCurveTo(5, -25 + bounce, 7, -16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw the floppy crimson fold draping over the back-left
            let capSway = Math.sin(time / 160) * (1.8 + swayWeight * 2.2);
            let foldTipX = -13 + capSway;
            let foldTipY = -12 + bounce;

            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-3, -25 + bounce);
            ctx.quadraticCurveTo(-11, -22 + bounce, foldTipX, foldTipY);
            ctx.lineTo(foldTipX + 3, foldTipY - 1);
            ctx.quadraticCurveTo(-6, -24 + bounce, 2, -25 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // White pom-pom dangling directly from the fold tip
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.arc(foldTipX, foldTipY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 7. ACTIVE WINTER AURORA (SPARKLING SNOW EMBER SPARKS)
            if (options.isMainHero && !window.isGamePaused) {
              ctx.save();
              ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
              for (let i = 0; i < 4; i++) {
                let seed = Math.sin(i * 45.67);
                let t = (time / 1000 + seed * 6) % 1.0;
                let sparkX = -4 - t * 24 + Math.sin(t * Math.PI * 2) * 4;
                let sparkY = -15 - t * 16 + bounce;
                let size = 1.2 * (1.0 - t);
                ctx.fillRect(sparkX, sparkY, size, size);
              }
              ctx.restore();
            }
          }
          break;

        case "midsummer": {
          let leafGreen = skin === "default" ? "#2ecc71" : armorColor;
          let darkLeafGreen = skin === "default" ? "#1e824c" : bodyColor;
          let strapColor = "#5c3a21"; // Earthy leather straps
          let sunGold =
            skin === "default"
              ? "#f1c40f"
              : skin === "void"
                ? "#e84393"
                : "#f1c40f";
          let time = Date.now();
          let windSway = Math.sin(time / 140) * 1.8;

          // UNIQUE ORGANIC LEAF DRAWING ENGINE (Self-contained helper)
          let drawLeaf = (cx, cy, r, angle, color) => {
            ctx.save();
            ctx.translate(cx, cy + bounce);
            ctx.rotate(angle);
            ctx.fillStyle = color;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(r * 0.65, -r * 0.1, 0, r); // Pointy right-curve
            ctx.quadraticCurveTo(-r * 0.65, -r * 0.1, 0, -r); // Pointy left-curve
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Leaf middle vein
            ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.7);
            ctx.lineTo(0, r * 0.7);
            ctx.stroke();

            ctx.restore();
          };

          // 1. CASCADING IVY LEAF CANOPY (CAPE - Flowing Back-Left)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          // Back deep leaf cape layer
          ctx.fillStyle = darkLeafGreen;
          ctx.beginPath();
          ctx.moveTo(-5, bounce);
          ctx.quadraticCurveTo(
            -14 + windSway,
            5 + bounce,
            -16 + windSway,
            15 + bounce,
          );
          ctx.quadraticCurveTo(-9 + windSway, 17 + bounce, -2, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Front bright ivy layer
          ctx.fillStyle = leafGreen;
          ctx.beginPath();
          ctx.moveTo(-2, 1 + bounce);
          ctx.quadraticCurveTo(
            -10 + windSway * 0.8,
            8 + bounce,
            -12 + windSway * 0.8,
            15 + bounce,
          );
          ctx.quadraticCurveTo(
            -5 + windSway * 0.8,
            16 + bounce,
            1,
            14 + bounce,
          );
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Organic leaf veins
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3, 1 + bounce);
          ctx.lineTo(-10 + windSway, 10 + bounce);
          ctx.stroke();
          ctx.restore();

          // 2. LINEN SHIRT & LAYERED TUNIC (BODY)
          // Neutral linen under-shirt
          ctx.fillStyle = "#faf0e6";
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Leaf Shoulder Pauldrons (Using drawLeaf!)
          drawLeaf(-9, 1, 4.5, Math.PI / 4, leafGreen);
          drawLeaf(5, 1, 4.5, -Math.PI / 4, leafGreen);

          // Leafy Vest Overlap (Left side)
          ctx.fillStyle = leafGreen;
          ctx.beginPath();
          ctx.moveTo(-8, bounce);
          ctx.lineTo(-2, bounce);
          ctx.lineTo(-8, 11 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Leafy Vest Overlap (Right side)
          ctx.beginPath();
          ctx.moveTo(6, bounce);
          ctx.lineTo(0, bounce);
          ctx.lineTo(6, 11 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Layered Foliage Skirt
          ctx.fillStyle = darkLeafGreen;
          ctx.beginPath();
          ctx.moveTo(-8.5, 9 + bounce);
          ctx.lineTo(6.5, 9 + bounce);
          ctx.lineTo(8, 16 + bounce);
          ctx.lineTo(-10, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Foliage kilt curved detail scales
          ctx.fillStyle = leafGreen;
          for (let i = -8; i <= 4; i += 4) {
            ctx.beginPath();
            ctx.arc(i + 2, 16 + bounce, 2.2, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
          }

          // Crossed leather chest laces
          ctx.strokeStyle = strapColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-4, 2 + bounce);
          ctx.lineTo(2, 6 + bounce);
          ctx.moveTo(2, 2 + bounce);
          ctx.lineTo(-4, 6 + bounce);
          ctx.stroke();

          // Woven Leather Belt
          ctx.fillStyle = strapColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.rect(-8.5, 8 + bounce, 15, 3);
          ctx.fill();
          ctx.stroke();

          // Solstice Golden Sun Buckle
          ctx.fillStyle = sunGold;
          ctx.beginPath();
          ctx.arc(0, 9.5 + bounce, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = sunGold;
          ctx.lineWidth = 0.8;
          for (let r = 0; r < 8; r++) {
            let angle = (r * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(0, 9.5 + bounce);
            ctx.lineTo(
              0 + Math.cos(angle) * 4.5,
              9.5 + bounce + Math.sin(angle) * 4.5,
            );
            ctx.stroke();
          }
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 3. SHADOWY FOREST HOOD (OBLITERATES FACE)
          ctx.save();

          // Cavity shadow background
          ctx.fillStyle = "#0c1a10"; // Deep forest shadow cavity
          ctx.beginPath();
          ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
          ctx.fill();
          ctx.stroke();

          // 4. NATURE GLOW EYES (Facing Right, Peeking from shadow)
          ctx.fillStyle = "#55efc4"; // Glowing mint nature sparks
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#2ecc71";
          ctx.beginPath();
          ctx.arc(1.5, -9 + bounce, 1.3, 0, Math.PI * 2);
          ctx.arc(5.0, -9 + bounce, 1.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // 5. ORGANIC DRUID FOLIAGE CANOPY (Layered leaf shroud wrapping head)
          // Draw deepest background leaves
          drawLeaf(-7, -10, 5.0, -Math.PI / 3, darkLeafGreen); // Back-left upper
          drawLeaf(-6, -4, 4.5, -Math.PI / 1.6, darkLeafGreen); // Back-left lower

          // Branch/Vine Hair Locks peeking from the back of the head
          ctx.fillStyle = "#a26938"; // Rich Auburn branch hair
          ctx.beginPath();
          ctx.arc(-9, -7 + bounce, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-8, -2 + bounce, 4.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Draw front-facing leaves
          drawLeaf(-4, -15, 5.5, -Math.PI / 6, leafGreen); // Top left
          drawLeaf(0, -17, 6.0, 0, darkLeafGreen); // Top center
          drawLeaf(4, -15, 5.5, Math.PI / 6, leafGreen); // Top right
          drawLeaf(5, -5, 5.5, Math.PI / 2.4, leafGreen); // Front-right (face mask drape)
          drawLeaf(1, -3, 6.0, Math.PI / 1.8, darkLeafGreen); // Chin / low mask drape
          drawLeaf(-3, -1, 4.8, -Math.PI / 2.2, leafGreen); // Lower-left neck base

          // 6. WOVEN VINE CROWN & 3D BLOOMING WILDFLOWERS
          ctx.strokeStyle = "#27ae60";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-11, -12 + bounce);
          ctx.quadraticCurveTo(0, -15 + bounce, 11, -12 + bounce);
          ctx.stroke();

          let flowersList = [
            { x: -5, y: -14, pCol: "#ff7675", cCol: "#ffd23f" }, // Rose
            { x: 1, y: -16, pCol: "#ffd23f", cCol: "#ff7675" }, // Daisy
            { x: 6, y: -13, pCol: "#54a0ff", cCol: "#ffffff" }, // Bluebell
          ];

          flowersList.forEach((fl) => {
            ctx.save();
            ctx.translate(fl.x, fl.y + bounce);
            ctx.fillStyle = fl.pCol;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              ctx.beginPath();
              ctx.arc(
                Math.cos(angle) * 1.5,
                Math.sin(angle) * 1.5,
                1.5,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
            }
            // Inner core bulb
            ctx.fillStyle = fl.cCol;
            ctx.beginPath();
            ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });

          ctx.restore();

          // 7. DRIFTING SUMMER FLOWER SPORES (ACTIVE WIND TRAIL)
          if (options.isMainHero && !window.isGamePaused) {
            ctx.save();
            for (let i = 0; i < 3; i++) {
              let seed = Math.sin(i * 78.91);
              let t = (time / 900 + seed * 6) % 1.0;
              let sparkX = -6 - t * 22 + Math.sin(t * Math.PI * 2) * 4;
              let sparkY = -6 - t * 15 + bounce;
              let alpha = 1.0 - t;
              ctx.fillStyle =
                i % 2 === 0
                  ? `rgba(255, 210, 63, ${alpha * 0.75})`
                  : `rgba(255, 118, 117, ${alpha * 0.75})`;
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 1.2 * (1.0 - t), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
          break;
        }

        default: // "knight" Classic Plate Armor
          // Draw Cape
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.fillStyle = capeColor;
          ctx.beginPath();
          ctx.moveTo(-6, bounce);
          ctx.lineTo(-18, 15);
          ctx.lineTo(-2, 18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw Body
          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Draw Helmet
          ctx.fillStyle = armorColor;
          ctx.beginPath();
          ctx.rect(-10, -14 + bounce, 18, 16);
          ctx.fill();
          ctx.stroke();

          // Helmet Visor / Eyes
          ctx.fillStyle = "#2c3e50";
          ctx.beginPath();
          ctx.rect(0, -8 + bounce, 6, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.rect(-5, -20 + bounce, 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(-9, -16 + bounce, 8, 4);
          ctx.fill();
          ctx.stroke();
          break;
      }
    };

    const drawMainWeapon = () => {
      // Crown of Tempests Aura
      if (
        equipped.helmet &&
        equipped.helmet.isUniqueTempest &&
        (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
      ) {
        ctx.save();
        ctx.translate(0, -14 + bounce);
        ctx.strokeStyle = "#00d2ff";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00d2ff";
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.quadraticCurveTo(-14, -12, -18, -8);
        ctx.quadraticCurveTo(-10, -5, -4, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.quadraticCurveTo(14, -12, 18, -8);
        ctx.quadraticCurveTo(10, -5, 4, 0);
        ctx.stroke();
        ctx.restore();
      }

      // UNIQUE: Maelstrom Gale-Glaive "Gale Resonance" Canvas Aura
      if (
        stats.galeResonanceTimer > 0 &&
        (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
      ) {
        ctx.save();
        ctx.translate(0, bounce);
        ctx.strokeStyle = "rgba(0, 255, 204, 0.45)";
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ffcc";
        ctx.beginPath();
        ctx.arc(0, 0, 24 + Math.sin(Date.now() / 100) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Weapon
      ctx.save();
      ctx.translate(2, 6 + bounce);
      let isStaff = equipped.weapon && equipped.weapon.isUniqueStaff;
      let isUniqueSword = equipped.weapon && equipped.weapon.isUniqueSword;
      let isSingularity =
        equipped.weapon && equipped.weapon.isUniqueSingularity;
      let isMaelstrom = equipped.weapon && equipped.weapon.isUniqueMaelstrom;

      if (isSingularity) {
        ctx.rotate(-Math.PI / 8);
        if (options.slashFrame) {
          ctx.translate(15, -10);
          ctx.rotate(-Math.PI / 2.3);
        }

        // Calculate depth-sorted orbiting space particles
        let orbitTime = Date.now() / 200;
        let orbitalParticles = [];
        for (let i = 0; i < 3; i++) {
          let angle = orbitTime + (i * Math.PI * 2) / 3;
          let ox = Math.cos(angle) * 7.5;
          let oy = Math.sin(angle) * 2.5;
          let oz = Math.sin(angle); // Depth factor
          orbitalParticles.push({ ox, oy, oz });
        }

        // 1. Draw back particles (orbiting behind the blade)
        orbitalParticles.forEach((p) => {
          if (p.oz < 0) {
            ctx.save();
            ctx.fillStyle = "#ff007f";
            ctx.beginPath();
            ctx.arc(p.ox, 42 + p.oy, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        // 2. Gravitational distortion field behind/around the blade tip
        ctx.save();
        let fieldPulse = 1.0 + Math.sin(Date.now() / 150) * 0.08;
        ctx.strokeStyle = "rgba(142, 68, 173, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(
          0,
          42,
          11 * fieldPulse,
          4 * fieldPulse,
          -Math.PI / 12,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();

        // 3. Draw Weapon Components (Grip, Guard, Blade)
        // Grip
        ctx.fillStyle = "#1e1e24";
        ctx.beginPath();
        ctx.rect(-2, -2, 4, 10);
        ctx.fill();
        ctx.stroke();

        // Crossguard
        ctx.fillStyle = "#110221";
        ctx.strokeStyle = "#8e44ad";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, 8);
        ctx.lineTo(9, 8);
        ctx.lineTo(12, 12);
        ctx.lineTo(-12, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Metallic-Shaded Blade with glowing fuller line
        let singPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
        let bladeGrad = ctx.createLinearGradient(-3, 12, 3, 12);
        bladeGrad.addColorStop(0, "#0d011a");
        bladeGrad.addColorStop(0.5, "#8e44ad");
        bladeGrad.addColorStop(1, "#110221");

        ctx.fillStyle = bladeGrad;
        ctx.strokeStyle = "#e84393";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 12);
        ctx.lineTo(-1.5, 42);
        ctx.lineTo(1.5, 42);
        ctx.lineTo(3, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Center fuller glow
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 127, ${0.4 + singPulse * 0.4})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 13);
        ctx.lineTo(0, 40);
        ctx.stroke();
        ctx.restore();

        // 4. Draw front particles (orbiting in front of the blade)
        orbitalParticles.forEach((p) => {
          if (p.oz >= 0) {
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(p.ox, 42 + p.oy, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#00ffff";
            ctx.beginPath();
            ctx.arc(p.ox, 42 + p.oy, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        // 5. High-fidelity slash trail and spatial tear
        if (options.slashFrame) {
          ctx.save();
          let sweepGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, 45);
          sweepGrad.addColorStop(0, "rgba(232, 67, 147, 0.35)");
          sweepGrad.addColorStop(0.5, "rgba(142, 68, 173, 0.12)");
          sweepGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = sweepGrad;
          ctx.beginPath();
          ctx.arc(0, 20, 42, 0, Math.PI / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();

          // Neon cyan spatial tear seam
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 20, 36, 0, Math.PI / 2);
          ctx.stroke();

          // Spatial sparks along the seam
          ctx.fillStyle = "#ffffff";
          for (let a = 0; a <= Math.PI / 2; a += Math.PI / 6) {
            let sx = Math.cos(a) * 36;
            let sy = 20 + Math.sin(a) * 36;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (isMaelstrom) {
        ctx.rotate(-Math.PI / 8);
        if (options.slashFrame) {
          ctx.translate(15, -10);
          ctx.rotate(-Math.PI / 2.3);
        }
        ctx.fillStyle = "#5c503b";
        ctx.beginPath();
        ctx.rect(-1, -6, 2, 44);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.moveTo(-4, 30);
        ctx.lineTo(0, 48);
        ctx.lineTo(4, 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.moveTo(-3, -2);
        ctx.lineTo(0, -12);
        ctx.lineTo(3, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (options.slashFrame) {
          ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
          ctx.beginPath();
          ctx.arc(0, 20, 35, 0, Math.PI / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(39, 174, 96, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (isStaff) {
        ctx.rotate(-Math.PI / 8);
        if (options.slashFrame) {
          ctx.translate(15, -10);
          ctx.rotate(-Math.PI / 2.3);
        }
        ctx.fillStyle = "#1e1e24";
        ctx.beginPath();
        ctx.rect(-1.5, -4, 3, 34);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.moveTo(-7, 30);
        ctx.quadraticCurveTo(0, 26, 7, 30);
        ctx.lineTo(9, 36);
        ctx.quadraticCurveTo(0, 32, -9, 36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        let gemPulse = 3.5 + Math.sin(Date.now() / 150) * 1.2;
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 34, gemPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-1, 33, 1, 0, Math.PI * 2);
        ctx.fill();
        if (options.slashFrame) {
          ctx.fillStyle = "rgba(230, 126, 34, 0.35)";
          ctx.beginPath();
          ctx.arc(0, 20, 35, 0, Math.PI / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(231, 76, 60, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (isUniqueSword) {
        ctx.rotate(-Math.PI / 8);
        if (options.slashFrame) {
          ctx.translate(15, -10);
          ctx.rotate(-Math.PI / 2.3);
        }
        ctx.fillStyle = "#1e1e24";
        ctx.beginPath();
        ctx.rect(-2, -2, 4, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(0, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(-7, 8, 14, 4);
        ctx.fill();
        ctx.stroke();
        let bleedPulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
        let bladeColor = `rgba(192, 57, 43, ${bleedPulse})`;
        ctx.fillStyle =
          window.mob && window.mob.flashTimer > 0 ? "#ffffff" : bladeColor;
        ctx.strokeStyle = "#960018";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3.5, 12);
        ctx.lineTo(-2, 37);
        ctx.lineTo(2, 37);
        ctx.lineTo(3.5, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ff7f7f";
        ctx.beginPath();
        ctx.rect(-0.8, 14, 1.6, 18);
        ctx.fill();
        if (options.slashFrame) {
          ctx.fillStyle = "rgba(192, 57, 43, 0.35)";
          ctx.beginPath();
          ctx.arc(0, 20, 35, 0, Math.PI / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(150, 0, 24, 0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else {
        let weapItem = equipped.weapon;
        let tierColor = window.getTierColor(
          weapItem ? weapItem.statsRolled : 0,
        );
        let rgbVals = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "236, 240, 241";

        if (options.slashFrame) {
          ctx.translate(15, -10);
          ctx.rotate(-Math.PI / 2.3);

          // --- Sleek, classic sword rendering ---
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.rect(-2, -2, 4, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#8e44ad";
          ctx.beginPath();
          ctx.rect(-5, 8, 10, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ecf0f1";
          ctx.beginPath();
          ctx.rect(-2, 12, 4, 25);
          ctx.fill();
          ctx.stroke();

          // Premium dynamic slash color trail inheriting quality
          ctx.fillStyle = `rgba(${rgbVals}, 0.35)`;
          ctx.beginPath();
          ctx.arc(0, 20, 35, 0, Math.PI / 2);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `rgba(${rgbVals}, 0.55)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.rotate(-Math.PI / 8);

          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.rect(-2, -2, 4, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#8e44ad";
          ctx.beginPath();
          ctx.rect(-5, 8, 10, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ecf0f1";
          ctx.beginPath();
          ctx.rect(-2, 12, 4, 25);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();

      if (
        equipped.weapon &&
        equipped.weapon.isUniqueSingularity &&
        stats.singularityState === "pulsing" &&
        (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
      ) {
        ctx.save();
        ctx.translate(0, -35 + bounce);
        ctx.rotate(Date.now() / 300);
        ctx.strokeStyle = "#e84393";
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#e84393";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          let angle = (i * Math.PI) / 3;
          ctx.lineTo(Math.cos(angle) * 9, Math.sin(angle) * 9);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    let isFacingLeft = options.facing === -1;

    if (isFacingLeft) {
      // Facing Left: Left hand (Subweapon) is in the back (drawn first), Right hand (Main Weapon) is in the front (drawn last)
      drawSubweapon();
      drawBodyAndCostume();
      drawMainWeapon();
    } else {
      // Facing Right: Right hand (Main Weapon) is in the back (drawn first), Left hand (Subweapon) is in the front (drawn last)
      drawMainWeapon();
      drawBodyAndCostume();
      drawSubweapon();
    }

    ctx.restore();
  };

  window.toggleMenuHub = function () {
    let overlay = document.getElementById("menu-hub-overlay");
    let card = document.getElementById("menu-hub-card");
    if (!overlay || !card) return;

    if (overlay.style.display === "none" || overlay.style.display === "") {
      window.hideTooltip();
      overlay.style.display = "flex";
      window.updateHubAlerts();

      // Clear dynamic positioning on first load so it defaults to centered Flexbox
      card.style.top = "";
      card.style.left = "";

      // Wire up dragging handlers
      window.makeWindowDraggable(
        card,
        document.getElementById("menu-hub-handle"),
      );
    } else {
      overlay.style.display = "none";
      window.hideTooltip();
    }
  };

  window.toggleDungeonMenu = function (event) {
    // Bypassed standalone absolute menu wrapper - simply redirect directly to native tab
    if (event) event.stopPropagation();
    window.switchTab("activities");
  };

  window.showGuidebook = function () {
    window.toggleMenuHub(); // Dismiss the hub panel first

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Hoor\\'s Tactical Guidebook",
        `Welcome, Hero! Optimize your build with these tactical tips:<br><br>
           • <strong style="color:var(--accent-blue);">Deflection Mastery:</strong> Equip a Shield to enable Block Rate (capped at 20% / 30% / 40%), or a Dagger to enable Parry (capped at 15% / 25% / 35%).<br>
           • <strong style="color:var(--accent-purple);">Arcane Barrier:</strong> Holding a Tome absorbs a base 20% of incoming damage before Defense checks. INT scales this up to a 35% cap.<br>
           • <strong style="color:var(--accent-green);">Alchemical Synergy:</strong> High INT increases potion durations and unlocks potion sparring chances with select Relics.<br>
           • <strong style="color:var(--text-gold);">Ascension PP:</strong> Slaying Hooktail on higher Stage challenges grants a massive amount of extra Prestige Points! Scale the slider on the Altar before initiating fights.`,
        "Got it!",
        "Exit",
        "var(--accent-purple)",
        function () {},
      );
    }
  };

  window.updateSyncStatus = function (status) {
    let dot = document.getElementById("sync-dot");
    let text = document.getElementById("sync-status-text");
    if (!dot || !text) return;

    if (status === "syncing") {
      dot.style.background = "#f1c40f";
      text.innerText = "SYNCING";
      text.style.color = "#f1c40f";
    } else if (status === "connected") {
      dot.style.background = "#2ecc71";
      text.innerText = "CONNECTED";
      text.style.color = "#2ecc71";
      window.isCloudSynced = true;
    } else {
      dot.style.background = "#7f8c8d";
      text.innerText = "OFFLINE";
      text.style.color = "#7f8c8d";
      window.isCloudSynced = false;
    }
  };

  window.toggleEcoMode = function () {
    window.playerStats.ecoMode = !window.playerStats.ecoMode;
    window.updateEcoModeStyle();
    window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateEcoModeStyle = function () {
    let active = window.playerStats.ecoMode === true;
    let btn = document.getElementById("settings-toggle-eco");
    if (btn) {
      btn.innerText = active
        ? "PERFORMANCE: ECO (SAVER ON)"
        : "PERFORMANCE: MAX FX (SAVER OFF)";
      btn.className = active ? "settings-btn active" : "settings-btn";
    }
    // Toggle class on body for CSS performance overrides
    if (active) document.body.classList.add("eco-active");
    else document.body.classList.remove("eco-active");
  };

  window.toggleLighting = function () {
    if (!window.playerStats) return;
    window.playerStats.enableLighting = !window.playerStats.enableLighting;
    window.updateLightingStyle();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateLightingStyle = function () {
    let enabled =
      window.playerStats && window.playerStats.enableLighting !== false;
    let btn = document.getElementById("settings-toggle-lighting");
    if (btn) {
      btn.innerText = enabled
        ? "DYNAMIC LIGHTING: ENABLED"
        : "DYNAMIC LIGHTING: DISABLED";
      btn.className = enabled ? "settings-btn active" : "settings-btn";
    }
  };

  window.forceReloadCacheBust = function () {
    let baseUrl = window.location.href.split("?")[0];
    window.location.href = `${baseUrl}?v=${Date.now()}`;
  };

  window.requestWipeSaveData = function () {
    let msg1 =
      "WARNING: This will permanently destroy all character levels, equipped gear, vault storage, and gold. Are you sure you want to erase all data?";
    let msg2 =
      "FINAL CONFIRMATION: Type WIPE or confirm below to permanently erase your save file. This action CANNOT be undone!";

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "WIPE SAVE DATA (1/2)",
        msg1,
        "PROCEED TO WIPE",
        "CANCEL",
        "#e74c3c",
        function () {
          window.showCustomConfirm(
            "FINAL CONFIRMATION (2/2)",
            msg2,
            "ERASE EVERYTHING",
            "ABORT",
            "#c0392b",
            function () {
              localStorage.removeItem("extraction_crawler_save");
              window.forceReloadCacheBust();
            },
          );
        },
      );
    } else {
      if (confirm(msg1) && confirm(msg2)) {
        localStorage.removeItem("extraction_crawler_save");
        window.forceReloadCacheBust();
      }
    }
  };

  window.toggleDpsOverlay = function () {
    window.playerStats.showDpsOverlay = !window.playerStats.showDpsOverlay;
    window.updateDpsOverlayStyle();
    window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateDpsOverlayStyle = function () {
    let showOverlay = window.playerStats.showDpsOverlay === true;
    let toggleBtn = document.getElementById("settings-toggle-dps-overlay");

    if (toggleBtn) {
      toggleBtn.innerText = showOverlay ? "Overlay: ON" : "Overlay: OFF";
      toggleBtn.className = showOverlay ? "btn-action" : "btn-action un";
    }

    window.updateDpsOverlayPosition();
  };

  window.updateDpsOverlayPosition = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer = document.getElementById("canvas-container");
    if (!badge || !canvasContainer) return;

    if (!window.playerStats.showDpsOverlay) {
      badge.style.display = "none";
      return;
    }

    badge.style.display = "flex";

    let containerWidth = canvasContainer.clientWidth;
    let containerHeight = canvasContainer.clientHeight;
    let badgeWidth = badge.offsetWidth || 100;
    let badgeHeight = badge.offsetHeight || 32;

    let x = window.playerStats.dpsOverlayX;
    let y = window.playerStats.dpsOverlayY;

    if (x === null || y === null) {
      x = containerWidth - badgeWidth - 10;
      y = containerHeight - badgeHeight - 10;
      window.playerStats.dpsOverlayX = x;
      window.playerStats.dpsOverlayY = y;
    }

    x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
    y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

    badge.style.left = x + "px";
    badge.style.top = y + "px";
  };

  window.initDpsOverlayDrag = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer = document.getElementById("canvas-container");
    if (!badge || !canvasContainer) return;

    let isDragging = false;
    let startX = 0,
      startY = 0;
    let initialLeft = 0,
      initialTop = 0;

    badge.addEventListener("pointerdown", function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = window.playerStats.dpsOverlayX || 0;
      initialTop = window.playerStats.dpsOverlayY || 0;
      badge.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    badge.addEventListener("pointermove", function (e) {
      if (!isDragging) return;
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      let x = initialLeft + dx;
      let y = initialTop + dy;

      let containerWidth = canvasContainer.clientWidth;
      let containerHeight = canvasContainer.clientHeight;
      let badgeWidth = badge.offsetWidth;
      let badgeHeight = badge.offsetHeight;

      x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
      y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

      window.playerStats.dpsOverlayX = x;
      window.playerStats.dpsOverlayY = y;

      badge.style.left = x + "px";
      badge.style.top = y + "px";
      e.stopPropagation();
    });

    const stopDrag = function (e) {
      if (isDragging) {
        isDragging = false;
        badge.releasePointerCapture(e.pointerId);
        if (typeof window.saveGame === "function") window.saveGame();
        e.stopPropagation();
      }
    };

    badge.addEventListener("pointerup", stopDrag);
    badge.addEventListener("pointercancel", stopDrag);
  };

  window.updateTitleSelector = function () {
    let selector = document.getElementById("title-selector");
    if (!selector) return;

    let currentlySelected = window.playerStats.equippedTitle || "";
    let unlocked = window.playerStats.unlockedTitles || [];

    // Clear and rebuild
    selector.innerHTML = '<option value="">[No Title Equipped]</option>';
    unlocked.forEach((tKey) => {
      let tData = window.TITLES_DATA[tKey];
      if (tData) {
        let opt = document.createElement("option");
        opt.value = tKey;
        opt.innerText = tData.name;
        if (currentlySelected === tKey) {
          opt.selected = true;
        }
        selector.appendChild(opt);
      }
    });

    let descEl = document.getElementById("selected-title-desc");
    if (descEl) {
      let activeTitle = window.playerStats.equippedTitle;
      if (activeTitle && window.TITLES_DATA[activeTitle]) {
        let tData = window.TITLES_DATA[activeTitle];
        let statBonusText = [];
        if (tData.stats) {
          for (let sKey in tData.stats) {
            let label = window.getStatLabel(sKey);
            let val = tData.stats[sKey];
            let isPct = [
              "drop",
              "qly",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "gold",
              "fairySpawn",
              "rareSpawn",
            ].includes(sKey);
            let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
            statBonusText.push(`${label} ${valStr}`);
          }
        }
        let bonusStr =
          statBonusText.length > 0 ? ` (${statBonusText.join(", ")})` : "";
        descEl.innerHTML = `${tData.desc}<br><span style="color:${tData.color || "#ff007f"}; font-weight:bold;">Active Bonus: ${bonusStr || "Cosmetic Only"}</span>`;
      } else {
        descEl.innerText =
          "Select an unlocked title from the drop-down to equip it.";
      }
    }
  };

  window.openCavernSigilSackAnimation = function (newItem) {
    let overlay = document.createElement("div");
    overlay.id = "sack-opening-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.92)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "45000";
    overlay.style.backdropFilter = "blur(8px)";
    document.body.appendChild(overlay);

    let color = window.getTierColor(newItem.statsRolled);
    let stars = newItem.statsRolled;

    overlay.innerHTML = `
        <style>
          .cavern-anim-wrapper {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .cavern-runic-circle {
            position: absolute;
            width: 260px;
            height: 260px;
            border: 2px dashed rgba(168, 85, 247, 0.4);
            border-radius: 50%;
            animation: runicSpin 15s linear infinite;
          }
          .cavern-runic-circle::before {
            content: "";
            position: absolute;
            top: 10px; left: 10px; right: 10px; bottom: 10px;
            border: 1px dashed rgba(0, 210, 255, 0.25);
            border-radius: 50%;
            animation: runicSpinReverse 8s linear infinite;
          }
          .sack-anim-container {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 180px;
          }
          .sack-svg {
            animation: sackViolentShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            overflow: visible !important;
          }
          .sack-string {
            animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            animation-delay: 0.5s;
          }
          .sack-neck {
            animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
            animation-delay: 0.52s;
          }
          .portal-blast {
            position: absolute;
            width: 10px;
            height: 10px;
            background: radial-gradient(circle, #fff 0%, ${color} 60%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            transform: scale(0);
            animation: portalErupt 0.6s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
            animation-delay: 0.55s;
            pointer-events: none;
          }

          @keyframes runicSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes runicSpinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes sackViolentShake {
            0% { transform: scale(1) rotate(0deg); }
            10% { transform: scale(1.1) rotate(-12deg); }
            20% { transform: scale(1.1) rotate(14deg); }
            30% { transform: scale(1.1) rotate(-14deg); }
            40% { transform: scale(1.1) rotate(12deg); }
            50% { transform: scale(1.1) rotate(-8deg); }
            60% { transform: scale(1.05) rotate(6deg); }
            70% { transform: scale(1.02) rotate(-3deg); }
            80% { transform: scale(1.01) rotate(1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes stringUntie {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(18px) scale(0.3); opacity: 0; }
          }
          @keyframes neckOpen {
            0% { transform: scaleX(1) scaleY(1); }
            100% { transform: scaleX(1.4) scaleY(0.6) translateY(3px); }
          }
          @keyframes portalErupt {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: scale(25); }
          }
        </style>
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
          <div class="cavern-anim-wrapper">
            <div class="cavern-runic-circle"></div>
            <div class="portal-blast"></div>
            <div class="sack-anim-container">
                        <svg class="sack-svg" width="130" height="130" viewBox="0 0 64 64">
                          <defs>
                            <!-- Luxurious Void Velvet Body Gradient -->
                            <linearGradient id="g_premium_velvet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#7d3c98" />
                              <stop offset="60%" stop-color="#4a154b" />
                              <stop offset="100%" stop-color="#110521" />
                            </linearGradient>
                            <!-- Glowing Magic Celestial Teal Lining -->
                            <linearGradient id="g_magic_celestial" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#00ffff" />
                              <stop offset="100%" stop-color="#008b8b" />
                            </linearGradient>
                            <!-- Polished Gold Metallic Gradient -->
                            <linearGradient id="g_polished_gold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#ffeaa7" />
                              <stop offset="50%" stop-color="#f1c40f" />
                              <stop offset="100%" stop-color="#9a7d0a" />
                            </linearGradient>
                            <!-- Dark shadow mask for folds -->
                            <linearGradient id="g_fold_shadow" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stop-color="rgba(0,0,0,0.4)" />
                              <stop offset="100%" stop-color="rgba(0,0,0,0)" />
                            </linearGradient>
                          </defs>

                          <!-- Soft Blurred Base Drop-Shadow -->
                          <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />

                          <!-- Flared Open Neck Sleeve with Glow -->
                          <g class="sack-neck" style="transform-origin: 32px 28px;">
                            <!-- Glowing Teal Lining Inside -->
                            <path d="M20 16 C25 9, 39 9, 44 16 C39 12, 25 12, 20 16 Z" fill="url(#g_magic_celestial)" opacity="0.8" style="filter: drop-shadow(0 0 3px #00ffff);" />
                            <!-- Left Flared Neck Sleeve -->
                            <path d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Right Flared Neck Sleeve -->
                            <path d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Fold lines on the collar -->
                            <path d="M24 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                            <path d="M40 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                          </g>

                          <!-- Main Velvet Pouch Body -->
                          <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />

                          <!-- Organic Fabric Creases & Depth Shadows -->
                          <path d="M11 38 Q18 42, 32 38" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
                          <path d="M32 18 Q23 35, 18 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" />
                          <path d="M32 18 Q41 35, 46 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" transform="scale(-1, 1) translate(-64, 0)" />

                          <!-- Glowing Cyber-Teal Runic Medallion (Sigil) on Front -->
                          <!-- Outer magic orbit ring -->
                          <circle cx="32" cy="40" r="10" fill="none" stroke="#00ffff" stroke-dasharray="2.5 3" stroke-width="1.2" opacity="0.8" style="filter: drop-shadow(0 0 4px #00ffff);" />
                          <!-- Metallic gold backing plate -->
                          <circle cx="32" cy="40" r="7.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.5" />
                          <!-- White-hot glowing core glyph -->
                          <polygon points="32,35.5 35.5,40 32,44.5 28.5,40" fill="#ffffff" stroke="#00ffff" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #00ffff);" />

                          <!-- Cinched Braided Gold String & Loops -->
                          <g class="sack-string" style="transform-origin: 32px 28px;">
                            <!-- Main Cinch Band -->
                            <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="url(#g_polished_gold)" stroke-width="3.5" stroke-linecap="round" />
                            <path d="M24 29 Q32 32, 40 29" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" />

                            <!-- Left Ribbon Loop -->
                            <path d="M28 29 Q21 26, 25 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />
                            <!-- Right Ribbon Loop -->
                            <path d="M36 29 Q43 26, 39 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />

                            <!-- Central Tie Knot Node -->
                            <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
                            <circle cx="32" cy="29.2" r="1" fill="#fff" opacity="0.6" />

                            <!-- Left Hanging String Strand -->
                            <path d="M30 30 Q24 40, 18 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="18" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />

                            <!-- Right Hanging String Strand -->
                            <path d="M34 30 Q40 40, 46 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="46" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />
                          </g>
                        </svg>
                      </div>
          </div>
          <div style="font-size: 14px; font-weight: 900; color:#9b59b6; letter-spacing: 3px; text-shadow: 0 0 8px rgba(155,89,182,0.5); text-transform: uppercase;">TRANSMUTING CAVERN SIGIL...</div>
        </div>
      `;

    setTimeout(() => {
      let buffDescs = newItem.buffs
        .map(
          (b) =>
            `<span style="color:#2ecc71; display:block; font-size:10px; margin-bottom:2px;">• ✦ ${b.name}: ${b.desc}</span>`,
        )
        .join("");
      let debuffDescs = newItem.debuffs
        .map(
          (d) =>
            `<span style="color:#e74c3c; display:block; font-size:10px; margin-bottom:2px;">• ◈ ${d.name}: ${d.desc}</span>`,
        )
        .join("");

      overlay.innerHTML = `
              <div style="background:#15121b; border:3px solid ${color}; border-radius:12px; width:95%; max-width:400px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s;">
                <h2 style="margin:0 0 10px 0; color:${color}; letter-spacing:2px; text-transform:uppercase; font-size:18px;">✦ SIGIL UNBOXED! ✦</h2>
                <div style="height:2px; background:linear-gradient(90deg, transparent, ${color}, transparent); margin-bottom:15px;"></div>
                <div style="text-align:center; margin-bottom:12px;">${window.getEquipIconHtml(newItem, 48)}</div>
                <h3 style="color:${color}; font-size:14px; margin:0 0 4px 0;">${newItem.name}</h3>
                <span style="font-size:10px; color:#aaa; font-family:monospace; display:block; margin-bottom:12px;">Quality: ${stars}★ ${window.getTierName(stars)}</span>

                <div style="background:#090610; border:1px solid #333; border-radius:6px; padding:12px; text-align:left; margin-bottom:15px; line-height:1.45;">
                              <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">[ SIGIL MODIFIERS ]</strong>
                              ${buffDescs}
                              ${debuffDescs}
                              <div style="border-top:1px dashed #333; margin-top:8px; padding-top:6px; display:flex; flex-direction:column; gap:2px; font-family:monospace; font-size:9.5px;">
                                <span style="color:#3498db; font-weight:bold;">✦ Focus Rewards: +${(newItem.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                                ${newItem.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold;">✦ Quality Boost: +${(newItem.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                              </div>
                            </div>

                <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:${color}; color:${stars === 4 || stars === 1 ? "#fff" : "#111"}; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 0 10px ${color}55;">Store in Sigil Sack</button>
                              </div>
                            `;
    }, 1100);
  };
})();
