const FIXED_SIMULATION_STEP_MS = 1000 / 60;
const MAX_FRAME_ELAPSED_MS = 250;
const MAX_CATCH_UP_UPDATES = 5;

export const startGameLoop = function (
  canvas,
  ctx,
  getIsPointerHolding,
  checkCollisionAt,
) {
  let previousFrameTime = null;
  let simulationAccumulator = FIXED_SIMULATION_STEP_MS;

  function gameLoop(frameTime) {
    let currentFrameTime = Number.isFinite(frameTime)
      ? frameTime
      : performance.now();

    if (previousFrameTime === null) {
      previousFrameTime = currentFrameTime;
    }

    let elapsed = currentFrameTime - previousFrameTime;
    if (!Number.isFinite(elapsed) || elapsed < 0) {
      elapsed = 0;
    } else {
      previousFrameTime = currentFrameTime;
    }
    elapsed = Math.min(elapsed, MAX_FRAME_ELAPSED_MS);
    simulationAccumulator += elapsed;

    let updateCount = 0;
    while (
      simulationAccumulator >= FIXED_SIMULATION_STEP_MS &&
      updateCount < MAX_CATCH_UP_UPDATES
    ) {
      window.updateGame(canvas, getIsPointerHolding(), checkCollisionAt);
      simulationAccumulator -= FIXED_SIMULATION_STEP_MS;
      updateCount++;
    }

    if (simulationAccumulator >= FIXED_SIMULATION_STEP_MS) {
      simulationAccumulator = 0;
    }

    window.renderGame(ctx, canvas);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
};
