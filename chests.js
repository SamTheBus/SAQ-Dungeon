import { addActiveDungeonMob } from "./encounter_state.js";
import {
  getRecoveryItemCount,
  getRecoveryRecordForFloor,
} from "./recovery_contract.js";

  // --- POLYSCOPIC CHEST ERUPTION ENGINE (SUBPHASE C.1) ---
  export function spawnChestEruptionParticles(
    worldX,
    worldY,
    isRecoveryOrTier = false,
  ) {
    if (!window.particles || !window.ParticlePool) return;

    let isRecovery = isRecoveryOrTier === true;
    let isGilded = isRecoveryOrTier === "gilded";
    let isAstral = isRecoveryOrTier === "astral";

    // A. Drifting magical star flares
    let starCount = isRecovery ? 12 : isGilded ? 15 : isAstral ? 24 : 6;
    for (let i = 0; i < starCount; i++) {
      let speedX = window.randFloat(-1.5, 1.5);
      let speedY = -window.randFloat(3.0, 7.0);
      let life = window.randInt(25, 55);

      let color = "#ffd700";
      if (isRecovery) {
        color = Math.random() < 0.5 ? "#00d2ff" : "#a855f7";
      } else if (isGilded) {
        color = Math.random() < 0.6 ? "#ffd700" : "#ffaa00";
      } else if (isAstral) {
        color =
          Math.random() < 0.4
            ? "#00ffff"
            : Math.random() < 0.7
              ? "#a855f7"
              : "#ffffff";
      }

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        speedX,
        speedY,
        window.randFloat(3.5, 6.5),
        color,
        0.95,
        life,
        life,
        0.04, // low gravity
        true,
      );
      pt.style = "sparkle_star";
      pt.angle = Math.random() * Math.PI * 2;
      pt.spinSpeed = window.randFloat(-0.08, 0.08);
      pt.scaleDecay = 0.012;
      window.particles.push(pt);
    }

    // B. Tumbling, gravity-influenced splinters/shards
    let splinterCount = isRecovery ? 15 : isGilded ? 18 : isAstral ? 28 : 10;
    let woodColors = ["#8b4513", "#5c2e0b", "#78350f"];
    if (isGilded) {
      woodColors = ["#800020", "#4a0404", "#ffd700"];
    } else if (isAstral) {
      woodColors = ["#0a0f1d", "#111827", "#00ffff"];
    } else if (isRecovery) {
      woodColors = ["#2d3748", "#1e293b", "#0f172a"];
    }

    for (let i = 0; i < splinterCount; i++) {
      let speedX = window.randFloat(-3.0, 3.0);
      let speedY = -window.randFloat(2.5, 6.0);
      let life = window.randInt(20, 45);
      let color = woodColors[Math.floor(Math.random() * woodColors.length)];

      let pt = window.ParticlePool.get(
        worldX,
        worldY,
        speedX,
        speedY,
        window.randFloat(2.0, 4.0),
        color,
        1.0,
        life,
        life,
        0.24, // gravity pulls splinters down
        true,
      );
      pt.style = "polygon";
      pt.angle = Math.random() * Math.PI * 2;
      pt.spinSpeed = window.randFloat(-0.25, 0.25);
      pt.scaleDecay = 0.018;
      pt.drag = 0.95;
      window.particles.push(pt);
    }

    // C. Spinning 3D gold coins
    if (!isRecovery) {
      let coinCount = isGilded ? 16 : isAstral ? 24 : 8;
      for (let i = 0; i < coinCount; i++) {
        let speedX = window.randFloat(-2.2, 2.2);
        let speedY = -window.randFloat(3.5, 7.5);
        let life = window.randInt(30, 55);
        let color = isAstral && Math.random() < 0.4 ? "#00ffff" : "#ffd700";

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          speedX,
          speedY,
          window.randFloat(3.0, 4.5),
          color,
          1.0,
          life,
          life,
          0.26, // gravity pulls coins down
          true,
        );
        pt.style = "elliptical_3d";
        pt.angle = Math.random() * Math.PI * 2;
        pt.spinSpeed = window.randFloat(0.14, 0.32);
        pt.scaleDecay = 0.008;
        pt.drag = 0.96;
        window.particles.push(pt);
      }
    }

    // D. Swirling Nebular Dust Orbs (Astral Vault exclusively)
    if (isAstral) {
      let orbCount = 10;
      for (let i = 0; i < orbCount; i++) {
        let speedX = window.randFloat(-1.2, 1.2);
        let speedY = -window.randFloat(1.5, 4.0);
        let life = window.randInt(40, 70);
        let color = Math.random() < 0.5 ? "#00ffff" : "#a855f7";

        let pt = window.ParticlePool.get(
          worldX,
          worldY,
          speedX,
          speedY,
          window.randFloat(2.5, 4.5),
          color,
          0.85,
          life,
          life,
          -0.02, // low upward floating gravity
          true,
        );
        pt.style = "glowing_orb";
        pt.scaleDecay = 0.01;
        pt.drag = 0.97;
        window.particles.push(pt);
      }
    }
  }

  export function isChestOpened(x, y) {
    if (!window.activeDungeonMap) return false;
    if (!window.activeDungeonMap.openedChests) {
      window.activeDungeonMap.openedChests = new Set();
    }
    return window.activeDungeonMap.openedChests.has(`${x},${y}`);
  }

  export function getChestTierAt(x, y) {
    let map = window.activeDungeonMap;
    if (!map || !map.chestTiers) return "iron_bound";
    return map.chestTiers[`${x},${y}`] || "iron_bound";
  }

  export function getChestProgress(x, y) {
    let map = window.activeDungeonMap;
    if (!map || !map.chestAnimations) return 0.0;
    let anim = map.chestAnimations[`${x},${y}`];
    return anim ? anim.progress : 0.0;
  }

  export function dispenseChestLootAt(tx, ty) {
    let map = window.activeDungeonMap;
    if (!map || !map.grid) return;
    let tile = map.grid[ty][tx];
    let p = window.player;
    let tileSize = map.tileSize;
    if (!p) return;

    let isChallengeActive =
      window.playerStats && window.playerStats.activeSpecialChallenge !== null;

    let hasBloodToll =
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("blood_toll");
    if (hasBloodToll && tile !== window.TILE_TYPES.RECOVERY_CHEST) {
      let siphon = Math.round(p.hp * 0.12);
      p.hp = Math.max(1, p.hp - siphon);
      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 12,
          `-${siphon} HP (BLOOD TOLL)`,
          "#e74c3c",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("hit");
      }
    }

    if (tile === window.TILE_TYPES.RECOVERY_CHEST) {
      if (!window.isChestOpened(tx, ty)) {
        window.setChestOpened(tx, ty);
        window.playerStats.hasTriggeredRecovery = true;

        if (typeof window.spawnChestEruptionParticles === "function") {
          window.spawnChestEruptionParticles(
            tx * tileSize + tileSize / 2,
            ty * tileSize + tileSize / 2,
            true,
          );
        }

        let rec = getRecoveryRecordForFloor(window.player?.depth);
        if (rec) {
          let itemsToRecover = (rec.items || []).filter(Boolean);
          let recoveredCount = getRecoveryItemCount(rec);

          itemsToRecover.forEach((item) => {
            window.spawnGroundLoot(item, p.x, p.y - 10);
          });

          let recoveredGold = BigNum.from(rec.gold || 0);
          if (recoveredGold.gt(0)) {
            window.playerStats.runGold = BigNum.from(
              window.playerStats.runGold || 0,
            ).add(recoveredGold);
            window.addGoldFloatingText(p, recoveredGold);
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("revive");
          }

          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              p.x,
              p.y - 10,
              35,
              "gold_dungeon",
              5,
            );
            window.combatVisuals.spawnBeam(p.x, "#ffd700", 60, true, 0);
            window.combatVisuals.triggerScreenShake(6, 12);
          }

          let msg = `RECOVERY RETURNED — STILL AT RISK`;
          if (recoveredCount > 0) msg += ` (${recoveredCount} ITEMS)`;
          if (recoveredGold.gt(0)) {
            msg += ` (+${window.formatNumber(recoveredGold)} RUN GOLD)`;
          }

          window.spawnFloatingText(p.x, p.y - 25, msg, "#f1c40f");

          let returnParts = [];
          if (recoveredCount > 0) {
            returnParts.push(
              `${recoveredCount} item${recoveredCount === 1 ? "" : "s"} as nearby ground loot`,
            );
          }
          if (recoveredGold.gt(0)) {
            returnParts.push(
              `${window.formatNumber(recoveredGold)} Gold as run Gold`,
            );
          }
          let riskMessage = `Recovery returned ${returnParts.join(" and ")} to this active run. These assets remain at risk until successful extraction.`;

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(riskMessage, "#f1c40f");
          }
          if (typeof window.pushLog === "function") {
            window.pushLog(
              `<strong style='color:#f1c40f;'>[RECOVERY — STILL AT RISK]</strong> ${riskMessage}`,
            );
          }

          window.playerStats.recoveryLoot = null;
          if (typeof window.saveGame === "function") window.saveGame();
        }
      }
    } else if (tile === window.TILE_TYPES.CHEST_SPAWN) {
          if (!window.isChestOpened(tx, ty)) {
            window.setChestOpened(tx, ty);
            let stageScale = window.getFloorItemLevel ? window.getFloorItemLevel(window.player.depth) : Math.floor((window.player.depth || 1) / 4) + 1;
        let tier =
          typeof window.getChestTierAt === "function"
            ? window.getChestTierAt(tx, ty)
            : "iron_bound";
        let pStats =
          typeof window.resolvePlayerStats === "function"
            ? window.resolvePlayerStats()
            : {};
        let playerQuality = pStats.qly || 1.0;

        // Roll for Surprise Hoard Mimic (7% base chance on standard non-boss floors)
        let isBossRoom =
          stageScale % 12 === 4 ||
          stageScale % 12 === 8 ||
          stageScale % 12 === 0;
        let isChallenge =
          window.playerStats &&
          window.playerStats.activeSpecialChallenge !== null;
        let isRift =
          window.playerStats && window.playerStats.isRiftMode === true;
        let isCrucible =
          window.playerStats && window.playerStats.isCrucibleMode === true;
        let p = window.player;

        if (
          !isBossRoom &&
          !isChallenge &&
          !isRift &&
          !isCrucible &&
          p &&
          p.hp > p.maxHp * 0.25 &&
          Math.random() < 0.07
        ) {
          map.grid[ty][tx] = window.TILE_TYPES.FLOOR; // Clear chest tile

          if (map.chestAnimations) {
            delete map.chestAnimations[`${tx},${ty}`];
          }

          let sIdx = Math.floor((stageScale - 1) / 12);
          let repStage = window.getEffectiveStage(
            stageScale * 1.25 + sIdx * 12.0,
          );
          let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
          let repScale = Math.pow(repGrowth, repStage * 0.95);

          // Configure robust mini-boss parameters
          let mimicHp = Math.round(
            180 *
              repScale *
              (window.playerStats.currentRunEnemyStrength || 1.0),
          );
          let mimicAtk = Math.round(
            14 * repScale * (window.playerStats.currentRunEnemyStrength || 1.0),
          );

          mimicHp = Math.max(
            Math.round(450 * (1 + stageScale * 0.08)),
            mimicHp,
          );
          mimicAtk = Math.max(
            Math.round(18 * (1 + stageScale * 0.04)),
            mimicAtk,
          );

          addActiveDungeonMob({
            id: window.idCounter++,
            type: "mob",
            isMimic: true,
            visualType: "hoard_mimic",
            name:
              tier === "astral"
                ? "Astral Hoard Mimic"
                : tier === "gilded"
                  ? "Gilded Hoard Mimic"
                  : "Hoard Mimic",
            mimicTier: tier,
            x: tx * tileSize + 4,
            y: ty * tileSize + 4,
            w: 24,
            h: 24,
            hp: BigNum.from(mimicHp),
            maxHp: BigNum.from(mimicHp),
            atk: mimicAtk,
            flashTimer: 0,
            attackCooldown: 30, // Delay before snapping
            facing: -1,
            discovered: true,
            hopTimer: 0,
            isAggroed: true,
            speedMultiplier: 1.15,
          });

          if (window.spawnFloatingText) {
            window.spawnFloatingText(
              p.x,
              p.y - 25,
              "TRAP! IT'S A MIMIC!",
              "#ef4444",
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.triggerScreenShake(8, 14);
            window.combatVisuals.spawnParticles(
              tx * tileSize + tileSize / 2,
              ty * tileSize + tileSize / 2,
              25,
              "hoard_mimic",
              4,
            );
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("death");
          }
          return; // Block default chest loot drops
        }

        // Custom Helper to spawn tiered equipment drops
        let spawnTieredEquipment = (qualityMult, minRarity) => {
          if (isChallengeActive) {
            // Convert to high-value gold and rare crafting material payload
            let bonusGold = Math.floor(120 * (1 + stageScale * 0.8));
            window.spawnHomingGold(p.x, p.y - 10, bonusGold);

            let mats = [
              "Rare Scrap",
              "Magic Scrap",
              "Epic Scrap",
              "Legendary Scrap",
              "Eridium Shard",
            ];
            let idx = Math.min(
              mats.length - 1,
              Math.floor((stageScale - 1) / 10) + 1,
            );
            let chosenMat = mats[Math.floor(Math.random() * (idx + 1))];
            window.addDungeonRunScrap(
              chosenMat,
              window.randInt(2, 4),
              p.x,
              p.y - 10,
            );
            return;
          }

          let rolledRarity = window.rollItemRarity({
            progressionStage: window.player.depth || 1,
            resolvedQuality: qualityMult,
            source: window.EQUIPMENT_RARITY_SOURCES.CHEST,
          });
          rolledRarity = window.applyEquipmentRarityException(rolledRarity, {
            minimumRarity: minRarity,
            exception:
              window.EQUIPMENT_RARITY_EXCEPTIONS.AUTHORED_CHEST_MINIMUM,
          });
          let types = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots", "ring"];
          let chosenType = types[Math.floor(Math.random() * types.length)];
          let newItem = window.createItemObject(
            chosenType,
            rolledRarity,
            stageScale,
            0,
          );
          window.spawnGroundLoot(newItem, p.x, p.y - 10);
        };

        if (typeof window.spawnChestEruptionParticles === "function") {
          window.spawnChestEruptionParticles(
            tx * tileSize + tileSize / 2,
            ty * tileSize + tileSize / 2,
            tier === "gilded" ? "gilded" : tier === "astral" ? "astral" : false,
          );
        }

        if (tier === "iron_bound") {
          // --- IRON-BOUND CHEST LOOT TABLE ---
          if (Math.random() < 0.4) {
            let chestGold = Math.floor(60 * (1 + stageScale * 0.75));
            window.spawnHomingGold(p.x, p.y - 10, chestGold);
            if (
              window.SoundManager &&
              typeof window.SoundManager.playCoinCollect === "function"
            ) {
              window.SoundManager.playCoinCollect();
            }
          } else {
            spawnTieredEquipment(playerQuality, 0);
          }
        } else if (tier === "gilded") {
          // --- GILDED RELIQUARY LOOT TABLE ---
          // 1. Guaranteed massive gold payload
          let chestGold = Math.floor(180 * (1 + stageScale * 0.9));
          window.spawnHomingGold(p.x, p.y - 10, chestGold);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }

          // 2. Guaranteed equipment: +25% Quality plus an authored 1★ Rare minimum
          spawnTieredEquipment(playerQuality * 1.25, 1);

          // 3. 15% Chance for Cavern Sigil (max 3★)
          if (Math.random() < 0.15) {
            let rolledSigilRarity = window.rollSigilRarity(3, playerQuality);
            let sigilItem = window.createItemObject(
              "sigil",
              rolledSigilRarity,
              stageScale,
              0,
            );
            window.spawnGroundLoot(sigilItem, p.x, p.y - 10);
          }

          // 4. 20% Chance for Monster Card Sack
          if (Math.random() < 0.2) {
            window.addUseDrop("Monster Card Sack", 1, false);
          }
        } else {
          // --- ASTRAL VAULT LOOT TABLE ---
          // 1. Guaranteed colossal gold payload
          let chestGold = Math.floor(400 * (1 + stageScale * 1.25));
          window.spawnHomingGold(p.x, p.y - 10, chestGold);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }

          // 2. Two guaranteed equipment items: +60% Quality plus an authored 2★ Magic minimum
          spawnTieredEquipment(playerQuality * 1.6, 2);
          spawnTieredEquipment(playerQuality * 1.6, 2);

          // 3. Guaranteed 1 Cavern Sigil floor 2★ (Magic)
          let maxSigilStars = 0;
          let cleared = window.playerStats.maxFloorCleared || 0;
          if (cleared >= 120) maxSigilStars = 5;
          else if (cleared >= 72) maxSigilStars = 4;
          else if (cleared >= 48) maxSigilStars = 3;
          else if (cleared >= 24) maxSigilStars = 2;
          else if (cleared >= 12) maxSigilStars = 1;

          let rolledSigilRarity = window.rollSigilRarity(
            Math.max(2, maxSigilStars),
            playerQuality,
          );
          if (rolledSigilRarity < 2) {
            rolledSigilRarity = 2;
          }
          let sigilItem = window.createItemObject(
            "sigil",
            rolledSigilRarity,
            stageScale,
            0,
          );
          window.spawnGroundLoot(sigilItem, p.x, p.y - 10);

          // 4. 20% Chance for Rare Crafting Material
          if (Math.random() < 0.2) {
            let mats = ["Ancient Core", "Astral Essence", "Eridium Shard"];
            let chosenMat = mats[Math.floor(Math.random() * mats.length)];
            if (typeof window.spawnGroundMaterial === "function") {
              window.spawnGroundMaterial(chosenMat, 1, p.x, p.y - 10);
            }
          }

          // 5. Guaranteed 1x Monster Card Sack
          window.addUseDrop("Monster Card Sack", 1, false);
        }
      }
    }
  }

  export function setChestOpened(x, y) {
    if (!window.activeDungeonMap) return;
    if (!window.activeDungeonMap.openedChests) {
      window.activeDungeonMap.openedChests = new Set();
    }
    window.activeDungeonMap.openedChests.add(`${x},${y}`);
  }

