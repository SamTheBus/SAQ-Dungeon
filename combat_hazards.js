import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";

  export const resetCombatHazardRuntimeState = function () {
    window.fatiguePenalty = 0;
    window.moltenSlagHeat = 0;
    window.moltenSlagStillTimer = 0;
    window.unstableCrustTimer = 0;
    window.temporalEchoQueue = [];
    window.astralConjunctionTimer = 0;
  };

  export const updateCombatHazards = function (p, map, pStats) {
    // Brimstone Core: Pulse adjacent 50% fire damage every second
    if (pStats.hasBrimstoneCore && window.logicClock % 60 === 0) {
          let auraDmg = BigNum.from(pStats.atk || p.atk || 15).mul(0.5);
          let auraRadius = 45 * (pStats.areaRadiusMult || 1.0);
          let targetCount = 0;
          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((m) => {
              let dist = Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2));
              if (dist <= auraRadius && isPlayerTargetableMob(m)) {
            m.hp = m.hp.sub(auraDmg);
            m.flashTimer = 8;
            targetCount++;
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                m.x + m.w / 2,
                m.y + m.h / 2,
                auraDmg,
                "fire",
                false,
              );
              window.combatVisuals.spawnParticles(
                m.x + m.w / 2,
                m.y + m.h / 2,
                4,
                "magma_elemental",
                1.5,
              );
            }
          }
        });
      }
      if (isPlayerTargetableMob(window.mob)) {
        let bm = window.mob;
        let dist = Math.hypot(p.x - (bm.x + bm.w / 2), p.y - (bm.y + bm.h / 2));
        if (dist <= auraRadius) {
          bm.hp = bm.hp.sub(auraDmg);
          bm.flashTimer = 8;
          targetCount++;
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              bm.x + bm.w / 2,
              bm.y + bm.h / 2,
              auraDmg,
              "fire",
              false,
            );
          }
        }
      }
      if (
        targetCount > 0 &&
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell_fire");
      }
    }

    // Check if Onslaught Wave has been cleared
    if (
      window.playerStats.isCrucibleMode &&
      window.activeDungeonMobs.length === 0 &&
      window.mob === null &&
      !window.state.onslaughterWaveLock
    ) {
      window.state.onslaughterWaveLock = true;
      if (typeof window.onOnslaughtWaveClear === "function") {
        window.onOnslaughtWaveClear();
      }
    }

    // Increment Floor Doom Timer & Evaluate Spawn Conditions
    window.floorTimeElapsed = (window.floorTimeElapsed || 0) + 1;
    let hasDeathsHour =
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("deaths_hour");

    if (
      (window.floorTimeElapsed >= 10800 || hasDeathsHour) &&
      !window.calamitySpecterActive
    ) {
      window.spawnCalamitySpecter();
    }

    pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : { atk: BigNum.from(15) };
    p.attackTimer = (p.attackTimer || 0) + 1;

    // --- PHASE 3: INTERACTIVE HAZARDS & SYSTEM INTEGRATIONS ---

    // A. Spreading Fatigue (Incremental Speed Decay)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("spreading_fatigue")
    ) {
      window.fatiguePenalty = (window.fatiguePenalty || 0) + 0.00025; // approx 1.5% speed loss per sec
      if (window.fatiguePenalty > 0.7) window.fatiguePenalty = 0.7; // Cap penalty at 70% (min 30% speed)
      p.speedMultiplier = Math.min(
        p.speedMultiplier || 1.0,
        1.0 - window.fatiguePenalty,
      );
    } else {
      window.fatiguePenalty = 0;
    }

    // B. Molten Slag (Floor friction builds heat)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("molten_slag")
    ) {
      window.moltenSlagHeat = window.moltenSlagHeat || 0;
      if (p.isMoving) {
        window.moltenSlagHeat += 0.22;
        window.moltenSlagStillTimer = 0;
      } else {
        window.moltenSlagStillTimer = (window.moltenSlagStillTimer || 0) + 1;
        if (window.moltenSlagStillTimer >= 90) {
          // 1.5s stationary resets heat
          window.moltenSlagHeat = Math.max(0, window.moltenSlagHeat - 0.6);
        }
      }

      if (window.moltenSlagHeat >= 100) {
        window.moltenSlagHeat = 0;
        let burnDmg = Math.round(p.maxHp * 0.1);
        window.damagePlayer(burnDmg, null);
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 25,
            `OVERHEAT! -${burnDmg} HP`,
            "#ea580c",
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnParticles(
            p.x,
            p.y,
            18,
            "magma_elemental",
            3.5,
          );
        }

        window.cavernInteractives = window.cavernInteractives || [];
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "acid_pool", // Reuses acid_pool lava visual & tick trigger
          x: p.x,
          y: p.y,
          w: 24,
          h: 12,
          life: 300,
          maxLife: 300,
        });
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_fire");
        }
      }
    }

    // C. Unstable Crust (Collapsing Sinkholes)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("unstable_crust")
    ) {
      window.unstableCrustTimer = (window.unstableCrustTimer || 0) + 1;
      if (window.unstableCrustTimer >= 1200) {
        // 20s
        window.unstableCrustTimer = 0;
        if (map && map.grid) {
          let pTileX = Math.floor(p.x / map.tileSize);
          let pTileY = Math.floor(p.y / map.tileSize);
          let collapsed = false;

          for (let attempts = 0; !collapsed && attempts < 30; attempts++) {
            let tx = pTileX + window.randInt(-4, 4);
            let ty = pTileY + window.randInt(-4, 4);
            if (
              tx >= 1 &&
              tx < map.width - 1 &&
              ty >= 1 &&
              ty < map.height - 1
            ) {
              if (map.grid[ty][tx] === window.TILE_TYPES.FLOOR) {
                map.grid[ty][tx] = window.TILE_TYPES.VOID;
                map.needsPreRender = true; // Force map render update
                collapsed = true;
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    tx * map.tileSize + map.tileSize / 2,
                    ty * map.tileSize + map.tileSize / 2,
                    15,
                    "default_slime",
                    3.0,
                  );
                  window.combatVisuals.triggerScreenShake(4, 6);
                }
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    tx * map.tileSize + map.tileSize / 2,
                    ty * map.tileSize + map.tileSize / 2,
                    "SINKHOLE COLLAPSE!",
                    "#e74c3c",
                  );
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
        }
      }
    }

    // D. Temporal Echo (Chronological Mimic Strike Execution)
    if (window.temporalEchoQueue && window.temporalEchoQueue.length > 0) {
      for (let i = window.temporalEchoQueue.length - 1; i >= 0; i--) {
        let echo = window.temporalEchoQueue[i];
        echo.timer--;
        if (echo.timer <= 0) {
          let targetMob = window.activeDungeonMobs
            ? window.activeDungeonMobs.find((m) => m.id === echo.targetId)
            : null;
          if (!targetMob && window.mob && window.mob.id === echo.targetId) {
            targetMob = window.mob;
          }

          if (targetMob && targetMob.hp && targetMob.hp.gt(0)) {
            targetMob.hp = targetMob.hp.sub(echo.damage);
            targetMob.flashTimer = 4;
            if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
              window.RenderEngine.spawnDamageEffect(
                targetMob.x + targetMob.w / 2,
                targetMob.y + targetMob.h / 2,
                echo.damage,
                "echo",
                false,
                targetMob,
              );
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                targetMob.x + targetMob.w / 2,
                targetMob.y + targetMob.h / 2,
                6,
                "calamity_specter",
                1.8,
              );
            }
          }
          window.temporalEchoQueue.splice(i, 1);
        }
      }
    }

    // E. Astral Conjunction (Stellar Laser Strikes)
    if (
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("astral_conjunction")
    ) {
      window.astralConjunctionTimer = (window.astralConjunctionTimer || 0) + 1;
      if (window.astralConjunctionTimer >= 720) {
        // 12s
        window.astralConjunctionTimer = 0;
        let targets = window.activeDungeonMobs
          ? window.activeDungeonMobs.filter(
              (other) => !other.isFriendlyWisp && other.hp.gt(0),
            )
          : [];
        if (window.mob && window.mob.hp.gt(0)) targets.push(window.mob);

        if (targets.length > 0) {
          let tMob = targets[Math.floor(Math.random() * targets.length)];
          let tCx = tMob.x + (tMob.w || 24) / 2;
          let tCy = tMob.y + (tMob.h || 24) / 2;

          let laserDmg = BigNum.from(pStats.atk || p.atk || 15).mul(10.0); // 1000% damage
          tMob.hp = tMob.hp.sub(laserDmg);
          tMob.flashTimer = 12;

          if (window.combatVisuals) {
            window.combatVisuals.spawnBeam(tCx, "#ffffff", 45, false, 0);
            window.combatVisuals.spawnProjectileImpact(tCx, tCy, "boss_nova");
            window.combatVisuals.triggerScreenShake(8, 14);
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell_lightning");
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              tCx,
              tCy - 20,
              "ASTRAL CONJUNCTION!",
              "#ffffff",
            );
          }

          targets.forEach((other) => {
            if (other.id !== tMob.id) {
              let dist = Math.hypot(
                tMob.x + tMob.w / 2 - (other.x + other.w / 2),
                tMob.y + tMob.h / 2 - (other.y + other.h / 2),
              );
              if (dist <= 85) {
                let splashDmg = laserDmg.mul(0.35);
                other.hp = other.hp.sub(splashDmg);
                other.flashTimer = 6;
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    other.x + other.w / 2,
                    other.y + other.h / 2,
                    8,
                    "magma_elemental",
                    2.2,
                  );
                }
              }
            }
          });
        }
      }
    }

    return pStats;
  };
