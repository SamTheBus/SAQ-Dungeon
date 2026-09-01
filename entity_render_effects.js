  const drawJaggedLine = function (
    ctx,
    x1,
    y1,
    x2,
    y2,
    displace,
    minDisplace = 2,
  ) {
    if (displace < minDisplace) {
      ctx.lineTo(x2, y2);
    } else {
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2;
      let dx = x2 - x1;
      let dy = y2 - y1;
      let len = Math.hypot(dx, dy);
      let nx = -dy / len;
      let ny = dx / len;
      let offset = (Math.random() - 0.5) * displace;
      midX += nx * offset;
      midY += ny * offset;
      window.drawJaggedLine(ctx, x1, y1, midX, midY, displace / 2, minDisplace);
      window.drawJaggedLine(ctx, midX, midY, x2, y2, displace / 2, minDisplace);
    }
  };

  // Initialize central RenderEngine Namespace
  const RenderEngine = {
    getStageTier() {
      if (
        window.currentGameState === "DUNGEON" &&
        window.player &&
        window.player.depth
      ) {
        if (window.playerStats && window.playerStats.activeSpecialChallenge) {
          return window.playerStats.activeSpecialChallenge.primaryTarget.tier;
        }
        return Math.floor((window.player.depth - 1) / 12);
      }
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
  const getStageTier = () => window.RenderEngine.getStageTier();

  // --- VISUAL EFFECT & PARTICLE SPAWNERS ---

  // Append spawnHitSparks & spawnDeathParticles inside window.RenderEngine
  Object.assign(RenderEngine, {
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
  const spawnDeathParticles = (x, y, mobType) =>
    window.RenderEngine.spawnDeathParticles(x, y, mobType);

  // Append spawnTemperParticles inside window.RenderEngine
  Object.assign(RenderEngine, {
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
  const spawnTemperParticles = (isSuccess) =>
    window.RenderEngine.spawnTemperParticles(isSuccess);

  // Append spawnPurchaseCelebration inside window.RenderEngine
  Object.assign(RenderEngine, {
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
  const spawnPurchaseCelebration = (theme, color, rarity) =>
    window.RenderEngine.spawnPurchaseCelebration(theme, color, rarity);

  // Append spawnDamageEffect inside window.RenderEngine
  Object.assign(RenderEngine, {
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
  const spawnDamageEffect = (amount, type, isCrit) =>
    window.RenderEngine.spawnDamageEffect(amount, type, isCrit);

  // Append renderNemesisPreview inside window.RenderEngine
  Object.assign(RenderEngine, {
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
  const renderNemesisPreview = (mobData) =>
    window.RenderEngine.renderNemesisPreview(mobData);

  // --- CORE MOB DRAWING ENGINE ---

  // Bind high-performance delegated proxy method to window.RenderEngine
  RenderEngine.drawSingleMob = (c, m) => window.drawSingleMob(c, m);

export {
  drawJaggedLine,
  RenderEngine,
  getStageTier,
  spawnDeathParticles,
  spawnTemperParticles,
  spawnPurchaseCelebration,
  spawnDamageEffect,
  renderNemesisPreview,
};
