import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";
import {
  isOverkillHit,
  updateFinitePeakHit,
} from "./combat_scaling.js?v=1.001";

  export const resolvePlayerAttack = function (p, pStats, closestTarget) {
    if (closestTarget && p.attackTimer >= 20) {
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

      if (closestTarget.type === "mob") {
        let m = closestTarget.obj;
        if (!isPlayerTargetableMob(m)) return;
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
          let slotLvl = window.getArtifactTemperLevel
            ? window.getArtifactTemperLevel("synergy_sanguine")
            : 0;
          let slotMult = 1.0 + slotLvl * 0.01;
          let uniqueDoTs = 0;
          if ((m.poisonStacks || 0) > 0) uniqueDoTs++;
          if ((m.bleedStacks || 0) > 0) uniqueDoTs++;
          if ((m.burnStacks || 0) > 0 || m.isBurning) uniqueDoTs++;
          let multiplier = 1.0 + 0.08 * uniqueDoTs * slotMult;
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

        // Roll bleed from dagger base bleedChance
        if (pStats.bleedChance && pStats.bleedChance > 0) {
          if (Math.random() < pStats.bleedChance) {
            m.bleedStacks = Math.min(5, (m.bleedStacks || 0) + 1);
            m.dotTickTimer = m.dotTickTimer || 0;
          }
        }

        // Track Critical Streaks for Wind-Razor Flurry
        let windFlurryLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
          : 0;
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

        // Artifact: Vampirism (Blood-Soaked Chalice)
        if (window.checkArtifactTrait("vampirism")) {
          let now = Date.now();
          window.playerStats.recentHeals = (
            window.playerStats.recentHeals || []
          ).filter((h) => now - h.time < 1000);
          let totalHealedLastSec = window.playerStats.recentHeals.reduce(
            (sum, h) => sum + h.amt,
            0,
          );
          let maxHealPerSec = p.maxHp * 0.03;
          let allowedHeal = Math.max(0, maxHealPerSec - totalHealedLastSec);

          let rawHeal = pAtk.mul(0.005).toFiniteNumber();
          let finalHeal = Math.min(allowedHeal, rawHeal);
          if (finalHeal > 0) {
            finalHeal = Math.round(finalHeal);
            p.hp = Math.min(p.maxHp, p.hp + finalHeal);
            window.playerStats.recentHeals.push({ time: now, amt: finalHeal });
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `+${finalHeal} HP`,
                "#e74c3c",
              );
            }
          }
        }

        // Artifact: Echo Strike (Phantom Blade)
        if (window.checkArtifactTrait("echo_strike") && Math.random() < 0.3) {
          let echoDmg = pAtk.mul(0.25);
          m.hp = m.hp.sub(echoDmg);
          if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
            window.RenderEngine.spawnDamageEffect(
              mobCenterX,
              mobCenterY - 8,
              echoDmg,
              "echo",
              false,
            );
          }
        }

        // Unique: Sanguine Reaver (Sword Bleed Rupture)
        if (window.hasUniquePassive("weapon_sword")) {
          m.bleedStacks = (m.bleedStacks || 0) + 1;
          m.bleedTimer = 300; // 5-second duration
          if (m.bleedStacks >= 5) {
            m.bleedStacks = 0;
            m.bleedTimer = 0;
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
          } else {
            let bleedTick = BigNum.from(pStats.atk || 15).mul(0.2);
            if (pStats.bleedDamageMultiplier) {
              bleedTick = bleedTick.mul(pStats.bleedDamageMultiplier);
            }
            m.hp = m.hp.sub(bleedTick);
            m.bleedTimer = 300; // Refresh 5-second duration
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                mobCenterX,
                mobCenterY - 10,
                bleedTick,
                "bleed",
                false,
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

        // Artifact: Midas Touch (3% Chance on hit against non-boss mobs for Gold Transmutation)
        if (
          !isBossTarget &&
          m.hp.gt(0) &&
          window.checkArtifactTrait("gold_hoard") &&
          Math.random() < 0.03
        ) {
          let remHp = m.hp;
          m.hp = BigNum.from(0);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              mobCenterX,
              mobCenterY - 18,
              "GOLD TRANSMUTATION!",
              "#ffd700",
            );
          }
          let bonusGold = Math.floor(75 * (1 + window.player.depth * 0.5));
          window.spawnHomingGold(mobCenterX, mobCenterY, bonusGold);
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              mobCenterX,
              mobCenterY,
              25,
              "gold_dungeon",
              5,
            );
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }
        }

        // Dagger Offhand Multi-Strike & DoT Application (Blocked if Nullifier Disrupted)
        if (pStats.subType === "dagger") {
          let finalOffhandChance = p.nullifierDisrupted
            ? 0
            : pStats.offhandChance || 0.35;
          if (Math.random() < finalOffhandChance) {
            let offhandDmgMult = pStats.offhandDmgMultiplier || 1.0;
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

            // Roll bleed from dagger base bleedChance
            if (pStats.bleedChance && pStats.bleedChance > 0) {
              if (Math.random() < pStats.bleedChance) {
                m.bleedStacks = Math.min(5, (m.bleedStacks || 0) + 1);
                m.dotTickTimer = m.dotTickTimer || 0;
              }
            }

            // 1. Viper's Coating (Apply Stacking Poison & Bleeding)
            let vipersLvl = pStats.vipersCoatingLvl || 0;
            if (vipersLvl > 0) {
              m.poisonStacks = Math.min(5, (m.poisonStacks || 0) + 1);
              m.poisonLevel = vipersLvl;
              m.dotTickTimer = m.dotTickTimer || 0;

              let bleedChance = vipersLvl * 0.05;
              if (Math.random() < bleedChance) {
                m.bleedStacks = Math.min(5, (m.bleedStacks || 0) + 1);
              }

              // Shadow Assassin Keystone check at 5 stacks
              if (pStats.hasKeystoneAssassin && m.poisonStacks >= 5) {
                m.poisonStacks = 0; // consume
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
              (pStats.offhandDmg || 0.45) * 1.5,
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
        let activeSpellType = pStats.spellType || "tri";

        if (isTomeEquipped && Math.random() < activeSpellChance) {
          // Gain +3 Tome Mastery XP on Spell Proc (Buffed)
          if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 3);

          if (typeof window.progressMission === "function") {
            window.progressMission("spells", 1);
          }

          // Nexus Harmonizer: Tomes boost Block/Parry by 5% for 3s (180 frames)
          if (
            window.playerStats &&
            window.checkArtifactTrait("synergy_nexus")
          ) {
            window.playerStats.nexusTomeShieldTimer = 180;
          }

          let spellDmg = BigNum.from(pStats.atk || 15).mul(
            pStats.spellPower || 1.5,
          );
          m.hp = m.hp.sub(spellDmg);
          m.flashTimer = 8;

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

          // Trigger actual visual spells
          if (
            pStats.hasTriadConvergence ||
            (window.SkillTreeManager &&
              window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
              Math.random() < 0.15)
          ) {
            if (window.castVisualSpell) {
              window.castVisualSpell("fire", p, m, pStats, true);
              window.castVisualSpell("lightning", p, m, pStats, true);
              window.castVisualSpell("frost", p, m, pStats, true);
            }
          } else {
            if (window.castVisualSpell) {
              window.castVisualSpell(
                spellEffectType,
                p,
                m,
                pStats,
                pStats.hasElementalOverload,
              );
            }
          }

          // Spell Weaving: Shifting between different element casts boosts Spell Power
          if (pStats.hasSpellWeaving) {
            if (
              window.playerStats.lastSpellCastType &&
              window.playerStats.lastSpellCastType !== spellEffectType
            ) {
              let prevStacks = window.playerStats.spellWeavingStacks || 0;
              window.playerStats.spellWeavingStacks = Math.min(
                4,
                prevStacks + 1,
              );
              window.playerStats.spellWeavingTimer = 240; // 4 seconds
              if (
                window.playerStats.spellWeavingStacks > prevStacks &&
                typeof window.spawnFloatingText === "function"
              ) {
                window.spawnFloatingText(
                  p.x,
                  p.y - 22,
                  `SPELL WEAVING (${window.playerStats.spellWeavingStacks}/4)`,
                  "#38bdf8",
                  true,
                );
              }
            }
            window.playerStats.lastSpellCastType = spellEffectType;
          }

          // Arcane Syphon: Spell procs recharge Arcane Shield (overflows 50% to HP)
                    if (pStats.hasArcaneSyphon) {
                      let rechargeAmt = Math.round(
                        (p.arcaneShieldMax || p.maxHp) * (pStats.arcaneSyphonLevel * 0.015),
                      );
                      if (typeof window.rechargePlayerArcaneShield === "function") {
                        window.rechargePlayerArcaneShield(rechargeAmt);
                      }
                      window.playerStats.syphonIntStacks = Math.min(
                        3,
                        (window.playerStats.syphonIntStacks || 0) + 1,
                      );
                      window.playerStats.syphonIntTimer = 360; // 6s at 60 FPS
                      if (typeof window.spawnFloatingText === "function") {
                        window.spawnFloatingText(
                          p.x,
                          p.y - 12,
                          `+${rechargeAmt} SHIELD (SYPHON)`,
                          "#00ffff",
                          true,
                        );
                      }
                    }

                    // Mana Shielding: Recharges Arcane Shield on spell cast
                    if (pStats.manaShieldingRecharge && pStats.manaShieldingRecharge > 0) {
                      let rechargeAmt = Math.round((p.arcaneShieldMax || p.maxHp) * pStats.manaShieldingRecharge);
                      if (typeof window.rechargePlayerArcaneShield === "function") {
                        window.rechargePlayerArcaneShield(rechargeAmt);
                      }
                      if (typeof window.spawnFloatingText === "function") {
                        window.spawnFloatingText(
                          p.x,
                          p.y - 15,
                          `+${rechargeAmt} SHIELD (MANA SHIELD)`,
                          "#00ffff",
                          true,
                        );
                      }
                    }

          // Triad Convergence / Aetheric Overload Check
          let isOverload =
            window.SkillTreeManager &&
            window.SkillTreeManager.getSkillLevel("tome_keystone") > 0 &&
            Math.random() < 0.15;

          if (pStats.hasTriadConvergence || isOverload) {
            const triElements = ["fire", "lightning", "frost"];
            triElements.forEach((elem, eIdx) => {
              m.hp = m.hp.sub(spellDmg);
              if (
                window.RenderEngine &&
                window.RenderEngine.spawnDamageEffect
              ) {
                window.RenderEngine.spawnDamageEffect(
                  mobCenterX + (eIdx - 1) * 12,
                  mobCenterY - 12 - eIdx * 6,
                  spellDmg,
                  elem,
                  false,
                );
              }

              // Apply Elemental Overload on each part of the Triad Convergence
              if (pStats.hasElementalOverload || elem === "lightning") {
                if (elem === "fire" && pStats.hasElementalOverload) {
                                  let splashDmg = spellDmg.mul(
                                    pStats.overloadLevel === 1 ? 0.35 : 0.7,
                                  );
                                  let fbRadius = 80 * (pStats.areaRadiusMult || 1.0);
                                  if (window.activeDungeonMobs) {
                                    window.activeDungeonMobs.forEach((otherMob) => {
                                      if (
                                        otherMob.id !== m.id &&
                                        isPlayerTargetableMob(otherMob)
                                      ) {
                                        let dist = Math.hypot(
                                          m.x - otherMob.x,
                                          m.y - otherMob.y,
                                        );
                                        if (dist <= fbRadius) {
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
                } else if (elem === "lightning") {
                                  let bouncesLeft = 1 + (pStats.overloadLevel || 0); // Chains exactly 1 time by default, scales higher with overload
                                  let hitIds = new Set([m.id]);
                                  let currentTarget = m;
                                  let chainSearchR = 120 * (pStats.areaRadiusMult || 1.0);
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
                        Math.hypot(m.x - otherMob.x, m.y - otherMob.y) <= 80
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
            // Apply single-spell Overload logic
            if (
              pStats.hasElementalOverload ||
              spellEffectType === "lightning"
            ) {
              if (spellEffectType === "fire" && pStats.hasElementalOverload) {
                let splashDmg = spellDmg.mul(
                  pStats.overloadLevel === 1 ? 0.35 : 0.7,
                );
                if (window.activeDungeonMobs) {
                  window.activeDungeonMobs.forEach((otherMob) => {
                    if (
                      otherMob.id !== m.id &&
                      isPlayerTargetableMob(otherMob)
                    ) {
                      let dist = Math.hypot(m.x - otherMob.x, m.y - otherMob.y);
                      if (dist <= 80) {
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
              } else if (spellEffectType === "lightning") {
                let bouncesLeft = 1 + (pStats.overloadLevel || 0); // Chains exactly 1 time by default, scales higher with overload
                let hitIds = new Set([m.id]);
                let currentTarget = m;
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
                    window.cavernInteractives = window.cavernInteractives || [];
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
              } else if (spellEffectType === "frost") {
                              // Inherent 15% slow on primary target
                              m.speedMultiplier = Math.max(0.2, (m.speedMultiplier || 1.0) - 0.15);

                              // AoE Wave Slow & Splash Damage when Elemental Overload or Area Amplification is active
                              let slowPct = pStats.hasElementalOverload ? (pStats.overloadLevel === 1 ? 0.25 : 0.4) : 0.15;
                                                            let novaRadius = 80 * (pStats.areaRadiusMult || 1.0);

                              if (window.activeDungeonMobs && (pStats.hasElementalOverload || (pStats.spellRadiusMult || 1.0) > 1.0)) {
                                window.activeDungeonMobs.forEach((otherMob) => {
                                  if (
                                    isPlayerTargetableMob(otherMob) &&
                                    Math.hypot(m.x - otherMob.x, m.y - otherMob.y) <= novaRadius
                                  ) {
                                    otherMob.speedMultiplier = Math.max(
                                      0.2,
                                      (otherMob.speedMultiplier || 1.0) - slowPct,
                                    );
                                    // Apply 25% Frost Nova AoE Splash Damage
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
                                      window.combatVisuals.spawnParticles(
                                        otherMob.x + otherMob.w / 2,
                                        otherMob.y + otherMob.h / 2,
                                        6,
                                        "void_orb",
                                        1,
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
                mobCenterX,
                mobCenterY - 12,
                spellDmg,
                spellEffectType,
                false,
              );
            }
          }
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
