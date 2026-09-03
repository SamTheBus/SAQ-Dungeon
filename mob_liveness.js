import { isBelowHealthFraction } from "./combat_scaling.js";
import { getMasteryNodeRank } from "./mastery_authority.js";

export function isBossOrMinibossMob(mob) {
  return !!(
    mob &&
    (mob.isBoss ||
      mob.type === "dungeon_miniboss" ||
      mob.type === "dungeon_boss" ||
      mob.visualType === "brimstone_colossus" ||
      mob.visualType === "gilded_vault_keeper" ||
      mob.visualType === "corrosive_abomination" ||
      mob.visualType === "overlord_iron_vault" ||
      mob.type === "marcus_boss" ||
      mob.type === "rift_guardian" ||
      mob.type === "prestige_boss" ||
      mob.type === "hooktail" ||
      mob.type === "nexus_overseer" ||
      mob.type === "chronos_arbitrator" ||
      mob.type === "aegis_goliath")
  );
}

export function prepareMimicTier(mob, map) {
  if (!mob || mob.visualType !== "hoard_mimic" || mob.mimicTier) {
    return mob ? mob.mimicTier : undefined;
  }

  let tileX = Math.floor(mob.x / 32);
  let tileY = Math.floor(mob.y / 32);
  let foundTier =
    map && map.chestTiers && map.chestTiers[`${tileX},${tileY}`];

  if (!foundTier && map && map.chestTiers) {
    for (let deltaX = -1; deltaX <= 1; deltaX++) {
      for (let deltaY = -1; deltaY <= 1; deltaY++) {
        let nearbyTier = map.chestTiers[`${tileX + deltaX},${tileY + deltaY}`];
        if (nearbyTier) {
          foundTier = nearbyTier;
          break;
        }
      }
      if (foundTier) break;
    }
  }

  if (!foundTier) {
    let treasureHunterLevel = getMasteryNodeRank(
      window.playerStats,
      "utility_treasure_hunter",
    );
    let seedValue =
      Math.sin(mob.x * 12.9898 + mob.y * 78.233) * 43758.5453;
    let roll = Math.abs(seedValue - Math.floor(seedValue));
    foundTier = "iron_bound";
    if (treasureHunterLevel === 1) {
      if (roll < 0.25) foundTier = "gilded";
    } else if (treasureHunterLevel === 2) {
      if (roll < 0.05) foundTier = "astral";
      else if (roll < 0.35) foundTier = "gilded";
    } else if (treasureHunterLevel >= 3) {
      if (roll < 0.12) foundTier = "astral";
      else if (roll < 0.45) foundTier = "gilded";
    }
  }

  mob.mimicTier = foundTier;
  return mob.mimicTier;
}

function installBossHpGate(mob) {
  if (mob._hpGatedHooked) return;

  mob._hpGatedHooked = true;
  let rawHp = mob.hp;

  Object.defineProperty(mob, "hp", {
    get() {
      return rawHp;
    },
    set(newHp) {
      let preciseDamage = null;
      let numericDamage = 0;
      if (rawHp && rawHp.sub) {
        preciseDamage = rawHp.sub(newHp);
      } else {
        numericDamage = rawHp - newHp;
      }

      let tookDamage = preciseDamage
        ? preciseDamage.gt(0)
        : numericDamage > 0;
      if (tookDamage) {
        if (mob.guardActiveTimer > 0 && window.player) {
          let angleToPlayer = Math.atan2(
            window.player.y - mob.y,
            window.player.x - mob.x,
          );
          let parryReduction = 0.8;

          if (preciseDamage) {
            let reducedDmg = preciseDamage
              .mul(1.0 - parryReduction)
              .round();
            newHp = rawHp.sub(reducedDmg);
          } else {
            let reducedDmg = numericDamage * (1.0 - parryReduction);
            newHp = rawHp - Math.round(reducedDmg);
          }

          if (
            window.RenderEngine &&
            typeof window.RenderEngine.spawnHitSparks === "function"
          ) {
            window.RenderEngine.spawnHitSparks(
              mob.x + mob.w / 2,
              mob.y + mob.h / 2,
              true,
              Math.cos(angleToPlayer),
              Math.sin(angleToPlayer),
            );
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              mob.x + mob.w / 2,
              mob.y - 20,
              "PARRIED!",
              "#38bdf8",
              true,
            );
          }
          if (window.SoundManager) {
            window.SoundManager.play("hit");
          }
        } else if (mob.isBerserk) {
          if (preciseDamage) {
            newHp = newHp.sub(preciseDamage.mul(0.15).round());
          } else {
            let extraDmg = numericDamage * 0.15;
            newHp = newHp - Math.round(extraDmg);
          }
        }
      }

      rawHp = newHp;

      if (
        isBelowHealthFraction({ hp: rawHp, maxHp: mob.maxHp }, 0.45) &&
        !mob._berserkTriggered
      ) {
        mob._berserkTriggered = true;
        mob.isBerserk = true;

        if (mob.atk) {
          if (mob.atk.mul) mob.atk = mob.atk.mul(1.25);
          else mob.atk = Math.round(mob.atk * 1.25);
        }

        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            mob.x + mob.w / 2,
            mob.y - 30,
            "BERSERK!",
            "#e74c3c",
            true,
          );
        }
      }
    },
    configurable: true,
  });
}

function prepareBossOrMinibossLiveness(mob) {
  if (mob.guardTimer === undefined) {
    mob.guardTimer = 400 + Math.random() * 200;
    mob.guardActiveTimer = 0;
    mob._berserkTriggered = false;
    mob.isBerserk = false;
  }

  installBossHpGate(mob);
}

function advanceBossOrMinibossLiveness(mob) {
  if (mob.guardActiveTimer > 0) {
    mob.guardActiveTimer--;
    if (mob.guardActiveTimer <= 0) {
      mob.guardTimer = 500 + Math.random() * 300;
    }
  } else if (mob.guardTimer > 0) {
    mob.guardTimer--;
    if (mob.guardTimer <= 0) {
      mob.guardActiveTimer = 180;
    }
  }
}

function prepareSingleMobLiveness(mob, map) {
  prepareMimicTier(mob, map);

  if (isBossOrMinibossMob(mob)) {
    prepareBossOrMinibossLiveness(mob);
  }
}

function advanceSingleMobLiveness(mob, includePerfectStrike, map) {
  if (!mob) return;

  prepareSingleMobLiveness(mob, map);

  if (includePerfectStrike && mob.perfectStrikeTimer > 0) {
    mob.perfectStrikeTimer--;
  }

  if (isBossOrMinibossMob(mob)) {
    advanceBossOrMinibossLiveness(mob);
  }

  if (mob.exposeWeaknessTimer > 0) {
    mob.exposeWeaknessTimer--;
  }
}

export function prepareDungeonMobLiveness(activeMobs, primaryMob, map) {
  if (window.isGamePaused) return;

  for (let i = 0; i < activeMobs.length; i++) {
    prepareSingleMobLiveness(activeMobs[i], map);
  }

  if (primaryMob) {
    prepareSingleMobLiveness(primaryMob, map);
  }
}

export function advanceDungeonMobLiveness(activeMobs, primaryMob, map) {
  if (window.isGamePaused) return;

  for (let i = 0; i < activeMobs.length; i++) {
    advanceSingleMobLiveness(activeMobs[i], true, map);
  }

  if (primaryMob) {
    advanceSingleMobLiveness(primaryMob, false, map);
  }
}
