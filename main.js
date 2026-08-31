import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import { addActiveDungeonMob } from "./encounter_state.js?v=1.004";

/* ==========================================================================
   PRIMARY PURPOSE: Clean Top-Down Extraction Crawler Core Engine & Game Loop.
   Supports Adventurer's Hub state, Station Interactions, and Extraction Runs.
   ========================================================================= */

  let canvas, ctx;
  let isPointerHolding = false;

  window.activeStationPrompt = null;
  window.floatingTexts = [];
  window.xpOrbs = [];


  // Safe global state fallback initializer
  if (
    window.playerStats &&
    window.playerStats.robbingMarcusActive === undefined
  ) {
    window.playerStats.robbingMarcusActive = false;
  }
  if (window.playerStats) {
    if (window.playerStats.deflectionFatigueTimer === undefined) {
      window.playerStats.deflectionFatigueTimer = 0;
    }
    if (window.playerStats.counterCooldownTimer === undefined) {
      window.playerStats.counterCooldownTimer = 0;
    }
    if (!window.playerStats.monsterCards) {
      window.playerStats.monsterCards = {};
    }
    Object.keys(window.MONSTER_CARDS_DATA).forEach((cKey) => {
      if (window.playerStats.monsterCards[cKey] === undefined) {
        window.playerStats.monsterCards[cKey] = 0;
      }
    });
  }

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

  // --- ENGINE INITIALIZATION ---
  window.addEventListener("load", function () {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    window.canvas = canvas;
    window.ctx = ctx;

    window.resizeCanvas();
    window.addEventListener("resize", window.resizeCanvas);

    // Auto-scan global namespace for other anonymous AudioContext instances
    if (window.AudioContext || window.webkitAudioContext) {
      for (let key in window) {
        try {
          let val = window[key];
          if (
            val &&
            val instanceof (window.AudioContext || window.webkitAudioContext)
          ) {
            if (val.state === "suspended") {
              val.resume().catch(() => {});
            }
          }
        } catch (e) {}
      }
    }

    const unlockAudio = () => {
      if (
        window.SoundManager &&
        typeof window.SoundManager.unlockMobileAudio === "function"
      ) {
        window.SoundManager.unlockMobileAudio();
      }
      canvas.removeEventListener("pointerdown", unlockAudio);
      canvas.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };

    canvas.addEventListener("pointerdown", unlockAudio, { passive: true });
    canvas.addEventListener("touchstart", unlockAudio, { passive: true });
    document.addEventListener("click", unlockAudio, { passive: true });

    // Check and trigger daily/weekly resets on initial boot
    if (typeof window.checkAndResetMissions === "function") {
      window.checkAndResetMissions();
    }

    // Enforce standardized profile tab order
    window.reorderProfileTabs = function () {
      let tabBar = document.querySelector(".profile-tab-bar");
      if (!tabBar) return;

      if (!document.getElementById("profile-tab-relics")) {
        let btn = document.createElement("button");
        btn.id = "profile-tab-relics";
        btn.className = "profile-tab-btn";
        btn.innerText = "RELIQUARY";
        btn.onclick = () => window.switchProfileTab("relics");
        tabBar.appendChild(btn);
      }

      const orderedIds = [
        "profile-tab-stats",
        "profile-tab-gear",
        "profile-tab-satchel",
        "profile-tab-relics",
        "profile-tab-album",
        "profile-tab-achievements",
      ];

      orderedIds.forEach((id) => {
        let btn = document.getElementById(id);
        if (btn) {
          tabBar.appendChild(btn);
        }
      });
    };

    window.reorderProfileTabs();

    // Dynamically inject the RELIQUARY content panel if not present in index.html
    let profileCard = document.querySelector(".profile-card");
    if (profileCard && !document.getElementById("profile-sec-relics")) {
      let sec = document.createElement("div");
      sec.id = "profile-sec-relics";
      sec.className = "profile-section";
      sec.innerHTML = `<div id="reliquary-content-panel" style="width:100%; height:100%; box-sizing:border-box;"></div>`;
      profileCard.appendChild(sec);
    }

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
        window.player.targetReached = false;
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

    // Intercept and wrap window.salvageItem dynamically to support any script loading order and update the UI
    let _salvageItemRef = window.salvageItem;
    Object.defineProperty(window, "salvageItem", {
      get() {
        return _salvageItemRef;
      },
      set(newVal) {
        if (newVal && !newVal.__wrapped) {
          const original = newVal;
          _salvageItemRef = function (itemId) {
            const originalShowCustomConfirm = window.showCustomConfirm;
            window.showCustomConfirm = function (
              title,
              body,
              yesText,
              noText,
              color,
              yesCallback,
              noCallback,
            ) {
              const wrappedYesCallback = function () {
                // Pre-find in bag and remove it to ensure the item is destroyed when salvaging in dungeon
                if (window.player && window.player.bag) {
                  let bagIdx = window.player.bag.findIndex(
                    (i) => i.id == itemId,
                  );
                  if (bagIdx !== -1) {
                    window.player.bag.splice(bagIdx, 1);
                  }
                }
                if (typeof yesCallback === "function") yesCallback();
                setTimeout(() => {
                  if (typeof window.renderReliquaryTab === "function")
                    window.renderReliquaryTab();
                  if (typeof window.renderProfileModal === "function")
                    window.renderProfileModal();
                  if (typeof window.renderBagModalContent === "function")
                    window.renderBagModalContent();
                }, 80);
              };
              if (originalShowCustomConfirm) {
                originalShowCustomConfirm(
                  title,
                  body,
                  yesText,
                  noText,
                  color,
                  wrappedYesCallback,
                  noCallback,
                );
              }
            };
            original(itemId);
            window.showCustomConfirm = originalShowCustomConfirm;
          };
          _salvageItemRef.__wrapped = true;
        } else {
          _salvageItemRef = newVal;
        }
      },
      configurable: true,
    });
    if (_salvageItemRef) {
      window.salvageItem = _salvageItemRef;
    }

    // Initialize Draggable Flask Button Engine
    if (typeof window.initFlaskButtonDrag === "function") {
      window.initFlaskButtonDrag();
    }

    // Start inside Adventurer's Hub
    window.loadHub();

    // Start 60 FPS Engine Loop
    window.startGameLoop(canvas, ctx, () => isPointerHolding, checkCollisionAt);
  });

  window.checkOrientation = function () {
    let overlay = document.getElementById("rotate-device-overlay");
    if (overlay) overlay.style.display = "none";
  };

  window.drawPortraitBossHealthBar = function (ctx, m, canvas, bossIndex = 0) {
    if (!m || !m.hp || !m.maxHp) return;

    ctx.save();

    let barW = Math.min(canvas.width - 40, 280);
    let barH = 10;
    let barX = (canvas.width - barW) / 2;
    // Adjusted to 160 to prevent overlap, stacked down dynamically
    let barY = 160 + bossIndex * 42;

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
    let overlays = document.querySelectorAll(".modal-overlay");
    for (let i = 0; i < overlays.length; i++) {
      let el = overlays[i];
      if (el && el.style.display !== "none" && el.style.display !== "") {
        return true;
      }
    }
    return false;
  };

  // --- PHYSICS & LOGIC UPDATE ---
  window.spawnCalamitySpecter = function () {
    if (window.calamitySpecterActive) return;
    window.calamitySpecterActive = true;

    let p = window.player;
    let angle = Math.random() * Math.PI * 2;
    let spawnDist = 320;
    let sx = p.x + Math.cos(angle) * spawnDist;
    let sy = p.y + Math.sin(angle) * spawnDist;

    addActiveDungeonMob({
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
        "[!] THE CALAMITY SPECTER HAS AWAKENED! ESCAPE!",
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
            window.playerStats.runXp = BigNum.from(
              window.playerStats.runXp || 0,
            ).add(orb.value);
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

  // --- MYSTICAL EXCHANGE TRADE REGISTRY & HANDLER ---
  if (!window.MYSTICAL_TRADES) window.MYSTICAL_TRADES = [];
  if (!window.MYSTICAL_TRADES.some((t) => t.id === "card_sack_trade")) {
    window.MYSTICAL_TRADES.push({
      id: "card_sack_trade",
      name: "Monster Card Sack",
      costName: "Luminous Soul",
      costQty: 5,
      yieldName: "Monster Card Sack",
      yieldQty: 1,
      desc: "Exchange 5 Luminous Souls for 1 Monster Card Sack.",
    });
  }

  window.executeMysticalTrade = function (tradeId) {
    if (tradeId === "card_sack_trade" || tradeId === "card_sack") {
      let souls =
        (window.inventory &&
          window.inventory.ETC &&
          window.inventory.ETC["Luminous Soul"]) ||
        0;
      if (souls < 5) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast("[X] Requires 5x Luminous Souls!", "#e74c3c");
        }
        return false;
      }
      window.inventory.ETC["Luminous Soul"] -= 5;
      if (window.inventory.ETC["Luminous Soul"] <= 0) {
        delete window.inventory.ETC["Luminous Soul"];
      }
      window.addUseDrop("Monster Card Sack", 1, false);
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("✦ Acquired 1x Monster Card Sack!", "#34d399");
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("revive");
      }
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.saveGame === "function") window.saveGame();
      return true;
    }
    return false;
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

    if (
      name === "Luminous Soul" &&
      typeof window.progressMission === "function"
    ) {
      window.progressMission("luminous", qty);
    }

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
        let peakRunStage = Math.max(
          p.lifetimePeakStage || 1,
          p.stage || 1,
          p.maxFloorCleared || 1,
        );
        let stageScale = peakRunStage;
        let rolledRarity = window.rollItemRarity(
          peakRunStage,
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
    } else if (name === "Monster Card Sack") {
      // Reusable weighted random card roller helper
      window.rollRandomMonsterCard = function () {
        const SET_WEIGHTS = {
          "Whispering Woods": 35,
          "Mountain Peaks": 25,
          "Inferno Depths": 18,
          "Fungal Swamp": 12,
          "Void Singularity": 6,
          "Temporal Sanctorum": 3,
          "Cyberspace Nexus": 1,
          "Cosmic Wardens": 0.5,
        };

        let cardsBySet = {};
        for (let key in window.MONSTER_CARDS_DATA) {
          let set = window.MONSTER_CARDS_DATA[key].set;
          if (!cardsBySet[set]) cardsBySet[set] = [];
          cardsBySet[set].push(key);
        }

        let totalWeight = 0;
        let activeSets = [];
        for (let setName in cardsBySet) {
          let weight = SET_WEIGHTS[setName] || 10;
          totalWeight += weight;
          activeSets.push({ name: setName, weight: weight });
        }

        let roll = Math.random() * totalWeight;
        let cumulative = 0;
        let chosenSetName = "Whispering Woods";
        for (let s = 0; s < activeSets.length; s++) {
          cumulative += activeSets[s].weight;
          if (roll <= cumulative) {
            chosenSetName = activeSets[s].name;
            break;
          }
        }
        let pool = cardsBySet[chosenSetName];
        return pool[Math.floor(Math.random() * pool.length)];
      };

      let rolledCards = [];
      for (let i = 0; i < 5; i++) {
        let rolledKey = window.rollRandomMonsterCard();
        rolledCards.push(rolledKey);

        // Add directly to persistent Bestiary collection (handles max limit auto-salvage)
        window.addMonsterCard(rolledKey, 1);
      }

      if (
        window.SoundManager &&
        typeof window.SoundManager.playCardPackOpen === "function"
      ) {
        window.SoundManager.playCardPackOpen();
      }

      if (typeof window.openMonsterCardSackAnimation === "function") {
        window.openMonsterCardSackAnimation(rolledCards);
      }
    } else if (name === "Astral Singularity Cache") {
      let peakRunStage = Math.max(
        p.lifetimePeakStage || 1,
        p.stage || 1,
        p.maxFloorCleared || 1,
      );
      let stageScale = peakRunStage;
      let newItem = null;
      let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];

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
      let peakRunStage = Math.max(
        p.lifetimePeakStage || 1,
        p.stage || 1,
        p.maxFloorCleared || 1,
      );
      let stageScale = peakRunStage;
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
      let peakRunStage = Math.max(
        p.lifetimePeakStage || 1,
        p.stage || 1,
        p.maxFloorCleared || 1,
      );
      let itemLevel = window.getFloorItemLevel
        ? window.getFloorItemLevel(peakRunStage)
        : Math.floor(peakRunStage / 4) + 1;
      let stageScale = itemLevel;

      let rolledRarity = window.rollItemRarity(
        peakRunStage,
        p.baseQuality || 1.0,
        false,
      );
      let types = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "overall",
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

      // Sack Variant Logic (Renown & Materials)
      let isWeeklySack =
        name === "Weekly Reward Sack" || name === "Clan Weekly Sack";
      if (isWeeklySack) {
        p.renown = (p.renown || 0) + 3;
        window.addEtcDrop("Ancient Core", 1, true);
      } else if (name === "Daily Reward Sack" || name === "Clan Reward Sack") {
        p.renown = (p.renown || 0) + 1;
      }

      // Grant random Basic Elixirs on opening sacks
      const basicElixirs = [
        "Basic Attack Elixir",
        "Basic Vitality Elixir",
        "Basic Armored Elixir",
        "Basic Haste Elixir",
      ];
      let numElixirs = isWeeklySack
        ? window.randInt(2, 3)
        : window.randInt(1, 2);
      let chosenElixirs = [];
      for (let eIdx = 0; eIdx < numElixirs; eIdx++) {
        let chosenElixir =
          basicElixirs[Math.floor(Math.random() * basicElixirs.length)];
        window.addUseDrop(chosenElixir, 1, false);
        chosenElixirs.push(chosenElixir);
      }

      if (window.currentGameState === window.GAME_STATES.HUB) {
        if (!window.inventory.EQUIP) window.inventory.EQUIP = [];
        window.inventory.EQUIP.push(newItem);
      } else {
        if (!window.player.bag) window.player.bag = [];
        window.player.bag.push(newItem);
      }

      if (typeof window.openTactileSackCrateAnimation === "function") {
        window.openTactileSackCrateAnimation(name, newItem, chosenElixirs);
      } else {
        // Fallback
        window.pushHeaderToast(
          `Opened ${name}! Found: ${newItem.name} (+${numElixirs} Elixir)`,
          "#f1c40f",
        );
        if (typeof window.pushToast === "function") window.pushToast(newItem);
      }
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderProfileModal === "function")
      window.renderProfileModal();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.destroyBreakableProp = function (prop, worldX, worldY) {
    if (!prop) return;

    // Reset Spreading Fatigue speed penalty on breakable shatter
    window.fatiguePenalty = 0;

    if (typeof window.progressMission === "function") {
      window.progressMission("pottery", 1);
    }

    let map = getActiveDungeonMap();
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

  // --- CONSTELLATION VIEWPORT AUTO-FIT & BOUNDS CENTERER ---
  window.fitConstellationTreeToViewport = function () {
    if (window.SkillTreeManager) {
      window.SkillTreeManager.centerOnStarter();
    }
  };

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
      if (typeof window.stopBestiaryAnimLoop === "function") {
        window.stopBestiaryAnimLoop();
      }
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

const {
  checkOrientation,
  drawPortraitBossHealthBar,
  resizeCanvas,
  isAnyMenuOpen,
  spawnCalamitySpecter,
  spawnHomingXp,
  updateXpOrbs,
  addDungeonRunScrap,
  spawnGroundMaterial,
  updateGroundMaterials,
  executeMysticalTrade,
  addEtcDrop,
  addUseDrop,
  useConsumableItem,
  destroyBreakableProp,
  fitConstellationTreeToViewport,
  openSkillTree,
  toggleMasteryModal,
  toggleMute,
  updateMasterVolume,
  updateSfxVolume,
  updateBgmVolume,
} = window;

export {
  checkOrientation,
  drawPortraitBossHealthBar,
  resizeCanvas,
  checkCollisionAt,
  isAnyMenuOpen,
  spawnCalamitySpecter,
  spawnHomingXp,
  updateXpOrbs,
  addDungeonRunScrap,
  spawnGroundMaterial,
  updateGroundMaterials,
  executeMysticalTrade,
  addEtcDrop,
  addUseDrop,
  useConsumableItem,
  destroyBreakableProp,
  fitConstellationTreeToViewport,
  openSkillTree,
  toggleMasteryModal,
  toggleMute,
  updateMasterVolume,
  updateSfxVolume,
  updateBgmVolume,
};





