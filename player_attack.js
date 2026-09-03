import { isPlayerTargetableMob } from "./combat_factions.js";
import {
  isOverkillHit,
  updateFinitePeakHit,
} from "./combat_scaling.js";
import { isActiveAttackReady } from "./attack_speed_contract.js";
import { awardMainAttackMasteryXp } from "./mastery_authority.js";
import {
  applyPlayerBleed,
  applyPlayerPoison,
  clearPeriodicEffect,
  getActivePeriodicEffectCount,
  resolveOnHitArtifactEffects,
} from "./combat_effect_authority.js";
import { isTomeCombatProfile } from "./combat_reach.js";
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

  export const resolvePlayerAttack = function (
    p,
    pStats,
    closestTarget,
    options = {},
  ) {
    const tomeProjectileImpact = options.tomeProjectileImpact === true;
    if (
      closestTarget &&
      (tomeProjectileImpact || isActiveAttackReady(p.attackTimer, pStats))
    ) {
      if (!tomeProjectileImpact) {
        p.attackTimer = 0;
        window.hero.slashTimer = 8; // Trigger 8-frame slash animation arc

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("swing");
        }

        // Face the target being attacked!
        let dxToTarget = closestTarget.x - p.x;
        if (dxToTarget < -0.1) p.facing = -1;
        else if (dxToTarget > 0.1) p.facing = 1;
      }

      if (closestTarget.type === "mob") {
        let m = closestTarget.obj;
        if (!isPlayerTargetableMob(m)) return;

        if (
          !tomeProjectileImpact &&
          isTomeCombatProfile(pStats, window.equippedSlots?.subweapon)
        ) {
          if (typeof window.triggerCombatState === "function") {
            window.triggerCombatState();
          }
          return launchTomeAttackProjectile({
            player: p,
            playerStats: pStats,
            target: m,
            map: window.activeDungeonMap,
          });
        }

        m.lastHitTime = window.logicClock; // Set hit timestamp for regenerative brood tracking

        // Transition into active combat state
        if (typeof window.triggerCombatState === "function") {
          window.triggerCombatState();
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

        // Synergy Sanguine DoT damage scaling (+8% damage per Poison, Bleed, Burn)
        if (window.checkArtifactTrait("synergy_sanguine")) {
          let uniqueDoTs = getActivePeriodicEffectCount(m);
          let perEffect = window.scaleArtifactMechanic
            ? window.scaleArtifactMechanic("synergy_sanguine", 0.08)
            : 0.08;
          let multiplier = 1.0 + perEffect * uniqueDoTs;
          pAtk = pAtk.mul(multiplier);
        }

        // --- SUBPHASE 7: KINETIC REFLECTORS CONE CHECK ---
        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("kinetic_reflectors") &&
          !m.isFriendlyWisp
        ) {
          let isFrontal =
            (m.facing === -1 && p.x < m.x + m.w / 2) ||
            (m.facing === 1 && p.x > m.x + m.w / 2);
          if (isFrontal) {
            m.flashTimer = 4;
            let reflectedDmg = pAtk.mul(0.2).round().toFiniteNumber();
            window.damagePlayer(reflectedDmg, m);
            if (window.SoundManager) window.SoundManager.play("block");
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                6,
                "animated_armor",
                2.2,
              );
              window.spawnFloatingText(
                m.x + m.w / 2,
                m.y - 12,
                "DEFLECTED!",
                "#00d2ff",
              );
            }
            return; // Skip standard damage resolution
          }
        }
        // -------------------------------------------------

        let finalDmg = pAtk;
        if (m.shredPercent && m.shredPercent > 0) {
          finalDmg = finalDmg.mul(1 + m.shredPercent);
        }
        m.hp = m.hp.sub(finalDmg);
        m.hasTakenDamage = true;
        m.flashTimer = 6;
        awardMainAttackMasteryXp();
        resolveSuccessfulShieldMainAttack({
          player: p,
          playerStats: window.playerStats,
          resolvedStats: pStats,
          target: m,
        });
        const setCapstoneResult = resolveCanonicalSetCapstoneAttackAction({
          target: m,
          player: p,
          resolvedStats: pStats,
          isCritical: isCrit,
          frame: window.logicClock,
        });
        presentSetCapstoneAttackAction(setCapstoneResult, m);

        // Roll bleed from dagger base bleedChance
        if (canApplyDaggerMainBleed({ resolvedStats: pStats })) {
          if (Math.random() < pStats.bleedChance) {
            const bleedEffect = applyPlayerBleed(m, pStats, {
              mechanic: "dagger_main_bleed",
            });
            if (bleedEffect) {
              window.spawnMeleeFeelImpact?.(
                m.x + (m.w || 24) / 2,
                m.y + (m.h || 24) / 2,
                "dagger",
                false,
                "bleed",
              );
            }
          }
        }

        // Track Critical Streaks for Wind-Razor Flurry
        let windFlurryLevel = pStats.windRazorFlurryLevel || 0;
        if (windFlurryLevel > 0) {
          if (isCrit) {
            window.playerStats.critStreak =
              (window.playerStats.critStreak || 0) + 1;
            if (window.playerStats.critStreak >= 3) {
              window.playerStats.critStreak = 0;
              window.triggerWindRazorStrike(m);
            }
          } else {
            window.playerStats.critStreak = 0; // Reset streak on non-crit
          }
        }

        if (
          window.isCavernEffectActive &&
          window.isCavernEffectActive("temporal_echo")
        ) {
          window.temporalEchoQueue = window.temporalEchoQueue || [];
          window.temporalEchoQueue.push({
            targetId: m.id,
            damage: pAtk.mul(0.35),
            timer: 72, // 1.2s delay
          });
        }

        let mobCenterX = closestTarget.x;
        let mobCenterY = closestTarget.y;

        // --- ACTIVE ONSLAUGHT CARD TRIGGER EXECUTIONS ---

        // Unstable Combustion: Splash explosion + self-backlash on Critical Strikes
        if (pStats.crucibleCritSplash && isCrit) {
                  let splashDmg = pAtk.mul(pStats.crucibleCritSplash);
                  let splashRadius = 80 * (pStats.areaRadiusMult || 1.0);
                  if (window.activeDungeonMobs) {
                    window.activeDungeonMobs.forEach((otherMob) => {
                      if (
                        otherMob.id !== m.id &&
                        isPlayerTargetableMob(otherMob)
                      ) {
                        let sDist = Math.hypot(m.x - otherMob.x, m.y - otherMob.y);
                        if (sDist <= splashRadius) {
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
              }
            });
          }
          if (pStats.crucibleBacklash) {
            let backlashVal = pAtk
              .mul(pStats.crucibleBacklash)
              .round()
              .toFiniteNumber();
            p.hp = Math.max(1, p.hp - backlashVal);
            window.spawnFloatingText(
              p.x,
              p.y - 12,
              `-${backlashVal} BACKLASH`,
              "#e74c3c",
              true,
            );
          }
        }

        // Mirage Array: Delayed 40% Ghost Slash clone mimicry
        if (pStats.hasMirageArray) {
          let ghostDmg = pAtk.mul(0.4);
          setTimeout(() => {
            if (m && m.hp && m.hp.gt(0)) {
              m.hp = m.hp.sub(ghostDmg);
              m.flashTimer = 6;
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  m.x + m.w / 2,
                  m.y + m.h / 2,
                  ghostDmg,
                  "echo",
                  false,
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  m.x + m.w / 2,
                  m.y + m.h / 2,
                  6,
                  "calamity_specter",
                  1.5,
                );
              }
            }
          }, 150);
        }

        // Thunderlord's Backlash: Every 10th hit strikes 3 targets for 400% Dmg + 5% feedback
        if (pStats.hasThunderBacklash) {
          window.playerStats.thunderlordCount =
            (window.playerStats.thunderlordCount || 0) + 1;
          if (window.playerStats.thunderlordCount >= 10) {
            window.playerStats.thunderlordCount = 0;
            let boltDmg = pAtk.mul(4.0);
            let hitCount = 0;
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((otherMob) => {
                if (hitCount < 3 && isPlayerTargetableMob(otherMob)) {
                  let sDist = Math.hypot(
                    p.x - (otherMob.x + otherMob.w / 2),
                    p.y - (otherMob.y + otherMob.h / 2),
                  );
                  if (sDist <= 150) {
                    otherMob.hp = otherMob.hp.sub(boltDmg);
                    otherMob.flashTimer = 8;
                    hitCount++;
                    if (window.combatVisuals) {
                      window.combatVisuals.spawnBeam(
                        otherMob.x + otherMob.w / 2,
                        "#00ffff",
                        30,
                        false,
                      );
                      window.combatVisuals.spawnDamageEffect(
                        otherMob.x + otherMob.w / 2,
                        otherMob.y + otherMob.h / 2,
                        boltDmg,
                        "lightning",
                        true,
                      );
                    }
                  }
                }
              });
            }
            if (hitCount < 3 && isPlayerTargetableMob(window.mob)) {
              let bm = window.mob;
              bm.hp = bm.hp.sub(boltDmg);
              bm.flashTimer = 8;
              hitCount++;
              if (window.combatVisuals) {
                window.combatVisuals.spawnBeam(
                  bm.x + bm.w / 2,
                  "#00ffff",
                  30,
                  false,
                );
                window.combatVisuals.spawnDamageEffect(
                  bm.x + bm.w / 2,
                  bm.y + bm.h / 2,
                  boltDmg,
                  "lightning",
                  true,
                );
              }
            }
            if (hitCount > 0) {
              let feedbackVal = boltDmg.mul(0.05).round().toFiniteNumber();
              p.hp = Math.max(1, p.hp - feedbackVal);
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `-${feedbackVal} FEEDBACK`,
                "#a855f7",
                true,
              );
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("spell_lightning");
              }
            }
          }
        }

        window.playerStats.peakSingleHit = updateFinitePeakHit(
          window.playerStats.peakSingleHit,
          pAtk,
        );

        if (isCrit && isOverkillHit(pAtk, m.maxHp)) {
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

        mobCenterX = closestTarget.x;
        mobCenterY = closestTarget.y;
        let dx = closestTarget.x - p.x;
        let dy = closestTarget.y - p.y;
        let dist = Math.hypot(dx, dy);

        if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
          window.RenderEngine.spawnDamageEffect(
            mobCenterX,
            mobCenterY,
            pAtk,
            "slash",
            isCrit,
          );
        }

        const onHitArtifacts = resolveOnHitArtifactEffects({
          target: m,
          damage: pAtk,
          player: p,
        });
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
        let specializedImpact = false;
        if (pStats.subType === "dagger" || pStats.subType === "shield") {
          window.spawnMeleeFeelImpact?.(
            mobCenterX,
            mobCenterY,
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
          window.spawnTomeImpactVisual?.(mobCenterX, mobCenterY, "arcane", {
            phase: "impact",
            isCrit,
          });
          specializedImpact = typeof window.spawnTomeImpactVisual === "function";
        }
        if (onHitArtifacts.echoProc) {
          if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
            window.RenderEngine.spawnDamageEffect(
              mobCenterX,
              mobCenterY - 8,
              onHitArtifacts.echoDamage,
              "echo",
              false,
            );
          }
        }

        // Unique: Sanguine Reaver (Sword Bleed Rupture)
        if (window.hasUniquePassive("weapon_sword")) {
          const reaverBleed = applyPlayerBleed(m, pStats, {
            durationFrames: 300,
            mechanic: "sanguine_reaver",
          });
          if (reaverBleed && reaverBleed.stacks >= 5) {
            clearPeriodicEffect(m, "bleed");
            let ruptureDmg = BigNum.from(pStats.atk || p.atk || 15).mul(3.0);
            m.hp = m.hp.sub(ruptureDmg);
            let siphonedHp = Math.round(p.maxHp * 0.1);
            p.hp = Math.min(p.maxHp, p.hp + siphonedHp);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY,
                ruptureDmg,
                "crit",
                true,
              );
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 20,
                `+${siphonedHp} HP (RUPTURE)`,
                "#2ecc71",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                mobCenterX,
                mobCenterY,
                20,
                "magma_elemental",
                4,
              );
            }
          }
        }

        // Unique: Maelstrom Gale-Glaive (Wind Gales & Speed Stacks)
        if (isCrit && window.hasUniquePassive("weapon_maelstrom")) {
          window.playerStats.maelstromSpeedStacks = Math.min(
            3,
            (window.playerStats.maelstromSpeedStacks || 0) + 1,
          );
          window.playerStats.maelstromSpeedTimer = 360;
          window.playerStats.galeResonanceTimer = 360;

          let speed = 5.0;
          let galeDirection = dx < 0 ? -1 : dx > 0 ? 1 : p.facing || 1;
          window.projectiles.push({
            x: p.x,
            y: p.y - 8,
            vx: galeDirection * speed,
            vy: 0,
            r: 8,
            type: "maelstrom",
            owner: "player",
            damage: pAtk.mul(0.6).round(),
            life: 140,
          });
        }

        // Unique: Viper's Perfect Stiletto (Reticle Trigger)
        if (
          isCrit &&
          window.hasUniquePassive("dagger_viper") &&
          Math.random() < 0.25
        ) {
          m.perfectStrikeTimer = 120;
          m.perfectStrikeMax = 120;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Viper's Reticle active! Tap target to execute!",
              "#a855f7",
            );
          }
        }

        // Unique: Void-Sovereign Greatsword (Gravitational Room Vacuum)
        if (window.hasUniquePassive("weapon_singularity")) {
          window.triggerGravitationalVacuum(p);
        }

        // Artifact: Dread Presence (25% Chance to execute non-boss mobs under 20% HP)
        let isBossTarget =
          m.type === "dungeon_boss" || m.type === "dungeon_miniboss";
        if (
          window.checkArtifactTrait("dread_presence") &&
          !isBossTarget &&
          m.hp.gt(0)
        ) {
          let mobHpRatio = m.hp.div(m.maxHp).valueOf();
          if (mobHpRatio <= 0.2 && Math.random() < 0.25) {
            let remHp = m.hp;
            m.hp = BigNum.from(0);
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY,
                remHp,
                "crit",
                true,
              );
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                mobCenterX,
                mobCenterY - 15,
                "EXECUTE!",
                "#e74c3c",
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                mobCenterX,
                mobCenterY,
                15,
                "magma_elemental",
                4,
              );
              window.combatVisuals.triggerScreenShake(5, 10);
            }
          }
        }

        // Dagger Offhand Multi-Strike & DoT Application (Blocked if Nullifier Disrupted)
        if (canExecuteDaggerOffhand({ resolvedStats: pStats })) {
          let finalOffhandChance = p.nullifierDisrupted
            ? 0
            : pStats.offhandChance || 0.35;
          if (Math.random() < finalOffhandChance) {
            let offhandDmgMult = pStats.offhandDamageMultiplier || 1.0;
            let offhandHit = BigNum.from(pStats.atk || 15).mul(
              (pStats.offhandDmg || 0.45) * offhandDmgMult,
            );
            m.hp = m.hp.sub(offhandHit);

            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 6,
                offhandHit,
                "dagger",
                false,
                m,
              );
            }
            window.spawnMeleeFeelImpact?.(
              mobCenterX,
              mobCenterY - 6,
              "dagger",
              true,
            );

            // Roll bleed from dagger base bleedChance
            if (pStats.bleedChance && pStats.bleedChance > 0) {
              if (Math.random() < pStats.bleedChance) {
                const bleedEffect = applyPlayerBleed(m, pStats, {
                  mechanic: "dagger_offhand_bleed",
                });
                if (bleedEffect) {
                  window.spawnMeleeFeelImpact?.(
                    mobCenterX,
                    mobCenterY - 6,
                    "dagger",
                    true,
                    "bleed",
                  );
                }
              }
            }

            // 1. Viper's Coating (Apply Stacking Poison & Bleeding)
            let vipersLvl = pStats.vipersCoatingLvl || 0;
            if (
              vipersLvl > 0 &&
              canApplyVipersCoating({ resolvedStats: pStats })
            ) {
              const poisonEffect = applyPlayerPoison(m, pStats, {
                rank: vipersLvl,
                mechanic: "vipers_coating",
              });
              if (poisonEffect) {
                window.spawnMeleeFeelImpact?.(
                  mobCenterX,
                  mobCenterY,
                  "dagger",
                  true,
                  "poison",
                );
              }

              let bleedChance = vipersLvl * 0.05;
              if (Math.random() < bleedChance) {
                applyPlayerBleed(m, pStats, { mechanic: "vipers_coating_bleed" });
              }

              // Shadow Assassin Keystone check at 5 stacks
              if (pStats.hasKeystoneAssassin && poisonEffect?.stacks >= 5) {
                clearPeriodicEffect(m, "poison");
                let flurryStrike = BigNum.from(pStats.atk || 15);
                for (let s = 0; s < 3; s++) {
                  m.hp = m.hp.sub(flurryStrike);
                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(
                      mobCenterX + (s - 1) * 8,
                      mobCenterY,
                      flurryStrike,
                      "dagger",
                      true,
                      m,
                    );
                  }
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    mobCenterX,
                    mobCenterY - 15,
                    "SHADOW FLURRY!",
                    "#a855f7",
                  );
                }
              }
            }

            // 2. Expose Weakness (Armor/Defense shred)
            let exposeLvl = pStats.exposeWeaknessLvl || 0;
            if (exposeLvl > 0) {
              m.shredTimer = 300;
              m.shredPercent = exposeLvl * 0.04;
              if (
                typeof window.spawnFloatingText === "function" &&
                Math.random() < 0.2
              ) {
                window.spawnFloatingText(
                  mobCenterX,
                  mobCenterY - 20,
                  "WEAKNESS EXPOSED!",
                  "#df9ffb",
                );
              }
            }
          }

          // 3. Shadow Flurry (Crit proc Offhand Strike)
          if (isCrit && pStats.hasShadowFlurry) {
            let flurryDmg = BigNum.from(pStats.atk || 15).mul(
              (pStats.offhandDmg || 0.45) *
                (pStats.offhandFlurryDamageMultiplier || 1) *
                1.5,
            );
            m.hp = m.hp.sub(flurryDmg);
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 4,
                flurryDmg,
                "dagger",
                true,
                m,
              );
            }
          }
        }

        // Tome Spell Cast Trigger (Blocked if Nullifier Disrupted)
        let isTomeEquipped =
          pStats.subType === "tome" ||
          (window.equippedSlots &&
            window.equippedSlots.subweapon &&
            (window.equippedSlots.subweapon.subType === "tome" ||
              window.equippedSlots.subweapon.type === "tome"));
        let activeSpellChance = p.nullifierDisrupted
          ? 0
          : pStats.spellChance || (isTomeEquipped ? 0.35 : 0);

        if (
          isTomeEquipped &&
          isEligiblePlayerElementTarget(m) &&
          Math.random() < activeSpellChance
        ) {
          resolveCanonicalTomeSpellProcEvent({
            player: p,
            resolvedStats: pStats,
            playerStats: window.playerStats,
            tome: window.equippedSlots?.subweapon,
            originTarget: m,
            targets: window.activeDungeonMobs,
            map: options.activeDungeonMap || window.activeDungeonMap,
            collisionCheck: window.checkCollisionAt,
            frame: window.logicClock,
            progressMission: true,
          });
        }

        // Directional knockback impulse vector
        let dirX = dist > 0 ? dx / dist : 1;
        let dirY = dist > 0 ? dy / dist : 0;
        m.recoilX = -dirX * (isCrit ? 8 : 5);
        m.recoilY = -dirY * (isCrit ? 8 : 5);

        // Spawn directional hit sparks
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            m.x + m.w / 2,
            m.y + m.h / 2,
            isCrit,
            -dirX,
            -dirY,
          );
        }

        // Trigger high-fidelity polymorphic combat particles (Subphase C.2)
        if (typeof window.spawnCombatImpactParticles === "function") {
          window.spawnCombatImpactParticles(
            m.x + m.w / 2,
            m.y + m.h / 2,
            isCrit,
            -dirX,
            -dirY,
            m.visualType || m.type || "default",
          );
        }

        if (
          !specializedImpact &&
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          let targetType = "flesh";
          let vType = m.visualType || m.type || "";
          if (
            vType === "animated_armor" ||
            vType === "corroded_golem" ||
            vType === "overlord_iron_vault"
          ) {
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
      } else if (closestTarget.type === "cavern") {
        let item = closestTarget.obj;
        item.hp--;
        item.flashTimer = 5;
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("hit");
        }
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(item.x, item.y, false);
        }
        if (item.hp <= 0) {
          window.triggerCavernShatter(item);
          let idx = window.cavernInteractives.indexOf(item);
          if (idx !== -1) window.cavernInteractives.splice(idx, 1);
        }
      } else if (closestTarget.type === "breakable") {
        let prop = closestTarget.obj;
        prop.hp--;
        prop.flashTimer = 5;

        if (
          window.SoundManager &&
          typeof window.SoundManager.playHitImpact === "function"
        ) {
          window.SoundManager.playHitImpact(false, "shatter");
        }
        if (window.RenderEngine && window.RenderEngine.spawnHitSparks) {
          window.RenderEngine.spawnHitSparks(
            closestTarget.x,
            closestTarget.y,
            false,
          );
        }

        if (prop.hp <= 0) {
          window.destroyBreakableProp(prop, closestTarget.x, closestTarget.y);
        }
      }
    }

  };
