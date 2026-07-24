/* ==========================================================================
   PRIMARY PURPOSE: Clean Top-Down Extraction Crawler Core Engine & Game Loop.
   Supports Adventurer's Hub state, Station Interactions, and Extraction Runs.
   ========================================================================= */

(function () {
  let canvas, ctx;

  window.activeStationPrompt = null;
    window.floatingTexts = [];
    window.xpOrbs = [];

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

  window.spawnFloatingText = function (x, y, text, color) {
    window.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      life: 45,
      maxLife: 45,
    });
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

    if (window.SoundManager && typeof window.SoundManager.init === "function") {
      window.SoundManager.init();
    }

    // Pointer Input Handling (Joystick & Follow Cursor Modes)
    let isPointerHolding = false;

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
      isPointerHolding = true;

      let { clickX, clickY } = handlePointerPosition(e);

      // Check Station Prompt Interaction
      if (window.activeStationPrompt) {
        let promptY = canvas.height - 50;
        if (clickY >= promptY - 20 && clickY <= promptY + 20) {
          window.interactWithStation(window.activeStationPrompt.type);
          return;
        }
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
        let worldX = clickX + window.DungeonCamera.x;
        let worldY = clickY + window.DungeonCamera.y;
        window.player.targetX = worldX;
        window.player.targetY = worldY;
      }
    });

    canvas.addEventListener("pointermove", function (e) {
      if (window.player.hp <= 0) return;

      let { clickX, clickY } = handlePointerPosition(e);
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
        let worldX = clickX + window.DungeonCamera.x;
        let worldY = clickY + window.DungeonCamera.y;
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

    // Start inside Adventurer's Hub
    window.loadHub();

    // Start 60 FPS Engine Loop
    requestAnimationFrame(gameLoop);
  });

  window.resizeCanvas = function () {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  // --- ADVENTURER'S HUB & STATE TRANSITIONS ---
  window.loadHub = function () {
        window.currentGameState = window.GAME_STATES.HUB;

        // Clear active dungeon combat entities and gold particles
        window.activeDungeonMobs = [];
        window.mob = null;
        window.goldParticles = [];

        let summaryModal = document.getElementById("summary-modal");
        if (summaryModal) summaryModal.style.display = "none";

      let map = window.activeDungeonMap.generateHub();
      let tileSize = map.tileSize;

      window.player.hp = window.player.maxHp;
      window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
      window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
      window.player.targetX = window.player.x;
      window.player.targetY = window.player.y;

      if (!window.inventory) window.inventory = { EQUIP: [], ARTIFACT: [], SIGIL: [], ETC: {}, USE: {} };
      if (!window.player.stash || window.player.stash.length === 0) {
        window.player.stash = window.inventory.EQUIP || [];
      }
      window.inventory.EQUIP = window.player.stash;

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

  window.enterDungeonRun = function () {
    window.currentGameState = window.GAME_STATES.DUNGEON;
    window.player.depth = 1;
    window.player.bag = [];
    window.loadDungeonFloor(window.player.depth);
  };

  window.spawnBossEncounter = function (tileX, tileY) {
      let map = window.activeDungeonMap;
      let tileSize = map ? map.tileSize : 32;

      let bossHp = 600;
      let bossAtk = 28;

      window.mob = {
        type: "dungeon_boss",
        name: "Floor Warden",
        hp: BigNum.from(bossHp),
        maxHp: BigNum.from(bossHp),
        atk: bossAtk,
        x: tileX * tileSize,
        y: tileY * tileSize,
        w: 48,
        h: 48,
        flashTimer: 0,
        isStopped: true,
        bossTileX: tileX,
        bossTileY: tileY,
      };

      window.spawnFloatingText(
        window.player.x,
        window.player.y - 25,
        "FLOOR WARDEN ENGAGED",
        "#e74c3c",
      );
    };

    window.onBossDefeated = function (tileX, tileY) {
      let map = window.activeDungeonMap;
      if (map && map.grid && map.grid[tileY] && map.grid[tileY][tileX] !== undefined) {
        map.grid[tileY][tileX] = window.TILE_TYPES.EXTRACTION_ZONE;
      }
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 25,
        "EXTRACTION ZONE OPEN",
        "#00d2ff",
      );
    };

    window.activeDungeonMobs = [];

      window.loadDungeonFloor = function (depth) {
        if (!window.activeDungeonMap) return;

        let map;
        if (depth >= 4) {
          map = window.activeDungeonMap.generateBossArena();
        } else {
          map = window.activeDungeonMap.generate(depth);
        }
        let tileSize = map.tileSize;

        window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
        window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
        window.player.targetX = window.player.x;
        window.player.targetY = window.player.y;

        window.activeDungeonMobs = [];
        window.mob = null;

        if (depth >= 4) {
          let cx = Math.floor(map.width / 2);
          let cy = Math.floor(map.height / 2);
          window.spawnBossEncounter(cx, cy);
        } else if (map.mobSpawns) {
          let mobHpVal = 40 + depth * 15;
          let mobAtkVal = 8 + depth * 3;
          map.mobSpawns.forEach((sp) => {
            window.activeDungeonMobs.push({
              id: window.idCounter++,
              type: "mob",
              visualTier: 0,
              visualType: "slime",
              x: sp.x * tileSize,
              y: sp.y * tileSize,
              w: 24,
              h: 24,
              hp: BigNum.from(mobHpVal),
              maxHp: BigNum.from(mobHpVal),
              atk: mobAtkVal,
              flashTimer: 0,
              attackCooldown: 0,
            });
          });
        }

        window.updateHUD();
        let floorTitle = depth >= 4 ? "BOSS ARENA" : `FLOOR ${depth} DESCENT`;
        window.spawnFloatingText(
          window.player.x,
          window.player.y - 20,
          floorTitle,
          depth >= 4 ? "#e74c3c" : "#00d2ff",
        );
      };

  window.interactWithStation = function (stationType) {
    if (stationType === window.TILE_TYPES.STATION_PORTAL) {
      window.enterDungeonRun();
    } else if (stationType === window.TILE_TYPES.STATION_FORGE) {
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 15,
        "FORGE STATION OPEN",
        "#f1c40f",
      );
    } else if (stationType === window.TILE_TYPES.STATION_STASH) {
      window.toggleLootBag();
    } else if (stationType === window.TILE_TYPES.STATION_INN) {
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 15,
        "COMPANION INN OPEN",
        "#a855f7",
      );
    }
  };

  window.requestAbandonRun = function () {
      if (window.currentGameState === window.GAME_STATES.HUB) return;
      window.triggerExtraction(false, true);
    };

    window.openPortalChoiceModal = function () {
      let modal = document.getElementById("portal-modal");
      let titleEl = document.getElementById("portal-modal-title");
      let subEl = document.getElementById("portal-modal-subtitle");
      let descendBtn = document.getElementById("portal-btn-descend");

      if (!modal) return;

      let depth = window.player.depth || 1;
      if (titleEl) titleEl.innerText = `DUNGEON PORTAL (FLOOR ${depth})`;

      if (depth >= 3) {
        if (subEl) subEl.innerText = "The Floor Warden awaits beyond this portal!";
        if (descendBtn) {
          descendBtn.innerText = "ENTER BOSS ARENA";
          descendBtn.style.background = "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)";
          descendBtn.style.borderColor = "#f87171";
        }
      } else {
        if (subEl) subEl.innerText = `Floor ${depth} Cleared. Choose your path:`;
        if (descendBtn) {
          descendBtn.innerText = `DESCEND TO FLOOR ${depth + 1}`;
          descendBtn.style.background = "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)";
          descendBtn.style.borderColor = "#c084fc";
        }
      }

      modal.style.display = "flex";
    };

    window.executePortalDescend = function () {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      window.player.depth++;
      window.loadDungeonFloor(window.player.depth);
    };

    window.executePortalExtract = function () {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      window.triggerExtraction(true);
    };

  window.triggerExtraction = function (success = true, isAbandon = false) {
        let summaryModal = document.getElementById("summary-modal");
        let titleEl = document.getElementById("summary-title");
        let subEl = document.getElementById("summary-subtitle");
        let listEl = document.getElementById("summary-loot-list");
        let btnEl = document.getElementById("summary-action-btn");

        if (!summaryModal || !titleEl || !listEl) return;

        let extractedLoot = [...(window.player.bag || [])];
        let savedInsuredItems = [];
        let lostItems = [];

        if (success) {
                titleEl.innerText = "EXTRACTION SUCCESSFUL";
                titleEl.style.color = "#2ecc71";

                // Award +25% Extraction Bonus XP on total run earnings (base XP already gained in-run)
                                let runXp = window.playerStats.runXp || 0;
                                let bonusXp = Math.floor(runXp * 0.25);

                                if (bonusXp > 0 && typeof window.gainXp === "function") {
                                  window.gainXp(bonusXp);
                                }
                                window.playerStats.runXp = 0;

                if (subEl)
                  subEl.innerText = `Secured ${extractedLoot.length} items to Storage Vault! (+25% Extraction Bonus XP Awarded)`;

                // Save carried bag items permanently to Stash and sync inventory
                window.player.stash.push(...extractedLoot);
                window.player.bag = [];
                if (window.inventory) window.inventory.EQUIP = window.player.stash;
                if (typeof window.saveGame === "function") window.saveGame();
              } else {
          titleEl.innerText = isAbandon ? "RUN ABANDONED" : "CRITICAL DEFEAT";
          titleEl.style.color = isAbandon ? "#e67e22" : "#e74c3c";

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

          // Process Equipped Gear (Unlocked gear is lost on defeat!)
          for (let slotKey in window.equippedSlots) {
            let eqItem = window.equippedSlots[slotKey];
            if (eqItem) {
              if (eqItem.locked) {
                savedInsuredItems.push(eqItem);
              } else {
                lostItems.push(eqItem);
                window.equippedSlots[slotKey] = null;
              }
            }
          }

          // Safety Net: Ensure player is never left without a weapon option
          let hasWeapon = window.equippedSlots.weapon || window.player.stash.some((i) => i.type === "weapon");
          if (!hasWeapon) {
            let starterSword = window.createItemObject("weapon", 0, 1, 0);
            starterSword.name = "Novice Blade (Starter)";
            window.player.stash.push(starterSword);
            savedInsuredItems.push(starterSword);
          }

          if (subEl) {
            subEl.innerText = `Unlocked gear lost (${lostItems.length} items). Insured items (${savedInsuredItems.length}) & 100% Gold saved!`;
          }

          if (window.inventory) window.inventory.EQUIP = window.player.stash;
          if (typeof window.saveGame === "function") window.saveGame();
        }

        // Render summary breakdown
        if (success) {
          listEl.innerHTML = extractedLoot.length > 0
            ? extractedLoot
                .map((item) => {
                  let col = window.getTierColor
                    ? window.getTierColor(item.statsRolled)
                    : "#2ecc71";
                  return `
                  <div style="background:#111; border:1px solid #333; border-left:3px solid ${col}; padding:6px 10px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between;">
                    <span style="color:${col}; font-weight:bold;">${item.name}</span>
                    <span style="color:#2ecc71; font-family:monospace;">EXTRACTED</span>
                  </div>
                `;
                })
                .join("")
            : `<div style="color:#7f8c8d; font-style:italic; padding:10px; text-align:center;">No carried loot extracted.<br><span style="color:#f1c40f; font-weight:bold;">100% Collected Gold Secured in Wallet!</span></div>`;
        } else {
          let savedHtml = savedInsuredItems.map((i) => `
            <div style="background:#0a1a10; border:1px solid #1e4620; border-left:3px solid #2ecc71; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
              <span style="color:#2ecc71; font-weight:bold;">[INSURED] ${i.name}</span>
              <span style="color:#81ecec; font-family:monospace;">SAVED</span>
            </div>
          `).join("");

          let lostHtml = lostItems.map((i) => `
            <div style="background:#1a0a0a; border:1px solid #4a1515; border-left:3px solid #e74c3c; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
              <span style="color:#e74c3c; text-decoration:line-through;">${i.name}</span>
              <span style="color:#ff7675; font-family:monospace;">LOST</span>
            </div>
          `).join("");

          listEl.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">
              ${savedHtml}
              ${lostHtml}
              ${savedInsuredItems.length === 0 && lostItems.length === 0 ? '<div style="color:#aaa; font-size:10px;">No gear lost.</div>' : ''}
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

  function checkCollisionAt(map, testX, testY, radius) {
      let tileSize = map.tileSize;
      let minTileX = Math.floor((testX - radius) / tileSize);
      let maxTileX = Math.floor((testX + radius) / tileSize);
      let minTileY = Math.floor((testY - radius) / tileSize);
      let maxTileY = Math.floor((testY + radius) / tileSize);

      for (let ty = minTileY; ty <= maxTileY; ty++) {
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          if (ty < 0 || ty >= map.height || tx < 0 || tx >= map.width) return true;
          let tile = map.grid[ty][tx];
          if (tile === window.TILE_TYPES.WALL || tile === window.TILE_TYPES.VOID) {
            return true;
          }
        }
      }
      return false;
    }

    // --- PHYSICS & LOGIC UPDATE ---
        function update() {
          let p = window.player;

          let map = window.activeDungeonMap;
          if (!map || !map.grid) return;
          let tileSize = map.tileSize;

          let mode = window.playerStats ? (window.playerStats.controlMode || "joystick") : "joystick";
      let vx = 0;
      let vy = 0;

      if (mode === "joystick" && window.joystick.active) {
        let joy = window.joystick;
        vx = joy.vx;
        vy = joy.vy;
      } else {
        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 2) {
          let moveStep = Math.min(p.speed, dist);
          vx = (dx / dist) * moveStep;
          vy = (dy / dist) * moveStep;
        }
      }

      if (vx !== 0 || vy !== 0) {
        if (vx < -0.1) p.facing = -1;
        else if (vx > 0.1) p.facing = 1;

        let pRadius = p.radius || 9;

        // Axis-decoupled movement with smooth wall sliding
        if (vx !== 0) {
          let nextX = p.x + vx;
          if (!checkCollisionAt(map, nextX, p.y, pRadius)) {
            p.x = nextX;
          }
        }

        if (vy !== 0) {
          let nextY = p.y + vy;
          if (!checkCollisionAt(map, p.x, nextY, pRadius)) {
            p.y = nextY;
          }
        }

        p.targetX = p.x;
        p.targetY = p.y;
      }

    // Execute Top-Down Combat & Gold / XP Magnet Mechanics
            window.updateDungeonCombat();
            window.updateGoldParticles();
            window.updateXpOrbs();

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

        if (
                  tile === window.TILE_TYPES.DESCENT_PORTAL ||
                  tile === window.TILE_TYPES.EXTRACTION_ZONE ||
                  tile === window.TILE_TYPES.BOSS_GATE
                ) {
                  map.grid[currentTileY][currentTileX] = window.TILE_TYPES.FLOOR;
                  window.openPortalChoiceModal();
                }

                if (tile === window.TILE_TYPES.CHEST_SPAWN) {
          map.grid[currentTileY][currentTileX] = window.TILE_TYPES.FLOOR;

          let stageScale = window.player.depth;
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
            window.randInt(1, 4),
            stageScale,
            0,
          );

          p.bag.push(newItem);
          window.updateHUD();

          if (typeof window.pushToast === "function") {
                      window.pushToast(newItem);
                    }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("fairy");
          }
        }
      }
    }

    // Update Particles Lifecycle
        if (window.particles) {
          for (let i = window.particles.length - 1; i >= 0; i--) {
            let pt = window.particles[i];
            pt.life--;
            pt.x += pt.vx;
            pt.y += pt.vy;
            if (pt.gravity) pt.vy += pt.gravity;
            if (pt.fade) pt.alpha = Math.max(0, pt.life / pt.maxLife);
            if (pt.life <= 0) {
              window.particles.splice(i, 1);
              if (window.ParticlePool) window.ParticlePool.recycle(pt);
            }
          }
        }

        // Update Floating Text Timers
        for (let i = window.floatingTexts.length - 1; i >= 0; i--) {
          let ft = window.floatingTexts[i];
          ft.life--;
          ft.y -= 0.4;
          if (ft.life <= 0) window.floatingTexts.splice(i, 1);
        }
      }

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
                let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
                let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
                orb.screenX = orb.worldX - camX;
                orb.screenY = orb.worldY - camY;
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

                if (window.SoundManager && typeof window.SoundManager.play === "function") {
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

        window.spawnHomingGold = function (x, y, amount) {
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
                window.spawnFloatingText(
                  p.x,
                  p.y - 15,
                  `+${window.formatNumber(gp.value)} Gold`,
                  "#ffd700",
                );
                window.goldParticles.splice(i, 1);
              } else {
                gp.speed = Math.min(12, gp.speed + 0.4);
                gp.x += (dx / dist) * gp.speed;
                gp.y += (dy / dist) * gp.speed;
              }
            }
          }
        };

        window.updateDungeonCombat = function () {
          let p = window.player;
          let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : { atk: BigNum.from(15) };
          p.attackTimer = (p.attackTimer || 0) + 1;

          if (window.hero.slashTimer > 0) {
            window.hero.slashTimer--;
            window.hero.slashFrame = true;
          } else {
            window.hero.slashFrame = false;
          }

          // Process active room mobs
          if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
            for (let i = window.activeDungeonMobs.length - 1; i >= 0; i--) {
              let m = window.activeDungeonMobs[i];
              if (m.flashTimer > 0) m.flashTimer--;
              if (m.attackCooldown > 0) m.attackCooldown--;

              let dx = p.x - (m.x + m.w / 2);
              let dy = p.y - (m.y + m.h / 2);
              let dist = Math.hypot(dx, dy);

              // Mob Aggro & Bouncing Hop Movement with Wall Collision Checks
                            if (dist < 180 && dist > 14) {
                              m.hopTimer = (m.hopTimer || 0) + 1;
                              let cycle = m.hopTimer % 30; // 15 frames jumping, 15 frames resting
                              if (cycle < 15) {
                                let speed = 1.8;
                                let mRadius = 6;
                                let moveX = (dx / dist) * speed;
                                let moveY = (dy / dist) * speed;

                                let map = window.activeDungeonMap;
                                if (map && map.grid) {
                                  let centerX = m.x + m.w / 2;
                                  let centerY = m.y + m.h / 2;
                                  if (!checkCollisionAt(map, centerX + moveX, centerY, mRadius)) {
                                    m.x += moveX;
                                  }
                                  if (!checkCollisionAt(map, centerX, centerY + moveY, mRadius)) {
                                    m.y += moveY;
                                  }
                                }
                              }
                            }

              // Hero Proximity Auto-Attack
              if (dist < 38 && p.attackTimer >= 20) {
                p.attackTimer = 0;
                window.hero.slashTimer = 8; // Trigger 8-frame slash animation arc
                let pAtk = BigNum.from(pStats.atk || p.atk);
                m.hp = m.hp.sub(pAtk);
                m.flashTimer = 5;

                window.spawnFloatingText(
                  m.x + m.w / 2,
                  m.y - 10,
                  `-${window.formatNumber(pAtk)}`,
                  "#ffffff"
                );

                if (window.SoundManager && typeof window.SoundManager.play === "function") {
                  window.SoundManager.play("swing");
                }

                if (m.hp.lte(0)) {
                  if (window.spawnDeathParticles) {
                    window.spawnDeathParticles(m.x + m.w / 2, m.y + m.h / 2, m.type);
                  }
                  let rewardGold = Math.floor(15 * (1 + window.player.depth * 0.5));
                  let rewardXp = Math.floor(25 * (1 + window.player.depth * 0.5));
                  window.spawnHomingGold(m.x + m.w / 2, m.y + m.h / 2, rewardGold);
                  window.spawnHomingXp(m.x + m.w / 2, m.y + m.h / 2, rewardXp);
                  window.activeDungeonMobs.splice(i, 1);
                  continue;
                }
              }

              // Mob Contact Melee Attack on Player
              if (dist < 20 && m.attackCooldown <= 0) {
                m.attackCooldown = 60; // 1s attack cooldown
                p.hp = Math.max(0, p.hp - m.atk);
                window.spawnFloatingText(p.x, p.y - 15, `-${m.atk}`, "#e74c3c");
                if (window.SoundManager && typeof window.SoundManager.play === "function") {
                  window.SoundManager.play("block");
                }
                window.updateHUD();
                if (p.hp <= 0) {
                  window.triggerExtraction(false, false);
                }
              }
            }
          }

          // Process Boss Warden Combat
          if (window.mob && window.mob.hp) {
            let bm = window.mob;
            if (bm.flashTimer > 0) bm.flashTimer--;
            if (bm.attackCooldown > 0) bm.attackCooldown--;

            let dx = p.x - (bm.x + bm.w / 2);
            let dy = p.y - (bm.y + bm.h / 2);
            let dist = Math.hypot(dx, dy);

            if (dist < 48 && p.attackTimer >= 20) {
              p.attackTimer = 0;
              let pAtk = BigNum.from(pStats.atk || p.atk);
              bm.hp = bm.hp.sub(pAtk);
              bm.flashTimer = 5;

              window.spawnFloatingText(
                bm.x + bm.w / 2,
                bm.y - 10,
                `-${window.formatNumber(pAtk)}`,
                "#f1c40f"
              );

              if (window.SoundManager && typeof window.SoundManager.play === "function") {
                window.SoundManager.play("swing");
              }

              if (bm.hp.lte(0)) {
                if (window.spawnDeathParticles) {
                  window.spawnDeathParticles(bm.x + bm.w / 2, bm.y + bm.h / 2, "boss");
                }
                let rewardGold = Math.floor(150 * (1 + window.player.depth * 0.5));
                let rewardXp = Math.floor(200 * (1 + window.player.depth * 0.5));
                window.spawnHomingGold(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardGold);
                window.spawnHomingXp(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardXp);
                let tileX = bm.bossTileX || Math.floor(bm.x / 32);
                let tileY = bm.bossTileY || Math.floor(bm.y / 32);
                window.mob = null;
                window.onBossDefeated(tileX, tileY);
              }
            }

            if (bm && dist < 32 && bm.attackCooldown <= 0) {
              bm.attackCooldown = 60;
              p.hp = Math.max(0, p.hp - bm.atk);
              window.spawnFloatingText(p.x, p.y - 15, `-${bm.atk}`, "#e74c3c");
              if (window.SoundManager && typeof window.SoundManager.play === "function") {
                window.SoundManager.play("block");
              }
              window.updateHUD();
              if (p.hp <= 0) {
                window.triggerExtraction(false, false);
              }
            }
          }
        };

        // --- RENDER ENGINE ---
        function render() {
          if (!ctx || !canvas) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let map = window.activeDungeonMap;
          if (!map || !map.grid || map.grid.length === 0) return;

          let tileSize = map.tileSize;
          let p = window.player;

          window.DungeonCamera.update(
            p.x,
            p.y,
            map.width * tileSize,
            map.height * tileSize,
          );

          // 1. Render Map & Minimap
          window.renderTopDownMap(ctx, canvas);

          // Render Active Room Mobs & Boss in Top-Down Space
          ctx.save();
          ctx.translate(
            -Math.floor(window.DungeonCamera.x),
            -Math.floor(window.DungeonCamera.y),
          );

          if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
            window.activeDungeonMobs.forEach((m) => {
              window.drawSingleMob(ctx, m);
            });
          }

          if (window.mob) {
            window.drawSingleMob(ctx, window.mob);
          }

          // Render Gold Homing Particles in Top-Down Space
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

          // Render XP Homing Orbs
          if (window.xpOrbs && window.xpOrbs.length > 0) {
            let camX = window.DungeonCamera ? Math.floor(window.DungeonCamera.x) : 0;
            let camY = window.DungeonCamera ? Math.floor(window.DungeonCamera.y) : 0;

            for (let i = 0; i < window.xpOrbs.length; i++) {
              let orb = window.xpOrbs[i];
              let drawX = orb.isHomingScreenSpace ? orb.screenX : orb.worldX - camX;
              let drawY = orb.isHomingScreenSpace ? orb.screenY : orb.worldY - camY;

              ctx.save();
              let r = 4.0;
              let pulse = Math.abs(Math.sin(Date.now() / 70 + i)) * 0.3 + 0.8;

              let grad = ctx.createRadialGradient(drawX, drawY, 1, drawX, drawY, r * 2.2 * pulse);
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
          ctx.restore();

          // 2. Render Player Entity on Top-Down Canvas
          ctx.save();
          ctx.translate(
            -Math.floor(window.DungeonCamera.x),
            -Math.floor(window.DungeonCamera.y),
          );

          // Target Movement Line
          let dx = p.targetX - p.x;
          let dy = p.targetY - p.y;
          if (Math.hypot(dx, dy) > 3) {
            ctx.strokeStyle = "rgba(0, 210, 255, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.targetX, p.targetY);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Hero Model (With Directional Flip, Equipped Gear, and Slash Arc)
          let bounce = Math.abs(Math.sin(Date.now() / 150)) * 2;
          ctx.save();
          ctx.translate(p.x, p.y - 8);
          if (p.facing === -1) {
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
              deathAnimationTimer: 0,
              isMainHero: true,
            },
          );
          ctx.restore();

          // Floating Text Effects
          window.floatingTexts.forEach((ft) => {
            ctx.font = "bold 11px monospace";
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.5;
            ctx.textAlign = "center";
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
          });

          ctx.restore();

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

          // 4. Render Station Proximity Prompt Overlay
          if (
            window.activeStationPrompt &&
            window.currentGameState === window.GAME_STATES.HUB
          ) {
            let st = window.activeStationPrompt;
            let promptY = canvas.height - 40;

            ctx.save();
            ctx.fillStyle = "rgba(10, 14, 23, 0.92)";
            ctx.strokeStyle = "#00d2ff";
            ctx.lineWidth = 2;

            let pw = 240;
            let ph = 32;
            let px = (canvas.width - pw) / 2;

            ctx.fillRect(px, promptY - 16, pw, ph);
            ctx.strokeRect(px, promptY - 16, pw, ph);

            ctx.font = "bold 11px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`[ TAP TO ENTER: ${st.label} ]`, canvas.width / 2, promptY);
            ctx.restore();
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

      if (nameEl) nameEl.innerText = stats.playerName || "HERO";
      if (lvlEl) lvlEl.innerText = `LV.${stats.level || 1}`;

      let roundedHp = Math.round(p.hp);
      let roundedMaxHp = Math.round(p.maxHp);
      if (hpFill) hpFill.style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
      if (hpText) hpText.innerText = `${roundedHp} / ${roundedMaxHp}`;

      // Update XP Bar Track
      let curXp = BigNum.from(stats.xp || 0);
      let reqXp = BigNum.from(stats.xpReq || 350);
      let xpRatio = 0;
      if (reqXp.gt(0)) {
        let div = curXp.div(reqXp);
        xpRatio = Math.max(0, Math.min(1, div.m * Math.pow(10, Math.min(15, div.e))));
      }
      if (xpFill) xpFill.style.width = `${(xpRatio * 100).toFixed(1)}%`;
      if (xpText) xpText.innerText = `${window.formatNumber(curXp)} / ${window.formatNumber(reqXp)}`;
      if (goldText) goldText.innerText = window.formatNumber ? window.formatNumber(stats.coins || 0) : (stats.coins || 0);
      if (depthLabel)
        depthLabel.innerText = isHub
          ? "ADVENTURER'S HUB"
          : `DUNGEON FLOOR ${p.depth}`;
      if (objectiveLabel)
        objectiveLabel.innerText = isHub
          ? "Select a Station or Portal"
          : "Find the Extraction Zone";

      let bagBtn = document.getElementById("btn-bag-toggle");
      if (bagBtn) {
        let count = isHub ? (p.stash ? p.stash.length : 0) : (p.bag ? p.bag.length : 0);
        let label = isHub ? "VAULT" : "BAG";
        bagBtn.innerHTML = `${label} (<span id="hud-bag-count">${count}</span>)`;
      } else if (bagCount) {
        bagCount.innerText = isHub ? (p.stash ? p.stash.length : 0) : (p.bag ? p.bag.length : 0);
      }

      if (ctrlSettingBtn) {
        ctrlSettingBtn.innerText =
          mode === "cursor"
            ? "MODE: CURSOR (TOUCH TO MOVE)"
            : "MODE: JOYSTICK (DRAG THUMB)";
      }

      if (muteSettingBtn) {
        muteSettingBtn.innerText = stats.mute
          ? "AUDIO: MUTED"
          : "AUDIO: ENABLED";
      }

      if (abandonBtn) {
        abandonBtn.style.display = isHub ? "none" : "inline-block";
      }
    };

    // --- HERO PROFILE & STASH MANAGEMENT ENGINE ---
      window.getItemIconSvg = function (item, size = 28) {
        if (!item) return "";
        if (typeof window.getEquipIconHtml === "function") {
          return window.getEquipIconHtml(item, size);
        }
        let col = window.getTierColor ? window.getTierColor(item.statsRolled) : "#00d2ff";
        let label = (item.subType || item.type || "EQ").slice(0, 2).toUpperCase();
        return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:rgba(0,0,0,0.4); border:1px solid ${col}; border-radius:4px; font-weight:bold; font-size:9px; color:${col}; flex-shrink:0;">${label}</span>`;
      };

      window.showItemTooltip = function (e, item) {
          if (e && e.stopPropagation) e.stopPropagation();
          let tooltip = document.getElementById("game-tooltip");
          if (!tooltip || !item) return;

          let col = window.getTierColor ? window.getTierColor(item.statsRolled) : "#00d2ff";
          let starsStr = item.statsRolled === "UNIQUE" ? "UNIQUE ARTIFACT" : `${item.statsRolled || 0} STAR QUALITY`;
          let typeStr = (item.subType || item.type || "EQUIPMENT").toUpperCase();

          let iconSvg = (key) => typeof window.getUiIconSvg === "function" ? window.getUiIconSvg(key, 11) : "";

          let lines = [];
          if (item.atk) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("atk")} Attack:</span> <span class="tt-val">+${item.atk}</span></div>`);
          if (item.def) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("def")} Defense:</span> <span class="tt-val">+${item.def}</span></div>`);
          if (item.maxHp) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("maxHp")} Max HP:</span> <span class="tt-val">+${item.maxHp}</span></div>`);
          if (item.moveSpeed) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("moveSpeed")} Move Speed:</span> <span class="tt-val">+${item.moveSpeed}</span></div>`);
          if (item.critChance) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("critChance")} Crit Chance:</span> <span class="tt-val">+${(item.critChance * 100).toFixed(1)}%</span></div>`);
          if (item.critDamage) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("critDamage")} Crit Multi:</span> <span class="tt-val">+${(item.critDamage * 100).toFixed(0)}%</span></div>`);
          if (item.block) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("block")} Block Rate:</span> <span class="tt-val">+${(item.block * 100).toFixed(1)}%</span></div>`);
          if (item.parry) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("parry")} Parry Rate:</span> <span class="tt-val">+${(item.parry * 100).toFixed(1)}%</span></div>`);
          if (item.dropRate) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("dropRate")} Drop Rate:</span> <span class="tt-val">+${(item.dropRate * 100).toFixed(0)}%</span></div>`);
          if (item.goldMulti) lines.push(`<div class="tt-stat"><span class="tt-label">${iconSvg("goldMulti")} Gold Multi:</span> <span class="tt-val">+${(item.goldMulti * 100).toFixed(0)}%</span></div>`);

          let setHtml = item.setName ? `<div class="tt-set">SET: ${item.setName.toUpperCase()}</div>` : "";
          let descHtml = item.desc ? `<div class="tt-desc">${item.desc}</div>` : "";

          tooltip.innerHTML = `
            <div class="tt-header" style="color:${col}; border-bottom-color:${col};">${item.name}</div>
            <div class="tt-sub">${typeStr} • LV.${item.stageLevel || 1} • ${starsStr}</div>
            ${setHtml}
            <div class="tt-body">${lines.join("")}</div>
            ${descHtml}
          `;

          tooltip.style.display = "block";

          let clientX = e ? (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 100)) : 100;
          let clientY = e ? (e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 100)) : 100;

          let ttWidth = tooltip.offsetWidth || 200;
          let ttHeight = tooltip.offsetHeight || 130;
          let screenW = window.innerWidth;
          let screenH = window.innerHeight;

          let posX = clientX + 10;
          let posY = clientY + 10;

          if (posX + ttWidth > screenW - 10) posX = clientX - ttWidth - 10;
          if (posY + ttHeight > screenH - 10) posY = clientY - ttHeight - 10;

          posX = Math.max(10, posX);
          posY = Math.max(10, posY);

          tooltip.style.left = posX + "px";
          tooltip.style.top = posY + "px";
        };

      window.hideTooltip = function () {
        let tooltip = document.getElementById("game-tooltip");
        if (tooltip) tooltip.style.display = "none";
      };

      // Close tooltip when clicking outside item cards
      document.addEventListener("pointerdown", function (e) {
        let tooltip = document.getElementById("game-tooltip");
        if (tooltip && tooltip.style.display !== "none") {
          if (!e.target.closest(".stash-card") && !e.target.closest(".paperdoll-slot") && !e.target.closest("#game-tooltip")) {
            window.hideTooltip();
          }
        }
      });

      window.toggleProfileModal = function () {
        window.hideTooltip();
        let modal = document.getElementById("profile-modal");
        if (!modal) return;

        if (modal.style.display === "none" || modal.style.display === "") {
          modal.style.display = "flex";
          window.renderProfileModal();
        } else {
          modal.style.display = "none";
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
              let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : {};

              if (headerTitleEl) {
                headerTitleEl.innerText = isHub
                  ? "HERO PROFILE & VAULT"
                  : `TACTICAL OVERVIEW (FLOOR ${window.player.depth || 1})`;
              }

              // Render Attribute Matrix SP Allocator
              let sp = stats.sp || 0;
              if (spCountEl) spCountEl.innerText = `${sp} SP`;

              if (matrixGridEl) {
                let alloc = stats.spAllocations || { spStr: 0, spDex: 0, spInt: 0 };
                let canSpend1 = sp >= 1;
                let canSpend5 = sp >= 5;

                matrixGridEl.innerHTML = `
                  <div class="stat-line">
                    <span class="stat-label">STRENGTH (+10 HP, +2.5 ATK)</span>
                    <div class="sp-btn-group">
                      <span class="sp-badge">${alloc.spStr || 0}</span>
                      <button class="sp-btn" ${canSpend1 ? "" : "disabled"} onclick="window.allocateSP('Str', 1)">+1</button>
                      <button class="sp-btn" ${canSpend5 ? "" : "disabled"} onclick="window.allocateSP('Str', 5)">+5</button>
                    </div>
                  </div>
                  <div class="stat-line">
                    <span class="stat-label">DEXTERITY (+0.1% CRIT, +1 SPD)</span>
                    <div class="sp-btn-group">
                      <span class="sp-badge">${alloc.spDex || 0}</span>
                      <button class="sp-btn" ${canSpend1 ? "" : "disabled"} onclick="window.allocateSP('Dex', 1)">+1</button>
                      <button class="sp-btn" ${canSpend5 ? "" : "disabled"} onclick="window.allocateSP('Dex', 5)">+5</button>
                    </div>
                  </div>
                  <div class="stat-line">
                    <span class="stat-label">INTELLIGENCE (+1 DEF, BARRIER)</span>
                    <div class="sp-btn-group">
                      <span class="sp-badge">${alloc.spInt || 0}</span>
                      <button class="sp-btn" ${canSpend1 ? "" : "disabled"} onclick="window.allocateSP('Int', 1)">+1</button>
                      <button class="sp-btn" ${canSpend5 ? "" : "disabled"} onclick="window.allocateSP('Int', 5)">+5</button>
                    </div>
                  </div>
                `;
              }

              // 1. Render Character Stats (Clean whole numbers for flat stats)
                            let rawAtk = pStats.atk && pStats.atk.valueOf ? pStats.atk.valueOf() : Number(pStats.atk || window.player.atk);
                            let rawDef = pStats.def && pStats.def.valueOf ? pStats.def.valueOf() : Number(pStats.def || window.player.def);
                            let rawHp = pStats.maxHp && pStats.maxHp.valueOf ? pStats.maxHp.valueOf() : Number(pStats.maxHp || window.player.maxHp);

                            let atkVal = window.formatNumber ? window.formatNumber(Math.round(rawAtk)) : Math.round(rawAtk);
                            let defVal = window.formatNumber ? window.formatNumber(Math.round(rawDef)) : Math.round(rawDef);
                            let hpVal = window.formatNumber ? window.formatNumber(Math.round(rawHp)) : Math.round(rawHp);

                            let iconSvg = (key) => typeof window.getUiIconSvg === "function" ? window.getUiIconSvg(key, 12) : "";

                            statsListEl.innerHTML = `
                              <div class="stat-line"><span class="stat-label">${iconSvg("atk")} ATTACK</span><span class="stat-val">${atkVal}</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("def")} DEFENSE</span><span class="stat-val">${defVal}</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("maxHp")} MAX HP</span><span class="stat-val">${hpVal}</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("moveSpeed")} MOVE SPEED</span><span class="stat-val">${Number(pStats.moveSpeed || window.player.speed).toFixed(1)}</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("critChance")} CRIT CHANCE</span><span class="stat-val">${((pStats.critChance || 0.05) * 100).toFixed(1)}%</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("critDamage")} CRIT MULTI</span><span class="stat-val">${((pStats.critDamage || 1.5) * 100).toFixed(0)}%</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("block")} BLOCK RATE</span><span class="stat-val">${((pStats.block || 0) * 100).toFixed(1)}%</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("parry")} PARRY RATE</span><span class="stat-val">${((pStats.parry || 0) * 100).toFixed(1)}%</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("dropRate")} DROP RATE</span><span class="stat-val">${((pStats.drop || 1.0) * 100).toFixed(0)}%</span></div>
                              <div class="stat-line"><span class="stat-label">${iconSvg("goldMulti")} GOLD MULTI</span><span class="stat-val">${((pStats.gold || 1.0) * 100).toFixed(0)}%</span></div>
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
                              { key: "art3", label: "RELIC 3" }
                            ];

                            if (!window.equippedSlots) {
                              window.equippedSlots = {
                                weapon: null, subweapon: null, helmet: null, chest: null,
                                leggings: null, overall: null, boots: null, ring1: null,
                                ring2: null, art1: null, art2: null, art3: null
                              };
                            }

                            paperdollEl.innerHTML = slotKeys
                              .map((s) => {
                                let item = window.equippedSlots[s.key];
                                if (!item) {
                                  return `
                                    <div class="paperdoll-slot">
                                      <span class="slot-label">${s.label}</span>
                                      <span style="font-size:8.5px; color:#475569; font-style:italic;">[EMPTY SLOT]</span>
                                    </div>
                                  `;
                                }

                                let col = window.getTierColor ? window.getTierColor(item.statsRolled) : "#00d2ff";
                                let starsLabel = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled || 0} STAR`;
                                let iconHtml = window.getItemIconSvg(item, 28);
                                let isInsured = !!item.locked;

                                let insureBtn = `<button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[INSURED]" : "INSURE"}</button>`;

                                let actionHtml = isHub
                                  ? `
                                    ${insureBtn}
                                    <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                                  `
                                  : isInsured ? `<span style="font-size:8px; color:#2ecc71; font-family:monospace; font-weight:bold;">[INSURED]</span>` : `<span style="font-size:8px; color:#e74c3c; font-family:monospace; font-weight:bold;">[EQUIPPED]</span>`;

                                return `
                                  <div class="paperdoll-slot" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, window.equippedSlots['${s.key}'])">
                                    ${iconHtml}
                                    <div class="item-info">
                                      <span class="item-title" style="color:${col};">${item.name}</span>
                                      <span class="item-sub">LV.${item.stageLevel || 1} • ${starsLabel}</span>
                                    </div>
                                    <div class="item-actions">
                                      ${actionHtml}
                                    </div>
                                  </div>
                                `;
                              })
                              .join("");

                            // 3. Render Right Panel (Hub = Storage Vault, Dungeon = Carried Run Satchel)
                            let displayList = isHub ? (window.player.stash || []) : (window.player.bag || []);
                            let sectionHeader = isHub ? "STORAGE VAULT" : "CARRIED RUN SATCHEL";

                            let sectionHeaderEl = stashListEl.previousElementSibling;
                            if (sectionHeaderEl) {
                              sectionHeaderEl.innerHTML = `${sectionHeader} (<span id="profile-stash-count">${displayList.length}</span>)`;
                            }

                            if (displayList.length === 0) {
                              stashListEl.innerHTML = `<div style="font-size:8.5px; color:#64748b; font-style:italic; text-align:center; padding:15px;">${isHub ? "Storage vault is empty.<br>Extract loot from dungeon runs to store items here!" : "No items collected yet on this run.<br>Defeat monsters and open chests to find loot!"}</div>`;
                              return;
                            }

                            stashListEl.innerHTML = displayList
                              .map((item, idx) => {
                                let col = window.getTierColor ? window.getTierColor(item.statsRolled) : "#00d2ff";
                                let typeLabel = (item.subType || item.type || "ITEM").toUpperCase();
                                let starsLabel = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled || 0} STAR`;
                                let iconHtml = window.getItemIconSvg(item, 28);
                                let isInsured = !!item.locked;

                                let statPreview = [];
                                if (item.atk) statPreview.push(`ATK +${item.atk}`);
                                if (item.def) statPreview.push(`DEF +${item.def}`);
                                if (item.maxHp) statPreview.push(`HP +${item.maxHp}`);
                                let statStr = statPreview.length > 0 ? statPreview.join(" | ") : `${starsLabel}`;

                                let actionsHtml = isHub
                                  ? `
                                    <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[INSURED]" : "INSURE"}</button>
                                    <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromStash(${item.id})">EQUIP</button>
                                    <button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageFromStash(${item.id})">SALVAGE</button>
                                  `
                                  : `<span style="font-size:8px; color:#00d2ff; font-family:monospace; font-weight:bold;">[IN SATCHEL]</span>`;

                                return `
                                  <div class="stash-card" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, ${isHub ? `window.player.stash[${idx}]` : `window.player.bag[${idx}]`})">
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
            weapon: null, subweapon: null, helmet: null, chest: null,
            leggings: null, overall: null, boots: null, ring1: null,
            ring2: null, art1: null, art2: null, art3: null
          };
        }

        // Determine destination slot key
        let slotKey = item.type;

        if (item.type === "shield" || item.type === "dagger" || item.type === "tome" || item.type === "subweapon") {
          slotKey = "subweapon";
        } else if (item.type === "ring") {
          slotKey = !window.equippedSlots.ring1 ? "ring1" : "ring2";
        } else if (item.type === "artifact") {
          slotKey = !window.equippedSlots.art1 ? "art1" : !window.equippedSlots.art2 ? "art2" : !window.equippedSlots.art3 ? "art3" : "art1";
        } else if (item.type === "overall") {
          if (window.equippedSlots.chest) {
            stash.push(window.equippedSlots.chest);
            window.equippedSlots.chest = null;
          }
          if (window.equippedSlots.leggings) {
            stash.push(window.equippedSlots.leggings);
            window.equippedSlots.leggings = null;
          }
          slotKey = "overall";
        } else if (item.type === "chest" || item.type === "leggings") {
          if (window.equippedSlots.overall) {
            stash.push(window.equippedSlots.overall);
            window.equippedSlots.overall = null;
          }
          slotKey = item.type;
        }

        // Swap currently equipped item into stash
        let currentEquipped = window.equippedSlots[slotKey];
        window.equippedSlots[slotKey] = item;
        stash.splice(idx, 1);

        if (currentEquipped) {
          stash.push(currentEquipped);
        }

        if (typeof window.invalidatePlayerStats === "function") window.invalidatePlayerStats();
        let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : null;
        if (pStats) {
          let newMaxHp = pStats.maxHp && pStats.maxHp.valueOf ? pStats.maxHp.valueOf() : Number(pStats.maxHp || 100);
          window.player.maxHp = newMaxHp;
          window.player.hp = Math.min(window.player.hp, window.player.maxHp);
          window.player.atk = pStats.atk && pStats.atk.valueOf ? pStats.atk.valueOf() : Number(pStats.atk || 15);
          window.player.def = pStats.def && pStats.def.valueOf ? pStats.def.valueOf() : Number(pStats.def || 5);
        }

        if (window.SoundManager && typeof window.SoundManager.play === "function") {
          window.SoundManager.play("swing");
        }

        if (typeof window.saveGame === "function") window.saveGame();
        window.updateHUD();
        window.renderProfileModal();
      };

      window.unequipToStash = function (slotKey) {
        window.hideTooltip();
        if (!window.equippedSlots || !window.equippedSlots[slotKey]) return;

        let item = window.equippedSlots[slotKey];
        if (!window.player.stash) window.player.stash = [];

        window.player.stash.push(item);
        window.equippedSlots[slotKey] = null;

        if (typeof window.invalidatePlayerStats === "function") window.invalidatePlayerStats();
        let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : null;
        if (pStats) {
          let newMaxHp = pStats.maxHp && pStats.maxHp.valueOf ? pStats.maxHp.valueOf() : Number(pStats.maxHp || 100);
          window.player.maxHp = newMaxHp;
          window.player.hp = Math.min(window.player.hp, window.player.maxHp);
          window.player.atk = pStats.atk && pStats.atk.valueOf ? pStats.atk.valueOf() : Number(pStats.atk || 15);
          window.player.def = pStats.def && pStats.def.valueOf ? pStats.def.valueOf() : Number(pStats.def || 5);
        }

        if (window.SoundManager && typeof window.SoundManager.play === "function") {
          window.SoundManager.play("swing");
        }

        if (typeof window.saveGame === "function") window.saveGame();
        window.updateHUD();
        window.renderProfileModal();
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
              let scrapName = window.getScrapYieldName ? window.getScrapYieldName(rolledTier) : "Monster Soul";
              let yieldAmount = Math.floor(Math.random() * 3) + 1;

              if (!window.inventory) window.inventory = {};
              if (!window.inventory.ETC) window.inventory.ETC = {};
              window.inventory.ETC[scrapName] = (window.inventory.ETC[scrapName] || 0) + yieldAmount;

              if (window.spawnFloatingText) {
                window.spawnFloatingText(window.player.x, window.player.y - 15, `+${yieldAmount} ${scrapName}`, "#e74c3c");
              }

              if (window.SoundManager && typeof window.SoundManager.play === "function") {
                window.SoundManager.play("death");
              }

              if (typeof window.saveGame === "function") window.saveGame();
              window.updateHUD();
              window.renderProfileModal();
            };

            window.toggleInsurance = function (itemId) {
                    window.hideTooltip();

                    let allItems = [];
                    for (let k in window.equippedSlots) {
                      if (window.equippedSlots[k]) allItems.push(window.equippedSlots[k]);
                    }
                    if (window.player && window.player.stash) allItems.push(...window.player.stash);
                    if (window.player && window.player.bag) allItems.push(...window.player.bag);
                    if (window.inventory && window.inventory.EQUIP) {
                      window.inventory.EQUIP.forEach((i) => {
                        if (!allItems.includes(i)) allItems.push(i);
                      });
                    }

                    let targetItem = allItems.find((i) => i.id == itemId);
                    if (!targetItem) return;

                    let currentlyLocked = !!targetItem.locked;

                    if (currentlyLocked) {
                      targetItem.locked = false;
                      if (typeof window.pushHeaderToast === "function") {
                        window.pushHeaderToast("[UNINSURED] Item At Risk on Death!", "#e74c3c");
                      }
                    } else {
                      // Strictly enforce single-item insurance limit: un-insure all other items first
                      allItems.forEach((item) => {
                        if (item.id != itemId) {
                          item.locked = false;
                        }
                      });
                      targetItem.locked = true;
                      if (typeof window.pushHeaderToast === "function") {
                        window.pushHeaderToast(`[INSURED] Protected ${targetItem.name}!`, "#2ecc71");
                      }
                    }

                    if (typeof window.saveGame === "function") window.saveGame();
                    window.renderProfileModal();
                  };

    // --- SETTINGS MODAL & AUDIO HANDLERS ---
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
        window.updateHUD();
      } else {
        modal.style.display = "none";
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
    window.toggleLootBag = function () {
      let isHub = window.currentGameState === window.GAME_STATES.HUB;
      if (isHub) {
        window.toggleProfileModal();
        return;
      }

      let modal = document.getElementById("bag-modal");
      let listEl = document.getElementById("bag-items-list");
      let headerEl = modal ? modal.querySelector(".modal-header span") : null;
      if (!modal || !listEl) return;

      let displayList = window.player.bag || [];

      if (headerEl) {
        headerEl.innerText = "EXTRACTED LOOT SATCHEL";
      }

      if (modal.style.display === "none") {
                listEl.innerHTML =
                  displayList.length > 0
                    ? displayList
                        .map((item) => {
                          let col = window.getTierColor
                            ? window.getTierColor(item.statsRolled)
                            : "#2ecc71";
                          return `
                        <div style="background:#111; border:1px solid #333; border-left:3px solid ${col}; padding:8px 10px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
                          <span style="color:${col}; font-weight:bold;">${item.name}</span>
                          <span style="color:#aaa; font-family:monospace;">Lv.${item.stageLevel || 1}</span>
                        </div>
                      `;
                        })
                        .join("")
                    : `<div style="color:#7f8c8d; font-style:italic; padding:20px; text-align:center;">Satchel is empty. Open chests in the dungeon!</div>`;

                modal.style.display = "flex";
              } else {
                modal.style.display = "none";
              }
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

            let col = window.getTierColor ? window.getTierColor(item.statsRolled) : "#00d2ff";
            let iconHtml = window.getItemIconSvg ? window.getItemIconSvg(item, 26) : "";
            let starsStr = item.statsRolled === "UNIQUE" ? "UNIQUE" : `${item.statsRolled || 0} STAR`;
            let typeStr = (item.subType || item.type || "LOOT").toUpperCase();

            let toast = document.createElement("div");
            toast.className = "item-toast";
            toast.style.borderLeft = `3.5px solid ${col}`;

            toast.innerHTML = `
              ${iconHtml}
              <div class="toast-info">
                <div class="toast-title" style="color:${col};">${item.name}</div>
                <div class="toast-sub">${typeStr} • LV.${item.stageLevel || 1} • ${starsStr}</div>
              </div>
            `;

            container.appendChild(toast);

            if (window.SoundManager && typeof window.SoundManager.playLootDrop === "function") {
              window.SoundManager.playLootDrop(item.statsRolled);
            }

            setTimeout(() => {
              toast.classList.add("toast-fade-out");
              setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
              }, 300);
            }, 2800);
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
            toast.style.borderLeft = `3.5px solid ${color}`;
            toast.innerHTML = `<span style="color:#f1f5f9; font-weight:bold; font-size:10px;">${msg}</span>`;

            if (onClick) {
              toast.style.cursor = "pointer";
              toast.onclick = onClick;
            }

            container.appendChild(toast);

            setTimeout(() => {
              toast.classList.add("toast-fade-out");
              setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
              }, 300);
            }, 2800);
          };
        })();