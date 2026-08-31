const ScopedDate = class extends window.Date {
  static now() {
    return window.Date.now();
  }
};
const Date = ScopedDate;
const drawSingleHero = function (
    ctx,
    x,
    y,
    scale,
    equippedSlots,
    playerStats,
    bounce,
    options = {},
  ) {
    let equipped = equippedSlots ? { ...equippedSlots } : {};
    let stats = playerStats || {};

    let drawColossusPhantom = () => {
      if (typeof window.drawColossusPhantom === "function") {
        window.drawColossusPhantom(
          ctx,
          x,
          y,
          scale,
          equippedSlots,
          playerStats,
          bounce,
          options,
        );
      } else if (typeof window.drawColossusPhantomVisual === "function") {
        window.drawColossusPhantomVisual(
          ctx,
          x,
          y,
          scale,
          equippedSlots,
          playerStats,
          bounce,
          options,
        );
      }
    };

    // --- Shadow Step Trail Logic ---
    if (options.isMainHero && !options.isTrail) {
      if (!window.shadowStepHistory) {
        window.shadowStepHistory = [];
      }

      let isStepActive = !!(
        stats.shadowStepTimer > 0 ||
        (window.playerStats && window.playerStats.shadowStepTimer > 0)
      );

      if (isStepActive) {
        if (!window.isGamePaused) {
          // Safeguard: decrement the buff timer cleanly each frame
          if (stats.shadowStepTimer > 0) {
            stats.shadowStepTimer--;
            if (window.playerStats)
              window.playerStats.shadowStepTimer = stats.shadowStepTimer;
          }

          // Spawn premium rising abyssal embers on coordinate motion
          if (window.ParticlePool && Math.random() < 0.65) {
            let angle = Math.random() * Math.PI * 2;
            let speed = window.randFloat(0.2, 0.8);
            let pt = window.ParticlePool.get(
              x + window.randFloat(-6, 6),
              y - 8 + window.randFloat(-6, 6),
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - window.randFloat(0.2, 0.6), // float up
              window.randFloat(1.5, 3.2),
              Math.random() < 0.6 ? "#a855f7" : "#e84393", // purple or magenta
              0.85,
              window.randInt(15, 30),
              0.0,
              true,
              0.93,
            );
            pt.style = Math.random() < 0.35 ? "sparkle_star" : "glowing_orb";
            pt.scaleDecay = 0.015;
            pt.spinSpeed = window.randFloat(-0.06, 0.06);
            window.particles.push(pt);
          }

          let last =
                      window.shadowStepHistory[window.shadowStepHistory.length - 1];
                    let dist = last ? Math.hypot(x - last.x, y - last.y) : 999;
                    if (dist > 6) {
                      let shallowEquipped = {};
                      if (equippedSlots) {
                        for (let sKey in equippedSlots) {
                          shallowEquipped[sKey] = equippedSlots[sKey];
                        }
                      }
                      window.shadowStepHistory.push({
                        x: x,
                        y: y,
                        bounce: bounce,
                        facing: options.facing !== undefined ? options.facing : -1,
                        equippedSlots: shallowEquipped,
                        playerStats: { ...stats, shadowStepTimer: 0 }, // Prevent infinite recursion
                        time: Date.now(),
                      });
                      if (window.shadowStepHistory.length > 4) {
                        window.shadowStepHistory.shift();
                      }
                    }
        }
      } else {
        if (window.shadowStepHistory.length > 0 && !window.isGamePaused) {
          window.shadowStepHistory.shift();
        }
      }

      // Draw phantoms behind the hero in world space with motion wind-drag skewing
      window.shadowStepHistory.forEach((trail, idx) => {
        ctx.save();
        ctx.globalAlpha = 0.08 + (idx / window.shadowStepHistory.length) * 0.22;

        // Shearing warp based on index to simulate wind-drag stretch
        let ageRatio = 1.0 - idx / window.shadowStepHistory.length; // 1.0 at oldest, 0.0 at newest
        let shearDir =
          (trail.facing !== undefined ? trail.facing : -1) === 1 ? -1 : 1;
        let skewX = ageRatio * 0.18 * shearDir;

        ctx.translate(trail.x, trail.y);
        ctx.transform(1, 0, skewX, 1, 0, 0);
        ctx.translate(-trail.x, -trail.y);

        window.drawSingleHero(
          ctx,
          trail.x,
          trail.y,
          scale,
          trail.equippedSlots,
          trail.playerStats,
          trail.bounce,
          { facing: trail.facing, isTrail: true, isMainHero: false },
        );
        ctx.restore();
      });
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // --- Fortified Guard (Hexagonal Cage Shield) Setup ---
    let drawHexagon = (cx, cy, r, fill, stroke) => {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        let angle = (i * Math.PI) / 3;
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    let fortitudePlates = [];
    if (
      stats.fortitudeStacks > 0 &&
      (!stats.fortitudeTimer || stats.fortitudeTimer > 0) &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      let stacks = Math.min(5, stats.fortitudeStacks);
      let time = Date.now();
      let rot = time / 800;
      let Rx = 15;
      let Ry = 5.5;
      let yOffset = 2 + bounce;

      for (let i = 0; i < stacks; i++) {
        let angle = rot + (i * Math.PI * 2) / stacks;
        let px = Math.cos(angle) * Rx;
        let py = Math.sin(angle) * Ry + yOffset;
        let pz = Math.sin(angle); // Depth factor (-1 is back, 1 is front)
        fortitudePlates.push({ x: px, y: py, z: pz, index: i });
      }
    }

    let drawFortitudePass = (drawBehind) => {
      if (fortitudePlates.length === 0) return;

      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      let hasPoints = false;
      for (let i = 0; i < fortitudePlates.length; i++) {
        let current = fortitudePlates[i];
        let next = fortitudePlates[(i + 1) % fortitudePlates.length];

        let currentIsBehind = current.z < 0;
        let nextIsBehind = next.z < 0;

        if (drawBehind === currentIsBehind && drawBehind === nextIsBehind) {
          if (!hasPoints) {
            ctx.moveTo(current.x, current.y);
            hasPoints = true;
          }
          ctx.lineTo(next.x, next.y);
        } else {
          hasPoints = false; // Break path line continuity on depth boundary crossings
        }
      }
      ctx.stroke();
      ctx.restore();

      fortitudePlates.forEach((plate) => {
        let isBehind = plate.z < 0;
        if (drawBehind === isBehind) {
          let pulse = 2.5 + Math.sin(Date.now() / 150 + plate.index) * 0.5;
          drawHexagon(
            plate.x,
            plate.y,
            pulse,
            "rgba(56, 189, 248, 0.22)",
            "#38bdf8",
          );
        }
      });
    };

    const drawUniqueCharacterVisuals = (isBehind) => {
      if (options.deathAnimationTimer && options.deathAnimationTimer > 0)
        return;
      let time = Date.now();

      // --- 1. PHOENIX IGNITION STAFF (Solar Phoenix Halo & Orbiting Embers) ---
      let hasStaff =
        equipped.weapon &&
        (equipped.weapon.isUniqueStaff ||
          equipped.weapon.id === "weapon_staff");
      if (hasStaff) {
        let cy = -2 + bounce;
        let headY = -22 + bounce;
        let orbitRadiusX = 18;
        let orbitRadiusY = 6;
        let emberCount = 4;
        let rotSpeed = time / 350;

        if (isBehind) {
          // A. Fiery Solar Ground Halo (Foot Ring)
          ctx.save();
          let auraPulse = 1.0 + Math.sin(time / 180) * 0.08;
          let groundGrad = ctx.createRadialGradient(
            0,
            16,
            2,
            0,
            16,
            18 * auraPulse,
          );
          groundGrad.addColorStop(0, "rgba(255, 85, 0, 0.35)");
          groundGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.15)");
          groundGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = groundGrad;
          ctx.beginPath();
          ctx.ellipse(0, 16, 18 * auraPulse, 7 * auraPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 85, 0, 0.5)";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.ellipse(
            0,
            16,
            15 * auraPulse,
            5.5 * auraPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();

          // B. Orbiting Solar Embers (Back-Pass: Z < 0)
          for (let i = 0; i < emberCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / emberCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ff5500";
              ctx.shadowBlur = 6;
              ctx.shadowColor = "#ff5500";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Solar Embers (Front-Pass: Z >= 0)
          for (let i = 0; i < emberCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / emberCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#f1c40f";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#ff5500";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // D. Flaming Phoenix Solar Crown / Halo (Above Hero's Head)
          ctx.save();
          let crownPulse = Math.sin(time / 120) * 1.5;
          ctx.translate(0, headY);

          // Crown Solar Back Glow
          let crownGlow = ctx.createRadialGradient(
            0,
            -2,
            1,
            0,
            -2,
            12 + crownPulse,
          );
          crownGlow.addColorStop(0, "rgba(255, 240, 150, 0.8)");
          crownGlow.addColorStop(0.5, "rgba(255, 85, 0, 0.35)");
          crownGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = crownGlow;
          ctx.beginPath();
          ctx.arc(0, -2, 12 + crownPulse, 0, Math.PI * 2);
          ctx.fill();

          // Crown Base Arch (Golden Solar Crest)
          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 10, 3.5, 0, Math.PI, 0);
          ctx.stroke();

          // 3 Flaming Phoenix Spikes
          ctx.fillStyle = "#ff5500";
          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.0;

          // Center Spike
          ctx.beginPath();
          ctx.moveTo(-2.5, -2);
          ctx.quadraticCurveTo(0, -10 - crownPulse, 0, -11 - crownPulse);
          ctx.quadraticCurveTo(0, -10 - crownPulse, 2.5, -2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Left Spike
          ctx.beginPath();
          ctx.moveTo(-8, -1);
          ctx.quadraticCurveTo(
            -6,
            -7 - crownPulse * 0.7,
            -6.5,
            -8 - crownPulse * 0.7,
          );
          ctx.quadraticCurveTo(-4, -6, -4, -1);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Spike
          ctx.beginPath();
          ctx.moveTo(4, -1);
          ctx.quadraticCurveTo(4, -6, 6.5, -8 - crownPulse * 0.7);
          ctx.quadraticCurveTo(6, -7 - crownPulse * 0.7, 8, -1);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core White-Hot Solar Gem in Crown
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, -2, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 2. CRIMSON SANGUINE REAVER (Swirling Blood Mist & Orbiting Blood Droplets) ---
      let hasSword =
        equipped.weapon &&
        (equipped.weapon.isUniqueSword ||
          equipped.weapon.id === "weapon_sword");
      if (hasSword) {
        let cy = 0 + bounce;
        let orbitRadiusX = 16;
        let orbitRadiusY = 5.5;
        let dropletCount = 5;
        let rotSpeed = time / 300;

        if (isBehind) {
          // A. Crimson Blood-Pool Aura (Foot/Waist Halo)
          ctx.save();
          let auraPulse = 1.0 + Math.sin(time / 160) * 0.1;
          let groundGrad = ctx.createRadialGradient(
            0,
            16,
            2,
            0,
            16,
            17 * auraPulse,
          );
          groundGrad.addColorStop(0, "rgba(150, 0, 24, 0.45)");
          groundGrad.addColorStop(0.6, "rgba(192, 57, 43, 0.18)");
          groundGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = groundGrad;
          ctx.beginPath();
          ctx.ellipse(
            0,
            16,
            17 * auraPulse,
            6.5 * auraPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.strokeStyle = "rgba(150, 0, 24, 0.6)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(
            0,
            16,
            13 * auraPulse,
            5.0 * auraPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();

          // B. Orbiting Blood Droplets (Back-Pass: Z < 0)
          for (let i = 0; i < dropletCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / dropletCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#960018";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Blood Droplets (Front-Pass: Z >= 0)
          for (let i = 0; i < dropletCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / dropletCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#c0392b";
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 0.8;
              ctx.shadowBlur = 6;
              ctx.shadowColor = "#ff0055";

              // Tear-drop shape
              ctx.beginPath();
              ctx.moveTo(ox, oy - 2.5);
              ctx.quadraticCurveTo(ox + 1.8, oy, ox, oy + 1.8);
              ctx.quadraticCurveTo(ox - 1.8, oy, ox, oy - 2.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Specular glisten
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox - 0.5, oy - 0.5, 0.6, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Crimson Eye-Flares (Sinister Sanguine Glint)
          ctx.save();
          let eyeGlintPulse = Math.sin(time / 100) * 0.4 + 0.6;
          let eyeX = options.facing === -1 ? -2 : 2;
          let eyeY = -9 + bounce;

          ctx.fillStyle = `rgba(255, 0, 85, ${eyeGlintPulse})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#ff0055";
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(eyeX - 2.5, eyeY);
          ctx.lineTo(eyeX + 2.5, eyeY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // --- 3. VOID-SOVEREIGN GREATSWORD (Accretion Vortex & Micro-Singularity Nodes) ---
      let hasSingularity =
        equipped.weapon &&
        (equipped.weapon.isUniqueSingularity ||
          equipped.weapon.id === "weapon_singularity");
      if (hasSingularity) {
        let cy = -4 + bounce;
        let orbitRadiusX = 20;
        let orbitRadiusY = 7;
        let nodeCount = 3;
        let rotSpeed = time / 450;

        if (isBehind) {
          // A. Tilted Void Event-Horizon Accretion Disk (Ground/Foot Ring)
          ctx.save();
          let auraPulse = 1.0 + Math.sin(time / 140) * 0.12;
          ctx.translate(0, 16);
          ctx.rotate(-Math.PI / 12);

          let voidGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            22 * auraPulse,
          );
          voidGrad.addColorStop(0, "rgba(13, 1, 26, 0.7)");
          voidGrad.addColorStop(0.5, "rgba(142, 68, 173, 0.25)");
          voidGrad.addColorStop(0.85, "rgba(232, 67, 147, 0.15)");
          voidGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = voidGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 22 * auraPulse, 8 * auraPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#e84393";
          ctx.lineWidth = 1.6;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#e84393";
          ctx.beginPath();
          ctx.ellipse(0, 0, 18 * auraPulse, 6.5 * auraPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 1.0;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.ellipse(0, 0, 14 * auraPulse, 5 * auraPulse, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // B. Micro-Singularity Nodes (Back-Pass: Z < 0)
          for (let i = 0; i < nodeCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / nodeCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.translate(ox, oy);

              // Event horizon ring behind core
              ctx.strokeStyle = "#8e44ad";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 4.5, 1.8, angle, Math.PI, 0);
              ctx.stroke();

              // Black Hole Core
              ctx.fillStyle = "#0c011a";
              ctx.strokeStyle = "#e84393";
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.restore();
            }
          }
        } else {
          // C. Micro-Singularity Nodes (Front-Pass: Z >= 0)
          for (let i = 0; i < nodeCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / nodeCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.translate(ox, oy);

              // Black Hole Core
              ctx.fillStyle = "#0c011a";
              ctx.strokeStyle = "#ff007f";
              ctx.lineWidth = 1.2;
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#ff007f";
              ctx.beginPath();
              ctx.arc(0, 0, 3.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Front Event Horizon Ring
              ctx.strokeStyle = "#00ffff";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 5.5, 2.2, angle, 0, Math.PI);
              ctx.stroke();

              ctx.restore();
            }
          }

          // D. Spatial Collapse Chest Singularity Core
          ctx.save();
          let singPulse = Math.sin(time / 100) * 0.8 + 2.2;
          let chestY = -5 + bounce;

          ctx.fillStyle = "#0c011a";
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#e84393";

          ctx.beginPath();
          ctx.arc(0, chestY, singPulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, chestY, 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 4. MAELSTROM GALE-GLAIVE (Gale Cyclones & Swirling Wind Wisps) ---
      let hasMaelstrom =
        equipped.weapon &&
        (equipped.weapon.isUniqueMaelstrom ||
          equipped.weapon.id === "weapon_maelstrom");
      if (hasMaelstrom) {
        let cy = 2 + bounce;
        let orbitRadiusX = 17;
        let orbitRadiusY = 6;
        let wispCount = 4;
        let rotSpeed = time / 250;

        if (isBehind) {
          // A. Swirling Gale Ground Cyclones (Dual Foot Spirals)
          ctx.save();
          let galePulse = Math.sin(time / 100) * 0.15 + 1.0;
          ctx.translate(0, 16);

          // Emerald Wind Ground Aura
          let galeGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            19 * galePulse,
          );
          galeGrad.addColorStop(0, "rgba(46, 204, 113, 0.45)");
          galeGrad.addColorStop(0.6, "rgba(30, 215, 255, 0.2)");
          galeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = galeGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 19 * galePulse, 7 * galePulse, 0, 0, Math.PI * 2);
          ctx.fill();

          // Counter-rotating wind arcs
          let windRot = (time / 200) % (Math.PI * 2);
          ctx.strokeStyle = "#2ecc71";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            16 * galePulse,
            5.5 * galePulse,
            windRot,
            0,
            Math.PI * 1.2,
          );
          ctx.stroke();

          ctx.strokeStyle = "#00f0ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            12 * galePulse,
            4.0 * galePulse,
            -windRot * 1.3,
            0,
            Math.PI * 1.2,
          );
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Wind Wisps (Back-Pass: Z < 0)
          for (let i = 0; i < wispCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / wispCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.strokeStyle = "rgba(46, 204, 113, 0.8)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Wind Wisps (Front-Pass: Z >= 0)
          for (let i = 0; i < wispCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / wispCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              // Wind Wisp Streak Line
              let tailX = Math.cos(angle - 0.4) * orbitRadiusX;
              let tailY = Math.sin(angle - 0.4) * orbitRadiusY + cy;

              ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(tailX, tailY);
              ctx.lineTo(ox, oy);
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Gale Ankle Wind Wings (Aerodynamic Speed Wisps)
          ctx.save();
          let wingFlutter = Math.sin(time / 80) * 1.5;
          let wingX = options.facing === -1 ? 6 : -6;
          ctx.translate(wingX, 12 + bounce);

          ctx.fillStyle = "#2ecc71";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8;

          // Upper Feather Wisp
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            -6 * options.facing,
            -4 + wingFlutter,
            -10 * options.facing,
            -2,
          );
          ctx.quadraticCurveTo(-5 * options.facing, 0, 0, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }

      // --- 5. VIPER'S PERFECT STILETTO (Venom Seal & Orbiting Poison Motes) ---
      let hasViper =
        equipped.subweapon &&
        (equipped.subweapon.isUniqueViper ||
          equipped.subweapon.id === "dagger_viper");
      if (hasViper) {
        let cy = 0 + bounce;
        let orbitRadiusX = 16;
        let orbitRadiusY = 5.5;
        let moteCount = 3;
        let rotSpeed = time / 280;

        if (isBehind) {
          // A. Acidic Venom Ground Seal (Foot Ring)
          ctx.save();
          let sealPulse = Math.sin(time / 130) * 0.12 + 1.0;
          ctx.translate(0, 16);

          // Radial Toxic Green Glow
          let viperGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            17 * sealPulse,
          );
          viperGrad.addColorStop(0, "rgba(46, 204, 113, 0.45)");
          viperGrad.addColorStop(0.6, "rgba(39, 174, 96, 0.2)");
          viperGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = viperGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 17 * sealPulse, 6.5 * sealPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          // Poison Seal Outer Circle
          ctx.strokeStyle = "#2ecc71";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 14 * sealPulse, 5.0 * sealPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Viper Fang Mark
          ctx.strokeStyle = "#a3fd83";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-4, -2);
          ctx.lineTo(-2, 3);
          ctx.moveTo(4, -2);
          ctx.lineTo(2, 3);
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Poison Motes (Back-Pass: Z < 0)
          for (let i = 0; i < moteCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / moteCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#1e8449";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Poison Motes (Front-Pass: Z >= 0)
          for (let i = 0; i < moteCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / moteCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#a3fd83";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#2ecc71";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox - 0.4, oy - 0.4, 0.7, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Venom Shadow Eye Glint
          ctx.save();
          let eyePulse = Math.sin(time / 90) * 0.35 + 0.65;
          let eyeX = options.facing === -1 ? -2 : 2;
          let eyeY = -9 + bounce;

          ctx.fillStyle = `rgba(163, 253, 131, ${eyePulse})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#2ecc71";
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 6. VOID-WARPED BULWARK (Translucent Hex Shield & Void Barrier) ---
      let hasAegis =
        equipped.subweapon &&
        (equipped.subweapon.isUniqueAegis ||
          equipped.subweapon.id === "shield_aegis");
      if (hasAegis) {
        let cy = 0 + bounce;
        let orbitRadiusX = 17;
        let orbitRadiusY = 6;
        let moteCount = 3;
        let rotSpeed = time / 320;

        if (isBehind) {
          // A. Dark Purple Void Distortion Ring (Foot Ring)
          ctx.save();
          let aegisPulse = Math.sin(time / 140) * 0.12 + 1.0;
          ctx.translate(0, 16);

          let aegisGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            18 * aegisPulse,
          );
          aegisGrad.addColorStop(0, "rgba(37, 3, 60, 0.5)");
          aegisGrad.addColorStop(0.6, "rgba(142, 68, 173, 0.2)");
          aegisGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = aegisGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 18 * aegisPulse, 7 * aegisPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            15 * aegisPulse,
            5.5 * aegisPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Void Shield Motes (Back-Pass: Z < 0)
          for (let i = 0; i < moteCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / moteCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#110221";
              ctx.strokeStyle = "#8e44ad";
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.arc(ox, oy, 2.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Void Shield Motes (Front-Pass: Z >= 0)
          for (let i = 0; i < moteCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / moteCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#00ffff";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#8e44ad";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox - 0.4, oy - 0.4, 0.7, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Floating Hexagonal Void Energy Shield Barrier Projection
          ctx.save();
          let shieldX = options.facing === -1 ? -12 : 12;
          let shieldY = -2 + bounce;
          let shieldPulse = Math.sin(time / 110) * 1.2 + 8.5;

          ctx.translate(shieldX, shieldY);
          ctx.strokeStyle = "rgba(0, 255, 255, 0.75)";
          ctx.fillStyle = "rgba(142, 68, 173, 0.22)";
          ctx.lineWidth = 1.4;
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#8e44ad";

          // Hexagon Projection Path
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            let a = (i * Math.PI) / 3;
            let hx = Math.cos(a) * shieldPulse;
            let hy = Math.sin(a) * shieldPulse * 1.2;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core White-Hot Node
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 7. CHRONOS DIAL-WATCH (Clockwork Gear Halo & Roman Hour Marks) ---
      let hasWatch =
        equipped.subweapon &&
        (equipped.subweapon.isUniqueWatch ||
          equipped.subweapon.id === "tome_watch");
      if (hasWatch) {
        let cy = 0 + bounce;
        let orbitRadiusX = 18;
        let orbitRadiusY = 6;
        let sparkCount = 4;
        let rotSpeed = time / 400;

        if (isBehind) {
          // A. Rotating Golden Clockwork Dial (Waist/Ground Gear Halo)
          ctx.save();
          let dialPulse = Math.sin(time / 160) * 0.08 + 1.0;
          ctx.translate(0, 16);

          let watchGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            18 * dialPulse,
          );
          watchGrad.addColorStop(0, "rgba(212, 175, 55, 0.45)");
          watchGrad.addColorStop(0.6, "rgba(241, 196, 15, 0.15)");
          watchGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = watchGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 18 * dialPulse, 7 * dialPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#d4af37";
          ctx.lineWidth = 1.4;
          let gearRot = (time / 300) % (Math.PI * 2);
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            15 * dialPulse,
            5.5 * dialPulse,
            gearRot,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          // Ticks on Dial Ring
          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.0;
          for (let i = 0; i < 12; i++) {
            let tickAngle = gearRot + (i * Math.PI * 2) / 12;
            let tx1 = Math.cos(tickAngle) * (13 * dialPulse);
            let ty1 = Math.sin(tickAngle) * (4.8 * dialPulse);
            let tx2 = Math.cos(tickAngle) * (15 * dialPulse);
            let ty2 = Math.sin(tickAngle) * (5.5 * dialPulse);

            ctx.beginPath();
            ctx.moveTo(tx1, ty1);
            ctx.lineTo(tx2, ty2);
            ctx.stroke();
          }

          ctx.restore();

          // B. Orbiting Temporal Gear Sparks (Back-Pass: Z < 0)
          for (let i = 0; i < sparkCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / sparkCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#b7950b";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Temporal Gear Sparks (Front-Pass: Z >= 0)
          for (let i = 0; i < sparkCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / sparkCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#f1c40f";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#d4af37";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // D. Rotating Clock Hands (Chest / Offhand Temporal Anchor)
          ctx.save();
          let clockX = options.facing === -1 ? -12 : 12;
          let clockY = -4 + bounce;
          ctx.translate(clockX, clockY);

          let handAngle1 = (time / 150) % (Math.PI * 2);
          let handAngle2 = (time / 800) % (Math.PI * 2);

          // Hour Hand
          ctx.strokeStyle = "#d4af37";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(handAngle2) * 5, Math.sin(handAngle2) * 5);
          ctx.stroke();

          // Minute Hand
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(handAngle1) * 7.5, Math.sin(handAngle1) * 7.5);
          ctx.stroke();

          // Pivot Center Node
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 8. CHRONICLE OF PAST LIVES (Orbiting Golden Codex & Runic Glyphs) ---
      let hasChronicle =
        equipped.subweapon &&
        (equipped.subweapon.isUniqueChronicle ||
          equipped.subweapon.id === "tome_chronicle");
      if (hasChronicle) {
        let cy = -2 + bounce;
        let orbitRadiusX = 18;
        let orbitRadiusY = 6;
        let glyphCount = 4;
        let rotSpeed = time / 350;

        if (isBehind) {
          // A. Golden Wisdom Ground Halo (Foot Ring)
          ctx.save();
          let chronPulse = Math.sin(time / 150) * 0.1 + 1.0;
          ctx.translate(0, 16);

          let chronGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            17 * chronPulse,
          );
          chronGrad.addColorStop(0, "rgba(241, 196, 15, 0.4)");
          chronGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.15)");
          chronGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = chronGrad;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            17 * chronPulse,
            6.5 * chronPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            14 * chronPulse,
            5.0 * chronPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Golden Runic Glyphs (Back-Pass: Z < 0)
          for (let i = 0; i < glyphCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / glyphCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#d4af37";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Golden Runic Glyphs (Front-Pass: Z >= 0)
          for (let i = 0; i < glyphCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / glyphCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#f1c40f";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#f1c40f";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
              ctx.fill();

              // Tiny Rune Cross
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(ox - 1.2, oy);
              ctx.lineTo(ox + 1.2, oy);
              ctx.moveTo(ox, oy - 1.2);
              ctx.lineTo(ox, oy + 1.2);
              ctx.stroke();

              ctx.restore();
            }
          }

          // D. Floating Open Golden Parchment Codex (Chest/Shoulder Level)
          ctx.save();
          let bookX = options.facing === -1 ? -13 : 13;
          let bookY = -6 + bounce + Math.sin(time / 200) * 1.5;
          ctx.translate(bookX, bookY);
          ctx.rotate(options.facing * (Math.PI / 12));

          // Open Codex Parchment Pages
          ctx.fillStyle = "#fef08a";
          ctx.strokeStyle = "#111116";
          ctx.lineWidth = 1.0;

          // Left Page
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-3, -4, -6, -3);
          ctx.lineTo(-6, 3);
          ctx.quadraticCurveTo(-3, 2, 0, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Page
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(3, -4, 6, -3);
          ctx.lineTo(6, 3);
          ctx.quadraticCurveTo(3, 2, 0, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Golden Spine
          ctx.fillStyle = "#f1c40f";
          ctx.fillRect(-0.8, -3.5, 1.6, 7.5);

          // Glowing Golden Page Lines
          ctx.strokeStyle = "rgba(212, 175, 55, 0.8)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(-4, -1);
          ctx.lineTo(-2, -1);
          ctx.moveTo(-4, 1);
          ctx.lineTo(-2, 1);
          ctx.moveTo(2, -1);
          ctx.lineTo(4, -1);
          ctx.moveTo(2, 1);
          ctx.lineTo(4, 1);
          ctx.stroke();

          ctx.restore();
        }
      }

      // --- 9. CONDUIT OF THE LEXICON (Tri-Element Arcane Helix & Elemental Orbs) ---
      let hasConduit =
        equipped.subweapon &&
        (equipped.subweapon.isUniqueConduit ||
          equipped.subweapon.id === "tome_conduit");
      if (hasConduit) {
        let cy = -12 + bounce;
        let orbitRadiusX = 16;
        let orbitRadiusY = 5.5;
        let elemOrbs = [
          { color: "#e67e22", glow: "#ff5500", name: "fire" },
          { color: "#f1c40f", glow: "#ffffff", name: "lightning" },
          { color: "#38bdf8", glow: "#00ffff", name: "frost" },
        ];
        let rotSpeed = time / 300;

        if (isBehind) {
          // A. Tri-Elemental Arcane Ground Seal
          ctx.save();
          let elemPulse = Math.sin(time / 140) * 0.12 + 1.0;
          ctx.translate(0, 16);

          let elemGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            18 * elemPulse,
          );
          elemGrad.addColorStop(0, "rgba(155, 89, 182, 0.45)");
          elemGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.2)");
          elemGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = elemGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 18 * elemPulse, 7 * elemPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#9b59b6";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 15 * elemPulse, 5.5 * elemPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Elemental Orbs (Back-Pass: Z < 0)
          for (let i = 0; i < elemOrbs.length; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / elemOrbs.length;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = elemOrbs[i].color;
              ctx.beginPath();
              ctx.arc(ox, oy, 2.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Elemental Orbs (Front-Pass: Z >= 0)
          for (let i = 0; i < elemOrbs.length; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / elemOrbs.length;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = elemOrbs[i].glow;
              ctx.shadowBlur = 8;
              ctx.shadowColor = elemOrbs[i].color;
              ctx.beginPath();
              ctx.arc(ox, oy, 2.6, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox - 0.4, oy - 0.4, 0.8, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Aetheric Conduit Eye Glint
          ctx.save();
          let eyePulse = Math.sin(time / 110) * 0.35 + 0.65;
          let eyeX = options.facing === -1 ? -2 : 2;
          let eyeY = -9 + bounce;

          ctx.fillStyle = `rgba(0, 240, 255, ${eyePulse})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#9b59b6";
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 10. WARP-CORE GREAVES (Cyan Plasma Thrusters & Warp Lines) ---
      let hasWarpCore =
        equipped.boots &&
        (equipped.boots.isUniqueWarpCore ||
          equipped.boots.id === "boots_warpcore");
      if (hasWarpCore) {
        let cy = 12 + bounce;
        let orbitRadiusX = 14;
        let orbitRadiusY = 5.0;
        let particleCount = 3;
        let rotSpeed = time / 220;

        if (isBehind) {
          // A. Cyan Plasma Thruster Plume (Ground Foot Halo)
          ctx.save();
          let warpPulse = Math.sin(time / 80) * 0.18 + 1.0;
          ctx.translate(0, 16);

          let warpGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            16 * warpPulse,
          );
          warpGrad.addColorStop(0, "rgba(0, 240, 255, 0.55)");
          warpGrad.addColorStop(0.5, "rgba(0, 150, 255, 0.2)");
          warpGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = warpGrad;
          ctx.beginPath();
          ctx.ellipse(0, 0, 16 * warpPulse, 6 * warpPulse, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 13 * warpPulse, 4.5 * warpPulse, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Warp Particles (Back-Pass: Z < 0)
          for (let i = 0; i < particleCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / particleCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#0284c7";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Warp Particles (Front-Pass: Z >= 0)
          for (let i = 0; i < particleCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / particleCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#00ffff";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#00ffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Plasma Jet Thruster Streaks at Boot Heels
          ctx.save();
          let jetFlutter = Math.sin(time / 60) * 1.8;
          let heelX = options.facing === -1 ? 4 : -4;
          let heelY = 13 + bounce;

          ctx.translate(heelX, heelY);
          ctx.fillStyle = "#00ffff";
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00ffff";

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6 * options.facing, 3 + jetFlutter);
          ctx.lineTo(-2 * options.facing, 6);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- 11. CROWN OF TEMPESTS (Crackling Static Crown & Electric Arcs) ---
      let hasTempest =
        equipped.helmet &&
        (equipped.helmet.isUniqueTempest ||
          equipped.helmet.id === "helmet_tempest");
      if (hasTempest) {
        let cy = -16 + bounce;
        let orbitRadiusX = 16;
        let orbitRadiusY = 5.0;
        let sparkCount = 4;
        let rotSpeed = time / 260;

        if (isBehind) {
          // A. Crackling Storm Ground Aura (Foot Ring)
          ctx.save();
          let tempestPulse = Math.sin(time / 90) * 0.15 + 1.0;
          ctx.translate(0, 16);

          let tempestGrad = ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            17 * tempestPulse,
          );
          tempestGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
          tempestGrad.addColorStop(0.6, "rgba(0, 240, 255, 0.18)");
          tempestGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = tempestGrad;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            17 * tempestPulse,
            6.5 * tempestPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.strokeStyle = "#f1c40f";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 2]);
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            14 * tempestPulse,
            5.0 * tempestPulse,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          ctx.restore();

          // B. Orbiting Lightning Sparks (Back-Pass: Z < 0)
          for (let i = 0; i < sparkCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / sparkCount;
            let oz = Math.sin(angle);
            if (oz < 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#f1c40f";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        } else {
          // C. Orbiting Lightning Sparks (Front-Pass: Z >= 0)
          for (let i = 0; i < sparkCount; i++) {
            let angle = rotSpeed + (i * Math.PI * 2) / sparkCount;
            let oz = Math.sin(angle);
            if (oz >= 0) {
              let ox = Math.cos(angle) * orbitRadiusX;
              let oy = oz * orbitRadiusY + cy;

              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ox, oy, 1.0, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = "#00ffff";
              ctx.shadowBlur = 8;
              ctx.shadowColor = "#f1c40f";
              ctx.beginPath();
              ctx.arc(ox, oy, 2.4, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }
          }

          // D. Crackling Static Lightning Crown (Above Helmet)
          ctx.save();
          let crownHeadY = -22 + bounce;
          ctx.translate(0, crownHeadY);

          // Electric Halo Back Glow
          let crownPulse = Math.sin(time / 80) * 1.5;
          let haloGlow = ctx.createRadialGradient(
            0,
            -2,
            1,
            0,
            -2,
            11 + crownPulse,
          );
          haloGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          haloGlow.addColorStop(0.5, "rgba(241, 196, 15, 0.4)");
          haloGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = haloGlow;
          ctx.beginPath();
          ctx.arc(0, -2, 11 + crownPulse, 0, Math.PI * 2);
          ctx.fill();

          // Electric Lightning Spikes
          ctx.strokeStyle = "#f1c40f";
          ctx.fillStyle = "#00ffff";
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#00ffff";

          ctx.beginPath();
          // Center Bolt Spike
          ctx.moveTo(-2, -2);
          ctx.lineTo(-1, -7 - crownPulse);
          ctx.lineTo(1, -7 - crownPulse);
          ctx.lineTo(0, -12 - crownPulse);
          ctx.lineTo(-0.5, -6 - crownPulse);
          ctx.lineTo(2, -2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Left Bolt Spike
          ctx.beginPath();
          ctx.moveTo(-7, -1);
          ctx.lineTo(-5, -6 - crownPulse * 0.7);
          ctx.lineTo(-8, -9 - crownPulse * 0.7);
          ctx.lineTo(-4, -4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Bolt Spike
          ctx.beginPath();
          ctx.moveTo(7, -1);
          ctx.lineTo(5, -6 - crownPulse * 0.7);
          ctx.lineTo(8, -9 - crownPulse * 0.7);
          ctx.lineTo(4, -4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Core White-Hot Lightning Gem
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, -2, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    };

    // Ground Drop Shadow Pass (Ambient Occlusion)
    ctx.save();
    let shadowScale = Math.max(0.65, 1.0 - Math.abs(bounce) * 0.05);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 11 * shadowScale, 4.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Active Buff & Elixir Ground Aura Ring Pass
    if (
      stats &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      let activeAuras = [];
      let getAtkCol = (s) =>
        s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71";
      let getHpCol = (s) =>
        s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c";
      let getDefCol = (s) =>
        s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db";
      let getHasteCol = (s) =>
        s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f";

      if ((stats.atkPotionRuns || 0) > 0)
        activeAuras.push(getAtkCol(stats.atkPotionStrength || 0.1));
      if ((stats.hpPotionRuns || 0) > 0)
        activeAuras.push(getHpCol(stats.hpPotionStrength || 0.1));
      if ((stats.defPotionRuns || 0) > 0)
        activeAuras.push(getDefCol(stats.defPotionStrength || 0.1));
      if ((stats.hastePotionRuns || 0) > 0)
        activeAuras.push(getHasteCol(stats.hastePotionStrength || 1));
      if ((stats.xpPotionRuns || 0) > 0) activeAuras.push("#c084fc");
      if ((stats.dropPotionRuns || 0) > 0) activeAuras.push("#34d399");
      if ((stats.qlyPotionRuns || 0) > 0) activeAuras.push("#f472b6");
      if (stats.frenzyTimer > 0) activeAuras.push("#f1c40f");
      if (stats.astralAwakeningTimer > 0) activeAuras.push("#00d2ff");
      if (stats.purifiedAegisTimer > 0) activeAuras.push("#2ecc71");

      if (activeAuras.length > 0) {
        ctx.save();
        let time = Date.now();
        let auraRot = (time / 400) % (Math.PI * 2);

        activeAuras.forEach((col, idx) => {
          let rx = 15 + idx * 3;
          let ry = 7 + idx * 1.5;
          let pulse = Math.sin(time / 200 + idx) * 1.2;

          ctx.save();
          ctx.translate(0, 16);
          ctx.rotate(idx % 2 === 0 ? auraRot : -auraRot);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.ellipse(0, 0, rx + pulse, ry + pulse * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }
    }

    const penHero = 1.8;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = penHero;
    ctx.lineJoin = "round";

    // Phase 4: Spectral Cosmetic Projection Interceptor
    if (stats.projectSpectralCosmetic && stats.activeSpectralResonance) {
      let resonance = stats.activeSpectralResonance;
      if (resonance === "weapon_staff") {
        equipped.weapon = {
          isUniqueStaff: true,
          type: "weapon",
          name: "Phoenix Ignition Staff",
        };
      } else if (resonance === "weapon_sword") {
        equipped.weapon = {
          isUniqueSword: true,
          type: "weapon",
          name: "Sanguine Reaver",
        };
      } else if (resonance === "weapon_singularity") {
        equipped.weapon = {
          isUniqueSingularity: true,
          type: "weapon",
          name: "Void-Sovereign Greatsword",
        };
      } else if (resonance === "weapon_maelstrom") {
        equipped.weapon = {
          isUniqueMaelstrom: true,
          type: "weapon",
          name: "Maelstrom Gale-Glaive",
        };
      } else if (resonance === "shield_aegis") {
        equipped.subweapon = {
          isUniqueAegis: true,
          type: "subweapon",
          subType: "shield",
          name: "Void-Warped Bulwark",
        };
      } else if (resonance === "tome_watch") {
        equipped.subweapon = {
          isUniqueWatch: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronos Pocket-Watch",
        };
      } else if (resonance === "tome_chronicle") {
        equipped.subweapon = {
          isUniqueChronicle: true,
          type: "subweapon",
          subType: "tome",
          name: "Chronicle of past Lives",
        };
      } else if (resonance === "boots_warpcore") {
        equipped.boots = {
          isUniqueWarpCore: true,
          type: "boots",
          name: "Warp-Core Greaves",
        };
      } else if (resonance === "helmet_tempest") {
        equipped.helmet = {
          isUniqueTempest: true,
          type: "helmet",
          name: "Crown of Tempests",
        };
      } else if (resonance === "dagger_viper") {
        equipped.subweapon = {
          isUniqueViper: true,
          type: "subweapon",
          subType: "dagger",
          name: "Viper's Perfect Stiletto",
        };
      } else if (resonance === "tome_conduit") {
        equipped.subweapon = {
          isUniqueConduit: true,
          type: "subweapon",
          subType: "tome",
          name: "Conduit of the Lexicon",
        };
      }
    }

    // Custom visual skin color profiles for future cosmetic extensibility (with fallback mapping for leaderboards & clan rosters)
    let skin = options.isTrail
      ? "void"
      : stats.cosmeticSkin ||
        stats.cosmetic_skin ||
        (equipped && (equipped.cosmeticSkin || equipped.cosmetic_skin)) ||
        "default";
    let bodyColor = "#95a5a6";
    let armorColor = "#bdc3c7";
    let capeColor = "#c0392b";
    let eyeColor = stats.frenzyTimer > 0 ? "#f1c40f" : "#e74c3c";

    if (skin === "void") {
      bodyColor = "#2c1130";
      armorColor = "#510a74";
      capeColor = "#8e44ad";
    } else if (skin === "crimson") {
      bodyColor = "#1a0202";
      armorColor = "#960018";
      capeColor = "#111116";
    } else if (skin === "gilded") {
      bodyColor = "#ffd700";
      armorColor = "#b7950b";
      capeColor = "#111111";
    } else if (skin === "celestial") {
      bodyColor = "#0f172a";
      armorColor = "#00d2ff";
      capeColor = "#ffffff";
      eyeColor = "#00d2ff";
    }

    const drawSubweapon = () => {
      if (!equipped.subweapon) return;
      const subType = equipped.subweapon.subType;
      let isAegis = equipped.subweapon.isUniqueAegis;
      let isWatch = equipped.subweapon.isUniqueWatch;
      let isChronicle = equipped.subweapon.isUniqueChronicle;

      let img = window.getCanvasCutoutImage(equipped.subweapon);
      let tierColor = window.getTierColor(
        equipped.subweapon
          ? equipped.subweapon.statsRolled === "UNIQUE"
            ? 5
            : equipped.subweapon.statsRolled
          : 0,
      );

      // Priority 1: High-Fidelity Procedural Daggers (Always render procedurally if dagger)
      if (subType === "dagger") {
        let dItem = equipped.subweapon;
        let stars = dItem
          ? dItem.statsRolled === "UNIQUE"
            ? 5
            : dItem.statsRolled || 0
          : 0;
        let dRgb = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "46, 204, 113";

        // Dynamic breathing sway rotation
        let sway = Math.sin(Date.now() / 240) * 0.08;

        ctx.save();
        ctx.translate(14, 6 + bounce); // Extended forward to match sword reach
        ctx.rotate((Math.PI * 3) / 4 - sway); // Rotate 180 degrees so the blade points out/forward (away from face)

        // 1. Draw Hilt Grip & Core Pommel
        ctx.fillStyle = "#1c1c1f"; // Dark metallic hilt core
        ctx.beginPath();
        ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Custom pommel core gem matching active tier color
        ctx.fillStyle = tierColor;
        ctx.beginPath();
        ctx.arc(0, 10, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5c3a21"; // Padded wood hilt
        ctx.beginPath();
        ctx.rect(-1.5, 3, 3, 7);
        ctx.fill();
        ctx.stroke();

        // 2. Resolve Custom Guards & Blades based on specific Dagger sub-class
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = penHero;

        let noun = dItem && dItem.noun ? dItem.noun.toLowerCase() : "";

        if (noun.includes("kris")) {
          // Serpentine Kris Guard
          ctx.fillStyle = tierColor;
          ctx.beginPath();
          ctx.moveTo(-6, 3);
          ctx.lineTo(6, 3);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wavy/Serpentine Kris Blade
          ctx.fillStyle = "#95a5a6";
          ctx.beginPath();
          ctx.moveTo(-2.5, 3);
          ctx.lineTo(-1.2, -1);
          ctx.lineTo(-2.5, -4.5);
          ctx.lineTo(-1.2, -8);
          ctx.lineTo(0, -14); // Sharp wavy tip
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.5, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Contrast Highlight Line
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.2, -8);
          ctx.lineTo(2.5, -4.5);
          ctx.lineTo(1.2, -1);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("baselard")) {
          // Broad cross H-guard
          ctx.fillStyle = tierColor;
          ctx.fillRect(-6, 1.5, 12, 2);
          ctx.strokeRect(-6, 1.5, 12, 2);
          // Secondary matching H-pommel
          ctx.fillRect(-5, 9, 10, 2);
          ctx.strokeRect(-5, 9, 10, 2);

          // Broad diamond-point blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-3, 1.5);
          ctx.lineTo(0, -14); // tip
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(3, 1.5);
          ctx.closePath();
          ctx.fill();
        } else if (noun.includes("dirk")) {
          // Standard wide iron guard disc
          ctx.fillStyle = "#343a40";
          ctx.beginPath();
          ctx.ellipse(0, 3, 5, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Heavy single-edged wedge blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 3);
          ctx.lineTo(-2.2, -10); // Flat blunt back edge
          ctx.lineTo(0, -14); // Blade point
          ctx.lineTo(2.2, 3); // Curved cutting slope front
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 3);
          ctx.closePath();
          ctx.fill();
        } else if (dItem && dItem.isUniqueViper) {
          // --- UNIQUE: VIPER'S PERFECT STILETTO ---
          ctx.fillStyle = "#1e272e"; // Dark hilt
          ctx.beginPath();
          ctx.arc(0, 10, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = "#2ecc71"; // Emerald pommel gem
          ctx.beginPath();
          ctx.arc(0, 10, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#4a2306"; // Dark leather wrap
          ctx.beginPath();
          ctx.rect(-1.5, 3, 3, 7);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#f1c40f"; // Gold crossguard
          ctx.beginPath();
          ctx.moveTo(-7, 3);
          ctx.lineTo(7, 3);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Poison-etched serpentine blade
          ctx.fillStyle = "#0c1711"; // Dark obsidian core
          ctx.strokeStyle = "#2ecc71"; // Poison green edge glow
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-2.5, 3);
          ctx.lineTo(-1, -3);
          ctx.lineTo(-2, -8);
          ctx.lineTo(0, -15); // sharp tip
          ctx.lineTo(2, -8);
          ctx.lineTo(1, -3);
          ctx.lineTo(2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Acidic fuller lines
          ctx.strokeStyle = "#2ecc71";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, -12);
          ctx.stroke();
        } else if (noun.includes("main")) {
          // Main-Gauche Curved Parrying Guard
          ctx.strokeStyle = tierColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-7, 3);
          ctx.quadraticCurveTo(0, -1.5, 7, 3);
          ctx.stroke();
          // Finger protective basket loop
          ctx.beginPath();
          ctx.arc(0, 5.5, 3.5, 0, Math.PI);
          ctx.stroke();

          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // Narrow stiletto needle blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-1.8, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 1.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(1.8, 1.5);
          ctx.closePath();
          ctx.fill();
        } else {
          // Default Stiletto Needle structure
          ctx.fillStyle = tierColor; // Guard matching quality tier
          ctx.beginPath();
          ctx.moveTo(-8, 3);
          ctx.quadraticCurveTo(0, -2, 8, 3);
          ctx.quadraticCurveTo(0, 2, -8, 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Straight thin piercing blade
          ctx.fillStyle = "#7f8c8d";
          ctx.beginPath();
          ctx.moveTo(-2.2, 2.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, 2.5);
          ctx.lineTo(0, -14);
          ctx.lineTo(2.2, 2.5);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Procedural Metallic Glint Sweep Overlay
        let glintTime = (Date.now() / 1500) % 1.0;
        if (glintTime < 0.3) {
          let glintY = 10 - (glintTime / 0.3) * 24;
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-2, glintY);
          ctx.lineTo(2, glintY - 2.5);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();

        // 4. Quality-Scaled Active Spark Trails (Spirals off the moving blade tip)
        if (!window.isGamePaused && options.isMainHero && stars > 0) {
          let spawnChance = window.playerStats.ecoMode ? 0.08 : 0.25;
          if (Math.random() < spawnChance * stars) {
            let theta = (Math.PI * 3) / 4 - sway; // Align particle emission angle with updated blade direction
            let worldTipX = x + (14 + 14 * Math.sin(theta)) * scale; // Align tip spawn origin with hand translation
            let worldTipY = y + (6 + bounce - 14 * Math.cos(theta)) * scale;

            window.particles.push(
              window.ParticlePool.get(
                worldTipX,
                worldTipY,
                -Math.cos(theta) * window.randFloat(0.3, 0.8) -
                  (window.playerStats.isDungeonMode ? 1.5 : 0),
                -window.randFloat(0.2, 0.6) + bounce * 0.05,
                window.randFloat(0.8, 1.8),
                tierColor,
                0.85,
                window.randInt(15, 30),
                undefined,
                undefined,
                true, // Fade out over time
              ),
            );
          }
        }

        // 5. Rising elemental vapor matching equipped quality color!
        let mistCycle = (Date.now() / 150) % 6;
        ctx.fillStyle = `rgba(${dRgb}, ${0.55 - mistCycle / 12})`;
        ctx.beginPath();
        ctx.arc(0, -16 - mistCycle, 1.2 + mistCycle / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Priority 2: Image-based Cutouts (Shields, Tomes)
      else if (img && img.complete) {
        let renderSize = subType === "tome" ? 22 : 26; // Tomes smaller/floating, Shields larger
        let pivotX = renderSize / 2;
        let pivotY = renderSize / 2;

        if (subType === "shield") {
          let sway = Math.sin(Date.now() / 320) * 0.05;

          ctx.save();
          ctx.translate(6, 4 + bounce);
          ctx.rotate(-sway + 0.15); // Held securely on the front of the body

          ctx.drawImage(img, -pivotX, -pivotY, renderSize, renderSize);

          // Searing Steel Glint Sweep (Diagonal light reflections)
          let glintTime = (Date.now() / 2000) % 1.0;
          if (glintTime < 0.3) {
            let glintY = -9.5 + (glintTime / 0.3) * 19;
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-6, glintY);
            ctx.lineTo(6, glintY - 3);
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();

          // Orbiting Void Sparks (Aegis Unique only)
          if (
            isAegis &&
            (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
          ) {
            ctx.save();
            ctx.translate(6, 4 + bounce);
            ctx.rotate(-sway + 0.15); // Aligned to follow the updated shield position
            let orbitTime = Date.now() / 250;
            ctx.fillStyle = "#110221";
            ctx.strokeStyle = "#8e44ad";
            ctx.lineWidth = 1.0;
            for (let i = 0; i < 2; i++) {
              let angle = orbitTime + i * Math.PI;
              let ox = Math.cos(angle) * 14;
              let oy = Math.sin(angle) * 6;
              ctx.beginPath();
              ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }

          // Active Block Forcefield Flash centred on the Hero
          let timeSinceBlock = Date.now() - (stats.recentBlockTime || 0);
          if (
            timeSinceBlock < 250 &&
            (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
          ) {
            let opacity = (250 - timeSinceBlock) / 250;
            let currentR = 24 + (1.0 - opacity) * 6;
            ctx.save();
            ctx.strokeStyle = tierColor;
            ctx.fillStyle = window.hexToRgba
              ? window.hexToRgba(tierColor, 0.15 * opacity)
              : `rgba(52, 152, 219, ${0.15 * opacity})`;
            ctx.lineWidth = 2.0;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              let angle = (i * Math.PI) / 3;
              let hx = Math.cos(angle) * currentR;
              let hy = Math.sin(angle) * currentR + 4 + bounce;
              ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        } else if (subType === "tome") {
          ctx.save();
          let tomeFloat = Math.sin(Date.now() / 200) * 5;
          ctx.translate(25, -15 + bounce + tomeFloat); // Elevated and extended further forward to float heroically
          ctx.rotate(Math.PI / 12);
          ctx.rotate(Math.PI / 12);

          let tomeItem = equipped.subweapon;
          let isUniqueConduit = tomeItem && tomeItem.isUniqueConduit;

          // Unified Rarity/Stars Resolver (Uniques are treated as 5★)
          let stars = tomeItem
            ? tomeItem.statsRolled === "UNIQUE"
              ? 5
              : tomeItem.statsRolled || 0
            : 0;
          if (isWatch || isChronicle || isUniqueConduit) {
            stars = 5;
          }

          if (isWatch) tierColor = "#d4af37";
          else if (isChronicle) tierColor = "#f1c40f";
          else if (isUniqueConduit) tierColor = "#9b59b6";

          let rgbVals = window.hexToRgbValues
            ? window.hexToRgbValues(tierColor)
            : "155, 89, 182";

          // 3D Orbital properties
          let R = 15;
          let R_minor = 7;
          let orbitTime = Date.now() / 280;

          // Parametric calculation of points on 3D-tilted orbital planes
          let getOrbPos = (i) => {
            let phi = i * (Math.PI / stars) + Math.PI / 12;
            let theta = orbitTime + i * ((Math.PI * 2) / stars);

            let ox =
              R * Math.cos(theta) * Math.cos(phi) -
              R_minor * Math.sin(theta) * Math.sin(phi);
            let oy =
              R * Math.cos(theta) * Math.sin(phi) +
              R_minor * Math.sin(theta) * Math.cos(phi) -
              1;
            let oz = Math.sin(theta); // Depth indicator

            return { ox, oy, oz, phi };
          };

          // 1. Draw continuous translucent orbit rings behind the Tome
          if (stars > 0) {
            ctx.save();
            ctx.lineWidth = 0.6;
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              ctx.strokeStyle = `rgba(${rgbVals}, 0.08)`;
              ctx.beginPath();
              ctx.ellipse(0, -1, R, R_minor, pos.phi, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 2. Draw orbs that are rotating behind the book (oz < 0)
          if (stars > 0) {
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              if (pos.oz < 0) {
                ctx.save();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = tierColor;
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }

          ctx.drawImage(img, -pivotX, -pivotY, renderSize, renderSize);

          // 4. Draw orbs that are rotating in front of the book (oz >= 0)
          if (stars > 0) {
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              if (pos.oz >= 0) {
                ctx.save();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = tierColor;
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }

          ctx.restore();
        } else if (subType === "dagger") {
          let dItem = equipped.subweapon;
          let stars = dItem
            ? dItem.statsRolled === "UNIQUE"
              ? 5
              : dItem.statsRolled || 0
            : 0;
          let dRgb = window.hexToRgbValues
            ? window.hexToRgbValues(tierColor)
            : "46, 204, 113";

          // Dynamic breathing sway rotation
          let sway = Math.sin(Date.now() / 240) * 0.08;

          ctx.save();
          ctx.translate(14, 6 + bounce); // Extended forward to match sword reach
          ctx.rotate((Math.PI * 3) / 4 - sway); // Rotate 180 degrees so the blade points out/forward (away from face)

          // Draw the high-fidelity dagger cutout!
          let dPivotY = boxSize * 0.8125;
          ctx.drawImage(img, -pivotX, -dPivotY, boxSize, boxSize);

          // 3. Procedural Metallic Glint Sweep Overlay
          let glintTime = (Date.now() / 1500) % 1.0;
          if (glintTime < 0.3) {
            let glintY = 10 - (glintTime / 0.3) * 24;
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-2, glintY);
            ctx.lineTo(2, glintY - 2.5);
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();

          // 4. Quality-Scaled Active Spark Trails (Spirals off the moving blade tip)
          if (!window.isGamePaused && options.isMainHero && stars > 0) {
            let spawnChance = window.playerStats.ecoMode ? 0.08 : 0.25;
            if (Math.random() < spawnChance * stars) {
              let theta = (Math.PI * 3) / 4 - sway; // Align particle emission angle with updated blade direction
              let worldTipX = x + (14 + 14 * Math.sin(theta)) * scale; // Align tip spawn origin with hand translation
              let worldTipY = y + (6 + bounce - 14 * Math.cos(theta)) * scale;

              window.particles.push(
                window.ParticlePool.get(
                  worldTipX,
                  worldTipY,
                  -Math.cos(theta) * window.randFloat(0.3, 0.8) -
                    (window.playerStats.isDungeonMode ? 1.5 : 0),
                  -window.randFloat(0.2, 0.6) + bounce * 0.05,
                  window.randFloat(0.8, 1.8),
                  tierColor,
                  0.85,
                  window.randInt(15, 30),
                  undefined,
                  undefined,
                  true, // Fade out over time
                ),
              );
            }
          }

          // 5. Rising elemental vapor matching equipped quality color!
          let mistCycle = (Date.now() / 150) % 6;
          ctx.fillStyle = `rgba(${dRgb}, ${0.55 - mistCycle / 12})`;
          ctx.beginPath();
          ctx.arc(0, -16 - mistCycle, 1.2 + mistCycle / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Priority 3: Fallback Procedural Drawing (Shields, Tomes)
        let shieldItem = equipped.subweapon;
        let noun =
          shieldItem && shieldItem.noun ? shieldItem.noun.toLowerCase() : "";
        let tierColorFallback = window.getTierColor(
          shieldItem
            ? shieldItem.statsRolled === "UNIQUE"
              ? 5
              : shieldItem.statsRolled || 0
            : 0,
        );

        if (subType === "shield") {
          if (isAegis) {
            // --- UNIQUE: VOID-WARPED BULWARK ---
            ctx.fillStyle = "#25033c";
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(6, -8);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#8e44ad";
            ctx.lineWidth = penHero + 0.5;
            ctx.stroke();

            ctx.strokeStyle = "#e84393";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.moveTo(-5, 0);
            ctx.lineTo(5, 0);
            ctx.stroke();
          } else if (noun.includes("kite")) {
            // --- KITE SHIELD (Tall & Rounded Taper) ---
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.moveTo(-5.5, -9);
            ctx.quadraticCurveTo(0, -11, 5.5, -9); // Curved top
            ctx.lineTo(7, -1);
            ctx.lineTo(0, 11); // Long pointer
            ctx.lineTo(-7, -1);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero + 0.5;
            ctx.stroke();

            // Central heraldry cross matching quality tier
            ctx.strokeStyle = tierColorFallback;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -8.5);
            ctx.lineTo(0, 8);
            ctx.moveTo(-4.5, -1.5);
            ctx.lineTo(4.5, -1.5);
            ctx.stroke();
          } else if (noun.includes("tower")) {
            // --- TOWER SHIELD (Heavy Protective Rectangle) ---
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.roundRect(-7, -9.5, 14, 19, [1.5]);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero + 0.5;
            ctx.stroke();

            // Inward border frame matching quality tier
            ctx.strokeStyle = tierColorFallback;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.roundRect(-5, -7.5, 10, 15, [1]);
            ctx.stroke();

            // Central horizontal reinforcing band
            ctx.strokeStyle = "#1c1c1f";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-7, 0);
            ctx.lineTo(7, 0);
            ctx.stroke();
          } else if (noun.includes("buckler")) {
            // --- BUCKLER (Small Circular Shield) ---
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.arc(0, 1, 9.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero + 0.5;
            ctx.stroke();

            // Quality indicator ring
            ctx.strokeStyle = tierColorFallback;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 1, 6.5, 0, Math.PI * 2);
            ctx.stroke();

            // Core steel boss center rivet
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(0, 1, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          } else {
            // --- DEFAULT / HEATER SHIELD (The exact shape you love) ---
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(6, -8);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero + 0.5;
            ctx.stroke();

            // Draw inner quality-aligned framing border
            ctx.beginPath();
            ctx.moveTo(-4, -6.5);
            ctx.lineTo(4, -6.5);
            ctx.lineTo(5.5, -0.5);
            ctx.lineTo(0, 7.5);
            ctx.lineTo(-5.5, -0.5);
            ctx.closePath();
            ctx.strokeStyle = tierColorFallback;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          // Searing Steel Glint Sweep (Diagonal light reflections)
          let glintTime = (Date.now() / 2000) % 1.0;
          if (glintTime < 0.3) {
            let glintY = -9.5 + (glintTime / 0.3) * 19;
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-6, glintY);
            ctx.lineTo(6, glintY - 3);
            ctx.stroke();
            ctx.restore();
          }

          ctx.restore();

          // Orbiting Void Sparks (Aegis Unique only)
          if (
            isAegis &&
            (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
          ) {
            ctx.save();
            ctx.translate(6, 4 + bounce);
            ctx.rotate(-sway + 0.15); // Aligned to follow the updated shield position
            let orbitTime = Date.now() / 250;
            ctx.fillStyle = "#110221";
            ctx.strokeStyle = "#8e44ad";
            ctx.lineWidth = 1.0;
            for (let i = 0; i < 2; i++) {
              let angle = orbitTime + i * Math.PI;
              let ox = Math.cos(angle) * 14;
              let oy = Math.sin(angle) * 6;
              ctx.beginPath();
              ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }

          // Active Block Forcefield Flash centred on the Hero
          let timeSinceBlock = Date.now() - (stats.recentBlockTime || 0);
          if (
            timeSinceBlock < 250 &&
            (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
          ) {
            let opacity = (250 - timeSinceBlock) / 250;
            let currentR = 24 + (1.0 - opacity) * 6;
            ctx.save();
            ctx.strokeStyle = tierColorFallback;
            ctx.fillStyle = window.hexToRgba
              ? window.hexToRgba(tierColorFallback, 0.15 * opacity)
              : `rgba(52, 152, 219, ${0.15 * opacity})`;
            ctx.lineWidth = 2.0;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              let angle = (i * Math.PI) / 3;
              let hx = Math.cos(angle) * currentR;
              let hy = Math.sin(angle) * currentR + 4 + bounce;
              ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        } else if (subType === "tome") {
          ctx.save();
          let tomeFloat = Math.sin(Date.now() / 200) * 5;
          ctx.translate(25, -15 + bounce + tomeFloat); // Elevated and extended further forward to float heroically
          ctx.rotate(Math.PI / 12);
          ctx.rotate(Math.PI / 12);

          let tomeItem = equipped.subweapon;
          let isUniqueConduit = tomeItem && tomeItem.isUniqueConduit;

          // Unified Rarity/Stars Resolver (Uniques are treated as 5★)
          let stars = tomeItem
            ? tomeItem.statsRolled === "UNIQUE"
              ? 5
              : tomeItem.statsRolled || 0
            : 0;
          if (isWatch || isChronicle || isUniqueConduit) {
            stars = 5;
          }

          let tierColorFallbackTome = window.getTierColor(
            tomeItem
              ? tomeItem.statsRolled === "UNIQUE"
                ? 5
                : tomeItem.statsRolled
              : 0,
          );
          if (isWatch) tierColorFallbackTome = "#d4af37";
          else if (isChronicle) tierColorFallbackTome = "#f1c40f";
          else if (isUniqueConduit) tierColorFallbackTome = "#9b59b6";

          let rgbVals = window.hexToRgbValues
            ? window.hexToRgbValues(tierColorFallbackTome)
            : "155, 89, 182";

          // 3D Orbital properties
          let R = 15;
          let R_minor = 7;
          let orbitTime = Date.now() / 280;

          // Parametric calculation of points on 3D-tilted orbital planes
          let getOrbPos = (i) => {
            let phi = i * (Math.PI / stars) + Math.PI / 12;
            let theta = orbitTime + i * ((Math.PI * 2) / stars);

            let ox =
              R * Math.cos(theta) * Math.cos(phi) -
              R_minor * Math.sin(theta) * Math.sin(phi);
            let oy =
              R * Math.cos(theta) * Math.sin(phi) +
              R_minor * Math.sin(theta) * Math.cos(phi) -
              1;
            let oz = Math.sin(theta); // Depth indicator

            return { ox, oy, oz, phi };
          };

          // 1. Draw continuous translucent orbit rings behind the Tome
          if (stars > 0) {
            ctx.save();
            ctx.lineWidth = 0.6;
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              ctx.strokeStyle = `rgba(${rgbVals}, 0.08)`;
              ctx.beginPath();
              ctx.ellipse(0, -1, R, R_minor, pos.phi, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 2. Draw orbs that are rotating behind the book (oz < 0)
          if (stars > 0) {
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              if (pos.oz < 0) {
                ctx.save();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = tierColorFallbackTome;
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }

          // 3. Draw Book / Unique Tome Core Body Graphics
          if (isWatch) {
            ctx.fillStyle = "#d4af37";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fdf6e2";
            ctx.beginPath();
            ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "#111";
            ctx.lineWidth = 1.2;
            let clockTime = Date.now() / 300;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(clockTime) * 4.5, Math.sin(clockTime) * 4.5);
            ctx.stroke();
          } else if (isChronicle) {
            ctx.fillStyle = "#111116";
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-5, -7, 10, 14, [1.5]);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.fillRect(3.5, -6, 1.5, 12);
            let pulseRad = 12 + Math.sin(Date.now() / 150) * 2;
            ctx.strokeStyle = "rgba(241, 196, 15, 0.25)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
            ctx.stroke();
          } else if (isUniqueConduit) {
            // --- UNIQUE: CONDUIT OF THE LEXICON ---
            ctx.fillStyle = "#0c0515"; // Deep occult violet cover
            ctx.strokeStyle = "#9b59b6";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(-5, -7, 10, 14, [1.5]);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(3.5, -6, 1.5, 12); // Paper edges
            ctx.fillStyle = "#2ecc71"; // Emerald core emblem
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            let pulseRad = 12 + Math.sin(Date.now() / 150) * 2;
            ctx.strokeStyle = "rgba(46, 204, 113, 0.25)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(0, 0, pulseRad, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            let nounTome =
              tomeItem && tomeItem.noun ? tomeItem.noun.toLowerCase() : "";

            // Magical Rarity Glow Aura (Behind-the-book baseline)
            let auraRadius = 14 + Math.sin(Date.now() / 150) * 4;
            let auraGrad = ctx.createRadialGradient(
              0,
              -1,
              1,
              0,
              -1,
              auraRadius,
            );
            auraGrad.addColorStop(0, `rgba(${rgbVals}, 0.65)`);
            auraGrad.addColorStop(0.5, `rgba(${rgbVals}, 0.2)`);
            auraGrad.addColorStop(1, `rgba(${rgbVals}, 0)`);
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(0, -1, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            // Resolve custom Book Cover styles
            let coverColor = "#8e44ad"; // Default magic purple
            if (nounTome.includes("grimoire"))
              coverColor = "#1b002a"; // Deep occult black
            else if (nounTome.includes("codex"))
              coverColor = "#784212"; // Antique brass/bronze
            else if (nounTome.includes("lexicon"))
              coverColor = "#1b4f72"; // Scholar blue
            else if (nounTome.includes("chronicle")) coverColor = "#4d1a00"; // Rustic relic leather

            ctx.fillStyle = coverColor;
            ctx.beginPath();
            ctx.roundRect(-6, -8, 12, 14, [1.5]);
            ctx.fill();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.stroke();

            // Draw book spine on left binding edge
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.fillRect(-6, -8, 3, 14);

            // Draw paper edges on the right
            ctx.fillStyle = "#f5f5dc";
            ctx.beginPath();
            ctx.rect(4, -7, 1.5, 12);
            ctx.fill();
            ctx.stroke();

            // Render detailed central cover glyphs
            ctx.save();
            if (nounTome.includes("grimoire")) {
              ctx.fillStyle = "#f1c40f";
              ctx.beginPath();
              ctx.arc(1, -1, 2.2, -Math.PI / 2, Math.PI / 2, false);
              ctx.quadraticCurveTo(2.0, -1, 1, -3.2);
              ctx.closePath();
              ctx.fill();
            } else if (nounTome.includes("codex")) {
              ctx.strokeStyle = "#bdc3c7";
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.arc(1, -1, 2, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = tierColorFallbackTome;
              ctx.beginPath();
              ctx.arc(1, -1, 1, 0, Math.PI * 2);
              ctx.fill();
            } else if (nounTome.includes("lexicon")) {
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.ellipse(1, -1, 2.5, 1.3, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = tierColorFallbackTome;
              ctx.beginPath();
              ctx.arc(1, -1, 0.8, 0, Math.PI * 2);
              ctx.fill();
            } else if (nounTome.includes("chronicle")) {
              ctx.fillStyle = "#f1c40f";
              ctx.beginPath();
              ctx.moveTo(-1, -3);
              ctx.lineTo(3, -3);
              ctx.lineTo(1, -1);
              ctx.lineTo(3, 1);
              ctx.lineTo(-1, 1);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillStyle = tierColorFallbackTome;
              ctx.beginPath();
              ctx.arc(1, -1, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
            ctx.restore();
          }

          // 4. Draw orbs that are rotating in front of the book (oz >= 0)
          if (stars > 0) {
            for (let i = 0; i < stars; i++) {
              let pos = getOrbPos(i);
              if (pos.oz >= 0) {
                ctx.save();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 0.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = tierColorFallbackTome;
                ctx.beginPath();
                ctx.arc(pos.ox, pos.oy, 2.0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            }
          }

          ctx.restore();
        }
      }
    };

    const drawBodyAndCostume = () => {
      let costume =
        stats.equippedCostume ||
        stats.equipped_costume ||
        (equipped && (equipped.equippedCostume || equipped.equipped_costume)) ||
        "knight";

      switch (costume) {
        case "shinobi":
          {
            let shinobiGiColor = skin === "default" ? "#15151c" : bodyColor;
            let shinobiMaskColor = skin === "default" ? "#0d0d10" : armorColor;
            let shinobiSashColor = skin === "default" ? "#3498db" : armorColor;
            let shinobiScarfColor = capeColor;
            let shinobiEyeColor = eyeColor;

            // 1. Single angled Katana Sheath on the Back (Classic 3/4 profile)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            ctx.save();
            ctx.translate(-5, 2 + bounce);
            ctx.rotate(-Math.PI / 3.5); // Angled back-left
            ctx.fillStyle = "#111115"; // Black sheath
            ctx.fillRect(-2, -14, 4, 18);
            ctx.strokeRect(-2, -14, 4, 18);

            // Guard & Hilt
            ctx.fillStyle = "#d4af37"; // Golden guard
            ctx.fillRect(-4, -16, 8, 2.5);
            ctx.strokeRect(-4, -16, 8, 2.5);

            ctx.fillStyle = shinobiSashColor; // Wrapped hilt matching color accents
            ctx.fillRect(-2, -23, 4, 7);
            ctx.strokeRect(-2, -23, 4, 7);
            ctx.fillStyle = "#111";
            // Diamond wraps on hilt
            ctx.fillRect(-1, -21, 2, 2);
            ctx.fillRect(-1, -18, 2, 2);
            ctx.restore();
            ctx.restore();

            // 2. Flowing Scarf / Shinobi Ribbons (Procedural Inertia & Wind-Drag Lerping)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.fillStyle = shinobiScarfColor;
            ctx.lineJoin = "round";

            let isMoving =
              options.isMoving !== undefined
                ? options.isMoving
                : options.isMainHero && window.player && window.player.isMoving;

            // Initialize or update persistent procedural weight on the character state object
            if (playerStats.scarfWeight === undefined) {
              try {
                playerStats.scarfWeight = 0.0;
              } catch (e) {
                playerStats = { ...playerStats, scarfWeight: 0.0 };
              }
            }

            let targetWeight = isMoving ? 1.0 : 0.0;
            try {
              playerStats.scarfWeight +=
                (targetWeight - playerStats.scarfWeight) * 0.12;
            } catch (e) {}
            let w = playerStats.scarfWeight || 0.0;

            // Query fully resolved movement speed dynamically (checking fast cache first)
            let resolvedSpeed = 10;
            if (
              window.cachedPlayerStats &&
              window.cachedPlayerStats.moveSpeed
            ) {
              resolvedSpeed = window.cachedPlayerStats.moveSpeed;
            } else if (typeof window.resolvePlayerStats === "function") {
              let rp = window.resolvePlayerStats();
              if (rp && rp.moveSpeed) resolvedSpeed = rp.moveSpeed;
            }

            // Dynamic wind-drag velocity ratio capped comfortably above target max
            let speedRatio = Math.min(1.2, resolvedSpeed / 500.0);

            // Variable wave frequency and tighter, rapid flutters at high speeds
            let waveFreq = 0.1 + speedRatio * 0.16;
            let ampY = Math.max(1.5, 4.0 - 2.5 * speedRatio);
            let ampX = 1.0 + 2.0 * speedRatio;

            let waveCycle = Date.now() * waveFreq;
            let flutterY1 = Math.sin(waveCycle / 12) * ampY;
            let flutterY2 = Math.cos(waveCycle / 15) * (ampY * 0.85);
            let flutterX = Math.cos(waveCycle / 12) * ampX;

            // Idle breathing waves (low-frequency, slow sag)
            let idleSway1 = Math.sin(Date.now() / 800) * 1.5;
            let idleSway2 = Math.cos(Date.now() / 1000) * 1.0;

            // --- TOP RIBBON TAIL INTERPOLATION ---
            let cpX1_idle = -12 + idleSway1;
            let cpY1_idle = 4 + bounce;
            let cpX1_run = -12 - 18 * speedRatio + flutterX;
            let cpY1_run = 4 - 6 * speedRatio + flutterY1 + bounce;

            let epX1_idle = -14 + idleSway1;
            let epY1_idle = 12 + idleSway2 + bounce;
            let epX1_run = -16 - 36 * speedRatio + flutterX * 1.5;
            let epY1_run = 8 - 10 * speedRatio + flutterY2 + bounce;

            // Blended control/end points
            let cpX1 = cpX1_idle + (cpX1_run - cpX1_idle) * w;
            let cpY1 = cpY1_idle + (cpY1_run - cpY1_idle) * w;
            let epX1 = epX1_idle + (epX1_run - epX1_idle) * w;
            let epY1 = epY1_idle + (epY1_run - epY1_idle) * w;

            // Draw Top Ribbon
            ctx.beginPath();
            ctx.moveTo(-6, -2 + bounce);
            ctx.quadraticCurveTo(cpX1, cpY1, epX1, epY1);
            ctx.lineTo(epX1 + 4 * (1 - w), epY1 + 2 * w);
            ctx.quadraticCurveTo(cpX1 + 4, cpY1 + 4, -6, 2 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // --- BOTTOM RIBBON TAIL INTERPOLATION ---
            let cpX2_idle = -10 + idleSway2;
            let cpY2_idle = 10 + bounce;
            let cpX2_run = -10 - 16 * speedRatio - flutterX;
            let cpY2_run = 10 - 8 * speedRatio - flutterY1 + bounce;

            let epX2_idle = -11 + idleSway2;
            let epY2_idle = 24 + idleSway1 + bounce;
            let epX2_run = -14 - 34 * speedRatio - flutterX * 1.5;
            let epY2_run = 18 - 16 * speedRatio - flutterY2 + bounce;

            // Blended control/end points
            let cpX2 = cpX2_idle + (cpX2_run - cpX2_idle) * w;
            let cpY2 = cpY2_idle + (cpY2_run - cpY2_idle) * w;
            let epX2 = epX2_idle + (epX2_run - epX2_idle) * w;
            let epY2 = epY2_idle + (epY2_run - epY2_idle) * w;

            // Draw Bottom Ribbon
            ctx.beginPath();
            ctx.moveTo(-6, 2 + bounce);
            ctx.quadraticCurveTo(cpX2, cpY2, epX2, epY2);
            ctx.lineTo(epX2 + 4 * (1 - w), epY2 + 2 * w);
            ctx.quadraticCurveTo(cpX2 + 4, cpY2 + 4, -6, 5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 3. Side-Profile Stealth Gi (Body)
            ctx.fillStyle = shinobiGiColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16); // Centered body box
            ctx.fill();
            ctx.stroke();

            // Crossed Gi collar lapels (facing right, so front overlap slopes from left down to right)
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(2, 9 + bounce);
            ctx.moveTo(3, bounce);
            ctx.lineTo(-3, 11 + bounce);
            ctx.stroke();

            // 4. Sash Belt with Back-Flowing Ties
            ctx.fillStyle = shinobiSashColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.rect(-9, 7 + bounce, 15, 3.5);
            ctx.fill();
            ctx.stroke();

            // Belt ribbons flowing back-left
            ctx.save();
            ctx.fillStyle = shinobiSashColor;
            ctx.translate(-8, 9 + bounce);
            ctx.rotate(-Math.PI / 6 + Math.sin(Date.now() / 100) * 0.12);
            ctx.beginPath();
            ctx.rect(-1.5, 0, 3, 11);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 5. Right-Facing Masked Hood (Head)
            ctx.fillStyle = shinobiGiColor;
            ctx.beginPath();
            // Left-weighted round hood representing head looking right
            ctx.roundRect(-10, -14 + bounce, 18, 16, [6, 4, 4, 6]);
            ctx.fill();
            ctx.stroke();

            // Face Opening (Slit offset to the right, showing right-facing orientation)
            ctx.fillStyle = shinobiMaskColor;
            ctx.beginPath();
            ctx.roundRect(-2, -11 + bounce, 9, 6, [2]);
            ctx.fill();
            ctx.stroke();

            // Forehead Protector Plate (Headband / Hitai-ate tilted right)
            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.rect(-7, -14 + bounce, 12, 3);
            ctx.fill();
            ctx.stroke();

            // Headband ties blowing back-left
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            ctx.fillStyle = shinobiGiColor;
            ctx.translate(-10, -12 + bounce);
            ctx.rotate(-Math.PI / 4 + Math.sin(Date.now() / 90) * 0.15);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-8, -2);
            ctx.lineTo(-6, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 6. Single Focused, Intense Glowing Eye looking right
            ctx.fillStyle = shinobiEyeColor;
            ctx.shadowBlur = 8;
            ctx.shadowColor = shinobiEyeColor;
            ctx.beginPath();
            // Tilted focused single ninja eye slot
            ctx.moveTo(1, -9 + bounce);
            ctx.lineTo(5, -9 + bounce);
            ctx.lineTo(4, -7.5 + bounce);
            ctx.lineTo(1.5, -8 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          break;

        case "archmage":
          {
            // Recolor default skin robes to a gorgeous high-fantasy purple/gold/crimson theme
            let robeColor = skin === "default" ? "#34225c" : bodyColor;
            let trimColor = skin === "default" ? "#f1c40f" : armorColor;
            let sashColor = skin === "default" ? "#e74c3c" : capeColor;

            // 1. High Sorcerer Collar (frames the back of the neck)
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.moveTo(-10, bounce - 4);
            ctx.quadraticCurveTo(-14, bounce - 18, -11, bounce - 14); // collar peak back-left
            ctx.lineTo(-4, bounce - 10);
            ctx.lineTo(2, bounce - 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Flowing Back Cape (sweeps back-left with motion drag)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(-16, 10 + bounce, -18, 16 + bounce);
            ctx.lineTo(-6, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 2. Main Robe Torso (canted for a right-facing posture)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(-12, 16 + bounce);
            ctx.lineTo(6, 16 + bounce);
            ctx.lineTo(5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Flared casting sleeves
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.lineTo(-13, 8 + bounce);
            ctx.lineTo(-7, 10 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(5, bounce);
            ctx.lineTo(11, 8 + bounce);
            ctx.lineTo(5, 10 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Crossed Robe Lapels & Gold Trim down front overlap
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(-8, bounce);
            ctx.lineTo(4, 9 + bounce);
            ctx.stroke();

            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.moveTo(-2, bounce);
            ctx.lineTo(4, 9 + bounce);
            ctx.lineTo(1, 11 + bounce);
            ctx.lineTo(-5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.lineWidth = penHero;

            // 3. Ornate Sash Belt & Back-flowing ribbon (wind-drag)
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.rect(-9, 8 + bounce, 15, 3.5);
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = sashColor;
            ctx.translate(-9, 10 + bounce);
            ctx.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.1); // sweeps back-left
            ctx.beginPath();
            ctx.rect(-2, 0, 4, 11);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Glowing chest crystal amulet
            ctx.fillStyle = "#00d2ff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00d2ff";
            ctx.beginPath();
            ctx.moveTo(-1, 2 + bounce);
            ctx.lineTo(1.5, 4 + bounce);
            ctx.lineTo(-1, 6 + bounce);
            ctx.lineTo(-3.5, 4 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 4. Majestic Flowing White Beard (Blowing backwards/left from right-facing chin)
            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.moveTo(3, -4 + bounce); // originates at chin
            ctx.bezierCurveTo(-1, 2 + bounce, -12, 1 + bounce, -14, 8 + bounce); // flows left
            ctx.quadraticCurveTo(-15, 12 + bounce, -12, 13 + bounce); // tail curl
            ctx.bezierCurveTo(-9, 10 + bounce, -2, 6 + bounce, 2, 2 + bounce); // returns
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Beard combed texture highlights
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(1, -2 + bounce);
            ctx.quadraticCurveTo(-3, 3 + bounce, -10, 8 + bounce);
            ctx.moveTo(2, 0 + bounce);
            ctx.quadraticCurveTo(-1, 5 + bounce, -6, 9 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Hood Cowl Base (Open to the right, rounded to the back-left)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.roundRect(-9, -15 + bounce, 16, 16, [8, 2, 2, 8]);
            ctx.fill();
            ctx.stroke();

            // Cowl Interior Deep Arcane Shadow
            ctx.fillStyle = "#111116";
            ctx.beginPath();
            ctx.roundRect(-2, -13 + bounce, 8, 12, [2, 6, 6, 2]);
            ctx.fill();
            ctx.stroke();

            // 6. Angled Ornate Wizard Hat Brim
            ctx.save();
            ctx.translate(-1, -15 + bounce);
            ctx.rotate(Math.PI / 18); // Tilted forward slightly
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Curved Pointy Hat Cone (Curving backwards/left)
            ctx.fillStyle = robeColor;
            ctx.beginPath();
            ctx.moveTo(-10, -15 + bounce);
            ctx.bezierCurveTo(
              -15,
              -24 + bounce,
              -16,
              -30 + bounce,
              -14,
              -36 + bounce,
            ); // curved slouch tip
            ctx.quadraticCurveTo(-10, -32 + bounce, 7, -15 + bounce); // right side slant down
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gilded Hat Band
            ctx.fillStyle = sashColor;
            ctx.beginPath();
            ctx.moveTo(-10, -15 + bounce);
            ctx.lineTo(-12, -18 + bounce);
            ctx.lineTo(6, -17 + bounce);
            ctx.lineTo(7, -15 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Golden Hat Buckle
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.rect(-3, -19 + bounce, 5, 4);
            ctx.fill();
            ctx.stroke();

            // 7. Arcane Glowing Eye (Peering right from deep shadow)
            ctx.fillStyle = "#00e5ff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00e5ff";
            ctx.beginPath();
            ctx.moveTo(1, -9 + bounce);
            ctx.lineTo(4.5, -9 + bounce);
            ctx.lineTo(3.5, -7.5 + bounce);
            ctx.lineTo(1.5, -8 + bounce);
            ctx.closePath();
            ctx.fill();

            // 8. Floating Orb/Runic Sparks (Orbiting behind shoulders)
            let cycle = Date.now() / 250;
            let runeX = -16 + Math.sin(cycle) * 2;
            let runeY = -4 + Math.cos(cycle) * 3 + bounce;
            ctx.fillStyle = "#00e5ff";
            ctx.shadowColor = "#00e5ff";
            ctx.beginPath();
            ctx.moveTo(runeX, runeY - 3);
            ctx.lineTo(runeX + 2, runeY);
            ctx.lineTo(runeX, runeY + 3);
            ctx.lineTo(runeX - 2, runeY);
            ctx.closePath();
            ctx.fill();

            let runeX2 = -12 + Math.cos(cycle + 2) * 1.5;
            let runeY2 = -12 + Math.sin(cycle + 2) * 2 + bounce;
            ctx.fillStyle = "#9b59b6";
            ctx.shadowColor = "#9b59b6";
            ctx.beginPath();
            ctx.moveTo(runeX2, runeY2 - 2);
            ctx.lineTo(runeX2 + 1.5, runeY2);
            ctx.lineTo(runeX2, runeY2 + 2);
            ctx.lineTo(runeX2 - 1.5, runeY2);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0; // reset
          }
          break;

        case "cyber":
          {
            // Localized color mapping for sleek cybernetic default elements
            let suitColor = skin === "default" ? "#0f172a" : bodyColor; // Sleek carbon slate-black
            let plateColor = skin === "default" ? "#1e293b" : armorColor; // Steel panel grey
            let neonColor = skin === "default" ? "#00f0ff" : eyeColor; // Luminescent neon cyan

            // 1. Active Jetpack Thruster & Exhaust Plume (Streams back-left)
            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.roundRect(-12, 1 + bounce, 5, 10, [2]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#111827";
            ctx.save();
            ctx.translate(-11, 6 + bounce);
            ctx.rotate(Math.PI / 6); // Angled down-left
            ctx.beginPath();
            ctx.moveTo(0, -3.5);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.lineTo(0, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Pulsating glowing plasma plume
            let plumeCycle = Date.now() / 60;
            let plumeLength = 12 + Math.sin(plumeCycle) * 3;
            ctx.fillStyle = neonColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.moveTo(-4, -3);
            ctx.quadraticCurveTo(
              -4 - plumeLength * 0.6,
              -1 + Math.cos(plumeCycle) * 1.5,
              -4 - plumeLength,
              0,
            );
            ctx.quadraticCurveTo(
              -4 - plumeLength * 0.6,
              1 + Math.cos(plumeCycle) * 1.5,
              -4,
              3,
            );
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            ctx.restore();

            // 2. Sleek Carbon Torso & Limb Plating
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.lineTo(-9, 14 + bounce);
            ctx.lineTo(5, 14 + bounce);
            ctx.lineTo(5, bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // High-tech shoulder guard pauldrons
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.roundRect(-9, bounce - 2, 4, 6, [1.5]);
            ctx.roundRect(4, bounce - 2, 4, 6, [1.5]);
            ctx.fill();
            ctx.stroke();

            // 3. Neon Grid Circuit Pipes
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-4, 2 + bounce);
            ctx.lineTo(-4, 11 + bounce);
            ctx.lineTo(2, 11 + bounce);
            ctx.moveTo(0, 5 + bounce);
            ctx.lineTo(4, 5 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 4. Pulsating Chest Arc Reactor Core
            let corePulse = 2.4 + Math.sin(Date.now() / 150) * 0.8;
            ctx.fillStyle = "#ffffff"; // pure white core
            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.arc(2, 6 + bounce, corePulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Sleek Right-Facing Aerodynamic Helmet
            ctx.fillStyle = suitColor;
            ctx.beginPath();
            ctx.moveTo(-10, -14 + bounce);
            ctx.quadraticCurveTo(-11, -16 + bounce, -8, -16 + bounce); // round back
            ctx.lineTo(4, -14 + bounce); // sleek top
            ctx.quadraticCurveTo(8, -12 + bounce, 7, -5 + bounce); // front jaw curve
            ctx.lineTo(3, 1 + bounce); // chin
            ctx.lineTo(-7, 1 + bounce); // neck seal
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Ear-Com Node & Antenna on the back-left
            ctx.fillStyle = plateColor;
            ctx.beginPath();
            ctx.arc(-8, -7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = neonColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-8, -7 + bounce);
            ctx.lineTo(-12, -15 + bounce); // angled antenna
            ctx.stroke();

            ctx.fillStyle = neonColor;
            ctx.beginPath();
            ctx.arc(-12, -15 + bounce, 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 6. Streamlined Glowing Visor (Facing Right)
            ctx.fillStyle = neonColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = neonColor;
            ctx.beginPath();
            ctx.moveTo(-2, -11 + bounce);
            ctx.lineTo(4, -11 + bounce);
            ctx.quadraticCurveTo(7.5, -9 + bounce, 6.5, -5 + bounce); // sleek curved visor front
            ctx.lineTo(2, -5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 7. Floating Holographic HUD target reticle in front of visor
            let hudTime = Date.now() / 500;
            let hudX = 13;
            let hudY = -7 + bounce;
            ctx.strokeStyle = "rgba(0, 240, 255, 0.45)"; // Translucent holographic cyan
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(hudX, hudY, 5, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshair ticks
            ctx.beginPath();
            ctx.moveTo(hudX - 7, hudY);
            ctx.lineTo(hudX - 5, hudY);
            ctx.moveTo(hudX + 5, hudY);
            ctx.lineTo(hudX + 7, hudY);
            ctx.moveTo(hudX, hudY - 7);
            ctx.lineTo(hudX, hudY - 5);
            ctx.moveTo(hudX, hudY + 5);
            ctx.lineTo(hudX, hudY + 7);
            ctx.stroke();
          }
          break;

        case "jackolantern":
          {
            // Localized color mapping for organic seasonal elements
            let pumpkinColor = skin === "default" ? "#e67e22" : bodyColor; // Pumpkin Orange
            let leafColor1 = skin === "default" ? "#c0392b" : capeColor; // Maple Red
            let leafColor2 = skin === "default" ? "#d35400" : armorColor; // Oak Orange
            let stemColor = skin === "default" ? "#27ae60" : capeColor; // Mossy green stem
            let glowColor = skin === "default" ? "#ff9f43" : eyeColor; // Inside candle flame glow (flame tint)

            // Dynamic wind/motion billow values
            let capeSway = Math.sin(Date.now() / 150) * 3;

            // 1. Layered Back-flowing Autumn Leaf Cape (sweeps and billows left)
            ctx.fillStyle = leafColor1;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(
              -15 + capeSway * 0.5,
              6 + bounce,
              -17 + capeSway,
              16 + bounce,
            );
            ctx.lineTo(-4, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Overlapping secondary leaf layer
            ctx.fillStyle = leafColor2;
            ctx.beginPath();
            ctx.moveTo(-4, bounce + 2);
            ctx.quadraticCurveTo(
              -11 + capeSway * 0.4,
              10 + bounce,
              -13 + capeSway * 0.8,
              16 + bounce,
            );
            ctx.lineTo(-2, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Leaf vein serrations waving in the wind
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-17 + capeSway, 16 + bounce);
            ctx.lineTo(-14 + capeSway * 0.7, 13 + bounce);
            ctx.lineTo(-13 + capeSway * 0.8, 16 + bounce);
            ctx.lineTo(-9 + capeSway * 0.5, 12 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 2. Vine-Woven Spooky Chestplate & Pauldrons
            ctx.fillStyle = "#1e130c"; // Dark earthy under-girth
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            // Intersecting thorny branches
            ctx.strokeStyle = "#5c3a21";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-6, 2 + bounce);
            ctx.lineTo(4, 14 + bounce);
            ctx.moveTo(4, 2 + bounce);
            ctx.lineTo(-6, 14 + bounce);
            ctx.moveTo(-7, 8 + bounce);
            ctx.lineTo(5, 8 + bounce);
            ctx.stroke();

            // Internal Magma cracks
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-4, 4 + bounce);
            ctx.lineTo(2, 10 + bounce);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Leaf tattered shoulder guards
            ctx.fillStyle = leafColor2;
            ctx.beginPath();
            ctx.roundRect(-10, bounce - 2, 4, 5, [1]);
            ctx.roundRect(4, bounce - 2, 4, 5, [1]);
            ctx.fill();
            ctx.stroke();

            // 3. Swirling Autumn Leaf Orbit (Swirls around feet in 3D perspective!)
            for (let i = 0; i < 3; i++) {
              let leafT =
                (Date.now() / 1000 + i * ((Math.PI * 2) / 3)) % (Math.PI * 2);
              let lx = Math.cos(leafT) * 12;
              let ly = 16 + Math.sin(leafT) * 3 + bounce;
              ctx.fillStyle = i % 2 === 0 ? leafColor1 : leafColor2;
              ctx.save();
              ctx.translate(lx, ly);
              ctx.rotate(leafT * 2.5);
              ctx.beginPath();
              ctx.ellipse(0, 0, 3, 1.3, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }

            // 4. Ribbed Pumpkin Head with Rotational Breathing Wobble
            let pX = -1;
            let pY = -7 + bounce;
            let pRad = 11.0; // Slightly scaled up for a more epic "pumpkin head" presence!

            let headWobble = Math.sin(Date.now() / 180) * 0.05;

            ctx.save();
            ctx.translate(pX, pY);
            ctx.rotate(headWobble);

            // Base Pumpkin sphere
            ctx.fillStyle = pumpkinColor;
            ctx.beginPath();
            ctx.arc(0, 0, pRad, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Spherical ribs wrap (creates 3D volume facing right)
            ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, pRad * 0.7, pRad, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, pRad * 0.35, pRad, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Curly Green Stem (Sways back-left based on head rotation)
            let stemSway = Math.sin(Date.now() / 140) * 0.15;
            ctx.save();
            ctx.translate(0, -pRad);
            ctx.rotate(stemSway - Math.PI / 8);
            ctx.strokeStyle = stemColor;
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-3, -6, -5, -4);
            ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 5. Carved Face with Real-Time Candle Flicker
            let candleFlicker = 0.85 + Math.sin(Date.now() / 60) * 0.15;
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 10 * candleFlicker;
            ctx.shadowColor = glowColor;

            // Slanted sinister single eye
            ctx.beginPath();
            ctx.moveTo(2, -3);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 0.5);
            ctx.closePath();
            ctx.fill();

            // Toothy grin curving upwards to the right
            ctx.beginPath();
            ctx.moveTo(-2, 2.5);
            ctx.lineTo(1, 5.5);
            ctx.lineTo(3, 3.5);
            ctx.lineTo(6, 6.5);
            ctx.lineTo(8, 1.5); // smile tip curves up
            ctx.lineTo(5, 3.5);
            ctx.lineTo(3, 1.5);
            ctx.lineTo(1, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0; // reset

            // Deep black bevel outlines inside carved sections for high contrast
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(2, -3);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 0.5);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-2, 2.5);
            ctx.lineTo(1, 5.5);
            ctx.lineTo(3, 3.5);
            ctx.lineTo(6, 6.5);
            ctx.lineTo(8, 1.5);
            ctx.lineTo(5, 3.5);
            ctx.lineTo(3, 1.5);
            ctx.lineTo(1, 3.5);
            ctx.closePath();
            ctx.stroke();

            ctx.restore(); // Restore head transform matrix

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // 6. Zero-Allocation Deterministic Drifting Embers (drifts back-left and rises!)
            for (let i = 0; i < 4; i++) {
              let seed = Math.sin(i * 123.45);
              let t = (Date.now() / 1100 + seed * 5) % 1.0; // normalised 0 to 1 loop over 1.1s
              let sparkX = pX - 2 - t * 18 + Math.sin(t * Math.PI * 2) * 2;
              let sparkY = pY - pRad + 2 - t * 22 + bounce;
              let alpha = 1.0 - t;
              ctx.fillStyle = `rgba(230, 126, 34, ${alpha * 0.85})`;
              ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
            }
          }
          break;

        case "santashelper":
          {
            let coatColor = skin === "default" ? "#d63031" : capeColor;
            let coatShadow = skin === "default" ? "#962d22" : bodyColor;
            let trimColor = "#ffffff"; // Fluffy white fur trim stays snow-white
            let goldColor = skin === "default" ? "#f1c40f" : armorColor;
            let leatherColor = "#2d3436"; // Charcoal leather belt
            let skinColor = "#ffddca"; // Healthy holiday skin
            let beardColor = "#ffffff"; // Pure white beard
            let beardShadow = "#cbd5e1"; // Beard shading depth

            // --- MOVEMENT & DIRECTION LERPING ---
            let isMoving =
              options.isMainHero && (!window.mob || !window.mob.isStopped);
            let stats = playerStats || window.playerStats || {};

            if (stats.santaSackSway === undefined) {
              stats.santaSackSway = 0;
            }
            let targetSway = isMoving ? 1.0 : 0.0;
            stats.santaSackSway += (targetSway - stats.santaSackSway) * 0.1;
            let swayWeight = stats.santaSackSway || 0;

            let time = Date.now();
            let capeSway = Math.sin(time / 130) * (1.8 + swayWeight * 2.5);
            let windFlutter = Math.sin(time / 90) * (0.5 + swayWeight * 1.5);

            // 1. ROYAL VELVET CLOAK (OVERLAPPING LAYERS & PROCEDURAL FLUTTER)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Back shadow cape layer
            ctx.fillStyle = coatShadow;
            ctx.beginPath();
            ctx.moveTo(-7, bounce);
            ctx.quadraticCurveTo(
              -15 + capeSway * 0.5,
              6 + bounce,
              -20 + capeSway + windFlutter,
              16 + bounce,
            );
            ctx.lineTo(-4, 16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Main bright velvet cape layer
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-6, bounce);
            ctx.quadraticCurveTo(
              -12 + capeSway * 0.4,
              7 + bounce,
              -17 + capeSway,
              15.5 + bounce,
            );
            ctx.lineTo(-2, 15.5 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Shimmering golden border
            ctx.strokeStyle = goldColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-5, 1 + bounce);
            ctx.quadraticCurveTo(
              -11 + capeSway * 0.4,
              7.5 + bounce,
              -15.5 + capeSway,
              14.5 + bounce,
            );
            ctx.stroke();

            // Reset line width
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;

            // Soft fluffy white trim on Cape Bottom
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            let hemX = -17 + capeSway;
            let hemY = 15.5 + bounce;
            ctx.ellipse(hemX, hemY, 4, 2, 0, 0, Math.PI * 2);
            ctx.ellipse(hemX + 3, hemY + 0.5, 3.5, 1.8, 0, 0, Math.PI * 2);
            ctx.ellipse(hemX + 6.5, hemY + 0.8, 3.2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 2. GIANT BURLAP TOY/SOUL SACK (SLUNG BACK-LEFT)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            let sackX = -12 - swayWeight * 2;
            let sackY = 5 + bounce;
            ctx.translate(sackX, sackY);
            ctx.rotate(-Math.PI / 10 + Math.sin(time / 200) * 0.05);

            // Draw Sack Shadow Backing
            ctx.fillStyle = "#6f4e37"; // Deep burlap brown shadow
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Main Sack Body
            let sackGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 8.5);
            sackGrad.addColorStop(0, "#a05a2c");
            sackGrad.addColorStop(1, "#7d471b");
            ctx.fillStyle = sackGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8.5, 7.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Green holiday patch with tiny stitches
            ctx.fillStyle = "#27ae60";
            ctx.beginPath();
            ctx.rect(-3, -5, 4.5, 4.5);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-3, -5);
            ctx.lineTo(-3, -0.5);
            ctx.moveTo(1.5, -5);
            ctx.lineTo(1.5, -0.5);
            ctx.moveTo(-3, -5);
            ctx.lineTo(1.5, -5);
            ctx.moveTo(-3, -0.5);
            ctx.lineTo(1.5, -0.5);
            ctx.stroke();

            // Golden ropes binding the sack mouth
            ctx.strokeStyle = goldColor;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(4, -3, 4, Math.PI * 0.6, Math.PI * 1.5);
            ctx.stroke();

            // Golden tie knot
            ctx.fillStyle = goldColor;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.ellipse(4.5, -3, 2, 1.2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 3. COZY CRIMSON SANTA COAT & BELT (BODY)
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Main coat block
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.rect(-8, bounce, 14, 16);
            ctx.fill();
            ctx.stroke();

            // Shaded coat contours
            ctx.fillStyle = coatShadow;
            ctx.beginPath();
            ctx.rect(-8, bounce, 4, 16);
            ctx.fill();

            // Center fluffy white fur lining down the front
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.roundRect(-2.5, bounce, 5, 16, [1.5]);
            ctx.fill();
            ctx.stroke();

            // Gold buttons flanking center line
            ctx.fillStyle = goldColor;
            ctx.beginPath();
            ctx.arc(-4.5, 4 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(-4.5, 12 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(3.5, 4 + bounce, 1.2, 0, Math.PI * 2);
            ctx.arc(3.5, 12 + bounce, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Leather Charcoal Belt
            ctx.fillStyle = leatherColor;
            ctx.beginPath();
            ctx.rect(-8.5, 7.5 + bounce, 15, 4);
            ctx.fill();
            ctx.stroke();

            // Giant Gold Buckle with cutout frame
            ctx.fillStyle = goldColor;
            ctx.beginPath();
            ctx.rect(-3.5, 6 + bounce, 7, 7);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = leatherColor;
            ctx.beginPath();
            ctx.rect(-1.5, 8 + bounce, 3, 3);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 4. SANTA'S CHEERFUL HEAD BASE (PEEKING SKIN, EYES, & FLUFFY BEARD)
            ctx.save();

            // Fill head skin
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
            ctx.fill();

            // Fluffy White Back Hair (behind ears/brim)
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.arc(-8, -9 + bounce, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-7, -4 + bounce, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 4b. THE MAJESTIC FLOATING BEARD (Drawn with individual path calls to prevent intersecting line bugs)
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            let beardCircles = [
              { x: 6, y: -3, r: 3.5 }, // Right cheek
              { x: 8.5, y: 1.5, r: 4.5 }, // Right mid
              { x: 7.5, y: 6.5, r: 5 }, // Right lower
              { x: 3, y: 9.5, r: 5.5 }, // Bottom center
              { x: -3, y: 8.5, r: 5 }, // Left lower
              { x: -6.5, y: 4, r: 4.5 }, // Left mid
              { x: -6, y: -1, r: 3.5 }, // Left cheek
            ];

            beardCircles.forEach((bc) => {
              ctx.beginPath();
              ctx.arc(bc.x, bc.y + bounce, bc.r, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });

            // Draw central mustache (overlaps the beard base)
            ctx.beginPath();
            ctx.ellipse(
              0.5,
              -4.5 + bounce,
              4,
              2.2,
              -Math.PI / 10,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(
              5.5,
              -4.5 + bounce,
              4,
              2.2,
              Math.PI / 10,
              0,
              Math.PI * 2,
            );
            ctx.fill();
            ctx.stroke();

            // 4c. EYES & EYEBROWS (Rendered over the top of the beard to guarantee 100% absolute visibility)
            ctx.fillStyle = "#1c1c1e"; // Solid black friendly eyes
            ctx.beginPath();
            ctx.arc(-2, -9 + bounce, 1.6, 0, Math.PI * 2);
            ctx.arc(3.5, -9 + bounce, 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Sparkly white eye glints
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-2.4, -9.4 + bounce, 0.5, 0, Math.PI * 2);
            ctx.arc(3.1, -9.4 + bounce, 0.5, 0, Math.PI * 2);
            ctx.fill();

            // White eyebrows
            ctx.fillStyle = beardColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(-4.5, -13 + bounce, 4, 2, [1]);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(1.5, -13 + bounce, 4, 2, [1]);
            ctx.fill();
            ctx.stroke();

            // Soft red cheek blush
            ctx.fillStyle = "rgba(231, 76, 60, 0.35)";
            ctx.beginPath();
            ctx.ellipse(-3.5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
            ctx.ellipse(5, -6.5 + bounce, 2, 1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rosy Button Nose
            ctx.fillStyle = "#ff8a80";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.beginPath();
            ctx.arc(3, -5.5 + bounce, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 5. RED VELVET FLOPPY SANTA CAP WITH INTEGRATED SWAY
            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            // Fluffy white cap brim sitting right at the crown
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.roundRect(-10.5, -16.5 + bounce, 18.5, 4.5, [2]);
            ctx.fill();
            ctx.stroke();

            // Draw the main red cap dome (solid bean-hat backing structure)
            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-10, -16 + bounce);
            ctx.quadraticCurveTo(-8, -25 + bounce, -1, -25 + bounce);
            ctx.quadraticCurveTo(5, -25 + bounce, 7, -16 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw the floppy crimson fold draping over the back-left
            let capSway = Math.sin(time / 160) * (1.8 + swayWeight * 2.2);
            let foldTipX = -13 + capSway;
            let foldTipY = -12 + bounce;

            ctx.fillStyle = coatColor;
            ctx.beginPath();
            ctx.moveTo(-3, -25 + bounce);
            ctx.quadraticCurveTo(-11, -22 + bounce, foldTipX, foldTipY);
            ctx.lineTo(foldTipX + 3, foldTipY - 1);
            ctx.quadraticCurveTo(-6, -24 + bounce, 2, -25 + bounce);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // White pom-pom dangling directly from the fold tip
            ctx.fillStyle = trimColor;
            ctx.beginPath();
            ctx.arc(foldTipX, foldTipY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();

            // 7. ACTIVE WINTER AURORA (SPARKLING SNOW EMBER SPARKS)
            if (options.isMainHero && !window.isGamePaused) {
              ctx.save();
              ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
              for (let i = 0; i < 4; i++) {
                let seed = Math.sin(i * 45.67);
                let t = (time / 1000 + seed * 6) % 1.0;
                let sparkX = -4 - t * 24 + Math.sin(t * Math.PI * 2) * 4;
                let sparkY = -15 - t * 16 + bounce;
                let size = 1.2 * (1.0 - t);
                ctx.fillRect(sparkX, sparkY, size, size);
              }
              ctx.restore();
            }
          }
          break;

        case "midsummer": {
          let leafGreen = skin === "default" ? "#2ecc71" : armorColor;
          let darkLeafGreen = skin === "default" ? "#1e824c" : bodyColor;
          let strapColor = "#5c3a21"; // Earthy leather straps
          let sunGold =
            skin === "default"
              ? "#f1c40f"
              : skin === "void"
                ? "#e84393"
                : "#f1c40f";
          let time = Date.now();
          let windSway = Math.sin(time / 140) * 1.8;

          // UNIQUE ORGANIC LEAF DRAWING ENGINE (Self-contained helper)
          let drawLeaf = (cx, cy, r, angle, color) => {
            ctx.save();
            ctx.translate(cx, cy + bounce);
            ctx.rotate(angle);
            ctx.fillStyle = color;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = penHero;
            ctx.lineJoin = "round";

            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(r * 0.65, -r * 0.1, 0, r); // Pointy right-curve
            ctx.quadraticCurveTo(-r * 0.65, -r * 0.1, 0, -r); // Pointy left-curve
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Leaf middle vein
            ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.7);
            ctx.lineTo(0, r * 0.7);
            ctx.stroke();

            ctx.restore();
          };

          // 1. CASCADING IVY LEAF CANOPY (CAPE - Flowing Back-Left)
          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.lineJoin = "round";

          // Back deep leaf cape layer
          ctx.fillStyle = darkLeafGreen;
          ctx.beginPath();
          ctx.moveTo(-5, bounce);
          ctx.quadraticCurveTo(
            -14 + windSway,
            5 + bounce,
            -16 + windSway,
            15 + bounce,
          );
          ctx.quadraticCurveTo(-9 + windSway, 17 + bounce, -2, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Front bright ivy layer
          ctx.fillStyle = leafGreen;
          ctx.beginPath();
          ctx.moveTo(-2, 1 + bounce);
          ctx.quadraticCurveTo(
            -10 + windSway * 0.8,
            8 + bounce,
            -12 + windSway * 0.8,
            15 + bounce,
          );
          ctx.quadraticCurveTo(
            -5 + windSway * 0.8,
            16 + bounce,
            1,
            14 + bounce,
          );
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Organic leaf veins
          ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3, 1 + bounce);
          ctx.lineTo(-10 + windSway, 10 + bounce);
          ctx.stroke();
          ctx.restore();

          // 2. LINEN SHIRT & LAYERED TUNIC (BODY)
          // Neutral linen under-shirt
          ctx.fillStyle = "#faf0e6";
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Leaf Shoulder Pauldrons (Using drawLeaf!)
          drawLeaf(-9, 1, 4.5, Math.PI / 4, leafGreen);
          drawLeaf(5, 1, 4.5, -Math.PI / 4, leafGreen);

          // Leafy Vest Overlap (Left side)
          ctx.fillStyle = leafGreen;
          ctx.beginPath();
          ctx.moveTo(-8, bounce);
          ctx.lineTo(-2, bounce);
          ctx.lineTo(-8, 11 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Leafy Vest Overlap (Right side)
          ctx.beginPath();
          ctx.moveTo(6, bounce);
          ctx.lineTo(0, bounce);
          ctx.lineTo(6, 11 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Layered Foliage Skirt
          ctx.fillStyle = darkLeafGreen;
          ctx.beginPath();
          ctx.moveTo(-8.5, 9 + bounce);
          ctx.lineTo(6.5, 9 + bounce);
          ctx.lineTo(8, 16 + bounce);
          ctx.lineTo(-10, 16 + bounce);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Foliage kilt curved detail scales
          ctx.fillStyle = leafGreen;
          for (let i = -8; i <= 4; i += 4) {
            ctx.beginPath();
            ctx.arc(i + 2, 16 + bounce, 2.2, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
          }

          // Crossed leather chest laces
          ctx.strokeStyle = strapColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-4, 2 + bounce);
          ctx.lineTo(2, 6 + bounce);
          ctx.moveTo(2, 2 + bounce);
          ctx.lineTo(-4, 6 + bounce);
          ctx.stroke();

          // Woven Leather Belt
          ctx.fillStyle = strapColor;
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.beginPath();
          ctx.rect(-8.5, 8 + bounce, 15, 3);
          ctx.fill();
          ctx.stroke();

          // Solstice Golden Sun Buckle
          ctx.fillStyle = sunGold;
          ctx.beginPath();
          ctx.arc(0, 9.5 + bounce, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = sunGold;
          ctx.lineWidth = 0.8;
          for (let r = 0; r < 8; r++) {
            let angle = (r * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(0, 9.5 + bounce);
            ctx.lineTo(
              0 + Math.cos(angle) * 4.5,
              9.5 + bounce + Math.sin(angle) * 4.5,
            );
            ctx.stroke();
          }
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;

          // 3. SHADOWY FOREST HOOD (OBLITERATES FACE)
          ctx.save();

          // Cavity shadow background
          ctx.fillStyle = "#0c1a10"; // Deep forest shadow cavity
          ctx.beginPath();
          ctx.roundRect(-8, -14 + bounce, 16, 14, [4]);
          ctx.fill();
          ctx.stroke();

          // 4. NATURE GLOW EYES (Facing Right, Peeking from shadow)
          ctx.fillStyle = "#55efc4"; // Glowing mint nature sparks
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#2ecc71";
          ctx.beginPath();
          ctx.arc(1.5, -9 + bounce, 1.3, 0, Math.PI * 2);
          ctx.arc(5.0, -9 + bounce, 1.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // 5. ORGANIC DRUID FOLIAGE CANOPY (Layered leaf shroud wrapping head)
          // Draw deepest background leaves
          drawLeaf(-7, -10, 5.0, -Math.PI / 3, darkLeafGreen); // Back-left upper
          drawLeaf(-6, -4, 4.5, -Math.PI / 1.6, darkLeafGreen); // Back-left lower

          // Branch/Vine Hair Locks peeking from the back of the head
          ctx.fillStyle = "#a26938"; // Rich Auburn branch hair
          ctx.beginPath();
          ctx.arc(-9, -7 + bounce, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-8, -2 + bounce, 4.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Draw front-facing leaves
          drawLeaf(-4, -15, 5.5, -Math.PI / 6, leafGreen); // Top left
          drawLeaf(0, -17, 6.0, 0, darkLeafGreen); // Top center
          drawLeaf(4, -15, 5.5, Math.PI / 6, leafGreen); // Top right
          drawLeaf(5, -5, 5.5, Math.PI / 2.4, leafGreen); // Front-right (face mask drape)
          drawLeaf(1, -3, 6.0, Math.PI / 1.8, darkLeafGreen); // Chin / low mask drape
          drawLeaf(-3, -1, 4.8, -Math.PI / 2.2, leafGreen); // Lower-left neck base

          // 6. WOVEN VINE CROWN & 3D BLOOMING WILDFLOWERS
          ctx.strokeStyle = "#27ae60";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-11, -12 + bounce);
          ctx.quadraticCurveTo(0, -15 + bounce, 11, -12 + bounce);
          ctx.stroke();

          let flowersList = [
            { x: -5, y: -14, pCol: "#ff7675", cCol: "#ffd23f" }, // Rose
            { x: 1, y: -16, pCol: "#ffd23f", cCol: "#ff7675" }, // Daisy
            { x: 6, y: -13, pCol: "#54a0ff", cCol: "#ffffff" }, // Bluebell
          ];

          flowersList.forEach((fl) => {
            ctx.save();
            ctx.translate(fl.x, fl.y + bounce);
            ctx.fillStyle = fl.pCol;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              ctx.beginPath();
              ctx.arc(
                Math.cos(angle) * 1.5,
                Math.sin(angle) * 1.5,
                1.5,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.stroke();
            }
            // Inner core bulb
            ctx.fillStyle = fl.cCol;
            ctx.beginPath();
            ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });

          ctx.restore();

          // 7. DRIFTING SUMMER FLOWER SPORES (ACTIVE WIND TRAIL)
          if (options.isMainHero && !window.isGamePaused) {
            ctx.save();
            for (let i = 0; i < 3; i++) {
              let seed = Math.sin(i * 78.91);
              let t = (time / 900 + seed * 6) % 1.0;
              let sparkX = -6 - t * 22 + Math.sin(t * Math.PI * 2) * 4;
              let sparkY = -6 - t * 15 + bounce;
              let alpha = 1.0 - t;
              ctx.fillStyle =
                i % 2 === 0
                  ? `rgba(255, 210, 63, ${alpha * 0.75})`
                  : `rgba(255, 118, 117, ${alpha * 0.75})`;
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 1.2 * (1.0 - t), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
          break;
        }

        default: // "knight" Classic Plate Armor
          // Draw Cape
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = penHero;
          ctx.fillStyle = capeColor;
          ctx.beginPath();
          ctx.moveTo(-6, bounce);
          ctx.lineTo(-18, 15);
          ctx.lineTo(-2, 18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw Body
          ctx.fillStyle = bodyColor;
          ctx.beginPath();
          ctx.rect(-8, bounce, 14, 16);
          ctx.fill();
          ctx.stroke();

          // Draw Helmet
          ctx.fillStyle = armorColor;
          ctx.beginPath();
          ctx.rect(-10, -14 + bounce, 18, 16);
          ctx.fill();
          ctx.stroke();

          // Helmet Visor / Eyes
          ctx.fillStyle = "#2c3e50";
          ctx.beginPath();
          ctx.rect(0, -8 + bounce, 6, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = eyeColor;
          ctx.beginPath();
          ctx.rect(-5, -20 + bounce, 4, 6);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(-9, -16 + bounce, 8, 4);
          ctx.fill();
          ctx.stroke();
          break;
      }
    };

    const drawMainWeapon = () => {
      ctx.save();
      ctx.translate(2, 6 + bounce);

      let weapItem = equipped.weapon;
      // Resolve rarity color for premium slash effects
      let tierColor = window.getTierColor(
        weapItem
          ? weapItem.statsRolled === "UNIQUE"
            ? 5
            : weapItem.statsRolled || 0
          : 0,
      );
      let rgbVals = window.hexToRgbValues
        ? window.hexToRgbValues(tierColor)
        : "236, 240, 241";

      let isMaelstrom = weapItem && weapItem.isUniqueMaelstrom;
      let isSingularity = weapItem && weapItem.isUniqueSingularity;
      let isStaff = weapItem && weapItem.isUniqueStaff;
      let isUniqueSword = weapItem && weapItem.isUniqueSword;

      if (weapItem) {
        let img = window.getCanvasCutoutImage(weapItem);
        if (img && img.complete) {
          let renderH = 38; // Increased height for better visibility
          let renderW = renderH * (img.width / img.height);
          let pivotX = renderW / 2;
          let pivotY = renderH * 0.85;

          let rot = Math.PI / 4; // Point Northeast (up-right) by default
          if (options.slashFrame) {
            // Slashed/swinging state
            rot = Math.PI * 0.65;
            ctx.translate(6, -4);

            // Premium rarity-based slash trail
            ctx.save();
            ctx.fillStyle = `rgba(${rgbVals}, 0.35)`;
            ctx.beginPath();
            ctx.arc(0, 20, 40, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = `rgba(${rgbVals}, 0.55)`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();
          } else {
            // Idle breathing sway
            rot += Math.sin(Date.now() / 240) * 0.04;
          }

          ctx.rotate(rot);
          ctx.drawImage(img, -pivotX, -pivotY, renderW, renderH);
        } else if (isSingularity) {
          ctx.rotate(-Math.PI / 8);
          if (options.slashFrame) {
            ctx.translate(15, -10);
            ctx.rotate(-Math.PI / 2.3);
          }

          // Calculate depth-sorted orbiting space particles
          let orbitTime = Date.now() / 200;
          let orbitalParticles = [];
          for (let i = 0; i < 3; i++) {
            let angle = orbitTime + (i * Math.PI * 2) / 3;
            let ox = Math.cos(angle) * 7.5;
            let oy = Math.sin(angle) * 2.5;
            let oz = Math.sin(angle); // Depth factor
            orbitalParticles.push({ ox, oy, oz });
          }

          // 1. Draw back particles (orbiting behind the blade)
          orbitalParticles.forEach((p) => {
            if (p.oz < 0) {
              ctx.save();
              ctx.fillStyle = "#ff007f";
              ctx.beginPath();
              ctx.arc(p.ox, 42 + p.oy, 1.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });

          // 2. Gravitational distortion field behind/around the blade tip
          ctx.save();
          let fieldPulse = 1.0 + Math.sin(Date.now() / 150) * 0.08;
          ctx.strokeStyle = "rgba(142, 68, 173, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(
            0,
            42,
            11 * fieldPulse,
            4 * fieldPulse,
            -Math.PI / 12,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();

          // 3. Draw Weapon Components (Grip, Guard, Blade)
          ctx.fillStyle = "#1e1e24";
          ctx.beginPath();
          ctx.rect(-2, -2, 4, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#110221";
          ctx.strokeStyle = "#8e44ad";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-9, 8);
          ctx.lineTo(9, 8);
          ctx.lineTo(12, 12);
          ctx.lineTo(-12, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Metallic-Shaded Blade with glowing fuller line
          let singPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
          let bladeGrad = ctx.createLinearGradient(-3, 12, 3, 12);
          bladeGrad.addColorStop(0, "#0d011a");
          bladeGrad.addColorStop(0.5, "#8e44ad");
          bladeGrad.addColorStop(1, "#110221");

          ctx.fillStyle = bladeGrad;
          ctx.strokeStyle = "#e84393";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-3, 12);
          ctx.lineTo(-1.5, 42);
          ctx.lineTo(1.5, 42);
          ctx.lineTo(3, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Center fuller glow
          ctx.save();
          ctx.strokeStyle = `rgba(255, 0, 127, ${0.4 + singPulse * 0.4})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 13);
          ctx.lineTo(0, 40);
          ctx.stroke();
          ctx.restore();

          // 4. Draw front particles (orbiting in front of the blade)
          orbitalParticles.forEach((p) => {
            if (p.oz >= 0) {
              ctx.save();
              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p.ox, 42 + p.oy, 0.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = "#00ffff";
              ctx.beginPath();
              ctx.arc(p.ox, 42 + p.oy, 1.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });

          // 5. High-fidelity slash trail and spatial tear
          if (options.slashFrame) {
            ctx.save();
            let sweepGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, 45);
            sweepGrad.addColorStop(0, "rgba(232, 67, 147, 0.35)");
            sweepGrad.addColorStop(0.5, "rgba(142, 68, 173, 0.12)");
            sweepGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = sweepGrad;
            ctx.beginPath();
            ctx.arc(0, 20, 42, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();

            // Neon cyan spatial tear seam
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 20, 36, 0, Math.PI / 2);
            ctx.stroke();

            // Spatial sparks along the seam
            ctx.fillStyle = "#ffffff";
            for (let a = 0; a <= Math.PI / 2; a += Math.PI / 6) {
              let sx = Math.cos(a) * 36;
              let sy = 20 + Math.sin(a) * 36;
              ctx.beginPath();
              ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        } else if (isMaelstrom) {
          ctx.rotate(-Math.PI / 8);
          if (options.slashFrame) {
            ctx.translate(15, -10);
            ctx.rotate(-Math.PI / 2.3);
          }
          ctx.fillStyle = "#5c503b";
          ctx.beginPath();
          ctx.rect(-1, -6, 2, 44);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.moveTo(-4, 30);
          ctx.lineTo(0, 48);
          ctx.lineTo(4, 30);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#27ae60";
          ctx.beginPath();
          ctx.moveTo(-3, -2);
          ctx.lineTo(0, -12);
          ctx.lineTo(3, -2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (options.slashFrame) {
            ctx.fillStyle = "rgba(46, 204, 113, 0.35)";
            ctx.beginPath();
            ctx.arc(0, 20, 35, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(39, 174, 96, 0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else if (isStaff) {
          ctx.rotate(-Math.PI / 8);
          if (options.slashFrame) {
            ctx.translate(15, -10);
            ctx.rotate(-Math.PI / 2.3);
          }
          ctx.fillStyle = "#1e1e24";
          ctx.beginPath();
          ctx.rect(-1.5, -4, 3, 34);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.moveTo(-7, 30);
          ctx.quadraticCurveTo(0, 26, 7, 30);
          ctx.lineTo(9, 36);
          ctx.quadraticCurveTo(0, 32, -9, 36);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          let gemPulse = 3.5 + Math.sin(Date.now() / 150) * 1.2;
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.arc(0, 34, gemPulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-1, 33, 1, 0, Math.PI * 2);
          ctx.fill();
          if (options.slashFrame) {
            ctx.fillStyle = "rgba(230, 126, 34, 0.35)";
            ctx.beginPath();
            ctx.arc(0, 20, 35, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(231, 76, 60, 0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else if (isUniqueSword) {
          ctx.rotate(-Math.PI / 8);
          if (options.slashFrame) {
            ctx.translate(15, -10);
            ctx.rotate(-Math.PI / 2.3);
          }
          ctx.fillStyle = "#1e1e24";
          ctx.beginPath();
          ctx.rect(-2, -2, 4, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#d4af37";
          ctx.beginPath();
          ctx.arc(0, -3, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.rect(-7, 8, 14, 4);
          ctx.fill();
          ctx.stroke();
          let bleedPulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
          let bladeColor = `rgba(192, 57, 43, ${bleedPulse})`;
          ctx.fillStyle =
            window.mob && window.mob.flashTimer > 0 ? "#ffffff" : bladeColor;
          ctx.strokeStyle = "#960018";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-3.5, 12);
          ctx.lineTo(-2, 37);
          ctx.lineTo(2, 37);
          ctx.lineTo(3.5, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ff7f7f";
          ctx.beginPath();
          ctx.rect(-0.8, 14, 1.6, 18);
          ctx.fill();
          if (options.slashFrame) {
            ctx.fillStyle = "rgba(192, 57, 43, 0.35)";
            ctx.beginPath();
            ctx.arc(0, 20, 35, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "rgba(150, 0, 24, 0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        } else {
          let tierColor = window.getTierColor(
            weapItem ? weapItem.statsRolled : 0,
          );
          let rgbVals = window.hexToRgbValues
            ? window.hexToRgbValues(tierColor)
            : "236, 240, 241";

          if (options.slashFrame) {
            ctx.translate(15, -10);
            ctx.rotate(-Math.PI / 2.3);

            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.rect(-2, -2, 4, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#8e44ad";
            ctx.beginPath();
            ctx.rect(-5, 8, 10, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath();
            ctx.rect(-2, 12, 4, 25);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = `rgba(${rgbVals}, 0.35)`;
            ctx.beginPath();
            ctx.arc(0, 20, 35, 0, Math.PI / 2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = `rgba(${rgbVals}, 0.55)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.rotate(-Math.PI / 8);

            ctx.fillStyle = "#7f8c8d";
            ctx.beginPath();
            ctx.rect(-2, -2, 4, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#8e44ad";
            ctx.beginPath();
            ctx.rect(-5, 8, 10, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ecf0f1";
            ctx.beginPath();
            ctx.rect(-2, 12, 4, 25);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      // Draw retaliatory strike spark on weapon tip inside weapon-space
      let isRetaliatoryReady = !!(
        stats.retaliatoryStrikeActive ||
        stats.retaliatoryStrikeCharged ||
        stats.retaliatoryStrikeReady ||
        (window.playerStats &&
          (window.playerStats.retaliatoryStrikeActive ||
            window.playerStats.retaliatoryStrikeCharged ||
            window.playerStats.retaliatoryStrikeReady))
      );

      if (
        isRetaliatoryReady &&
        (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
      ) {
        let tipY = 37;
        if (isMaelstrom) tipY = 48;
        else if (isSingularity) tipY = 42;
        else if (isStaff) tipY = 34;

        ctx.save();
        ctx.translate(0, tipY);
        let time = Date.now();
        let scalePulse = 1.0 + Math.sin(time / 80) * 0.25;

        ctx.shadowBlur = 10 * scalePulse;
        ctx.shadowColor = "#e74c3c";
        ctx.fillStyle = "#ff4d4d";
        ctx.beginPath();
        ctx.arc(0, 0, 3 * scalePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6 * scalePulse, 0);
        ctx.lineTo(6 * scalePulse, 0);
        ctx.moveTo(0, -6 * scalePulse);
        ctx.lineTo(0, 6 * scalePulse);
        ctx.stroke();

        ctx.strokeStyle = "#ff4d4d";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-3.5 * scalePulse, -3.5 * scalePulse);
        ctx.lineTo(3.5 * scalePulse, 3.5 * scalePulse);
        ctx.moveTo(3.5 * scalePulse, -3.5 * scalePulse);
        ctx.lineTo(-3.5 * scalePulse, 3.5 * scalePulse);
        ctx.stroke();

        ctx.restore();
      }

      if (
        equipped.weapon &&
        equipped.weapon.isUniqueSingularity &&
        stats.singularityState === "pulsing" &&
        (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
      ) {
        ctx.save();
        ctx.translate(0, -35 + bounce);
        ctx.rotate(Date.now() / 300);
        ctx.strokeStyle = "#e84393";
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#e84393";
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          let angle = (i * Math.PI) / 3;
          ctx.lineTo(Math.cos(angle) * 9, Math.sin(angle) * 9);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    };

    let isFacingLeft = options.facing === -1;

    if (isFacingLeft) {
      // Facing Left: Left hand (Subweapon) is in the back (drawn first), Right hand (Main Weapon) is in the front (drawn last)
      drawColossusPhantom();
      drawFortitudePass(true);
      drawUniqueCharacterVisuals(true);
      drawSubweapon();
      drawBodyAndCostume();
      drawMainWeapon();
      drawUniqueCharacterVisuals(false);
      drawFortitudePass(false);
    } else {
      // Facing Right: Right hand (Main Weapon) is in the back (drawn first), Left hand (Subweapon) is in the front (drawn last)
      drawColossusPhantom();
      drawFortitudePass(true);
      drawUniqueCharacterVisuals(true);
      drawMainWeapon();
      drawBodyAndCostume();
      drawSubweapon();
      drawUniqueCharacterVisuals(false);
      drawFortitudePass(false);
    }

    // --- Spell Weaving Runes (Orbital Crown) ---
    let hasSpellWeaving =
      stats.spellWeavingLvl > 0 ||
      (window.playerStats && window.playerStats.spellWeavingLvl > 0);
    let hasTome = equipped.subweapon && equipped.subweapon.subType === "tome";

    if (
      hasSpellWeaving &&
      hasTome &&
      (!options.deathAnimationTimer || options.deathAnimationTimer === 0)
    ) {
      ctx.save();

      // Resolve active stacks dynamically
      let weavingStacks =
        stats.spellWeavingStacks ||
        (window.playerStats && window.playerStats.spellWeavingStacks) ||
        0;

      // Orbit kinetics scale with stacks: spin faster and wider as power builds
      let speedMult = 1.0 + weavingStacks * 0.35;
      let orbitTime = (Date.now() / 600) * speedMult;
      let Rx = 11 + weavingStacks * 1.2;
      let Ry = 3 + weavingStacks * 0.4;
      let cy = -34 + bounce;

      // 1. Draw central runic halo ring
      ctx.strokeStyle =
        weavingStacks > 0
          ? `rgba(0, 210, 255, ${0.15 + weavingStacks * 0.1})`
          : "rgba(155, 89, 182, 0.22)";
      ctx.lineWidth = weavingStacks > 0 ? 1.0 : 0.8;
      ctx.beginPath();
      ctx.ellipse(0, cy, Rx, Ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Map distinct vector runes for each element
      let runeTemplates = [
        { type: "fire", color: "#e67e22", coreColor: "#ff4d4d" }, // Stack 1: Fire
        { type: "lightning", color: "#f1c40f", coreColor: "#ffffff" }, // Stack 2: Lightning
        { type: "frost", color: "#38bdf8", coreColor: "#e0f2fe" }, // Stack 3: Frost
        { type: "arcane", color: "#e879f9", coreColor: "#ffffff" }, // Stack 4: Arcane Star
      ];

      // Filter active runes based on current stacks
      let activeRunes = [];
      for (let i = 0; i < weavingStacks; i++) {
        if (runeTemplates[i]) {
          activeRunes.push(runeTemplates[i]);
        }
      }

      // Pre-calculate positions & depth-sort them from back to front
      let sortedRunes = activeRunes.map((rune, i) => {
        let angle = orbitTime + (i * Math.PI * 2) / activeRunes.length;
        let px = Math.cos(angle) * Rx;
        let py = Math.sin(angle) * Ry + cy;
        let pz = Math.sin(angle); // Z-depth factor (-1 is back, 1 is front)
        return { rune, px, py, pz };
      });

      sortedRunes.sort((a, b) => a.pz - b.pz);

      // Helper to draw clean vector shapes
      let drawRune = (px, py, size, type, color, coreColor) => {
        ctx.save();
        ctx.translate(px, py);
        ctx.strokeStyle = color;
        ctx.fillStyle = coreColor;
        ctx.lineWidth = 0.9;
        ctx.lineJoin = "round";
        ctx.beginPath();

        if (type === "fire") {
          // Teardrop flame shape
          ctx.moveTo(0, -size * 1.5);
          ctx.quadraticCurveTo(size * 0.7, -size * 0.2, size * 0.6, size * 0.8);
          ctx.quadraticCurveTo(0, size * 1.4, -size * 0.6, size * 0.8);
          ctx.quadraticCurveTo(-size * 0.7, -size * 0.2, 0, -size * 1.5);
        } else if (type === "lightning") {
          // Jagged bolt shape
          ctx.moveTo(size * 0.4, -size * 1.4);
          ctx.lineTo(-size * 0.4, 0);
          ctx.lineTo(size * 0.2, 0);
          ctx.lineTo(-size * 0.5, size * 1.4);
          ctx.lineTo(size * 0.5, 0);
          ctx.lineTo(-size * 0.1, 0);
        } else if (type === "frost") {
          // Faceted crystal snowflake
          ctx.moveTo(0, -size * 1.2);
          ctx.lineTo(size * 0.8, -size * 0.4);
          ctx.lineTo(size * 0.8, size * 0.4);
          ctx.lineTo(0, size * 1.2);
          ctx.lineTo(-size * 0.8, size * 0.4);
          ctx.lineTo(-size * 0.8, -size * 0.4);
        } else {
          // Arcane 4-point star shape
          let inner = size * 0.3;
          ctx.moveTo(0, -size * 1.4);
          ctx.quadraticCurveTo(0, -inner, inner, 0);
          ctx.quadraticCurveTo(0, inner, 0, size * 1.4);
          ctx.quadraticCurveTo(0, inner, -inner, 0);
          ctx.quadraticCurveTo(0, -inner, 0, -size * 1.4);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      // Draw the depth-sorted runes with size-scaling based on Z-axis
      sortedRunes.forEach((sr) => {
        let size = 1.6 + sr.pz * 0.45;
        ctx.save();
        ctx.globalAlpha = 0.55 + sr.pz * 0.35;
        drawRune(
          sr.px,
          sr.py,
          size,
          sr.rune.type,
          sr.rune.color,
          sr.rune.coreColor,
        );
        ctx.restore();
      });

      ctx.restore();
    }

    // --- Player Debuff Visual Overlays ---
    let p = window.player;
    if (p && stats && !options.isTrail) {
      // A. Web / Snare / Dilation Field Overlay (Sticky white/yellow netting)
      if (p.snareTimer > 0 || p.inDilationField) {
        ctx.save();
        ctx.strokeStyle = p.inDilationField
          ? "rgba(241, 196, 15, 0.65)"
          : "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        // Web mesh overlay
        ctx.moveTo(-8, -12);
        ctx.lineTo(8, 12);
        ctx.moveTo(8, -12);
        ctx.lineTo(-8, 12);
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // B. Poison Tint Overlay (Glowing green mist)
      if (p.poisonStacks > 0) {
        ctx.save();
        let pulse = Math.sin(Date.now() / 100) * 0.15 + 0.85;
        let poisonGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 * pulse);
        poisonGrad.addColorStop(0, "rgba(46, 204, 113, 0.25)");
        poisonGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
        ctx.fillStyle = poisonGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 16 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // C. Bleed Core Splatter Glisten
      if (p.bleedStacks > 0 && Math.sin(Date.now() / 60) > 0.5) {
        ctx.save();
        ctx.fillStyle = "rgba(150, 0, 24, 0.35)";
        ctx.beginPath();
        ctx.arc(-2, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // D. Inversion / Glitch Chromatic Displacement
      if (p.glitchTimer > 0) {
        if (Math.sin(Date.now() / 20) > 0.6) {
          ctx.save();
          ctx.translate(window.randFloat(-3, 3), window.randFloat(-2, 2));
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = Math.random() < 0.5 ? "#00ffff" : "#ff007f";
          ctx.fillRect(-6, -12, 12, 24);
          ctx.restore();
        }
      }
    }

    ctx.restore();
};

export { drawSingleHero };
