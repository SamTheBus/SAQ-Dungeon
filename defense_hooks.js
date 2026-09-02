import { getActiveDungeonMap } from "./dungeon_map.js?v=1.010";
import { addActiveDungeonMob } from "./encounter_state.js?v=1.007";
import {
  awardResonantAegisMasteryXp,
  awardWindRazorMasteryXp,
} from "./mastery_authority.js?v=1.003";
import { hasPeriodicEffect } from "./combat_effect_authority.js?v=1.002";

    // The base damage pipeline owns mitigation/counters. This narrow decorator
    // supplies only the communicated Master Duellist combat companion.
    if (window.damagePlayer && !window.damagePlayer.__wrappedByMasteryAuthority) {
      const canonicalIncomingDamage = window.damagePlayer;
      window.damagePlayer = function (amount, attacker) {
        const previousParryTime = window.playerStats?.recentParryTime || 0;
        const result = canonicalIncomingDamage.call(this, amount, attacker);
        const parried =
          (window.playerStats?.recentParryTime || 0) > previousParryTime;
        const pStats = window.resolvePlayerStats?.() || {};
        const p = window.player;
        if (parried && pStats.hasMasterDuellist && p?.hp > 0) {
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
        }
        return result;
      };
      window.damagePlayer.__wrappedByMasteryAuthority = true;
    }

    export function handleVanguardBlockTrigger(attacker) {
      // Compatibility export only. damagePlayer now owns both the distinct
      // Block-only Resonant Aegis event and the canonical Shield Bash event.
      // Keeping this entrypoint inert prevents old callers from creating a
      // second damage/proc authority.
      return Object.freeze({
        applied: false,
        reason: "canonical_damage_player_block_authority",
        attackerId: attacker?.id ?? null,
      });

      let p = window.player;
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let aegisLevel = pStats.impactTremorRank || 0;

      if (aegisLevel > 0) {
        let procChance = aegisLevel * 0.2;
        if (Math.random() < procChance) {
          if (window.spawnResonantAegisRipple) {
            window.spawnResonantAegisRipple(p.x, p.y);
          }
          awardResonantAegisMasteryXp(pStats);

          let defVal = pStats.def || p.def || 5;
          let bashMult = pStats.shieldBashMultiplier || 1.0;
          let defScaling = pStats.shieldDefScalingCounter || 0.0;
          let dmg = BigNum.from(defVal)
            .mul(1.2)
            .mul(bashMult)
            .add(BigNum.from(defVal).mul(defScaling));

          let bashLevel = pStats.earthBreakerBashRank || 0;

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

      let shadowStepLvl = pStats.shadowStepLevel || 0;

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

      let parryFlurryLevel = pStats.windRazorFlurryLevel || 0;
      if (parryFlurryLevel > 0) {
        window.triggerWindRazorStrike(attacker);
      }
    }

    export function checkAndSpawnNoxiousBloom(m, x, y) {
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let bloomLevel = pStats.noxiousBloomLevel || 0;
      if (bloomLevel > 0) {
        let hasDebuff =
          hasPeriodicEffect(m, "bleed") || hasPeriodicEffect(m, "poison");
        if (hasDebuff) {
          window.cavernInteractives = window.cavernInteractives || [];
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
          if (window.spawnNoxiousBloomVisual) {
            window.spawnNoxiousBloomVisual(x, y);
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
        let windLevel = pStats.windRazorFlurryLevel || 0;

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
          awardWindRazorMasteryXp(pStats);

        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_frost"); // Play high-pitch slash sound
        }
      }
    }

