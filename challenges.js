/* ==========================================================================
   PRIMARY PURPOSE: Special Challenges, Bounty Boards, and Cavern Mutators.
   Extends ItemFactory for Calamity Sigils and handles Contract Signing.
   ========================================================================= */

(function () {
  // --- SUBPHASE 11: LOCAL MUTATOR EXCLUSION MATRIX ---
  const DEBUFF_EXCLUSIONS = {
    slick_ice: ["magnetic_creep"],
    magnetic_creep: ["slick_ice"],
    creeping_miasma: ["heavy_mist"],
    heavy_mist: ["creeping_miasma"],
    abyssal_decay: ["frail_vessel"],
    frail_vessel: ["abyssal_decay"],
    weapon_lock: ["kinetic_reflectors"],
    kinetic_reflectors: ["weapon_lock"],
  };

  // --- PROCEDURAL SPECIAL CHALLENGE GENERATOR ---
  window.SPECIAL_CHALLENGES_DATABASE = {};

  // --- SUBPHASE 12: CALAMITY SIGIL PROJECTION GENERATOR ---
  window.ItemFactory = window.ItemFactory || {};
  window.ItemFactory.createCalamitySigil = function (challengeId) {
    let challenge = window.SPECIAL_CHALLENGES_DATABASE[challengeId];
    if (!challenge) return null;

    let sigil = {
      id: window.idCounter++,
      name: challenge.name + " Sigil",
      type: "sigil",
      statsRolled: 5, // Mythic Tier
      stageLevel: 80,
      rewardMultiplier: challenge.rewardMultiplier,
      qualityBoost: challenge.qualityBoost,
      buffs: (challenge.buffs || []).map((bId) => {
        let b = (window.CAVERN_BUFFS || []).find((x) => x.id === bId);
        return b
          ? JSON.parse(JSON.stringify(b))
          : { id: bId, name: bId, desc: bId, type: "stat" };
      }),
      debuffs: (challenge.debuffs || []).map((dId) => {
        let d = (window.CAVERN_DEBUFFS || []).find((x) => x.id === dId);
        return d
          ? JSON.parse(JSON.stringify(d))
          : { id: dId, name: dId, desc: dId, type: "stat" };
      }),
      isCalamitySigil: true,
      locked: true, // Protected automatically
    };

    sigil.buffs.forEach((b) => {
      if (b.type === "stat" && b.value === undefined) b.value = 0.5;
      if (window.formatSigilStatDesc && b.type === "stat")
        b.desc = window.formatSigilStatDesc(b.statKey, b.value, true);
    });
    sigil.debuffs.forEach((d) => {
      if (d.type === "stat" && d.value === undefined) d.value = -0.5;
      if (window.formatSigilStatDesc && d.type === "stat")
        d.desc = window.formatSigilStatDesc(d.statKey, d.value, false);
    });

    return sigil;
  };

  // --- SUBPHASE 14: CONTRACT SIGNING SYSTEM ---
  window.signSpecialChallengeContract = function (challengeId) {
    let challenge = window.SPECIAL_CHALLENGES_DATABASE[challengeId];
    if (!challenge) return;

    window.playerStats.activeSpecialChallenge = challenge;

    // Automatically generate and slot Calamity Sigil into expedition slot
    let sigil = window.ItemFactory.createCalamitySigil(challengeId);
    window.playerStats.activeDungeonSigil = sigil;

    // Clear standard dungeon selections to avoid state collisions
    if (window.state) {
      window.state.selectedDeploymentSigilId = null;
      window.state.deploymentFloor = 1;
    }

    // Ensure coins are bigNum
    window.playerStats.coins = BigNum.from(window.playerStats.coins || 0);

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `[CONTRACT SIGNED] Active Challenge: ${challenge.name}!`,
        "#e74c3c",
      );
    }

    // Automatically dismiss Bounty Board modal on success
    let bModal = document.getElementById("bounty-modal");
    if (bModal) bModal.style.display = "none";

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  window.abandonSpecialChallenge = function () {
    if (!window.playerStats.activeSpecialChallenge) return;
    let name = window.playerStats.activeSpecialChallenge.name;
    window.playerStats.activeSpecialChallenge = null;
    window.playerStats.activeDungeonSigil = null;

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `[CONTRACT CANCELLED] Abandoned ${name}.`,
        "#7f8c8d",
      );
    }
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  };

  class SpecialChallengeEngine {
    constructor() {
      this.reset();
    }

    reset() {
      this.activeChallenge = null;
      this.safeZoneRadius = 10000;
      this.elapsedFrames = 0;
      this.fatigueLevel = 0.0;
    }

    generateRandomChallenges() {
      const BOSS_POOL = [
        {
          name: "Arachnid Treant",
          visualType: "arachnid_treant",
          tier: 0,
          biome: "Whispering Woods",
        },
        {
          name: "Aegis Goliath",
          visualType: "aegis_goliath",
          tier: 1,
          biome: "Mountain Peaks",
        },
        {
          name: "Brimstone Colossus",
          visualType: "overlord_iron_vault",
          tier: 2,
          biome: "Inferno Depths",
        },
        {
          name: "Corrosive Abomination",
          visualType: "corrosive_abomination",
          tier: 3,
          biome: "Fungal Swamp",
        },
        {
          name: "Void Overseer",
          visualType: "void_overseer",
          tier: 4,
          biome: "Void Singularity",
        },
        {
          name: "Chronos Arbitrator",
          visualType: "chronos_arbitrator",
          tier: 5,
          biome: "Temporal Sanctorum",
        },
        {
          name: "Nexus Overseer",
          visualType: "nexus_overseer",
          tier: 6,
          biome: "Cyberspace Nexus",
        },
        {
          name: "Gilded Vault Keeper",
          visualType: "gilded_vault_keeper",
          tier: 2,
          biome: "Midas Treasury",
        },
      ];

      const CONTRACT_TEMPLATES = [
        {
          id: "solo_hunt",
          name: "Warden Execution Contract",
          isDual: false,
          descTemplate:
            "A high-priority target has been spotted. Venture into the [BIOME] and execute [BOSS1] before the anomaly destabilizes.",
          baseRisk: 25,
          buffsCount: 1,
          debuffsCount: 1,
        },
        {
          id: "twin_hunt",
          name: "Dual Overlord Purge",
          isDual: true,
          descTemplate:
            "Slay both [BOSS1] and [BOSS2] who have converged in the [BIOME]. Exercise absolute caution, the risk of total loss is severe.",
          baseRisk: 50,
          buffsCount: 2,
          debuffsCount: 2,
        },
        {
          id: "unstable_anomaly",
          name: "Calamity Rift Containment",
          isDual: true,
          descTemplate:
            "Rifts have torn the [BIOME] apart. You must contain [BOSS1] and [BOSS2] under extreme hazardous conditions.",
          baseRisk: 70,
          buffsCount: 2,
          debuffsCount: 3,
        },
      ];

      let generated = {};

      CONTRACT_TEMPLATES.forEach((template) => {
        let primaryBoss =
          BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
        let secondaryBoss = null;
        if (template.isDual) {
          let eligibleSecondaries = BOSS_POOL.filter(
            (b) => b.name !== primaryBoss.name,
          );
          secondaryBoss =
            eligibleSecondaries[
              Math.floor(Math.random() * eligibleSecondaries.length)
            ];
        }

        let activeBuffs = [];
        let activeDebuffs = [];

        let eligibleBuffs = [...(window.CAVERN_BUFFS || [])];
        let eligibleDebuffs = [...(window.CAVERN_DEBUFFS || [])];

        for (
          let i = 0;
          i < template.buffsCount && eligibleBuffs.length > 0;
          i++
        ) {
          let randIdx = Math.floor(Math.random() * eligibleBuffs.length);
          activeBuffs.push(eligibleBuffs.splice(randIdx, 1)[0].id);
        }

        let excludedDebuffs = [];
        for (
          let i = 0;
          i < template.debuffsCount && eligibleDebuffs.length > 0;
          i++
        ) {
          let filteredDebuffs = eligibleDebuffs.filter(
            (d) => !excludedDebuffs.includes(d.id),
          );
          if (filteredDebuffs.length === 0) break;

          let randIdx = Math.floor(Math.random() * filteredDebuffs.length);
          let chosenDebuff = filteredDebuffs[randIdx];
          activeDebuffs.push(chosenDebuff.id);

          let exclusions = DEBUFF_EXCLUSIONS[chosenDebuff.id];
          if (exclusions) {
            excludedDebuffs.push(...exclusions);
          }
          eligibleDebuffs = eligibleDebuffs.filter(
            (d) => d.id !== chosenDebuff.id,
          );
        }

        let dangerSum = activeDebuffs.reduce((sum, dId) => {
          let d = (window.CAVERN_DEBUFFS || []).find((x) => x.id === dId);
          return sum + (d ? d.dangerRating || 0 : 0);
        }, 0);

        let riskRating = template.baseRisk + dangerSum;
        let rewardMult = 1.0 + riskRating * 0.02;
        let qualityBoost = parseFloat((riskRating * 0.008).toFixed(2));

        let desc = template.descTemplate
          .replace("[BIOME]", primaryBoss.biome)
          .replace("[BOSS1]", primaryBoss.name);
        if (template.isDual && secondaryBoss) {
          desc = desc.replace("[BOSS2]", secondaryBoss.name);
        }

        let peakStage =
          window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
        let goldBase = BigNum.from(250000)
          .mul(BigNum.from(1.08).pow(peakStage))
          .mul(riskRating / 30);
        let xpBase = BigNum.from(2000)
          .mul(BigNum.from(1.05).pow(peakStage))
          .mul(riskRating / 30);

        let shards = Math.max(5, Math.floor(riskRating / 4));
        let cores = Math.max(1, Math.floor(riskRating / 15));

        let challengeId = `procedural_${template.id}`;

        generated[challengeId] = {
          id: challengeId,
          name: template.name,
          desc: desc,
          riskRating: riskRating,
          rewardMultiplier: parseFloat(rewardMult.toFixed(2)),
          qualityBoost: qualityBoost,
          buffs: activeBuffs,
          debuffs: activeDebuffs,
          rewards: {
            gold: { m: goldBase.m, e: goldBase.e },
            xp: { m: xpBase.m, e: xpBase.e },
            shards: shards,
            cores: cores,
          },
          primaryTarget: {
            name: primaryBoss.name,
            visualType: primaryBoss.visualType,
            tier: primaryBoss.tier,
          },
          secondaryTarget: secondaryBoss
            ? {
                name: secondaryBoss.name,
                visualType: secondaryBoss.visualType,
                tier: secondaryBoss.tier,
              }
            : null,
        };
      });

      window.playerStats.proceduralChallenges = generated;
      window.SPECIAL_CHALLENGES_DATABASE = generated;
    }

    init() {
      this.reset();
      if (!window.playerStats) {
        window.playerStats = window.playerStats || {};
      }
      if (
        !window.playerStats.proceduralChallenges ||
        Object.keys(window.playerStats.proceduralChallenges).length === 0
      ) {
        this.generateRandomChallenges();
      } else {
        window.SPECIAL_CHALLENGES_DATABASE =
          window.playerStats.proceduralChallenges;
      }
      if (window.playerStats && window.playerStats.activeSpecialChallenge) {
        this.activeChallenge = window.playerStats.activeSpecialChallenge;
      }
    }

    update(map, p) {
      if (window.currentGameState !== window.GAME_STATES.DUNGEON) {
        this.reset();
        return;
      }
      this.updateMiasma(map, p);
    }

    updateMiasma(map, p) {
      if (!window.isCavernEffectActive("creeping_miasma")) {
        this.safeZoneRadius = 10000;
        return;
      }

      let cx = (map.width * map.tileSize) / 2;
      let cy = (map.height * map.tileSize) / 2;
      let maxRadius = Math.hypot(cx, cy);
      let minRadius = 110;

      this.elapsedFrames++;

      let shrinkDuration = 7200;
      let ratio = Math.min(1.0, this.elapsedFrames / shrinkDuration);
      this.safeZoneRadius = maxRadius - (maxRadius - minRadius) * ratio;

      let pDist = Math.hypot(p.x - cx, p.y - cy);
      if (pDist > this.safeZoneRadius) {
        p.speedMultiplier = Math.min(p.speedMultiplier || 1.0, 0.7);

        if (this.elapsedFrames % 60 === 0) {
          let damageVal = Math.round(p.maxHp * 0.02);
          window.damagePlayer(damageVal, null);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              p.x,
              p.y - 25,
              "MIASMA TOXIN -" + damageVal,
              "#ff007f",
              true,
            );
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(
              p.x,
              p.y - 8,
              8,
              "swamp_basilisk",
              1.5,
            );
          }
        }
      }

      let eco = window.playerStats && window.playerStats.ecoMode;
      let rate = eco ? 0.15 : 0.45;
      if (Math.random() < rate && window.ParticlePool && window.particles) {
        let angle = Math.random() * Math.PI * 2;
        let edgeX = cx + Math.cos(angle) * this.safeZoneRadius;
        let edgeY = cy + Math.sin(angle) * this.safeZoneRadius;

        let speed = window.randFloat(0.3, 0.8);
        let vx = -Math.sin(angle) * speed + window.randFloat(-0.15, 0.15);
        let vy = Math.cos(angle) * speed - window.randFloat(0.1, 0.3);

        let pt = window.ParticlePool.get(
          edgeX,
          edgeY,
          vx,
          vy,
          window.randFloat(2.5, 4.2),
          Math.random() < 0.5 ? "#a855f7" : "#e879f9",
          0.8,
          window.randInt(40, 70),
          0,
          true,
        );
        pt.style = "glowing_orb";
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }

    // --- SUBPHASE 16 (Part B): PROCEDURAL OVERLORD ARENA GENERATION ---
    spawnTwinBosses(map) {
      let challenge = window.playerStats.activeSpecialChallenge;
      if (!challenge || !challenge.primaryTarget) return;

      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);

      let pTar = challenge.primaryTarget;
      let sTar = challenge.secondaryTarget;

      // Spawn Boss 1 (Primary Target) on Left side
      window.spawnBossEncounter(cx - 3, cy, "major");
      let boss1 = window.mob;
      boss1.id = window.idCounter++;
      boss1.x = (cx - 3) * map.tileSize - 16;
      boss1.y = cy * map.tileSize - 16;
      boss1.visualType = pTar.visualType;
      boss1.name = pTar.name;
      boss1.visualTier = pTar.tier;

      window.activeDungeonMobs = window.activeDungeonMobs || [];
      window.activeDungeonMobs.push(boss1);

      if (sTar) {
        // Spawn Boss 2 (Secondary Target) on Right side
        window.spawnBossEncounter(cx + 3, cy, "major");
        let boss2 = window.mob;
        boss2.id = window.idCounter++;
        boss2.x = (cx + 3) * map.tileSize - 16;
        boss2.y = cy * map.tileSize - 16;
        boss2.visualType = sTar.visualType;
        boss2.name = sTar.name;
        boss2.visualTier = sTar.tier;

        window.activeDungeonMobs.push(boss2);
        window.mob = boss2; // Primary anchor hook for rendering
      } else {
        window.mob = boss1;
      }
    }

    render(ctx, map) {
      if (window.currentGameState !== window.GAME_STATES.DUNGEON) return;
      this.renderMiasma(ctx, map);
    }

    renderMiasma(ctx, map) {
      if (
        !window.isCavernEffectActive("creeping_miasma") ||
        this.safeZoneRadius >= 5000
      )
        return;

      let cx = (map.width * map.tileSize) / 2;
      let cy = (map.height * map.tileSize) / 2;
      let maxRadius = Math.hypot(cx, cy);

      ctx.save();
      let pulse = Math.sin(Date.now() / 150) * 2.5;
      ctx.strokeStyle = "rgba(168, 85, 247, 0.75)";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, this.safeZoneRadius + pulse), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      let grad = ctx.createRadialGradient(
        cx,
        cy,
        this.safeZoneRadius,
        cx,
        cy,
        maxRadius,
      );
      grad.addColorStop(0, "rgba(59, 7, 100, 0)");
      grad.addColorStop(0.35, "rgba(59, 7, 100, 0.28)");
      grad.addColorStop(1, "rgba(10, 5, 26, 0.94)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.rect(0, 0, map.width * map.tileSize, map.height * map.tileSize);
      ctx.fill();
      ctx.restore();
    }
  }

  window.ChallengeEngine = new SpecialChallengeEngine();
  window.ChallengeEngine.init();
})();
