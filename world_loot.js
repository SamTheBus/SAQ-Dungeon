import { applyArcaneShieldRecharge } from "./combat_effect_authority.js?v=1.002";

  export function spawnGroundLoot(item, x, y) {
    if (!item) return;
    if (!window.groundLoot) window.groundLoot = [];

    let angle = Math.random() * Math.PI * 2;
    let speed = window.randFloat(1.2, 3.2);
    let color = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#ffffff";

    window.groundLoot.push({
      id: item.id || window.idCounter++,
      item: item,
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      z: 0,
      vz: -3.8,
      color: color,
      magnetSpeed: 1.0,
      settled: false,
    });
  }

  export function updateGroundLoot() {
    if (!window.groundLoot || window.groundLoot.length === 0) return;
    let p = window.player;
    if (!p) return;

    for (let i = window.groundLoot.length - 1; i >= 0; i--) {
      let gl = window.groundLoot[i];

      // Physical Pop Animation Arc
      if (!gl.settled) {
        gl.x += gl.vx;
        gl.y += gl.vy;
        gl.vx *= 0.88;
        gl.vy *= 0.88;

        gl.z += gl.vz;
        gl.vz += 0.45; // Gravity acceleration

        if (gl.z >= 0) {
          gl.z = 0;
          gl.vz = 0;
          gl.vx = 0;
          gl.vy = 0;
          gl.settled = true;
        }
      }

      // Pickup Magnetism & Collection
      if (gl.settled || gl.z === 0) {
        let dx = p.x - gl.x;
        let dy = p.y - 8 - gl.y;
        let dist = Math.hypot(dx, dy);

        if (dist <= 38) {
          gl.magnetSpeed = Math.min(14, gl.magnetSpeed + 0.85);
          gl.x += (dx / dist) * gl.magnetSpeed;
          gl.y += (dy / dist) * gl.magnetSpeed;

          if (dist <= 12) {
            if (gl.item.type === "card") {
              let cKey = gl.item.cardKey;
              // Add directly to persistent Bestiary collection (handles max limit auto-salvage)
              window.addMonsterCard(cKey, 1);

              if (
                window.SoundManager &&
                typeof window.SoundManager.playCardPickup === "function"
              ) {
                window.SoundManager.playCardPickup();
              }

              let cardData = window.MONSTER_CARDS_DATA[cKey];
              let setColors = {
                "Whispering Woods": "#2ecc71",
                "Mountain Peaks": "#3498db",
                "Inferno Depths": "#e74c3c",
                "Fungal Swamp": "#1abc9c",
                "Void Singularity": "#9b59b6",
                "Temporal Sanctorum": "#e879f9",
                "Cyberspace Nexus": "#00ffff",
                "Cosmic Wardens": "#f1c40f",
              };
              let setCol = setColors[cardData.set] || "#ffd700";
              if (typeof window.pushHeaderToast === "function") {
                window.pushHeaderToast(
                  `✦ CARD FOUND: ${gl.item.name} [${cardData.set}]`,
                  setCol,
                );
              }
              if (typeof window.pushLog === "function") {
                window.pushLog(
                  `<span style="color:${setCol}; font-weight:bold;">[BESTIARY]</span> Collected <span style="color:#ffffff;">${gl.item.name}</span>! Added to [${cardData.set} Set] album.`,
                );
              }
            } else {
              let isEquipped = window.tryAutoEquip
                ? window.tryAutoEquip(gl.item)
                : false;
              if (!isEquipped) {
                let now = Date.now();
                let shouldNotify =
                  !gl.satchelFullNoticeAt || now - gl.satchelFullNoticeAt >= 2500;
                let wasAdded =
                  typeof window.addToRunSatchel === "function"
                    ? window.addToRunSatchel(gl.item, {
                        notify: shouldNotify,
                        message: `Carried Satchel Full (${(p.bag || []).length}/${window.getMaxBagSlots()} Items). ${gl.item.name} remains on the ground.`,
                      })
                    : false;
                if (!wasAdded) {
                  if (shouldNotify) gl.satchelFullNoticeAt = now;
                  gl.magnetSpeed = 0;
                  continue;
                }
              }

              if (
                window.SoundManager &&
                typeof window.SoundManager.playLootDrop === "function"
              ) {
                window.SoundManager.playLootDrop(gl.item.statsRolled);
              }
              if (typeof window.pushToast === "function") {
                window.pushToast(gl.item);
              }
            }
            if (typeof window.updateHUD === "function") {
              window.updateHUD();
            }

            window.groundLoot.splice(i, 1);
          }
        }
      }
    }
  }

  export function rechargePlayerArcaneShield(amount, overflowToHpRate = 0.5) {
      let p = window.player;
      if (!p || p.hp <= 0) return;

      let pStats = typeof window.resolvePlayerStats === "function" ? window.resolvePlayerStats() : {};
      let maxShield = pStats.arcaneShieldMax || p.arcaneShieldMax || 0;
      return applyArcaneShieldRecharge(p, maxShield, amount, overflowToHpRate);
    }

    export function addGoldFloatingText(p, amount) {
    let existing = window.floatingTexts.find(
      (ft) => ft.isGoldBatch && ft.life > 0,
    );
    if (existing) {
      existing.goldTotal = BigNum.from(existing.goldTotal || 0).add(amount);
      existing.text = `+${window.formatNumber(existing.goldTotal)} Gold`;
      existing.life = 55;
    } else {
      let bAmt = BigNum.from(amount);
      window.floatingTexts.push({
        x: p.x,
        y: p.y - 15,
        offsetX: 0,
        offsetY: -15,
        goldTotal: bAmt,
        text: `+${window.formatNumber(bAmt)} Gold`,
        color: "#ffd700",
        life: 55,
        maxLife: 55,
        followPlayer: true,
        isGoldBatch: true,
      });
    }
  }

  export function triggerGravitationalVacuum(p) {
    if (!p) return;
    if (window.groundLoot) {
      window.groundLoot.forEach((gl) => {
        gl.settled = true;
        gl.magnetSpeed = Math.max(gl.magnetSpeed || 1.0, 10.0);
      });
    }
    if (window.groundMaterials) {
      window.groundMaterials.forEach((gm) => {
        gm.settled = true;
        gm.magnetSpeed = Math.max(gm.magnetSpeed || 1.0, 10.0);
      });
    }
    if (window.goldParticles) {
      window.goldParticles.forEach((gp) => {
        gp.scatterTimer = 0;
        gp.speed = Math.max(gp.speed || 5.0, 12.0);
      });
    }
  }

  export function spawnHomingGold(x, y, amount) {
    if (window.goldParticles.length > 40) return;
    let particleCount = window.randInt(4, 7);
    let totalAmt = BigNum.from(amount);
    let share = totalAmt.div(particleCount);

    for (let i = 0; i < particleCount; i++) {
      window.goldParticles.push({
        x: x,
        y: y,
        vx: window.randFloat(-3.5, 3.5),
        vy: window.randFloat(-6, -3),
        value: share,
        scatterTimer: window.randInt(14, 20),
        gravity: 0.35,
        speed: 5.0,
      });
    }
  }

  export function updateGoldParticles() {
    let p = window.player;
    if (!window.goldParticles) return;

    for (let i = window.goldParticles.length - 1; i >= 0; i--) {
      let gp = window.goldParticles[i];
      if (gp.scatterTimer > 0) {
        gp.scatterTimer--;
        gp.x += gp.vx;
        gp.y += gp.vy;
        gp.vy += gp.gravity || 0.35;
        gp.vx *= 0.92;
      } else {
        let targetX = p.x;
        let targetY = p.y - 8;
        let dx = targetX - gp.x;
        let dy = targetY - gp.y;
        let dist = Math.hypot(dx, dy);

        if (dist < 14) {
          window.absorbGoldParticle(gp.value, true);
          if (
            window.SoundManager &&
            typeof window.SoundManager.playCoinCollect === "function"
          ) {
            window.SoundManager.playCoinCollect();
          }
          window.addGoldFloatingText(p, gp.value);
          window.goldParticles.splice(i, 1);
        } else {
          gp.speed = Math.min(12, gp.speed + 0.4);
          gp.x += (dx / dist) * gp.speed;
          gp.y += (dy / dist) * gp.speed;
        }
      }
    }
  }

  export function updateHeroBuffParticles() {
    let p = window.player;
    let stats = window.playerStats;
    if (!p || !stats || p.hp <= 0 || window.deathAnimationTimer > 0) return;

    let isEco = stats.ecoMode === true;
    let chance = isEco ? 0.08 : 0.28;
    if (Math.random() > chance) return;

    let getAtkCol = (s) =>
      s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71";
    let getHpCol = (s) =>
      s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c";
    let getDefCol = (s) =>
      s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db";
    let getHasteCol = (s) =>
      s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f";

    let activeColors = [];
    if ((stats.atkPotionRuns || 0) > 0)
      activeColors.push(getAtkCol(stats.atkPotionStrength || 0.1));
    if ((stats.hpPotionRuns || 0) > 0)
      activeColors.push(getHpCol(stats.hpPotionStrength || 0.1));
    if ((stats.defPotionRuns || 0) > 0)
      activeColors.push(getDefCol(stats.defPotionStrength || 0.1));
    if ((stats.hastePotionRuns || 0) > 0)
      activeColors.push(getHasteCol(stats.hastePotionStrength || 1));
    if ((stats.xpPotionRuns || 0) > 0) activeColors.push("#c084fc");
    if ((stats.dropPotionRuns || 0) > 0) activeColors.push("#34d399");
    if ((stats.qlyPotionRuns || 0) > 0) activeColors.push("#f472b6");
    if (stats.frenzyTimer > 0) activeColors.push("#f1c40f");
    if (stats.astralAwakeningTimer > 0) activeColors.push("#00d2ff");

    if (activeColors.length === 0) return;

    // Upgraded status aura particles (Subphase C.4)
    let chosenColor =
      activeColors[Math.floor(Math.random() * activeColors.length)];
    let spreadX = (Math.random() - 0.5) * 20;
    let startY = p.y + window.randFloat(-4, 12);
    let upwardVel = -window.randFloat(0.5, 1.5);
    let sideVel = (Math.random() - 0.5) * 0.8;
    let pLife = window.randInt(20, 38);

    if (window.ParticlePool) {
      let pt = window.ParticlePool.get(
        p.x + spreadX,
        startY,
        sideVel,
        upwardVel,
        window.randFloat(1.8, 3.2),
        chosenColor,
        0.85,
        pLife,
        pLife,
        -0.02,
        true,
      );

      pt.style = Math.random() < 0.25 ? "sparkle_star" : "glowing_orb";
      pt.spinSpeed =
        pt.style === "sparkle_star" ? window.randFloat(-0.04, 0.04) : 0;
      pt.scaleDecay = 0.022;

      window.particles.push(pt);
    }
  }

