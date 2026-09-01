import { getActiveDungeonMap } from "./dungeon_map.js?v=1.007";
import { rebuildMobSpatialIndex } from "./mob_spatial_index.js?v=1.002";
import {
  advanceDungeonMobLiveness,
  prepareDungeonMobLiveness,
} from "./mob_liveness.js?v=1.005";

  export const updateDungeonCombat = function (checkCollisionAt) {
    let p = window.player;
    if (!p || p.hp <= 0) return;
    if (window.currentGameState !== window.GAME_STATES.DUNGEON) return;
    let map = getActiveDungeonMap();

    prepareDungeonMobLiveness(window.activeDungeonMobs || [], window.mob, map);

    p.nullifierDisrupted = false; // Reset on each combat frame

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    pStats = window.updateCombatHazards(p, map, pStats);
    rebuildMobSpatialIndex(window.activeDungeonMobs || []);
    window.updateCombatPeriodic(p, pStats);
    let closestTarget = window.updateCombatTargeting(p, pStats, map);
    window.resolvePlayerAttack(p, pStats, closestTarget);
    window.updateStandardMobCombat(p, pStats, map);
    window.updateBossCombat(p, pStats, map);
    window.updateActiveProjectiles(p, map, checkCollisionAt);
    advanceDungeonMobLiveness(window.activeDungeonMobs || [], window.mob, map);
  };
