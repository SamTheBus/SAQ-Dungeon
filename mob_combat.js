import {
  addActiveDungeonMob,
  removeActiveDungeonMobById,
} from "./encounter_state.js?v=1.007";
import {
  getIndexedMobOrdinal,
  insertIndexedMob,
  queryMobCandidatesInAabb,
  refreshIndexedMob,
  removeIndexedMob,
} from "./mob_spatial_index.js?v=1.002";
import { isFriendlyCombatMob } from "./combat_factions.js?v=1.001";
import {
  canStandardMobApplyOpeningPressure,
  canStandardMobFireRanged,
} from "./opening_fairness.js?v=1.000";
import {
  MONSTER_DROP_DOMAINS,
  calculateEligibleMonsterDropChance,
  rollEligibleMonsterDrop,
} from "./drop_rate_contract.js?v=1.000";
import { awardDefeatMasteryXp } from "./mastery_authority.js?v=1.003";
import { applyHostilePlayerPoison } from "./combat_effect_authority.js?v=1.001";

const MOB_SEPARATION_DISTANCE = 18;
const MOB_SPATIAL_SEPARATION_THRESHOLD = 128;
const separationCandidates = [];

function addCombatIndexedMob(nextMob) {
  const addedMob = addActiveDungeonMob(nextMob);
  insertIndexedMob(addedMob);
  return addedMob;
}

function removeCombatIndexedMobById(mobId) {
  const removedMob = removeActiveDungeonMobById(mobId);
  if (removedMob) removeIndexedMob(removedMob);
  return removedMob;
}

function findNearestFriendlyDecoy(hostileMob, maxDistance = 220) {
  let closestDecoy = null;
  let closestDistance = maxDistance;
  const hostileX = hostileMob.x + (hostileMob.w || 24) / 2;
  const hostileY = hostileMob.y + (hostileMob.h || 24) / 2;

  (window.activeDungeonMobs || []).forEach((candidate) => {
    if (!isFriendlyCombatMob(candidate)) return;
    const candidateX = candidate.x + (candidate.w || 24) / 2;
    const candidateY = candidate.y + (candidate.h || 24) / 2;
    const distance = Math.hypot(candidateX - hostileX, candidateY - hostileY);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestDecoy = candidate;
    }
  });

  return closestDecoy;
}

  export const updateStandardMobCombat = function (p, pStats, map) {
    // Process active room mobs (Standard logic loop)
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      let indexedCollectionLength = window.activeDungeonMobs.length;
      const useMobSpatialSeparation =
        indexedCollectionLength >= MOB_SPATIAL_SEPARATION_THRESHOLD;
      for (let i = window.activeDungeonMobs.length - 1; i >= 0; i--) {
        let m = window.activeDungeonMobs[i];

        // --- SUBPHASE 7: REGENERATIVE BROOD HEALTH TICK ---
        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("regenerative_brood") &&
          m.hp.gt(0) &&
          !m.isFriendlyWisp &&
          !m.isBoss
        ) {
          let lastHit = m.lastHitTime || 0;
          if (window.logicClock - lastHit >= 180) {
            // 3 seconds of peace
            if (window.logicClock % 120 === 0) {
              // Every 2 seconds
              let healVal = m.maxHp.mul(0.03); // Heal 3% Max HP
              m.hp = window.BigNumMin(m.maxHp, m.hp.add(healVal));
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  m.x + m.w / 2,
                  m.y + m.h / 2,
                  3,
                  "default_slime",
                  1.0,
                );
              }
            }
          }
        }
        // --------------------------------------------------

        // Intercept Specter wall-passing physics and instant-death contact checks
        if (m.isSpecter) {
          let sDx = p.x - (m.x + m.w / 2);
          let sDy = p.y - (m.y + m.h / 2);
          let sDist = Math.hypot(sDx, sDy);

          if (sDist > 0) {
            let speed = 0.85; // Relentless slow pursuit speed
            m.x += (sDx / sDist) * speed;
            m.y += (sDy / sDist) * speed;
            if (sDx < -1) m.facing = -1;
            else if (sDx > 1) m.facing = 1;
          }

          let pRadius = p.radius || 9;
          if (sDist < pRadius + 12) {
            let massiveDmg = BigNum.from("9.99e150"); // 10^150 absolute death strike
            window.damagePlayer(massiveDmg, m);
          }
          if (useMobSpatialSeparation) refreshIndexedMob(m);
          continue; // Completely bypass normal mob separation and collision physics
        }

        // Intercept and update friendly wisp decoy targets
        if (m.isFriendlyWisp) {
          m.wispTimer--;
          m.flashTimer = 0;

          const wispExpired = m.wispTimer <= 0;
          if (wispExpired && m.hp.gt(0)) {
            m.hp = BigNum.from(0);
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + 12,
                m.y + 12,
                10,
                "marsh_ghost",
                1.5,
              );
            }
          }

          // Friendly wisps bypass hostile death rewards and on-death effects,
          // so they must also own their removal path before the early continue.
          if (m.hp.lte(0)) {
            removeCombatIndexedMobById(m.id);
            continue;
          }

          let nearestHostile = window.activeDungeonMobs
            ? window.activeDungeonMobs.find(
                (other) =>
                  !other.isFriendlyWisp &&
                  !other.isCocoon &&
                  !other.isSpore &&
                  !other.isMagmaVent &&
                  other.hp.gt(0) &&
                  other.id !== m.id,
              )
            : null;
          if (!nearestHostile && window.mob && window.mob.hp.gt(0))
            nearestHostile = window.mob;

          if (nearestHostile) {
            let hdx = nearestHostile.x + nearestHostile.w / 2 - (m.x + 12);
            let hdy = nearestHostile.y + nearestHostile.h / 2 - (m.y + 12);
            let hdist = Math.hypot(hdx, hdy);
            if (hdist > 20) {
              window.moveEntityWithSmartSteering(
                m,
                nearestHostile.x + nearestHostile.w / 2,
                nearestHostile.y + nearestHostile.h / 2,
                1.1,
                map,
                8,
              );
            }
          }

          if (useMobSpatialSeparation) refreshIndexedMob(m);
          continue;
        }

        const friendlyDecoy = findNearestFriendlyDecoy(m);
        const combatTargetX = friendlyDecoy
          ? friendlyDecoy.x + (friendlyDecoy.w || 24) / 2
          : p.x;
        const combatTargetY = friendlyDecoy
          ? friendlyDecoy.y + (friendlyDecoy.h || 24) / 2
          : p.y;
        let dx = combatTargetX - (m.x + m.w / 2);
        let dy = combatTargetY - (m.y + m.h / 2);
        let dist = Math.hypot(dx, dy);

        // Apply lightweight separation/repulsion forces to prevent monster clumping
        if (!m.isCocoon && !m.isSpore && !m.isMagmaVent && m.hp.gt(0)) {
          let activeMobs = window.activeDungeonMobs;
          let mCx = m.x + m.w / 2;
          let mCy = m.y + m.h / 2;

          if (!useMobSpatialSeparation) {
            for (let j = 0; j < activeMobs.length; j++) {
              let other = activeMobs[j];
              if (
                other === m ||
                other.hp.lte(0) ||
                other.isCocoon ||
                other.isSpore ||
                other.isMagmaVent
              )
                continue;

              let odx = mCx - (other.x + other.w / 2);
              let ody = mCy - (other.y + other.h / 2);
              let odist = Math.hypot(odx, ody);
              if (odist < MOB_SEPARATION_DISTANCE && odist > 0.1) {
                let force = (MOB_SEPARATION_DISTANCE - odist) * 0.15;
                let pushX = (odx / odist) * force;
                let pushY = (ody / odist) * force;

                let mapInst = map;
                if (mapInst && mapInst.grid) {
                  if (!checkCollisionAt(mapInst, mCx + pushX, mCy, 8)) {
                    m.x += pushX;
                  }
                  if (!checkCollisionAt(mapInst, mCx, mCy + pushY, 8)) {
                    m.y += pushY;
                  }
                } else {
                  m.x += pushX;
                  m.y += pushY;
                }
                mCx = m.x + m.w / 2;
                mCy = m.y + m.h / 2;
              }
            }
          } else {
            if (activeMobs.length !== indexedCollectionLength) {
              for (let mobIndex = 0; mobIndex < activeMobs.length; mobIndex++) {
                let activeMob = activeMobs[mobIndex];
                if (getIndexedMobOrdinal(activeMob) === -1) {
                  insertIndexedMob(activeMob);
                }
              }
              indexedCollectionLength = activeMobs.length;
            }

            let lastCandidateOrdinal = -1;
            let queryCenterX = mCx;
            let queryCenterY = mCy;
            let queryRadius = MOB_SEPARATION_DISTANCE * 2;
            queryMobCandidatesInAabb(
              queryCenterX - queryRadius,
              queryCenterY - queryRadius,
              queryCenterX + queryRadius,
              queryCenterY + queryRadius,
              separationCandidates,
            );

            let candidateIndex = 0;
            while (candidateIndex < separationCandidates.length) {
              let other = separationCandidates[candidateIndex++];
              let candidateOrdinal = getIndexedMobOrdinal(other);
              if (candidateOrdinal <= lastCandidateOrdinal) continue;
              lastCandidateOrdinal = candidateOrdinal;

              if (
                other === m ||
                other.hp.lte(0) ||
                other.isCocoon ||
                other.isSpore ||
                other.isMagmaVent
              )
                continue;

              let odx = mCx - (other.x + other.w / 2);
              let ody = mCy - (other.y + other.h / 2);
              let odist = Math.hypot(odx, ody);
              if (odist < MOB_SEPARATION_DISTANCE && odist > 0.1) {
                let force = (MOB_SEPARATION_DISTANCE - odist) * 0.15;
                let pushX = (odx / odist) * force;
                let pushY = (ody / odist) * force;
                let moved = false;

                let mapInst = map;
                if (mapInst && mapInst.grid) {
                  if (!checkCollisionAt(mapInst, mCx + pushX, mCy, 8)) {
                    m.x += pushX;
                    moved = true;
                  }
                  if (!checkCollisionAt(mapInst, mCx, mCy + pushY, 8)) {
                    m.y += pushY;
                    moved = true;
                  }
                } else {
                  m.x += pushX;
                  m.y += pushY;
                  moved = true;
                }
                mCx = m.x + m.w / 2;
                mCy = m.y + m.h / 2;

                if (
                  moved &&
                  (Math.abs(mCx - queryCenterX) > MOB_SEPARATION_DISTANCE ||
                    Math.abs(mCy - queryCenterY) > MOB_SEPARATION_DISTANCE)
                ) {
                  queryCenterX = mCx;
                  queryCenterY = mCy;
                  queryMobCandidatesInAabb(
                    queryCenterX - queryRadius,
                    queryCenterY - queryRadius,
                    queryCenterX + queryRadius,
                    queryCenterY + queryRadius,
                    separationCandidates,
                  );
                  candidateIndex = 0;
                }
              }
            }
          }
        }
        if (useMobSpatialSeparation) refreshIndexedMob(m);

        // Process Hatching Summons (Sprout Cocoons)
        if (m.isCocoon) {
          m.hatchTimer--;
          m.flashTimer = 0; // prevent red flash unless directly attacked
          if (m.hatchTimer <= 0) {
            m.isCocoon = false;
            m.isRanged = Math.random() < 0.5;
            m.visualType = Math.random() < 0.5 ? "slime" : "sprout";
            m.visualTier = 0;
            m.name =
              m.visualType === "slime" ? "Hatched Slime" : "Hatched Sprout";
            m.atk = Math.round(10 + (window.player.depth || 1) * 3);
            m.hp = m.maxHp; // Refill HP for active minion combat
            m.projectileType = "thorn";
            m.rangedCooldown = 60;
            m.hopTimer = window.randInt(0, 29); // Desynchronize hatched minion jumping phase
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                15,
                "slag_slime",
                3,
              );
            }
            if (window.SoundManager) window.SoundManager.play("spell");
          }
          continue; // Skip standard movement/attack logic while incubating
        }

        // Process Floating Homing Toxic Spores (Swamp Stage Warden)
        if (m.isSpore) {
          m.hatchTimer--; // Repurpose hatchTimer as spore lifetime
          m.flashTimer = 0;

          // Float slowly toward the player's position
          let sDx = p.x - (m.x + m.w / 2);
          let sDy = p.y - (m.y + m.h / 2);
          let sDist = Math.hypot(sDx, sDy);
          if (sDist > 0) {
            let speed = 1.0; // Floating speed
            m.x += (sDx / sDist) * speed;
            m.y += (sDy / sDist) * speed;
          }

          // Detonate on direct contact
          if (sDist < m.w / 2 + (p.radius || 9)) {
            window.damagePlayer(Math.round(m.atk * 1.25), m);
            applyHostilePlayerPoison(p, {
              stacks: 3,
              maxStacks: 5,
              sourceId: m.id,
              mechanic: "toxic_spore",
            });

            if (window.combatVisuals) {
              window.combatVisuals.triggerScreenShake(4, 6);
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                12,
                "swamp_basilisk",
                2.5,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");

            m.hp = BigNum.from(0); // Mark dead for removal
          }

          // Dissolve harmlessly into steam after 6 seconds (360 frames)
          if (m.hatchTimer <= 0 && m.hp.gt(0)) {
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                8,
                "swamp_basilisk",
                1.2,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");
            m.hp = BigNum.from(0); // Mark dead for removal
          }
          continue; // Skip standard movement/attack logic while drifting
        }

        // Process Pulsating Magma Vents (Inferno Stage Warden)
        if (m.isMagmaVent) {
          m.ventTimer--;
          m.flashTimer = 0;

          // Pulsate scale during active boil countdown
          let sizePulse = Math.sin(Date.now() / 60) * 3;
          m.w = 24 + sizePulse;
          m.h = 24 + sizePulse;

          if (m.ventTimer <= 0) {
            // Detonate Cross-Shaped Lava Wave!
            let mcx = m.x + m.w / 2;
            let mcy = m.y + m.h / 2;

            if (window.combatVisuals) {
              window.combatVisuals.triggerScreenShake(5, 8);
              // Spawn fiery lava particles along North, South, East, West axes
              for (let d = -96; d <= 96; d += 16) {
                if (d === 0) continue;
                // Horizontal axis
                window.combatVisuals.particlePool.get(
                  mcx + d,
                  mcy,
                  0,
                  -window.randFloat(0.1, 0.5),
                  window.randFloat(2, 4),
                  "#f97316",
                  0.9,
                  18,
                  0,
                  true,
                  0,
                );
                // Vertical axis
                window.combatVisuals.particlePool.get(
                  mcx,
                  mcy + d,
                  0,
                  -window.randFloat(0.1, 0.5),
                  window.randFloat(2, 4),
                  "#f97316",
                  0.9,
                  18,
                  0,
                  true,
                  0,
                );
              }
            }
            if (window.SoundManager) window.SoundManager.play("spell_fire");

            // Damage player if caught inside the lava crosshairs
            let pxDiff = Math.abs(p.x - mcx);
            let pyDiff = Math.abs(p.y - mcy);
            let isHit =
              (pxDiff <= 96 && pyDiff <= 12) || (pyDiff <= 96 && pxDiff <= 12);
            if (isHit) {
              let parentAtk = m.parentAtk || 25;
              window.damagePlayer(Math.round(parentAtk * 1.3), null);
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 15,
                  "LAVA ERUPTION!",
                  "#f97316",
                );
              }
            }

            m.hp = BigNum.from(0); // Mark dead for removal
          }
          continue; // Skip normal chase/swipe AI for static vents
        }

        // Check Blood Berserker Telegraphed Detonation Countdown
        if (m.isDetonating) {
          m.detonationTimer--;
          m.flashTimer = 2; // Flashing swell feedback during countdown

          if (m.detonationTimer <= 0) {
            let mobCenterX = m.x + (m.w || 24) / 2;
            let mobCenterY = m.y + (m.h || 24) / 2;

            // 1. Detonate Damage-Clamped Explosion on Player
            let dx = p.x - mobCenterX;
            let dy = p.y - mobCenterY;
            if (dx * dx + dy * dy <= 10000) {
              // 100px explosion radius
              let rawExplosionDmg = Math.round(m.atk * 1.0);
              let maxPlayerMaxHpCap = Math.round(p.maxHp * 0.25); // Damage clamped to 25% Max HP ceiling
              let clampedDmg = Math.min(rawExplosionDmg, maxPlayerMaxHpCap);

              window.damagePlayer(clampedDmg, m);
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 12);
                window.combatVisuals.spawnParticles(
                  mobCenterX,
                  mobCenterY,
                  25,
                  "magma_elemental",
                  5,
                );
              }
            }

            // 2. Grant Frenzy to Surviving Nearby Allies
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((m2) => {
                if (m2 === m || m2.hp.lte(0)) return;
                let adx = m2.x + (m2.w || 24) / 2 - mobCenterX;
                let ady = m2.y + (m2.h || 24) / 2 - mobCenterY;
                if (adx * adx + ady * ady <= 14400) {
                  // 120px ally radius
                  m2.buffStacks.haste = 3;
                  m2.buffTimers.haste = 180; // 3 seconds of Frenzy
                }
              });
            }

            if (
              window.RenderEngine &&
              window.RenderEngine.spawnDeathParticles
            ) {
              window.RenderEngine.spawnDeathParticles(
                mobCenterX,
                mobCenterY,
                m.type,
              );
            }
            awardDefeatMasteryXp(m);

            let pLvl = window.playerStats ? window.playerStats.level || 1 : 1;
                        let depthVal = window.player ? window.player.depth || 1 : 1;
                        let gap = Math.abs(depthVal - pLvl);
                        let gapMult = 1.0 / (1.0 + 0.08 * gap);

                        let rewardGold = Math.floor(15 * (1 + depthVal * 0.5));
                        let rewardXp = Math.floor((15 + depthVal * 3.0) * gapMult);

                        window.spawnHomingGold(mobCenterX, mobCenterY, rewardGold);
                        window.spawnHomingXp(mobCenterX, mobCenterY, rewardXp);

            removeCombatIndexedMobById(m.id);
            continue;
          }
          continue; // Freeze movement while detonating
        }

        // Check death state after any potential hit
        if (m.hp.lte(0)) {
          // Reset Spreading Fatigue speed penalty on kill
          window.fatiguePenalty = 0;

          let mobCenterX = m.x + (m.w || 24) / 2;
          let mobCenterY = m.y + (m.h || 24) / 2;

          if (m.isPortalSentinel) {
            map.portalLocked = false;
            window.spawnFloatingText(
              p.x,
              p.y - 25,
              "PORTAL SEAL SHATTERED!",
              "#00ffff",
            );
            if (window.spawnBarrierShatterVisual) {
              window.spawnBarrierShatterVisual(m.x + m.w / 2, m.y + m.h / 2);
            }
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "✦ Portal Sentinel slain! Descent Portal unlocked!",
                "#2ecc71",
              );
            }
          }

          if (m.visualType === "hoard_mimic" && m.isMimic) {
            let stageScale = window.player.depth || 1;
            let pStats =
              typeof window.resolvePlayerStats === "function"
                ? window.resolvePlayerStats()
                : {};
            let playerQuality = pStats.qly || 1.0;
            let tier = m.mimicTier || "iron_bound";

            let chestGoldVal = 250;
            let minRarity = 2; // Magic (2*)
            let extraLootCount = 1;
            let sigilChance = 0.4;
            let sigilMinRarity = 2;
            let cardSacks = 1;
            let rareMatChance = 0;
            let toastMsg =
              "✦ Mimic defeated! Iron-bound treasury rewards secured!";
            let toastColor = "#e67e22";

            if (tier === "gilded") {
              chestGoldVal = 350;
              minRarity = 2; // Magic
              sigilChance = 0.65;
              toastMsg = "✦ Mimic defeated! Gilded treasury rewards secured!";
              toastColor = "#ffd700";
            } else if (tier === "astral") {
              chestGoldVal = 550;
              minRarity = 3; // Epic (3*) minimum
              extraLootCount = 2; // 2x items!
              sigilChance = 1.0; // Guaranteed Sigil!
              sigilMinRarity = 3; // Guaranteed Epic Sigil or higher
              cardSacks = 2; // 2x card packs!
              rareMatChance = 0.4; // 40% chance for rare material
              toastMsg =
                "✦ Mimic defeated! Colossal Astral treasury rewards secured!";
              toastColor = "#a855f7";
            }

            let chestGold = Math.floor(chestGoldVal * (1 + stageScale * 1.0));
            window.spawnHomingGold(mobCenterX, mobCenterY, chestGold);

            let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots", "ring"];
            for (let i = 0; i < extraLootCount; i++) {
              let rolledRarity = window.rollItemRarity({
                progressionStage: stageScale,
                resolvedQuality: playerQuality * 1.5,
                source: window.EQUIPMENT_RARITY_SOURCES.HOARD_MIMIC,
              });
              rolledRarity = window.applyEquipmentRarityException(rolledRarity, {
                minimumRarity: minRarity,
                exception:
                  window.EQUIPMENT_RARITY_EXCEPTIONS.AUTHORED_MIMIC_MINIMUM,
              });
              let chosenType = types[Math.floor(Math.random() * types.length)];
              let droppedItem = window.createItemObject(
                chosenType,
                rolledRarity,
                stageScale,
                0,
              );
              window.spawnGroundLoot(droppedItem, mobCenterX, mobCenterY);
            }

            if (Math.random() < sigilChance) {
              let rolledSigilRarity = window.rollSigilRarity(
                4,
                playerQuality * 1.25,
              );
              if (rolledSigilRarity < sigilMinRarity)
                rolledSigilRarity = sigilMinRarity;
              let sigilItem = window.createItemObject(
                "sigil",
                rolledSigilRarity,
                stageScale,
                0,
              );
              window.spawnGroundLoot(sigilItem, mobCenterX, mobCenterY);
            }

            window.addUseDrop("Monster Card Sack", cardSacks, false);

            if (Math.random() < rareMatChance) {
              let mats = ["Ancient Core", "Astral Essence", "Eridium Shard"];
              let chosenMat = mats[Math.floor(Math.random() * mats.length)];
              if (typeof window.spawnGroundMaterial === "function") {
                window.spawnGroundMaterial(
                  chosenMat,
                  1,
                  mobCenterX,
                  mobCenterY,
                );
              }
            }

            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(toastMsg, toastColor);
            }
          }

          // --- SUBPHASE 7: SPAWNING DIVISION SPLIT ---
          let canDivide =
            m.visualType !== "sprout" &&
            m.visualType !== "slime" &&
            m.visualType !== "sprout_cocoon" &&
            m.visualType !== "toxic_spore" &&
            m.visualType !== "magma_vent" &&
            !m.isBossSummon &&
            !m.isFriendlyWisp;
          if (
            canDivide &&
            window.isCavernEffectActive &&
            window.isCavernEffectActive("spawning_division")
          ) {
            let stageScale = window.player ? window.player.depth || 1 : 1;
            let enemyScale = window.playerStats
              ? window.playerStats.currentRunEnemyStrength || 1.0
              : 1.0;
            let repStage = window.getEffectiveStage(stageScale * 5);
            let repScale = Math.pow(
              1.045 + (repStage * 0.04) / (repStage + 200),
              repStage * 0.95,
            );
            let subMobHp = Math.round(15 * repScale * enemyScale);
            let subMobAtk = Math.round(4 * repScale * enemyScale);

            // Subphase 10: Gaseous Spawning Division Particle Puff
            if (window.ParticlePool && window.particles) {
              let mCx = m.x + m.w / 2;
              let mCy = m.y + m.h / 2;
              let pCount = window.randInt(10, 15);
              for (let pIdx = 0; pIdx < pCount; pIdx++) {
                let pAngle = Math.random() * Math.PI * 2;
                let pSpeed = window.randFloat(0.8, 2.5);
                let pLife = window.randInt(15, 28);
                let pt = window.ParticlePool.get(
                  mCx,
                  mCy,
                  Math.cos(pAngle) * pSpeed,
                  Math.sin(pAngle) * pSpeed - 1.0, // Mild upward float bias
                  window.randFloat(2.0, 3.8),
                  Math.random() < 0.5 ? "#2ecc71" : "#a3fd83",
                  0.9,
                  pLife,
                  pLife,
                  -0.04, // Upward floating gravity
                  true,
                  0.95,
                );
                pt.style = "glowing_orb";
                pt.scaleDecay = 0.02;
                window.particles.push(pt);
              }
            }

            for (let k = 0; k < 2; k++) {
              let angle = Math.random() * Math.PI * 2;
              let offsetDist = 12;
              let sx = m.x + Math.cos(angle) * offsetDist;
              let sy = m.y + Math.sin(angle) * offsetDist;

              addCombatIndexedMob({
                id: window.idCounter++,
                type: "mob",
                visualTier: 0,
                visualType: Math.random() < 0.5 ? "slime" : "sprout",
                x: sx,
                y: sy,
                homeX: sx,
                homeY: sy,
                w: 20, // Slightly smaller sub-unit
                h: 20,
                hp: BigNum.from(subMobHp),
                maxHp: BigNum.from(subMobHp),
                atk: subMobAtk,
                flashTimer: 0,
                attackCooldown: 30, // Brief immunity/recovery before they strike
                facing: -1,
                isBossSummon: true, // Prevent endless splitting loops
                discovered: true,
                hopTimer: window.randInt(0, 29),
              });
            }
          }
          // --------------------------------------------

          // Check Magma Vent & Spore harmless pop bypass
          if (m.isMagmaVent || m.isSpore) {
            let theme = m.isMagmaVent ? "magma_elemental" : "swamp_basilisk";
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                10,
                theme,
                1.8,
              );
            }
            if (window.SoundManager) window.SoundManager.play("block");
            removeCombatIndexedMobById(m.id);
            continue;
          }

          window.playerStats.totalLifetimeKills =
            (window.playerStats.totalLifetimeKills || 0) + 1;
          if (m.isRare) {
            window.playerStats.rareSpawnsSlain =
              (window.playerStats.rareSpawnsSlain || 0) + 1;
          }

          if ((m.isRare || m.eliteAffix) && Math.random() < 0.4) {
            const elixirs = [
              "Basic Attack Elixir",
              "Basic Vitality Elixir",
              "Basic Armored Elixir",
              "Basic Haste Elixir",
            ];
            let rolledElixir =
              elixirs[Math.floor(Math.random() * elixirs.length)];
            window.addUseDrop(rolledElixir, 1, false);
          }

          if (typeof window.progressMission === "function") {
            window.progressMission("kills", 1);
            if (m.isRare) {
              window.progressMission("rares", 1);
            }
            if (m.isRiftGuardian || m.type === "rift_guardian") {
              window.progressMission("rifts", 1);
            }
          }

          // Trigger 1.2s telegraphed detonation phase for Blood Berserkers
          if (m.eliteAffix === "blood_berserker" && !m.isDetonating) {
            m.isDetonating = true;
            m.detonationTimer = 70; // 70 frames (~1.2s) reaction window
            m.detonationMax = 70;
            m.isStopped = true;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] BLOOD BERSERKER DETONATING!",
                "#e74c3c",
              );
            }
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_fire");
            }
            continue;
          }

          mobCenterX = m.x + m.w / 2;
          mobCenterY = m.y + m.h / 2;

          // Trigger Noxious Bloom on qualified death
          if (window.checkAndSpawnNoxiousBloom) {
            window.checkAndSpawnNoxiousBloom(m, mobCenterX, mobCenterY);
          }

          if (
            window.isCavernEffectActive &&
            window.isCavernEffectActive("soul_harvest") &&
            Math.random() < 0.2
          ) {
            addCombatIndexedMob({
              id: window.idCounter++,
              type: "mob",
              visualTier: 4,
              visualType: "marsh_ghost",
              x: mobCenterX - 12,
              y: mobCenterY - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(1),
              maxHp: BigNum.from(1),
              atk: 0,
              flashTimer: 0,
              isFriendlyWisp: true,
              wispTimer: 360,
              discovered: true,
              hopTimer: 0,
            });
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                mobCenterX,
                mobCenterY - 15,
                "SOUL HARVEST!",
                "#34d399",
              );
            }
          }

          if (window.RenderEngine && window.RenderEngine.spawnDeathParticles) {
            window.RenderEngine.spawnDeathParticles(
              mobCenterX,
              mobCenterY,
              m.type,
            );
          }
          awardDefeatMasteryXp(m);
          let rewardGold = Math.floor(15 * (1 + window.player.depth * 0.5));
          let rewardXp = Math.floor(15 + window.player.depth * 4);
          window.spawnHomingGold(mobCenterX, mobCenterY, rewardGold);
          window.spawnHomingXp(mobCenterX, mobCenterY, rewardXp);

          // 12% Chance to drop a healing heart on standard enemy death
          if (
            Math.random() < 0.12 &&
            typeof window.spawnHomingHearts === "function"
          ) {
            let heartHeal = Math.round(p.maxHp * 0.1);
            window.spawnHomingHearts(mobCenterX, mobCenterY, heartHeal);
          }

          // Monster Souls & Scraps Mob Drop Logic
          if (
            rollEligibleMonsterDrop(
              0.45,
              pStats,
              MONSTER_DROP_DOMAINS.MATERIAL,
            )
          ) {
            let soulCount = Math.floor(Math.random() * 2) + 1;
            window.addDungeonRunScrap(
              "Monster Soul",
              soulCount,
              mobCenterX,
              mobCenterY,
            );
          }

          if (m.isRare) {
            // Utility Keystone: Fortune's Favor (+50% Gold Multiplier for 15s)
            if (pStats.hasFortunesFavor) {
              window.playerStats.fortunesFavorTimer = 900; // 15 seconds
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 30,
                  "FORTUNE'S FAVOR (+50% GOLD)",
                  "#ffd700",
                );
              }
            }

            // Artifact: Void Pull (Heal 15% Max HP on Rare kill)
            if (window.checkArtifactTrait("void_pull")) {
              const healRate = window.scaleArtifactMechanic
                ? window.scaleArtifactMechanic("void_pull", 0.15)
                : 0.15;
              let healAmt = Math.round(p.maxHp * healRate);
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 20,
                  `+${healAmt} HP (VOID PULL)`,
                  "#a855f7",
                );
              }
            }

            // Unique: Warp-Core Greaves (Spatial Leap Portal Drop on Boss Defeat)
            if (
              window.hasUniquePassive("boots_warpcore") &&
              Math.random() < 0.2
            ) {
              let tSize = map ? map.tileSize : 32;
              let tileX = Math.floor(mobCenterX / tSize);
              let tileY = Math.floor(mobCenterY / tSize);
              if (
                map &&
                map.grid &&
                map.grid[tileY] &&
                map.grid[tileY][tileX] !== undefined
              ) {
                map.grid[tileY][tileX] = window.TILE_TYPES.DESCENT_PORTAL;
                if (typeof window.pushHeaderToast === "function") {
                  window.pushHeaderToast("[✦] SPATIAL RIFT OPENED!", "#1abc9c");
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    mobCenterX,
                    mobCenterY - 15,
                    "SPATIAL RIFT",
                    "#1abc9c",
                  );
                }
                if (window.combatVisuals) {
                  window.combatVisuals.spawnBeam(
                    mobCenterX,
                    "#1abc9c",
                    45,
                    false,
                  );
                }
              }
            }

            window.addDungeonRunScrap(
              "Luminous Soul",
              1,
              mobCenterX,
              mobCenterY,
            );
            let depth = window.player.depth || 1;
            let scrapTier = Math.min(5, Math.floor((depth - 1) / 10));
            let scrapName = window.getScrapYieldName(scrapTier);
            window.addDungeonRunScrap(
              scrapName,
              Math.floor(Math.random() * 3) + 2,
              mobCenterX,
              mobCenterY,
            );
          }

          // Artifact: Frenzy (Berserker Stone) - Increments kill counter
          if (window.checkArtifactTrait("frenzy")) {
            window.playerStats.frenzyKillCount =
              (window.playerStats.frenzyKillCount || 0) + 1;
            if (window.playerStats.frenzyKillCount >= 15) {
              window.playerStats.frenzyKillCount = 0;
              const frenzyDuration = window.scaleArtifactMechanic
                ? window.scaleArtifactMechanic("frenzy", 300)
                : 300;
              const chronoExtension = window.scaleArtifactMechanic
                ? window.scaleArtifactMechanic("extend_buffs", 180)
                : 0;
              window.playerStats.frenzyTimer = Math.round(
                frenzyDuration + chronoExtension,
              );
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 25,
                  "BERZERKER FRENZY!",
                  "#ff4757",
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnBeam(p.x, "#ff4757", 45, true);
              }
            }
          }

          // Cavern Sigil Drop Logic
          let sigilBaseRate = m.isRare ? 0.08 : 0.006;
          let sigilRollRate = calculateEligibleMonsterDropChance(
            sigilBaseRate,
            pStats,
            MONSTER_DROP_DOMAINS.SIGIL,
          );
          if (Math.random() < sigilRollRate) {
            let maxSigilStars = 0;
            let cleared = window.playerStats.maxFloorCleared || 0;
            if (cleared >= 120) maxSigilStars = 5;
            else if (cleared >= 72) maxSigilStars = 4;
            else if (cleared >= 48) maxSigilStars = 3;
            else if (cleared >= 24) maxSigilStars = 2;
            else if (cleared >= 12) maxSigilStars = 1;
            maxSigilStars = Math.max(1, maxSigilStars);

            let rolledSigilRarity = window.rollSigilRarity(
              maxSigilStars,
              pStats.qly || 1.0,
            );
            let stageScale = window.player.depth || 1;
            let sigilItem = window.createItemObject(
              "sigil",
              rolledSigilRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(sigilItem, mobCenterX, mobCenterY);
          }

          // Procedural Card Drop Roll (Regular: 0.5% base, Rare/Mimic: 20% base, multiplied by Drop Rate)
          let cardBaseChance =
            m.isRare || m.visualType === "hoard_mimic" ? 0.2 : 0.005;
          if (
            rollEligibleMonsterDrop(
              cardBaseChance,
              pStats,
              MONSTER_DROP_DOMAINS.CARD,
            )
          ) {
            let cardKey = m.visualType || m.type;
            if (window.MONSTER_CARDS_DATA[cardKey]) {
              let cardItem = {
                id: window.idCounter++,
                type: "card",
                cardKey: cardKey,
                name: window.MONSTER_CARDS_DATA[cardKey].name,
                statsRolled: 5,
                stageLevel: m.stageLevel || window.player.depth || 1,
              };
              window.spawnGroundLoot(cardItem, mobCenterX, mobCenterY);
            }
          }

          // 5% Chance Mob Equipment Drop (Blocked in Crucible/Onslaught Mode & Special Challenges)
          let isChallengeActive =
            window.playerStats.activeSpecialChallenge !== null;
          if (
                      !window.playerStats.isCrucibleMode &&
                      !isChallengeActive &&
                      rollEligibleMonsterDrop(
                        0.05,
                        pStats,
                        MONSTER_DROP_DOMAINS.EQUIPMENT,
                      )
                    ) {
                      let depthVal = window.player ? window.player.depth || 1 : 1;
                      let stageScale = window.getFloorItemLevel ? window.getFloorItemLevel(depthVal) : Math.floor(depthVal / 4) + 1;
                      let rolledRarity = window.rollItemRarity({
                        progressionStage: depthVal,
                        resolvedQuality: pStats.qly || 1.0,
                        source: window.EQUIPMENT_RARITY_SOURCES.ORDINARY_MONSTER,
                      });
                      let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots", "ring"];
                      let chosenType = types[Math.floor(Math.random() * types.length)];
                      let droppedItem = window.createItemObject(
                        chosenType,
                        rolledRarity,
                        stageScale,
                        0,
                      );

                      window.spawnGroundLoot(droppedItem, mobCenterX, mobCenterY);
                    } else if (isChallengeActive && Math.random() < 0.08) {
            // In special challenges, convert gear drops into rare crafting scraps / material drops
            let mats = [
              "Monster Soul",
              "Rare Scrap",
              "Magic Scrap",
              "Epic Scrap",
              "Eridium Shard",
            ];
            let depth = window.player.depth || 1;
            let idx = Math.min(mats.length - 1, Math.floor((depth - 1) / 10));
            let chosenMat = mats[Math.floor(Math.random() * (idx + 1))];
            window.addDungeonRunScrap(
              chosenMat,
              window.randInt(1, 2),
              mobCenterX,
              mobCenterY,
            );
          }

          removeCombatIndexedMobById(m.id);
          continue;
        }

        // 1. Decrement Active Mob Timers
        if (m.flashTimer > 0) m.flashTimer--;
        if (m.attackCooldown > 0) m.attackCooldown--;
        if (m.rangedCooldown > 0) m.rangedCooldown--;
        if (m.stunTimer > 0) {
          m.stunTimer--;
          continue;
        }

        if (m.isStopped) continue;

        let openingPressureReady = canStandardMobApplyOpeningPressure({
          depth: p.depth || window.player?.depth || 1,
          floorActiveTicks: window.playerStats?.floorActiveTicks || 0,
          isChallenge: Boolean(window.playerStats?.activeSpecialChallenge),
          isRift: window.playerStats?.isRiftMode === true,
          isCrucible: window.playerStats?.isCrucibleMode === true,
        });
        if (!openingPressureReady) {
          if (useMobSpatialSeparation) refreshIndexedMob(m);
          continue;
        }

        // 2. Mob Contact Melee Attack on Player or a nearby friendly decoy
        if (dist < 20 && m.attackCooldown <= 0) {
          m.attackCooldown = 60; // 1s attack cooldown
          if (friendlyDecoy && isFriendlyCombatMob(friendlyDecoy)) {
            friendlyDecoy.hp = friendlyDecoy.hp.sub(m.atk);
            friendlyDecoy.flashTimer = 6;
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                combatTargetX,
                combatTargetY,
                8,
                "marsh_ghost",
                1.5,
              );
            }
          } else {
            window.damagePlayer(m.atk, m);
          }

          if (!friendlyDecoy && m.eliteAffix === "toxic_decay" && p.hp > 0) {
                      let now = window.logicClock || 0;
                      // 2-second Internal Cooldown (120 frames) & max 3 stacks to prevent instant death from fast hits
                      if (!m.lastToxicApplyTime || now - m.lastToxicApplyTime >= 120) {
                        m.lastToxicApplyTime = now;
                        applyHostilePlayerPoison(p, {
                          stacks: 1,
                          maxStacks: 3,
                          sourceId: m.id,
                          mechanic: "toxic_decay",
                        });
                        if (window.spawnFloatingText) {
                          window.spawnFloatingText(
                            p.x,
                            p.y - 12,
                            "TOXIC ROT!",
                            "#2ecc71",
                            true,
                          );
                        }
                      }
                    }

          if (!friendlyDecoy && p.hp <= 0) {
            window.startDeathSequence();
          }
        }

        // 3. Mob Movement & Ranged Attack AI
        let mCx = m.x + (m.w || 24) / 2;
        let mCy = m.y + (m.h || 24) / 2;

        if (
          dist < 260 ||
          m.isAggroed ||
          m.hasTakenDamage ||
          m.isRare ||
          m.isElite
        ) {
          m.isAggroed = true;

          if (dx < -1) m.facing = -1;
          else if (dx > 1) m.facing = 1;

          let baseSpeed = m.moveProfile === "relentless" ? 1.8 : 1.35;
          let hasteMult =
            m.buffStacks && m.buffStacks.haste > 0
              ? 1 + m.buffStacks.haste * 0.15
              : 1.0;
          let speed = baseSpeed * (m.speedMultiplier || 1.0) * hasteMult;

          if (m.isRanged) {
            // Ranged Projectile Attack Execution
            let openingRangedReady = canStandardMobFireRanged({
              depth: p.depth || window.player?.depth || 1,
              floorActiveTicks: window.playerStats?.floorActiveTicks || 0,
              isChallenge: Boolean(
                window.playerStats?.activeSpecialChallenge,
              ),
              isRift: window.playerStats?.isRiftMode === true,
              isCrucible: window.playerStats?.isCrucibleMode === true,
            });
            if (
              openingRangedReady &&
              m.rangedCooldown <= 0 &&
              dist <= 220
            ) {
              m.rangedCooldown = window.randInt(90, 150);
              let projAngle = Math.atan2(
                combatTargetY - mCy,
                combatTargetX - mCx,
              );
              let projSpeed = 4.2;

              window.projectiles.push({
                x: mCx,
                y: mCy,
                vx: Math.cos(projAngle) * projSpeed,
                vy: Math.sin(projAngle) * projSpeed,
                r: 6,
                type: m.projectileType || "thorn",
                owner: "enemy",
                sourceMob: m,
                targetFriendlyId: friendlyDecoy?.id,
                damage: m.atk,
                life: 180,
                pulseOffset: Math.random() * 10,
              });

              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("swing");
              }
            }

            // Ranged Distance Keeping
            if (dist > 140) {
              m.isMoving = window.moveEntityWithSmartSteering(
                m,
                combatTargetX,
                combatTargetY,
                speed,
                map,
                10,
              );
            } else if (dist < 60) {
              let kX = mCx - dx;
              let kY = mCy - dy;
              m.isMoving = window.moveEntityWithSmartSteering(
                m,
                kX,
                kY,
                speed * 0.7,
                map,
                10,
              );
            }
          } else {
            // Melee Mob Pursuit
            if (dist > 14) {
              m.hopTimer = ((m.hopTimer || 0) + 1) % 30;
              m.isMoving = window.moveEntityWithSmartSteering(
                m,
                combatTargetX,
                combatTargetY,
                speed,
                map,
                10,
              );
            }
          }
        } else {
          // Wandering Idle AI when unaggroed
          m.wanderTimer = (m.wanderTimer || 0) - 1;
          if (m.wanderTimer <= 0) {
            m.wanderTimer = window.randInt(60, 150);
            if (Math.random() < 0.5) {
              let wanderAngle = Math.random() * Math.PI * 2;
              m.wanderVx = Math.cos(wanderAngle) * 0.6;
              m.wanderVy = Math.sin(wanderAngle) * 0.6;
              m.isWandering = true;
            } else {
              m.wanderVx = 0;
              m.wanderVy = 0;
              m.isWandering = false;
            }
          }

          if (m.isWandering && (m.wanderVx !== 0 || m.wanderVy !== 0)) {
            let wTargetX = m.x + 12 + m.wanderVx * 20;
            let wTargetY = m.y + 12 + m.wanderVy * 20;
            m.isMoving = window.moveEntityWithSmartSteering(
              m,
              wTargetX,
              wTargetY,
              0.6,
              map,
              10,
            );
            if (!m.isMoving) {
              m.isWandering = false;
              m.wanderVx = 0;
              m.wanderVy = 0;
            }
          } else {
            m.isMoving = false;
          }
        }
        if (useMobSpatialSeparation) refreshIndexedMob(m);
      }
    }

  };
