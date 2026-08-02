/* ==========================================================================
   PRIMARY PURPOSE: Special Challenges, Bounty Boards, and Cavern Mutators.
   Extends ItemFactory for Calamity Sigils and handles Contract Signing.
   ========================================================================= */

(function () {
  // --- SUBPHASE 14: CONTRACT DATABASE (NO EMOJIS) ---
  window.SPECIAL_CHALLENGES_DATABASE = {
    "twin_wardens": {
      id: "twin_wardens",
      name: "The Twin Wardens",
      desc: "Descend into the heart of the anomaly. Floor 4 houses both Gilded Vault Keeper and Chronos Arbitrator simultaneously! Slay both to claim victory.",
      riskRating: 65,
      rewardMultiplier: 1.8,
      qualityBoost: 0.35,
      buffs: ["giant_might", "iron_aegis"],
      debuffs: ["creeping_miasma", "kinetic_reflectors"],
      rewards: {
        gold: { m: 1.0, e: 9 }, // 1 Billion Gold
        xp: { m: 1.5, e: 6 },   // 150,000 XP
        shards: 15,
        cores: 3
      }
    },
    "miasma_famine": {
      id: "miasma_famine",
      name: "Miasma Famine",
      desc: "The safe zone of the room collapses violently. With healing flask charges permanently set to 0, you must rely entirely on siphoning orbs.",
      riskRating: 80,
      rewardMultiplier: 2.2,
      qualityBoost: 0.5,
      buffs: ["swift_strikes", "unstable_surge"],
      debuffs: ["creeping_miasma", "spreading_fatigue"],
      rewards: {
        gold: { m: 2.5, e: 9 }, // 2.5 Billion Gold
        xp: { m: 3.0, e: 6 },   // 300,000 XP
        shards: 25,
        cores: 5
      }
    },
    "chrono_anomaly": {
      id: "chrono_anomaly",
      name: "The Chrono-Glitch Anomaly",
      desc: "Time behaves erratically. Your primary weapon is locked, slides on slick ice are persistent, and enemies split on death.",
      riskRating: 95,
      rewardMultiplier: 3.0,
      qualityBoost: 0.75,
      buffs: ["aetheric_surge", "shatter_frenzy"],
      debuffs: ["weapon_lock", "slick_ice", "spawning_division"],
      rewards: {
        gold: { m: 5.0, e: 9 }, // 5 Billion Gold
        xp: { m: 5.0, e: 6 },   // 500,000 XP
        shards: 40,
        cores: 8
      }
    }
  };

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
      buffs: (challenge.buffs || []).map(bId => {
        let b = (window.CAVERN_BUFFS || []).find(x => x.id === bId);
        return b ? JSON.parse(JSON.stringify(b)) : { id: bId, name: bId, desc: bId, type: "stat" };
      }),
      debuffs: (challenge.debuffs || []).map(dId => {
        let d = (window.CAVERN_DEBUFFS || []).find(x => x.id === dId);
        return d ? JSON.parse(JSON.stringify(d)) : { id: dId, name: dId, desc: dId, type: "stat" };
      }),
      isCalamitySigil: true,
      locked: true // Protected automatically
    };

    sigil.buffs.forEach(b => {
      if (b.type === "stat" && b.value === undefined) b.value = 0.5;
      if (window.formatSigilStatDesc && b.type === "stat") b.desc = window.formatSigilStatDesc(b.statKey, b.value, true);
    });
    sigil.debuffs.forEach(d => {
      if (d.type === "stat" && d.value === undefined) d.value = -0.5;
      if (window.formatSigilStatDesc && d.type === "stat") d.desc = window.formatSigilStatDesc(d.statKey, d.value, false);
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
        window.pushHeaderToast(`[CONTRACT SIGNED] Active Challenge: ${challenge.name}!`, "#e74c3c");
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
      window.pushHeaderToast(`[CONTRACT CANCELLED] Abandoned ${name}.`, "#7f8c8d");
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

    init() {
      this.reset();
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
            window.spawnFloatingText(p.x, p.y - 25, "MIASMA TOXIN -" + damageVal, "#ff007f", true);
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(p.x, p.y - 8, 8, "swamp_basilisk", 1.5);
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
          true
        );
        pt.style = "glowing_orb";
        pt.scaleDecay = 0.015;
        window.particles.push(pt);
      }
    }

    // --- SUBPHASE 16 (Part B): TWIN OVERLORD ARENA GENERATION ---
    spawnTwinBosses(map) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);

      // Spawn Boss 1 (Gilded Vault Keeper) on Left side
      window.spawnBossEncounter(cx - 3, cy, "major");
      let boss1 = window.mob;
      boss1.id = window.idCounter++;
      boss1.x = (cx - 3) * map.tileSize - 16;
      boss1.y = cy * map.tileSize - 16;
      boss1.visualType = "gilded_vault_keeper";
      boss1.name = "Gilded Vault Keeper";

      window.activeDungeonMobs = window.activeDungeonMobs || [];
      window.activeDungeonMobs.push(boss1);

      // Spawn Boss 2 (Chronos Arbitrator) on Right side
      window.spawnBossEncounter(cx + 3, cy, "major");
      let boss2 = window.mob;
      boss2.id = window.idCounter++;
      boss2.x = (cx + 3) * map.tileSize - 16;
      boss2.y = cy * map.tileSize - 16;
      boss2.visualType = "chronos_arbitrator";
      boss2.name = "Chronos Arbitrator";

      window.activeDungeonMobs.push(boss2);
      window.mob = boss2; // Primary anchor hook for rendering
    }

    render(ctx, map) {
      if (window.currentGameState !== window.GAME_STATES.DUNGEON) return;
      this.renderMiasma(ctx, map);
    }

    renderMiasma(ctx, map) {
      if (!window.isCavernEffectActive("creeping_miasma") || this.safeZoneRadius >= 5000) return;

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

      let grad = ctx.createRadialGradient(cx, cy, this.safeZoneRadius, cx, cy, maxRadius);
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