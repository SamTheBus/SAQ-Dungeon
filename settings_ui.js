  // --- SETTINGS MODAL & AUDIO HANDLERS ---
  export function toggleEditHudMode() {
    if (!window.playerStats) return;
    window.playerStats.editHudMode = !window.playerStats.editHudMode;
    window.updateEditHudModeStyle();
    if (typeof window.pushHeaderToast === "function") {
      if (window.playerStats.editHudMode) {
        window.pushHeaderToast(
          "[HUD] Drag Mode Unlocked! Drag the potion button to position it.",
          "#ffd700",
        );
      } else {
        window.pushHeaderToast("[HUD] Layout Locked.", "#34d399");
      }
    }
    if (typeof window.saveGame === "function") window.saveGame();
  }

  export function updateEditHudModeStyle() {
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
      let overlay = flaskBtn.querySelector(".flask-drag-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "flask-drag-overlay";
        overlay.innerHTML = `
            <div class="drag-corner drag-corner-tl"></div>
            <div class="drag-corner drag-corner-tr"></div>
            <div class="drag-corner drag-corner-bl"></div>
            <div class="drag-corner drag-corner-br"></div>
            <svg class="drag-arrows-svg" viewBox="0 0 80 80">
              <path d="M40 6 L46 16 L34 16 Z" fill="#ffd700" />
              <path d="M40 74 L46 64 L34 64 Z" fill="#ffd700" />
              <path d="M6 40 L16 34 L16 46 Z" fill="#ffd700" />
              <path d="M74 40 L64 34 L64 46 Z" fill="#ffd700" />
            </svg>
          `;
        flaskBtn.appendChild(overlay);
      }

      if (isEditing) {
        flaskBtn.classList.add("edit-hud-active");
      } else {
        flaskBtn.classList.remove("edit-hud-active");
      }
    }
  }

  export function toggleSettingsModal() {
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
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  }

