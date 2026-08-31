import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import { addActiveDungeonMob } from "./encounter_state.js?v=1.004";
import { isBelowHealthFraction } from "./combat_scaling.js?v=1.001";

    export const BossAIEngine = {
      initBoss(m) {
        if (m.bossInitialized) return;
        m.bossInitialized = true;
        m.phase = 1;
        m.actionState = "idle"; // "idle" | "chase" | "telegraphing" | "channeling" | "dazed"
        m.staggerShield = BigNum.from(0);
        m.maxStaggerShield = BigNum.from(0);
        m.channelTimer = 0;
        m.maxChannelTimer = 0;
        m.telegraphTimer = 0;
        m.maxTelegraphTimer = 65;
        m.attackCooldown = 60;
        m.funnyText = "";
        m.funnyTextTimer = 0;
        m.activeEffects = [];
        m.targetX = m.x;
        m.targetY = m.y;

        // Map boss key name by evaluating visualType, name, or type
        m.bossKey = this.resolveBossKey(m);
      },

      resolveBossKey(m) {
        let nameLower = (m.name || "").toLowerCase();
        if (m.visualType === "marcus" || nameLower.includes("marcus"))
          return "marcus";
        if (m.visualType === "aegis_goliath" || nameLower.includes("aegis"))
          return "aegis_goliath";
        if (
          m.visualType === "chronos_arbitrator" ||
          nameLower.includes("chronos")
        )
          return "chronos_arbitrator";
        if (m.visualType === "nexus_overseer" || nameLower.includes("nexus"))
          return "nexus_overseer";
        if (
          m.visualType === "gilded_vault_keeper" ||
          nameLower.includes("gilded") ||
          nameLower.includes("vault keeper")
        )
          return "gilded_vault_keeper";
        if (
          m.visualType === "corrosive_abomination" ||
          nameLower.includes("corrosive") ||
          nameLower.includes("abomination")
        )
          return "corrosive_abomination";
        if (
          m.visualType === "hooktail" ||
          nameLower.includes("hooktail") ||
          nameLower.includes("calamity")
        )
          return "hooktail";
        if (
          m.visualType === "overlord_iron_vault" ||
          nameLower.includes("iron vault") ||
          nameLower.includes("overlord")
        )
          return "overlord_iron_vault";

        // Fallback to active stage biome
        let tier =
          typeof window.getStageTier === "function" ? window.getStageTier() : 0;
        const biomes = [
          "arachnid_treant", // Zone 1
          "aegis_goliath", // Zone 2
          "overlord_iron_vault", // Zone 3
          "corrosive_abomination", // Zone 4
          "void_overseer", // Zone 5
          "chronos_arbitrator", // Zone 6
          "nexus_overseer", // Zone 7
        ];
        return biomes[tier] || "arachnid_treant";
      },

      update(m, activeDungeonMap = getActiveDungeonMap()) {
        if (!m || m.hp.lte(0)) return;
        this.initBoss(m);

        let p = window.player;
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};

        if (m.flashTimer > 0) m.flashTimer--;
        if (m.attackCooldown > 0) m.attackCooldown--;
        if (m.funnyTextTimer > 0) m.funnyTextTimer--;

        // Dampen recoil
        if (m.recoilX) {
          m.recoilX *= 0.65;
          if (Math.abs(m.recoilX) < 0.2) m.recoilX = 0;
        }
        if (m.recoilY) {
          m.recoilY *= 0.65;
          if (Math.abs(m.recoilY) < 0.2) m.recoilY = 0;
        }

        let dx = p.x - (m.x + m.w / 2);
        let dy = p.y - (m.y + m.h / 2);
        let dist = Math.hypot(dx, dy);

        // Decoupled continuous contact/touch damage check for bosses
        if (dist < m.w * 0.48 + (p.radius || 9)) {
          m.lastContactDamageTime = m.lastContactDamageTime || 0;
          if (window.logicClock - m.lastContactDamageTime >= 40) {
            m.lastContactDamageTime = window.logicClock;
            window.damagePlayer(Math.round(m.atk * 0.5), m);
            if (p.hp <= 0) {
              window.startDeathSequence();
            }
          }
        }

        // Update facing direction
        if (dx < -1) m.facing = -1;
        else if (dx > 1) m.facing = 1;

        // Push player back gently on solid overlap
        let radius = (m.w || 48) * 0.48;
        let pRadius = p.radius || 9;
        let bossMinDist = pRadius + radius;
        if (dist < bossMinDist) {
          let overlap = bossMinDist - dist;
          let nx = dist > 0 ? dx / dist : 1;
          let ny = dist > 0 ? dy / dist : 0;
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.35);

          let pushX = -nx * overlap * 0.15;
          let pushY = -ny * overlap * 0.15;
          let map = activeDungeonMap;
          if (map && map.grid) {
            let bx = m.x + m.w / 2;
            let by = m.y + m.h / 2;
            if (
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(map, bx + pushX, by, radius)
            )
              m.x += pushX;
            if (
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(map, bx, by + pushY, radius)
            )
              m.y += pushY;
          } else {
            m.x += pushX;
            m.y += pushY;
          }
        }

        // Route to specific boss strategy execution based on resolved key
        switch (m.bossKey) {
          case "marcus":
            this.updateMarcus(m, p, pStats, dist, dx, dy, activeDungeonMap);
            break;
          case "arachnid_treant":
            this.updateArachnidTreant(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "aegis_goliath":
            this.updateAegisGoliath(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "overlord_iron_vault":
            this.updateOverlordIronVault(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "corrosive_abomination":
            this.updateCorrosiveAbomination(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "void_overseer":
            this.updateVoidOverseer(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "chronos_arbitrator":
            this.updateChronosArbitrator(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "nexus_overseer":
            this.updateNexusOverseer(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "gilded_vault_keeper":
            this.updateGildedVaultKeeper(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          case "hooktail":
            this.updateHooktail(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
          default:
            this.updateStandardFallback(
              m,
              p,
              pStats,
              dist,
              dx,
              dy,
              activeDungeonMap,
            );
            break;
        }
      },

      // Baseline fallback/standard movements for safety and modular scaling
      updateStandardFallback(m, p, pStats, dist, dx, dy, activeDungeonMap) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.state === "telegraphing" || m.actionState === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;
            let ability = m.activeAbility;
            if (ability === "slam") {
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
            } else if (ability === "nova") {
              for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                window.projectiles.push({
                  x: cx,
                  y: cy,
                  vx: Math.cos(angle) * 3.8,
                  vy: Math.sin(angle) * 3.8,
                  r: 6,
                  pulseOffset: i,
                  type: "boss_nova",
                  damage: Math.round(m.atk * 1.1),
                  life: 120,
                });
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");
            } else if (ability === "charge") {
              let dX = m.targetX - cx;
              let dY = m.targetY - cy;
              let dDist = Math.hypot(dX, dY);
              if (dDist > 0) {
                m.x += (dX / dDist) * 75;
                m.y += (dY / dDist) * 75;
              }
              if (
                Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2)) <= 42
              ) {
                window.damagePlayer(Math.round(m.atk * 1.5), m);
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player when within range
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.8 * (m.speedMultiplier || 1.0);
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 60;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let moves = m.moveset || ["slam", "nova", "charge"];
            let chosen = moves[Math.floor(Math.random() * moves.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && moves.includes("slam") && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 65;
            m.maxTelegraphTimer = 65;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },

      // Subphase placeholders (will be fleshed out progressively with stunning visuals)
      updateMarcus(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // Manage active visual timer for flying lasso rope
        if (m.lassoVisualTimer > 0) {
          m.lassoVisualTimer--;
        }

        // --- PHASE 2 TRIGGER: MOLTEN SHIELD & SIPHON (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && m.phase === 1) {
          m.phase = 2;
          m.actionState = "molten_shield";
          m.isStopped = true;
          m.channelTimer = 240; // 4 seconds (240 frames)
          m.staggerShield = m.maxHp.mul(0.2); // 20% Max HP stagger barrier
          m.maxStaggerShield = m.maxHp.mul(0.2);

          // Teleport directly to the center of the arena
          let map = activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: MOLTEN SHIELD!",
              "#ea580c",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "magma_elemental",
              4.5,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell");
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Marcus activated Molten Shield! Shatter his barrier to interrupt the Gold & HP Siphon!",
              "#ea580c",
            );
          }
        }

        // Processing active Molten Shield & Siphon channel
        if (m.actionState === "molten_shield") {
          m.channelTimer--;

          // Balanced siphon interval: Every 15 frames (4 times a second)
          if (window.logicClock % 15 === 0) {
            // Siphon Gold from permanent wallet
            let playerGold = BigNum.from(window.playerStats.coins || 0);
            let siphonGold = BigNum.from(
              Math.max(1, Math.floor((window.playerStats.level || 1) * 3.5)),
            );
            if (playerGold.gt(0)) {
              if (playerGold.lt(siphonGold)) {
                siphonGold = playerGold;
              }
              window.playerStats.coins = playerGold.sub(siphonGold);
              let healVal = siphonGold.mul(10);
              m.hp = window.BigNumMin(m.maxHp, m.hp.add(healVal));
            }

            // Siphon HP (1.5% Max HP per tick)
            let hpSiphon = Math.round(p.maxHp * 0.015);
            p.hp = Math.max(1, p.hp - hpSiphon);
            m.hp = window.BigNumMin(
              m.maxHp,
              m.hp.add(BigNum.from(hpSiphon * 4)),
            ); // Restores boss health

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                p.x,
                p.y - 12,
                `-${hpSiphon} HP (SIPHONED)`,
                "#e74c3c",
              );
            }

            // Spark siphon lines travelling from player to Marcus
            if (window.combatVisuals && window.combatVisuals.particlePool) {
              let angle = Math.atan2(cy - p.y, cx - p.x);
              window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-6, 6),
                p.y - 4 + window.randFloat(-6, 6),
                Math.cos(angle) * 4.5,
                Math.sin(angle) * 4.5,
                window.randFloat(1.5, 3.0),
                "#ffd700",
                0.85,
                15,
                15,
                0,
                true,
              );
              window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-6, 6),
                p.y - 4 + window.randFloat(-6, 6),
                Math.cos(angle) * 4.5,
                Math.sin(angle) * 4.5,
                window.randFloat(1.5, 3.0),
                "#e74c3c",
                0.85,
                15,
                15,
                0,
                true,
              );
            }

            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("hit");
            }
          }

          if (m.channelTimer <= 0) {
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 110;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] Taxation siphon completed. Marcus has recovered massive health!",
                "#e74c3c",
              );
            }
          }
          return; // Skip normal combat movement/attack AI while shielded
        }

        // Handle Dazed stun sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return;
        }
        m.isStopped = false;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 100; // Recovery time

            let ability = m.activeAbility;
            if (ability === "lasso") {
              // Gilded Lasso: Check collision at targeted coordinate
              let hitDist = Math.hypot(p.x - m.targetX, p.y - m.targetY);
              if (hitDist <= 48) {
                let angle = Math.atan2(cy - p.y, cx - p.x);
                let pullX = cx - Math.cos(angle) * 16;
                let pullY = cy - Math.sin(angle) * 16;

                // Fire tether visual trace
                m.lassoVisualTimer = 15;
                m.lassoVisualX = p.x;
                m.lassoVisualY = p.y;

                // Pull player coordinate smoothly
                p.knockbackVx = (pullX - p.x) * 0.35;
                p.knockbackVy = (pullY - p.y) * 0.35;

                // Inflict heavy damage & snare slow
                window.damagePlayer(Math.round(m.atk * 1.55), m);
                p.snareTimer = 180; // 3-second slow

                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "LASSOED! -60% Speed",
                    "#f1c40f",
                    true,
                  );
                }

                if (window.combatVisuals) {
                  window.combatVisuals.triggerScreenShake(6, 10);
                  window.combatVisuals.spawnParticles(
                    p.x,
                    p.y,
                    15,
                    "gold_dungeon",
                    3,
                  );
                }
                if (
                  window.SoundManager &&
                  typeof window.SoundManager.play === "function"
                ) {
                  window.SoundManager.play("block");
                }
              }
            } else if (ability === "barrage") {
              // Coin Barrage: Spawns a radial ring of 8 fast-moving gold coins
              let coinDmg = Math.round(m.atk * 0.42);
              let speed = 4.2;
              for (let i = 0; i < 8; i++) {
                let angle = (i * Math.PI * 2) / 8;
                window.projectiles.push({
                  x: cx + Math.cos(angle) * 12,
                  y: cy + Math.sin(angle) * 12,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  r: 4.5,
                  type: "coin_barrage",
                  damage: coinDmg,
                  life: 240, // 4 seconds max life
                  bounces: 0,
                  pulseOffset: Math.random() * 10,
                });
              }
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("spell_fire");
              }
            } else if (ability === "inversion") {
              // Inversion Field: Caught player receives a 3.0-second inverted controls debuff
              let range = 120;
              if (dist <= range) {
                p.glitchTimer = 180; // 3.0s at 60 FPS
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "[GLITCHED] Inverted Controls!",
                    "#ff007f",
                    true,
                  );
                }
              }

              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(5, 8);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "void_orb", // Deep void-purple particles
                  3.5,
                );
              }
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("spell");
              }
            } else if (ability === "gold_rush_dash" && m.dashNodes) {
              // Gold Rush Dash: Rapid zigzag dash leaving molten slag pools
              m.dashNodes.forEach((node) => {
                let targetX = node.x - m.w / 2;
                let targetY = node.y - m.h / 2;

                // Wall-clamping check
                if (
                  !window.checkCollisionAt(
                    activeDungeonMap,
                    node.x,
                    node.y,
                    12,
                  )
                ) {
                  m.x = targetX;
                  m.y = targetY;
                }

                // Spawn persistent molten slag pool
                window.cavernInteractives.push({
                  id: window.idCounter++,
                  type: "acid_pool",
                  isSlag: true,
                  color: "#f97316",
                  x: m.x + m.w / 2,
                  y: m.y + m.h / 2,
                  w: 24,
                  h: 12,
                  life: 300, // 5 seconds
                  maxLife: 300,
                });

                // Check contact collision damage
                if (
                  Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2)) <= 42
                ) {
                  window.damagePlayer(Math.round(m.atk * 1.35), m);
                }

                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    m.x + m.w / 2,
                    m.y + m.h / 2,
                    8,
                    "magma_elemental",
                    2.2,
                  );
                }
              });

              m.dashNodes = null;
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 12);
              }
              if (
                window.SoundManager &&
                typeof window.SoundManager.play === "function"
              ) {
                window.SoundManager.play("block");
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Normal Chase Logic
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.8 * (m.speedMultiplier || 1.0);
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger Attacks
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            // Randomly select between active phase abilities
            let choices = ["lasso", "barrage", "inversion"];
            if (m.phase === 2) {
              choices.push("gold_rush_dash");
            }

            let chosen = choices[Math.floor(Math.random() * choices.length)];

            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer =
              chosen === "barrage" ? 65 : chosen === "inversion" ? 80 : 55;
            m.maxTelegraphTimer = m.telegraphTimer;

            if (chosen === "gold_rush_dash") {
              let angle = Math.atan2(p.y - cy, p.x - cx);
              let distance = Math.hypot(p.x - cx, p.y - cy);

              let d1 = Math.min(distance * 0.35, 70);
              let d2 = Math.min(distance * 0.7, 140);

              let n1x = cx + Math.cos(angle - 0.6) * d1;
              let n1y = cy + Math.sin(angle - 0.6) * d1;
              let n2x = cx + Math.cos(angle + 0.6) * d2;
              let n2y = cy + Math.sin(angle + 0.6) * d2;
              let n3x = p.x;
              let n3y = p.y;

              m.dashNodes = [
                { x: n1x, y: n1y },
                { x: n2x, y: n2y },
                { x: n3x, y: n3y },
              ];
            }

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },

      updateArachnidTreant(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: ELDRITCH BARK SHIELD & SUMMONS (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && !m.phase2Triggered) {
          m.phase2Triggered = true;
          m.phase = 2;
          m.actionState = "bark_shield";
          m.isStopped = true;

          // Teleport Stage Warden directly to the center of the arena
          let map = activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: BARK SHIELD!",
              "#e74c3c",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(cx, cy, 35, "slag_slime", 4);
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");

          // Spawn 3 Sprout Cocoons surrounding the Warden
          for (let i = 0; i < 3; i++) {
            let angle = (i * Math.PI * 2) / 3;
            let spawnDist = 54;
            let sx = cx + Math.cos(angle) * spawnDist;
            let sy = cy + Math.sin(angle) * spawnDist;

            addActiveDungeonMob({
              id: window.idCounter++,
              type: "mob",
              visualTier: 0,
              visualType: "sprout_cocoon",
              x: sx - 12,
              y: sy - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(60 + m.stageLevel * 20),
              maxHp: BigNum.from(60 + m.stageLevel * 20),
              atk: 0,
              flashTimer: 0,
              attackCooldown: 100,
              isBossSummon: true,
              isCocoon: true,
              hatchTimer: 240, // 4 seconds (240 frames)
              discovered: true,
              hopTimer: window.randInt(0, 29), // Desynchronize summons' hopping phases
            });

            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(sx, sy, 10, "slag_slime", 2);
            }
          }

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Eldritch Bark Shield active! Slay the hatched minions to break it!",
              "#e74c3c",
            );
          }
        }

        // Processing active Bark Shield & Orbital Web Storm particle effects
        if (m.actionState === "bark_shield") {
          let sumCount = window.activeDungeonMobs
            ? window.activeDungeonMobs.filter(
                (mob) => mob.isBossSummon && mob.hp.gt(0),
              ).length
            : 0;

          if (sumCount === 0) {
            // Shield Shatters!
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 60;
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                30,
                "slag_slime",
                4.5,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[✦] Eldritch Bark Shield shattered! Boss is vulnerable!",
                "#2ecc71",
              );
            }
          } else {
            // Emit orbital Web Storm wind particles
            if (Math.random() < 0.4) {
              let angle = Math.random() * Math.PI * 2;
              let orbDist = m.w * 0.75;
              let px = cx + Math.cos(angle) * orbDist;
              let py = cy + Math.sin(angle) * orbDist;
              let rotSpeed = 3.5;
              let vx = -Math.sin(angle) * rotSpeed;
              let vy = Math.cos(angle) * rotSpeed;
              if (window.combatVisuals && window.combatVisuals.particlePool) {
                window.combatVisuals.particlePool.get(
                  px,
                  py,
                  vx,
                  vy,
                  window.randFloat(1.5, 3),
                  Math.random() < 0.5 ? "#ffffff" : "#27ae60",
                  0.8,
                  30,
                  30,
                  0,
                  true,
                );
              }
            }
            return; // Skip normal combat movement/attack AI while shielded
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Creeping vine particles traveling during root snare wind-up
          if (m.activeAbility === "root_snare" && m.telegraphTimer % 3 === 0) {
            let tRatio = 1.0 - m.telegraphTimer / m.maxTelegraphTimer;
            let vx = cx + (m.targetX - cx) * tRatio;
            let vy = cy + (m.targetY - cy) * tRatio;
            if (window.combatVisuals && window.combatVisuals.particlePool) {
              window.combatVisuals.particlePool.get(
                vx + window.randFloat(-4, 4),
                vy + window.randFloat(-4, 4),
                window.randFloat(-0.2, 0.2),
                window.randFloat(-0.2, 0.2),
                window.randFloat(1.5, 2.5),
                "#27ae60",
                0.8,
                24,
                24,
                0,
                true,
              );
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120; // 2s recovery

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "slag_slime",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "root_snare") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(5, 8);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  20,
                  "slag_slime",
                  2.2,
                );
              }

              // Spawn persistent spider web hazard on the ground
              window.cavernInteractives = window.cavernInteractives || [];
              window.cavernInteractives.push({
                id: window.idCounter++,
                type: "spider_web_zone",
                x: m.targetX,
                y: m.targetY,
                w: 56,
                h: 24,
                life: 300, // 5 seconds of persistence
                maxLife: 300,
              });

              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 75) {
                window.damagePlayer(Math.round(m.atk * 1.3), m);
                p.snareTimer = 132; // 2.2s snare slow
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "[SNARED] -60% Speed!",
                    "#2ecc71",
                    true,
                  );
                }
              }
              if (window.SoundManager) window.SoundManager.play("block");
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a slow, heavy treant pace
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.3;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "root_snare";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateAegisGoliath(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: RAISED TOWER SHIELD (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && m.phase === 1) {
          m.phase = 2;
          m.shieldAngle = Math.atan2(p.y - cy, p.x - cx);
          m.dazeTimer = 0;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TOWER SHIELD!",
              "#00d2ff",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(cx, cy, 30, "aegis_goliath", 4);
            window.combatVisuals.triggerScreenShake(8, 15);
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Aegis Goliath raised his Tower Shield! Flank his exposed sides!",
              "#00d2ff",
            );
          }
          if (window.SoundManager) window.SoundManager.play("revive");
        }

        // Handle Dazed stun sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          // Spawn little daze stars particles on head occasionally
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return; // Frozen and vulnerable while dazed
        }
        m.isStopped = false;

        // Lerp shield angle slowly toward the player to allow flanking outmaneuvers
        if (
          m.phase === 2 &&
          m.shieldAngle !== undefined &&
          m.activeAbility !== "shield_bash"
        ) {
          let targetAngle = Math.atan2(p.y - cy, p.x - cx);
          let angleDiff = targetAngle - m.shieldAngle;
          // Normalize to -PI to PI
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          // Rotate up to 0.038 radians per frame
          m.shieldAngle += Math.max(-0.038, Math.min(0.038, angleDiff));
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Apply active gravitational magnetic pull
          if (m.activeAbility === "magnetic_pull") {
            let pullForce = 2.2;
            let angle = Math.atan2(cy - p.y, cx - p.x);
            let testX = p.x + Math.cos(angle) * pullForce;
            let testY = p.y + Math.sin(angle) * pullForce;

            if (
              activeDungeonMap &&
              typeof window.checkCollisionAt === "function" &&
              !window.checkCollisionAt(
                activeDungeonMap,
                testX,
                testY,
                p.radius || 9,
              )
            ) {
              p.x = testX;
              p.y = testY;
            }

            // Spawn blue gravitational sparks flowing inward (Subphase C.3)
            if (
              m.telegraphTimer % 4 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pt = window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-10, 10),
                p.y + window.randFloat(-10, 10),
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                window.randFloat(1.2, 2.5),
                "#00d2ff",
                0.8,
                20,
                20,
                0,
                true,
              );
              pt.style = "streak";
              pt.scaleDecay = 0.035;
              window.particles.push(pt);
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "magnetic_pull") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "aegis_goliath",
                  4.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("block");

              // Ground slam damage check
              if (Math.hypot(p.x - cx, p.y - cy) <= 70) {
                window.damagePlayer(Math.round(m.atk * 1.6), m);
              }
            } else if (ability === "boomerang_shield") {
              // Spawn dual curving boomerang projectiles
              let angleToPlayer = Math.atan2(p.y - cy, p.x - cx);
              let speed = 4.5;

              let angles = [angleToPlayer - 0.25, angleToPlayer + 0.25];
              angles.forEach((ang) => {
                window.projectiles.push({
                  x: cx,
                  y: cy,
                  vx: Math.cos(ang) * speed,
                  vy: Math.sin(ang) * speed,
                  r: 8,
                  type: "boomerang",
                  damage: Math.round(m.atk * 0.9),
                  life: 180,
                  pulseOffset: Math.random() * 10,
                });
              });

              if (window.SoundManager) window.SoundManager.play("swing");
            } else if (ability === "shield_bash") {
              // Executing frontal shield bash
              let pAngle = Math.atan2(p.y - cy, p.x - cx);
              let angleDiff = Math.abs(
                Math.atan2(
                  Math.sin(pAngle - m.shieldAngle),
                  Math.cos(pAngle - m.shieldAngle),
                ),
              );

              if (Math.hypot(p.x - cx, p.y - cy) <= 64 && angleDiff <= 0.5) {
                // Player hit!
                window.damagePlayer(Math.round(m.atk * 1.7), m);
                // Apply knockback
                p.knockbackVx = Math.cos(m.shieldAngle) * 10;
                p.knockbackVy = Math.sin(m.shieldAngle) * 10;
                if (window.combatVisuals) {
                  window.combatVisuals.triggerScreenShake(6, 10);
                  window.combatVisuals.spawnParticles(
                    p.x,
                    p.y,
                    12,
                    "aegis_goliath",
                    3,
                  );
                }
                if (window.SoundManager) window.SoundManager.play("block");
              } else {
                // Player evaded! Overcommit and enter DAZED state
                m.dazeTimer = 210; // 3.5 seconds
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(cx, m.y - 12, "DAZED!", "#ffd700");
                }
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    cx,
                    m.y - 4,
                    15,
                    "gold_dungeon",
                    2.2,
                  );
                  window.combatVisuals.triggerScreenShake(4, 6);
                }
                if (window.SoundManager) window.SoundManager.play("block");
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a steady vanguard speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = m.phase === 2 ? 1.4 : 1.7; // Slightly heavier and slower while shield raised
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let optionsPool = ["magnetic_pull", "boomerang_shield"];
            if (m.phase === 2) optionsPool.push("shield_bash");

            let chosen =
              optionsPool[Math.floor(Math.random() * optionsPool.length)];
            // Bias heavily towards shield_bash when close and in Phase 2
            if (dist < 64 && m.phase === 2 && Math.random() < 0.8) {
              chosen = "shield_bash";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;

            if (chosen === "magnetic_pull") m.telegraphTimer = 90;
            else if (chosen === "boomerang_shield") m.telegraphTimer = 60;
            else m.telegraphTimer = 75; // shield_bash windup
            m.maxTelegraphTimer = m.telegraphTimer;

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateOverlordIronVault(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120; // 2s recovery

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "magma_elemental",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "magma_vents" && m.ventSpawnLocations) {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              // Spawn 2 growing Magma Vents around the player
              m.ventSpawnLocations.forEach((loc) => {
                addActiveDungeonMob({
                  id: window.idCounter++,
                  type: "mob",
                  visualTier: 2,
                  visualType: "magma_vent",
                  x: loc.x - 12,
                  y: loc.y - 12,
                  w: 24,
                  h: 24,
                  hp: BigNum.from(1),
                  maxHp: BigNum.from(1),
                  parentAtk: m.atk,
                  flashTimer: 0,
                  isMagmaVent: true,
                  ventTimer: 270, // 4.5 seconds
                  discovered: true,
                });

                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    loc.x,
                    loc.y,
                    8,
                    "magma_elemental",
                    1.8,
                  );
                }
              });
              m.ventSpawnLocations = null;
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at a slow, heavy colossus speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.35;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "magma_vents";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;

            if (chosen === "magma_vents") {
              // Pre-calculate target spots around the player's current location
              m.ventSpawnLocations = [];
              for (let i = 0; i < 2; i++) {
                let angle = Math.random() * Math.PI * 2;
                let spawnDist = window.randFloat(40, 80);
                m.ventSpawnLocations.push({
                  x: p.x + Math.cos(angle) * spawnDist,
                  y: p.y + Math.sin(angle) * spawnDist,
                });
              }
            }

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateCorrosiveAbomination(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // Leave trailing Acid Pools while moving across both phases
        if (m.isMoving && window.logicClock % 40 === 0) {
          window.cavernInteractives = window.cavernInteractives || [];
          window.cavernInteractives.push({
            id: window.idCounter++,
            type: "acid_pool",
            x: cx,
            y: cy,
            w: 24,
            h: 12,
            life: 480, // 8 seconds (480 frames)
            maxLife: 480,
          });
        }

        // --- PHASE 2 TRIGGER: TOXIC SPORE NOVA (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && !m.phase2Triggered) {
          m.phase2Triggered = true;
          m.phase = 2;
          m.attackCooldown = 40;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TOXIC SPORE STORM!",
              "#2ecc71",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "swamp_basilisk",
              4,
            );
            window.combatVisuals.triggerScreenShake(8, 15);
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Corrosive Abomination has entered Phase 2! Watch out for toxic spore storms!",
              "#2ecc71",
            );
          }
          if (window.SoundManager) window.SoundManager.play("revive");
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "swamp_basilisk",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "spore_storm") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "swamp_basilisk",
                  3.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              // Spawn 3 homing toxic spores with a strict 6-second lifetime
              for (let i = 0; i < 3; i++) {
                let angle = (i * Math.PI * 2) / 3;
                let spawnDist = 45;
                let sx = cx + Math.cos(angle) * spawnDist;
                let sy = cy + Math.sin(angle) * spawnDist;

                addActiveDungeonMob({
                  id: window.idCounter++,
                  type: "mob",
                  visualTier: 3,
                  visualType: "toxic_spore",
                  x: sx - 12,
                  y: sy - 12,
                  w: 24,
                  h: 24,
                  hp: BigNum.from(1),
                  maxHp: BigNum.from(1),
                  atk: Math.round(m.atk * 0.95),
                  flashTimer: 0,
                  isSpore: true,
                  isBossSummon: true,
                  hatchTimer: 360, // 6s lifetime (360 frames)
                  discovered: true,
                });
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.6;
              m.isMoving = window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            } else {
              m.isMoving = false;
            }
          } else {
            m.isMoving = false;
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let optionsPool = ["slam"];
            if (m.phase === 2) optionsPool.push("spore_storm");

            let chosen =
              optionsPool[Math.floor(Math.random() * optionsPool.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "spore_storm" ? 85 : 65;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateVoidOverseer(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;

          // Apply active inverse-square gravitational singularity pull
          if (m.activeAbility === "singularity") {
            let tDx = cx - p.x;
            let tDy = cy - p.y;
            let tDist = Math.hypot(tDx, tDy);

            if (tDist > 10) {
              // Gravity forces increase rapidly the closer you get (inverse square)
              let pull = 4500 / (tDist * tDist + 400);
              pull = Math.min(4.8, pull); // Cap maximum drag speed

              let testX = p.x + (tDx / tDist) * pull;
              let testY = p.y + (tDy / tDist) * pull;

              if (
                activeDungeonMap &&
                typeof window.checkCollisionAt === "function" &&
                !window.checkCollisionAt(
                  activeDungeonMap,
                  testX,
                  testY,
                  p.radius || 9,
                )
              ) {
                p.x = testX;
                p.y = testY;
              }
            }

            // Spawn space dust vacuum particles flowing inward (Subphase C.3)
            if (
              m.telegraphTimer % 3 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pAngle = Math.random() * Math.PI * 2;
              let pDist = window.randFloat(40, 150);
              let px = cx + Math.cos(pAngle) * pDist;
              let py = cy + Math.sin(pAngle) * pDist;
              let vx = -Math.cos(pAngle) * (pDist / 15);
              let vy = -Math.sin(pAngle) * (pDist / 15);

              let pt = window.combatVisuals.particlePool.get(
                px,
                py,
                vx,
                vy,
                window.randFloat(1.5, 3.5),
                Math.random() < 0.5 ? "#e84393" : "#8e44ad",
                0.8,
                15,
                15,
                -0.05,
                true,
              );
              pt.style = "streak"; // Transform accretion dust into high-velocity inward streaks
              pt.scaleDecay = 0.04;
              window.particles.push(pt);
            }
          }

          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "void_orb",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "singularity") {
              // Accretion Core Collapse & Implosion!
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(12, 20);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  35,
                  "void_orb",
                  5.5,
                );
                window.combatVisuals.spawnBeam(cx, "#e84393", 45, false);
              }
              if (window.SoundManager) window.SoundManager.play("death");

              // Hit detection within the 90px Event Horizon radius
              if (Math.hypot(p.x - cx, p.y - cy) <= 90) {
                window.damagePlayer(Math.round(m.atk * 1.95), m);
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 15,
                    "EVENT HORIZON IMPLOSION!",
                    "#e84393",
                  );
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.6;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "singularity";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "singularity" ? 360 : 65; // 6s channel for singularity
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateChronosArbitrator(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: CHRONOS REWIND CHANNEL (UNDER 40% HP) ---
        if (isBelowHealthFraction(m, 0.4) && m.phase === 1) {
          m.phase = 2;
          m.actionState = "chrono_rewind";
          m.isStopped = true;
          m.channelTimer = 240; // 4 seconds
          m.staggerShield = m.maxHp.mul(0.15); // 15% Max HP stagger barrier

          // Teleport directly to the center of the arena
          let map = activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: CHRONOS REWIND!",
              "#ffd700",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "gold_dungeon",
              4.5,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Chronos Arbitrator is channeling Chronos Rewind! Shatter his Stagger Shield to interrupt!",
              "#ffd700",
            );
          }
        }

        // Processing active Chronos Rewind channel
        if (m.actionState === "chrono_rewind") {
          m.channelTimer--;
          if (m.channelTimer <= 0) {
            // Channel completes! strike XII and heal 20%
            let healAmt = m.maxHp.mul(0.2);
            m.hp = window.BigNumMin(m.maxHp, m.hp.add(healAmt));

            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(
                cx,
                m.y - 12,
                `+${window.formatNumber(healAmt)} HP (REWIND)`,
                "#2ecc71",
              );
            }
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] Clock struck XII! Chronos Arbitrator rewound time and healed himself!",
                "#e74c3c",
              );
            }
            if (window.SoundManager) window.SoundManager.play("spell");
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                20,
                "gold_dungeon",
                3.0,
              );
            }

            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 110;
          }
          return; // Skip normal movements during channel
        }

        // Handle Dazed stun sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return;
        }
        m.isStopped = false;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "dilation_field") {
              // Spawn a static Time Dilation Field hazard on the ground
              window.cavernInteractives = window.cavernInteractives || [];
              window.cavernInteractives.push({
                id: window.idCounter++,
                type: "dilation_field",
                x: m.targetX,
                y: m.targetY,
                w: 40,
                h: 18,
                life: 420, // 7 seconds (420 frames)
                maxLife: 420,
              });

              if (window.combatVisuals) {
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  2.0,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell");
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player at normal speed
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.7;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "dilation_field";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "dilation_field" ? 60 : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateNexusOverseer(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: DIGITAL DECOYS SPLIT (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && m.phase === 1) {
          m.phase = 2;
          m.actionState = "cyber_barrier";
          m.isStopped = true;

          // Teleport directly to the center of the arena
          let map = activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: CYBER BARRIER!",
              "#ff007f",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "nexus_overseer",
              4.0,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");

          // Spawn 2 Holographic Decoys
          let decoyOffsets = [-48, 48];
          decoyOffsets.forEach((ox) => {
            addActiveDungeonMob({
              id: window.idCounter++,
              type: "mob",
              visualTier: 6,
              visualType: "nexus_overseer",
              x: cx + ox - 12,
              y: cy + 18 - 12,
              w: 24,
              h: 24,
              hp: BigNum.from(120 + m.stageLevel * 25),
              maxHp: BigNum.from(120 + m.stageLevel * 25),
              atk: Math.round(m.atk * 0.8),
              flashTimer: 0,
              attackCooldown: 80,
              isRanged: true,
              projectileType: "void",
              isBossSummon: true,
              isDecoy: true,
              discovered: true,
              hopTimer: window.randInt(0, 29), // Desynchronize decoy hopping phases
            });

            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx + ox,
                cy + 18,
                10,
                "nexus_overseer",
                2,
              );
            }
          });

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Cyber Barrier active! Slay the 2 Holographic Decoys to break it!",
              "#ff007f",
            );
          }
        }

        // Processing active Cyber Barrier
        if (m.actionState === "cyber_barrier") {
          let decoyCount = window.activeDungeonMobs
            ? window.activeDungeonMobs.filter(
                (mob) => mob.isDecoy && mob.hp.gt(0),
              ).length
            : 0;

          if (decoyCount === 0) {
            // Barrier Shatters!
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 60;
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(
                cx,
                cy,
                30,
                "nexus_overseer",
                4.5,
              );
              window.combatVisuals.triggerScreenShake(8, 12);
            }
            if (window.SoundManager) window.SoundManager.play("block");
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[✦] Cyber Barrier shattered! Nexus Overseer is vulnerable!",
                "#00b894",
              );
            }
          } else {
            // Emit digital matrix ambient glitch noise
            if (
              Math.random() < 0.3 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let pAngle = Math.random() * Math.PI * 2;
              let orbDist = m.w * 0.75;
              let px = cx + Math.cos(pAngle) * orbDist;
              let py = cy + Math.sin(pAngle) * orbDist;
              window.combatVisuals.particlePool.get(
                px,
                py,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 0.8,
                window.randFloat(1.2, 2.5),
                "#ff007f",
                0.8,
                20,
                0,
                true,
                0,
              );
            }
            return; // Protected while decoys are active
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "nexus_overseer",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "control_glitch") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(5, 8);
                window.combatVisuals.spawnParticles(
                  cx,
                  cy,
                  25,
                  "nexus_overseer",
                  3.5,
                );
              }
              if (window.SoundManager) window.SoundManager.play("spell");

              // Scramble player joystick if caught within 180px
              if (dist <= 180) {
                p.glitchTimer = 180; // 3.0 seconds (180 frames)
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "[GLITCHED] Inverted Controls!",
                    "#ff007f",
                    true,
                  );
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.7;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "control_glitch";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = chosen === "control_glitch" ? 60 : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateGildedVaultKeeper(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: TAXATION SIPHON (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && m.phase === 1) {
          m.phase = 2;
          m.actionState = "taxation";
          m.isStopped = true;
          m.channelTimer = 240; // 4 seconds (240 frames)
          m.staggerShield = m.maxHp.mul(0.15); // 15% Max HP stagger barrier
          m.maxStaggerShield = m.maxHp.mul(0.15);

          // Teleport directly to the center of the arena
          let map = activeDungeonMap;
          let mapW = map ? map.width : 24;
          let mapH = map ? map.height : 18;
          let tSize = map ? map.tileSize : 32;
          m.x = Math.floor(mapW / 2) * tSize - m.w / 2;
          m.y = Math.floor(mapH / 2) * tSize - m.h / 2;
          cx = m.x + m.w / 2;
          cy = m.y + m.h / 2;

          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: TAXATION SIPHON!",
              "#ffd700",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              35,
              "gold_dungeon",
              4.5,
            );
            window.combatVisuals.triggerScreenShake(10, 18);
          }
          if (window.SoundManager) window.SoundManager.play("spell");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Gilded Vault Keeper is channeling Taxation! Shatter his shield to protect your Gold!",
              "#ffd700",
            );
          }
        }

        // Processing active Gold Siphon channel
        if (m.actionState === "taxation") {
          m.channelTimer--;

          // Siphon 10 Gold per frame from the player's wallet to heal himself (5x healing ratio)
          let playerGold = BigNum.from(window.playerStats.coins || 0);
          if (playerGold.gt(0)) {
            let siphonAmt = BigNum.from(10);
            if (playerGold.lt(siphonAmt)) {
              siphonAmt = playerGold;
            }
            window.playerStats.coins = playerGold.sub(siphonAmt);

            let healVal = siphonAmt.mul(5);
            m.hp = window.BigNumMin(m.maxHp, m.hp.add(healVal));

            // Visual golden siphon lines
            if (
              m.channelTimer % 3 === 0 &&
              window.combatVisuals &&
              window.combatVisuals.particlePool
            ) {
              let angle = Math.atan2(cy - p.y, cx - p.x);
              window.combatVisuals.particlePool.get(
                p.x + window.randFloat(-6, 6),
                p.y - 4 + window.randFloat(-6, 6),
                Math.cos(angle) * 4.5,
                Math.sin(angle) * 4.5,
                window.randFloat(1.2, 2.8),
                "#ffd700",
                0.8,
                15,
                15,
                0,
                true,
              );
            }
          }

          if (m.channelTimer <= 0) {
            // Siphon completes
            m.actionState = "idle";
            m.state = "idle";
            m.isStopped = false;
            m.attackCooldown = 110;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(
                "[!] Taxation cycle completed. Vault Keeper has recovered health!",
                "#e74c3c",
              );
            }
          }
          return;
        }

        // Handle Stunned sequence
        if (m.dazeTimer > 0) {
          m.dazeTimer--;
          m.isStopped = true;
          if (m.dazeTimer % 15 === 0 && window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              cx,
              m.y - 4,
              3,
              "gold_dungeon",
              1.2,
            );
          }
          return;
        }
        m.isStopped = false;

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 120;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "gold_dungeon",
                  3.2,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "gold_fall" && m.goldFallTargets) {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(6, 10);
              }
              if (window.SoundManager) window.SoundManager.play("block");

              m.goldFallTargets.forEach((target) => {
                if (window.combatVisuals) {
                  window.combatVisuals.spawnParticles(
                    target.x,
                    target.y,
                    10,
                    "gold_dungeon",
                    2.2,
                  );
                }
                if (Math.hypot(p.x - target.x, p.y - target.y) <= 24) {
                  window.damagePlayer(Math.round(m.atk * 1.25), m);
                }
              });
              m.goldFallTargets = null;
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = 1.45;
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let chosen = Math.random() < 0.5 ? "slam" : "gold_fall";
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer = 75;
            m.maxTelegraphTimer = 75;

            if (chosen === "gold_fall") {
              m.goldFallTargets = [];
              for (let i = 0; i < 3; i++) {
                let angle = Math.random() * Math.PI * 2;
                let spawnDist = window.randFloat(30, 75);
                m.goldFallTargets.push({
                  x: p.x + Math.cos(angle) * spawnDist,
                  y: p.y + Math.sin(angle) * spawnDist,
                });
              }
            }

            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },
      updateHooktail(
        m,
        p,
        pStats,
        dist,
        dx,
        dy,
        activeDungeonMap = getActiveDungeonMap(),
      ) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // --- PHASE 2 TRIGGER: CRITICAL ARENA COLLAPSE (UNDER 50% HP) ---
        if (isBelowHealthFraction(m, 0.5) && m.phase === 1) {
          m.phase = 2;
          m.attackCooldown = 30;
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              cx,
              m.y - 20,
              "PHASE 2: ARENA COLLAPSE!",
              "#ff3300",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.triggerScreenShake(15, 30);
            window.combatVisuals.spawnParticles(
              cx,
              cy,
              40,
              "prestige_boss",
              6.0,
            );
          }
          if (window.SoundManager) window.SoundManager.play("death");
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[!] Hooktail has unleashed Calamity! The ground is collapsing into the void!",
              "#ff3300",
            );
          }
        }

        // Periodic Abyssal damage ticks if the player steps over collapsed void tiles
        let map = activeDungeonMap;
        if (map && map.grid) {
          let pTileX = Math.floor(p.x / map.tileSize);
          let pTileY = Math.floor(p.y / map.tileSize);
          if (
            map.grid[pTileY] &&
            map.grid[pTileY][pTileX] === window.TILE_TYPES.VOID
          ) {
            if (window.logicClock % 40 === 0) {
              let fallDmg = Math.round(p.maxHp * 0.08); // 8% Max HP per tick in the void
              p.hp = Math.max(1, p.hp - fallDmg);
              window.spawnFloatingText(
                p.x,
                p.y - 15,
                `-${fallDmg} ABYSS DROWNING`,
                "#ff3300",
              );
              if (window.SoundManager) window.SoundManager.play("hit");
            }
          }
        }

        if (m.actionState === "telegraphing" || m.state === "telegraphing") {
          m.telegraphTimer--;
          if (m.telegraphTimer <= 0) {
            m.state = "idle";
            m.actionState = "idle";
            m.attackCooldown = 110;

            let ability = m.activeAbility;
            if (ability === "slam") {
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(7, 12);
                window.combatVisuals.spawnParticles(
                  m.targetX,
                  m.targetY,
                  15,
                  "prestige_boss",
                  3.5,
                );
              }
              if (Math.hypot(p.x - m.targetX, p.y - m.targetY) <= 64) {
                window.damagePlayer(Math.round(m.atk * 1.8), m);
              }
              if (window.SoundManager) window.SoundManager.play("block");
            } else if (ability === "scarlet_fire") {
              // Detonate Scarlet Fire Arc breath
              if (window.combatVisuals) {
                window.combatVisuals.triggerScreenShake(8, 14);
                // Spew fire particles
                let fAngle = m.facing === -1 ? Math.PI : 0;
                for (let k = 0; k < 20; k++) {
                  let dev = window.randFloat(-0.7, 0.7);
                  let spAngle = fAngle + dev;
                  let speed = window.randFloat(3.0, 6.0);
                  window.combatVisuals.particlePool.get(
                    cx,
                    cy,
                    Math.cos(spAngle) * speed,
                    Math.sin(spAngle) * speed,
                    window.randFloat(1.5, 3.8),
                    "#ff3300",
                    0.85,
                    25,
                    25,
                    -0.03,
                    true,
                    0.05,
                  );
                }
              }
              if (window.SoundManager) window.SoundManager.play("spell_fire");

              let pAngle = Math.atan2(p.y - cy, p.x - cx);
              let faceAngle = m.facing === -1 ? Math.PI : 0;
              let angleDiff = Math.abs(
                Math.atan2(
                  Math.sin(pAngle - faceAngle),
                  Math.cos(pAngle - faceAngle),
                ),
              );

              if (dist <= 110 && angleDiff <= 0.8) {
                window.damagePlayer(Math.round(m.atk * 1.55), m);
                if (typeof window.spawnFloatingText === "function") {
                  window.spawnFloatingText(
                    p.x,
                    p.y - 12,
                    "SCARLET INCINERATION!",
                    "#ff3300",
                  );
                }
              }
            } else if (ability === "calamity_slam") {
              // Collapse one outer ring of the active floor into the void
              if (map && map.grid) {
                let collapseRing = m.collapseRing || 0;
                let minR = 2 + collapseRing;
                let maxR = map.height - 3 - collapseRing;
                let minC = 2 + collapseRing;
                let maxC = map.width - 3 - collapseRing;

                if (minR < maxR && minC < maxC) {
                  for (let cCol = minC; cCol <= maxC; cCol++) {
                    map.grid[minR][cCol] = window.TILE_TYPES.VOID;
                    map.grid[maxR][cCol] = window.TILE_TYPES.VOID;
                  }
                  for (let rRow = minR; rRow <= maxR; rRow++) {
                    map.grid[rRow][minC] = window.TILE_TYPES.VOID;
                    map.grid[rRow][maxC] = window.TILE_TYPES.VOID;
                  }
                  m.collapseRing = collapseRing + 1;
                  map.needsPreRender = true; // FORCE STATIC MAP REDRAW

                  if (window.combatVisuals) {
                    window.combatVisuals.triggerScreenShake(12, 22);
                    window.combatVisuals.spawnParticles(
                      cx,
                      cy,
                      35,
                      "prestige_boss",
                      4.5,
                    );
                  }
                  if (window.SoundManager) window.SoundManager.play("death");
                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast(
                      "[!] THE ARENA HAS COLLAPSED! PLAY AREA SHRINKING!",
                      "#ff3300",
                    );
                  }
                }
              }
            }
            m.activeAbility = null;
          }
        } else {
          // Chase player
          if (dist < 220 && dist > 14) {
            m.hopTimer = (m.hopTimer || 0) + 1;
            if (m.hopTimer % 30 < 15) {
              let speed = m.phase === 2 ? 1.8 : 1.5; // Dragon charges faster in Phase 2
              window.moveEntityWithSmartSteering(
                m,
                p.x,
                p.y,
                speed,
                activeDungeonMap,
                m.w ? m.w * 0.4 : 14,
              );
            }
          }

          // Trigger basic close-range quick strike first
          if (dist < 32 && m.attackCooldown <= 0) {
            m.attackCooldown = 50;
            window.damagePlayer(m.atk, m);
          } else if (m.attackCooldown <= 0 && dist < 220) {
            let pool = ["slam", "scarlet_fire"];
            if (m.phase === 2) pool.push("calamity_slam");

            let chosen = pool[Math.floor(Math.random() * pool.length)];
            // Bias heavily towards slam when close
            if (dist < 64 && Math.random() < 0.8) {
              chosen = "slam";
            }
            m.state = "telegraphing";
            m.actionState = "telegraphing";
            m.activeAbility = chosen;
            m.telegraphTimer =
              chosen === "calamity_slam"
                ? 85
                : chosen === "scarlet_fire"
                  ? 60
                  : 75;
            m.maxTelegraphTimer = m.telegraphTimer;
            m.targetX = p.x;
            m.targetY = p.y;
          }
        }
      },

      renderTelegraph(c, m) {
        if (!m) return;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        // Draw active flying golden braided lasso rope if currently pulling
        if (m.lassoVisualTimer > 0 && m.lassoVisualX !== undefined) {
          c.save();
          c.strokeStyle = "#ffd700";
          c.lineWidth = 3.0;
          c.shadowBlur = 6;
          c.shadowColor = "#f1c40f";

          // Generate a wave-like braided rope effect
          c.beginPath();
          c.moveTo(cx, cy);
          let ldx = m.lassoVisualX - cx;
          let ldy = m.lassoVisualY - cy;
          let segments = 8;
          for (let s = 1; s <= segments; s++) {
            let t = s / segments;
            let lx =
              cx + ldx * t + Math.sin(t * Math.PI + Date.now() / 30) * 4.5;
            let ly =
              cy + ldy * t + Math.cos(t * Math.PI + Date.now() / 30) * 4.5;
            c.lineTo(lx, ly);
          }
          c.stroke();
          c.shadowBlur = 0;
          c.restore();
        }

        if (!m.activeAbility) return;
        c.save();

        // Clamp progress to prevent negative values if telegraphTimer is temporarily larger than maxTelegraphTimer
        let progress = Math.max(
          0,
          Math.min(1, 1.0 - m.telegraphTimer / m.maxTelegraphTimer),
        );
        let pulseAlpha = 0.25 + Math.sin(Date.now() / 45) * 0.15;

        if (m.activeAbility === "slam") {
          let radius = 64;
          let isTreant =
            m.bossKey === "arachnid_treant" ||
            m.visualType === "sprout" ||
            m.visualType === "arachnid_treant";
          let isIronVault =
            m.bossKey === "overlord_iron_vault" ||
            m.visualType === "overlord_iron_vault";
          let isCorrosive =
            m.bossKey === "corrosive_abomination" ||
            m.visualType === "corrosive_abomination";

          if (isTreant) {
            // --- BOSS 1: BIO-LUMINESCENT ROOT SLAM GRID ---
            let time = Date.now();

            // 1. Bio-luminescent Root Boundary Ring
            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#2ecc71";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(163, 253, 131, 0.6)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Inner Radial Bio-Spore Filling Disc
            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            fillGrad.addColorStop(
              0.5,
              `rgba(46, 204, 113, ${pulseAlpha * 0.4})`,
            );
            fillGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Bio-Luminescent Root Vine Grid (8 Radial Root Tendrils with Jagged Branches)
            c.strokeStyle = `rgba(0, 255, 204, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.8;
            c.beginPath();
            let radRays = 8;
            for (let i = 0; i < radRays; i++) {
              let rayAngle = (i * Math.PI * 2) / radRays + (m.id || 0);
              let endDist = radius * progress;
              let steps = 5;
              let lastX = m.targetX;
              let lastY = m.targetY;

              for (let s = 1; s <= steps; s++) {
                let curDist = (endDist * s) / steps;
                let jitter = Math.sin(s * 2.3 + time / 200) * 4;
                let curAngle = rayAngle + jitter * 0.05;
                let nx = m.targetX + Math.cos(curAngle) * curDist;
                let ny = m.targetY + Math.sin(curAngle) * curDist;

                c.moveTo(lastX, lastY);
                c.lineTo(nx, ny);

                // Lateral root tendril split
                if (s === 3) {
                  let branchAngle = curAngle + (i % 2 === 0 ? 0.4 : -0.4);
                  let bx = nx + Math.cos(branchAngle) * 12 * progress;
                  let by = ny + Math.sin(branchAngle) * 12 * progress;
                  c.moveTo(nx, ny);
                  c.lineTo(bx, by);
                }

                lastX = nx;
                lastY = ny;
              }
            }
            c.stroke();

            // 4. Bio-luminescent Spore Nodes at Intersection Joints
            c.fillStyle = "#a3fd83";
            for (let i = 0; i < radRays; i++) {
              let rayAngle = (i * Math.PI * 2) / radRays + (m.id || 0);
              let nodeDist = radius * progress * 0.6;
              let nx = m.targetX + Math.cos(rayAngle) * nodeDist;
              let ny = m.targetY + Math.sin(rayAngle) * nodeDist;
              c.beginPath();
              c.arc(nx, ny, 2.2, 0, Math.PI * 2);
              c.fill();
            }
          } else if (isIronVault) {
            // --- BOSS 3: MOLTEN STEEL SLAM & FISSURE GRID ---
            let time = Date.now();

            // 1. Molten Iron Outer Boundary
            c.strokeStyle = `rgba(249, 115, 22, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#f97316";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(254, 240, 138, 0.7)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Glowing Lava Core Disc
            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(
              0,
              `rgba(254, 240, 138, ${pulseAlpha * 0.75})`,
            );
            fillGrad.addColorStop(
              0.5,
              `rgba(249, 115, 22, ${pulseAlpha * 0.45})`,
            );
            fillGrad.addColorStop(1, "rgba(234, 88, 12, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Crosshair Lava Fissures (4 Cardinal Fractures)
            c.strokeStyle = `rgba(253, 186, 116, ${0.5 + progress * 0.5})`;
            c.lineWidth = 2.0;
            c.beginPath();
            for (let i = 0; i < 4; i++) {
              let ang = (i * Math.PI) / 2;
              let endDist = radius * progress;
              c.moveTo(m.targetX, m.targetY);
              c.lineTo(
                m.targetX + Math.cos(ang) * endDist,
                m.targetY + Math.sin(ang) * endDist,
              );
            }
            c.stroke();

            // 4. Heat Motes / Ember Sparks
            c.fillStyle = "#fef08a";
            for (let i = 0; i < 4; i++) {
              let ang = (i * Math.PI) / 2 + time / 1000;
              let sparkDist = radius * progress * 0.7;
              let sx = m.targetX + Math.cos(ang) * sparkDist;
              let sy = m.targetY + Math.sin(ang) * sparkDist;
              c.beginPath();
              c.arc(sx, sy, 1.8, 0, Math.PI * 2);
              c.fill();
            }
          } else if (isCorrosive) {
            // --- BOSS 4: CAUSTIC SLUDGE SLAM ---
            let time = Date.now();

            // 1. Toxic Bio-Green Outer Ring
            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 12;
            c.shadowColor = "#2ecc71";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(163, 253, 131, 0.7)";
            c.lineWidth = 1.2;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
            c.stroke();

            // 2. Bubbling Acid Pool Gradient Fill
            let acidGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            acidGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            acidGrad.addColorStop(
              0.5,
              `rgba(46, 204, 113, ${pulseAlpha * 0.4})`,
            );
            acidGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = acidGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Toxic Splatter Lines
            c.strokeStyle = `rgba(163, 253, 131, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.5;
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              let ang = (i * Math.PI * 2) / 6 + time / 1200;
              let endDist = radius * progress;
              c.moveTo(m.targetX, m.targetY);
              c.lineTo(
                m.targetX + Math.cos(ang) * endDist,
                m.targetY + Math.sin(ang) * endDist,
              );
            }
            c.stroke();
          } else {
            // --- STANDARD SLAM INDICATOR ---
            c.strokeStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
            c.lineWidth = 3.0;
            c.shadowBlur = 10;
            c.shadowColor = "#e74c3c";
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(255, 255, 255, 0.4)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius + 4, 0, Math.PI * 2);
            c.stroke();

            let fillGrad = c.createRadialGradient(
              m.targetX,
              m.targetY,
              1,
              m.targetX,
              m.targetY,
              radius,
            );
            fillGrad.addColorStop(0, `rgba(255, 242, 0, ${pulseAlpha * 0.6})`);
            fillGrad.addColorStop(
              0.6,
              `rgba(231, 76, 60, ${pulseAlpha * 0.4})`,
            );
            fillGrad.addColorStop(1, "rgba(231, 76, 60, 0)");

            c.fillStyle = fillGrad;
            c.beginPath();
            c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = `rgba(231, 76, 60, ${0.15 + progress * 0.45})`;
            c.lineWidth = 1.2;
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              let angle = (i * Math.PI * 2) / 6 + (m.id || 0);
              let startRad = radius * 0.15;
              let endRad = radius * progress;
              let sx = m.targetX + Math.cos(angle) * startRad;
              let sy = m.targetY + Math.sin(angle) * startRad;
              c.moveTo(sx, sy);

              let steps = 4;
              for (let s = 1; s <= steps; s++) {
                let segRad = startRad + (endRad - startRad) * (s / steps);
                let jitterAngle = angle + Math.sin(s * 1.5) * 0.15;
                let jx = m.targetX + Math.cos(jitterAngle) * segRad;
                let jy = m.targetY + Math.sin(jitterAngle) * segRad;
                c.lineTo(jx, jy);
              }
            }
            c.stroke();
          }
        } else if (m.activeAbility === "charge") {
          // --- HIGH FIDELITY CHARGE INDICATOR ---
          let dx = m.targetX - cx;
          let dy = m.targetY - cy;
          let dist = Math.hypot(dx, dy);
          if (dist > 0) {
            let nx = dx / dist;
            let ny = dy / dist;
            let trackW = 18;

            // Translucent hazard stripe path backing
            c.fillStyle = `rgba(231, 76, 60, 0.12)`;
            c.save();
            c.translate(cx, cy);
            c.rotate(Math.atan2(dy, dx));
            c.fillRect(0, -trackW / 2, dist, trackW);

            // Glowing border rails
            c.strokeStyle = `rgba(231, 76, 60, ${0.4 + pulseAlpha})`;
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(0, -trackW / 2);
            c.lineTo(dist, -trackW / 2);
            c.moveTo(0, trackW / 2);
            c.lineTo(dist, trackW / 2);
            c.stroke();

            // Sliding Chevron speed indicators
            let speed = 6;
            let slideOffset = (Date.now() / 15) % 60;
            c.strokeStyle = "#ffffff";
            c.lineWidth = 2.2;
            c.lineCap = "round";
            c.lineJoin = "round";

            for (let d = slideOffset; d < dist; d += 60) {
              c.beginPath();
              c.moveTo(d - 6, -5);
              c.lineTo(d, 0);
              c.lineTo(d - 6, 5);
              c.stroke();
            }
            c.restore();
          }
        } else if (m.activeAbility === "nova") {
          // --- HIGH FIDELITY NOVA INDICATOR ---
          c.strokeStyle = `rgba(230, 126, 34, ${0.35 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.5;

          // Accretion rings expansion effect
          c.save();
          c.strokeStyle = `rgba(230, 126, 34, ${pulseAlpha})`;
          c.shadowBlur = 8;
          c.shadowColor = "#e67e22";
          c.beginPath();
          c.arc(cx, cy, 120 * progress, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Detailed warning rays radiating outwards
          for (let i = 0; i < 8; i++) {
            let angle = (i * Math.PI * 2) / 8;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);

            // Multi-layered glowing laser guidelines
            let rayGrad = c.createLinearGradient(
              cx,
              cy,
              cx + cos * 120,
              cy + sin * 120,
            );
            rayGrad.addColorStop(0, "rgba(255, 242, 0, 0.85)");
            rayGrad.addColorStop(0.5, "rgba(230, 126, 34, 0.4)");
            rayGrad.addColorStop(1, "rgba(230, 126, 34, 0)");

            c.strokeStyle = rayGrad;
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(cx + cos * 14, cy + sin * 14);
            c.lineTo(cx + cos * 120, cy + sin * 120);
            c.stroke();
          }
        } else if (m.activeAbility === "root_snare") {
          // --- BOSS 1: BIO-LUMINESCENT CREEPING SNARE WEB & ROOT GRID ---
          let radius = 75;
          let time = Date.now();

          // 1. Connecting Vine Tether from Treant Center to Target Location
          c.strokeStyle = `rgba(46, 204, 113, ${0.4 + pulseAlpha * 0.3})`;
          c.lineWidth = 2.0;
          c.setLineDash([6, 4]);
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(m.targetX, m.targetY);
          c.stroke();
          c.setLineDash([]);

          // 2. Outer Bio-Luminescent Web Boundary Ring
          c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 12;
          c.shadowColor = "#2ecc71";
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(0, 255, 204, 0.6)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius + 3, 0, Math.PI * 2);
          c.stroke();

          // 3. Growing Inner Bio-Spore Web Fill
          let fillGrad = c.createRadialGradient(
            m.targetX,
            m.targetY,
            1,
            m.targetX,
            m.targetY,
            radius,
          );
          fillGrad.addColorStop(0, `rgba(0, 255, 204, ${pulseAlpha * 0.5})`);
          fillGrad.addColorStop(0.5, `rgba(39, 174, 96, ${pulseAlpha * 0.35})`);
          fillGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

          c.fillStyle = fillGrad;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 4. Concentric Arachnid Web Rings
          let webRings = 4;
          c.strokeStyle = `rgba(0, 255, 204, ${0.3 + progress * 0.4})`;
          c.lineWidth = 1.4;
          for (let r = 1; r <= webRings; r++) {
            let ringRad = (radius * progress * r) / webRings;
            if (ringRad > 2) {
              c.beginPath();
              c.arc(m.targetX, m.targetY, ringRad, 0, Math.PI * 2);
              c.stroke();
            }
          }

          // 5. Radial Root Vine Strands & Bio-Luminescent Nodes
          let rays = 8;
          c.strokeStyle = `rgba(46, 204, 113, ${0.5 + progress * 0.4})`;
          c.lineWidth = 1.8;
          c.beginPath();
          for (let i = 0; i < rays; i++) {
            let angle = (i * Math.PI * 2) / rays + time / 2000;
            let endR = radius * progress;
            c.moveTo(m.targetX, m.targetY);
            c.lineTo(
              m.targetX + Math.cos(angle) * endR,
              m.targetY + Math.sin(angle) * endR,
            );
          }
          c.stroke();

          // Bio-Luminescent Nodes at Web Intersections
          c.fillStyle = "#00ffcc";
          for (let r = 1; r <= webRings; r++) {
            let ringRad = (radius * progress * r) / webRings;
            if (ringRad > 4) {
              for (let i = 0; i < rays; i++) {
                let angle = (i * Math.PI * 2) / rays + time / 2000;
                let nx = m.targetX + Math.cos(angle) * ringRad;
                let ny = m.targetY + Math.sin(angle) * ringRad;
                c.beginPath();
                c.arc(nx, ny, 1.8, 0, Math.PI * 2);
                c.fill();
              }
            }
          }

          // 6. Perimeter Thorn Teeth
          let thorns = 8;
          c.fillStyle = `rgba(39, 174, 96, ${0.5 + progress * 0.5})`;
          c.strokeStyle = "#000000";
          c.lineWidth = 1.0;
          for (let i = 0; i < thorns; i++) {
            let ta = (i * Math.PI * 2) / thorns + time / 800;
            let outX = m.targetX + Math.cos(ta) * (radius + 6);
            let outY = m.targetY + Math.sin(ta) * (radius + 6);
            let side1X = m.targetX + Math.cos(ta - 0.15) * (radius - 2);
            let side1Y = m.targetY + Math.sin(ta - 0.15) * (radius - 2);
            let side2X = m.targetX + Math.cos(ta + 0.15) * (radius - 2);
            let side2Y = m.targetY + Math.sin(ta + 0.15) * (radius - 2);

            c.beginPath();
            c.moveTo(side1X, side1Y);
            c.lineTo(outX, outY);
            c.lineTo(side2X, side2Y);
            c.closePath();
            c.fill();
            c.stroke();
          }
        } else if (m.activeAbility === "magnetic_pull") {
          // --- BOSS 2: SAPPHIRE MAGNETIC VORTEX ---
          let time = Date.now();
          let maxRadius = 140;

          // 1. Central Impact Hazard Zone
          let coreGrad = c.createRadialGradient(cx, cy, 2, cx, cy, 70);
          coreGrad.addColorStop(0, `rgba(0, 210, 255, ${pulseAlpha * 0.7})`);
          coreGrad.addColorStop(
            0.5,
            `rgba(56, 189, 248, ${pulseAlpha * 0.35})`,
          );
          coreGrad.addColorStop(1, "rgba(5, 12, 24, 0)");

          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, 70, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = `rgba(0, 210, 255, ${0.5 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.0;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";
          c.beginPath();
          c.arc(cx, cy, 70, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // 2. Contracting Spiral Field Rings
          let ringCount = 4;
          c.lineWidth = 1.6;
          for (let i = 0; i < ringCount; i++) {
            let rProgress = (progress + i / ringCount) % 1.0;
            let currentR = maxRadius * (1.0 - rProgress);

            c.strokeStyle = `rgba(0, 210, 255, ${(1.0 - rProgress) * (0.4 + pulseAlpha * 0.4)})`;
            c.beginPath();
            c.arc(cx, cy, currentR, 0, Math.PI * 2);
            c.stroke();
          }

          // 3. Rotating Magnetic Field Vector Spokes
          let spokes = 6;
          c.strokeStyle = `rgba(56, 189, 248, ${0.25 + pulseAlpha * 0.25})`;
          c.lineWidth = 1.2;
          c.save();
          c.translate(cx, cy);
          c.rotate(time / 300);
          for (let s = 0; s < spokes; s++) {
            let ang = (s * Math.PI * 2) / spokes;
            c.beginPath();
            c.moveTo(Math.cos(ang) * 15, Math.sin(ang) * 15);
            c.lineTo(Math.cos(ang) * maxRadius, Math.sin(ang) * maxRadius);
            c.stroke();
          }
          c.restore();
        } else if (m.activeAbility === "boomerang_shield") {
          // --- BOSS 2: SAPPHIRE BOOMERANG TRAJECTORY ---
          let time = Date.now();
          c.strokeStyle = `rgba(0, 210, 255, ${0.6 + pulseAlpha * 0.4})`;
          c.lineWidth = 2.2;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";

          // Target Reticle
          let reticleR = 22 + Math.sin(time / 100) * 3;
          c.beginPath();
          c.arc(m.targetX, m.targetY, reticleR, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // Dual Trajectory Dotted Guidelines
          let angleToPlayer = Math.atan2(m.targetY - cy, m.targetX - cx);
          c.strokeStyle = "rgba(56, 189, 248, 0.4)";
          c.lineWidth = 1.2;
          c.setLineDash([5, 4]);

          [-0.25, 0.25].forEach((offset) => {
            let arcAng = angleToPlayer + offset;
            let tx = cx + Math.cos(arcAng) * 160;
            let ty = cy + Math.sin(arcAng) * 160;
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(tx, ty);
            c.stroke();
          });
          c.setLineDash([]);
        } else if (
          m.activeAbility === "shield_bash" &&
          m.shieldAngle !== undefined
        ) {
          // --- BOSS 2: DIRECTIONAL TOWER SHIELD BASH CONE ---
          let radius = 68;
          let arcWidth = 0.55; // Radians to each side of shieldAngle

          // 1. Layered Sector Warning Cone
          let coneGrad = c.createRadialGradient(cx, cy, 2, cx, cy, radius);
          coneGrad.addColorStop(0, `rgba(0, 210, 255, ${pulseAlpha * 0.6})`);
          coneGrad.addColorStop(0.7, `rgba(231, 76, 60, ${pulseAlpha * 0.5})`);
          coneGrad.addColorStop(1, "rgba(231, 76, 60, 0)");

          c.fillStyle = coneGrad;
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.closePath();
          c.fill();

          // 2. Heavy Outlined Arc Boundaries
          c.strokeStyle = "#e74c3c";
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#e74c3c";
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.closePath();
          c.stroke();
          c.shadowBlur = 0;

          // 3. Sweeping Shockwave Arc expanding with progress
          let waveR = Math.max(0, radius * progress);
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.0;
          c.beginPath();
          c.arc(
            cx,
            cy,
            waveR,
            m.shieldAngle - arcWidth,
            m.shieldAngle + arcWidth,
          );
          c.stroke();

          // 4. Sector Directional Rib Lines
          c.strokeStyle = "rgba(0, 210, 255, 0.4)";
          c.lineWidth = 1.0;
          [-0.35, 0, 0.35].forEach((angOffset) => {
            let subAng = m.shieldAngle + angOffset;
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(
              cx + Math.cos(subAng) * radius,
              cy + Math.sin(subAng) * radius,
            );
            c.stroke();
          });
        } else if (m.activeAbility === "magma_vents" && m.ventSpawnLocations) {
          // --- BOSS 3: MAGMA VENT FISSURE TARGETS ---
          let time = Date.now();
          let ventRadius = 18;

          m.ventSpawnLocations.forEach((loc) => {
            // 1. Dual Molten Warning Rings
            c.strokeStyle = `rgba(249, 115, 22, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 2.2;
            c.shadowBlur = 10;
            c.shadowColor = "#f97316";
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius + pulseAlpha * 3, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.strokeStyle = "rgba(254, 240, 138, 0.8)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius + 4, 0, Math.PI * 2);
            c.stroke();

            // 2. Bubbling Lava Core Fill
            let lavaGrad = c.createRadialGradient(
              loc.x,
              loc.y,
              1,
              loc.x,
              loc.y,
              ventRadius,
            );
            lavaGrad.addColorStop(
              0,
              `rgba(254, 240, 138, ${pulseAlpha * 0.8})`,
            );
            lavaGrad.addColorStop(
              0.6,
              `rgba(249, 115, 22, ${pulseAlpha * 0.4})`,
            );
            lavaGrad.addColorStop(1, "rgba(234, 88, 12, 0)");

            c.fillStyle = lavaGrad;
            c.beginPath();
            c.arc(loc.x, loc.y, ventRadius * progress, 0, Math.PI * 2);
            c.fill();

            // 3. Crosshair Fissure Ticks
            c.strokeStyle = `rgba(253, 186, 116, ${0.4 + progress * 0.5})`;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(loc.x - ventRadius - 4, loc.y);
            c.lineTo(loc.x + ventRadius + 4, loc.y);
            c.moveTo(loc.x, loc.y - ventRadius - 4);
            c.lineTo(loc.x, loc.y + ventRadius + 4);
            c.stroke();
          });
        } else if (m.activeAbility === "dilation_field") {
          // --- BOSS 6: ROMAN NUMERAL CLOCKWORK DILATION FIELD & DIAL SWEEPS ---
          let radius = 42;
          let time = Date.now();

          // 1. Outer Brass Gear Teeth Perimeter
          c.save();
          c.translate(m.targetX, m.targetY);
          c.rotate(time / 1200);

          c.fillStyle = `rgba(212, 175, 55, ${0.4 + pulseAlpha * 0.3})`;
          c.strokeStyle = "#ffd700";
          c.lineWidth = 1.0;
          let teeth = 12;
          for (let i = 0; i < teeth; i++) {
            let tAng = (i * Math.PI * 2) / teeth;
            c.save();
            c.rotate(tAng);
            c.fillRect(-2, -radius - 3, 4, 3);
            c.restore();
          }
          c.restore();

          // 2. Outer Pulsing Gold Dial Ring
          c.strokeStyle = `rgba(241, 196, 15, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#ffd700";
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // 3. Growing Concentric Warning Fill Disc
          let fillGrad = c.createRadialGradient(
            m.targetX,
            m.targetY,
            1,
            m.targetX,
            m.targetY,
            radius,
          );
          fillGrad.addColorStop(0, `rgba(254, 240, 138, ${pulseAlpha * 0.7})`);
          fillGrad.addColorStop(0.5, `rgba(212, 175, 55, ${pulseAlpha * 0.4})`);
          fillGrad.addColorStop(1, "rgba(120, 53, 15, 0)");

          c.fillStyle = fillGrad;
          c.beginPath();
          c.arc(m.targetX, m.targetY, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 4. 12 Clock Dial Hour Ticks (XII, III, VI, IX)
          c.strokeStyle = "rgba(254, 240, 138, 0.8)";
          c.lineWidth = 1.2;
          for (let i = 0; i < 12; i++) {
            let tickAng = (i * Math.PI * 2) / 12;
            let isMajor = i % 3 === 0;
            let innerR = isMajor ? radius - 8 : radius - 4;
            c.beginPath();
            c.moveTo(
              m.targetX + Math.cos(tickAng) * innerR,
              m.targetY + Math.sin(tickAng) * innerR,
            );
            c.lineTo(
              m.targetX + Math.cos(tickAng) * radius,
              m.targetY + Math.sin(tickAng) * radius,
            );
            c.stroke();
          }

          // 5. Sweeping Clock Hand Line (0 to 2*PI in direction of progress)
          let handAng = -Math.PI / 2 + progress * Math.PI * 2;
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.0;
          c.beginPath();
          c.moveTo(m.targetX, m.targetY);
          c.lineTo(
            m.targetX + Math.cos(handAng) * (radius - 3),
            m.targetY + Math.sin(handAng) * (radius - 3),
          );
          c.stroke();

          c.fillStyle = "#ffd700";
          c.beginPath();
          c.arc(m.targetX, m.targetY, 2.5, 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "control_glitch") {
          // --- HIGH FIDELITY CONTROL GLITCH GRID ---
          let radius = 180;
          let time = Date.now();

          // Outer pulsing digital wireframe boundary
          c.strokeStyle = `rgba(255, 0, 127, ${pulseAlpha})`;
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#ff007f";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          // Rotating cybernetic grid guidelines
          c.strokeStyle = "rgba(0, 240, 255, 0.25)";
          c.lineWidth = 1.0;
          c.save();
          c.translate(cx, cy);
          c.rotate(time / 500);

          // Draw horizontal and vertical grid intersection guides
          for (let d = -radius + 30; d < radius; d += 30) {
            if (Math.abs(d) >= radius) continue;
            let chord = Math.sqrt(radius * radius - d * d);
            c.beginPath();
            c.moveTo(-chord, d);
            c.lineTo(chord, d);
            c.moveTo(d, -chord);
            c.lineTo(d, chord);
            c.stroke();
          }
          c.restore();

          // Inner digital core warning
          c.fillStyle = `rgba(255, 0, 127, ${pulseAlpha * 0.15})`;
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "gold_fall" && m.goldFallTargets) {
          // --- HIGH FIDELITY GOLD FALL PLATES ---
          m.goldFallTargets.forEach((target) => {
            c.strokeStyle = `rgba(241, 196, 15, ${pulseAlpha})`;
            c.lineWidth = 2.0;
            c.shadowBlur = 8;
            c.shadowColor = "#ffd700";
            c.beginPath();
            c.arc(target.x, target.y, 20 + pulseAlpha * 3, 0, Math.PI * 2);
            c.stroke();
            c.shadowBlur = 0;

            c.fillStyle = `rgba(181, 135, 0, ${pulseAlpha * 0.22})`;
            c.beginPath();
            c.arc(target.x, target.y, 20 * progress, 0, Math.PI * 2);
            c.fill();
          });
        } else if (m.activeAbility === "scarlet_fire") {
          // --- BOSS 7: SCARLET DRAGON FIRE BREATH CONE ---
          let radius = 115;
          let faceAngle = m.facing === -1 ? Math.PI : 0;
          let coneWidth = 0.85;

          c.save();

          // 1. Multi-Stop Flame Gradient Fill
          let fireGrad = c.createRadialGradient(cx, cy, 2, cx, cy, radius);
          fireGrad.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha * 0.85})`);
          fireGrad.addColorStop(
            0.3,
            `rgba(254, 240, 138, ${pulseAlpha * 0.7})`,
          );
          fireGrad.addColorStop(0.7, `rgba(255, 85, 0, ${pulseAlpha * 0.5})`);
          fireGrad.addColorStop(1, "rgba(150, 0, 24, 0)");

          c.fillStyle = fireGrad;
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(
            cx,
            cy,
            radius * progress,
            faceAngle - coneWidth,
            faceAngle + coneWidth,
          );
          c.closePath();
          c.fill();

          // 2. Outer Dragon Fire Boundary Contour
          c.strokeStyle = "#ff3300";
          c.lineWidth = 2.5;
          c.shadowBlur = 12;
          c.shadowColor = "#ff3300";
          c.beginPath();
          c.moveTo(cx, cy);
          c.arc(cx, cy, radius, faceAngle - coneWidth, faceAngle + coneWidth);
          c.closePath();
          c.stroke();
          c.shadowBlur = 0;

          // 3. Advancing Fire Wavefront Arc
          let waveR = Math.max(0, radius * progress);
          c.strokeStyle = "rgba(254, 240, 138, 0.9)";
          c.lineWidth = 2.0;
          c.beginPath();
          c.arc(cx, cy, waveR, faceAngle - coneWidth, faceAngle + coneWidth);
          c.stroke();

          // 4. Radial Flame Jet Guidelines
          c.strokeStyle = `rgba(255, 85, 0, ${0.4 + progress * 0.4})`;
          c.lineWidth = 1.2;
          let rays = 5;
          for (let r = 0; r < rays; r++) {
            let rayAng =
              faceAngle - coneWidth + (r * (coneWidth * 2)) / (rays - 1);
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(
              cx + Math.cos(rayAng) * radius,
              cy + Math.sin(rayAng) * radius,
            );
            c.stroke();
          }

          c.restore();
        } else if (m.activeAbility === "calamity_slam") {
          // --- BOSS 7: FAULT LINE GROUND SHATTER ---
          let time = Date.now();
          let radius = 80;

          // 1. Outer Volcanic Calamity Boundary Ring
          c.strokeStyle = `rgba(255, 51, 0, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 14;
          c.shadowColor = "#ff3300";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(254, 240, 138, 0.7)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          c.stroke();

          // 2. Inner Collapsing Ground Fill
          let collapseGrad = c.createRadialGradient(cx, cy, 1, cx, cy, radius);
          collapseGrad.addColorStop(
            0,
            `rgba(254, 240, 138, ${pulseAlpha * 0.75})`,
          );
          collapseGrad.addColorStop(
            0.5,
            `rgba(255, 85, 0, ${pulseAlpha * 0.45})`,
          );
          collapseGrad.addColorStop(1, "rgba(150, 0, 24, 0)");

          c.fillStyle = collapseGrad;
          c.beginPath();
          c.arc(cx, cy, radius * progress, 0, Math.PI * 2);
          c.fill();

          // 3. Jagged Fault Line Ground Cracks (8 Fractures)
          c.strokeStyle = `rgba(255, 51, 0, ${0.5 + progress * 0.5})`;
          c.lineWidth = 2.0;
          c.beginPath();
          let cracks = 8;
          for (let i = 0; i < cracks; i++) {
            let baseAng = (i * Math.PI * 2) / cracks + (m.id || 0);
            let endDist = radius * progress;
            let steps = 4;
            let lastX = cx;
            let lastY = cy;

            for (let s = 1; s <= steps; s++) {
              let curDist = (endDist * s) / steps;
              let jitter = Math.sin(s * 3.1 + time / 180) * 3;
              let curAngle = baseAng + jitter * 0.04;
              let nx = cx + Math.cos(curAngle) * curDist;
              let ny = cy + Math.sin(curAngle) * curDist;

              c.moveTo(lastX, lastY);
              c.lineTo(nx, ny);
              lastX = nx;
              lastY = ny;
            }
          }
          c.stroke();
        } else if (m.activeAbility === "spore_storm") {
          // --- BOSS 4: ROTATING SPORE VECTOR CONES ---
          let time = Date.now();
          let coneRadius = 55;
          let rotAngle = time / 500;

          c.save();
          c.translate(cx, cy);

          // 1. 3 Rotating Directional Spore Cones
          let numCones = 3;
          let coneWidth = 0.35; // radians each side
          for (let i = 0; i < numCones; i++) {
            let baseAng = rotAngle + (i * Math.PI * 2) / numCones;

            let sporeGrad = c.createRadialGradient(0, 0, 2, 0, 0, coneRadius);
            sporeGrad.addColorStop(
              0,
              `rgba(163, 253, 131, ${pulseAlpha * 0.7})`,
            );
            sporeGrad.addColorStop(
              0.6,
              `rgba(46, 204, 113, ${pulseAlpha * 0.35})`,
            );
            sporeGrad.addColorStop(1, "rgba(20, 61, 31, 0)");

            c.fillStyle = sporeGrad;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(
              0,
              0,
              coneRadius * progress,
              baseAng - coneWidth,
              baseAng + coneWidth,
            );
            c.closePath();
            c.fill();

            c.strokeStyle = `rgba(46, 204, 113, ${0.6 + pulseAlpha * 0.4})`;
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(0, 0, coneRadius, baseAng - coneWidth, baseAng + coneWidth);
            c.closePath();
            c.stroke();
          }

          c.restore();

          // 2. Central Toxic Core Circle
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 20);
          coreGrad.addColorStop(0, `rgba(163, 253, 131, ${pulseAlpha * 0.8})`);
          coreGrad.addColorStop(1, "rgba(46, 204, 113, 0)");

          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, 20, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.arc(cx, cy, 20, 0, Math.PI * 2);
          c.stroke();
        } else if (m.activeAbility === "singularity") {
          // --- BOSS 5: EVENT HORIZON ACCRETION DISK & GRAVITY VACUUM RINGS ---
          let radius = 90;
          let time = Date.now();

          // 1. Outer Pulsing Event Horizon Boundary
          c.strokeStyle = `rgba(232, 67, 147, ${0.7 + pulseAlpha * 0.3})`;
          c.lineWidth = 3.0;
          c.shadowBlur = 16;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.strokeStyle = "rgba(142, 68, 173, 0.6)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          c.stroke();

          // 2. Counter-Rotating Tilted Accretion Disk Ellipses
          c.save();
          c.translate(cx, cy);

          // Outer Accretion Ring (Counter-Clockwise)
          c.save();
          c.rotate(-time / 300);
          c.strokeStyle = "rgba(232, 67, 147, 0.65)";
          c.lineWidth = 1.8;
          c.beginPath();
          c.ellipse(0, 0, radius * 0.95, radius * 0.35, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Inner Accretion Ring (Clockwise)
          c.save();
          c.rotate(time / 220 + Math.PI / 4);
          c.strokeStyle = "rgba(0, 210, 255, 0.65)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.ellipse(0, 0, radius * 0.75, radius * 0.28, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          c.restore();

          // 3. Contracting Gravity Vacuum Rings
          let ringCount = 4;
          for (let i = 0; i < ringCount; i++) {
            let rProgress = (progress + i / ringCount) % 1.0;
            let curR = radius * (1.0 - rProgress);
            c.strokeStyle = `rgba(142, 68, 173, ${(1.0 - rProgress) * (0.5 + pulseAlpha * 0.4)})`;
            c.lineWidth = 1.6;
            c.beginPath();
            c.arc(cx, cy, curR, 0, Math.PI * 2);
            c.stroke();
          }

          // 4. Dense Black Hole Core Singularity with Magenta Rim
          let coreR = 14 + pulseAlpha * 4 + progress * 6;
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, coreR);
          coreGrad.addColorStop(0, "rgba(232, 67, 147, 0.95)");
          coreGrad.addColorStop(0.5, "rgba(9, 2, 26, 0.98)");
          coreGrad.addColorStop(1, "rgba(9, 2, 26, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, coreR, 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "lasso") {
          // Render 3D Gold Lasso Indicator Line (Dashed)
          c.strokeStyle =
            "rgba(241, 196, 15, " + (0.45 + pulseAlpha * 0.45) + ")";
          c.lineWidth = 2.5;
          c.setLineDash([6, 4]);
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(m.targetX, m.targetY);
          c.stroke();
          c.setLineDash([]);

          // Render contracting golden capture ring at target coordinate
          let r = 48 * (1.0 - progress);
          c.strokeStyle = "#ffd700";
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(m.targetX, m.targetY, Math.max(1, r), 0, Math.PI * 2);
          c.stroke();

          c.fillStyle = "rgba(241, 196, 15, 0.12)";
          c.beginPath();
          c.arc(m.targetX, m.targetY, Math.max(1, r), 0, Math.PI * 2);
          c.fill();
        } else if (m.activeAbility === "barrage") {
          // Radial coin indicator ring
          c.strokeStyle =
            "rgba(241, 196, 15, " + (0.45 + pulseAlpha * 0.45) + ")";
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(cx, cy, 55 * progress, 0, Math.PI * 2);
          c.stroke();

          // 8 dotted outward guide rays
          c.lineWidth = 1.0;
          c.setLineDash([4, 4]);
          for (let i = 0; i < 8; i++) {
            let angle = (i * Math.PI * 2) / 8;
            c.beginPath();
            c.moveTo(cx + Math.cos(angle) * 12, cy + Math.sin(angle) * 12);
            c.lineTo(cx + Math.cos(angle) * 120, cy + Math.sin(angle) * 120);
            c.stroke();
          }
          c.setLineDash([]);
        } else if (m.activeAbility === "inversion") {
          // Radial Inversion Field
          let radius = 120;
          c.strokeStyle =
            "rgba(168, 85, 247, " + (0.5 + pulseAlpha * 0.45) + ")";
          c.lineWidth = 2.5;
          c.shadowBlur = 10;
          c.shadowColor = "#a855f7";
          c.beginPath();
          c.arc(cx, cy, radius, 0, Math.PI * 2);
          c.stroke();
          c.shadowBlur = 0;

          c.fillStyle = "rgba(168, 85, 247, " + pulseAlpha * 0.15 + ")";
          c.beginPath();
          c.arc(cx, cy, radius * progress, 0, Math.PI * 2);
          c.fill();

          // Dotted outer boundary line
          c.strokeStyle = "rgba(255, 255, 255, 0.4)";
          c.lineWidth = 1.0;
          c.beginPath();
          c.arc(cx, cy, radius + 4, 0, Math.PI * 2);
          c.stroke();
        } else if (m.activeAbility === "gold_rush_dash" && m.dashNodes) {
          // Zigzag Gold Rush guidelines
          c.strokeStyle =
            "rgba(249, 115, 22, " + (0.5 + pulseAlpha * 0.45) + ")";
          c.lineWidth = 2.0;
          c.beginPath();
          c.moveTo(cx, cy);
          m.dashNodes.forEach((node) => {
            c.lineTo(node.x, node.y);
          });
          c.stroke();

          // Draw target ticks at each nodes
          c.fillStyle = "#f97316";
          m.dashNodes.forEach((node) => {
            c.beginPath();
            c.arc(node.x, node.y, 3, 0, Math.PI * 2);
            c.fill();
          });
        }
        c.restore(); // Unified top-level restore
      },
    };

