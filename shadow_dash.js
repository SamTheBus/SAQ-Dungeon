export const SHADOW_DASH_DISTANCE = 64;
export const SHADOW_DASH_FRAMES = 8;
export const SHADOW_DASH_STEP = SHADOW_DASH_DISTANCE / SHADOW_DASH_FRAMES;
export const SHADOW_DASH_COOLDOWN_FRAMES = 90;

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function daggerEquipped(subweapon = window.equippedSlots?.subweapon) {
  return Boolean(
    subweapon &&
      (subweapon.subType === "dagger" || subweapon.type === "dagger"),
  );
}

function getState() {
  window.__shadowDashState ??= {
    activeFrames: 0,
    cooldownFrames: 0,
    remainingDistance: 0,
    directionX: 0,
    directionY: 0,
  };
  return window.__shadowDashState;
}

export function resetShadowDash() {
  window.__shadowDashState = {
    activeFrames: 0,
    cooldownFrames: 0,
    remainingDistance: 0,
    directionX: 0,
    directionY: 0,
  };
  updateShadowDashHud();
}

export function resolveShadowDashDirection({
  player = window.player,
  joystick = window.joystick,
  cursorPointer = window.cursorPointer,
  camera = window.DungeonCamera,
} = {}) {
  let x = 0;
  let y = 0;

  if (joystick?.active && Math.hypot(finite(joystick.vx), finite(joystick.vy)) > 0.01) {
    x = finite(joystick.vx);
    y = finite(joystick.vy);
  } else if (
    player &&
    !player.targetReached &&
    Math.hypot(finite(player.targetX) - finite(player.x), finite(player.targetY) - finite(player.y)) > 2
  ) {
    x = finite(player.targetX) - finite(player.x);
    y = finite(player.targetY) - finite(player.y);
  } else if (player && cursorPointer?.hasPosition) {
    const zoom = Math.max(0.01, finite(camera?.zoom, 1));
    const aimX = finite(cursorPointer.screenX) / zoom + finite(camera?.x);
    const aimY = finite(cursorPointer.screenY) / zoom + finite(camera?.y);
    x = aimX - finite(player.x);
    y = aimY - finite(player.y);
  }

  const magnitude = Math.hypot(x, y);
  if (magnitude > 0.01) {
    return Object.freeze({ x: x / magnitude, y: y / magnitude, source: "directional" });
  }
  return Object.freeze({
    x: finite(player?.facing, 1) < 0 ? -1 : 1,
    y: 0,
    source: "facing_fallback",
  });
}

export function requestShadowDash(options = {}) {
  const player = options.player ?? window.player;
  const state = getState();
  const dungeonState = window.GAME_STATES?.DUNGEON;
  if (
    !player ||
    player.hp <= 0 ||
    window.currentGameState !== dungeonState ||
    !daggerEquipped(options.subweapon) ||
    state.activeFrames > 0 ||
    state.cooldownFrames > 0 ||
    (typeof window.isAnyMenuOpen === "function" && window.isAnyMenuOpen())
  ) {
    updateShadowDashHud();
    return Object.freeze({ applied: false, reason: "ineligible" });
  }

  const direction = options.direction ?? resolveShadowDashDirection({ player });
  const length = Math.hypot(finite(direction.x), finite(direction.y));
  if (length <= 0.01) return Object.freeze({ applied: false, reason: "no_direction" });

  state.activeFrames = SHADOW_DASH_FRAMES;
  state.cooldownFrames = SHADOW_DASH_COOLDOWN_FRAMES;
  state.remainingDistance = SHADOW_DASH_DISTANCE;
  state.directionX = finite(direction.x) / length;
  state.directionY = finite(direction.y) / length;
  window.spawnShadowDashVisual?.(player.x, player.y, state.directionX, state.directionY, "start");
  updateShadowDashHud();
  return Object.freeze({ applied: true, directionSource: direction.source || "provided" });
}

function maximalLegalFraction({ player, map, checkCollisionAt, dx, dy }) {
  const radius = finite(player.radius, 9);
  if (!checkCollisionAt(map, player.x + dx, player.y + dy, radius)) return 1;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 10; index++) {
    const middle = (low + high) / 2;
    if (checkCollisionAt(map, player.x + dx * middle, player.y + dy * middle, radius)) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return low;
}

export function advanceShadowDash({
  player = window.player,
  map,
  checkCollisionAt = window.checkCollisionAt,
} = {}) {
  const state = getState();
  const dungeonState = window.GAME_STATES?.DUNGEON;
  if (window.currentGameState !== dungeonState || !daggerEquipped()) {
    resetShadowDash();
    return Object.freeze({ consumedMovement: false, moved: 0, active: false });
  }

  if (state.cooldownFrames > 0) state.cooldownFrames--;
  if (!player || !map || typeof checkCollisionAt !== "function" || state.activeFrames <= 0) {
    updateShadowDashHud();
    return Object.freeze({ consumedMovement: false, moved: 0, active: false });
  }

  const requested = Math.min(SHADOW_DASH_STEP, state.remainingDistance);
  const dx = state.directionX * requested;
  const dy = state.directionY * requested;
  const fraction = maximalLegalFraction({ player, map, checkCollisionAt, dx, dy });
  const moved = requested * fraction;
  player.x += dx * fraction;
  player.y += dy * fraction;
  state.remainingDistance = Math.max(0, state.remainingDistance - moved);
  state.activeFrames--;
  player.isMoving = moved > 0;
  window.spawnShadowDashVisual?.(player.x, player.y, state.directionX, state.directionY, "trail");

  if (fraction < 0.999 || state.activeFrames <= 0 || state.remainingDistance <= 0.001) {
    state.activeFrames = 0;
    state.remainingDistance = 0;
    window.spawnShadowDashVisual?.(player.x, player.y, state.directionX, state.directionY, "end");
  }
  updateShadowDashHud();
  return Object.freeze({ consumedMovement: true, moved, active: state.activeFrames > 0 });
}

export function updateShadowDashHud() {
  const button = document.getElementById("hud-shadow-dash-button");
  if (!button) return;
  if (window.playerStats) {
    const hasSavedPosition =
      window.playerStats.shadowDashX !== null &&
      window.playerStats.shadowDashX !== undefined &&
      window.playerStats.shadowDashY !== null &&
      window.playerStats.shadowDashY !== undefined;
    const savedX = Number(window.playerStats.shadowDashX);
    const savedY = Number(window.playerStats.shadowDashY);
    if (hasSavedPosition && Number.isFinite(savedX) && Number.isFinite(savedY)) {
      button.style.left = `${savedX}px`;
      button.style.top = `${savedY}px`;
      button.style.right = "auto";
      button.style.bottom = "auto";
    }
  }
  const state = getState();
  const eligible =
    window.currentGameState === window.GAME_STATES?.DUNGEON && daggerEquipped();
  button.style.display = eligible ? "flex" : "none";
  button.classList.toggle("shadow-dash-cooldown", state.cooldownFrames > 0);
  button.disabled = !eligible || state.cooldownFrames > 0 || state.activeFrames > 0;
  const status = button.querySelector(".shadow-dash-status");
  if (status) {
    status.textContent = state.cooldownFrames > 0
      ? `${(state.cooldownFrames / 60).toFixed(1)}s`
      : "1/1";
  }
}

export function initShadowDashButtonDrag() {
  const button = document.getElementById("hud-shadow-dash-button");
  const container = document.getElementById("game-container");
  if (!button || !container || button.dataset.dragReady === "true") return;
  button.dataset.dragReady = "true";
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!window.playerStats?.editHudMode) return;
    const rect = button.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    dragging = true;
    moved = false;
    button.isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialLeft = rect.left - containerRect.left;
    initialTop = rect.top - containerRect.top;
    button.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  button.addEventListener("pointermove", (event) => {
    if (!dragging || !window.playerStats?.editHudMode) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    const x = Math.max(10, Math.min(container.clientWidth - button.offsetWidth - 10, initialLeft + dx));
    const y = Math.max(10, Math.min(container.clientHeight - button.offsetHeight - 10, initialTop + dy));
    window.playerStats.shadowDashX = x;
    window.playerStats.shadowDashY = y;
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.right = "auto";
    button.style.bottom = "auto";
    event.preventDefault();
    event.stopPropagation();
  });

  const stop = (event) => {
    if (!dragging) return;
    dragging = false;
    button.isDragging = false;
    button.suppressNextClick = moved;
    try { button.releasePointerCapture?.(event.pointerId); } catch (_) {}
    if (moved) window.saveGame?.();
    event.stopPropagation();
  };
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("click", (event) => {
    if (!button.suppressNextClick) return;
    button.suppressNextClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  updateShadowDashHud();
}
