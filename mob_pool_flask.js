  export function getMobPoolForDepth(depth) {
    // Sectors advance every 12 floors (after each Major Boss on Floor 12, 24, 36...)
    let sector = Math.floor((depth - 1) / 12);
    if (window.playerStats && window.playerStats.activeSpecialChallenge) {
      sector = window.playerStats.activeSpecialChallenge.primaryTarget.tier;
    }

    let pools = [
      // Sector 0 (Floors 1 - 12): Whispering Woods
      { tier: 0, types: ["slime", "sprout", "thorn_wyrm"] },
      // Sector 1 (Floors 13 - 24): Mountain Peaks & Alpine Mines
      {
        tier: 1,
        types: [
          "golem",
          "wyrmling",
          "gargoyle",
          "rust_nibbler",
          "gilded_scuttler",
          "mimic_shield",
        ],
      },
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
        types: [
          "void_orb",
          "void_crawler",
          "void_spectre",
          "void_wraith",
          "rift_drifter",
        ],
      },
      // Sector 5 (Floors 61 - 72): Temporal Sanctorum
      {
        tier: 5,
        types: [
          "clockwork_scarab",
          "star_weaver",
          "coin_elemental",
          "temporal_watcher",
          "clockwork_drone",
        ],
      },
      // Sector 6 (Floors 73 - 84): Cyberspace Nexus
      {
        tier: 6,
        types: [
          "neon_spider",
          "wireframe_orb",
          "cursed_blade",
          "animated_armor",
          "mimic_shield",
          "cyber_wraith",
        ],
      },
    ];

    // Infinite Anomaly Cycle for Floors 85+ (Sector 7+)
    let effectiveSector = sector >= 7 ? sector % 7 : sector;

    let selected = pools[effectiveSector];
    let chosenType =
      selected.types[Math.floor(Math.random() * selected.types.length)];
    return { tier: selected.tier, type: chosenType };
  }

  export function refillFlaskCharges(silent = false) {
    let p = window.playerStats;
    if (!p) return;
    p.flaskCharges = p.maxFlaskCharges || 1;
    p.flaskCooldownTimer = 0; // Clear the active cooldown timer on refill
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
  }

  export function useDungeonFlask() {
    let p = window.player;
    let stats = window.playerStats;
    if (!p || !stats || p.hp <= 0) return;
    if (stats.editHudMode) return;

    // Prevent accidental double-activation (1-second safety use lockout)
    if ((stats.flaskUseCooldownTimer || 0) > 0) {
      return;
    }

    if ((stats.flaskCharges || 0) <= 0) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Flask empty! Wait for it to recharge.",
          "#e74c3c",
        );
      }
      return;
    }

    stats.flaskCharges--;
    stats.flaskUseCooldownTimer = 60; // 1-second safety lockout (60 FPS)

    // Ensure the 45-second recharge timer is active if below maximum charges
    let maxCharges = stats.maxFlaskCharges || 1;
    if (
      stats.flaskCharges < maxCharges &&
      (stats.flaskCooldownTimer || 0) <= 0
    ) {
      stats.flaskCooldownTimer = 2700;
    }

    if (typeof window.progressMission === "function") {
      window.progressMission("flask", 1);
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
  }

  export function initFlaskButtonDrag() {
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
  }

  export function resetFlaskButtonPosition() {
    if (window.playerStats) {
      window.playerStats.flaskX = null;
      window.playerStats.flaskY = null;
      window.playerStats.shadowDashX = null;
      window.playerStats.shadowDashY = null;
    }

    let dashBtn = document.getElementById("hud-shadow-dash-button");
    if (dashBtn) {
      dashBtn.style.left = "auto";
      dashBtn.style.top = "auto";
      dashBtn.style.right = "34px";
      dashBtn.style.bottom = "34px";
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
        "[HUD] Action buttons reset to default positions!",
        "#34d399",
      );
    }

    if (typeof window.saveGame === "function") {
      window.saveGame();
    }
  }

