import { getActiveDungeonMap } from "./dungeon_map.js";
import { isPlayerTargetableMob } from "./combat_factions.js";
import { getMasteryNodeRank } from "./mastery_authority.js";

  export function updateCavernEffects() {
    if (window.currentGameState !== window.GAME_STATES.DUNGEON) {
      window.cavernInteractives = [];
      return;
    }

    window.cavernInteractives = window.cavernInteractives || [];
    let p = window.player;
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};
    let pRadius = p.radius || 9;

    // Apply continuous debuff penalties for standard hazardous structures (Zero-allocation loop)
    let activeShardsCount = 0;
    for (let sIdx = 0; sIdx < window.cavernInteractives.length; sIdx++) {
      if (window.cavernInteractives[sIdx].type === "anomalous_shard") {
        activeShardsCount++;
      }
    }

    if (activeShardsCount > 0) {
      // 2 HP/sec drain and mild speed penalty
      if (window.logicClock % 60 === 0) {
        let drain = Math.max(1, Math.round(p.maxHp * 0.02 * activeShardsCount));
        p.hp = Math.max(1, p.hp - drain);
        window.spawnFloatingText(
          p.x,
          p.y - 15,
          `-${drain} SHARD DRAIN`,
          "#ff007f",
        );
        if (window.SoundManager) window.SoundManager.play("hit");
      }
      p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.65);
    }

    // Only execute the random spawning timer if there is an active Sigil or Contract
    let hasSigilOrContract = !!(
      window.playerStats.activeDungeonSigil ||
      window.playerStats.activeSpecialChallenge
    );
    if (hasSigilOrContract) {
      window.cavernSpawnTimer = (window.cavernSpawnTimer || 0) - 1;
      if (window.cavernSpawnTimer <= 0) {
        window.cavernSpawnTimer = window.randInt(900, 1500); // 15-25s

        let activeIds = [];
        let sig = window.playerStats.activeDungeonSigil;
        if (sig) {
          if (sig.buffs) sig.buffs.forEach((b) => activeIds.push(b.id || b));
          if (sig.debuffs)
            sig.debuffs.forEach((d) => activeIds.push(d.id || d));
        }
        let challenge = window.playerStats.activeSpecialChallenge;
        if (challenge) {
          if (challenge.buffs)
            challenge.buffs.forEach((b) => activeIds.push(b.id || b));
          if (challenge.debuffs)
            challenge.debuffs.forEach((d) => activeIds.push(d.id || d));
        }

        // De-duplicate active mutator IDs
        let uniqueActiveIds = [];
        for (let aIdx = 0; aIdx < activeIds.length; aIdx++) {
          let idVal = activeIds[aIdx];
          if (uniqueActiveIds.indexOf(idVal) === -1) {
            uniqueActiveIds.push(idVal);
          }
        }

        let targetEffects = uniqueActiveIds.filter((id) =>
          [
            "perfect_strike",
            "aetheric_conduit",
            "aetheric_spark",
            "glimmering_pixie",
            "anomalous_shards",
            "void_rupture",
          ].includes(id),
        );

        // Perform Spawning Limit: Cap active interactive structures on a single floor to a maximum of 3 (Zero-allocation loop)
        let activeStructuresCount = 0;
        let structuresList = [];
        for (let sIdx = 0; sIdx < window.cavernInteractives.length; sIdx++) {
          let itemType = window.cavernInteractives[sIdx].type;
          if (
            itemType === "anomalous_shard" ||
            itemType === "rupture_core" ||
            itemType === "rupture_orb" ||
            itemType === "glimmering_pixie" ||
            itemType === "aetheric_spark" ||
            itemType === "aetheric_conduit"
          ) {
            activeStructuresCount++;
            structuresList.push(window.cavernInteractives[sIdx]);
          }
        }

        // Clean up oldest structures if they exceed safety limits
        while (structuresList.length > 3) {
          let oldest = structuresList.shift();
          let idx = window.cavernInteractives.indexOf(oldest);
          if (idx !== -1) {
            window.cavernInteractives.splice(idx, 1);
          }
          activeStructuresCount--;
        }

        if (targetEffects.length > 0 && activeStructuresCount < 3) {
          let chosenId =
            targetEffects[Math.floor(Math.random() * targetEffects.length)];
          window.spawnCavernInteractive(chosenId);
        }
      }
    }

    for (let i = window.cavernInteractives.length - 1; i >= 0; i--) {
      let item = window.cavernInteractives[i];
      item.life--;

      if (item.type === "noxious_bloom") {
              if (window.logicClock % 45 === 0) {
                let range = (item.w ? item.w / 2 : 40); // matches dynamic bloom radius
                let applyDamage = (targetMob) => {
            let mCx = targetMob.x + (targetMob.w || 24) / 2;
            let mCy = targetMob.y + (targetMob.h || 24) / 2;
            let dist = Math.hypot(item.x - mCx, item.y - mCy);
            if (
              dist <= range &&
              targetMob.hp.gt(0) &&
              !targetMob.isFriendlyWisp
            ) {
              let tickDmg = item.tickDamage || BigNum.from(5);
              targetMob.hp = targetMob.hp.sub(tickDmg);
              targetMob.flashTimer = 5;
              targetMob.hasTakenDamage = true;

              // Apply armor/defense shred (3s duration)
              targetMob.buffTimers.def = 180;
              targetMob.buffStacks.def = -1; // negative stack shreds 15% armor

              if (window.combatVisuals) {
                window.combatVisuals.spawnDamageEffect(
                  mCx,
                  mCy,
                  tickDmg,
                  "poison",
                  false,
                  targetMob,
                );
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

      if (item.type === "acid_pool") {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist <= pRadius + 12) {
          // caustics tick rate (every 45 frames)
          if (window.logicClock % 45 === 0) {
            let tickDmg = Math.round(p.maxHp * 0.015);
            p.hp = Math.max(1, p.hp - tickDmg);
            window.spawnFloatingText(
              p.x,
              p.y - 12,
              `-${tickDmg} ACID BURN`,
              "#2ecc71",
            );
            if (window.SoundManager) window.SoundManager.play("hit");
          }
        }
      }

      if (item.type === "dilation_field") {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist <= pRadius + 35) {
          p.inDilationField = true;
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.6); // 40% slow
        }
      }

      if (item.type === "spider_web_zone") {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist <= pRadius + 75) {
          p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.4); // 60% slow
          if (
            window.logicClock % 40 === 0 &&
            typeof window.spawnFloatingText === "function"
          ) {
            window.spawnFloatingText(
              p.x,
              p.y - 12,
              "[WEB SLOWED]",
              "#2ecc71",
              true,
            );
          }
        }
      }

      if (item.life <= 0) {
        // Expiration of Void Rupture Core (Failed debuff event triggers damage)
        if (item.type === "rupture_core") {
          let collapseDmg = Math.round(p.maxHp * 0.3);
          p.hp = Math.max(1, p.hp - collapseDmg);
          window.spawnFloatingText(
            p.x,
            p.y - 15,
            `-${collapseDmg} RIFT EXPLOSION`,
            "#ef4444",
          );
          if (window.combatVisuals) {
            window.combatVisuals.triggerScreenShake(12, 18);
          }
          if (window.SoundManager) window.SoundManager.play("death");
        }

        window.cavernInteractives.splice(i, 1);
        continue;
      }

      if (
        item.type === "glimmering_pixie" ||
        item.type === "glimmering_fairy"
      ) {
        item.angleSeed += 0.05;
        let dx = Math.sin(item.angleSeed) * 1.5;
        let dy = Math.cos(item.angleSeed * 0.7) * 1.0;
        let nextX = item.x + dx;
        let nextY = item.y + dy;
        let map = getActiveDungeonMap();

        if (map && map.grid) {
          // Verify both X and Y movement axes against walls using a safe 8px physical radius
          let collideX = window.checkCollisionAt(map, nextX, item.y, 8);
          let collideY = window.checkCollisionAt(map, item.x, nextY, 8);

          if (!collideX) {
            item.x = nextX;
          } else {
            // Invert the trajectory seed to bounce away from the obstacle
            item.angleSeed += Math.PI;
          }

          if (!collideY) {
            item.y = nextY;
          } else {
            item.angleSeed += Math.PI;
          }
        } else {
          item.x = nextX;
          item.y = nextY;
        }

        if (
          item.type === "glimmering_fairy" &&
          window.logicClock % 6 === 0 &&
          window.ParticlePool
        ) {
          let pt = window.ParticlePool.get(
            item.x + window.randFloat(-4, 4),
            item.y + window.randFloat(-4, 4),
            window.randFloat(-0.3, 0.3),
            -window.randFloat(0.3, 1.0),
            window.randFloat(1.5, 3.0),
            "#ffd700",
            0.85,
            window.randInt(15, 30),
            0,
            true,
          );
          pt.style = "sparkle_star";
          window.particles.push(pt);
        }
      }

      if (item.isTriggeredByTouch) {
        let dist = Math.hypot(p.x - item.x, p.y - item.y);
        if (dist < pRadius + item.w / 2) {
          window.triggerCavernTouch(item);
          window.cavernInteractives.splice(i, 1);
          continue;
        }
      }
    }
  }

  export function spawnCavernInteractive(effectId) {
    window.cavernInteractives = window.cavernInteractives || [];
    let cam = window.DungeonCamera;
    if (!cam) return;

    let zoom = cam.zoom || 1.6;
    let viewW = cam.viewportW / zoom;
    let viewH = cam.viewportH / zoom;
    let pad = 40;

    let getOnScreenPos = () => {
      return {
        x: cam.x + pad + Math.random() * (viewW - pad * 2),
        y: cam.y + pad + Math.random() * (viewH - pad * 2),
      };
    };

    if (effectId === "anomalous_shards") {
      let count = window.randInt(2, 3);
      for (let i = 0; i < count; i++) {
        let pos = getOnScreenPos();
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "anomalous_shard",
          x: pos.x,
          y: pos.y,
          w: 20,
          h: 24,
          hp: 1,
          life: 900, // 15s
          maxLife: 900,
          flashTimer: 0,
        });
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Anomalous Shards erupted! Smash them to cleanse the penalty!",
          "#ef4444",
        );
      }
    } else if (effectId === "void_rupture") {
      let pos = getOnScreenPos();
      let coreId = window.idCounter++;

      window.cavernInteractives.push({
        id: coreId,
        type: "rupture_core",
        x: pos.x,
        y: pos.y,
        w: 32,
        h: 32,
        life: 480, // 8s
        maxLife: 480,
        orbsLeft: 3,
      });

      for (let i = 0; i < 3; i++) {
        let angle = (i * Math.PI * 2) / 3;
        let dist = 45;
        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "rupture_orb",
          coreId: coreId,
          x: pos.x + Math.cos(angle) * dist,
          y: pos.y + Math.sin(angle) * dist,
          w: 16,
          h: 16,
          hp: 1,
          life: 480,
          maxLife: 480,
          flashTimer: 0,
        });
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Void Rupture open! Smash the 3 surrounding orbs to close it!",
          "#ef4444",
        );
      }
    } else if (effectId === "glimmering_pixie") {
      let pos = getOnScreenPos();
      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "glimmering_pixie",
        x: pos.x,
        y: pos.y,
        w: 16,
        h: 16,
        isTriggeredByTouch: true,
        life: 600, // 10s
        maxLife: 600,
        angleSeed: Math.random() * 100,
      });
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Glimmering Pixie spotted! Touch her to claim a free Elixir!",
          "#34d399",
        );
      }
    } else if (effectId === "aetheric_spark") {
      let pos = getOnScreenPos();
      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "aetheric_spark",
        x: pos.x,
        y: pos.y,
        w: 16,
        h: 16,
        isTriggeredByTouch: true,
        life: 480, // 8s
        maxLife: 480,
        step: 1,
      });
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Aetheric Spark appeared! Step on it!",
          "#34d399",
        );
      }
    } else if (effectId === "aetheric_conduit") {
      let pos1 = getOnScreenPos();
      let pos2 = getOnScreenPos();
      let conduitId = window.idCounter++;

      window.cavernInteractives.push({
        id: conduitId,
        type: "aetheric_conduit",
        x: pos1.x,
        y: pos1.y,
        w: 18,
        h: 26,
        isTriggeredByTouch: true,
        life: 720, // 12s
        maxLife: 720,
        partnerX: pos2.x,
        partnerY: pos2.y,
        isMainPylon: true,
      });

      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "aetheric_conduit",
        x: pos2.x,
        y: pos2.y,
        w: 18,
        h: 26,
        isTriggeredByTouch: true,
        life: 720,
        maxLife: 720,
        partnerX: pos1.x,
        partnerY: pos1.y,
        isMainPylon: false,
        mainPylonId: conduitId,
      });

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[✦] Aetheric Conduit line active! Touch either node to discharge!",
          "#34d399",
        );
      }
    }
  }

  export function triggerCavernTouch(item) {
    let p = window.player;
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    if (window.SoundManager) window.SoundManager.play("spell");
    if (window.combatVisuals) {
      window.combatVisuals.spawnParticles(
        item.x,
        item.y,
        10,
        "gold_dungeon",
        2,
      );
    }

    if (item.type === "glimmering_pixie") {
      const options = [
        "Supernal Attack Elixir",
        "Supernal Vitality Elixir",
        "Supernal Armored Elixir",
        "Supernal Haste Elixir",
      ];
      let chosen = options[Math.floor(Math.random() * options.length)];
      let pStats = window.playerStats;
      if (pStats) {
        if (chosen.includes("Attack")) {
          pStats.atkPotionRuns = Math.max(pStats.atkPotionRuns || 0, 1);
          pStats.atkPotionStrength = 0.35;
        } else if (chosen.includes("Vitality")) {
          pStats.hpPotionRuns = Math.max(pStats.hpPotionRuns || 0, 1);
          pStats.hpPotionStrength = 0.35;
        } else if (chosen.includes("Armored")) {
          pStats.defPotionRuns = Math.max(pStats.defPotionRuns || 0, 1);
          pStats.defPotionStrength = 0.35;
        } else if (chosen.includes("Haste")) {
          pStats.hastePotionRuns = Math.max(pStats.hastePotionRuns || 0, 1);
          pStats.hastePotionStrength = 3;
        }
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `✦ Caught the Pixie! Activated: ${chosen} (Current Run Only)!`,
          "#2ecc71",
        );
      }
    } else if (item.type === "glimmering_fairy") {
      let fairyGold = Math.floor(
        120 * (1 + (window.player ? window.player.depth || 1 : 1) * 0.8),
      );
      window.spawnHomingGold(item.x, item.y, fairyGold);
      window.addDungeonRunScrap(
        "Monster Soul",
        window.randInt(2, 4),
        item.x,
        item.y,
      );

      let depth = window.player ? window.player.depth || 1 : 1;
      let itemLevel = window.getFloorItemLevel ? window.getFloorItemLevel(depth) : Math.floor(depth / 4) + 1;
      let fairyStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let fairyRarity = window.rollItemRarity({
        progressionStage: depth,
        resolvedQuality: (fairyStats.qly || 1) * 1.2,
        source: window.EQUIPMENT_RARITY_SOURCES.GLIMMERING_FAIRY,
      });
      fairyRarity = window.applyEquipmentRarityException(fairyRarity, {
        minimumRarity: 1,
        exception:
          window.EQUIPMENT_RARITY_EXCEPTIONS.AUTHORED_FAIRY_MINIMUM,
      });
      let fairyEquip = window.createItemObject(
        "weapon",
        fairyRarity,
        itemLevel,
        0,
      );
      window.spawnGroundLoot(fairyEquip, item.x, item.y);

      let fairyRank = getMasteryNodeRank(
        window.playerStats,
        "utility_fairy_sanctuary",
      );
      let elixirChance = fairyRank === 4 ? 0.35 : fairyRank === 5 ? 0.5 : 0.0;

      if (Math.random() < elixirChance) {
        const options = [
          "Supernal Attack Elixir",
          "Supernal Vitality Elixir",
          "Supernal Armored Elixir",
          "Supernal Haste Elixir",
        ];
        let chosen = options[Math.floor(Math.random() * options.length)];
        let pStats = window.playerStats;
        if (pStats) {
          if (chosen.includes("Attack")) {
            pStats.atkPotionRuns = Math.max(pStats.atkPotionRuns || 0, 1);
            pStats.atkPotionStrength = 0.35;
          } else if (chosen.includes("Vitality")) {
            pStats.hpPotionRuns = Math.max(pStats.hpPotionRuns || 0, 1);
            pStats.hpPotionStrength = 0.35;
          } else if (chosen.includes("Armored")) {
            pStats.defPotionRuns = Math.max(pStats.defPotionRuns || 0, 1);
            pStats.defPotionStrength = 0.35;
          } else if (chosen.includes("Haste")) {
            pStats.hastePotionRuns = Math.max(pStats.hastePotionRuns || 0, 1);
            pStats.hastePotionStrength = 3;
          }
        }
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `✦ Fairy Sanctuary Blessing! Activated: ${chosen}!`,
            "#ffd700",
          );
        }
      } else {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "✦ Glimmering Fairy Blessing Claimed!",
            "#34d399",
          );
        }
      }

      const luminousSoulChance = window.scaleArtifactMechanic
        ? window.scaleArtifactMechanic("fairy_wealth", 0.08)
        : window.checkArtifactTrait?.("fairy_wealth")
          ? 0.08
          : 0;
      if (luminousSoulChance > 0 && Math.random() < luminousSoulChance) {
        window.addEtcDrop("Luminous Soul", 1, true);
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "✦ Fairy Queen's Crown found 1 Luminous Soul!",
            "#ffb6c1",
          );
        }
      }

      if (window.combatVisuals) {
        window.combatVisuals.spawnBeam(item.x, "#ffd700", 60, true);
        window.combatVisuals.spawnParticles(
          item.x,
          item.y,
          25,
          "gold_dungeon",
          4,
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("fairy");
      }
    } else if (item.type === "aetheric_spark") {
      let step = item.step;
      if (step >= 5) {
        window.playerStats.astralAwakeningTimer = 900; // 15s
        window.playerStats.sparkChainCount = 0;
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "[✦] Astral Awakening triggered! +100% Damage, +15% Speed!",
            "#ffd700",
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnBeam(p.x, "#ffd700", 60, true);
        }
      } else {
        window.playerStats.sparkChainCount = step;
        let cam = window.DungeonCamera;
        let pad = 40;
        let viewW = cam.viewportW / cam.zoom;
        let viewH = cam.viewportH / cam.zoom;

        window.cavernInteractives.push({
          id: window.idCounter++,
          type: "aetheric_spark",
          x: cam.x + pad + Math.random() * (viewW - pad * 2),
          y: cam.y + pad + Math.random() * (viewH - pad * 2),
          w: 16,
          h: 16,
          isTriggeredByTouch: true,
          life: 360, // 6s
          maxLife: 360,
          step: step + 1,
        });
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `[✦] Spark Chain: ${step}/5 stepped on!`,
            "#34d399",
          );
        }
      }
    } else if (item.type === "aetheric_conduit") {
      let dmg = BigNum.from(pStats.atk || p.atk || 15).mul(2.5);
      let targetCount = 0;

      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          if (
            isPlayerTargetableMob(m) &&
            m.discovered &&
            Math.hypot(item.x - (m.x + m.w / 2), item.y - (m.y + m.h / 2)) <=
              180
          ) {
            m.hp = m.hp.sub(dmg);
            m.flashTimer = 8;
            m.hasTakenDamage = true;
            targetCount++;
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                m.x + m.w / 2,
                m.y + m.h / 2,
                dmg,
                "lightning",
                false,
              );
              window.cavernInteractives.push({
                id: window.idCounter++,
                type: "lightning_arc",
                x: item.x,
                y: item.y,
                x2: m.x + m.w / 2,
                y2: m.y + m.h / 2,
                life: 15,
              });
            }
          }
        });
      }

      window.cavernInteractives = window.cavernInteractives.filter((other) => {
        if (other.type === "aetheric_conduit" && other.id !== item.id)
          return false;
        return true;
      });

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell_lightning");
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[✦] Conduit discharged! Hit ${targetCount} targets with Chain Zap!`,
          "#ffd700",
        );
      }
    }
  }

  export function triggerCavernShatter(item) {
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("block");
    }
    if (window.combatVisuals) {
      window.combatVisuals.spawnParticles(item.x, item.y, 8, "slag_slime", 2);
    }

    if (item.type === "glimmering_fairy") {
      let time = Date.now();
      let pulse = Math.sin(time / 120) * 2;
      ctx.save();

      // Outer Aura
      let fairyGrad = ctx.createRadialGradient(
        item.x,
        item.y,
        1,
        item.x,
        item.y,
        Math.max(0.1, 14 + pulse),
      );
      fairyGrad.addColorStop(0, "#ffffff");
      fairyGrad.addColorStop(0.4, "#00ffff");
      fairyGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
      ctx.fillStyle = fairyGrad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, Math.max(0.1, 14 + pulse), 0, Math.PI * 2);
      ctx.fill();

      // Translucent Fluttering Wings
      let wingAngle = Math.sin(time / 40) * 0.4;
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 1.0;

      // Left Wing
      ctx.save();
      ctx.translate(item.x - 2, item.y - 2);
      ctx.rotate(-0.3 + wingAngle);
      ctx.beginPath();
      ctx.ellipse(-6, -2, 7, 3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Right Wing
      ctx.save();
      ctx.translate(item.x + 2, item.y - 2);
      ctx.rotate(0.3 - wingAngle);
      ctx.beginPath();
      ctx.ellipse(6, -2, 7, 3, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Glowing Core
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    if (item.type === "anomalous_shard") {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("[✦] Anomalous Shard shattered!", "#2ecc71");
      }
    } else if (item.type === "rupture_orb") {
      let core = (window.cavernInteractives || []).find(
        (c) => c.type === "rupture_core" && c.id === item.coreId,
      );
      if (core) {
        core.orbsLeft--;
        if (core.orbsLeft <= 0) {
          window.playerStats.purifiedAegisTimer = 720; // 12s
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[✦] Rupture closed! Purified Aegis active: +50% Def & Immunity!",
              "#2ecc71",
            );
          }
          window.cavernInteractives = window.cavernInteractives.filter(
            (c) => c.id !== core.id,
          );
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("spell");
          }
        } else {
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `[✦] Orb destroyed! ${core.orbsLeft} remaining.`,
              "#34d399",
            );
          }
        }
      }
    }
  }

  export function drawCavernInteractive(ctx, item) {
    if (item.type === "lightning_arc") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      let dx = item.x2 - item.x;
      let dy = item.y2 - item.y;
      let dist = Math.hypot(dx, dy);
      let steps = Math.floor(dist / 8);
      for (let s = 1; s < steps; s++) {
        let progress = s / steps;
        let jx = item.x + dx * progress + (Math.random() - 0.5) * 6;
        let jy = item.y + dy * progress + (Math.random() - 0.5) * 6;
        ctx.lineTo(jx, jy);
      }
      ctx.lineTo(item.x2, item.y2);
      ctx.stroke();
      return;
    }

    if (item.type === "acid_pool") {
      let time = Date.now();
      let pulse = Math.sin(time / 140) * 1.5;
      ctx.save();

      let fillStyle = "rgba(22, 160, 133, 0.35)";
      let strokeStyle = "rgba(46, 204, 113, 0.65)";
      let bubbleColor = "#a3fd83";

      // Render as orange lava/slag if spawned by Marcus
      if (item.isSlag || item.color === "#f97316") {
        fillStyle = "rgba(139, 30, 0, 0.4)";
        strokeStyle = "rgba(249, 115, 22, 0.85)";
        bubbleColor = "#fef08a";
      }

      ctx.fillStyle = fillStyle;
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        14 + pulse,
        6 + pulse * 0.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Caustic tiny bubbles popping
      ctx.fillStyle = bubbleColor;
      for (let i = 0; i < 3; i++) {
        let bubbleProgress = (time / (400 + i * 100) + i * 2) % 1.0;
        let bx =
          item.x + Math.sin(i * 12 + time / 500) * (10 * (1 - bubbleProgress));
        let by =
          item.y + Math.cos(i * 8 + time / 500) * (4 * (1 - bubbleProgress));
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 * (1.0 - bubbleProgress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (item.type === "noxious_bloom") {
          let time = Date.now();
          let pulse = Math.sin(time / 120) * 3;
          let alpha = item.life / item.maxLife;
          let radiusX = item.w ? item.w / 2 : 40;
          let radiusY = item.h ? item.h / 2 : 18;
          ctx.save();

          // 1. Swirling radial green toxic gradient mist (Scales with dynamic bloom dimensions)
          let grad = ctx.createRadialGradient(
            item.x,
            item.y,
            2,
            item.x,
            item.y,
            Math.max(0.1, radiusX + pulse),
          );
          grad.addColorStop(0, "rgba(46, 204, 113, 0.25)");
          grad.addColorStop(0.6, "rgba(39, 174, 96, 0.1)");
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(
            item.x,
            item.y,
            Math.max(0.1, radiusX + pulse),
            Math.max(0.1, radiusY + pulse * 0.4),
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // 2. Dashed outer warning ring (Scales with dynamic bloom dimensions)
          ctx.strokeStyle = `rgba(39, 174, 96, ${alpha * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.ellipse(item.x, item.y, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

      // 3. Floating poison bubbles that drift and lift upwards
      ctx.fillStyle = "rgba(163, 253, 131, 0.6)";
      for (let i = 0; i < 4; i++) {
        let progress = (time / (400 + i * 150) + i * 0.25) % 1.0;
        let bx =
          item.x + Math.sin(i * 20 + time / 400) * (30 * (1.0 - progress));
        let by =
          item.y +
          Math.cos(i * 15 + time / 400) * (12 * (1.0 - progress)) -
          progress * 15;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(0.1, 3.2 * (1.0 - progress)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (item.type === "acid_pool") {
      let time = Date.now();
      let pulse = Math.sin(time / 140) * 1.5;
      ctx.save();
      // Caustic flat green pool
      ctx.fillStyle = "rgba(22, 160, 133, 0.35)";
      ctx.strokeStyle = "rgba(46, 204, 113, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        14 + pulse,
        6 + pulse * 0.5,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Caustic tiny bubbles popping
      ctx.fillStyle = "#a3fd83";
      for (let i = 0; i < 3; i++) {
        let bubbleProgress = (time / (400 + i * 100) + i * 2) % 1.0;
        let bx =
          item.x + Math.sin(i * 12 + time / 500) * (10 * (1 - bubbleProgress));
        let by =
          item.y + Math.cos(i * 8 + time / 500) * (4 * (1 - bubbleProgress));
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 * (1.0 - bubbleProgress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (item.type === "dilation_field") {
      let time = Date.now();
      let pulse = Math.sin(time / 150) * 1.5;
      ctx.save();
      // Golden clockwork distortion zone
      ctx.fillStyle = "rgba(241, 196, 15, 0.12)";
      ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        item.x,
        item.y,
        40 + pulse,
        18 + pulse * 0.4,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();

      // Draw ticking clock hands inside the zone
      ctx.translate(item.x, item.y);
      ctx.rotate(time / 800);
      ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (item.type === "spider_web_zone") {
      let time = Date.now();
      let alpha = item.life / item.maxLife;
      ctx.save();

      // Draw faint backing drop shadow
      ctx.fillStyle = `rgba(39, 174, 96, ${alpha * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(item.x, item.y, 75, 33.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Concentric web rings
      ctx.strokeStyle = `rgba(0, 255, 204, ${alpha * 0.45})`;
      ctx.lineWidth = 1.4;
      let rings = 4;
      for (let r = 1; r <= rings; r++) {
        let rScale = r / rings;
        ctx.beginPath();
        ctx.ellipse(
          item.x,
          item.y,
          75 * rScale,
          33.75 * rScale,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // Radial web support spokes
      let spokes = 8;
      ctx.beginPath();
      for (let s = 0; s < spokes; s++) {
        let angle = (s * Math.PI * 2) / spokes;
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(
          item.x + Math.cos(angle) * 75,
          item.y + Math.sin(angle) * 33.75,
        );
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    let pulse = Math.sin(Date.now() / 150) * 1.5;

    if (item.type === "anomalous_shard") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 10, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      let grad = ctx.createLinearGradient(
        item.x - 6,
        item.y - 12,
        item.x + 6,
        item.y + 12,
      );
      grad.addColorStop(0, "#ff7675");
      grad.addColorStop(1, "#d63031");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 12);
      ctx.lineTo(item.x + 5, item.y + 8);
      ctx.lineTo(item.x - 5, item.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "rupture_core") {
      let grad = ctx.createRadialGradient(
        item.x,
        item.y,
        2,
        item.x,
        item.y,
        14 + pulse,
      );
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#e84393");
      grad.addColorStop(0.7, "#8e44ad");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 14 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#09021a";
      ctx.strokeStyle = "#ff007f";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6 + Math.abs(pulse) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "rupture_orb") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8e44ad";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(
        item.x,
        item.y,
        4.5 + Math.sin(Date.now() / 100) * 0.8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "glimmering_pixie") {
      let pixieGrad = ctx.createRadialGradient(
        item.x,
        item.y,
        1,
        item.x,
        item.y,
        11 + pulse,
      );
      pixieGrad.addColorStop(0, "#ffffff");
      pixieGrad.addColorStop(0.5, "#ff9ff3");
      pixieGrad.addColorStop(1, "rgba(243, 104, 224, 0)");
      ctx.fillStyle = pixieGrad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 11 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f368e0";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "aetheric_spark") {
      let sparkGrad = ctx.createRadialGradient(
        item.x,
        item.y,
        1,
        item.x,
        item.y,
        10 + pulse,
      );
      sparkGrad.addColorStop(0, "#ffffff");
      sparkGrad.addColorStop(0.4, "#00d2ff");
      sparkGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
      ctx.fillStyle = sparkGrad;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 10 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00d2ff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "aetheric_conduit") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 11, 7, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      let nodeGrad = ctx.createLinearGradient(
        item.x - 5,
        item.y - 12,
        item.x + 5,
        item.y + 12,
      );
      nodeGrad.addColorStop(0, "#00ffff");
      nodeGrad.addColorStop(0.5, "#008b8b");
      nodeGrad.addColorStop(1, "#042c2c");
      ctx.fillStyle = nodeGrad;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 12);
      ctx.lineTo(item.x + 4, item.y + 10);
      ctx.lineTo(item.x - 4, item.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (item.isMainPylon) {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(item.x, item.y);
        ctx.lineTo(item.partnerX, item.partnerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

