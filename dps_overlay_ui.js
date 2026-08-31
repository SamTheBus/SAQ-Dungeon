const updateDpsOverlayStyle = function () {
    updateDpsOverlayPosition();
};

const updateDpsOverlayPosition = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer =
      document.getElementById("canvas-container") ||
      document.getElementById("game-container");
    if (!badge || !canvasContainer) return;

    if (!window.playerStats || !window.playerStats.showDpsOverlay) {
      badge.style.display = "none";
      return;
    }

    badge.style.display = "flex";

    let containerWidth = canvasContainer.clientWidth;
    let containerHeight = canvasContainer.clientHeight;
    let badgeWidth = badge.offsetWidth || 100;
    let badgeHeight = badge.offsetHeight || 32;

    let x = window.playerStats.dpsOverlayX;
    let y = window.playerStats.dpsOverlayY;

    if (x === null || y === null || x === undefined || y === undefined) {
      x = containerWidth - badgeWidth - 10;
      y = containerHeight - badgeHeight - 10;
      window.playerStats.dpsOverlayX = x;
      window.playerStats.dpsOverlayY = y;
    }

    x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
    y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

    badge.style.left = x + "px";
    badge.style.top = y + "px";
};

const initDpsOverlayDrag = function () {
    let badge = document.getElementById("dps-overlay-badge");
    let canvasContainer =
      document.getElementById("canvas-container") ||
      document.getElementById("game-container");
    if (!badge || !canvasContainer) return;

    let isDragging = false;
    let startX = 0,
      startY = 0;
    let initialLeft = 0,
      initialTop = 0;

    badge.addEventListener("pointerdown", function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = (window.playerStats && window.playerStats.dpsOverlayX) || 0;
      initialTop = (window.playerStats && window.playerStats.dpsOverlayY) || 0;
      badge.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });

    badge.addEventListener("pointermove", function (e) {
      if (!isDragging) return;
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      let x = initialLeft + dx;
      let y = initialTop + dy;

      let containerWidth = canvasContainer.clientWidth;
      let containerHeight = canvasContainer.clientHeight;
      let badgeWidth = badge.offsetWidth;
      let badgeHeight = badge.offsetHeight;

      x = Math.max(0, Math.min(containerWidth - badgeWidth, x));
      y = Math.max(0, Math.min(containerHeight - badgeHeight, y));

      if (window.playerStats) {
        window.playerStats.dpsOverlayX = x;
        window.playerStats.dpsOverlayY = y;
      }

      badge.style.left = x + "px";
      badge.style.top = y + "px";
      e.stopPropagation();
    });

    const stopDrag = function (e) {
      if (isDragging) {
        isDragging = false;
        badge.releasePointerCapture(e.pointerId);
        if (typeof window.saveGame === "function") window.saveGame();
        e.stopPropagation();
      }
    };

    badge.addEventListener("pointerup", stopDrag);
    badge.addEventListener("pointercancel", stopDrag);
};

  // Auto-init DPS overlay drag on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initDpsOverlayDrag();
      updateDpsOverlayStyle();
    });
  } else {
    initDpsOverlayDrag();
    updateDpsOverlayStyle();
  }

export {
  updateDpsOverlayStyle,
  updateDpsOverlayPosition,
  initDpsOverlayDrag,
};
