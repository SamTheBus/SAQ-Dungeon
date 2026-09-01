import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";
import { advanceCanonicalPeriodicEffects } from "./combat_effect_authority.js?v=1.001";
import { advanceCanonicalElementStates } from "./element_effect_authority.js?v=1.001";

  export const updateCombatPeriodic = function (p, pStats) {
    let logicClock = window.logicClock || 0;

    const periodicTargets = [...(window.activeDungeonMobs || [])];
    if (window.mob && !periodicTargets.includes(window.mob)) {
      periodicTargets.push(window.mob);
    }
    advanceCanonicalPeriodicEffects(periodicTargets, p, logicClock);
    advanceCanonicalElementStates(periodicTargets, logicClock);

    // --- UNIQUE ITEM PERIODIC TIMERS ---
    if (window.hasUniquePassive("weapon_staff")) {
      window.playerStats.phoenixStaffTimer =
        (window.playerStats.phoenixStaffTimer || 0) + 1;
      if (window.playerStats.phoenixStaffTimer >= 180) {
        window.playerStats.phoenixStaffTimer = 0;
        let targetMob = (window.activeDungeonMobs || []).find(
          isPlayerTargetableMob,
        );
        if (!targetMob && isPlayerTargetableMob(window.mob)) {
          targetMob = window.mob;
        }
        if (targetMob) {
          let tCx = targetMob.x + (targetMob.w || 24) / 2;
          let tCy = targetMob.y + (targetMob.h || 24) / 2;
          let dx = tCx - p.x;
          let dy = tCy - (p.y - 8);
          let dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 300) {
            let fireDmg = BigNum.from(pStats.atk || 15).mul(0.25);
            window.projectiles.push({
              x: p.x,
              y: p.y - 8,
              vx: (dx / dist) * 4.5,
              vy: (dy / dist) * 4.5,
              r: 7,
              type: "fireball",
              owner: "player",
              damage: fireDmg.round(),
              life: 140,
              pulseOffset: Math.random() * 10,
            });
            if (window.SoundManager) window.SoundManager.play("spell_fire");
          }
        }
      }
    }

    if (window.hasUniquePassive("tome_watch")) {
      window.playerStats.watchCycleTimer =
        (window.playerStats.watchCycleTimer || 0) + 1;
      if (window.playerStats.watchCycleTimer >= 1200) {
        window.playerStats.watchCycleTimer = 0;
        window.playerStats.watchActiveTimer = 240;
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 25,
            "TEMPORAL FRACTURE!",
            "#f1c40f",
            true,
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnBeam(p.x, "#f1c40f", 40, true);
        }
      }
      if (window.playerStats.watchActiveTimer > 0) {
        window.playerStats.watchActiveTimer--;
      }
    }

    if (window.hasUniquePassive("tome_conduit")) {
      window.playerStats.conduitSpawnTimer =
        (window.playerStats.conduitSpawnTimer || 0) + 1;
      if (window.playerStats.conduitSpawnTimer >= 900) {
        window.playerStats.conduitSpawnTimer = 0;
        if (typeof window.spawnCavernInteractive === "function") {
          window.spawnCavernInteractive("aetheric_conduit");
        }
      }
    }

    // --- ELITE SUPPORT AURA PULSES & STACK DECAY ENGINE ---
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      let mobs = window.activeDungeonMobs;

      // 1. Process Active Aura Pulses from Elite Commanders
      mobs.forEach((m) => {
        if (!m.eliteAffix || m.hp.lte(0)) return;

        let mCx = m.x + (m.w || 24) / 2;
        let mCy = m.y + (m.h || 24) / 2;

        if (m.eliteAffix === "vitality_weaver") {
          if (logicClock % 90 === 0) {
            // Pulse every 1.5 seconds
            let radiusSq = 14400; // 120px healing radius squared
            let injuredAllies = [];

            mobs.forEach((m2) => {
              if (m2 === m || m2.hp.lte(0) || m2.hp.gte(m2.maxHp)) return; // Strictly excludes self, hero, and full-HP/dead mobs
              let dx = m2.x + (m2.w || 24) / 2 - mCx;
              let dy = m2.y + (m2.h || 24) / 2 - mCy;
              if (dx * dx + dy * dy <= radiusSq) {
                let hpRatio = m2.hp.div(m2.maxHp).valueOf();
                injuredAllies.push({ mob: m2, ratio: hpRatio });
              }
            });

            // Target up to 3 lowest-HP injured monster allies
            injuredAllies.sort((a, b) => a.ratio - b.ratio);
            let targetsToHeal = injuredAllies.slice(0, 3);

            targetsToHeal.forEach((target) => {
              let targetMob = target.mob;
              let isBoss =
                targetMob.type === "dungeon_boss" ||
                targetMob.type === "dungeon_miniboss";
              let healRatio = isBoss ? 0.015 : 0.06; // 1.5% for bosses, 6% for standard mobs
              let healVal = targetMob.maxHp.mul(healRatio);

              targetMob.hp = window.BigNumMin(
                targetMob.maxHp,
                targetMob.hp.add(healVal),
              );

              let tx = targetMob.x + (targetMob.w || 24) / 2;
              let ty = targetMob.y + (targetMob.h || 24) / 2;

              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  tx,
                  ty - 15,
                  `+${window.formatNumber(healVal)} HP`,
                  "#2ecc71",
                );
              }
            });
          }
        } else if (m.eliteAffix === "swift_commander") {
          let radiusSq = 19600; // 140px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers = m2.buffTimers || { haste: 0, def: 0, atk: 0 };
              m2.buffStacks = m2.buffStacks || { haste: 0, def: 0, atk: 0 };
              m2.buffTimers.haste = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.haste = Math.min(
                  3,
                  (m2.buffStacks.haste || 0) + 1,
                );
              }
            }
          });
        } else if (m.eliteAffix === "iron_citadel") {
          let radiusSq = 10000; // 100px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers = m2.buffTimers || { haste: 0, def: 0, atk: 0 };
              m2.buffStacks = m2.buffStacks || { haste: 0, def: 0, atk: 0 };
              m2.buffTimers.def = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.def = Math.min(3, (m2.buffStacks.def || 0) + 1);
              }
            }
          });
        } else if (m.eliteAffix === "blood_berserker") {
          let radiusSq = 12100; // 110px radius squared
          mobs.forEach((m2) => {
            if (m2 === m || m2.hp.lte(0)) return;
            let dx = m2.x + (m2.w || 24) / 2 - mCx;
            let dy = m2.y + (m2.h || 24) / 2 - mCy;
            if (dx * dx + dy * dy <= radiusSq) {
              m2.buffTimers = m2.buffTimers || { haste: 0, def: 0, atk: 0 };
              m2.buffStacks = m2.buffStacks || { haste: 0, def: 0, atk: 0 };
              m2.buffTimers.atk = 300; // 5-second lingering window
              if (logicClock % 90 === 0) {
                m2.buffStacks.atk = Math.min(3, (m2.buffStacks.atk || 0) + 1);
              }
            }
          });
        } else if (m.eliteAffix === "nullifier") {
          let dx = p.x - mCx;
          let dy = p.y - mCy;
          if (dx * dx + dy * dy <= 8100) {
            // 90px hero disruptor radius
            p.nullifierDisrupted = true;
          }
        } else if (m.eliteAffix === "glacial_warden") {
          if (logicClock % 120 === 0) {
            let dx = p.x - mCx;
            let dy = p.y - mCy;
            if (dx * dx + dy * dy <= 12100) {
              p.snareTimer = 60;
              if (typeof window.spawnFloatingText === "function") {
                window.spawnFloatingText(
                  p.x,
                  p.y - 12,
                  "FROST PULSE -40%",
                  "#38bdf8",
                  true,
                );
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  mCx,
                  mCy,
                  12,
                  "void_orb",
                  2.0,
                );
              }
            }
          }
        } else if (m.eliteAffix === "slag_shaper") {
          if (logicClock % 180 === 0) {
            window.cavernInteractives = window.cavernInteractives || [];
            window.cavernInteractives.push({
              id: window.idCounter++,
              type: "acid_pool",
              color: "#f97316",
              isSlag: true,
              x: mCx,
              y: mCy,
              w: 24,
              h: 12,
              life: 300,
              maxLife: 300,
            });
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                mCx,
                mCy,
                10,
                "magma_elemental",
                2.0,
              );
            }
          }
        } else if (m.eliteAffix === "web_weaver") {
          let distToHero = Math.hypot(p.x - mCx, p.y - mCy);
          if (
            logicClock % 210 === 0 &&
            (m.discovered || m.isAggroed) &&
            distToHero <= 220
          ) {
            window.cavernInteractives = window.cavernInteractives || [];
            window.cavernInteractives.push({
              id: window.idCounter++,
              type: "spider_web_zone",
              x: p.x,
              y: p.y,
              w: 56,
              h: 24,
              life: 240,
              maxLife: 240,
            });
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                p.x,
                p.y,
                8,
                "slag_slime",
                1.8,
              );
            }
          }
        }
      });

      // 2. Process Lingering Window Countdown & Gradual 2.5s Stack Falloff
      mobs.forEach((m) => {
        if (!m.buffStacks) return;
        m.buffTimers = m.buffTimers || { haste: 0, def: 0, atk: 0 };
        ["haste", "def", "atk"].forEach((b) => {
          if (m.buffTimers[b] > 0) {
            m.buffTimers[b]--;
            if (m.buffTimers[b] === 0 && m.buffStacks[b] > 0) {
              m.buffStacks[b]--;
              if (m.buffStacks[b] > 0) {
                m.buffTimers[b] = 150; // Drop 1 stack every 2.5s (150 frames)
              }
            }
          }
        });
      });
    }

  };
