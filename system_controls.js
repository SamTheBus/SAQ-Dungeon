const toggleEcoMode = function () {
    window.playerStats.ecoMode = !window.playerStats.ecoMode;
    window.updateEcoModeStyle();
    window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
};

const updateEcoModeStyle = function () {
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

const toggleLighting = function () {
    if (!window.playerStats) return;
    window.playerStats.enableLighting = !window.playerStats.enableLighting;
    window.updateLightingStyle();
    if (typeof window.saveGame === "function") window.saveGame();
};

const updateLightingStyle = function () {
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

const forceReloadCacheBust = function () {
    let baseUrl = window.location.href.split("?")[0];
    window.location.href = `${baseUrl}?v=${Date.now()}`;
};

const requestWipeSaveData = function () {
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

export {
  toggleEcoMode,
  updateEcoModeStyle,
  toggleLighting,
  updateLightingStyle,
  forceReloadCacheBust,
  requestWipeSaveData,
};
