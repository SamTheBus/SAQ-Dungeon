import { getActiveDungeonMap } from "./dungeon_map.js?v=1.007";
import {
  findNearestIndexedMobInRadius,
} from "./mob_spatial_index.js?v=1.002";
import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";
import {
  canPlayerReachCombatTarget,
  getCombatTargetCenter,
  getCombatTargetRadius,
  getIndexedCombatReachQueryRadius,
} from "./combat_reach.js?v=1.001";

const MOB_SPATIAL_TARGETING_THRESHOLD = 32;

  export const updateCombatTargeting = function (p, pStats = {}, mapOverride) {
    if (window.hero.slashTimer > 0) {
      window.hero.slashTimer--;
      window.hero.slashFrame = true;
    } else {
      window.hero.slashFrame = false;
    }

    let closestObject = null;
    let closestType = null;
    let closestX = 0;
    let closestY = 0;
    let closestRadius = 0;
    let closestDist = Infinity;

    const mapInst = mapOverride || getActiveDungeonMap();
    const subweapon = window.equippedSlots?.subweapon;
    const canReachMob = (mob) =>
      isPlayerTargetableMob(mob) &&
      canPlayerReachCombatTarget({
        player: p,
        target: mob,
        playerStats: pStats,
        subweapon,
        map: mapInst,
        collisionCheck: window.checkCollisionAt,
      });

    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      if (
        window.activeDungeonMobs.length >= MOB_SPATIAL_TARGETING_THRESHOLD
      ) {
        const mob = findNearestIndexedMobInRadius(
          p.x,
          p.y,
          getIndexedCombatReachQueryRadius(p, pStats, subweapon),
          canReachMob,
        );
        if (mob) {
          const center = getCombatTargetCenter(mob);
          closestObject = mob;
          closestType = "mob";
          closestX = center.x;
          closestY = center.y;
          closestRadius = getCombatTargetRadius(mob);
          closestDist = Math.hypot(p.x - closestX, p.y - closestY);
        }
      } else {
        for (let index = 0; index < window.activeDungeonMobs.length; index++) {
          const mob = window.activeDungeonMobs[index];
          if (!canReachMob(mob)) continue;

          const center = getCombatTargetCenter(mob);
          const targetX = center.x;
          const targetY = center.y;
          const distance = Math.hypot(p.x - targetX, p.y - targetY);
          if (distance < closestDist) {
            closestObject = mob;
            closestType = "mob";
            closestX = targetX;
            closestY = targetY;
            closestRadius = getCombatTargetRadius(mob);
            closestDist = distance;
          }
        }
      }
    }

    if (window.cavernInteractives && window.cavernInteractives.length > 0) {
      for (let index = 0; index < window.cavernInteractives.length; index++) {
        const item = window.cavernInteractives[index];
        if (item.hp !== undefined && item.hp > 0) {
          const distance = Math.hypot(p.x - item.x, p.y - item.y);
          if (distance < 38 && distance < closestDist) {
            closestObject = item;
            closestType = "cavern";
            closestX = item.x;
            closestY = item.y;
            closestRadius = item.w / 2;
            closestDist = distance;
          }
        }
      }
    }

    if (mapInst && mapInst.breakables && mapInst.breakables.length > 0) {
      let tSize = mapInst.tileSize || 32;
      for (let index = 0; index < mapInst.breakables.length; index++) {
        const b = mapInst.breakables[index];
        if (b.flashTimer > 0) b.flashTimer--;
        if (b.hp > 0) {
          const targetX = b.x * tSize + tSize / 2;
          const targetY = b.y * tSize + tSize / 2;
          const distance = Math.hypot(p.x - targetX, p.y - targetY);
          if (distance < 25 && distance < closestDist) {
            closestObject = b;
            closestType = "breakable";
            closestX = targetX;
            closestY = targetY;
            closestRadius = 12;
            closestDist = distance;
          }
        }
      }
    }

    return closestObject
      ? {
          obj: closestObject,
          type: closestType,
          x: closestX,
          y: closestY,
          radius: closestRadius,
        }
      : null;
  };
