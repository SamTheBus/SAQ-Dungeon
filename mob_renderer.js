import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import { isBossOrMinibossMob } from "./mob_liveness.js?v=1.003";
import {
  emitBerserkBossEmber,
  emitCalamitySpecterParticle,
  emitCursedBladeParticle,
  emitGoldDungeonIdolSpark,
  emitHoardMimicSpark,
  emitHooktailSegmentSmoke,
  emitLavaSerpentEmber,
  emitRareEliteEmber,
  emitWyrmlingFrostVapor,
} from "./mob_presentation_effects.js?v=1.001";
import {
  renderRandFloat,
  renderRandInt,
  renderRandom,
} from "./render_rng.js?v=1.001";

  // Scoped Date wrapper referencing window.Date to bypass local temporal dead zone checks
  const ScopedDate = class extends window.Date {
    static now() {
      return window.Date.now();
    }
  };
  const Date = ScopedDate;

  // Feature-detect filter support once and cache it (Zero-allocation)
  const isFilterSupported =
    typeof CanvasRenderingContext2D !== "undefined" &&
    "filter" in CanvasRenderingContext2D.prototype;

  const isSafari =
    typeof navigator !== "undefined" &&
    (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));
  // Force tint fallback on all mobile devices and Safari for performance and iOS visual correctness
  const isMobileDevice =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const useTintFallback = !isFilterSupported || isSafari || isMobileDevice;

  const TINT_BUFFER_PADDING_X = 96;
  const TINT_BUFFER_PADDING_TOP = 144;
  const TINT_BUFFER_PADDING_BOTTOM = 96;
  const TINT_BUFFER_ANTIALIAS_BLEED = 2;

  let offscreenCanvas = null;
  let offscreenCtx = null;
  const tintBufferBoundsScratch = { x: 0, y: 0, width: 1, height: 1 };
  const mobTetherRecipientsScratch = { haste: [], def: [], atk: [] };

  export function prepareMobTetherRecipients(mobs) {
    const hasteRecipients = mobTetherRecipientsScratch.haste;
    const defenseRecipients = mobTetherRecipientsScratch.def;
    const attackRecipients = mobTetherRecipientsScratch.atk;
    hasteRecipients.length = 0;
    defenseRecipients.length = 0;
    attackRecipients.length = 0;

    if (!Array.isArray(mobs)) return mobTetherRecipientsScratch;

    for (let index = 0; index < mobs.length; index++) {
      const mob = mobs[index];
      const stacks = mob && mob.buffStacks;
      if (!stacks) continue;
      if ((stacks.haste || 0) > 0) hasteRecipients.push(mob);
      if ((stacks.def || 0) > 0) defenseRecipients.push(mob);
      if ((stacks.atk || 0) > 0) attackRecipients.push(mob);
    }

    return mobTetherRecipientsScratch;
  }

  function getTintBufferBounds(mainCtx, m) {
    const matrix = mainCtx.getTransform();
    const left = m.x - TINT_BUFFER_PADDING_X;
    const top = m.y - TINT_BUFFER_PADDING_TOP;
    const right = m.x + (m.w || 24) + TINT_BUFFER_PADDING_X;
    const bottom = m.y + (m.h || 24) + TINT_BUFFER_PADDING_BOTTOM;
    const x1 = matrix.a * left + matrix.c * top + matrix.e;
    const y1 = matrix.b * left + matrix.d * top + matrix.f;
    const x2 = matrix.a * right + matrix.c * top + matrix.e;
    const y2 = matrix.b * right + matrix.d * top + matrix.f;
    const x3 = matrix.a * left + matrix.c * bottom + matrix.e;
    const y3 = matrix.b * left + matrix.d * bottom + matrix.f;
    const x4 = matrix.a * right + matrix.c * bottom + matrix.e;
    const y4 = matrix.b * right + matrix.d * bottom + matrix.f;
    const canvas = mainCtx.canvas;
    const minX = Math.max(
      0,
      Math.floor(Math.min(x1, x2, x3, x4)) - TINT_BUFFER_ANTIALIAS_BLEED,
    );
    const minY = Math.max(
      0,
      Math.floor(Math.min(y1, y2, y3, y4)) - TINT_BUFFER_ANTIALIAS_BLEED,
    );
    const maxX = Math.min(
      canvas.width,
      Math.ceil(Math.max(x1, x2, x3, x4)) + TINT_BUFFER_ANTIALIAS_BLEED,
    );
    const maxY = Math.min(
      canvas.height,
      Math.ceil(Math.max(y1, y2, y3, y4)) + TINT_BUFFER_ANTIALIAS_BLEED,
    );
    tintBufferBoundsScratch.x = minX;
    tintBufferBoundsScratch.y = minY;
    tintBufferBoundsScratch.width = Math.max(1, maxX - minX);
    tintBufferBoundsScratch.height = Math.max(1, maxY - minY);
    return tintBufferBoundsScratch;
  }

  function getOffscreenContext(requiredWidth, requiredHeight) {
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement("canvas");
      offscreenCtx = offscreenCanvas.getContext("2d");
    }
    if (offscreenCanvas.width < requiredWidth) {
      offscreenCanvas.width = requiredWidth;
    }
    if (offscreenCanvas.height < requiredHeight) {
      offscreenCanvas.height = requiredHeight;
    }
    const clearWidth = offscreenCanvas.width;
    const clearHeight = offscreenCanvas.height;
    offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    offscreenCtx.clearRect(0, 0, clearWidth, clearHeight);
    return offscreenCtx;
  }

  const drawSingleMob = function (c, m, tetherRecipients = null) {
    if (!m) return;
    let t = m.visualTier;
    let rx = m.recoilX || 0;
    let ry = m.recoilY || 0;
    let facing = m.facing !== undefined ? m.facing : -1;

    let mobIsElite = !!m.isElite || !!m.eliteAffix;
    let mobIsRare = !!m.isRare;

    // --- Core Boss & Mini-Boss AI / HP Interceptor Hook ---
    let isBossOrMiniboss = isBossOrMinibossMob(m);

    c.save();
    c.translate(rx, ry);

    // Apply 1.25x Physical Scale for Elites from ground base (bottom-center)
    if (m.eliteAffix) {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h;
      c.translate(cx, cy);
      c.scale(1.25, 1.25);
      c.translate(-cx, -cy);
    }

    if (facing === 1) {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      c.translate(cx, cy);
      c.scale(-1, 1);
      c.translate(-cx, -cy);
    }

    // Ground Drop Shadow & Elite Aura Pass
    c.save();
    let mCx = m.x + m.w / 2;
    let mCy = m.y + m.h - 2;
    let mobShadowW = m.w * 0.45;
    let mobShadowH = Math.max(3, m.h * 0.15);

    let time = Date.now();

    // --- Render Active Frontal Guard Ground Shield Arc ---
    if (isBossOrMiniboss && m.guardActiveTimer > 0 && window.player) {
      let angleToPlayer = Math.atan2(
        window.player.y - m.y,
        window.player.x - m.x,
      );
      let arcRadius = m.w * 0.9;

      c.save();
      c.strokeStyle = "rgba(0, 240, 255, 0.75)";
      c.lineWidth = 2.5;
      c.shadowBlur = 12;
      c.shadowColor = "#00f0ff";

      // Draw a semi-circular shield arc facing towards you on the ground
      c.beginPath();
      c.arc(
        mCx,
        mCy - m.h / 2,
        arcRadius,
        angleToPlayer - Math.PI / 4,
        angleToPlayer + Math.PI / 4,
      );
      c.stroke();
      c.shadowBlur = 0;

      // Inner polished white trim line
      c.strokeStyle = "rgba(255, 255, 255, 0.4)";
      c.lineWidth = 1.0;
      c.beginPath();
      c.arc(
        mCx,
        mCy - m.h / 2,
        arcRadius - 4,
        angleToPlayer - Math.PI / 4,
        angleToPlayer + Math.PI / 4,
      );
      c.stroke();
      c.restore();
    }

    // --- Render Berserk Aura & Rising Flame Embers ---
    if (isBossOrMiniboss && m.isBerserk) {
      // A. Draw a pulsing heavy crimson crown glow above the boss head
      c.save();
      let pulse = Math.sin(time / 100) * 0.2 + 0.8;
      c.strokeStyle = "#e74c3c";
      c.lineWidth = 1.5;
      c.shadowBlur = 10 * pulse;
      c.shadowColor = "#e74c3c";
      c.beginPath();
      c.ellipse(mCx, m.y - 12, 8 * pulse, 2.5 * pulse, 0, 0, Math.PI * 2);
      c.stroke();
      c.shadowBlur = 0;
      c.restore();

      // B. Spawn rising red flame embers using the zero-allocation pool
      emitBerserkBossEmber(m, mCx);
    }

    if (mobIsElite && mobIsRare) {
      // --- RARE ELITE: Prismatic Under-Glow (Dual-layered interlocking runic circle) ---
      let rot1 = time / 400;
      let rot2 = -time / 300;

      // Outer Layer (Emerald)
      c.save();
      c.translate(mCx, mCy);
      c.rotate(rot1);
      c.strokeStyle = "#2ecc71";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, 0, m.w * 0.8, m.w * 0.35, 0, 0, Math.PI * 2);
      c.stroke();

      // Decorative ticks
      for (let i = 0; i < 4; i++) {
        let a = (i * Math.PI) / 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * (m.w * 0.7), Math.sin(a) * (m.w * 0.3));
        c.lineTo(Math.cos(a) * (m.w * 0.9), Math.sin(a) * (m.w * 0.4));
        c.stroke();
      }
      c.restore();

      // Inner Layer (Violet)
      c.save();
      c.translate(mCx, mCy);
      c.rotate(rot2);
      c.strokeStyle = "#a855f7";
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(0, 0, m.w * 0.55, m.w * 0.24, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // Emit dual-tone embers from base
      emitRareEliteEmber(m, mCx, mCy);
    } else if (mobIsElite) {
      // --- ELITE: Base Rift (Vibrating tattered dark-purple ground rift) ---
      let vibX = Math.sin(time / 25) * 1.5;
      let vibY = Math.cos(time / 20) * 0.8;

      c.fillStyle = "#1e052e"; // Dark purple backing shadow
      c.beginPath();
      let steps = 12;
      for (let i = 0; i <= steps; i++) {
        let a = (i * Math.PI * 2) / steps;
        let rX = mobShadowW * (1.1 + Math.sin(i * 3 + time / 80) * 0.12) + vibX;
        let rY = mobShadowH * (1.1 + Math.cos(i * 3 + time / 80) * 0.12) + vibY;
        c.lineTo(mCx + Math.cos(a) * rX, mCy + Math.sin(a) * rY);
      }
      c.closePath();
      c.fill();

      // Sharp tattered border
      c.strokeStyle = "#510a74";
      c.lineWidth = 1.2;
      c.stroke();
    } else {
      // --- STANDARD / RARE shadow ---
      c.fillStyle = "rgba(0, 0, 0, 0.35)";
      c.beginPath();
      c.ellipse(mCx, mCy, mobShadowW, mobShadowH, 0, 0, Math.PI * 2);
      c.fill();
    }

    // Render Blood Berserker Death Detonation Warning Circle
    if (m.isDetonating && m.detonationTimer > 0) {
      let pulse = Math.sin(Date.now() / 50) * 4;
      c.strokeStyle = "#e74c3c";
      c.lineWidth = 2.0;
      c.setLineDash([6, 4]);
      c.beginPath();
      c.arc(mCx, mCy - m.h / 2, 100 + pulse, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = "rgba(231, 76, 60, 0.12)";
      c.beginPath();
      c.arc(mCx, mCy - m.h / 2, 100 + pulse, 0, Math.PI * 2);
      c.fill();
    }

    // Render Elite Commander Ground Runic Aura Ring & Laser Tethers
    if (m.eliteAffix) {
      let auraColor = "#00d2ff";
      let buffKey = "haste";

      if (m.eliteAffix === "vitality_weaver") {
        auraColor = "#2ecc71";
        buffKey = null;
      } else if (m.eliteAffix === "iron_citadel") {
        auraColor = "#3498db";
        buffKey = "def";
      } else if (m.eliteAffix === "swift_commander") {
        auraColor = "#00d2ff";
        buffKey = "haste";
      } else if (m.eliteAffix === "blood_berserker") {
        auraColor = "#e74c3c";
        buffKey = "atk";
      } else if (m.eliteAffix === "nullifier") {
        auraColor = "#a855f7";
        buffKey = null;
      } else if (m.eliteAffix === "web_weaver") {
        auraColor = "#2ecc71";
        buffKey = null;
      } else if (m.eliteAffix === "glacial_warden") {
        auraColor = "#38bdf8";
        buffKey = null;
      } else if (m.eliteAffix === "slag_shaper") {
        auraColor = "#f97316";
        buffKey = null;
      } else if (m.eliteAffix === "toxic_decay") {
        auraColor = "#a7f3d0";
        buffKey = null;
      }

      let rot = (Date.now() / 400) % (Math.PI * 2);
      c.strokeStyle = auraColor;
      c.lineWidth = 1.8;
      c.setLineDash([4, 4]);
      c.save();
      c.translate(mCx, mCy);
      c.rotate(rot);
      c.beginPath();
      c.ellipse(0, 0, m.w * 0.9, m.w * 0.45, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // Draw Translucent Laser Tether Links to Buffed Minion Allies
      const hasPreparedRecipients =
        tetherRecipients && Array.isArray(tetherRecipients[buffKey]);
      const tetherCandidates = hasPreparedRecipients
        ? tetherRecipients[buffKey]
        : window.activeDungeonMobs;

      if (buffKey && tetherCandidates) {
        c.strokeStyle = auraColor;
        c.lineWidth = 1.2;
        c.globalAlpha = 0.35;
        c.setLineDash([2, 2]);

        for (let recipientIndex = 0; recipientIndex < tetherCandidates.length; recipientIndex++) {
          const m2 = tetherCandidates[recipientIndex];
          if (
            m2 === m ||
            (!hasPreparedRecipients &&
              (!m2.buffStacks || (m2.buffStacks[buffKey] || 0) <= 0))
          ) {
            continue;
          }
          let m2Cx = m2.x + (m2.w || 24) / 2;
          let m2Cy = m2.y + (m2.h || 24) / 2;

          c.beginPath();
          c.moveTo(mCx, mCy - m.h / 2);
          c.lineTo(m2Cx, m2Cy);
          c.stroke();
        }
        c.setLineDash([]);
        c.globalAlpha = 1.0;
      }
    }
    c.restore();

    // --- Apply Hardware-Accelerated Rendering Filters (Phase 2) ---
    let originalCtx = c;
    let activeTint = null;

    if (mobIsElite && mobIsRare) {
      activeTint = "rgba(232, 67, 147, 0.38)"; // Rare Elite: Bright magenta/pink tint
    } else if (mobIsElite) {
      activeTint = "rgba(168, 85, 247, 0.32)"; // Elite: Deep purple/blue tint
    } else if (mobIsRare) {
      activeTint = "rgba(241, 196, 15, 0.28)"; // Rare: Gold/yellow tint
    }

    const shouldTint = useTintFallback && activeTint !== null;
    let tintBufferBounds = null;

    if (shouldTint) {
      const mainTransform = c.getTransform();
      tintBufferBounds = getTintBufferBounds(c, m);
      offscreenCtx = getOffscreenContext(
        tintBufferBounds.width,
        tintBufferBounds.height,
      );
      offscreenCtx.setTransform(
        mainTransform.a,
        mainTransform.b,
        mainTransform.c,
        mainTransform.d,
        mainTransform.e - tintBufferBounds.x,
        mainTransform.f - tintBufferBounds.y,
      );
      c = offscreenCtx; // Redirect all subsequent drawing commands to offscreen canvas
    } else {
      if (isFilterSupported) {
        if (mobIsElite && mobIsRare) {
          c.filter =
            "hue-rotate(280deg) saturate(250%) brightness(1.05) contrast(1.4)";
        } else if (mobIsElite) {
          c.filter =
            "hue-rotate(130deg) saturate(160%) brightness(0.8) contrast(1.25)";
        } else if (mobIsRare) {
          c.filter =
            "hue-rotate(25deg) saturate(220%) brightness(1.15) contrast(1.1)";
        } else {
          c.filter = "none";
        }
      }
    }

    let penWidth =
      m.type === "boss" ||
      m.type === "dungeon_boss" ||
      m.type === "prestige_boss" ||
      m.type === "rift_guardian" ||
      m.type === "aegis_goliath" ||
      m.type === "chronos_arbitrator" ||
      m.type === "nexus_overseer"
        ? 2.4
        : 1.8;
    c.strokeStyle = "#000000";
    c.lineWidth = penWidth;
    c.lineJoin = "round";

    if (m.flashTimer > 0) {
      c.fillStyle = "#ffffff";
    } else {
      c.fillStyle =
        m.type === "boss" ||
        m.type === "dungeon_boss" ||
        m.type === "dungeon_miniboss"
          ? "#34495e"
          : "#555";
    }

    if (m.type === "mob") {
      let vType = m.visualType;
      if (!vType) {
        let fallbacks = {
          0: "slime",
          1: "golem",
          2: "magma_elemental",
          3: "marsh_ghost",
          4: "void_orb",
        };
        vType = fallbacks[t] || "slime";
      }

      // Check if standard mob is from Whispering Woods (Sector 0)
      const isSectorZeroMob = ["slime", "sprout", "thorn_wyrm"].includes(vType);
      if (!isSectorZeroMob) {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.save();
        c.translate(cx, cy);
        c.scale(0.7, 0.7); // Downscale other stages to match player proportions
        c.translate(-cx, -cy);
      }

      if (m.isRare) {
        c.save();
        let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
        let auraGrad = c.createRadialGradient(
          m.x + m.w / 2,
          m.y + m.h / 2,
          2,
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
        );
        auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
        auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(
          m.x + m.w / 2,
          m.y + m.h / 2,
          Math.max(m.w, m.h) * 1.15 * auraPulse,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.restore();
      }

      if (vType === "slime") {
        let squish = Math.sin(Date.now() / 100) * 2.0;
        let wScale = (m.w / 2) * 0.7 + squish;
        let hScale = (m.h / 2) * 0.7 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 6 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else if (m.isRare) {
          slimeGrad.addColorStop(0, "#ffeaa7");
          slimeGrad.addColorStop(1, "#f1c40f");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#2ecc71");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.15, hScale * 0.95, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.6)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.4,
            cy - hScale * 0.4,
            wScale * 0.25,
            hScale * 0.2,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.save();
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 2.5;
          c.beginPath();
          let stemTopY = cy - hScale * 0.95;
          c.moveTo(cx, stemTopY);
          c.quadraticCurveTo(cx - 2, stemTopY - 8, cx + 4, stemTopY - 12);
          c.stroke();

          c.fillStyle = "#2ecc71";
          c.beginPath();
          c.ellipse(
            cx + 4,
            stemTopY - 12,
            5,
            2.5,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.strokeStyle = "#000000";
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();

          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.3;
          let eyeOffsetY = hScale * 0.1;
          let eyeRadius = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(
            cx - eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.arc(
            cx + eyeOffsetX - eyeRadius * 0.2,
            cy - eyeOffsetY - eyeRadius * 0.2,
            eyeRadius * 0.3,
            0,
            Math.PI * 2,
          );
          c.fill();

          c.strokeStyle = "#1e272e";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(cx, cy + hScale * 0.05, wScale * 0.12, 0, Math.PI);
          c.stroke();

          c.fillStyle = "rgba(231, 76, 60, 0.4)";
          c.beginPath();
          c.ellipse(
            cx - eyeOffsetX - 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.ellipse(
            cx + eyeOffsetX + 2,
            cy - eyeOffsetY + 3,
            2.5,
            1.2,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "coin_elemental") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 150) * 3;

        // Precompute coordinates and depth state for the 6 orbiting gold coins
        let coinsList = [];
        for (let i = 0; i < 6; i++) {
          let angle = Date.now() / 600 + (i * Math.PI * 2) / 6;
          let dist = 18 + Math.sin(Date.now() / 150 + i) * 3;
          let ox = cx + Math.cos(angle) * dist * 1.3;
          let oy = cy + Math.sin(angle) * dist * 0.5;
          let isBehind = Math.sin(angle) < 0; // True if positioned behind core

          let rot = angle * 2;
          let cw = 6 * Math.abs(Math.sin(rot));
          let ch = 6;

          coinsList.push({ ox, oy, cw, ch, isBehind });
        }

        let drawCoinPiece = (cn) => {
          c.save();
          c.translate(cn.ox, cn.oy);
          c.rotate(Math.PI / 12);

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
          c.beginPath();
          c.ellipse(0, 0, cn.cw + 1.2, cn.ch + 1.2, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            c.fillStyle = "#ffd700";
            c.beginPath();
            c.ellipse(0, 0, cn.cw, cn.ch, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#b7950b";
            c.lineWidth = 0.8;
            c.beginPath();
            c.ellipse(0, 0, cn.cw * 0.8, cn.ch * 0.8, 0, 0, Math.PI * 2);
            c.stroke();
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.beginPath();
            c.ellipse(
              -cn.cw * 0.3,
              -cn.ch * 0.3,
              cn.cw * 0.25,
              cn.ch * 0.2,
              Math.PI / 4,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
          c.restore();
        };

        // 1. Draw BACK half of orbiting rings first (Math.PI to 2*Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();
        c.restore();

        // 2. Draw BACK coins
        coinsList.forEach((cn) => {
          if (cn.isBehind) drawCoinPiece(cn);
        });

        // 3. Draw central glowing nucleus core
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 10);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.5, "#ffd700");
        coreGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();

        // 4. Draw FRONT half of orbiting rings (0 to Math.PI)
        c.save();
        c.translate(cx, cy);
        c.strokeStyle = "rgba(241, 196, 15, 0.35)";
        c.lineWidth = 1;

        c.save();
        c.rotate(Math.PI / 6);
        c.beginPath();
        c.ellipse(0, 0, 22, 7, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.save();
        c.rotate(-Math.PI / 4);
        c.beginPath();
        c.ellipse(0, 0, 26, 8, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();
        c.restore();

        // 5. Draw FRONT coins
        coinsList.forEach((cn) => {
          if (!cn.isBehind) drawCoinPiece(cn);
        });
      } else if (vType === "hoard_mimic") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10;
        let time = Date.now();
        let isFlash = m.flashTimer > 0;

        let tier = m.mimicTier || "iron_bound";

        // Snapping dynamics: mimics twitch subtly when idle, snap violently on aggressive behaviors
        let snap = Math.abs(Math.sin(time / 160));
        let isAttacking =
          m.isAttacking || m.state === "CHASE" || m.vx !== 0 || m.vy !== 0;
        let P = isAttacking
          ? snap * 0.95
          : Math.sin(time / 1000) > 0.85
            ? 0.14
            : 0.0;

        let closedScaleY = Math.max(0, Math.cos((P * Math.PI) / 2));
        let openScaleY = Math.max(0, Math.sin((P * Math.PI) / 2));

        // 1. Soft Ambient Occlusion Drop Shadow
        let baseShadowW = 13 + (tier !== "iron_bound" ? 1 : 0);
        c.fillStyle = "rgba(0, 0, 0, 0.55)";
        c.beginPath();
        c.ellipse(cx, cy + 9, baseShadowW, 5, 0, 0, Math.PI * 2);
        c.fill();

        // 2. Warm Tiered Floor Glow
        let pulse = Math.sin(time / 200) * 1.8;
        let auraRadius =
          (tier === "iron_bound" ? 16 : tier === "gilded" ? 18 : 20) + pulse;
        let auraGrad = c.createRadialGradient(
          cx,
          cy + 2,
          2,
          cx,
          cy + 2,
          auraRadius,
        );
        if (tier === "iron_bound") {
          auraGrad.addColorStop(0, "rgba(230, 126, 34, 0.35)");
          auraGrad.addColorStop(0.6, "rgba(139, 69, 19, 0.12)");
        } else if (tier === "gilded") {
          auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.45)");
          auraGrad.addColorStop(0.5, "rgba(230, 126, 34, 0.18)");
        } else {
          auraGrad.addColorStop(0, "rgba(0, 255, 255, 0.55)");
          auraGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.22)");
        }
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        c.fillStyle = auraGrad;
        c.beginPath();
        c.arc(cx, cy + 2, auraRadius, 0, Math.PI * 2);
        c.fill();

        let w = 22;
        let bodyH = 11;
        let lidH = 6;
        let x = cx - w / 2;
        let y = cy - (bodyH + lidH) / 2 + 3;
        let y_hinge = y + lidH;

        // 3. BACK LAYER: openScaleY Rotating Open Lid (Back Face)
        if (openScaleY > 0.01) {
          c.save();
          c.translate(cx, y_hinge);
          c.scale(1, -openScaleY);

          if (isFlash) {
            c.fillStyle = "#ffffff";
            c.strokeStyle = "#ffffff";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(-w / 2, 0);
            c.lineTo(-w / 2, -lidH * 1.5);
            c.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
            c.lineTo(w / 2, 0);
            c.closePath();
            c.fill();
            c.stroke();
          } else {
            if (tier === "iron_bound") {
              c.fillStyle = "#2a1204";
              c.strokeStyle = "#100903";
              c.lineWidth = 1.5;
              c.beginPath();
              c.moveTo(-w / 2, 0);
              c.lineTo(-w / 2, -lidH * 1.5);
              c.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
              c.lineTo(w / 2, 0);
              c.closePath();
              c.fill();
              c.stroke();

              c.fillStyle = "#0c0502";
              c.fillRect(
                -w / 2 + 1.5,
                -lidH * 1.5 + 1.5,
                w - 3,
                lidH * 1.5 - 1.5,
              );

              c.fillStyle = "#334155";
              c.strokeStyle = "#0f172a";
              c.lineWidth = 1.0;
              c.fillRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
              c.strokeRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
              c.fillRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
              c.strokeRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
            } else if (tier === "gilded") {
              c.fillStyle = "#4a0404";
              c.strokeStyle = "#200101";
              c.lineWidth = 1.5;
              c.beginPath();
              c.moveTo(-w / 2, 0);
              c.lineTo(-w / 2, -lidH * 1.5);
              c.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
              c.lineTo(w / 2, 0);
              c.closePath();
              c.fill();
              c.stroke();

              c.fillStyle = "#220101";
              c.fillRect(
                -w / 2 + 1.5,
                -lidH * 1.5 + 1.5,
                w - 3,
                lidH * 1.5 - 1.5,
              );

              c.fillStyle = "#ffd700";
              c.strokeStyle = "#855800";
              c.lineWidth = 1.0;
              c.fillRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
              c.strokeRect(-w / 2 + 3, -lidH * 1.5, 3.5, lidH * 1.5);
              c.fillRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
              c.strokeRect(w / 2 - 6.5, -lidH * 1.5, 3.5, lidH * 1.5);
            } else {
              c.fillStyle = "#0c0a1a";
              c.strokeStyle = "#02e8ff";
              c.lineWidth = 1.5;
              c.beginPath();
              c.moveTo(-w / 2, 0);
              c.lineTo(-w / 2, -lidH * 1.5);
              c.quadraticCurveTo(0, -lidH * 1.5 - 4, w / 2, -lidH * 1.5);
              c.lineTo(w / 2, 0);
              c.closePath();
              c.fill();
              c.stroke();

              c.fillStyle = "#02020a";
              c.fillRect(
                -w / 2 + 1.5,
                -lidH * 1.5 + 1.5,
                w - 3,
                lidH * 1.5 - 1.5,
              );

              c.strokeStyle = "rgba(0, 255, 255, 0.6)";
              c.lineWidth = 1.0;
              c.beginPath();
              c.moveTo(-w / 2 + 4, -lidH * 1.5 + 3);
              c.lineTo(-w / 2 + 4, -1);
              c.moveTo(w / 2 - 4, -lidH * 1.5 + 3);
              c.lineTo(w / 2 - 4, -1);
              c.stroke();
            }
          }
          c.restore();
        }

        // 4. MIDDLE LAYER: Standard Lower Box Base Container
        let bodyGrad = c.createLinearGradient(x, y_hinge, x, y_hinge + bodyH);
        if (isFlash) {
          c.fillStyle = "#ffffff";
          c.strokeStyle = "#ffffff";
        } else {
          if (tier === "iron_bound") {
            bodyGrad.addColorStop(0, "#5c2e0b");
            bodyGrad.addColorStop(0.5, "#411f05");
            bodyGrad.addColorStop(1, "#1c0b02");
            c.fillStyle = bodyGrad;
            c.strokeStyle = "#100903";
          } else if (tier === "gilded") {
            bodyGrad.addColorStop(0, "#800020");
            bodyGrad.addColorStop(0.5, "#4a0404");
            bodyGrad.addColorStop(1, "#200101");
            c.fillStyle = bodyGrad;
            c.strokeStyle = "#200101";
          } else {
            bodyGrad.addColorStop(0, "#1e1b4b");
            bodyGrad.addColorStop(0.5, "#0f0b29");
            bodyGrad.addColorStop(1, "#030010");
            c.fillStyle = bodyGrad;
            c.strokeStyle = "#a855f7";
          }
        }
        c.lineWidth = 1.5;
        c.fillRect(x, y_hinge, w, bodyH);
        c.strokeRect(x, y_hinge, w, bodyH);

        // Hardware Straps on Base Container
        if (!isFlash) {
          c.fillStyle =
            tier === "iron_bound"
              ? "#334155"
              : tier === "gilded"
                ? "#ffd700"
                : "#00ffff";
          c.strokeStyle =
            tier === "iron_bound"
              ? "#0f172a"
              : tier === "gilded"
                ? "#855800"
                : "rgba(255,255,255,0.8)";
          c.lineWidth = 1.0;
          if (tier === "astral") {
            c.save();
            c.shadowBlur = 4;
            c.shadowColor = "#00ffff";
          }
          c.fillRect(x + 3, y_hinge, 3.5, bodyH);
          c.strokeRect(x + 3, y_hinge, 3.5, bodyH);
          c.fillRect(x + w - 6.5, y_hinge, 3.5, bodyH);
          c.strokeRect(x + w - 6.5, y_hinge, 3.5, bodyH);
          if (tier === "astral") c.restore();
        }

        // 5. INTERNAL CAVITY VOID REVEAL (SINISTER MIMIC BITE & TONGUE REVEAL)
        if (P > 0.01) {
          c.save();
          let revealH = Math.round(5 * P);

          c.beginPath();
          c.rect(x + 1.5, y_hinge, w - 3, revealH + 1);
          c.clip();

          c.fillStyle = "#0c0202";
          c.fillRect(x + 1.5, y_hinge, w - 3, revealH + 1);

          // Wiggling Purple/Acidic Tongue
          let tongueSway = Math.sin(time / 60) * 4;
          let tongueLength = Math.max(2, 10 * P);
          let tongueGrad = c.createLinearGradient(
            cx,
            y_hinge,
            cx + tongueSway,
            y_hinge + tongueLength,
          );
          tongueGrad.addColorStop(0, "#c026d3");
          tongueGrad.addColorStop(1, "#8e44ad");

          c.fillStyle = tongueGrad;
          c.strokeStyle = "#4a044e";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(cx - 3.5, y_hinge + 1);
          c.quadraticCurveTo(
            cx - 4 + tongueSway * 0.5,
            y_hinge + tongueLength * 0.7,
            cx + tongueSway,
            y_hinge + tongueLength,
          );
          c.arc(cx + tongueSway, y_hinge + tongueLength, 2.5, 0, Math.PI);
          c.quadraticCurveTo(
            cx + 4 + tongueSway * 0.5,
            y_hinge + tongueLength * 0.7,
            cx + 3.5,
            y_hinge + 1,
          );
          c.closePath();
          c.fill();
          c.stroke();

          // Razor-sharp Golden Fangs lining the lower edge
          c.fillStyle = "#ffeaa7";
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 0.8;
          let toothSpacing = 3.5;
          for (
            let tOff = -w / 2 + 3.5;
            tOff <= w / 2 - 3.5;
            tOff += toothSpacing
          ) {
            c.beginPath();
            c.moveTo(cx + tOff - 1.2, y_hinge + revealH);
            c.lineTo(cx + tOff, y_hinge + revealH - Math.max(1, 4 * P));
            c.lineTo(cx + tOff + 1.2, y_hinge + revealH);
            c.closePath();
            c.fill();
            c.stroke();
          }

          // Spooky glowing eyes peering from the depths of the void
          let eyePulse = 0.5 + Math.sin(time / 100) * 0.5;
          c.fillStyle = `rgba(239, 68, 68, ${0.45 + eyePulse * 0.55})`;
          c.beginPath();
          c.arc(cx - 5, y_hinge + 2, 0.85, 0, Math.PI * 2);
          c.arc(cx + 5, y_hinge + 2, 0.85, 0, Math.PI * 2);
          c.fill();

          c.restore();
        }

        // 6. LATCH CLASP HANGING REVEAL
        if (P > 0.01) {
          c.save();
          c.translate(cx, y_hinge);
          let latchAngle = P * ((55 * Math.PI) / 180);
          c.rotate(-latchAngle);

          c.fillStyle =
            tier === "iron_bound"
              ? "#475569"
              : tier === "gilded"
                ? "#ffd700"
                : "#00ffff";
          c.strokeStyle =
            tier === "iron_bound"
              ? "#0f172a"
              : tier === "gilded"
                ? "#855800"
                : "#ffffff";
          c.lineWidth = 0.8;
          c.fillRect(-1.5, 0, 3, 5);
          c.strokeRect(-1.5, 0, 3, 5);
          c.restore();
        }

        // 7. FRONT LAYER: closedScaleY Rotating Closed Lid (Front Face)
        if (closedScaleY > 0.01) {
          c.save();
          c.translate(cx, y_hinge);
          c.scale(1, closedScaleY);

          if (isFlash) {
            c.fillStyle = "#ffffff";
            c.strokeStyle = "#ffffff";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(-w / 2, 0);
            c.quadraticCurveTo(0, -lidH - 2, w / 2, 0);
            c.closePath();
            c.fill();
            c.stroke();
          } else {
            let lidGrad = c.createLinearGradient(-w / 2, -lidH, -w / 2, 0);
            if (tier === "iron_bound") {
              lidGrad.addColorStop(0, "#7c3f12");
              lidGrad.addColorStop(0.5, "#5c2e0b");
              lidGrad.addColorStop(1, "#2a1204");
            } else if (tier === "gilded") {
              lidGrad.addColorStop(0, "#9e1b32");
              lidGrad.addColorStop(0.5, "#800020");
              lidGrad.addColorStop(1, "#4a0404");
            } else {
              lidGrad.addColorStop(0, "#312e81");
              lidGrad.addColorStop(0.5, "#1e1b4b");
              lidGrad.addColorStop(1, "#09051d");
            }

            c.fillStyle = lidGrad;
            c.strokeStyle =
              tier === "iron_bound"
                ? "#100903"
                : tier === "gilded"
                  ? "#200101"
                  : "#a855f7";
            c.lineWidth = 1.5;

            c.beginPath();
            c.moveTo(-w / 2, 0);
            c.quadraticCurveTo(0, -lidH - 2, w / 2, 0);
            c.closePath();
            c.fill();
            c.stroke();

            // Highlight line on lid
            c.strokeStyle =
              tier === "astral"
                ? "rgba(0, 255, 255, 0.35)"
                : "rgba(255, 255, 255, 0.15)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(-w / 2 + 3, -2);
            c.quadraticCurveTo(0, -lidH + 1, w / 2 - 3, -2);
            c.stroke();

            // Bandings clipped to closed lid
            c.save();
            c.beginPath();
            c.moveTo(-w / 2, 0);
            c.quadraticCurveTo(0, -lidH - 2, w / 2, 0);
            c.closePath();
            c.clip();

            c.fillStyle =
              tier === "iron_bound"
                ? "#334155"
                : tier === "gilded"
                  ? "#ffd700"
                  : "#00ffff";
            c.strokeStyle =
              tier === "iron_bound"
                ? "#0f172a"
                : tier === "gilded"
                  ? "#855800"
                  : "#ffffff";
            c.lineWidth = 0.8;
            c.fillRect(-w / 2 + 3, -lidH - 2, 3.5, lidH + 2);
            c.strokeRect(-w / 2 + 3, -lidH - 2, 3.5, lidH + 2);
            c.fillRect(w / 2 - 6.5, -lidH - 2, 3.5, lidH + 2);
            c.strokeRect(w / 2 - 6.5, -lidH - 2, 3.5, lidH + 2);
            c.restore();

            // Top-lip teeth lining the underside of the lid
            if (P > 0.01) {
              c.fillStyle = "#ffeaa7";
              c.strokeStyle = "#4d2e1a";
              c.lineWidth = 0.5;
              let topToothSpacing = 4.0;
              for (
                let tOff = -w / 2 + 4.5;
                tOff <= w / 2 - 4.5;
                tOff += topToothSpacing
              ) {
                c.beginPath();
                c.moveTo(tOff - 1.0, 0);
                c.lineTo(tOff, Math.max(0.5, 3.5 * P));
                c.lineTo(tOff + 1.0, 0);
                c.closePath();
                c.fill();
                c.stroke();
              }
            }

            // Dividing Seam
            c.strokeStyle =
              tier === "iron_bound"
                ? "#100903"
                : tier === "gilded"
                  ? "#855800"
                  : "#a855f7";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(-w / 2, 0);
            c.lineTo(w / 2, 0);
            c.stroke();

            // Lock hardware plate
            let lockW = 6;
            let lockH = 7;
            let lockX = -lockW / 2;
            let lockY = -3;

            let lockGrad = c.createLinearGradient(
              lockX,
              lockY,
              lockX,
              lockY + lockH,
            );
            if (tier === "iron_bound") {
              lockGrad.addColorStop(0, "#64748b");
              lockGrad.addColorStop(1, "#334155");
              c.strokeStyle = "#0f172a";
            } else if (tier === "gilded") {
              lockGrad.addColorStop(0, "#ffe57f");
              lockGrad.addColorStop(1, "#ffc107");
              c.strokeStyle = "#855800";
            } else {
              lockGrad.addColorStop(0, "#ffffff");
              lockGrad.addColorStop(0.5, "#00ffff");
              lockGrad.addColorStop(1, "#008b8b");
              c.strokeStyle = "#008b8b";
            }

            c.fillStyle = lockGrad;
            c.lineWidth = 1.0;
            c.fillRect(lockX, lockY, lockW, lockH);
            c.strokeRect(lockX, lockY, lockW, lockH);

            if (tier === "gilded") {
              c.fillStyle = "#e74c3c";
              c.beginPath();
              c.arc(0, lockY + 2.5, 1.2, 0, Math.PI * 2);
              c.fill();
            } else {
              c.fillStyle = "#100903";
              c.beginPath();
              c.arc(0, lockY + 2.5, 1.0, 0, Math.PI * 2);
              c.fill();
              if (tier === "iron_bound") {
                c.fillRect(-0.5, lockY + 2.5, 1.0, 2.5);
              }
            }
          }
          c.restore();
        }

        // 8. Active Spark/Ember Spawning
        emitHoardMimicSpark(P, tier, cx, cy);
      } else if (vType === "gilded_scuttler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;
        let time = Date.now();
        let legWalk = Math.sin(time / 60) * 3;

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
        c.lineWidth = 2.4;
        for (let i = -1; i <= 1; i += 2) {
          let legX = cx + i * 12;
          c.beginPath();
          c.moveTo(legX, cy + 4);
          c.lineTo(legX + i * 6 + legWalk * i, cy + 12);
          c.stroke();

          c.beginPath();
          c.moveTo(legX - i * 4, cy + 4);
          c.lineTo(legX - i * 10 - legWalk * i, cy + 12);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.ellipse(cx - 10, cy - 2, 4, 3, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(cx - 12, cy - 2);
        c.quadraticCurveTo(cx - 18, cy - 8 + legWalk, cx - 22, cy - 4);
        c.quadraticCurveTo(cx - 16, cy, cx - 12, cy - 2);
        c.fill();
        c.stroke();

        let sAngle = Math.PI / 12 + Math.sin(time / 150) * 0.05;
        c.save();
        c.translate(cx + 2, cy - 2);
        c.rotate(sAngle);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#967507";
        c.beginPath();
        c.arc(0, 0, 13.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
        c.beginPath();
        c.arc(0, 0, 12, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#b7950b";
          c.lineWidth = 1.2;
          c.beginPath();
          c.arc(0, 0, 10, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-4, -4);
          c.lineTo(4, 4);
          c.moveTo(4, -4);
          c.lineTo(-4, 4);
          c.moveTo(0, -5);
          c.lineTo(0, 5);
          c.stroke();

          c.fillStyle = "rgba(255, 255, 255, 0.8)";
          c.beginPath();
          c.arc(-5, -5, 2, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.beginPath();
          c.arc(cx - 12, cy - 3, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "golem") {
        // --- MOUNTAIN PEAK OVERHAUL: ANCIENT STONE GOLEM ---
        let time = Date.now();
        let hover = Math.sin(time / 200) * 3.5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#4a5568"; // Dark basalt
        let mossColor = m.flashTimer > 0 ? "#ffffff" : "#2d5a27"; // Overgrown moss
        let coreColor = m.isRare ? "#ff007f" : "#38bdf8"; // Azure energy

        // 1. Draw Large Levitating Boulders (Back Shoulders)
        c.fillStyle = bodyColor;
        for (let i = -1; i <= 1; i += 2) {
          c.save();
          c.translate(cx + i * 11, cy - 10);
          c.rotate(i * 0.2 + Math.sin(time / 400 + i) * 0.1);
          c.beginPath();
          c.roundRect(-5, -5, 10, 12, [2]);
          c.fill();
          c.stroke();
          // Chiseled highlights
          if (m.flashTimer === 0) {
            c.strokeStyle = "rgba(255,255,255,0.15)";
            c.lineWidth = 1;
            c.strokeRect(-3, -3, 2.5, 2.5);
          }
          c.restore();
        }

        // 2. Main Basalt Core Torso
        c.fillStyle = bodyColor;
        c.beginPath();
        c.moveTo(cx - 12, cy - 7);
        c.lineTo(cx + 12, cy - 7);
        c.lineTo(cx + 15, cy + 5);
        c.lineTo(cx, cy + 16);
        c.lineTo(cx - 15, cy + 5);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Mossy Overgrowth Patches
        if (m.flashTimer === 0) {
          c.fillStyle = mossColor;
          c.beginPath();
          c.ellipse(cx - 5, cy - 3, 4, 2.5, Math.PI / 4, 0, Math.PI * 2);
          c.ellipse(cx + 7, cy + 3, 3.5, 2, -Math.PI / 6, 0, Math.PI * 2);
          c.fill();
        }

        // 4. Floating Granite Head
        let headY = cy - 20;
        c.fillStyle = "#718096";
        c.beginPath();
        c.roundRect(cx - 8, headY - 7, 16, 14, [4]);
        c.fill();
        c.stroke();

        // 5. Pulsing Runic Core Eye
        if (m.flashTimer === 0) {
          let pulse = 0.8 + Math.sin(time / 150) * 0.2;
          c.save();
          c.shadowBlur = 10 * pulse;
          c.shadowColor = coreColor;
          c.fillStyle = coreColor;
          c.beginPath();
          c.arc(cx, headY, 3.2 * pulse, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(cx, headY, 1.0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // 6. Heavy Floating Gauntlets
        for (let i = -1; i <= 1; i += 2) {
          let handX = cx + i * 18;
          let handY = cy + 3 + Math.sin(time / 250 + i) * 2;
          c.save();
          c.translate(handX, handY);
          c.rotate(i * 0.15);
          c.fillStyle = bodyColor;
          c.beginPath();
          c.roundRect(-6, -7, 12, 16, [3]);
          c.fill();
          c.stroke();
          // Runic Markings on Fists
          if (m.flashTimer === 0) {
            c.strokeStyle = coreColor;
            c.lineWidth = 1.2;
            c.globalAlpha = 0.6 + Math.sin(time / 150) * 0.4;
            c.beginPath();
            c.moveTo(-2.5, -1.5);
            c.lineTo(2.5, -1.5);
            c.moveTo(0, -3.5);
            c.lineTo(0, 1.5);
            c.stroke();
          }
          c.restore();
        }
      } else if (vType === "wyrmling") {
        // --- MOUNTAIN PEAK OVERHAUL: CRYSTAL FROST WYRM ---
        let time = Date.now();
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(time / 150) * 4;

        let bodyColor = m.flashTimer > 0 ? "#ffffff" : "#2b6cb0"; // Deep sapphire
        let crystalColor = m.isRare ? "#a855f7" : "#81ecec"; // Cyan/Purple ice

        // 1. Render Segmented Serpentine Body
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 7.5;
          let segY = cy + Math.sin(time / 200 - i * 0.8) * 6;
          let radius = 8 - i * 1.2;

          // Back Ice Shards (rendered behind segment)
          if (m.flashTimer === 0) {
            c.fillStyle = crystalColor;
            c.globalAlpha = 0.6;
            c.beginPath();
            c.moveTo(segX - 2, segY - radius);
            c.lineTo(segX, segY - radius - 6 + i);
            c.lineTo(segX + 2, segY - radius);
            c.closePath();
            c.fill();
            c.globalAlpha = 1.0;
          }

          // Main Segment Body
          let segGrad = c.createRadialGradient(
            segX - 2,
            segY - 2,
            1,
            segX,
            segY,
            radius,
          );
          if (m.flashTimer > 0) {
            segGrad.addColorStop(0, "#ffffff");
            segGrad.addColorStop(1, "#ffffff");
          } else {
            segGrad.addColorStop(0, crystalColor);
            segGrad.addColorStop(1, bodyColor);
          }
          c.fillStyle = segGrad;
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        // 2. Slender Draconic Head
        let headY = cy - 14;
        c.fillStyle = bodyColor;
        c.beginPath();
        c.ellipse(cx, headY, 8, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Crystalline Horns
        for (let i = -1; i <= 1; i += 2) {
          c.fillStyle = crystalColor;
          c.beginPath();
          c.moveTo(cx + i * 3, headY - 4);
          c.lineTo(cx + i * 6, headY - 12);
          c.lineTo(cx + i * 1, headY - 6);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // 4. Glowing Sub-Zero Eyes
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.shadowBlur = 6;
          c.shadowColor = crystalColor;
          c.beginPath();
          c.arc(cx - 3, headY - 2, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, headY - 2, 1.5, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }

        // 5. Frost Breath Vapor
        emitWyrmlingFrostVapor(m, cx, headY);
      } else if (vType === "rift_drifter") {
        let hover = Math.sin(Date.now() / 110) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 12);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, "#e84393");
        coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(cx, cy, 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#8e44ad";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          let angle = Date.now() / 180 + (i * Math.PI * 2) / 3;
          let sx = cx + Math.cos(angle) * 16;
          let sy = cy + Math.sin(angle) * 8;
          c.beginPath();
          c.moveTo(sx, sy - 4);
          c.lineTo(sx + 3, sy);
          c.lineTo(sx, sy + 4);
          c.lineTo(sx - 3, sy);
          c.closePath();
          c.fill();
          c.stroke();
        }
      } else if (vType === "star_weaver") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 130) * 4;
        c.save();
        c.strokeStyle = "#3498db";
        c.lineWidth = 1.8;
        c.shadowBlur = 10;
        c.shadowColor = "#3498db";
        c.beginPath();
        c.moveTo(cx, cy - 12);
        c.lineTo(cx + 10, cy);
        c.lineTo(cx + 6, cy + 10);
        c.lineTo(cx - 6, cy + 10);
        c.lineTo(cx - 10, cy);
        c.closePath();
        c.stroke();
        c.fillStyle = "#ffffff";
        let joints = [
          [cx, cy - 12],
          [cx + 10, cy],
          [cx + 6, cy + 10],
          [cx - 6, cy + 10],
          [cx - 10, cy],
        ];
        joints.forEach((j) => {
          c.beginPath();
          c.arc(j[0], j[1], 2.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        });
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let legYOffset = i < 2 ? -4 : 4;
          let swing = Math.sin(Date.now() / 80 + i) * 6;
          c.beginPath();
          c.moveTo(cx + 10 * side, cy + legYOffset);
          c.lineTo(cx + 22 * side + swing, cy + legYOffset - 4);
          c.lineTo(cx + 26 * side + swing, cy + legYOffset + 14);
          c.stroke();
        }
        c.restore();
      } else if (vType === "void_wraith") {
        let hover = Math.sin(Date.now() / 150) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 - 2 + hover;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b0a2a";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(cx, cy - 16);
        c.quadraticCurveTo(cx - 12, cy - 6, cx - 10, cy + 14);
        c.lineTo(cx - 4, cy + 8);
        c.lineTo(cx, cy + 18);
        c.lineTo(cx + 4, cy + 8);
        c.lineTo(cx + 10, cy + 14);
        c.quadraticCurveTo(cx + 13, cy - 6, cx, cy - 16);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(Date.now() / 100) * 3;
          c.beginPath();
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 16 + clawSwing, cy + 4);
          c.lineTo(cx - 20 + clawSwing, cy + 1);
          c.moveTo(cx - 8, cy + 2);
          c.lineTo(cx - 17 + clawSwing, cy + 7);
          c.stroke();
          c.fillStyle = "#e84393";
          c.shadowBlur = 6;
          c.shadowColor = "#e84393";
          c.beginPath();
          c.ellipse(cx - 3, cy - 5, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 1, cy - 5, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
      } else if (vType === "sprout") {
        let squish = Math.sin(Date.now() / 110) * 1.5;
        let wScale = (m.w / 2 + squish) * 0.65;
        let hScale = (m.h / 2 - squish) * 0.65;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 4;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
        c.beginPath();
        c.ellipse(
          cx,
          cy - hScale * 0.4,
          wScale * 0.65,
          hScale * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#1e272e";
          let eyeOffsetX = wScale * 0.22;
          let eyeY = cy - hScale * 0.45;
          let eyeSize = Math.max(1, hScale * 0.12);
          c.beginPath();
          c.arc(cx - eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX, eyeY, eyeSize, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(231, 76, 60, 0.45)";
          c.beginPath();
          c.ellipse(cx - eyeOffsetX - 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.ellipse(cx + eyeOffsetX + 2, eyeY + 2, 2, 1, 0, 0, Math.PI * 2);
          c.fill();
        }
        let capY = cy - hScale * 1.05;
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f1c40f" : "#ff6b1a";
        c.beginPath();
        c.ellipse(cx, capY, wScale * 1.25, hScale * 0.85, 0, Math.PI, 0);
        c.lineTo(cx + wScale * 1.25, capY + hScale * 0.1);
        c.quadraticCurveTo(
          cx,
          capY + hScale * 0.4,
          cx - wScale * 1.25,
          capY + hScale * 0.1,
        );
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "rgba(255, 255, 255, 0.5)";
          c.beginPath();
          c.ellipse(
            cx - wScale * 0.5,
            capY - hScale * 0.35,
            wScale * 0.3,
            hScale * 0.15,
            -Math.PI / 6,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
      } else if (vType === "sprout_cocoon") {
        // --- HIGH FIDELITY SUMMON COCOON ---
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let pulse = Math.sin(time / 100) * 1.5;

        // Ground shadow
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(cx, cy + 8, 8, 3, 0, 0, Math.PI * 2);
        c.fill();

        // Outer silk shell
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdfdfd";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(cx, cy, 9, 13 + pulse * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Translucent green energy webbing pulsing inside
        if (m.flashTimer === 0) {
          c.strokeStyle = "rgba(46, 204, 113, 0.6)";
          c.lineWidth = 1.0;
          c.beginPath();
          c.moveTo(cx - 6, cy - 6);
          c.lineTo(cx + 6, cy + 6);
          c.moveTo(cx + 6, cy - 6);
          c.lineTo(cx - 6, cy + 6);
          c.stroke();

          // Inner green core glow
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, 6 + pulse);
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.5, "#2ecc71");
          coreGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, 6 + Math.abs(pulse), 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "magma_vent") {
        // --- HIGH FIDELITY MOLTEN VENT ---
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let pulse = Math.sin(time / 80) * 2;
        let r = 10 + pulse;

        // Ground shadow
        c.fillStyle = "rgba(0, 0, 0, 0.4)";
        c.beginPath();
        c.ellipse(cx, cy + 4, r + 2, 3, 0, 0, Math.PI * 2);
        c.fill();

        // Outer glowing magma rim
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#c0392b";
        c.strokeStyle = "#ff5500";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Inner bubbling yellow core
        if (m.flashTimer === 0) {
          let coreGrad = c.createRadialGradient(cx, cy, 1, cx, cy, r * 0.7);
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.3, "#f1c40f");
          coreGrad.addColorStop(0.8, "#d35400");
          coreGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "toxic_spore") {
        // --- HIGH FIDELITY TOXIC SPORE MINION ---
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let pulse = Math.sin(time / 90) * 1.8;
        let r = 8 + pulse;

        // Ground shadow
        c.fillStyle = "rgba(0, 0, 0, 0.35)";
        c.beginPath();
        c.ellipse(cx, cy + 6, r, 2.5, 0, 0, Math.PI * 2);
        c.fill();

        // Translucent outer green protective bubble
        let sporeGrad = c.createRadialGradient(cx, cy, 1, cx, cy, r + 4);
        sporeGrad.addColorStop(0, "#ffffff");
        sporeGrad.addColorStop(0.4, "rgba(46, 204, 113, 0.8)");
        sporeGrad.addColorStop(1, "rgba(39, 174, 96, 0)");
        c.fillStyle = sporeGrad;
        c.beginPath();
        c.arc(cx, cy, r + 4, 0, Math.PI * 2);
        c.fill();

        // Central biological spore bulb core
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#27ae60";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(cx, cy, r - 2, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Glimmer spot
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(cx - 2, cy - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "thorn_wyrm") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 130;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          c.beginPath();
          c.moveTo(segX, segY + 2);
          c.lineTo(segX - 2, segY + 7 + Math.sin(time * 2 + i) * 2);
          c.stroke();
        }
        for (let i = 4; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#e67e22" : "#27ae60";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#f1c40f" : "#1e8449";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.quadraticCurveTo(
              segX + 3,
              segY - radius - 4,
              segX,
              segY - radius - 5,
            );
            c.quadraticCurveTo(
              segX - 2,
              segY - radius - 2,
              segX - 1,
              segY - radius,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#f39c12" : "#2ecc71";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3;
        c.beginPath();
        c.arc(hX, hY, 6.8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = m.isRare ? "#ffea75" : "#2ecc71";
          c.beginPath();
          c.moveTo(hX - 2, hY - 5);
          c.quadraticCurveTo(hX - 7, hY - 10, hX - 9, hY - 9);
          c.quadraticCurveTo(hX - 5, hY - 4, hX - 1, hY - 4);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(hX - 2.5, hY - 1, 1.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#1e272e";
          c.beginPath();
          c.arc(hX - 3, hY - 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "gargoyle") {
        // --- MOUNTAIN PEAK OVERHAUL: SENTINEL GARGOYLE ---
        let time = Date.now();
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;

        let cycle = (m.hopTimer || 0) % 45;
        let isLunging = cycle < 15;
        let wings = isLunging
          ? Math.sin(time / 60) * 18
          : Math.sin(time / 150) * 6;
        let hover = isLunging ? 0 : Math.sin(time / 150) * 3;
        cy += hover;

        let stoneColor = m.flashTimer > 0 ? "#ffffff" : "#4a5568"; // Weathered basalt
        let mossColor = m.flashTimer > 0 ? "#ffffff" : "#2d5a27"; // Ancient moss
        let coreColor = m.isRare ? "#a855f7" : "#f39c12"; // Amber/Purple heart

        // 1. Heavy Stone Bat-Wings
        c.fillStyle = "#2d3748";
        for (let i = -1; i <= 1; i += 2) {
          c.save();
          c.translate(cx + i * 4, cy - 2);
          c.rotate(i * 0.4 + (i * wings * Math.PI) / 180);
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(i * 22, -14);
          c.lineTo(i * 18, 6);
          c.lineTo(i * 22, 16);
          c.lineTo(i * 8, 8);
          c.closePath();
          c.fill();
          c.stroke();
          // Wing membrane details
          if (m.flashTimer === 0) {
            c.strokeStyle = "rgba(0,0,0,0.3)";
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(i * 5, -2);
            c.lineTo(i * 15, -8);
            c.stroke();
          }
          c.restore();
        }

        // 2. Chiseled Torso
        c.fillStyle = stoneColor;
        c.beginPath();
        c.ellipse(cx, cy + 4, 9, 12, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Ancient Moss Growth
        if (m.flashTimer === 0) {
          c.fillStyle = mossColor;
          c.beginPath();
          c.ellipse(cx - 4, cy + 1, 4, 3, Math.PI / 4, 0, Math.PI * 2);
          c.ellipse(cx + 5, cy + 7, 3, 2.5, -Math.PI / 4, 0, Math.PI * 2);
          c.fill();
        }

        // 4. Runic Heart Core
        if (m.flashTimer === 0) {
          let heartPulse = 0.8 + Math.sin(time / 200) * 0.2;
          c.save();
          c.shadowBlur = 10 * heartPulse;
          c.shadowColor = coreColor;
          c.fillStyle = coreColor;
          c.beginPath();
          c.moveTo(cx, cy + 2);
          c.lineTo(cx - 3, cy - 1);
          c.lineTo(cx, cy - 4);
          c.lineTo(cx + 3, cy - 1);
          c.closePath();
          c.fill();
          c.restore();
        }

        // 5. Masonry Head with Horns
        let headY = cy - 12;
        c.fillStyle = stoneColor;
        c.beginPath();
        c.arc(cx, headY, 7.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Chiseled Stone Horns
        for (let i = -1; i <= 1; i += 2) {
          c.fillStyle = "#2d3748";
          c.beginPath();
          c.moveTo(cx + i * 5, headY - 5);
          c.quadraticCurveTo(cx + i * 12, headY - 14, cx + i * 14, headY - 12);
          c.lineTo(cx + i * 2, headY - 3);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // 6. Glowing Amber Eyes
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.shadowBlur = 6;
          c.shadowColor = coreColor;
          c.beginPath();
          c.arc(cx - 2.5, headY - 1, 1.5, 0, Math.PI * 2);
          c.arc(cx + 2.5, headY - 1, 1.5, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }

        // 7. Ancient Weathered Greatsword
        c.save();
        c.translate(cx - 12, cy + 8);
        c.rotate(-Math.PI / 4 + (isLunging ? -0.2 : 0));
        c.fillStyle = "#718096";
        c.beginPath();
        c.roundRect(-2, -18, 4, 22, [1]);
        c.fill();
        c.stroke();
        // Crossguard
        c.fillStyle = "#4a5568";
        c.fillRect(-5, 0, 10, 2.5);
        c.strokeRect(-5, 0, 10, 2.5);
        // Runic blade glint
        if (m.flashTimer === 0) {
          c.strokeStyle = coreColor;
          c.lineWidth = 0.8;
          c.globalAlpha = 0.5;
          c.beginPath();
          c.moveTo(0, -14);
          c.lineTo(0, -4);
          c.stroke();
        }
        c.restore();
      } else if (vType === "magma_elemental") {
        let flicker = Math.sin(Date.now() / 60) * 3;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a0805";
        c.beginPath();
        c.roundRect(cx - 14, cy - 6, 28, 22, [4]);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#ff5500";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - 6, cy);
          c.stroke();
        }
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#d35400";
        c.beginPath();
        c.moveTo(cx - 14, cy);
        c.quadraticCurveTo(cx - 24 - flicker, cy + 4, cx - 20, cy + 12);
        c.lineTo(cx - 11, cy + 6);
        c.moveTo(cx + 14, cy);
        c.quadraticCurveTo(cx + 24 + flicker, cy + 4, cx + 20, cy + 12);
        c.lineTo(cx + 11, cy + 6);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d110b";
        c.beginPath();
        c.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#e67e22";
        c.beginPath();
        c.moveTo(cx - 6, cy - 18);
        c.quadraticCurveTo(cx, cy - 28 - flicker, cx + 6, cy - 18);
        c.quadraticCurveTo(cx + 3, cy - 12, cx - 3, cy - 12);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(cx - 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 12, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "lava_serpent") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 140;
        emitLavaSerpentEmber(cx, cy);
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff8c00" : "#1c0905";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ffffff" : "#ff3300";
            c.beginPath();
            c.arc(segX, segY, radius * 0.45, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#2c110c";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 2, segY - radius - 3);
            c.lineTo(segX - 3, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff4500" : "#110200";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 6, hY - 6);
        c.lineTo(hX - 7, hY - 5);
        c.lineTo(hX - 8, hY + 1);
        c.lineTo(hX + 6, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#e67e22";
          c.beginPath();
          c.moveTo(hX + 2, hY - 5);
          c.quadraticCurveTo(hX + 7, hY - 11, hX + 10, hY - 10);
          c.lineTo(hX + 3, hY - 2);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 1, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "hell_bat") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 3;
        let batWing = Math.sin(Date.now() / 70) * 11;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e1f26";
        c.beginPath();
        c.ellipse(cx, cy, 7, 11, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#962d22";
        c.beginPath();
        c.moveTo(cx - 5, cy - 2);
        c.quadraticCurveTo(
          cx - 18,
          cy - 12 - batWing,
          cx - 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx - 12, cy, cx - 5, cy - 2);
        c.moveTo(cx + 5, cy - 2);
        c.quadraticCurveTo(
          cx + 18,
          cy - 12 - batWing,
          cx + 22,
          cy - 5 - batWing,
        );
        c.quadraticCurveTo(cx + 12, cy, cx + 5, cy - 2);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ff6b6b";
          c.beginPath();
          c.arc(cx - 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.arc(cx + 2, cy - 4, 1.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "swamp_basilisk") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 150;
        for (let i = 5; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.8) * 3.5;
          let radius = 6.5 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#1a3a22";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.fillStyle = m.isRare ? "#ff007f" : "#9b59b6";
            c.beginPath();
            c.moveTo(segX + 1, segY - radius);
            c.lineTo(segX - 1, segY - radius - 4);
            c.lineTo(segX - 2, segY - radius);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#00b894" : "#122c19";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.moveTo(hX + 7, hY - 7);
        c.lineTo(hX - 8, hY - 3);
        c.lineTo(hX - 7, hY + 4);
        c.lineTo(hX + 7, hY + 7);
        c.closePath();
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(hX - 6, hY - 1);
          c.lineTo(hX - 8, hY + 2);
          c.lineTo(hX - 4, hY + 1);
          c.closePath();
          c.fill();
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(hX - 2, hY - 2, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "toxic_fly") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 110) * 4;
        let wing = Math.sin(Date.now() / 60) * 11;
        c.fillStyle = "rgba(46, 204, 113, 0.4)";
        c.beginPath();
        c.ellipse(cx - 7, cy - 4, 5, 12 + wing, -Math.PI / 4, 0, Math.PI * 2);
        c.ellipse(cx + 7, cy - 4, 5, 12 + wing, Math.PI / 4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2ecc71";
        c.beginPath();
        c.ellipse(cx, cy + 9, 5, 7, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      } else if (vType === "marsh_ghost") {
        // Render a wispy, translucent, floating swamp phantom
        let hover = Math.sin(Date.now() / 140) * 6;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Translucent glowing trail
        let glowTime = Date.now() / 200;
        let trailGrad = c.createLinearGradient(cx, cy - 10, cx, cy + 22);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(46, 204, 113, 0.7)");
          trailGrad.addColorStop(0.5, "rgba(155, 89, 182, 0.4)");
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 12, cy - 4);
        c.quadraticCurveTo(cx - 16, cy + 8, cx - 4, cy + 22);
        c.lineTo(cx + 4, cy + 22);
        c.quadraticCurveTo(cx + 16, cy + 8, cx + 12, cy - 4);
        c.closePath();
        c.fill();

        // Wispy spirit head
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111a14";
        c.strokeStyle = "#000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 10, 9, Math.PI, 0);
        c.lineTo(cx + 9, cy + 2);
        c.quadraticCurveTo(cx + 6, cy + 8, cx, cy + 12);
        c.quadraticCurveTo(cx - 6, cy + 8, cx - 9, cy + 2);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          // Glowing swamp eyes
          c.fillStyle = "#55efc4";
          c.shadowBlur = 6;
          c.shadowColor = "#55efc4";
          c.beginPath();
          c.arc(cx - 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.arc(cx + 3, cy - 10, 1.8, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
        c.restore();
      } else if (vType === "void_orb") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 800;

        // 1. Draw BACK segment of the gravity ring first (Math.PI to 2*Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, Math.PI, 0); // Upper arc (behind core)
          c.stroke();
          c.restore();
        }

        // 2. Draw Void Orb core sphere
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.beginPath();
        c.arc(cx, cy, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the gravity ring last (0 to Math.PI)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.8;
          c.save();
          c.translate(cx, cy);
          c.rotate(rot);
          c.beginPath();
          c.ellipse(0, 0, 22, 6, 0, 0, Math.PI); // Lower arc (in front of core)
          c.stroke();
          c.restore();
        }
      } else if (vType === "void_crawler") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + 2;
        let time = Date.now() / 150;
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          c.beginPath();
          c.moveTo(segX, segY + 1);
          c.lineTo(segX - 3, segY + 9 + Math.sin(time * 3.5 + i) * 2.5);
          c.stroke();
        }
        for (let i = 6; i >= 0; i--) {
          let segX = cx + i * 5.5;
          let segY = cy + Math.sin(time - i * 0.7) * 3.5;
          let radius = 6.2 - i * 0.7;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#1a022b";
          c.beginPath();
          c.arc(segX, segY, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          if (m.flashTimer === 0) {
            c.strokeStyle = "#8e44ad";
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(segX - 1, segY - radius + 2);
            c.lineTo(segX + 1, segY - radius + 2);
            c.stroke();
          }
        }
        c.fillStyle =
          m.flashTimer > 0 ? "#ffffff" : m.isRare ? "#ff007f" : "#11001c";
        let hX = cx - 5;
        let hY = cy + Math.sin(time) * 3.5;
        c.beginPath();
        c.arc(hX, hY, 6.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(hX - 2, hY - 4);
          c.quadraticCurveTo(
            hX - 9,
            hY - 9 + Math.sin(time * 3) * 2.5,
            hX - 14,
            hY - 6 + Math.sin(time * 3) * 2.5,
          );
          c.stroke();
          c.fillStyle = "#ff007f";
          c.beginPath();
          c.arc(hX - 3, hY - 2, 1.0, 0, Math.PI * 2);
          c.arc(hX - 1, hY - 1, 0.8, 0, Math.PI * 2);
          c.arc(hX - 3, hY + 1, 0.8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (vType === "void_spectre") {
        // Render a floating ethereal void phantom cloaked in cosmic energy
        let hover = Math.sin(Date.now() / 150) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.save();
        // Swirling Void Aura Backplate (Translucent glowing trail)
        let trailGrad = c.createLinearGradient(cx, cy - 14, cx, cy + 24);
        if (m.flashTimer > 0) {
          trailGrad.addColorStop(0, "#ffffff");
          trailGrad.addColorStop(1, "rgba(255,255,255,0)");
        } else {
          trailGrad.addColorStop(0, "rgba(142, 68, 173, 0.75)"); // Deep void purple
          trailGrad.addColorStop(0.5, "rgba(232, 67, 147, 0.4)"); // Hot magenta pink
          trailGrad.addColorStop(1, "rgba(0,0,0,0)");
        }

        c.fillStyle = trailGrad;
        c.beginPath();
        c.moveTo(cx - 14, cy - 5);
        c.quadraticCurveTo(cx - 18, cy + 10, cx - 5, cy + 24);
        c.lineTo(cx + 5, cy + 24);
        c.quadraticCurveTo(cx + 18, cy + 10, cx + 14, cy - 5);
        c.closePath();
        c.fill();

        // Main cloaked phantom torso (Wispy obsidian hood/robes)
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a"; // Pitch void black
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(cx, cy - 11, 8.5, Math.PI, 0); // Hood crown
        c.lineTo(cx + 8.5, cy + 4);
        c.quadraticCurveTo(cx + 5, cy + 12, cx, cy + 16); // Robe trail point
        c.quadraticCurveTo(cx - 5, cy + 12, cx - 8.5, cy + 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Spooky glowing eyes inside the dark hood
        if (m.flashTimer === 0) {
          c.fillStyle = "#e84393"; // Intense magenta neon
          c.shadowBlur = 8;
          c.shadowColor = "#e84393";
          c.beginPath();
          // Slanted sinister phantom slits
          c.ellipse(cx - 3, cy - 10, 1.2, 3, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 3, cy - 10, 1.2, 3, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0; // Reset
        }

        // Claws of the Spectre (Floating segmented dark arms on sides)
        if (m.flashTimer === 0) {
          c.strokeStyle = "#8e44ad";
          c.lineWidth = 2.0;
          let clawSwing = Math.sin(Date.now() / 110) * 3;
          // Left Claw
          c.beginPath();
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 16 + clawSwing, cy - 1);
          c.lineTo(cx - 19 + clawSwing, cy - 4);
          c.moveTo(cx - 8, cy - 3);
          c.lineTo(cx - 17 + clawSwing, cy + 3);
          c.stroke();
          // Right Claw
          c.beginPath();
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 16 - clawSwing, cy - 1);
          c.lineTo(cx + 19 - clawSwing, cy - 4);
          c.moveTo(cx + 8, cy - 3);
          c.lineTo(cx + 17 - clawSwing, cy + 3);
          c.stroke();
        }
        c.restore();
      } else if (vType === "clockwork_scarab") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 100) * 3;
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
        c.beginPath();
        c.ellipse(cx, cy, 12, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if (m.flashTimer === 0) {
          c.strokeStyle = "#4d2e1a";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(cx, cy - 9);
          c.lineTo(cx, cy + 9);
          c.stroke();
          c.save();
          c.translate(cx, cy);
          c.rotate((Date.now() / 1500) % (Math.PI * 2));
          c.fillStyle = "#f1c40f";
          c.beginPath();
          c.arc(0, 0, 4, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.restore();
        }
        c.strokeStyle = "#7a5c1f";
        c.lineWidth = 1.8;
        for (let i = -1; i <= 1; i += 2) {
          let legSwing = Math.sin(Date.now() / 80 + i) * 3;
          c.beginPath();
          c.moveTo(cx + 6 * i, cy);
          c.lineTo(cx + 14 * i + legSwing, cy + 6);
          c.stroke();
          c.beginPath();
          c.moveTo(cx + 6 * i, cy - 4);
          c.lineTo(cx + 15 * i + legSwing, cy - 6);
          c.stroke();
        }
      } else if (vType === "temporal_watcher") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 140) * 4;
        let time = Date.now();
        c.save();
        c.translate(cx, cy);

        // Orbiting brass ring
        c.strokeStyle = "rgba(220, 160, 76, 0.4)";
        c.lineWidth = 1.0;
        c.beginPath();
        c.ellipse(0, 0, 18, 6, time / 800, 0, Math.PI * 2);
        c.stroke();

        // Mechanical brass eyeball housing
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(0, 0, 10, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          // Gold pupil iris
          c.fillStyle = "#ffd700";
          c.beginPath();
          c.arc(2, -1, 4.5, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Piercing yellow lens core
          let pulse = Math.sin(time / 100) * 0.5 + 1.5;
          c.fillStyle = "#ffffff";
          c.shadowBlur = 6;
          c.shadowColor = "#f1c40f";
          c.beginPath();
          c.arc(2.5, -1.5, pulse, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
        c.restore();
      } else if (vType === "clockwork_drone") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + Math.sin(Date.now() / 120) * 4.5;
        let time = Date.now();
        c.save();
        c.translate(cx, cy);

        // Spinning top propeller
        c.save();
        c.translate(0, -9);
        c.rotate(time / 80);
        c.strokeStyle = "#7f8c8d";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(-12, 0);
        c.lineTo(12, 0);
        c.stroke();
        c.restore();

        // Drone central brass hull
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
        c.strokeStyle = "#000000";
        c.lineWidth = 1.8;
        c.beginPath();
        c.roundRect(-8, -8, 16, 14, [3]);
        c.fill();
        c.stroke();

        // Lens sensor
        if (m.flashTimer === 0) {
          c.fillStyle = "#e67e22";
          c.beginPath();
          c.arc(0, 0, 3, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(-0.8, -0.8, 0.8, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      } else if (vType === "neon_spider") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
        c.lineWidth = 2.0;
        c.beginPath();
        c.arc(cx, cy, 6, 0, Math.PI * 2);
        c.stroke();
        for (let i = 0; i < 4; i++) {
          let side = i % 2 === 0 ? -1 : 1;
          let yDir = i < 2 ? -1 : 1;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + 12 * side, cy + 4 * yDir);
          c.lineTo(cx + 16 * side, cy + 14 * yDir);
          c.stroke();
        }
      } else if (vType === "cyber_wraith") {
        let hover = Math.sin(Date.now() / 150) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.82;
        let px = cx + (isGlitchedFrame ? renderRandFloat(-3, 3) : 0);
        let py = cy + (isGlitchedFrame ? renderRandFloat(-2, 2) : 0);

        c.save();
        c.translate(px, py);

        // Holographic cyan cloak trails
        c.fillStyle = "rgba(0, 210, 255, 0.15)";
        c.strokeStyle = "rgba(0, 210, 255, 0.55)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-10, 4);
        c.quadraticCurveTo(-14, 16, -4, 24);
        c.lineTo(4, 24);
        c.quadraticCurveTo(14, 16, 10, 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Cyber cloak torso
        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0f172a";
        c.strokeStyle = "#00d2ff";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(0, -9, 7.5, Math.PI, 0);
        c.lineTo(7.5, 4);
        c.quadraticCurveTo(4, 11, 0, 15);
        c.quadraticCurveTo(-4, 11, -7.5, 4);
        c.closePath();
        c.fill();
        c.stroke();

        // Glowing pink cyber visor eyes
        if (m.flashTimer === 0) {
          c.fillStyle = "#ff007f";
          c.shadowBlur = 8;
          c.shadowColor = "#ff007f";
          c.fillRect(-4, -10, 8, 2);
          c.shadowBlur = 0;
        }
        c.restore();
      } else if (vType === "wireframe_orb") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
        c.lineWidth = 1.5;
        c.save();
        c.translate(cx, cy);
        c.rotate(Date.now() / 600);
        c.strokeRect(-10, -10, 20, 20);
        c.restore();
      } else if (vType === "animated_armor") {
        let hover = Math.sin(Date.now() / 150) * 4;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        if (m.flashTimer === 0) {
          c.save();
          c.strokeStyle = "rgba(0, 210, 255, 0.4)";
          c.lineWidth = 4;
          c.shadowBlur = 10;
          c.shadowColor = "#00d2ff";
          c.beginPath();
          c.roundRect(cx - 14, cy - 14, 28, 30, [4]);
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.ellipse(cx - 18, cy - 8, 7, 5, -Math.PI / 6, 0, Math.PI * 2);
        c.ellipse(cx + 18, cy - 8, 7, 5, Math.PI / 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(cx - 12, cy - 12);
        c.lineTo(cx + 12, cy - 12);
        c.lineTo(cx + 9, cy + 12);
        c.lineTo(cx - 9, cy + 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#00d2ff";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx, cy - 8);
          c.lineTo(cx, cy + 8);
          c.moveTo(cx - 4, cy);
          c.lineTo(cx + 4, cy);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
        c.beginPath();
        c.roundRect(cx - 8, cy - 28, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.fillRect(cx - 5, cy - 22, 10, 2.5);
        }

        c.save();
        c.translate(cx + 12, cy + 6);
        c.rotate(Math.PI / 12 + Math.sin(Date.now() / 120) * 0.05);
        c.fillStyle = "rgba(0, 210, 255, 0.25)";
        c.strokeStyle = "#00d2ff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-2, 0);
        c.lineTo(2, 0);
        c.lineTo(1.5, -24);
        c.lineTo(-1.5, -24);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      } else if (vType === "cursed_blade") {
        let hover = Math.sin(Date.now() / 110) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;
        let rot = Date.now() / 500;

        c.save();
        c.translate(cx, cy);
        c.rotate(rot);

        emitCursedBladeParticle(m, cx, cy);

        if (m.flashTimer === 0) {
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#9b59b6";
          c.strokeStyle = "rgba(155, 89, 182, 0.3)";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-3, -22);
          c.lineTo(3, -22);
          c.lineTo(4, 12);
          c.lineTo(-4, 12);
          c.closePath();
          c.stroke();
          c.restore();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111116";
        c.beginPath();
        c.moveTo(-4, -16);
        c.lineTo(0, -22);
        c.lineTo(4, -14);
        c.lineTo(3.5, 12);
        c.lineTo(-3.5, 12);
        c.closePath();
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#e84393";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(-2, -6);
          c.lineTo(2, -2);
          c.lineTo(-1, 4);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.beginPath();
        c.roundRect(-8, 12, 16, 4, [1]);
        c.fill();
        c.stroke();

        c.fillStyle = "#4a154b";
        c.fillRect(-2, 16, 4, 10);
        c.strokeRect(-2, 16, 4, 10);

        c.fillStyle = "#9b59b6";
        c.beginPath();
        c.arc(0, 27, 2.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.restore();
      } else if (vType === "mimic_shield") {
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2;
        let time = Date.now();
        let breathe = Math.sin(time / 140) * 2;
        let eyeBlink = Math.sin(time / 800);

        c.save();
        c.translate(cx, cy);

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.moveTo(-16, -16);
        c.lineTo(16, -16);
        c.lineTo(18, 2);
        c.lineTo(0, 22);
        c.lineTo(-18, 2);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#7f8c8d";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-13, -13);
        c.lineTo(13, -13);
        c.lineTo(15, 1);
        c.lineTo(0, 18);
        c.lineTo(-15, 1);
        c.closePath();
        c.stroke();

        let mouthOpen = Math.max(1, 3.5 + breathe);
        c.fillStyle = "#110202";
        c.beginPath();
        c.ellipse(0, 2, 8, mouthOpen, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#f1c40f";
        c.strokeStyle = "#000000";
        c.lineWidth = 1;
        let tOffsets = [-5, -2, 2, 5];
        tOffsets.forEach((dx) => {
          c.beginPath();
          c.moveTo(dx - 1.2, 2 - mouthOpen);
          c.lineTo(dx, 2 - mouthOpen + 3);
          c.lineTo(dx + 1.2, 2 - mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(dx - 1.2, 2 + mouthOpen);
          c.lineTo(dx, 2 + mouthOpen - 3);
          c.lineTo(dx + 1.2, 2 + mouthOpen);
          c.closePath();
          c.fill();
          c.stroke();
        });

        if (m.flashTimer === 0) {
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.ellipse(0, -7, 6, 4, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (eyeBlink > -0.85) {
            c.fillStyle = "#e74c3c";
            c.beginPath();
            c.arc(0, -7, 2.5, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, -7, 0.8, 2.2, 0, 0, Math.PI * 2);
            c.fill();
          } else {
            c.strokeStyle = "#000";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-6, -7);
            c.lineTo(6, -7);
            c.stroke();
          }
        }

        c.restore();
      } else if (vType === "slag_slime") {
        let squish = Math.sin(Date.now() / 100) * 3.5;
        let wScale = m.w / 2 + squish;
        let hScale = m.h / 2 - squish;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 10 + squish / 2;

        let slimeGrad = c.createRadialGradient(
          cx - 3,
          cy - 5,
          2,
          cx,
          cy,
          m.w * 0.75,
        );
        if (m.flashTimer > 0) {
          slimeGrad.addColorStop(0, "#ffffff");
          slimeGrad.addColorStop(1, "#ffffff");
        } else {
          slimeGrad.addColorStop(0, "#a3fd83");
          slimeGrad.addColorStop(1, "#27ae60");
        }

        c.fillStyle = slimeGrad;
        c.beginPath();
        c.ellipse(cx, cy, wScale * 1.2, hScale * 0.9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (
          m.flashTimer === 0 &&
          !window.isGamePaused &&
          renderRandom() < 0.25
        ) {
          let bY = cy - hScale * 0.7;
          let bX = cx + renderRandFloat(-wScale * 0.5, wScale * 0.5);
          c.fillStyle = "rgba(46, 204, 113, 0.6)";
          c.beginPath();
          c.arc(bX, bY, renderRandFloat(2, 4), 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        if (m.flashTimer === 0) {
          c.fillStyle = "#7f8c8d";
          c.beginPath();
          c.moveTo(cx - 4, cy - 2);
          c.lineTo(cx + 4, cy - 5);
          c.lineTo(cx + 2, cy + 3);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#110202";
          let eyeOffsetX = wScale * 0.35;
          let eyeOffsetY = hScale * 0.1;
          c.beginPath();
          c.arc(cx - eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.arc(cx + eyeOffsetX + 3, cy - eyeOffsetY, 1.8, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#1e272e";
          c.fillRect(cx - 8, cy + hScale * 0.3, 3, 5);
          c.fillRect(cx + 4, cy + hScale * 0.2, 2, 4);
        }
      } else if (vType === "rust_nibbler") {
        // --- MOUNTAIN PEAK OVERHAUL: SCARRED RUST NIBBLER ---
        let time = Date.now();
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h - 15;

        let cycle = (m.hopTimer || 0) % 20;
        let isMoving = cycle < 12;
        let legSway = isMoving ? Math.sin(time / 60) * 5 : 0;
        let antTwitch = Math.sin(time / 80) * 4;

        let rustColor = m.flashTimer > 0 ? "#ffffff" : "#d35400"; // Corroded iron
        let darkMetal = m.flashTimer > 0 ? "#ffffff" : "#5c3a21"; // Aged bronze
        let eyeColor = m.isRare ? "#a855f7" : "#f1c40f"; // Glowing sulfur

        // 1. Articulated Insectoid Legs
        c.strokeStyle = darkMetal;
        c.lineWidth = 2.0;
        for (let i = -1; i <= 1; i += 2) {
          for (let j = 0; j < 3; j++) {
            let legX = cx + i * (6 + j * 3);
            let legY = cy + 2;
            let offset = j * 0.5;
            let sway = isMoving ? Math.sin(time / 70 + offset) * 6 : 0;

            c.beginPath();
            c.moveTo(legX, legY);
            c.lineTo(legX + i * 8 + sway * i, legY + 10);
            c.stroke();
          }
        }

        // 2. Armored Metallic Carapace
        let bodyGrad = c.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 14);
        if (m.flashTimer > 0) {
          bodyGrad.addColorStop(0, "#ffffff");
          bodyGrad.addColorStop(1, "#ffffff");
        } else {
          bodyGrad.addColorStop(0, "#e67e22");
          bodyGrad.addColorStop(1, rustColor);
        }
        c.fillStyle = bodyGrad;
        c.beginPath();
        c.ellipse(cx, cy, 14, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 3. Segmented Plate Detail
        if (m.flashTimer === 0) {
          c.strokeStyle = "rgba(0,0,0,0.25)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(cx - 7, cy - 6);
          c.lineTo(cx - 7, cy + 6);
          c.moveTo(cx, cy - 8);
          c.lineTo(cx, cy + 8);
          c.moveTo(cx + 7, cy - 6);
          c.lineTo(cx + 7, cy + 6);
          c.stroke();
        }

        // 4. Twitchy Antennae
        c.strokeStyle = rustColor;
        c.lineWidth = 1.5;
        for (let i = -1; i <= 1; i += 2) {
          c.beginPath();
          c.moveTo(cx + 10, cy - 2);
          c.quadraticCurveTo(
            cx + 18,
            cy - 12 + antTwitch * i,
            cx + 24 + antTwitch,
            cy - 8 + antTwitch * i,
          );
          c.stroke();
        }

        // 5. Scavenger's Maw & Multiple Eyes
        c.fillStyle = darkMetal;
        c.beginPath();
        c.arc(cx + 12, cy, 5.5, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = eyeColor;
          c.shadowBlur = 4;
          c.shadowColor = eyeColor;
          // Main eye
          c.beginPath();
          c.arc(cx + 14, cy - 1, 1.8, 0, Math.PI * 2);
          c.fill();
          // Secondary sensory pits
          c.beginPath();
          c.arc(cx + 11, cy - 2, 0.8, 0, Math.PI * 2);
          c.arc(cx + 13, cy + 2, 0.8, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
      } else if (vType === "corroded_golem") {
        let hover = Math.sin(Date.now() / 130) * 2;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 15, cy - 10, 30, 20, [3]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(cx - 8, cy - 4);
          c.lineTo(cx - 2, cy + 2);
          c.lineTo(cx + 6, cy - 6);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5d6d7e";
        c.beginPath();
        c.arc(cx - 18, cy - 6, 6, 0, Math.PI * 2);
        c.arc(cx + 18, cy - 6, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.strokeStyle = "#2ecc71";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(cx - 15, cy + 2);
          c.quadraticCurveTo(cx - 22, cy + 12, cx - 18, cy + 18);
          c.moveTo(cx + 15, cy + 2);
          c.quadraticCurveTo(cx + 22, cy + 12, cx + 18, cy + 18);
          c.stroke();
        }

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 22, cy + 14, 8, 8, [2]);
        c.roundRect(cx + 14, cy + 14, 8, 8, [2]);
        c.fill();
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
        c.beginPath();
        c.roundRect(cx - 8, cy - 24, 16, 14, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#2ecc71";
          c.shadowBlur = 8;
          c.shadowColor = "#2ecc71";
          c.fillRect(cx - 6, cy - 18, 12, 3);
          c.shadowBlur = 0;
        }
      } else if (vType === "calamity_specter") {
        let hover = Math.sin(Date.now() / 110) * 5;
        let cx = m.x + m.w / 2;
        let cy = m.y + m.h / 2 + hover;

        emitCalamitySpecterParticle(m, cx, cy);

        c.save();
        c.translate(cx, cy);
        c.rotate(Math.sin(Date.now() / 250) * 0.15);

        c.strokeStyle = "#451a03";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-16, 24);
        c.lineTo(8, -28);
        c.stroke();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.strokeStyle = "#ff0055";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(8, -28);
        c.quadraticCurveTo(24, -38, 36, -30);
        c.quadraticCurveTo(22, -26, 8, -28);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "#7c3aed";
        c.beginPath();
        c.arc(8, -28, 2.5, 0, Math.PI * 2);
        c.fill();

        c.restore();

        c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
        c.strokeStyle = "#7c3aed";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(cx, cy - 14);
        c.quadraticCurveTo(cx - 15, cy + 4, cx - 12, cy + 22);
        c.lineTo(cx + 12, cy + 22);
        c.quadraticCurveTo(cx + 15, cy + 4, cx, cy - 14);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "#000000";
        c.strokeStyle = "#ff0055";
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(cx - 8, cy - 12, 16, 15, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = "#ff0055";
          c.shadowBlur = 10;
          c.shadowColor = "#ff0055";
          c.beginPath();
          c.ellipse(cx - 3, cy - 5, 1.2, 3.2, Math.PI / 12, 0, Math.PI * 2);
          c.ellipse(cx + 3, cy - 5, 1.2, 3.2, -Math.PI / 12, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
        }
      }

      if (m.isRare) {
        c.save();
        let glowTime = Date.now() / 200;
        let hx = m.x + m.w / 2;
        let hy = m.y - 10 + Math.sin(glowTime) * 2.5;
        c.strokeStyle = "#f1c40f";
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(hx, hy, 11, 3.2, 0, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = "#ffffff";
        for (let i = 0; i < 3; i++) {
          let sparkAngle = glowTime + i * ((Math.PI * 2) / 3);
          let sx = hx + Math.cos(sparkAngle) * 11;
          let sy = hy + Math.sin(sparkAngle) * 3.2;
          c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
        }
        c.restore();
      }

      if (!isSectorZeroMob) {
        c.restore(); // Cleanly exit standard mob downscaling
      }
    } else if (
      m.type === "rift_guardian" ||
      m.type === "aegis_goliath" ||
      m.visualType === "aegis_goliath"
    ) {
      // --- MOUNTAIN PEAK OVERHAUL: CELESTIAL VANGUARD (AEGIS GOLIATH) ---
      let time = Date.now();
      let hover = Math.sin(time / 220) * 10;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;

      let stoneColor = m.flashTimer > 0 ? "#ffffff" : "#2c3e50"; // Dark basalt
      let energyColor = "#38bdf8"; // Azure celestial energy
      let phase2 = m.phase === 2;

      c.save();
      c.translate(cx, cy);

      // 1. Orbital Hex-Shields (Phase 1: Floating, Phase 2: Consolidated)
      if (!phase2) {
        for (let i = 0; i < 3; i++) {
          let orbitTime = time / 1000 + (i * Math.PI * 2) / 3;
          let pulseScale = 1.0 + Math.sin(time / 250 + i * 2) * 0.12;
          let ox = Math.cos(orbitTime) * 55;
          let oy = Math.sin(orbitTime) * 15;
          let oz = Math.sin(orbitTime); // depth sorting factor

          if (oz < 0) {
            // Render behind boss
            drawHexShield(
              c,
              ox,
              oy,
              14 * pulseScale,
              energyColor,
              m.flashTimer > 0,
            );
          }
        }
      }

      // 2. Runic Chains (Swaying with magic inertia)
      c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#4a5568";
      c.lineWidth = 3.0;
      for (let i = -1; i <= 1; i += 2) {
        let chainSway = Math.sin(time / 350 + i * 1.5) * 6;
        c.beginPath();
        c.moveTo(i * 22, -60);
        c.quadraticCurveTo(i * 30, -10, i * 18 + chainSway, 35);
        c.stroke();
        // Runic Chain Glow
        if (m.flashTimer === 0) {
          c.strokeStyle = energyColor;
          c.lineWidth = 1.0;
          c.globalAlpha = 0.4 + Math.sin(time / 200) * 0.3;
          c.stroke();
          c.globalAlpha = 1.0;
        }
      }

      // 3. Heavy Armored Torso (Chiseled Basalt)
      c.fillStyle = stoneColor;
      c.strokeStyle = "#000000";
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, -24);
      c.lineTo(20, -22);
      c.lineTo(26, -2);
      c.lineTo(0, 28);
      c.lineTo(-26, -2);
      c.lineTo(-20, -22);
      c.closePath();
      c.fill();
      c.stroke();

      // 4. Glowing Celestial Core
      if (m.flashTimer === 0) {
        let corePulse = 1.0 + Math.sin(time / 150) * 0.2;
        let coreGrad = c.createRadialGradient(0, -4, 2, 0, -4, 12 * corePulse);
        coreGrad.addColorStop(0, "#ffffff");
        coreGrad.addColorStop(0.4, energyColor);
        coreGrad.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = coreGrad;
        c.beginPath();
        c.arc(0, -4, 14 * corePulse, 0, Math.PI * 2);
        c.fill();

        // Core Runic Cross
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(0, -14);
        c.lineTo(0, 6);
        c.moveTo(-8, -4);
        c.lineTo(8, -4);
        c.stroke();
      }

      // 5. Front-Side Orbital Shields (oz >= 0)
      if (!phase2) {
        for (let i = 0; i < 3; i++) {
          let orbitTime = time / 1000 + (i * Math.PI * 2) / 3;
          let pulseScale = 1.0 + Math.sin(time / 250 + i * 2) * 0.12;
          let ox = Math.cos(orbitTime) * 55;
          let oy = Math.sin(orbitTime) * 15;
          let oz = Math.sin(orbitTime);
          if (oz >= 0) {
            drawHexShield(
              c,
              ox,
              oy,
              14 * pulseScale,
              energyColor,
              m.flashTimer > 0,
            );
          }
        }
      }

      // 6. Phase 2: Massive Tower Shield (Main Boss only)
      let isMiniboss = m.type === "dungeon_miniboss";
      if (phase2 && m.shieldAngle !== undefined && !isMiniboss) {
        c.restore(); // Exit boss-space to use absolute rotations
        c.save();
        c.translate(cx, cy);
        c.rotate(m.shieldAngle + Math.PI / 2); // Positioned toward player

        let shieldX = 0;
        let shieldY = 45; // Offset from boss core

        // Massive Stone Shield Body
        c.fillStyle = stoneColor;
        c.strokeStyle = "#000000";
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(shieldX - 25, shieldY - 40, 50, 80, [4]);
        c.fill();
        c.stroke();

        // Reinforced Iron Bands
        c.fillStyle = "#1a1c23";
        c.fillRect(shieldX - 25, shieldY - 10, 50, 6);
        c.fillRect(shieldX - 25, shieldY + 20, 50, 6);

        // Runic Inscriptions on Shield
        if (m.flashTimer === 0) {
          c.strokeStyle = energyColor;
          c.lineWidth = 1.5;
          c.shadowBlur = 8;
          c.shadowColor = energyColor;
          c.beginPath();
          c.moveTo(shieldX - 15, shieldY - 25);
          c.lineTo(shieldX + 15, shieldY - 25);
          c.moveTo(shieldX, shieldY - 35);
          c.lineTo(shieldX, shieldY - 15);
          c.stroke();
          c.shadowBlur = 0;
        }
      }

      c.restore();

      // Helper for Hex Shields
      function drawHexShield(ctx, x, y, size, color, isFlash) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time / 800);
        ctx.strokeStyle = isFlash ? "#ffffff" : color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = isFlash ? 1.0 : 0.6;
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          let a = (s * Math.PI) / 3;
          ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        }
        ctx.closePath();
        ctx.stroke();
        // Inner Holographic Scanline
        if (!isFlash) {
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.moveTo(-size, Math.sin(time / 200) * size);
          ctx.lineTo(size, Math.sin(time / 200) * size);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else if (m.type === "chronos_arbitrator") {
      let hover = Math.sin(Date.now() / 200) * 8;
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2 + hover;
      c.save();
      c.translate(cx, cy);
      let drawVectorGear = (ctx, x, y, radius, teeth, rot, color) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : color;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < teeth; i++) {
          let teethAngle = (i * Math.PI * 2) / teeth;
          ctx.save();
          ctx.rotate(teethAngle);
          ctx.beginPath();
          ctx.rect(-3, -radius - 3, 6, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = "#111116";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
        for (let i = 0; i < 4; i++) {
          let angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * (radius * 0.6),
            Math.sin(angle) * (radius * 0.6),
            2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      };
      drawVectorGear(
        c,
        -35,
        -28,
        22,
        10,
        -((Date.now() / 400) % (Math.PI * 2)),
        "#7f8c8d",
      );
      drawVectorGear(
        c,
        38,
        24,
        25,
        12,
        ((Date.now() / 500) % (Math.PI * 2)) + 0.5,
        "#d35400",
      );
      drawVectorGear(
        c,
        0,
        0,
        44,
        16,
        (Date.now() / 1500) % (Math.PI * 2),
        "#f1c40f",
      );
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(0, -25);
      c.quadraticCurveTo(-20, -20, -20, 0);
      c.lineTo(-12, 28);
      c.lineTo(12, 28);
      c.lineTo(20, 0);
      c.quadraticCurveTo(20, -20, 0, -25);
      c.closePath();
      c.fill();
      c.stroke();
      if (m.flashTimer === 0) {
        c.strokeStyle = "#1a0f02";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-10, -10);
        c.lineTo(-4, -4);
        c.lineTo(-8, 2);
        c.moveTo(10, -8);
        c.lineTo(6, -2);
        c.stroke();
        c.fillStyle = "#ffffff";
        c.shadowBlur = 8;
        c.shadowColor = "#f1c40f";
        c.beginPath();
        c.arc(-6, -5, 3, 0, Math.PI * 2);
        c.arc(6, -5, 3, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
      c.strokeStyle = "#111116";
      c.lineWidth = 2.5;
      c.lineCap = "round";
      let hrAngle = Date.now() / 10000;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
      c.stroke();
      let minAngle = Date.now() / 1800;
      c.strokeStyle = "#d35400";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24);
      c.stroke();
      c.restore();
    } else if (m.type === "nexus_overseer") {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
      let px = cx + (isGlitchedFrame ? renderRandFloat(-4, 4) : 0);
      let py = cy + (isGlitchedFrame ? renderRandFloat(-3, 3) : 0);
      c.save();
      c.translate(px, py);
      c.rotate(Date.now() / 800);
      c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
      c.lineWidth = 2.0;
      let cycle = Math.floor(Date.now() / 5000) % 3;
      if (cycle === 0) {
        c.strokeRect(-18, -18, 36, 36);
        c.strokeRect(-12, -12, 24, 24);
        c.beginPath();
        c.moveTo(-18, -18);
        c.lineTo(-12, -12);
        c.moveTo(18, -18);
        c.lineTo(12, -12);
        c.moveTo(-18, 18);
        c.lineTo(-12, 12);
        c.moveTo(18, 18);
        c.lineTo(12, 12);
        c.stroke();
      } else if (cycle === 1) {
        c.beginPath();
        c.moveTo(0, -22);
        c.lineTo(-18, 14);
        c.lineTo(18, 14);
        c.closePath();
        c.moveTo(0, -22);
        c.lineTo(0, 18);
        c.lineTo(-18, 14);
        c.moveTo(0, 18);
        c.lineTo(18, 14);
        c.stroke();
      } else {
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          let angle = (i * Math.PI * 2) / 5;
          c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
        }
        c.closePath();
        c.stroke();
      }
      if (m.flashTimer === 0) {
        let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
        c.fillStyle = "#00b894";
        c.beginPath();
        c.arc(0, 0, eyePulse, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 1.5;
        c.stroke();
        c.fillStyle = "#ff007f";
        c.fillRect(-1.2, -4, 2.4, 8);
      }
      c.restore();
    } else if (
      (m.type === "dungeon_boss" && window.playerStats.isDungeonMode) ||
      m.type === "gilded_vault_keeper" ||
      m.type === "corrosive_abomination" ||
      m.type === "overlord_iron_vault" ||
      m.type === "brimstone_colossus" ||
      m.visualType === "gilded_vault_keeper" ||
      m.visualType === "corrosive_abomination" ||
      m.visualType === "overlord_iron_vault" ||
      m.visualType === "brimstone_colossus"
    ) {
      let bounce = 0;
      let coreColor = "#9b59b6";
      let glowColor = "#e84393";
      let shadowColor = "#1a052e";
      if (m.isCrucible) {
        bounce = Math.sin(Date.now() / 150) * 4;
        coreColor = m.flashTimer > 0 ? "#ffffff" : "#9b59b6";
        let rot1 = Date.now() / 700;
        let rot2 = -Date.now() / 500;

        // 1. Draw BACK segment of the core orbital rings first (angles Math.PI to 2*Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Back segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        // Ring 2 Back segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, Math.PI, 0); // Upper arc (behind)
        c.stroke();
        c.restore();

        c.restore();

        // 2. Draw Main Boss Torso
        c.fillStyle = shadowColor;
        c.beginPath();
        c.moveTo(m.x + m.w / 2, m.y + bounce);
        c.lineTo(m.x + m.w, m.y + m.h * 0.4 + bounce);
        c.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x + m.w * 0.2, m.y + m.h * 0.95 + bounce);
        c.lineTo(m.x, m.y + m.h * 0.4 + bounce);
        c.closePath();
        c.fill();
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;
        c.stroke();

        if (m.flashTimer === 0) {
          let coreRadius = 8 + Math.sin(Date.now() / 100) * 3;
          c.fillStyle = coreColor;
          c.shadowBlur = 12;
          c.shadowColor = coreColor;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 - 10 + bounce,
            coreRadius,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();
          c.shadowBlur = 0;
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(m.x + m.w / 2, m.y + m.h / 2 - 10 + bounce, 3, 0, Math.PI * 2);
          c.fill();
        }
        c.fillStyle = "#2c3e50";
        c.beginPath();
        c.moveTo(m.x + m.w * 0.3, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.1,
          m.y - 15 + bounce,
          m.x + m.w * 0.05,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.4, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(m.x + m.w * 0.7, m.y + bounce);
        c.quadraticCurveTo(
          m.x + m.w * 0.9,
          m.y - 15 + bounce,
          m.x + m.w * 0.95,
          m.y - 20 + bounce,
        );
        c.lineTo(m.x + m.w * 0.6, m.y - 5 + bounce);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Draw FRONT segment of the core orbital rings last (angles 0 to Math.PI)
        c.save();
        c.translate(m.x + m.w / 2, m.y + m.h / 2 + bounce);

        // Ring 1 Front segment
        c.strokeStyle = glowColor;
        c.lineWidth = 1.8;
        c.save();
        c.rotate(rot1);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.8, m.h * 0.18, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        // Ring 2 Front segment
        c.strokeStyle = "#9b59b6";
        c.save();
        c.rotate(rot2);
        c.beginPath();
        c.ellipse(0, 0, m.w * 0.6, m.h * 0.22, 0, 0, Math.PI); // Lower arc (in front of body)
        c.stroke();
        c.restore();

        c.restore();
      } else {
        let isBrimstone =
          m.visualType === "brimstone_colossus" ||
          m.type === "brimstone_colossus";
        if (isBrimstone) {
          let bx = m.x;
          let by = m.y;
          let bw = m.w;
          let bh = m.h;
          let cx = bx + bw / 2;
          let cy = by + bh / 2;
          let time = Date.now();
          let hover = Math.sin(time / 200) * 5;

          c.save();
          let embersCount = 4;
          c.translate(cx, cy + hover);
          for (let i = 0; i < embersCount; i++) {
            let angle = time / 400 + (i * Math.PI * 2) / embersCount;
            let sx = Math.cos(angle) * (bw * 0.75);
            let sy = Math.sin(angle) * 10;
            c.save();
            c.translate(sx, sy);
            c.rotate(angle * 2);
            c.strokeStyle = "rgba(255, 85, 0, 0.6)";
            c.fillStyle = "rgba(241, 196, 15, 0.3)";
            c.lineWidth = 1.0;
            c.beginPath();
            c.moveTo(0, -6);
            c.lineTo(4, 2);
            c.lineTo(-4, 2);
            c.closePath();
            c.fill();
            c.stroke();
            c.restore();
          }
          c.restore();

          let suitY = cy - 8 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;

          c.beginPath();
          c.roundRect(cx - 26, suitY - 14, 11, 11, [3]);
          c.roundRect(cx + 15, suitY - 14, 11, 11, [3]);
          c.fill();
          c.stroke();

          c.beginPath();
          c.moveTo(cx - 15, suitY - 8);
          c.lineTo(cx + 15, suitY - 8);
          c.lineTo(cx + 12, suitY + 18);
          c.lineTo(cx, suitY + 28);
          c.lineTo(cx - 12, suitY + 18);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let magmaPulse = 4 + Math.sin(time / 80) * 1.5;
            let magmaGrad = c.createRadialGradient(
              cx,
              suitY + 4,
              1,
              cx,
              suitY + 4,
              magmaPulse + 6,
            );
            magmaGrad.addColorStop(0, "#ffffff");
            magmaGrad.addColorStop(0.4, "#ff5500");
            magmaGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
            c.fillStyle = magmaGrad;
            c.beginPath();
            c.arc(cx, suitY + 4, magmaPulse + 6, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = "#ff3300";
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(cx - 6, suitY + 4);
            c.lineTo(cx + 6, suitY + 4);
            c.moveTo(cx, suitY - 2);
            c.lineTo(cx, suitY + 10);
            c.stroke();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c120c";
          c.beginPath();
          c.roundRect(cx - 9, suitY - 32, 18, 16, [4]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            c.fillStyle = "#ff0000";
            c.beginPath();
            c.rect(cx - 6, suitY - 25, 12, 2.5);
            c.fill();
          }

          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
          c.beginPath();
          c.ellipse(cx - 22, suitY + 12, 4.5, 4.5, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "#5c3a21";
          c.lineWidth = 3.0;
          c.beginPath();
          c.moveTo(cx - 22, suitY + 12);
          c.lineTo(cx - 18, cy + 32 + hover);
          c.stroke();

          let ax = cx - 18;
          let ay = cy + 32 + hover;
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
          c.beginPath();
          c.moveTo(ax - 18, ay - 8);
          c.lineTo(ax + 18, ay - 8);
          c.quadraticCurveTo(ax + 10, ay, ax + 14, ay + 14);
          c.lineTo(ax - 14, ay + 14);
          c.quadraticCurveTo(ax - 10, ay, ax - 18, ay - 8);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            let heatGrad = c.createLinearGradient(
              ax - 20,
              ay - 7,
              ax + 15,
              ay - 2,
            );
            heatGrad.addColorStop(0, "#ffeaa7");
            heatGrad.addColorStop(0.5, "#ff5500");
            heatGrad.addColorStop(1, "rgba(27, 29, 34, 0)");
            c.fillStyle = heatGrad;
            c.beginPath();
            c.rect(ax - 15, ay - 7, 28, 4);
            c.fill();
          }
        } else {
          let dType = window.playerStats.currentDungeon || "gold";
          if (dType === "gold") {
            let bx = m.x;
            let by = m.y;
            let bw = m.w;
            let bh = m.h;
            let cy = by + bh - 5;

            let coinRows = [
              { y: cy, count: 9, size: 10, shift: 0 },
              { y: cy - 5, count: 7, size: 9, shift: 6 },
              { y: cy - 10, count: 5, size: 9, shift: 12 },
              { y: cy - 15, count: 3, size: 8, shift: 18 },
            ];

            coinRows.forEach((row) => {
              let startX = bx + row.shift;
              let spacing = (bw - row.shift * 2) / (row.count + 1);
              for (let i = 1; i <= row.count; i++) {
                let coinX = startX + i * spacing + Math.sin(row.y + i * 2) * 2;
                let coinY = row.y;
                let scaleW = row.size;
                let scaleH = row.size * 0.45;
                let angle = Math.sin(coinX * 0.05) * 0.25;

                c.save();
                c.translate(coinX, coinY);
                c.rotate(angle);

                c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#916900";
                c.beginPath();
                c.ellipse(0, 0, scaleW + 0.8, scaleH + 0.8, 0, 0, Math.PI * 2);
                c.fill();
                c.stroke();

                if (m.flashTimer === 0) {
                  let goldGrad = c.createLinearGradient(
                    -scaleW,
                    -scaleH,
                    scaleW,
                    scaleH,
                  );
                  goldGrad.addColorStop(0, "#fff1a8");
                  goldGrad.addColorStop(0.5, "#ffd700");
                  goldGrad.addColorStop(1, "#b58700");
                  c.fillStyle = goldGrad;
                  c.beginPath();
                  c.ellipse(0, 0, scaleW, scaleH, 0, 0, Math.PI * 2);
                  c.fill();

                  c.strokeStyle = "#805c00";
                  c.lineWidth = 0.8;
                  c.beginPath();
                  c.ellipse(
                    0,
                    0,
                    scaleW * 0.78,
                    scaleH * 0.78,
                    0,
                    0,
                    Math.PI * 2,
                  );
                  c.stroke();

                  c.fillStyle = "rgba(255, 255, 255, 0.85)";
                  c.beginPath();
                  c.ellipse(
                    -scaleW * 0.35,
                    -scaleH * 0.35,
                    scaleW * 0.22,
                    scaleH * 0.18,
                    Math.PI / 4,
                    0,
                    Math.PI * 2,
                  );
                  c.fill();
                }
                c.restore();
              }
            });

            let hover = Math.sin(Date.now() / 150) * 4;
            let idolX = bx + bw / 2;
            let idolY = cy - 28 + hover;
            let time = Date.now();

            // 1. DRAW GIANT SHIELD/SWORD WINGS BEHIND
            let wingFlap = Math.sin(time / 120) * 0.12;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b"; // Golden/Bronze shields
            c.strokeStyle = "#000000";
            c.lineWidth = 2.4;

            for (let side = -1; side <= 1; side += 2) {
              c.save();
              c.translate(idolX + side * 12, idolY - 4);
              c.rotate(side * (Math.PI / 6 + wingFlap));

              // Draw shield wing
              c.beginPath();
              c.moveTo(0, 0);
              c.lineTo(side * 36, -15);
              c.lineTo(side * 28, 12);
              c.lineTo(side * 32, 25);
              c.lineTo(side * 8, 15);
              c.closePath();
              c.fill();
              c.stroke();

              // Shiny inner plate on shield
              c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
              c.beginPath();
              c.moveTo(side * 4, -2);
              c.lineTo(side * 32, -13);
              c.lineTo(side * 25, 10);
              c.closePath();
              c.fill();
              c.stroke();

              c.restore();
            }

            // 2. DRAW THE ANCIENT TREASURY CHEST BODY (Golem Torso)
            let lidAngle = -Math.abs(Math.sin(time / 240)) * 0.35; // Chest snapping open/close

            // Draw Lower Chest Box
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#4a2d18"; // Mahogany wood
            c.beginPath();
            c.roundRect(idolX - 16, idolY - 4, 32, 18, [3]);
            c.fill();
            c.stroke();

            // Iron Corner Bands on the box
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#333339";
            c.fillRect(idolX - 16, idolY - 4, 4, 18);
            c.strokeRect(
              m.flashTimer > 0 ? idolX - 16 : idolX - 16,
              idolY - 4,
              4,
              18,
            );
            c.fillRect(idolX + 12, idolY - 4, 4, 18);
            c.strokeRect(
              m.flashTimer > 0 ? idolX + 12 : idolX + 12,
              idolY - 4,
              4,
              18,
            );

            // 3. DRAW GLOWING RUBY SOUL-CORE (Inside Mouth / Chest Opening)
            if (m.flashTimer === 0) {
              let corePulse = 6 + Math.sin(time / 90) * 2;
              let coreGrad = c.createRadialGradient(
                idolX,
                idolY - 4,
                1,
                idolX,
                idolY - 4,
                corePulse,
              );
              coreGrad.addColorStop(0, "#ffffff");
              coreGrad.addColorStop(0.3, "#ff0055"); // Ruby Core
              coreGrad.addColorStop(1, "rgba(142, 68, 173, 0)");
              c.fillStyle = coreGrad;
              c.beginPath();
              c.arc(idolX, idolY - 4, corePulse + 6, 0, Math.PI * 2);
              c.fill();

              // Draw jagged golden teeth lining the chest rims
              c.fillStyle = "#f1c40f";
              let teethX = [-12, -6, 0, 6, 12];
              teethX.forEach((dx) => {
                // Upper hanging teeth (on the lid, rotates with it)
                c.save();
                c.translate(idolX, idolY - 4);
                c.rotate(lidAngle);
                c.beginPath();
                c.moveTo(dx - 1.8, 0);
                c.lineTo(dx, 4);
                c.lineTo(dx + 1.8, 0);
                c.closePath();
                c.fill();
                c.stroke();
                c.restore();

                // Lower teeth (static)
                c.beginPath();
                c.moveTo(idolX + dx - 1.8, idolY - 4);
                c.lineTo(idolX + dx, idolY - 7);
                c.lineTo(idolX + dx + 1.8, idolY - 4);
                c.closePath();
                c.fill();
                c.stroke();
              });
            }

            // 4. DRAW CHEST LID (Pivoting Head)
            c.save();
            c.translate(idolX, idolY - 4);
            c.rotate(lidAngle);

            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#5c3a21"; // Bright mahogany
            c.beginPath();
            c.roundRect(-16, -11, 32, 11, [4, 4, 1, 1]);
            c.fill();
            c.stroke();

            // Gilded decorative bands on lid
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
            c.fillRect(-15, -11, 3, 11);
            c.strokeRect(-15, -11, 3, 11);
            c.fillRect(12, -11, 3, 11);
            c.strokeRect(12, -11, 3, 11);

            // Giant Gold lock latch
            c.fillRect(-2, -3, 4, 6);
            c.strokeRect(-2, -3, 4, 6);
            c.fillStyle = "#111";
            c.beginPath();
            c.arc(0, 0, 1.2, 0, Math.PI * 2);
            c.fill();

            // Floating Crown of Gold bars above the lid
            if (m.flashTimer === 0) {
              c.fillStyle = "#ffd700";
              c.shadowBlur = 8;
              c.shadowColor = "#ffd700";
              c.beginPath();
              c.moveTo(-8, -15);
              c.lineTo(-12, -21);
              c.lineTo(-6, -18);
              c.lineTo(0, -26); // Tall center point
              c.lineTo(6, -18);
              c.lineTo(12, -21);
              c.lineTo(8, -15);
              c.closePath();
              c.fill();
              c.stroke();
              c.shadowBlur = 0;
            }

            c.restore();

            // 5. GIANT CLAW ARMS (Made of fused gold bars)
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
            let armSwing = Math.sin(time / 100) * 4;

            // Left Arm
            c.beginPath();
            c.roundRect(idolX - 26 + armSwing, idolY + 1, 7, 12, [2]);
            c.fill();
            c.stroke();
            // Left Claws
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
            c.beginPath();
            c.moveTo(idolX - 26 + armSwing, idolY + 13);
            c.lineTo(idolX - 29 + armSwing, 18 + idolY);
            c.lineTo(idolX - 23 + armSwing, idolY + 13);
            c.closePath();
            c.fill();
            c.stroke();

            // Right Arm
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#b7950b";
            c.beginPath();
            c.roundRect(idolX + 19 - armSwing, idolY + 1, 7, 12, [2]);
            c.fill();
            c.stroke();
            // Right Claws
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#ffd700";
            c.beginPath();
            c.moveTo(idolX + 19 - armSwing, idolY + 13);
            c.lineTo(idolX + 22 - armSwing, 18 + idolY);
            c.lineTo(idolX + 26 - armSwing, idolY + 13);
            c.closePath();
            c.fill();
            c.stroke();

            // 6. REAL-TIME EMBER AND SPARK EMISSION
            emitGoldDungeonIdolSpark(idolX, idolY);
          } else if (dType === "mat") {
            let bx = m.x;
            let by = m.y;
            let bw = m.w;
            let bh = m.h;
            let cx = bx + bw / 2;
            let cy = by + bh - 10;
            let time = Date.now();

            c.save();
            c.fillStyle =
              m.flashTimer > 0 ? "#ffffff" : "rgba(39, 174, 96, 0.4)";
            c.beginPath();
            c.ellipse(cx, cy, bw * 0.75, 12, 0, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            let wpRot = (time / 180) % (Math.PI * 2);
            c.strokeStyle = "rgba(46, 204, 113, 0.8)";
            c.lineWidth = 1.8;
            c.save();
            c.translate(cx, cy);
            c.rotate(wpRot);
            c.beginPath();
            c.ellipse(0, 0, bw * 0.6, 6, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
            c.save();
            c.translate(cx, cy);
            c.rotate(-wpRot * 1.5);
            c.beginPath();
            c.ellipse(0, 0, bw * 0.4, 4, 0, 0, Math.PI * 2);
            c.stroke();
            c.restore();
            c.restore();

            let pulseHeight = Math.sin(time / 120) * 5;
            let vortexTopY = by + 20 + pulseHeight;
            let vortexWidth = bw * 0.6;

            let vortexGrad = c.createLinearGradient(
              cx - vortexWidth / 2,
              by,
              cx + vortexWidth / 2,
              cy,
            );
            if (m.flashTimer > 0) {
              vortexGrad.addColorStop(0, "#ffffff");
              vortexGrad.addColorStop(1, "#ffffff");
            } else {
              vortexGrad.addColorStop(0, "#2ecc71");
              vortexGrad.addColorStop(0.5, "#27ae60");
              vortexGrad.addColorStop(1, "#1e8449");
            }

            c.fillStyle = vortexGrad;
            c.beginPath();
            c.moveTo(cx - vortexWidth * 0.4, cy);
            c.quadraticCurveTo(
              cx - vortexWidth * 0.75,
              (cy + vortexTopY) / 2,
              cx - vortexWidth * 0.5,
              vortexTopY,
            );
            c.bezierCurveTo(
              cx - vortexWidth * 0.2,
              vortexTopY - 12,
              cx + vortexWidth * 0.2,
              vortexTopY - 12,
              cx + vortexWidth * 0.5,
              vortexTopY,
            );
            c.quadraticCurveTo(
              cx + vortexWidth * 0.75,
              (cy + vortexTopY) / 2,
              cx + vortexWidth * 0.4,
              cy,
            );
            c.closePath();
            c.fill();
            c.stroke();

            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#27ae60";
            for (let i = -1; i <= 1; i += 2) {
              let sway = Math.sin(time / 140 + i * 2) * 8;
              let pX = cx + i * vortexWidth * 0.4;
              let pY = cy - 22;

              c.beginPath();
              c.moveTo(pX, pY);
              c.quadraticCurveTo(
                pX + i * 22 + sway,
                pY - 15 + sway / 2,
                pX + i * 35 + sway,
                pY + 4 + sway,
              );
              c.quadraticCurveTo(
                pX + i * 22 + sway,
                pY - 5 + sway / 2,
                pX,
                pY + 8,
              );
              c.closePath();
              c.fill();
              c.stroke();
            }

            if (m.flashTimer === 0) {
              c.fillStyle = "#ffffff";
              c.beginPath();
              c.arc(cx, vortexTopY + 14, 8, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.fillStyle = "#9b59b6";
              c.beginPath();
              c.arc(cx, vortexTopY + 14, 3.5, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.fillStyle = "#000000";
              c.beginPath();
              c.arc(cx - 0.5, vortexTopY + 14, 1.5, 0, Math.PI * 2);
              c.fill();

              let eyeOffsets = [
                { dx: -12, dy: 30, r: 4, color: "#e74c3c" },
                { dx: 14, dy: 24, r: 5, color: "#f1c40f" },
                { dx: -6, dy: 44, r: 3, color: "#3498db" },
              ];
              eyeOffsets.forEach((eye) => {
                let ex = cx + eye.dx;
                let ey = vortexTopY + eye.dy;
                c.fillStyle = "#ffffff";
                c.beginPath();
                c.arc(ex, ey, eye.r, 0, Math.PI * 2);
                c.fill();
                c.stroke();
                c.fillStyle = eye.color;
                c.beginPath();
                c.arc(ex, ey, eye.r * 0.5, 0, Math.PI * 2);
                c.fill();
                c.stroke();
              });

              c.fillStyle = "rgba(46, 204, 113, 0.6)";
              c.beginPath();
              c.arc(cx - 10, vortexTopY + 2, 4, 0, Math.PI * 2);
              c.arc(cx + 8, vortexTopY + 6, 5, 0, Math.PI * 2);
              c.fill();
            }

            if (m.flashTimer === 0) {
              let dropProgress = (time / 6) % 35;
              c.fillStyle = "#2ecc71";
              c.beginPath();
              c.ellipse(
                cx - 8,
                vortexTopY + 15 + dropProgress,
                1.5,
                3,
                0,
                0,
                Math.PI * 2,
              );
              c.fill();
              let dropProgress2 = (time / 8 + 15) % 40;
              c.fillStyle = "#7bed9f";
              c.beginPath();
              c.ellipse(
                cx + 10,
                vortexTopY + 10 + dropProgress2,
                1.2,
                2.5,
                0,
                0,
                Math.PI * 2,
              );
              c.fill();
            }
          } else if (dType === "equip") {
            let bx = m.x;
            let by = m.y;
            let bw = m.w;
            let bh = m.h;
            let cx = bx + bw / 2;
            let cy = by + bh / 2;
            let time = Date.now();
            let hover = Math.sin(time / 200) * 5;

            c.save();
            let shardOrbitAngle = time / 600;
            let shardCount = 5;
            c.translate(cx, cy + hover);
            for (let i = 0; i < shardCount; i++) {
              let angle = shardOrbitAngle + (i * Math.PI * 2) / shardCount;
              let sx = Math.cos(angle) * (bw * 0.78);
              let sy = Math.sin(angle) * 12;

              c.save();
              c.translate(sx, sy);
              c.rotate(angle * 1.5);

              c.strokeStyle = "rgba(52, 152, 219, 0.65)";
              c.fillStyle = "rgba(52, 152, 219, 0.18)";
              c.lineWidth = 1.2;

              if (i % 2 === 0) {
                c.beginPath();
                c.moveTo(0, -10);
                c.lineTo(2.5, 2);
                c.lineTo(1, 10);
                c.lineTo(-1, 10);
                c.lineTo(-2.5, 2);
                c.closePath();
                c.fill();
                c.stroke();
              } else {
                c.beginPath();
                c.moveTo(-5, -6);
                c.lineTo(5, -6);
                c.lineTo(4, 2);
                c.lineTo(0, 8);
                c.lineTo(-4, 2);
                c.closePath();
                c.fill();
                c.stroke();
              }
              c.restore();
            }
            c.restore();

            let suitY = cy - 8 + hover;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
            c.strokeStyle = "#000000";
            c.lineWidth = 2.4;

            c.beginPath();
            c.roundRect(cx - 26, suitY - 14, 11, 11, [3]);
            c.roundRect(cx + 15, suitY - 14, 11, 11, [3]);
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(cx - 15, suitY - 8);
            c.lineTo(cx + 15, suitY - 8);
            c.lineTo(cx + 12, suitY + 18);
            c.lineTo(cx, suitY + 28);
            c.lineTo(cx - 12, suitY + 18);
            c.closePath();
            c.fill();
            c.stroke();

            if (m.flashTimer === 0) {
              let corePulse = 4 + Math.sin(time / 80) * 1.5;
              let furnaceGrad = c.createRadialGradient(
                cx,
                suitY + 4,
                1,
                cx,
                suitY + 4,
                corePulse + 6,
              );
              furnaceGrad.addColorStop(0, "#ffffff");
              furnaceGrad.addColorStop(0.4, "#e67e22");
              furnaceGrad.addColorStop(1, "rgba(211, 84, 0, 0)");
              c.fillStyle = furnaceGrad;
              c.beginPath();
              c.arc(cx, suitY + 4, corePulse + 6, 0, Math.PI * 2);
              c.fill();

              c.strokeStyle = "#1a252f";
              c.lineWidth = 2.0;
              c.beginPath();
              c.moveTo(cx - 6, suitY + 4);
              c.lineTo(cx + 6, suitY + 4);
              c.moveTo(cx, suitY - 2);
              c.lineTo(cx, suitY + 10);
              c.stroke();
            }

            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a252f";
            c.beginPath();
            c.roundRect(cx - 9, suitY - 32, 18, 16, [4]);
            c.fill();
            c.stroke();
            if (m.flashTimer === 0) {
              c.fillStyle = "#ff5500";
              c.beginPath();
              c.rect(cx - 6, suitY - 25, 12, 2.5);
              c.fill();
            }

            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2c3e50";
            c.beginPath();
            c.ellipse(cx - 22, suitY + 12, 4.5, 4.5, 0, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            c.strokeStyle = "#5d6d7e";
            c.lineWidth = 3.0;
            c.beginPath();
            c.moveTo(cx - 22, suitY + 12);
            c.lineTo(cx - 18, cy + 32 + hover);
            c.stroke();

            let ax = cx - 18;
            let ay = cy + 32 + hover;
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1b1d22";
            c.beginPath();
            c.moveTo(ax - 18, ay - 8);
            c.lineTo(ax + 18, ay - 8);
            c.quadraticCurveTo(ax + 10, ay, ax + 14, ay + 14);
            c.lineTo(ax - 14, ay + 14);
            c.quadraticCurveTo(ax - 10, ay, ax - 18, ay - 8);
            c.closePath();
            c.fill();
            c.stroke();

            c.beginPath();
            c.moveTo(ax - 18, ay - 8);
            c.quadraticCurveTo(ax - 28, ay - 11, ax - 30, ay - 5);
            c.quadraticCurveTo(ax - 18, ay, ax - 18, ay + 2);
            c.closePath();
            c.fill();
            c.stroke();

            if (m.flashTimer === 0) {
              let heatGrad = c.createLinearGradient(
                ax - 20,
                ay - 7,
                ax + 15,
                ay - 2,
              );
              heatGrad.addColorStop(0, "#ffeaa7");
              heatGrad.addColorStop(0.5, "#d35400");
              heatGrad.addColorStop(1, "rgba(27, 29, 34, 0)");
              c.fillStyle = heatGrad;
              c.beginPath();
              c.rect(ax - 15, ay - 7, 28, 4);
              c.fill();
            }
          }
        }
      }
    } else if (m.visualType === "marcus" || m.type === "marcus_boss") {
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      let time = Date.now();
      let hover = Math.sin(time / 150) * 4.5;
      let merchantY = cy - 4 + hover;

      c.save();

      // 1. Double Outer Orbiting Gold Coin Rings
      let rotSpeed = time / 600;
      c.strokeStyle = "rgba(241, 196, 15, 0.4)";
      c.lineWidth = 1.2;
      c.save();
      c.translate(cx, merchantY + 8);
      c.rotate(rotSpeed);
      c.beginPath();
      c.ellipse(0, 0, m.w * 0.75, m.w * 0.28, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // 2. Merchant Silhouette (Sitting cross-legged)
      c.fillStyle = "rgba(0, 0, 0, 0.45)";
      c.beginPath();
      c.ellipse(cx, cy + 8, 14, 4.5, 0, 0, Math.PI * 2);
      c.fill();

      // Draped Cloak Base (Crossed legs)
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e152a";
      c.strokeStyle = "#000000";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(cx - 15, merchantY + 8);
      c.quadraticCurveTo(cx, merchantY + 11, cx + 15, merchantY + 8);
      c.lineTo(cx + 12, merchantY);
      c.lineTo(cx - 12, merchantY);
      c.closePath();
      c.fill();
      c.stroke();

      // Cloak Torso
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#130d22";
      c.beginPath();
      c.moveTo(cx - 9, merchantY);
      c.lineTo(cx + 9, merchantY);
      c.lineTo(cx + 6, merchantY - 14);
      c.lineTo(cx - 6, merchantY - 14);
      c.closePath();
      c.fill();
      c.stroke();

      // Gold Clasp
      c.fillStyle = "#ffd700";
      c.beginPath();
      c.arc(cx, merchantY - 11, 2.2, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Hooded Cowl
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1e152a";
      c.beginPath();
      c.moveTo(cx - 6, merchantY - 14);
      c.quadraticCurveTo(cx - 9, merchantY - 24, cx, merchantY - 26);
      c.quadraticCurveTo(cx + 9, merchantY - 24, cx + 6, merchantY - 14);
      c.closePath();
      c.fill();
      c.stroke();

      // Deep Hood Void (Face Cavity)
      c.fillStyle = "#05040a";
      c.beginPath();
      c.ellipse(cx, merchantY - 20, 4.0, 5.0, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Pulsing Crimson Wrath Eyes
      let eyePulse = 0.75 + Math.sin(time / 100) * 0.25;
      c.fillStyle = `rgba(231, 76, 60, ${eyePulse})`;
      c.beginPath();
      c.arc(cx - 1.8, merchantY - 20, 0.9, 0, Math.PI * 2);
      c.arc(cx + 1.8, merchantY - 20, 0.9, 0, Math.PI * 2);
      c.fill();

      // Floating Halo Ring
      if (m.flashTimer === 0) {
        c.strokeStyle = "rgba(241, 196, 15, 0.55)";
        c.lineWidth = 1.5;
        c.shadowBlur = 8;
        c.shadowColor = "#f1c40f";
        c.beginPath();
        c.ellipse(cx, merchantY - 29, 8, 2.2, 0, 0, Math.PI * 2);
        c.stroke();
        c.shadowBlur = 0;
      }

      c.restore();
    } else if (
      m.type === "prestige_boss" ||
      m.type === "hooktail" ||
      m.visualType === "hooktail"
    ) {
      let hoverY = Math.sin(Date.now() / 150) * 6;
      let jawOpen = Math.abs(Math.sin(Date.now() / 400)) * 12;
      c.save();
      c.translate(m.x, m.y + hoverY);
      let baseW = 70;
      let baseH = 80;
      let scaleX = m.w / baseW;
      let scaleY = m.h / baseH;
      c.scale(scaleX, scaleY);

      let auraGlow = c.createRadialGradient(
        baseW / 2,
        baseH / 2,
        10,
        baseW / 2,
        baseH / 2,
        100,
      );
      auraGlow.addColorStop(0, "rgba(231, 76, 60, 0.45)");
      auraGlow.addColorStop(0.5, "rgba(142, 68, 173, 0.15)");
      auraGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = auraGlow;
      c.beginPath();
      c.arc(baseW / 2 + 30, baseH / 2, 80, 0, Math.PI * 2);
      c.fill();

      for (let i = 6; i >= 1; i--) {
        let segX = baseW / 2 + i * 18;
        let segY = baseH / 2 + Math.sin(Date.now() / 180 + i * 0.7) * 8;
        c.save();
        c.fillStyle = i % 2 === 0 ? "#111116" : "#5a0e0e";
        c.strokeStyle = "#000000";
        c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
        c.beginPath();
        c.arc(segX, segY, 26 - i * 2.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();

        emitHooktailSegmentSmoke(m, segX, segY, scaleX, scaleY, hoverY);
      }

      c.save();
      c.fillStyle = "#d35400";
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(baseW - 25, -20);
      c.quadraticCurveTo(baseW + 5, -50, baseW + 22, -45);
      c.quadraticCurveTo(baseW - 3, -25, baseW - 30, -5);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.fillStyle = "#110202";
      c.strokeStyle = "#e74c3c";
      c.lineWidth = 3 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let wingFlap = Math.sin(Date.now() / 100) * 12;
      c.translate(baseW / 2 + 50, baseH / 2 + 10);
      c.rotate((wingFlap * Math.PI) / 180);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(50, -30);
      c.lineTo(60, 5);
      c.lineTo(40, 15);
      c.lineTo(55, 35);
      c.lineTo(5, 22);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#111115";
      c.beginPath();
      c.moveTo(baseW - 5, -15);
      c.lineTo(baseW - 20, 10);
      c.lineTo(baseW - 15, -25);
      c.lineTo(baseW - 35, 12);
      c.lineTo(5, 5);
      c.lineTo(-10, 18);
      c.lineTo(-15, 30);
      c.lineTo(5, 38);
      c.lineTo(baseW - 10, 38);
      c.lineTo(baseW, 15);
      c.closePath();
      c.fill();
      c.stroke();

      if (m.flashTimer === 0) {
        c.fillStyle = "#ff0000";
        c.beginPath();
        c.ellipse(22, 18, 8, 6, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#f1c40f";
        c.beginPath();
        c.ellipse(22, 18, 2, 5, Math.PI / 12, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c2833";
      c.beginPath();
      c.moveTo(-10, 18);
      c.lineTo(-26, 23);
      c.lineTo(-10, 28);
      c.closePath();
      c.fill();
      c.stroke();
      c.save();
      c.translate(15, 38);
      c.rotate((-jawOpen * Math.PI) / 180);
      c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#631c15";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-25, 4);
      c.lineTo(5, 15);
      c.lineTo(baseW - 15, 10);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#ffeaa7";
      c.beginPath();
      c.moveTo(-15, 2);
      c.lineTo(-12, 9);
      c.lineTo(-9, 2);
      c.fill();
      c.restore();
      c.restore();

      c.save();
      c.strokeStyle = "#000000";
      c.lineWidth = 2.4 / Math.max(scaleX, scaleY);
      c.lineJoin = "round";
      let tailSwayTime = Date.now() / 150;
      for (let i = 1; i <= 6; i++) {
        let segmentSway = Math.sin(tailSwayTime - i * 0.4) * (i * 2.0);
        let segX = 100 + i * 12 + segmentSway;
        let segY = 48 - i * 4 + i * i * 0.5;
        let r = 18 - i * 2.0;
        c.fillStyle = i % 2 === 0 ? "#111116" : "#4a0a0a";
        c.beginPath();
        c.arc(segX, segY, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      let tipSway = Math.sin(tailSwayTime - 6 * 0.4) * 12;
      let tipX = 100 + 72 + tipSway;
      let tipY = 48 - 24 + 18;
      c.fillStyle = "#d35400";
      c.beginPath();
      c.moveTo(tipX, tipY);
      c.quadraticCurveTo(tipX + 18, tipY - 8, tipX + 28, tipY - 22);
      c.quadraticCurveTo(tipX + 12, tipY - 14, tipX + 2, tipY - 4);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
      c.restore();
    } else {
      let currentTier = t !== undefined ? t : window.getStageTier();
      let bounce = 0;

      if (currentTier === 0) {
        let rMob = m;
        let drawVisageOnTop = false;

        if (m.type === "dungeon_miniboss") {
          // --- MINIBOSS: Keep the shrunken head-and-legs look you like ---
          c.save();
          let centerBossX = m.x + m.w / 2;
          let centerBossY = m.y + m.h / 2;
          c.translate(centerBossX, centerBossY);
          c.scale(0.45, 0.45);
          c.translate(-centerBossX, -centerBossY);
        } else {
          // --- FULL BOSS: Aspect-Ratio Decoupled & Towering Proportions ---
          drawVisageOnTop = true;
          c.save();

          // Pivot the scaled transform at the bottom-center of the mob box (standing on ground)
          let groundX = m.x + m.w / 2;
          let groundY = m.y + m.h;
          c.translate(groundX, groundY);

          // Standard native design dimension envelope for the Treant:
          let baseW = 80;
          let baseH = 120;

          // Scale proportionally based on a majestic target width of 125px
          let targetWidth = 72;
          let scaleFactor = targetWidth / baseW;
          c.scale(scaleFactor, scaleFactor);

          // Center the drawing space on the pivot coordinate
          c.translate(-baseW / 2, -baseH);

          // Proxy reference redirecting coordinates to the localized space
          rMob = {
            ...m,
            x: 0,
            y: 0,
            w: baseW,
            h: baseH,
          };
        }

        // Background glow layer for Rare targets to immediately signify high-tier spawns
        if (rMob.isRare) {
          c.save();
          let auraPulse = 1 + Math.sin(Date.now() / 150) * 0.12;
          let auraGrad = c.createRadialGradient(
            rMob.x + rMob.w / 2,
            rMob.y + rMob.h / 2,
            2,
            rMob.x + rMob.w / 2,
            rMob.y + rMob.h / 2,
            Math.max(rMob.w, rMob.h) * 1.15 * auraPulse,
          );
          auraGrad.addColorStop(0, "rgba(241, 196, 15, 0.45)");
          auraGrad.addColorStop(0.6, "rgba(230, 126, 34, 0.18)");
          auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          c.fillStyle = auraGrad;
          c.beginPath();
          c.arc(
            rMob.x + rMob.w / 2,
            rMob.y + rMob.h / 2,
            Math.max(rMob.w, rMob.h) * 1.15 * auraPulse,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.restore();
        }

        // Wrap with a pivot coordinate space to organic-sway and breathe from the root base
        c.save();
        let ox = rMob.x + rMob.w / 2;
        let oy = rMob.y + rMob.h;
        let sway = Math.sin(Date.now() / 240) * 0.035;
        let breatheW = 1 + Math.sin(Date.now() / 150) * 0.015;
        let breatheH = 1 + Math.cos(Date.now() / 150) * 0.008;

        c.translate(ox, oy);
        c.rotate(sway);
        c.scale(breatheW, breatheH);
        c.translate(-ox, -oy);

        // ==========================================
        // 1. HORRIFIC JAGGED ARACHNOID TREANT LEGS (ROOT OVERHAUL)
        // ==========================================
        let legColorDark = rMob.flashTimer > 0 ? "#ffffff" : "#221105";
        let legColorMid = rMob.flashTimer > 0 ? "#ffffff" : "#3b1e0a";
        let legColorHighlight = rMob.flashTimer > 0 ? "#ffffff" : "#512c14";

        c.strokeStyle = "#000000";
        c.lineWidth = 2.4;

        let legYBase = rMob.y + rMob.h - 10;
        let legOffsets = [
          { dx: -12, stretchX: -36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -6, stretchX: -26, kneeY: -25, tipY: 10, col: legColorMid },
          { dx: 6, stretchX: 26, kneeY: -25, tipY: 10, col: legColorHighlight },
          { dx: 12, stretchX: 36, kneeY: -15, tipY: 10, col: legColorDark },
          { dx: -16, stretchX: -46, kneeY: -5, tipY: 10, col: legColorDark },
          { dx: 16, stretchX: 46, kneeY: -5, tipY: 10, col: legColorDark },
        ];

        legOffsets.forEach((leg, index) => {
          let legRootX = rMob.x + rMob.w / 2 + leg.dx;
          let kneeX = legRootX + leg.stretchX * 0.6;
          let kneeY =
            legYBase + leg.kneeY + Math.sin(Date.now() / 120 + index) * 3;
          let tipX = legRootX + leg.stretchX;
          let tipY = rMob.y + rMob.h + leg.tipY;

          c.fillStyle = leg.col;
          c.beginPath();
          c.moveTo(legRootX, legYBase);
          c.quadraticCurveTo(
            kneeX - 4 * Math.sign(leg.stretchX),
            kneeY - 4,
            kneeX,
            kneeY,
          );
          c.lineTo(tipX, tipY);
          c.lineTo(tipX - 5 * Math.sign(leg.stretchX), tipY);
          c.lineTo(kneeX - 4 * Math.sign(leg.stretchX), kneeY + 4);
          c.lineTo(legRootX, legYBase + 8);
          c.closePath();
          c.fill();
          c.stroke();
        });

        // Dangling silk cocoon swaying beneath the lower canopy
        if (rMob.flashTimer === 0) {
          c.save();
          let cocoonSway = Math.sin(Date.now() / 180) * 0.12;
          c.translate(rMob.x + rMob.w * 0.25, rMob.y + rMob.h * 0.25);
          c.rotate(cocoonSway);

          c.strokeStyle = "rgba(255, 255, 255, 0.45)";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(0, 18);
          c.stroke();

          c.fillStyle = "rgba(235, 235, 240, 0.9)";
          c.strokeStyle = "#222";
          c.lineWidth = 1;
          c.beginPath();
          c.ellipse(0, 26, 6, 10, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          c.strokeStyle = "rgba(255, 255, 255, 0.75)";
          c.beginPath();
          c.moveTo(-4, 20);
          c.lineTo(4, 32);
          c.moveTo(4, 20);
          c.lineTo(-4, 32);
          c.stroke();
          c.restore();
        }

        // ==========================================
        // 2. TWISTED ANCIENT TRUNK & STRIATIONS
        // ==========================================
        c.fillStyle = rMob.flashTimer > 0 ? "#ffffff" : "#462810";
        c.beginPath();
        c.moveTo(rMob.x + rMob.w * 0.32, rMob.y + rMob.h * 0.3); // Left shoulder
        c.quadraticCurveTo(
          rMob.x + rMob.w * 0.2,
          rMob.y + rMob.h * 0.6,
          rMob.x + rMob.w * 0.12,
          rMob.y + rMob.h - 12,
        ); // Left flare
        c.lineTo(rMob.x + rMob.w * 0.88, rMob.y + rMob.h - 12); // Right base flare
        c.quadraticCurveTo(
          rMob.x + rMob.w * 0.8,
          rMob.y + rMob.h * 0.6,
          rMob.x + rMob.w * 0.68,
          rMob.y + rMob.h * 0.3,
        ); // Right shoulder
        c.closePath();
        c.fill();
        c.stroke();

        if (rMob.flashTimer === 0) {
          c.fillStyle = "#5d381b"; // Midtone wood plates
          c.beginPath();
          c.moveTo(rMob.x + rMob.w * 0.35, rMob.y + rMob.h * 0.35);
          c.bezierCurveTo(
            rMob.x + rMob.w * 0.25,
            rMob.y + rMob.h * 0.6,
            rMob.x + rMob.w * 0.3,
            rMob.y + rMob.h * 0.75,
            rMob.x + rMob.w * 0.22,
            rMob.y + rMob.h - 13,
          );
          c.lineTo(rMob.x + rMob.w * 0.78, rMob.y + rMob.h - 13);
          c.bezierCurveTo(
            rMob.x + rMob.w * 0.7,
            rMob.y + rMob.h * 0.75,
            rMob.x + rMob.w * 0.75,
            rMob.y + rMob.h * 0.6,
            rMob.x + rMob.w * 0.65,
            rMob.y + rMob.h * 0.32,
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.strokeStyle = "#251205";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(rMob.x + rMob.w * 0.44, rMob.y + rMob.h * 0.32);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.38,
            rMob.y + rMob.h * 0.55,
            rMob.x + rMob.w * 0.42,
            rMob.y + rMob.h - 14,
          );
          c.moveTo(rMob.x + rMob.w * 0.56, rMob.y + rMob.h * 0.32);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.62,
            rMob.y + rMob.h * 0.58,
            rMob.x + rMob.w * 0.58,
            rMob.y + rMob.h - 14,
          );
          c.moveTo(rMob.x + rMob.w * 0.25, rMob.y + rMob.h * 0.52);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.18,
            rMob.y + rMob.h * 0.75,
            rMob.x + rMob.w * 0.26,
            rMob.y + rMob.h - 14,
          );
          c.stroke();

          c.strokeStyle = "#1b7a43";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(rMob.x + rMob.w * 0.28, rMob.y + rMob.h * 0.75);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.5,
            rMob.y + rMob.h * 0.68,
            rMob.x + rMob.w * 0.72,
            rMob.y + rMob.h * 0.72,
          );
          c.stroke();
        }

        // ==========================================
        // 3. GLOWING GREEN RIFT RUNES & COBWEBS
        // ==========================================
        if (rMob.flashTimer === 0) {
          let runeGlow = Math.abs(Math.sin(Date.now() / 250)) * 0.7 + 0.3;
          c.save();
          c.strokeStyle = `rgba(0, 255, 136, ${runeGlow})`;
          c.lineWidth = 2.2;
          c.shadowBlur = 10;
          c.shadowColor = "#00ff88";
          c.beginPath();
          c.moveTo(rMob.x + rMob.w * 0.25, rMob.y + rMob.h * 0.65);
          c.lineTo(rMob.x + rMob.w * 0.2, rMob.y + rMob.h * 0.72);
          c.lineTo(rMob.x + rMob.w * 0.27, rMob.y + rMob.h * 0.77);
          c.moveTo(rMob.x + rMob.w * 0.75, rMob.y + rMob.h * 0.65);
          c.lineTo(rMob.x + rMob.w * 0.8, rMob.y + rMob.h * 0.72);
          c.lineTo(rMob.x + rMob.w * 0.73, rMob.y + rMob.h * 0.77);
          c.stroke();
          c.restore();

          // Webbing strands around the trunk body
          c.strokeStyle = "rgba(255, 255, 255, 0.12)";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(rMob.x + rMob.w * 0.18, rMob.y + rMob.h * 0.45);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.3,
            rMob.y + rMob.h * 0.48,
            rMob.x + rMob.w * 0.24,
            rMob.y + rMob.h * 0.6,
          );
          c.moveTo(rMob.x + rMob.w * 0.82, rMob.y + rMob.h * 0.45);
          c.quadraticCurveTo(
            rMob.x + rMob.w * 0.7,
            rMob.y + rMob.h * 0.48,
            rMob.x + rMob.w * 0.76,
            rMob.y + rMob.h * 0.6,
          );
          c.stroke();
        }

        // ==========================================
        // 4. CLAW BRACKETS (ARMS)
        // ==========================================
        let armColor = rMob.flashTimer > 0 ? "#ffffff" : "#462810";

        c.fillStyle = armColor;
        c.beginPath();
        c.moveTo(rMob.x + rMob.w * 0.28, rMob.y + rMob.h * 0.32);
        c.quadraticCurveTo(
          rMob.x - 22,
          rMob.y + rMob.h * 0.28,
          rMob.x - 28,
          rMob.y + rMob.h * 0.5,
        ); // Elbow joint
        c.lineTo(rMob.x - 18, rMob.y + rMob.h * 0.52);
        c.quadraticCurveTo(
          rMob.x - 8,
          rMob.y + rMob.h * 0.34,
          rMob.x + rMob.w * 0.28,
          rMob.y + rMob.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(rMob.x - 28, rMob.y + rMob.h * 0.5);
        c.lineTo(m.x - 34, rMob.y + rMob.h * 0.64);
        c.lineTo(rMob.x - 24, rMob.y + rMob.h * 0.52);
        c.lineTo(rMob.x - 18, rMob.y + rMob.h * 0.67);
        c.lineTo(rMob.x - 15, rMob.y + rMob.h * 0.51);
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(rMob.x + rMob.w * 0.72, rMob.y + rMob.h * 0.32);
        c.quadraticCurveTo(
          rMob.x + rMob.w + 22,
          rMob.y + rMob.h * 0.24,
          rMob.x + rMob.w + 28,
          rMob.y + rMob.h * 0.15,
        ); // Elbow joint
        c.lineTo(rMob.x + rMob.w + 19, rMob.y + rMob.h * 0.12);
        c.quadraticCurveTo(
          rMob.x + rMob.w + 10,
          rMob.y + rMob.h * 0.28,
          rMob.x + rMob.w * 0.72,
          rMob.y + rMob.h * 0.38,
        );
        c.closePath();
        c.fill();
        c.stroke();

        c.beginPath();
        c.moveTo(rMob.x + rMob.w + 28, rMob.y + rMob.h * 0.15);
        c.lineTo(rMob.x + rMob.w + 36, rMob.y + rMob.h * 0.08);
        c.lineTo(rMob.x + rMob.w + 24, rMob.y + rMob.h * 0.12);
        c.lineTo(rMob.x + rMob.w + 30, rMob.y + rMob.h * 0.2);
        c.lineTo(rMob.x + rMob.w + 19, rMob.y + rMob.h * 0.14);
        c.closePath();
        c.fill();
        c.stroke();

        // ==========================================
        // 5. SPIDER-TREANT VISAGE (8 GLOWING Crimson EYES & DRIFTING VENOM)
        // ==========================================
        let drawVisage = () => {
          let eyeCenterY = rMob.y + rMob.h * 0.38;
          let mouthCenterY = rMob.y + rMob.h * 0.52;

          // 8 Glowing Crimson Spider Eyes in an arachnid cluster layout
          if (rMob.flashTimer === 0) {
            c.save();
            c.fillStyle = "#ff0055"; // Arachnid crimson glow
            c.shadowBlur = 10;
            c.shadowColor = "#ff0055";

            let eyeCluster = [
              { dx: -10, dy: -2, rx: 4, ry: 4, rot: 0 },
              { dx: 10, dy: -2, rx: 4, ry: 4, rot: 0 },
              { dx: -4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
              { dx: 4, dy: -6, rx: 2.2, ry: 2.2, rot: 0 },
              { dx: -15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
              { dx: 15, dy: 3, rx: 1.8, ry: 1.8, rot: 0 },
              { dx: -6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
              { dx: 6, dy: 1, rx: 1.5, ry: 1.5, rot: 0 },
            ];

            eyeCluster.forEach((eye) => {
              c.beginPath();
              c.ellipse(
                rMob.x + rMob.w * 0.5 + eye.dx,
                eyeCenterY + eye.dy,
                eye.rx,
                eye.ry,
                eye.rot,
                0,
                Math.PI * 2,
              );
              c.fill();
            });
            c.restore();

            c.strokeStyle = "#150802";
            c.lineWidth = 3.0;
            c.beginPath();
            c.moveTo(rMob.x + rMob.w * 0.32, eyeCenterY - 10);
            c.quadraticCurveTo(
              rMob.x + rMob.w * 0.5,
              eyeCenterY - 4,
              rMob.x + rMob.w * 0.68,
              eyeCenterY - 10,
            );
            c.stroke();
          }

          // Gaping Jagged Mouth Hollow (Glowing Green Rift Core)
          c.fillStyle = rMob.flashTimer > 0 ? "#ffffff" : "#1a0802"; // Void interior
          c.beginPath();
          c.ellipse(
            rMob.x + rMob.w * 0.5,
            mouthCenterY,
            rMob.w * 0.22,
            rMob.h * 0.09,
            0,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();

          if (rMob.flashTimer === 0) {
            c.save();
            let mouthPulse = 1.0 + Math.sin(Date.now() / 100) * 0.08;
            let mouthGrad = c.createRadialGradient(
              rMob.x + rMob.w * 0.5,
              mouthCenterY,
              2,
              rMob.x + rMob.w * 0.5,
              mouthCenterY,
              rMob.w * 0.22 * mouthPulse,
            );
            mouthGrad.addColorStop(0, "#ffffff");
            mouthGrad.addColorStop(0.4, "#00ff88");
            mouthGrad.addColorStop(0.8, "#2ecc71");
            mouthGrad.addColorStop(1, "rgba(46, 204, 113, 0)");
            c.fillStyle = mouthGrad;
            c.shadowBlur = 15;
            c.shadowColor = "#00ff88";

            c.beginPath();
            c.ellipse(
              rMob.x + rMob.w * 0.5,
              mouthCenterY,
              rMob.w * 0.22,
              rMob.h * 0.09,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
            c.restore();

            // Broken trunk teeth
            c.fillStyle = "#2d1607";
            c.strokeStyle = "#000000";
            c.lineWidth = 1.5;

            let tX = rMob.x + rMob.w * 0.5;
            let tY = mouthCenterY;
            let mW = rMob.w * 0.22;
            let mH = rMob.h * 0.09;

            let upperTeeth = [
              { ox: -mW * 0.7, oy: -mH * 0.3, len: 6 },
              { ox: -mW * 0.3, oy: -mH * 0.6, len: 10 },
              { ox: 0, oy: -mH * 0.8, len: 11 },
              { ox: mW * 0.3, oy: -mH * 0.6, len: 10 },
              { ox: mW * 0.7, oy: -mH * 0.3, len: 6 },
            ];
            upperTeeth.forEach((tooth) => {
              c.beginPath();
              c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
              c.lineTo(tX + tooth.ox, tY + tooth.oy + tooth.len);
              c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
              c.closePath();
              c.fill();
              c.stroke();
            });

            let lowerTeeth = [
              { ox: -mW * 0.5, oy: mH * 0.4, len: 8 },
              { ox: -mW * 0.15, oy: mH * 0.7, len: 10 },
              { ox: mW * 0.15, oy: mH * 0.7, len: 10 },
              { ox: mW * 0.5, oy: mH * 0.4, len: 8 },
            ];
            lowerTeeth.forEach((tooth) => {
              c.beginPath();
              c.moveTo(tX + tooth.ox - 3, tY + tooth.oy);
              c.lineTo(tX + tooth.ox, tY + tooth.oy - tooth.len);
              c.lineTo(tX + tooth.ox + 3, tY + tooth.oy);
              c.closePath();
              c.fill();
              c.stroke();
            });

            // Dripping Green Slime/Venom droplets
            let venomOffset = (Date.now() / 8) % 35;
            c.fillStyle = "#00ff88";
            c.beginPath();
            c.ellipse(tX - 8, tY + 4 + venomOffset, 1.2, 3, 0, 0, Math.PI * 2);
            c.ellipse(
              tX + 10,
              tY + 2 + venomOffset * 0.8,
              1.0,
              2.5,
              0,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        };

        // Draw Visage on bottom layer only if NOT a full Boss
        if (!drawVisageOnTop) {
          drawVisage();
        }

        // 6. Multi-Layer Foliage Canopy (Isolated sub-paths to prevent intersecting connecting lines)
        let cx = rMob.x + rMob.w / 2;
        let cy = rMob.y + rMob.h * 0.08;
        let r = rMob.w * 0.9;

        let drawCleanClump = (x, y, radius, color) => {
          c.fillStyle = rMob.flashTimer > 0 ? "#ffffff" : color;
          c.beginPath();
          c.arc(x, y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        };

        // Layer 1: Base Deep Forest Green
        let color1 = "#1a461e";
        drawCleanClump(cx, cy, r, color1);
        drawCleanClump(cx - r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx + r * 0.5, cy - r * 0.2, r * 0.75, color1);
        drawCleanClump(cx, cy - r * 0.5, r * 0.85, color1);

        // Layer 2: Vibrant Mid-Green
        let color2 = "#2ecc71";
        drawCleanClump(cx, cy, r * 0.8, color2);
        drawCleanClump(cx - r * 0.4, cy - r * 0.5, r * 0.6, color2);
        drawCleanClump(cx + r * 0.4, cy - r * 0.5, r * 0.6, color2);

        // Layer 3: Highlighted vibrant light-green (Adds foliage depth)
        let color3 = "#52be80";
        drawCleanClump(cx - r * 0.2, cy - r * 0.3, r * 0.4, color3);
        drawCleanClump(cx + r * 0.2, cy - r * 0.3, r * 0.4, color3);

        // 7. Hanging moss/ivy strands swaying dynamically
        if (rMob.flashTimer === 0) {
          c.fillStyle = "#164d1f";
          for (let i = 0; i < 5; i++) {
            let ivyOffset = -r * 0.6 + i * r * 0.3;
            let ivyX = cx + ivyOffset;
            let ivyY = cy + r * 0.3;
            let ivySway = Math.sin(Date.now() / 200 + i) * 4;
            c.beginPath();
            c.moveTo(ivyX - 3.5, ivyY);
            c.quadraticCurveTo(
              ivyX + ivySway,
              ivyY + 16,
              ivyX + ivySway + 1,
              ivyY + 24,
            );
            c.quadraticCurveTo(
              ivyX + 4.5 + ivySway,
              ivyY + 16,
              ivyX + 3.5,
              ivyY,
            );
            c.closePath();
            c.fill();
            c.stroke();
          }
        }

        // Draw Visage on top of Canopy only if it is a full Boss!
        if (drawVisageOnTop) {
          drawVisage();
        }

        // 8. Glowing Eldritch "Forest-Eye" Fruits (Pulsing glowing eyes peering from leaves)
        if (rMob.flashTimer === 0) {
          if (!m.appleOffsets) {
            m.appleOffsets = [];
            let count = renderRandInt(4, 7);
            for (let i = 0; i < count; i++) {
              let angle = renderRandFloat(0, Math.PI * 2);
              let dist = renderRandFloat(0, r * 0.8);
              m.appleOffsets.push({
                dx: Math.cos(angle) * dist,
                dy: Math.sin(angle) * dist - r * 0.1,
                sizeMod: renderRandFloat(0.9, 1.25),
                eyeRot: renderRandFloat(-Math.PI / 10, Math.PI / 10),
              });
            }
          }
          c.save();
          c.shadowBlur = 12;
          c.shadowColor = "#ff2200";

          let eyePulse = 1 + Math.sin(Date.now() / 150) * 0.08;

          m.appleOffsets.forEach((ap) => {
            let appleX = cx + ap.dx;
            let appleY = cy + ap.dy;
            let rRadius = rMob.w * 0.11 * ap.sizeMod * eyePulse;

            c.save();
            c.translate(appleX, appleY);
            c.rotate(ap.eyeRot);

            // Dual-color Eldritch Eye radial gradient (Glow center to crimson edge)
            let fruitGrad = c.createRadialGradient(0, 0, 1, 0, 0, rRadius);
            fruitGrad.addColorStop(0, "#ffffff");
            fruitGrad.addColorStop(0.3, "#f1c40f"); // Yellow iris ring
            fruitGrad.addColorStop(0.7, "#d35400"); // Rich orange boundary
            fruitGrad.addColorStop(1, "#c0392b"); // Crimson base
            c.fillStyle = fruitGrad;

            c.beginPath();
            c.arc(0, 0, rRadius, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            // Menacing black reptilian slit pupil right in the center!
            c.fillStyle = "#000000";
            c.beginPath();
            c.ellipse(0, 0, rRadius * 0.2, rRadius * 0.7, 0, 0, Math.PI * 2);
            c.fill();

            // Micro white specular highlight reflecting light
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.arc(
              -rRadius * 0.25,
              -rRadius * 0.25,
              rRadius * 0.15,
              0,
              Math.PI * 2,
            );
            c.fill();

            c.restore();
          });
          c.restore();
        }
        c.restore();
        c.restore(); // Close master transform
      } else if (currentTier === 1) {
        let bounceOffset = Math.sin(Date.now() / 200) * 3;
        let blockColor = m.flashTimer > 0 ? "#ffffff" : "#3b3f46";
        let shadowColor = m.flashTimer > 0 ? "#ffffff" : "#1f2126";
        let lavaColor = "#ff2200";

        c.fillStyle = shadowColor;
        c.beginPath();
        c.rect(m.x + 4, m.y + m.h - 16, m.w - 8, 16);
        c.fill();
        c.stroke();
        c.fillStyle = blockColor;
        c.beginPath();
        c.rect(m.x + 8, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();
        c.beginPath();
        c.rect(m.x + m.w - 20, m.y + m.h - 14, 12, 14);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x - 2, m.y + 24 + bounceOffset, m.w + 4, m.h - 40, [10]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x, m.y + 26 + bounceOffset, m.w, m.h - 44, [8]);
        c.fill();
        c.stroke();

        c.fillStyle = "#121316";
        c.beginPath();
        c.roundRect(m.x - 10, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.roundRect(m.x + m.w - 4, m.y + 20 + bounceOffset, 14, 16, [4]);
        c.fill();
        c.stroke();

        c.fillStyle = shadowColor;
        c.beginPath();
        c.roundRect(m.x + 8, m.y + 4 + bounceOffset, m.w - 16, 22, [6]);
        c.fill();
        c.stroke();

        c.fillStyle = blockColor;
        c.beginPath();
        c.roundRect(m.x + 10, m.y + 6 + bounceOffset, m.w - 20, 18, [4]);
        c.fill();
        c.stroke();

        if (m.flashTimer === 0) {
          c.fillStyle = lavaColor;
          c.shadowBlur = 15;
          c.shadowColor = lavaColor;

          c.beginPath();
          c.moveTo(m.x + 14, m.y + 11 + bounceOffset);
          c.lineTo(m.x + 22, m.y + 16 + bounceOffset);
          c.lineTo(m.x + 14, m.y + 18 + bounceOffset);
          c.closePath();

          c.moveTo(m.x + m.w - 14, m.y + m.h - 14 + bounceOffset);
          c.lineTo(m.x + m.w - 22, m.y + m.h - 16 + bounceOffset);
          c.lineTo(m.x + m.w - 14, m.y + m.h - 18 + bounceOffset);
          c.closePath();
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }

        if (m.flashTimer === 0) {
          c.strokeStyle = lavaColor;
          c.shadowBlur = 10;
          c.shadowColor = lavaColor;
          c.lineWidth = 2.5;

          c.beginPath();
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w - 10, m.y + 35 + bounceOffset);
          c.moveTo(m.x + m.w / 2, m.y + m.h / 2 + 5 + bounceOffset);
          c.lineTo(m.x + m.w / 2, m.y + m.h - 22 + bounceOffset);
          c.stroke();

          let coreGrad = c.createRadialGradient(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            1,
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
          );
          coreGrad.addColorStop(0, "#ffffff");
          coreGrad.addColorStop(0.3, "#ff3b30");
          coreGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
          c.fillStyle = coreGrad;
          c.beginPath();
          c.arc(
            m.x + m.w / 2,
            m.y + m.h / 2 + 5 + bounceOffset,
            8,
            0,
            Math.PI * 2,
          );
          c.fill();
          c.stroke();

          c.shadowBlur = 0;
        }
      } else {
        if (currentTier === 2) {
          // TIER 2: Revamped Inferno Boss (Brimstone Colossus - Ignis)
          let bounce = Math.sin(Date.now() / 150) * 3.5;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Heavy Jagged Charcoal Obsidian shoulders (curved pauldrons)
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1c1c1f"; // deep charcoal
          c.beginPath();
          c.moveTo(cx - 28, cy + 30);
          c.lineTo(cx - 22, cy - 5);
          c.lineTo(cx - 32, cy - 14); // shoulder point
          c.lineTo(cx - 10, cy - 10);
          c.lineTo(cx, cy); // neck joint
          c.lineTo(cx + 10, cy - 10);
          c.lineTo(cx + 32, cy - 14); // shoulder point
          c.lineTo(cx + 22, cy - 5);
          c.lineTo(cx + 28, cy + 30);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing magma fissures running down the armor plates
          if (m.flashTimer === 0) {
            c.strokeStyle = "#d35400";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(cx - 20, cy + 10);
            c.lineTo(cx - 8, cy + 22);
            c.lineTo(cx - 14, cy + 26);
            c.moveTo(cx + 20, cy + 10);
            c.lineTo(cx + 8, cy + 22);
            c.lineTo(cx + 14, cy + 26);
            c.stroke();
          }

          // Molten core in the center flaring
          if (m.flashTimer === 0) {
            let corePulse = 10 + Math.sin(Date.now() / 80) * 3;
            let coreGrad = c.createRadialGradient(
              cx,
              cy + 16,
              2,
              cx,
              cy + 16,
              corePulse,
            );
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#f39c12");
            coreGrad.addColorStop(1, "rgba(231, 76, 60, 0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy + 16, corePulse, 0, Math.PI * 2);
            c.fill();
          }

          // Giant sulfur-horned helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2f3238";
          c.beginPath();
          c.roundRect(cx - 12, cy - 26, 24, 20, [3]);
          c.fill();
          c.stroke();

          // Massive curved horns curling up from helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e67e22";
          c.beginPath();
          // Left
          c.moveTo(cx - 11, cy - 20);
          c.quadraticCurveTo(cx - 25, cy - 40, cx - 28, cy - 35);
          c.lineTo(cx - 8, cy - 14);
          c.closePath();
          // Right
          c.moveTo(cx + 11, cy - 20);
          c.quadraticCurveTo(cx + 25, cy - 40, cx + 28, cy - 35);
          c.lineTo(cx + 8, cy - 14);
          c.closePath();
          c.fill();
          c.stroke();

          // Molten iron visor slit
          if (m.flashTimer === 0) {
            c.fillStyle = "#ff3b30";
            c.beginPath();
            c.rect(cx - 8, cy - 18, 16, 3);
            c.fill();
          }
        } else if (currentTier === 3) {
          // TIER 3: Swamp Bog-Colossus Boss (Root-entangled swamp elemental)
          let bounce = Math.sin(Date.now() / 170) * 3;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Tangled wooden root body
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#2d1e12";
          c.beginPath();
          c.roundRect(cx - 22, cy - 10, 44, 50, [10]);
          c.fill();
          c.stroke();

          // Mossy/Leafy swamp shoulders
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#143d1f";
          c.beginPath();
          c.ellipse(cx - 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.ellipse(cx + 20, cy - 10, 12, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Bog face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a120a";
          c.beginPath();
          c.arc(cx, cy - 22, 12, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Glowing toxic green swamp eyes
            c.fillStyle = "#2ecc71";
            c.beginPath();
            c.arc(cx - 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.arc(cx + 4, cy - 22, 2.2, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 4) {
          // TIER 4: Void Overseer Boss (Levitating levitational multi-eyed space singularity)
          let hover = Math.sin(Date.now() / 140) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 - 10 + hover;

          // Swirling cosmic aura backplate
          if (m.flashTimer === 0) {
            let coreGrad = c.createRadialGradient(cx, cy, 2, cx, cy, 28);
            coreGrad.addColorStop(0, "#ffffff");
            coreGrad.addColorStop(0.4, "#9b59b6");
            coreGrad.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = coreGrad;
            c.beginPath();
            c.arc(cx, cy, 28, 0, Math.PI * 2);
            c.fill();
          }

          // Central obsidian core plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#0d011a";
          c.beginPath();
          c.moveTo(cx, cy - 20);
          c.lineTo(cx + 18, cy);
          c.lineTo(cx, cy + 20);
          c.lineTo(cx - 18, cy);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blinking pink void watch eyes
            c.fillStyle = "#ff007f";
            c.beginPath();
            c.arc(cx, cy, 3.5, 0, Math.PI * 2);
            c.arc(cx - 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy - 8, 1.8, 0, Math.PI * 2);
            c.arc(cx - 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.arc(cx + 8, cy + 8, 1.8, 0, Math.PI * 2);
            c.fill();
          }
        } else if (currentTier === 5) {
          // TIER 5: Gilded Clockwork Sphinx (Temporal Sanctorum Campaign Warden)
          let bounce = Math.sin(Date.now() / 150) * 4;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + bounce;

          // Sphinx lion torso & sand wings
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
          c.beginPath();
          c.ellipse(cx, cy + 15, 18, 22, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Golden Pharaoh Headdress
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#f1c40f";
          c.beginPath();
          c.moveTo(cx, cy - 28);
          c.lineTo(cx - 18, cy - 10);
          c.lineTo(cx - 12, cy + 6);
          c.lineTo(cx, cy - 2);
          c.lineTo(cx + 12, cy + 6);
          c.lineTo(cx + 18, cy - 10);
          c.closePath();
          c.fill();
          c.stroke();

          // Sphinx Face
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#e5c185";
          c.beginPath();
          c.roundRect(cx - 8, cy - 18, 16, 18, [3]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Blank white glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 6;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.arc(cx + 3.5, cy - 10, 1.8, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }
        } else if (currentTier === 6) {
          // TIER 6: Grid Centurion (Cyberspace Nexus Campaign Warden)
          let hover = Math.sin(Date.now() / 120) * 6;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Floating neon vector shield
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#3498db";
          c.lineWidth = 1.5;
          c.save();
          c.translate(cx - 24, cy + 4);
          c.rotate(Date.now() / 500);
          c.strokeRect(-8, -8, 16, 16);
          c.restore();

          // Visor helmet
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#1a1c23";
          c.beginPath();
          c.roundRect(cx - 12, cy - 18, 24, 22, [4]);
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Visor
            c.fillStyle = "#00d2ff";
            c.beginPath();
            c.rect(cx - 8, cy - 11, 16, 4);
            c.fill();

            // Falling green matrix cape code blocks
            c.fillStyle = "rgba(46, 204, 113, 0.65)";
            for (let i = 0; i < 3; i++) {
              let offset = (i - 1) * 8;
              let yProgress = (Date.now() / 6 + i * 20) % 20;
              c.fillRect(cx + offset - 1, cy + 4 + yProgress, 2, 8);
            }
          }
        } else if (currentTier === 7) {
          // TIER 7: Chronos Arbitrator (The Clockwork God - exclusive T2 Altar Summon)
          let hover = Math.sin(Date.now() / 200) * 8;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2 + hover;

          // Glowing brass gear halo
          let gearAngle = (Date.now() / 4000) % (Math.PI * 2);
          c.save();
          c.translate(cx, cy);
          c.rotate(gearAngle);
          c.strokeStyle = "#f1c40f";
          c.lineWidth = 2.0;
          c.fillStyle =
            m.flashTimer > 0 ? "#ffffff" : "rgba(241, 196, 15, 0.08)";
          c.beginPath();
          c.arc(0, 0, 42, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          for (let i = 0; i < 8; i++) {
            c.rotate(Math.PI / 4);
            c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#dca04c";
            c.beginPath();
            c.rect(-5, -50, 10, 10);
            c.fill();
            c.stroke();
          }
          c.restore();

          // Cracked Ivory Mask Plate
          c.fillStyle = m.flashTimer > 0 ? "#ffffff" : "#fdf6e2";
          c.strokeStyle = "#000000";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(cx, cy - 25);
          c.quadraticCurveTo(cx - 20, cy - 20, cx - 20, cy);
          c.lineTo(cx - 12, cy + 28);
          c.lineTo(cx + 12, cy + 28);
          c.lineTo(cx + 20, cy);
          c.quadraticCurveTo(cx + 20, cy - 20, cx, cy - 25);
          c.closePath();
          c.fill();
          c.stroke();

          if (m.flashTimer === 0) {
            // Shimmering cracks
            c.strokeStyle = "#1a0f02";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(cx - 10, cy - 10);
            c.lineTo(cx - 4, cy - 4);
            c.lineTo(cx - 8, cy + 2);
            c.moveTo(cx + 10, cy - 8);
            c.lineTo(cx + 6, cy - 2);
            c.stroke();

            // White glowing eyes
            c.fillStyle = "#ffffff";
            c.shadowBlur = 8;
            c.shadowColor = "#ffffff";
            c.beginPath();
            c.arc(cx - 6, cy - 5, 3, 0, Math.PI * 2);
            c.arc(cx + 6, cy - 5, 3, 0, Math.PI * 2);
            c.fill();
            c.shadowBlur = 0;
          }

          c.strokeStyle = "#111116";
          c.lineWidth = 2.5;
          c.lineCap = "round";
          let hrAngle = Date.now() / 10000;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(hrAngle) * 15, Math.sin(hrAngle) * 15);
          c.stroke();
          let minAngle = Date.now() / 1800;
          c.strokeStyle = "#d35400";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(minAngle) * 22, Math.sin(minAngle) * 22);
          c.stroke();
          c.restore();
        } else {
          // TIER 8+: Nexus Overseer (The Glitch Singularity - exclusive T3 Altar Summon)
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2;
          let isGlitchedFrame = Math.sin(Date.now() / 10) > 0.85;
          let px = cx + (isGlitchedFrame ? renderRandFloat(-4, 4) : 0);
          let py = cy + (isGlitchedFrame ? renderRandFloat(-3, 3) : 0);
          c.save();
          c.translate(px, py);
          c.rotate(Date.now() / 800);
          c.strokeStyle = m.flashTimer > 0 ? "#ffffff" : "#ff007f";
          c.lineWidth = 2.0;
          let cycle = Math.floor(Date.now() / 5000) % 3;
          if (cycle === 0) {
            c.strokeRect(-18, -18, 36, 36);
            c.strokeRect(-12, -12, 24, 24);
            c.beginPath();
            c.moveTo(-18, -18);
            c.lineTo(-12, -12);
            c.moveTo(18, -18);
            c.lineTo(12, -12);
            c.moveTo(-18, 18);
            c.lineTo(-12, 12);
            c.moveTo(18, 18);
            c.lineTo(12, 12);
            c.stroke();
          } else if (cycle === 1) {
            c.beginPath();
            c.moveTo(0, -22);
            c.lineTo(-18, 14);
            c.lineTo(18, 14);
            c.closePath();
            c.moveTo(0, -22);
            c.lineTo(0, 18);
            c.lineTo(-18, 14);
            c.moveTo(0, 18);
            c.lineTo(18, 14);
            c.stroke();
          } else {
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.closePath();
            c.stroke();
            c.beginPath();
            for (let i = 0; i < 5; i++) {
              let angle = (i * Math.PI * 2) / 5;
              c.moveTo(0, 0);
              c.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
            }
            c.stroke();
          }
          c.restore();
          if (m.flashTimer === 0) {
            let eyePulse = 6 + Math.sin(Date.now() / 150) * 1.5;
            c.fillStyle = "#ff007f";
            c.beginPath();
            c.arc(px, py, eyePulse, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = "#000000";
            c.lineWidth = 1.5;
            c.stroke();
            c.fillStyle = "#ff007f";
            c.fillRect(px - 1.2, -4, 2.4, 8);
          }
        }
      }
    }

    // --- Reset Hardware-Accelerated Rendering Filters (Phase 2) ---
    if (shouldTint) {
      // Apply the tint only on the drawn mob pixels on the offscreen canvas
      offscreenCtx.save();
      offscreenCtx.globalCompositeOperation = "source-atop";
      offscreenCtx.fillStyle = activeTint;
      offscreenCtx.fillRect(m.x - 50, m.y - 100, m.w + 100, m.h + 150);
      offscreenCtx.restore();

      // Restore the original main canvas context
      c = originalCtx;

      // Draw the tinted mob from the offscreen canvas onto the main canvas
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to screen space
      c.drawImage(offscreenCanvas, tintBufferBounds.x, tintBufferBounds.y);
      c.restore();
    } else {
      if (isFilterSupported) {
        c.filter = "none";
      }
    }

    // --- Tiered Overhead Overlays (Phase 3) ---
    c.save();
    let mCxOverlay = m.x + m.w / 2;
    let headY = m.y - (mobIsElite ? 2 : 12);
    let timeOverlay = Date.now();

    if (mobIsElite && mobIsRare) {
      // --- RARE ELITE: Cosmic Crown (Ring of 4 rotating void spikes) ---
      let rot = timeOverlay / 600;
      let radiusX = 14;
      let radiusY = 4.5;
      let spikeCount = 4;

      for (let i = 0; i < spikeCount; i++) {
        let angle = rot + (i * Math.PI * 2) / spikeCount;
        let sx = mCxOverlay + Math.cos(angle) * radiusX;
        let sy = headY - 4 + Math.sin(angle) * radiusY;
        let scale = 1.0 + Math.sin(angle) * 0.22; // Simulates 3D depth scaling

        c.save();
        c.translate(sx, sy);
        c.rotate(angle + Math.PI / 2); // Orient outward
        c.fillStyle = "#110221"; // Dark cosmic base
        c.strokeStyle = "#ff007f"; // Hot pink glow edge
        c.lineWidth = 1.0;

        c.beginPath();
        c.moveTo(-2 * scale, 0);
        c.lineTo(0, -7 * scale);
        c.lineTo(2 * scale, 0);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    } else if (mobIsElite) {
      // --- ELITE: Void Pillars (2 floating basalt shards rotating slowly) ---
      let rot = timeOverlay / 1100;
      let radiusX = 16;
      let radiusY = 5.0;
      let pillarCount = 2;

      for (let i = 0; i < pillarCount; i++) {
        let angle = rot + (i * Math.PI * 2) / pillarCount;
        let px = mCxOverlay + Math.cos(angle) * radiusX;
        let py = headY - 2 + Math.sin(angle) * radiusY;
        let bob = Math.sin(timeOverlay / 140 + i) * 1.5;
        let scale = 1.0 + Math.sin(angle) * 0.15;

        c.save();
        c.translate(px, py + bob);
        c.fillStyle = "#2c3e50"; // Basalt dark grey
        c.strokeStyle = "#a855f7"; // Glowing purple cracks
        c.lineWidth = 1.0;

        c.beginPath();
        c.moveTo(-1.8 * scale, -5 * scale);
        c.lineTo(1.8 * scale, -5 * scale);
        c.lineTo(2.2 * scale, 5 * scale);
        c.lineTo(-2.2 * scale, 5 * scale);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    } else if (mobIsRare) {
      // --- RARE: Crown of Embers (3 sulfur-yellow diamonds hovering and bobbing) ---
      let rot = timeOverlay / 700;
      let radiusX = 11;
      let radiusY = 3.5;
      let emberCount = 3;

      for (let i = 0; i < emberCount; i++) {
        let angle = rot + (i * Math.PI * 2) / emberCount;
        let ex = mCxOverlay + Math.cos(angle) * radiusX;
        let ey = headY - 12 + Math.sin(angle) * radiusY;
        let bob = Math.sin(timeOverlay / 120 + i) * 1.2;
        let scale = 1.0 + Math.sin(angle) * 0.15;

        c.save();
        c.translate(ex, ey + bob);
        c.fillStyle = "#f1c40f"; // Sulfur yellow
        c.strokeStyle = "#ffd700"; // Gold highlights
        c.lineWidth = 0.8;

        c.beginPath();
        c.moveTo(0, -4 * scale);
        c.lineTo(2.2 * scale, 0);
        c.lineTo(0, 4 * scale);
        c.lineTo(-2.2 * scale, 0);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }

      // --- RARE: Base Ripple (Diagonal gold light sheen sweep across mob body) ---
      let rippleProgress = (timeOverlay / 1500) % 1.2; // sweeps across bounds
      let diagonalX = m.x - m.w * 0.2 + rippleProgress * (m.w * 1.4);

      c.save();
      // Clip to mob rectangle to prevent overflow bounds pollution
      c.beginPath();
      c.rect(m.x, m.y, m.w, m.h);
      c.clip();

      c.strokeStyle = "rgba(255, 215, 0, 0.35)";
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(diagonalX - m.h * 0.5, m.y);
      c.lineTo(diagonalX + m.h * 0.5, m.y + m.h);
      c.stroke();
      c.restore();
    }
    c.restore();

    // Kinetic Reflectors Energy Shield Arc Rendering
    if (
      window.isCavernEffectActive &&
      window.isCavernEffectActive("kinetic_reflectors") &&
      m.type === "mob" &&
      !m.isFriendlyWisp
    ) {
      c.save();
      let cx = m.x + m.w / 2;
      let cy = m.y + m.h / 2;
      let radius = m.w * 0.8;
      let time = Date.now();
      let pulse = Math.sin(time / 100) * 1.5;

      c.strokeStyle = "#00d2ff";
      c.lineWidth = 2.0;
      c.shadowBlur = 8;
      c.shadowColor = "#00d2ff";

      let rot = (time / 800) % (Math.PI * 2);
      for (let i = 0; i < 3; i++) {
        let segmentStart = Math.PI * 0.7 + rot + (i * Math.PI * 2) / 3;
        let segmentEnd = segmentStart + 0.35;
        c.beginPath();
        c.arc(cx, cy, radius + pulse, segmentStart, segmentEnd);
        c.stroke();
      }

      c.strokeStyle = "rgba(0, 210, 255, 0.75)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(cx, cy, radius + 2, Math.PI * 0.75, Math.PI * 1.25);
      c.stroke();
      c.restore();
    }

    // Expose Weakness Floating Indicator
    if (m.exposeWeaknessTimer > 0) {
      let exX = m.x + m.w / 2;
      let exY = m.y - 12;
      let bob = Math.sin(Date.now() / 150) * 2;

      c.save();
      c.translate(exX, exY - 8 + bob);

      c.strokeStyle = "#e74c3c";
      c.fillStyle = "rgba(231, 76, 60, 0.22)";
      c.lineWidth = 1.2;
      c.shadowBlur = 6;
      c.shadowColor = "#e74c3c";

      c.beginPath();
      c.moveTo(-4, -5);
      c.lineTo(4, -5);
      c.lineTo(5, 0);
      c.lineTo(0, 6);
      c.lineTo(-5, 0);
      c.closePath();
      c.fill();
      c.stroke();
      c.shadowBlur = 0;

      // Jagged fracture seam down the middle
      c.strokeStyle = "#111116";
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(0, -5);
      c.lineTo(-1.5, -2);
      c.lineTo(1.5, 1);
      c.lineTo(-0.5, 3);
      c.lineTo(0, 6);
      c.stroke();

      c.restore();
    }

    c.restore();
  };

export { drawSingleMob };
