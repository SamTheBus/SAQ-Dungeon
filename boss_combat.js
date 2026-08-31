import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import {
  getActiveDungeonMobs,
  removeActiveDungeonMobById,
  setPrimaryMob,
} from "./encounter_state.js?v=1.004";
import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";
import {
  isOverkillHit,
  updateFinitePeakHit,
} from "./combat_scaling.js?v=1.001";

  export const updateBossCombat = function (
    p,
    pStats,
    activeDungeonMap = getActiveDungeonMap(),
  ) {
    // Process Boss Warden Combat
    if (window.mob && window.mob.hp) {
      let bm = window.mob;
      window.BossAIEngine.update(bm, activeDungeonMap);

      let dx = p.x - (bm.x + bm.w / 2);
      let dy = p.y - (bm.y + bm.h / 2);
      let dist = Math.hypot(dx, dy);

      if (dist < 48 && p.attackTimer >= 20) {
        p.attackTimer = 0;

        // Transition into active combat state
        if (typeof window.triggerCombatState === "function") {
          window.triggerCombatState();
        }

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("swing");
        }

        let bossCenterX = bm.x + bm.w / 2;
        // Face the boss being attacked!
        let dxToBoss = bossCenterX - p.x;
        if (dxToBoss < -0.1) p.facing = -1;
        else if (dxToBoss > 0.1) p.facing = 1;

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
          let slotLvl = window.getArtifactTemperLevel
            ? window.getArtifactTemperLevel("synergy_sanguine")
            : 0;
          let slotMult = 1.0 + slotLvl * 0.01;
          let uniqueDoTs = 0;
          if ((bm.poisonStacks || 0) > 0) uniqueDoTs++;
          if ((bm.bleedStacks || 0) > 0) uniqueDoTs++;
          if ((bm.burnStacks || 0) > 0 || bm.isBurning) uniqueDoTs++;
          let multiplier = 1.0 + 0.08 * uniqueDoTs * slotMult;
          pAtk = pAtk.mul(multiplier);
        }

        // Track Critical Streaks for Wind-Razor Flurry (Boss)
        let windFlurryLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
          : 0;
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

        // Roll bleed from dagger base bleedChance
        if (pStats.bleedChance && pStats.bleedChance > 0) {
          if (Math.random() < pStats.bleedChance) {
            bm.bleedStacks = Math.min(5, (bm.bleedStacks || 0) + 1);
            bm.dotTickTimer = bm.dotTickTimer || 0;
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

        if (
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
        if (pStats.subType === "dagger") {
          let finalOffhandChance = pStats.offhandChance || 0.35;
          if (Math.random() < finalOffhandChance) {
            let offhandDmgMult = pStats.offhandDmgMultiplier || 1.0;
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

            // Roll bleed from dagger base bleedChance
            if (pStats.bleedChance && pStats.bleedChance > 0) {
              if (Math.random() < pStats.bleedChance) {
                bm.bleedStacks = Math.min(5, (bm.bleedStacks || 0) + 1);
                bm.dotTickTimer = bm.dotTickTimer || 0;
              }
            }

            // 1. Viper's Coating
            let vipersLvl = pStats.vipersCoatingLvl || 0;
            if (vipersLvl > 0) {
              bm.poisonStacks = Math.min(5, (bm.poisonStacks || 0) + 1);
              bm.poisonLevel = vipersLvl;
              bm.dotTickTimer = bm.dotTickTimer || 0;

              let bleedChance = vipersLvl * 0.05;
              if (Math.random() < bleedChance) {
                bm.bleedStacks = Math.min(5, (bm.bleedStacks || 0) + 1);
              }

              // Shadow Assassin Keystone check at 5 stacks
              if (pStats.hasKeystoneAssassin && bm.poisonStacks >= 5) {
                bm.poisonStacks = 0; // consume
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
              (pStats.offhandDmg || 0.45) * 1.5,
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

        if (
          (bm.poisonStacks && bm.poisonStacks > 0) ||
          (bm.bleedStacks && bm.bleedStacks > 0)
        ) {
          bm.dotTickTimer = (bm.dotTickTimer || 0) + 1;
          if (bm.dotTickTimer >= 60) {
            bm.dotTickTimer = 0;
            let baseAtk = pStats.atk || p.atk || 15;

            if (bm.poisonStacks && bm.poisonStacks > 0) {
              let poisonPower = 0.1 * (bm.poisonLevel || 1);
              if (pStats.poisonDamageMultiplier)
                poisonPower *= pStats.poisonDamageMultiplier;
              let pDmg = BigNum.from(baseAtk)
                .mul(poisonPower)
                .mul(bm.poisonStacks);
              bm.hp = bm.hp.sub(pDmg);
              bm.flashTimer = 4;
              if (window.combatVisuals) {
                window.combatVisuals.spawnDamageEffect(
                  bm.x + bm.w / 2,
                  bm.y + bm.h / 2,
                  pDmg,
                  "poison",
                  false,
                  bm,
                );
              }
            }

            if (bm.bleedStacks && bm.bleedStacks > 0) {
              let bleedPower = 0.05;
              if (pStats.bleedDamageMultiplier)
                bleedPower *= pStats.bleedDamageMultiplier;
              let bDmg = BigNum.from(baseAtk)
                .mul(bleedPower)
                .mul(bm.bleedStacks);
              bm.hp = bm.hp.sub(bDmg);
              bm.flashTimer = 4;
              if (window.combatVisuals) {
                window.combatVisuals.spawnDamageEffect(
                  bm.x + bm.w / 2,
                  bm.y + bm.h / 2,
                  bDmg,
                  "bleed",
                  false,
                  bm,
                );
              }
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
        let activeSpellType = pStats.spellType || "tri";

        if (isTomeEquipped && Math.random() < activeSpellChance) {
          // Gain +3 Tome Mastery XP on Spell Proc (Buffed) (Boss)
          if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 3);

          let spellDmg = BigNum.from(pStats.atk || 15).mul(
            pStats.spellPower || 1.5,
          );
          bm.hp = bm.hp.sub(spellDmg);
          bm.flashTimer = 8;

          let spellEffectType = activeSpellType;
          if (activeSpellType === "tri") {
            const triElements = ["fire", "lightning", "frost"];
            spellEffectType =
              triElements[Math.floor(Math.random() * triElements.length)];
          } else if (activeSpellType === "dual_fire_lightning") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "lightning";
          } else if (activeSpellType === "dual_fire_frost") {
            spellEffectType = Math.random() < 0.5 ? "fire" : "frost";
          } else if (activeSpellType === "dual_lightning_frost") {
            spellEffectType = Math.random() < 0.5 ? "lightning" : "frost";
          }

          // Trigger actual visual spells (Boss)
          if (
            pStats.hasTriadConvergence ||
            (window.SkillTreeManager &&
              window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
              Math.random() < 0.15)
          ) {
            if (window.castVisualSpell) {
              window.castVisualSpell("fire", p, bm, pStats, true);
              window.castVisualSpell("lightning", p, bm, pStats, true);
              window.castVisualSpell("frost", p, bm, pStats, true);
            }
          } else {
            if (window.castVisualSpell) {
              window.castVisualSpell(
                spellEffectType,
                p,
                bm,
                pStats,
                pStats.hasElementalOverload,
              );
            }
          }

          // Spell Weaving (Boss)
          if (pStats.hasSpellWeaving) {
            if (
              window.playerStats.lastSpellCastType &&
              window.playerStats.lastSpellCastType !== spellEffectType
            ) {
              window.playerStats.spellWeavingStacks = Math.min(
                4,
                (window.playerStats.spellWeavingStacks || 0) + 1,
              );
              window.playerStats.spellWeavingTimer = 240;
            }
            window.playerStats.lastSpellCastType = spellEffectType;
          }

          // Arcane Syphon (Boss)
          if (pStats.hasArcaneSyphon) {
            let healAmt = Math.round(
              p.maxHp * (pStats.arcaneSyphonLevel * 0.01),
            );
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            window.playerStats.syphonIntStacks = Math.min(
              3,
              (window.playerStats.syphonIntStacks || 0) + 1,
            );
            window.playerStats.syphonIntTimer = 360;
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `+${healAmt} HP (SYPHON)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Mana Shielding (Restored original Tome heal on spell proc - Boss)
          if (pStats.manaShieldingHeal && pStats.manaShieldingHeal > 0) {
            let healAmt = Math.round(p.maxHp * pStats.manaShieldingHeal);
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `+${healAmt} HP (MANA SHIELD)`,
                "#2ecc71",
                true,
              );
            }
          }

          // Triad Convergence / Aetheric Overload Check (Boss)
          let isOverload =
            window.SkillTreeManager &&
            window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
            Math.random() < 0.15;

          if (pStats.hasTriadConvergence || isOverload) {
            const triElements = ["fire", "lightning", "frost"];
            triElements.forEach((elem, eIdx) => {
              bm.hp = bm.hp.sub(spellDmg);
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  bossCenterX + (eIdx - 1) * 12,
                  bossCenterY - 12 - eIdx * 6,
                  spellDmg,
                  elem,
                  false,
                );
              }

              if (pStats.hasElementalOverload || elem === "lightning") {
                if (elem === "fire" && pStats.hasElementalOverload) {
                  let splashDmg = spellDmg.mul(
                    pStats.overloadLevel === 1 ? 0.35 : 0.7,
                  );
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      let dist = Math.hypot(
                        bm.x - otherMob.x,
                        bm.y - otherMob.y,
                      );
                      if (dist <= 100 && isPlayerTargetableMob(otherMob)) {
                        otherMob.hp = otherMob.hp.sub(splashDmg);
                        otherMob.flashTimer = 6;
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnDamageEffect(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            splashDmg,
                            "fire",
                            false,
                          );
                        }
                      }
                    });
                  }
                } else if (elem === "lightning") {
                  let bouncesLeft = 1 + (pStats.overloadLevel || 0); // Chains exactly 1 time by default, scales higher with overload
                  let hitIds = new Set();
                  let currentTarget = bm;
                  while (bouncesLeft > 0 && window.activeDungeonMobs) {
                    let nextTarget = window.activeDungeonMobs.find(
                      (other) =>
                        !hitIds.has(other.id) &&
                        isPlayerTargetableMob(other) &&
                        Math.hypot(
                          currentTarget.x +
                            (currentTarget.w || 24) / 2 -
                            (other.x + (other.w || 24) / 2),
                          currentTarget.y +
                            (currentTarget.h || 24) / 2 -
                            (other.y + (other.h || 24) / 2),
                        ) <= 120,
                    );
                    if (nextTarget) {
                      nextTarget.hp = nextTarget.hp.sub(spellDmg);
                      nextTarget.flashTimer = 6;
                      hitIds.add(nextTarget.id);
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnDamageEffect(
                          nextTarget.x + nextTarget.w / 2,
                          nextTarget.y + nextTarget.h / 2,
                          spellDmg,
                          "lightning",
                          false,
                        );
                      }
                      // Spawn physical, crackling procedural cavern lightning arc lines
                      window.cavernInteractives =
                        window.cavernInteractives || [];
                      window.cavernInteractives.push({
                        id: window.idCounter++,
                        type: "lightning_arc",
                        x: currentTarget.x + (currentTarget.w || 24) / 2,
                        y: currentTarget.y + (currentTarget.h || 24) / 2,
                        x2: nextTarget.x + (nextTarget.w || 24) / 2,
                        y2: nextTarget.y + (nextTarget.h || 24) / 2,
                        life: 15,
                      });
                      currentTarget = nextTarget;
                      bouncesLeft--;
                    } else {
                      break;
                    }
                  }
                } else if (elem === "frost" && pStats.hasElementalOverload) {
                  let slowPct = pStats.overloadLevel === 1 ? 0.2 : 0.4;
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      if (
                        isPlayerTargetableMob(otherMob) &&
                        Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y) <= 100
                      ) {
                        otherMob.speedMultiplier = Math.max(
                          0.2,
                          (otherMob.speedMultiplier || 1.0) - slowPct,
                        );
                        if (window.combatVisuals) {
                          window.combatVisuals.spawnParticles(
                            otherMob.x + otherMob.w / 2,
                            otherMob.y + otherMob.h / 2,
                            8,
                            "void_orb",
                            1,
                          );
                        }
                      }
                    });
                  }
                }
              }
            });
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_fire");
            }
          } else {
            if (pStats.hasElementalOverload) {
                            if (spellEffectType === "fire") {
                              let splashDmg = spellDmg.mul(
                                pStats.overloadLevel === 1 ? 0.35 : 0.7,
                              );
                              let splashRadius = 100 * (pStats.areaRadiusMult || 1.0);
                              if (window.activeDungeonMobs) {
                                window.activeDungeonMobs.forEach((otherMob) => {
                                  let dist = Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y);
                                  if (
                                    dist <= splashRadius &&
                                    isPlayerTargetableMob(otherMob)
                                  ) {
                      otherMob.hp = otherMob.hp.sub(splashDmg);
                      otherMob.flashTimer = 6;
                      if (window.combatVisuals) {
                        window.combatVisuals.spawnDamageEffect(
                          otherMob.x + otherMob.w / 2,
                          otherMob.y + otherMob.h / 2,
                          splashDmg,
                          "fire",
                          false,
                        );
                      }
                    }
                  });
                }
              } else if (spellEffectType === "lightning") {
                              let bouncesLeft = pStats.overloadLevel;
                              let hitIds = new Set();
                              let currentTarget = bm;
                              let chainSearchR = 120 * (pStats.areaRadiusMult || 1.0);
                              while (bouncesLeft > 0 && window.activeDungeonMobs) {
                                let nextTarget = window.activeDungeonMobs.find(
                                  (other) =>
                                    !hitIds.has(other.id) &&
                                    isPlayerTargetableMob(other) &&
                                    Math.hypot(
                                      currentTarget.x - other.x,
                                      currentTarget.y - other.y,
                                    ) <= chainSearchR,
                                );
                  if (nextTarget) {
                    nextTarget.hp = nextTarget.hp.sub(spellDmg);
                    nextTarget.flashTimer = 6;
                    hitIds.add(nextTarget.id);
                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        nextTarget.x + nextTarget.w / 2,
                        nextTarget.y + nextTarget.h / 2,
                        spellDmg,
                        "lightning",
                        false,
                      );
                    }
                    currentTarget = nextTarget;
                    bouncesLeft--;
                  } else {
                    break;
                  }
                }
              } else if (spellEffectType === "frost") {
                              // Inherent 15% slow on Boss
                              bm.speedMultiplier = Math.max(0.2, (bm.speedMultiplier || 1.0) - 0.15);

                              let slowPct = pStats.hasElementalOverload ? (pStats.overloadLevel === 1 ? 0.25 : 0.4) : 0.15;
                                                            let novaRadius = 100 * (pStats.areaRadiusMult || 1.0);

                              if (window.activeDungeonMobs && (pStats.hasElementalOverload || (pStats.spellRadiusMult || 1.0) > 1.0)) {
                                window.activeDungeonMobs.forEach((otherMob) => {
                                  if (
                                    isPlayerTargetableMob(otherMob) &&
                                    Math.hypot(bm.x - otherMob.x, bm.y - otherMob.y) <= novaRadius
                                  ) {
                                    otherMob.speedMultiplier = Math.max(
                                      0.2,
                                      (otherMob.speedMultiplier || 1.0) - slowPct,
                                    );
                                    let frostSplashDmg = spellDmg.mul(0.25);
                                    otherMob.hp = otherMob.hp.sub(frostSplashDmg);
                                    otherMob.flashTimer = 5;

                                    if (window.combatVisuals) {
                                      window.combatVisuals.spawnDamageEffect(
                                        otherMob.x + otherMob.w / 2,
                                        otherMob.y + otherMob.h / 2,
                                        frostSplashDmg,
                                        "frost",
                                        false,
                                      );
                                    }
                                  }
                                });
                              }
                            }
            }

            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_" + spellEffectType);
            }
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                bossCenterX,
                bossCenterY - 12,
                spellDmg,
                spellEffectType,
                false,
              );
            }
          }
        }

        if (bm.hp.lte(0)) {
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

              if (depth >= 12 && Math.random() < 0.6) {
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
            let sigilRollRate = sigilBaseRate * (pStats.drop || 1.0);
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
            let dropMult = pStats.drop || 1.0;
            if (Math.random() < 0.1 * dropMult) {
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
                            let rolledRarity = window.rollItemRarity(
                              depth,
                              pStats.qly || 1.0,
                              false,
                            );
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

                  if (window.currentGameState === window.GAME_STATES.HUB) {
                    if (!window.inventory.ARTIFACT)
                      window.inventory.ARTIFACT = [];
                    window.inventory.ARTIFACT.push(guaranteedArtifact);
                  } else {
                    if (!window.player.bag) window.player.bag = [];
                    window.player.bag.push(guaranteedArtifact);
                  }

                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast(
                      `✦ FIRST CLEAR BONUS: Gained Clamped ${guaranteedArtifact.name}!`,
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
            window.onBossDefeated(tileX, tileY);
          }
        }
      }
    }

  };
