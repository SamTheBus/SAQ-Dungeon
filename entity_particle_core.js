  // Scoped Date wrapper referencing window.Date to bypass local temporal dead zone checks
  const ScopedDate = class extends window.Date {
    static now() {
      return window.Date.now();
    }
  };
  const Date = ScopedDate;

  // Static particle themes to avoid runtime array allocations on entity death
  const PARTICLE_THEMES = {
    calamity_specter: ["#7c3aed", "#ff0055", "#0d011a", "#000000"],
    slag_slime: ["#2ecc71", "#27ae60", "#a3fd83", "#111116"],
    rust_nibbler: ["#d35400", "#e67e22", "#7f8c8d", "#5c3a21"],
    brimstone_colossus: ["#ff5500", "#d35400", "#111115", "#2c0e08"],
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
  window.PARTICLE_THEMES = PARTICLE_THEMES;

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
        let pt = this.particlePool.get(
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
        if (window.particles) window.particles.push(pt);
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
        let pt = this.particlePool.get(
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
        if (window.particles) window.particles.push(pt);
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
      // Push valid player-dealt damage instances to window.damageHistory
      let dmgVal = 0;
      if (amount !== undefined && amount !== null) {
        dmgVal =
          typeof amount === "object" && amount.valueOf
            ? amount.valueOf()
            : Number(amount);
      }
      if (
        !isNaN(dmgVal) &&
        dmgVal > 0 &&
        type !== "block" &&
        type !== "parry" &&
        type !== "barrier" &&
        type !== "regen"
      ) {
        window.damageHistory = window.damageHistory || [];
        window.damageHistory.push({ time: Date.now(), amount: dmgVal });
      }

      if (type === "block") {
        if (window.SkillTreeManager) {
          if (
            window.SkillTreeManager.getSkillLevel("shield_retaliatory_strike") >
            0
          ) {
            if (window.playerStats)
              window.playerStats.retaliatoryStrikeActive = true;
          }
          let aegisPulseLvl =
            window.SkillTreeManager.getSkillLevel("shield_aegis_pulse");
          if (aegisPulseLvl > 0 && window.playerStats) {
            window.playerStats.aegisPulseCount =
              (window.playerStats.aegisPulseCount || 0) + 1;
            if (window.playerStats.aegisPulseCount >= 5) {
              window.playerStats.aegisPulseCount = 0;
              let pStats = window.resolvePlayerStats
                ? window.resolvePlayerStats()
                : {};
              let maxHp = pStats.maxHp || 100;
              let healAmount = maxHp * (aegisPulseLvl * 0.03);

              if (window.player) {
                if (
                  window.player.hp &&
                  typeof window.player.hp.add === "function"
                ) {
                  let healBig = BigNum.from(Math.round(healAmount));
                  window.player.hp = BigNum.min(
                    window.player.maxHp || window.player.hp,
                    window.player.hp.add(healBig),
                  );
                } else if (typeof window.player.hp === "number") {
                  window.player.hp = Math.min(
                    window.player.maxHp || window.player.hp,
                    window.player.hp + healAmount,
                  );
                }

                window.spawnAegisPulseVisual(window.player.x, window.player.y);
                this.spawnDamageEffect(
                  window.player.x,
                  window.player.y - 15,
                  Math.round(healAmount),
                  "regen",
                );
              }
            }
          }
        }
      }

      let expLvl =
        (window.playerStats && window.playerStats.exposeWeaknessLvl) ||
        (window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_expose_weakness")
          : 0);
      if (
        (type === "dagger" || type === "riposte") &&
        expLvl > 0 &&
        targetObj
      ) {
        targetObj.exposeWeaknessTimer = 300; // 5 seconds at 60fps
      }

      if (type === "parry" || type === "parry_counter") {
        let sS = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_shadow_step")
          : 0;
        if (sS > 0 && window.playerStats) {
          window.playerStats.shadowStepTimer = 240; // 4 seconds at 60fps
          window.playerStats.shadowStepLevel = sS;
        }

        let hasDecoy =
          window.SkillTreeManager &&
          (window.SkillTreeManager.getSkillLevel("dagger_shadow_decoy") > 0 ||
            window.SkillTreeManager.getSkillLevel("dagger_keystone_assassin") >
              0);
        if (hasDecoy && window.player) {
          let spawnX = targetObj
            ? targetObj.x + (targetObj.w || 24) / 2
            : window.player.x + (Math.random() - 0.5) * 30;
          let spawnY = targetObj
            ? targetObj.y + (targetObj.h || 24) / 2
            : window.player.y + (Math.random() - 0.5) * 30;
          window.spawnShadowDecoyVisual(spawnX, spawnY);
        }
      }

      let hasSanguine =
        window.SkillTreeManager &&
        (window.SkillTreeManager.getSkillLevel("dagger_sanguine_rupture") > 0 ||
          window.SkillTreeManager.getSkillLevel("dagger_keystone_sanguine") >
            0);

      if (isCrit && hasSanguine && targetObj) {
        let bStacks = targetObj.bleedStacks || 0;
        if (bStacks > 0) {
          targetObj.bleedStacks = 0; // Consume the bleed
          window.spawnSanguineRuptureVisual(x, y);
          this.triggerScreenShake(6, 12);
        }
      }

      if (
        type === "slash" &&
        window.playerStats &&
        window.playerStats.retaliatoryStrikeActive
      ) {
        window.playerStats.retaliatoryStrikeActive = false;
      }
      // Award active combat Mastery XP based on trigger action types
      if (
        window.equippedSlots &&
        window.equippedSlots.subweapon &&
        window.gainSubweaponXp &&
        window.SkillTreeManager
      ) {
        let activeSub = window.equippedSlots.subweapon;
        let subType = activeSub.subType || activeSub.type;

        // Resolve equivalent current floor depth for trigger scaling
        let depth = 1;
        if (
          window.playerStats &&
          window.playerStats.isDungeonMode &&
          window.player
        ) {
          depth = window.player.depth || 1;
        } else if (window.playerStats) {
          depth = Math.max(1, Math.floor((window.playerStats.stage || 1) / 5));
        }
        let triggerMult = Math.max(1.0, Math.pow(depth, 0.35));

        // On-Hit Passive Progression (+1 XP for any successful strike if a subweapon is equipped)
        if (type === "slash") {
          window.gainSubweaponXp(subType, Math.round(1 * triggerMult));
        }

        if (
          subType === "shield" &&
          ["block", "counter", "shield_bash", "aegis_counter"].includes(type)
        ) {
          let xp = 0;
          if (type === "block") {
            let fort =
              window.SkillTreeManager.getSkillLevel("shield_fortitude") || 0;
            let wall =
              window.SkillTreeManager.getSkillLevel("shield_iron_wall") || 0;
            xp = 4 + fort + wall;
          } else {
            let ret =
              window.SkillTreeManager.getSkillLevel("shield_retaliation") || 0;
            xp = 8 + ret * 2;
          }
          // Earth-Breaker Bash: +15 Base XP for each enemy successfully stunned
          if (type === "shield_bash") {
            let ebRank =
              window.SkillTreeManager.getSkillLevel(
                "shield_earth_breaker_bash",
              ) || 0;
            if (ebRank > 0 && Math.random() < ebRank * 0.15) {
              xp += 15;
            }
          }
          if (xp > 0)
            window.gainSubweaponXp("shield", Math.round(xp * triggerMult));
        } else if (
          subType === "dagger" &&
          [
            "parry",
            "riposte",
            "parry_counter",
            "poison",
            "bleed",
            "dagger",
          ].includes(type)
        ) {
          let xp = 0;
          if (type === "parry" || type === "parry_counter") {
            let pR = window.SkillTreeManager.getSkillLevel("dagger_parry") || 0;
            let sS =
              window.SkillTreeManager.getSkillLevel("dagger_shadow_step") || 0;
            xp = 6 + (pR + sS) * 2;
          } else if (type === "riposte") {
            let lP =
              window.SkillTreeManager.getSkillLevel(
                "dagger_lethal_precision",
              ) || 0;
            xp = 8 + lP * 3;
          } else if (type === "poison" || type === "bleed") {
            // Cap tick frequency to prevent training-dummy or AFK-farming exploits
            if (Math.random() < 0.25) {
              xp = 1;
            }
          } else if (type === "dagger") {
            // Standard offhand strike or flurry strike
            let hasAssassin =
              window.SkillTreeManager.getSkillLevel(
                "dagger_keystone_assassin",
              ) > 0;
            xp = hasAssassin ? 10 : 2; // +10 Base XP for Shadow Assassin flurry strikes, 2 for default offhand
          }
          if (xp > 0)
            window.gainSubweaponXp("dagger", Math.round(xp * triggerMult));
        } else if (subType === "tome" && type === "barrier") {
          let rS =
            window.SkillTreeManager.getSkillLevel("tome_runic_barrier") || 0;
          let xp = 5 + rS * 2;
          window.gainSubweaponXp("tome", Math.round(xp * triggerMult));
        }
      }

      let hitColor = "#ecf0f1";
      let offsetX = (Math.random() - 0.5) * 30;
      let offsetY = (Math.random() - 0.5) * 20 - 10;
      let targetId = targetObj ? targetObj.id : null;

      if (targetObj && targetObj.isBoss && targetObj.maxHp) {
        if (
          BigNum.from(amount).gte(BigNum.from(targetObj.maxHp).mul(0.6))
        ) {
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
    }

    update() {
      if (this.screenShakeTimer > 0) {
        this.screenShakeTimer--;
      }

      // --- Active Player Debuff Particle Emitters ---
      let p = window.player;
      if (
        p &&
        !window.isGamePaused &&
        window.ParticlePool &&
        window.particles
      ) {
        // A. Poison Gaseous Bubbles
        if (p.poisonStacks > 0 && Math.random() < 0.18) {
          let pt = window.ParticlePool.get(
            p.x + window.randFloat(-8, 8),
            p.y - 12 + window.randFloat(-10, 10),
            window.randFloat(-0.3, 0.3),
            -window.randFloat(0.5, 1.2),
            window.randFloat(1.2, 2.5),
            "#2ecc71",
            0.85,
            window.randInt(15, 30),
            0,
            true,
          );
          pt.style = "glowing_orb";
          pt.scaleDecay = 0.02;
          window.particles.push(pt);
        }

        // B. Crimson Bleed Droplets
        if (p.bleedStacks > 0 && Math.random() < 0.22) {
          let pt = window.ParticlePool.get(
            p.x + window.randFloat(-4, 4),
            p.y + window.randFloat(-2, 2),
            window.randFloat(-0.5, 0.5),
            window.randFloat(0.5, 1.5), // drip down
            window.randFloat(1.0, 2.2),
            "#960018",
            0.9,
            window.randInt(10, 20),
            0.2, // gravity pulls drop down
            true,
          );
          pt.style = "streak";
          window.particles.push(pt);
        }
      }

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

          let pt = this.particlePool.get(
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
          if (window.particles) window.particles.push(pt);
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
        } else if (p.type === "boomerang") {
          // --- HIGH FIDELITY BOOMERANG SHIELD PROJECTILE ---
          ctx.rotate(time / 80 + (p.pulseOffset || 0)); // Rapid spinning!

          // Glowing energy rim
          ctx.fillStyle = "#2980b9";
          ctx.strokeStyle = "#00d2ff";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner metallic casing
          ctx.fillStyle = "#34495e";
          ctx.beginPath();
          ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Core sapphire star
          ctx.fillStyle = "#00ffff";
          ctx.beginPath();
          ctx.moveTo(0, -r + 3);
          ctx.lineTo(2, -1);
          ctx.lineTo(r - 3, 0);
          ctx.lineTo(2, 1);
          ctx.lineTo(0, r - 3);
          ctx.lineTo(-2, 1);
          ctx.lineTo(-r + 3, 0);
          ctx.lineTo(-2, -1);
          ctx.closePath();
          ctx.fill();
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

      this.effectPool.pool.forEach((eff) => {
        if (!eff.active) return;
        ctx.save();
        let hx = eff.x;
        let hy = eff.y;

        if (eff.type === "regen") {
          ctx.save();
          ctx.translate(hx, hy);

          let time = Date.now();
          let pulse = Math.sin(time / 100) * 0.1;
          let scale = 1.0 + pulse;

          // 1. Radiant Emerald Healing Glow (Soft ambient background)
          let glow = ctx.createRadialGradient(0, 1, 1, 0, 1, 15);
          glow.addColorStop(0, "rgba(46, 204, 113, 0.35)");
          glow.addColorStop(0.6, "rgba(46, 204, 113, 0.12)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 1, 15, 0, Math.PI * 2);
          ctx.fill();

          // 2. Restorative Golden Cross-Flares (Drawn behind the heart)
          ctx.strokeStyle = "rgba(241, 196, 15, 0.75)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-10 * scale, 1);
          ctx.lineTo(10 * scale, 1);
          ctx.moveTo(0, 1 - 10 * scale);
          ctx.lineTo(0, 1 + 10 * scale);
          ctx.stroke();

          // 3. Faceted Gemstone Heart Body
          ctx.scale(scale, scale);
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.6;
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.bezierCurveTo(-3, -7, -7, -3, -7, 1);
          ctx.quadraticCurveTo(-7, 5, 0, 10);
          ctx.quadraticCurveTo(7, 5, 7, 1);
          ctx.bezierCurveTo(7, -3, 3, -7, 0, -3);
          ctx.closePath();

          let heartGrad = ctx.createRadialGradient(-2, -2, 1, 0, 2, 8);
          heartGrad.addColorStop(0, "#a3fd83");
          heartGrad.addColorStop(0.5, "#2ecc71");
          heartGrad.addColorStop(1, "#155e37");
          ctx.fillStyle = heartGrad;
          ctx.fill();
          ctx.stroke();

          // 4. Gemstone Cut Highlights (Faceted inner depth lines)
          ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -3);
          ctx.lineTo(0, 10);
          ctx.moveTo(-7, 1);
          ctx.lineTo(0, 2);
          ctx.moveTo(7, 1);
          ctx.lineTo(0, 2);
          ctx.stroke();

          // 5. Glossy Specular Highlight Spot
          ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
          ctx.beginPath();
          ctx.arc(-2.5, -2, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // 6. Balanced High-Contrast Typography
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
          ctx.save();
          ctx.translate(hx, hy);

          let time = Date.now();
          let scale = 1.0 + Math.sin(time / 80) * 0.1;

          // 1. Neon Defensive Pulse Wave Ring (Radial background glow)
          ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 14 * scale, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.8;
          ctx.lineJoin = "round";

          // 2. Linear Gradients for Premium Materials
          let goldGrad = ctx.createLinearGradient(-9, -10, 9, 11);
          goldGrad.addColorStop(0, "#ffeaa7");
          goldGrad.addColorStop(0.5, "#f1c40f");
          goldGrad.addColorStop(1, "#d35400");

          let metalGrad = ctx.createLinearGradient(-8, -9, 8, 10);
          metalGrad.addColorStop(0, "#4a5568");
          metalGrad.addColorStop(0.5, "#718096");
          metalGrad.addColorStop(1, "#2d3748");

          // 3. Draw Outer Gold/Bronze Shield Rim
          ctx.fillStyle = goldGrad;
          ctx.beginPath();
          ctx.moveTo(-7.5, -9);
          ctx.lineTo(7.5, -9);
          ctx.lineTo(9.5, 0);
          ctx.lineTo(0, 11);
          ctx.lineTo(-9.5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 4. Draw Inner Dark Iron Core Face
          ctx.fillStyle = metalGrad;
          ctx.beginPath();
          ctx.moveTo(-5.5, -7.5);
          ctx.lineTo(5.5, -7.5);
          ctx.lineTo(7.5, -0.5);
          ctx.lineTo(0, 9);
          ctx.lineTo(-7.5, -0.5);
          ctx.closePath();
          ctx.fill();

          // 5. Draw Highly Polished Silver Cross Emblem
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -7.5);
          ctx.lineTo(0, 7.5);
          ctx.moveTo(-4.5, -0.5);
          ctx.lineTo(4.5, -0.5);
          ctx.stroke();

          // 6. Real-Time Diagonal Specular Light Reflect Sweep
          let sweepX = ((time / 15) % 40) - 20;
          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sweepX - 4, -9);
          ctx.lineTo(sweepX + 4, 11);
          ctx.stroke();

          ctx.restore();

          // 7. Sleek typography in modern sky blue
          ctx.font = "900 14px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText("BLOCK", hx + 16, hy + 4);
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("BLOCK", hx + 16, hy + 4);
        } else if (eff.type === "parry") {
          ctx.save();
          ctx.translate(hx, hy);

          let time = Date.now();
          let scale = 1.0 + Math.sin(time / 80) * 0.1; // Subtle energy pulse

          // 1. Central Glowing Sky-Blue Starburst Flare
          let grad = ctx.createRadialGradient(0, -6, 1, 0, -6, 12);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.35, "#00d2ff");
          grad.addColorStop(1, "rgba(0, 210, 255, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, -6, 12, 0, Math.PI * 2);
          ctx.fill();

          // High-Fidelity Weapon drawing routine
          let drawSwords = (rot) => {
            ctx.save();
            ctx.rotate(rot);

            // Blade (Tapered silver steel)
            ctx.fillStyle = "#f1f2f6";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-2, 4);
            ctx.lineTo(-0.8, -20);
            ctx.lineTo(0.8, -20);
            ctx.lineTo(2, 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Blade Fuller (Centerline highlight)
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, 4);
            ctx.lineTo(0, -18);
            ctx.stroke();

            // Curved Crossguard (Gold)
            ctx.fillStyle = "#eccc68";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-6, 4);
            ctx.quadraticCurveTo(0, 1, 6, 4);
            ctx.lineTo(5, 6);
            ctx.quadraticCurveTo(0, 3, -5, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Grip
            ctx.fillStyle = "#2f3542";
            ctx.beginPath();
            ctx.rect(-1, 6, 2, 7);
            ctx.fill();
            ctx.stroke();

            // Pommel
            ctx.fillStyle = "#eccc68";
            ctx.beginPath();
            ctx.arc(0, 14, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();
          };

          // Draw crossed swords
          drawSwords(-Math.PI / 5);
          drawSwords(Math.PI / 5);

          ctx.restore();

          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText("PARRY", hx + 13, hy + 4);
          ctx.fillStyle = "#00d2ff";
          ctx.fillText("PARRY", hx + 13, hy + 4);
        } else if (eff.type === "barrier") {
          ctx.save();
          ctx.translate(hx, hy);

          let time = Date.now();
          let pulse = Math.sin(time / 100) * 0.12;
          let rot = (time / 600) % (Math.PI * 2);

          // 1. Translucent Cosmic Glow Backplate
          let glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 14);
          glow.addColorStop(0, "rgba(232, 67, 147, 0.22)");
          glow.addColorStop(0.5, "rgba(155, 89, 182, 0.1)");
          glow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          // 2. Outer Rotating Runic Sigil Ring
          ctx.save();
          ctx.rotate(rot);
          ctx.strokeStyle = "#e84393"; // Hot magenta
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, 9 * (1 + pulse), 0, Math.PI * 2);
          ctx.stroke();

          // 3. Spawning 8 perimeter warding spikes
          for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#9b59b6";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-1.5, -9.5 * (1 + pulse));
            ctx.lineTo(1.5, -9.5 * (1 + pulse));
            ctx.lineTo(0, -12 * (1 + pulse));
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();

          // 4. Inner Counter-Rotating Hexagram Star
          ctx.save();
          ctx.rotate(-rot * 1.5);
          ctx.strokeStyle = "#9b59b6"; // Deep purple
          ctx.lineWidth = 1.0;

          // Triangle 1
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            let angle = (i * Math.PI * 2) / 3;
            let x = Math.cos(angle) * 5;
            let y = Math.sin(angle) * 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();

          // Triangle 2 (Inverted offset)
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            let angle = (i * Math.PI * 2) / 3 + Math.PI;
            let x = Math.cos(angle) * 5;
            let y = Math.sin(angle) * 5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          // 5. White-Hot Arcane Singularity Core
          ctx.fillStyle = "#ffffff";
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#e84393";
          ctx.beginPath();
          ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();

          // 6. Balanced, high-contrast typography
          let text = `BARRIER -${this.formatNumber(eff.amount)}`;
          ctx.font = "bold 15px monospace";
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3.5;
          ctx.lineJoin = "round";
          ctx.strokeText(text, hx + 16, hy + 4);
          ctx.fillStyle = "#a855f7";
          ctx.fillText(text, hx + 16, hy + 4);
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

      // --- Screen-Space Player Debuff Vignette & HUD Tray Overlay ---
      let p = window.player;
      if (p && p.hp > 0 && ctx.canvas) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to screen-space coordinates

        let canvas = ctx.canvas;
        let vg = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          Math.min(canvas.width, canvas.height) * 0.35,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) * 0.75,
        );

        let vigColor = "rgba(2, 1, 6, 0.75)"; // Default dark purple

        if (p.hp / p.maxHp <= 0.25 || (p.bleedStacks && p.bleedStacks > 0)) {
          // Low HP / Bleeding: Pulsing Heavy Blood Crimson Vignette
          let pulse = Math.sin(Date.now() / 100) * 0.1 + 0.75;
          vigColor = `rgba(150, 0, 24, ${pulse})`;
        } else if (p.poisonStacks && p.poisonStacks > 0) {
          // Poisoned: Toxic Green Vignette
          let pulse = Math.sin(Date.now() / 150) * 0.08 + 0.65;
          vigColor = `rgba(39, 174, 96, ${pulse})`;
        } else if (p.snareTimer > 0 || p.inDilationField) {
          // Slowed / Frozen: Icy Blue Vignette
          vigColor = "rgba(56, 189, 248, 0.65)";
        } else if (p.glitchTimer > 0) {
          // Glitched Inverted Controls: Cyber Pink Scanline Vignette
          vigColor = "rgba(232, 67, 147, 0.65)";
        }

        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, vigColor);

        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add dynamic scanline noise if glitched
        if (p.glitchTimer > 0 && Math.random() < 0.4) {
          ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
          for (let y = 0; y < canvas.height; y += 4) {
            ctx.fillRect(0, y, canvas.width, 1);
          }
        }

        // --- SCREEN-SPACE HUD DEBUFF TRAY LOOP ---
        let debuffs = [];
        if (p.snareTimer > 0 || p.inDilationField) {
          debuffs.push({
            name: p.inDilationField ? "DILATED" : "SLOWED",
            col: "#38bdf8",
            val: p.inDilationField
              ? "FIELD"
              : (p.snareTimer / 60).toFixed(1) + "s",
            type: "slow",
          });
        }
        if (p.poisonStacks > 0) {
          debuffs.push({
            name: `POISON x${p.poisonStacks}`,
            col: "#2ecc71",
            val: p.poisonTimer ? (p.poisonTimer / 60).toFixed(1) + "s" : "",
            type: "poison",
          });
        }
        if (p.bleedStacks > 0) {
          debuffs.push({
            name: `BLEED x${p.bleedStacks}`,
            col: "#e74c3c",
            val: p.bleedTimer ? (p.bleedTimer / 60).toFixed(1) + "s" : "",
            type: "bleed",
          });
        }
        if (p.glitchTimer > 0) {
          debuffs.push({
            name: "GLITCHED",
            col: "#e84393",
            val: (p.glitchTimer / 60).toFixed(1) + "s",
            type: "glitch",
          });
        }

        if (debuffs.length > 0) {
          let startX = 20;
          let startY = 85; // Placed comfortably below standard health/portrait systems
          let badgeW = 120;
          let badgeH = 22;
          let spacing = 6;

          debuffs.forEach((db, dIdx) => {
            let dy = startY + dIdx * (badgeH + spacing);

            // 1. Draw Sleek Semi-Translucent Slate Background
            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(startX, dy, badgeW, badgeH, 3);
            } else {
              ctx.rect(startX, dy, badgeW, badgeH);
            }
            ctx.fill();
            ctx.stroke();

            // 2. Draw Left Aesthetic Indicator Accent Border
            ctx.fillStyle = db.col;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(startX, dy, 3, badgeH, [3, 0, 0, 3]);
            } else {
              ctx.rect(startX, dy, 3, badgeH);
            }
            ctx.fill();

            // 3. Draw Procedural Vector Icon
            ctx.save();
            ctx.translate(startX + 12, dy + badgeH / 2);
            ctx.strokeStyle = db.col;
            ctx.lineWidth = 1.0;

            if (db.type === "slow") {
              // Concentric Runic Web
              ctx.beginPath();
              ctx.moveTo(-4, -4);
              ctx.lineTo(4, 4);
              ctx.moveTo(4, -4);
              ctx.lineTo(-4, 4);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(0, 0, 3, 0, Math.PI * 2);
              ctx.stroke();
            } else if (db.type === "poison") {
              // Toxic Bio-Bubble
              ctx.fillStyle = db.col;
              ctx.beginPath();
              ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(-1.5, -2, 1.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (db.type === "bleed") {
              // Shard Blood Droplet
              ctx.fillStyle = db.col;
              ctx.beginPath();
              ctx.moveTo(0, -3.5);
              ctx.quadraticCurveTo(2.2, -0.1, 2.2, 2.2);
              ctx.arc(0, 2.2, 2.2, 0, Math.PI);
              ctx.quadraticCurveTo(-2.2, -0.1, 0, -3.5);
              ctx.closePath();
              ctx.fill();
            } else if (db.type === "glitch") {
              // Digital Double-Box Matrix Link
              ctx.fillStyle = db.col;
              ctx.fillRect(-3, -3, 4, 4);
              ctx.fillStyle = "#00f0ff";
              ctx.fillRect(0, 0, 4, 4);
            }
            ctx.restore();

            // 4. Draw Typography Labels (Crisp Monospace)
            ctx.font = "bold 9px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(db.name, startX + 22, dy + badgeH / 2);

            // 5. Draw Value Countdown Ticker
            ctx.textAlign = "right";
            ctx.fillStyle = db.col;
            ctx.fillText(db.val, startX + badgeW - 8, dy + badgeH / 2);
          });
        }

        ctx.restore();
      }

      ctx.restore();
    }

    drawTargetHealthBar(ctx, target, isScreenSpace = false, bossIndex = 0) {
      if (!target || !target.hp || target.hp <= 0) return;

      let bHp = BigNum.from(target.hp);
      let bMaxHp = BigNum.from(target.maxHp);
      let hpPct = bMaxHp.gt(0)
        ? bHp.div(bMaxHp).toFiniteNumber(1)
        : 0;
      hpPct = Math.max(0, Math.min(1, hpPct));

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
        target.type === "overlord_iron_vault" ||
        target.type === "brimstone_colossus" ||
        target.type === "marcus_boss"
      ) {
        if (!isScreenSpace) {
          ctx.restore();
          return;
        }

        let barW = Math.min(320, ctx.canvas.width * 0.45);
        let barH = 10;
        let barX = (ctx.canvas.width - barW) / 2;
        let barY = 45 + bossIndex * 38;

        if (target.type === "dungeon_miniboss") {
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
        }

        let isMarcus =
          target.type === "marcus_boss" ||
          target.visualType === "marcus" ||
          (target.name && target.name.toLowerCase().includes("marcus"));

        if (isMarcus) {
          this.drawMarcusBossBar(
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

        let isBrimstone =
          target.type === "brimstone_colossus" ||
          target.visualType === "brimstone_colossus" ||
          (target.name && target.name.toLowerCase().includes("brimstone")) ||
          (target.name && target.name.toLowerCase().includes("colossus"));

        if (isBrimstone) {
          this.drawBrimstoneColossusBossBar(
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

        let isTreant =
          target.type === "arachnid_treant" ||
          target.visualType === "arachnid_treant" ||
          (target.name && target.name.toLowerCase().includes("treant"));

        if (isTreant) {
          this.drawArachnidTreantBossBar(
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
      } else if (hpPct < 1.0 || target.eliteAffix) {
        let isElite = !!target.eliteAffix;
        let scaleMult = isElite ? 1.25 : 1.0;
        let barW = (target.w || 24) * scaleMult;
        let barX = target.x + ((target.w || 24) - barW) / 2;
        let barY = target.y - (isElite ? 28 : 12);
        let barH = isElite ? 8 : 6;

        ctx.fillStyle = "#111111";
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(barX, barY, target.trailingPct * barW, barH);

        if (isElite) {
          let fillGrad = ctx.createLinearGradient(
            barX,
            barY,
            barX + barW,
            barY,
          );
          fillGrad.addColorStop(0, "#a855f7"); // Void Purple
          fillGrad.addColorStop(0.5, "#ef4444"); // Crimson Red
          fillGrad.addColorStop(1, "#b91c1c"); // Dark Blood
          ctx.fillStyle = fillGrad;
        } else {
          ctx.fillStyle = "#e74c3c";
        }
        ctx.fillRect(barX, barY, hpPct * barW, barH);

        ctx.strokeStyle = isElite ? "#ffd700" : "#000000"; // Gilded border for Elites
        ctx.lineWidth = isElite ? 1.8 : 1.5;
        ctx.strokeRect(barX, barY, barW, barH);

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

        if (isElite) {
          let labelY = barY - 18;
          let affixName = target.eliteAffix.replace("_", " ").toUpperCase();
          let labelColor = "#ffffff";

          if (target.eliteAffix === "vitality_weaver") labelColor = "#2ecc71";
          else if (target.eliteAffix === "iron_citadel") labelColor = "#3498db";
          else if (target.eliteAffix === "swift_commander")
            labelColor = "#00d2ff";
          else if (target.eliteAffix === "blood_berserker")
            labelColor = "#ef4444";
          else if (target.eliteAffix === "nullifier") labelColor = "#a855f7";
          else if (target.eliteAffix === "web_weaver") labelColor = "#38bdf8";
          else if (target.eliteAffix === "glacial_warden")
            labelColor = "#60a5fa";
          else if (target.eliteAffix === "slag_shaper") labelColor = "#f97316";
          else if (target.eliteAffix === "toxic_decay") labelColor = "#a7f3d0";

          ctx.font = "bold 7px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2.0;
          let labelX = barX + barW / 2;
          let displayLabel = `◈ ${affixName} ◈`;
          ctx.strokeText(displayLabel, labelX, labelY);
          ctx.fillStyle = labelColor;
          ctx.fillText(displayLabel, labelX, labelY);
        }

        if (target.buffStacks) {
          let badgeY = barY - (isElite ? 26 : 18);
          let badgeParts = [];
          if ((target.buffStacks.haste || 0) > 0)
            badgeParts.push({
              text: `Haste ${target.buffStacks.haste}x`,
              col: "#00d2ff",
            });
          if ((target.buffStacks.def || 0) > 0)
            badgeParts.push({
              text: `Def ${target.buffStacks.def}x`,
              col: "#3498db",
            });
          if ((target.buffStacks.atk || 0) > 0)
            badgeParts.push({
              text: `Atk ${target.buffStacks.atk}x`,
              col: "#e74c3c",
            });

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

    drawBrimstoneColossusBossBar(
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
        window.BOSS_BAR_THEMES.brimstone_colossus) || {
        title: "BRIMSTONE COLOSSUS",
        subtitle: "THE OBSIDIAN MAGMA CORE",
        primaryColor: "#ff5500",
        secondaryColor: "#d35400",
      };

      let pulse = Math.sin(time / 110) * 0.18 + 0.82;
      ctx.shadowBlur = 14 * pulse;
      ctx.shadowColor = "#ff5500";

      ctx.fillStyle = "#1c0b05";
      ctx.strokeStyle = "#ff5500";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#f1c40f";
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

        ctx.fillStyle = "#2c0e08";
        ctx.strokeStyle = "#ff5500";
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

        ctx.fillStyle = "#ffaa00";
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

      ctx.fillStyle = "rgba(255, 85, 0, 0.4)";
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
        fillGrad.addColorStop(0.8, "#d35400");
        fillGrad.addColorStop(1, "#2c0e08");
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let sweepX = barX + ((time / 4) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(sweepX, barY + 1, 5, barH - 2);
      }

      ctx.strokeStyle = "rgba(28, 11, 5, 0.95)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#ff5500";
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
      ctx.fillStyle = "#ff5500";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `[MAGMA_INTEGRITY: ${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} | ${(hpPct * 100).toFixed(1)}%]`;
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

    drawArachnidTreantBossBar(
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

      let theme = {
        title: "ARACHNID TREANT",
        subtitle: "ELDRITCH BARK WARDEN",
        primaryColor: "#2ecc71",
        secondaryColor: "#27ae60",
      };

      let pulse = Math.sin(time / 140) * 0.15 + 0.85;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = theme.primaryColor;

      // 1. Moss-green & Bark Dark Base Container
      ctx.fillStyle = "#07120a"; // Dark forest moss
      ctx.strokeStyle = theme.primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Draw Eldritch Root/Vine wrapping ornaments on the brackets
      [-16, barW + 10].forEach((offsetX, idx) => {
        let rootX = barX + offsetX;
        let rootY = barY + barH / 2;
        let isLeft = idx === 0;

        ctx.save();
        ctx.translate(rootX, rootY);
        ctx.rotate(isLeft ? 0 : Math.PI);

        // Draw curved root claw wrapping the bar
        ctx.strokeStyle = "#4d2e1a"; // Wood brown
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(-4, -4, 6, Math.PI * 1.5, Math.PI * 0.5);
        ctx.stroke();

        ctx.strokeStyle = theme.primaryColor; // Glowing eldritch moss
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // 3. Cluster of 3 pulsing Crimson Spider-Eyes (matching Treant body!)
        let eyePulse = Math.sin(time / 100 + idx) * 0.2 + 0.8;
        ctx.fillStyle = "#ff0055"; // Sinister crimson
        ctx.shadowBlur = 6 * eyePulse;
        ctx.shadowColor = "#ff0055";

        ctx.beginPath();
        ctx.arc(-8, -3, 1.8 * eyePulse, 0, Math.PI * 2);
        ctx.arc(-5, 2, 1.4 * eyePulse, 0, Math.PI * 2);
        ctx.arc(-10, 4, 1.2 * eyePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // 4. Draw Wood-Grain Striation lines in the empty background
      ctx.strokeStyle = "#0d2113";
      ctx.lineWidth = 1.0;
      for (let i = 1; i < 4; i++) {
        let lineY = barY + (barH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(barX, lineY);
        ctx.lineTo(barX + barW, lineY);
        ctx.stroke();
      }

      ctx.fillStyle = "#11381a"; // Dark forest underlayer
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
        fillGrad.addColorStop(0, "#a3fd83"); // Bright sap green
        fillGrad.addColorStop(0.5, "#2ecc71"); // Emerald
        fillGrad.addColorStop(1, "#145a32"); // Moss green
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        // Glowing sap flow animation
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

        ctx.fillStyle = "#2ecc71";
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
      ctx.fillStyle = "#2ecc71";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} HP (${(hpPct * 100).toFixed(1)}%)`;
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
        ctx.fillStyle = "#00ffcc";
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

    drawMarcusBossBar(ctx, target, hpPct, bHp, bMaxHp, barX, barY, barW, barH) {
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

      let theme = {
        title: "MARCUS THE OUTLAW",
        subtitle: "THE TREASURY HEIST REBEL",
        primaryColor: "#f1c40f",
        secondaryColor: "#960018",
      };

      let pulse = Math.sin(time / 140) * 0.15 + 0.85;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = theme.primaryColor;

      // 1. Tattered Velvet Base Container
      ctx.fillStyle = "#0c0515"; // Deep void velvet
      ctx.strokeStyle = theme.primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(barX - 18, barY - 2, barW + 36, barH + 4, [6]);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Gold filigree corner bracket clamps
      [-14, barW + 6].forEach((offsetX) => {
        let bracketX = barX + offsetX;
        ctx.fillStyle = "#5c3a21"; // Mahogany wood bases
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

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bracketX + 2, barY + barH / 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
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
        fillGrad.addColorStop(0, "#ffd700"); // Rich gold
        fillGrad.addColorStop(0.5, "#ea580c"); // Amber
        fillGrad.addColorStop(1, "#960018"); // Blood red
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, fillWidth, barH - 2, [3]);
        ctx.fill();

        let scanX = barX + ((time / 6) % fillWidth);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(scanX, barY + 1, 6, barH - 2);
      }

      // Stagger Shield bar overlay (if active)
      let sShield = target.staggerShield
        ? BigNum.from(target.staggerShield)
        : BigNum.from(0);
      let sMaxShield = target.maxStaggerShield
        ? BigNum.from(target.maxStaggerShield)
        : BigNum.from(0);
      if (sShield.gt(0) && sMaxShield.gt(0)) {
        let sDiv = sShield.div(sMaxShield);
        let sPct = Math.max(
          0,
          Math.min(1, sDiv.m * Math.pow(10, Math.min(15, sDiv.e))),
        );
        ctx.fillStyle = "rgba(234, 88, 12, 0.45)"; // Orange stagger shield overlay
        ctx.beginPath();
        ctx.roundRect(barX, barY + 1, barW * sPct, barH - 2, [3]);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.0;
        ctx.strokeRect(barX, barY + 1, barW * sPct, barH - 2);
      }

      ctx.strokeStyle = "rgba(15, 23, 42, 0.9)";
      ctx.lineWidth = 2.0;
      [0.25, 0.5, 0.75].forEach((pct) => {
        let notchX = barX + barW * pct;
        ctx.beginPath();
        ctx.moveTo(notchX, barY + 1);
        ctx.lineTo(notchX, barY + barH - 1);
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
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
      ctx.fillStyle = "#f1c40f";
      ctx.fillText(bossTitle, barX + barW / 2, barY - 6);

      ctx.font = "bold 9px monospace";
      ctx.textBaseline = "top";
      let hpStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)} HP (${(hpPct * 100).toFixed(1)}%)`;
      if (sShield.gt(0)) {
        hpStr += ` [SHIELD: ${window.formatNumber(sShield)}]`;
      }
      ctx.strokeText(hpStr, barX + barW / 2, barY + barH + 4);
      ctx.fillStyle = "#fef08a";
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
      let isBleed = color === "#e74c3c" || color === "#960018";
      let dotSize = 2.2;
      let dotSpacing = 3.5;

      for (let i = 0; i < 5; i++) {
        let cx = startX + i * (dotSize * 2 + dotSpacing) + dotSize;
        let cy = y;
        ctx.save();
        ctx.translate(cx, cy);

        let isActive = i < stacks;

        if (isBleed) {
          // --- HIGH FIDELITY BLEED DROPLIT ---
          ctx.beginPath();
          ctx.moveTo(0, -dotSize * 1.5);
          ctx.quadraticCurveTo(dotSize, -dotSize * 0.1, dotSize, dotSize);
          ctx.arc(0, dotSize, dotSize, 0, Math.PI);
          ctx.quadraticCurveTo(-dotSize, -dotSize * 0.1, 0, -dotSize * 1.5);
          ctx.closePath();

          if (isActive) {
            // Glistening Crimson Drop
            let bleedGrad = ctx.createRadialGradient(
              -0.6,
              -0.6,
              0.2,
              0,
              0,
              dotSize * 1.35,
            );
            bleedGrad.addColorStop(0, "#ff4d4d");
            bleedGrad.addColorStop(0.7, "#c0392b");
            bleedGrad.addColorStop(1, "#960018");
            ctx.fillStyle = bleedGrad;
          } else {
            ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
          }
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fill();

          // Tiny Specular Glisten
          if (isActive) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-0.6, -0.3, 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // --- HIGH FIDELITY POISON TOXIC GLOBULE ---
          ctx.beginPath();
          ctx.moveTo(0, -dotSize * 1.3);
          ctx.lineTo(dotSize * 1.1, -dotSize * 0.6);
          ctx.lineTo(dotSize * 1.1, dotSize * 0.6);
          ctx.lineTo(0, dotSize * 1.3);
          ctx.lineTo(-dotSize * 1.1, dotSize * 0.6);
          ctx.lineTo(-dotSize * 1.1, -dotSize * 0.6);
          ctx.closePath();

          if (isActive) {
            // Radioactive Emerald-to-Lime bubble
            let poisonGrad = ctx.createRadialGradient(
              -0.5,
              -0.5,
              0.2,
              0,
              0,
              dotSize * 1.35,
            );
            poisonGrad.addColorStop(0, "#a3fd83");
            poisonGrad.addColorStop(0.6, "#2ecc71");
            poisonGrad.addColorStop(1, "#1b5f33");
            ctx.fillStyle = poisonGrad;
          } else {
            ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
          }
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fill();

          // Inner toxic core bubble
          if (isActive && Math.sin(Date.now() / 120 + i) > 0.0) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-0.6, -0.3, 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }
  }

  const combatVisuals = new CombatVisualsEngine();
  window.combatVisuals = combatVisuals;
  const entityParticlePool = window.combatVisuals.particlePool;
  window.ParticlePool = entityParticlePool;

  const spawnCombatImpactParticles = function (
    worldX,
    worldY,
    isCrit,
    dirX,
    dirY,
    theme = "default",
  ) {
    if (!window.particles || !window.ParticlePool) return;

    let speedMult = isCrit ? 1.4 : 1.0;
    let streakCount = isCrit ? 8 : 4;
    let shardCount = isCrit ? 6 : 3;

    let colors;
    if (
      theme === "brimstone_colossus" ||
      theme === "magma_elemental" ||
      theme === "lava_serpent" ||
      theme === "hell_bat"
    ) {
      colors = ["#ff5500", "#ff3300", "#111115", "#f1c40f"];
    } else {
      colors = isCrit
        ? ["#ffffff", "#ffd700", "#ff4757"]
        : ["#ffffff", "#eccc68", "#f1c40f"];
    }

    // A. Spawn high-speed directional motion streaks
    for (let i = 0; i < streakCount; i++) {
      let angleOffset = window.randFloat(-0.5, 0.5);
      let baseAngle = Math.atan2(dirY, dirX) + angleOffset;
      let velocity = window.randFloat(4.5, 8.5) * speedMult;

      let vx = Math.cos(baseAngle) * velocity;
      let vy = Math.sin(baseAngle) * velocity;
      let life = window.randInt(11, 18);

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        vx,
        vy,
        window.randFloat(1.4, 2.4) * speedMult,
        colors[Math.floor(Math.random() * colors.length)],
        0.95,
        life,
        life,
        0,
        true,
        0.88,
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
        theme === "brimstone_colossus"
          ? "#ff3300"
          : colors[Math.floor(Math.random() * colors.length)],
        0.9,
        life,
        life,
        0.14,
        true,
        0.94,
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
  };
  window.spawnCombatImpactParticles = spawnCombatImpactParticles;

export {
  PARTICLE_THEMES,
  combatVisuals,
  entityParticlePool as ParticlePool,
  spawnCombatImpactParticles,
};
