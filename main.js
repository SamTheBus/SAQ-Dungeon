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
                  Math.sin(time / 70) * 10 + Math.cos(time / 110) * 6;
                lights.push({
                  x: sx,
                  y: sy,
                  r: 180 + forgeFlicker,
                  innerColor: "rgba(255, 200, 120, 1.0)",
                  outerColor: "rgba(255, 80, 0, 0.60)",
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

              if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
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

        // Bioluminescent Mushrooms Light
        if (map.shrooms && !isHub) {
          let tileSize = map.tileSize;
          map.shrooms.forEach((s) => {
            let sx = s.x * tileSize + tileSize / 2;
            let sy = s.y * tileSize + tileSize / 2;
            if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
              lights.push({
                x: sx,
                y: sy,
                r: 85,
                innerColor: "rgba(180, 255, 255, 0.85)",
                outerColor: "rgba(0, 210, 255, 0.40)",
              });
            }
          });
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
            if (gp.x >= minCamX && gp.x <= maxCamX && gp.y >= minCamY && gp.y <= maxCamY) {
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
              if (orb.worldX >= minCamX && orb.worldX <= maxCamX && orb.worldY >= minCamY && orb.worldY <= maxCamY) {
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
          if (overlay.id === "summary-modal") {
            window.loadHub();
          } else if (overlay.id === "portal-modal") {
            // Require explicit user action (Descend or Extract)
            return;
          } else {
            overlay.style.display = "none";
          }
          if (typeof window.hideTooltip === "function") window.hideTooltip();
        }
      });
    });

    // Recalculate all existing inventory & equipped items to migrate stats
    if (typeof window.recalculateAllInventoryItems === "function") {
      window.recalculateAllInventoryItems();
    }

    // Start inside Adventurer's Hub
    window.loadHub();

    // Start 60 FPS Engine Loop
    requestAnimationFrame(gameLoop);
  });

  window.checkOrientation = function () {
    let overlay = document.getElementById("rotate-device-overlay");
    if (overlay) overlay.style.display = "none";
  };

  window.resizeCanvas = function () {
    if (!canvas) return;
    let w =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    let h =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    canvas.width = w;
    canvas.height = h;
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
    window.deathAnimationTimer = 0;

    // Clear active dungeon combat entities and gold particles
    window.activeDungeonMobs = [];
    window.mob = null;
    window.goldParticles = [];

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
    window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
    window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;

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
    window.player.depth = Math.max(1, Number(startFloor) || 1);
    window.player.bag = [];
    window.loadDungeonFloor(window.player.depth);
  };

  window.openHubPortalModal = function () {
    let checkpoints = window.playerStats.unlockedCheckpoints || [1];
    if (checkpoints.length <= 1) {
      window.enterDungeonRun(1);
      return;
    }

    if (typeof window.showCustomConfirm === "function") {
      let optionsHtml = checkpoints
        .map((startFloor) => {
          let sectorNum = Math.floor((startFloor - 1) / 12) + 1;
          return `<option value="${startFloor}">Sector ${sectorNum} - Floor ${startFloor}</option>`;
        })
        .join("");

      let selectHtml = `
          <div style="margin-top:10px; text-align:center;">
            <label style="color:#aaa; font-size:11px; display:block; margin-bottom:6px;">SELECT STARTING CHECKPOINT:</label>
            <select id="hub-checkpoint-select" style="background:#1e293b; color:#00d2ff; border:1px solid #334155; padding:8px 12px; border-radius:6px; font-weight:bold; font-family:monospace; font-size:12px; width:85%;">
              ${optionsHtml}
            </select>
          </div>
        `;

      window.showCustomConfirm(
        "DUNGEON PORTAL",
        `Choose your starting floor checkpoint:${selectHtml}`,
        "ENTER DUNGEON",
        "CANCEL",
        "#a855f7",
        function () {
          let selectEl = document.getElementById("hub-checkpoint-select");
          let chosenFloor = selectEl ? parseInt(selectEl.value, 10) : 1;
          window.enterDungeonRun(chosenFloor);
        },
      );
    } else {
      window.enterDungeonRun(checkpoints[checkpoints.length - 1]);
    }
  };

  window.spawnBossEncounter = function (tileX, tileY, bossTier = "major") {
    let map = window.activeDungeonMap;
    let tileSize = map ? map.tileSize : 32;

    let depth = window.player.depth || 1;
    let isMini = bossTier === "mini";

    let bossHp = isMini ? 350 + depth * 120 : 600 + depth * 250;
    let bossAtk = isMini ? 16 + depth * 5 : 24 + depth * 8;
    let bossName = isMini ? "Guard Warden" : "Dungeon Overlord";

    window.mob = {
      type: isMini ? "dungeon_miniboss" : "dungeon_boss",
      name: bossName,
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
    let isMajorBoss = depth % 12 === 0;

    if (isMajorBoss) {
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
    }

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
      isMajorBoss
        ? "CHECKPOINT UNLOCKED - EXTRACTION OPEN"
        : "EXTRACTION ZONE OPEN",
      "#00d2ff",
    );
  };

  window.activeDungeonMobs = [];

  window.loadDungeonFloor = function (depth) {
    if (!window.activeDungeonMap) return;

    let map;
    let isMiniBoss = depth % 12 === 4 || depth % 12 === 8;
    let isMajorBoss = depth % 12 === 0;

    if (isMiniBoss || isMajorBoss) {
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

    if (isMajorBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "major");
    } else if (isMiniBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "mini");
    } else if (map.mobSpawns) {
      let mobHpVal = Math.floor(40 + depth * 18 + Math.pow(depth, 1.3) * 5);
      let mobAtkVal = Math.floor(8 + depth * 3.5);

      map.mobSpawns.forEach((sp) => {
        let mobInfo = window.getMobPoolForDepth(depth);
        window.activeDungeonMobs.push({
          id: window.idCounter++,
          type: "mob",
          visualTier: mobInfo.tier,
          visualType: mobInfo.type,
          x: sp.x * tileSize,
          y: sp.y * tileSize,
          w: 24,
          h: 24,
          hp: BigNum.from(mobHpVal),
          maxHp: BigNum.from(mobHpVal),
          atk: mobAtkVal,
          flashTimer: 0,
          attackCooldown: 0,
          facing: -1,
        });
      });
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
      window.openHubPortalModal();
    } else if (stationType === window.TILE_TYPES.STATION_FORGE) {
      if (typeof window.toggleForgeModal === "function") {
        window.toggleForgeModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_ENCHANT) {
      if (typeof window.toggleEnchantmentModal === "function") {
        window.toggleEnchantmentModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_INN) {
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 15,
        "RECOVERY INN RESTORED HP",
        "#34d399",
      );
      window.player.hp = window.player.maxHp;
      window.updateHUD();
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

  window.executePortalDescend = function () {
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

  window.executePortalExtract = function () {
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

  window.triggerExtraction = function (success = true, isAbandon = false) {
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

      // Deposit pending run scraps into permanent inventory
      pendingScrapsList.forEach((s) => {
        if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop(s.name, s.count, true);
        }
      });
      window.player.pendingScraps = {};

      // Award +25% Extraction Bonus XP on total run earnings (base XP already gained in-run)
      let runXp = window.playerStats.runXp || 0;
      let bonusXp = Math.floor(runXp * 0.25);

      if (bonusXp > 0 && typeof window.gainXp === "function") {
        window.gainXp(bonusXp);
      }
      window.playerStats.runXp = 0;

      if (subEl)
        subEl.innerText = `Secured ${extractedLoot.length} items & ${pendingScrapsList.length} scrap yields to Vault! (+25% Extraction Bonus XP)`;

      // Save carried bag items permanently to Stash and sync inventory
      window.player.stash.push(...extractedLoot);
      window.player.bag = [];
      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    } else {
      window.player.pendingScraps = {};
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
      let hasWeapon =
        window.equippedSlots.weapon ||
        window.player.stash.some((i) => i.type === "weapon");
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
              <span style="color:#2ecc71; font-weight:bold;">[INSURED] ${i.name}</span>
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

  function checkCollisionAt(map, testX, testY, radius) {
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
  }

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

    let map = window.activeDungeonMap;
    if (!map || !map.grid) return;
    let tileSize = map.tileSize;

    let mode = window.playerStats
      ? window.playerStats.controlMode || "joystick"
      : "joystick";
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

      p.targetX = p.x;
      p.targetY = p.y;
      p.isMoving = moved;
    } else {
      p.isMoving = false;
    }

    if (p.isMoving) {
      p.walkTimer = (p.walkTimer || 0) + 0.18;
    } else {
      p.walkTimer = 0;
    }

    // Active Level-Up Aura Emitter tracking player position
    if (p.levelUpTimer && p.levelUpTimer > 0) {
      p.levelUpTimer--;

      const colors = ["#ffffff", "#ffd700", "#f1c40f", "#00d2ff", "#e84393"];
      if (window.ParticlePool) {
        for (let i = 0; i < 3; i++) {
          let spreadX = (Math.random() - 0.5) * 28;
          let startY = p.y - 8 + window.randFloat(5, 20);
          let upwardVel = -window.randFloat(4.0, 8.5);
          let sideVel = (Math.random() - 0.5) * 1.6;
          let particleLife = window.randInt(35, 60);

          window.particles.push(
            window.ParticlePool.get(
              p.x + spreadX,
              startY,
              sideVel,
              upwardVel,
              window.randFloat(1.8, 3.8),
              colors[Math.floor(Math.random() * colors.length)],
              1.0,
              particleLife,
              particleLife,
              -0.08,
              true,
            ),
          );
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
    window.updateDungeonCombat();
    window.updateGoldParticles();
    window.updateXpOrbs();
    window.updateGroundLoot();
    window.updateGroundMaterials();

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

        if (tile === window.TILE_TYPES.CHEST_SPAWN) {
          map.grid[currentTileY][currentTileX] = window.TILE_TYPES.FLOOR;
          let stageScale = window.player.depth;

          // 40% Chance Gold Eruption, 60% Chance Equipment Roll
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
            let effectiveStage = stageScale * 5;
            let pStats =
              typeof window.resolvePlayerStats === "function"
                ? window.resolvePlayerStats()
                : {};
            let rolledRarity = window.rollItemRarity(
              effectiveStage,
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
            let newItem = window.createItemObject(
              chosenType,
              rolledRarity,
              stageScale,
              0,
            );

            window.spawnGroundLoot(newItem, p.x, p.y - 10);
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
      if (ft.offsetY !== undefined) ft.offsetY -= 0.4;
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

    window.inventory.USE[name]--;
    if (window.inventory.USE[name] <= 0) delete window.inventory.USE[name];

    let p = window.playerStats;
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};
    let intVal = pStats.int || 5;
    let baseDurationSec = 300;
    let potDurationMult = 1.0 + (intVal - 5) * 0.005;
    let totalFrames = Math.round(baseDurationSec * 60 * potDurationMult);

    if (name.includes("Attack Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.atkPotionTimer = totalFrames;
      p.atkPotionStrength = str;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Atk for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#2ecc71",
      );
    } else if (name.includes("Vitality Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.hpPotionTimer = totalFrames;
      p.hpPotionStrength = str;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Max HP for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#e74c3c",
      );
    } else if (name.includes("Armored Elixir")) {
      let str = name.includes("Supernal")
        ? 0.35
        : name.includes("Greater")
          ? 0.2
          : 0.1;
      p.defPotionTimer = totalFrames;
      p.defPotionStrength = str;
      window.pushHeaderToast(
        `Consumed ${name}! (+${Math.round(str * 100)}% Def for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#3498db",
      );
    } else if (name.includes("Haste Elixir")) {
      let str = name.includes("Supernal")
        ? 3
        : name.includes("Greater")
          ? 2
          : 1;
      p.hastePotionTimer = totalFrames;
      p.hastePotionStrength = str;
      window.pushHeaderToast(
        `Consumed ${name}! (+Speed for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#f1c40f",
      );
    } else if (name.includes("Double XP Elixir")) {
      p.xpPotionTimer = totalFrames;
      p.xpPotionStrength = 1.0;
      window.pushHeaderToast(
        `Consumed Double XP Elixir! (+100% XP for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#a855f7",
      );
    } else if (name.includes("Double Drop Elixir")) {
      p.dropPotionTimer = totalFrames;
      p.dropPotionStrength = 1.0;
      window.pushHeaderToast(
        `Consumed Double Drop Elixir! (+100% Drop Rate for ${Math.round(baseDurationSec * potDurationMult)}s)`,
        "#22c55e",
      );
    } else if (name.includes("Drop Quality Elixir")) {
      p.qlyPotionTimer = totalFrames;
      p.qlyPotionStrength = 0.5;
      window.pushHeaderToast(
        `Consumed Drop Quality Elixir! (+50% Drop Quality for ${Math.round(baseDurationSec * potDurationMult)}s)`,
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
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : { atk: BigNum.from(15) };
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

        if (dx < -1) {
          m.facing = -1;
        } else if (dx > 1) {
          m.facing = 1;
        }

        // Soft Entity Body-Blocking (Prevents walking through mobs with elastic push-back)
        let mobRadius = (m.w || 24) * 0.45;
        let pRadius = p.radius || 9;
        let minDist = pRadius + mobRadius;

        if (dist < minDist) {
          let overlap = minDist - dist;
          let nx = dist > 0 ? dx / dist : 1;
          let ny = dist > 0 ? dy / dist : 0;
          let pushX = nx * overlap * 0.65;
          let pushY = ny * overlap * 0.65;

          let map = window.activeDungeonMap;
          if (map && map.grid) {
            if (!checkCollisionAt(map, p.x + pushX, p.y, pRadius)) {
              p.x += pushX;
            }
            if (!checkCollisionAt(map, p.x, p.y + pushY, pRadius)) {
              p.y += pushY;
            }
          } else {
            p.x += pushX;
            p.y += pushY;
          }
          p.targetX = p.x;
          p.targetY = p.y;
        }

        // Persistent Aggro & Pursuit Movement
        if (dist < 220 || m.hasTakenDamage) {
          m.isAggroed = true;
        }

        if (m.isAggroed && dist < 800 && dist > 14) {
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

                  let mobCenterX = m.x + m.w / 2;
                  let mobCenterY = m.y + m.h / 2;

                  // Face the target enemy being attacked!
                  let dxToMob = mobCenterX - p.x;
                  if (dxToMob < -0.1) p.facing = -1;
                  else if (dxToMob > 0.1) p.facing = 1;

                  let isCrit = Math.random() < (pStats.critChance || 0.05);
                  let critMult = isCrit ? pStats.critDamage || 1.5 : 1.0;
                  let pAtk = BigNum.from(pStats.atk || p.atk).mul(critMult);

                  m.hp = m.hp.sub(pAtk);
                  m.hasTakenDamage = true;
                  m.flashTimer = 6;

          if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
            window.RenderEngine.spawnDamageEffect(
              mobCenterX,
              mobCenterY,
              pAtk,
              "slash",
              isCrit,
            );
          }

          // Dagger Offhand Multi-Strike & Bleed DoT Triggers
          if (pStats.subType === "dagger") {
            if (pStats.offhandChance && Math.random() < pStats.offhandChance) {
              let offhandHit = BigNum.from(pStats.atk || 15).mul(
                pStats.offhandDmg || 0.45,
              );
              m.hp = m.hp.sub(offhandHit);
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
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
              m.hp = m.hp.sub(bleedTick);
              m.flashTimer = 6;
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
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

          if (
            window.SoundManager &&
            typeof window.SoundManager.playHitImpact === "function"
          ) {
            window.SoundManager.playHitImpact(isCrit);
          }
        }

        // Check death state after any potential hit (main slash, dagger offhand, or tome spell)
        if (m.hp.lte(0)) {
          let mobCenterX = m.x + m.w / 2;
          let mobCenterY = m.y + m.h / 2;

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

          // 5% Chance Mob Equipment Drop
          if (Math.random() < 0.05) {
            let stageScale = window.player.depth || 1;
            let pStats =
              typeof window.resolvePlayerStats === "function"
                ? window.resolvePlayerStats()
                : {};
            let rolledRarity = window.rollItemRarity(
              stageScale * 5,
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

      if (bm.recoilX) {
        bm.recoilX *= 0.65;
        if (Math.abs(bm.recoilX) < 0.2) bm.recoilX = 0;
      }
      if (bm.recoilY) {
        bm.recoilY *= 0.65;
        if (Math.abs(bm.recoilY) < 0.2) bm.recoilY = 0;
      }

      let dx = p.x - (bm.x + bm.w / 2);
      let dy = p.y - (bm.y + bm.h / 2);
      let dist = Math.hypot(dx, dy);

      if (dx < -1) {
        bm.facing = -1;
      } else if (dx > 1) {
        bm.facing = 1;
      }

      // Soft Boss Body-Blocking (Prevents walking through large boss hitboxes)
      let bossRadius = (bm.w || 48) * 0.48;
      let pRadius = p.radius || 9;
      let bossMinDist = pRadius + bossRadius;

      if (dist < bossMinDist) {
        let overlap = bossMinDist - dist;
        let nx = dist > 0 ? dx / dist : 1;
        let ny = dist > 0 ? dy / dist : 0;
        let pushX = nx * overlap * 0.7;
        let pushY = ny * overlap * 0.7;

        let map = window.activeDungeonMap;
        if (map && map.grid) {
          if (!checkCollisionAt(map, p.x + pushX, p.y, pRadius)) {
            p.x += pushX;
          }
          if (!checkCollisionAt(map, p.x, p.y + pushY, pRadius)) {
            p.y += pushY;
          }
        } else {
          p.x += pushX;
          p.y += pushY;
        }
        p.targetX = p.x;
        p.targetY = p.y;
      }

      if (dist < 48 && p.attackTimer >= 20) {
              p.attackTimer = 0;

              let bossCenterX = bm.x + bm.w / 2;
              // Face the boss being attacked!
              let dxToBoss = bossCenterX - p.x;
              if (dxToBoss < -0.1) p.facing = -1;
              else if (dxToBoss > 0.1) p.facing = 1;

              let isCrit = Math.random() < (pStats.critChance || 0.05);
              let critMult = isCrit ? pStats.critDamage || 1.5 : 1.0;
              let pAtk = BigNum.from(pStats.atk || p.atk).mul(critMult);

              bm.hp = bm.hp.sub(pAtk);
              bm.hasTakenDamage = true;
              bm.flashTimer = 6;

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
                      window.SoundManager.playHitImpact(isCrit);
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
                        if (
                          window.RenderEngine &&
                          window.RenderEngine.spawnDamageEffect
                        ) {
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
                        bm.hp = bm.hp.sub(bleedTick);
                        bm.flashTimer = 6;
                        if (
                          window.RenderEngine &&
                          window.RenderEngine.spawnDamageEffect
                        ) {
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

                    if (bm.hp.lte(0)) {
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

          // Boss Material Payload
          let bossCenterX = bm.x + bm.w / 2;
          let bossCenterY = bm.y + bm.h / 2;
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

          // Standard On-Stage Boss Equipment Drop (Normal Quality Roll)
          let stageScale = depth;
          let pStats =
            typeof window.resolvePlayerStats === "function"
              ? window.resolvePlayerStats()
              : {};
          let rolledRarity = window.rollItemRarity(
            stageScale * 5,
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
                if (p.hp <= 0) window.triggerExtraction(false, false);
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
                if (p.hp <= 0) window.triggerExtraction(false, false);
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
          if (p.hp <= 0) window.triggerExtraction(false, false);
        }
      }

      // Update Boss Projectiles and Test Player Hitbox
      for (let i = window.projectiles.length - 1; i >= 0; i--) {
        let proj = window.projectiles[i];
        proj.life--;
        proj.x += proj.vx;
        proj.y += proj.vy;

        let projDist = Math.hypot(p.x - proj.x, p.y - proj.y);
        if (projDist < proj.r + (p.radius || 9)) {
          window.damagePlayer(proj.damage, null);
          window.projectiles.splice(i, 1);
          if (p.hp <= 0) window.triggerExtraction(false, false);
          continue;
        }

        if (proj.life <= 0) {
          window.projectiles.splice(i, 1);
        }
      }
    }
  };

  // --- RENDER ENGINE ---
    function render() {
      if (!ctx || !canvas) return;

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
              if (mapInst.grid[r][c] === window.TILE_TYPES.CHEST_SPAWN) {
                let isExplored = isHub || (mapInst.exploredGrid && mapInst.exploredGrid[r] && mapInst.exploredGrid[r][c]);
                if (!isExplored) continue; // Hide chest from rendering if in unexplored Fog of War!

                let px = c * tSize;
                let py = r * tSize;
                depthQueue.push({
                  yBase: py + 20,
                  draw: () => {
                    if (window.drawDungeonStructureTile) {
                      window.drawDungeonStructureTile(
                        ctx,
                        window.TILE_TYPES.CHEST_SPAWN,
                        px,
                        py,
                        tSize,
                      );
                    }
                  },
                });
              }
            }
          }
        }

    // B3. Ground Material Pickups (Fog-of-War Culled)
        if (window.groundMaterials && window.groundMaterials.length > 0) {
          let time = Date.now();
          window.groundMaterials.forEach((gm) => {
            let tileC = Math.floor(gm.x / tSize);
            let tileR = Math.floor(gm.y / tSize);
            let isExplored = isHub || (mapInst && mapInst.exploredGrid && mapInst.exploredGrid[tileR] && mapInst.exploredGrid[tileR][tileC]);
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
            let isExplored = isHub || (mapInst && mapInst.exploredGrid && mapInst.exploredGrid[tileR] && mapInst.exploredGrid[tileR][tileC]);
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

            // 2. Radial Floor Glow Aura
            if (!isEco) {
              let auraPulse = Math.sin(time / 130) * 1.5;
              let floorGrad = ctx.createRadialGradient(
                gl.x,
                gl.y + 2,
                1,
                gl.x,
                gl.y + 2,
                14 + auraPulse,
              );
              floorGrad.addColorStop(0, color);
              floorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = floorGrad;
              ctx.beginPath();
              ctx.arc(gl.x, gl.y + 2, 14 + auraPulse, 0, Math.PI * 2);
              ctx.fill();
            }

            // 3. Floating Equipment Symbol
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

    // C. Active Dungeon Mobs (Fog-of-War Culled)
        if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
          window.activeDungeonMobs.forEach((m) => {
            let tileC = Math.floor((m.x + (m.w || 24) / 2) / tSize);
            let tileR = Math.floor((m.y + (m.h || 24) / 2) / tSize);
            let isExplored = isHub || (mapInst && mapInst.exploredGrid && mapInst.exploredGrid[tileR] && mapInst.exploredGrid[tileR][tileC]);
            if (!isExplored) return; // Hide mob if in unexplored Fog of War!

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

    // D. Boss Warden
    if (window.mob) {
      let bm = window.mob;
      depthQueue.push({
        yBase: bm.y + (bm.h || 48),
        draw: () => {
          if (bm.state === "telegraphing" && bm.activeAbility) {
            ctx.save();
            let progress = 1.0 - bm.telegraphTimer / bm.maxTelegraphTimer;
            let pulseAlpha = 0.2 + Math.sin(Date.now() / 60) * 0.15;

            if (bm.activeAbility === "slam") {
              ctx.fillStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
              ctx.strokeStyle = "#e74c3c";
              ctx.lineWidth = 2.5;

              ctx.beginPath();
              ctx.arc(bm.targetX, bm.targetY, 64, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(bm.targetX, bm.targetY, 64 * progress, 0, Math.PI * 2);
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            } else if (bm.activeAbility === "charge") {
              let bossCx = bm.x + bm.w / 2;
              let bossCy = bm.y + bm.h / 2;

              ctx.strokeStyle = `rgba(231, 76, 60, ${0.4 + pulseAlpha})`;
              ctx.lineWidth = 16;
              ctx.lineCap = "round";

              ctx.beginPath();
              ctx.moveTo(bossCx, bossCy);
              ctx.lineTo(bm.targetX, bm.targetY);
              ctx.stroke();

              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 3;
              ctx.stroke();
            } else if (bm.activeAbility === "nova") {
              let bossCx = bm.x + bm.w / 2;
              let bossCy = bm.y + bm.h / 2;

              ctx.strokeStyle = `rgba(230, 126, 34, ${0.4 + pulseAlpha})`;
              ctx.lineWidth = 2;

              for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                ctx.beginPath();
                ctx.moveTo(bossCx, bossCy);
                ctx.lineTo(
                  bossCx + Math.cos(angle) * 120,
                  bossCy + Math.sin(angle) * 120,
                );
                ctx.stroke();
              }
            }
            ctx.restore();
          }

          window.drawSingleMob(ctx, window.mob);
          drawMobOverheadBar(ctx, window.mob);
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

    // Floating Effects, Projectiles & Popups
    if (window.combatVisuals) {
      window.combatVisuals.render(ctx);
    }

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
    if (typeof window.renderMinimap === "function") {
      window.renderMinimap(ctx, canvas);
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

      let pw = 220;
      let ph = 36;
      let px = pScreenX - pw / 2;
      let py = pScreenY - ph / 2;

      ctx.save();
      ctx.fillStyle = "rgba(10, 14, 23, 0.95)";
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 2;

      ctx.fillRect(px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);

      // Glowing indicator corner accents
      ctx.fillStyle = "#00d2ff";
      ctx.fillRect(px - 2, py - 2, 6, 6);
      ctx.fillRect(px + pw - 4, py - 2, 6, 6);
      ctx.fillRect(px - 2, py + ph - 4, 6, 6);
      ctx.fillRect(px + pw - 4, py + ph - 4, 6, 6);

      ctx.font = "bold 10.5px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`[ TAP TO ENTER: ${st.label} ]`, pScreenX, pScreenY);
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
    if (goldText)
      goldText.innerText = window.formatNumber
        ? window.formatNumber(stats.coins || 0)
        : stats.coins || 0;
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
      let item =
        (window.inventory &&
          window.inventory.EQUIP &&
          window.inventory.EQUIP.find((i) => i.id === itemId)) ||
        (window.frozenItemDb && window.frozenItemDb[itemId]);

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
    ["EQUIP", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`bag-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderBagModalContent();
  };

  window.switchStashTab = function (tabKey) {
    window.activeStashTab = tabKey;
    ["EQUIP", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`stash-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderProfileModal();
  };

  window.activeProfileMobileTab = "stats";

  window.switchProfileTab = function (tabKey) {
    window.activeProfileMobileTab = tabKey;
    const tabs = ["stats", "gear", "satchel"];
    tabs.forEach((t) => {
      let btn = document.getElementById(`profile-tab-${t}`);
      let sec = document.getElementById(`profile-sec-${t}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
      if (sec) sec.classList.toggle("active-mobile-section", t === tabKey);
    });
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
        ? "HERO PROFILE & VAULT"
        : `TACTICAL OVERVIEW (FLOOR ${window.player.depth || 1})`;
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
                  <button class="sp-btn sp-btn-sub" ${sub1Disabled} onclick="window.stageSP('${attrKey}', -1)">-1</button>
                  <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onclick="window.stageSP('${attrKey}', 1)">+1</button>
                  <button class="sp-btn sp-btn-add" ${canSpend5 ? "" : "disabled"} onclick="window.stageSP('${attrKey}', 5)">+5</button>
                  <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onclick="window.stageSP('${attrKey}', ${curSP})">MAX</button>
                </div>
              </div>
            `;
      };

      let confirmBarHtml = hasStaged
        ? `
                <div style="display:flex; gap:6px; margin-top:6px;">
                  <button class="action-btn" style="flex:1; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#34d399;" onclick="window.confirmSP()">CONFIRM ATTRIBUTES</button>
                  <button class="action-btn" style="flex:0.4; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #ef4444 0%, #b91c1c 100%); border-color:#f87171;" onclick="window.resetDraftSP()">RESET</button>
                </div>
              `
        : "";

      matrixGridEl.innerHTML = `
                  ${renderAttrCard("STRENGTH", "+10 Max HP, +2.5 Attack Power", "Str", committedAlloc.spStr || 0, draftAlloc.spStr || 0, "str")}
                  ${renderAttrCard("DEXTERITY", "+0.1% Crit, +0.5% Crit Multi, +1 Move Speed", "Dex", committedAlloc.spDex || 0, draftAlloc.spDex || 0, "dex")}
                  ${renderAttrCard("INTELLIGENCE", "+1 Defense, +0.5% Potion Power, Arcane Barrier", "Int", committedAlloc.spInt || 0, draftAlloc.spInt || 0, "int")}
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
        if (!item) {
          return `
                                    <div class="paperdoll-slot">
                                      <span class="slot-label">${s.label}</span>
                                      <span style="font-size:8.5px; color:#475569; font-style:italic;">[EMPTY SLOT]</span>
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

        let insureBtn = `<button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[INSURED]" : "INSURE"}</button>`;

        let actionHtml = isHub
          ? `
                                    ${insureBtn}
                                    <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                                  `
          : isInsured
            ? `<span style="font-size:8px; color:#2ecc71; font-family:monospace; font-weight:bold;">[INSURED]</span>`
            : `<span style="font-size:8px; color:#e74c3c; font-family:monospace; font-weight:bold;">[EQUIPPED]</span>`;

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

    // 3. Render Right Panel (Vault & Satchel with Categories)
    let stashTab = window.activeStashTab || "EQUIP";
    let sectionHeaderEl = document.getElementById("profile-satchel-title");

    if (stashTab === "EQUIP") {
      let displayList = isHub
        ? window.inventory.EQUIP || []
        : window.player.bag || [];
      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `${isHub ? "EQUIPMENT VAULT" : "CARRIED GEAR"} (<span id="profile-stash-count">${displayList.length}</span>)`;
      }

      if (displayList.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:8.5px; color:#64748b; font-style:italic; text-align:center; padding:15px;">${isHub ? "Storage vault is empty.<br>Extract loot from dungeon runs to store items here!" : "No items collected yet on this run.<br>Defeat monsters and open chests to find loot!"}</div>`;
        return;
      }

      stashListEl.innerHTML = displayList
        .map((item, idx) => {
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
            statPreview.length > 0 ? statPreview.join(" | ") : `${starsLabel}`;

          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderProfileModal();">SALVAGE</button>`;

          let actionsHtml = isHub
            ? `
                    <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[INSURED]" : "INSURE"}</button>
                    <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromStash(${item.id})">EQUIP</button>
                    ${salvageBtn}
                  `
            : `
                    <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
                    ${salvageBtn}
                  `;

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
    } else if (stashTab === "USE") {
      let useObj = window.inventory.USE || {};
      let keys = Object.keys(useObj).filter((k) => useObj[k] > 0);

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `CONSUMABLES (<span id="profile-stash-count">${keys.length}</span>)`;
      }

      if (keys.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:8.5px; color:#64748b; font-style:italic; text-align:center; padding:15px;">No consumable elixirs, scrolls, or sacks owned.<br>Craft elixirs at the Alchemy Shop or earn sacks from Daily Quests!</div>`;
        return;
      }

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
        stashListEl.innerHTML = `<div style="font-size:8.5px; color:#64748b; font-style:italic; text-align:center; padding:15px;">No materials or Monster Souls owned.<br>Slay monsters in dungeon runs to harvest souls and scraps!</div>`;
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
    window.hideTooltip();
    if (!window.equippedSlots || !window.equippedSlots[slotKey]) return;

    let item = window.equippedSlots[slotKey];
    delete item.isEquippedSlot;
    if (!window.player.stash) window.player.stash = [];

    window.player.stash.push(item);
    window.equippedSlots[slotKey] = null;

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("swing");
    }

    if (typeof window.saveGame === "function") window.saveGame();
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

  window.toggleInsurance = function (itemId) {
    window.hideTooltip();

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
        window.pushHeaderToast(
          `[INSURED] Protected ${targetItem.name}!`,
          "#2ecc71",
        );
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
      if (typeof window.updateLightingStyle === "function")
        window.updateLightingStyle();
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
      headerEl.innerHTML = `CARRIED LOOT SATCHEL <span style="font-size:10px; color:#94a3b8; font-family:monospace; margin-left:6px;">(${displayList.length} / ${maxBag} Gear)</span>`;
    }

    if (tab === "EQUIP") {
      if (displayList.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">Satchel has no carried gear.<br>Defeat monsters and open chests in the dungeon to gather equipment!</div>`;
        return;
      }
      listEl.innerHTML = displayList
        .map((item, idx) => {
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

          let insureBtn = `<button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id}); window.renderBagModalContent();">${isInsured ? "[INSURED]" : "INSURE"}</button>`;
          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderBagModalContent();">SALVAGE</button>`;

          return `
              <div class="stash-card" style="border-left: 3.5px solid ${col}; cursor: pointer; padding: 6px 10px; background: rgba(15, 23, 42, 0.85); border-radius: 6px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;" onclick="window.showItemTooltip(event, window.player.bag[${idx}])">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                  ${iconHtml}
                  <div class="item-info" style="display: flex; flex-direction: column; min-width: 0;">
                    <span class="item-title" style="color:${col}; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                    <span class="item-sub" style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">${typeLabel} • LV.${item.stageLevel || 1}</span>
                    <span class="item-sub" style="font-size: 8.5px; color: #2ecc71; font-family: monospace; font-weight: bold;">${statStr}</span>
                  </div>
                </div>
                <div class="item-actions" style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                  ${insureBtn}
                  <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
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
      if (typeof window.hideTooltip === "function") window.hideTooltip();
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

    let col = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";
    let iconHtml = window.getItemIconSvg ? window.getItemIconSvg(item, 26) : "";
    let starsStr =
      item.statsRolled === "UNIQUE"
        ? "UNIQUE"
        : `${item.statsRolled || 0} STAR`;
    let typeStr = (item.subType || item.type || "LOOT").toUpperCase();

    let toast = document.createElement("div");
        toast.className = "item-toast";
        toast.style.borderColor = col;

        toast.innerHTML = `
          ${iconHtml}
          <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
            <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${col}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
              <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
              </svg>
              <span>+1 LOOT</span>
              ${item.wasAutoEquipped ? `<span style="background:#2ecc71; color:#05030a; font-weight:900; font-size:7px; padding:1px 3px; border-radius:2px; font-family:monospace; margin-left:5px; letter-spacing:0.5px; line-height:1;">AUTO-EQUIPPED</span>` : ""}
            </div>
            <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
              <span style="color:${col}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
              <span style="color:${col}; font-family:monospace; font-weight:800; flex-shrink:0;">x1</span>
            </div>
          </div>
        `;

    container.appendChild(toast);

    if (
      window.SoundManager &&
      typeof window.SoundManager.playLootDrop === "function"
    ) {
      window.SoundManager.playLootDrop(item.statsRolled);
    }

    setTimeout(() => {
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

    let desc =
      (window.etcDex && window.etcDex[name]) ||
      (window.useDex && window.useDex[name] && window.useDex[name].desc) ||
      "Inventory Item";

    let iconHtml = "";
    if (window.getEtcIconHtml && window.etcDex && window.etcDex[name]) {
      iconHtml = window.getEtcIconHtml(name, 26);
    } else if (window.getUseIconHtml && window.useDex && window.useDex[name]) {
      iconHtml = window.getUseIconHtml(name, 26);
    }

    let toast = document.createElement("div");
        toast.className = "item-toast";
        toast.style.borderColor = color;

        toast.innerHTML = `
          ${iconHtml}
          <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
            <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
              <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
              </svg>
              <span>+${qty} LOOT</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
              <span style="color:${color}; font-family:monospace; font-weight:800; flex-shrink:0;">x${qty}</span>
            </div>
          </div>
        `;

    container.appendChild(toast);

    setTimeout(() => {
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

window.getMobPoolForDepth = function (depth) {
  // Sectors advance every 12 floors (after each Major Boss on Floor 12, 24, 36...)
  let sector = Math.floor((depth - 1) / 12);

  let pools = [
    // Sector 1 (Floors 1 - 12): Whispering Woods
    { tier: 0, types: ["slime", "sprout", "thorn_wyrm"] },
    // Sector 2 (Floors 13 - 24): Mountain Peaks & Alpine Mines
    { tier: 1, types: ["golem", "wyrmling", "gargoyle", "rust_nibbler"] },
    // Sector 3 (Floors 25 - 36): Inferno Depths & Smeltery
    {
      tier: 2,
      types: ["magma_elemental", "lava_serpent", "hell_bat", "slag_slime"],
    },
    // Sector 4 (Floors 37 - 48): Fungal Swamp & Ruins
    {
      tier: 3,
      types: ["swamp_basilisk", "toxic_fly", "marsh_ghost", "corroded_golem"],
    },
    // Sector 5+ (Floors 49+): Void Singularity & Cyber Space
    {
      tier: 4,
      types: [
        "void_orb",
        "void_crawler",
        "void_spectre",
        "neon_spider",
        "wireframe_orb",
        "cursed_blade",
      ],
    },
  ];

  let selected = pools[Math.min(sector, pools.length - 1)];
  let chosenType =
    selected.types[Math.floor(Math.random() * selected.types.length)];
  return { tier: selected.tier, type: chosenType };
};
