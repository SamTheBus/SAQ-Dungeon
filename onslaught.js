import { getActiveDungeonMap } from "./dungeon_map.js";
import {
  addActiveDungeonMob,
  resetEncounterState,
  setPrimaryMob,
} from "./encounter_state.js";
import { triggerVoidTouchedRareFrenzy } from "./set_affix_authority.js";

  export function triggerOnslaughtShatterAnimation() {
    let map = getActiveDungeonMap();
    let tileSize = map ? map.tileSize : 32;
    let altarX = 19 * tileSize + tileSize / 2;
    let altarY = 8 * tileSize + tileSize / 2;

    // 1. Visual Camera Trauma Shake
    if (window.combatVisuals) {
      window.combatVisuals.triggerScreenShake(12, 24);
    }

    // 2. Acoustic Shatter Feedback
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }

    // 3. Fling 45+ high-velocity purple & magenta shards (Zero-Allocation Pool)
    if (window.particles && window.ParticlePool) {
      for (let i = 0; i < 45; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = window.randFloat(3.5, 8.0);
        let life = window.randInt(30, 60);
        let size = window.randFloat(2.5, 5.0);
        let color = Math.random() < 0.55 ? "#a855f7" : "#e879f9";

        let pt = window.ParticlePool.get(
          altarX,
          altarY,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - window.randFloat(1.0, 3.0),
          size,
          color,
          1.0,
          life,
          life,
          0.2, // gravity drag
          true,
        );
        pt.style = "polygon";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(-0.25, 0.25);
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }

    // 4. Gold-Bordered System Notification (Emoji-Free)
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "[ALTAR UNLOCKED] The magical chains binding the Onslaught Altar have shattered! The Arena is open.",
        "#a855f7",
      );
    }
  }

  // Onslaught Perimeter Coordinate Spawning Calculator
  export function getOnslaughtSpawnPosition(map) {
    let x, y;
    let edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    if (edge === 0) {
      x = window.randInt(2, map.width - 3);
      y = 2;
    } else if (edge === 1) {
      x = map.width - 3;
      y = window.randInt(2, map.height - 3);
    } else if (edge === 2) {
      x = window.randInt(2, map.width - 3);
      y = map.height - 3;
    } else {
      x = 2;
      y = window.randInt(2, map.height - 3);
    }
    return { x, y };
  }

  // Advancing Sector Pool Resolver based on Active Wave
  export function getOnslaughtMobTypeForWave(wave) {
    let tier = Math.min(6, Math.floor((wave - 1) / 5)); // Progresses from Sector 1 to 7 over waves
    const pools = [
      { tier: 0, types: ["slime", "sprout", "thorn_wyrm"] },
      { tier: 1, types: ["golem", "wyrmling", "gargoyle", "rust_nibbler"] },
      {
        tier: 2,
        types: ["magma_elemental", "lava_serpent", "hell_bat", "slag_slime"],
      },
      {
        tier: 3,
        types: ["swamp_basilisk", "toxic_fly", "marsh_ghost", "corroded_golem"],
      },
      { tier: 4, types: ["void_orb", "void_crawler", "void_spectre"] },
      {
        tier: 5,
        types: [
          "clockwork_scarab",
          "star_weaver",
          "clockwork_drone",
          "temporal_watcher",
        ],
      },
      {
        tier: 6,
        types: [
          "neon_spider",
          "wireframe_orb",
          "cursed_blade",
          "animated_armor",
          "cyber_wraith",
        ],
      },
    ];
    let selected =
      pools[tier] || pools[Math.floor(Math.random() * pools.length)];
    let chosenType =
      selected.types[Math.floor(Math.random() * selected.types.length)];
    return { tier: selected.tier, type: chosenType };
  }

  // Milestone Boss Resolver
  export function getOnslaughtBossForWave(wave) {
    let isMajor = wave % 10 === 0;
    const bossTypes = [
      { name: "Arachnid Treant", visual: "arachnid_treant" },
      { name: "Aegis Goliath", visual: "aegis_goliath" },
      { name: "Overlord Iron Vault", visual: "overlord_iron_vault" },
      { name: "Corrosive Abomination", visual: "corrosive_abomination" },
      { name: "Void Overseer", visual: "void_overseer" },
      { name: "Chronos Arbitrator", visual: "chronos_arbitrator" },
      { name: "Nexus Overseer", visual: "nexus_overseer" },
    ];
    let idx = (Math.floor(wave / 5) - 1) % bossTypes.length;
    let selected =
      bossTypes[idx] || bossTypes[Math.floor(Math.random() * bossTypes.length)];
    return {
      name: selected.name,
      visualType: selected.visual,
      isMajor: isMajor,
    };
  }

  // Homing Healing Hearts Spawner & Updater
  export function spawnHomingHearts(x, y, amount) {
    if (!window.heartOrbs) window.heartOrbs = [];
    if (window.heartOrbs.length > 40) return;

    let particleCount = 1;
    if (amount > 30) {
      particleCount = window.randInt(2, 3);
    }
    let share = Math.round(amount / particleCount);

    for (let i = 0; i < particleCount; i++) {
      window.heartOrbs.push({
        x: x,
        y: y,
        vx: window.randFloat(-2.5, 2.5),
        vy: window.randFloat(-5, -2),
        value: share,
        scatterTimer: window.randInt(14, 20),
        gravity: 0.35,
        speed: 5.0,
      });
    }
  }

  export function updateHeartOrbs() {
    let p = window.player;
    if (!window.heartOrbs) return;

    for (let i = window.heartOrbs.length - 1; i >= 0; i--) {
      let ho = window.heartOrbs[i];
      if (ho.scatterTimer > 0) {
        ho.scatterTimer--;
        ho.x += ho.vx;
        ho.y += ho.vy;
        ho.vy += ho.gravity || 0.35;
        ho.vx *= 0.92;
      } else {
        let targetX = p.x;
        let targetY = p.y - 8;
        let dx = targetX - ho.x;
        let dy = targetY - ho.y;
        let dist = Math.hypot(dx, dy);

        if (dist < 14) {
          // Apply healing directly to the active Player
          p.hp = Math.min(p.maxHp, p.hp + ho.value);
          if (window.playerStats) {
            window.playerStats.currentHp = BigNum.from(p.hp);
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("fairy");
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              p.x,
              p.y - 15,
              `+${ho.value} HP`,
              "#2ecc71",
              true,
            );
          }
          window.heartOrbs.splice(i, 1);
        } else {
          ho.speed = Math.min(12, ho.speed + 0.4);
          ho.x += (dx / dist) * ho.speed;
          ho.y += (dy / dist) * ho.speed;
        }
      }
    }
  }

  // Onslaught/Crucible Wave Spawning Engine
  export function spawnOnslaughtWave(waveNumber) {
    let p = window.player;
    let map = getActiveDungeonMap();
    if (!p || !map) return;

    // Check if there are queued pre-run catchup drafts remaining
    if (window.playerStats.pendingCrucibleDrafts > 0) {
      window.triggerOnslaughtDraft();
      return; // Halt wave spawning sequence until drafts are resolved
    }

    let tileSize = map.tileSize;
    let isBossWave = waveNumber % 5 === 0;

    resetEncounterState();

    let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;

    let repStage =
      typeof window.getEffectiveStage === "function"
        ? window.getEffectiveStage(waveNumber)
        : waveNumber;
    let repScale = Math.pow(1.012, repStage) * (1 + 0.015 * repStage);
    let densityFactor = 1 + 0.005 * repStage;

    if (isBossWave) {
      // --- MILESTONE BOSS SPONDING ---
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);

      // Safe Teleportation: move player to bottom of arena to prevent boss-spawn overlap
      p.x = cx * tileSize + tileSize / 2;
      p.y = (map.height - 4) * tileSize + tileSize / 2;
      p.targetX = p.x;
      p.targetY = p.y;

      let bossInfo = window.getOnslaughtBossForWave(waveNumber);

      let bossHp = Math.round(
        (bossInfo.isMajor ? 2000 : 1200) *
          repScale *
          densityFactor *
          enemyScale,
      );
      let bossAtk = Math.round(
        (bossInfo.isMajor ? 28 : 20) * repScale * enemyScale,
      );

      setPrimaryMob({
        type: bossInfo.isMajor ? "dungeon_boss" : "dungeon_miniboss",
        name: bossInfo.name,
        visualType: bossInfo.visualType,
        hp: BigNum.from(bossHp),
        maxHp: BigNum.from(bossHp),
        atk: bossAtk,
        x: cx * tileSize - 16,
        y: cy * tileSize - 16,
        w: 64,
        h: 64,
        flashTimer: 0,
        isStopped: true,
        bossTileX: cx,
        bossTileY: cy,
        state: "idle",
        telegraphTimer: 0,
        maxTelegraphTimer: 65,
        activeAbility: null,
        targetX: 0,
        targetY: 0,
        attackCooldown: 60,
        moveset: bossInfo.isMajor
          ? ["slam", "nova", "charge"]
          : ["slam", "charge"],
        facing: -1,
      });

      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          `${bossInfo.name.toUpperCase()} ENGAGED`,
          "#e74c3c",
        );
      }
    } else {
      // --- STANDARD & ELITE MOB SPREAD SPONDING ---
      let spawnCount = Math.min(15, 3 + Math.floor(waveNumber / 2));
      let mobHpVal = Math.round(100 * repScale * densityFactor * enemyScale);
      let mobAtkVal = Math.round(12 * repScale * enemyScale);

      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let rareRate =
        (pStats.rareSpawn !== undefined ? pStats.rareSpawn : 0.01) +
        waveNumber * 0.002;
      let eliteChance = Math.min(0.95, waveNumber * 0.035);

      for (let i = 0; i < spawnCount; i++) {
        let mobInfo = window.getOnslaughtMobTypeForWave(waveNumber);
        let isRare = Math.random() < rareRate;
        let isElite = Math.random() < eliteChance;

        let eliteAffix = null;
        if (isElite) {
          const affixes = [
            "vitality_weaver",
            "iron_citadel",
            "swift_commander",
            "blood_berserker",
            "nullifier",
          ];
          eliteAffix = affixes[Math.floor(Math.random() * affixes.length)];
        }

        let finalHp = mobHpVal;
                let finalAtk = mobAtkVal;

                if (isElite && isRare) {
                  finalHp = Math.round(finalHp * 2.5);
                  finalAtk = Math.round(finalAtk * 1.6);
                } else if (isElite) {
                  finalHp = Math.round(finalHp * 1.5);
                  finalAtk = Math.round(finalAtk * 1.25);
                } else if (isRare) {
                  finalHp = Math.round(finalHp * 1.75);
                  finalAtk = Math.round(finalAtk * 1.35);
                }

                // Nullifier Elites disable offhands, so they receive a 35% HP reduction to allow quick bursting
                if (eliteAffix === "nullifier") {
                  finalHp = Math.round(finalHp * 0.65);
                }

        let rangedTypes = [
          "thorn_wyrm",
          "wyrmling",
          "magma_elemental",
          "toxic_fly",
          "void_orb",
        ];
        let isRanged = rangedTypes.includes(mobInfo.type);
        let projType =
          mobInfo.type === "thorn_wyrm"
            ? "thorn"
            : mobInfo.type === "wyrmling"
              ? "frost"
              : mobInfo.type === "magma_elemental"
                ? "fireball"
                : mobInfo.type === "toxic_fly"
                  ? "maelstrom"
                  : "void";

        let pos = window.getOnslaughtSpawnPosition(map);
        let spawnX = pos.x * tileSize;
        let spawnY = pos.y * tileSize;

        addActiveDungeonMob({
          id: window.idCounter++,
          type: "mob",
          visualTier: mobInfo.tier,
          visualType: mobInfo.type,
          x: spawnX,
          y: spawnY,
          homeX: spawnX,
          homeY: spawnY,
          w: 24,
          h: 24,
          hp: BigNum.from(finalHp),
          maxHp: BigNum.from(finalHp),
          atk: finalAtk,
          flashTimer: 0,
          attackCooldown: 0,
          rangedCooldown: window.randInt(30, 90),
          isRanged: isRanged,
          projectileType: projType,
          moveProfile:
            mobInfo.type === "golem" || mobInfo.type === "corroded_golem"
              ? "relentless"
              : "standard",
          facing: -1,
          isRare: isRare,
          isElite: isElite,
          eliteAffix: eliteAffix,
          buffStacks: { haste: 0, def: 0, atk: 0 },
          buffTimers: { haste: 0, def: 0, atk: 0 },
          buffDecayTimers: { haste: 0, def: 0, atk: 0 },
          wanderTimer: window.randInt(40, 120),
          wanderVx: 0,
          wanderVy: 0,
          isWandering: false,
          hopTimer: window.randInt(0, 29),
        });
        triggerVoidTouchedRareFrenzy({
          isRare,
          resolvedStats: pStats,
          playerStats: window.playerStats,
          chronoExtensionFrames:
            typeof window.scaleArtifactMechanic === "function"
              ? window.scaleArtifactMechanic("extend_buffs", 180)
              : 0,
        });
      }
    }
  }

