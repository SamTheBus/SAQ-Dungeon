/* ==========================================================================
   PRIMARY PURPOSE: Clean Top-Down Extraction Crawler Core Engine & Game Loop.
   Supports Adventurer's Hub state, Station Interactions, and Extraction Runs.
   ========================================================================= */

(function () {
  let canvas, ctx;
  let isPointerHolding = false;

  window.activeStationPrompt = null;
  window.floatingTexts = [];
  window.xpOrbs = [];

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

  // --- POLYSCOPIC CHEST ERUPTION ENGINE (SUBPHASE C.1) ---
  window.spawnChestEruptionParticles = function (
    worldX,
    worldY,
    isRecoveryOrTier = false,
  ) {
    if (!window.particles || !window.ParticlePool) return;

    let isRecovery = isRecoveryOrTier === true;
    let isGilded = isRecoveryOrTier === "gilded";
    let isAstral = isRecoveryOrTier === "astral";

    // A. Drifting magical star flares
    let starCount = isRecovery ? 12 : isGilded ? 15 : isAstral ? 24 : 6;
    for (let i = 0; i < starCount; i++) {
      let speedX = window.randFloat(-1.5, 1.5);
      let speedY = -window.randFloat(3.0, 7.0);
      let life = window.randInt(25, 55);

      let color = "#ffd700";
      if (isRecovery) {
        color = Math.random() < 0.5 ? "#00d2ff" : "#a855f7";
      } else if (isGilded) {
        color = Math.random() < 0.6 ? "#ffd700" : "#ffaa00";
      } else if (isAstral) {
        color =
          Math.random() < 0.4
            ? "#00ffff"
            : Math.random() < 0.7
              ? "#a855f7"
              : "#ffffff";
      }

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        speedX,
        speedY,
        window.randFloat(3.5, 6.5),
        color,
        0.95,
        life,
        life,
        0.04, // low gravity
        true,
      );
      pt.style = "sparkle_star";
      pt.angle = Math.random() * Math.PI * 2;
      pt.spinSpeed = window.randFloat(-0.08, 0.08);
      pt.scaleDecay = 0.012;
      window.particles.push(pt);
    }

    // B. Tumbling, gravity-influenced splinters/shards
    let splinterCount = isRecovery ? 15 : isGilded ? 18 : isAstral ? 28 : 10;
    let woodColors = ["#8b4513", "#5c2e0b", "#78350f"];
    if (isGilded) {
      woodColors = ["#800020", "#4a0404", "#ffd700"];
    } else if (isAstral) {
      woodColors = ["#0a0f1d", "#111827", "#00ffff"];
    } else if (isRecovery) {
      woodColors = ["#2d3748", "#1e293b", "#0f172a"];
    }

    for (let i = 0; i < splinterCount; i++) {
      let speedX = window.randFloat(-3.0, 3.0);
      let speedY = -window.randFloat(2.5, 6.0);
      let life = window.randInt(20, 45);
      let color = woodColors[Math.floor(Math.random() * woodColors.length)];

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        speedX,
        speedY,
        window.randFloat(2.0, 4.0),
        color,
        1.0,
        life,
        life,
        0.24, // gravity pulls splinters down
        true,
      );
      pt.style = "polygon";
      pt.angle = Math.random() * Math.PI * 2;
      pt.spinSpeed = window.randFloat(-0.25, 0.25);
      pt.scaleDecay = 0.018;
      pt.drag = 0.95;
      window.particles.push(pt);
    }

    // C. Spinning 3D gold coins
    if (!isRecovery) {
      let coinCount = isGilded ? 16 : isAstral ? 24 : 8;
      for (let i = 0; i < coinCount; i++) {
        let speedX = window.randFloat(-2.2, 2.2);
        let speedY = -window.randFloat(3.5, 7.5);
        let life = window.randInt(30, 55);
        let color = isAstral && Math.random() < 0.4 ? "#00ffff" : "#ffd700";

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          speedX,
          speedY,
          window.randFloat(3.0, 4.5),
          color,
          1.0,
          life,
          life,
          0.26, // gravity pulls coins down
          true,
        );
        pt.style = "elliptical_3d";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(0.14, 0.32);
        pt.scaleDecay = 0.008;
        pt.drag = 0.96;
        window.particles.push(pt);
      }
    }

    // D. Swirling Nebular Dust Orbs (Astral Vault exclusively)
    if (isAstral) {
      let orbCount = 10;
      for (let i = 0; i < orbCount; i++) {
        let speedX = window.randFloat(-1.2, 1.2);
        let speedY = -window.randFloat(1.5, 4.0);
        let life = window.randInt(40, 70);
        let color = Math.random() < 0.5 ? "#00ffff" : "#a855f7";

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          speedX,
          speedY,
          window.randFloat(2.5, 4.5),
          color,
          0.85,
          life,
          life,
          -0.02, // low upward floating gravity
          true,
        );
        pt.style = "glowing_orb";
        pt.scaleDecay = 0.01;
        pt.drag = 0.97;
        window.particles.push(pt);
      }
    }
  };

  // --- POLYSCOPIC COMBAT IMPACT ENGINE (SUBPHASE C.2) ---
  window.spawnCombatImpactParticles = function (
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
  };

  window.isChestOpened = function (x, y) {
    if (!window.activeDungeonMap) return false;
    if (!window.activeDungeonMap.openedChests) {
      window.activeDungeonMap.openedChests = new Set();
    }
    return window.activeDungeonMap.openedChests.has(`${x},${y}`);
  };

  window.getChestTierAt = function (x, y) {
    let map = window.activeDungeonMap;
    if (!map || !map.chestTiers) return "iron_bound";
    return map.chestTiers[`${x},${y}`] || "iron_bound";
  };

  window.getChestProgress = function (x, y) {
    let map = window.activeDungeonMap;
    if (!map || !map.chestAnimations) return 0.0;
    let anim = map.chestAnimations[`${x},${y}`];
    return anim ? anim.progress : 0.0;
  };

  window.dispenseChestLootAt = function (tx, ty) {
    let map = window.activeDungeonMap;
    if (!map || !map.grid) return;
    let tile = map.grid[ty][tx];
    let p = window.player;
    let tileSize = map.tileSize;
    if (!p) return;

    let hasBloodToll =
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("blood_toll");
    if (hasBloodToll && tile !== window.TILE_TYPES.RECOVERY_CHEST) {
      let siphon = Math.round(p.hp * 0.12);
      p.hp = Math.max(1, p.hp - siphon);
      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 12,
          `-${siphon} HP (BLOOD TOLL)`,
          "#e74c3c",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("hit");
      }
    }

    if (tile === window.TILE_TYPES.RECOVERY_CHEST) {
      if (!window.isChestOpened(tx, ty)) {
        window.setChestOpened(tx, ty);
        window.playerStats.hasTriggeredRecovery = true;

        if (typeof window.spawnChestEruptionParticles === "function") {
          window.spawnChestEruptionParticles(
            tx * tileSize + tileSize / 2,
            ty * tileSize + tileSize / 2,
            true,
          );
        }

        let rec = window.playerStats && window.playerStats.recoveryLoot;
        if (rec) {
          let itemsToRecover = rec.items || [];
          let recoveredCount = itemsToRecover.length;

          itemsToRecover.forEach((item) => {
            window.spawnGroundLoot(item, p.x, p.y - 10);
          });

          let recoveredGold = BigNum.from(rec.gold || 0);
          if (recoveredGold.gt(0)) {
            window.playerStats.runGold = BigNum.from(
              window.playerStats.runGold || 0,
            ).add(recoveredGold);
            window.addGoldFloatingText(p, recoveredGold);
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("revive");
          }

          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              p.x,
              p.y - 10,
              35,
              "gold_dungeon",
              5,
            );
            window.combatVisuals.spawnBeam(p.x, "#ffd700", 60, true, 0);
            window.combatVisuals.triggerScreenShake(6, 12);
          }

          let msg = `RECOVERY SUCCESS!`;
          if (recoveredCount > 0) msg += ` (${recoveredCount} ITEMS)`;
          if (recoveredGold.gt(0))
            msg += ` (+${window.formatNumber(recoveredGold)} GOLD)`;

          window.spawnFloatingText(p.x, p.y - 25, msg, "#f1c40f");

          if (typeof window.pushHeaderToast === "function") {
            let toastMsg = `✦ Recovered lost items${recoveredGold.gt(0) ? " & " + window.formatNumber(recoveredGold) + " Gold" : ""}!`;
            window.pushHeaderToast(toastMsg, "#2ecc71");
          }

          window.playerStats.recoveryLoot = null;
          if (typeof window.saveGame === "function") window.saveGame();
        }
      }
    } else if (tile === window.TILE_TYPES.CHEST_SPAWN) {
      if (!window.isChestOpened(tx, ty)) {
        window.setChestOpened(tx, ty);
        let stageScale = window.player.depth;
        let tier =
          typeof window.getChestTierAt === "function"
            ? window.getChestTierAt(tx, ty)
            : "iron_bound";
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};
        let playerQuality = pStats.qly || 1.0;

        // Custom Helper to spawn tiered equipment drops
        let spawnTieredEquipment = (qualityMult, minRarity) => {
          let effectiveStage = stageScale * 5;
          let rolledRarity = window.rollItemRarity(
            effectiveStage,
            qualityMult,
            false,
          );
          if (rolledRarity < minRarity) {
            rolledRarity = minRarity;
          }
          let types = [
            "weapon",
            "subweapon",
            "helmet",
            "chest",
            "boots",
            "ring",
          ];
          let chosenType = types[Math.floor(Math.random() * types.length)];
          let newItem = window.createItemObject(
            chosenType,
            rolledRarity,
            stageScale,
            0,
          );
          window.spawnGroundLoot(newItem, p.x, p.y - 10);
        };

        if (typeof window.spawnChestEruptionParticles === "function") {
          window.spawnChestEruptionParticles(
            tx * tileSize + tileSize / 2,
            ty * tileSize + tileSize / 2,
            tier === "gilded" ? "gilded" : tier === "astral" ? "astral" : false,
          );
        }

        if (tier === "iron_bound") {
          // --- IRON-BOUND CHEST LOOT TABLE ---
          if (Math.random() < 0.4) {
            let chestGold = Math.floor(60 * (1 + stageScale * 0.75));
            window.spawnHomingGold(p.x, p.y - 10, chestGold);
            if (
              window.SoundManager &&
              typeof window.SoundManager.playCoinCollect === "function"
            ) {
              window.SoundManager.playCoinCollect();
            }
          } else {
            spawnTieredEquipment(playerQuality, 0);
          }
        } else if (tier === "gilded") {
          // --- GILDED RELIQUARY LOOT TABLE ---
          // 1. Guaranteed massive gold payload
          let chestGold = Math.floor(180 * (1 + stageScale * 0.9));
          window.spawnHomingGold(p.x, p.y - 10, chestGold);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }

          // 2. Guaranteed 1 Equipment item with +25% quality floor 1★ (Rare)
          spawnTieredEquipment(playerQuality * 1.25, 1);

          // 3. 15% Chance for Cavern Sigil (max 3★)
          if (Math.random() < 0.15) {
            let rolledSigilRarity = window.rollSigilRarity(3, playerQuality);
            let sigilItem = window.createItemObject(
              "sigil",
              rolledSigilRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(sigilItem, p.x, p.y - 10);
          }
        } else {
          // --- ASTRAL VAULT LOOT TABLE ---
          // 1. Guaranteed colossal gold payload
          let chestGold = Math.floor(400 * (1 + stageScale * 1.25));
          window.spawnHomingGold(p.x, p.y - 10, chestGold);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }

          // 2. Guaranteed 2 Equipment items with +60% quality floor 2★ (Magic)
          spawnTieredEquipment(playerQuality * 1.6, 2);
          spawnTieredEquipment(playerQuality * 1.6, 2);

          // 3. Guaranteed 1 Cavern Sigil floor 2★ (Magic)
          let maxSigilStars = 0;
          let cleared = window.playerStats.maxFloorCleared || 0;
          if (cleared >= 120) maxSigilStars = 5;
          else if (cleared >= 72) maxSigilStars = 4;
          else if (cleared >= 48) maxSigilStars = 3;
          else if (cleared >= 24) maxSigilStars = 2;
          else if (cleared >= 12) maxSigilStars = 1;

          let rolledSigilRarity = window.rollSigilRarity(
            Math.max(2, maxSigilStars),
            playerQuality,
          );
          if (rolledSigilRarity < 2) {
            rolledSigilRarity = 2;
          }
          let sigilItem = window.createItemObject(
            "sigil",
            rolledSigilRarity,
            stageScale,
            0,
          );
          window.spawnGroundLoot(sigilItem, p.x, p.y - 10);

          // 4. 20% Chance for Rare Crafting Material
          if (Math.random() < 0.2) {
            let mats = ["Ancient Core", "Astral Essence", "Eridium Shard"];
            let chosenMat = mats[Math.floor(Math.random() * mats.length)];
            if (typeof window.spawnGroundMaterial === "function") {
              window.spawnGroundMaterial(chosenMat, 1, p.x, p.y - 10);
            }
          }
        }
      }
    }
  };

  window.setChestOpened = function (x, y) {
    if (!window.activeDungeonMap) return;
    if (!window.activeDungeonMap.openedChests) {
      window.activeDungeonMap.openedChests = new Set();
    }
    window.activeDungeonMap.openedChests.add(`${x},${y}`);
  };

  window.joystick = {
    active: false,
    pointerId: null,
    baseX: 0,
    baseY: 0,
    currX: 0,
    currY: 0,
    radius: 45,
    vx: 0,
    vy: 0,
  };

  window.cursorPointer = {
    screenX: 0,
    screenY: 0,
  };

  window.spawnFloatingText = function (
    x,
    y,
    text,
    color,
    followPlayer = false,
  ) {
    let p = window.player;
    window.floatingTexts.push({
      x: x,
      y: y,
      offsetX: p ? x - p.x : 0,
      offsetY: p ? y - p.y : -20,
      text: text,
      color: color,
      life: 55,
      maxLife: 55,
      followPlayer: followPlayer,
    });
  };

  let lightingCanvas = null;
  let lightingCtx = null;

  window.renderLightingOverlay = function (mainCtx, mainCanvas) {
    if (!window.playerStats || window.playerStats.enableLighting === false)
      return;
    if (window.playerStats.ecoMode) return;

    if (!lightingCanvas) {
      lightingCanvas = document.createElement("canvas");
      lightingCtx = lightingCanvas.getContext("2d");
    }

    if (
      lightingCanvas.width !== mainCanvas.width ||
      lightingCanvas.height !== mainCanvas.height
    ) {
      lightingCanvas.width = mainCanvas.width;
      lightingCanvas.height = mainCanvas.height;
    }

    let map = window.activeDungeonMap;
    if (!map || !map.grid) return;

    let camera = window.DungeonCamera;
    let camX = camera ? camera.x : 0;
    let camY = camera ? camera.y : 0;
    let zoom = camera ? camera.zoom : 1.0;
    let viewW = mainCanvas.width;
    let viewH = mainCanvas.height;

    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let ambientColor = "#e8e2f4";

    if (!isHub) {
      let depth = window.player ? window.player.depth || 1 : 1;
      let sector = Math.floor((depth - 1) / 12);
      if (sector === 0) ambientColor = "#a8bca8";
      else if (sector === 1) ambientColor = "#a0b4cc";
      else if (sector === 2) ambientColor = "#cc9888";
      else if (sector === 3) ambientColor = "#a0ccb0";
      else ambientColor = "#9888cc";
    }

    // 1. Fill entire screen lightmap directly with ambientColor (source-over)
    lightingCtx.globalCompositeOperation = "source-over";
    lightingCtx.fillStyle = ambientColor;
    lightingCtx.fillRect(0, 0, viewW, viewH);

    // Apply World Camera Transform to Lighting Context
    lightingCtx.save();
    lightingCtx.scale(zoom, zoom);
    lightingCtx.translate(-Math.floor(camX), -Math.floor(camY));

    // Bounding box with 200px padding for frustum culling offscreen lights
    let pad = 200;
    let minCamX = camX - pad;
    let maxCamX = camX + viewW / zoom + pad;
    let minCamY = camY - pad;
    let maxCamY = camY + viewH / zoom + pad;

    // 3. Collect Light Emitters in World Coordinates
    let lights = [];

    // Active Spell Lights (temporary glows)
    if (window.activeSpellLights) {
      window.activeSpellLights.forEach((sl) => {
        if (
          sl.x >= minCamX &&
          sl.x <= maxCamX &&
          sl.y >= minCamY &&
          sl.y <= maxCamY
        ) {
          lights.push({
            x: sl.x,
            y: sl.y,
            r: sl.radius,
            innerColor: sl.innerColor,
            outerColor: sl.outerColor,
          });
        }
      });
    }

    // Player Hero Light
    let p = window.player;
    if (p && p.hp > 0) {
      let flicker = Math.sin(Date.now() / 90) * 4;
      lights.push({
        x: p.x,
        y: p.y - 8,
        r: 230 + flicker,
        innerColor: "rgba(255, 248, 230, 0.98)",
        outerColor: "rgba(235, 200, 150, 0.45)",
      });
    }

    // Hub Stations Light
    if (isHub && map.stations) {
      let tileSize = map.tileSize;
      let time = Date.now();
      map.stations.forEach((st) => {
        let sx = st.x * tileSize + tileSize / 2;
        let sy = st.y * tileSize + tileSize / 2;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          if (st.type === window.TILE_TYPES.STATION_FORGE) {
            let forgeFlicker =
              Math.sin(time / 70) * 12 + Math.cos(time / 110) * 8;
            lights.push({
              x: sx - 6,
              y: sy - 4,
              r: 200 + forgeFlicker,
              innerColor: "rgba(255, 210, 130, 1.0)",
              outerColor: "rgba(249, 115, 22, 0.65)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_PORTAL) {
            lights.push({
              x: sx,
              y: sy,
              r: 150,
              innerColor: "rgba(230, 190, 255, 1.0)",
              outerColor: "rgba(168, 85, 247, 0.55)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_ENCHANT) {
            lights.push({
              x: sx,
              y: sy,
              r: 150,
              innerColor: "rgba(224, 242, 254, 1.0)",
              outerColor: "rgba(168, 85, 247, 0.55)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_INN) {
            lights.push({
              x: sx,
              y: sy,
              r: 120,
              innerColor: "rgba(180, 255, 200, 0.95)",
              outerColor: "rgba(46, 204, 113, 0.45)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_GACHAPON) {
            let gachaFlicker =
              Math.sin(time / 120) * 10 + Math.cos(time / 80) * 5;
            lights.push({
              x: sx,
              y: sy - 8,
              r: 180 + gachaFlicker,
              innerColor: "rgba(0, 210, 255, 0.95)",
              outerColor: "rgba(232, 121, 249, 0.55)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_SHOP) {
            let shopFlicker =
              Math.sin(time / 140) * 8 + Math.cos(time / 90) * 4;
            lights.push({
              x: sx,
              y: sy - 6,
              r: 175 + shopFlicker,
              innerColor: "rgba(255, 220, 130, 0.98)",
              outerColor: "rgba(230, 126, 34, 0.50)",
            });
          }
        }
      });
    }

    // Dungeon Map Special Tiles
    if (!isHub) {
      let tileSize = map.tileSize;
      let startCol = Math.max(0, Math.floor(camX / tileSize));
      let endCol = Math.min(
        map.width - 1,
        Math.ceil((camX + viewW / zoom) / tileSize),
      );
      let startRow = Math.max(0, Math.floor(camY / tileSize));
      let endRow = Math.min(
        map.height - 1,
        Math.ceil((camY + viewH / zoom) / tileSize),
      );

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let tile = map.grid[r][c];
          let sx = c * tileSize + tileSize / 2;
          let sy = r * tileSize + tileSize / 2;

          if (
            sx >= minCamX &&
            sx <= maxCamX &&
            sy >= minCamY &&
            sy <= maxCamY
          ) {
            if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
              lights.push({
                x: sx,
                y: sy,
                r: 140,
                innerColor: "rgba(230, 190, 255, 1.0)",
                outerColor: "rgba(168, 85, 247, 0.50)",
              });
            } else if (tile === window.TILE_TYPES.EXTRACTION_ZONE) {
              lights.push({
                x: sx,
                y: sy,
                r: 150,
                innerColor: "rgba(190, 245, 255, 1.0)",
                outerColor: "rgba(0, 210, 255, 0.55)",
              });
            } else if (tile === window.TILE_TYPES.BOSS_GATE) {
              lights.push({
                x: sx,
                y: sy,
                r: 150,
                innerColor: "rgba(255, 180, 180, 1.0)",
                outerColor: "rgba(231, 76, 60, 0.55)",
              });
            } else if (tile === window.TILE_TYPES.CHEST_SPAWN) {
              lights.push({
                x: sx,
                y: sy,
                r: 90,
                innerColor: "rgba(255, 240, 180, 0.95)",
                outerColor: "rgba(255, 215, 0, 0.45)",
              });
            }
          }
        }
      }
    }

    // Wall Torches Light
    if (map.torches) {
      let tileSize = map.tileSize;
      let time = Date.now();
      map.torches.forEach((t) => {
        let sx = t.x * tileSize + tileSize / 2;
        let sy = t.y * tileSize + tileSize - 8;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          let torchFlicker = Math.sin(time / 70 + t.x * 3) * 10;
          lights.push({
            x: sx,
            y: sy,
            r: 190 + torchFlicker,
            innerColor: "rgba(255, 245, 200, 1.0)",
            outerColor: "rgba(255, 140, 30, 0.65)",
          });
        }
      });
    }

    // Sector Decorations Light
    if (map.decorations) {
      map.decorations.forEach((dec) => {
        if (
          dec.light &&
          dec.worldX >= minCamX &&
          dec.worldX <= maxCamX &&
          dec.worldY >= minCamY &&
          dec.worldY <= maxCamY
        ) {
          let radius = dec.light.radius || 80;
          let time = Date.now();
          if (dec.light.pulseType === "flicker") {
            radius += Math.sin(time / 70 + dec.x * 3) * 6;
          } else if (dec.light.pulseType === "wave") {
            radius += Math.sin(time / 180 + dec.x) * 8;
          } else if (dec.light.pulseType === "strobe") {
            radius += Math.sin(time / 50) * 10;
          }
          lights.push({
            x: dec.worldX,
            y: dec.worldY,
            r: radius,
            innerColor: dec.light.innerColor,
            outerColor: dec.light.outerColor,
          });
        }
      });
    }
    if (!isHub && map.grid) {
      let depth = window.player ? window.player.depth || 1 : 1;
      let sector = Math.floor((depth - 1) / 12);
      let tileSize = map.tileSize;
      let time = Date.now();

      let startCol = Math.max(0, Math.floor(minCamX / tileSize));
      let endCol = Math.min(map.width - 1, Math.ceil(maxCamX / tileSize));
      let startRow = Math.max(0, Math.floor(minCamY / tileSize));
      let endRow = Math.min(map.height - 1, Math.ceil(maxCamY / tileSize));

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (map.grid[r][c] === window.TILE_TYPES.FLOOR) {
            let tileHash =
              Math.abs(Math.sin(c * 17.123 + r * 43.51) * 43758.5453) % 1.0;
            let sx = c * tileSize + tileSize / 2;
            let sy = r * tileSize + tileSize / 2;

            if (sector === 2 && tileHash > 0.88) {
              // Lava Vent Light
              let pulse = Math.sin(time / 150 + tileHash * 10) * 10;
              lights.push({
                x: sx,
                y: sy,
                r: 65 + pulse,
                innerColor: "rgba(254, 240, 138, 0.9)",
                outerColor: "rgba(249, 115, 22, 0.45)",
              });
            } else if (sector === 3 && tileHash > 0.85) {
              // Toxic Spore Puddle Light
              lights.push({
                x: sx,
                y: sy,
                r: 50,
                innerColor: "rgba(167, 243, 208, 0.8)",
                outerColor: "rgba(52, 211, 153, 0.35)",
              });
            } else if (sector >= 4 && tileHash > 0.85) {
              // Void Tear Singularity Light
              let pulse = Math.cos(time / 180 + tileHash * 5) * 8;
              lights.push({
                x: sx,
                y: sy,
                r: 60 + pulse,
                innerColor: "rgba(245, 208, 254, 0.85)",
                outerColor: "rgba(232, 121, 249, 0.4)",
              });
            }
          }
        }
      }
    }

    // Active Mobs & Boss Lights
    if (window.activeDungeonMobs) {
      window.activeDungeonMobs.forEach((m) => {
        let sx = m.x + m.w / 2;
        let sy = m.y + m.h / 2;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          if (m.isRare) {
            lights.push({
              x: sx,
              y: sy,
              r: 90,
              innerColor: "rgba(255, 240, 180, 0.95)",
              outerColor: "rgba(241, 196, 15, 0.50)",
            });
          } else {
            lights.push({
              x: sx,
              y: sy,
              r: 50,
              innerColor: "rgba(255, 200, 200, 0.70)",
              outerColor: "rgba(231, 76, 60, 0.25)",
            });
          }
        }
      });
    }

    if (window.mob) {
      let bm = window.mob;
      let sx = bm.x + bm.w / 2;
      let sy = bm.y + bm.h / 2;
      if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
        let r = bm.type === "dungeon_boss" ? 200 : 150;
        lights.push({
          x: sx,
          y: sy,
          r: r,
          innerColor: "rgba(255, 210, 210, 1.0)",
          outerColor: "rgba(231, 76, 60, 0.60)",
        });
      }
    }

    // Gold Particles Light
    if (window.goldParticles) {
      window.goldParticles.forEach((gp) => {
        if (
          gp.x >= minCamX &&
          gp.x <= maxCamX &&
          gp.y >= minCamY &&
          gp.y <= maxCamY
        ) {
          lights.push({
            x: gp.x,
            y: gp.y,
            r: 30,
            innerColor: "rgba(255, 245, 180, 0.80)",
            outerColor: "rgba(255, 215, 0, 0.30)",
          });
        }
      });
    }

    // XP Orbs Light
    if (window.xpOrbs) {
      window.xpOrbs.forEach((orb) => {
        if (!orb.isHomingScreenSpace) {
          if (
            orb.worldX >= minCamX &&
            orb.worldX <= maxCamX &&
            orb.worldY >= minCamY &&
            orb.worldY <= maxCamY
          ) {
            lights.push({
              x: orb.worldX,
              y: orb.worldY,
              r: 35,
              innerColor: "rgba(230, 200, 255, 0.85)",
              outerColor: "rgba(168, 85, 247, 0.40)",
            });
          }
        }
      });
    }

    // Additive Light Blend Pass in World Coordinates
    lightingCtx.globalCompositeOperation = "lighter";
    lights.forEach((light) => {
      let { x, y, r, innerColor, outerColor } = light;
      let grad = lightingCtx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, innerColor);
      grad.addColorStop(0.4, outerColor);
      grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");

      lightingCtx.fillStyle = grad;
      lightingCtx.beginPath();
      lightingCtx.arc(x, y, r, 0, Math.PI * 2);
      lightingCtx.fill();
    });

    lightingCtx.restore();

    // 4. Multiplicative Overlay Pass on Main Canvas in 1:1 Screen Space
    mainCtx.save();
    mainCtx.globalCompositeOperation = "multiply";
    mainCtx.drawImage(lightingCanvas, 0, 0);
    mainCtx.restore();
  };

  // --- ENGINE INITIALIZATION ---
  window.addEventListener("load", function () {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    window.canvas = canvas;
    window.ctx = ctx;

    window.resizeCanvas();
    window.addEventListener("resize", window.resizeCanvas);

    if (window.SoundManager) {
      if (typeof window.SoundManager.synthesizeSwing !== "function") {
        window.SoundManager.synthesizeSwing = function () {
          // Safe silent fallback to prevent character attribute allocation crashes
        };
      }
      if (typeof window.SoundManager.init === "function") {
        window.SoundManager.init();
      }
    }

    // Prevent document-level elastic bouncing unless the touch originates inside a scrollable container
    document.addEventListener(
      "touchmove",
      function (e) {
        let isScrollable = false;
        let el = e.target;
        while (el && el !== document) {
          if (
            el.classList.contains("modal-body") ||
            el.classList.contains("profile-section-body") ||
            el.classList.contains("paperdoll-grid") ||
            el.classList.contains("stash-grid") ||
            el.classList.contains("deploy-gear-list") ||
            el.classList.contains("sigil-picker-list") ||
            el.classList.contains("forge-pane") ||
            el.classList.contains("enchant-pane") ||
            el.classList.contains("ach-list") ||
            el.classList.contains("ach-filter-bar") ||
            el.classList.contains("forge-mode-bar") ||
            el.classList.contains("shop-tab-bar") ||
            el.classList.contains("gacha-tab-bar") ||
            el.classList.contains("satchel-tab-bar") ||
            el.classList.contains("shop-content-panel") ||
            el.classList.contains("settings-body")
          ) {
            isScrollable = true;
            break;
          }
          let style = window.getComputedStyle(el);
          if (
            style.overflow === "auto" ||
            style.overflow === "scroll" ||
            style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflowX === "auto" ||
            style.overflowX === "scroll"
          ) {
            isScrollable = true;
            break;
          }
          el = el.parentNode;
        }

        if (!isScrollable && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    // Intercept touchstart & touchmove on the canvas with non-passive listeners
    // to block iOS back/forward edge swipes and prevent elastic window scrolling during gameplay.
    canvas.addEventListener(
      "touchstart",
      function (e) {
        if (e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    canvas.addEventListener(
      "touchmove",
      function (e) {
        if (e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    // Pointer Input Handling (Joystick & Follow Cursor Modes)
    function handlePointerPosition(e) {
      let rect = canvas.getBoundingClientRect();
      let scaleX = canvas.width / rect.width;
      let scaleY = canvas.height / rect.height;
      let clickX = (e.clientX - rect.left) * scaleX;
      let clickY = (e.clientY - rect.top) * scaleY;
      return { clickX, clickY };
    }

    canvas.addEventListener("pointerdown", function (e) {
      if (window.player.hp <= 0) return;
      if (window.isAnyMenuOpen()) return;
      if (Date.now() - (window.lastModalCloseTime || 0) < 200) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      window.scrollTo(0, 0); // Lock scroll to 0 to prevent landscape viewport shifts
      isPointerHolding = true;

      let { clickX, clickY } = handlePointerPosition(e);
      window.cursorPointer.screenX = clickX;
      window.cursorPointer.screenY = clickY;

      // Check Station Prompt Interaction
      if (
        window.activeStationPrompt &&
        window.currentGameState === window.GAME_STATES.HUB
      ) {
        let p = window.player;
        let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
        let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
        let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
        let pScreenX = (p.x - camX) * zoom;
        let pScreenY = (p.y - camY - 50) * zoom;

        let pw = 220;
        let ph = 36;
        let px = pScreenX - pw / 2;
        let py = pScreenY - ph / 2;

        if (
          clickX >= px - 10 &&
          clickX <= px + pw + 10 &&
          clickY >= py - 10 &&
          clickY <= py + ph + 10
        ) {
          window.interactWithStation(window.activeStationPrompt.type);
          return;
        }
      }

      // Check Perfect Strike Click Interceptor
      let p = window.player;
      let cam = window.DungeonCamera;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let zoom = cam ? cam.zoom : 1.0;
      let worldX = clickX / zoom + cam.x;
      let worldY = clickY / zoom + cam.y;

      let targetMob = window.activeDungeonMobs
        ? window.activeDungeonMobs.find((m) => {
            return (
              m.perfectStrikeTimer > 0 &&
              worldX >= m.x &&
              worldX <= m.x + m.w &&
              worldY >= m.y &&
              worldY <= m.y + m.h
            );
          })
        : null;

      if (targetMob) {
        e.preventDefault();
        e.stopPropagation();
        isPointerHolding = false;

        let dist = Math.hypot(
          p.x - (targetMob.x + targetMob.w / 2),
          p.y - (targetMob.y + targetMob.h / 2),
        );
        if (dist > 50) {
          window.pushHeaderToast(
            "[!] Move closer to execute the Perfect Strike!",
            "#f1c40f",
          );
          return;
        }

        let progress =
          targetMob.perfectStrikeTimer / targetMob.perfectStrikeMax;
        let isPerfect = progress >= 0.15 && progress <= 0.35;

        let dmg = BigNum.from(pStats.atk || p.atk || 15);
        if (isPerfect) {
          dmg = dmg.mul(5);
          targetMob.hp = targetMob.hp.sub(dmg);
          targetMob.flashTimer = 8;
          targetMob.perfectStrikeTimer = 0; // consume

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell");
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              targetMob.x + targetMob.w / 2,
              targetMob.y + targetMob.h / 2,
              dmg,
              "perfect_counter",
              true,
            );
            window.combatVisuals.triggerScreenShake(8, 12);
          }
        } else {
          dmg = dmg.mul(
            pStats.critChance && Math.random() < pStats.critChance
              ? pStats.critDamage || 1.5
              : 1.0,
          );
          targetMob.hp = targetMob.hp.sub(dmg);
          targetMob.flashTimer = 6;
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("swing");
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              targetMob.x + targetMob.w / 2,
              targetMob.y + targetMob.h / 2,
              dmg,
              "slash",
              false,
            );
          }
        }
        return;
      }

      let mode = window.playerStats
        ? window.playerStats.controlMode || "joystick"
        : "joystick";

      if (mode === "joystick") {
        let joy = window.joystick;
        joy.active = true;
        joy.pointerId = e.pointerId;
        joy.baseX = clickX;
        joy.baseY = clickY;
        joy.currX = clickX;
        joy.currY = clickY;
        joy.vx = 0;
        joy.vy = 0;
        if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      } else {
        let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
        let worldX = clickX / zoom + window.DungeonCamera.x;
        let worldY = clickY / zoom + window.DungeonCamera.y;
        window.player.targetX = worldX;
        window.player.targetY = worldY;
      }
    });

    canvas.addEventListener("pointermove", function (e) {
      if (window.player.hp <= 0) return;
      if (window.isAnyMenuOpen()) return;
      if (Date.now() - (window.lastModalCloseTime || 0) < 200) return;

      let { clickX, clickY } = handlePointerPosition(e);
      window.cursorPointer.screenX = clickX;
      window.cursorPointer.screenY = clickY;
      let mode = window.playerStats
        ? window.playerStats.controlMode || "joystick"
        : "joystick";

      if (mode === "joystick") {
        let joy = window.joystick;
        if (joy.active) {
          let dx = clickX - joy.baseX;
          let dy = clickY - joy.baseY;
          let dist = Math.hypot(dx, dy);
          let angle = Math.atan2(dy, dx);
          let clampDist = Math.min(dist, joy.radius);

          joy.currX = joy.baseX + Math.cos(angle) * clampDist;
          joy.currY = joy.baseY + Math.sin(angle) * clampDist;

          let speedFactor = clampDist / joy.radius;
          joy.vx = Math.cos(angle) * speedFactor * window.player.speed;
          joy.vy = Math.sin(angle) * speedFactor * window.player.speed;
        }
      } else if (isPointerHolding) {
        let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
        let worldX = clickX / zoom + window.DungeonCamera.x;
        let worldY = clickY / zoom + window.DungeonCamera.y;
        window.player.targetX = worldX;
        window.player.targetY = worldY;
      }
    });

    function stopJoystick(e) {
      isPointerHolding = false;
      let joy = window.joystick;
      joy.active = false;
      joy.vx = 0;
      joy.vy = 0;
      if (canvas.releasePointerCapture && e && e.pointerId !== undefined) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    canvas.addEventListener("pointerup", stopJoystick);
    canvas.addEventListener("pointercancel", stopJoystick);

    // Allow tapping backdrop overlays to dismiss open modal windows
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("pointerdown", function (e) {
        if (e.target === overlay) {
          e.stopPropagation();
          if (overlay.id === "summary-modal") {
            window.lastModalCloseTime = Date.now();
            window.loadHub();
          } else {
            overlay.style.display = "none";
            window.lastModalCloseTime = Date.now();
            if (
              overlay.id === "mastery-modal" &&
              window.SkillTreeManager &&
              typeof window.SkillTreeManager.stopAnimationLoop === "function"
            ) {
              window.SkillTreeManager.stopAnimationLoop();
            }
          }
          if (typeof window.hideTooltip === "function") window.hideTooltip();
        }
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          e.stopPropagation();
        }
      });
    });

    // Recalculate all existing inventory & equipped items to migrate stats
    if (window.playerStats) {
      if (!window.playerStats.skillTree) window.playerStats.skillTree = {};
      if (window.playerStats.skillTree.utility_treasure_hunter === undefined) {
        window.playerStats.skillTree.utility_treasure_hunter = 0;
      }
    }
    window.recalculateAllInventoryItems();

    window.BossAIEngine = {
      initBoss(m) {
        if (m.bossInitialized) return;
        m.bossInitialized = true;
        m.phase = 1;
        m.actionState = "idle"; // "idle" | "chase" | "telegraphing" | "channeling" | "dazed"
        m.staggerShield = BigNum.from(0);
        m.maxStaggerShield = BigNum.from(0);
        m.channelTimer = 0;
        m.maxChannelTimer = 0;
        m.telegraphTimer = 0;
        m.maxTelegraphTimer = 65;
        m.attackCooldown = 60;
        m.funnyText = "";
        m.funnyTextTimer = 0;
        m.activeEffects = [];
        m.targetX = m.x;
        m.targetY = m.y;

        // Map boss key name by evaluating visualType, name, or type
        m.bossKey = this.resolveBossKey(m);
      },

      resolveBossKey(m) {
        let nameLower = (m.name || "").toLowerCase();
        if (m.visualType === "aegis_goliath" || nameLower.includes("aegis"))
          return "aegis_goliath";
        if (
          m.visualType === "chronos_arbitrator" ||
          nameLower.includes("chronos")
        )
          return "chronos_arbitrator";
        if (m.visualType === "nexus_overseer" || nameLower.includes("nexus"))
          return "nexus_overseer";
        if (
          m.visualType === "gilded_vault_keeper" ||
          nameLower.includes("gilded") ||
          nameLower.includes("vault keeper")
        )
          return "gilded_vault_keeper";
        if (
          m.visualType === "corrosive_abomination" ||
          nameLower.includes("corrosive") ||
          nameLower.includes("abomination")
        )
          return "corrosive_abomination";
        if (
          m.visualType === "hooktail" ||
          nameLower.includes("hooktail") ||
          nameLower.includes("calamity")
        )
          return "hooktail";
        if (
          m.visualType === "overlord_iron_vault" ||
          nameLower.includes("iron vault") ||
          nameLower.includes("overlord")
        )
          return "overlord_iron_vault";

        // Fallback to active stage biome
        let tier =
          typeof window.getStageTier === "function" ? window.getStageTier() : 0;
        const biomes = [
          "arachnid_treant", // Zone 1
          "aegis_goliath", // Zone 2
          "overlord_iron_vault", // Zone 3
          "corrosive_abomination", // Zone 4
          "void_overseer", // Zone 5
          "chronos_arbitrator", // Zone 6
          "nexus_overseer", // Zone 7
        ];
        return biomes[tier] || "arachnid_treant";
      },

      update(m) {
        if (!m || m.hp.lte(0)) return;
        this.initBoss(m);

        let p = window.player;
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};

        if (m.flashTimer > 0) m.flashTimer--;
        if (m.attackCooldown > 0) m.attackCooldown--;
        if (m.funnyTextTimer > 0) m.funnyTextTimer--;

        // Dampen recoil
        if (m.recoilX) {
          m.recoilX *= 0.65;
          if (Math.abs(m.recoilX) < 0.2) m.recoilX = 0;
        }
        if (m.recoilY) {
          m.recoilY *= 0.65;
          if (Math.abs(m.recoilY) < 0.2) m.recoilY = 0;
        }

        let dx = p.x - (m.x + m.w / 2);
        let dy = p.y - (m.y + m.h / 2);
        let dist = Math.hypot(dx, dy);

        // Update facing direction
        if (dx < -1) m.facing = -1;
        else if (dx > 1) m.facing = 1;

        // Push player back gently on solid overlap
        let radius = (m.w || 48) * 0.48;
        let pRadius = p.radius || 9;
        let bossMinDist = pRadius + radius;
        if (dist < bossMinDist) {
          let overlap = bossMinDist - dist;
          let nx = dist > 0 ? dx / dist : 1;
          let ny = dist > 0 ? dy / dist : 0;
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.35);

          let pushX = -nx * overlap * 0.15;
          let pushY = -ny * overlap * 0.15;
          let map = window.activeDungeonMap;
          if (map && map.grid) {
            let bx = m.x + m.w / 2;
            let by = m.y + m.h / 2;
            if (
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(map, bx + pushX, by, radius)
            )
              m.x += pushX;
            if (
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(map, bx, by + pushY, radius)
            )
              m.y += pushY;
          } else {
            m.x += pushX;
            m.y += pushY;
          }
        }

        // Route to specific boss strategy execution based on resolved key
        switch (m.bossKey) {
          case "arachnid_treant":
            this.updateArachnidTreant(m, p, pStats, dist, dx, dy);
            break;
          case "aegis_goliath":
            this.updateAegisGoliath(m, p, pStats, dist, dx, dy);
            break;
          case "overlord_iron_vault":
            this.updateOverlordIronVault(m, p, pStats, dist, dx, dy);
            break;
          case "corrosive_abomination":
            this.updateCorrosiveAbomination(m, p, pStats, dist, dx, dy);
            break;
          case "void_overseer":
            this.updateVoidOverseer(m, p, pStats, dist, dx, dy);
            break;
          case "chronos_arbitrator":
            this.updateChronosArbitrator(m, p, pStats, dist, dx, dy);
            break;
          case "nexus_overseer":
            this.updateNexusOverseer(m, p, pStats, dist, dx, dy);
            break;
          case "gilded_vault_keeper":
            this.updateGildedVaultKeeper(m, p, pStats, dist, dx, dy);
            break;
          case "hooktail":
            this.updateHooktail(m, p, pStats, dist, dx, dy);
            break;
          default:
            this.updateStandardFallback(m, p, pStats, dist, dx, dy);
            break;
        }
      },

      // Baseline fallback/standard movements for safety and modular scaling
      updateStandardFallback(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.state === "telegraphing" || m.actionState === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;
            let ability = m.activeAbility;
            if (ability === "slam") {
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
            } else if (ability === "nova") {
              for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                window.projectiles.push({
                  x: cx,
                  y: cy,
                  vx: Math.cos(angle) * 3.8,
                  vy: Math.sin(angle) * 3.8,
                  r: 6,
                  pulseOffset: i,
                  type: "boss_nova",
                  damage: Math.round(m.atk * 1.1),
                  life: 120,
                });
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");
            } else if (ability === "charge") {
              let dX = m.targetX - cx;
              let dY = m.targetY - cy;
              let dDist = Math.hypot(dX, dY);
              if (dDist > 0) {
                m.x += (dX / dDist) * 75;
                m.y += (dY / dDist) * 75;
              }
              if (
                Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2)) <= 42
              ) {
                window.damagePlayer(Math.round(m.atk * 1.5), m);
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player when within range
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.8;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 60;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let moves = m.moveset || ["slam", "nova", "charge"];
            let chosen = moves[Math.floor(Math.random() * moves.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && moves.includes("slam") && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 65;
            m.maxTelegraphTimer = 65;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },

      // Subphase placeholders (will be fleshed out progressively with stunning visuals)
      updateArachnidTreant(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: ELDRITCH BARK SHIELD & SUMMONS (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && !m.phase2Triggered) {
          m.phase2Triggered = true;
          m.phase = 2;
          m.actionState = "bark_shield";
          m.isStopped = true;

          // Teleport Stage Warden directly to the center of the arena
          let map = window.activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: BARK SHIELD!",
              "#e74c3c",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(cx, cy, 35, "slag_slime", 4);
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");

          // Spawn 3 Sprout Cocoons surrounding the Warden
          window.activeDungeonMobs = window.activeDungeonMobs || [];
          for (let i = 0; i < 3; i++) {
            let angle = (i * Math.PI * 2) / 3;
            let spawnDist = 54;
            let sx = cx + Math.cos(angle) * spawnDist;
            let sy = cy + Math.sin(angle) * spawnDist;

            window.activeDungeonMobs.push({
              id: window.idCounter++,
              type: "mob",
              visualTier: 0,
              visualType: "sprout_cocoon",
              x: sx - 12,
              y: sy - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(60 + m.stageLevel * 20),
              maxHp: BigNum.from(60 + m.stageLevel * 20),
              atk: 0,
              flashTimer: 0,
              attackCooldown: 100,
              isBossSummon: true,
              isCocoon: true,
              hatchTimer: 240, // 4 seconds (240 frames)
              discovered: true,
              hopTimer: window.randInt(0, 29), // Desynchronize summons' hopping phases
            });

            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(sx, sy, 10, "slag_slime", 2);
            }
          }

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Eldritch Bark Shield active! Slay the hatched minions to break it!",
              "#e74c3c",
            );
          }
        }

        // Processing active Bark Shield & Orbital Web Storm particle effects
        if (m.actionState === "bark_shield") {
          let sumCount = window.activeDungeonMobs
            ? window.activeDungeonMobs.filter(
                (mob) => mob.isBossSummon && mob.hp.gt(0),
              ).length
            : 0;

          if (sumCount === 0) {
            // Shield Shatters!
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 60;
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                30,
                "slag_slime",
                4.5,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[✦] Eldritch Bark Shield shattered! Boss is vulnerable!",
                "#2ecc71",
              );
            }
          } else {
            // Emit orbital Web Storm wind particles
            if (Math.random() < 0.4) {
              let angle = Math.random() * Math.PI * 2;
              let orbDist = m.w * 0.75;
              let px = cx + Math.cos(angle) * orbDist;
              let py = cy + Math.sin(angle) * orbDist;
              let rotSpeed = 3.5;
              let vx = -Math.sin(angle) * rotSpeed;
              let vy = Math.cos(angle) * rotSpeed;
              if (window.combatVisuals && window.combatVisuals.particlePool) {
                window.combatVisuals.particlePool.get(
                  px,
                  py,
                  vx,
                  vy,
                  window.randFloat(1.5, 3),
                  Math.random() < 0.5 ? "#ffffff" : "#27ae60",
                  0.8,
                  30,
                  0,
                  true,
                  0,
                );
              }
            }
            return; // Skip normal combat movement/attack AI while shielded
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Creeping vine particles traveling during root snare wind-up
          if (m.activeAbility === "root_snare" && m.telegraphTimer % 3 === 0) {
            let tRatio = 1.0 - m.telegraphTimer / m.maxTelegraphTimer;
            let vx = cx + (m.targetX - cx) * tRatio;
            let vy = cy + (m.targetY - cy) * tRatio;
            if (window.combatVisuals && window.combatVisuals.particlePool) {
              window.combatVisuals.particlePool.get(
                vx + window.randFloat(-4, 4),
                vy + window.randFloat(-4, 4),
                window.randFloat(-0.2, 0.2),
                window.randFloat(-0.2, 0.2),
                window.randFloat(1.5, 2.5),
                "#27ae60",
                0.8,
                24,
                0,
                true,
                0,
              );
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120; // 2s recovery

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "slag_slime",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "root_snare") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(5, 8);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  20,
                  "slag_slime",
                  2.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 75) {
                window.damagePlayer(Math.round(m.atk * 1.3), m);
                p.snareTimer = 132; // 2.2s snare slow
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "[SNARED] -60% Speed!",
                    "#2ecc71",
                    true,
                  );
                }
              }
              if (window.SoundManager) window.SoundManager.play("block");
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a slow, heavy treant pace
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.3;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "root_snare";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateAegisGoliath(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: RAISED TOWER SHIELD (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && m.phase === 1) {
          m.phase = 2;
          m.shieldAngle = Math.atan2(p.y - cy, p.x - cx);
          m.dazeTimer = 0;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TOWER SHIELD!",
              "#00d2ff",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(cx, cy, 30, "aegis_goliath", 4);
            window.combatVisuals.triggerScreenShake(8, 15);
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Aegis Goliath raised his Tower Shield! Flank his exposed sides!",
              "#00d2ff",
            );
          }
          if (window.SoundManager) window.SoundManager.play("revive");
        }

        // Handle Dazed stun sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          // Spawn little daze stars particles on head occasionally
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return; // Frozen and vulnerable while dazed
        }
        m.isStopped = false;

        // Lerp shield angle slowly toward the player to allow flanking outmaneuvers
        if (
          m.phase === 2 &&
          m.shieldAngle !== undefined &&
          m.activeAbility !== "shield_bash"
        ) {
          let targetAngle = Math.atan2(p.y - cy, p.x - cx);
          let angleDiff = targetAngle - m.shieldAngle;
          // Normalize to -PI to PI
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          // Rotate up to 0.038 radians per frame
          m.shieldAngle += Math.max(-0.038, Math.min(0.038, angleDiff));
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Apply active gravitational magnetic pull
          if (m.activeAbility === "magnetic_pull") {
            let pullForce = 2.2;
            let angle = Math.atan2(cy - p.y, cx - p.x);
            let testX = p.x + Math.cos(angle) * pullForce;
            let testY = p.y + Math.sin(angle) * pullForce;

            if (
              window.activeDungeonMap &&
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(
                window.activeDungeonMap,
                testX,
                testY,
                p.radius || 9,
              )
            ) {
              p.x = testX;
              p.y = testY;
            }

            // Spawn blue gravitational sparks flowing inward (Subphase C.3)
            if (
              m.telegraphTimer % 4 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pt = window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-10, 10),
                p.y + window.randFloat(-10, 10),
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                window.randFloat(1.2, 2.5),
                "#00d2ff",
                0.8,
                20,
                0,
                true,
                0,
              );
              pt.style = "streak";
              pt.scaleDecay = 0.035;
              window.particles.push(pt);
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "magnetic_pull") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "aegis_goliath",
                  4.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("block");

              // Ground slam damage check
              if (Math.hypot(p.x - cx, p.y - cy) <= 70) {
                window.damagePlayer(Math.round(m.atk * 1.6), m);
              }
            } else if (ability === "boomerang_shield") {
              // Spawn dual curving boomerang projectiles
              let angleToPlayer = Math.atan2(p.y - cy, p.x - cx);
              let speed = 4.5;

              let angles = [angleToPlayer - 0.25, angleToPlayer + 0.25];
              angles.forEach((ang) => {
                window.projectiles.push({
                  x: cx,
                  y: cy,
                  vx: Math.cos(ang) * speed,
                  vy: Math.sin(ang) * speed,
                  r: 8,
                  type: "boomerang",
                  damage: Math.round(m.atk * 0.9),
                  life: 180,
                  pulseOffset: Math.random() * 10,
                });
              });

              if (window.SoundManager) window.SoundManager.play("swing");
            } else if (ability === "shield_bash") {
              // Executing frontal shield bash
              let pAngle = Math.atan2(p.y - cy, p.x - cx);
              let angleDiff = Math.abs(
                Math.atan2(
                  Math.sin(pAngle - m.shieldAngle),
                  Math.cos(pAngle - m.shieldAngle),
                ),
              );

              if (Math.hypot(p.x - cx, p.y - cy) <= 64 && angleDiff <= 0.5) {
                // Player hit!
                window.damagePlayer(Math.round(m.atk * 1.7), m);
                // Apply knockback
                let kx = p.x + Math.cos(m.shieldAngle) * 24;
                let ky = p.y + Math.sin(m.shieldAngle) * 24;
                if (
                  window.activeDungeonMap &&
                  typeof window.checkCollisionAt === "function" &&
                  !window.checkCollisionAt(
                    window.activeDungeonMap,
                    kx,
                    ky,
                    p.radius || 9,
                  )
                ) {
                  p.x = kx;
                  p.y = ky;
                }
                if (window.combatVisuals) {
                  window.combatVisuals.triggerScreenShake(6, 10);
                  window.combatVisuals.spawnParticles(
                    p.x,
                    p.y,
                    12,
                    "aegis_goliath",
                    3,
                  );
                }
                if (window.SoundManager) window.SoundManager.play("block");
              } else {
                // Player evaded! Overcommit and enter DAZED state
                m.dazeTimer = 210; // 3.5 seconds
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(cx, m.y - 12, "DAZED!", "#ffd700");
                }
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    cx,
                    m.y - 4,
                    15,
                    "gold_dungeon",
                    2.2,
                  );
                  window.combatVisuals.triggerScreenShake(4, 6);
                }
                if (window.SoundManager) window.SoundManager.play("block");
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a steady vanguard speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = m.phase === 2 ? 1.4 : 1.7; // Slightly heavier and slower while shield raised
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let optionsPool = ["magnetic_pull", "boomerang_shield"];
            if (m.phase === 2) optionsPool.push("shield_bash");

            let chosen =
              optionsPool[Math.floor(Math.random() * optionsPool.length)];
            // Bias heavily towards shield_bash when close and in Phase 2
            if (dist < 64 && m.phase === 2 && Math.random() < 0.8) {
              chosen = "shield_bash";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;

            if (chosen === "magnetic_pull") m.telegraphTimer = 90;
            else if (chosen === "boomerang_shield") m.telegraphTimer = 60;
            else m.telegraphTimer = 75; // shield_bash windup
            m.maxTelegraphTimer = m.telegraphTimer;

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateOverlordIronVault(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120; // 2s recovery

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "magma_elemental",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "magma_vents" && m.ventSpawnLocations) {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              // Spawn 2 growing Magma Vents around the player
              window.activeDungeonMobs = window.activeDungeonMobs || [];
              m.ventSpawnLocations.forEach((loc) => {
                window.activeDungeonMobs.push({
                  id: window.idCounter++,
                  type: "mob",
                  visualTier: 2,
                  visualType: "magma_vent",
                  x: loc.x - 12,
                  y: loc.y - 12,
                  w: 24,
                  h: 24,
                  hp: BigNum.from(1),
                  maxHp: BigNum.from(1),
                  parentAtk: m.atk,
                  flashTimer: 0,
                  isMagmaVent: true,
                  ventTimer: 270, // 4.5 seconds
                  discovered: true,
                });

                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    loc.x,
                    loc.y,
                    8,
                    "magma_elemental",
                    1.8,
                  );
                }
              });
              m.ventSpawnLocations = null;
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a slow, heavy colossus speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.35;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "magma_vents";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;

            if (chosen === "magma_vents") {
              // Pre-calculate target spots around the player's current location
              m.ventSpawnLocations = [];
              for (let i = 0; i < 2; i++) {
                let angle = Math.random() * Math.PI * 2;
                let spawnDist = window.randFloat(40, 80);
                m.ventSpawnLocations.push({
                  x: p.x + Math.cos(angle) * spawnDist,
                  y: p.y + Math.sin(angle) * spawnDist,
                });
              }
            }

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateCorrosiveAbomination(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // Leave trailing Acid Pools while moving across both phases
        if (m.isMoving && window.logicClock % 40 === 0) {
          window.cavernInteractives = window.cavernInteractives || [];
          window.cavernInteractives.push({
            id: window.idCounter++,
            type: "acid_pool",
            x: cx,
            y: cy,
            w: 24,
            h: 12,
            life: 480, // 8 seconds (480 frames)
            maxLife: 480,
          });
        }

        // --- PHASE 2 TRIGGER: TOXIC SPORE NOVA (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && !m.phase2Triggered) {
          m.phase2Triggered = true;
          m.phase = 2;
          m.attackCooldown = 40;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TOXIC SPORE STORM!",
              "#2ecc71",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "swamp_basilisk",
              4,
            );
            window.combatVisuals.triggerScreenShake(8, 15);
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Corrosive Abomination has entered Phase 2! Watch out for toxic spore storms!",
              "#2ecc71",
            );
          }
          if (window.SoundManager) window.SoundManager.play("revive");
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "swamp_basilisk",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "spore_storm") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "swamp_basilisk",
                  3.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              // Spawn 3 homing toxic spores with a strict 6-second lifetime
              window.activeDungeonMobs = window.activeDungeonMobs || [];
              for (let i = 0; i < 3; i++) {
                let angle = (i * Math.PI * 2) / 3;
                let spawnDist = 45;
                let sx = cx + Math.cos(angle) * spawnDist;
                let sy = cy + Math.sin(angle) * spawnDist;

                window.activeDungeonMobs.push({
                  id: window.idCounter++,
                  type: "mob",
                  visualTier: 3,
                  visualType: "toxic_spore",
                  x: sx - 12,
                  y: sy - 12,
                  w: 24,
                  h: 24,
                  hp: BigNum.from(1),
                  maxHp: BigNum.from(1),
                  atk: Math.round(m.atk * 0.95),
                  flashTimer: 0,
                  isSpore: true,
                  isBossSummon: true,
                  hatchTimer: 360, // 6s lifetime (360 frames)
                  discovered: true,
                });
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.6;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
              m.isMoving = true;
            } else {
              m.isMoving = false;
            }
          } else {
            m.isMoving = false;
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let optionsPool = ["slam"];
            if (m.phase === 2) optionsPool.push("spore_storm");

            let chosen =
              optionsPool[Math.floor(Math.random() * optionsPool.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "spore_storm" ? 85 : 65;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateVoidOverseer(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Apply active inverse-square gravitational singularity pull
          if (m.activeAbility === "singularity") {
            let tDx = cx - p.x;
            let tDy = cy - p.y;
            let tDist = Math.hypot(tDx, tDy);

            if (tDist > 10) {
              // Gravity forces increase rapidly the closer you get (inverse square)
              let pull = 4500 / (tDist * tDist + 400);
              pull = Math.min(4.8, pull); // Cap maximum drag speed

              let testX = p.x + (tDx / tDist) * pull;
              let testY = p.y + (tDy / tDist) * pull;

              if (
                window.activeDungeonMap &&
                typeof window.checkCollisionAt === "function" &&
                !window.checkCollisionAt(
                  window.activeDungeonMap,
                  testX,
                  testY,
                  p.radius || 9,
                )
              ) {
                p.x = testX;
                p.y = testY;
              }
            }

            // Spawn space dust vacuum particles flowing inward (Subphase C.3)
            if (
              m.telegraphTimer % 3 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pAngle = Math.random() * Math.PI * 2;
              let pDist = window.randFloat(40, 150);
              let px = cx + Math.cos(pAngle) * pDist;
              let py = cy + Math.sin(pAngle) * pDist;
              let vx = -Math.cos(pAngle) * (pDist / 15);
              let vy = -Math.sin(pAngle) * (pDist / 15);

              let pt = window.combatVisuals.particlePool.get(
                px,
                py,
                vx,
                vy,
                window.randFloat(1.5, 3.5),
                Math.random() < 0.5 ? "#e84393" : "#8e44ad",
                0.8,
                15,
                0,
                true,
                -0.05,
              );
              pt.style = "streak"; // Transform accretion dust into high-velocity inward streaks
              pt.scaleDecay = 0.04;
              window.particles.push(pt);
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "void_orb",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "singularity") {
              // Accretion Core Collapse & Implosion!
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(12, 20);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  35,
                  "void_orb",
                  5.5,
                );
                window.combatVisuals.spawnBeam(cx, "#e84393", 45, false);
              }
              if (window.SoundManager) window.SoundManager.play("death");

              // Hit detection within the 90px Event Horizon radius
              if (Math.hypot(p.x - cx, p.y - cy) <= 90) {
                window.damagePlayer(Math.round(m.atk * 1.95), m);
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 15,
                    "EVENT HORIZON IMPLOSION!",
                    "#e84393",
                  );
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.6;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "singularity";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "singularity" ? 360 : 65; // 6s channel for singularity
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateChronosArbitrator(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: CHRONOS REWIND CHANNEL (UNDER 40% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.4 && m.phase === 1) {
          m.phase = 2;
          m.actionState = "chrono_rewind";
          m.isStopped = true;
          m.channelTimer = 240; // 4 seconds
          m.staggerShield = m.maxHp.mul(0.15); // 15% Max HP stagger barrier

          // Teleport directly to the center of the arena
          let map = window.activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: CHRONOS REWIND!",
              "#ffd700",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "gold_dungeon",
              4.5,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Chronos Arbitrator is channeling Chronos Rewind! Shatter his Stagger Shield to interrupt!",
              "#ffd700",
            );
          }
        }

        // Processing active Chronos Rewind channel
        if (m.actionState === "chrono_rewind") {
          m.channelTimer--;
          if (m.channelTimer <= 0) {
            // Channel completes! strike XII and heal 20%
            let healAmt = m.maxHp.mul(0.2);
            m.hp = window.BigNumMin(m.maxHp, m.hp.add(healAmt));

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                cx,
                m.y - 12,
                `+${window.formatNumber(healAmt)} HP (REWIND)`,
                "#2ecc71",
              );
            }
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] Clock struck XII! Chronos Arbitrator rewound time and healed himself!",
                "#e74c3c",
              );
            }
            if (window.SoundManager) window.SoundManager.play("spell");
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                20,
                "gold_dungeon",
                3.0,
              );
            }

            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 110;
          }
          return; // Skip normal movements during channel
        }

        // Handle Dazed stun sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return;
        }
        m.isStopped = false;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "dilation_field") {
              // Spawn a static Time Dilation Field hazard on the ground
              window.cavernInteractives = window.cavernInteractives || [];
              window.cavernInteractives.push({
                id: window.idCounter++,
                type: "dilation_field",
                x: m.targetX,
                y: m.targetY,
                w: 40,
                h: 18,
                life: 420, // 7 seconds (420 frames)
                maxLife: 420,
              });

              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  2.0,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell");
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at normal speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.7;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "dilation_field";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "dilation_field" ? 60 : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateNexusOverseer(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: DIGITAL DECOYS SPLIT (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && m.phase === 1) {
          m.phase = 2;
          m.actionState = "cyber_barrier";
          m.isStopped = true;

          // Teleport directly to the center of the arena
          let map = window.activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: CYBER BARRIER!",
              "#ff007f",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "nexus_overseer",
              4.0,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");

          // Spawn 2 Holographic Decoys
          window.activeDungeonMobs = window.activeDungeonMobs || [];
          let decoyOffsets = [-48, 48];
          decoyOffsets.forEach((ox) => {
            window.activeDungeonMobs.push({
              id: window.idCounter++,
              type: "mob",
              visualTier: 6,
              visualType: "nexus_overseer",
              x: cx + ox - 12,
              y: cy + 18 - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(120 + m.stageLevel * 25),
              maxHp: BigNum.from(120 + m.stageLevel * 25),
              atk: Math.round(m.atk * 0.8),
              flashTimer: 0,
              attackCooldown: 80,
              isRanged: true,
              projectileType: "void",
              isBossSummon: true,
              isDecoy: true,
              discovered: true,
              hopTimer: window.randInt(0, 29), // Desynchronize decoy hopping phases
            });

            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx + ox,
                cy + 18,
                10,
                "nexus_overseer",
                2,
              );
            }
          });

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Cyber Barrier active! Slay the 2 Holographic Decoys to break it!",
              "#ff007f",
            );
          }
        }

        // Processing active Cyber Barrier
        if (m.actionState === "cyber_barrier") {
          let decoyCount = window.activeDungeonMobs
            ? window.activeDungeonMobs.filter(
                (mob) => mob.isDecoy && mob.hp.gt(0),
              ).length
            : 0;

          if (decoyCount === 0) {
            // Barrier Shatters!
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 60;
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                30,
                "nexus_overseer",
                4.5,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[✦] Cyber Barrier shattered! Nexus Overseer is vulnerable!",
                "#00b894",
              );
            }
          } else {
            // Emit digital matrix ambient glitch noise
            if (
              Math.random() < 0.3 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pAngle = Math.random() * Math.PI * 2;
              let orbDist = m.w * 0.75;
              let px = cx + Math.cos(pAngle) * orbDist;
              let py = cy + Math.sin(pAngle) * orbDist;
              window.combatVisuals.particlePool.get(
                px,
                py,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8,
                window.randFloat(1.2, 2.5),
                "#ff007f",
                0.8,
                20,
                0,
                true,
                0,
              );
            }
            return; // Protected while decoys are active
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "nexus_overseer",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "control_glitch") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(5, 8);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "nexus_overseer",
                  3.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell");

              // Scramble player joystick if caught within 180px
              if (dist <= 180) {
                p.glitchTimer = 180; // 3.0 seconds (180 frames)
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "[GLITCHED] Inverted Controls!",
                    "#ff007f",
                    true,
                  );
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.7;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "control_glitch";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "control_glitch" ? 60 : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateGildedVaultKeeper(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: TAXATION SIPHON (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && m.phase === 1) {
          m.phase = 2;
          m.actionState = "taxation";
          m.isStopped = true;
          m.channelTimer = 240; // 4 seconds (240 frames)
          m.staggerShield = m.maxHp.mul(0.15); // 15% Max HP stagger barrier

          // Teleport directly to the center of the arena
          let map = window.activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TAXATION SIPHON!",
              "#ffd700",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "gold_dungeon",
              4.5,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Gilded Vault Keeper is channeling Taxation! Shatter his shield to protect your Gold!",
              "#ffd700",
            );
          }
        }

        // Processing active Gold Siphon channel
        if (m.actionState === "taxation") {
          m.channelTimer--;

          // Siphon 10 Gold per frame from the player's wallet to heal himself (5x healing ratio)
          let playerGold = BigNum.from(window.playerStats.coins || 0);
          if (playerGold.gt(0)) {
            let siphonAmt = BigNum.from(10);
            if (playerGold.lt(siphonAmt)) {
              siphonAmt = playerGold;
            }
            window.playerStats.coins = playerGold.sub(siphonAmt);

            let healVal = siphonAmt.mul(5);
            m.hp = window.BigNumMin(m.maxHp, m.hp.add(healVal));

            // Visual golden siphon lines
            if (
              m.channelTimer % 3 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let angle = Math.atan2(cy - p.y, cx - p.x);
              window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-6, 6),
                p.y - 4 + window.randFloat(-6, 6),
                Math.cos(angle) * 4.5,
                Math.sin(angle) * 4.5,
                window.randFloat(1.2, 2.8),
                "#ffd700",
                0.8,
                15,
                0,
                true,
                0,
              );
            }
          }

          if (m.channelTimer <= 0) {
            // Siphon completes
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 110;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] Taxation cycle completed. Vault Keeper has recovered health!",
                "#e74c3c",
              );
            }
          }
          return;
        }

        // Handle Stunned sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return;
        }
        m.isStopped = false;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "gold_fall" && m.goldFallTargets) {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
              }
              if (window.SoundManager) window.SoundManager.play("block");

              m.goldFallTargets.forEach((target) => {
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    target.x,
                    target.y,
                    10,
                    "gold_dungeon",
                    2.2,
                  );
                }
                if (Math.hypot(p.x - target.x, p.y - target.y) <= 24) {
                  window.damagePlayer(Math.round(m.atk * 1.25), m);
                }
              });
              m.goldFallTargets = null;
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.45;
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "gold_fall";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;

            if (chosen === "gold_fall") {
              m.goldFallTargets = [];
              for (let i = 0; i < 3; i++) {
                let angle = Math.random() * Math.PI * 2;
                let spawnDist = window.randFloat(30, 75);
                m.goldFallTargets.push({
                  x: p.x + Math.cos(angle) * spawnDist,
                  y: p.y + Math.sin(angle) * spawnDist,
                });
              }
            }

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateHooktail(m, p, pStats, dist, dx, dy) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: CRITICAL ARENA COLLAPSE (UNDER 50% HP) ---
        let bHp = m.hp.valueOf();
        let bMaxHp = m.maxHp.valueOf();
        if (bHp < bMaxHp * 0.5 && m.phase === 1) {
          m.phase = 2;
          m.attackCooldown = 30;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: ARENA COLLAPSE!",
              "#ff3300",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.triggerScreenShake(15, 30);
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              40,
              "prestige_boss",
              6.0,
            );
          }
          if (window.SoundManager) window.SoundManager.play("death");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Hooktail has unleashed Calamity! The ground is collapsing into the void!",
              "#ff3300",
            );
          }
        }

        // Periodic Abyssal damage ticks if the player steps over collapsed void tiles
        let map = window.activeDungeonMap;
        if (map && map.grid) {
          let pTileX = Math.floor(p.x / map.tileSize);
          let pTileY = Math.floor(p.y / map.tileSize);
          if (
            map.grid[pTileY] &&
            map.grid[pTileY][pTileX] === window.TILE_TYPES.VOID
          ) {
            if (window.logicClock % 40 === 0) {
              let fallDmg = Math.round(p.maxHp * 0.08); // 8% Max HP per tick in the void
              p.hp = Math.max(1, p.hp - fallDmg);
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `-${fallDmg} ABYSS DROWNING`,
                "#ff3300",
              );
              if (window.SoundManager) window.SoundManager.play("hit");
            }
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "prestige_boss",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "scarlet_fire") {
              // Detonate Scarlet Fire Arc breath
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                // Spew fire particles
                let fAngle = m.facing === -1 ? Math.PI : 0;
                for (let k = 0; k < 20; k++) {
                  let dev = window.randFloat(-0.7, 0.7);
                  let spAngle = fAngle + dev;
                  let speed = window.randFloat(3.0, 6.0);
                  window.combatVisuals.particlePool.get(
                    cx,
                    cy,
                    Math.cos(spAngle) * speed,
                    Math.sin(spAngle) * speed,
                    window.randFloat(1.5, 3.8),
                    "#ff3300",
                    0.85,
                    25,
                    -0.03,
                    true,
                    0.05,
                  );
                }
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              let pAngle = Math.atan2(p.y - cy, p.x - cx);
              let faceAngle = m.facing === -1 ? Math.PI : 0;
              let angleDiff = Math.abs(
                Math.atan2(
                  Math.sin(pAngle - faceAngle),
                  Math.cos(pAngle - faceAngle),
                ),
              );

              if (dist <= 110 && angleDiff <= 0.8) {
                window.damagePlayer(Math.round(m.atk * 1.55), m);
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "SCARLET INCINERATION!",
                    "#ff3300",
                  );
                }
              }
            } else if (ability === "calamity_slam") {
              // Collapse one outer ring of the active floor into the void
              if (map && map.grid) {
                let collapseRing = m.collapseRing || 0;
                let minR = 2 + collapseRing;
                let maxR = map.height - 3 - collapseRing;
                let minC = 2 + collapseRing;
                let maxC = map.width - 3 - collapseRing;

                if (minR < maxR && minC < maxC) {
                  for (let cCol = minC; cCol <= maxC; cCol++) {
                    map.grid[minR][cCol] = window.TILE_TYPES.VOID;
                    map.grid[maxR][cCol] = window.TILE_TYPES.VOID;
                  }
                  for (let rRow = minR; rRow <= maxR; rRow++) {
                    map.grid[rRow][minC] = window.TILE_TYPES.VOID;
                    map.grid[rRow][maxC] = window.TILE_TYPES.VOID;
                  }
                  m.collapseRing = collapseRing + 1;
                  map.needsPreRender = true; // FORCE STATIC MAP REDRAW

                  if (window.combatVisuals) {
                    window.combatVisuals.triggerScreenShake(12, 22);
                    window.combatVisuals.spawnParticles(
                      cx,
                      cy,
                      35,
                      "prestige_boss",
                      4.5,
                    );
                  }
                  if (window.SoundManager) window.SoundManager.play("death");
                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast(
                      "[!] THE ARENA HAS COLLAPSED! PLAY AREA SHRINKING!",
                      "#ff3300",
                    );
                  }
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = m.phase === 2 ? 1.8 : 1.5; // Dragon charges faster in Phase 2
              let angle = Math.atan2(dy, dx);
              m.x += Math.cos(angle) * speed;
              m.y += Math.sin(angle) * speed;
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let pool = ["slam", "scarlet_fire"];
            if (m.phase === 2) pool.push("calamity_slam");

            let chosen = pool[Math.floor(Math.random() * pool.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer =
              chosen === "calamity_slam"
                ? 85
                : chosen === "scarlet_fire"
                  ? 60
                  : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },

      renderTelegraph(c, m) {
        if (!m || !m.activeAbility) return;
        c.save();

        // Clamp progress to prevent negative values if telegraphTimer is temporarily larger than maxTelegraphTimer
        let progress = Math.max(
          0,
          Math.min(1, 1.0 - m.telegraphTimer / m.maxTelegraphTimer),
        );
        let pulseAlpha = 0.25 + Math.sin(Date.now() / 45) * 0.15;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.activeAbility === "slam") {
          let radius = 64;
          let isTreant =
            m.bossKey === "arachnid_treant" ||
            m.visualType === "sprout" ||
            m.visualType === "arachnid_treant";
          let isIronVault =
            m.bossKey === "overlord_iron_vault" ||
            m.visualType === "overlord_iron_vault";
          let isCorrosive =
            m.bossKey === "corrosive_abomination" ||
            m.visualType === "corrosive_abomination";

          if (isTreant) {
            // --- BOSS 1: BIO-LUMINESCENT ROOT SLAM GRID ---
            let time = Date.now();

            // 1. Bio-luminescent Root Boundary Ring
            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#2ecc71";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(163, 253, 131, 0.6)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Inner Radial Bio-Spore Filling Disc
            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            fillGrad.addColorStop(
              0.5,
              `rgba(46, 204, 113, ${pulseAlpha * 0.4})`,
            );
            fillGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Bio-Luminescent Root Vine Grid (8 Radial Root Tendrils with Jagged Branches)
            c.strokeStyle = `rgba(0, 255, 204, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.8;
            c.beginPath();
            let radRays = 8;
            for (let i = 0; i < radRays; i++) {
              let rayAngle = (i * Math.PI * 2) / radRays + (m.id || 0);
              let endDist = radius * progress;
              let steps = 5;
              let lastX = m.targetX;
              let lastY = m.targetY;

              for (let s = 1; s <= steps; s++) {
                let curDist = (endDist * s) / steps;
                let jitter = Math.sin(s * 2.3 + time / 200) * 4;
                let curAngle = rayAngle + jitter * 0.05;
                let nx = m.targetX + Math.cos(curAngle) * curDist;
                let ny = m.targetY + Math.sin(curAngle) * curDist;

                c.moveTo(lastX, lastY);
                c.lineTo(nx, ny);

                // Lateral root tendril split
                if (s === 3) {
                  let branchAngle = curAngle + (i % 2 === 0 ? 0.4 : -0.4);
                  let bx = nx + Math.cos(branchAngle) * 12 * progress;
                  let by = ny + Math.sin(branchAngle) * 12 * progress;
                  c.moveTo(nx, ny);
                  c.lineTo(bx, by);
                }

                lastX = nx;
                lastY = ny;
              }
            }
            c.stroke();

            // 4. Bio-luminescent Spore Nodes at Intersection Joints
            c.fillStyle = "#a3fd83";
            for (let i = 0; i < radRays; i++) {
              let rayAngle = (i * Math.PI * 2) / radRays + (m.id || 0);
              let nodeDist = radius * progress * 0.6;
              let nx = m.targetX + Math.cos(rayAngle) * nodeDist;
              let ny = m.targetY + Math.sin(rayAngle) * nodeDist;
              c.beginPath();
              c.arc(nx, ny, 2.2, 0, Math.PI * 2);
              c.fill();
            }
          } else if (isIronVault) {
            // --- BOSS 3: MOLTEN STEEL SLAM & FISSURE GRID ---
            let time = Date.now();

            // 1. Molten Iron Outer Boundary
            c.strokeStyle = `rgba(249, 115, 22, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#f97316";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(254, 240, 138, 0.7)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Glowing Lava Core Disc
            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(
              0,
              `rgba(254, 240, 138, ${pulseAlpha * 0.75})`,
            );
            fillGrad.addColorStop(
              0.5,
              `rgba(249, 115, 22, ${pulseAlpha * 0.45})`,
            );
            fillGrad.addColorStop(1, "rgba(234, 88, 12, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Crosshair Lava Fissures (4 Cardinal Fractures)
            c.strokeStyle = `rgba(253, 186, 116, ${0.5 + progress * 0.5})`;
            c.lineWidth = 2.0;
            c.beginPath();
            for (let i = 0; i < 4; i++) {
              let ang = (i * Math.PI) / 2;
              let endDist = radius * progress;
              c.moveTo(m.targetX, m.targetY);
              c.lineTo(
                m.targetX + Math.cos(ang) * endDist,
                m.targetY + Math.sin(ang) * endDist,
              );
            }
            c.stroke();

            // 4. Heat Motes / Ember Sparks
            c.fillStyle = "#fef08a";
            for (let i = 0; i < 4; i++) {
              let ang = (i * Math.PI) / 2 + time / 1000;
              let sparkDist = radius * progress * 0.7;
              let sx = m.targetX + Math.cos(ang) * sparkDist;
              let sy = m.targetY + Math.sin(ang) * sparkDist;
              c.beginPath();
              c.arc(sx, sy, 1.8, 0, Math.PI * 2);
              c.fill();
            }
          } else if (isCorrosive) {
            // --- BOSS 4: CAUSTIC SLUDGE SLAM ---
            let time = Date.now();

            // 1. Toxic Bio-Green Outer Ring
            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#2ecc71";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(163, 253, 131, 0.7)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Bubbling Acid Pool Gradient Fill
            let acidGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            acidGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            acidGrad.addColorStop(
              0.5,
              `rgba(46, 204, 113, ${pulseAlpha * 0.4})`,
            );
            acidGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = acidGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Toxic Splatter Lines
            c.strokeStyle = `rgba(163, 253, 131, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.5;
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              let ang = (i * Math.PI * 2) / 6 + time / 1200;
              let endDist = radius * progress;
              c.moveTo(m.targetX, m.targetY);
              c.lineTo(
                m.targetX + Math.cos(ang) * endDist,
                m.targetY + Math.sin(ang) * endDist,
              );
            }
            c.stroke();
          } else {
            // --- STANDARD SLAM INDICATOR ---
            c.strokeStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 10;
            c.shadowColor = "#e74c3c";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(255, 255, 255, 0.4)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 4, 0, Math.PI * 2);
            c.stroke();

            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(0, `rgba(255, 242, 0, ${pulseAlpha * 0.6})`);
            fillGrad.addColorStop(
              0.6,
              `rgba(231, 76, 60, ${pulseAlpha * 0.4})`,
            );
            fillGrad.addColorStop(1, "rgba(231, 76, 60, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = `rgba(231, 76, 60, ${0.15 + progress * 0.45})`;
            c.lineWidth = 1.2;
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              let angle = (i * Math.PI * 2) / 6 + (m.id || 0);
              let startRad = radius * 0.15;
              let endRad = radius * progress;
              let sx = m.targetX + Math.cos(angle) * startRad;
              let sy = m.targetY + Math.sin(angle) * startRad;
              c.moveTo(sx, sy);

              let steps = 4;
              for (let s = 1; s <= steps; s++) {
                let segRad = startRad + (endRad - startRad) * (s / steps);
                let jitterAngle = angle + Math.sin(s * 1.5) * 0.15;
                let jx = m.targetX + Math.cos(jitterAngle) * segRad;
                let jy = m.targetY + Math.sin(jitterAngle) * segRad;
                c.lineTo(jx, jy);
              }
            }
            c.stroke();
          }
        } else if (m.activeAbility === "charge") {
          // --- HIGH FIDELITY CHARGE INDICATOR ---
          let dx = m.targetX - cx;
          let dy = m.targetY - cy;
          let dist = Math.hypot(dx, dy);
          if (dist > 0) {
            let nx = dx / dist;
            let ny = dy / dist;
            let trackW = 18;

            // Translucent hazard stripe path backing
            c.fillStyle = `rgba(231, 76, 60, 0.12)`;
            c.save();
            c.translate(cx, cy);
            c.rotate(Math.atan2(dy, dx));
            c.fillRect(0, -trackW / 2, dist, trackW);

            // Glowing border rails
            c.strokeStyle = `rgba(231, 76, 60, ${0.4 + pulseAlpha})`;
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(0, -trackW / 2);
            c.lineTo(dist, -trackW / 2);
            c.moveTo(0, trackW / 2);
            c.lineTo(dist, trackW / 2);
            c.stroke();

            // Sliding Chevron speed indicators
            let speed = 6;
            let slideOffset = (Date.now() / 15) % 60;
            c.strokeStyle = "#ffffff";
            c.lineWidth = 2.2;
            c.lineCap = "round";
            c.lineJoin = "round";

            for (let d = slideOffset; d < dist; d += 60) {
              c.beginPath();
              c.moveTo(d - 6, -5);
              c.lineTo(d, 0);
              c.lineTo(d - 6, 5);
              c.stroke();
            }
            c.restore();
          }
        } else if (m.activeAbility === "nova") {
          // --- HIGH FIDELITY NOVA INDICATOR ---
          c.strokeStyle = `rgba(230, 126, 34, ${0.35 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.5;

          // Accretion rings expansion effect
          c.save();
          c.strokeStyle = `rgba(230, 126, 34, ${pulseAlpha})`;
          c.shadowBlur = 8;
          c.shadowColor = "#e67e22";
          c.beginPath();
          c.arc(cx, cy, 120 * progress, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Detailed warning rays radiating outwards
          for (let i = 0; i < 8; i++) {
            let angle = (i * Math.PI * 2) / 8;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);

            // Multi-layered glowing laser guidelines
            let rayGrad = c.createLinearGradient(
              cx,
              cy,
              cx + cos * 120,
              cy + sin * 120,
            );
            rayGrad.addColorStop(0, "rgba(255, 242, 0, 0.85)");
            rayGrad.addColorStop(0.5, "rgba(230, 126, 34, 0.4)");
            rayGrad.addColorStop(1, "rgba(230, 126, 34, 0)");

            c.strokeStyle = rayGrad;
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(cx + cos * 14, cy + sin * 14);
            c.lineTo(cx + cos * 120, cy + sin * 120);
            c.stroke();
          }
        } else if (m.activeAbility === "root_snare") {
          // --- BOSS 1: BIO-LUMINESCENT CREEPING SNARE WEB & ROOT GRID ---
          let radius = 75;
          let time = Date.now();

          // 1. Connecting Vine Tether from Treant Center to Target Location
          c.strokeStyle = `rgba(46, 204, 113, ${0.4 + pulseAlpha * 0.3})`;
          c.lineWidth = 2.0;
          c.setLineDash([6, 4]);
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(m.targetX, m.targetY);
          c.stroke();
          c.setLineDash([]);

          // 2. Outer Bio-Luminescent Web Boundary Ring
          c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 12;
          c.shadowColor = "#2ecc71";
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(0, 255, 204, 0.6)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
          c.stroke();

          // 3. Growing Inner Bio-Spore Web Fill
          let fillGrad = c.createRadialGradient(
            m.targetX,
            m.targetY,
            1,
            m.targetX,
            m.targetY,
            radius,
          );
          fillGrad.addColorStop(0, `rgba(0, 255, 204, ${pulseAlpha * 0.5})`);
          fillGrad.addColorStop(0.5, `rgba(39, 174, 96, ${pulseAlpha * 0.35})`);
          fillGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

          c.fillStyle = fillGrad;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 4. Concentric Arachnid Web Rings
          let webRings = 4;
          c.strokeStyle = `rgba(0, 255, 204, ${0.3 + progress * 0.4})`;
          c.lineWidth = 1.4;
          for (let r = 1; r <= webRings; r++) {
            let ringRad = (radius * progress * r) / webRings;
            if (ringRad > 2) {
              c.beginPath();
              c.arc(m.targetX, m.targetY, ringRad, 0, Math.PI * 2);
              c.stroke();
            }
          }

          // 5. Radial Root Vine Strands & Bio-Luminescent Nodes
          let rays = 8;
          c.strokeStyle = `rgba(46, 204, 113, ${0.5 + progress * 0.4})`;
          c.lineWidth = 1.8;
          c.beginPath();
          for (let i = 0; i < rays; i++) {
            let angle = (i * Math.PI * 2) / rays + time / 2000;
            let endR = radius * progress;
            c.moveTo(m.targetX, m.targetY);
            c.lineTo(
              m.targetX + Math.cos(angle) * endR,
              m.targetY + Math.sin(angle) * endR,
            );
          }
          c.stroke();

          // Bio-Luminescent Nodes at Web Intersections
          c.fillStyle = "#00ffcc";
          for (let r = 1; r <= webRings; r++) {
            let ringRad = (radius * progress * r) / webRings;
            if (ringRad > 4) {
              for (let i = 0; i < rays; i++) {
                let angle = (i * Math.PI * 2) / rays + time / 2000;
                let nx = m.targetX + Math.cos(angle) * ringRad;
                let ny = m.targetY + Math.sin(angle) * ringRad;
                c.beginPath();
                c.arc(nx, ny, 1.8, 0, Math.PI * 2);
                c.fill();
              }
            }
          }

          // 6. Perimeter Thorn Teeth
          let thorns = 8;
          c.fillStyle = `rgba(39, 174, 96, ${0.5 + progress * 0.5})`;
          c.strokeStyle = "#000000";
          c.lineWidth = 1.0;
          for (let i = 0; i < thorns; i++) {
            let ta = (i * Math.PI * 2) / thorns + time / 800;
            let outX = m.targetX + Math.cos(ta) * (radius + 6);
            let outY = m.targetY + Math.sin(ta) * (radius + 6);
            let side1X = m.targetX + Math.cos(ta - 0.15) * (radius - 2);
            let side1Y = m.targetY + Math.sin(ta - 0.15) * (radius - 2);
            let side2X = m.targetX + Math.cos(ta + 0.15) * (radius - 2);
            let side2Y = m.targetY + Math.sin(ta + 0.15) * (radius - 2);

            c.beginPath();
            c.moveTo(side1X, side1Y);
            c.lineTo(outX, outY);
            c.lineTo(side2X, side2Y);
            c.closePath();
            c.fill();
            c.stroke();
          }
        } else if (m.activeAbility === "magnetic_pull") {
          // --- BOSS 2: SAPPHIRE MAGNETIC VORTEX ---
          let time = Date.now();
          let maxRadius = 140;

          // 1. Central Impact Hazard Zone
          let coreGrad = c.createRadialGradient(cx, cy, 2, cx, cy, 70);
          coreGrad.addColorStop(0, `rgba(0, 210, 255, ${pulseAlpha * 0.7})`);
          coreGrad.addColorStop(
            0.5,
            `rgba(56, 189, 248, ${pulseAlpha * 0.35})`,
          );
          coreGrad.addColorStop(1, "rgba(5, 12, 24, 0)");

          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, 70, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = `rgba(0, 210, 255, ${0.5 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.0;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";
          c.beginPath();
          c.arc(cx, cy, 70, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // 2. Contracting Spiral Field Rings
          let ringCount = 4;
          c.lineWidth = 1.6;
          for (let i = 0; i < ringCount; i++) {
            let rProgress = (progress + i / ringCount) % 1.0;
            let currentR = maxRadius * (1.0 - rProgress);

            c.strokeStyle = `rgba(0, 210, 255, ${(1.0 - rProgress) * (0.4 + pulseAlpha * 0.4)})`;
            c.beginPath();
            c.arc(cx, cy, currentR, 0, Math.PI * 2);
            c.stroke();
          }

          // 3. Rotating Magnetic Field Vector Spokes
          let spokes = 6;
          c.strokeStyle = `rgba(56, 189, 248, ${0.25 + pulseAlpha * 0.25})`;
          c.lineWidth = 1.2;
          c.save();
          c.translate(cx, cy);
          c.rotate(time / 300);
          for (let s = 0; s < spokes; s++) {
            let ang = (s * Math.PI * 2) / spokes;
            c.beginPath();
            c.moveTo(Math.cos(ang) * 15, Math.sin(ang) * 15);
            c.lineTo(Math.cos(ang) * maxRadius, Math.sin(ang) * maxRadius);
            c.stroke();
          }
          c.restore();
        } else if (m.activeAbility === "boomerang_shield") {
          // --- BOSS 2: SAPPHIRE BOOMERANG TRAJECTORY ---
          let time = Date.now();
          c.strokeStyle = `rgba(0, 210, 255, ${0.6 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.2;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";

          // Target Reticle
          let reticleR = 22 + Math.sin(time / 100) * 3;
          c.beginPath();
          c.arc(m.targetX, m.targetY, reticleR, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // Dual Trajectory Dotted Guidelines
          let angleToPlayer = Math.atan2(m.targetY - cy, m.targetX - cx);
          c.strokeStyle = "rgba(56, 189, 248, 0.4)";
          c.lineWidth = 1.2;
          c.setLineDash([5, 4]);

          [-0.25, 0.25].forEach((offset) => {
            let arcAng = angleToPlayer + offset;
            let tx = cx + Math.cos(arcAng) * 160;
            let ty = cy + Math.sin(arcAng) * 160;
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(tx, ty);
            c.stroke();
          });
          c.setLineDash([]);
        } else if (
          m.activeAbility === "shield_bash" &&
          m.shieldAngle !== undefined
        ) {
          // --- BOSS 2: DIRECTIONAL TOWER SHIELD BASH CONE ---
          let radius = 68;
          let arcWidth = 0.55; // Radians to each side of shieldAngle

          // 1. Layered Sector Warning Cone
          let coneGrad = c.createRadialGradient(cx, cy, 2, cx, cy, radius);
          coneGrad.addColorStop(0, `rgba(0, 210, 255, ${pulseAlpha * 0.6})`);
          coneGrad.addColorStop(0.7, `rgba(231, 76, 60, ${pulseAlpha * 0.5})`);
          coneGrad.addColorStop(1, "rgba(231, 76, 60, 0)");

          c.fillStyle = coneGrad;
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.closePath();
          c.fill();

          // 2. Heavy Outlined Arc Boundaries
          c.strokeStyle = "#e74c3c";
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#e74c3c";
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.closePath();
          c.stroke();
          c.shadowBlur = 0;

          // 3. Sweeping Shockwave Arc expanding with progress
          let waveR = Math.max(0, radius * progress);
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.0;
          c.beginPath();
          c.arc(
            cx,
            cy,
            waveR,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.stroke();

          // 4. Sector Directional Rib Lines
          c.strokeStyle = "rgba(0, 210, 255, 0.4)";
          c.lineWidth = 1.0;
          [-0.35, 0, 0.35].forEach((angOffset) => {
            let subAng = m.shieldAngle + angOffset;
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(
              cx + Math.cos(subAng) * radius,
              cy + Math.sin(subAng) * radius,
            );
            c.stroke();
          });
        } else if (m.activeAbility === "magma_vents" && m.ventSpawnLocations) {
          // --- BOSS 3: MAGMA VENT FISSURE TARGETS ---
          let time = Date.now();
          let ventRadius = 18;

          m.ventSpawnLocations.forEach((loc) => {
            // 1. Dual Molten Warning Rings
            c.strokeStyle = `rgba(249, 115, 22, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 2.2;
            c.shadowBlur = 10;
            c.shadowColor = "#f97316";
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius + pulseAlpha * 3, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(254, 240, 138, 0.8)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius + 4, 0, Math.PI * 2);
            c.stroke();

            // 2. Bubbling Lava Core Fill
            let lavaGrad = c.createRadialGradient(
              loc.x,
              loc.y,
              1,
              loc.x,
              loc.y,
              ventRadius,
            );
            lavaGrad.addColorStop(
              0,
              `rgba(254, 240, 138, ${pulseAlpha * 0.8})`,
            );
            lavaGrad.addColorStop(
              0.6,
              `rgba(249, 115, 22, ${pulseAlpha * 0.4})`,
            );
            lavaGrad.addColorStop(1, "rgba(234, 88, 12, 0)");

            c.fillStyle = lavaGrad;
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Crosshair Fissure Ticks
            c.strokeStyle = `rgba(253, 186, 116, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(loc.x - ventRadius - 4, loc.y);
            c.lineTo(loc.x + ventRadius + 4, loc.y);
            c.moveTo(loc.x, loc.y - ventRadius - 4);
            c.lineTo(loc.x, loc.y + ventRadius + 4);
            c.stroke();
          });
        } else if (m.activeAbility === "dilation_field") {
          // --- BOSS 6: ROMAN NUMERAL CLOCKWORK DILATION FIELD & DIAL SWEEPS ---
          let radius = 42;
          let time = Date.now();

          // 1. Outer Brass Gear Teeth Perimeter
          c.save();
          c.translate(m.targetX, m.targetY);
          c.rotate(time / 1200);

          c.fillStyle = `rgba(212, 175, 55, ${0.4 + pulseAlpha * 0.3})`;
          c.strokeStyle = "#ffd700";
          c.lineWidth = 1.0;
          let teeth = 12;
          for (let i = 0; i < teeth; i++) {
            let tAng = (i * Math.PI * 2) / teeth;
            c.save();
            c.rotate(tAng);
            c.fillRect(-2, -radius - 3, 4, 3);
            c.restore();
          }
          c.restore();

          // 2. Outer Pulsing Gold Dial Ring
          c.strokeStyle = `rgba(241, 196, 15, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#ffd700";
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // 3. Growing Concentric Warning Fill Disc
          let fillGrad = c.createRadialGradient(
            m.targetX,
            m.targetY,
            1,
            m.targetX,
            m.targetY,
            radius,
          );
          fillGrad.addColorStop(0, `rgba(254, 240, 138, ${pulseAlpha * 0.7})`);
          fillGrad.addColorStop(0.5, `rgba(212, 175, 55, ${pulseAlpha * 0.4})`);
          fillGrad.addColorStop(1, "rgba(120, 53, 15, 0)");

          c.fillStyle = fillGrad;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 4. 12 Clock Dial Hour Ticks (XII, III, VI, IX)
          c.strokeStyle = "rgba(254, 240, 138, 0.8)";
          c.lineWidth = 1.2;
          for (let i = 0; i < 12; i++) {
            let tickAng = (i * Math.PI * 2) / 12;
            let isMajor = i % 3 === 0;
            let innerR = isMajor ? radius - 8 : radius - 4;
            c.beginPath();
            c.moveTo(
              m.targetX + Math.cos(tickAng) * innerR,
              m.targetY + Math.sin(tickAng) * innerR,
            );
            c.lineTo(
              m.targetX + Math.cos(tickAng) * radius,
              m.targetY + Math.sin(tickAng) * radius,
            );
            c.stroke();
          }

          // 5. Sweeping Clock Hand Line (0 to 2*PI in direction of progress)
          let handAng = -Math.PI / 2 + progress * Math.PI * 2;
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.0;
          c.beginPath();
          c.moveTo(m.targetX, m.targetY);
          c.lineTo(
            m.targetX + Math.cos(handAng) * (radius - 3),
            m.targetY + Math.sin(handAng) * (radius - 3),
          );
          c.stroke();

          c.fillStyle = "#ffd700";
          c.beginPath();
          c.arc(m.targetX, m.targetY, 2.5, 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "control_glitch") {
          // --- HIGH FIDELITY CONTROL GLITCH GRID ---
          let radius = 180;
          let time = Date.now();

          // Outer pulsing digital wireframe boundary
          c.strokeStyle = `rgba(255, 0, 127, ${pulseAlpha})`;
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#ff007f";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // Rotating cybernetic grid guidelines
          c.strokeStyle = "rgba(0, 240, 255, 0.25)";
          c.lineWidth = 1.0;
          c.save();
          c.translate(cx, cy);
          c.rotate(time / 500);

          // Draw horizontal and vertical grid intersection guides
          for (let d = -radius + 30; d < radius; d += 30) {
            if (Math.abs(d) >= radius) continue;
            let chord = Math.sqrt(radius * radius - d * d);
            c.beginPath();
            c.moveTo(-chord, d);
            c.lineTo(chord, d);
            c.moveTo(d, -chord);
            c.lineTo(d, chord);
            c.stroke();
          }
          c.restore();

          // Inner digital core warning
          c.fillStyle = `rgba(255, 0, 127, ${pulseAlpha * 0.15})`;
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "gold_fall" && m.goldFallTargets) {
          // --- HIGH FIDELITY GOLD FALL PLATES ---
          m.goldFallTargets.forEach((target) => {
            c.strokeStyle = `rgba(241, 196, 15, ${pulseAlpha})`;
            c.lineWidth = 2.0;
            c.shadowBlur = 8;
            c.shadowColor = "#ffd700";
            c.beginPath();
            c.arc(target.x, target.y, 20 + pulseAlpha * 3, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.fillStyle = `rgba(181, 135, 0, ${pulseAlpha * 0.22})`;
            c.beginPath();
            c.arc(target.x, target.y, 20 * progress, 0, Math.PI * 2);
            c.fill();
          });
        } else if (m.activeAbility === "scarlet_fire") {
          // --- BOSS 7: SCARLET DRAGON FIRE BREATH CONE ---
          let radius = 115;
          let faceAngle = m.facing === -1 ? Math.PI : 0;
          let coneWidth = 0.85;

          c.save();

          // 1. Multi-Stop Flame Gradient Fill
          let fireGrad = c.createRadialGradient(cx, cy, 2, cx, cy, radius);
          fireGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha * 0.85})`);
          fireGrad.addColorStop(
            0.3,
            `rgba(254, 240, 138, ${pulseAlpha * 0.7})`,
          );
          fireGrad.addColorStop(0.7, `rgba(255, 85, 0, ${pulseAlpha * 0.5})`);
          fireGrad.addColorStop(1, "rgba(150, 0, 24, 0)");

          c.fillStyle = fireGrad;
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius * progress,
            faceAngle - coneWidth,
            faceAngle + coneWidth,
          );
          c.closePath();
          c.fill();

          // 2. Outer Dragon Fire Boundary Contour
          c.strokeStyle = "#ff3300";
          c.lineWidth = 2.5;
          c.shadowBlur = 12;
          c.shadowColor = "#ff3300";
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, radius, faceAngle - coneWidth, faceAngle + coneWidth);
          c.closePath();
          c.stroke();
          c.shadowBlur = 0;

          // 3. Advancing Fire Wavefront Arc
          let waveR = Math.max(0, radius * progress);
          c.strokeStyle = "rgba(254, 240, 138, 0.9)";
          c.lineWidth = 2.0;
          c.beginPath();
          c.arc(cx, cy, waveR, faceAngle - coneWidth, faceAngle + coneWidth);
          c.stroke();

          // 4. Radial Flame Jet Guidelines
          c.strokeStyle = `rgba(255, 85, 0, ${0.4 + progress * 0.4})`;
          c.lineWidth = 1.2;
          let rays = 5;
          for (let r = 0; r < rays; r++) {
            let rayAng =
              faceAngle - coneWidth + (r * (coneWidth * 2)) / (rays - 1);
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(
              cx + Math.cos(rayAng) * radius,
              cy + Math.sin(rayAng) * radius,
            );
            c.stroke();
          }

          c.restore();
        } else if (m.activeAbility === "calamity_slam") {
          // --- BOSS 7: FAULT LINE GROUND SHATTER ---
          let time = Date.now();
          let radius = 80;

          // 1. Outer Volcanic Calamity Boundary Ring
          c.strokeStyle = `rgba(255, 51, 0, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 14;
          c.shadowColor = "#ff3300";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(254, 240, 138, 0.7)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          c.stroke();

          // 2. Inner Collapsing Ground Fill
          let collapseGrad = c.createRadialGradient(cx, cy, 1, cx, cy, radius);
          collapseGrad.addColorStop(
            0,
            `rgba(254, 240, 138, ${pulseAlpha * 0.75})`,
          );
          collapseGrad.addColorStop(
            0.5,
            `rgba(255, 85, 0, ${pulseAlpha * 0.45})`,
          );
          collapseGrad.addColorStop(1, "rgba(150, 0, 24, 0)");

          c.fillStyle = collapseGrad;
          c.beginPath();
          c.arc(cx, cy, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 3. Jagged Fault Line Ground Cracks (8 Fractures)
          c.strokeStyle = `rgba(255, 51, 0, ${0.5 + progress * 0.5})`;
          c.lineWidth = 2.0;
          c.beginPath();
          let cracks = 8;
          for (let i = 0; i < cracks; i++) {
            let baseAng = (i * Math.PI * 2) / cracks + (m.id || 0);
            let endDist = radius * progress;
            let steps = 4;
            let lastX = cx;
            let lastY = cy;

            for (let s = 1; s <= steps; s++) {
              let curDist = (endDist * s) / steps;
              let jitter = Math.sin(s * 3.1 + time / 180) * 3;
              let curAngle = baseAng + jitter * 0.04;
              let nx = cx + Math.cos(curAngle) * curDist;
              let ny = cy + Math.sin(curAngle) * curDist;

              c.moveTo(lastX, lastY);
              c.lineTo(nx, ny);
              lastX = nx;
              lastY = ny;
            }
          }
          c.stroke();
        } else if (m.activeAbility === "spore_storm") {
          // --- BOSS 4: ROTATING SPORE VECTOR CONES ---
          let time = Date.now();
          let coneRadius = 55;
          let rotAngle = time / 500;

          c.save();
          c.translate(cx, cy);

          // 1. 3 Rotating Directional Spore Cones
          let numCones = 3;
          let coneWidth = 0.35; // radians each side
          for (let i = 0; i < numCones; i++) {
            let baseAng = rotAngle + (i * Math.PI * 2) / numCones;

            let sporeGrad = c.createRadialGradient(0, 0, 2, 0, 0, coneRadius);
            sporeGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            sporeGrad.addColorStop(
              0.6,
              `rgba(46, 204, 113, ${pulseAlpha * 0.35})`,
            );
            sporeGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = sporeGrad;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(
              0,
              0,
              coneRadius * progress,
              baseAng - coneWidth,
              baseAng + coneWidth,
            );
            c.closePath();
            c.fill();

            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(0, 0, coneRadius, baseAng - coneWidth, baseAng + coneWidth);
            c.closePath();
            c.stroke();
          }

          c.restore();

          // 2. Central Toxic Core Circle
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 20);
          coreGrad.addColorStop(0, `rgba(163, 253, 131, ${pulseAlpha * 0.8})`);
          coreGrad.addColorStop(1, "rgba(46, 204, 113, 0)");

          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, 20, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.arc(cx, cy, 20, 0, Math.PI * 2);
          c.stroke();
        } else if (m.activeAbility === "singularity") {
          // --- BOSS 5: EVENT HORIZON ACCRETION DISK & GRAVITY VACUUM RINGS ---
          let radius = 90;
          let time = Date.now();

          // 1. Outer Pulsing Event Horizon Boundary
          c.strokeStyle = `rgba(232, 67, 147, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 16;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(142, 68, 173, 0.6)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          c.stroke();

          // 2. Counter-Rotating Tilted Accretion Disk Ellipses
          c.save();
          c.translate(cx, cy);

          // Outer Accretion Ring (Counter-Clockwise)
          c.save();
          c.rotate(-time / 300);
          c.strokeStyle = "rgba(232, 67, 147, 0.65)";
          c.lineWidth = 1.8;
          c.beginPath();
          c.ellipse(0, 0, radius * 0.95, radius * 0.35, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Inner Accretion Ring (Clockwise)
          c.save();
          c.rotate(time / 220 + Math.PI / 4);
          c.strokeStyle = "rgba(0, 210, 255, 0.65)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.ellipse(0, 0, radius * 0.75, radius * 0.28, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          c.restore();

          // 3. Contracting Gravity Vacuum Rings
          let ringCount = 4;
          for (let i = 0; i < ringCount; i++) {
            let rProgress = (progress + i / ringCount) % 1.0;
            let curR = radius * (1.0 - rProgress);
            c.strokeStyle = `rgba(142, 68, 173, ${(1.0 - rProgress) * (0.5 + pulseAlpha * 0.4)})`;
            c.lineWidth = 1.6;
            c.beginPath();
            c.arc(cx, cy, curR, 0, Math.PI * 2);
            c.stroke();
          }

          // 4. Dense Black Hole Core Singularity with Magenta Rim
          let coreR = 14 + pulseAlpha * 4 + progress * 6;
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, coreR);
          coreGrad.addColorStop(0, "rgba(232, 67, 147, 0.95)");
          coreGrad.addColorStop(0.5, "rgba(9, 2, 26, 0.98)");
          coreGrad.addColorStop(1, "rgba(9, 2, 26, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, coreR, 0, Math.PI * 2);
          c.fill();
        }
        c.restore(); // Unified top-level restore to prevent canvas transform leaks on non-singularity boss abilities
      },
    };

    // Initialize Draggable Flask Button Engine
    if (typeof window.initFlaskButtonDrag === "function") {
      window.initFlaskButtonDrag();
    }

    // Start inside Adventurer's Hub
    window.loadHub();

    // Decorate damagePlayer globally to monitor and trigger defensive counters
    const originalDamagePlayer = window.damagePlayer;
    window.damagePlayer = function (amount, attacker) {
      let prevBlockTime =
        (window.playerStats && window.playerStats.recentBlockTime) || 0;
      let prevParryTime =
        (window.playerStats && window.playerStats.recentParryTime) || 0;

      let result = originalDamagePlayer
        ? originalDamagePlayer.call(this, amount, attacker)
        : null;

      let postBlockTime =
        (window.playerStats && window.playerStats.recentBlockTime) || 0;
      let postParryTime =
        (window.playerStats && window.playerStats.recentParryTime) || 0;

      if (postBlockTime > prevBlockTime) {
        window.handleVanguardBlockTrigger(attacker);
      }
      if (postParryTime > prevParryTime) {
        window.handleVanguardParryTrigger(attacker);
      }

      return result;
    };

    window.handleVanguardBlockTrigger = function (attacker) {
      let p = window.player;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let aegisLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("shield_impact_tremor")
        : 0;

      if (aegisLevel > 0) {
        let procChance = aegisLevel * 0.2;
        if (Math.random() < procChance) {
          if (window.spawnResonantAegisRipple) {
            window.spawnResonantAegisRipple(p.x, p.y);
          }

          let defVal = pStats.def || p.def || 5;
          let dmg = BigNum.from(defVal).mul(1.2);
          let range = 45;

          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((m) => {
              if (m.hp.gt(0) && !m.isFriendlyWisp) {
                let mCx = m.x + (m.w || 24) / 2;
                let mCy = m.y + (m.h || 24) / 2;
                let dist = Math.hypot(p.x - mCx, p.y - mCy);
                if (dist <= range) {
                  m.hp = m.hp.sub(dmg);
                  m.flashTimer = 8;
                  m.hasTakenDamage = true;

                  if (!m.isBoss) {
                    let pushAngle = Math.atan2(mCy - p.y, mCx - p.x);
                    let pushDist = 14;
                    let targetX = m.x + Math.cos(pushAngle) * pushDist;
                    let targetY = m.y + Math.sin(pushAngle) * pushDist;
                    if (
                      window.activeDungeonMap &&
                      typeof window.checkCollisionAt === "function" &&
                      !window.checkCollisionAt(
                        window.activeDungeonMap,
                        targetX + 12,
                        targetY + 12,
                        12,
                      )
                    ) {
                      m.x = targetX;
                      m.y = targetY;
                    }
                  }

                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(
                      mCx,
                      mCy,
                      dmg,
                      "counter",
                      false,
                      m,
                    );
                  }
                }
              }
            });
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("block");
          }
        }
      }
    };

    window.handleVanguardParryTrigger = function (attacker) {
      let parryFlurryLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
        : 0;
      if (parryFlurryLevel > 0 && attacker) {
        window.triggerWindRazorStrike(attacker);
      }
    };

    window.checkAndSpawnNoxiousBloom = function (m, x, y) {
      let bloomLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_noxious_bloom")
        : 0;
      if (bloomLevel > 0) {
        let hasDebuff =
          (m.bleedStacks && m.bleedStacks > 0) ||
          (m.poisonStacks && m.poisonStacks > 0);
        if (hasDebuff) {
          window.cavernInteractives = window.cavernInteractives || [];
          let pStats =
            typeof window.resolvePlayerStats === "function"
              ? window.resolvePlayerStats()
              : {};
          let baseAtk = pStats.atk || window.player.atk || 15;
          let tickDmg = BigNum.from(baseAtk).mul(0.15 * bloomLevel);

          window.cavernInteractives.push({
            id: window.idCounter++,
            type: "noxious_bloom",
            x: x,
            y: y,
            w: 80,
            h: 36,
            life: 240,
            maxLife: 240,
            tickDamage: tickDmg,
          });

          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(x, y, 15, "swamp_basilisk", 3);
          }
        }
      }
    };

    window.triggerWindRazorStrike = function (targetMob) {
      let p = window.player;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let windLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
        : 0;

      if (windLevel > 0 && targetMob) {
        let tCx = targetMob.x + (targetMob.w || 24) / 2;
        let tCy = targetMob.y + (targetMob.h || 24) / 2;
        let angle = Math.atan2(tCy - p.y, tCx - p.x);

        let baseAtk = pStats.atk || p.atk || 15;
        let windDmg = BigNum.from(baseAtk).mul(0.4 * (1 + windLevel * 0.2));

        if (window.spawnWindRazor) {
          window.spawnWindRazor(p.x, p.y - 8, angle, windDmg);
        }

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_frost"); // Play high-pitch slash sound
        }
      }
    };

    // Start 60 FPS Engine Loop
    requestAnimationFrame(gameLoop);
  });

  window.checkOrientation = function () {
    let overlay = document.getElementById("rotate-device-overlay");
    if (overlay) overlay.style.display = "none";
  };

  window.drawPortraitBossHealthBar = function (ctx, m, canvas) {
    if (!m || !m.hp || !m.maxHp) return;

    ctx.save();

    let barW = Math.min(canvas.width - 40, 280);
    let barH = 10;
    let barX = (canvas.width - barW) / 2;
    // Adjusted to 160 to prevent overlap with the stacked top HUD on notched/island devices in portrait mode
    let barY = 160;

    let bHp = BigNum.from(m.hp);
    let bMaxHp = BigNum.from(m.maxHp);
    let hpPct = 1.0;
    if (bMaxHp.gt(0)) {
      let div = bHp.div(bMaxHp);
      hpPct = Math.max(
        0,
        Math.min(1, div.m * Math.pow(10, Math.min(15, div.e))),
      );
    }

    if (m.screenTrailingPct === undefined) m.screenTrailingPct = hpPct;
    if (m.screenTrailingPct > hpPct) {
      m.screenTrailingPct = Math.max(hpPct, m.screenTrailingPct - 0.01);
    } else {
      m.screenTrailingPct = hpPct;
    }

    ctx.fillStyle = "rgba(10, 8, 16, 0.9)";
    ctx.strokeStyle = m.type === "dungeon_boss" ? "#e74c3c" : "#e67e22";
    ctx.lineWidth = 2.0;

    ctx.fillRect(barX - 4, barY - 20, barW + 8, barH + 28);
    ctx.strokeRect(barX - 4, barY - 20, barW + 8, barH + 28);

    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (m.dazeTimer > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.fillText(
        `★ ${m.name.toUpperCase()} (DAZED!) ★`,
        canvas.width / 2,
        barY - 11,
      );
    } else if (
      m.actionState === "cyber_barrier" ||
      m.actionState === "bark_shield"
    ) {
      ctx.fillStyle = "#ff007f";
      ctx.fillText(
        `${m.name.toUpperCase()} (SHIELDED)`,
        canvas.width / 2,
        barY - 11,
      );
    } else {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillText(m.name.toUpperCase(), canvas.width / 2, barY - 11);
    }

    ctx.fillStyle = "rgba(40, 20, 20, 0.9)";
    ctx.fillRect(barX, barY, barW, barH);

    if (m.screenTrailingPct > hpPct) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(barX, barY, barW * m.screenTrailingPct, barH);
    }

    let fillGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    if (m.dazeTimer > 0) {
      fillGrad.addColorStop(0, "#ffe066");
      fillGrad.addColorStop(1, "#f1c40f");
    } else if (m.actionState === "bark_shield") {
      fillGrad.addColorStop(0, "#27ae60");
      fillGrad.addColorStop(1, "#2ecc71");
    } else {
      fillGrad.addColorStop(0, "#c0392b");
      fillGrad.addColorStop(1, "#ff4757");
    }
    ctx.fillStyle = fillGrad;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(barX, barY, barW * hpPct, barH / 2);

    let sShield = m.staggerShield
      ? BigNum.from(m.staggerShield)
      : BigNum.from(0);
    let sMaxShield = m.maxStaggerShield
      ? BigNum.from(m.maxStaggerShield)
      : BigNum.from(0);
    if (sShield.gt(0) && sMaxShield.gt(0)) {
      let sDiv = sShield.div(sMaxShield);
      let sPct = Math.max(
        0,
        Math.min(1, sDiv.m * Math.pow(10, Math.min(15, sDiv.e))),
      );
      ctx.fillStyle = "rgba(0, 210, 255, 0.4)";
      ctx.fillRect(barX, barY, barW * sPct, barH);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.0;
      ctx.strokeRect(barX, barY, barW * sPct, barH);
    }

    ctx.font = "bold 8.5px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let hpTextStr = `${window.formatNumber(bHp)} / ${window.formatNumber(bMaxHp)}`;
    if (sShield.gt(0)) {
      hpTextStr += ` [S: ${window.formatNumber(sShield)}]`;
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.0;
    ctx.strokeText(hpTextStr, canvas.width / 2, barY + barH / 2 + 0.5);
    ctx.fillText(hpTextStr, canvas.width / 2, barY + barH / 2 + 0.5);

    ctx.restore();
  };

  window.resizeCanvas = function () {
    if (!canvas) return;
    window.scrollTo(0, 0); // Lock scroll offset to absolute 0 on resize
    let rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
    window.checkOrientation();
  };

  // Attempt screen orientation lock on first touch interaction
  document.addEventListener(
    "pointerdown",
    function () {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    },
    { once: true },
  );

  // --- ADVENTURER'S HUB & STATE TRANSITIONS ---
  window.loadHub = function () {
    if (window.nemesisAnimFrameId) {
      cancelAnimationFrame(window.nemesisAnimFrameId);
      window.nemesisAnimFrameId = null;
    }
    window.currentGameState = window.GAME_STATES.HUB;
    window.playerStats.isCrucibleMode = false;
    window.deathAnimationTimer = 0;
    window.fatiguePenalty = 0; // Reset active Spreading Fatigue slow on Hub load

    // Clear active dungeon combat entities and gold particles
    window.activeDungeonMobs = [];
    window.mob = null;
    window.goldParticles = [];
    window.heartOrbs = [];
    window.projectiles = [];
    if (window.activeDungeonMap) {
      window.activeDungeonMap.openedChests = new Set();
    }

    // Vacuum uncollected ground loot and materials on hub load
    if (window.groundLoot && window.groundLoot.length > 0) {
      window.groundLoot.forEach((gl) => {
        if (gl && gl.item) {
          let isEquipped = window.tryAutoEquip
            ? window.tryAutoEquip(gl.item)
            : false;
          if (!isEquipped && window.player) {
            if (!window.player.stash) window.player.stash = [];
            window.player.stash.push(gl.item);
          }
        }
      });
      window.groundLoot = [];
    }

    if (window.groundMaterials && window.groundMaterials.length > 0) {
      window.groundMaterials.forEach((gm) => {
        if (gm) {
          if (gm.name === "Luminous Soul" || gm.name.includes("Key")) {
            window.addEtcDrop(gm.name, gm.qty, true);
          } else if (window.player) {
            if (!window.player.pendingScraps) window.player.pendingScraps = {};
            window.player.pendingScraps[gm.name] =
              (window.player.pendingScraps[gm.name] || 0) + gm.qty;
          }
        }
      });
      window.groundMaterials = [];
    }

    let summaryModal = document.getElementById("summary-modal");
    if (summaryModal) summaryModal.style.display = "none";

    let map = window.activeDungeonMap.generateHub();
    let tileSize = map.tileSize;

    window.player.hp = window.player.maxHp;
    if (typeof window.refillFlaskCharges === "function") {
      window.refillFlaskCharges(true);
    }
    window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
    window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;

    // Trigger Altar Shattering animation upon first return to Hub after clearing Floor 36
    if (
      (window.playerStats.maxFloorCleared || 0) >= 36 &&
      !window.playerStats.hasTriggeredOnslaughtUnlock
    ) {
      window.playerStats.hasTriggeredOnslaughtUnlock = true;
      if (typeof window.triggerOnslaughtShatterAnimation === "function") {
        window.triggerOnslaughtShatterAnimation();
      }
    }

    if (!window.inventory)
      window.inventory = {
        EQUIP: [],
        ARTIFACT: [],
        SIGIL: [],
        ETC: {},
        USE: {},
      };
    if (!window.player.stash || window.player.stash.length === 0) {
      window.player.stash = window.inventory.EQUIP || [];
    }
    window.inventory.EQUIP = window.player.stash;

    if (window.player) window.player.pendingScraps = {};
    if (window.player.bag && window.player.bag.length > 0) {
      window.player.stash.push(...window.player.bag);
      window.player.bag = [];
      if (typeof window.saveGame === "function") window.saveGame();
    }

    window.updateHUD();
    window.spawnFloatingText(
      window.player.x,
      window.player.y - 20,
      "ADVENTURER'S HUB",
      "#00d2ff",
    );
  };

  window.enterDungeonRun = function (startFloor = 1) {
      window.currentGameState = window.GAME_STATES.DUNGEON;
      let startFloorNum = Math.max(1, Number(startFloor) || 1);
      window.player.depth = startFloorNum;
      window.player.bag = [];
      window.fatiguePenalty = 0; // Reset active Spreading Fatigue slow on descent

      if (typeof window.refillFlaskCharges === "function") {
        window.refillFlaskCharges(true);
      }

      let st = window.SkillTreeManager;
      let starterStageScale = Math.max(1, Math.floor(startFloorNum * 0.70));

      // 1. Offhand Starter Provisioning
      let activeStarter = window.playerStats
        ? window.playerStats.activeStarterSubweapon
        : "none";
      if (
        activeStarter &&
        activeStarter !== "none" &&
        window.equippedSlots &&
        !window.equippedSlots.subweapon
      ) {
        let starterItem = window.createItemObject(activeStarter, 0, starterStageScale, 0);
        starterItem.name = `Starter ${activeStarter.charAt(0).toUpperCase() + activeStarter.slice(1)}`;
        starterItem.isStarterItem = true;
        window.equippedSlots.subweapon = starterItem;
        starterItem.isEquippedSlot = "subweapon";
      }

      // 2. Main Hand Weapon Provisioning (utility_start_weapon: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
      if (st && window.equippedSlots && !window.equippedSlots.weapon) {
        let weapRank = st.getSkillLevel("utility_start_weapon");
        if (weapRank > 0) {
          let stars = Math.min(2, weapRank - 1);
          let item = window.createItemObject("weapon", stars, starterStageScale, 0);
          item.name = `Provisioned ${window.getTierName(stars)} Blade`;
          item.isStarterItem = true;
          window.equippedSlots.weapon = item;
          item.isEquippedSlot = "weapon";
        }
      }

      // 3. Chest/Overall Armor Provisioning (utility_start_armor: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
      if (
        st &&
        window.equippedSlots &&
        !window.equippedSlots.chest &&
        !window.equippedSlots.overall
      ) {
        let armorRank = st.getSkillLevel("utility_start_armor");
        if (armorRank > 0) {
          let stars = Math.min(2, armorRank - 1);
          let item = window.createItemObject("overall", stars, starterStageScale, 0);
          item.name = `Provisioned ${window.getTierName(stars)} Plate Suit`;
          item.isStarterItem = true;

          // Safe unequip of leggings if equipped to prevent slot overlap
          if (window.equippedSlots.leggings) {
            let leggingsItem = window.equippedSlots.leggings;
            delete leggingsItem.isEquippedSlot;
            if (!window.player.stash) window.player.stash = [];
            window.player.stash.push(leggingsItem);
            window.equippedSlots.leggings = null;
          }

          window.equippedSlots.overall = item;
          item.isEquippedSlot = "overall";
        }
      }

      // 4. Helmet & Boots Provisioning (utility_start_head_feet)
      if (st && window.equippedSlots) {
        let hfRank = st.getSkillLevel("utility_start_head_feet");
        if (hfRank > 0) {
          let stars = Math.min(2, hfRank - 1);
          if (!window.equippedSlots.helmet) {
            let helm = window.createItemObject("helmet", stars, starterStageScale, 0);
            helm.name = `Provisioned ${window.getTierName(stars)} Helm`;
            helm.isStarterItem = true;
            window.equippedSlots.helmet = helm;
            helm.isEquippedSlot = "helmet";
          }
          if (!window.equippedSlots.boots) {
            let boots = window.createItemObject("boots", stars, starterStageScale, 0);
            boots.name = `Provisioned ${window.getTierName(stars)} Boots`;
            boots.isStarterItem = true;
            window.equippedSlots.boots = boots;
            boots.isEquippedSlot = "boots";
          }
        }
      }

      // 5. Ring Provisioning (utility_start_ring)
      if (st && window.equippedSlots) {
        let ringRank = st.getSkillLevel("utility_start_ring");
        if (ringRank > 0) {
          let stars = Math.min(2, ringRank - 1);
          if (!window.equippedSlots.ring1) {
            let ring1 = window.createItemObject("ring", stars, starterStageScale, 0);
            ring1.name = `Provisioned ${window.getTierName(stars)} Band`;
            ring1.isStarterItem = true;
            window.equippedSlots.ring1 = ring1;
            ring1.isEquippedSlot = "ring1";
          }
          if (!window.equippedSlots.ring2) {
            let ring2 = window.createItemObject("ring", stars, starterStageScale, 0);
            ring2.name = `Provisioned ${window.getTierName(stars)} Signet`;
            ring2.isStarterItem = true;
            window.equippedSlots.ring2 = ring2;
            ring2.isEquippedSlot = "ring2";
          }
        }
      }

    // Hook 2: Field Medic Run-Long Basic Elixir Effects
    if (window.SkillTreeManager) {
      let medicRank = window.SkillTreeManager.getSkillLevel("utility_elixir");
      if (medicRank > 0) {
        const basicElixirs = [
          {
            key: "atkPotionRuns",
            name: "Attack Elixir (+10% Atk)",
            strKey: "atkPotionStrength",
            val: 0.1,
            color: "#2ecc71",
          },
          {
            key: "hpPotionRuns",
            name: "Vitality Elixir (+10% Max HP)",
            strKey: "hpPotionStrength",
            val: 0.1,
            color: "#e74c3c",
          },
          {
            key: "defPotionRuns",
            name: "Armored Elixir (+10% Def)",
            strKey: "defPotionStrength",
            val: 0.1,
            color: "#3498db",
          },
          {
            key: "hastePotionRuns",
            name: "Haste Elixir (+10% Speed)",
            strKey: "hastePotionStrength",
            val: 1,
            color: "#f1c40f",
          },
        ];

        // Clear any lingering Field Medic elixirs from previous runs to enforce exactly 1 active elixir limit
        const basicElixirKeys = [
          "atkPotionRuns",
          "hpPotionRuns",
          "defPotionRuns",
          "hastePotionRuns",
        ];
        basicElixirKeys.forEach((k) => {
          window.playerStats[k] = 0;
        });

        let shuffled = [...basicElixirs].sort(() => Math.random() - 0.5);
        let pot = shuffled[0]; // Select exactly 1 random elixir effect

        // Set the runs duration to exactly 1 run
        window.playerStats[pot.key] = 1;

        // Scale the potion's potency linearly based on the purchased rank (Rank 1: +10%, Rank 2: +15%, Rank 3: +20%)
        let strength =
          pot.key === "hastePotionRuns"
            ? 1 + (medicRank - 1) * 0.5
            : 0.1 + (medicRank - 1) * 0.05;

        window.playerStats[pot.strKey] = strength;

        let pctText =
          pot.key === "hastePotionRuns"
            ? `+${Math.round(strength * 10)}% Speed`
            : `+${Math.round(strength * 100)}% ${pot.key === "atkPotionRuns" ? "Atk" : pot.key === "hpPotionRuns" ? "Max HP" : "Def"}`;
        let potName = `${pot.key === "atkPotionRuns" ? "Attack" : pot.key === "hpPotionRuns" ? "Vitality" : pot.key === "defPotionRuns" ? "Armored" : "Haste"} Elixir (${pctText})`;

        let appliedNames = [potName];

        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `✦ Field Medic Active: ${appliedNames.join(", ")}!`,
            "#34d399",
          );
        }
      }
    }

    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }

    window.loadDungeonFloor(window.player.depth);
  };

  window.openHubPortalModal = function () {
    let modal = document.getElementById("deployment-modal");
    if (!modal) return;

    let checkpoints = window.playerStats.unlockedCheckpoints || [1];
    window.state.deploymentFloor = checkpoints[checkpoints.length - 1] || 1;
    window.state.selectedDeploymentSigilId = null;

    modal.style.display = "flex";

    let isCrucible = window.playerStats.isCrucibleMode;
    let titleEl = document.getElementById("deploy-modal-title");
    let subtitleEl = document.getElementById("deploy-modal-subtitle");
    let tabBtnExchange = document.getElementById("deploy-tab-btn-exchange");
    let tabBtnSetup = document.getElementById("deploy-tab-btn-setup");
    let tabContainer = document.querySelector(".deploy-tab-bar");

    if (isCrucible) {
      if (titleEl) titleEl.innerText = "ONSLAUGHT ALTAR";
      if (subtitleEl) subtitleEl.innerText = "CHALLENGE THE ONSLAUGHT ARENA";
      if (tabBtnSetup) tabBtnSetup.innerText = "ARENA SETUP";
      if (tabBtnExchange) tabBtnExchange.style.display = "inline-block";
      if (tabContainer) {
        tabContainer.style.display = ""; // Reset inline override to use stylesheet layout
      }
    } else {
      if (titleEl) titleEl.innerText = "DUNGEON EXPEDITION ALTAR";
      if (subtitleEl) subtitleEl.innerText = "PREPARE FOR DUNGEON DESCENT";
      if (tabBtnSetup) tabBtnSetup.innerText = "EXPEDITION SETUP";
      if (tabBtnExchange) tabBtnExchange.style.display = "none";
      if (tabContainer) {
        tabContainer.style.display = "none"; // Hide entire tab bar in standard campaign
      }
    }

    if (typeof window.switchDeployTab === "function") {
      window.switchDeployTab("setup");
    } else {
      window.renderDeploymentModal();
    }
  };

  window.switchDeployTab = function (tabKey) {
    window.playerStats.crucibleActiveTab = tabKey;
    let setupBtn = document.getElementById("deploy-tab-btn-setup");
    let exchangeBtn = document.getElementById("deploy-tab-btn-exchange");
    let setupContent = document.getElementById("deploy-setup-content");
    let exchangeContent = document.getElementById("deploy-exchange-content");

    if (tabKey === "setup") {
      if (setupBtn) setupBtn.classList.add("active");
      if (exchangeBtn) exchangeBtn.classList.remove("active");
      if (setupContent) {
        setupContent.style.display = "block";
        setupContent.classList.remove("hidden");
      }
      if (exchangeContent) {
        exchangeContent.style.display = "none";
        exchangeContent.classList.add("hidden");
      }
      window.renderDeploymentModal();
    } else {
      if (setupBtn) setupBtn.classList.remove("active");
      if (exchangeBtn) exchangeBtn.classList.add("active");
      if (setupContent) {
        setupContent.style.display = "none";
        setupContent.classList.add("hidden");
      }
      if (exchangeContent) {
        exchangeContent.style.display = "flex";
        exchangeContent.classList.remove("hidden");
      }
      window.renderAstralShop();
    }
  };

  window.renderAstralShop = function () {
    let grid = document.getElementById("astral-shop-grid");
    let display = document.getElementById("astral-shards-display");
    if (display) {
      display.innerText = (
        window.playerStats.astralShards || 0
      ).toLocaleString();
    }
    if (!grid) return;

    let stock = window.ASTRAL_SHOP_STOCK || [];
    let ownedShards = window.playerStats.astralShards || 0;

    grid.innerHTML = stock
      .map((item, idx) => {
        let canAfford = ownedShards >= item.cost;
        let isPurchased = false;

        if (item.isTitle) {
          let unlocked = window.playerStats.unlockedTitles || [];
          if (unlocked.includes("astral_conqueror")) {
            isPurchased = true;
          }
        }

        let btnHtml = "";
        if (isPurchased) {
          btnHtml = `<button class="astral-buy-btn" style="background: #334155;" disabled>OWNED</button>`;
        } else {
          btnHtml = `<button class="astral-buy-btn" ${canAfford ? "" : "disabled"} onclick="window.buyAstralShopItem(${idx})">
            BUY (${item.cost})
          </button>`;
        }

        return `
          <div class="astral-shop-card" style="border-left: 3px solid ${item.color || "#a855f7"};">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span class="astral-shop-cost">${item.cost} Shards</span>
              ${btnHtml}
            </div>
          </div>
        `;
      })
      .join("");
  };

  window.openDeploymentModal = function (startFloor) {
    window.openHubPortalModal();
  };

  window.changeDeploymentFloor = function (floorVal) {
    window.state.deploymentFloor = parseInt(floorVal, 10) || 1;
    window.renderDeploymentModal();
  };

  window.changeDeploymentSigil = function (sigilIdVal) {
    window.state.selectedDeploymentSigilId = sigilIdVal
      ? parseInt(sigilIdVal, 10)
      : null;
    window.renderDeploymentModal();
  };

  window.renderDeploymentModal = function () {
    let selectorsPanel = document.getElementById("deployment-selectors-panel");
    if (selectorsPanel) {
      let checkpoints = window.playerStats.unlockedCheckpoints || [1];
      let selectedFloor = window.state.deploymentFloor || 1;
      let rec = window.playerStats && window.playerStats.recoveryLoot;

      let floorOptions = checkpoints
        .map((startFloor) => {
          let sectorNum = Math.floor((startFloor - 1) / 12) + 1;
          let isSelected = startFloor === selectedFloor ? "selected" : "";
          let recBadge =
            rec && rec.floor === startFloor ? " [RECOVERY CHEST]" : "";

          let tag =
            startFloor === 1
              ? "Start"
              : (startFloor - 1) % 12 === 0
                ? `Sector ${sectorNum} Start`
                : `Post Mini-Boss`;
          return `<option value="${startFloor}" ${isSelected}>Floor ${startFloor} (${tag})${recBadge}</option>`;
        })
        .join("");

      let recBannerHtml = "";
      if (rec && rec.items && rec.items.length > 0) {
        recBannerHtml = `
                      <div style="width: 100%; background: rgba(231, 76, 60, 0.15); border: 1.5px dashed #e74c3c; border-radius: 6px; padding: 6px 10px; font-family: monospace; font-size: 9.5px; color: #ff7675; text-align: left; box-sizing: border-box;">
                        <strong style="color: #f1c40f; display: block; font-size: 10px; margin-bottom: 1px;">[RECOVERY ALERT] UNCLAIMED LOST GEAR</strong>
                        <span>${rec.items.length} item(s) lost on Floor ${rec.floor}. Reach this floor again to retrieve them!</span>
                      </div>
                    `;
      }

      let selectedSigilId = window.state.selectedDeploymentSigilId;
      let activeSigil = selectedSigilId
        ? (window.inventory.SIGIL || []).find((s) => s.id === selectedSigilId)
        : null;

      let sigilSlotHtml = "";
      if (activeSigil) {
        let col = window.getTierColor(activeSigil.statsRolled);
        let buffPills = (activeSigil.buffs || [])
          .map(
            (b) =>
              `<span style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-size: 8px; font-family: monospace; padding: 1px 4px; border-radius: 3px;">+ ${b.name}</span>`,
          )
          .join(" ");
        let debuffPills = (activeSigil.debuffs || [])
          .map(
            (d) =>
              `<span style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; font-size: 8px; font-family: monospace; padding: 1px 4px; border-radius: 3px;">- ${d.name}</span>`,
          )
          .join(" ");

        sigilSlotHtml = `
            <div class="deploy-sigil-card-slot" onclick="window.openSigilPickerModal()" style="border-color:${col}; cursor:pointer; flex-direction:column; align-items:stretch; gap:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                  ${window.getEquipIconHtml(activeSigil, 24)}
                  <div style="display:flex; flex-direction:column; min-width:0;">
                    <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${activeSigil.name}</span>
                    <span style="color:#aaa; font-size:8px; font-family:monospace;">${activeSigil.statsRolled}★ ${window.getTierName(activeSigil.statsRolled)}</span>
                  </div>
                </div>
                <button class="action-btn-sm" style="background:#3b0764; border-color:#a855f7; color:#df9ffb; font-size:8px; padding:3px 8px;" onclick="event.stopPropagation(); window.openSigilPickerModal();">SWAP</button>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:3px; border-top:1px dashed rgba(255,255,255,0.08); padding-top:4px;">
                ${buffPills} ${debuffPills}
              </div>
            </div>
          `;
      } else {
        sigilSlotHtml = `
            <div class="deploy-sigil-card-slot empty" onclick="window.openSigilPickerModal()" style="cursor:pointer; padding:12px 10px;">
              <span style="color:#64748b; font-size:10px; font-weight:bold; font-style:italic;">[ NO SIGIL INFUSED ]</span>
              <button class="action-btn-sm" style="background:#0284c7; border-color:#38bdf8; color:#fff; font-size:8px; padding:4px 8px;" onclick="event.stopPropagation(); window.openSigilPickerModal();">INFUSE SIGIL</button>
            </div>
          `;
      }

      selectorsPanel.innerHTML = `
                  ${recBannerHtml}
                  <div class="deploy-pane-header">
                    <span>EXPEDITION & SIGIL SETUP</span>
                    <span class="deploy-risk-tag" style="border-color:#f1c40f; color:#f1c40f; background:rgba(241,196,15,0.1);">DESTINATION</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                    <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                      <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">1. TARGET DUNGEON FLOOR</label>
                      <select id="deploy-floor-select" style="background: #1e293b; color: #ffd700; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 11px; width: 100%; outline: none;" onchange="window.changeDeploymentFloor(this.value)">
                        ${floorOptions}
                      </select>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                      <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">2. CAVERN SIGIL ALTAR</label>
                      ${sigilSlotHtml}
                    </div>
                  </div>
                `;
    }

    let container = document.getElementById("deployment-gear-list");
    if (!container) return;

    let allSlots = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let itemsHtml = "";

    allSlots.forEach((slotKey) => {
      let item = window.equippedSlots[slotKey];
      if (item) {
        let col = window.getTierColor(item.statsRolled);
        let isLocked = !!item.locked;
        let rawPremium = window.calculateInsurancePremium(item);

        let cardStatusClass = isLocked ? "is-insured" : "is-uninsured";
        let btnStatusClass = isLocked ? "active" : "";

        itemsHtml += `
                      <div class="deploy-gear-card ${cardStatusClass}" style="border-left: 3.5px solid ${col};">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer;" onclick="event.stopPropagation(); window.showSlotTooltip(event, '${slotKey}');" onmouseenter="window.showSlotTooltip(event, '${slotKey}')" onmouseleave="window.hideTooltip()">
                          ${window.getEquipIconHtml(item, 28)}
                          <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                            <span style="color:${col}; font-weight: bold; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                            <span style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">LV.${item.stageLevel || 1} • Soul Bond: ${window.formatNumber(rawPremium)} Gold</span>
                          </div>
                        </div>
                        <button class="tactical-insure-btn ${btnStatusClass}" onclick="event.stopPropagation(); window.toggleDeploymentInsurance('${slotKey}')">
                          ${isLocked ? "[ SOUL BOUND ]" : "[ RISKING LOSS ]"}
                        </button>
                      </div>
                    `;
      }
    });

    if (!itemsHtml) {
      itemsHtml = `<div style="font-size: 10px; color: #64748b; font-style: italic; text-align: center; padding: 25px;">No gear currently equipped. Risking no items in cavern!</div>`;
    }

    container.innerHTML = itemsHtml;

    let totals = window.calculateRunInsuranceTotals();
    let statsContainer = document.getElementById("deployment-stats-panel");
    if (statsContainer) {
      let premiumText = window.formatNumber(totals.totalPremium);
      let wallet = BigNum.from(window.playerStats.coins);
      let canAfford = wallet.gte(totals.totalPremium);
      let premiumColor = canAfford ? "#ffd700" : "#ef4444";

      let soulsOwned =
        window.inventory && window.inventory.ETC
          ? window.inventory.ETC["Monster Soul"] || 0
          : 0;
      let canAffordSouls = soulsOwned >= totals.totalSoulsCost;
      let soulsColor = canAffordSouls ? "#34d399" : "#ef4444";

      let activeSigil = null;
      if (window.state.selectedDeploymentSigilId) {
        activeSigil = (window.inventory.SIGIL || []).find(
          (s) => s.id === window.state.selectedDeploymentSigilId,
        );
      }

      let sigilDetailsHtml = "";
      if (activeSigil) {
        let buffList = (activeSigil.buffs || [])
          .map(
            (b) =>
              `<div style="color: #34d399;">+ [✦] ${b.name}: ${b.desc}</div>`,
          )
          .join("");
        let debuffList = (activeSigil.debuffs || [])
          .map(
            (d) =>
              `<div style="color: #f87171;">- [◈] ${d.name}: ${d.desc}</div>`,
          )
          .join("");
        sigilDetailsHtml = `
            <div style="border-top: 1px dashed rgba(255,255,255,0.1); margin: 6px 0; padding-top: 6px;"></div>
            <strong style="color: #c084fc; font-size: 8.5px; letter-spacing: 0.8px; text-transform: uppercase;">[ ACTIVE SIGIL MODIFIERS ]</strong>
            ${buffList}
            ${debuffList}
            <div style="display:flex; gap:12px; margin-top:3px; font-family:monospace; font-size:9px;">
              <span style="color: #38bdf8; font-weight: bold;">Focus Multiplier: +${(activeSigil.rewardMultiplier * 100).toFixed(0)}%</span>
              ${activeSigil.qualityBoost > 0 ? `<span style="color: #e879f9; font-weight: bold;">Quality Boost: +${(activeSigil.qualityBoost * 100).toFixed(0)}%</span>` : ""}
            </div>
          `;
      }

      // 3-Segment Insured Gauge Bar
      let gaugeSegments = "";
      for (let i = 1; i <= 3; i++) {
        let isFilled = i <= totals.insuredCount;
        let color = isFilled ? "#10b981" : "#334155";
        gaugeSegments += `<div style="flex:1; height:6px; background:${color}; border-radius:2px; transition:all 0.2s;"></div>`;
      }

      statsContainer.innerHTML = `
                  <div style="display: flex; flex-direction: column; gap: 4px; text-align: left; font-family: monospace; font-size: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="color: #ffd700; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;">[ EXPEDITION PROTECTION BREAKDOWN ]</strong>
                      <span style="color:#10b981; font-weight:bold;">${totals.insuredCount} / 3 Max Bound</span>
                    </div>
                    <div style="display:flex; gap:4px; margin:2px 0 6px 0;">
                      ${gaugeSegments}
                    </div>
                    <div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Soul Binding Cost:</span> <strong style="color:${premiumColor};">${premiumText} Gold</strong></div>
                    ${totals.totalSoulsCost > 0 ? `<div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Monster Souls Required:</span> <strong style="color:${soulsColor};">${totals.totalSoulsCost} Souls (Owned: ${soulsOwned})</strong></div>` : ""}
                    ${totals.waivedItem ? `<div style="font-size: 8.5px; color: #34d399; text-align: right; font-style: italic;">[Waived Protection Slot: ${totals.waivedItem.name}]</div>` : ""}
                    ${sigilDetailsHtml}
                  </div>
                `;

      let btnDeploySecure = document.getElementById("btn-deploy-secure");
      if (btnDeploySecure) {
        btnDeploySecure.disabled = !canAfford || !canAffordSouls;
        btnDeploySecure.innerText =
          totals.insuredCount > 0
            ? `DESCEND INTO DUNGEON (BOUND ${totals.insuredCount}/3)`
            : "DESCEND INTO DUNGEON (UNPROTECTED)";
      }
    }
  };

  window.toggleDeploymentInsurance = function (slotKey) {
    let item = window.equippedSlots[slotKey];
    if (!item) return;

    let allSlots = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let currentlyInsuredCount = allSlots.filter(
      (s) =>
        window.equippedSlots[s] &&
        window.equippedSlots[s].locked &&
        s !== slotKey,
    ).length;

    if (!item.locked && currentlyInsuredCount >= 3) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] You can only insure up to 3 items per run!",
          "#e74c3c",
        );
      }
      window.renderDeploymentModal();
      return;
    }

    item.locked = !item.locked;
    window.renderDeploymentModal();
  };

  window.executeDeployment = function (bypassWarning = false) {
    let totals = window.calculateRunInsuranceTotals();
    let isCrucible = window.playerStats.isCrucibleMode;

    if (!isCrucible && totals.insuredCount === 0 && !bypassWarning) {
      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unprotected Descent",
          "<span style='color: #e74c3c;'><strong>WARNING:</strong> You are descending without soul binding any equipped gear!</span><br><br>If you fall in battle, all uninsured items will be permanently lost. Are you sure you want to proceed?",
          "DESCEND ANYWAY",
          "CANCEL",
          "#e74c3c",
          function () {
            window.executeDeployment(true);
          },
        );
      } else {
        if (
          confirm(
            "WARNING: You are descending without soul binding any equipped gear! If you fall in battle, all uninsured items will be permanently lost. Proceed?",
          )
        ) {
          window.executeDeployment(true);
        }
      }
      return;
    }

    let wallet = BigNum.from(window.playerStats.coins);
    let soulsOwned =
      window.inventory && window.inventory.ETC
        ? window.inventory.ETC["Monster Soul"] || 0
        : 0;

    if (!isCrucible) {
      if (wallet.lt(totals.totalPremium)) {
        window.pushHeaderToast(
          "[X] Insufficient Gold for insurance premium!",
          "#e74c3c",
        );
        return;
      }
      if (soulsOwned < totals.totalSoulsCost) {
        window.pushHeaderToast(
          "[X] Insufficient Monster Souls for insurance premium!",
          "#e74c3c",
        );
        return;
      }

      if (totals.totalPremium.gt(0)) {
        window.playerStats.coins = wallet.sub(totals.totalPremium);
        if (window.playerStats.coins.eq(0)) {
          window.playerStats.hasTriggeredExactChange = true;
        }
      }

      if (totals.insuredCount >= 3) {
        window.playerStats.hasTriggeredSoulBound = true;
      }

      if (totals.totalSoulsCost > 0) {
        window.inventory.ETC["Monster Soul"] -= totals.totalSoulsCost;
        if (window.inventory.ETC["Monster Soul"] === 0) {
          delete window.inventory.ETC["Monster Soul"];
        }
      }

      // Consume & Slot selected sigil
      let selectedSigilId = window.state.selectedDeploymentSigilId;
      let activeSigil = null;
      if (selectedSigilId && window.inventory.SIGIL) {
        let idx = window.inventory.SIGIL.findIndex(
          (s) => s.id === selectedSigilId,
        );
        if (idx !== -1) {
          activeSigil = window.inventory.SIGIL[idx];
          window.inventory.SIGIL.splice(idx, 1);
        }
      }
      window.playerStats.activeDungeonSigil = activeSigil;
    }

    if (typeof window.saveGame === "function") window.saveGame();

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }
    if (window.combatVisuals) {
      let p = window.player;
      if (p) {
        window.combatVisuals.spawnBeam(p.x, "#00f3ff", 60, true, 0);
        window.combatVisuals.spawnParticles(p.x, p.y, 25, "animated_armor", 4);
        window.combatVisuals.triggerScreenShake(6, 10);
      }
    }

    let modal = document.getElementById("deployment-modal");
    if (modal) modal.style.display = "none";

    if (isCrucible) {
      window.currentGameState = window.GAME_STATES.DUNGEON;
      window.playerStats.crucibleWave =
        window.playerStats.crucibleStartWave || 1;
      window.playerStats.crucibleAccumulatedShards = 0;
      window.playerStats.crucibleAccumulatedCores = 0;
      window.playerStats.crucibleAccumulatedLoot = [];

      if (window.playerStats.crucibleWave > 1) {
        let dividend = window.calculateCumulativeOnslaughtShards(
          window.playerStats.crucibleWave,
        );
        window.playerStats.crucibleAccumulatedShards = dividend.shards;
        window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
          dividend.gold,
        );
        window.playerStats.totalGoldEarned = BigNum.from(
          window.playerStats.totalGoldEarned || 0,
        ).add(dividend.gold);
        if (typeof window.gainXp === "function") {
          window.gainXp(dividend.xp);
        }
      }

      window.playerStats.crucibleDraftDeck = [];
      window.playerStats.pendingCrucibleDrafts = 3;
      window.loadDungeonFloor(1);
    } else {
      window.enterDungeonRun(window.state.deploymentFloor);
    }
  };

  window.spawnBossEncounter = function (tileX, tileY, bossTier = "major") {
    let map = window.activeDungeonMap;
    let tileSize = map ? map.tileSize : 32;

    let depth = window.player.depth || 1;
    let isMini = bossTier === "mini";

    let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;

    // Aligned with exponential item scaling to maintain a tight, balanced progression curve
    let repStage = window.getEffectiveStage(depth * 5);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    let bossHp = isMini ? 300 * repScale : 500 * repScale;
    let bossAtk = isMini ? 15 * repScale : 22 * repScale;

    bossHp = Math.round(bossHp * enemyScale);
    bossAtk = Math.round(bossAtk * enemyScale);

    let tier =
      typeof window.getStageTier === "function" ? window.getStageTier() : 0;
    let isDungeon = window.playerStats.isDungeonMode;
    let dType = window.playerStats.currentDungeon || "gold";

    let bossName = isMini ? "Guard Warden" : "Dungeon Overlord";
    let vType = null;

    if (isDungeon) {
      if (dType === "gold") {
        bossName = isMini ? "Treasury Guard" : "Gilded Vault Keeper";
        vType = "gilded_vault_keeper";
      } else if (dType === "mat") {
        bossName = isMini ? "Sludge Sentinel" : "Corrosive Abomination";
        vType = "corrosive_abomination";
      } else if (dType === "equip") {
        bossName = isMini ? "Iron Golem" : "Overlord Iron Vault";
        vType = "overlord_iron_vault";
      }
    } else if (window.playerStats.isUberBoss) {
      let uType = window.playerStats.currentUberBoss || "guardian";
      if (uType === "guardian") {
        bossName = "Aegis Goliath";
        vType = "aegis_goliath";
      } else if (uType === "chronos" || uType === "arbitrator") {
        bossName = "Chronos Arbitrator";
        vType = "chronos_arbitrator";
      } else if (uType === "nexus") {
        bossName = "Nexus Overseer";
        vType = "nexus_overseer";
      }
    } else {
      const names = [
        "Arachnid Treant",
        "Aegis Goliath",
        "Brimstone Colossus",
        "Corrosive Abomination",
        "Void Overseer",
        "Chronos Arbitrator",
        "Nexus Overseer",
      ];
      const types = [
        "arachnid_treant",
        "aegis_goliath",
        "overlord_iron_vault",
        "corrosive_abomination",
        "void_overseer",
        "chronos_arbitrator",
        "nexus_overseer",
      ];
      bossName = isMini
        ? "Guard " + (names[tier] || "Warden")
        : names[tier] || "Dungeon Overlord";
      vType = types[tier] || "arachnid_treant";
    }

    window.mob = {
      type: isMini ? "dungeon_miniboss" : "dungeon_boss",
      name: bossName,
      visualType: vType,
      hp: BigNum.from(bossHp),
      maxHp: BigNum.from(bossHp),
      atk: bossAtk,
      x: tileX * tileSize - (isMini ? 4 : 16),
      y: tileY * tileSize - (isMini ? 4 : 16),
      w: isMini ? 40 : 64,
      h: isMini ? 40 : 64,
      flashTimer: 0,
      isStopped: true,
      bossTileX: tileX,
      bossTileY: tileY,
      state: "idle",
      telegraphTimer: 0,
      maxTelegraphTimer: isMini ? 80 : 65,
      activeAbility: null,
      targetX: 0,
      targetY: 0,
      attackCooldown: 60,
      moveset: isMini ? ["slam", "charge"] : ["slam", "nova", "charge"],
      facing: -1,
    };

    window.spawnFloatingText(
      window.player.x,
      window.player.y - 25,
      `${bossName.toUpperCase()} ENGAGED`,
      isMini ? "#e67e22" : "#e74c3c",
    );
  };

  window.onBossDefeated = function (tileX, tileY) {
    let map = window.activeDungeonMap;
    let depth = window.player.depth || 1;

    // Refill Field Flask charges upon defeating a boss
    window.refillFlaskCharges(false);

    let nextCheckpoint = depth + 1;
    window.playerStats.unlockedCheckpoints = window.playerStats
      .unlockedCheckpoints || [1];
    if (!window.playerStats.unlockedCheckpoints.includes(nextCheckpoint)) {
      window.playerStats.unlockedCheckpoints.push(nextCheckpoint);
      window.playerStats.unlockedCheckpoints.sort((a, b) => a - b);
    }
    window.playerStats.maxFloorCleared = Math.max(
      window.playerStats.maxFloorCleared || 0,
      depth,
    );
    if (typeof window.saveGame === "function") window.saveGame();

    if (
      map &&
      map.grid &&
      map.grid[tileY] &&
      map.grid[tileY][tileX] !== undefined
    ) {
      map.grid[tileY][tileX] = window.TILE_TYPES.EXTRACTION_ZONE;
    }
    window.spawnFloatingText(
      window.player.x,
      window.player.y - 25,
      "CHECKPOINT UNLOCKED - EXTRACTION OPEN",
      "#00d2ff",
    );
  };

  window.activeDungeonMobs = [];

  window.loadDungeonFloor = function (depth) {
    if (!window.activeDungeonMap) return;

    // Strict Extraction Rules: Discard and reset uncollected floor state
    window.groundLoot = [];
    window.groundMaterials = [];
    window.goldParticles = [];
    window.heartOrbs = [];
    window.xpOrbs = [];
    window.cavernInteractives = [];
    window.activeDungeonMobs = [];
    window.mob = null;
    window.projectiles = [];
    window.floorTimeElapsed = 0;
    window.calamitySpecterActive = false;
    if (window.activeDungeonMap) {
      window.activeDungeonMap.openedChests = new Set();
    }

    let isMiniBoss = false;
    let isMajorBoss = false;
    let map;

    if (window.playerStats.isCrucibleMode) {
      map = window.activeDungeonMap.generateOnslaughtArena();
      window.state.onslaughterWaveLock = false;
      setTimeout(() => {
        window.spawnOnslaughtWave(window.playerStats.crucibleWave || 1);
      }, 100);
    } else {
      isMiniBoss = depth % 12 === 4 || depth % 12 === 8;
      isMajorBoss = depth % 12 === 0;

      if (isMiniBoss || isMajorBoss) {
        map = window.activeDungeonMap.generateBossArena();
      } else {
        map = window.activeDungeonMap.generate(depth);
      }
    }
    let tileSize = map.tileSize;

    window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
    window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;

    if (isMajorBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "major");
    } else if (isMiniBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "mini");
    } else if (map.mobSpawns) {
      let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;

      // Aligned with exponential item scaling to maintain a tight, balanced progression curve
      let repStage = window.getEffectiveStage(depth * 5);
      let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
      let repScale = Math.pow(repGrowth, repStage * 0.95);

      let mobHpVal = Math.floor(40 * repScale * enemyScale);
      let mobAtkVal = Math.floor(8 * repScale * enemyScale);

      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let rareRate = pStats.rareSpawn !== undefined ? pStats.rareSpawn : 0.01;

      map.mobSpawns.forEach((sp) => {
        let mobInfo = window.getMobPoolForDepth(depth);
        let isRare = Math.random() < rareRate;

        // Roll Elite Support Affixes on higher floors
        let eliteAffix = null;
        let isEliteInfested =
          typeof window.isCavernEffectActive === "function" &&
          window.isCavernEffectActive("elite_infestation");
        let affixChance = isEliteInfested
          ? 1.0
          : depth >= 85
            ? 0.35
            : depth >= 49
              ? 0.15
              : 0;
        if (Math.random() < affixChance) {
          const affixes = [
            "vitality_weaver",
            "iron_citadel",
            "swift_commander",
            "blood_berserker",
            "nullifier",
          ];
          eliteAffix = affixes[Math.floor(Math.random() * affixes.length)];
        }

        let finalHp = isRare ? Math.round(mobHpVal * 1.5) : mobHpVal;
        let finalAtk = isRare ? Math.round(mobAtkVal * 1.25) : mobAtkVal;

        let rangedTypes = [
          "thorn_wyrm",
          "wyrmling",
          "magma_elemental",
          "toxic_fly",
          "void_orb",
        ];
        let isRanged = rangedTypes.includes(mobInfo.type);
        let projType =
          mobInfo.type === "thorn_wyrm"
            ? "thorn"
            : mobInfo.type === "wyrmling"
              ? "frost"
              : mobInfo.type === "magma_elemental"
                ? "fireball"
                : mobInfo.type === "toxic_fly"
                  ? "maelstrom"
                  : "void";

        let spawnX = sp.x * tileSize;
        let spawnY = sp.y * tileSize;

        window.activeDungeonMobs.push({
          id: window.idCounter++,
          type: "mob",
          visualTier: mobInfo.tier,
          visualType: mobInfo.type,
          x: spawnX,
          y: spawnY,
          homeX: spawnX,
          homeY: spawnY,
          w: 24,
          h: 24,
          hp: BigNum.from(finalHp),
          maxHp: BigNum.from(finalHp),
          atk: finalAtk,
          flashTimer: 0,
          attackCooldown: 0,
          rangedCooldown: window.randInt(30, 90),
          isRanged: isRanged,
          projectileType: projType,
          facing: -1,
          isRare: isRare,
          eliteAffix: eliteAffix,
          buffStacks: { haste: 0, def: 0, atk: 0 },
          buffTimers: { haste: 0, def: 0, atk: 0 },
          buffDecayTimers: { haste: 0, def: 0, atk: 0 },
          wanderTimer: window.randInt(40, 120),
          wanderVx: 0,
          wanderVy: 0,
          isWandering: false,
          hopTimer: window.randInt(0, 29),
        });
      });
    }

    // Wave Clearance Reward Dispatcher
    window.onOnslaughtWaveClear = function () {
      let currentWave = window.playerStats.crucibleWave || 1;

      // Base Shard reward: scaled logarithmically with wave depth
      let shardReward = Math.floor(currentWave * 1.2 + Math.log(currentWave));
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      if (pStats.crucibleShardMult) {
        shardReward = Math.floor(shardReward * pStats.crucibleShardMult);
      }
      window.playerStats.crucibleAccumulatedShards =
        (window.playerStats.crucibleAccumulatedShards || 0) + shardReward;

      // Milestone Rewards (Every 5th Wave)
      if (currentWave % 5 === 0) {
        window.playerStats.crucibleAccumulatedShards += 5; // +5 flat milestone shards
        // Guaranteed 1 Catalyst Core for every 5th wave boss defeated
        window.playerStats.crucibleAccumulatedCores =
          (window.playerStats.crucibleAccumulatedCores || 0) + 1;

        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `[MILESTONE] Wave ${currentWave} Cleared! Gained +5 Bonus Shards & +1 Catalyst Core!`,
            "#ffd700",
          );
        }
      } else {
        // 10% Chance for Catalyst Core on standard waves
        if (Math.random() < 0.1) {
          window.playerStats.crucibleAccumulatedCores =
            (window.playerStats.crucibleAccumulatedCores || 0) + 1;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[REWARD] Gained +1 Catalyst Core!",
              "#2ecc71",
            );
          }
        }
      }

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[WAVE CLEAR] Wave ${currentWave} Cleared! Gained +${shardReward} Astral Shards.`,
          "#00d2ff",
        );
      }

      if (typeof window.saveGame === "function") window.saveGame();

      // Trigger draft card overlay selection OR auto-advance wave immediately
      if (currentWave % 5 === 0) {
        if (typeof window.triggerOnslaughtDraft === "function") {
          window.triggerOnslaughtDraft();
        } else {
          // Fallback before draft selection UI is built in Phase 4
          window.advanceOnslaughtWave();
        }
      } else {
        setTimeout(() => {
          window.advanceOnslaughtWave();
        }, 1500);
      }
    };

    window.advanceOnslaughtWave = function () {
      window.playerStats.crucibleWave =
        (window.playerStats.crucibleWave || 1) + 1;
      window.state.onslaughterWaveLock = false;

      if (typeof window.saveGame === "function") window.saveGame();
      if (typeof window.updateUI === "function") window.updateUI();

      window.spawnOnslaughtWave(window.playerStats.crucibleWave);
    };

    // Rule-Based Unique Draft Selector
    window.getOnslaughtDraftChoices = function () {
      let deck = window.playerStats.crucibleDraftDeck || [];
      let pool = window.CRUCIBLE_DRAFT_POOL || [];

      // Filter cards out of pool if stacking or singularity caps have been reached
      let eligible = pool.filter((card) => {
        let count = deck.filter((id) => id === card.id).length;
        if (card.isMythic || card.isSingular) {
          return count < 1; // Singular/Mythic can only be drafted once
        }
        if (card.isCorrupted) {
          return count < 3; // Corrupted can only be drafted 3 times max
        }
        return true; // Standard cards stack infinitely
      });

      // Shuffle and pick 3 unique cards at random
      eligible.sort(() => Math.random() - 0.5);
      return eligible.slice(0, 3);
    };

    // DOM-Based Drafting Panel Overlay
    window.triggerOnslaughtDraft = function () {
      let container = document.getElementById("game-container");
      if (!container) return;

      // Freeze game loops
      window.onslaughterSavePauseState = window.isGamePaused;
      window.isGamePaused = true;

      // Roll choices
      let choices = window.getOnslaughtDraftChoices();
      if (choices.length === 0) {
        // Fallback if all caps have been met across the entire database
        window.isGamePaused = window.onslaughterSavePauseState || false;
        window.advanceOnslaughtWave();
        return;
      }

      // Create self-contained overlay element
      let overlay = document.createElement("div");
      overlay.id = "onslaught-draft-overlay";
      overlay.className = "onslaught-draft-overlay";

      // Inject dedicated, non-leaking local styles
      let styleHtml = `
                <style>
                  .onslaught-draft-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at center, rgba(16, 12, 28, 0.96) 0%, rgba(4, 3, 9, 0.99) 80%);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 55000;
                    font-family: monospace;
                    color: #e2e8f0;
                    user-select: none;
                    -webkit-user-select: none;
                    box-sizing: border-box;
                    padding: 20px;
                    animation: draftFadeIn 0.3s ease-out;
                  }
                  .onslaught-draft-title {
                    font-size: 16px;
                    font-weight: 900;
                    color: #ffd700;
                    letter-spacing: 2.2px;
                    text-shadow: 0 2px 4px #000;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                  }
                  .onslaught-draft-subtitle {
                    font-size: 10px;
                    color: #94a3b8;
                    margin-bottom: 20px;
                    letter-spacing: 0.5px;
                  }
                  .onslaught-draft-cards-container {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    align-items: stretch;
                    max-width: 900px;
                    width: 90%;
                  }
                  .draft-card {
                    flex: 1;
                    background: linear-gradient(180deg, #130d22 0%, #07050d 100%);
                    border: 1.5px solid #475569;
                    border-radius: 8px;
                    padding: 16px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                    min-width: 140px;
                    max-width: 240px;
                    box-sizing: border-box;
                  }
                  .draft-card:hover {
                    transform: translateY(-4px);
                  }
                  .draft-card.standard {
                    border-color: #38bdf8;
                  }
                  .draft-card.standard:hover {
                    box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
                  }
                  .draft-card.corrupted {
                    border-color: #e67e22;
                  }
                  .draft-card.corrupted:hover {
                    box-shadow: 0 0 15px rgba(230, 126, 34, 0.35);
                  }
                  .draft-card.mythic {
                    border-color: #a855f7;
                  }
                  .draft-card.mythic:hover {
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
                  }
                  .draft-card-name {
                    font-size: 11.5px;
                    font-weight: 900;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    line-height: 1.2;
                  }
                  .draft-card-tier {
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 6px;
                    border-radius: 3px;
                    margin-bottom: 12px;
                    border: 1px solid;
                    text-transform: uppercase;
                    line-height: 1;
                  }
                  .draft-card.standard .draft-card-name { color: #38bdf8; }
                  .draft-card.standard .draft-card-tier { color: #38bdf8; border-color: rgba(56,189,248,0.3); background: rgba(56,189,248,0.06); }
                  .draft-card.corrupted .draft-card-name { color: #e67e22; }
                  .draft-card.corrupted .draft-card-tier { color: #e67e22; border-color: rgba(230,126,34,0.3); background: rgba(230,126,34,0.06); }
                  .draft-card.mythic .draft-card-name { color: #a855f7; }
                  .draft-card.mythic .draft-card-tier { color: #a855f7; border-color: rgba(168,85,247,0.3); background: rgba(168,85,247,0.06); }

                  .draft-card-desc {
                    font-size: 9.5px;
                    color: #cbd5e1;
                    line-height: 1.4;
                    margin-bottom: 8px;
                    flex: 1;
                    white-space: normal;
                  }
                  .draft-card-modifier-group {
                    width: 100%;
                    border-top: 1px dashed rgba(255,255,255,0.08);
                    padding-top: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    text-align: left;
                  }
                  .draft-mod-line {
                    font-size: 9px;
                    font-weight: bold;
                    font-family: monospace;
                  }
                  .draft-mod-line.buff { color: #34d399; }
                  .draft-mod-line.debuff { color: #f87171; }

                  @keyframes draftFadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                </style>
              `;

      // Render each rolled draft choice cards inside horizontal flex layout
      let cardsHtml = choices
        .map((card) => {
          let typeClass =
            card.isMythic || card.isSingular
              ? "mythic"
              : card.isCorrupted
                ? "corrupted"
                : "standard";
          let tierLabel =
            card.isMythic || card.isSingular
              ? "Mythic"
              : card.isCorrupted
                ? "Corrupted"
                : "Standard";

          // Display current cards drafted stacking indicators
          let deck = window.playerStats.crucibleDraftDeck || [];
          let count = deck.filter((id) => id === card.id).length;
          let stackBadge =
            card.isMythic || card.isSingular
              ? ""
              : card.isCorrupted
                ? ` (${count}/3)`
                : ` (${count}x)`;

          // Parse explicit card modifier displays
          let modLinesHtml = "";
          if (card.modifiersDisplay) {
            let lines = [];
            if (card.modifiersDisplay.buff) {
              lines.push(
                `<div class="draft-mod-line buff">[BUFF] + ${card.modifiersDisplay.buff}</div>`,
              );
            }
            if (card.modifiersDisplay.debuff) {
              lines.push(
                `<div class="draft-mod-line debuff">[DEBUFF] - ${card.modifiersDisplay.debuff}</div>`,
              );
            }
            modLinesHtml = `<div class="draft-card-modifier-group">${lines.join("")}</div>`;
          }

          return `
                    <div class="draft-card ${typeClass}" onclick="event.stopPropagation(); window.selectOnslaughtDraftCard('${card.id}')">
                      <span class="draft-card-name">${card.name}</span>
                      <span class="draft-card-tier">${tierLabel}${stackBadge}</span>
                      <p class="draft-card-desc">${card.desc}</p>
                      ${modLinesHtml}
                    </div>
                  `;
        })
        .join("");

      overlay.innerHTML = `
                ${styleHtml}
                <div class="onslaught-draft-title">Draft Potion Matrix</div>
                <div class="onslaught-draft-subtitle">Choose one upgrade to attune your matrix for the next 5 waves</div>
                <div class="onslaught-draft-cards-container">
                  ${cardsHtml}
                </div>
              `;

      container.appendChild(overlay);

      // Prevent pointer events leaking down onto active game canvas
      overlay.addEventListener("pointerdown", (e) => e.stopPropagation());
      overlay.addEventListener("touchstart", (e) => e.stopPropagation());
    };

    // Selection Resolution Handler
    window.selectOnslaughtDraftCard = function (cardId) {
      // If drafting an 11th card (deck is full), transition into overwrite screen
      let deck = window.playerStats.crucibleDraftDeck || [];
      if (deck.length >= 10) {
        window.triggerOnslaughtReplaceCard(cardId);
        return; // Intercept! Do not push or conclude yet
      }

      let overlay = document.getElementById("onslaught-draft-overlay");
      if (overlay) {
        overlay.remove();
      }

      // Push selection to run deck
      window.playerStats.crucibleDraftDeck =
        window.playerStats.crucibleDraftDeck || [];
      window.playerStats.crucibleDraftDeck.push(cardId);

      // Play click sound feedback
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }

      // Recalculate statistics to immediately apply card effects
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }

      // Proceed with concluding draft selection
      window.concludeDraftSelection();
    };

    window.triggerOnslaughtReplaceCard = function (newCardId) {
      let overlay = document.getElementById("onslaught-draft-overlay");
      if (!overlay) return;

      let newCard = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === newCardId);
      if (!newCard) return;

      let deck = window.playerStats.crucibleDraftDeck || [];

      // Render active 10 cards inside the replace container
      let cardsMarkup = deck
        .map((activeCardId, idx) => {
          let card = window.CRUCIBLE_DRAFT_POOL.find(
            (c) => c.id === activeCardId,
          );
          if (!card) return "";

          return `
                              <div class="replace-card-row" onclick="event.stopPropagation(); window.replaceOnslaughtDraftCard(${idx}, '${newCardId}')">
                                <div class="replace-card-title">
                                  <span class="replace-card-idx">Slot ${idx + 1}</span>
                                  <span style="margin-left: 8px;">${card.name}</span>
                                </div>
                                <div class="replace-card-stats">${card.desc}</div>
                              </div>
                            `;
        })
        .join("");

      overlay.innerHTML = `
                            <style>
                              .replace-view-container {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                width: 100%;
                                max-width: 600px;
                                animation: draftFadeIn 0.25s ease-out;
                              }
                              .replace-view-header {
                                font-size: 14px;
                                font-weight: bold;
                                color: #ef4444;
                                letter-spacing: 1.5px;
                                text-transform: uppercase;
                                margin-bottom: 4px;
                                text-shadow: 0 2px 4px #000;
                              }
                              .replace-view-subtitle {
                                font-size: 9.5px;
                                color: #94a3b8;
                                margin-bottom: 12px;
                                text-align: center;
                              }
                              .incoming-card-showcase {
                                background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
                                border: 2px solid #a855f7;
                                border-radius: 8px;
                                padding: 12px;
                                width: 100%;
                                margin-bottom: 16px;
                                text-align: center;
                                box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
                              }
                              .incoming-label {
                                font-size: 8px;
                                font-weight: bold;
                                color: #a855f7;
                                letter-spacing: 1px;
                                text-transform: uppercase;
                                margin-bottom: 4px;
                                display: block;
                              }
                              .incoming-title {
                                font-size: 12px;
                                font-weight: 900;
                                color: #fff;
                                margin-bottom: 2px;
                              }
                              .incoming-desc {
                                font-size: 9.5px;
                                color: #cbd5e1;
                                line-height: 1.35;
                              }
                              .replace-grid-title {
                                font-size: 9px;
                                font-weight: bold;
                                color: #e2e8f0;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                margin-bottom: 6px;
                                align-self: flex-start;
                                width: 100%;
                                border-bottom: 1px solid rgba(255,255,255,0.08);
                                padding-bottom: 4px;
                              }
                            </style>
                            <div class="replace-view-container">
                              <div class="replace-view-header">Matrix Deck Full!</div>
                              <div class="replace-view-subtitle">Your matrix deck has a strict 10-card cap. Select an active card to discard and overwrite.</div>

                              <!-- Showcase the newly drafted card -->
                              <div class="incoming-card-showcase">
                                <span class="incoming-label">Incoming Card</span>
                                <div class="incoming-title">${newCard.name}</div>
                                <p class="incoming-desc">${newCard.desc}</p>
                              </div>

                              <div class="replace-grid-title">Active Deck Cards (Select one to overwrite)</div>
                              <div class="replace-cards-grid" style="width: 100%; max-height: 240px;">
                                ${cardsMarkup}
                              </div>
                            </div>
                          `;
    };

    window.replaceOnslaughtDraftCard = function (idx, newCardId) {
      let overlay = document.getElementById("onslaught-draft-overlay");
      if (overlay) {
        overlay.remove();
      }

      // Overwrite selected index in deck
      window.playerStats.crucibleDraftDeck[idx] = newCardId;

      // Play click sound feedback
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }

      // Recalculate statistics to immediately apply card effects
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }

      // Proceed with concluding draft selection
      window.concludeDraftSelection();
    };

    window.concludeDraftSelection = function () {
      if (window.playerStats.pendingCrucibleDrafts > 0) {
        window.playerStats.pendingCrucibleDrafts--;
        if (window.playerStats.pendingCrucibleDrafts > 0) {
          // Trigger next sequential pre-run draft
          window.triggerOnslaughtDraft();
        } else {
          // Bypassed drafts are fully concluded; unpause game loop and spawn starting wave
          window.isGamePaused = window.onslaughterSavePauseState || false;
          window.spawnOnslaughtWave(window.playerStats.crucibleWave);
        }
      } else {
        // Standard end-of-wave draft complete; unpause loop and advance wave
        window.isGamePaused = window.onslaughterSavePauseState || false;
        window.advanceOnslaughtWave();
      }
    };

    if (map && map.revealSightRadius) {
      let originalReveal = map.revealSightRadius;
      map.revealSightRadius = function (px, py, intBonus) {
        let hasShroudedSight =
          typeof window.isCavernEffectActive === "function" &&
          window.isCavernEffectActive("shrouded_sight");
        if (hasShroudedSight) {
          originalReveal.call(this, px, py, -15); // Clamps the fog light radius to 3 tiles
        } else {
          originalReveal.call(this, px, py, intBonus);
        }
      };
    }

    window.updateHUD();
    let floorTitle = isMajorBoss
      ? `FLOOR ${depth} - MAJOR DUNGEON BOSS`
      : isMiniBoss
        ? `FLOOR ${depth} - MINI BOSS WARDEN`
        : `FLOOR ${depth} DESCENT`;

    window.spawnFloatingText(
      window.player.x,
      window.player.y - 20,
      floorTitle,
      isMajorBoss ? "#e74c3c" : isMiniBoss ? "#e67e22" : "#00d2ff",
    );
  };

  window.interactWithStation = function (stationType) {
    if (stationType === window.TILE_TYPES.STATION_PORTAL) {
      window.playerStats.isCrucibleMode = false;
      window.openHubPortalModal();
    } else if (stationType === window.TILE_TYPES.STATION_FORGE) {
      if (typeof window.toggleForgeModal === "function") {
        window.toggleForgeModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_ENCHANT) {
      if (typeof window.toggleEnchantmentModal === "function") {
        window.toggleEnchantmentModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_GACHAPON) {
      if (typeof window.openGachaModal === "function") {
        window.openGachaModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_SHOP) {
      if (typeof window.toggleShopModal === "function") {
        window.toggleShopModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_INN) {
      let isUnlocked = (window.playerStats.maxFloorCleared || 0) >= 36;
      if (!isUnlocked) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "[ALTAR LOCKED] The Onslaught Altar is bound by magical seals! Clear Floor 36 (Sector 3 Overlord) to unlock.",
            "#a855f7",
          );
        }
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            window.player.x,
            window.player.y - 15,
            "LOCKED: CLEAR FLOOR 36",
            "#a855f7",
            true,
          );
        }
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("block");
        }
      } else {
        // Set Onslaught Mode configuration active
        window.playerStats.isCrucibleMode = true;
        window.openHubPortalModal();
      }
    }
  };

  window.requestAbandonRun = function () {
    if (window.currentGameState === window.GAME_STATES.HUB) return;

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Retreat to Hub",
        "Are you sure you want to abandon the current run?<br><br><span style='color: #e74c3c;'><strong>WARNING:</strong> All uninsured equipped gear and items in your carried satchel will be permanently lost!</span>",
        "RETREAT",
        "CANCEL",
        "#e74c3c",
        function () {
          window.triggerExtraction(false, true);
        },
      );
    } else {
      if (
        confirm(
          "Are you sure you want to retreat? All uninsured equipped gear and items in your carried satchel will be permanently lost!",
        )
      ) {
        window.triggerExtraction(false, true);
      }
    }
  };

  window.openPortalChoiceModal = function () {
    let modal = document.getElementById("portal-modal");
    let titleEl = document.getElementById("portal-modal-title");
    let subEl = document.getElementById("portal-modal-subtitle");
    let descendBtn = document.getElementById("portal-btn-descend");

    if (!modal) return;

    let depth = window.player.depth || 1;
    let nextFloor = depth + 1;

    let isMiniBossNext = nextFloor % 12 === 4 || nextFloor % 12 === 8;
    let isMajorBossNext = nextFloor % 12 === 0;

    let isMiniBossCurrent = depth % 12 === 4 || depth % 12 === 8;
    let isMajorBossCurrent = depth % 12 === 0;

    if (titleEl) {
      if (isMajorBossCurrent) {
        titleEl.innerText = `DUNGEON SECTOR CLEARED (FLOOR ${depth})`;
      } else if (isMiniBossCurrent) {
        titleEl.innerText = `MINI BOSS DEFEATED (FLOOR ${depth})`;
      } else {
        titleEl.innerText = `DUNGEON PORTAL (FLOOR ${depth})`;
      }
    }

    if (isMajorBossNext) {
      if (subEl)
        subEl.innerText = `Floor ${depth} Cleared! Major Dungeon Boss awaits on Floor ${nextFloor}!`;
      if (descendBtn) {
        descendBtn.innerText = `ENTER MAJOR BOSS ARENA (FLOOR ${nextFloor})`;
        descendBtn.style.background =
          "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)";
        descendBtn.style.borderColor = "#f87171";
      }
    } else if (isMiniBossNext) {
      if (subEl)
        subEl.innerText = `Floor ${depth} Cleared! Mini Guard Boss awaits on Floor ${nextFloor}!`;
      if (descendBtn) {
        descendBtn.innerText = `ENTER MINI BOSS ARENA (FLOOR ${nextFloor})`;
        descendBtn.style.background =
          "linear-gradient(180deg, #f97316 0%, #c2410c 100%)";
        descendBtn.style.borderColor = "#fb923c";
      }
    } else if (isMajorBossCurrent) {
      if (subEl)
        subEl.innerText = `Sector Boss Slayed! Checkpoint unlocked for Floor ${nextFloor}.`;
      if (descendBtn) {
        descendBtn.innerText = `DESCEND TO SECTOR ${Math.floor(depth / 12) + 1} (FLOOR ${nextFloor})`;
        descendBtn.style.background =
          "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)";
        descendBtn.style.borderColor = "#c084fc";
      }
    } else {
      if (subEl) subEl.innerText = `Floor ${depth} Cleared. Choose your path:`;
      if (descendBtn) {
        descendBtn.innerText = `DESCEND TO FLOOR ${nextFloor}`;
        descendBtn.style.background =
          "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)";
        descendBtn.style.borderColor = "#c084fc";
      }
    }

    modal.style.display = "flex";
  };

  window.checkRecoveryChestUnclaimed = function () {
      let rec = window.playerStats && window.playerStats.recoveryLoot;
      if (rec && rec.floor === window.player.depth && rec.items && rec.items.length > 0) {
        return true;
      }
      return false;
    };

    window.executePortalDescend = function (bypassWarning = false) {
      if (window.checkRecoveryChestUnclaimed() && !bypassWarning) {
        let modal = document.getElementById("portal-modal");
        if (modal) modal.style.display = "none";

        if (typeof window.showCustomConfirm === "function") {
          window.showCustomConfirm(
            "Unclaimed Recovery Chest",
            "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! If you descend without claiming it, your lost items and Gold will be permanently overwritten. Proceed anyway?",
            "DESCEND WITHOUT LOOT",
            "RETURN TO FIND IT",
            "#e74c3c",
            function () {
              window.executePortalDescend(true);
            }
          );
        } else {
          if (confirm("WARNING: Your dropped Recovery Chest is still unclaimed on this floor! Proceed anyway?")) {
            window.executePortalDescend(true);
          }
        }
        return;
      }

      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      let p = window.player;
      let map = window.activeDungeonMap;
      if (map && map.grid && p) {
        let tx = Math.floor(p.x / map.tileSize);
        let ty = Math.floor(p.y / map.tileSize);
        if (map.grid[ty] && map.grid[ty][tx] !== undefined) {
          map.grid[ty][tx] = window.TILE_TYPES.FLOOR;
        }
      }

      window.player.depth++;
      window.loadDungeonFloor(window.player.depth);
    };

    window.executePortalExtract = function (bypassWarning = false) {
      if (window.checkRecoveryChestUnclaimed() && !bypassWarning) {
        let modal = document.getElementById("portal-modal");
        if (modal) modal.style.display = "none";

        if (typeof window.showCustomConfirm === "function") {
          window.showCustomConfirm(
            "Unclaimed Recovery Chest",
            "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! If you extract without claiming it, your lost items and Gold will be permanently overwritten. Proceed anyway?",
            "EXTRACT WITHOUT LOOT",
            "RETURN TO FIND IT",
            "#e74c3c",
            function () {
              window.executePortalExtract(true);
            }
          );
        } else {
          if (confirm("WARNING: Your dropped Recovery Chest is still unclaimed on this floor! Proceed anyway?")) {
            window.executePortalExtract(true);
          }
        }
        return;
      }

      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      let p = window.player;
      let map = window.activeDungeonMap;
      if (map && map.grid && p) {
        let tx = Math.floor(p.x / map.tileSize);
        let ty = Math.floor(p.y / map.tileSize);
        if (map.grid[ty] && map.grid[ty][tx] !== undefined) {
          map.grid[ty][tx] = window.TILE_TYPES.FLOOR;
        }
      }

      window.triggerExtraction(true);
    };

  window.decrementPotionRunCharges = function () {
    let p = window.playerStats;
    if (!p) return;

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};
    let effectiveInt = Math.max(0, (pStats.int || 5) - 5);
    let preservationChance = (effectiveInt * 0.5) / (effectiveInt + 95);

    const potTypes = [
      {
        runKey: "atkPotionRuns",
        timerKey: "atkPotionTimer",
        name: "Attack Elixir",
      },
      {
        runKey: "hpPotionRuns",
        timerKey: "hpPotionTimer",
        name: "Vitality Elixir",
      },
      {
        runKey: "defPotionRuns",
        timerKey: "defPotionTimer",
        name: "Armored Elixir",
      },
      {
        runKey: "hastePotionRuns",
        timerKey: "hastePotionTimer",
        name: "Haste Elixir",
      },
      {
        runKey: "xpPotionRuns",
        timerKey: "xpPotionTimer",
        name: "Double XP Elixir",
      },
      {
        runKey: "dropPotionRuns",
        timerKey: "dropPotionTimer",
        name: "Double Drop Elixir",
      },
      {
        runKey: "qlyPotionRuns",
        timerKey: "qlyPotionTimer",
        name: "Drop Quality Elixir",
      },
    ];

    let preservedList = [];
    potTypes.forEach((pot) => {
      let currentRuns = p[pot.runKey] || (p[pot.timerKey] > 0 ? 1 : 0);
      p[pot.timerKey] = 0;

      if (currentRuns > 0) {
        if (Math.random() < preservationChance) {
          preservedList.push(pot.name);
          p[pot.runKey] = currentRuns;
        } else {
          p[pot.runKey] = Math.max(0, currentRuns - 1);
        }
      }
    });

    if (preservedList.length > 0) {
      let pctStr = Math.round(preservationChance * 100);
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[Alchemical Preservation ${pctStr}%] Preserved charge on: ${preservedList.join(", ")}!`,
          "#34d399",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        try {
          window.SoundManager.play("potion");
        } catch (e) {
          window.SoundManager.play("spell");
        }
      }
    }
  };

  window.triggerExtraction = function (success = true, isAbandon = false) {
    window.decrementPotionRunCharges();
    window.playerStats.activeDungeonSigil = null; // Clear and consume active Sigil on run end

    let activeRunGold = BigNum.from(window.playerStats.runGold || 0);

    // --- ONSLAUGHT / CRUCIBLE MODE EXTRACTION INTERCEPT ---
    if (window.playerStats.isCrucibleMode) {
      let summaryModal = document.getElementById("summary-modal");
      let titleEl = document.getElementById("summary-title");
      let subEl = document.getElementById("summary-subtitle");
      let listEl = document.getElementById("summary-loot-list");
      let btnEl = document.getElementById("summary-action-btn");
      let nemesisCard = document.getElementById("death-nemesis-card");

      if (!summaryModal || !titleEl || !listEl) return;

      // Hide nemesis card since Arena death is a standard progression conclusion
      if (nemesisCard) nemesisCard.style.display = "none";

      let wavesCleared = Math.max(
        0,
        (window.playerStats.crucibleWave || 1) - 1,
      );
      let shardsSecured = window.playerStats.crucibleAccumulatedShards || 0;
      let coresSecured = window.playerStats.crucibleAccumulatedCores || 0;

      // Secure resources permanently to the Vault database
      window.playerStats.astralShards =
        (window.playerStats.astralShards || 0) + shardsSecured;
      if (coresSecured > 0 && typeof window.addEtcDrop === "function") {
        window.addEtcDrop("Catalyst Core", coresSecured, true);
      }

      // Update personal best peak waves survived
      window.playerStats.cruciblePeak = Math.max(
        window.playerStats.cruciblePeak || 0,
        wavesCleared,
      );

      titleEl.innerText = "ONSLAUGHT CONCLUDED";
      titleEl.style.color = "#a855f7";

      if (subEl) {
        subEl.innerText = `Waves Survived: ${wavesCleared} | Personal Best: Wave ${window.playerStats.cruciblePeak}`;
      }

      // Render clean, informative summary panel with NO Emojis
      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto; text-align:left; font-family:monospace; font-size:11px;">
          <div style="background:#0e0a1a; border:1px solid #3b0764; border-left:4px solid #a855f7; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#df9ffb; font-weight:bold;">[PERFORMANCE] Waves Cleared:</span>
            <strong style="color:#ffffff; font-size:12px;">${wavesCleared} Waves</strong>
          </div>
          <div style="background:#0c0d14; border:1px solid #1e293b; border-left:4px solid #00ffff; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#94a3b8; font-weight:bold;">[REWARD] Astral Shards Gained:</span>
            <strong style="color:#00ffff; font-size:12px;">+${shardsSecured} Shards</strong>
          </div>
          <div style="background:#0a100d; border:1px solid #06241a; border-left:4px solid #2ecc71; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#64748b; font-weight:bold;">[REWARD] Catalyst Cores Gained:</span>
            <strong style="color:#2ecc71; font-size:12px;">+${coresSecured} Cores</strong>
          </div>
          <div style="background:rgba(255,255,255,0.01); border:1px dashed #334155; padding:8px 12px; border-radius:6px; text-align:center; color:#94a3b8; font-size:9.5px; line-height:1.45;">
            [SAFE ZONE PROTECTION ACTIVE]<br>
            As a trial of pure skill, no equipped gear or items from your carried satchel were at risk of being lost. All items are 100% protected and safe.
          </div>
        </div>
      `;

      if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";
      summaryModal.style.display = "flex";

      if (typeof window.saveGame === "function") window.saveGame();
      return;
    }

    // Vacuum any remaining ground items and materials into satchel before extraction processing
    if (window.groundLoot && window.groundLoot.length > 0) {
      window.groundLoot.forEach((gl) => {
        if (gl && gl.item) {
          let isEquipped = window.tryAutoEquip
            ? window.tryAutoEquip(gl.item)
            : false;
          if (!isEquipped && window.player) {
            if (!window.player.bag) window.player.bag = [];
            window.player.bag.push(gl.item);
          }
        }
      });
      window.groundLoot = [];
    }

    if (window.groundMaterials && window.groundMaterials.length > 0) {
      window.groundMaterials.forEach((gm) => {
        if (gm) {
          if (gm.name === "Luminous Soul" || gm.name.includes("Key")) {
            window.addEtcDrop(gm.name, gm.qty, true);
          } else if (window.player) {
            if (!window.player.pendingScraps) window.player.pendingScraps = {};
            window.player.pendingScraps[gm.name] =
              (window.player.pendingScraps[gm.name] || 0) + gm.qty;
          }
        }
      });
      window.groundMaterials = [];
    }
    let summaryModal = document.getElementById("summary-modal");
    let titleEl = document.getElementById("summary-title");
    let subEl = document.getElementById("summary-subtitle");
    let listEl = document.getElementById("summary-loot-list");
    let btnEl = document.getElementById("summary-action-btn");
    let nemesisCard = document.getElementById("death-nemesis-card");
    let killerNameEl = document.getElementById("death-killer-name");

    if (!summaryModal || !titleEl || !listEl) return;

    if (!success && !isAbandon) {
      if (nemesisCard) nemesisCard.style.display = "flex";
      if (killerNameEl) {
        killerNameEl.innerText = (
          window.playerStats.killedBy || "UNKNOWN FOE"
        ).toUpperCase();
      }
      setTimeout(() => {
        if (window.RenderEngine && window.RenderEngine.renderNemesisPreview) {
          window.RenderEngine.renderNemesisPreview(
            window.playerStats.killedByMob,
          );
        }
      }, 50);
    } else {
      if (nemesisCard) nemesisCard.style.display = "none";
    }

    let extractedLoot = [...(window.player.bag || [])];
    let savedInsuredItems = [];
    let lostItems = [];

    let pendingScrapsList = [];
    if (window.player && window.player.pendingScraps) {
      for (let sName in window.player.pendingScraps) {
        let count = window.player.pendingScraps[sName];
        if (count > 0) {
          pendingScrapsList.push({ name: sName, count: count });
        }
      }
    }

    if (success) {
      titleEl.innerText = "EXTRACTION SUCCESSFUL";
      titleEl.style.color = "#2ecc71";

      window.playerStats.successfulExtractions =
        (window.playerStats.successfulExtractions || 0) + 1;
      let maxBag =
        typeof window.getMaxBagSlots === "function"
          ? window.getMaxBagSlots()
          : 20;
      if (extractedLoot.length >= maxBag) {
        window.playerStats.hasTriggeredFullBag = true;
      }

      // Deposit pending run scraps into permanent inventory
      pendingScrapsList.forEach((s) => {
        if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop(s.name, s.count, true);
        }
      });
      window.player.pendingScraps = {};

      // Commit volatile run pocket gold safely into permanent Vault coins!
      window.playerStats.coins = BigNum.from(window.playerStats.coins || 0).add(
        activeRunGold,
      );
      window.playerStats.runGold = BigNum.from(0);

      // Award +25% Extraction Bonus XP on total run earnings (base XP already gained in-run)
      let runXp = window.playerStats.runXp || 0;
      let bonusXp = Math.floor(runXp * 0.25);

      if (bonusXp > 0 && typeof window.gainXp === "function") {
        window.gainXp(bonusXp);
      }
      window.playerStats.runXp = 0;

      if (subEl)
        subEl.innerText = `Secured ${extractedLoot.length} items, ${window.formatNumber(activeRunGold)} Gold & ${pendingScrapsList.length} scraps to Vault! (+25% Bonus XP)`;

      // Save carried bag items permanently to Stash and sync inventory (Separating Gear from Cavern Sigils)
      extractedLoot.forEach((item) => {
        if (item.type === "sigil") {
          if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
          window.inventory.SIGIL.push(item);
        } else {
          window.player.stash.push(item);
        }
      });
      window.player.bag = [];
      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    } else {
      window.player.pendingScraps = {};
      titleEl.innerText = isAbandon ? "RUN ABANDONED" : "CRITICAL DEFEAT";
      titleEl.style.color = isAbandon ? "#e67e22" : "#e74c3c";

      // Reset active run pocket gold
      window.playerStats.runGold = BigNum.from(0);

      // Process Carried Bag Items (Locked items survive in Stash)
      extractedLoot.forEach((item) => {
        if (item.locked) {
          savedInsuredItems.push(item);
          window.player.stash.push(item);
        } else {
          lostItems.push(item);
        }
      });
      window.player.bag = [];

      // Process Equipped Gear (Unlocked gear is lost on defeat, untempered starter items vanish silently)
      for (let slotKey in window.equippedSlots) {
        let eqItem = window.equippedSlots[slotKey];
        if (eqItem) {
          if (eqItem.locked) {
            savedInsuredItems.push(eqItem);
          } else if (
            eqItem.isStarterItem &&
            (eqItem.temperLevel || 0) === 0 &&
            !eqItem.reforgedProperty
          ) {
            // Untempered starter item vanishes on death without cluttering recovery loot
            window.equippedSlots[slotKey] = null;
          } else {
            lostItems.push(eqItem);
            window.equippedSlots[slotKey] = null;
          }
        }
      }

      // Safety Net: Ensure player is never left without a weapon option
      let hasWeapon =
        window.equippedSlots.weapon ||
        window.player.stash.some((i) => i.type === "weapon");
      if (!hasWeapon) {
        let starterSword = window.createItemObject("weapon", 0, 1, 0);
        starterSword.name = "Novice Blade (Starter)";
        window.player.stash.push(starterSword);
        savedInsuredItems.push(starterSword);
      }

      // Corpse Recovery: Store lost items and lost gold in Recovery Loot object for next attempt
      if (!isAbandon && (lostItems.length > 0 || activeRunGold.gt(0))) {
        let deathFloor = window.player.depth || 1;
        window.playerStats.recoveryLoot = {
          floor: deathFloor,
          items: lostItems,
          gold: activeRunGold,
        };

        let reportParts = [];
        if (lostItems.length > 0) reportParts.push(`${lostItems.length} items`);
        if (activeRunGold.gt(0))
          reportParts.push(`${window.formatNumber(activeRunGold)} Gold`);

        if (typeof window.pushLog === "function") {
          window.pushLog(
            `<strong style='color:#e74c3c;'>[LOOT RECOVERY]</strong> Left ${reportParts.join(" and ")} in a Recovery Chest on Floor ${deathFloor}. Retrieve it on your next attempt!`,
          );
        }
      } else if (!isAbandon) {
        window.playerStats.recoveryLoot = null;
      }

      if (subEl) {
        if (!isAbandon && (lostItems.length > 0 || activeRunGold.gt(0))) {
          let reportParts = [];
          if (lostItems.length > 0)
            reportParts.push(`${lostItems.length} items`);
          if (activeRunGold.gt(0))
            reportParts.push(`${window.formatNumber(activeRunGold)} Gold`);
          subEl.innerText = `Unlocked gear & gold lost (${reportParts.join(" & ")}) placed in a Recovery Chest on Floor ${window.player.depth || 1}!`;
        } else {
          subEl.innerText = `Unlocked gear & gold lost. Insured items (${savedInsuredItems.length}) & 100% Vault Gold saved!`;
        }
      }

      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    }

    // Render summary breakdown
    if (success) {
      let lootHtml = extractedLoot
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#2ecc71";
          return `
                <div style="background:#111; border:1px solid #333; border-left:3px solid ${col}; padding:6px 10px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between;">
                  <span style="color:${col}; font-weight:bold;">${item.name}</span>
                  <span style="color:#2ecc71; font-family:monospace;">EXTRACTED ITEM</span>
                </div>
              `;
        })
        .join("");

      let scrapsHtml = pendingScrapsList
        .map(
          (s) => `
                <div style="background:#0a1a10; border:1px solid #1e4620; border-left:3px solid #f1c40f; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                  <span style="color:#f1c40f; font-weight:bold;">x${s.count} ${s.name}</span>
                  <span style="color:#2ecc71; font-family:monospace;">EXTRACTED SCRAP</span>
                </div>
              `,
        )
        .join("");

      listEl.innerHTML =
        lootHtml || scrapsHtml
          ? `<div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">${lootHtml}${scrapsHtml}</div>`
          : `<div style="color:#7f8c8d; font-style:italic; padding:10px; text-align:center;">No carried loot extracted.<br><span style="color:#f1c40f; font-weight:bold;">100% Collected Gold Secured in Wallet!</span></div>`;
    } else {
      let savedHtml = savedInsuredItems
        .map(
          (i) => `
                  <div style="background:#0a1a10; border:1px solid #1e4620; border-left:3px solid #2ecc71; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                    <span style="color:#2ecc71; font-weight:bold;">[SOUL BOUND] ${i.name}</span>
                    <span style="color:#81ecec; font-family:monospace;">SAVED</span>
                  </div>
                `,
        )
        .join("");

      let lostHtml = lostItems
        .map(
          (i) => `
            <div style="background:#1a0a0a; border:1px solid #4a1515; border-left:3px solid #e74c3c; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
              <span style="color:#e74c3c; text-decoration:line-through;">${i.name}</span>
              <span style="color:#ff7675; font-family:monospace;">LOST</span>
            </div>
          `,
        )
        .join("");

      listEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">
              ${savedHtml}
              ${lostHtml}
              ${savedInsuredItems.length === 0 && lostItems.length === 0 ? '<div style="color:#aaa; font-size:10px;">No gear lost.</div>' : ""}
            </div>
            <div style="color:#f1c40f; font-weight:bold; font-size:11px; margin-top:8px; border-top:1px dashed #333; padding-top:6px;">
              100% Collected Gold Secured in Wallet!
            </div>
          `;
    }

    if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";

    summaryModal.style.display = "flex";
  };

  // --- GAME LOOP ---
  function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
  }

  window.checkCollisionAt = function (map, testX, testY, radius) {
    let tileSize = map.tileSize;
    let minTileX = Math.floor((testX - radius) / tileSize);
    let maxTileX = Math.floor((testX + radius) / tileSize);
    let minTileY = Math.floor((testY - radius) / tileSize);
    let maxTileY = Math.floor((testY + radius) / tileSize);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (ty < 0 || ty >= map.height || tx < 0 || tx >= map.width)
          return true;
        let tile = map.grid[ty][tx];
        if (
          tile === window.TILE_TYPES.WALL ||
          tile === window.TILE_TYPES.VOID
        ) {
          return true;
        }
      }
    }
    return false;
  };
  let checkCollisionAt = window.checkCollisionAt;

  window.isAnyMenuOpen = function () {
    if (window.isGamePaused) return true;
    let overlays = document.querySelectorAll(
      ".modal-overlay, #menu-hub-overlay",
    );
    for (let i = 0; i < overlays.length; i++) {
      let el = overlays[i];
      if (el && el.style.display !== "none" && el.style.display !== "") {
        return true;
      }
    }
    return false;
  };

  window.startDeathSequence = function () {
    if (window.deathAnimationTimer > 0) return;
    window.deathAnimationTimer = 75; // 75-frame (~1.25s) collapse animation

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }
    if (window.combatVisuals) {
      window.combatVisuals.triggerScreenShake(12, 20);
    }
    let p = window.player;
    if (p && window.RenderEngine && window.RenderEngine.spawnDeathParticles) {
      window.RenderEngine.spawnDeathParticles(p.x, p.y, "player");
    }
  };

  // --- PHYSICS & LOGIC UPDATE ---
  function update() {
    window.logicClock = (window.logicClock || 0) + 1;
    if (
      window.logicClock % 60 === 0 &&
      typeof window.checkAchievements === "function"
    ) {
      window.checkAchievements();
    }

    // --- DUNGEON MERCHANT PROXIMITY CHECK ---
    let pObj = window.player;
    let mapInstObj = window.activeDungeonMap;
    let closestShopItem = null;
    let closestShopDist = Infinity;
    let closestItemIdx = -1;

    if (
      window.currentGameState === window.GAME_STATES.DUNGEON &&
      mapInstObj &&
      mapInstObj.merchantTile &&
      mapInstObj.merchantStock &&
      mapInstObj.merchantStock.length > 0
    ) {
      let mcx =
        mapInstObj.merchantTile.x * mapInstObj.tileSize +
        mapInstObj.tileSize / 2;
      let mcy =
        mapInstObj.merchantTile.y * mapInstObj.tileSize +
        mapInstObj.tileSize / 2;
      let itemXOffsets = [-15, 0, 15];

      mapInstObj.merchantStock.forEach((item, idx) => {
        if (item.purchased) return;
        let itemX = mcx + itemXOffsets[idx];
        let itemY = mcy + 4;
        let ware = mapInstObj.merchantWares && mapInstObj.merchantWares[idx];
        if (ware) {
          itemX = ware.x * mapInstObj.tileSize + mapInstObj.tileSize / 2;
          itemY = ware.y * mapInstObj.tileSize + mapInstObj.tileSize / 2;
        }
        let dist = Math.hypot(pObj.x - itemX, pObj.y - itemY);

        if (dist <= 20 && dist < closestShopDist) {
          // 20px interaction radius feels ideal on independent tiles
          closestShopDist = dist;
          closestShopItem = item;
          closestItemIdx = idx;
        }
      });
    }

    if (closestShopItem) {
      if (window.activeDungeonMerchantItem !== closestShopItem) {
        window.activeDungeonMerchantItem = closestShopItem;

        let mcx =
          mapInstObj.merchantTile.x * mapInstObj.tileSize +
          mapInstObj.tileSize / 2;
        let mcy =
          mapInstObj.merchantTile.y * mapInstObj.tileSize +
          mapInstObj.tileSize / 2;
        let itemXOffsets = [-15, 0, 15];
        let itemX = mcx + itemXOffsets[closestItemIdx];
        let itemY = mcy + 4;
        let ware =
          mapInstObj.merchantWares && mapInstObj.merchantWares[closestItemIdx];
        if (ware) {
          itemX = ware.x * mapInstObj.tileSize + mapInstObj.tileSize / 2;
          itemY = ware.y * mapInstObj.tileSize + mapInstObj.tileSize / 2;
        }

        let cam = window.DungeonCamera;
        let zoom = cam ? cam.zoom : 1.6;
        let screenX = (itemX - cam.x) * zoom;
        let screenY = (itemY - cam.y) * zoom;

        let mockEvent = {
          clientX: screenX,
          clientY: screenY,
        };

        window.showItemTooltip(mockEvent, closestShopItem);
      }
    } else {
      if (window.activeDungeonMerchantItem) {
        window.activeDungeonMerchantItem = null;
        window.hideTooltip(true);
      }
    }

    // Tick active chest animations
    let currentMap = window.activeDungeonMap;
    if (currentMap && currentMap.chestAnimations) {
      for (let key in currentMap.chestAnimations) {
        let anim = currentMap.chestAnimations[key];
        if (anim.state === "opening" && anim.progress < 1.0) {
          let nextProgress = Math.min(1.0, anim.progress + 0.025);

          // Trigger loot at exactly 0.3 (30%) progress when the lid cracks open
          if (anim.progress < 0.3 && nextProgress >= 0.3) {
            let coords = key.split(",");
            let tx = parseInt(coords[0], 10);
            let ty = parseInt(coords[1], 10);
            if (typeof window.dispenseChestLootAt === "function") {
              window.dispenseChestLootAt(tx, ty);
            }
          }

          anim.progress = nextProgress;
        }
      }
    }

    // Live UI updates for active open shop modal
    if (Date.now() - (window.lastShopTimerUpdate || 0) >= 1000) {
      window.lastShopTimerUpdate = Date.now();
      let shopModal = document.getElementById("shop-modal");
      if (
        shopModal &&
        shopModal.style.display !== "none" &&
        shopModal.style.display !== ""
      ) {
        if (window.activeShopTab === "gear") {
          window.renderMarketShop();
        }
      }
    }

    if (window.isAnyMenuOpen()) return;

    if (window.deathAnimationTimer > 0) {
      window.deathAnimationTimer--;
      if (window.combatVisuals) window.combatVisuals.update();
      if (window.deathAnimationTimer === 0) {
        window.triggerExtraction(false, false);
      }
      return;
    }

    if (window.combatVisuals) {
      window.combatVisuals.update();
    }

    let p = window.player;
    if (p.lastDamageTimer && p.lastDamageTimer > 0) {
      p.lastDamageTimer--;
    }
    if (window.playerStats && window.playerStats.flaskCooldownTimer > 0) {
      window.playerStats.flaskCooldownTimer--;
    }
    if (p.snareTimer && p.snareTimer > 0) {
      p.snareTimer--;
      p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.4);
    }
    p.inDilationField = false; // Reset on every frame

    let map = window.activeDungeonMap;
    if (!map || !map.grid) return;
    let tileSize = map.tileSize;

    let mode = window.playerStats
      ? window.playerStats.controlMode || "joystick"
      : "joystick";
    let vx = 0;
    let vy = 0;

    // Consume and reset speed multiplier
    let speedMult = p.speedMultiplier || 1.0;
    p.speedMultiplier = 1.0;

    if (mode === "joystick") {
      if (window.joystick.active) {
        let joy = window.joystick;
        vx = joy.vx * speedMult;
        vy = joy.vy * speedMult;
      } else {
        vx = 0;
        vy = 0;
      }
      // Keep target coordinates synced with the player's position while in joystick mode
      p.targetX = p.x;
      p.targetY = p.y;
    } else {
      // Cursor pathfinding logic
      if (isPointerHolding && window.cursorPointer) {
        let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
        let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
        let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
        p.targetX = window.cursorPointer.screenX / zoom + camX;
        p.targetY = window.cursorPointer.screenY / zoom + camY;
      }

      let dx = p.targetX - p.x;
      let dy = p.targetY - p.y;
      let dist = Math.hypot(dx, dy);

      if (dist > 2) {
        let moveStep = Math.min(p.speed * speedMult, dist);
        vx = (dx / dist) * moveStep;
        vy = (dy / dist) * moveStep;
      }
    }

    if (vx !== 0 || vy !== 0) {
      if (vx < -0.1) p.facing = -1;
      else if (vx > 0.1) p.facing = 1;

      let pRadius = p.radius || 9;

      let moved = false;
      if (vx !== 0) {
        let nextX = p.x + vx;
        if (!checkCollisionAt(map, nextX, p.y, pRadius)) {
          p.x = nextX;
          moved = true;
        }
      }

      if (vy !== 0) {
        let nextY = p.y + vy;
        if (!checkCollisionAt(map, p.x, nextY, pRadius)) {
          p.y = nextY;
          moved = true;
        }
      }

      p.isMoving = moved;
      if (!moved) {
        p.targetX = p.x;
        p.targetY = p.y;
      }
    } else {
      p.isMoving = false;
    }

    // Apply Control Glitch Inversion (Nexus Overseer)
    if (p.glitchTimer && p.glitchTimer > 0) {
      p.glitchTimer--;
      vx = -vx;
      vy = -vy;
      p.targetX = p.x + vx;
      p.targetY = p.y + vy;

      // Spawn glitch digital noise occasionally on player
      if (
        p.glitchTimer % 12 === 0 &&
        window.combatVisuals &&
        window.combatVisuals.particlePool
      ) {
        window.combatVisuals.particlePool.get(
          p.x + window.randFloat(-6, 6),
          p.y - 8 + window.randFloat(-8, 8),
          0,
          -0.2,
          window.randFloat(1.2, 2.5),
          "#ff007f",
          0.9,
          15,
          0,
          true,
          0,
        );
      }
    }

    if (p.isMoving) {
      p.walkTimer = (p.walkTimer || 0) + 0.18;
    } else {
      p.walkTimer = 0;
    }

    // Active Level-Up Aura Emitter tracking player position (Subphase C.4)
    if (p.levelUpTimer && p.levelUpTimer > 0) {
      p.levelUpTimer--;

      const colors = ["#ffffff", "#ffd700", "#f1c40f", "#00d2ff", "#e84393"];
      if (window.ParticlePool) {
        for (let i = 0; i < 3; i++) {
          let spreadX = (Math.random() - 0.5) * 28;
          let startY = p.y - 8 + window.randFloat(5, 20);
          let upwardVel = -window.randFloat(3.5, 7.5);
          let sideVel = (Math.random() - 0.5) * 1.6;
          let particleLife = window.randInt(35, 60);

          let pt = window.ParticlePool.get(
            p.x + spreadX,
            startY,
            sideVel,
            upwardVel,
            window.randFloat(2.5, 4.5),
            colors[Math.floor(Math.random() * colors.length)],
            1.0,
            particleLife,
            particleLife,
            -0.05, // low upward floating gravity
            true,
          );

          // Distribute styles randomly for rich variety
          if (Math.random() < 0.4) {
            pt.style = "sparkle_star";
            pt.spinSpeed = window.randFloat(-0.06, 0.06);
          } else {
            pt.style = "glowing_orb";
          }
          pt.scaleDecay = 0.015;

          window.particles.push(pt);
        }
      }

      if (p.levelUpTimer % 22 === 0 && window.combatVisuals) {
        window.combatVisuals.spawnParticles(
          p.x,
          p.y - 8,
          12,
          "gold_dungeon",
          3,
        );
      }
    }

    if (map && typeof map.revealSightRadius === "function") {
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      map.revealSightRadius(p.x, p.y, pStats.int || 0);
    }

    // Execute Top-Down Combat & Gold / XP Magnet Mechanics
    window.updateCavernEffects();
    window.updateHeroBuffParticles();
    window.updateDungeonCombat();
    window.updateGoldParticles();
    window.updateHeartOrbs();
    window.updateXpOrbs();
    window.updateGroundLoot();
    window.updateGroundMaterials();
    window.updateSpellAnimations();

    // Real-Time Camera & Line-Of-Sight Viewport Tracker
    let cam = window.DungeonCamera;
    if (cam && canvas && map && map.grid) {
      cam.viewportW = canvas.width;
      cam.viewportH = canvas.height;
      cam.update(p.x, p.y, map.width * tileSize, map.height * tileSize);
    }

    let zoom = cam ? cam.zoom : 1.0;
    let viewW = (canvas ? canvas.width : 750) / zoom;
    let viewH = (canvas ? canvas.height : 320) / zoom;
    let minX = cam ? cam.x : 0;
    let maxX = minX + viewW;
    let minY = cam ? cam.y : 0;
    let maxY = minY + viewH;

    // Discover portal ONLY when its specific tile has been explored AND enters camera view
    if (map && map.extractionTile && map.exploredGrid) {
      let pTileX = map.extractionTile.x;
      let pTileY = map.extractionTile.y;
      if (map.exploredGrid[pTileY] && map.exploredGrid[pTileY][pTileX]) {
        let portalPx = pTileX * tileSize + tileSize / 2;
        let portalPy = pTileY * tileSize + tileSize / 2;
        if (
          portalPx >= minX &&
          portalPx <= maxX &&
          portalPy >= minY &&
          portalPy <= maxY
        ) {
          map.portalDiscovered = true;
        }
      }
    }

    // Discover mobs instantly when entering camera viewport
    if (window.activeDungeonMobs) {
      window.activeDungeonMobs.forEach((m) => {
        let mCx = m.x + (m.w || 24) / 2;
        let mCy = m.y + (m.h || 24) / 2;
        if (mCx >= minX && mCx <= maxX && mCy >= minY && mCy <= maxY) {
          m.discovered = true;
        }
      });
    }

    if (window.mob) {
      let bm = window.mob;
      let bCx = bm.x + (bm.w || 48) / 2;
      let bCy = bm.y + (bm.h || 48) / 2;
      if (bCx >= minX && bCx <= maxX && bCy >= minY && bCy <= maxY) {
        bm.discovered = true;
      }
    }

    // Tile Triggers & Proximity Checks
    let currentTileX = Math.floor(p.x / tileSize);
    let currentTileY = Math.floor(p.y / tileSize);

    window.activeStationPrompt = null;

    if (window.currentGameState === window.GAME_STATES.HUB) {
      // Check Proximity to Hub Stations
      if (map.stations) {
        map.stations.forEach((st) => {
          let stPx = st.x * tileSize + tileSize / 2;
          let stPy = st.y * tileSize + tileSize / 2;
          if (Math.hypot(p.x - stPx, p.y - stPy) < tileSize * 1.5) {
            window.activeStationPrompt = st;
          }
        });
      }
    } else {
      // Check Dungeon Tile Triggers
      if (
        currentTileY >= 0 &&
        currentTileY < map.height &&
        currentTileX >= 0 &&
        currentTileX < map.width
      ) {
        let tile = map.grid[currentTileY][currentTileX];

        if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
          map.grid[currentTileY][currentTileX] = window.TILE_TYPES.FLOOR;
          window.executePortalDescend();
        } else if (
          tile === window.TILE_TYPES.EXTRACTION_ZONE ||
          tile === window.TILE_TYPES.BOSS_GATE
        ) {
          window.openPortalChoiceModal();
        }

        if (tile === window.TILE_TYPES.RECOVERY_CHEST) {
          if (!window.isChestOpened(currentTileX, currentTileY)) {
            let key = `${currentTileX},${currentTileY}`;
            let map = window.activeDungeonMap;
            if (map && map.chestAnimations) {
              if (!map.chestAnimations[key]) {
                map.chestAnimations[key] = { progress: 0.0, state: "opening" };
                if (
                  window.SoundManager &&
                  typeof window.SoundManager.playChestOpen === "function"
                ) {
                  window.SoundManager.playChestOpen("iron_bound");
                }
              }
            }
          }
        }

        if (tile === window.TILE_TYPES.CHEST_SPAWN) {
          if (!window.isChestOpened(currentTileX, currentTileY)) {
            let key = `${currentTileX},${currentTileY}`;
            let map = window.activeDungeonMap;
            if (map && map.chestAnimations) {
              if (!map.chestAnimations[key]) {
                map.chestAnimations[key] = { progress: 0.0, state: "opening" };
                if (
                  window.SoundManager &&
                  typeof window.SoundManager.playChestOpen === "function"
                ) {
                  let tier =
                    window.getChestTierAt(currentTileX, currentTileY) ||
                    "iron_bound";
                  window.SoundManager.playChestOpen(tier);
                }
              }
            }
          }
        }
      }
    }

    // Update Particles Lifecycle (Subphase A.1 Index-Swapping Deletion & Subphase A.2 Core Physics)
    if (window.particles) {
      for (let i = window.particles.length - 1; i >= 0; i--) {
        let pt = window.particles[i];
        pt.life--;

        // Apply drag (friction) if active
        if (pt.drag !== undefined && pt.drag !== 1.0) {
          pt.vx *= pt.drag;
          pt.vy *= pt.drag;
        }

        pt.x += pt.vx;
        pt.y += pt.vy;

        if (pt.gravity) {
          pt.vy += pt.gravity;
        }

        // Apply angular spin if active
        if (pt.spinSpeed) {
          pt.angle = (pt.angle || 0) + pt.spinSpeed;
        }

        // Apply dynamic scale decay if active
        if (pt.scaleDecay) {
          pt.scale = Math.max(0, (pt.scale || 1.0) - pt.scaleDecay);
        }

        // Apply gorgeous non-linear organic alpha decay
        if (pt.fade) {
          let ratio = Math.max(0, Math.min(1, pt.life / pt.maxLife));
          pt.alpha = Math.max(0, Math.pow(ratio, 1.8));
        }

        // O(1) Index-Swapping Recycle upon death (Zero GC pressure)
        if (pt.life <= 0 || (pt.scaleDecay && pt.scale <= 0)) {
          if (window.ParticlePool) window.ParticlePool.recycle(pt);

          let lastActiveIdx = window.particles.length - 1;
          if (i !== lastActiveIdx) {
            window.particles[i] = window.particles[lastActiveIdx];
          }
          window.particles.pop(); // Decrements array length with zero allocation/GC pressure
        }
      }
    }

    // Update Floating Text Timers
    for (let i = window.floatingTexts.length - 1; i >= 0; i--) {
      let ft = window.floatingTexts[i];
      ft.life--;
      ft.y -= 0.4;
      if (ft.offsetY !== undefined) ft.offsetY -= 0.4;
      if (ft.life <= 0) window.floatingTexts.splice(i, 1);
    }
  }

  window.spawnCalamitySpecter = function () {
    if (window.calamitySpecterActive) return;
    window.calamitySpecterActive = true;

    let p = window.player;
    let angle = Math.random() * Math.PI * 2;
    let spawnDist = 320;
    let sx = p.x + Math.cos(angle) * spawnDist;
    let sy = p.y + Math.sin(angle) * spawnDist;

    window.activeDungeonMobs = window.activeDungeonMobs || [];
    window.activeDungeonMobs.push({
      id: window.idCounter++,
      type: "mob",
      visualTier: 5,
      visualType: "calamity_specter",
      x: sx - 16,
      y: sy - 16,
      w: 32,
      h: 32,
      hp: BigNum.from("9.99e300"), // Absolutely immortal
      maxHp: BigNum.from("9.99e300"),
      atk: 999999999,
      flashTimer: 0,
      isSpecter: true,
      discovered: true,
      hopTimer: 0,
      speedMultiplier: 1.0,
    });

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "☠ THE CALAMITY SPECTER HAS AWAKENED! ESCAPE!",
        "#ef4444",
      );
    }
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }
  };

  window.spawnHomingXp = function (worldX, worldY, amount) {
    let particleCount = window.randInt(3, 6);
    let totalAmt = BigNum.from(amount || 10);
    let share = totalAmt.div(particleCount);

    for (let i = 0; i < particleCount; i++) {
      let angle = window.randFloat(-Math.PI * 0.85, -Math.PI * 0.15);
      let speed = window.randFloat(3.5, 6.5);
      window.xpOrbs.push({
        worldX: worldX,
        worldY: worldY,
        screenX: 0,
        screenY: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        value: share,
        scatterTimer: window.randInt(14, 20),
        gravity: 0.35,
        speed: 4.0,
        isHomingScreenSpace: false,
      });
    }
  };

  window.updateXpOrbs = function () {
    if (!window.xpOrbs) return;

    let targetScreenX = 120;
    let targetScreenY = 25;
    let xpBarFill = document.getElementById("xp-bar-fill");
    if (xpBarFill) {
      let rect = xpBarFill.getBoundingClientRect();
      let canvasEl = window.canvas || document.getElementById("gameCanvas");
      if (canvasEl) {
        let canvasRect = canvasEl.getBoundingClientRect();
        targetScreenX = rect.left - canvasRect.left + rect.width / 2;
        targetScreenY = rect.top - canvasRect.top + rect.height / 2;
      }
    }

    for (let i = window.xpOrbs.length - 1; i >= 0; i--) {
      let orb = window.xpOrbs[i];

      if (orb.scatterTimer > 0) {
        orb.scatterTimer--;
        orb.worldX += orb.vx;
        orb.worldY += orb.vy;
        orb.vy += orb.gravity;
        orb.vx *= 0.92;

        if (orb.scatterTimer === 0) {
          orb.isHomingScreenSpace = true;
          let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
          let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
          let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
          orb.screenX = (orb.worldX - camX) * zoom;
          orb.screenY = (orb.worldY - camY) * zoom;
        }
      } else {
        let dx = targetScreenX - orb.screenX;
        let dy = targetScreenY - orb.screenY;
        let dist = Math.hypot(dx, dy);

        if (dist < 14) {
          if (typeof window.gainXp === "function") {
            window.gainXp(orb.value);
          }
          if (window.playerStats && window.playerStats.runXp !== undefined) {
            window.playerStats.runXp += BigNum.from(orb.value).valueOf();
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("fairy");
          }

          if (xpBarFill) {
            xpBarFill.classList.remove("xp-impact");
            void xpBarFill.offsetWidth;
            xpBarFill.classList.add("xp-impact");
          }

          window.xpOrbs.splice(i, 1);
        } else {
          orb.speed = Math.min(14, orb.speed + 0.5);
          orb.screenX += (dx / dist) * orb.speed;
          orb.screenY += (dy / dist) * orb.speed;
        }
      }
    }
  };

  window.addDungeonRunScrap = function (name, qty, x, y) {
    if (!name || qty <= 0) return;

    // DIRECT TO VAULT SAFETY RULE: Luminous Souls and Gachapon Keys go straight to permanent inventory
    if (name === "Luminous Soul" || name.includes("Key")) {
      window.addEtcDrop(name, qty, false);
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("fairy");
      }
      return;
    }

    // Spawn as physical ground material entity if coordinates are provided
    if (x !== undefined && y !== undefined) {
      window.spawnGroundMaterial(name, qty, x, y);
    } else {
      if (!window.player.pendingScraps) window.player.pendingScraps = {};
      window.player.pendingScraps[name] =
        (window.player.pendingScraps[name] || 0) + qty;
      if (typeof window.pushMaterialToast === "function") {
        window.pushMaterialToast(name, qty);
      }
    }
  };

  window.spawnGroundMaterial = function (name, qty, x, y) {
    if (!name || qty <= 0) return;
    if (!window.groundMaterials) window.groundMaterials = [];

    const matColors = {
      "Monster Soul": "#a0aec0",
      "Rare Scrap": "#3498db",
      "Magic Scrap": "#9b59b6",
      "Epic Scrap": "#e67e22",
      "Legendary Scrap": "#f1c40f",
      "Mythic Scrap": "#e74c3c",
      "Eridium Shard": "#8e44ad",
      "Ancient Core": "#e74c3c",
      "Overlord's Sigil": "#1abc9c",
      "Astral Essence": "#9b59b6",
      "Catalyst Core": "#2ecc71",
    };

    let angle = Math.random() * Math.PI * 2;
    let speed = window.randFloat(1.0, 2.8);
    let color = matColors[name] || "#00d2ff";

    window.groundMaterials.push({
      id: window.idCounter++,
      name: name,
      qty: qty,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      z: 0,
      vz: -3.2,
      color: color,
      magnetSpeed: 1.0,
      settled: false,
    });
  };

  window.updateGroundMaterials = function () {
    if (!window.groundMaterials || window.groundMaterials.length === 0) return;
    let p = window.player;
    if (!p) return;

    for (let i = window.groundMaterials.length - 1; i >= 0; i--) {
      let gm = window.groundMaterials[i];

      if (!gm.settled) {
        gm.x += gm.vx;
        gm.y += gm.vy;
        gm.vx *= 0.88;
        gm.vy *= 0.88;

        gm.z += gm.vz;
        gm.vz += 0.4;

        if (gm.z >= 0) {
          gm.z = 0;
          gm.vz = 0;
          gm.vx = 0;
          gm.vy = 0;
          gm.settled = true;
        }
      }

      if (gm.settled || gm.z === 0) {
        let dx = p.x - gm.x;
        let dy = p.y - 8 - gm.y;
        let dist = Math.hypot(dx, dy);

        if (dist <= 38) {
          gm.magnetSpeed = Math.min(14, gm.magnetSpeed + 0.85);
          gm.x += (dx / dist) * gm.magnetSpeed;
          gm.y += (dy / dist) * gm.magnetSpeed;

          if (dist <= 12) {
            if (!p.pendingScraps) p.pendingScraps = {};
            p.pendingScraps[gm.name] = (p.pendingScraps[gm.name] || 0) + gm.qty;

            if (typeof window.pushMaterialToast === "function") {
              window.pushMaterialToast(gm.name, gm.qty);
            }
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("swing");
            }

            window.groundMaterials.splice(i, 1);
          }
        }
      }
    }
  };

  window.addEtcDrop = function (name, qty, silent = false) {
    if (!window.inventory)
      window.inventory = {
        EQUIP: [],
        ARTIFACT: [],
        SIGIL: [],
        ETC: {},
        USE: {},
      };
    if (!window.inventory.ETC) window.inventory.ETC = {};
    window.inventory.ETC[name] = (window.inventory.ETC[name] || 0) + qty;
    if (!silent && typeof window.pushMaterialToast === "function") {
      window.pushMaterialToast(name, qty);
    }
  };

  window.addUseDrop = function (name, qty, silent = false) {
    if (!window.inventory)
      window.inventory = {
        EQUIP: [],
        ARTIFACT: [],
        SIGIL: [],
        ETC: {},
        USE: {},
      };
    if (!window.inventory.USE) window.inventory.USE = {};
    window.inventory.USE[name] = (window.inventory.USE[name] || 0) + qty;
    if (!silent && typeof window.pushMaterialToast === "function") {
      window.pushMaterialToast(name, qty);
    }
  };

  window.useConsumableItem = function (name) {
    if (
      !window.inventory.USE ||
      !window.inventory.USE[name] ||
      window.inventory.USE[name] <= 0
    ) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("None remaining!", "#e74c3c");
      return;
    }

    let isSpared =
      window.checkArtifactTrait &&
      window.checkArtifactTrait("philosopher_catalyst") &&
      Math.random() < 0.12;
    if (isSpared) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Philosopher's Catalyst preserved elixir!",
          "#2ecc71",
        );
      }
    } else {
      window.inventory.USE[name]--;
      if (window.inventory.USE[name] <= 0) delete window.inventory.USE[name];
    }

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      if (name.includes("Elixir") || name.includes("Potion")) {
        try {
          window.SoundManager.play("potion");
        } catch (e) {
          window.SoundManager.play("fairy");
        }
      } else if (name.includes("Scroll")) {
        window.SoundManager.play("spell");
      } else if (name.includes("Sack") || name.includes("Crate")) {
        window.SoundManager.play("revive");
      }
    }

    let p = window.playerStats;
    let runsGranted = name.includes("Supernal")
      ? 3
      : name.includes("Greater")
        ? 2
        : 1;

    if (name.includes("Attack Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.atkPotionRuns = (p.atkPotionRuns || 0) + runsGranted;
      p.atkPotionStrength = str;
      p.atkPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Atk for ${p.atkPotionRuns} Run(s))`,
        "#2ecc71",
      );
    } else if (name.includes("Vitality Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.hpPotionRuns = (p.hpPotionRuns || 0) + runsGranted;
      p.hpPotionStrength = str;
      p.hpPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Max HP for ${p.hpPotionRuns} Run(s))`,
        "#e74c3c",
      );
    } else if (name.includes("Armored Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.defPotionRuns = (p.defPotionRuns || 0) + runsGranted;
      p.defPotionStrength = str;
      p.defPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Def for ${p.defPotionRuns} Run(s))`,
        "#3498db",
      );
    } else if (name.includes("Haste Elixir")) {
      let str = name.includes("Supernal")
        ? 3
        : name.includes("Greater")
          ? 2
          : 1;
      p.hastePotionRuns = (p.hastePotionRuns || 0) + runsGranted;
      p.hastePotionStrength = str;
      p.hastePotionTimer = 0;
      window.pushHeaderToast(
        `Consumed ${name}! (+Speed for ${p.hastePotionRuns} Run(s))`,
        "#f1c40f",
      );
    } else if (name.includes("Double XP Elixir")) {
      p.xpPotionRuns = (p.xpPotionRuns || 0) + runsGranted;
      p.xpPotionStrength = 1.0;
      p.xpPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed Double XP Elixir! (+100% XP for ${p.xpPotionRuns} Run(s))`,
        "#a855f7",
      );
    } else if (name.includes("Double Drop Elixir")) {
      p.dropPotionRuns = (p.dropPotionRuns || 0) + runsGranted;
      p.dropPotionStrength = 1.0;
      p.dropPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed Double Drop Elixir! (+100% Drop Rate for ${p.dropPotionRuns} Run(s))`,
        "#22c55e",
      );
    } else if (name.includes("Drop Quality Elixir")) {
      p.qlyPotionRuns = (p.qlyPotionRuns || 0) + runsGranted;
      p.qlyPotionStrength = 0.5;
      p.qlyPotionTimer = 0;
      window.pushHeaderToast(
        `Consumed Drop Quality Elixir! (+50% Drop Quality for ${p.qlyPotionRuns} Run(s))`,
        "#3b82f6",
      );
    } else if (name.includes("SP Reset Scroll")) {
      let totalSpent =
        (p.spAllocations.spStr || 0) +
        (p.spAllocations.spDex || 0) +
        (p.spAllocations.spInt || 0);
      p.sp += totalSpent;
      p.spAllocations = { spStr: 0, spDex: 0, spInt: 0 };
      if (typeof window.resetDraftSP === "function") window.resetDraftSP();
      window.pushHeaderToast("SP Allocations Reset & Refunded!", "#9b59b6");
    } else if (name.includes("Cavern Sigil Sack")) {
      if (typeof window.openCavernSigilSackAnimation === "function") {
        let stageScale =
          Math.floor(((p.lifetimePeakStage || p.stage || 1) - 1) / 5) + 1;
        let rolledRarity = window.rollItemRarity(
          stageScale * 5,
          p.baseQuality || 1.0,
          false,
        );
        let sigilItem = window.createItemObject(
          "sigil",
          rolledRarity,
          stageScale,
          0,
        );
        if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
        window.inventory.SIGIL.push(sigilItem);
        window.openCavernSigilSackAnimation(sigilItem);
      }
    } else if (name === "Astral Singularity Cache") {
      let peakRunStage = p.lifetimePeakStage || p.stage || 1;
      let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
      let newItem = null;
      let types = ["weapon", "subweapon", "helmet", "chest", "boots"];

      // Roll until a unique is found
      for (let attempt = 0; attempt < 2000; attempt++) {
        let chosenType = types[Math.floor(Math.random() * types.length)];
        let tempItem = window.createItemObject(chosenType, 5, stageScale, 0);
        if (window.isItemUnique(tempItem)) {
          newItem = tempItem;
          break;
        }
      }

      // Safety Fallback (Forces unique properties if RNG fails)
      if (!newItem) {
        newItem = window.createItemObject("weapon", 5, stageScale, 0);
        newItem.isUniqueSword = true;
        newItem.noun = "Sanguine Reaver";
        newItem.name = `Crimson Sanguine Reaver (Lv. ${stageScale})`;
        newItem.desc =
          "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
        window.recalculateItemStats(newItem);
      }

      if (window.currentGameState === window.GAME_STATES.HUB) {
        if (!window.inventory.EQUIP) window.inventory.EQUIP = [];
        window.inventory.EQUIP.push(newItem);
      } else {
        if (!window.player.bag) window.player.bag = [];
        window.player.bag.push(newItem);
      }
      window.pushHeaderToast(
        `Opened ${name}! Found: ${newItem.name}`,
        "#a855f7",
      );
      if (typeof window.pushToast === "function") window.pushToast(newItem);
    } else if (name === "Astral Artifact Cache") {
      let peakRunStage = p.lifetimePeakStage || p.stage || 1;
      let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
      let newItem = window.createItemObject("artifact", 3, stageScale, 0);

      let coresGained = window.randInt(2, 4);
      window.addEtcDrop("Catalyst Core", coresGained, false);

      if (window.currentGameState === window.GAME_STATES.HUB) {
        if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
        window.inventory.ARTIFACT.push(newItem);
      } else {
        if (!window.player.bag) window.player.bag = [];
        window.player.bag.push(newItem);
      }
      window.pushHeaderToast(
        `Opened ${name}! Found: ${newItem.name} and +${coresGained} Catalyst Cores`,
        "#1abc9c",
      );
      if (typeof window.pushToast === "function") window.pushToast(newItem);
    } else if (name.includes("Sack") || name.includes("Crate")) {
      let peakRunStage = p.lifetimePeakStage || p.stage || 1;
      let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
      let rolledRarity = window.rollItemRarity(
        peakRunStage,
        p.baseQuality || 1.0,
        false,
      );
      let types = ["weapon", "subweapon", "helmet", "chest", "boots", "ring"];
      let chosenType = types[Math.floor(Math.random() * types.length)];
      let newItem = window.createItemObject(
        chosenType,
        rolledRarity,
        stageScale,
        0,
      );

      if (window.currentGameState === window.GAME_STATES.HUB) {
        if (!window.inventory.EQUIP) window.inventory.EQUIP = [];
        window.inventory.EQUIP.push(newItem);
      } else {
        if (!window.player.bag) window.player.bag = [];
        window.player.bag.push(newItem);
      }
      window.pushHeaderToast(
        `Opened ${name}! Found: ${newItem.name}`,
        "#f1c40f",
      );
      if (typeof window.pushToast === "function") window.pushToast(newItem);
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderProfileModal === "function")
      window.renderProfileModal();
    let bagModal = document.getElementById("bag-modal");
    if (bagModal && bagModal.style.display !== "none") window.toggleLootBag();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.spawnGroundLoot = function (item, x, y) {
    if (!item) return;
    if (!window.groundLoot) window.groundLoot = [];

    let angle = Math.random() * Math.PI * 2;
    let speed = window.randFloat(1.2, 3.2);
    let color = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#ffffff";

    window.groundLoot.push({
      id: item.id || window.idCounter++,
      item: item,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      z: 0,
      vz: -3.8,
      color: color,
      magnetSpeed: 1.0,
      settled: false,
    });
  };

  window.updateGroundLoot = function () {
    if (!window.groundLoot || window.groundLoot.length === 0) return;
    let p = window.player;
    if (!p) return;

    for (let i = window.groundLoot.length - 1; i >= 0; i--) {
      let gl = window.groundLoot[i];

      // Physical Pop Animation Arc
      if (!gl.settled) {
        gl.x += gl.vx;
        gl.y += gl.vy;
        gl.vx *= 0.88;
        gl.vy *= 0.88;

        gl.z += gl.vz;
        gl.vz += 0.45; // Gravity acceleration

        if (gl.z >= 0) {
          gl.z = 0;
          gl.vz = 0;
          gl.vx = 0;
          gl.vy = 0;
          gl.settled = true;
        }
      }

      // Pickup Magnetism & Collection
      if (gl.settled || gl.z === 0) {
        let dx = p.x - gl.x;
        let dy = p.y - 8 - gl.y;
        let dist = Math.hypot(dx, dy);

        if (dist <= 38) {
          gl.magnetSpeed = Math.min(14, gl.magnetSpeed + 0.85);
          gl.x += (dx / dist) * gl.magnetSpeed;
          gl.y += (dy / dist) * gl.magnetSpeed;

          if (dist <= 12) {
            let isEquipped = window.tryAutoEquip
              ? window.tryAutoEquip(gl.item)
              : false;
            if (!isEquipped) {
              if (!p.bag) p.bag = [];
              p.bag.push(gl.item);
            }

            if (
              window.SoundManager &&
              typeof window.SoundManager.playLootDrop === "function"
            ) {
              window.SoundManager.playLootDrop(gl.item.statsRolled);
            }
            if (typeof window.pushToast === "function") {
              window.pushToast(gl.item);
            }
            if (typeof window.updateHUD === "function") {
              window.updateHUD();
            }

            window.groundLoot.splice(i, 1);
          }
        }
      }
    }
  };

  window.addGoldFloatingText = function (p, amount) {
    let existing = window.floatingTexts.find(
      (ft) => ft.isGoldBatch && ft.life > 0,
    );
    if (existing) {
      existing.goldTotal = BigNum.from(existing.goldTotal || 0).add(amount);
      existing.text = `+${window.formatNumber(existing.goldTotal)} Gold`;
      existing.life = 55;
    } else {
      let bAmt = BigNum.from(amount);
      window.floatingTexts.push({
        x: p.x,
        y: p.y - 15,
        offsetX: 0,
        offsetY: -15,
        goldTotal: bAmt,
        text: `+${window.formatNumber(bAmt)} Gold`,
        color: "#ffd700",
        life: 55,
        maxLife: 55,
        followPlayer: true,
        isGoldBatch: true,
      });
    }
  };

  window.triggerGravitationalVacuum = function (p) {
    if (!p) return;
    if (window.groundLoot) {
      window.groundLoot.forEach((gl) => {
        gl.settled = true;
        gl.magnetSpeed = Math.max(gl.magnetSpeed || 1.0, 10.0);
      });
    }
    if (window.groundMaterials) {
      window.groundMaterials.forEach((gm) => {
        gm.settled = true;
        gm.magnetSpeed = Math.max(gm.magnetSpeed || 1.0, 10.0);
      });
    }
    if (window.goldParticles) {
      window.goldParticles.forEach((gp) => {
        gp.scatterTimer = 0;
        gp.speed = Math.max(gp.speed || 5.0, 12.0);
      });
    }
  };

  window.spawnHomingGold = function (x, y, amount) {
    if (window.goldParticles.length > 40) return;
    let particleCount = window.randInt(4, 7);
    let totalAmt = BigNum.from(amount);
    let share = totalAmt.div(particleCount);

    for (let i = 0; i < particleCount; i++) {
      window.goldParticles.push({
        x: x,
        y: y,
        vx: window.randFloat(-3.5, 3.5),
        vy: window.randFloat(-6, -3),
        value: share,
        scatterTimer: window.randInt(14, 20),
        gravity: 0.35,
        speed: 5.0,
      });
    }
  };

  window.updateGoldParticles = function () {
    let p = window.player;
    if (!window.goldParticles) return;

    for (let i = window.goldParticles.length - 1; i >= 0; i--) {
      let gp = window.goldParticles[i];
      if (gp.scatterTimer > 0) {
        gp.scatterTimer--;
        gp.x += gp.vx;
        gp.y += gp.vy;
        gp.vy += gp.gravity || 0.35;
        gp.vx *= 0.92;
      } else {
        let targetX = p.x;
        let targetY = p.y - 8;
        let dx = targetX - gp.x;
        let dy = targetY - gp.y;
        let dist = Math.hypot(dx, dy);

        if (dist < 14) {
          window.absorbGoldParticle(gp.value, true, false);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }
          window.addGoldFloatingText(p, gp.value);
          window.goldParticles.splice(i, 1);
        } else {
          gp.speed = Math.min(12, gp.speed + 0.4);
          gp.x += (dx / dist) * gp.speed;
          gp.y += (dy / dist) * gp.speed;
        }
      }
    }
  };

  window.updateHeroBuffParticles = function () {
    let p = window.player;
    let stats = window.playerStats;
    if (!p || !stats || p.hp <= 0 || window.deathAnimationTimer > 0) return;

    let isEco = stats.ecoMode === true;
    let chance = isEco ? 0.08 : 0.28;
    if (Math.random() > chance) return;

    let getAtkCol = (s) =>
      s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71";
    let getHpCol = (s) =>
      s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c";
    let getDefCol = (s) =>
      s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db";
    let getHasteCol = (s) =>
      s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f";

    let activeColors = [];
    if ((stats.atkPotionRuns || 0) > 0)
      activeColors.push(getAtkCol(stats.atkPotionStrength || 0.1));
    if ((stats.hpPotionRuns || 0) > 0)
      activeColors.push(getHpCol(stats.hpPotionStrength || 0.1));
    if ((stats.defPotionRuns || 0) > 0)
      activeColors.push(getDefCol(stats.defPotionStrength || 0.1));
    if ((stats.hastePotionRuns || 0) > 0)
      activeColors.push(getHasteCol(stats.hastePotionStrength || 1));
    if ((stats.xpPotionRuns || 0) > 0) activeColors.push("#c084fc");
    if ((stats.dropPotionRuns || 0) > 0) activeColors.push("#34d399");
    if ((stats.qlyPotionRuns || 0) > 0) activeColors.push("#f472b6");
    if (stats.frenzyTimer > 0) activeColors.push("#f1c40f");
    if (stats.astralAwakeningTimer > 0) activeColors.push("#00d2ff");

    if (activeColors.length === 0) return;

    // Upgraded status aura particles (Subphase C.4)
    let chosenColor =
      activeColors[Math.floor(Math.random() * activeColors.length)];
    let spreadX = (Math.random() - 0.5) * 20;
    let startY = p.y + window.randFloat(-4, 12);
    let upwardVel = -window.randFloat(0.5, 1.5);
    let sideVel = (Math.random() - 0.5) * 0.8;
    let pLife = window.randInt(20, 38);

    if (window.ParticlePool) {
      let pt = window.ParticlePool.get(
        p.x + spreadX,
        startY,
        sideVel,
        upwardVel,
        window.randFloat(1.8, 3.2),
        chosenColor,
        0.85,
        pLife,
        pLife,
        -0.02,
        true,
      );

      pt.style = Math.random() < 0.25 ? "sparkle_star" : "glowing_orb";
      pt.spinSpeed =
        pt.style === "sparkle_star" ? window.randFloat(-0.04, 0.04) : 0;
      pt.scaleDecay = 0.022;

      window.particles.push(pt);
    }
  };

  window.updateCavernEffects = function () {
    if (window.currentGameState !== window.GAME_STATES.DUNGEON) {
      window.cavernInteractives = [];
      return;
    }
    // Enable interactive sigils on both standard campaign and daily runs
    if (!window.playerStats.activeDungeonSigil) {
      window.cavernInteractives = [];
      return;
    }

    window.cavernInteractives = window.cavernInteractives || [];
    let p = window.player;
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};
    let pRadius = p.radius || 9;

    // Apply continuous debuff penalties for standard hazardous structures
    let activeShards = window.cavernInteractives.filter(
      (item) => item.type === "anomalous_shard",
    );
    if (activeShards.length > 0) {
      // 2 HP/sec drain and mild speed penalty
      if (window.logicClock % 60 === 0) {
        let drain = Math.max(
          1,
          Math.round(p.maxHp * 0.02 * activeShards.length),
        );
        p.hp = Math.max(1, p.hp - drain);
        window.spawnFloatingText(
          p.x,
          p.y - 15,
          `-${drain} SHARD DRAIN`,
          "#ff007f",
        );
        if (window.SoundManager) window.SoundManager.play("hit");
      }
      p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.65);
    }

    window.cavernSpawnTimer = (window.cavernSpawnTimer || 0) - 1;
    if (window.cavernSpawnTimer <= 0) {
      window.cavernSpawnTimer = window.randInt(900, 1500); // 15-25s

      let activeIds = [];
      let sig = window.playerStats.activeDungeonSigil;
      if (sig) {
        if (sig.buffs) sig.buffs.forEach((b) => activeIds.push(b.id));
        if (sig.debuffs) sig.debuffs.forEach((d) => activeIds.push(d.id));
      }

      let targetEffects = activeIds.filter((id) =>
        [
          "perfect_strike",
          "aetheric_conduit",
          "aetheric_spark",
          "glimmering_pixie",
          "anomalous_shards",
          "void_rupture",
        ].includes(id),
      );

      if (targetEffects.length > 0) {
        let chosenId =
          targetEffects[Math.floor(Math.random() * targetEffects.length)];
        window.spawnCavernInteractive(chosenId);
      }
    }

    for (let i = window.cavernInteractives.length - 1; i >= 0; i--) {
      let item = window.cavernInteractives[i];
      item.life--;

      if (item.type === "noxious_bloom") {
        if (window.logicClock % 45 === 0) {
          let range = 40; // matches 40px radius (80px diameter)
          let applyDamage = (targetMob) => {
            let mCx = targetMob.x + (targetMob.w || 24) / 2;
            let mCy = targetMob.y + (targetMob.h || 24) / 2;
            let dist = Math.hypot(item.x - mCx, item.y - mCy);
            if (
              dist <= range &&
              targetMob.hp.gt(0) &&
              !targetMob.isFriendlyWisp
            ) {
              let tickDmg = item.tickDamage || BigNum.from(5);
              targetMob.hp = targetMob.hp.sub(tickDmg);
              targetMob.flashTimer = 5;
              targetMob.hasTakenDamage = true;

              // Apply armor/defense shred (3s duration)
              targetMob.buffTimers.def = 180;
              targetMob.buffStacks.def = -1; // negative stack shreds 15% armor

              if (window.combatVisuals) {
                window.combatVisuals.spawnDamageEffect(
                  mCx,
                  mCy,
                  tickDmg,
                  "poison",
                  false,
                  targetMob,
                );
              }
            }
          };

          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach(applyDamage);
          }
          if (window.mob) {
            applyDamage(window.mob);
          }
        }
      }

      if (item.type === "acid_pool") {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist <= pRadius + 12) {
          // caustics tick rate (every 45 frames)
          if (window.logicClock % 45 === 0) {
            let tickDmg = Math.round(p.maxHp * 0.015);
            p.hp = Math.max(1, p.hp - tickDmg);
            window.spawnFloatingText(
              p.x,
              p.y - 12,
              `-${tickDmg} ACID BURN`,
              "#2ecc71",
            );
            if (window.SoundManager) window.SoundManager.play("hit");
          }
        }
      }

      if (item.type === "dilation_field") {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist <= pRadius + 35) {
          p.inDilationField = true;
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.6); // 40% slow
        }
      }

      if (item.life <= 0) {
        // Expiration of Void Rupture Core (Failed debuff event triggers damage)
        if (item.type === "rupture_core") {
          let collapseDmg = Math.round(p.maxHp * 0.3);
          p.hp = Math.max(1, p.hp - collapseDmg);
          window.spawnFloatingText(
            p.x,
            p.y - 15,
            `-${collapseDmg} RIFT EXPLOSION`,
            "#ef4444",
          );
          if (window.combatVisuals) {
            window.combatVisuals.triggerScreenShake(12, 18);
          }
          if (window.SoundManager) window.SoundManager.play("death");
        }

        window.cavernInteractives.splice(i, 1);
        continue;
      }

      if (item.type === "glimmering_pixie") {
        item.angleSeed += 0.05;
        item.x += Math.sin(item.angleSeed) * 1.5;
        item.y += Math.cos(item.angleSeed * 0.7) * 1.0;
      }

      if (item.isTriggeredByTouch) {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist < pRadius + item.w / 2) {
          window.triggerCavernTouch(item);
          window.cavernInteractives.splice(i, 1);
          continue;
        }
      }
    }
  };

  window.spawnCavernInteractive = function (effectId) {
    window.cavernInteractives = window.cavernInteractives || [];
    let cam = window.DungeonCamera;
    if (!cam) return;

    let zoom = cam.zoom || 1.6;
    let viewW = cam.viewportW / zoom;
    let viewH = cam.viewportH / zoom;
    let pad = 40;

    let getOnScreenPos = () => {
      return {
        x: cam.x + pad + Math.random() * (viewW - pad * 2),
        y: cam.y + pad + Math.random() * (viewH - pad * 2),
      };
    };

    if (effectId === "anomalous_shards") {
      let count = window.randInt(2, 3);
      for (let i = 0; i < count; i++) {
        let pos = getOnScreenPos();
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "anomalous_shard",
          x: pos.x,
          y: pos.y,
          w: 20,
          h: 24,
          hp: 1,
          life: 900, // 15s
          maxLife: 900,
          flashTimer: 0,
        });
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Anomalous Shards erupted! Smash them to cleanse the penalty!",
          "#ef4444",
        );
      }
    } else if (effectId === "void_rupture") {
      let pos = getOnScreenPos();
      let coreId = window.idCounter++;

      window.cavernInteractives.push({
        id: coreId,
        type: "rupture_core",
        x: pos.x,
        y: pos.y,
        w: 32,
        h: 32,
        life: 480, // 8s
        maxLife: 480,
        orbsLeft: 3,
      });

      for (let i = 0; i < 3; i++) {
        let angle = (i * Math.PI * 2) / 3;
        let dist = 45;
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "rupture_orb",
          coreId: coreId,
          x: pos.x + Math.cos(angle) * dist,
          y: pos.y + Math.sin(angle) * dist,
          w: 16,
          h: 16,
          hp: 1,
          life: 480,
          maxLife: 480,
          flashTimer: 0,
        });
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Void Rupture open! Smash the 3 surrounding orbs to close it!",
          "#ef4444",
        );
      }
    } else if (effectId === "glimmering_pixie") {
      let pos = getOnScreenPos();
      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "glimmering_pixie",
        x: pos.x,
        y: pos.y,
        w: 16,
        h: 16,
        isTriggeredByTouch: true,
        life: 600, // 10s
        maxLife: 600,
        angleSeed: Math.random() * 100,
      });
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Glimmering Pixie spotted! Touch her to claim a free Elixir!",
          "#34d399",
        );
      }
    } else if (effectId === "aetheric_spark") {
      let pos = getOnScreenPos();
      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "aetheric_spark",
        x: pos.x,
        y: pos.y,
        w: 16,
        h: 16,
        isTriggeredByTouch: true,
        life: 480, // 8s
        maxLife: 480,
        step: 1,
      });
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Aetheric Spark appeared! Step on it!",
          "#34d399",
        );
      }
    } else if (effectId === "aetheric_conduit") {
      let pos1 = getOnScreenPos();
      let pos2 = getOnScreenPos();
      let conduitId = window.idCounter++;

      window.cavernInteractives.push({
        id: conduitId,
        type: "aetheric_conduit",
        x: pos1.x,
        y: pos1.y,
        w: 18,
        h: 26,
        isTriggeredByTouch: true,
        life: 720, // 12s
        maxLife: 720,
        partnerX: pos2.x,
        partnerY: pos2.y,
        isMainPylon: true,
      });

      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "aetheric_conduit",
        x: pos2.x,
        y: pos2.y,
        w: 18,
        h: 26,
        isTriggeredByTouch: true,
        life: 720,
        maxLife: 720,
        partnerX: pos1.x,
        partnerY: pos1.y,
        isMainPylon: false,
        mainPylonId: conduitId,
      });

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Aetheric Conduit line active! Touch either node to discharge!",
          "#34d399",
        );
      }
    }
  };

  window.triggerCavernTouch = function (item) {
    let p = window.player;
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    if (window.SoundManager) window.SoundManager.play("spell");
    if (window.combatVisuals) {
      window.combatVisuals.spawnParticles(
        item.x,
        item.y,
        10,
        "gold_dungeon",
        2,
      );
    }

    if (item.type === "glimmering_pixie") {
      const options = [
        "Supernal Attack Elixir",
        "Supernal Vitality Elixir",
        "Supernal Armored Elixir",
        "Supernal Haste Elixir",
      ];
      let chosen = options[Math.floor(Math.random() * options.length)];
      window.addUseDrop(chosen, 1, true);
      window.useConsumableItem(chosen);
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[✦] Caught the Pixie! Gained and active: ${chosen}!`,
          "#2ecc71",
        );
      }
    } else if (item.type === "aetheric_spark") {
      let step = item.step;
      if (step >= 5) {
        window.playerStats.astralAwakeningTimer = 900; // 15s
        window.playerStats.sparkChainCount = 0;
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "[✦] Astral Awakening triggered! +100% Damage, +15% Speed!",
            "#ffd700",
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnBeam(p.x, "#ffd700", 60, true);
        }
      } else {
        window.playerStats.sparkChainCount = step;
        let cam = window.DungeonCamera;
        let pad = 40;
        let viewW = cam.viewportW / cam.zoom;
        let viewH = cam.viewportH / cam.zoom;

        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "aetheric_spark",
          x: cam.x + pad + Math.random() * (viewW - pad * 2),
          y: cam.y + pad + Math.random() * (viewH - pad * 2),
          w: 16,
          h: 16,
          isTriggeredByTouch: true,
          life: 360, // 6s
          maxLife: 360,
          step: step + 1,
        });
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `[✦] Spark Chain: ${step}/5 stepped on!`,
            "#34d399",
          );
        }
      }
    } else if (item.type === "aetheric_conduit") {
      let dmg = BigNum.from(pStats.atk || p.atk || 15).mul(2.5);
      let targetCount = 0;

      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          m.hp = m.hp.sub(dmg);
          m.flashTimer = 8;
          m.hasTakenDamage = true;
          targetCount++;
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              m.x + m.w / 2,
              m.y + m.h / 2,
              dmg,
              "lightning",
              false,
            );
            window.cavernInteractives.push({
              id: window.idCounter++,
              type: "lightning_arc",
              x: item.x,
              y: item.y,
              x2: m.x + m.w / 2,
              y2: m.y + m.h / 2,
              life: 15,
            });
          }
        });
      }

      window.cavernInteractives = window.cavernInteractives.filter((other) => {
        if (other.type === "aetheric_conduit" && other.id !== item.id)
          return false;
        return true;
      });

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell_lightning");
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[✦] Conduit discharged! Hit ${targetCount} targets with Chain Zap!`,
          "#ffd700",
        );
      }
    }
  };

  window.triggerCavernShatter = function (item) {
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("block");
    }
    if (window.combatVisuals) {
      window.combatVisuals.spawnParticles(item.x, item.y, 8, "slag_slime", 2);
    }

    if (item.type === "anomalous_shard") {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("[✦] Anomalous Shard shattered!", "#2ecc71");
      }
    } else if (item.type === "rupture_orb") {
      let core = (window.cavernInteractives || []).find(
        (c) => c.type === "rupture_core" && c.id === item.coreId,
      );
      if (core) {
        core.orbsLeft--;
        if (core.orbsLeft <= 0) {
          window.playerStats.purifiedAegisTimer = 720; // 12s
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[✦] Rupture closed! Purified Aegis active: +50% Def & Immunity!",
              "#2ecc71",
            );
          }
          window.cavernInteractives = window.cavernInteractives.filter(
            (c) => c.id !== core.id,
          );
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell");
          }
        } else {
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `[✦] Orb destroyed! ${core.orbsLeft} remaining.`,
              "#34d399",
            );
          }
        }
      }
    }
  };

  window.drawCavernInteractive = function (ctx, item) {
    if (item.type === "lightning_arc") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      let dx = item.x2 - item.x;
      let dy = item.y2 - item.y;
      let dist = Math.hypot(dx, dy);
      let steps = Math.floor(dist / 8);
      for (let s = 1; s < steps; s++) {
        let progress = s / steps;
        let jx = item.x + dx * progress + (Math.random() - 0.5) * 6;
        let jy = item.y + dy * progress + (Math.random() - 0.5) * 6;
        ctx.lineTo(jx, jy);
      }
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      return;
    }

    if (item.type === "noxious_bloom") {
      let time = Date.now();
      let pulse = Math.sin(time / 120) * 3;
      let alpha = item.life / item.maxLife;
      ctx.save();

      // 1. Swirling radial green toxic gradient mist
      let grad = ctx.createRadialGradient(
        item.x,
        item.y,
        2,
        item.x,
        item.y,
        Math.max(0.1, 40 + pulse),
      );
      grad.addColorStop(0, "rgba(46, 204, 113, 0.25)");
      grad.addColorStop(0.6, "rgba(39, 174, 96, 0.1)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        Math.max(0.1, 40 + pulse),
        Math.max(0.1, 18 + pulse * 0.4),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // 2. Dashed outer warning ring
      ctx.strokeStyle = `rgba(39, 174, 96, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(item.x, item.y, 40, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Floating poison bubbles that drift and lift upwards
      ctx.fillStyle = "rgba(163, 253, 131, 0.6)";
      for (let i = 0; i < 4; i++) {
        let progress = (time / (400 + i * 150) + i * 0.25) % 1.0;
        let bx =
          item.x + Math.sin(i * 20 + time / 400) * (30 * (1.0 - progress));
        let by =
          item.y +
          Math.cos(i * 15 + time / 400) * (12 * (1.0 - progress)) -
          progress * 15;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(0.1, 3.2 * (1.0 - progress)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (item.type === "acid_pool") {
      let time = Date.now();
      let pulse = Math.sin(time / 140) * 1.5;
      ctx.save();
      // Caustic flat green pool
      ctx.fillStyle = "rgba(22, 160, 133, 0.35)";
      ctx.strokeStyle = "rgba(46, 204, 113, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        14 + pulse,
        6 + pulse * 0.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Caustic tiny bubbles popping
      ctx.fillStyle = "#a3fd83";
      for (let i = 0; i < 3; i++) {
        let bubbleProgress = (time / (400 + i * 100) + i * 2) % 1.0;
        let bx =
          item.x + Math.sin(i * 12 + time / 500) * (10 * (1 - bubbleProgress));
        let by =
          item.y + Math.cos(i * 8 + time / 500) * (4 * (1 - bubbleProgress));
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 * (1.0 - bubbleProgress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (item.type === "dilation_field") {
      let time = Date.now();
      let pulse = Math.sin(time / 150) * 1.5;
      ctx.save();
      // Golden clockwork distortion zone
      ctx.fillStyle = "rgba(241, 196, 15, 0.12)";
      ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        40 + pulse,
        18 + pulse * 0.4,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Draw ticking clock hands inside the zone
      ctx.translate(item.x, item.y);
      ctx.rotate(time / 800);
      ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    let pulse = Math.sin(Date.now() / 150) * 1.5;

    if (item.type === "anomalous_shard") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 10, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      let grad = ctx.createLinearGradient(
        item.x - 6,
        item.y - 12,
        item.x + 6,
        item.y + 12,
      );
      grad.addColorStop(0, "#ff7675");
      grad.addColorStop(1, "#d63031");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 12);
      ctx.lineTo(item.x + 5, item.y + 8);
      ctx.lineTo(item.x - 5, item.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "rupture_core") {
      let grad = ctx.createRadialGradient(
        item.x,
        item.y,
        2,
        item.x,
        item.y,
        14 + pulse,
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#e84393");
      grad.addColorStop(0.7, "#8e44ad");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 14 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#09021a";
      ctx.strokeStyle = "#ff007f";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6 + Math.abs(pulse) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "rupture_orb") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8e44ad";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(
        item.x,
        item.y,
        4.5 + Math.sin(Date.now() / 100) * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "glimmering_pixie") {
      let pixieGrad = ctx.createRadialGradient(
        item.x,
        item.y,
        1,
        item.x,
        item.y,
        11 + pulse,
      );
      pixieGrad.addColorStop(0, "#ffffff");
      pixieGrad.addColorStop(0.5, "#ff9ff3");
      pixieGrad.addColorStop(1, "rgba(243, 104, 224, 0)");
      ctx.fillStyle = pixieGrad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 11 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f368e0";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "aetheric_spark") {
      let sparkGrad = ctx.createRadialGradient(
        item.x,
        item.y,
        1,
        item.x,
        item.y,
        10 + pulse,
      );
      sparkGrad.addColorStop(0, "#ffffff");
      sparkGrad.addColorStop(0.4, "#00d2ff");
      sparkGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
      ctx.fillStyle = sparkGrad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 10 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00d2ff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "aetheric_conduit") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 11, 7, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      let nodeGrad = ctx.createLinearGradient(
        item.x - 5,
        item.y - 12,
        item.x + 5,
        item.y + 12,
      );
      nodeGrad.addColorStop(0, "#00ffff");
      nodeGrad.addColorStop(0.5, "#008b8b");
      nodeGrad.addColorStop(1, "#042c2c");
      ctx.fillStyle = nodeGrad;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 12);
      ctx.lineTo(item.x + 4, item.y + 10);
      ctx.lineTo(item.x - 4, item.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (item.isMainPylon) {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.partnerX, item.partnerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  };

  window.destroyBreakableProp = function (prop, worldX, worldY) {
    if (!prop) return;

    // Reset Spreading Fatigue speed penalty on breakable shatter
    window.fatiguePenalty = 0;

    let map = window.activeDungeonMap;
    if (map) {
      if (
        map.grid &&
        map.grid[prop.y] &&
        map.grid[prop.y][prop.x] === window.TILE_TYPES.POTTERY_SPAWN
      ) {
        map.grid[prop.y][prop.x] = window.TILE_TYPES.FLOOR;
      }
      if (map.breakables) {
        let idx = map.breakables.indexOf(prop);
        if (idx !== -1) map.breakables.splice(idx, 1);
      }
    }

    // Particle Debris Shards Theme
    let themeKey =
      prop.type === "wooden_barrel"
        ? "wooden_barrel"
        : prop.type === "ancient_urn"
          ? "ancient_urn"
          : "pottery_clay";

    let colors = window.PARTICLE_THEMES[themeKey] || [
      "#d35400",
      "#e67e22",
      "#7f8c8d",
    ];

    if (window.particles && window.ParticlePool) {
      // 1. Spurt/Fling Shards (16 pieces, fly fast, fall, shrink and fade quickly)
      for (let i = 0; i < 16; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(2.0, 5.0);
        let life = window.randInt(20, 35);

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - window.randFloat(1.5, 3.5),
          window.randFloat(1.5, 3.5),
          colors[Math.floor(Math.random() * colors.length)],
          1.0,
          life,
          life,
          0.28, // gravity pulls them down
          true,
          0.94, // realistic air resistance
        );

        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.3, 0.3);
        pt.scaleDecay = 0.02; // shrink smoothly
        window.particles.push(pt);
      }

      // 2. Lingering Ground Debris/Rubble (5-8 pieces, slide and settle flat, linger for 4-5 seconds)
      let rubbleCount = window.randInt(5, 8);
      for (let i = 0; i < rubbleCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(0.5, 2.2);
        let life = window.randInt(240, 300); // 4-5 seconds at 60 FPS

        let pt = window.ParticlePool.get(
          worldX,
          worldY + window.randFloat(-3, 3), // spread offset
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.5, // flat ellipse scatter
          window.randFloat(2.0, 3.5),
          colors[Math.floor(Math.random() * colors.length)],
          1.0,
          life,
          life,
          0, // no gravity, they lay flat on the floor
          true, // slowly fade out at the end
          0.86, // rapid deceleration to settle quickly
        );

        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.05, 0.05); // slow rotation as they slide
        pt.scaleDecay = 0.0; // do not shrink, stay as flat rubble on the ground
        window.particles.push(pt);
      }
    }

    if (window.combatVisuals) {
      window.combatVisuals.triggerScreenShake(2, 6);
    }
    if (
      window.SoundManager &&
      typeof window.SoundManager.playHitImpact === "function"
    ) {
      window.SoundManager.playHitImpact(true, "shatter");
    }

    // Loot Drop Table Roll
    let depth = window.player ? window.player.depth || 1 : 1;
    let roll = Math.random();

    if (roll < 0.6) {
      // 60% Gold Eruption
      let goldAmt = Math.floor(15 * (1 + depth * 0.4));
      window.spawnHomingGold(worldX, worldY, goldAmt);
    } else if (roll < 0.8) {
      // 20% Crafting Scraps / Monster Souls
      let soulCount = Math.floor(Math.random() * 2) + 1;
      window.addDungeonRunScrap("Monster Soul", soulCount, worldX, worldY);
    } else if (roll < 0.9) {
      // 10% Health Restoration (Spawns physical hearts)
      let p = window.player;
      if (p) {
        let healAmt = Math.round(p.maxHp * 0.15);
        if (typeof window.spawnHomingHearts === "function") {
          window.spawnHomingHearts(worldX, worldY, healAmt);
        }
      }
    }
    // Remaining 10%: Dust cloud only
  };

  window.updateDungeonCombat = function () {
    let p = window.player;
    if (!p || p.hp <= 0) return;
    if (window.currentGameState !== window.GAME_STATES.DUNGEON) return;

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    // Brimstone Core: Pulse adjacent 50% fire damage every second
    if (pStats.hasBrimstoneCore && window.logicClock % 60 === 0) {
      let auraDmg = BigNum.from(pStats.atk || p.atk || 15).mul(0.5);
      let targetCount = 0;
      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          let dist = Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2));
          if (dist <= 45 && m.hp.gt(0)) {
            m.hp = m.hp.sub(auraDmg);
            m.flashTimer = 8;
            targetCount++;
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                m.x + m.w / 2,
                m.y + m.h / 2,
                auraDmg,
                "fire",
                false,
              );
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                4,
                "magma_elemental",
                1.5,
              );
            }
          }
        });
      }
      if (window.mob && window.mob.hp.gt(0)) {
        let bm = window.mob;
        let dist = Math.hypot(p.x - (bm.x + bm.w / 2), p.y - (bm.y + bm.h / 2));
        if (dist <= 45) {
          bm.hp = bm.hp.sub(auraDmg);
          bm.flashTimer = 8;
          targetCount++;
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              auraDmg,
              "fire",
              false,
            );
          }
        }
      }
      if (
        targetCount > 0 &&
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell_fire");
      }
    }

    // Check if Onslaught Wave has been cleared
    if (
      window.playerStats.isCrucibleMode &&
      window.activeDungeonMobs.length === 0 &&
      window.mob === null &&
      !window.state.onslaughterWaveLock
    ) {
      window.state.onslaughterWaveLock = true;
      if (typeof window.onOnslaughtWaveClear === "function") {
        window.onOnslaughtWaveClear();
      }
    }

    // Increment Floor Doom Timer & Evaluate Spawn Conditions
    window.floorTimeElapsed = (window.floorTimeElapsed || 0) + 1;
    let hasDeathsHour =
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("deaths_hour");

    if (
      (window.floorTimeElapsed >= 10800 || hasDeathsHour) &&
      !window.calamitySpecterActive
    ) {
      window.spawnCalamitySpecter();
    }

    pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : { atk: BigNum.from(15) };
    p.attackTimer = (p.attackTimer || 0) + 1;

    // --- PHASE 3: INTERACTIVE HAZARDS & SYSTEM INTEGRATIONS ---

    // A. Spreading Fatigue (Incremental Speed Decay)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("spreading_fatigue")
    ) {
      window.fatiguePenalty = (window.fatiguePenalty || 0) + 0.00025; // approx 1.5% speed loss per sec
      if (window.fatiguePenalty > 0.7) window.fatiguePenalty = 0.7; // Cap penalty at 70% (min 30% speed)
      p.speedMultiplier = Math.min(
        p.speedMultiplier || 1.0,
        1.0 - window.fatiguePenalty,
      );
    } else {
      window.fatiguePenalty = 0;
    }

    // B. Molten Slag (Floor friction builds heat)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("molten_slag")
    ) {
      window.moltenSlagHeat = window.moltenSlagHeat || 0;
      if (p.isMoving) {
        window.moltenSlagHeat += 0.22;
        window.moltenSlagStillTimer = 0;
      } else {
        window.moltenSlagStillTimer = (window.moltenSlagStillTimer || 0) + 1;
        if (window.moltenSlagStillTimer >= 90) {
          // 1.5s stationary resets heat
          window.moltenSlagHeat = Math.max(0, window.moltenSlagHeat - 0.6);
        }
      }

      if (window.moltenSlagHeat >= 100) {
        window.moltenSlagHeat = 0;
        let burnDmg = Math.round(p.maxHp * 0.1);
        window.damagePlayer(burnDmg, null);
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 25,
            `OVERHEAT! -${burnDmg} HP`,
            "#ea580c",
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnParticles(
            p.x,
            p.y,
            18,
            "magma_elemental",
            3.5,
          );
        }

        window.cavernInteractives = window.cavernInteractives || [];
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "acid_pool", // Reuses acid_pool lava visual & tick trigger
          x: p.x,
          y: p.y,
          w: 24,
          h: 12,
          life: 300,
          maxLife: 300,
        });
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_fire");
        }
      }
    }

    // C. Unstable Crust (Collapsing Sinkholes)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("unstable_crust")
    ) {
      window.unstableCrustTimer = (window.unstableCrustTimer || 0) + 1;
      if (window.unstableCrustTimer >= 1200) {
        // 20s
        window.unstableCrustTimer = 0;
        let map = window.activeDungeonMap;
        if (map && map.grid) {
          let pTileX = Math.floor(p.x / map.tileSize);
          let pTileY = Math.floor(p.y / map.tileSize);
          let collapsed = false;

          for (let attempts = 0; !collapsed && attempts < 30; attempts++) {
            let tx = pTileX + window.randInt(-4, 4);
            let ty = pTileY + window.randInt(-4, 4);
            if (
              tx >= 1 &&
              tx < map.width - 1 &&
              ty >= 1 &&
              ty < map.height - 1
            ) {
              if (map.grid[ty][tx] === window.TILE_TYPES.FLOOR) {
                map.grid[ty][tx] = window.TILE_TYPES.VOID;
                map.needsPreRender = true; // Force map render update
                collapsed = true;
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    tx * map.tileSize + map.tileSize / 2,
                    ty * map.tileSize + map.tileSize / 2,
                    15,
                    "default_slime",
                    3.0,
                  );
                  window.combatVisuals.triggerScreenShake(4, 6);
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    tx * map.tileSize + map.tileSize / 2,
                    ty * map.tileSize + map.tileSize / 2,
                    "SINKHOLE COLLAPSE!",
                    "#e74c3c",
                  );
                }
                if (
                  window.SoundManager &&
                  typeof window.SoundManager.play === "function"
                ) {
                  window.SoundManager.play("block");
                }
              }
            }
          }
        }
      }
    }

    // D. Temporal Echo (Chronological Mimic Strike Execution)
    if (window.temporalEchoQueue && window.temporalEchoQueue.length > 0) {
      for (let i = window.temporalEchoQueue.length - 1; i >= 0; i--) {
        let echo = window.temporalEchoQueue[i];
        echo.timer--;
        if (echo.timer <= 0) {
          let targetMob = window.activeDungeonMobs
            ? window.activeDungeonMobs.find((m) => m.id === echo.targetId)
            : null;
          if (!targetMob && window.mob && window.mob.id === echo.targetId) {
            targetMob = window.mob;
          }

          if (targetMob && targetMob.hp && targetMob.hp.gt(0)) {
            targetMob.hp = targetMob.hp.sub(echo.damage);
            targetMob.flashTimer = 4;
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                targetMob.x + targetMob.w / 2,
                targetMob.y + targetMob.h / 2,
                echo.damage,
                "echo",
                false,
                targetMob,
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                targetMob.x + targetMob.w / 2,
                targetMob.y + targetMob.h / 2,
                6,
                "calamity_specter",
                1.8,
              );
            }
          }
          window.temporalEchoQueue.splice(i, 1);
        }
      }
    }

    // E. Astral Conjunction (Stellar Laser Strikes)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("astral_conjunction")
    ) {
      window.astralConjunctionTimer = (window.astralConjunctionTimer || 0) + 1;
      if (window.astralConjunctionTimer >= 720) {
        // 12s
        window.astralConjunctionTimer = 0;
        let targets = window.activeDungeonMobs
          ? window.activeDungeonMobs.filter(
              (other) => !other.isFriendlyWisp && other.hp.gt(0),
            )
          : [];
        if (window.mob && window.mob.hp.gt(0)) targets.push(window.mob);

        if (targets.length > 0) {
          let tMob = targets[Math.floor(Math.random() * targets.length)];
          let tCx = tMob.x + (tMob.w || 24) / 2;
          let tCy = tMob.y + (tMob.h || 24) / 2;

          let laserDmg = BigNum.from(pStats.atk || p.atk || 15).mul(10.0); // 1000% damage
          tMob.hp = tMob.hp.sub(laserDmg);
          tMob.flashTimer = 12;

          if (window.combatVisuals) {
            window.combatVisuals.spawnBeam(tCx, "#ffffff", 45, false, 0);
            window.combatVisuals.spawnProjectileImpact(tCx, tCy, "boss_nova");
            window.combatVisuals.triggerScreenShake(8, 14);
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell_lightning");
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              tCx,
              tCy - 20,
              "ASTRAL CONJUNCTION!",
              "#ffffff",
            );
          }

          targets.forEach((other) => {
            if (other.id !== tMob.id) {
              let dist = Math.hypot(
                tMob.x + tMob.w / 2 - (other.x + other.w / 2),
                tMob.y + tMob.h / 2 - (other.y + other.h / 2),
              );
              if (dist <= 85) {
                let splashDmg = laserDmg.mul(0.35);
                other.hp = other.hp.sub(splashDmg);
                other.flashTimer = 6;
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    other.x + other.w / 2,
                    other.y + other.h / 2,
                    8,
                    "magma_elemental",
                    2.2,
                  );
                }
              }
            }
          });
        }
      }
    }

    let logicClock = window.logicClock || 0;

    // --- UNIQUE ITEM PERIODIC TIMERS ---
    if (window.hasUniquePassive("weapon_staff")) {
      window.playerStats.phoenixStaffTimer =
        (window.playerStats.phoenixStaffTimer || 0) + 1;
      if (window.playerStats.phoenixStaffTimer >= 180) {
        window.playerStats.phoenixStaffTimer = 0;
        let targetMob =
          (window.activeDungeonMobs && window.activeDungeonMobs[0]) ||
          window.mob;
        if (
          targetMob &&
          targetMob.hp &&
          targetMob.hp.gt &&
          targetMob.hp.gt(0)
        ) {
          let tCx = targetMob.x + (targetMob.w || 24) / 2;
          let tCy = targetMob.y + (targetMob.h || 24) / 2;
          let dx = tCx - p.x;
          let dy = tCy - (p.y - 8);
          let dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 300) {
            let fireDmg = BigNum.from(pStats.atk || 15).mul(0.25);
            window.projectiles.push({
              x: p.x,
              y: p.y - 8,
              vx: (dx / dist) * 4.5,
              vy: (dy / dist) * 4.5,
              r: 7,
              type: "fireball",
              damage: Math.round(fireDmg.valueOf()),
              life: 140,
              pulseOffset: Math.random() * 10,
            });
            if (window.SoundManager) window.SoundManager.play("spell_fire");
          }
        }
      }
    }

    if (window.hasUniquePassive("tome_watch")) {
      window.playerStats.watchCycleTimer =
        (window.playerStats.watchCycleTimer || 0) + 1;
      if (window.playerStats.watchCycleTimer >= 1200) {
        window.playerStats.watchCycleTimer = 0;
        window.playerStats.watchActiveTimer = 240;
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 25,
            "TEMPORAL FRACTURE!",
            "#f1c40f",
            true,
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnBeam(p.x, "#f1c40f", 40, true);
        }
      }
      if (window.playerStats.watchActiveTimer > 0) {
        window.playerStats.watchActiveTimer--;
      }
    }

    if (window.hasUniquePassive("tome_conduit")) {
      window.playerStats.conduitSpawnTimer =
        (window.playerStats.conduitSpawnTimer || 0) + 1;
      if (window.playerStats.conduitSpawnTimer >= 900) {
        window.playerStats.conduitSpawnTimer = 0;
        if (typeof window.spawnCavernInteractive === "function") {
          window.spawnCavernInteractive("aetheric_conduit");
        }
      }
    }

    // --- ELITE SUPPORT AURA PULSES & STACK DECAY ENGINE ---
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      let mobs = window.activeDungeonMobs;

      // 1. Process Active Aura Pulses from Elite Commanders
      mobs.forEach((m) => {
        if (!m.eliteAffix || m.hp.lte(0)) return;

        let mCx = m.x + (m.w || 24) / 2;
        let mCy = m.y + (m.h || 24) / 2;

        if (m.eliteAffix === "vitality_weaver") {
          if (logicClock % 90 === 0) {
            // Pulse every 1.5 seconds
            let radiusSq = 14400; // 120px healing radius squared
            let injuredAllies = [];

            mobs.forEach((m2) => {
              if (m2 === m || m2.hp.lte(0) || m2.hp.gte(m2.maxHp)) return; // Strictly excludes self, hero, and full-HP/dead mobs
              let dx = m2.x + (m2.w || 24) / 2 - mCx;
              let dy = m2.y + (m2.h || 24) / 2 - mCy;
              if (dx * dx + dy * dy <= radiusSq) {
                let hpRatio = m2.hp.div(m2.maxHp).valueOf();
                injuredAllies.push({ mob: m2, ratio: hpRatio });
              }
            });

            // Target up to 3 lowest-HP injured monster allies
            injuredAllies.sort((a, b) => a.ratio - b.ratio);
            let targetsToHeal = injuredAllies.slice(0, 3);

            targetsToHeal.forEach((target) => {
              let targetMob = target.mob;
              let isBoss =
                targetMob.type === "dungeon_boss" ||
                targetMob.type === "dungeon_miniboss";
              let healRatio = isBoss ? 0.015 : 0.06; // 1.5% for bosses, 6% for standard mobs
              let healVal = targetMob.maxHp.mul(healRatio);

              targetMob.hp = window.BigNumMin(
                targetMob.maxHp,
                targetMob.hp.add(healVal),
              );

              let tx = targetMob.x + (targetMob.w || 24) / 2;
              let ty = targetMob.y + (targetMob.h || 24) / 2;

              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  tx,
                  ty - 15,
                  `+${window.formatNumber(healVal)} HP`,
                  "#2ecc71",
                );
              }
            });
          }
        } else if (m.eliteAffix === "swift_commander") {
          let radiusSq = 19600; // 140px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers.haste = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.haste = Math.min(
                  3,
                  (m2.buffStacks.haste || 0) + 1,
                );
              }
            }
          });
        } else if (m.eliteAffix === "iron_citadel") {
          let radiusSq = 10000; // 100px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers.def = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.def = Math.min(3, (m2.buffStacks.def || 0) + 1);
              }
            }
          });
        } else if (m.eliteAffix === "blood_berserker") {
          let radiusSq = 12100; // 110px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers.atk = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.atk = Math.min(3, (m2.buffStacks.atk || 0) + 1);
              }
            }
          });
        } else if (m.eliteAffix === "nullifier") {
          let dx = p.x - mCx;
          let dy = p.y - mCy;
          if (dx * dx + dy * dy <= 8100) {
            // 90px hero disruptor radius
            p.nullifierDisrupted = true;
          }
        }
      });

      // 2. Process Lingering Window Countdown & Gradual 2.5s Stack Falloff
      mobs.forEach((m) => {
        if (!m.buffStacks) return;
        ["haste", "def", "atk"].forEach((b) => {
          if (m.buffTimers[b] > 0) {
            m.buffTimers[b]--;
            if (m.buffTimers[b] === 0 && m.buffStacks[b] > 0) {
              m.buffStacks[b]--;
              if (m.buffStacks[b] > 0) {
                m.buffTimers[b] = 150; // Drop 1 stack every 2.5s (150 frames)
              }
            }
          }
        });
      });
    }

    if (window.hero.slashTimer > 0) {
      window.hero.slashTimer--;
      window.hero.slashFrame = true;
    } else {
      window.hero.slashFrame = false;
    }

    // Build unified target list (including breakable debuff/hazard entities and room props)
    let targetables = [];
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      window.activeDungeonMobs.forEach((m) => {
        if (m.isSpecter) return; // Exclude Specter from target locks entirely

        targetables.push({
          obj: m,
          type: "mob",
          x: m.x + m.w / 2,
          y: m.y + m.h / 2,
          radius: (m.w || 24) * 0.45,
        });
      });
    }
    if (window.cavernInteractives && window.cavernInteractives.length > 0) {
      window.cavernInteractives.forEach((item) => {
        if (item.hp !== undefined && item.hp > 0) {
          targetables.push({
            obj: item,
            type: "cavern",
            x: item.x,
            y: item.y,
            radius: item.w / 2,
          });
        }
      });
    }
    let mapInst = window.activeDungeonMap;
    if (mapInst && mapInst.breakables && mapInst.breakables.length > 0) {
      let tSize = mapInst.tileSize || 32;
      mapInst.breakables.forEach((b) => {
        if (b.flashTimer > 0) b.flashTimer--;
        if (b.hp > 0) {
          targetables.push({
            obj: b,
            type: "breakable",
            x: b.x * tSize + tSize / 2,
            y: b.y * tSize + tSize / 2,
            radius: 12,
          });
        }
      });
    }

    // Process targets in view
    targetables.forEach((t) => {
      if (t.type === "mob") {
        let m = t.obj;
        if (m.flashTimer > 0) m.flashTimer--;
        if (m.attackCooldown > 0) m.attackCooldown--;
        if (m.rangedCooldown > 0) m.rangedCooldown--;

        if (m.recoilX) {
          m.recoilX *= 0.65;
          if (Math.abs(m.recoilX) < 0.2) m.recoilX = 0;
        }
        if (m.recoilY) {
          m.recoilY *= 0.65;
          if (Math.abs(m.recoilY) < 0.2) m.recoilY = 0;
        }

        let dx = p.x - t.x;
        let dy = p.y - t.y;
        let dist = Math.hypot(dx, dy);

        if (dx < -1) {
          m.facing = -1;
        } else if (dx > 1) {
          m.facing = 1;
        }

        // Soft Entity Body-Blocking (Allows passing through with speed resistance and gentle push)
        let pRadius = p.radius || 9;
        let minDist = pRadius + t.radius;

        if (dist < minDist) {
          let overlap = minDist - dist;
          let nx = dist > 0 ? dx / dist : 1;
          let ny = dist > 0 ? dy / dist : 0;

          // Apply speed resistance to player
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.45);

          // Push the mob away gently instead of blocking the player
          let mobPushX = -nx * overlap * 0.25;
          let mobPushY = -ny * overlap * 0.25;

          let map = window.activeDungeonMap;
          if (map && map.grid) {
            let mCenterX = m.x + m.w / 2;
            let mCenterY = m.y + m.h / 2;
            if (
              !checkCollisionAt(map, mCenterX + mobPushX, mCenterY, t.radius)
            ) {
              m.x += mobPushX;
            }
            if (
              !checkCollisionAt(map, mCenterX, mCenterY + mobPushY, t.radius)
            ) {
              m.y += mobPushY;
            }
          } else {
            m.x += mobPushX;
            m.y += mobPushY;
          }
        }

        // Persistent Aggro & Pursuit Movement
        if (dist < 220 || m.hasTakenDamage) {
          m.isAggroed = true;
        }

        // Mob Ranged Attack Execution with Windup & Recoil
        if (m.isRanged && m.isAggroed && dist < 260) {
          if (m.castTimer > 0) {
            m.castTimer--;

            // Windup Charge Particles
            if (window.combatVisuals && Math.random() < 0.6) {
              let mCx = m.x + m.w / 2;
              let mCy = m.y + m.h / 2;
              let pColor =
                m.projectileType === "thorn"
                  ? "#2ecc71"
                  : m.projectileType === "frost"
                    ? "#38bdf8"
                    : m.projectileType === "fireball"
                      ? "#e67e22"
                      : m.projectileType === "maelstrom"
                        ? "#a3fd83"
                        : "#e84393";
              window.combatVisuals.particlePool.get(
                mCx + (Math.random() - 0.5) * 20,
                mCy + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                window.randFloat(1.0, 2.2),
                pColor,
                0.8,
                12,
                0,
                true,
                0,
              );
            }

            if (m.castTimer === 0) {
              m.rangedCooldown = m.isRare ? 65 : 95;
              let pCx = p.x;
              let pCy = p.y - 8;
              let mCx = m.x + m.w / 2;
              let mCy = m.y + m.h / 2;
              let pDx = pCx - mCx;
              let pDy = pCy - mCy;
              let pDist = Math.hypot(pDx, pDy);

              if (pDist > 0) {
                let normX = pDx / pDist;
                let normY = pDy / pDist;
                let pSpeed = 3.6;

                window.projectiles.push({
                  x: mCx + normX * 10,
                  y: mCy + normY * 10,
                  vx: normX * pSpeed,
                  vy: normY * pSpeed,
                  r: 5,
                  type: m.projectileType || "standard",
                  damage: Math.round(m.atk * 0.85),
                  life: 140,
                  pulseOffset: Math.random() * 10,
                });

                // Apply Recoil Impulse
                m.recoilX = -normX * 6;
                m.recoilY = -normY * 6;

                if (
                  window.SoundManager &&
                  typeof window.SoundManager.play === "function"
                ) {
                  let sfx =
                    m.projectileType === "frost"
                      ? "spell_frost"
                      : m.projectileType === "fireball"
                        ? "spell_fire"
                        : m.projectileType === "void"
                          ? "spell"
                          : "swing";
                  window.SoundManager.play(sfx);
                }
              }
            }
          } else if (m.rangedCooldown <= 0 && dist > 20) {
            m.castTimer = 14; // 14 frames anticipation wind-up
          }
        }

        if (!m.isAggroed) {
          m.wanderTimer = (m.wanderTimer || 0) - 1;
          if (m.wanderTimer <= 0) {
            m.wanderTimer = window.randInt(90, 200);
            m.isWandering = Math.random() < 0.45;

            if (m.isWandering) {
              let angle = Math.random() * Math.PI * 2;
              let wanderSpeed = 0.8;
              m.wanderVx = Math.cos(angle) * wanderSpeed;
              m.wanderVy = Math.sin(angle) * wanderSpeed;
            } else {
              m.wanderVx = 0;
              m.wanderVy = 0;
            }
          }

          if (m.isWandering && (m.wanderVx !== 0 || m.wanderVy !== 0)) {
            let mRadius = 6;
            let mCenterX = m.x + m.w / 2;
            let mCenterY = m.y + m.h / 2;
            let nextX = mCenterX + m.wanderVx;
            let nextY = mCenterY + m.wanderVy;
            let hX = (m.homeX !== undefined ? m.homeX : m.x) + m.w / 2;
            let hY = (m.homeY !== undefined ? m.homeY : m.y) + m.h / 2;
            let distFromHome = Math.hypot(nextX - hX, nextY - hY);

            let mapInst = window.activeDungeonMap;
            if (distFromHome < 128 && mapInst && mapInst.grid) {
              let canMoveX = !checkCollisionAt(
                mapInst,
                nextX,
                mCenterY,
                mRadius,
              );
              let canMoveY = !checkCollisionAt(
                mapInst,
                mCenterX,
                nextY,
                mRadius,
              );

              if (canMoveX) m.x += m.wanderVx;
              if (canMoveY) m.y += m.wanderVy;

              if (!canMoveX && !canMoveY) {
                m.isWandering = false;
                m.wanderVx = 0;
                m.wanderVy = 0;
              }

              if (m.wanderVx < -0.1) m.facing = -1;
              else if (m.wanderVx > 0.1) m.facing = 1;

              m.hopTimer = (m.hopTimer || 0) + 0.5;
            } else {
              m.isWandering = false;
              m.wanderVx = 0;
              m.wanderVy = 0;
            }
          }
        }

        if (m.isAggroed && dist < 800 && dist > 14) {
          m.hopTimer = (m.hopTimer || 0) + 1;
          let cycle = m.hopTimer % 30; // 15 frames jumping, 15 frames resting
          if (cycle < 15) {
            let speed = m.isRare ? 2.2 : 1.8;
            let mRadius = 6;
            let mCenterX = m.x + m.w / 2;
            let mCenterY = m.y + m.h / 2;
            let mapInst = window.activeDungeonMap;

            if (mapInst && mapInst.grid) {
              let probeAngles = [
                0,
                Math.PI / 4,
                -Math.PI / 4,
                Math.PI / 2,
                -Math.PI / 2,
                (Math.PI * 3) / 4,
                -(Math.PI * 3) / 4,
              ];

              // Intercept and redirect aggro toward friendly decoy wisps if nearby
              let targetEntity = p;
              let nearbyWisp = window.activeDungeonMobs
                ? window.activeDungeonMobs.find(
                    (w) =>
                      w.isFriendlyWisp &&
                      w.hp.gt(0) &&
                      Math.hypot(
                        mCenterX - (w.x + 12),
                        mCenterY - (w.y + 12),
                      ) <= 160,
                  )
                : null;
              if (nearbyWisp) {
                targetEntity = { x: nearbyWisp.x + 12, y: nearbyWisp.y + 12 };
              }

              let baseAngle = Math.atan2(
                targetEntity.y - mCenterY,
                targetEntity.x - mCenterX,
              );
              // Add a slight dynamic drift based on logic clock and mob ID to break identical conga-lines
              let drift =
                Math.sin((window.logicClock || 0) * 0.04 + (m.id || 0)) * 0.22;
              baseAngle += drift;

              for (let a = 0; a < probeAngles.length; a++) {
                let testAngle = baseAngle + probeAngles[a];
                let vx = Math.cos(testAngle) * speed;
                let vy = Math.sin(testAngle) * speed;

                if (
                  !checkCollisionAt(
                    mapInst,
                    mCenterX + vx,
                    mCenterY + vy,
                    mRadius,
                  )
                ) {
                  m.x += vx;
                  m.y += vy;
                  if (vx < -0.1) m.facing = -1;
                  else if (vx > 0.1) m.facing = 1;
                  break;
                }
              }
            }
          }
        }
      }
    });

    // Find the closest overall target (mob or breakable cavern entity)
    let closestTarget = null;
    let closestDist = Infinity;
    targetables.forEach((t) => {
      let dist = Math.hypot(p.x - t.x, p.y - t.y);
      let maxDist = t.type === "breakable" ? 25 : 38;
      if (dist < maxDist && dist < closestDist) {
        closestDist = dist;
        closestTarget = t;
      }
    });

    if (closestTarget && p.attackTimer >= 20) {
      p.attackTimer = 0;
      window.hero.slashTimer = 8; // Trigger 8-frame slash animation arc

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("swing");
      }

      // Face the target being attacked!
      let dxToTarget = closestTarget.x - p.x;
      if (dxToTarget < -0.1) p.facing = -1;
      else if (dxToTarget > 0.1) p.facing = 1;

      if (closestTarget.type === "mob") {
        let m = closestTarget.obj;
        let isCrit = Math.random() < (pStats.critChance || 0.05);
        let critMult = isCrit ? pStats.critDamage || 1.5 : 1.0;
        let pAtk = BigNum.from(pStats.atk || p.atk).mul(critMult);

        m.hp = m.hp.sub(pAtk);
        m.hasTakenDamage = true;
        m.flashTimer = 6;

        // Track Critical Streaks for Wind-Razor Flurry
        let windFlurryLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
          : 0;
        if (windFlurryLevel > 0) {
          if (isCrit) {
            window.playerStats.critStreak =
              (window.playerStats.critStreak || 0) + 1;
            if (window.playerStats.critStreak >= 3) {
              window.playerStats.critStreak = 0;
              window.triggerWindRazorStrike(m);
            }
          } else {
            window.playerStats.critStreak = 0; // Reset streak on non-crit
          }
        }

        // --- Earth-Breaker Bash Cone Splash ---
        let bashLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("shield_earth_breaker_bash")
          : 0;
        let isShield =
          pStats.subType === "shield" ||
          (window.equippedSlots &&
            window.equippedSlots.subweapon &&
            window.equippedSlots.subweapon.subType === "shield");

        if (isShield && bashLevel > 0) {
          let attackAngle = Math.atan2(
            m.y + (m.h || 24) / 2 - p.y,
            m.x + (m.w || 24) / 2 - p.x,
          );
          if (window.spawnEarthBreakerBashVisual) {
            window.spawnEarthBreakerBashVisual(p.x, p.y, attackAngle);
          }

          let coneWidth = 0.45; // ~25 degrees each side (~50 degree cone)
          let range = 60;
          let splashDmg = pAtk.mul(0.5); // Deals 50% splash damage inside the cone

          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((otherMob) => {
              if (
                otherMob.id !== m.id &&
                otherMob.hp.gt(0) &&
                !otherMob.isFriendlyWisp
              ) {
                let omCx = otherMob.x + (otherMob.w || 24) / 2;
                let omCy = otherMob.y + (otherMob.h || 24) / 2;
                let dist = Math.hypot(p.x - omCx, p.y - omCy);
                if (dist <= range) {
                  let targetAngle = Math.atan2(omCy - p.y, omCx - p.x);
                  let angleDiff = Math.abs(
                    Math.atan2(
                      Math.sin(targetAngle - attackAngle),
                      Math.cos(targetAngle - attackAngle),
                    ),
                  );
                  if (angleDiff <= coneWidth) {
                    otherMob.hp = otherMob.hp.sub(splashDmg);
                    otherMob.flashTimer = 6;
                    otherMob.hasTakenDamage = true;

                    // Apply Stun Chance (15% per rank) to non-bosses
                    let stunChance = bashLevel * 0.15;
                    if (Math.random() < stunChance && !otherMob.isBoss) {
                      otherMob.speedMultiplier = 0;
                      otherMob.stunTimer = 90; // 1.5s stun
                      if (typeof window.spawnFloatingText === "function") {
                        window.spawnFloatingText(
                          omCx,
                          otherMob.y - 12,
                          "STUNNED!",
                          "#38bdf8",
                        );
                      }
                    }

                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        omCx,
                        omCy,
                        splashDmg,
                        "counter",
                        false,
                        otherMob,
                      );
                    }
                  }
                }
              }
            });
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("block");
          }
        }

        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("temporal_echo")
        ) {
          window.temporalEchoQueue = window.temporalEchoQueue || [];
          window.temporalEchoQueue.push({
            targetId: m.id,
            damage: pAtk.mul(0.35),
            timer: 72, // 1.2s delay
          });
        }

        let mobCenterX = closestTarget.x;
        let mobCenterY = closestTarget.y;

        // --- ACTIVE ONSLAUGHT CARD TRIGGER EXECUTIONS ---

        // Unstable Combustion: Splash explosion + self-backlash on Critical Strikes
        if (pStats.crucibleCritSplash && isCrit) {
          let splashDmg = pAtk.mul(pStats.crucibleCritSplash);
          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((otherMob) => {
              if (otherMob.id !== m.id && otherMob.hp.gt(0)) {
                let sDist = Math.hypot(m.x - otherMob.x, m.y - otherMob.y);
                if (sDist <= 80) {
                  otherMob.hp = otherMob.hp.sub(splashDmg);
                  otherMob.flashTimer = 6;
                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(
                      otherMob.x + otherMob.w / 2,
                      otherMob.y + otherMob.h / 2,
                      splashDmg,
                      "fire",
                      false,
                    );
                  }
                }
              }
            });
          }
          if (pStats.crucibleBacklash) {
            let backlashVal = Math.round(
              pAtk.mul(pStats.crucibleBacklash).valueOf(),
            );
            p.hp = Math.max(1, p.hp - backlashVal);
            window.spawnFloatingText(
              p.x,
              p.y - 12,
              `-${backlashVal} BACKLASH`,
              "#e74c3c",
              true,
            );
          }
        }

        // Mirage Array: Delayed 40% Ghost Slash clone mimicry
        if (pStats.hasMirageArray) {
          let ghostDmg = pAtk.mul(0.4);
          setTimeout(() => {
            if (m && m.hp && m.hp.gt(0)) {
              m.hp = m.hp.sub(ghostDmg);
              m.flashTimer = 6;
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  m.x + m.w / 2,
                  m.y + m.h / 2,
                  ghostDmg,
                  "echo",
                  false,
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  m.x + m.w / 2,
                  m.y + m.h / 2,
                  6,
                  "calamity_specter",
                  1.5,
                );
              }
            }
          }, 150);
        }

        // Thunderlord's Backlash: Every 10th hit strikes 3 targets for 400% Dmg + 5% feedback
        if (pStats.hasThunderBacklash) {
          window.playerStats.thunderlordCount =
            (window.playerStats.thunderlordCount || 0) + 1;
          if (window.playerStats.thunderlordCount >= 10) {
            window.playerStats.thunderlordCount = 0;
            let boltDmg = pAtk.mul(4.0);
            let hitCount = 0;
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((otherMob) => {
                if (hitCount < 3 && otherMob.hp.gt(0)) {
                  let sDist = Math.hypot(
                    p.x - (otherMob.x + otherMob.w / 2),
                    p.y - (otherMob.y + otherMob.h / 2),
                  );
                  if (sDist <= 150) {
                    otherMob.hp = otherMob.hp.sub(boltDmg);
                    otherMob.flashTimer = 8;
                    hitCount++;
                    if (window.combatVisuals) {
                      window.combatVisuals.spawnBeam(
                        otherMob.x + otherMob.w / 2,
                        "#00ffff",
                        30,
                        false,
                      );
                      window.combatVisuals.spawnDamageEffect(
                        otherMob.x + otherMob.w / 2,
                        otherMob.y + otherMob.h / 2,
                        boltDmg,
                        "lightning",
                        true,
                      );
                    }
                  }
                }
              });
            }
            if (hitCount < 3 && window.mob && window.mob.hp.gt(0)) {
              let bm = window.mob;
              bm.hp = bm.hp.sub(boltDmg);
              bm.flashTimer = 8;
              hitCount++;
              if (window.combatVisuals) {
                window.combatVisuals.spawnBeam(
                  bm.x + bm.w / 2,
                  "#00ffff",
                  30,
                  false,
                );
                window.combatVisuals.spawnDamageEffect(
                  bm.x + bm.w / 2,
                  bm.y + bm.h / 2,
                  boltDmg,
                  "lightning",
                  true,
                );
              }
            }
            if (hitCount > 0) {
              let feedbackVal = Math.round(boltDmg.mul(0.05).valueOf());
              p.hp = Math.max(1, p.hp - feedbackVal);
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `-${feedbackVal} FEEDBACK`,
                "#a855f7",
                true,
              );
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("spell_lightning");
              }
            }
          }
        }

        let rawHitNum = pAtk.valueOf ? pAtk.valueOf() : Number(pAtk);
        window.playerStats.peakSingleHit = Math.max(
          window.playerStats.peakSingleHit || 0,
          rawHitNum,
        );

        let mMaxHpNum = m.maxHp.valueOf
          ? m.maxHp.valueOf()
          : Number(m.maxHp || 1);
        if (isCrit && mMaxHpNum > 0 && rawHitNum / mMaxHpNum >= 10) {
          window.playerStats.hasTriggeredOverkill = true;
        }

        let curHr = new Date().getHours();
        if (curHr >= 0 && curHr < 4)
          window.playerStats.hasTriggeredNightOwl = true;
        if (curHr >= 5 && curHr < 8)
          window.playerStats.hasTriggeredEarlyBird = true;
        let curDay = new Date().getDay();
        if (curDay === 0 || curDay === 6)
          window.playerStats.hasTriggeredWeekendWarrior = true;

        mobCenterX = closestTarget.x;
        mobCenterY = closestTarget.y;
        let dx = closestTarget.x - p.x;
        let dy = closestTarget.y - p.y;
        let dist = Math.hypot(dx, dy);

        if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
          window.RenderEngine.spawnDamageEffect(
            mobCenterX,
            mobCenterY,
            pAtk,
            "slash",
            isCrit,
          );
        }

        // Artifact: Vampirism (Blood-Soaked Chalice)
        if (window.checkArtifactTrait("vampirism")) {
          let now = Date.now();
          window.playerStats.recentHeals = (
            window.playerStats.recentHeals || []
          ).filter((h) => now - h.time < 1000);
          let totalHealedLastSec = window.playerStats.recentHeals.reduce(
            (sum, h) => sum + h.amt,
            0,
          );
          let maxHealPerSec = p.maxHp * 0.03;
          let allowedHeal = Math.max(0, maxHealPerSec - totalHealedLastSec);

          let rawHeal = pAtk.mul(0.005).valueOf();
          let finalHeal = Math.min(allowedHeal, rawHeal);
          if (finalHeal > 0) {
            finalHeal = Math.round(finalHeal);
            p.hp = Math.min(p.maxHp, p.hp + finalHeal);
            window.playerStats.recentHeals.push({ time: now, amt: finalHeal });
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `+${finalHeal} HP`,
                "#e74c3c",
              );
            }
          }
        }

        // Artifact: Echo Strike (Phantom Blade)
        if (window.checkArtifactTrait("echo_strike") && Math.random() < 0.3) {
          let echoDmg = pAtk.mul(0.25);
          m.hp = m.hp.sub(echoDmg);
          if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
            window.RenderEngine.spawnDamageEffect(
              mobCenterX,
              mobCenterY - 8,
              echoDmg,
              "echo",
              false,
            );
          }
        }

        // Unique: Sanguine Reaver (Sword Bleed Rupture)
        if (window.hasUniquePassive("weapon_sword")) {
          m.bleedStacks = (m.bleedStacks || 0) + 1;
          if (m.bleedStacks >= 5) {
            m.bleedStacks = 0;
            let ruptureDmg = BigNum.from(pStats.atk || p.atk || 15).mul(3.0);
            m.hp = m.hp.sub(ruptureDmg);
            let siphonedHp = Math.round(p.maxHp * 0.1);
            p.hp = Math.min(p.maxHp, p.hp + siphonedHp);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY,
                ruptureDmg,
                "crit",
                true,
              );
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 20,
                `+${siphonedHp} HP (RUPTURE)`,
                "#2ecc71",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                mobCenterX,
                mobCenterY,
                20,
                "magma_elemental",
                4,
              );
            }
          } else {
            let bleedTick = BigNum.from(pStats.atk || 15).mul(0.2);
            if (pStats.bleedDamageMultiplier) {
              bleedTick = bleedTick.mul(pStats.bleedDamageMultiplier);
            }
            m.hp = m.hp.sub(bleedTick);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 10,
                bleedTick,
                "bleed",
                false,
              );
            }
          }
        }

        // Unique: Maelstrom Gale-Glaive (Wind Gales & Speed Stacks)
        if (isCrit && window.hasUniquePassive("weapon_maelstrom")) {
          window.playerStats.maelstromSpeedStacks = Math.min(
            3,
            (window.playerStats.maelstromSpeedStacks || 0) + 1,
          );
          window.playerStats.maelstromSpeedTimer = 360;
          window.playerStats.galeResonanceTimer = 360;

          let speed = 5.0;
          window.projectiles.push({
            x: p.x,
            y: p.y - 8,
            vx: (dx < 0 ? 1 : -1) * speed,
            vy: 0,
            r: 8,
            type: "maelstrom",
            damage: Math.round(pAtk.mul(0.6).valueOf()),
            life: 140,
          });
        }

        // Unique: Viper's Perfect Stiletto (Reticle Trigger)
        if (
          isCrit &&
          window.hasUniquePassive("dagger_viper") &&
          Math.random() < 0.25
        ) {
          m.perfectStrikeTimer = 120;
          m.perfectStrikeMax = 120;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Viper's Reticle active! Tap target to execute!",
              "#a855f7",
            );
          }
        }

        // Unique: Void-Sovereign Greatsword (Gravitational Room Vacuum)
        if (window.hasUniquePassive("weapon_singularity")) {
          window.triggerGravitationalVacuum(p);
        }

        // Artifact: Dread Presence (25% Chance to execute non-boss mobs under 20% HP)
        let isBossTarget =
          m.type === "dungeon_boss" || m.type === "dungeon_miniboss";
        if (
          window.checkArtifactTrait("dread_presence") &&
          !isBossTarget &&
          m.hp.gt(0)
        ) {
          let mobHpRatio = m.hp.div(m.maxHp).valueOf();
          if (mobHpRatio <= 0.2 && Math.random() < 0.25) {
            let remHp = m.hp;
            m.hp = BigNum.from(0);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY,
                remHp,
                "crit",
                true,
              );
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                mobCenterX,
                mobCenterY - 15,
                "EXECUTE!",
                "#e74c3c",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                mobCenterX,
                mobCenterY,
                15,
                "magma_elemental",
                4,
              );
              window.combatVisuals.triggerScreenShake(5, 10);
            }
          }
        }

        // Artifact: Midas Touch (3% Chance on hit against non-boss mobs for Gold Transmutation)
        if (
          !isBossTarget &&
          m.hp.gt(0) &&
          window.checkArtifactTrait("gold_hoard") &&
          Math.random() < 0.03
        ) {
          let remHp = m.hp;
          m.hp = BigNum.from(0);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              mobCenterX,
              mobCenterY - 18,
              "GOLD TRANSMUTATION!",
              "#ffd700",
            );
          }
          let bonusGold = Math.floor(75 * (1 + window.player.depth * 0.5));
          window.spawnHomingGold(mobCenterX, mobCenterY, bonusGold);
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              mobCenterX,
              mobCenterY,
              25,
              "gold_dungeon",
              5,
            );
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }
        }

        // Dagger Offhand Multi-Strike & Bleed DoT Triggers
        if (pStats.subType === "dagger") {
          if (pStats.offhandChance && Math.random() < pStats.offhandChance) {
            let offhandHit = BigNum.from(pStats.atk || 15).mul(
              pStats.offhandDmg || 0.45,
            );
            m.hp = m.hp.sub(offhandHit);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 6,
                offhandHit,
                "dagger",
                false,
              );
            }
          }

          if (pStats.bleedChance && Math.random() < pStats.bleedChance) {
            let bleedTick = BigNum.from(pStats.atk || 15).mul(0.25);
            if (pStats.bleedDamageMultiplier) {
              bleedTick = bleedTick.mul(pStats.bleedDamageMultiplier);
            }
            m.hp = m.hp.sub(bleedTick);
            m.flashTimer = 6;
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 10,
                bleedTick,
                "bleed",
                false,
              );
            }
          }
        }

        // Tome Spell Cast Trigger
        let isTomeEquipped =
          pStats.subType === "tome" ||
          (window.equippedSlots &&
            window.equippedSlots.subweapon &&
            (window.equippedSlots.subweapon.subType === "tome" ||
              window.equippedSlots.subweapon.type === "tome"));
        let activeSpellChance =
          pStats.spellChance || (isTomeEquipped ? 0.35 : 0);
        let activeSpellType = pStats.spellType || "tri";

        if (isTomeEquipped && Math.random() < activeSpellChance) {
          // Gain +1 Tome Mastery XP on Spell Proc
          if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 1);

          let spellDmg = BigNum.from(pStats.atk || 15).mul(
            pStats.spellPower || 1.5,
          );
          m.hp = m.hp.sub(spellDmg);
          m.flashTimer = 8;

          let spellEffectType = activeSpellType;
          if (activeSpellType === "tri") {
            const triElements = ["fire", "lightning", "frost"];
            spellEffectType =
              triElements[Math.floor(Math.random() * triElements.length)];
          } else if (activeSpellType === "dual_fire_lightning") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "lightning";
          } else if (activeSpellType === "dual_fire_frost") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "frost";
          } else if (activeSpellType === "dual_lightning_frost") {
            spellEffectType = Math.random() < 0.5 ? "lightning" : "frost";
          }

          // Trigger actual visual spells
          if (
            pStats.hasTriadConvergence ||
            (window.SkillTreeManager &&
              window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
              Math.random() < 0.15)
          ) {
            if (window.castVisualSpell) {
              window.castVisualSpell("fire", p, m, pStats, true);
              window.castVisualSpell("lightning", p, m, pStats, true);
              window.castVisualSpell("frost", p, m, pStats, true);
            }
          } else {
            if (window.castVisualSpell) {
              window.castVisualSpell(
                spellEffectType,
                p,
                m,
                pStats,
                pStats.hasElementalOverload,
              );
            }
          }

          // Spell Weaving: Shifting between different element casts boosts Spell Power
          if (pStats.hasSpellWeaving) {
            if (
              window.playerStats.lastSpellCastType &&
              window.playerStats.lastSpellCastType !== spellEffectType
            ) {
              let prevStacks = window.playerStats.spellWeavingStacks || 0;
              window.playerStats.spellWeavingStacks = Math.min(
                4,
                prevStacks + 1,
              );
              window.playerStats.spellWeavingTimer = 240; // 4 seconds
              if (
                window.playerStats.spellWeavingStacks > prevStacks &&
                typeof window.spawnFloatingText === "function"
              ) {
                window.spawnFloatingText(
                  p.x,
                  p.y - 22,
                  `SPELL WEAVING (${window.playerStats.spellWeavingStacks}/4)`,
                  "#38bdf8",
                  true,
                );
              }
            }
            window.playerStats.lastSpellCastType = spellEffectType;
          }

          // Arcane Syphon: Spell procs restore 1%/2%/3% HP, grant +4%/+8%/+12% INT
          if (pStats.hasArcaneSyphon) {
            let healAmt = Math.round(
              p.maxHp * (pStats.arcaneSyphonLevel * 0.01),
            );
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            window.playerStats.syphonIntStacks = Math.min(
              3,
              (window.playerStats.syphonIntStacks || 0) + 1,
            );
            window.playerStats.syphonIntTimer = 360; // 6s at 60 FPS
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `+${healAmt} HP (SYPHON)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Mana Shielding (Restored original Tome heal on spell proc)
          if (pStats.manaShieldingHeal && pStats.manaShieldingHeal > 0) {
            let healAmt = Math.round(p.maxHp * pStats.manaShieldingHeal);
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `+${healAmt} HP (MANA SHIELD)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Triad Convergence / Aetheric Overload Check
          let isOverload =
            window.SkillTreeManager &&
            window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
            Math.random() < 0.15;

          if (pStats.hasTriadConvergence || isOverload) {
            const triElements = ["fire", "lightning", "frost"];
            triElements.forEach((elem, eIdx) => {
              m.hp = m.hp.sub(spellDmg);
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  mobCenterX + (eIdx - 1) * 12,
                  mobCenterY - 12 - eIdx * 6,
                  spellDmg,
                  elem,
                  false,
                );
              }

              // Apply Elemental Overload on each part of the Triad Convergence
              if (pStats.hasElementalOverload) {
                if (elem === "fire") {
                  let splashDmg = spellDmg.mul(
                    pStats.overloadLevel === 1 ? 0.35 : 0.7,
                  );
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      if (otherMob.id !== m.id) {
                        let dist = Math.hypot(
                          m.x - otherMob.x,
                          m.y - otherMob.y,
                        );
                        if (dist <= 80) {
                          otherMob.hp = otherMob.hp.sub(splashDmg);
                          otherMob.flashTimer = 6;
                          if (window.combatVisuals) {
                            window.combatVisuals.spawnDamageEffect(
                              otherMob.x + otherMob.w / 2,
                              otherMob.y + otherMob.h / 2,
                              splashDmg,
                              "fire",
                              false,
                            );
                          }
                        }
                      }
                    });
                  }
                } else if (elem === "lightning") {
                  let bouncesLeft = pStats.overloadLevel;
                  let hitIds = new Set([m.id]);
                  let currentTarget = m;
                  while (bouncesLeft > 0 && window.activeDungeonMobs) {
                    let nextTarget = window.activeDungeonMobs.find(
                      (other) =>
                        !hitIds.has(other.id) &&
                        Math.hypot(
                          currentTarget.x - other.x,
                          currentTarget.y - other.y,
                        ) <= 120,
                    );
                    if (nextTarget) {
                      nextTarget.hp = nextTarget.hp.sub(spellDmg);
                      nextTarget.flashTimer = 6;
                      hitIds.add(nextTarget.id);
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnDamageEffect(
                          nextTarget.x + nextTarget.w / 2,
                          nextTarget.y + nextTarget.h / 2,
                          spellDmg,
                          "lightning",
                          false,
                        );
                      }
                      currentTarget = nextTarget;
                      bouncesLeft--;
                    } else {
                      break;
                    }
                  }
                } else if (elem === "frost") {
                  let slowPct = pStats.overloadLevel === 1 ? 0.2 : 0.4;
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      if (
                        Math.hypot(m.x - otherMob.x, m.y - otherMob.y) <= 80
                      ) {
                        otherMob.speedMultiplier = Math.max(
                          0.2,
                          (otherMob.speedMultiplier || 1.0) - slowPct,
                        );
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnParticles(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            8,
                            "void_orb",
                            1,
                          );
                        }
                      }
                    });
                  }
                }
              }
            });
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_fire");
            }
          } else {
            // Apply single-spell Overload logic
            if (pStats.hasElementalOverload) {
              if (spellEffectType === "fire") {
                let splashDmg = spellDmg.mul(
                  pStats.overloadLevel === 1 ? 0.35 : 0.7,
                );
                if (window.activeDungeonMobs) {
                  window.activeDungeonMobs.forEach((otherMob) => {
                    if (otherMob.id !== m.id) {
                      let dist = Math.hypot(m.x - otherMob.x, m.y - otherMob.y);
                      if (dist <= 80) {
                        otherMob.hp = otherMob.hp.sub(splashDmg);
                        otherMob.flashTimer = 6;
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnDamageEffect(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            splashDmg,
                            "fire",
                            false,
                          );
                        }
                      }
                    }
                  });
                }
              } else if (spellEffectType === "lightning") {
                let bouncesLeft = pStats.overloadLevel;
                let hitIds = new Set([m.id]);
                let currentTarget = m;
                while (bouncesLeft > 0 && window.activeDungeonMobs) {
                  let nextTarget = window.activeDungeonMobs.find(
                    (other) =>
                      !hitIds.has(other.id) &&
                      Math.hypot(
                        currentTarget.x - other.x,
                        currentTarget.y - other.y,
                      ) <= 120,
                  );
                  if (nextTarget) {
                    nextTarget.hp = nextTarget.hp.sub(spellDmg);
                    nextTarget.flashTimer = 6;
                    hitIds.add(nextTarget.id);
                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        nextTarget.x + nextTarget.w / 2,
                        nextTarget.y + nextTarget.h / 2,
                        spellDmg,
                        "lightning",
                        false,
                      );
                    }
                    currentTarget = nextTarget;
                    bouncesLeft--;
                  } else {
                    break;
                  }
                }
              } else if (spellEffectType === "frost") {
                let slowPct = pStats.overloadLevel === 1 ? 0.2 : 0.4;
                if (window.activeDungeonMobs) {
                  window.activeDungeonMobs.forEach((otherMob) => {
                    if (Math.hypot(m.x - otherMob.x, m.y - otherMob.y) <= 80) {
                      otherMob.speedMultiplier = Math.max(
                        0.2,
                        (otherMob.speedMultiplier || 1.0) - slowPct,
                      );
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnParticles(
                          otherMob.x + otherMob.w / 2,
                          otherMob.y + otherMob.h / 2,
                          8,
                          "void_orb",
                          1,
                        );
                      }
                    }
                  });
                }
              }
            }

            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_" + spellEffectType);
            }
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 12,
                spellDmg,
                spellEffectType,
                false,
              );
            }
          }
        }

        // Directional knockback impulse vector
        let dirX = dist > 0 ? dx / dist : 1;
        let dirY = dist > 0 ? dy / dist : 0;
        m.recoilX = -dirX * (isCrit ? 8 : 5);
        m.recoilY = -dirY * (isCrit ? 8 : 5);

        // Spawn directional hit sparks
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            m.x + m.w / 2,
            m.y + m.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        // Trigger high-fidelity polymorphic combat particles (Subphase C.2)
        if (typeof window.spawnCombatImpactParticles === "function") {
          window.spawnCombatImpactParticles(
            m.x + m.w / 2,
            m.y + m.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        if (
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          let targetType = "flesh";
          let vType = m.visualType || "";
          if (vType === "animated_armor" || vType === "corroded_golem") {
            targetType = "metal";
          }
          window.SoundManager.playHitImpact(isCrit, targetType);
        }
      } else if (closestTarget.type === "cavern") {
        let item = closestTarget.obj;
        item.hp--;
        item.flashTimer = 5;
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("hit");
        }
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(item.x, item.y, false);
        }
        if (item.hp <= 0) {
          window.triggerCavernShatter(item);
          let idx = window.cavernInteractives.indexOf(item);
          if (idx !== -1) window.cavernInteractives.splice(idx, 1);
        }
      } else if (closestTarget.type === "breakable") {
        let prop = closestTarget.obj;
        prop.hp--;
        prop.flashTimer = 5;

        if (
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          window.SoundManager.playHitImpact(false, "shatter");
        }
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            closestTarget.x,
            closestTarget.y,
            false,
          );
        }

        if (prop.hp <= 0) {
          window.destroyBreakableProp(prop, closestTarget.x, closestTarget.y);
        }
      }
    }

    // Process active room mobs (Standard logic loop)
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      for (let i = window.activeDungeonMobs.length - 1; i >= 0; i--) {
        let m = window.activeDungeonMobs[i];

        // Intercept Specter wall-passing physics and instant-death contact checks
        if (m.isSpecter) {
          let sDx = p.x - (m.x + m.w / 2);
          let sDy = p.y - (m.y + m.h / 2);
          let sDist = Math.hypot(sDx, sDy);

          if (sDist > 0) {
            let speed = 0.85; // Relentless slow pursuit speed
            m.x += (sDx / sDist) * speed;
            m.y += (sDy / sDist) * speed;
            if (sDx < -1) m.facing = -1;
            else if (sDx > 1) m.facing = 1;
          }

          let pRadius = p.radius || 9;
          if (sDist < pRadius + 12) {
            let massiveDmg = BigNum.from("9.99e150"); // 10^150 absolute death strike
            window.damagePlayer(massiveDmg, m);
          }
          continue; // Completely bypass normal mob separation and collision physics
        }

        // Intercept and update friendly wisp decoy targets
        if (m.isFriendlyWisp) {
          m.wispTimer--;
          m.flashTimer = 0;

          let nearestHostile = window.activeDungeonMobs
            ? window.activeDungeonMobs.find(
                (other) =>
                  !other.isFriendlyWisp &&
                  !other.isCocoon &&
                  !other.isSpore &&
                  !other.isMagmaVent &&
                  other.hp.gt(0) &&
                  other.id !== m.id,
              )
            : null;
          if (!nearestHostile && window.mob && window.mob.hp.gt(0))
            nearestHostile = window.mob;

          if (nearestHostile) {
            let hdx = nearestHostile.x + nearestHostile.w / 2 - (m.x + 12);
            let hdy = nearestHostile.y + nearestHostile.h / 2 - (m.y + 12);
            let hdist = Math.hypot(hdx, hdy);
            if (hdist > 20) {
              m.x += (hdx / hdist) * 1.1; // Slow wisp drift speed
              m.y += (hdy / hdist) * 1.1;
            }
          }

          if (m.wispTimer <= 0) {
            m.hp = BigNum.from(0); // Mark dead for removal
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + 12,
                m.y + 12,
                10,
                "marsh_ghost",
                1.5,
              );
            }
          }
          continue;
        }

        let dx = p.x - (m.x + m.w / 2);
        let dy = p.y - (m.y + m.h / 2);
        let dist = Math.hypot(dx, dy);

        // Apply lightweight separation/repulsion forces to prevent monster clumping
        if (!m.isCocoon && !m.isSpore && !m.isMagmaVent && m.hp.gt(0)) {
          let mCx = m.x + m.w / 2;
          let mCy = m.y + m.h / 2;
          for (let j = 0; j < window.activeDungeonMobs.length; j++) {
            let other = window.activeDungeonMobs[j];
            if (
              other === m ||
              other.hp.lte(0) ||
              other.isCocoon ||
              other.isSpore ||
              other.isMagmaVent
            )
              continue;

            let odx = mCx - (other.x + other.w / 2);
            let ody = mCy - (other.y + other.h / 2);
            let odist = Math.hypot(odx, ody);
            let minSep = 18; // Desired separation boundary distance
            if (odist < minSep && odist > 0.1) {
              let force = (minSep - odist) * 0.15; // spring strength
              let pushX = (odx / odist) * force;
              let pushY = (ody / odist) * force;

              let mapInst = window.activeDungeonMap;
              if (mapInst && mapInst.grid) {
                if (!checkCollisionAt(mapInst, mCx + pushX, mCy, 8)) {
                  m.x += pushX;
                }
                if (!checkCollisionAt(mapInst, mCx, mCy + pushY, 8)) {
                  m.y += pushY;
                }
              } else {
                m.x += pushX;
                m.y += pushY;
              }
              // Recalculate centers
              mCx = m.x + m.w / 2;
              mCy = m.y + m.h / 2;
            }
          }
        }

        // Process Hatching Summons (Sprout Cocoons)
        if (m.isCocoon) {
          m.hatchTimer--;
          m.flashTimer = 0; // prevent red flash unless directly attacked
          if (m.hatchTimer <= 0) {
            m.isCocoon = false;
            m.isRanged = Math.random() < 0.5;
            m.visualType = Math.random() < 0.5 ? "slime" : "sprout";
            m.visualTier = 0;
            m.name =
              m.visualType === "slime" ? "Hatched Slime" : "Hatched Sprout";
            m.atk = Math.round(10 + (window.player.depth || 1) * 3);
            m.hp = m.maxHp; // Refill HP for active minion combat
            m.projectileType = "thorn";
            m.rangedCooldown = 60;
            m.hopTimer = window.randInt(0, 29); // Desynchronize hatched minion jumping phase
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                15,
                "slag_slime",
                3,
              );
            }
            if (window.SoundManager) window.SoundManager.play("spell");
          }
          continue; // Skip standard movement/attack logic while incubating
        }

        // Process Floating Homing Toxic Spores (Swamp Stage Warden)
        if (m.isSpore) {
          m.hatchTimer--; // Repurpose hatchTimer as spore lifetime
          m.flashTimer = 0;

          // Float slowly toward the player's position
          let sDx = p.x - (m.x + m.w / 2);
          let sDy = p.y - (m.y + m.h / 2);
          let sDist = Math.hypot(sDx, sDy);
          if (sDist > 0) {
            let speed = 1.0; // Floating speed
            m.x += (sDx / sDist) * speed;
            m.y += (sDy / sDist) * speed;
          }

          // Detonate on direct contact
          if (sDist < m.w / 2 + (p.radius || 9)) {
            window.damagePlayer(Math.round(m.atk * 1.25), m);
            // Apply 3 stacks of poison
            p.poisonStacks = Math.min(5, (p.poisonStacks || 0) + 3);
            p.poisonTimer = 240; // 4s tick

            if (window.combatVisuals) {
              window.combatVisuals.triggerScreenShake(4, 6);
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                12,
                "swamp_basilisk",
                2.5,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");

            m.hp = BigNum.from(0); // Mark dead for removal
          }

          // Dissolve harmlessly into steam after 6 seconds (360 frames)
          if (m.hatchTimer <= 0 && m.hp.gt(0)) {
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                8,
                "swamp_basilisk",
                1.2,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");
            m.hp = BigNum.from(0); // Mark dead for removal
          }
          continue; // Skip standard movement/attack logic while drifting
        }

        // Process Pulsating Magma Vents (Inferno Stage Warden)
        if (m.isMagmaVent) {
          m.ventTimer--;
          m.flashTimer = 0;

          // Pulsate scale during active boil countdown
          let sizePulse = Math.sin(Date.now() / 60) * 3;
          m.w = 24 + sizePulse;
          m.h = 24 + sizePulse;

          if (m.ventTimer <= 0) {
            // Detonate Cross-Shaped Lava Wave!
            let mcx = m.x + m.w / 2;
            let mcy = m.y + m.h / 2;

            if (window.combatVisuals) {
              window.combatVisuals.triggerScreenShake(5, 8);
              // Spawn fiery lava particles along North, South, East, West axes
              for (let d = -96; d <= 96; d += 16) {
                if (d === 0) continue;
                // Horizontal axis
                window.combatVisuals.particlePool.get(
                  mcx + d,
                  mcy,
                  0,
                  -window.randFloat(0.1, 0.5),
                  window.randFloat(2, 4),
                  "#f97316",
                  0.9,
                  18,
                  0,
                  true,
                  0,
                );
                // Vertical axis
                window.combatVisuals.particlePool.get(
                  mcx,
                  mcy + d,
                  0,
                  -window.randFloat(0.1, 0.5),
                  window.randFloat(2, 4),
                  "#f97316",
                  0.9,
                  18,
                  0,
                  true,
                  0,
                );
              }
            }
            if (window.SoundManager) window.SoundManager.play("spell_fire");

            // Damage player if caught inside the lava crosshairs
            let pxDiff = Math.abs(p.x - mcx);
            let pyDiff = Math.abs(p.y - mcy);
            let isHit =
              (pxDiff <= 96 && pyDiff <= 12) || (pyDiff <= 96 && pxDiff <= 12);
            if (isHit) {
              let parentAtk = m.parentAtk || 25;
              window.damagePlayer(Math.round(parentAtk * 1.3), null);
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 15,
                  "LAVA ERUPTION!",
                  "#f97316",
                );
              }
            }

            m.hp = BigNum.from(0); // Mark dead for removal
          }
          continue; // Skip normal chase/swipe AI for static vents
        }

        // Check Blood Berserker Telegraphed Detonation Countdown
        if (m.isDetonating) {
          m.detonationTimer--;
          m.flashTimer = 2; // Flashing swell feedback during countdown

          if (m.detonationTimer <= 0) {
            let mobCenterX = m.x + (m.w || 24) / 2;
            let mobCenterY = m.y + (m.h || 24) / 2;

            // 1. Detonate Damage-Clamped Explosion on Player
            let dx = p.x - mobCenterX;
            let dy = p.y - mobCenterY;
            if (dx * dx + dy * dy <= 10000) {
              // 100px explosion radius
              let rawExplosionDmg = Math.round(m.atk * 1.0);
              let maxPlayerMaxHpCap = Math.round(p.maxHp * 0.25); // Damage clamped to 25% Max HP ceiling
              let clampedDmg = Math.min(rawExplosionDmg, maxPlayerMaxHpCap);

              window.damagePlayer(clampedDmg, m);
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 12);
                window.combatVisuals.spawnParticles(
                  mobCenterX,
                  mobCenterY,
                  25,
                  "magma_elemental",
                  5,
                );
              }
            }

            // 2. Grant Frenzy to Surviving Nearby Allies
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((m2) => {
                if (m2 === m || m2.hp.lte(0)) return;
                let adx = m2.x + (m2.w || 24) / 2 - mobCenterX;
                let ady = m2.y + (m2.h || 24) / 2 - mobCenterY;
                if (adx * adx + ady * ady <= 14400) {
                  // 120px ally radius
                  m2.buffStacks.haste = 3;
                  m2.buffTimers.haste = 180; // 3 seconds of Frenzy
                }
              });
            }

            if (
              window.RenderEngine &&
              window.RenderEngine.spawnDeathParticles
            ) {
              window.RenderEngine.spawnDeathParticles(
                mobCenterX,
                mobCenterY,
                m.type,
              );
            }

            let rewardGold = Math.floor(15 * (1 + window.player.depth * 0.5));
            let rewardXp = Math.floor(15 + window.player.depth * 4);
            window.spawnHomingGold(mobCenterX, mobCenterY, rewardGold);
            window.spawnHomingXp(mobCenterX, mobCenterY, rewardXp);

            window.activeDungeonMobs.splice(i, 1);
            continue;
          }
          continue; // Freeze movement while detonating
        }

        // Check death state after any potential hit
        if (m.hp.lte(0)) {
          // Reset Spreading Fatigue speed penalty on kill
          window.fatiguePenalty = 0;

          // Check Magma Vent & Spore harmless pop bypass
          if (m.isMagmaVent || m.isSpore) {
            let theme = m.isMagmaVent ? "magma_elemental" : "swamp_basilisk";
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                10,
                theme,
                1.8,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");
            window.activeDungeonMobs.splice(i, 1);
            continue;
          }

          window.playerStats.totalLifetimeKills =
            (window.playerStats.totalLifetimeKills || 0) + 1;
          if (m.isRare) {
            window.playerStats.rareSpawnsSlain =
              (window.playerStats.rareSpawnsSlain || 0) + 1;
          }

          // Trigger 1.2s telegraphed detonation phase for Blood Berserkers
          if (m.eliteAffix === "blood_berserker" && !m.isDetonating) {
            m.isDetonating = true;
            m.detonationTimer = 70; // 70 frames (~1.2s) reaction window
            m.detonationMax = 70;
            m.isStopped = true;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] BLOOD BERSERKER DETONATING!",
                "#e74c3c",
              );
            }
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_fire");
            }
            continue;
          }

          let mobCenterX = m.x + m.w / 2;
          let mobCenterY = m.y + m.h / 2;

          // Trigger Noxious Bloom on qualified death
          if (window.checkAndSpawnNoxiousBloom) {
            window.checkAndSpawnNoxiousBloom(m, mobCenterX, mobCenterY);
          }

          if (
            window.isCavernEffectActive &&
            window.isCavernEffectActive("soul_harvest") &&
            Math.random() < 0.2
          ) {
            window.activeDungeonMobs.push({
              id: window.idCounter++,
              type: "mob",
              visualTier: 4,
              visualType: "marsh_ghost",
              x: mobCenterX - 12,
              y: mobCenterY - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(1),
              maxHp: BigNum.from(1),
              atk: 0,
              flashTimer: 0,
              isFriendlyWisp: true,
              wispTimer: 360,
              discovered: true,
              hopTimer: 0,
            });
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                mobCenterX,
                mobCenterY - 15,
                "SOUL HARVEST!",
                "#34d399",
              );
            }
          }

          if (window.RenderEngine && window.RenderEngine.spawnDeathParticles) {
            window.RenderEngine.spawnDeathParticles(
              mobCenterX,
              mobCenterY,
              m.type,
            );
          }
          let rewardGold = Math.floor(15 * (1 + window.player.depth * 0.5));
          let rewardXp = Math.floor(15 + window.player.depth * 4);
          window.spawnHomingGold(mobCenterX, mobCenterY, rewardGold);
          window.spawnHomingXp(mobCenterX, mobCenterY, rewardXp);

          // 12% Chance to drop a healing heart on standard enemy death
          if (
            Math.random() < 0.12 &&
            typeof window.spawnHomingHearts === "function"
          ) {
            let heartHeal = Math.round(p.maxHp * 0.1);
            window.spawnHomingHearts(mobCenterX, mobCenterY, heartHeal);
          }

          // Monster Souls & Scraps Mob Drop Logic
          let dropMult = pStats.drop || 1.0;
          if (Math.random() < 0.45 * dropMult) {
            let soulCount = Math.floor(Math.random() * 2) + 1;
            window.addDungeonRunScrap(
              "Monster Soul",
              soulCount,
              mobCenterX,
              mobCenterY,
            );
          }

          if (m.isRare) {
            // Utility Keystone: Fortune's Favor (+50% Gold Multiplier for 15s)
            if (
              window.SkillTreeManager &&
              window.SkillTreeManager.getSkillLevel("utility_keystone") > 0
            ) {
              window.playerStats.fortunesFavorTimer = 900; // 15 seconds
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 30,
                  "FORTUNE'S FAVOR (+50% GOLD)",
                  "#ffd700",
                );
              }
            }

            // Artifact: Void Pull (Heal 15% Max HP on Rare kill)
            if (window.checkArtifactTrait("void_pull")) {
              let healAmt = Math.round(p.maxHp * 0.15);
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 20,
                  `+${healAmt} HP (VOID PULL)`,
                  "#a855f7",
                );
              }
            }

            // Unique: Warp-Core Greaves (Spatial Leap Portal Drop on Rare Kill)
            if (
              window.hasUniquePassive("boots_warpcore") &&
              Math.random() < 0.2
            ) {
              let map = window.activeDungeonMap;
              let tSize = map ? map.tileSize : 32;
              let tileX = Math.floor(mobCenterX / tSize);
              let tileY = Math.floor(mobCenterY / tSize);
              if (
                map &&
                map.grid &&
                map.grid[tileY] &&
                map.grid[tileY][tileX] !== undefined
              ) {
                map.grid[tileY][tileX] = window.TILE_TYPES.DESCENT_PORTAL;
                if (typeof window.pushHeaderToast === "function") {
                  window.pushHeaderToast("[✦] SPATIAL RIFT OPENED!", "#1abc9c");
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    mobCenterX,
                    mobCenterY - 15,
                    "SPATIAL RIFT",
                    "#1abc9c",
                  );
                }
                if (window.combatVisuals) {
                  window.combatVisuals.spawnBeam(
                    mobCenterX,
                    "#1abc9c",
                    45,
                    false,
                  );
                }
              }
            }

            window.addDungeonRunScrap(
              "Luminous Soul",
              1,
              mobCenterX,
              mobCenterY,
            );
            let depth = window.player.depth || 1;
            let scrapTier = Math.min(5, Math.floor((depth - 1) / 10));
            let scrapName = window.getScrapYieldName(scrapTier);
            window.addDungeonRunScrap(
              scrapName,
              Math.floor(Math.random() * 3) + 2,
              mobCenterX,
              mobCenterY,
            );
          }

          // Artifact: Frenzy (Berserker Stone) - Increments kill counter
          if (window.checkArtifactTrait("frenzy")) {
            window.playerStats.frenzyKillCount =
              (window.playerStats.frenzyKillCount || 0) + 1;
            if (window.playerStats.frenzyKillCount >= 15) {
              window.playerStats.frenzyKillCount = 0;
              window.playerStats.frenzyTimer = 300; // 5 seconds of Frenzy
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 25,
                  "BERZERKER FRENZY!",
                  "#ff4757",
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnBeam(p.x, "#ff4757", 45, true);
              }
            }
          }

          // Cavern Sigil Drop Logic
          let sigilBaseRate = m.isRare ? 0.08 : 0.006;
          let sigilRollRate = sigilBaseRate * (pStats.drop || 1.0);
          if (Math.random() < sigilRollRate) {
            let maxSigilStars = 0;
            let cleared = window.playerStats.maxFloorCleared || 0;
            if (cleared >= 120) maxSigilStars = 5;
            else if (cleared >= 72) maxSigilStars = 4;
            else if (cleared >= 48) maxSigilStars = 3;
            else if (cleared >= 24) maxSigilStars = 2;
            else if (cleared >= 12) maxSigilStars = 1;
            maxSigilStars = Math.max(1, maxSigilStars);

            let rolledSigilRarity = window.rollSigilRarity(
              maxSigilStars,
              pStats.qly || 1.0,
            );
            let stageScale = window.player.depth || 1;
            let sigilItem = window.createItemObject(
              "sigil",
              rolledSigilRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(sigilItem, mobCenterX, mobCenterY);
          }

          // 5% Chance Mob Equipment Drop (Blocked in Crucible/Onslaught Mode)
          if (!window.playerStats.isCrucibleMode && Math.random() < 0.05) {
            let stageScale = window.player.depth || 1;
            let rolledRarity = window.rollItemRarity(
              window.playerStats.maxFloorCleared || 0,
              pStats.qly || 1.0,
              false,
            );
            let types = [
              "weapon",
              "subweapon",
              "helmet",
              "chest",
              "boots",
              "ring",
            ];
            let chosenType = types[Math.floor(Math.random() * types.length)];
            let droppedItem = window.createItemObject(
              chosenType,
              rolledRarity,
              stageScale,
              0,
            );

            window.spawnGroundLoot(droppedItem, mobCenterX, mobCenterY);
          }

          window.activeDungeonMobs.splice(i, 1);
          continue;
        }

        // Mob Contact Melee Attack on Player
        if (dist < 20 && m.attackCooldown <= 0) {
          m.attackCooldown = 60; // 1s attack cooldown
          window.damagePlayer(m.atk, m);
          if (p.hp <= 0) {
            window.startDeathSequence();
          }
        }
      }
    }

    // Process Boss Warden Combat
    if (window.mob && window.mob.hp) {
      let bm = window.mob;
      window.BossAIEngine.update(bm);

      let dx = p.x - (bm.x + bm.w / 2);
      let dy = p.y - (bm.y + bm.h / 2);
      let dist = Math.hypot(dx, dy);

      if (dist < 48 && p.attackTimer >= 20) {
        p.attackTimer = 0;

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("swing");
        }

        let bossCenterX = bm.x + bm.w / 2;
        // Face the boss being attacked!
        let dxToBoss = bossCenterX - p.x;
        if (dxToBoss < -0.1) p.facing = -1;
        else if (dxToBoss > 0.1) p.facing = 1;

        let isCrit = Math.random() < (pStats.critChance || 0.05);
        let critMult = isCrit ? pStats.critDamage || 1.5 : 1.0;
        let pAtk = BigNum.from(pStats.atk || p.atk).mul(critMult);

        // Track Critical Streaks for Wind-Razor Flurry (Boss)
        let windFlurryLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
          : 0;
        if (windFlurryLevel > 0) {
          if (isCrit) {
            window.playerStats.critStreak =
              (window.playerStats.critStreak || 0) + 1;
            if (window.playerStats.critStreak >= 3) {
              window.playerStats.critStreak = 0;
              window.triggerWindRazorStrike(bm);
            }
          } else {
            window.playerStats.critStreak = 0; // Reset streak on non-crit
          }
        }

        // REDUCE DAMAGE BY 90% IF ELDRITCH BARK SHIELD IS ACTIVE!
        if (bm.actionState === "bark_shield") {
          pAtk = pAtk.mul(0.1);
        }

        // CYBER BARRIER (NEXUS OVERSEER) IMMUNITY
        if (bm.actionState === "cyber_barrier") {
          pAtk = BigNum.from(0);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              bm.x + bm.w / 2,
              bm.y - 12,
              "SYSTEM IMMUNE",
              "#ff007f",
            );
          }
          if (window.SoundManager) window.SoundManager.play("block");
        }

        // STAGGER SHIELD ABSORPTION (CHRONOS & GILDED KEEPER)
        if (
          bm.actionState === "chrono_rewind" ||
          bm.actionState === "taxation"
        ) {
          let dmgVal = pAtk.valueOf();
          bm.staggerShield = bm.staggerShield.sub(dmgVal);

          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              pAtk,
              "static",
              false,
            );
          }

          if (bm.staggerShield.lte(0)) {
            bm.staggerShield = BigNum.from(0);
            bm.actionState = "idle";
            bm.state = "idle";
            bm.isStopped = false;
            bm.dazeTimer = 210; // 3.5s daze stun
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                bm.x + bm.w / 2,
                bm.y - 12,
                "SHIELD BROKEN! DAZED!",
                "#ffd700",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                bm.x + bm.w / 2,
                bm.y + bm.h / 2,
                25,
                "gold_dungeon",
                3,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
          }
          pAtk = BigNum.from(0); // 0 direct damage to boss HP
        }

        // DAZED STUN DAMAGE AMPLIFICATION (Takes 50% more damage)
        if (bm.dazeTimer > 0) {
          pAtk = pAtk.mul(1.5);
        }

        // AEGIS GOLIATH DIRECTIONAL SHIELD CALCULATIONS
        if (
          bm.bossKey === "aegis_goliath" &&
          bm.phase === 2 &&
          !(bm.dazeTimer > 0)
        ) {
          if (bm.shieldAngle !== undefined) {
            let bCenterX = bm.x + bm.w / 2;
            let bCenterY = bm.y + bm.h / 2;
            let attackAngle = Math.atan2(p.y - bCenterY, p.x - bCenterX);
            let angleDiff = Math.abs(
              Math.atan2(
                Math.sin(attackAngle - bm.shieldAngle),
                Math.cos(attackAngle - bm.shieldAngle),
              ),
            );

            // Frontal attack hits his raised Tower Shield!
            if (angleDiff < 0.6) {
              pAtk = BigNum.from(0);
              bm.flashTimer = 4;
              if (window.SoundManager) window.SoundManager.play("block");
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  bCenterX + Math.cos(bm.shieldAngle) * (bm.w * 0.75),
                  bCenterY + Math.sin(bm.shieldAngle) * (bm.w * 0.75),
                  8,
                  "aegis_goliath",
                  2,
                );
                window.spawnFloatingText(
                  bm.x + bm.w / 2,
                  bm.y - 12,
                  "BLOCKED!",
                  "#00d2ff",
                );
              }
            }
          }
        }

        bm.hp = bm.hp.sub(pAtk);
        bm.hasTakenDamage = true;
        bm.flashTimer = 6;

        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("temporal_echo")
        ) {
          window.temporalEchoQueue = window.temporalEchoQueue || [];
          window.temporalEchoQueue.push({
            targetId: bm.id,
            damage: pAtk.mul(0.35),
            timer: 72, // 1.2s delay
          });
        }

        let rawHitNum = pAtk.valueOf ? pAtk.valueOf() : Number(pAtk);
        window.playerStats.peakSingleHit = Math.max(
          window.playerStats.peakSingleHit || 0,
          rawHitNum,
        );

        let bmMaxHpNum = bm.maxHp.valueOf
          ? bm.maxHp.valueOf()
          : Number(bm.maxHp || 1);
        if (isCrit && bmMaxHpNum > 0 && rawHitNum / bmMaxHpNum >= 10) {
          window.playerStats.hasTriggeredOverkill = true;
        }

        let curHr = new Date().getHours();
        if (curHr >= 0 && curHr < 4)
          window.playerStats.hasTriggeredNightOwl = true;
        if (curHr >= 5 && curHr < 8)
          window.playerStats.hasTriggeredEarlyBird = true;
        let curDay = new Date().getDay();
        if (curDay === 0 || curDay === 6)
          window.playerStats.hasTriggeredWeekendWarrior = true;

        let dirX = dist > 0 ? dx / dist : 1;
        let dirY = dist > 0 ? dy / dist : 0;
        bm.recoilX = -dirX * (isCrit ? 10 : 6);
        bm.recoilY = -dirY * (isCrit ? 10 : 6);

        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        // Trigger high-fidelity polymorphic combat particles (Subphase C.2)
        if (typeof window.spawnCombatImpactParticles === "function") {
          window.spawnCombatImpactParticles(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
          window.RenderEngine.spawnDamageEffect(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            pAtk,
            "slash",
            isCrit,
          );
        }

        if (
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          let targetType = "flesh";
          let vType = bm.visualType || "";
          if (vType === "overlord_iron_vault" || vType === "aegis_goliath") {
            targetType = "metal";
          }
          window.SoundManager.playHitImpact(isCrit, targetType);
        }

        // Define vertical center for boss offhand procs
        let bossCenterY = bm.y + bm.h / 2;

        // Dagger Offhand Multi-Strike & Bleed DoT Triggers on Boss
        if (pStats.subType === "dagger") {
          if (pStats.offhandChance && Math.random() < pStats.offhandChance) {
            let offhandHit = BigNum.from(pStats.atk || 15).mul(
              pStats.offhandDmg || 0.45,
            );
            bm.hp = bm.hp.sub(offhandHit);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 6,
                offhandHit,
                "dagger",
                false,
              );
            }
          }

          if (pStats.bleedChance && Math.random() < pStats.bleedChance) {
            let bleedTick = BigNum.from(pStats.atk || 15).mul(0.25);
            if (pStats.bleedDamageMultiplier) {
              bleedTick = bleedTick.mul(pStats.bleedDamageMultiplier);
            }
            bm.hp = bm.hp.sub(bleedTick);
            bm.flashTimer = 6;
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 10,
                bleedTick,
                "bleed",
                false,
              );
            }
          }
        }

        // Tome Spell Cast Trigger on Boss
        let isTomeEquipped =
          pStats.subType === "tome" ||
          (window.equippedSlots &&
            window.equippedSlots.subweapon &&
            (window.equippedSlots.subweapon.subType === "tome" ||
              window.equippedSlots.subweapon.type === "tome"));
        let activeSpellChance =
          pStats.spellChance || (isTomeEquipped ? 0.35 : 0);
        let activeSpellType = pStats.spellType || "tri";

        if (isTomeEquipped && Math.random() < activeSpellChance) {
          // Gain +1 Tome Mastery XP on Spell Proc (Boss)
          if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 1);

          let spellDmg = BigNum.from(pStats.atk || 15).mul(
            pStats.spellPower || 1.5,
          );
          bm.hp = bm.hp.sub(spellDmg);
          bm.flashTimer = 8;

          let spellEffectType = activeSpellType;
          if (activeSpellType === "tri") {
            const triElements = ["fire", "lightning", "frost"];
            spellEffectType =
              triElements[Math.floor(Math.random() * triElements.length)];
          } else if (activeSpellType === "dual_fire_lightning") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "lightning";
          } else if (activeSpellType === "dual_fire_frost") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "frost";
          } else if (activeSpellType === "dual_lightning_frost") {
            spellEffectType = Math.random() < 0.5 ? "lightning" : "frost";
          }

          // Trigger actual visual spells (Boss)
          if (
            pStats.hasTriadConvergence ||
            (window.SkillTreeManager &&
              window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
              Math.random() < 0.15)
          ) {
            if (window.castVisualSpell) {
              window.castVisualSpell("fire", p, bm, pStats, true);
              window.castVisualSpell("lightning", p, bm, pStats, true);
              window.castVisualSpell("frost", p, bm, pStats, true);
            }
          } else {
            if (window.castVisualSpell) {
              window.castVisualSpell(
                spellEffectType,
                p,
                bm,
                pStats,
                pStats.hasElementalOverload,
              );
            }
          }

          // Spell Weaving (Boss)
          if (pStats.hasSpellWeaving) {
            if (
              window.playerStats.lastSpellCastType &&
              window.playerStats.lastSpellCastType !== spellEffectType
            ) {
              window.playerStats.spellWeavingStacks = Math.min(
                4,
                (window.playerStats.spellWeavingStacks || 0) + 1,
              );
              window.playerStats.spellWeavingTimer = 240;
            }
            window.playerStats.lastSpellCastType = spellEffectType;
          }

          // Arcane Syphon (Boss)
          if (pStats.hasArcaneSyphon) {
            let healAmt = Math.round(
              p.maxHp * (pStats.arcaneSyphonLevel * 0.01),
            );
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            window.playerStats.syphonIntStacks = Math.min(
              3,
              (window.playerStats.syphonIntStacks || 0) + 1,
            );
            window.playerStats.syphonIntTimer = 360;
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `+${healAmt} HP (SYPHON)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Mana Shielding (Restored original Tome heal on spell proc - Boss)
          if (pStats.manaShieldingHeal && pStats.manaShieldingHeal > 0) {
            let healAmt = Math.round(p.maxHp * pStats.manaShieldingHeal);
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `+${healAmt} HP (MANA SHIELD)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Triad Convergence / Aetheric Overload Check (Boss)
          let isOverload =
            window.SkillTreeManager &&
            window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
            Math.random() < 0.15;

          if (pStats.hasTriadConvergence || isOverload) {
            const triElements = ["fire", "lightning", "frost"];
            triElements.forEach((elem, eIdx) => {
              bm.hp = bm.hp.sub(spellDmg);
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  bossCenterX + (eIdx - 1) * 12,
                  bossCenterY - 12 - eIdx * 6,
                  spellDmg,
                  elem,
                  false,
                );
              }

              if (pStats.hasElementalOverload) {
                if (elem === "fire") {
                  let splashDmg = spellDmg.mul(
                    pStats.overloadLevel === 1 ? 0.35 : 0.7,
                  );
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      let dist = Math.hypot(
                        bm.x - otherMob.x,
                        bm.y - otherMob.y,
                      );
                      if (dist <= 100) {
                        otherMob.hp = otherMob.hp.sub(splashDmg);
                        otherMob.flashTimer = 6;
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnDamageEffect(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            splashDmg,
                            "fire",
                            false,
                          );
                        }
                      }
                    });
                  }
                } else if (elem === "lightning") {
                  let bouncesLeft = pStats.overloadLevel;
                  let hitIds = new Set();
                  let currentTarget = bm;
                  while (bouncesLeft > 0 && window.activeDungeonMobs) {
                    let nextTarget = window.activeDungeonMobs.find(
                      (other) =>
                        !hitIds.has(other.id) &&
                        Math.hypot(
                          currentTarget.x - other.x,
                          currentTarget.y - other.y,
                        ) <= 120,
                    );
                    if (nextTarget) {
                      nextTarget.hp = nextTarget.hp.sub(spellDmg);
                      nextTarget.flashTimer = 6;
                      hitIds.add(nextTarget.id);
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnDamageEffect(
                          nextTarget.x + nextTarget.w / 2,
                          nextTarget.y + nextTarget.h / 2,
                          spellDmg,
                          "lightning",
                          false,
                        );
                      }
                      currentTarget = nextTarget;
                      bouncesLeft--;
                    } else {
                      break;
                    }
                  }
                } else if (elem === "frost") {
                  let slowPct = pStats.overloadLevel === 1 ? 0.2 : 0.4;
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      if (
                        Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y) <= 100
                      ) {
                        otherMob.speedMultiplier = Math.max(
                          0.2,
                          (otherMob.speedMultiplier || 1.0) - slowPct,
                        );
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnParticles(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            8,
                            "void_orb",
                            1,
                          );
                        }
                      }
                    });
                  }
                }
              }
            });
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_fire");
            }
          } else {
            if (pStats.hasElementalOverload) {
              if (spellEffectType === "fire") {
                let splashDmg = spellDmg.mul(
                  pStats.overloadLevel === 1 ? 0.35 : 0.7,
                );
                if (window.activeDungeonMobs) {
                  window.activeDungeonMobs.forEach((otherMob) => {
                    let dist = Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y);
                    if (dist <= 100) {
                      otherMob.hp = otherMob.hp.sub(splashDmg);
                      otherMob.flashTimer = 6;
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnDamageEffect(
                          otherMob.x + otherMob.w / 2,
                          otherMob.y + otherMob.h / 2,
                          splashDmg,
                          "fire",
                          false,
                        );
                      }
                    }
                  });
                }
              } else if (spellEffectType === "lightning") {
                let bouncesLeft = pStats.overloadLevel;
                let hitIds = new Set();
                let currentTarget = bm;
                while (bouncesLeft > 0 && window.activeDungeonMobs) {
                  let nextTarget = window.activeDungeonMobs.find(
                    (other) =>
                      !hitIds.has(other.id) &&
                      Math.hypot(
                        currentTarget.x - other.x,
                        currentTarget.y - other.y,
                      ) <= 120,
                  );
                  if (nextTarget) {
                    nextTarget.hp = nextTarget.hp.sub(spellDmg);
                    nextTarget.flashTimer = 6;
                    hitIds.add(nextTarget.id);
                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        nextTarget.x + nextTarget.w / 2,
                        nextTarget.y + nextTarget.h / 2,
                        spellDmg,
                        "lightning",
                        false,
                      );
                    }
                    currentTarget = nextTarget;
                    bouncesLeft--;
                  } else {
                    break;
                  }
                }
              } else if (spellEffectType === "frost") {
                let slowPct = pStats.overloadLevel === 1 ? 0.2 : 0.4;
                if (window.activeDungeonMobs) {
                  window.activeDungeonMobs.forEach((otherMob) => {
                    if (
                      Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y) <= 100
                    ) {
                      otherMob.speedMultiplier = Math.max(
                        0.2,
                        (otherMob.speedMultiplier || 1.0) - slowPct,
                      );
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnParticles(
                          otherMob.x + otherMob.w / 2,
                          otherMob.y + otherMob.h / 2,
                          8,
                          "void_orb",
                          1,
                        );
                      }
                    }
                  });
                }
              }
            }

            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_" + spellEffectType);
            }
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 12,
                spellDmg,
                spellEffectType,
                false,
              );
            }
          }
        }

        if (bm.hp.lte(0)) {
          window.playerStats.totalLifetimeKills =
            (window.playerStats.totalLifetimeKills || 0) + 1;
          window.playerStats.rareSpawnsSlain =
            (window.playerStats.rareSpawnsSlain || 0) + 1;

          if (window.spawnDeathParticles) {
            window.spawnDeathParticles(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              "boss",
            );
          }
          let rewardGold = Math.floor(150 * (1 + window.player.depth * 0.5));
          let rewardXp = Math.floor(120 + window.player.depth * 25);
          window.spawnHomingGold(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardGold);
          window.spawnHomingXp(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardXp);

          let bossCenterX = bm.x + bm.w / 2;
          let bossCenterY = bm.y + bm.h / 2;

          // Trigger Noxious Bloom on Boss death
          if (window.checkAndSpawnNoxiousBloom) {
            window.checkAndSpawnNoxiousBloom(bm, bossCenterX, bossCenterY);
          }

          // Guaranteed 1-3 healing hearts on Boss defeat
          if (typeof window.spawnHomingHearts === "function") {
            let heartHeal = Math.round(p.maxHp * 0.15);
            let numHearts = window.randInt(1, 3);
            for (let h = 0; h < numHearts; h++) {
              window.spawnHomingHearts(
                bm.x + bm.w / 2,
                bm.y + bm.h / 2,
                heartHeal,
              );
            }
          }

          // Boss Material Payload
          let soulCount = Math.floor(Math.random() * 4) + 3;
          window.addDungeonRunScrap(
            "Monster Soul",
            soulCount,
            bossCenterX,
            bossCenterY,
          );

          let depth = window.player.depth || 1;
          let scrapTier = Math.min(5, Math.floor((depth - 1) / 10));
          let scrapName = window.getScrapYieldName(scrapTier);
          window.addDungeonRunScrap(
            scrapName,
            Math.floor(Math.random() * 3) + 2,
            bossCenterX,
            bossCenterY,
          );

          if (depth >= 12 && Math.random() < 0.6) {
            window.addDungeonRunScrap(
              "Eridium Shard",
              1,
              bossCenterX,
              bossCenterY,
            );
          }

          // Cavern Sigil Drop Logic for Bosses
          let isMini = bm.type === "dungeon_miniboss";
          let sigilBaseRate = isMini ? 0.2 : 0.5;
          let sigilRollRate = sigilBaseRate * (pStats.drop || 1.0);
          if (Math.random() < sigilRollRate) {
            let maxSigilStars = 0;
            let cleared = window.playerStats.maxFloorCleared || 0;
            if (cleared >= 120) maxSigilStars = 5;
            else if (cleared >= 72) maxSigilStars = 4;
            else if (cleared >= 48) maxSigilStars = 3;
            else if (cleared >= 24) maxSigilStars = 2;
            else if (cleared >= 12) maxSigilStars = 1;
            maxSigilStars = Math.max(1, maxSigilStars);

            let rolledSigilRarity = window.rollSigilRarity(
              maxSigilStars,
              pStats.qly || 1.0,
            );
            let stageScale = window.player.depth || 1;
            let sigilItem = window.createItemObject(
              "sigil",
              rolledSigilRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(sigilItem, bm.x + bm.w / 2, bm.y + bm.h / 2);
          }

          // Standard On-Stage Boss Equipment Drop (Blocked in Crucible/Onslaught Mode)
          if (!window.playerStats.isCrucibleMode) {
            let stageScale = depth;
            let rolledRarity = window.rollItemRarity(
              window.playerStats.maxFloorCleared || 0,
              pStats.qly || 1.0,
              false,
            );
            let types = [
              "weapon",
              "subweapon",
              "helmet",
              "chest",
              "boots",
              "ring",
            ];
            let chosenType = types[Math.floor(Math.random() * types.length)];
            let bossEquip = window.createItemObject(
              chosenType,
              rolledRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(bossEquip, bossCenterX, bossCenterY);
          }

          // First-Time Boss Clear Key Reward Logic
          if (!window.playerStats.firstClearBosses)
            window.playerStats.firstClearBosses = [];
          if (!window.playerStats.firstClearBosses.includes(depth)) {
            window.playerStats.firstClearBosses.push(depth);
            let isMajorBoss = depth % 12 === 0;

            // Direct to Vault
            window.addEtcDrop("Gacha Key", 1, false);
            if (isMajorBoss) {
              window.addEtcDrop("Glimmering Gachapon Key", 1, false);
            }

            if (typeof window.pushHeaderToast === "function") {
              let toastMsg = isMajorBoss
                ? "FIRST CLEAR BONUS: +1 Gacha Key & +1 Glimmering Key (Vaulted)!"
                : "FIRST CLEAR BONUS: +1 Gacha Key (Vaulted)!";
              window.pushHeaderToast(toastMsg, "#f1c40f");
            }
          }

          if (window.hasUniquePassive("boots_warpcore")) {
            window.playerStats.warpCoreSprintTimer = 240; // 4 seconds of Maximum Haste
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "WARP-CORE MAX HASTE!",
                "#1abc9c",
              );
            }

            // Unique: Warp-Core Greaves (Spatial Leap Portal Drop on Boss Defeat)
            if (Math.random() < 0.2) {
              let map = window.activeDungeonMap;
              let tSize = map ? map.tileSize : 32;
              let tileX = Math.floor(bossCenterX / tSize);
              let tileY = Math.floor(bossCenterY / tSize);
              if (
                map &&
                map.grid &&
                map.grid[tileY] &&
                map.grid[tileY][tileX] !== undefined
              ) {
                map.grid[tileY][tileX] = window.TILE_TYPES.DESCENT_PORTAL;
                if (typeof window.pushHeaderToast === "function") {
                  window.pushHeaderToast("[✦] SPATIAL RIFT OPENED!", "#1abc9c");
                }
              }
            }
          }

          let tileX = bm.bossTileX || Math.floor(bm.x / 32);
          let tileY = bm.bossTileY || Math.floor(bm.y / 32);
          window.mob = null;
          window.onBossDefeated(tileX, tileY);
        }
      }

      // Telegraphed Boss Ability AI Engine
      if (bm && bm.hp.gt(0)) {
        let bossCenterX = bm.x + bm.w / 2;
        let bossCenterY = bm.y + bm.h / 2;

        if (bm.state === "telegraphing") {
          bm.telegraphTimer--;
          if (bm.telegraphTimer <= 0) {
            // Detonate Telegraphed Attack
            bm.state = "idle";
            bm.attackCooldown = 110;

            let ability = bm.activeAbility;
            if (ability === "slam") {
              let hitDist = Math.hypot(p.x - bm.targetX, p.y - bm.targetY);
              if (hitDist <= 64) {
                let slamDmg = Math.round(bm.atk * 1.8);
                window.damagePlayer(slamDmg, bm);
                if (p.hp <= 0) window.startDeathSequence();
              }
            } else if (ability === "nova") {
              for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                let speed = 3.8;
                window.projectiles.push({
                  x: bossCenterX,
                  y: bossCenterY,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  r: 6,
                  pulseOffset: i,
                  type: "boss_nova",
                  damage: Math.round(bm.atk * 1.1),
                  life: 120,
                });
              }
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("spell_fire");
              }
            } else if (ability === "charge") {
              let dashDx = bm.targetX - bossCenterX;
              let dashDy = bm.targetY - bossCenterY;
              let dashDist = Math.hypot(dashDx, dashDy);
              if (dashDist > 0) {
                bm.x += (dashDx / dashDist) * 75;
                bm.y += (dashDy / dashDist) * 75;
              }
              let hitDist = Math.hypot(
                p.x - (bm.x + bm.w / 2),
                p.y - (bm.y + bm.h / 2),
              );
              if (hitDist <= 42) {
                let chargeDmg = Math.round(bm.atk * 1.5);
                window.damagePlayer(chargeDmg, bm);
                if (p.hp <= 0) window.startDeathSequence();
              }
            }
            bm.activeAbility = null;
          }
        } else if (bm.attackCooldown <= 0 && dist < 220) {
          // Roll new telegraphed ability
          let moves = bm.moveset || ["slam", "nova", "charge"];
          let chosen = moves[Math.floor(Math.random() * moves.length)];

          bm.state = "telegraphing";
          bm.activeAbility = chosen;
          bm.maxTelegraphTimer = 65;
          bm.telegraphTimer = bm.maxTelegraphTimer;
          bm.targetX = p.x;
          bm.targetY = p.y;
        } else if (dist < 30 && bm.attackCooldown <= 0) {
          bm.attackCooldown = 60;
          p.hp = Math.max(0, p.hp - bm.atk);
          window.spawnFloatingText(p.x, p.y - 15, `-${bm.atk}`, "#e74c3c");
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("block");
          }
          window.updateHUD();
          if (p.hp <= 0) window.startDeathSequence();
        }
      }
    }

    // Update Active Projectiles and Test Player & Wall Hitboxes
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
      let proj = window.projectiles[i];
      proj.life--;

      // Custom Boomerang Shield Kinematics
      if (proj.type === "boomerang" && window.mob) {
        let bm = window.mob;
        let bCx = bm.x + bm.w / 2;
        let bCy = bm.y + bm.h / 2;
        let bdx = bCx - proj.x;
        let bdy = bCy - proj.y;
        let bdist = Math.hypot(bdx, bdy);
        if (bdist > 0) {
          proj.vx += (bdx / bdist) * 0.24;
          proj.vy += (bdy / bdist) * 0.24;
        }
        let speed = Math.hypot(proj.vx, proj.vy);
        if (speed > 5.5) {
          proj.vx = (proj.vx / speed) * 5.5;
          proj.vy = (proj.vy / speed) * 5.5;
        }
      }

      proj.x += proj.vx;
      proj.y += proj.vy;

      // Spawning Style-Mapped Projectile Trails (Subphase C.3)
      if (window.particles && window.ParticlePool && Math.random() < 0.45) {
        let color = "#ffffff";
        let style = "circle";
        let pSize = window.randFloat(1.2, 2.4);
        let gravity = 0;
        let drag = 1.0;
        let spinSpeed = 0;
        let scaleDecay = 0.04;

        if (proj.type === "fireball") {
          color = Math.random() < 0.5 ? "#f97316" : "#fef08a";
          style = "streak";
          gravity = -0.04; // drift upward slightly
        } else if (proj.type === "frost") {
          color = Math.random() < 0.5 ? "#38bdf8" : "#ffffff";
          style = "polygon";
          spinSpeed = window.randFloat(-0.15, 0.15);
        } else if (proj.type === "void" || proj.type === "boss_nova") {
          color = Math.random() < 0.5 ? "#a855f7" : "#e879f9";
          style = "sparkle_star";
          scaleDecay = 0.055;
        } else if (proj.type === "thorn") {
          color = Math.random() < 0.5 ? "#22c55e" : "#15803d";
          style = "polygon";
          spinSpeed = window.randFloat(-0.22, 0.22);
        } else if (proj.type === "maelstrom") {
          color = "#a3fd83";
          style = "streak";
          drag = 0.95;
        }

        let pt = window.ParticlePool.get(
          proj.x - proj.vx * 0.35,
          proj.y - proj.vy * 0.35,
          -proj.vx * 0.15 + window.randFloat(-0.3, 0.3),
          -proj.vy * 0.15 + window.randFloat(-0.3, 0.3),
          pSize,
          color,
          0.72,
          window.randInt(11, 20),
          0,
          gravity,
          true,
          drag,
        );
        pt.style = style;
        if (spinSpeed) pt.spinSpeed = spinSpeed;
        pt.scaleDecay = scaleDecay;
        window.particles.push(pt);
      }

      let map = window.activeDungeonMap;
      if (map && map.grid && checkCollisionAt(map, proj.x, proj.y, proj.r)) {
        if (window.combatVisuals) {
          if (
            typeof window.combatVisuals.spawnProjectileImpact === "function"
          ) {
            window.combatVisuals.spawnProjectileImpact(
              proj.x,
              proj.y,
              proj.type || "standard",
            );
          } else {
            window.combatVisuals.spawnParticles(
              proj.x,
              proj.y,
              6,
              "default",
              3,
            );
          }
        }
        window.projectiles.splice(i, 1);
        continue;
      }

      let projDist = Math.hypot(p.x - proj.x, p.y - proj.y);
      if (projDist < proj.r + (p.radius || 9)) {
        window.damagePlayer(proj.damage, null);
        if (window.combatVisuals) {
          if (
            typeof window.combatVisuals.spawnProjectileImpact === "function"
          ) {
            window.combatVisuals.spawnProjectileImpact(
              proj.x,
              proj.y,
              proj.type || "standard",
            );
          } else {
            window.combatVisuals.spawnParticles(
              proj.x,
              proj.y,
              8,
              "default",
              4,
            );
          }
        }
        window.projectiles.splice(i, 1);
        if (p.hp <= 0) window.startDeathSequence();
        continue;
      }

      if (proj.life <= 0) {
        if (
          window.combatVisuals &&
          typeof window.combatVisuals.spawnProjectileImpact === "function"
        ) {
          window.combatVisuals.spawnProjectileImpact(
            proj.x,
            proj.y,
            proj.type || "standard",
          );
        }
        window.projectiles.splice(i, 1);
      }
    }
  };

  function render() {
    // Fill entire canvas with dark abyssal void background to eliminate white border bleed
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let map = window.activeDungeonMap;
    if (!map || !map.grid || map.grid.length === 0) return;

    let tileSize = map.tileSize;
    let p = window.player;
    let camera = window.DungeonCamera;
    let isHub = window.currentGameState === window.GAME_STATES.HUB;

    camera.viewportW = canvas.width;
    camera.viewportH = canvas.height;
    camera.update(p.x, p.y, map.width * tileSize, map.height * tileSize);

    // 1. Render Map Base & Ground Portals
    window.renderTopDownMap(ctx, canvas);

    // Render Active Room Mobs & Boss in Top-Down Space
    ctx.save();
    ctx.scale(window.DungeonCamera.zoom, window.DungeonCamera.zoom);
    ctx.translate(
      -Math.floor(window.DungeonCamera.x),
      -Math.floor(window.DungeonCamera.y),
    );

    // Helper to Render Enemy Overhead Healthbar with White Chasing Fill
    let drawMobOverheadBar = function (cCtx, m) {
      if (!m || !m.hp || !m.maxHp) return;
      let bHp = BigNum.from(m.hp);
      let bMaxHp = BigNum.from(m.maxHp);

      let hpPct = 1.0;
      if (bMaxHp.gt(0)) {
        let div = bHp.div(bMaxHp);
        hpPct = Math.max(
          0,
          Math.min(1, div.m * Math.pow(10, Math.min(15, div.e))),
        );
      }

      if (m.trailingPct === undefined) m.trailingPct = hpPct;
      if (m.trailingPct > hpPct) {
        m.trailingPct = Math.max(hpPct, m.trailingPct - 0.015);
      } else {
        m.trailingPct = hpPct;
      }

      if (!m.hasTakenDamage && hpPct < 1.0) {
        m.hasTakenDamage = true;
      }

      if (m.hasTakenDamage && m.hp.gt(0)) {
        let barW = Math.max(24, m.w || 24);
        let barH = 5;
        let barX = m.x + (m.w || 24) / 2 - barW / 2;
        let barY = m.y - 8;

        cCtx.fillStyle = "rgba(10, 10, 10, 0.85)";
        cCtx.fillRect(barX, barY, barW, barH);

        // White Chasing Bar
        cCtx.fillStyle = "#ffffff";
        cCtx.fillRect(barX, barY, barW * m.trailingPct, barH);

        // Current Crimson HP Bar
        cCtx.fillStyle = "#e74c3c";
        cCtx.fillRect(barX, barY, barW * hpPct, barH);

        cCtx.strokeStyle = "#000000";
        cCtx.lineWidth = 1.2;
        cCtx.strokeRect(barX, barY, barW, barH);
      }
    };

    // 2. Y-Sorted Depth Queue (Structures, Mobs, Boss, and Hero)
    let depthQueue = [];
    let mapInst = window.activeDungeonMap;
    let tSize = mapInst ? mapInst.tileSize : 32;

    // A. Hub Stations (Hub State)
    if (
      window.currentGameState === window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.stations
    ) {
      mapInst.stations.forEach((st) => {
        depthQueue.push({
          yBase: st.y * tSize + 24,
          draw: () => {
            if (window.drawDungeonStructureTile) {
              window.drawDungeonStructureTile(
                ctx,
                st.type,
                st.x * tSize,
                st.y * tSize,
                tSize,
              );
            }
          },
        });
      });
    }

    // B. Chest Spawns (Dungeon State - Fog-of-War Culled)
    if (
      window.currentGameState !== window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.grid
    ) {
      let camera = window.DungeonCamera;
      let startCol = Math.max(0, Math.floor(camera.x / tSize));
      let endCol = Math.min(
        mapInst.width - 1,
        Math.ceil((camera.x + camera.viewportW / camera.zoom) / tSize),
      );
      let startRow = Math.max(0, Math.floor(camera.y / tSize));
      let endRow = Math.min(
        mapInst.height - 1,
        Math.ceil((camera.y + camera.viewportH / camera.zoom) / tSize),
      );

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let tType = mapInst.grid[r][c];
          if (
            tType === window.TILE_TYPES.CHEST_SPAWN ||
            tType === window.TILE_TYPES.RECOVERY_CHEST ||
            tType === window.TILE_TYPES.DUNGEON_MERCHANT ||
            tType === window.TILE_TYPES.DUNGEON_MERCHANT_PEDESTAL
          ) {
            let isExplored =
              isHub ||
              (mapInst.exploredGrid &&
                mapInst.exploredGrid[r] &&
                mapInst.exploredGrid[r][c]);
            if (!isExplored) continue;

            let px = c * tSize;
            let py = r * tSize;
            depthQueue.push({
              yBase: py + 20,
              draw: () => {
                if (window.drawDungeonStructureTile) {
                  window.drawDungeonStructureTile(ctx, tType, px, py, tSize);
                }
              },
            });
          }
        }
      }
    }

    // B2. Breakable Pottery & Props (Fog-of-War Culled)
    if (
      window.currentGameState !== window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.breakables
    ) {
      mapInst.breakables.forEach((b) => {
        let isExplored =
          mapInst.exploredGrid &&
          mapInst.exploredGrid[b.y] &&
          mapInst.exploredGrid[b.y][b.x];
        if (!isExplored) return;

        let px = b.x * tSize;
        let py = b.y * tSize;
        depthQueue.push({
          yBase: py + 22,
          draw: () => {
            if (window.drawBreakableProp) {
              window.drawBreakableProp(ctx, b, px, py, tSize);
            }
          },
        });
      });
    }

    // B3. Ground Material Pickups (Fog-of-War Culled)
    if (window.groundMaterials && window.groundMaterials.length > 0) {
      let time = Date.now();
      window.groundMaterials.forEach((gm) => {
        let tileC = Math.floor(gm.x / tSize);
        let tileR = Math.floor(gm.y / tSize);
        let isExplored =
          isHub ||
          (mapInst &&
            mapInst.exploredGrid &&
            mapInst.exploredGrid[tileR] &&
            mapInst.exploredGrid[tileR][tileC]);
        if (!isExplored) return; // Hide ground material if in unexplored Fog of War!

        depthQueue.push({
          yBase: gm.y,
          draw: () => {
            let drawX = gm.x;
            let drawY = gm.y + gm.z;
            let color = gm.color || "#00d2ff";
            let isEco = window.playerStats && window.playerStats.ecoMode;

            ctx.save();

            // 1. Ground Drop Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(gm.x, gm.y + 2, 7, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Radial Floor Glow Aura
            if (!isEco) {
              let auraPulse = Math.sin(time / 120) * 1.2;
              let floorGrad = ctx.createRadialGradient(
                gm.x,
                gm.y + 2,
                1,
                gm.x,
                gm.y + 2,
                12 + auraPulse,
              );
              floorGrad.addColorStop(0, color);
              floorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = floorGrad;
              ctx.beginPath();
              ctx.arc(gm.x, gm.y + 2, 12 + auraPulse, 0, Math.PI * 2);
              ctx.fill();
            }

            // 3. Floating Material Gem / Soul Orb
            let bob = Math.sin(time / 140) * 2.0;
            let matY = drawY - 8 + bob;

            let img = window.getCanvasIconImage
              ? window.getCanvasIconImage(gm.name)
              : null;
            if (img && img.complete) {
              ctx.drawImage(img, drawX - 8, matY - 8, 16, 16);
            } else {
              ctx.fillStyle = color;
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(drawX, matY + 4, 4.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(drawX - 1, matY + 3, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          },
        });
      });
    }

    // B4. Ground Equipment Loot Pickups (Fog-of-War Culled)
    if (window.groundLoot && window.groundLoot.length > 0) {
      let time = Date.now();
      window.groundLoot.forEach((gl) => {
        let tileC = Math.floor(gl.x / tSize);
        let tileR = Math.floor(gl.y / tSize);
        let isExplored =
          isHub ||
          (mapInst &&
            mapInst.exploredGrid &&
            mapInst.exploredGrid[tileR] &&
            mapInst.exploredGrid[tileR][tileC]);
        if (!isExplored) return; // Hide ground equipment if in unexplored Fog of War!

        depthQueue.push({
          yBase: gl.y,
          draw: () => {
            let drawX = gl.x;
            let drawY = gl.y + gl.z;
            let color = gl.color || "#00d2ff";
            let isEco = window.playerStats && window.playerStats.ecoMode;

            ctx.save();

            // 1. Ground Drop Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(gl.x, gl.y + 2, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rarity Parsing Setup
            let isUnique =
              gl.item &&
              ((window.isItemUnique && window.isItemUnique(gl.item)) ||
                gl.item.statsRolled === "UNIQUE");
            let stars = gl.item
              ? gl.item.statsRolled === "UNIQUE"
                ? 5
                : (gl.item.statsRolled ?? 0)
              : 0;
            let dRgb = window.hexToRgbValues
              ? window.hexToRgbValues(color)
              : "255, 255, 255";

            let beamH = 110 + stars * 22;
            let beamW = 4 + stars * 2.2;
            if (isUnique) {
              beamH = 210;
              beamW = 14;
            }

            let pulseSpeed = 160 - stars * 18;
            let beamPulse = Math.sin(time / pulseSpeed) * (1.0 + stars * 0.35);
            let currentWidth = Math.max(2, beamW + beamPulse);
            let alpha = 0.25 + stars * 0.08 + (isUnique ? 0.2 : 0);
            let topY = gl.y + 2 - beamH;
            let groundY = gl.y + 2;

            let pulseAlpha = 0.5 + Math.sin(time / 150) * 0.25;

            // ==========================================
            // SUB-PASS A: Rarity-Themed Ground Seals (0 - 5 & UNIQUE)
            // ==========================================
            if (isUnique) {
              // UNIQUE: Cosmic Accretion Wormhole Vortex
              ctx.save();
              ctx.strokeStyle = "rgba(0, 210, 255, 0.45)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              let spiralPoints = isEco ? 20 : 45;
              for (let i = 0; i < spiralPoints; i++) {
                let angle = i * 0.35 + time / 160;
                let r = 2.0 * Math.pow(1.075, i);
                if (r > 28) break;
                ctx.lineTo(
                  drawX + Math.cos(angle) * r,
                  groundY + Math.sin(angle) * r * 0.35,
                );
              }
              ctx.stroke();
              ctx.restore();
            } else if (stars === 5) {
              // 5-Star: Unstable Plasma Disc
              ctx.save();
              ctx.strokeStyle = `rgba(${dRgb}, ${0.5 + pulseAlpha * 0.3})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              let plasmaPoints = isEco ? 8 : 16;
              for (let i = 0; i <= plasmaPoints; i++) {
                let ang = (i * Math.PI * 2) / plasmaPoints;
                let crackle =
                  18 +
                  Math.sin(time / 50 + i) * 3 +
                  (Math.random() - 0.5) * 1.5;
                ctx.lineTo(
                  drawX + Math.cos(ang) * crackle,
                  groundY + Math.sin(ang) * crackle * 0.35,
                );
              }
              ctx.closePath();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 4) {
              // 4-Star: Rotating Golden Sun Emblem
              ctx.save();
              ctx.translate(drawX, groundY);
              ctx.rotate(time / 1400);
              ctx.strokeStyle = `rgba(${dRgb}, 0.75)`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(0, 0, 16, 5.6, 0, 0, Math.PI * 2);
              ctx.stroke();

              let spikes = isEco ? 6 : 12;
              ctx.fillStyle = `rgba(${dRgb}, 0.16)`;
              ctx.beginPath();
              for (let i = 0; i < spikes; i++) {
                let a = (i * Math.PI * 2) / spikes;
                ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14 * 0.35);
                ctx.lineTo(
                  Math.cos(a + 0.1) * 23,
                  Math.sin(a + 0.1) * 23 * 0.35,
                );
                ctx.lineTo(
                  Math.cos(a + 0.2) * 14,
                  Math.sin(a + 0.2) * 14 * 0.35,
                );
              }
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 3) {
              // 3-Star: Boiling Magma Base Ring
              ctx.save();
              ctx.fillStyle = "rgba(230, 126, 34, 0.08)";
              ctx.beginPath();
              ctx.ellipse(drawX, groundY, 20, 7, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = `rgba(${dRgb}, ${0.5 + Math.sin(time / 80) * 0.15})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              let magmaPoints = isEco ? 10 : 20;
              for (let i = 0; i <= magmaPoints; i++) {
                let ang = (i * Math.PI * 2) / magmaPoints;
                let pulse = 20 + Math.sin(time / 60 + i * 3) * 1.5;
                ctx.lineTo(
                  drawX + Math.cos(ang) * pulse,
                  groundY + Math.sin(ang) * pulse * 0.35,
                );
              }
              ctx.stroke();
              ctx.restore();
            } else if (stars === 2) {
              // 2-Star: Rotating Runic Magic Seal
              ctx.save();
              ctx.translate(drawX, groundY);
              ctx.rotate(time / 1100);
              ctx.strokeStyle = `rgba(${dRgb}, 0.55)`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 18, 6.3, 0, 0, Math.PI * 2);
              ctx.stroke();

              ctx.beginPath();
              let pts = 6;
              for (let i = 0; i < pts * 2; i++) {
                let a = (i * Math.PI) / pts;
                let rad = i % 2 === 0 ? 18 : 8;
                ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.35);
              }
              ctx.closePath();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 1) {
              // 1-Star: Concentric Frost Ripples
              let rippleCount = isEco ? 1 : 2;
              for (let rIdx = 0; rIdx < rippleCount; rIdx++) {
                let rippleProgress = (time / 1200 + rIdx * 0.5) % 1.0;
                let maxR = 22;
                let curR = maxR * rippleProgress;
                let rAlpha = (1.0 - rippleProgress) * 0.5;
                ctx.strokeStyle = `rgba(56, 189, 248, ${rAlpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(
                  drawX,
                  groundY,
                  curR,
                  curR * 0.35,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.stroke();
              }
            } else {
              // 0-Star: Simple Dust Ring
              ctx.strokeStyle = "rgba(120, 120, 120, 0.15)";
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.ellipse(drawX, groundY, 14, 5, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // ==========================================
            // SUB-PASS B: BACK-Plane Depth-Sorted Orbiting Sparks (z < 0)
            // ==========================================
            if (stars === 4 && !isEco) {
              let legendarySparks = 4;
              for (let i = 0; i < legendarySparks; i++) {
                let theta = time / 350 + i * ((Math.PI * 2) / legendarySparks);
                let z = Math.sin(theta);
                if (z < 0) {
                  let ox = drawX + Math.cos(theta) * 16;
                  let hProgress =
                    (time / 10 + i * (beamH / legendarySparks)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = `rgba(${dRgb}, ${0.4 + Math.abs(z) * 0.6})`;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (isUnique && !isEco) {
              let uniqueOrbs = 3;
              for (let uIdx = 0; uIdx < uniqueOrbs; uIdx++) {
                let theta = time / 280 + uIdx * ((Math.PI * 2) / uniqueOrbs);
                let z = Math.sin(theta);
                if (z < 0) {
                  let rSize = 14 + Math.sin(time / 120 + uIdx) * 3;
                  let ox = drawX + Math.cos(theta) * rSize;
                  let hProgress =
                    (time / 8 + uIdx * (beamH / uniqueOrbs)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = "rgba(142, 68, 173, 0.4)";
                  ctx.beginPath();
                  ctx.arc(ox, oy, 2.0, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            // ==========================================
            // SUB-PASS C: Primary Shaft & Atmosphere Glow
            // ==========================================
            // A. Outer Atmospheric Glow (2★+)
            if (stars >= 2 || isUnique) {
              let outerW = currentWidth * (isUnique ? 2.8 : 2.0);
              let outerGrad = ctx.createLinearGradient(
                drawX,
                groundY,
                drawX,
                topY,
              );
              outerGrad.addColorStop(0, `rgba(${dRgb}, ${alpha * 0.35})`);
              outerGrad.addColorStop(0.6, `rgba(${dRgb}, ${alpha * 0.12})`);
              outerGrad.addColorStop(1, `rgba(${dRgb}, 0)`);
              ctx.fillStyle = outerGrad;
              ctx.fillRect(drawX - outerW / 2, topY, outerW, beamH);
            }

            // B. Primary Shaft Gradient Beam
            let shaftGrad = ctx.createLinearGradient(
              drawX,
              groundY,
              drawX,
              topY,
            );
            if (isUnique) {
              shaftGrad.addColorStop(0, `rgba(232, 67, 147, ${alpha})`);
              shaftGrad.addColorStop(
                0.4,
                `rgba(142, 68, 173, ${alpha * 0.85})`,
              );
              shaftGrad.addColorStop(0.8, `rgba(0, 210, 255, ${alpha * 0.5})`);
              shaftGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
            } else {
              shaftGrad.addColorStop(0, `rgba(${dRgb}, ${alpha})`);
              shaftGrad.addColorStop(0.5, `rgba(${dRgb}, ${alpha * 0.45})`);
              shaftGrad.addColorStop(1, `rgba(${dRgb}, 0)`);
            }
            ctx.fillStyle = shaftGrad;

            if (stars === 3) {
              // Flickering core for Epic
              let flickerWidth =
                currentWidth * (0.85 + Math.sin(time / 20) * 0.15);
              ctx.fillRect(drawX - flickerWidth / 2, topY, flickerWidth, beamH);
            } else {
              ctx.fillRect(drawX - currentWidth / 2, topY, currentWidth, beamH);
            }

            // C. White-Hot Inner Core Laser
            if (stars >= 1 || isUnique) {
              let coreW = Math.max(1, currentWidth * 0.3);
              let coreGrad = ctx.createLinearGradient(
                drawX,
                groundY,
                drawX,
                topY,
              );
              coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
              coreGrad.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.8})`);
              coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
              ctx.fillStyle = coreGrad;
              ctx.fillRect(drawX - coreW / 2, topY, coreW, beamH);
            } else {
              // 0-Star Smoky/Drifting core
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.moveTo(drawX, groundY);
              for (let sy = groundY; sy >= topY; sy -= 10) {
                let drift = Math.sin(time / 200 + sy / 15) * 1.2;
                ctx.lineTo(drawX + drift, sy);
              }
              ctx.stroke();
            }

            // ==========================================
            // SUB-PASS D: FRONT-Plane Depth-Sorted Orbiting Sparks (z >= 0) & Helix
            // ==========================================
            // 1. Helix Strands for 4★, 5★, UNIQUE
            if ((stars === 4 || stars === 5 || isUnique) && !isEco) {
              let helixSteps = isUnique ? 25 : 16;
              let hStep = beamH / helixSteps;
              ctx.lineWidth = 1.5;

              // Strand 1 (Cyan/Teal or White)
              ctx.strokeStyle = isUnique
                ? "rgba(0, 210, 255, 0.8)"
                : `rgba(255, 255, 255, 0.7)`;
              ctx.beginPath();
              for (let s = 0; s <= helixSteps; s++) {
                let ly = groundY - s * hStep;
                let phase = (s * Math.PI * 4) / helixSteps + time / 130;
                let lx = drawX + Math.sin(phase) * (currentWidth * 1.35);
                if (s === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
              }
              ctx.stroke();

              // Strand 2 (Magenta or White)
              ctx.strokeStyle = isUnique
                ? "rgba(255, 0, 127, 0.8)"
                : `rgba(255, 255, 255, 0.45)`;
              ctx.beginPath();
              for (let s = 0; s <= helixSteps; s++) {
                let ly = groundY - s * hStep;
                let phase = (s * Math.PI * 4) / helixSteps - time / 130;
                let lx = drawX + Math.sin(phase) * (currentWidth * 1.35);
                if (s === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
              }
              ctx.stroke();
            }

            // 2. Frontal Sparks Orbits
            if (stars === 4 && !isEco) {
              let legendarySparks = 4;
              for (let i = 0; i < legendarySparks; i++) {
                let theta = time / 350 + i * ((Math.PI * 2) / legendarySparks);
                let z = Math.sin(theta);
                if (z >= 0) {
                  let ox = drawX + Math.cos(theta) * 16;
                  let hProgress =
                    (time / 10 + i * (beamH / legendarySparks)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + z * 0.6})`;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.4, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (isUnique && !isEco) {
              let uniqueOrbs = 3;
              for (let uIdx = 0; uIdx < uniqueOrbs; uIdx++) {
                let theta = time / 280 + uIdx * ((Math.PI * 2) / uniqueOrbs);
                let z = Math.sin(theta);
                if (z >= 0) {
                  let rSize = 14 + Math.sin(time / 120 + uIdx) * 3;
                  let ox = drawX + Math.cos(theta) * rSize;
                  let hProgress =
                    (time / 8 + uIdx * (beamH / uniqueOrbs)) % beamH;
                  let oy = groundY - hProgress;

                  let grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 4);
                  grad.addColorStop(0, "#ffffff");
                  grad.addColorStop(0.5, "rgba(0, 210, 255, 0.85)");
                  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
                  ctx.fillStyle = grad;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 4, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = "#0c011a";
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            // 3. Custom Rarity-Themed Core Sparks
            if (stars === 5) {
              // Mythic: Lightning arcs
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + Math.sin(time / 45) * 0.15})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(drawX, groundY);
              let segments = isEco ? 5 : 10;
              let segH = beamH / segments;
              for (let s = 1; s <= segments; s++) {
                let ly = groundY - s * segH;
                let lx =
                  drawX + Math.sin(time / 8 + s) * 3 * (1 - s / segments);
                ctx.lineTo(lx, ly);
              }
              ctx.stroke();
            } else if (stars === 3) {
              // Epic: Molten embers rising
              let emberCount = isEco ? 1 : 3;
              for (let i = 0; i < emberCount; i++) {
                let progress = (time / 800 + i / emberCount) % 1.0;
                let ey = groundY - progress * beamH;
                let ex = drawX + Math.sin(time / 60 + i) * 3.5;
                ctx.fillStyle = `rgba(249, 115, 22, ${1.0 - progress})`;
                ctx.beginPath();
                ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (stars === 2) {
              // Magic: Arcane motes drifting
              let runeCount = isEco ? 1 : 3;
              for (let i = 0; i < runeCount; i++) {
                let progress = (time / 900 + i / runeCount) % 1.0;
                let ry = groundY - progress * beamH;
                let rx = drawX + Math.cos(time / 80 + i) * 5;
                ctx.fillStyle = `rgba(168, 85, 247, ${0.85 * (1.0 - progress)})`;
                ctx.beginPath();
                ctx.arc(rx, ry, 1.4, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (stars === 1) {
              // Rare: Floating ice sparks
              let iceCount = isEco ? 1 : 2;
              for (let i = 0; i < iceCount; i++) {
                let progress = (time / 1000 + i / iceCount) % 1.0;
                let iy = groundY - progress * beamH;
                let ix = drawX + Math.sin(time / 100 + i * 5) * 4;
                ctx.fillStyle = `rgba(56, 189, 248, ${0.75 * (1.0 - progress)})`;
                ctx.beginPath();
                ctx.arc(ix, iy, 1.1, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // ==========================================
            // SUB-PASS E: Top Ray & Lens Flare Burst (3★+)
            // ==========================================
            if (stars >= 3 || isUnique) {
              ctx.save();
              let flarePulse = 1.0 + Math.sin(time / 100) * 0.25;
              let flareRad = (4 + stars * 2) * flarePulse;

              let flareGrad = ctx.createRadialGradient(
                drawX,
                topY,
                0,
                drawX,
                topY,
                flareRad * 2,
              );
              flareGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
              flareGrad.addColorStop(0.4, `rgba(${dRgb}, 0.7)`);
              flareGrad.addColorStop(1, "rgba(0,0,0,0)");

              ctx.fillStyle = flareGrad;
              ctx.beginPath();
              ctx.arc(drawX, topY, flareRad * 2, 0, Math.PI * 2);
              ctx.fill();

              // Horizontal Lens Flare Cross
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * flarePulse})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(drawX - flareRad * 2.5, topY);
              ctx.lineTo(drawX + flareRad * 2.5, topY);
              ctx.moveTo(drawX, topY - flareRad * 1.5);
              ctx.lineTo(drawX, topY + flareRad * 1.5);
              ctx.stroke();

              if (isUnique || stars >= 5) {
                ctx.strokeStyle = isUnique ? "#00ffff" : "#ffd700";
                ctx.beginPath();
                ctx.moveTo(drawX - flareRad * 1.8, topY - flareRad * 0.8);
                ctx.lineTo(drawX + flareRad * 1.8, topY + flareRad * 0.8);
                ctx.moveTo(drawX - flareRad * 1.8, topY + flareRad * 0.8);
                ctx.lineTo(drawX + flareRad * 1.8, topY - flareRad * 0.8);
                ctx.stroke();
              }
              ctx.restore();
            }

            // ==========================================
            // SUB-PASS F: Floating Equipment Symbol
            // ==========================================
            let bob = Math.sin(time / 150) * 2.5;
            let lootY = drawY - 10 + bob;

            let img = window.getCanvasIconImage
              ? window.getCanvasIconImage(gl.item)
              : null;
            if (img && img.complete) {
              ctx.drawImage(img, drawX - 10, lootY - 10, 20, 20);
            } else {
              ctx.fillStyle = color;
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(drawX, lootY + 4 - 5);
              ctx.lineTo(drawX + 5, lootY + 4);
              ctx.lineTo(drawX, lootY + 4 + 5);
              ctx.lineTo(drawX - 5, lootY + 4);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(drawX - 1.5, lootY + 4 - 1.5, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          },
        });
      });
    }

    // B5. Sector Environmental Decorations (Fog-of-War Culled)
    if (
      !isHub &&
      mapInst &&
      mapInst.decorations &&
      mapInst.decorations.length > 0
    ) {
      mapInst.decorations.forEach((dec) => {
        let isExplored =
          mapInst.exploredGrid &&
          mapInst.exploredGrid[dec.y] &&
          mapInst.exploredGrid[dec.y][dec.x];
        if (!isExplored) return;

        let isWallProp =
          mapInst.grid[dec.y] &&
          mapInst.grid[dec.y][dec.x] === window.TILE_TYPES.WALL;

        depthQueue.push({
          yBase: dec.worldY + (isWallProp ? 0 : 8),
          draw: () => {
            if (window.drawSectorDecoration) {
              window.drawSectorDecoration(ctx, dec, tSize);
            }
          },
        });
      });
    }

    // C. Active Dungeon Mobs (Fog-of-War Culled)
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      window.activeDungeonMobs.forEach((m) => {
        let tileC = Math.floor((m.x + (m.w || 24) / 2) / tSize);
        let tileR = Math.floor((m.y + (m.h || 24) / 2) / tSize);
        let isExplored =
          isHub ||
          (mapInst &&
            mapInst.exploredGrid &&
            mapInst.exploredGrid[tileR] &&
            mapInst.exploredGrid[tileR][tileC]);
        if (!isExplored) return; // Hide mob if in unexplored Fog of War!

        if (m.perfectStrikeTimer > 0) {
          m.perfectStrikeTimer--;
          let progress = m.perfectStrikeTimer / m.perfectStrikeMax;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2;

          depthQueue.push({
            yBase: m.y + (m.h || 24) + 1,
            draw: () => {
              ctx.save();
              ctx.strokeStyle = "rgba(231, 76, 60, 0.4)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(cx, cy, 22, 0, Math.PI * 2);
              ctx.stroke();

              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.arc(cx, cy, 6 + progress * 16, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            },
          });
        }

        depthQueue.push({
          yBase: m.y + (m.h || 24),
          draw: () => {
            window.drawSingleMob(ctx, m);
            if (window.combatVisuals)
              window.combatVisuals.drawTargetHealthBar(ctx, m);
          },
        });
      });
    }

    // C2. Active Cavern Sigil Interactives (Depth-Sorted)
    if (window.cavernInteractives && window.cavernInteractives.length > 0) {
      window.cavernInteractives.forEach((item) => {
        let tileC = Math.floor(item.x / tSize);
        let tileR = Math.floor(item.y / tSize);
        let isExplored =
          isHub ||
          (mapInst &&
            mapInst.exploredGrid &&
            mapInst.exploredGrid[tileR] &&
            mapInst.exploredGrid[tileR][tileC]);
        if (!isExplored) return;

        depthQueue.push({
          yBase: item.y + (item.h || 24),
          draw: () => {
            window.drawCavernInteractive(ctx, item);
          },
        });
      });
    }

    // D. Boss Warden
    if (window.mob) {
      let bm = window.mob;
      depthQueue.push({
        yBase: bm.y + (bm.h || 48),
        draw: () => {
          if (bm.state === "telegraphing" && bm.activeAbility) {
            if (
              window.BossAIEngine &&
              typeof window.BossAIEngine.renderTelegraph === "function"
            ) {
              window.BossAIEngine.renderTelegraph(ctx, bm);
            }
          }

          window.drawSingleMob(ctx, window.mob);
        },
      });
    }

    // E. Player Hero
    let bounce = 0;
    let deathFrame =
      window.deathAnimationTimer > 0 ? 75 - window.deathAnimationTimer : 0;
    if (deathFrame > 0) {
      bounce = deathFrame * 0.25;
    } else if (p.isMoving) {
      bounce = Math.sin(p.walkTimer) * 2.2;
    } else {
      bounce = Math.sin(Date.now() / 350) * 1.2;
    }

    depthQueue.push({
      yBase: p.y,
      draw: () => {
        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let distToTarget = Math.hypot(dx, dy);
        let ctrlMode = window.playerStats
          ? window.playerStats.controlMode || "joystick"
          : "joystick";

        if (ctrlMode === "cursor" && distToTarget > 4) {
          ctx.save();
          ctx.strokeStyle = "rgba(0, 210, 255, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.targetX, p.targetY);
          ctx.stroke();
          ctx.setLineDash([]);

          let pulse = Math.sin(Date.now() / 150) * 1.5;
          ctx.strokeStyle = "#00d2ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 6 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(0, 210, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(p.x, p.y - 8);
        if (deathFrame > 0) {
          let tilt = Math.min(Math.PI / 2, (deathFrame / 25) * (Math.PI / 2));
          ctx.rotate(p.facing === -1 ? -tilt : tilt);
          ctx.globalAlpha = Math.max(0, 1.0 - deathFrame / 65);
        } else if (p.facing === -1) {
          ctx.scale(-1, 1);
        }

        window.drawSingleHero(
          ctx,
          0,
          0,
          0.8,
          window.equippedSlots || {},
          window.playerStats || {},
          bounce,
          {
            slashFrame: window.hero.slashFrame,
            deathAnimationTimer: window.deathAnimationTimer,
            isMainHero: true,
            isMoving: p.isMoving,
            facing: p.facing,
          },
        );
        ctx.restore();

        // Render Player Overhead Healthbar
        let pHpPct = Math.max(0, Math.min(1, p.hp / p.maxHp));
        if (p.trailingHpPct === undefined) p.trailingHpPct = pHpPct;
        if (p.trailingHpPct > pHpPct) {
          p.trailingHpPct = Math.max(pHpPct, p.trailingHpPct - 0.015);
        } else {
          p.trailingHpPct = pHpPct;
        }

        let isLowHp = pHpPct <= 0.2 && p.hp > 0;
        let showPlayerHpBar =
          (p.lastDamageTimer && p.lastDamageTimer > 0) || isLowHp;

        if (showPlayerHpBar && p.hp > 0) {
          let barW = 32;
          let barH = 5;
          let barX = p.x - barW / 2;
          let barY = p.y - 28;

          let borderCol = "#000000";
          if (isLowHp) {
            let pulse = Math.sin(Date.now() / 120) * 0.5 + 0.5;
            borderCol = `rgba(231, 76, 60, ${0.4 + pulse * 0.5})`;
          }

          ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
          ctx.fillRect(barX, barY, barW, barH);

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(barX, barY, barW * p.trailingHpPct, barH);

          ctx.fillStyle = isLowHp ? "#e74c3c" : "#2ecc71";
          ctx.fillRect(barX, barY, barW * pHpPct, barH);

          ctx.strokeStyle = borderCol;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(barX, barY, barW, barH);
        }
      },
    });

    // Execute Depth Sorting: Render North to South
    depthQueue.sort((a, b) => a.yBase - b.yBase);
    depthQueue.forEach((item) => item.draw());

    // Render Gold Homing Particles
    if (window.goldParticles && window.goldParticles.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;

      for (let i = 0; i < window.goldParticles.length; i++) {
        let gp = window.goldParticles[i];
        let r = 4.5;
        let pulse = Math.abs(Math.sin(Date.now() / 80 + i)) * 0.3 + 0.8;

        ctx.fillStyle = "#b7950b";
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y, r * pulse + 0.6, r + 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y, r * pulse, r, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(
          gp.x - 1,
          gp.y - 1,
          r * 0.3 * pulse,
          r * 0.3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    // Render Heart Homing Particles
    if (window.heartOrbs && window.heartOrbs.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;

      for (let i = 0; i < window.heartOrbs.length; i++) {
        let ho = window.heartOrbs[i];
        ctx.save();

        // Draw floor shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(ho.x, ho.y + 4, 5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Core pulsing animation
        let pulse = Math.sin(Date.now() / 100 + i) * 0.12 + 0.95;
        let size = 5.0 * pulse;

        ctx.fillStyle = "#ff4757"; // Vivid Crimson Heart Red
        ctx.beginPath();
        ctx.moveTo(ho.x, ho.y - size / 4);
        ctx.bezierCurveTo(
          ho.x - size / 2,
          ho.y - size * 0.8,
          ho.x - size,
          ho.y - size * 0.4,
          ho.x,
          ho.y + size,
        );
        ctx.bezierCurveTo(
          ho.x + size,
          ho.y - size * 0.4,
          ho.x + size / 2,
          ho.y - size * 0.8,
          ho.x,
          ho.y - size / 4,
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Micro highlight sheen
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(
          ho.x - size * 0.3,
          ho.y - size * 0.3,
          size * 0.25,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.restore();
      }
    }

    // Render XP Homing Orbs
    if (window.xpOrbs && window.xpOrbs.length > 0) {
      let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
      let camX = window.DungeonCamera ? Math.floor(window.DungeonCamera.x) : 0;
      let camY = window.DungeonCamera ? Math.floor(window.DungeonCamera.y) : 0;

      for (let i = 0; i < window.xpOrbs.length; i++) {
        let orb = window.xpOrbs[i];
        let drawX = orb.isHomingScreenSpace
          ? orb.screenX / zoom + camX
          : orb.worldX;
        let drawY = orb.isHomingScreenSpace
          ? orb.screenY / zoom + camY
          : orb.worldY;

        ctx.save();
        let r = 4.0;
        let pulse = Math.abs(Math.sin(Date.now() / 70 + i)) * 0.3 + 0.8;

        let grad = ctx.createRadialGradient(
          drawX,
          drawY,
          1,
          drawX,
          drawY,
          r * 2.2 * pulse,
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(0.35, "rgba(0, 210, 255, 0.85)");
        grad.addColorStop(0.75, "rgba(168, 85, 247, 0.6)");
        grad.addColorStop(1, "rgba(168, 85, 247, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, r * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#a855f7";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(drawX - 1, drawY - 1, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Render Active Spell Animations in World Coordinates
    if (window.renderSpellAnimations) {
      window.renderSpellAnimations(ctx);
    }

    // Render Active Projectiles in World Coordinates
    if (window.projectiles && window.projectiles.length > 0) {
      let time = Date.now();
      window.projectiles.forEach((proj) => {
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        let pr = proj.r || 5;
        let pulse = Math.sin(time / 80 + (proj.pulseOffset || 0)) * 1.5;
        let r = pr + pulse;

        if (proj.type === "thorn") {
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#a3fd83";
          ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
        } else if (proj.type === "frost") {
          ctx.fillStyle = "#3498db";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === "fireball") {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === "maelstrom") {
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#55efc4";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (proj.type === "void") {
          ctx.fillStyle = "#8e44ad";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ff007f";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // Render Upgraded Polymorphic Particles (Subphase B.1 Dispatcher & Subphases B.2-B.3 All Vector Shapes)
    if (window.particles) {
      window.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha !== undefined ? pt.alpha : 1.0;
        ctx.fillStyle = pt.color || "#ffffff";

        // Dispatcher (Polymorphic Style Branching)
        if (pt.style === "circle" || !pt.style) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.style === "polygon") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);

          // Draw main faceted shard body
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.8, size * 0.5);
          ctx.lineTo(0, size * 0.3);
          ctx.lineTo(-size * 0.8, size * 0.5);
          ctx.closePath();
          ctx.fill();

          // Left facet shadow overlay to simulate 3D depth
          ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(0, size * 0.3);
          ctx.lineTo(-size * 0.8, size * 0.5);
          ctx.closePath();
          ctx.fill();
        } else if (pt.style === "streak") {
          let speed = Math.hypot(pt.vx, pt.vy);
          if (speed > 0.1) {
            ctx.lineWidth =
              (pt.size || 1.5) * (pt.scale !== undefined ? pt.scale : 1.0);
            ctx.lineCap = "round";

            let tailX = pt.x - pt.vx * 1.5;
            let tailY = pt.y - pt.vy * 1.5;

            // Generate motion blur gradient fading out at the tail
            let grad = ctx.createLinearGradient(pt.x, pt.y, tailX, tailY);
            grad.addColorStop(0, pt.color || "#ffffff");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
          } else {
            // Drop down to circle fallback if velocity falls to zero
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (pt.style === "elliptical_3d") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          let cosVal = Math.cos(pt.angle || 0);

          ctx.translate(pt.x, pt.y);
          if (pt.tiltAngle) {
            ctx.rotate(pt.tiltAngle);
          }

          let radiusX = size;
          let radiusY = size * Math.abs(cosVal); // squash vertical axis to simulate 3D tumbling

          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Render high-contrast metallic highlight ring
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.style === "sparkle_star") {
          let size = (pt.size || 4) * (pt.scale !== undefined ? pt.scale : 1.0);
          let innerSize = size * 0.25;

          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);

          // 1. Draw glowing radial background aura
          let glowGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 1.8);
          glowGrad.addColorStop(0, pt.color || "#ffffff");
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw white-hot stellar core on top of glow
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.quadraticCurveTo(0, -innerSize, innerSize, 0);
          ctx.quadraticCurveTo(0, innerSize, 0, size);
          ctx.quadraticCurveTo(0, innerSize, -innerSize, 0);
          ctx.quadraticCurveTo(0, -innerSize, 0, -size);
          ctx.closePath();
          ctx.fill();
        } else if (pt.style === "glowing_orb") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          let timeVal = Date.now() * 0.004;
          let seed = pt.x * 17.3 + pt.y * 23.9;
          let breathe = 1.0 + 0.2 * Math.sin(timeVal + seed);
          let r = size * breathe;

          ctx.translate(pt.x, pt.y);

          let grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 2.0);
          grad.addColorStop(0, "#ffffff"); // intense center core
          grad.addColorStop(0.35, pt.color || "#ffffff"); // soft color-mapped body
          grad.addColorStop(1, "rgba(0, 0, 0, 0)"); // transparent fading halo

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Temporarily hide particles to prevent combatVisuals duplicate drawing (Subphase B.1)
    let tempParticles = window.particles;
    window.particles = [];
    if (window.combatVisuals) {
      window.combatVisuals.render(ctx);
    }
    window.particles = tempParticles;

    // Floating System Text Effects
    window.floatingTexts.forEach((ft) => {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.textAlign = "center";
      let drawX =
        ft.followPlayer && window.player
          ? window.player.x + (ft.offsetX || 0)
          : ft.x;
      let drawY =
        ft.followPlayer && window.player
          ? window.player.y + (ft.offsetY || 0)
          : ft.y;
      ctx.strokeText(ft.text, drawX, drawY);
      ctx.fillText(ft.text, drawX, drawY);
    });

    ctx.restore();

    // Render Dynamic Ambient Lighting Pass
    window.renderLightingOverlay(ctx, canvas);

    // Render Screen Vignette Overlay
    let vg = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) * 0.35,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.75,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(2,1,6,0.75)");

    ctx.save();
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Render Minimap in Screen Space
    // Safe-optimization: On mobile portrait, hide the minimap during active Boss fights to prevent HUD overlap/clutter
    let isPortrait = window.innerHeight > window.innerWidth;
    let shouldHideMinimap = isPortrait && window.mob;
    if (!shouldHideMinimap && typeof window.renderMinimap === "function") {
      window.renderMinimap(ctx, canvas);
    }

    // Render Boss Health Bar in Screen Space
    if (window.mob) {
      if (isPortrait) {
        window.drawPortraitBossHealthBar(ctx, window.mob, canvas);
      } else if (
        window.combatVisuals &&
        typeof window.combatVisuals.drawTargetHealthBar === "function"
      ) {
        window.combatVisuals.drawTargetHealthBar(ctx, window.mob);
      }
    }

    // 3. Render Floating Virtual Joystick Overlay (Screen Space)
    let mode = window.playerStats
      ? window.playerStats.controlMode || "joystick"
      : "joystick";
    if (mode === "joystick" && window.joystick.active) {
      let joy = window.joystick;
      ctx.save();

      // Outer Base Ring
      ctx.fillStyle = "rgba(10, 14, 23, 0.45)";
      ctx.strokeStyle = "rgba(0, 210, 255, 0.6)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(joy.baseX, joy.baseY, joy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Thumb Stick Nub
      ctx.fillStyle = "#00d2ff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joy.currX, joy.currY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 4. Render Station Proximity Prompt Overlay (Floating directly above player in screen space)
    if (
      window.activeStationPrompt &&
      window.currentGameState === window.GAME_STATES.HUB
    ) {
      let st = window.activeStationPrompt;
      let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
      let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
      let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
      let pScreenX = (p.x - camX) * zoom;
      let pScreenY = (p.y - camY - 50) * zoom;

      let recLoot = window.playerStats && window.playerStats.recoveryLoot;
      let hasRecovery =
        st.type === window.TILE_TYPES.STATION_PORTAL &&
        recLoot &&
        recLoot.items &&
        recLoot.items.length > 0;

      // Pre-allocate and reuse part configurations on the global window to enforce zero GC allocations in the loop
      if (!window._proxParts) {
        window._proxParts = [
          { text: "[ ", color: "rgba(255, 255, 255, 0.4)" },
          { text: "TAP TO ENTER: ", color: "#00d2ff" },
          { text: "", color: "#ffffff" },
          { text: "", color: "#ff7675", pulse: true },
          { text: " ]", color: "rgba(255, 255, 255, 0.4)" },
        ];
      }

      // Update values in-place inside our recycled array
      window._proxParts[2].text = st.label.toUpperCase();
      if (hasRecovery) {
        window._proxParts[3].text = ` (RECOVER FLOOR ${recLoot.floor})`;
      } else {
        window._proxParts[3].text = "";
      }

      ctx.save();
      ctx.font = "bold 10.5px monospace";

      // Calculate dynamic text width to automatically scale physical boundaries
      let totalTextWidth = 0;
      window._proxParts.forEach((part) => {
        if (part.text) {
          totalTextWidth += ctx.measureText(part.text).width;
        }
      });

      let pw = totalTextWidth + 24; // Safe padding allocation on left and right
      let ph = 32;
      let px = pScreenX - pw / 2;
      let py = pScreenY - ph / 2;

      // Draw background with sleek obsidian gradient
      let panelGrad = ctx.createLinearGradient(px, py, px, py + ph);
      panelGrad.addColorStop(0, "rgba(8, 6, 16, 0.94)");
      panelGrad.addColorStop(1, "rgba(16, 11, 28, 0.98)");
      ctx.fillStyle = panelGrad;

      // Holographic pulsing neon border
      let pulse = Math.sin(Date.now() / 180) * 0.15 + 0.85;
      ctx.strokeStyle = `rgba(0, 210, 255, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, [4]);
      ctx.fill();
      ctx.stroke();

      // Inner secondary decorative gold border
      ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, pw - 4, ph - 4, [3]);
      ctx.stroke();

      // Celestial Corner Crosshairs Brackets (replaces simple blocky rects)
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 1.8;
      // Top-Left Bracket
      ctx.beginPath();
      ctx.moveTo(px + 6, py - 1);
      ctx.lineTo(px - 1, py - 1);
      ctx.lineTo(px - 1, py + 6);
      ctx.stroke();
      // Top-Right Bracket
      ctx.beginPath();
      ctx.moveTo(px + pw - 6, py - 1);
      ctx.lineTo(px + pw + 1, py - 1);
      ctx.lineTo(px + pw + 1, py + 6);
      ctx.stroke();
      // Bottom-Left Bracket
      ctx.beginPath();
      ctx.moveTo(px + 6, py + ph + 1);
      ctx.lineTo(px - 1, py + ph + 1);
      ctx.lineTo(px - 1, py + ph - 6);
      ctx.stroke();
      // Bottom-Right Bracket
      ctx.beginPath();
      ctx.moveTo(px + pw - 6, py + ph + 1);
      ctx.lineTo(px + pw + 1, py + ph + 1);
      ctx.lineTo(px + pw + 1, py + ph - 6);
      ctx.stroke();

      // Render clean color-segmented text
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let startX = pScreenX - totalTextWidth / 2;
      window._proxParts.forEach((part) => {
        if (!part.text) return;
        if (part.pulse) {
          let textPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
          ctx.fillStyle = `rgba(255, 118, 117, ${textPulse})`;
        } else {
          ctx.fillStyle = part.color;
        }
        ctx.fillText(part.text, startX, pScreenY);
        startX += ctx.measureText(part.text).width;
      });
    }
  }

  // --- HUD UPDATER ---
  window.updateHUD = function () {
    let nameEl = document.getElementById("hud-player-name");
    let lvlEl = document.getElementById("hud-player-level");
    let hpFill = document.getElementById("hp-bar-fill");
    let hpText = document.getElementById("hp-text");
    let xpFill = document.getElementById("xp-bar-fill");
    let xpText = document.getElementById("xp-text");
    let goldText = document.getElementById("gold-text");
    let depthLabel = document.getElementById("hud-depth-label");
    let objectiveLabel = document.getElementById("hud-objective-label");
    let bagCount = document.getElementById("hud-bag-count");
    let abandonBtn = document.getElementById("btn-abandon-run");
    let ctrlSettingBtn = document.getElementById("btn-settings-control");
    let muteSettingBtn = document.getElementById("btn-settings-mute");

    let p = window.player;
    let stats = window.playerStats || {};
    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let mode = stats.controlMode || "joystick";

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : null;
    if (pStats && pStats.maxHp && p) {
      let resolvedMax = Math.round(
        pStats.maxHp.valueOf
          ? pStats.maxHp.valueOf()
          : Number(pStats.maxHp || 100),
      );
      if (p.maxHp !== resolvedMax) {
        let diff = resolvedMax - p.maxHp;
        p.maxHp = resolvedMax;
        if (isHub) {
          p.hp = resolvedMax;
        } else if (diff > 0) {
          p.hp = Math.min(resolvedMax, p.hp + diff);
        } else {
          p.hp = Math.min(p.hp, resolvedMax);
        }
      }
      if (pStats.atk)
        p.atk = pStats.atk.valueOf
          ? pStats.atk.valueOf()
          : Number(pStats.atk || 15);
      if (pStats.def)
        p.def = pStats.def.valueOf
          ? pStats.def.valueOf()
          : Number(pStats.def || 5);
    }

    if (nameEl) nameEl.innerText = stats.playerName || "HERO";
    if (lvlEl) lvlEl.innerText = `LV.${stats.level || 1}`;

    let roundedHp = Math.round(p.hp);
    let roundedMaxHp = Math.round(p.maxHp);
    if (hpFill)
      hpFill.style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
    if (hpText) hpText.innerText = `${roundedHp} / ${roundedMaxHp}`;

    // Update XP Bar Track
    let curXp = BigNum.from(stats.xp || 0);
    let reqXp = BigNum.from(stats.xpReq || 350);
    let xpRatio = 0;
    if (reqXp.gt(0)) {
      let div = curXp.div(reqXp);
      xpRatio = Math.max(
        0,
        Math.min(1, div.m * Math.pow(10, Math.min(15, div.e))),
      );
    }
    if (xpFill) xpFill.style.width = `${(xpRatio * 100).toFixed(1)}%`;
    if (xpText)
      xpText.innerText = `${window.formatNumber(curXp)} / ${window.formatNumber(reqXp)}`;
    if (goldText) {
      let displayedGold = isHub ? stats.coins || 0 : stats.runGold || 0;
      goldText.innerText = window.formatNumber
        ? window.formatNumber(displayedGold)
        : displayedGold;
    }
    if (depthLabel) {
          if (isHub) {
            depthLabel.innerText = "ADVENTURER'S HUB";
          } else {
            let text = window.playerStats.isCrucibleMode
              ? `ONSLAUGHT WAVE ${window.playerStats.crucibleWave || 1}`
              : `DUNGEON FLOOR ${p.depth}`;

            let rec = window.playerStats && window.playerStats.recoveryLoot;
            if (rec && rec.floor === p.depth && rec.items && rec.items.length > 0) {
              text += " [RECOVERY ACTIVE]";
            }
            depthLabel.innerText = text;
          }
        }
    if (objectiveLabel) {
      if (isHub) {
        objectiveLabel.innerText = "Select a Station or Portal";
      } else {
        objectiveLabel.innerText = window.playerStats.isCrucibleMode
          ? "Defeat all active wave targets!"
          : "Find the Extraction Zone";
      }
    }

    let bagBtn = document.getElementById("btn-bag-toggle");
    if (bagBtn) {
      let count = isHub
        ? p.stash
          ? p.stash.length
          : 0
        : p.bag
          ? p.bag.length
          : 0;
      let label = isHub ? "VAULT" : "BAG";
      bagBtn.innerHTML = `${label} (<span id="hud-bag-count">${count}</span>)`;
    } else if (bagCount) {
      bagCount.innerText = isHub
        ? p.stash
          ? p.stash.length
          : 0
        : p.bag
          ? p.bag.length
          : 0;
    }

    if (ctrlSettingBtn) {
      ctrlSettingBtn.innerText =
        mode === "cursor"
          ? "MODE: CURSOR (TOUCH TO MOVE)"
          : "MODE: JOYSTICK (DRAG THUMB)";
    }

    if (muteSettingBtn) {
      muteSettingBtn.innerText = stats.mute ? "AUDIO: MUTED" : "AUDIO: ENABLED";
    }

    if (abandonBtn) {
      abandonBtn.style.display = isHub ? "none" : "inline-block";
    }

    // Update Quick-Slot Field Flask HUD Button
    let flaskBtn = document.getElementById("hud-flask-button");
    let fillRect = document.getElementById("hud-flask-fill-rect");
    let cdRing = document.getElementById("hud-flask-cooldown-ring");
    let cdText = document.getElementById("hud-flask-cd-text");
    let flaskBadge = document.getElementById("hud-flask-count-badge");

    if (flaskBtn) {
      let charges = stats.flaskCharges !== undefined ? stats.flaskCharges : 1;
      let maxCharges = stats.maxFlaskCharges || 1;
      let cdTimer = stats.flaskCooldownTimer || 0;

      if (flaskBadge) flaskBadge.innerText = `${charges}/${maxCharges}`;

      // 1. Dynamic Liquid Fill Level
      if (fillRect) {
        let fillPct = maxCharges > 0 ? charges / maxCharges : 0;
        let fillHeight = Math.round(52 * fillPct);
        let fillY = 6 + (52 - fillHeight);
        fillRect.setAttribute("y", fillY);
        fillRect.setAttribute("height", fillHeight);
      }

      // 2. Radial Sweeping 360 Degree Cooldown Ring & Countdown Text
      if (cdRing) {
        let totalCircumference = 81.68;
        if (cdTimer > 0 && charges > 0) {
          let cdProgress = cdTimer / 180; // 180 frames = 3.0s
          let offset = totalCircumference * (1 - cdProgress);
          cdRing.setAttribute("stroke-dashoffset", offset.toFixed(2));
          cdRing.style.display = "block";

          if (cdText) {
            let secLeft = (cdTimer / 60).toFixed(1);
            cdText.innerText = `${secLeft}s`;
          }
          flaskBtn.classList.add("flask-on-cooldown");
        } else {
          cdRing.setAttribute(
            "stroke-dashoffset",
            totalCircumference.toFixed(2),
          );
          cdRing.style.display = "none";
          if (cdText) cdText.innerText = "";
          flaskBtn.classList.remove("flask-on-cooldown");
        }
      }

      if (charges <= 0) {
        flaskBtn.classList.add("flask-empty");
      } else {
        flaskBtn.classList.remove("flask-empty");
      }

      // Apply saved position coordinates
      if (
        typeof stats.flaskX === "number" &&
        typeof stats.flaskY === "number" &&
        !flaskBtn.isDragging
      ) {
        flaskBtn.style.left = stats.flaskX + "px";
        flaskBtn.style.top = stats.flaskY + "px";
        flaskBtn.style.bottom = "auto";
        flaskBtn.style.right = "auto";
      } else if (!flaskBtn.isDragging) {
        const isLandscapeMobile =
          window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 600 || isLandscapeMobile;
        if (isMobile) {
          flaskBtn.style.left = "env(safe-area-inset-left, 24px)";
          flaskBtn.style.right = "auto";
          flaskBtn.style.bottom = "env(safe-area-inset-bottom, 36px)";
          flaskBtn.style.top = "auto";
        } else {
          flaskBtn.style.left = "24px";
          flaskBtn.style.right = "auto";
          flaskBtn.style.bottom = "36px";
          flaskBtn.style.top = "auto";
        }
      }
    }

    if (typeof window.updateHudBuffTray === "function") {
      window.updateHudBuffTray();
    }

    // Mastery/MP Alert Badge
    let masteryBtn = document.getElementById("btn-skills-toggle");
    if (masteryBtn) {
      let unspentMP = window.SkillTreeManager
        ? window.SkillTreeManager.getUnspentMP()
        : 0;
      let existingMpBadge = masteryBtn.querySelector(".hud-alert-badge");
      if (unspentMP > 0) {
        if (!existingMpBadge) {
          existingMpBadge = document.createElement("span");
          existingMpBadge.className = "hud-alert-badge";
          masteryBtn.appendChild(existingMpBadge);
        }
        existingMpBadge.innerText = unspentMP;
      } else if (existingMpBadge) {
        existingMpBadge.remove();
      }
    }

    // Hero Pod/SP Alert Badge
    let heroPod = document.querySelector(".hud-hero-pod");
    if (heroPod) {
      let unspentSP = stats.sp || 0;
      let existingSpBadge = heroPod.querySelector(".hud-alert-badge");
      if (unspentSP > 0) {
        if (!existingSpBadge) {
          existingSpBadge = document.createElement("span");
          existingSpBadge.className = "hud-alert-badge";
          heroPod.appendChild(existingSpBadge);
        }
        existingSpBadge.innerText = unspentSP;
      } else if (existingSpBadge) {
        existingSpBadge.remove();
      }
    }
  };

  window.updateHudBuffTray = function () {
    let tray = document.getElementById("hud-buff-tray");
    if (!tray) return;

    let stats = window.playerStats || {};
    let badges = [];

    let getAtkCol = (s) =>
      s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71";
    let getHpCol = (s) =>
      s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c";
    let getDefCol = (s) =>
      s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db";
    let getHasteCol = (s) =>
      s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f";

    if ((stats.atkPotionRuns || 0) > 0) {
      let col = getAtkCol(stats.atkPotionStrength || 0.1);
      badges.push({
        label: "ATK",
        val: `${stats.atkPotionRuns}R`,
        col: col,
        title: `Attack Elixir (+${Math.round((stats.atkPotionStrength || 0.1) * 100)}% Atk, ${stats.atkPotionRuns} run(s) left)`,
      });
    }

    if ((stats.hpPotionRuns || 0) > 0) {
      let col = getHpCol(stats.hpPotionStrength || 0.1);
      badges.push({
        label: "HP",
        val: `${stats.hpPotionRuns}R`,
        col: col,
        title: `Vitality Elixir (+${Math.round((stats.hpPotionStrength || 0.1) * 100)}% Max HP, ${stats.hpPotionRuns} run(s) left)`,
      });
    }

    if ((stats.defPotionRuns || 0) > 0) {
      let col = getDefCol(stats.defPotionStrength || 0.1);
      badges.push({
        label: "DEF",
        val: `${stats.defPotionRuns}R`,
        col: col,
        title: `Armored Elixir (+${Math.round((stats.defPotionStrength || 0.1) * 100)}% Def, ${stats.defPotionRuns} run(s) left)`,
      });
    }

    if ((stats.hastePotionRuns || 0) > 0) {
      let col = getHasteCol(stats.hastePotionStrength || 1);
      badges.push({
        label: "SPD",
        val: `${stats.hastePotionRuns}R`,
        col: col,
        title: `Haste Elixir (+Speed, ${stats.hastePotionRuns} run(s) left)`,
      });
    }

    if ((stats.xpPotionRuns || 0) > 0) {
      badges.push({
        label: "2x XP",
        val: `${stats.xpPotionRuns}R`,
        col: "#c084fc",
        title: `Double XP Elixir (+100% XP, ${stats.xpPotionRuns} run(s) left)`,
      });
    }

    if ((stats.dropPotionRuns || 0) > 0) {
      badges.push({
        label: "2x DROP",
        val: `${stats.dropPotionRuns}R`,
        col: "#34d399",
        title: `Double Drop Elixir (+100% Drop Rate, ${stats.dropPotionRuns} run(s) left)`,
      });
    }

    if ((stats.qlyPotionRuns || 0) > 0) {
      badges.push({
        label: "QLY",
        val: `${stats.qlyPotionRuns}R`,
        col: "#f472b6",
        title: `Drop Quality Elixir (+50% Drop Quality, ${stats.qlyPotionRuns} run(s) left)`,
      });
    }

    if (stats.frenzyTimer > 0) {
      badges.push({
        label: "FRENZY",
        val: `${Math.ceil(stats.frenzyTimer / 60)}s`,
        col: "#f1c40f",
        title: `Frenzy Mode Active (${Math.ceil(stats.frenzyTimer / 60)}s)`,
      });
    }

    if (stats.adrenalineTimer > 0) {
      badges.push({
        label: "ADRENALINE",
        val: `${Math.ceil(stats.adrenalineTimer / 60)}s`,
        col: "#e67e22",
        title: `Adrenaline Rush (+30% Damage, ${Math.ceil(stats.adrenalineTimer / 60)}s)`,
      });
    }

    if (stats.fortunesFavorTimer > 0) {
      badges.push({
        label: "FORTUNE",
        val: `${Math.ceil(stats.fortunesFavorTimer / 60)}s`,
        col: "#ffd700",
        title: `Fortune's Favor (+50% Gold, ${Math.ceil(stats.fortunesFavorTimer / 60)}s)`,
      });
    }

    if (stats.astralAwakeningTimer > 0) {
      badges.push({
        label: "ASTRAL",
        val: `${Math.ceil(stats.astralAwakeningTimer / 60)}s`,
        col: "#00d2ff",
        title: `Astral Awakening (+100% Damage, ${Math.ceil(stats.astralAwakeningTimer / 60)}s)`,
      });
    }

    if (stats.purifiedAegisTimer > 0) {
      badges.push({
        label: "AEGIS",
        val: `${Math.ceil(stats.purifiedAegisTimer / 60)}s`,
        col: "#2ecc71",
        title: `Purified Aegis (+50% Def, ${Math.ceil(stats.purifiedAegisTimer / 60)}s)`,
      });
    }

    if ((stats.viperShadowDanceCharges || 0) > 0) {
      badges.push({
        label: "VIPER",
        val: `${stats.viperShadowDanceCharges}x`,
        col: "#a855f7",
        title: `Viper's Shadow Dance (${stats.viperShadowDanceCharges} 100% Crit Strike(s))`,
      });
    }

    if (badges.length === 0) {
      tray.innerHTML = "";
      tray.style.display = "none";
      return;
    }

    tray.style.display = "flex";
    tray.innerHTML = badges
      .map(
        (b) => `
                    <div class="hud-buff-badge" style="border-color:${b.col}; box-shadow: 0 0 6px ${b.col}44;" title="${b.title}">
                      <span class="buff-label" style="color:${b.col};">${b.label}</span>
                      <span class="buff-runs" style="color:#ffffff;">${b.val}</span>
                    </div>
                  `,
      )
      .join("");
  };

  // --- HERO PROFILE & STASH MANAGEMENT ENGINE ---
  window.getItemIconSvg = function (item, size = 28) {
    if (!item) return "";
    let itemName = typeof item === "string" ? item : item.name || "";

    // Check if it's an ETC material
    if (window.etcDex && window.etcDex[itemName]) {
      if (typeof window.getEtcIconHtml === "function") {
        return window.getEtcIconHtml(itemName, size);
      }
    }
    // Check if it's a USE consumable
    if (window.useDex && window.useDex[itemName]) {
      if (typeof window.getUseIconHtml === "function") {
        return window.getUseIconHtml(itemName, size);
      }
    }

    if (typeof window.getEquipIconHtml === "function") {
      return window.getEquipIconHtml(item, size);
    }
    let col = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";
    let label = (item.subType || item.type || "EQ").slice(0, 2).toUpperCase();
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:rgba(0,0,0,0.4); border:1px solid ${col}; border-radius:4px; font-weight:bold; font-size:9px; color:${col}; flex-shrink:0;">${label}</span>`;
  };

  window.UIManager = window.UIManager || {};
  window.tooltipHideTimeoutId = null;
  window.slotLongPressTimeout = null;
  window.isSlotLongPressActive = false;

  // --- HIDE TOOLTIPS WITH DESKTOP GRACE PERIOD & IMMEDIATE DISMISS ---
  window.UIManager.hideTooltip = function (immediate = false) {
    if (window.tooltipHideTimeoutId) {
      clearTimeout(window.tooltipHideTimeoutId);
      window.tooltipHideTimeoutId = null;
    }
    const doHide = () => {
      [
        "game-tooltip",
        "etc-tooltip",
        "stat-tooltip",
        "log-item-tooltip",
      ].forEach((id) => {
        let el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      window.activeStatTooltip = null;
    };
    if (immediate) {
      doHide();
    } else {
      window.tooltipHideTimeoutId = setTimeout(doHide, 150);
    }
  };
  window.hideTooltip = (immediate = false) =>
    window.UIManager.hideTooltip(immediate);

  // --- POSITION TOOLTIP WITH BOUNDARY CLAMPING ---
  window.UIManager.positionTooltip = function (e, tt) {
    if (window.tooltipHideTimeoutId) {
      clearTimeout(window.tooltipHideTimeoutId);
      window.tooltipHideTimeoutId = null;
    }
    let containerEl = document.getElementById("game-container");
    let container = containerEl
      ? containerEl.getBoundingClientRect()
      : { left: 0, top: 0 };

    let clientX =
      e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY =
      e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    let ttWidth = tt.offsetWidth;
    let ttHeight = tt.offsetHeight;
    let padding = 10;

    let vx, vy;
    const isLandscapeMobile =
      window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 600 || isLandscapeMobile;

    if (isMobile) {
      let isComparison = tt.querySelector(".compare-border") !== null;
      if (isComparison) {
        tt.style.fontSize = "9.5px";
        tt.querySelectorAll(".tooltip-card").forEach((card) => {
          card.style.padding = "6px 8px";
        });
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "10.5px";
          title.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "8.5px";
          sub.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "9px";
          line.style.marginBottom = "1px";
        });
        ttWidth = tt.offsetWidth;
        ttHeight = tt.offsetHeight;
      } else {
        tt.style.fontSize = "";
        tt.querySelectorAll(".tooltip-card").forEach((card) => {
          card.style.padding = "";
        });
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "";
          title.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "";
          sub.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "";
          line.style.marginBottom = "";
        });
      }

      vx = (window.innerWidth - ttWidth) / 2;
      vy = clientY + 18;

      if (vy + ttHeight > window.innerHeight) {
        vy = clientY - ttHeight - 18;
      }
      if (vy < padding) vy = padding;

      let spaceAvailable = window.innerHeight - 2 * padding;
      if (ttHeight > spaceAvailable) {
        tt.style.maxHeight = spaceAvailable + "px";
        tt.style.overflowY = "auto";
        vy = padding;
      } else {
        tt.style.maxHeight = "";
        tt.style.overflowY = "";
      }
    } else {
      tt.style.fontSize = "";
      tt.style.maxHeight = "";
      tt.style.overflowY = "";
      tt.querySelectorAll(".tooltip-card").forEach((card) => {
        card.style.padding = "";
      });
      tt.querySelectorAll(".tt-title").forEach((title) => {
        title.style.fontSize = "";
        title.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
        sub.style.fontSize = "";
        sub.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-stat-line").forEach((line) => {
        line.style.fontSize = "";
        line.style.marginBottom = "";
      });

      vx = clientX + 15;
      vy = clientY + 15;

      if (vx + ttWidth > window.innerWidth) vx = clientX - ttWidth - 15;
      if (vy + ttHeight > window.innerHeight) vy = clientY - ttHeight - 15;

      if (vx < 5) vx = 5;
      if (vy < 5) vy = 5;
    }

    let x = vx - container.left;
    let y = vy - container.top;

    tt.style.left = x + "px";
    tt.style.top = y + "px";
  };
  window.positionTooltip = (e, tt) => window.UIManager.positionTooltip(e, tt);

  // --- PREVENT TOOLTIP EVENT LEAKS ---
  window.preventTooltipLeaks = function (id) {
    let el = document.getElementById(id);
    if (!el) return;

    let startY = 0;
    let startX = 0;
    let isScrolling = false;

    el.addEventListener("mouseenter", () => {
      if (window.tooltipHideTimeoutId) {
        clearTimeout(window.tooltipHideTimeoutId);
        window.tooltipHideTimeoutId = null;
      }
    });
    el.addEventListener("mouseleave", () => {
      window.hideTooltip();
    });

    const handleStart = (clientX, clientY) => {
      startY = clientY;
      startX = clientX;
      isScrolling = false;
    };

    const handleMove = (clientX, clientY) => {
      let diffY = Math.abs(clientY - startY);
      let diffX = Math.abs(clientX - startX);
      if (diffY > 8 || diffX > 8) {
        isScrolling = true;
      }
    };

    const handleEnd = (e) => {
      if (isScrolling) return;

      if (
        e.target.closest("summary") ||
        e.target.closest("details") ||
        e.target.closest("button") ||
        e.target.closest("select") ||
        e.target.closest("option") ||
        e.target.closest("label") ||
        e.target.closest("input")
      ) {
        return;
      }

      e.preventDefault();
      window.hideTooltip();
    };

    el.addEventListener(
      "pointerdown",
      (e) => {
        e.stopPropagation();
        handleStart(e.clientX, e.clientY);
      },
      { passive: false },
    );

    el.addEventListener(
      "pointermove",
      (e) => {
        e.stopPropagation();
        handleMove(e.clientX, e.clientY);
      },
      { passive: true },
    );

    el.addEventListener(
      "pointerup",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );

    el.addEventListener(
      "touchstart",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchend",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );
  };

  // --- MOBILE LONG-PRESS SLOT GESTURE ---
  window.startSlotLongPress = function (e, slotKey) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    window.isSlotLongPressActive = false;
    if (window.slotLongPressTimeout) clearTimeout(window.slotLongPressTimeout);

    let target = e.currentTarget;
    target.style.transform = "scale(0.95)";
    target.style.transition = "transform 0.1s";

    let startX = e.clientX;
    let startY = e.clientY;

    const cancelOnMove = (moveEvent) => {
      let diffX = Math.abs(moveEvent.clientX - startX);
      let diffY = Math.abs(moveEvent.clientY - startY);
      if (diffX > 8 || diffY > 8) {
        if (window.slotLongPressTimeout) {
          clearTimeout(window.slotLongPressTimeout);
          window.slotLongPressTimeout = null;
        }
        target.style.transform = "none";
        target.removeEventListener("pointermove", cancelOnMove);
      }
    };
    target.addEventListener("pointermove", cancelOnMove);

    window.slotLongPressTimeout = setTimeout(() => {
      window.isSlotLongPressActive = true;
      target.style.transform = "none";
      target.removeEventListener("pointermove", cancelOnMove);

      let mockEvent = {
        clientX: startX,
        clientY: startY,
        stopPropagation: () => {},
        preventDefault: () => {},
      };

      if (typeof window.showSlotTooltip === "function") {
        window.showSlotTooltip(mockEvent, slotKey);
      }

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 450);
  };

  window.endSlotLongPress = function (e) {
    if (window.slotLongPressTimeout) {
      clearTimeout(window.slotLongPressTimeout);
      window.slotLongPressTimeout = null;
    }
    if (e && e.currentTarget) {
      e.currentTarget.style.transform = "none";
    }
  };

  // --- SHOW TOOLTIP HANDLERS ---
  window.showItemTooltip = function (e, item) {
    if (!item) return;
    if (e && e.stopPropagation) e.stopPropagation();

    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  };

  window.showInventoryTooltip = function (e, itemId) {
    if (
      e &&
      e.target &&
      e.target.closest &&
      (e.target.closest("button") || e.target.closest(".btn-action"))
    )
      return;
    e.stopPropagation();

    let item =
      (window.inventory &&
        window.inventory.EQUIP &&
        window.inventory.EQUIP.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.SIGIL &&
        window.inventory.SIGIL.find((i) => i.id === itemId)) ||
      (window.frozenItemDb && window.frozenItemDb[itemId]);

    if (!item) return;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  };

  window.showSlotTooltip = function (e, slot) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.equippedSlots) return;
    let item = window.equippedSlots[slot];
    if (!item) return;
    item.isEquippedSlot = slot;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  };

  window.showForgeTooltip = function (e, itemId) {
    if (
      e &&
      e.target &&
      e.target.closest &&
      (e.target.closest("button") || e.target.closest(".btn-action"))
    )
      return;
    e.stopPropagation();

    let item =
      (window.inventory &&
        window.inventory.EQUIP &&
        window.inventory.EQUIP.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId));

    if (!item && window.equippedSlots) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId) {
          item = window.equippedSlots[k];
          item.isEquippedSlot = k;
          break;
        }
      }
    }
    if (!item) return;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  };

  // --- DUAL-RING COMPARISON TOGGLE ---
  window.toggleRingComparisonSlot = function (e, itemId) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    window.state.preferredRingComparisonSlot =
      (window.state.preferredRingComparisonSlot || "ring1") === "ring1"
        ? "ring2"
        : "ring1";

    let tt = document.getElementById("game-tooltip");
    if (tt && tt.style.display === "block" && itemId) {
      let item = null;

      // Broad search across all potential inventory, equipped, and bag states
      if (window.inventory && window.inventory.EQUIP) {
        item = window.inventory.EQUIP.find((i) => i.id === itemId);
      }
      if (!item && window.player && window.player.bag) {
        item = window.player.bag.find((i) => i.id === itemId);
      }
      if (!item && window.equippedSlots) {
        for (let k in window.equippedSlots) {
          if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId) {
            item = window.equippedSlots[k];
            break;
          }
        }
      }
      if (!item && window.frozenItemDb) {
        item = window.frozenItemDb[itemId];
      }

      if (item) {
        tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
        tt.style.borderColor = window.getTierColor
          ? window.getTierColor(item.statsRolled)
          : "#3498db";
      }
    }
  };

  // Global Outside-Tap Tooltip Dismissal Handler
  document.addEventListener("pointerdown", function (e) {
    ["game-tooltip", "etc-tooltip", "stat-tooltip", "log-item-tooltip"].forEach(
      (id) => {
        let tt = document.getElementById(id);
        if (tt && tt.style.display !== "none" && tt.style.display !== "") {
          if (!e.target.closest(`#${id}`)) {
            window.UIManager.hideTooltip(true);
          }
        }
      },
    );
  });

  // Attach event leak protection on ready
  document.addEventListener("DOMContentLoaded", () => {
    window.preventTooltipLeaks("game-tooltip");
    window.preventTooltipLeaks("etc-tooltip");
    window.preventTooltipLeaks("stat-tooltip");
  });

  window.activeBagTab = "EQUIP";
  window.activeStashTab = "EQUIP";

  window.switchBagTab = function (tabKey) {
    window.activeBagTab = tabKey;
    ["EQUIP", "SIGIL", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`bag-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderBagModalContent();
  };

  window.switchStashTab = function (tabKey) {
    window.activeStashTab = tabKey;
    ["EQUIP", "SIGIL", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`stash-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderProfileModal();
  };

  window.activeProfileMobileTab = "stats";

  window.openSkillTree = function () {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let modal = document.getElementById("mastery-modal");
    if (!modal) return;
    modal.style.display = "flex";
    if (window.SkillTreeManager) {
      window.SkillTreeManager.renderSkillTreeUI();
    }
  };

  window.toggleMasteryModal = function () {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let modal = document.getElementById("mastery-modal");
    if (!modal) return;
    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      if (window.SkillTreeManager) {
        window.SkillTreeManager.renderSkillTreeUI();
      }
    } else {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      if (
        window.SkillTreeManager &&
        typeof window.SkillTreeManager.stopAnimationLoop === "function"
      ) {
        window.SkillTreeManager.stopAnimationLoop();
      }
    }
  };

  window.switchProfileTab = function (tabKey) {
    window.activeProfileMobileTab = tabKey;
    const tabs = ["stats", "gear", "satchel", "achievements"];
    tabs.forEach((t) => {
      let btn = document.getElementById(`profile-tab-${t}`);
      let sec = document.getElementById(`profile-sec-${t}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
      if (sec) sec.classList.toggle("active-mobile-section", t === tabKey);
    });
    let profileCard = document.querySelector(".profile-card");
    if (profileCard) {
      profileCard.classList.toggle(
        "skills-fullscreen-mode",
        tabKey === "achievements",
      );
    }
    if (tabKey === "achievements") {
      window.renderAchievementsTab();
    }
    window.renderProfileModal();
  };

  window.state.achievementFilter = "all";

  window.switchAchievementFilter = function (filterKey) {
    window.state.achievementFilter = filterKey;
    window.renderAchievementsTab();
  };

  window.renderAchievementsTab = function () {
    let container = document.getElementById("achievements-content-panel");
    if (!container) return;

    let unlocked = window.playerStats.unlockedAchievements || [];
    let timestamps = window.playerStats.achievementTimestamps || {};
    let totals = window.playerStats.cachedAchievementBonusTotals || {};

    let totalCount = window.AchievementsData.length;
    let unlockedCount = unlocked.length;
    let progressPct = Math.round((unlockedCount / totalCount) * 100) || 0;

    // Compile active passive stats
    let activeBonusTexts = [];
    for (let sKey in totals) {
      let val = totals[sKey];
      if (val > 0) {
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
          "expPct",
          "potDurationPct",
          "potStrengthPct",
          "atkPct",
          "maxHpPct",
          "defPct",
          "moveSpeedPct",
          "strPct",
          "dexPct",
          "intPct",
          "idleSpeedPct",
          "activeSpeedPct",
        ].includes(sKey);
        let valStr = isPct ? `+${(val * 100).toFixed(1)}%` : `+${val}`;
        let label = window.getStatLabel ? window.getStatLabel(sKey) : sKey;
        activeBonusTexts.push(`${label} ${valStr}`);
      }
    }
    let activeBonusStr =
      activeBonusTexts.length > 0
        ? activeBonusTexts.join(" • ")
        : "No active milestone bonuses yet.";

    // Achievements Category Filter Options
    let activeFilter = window.state.achievementFilter || "all";
    let filters = [
      { key: "all", label: "ALL" },
      { key: "slayer", label: "SLAYER" },
      { key: "floor", label: "EXPLORER" },
      { key: "hoarder", label: "WEALTH" },
      { key: "extract", label: "SURVIVOR" },
      { key: "salvage", label: "SALVAGER" },
      { key: "forge", label: "CRAFTING" },
      { key: "misc", label: "TACTICAL" },
      { key: "sing", label: "VALOR FEATS" },
    ];

    let filterBarHtml = `
    <div class="ach-filter-bar">
      ${filters
        .map((f) => {
          let isActive = f.key === activeFilter;
          return `
          <button class="ach-filter-btn ${isActive ? "active" : ""}" onclick="window.switchAchievementFilter('${f.key}')">
            ${f.label}
          </button>
        `;
        })
        .join("")}
    </div>
  `;

    // Filter the achievements list
    let filteredAchs = window.AchievementsData.filter((ach) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "sing") return !!ach.isSingleTier;

      let cat = "";
      if (ach.reqType === "kills") cat = "slayer";
      else if (ach.reqType === "floor") cat = "floor";
      else if (ach.reqType === "gold") cat = "hoarder";
      else if (ach.reqType === "extract") cat = "extract";
      else if (ach.reqType === "salvage") cat = "salvage";
      else if (["temper", "reforges", "enchant"].includes(ach.reqType))
        cat = "forge";
      else if (
        ["deflections", "rare_spawns", "single_hit", "gold_upgrades"].includes(
          ach.reqType,
        )
      )
        cat = "misc";

      return cat === activeFilter;
    });

    // Render cards
    let cardsHtml = filteredAchs
      .map((ach) => {
        let isUnlocked = unlocked.includes(ach.id);
        let timeStr = "";
        if (isUnlocked && timestamps[ach.id]) {
          timeStr = new Date(timestamps[ach.id]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        // Process Rewards Text
        let rewardsList = [];
        if (ach.stats) {
          for (let sKey in ach.stats) {
            let val = ach.stats[sKey];
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
              "expPct",
              "potDurationPct",
              "potStrengthPct",
              "atkPct",
              "maxHpPct",
              "defPct",
              "moveSpeedPct",
              "strPct",
              "dexPct",
              "intPct",
              "idleSpeedPct",
              "activeSpeedPct",
            ].includes(sKey);
            let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
            let label = window.getStatLabel ? window.getStatLabel(sKey) : sKey;
            rewardsList.push(`${label} ${valStr}`);
          }
        }
        let rewardsStr =
          rewardsList.length > 0
            ? `Reward: ${rewardsList.join(", ")}`
            : "Cosmetic Award";

        // Progress bar for locked achievements
        let progressHtml = "";
        if (!isUnlocked) {
          let progress = window.getAchievementProgress(ach);
          let progressNum =
            progress instanceof BigNum
              ? progress.valueOf()
              : Number(progress || 0);
          let targetNum = ach.isSingleTier ? 1 : Number(ach.reqValue || 1);

          let pct =
            Math.max(0, Math.min(100, (progressNum / targetNum) * 100)) || 0;
          let displayProgress =
            progress instanceof BigNum
              ? window.formatNumber(progress)
              : progressNum.toLocaleString();
          let displayTarget = ach.isSingleTier
            ? "1"
            : ach.reqValue.toLocaleString();

          progressHtml = `
        <div class="ach-progress-box">
          <div class="ach-progress-bar-bg">
            <div class="ach-progress-bar-fill" style="width:${pct}%;"></div>
          </div>
          <div class="ach-progress-text">${displayProgress} / ${displayTarget}</div>
        </div>
      `;
        }

        let badgeHtml = window.getAchievementBadgeHtml
          ? window.getAchievementBadgeHtml(ach, isUnlocked, 34)
          : "";

        return `
      <div id="ach-card-${ach.id}" class="ach-card ${isUnlocked ? "unlocked" : "locked"}">
        <div class="ach-badge-box">
          ${badgeHtml}
        </div>
        <div class="ach-info">
          <div class="ach-title-row">
            <span class="ach-title">${ach.name}</span>
            <span class="ach-status-tag ${isUnlocked ? "tag-unlocked" : "tag-locked"}">
              ${isUnlocked ? `UNLOCKED • ${timeStr}` : "LOCKED"}
            </span>
          </div>
          <span class="ach-desc">${ach.desc}</span>
          <span class="ach-reward-badge" style="color: ${isUnlocked ? "#34d399" : "#64748b"};">
            ${rewardsStr}
          </span>
          ${progressHtml}
        </div>
      </div>
    `;
      })
      .join("");

    container.innerHTML = `
    <div class="ach-wrapper">
      <!-- Unlocked Count & Summary Banner -->
      <div class="ach-summary-banner">
        <div class="ach-summary-header">
          <span class="ach-summary-title">EXTRACTION CHALLENGES</span>
          <span class="ach-summary-count">${unlockedCount} / ${totalCount} Cleared (${progressPct}%)</span>
        </div>
        <div class="ach-total-bar">
          <div class="ach-total-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="ach-active-bonuses">
          <strong>COMBINED MILESTONE PASSIVES:</strong> ${activeBonusStr}
        </div>
      </div>

      <!-- Filters Bar -->
      ${filterBarHtml}

      <!-- Unlocked/Locked Cards List -->
      <div class="ach-list">
        ${cardsHtml || '<div style="color:#64748b; font-style:italic; text-align:center; padding:30px;">No challenges match this filter category.</div>'}
      </div>
    </div>
  `;
  };

  window.navigateToAchievement = function (id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let modal = document.getElementById("profile-modal");
    if (modal) {
      modal.style.display = "flex";
    }

    // Auto-switch to correct category filter before loading tab
    let ach = window.AchievementsData.find((a) => a.id === id);
    if (ach) {
      let cat = "all";
      if (ach.isSingleTier) cat = "sing";
      else if (ach.reqType === "kills") cat = "slayer";
      else if (ach.reqType === "floor") cat = "floor";
      else if (ach.reqType === "gold") cat = "hoarder";
      else if (ach.reqType === "extract") cat = "extract";
      else if (ach.reqType === "salvage") cat = "salvage";
      else if (["temper", "reforges", "enchant"].includes(ach.reqType))
        cat = "forge";
      else if (
        ["deflections", "rare_spawns", "single_hit", "gold_upgrades"].includes(
          ach.reqType,
        )
      )
        cat = "misc";

      window.state.achievementFilter = cat;
    }

    window.switchProfileTab("achievements");

    // Smooth scroll and pulse high-contrast highlight on the targeted card
    setTimeout(() => {
      let card = document.getElementById(`ach-card-${id}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.remove("ach-highlight-pulse");
        void card.offsetWidth; // trigger reflow
        card.classList.add("ach-highlight-pulse");
      }
    }, 250);
  };

  window.toggleProfileModal = function () {
    window.hideTooltip();
    let modal = document.getElementById("profile-modal");
    if (!modal) return;

    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      window.switchProfileTab(window.activeProfileMobileTab || "stats");
      window.renderProfileModal();
    } else {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      let profileCard = document.querySelector(".profile-card");
      if (profileCard) {
        profileCard.classList.remove("skills-fullscreen-mode");
      }
      if (
        window.SkillTreeManager &&
        typeof window.SkillTreeManager.stopAnimationLoop === "function"
      ) {
        window.SkillTreeManager.stopAnimationLoop();
      }
    }
  };

  window.renderProfileModal = function () {
    let statsListEl = document.getElementById("profile-stats-list");
    let paperdollEl = document.getElementById("paperdoll-grid");
    let stashListEl = document.getElementById("profile-stash-list");
    let stashCountEl = document.getElementById("profile-stash-count");
    let spCountEl = document.getElementById("profile-sp-count");
    let matrixGridEl = document.getElementById("attribute-matrix-grid");
    let headerTitleEl = document.getElementById("profile-header-title");

    if (!statsListEl || !paperdollEl || !stashListEl) return;

    // Slot Sanity Check: Ensure equipped items match valid slot types
    if (window.equippedSlots) {
      const validSlotTypes = {
        weapon: ["weapon"],
        subweapon: ["subweapon", "shield", "dagger", "tome"],
        helmet: ["helmet"],
        chest: ["chest"],
        leggings: ["leggings"],
        overall: ["overall"],
        boots: ["boots"],
        ring1: ["ring"],
        ring2: ["ring"],
        art1: ["artifact"],
        art2: ["artifact"],
        art3: ["artifact"],
      };

      for (let slotKey in window.equippedSlots) {
        let item = window.equippedSlots[slotKey];
        if (item) {
          let allowed = validSlotTypes[slotKey] || [slotKey];
          if (!allowed.includes(item.type)) {
            window.equippedSlots[slotKey] = null;
            if (!window.player.stash) window.player.stash = [];
            window.player.stash.push(item);
          }
        }
      }
    }

    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let stats = window.playerStats || {};
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    if (headerTitleEl) {
      headerTitleEl.innerText = isHub
        ? "HERO CREST & VAULT"
        : `EXPEDITION OVERVIEW (FLOOR ${window.player.depth || 1})`;
    }

    // Initialize SP Draft State
    if (typeof window.initSPDraft === "function") window.initSPDraft();
    let curSP = window.draftSP !== undefined ? window.draftSP : stats.sp || 0;
    let draftAlloc = window.draftSPAllocations || {
      spStr: 0,
      spDex: 0,
      spInt: 0,
    };
    let committedAlloc = stats.spAllocations || {
      spStr: 0,
      spDex: 0,
      spInt: 0,
    };

    let hasStaged =
      (draftAlloc.spStr || 0) > 0 ||
      (draftAlloc.spDex || 0) > 0 ||
      (draftAlloc.spInt || 0) > 0;
    if (spCountEl) spCountEl.innerText = `${curSP} SP`;

    // Explicitly invalidate cache to force a fresh baseline evaluation
    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }

    let curStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats(false)
        : {};
    let draftStats =
      hasStaged && typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats(true)
        : curStats;

    if (matrixGridEl) {
      let canSpend1 = curSP >= 1;
      let canSpend5 = curSP >= 5;

      let renderAttrCard = (
        name,
        desc,
        attrKey,
        committedCount,
        stagedCount,
        iconType,
      ) => {
        let totalCount = committedCount + stagedCount;
        let stagedBadge =
          stagedCount > 0
            ? `<span class="attr-staged-val">(+${stagedCount})</span>`
            : "";
        let sub1Disabled = stagedCount < 1 ? "disabled" : "";
        let isStaged = stagedCount > 0;
        let iconSvg =
          typeof window.getUiIconSvg === "function"
            ? window.getUiIconSvg(iconType, 13)
            : "";

        return `
                  <div class="attr-card ${isStaged ? "staged-active" : ""}">
                    <div class="attr-card-header">
                      <div class="attr-title-group">
                        ${iconSvg}
                        <span class="attr-name">${name}</span>
                      </div>
                      <div class="attr-count-badge">
                        <span class="attr-total-val">${totalCount}</span>
                        ${stagedBadge}
                      </div>
                    </div>
                    <div class="attr-desc">${desc}</div>
                    <div class="attr-btn-bar">
                      <button class="sp-btn sp-btn-sub" ${sub1Disabled} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', -1)" onclick="event.stopPropagation();">-1</button>
                      <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', 1)" onclick="event.stopPropagation();">+1</button>
                      <button class="sp-btn sp-btn-add" ${canSpend5 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', 5)" onclick="event.stopPropagation();">+5</button>
                      <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', ${curSP})" onclick="event.stopPropagation();">MAX</button>
                    </div>
                  </div>
                `;
      };

      let confirmBarHtml = hasStaged
        ? `
                    <div style="display:flex; gap:6px; margin-top:6px;">
                      <button class="action-btn" style="flex:1; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#34d399;" onpointerdown="event.stopPropagation(); window.confirmSP()" onclick="event.stopPropagation();">CONFIRM ATTRIBUTES</button>
                      <button class="action-btn" style="flex:0.4; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #ef4444 0%, #b91c1c 100%); border-color:#f87171;" onpointerdown="event.stopPropagation(); window.resetDraftSP()" onclick="event.stopPropagation();">RESET</button>
                    </div>
                  `
        : "";

      matrixGridEl.innerHTML = `
                  ${renderAttrCard("STRENGTH", "+10 Max HP, +2.5 Attack Power", "Str", committedAlloc.spStr || 0, draftAlloc.spStr || 0, "str")}
                  ${renderAttrCard("DEXTERITY", "+0.1% Crit, +0.5% Crit Multi, +1 Move Speed", "Dex", committedAlloc.spDex || 0, draftAlloc.spDex || 0, "dex")}
                  ${renderAttrCard("INTELLIGENCE", "+1 Defense, +0.5% Potion Power, Arcane Barrier, & Alchemical Preservation", "Int", committedAlloc.spInt || 0, draftAlloc.spInt || 0, "int")}
                  ${confirmBarHtml}
                `;
    }

    // 1. Render Character Stats (With live draft preview diffs)
    let iconSvg = (key) =>
      typeof window.getUiIconSvg === "function"
        ? window.getUiIconSvg(key, 12)
        : "";

    let formatStatValWithDiff = (
      key,
      curVal,
      draftVal,
      isPct = false,
      pctDecimals = 1,
    ) => {
      let curNum =
        curVal && curVal.valueOf ? curVal.valueOf() : Number(curVal || 0);
      let draftNum =
        draftVal && draftVal.valueOf
          ? draftVal.valueOf()
          : Number(draftVal || 0);

      let curStr = isPct
        ? (curNum * 100).toFixed(pctDecimals) + "%"
        : window.formatNumber(Math.round(curNum));
      if (!hasStaged) return curStr;

      let diff = draftNum - curNum;
      if (Math.abs(diff) < 0.0001) return curStr;

      let draftStr = isPct
        ? (draftNum * 100).toFixed(pctDecimals) + "%"
        : window.formatNumber(Math.round(draftNum));
      let diffStr = isPct
        ? (diff > 0 ? "+" : "") + (diff * 100).toFixed(pctDecimals) + "%"
        : (diff > 0 ? "+" : "") + window.formatNumber(Math.round(diff));
      let color = diff > 0 ? "#2ecc71" : "#e74c3c";

      return `<span style="color:#aaa;">${curStr}</span> ➔ <strong style="color:#fff;">${draftStr}</strong> <span style="color:${color}; font-size:8.5px;">(${diffStr})</span>`;
    };

    statsListEl.innerHTML = `
                                  <div class="stat-line"><span class="stat-label">${iconSvg("atk")} ATTACK</span><span class="stat-val">${formatStatValWithDiff("atk", curStats.atk, draftStats.atk)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("def")} DEFENSE</span><span class="stat-val">${formatStatValWithDiff("def", curStats.def, draftStats.def)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("maxHp")} MAX HP</span><span class="stat-val">${formatStatValWithDiff("maxHp", curStats.maxHp, draftStats.maxHp)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("moveSpeed")} MOVE SPEED</span><span class="stat-val">${formatStatValWithDiff("moveSpeed", curStats.moveSpeed, draftStats.moveSpeed, false)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("critChance")} CRIT CHANCE</span><span class="stat-val">${formatStatValWithDiff("critChance", curStats.critChance, draftStats.critChance, true, 1)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("critDamage")} CRIT MULTI</span><span class="stat-val">${formatStatValWithDiff("critDamage", curStats.critDamage, draftStats.critDamage, true, 1)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("block")} BLOCK RATE</span><span class="stat-val">${formatStatValWithDiff("block", curStats.block, draftStats.block, true, 1)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("parry")} PARRY RATE</span><span class="stat-val">${formatStatValWithDiff("parry", curStats.parry, draftStats.parry, true, 1)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("barrier")} BARRIER</span><span class="stat-val">${formatStatValWithDiff("arcaneBarrier", curStats.arcaneBarrier, draftStats.arcaneBarrier, true, 1)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("dropRate")} DROP RATE</span><span class="stat-val">${formatStatValWithDiff("drop", curStats.drop, draftStats.drop, true, 0)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("goldMulti")} GOLD MULTI</span><span class="stat-val">${formatStatValWithDiff("gold", curStats.gold, draftStats.gold, true, 0)}</span></div>
                                `;

    // 2. Render Paperdoll Equipment Slots
    let slotKeys = [
      { key: "weapon", label: "WEAPON" },
      { key: "subweapon", label: "OFFHAND" },
      { key: "helmet", label: "HELMET" },
      { key: "chest", label: "CHEST" },
      { key: "leggings", label: "LEGS" },
      { key: "overall", label: "OVERALL" },
      { key: "boots", label: "BOOTS" },
      { key: "ring1", label: "RING 1" },
      { key: "ring2", label: "RING 2" },
      { key: "art1", label: "RELIC 1" },
      { key: "art2", label: "RELIC 2" },
      { key: "art3", label: "RELIC 3" },
    ];

    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    paperdollEl.innerHTML = slotKeys
      .map((s) => {
        let item = window.equippedSlots[s.key];
        let lvl =
          (window.playerStats.slotUpgrades &&
            window.playerStats.slotUpgrades[s.key]) ||
          0;
        let attunementHtml =
          lvl > 0
            ? `<span style="background: rgba(168, 85, 247, 0.2); color: #df9ffb; border: 1px solid rgba(168, 85, 247, 0.4); padding: 1.5px 4px; border-radius: 3px; font-size: 8px; font-weight:bold; font-family:monospace; margin-left: auto; margin-right: 6px; flex-shrink: 0; line-height: 1;">ATN +${lvl}%</span>`
            : "";

        if (!item) {
          return `
                                        <div class="paperdoll-slot" style="display: flex; align-items: center; justify-content: space-between;">
                                          <div style="display: flex; flex-direction: column; text-align: left;">
                                            <span class="slot-label" style="width: auto;">${s.label}</span>
                                            <span style="font-size:8.5px; color:#475569; font-style:italic;">[EMPTY SLOT]</span>
                                          </div>
                                          ${attunementHtml}
                                        </div>
                                      `;
        }

        let col = window.getTierColor
          ? window.getTierColor(item.statsRolled)
          : "#00d2ff";
        let starsLabel =
          item.statsRolled === "UNIQUE"
            ? "UNIQUE"
            : `${item.statsRolled || 0} STAR`;
        let iconHtml = window.getItemIconSvg(item, 28);
        let isInsured = !!item.locked;

        let insureBtn = `<button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>`;

        let actionHtml = isHub
          ? `
                        ${insureBtn}
                        <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                      `
          : `
                        <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                      `;

        return `
                                      <div class="paperdoll-slot" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, window.equippedSlots['${s.key}'])">
                                        ${iconHtml}
                                        <div class="item-info">
                                          <span class="item-title" style="color:${col};">${item.name}</span>
                                          <span class="item-sub">LV.${item.stageLevel || 1} • ${starsLabel} ${lvl > 0 ? `<strong style="color: #df9ffb;">(ATN +${lvl}%)</strong>` : ""}</span>
                                        </div>
                                        <div class="item-actions">
                                          ${actionHtml}
                                        </div>
                                      </div>
                                    `;
      })
      .join("");

    // 3. Render Right Panel (Vault & Satchel with Categories)
    let stashTab = window.activeStashTab || "EQUIP";
    let sectionHeaderEl = document.getElementById("profile-satchel-title");

    if (stashTab === "EQUIP") {
      let rawList = isHub
        ? window.inventory.EQUIP || []
        : window.player.bag || [];
      let displayList = rawList.filter((item) => item.type !== "sigil");

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `${isHub ? "EQUIPMENT VAULT" : "CARRIED GEAR"} (<span id="profile-stash-count">${displayList.length}</span>)`;
      }

      if (displayList.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">${isHub ? "Storage vault is empty.<br>Extract loot from dungeon runs to store items here!" : "No items collected yet on this run.<br>Defeat monsters and open chests to find loot!"}</div>`;
      } else {
        stashListEl.innerHTML = displayList
          .map((item) => {
            let col = window.getTierColor
              ? window.getTierColor(item.statsRolled)
              : "#00d2ff";
            let typeLabel = (item.subType || item.type || "ITEM").toUpperCase();
            let starsLabel =
              item.statsRolled === "UNIQUE"
                ? "UNIQUE"
                : `${item.statsRolled || 0} STAR`;
            let iconHtml = window.getItemIconSvg
              ? window.getItemIconSvg(item, 28)
              : "";
            let isInsured = !!item.locked;

            let statPreview = [];
            if (item.atk)
              statPreview.push(
                `ATK +${window.formatNumber ? window.formatNumber(item.atk) : item.atk}`,
              );
            if (item.def)
              statPreview.push(
                `DEF +${window.formatNumber ? window.formatNumber(item.def) : item.def}`,
              );
            if (item.maxHp)
              statPreview.push(
                `HP +${window.formatNumber ? window.formatNumber(item.maxHp) : item.maxHp}`,
              );
            let statStr =
              statPreview.length > 0
                ? statPreview.join(" | ")
                : `${starsLabel}`;

            let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderProfileModal();">SALVAGE</button>`;

            let actionsHtml = isHub
              ? `
                                        <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>
                                        <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromStash(${item.id})">EQUIP</button>
                                        ${salvageBtn}
                                      `
              : `
                                        <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
                                        ${salvageBtn}
                                      `;

            let actualIdx = isHub
              ? window.inventory.EQUIP.findIndex((i) => i.id === item.id)
              : window.player.bag.findIndex((i) => i.id === item.id);

            return `
                                          <div class="stash-card" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, ${isHub ? "window.inventory.EQUIP" : "window.player.bag"}[${actualIdx}])">
                                            ${iconHtml}
                            <div class="item-info">
                              <span class="item-title" style="color:${col};">${item.name}</span>
                              <span class="item-sub">${typeLabel} • LV.${item.stageLevel || 1}</span>
                              <span class="item-sub" style="color:#2ecc71;">${statStr}</span>
                            </div>
                            <div class="item-actions">
                              ${actionsHtml}
                            </div>
                          </div>
                        `;
          })
          .join("");
      }
    } else if (stashTab === "SIGIL") {
      let displayList = isHub
        ? window.inventory.SIGIL || []
        : (window.player.bag || []).filter((item) => item.type === "sigil");

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `${isHub ? "SIGIL VAULT" : "CARRIED SIGILS"} (<span id="profile-stash-count">${displayList.length}</span>)`;
      }

      if (displayList.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">${isHub ? "Sigil vault is empty.<br>Extract sigils from dungeon runs to store them here!" : "No sigils collected yet on this run."}</div>`;
      } else {
        stashListEl.innerHTML = displayList
          .map((item, idx) => {
            let col = window.getTierColor
              ? window.getTierColor(item.statsRolled)
              : "#00d2ff";
            let iconHtml = window.getItemIconSvg
              ? window.getItemIconSvg(item, 28)
              : "";
            let isInsured = !!item.locked;

            let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderProfileModal();">SALVAGE</button>`;

            let arrayName = isHub
              ? "window.inventory.SIGIL"
              : "window.player.bag";
            let tooltipIdx = isHub
              ? idx
              : window.player.bag.findIndex((i) => i.id === item.id);

            let boundTag = isInsured
              ? `<span style="font-size:8px; color:#34d399; font-family:monospace; font-weight:bold;">[BOUND]</span>`
              : "";
            let actionsHtml = isHub
              ? `
                    <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>
                    ${salvageBtn}
                  `
              : `
                    ${salvageBtn}
                  `;

            return `
                  <div class="stash-card" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, ${arrayName}[${tooltipIdx}])">
                    ${iconHtml}
                    <div class="item-info">
                      <span class="item-title" style="color:${col};">${item.name}</span>
                      <span class="item-sub">SIGIL • LV.${item.stageLevel || 1}</span>
                      <span class="item-sub" style="color:#a855f7;">Focus: +${((item.rewardMultiplier || 0) * 100).toFixed(0)}% Rewards</span>
                    </div>
                    <div class="item-actions">
                      ${actionsHtml}
                    </div>
                  </div>
                `;
          })
          .join("");
      }
    } else if (stashTab === "USE") {
      let useObj = window.inventory.USE || {};
      let keys = Object.keys(useObj).filter((k) => useObj[k] > 0);

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `CONSUMABLES (<span id="profile-stash-count">${keys.length}</span>)`;
      }

      if (keys.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">No consumable elixirs, scrolls, or sacks owned.<br>Craft elixirs at the Alchemy Shop or earn sacks from Daily Quests!</div>`;
      } else {
        stashListEl.innerHTML = keys
          .map((k) => {
            let count = useObj[k];
            let data = window.useDex[k] || {
              desc: "Consumable Item",
              color: "#2ecc71",
            };
            let col = data.color || "#2ecc71";
            let iconHtml = window.getUseIconHtml
              ? window.getUseIconHtml(k, 28)
              : "";

            return `
                              <div class="consumable-card" style="border-left: 3px solid ${col}; display: flex; align-items: center; gap: 8px;">
                                ${iconHtml}
                                <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                                  <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="color:${col}; font-weight:bold; font-size:10.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                                    <span style="color:#ffffff; font-family:monospace; font-weight:bold; font-size:10.5px; margin-left:4px;">x${count}</span>
                                  </div>
                                  <div style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.2;">${data.desc}</div>
                                </div>
                                <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.useConsumableItem('${k}');">USE</button>
                              </div>
                            `;
          })
          .join("");
      }
    } else if (stashTab === "ETC") {
      let etcObj = window.inventory.ETC || {};
      let pendingScraps = window.player.pendingScraps || {};

      let allKeys = Array.from(
        new Set([...Object.keys(etcObj), ...Object.keys(pendingScraps)]),
      );
      allKeys = allKeys.filter(
        (k) => (etcObj[k] || 0) > 0 || (pendingScraps[k] || 0) > 0,
      );

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `MATERIALS & SOULS (<span id="profile-stash-count">${allKeys.length}</span>)`;
      }

      if (allKeys.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">No materials or Monster Souls owned.<br>Slay monsters in dungeon runs to harvest souls and scraps!</div>`;
      } else {
        const matColors = {
          "Monster Soul": "#a0aec0",
          "Luminous Soul": "#ffb6c1",
          "Rare Scrap": "#3498db",
          "Magic Scrap": "#9b59b6",
          "Epic Scrap": "#e67e22",
          "Legendary Scrap": "#f1c40f",
          "Mythic Scrap": "#e74c3c",
          "Eridium Shard": "#8e44ad",
          "Gacha Key": "#f1c40f",
          "Glimmering Gachapon Key": "#00d2ff",
          "Ancient Core": "#e74c3c",
          "Overlord's Sigil": "#1abc9c",
          "Astral Essence": "#9b59b6",
          "Catalyst Core": "#2ecc71",
        };

        stashListEl.innerHTML = allKeys
          .map((k) => {
            let vaultCount = etcObj[k] || 0;
            let pendingCount = pendingScraps[k] || 0;
            let col = matColors[k] || "#00d2ff";
            let desc = window.etcDex[k] || "Crafting Material";
            let iconHtml = window.getEtcIconHtml
              ? window.getEtcIconHtml(k, 28)
              : "";

            let countLabel =
              pendingCount > 0
                ? `<span style="color:#2ecc71; font-weight:bold;">+${pendingCount} Run</span> <span style="color:#aaa;">(${vaultCount} Vault)</span>`
                : `<span style="color:#ffffff; font-weight:bold;">${vaultCount}</span>`;

            return `
                                  <div class="material-card" style="border-left: 3px solid ${col}; display: flex; align-items: center; gap: 8px;">
                                                                      ${iconHtml}
                                                                      <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                                                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                                                          <span style="color:${col}; font-weight:bold; font-size:10.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                                                                          <span style="font-family:monospace; font-size:9.5px; margin-left:4px;">${countLabel}</span>
                                                                        </div>
                                                                        <div style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.2;">${desc}</div>
                                                                      </div>
                                                                    </div>
                                                                  `;
          })
          .join("");
      }
    }

    if (window.activeProfileMobileTab === "skills" && window.SkillTreeManager) {
      window.SkillTreeManager.renderSkillTreeUI();
    }
  };

  window.tryAutoEquip = function (item) {
    if (!item || !window.equippedSlots) return false;

    let targetSlot = null;
    let type = item.type;

    if (type === "weapon" || type === "helmet" || type === "boots") {
      if (!window.equippedSlots[type]) targetSlot = type;
    } else if (
      type === "subweapon" ||
      type === "shield" ||
      type === "dagger" ||
      type === "tome"
    ) {
      if (!window.equippedSlots.subweapon) targetSlot = "subweapon";
    } else if (type === "ring") {
      if (!window.equippedSlots.ring1) targetSlot = "ring1";
      else if (!window.equippedSlots.ring2) targetSlot = "ring2";
    } else if (type === "chest") {
      if (!window.equippedSlots.overall && !window.equippedSlots.chest) {
        targetSlot = "chest";
      }
    } else if (type === "leggings") {
      if (!window.equippedSlots.overall && !window.equippedSlots.leggings) {
        targetSlot = "leggings";
      }
    } else if (type === "overall") {
      if (
        !window.equippedSlots.chest &&
        !window.equippedSlots.leggings &&
        !window.equippedSlots.overall
      ) {
        targetSlot = "overall";
      }
    } else if (type === "artifact") {
      let isAlreadyEquipped = ["art1", "art2", "art3"].some(
        (s) =>
          window.equippedSlots[s] &&
          window.equippedSlots[s].trait === item.trait,
      );
      if (!isAlreadyEquipped) {
        if (!window.equippedSlots.art1) targetSlot = "art1";
        else if (!window.equippedSlots.art2) targetSlot = "art2";
        else if (!window.equippedSlots.art3) targetSlot = "art3";
      }
    }

    if (targetSlot) {
      window.equippedSlots[targetSlot] = item;
      item.isEquippedSlot = targetSlot;
      item.wasAutoEquipped = true;
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }
      return true;
    }
    return false;
  };

  window.equipFromBag = function (itemId) {
    window.hideTooltip();
    if (!window.player.bag) window.player.bag = [];
    let bag = window.player.bag;
    let idx = bag.findIndex((i) => i.id == itemId);
    if (idx === -1) return;

    let item = bag[idx];
    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    let slotKey = item.type;
    if (
      item.type === "shield" ||
      item.type === "dagger" ||
      item.type === "tome" ||
      item.type === "subweapon"
    ) {
      slotKey = "subweapon";
    } else if (item.type === "ring") {
      slotKey = !window.equippedSlots.ring1 ? "ring1" : "ring2";
    } else if (item.type === "artifact") {
      slotKey = !window.equippedSlots.art1
        ? "art1"
        : !window.equippedSlots.art2
          ? "art2"
          : !window.equippedSlots.art3
            ? "art3"
            : "art1";
    } else if (item.type === "overall") {
      if (window.equippedSlots.chest) {
        delete window.equippedSlots.chest.isEquippedSlot;
        bag.push(window.equippedSlots.chest);
        window.equippedSlots.chest = null;
      }
      if (window.equippedSlots.leggings) {
        delete window.equippedSlots.leggings.isEquippedSlot;
        bag.push(window.equippedSlots.leggings);
        window.equippedSlots.leggings = null;
      }
      slotKey = "overall";
    } else if (item.type === "chest" || item.type === "leggings") {
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        bag.push(window.equippedSlots.overall);
        window.equippedSlots.overall = null;
      }
      slotKey = item.type;
    }

    let currentEquipped = window.equippedSlots[slotKey];
    if (currentEquipped) {
      delete currentEquipped.isEquippedSlot;
      bag.push(currentEquipped);
    }
    window.equippedSlots[slotKey] = item;
    item.isEquippedSlot = slotKey;
    bag.splice(idx, 1);

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("swing");
    }
    if (typeof window.saveGame === "function") window.saveGame();
    if (typeof window.renderProfileModal === "function")
      window.renderProfileModal();
    let bagModal = document.getElementById("bag-modal");
    if (bagModal && bagModal.style.display !== "none") {
      window.toggleLootBag();
      window.toggleLootBag();
    }
  };

  window.equipFromStash = function (itemId) {
    window.hideTooltip();
    if (!window.player.stash) window.player.stash = [];
    let stash = window.player.stash;
    let idx = stash.findIndex((i) => i.id == itemId);
    if (idx === -1) return;

    let item = stash[idx];
    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    // Determine destination slot key
    let slotKey = item.type;

    if (
      item.type === "shield" ||
      item.type === "dagger" ||
      item.type === "tome" ||
      item.type === "subweapon"
    ) {
      slotKey = "subweapon";
    } else if (item.type === "ring") {
      slotKey = !window.equippedSlots.ring1 ? "ring1" : "ring2";
    } else if (item.type === "artifact") {
      slotKey = !window.equippedSlots.art1
        ? "art1"
        : !window.equippedSlots.art2
          ? "art2"
          : !window.equippedSlots.art3
            ? "art3"
            : "art1";
    } else if (item.type === "overall") {
      if (window.equippedSlots.chest) {
        delete window.equippedSlots.chest.isEquippedSlot;
        stash.push(window.equippedSlots.chest);
        window.equippedSlots.chest = null;
      }
      if (window.equippedSlots.leggings) {
        delete window.equippedSlots.leggings.isEquippedSlot;
        stash.push(window.equippedSlots.leggings);
        window.equippedSlots.leggings = null;
      }
      slotKey = "overall";
    } else if (item.type === "chest" || item.type === "leggings") {
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        stash.push(window.equippedSlots.overall);
        window.equippedSlots.overall = null;
      }
      slotKey = item.type;
    }

    // Swap currently equipped item into stash
    let currentEquipped = window.equippedSlots[slotKey];
    if (currentEquipped) {
      delete currentEquipped.isEquippedSlot;
      stash.push(currentEquipped);
    }
    window.equippedSlots[slotKey] = item;
    item.isEquippedSlot = slotKey;
    stash.splice(idx, 1);

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("swing");
    }

    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.unequipToStash = function (slotKey) {
    if (typeof window.unequipItem === "function") {
      window.unequipItem(slotKey);
    }
  };

  window.salvageFromStash = function (itemId) {
    window.hideTooltip();
    if (!window.player.stash) window.player.stash = [];
    let stash = window.player.stash;
    let idx = stash.findIndex((i) => i.id == itemId);
    if (idx === -1) return;

    let item = stash[idx];
    stash.splice(idx, 1);

    let rolledTier = item.statsRolled || 0;
    let scrapName = window.getScrapYieldName
      ? window.getScrapYieldName(rolledTier)
      : "Monster Soul";
    let yieldAmount = Math.floor(Math.random() * 3) + 1;

    if (!window.inventory) window.inventory = {};
    if (!window.inventory.ETC) window.inventory.ETC = {};
    window.inventory.ETC[scrapName] =
      (window.inventory.ETC[scrapName] || 0) + yieldAmount;

    if (window.spawnFloatingText) {
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 15,
        `+${yieldAmount} ${scrapName}`,
        "#e74c3c",
      );
    }

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }

    if (typeof window.saveGame === "function") window.saveGame();
    window.updateHUD();
    window.renderProfileModal();
  };

  window.calculateInsurancePremium = function (item) {
    if (!item) return BigNum.from(0);
    let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
    let W_R = 1 + stars;
    let stageLvl = item.stageLevel || 1;
    return BigNum.from(100).mul(W_R).mul(BigNum.from(1.05).pow(stageLvl));
  };

  window.calculateRunInsuranceTotals = function () {
    let allSlots = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let premiums = [];

    allSlots.forEach((slotKey) => {
      let item = window.equippedSlots[slotKey];
      if (item && item.locked) {
        premiums.push({
          item: item,
          cost: window.calculateInsurancePremium(item),
        });
      }
    });

    premiums.sort((a, b) => b.cost.compareTo(a.cost));

    let totalPremium = BigNum.from(0);
    let totalSoulsCost = 0;

    let getItemSoulCost = function (item) {
      if (!item) return 0;
      let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
      let stageLvl = item.stageLevel || 1;
      let baseCost = 5 + stars * 5;
      let scaleFactor = 1.0 + (stageLvl - 1) * 0.1;
      return Math.max(1, Math.round(baseCost * scaleFactor));
    };

    if (premiums.length >= 2) {
      totalPremium = totalPremium.add(premiums[1].cost);
      totalSoulsCost += getItemSoulCost(premiums[1].item);
    }
    if (premiums.length >= 3) {
      totalPremium = totalPremium.add(premiums[2].cost);
      totalSoulsCost += getItemSoulCost(premiums[2].item);
    }

    // Insurance Underwriter Skill Tree Discount
    if (window.SkillTreeManager) {
      let insuranceRank =
        window.SkillTreeManager.getSkillLevel("utility_insurance");
      if (insuranceRank > 0 && totalPremium.gt(0)) {
        let discountMult = 1.0 - insuranceRank * 0.1;
        totalPremium = totalPremium.mul(discountMult);
      }
    }

    return {
      totalPremium,
      totalSoulsCost,
      delta_drop: 0,
      delta_quality: 0,
      delta_gold: 0,
      m_enemy: 1.0,
      waivedItem: premiums[0] ? premiums[0].item : null,
      insuredCount: premiums.length,
    };
  };

  window.toggleInsurance = function (itemId) {
    window.hideTooltip();

    if (window.currentGameState !== window.GAME_STATES.HUB) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Soul Binding can only be configured at the Deployment Altar in the Hub!",
          "#e74c3c",
        );
      }
      return;
    }

    let allItems = [];
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k]) allItems.push(window.equippedSlots[k]);
    }
    if (window.player && window.player.stash)
      allItems.push(...window.player.stash);
    if (window.player && window.player.bag) allItems.push(...window.player.bag);
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((i) => {
        if (!allItems.includes(i)) allItems.push(i);
      });
    }

    let targetItem = allItems.find((i) => i.id == itemId);
    if (!targetItem) return;

    let isEquipped = false;
    for (let k in window.equippedSlots) {
      if (
        window.equippedSlots[k] &&
        window.equippedSlots[k].id === targetItem.id
      ) {
        isEquipped = true;
        break;
      }
    }

    if (isEquipped && !targetItem.locked) {
      let allSlots = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "overall",
        "boots",
        "ring1",
        "ring2",
        "art1",
        "art2",
        "art3",
      ];
      let equippedInsuredCount = allSlots.filter(
        (s) => window.equippedSlots[s] && window.equippedSlots[s].locked,
      ).length;
      if (equippedInsuredCount >= 3) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "[!] Maximum of 3 insured equipped items per run!",
            "#e74c3c",
          );
        }
        return;
      }
    }

    targetItem.locked = !targetItem.locked;

    if (typeof window.pushHeaderToast === "function") {
      if (targetItem.locked) {
        window.pushHeaderToast(
          `[SOUL BOUND] Protected ${targetItem.name}!`,
          "#2ecc71",
        );
      } else {
        window.pushHeaderToast(
          `[UNBOUND] ${targetItem.name} At Risk on Death!`,
          "#e74c3c",
        );
      }
    }

    if (typeof window.saveGame === "function") window.saveGame();
    window.renderProfileModal();
  };

  // --- SETTINGS MODAL & AUDIO HANDLERS ---
  window.toggleEditHudMode = function () {
    if (!window.playerStats) return;
    window.playerStats.editHudMode = !window.playerStats.editHudMode;
    window.updateEditHudModeStyle();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.updateEditHudModeStyle = function () {
    let isEditing =
      window.playerStats && window.playerStats.editHudMode === true;
    let btn = document.getElementById("btn-settings-edit-hud");
    let flaskBtn = document.getElementById("hud-flask-button");

    if (btn) {
      btn.innerText = isEditing
        ? "HUD LAYOUT: UNLOCKED (DRAG FLASK TO MOVE)"
        : "HUD LAYOUT: LOCKED (TAP TO UNLOCK)";
      btn.className = isEditing ? "settings-btn active" : "settings-btn";
    }

    if (flaskBtn) {
      if (isEditing) {
        flaskBtn.classList.add("edit-hud-active");
      } else {
        flaskBtn.classList.remove("edit-hud-active");
      }
    }
  };

  window.toggleSettingsModal = function () {
    let modal = document.getElementById("settings-modal");
    if (!modal) return;
    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      let stats = window.playerStats || {};
      let masterSlider = document.getElementById("slider-master-vol");
      let sfxSlider = document.getElementById("slider-sfx-vol");
      let bgmSlider = document.getElementById("slider-bgm-vol");
      if (masterSlider)
        masterSlider.value =
          stats.volumeMaster !== undefined ? stats.volumeMaster : 0.5;
      if (sfxSlider)
        sfxSlider.value = stats.volumeSFX !== undefined ? stats.volumeSFX : 0.8;
      if (bgmSlider)
        bgmSlider.value =
          stats.volumeMusic !== undefined ? stats.volumeMusic : 0.5;
      if (typeof window.updateEcoModeStyle === "function")
        window.updateEcoModeStyle();
      if (typeof window.updateLightingStyle === "function")
        window.updateLightingStyle();
      if (typeof window.updateEditHudModeStyle === "function")
        window.updateEditHudModeStyle();
      window.updateHUD();
    } else {
      if (window.playerStats && window.playerStats.editHudMode) {
        window.playerStats.editHudMode = false;
        if (typeof window.updateEditHudModeStyle === "function")
          window.updateEditHudModeStyle();
      }
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  };

  window.toggleMute = function () {
    if (!window.playerStats) return;
    window.playerStats.mute = !window.playerStats.mute;
    if (window.SoundManager && window.SoundManager.updateVolumes) {
      window.SoundManager.updateVolumes();
    }
    window.updateHUD();
  };

  window.updateMasterVolume = function (val) {
    if (!window.playerStats) return;
    window.playerStats.volumeMaster = parseFloat(val);
    if (window.SoundManager && window.SoundManager.updateVolumes) {
      window.SoundManager.updateVolumes();
    }
  };

  window.updateSfxVolume = function (val) {
    if (!window.playerStats) return;
    window.playerStats.volumeSFX = parseFloat(val);
    if (window.SoundManager && window.SoundManager.updateVolumes) {
      window.SoundManager.updateVolumes();
    }
  };

  window.updateBgmVolume = function (val) {
    if (!window.playerStats) return;
    window.playerStats.volumeMusic = parseFloat(val);
    if (window.SoundManager && window.SoundManager.updateVolumes) {
      window.SoundManager.updateVolumes();
    }
  };

  // --- LOOT SATCHEL & VAULT TOGGLE ---
  window.renderBagModalContent = function () {
    let listEl = document.getElementById("bag-items-list");
    let modal = document.getElementById("bag-modal");
    let headerEl = modal ? modal.querySelector(".modal-header span") : null;
    if (!listEl) return;

    let tab = window.activeBagTab || "EQUIP";
    let displayList = window.player.bag || [];
    let maxBag =
      typeof window.getMaxBagSlots === "function"
        ? window.getMaxBagSlots()
        : 20;

    if (headerEl) {
      headerEl.innerHTML = `CARRIED EXPEDITION SATCHEL <span style="font-size:10px; color:var(--text-gold-amber); font-family:monospace; margin-left:6px;">(${displayList.length} / ${maxBag} Gear)</span>`;
    }

    if (tab === "EQUIP") {
      let filteredList = displayList.filter((item) => item.type !== "sigil");
      if (filteredList.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">Satchel has no carried gear.<br>Defeat monsters and open chests in the dungeon to gather equipment!</div>`;
        return;
      }

      let map = window.activeDungeonMap;
      let isNearMerchant = false;
      if (map && map.merchantTile && window.player) {
        let mcx = map.merchantTile.x * map.tileSize + map.tileSize / 2;
        let mcy = map.merchantTile.y * map.tileSize + map.tileSize / 2;
        let dist = Math.hypot(window.player.x - mcx, window.player.y - mcy);
        if (dist <= 110) {
          isNearMerchant = true;
        }
      }

      listEl.innerHTML = filteredList
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#00d2ff";
          let typeLabel = (item.subType || item.type || "ITEM").toUpperCase();
          let starsLabel =
            item.statsRolled === "UNIQUE"
              ? "UNIQUE"
              : `${item.statsRolled || 0} STAR`;
          let iconHtml = window.getItemIconSvg
            ? window.getItemIconSvg(item, 32)
            : "";
          let isInsured = !!item.locked;

          let statPreview = [];
          if (item.atk)
            statPreview.push(
              `ATK +${window.formatNumber ? window.formatNumber(item.atk) : item.atk}`,
            );
          if (item.def)
            statPreview.push(
              `DEF +${window.formatNumber ? window.formatNumber(item.def) : item.def}`,
            );
          if (item.maxHp)
            statPreview.push(
              `HP +${window.formatNumber ? window.formatNumber(item.maxHp) : item.maxHp}`,
            );
          let statStr =
            statPreview.length > 0 ? statPreview.join(" | ") : `${starsLabel}`;

          let sellBtn = "";
          if (isNearMerchant) {
            let sellValue = window.calculateDungeonSellValue(item);
            sellBtn = `<button class="action-btn-sm" style="background: linear-gradient(180deg, #d97706, #b45309); border-color: #fbbf24; color: #fff;" onclick="event.stopPropagation(); window.sellItemToDungeonMerchant(${item.id});">SELL (${window.formatNumber(sellValue)})</button>`;
          }

          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderBagModalContent();">SALVAGE</button>`;
          let boundTag = isInsured
            ? `<span style="font-size:8px; color:#34d399; font-family:monospace; font-weight:bold;">[BOUND]</span>`
            : "";

          let actualIdx = window.player.bag.findIndex((i) => i.id === item.id);

          return `
                            <div class="stash-card" style="border-left: 3.5px solid ${col}; cursor: pointer; padding: 6px 10px; background: rgba(15, 23, 42, 0.85); border-radius: 6px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;" onclick="window.showItemTooltip(event, window.player.bag[${actualIdx}])">
                              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                ${iconHtml}
                                <div class="item-info" style="display: flex; flex-direction: column; min-width: 0;">
                                  <span class="item-title" style="color:${col}; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                                  <span class="item-sub" style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">${typeLabel} • LV.${item.stageLevel || 1}</span>
                                  <span class="item-sub" style="font-size: 8.5px; color: #2ecc71; font-family: monospace; font-weight: bold;">${statStr}</span>
                                </div>
                              </div>
                              <div class="item-actions" style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                                ${boundTag}
                                <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
                                ${sellBtn}
                                ${salvageBtn}
                              </div>
                            </div>
                          `;
        })
        .join("");
    } else if (tab === "SIGIL") {
      let filteredList = displayList.filter((item) => item.type === "sigil");
      if (filteredList.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">Satchel has no carried sigils.<br>Slay floor bosses or open Cavern Sigil Sacks to acquire run sigils!</div>`;
        return;
      }

      let map = window.activeDungeonMap;
      let isNearMerchant = false;
      if (map && map.merchantTile && window.player) {
        let mcx = map.merchantTile.x * map.tileSize + map.tileSize / 2;
        let mcy = map.merchantTile.y * map.tileSize + map.tileSize / 2;
        let dist = Math.hypot(window.player.x - mcx, window.player.y - mcy);
        if (dist <= 110) {
          isNearMerchant = true;
        }
      }

      listEl.innerHTML = filteredList
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#00d2ff";
          let iconHtml = window.getItemIconSvg
            ? window.getItemIconSvg(item, 32)
            : "";

          let sellBtn = "";
          if (isNearMerchant) {
            let sellValue = window.calculateDungeonSellValue(item);
            sellBtn = `<button class="action-btn-sm" style="background: linear-gradient(180deg, #d97706, #b45309); border-color: #fbbf24; color: #fff;" onclick="event.stopPropagation(); window.sellItemToDungeonMerchant(${item.id});">SELL (${window.formatNumber(sellValue)})</button>`;
          }

          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderBagModalContent();">SALVAGE</button>`;
          let actualIdx = window.player.bag.findIndex((i) => i.id === item.id);

          return `
                <div class="stash-card" style="border-left: 3.5px solid ${col}; cursor: pointer; padding: 6px 10px; background: rgba(15, 23, 42, 0.85); border-radius: 6px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;" onclick="window.showItemTooltip(event, window.player.bag[${actualIdx}])">
                  <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    ${iconHtml}
                    <div class="item-info" style="display: flex; flex-direction: column; min-width: 0;">
                      <span class="item-title" style="color:${col}; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                      <span class="item-sub" style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">SIGIL • LV.${item.stageLevel || 1}</span>
                      <span class="item-sub" style="font-size: 8.5px; color: #a855f7; font-family: monospace; font-weight: bold;">Focus: +${((item.rewardMultiplier || 0) * 100).toFixed(0)}% Rewards</span>
                    </div>
                  </div>
                  <div class="item-actions" style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    ${sellBtn}
                    ${salvageBtn}
                  </div>
                </div>
              `;
        })
        .join("");
    } else if (tab === "USE") {
      let useObj = window.inventory.USE || {};
      let keys = Object.keys(useObj).filter((k) => useObj[k] > 0);

      if (keys.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">No consumable elixirs, scrolls, or sacks owned.<br>Craft elixirs at the Alchemy Shop or earn sacks from Daily Quests!</div>`;
        return;
      }

      listEl.innerHTML = keys
        .map((k) => {
          let count = useObj[k];
          let data = window.useDex[k] || {
            desc: "Consumable Item",
            color: "#2ecc71",
          };
          let col = data.color || "#2ecc71";
          let iconHtml = window.getUseIconHtml
            ? window.getUseIconHtml(k, 28)
            : "";

          return `
                    <div class="consumable-card" style="border-left: 3.5px solid ${col}; display: flex; align-items: center; gap: 8px;">
                      ${iconHtml}
                      <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                          <span style="color:#ffffff; font-family:monospace; font-weight:bold; font-size:11px; margin-left:4px;">x${count}</span>
                        </div>
                        <div style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.3;">${data.desc}</div>
                      </div>
                      <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.useConsumableItem('${k}');">USE</button>
                    </div>
                  `;
        })
        .join("");
    } else if (tab === "ETC") {
      let etcObj = window.inventory.ETC || {};
      let pendingScraps = window.player.pendingScraps || {};

      let allKeys = Array.from(
        new Set([...Object.keys(etcObj), ...Object.keys(pendingScraps)]),
      );
      allKeys = allKeys.filter(
        (k) => (etcObj[k] || 0) > 0 || (pendingScraps[k] || 0) > 0,
      );

      if (allKeys.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">No materials or Monster Souls in satchel.<br>Slay monsters in dungeon runs to harvest souls and scraps!</div>`;
        return;
      }

      const matColors = {
        "Monster Soul": "#a0aec0",
        "Luminous Soul": "#ffb6c1",
        "Rare Scrap": "#3498db",
        "Magic Scrap": "#9b59b6",
        "Epic Scrap": "#e67e22",
        "Legendary Scrap": "#f1c40f",
        "Mythic Scrap": "#e74c3c",
        "Eridium Shard": "#8e44ad",
        "Gacha Key": "#f1c40f",
        "Glimmering Gachapon Key": "#00d2ff",
        "Ancient Core": "#e74c3c",
        "Overlord's Sigil": "#1abc9c",
        "Astral Essence": "#9b59b6",
        "Catalyst Core": "#2ecc71",
      };

      listEl.innerHTML = allKeys
        .map((k) => {
          let vaultCount = etcObj[k] || 0;
          let pendingCount = pendingScraps[k] || 0;
          let col = matColors[k] || "#00d2ff";
          let desc = window.etcDex[k] || "Crafting Material";
          let iconHtml = window.getEtcIconHtml
            ? window.getEtcIconHtml(k, 28)
            : "";

          let countLabel =
            pendingCount > 0
              ? `<span style="color:#2ecc71; font-weight:bold;">+${pendingCount} Run</span> <span style="color:#aaa;">(${vaultCount} Vault)</span>`
              : `<span style="color:#ffffff; font-weight:bold;">${vaultCount}</span>`;

          return `
                    <div class="material-card" style="border-left: 3.5px solid ${col}; display: flex; align-items: center; gap: 8px;">
                      ${iconHtml}
                      <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                          <span style="font-family:monospace; font-size:10px;">${countLabel}</span>
                        </div>
                        <div style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.3;">${desc}</div>
                      </div>
                    </div>
                  `;
        })
        .join("");
    }
  };

  window.toggleLootBag = function () {
    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    if (isHub) {
      window.toggleProfileModal();
      return;
    }

    let modal = document.getElementById("bag-modal");
    if (!modal) return;

    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      window.switchBagTab(window.activeBagTab || "EQUIP");
    } else {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      if (typeof window.hideTooltip === "function") window.hideTooltip();
    }
  };

  window.openSigilPickerModal = function () {
    let modal = document.getElementById("sigil-picker-modal");
    if (!modal) return;
    modal.style.display = "flex";
    window.renderSigilPickerList();
  };

  window.closeSigilPickerModal = function () {
    let modal = document.getElementById("sigil-picker-modal");
    if (modal) {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
    }
  };

  window.selectDeploymentSigil = function (sigilId) {
    window.state.selectedDeploymentSigilId = sigilId ? Number(sigilId) : null;
    window.closeSigilPickerModal();
    window.renderDeploymentModal();
  };

  window.renderSigilPickerList = function () {
    let container = document.getElementById("sigil-picker-list");
    if (!container) return;

    let sigils = window.inventory.SIGIL || [];
    let currentSigilId = window.state.selectedDeploymentSigilId;

    let html = `
            <div class="sigil-vault-card none-slotted ${!currentSigilId ? "selected" : ""}" onclick="window.selectDeploymentSigil(null)">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#cbd5e1; font-weight:bold; font-size:11px;">[ NO CAVERN SIGIL SLOTTED ]</span>
                ${!currentSigilId ? '<span style="color:#34d399; font-size:9px; font-weight:bold; font-family:monospace;">[ACTIVE]</span>' : '<button class="action-btn-sm" style="background:#0284c7; border-color:#38bdf8;">SELECT</button>'}
              </div>
              <span style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:3px; display:block;">Deploy without environmental modifiers or reward multipliers.</span>
            </div>
          `;

    if (sigils.length === 0) {
      html += `<div style="font-size:10.5px; color:#64748b; font-style:italic; text-align:center; padding:30px; background:rgba(0,0,0,0.3); border:1px dashed #3b0764; border-radius:8px;">No Cavern Sigils found in inventory.<br>Slay floor bosses or open Cavern Sigil Sacks to acquire run sigils!</div>`;
    } else {
      sigils.forEach((sig) => {
        let isSelected = sig.id === currentSigilId;
        let col = window.getTierColor(sig.statsRolled);

        let buffDescs = (sig.buffs || [])
          .map(
            (b) =>
              `<span style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399; font-size:8.5px; font-family:monospace; padding:2px 6px; border-radius:4px;">+ ${b.name}: ${b.desc}</span>`,
          )
          .join(" ");

        let debuffDescs = (sig.debuffs || [])
          .map(
            (d) =>
              `<span style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#f87171; font-size:8.5px; font-family:monospace; padding:2px 6px; border-radius:4px;">- ${d.name}: ${d.desc}</span>`,
          )
          .join(" ");

        html += `
                <div class="sigil-vault-card ${isSelected ? "selected" : ""}" style="border-left: 4px solid ${col};" onclick="window.selectDeploymentSigil(${sig.id})">
                  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      ${window.getEquipIconHtml(sig, 28)}
                      <div style="display:flex; flex-direction:column; text-align:left;">
                        <span style="color:${col}; font-weight:800; font-size:12px;">${sig.name}</span>
                        <span style="font-size:8.5px; color:#94a3b8; font-family:monospace;">${sig.statsRolled}★ ${window.getTierName(sig.statsRolled)}</span>
                      </div>
                    </div>
                    ${isSelected ? '<span style="color:#34d399; font-size:9.5px; font-weight:bold; font-family:monospace;">[SLOTTED]</span>' : '<button class="action-btn-sm action-btn-equip" style="padding:4px 8px; font-size:8.5px;">SLOT SIGIL</button>'}
                  </div>

                  <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                      ${buffDescs}
                      ${debuffDescs}
                    </div>
                    <div style="display:flex; gap:12px; margin-top:4px; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.08); font-family:monospace; font-size:9px;">
                      <span style="color:#38bdf8; font-weight:bold;">Focus Multiplier: +${((sig.rewardMultiplier || 0) * 100).toFixed(0)}%</span>
                      ${sig.qualityBoost > 0 ? `<span style="color:#e879f9; font-weight:bold;">Quality Boost: +${((sig.qualityBoost || 0) * 100).toFixed(0)}%</span>` : ""}
                    </div>
                  </div>
                </div>
              `;
      });
    }

    container.innerHTML = html;
  };

  window.closeDeploymentModal = function () {
    let modal = document.getElementById("deployment-modal");
    if (modal) {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
    }
  };

  // --- TOUCH / POINTER SWIPE NOTIFICATION DISMISSAL ENGINE ---
  window.attachToastSwipeHandlers = function (toast, onClickCallback) {
    let startX = 0,
      startY = 0;
    let deltaX = 0,
      deltaY = 0;
    let isDragging = false;
    let startTime = 0;
    let mode = null;

    toast.addEventListener("pointerdown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      deltaX = 0;
      deltaY = 0;
      startTime = Date.now();
      mode = null;
      toast.style.transition = "none";
      try {
        toast.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    toast.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      deltaX = e.clientX - startX;
      deltaY = e.clientY - startY;

      if (!mode) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          mode = "up";
        } else if (
          Math.abs(deltaX) > 8 &&
          Math.abs(deltaX) >= Math.abs(deltaY)
        ) {
          mode = "side";
        }
      }

      if (mode === "up") {
        let moveY = Math.min(0, deltaY);
        let alpha = Math.max(0, 1 - Math.abs(moveY) / 100);
        let container = document.getElementById("toast-container");
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            t.style.transition = "none";
            t.style.transform = `translateY(${moveY}px)`;
            t.style.opacity = alpha;
          });
        }
      } else if (mode === "side") {
        let alpha = Math.max(0, 1 - Math.abs(deltaX) / 180);
        toast.style.transform = `translateX(${deltaX}px)`;
        toast.style.opacity = alpha;
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        toast.releasePointerCapture(e.pointerId);
      } catch (err) {}

      let elapsed = Date.now() - startTime;
      let distY = deltaY;
      let distX = deltaX;

      if (Math.abs(distX) < 5 && Math.abs(distY) < 5) {
        toast.style.transition = "all 0.2s ease";
        toast.style.transform = "";
        toast.style.opacity = "1";
        if (typeof onClickCallback === "function") {
          onClickCallback(e);
        }
        return;
      }

      let container = document.getElementById("toast-container");

      if (mode === "up" && (distY < -30 || (elapsed < 250 && distY < -15))) {
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            if (t.dismissTimeout) clearTimeout(t.dismissTimeout);
            t.style.transition =
              "transform 0.22s ease-in, opacity 0.22s ease-in";
            t.style.transform = `translateY(-120px)`;
            t.style.opacity = "0";
            setTimeout(() => {
              if (t.parentNode) t.parentNode.removeChild(t);
            }, 220);
          });
        }
      } else if (
        mode === "side" &&
        (Math.abs(distX) > 40 || (elapsed < 250 && Math.abs(distX) > 20))
      ) {
        if (toast.dismissTimeout) clearTimeout(toast.dismissTimeout);
        let exitX = distX > 0 ? 350 : -350;
        toast.style.transition =
          "transform 0.22s ease-in, opacity 0.22s ease-in";
        toast.style.transform = `translateX(${exitX}px)`;
        toast.style.opacity = "0";
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 220);
      } else {
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            t.style.transition =
              "transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease";
            t.style.transform = "";
            t.style.opacity = "1";
          });
        }
      }
    };

    toast.addEventListener("pointerup", endDrag);
    toast.addEventListener("pointercancel", endDrag);
  };

  // --- ITEM PICKUP TOAST NOTIFICATION ENGINE ---
  window.pushToast = function (item) {
    if (!item) return;
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    let existingToast = Array.from(
      container.querySelectorAll(".item-toast"),
    ).find(
      (t) =>
        t.dataset.itemName === item.name &&
        !t.classList.contains("toast-fade-out"),
    );

    if (existingToast) {
      let currentQty = parseInt(existingToast.dataset.itemQty, 10) || 0;
      let newQty = currentQty + 1;
      existingToast.dataset.itemQty = newQty;

      let lootHeaderEl = existingToast.querySelector(".toast-loot-header");
      let countEl = existingToast.querySelector(".toast-count-val");

      if (lootHeaderEl) lootHeaderEl.innerText = `+${newQty} LOOT`;
      if (countEl) countEl.innerText = `x${newQty}`;

      existingToast.classList.remove("toast-pop-bump");
      void existingToast.offsetWidth;
      existingToast.classList.add("toast-pop-bump");

      if (existingToast.dismissTimeout) {
        clearTimeout(existingToast.dismissTimeout);
      }

      if (
        window.SoundManager &&
        typeof window.SoundManager.playLootDrop === "function"
      ) {
        window.SoundManager.playLootDrop(item.statsRolled);
      }

      existingToast.dismissTimeout = setTimeout(() => {
        existingToast.classList.add("toast-fade-out");
        setTimeout(() => {
          if (existingToast.parentNode)
            existingToast.parentNode.removeChild(existingToast);
        }, 300);
      }, 2800);

      return;
    }

    let col = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";
    let iconHtml = window.getItemIconSvg ? window.getItemIconSvg(item, 26) : "";

    let toast = document.createElement("div");
    toast.className = "item-toast";
    toast.style.borderColor = col;
    toast.dataset.itemName = item.name;
    toast.dataset.itemQty = 1;

    toast.innerHTML = `
            ${iconHtml}
            <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
              <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${col}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
                <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                  <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                  <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
                </svg>
                <span class="toast-loot-header">+1 LOOT</span>
                ${item.wasAutoEquipped ? `<span style="background:#2ecc71; color:#05030a; font-weight:900; font-size:7px; padding:1px 3px; border-radius:2px; font-family:monospace; margin-left:5px; letter-spacing:0.5px; line-height:1;">AUTO-EQUIPPED</span>` : ""}
              </div>
              <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
                <span style="color:${col}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                <span class="toast-count-val" style="color:${col}; font-family:monospace; font-weight:800; flex-shrink:0;">x1</span>
              </div>
            </div>
          `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast);

    if (
      window.SoundManager &&
      typeof window.SoundManager.playLootDrop === "function"
    ) {
      window.SoundManager.playLootDrop(item.statsRolled);
    }

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  };

  window.pushMaterialToast = function (name, qty, customColor = null) {
    if (!name || qty <= 0) return;
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    let existingToast = Array.from(
      container.querySelectorAll(".item-toast"),
    ).find(
      (t) =>
        t.dataset.itemName === name && !t.classList.contains("toast-fade-out"),
    );

    if (existingToast) {
      let currentQty = parseInt(existingToast.dataset.itemQty, 10) || 0;
      let newQty = currentQty + qty;
      existingToast.dataset.itemQty = newQty;

      let lootHeaderEl = existingToast.querySelector(".toast-loot-header");
      let countEl = existingToast.querySelector(".toast-count-val");

      if (lootHeaderEl) lootHeaderEl.innerText = `+${newQty} LOOT`;
      if (countEl) countEl.innerText = `x${newQty}`;

      existingToast.classList.remove("toast-pop-bump");
      void existingToast.offsetWidth;
      existingToast.classList.add("toast-pop-bump");

      if (existingToast.dismissTimeout) {
        clearTimeout(existingToast.dismissTimeout);
      }

      existingToast.dismissTimeout = setTimeout(() => {
        existingToast.classList.add("toast-fade-out");
        setTimeout(() => {
          if (existingToast.parentNode)
            existingToast.parentNode.removeChild(existingToast);
        }, 300);
      }, 2500);

      return;
    }

    let color = customColor;
    if (!color) {
      if (window.useDex && window.useDex[name] && window.useDex[name].color) {
        color = window.useDex[name].color;
      } else {
        const matColors = {
          "Monster Soul": "#a0aec0",
          "Luminous Soul": "#ffb6c1",
          "Rare Scrap": "#3498db",
          "Magic Scrap": "#9b59b6",
          "Epic Scrap": "#e67e22",
          "Legendary Scrap": "#f1c40f",
          "Mythic Scrap": "#e74c3c",
          "Eridium Shard": "#8e44ad",
          "Gacha Key": "#f1c40f",
          "Glimmering Gachapon Key": "#00d2ff",
          "Ancient Core": "#e74c3c",
          "Overlord's Sigil": "#1abc9c",
          "Astral Essence": "#9b59b6",
          "Catalyst Core": "#2ecc71",
        };
        color = matColors[name] || "#00d2ff";
      }
    }

    let iconHtml = "";
    if (window.getEtcIconHtml && window.etcDex && window.etcDex[name]) {
      iconHtml = window.getEtcIconHtml(name, 26);
    } else if (window.getUseIconHtml && window.useDex && window.useDex[name]) {
      iconHtml = window.getUseIconHtml(name, 26);
    }

    let toast = document.createElement("div");
    toast.className = "item-toast";
    toast.style.borderColor = color;
    toast.dataset.itemName = name;
    toast.dataset.itemQty = qty;

    toast.innerHTML = `
            ${iconHtml}
            <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
              <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
                <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                  <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                  <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
                </svg>
                <span class="toast-loot-header">+${qty} LOOT</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
                <span class="toast-count-val" style="color:${color}; font-family:monospace; font-weight:800; flex-shrink:0;">x${qty}</span>
              </div>
            </div>
          `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast);

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  };

  window.pushHeaderToast = function (msg, color = "#00d2ff", onClick = null) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    let toast = document.createElement("div");
    toast.className = "header-toast";
    toast.style.borderColor = color;
    toast.style.boxShadow = `0 10px 30px rgba(0,0,0,0.9), 0 0 12px ${color}44`;

    let isBound = msg.includes("SOUL BOUND") || msg.includes("Protected");
    let isUnbound = msg.includes("UNBOUND") || msg.includes("At Risk");

    let iconSvg = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="${color}22"/>
          ${isBound ? `<path d="M9 12l2 2 4-4" stroke="${color}" stroke-width="2.5"/>` : isUnbound ? `<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` : `<circle cx="12" cy="12" r="3" fill="${color}"/>`}
        </svg>
      `;

    toast.innerHTML = `
        ${iconSvg}
        <div style="display:flex; flex-direction:column; min-width:0; flex:1; text-align:left;">
          <span style="color:${color}; font-weight:800; font-size:10.5px; font-family:monospace; line-height:1.2; letter-spacing:0.5px;">${msg}</span>
        </div>
      `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast, onClick);

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2800);
  };

  window.getMobPoolForDepth = function (depth) {
    // Sectors advance every 12 floors (after each Major Boss on Floor 12, 24, 36...)
    let sector = Math.floor((depth - 1) / 12);

    let pools = [
      // Sector 0 (Floors 1 - 12): Whispering Woods
      { tier: 0, types: ["slime", "sprout", "thorn_wyrm"] },
      // Sector 1 (Floors 13 - 24): Mountain Peaks & Alpine Mines
      { tier: 1, types: ["golem", "wyrmling", "gargoyle", "rust_nibbler"] },
      // Sector 2 (Floors 25 - 36): Inferno Depths & Smeltery
      {
        tier: 2,
        types: ["magma_elemental", "lava_serpent", "hell_bat", "slag_slime"],
      },
      // Sector 3 (Floors 37 - 48): Fungal Swamp & Ruins
      {
        tier: 3,
        types: ["swamp_basilisk", "toxic_fly", "marsh_ghost", "corroded_golem"],
      },
      // Sector 4 (Floors 49 - 60): Void Singularity
      {
        tier: 4,
        types: ["void_orb", "void_crawler", "void_spectre"],
      },
      // Sector 5 (Floors 61 - 72): Temporal Sanctorum
      {
        tier: 5,
        types: ["clockwork_scarab", "star_weaver"],
      },
      // Sector 6 (Floors 73 - 84): Cyberspace Nexus
      {
        tier: 6,
        types: [
          "neon_spider",
          "wireframe_orb",
          "cursed_blade",
          "animated_armor",
        ],
      },
    ];

    // Infinite Anomaly Cycle for Floors 85+ (Sector 7+)
    let effectiveSector = sector >= 7 ? sector % 7 : sector;

    let selected = pools[effectiveSector];
    let chosenType =
      selected.types[Math.floor(Math.random() * selected.types.length)];
    return { tier: selected.tier, type: chosenType };
  };

  window.refillFlaskCharges = function (silent = false) {
    let p = window.playerStats;
    if (!p) return;
    p.flaskCharges = p.maxFlaskCharges || 1;
    if (!silent) {
      let flaskBtn = document.getElementById("hud-flask-button");
      if (flaskBtn) {
        flaskBtn.classList.remove("flask-recharged-flash");
        void flaskBtn.offsetWidth;
        flaskBtn.classList.add("flask-recharged-flash");
        setTimeout(
          () => flaskBtn.classList.remove("flask-recharged-flash"),
          600,
        );
      }

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[RECHARGED] Field Flask Charges Fully Restored!",
          "#34d399",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        try {
          window.SoundManager.play("flask_refill");
        } catch (e) {
          window.SoundManager.play("revive");
        }
      }
      if (
        window.player &&
        window.player.hp > 0 &&
        typeof window.spawnFloatingText === "function"
      ) {
        window.spawnFloatingText(
          window.player.x,
          window.player.y - 20,
          "FLASK RECHARGED",
          "#34d399",
          true,
        );
      }
    }
    if (typeof window.updateHUD === "function") window.updateHUD();
  };

  window.useDungeonFlask = function () {
    let p = window.player;
    let stats = window.playerStats;
    if (!p || !stats || p.hp <= 0) return;
    if (stats.editHudMode) return;

    if (stats.flaskCooldownTimer > 0) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("[!] Flask is on internal cooldown!", "#f1c40f");
      }
      return;
    }

    if ((stats.flaskCharges || 0) <= 0) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Flask empty! Defeat a Boss to refill charges.",
          "#e74c3c",
        );
      }
      return;
    }

    stats.flaskCharges--;
    if (stats.flaskCharges > 0) {
      stats.flaskCooldownTimer = 180; // 3 seconds internal cooldown (60 FPS)
    } else {
      stats.flaskCooldownTimer = 0;
    }

    let flaskBtn = document.getElementById("hud-flask-button");
    if (flaskBtn) {
      flaskBtn.classList.remove("flask-drink-pop");
      void flaskBtn.offsetWidth;
      flaskBtn.classList.add("flask-drink-pop");
      setTimeout(() => flaskBtn.classList.remove("flask-drink-pop"), 350);
    }

    let healAmt = Math.round(p.maxHp * (stats.flaskPotency || 0.25));
    p.hp = Math.min(p.maxHp, p.hp + healAmt);

    if (stats.flaskSpeedBurst) {
      p.speedMultiplier = 1.35; // +35% emergency speed burst for 2 seconds
      p.flaskSpeedTimer = 120;
    }

    if (typeof window.spawnFloatingText === "function") {
      window.spawnFloatingText(
        p.x,
        p.y - 20,
        `+${healAmt} HP (FLASK)`,
        "#34d399",
        true,
      );
    }

    if (window.combatVisuals) {
      window.combatVisuals.spawnParticles(p.x, p.y - 10, 25, "slag_slime", 4);
      window.combatVisuals.spawnBeam(p.x, "#34d399", 40, true, 0);
    }

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("fairy");
    }

    if (typeof window.updateHUD === "function") window.updateHUD();
  };

  window.initFlaskButtonDrag = function () {
    let btn = document.getElementById("hud-flask-button");
    let gameContainer = document.getElementById("game-container");
    if (!btn || !gameContainer) return;

    let isDragging = false;
    let hasMoved = false;
    let startX = 0,
      startY = 0;
    let initialLeft = 0,
      initialTop = 0;

    // Prevent dragging the button from scrolling the screen or triggering OS gestures
    btn.addEventListener(
      "touchstart",
      function (e) {
        if (
          window.playerStats &&
          window.playerStats.editHudMode &&
          e.cancelable
        ) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    btn.addEventListener(
      "touchmove",
      function (e) {
        if (
          window.playerStats &&
          window.playerStats.editHudMode &&
          e.cancelable
        ) {
          e.preventDefault();
        }
      },
      { passive: false },
    );

    btn.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!window.playerStats || !window.playerStats.editHudMode) return;

      isDragging = true;
      hasMoved = false;
      btn.isDragging = true;

      let rect = btn.getBoundingClientRect();
      let containerRect = gameContainer.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left - containerRect.left;
      initialTop = rect.top - containerRect.top;

      if (btn.setPointerCapture) {
        try {
          btn.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
      e.stopPropagation();
    });

    btn.addEventListener("pointermove", function (e) {
      if (!isDragging) return;
      if (!window.playerStats || !window.playerStats.editHudMode) return;

      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
      }

      let newX = initialLeft + dx;
      let newY = initialTop + dy;

      let containerW = gameContainer.clientWidth;
      let containerH = gameContainer.clientHeight;
      let btnW = btn.offsetWidth || 52;
      let btnH = btn.offsetHeight || 52;

      newX = Math.max(10, Math.min(containerW - btnW - 10, newX));
      newY = Math.max(10, Math.min(containerH - btnH - 10, newY));

      if (window.playerStats) {
        window.playerStats.flaskX = newX;
        window.playerStats.flaskY = newY;
      }

      btn.style.left = newX + "px";
      btn.style.top = newY + "px";
      btn.style.bottom = "auto";
      e.stopPropagation();
    });

    const stopDrag = function (e) {
      if (isDragging) {
        isDragging = false;
        btn.isDragging = false;
        if (btn.releasePointerCapture && e.pointerId !== undefined) {
          try {
            btn.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }

        if (hasMoved && typeof window.saveGame === "function") {
          window.saveGame();
        }
        e.stopPropagation();
      }
    };

    btn.addEventListener("pointerup", stopDrag);
    btn.addEventListener("pointercancel", stopDrag);
  };

  window.resetFlaskButtonPosition = function () {
    if (window.playerStats) {
      window.playerStats.flaskX = null;
      window.playerStats.flaskY = null;
    }

    let btn = document.getElementById("hud-flask-button");
    if (btn) {
      btn.style.left = "env(safe-area-inset-left, 24px)";
      btn.style.right = "auto";
      btn.style.bottom = "env(safe-area-inset-bottom, 36px)";
      btn.style.top = "auto";
    }

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "[HUD] Flask button reset to default position!",
        "#34d399",
      );
    }

    if (typeof window.saveGame === "function") {
      window.saveGame();
    }
  };

  window.triggerOnslaughtShatterAnimation = function () {
    let map = window.activeDungeonMap;
    let tileSize = map ? map.tileSize : 32;
    let altarX = 19 * tileSize + tileSize / 2;
    let altarY = 8 * tileSize + tileSize / 2;

    // 1. Visual Camera Trauma Shake
    if (window.combatVisuals) {
      window.combatVisuals.triggerScreenShake(12, 24);
    }

    // 2. Acoustic Shatter Feedback
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }

    // 3. Fling 45+ high-velocity purple & magenta shards (Zero-Allocation Pool)
    if (window.particles && window.ParticlePool) {
      for (let i = 0; i < 45; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(3.5, 8.0);
        let life = window.randInt(30, 60);
        let size = window.randFloat(2.5, 5.0);
        let color = Math.random() < 0.55 ? "#a855f7" : "#e879f9";

        let pt = window.ParticlePool.get(
          altarX,
          altarY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - window.randFloat(1.0, 3.0),
          size,
          color,
          1.0,
          life,
          life,
          0.2, // gravity drag
          true,
        );
        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.25, 0.25);
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }

    // 4. Gold-Bordered System Notification (Emoji-Free)
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "[ALTAR UNLOCKED] The magical chains binding the Onslaught Altar have shattered! The Arena is open.",
        "#a855f7",
      );
    }
  };

  // Onslaught Perimeter Coordinate Spawning Calculator
  window.getOnslaughtSpawnPosition = function (map) {
    let x, y;
    let edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    if (edge === 0) {
      x = window.randInt(2, map.width - 3);
      y = 2;
    } else if (edge === 1) {
      x = map.width - 3;
      y = window.randInt(2, map.height - 3);
    } else if (edge === 2) {
      x = window.randInt(2, map.width - 3);
      y = map.height - 3;
    } else {
      x = 2;
      y = window.randInt(2, map.height - 3);
    }
    return { x, y };
  };

  // Advancing Sector Pool Resolver based on Active Wave
  window.getOnslaughtMobTypeForWave = function (wave) {
    let tier = Math.min(6, Math.floor((wave - 1) / 5)); // Progresses from Sector 1 to 7 over waves
    const pools = [
      { tier: 0, types: ["slime", "sprout", "thorn_wyrm"] },
      { tier: 1, types: ["golem", "wyrmling", "gargoyle", "rust_nibbler"] },
      {
        tier: 2,
        types: ["magma_elemental", "lava_serpent", "hell_bat", "slag_slime"],
      },
      {
        tier: 3,
        types: ["swamp_basilisk", "toxic_fly", "marsh_ghost", "corroded_golem"],
      },
      { tier: 4, types: ["void_orb", "void_crawler", "void_spectre"] },
      { tier: 5, types: ["clockwork_scarab", "star_weaver"] },
      {
        tier: 6,
        types: [
          "neon_spider",
          "wireframe_orb",
          "cursed_blade",
          "animated_armor",
        ],
      },
    ];
    let selected =
      pools[tier] || pools[Math.floor(Math.random() * pools.length)];
    let chosenType =
      selected.types[Math.floor(Math.random() * selected.types.length)];
    return { tier: selected.tier, type: chosenType };
  };

  // Milestone Boss Resolver
  window.getOnslaughtBossForWave = function (wave) {
    let isMajor = wave % 10 === 0;
    const bossTypes = [
      { name: "Arachnid Treant", visual: "arachnid_treant" },
      { name: "Aegis Goliath", visual: "aegis_goliath" },
      { name: "Overlord Iron Vault", visual: "overlord_iron_vault" },
      { name: "Corrosive Abomination", visual: "corrosive_abomination" },
      { name: "Void Overseer", visual: "void_overseer" },
      { name: "Chronos Arbitrator", visual: "chronos_arbitrator" },
      { name: "Nexus Overseer", visual: "nexus_overseer" },
    ];
    let idx = (Math.floor(wave / 5) - 1) % bossTypes.length;
    let selected =
      bossTypes[idx] || bossTypes[Math.floor(Math.random() * bossTypes.length)];
    return {
      name: selected.name,
      visualType: selected.visual,
      isMajor: isMajor,
    };
  };

  // Homing Healing Hearts Spawner & Updater
  window.spawnHomingHearts = function (x, y, amount) {
    if (!window.heartOrbs) window.heartOrbs = [];
    if (window.heartOrbs.length > 40) return;

    let particleCount = 1;
    if (amount > 30) {
      particleCount = window.randInt(2, 3);
    }
    let share = Math.round(amount / particleCount);

    for (let i = 0; i < particleCount; i++) {
      window.heartOrbs.push({
        x: x,
        y: y,
        vx: window.randFloat(-2.5, 2.5),
        vy: window.randFloat(-5, -2),
        value: share,
        scatterTimer: window.randInt(14, 20),
        gravity: 0.35,
        speed: 5.0,
      });
    }
  };

  window.updateHeartOrbs = function () {
    let p = window.player;
    if (!window.heartOrbs) return;

    for (let i = window.heartOrbs.length - 1; i >= 0; i--) {
      let ho = window.heartOrbs[i];
      if (ho.scatterTimer > 0) {
        ho.scatterTimer--;
        ho.x += ho.vx;
        ho.y += ho.vy;
        ho.vy += ho.gravity || 0.35;
        ho.vx *= 0.92;
      } else {
        let targetX = p.x;
        let targetY = p.y - 8;
        let dx = targetX - ho.x;
        let dy = targetY - ho.y;
        let dist = Math.hypot(dx, dy);

        if (dist < 14) {
          // Apply healing directly to the active Player
          p.hp = Math.min(p.maxHp, p.hp + ho.value);
          if (window.playerStats) {
            window.playerStats.currentHp = BigNum.from(p.hp);
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("fairy");
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              p.x,
              p.y - 15,
              `+${ho.value} HP`,
              "#2ecc71",
              true,
            );
          }
          window.heartOrbs.splice(i, 1);
        } else {
          ho.speed = Math.min(12, ho.speed + 0.4);
          ho.x += (dx / dist) * ho.speed;
          ho.y += (dy / dist) * ho.speed;
        }
      }
    }
  };

  // Onslaught/Crucible Wave Spawning Engine
  window.spawnOnslaughtWave = function (waveNumber) {
    let p = window.player;
    let map = window.activeDungeonMap;
    if (!p || !map) return;

    // Check if there are queued pre-run catchup drafts remaining
    if (window.playerStats.pendingCrucibleDrafts > 0) {
      window.triggerOnslaughtDraft();
      return; // Halt wave spawning sequence until drafts are resolved
    }

    let tileSize = map.tileSize;
    let isBossWave = waveNumber % 5 === 0;

    window.activeDungeonMobs = [];
    window.mob = null;

    let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;

    // Polynomial-exponential stage scaling matches campaign item power
    let repStage = waveNumber * 5;
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    if (isBossWave) {
      // --- MILESTONE BOSS SPONDING ---
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);

      // Safe Teleportation: move player to bottom of arena to prevent boss-spawn overlap
      p.x = cx * tileSize + tileSize / 2;
      p.y = (map.height - 4) * tileSize + tileSize / 2;
      p.targetX = p.x;
      p.targetY = p.y;

      let bossInfo = window.getOnslaughtBossForWave(waveNumber);
      let baseHp = bossInfo.isMajor ? 500 : 300;
      let baseAtk = bossInfo.isMajor ? 22 : 15;

      let bossHp = Math.round(baseHp * repScale * enemyScale);
      let bossAtk = Math.round(
        baseAtk *
          Math.pow(1.06, waveNumber) *
          Math.pow(waveNumber, 1.15) *
          enemyScale,
      );

      window.mob = {
        type: bossInfo.isMajor ? "dungeon_boss" : "dungeon_miniboss",
        name: bossInfo.name,
        visualType: bossInfo.visualType,
        hp: BigNum.from(bossHp),
        maxHp: BigNum.from(bossHp),
        atk: bossAtk,
        x: cx * tileSize - 16,
        y: cy * tileSize - 16,
        w: 64,
        h: 64,
        flashTimer: 0,
        isStopped: true,
        bossTileX: cx,
        bossTileY: cy,
        state: "idle",
        telegraphTimer: 0,
        maxTelegraphTimer: 65,
        activeAbility: null,
        targetX: 0,
        targetY: 0,
        attackCooldown: 60,
        moveset: bossInfo.isMajor
          ? ["slam", "nova", "charge"]
          : ["slam", "charge"],
        facing: -1,
      };

      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          `${bossInfo.name.toUpperCase()} ENGAGED`,
          "#e74c3c",
        );
      }
    } else {
      // --- STANDARD & ELITE MOB SPREAD SPONDING ---
      let spawnCount = Math.min(15, 3 + Math.floor(waveNumber / 2));
      let mobHpVal = Math.round(40 * repScale * enemyScale);
      let mobAtkVal = Math.round(
        8 *
          Math.pow(1.06, waveNumber) *
          Math.pow(waveNumber, 1.15) *
          enemyScale,
      );

      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let rareRate =
        (pStats.rareSpawn !== undefined ? pStats.rareSpawn : 0.01) +
        waveNumber * 0.002;
      let eliteChance = Math.min(0.95, waveNumber * 0.035);

      for (let i = 0; i < spawnCount; i++) {
        let mobInfo = window.getOnslaughtMobTypeForWave(waveNumber);
        let isRare = Math.random() < rareRate;
        let isElite = Math.random() < eliteChance;

        let eliteAffix = null;
        if (isElite) {
          const affixes = [
            "vitality_weaver",
            "iron_citadel",
            "swift_commander",
            "blood_berserker",
            "nullifier",
          ];
          eliteAffix = affixes[Math.floor(Math.random() * affixes.length)];
        }

        let finalHp = isRare ? Math.round(mobHpVal * 1.5) : mobHpVal;
        let finalAtk = isRare ? Math.round(mobAtkVal * 1.25) : mobAtkVal;

        let rangedTypes = [
          "thorn_wyrm",
          "wyrmling",
          "magma_elemental",
          "toxic_fly",
          "void_orb",
        ];
        let isRanged = rangedTypes.includes(mobInfo.type);
        let projType =
          mobInfo.type === "thorn_wyrm"
            ? "thorn"
            : mobInfo.type === "wyrmling"
              ? "frost"
              : mobInfo.type === "magma_elemental"
                ? "fireball"
                : mobInfo.type === "toxic_fly"
                  ? "maelstrom"
                  : "void";

        let pos = window.getOnslaughtSpawnPosition(map);
        let spawnX = pos.x * tileSize;
        let spawnY = pos.y * tileSize;

        window.activeDungeonMobs.push({
          id: window.idCounter++,
          type: "mob",
          visualTier: mobInfo.tier,
          visualType: mobInfo.type,
          x: spawnX,
          y: spawnY,
          homeX: spawnX,
          homeY: spawnY,
          w: 24,
          h: 24,
          hp: BigNum.from(finalHp),
          maxHp: BigNum.from(finalHp),
          atk: finalAtk,
          flashTimer: 0,
          attackCooldown: 0,
          rangedCooldown: window.randInt(30, 90),
          isRanged: isRanged,
          projectileType: projType,
          facing: -1,
          isRare: isRare,
          eliteAffix: eliteAffix,
          buffStacks: { haste: 0, def: 0, atk: 0 },
          buffTimers: { haste: 0, def: 0, atk: 0 },
          buffDecayTimers: { haste: 0, def: 0, atk: 0 },
          wanderTimer: window.randInt(40, 120),
          wanderVx: 0,
          wanderVy: 0,
          isWandering: false,
          hopTimer: window.randInt(0, 29),
        });
      }
    }
  };

  // --- DYNAMIC TOME PROGRESSION & MULTICAST GENERATION ---
  window.rollTomeSpells = function (item, stageScale, rarity) {
    let spellType = "fire"; // Default single-target starter spell

    if (stageScale >= 13) {
      if (rarity === 0 || rarity === 1) {
        const options = ["fire", "lightning", "frost"];
        spellType = options[Math.floor(Math.random() * options.length)];
      } else if (rarity === 2 || rarity === 3) {
        if (Math.random() < 0.3) {
          const dualOptions = [
            "dual_fire_lightning",
            "dual_fire_frost",
            "dual_lightning_frost",
          ];
          spellType =
            dualOptions[Math.floor(Math.random() * dualOptions.length)];
        } else {
          const options = ["fire", "lightning", "frost"];
          spellType = options[Math.floor(Math.random() * options.length)];
        }
      } else {
        let roll = Math.random();
        if (roll < 0.2) {
          spellType = "tri";
        } else if (roll < 0.6) {
          const dualOptions = [
            "dual_fire_lightning",
            "dual_fire_frost",
            "dual_lightning_frost",
          ];
          spellType =
            dualOptions[Math.floor(Math.random() * dualOptions.length)];
        } else {
          const options = ["fire", "lightning", "frost"];
          spellType = options[Math.floor(Math.random() * options.length)];
        }
      }
    }

    item.spellType = spellType;

    let spellName = "";
    let spellDesc = "";

    if (spellType === "fire") {
      spellName = "Infernal Fireball";
      spellDesc =
        "Emits powerful single-target Fireballs dealing highly concentrated fire damage.";
    } else if (spellType === "lightning") {
      spellName = "Chain Lightning";
      spellDesc =
        "Emits electrical surges that chain to 1 additional adjacent target for moderate lightning damage.";
    } else if (spellType === "frost") {
      spellName = "Glacial Frost Nova";
      spellDesc =
        "Emits sub-zero Frost Novas dealing area-of-effect frost damage and slowing enemies.";
    } else if (spellType === "dual_fire_lightning") {
      spellName = "Stormfire Catalyst";
      spellDesc =
        "Alternates between single-target Fireballs and chaining Lightning Bolts.";
    } else if (spellType === "dual_fire_frost") {
      spellName = "Frostburn Catalyst";
      spellDesc =
        "Alternates between concentrated Fireballs and slows targets with compact Frost Novas.";
    } else if (spellType === "dual_lightning_frost") {
      spellName = "Tundra Conduit";
      spellDesc =
        "Alternates between chaining Lightning Bolts and slows targets with compact Frost Novas.";
    } else if (spellType === "tri") {
      spellName = "Triad Convergence";
      spellDesc =
        "Continuously cycles between Fire, Lightning, and Frost spells for ultimate versatility.";
    }

    item.desc = `✦ ${spellName} & Barrier:\n${spellDesc}\nAbsorbs 20%-35% of incoming damage before Defense (scales with INT).`;
  };

  // Decorator Hook for createItemObject
  const originalCreateItemObject = window.createItemObject;
  window.createItemObject = function (type, rarity, stageScale, ...args) {
    let item = originalCreateItemObject
      ? originalCreateItemObject.call(this, type, rarity, stageScale, ...args)
      : null;
    if (
      item &&
      (item.type === "tome" ||
        item.subType === "tome" ||
        (item.name && item.name.toLowerCase().includes("lexicon")))
    ) {
      window.rollTomeSpells(item, stageScale, rarity);
    }
    return item;
  };
})();

(function () {
  const originalResolve = window.resolvePlayerStats;
  window.resolvePlayerStats = function (isDraft = false) {
    let stats = originalResolve ? originalResolve(isDraft) : {};
    if (!stats) return stats;

    let getLevel = (id) =>
      window.SkillTreeManager ? window.SkillTreeManager.getSkillLevel(id) : 0;

    // Apply Tome Spell Scaling & Type mapping
    if (window.equippedSlots && window.equippedSlots.subweapon) {
      let sub = window.equippedSlots.subweapon;
      if (
        sub.type === "tome" ||
        sub.subType === "tome" ||
        (sub.name && sub.name.toLowerCase().includes("lexicon"))
      ) {
        stats.spellType = sub.spellType || "fire";

        let basePower = stats.spellPower || 1.5;
        if (stats.spellType === "tri") {
          stats.spellPower = basePower * 0.8; // Balanced 1.2x modifier for full triad convergence
        } else if (stats.spellType.startsWith("dual_")) {
          stats.spellPower = basePower * 0.9; // 1.35x modifier for dual catalysts
        } else {
          stats.spellPower = basePower; // Concentrated 1.5x modifier for single element channels
        }
      }
    }

    // --- STANDARD FILLER SKILLS RESOLUTION ---

    // 1. Shield Tree Fillers
    let stalwartBastionLvl = getLevel("shield_stalwart_bastion");
    if (stalwartBastionLvl > 0) {
      stats.blockMitigation =
        (stats.blockMitigation || 0.7) + stalwartBastionLvl * 0.05;
    }

    let shieldFiller1 = getLevel("shield_filler_hp_flat");
    if (shieldFiller1 > 0) {
      stats.maxHp = (stats.maxHp || 100) * (1 + shieldFiller1 * 0.04);
      stats.def = (stats.def || 5) * (1 + shieldFiller1 * 0.03);
    }
    let shieldFiller2 = getLevel("shield_filler_flat_def");
    if (shieldFiller2 > 0) {
      stats.def = (stats.def || 5) + shieldFiller2 * 5;
      stats.maxHp = (stats.maxHp || 100) + shieldFiller2 * 25;
    }

    // 2. Dagger Tree Fillers
    let daggerFiller1 = getLevel("dagger_filler_haste");
    if (daggerFiller1 > 0) {
      stats.moveSpeed =
        (stats.moveSpeed || window.playerStats.baseMoveSpeed) *
        (1 + (daggerFiller1 * 4) / 100);
      stats.parry = (stats.parry || 0.0) + daggerFiller1 * 0.01;
    }
    let daggerFiller2 = getLevel("dagger_filler_armor_pen");
    if (daggerFiller2 > 0) {
      stats.atk = (stats.atk || 15) * (1 + daggerFiller2 * 0.04);
      stats.critDamage = (stats.critDamage || 1.5) + daggerFiller2 * 0.03;
    }

    // 3. Tome Tree Fillers
    let tomeFiller1 = getLevel("tome_filler_barrier_regen");
    if (tomeFiller1 > 0) {
      stats.spellPower = (stats.spellPower || 1.5) + tomeFiller1 * 0.04;
      stats.arcaneBarrier = (stats.arcaneBarrier || 0.2) + tomeFiller1 * 0.01;
    }
    let tomeFiller2 = getLevel("tome_filler_spell_crit");
    if (tomeFiller2 > 0) {
      stats.critChance = (stats.critChance || 0.05) + tomeFiller2 * 0.015;
      stats.atk = (stats.atk || 15) * (1 + tomeFiller2 * 0.02);
    }

    // --- INFINITE ASCENSION SKILLS RESOLUTION ---

    // 1. Shield Tree Compounding
    let EndlessBastionLvl = getLevel("shield_inf_defense");
    if (EndlessBastionLvl > 0) {
      stats.def = (stats.def || 5) * Math.pow(1.1, EndlessBastionLvl);
    }
    let SpikeResonanceLvl = getLevel("shield_inf_bash");
    if (SpikeResonanceLvl > 0) {
      stats.shieldBashMultiplier =
        (stats.shieldBashMultiplier || 1.0) * Math.pow(1.12, SpikeResonanceLvl);
    }

    // 2. Dagger Tree Compounding
    let LethalInfinitumLvl = getLevel("dagger_inf_crit");
    if (LethalInfinitumLvl > 0) {
      stats.critDamage =
        (stats.critDamage || 1.5) * Math.pow(1.12, LethalInfinitumLvl);
    }
    let ToxicOsmosisLvl = getLevel("dagger_inf_poison");
    if (ToxicOsmosisLvl > 0) {
      stats.poisonDamageMultiplier =
        (stats.poisonDamageMultiplier || 1.0) * Math.pow(1.1, ToxicOsmosisLvl);
      stats.bleedDamageMultiplier =
        (stats.bleedDamageMultiplier || 1.0) * Math.pow(1.1, ToxicOsmosisLvl);
    }

    // 3. Tome Tree Compounding
    let ArcaneSingularityLvl = getLevel("tome_inf_spell");
    if (ArcaneSingularityLvl > 0) {
      stats.spellPower =
        (stats.spellPower || 1.5) * Math.pow(1.12, ArcaneSingularityLvl);
    }
    let AethericInfusionLvl = getLevel("tome_inf_intel");
    if (AethericInfusionLvl > 0) {
      stats.atk = (stats.atk || 15) * Math.pow(1.1, AethericInfusionLvl);
      stats.int = (stats.int || 5) * Math.pow(1.1, AethericInfusionLvl);
    }

    // 4. Utility Tree Soft-Capped Power-Law Scaling (Protects game economy)
    let GildedEmperorLvl = getLevel("utility_inf_gold");
    if (GildedEmperorLvl > 0) {
      let goldBonus = 0.04 * Math.pow(GildedEmperorLvl, 0.65);
      stats.gold = (stats.gold || 1.0) + goldBonus;
    }
    let AstralProspectorLvl = getLevel("utility_inf_drop");
    if (AstralProspectorLvl > 0) {
      let dropBonus = 0.015 * Math.pow(AstralProspectorLvl, 0.65);
      stats.qly = (stats.qly || 1.0) + dropBonus;
    }

    return stats;
  };
})();
