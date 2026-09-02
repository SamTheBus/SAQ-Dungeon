import { clearAllPeriodicEffects } from "./combat_effect_authority.js?v=1.002";
import { clearElementStates } from "./element_effect_authority.js?v=1.003";

function clearEncounterCombatStates(target) {
  clearAllPeriodicEffects(target);
  clearElementStates(target);
}

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
  for (const currentMob of encounterState.activeDungeonMobs || []) {
    if (!(nextMobs || []).includes(currentMob)) clearEncounterCombatStates(currentMob);
  }
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
  const removed = encounterState.activeDungeonMobs.splice(mobIndex, 1)[0];
  clearEncounterCombatStates(removed);
  return removed;
}

export function getPrimaryMob() {
  return encounterState.primaryMob;
}

export function setPrimaryMob(nextMob) {
  if (encounterState.primaryMob && encounterState.primaryMob !== nextMob) {
    clearEncounterCombatStates(encounterState.primaryMob);
  }
  encounterState.primaryMob = nextMob;
  return encounterState.primaryMob;
}

export function resetEncounterState() {
  setActiveDungeonMobs([]);
  setPrimaryMob(null);
  if (window.player) clearEncounterCombatStates(window.player);
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
