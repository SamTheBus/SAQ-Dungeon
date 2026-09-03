import { getActiveDungeonMap } from "./dungeon_map.js";
import {
  getActiveDungeonMobs,
  removeActiveDungeonMobById,
  setPrimaryMob,
} from "./encounter_state.js";
import { isPlayerTargetableMob } from "./combat_factions.js";
import {
  isOverkillHit,
  updateFinitePeakHit,
} from "./combat_scaling.js";
import { isActiveAttackReady } from "./attack_speed_contract.js";
import {
  awardDefeatMasteryXp,
  awardMainAttackMasteryXp,
} from "./mastery_authority.js";
import {
  MONSTER_DROP_DOMAINS,
  calculateEligibleMonsterDropChance,
  rollEligibleMonsterDrop,
} from "./drop_rate_contract.js";
import {
  applyPlayerBleed,
  applyPlayerPoison,
  clearPeriodicEffect,
  getActivePeriodicEffectCount,
  resolveOnHitArtifactEffects,
} from "./combat_effect_authority.js";
import {
  canPlayerReachCombatTarget,
  getCombatTargetCenter,
  isTomeCombatProfile,
} from "./combat_reach.js";
import { launchTomeAttackProjectile } from "./tome_projectile.js";
import { isEligiblePlayerElementTarget } from "./element_effect_authority.js";
import { resolveCanonicalTomeSpellProcEvent } from "./tome_rotation_authority.js";
import {
  canApplyDaggerMainBleed,
  canApplyVipersCoating,
  canExecuteDaggerOffhand,
} from "./dagger_identity_contract.js";
import { resolveSuccessfulShieldMainAttack } from "./shield_guard_pressure.js";
import {
  presentSetCapstoneAttackAction,
  resolveCanonicalSetCapstoneAttackAction,
} from "./set_capstone_authority.js";

  export const updateBossCombat = function (
    p,
    pStats,
    activeDungeonMap = getActiveDungeonMap(),
    options = {},
  ) {
    // Process Boss Warden Combat
    if (window.mob && window.mob.hp) {
      const tomeProjectileImpact = options.tomeProjectileImpact === true;
      let bm = options.impactTarget || window.mob;
      const resolvingPendingDefeat = bm.hp.lte(0) && bm.periodicDeathPending;
      if (!tomeProjectileImpact && !resolvingPendingDefeat) {
        window.BossAIEngine.update(bm, activeDungeonMap);
      }

      let dx = p.x - (bm.x + bm.w / 2);
      let dy = p.y - (bm.y + bm.h / 2);
      let dist = Math.hypot(dx, dy);
      const canReachBoss = canPlayerReachCombatTarget({
        player: p,
        target: bm,
        playerStats: pStats,
        subweapon: window.equippedSlots?.subweapon,
        map: activeDungeonMap,
        collisionCheck: window.checkCollisionAt,
      });

      if (
        resolvingPendingDefeat ||
        tomeProjectileImpact ||
        (canReachBoss && isActiveAttackReady(p.attackTimer, pStats))
      ) {
        if (!resolvingPendingDefeat) {
        const tomeEquipped = isTomeCombatProfile(
          pStats,
          window.equippedSlots?.subweapon,
        );
        if (tomeEquipped && !tomeProjectileImpact) {
          p.attackTimer = 0;

          if (typeof window.triggerCombatState === "function") {
            window.triggerCombatState();
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("swing");
          }

          const bossCenter = getCombatTargetCenter(bm);
          let dxToBoss = bossCenter.x - p.x;
          if (dxToBoss < -0.1) p.facing = -1;
          else if (dxToBoss > 0.1) p.facing = 1;

          launchTomeAttackProjectile({
            player: p,
            playerStats: pStats,
            target: bm,
            map: activeDungeonMap,
          });
        } else {
        if (!tomeProjectileImpact) p.attackTimer = 0;

        // Transition into active combat state
        if (
          !tomeProjectileImpact &&
          typeof window.triggerCombatState === "function"
        ) {
          window.triggerCombatState();
        }

        if (
          !tomeProjectileImpact &&
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("swing");
        }

        let bossCenterX = bm.x + bm.w / 2;
        // Face the boss being attacked!
        let dxToBoss = bossCenterX - p.x;
        if (!tomeProjectileImpact) {
          if (dxToBoss < -0.1) p.facing = -1;
          else if (dxToBoss > 0.1) p.facing = 1;
        }

        let isCrit = Math.random() < (pStats.critChance || 0.05);
        if (window.playerStats && window.playerStats.guaranteedCrit) {
          isCrit = true;
          window.playerStats.guaranteedCrit = false;
        }
        if (
          window.playerStats &&
          window.playerStats.viperShadowDanceCharges > 0
        ) {
          isCrit = true;
          window.playerStats.viperShadowDanceCharges--;
        }
        let critMult = isCrit ? pStats.critDamage || 1.5 : 1.0;
        let pAtk = BigNum.from(pStats.atk || p.atk).mul(critMult);

        // Synergy Sanguine DoT damage scaling (Boss)
        if (window.checkArtifactTrait("synergy_sanguine")) {
          let uniqueDoTs = getActivePeriodicEffectCount(bm);
          let perEffect = window.scaleArtifactMechanic
            ? window.scaleArtifactMechanic("synergy_sanguine", 0.08)
            : 0.08;
          let multiplier = 1.0 + perEffect * uniqueDoTs;
          pAtk = pAtk.mul(multiplier);
        }

        // Track Critical Streaks for Wind-Razor Flurry (Boss)
        let windFlurryLevel = pStats.windRazorFlurryLevel || 0;
        if (windFlurryLevel > 0) {
          if (isCrit) {
            window.playerStats.critStreak =
              (window.playerStats.critStreak || 0) + 1;
            if (window.playerStats.critStreak >= 3) {
              window.playerStats.critStreak = 0;
              window.triggerWindRazorStrike(bm);
            }
          } else {
            window.playerStats.critStreak = 0; // Reset streak on non-crit
          }
        }

        // REDUCE DAMAGE BY 90% IF ELDRITCH BARK SHIELD IS ACTIVE!
        if (bm.actionState === "bark_shield") {
          pAtk = pAtk.mul(0.1);
        }

        // CYBER BARRIER (NEXUS OVERSEER) IMMUNITY
        if (bm.actionState === "cyber_barrier") {
          pAtk = BigNum.from(0);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              bm.x + bm.w / 2,
              bm.y - 12,
              "SYSTEM IMMUNE",
              "#ff007f",
            );
          }
          if (window.SoundManager) window.SoundManager.play("block");
        }

        // STAGGER SHIELD ABSORPTION (CHRONOS & GILDED KEEPER)
        if (
          bm.actionState === "chrono_rewind" ||
          bm.actionState === "taxation" ||
          bm.actionState === "molten_shield"
        ) {
          bm.staggerShield = bm.staggerShield.sub(pAtk);

          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              pAtk,
              "static",
              false,
            );
          }

          if (bm.staggerShield.lte(0)) {
            bm.staggerShield = BigNum.from(0);
            bm.actionState = "idle";
            bm.state = "idle";
            bm.isStopped = false;
            bm.dazeTimer = 210; // 3.5s daze stun
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                bm.x + bm.w / 2,
                bm.y - 12,
                "SHIELD BROKEN! DAZED!",
                "#ffd700",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                bm.x + bm.w / 2,
                bm.y + bm.h / 2,
                25,
                "gold_dungeon",
                3,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
          }
          pAtk = BigNum.from(0); // 0 direct damage to boss HP
        }

        // DAZED STUN DAMAGE AMPLIFICATION (Takes 50% more damage)
        if (bm.dazeTimer > 0) {
          pAtk = pAtk.mul(1.5);
        }

        // AEGIS GOLIATH DIRECTIONAL SHIELD CALCULATIONS
        if (
          bm.bossKey === "aegis_goliath" &&
          bm.phase === 2 &&
          !(bm.dazeTimer > 0)
        ) {
          if (bm.shieldAngle !== undefined) {
            let bCenterX = bm.x + bm.w / 2;
            let bCenterY = bm.y + bm.h / 2;
            let attackAngle = Math.atan2(p.y - bCenterY, p.x - bCenterX);
            let angleDiff = Math.abs(
              Math.atan2(
                Math.sin(attackAngle - bm.shieldAngle),
                Math.cos(attackAngle - bm.shieldAngle),
              ),
            );

            // Frontal attack hits his raised Tower Shield!
            if (angleDiff < 0.6) {
              pAtk = BigNum.from(0);
              bm.flashTimer = 4;
              if (window.SoundManager) window.SoundManager.play("block");
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  bCenterX + Math.cos(bm.shieldAngle) * (bm.w * 0.75),
                  bCenterY + Math.sin(bm.shieldAngle) * (bm.w * 0.75),
                  8,
                  "aegis_goliath",
                  2,
                );
                window.spawnFloatingText(
                  bm.x + bm.w / 2,
                  bm.y - 12,
                  "BLOCKED!",
                  "#00d2ff",
                );
              }
            }
          }
        }

        let finalDmg = pAtk;
        if (bm.shredPercent && bm.shredPercent > 0) {
          finalDmg = finalDmg.mul(1 + bm.shredPercent);
        }
        bm.hp = bm.hp.sub(finalDmg);
        bm.hasTakenDamage = true;
        bm.flashTimer = 6;
        awardMainAttackMasteryXp();
        resolveSuccessfulShieldMainAttack({
          player: p,
          playerStats: window.playerStats,
          resolvedStats: pStats,
          target: bm,
        });
        const setCapstoneResult = resolveCanonicalSetCapstoneAttackAction({
          target: bm,
          player: p,
          resolvedStats: pStats,
          isCritical: isCrit,
          frame: window.logicClock,
        });
        presentSetCapstoneAttackAction(setCapstoneResult, bm);

        // Roll bleed from dagger base bleedChance
        if (canApplyDaggerMainBleed({ resolvedStats: pStats })) {
          if (Math.random() < pStats.bleedChance) {
            const bleedEffect = applyPlayerBleed(bm, pStats, {
              mechanic: "dagger_main_bleed",
            });
            if (bleedEffect) {
              window.spawnMeleeFeelImpact?.(
                bm.x + (bm.w || 24) / 2,
                bm.y + (bm.h || 24) / 2,
                "dagger",
                false,
                "bleed",
              );
            }
          }
        }

        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("temporal_echo")
        ) {
          window.temporalEchoQueue = window.temporalEchoQueue || [];
          window.temporalEchoQueue.push({
            targetId: bm.id,
            damage: pAtk.mul(0.35),
            timer: 72, // 1.2s delay
          });
        }

        window.playerStats.peakSingleHit = updateFinitePeakHit(
          window.playerStats.peakSingleHit,
          pAtk,
        );

        if (isCrit && isOverkillHit(pAtk, bm.maxHp)) {
          window.playerStats.hasTriggeredOverkill = true;
        }

        let curHr = new Date().getHours();
        if (curHr >= 0 && curHr < 4)
          window.playerStats.hasTriggeredNightOwl = true;
        if (curHr >= 5 && curHr < 8)
          window.playerStats.hasTriggeredEarlyBird = true;
        let curDay = new Date().getDay();
        if (curDay === 0 || curDay === 6)
          window.playerStats.hasTriggeredWeekendWarrior = true;

        let dirX = dist > 0 ? dx / dist : 1;
        let dirY = dist > 0 ? dy / dist : 0;
        bm.recoilX = -dirX * (isCrit ? 10 : 6);
        bm.recoilY = -dirY * (isCrit ? 10 : 6);

        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        // Trigger high-fidelity polymorphic combat particles (Subphase C.2)
        if (typeof window.spawnCombatImpactParticles === "function") {
          window.spawnCombatImpactParticles(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            isCrit,
            -dirX,
            -dirY,
            bm.visualType || bm.type || "default",
          );
        }

        if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
          window.RenderEngine.spawnDamageEffect(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2,
            pAtk,
            "slash",
            isCrit,
          );
        }
        let specializedImpact = false;
        if (pStats.subType === "dagger" || pStats.subType === "shield") {
          window.spawnMeleeFeelImpact?.(
            bossCenterX,
            bm.y + (bm.h || 24) / 2,
            pStats.subType,
            false,
            null,
            isCrit,
          );
          specializedImpact = typeof window.spawnMeleeFeelImpact === "function";
        } else if (
          tomeProjectileImpact &&
          isTomeCombatProfile(pStats, window.equippedSlots?.subweapon)
        ) {
          window.spawnTomeImpactVisual?.(
            bossCenterX,
            bm.y + (bm.h || 24) / 2,
            "arcane",
            { phase: "impact", isCrit },
          );
          specializedImpact = typeof window.spawnTomeImpactVisual === "function";
        }

        const onHitArtifacts = resolveOnHitArtifactEffects({
          target: bm,
          damage: pAtk,
          player: p,
        });
        if (
          isCrit &&
          window.hasUniquePassive("dagger_viper") &&
          Math.random() < 0.25
        ) {
          bm.perfectStrikeTimer = 120;
          bm.perfectStrikeMax = 120;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Viper's Reticle active! Tap target to execute!",
              "#a855f7",
            );
          }
        }
        if (
          onHitArtifacts.vampirismHeal > 0 &&
          typeof window.spawnFloatingText === "function"
        ) {
          window.spawnFloatingText(
            p.x,
            p.y - 12,
            `+${onHitArtifacts.vampirismHeal} HP`,
            "#e74c3c",
          );
        }
        if (
          onHitArtifacts.echoProc &&
          window.RenderEngine &&
          window.RenderEngine.spawnDamageEffect
        ) {
          window.RenderEngine.spawnDamageEffect(
            bm.x + bm.w / 2,
            bm.y + bm.h / 2 - 8,
            onHitArtifacts.echoDamage,
            "echo",
            false,
          );
        }

        if (
          !specializedImpact &&
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          let targetType = "flesh";
          let vType = bm.visualType || bm.type || "";
          if (vType === "overlord_iron_vault" || vType === "aegis_goliath") {
            targetType = "metal";
          } else if (
            vType === "brimstone_colossus" ||
            vType === "magma_elemental" ||
            vType === "lava_serpent"
          ) {
            targetType = "magma";
          }
          window.SoundManager.playHitImpact(isCrit, targetType);
        }

        // Define vertical center for boss offhand procs
        let bossCenterY = bm.y + bm.h / 2;

        // Dagger Offhand Multi-Strike & DoT Application on Boss
        if (canExecuteDaggerOffhand({ resolvedStats: pStats })) {
          let finalOffhandChance = pStats.offhandChance || 0.35;
          if (Math.random() < finalOffhandChance) {
            let offhandDmgMult = pStats.offhandDamageMultiplier || 1.0;
            let offhandHit = BigNum.from(pStats.atk || 15).mul(
              (pStats.offhandDmg || 0.45) * offhandDmgMult,
            );
            bm.hp = bm.hp.sub(offhandHit);

            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 6,
                offhandHit,
                "dagger",
                false,
                bm,
              );
            }
            window.spawnMeleeFeelImpact?.(
              bossCenterX,
              bossCenterY - 6,
              "dagger",
              true,
            );

            // Roll bleed from dagger base bleedChance
            if (pStats.bleedChance && pStats.bleedChance > 0) {
              if (Math.random() < pStats.bleedChance) {
                const bleedEffect = applyPlayerBleed(bm, pStats, {
                  mechanic: "dagger_offhand_bleed",
                });
                if (bleedEffect) {
                  window.spawnMeleeFeelImpact?.(
                    bossCenterX,
                    bossCenterY - 6,
                    "dagger",
                    true,
                    "bleed",
                  );
                }
              }
            }

            // 1. Viper's Coating
            let vipersLvl = pStats.vipersCoatingLvl || 0;
            if (
              vipersLvl > 0 &&
              canApplyVipersCoating({ resolvedStats: pStats })
            ) {
              const poisonEffect = applyPlayerPoison(bm, pStats, {
                rank: vipersLvl,
                mechanic: "vipers_coating",
              });
              if (poisonEffect) {
                window.spawnMeleeFeelImpact?.(
                  bossCenterX,
                  bossCenterY,
                  "dagger",
                  true,
                  "poison",
                );
              }

              let bleedChance = vipersLvl * 0.05;
              if (Math.random() < bleedChance) {
                applyPlayerBleed(bm, pStats, { mechanic: "vipers_coating_bleed" });
              }

              // Shadow Assassin Keystone check at 5 stacks
              if (pStats.hasKeystoneAssassin && poisonEffect?.stacks >= 5) {
                clearPeriodicEffect(bm, "poison");
                let flurryStrike = BigNum.from(pStats.atk || 15);
                for (let s = 0; s < 3; s++) {
                  bm.hp = bm.hp.sub(flurryStrike);
                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(
                      bossCenterX + (s - 1) * 12,
                      bossCenterY,
                      flurryStrike,
                      "dagger",
                      true,
                      bm,
                    );
                  }
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    bossCenterX,
                    bossCenterY - 20,
                    "SHADOW FLURRY!",
                    "#a855f7",
                  );
                }
              }
            }

            // 2. Expose Weakness
            let exposeLvl = pStats.exposeWeaknessLvl || 0;
            if (exposeLvl > 0) {
              bm.shredTimer = 300;
              bm.shredPercent = exposeLvl * 0.04;
              if (
                typeof window.spawnFloatingText === "function" &&
                Math.random() < 0.2
              ) {
                window.spawnFloatingText(
                  bossCenterX,
                  bossCenterY - 20,
                  "WEAKNESS EXPOSED!",
                  "#df9ffb",
                );
              }
            }
          }

          // 3. Shadow Flurry
          if (isCrit && pStats.hasShadowFlurry) {
            let flurryDmg = BigNum.from(pStats.atk || 15).mul(
              (pStats.offhandDmg || 0.45) *
                (pStats.offhandFlurryDamageMultiplier || 1) *
                1.5,
            );
            bm.hp = bm.hp.sub(flurryDmg);
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 4,
                flurryDmg,
                "dagger",
                true,
                bm,
              );
            }
          }
        }

        if (bm.shredTimer && bm.shredTimer > 0) {
          bm.shredTimer--;
          if (bm.shredTimer === 0) bm.shredPercent = 0;
        }

        // Tome Spell Cast Trigger on Boss
        let isTomeEquipped =
          pStats.subType === "tome" ||
          (window.equippedSlots &&
            window.equippedSlots.subweapon &&
            (window.equippedSlots.subweapon.subType === "tome" ||
              window.equippedSlots.subweapon.type === "tome"));
        let activeSpellChance =
          pStats.spellChance || (isTomeEquipped ? 0.35 : 0);

        if (
          isTomeEquipped &&
          isEligiblePlayerElementTarget(bm) &&
          Math.random() < activeSpellChance
        ) {
          resolveCanonicalTomeSpellProcEvent({
            player: p,
            resolvedStats: pStats,
            playerStats: window.playerStats,
            tome: window.equippedSlots?.subweapon,
            originTarget: bm,
            targets: getActiveDungeonMobs(),
            map: activeDungeonMap,
            collisionCheck: window.checkCollisionAt,
            frame: window.logicClock,
          });
        }

        }
        }

        if (bm.hp.lte(0)) {
          bm.periodicDeathPending = false;
          awardDefeatMasteryXp(bm);
          let depth = p ? p.depth || 1 : 1; // Defined depth globally for this block
          window.playerStats.totalLifetimeKills =
            (window.playerStats.totalLifetimeKills || 0) + 1;
          window.playerStats.rareSpawnsSlain =
            (window.playerStats.rareSpawnsSlain || 0) + 1;

          if (window.spawnDeathParticles) {
            window.spawnDeathParticles(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              "boss",
            );
          }

          let isMarcus =
            bm.type === "marcus_boss" || bm.visualType === "marcus";
          let rewardGold, rewardXp;

          if (isMarcus) {
                      let pLvl = window.playerStats ? window.playerStats.level || 1 : 1;
                      let gap = Math.abs(depth - pLvl);
                      let gapMult = 1.0 / (1.0 + 0.08 * gap);

                      // Scales strictly to current depth to prevent low-floor farming exploits
                      rewardGold = Math.floor(80 * (1 + depth * 0.45));
                      rewardXp = Math.floor((60 + depth * 8) * gapMult);

            // Drop any unpurchased/stolen wares as ground loot when Marcus dies!
            let map = activeDungeonMap;
            if (map && map.merchantStock) {
              map.merchantStock.forEach((item) => {
                if (!item.purchased) {
                  window.spawnGroundLoot(
                    item,
                    bm.x + bm.w / 2,
                    bm.y + bm.h / 2,
                  );
                  item.purchased = true; // Mark as purchased so they disappear/don't duplicate
                }
              });
            }
          } else {
                      let pLvl = window.playerStats ? window.playerStats.level || 1 : 1;
                      let depthVal = window.player ? window.player.depth || 1 : 1;
                      let gap = Math.abs(depthVal - pLvl);
                      let gapMult = 1.0 / (1.0 + 0.08 * gap);

                      rewardGold = Math.floor(150 * (1 + depthVal * 0.5));
                      rewardXp = Math.floor((120 + depthVal * 15) * gapMult);
                    }

          window.spawnHomingGold(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardGold);
          window.spawnHomingXp(bm.x + bm.w / 2, bm.y + bm.h / 2, rewardXp);

          // Subphase 16: Intercept twin boss deaths on Floor 4 to swap active combat camera anchor
          let otherLivingBoss = null;
          const activeDungeonMobs = getActiveDungeonMobs();
          if (
            window.playerStats.activeSpecialChallenge &&
            window.player.depth === 4 &&
            activeDungeonMobs
          ) {
            otherLivingBoss = activeDungeonMobs.find(
              (other) =>
                other.id !== bm.id &&
                (other.type === "dungeon_boss" ||
                  other.type === "dungeon_miniboss") &&
                other.hp.gt(0),
            );
          }

          if (otherLivingBoss) {
            setPrimaryMob(otherLivingBoss);

            // Cleanly remove the defeated twin from the active rendering arrays
            removeActiveDungeonMobById(bm.id);

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                bm.x + bm.w / 2,
                bm.y - 12,
                "ONE GUARDIAN DOWN!",
                "#ef4444",
              );
            }
          } else {
            let bossCenterX = bm.x + bm.w / 2;
            let bossCenterY = bm.y + bm.h / 2;

            // Trigger Noxious Bloom on Boss death
            if (window.checkAndSpawnNoxiousBloom) {
              window.checkAndSpawnNoxiousBloom(bm, bossCenterX, bossCenterY);
            }

            // Guaranteed 1-3 healing hearts on Boss defeat
            if (typeof window.spawnHomingHearts === "function") {
              let heartHeal = Math.round(p.maxHp * 0.15);
              let numHearts = window.randInt(1, 3);
              for (let h = 0; h < numHearts; h++) {
                window.spawnHomingHearts(
                  bm.x + bm.w / 2,
                  bm.y + bm.h / 2,
                  heartHeal,
                );
              }
            }

            // Boss Material Payload
            if (isMarcus) {
              let peak =
                window.playerStats.lifetimePeakStage ||
                window.playerStats.stage ||
                1;
              let isFloorHighEnough = depth >= peak * 0.85; // 85% of peak required

              if (isFloorHighEnough) {
                let shardsGained = Math.floor(depth / 12) + 2;
                let coresGained = window.randInt(1, 3);
                let sigilsGained = window.randInt(1, 2);

                window.playerStats.astralShards =
                  (window.playerStats.astralShards || 0) + shardsGained;
                window.addEtcDrop("Catalyst Core", coresGained, false);
                window.addEtcDrop("Overlord's Sigil", sigilsGained, false);

                if (typeof window.pushHeaderToast === "function") {
                  window.pushHeaderToast(
                    `✦ SECURED HEIST PAYLOAD: +${shardsGained} Shards, +${coresGained} Cores, +${sigilsGained} Sigils!`,
                    "#ffd700",
                  );
                }
              } else {
                if (typeof window.pushHeaderToast === "function") {
                  window.pushHeaderToast(
                    "[NOTICE] LOW LEVEL ENCOUNTER: Marcus dropped tattered trash. Rob him near Floor " +
                      Math.ceil(peak * 0.85) +
                      "+ for full payloads!",
                    "#888888",
                  );
                }
              }
            } else {
              let soulCount = Math.floor(Math.random() * 4) + 3;
              window.addDungeonRunScrap(
                "Monster Soul",
                soulCount,
                bossCenterX,
                bossCenterY,
              );

              depth = window.player.depth || 1; // Reassigned without 'let' to use the outer scope variable
              let scrapTier = Math.min(5, Math.floor((depth - 1) / 10));
              let scrapName = window.getScrapYieldName(scrapTier);
              window.addDungeonRunScrap(
                scrapName,
                Math.floor(Math.random() * 3) + 2,
                bossCenterX,
                bossCenterY,
              );

              if (
                depth >= 12 &&
                rollEligibleMonsterDrop(
                  0.6,
                  pStats,
                  MONSTER_DROP_DOMAINS.MATERIAL,
                )
              ) {
                window.addDungeonRunScrap(
                  "Eridium Shard",
                  1,
                  bossCenterX,
                  bossCenterY,
                );
              }
            }

            // Cavern Sigil Drop Logic for Bosses
            let isMini = bm.type === "dungeon_miniboss";
            let sigilBaseRate = isMini ? 0.2 : 0.5;
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
              window.spawnGroundLoot(
                sigilItem,
                bm.x + bm.w / 2,
                bm.y + bm.h / 2,
              );
            }

            // Boss Card Drop Roll (10% base chance, multiplied by Drop Rate)
            if (
              rollEligibleMonsterDrop(
                0.1,
                pStats,
                MONSTER_DROP_DOMAINS.CARD,
              )
            ) {
              let cardKey = bm.visualType || bm.type;
              if (window.MONSTER_CARDS_DATA[cardKey]) {
                let cardItem = {
                  id: window.idCounter++,
                  type: "card",
                  cardKey: cardKey,
                  name: window.MONSTER_CARDS_DATA[cardKey].name,
                  statsRolled: 5,
                  stageLevel: depth || 1,
                };
                window.spawnGroundLoot(cardItem, bossCenterX, bossCenterY);
              }
            }

            // Standard On-Stage Boss Equipment Drop (Blocked in Crucible/Onslaught Mode & Special Challenges)
            if (
                          !window.playerStats.isCrucibleMode &&
                          !window.playerStats.activeSpecialChallenge
                        ) {
                          let itemLevel = window.getFloorItemLevel ? window.getFloorItemLevel(depth) : Math.floor(depth / 4) + 1;
                          let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots", "ring"];
                          let chosenType = types[Math.floor(Math.random() * types.length)];
                          let bossEquip;

                          if (isMarcus) {
                            let peak =
                              window.playerStats.lifetimePeakStage ||
                              window.playerStats.stage ||
                              1;
                            let isFloorHighEnough = depth >= peak * 0.85;

                            // High floor rewards highly valuable Legendary (4*) or Mythic (5*) drops. Low floor drops tattered Common (0*) or Rare (1*) items.
                            let rolledRarity = isFloorHighEnough
                              ? Math.random() < 0.35
                                ? 5
                                : 4
                              : Math.random() < 0.5
                                ? 1
                                : 0;
                            bossEquip = window.createItemObject(
                              chosenType,
                              rolledRarity,
                              itemLevel,
                              0,
                            );
                          } else {
                            let rolledRarity = window.rollItemRarity({
                              progressionStage: depth,
                              resolvedQuality: pStats.qly || 1.0,
                              source: window.EQUIPMENT_RARITY_SOURCES.STANDARD_BOSS,
                            });
                            bossEquip = window.createItemObject(
                              chosenType,
                              rolledRarity,
                              itemLevel,
                              0,
                            );
                          }

                          window.spawnGroundLoot(bossEquip, bossCenterX, bossCenterY);
                        }

            // First-Time Boss Clear Key Reward Logic
            let isChallengeActive =
              window.playerStats.activeSpecialChallenge !== null;
            let isCrucible = window.playerStats.isCrucibleMode;

            if (!isChallengeActive && !isCrucible) {
              if (!window.playerStats.firstClearBosses)
                window.playerStats.firstClearBosses = [];
              if (!window.playerStats.firstClearBosses.includes(depth)) {
                window.playerStats.firstClearBosses.push(depth);
                let isMajorBoss = depth % 12 === 0;

                // Direct to Vault
                window.addEtcDrop("Gacha Key", 1, false);
                if (isMajorBoss) {
                  window.addEtcDrop("Glimmering Gachapon Key", 1, false);
                }

                if (typeof window.pushHeaderToast === "function") {
                  let toastMsg = isMajorBoss
                    ? "FIRST CLEAR BONUS: +1 Gacha Key & +1 Glimmering Key (Vaulted)!"
                    : "FIRST CLEAR BONUS: +1 Gacha Key (Vaulted)!";
                  window.pushHeaderToast(toastMsg, "#f1c40f");
                }

                // Guaranteed locked-power (50% strength) artifact on Floor 12 (Sector 1 Boss) first clear
                if (depth === 12) {
                  let guaranteedArtifact = window.createItemObject(
                    "artifact",
                    1,
                    2,
                    0,
                  );
                  guaranteedArtifact.relicPower = 0.5;
                  guaranteedArtifact.name = `${guaranteedArtifact.name.split(" (")[0]} (Clamped) (Lv. 2)`;
                  if (window.recalculateItemStats) {
                    window.recalculateItemStats(guaranteedArtifact);
                  }

                  let artifactDelivery = "Vaulted";
                  if (window.currentGameState === window.GAME_STATES.HUB) {
                    if (!window.inventory.ARTIFACT)
                      window.inventory.ARTIFACT = [];
                    window.inventory.ARTIFACT.push(guaranteedArtifact);
                  } else {
                    let wasCarried =
                      typeof window.addToRunSatchel === "function" &&
                      window.addToRunSatchel(guaranteedArtifact, {
                        notify: false,
                      });
                    if (wasCarried) {
                      artifactDelivery = "Added to Carried Satchel";
                    } else {
                      artifactDelivery = "Satchel full — left on the ground";
                      window.spawnGroundLoot(
                        guaranteedArtifact,
                        bossCenterX,
                        bossCenterY,
                      );
                    }
                  }

                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast(
                      `✦ FIRST CLEAR BONUS: ${guaranteedArtifact.name} — ${artifactDelivery}.`,
                      "#1abc9c",
                    );
                  }
                }
              }
            }

            if (window.hasUniquePassive("boots_warpcore")) {
              window.playerStats.warpCoreSprintTimer = 240; // 4 seconds of Maximum Haste
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 25,
                  "WARP-CORE MAX HASTE!",
                  "#1abc9c",
                );
              }

              // Unique: Warp-Core Greaves (Spatial Leap Portal Drop on Boss Defeat)
              if (Math.random() < 0.2) {
                let map = activeDungeonMap;
                let tSize = map ? map.tileSize : 32;
                let tileX = Math.floor(bossCenterX / tSize);
                let tileY = Math.floor(bossCenterY / tSize);
                if (
                  map &&
                  map.grid &&
                  map.grid[tileY] &&
                  map.grid[tileY][tileX] !== undefined
                ) {
                  map.grid[tileY][tileX] = window.TILE_TYPES.DESCENT_PORTAL;
                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast(
                      "[✦] SPATIAL RIFT OPENED!",
                      "#1abc9c",
                    );
                  }
                }
              }
            }

            let tileX = bm.bossTileX || Math.floor(bm.x / 32);
            let tileY = bm.bossTileY || Math.floor(bm.y / 32);
            setPrimaryMob(null);
            if (isMarcus) {
              window.completeMarcusRobberyDefeat();
            } else {
              window.onBossDefeated(tileX, tileY);
            }
          }
        }
      }
    }

  };
