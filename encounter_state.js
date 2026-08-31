const encounterState = {
  activeDungeonMobs: Object.prototype.hasOwnProperty.call(
    window,
    "activeDungeonMobs",
  )
    ? window.activeDungeonMobs
    : [],
  primaryMob: Object.prototype.hasOwnProperty.call(window, "mob")
    ? window.mob
    : null,
};

export function getActiveDungeonMobs() {
  return encounterState.activeDungeonMobs;
}

export function setActiveDungeonMobs(nextMobs) {
  encounterState.activeDungeonMobs = nextMobs;
  return encounterState.activeDungeonMobs;
}

export function addActiveDungeonMob(nextMob) {
  encounterState.activeDungeonMobs.push(nextMob);
  return nextMob;
}

export function removeActiveDungeonMobById(mobId) {
  const mobIndex = encounterState.activeDungeonMobs.findIndex(
    (activeMob) => activeMob.id === mobId,
  );
  if (mobIndex === -1) return null;
  return encounterState.activeDungeonMobs.splice(mobIndex, 1)[0];
}

export function getPrimaryMob() {
  return encounterState.primaryMob;
}

export function setPrimaryMob(nextMob) {
  encounterState.primaryMob = nextMob;
  return encounterState.primaryMob;
}

export function resetEncounterState() {
  setActiveDungeonMobs([]);
  setPrimaryMob(null);
}

// Temporary compatibility bridges for legacy readers and writers.
Object.defineProperty(window, "activeDungeonMobs", {
  configurable: true,
  enumerable: true,
  get: getActiveDungeonMobs,
  set: setActiveDungeonMobs,
});

Object.defineProperty(window, "mob", {
  configurable: true,
  enumerable: true,
  get: getPrimaryMob,
  set: setPrimaryMob,
});
