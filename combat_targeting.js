import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import {
  findNearestIndexedMobInRadius,
} from "./mob_spatial_index.js?v=1.002";
import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";

const MOB_SPATIAL_TARGETING_THRESHOLD = 32;

  export const updateCombatTargeting = function (p) {
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

    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      if (
        window.activeDungeonMobs.length >= MOB_SPATIAL_TARGETING_THRESHOLD
      ) {
        const mob = findNearestIndexedMobInRadius(
          p.x,
          p.y,
          38,
          isPlayerTargetableMob,
        );
        if (mob) {
          closestObject = mob;
          closestType = "mob";
          closestX = mob.x + mob.w / 2;
          closestY = mob.y + mob.h / 2;
          closestRadius = (mob.w || 24) * 0.45;
          closestDist = Math.hypot(p.x - closestX, p.y - closestY);
        }
      } else {
        for (let index = 0; index < window.activeDungeonMobs.length; index++) {
          const mob = window.activeDungeonMobs[index];
          if (!isPlayerTargetableMob(mob)) continue;

          const targetX = mob.x + mob.w / 2;
          const targetY = mob.y + mob.h / 2;
          const distance = Math.hypot(p.x - targetX, p.y - targetY);
          if (distance < 38 && distance < closestDist) {
            closestObject = mob;
            closestType = "mob";
            closestX = targetX;
            closestY = targetY;
            closestRadius = (mob.w || 24) * 0.45;
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

    let mapInst = getActiveDungeonMap();
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
