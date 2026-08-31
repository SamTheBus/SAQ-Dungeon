const runtimeState = {
  currentGameState: null,
  isGamePaused: false,
};

export function getCurrentGameState() {
  return runtimeState.currentGameState;
}

export function setCurrentGameState(nextState) {
  runtimeState.currentGameState = nextState;
  return runtimeState.currentGameState;
}

export function getIsGamePaused() {
  return runtimeState.isGamePaused;
}

export function setGamePaused(nextPaused) {
  runtimeState.isGamePaused = nextPaused;
  return runtimeState.isGamePaused;
}

// Temporary compatibility bridge for legacy readers and any remaining writers.
Object.defineProperty(window, "currentGameState", {
  configurable: true,
  enumerable: true,
  get: getCurrentGameState,
  set: setCurrentGameState,
});

Object.defineProperty(window, "isGamePaused", {
  configurable: true,
  enumerable: true,
  get: getIsGamePaused,
  set: setGamePaused,
});
