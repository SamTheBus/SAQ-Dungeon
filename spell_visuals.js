import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";

  const ScopedDate = class extends window.Date {
    static now() {
      return window.Date.now();
    }
  };
  const Date = ScopedDate;
  const activeSpellAnims = [];
  const activeSpellLights = [];

  const spawnVisualSpell = function (type, startX, startY, targets) {
    if (type === "fire") {
      let main = targets[0];
      if (!main) return;
      let angle = Math.atan2(main.y - startY, main.x - startX);
      window.activeSpellAnims.push({
        type: "fireball",
        startX: startX,
        startY: startY,
        targetX: main.x,
        targetY: main.y,
        x: startX,
        y: startY,
        angle: angle,
        progress: 0,
        speed: 7.5,
        splashTargets: targets.slice(1),
        life: 1,
        maxLife: 1,
      });
    } else if (type === "lightning") {
      let chainPoints = [{ x: startX, y: startY }];
      targets.forEach((t) => {
        chainPoints.push({ x: t.x, y: t.y });
      });

      window.activeSpellAnims.push({
        type: "chain_lightning",
        points: chainPoints,
        life: 15,
        maxLife: 15,
        flickerSeed: Math.random() * 100,
      });

      chainPoints.forEach((pt, idx) => {
        window.spawnSpellLight(
          pt.x,
          pt.y,
          110,
          "rgba(0, 240, 255, 0.95)",
          "rgba(0, 100, 255, 0)",
          12,
        );
      });
    } else if (type === "frost") {
      let center = targets[0] || { x: startX, y: startY };
      window.activeSpellAnims.push({
        type: "frost_nova",
        x: center.x,
        y: center.y,
        radius: 4,
        maxRadius: 11, // Scaled down so the needle tips wrap tightly around single targets
        life: 25,
        maxLife: 25,
      });
    }
  };

  const spawnSpellLight = function (
    x,
    y,
    radius,
    innerColor,
    outerColor,
    duration,
  ) {
    window.activeSpellLights.push({
      x: x,
      y: y,
      radius: radius,
      innerColor: innerColor,
      outerColor: outerColor,
      life: duration,
      maxLife: duration,
    });
  };

  const spawnResonantAegisRipple = function (x, y) {
    spawnBarrierShatterVisual(x, y, "resonant_aegis");
  };

  const spawnPortalSealBreakVisual = function (x, y) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "portal_seal_break",
      x,
      y,
      radius: 8,
      maxRadius: 76,
      life: 28,
      maxLife: 28,
    });
  };

  const spawnShadowDashVisual = function (x, y, directionX, directionY, phase) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "shadow_dash",
      x,
      y,
      directionX,
      directionY,
      phase,
      life: phase === "trail" ? 8 : 12,
      maxLife: phase === "trail" ? 8 : 12,
    });
  };

  const spawnMeleeFeelImpact = function (x, y, kind, isOffhand = false, status = null) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "melee_feel_impact",
      x,
      y,
      kind,
      isOffhand,
      status,
      life: kind === "shield" ? 14 : 9,
      maxLife: kind === "shield" ? 14 : 9,
    });
  };

  const spawnGuardPressureVisual = function (x, y, pressure, maxPressure = 3) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "guard_pressure",
      x,
      y,
      pressure,
      maxPressure,
      life: pressure >= maxPressure ? 28 : 14,
      maxLife: pressure >= maxPressure ? 28 : 14,
    });
  };

  const spawnAegisPulseVisual = function (x, y) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "aegis_pulse",
      x: x,
      y: y,
      radius: 4,
      maxRadius: 70, // Upgraded dynamic sanctuary coverage
      life: 25,
      maxLife: 25,
    });
  };

  const spawnNoxiousBloomVisual = function (x, y) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "noxious_bloom",
      x: x,
      y: y,
      radius: 42, // Upgraded cloud coverage radius
      life: 140, // Lingers longer (140 frames)
      maxLife: 140,
      bubbles: Array.from({ length: 10 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: window.randFloat(8, 36),
        size: window.randFloat(2.0, 4.8),
        offsetY: 0,
        speed: window.randFloat(0.4, 0.85),
        phaseOffset: Math.random() * 100, // desynchronize wobbles
      })),
    });
  };

  const spawnSanguineRuptureVisual = function (x, y) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "sanguine_rupture",
      x: x,
      y: y,
      radius: 4,
      maxRadius: 85, // Upgraded shockwave radius
      life: 18,
      maxLife: 18,
    });

    if (window.ParticlePool && window.particles) {
      // 1. Spawn high-velocity blood sprays (streak style)
      for (let i = 0; i < 12; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(4.5, 9.0);
        let pt = window.ParticlePool.get(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.45 - window.randFloat(0.5, 1.5), // flat projection
          window.randFloat(1.5, 2.5),
          Math.random() < 0.6 ? "#960018" : "#c0392b", // deep blood / crimson
          0.95,
          window.randInt(12, 22),
          0.22, // high gravity so they drop
          true,
          0.88, // quick deceleration
        );
        pt.style = "streak";
        window.particles.push(pt);
      }

      // 2. Spawn sharp spinning crystalline blood shards (polygon style)
      for (let i = 0; i < 18; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(3.0, 6.5);
        let pt = window.ParticlePool.get(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.45 - window.randFloat(1, 3.5), // high vertical arc
          window.randFloat(2.0, 4.2),
          Math.random() < 0.65 ? "#c0392b" : "#ff3355", // brilliant crimson / scarlet
          0.95,
          window.randInt(20, 38),
          0.28, // gravity pulls shards down
          true,
          0.94,
        );
        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.35, 0.35);
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }
  };

  const spawnShadowDecoyVisual = function (x, y) {
      if (!window.activeSpellAnims) return;
      let shallowEquipped = {};
      if (window.equippedSlots) {
        for (let key in window.equippedSlots) {
          shallowEquipped[key] = window.equippedSlots[key];
        }
      }
      window.activeSpellAnims.push({
        type: "shadow_decoy",
        x: x,
        y: y,
        life: 120, // 2 seconds
        maxLife: 120,
        facing: window.player ? -window.player.facing : -1,
        equippedSlots: shallowEquipped,
        playerStats: window.playerStats
          ? { ...window.playerStats, shadowStepTimer: 0, fortitudeStacks: 0 }
          : {},
      });
    };

  const spawnArcaneSyphonVisual = function (p, m) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "arcane_syphon",
      playerX: p.x,
      playerY: p.y - 8,
      targetX: m.x + (m.w || 24) / 2,
      targetY: m.y + (m.h || 24) / 2,
      targetObj: m,
      life: 35,
      maxLife: 35,
    });
  };

  const spawnBarrierShatterVisual = function (x, y, presentationSource = "barrier") {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "barrier_shatter",
      x: x,
      y: y,
      radius: 4,
      maxRadius: 90, // Upgraded shatter radius
      life: 24,
      maxLife: 24,
      presentationSource,
    });

    // The committed Resonant Aegis cue is deterministic presentation only.
    // Legacy barrier shatters retain their existing shard embellishment.
    if (
      presentationSource !== "resonant_aegis" &&
      window.ParticlePool &&
      window.particles
    ) {
      // Spawn 28 high-velocity iridescent glass shards
      for (let i = 0; i < 28; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(5.0, 11.0);
        let pt = window.ParticlePool.get(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed * 0.45 - window.randFloat(1.0, 2.5), // flat projection with lift
          window.randFloat(2.0, 4.5),
          Math.random() < 0.5 ? "#00ffff" : "#e84393", // cyan or magenta
          0.95,
          window.randInt(18, 36),
          0.24, // gravity pulls glass down
          true,
          0.92, // deceleration drag
        );
        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.45, 0.45);
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }
  };

  const spawnEarthBreakerBashVisual = function (x, y, angle) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "earth_breaker_bash",
      x: x,
      y: y,
      angle: angle,
      radius: 4,
      maxRadius: 85, // Upgraded forward tremor range
      life: 18,
      maxLife: 18,
    });
  };

  const spawnWindRazor = function (x, y, angle, damage) {
    if (!window.activeSpellAnims) return;
    window.activeSpellAnims.push({
      type: "wind_razor",
      x: x,
      y: y,
      vx: Math.cos(angle) * 8.5,
      vy: Math.sin(angle) * 8.5,
      angle: angle,
      damage: damage,
      hitIds: new Set(), // Keeps track of already pierced enemies to prevent double hitting
      life: 25,
      maxLife: 25,
      radius: 18, // Swept collision width
    });
  };

  const castVisualSpell = function (spellType, p, m, pStats, isOverload) {
    if (pStats.hasArcaneSyphon && window.spawnArcaneSyphonVisual) {
      window.spawnArcaneSyphonVisual(p, m);
    }

    let mainTargetX = m.x + (m.w || 24) / 2;
    let mainTargetY = m.y + (m.h || 24) / 2;

    let targets = [{ x: mainTargetX, y: mainTargetY, obj: m }];

    if (spellType === "fire") {
      if (isOverload && pStats.hasElementalOverload) {
        let range = 80;
        if (window.activeDungeonMobs) {
          window.activeDungeonMobs.forEach((other) => {
            if (other.id !== m.id && isPlayerTargetableMob(other)) {
              let dist = Math.hypot(m.x - other.x, m.y - other.y);
              if (dist <= range) {
                targets.push({
                  x: other.x + (other.w || 24) / 2,
                  y: other.y + (other.h || 24) / 2,
                  obj: other,
                });
              }
            }
          });
        }
        if (
          isPlayerTargetableMob(window.mob) &&
          window.mob.id !== m.id
        ) {
          let dist = Math.hypot(m.x - window.mob.x, m.y - window.mob.y);
          if (dist <= range) {
            targets.push({
              x: window.mob.x + (window.mob.w || 48) / 2,
              y: window.mob.y + (window.mob.h || 48) / 2,
              obj: window.mob,
            });
          }
        }
      }
      window.spawnVisualSpell("fire", p.x, p.y - 8, targets);
    } else if (spellType === "lightning") {
      if (isOverload && pStats.hasElementalOverload) {
        let bouncesLeft = pStats.overloadLevel || 1;
        let hitIds = new Set([m.id]);
        let currentTarget = m;

        while (bouncesLeft > 0) {
          let nextTarget = null;
          if (window.activeDungeonMobs) {
            nextTarget = window.activeDungeonMobs.find(
              (other) =>
                !hitIds.has(other.id) &&
                isPlayerTargetableMob(other) &&
                Math.hypot(
                  currentTarget.x - other.x,
                  currentTarget.y - other.y,
                ) <= 120,
            );
          }
          if (
            !nextTarget &&
            window.mob &&
            !hitIds.has(window.mob.id) &&
            isPlayerTargetableMob(window.mob)
          ) {
            if (
              Math.hypot(
                currentTarget.x - window.mob.x,
                currentTarget.y - window.mob.y,
              ) <= 120
            ) {
              nextTarget = window.mob;
            }
          }
          if (nextTarget) {
            targets.push({
              x: nextTarget.x + (nextTarget.w || 24) / 2,
              y: nextTarget.y + (nextTarget.h || 24) / 2,
              obj: nextTarget,
            });
            hitIds.add(nextTarget.id);
            currentTarget = nextTarget;
            bouncesLeft--;
          } else {
            break;
          }
        }
      }
      window.spawnVisualSpell("lightning", p.x, p.y - 8, targets);
    } else if (spellType === "frost") {
      window.spawnVisualSpell("frost", p.x, p.y - 8, targets);
    }
  };

  const updateSpellAnimations = function () {
    if (window.activeSpellLights) {
      for (let i = window.activeSpellLights.length - 1; i >= 0; i--) {
        let sl = window.activeSpellLights[i];
        sl.life--;
        if (sl.life <= 0) {
          window.activeSpellLights.splice(i, 1);
        }
      }
    }

    if (window.activeSpellAnims) {
      for (let i = window.activeSpellAnims.length - 1; i >= 0; i--) {
        let anim = window.activeSpellAnims[i];

        if (anim.type === "fireball") {
          let dx = anim.targetX - anim.x;
          let dy = anim.targetY - anim.y;
          let dist = Math.hypot(dx, dy);

          if (dist < anim.speed) {
            window.spawnSpellLight(
              anim.targetX,
              anim.targetY,
              150,
              "rgba(255, 180, 50, 0.95)",
              "rgba(230, 80, 10, 0)",
              15,
            );

            if (window.combatVisuals) {
              window.combatVisuals.spawnProjectileImpact(
                anim.targetX,
                anim.targetY,
                "fireball",
              );
              window.combatVisuals.triggerScreenShake(4, 8);
            }

            if (anim.splashTargets && anim.splashTargets.length > 0) {
              anim.splashTargets.forEach((st) => {
                let subAngle = Math.atan2(
                  st.y - anim.targetY,
                  st.x - anim.targetX,
                );
                window.activeSpellAnims.push({
                  type: "fireball_sub",
                  startX: anim.targetX,
                  startY: anim.targetY,
                  targetX: st.x,
                  targetY: st.y,
                  x: anim.targetX,
                  y: anim.targetY,
                  angle: subAngle,
                  progress: 0,
                  speed: 8.5,
                  life: 1,
                  maxLife: 1,
                });
              });
            }

            window.activeSpellAnims.splice(i, 1);
          } else {
            anim.x += (dx / dist) * anim.speed;
            anim.y += (dy / dist) * anim.speed;
            anim.angle = Math.atan2(dy, dx);

            if (window.ParticlePool && Math.random() < 0.6) {
              let pt = window.ParticlePool.get(
                anim.x,
                anim.y,
                -(dx / dist) * 1.5 + window.randFloat(-0.5, 0.5),
                -(dy / dist) * 1.5 + window.randFloat(-0.5, 0.5),
                window.randFloat(1.5, 3.5),
                Math.random() < 0.5 ? "#f97316" : "#fef08a",
                0.9,
                15,
                -0.05,
                true,
              );
              pt.style = "streak";
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "fireball_sub") {
          let dx = anim.targetX - anim.x;
          let dy = anim.targetY - anim.y;
          let dist = Math.hypot(dx, dy);

          if (dist < anim.speed) {
            window.spawnSpellLight(
              anim.targetX,
              anim.targetY,
              80,
              "rgba(249, 115, 22, 0.9)",
              "rgba(234, 88, 12, 0)",
              10,
            );
            if (window.combatVisuals) {
              window.combatVisuals.spawnProjectileImpact(
                anim.targetX,
                anim.targetY,
                "fireball",
              );
            }
            window.activeSpellAnims.splice(i, 1);
          } else {
            anim.x += (dx / dist) * anim.speed;
            anim.y += (dy / dist) * anim.speed;
            anim.angle = Math.atan2(dy, dx);

            if (window.ParticlePool && Math.random() < 0.5) {
              let pt = window.ParticlePool.get(
                anim.x,
                anim.y,
                -(dx / dist) * 1.0 + window.randFloat(-0.4, 0.4),
                -(dy / dist) * 1.0 + window.randFloat(-0.4, 0.4),
                window.randFloat(1.0, 2.5),
                "#ea580c",
                0.85,
                10,
                -0.03,
                true,
              );
              pt.style = "circle";
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "chain_lightning") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            if (window.ParticlePool && Math.random() < 0.4) {
              let ptIdx = Math.floor(Math.random() * anim.points.length);
              let pt = anim.points[ptIdx];
              if (pt) {
                let spark = window.ParticlePool.get(
                  pt.x + window.randFloat(-5, 5),
                  pt.y + window.randFloat(-5, 5),
                  window.randFloat(-1, 1),
                  window.randFloat(-1, 1),
                  window.randFloat(1.2, 2.8),
                  "#00ffff",
                  0.95,
                  12,
                  0,
                  true,
                );
                spark.style = "sparkle_star";
                window.particles.push(spark);
              }
            }
          }
        } else if (anim.type === "frost_nova") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            anim.radius = anim.maxRadius * tRatio;

            window.spawnSpellLight(
              anim.x,
              anim.y,
              anim.radius + 6, // Shrinks the light glow to match the new spell size
              "rgba(224, 242, 254, 0.35)",
              "rgba(56, 189, 248, 0)",
              3,
            );

            let stepCount = 6; // Reduced to match the 6 crystalline spikes
            for (let s = 0; s < stepCount; s++) {
              let angle = (s * Math.PI * 2) / stepCount + tRatio * Math.PI;
              let sx = anim.x + Math.cos(angle) * anim.radius;
              let sy = anim.y + Math.sin(angle) * anim.radius;

              if (window.ParticlePool) {
                let pt = window.ParticlePool.get(
                  sx,
                  sy,
                  Math.cos(angle) * 0.5,
                  Math.sin(angle) * 0.5,
                  window.randFloat(1.2, 2.6),
                  Math.random() < 0.5 ? "#e0f2fe" : "#38bdf8",
                  0.9,
                  15,
                  0.05,
                  true,
                );
                pt.style = "polygon";
                window.particles.push(pt);
              }
            }
          }
        } else if (anim.type === "resonant_aegis") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            // Non-linear explosive expansion equation
            anim.radius = anim.maxRadius * (1 - Math.exp(-5 * tRatio));

            // Emit trailing golden sparks flat along the ground perspective
            if (window.ParticlePool && Math.random() < 0.45) {
              let angle = Math.random() * Math.PI * 2;
              let sx = anim.x + Math.cos(angle) * anim.radius;
              let sy = anim.y + Math.sin(angle) * anim.radius * 0.45; // isometric flat look

              let pt = window.ParticlePool.get(
                sx,
                sy,
                Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.27,
                window.randFloat(1.2, 2.5),
                Math.random() < 0.5 ? "#ffd700" : "#f1c40f",
                0.9,
                15,
                0,
                true,
                0.92,
              );
              pt.style = Math.random() < 0.35 ? "polygon" : "glowing_orb";
              pt.spinSpeed = window.randFloat(-0.15, 0.15);
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "aegis_pulse") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            // Smoothly easing non-linear expansion
            anim.radius =
              anim.maxRadius * (1 - Math.cos((Math.PI / 2) * tRatio));

            // Golden and emerald sparks flat along the ground perspective
            if (window.ParticlePool && Math.random() < 0.55) {
              let angle = Math.random() * Math.PI * 2;
              let sx = anim.x + Math.cos(angle) * anim.radius;
              let sy = anim.y + Math.sin(angle) * anim.radius * 0.45; // isometric flat look

              let pt = window.ParticlePool.get(
                sx,
                sy,
                Math.cos(angle) * 0.5,
                Math.sin(angle) * 0.22,
                window.randFloat(1.2, 2.6),
                Math.random() < 0.55 ? "#ffd700" : "#2ecc71", // gold or emerald
                0.95,
                window.randInt(15, 25),
                0.0,
                true,
                0.88, // slight deceleration
              );
              pt.style = Math.random() < 0.4 ? "sparkle_star" : "glowing_orb";
              pt.spinSpeed = window.randFloat(-0.06, 0.06);
              pt.scaleDecay = 0.015;
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "noxious_bloom") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let alpha = anim.life / anim.maxLife;

            if (anim.bubbles) {
              anim.bubbles.forEach((b) => {
                b.offsetY -= b.speed;

                // Trigger POP event when bubble reaches maximum vertical drift
                if (b.offsetY < -24) {
                  let bx = anim.x + Math.cos(b.angle) * b.radius;
                  let by =
                    anim.y + Math.sin(b.angle) * b.radius * 0.45 + b.offsetY;

                  // Spawn 3 mini green liquid splatter particles on pop
                  if (window.ParticlePool && window.particles) {
                    for (let k = 0; k < 3; k++) {
                      let pAngle = Math.random() * Math.PI * 2;
                      let pSpeed = window.randFloat(1.0, 2.5);
                      let pt = window.ParticlePool.get(
                        bx,
                        by,
                        Math.cos(pAngle) * pSpeed,
                        Math.sin(pAngle) * pSpeed - window.randFloat(0.5, 1.5),
                        window.randFloat(1.0, 1.8),
                        "#2ecc71", // neon green
                        0.85,
                        window.randInt(10, 18),
                        0.15, // gravity
                        true,
                        0.9,
                      );
                      pt.style = "streak";
                      window.particles.push(pt);
                    }
                  }

                  // Play faint click sound on pop
                  if (window.SoundManager && Math.random() < 0.15) {
                    window.SoundManager.play("hover");
                  }

                  // Reset bubble to bottom base
                  b.offsetY = 0;
                  b.radius = window.randFloat(6, anim.radius - 8);
                  b.angle = Math.random() * Math.PI * 2;
                }
              });
            }

            // Spawn rising ambient gaseous spores
            if (window.ParticlePool && Math.random() < 0.45) {
              let angle = Math.random() * Math.PI * 2;
              let dist = window.randFloat(0, anim.radius);
              let sx = anim.x + Math.cos(angle) * dist;
              let sy = anim.y + Math.sin(angle) * dist * 0.45;

              let pt = window.ParticlePool.get(
                sx,
                sy,
                window.randFloat(-0.3, 0.3),
                -window.randFloat(0.4, 1.0),
                window.randFloat(1.5, 3.2),
                Math.random() < 0.6 ? "#2ecc71" : "#a855f7", // green or purple
                0.8 * alpha,
                window.randInt(25, 45),
                -0.02, // float up
                true,
                0.93,
              );
              pt.style = "glowing_orb";
              pt.scaleDecay = 0.015;
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "sanguine_rupture") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            // Fast springy non-linear expansion
            anim.radius =
              anim.maxRadius * (1 - Math.cos((Math.PI / 2) * tRatio));
          }
        } else if (anim.type === "shadow_decoy") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            // Deal rapid mirrored weapon damage every 15 frames
            if (anim.life % 15 === 0 && window.combatVisuals) {
              let dmgRange = 32;
              let applyDecoySlash = (targetMob) => {
                if (
                  targetMob.hp &&
                  targetMob.hp.gt &&
                  targetMob.hp.gt(0) &&
                  !targetMob.isFriendlyWisp
                ) {
                  let mCx = targetMob.x + (targetMob.w || 24) / 2;
                  let mCy = targetMob.y + (targetMob.h || 24) / 2;
                  let dist = Math.hypot(anim.x - mCx, anim.y - mCy);
                  if (dist <= dmgRange + (targetMob.w || 24) / 2) {
                    let pStats = window.resolvePlayerStats
                      ? window.resolvePlayerStats()
                      : {};
                    let baseDmg = pStats.atk || 10;
                    let decoyDmg = Math.round(baseDmg * 0.15); // 15% Attack Power per swing

                    let damageBig =
                      typeof targetMob.hp === "object"
                        ? BigNum.from(decoyDmg)
                        : decoyDmg;
                    if (typeof targetMob.hp === "object") {
                      targetMob.hp = targetMob.hp.sub(damageBig);
                    } else {
                      targetMob.hp -= decoyDmg;
                    }
                    targetMob.flashTimer = 5;
                    targetMob.hasTakenDamage = true;

                    window.combatVisuals.spawnDamageEffect(
                      mCx,
                      mCy,
                      decoyDmg,
                      "dagger",
                      false,
                      targetMob,
                    );
                  }
                }
              };

              if (window.activeDungeonMobs) {
                window.activeDungeonMobs.forEach(applyDecoySlash);
              }
              if (window.mob) {
                applyDecoySlash(window.mob);
              }
            }

            // Emit trailing shadow-ash particles
            if (window.ParticlePool && Math.random() < 0.25) {
              let pt = window.ParticlePool.get(
                anim.x + window.randFloat(-10, 10),
                anim.y + window.randFloat(-10, 10),
                window.randFloat(-0.4, 0.4),
                -window.randFloat(0.3, 0.9),
                window.randFloat(1.0, 2.0),
                "#a855f7",
                0.8,
                15,
                -0.01,
                true,
              );
              pt.style = "circle";
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "arcane_syphon") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            // Stream homing stardust particles from enemy to player
            if (window.ParticlePool && Math.random() < 0.65) {
              let x1 =
                anim.targetObj &&
                anim.targetObj.hp &&
                anim.targetObj.hp.gt &&
                anim.targetObj.hp.gt(0)
                  ? anim.targetObj.x + (anim.targetObj.w || 24) / 2
                  : anim.targetX;
              let y1 =
                anim.targetObj &&
                anim.targetObj.hp &&
                anim.targetObj.hp.gt &&
                anim.targetObj.hp.gt(0)
                  ? anim.targetObj.y + (anim.targetObj.h || 24) / 2
                  : anim.targetY;
              let x2 = window.player ? window.player.x : anim.playerX;
              let y2 = window.player ? window.player.y - 8 : anim.playerY;

              let dx = x2 - x1;
              let dy = y2 - y1;
              let len = Math.hypot(dx, dy);

              if (len > 12) {
                let speed = window.randFloat(3.2, 5.5);
                let travelLife = Math.max(8, Math.floor(len / speed));

                let pt = window.ParticlePool.get(
                  x1, // starts exactly at enemy heart
                  y1,
                  (dx / len) * speed + window.randFloat(-0.3, 0.3),
                  (dy / len) * speed + window.randFloat(-0.3, 0.3),
                  window.randFloat(1.2, 2.4),
                  Math.random() < 0.5 ? "#00ffff" : "#a855f7",
                  0.9,
                  travelLife, // matches travel lifespan to distance
                  0.0,
                  true,
                  0.96, // aerodynamic trailing drag
                );
                pt.style = Math.random() < 0.3 ? "sparkle_star" : "glowing_orb";
                pt.scaleDecay = 0.01;
                window.particles.push(pt);
              }
            }
          }
        } else if (
          anim.type === "shadow_dash" ||
          anim.type === "melee_feel_impact" ||
          anim.type === "guard_pressure" ||
          anim.type === "portal_seal_break"
        ) {
          anim.life--;
          if (anim.life <= 0) window.activeSpellAnims.splice(i, 1);
          else if (anim.type === "portal_seal_break") {
            const tRatio = 1 - anim.life / anim.maxLife;
            anim.radius = anim.maxRadius * tRatio;
          }
        } else if (anim.type === "barrier_shatter") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            // Fast explosive expansion
            anim.radius =
              anim.maxRadius * (1 - Math.cos((Math.PI / 2) * tRatio));
          }
        } else if (anim.type === "earth_breaker_bash") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            let tRatio = 1.0 - anim.life / anim.maxLife;
            // Non-linear explosive expansion
            anim.radius = anim.maxRadius * (1 - Math.exp(-4 * tRatio));

            let coneWidth = 0.45;
            // 1. Emit heavy rock fragments at the leading edge of the shockwave
            if (window.ParticlePool && Math.random() < 0.85) {
              let pAngle = anim.angle + window.randFloat(-coneWidth, coneWidth);
              let sx = anim.x + Math.cos(pAngle) * anim.radius;
              let sy = anim.y + Math.sin(pAngle) * anim.radius * 0.45; // isometric flat look

              let speed = window.randFloat(1.2, 3.5);
              let pt = window.ParticlePool.get(
                sx,
                sy,
                Math.cos(pAngle) * speed,
                Math.sin(pAngle) * speed * 0.45 - window.randFloat(1.0, 3.0), // high upward toss
                window.randFloat(2.5, 4.5),
                Math.random() < 0.5 ? "#78350f" : "#5c3a21", // dark basalt / clay
                0.95,
                window.randInt(20, 35),
                0.32, // high gravity for heavy stone
                true,
                0.95,
              );
              pt.style = "polygon";
              pt.angle = Math.random() * Math.PI * 2;
              pt.spinSpeed = window.randFloat(-0.35, 0.35);
              pt.scaleDecay = 0.012;
              window.particles.push(pt);
            }

            // 2. Emit trailing dust billows at the leading edge
            if (window.ParticlePool && Math.random() < 0.65) {
              let pAngle = anim.angle + window.randFloat(-coneWidth, coneWidth);
              let sx = anim.x + Math.cos(pAngle) * anim.radius;
              let sy = anim.y + Math.sin(pAngle) * anim.radius * 0.45;

              let pt = window.ParticlePool.get(
                sx,
                sy,
                Math.cos(pAngle) * 0.5,
                Math.sin(pAngle) * 0.22,
                window.randFloat(3.0, 5.5),
                "#dca04c", // sand/clay dust
                0.75,
                window.randInt(15, 25),
                0.0,
                true,
                0.86,
              );
              pt.style = "glowing_orb";
              pt.scaleDecay = 0.025;
              window.particles.push(pt);
            }
          }
        } else if (anim.type === "wind_razor") {
          anim.life--;
          if (anim.life <= 0) {
            window.activeSpellAnims.splice(i, 1);
          } else {
            anim.x += anim.vx;
            anim.y += anim.vy;

            let alpha = anim.life / anim.maxLife;
            let size = 18 * (0.4 + alpha * 0.6); // Match the active visual scale

            // Spawn wingtip vortices from the top and bottom of the crescent blade
            if (window.ParticlePool && Math.random() < 0.75) {
              // Calculate perpendicular vector offsets matching flat top-down perspective
              let perpX = -Math.sin(anim.angle) * size;
              let perpY = Math.cos(anim.angle) * size * 0.45;

              [1, -1].forEach((dir) => {
                let wx = anim.x + perpX * dir;
                let wy = anim.y + perpY * dir;

                let pt = window.ParticlePool.get(
                  wx,
                  wy,
                  -anim.vx * 0.15 + window.randFloat(-0.3, 0.3),
                  -anim.vy * 0.15 + window.randFloat(-0.3, 0.3),
                  window.randFloat(1.0, 2.4),
                  Math.random() < 0.55 ? "#22d3ee" : "#ffffff", // Cyan or white
                  0.9,
                  14,
                  0,
                  true,
                  0.92,
                );
                pt.style = "streak";
                window.particles.push(pt);
              });
            }

            // Spawn central trailing aerodynamic wind current streaks
            if (window.ParticlePool && Math.random() < 0.55) {
              let perpAngle = anim.angle + Math.PI / 2;
              let offset = window.randFloat(-8, 8);
              let px = anim.x + Math.cos(perpAngle) * offset;
              let py = anim.y + Math.sin(perpAngle) * offset * 0.45;

              let pt = window.ParticlePool.get(
                px,
                py,
                -anim.vx * 0.25 + window.randFloat(-0.1, 0.1),
                -anim.vy * 0.25 + window.randFloat(-0.1, 0.1),
                window.randFloat(1.2, 2.0),
                "#38bdf8", // Sky blue
                0.8,
                10,
                0,
                true,
                0.88,
              );
              pt.style = "streak";
              window.particles.push(pt);
            }

            // Piercing swept collision against active mobs & bosses
            let range = anim.radius;
            let applyDamage = (targetMob) => {
              if (
                targetMob.hp.gt(0) &&
                !targetMob.isFriendlyWisp &&
                !anim.hitIds.has(targetMob.id)
              ) {
                let mCx = targetMob.x + (targetMob.w || 24) / 2;
                let mCy = targetMob.y + (targetMob.h || 24) / 2;
                let dist = Math.hypot(anim.x - mCx, anim.y - mCy);
                if (dist <= range + (targetMob.w || 24) / 2) {
                  anim.hitIds.add(targetMob.id);
                  targetMob.hp = targetMob.hp.sub(anim.damage);
                  targetMob.flashTimer = 5;
                  targetMob.hasTakenDamage = true;

                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(
                      mCx,
                      mCy,
                      anim.damage,
                      "echo", // custom wind pierce text style
                      false,
                      targetMob,
                    );
                    window.combatVisuals.spawnParticles(
                      mCx,
                      mCy,
                      6,
                      "wyrmling",
                      1.8,
                    );
                  }
                }
              }
            };

            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach(applyDamage);
            }
            if (window.mob) {
              applyDamage(window.mob);
            }
          }
        }
      }
    }
  };

  const renderSpellAnimations = function (ctx) {
    if (!window.activeSpellAnims) return;

    window.activeSpellAnims.forEach((anim) => {
      if (anim.type === "fireball" || anim.type === "fireball_sub") {
        ctx.save();
        ctx.translate(anim.x, anim.y);

        let angle =
          anim.angle ||
          Math.atan2(anim.targetY - anim.y, anim.targetX - anim.x);
        ctx.rotate(angle + Math.PI); // Orient the flame tail facing backwards

        let pulse = Math.sin(Date.now() / 40) * 1.2;
        let r = (anim.type === "fireball" ? 7.5 : 4.5) + pulse;

        // Render 3 layered flickering organic flame shapes
        let drawFlameTongue = (radius, scaleX, scaleY, color) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(-radius * 1.2, 0);
          ctx.quadraticCurveTo(
            -radius * 0.5,
            -radius * 0.8 * scaleY,
            radius * scaleX,
            -radius * 0.4,
          );
          let flickerOffset = Math.sin(Date.now() / 30 + radius) * 2.5;
          ctx.quadraticCurveTo(
            radius * 1.3 * scaleX,
            flickerOffset,
            radius * scaleX,
            radius * 0.4,
          );
          ctx.quadraticCurveTo(
            -radius * 0.5,
            radius * 0.8 * scaleY,
            -radius * 1.2,
            0,
          );
          ctx.closePath();
          ctx.fill();
        };

        ctx.shadowBlur = anim.type === "fireball" ? 14 : 7;
        ctx.shadowColor = "#f97316";

        // Layer 1: Outer glowing red mantle
        drawFlameTongue(r * 1.5, 1.6, 1.2, "#dc2626");

        ctx.shadowBlur = 0; // Disable heavy glow on inner layers for clean crisp shapes

        // Layer 2: Middle bright orange
        drawFlameTongue(r * 1.1, 1.3, 1.0, "#f97316");

        // Layer 3: Inner white-hot yellow-white cores
        drawFlameTongue(r * 0.7, 1.0, 0.8, "#fef08a");
        drawFlameTongue(r * 0.4, 0.7, 0.6, "#ffffff");

        ctx.restore();
      } else if (anim.type === "chain_lightning") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;

        for (let pIdx = 0; pIdx < anim.points.length - 1; pIdx++) {
          let p1 = anim.points[pIdx];
          let p2 = anim.points[pIdx + 1];
          let displace = 18;

          ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
          ctx.lineWidth = 6.0;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#00f0ff";
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          window.drawJaggedLine(ctx, p1.x, p1.y, p2.x, p2.y, displace);
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          window.drawJaggedLine(ctx, p1.x, p1.y, p2.x, p2.y, displace);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          window.drawJaggedLine(ctx, p1.x, p1.y, p2.x, p2.y, displace);
          ctx.stroke();
        }
        ctx.restore();
      } else if (anim.type === "frost_nova") {
        ctx.save();
        let pulse = Math.sin(Date.now() / 100) * 1.5;
        let r = anim.radius;

        // Concentrated outer frosty frost ring
        ctx.strokeStyle = "rgba(0, 210, 255, 0.85)";
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#38bdf8";

        ctx.beginPath();
        ctx.arc(anim.x, anim.y, Math.max(0.1, r), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw 6 sharp geometric ice crystal spokes pointing outward
        ctx.fillStyle = "rgba(224, 242, 254, 0.4)";
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 1.2;
        let shards = 6;
        for (let i = 0; i < shards; i++) {
          let angle = (i * Math.PI * 2) / shards + r * 0.05; // Subtle ice rotation spin
          ctx.save();
          ctx.translate(anim.x, anim.y);
          ctx.rotate(angle);

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-r * 0.25, -r * 0.4);
          ctx.lineTo(0, -r * 1.1); // Diamond point
          ctx.lineTo(r * 0.25, -r * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Concentric inner spinning dashed ring (guarded against negative radius!)
        ctx.strokeStyle = "rgba(224, 242, 254, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(anim.x, anim.y, Math.max(0.1, r * 0.5 + pulse), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (anim.type === "resonant_aegis") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;

        // 1. Draw expanding faint ground fracture lines
        ctx.strokeStyle = `rgba(181, 135, 0, ${alpha * 0.35})`;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        let crackCount = 6;
        for (let k = 0; k < crackCount; k++) {
          let angle = (k * Math.PI * 2) / crackCount + anim.x * 0.05;
          ctx.moveTo(anim.x, anim.y);

          // Draw organic jagged segments
          let segments = 3;
          for (let s = 1; s <= segments; s++) {
            let segmentR = (r * s) / segments;
            let jitter = Math.sin(s * 1.5 + anim.life * 0.1) * 3.5;
            let nextX = anim.x + Math.cos(angle + jitter * 0.03) * segmentR;
            let nextY =
              anim.y + Math.sin(angle + jitter * 0.03) * segmentR * 0.45; // Flattened perspective
            ctx.lineTo(nextX, nextY);
          }
        }
        ctx.stroke();

        // 2. Layered radial golden background shockwave glow
        let glowGrad = ctx.createRadialGradient(
          anim.x,
          anim.y,
          2,
          anim.x,
          anim.y,
          Math.max(0.1, r),
        );
        glowGrad.addColorStop(0, "rgba(255, 215, 0, 0)");
        glowGrad.addColorStop(0.7, `rgba(241, 196, 15, ${alpha * 0.08})`);
        glowGrad.addColorStop(1, `rgba(241, 196, 15, ${alpha * 0.18})`);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(
          anim.x,
          anim.y,
          Math.max(0.1, r),
          Math.max(0.1, r * 0.45),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // 3. High-fidelity Runic Shockwave Ring (Deforming/Wobbling with a wave formula)
        ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 0.95})`;
        ctx.lineWidth = 2.8;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f1c40f";

        ctx.beginPath();
        let steps = 60;
        for (let s = 0; s <= steps; s++) {
          let theta = (s * Math.PI * 2) / steps;
          // Resonance wobble wave formula
          let wobble = 1 + 0.08 * Math.sin(6 * theta - anim.life * 0.35);
          let rw = r * wobble;
          let rx = anim.x + Math.cos(theta) * rw;
          let ry = anim.y + Math.sin(theta) * rw * 0.45; // isometric flat look

          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Translucent Gold Secondary Support Ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(
          anim.x,
          anim.y,
          Math.max(0.1, r * 0.8),
          Math.max(0.1, r * 0.8 * 0.45),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();

        ctx.restore();
      } else if (anim.type === "aegis_pulse") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;

        // 1. Radiant Sacred Background Glow (Emerald to transparent)
        let glowGrad = ctx.createRadialGradient(
          anim.x,
          anim.y,
          2,
          anim.x,
          anim.y,
          Math.max(0.1, r),
        );
        glowGrad.addColorStop(0, `rgba(46, 204, 113, ${alpha * 0.22})`);
        glowGrad.addColorStop(0.6, `rgba(46, 204, 113, ${alpha * 0.08})`);
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(
          anim.x,
          anim.y,
          Math.max(0.1, r),
          Math.max(0.1, r * 0.45),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // 2. Outer Gilded Sanctuary Ring segments (with gap patterns representing runic seals)
        ctx.strokeStyle = `rgba(241, 196, 15, ${alpha * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f1c40f";

        let segmentCount = 4;
        let gapSize = 0.35; // gap in radians
        let stepAngle = (Math.PI * 2) / segmentCount;

        for (let i = 0; i < segmentCount; i++) {
          let startAngle = i * stepAngle + anim.life * 0.05;
          let endAngle = (i + 1) * stepAngle - gapSize + anim.life * 0.05;

          ctx.beginPath();
          ctx.ellipse(
            anim.x,
            anim.y,
            Math.max(0.1, r),
            Math.max(0.1, r * 0.45),
            0,
            startAngle,
            endAngle,
          );
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 3. Inner restorative emerald ring (slightly delayed)
        let rInner = Math.max(0.1, r * 0.72);
        ctx.strokeStyle = `rgba(46, 204, 113, ${alpha * 0.9})`;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#2ecc71";
        ctx.beginPath();
        ctx.ellipse(anim.x, anim.y, rInner, rInner * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Expanding restorative cross-beacons flanking the perimeter
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.5;
        let beaconCount = 6;
        for (let i = 0; i < beaconCount; i++) {
          let angle = (i * Math.PI * 2) / beaconCount + anim.life * 0.02;
          let bx = anim.x + Math.cos(angle) * r;
          let by = anim.y + Math.sin(angle) * r * 0.45;

          // Draw a small clean cross-flare on the ring's edge
          let flareSize = 4.5 * alpha;
          ctx.beginPath();
          ctx.moveTo(bx - flareSize, by);
          ctx.lineTo(bx + flareSize, by);
          ctx.moveTo(bx, by - flareSize);
          ctx.lineTo(bx, by + flareSize);
          ctx.stroke();
        }

        ctx.restore();
      } else if (anim.type === "noxious_bloom") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;
        let time = Date.now();

        // 1. Draw deepest background toxic gas layer (Occult Purple - Counter-Clockwise Rotation)
        ctx.save();
        ctx.translate(anim.x, anim.y);
        ctx.rotate(-time / 1400);
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.09})`;
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let gasNodes = 8;
        for (let k = 0; k <= gasNodes; k++) {
          let angle = (k * Math.PI * 2) / gasNodes;
          let bubbleRadius =
            r * (0.85 + Math.sin(angle * 3 + time * 0.003) * 0.08);
          ctx.lineTo(
            Math.cos(angle) * bubbleRadius,
            Math.sin(angle) * bubbleRadius * 0.45,
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 2. Draw foreground toxic gas layer (Neon Green - Clockwise Rotation)
        ctx.save();
        ctx.translate(anim.x, anim.y);
        ctx.rotate(time / 1100);
        ctx.fillStyle = `rgba(46, 204, 113, ${alpha * 0.09})`;
        ctx.strokeStyle = `rgba(46, 204, 113, ${alpha * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = 0; k <= gasNodes; k++) {
          let angle = (k * Math.PI * 2) / gasNodes;
          let bubbleRadius =
            r * (0.65 + Math.cos(angle * 3 - time * 0.004) * 0.06);
          ctx.lineTo(
            Math.cos(angle) * bubbleRadius,
            Math.sin(angle) * bubbleRadius * 0.45,
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 3. Draw deforming, wobbly 3D rising poison globules
        if (anim.bubbles) {
          anim.bubbles.forEach((b) => {
            let bx = anim.x + Math.cos(b.angle) * b.radius;
            let by = anim.y + Math.sin(b.angle) * b.radius * 0.45 + b.offsetY;

            ctx.save();
            ctx.translate(bx, by);

            // Calculate bubble scale decay over height
            let ageRatio = Math.max(0.1, 1.0 - Math.abs(b.offsetY) / 24);
            let size = b.size * ageRatio;

            // Restorative / Toxic emerald-to-purple radial fill
            let bubbleGrad = ctx.createRadialGradient(
              -size * 0.2,
              -size * 0.2,
              0,
              0,
              0,
              size,
            );
            bubbleGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            bubbleGrad.addColorStop(
              0.3,
              `rgba(163, 253, 131, ${alpha * 0.85})`,
            ); // neon green core
            bubbleGrad.addColorStop(
              0.85,
              `rgba(142, 68, 173, ${alpha * 0.75})`,
            ); // purple border
            bubbleGrad.addColorStop(1, `rgba(20, 61, 31, ${alpha * 0.4})`);
            ctx.fillStyle = bubbleGrad;

            ctx.strokeStyle = `rgba(142, 68, 173, ${alpha * 0.8})`;
            ctx.lineWidth = 1.0;

            // Draw deforming wobbly bubble shape using a sine wobble
            ctx.beginPath();
            let bSteps = 16;
            for (let s = 0; s <= bSteps; s++) {
              let theta = (s * Math.PI * 2) / bSteps;
              let wobble =
                1 + 0.12 * Math.sin(4 * theta + time * 0.015 + b.phaseOffset);
              let rw = size * wobble;
              ctx.lineTo(Math.cos(theta) * rw, Math.sin(theta) * rw);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw glossy white specular highlight spot
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(-size * 0.3, -size * 0.3, size * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          });
        }

        ctx.restore();
      } else if (anim.type === "sanguine_rupture") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;

        // 1. Draw central expanding dark-red blood stain backplate
        let stainGrad = ctx.createRadialGradient(
          anim.x,
          anim.y,
          2,
          anim.x,
          anim.y,
          Math.max(0.1, r),
        );
        stainGrad.addColorStop(0, `rgba(150, 0, 24, ${alpha * 0.24})`);
        stainGrad.addColorStop(0.6, `rgba(150, 0, 24, ${alpha * 0.08})`);
        stainGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = stainGrad;
        ctx.beginPath();
        ctx.ellipse(
          anim.x,
          anim.y,
          Math.max(0.1, r),
          Math.max(0.1, r * 0.45),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Helper to draw a deforming, splattering liquid ring
        let drawSplatterRing = (
          radius,
          strokeColor,
          width,
          glowSize,
          glowColor,
        ) => {
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = width;
          if (glowSize > 0) {
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = glowColor;
          }

          ctx.beginPath();
          let steps = 45;
          for (let s = 0; s <= steps; s++) {
            let theta = (s * Math.PI * 2) / steps;
            // Harmonic wave deformity to represent splatter liquid edge
            let wobble = 1 + 0.09 * Math.sin(8 * theta + anim.life * 0.45);
            let rw = radius * wobble;
            let rx = anim.x + Math.cos(theta) * rw;
            let ry = anim.y + Math.sin(theta) * rw * 0.45; // isometric flat look

            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        };

        // 2. Wave 1: Primary Heavy Deep Blood Red Eruption Rim
        drawSplatterRing(
          r,
          `rgba(150, 0, 24, ${alpha * 0.95})`,
          3.2,
          14,
          "#960018",
        );

        // 3. Wave 2: Middle Crimson Detonation Wave (slightly offset behind)
        if (alpha < 0.75) {
          let innerAlpha = (0.75 - alpha) / 0.75;
          let rInner = r * 0.72;
          drawSplatterRing(
            rInner,
            `rgba(192, 57, 43, ${innerAlpha * 0.95})`,
            2.2,
            8,
            "#c0392b",
          );
        }

        // 4. Wave 3: White-Hot Core Flash Ring (Center)
        let rCore = r * 0.35;
        drawSplatterRing(
          rCore,
          `rgba(255, 255, 255, ${alpha * 0.9})`,
          1.5,
          0,
          null,
        );

        ctx.restore();
      } else if (anim.type === "shadow_decoy") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let scale = 1.0;
        let bounce = Math.sin(Date.now() / 50) * 1.5; // High frequency shaking
        let slashFrame = Math.floor(Date.now() / 120) % 2 === 0; // Rapid slashes

        ctx.globalAlpha = alpha * 0.55; // Ghostly translucency

        window.drawSingleHero(
          ctx,
          anim.x,
          anim.y,
          scale,
          anim.equippedSlots,
          anim.playerStats,
          bounce,
          {
            facing: anim.facing,
            isTrail: true, // Forces translucent purple "void" skin
            isMainHero: false,
            slashFrame: slashFrame,
          },
        );
        ctx.restore();
      } else if (anim.type === "arcane_syphon") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;

        let x1 =
          anim.targetObj &&
          anim.targetObj.hp &&
          anim.targetObj.hp.gt &&
          anim.targetObj.hp.gt(0)
            ? anim.targetObj.x + (anim.targetObj.w || 24) / 2
            : anim.targetX;
        let y1 =
          anim.targetObj &&
          anim.targetObj.hp &&
          anim.targetObj.hp.gt &&
          anim.targetObj.hp.gt(0)
            ? anim.targetObj.y + (anim.targetObj.h || 24) / 2
            : anim.targetY;

        let x2 = window.player ? window.player.x : anim.playerX;
        let y2 = window.player ? window.player.y - 8 : anim.playerY;

        let dx = x2 - x1;
        let dy = y2 - y1;
        let len = Math.hypot(dx, dy);
        let angle = Math.atan2(dy, dx);

        let nx = -Math.sin(angle);
        let ny = Math.cos(angle);

        let timeOffset = Date.now() * 0.022;
        let helixAmp = 8.5;
        let twists = Math.PI * 4.5; // 2.25 full waves

        // 1. Draw glowing terminal rings at both connection junctions
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Render Pass 1: Cyan Ribbon
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.lineWidth = 2.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00f0ff";
        ctx.beginPath();
        for (let j = 0; j <= 20; j++) {
          let t = j / 20;
          let px = x1 + dx * t;
          let py = y1 + dy * t;
          let offset =
            Math.sin(t * twists - timeOffset) * helixAmp * (1.0 - t * 0.25);
          let hx = px + nx * offset;
          let hy = py + ny * offset;
          if (j === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.stroke();

        // Render Pass 1 Core: White-Hot leading line on Cyan
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let j = 0; j <= 20; j++) {
          let t = j / 20;
          let px = x1 + dx * t;
          let py = y1 + dy * t;
          let offset =
            Math.sin(t * twists - timeOffset) * helixAmp * (1.0 - t * 0.25);
          let hx = px + nx * offset;
          let hy = py + ny * offset;
          if (j === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.stroke();

        // Render Pass 2: Purple Ribbon (180 deg phase offset)
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.lineWidth = 2.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#a855f7";
        ctx.beginPath();
        for (let j = 0; j <= 20; j++) {
          let t = j / 20;
          let px = x1 + dx * t;
          let py = y1 + dy * t;
          let offset =
            Math.sin(t * twists - timeOffset + Math.PI) *
            helixAmp *
            (1.0 - t * 0.25);
          let hx = px + nx * offset;
          let hy = py + ny * offset;
          if (j === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.stroke();

        // Render Pass 2 Core: White-Hot leading line on Purple
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let j = 0; j <= 20; j++) {
          let t = j / 20;
          let px = x1 + dx * t;
          let py = y1 + dy * t;
          let offset =
            Math.sin(t * twists - timeOffset + Math.PI) *
            helixAmp *
            (1.0 - t * 0.25);
          let hx = px + nx * offset;
          let hy = py + ny * offset;
          if (j === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.stroke();

        ctx.restore();
      } else if (anim.type === "shadow_dash") {
        ctx.save();
        const alpha = anim.life / anim.maxLife;
        const angle = Math.atan2(anim.directionY, anim.directionX);
        ctx.translate(anim.x, anim.y);
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.lineWidth = anim.phase === "trail" ? 3 : 5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#7c3aed";
        ctx.beginPath();
        ctx.moveTo(-22, -7);
        ctx.lineTo(5, 0);
        ctx.lineTo(-22, 7);
        ctx.stroke();
        ctx.restore();
      } else if (anim.type === "melee_feel_impact") {
        ctx.save();
        const alpha = anim.life / anim.maxLife;
        const shield = anim.kind === "shield";
        const color = anim.status === "poison" ? "#4ade80" : anim.status === "bleed" ? "#fb2c36" : shield ? "#fbbf24" : "#e9d5ff";
        ctx.translate(anim.x, anim.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = shield ? 5 : anim.isOffhand ? 2 : 3;
        ctx.shadowBlur = shield ? 12 : 7;
        ctx.shadowColor = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        if (shield) {
          ctx.arc(0, 0, 11 + (1 - alpha) * 11, -0.8, 0.8);
        } else {
          ctx.moveTo(-14, anim.isOffhand ? 7 : -7);
          ctx.lineTo(15, anim.isOffhand ? -8 : 8);
        }
        ctx.stroke();
        ctx.restore();
      } else if (anim.type === "guard_pressure") {
        ctx.save();
        const alpha = anim.life / anim.maxLife;
        ctx.strokeStyle = anim.pressure >= anim.maxPressure ? `rgba(250, 204, 21, ${alpha})` : `rgba(148, 163, 184, ${alpha * 0.7})`;
        ctx.lineWidth = anim.pressure >= anim.maxPressure ? 3 : 1.5;
        for (let j = 0; j < anim.pressure; j++) {
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, 16 + j * 4, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
        ctx.restore();
      } else if (anim.type === "portal_seal_break") {
        ctx.save();
        const alpha = anim.life / anim.maxLife;
        ctx.translate(anim.x, anim.y);
        ctx.rotate((1 - alpha) * 0.35);
        ctx.strokeStyle = `rgba(217, 70, 239, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#7e22ce";
        for (let j = 0; j < 6; j++) {
          const a = j * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * anim.radius * 0.35, Math.sin(a) * anim.radius * 0.18);
          ctx.lineTo(Math.cos(a) * anim.radius, Math.sin(a) * anim.radius * 0.48);
          ctx.stroke();
        }
        ctx.restore();
      } else if (anim.type === "barrier_shatter") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;

        // 1. Radiant central white-hot flash
        let glowGrad = ctx.createRadialGradient(
          anim.x,
          anim.y,
          2,
          anim.x,
          anim.y,
          Math.max(0.1, r * 0.5),
        );
        glowGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
        glowGrad.addColorStop(0.5, `rgba(0, 240, 255, ${alpha * 0.2})`);
        glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(
          anim.x,
          anim.y,
          Math.max(0.1, r * 0.5),
          Math.max(0.1, r * 0.5 * 0.45),
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // 2. Outer expanding crystalline octagon (Cyan)
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00ffff";

        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          let angle = (j * Math.PI) / 4;
          let px = anim.x + Math.cos(angle) * r;
          let py = anim.y + Math.sin(angle) * r * 0.45; // flat perspective
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // 3. Inner concentric offset octagon (Magenta)
        ctx.strokeStyle = `rgba(232, 67, 147, ${alpha * 0.85})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#e84393";

        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          let angle = (j * Math.PI) / 4 + Math.PI / 8;
          let px = anim.x + Math.cos(angle) * r * 0.65;
          let py = anim.y + Math.sin(angle) * r * 0.65 * 0.45;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Interlocking structural fracture seams (The Webbing Cracks)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          let angleOuter = (j * Math.PI) / 4;
          let angleInner = (j * Math.PI) / 4 + Math.PI / 8;

          // Draw a jagged fracturing line from center to outer point
          ctx.moveTo(anim.x, anim.y);
          let segments = 3;
          for (let s = 1; s <= segments; s++) {
            let segR = (r * s) / segments;
            let jitter = Math.sin(s * 2.3 + j) * 3.5;
            let px = anim.x + Math.cos(angleOuter + jitter * 0.02) * segR;
            let py =
              anim.y + Math.sin(angleOuter + jitter * 0.02) * segR * 0.45;
            ctx.lineTo(px, py);
          }

          // Connect outer point to inner point (cross-shattering cracks)
          let pOuterX = anim.x + Math.cos(angleOuter) * r;
          let pOuterY = anim.y + Math.sin(angleOuter) * r * 0.45;
          let pInnerX = anim.x + Math.cos(angleInner) * r * 0.65;
          let pInnerY = anim.y + Math.sin(angleInner) * r * 0.65 * 0.45;

          ctx.moveTo(pOuterX, pOuterY);
          ctx.lineTo(pInnerX, pInnerY);
        }
        ctx.stroke();

        ctx.restore();
      } else if (anim.type === "earth_breaker_bash") {
        ctx.save();
        let alpha = anim.life / anim.maxLife;
        let r = anim.radius;
        let coneWidth = 0.45; // ~25 degrees on each side (~50 total cone)

        // 1. Draw a translucent directional warning/tremor area cone (flat isometric look)
        ctx.fillStyle = `rgba(120, 53, 15, ${alpha * 0.14})`;
        ctx.strokeStyle = `rgba(220, 160, 76, ${alpha * 0.45})`;
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        ctx.moveTo(anim.x, anim.y);
        // Custom isometric arc drawing to match flat perspective
        let segmentsCount = 20;
        for (let s = 0; s <= segmentsCount; s++) {
          let subAngle =
            anim.angle - coneWidth + (s * (coneWidth * 2)) / segmentsCount;
          ctx.lineTo(
            anim.x + Math.cos(subAngle) * r,
            anim.y + Math.sin(subAngle) * r * 0.45,
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Render expanding buckling earth waves
        ctx.strokeStyle = `rgba(220, 160, 76, ${alpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let s = 0; s <= segmentsCount; s++) {
          let subAngle =
            anim.angle - coneWidth + (s * (coneWidth * 2)) / segmentsCount;
          ctx.lineTo(
            anim.x + Math.cos(subAngle) * r * 0.5,
            anim.y + Math.sin(subAngle) * r * 0.5 * 0.45,
          );
        }
        ctx.stroke();

        // 3. Render 3 distinct volumetric jagged fissures bursting outward
        let cracksCount = 3;
        ctx.lineJoin = "round";

        for (let k = 0; k < cracksCount; k++) {
          let subAngle =
            anim.angle - coneWidth + (k * (coneWidth * 2)) / (cracksCount - 1);
          let segments = 4;

          // Pass 1: Draw volumetric dark shadow crack base
          ctx.strokeStyle = `rgba(20, 10, 5, ${alpha * 0.95})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(anim.x, anim.y);
          for (let s = 1; s <= segments; s++) {
            let curDist = (r * s) / segments;
            let jitterX = Math.sin(s * 2.3 + k) * 3 * (s / segments);
            let jitterY = Math.cos(s * 1.8 + k) * 3 * (s / segments);
            let nextX = anim.x + Math.cos(subAngle) * curDist + jitterX;
            let nextY = anim.y + Math.sin(subAngle) * curDist * 0.45 + jitterY;
            ctx.lineTo(nextX, nextY);
          }
          ctx.stroke();

          // Pass 2: Draw bright molten/earth core line overlay
          ctx.strokeStyle = `rgba(220, 110, 30, ${alpha * 0.95})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(anim.x, anim.y);
          for (let s = 1; s <= segments; s++) {
            let curDist = (r * s) / segments;
            let jitterX = Math.sin(s * 2.3 + k) * 3 * (s / segments);
            let jitterY = Math.cos(s * 1.8 + k) * 3 * (s / segments);
            let nextX = anim.x + Math.cos(subAngle) * curDist + jitterX;
            let nextY = anim.y + Math.sin(subAngle) * curDist * 0.45 + jitterY;
            ctx.lineTo(nextX, nextY);
          }
          ctx.stroke();
        }

        ctx.restore();
      } else if (anim.type === "wind_razor") {
        ctx.save();
        ctx.translate(anim.x, anim.y);
        ctx.rotate(anim.angle);

        let alpha = anim.life / anim.maxLife;
        let size = 18 * (0.4 + alpha * 0.6); // Upgraded scale

        // Scale vertical height slightly to match flat perspective
        ctx.scale(1.0, 0.45);

        // 1. Draw heavy dark-indigo shadow backing
        ctx.fillStyle = "rgba(10, 8, 30, 0.55)";
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(-size * 0.7, 0, 0, size);
        ctx.quadraticCurveTo(-size * 1.35, 0, 0, -size);
        ctx.closePath();
        ctx.fill();

        // 2. Outer sharp glowing cyan blade body
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha * 0.3})`;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha * 0.95})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#06b6d4";

        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(-size * 0.65, 0, 0, size);
        ctx.quadraticCurveTo(-size * 1.2, 0, 0, -size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Inner brilliant white leading edge core
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.85);
        ctx.quadraticCurveTo(-size * 0.52, 0, 0, size * 0.85);
        ctx.stroke();

        ctx.restore();
      }
    });
  };

export {
  activeSpellAnims,
  activeSpellLights,
  spawnVisualSpell,
  spawnSpellLight,
  spawnResonantAegisRipple,
  spawnPortalSealBreakVisual,
  spawnShadowDashVisual,
  spawnMeleeFeelImpact,
  spawnGuardPressureVisual,
  spawnAegisPulseVisual,
  spawnNoxiousBloomVisual,
  spawnSanguineRuptureVisual,
  spawnShadowDecoyVisual,
  spawnArcaneSyphonVisual,
  spawnBarrierShatterVisual,
  spawnEarthBreakerBashVisual,
  spawnWindRazor,
  castVisualSpell,
  updateSpellAnimations,
  renderSpellAnimations,
};
