import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import { addActiveDungeonMob } from "./encounter_state.js?v=1.004";

    // Decorate damagePlayer globally with safe double-wrap protection to monitor and trigger defensive counters
    if (window.damagePlayer && !window.damagePlayer.__wrappedByMain) {
      const originalDamagePlayer = window.damagePlayer;
      window.damagePlayer = function (amount, attacker) {
        let p = window.player;
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};

        // Nullifier Disruption: Instantly nullify all offhand defensive values
        if (p.nullifierDisrupted) {
          pStats.block = 0;
          pStats.parry = 0;
          pStats.arcaneBarrier = 0;
        }

        let shieldFortifiedGuardLvl = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("shield_fortified_guard")
          : 0;

        // Compute block mitigation modifications
        let blockMit = 0.7;
        if (pStats.blockMitigation) blockMit = pStats.blockMitigation;
        if (pStats.blockMitigationBonus)
          blockMit = Math.min(1.0, blockMit + pStats.blockMitigationBonus);
        if (pStats.colossusBlock) blockMit = 1.0;

        let prevBlockTime =
          (window.playerStats && window.playerStats.recentBlockTime) || 0;
        let prevParryTime =
          (window.playerStats && window.playerStats.recentParryTime) || 0;
        let shieldBeforeDamage = Math.max(0, Number(p.arcaneShield) || 0);

        let result = originalDamagePlayer
          ? originalDamagePlayer.call(this, amount, attacker)
          : null;
        let absorbed = Math.max(
          0,
          shieldBeforeDamage - Math.max(0, Number(p.arcaneShield) || 0),
        );

        let postBlockTime =
          (window.playerStats && window.playerStats.recentBlockTime) || 0;
        let postParryTime =
          (window.playerStats && window.playerStats.recentParryTime) || 0;

        if (postBlockTime > prevBlockTime) {
          // Successful Block retro-active adjustments
          if (blockMit >= 1.0 && p.hp > 0) {
            let baseDamageTaken = Math.round(amount * 0.3);
            p.hp = Math.min(p.maxHp, p.hp + baseDamageTaken);
          } else if (pStats.blockMitigationBonus && p.hp > 0) {
            let extraReduction = Math.round(
              amount * pStats.blockMitigationBonus,
            );
            p.hp = Math.min(p.maxHp, p.hp + extraReduction);
          }

          // Colossus AP Bonus Conversion
          if (pStats.colossusBlock) {
            window.playerStats.colossusAtkBonusTimer = 600;
            window.playerStats.colossusAtkBonusVal = Math.round(
              (pStats.def || 5) * 0.5,
            );
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "COLOSSUS MIGHT!",
                "#2ecc71",
                true,
              );
            }
          }

          // Aegis Pulse Healing
          let pulseLvl = window.SkillTreeManager
            ? window.SkillTreeManager.getSkillLevel("shield_aegis_pulse")
            : 0;
          if (pulseLvl > 0) {
            window.playerStats.blockCount =
              (window.playerStats.blockCount || 0) + 1;
            if (window.playerStats.blockCount >= 5) {
              window.playerStats.blockCount = 0;
              let healVal = Math.round(p.maxHp * (pulseLvl * 0.03));
              p.hp = Math.min(p.maxHp, p.hp + healVal);
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 12,
                  `+${healVal} HP (AEGIS PULSE)`,
                  "#2ecc71",
                  true,
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnBeam(p.x, "#2ecc71", 30, true);
              }
            }
          }

          // Retaliatory Strike Guaranteed Crit flag
          if (
            window.SkillTreeManager &&
            window.SkillTreeManager.getSkillLevel("shield_retaliatory_strike") >
              0
          ) {
            window.playerStats.guaranteedCrit = true;
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 20,
                "CRIT GUARANTEED!",
                "#ffd700",
                true,
              );
            }
          }

          window.handleVanguardBlockTrigger(attacker);
        }

        if (postParryTime > prevParryTime) {
          // Successful Parry retro-active adjustments (Master Duellist 100% negation & Decoy Spawn)
          if (pStats.hasKeystoneDuellist && p.hp > 0) {
            let baseDamageTaken = Math.round(amount * 0.5);
            p.hp = Math.min(p.maxHp, p.hp + baseDamageTaken);

            addActiveDungeonMob({
              id: window.idCounter++,
              type: "mob",
              visualTier: 4,
              visualType: "marsh_ghost",
              x: p.x + window.randFloat(-15, 15),
              y: p.y + window.randFloat(-15, 15),
              w: 24,
              h: 24,
              hp: BigNum.from(1),
              maxHp: BigNum.from(1),
              atk: BigNum.from(pStats.atk || 15).mul(0.8).round(),
              flashTimer: 0,
              isFriendlyWisp: true,
              wispTimer: 240,
              discovered: true,
              hopTimer: 0,
            });

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "SHADOW DECOY!",
                "#a855f7",
                true,
              );
            }
          }

          // Shadow Step Buff trigger
          if (pStats.shadowStepLvl && pStats.shadowStepLvl > 0) {
            window.playerStats.shadowStepTimer = 240;
            window.playerStats.shadowStepLevel = pStats.shadowStepLvl;
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "SHADOW STEP!",
                "#a855f7",
                true,
              );
            }
          }

          // Sanguine Rupture dot detonation trigger
          if (
            pStats.sanguineRuptureLvl &&
            pStats.sanguineRuptureLvl > 0 &&
            attacker &&
            (attacker.poisonStacks > 0 || attacker.bleedStacks > 0)
          ) {
            let baseAtk = pStats.atk || p.atk || 15;
            let remainingPoison = BigNum.from(baseAtk)
              .mul(0.1 * (attacker.poisonLevel || 1))
              .mul(attacker.poisonStacks)
              .mul(10);
            let remainingBleed = BigNum.from(baseAtk)
              .mul(0.05)
              .mul(attacker.bleedStacks)
              .mul(10);
            let totalRemaining = remainingPoison.add(remainingBleed);
            let detonationDmg = totalRemaining.mul(
              pStats.sanguineRuptureLvl === 1 ? 1.5 : 3.0,
            );

            attacker.hp = attacker.hp.sub(detonationDmg);
            attacker.poisonStacks = 0;
            attacker.bleedStacks = 0;
            attacker.poisonTimer = 0;
            attacker.bleedTimer = 0;

            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                attacker.x + attacker.w / 2,
                attacker.y + attacker.h / 2,
                detonationDmg,
                "crit",
                true,
                attacker,
              );
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                attacker.x + attacker.w / 2,
                attacker.y - 15,
                "SANGUINE RUPTURE!",
                "#e74c3c",
              );
            }
          }

          window.handleVanguardParryTrigger(attacker);
        }

        // 4. Fortified Guard Stack Builder
        if (pStats.def && shieldFortifiedGuardLvl > 0 && amount > 0) {
          window.playerStats.fortitudeStacks = Math.min(
            5,
            (window.playerStats.fortitudeStacks || 0) + 1,
          );
          window.playerStats.fortitudeTimer = 360;
          if (
            typeof window.spawnFloatingText === "function" &&
            Math.random() < 0.3
          ) {
            window.spawnFloatingText(
              p.x,
              p.y - 15,
              `FORTITUDE x${window.playerStats.fortitudeStacks}`,
              "#3498db",
              true,
            );
          }
        }

        // Reset Arcane Barrier recharge delay timer upon taking damage.
        // The central damage pipeline owns shield absorption and immediate shatter;
        // this decorator only observes the resulting shield delta.
        if (amount > 0 && window.playerStats) {
          let delaySec = pStats.barrierRechargeDelay || 3.0;
          window.playerStats.barrierRechargeTimer = Math.round(delaySec * 60);
        }

        if (pStats.hasBarrierShatter && absorbed > 0) {
          window.playerStats.absorbedBarrierDamage =
            (window.playerStats.absorbedBarrierDamage || 0) + absorbed;
          let threshold = p.maxHp;
          if (window.playerStats.absorbedBarrierDamage >= threshold) {
            window.playerStats.absorbedBarrierDamage = 0; // Reset

            let intVal = pStats.int || p.int || 5;
            let detDmg = BigNum.from(intVal).mul(2.5);

            if (window.spawnBarrierShatterVisual) {
              window.spawnBarrierShatterVisual(p.x, p.y);
            }

            let range = 75;
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((m) => {
                if (m.hp.gt(0) && !m.isFriendlyWisp) {
                  let mCx = m.x + (m.w || 24) / 2;
                  let mCy = m.y + (m.h || 24) / 2;
                  let dist = Math.hypot(p.x - mCx, p.y - mCy);
                  if (dist <= range) {
                    m.hp = m.hp.sub(detDmg);
                    m.flashTimer = 8;
                    m.hasTakenDamage = true;

                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        mCx,
                        mCy,
                        detDmg,
                        "frost",
                        true,
                        m,
                      );
                    }
                  }
                }
              });
            }
            if (window.mob && window.mob.hp.gt(0)) {
              let m = window.mob;
              let mCx = m.x + m.w / 2;
              let mCy = m.y + m.h / 2;
              let dist = Math.hypot(p.x - mCx, p.y - mCy);
              if (dist <= range) {
                m.hp = m.hp.sub(detDmg);
                m.flashTimer = 8;
                m.hasTakenDamage = true;

                if (window.combatVisuals) {
                  window.combatVisuals.spawnDamageEffect(
                    mCx,
                    mCy,
                    detDmg,
                    "frost",
                    true,
                    m,
                  );
                }
              }
            }

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 25,
                "BARRIER SHATTER DETONATION!",
                "#00ffff",
                true,
              );
            }
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell_frost");
            }
          }
        }

        return result;
      };
      window.damagePlayer.__wrappedByMain = true;
    }

    export function handleVanguardBlockTrigger(attacker) {
      let p = window.player;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let aegisLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("shield_impact_tremor")
        : 0;

      if (aegisLevel > 0) {
        let procChance = aegisLevel * 0.2;
        if (Math.random() < procChance) {
          if (window.spawnResonantAegisRipple) {
            window.spawnResonantAegisRipple(p.x, p.y);
          }

          let defVal = pStats.def || p.def || 5;
          let bashMult = pStats.shieldBashMultiplier || 1.0;
          let defScaling = pStats.shieldDefScalingCounter || 0.0;
          let dmg = BigNum.from(defVal)
            .mul(1.2)
            .mul(bashMult)
            .add(BigNum.from(defVal).mul(defScaling));

          let bashLevel = window.SkillTreeManager
                      ? window.SkillTreeManager.getSkillLevel("shield_earth_breaker_bash")
                      : 0;

                    let aoeMult = pStats.areaRadiusMult || 1.0;
                    let range = (bashLevel > 0 ? 60 : 45) * aoeMult;
                    let attackAngle = attacker
                      ? Math.atan2(
                          attacker.y + (attacker.h || 24) / 2 - p.y,
                          attacker.x + (attacker.w || 24) / 2 - p.x,
                        )
                      : 0;

          if (bashLevel > 0 && window.spawnEarthBreakerBashVisual && attacker) {
                      window.spawnEarthBreakerBashVisual(p.x, p.y, attackAngle, aoeMult);
                    }

          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((m) => {
              if (m.hp.gt(0) && !m.isFriendlyWisp) {
                let mCx = m.x + (m.w || 24) / 2;
                let mCy = m.y + (m.h || 24) / 2;
                let dist = Math.hypot(p.x - mCx, p.y - mCy);

                if (dist <= range) {
                  let isHit = true;
                  if (bashLevel > 0 && attacker) {
                    let targetAngle = Math.atan2(mCy - p.y, mCx - p.x);
                    let angleDiff = Math.abs(
                      Math.atan2(
                        Math.sin(targetAngle - attackAngle),
                        Math.cos(targetAngle - attackAngle),
                      ),
                    );
                    let coneWidth = 0.45 * aoeMult; // ~25 degrees each side * AoE Mult
                    isHit = angleDiff <= coneWidth;
                  }

                  if (isHit) {
                    m.hp = m.hp.sub(dmg);
                    m.flashTimer = 8;
                    m.hasTakenDamage = true;

                    if (bashLevel > 0 && !m.isBoss) {
                      let stunChance = bashLevel * 0.15;
                      if (Math.random() < stunChance) {
                        m.speedMultiplier = 0;
                        m.stunTimer = 90; // 1.5s stun
                        if (typeof window.spawnFloatingText === "function") {
                          window.spawnFloatingText(
                            mCx,
                            m.y - 12,
                            "STUNNED!",
                            "#38bdf8",
                          );
                        }
                      }
                    }

                    if (!m.isBoss) {
                      let pushAngle = attacker
                        ? attackAngle
                        : Math.atan2(mCy - p.y, mCx - p.x);
                      let pushDist = 14;
                      let targetX = m.x + Math.cos(pushAngle) * pushDist;
                      let targetY = m.y + Math.sin(pushAngle) * pushDist;
                      let map = getActiveDungeonMap();
                      if (
                        map &&
                        typeof window.checkCollisionAt === "function" &&
                        !window.checkCollisionAt(
                          map,
                          targetX + 12,
                          targetY + 12,
                          12,
                        )
                      ) {
                        m.x = targetX;
                        m.y = targetY;
                      }
                    }

                    if (window.combatVisuals) {
                      window.combatVisuals.spawnDamageEffect(
                        mCx,
                        mCy,
                        dmg,
                        bashLevel > 0 ? "shield_bash" : "counter",
                        false,
                        m,
                      );
                    }
                  }
                }
              }
            });
          }

          if (window.mob && window.mob.hp.gt(0)) {
            let m = window.mob;
            let mCx = m.x + m.w / 2;
            let mCy = m.y + m.h / 2;
            let dist = Math.hypot(p.x - mCx, p.y - mCy);

            if (dist <= range) {
              let isHit = true;
              if (bashLevel > 0 && attacker) {
                let targetAngle = Math.atan2(mCy - p.y, mCx - p.x);
                let angleDiff = Math.abs(
                  Math.atan2(
                    Math.sin(targetAngle - attackAngle),
                    Math.cos(targetAngle - attackAngle),
                  ),
                );
                let coneWidth = 0.45;
                isHit = angleDiff <= coneWidth;
              }

              if (isHit) {
                m.hp = m.hp.sub(dmg);
                m.flashTimer = 8;
                m.hasTakenDamage = true;

                if (window.combatVisuals) {
                  window.combatVisuals.spawnDamageEffect(
                    mCx,
                    mCy,
                    dmg,
                    bashLevel > 0 ? "shield_bash" : "counter",
                    false,
                    m,
                  );
                }
              }
            }
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("block");
          }
        }
      }
    }

    export function handleVanguardParryTrigger(attacker) {
      if (!attacker) return;
      let p = window.player;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};

      let shadowStepLvl = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_shadow_step")
        : 0;

      // Base Riposte deals 150% Attack Power, boosted by +20% per rank of Shadow Step
      let baseAtk = pStats.atk || p.atk || 15;
      let riposteMult = 1.5 * (1 + shadowStepLvl * 0.2);
      let dmg = BigNum.from(baseAtk).mul(riposteMult);

      attacker.hp = attacker.hp.sub(dmg);
      attacker.flashTimer = 8;
      attacker.hasTakenDamage = true;

      let mCx = attacker.x + (attacker.w || 24) / 2;
      let mCy = attacker.y + (attacker.h || 24) / 2;

      if (window.combatVisuals) {
        window.combatVisuals.spawnDamageEffect(
          mCx,
          mCy,
          dmg,
          "riposte",
          false,
          attacker,
        );
        window.combatVisuals.spawnParticles(mCx, mCy, 8, "cursed_blade", 2.5);
      }

      let parryFlurryLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
        : 0;
      if (parryFlurryLevel > 0) {
        window.triggerWindRazorStrike(attacker);
      }
    }

    export function checkAndSpawnNoxiousBloom(m, x, y) {
      let bloomLevel = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("dagger_noxious_bloom")
        : 0;
      if (bloomLevel > 0) {
        let hasDebuff =
          (m.bleedStacks && m.bleedStacks > 0) ||
          (m.poisonStacks && m.poisonStacks > 0);
        if (hasDebuff) {
          window.cavernInteractives = window.cavernInteractives || [];
          let pStats =
            typeof window.resolvePlayerStats === "function"
              ? window.resolvePlayerStats()
              : {};
          let baseAtk = pStats.atk || window.player.atk || 15;
          let tickDmg = BigNum.from(baseAtk).mul(0.15 * bloomLevel);

          let aoeMult = pStats.areaRadiusMult || 1.0;
                    window.cavernInteractives.push({
                      id: window.idCounter++,
                      type: "noxious_bloom",
                      x: x,
                      y: y,
                      w: 80 * aoeMult,
                      h: 36 * aoeMult,
                      life: 240,
                      maxLife: 240,
                      tickDamage: tickDmg,
                    });

          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(x, y, 15, "swamp_basilisk", 3);
          }
        }
      }
    }

    export function triggerWindRazorStrike(targetMob) {
        let p = window.player;
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};
        let windLevel = window.SkillTreeManager
          ? window.SkillTreeManager.getSkillLevel("dagger_wind_razor_flurry")
          : 0;

        if (windLevel > 0 && targetMob) {
          let tCx = targetMob.x + (targetMob.w || 24) / 2;
          let tCy = targetMob.y + (targetMob.h || 24) / 2;
          let angle = Math.atan2(tCy - p.y, tCx - p.x);

          let baseAtk = pStats.atk || p.atk || 15;
          let windDmg = BigNum.from(baseAtk).mul(0.4 * (1 + windLevel * 0.2));
          let aoeMult = pStats.areaRadiusMult || 1.0;

          if (window.spawnWindRazor) {
            window.spawnWindRazor(p.x, p.y - 8, angle, windDmg, aoeMult);
          }

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_frost"); // Play high-pitch slash sound
        }
      }
    }

