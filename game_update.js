import { getActiveDungeonMap } from "./dungeon_map.js?v=1.010";
import { advanceSpellWeavingTimer } from "./tome_rotation_authority.js?v=1.001";
import { advanceCanonicalPotionTimers } from "./set_affix_authority.js?v=1.000";

  export const updateGame = function (canvas, isPointerHolding, checkCollisionAt) {
    window.logicClock = (window.logicClock || 0) + 1;
    const activeDungeonMap = getActiveDungeonMap();

    // Direct themed particle eruptions near the active Portal
    if (
      window.currentGameState === window.GAME_STATES.HUB &&
      activeDungeonMap &&
      activeDungeonMap.stations &&
      window.logicClock % 6 === 0
    ) {
      let pEvent = window.playerStats.activePortalEvent || "expedition";
      if (pEvent !== "expedition") {
        let map = activeDungeonMap;
        let tSize = map.tileSize || 32;
        let pStation = map.stations.find(
          (st) => st.type === window.TILE_TYPES.STATION_PORTAL,
        );
        if (pStation && window.ParticlePool && window.particles) {
          let px = pStation.x * tSize + tSize / 2;
          let py = pStation.y * tSize + tSize / 2;

          let pColor = pEvent === "onslaught" ? "#f97316" : "#a855f7";
          let angle = Math.random() * Math.PI * 2;
          let dist = window.randFloat(4, 16);

          let lifeVal = window.randInt(20, 35);
          let pt = window.ParticlePool.get(
            px + Math.cos(angle) * dist,
            py + Math.sin(angle) * dist,
            (Math.random() - 0.5) * 0.4,
            -window.randFloat(0.6, 1.4),
            window.randFloat(1.2, 2.5),
            pColor,
            0.85,
            lifeVal,
            lifeVal,
            -0.01,
            true,
          );
          if (pEvent === "rift") {
            pt.style = "glowing_orb";
          } else {
            pt.style = "sparkle_star";
          }
          window.particles.push(pt);
        }
      }
    }

    if (
      window.logicClock % 60 === 0 &&
      typeof window.checkAchievements === "function"
    ) {
      window.checkAchievements();
    }

    // --- DUNGEON MERCHANT PROXIMITY CHECK ---
    let pObj = window.player;
    let mapInstObj = activeDungeonMap;
    let closestShopItem = null;
    let closestShopDist = Infinity;
    let closestItemIdx = -1;

    if (
      window.currentGameState === window.GAME_STATES.DUNGEON &&
      mapInstObj &&
      mapInstObj.merchantTile &&
      mapInstObj.merchantStock &&
      mapInstObj.merchantStock.length > 0 &&
      !(window.playerStats && window.playerStats.robbingMarcusActive)
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
    let currentMap = activeDungeonMap;
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

    // Live UI updates for active open shop/bounty modals and periodically check daily/weekly resets
    if (Date.now() - (window.lastShopTimerUpdate || 0) >= 1000) {
      window.lastShopTimerUpdate = Date.now();

      // Lightweight, real-time timezone-aware reset check
      if (typeof window.checkAndResetMissions === "function") {
        window.checkAndResetMissions();
      }

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

      let bountyModal = document.getElementById("bounty-modal");
      if (
        bountyModal &&
        bountyModal.style.display !== "none" &&
        bountyModal.style.display !== ""
      ) {
        if (typeof window.renderBountyBoard === "function") {
          window.renderBountyBoard();
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
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};

        // Capture position coordinates for zero-allocation movement tracking
        let prevX = p ? p.x : 0;
        let prevY = p ? p.y : 0;

        if (p && p.lastDamageTimer && p.lastDamageTimer > 0) {
          p.lastDamageTimer--;
        }

        // --- ARCANE BARRIER RECHARGE ENGINE ---
        if (pStats && pStats.arcaneShieldMax && pStats.arcaneShieldMax > 0) {
          if ((window.playerStats.barrierRechargeTimer || 0) > 0) {
            window.playerStats.barrierRechargeTimer--;
          } else if (p && p.hp > 0) {
            let currentShield = p.arcaneShield || 0;
            let maxShield = pStats.arcaneShieldMax;
            if (currentShield < maxShield) {
              let regenRatePerSec = pStats.barrierRegenRate || 0.10;
              let frameRegen = (maxShield * regenRatePerSec) / 60;
              p.arcaneShield = Math.min(maxShield, currentShield + frameRegen);
              p.arcaneShieldMax = maxShield;
            }
          }
        }
    if (window.playerStats) {
      let maxCharges = window.playerStats.maxFlaskCharges || 1;

      // If we are below max charges and the recharge timer isn't running, start it
      if (
        (window.playerStats.flaskCharges || 0) < maxCharges &&
        (window.playerStats.flaskCooldownTimer || 0) <= 0
      ) {
        window.playerStats.flaskCooldownTimer = 2700;
      }

      if (window.playerStats.flaskCooldownTimer > 0) {
        window.playerStats.flaskCooldownTimer--;
        if (window.playerStats.flaskCooldownTimer === 0) {
          // Grant 1 charge back when the 45-second timer completes
          if ((window.playerStats.flaskCharges || 0) < maxCharges) {
            window.playerStats.flaskCharges =
              (window.playerStats.flaskCharges || 0) + 1;
            if (typeof window.updateHUD === "function") {
              window.updateHUD();
            }
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[✦] Field Flask Gained 1 Charge!",
                "#34d399",
              );
            }
          }
          // If still below maximum charges, restart the recharge cycle
          if ((window.playerStats.flaskCharges || 0) < maxCharges) {
            window.playerStats.flaskCooldownTimer = 2700;
          }
        }
        if (
          window.logicClock % 3 === 0 ||
          window.playerStats.flaskCooldownTimer === 0
        ) {
          if (typeof window.updateFlaskCooldownHUDOnly === "function") {
            window.updateFlaskCooldownHUDOnly();
          }
        }
      }
      if (window.playerStats.flaskUseCooldownTimer > 0) {
        window.playerStats.flaskUseCooldownTimer--;
      }
      if (window.playerStats.deflectionFatigueTimer > 0) {
        window.playerStats.deflectionFatigueTimer--;
      }
      if (window.playerStats.counterCooldownTimer > 0) {
        window.playerStats.counterCooldownTimer--;
      }
      if (window.playerStats.fortitudeTimer > 0) {
        window.playerStats.fortitudeTimer--;
        if (window.playerStats.fortitudeTimer === 0) {
          window.playerStats.fortitudeStacks = 0;
        }
      }
      if (window.playerStats.colossusAtkBonusTimer > 0) {
        window.playerStats.colossusAtkBonusTimer--;
        if (window.playerStats.colossusAtkBonusTimer === 0) {
          window.playerStats.colossusAtkBonusVal = 0;
        }
      }
      if (window.playerStats.shadowStepTimer > 0) {
        window.playerStats.shadowStepTimer--;
      }
      if (window.playerStats.frenzyTimer > 0) {
        window.playerStats.frenzyTimer--;
      }
      if (window.playerStats.maelstromSpeedTimer > 0) {
        window.playerStats.maelstromSpeedTimer--;
        if (window.playerStats.maelstromSpeedTimer === 0) {
          window.playerStats.maelstromSpeedStacks = 0;
        }
      }
      if (window.playerStats.warpCoreSprintTimer > 0) {
        window.playerStats.warpCoreSprintTimer--;
      }
      if (window.playerStats.adrenalineTimer > 0) {
        window.playerStats.adrenalineTimer--;
      }
      if (window.playerStats.astralAwakeningTimer > 0) {
        window.playerStats.astralAwakeningTimer--;
      }
      if (window.playerStats.purifiedAegisTimer > 0) {
        window.playerStats.purifiedAegisTimer--;
      }
      if (window.playerStats.fortunesFavorTimer > 0) {
        window.playerStats.fortunesFavorTimer--;
      }
      if (window.playerStats.syphonIntTimer > 0) {
        window.playerStats.syphonIntTimer--;
        if (window.playerStats.syphonIntTimer === 0) {
          window.playerStats.syphonIntStacks = 0;
        }
      }
      advanceSpellWeavingTimer(window.playerStats);
      if (window.playerStats.colossusApTimer > 0) {
        window.playerStats.colossusApTimer--;
        if (window.playerStats.colossusApTimer === 0) {
          window.playerStats.colossusApBonus = 0;
        }
      }
      if (window.playerStats.nexusTomeShieldTimer > 0) {
        window.playerStats.nexusTomeShieldTimer--;
      }

      // --- POTION AND ELIXIR TIMER DECAY & REFRESH ENGINE ---
      let isDungeon = window.currentGameState === window.GAME_STATES.DUNGEON;
      const potionResolvedStats =
        isDungeon && typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      advanceCanonicalPotionTimers({
        playerStats: window.playerStats,
        isDungeon,
        resolvedStats: potionResolvedStats,
        onActivated: (pot) => {
          if (typeof window.invalidatePlayerStats === "function") {
            window.invalidatePlayerStats();
          }
          if (typeof window.updateUI === "function") {
            window.updateUI();
          }
          if (typeof window.saveGame === "function") {
            window.saveGame();
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `✦ Activated next charge of ${pot.name}!`,
              "#34d399",
            );
          }
        },
        onExpired: (pot) => {
          if (typeof window.invalidatePlayerStats === "function") {
            window.invalidatePlayerStats();
          }
          if (typeof window.updateUI === "function") {
            window.updateUI();
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `[!] ${pot.name} duration has expired!`,
              "#f87171",
            );
          }
        },
      });
    }
    if (p.snareTimer && p.snareTimer > 0) {
      p.snareTimer--;
      p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.4);
    }

    // Poison/Bleed/Burn cadence is advanced only by updateCombatPeriodic.
    p.inDilationField = false; // Reset on every frame

    let map = activeDungeonMap;
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
        p.targetReached = false;
      }

      let dx = p.targetX - p.x;
      let dy = p.targetY - p.y;
      let dist = Math.hypot(dx, dy);

      if (dist <= 2) {
        p.targetReached = true;
      }

      if (!p.targetReached && dist > 2) {
        let moveStep = Math.min(p.speed * speedMult, dist);
        vx = (dx / dist) * moveStep;
        vy = (dy / dist) * moveStep;
      }
    }

    // --- SUBPHASE 4: SLICK ICE DECELERATION SLIDING PHYSICS ---
    p.slideVx = p.slideVx || 0;
    p.slideVy = p.slideVy || 0;

    if (
      window.isCavernEffectActive &&
      window.isCavernEffectActive("slick_ice")
    ) {
      if (vx !== 0 || vy !== 0) {
        p.slideVx += (vx - p.slideVx) * 0.12; // Smooth acceleration on ice
        p.slideVy += (vy - p.slideVy) * 0.12;
      } else {
        p.slideVx *= 0.95; // Ice sliding friction decay
        p.slideVy *= 0.95;
        if (Math.abs(p.slideVx) < 0.05) p.slideVx = 0;
        if (Math.abs(p.slideVy) < 0.05) p.slideVy = 0;
      }
      vx = p.slideVx;
      vy = p.slideVy;
    } else {
      p.slideVx = 0;
      p.slideVy = 0;
    }
    // -----------------------------------------------------------

    // --- KNOCKBACK IMPULSE DECAY ---
    p.knockbackVx = p.knockbackVx || 0;
    p.knockbackVy = p.knockbackVy || 0;

    if (p.knockbackVx !== 0 || p.knockbackVy !== 0) {
      let pRadius = p.radius || 9;
      let nextX = p.x + p.knockbackVx;
      let nextY = p.y + p.knockbackVy;

      if (!checkCollisionAt(map, nextX, p.y, pRadius)) {
        p.x = nextX;
      } else {
        p.knockbackVx = 0;
      }

      if (!checkCollisionAt(map, p.x, nextY, pRadius)) {
        p.y = nextY;
      } else {
        p.knockbackVy = 0;
      }

      p.knockbackVx *= 0.72;
      p.knockbackVy *= 0.72;

      if (Math.abs(p.knockbackVx) < 0.1) p.knockbackVx = 0;
      if (Math.abs(p.knockbackVy) < 0.1) p.knockbackVy = 0;
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

    // --- REAL-TIME SPATIAL DISPLACEMENT AND COMBAT STAT TRACKERS ---
    if (
      window.currentGameState === window.GAME_STATES.DUNGEON &&
      window.playerStats &&
      p
    ) {
      // 1. Kinetic Movement Tracking
      let distMoved = Math.hypot(p.x - prevX, p.y - prevY);
      if (distMoved >= 0.01) {
        window.playerStats.kineticStillTimer = 0;
        window.playerStats.kineticDistanceTraveled += distMoved;
        if (window.playerStats.kineticDistanceTraveled >= 10) {
          let chargesGained = Math.floor(
            window.playerStats.kineticDistanceTraveled / 10,
          );
          window.playerStats.kineticFrictionCharges = Math.min(
            50,
            window.playerStats.kineticFrictionCharges + chargesGained,
          );
          window.playerStats.kineticDistanceTraveled %= 10;
        }
      } else {
        // Increment stationary frame count
        window.playerStats.kineticStillTimer++;
        if (window.playerStats.kineticStillTimer >= 90) {
          // 1.5 seconds at 60 FPS
          // Dissipate 10 charges per second (1 charge every 6 frames)
          if (
            window.logicClock % 6 === 0 &&
            window.playerStats.kineticFrictionCharges > 0
          ) {
            window.playerStats.kineticFrictionCharges--;
          }
        }
      }

      // 2. Active Combat & Tenacity Tracking
      if (window.playerStats.combatTimer > 0) {
        window.playerStats.combatTimer--;
        window.playerStats.activeCombatTicks++;
        window.playerStats.outOfCombatTicks = 0;

        if (window.playerStats.activeCombatTicks >= 60) {
          // 1.0 second intervals
          window.playerStats.activeCombatTicks = 0;
          window.playerStats.tenacityStacks = Math.min(
            15,
            window.playerStats.tenacityStacks + 1,
          );
        }
      } else {
        window.playerStats.activeCombatTicks = 0;
        window.playerStats.outOfCombatTicks++;

        if (window.playerStats.outOfCombatTicks >= 60) {
          // 1.0 second intervals
          window.playerStats.outOfCombatTicks = 0;
          window.playerStats.tenacityStacks = Math.max(
            0,
            window.playerStats.tenacityStacks - 1,
          );
        }
      }

      // 3. Floor Active Duration
      window.playerStats.floorActiveTicks++;
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
          map.revealSightRadius(p.x, p.y, pStats.int || 0);
        }

    // Execute Top-Down Combat & Gold / XP Magnet Mechanics
    window.updateCavernEffects();

    // --- SUBPHASE 5: UPDATE SPECIAL CHALLENGES & CAVERN MUTATORS ENGINE ---
    if (
      window.ChallengeEngine &&
      typeof window.ChallengeEngine.update === "function"
    ) {
      window.ChallengeEngine.update(map, p);
    }
    // ----------------------------------------------------------------------

    window.updateHeroBuffParticles();
    window.updateDungeonCombat(checkCollisionAt);
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
      if (!cam.__smoothed) {
        let origUpdate = cam.update;
        cam.update = function (px, py, mapW, mapH) {
          let zoom = this.zoom || 1.0;
          let targetX = px - this.viewportW / zoom / 2;
          let targetY = py - this.viewportH / zoom / 2;

          let maxX = mapW - this.viewportW / zoom;
          let maxY = mapH - this.viewportH / zoom;

          if (maxX > 0) targetX = Math.max(0, Math.min(maxX, targetX));
          else targetX = (mapW - this.viewportW / zoom) / 2;

          if (maxY > 0) targetY = Math.max(0, Math.min(maxY, targetY));
          else targetY = (mapH - this.viewportH / zoom) / 2;

          if (
            this.x === undefined ||
            Math.abs(this.x - targetX) > 600 ||
            Math.abs(this.y - targetY) > 600
          ) {
            this.x = targetX;
            this.y = targetY;
          } else {
            this.x += (targetX - this.x) * 0.18;
            this.y += (targetY - this.y) * 0.18;
          }
        };
        cam.__smoothed = true;
      }
      cam.update(p.x, p.y, map.width * tileSize, map.height * tileSize);
    }

    let zoom = cam ? cam.zoom : 1.0;
    let viewW = (canvas ? canvas.width : 750) / zoom;
    let viewH = (canvas ? canvas.height : 320) / zoom;
    let minX = cam ? cam.x : 0;
    let maxX = minX + viewW;
    let minY = cam ? cam.y : 0;
    let maxY = minY + viewH;

    // Discover portal ONLY when its specific tile enters camera view
    if (map && map.extractionTile) {
      let pTileX = map.extractionTile.x;
      let pTileY = map.extractionTile.y;
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

        // Robbery Portal Lockout Intervention
        if (
          tile === window.TILE_TYPES.DESCENT_PORTAL ||
          tile === window.TILE_TYPES.EXTRACTION_ZONE ||
          tile === window.TILE_TYPES.BOSS_GATE
        ) {
          if (window.playerStats && window.playerStats.robbingMarcusActive) {
            if (window.logicClock % 60 === 0) {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "[LOCK] PORTAL LOCKED: DEFEAT MARCUS!",
                "#ef4444",
              );
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("block");
              }
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(3, 6);
              }
            }
            return; // Stop further interaction
          }
        }

        if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
          // Subphase 16: Lock descent portals on Floors 1-3 until the active Warden mini-boss is slain
          if (window.playerStats.activeSpecialChallenge && window.mob) {
            if (window.logicClock % 60 === 0) {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "PORTAL LOCKED - DEFEAT THE WARDEN!",
                "#ef4444",
              );
            }
          } else {
            if (Date.now() - (window.lastModalCloseTime || 0) > 1000) {
              window.executePortalDescend();
            }
          }
        } else if (
          (tile === window.TILE_TYPES.EXTRACTION_ZONE ||
            tile === window.TILE_TYPES.BOSS_GATE) &&
          Date.now() - (window.lastModalCloseTime || 0) > 1000
        ) {
          window.openPortalChoiceModal();
        }

        if (tile === window.TILE_TYPES.RECOVERY_CHEST) {
          if (!window.isChestOpened(currentTileX, currentTileY)) {
            let key = `${currentTileX},${currentTileY}`;
            let map = activeDungeonMap;
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
            let map = activeDungeonMap;
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

    // Update the DPS overlay badge periodically
    if (
      typeof window.calculateActiveDps === "function" &&
      window.logicClock % 10 === 0
    ) {
      window.calculateActiveDps();
    }
  };

