import { getActiveDungeonMap } from "./dungeon_map.js";
import { hasRecoveryAssets } from "./recovery_contract.js";
import { prepareMobTetherRecipients } from "./mob_renderer.js";
import { renderTomeDeliveryProjectile } from "./tome_projectile.js";
import {
  getPlayerTargetCommunicationSnapshot,
  renderCombatReachCommunication,
} from "./combat_communication_authority.js";

export const ACTIVE_MOB_RENDER_PADDING = 64;

export function isActiveMobInRenderViewport(
  mob,
  camera,
  padding = ACTIVE_MOB_RENDER_PADDING,
) {
  if (!mob || !camera) return false;

  let zoom = camera.zoom || 1;
  let width = mob.w || 24;
  let height = mob.h || 24;
  let minX = camera.x - padding;
  let minY = camera.y - padding;
  let maxX = camera.x + camera.viewportW / zoom + padding;
  let maxY = camera.y + camera.viewportH / zoom + padding;

  return (
    mob.x + width >= minX &&
    mob.x <= maxX &&
    mob.y + height >= minY &&
    mob.y <= maxY
  );
}

  export const renderGame = function (ctx, canvas) {
    // Fill entire canvas with dark abyssal void background to eliminate white border bleed
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let map = getActiveDungeonMap();
    if (!map || !map.grid || map.grid.length === 0) return;

    let tileSize = map.tileSize;
    let p = window.player;
    let camera = window.DungeonCamera;
    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let mobTetherRecipients = prepareMobTetherRecipients(
      window.activeDungeonMobs || [],
    );

    camera.viewportW = canvas.width;
    camera.viewportH = canvas.height;
    camera.update(p.x, p.y, map.width * tileSize, map.height * tileSize);

    // 1. Render Map Base & Ground Portals
    window.renderTopDownMap(ctx, canvas);

    // Render Active Room Mobs & Boss in Top-Down Space
    ctx.save();
    ctx.scale(window.DungeonCamera.zoom, window.DungeonCamera.zoom);
    ctx.translate(
      -Math.floor(window.DungeonCamera.x),
      -Math.floor(window.DungeonCamera.y),
    );

    // --- SUBPHASE 8: RENDER SPECIAL CHALLENGES & CAVERN MUTATORS RENDER PASS ---
    if (
      window.ChallengeEngine &&
      typeof window.ChallengeEngine.render === "function"
    ) {
      window.ChallengeEngine.render(ctx, map);
    }
    // ---------------------------------------------------------------------------

    // 2. Y-Sorted Depth Queue (Zero-Allocation Array Reuse)
        if (!window._sharedDepthQueue) window._sharedDepthQueue = [];
        let depthQueue = window._sharedDepthQueue;
        depthQueue.length = 0;
        let mapInst = map;
        let tSize = mapInst ? mapInst.tileSize : 32;

    // A. Hub Stations (Hub State)
    if (
      window.currentGameState === window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.stations
    ) {
      mapInst.stations.forEach((st) => {
        depthQueue.push({
          yBase: st.y * tSize + 24,
          draw: () => {
            if (window.drawDungeonStructureTile) {
              window.drawDungeonStructureTile(
                ctx,
                st.type,
                st.x * tSize,
                st.y * tSize,
                tSize,
              );
            }
          },
        });
      });
    }

    // B. Chest Spawns (Dungeon State - Culled by Viewport)
    if (
      window.currentGameState !== window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.grid
    ) {
      let camera = window.DungeonCamera;
      let startCol = Math.max(0, Math.floor(camera.x / tSize));
      let endCol = Math.min(
        mapInst.width - 1,
        Math.ceil((camera.x + camera.viewportW / camera.zoom) / tSize),
      );
      let startRow = Math.max(0, Math.floor(camera.y / tSize));
      let endRow = Math.min(
        mapInst.height - 1,
        Math.ceil((camera.y + camera.viewportH / camera.zoom) / tSize),
      );

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let tType = mapInst.grid[r][c];
          if (
            tType === window.TILE_TYPES.CHEST_SPAWN ||
            tType === window.TILE_TYPES.RECOVERY_CHEST ||
            tType === window.TILE_TYPES.DUNGEON_MERCHANT ||
            tType === window.TILE_TYPES.DUNGEON_MERCHANT_PEDESTAL
          ) {
            let px = c * tSize;
            let py = r * tSize;
            depthQueue.push({
              yBase: py + 20,
              draw: () => {
                if (window.drawDungeonStructureTile) {
                  window.drawDungeonStructureTile(ctx, tType, px, py, tSize);
                }
              },
            });
          }
        }
      }
    }

    // B2. Breakable Pottery & Props (Culled by Viewport)
    if (
      window.currentGameState !== window.GAME_STATES.HUB &&
      mapInst &&
      mapInst.breakables
    ) {
      mapInst.breakables.forEach((b) => {
        let px = b.x * tSize;
        let py = b.y * tSize;
        depthQueue.push({
          yBase: py + 22,
          draw: () => {
            if (window.drawBreakableProp) {
              window.drawBreakableProp(ctx, b, px, py, tSize);
            }
          },
        });
      });
    }

    // B3. Ground Material Pickups (Culled by Viewport)
    if (window.groundMaterials && window.groundMaterials.length > 0) {
      let time = Date.now();
      window.groundMaterials.forEach((gm) => {
        depthQueue.push({
          yBase: gm.y,
          draw: () => {
            let drawX = gm.x;
            let drawY = gm.y + gm.z;
            let color = gm.color || "#00d2ff";
            let isEco = window.playerStats && window.playerStats.ecoMode;

            ctx.save();

            // 1. Ground Drop Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(gm.x, gm.y + 2, 7, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Radial Floor Glow Aura
            if (!isEco) {
              let auraPulse = Math.sin(time / 120) * 1.2;
              let floorGrad = ctx.createRadialGradient(
                gm.x,
                gm.y + 2,
                1,
                gm.x,
                gm.y + 2,
                12 + auraPulse,
              );
              floorGrad.addColorStop(0, color);
              floorGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
              ctx.fillStyle = floorGrad;
              ctx.beginPath();
              ctx.arc(gm.x, gm.y + 2, 12 + auraPulse, 0, Math.PI * 2);
              ctx.fill();
            }

            // 3. Floating Material Gem / Soul Orb
            let bob = Math.sin(time / 140) * 2.0;
            let matY = drawY - 8 + bob;

            let img = window.getCanvasIconImage
              ? window.getCanvasIconImage(gm.name)
              : null;
            if (img && img.complete) {
              ctx.drawImage(img, drawX - 8, matY - 8, 16, 16);
            } else {
              ctx.fillStyle = color;
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(drawX, matY + 4, 4.0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(drawX - 1, matY + 3, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          },
        });
      });
    }

    // B4. Ground Equipment Loot Pickups (Culled by Viewport)
    if (window.groundLoot && window.groundLoot.length > 0) {
      let time = Date.now();
      window.groundLoot.forEach((gl) => {
        depthQueue.push({
          yBase: gl.y,
          draw: () => {
            let drawX = gl.x;
            let drawY = gl.y + gl.z;
            let color = gl.color || "#00d2ff";
            let isEco = window.playerStats && window.playerStats.ecoMode;

            ctx.save();

            // 1. Ground Drop Shadow
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.beginPath();
            ctx.ellipse(gl.x, gl.y + 2, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rarity Parsing Setup
            let isUnique =
              gl.item &&
              ((window.isItemUnique && window.isItemUnique(gl.item)) ||
                gl.item.statsRolled === "UNIQUE" ||
                gl.item.type === "card");
            let isCard = gl.item && gl.item.type === "card";
            let stars = gl.item
              ? gl.item.statsRolled === "UNIQUE" || gl.item.type === "card"
                ? 5
                : (gl.item.statsRolled ?? 0)
              : 0;
            let dRgb = window.hexToRgbValues
              ? window.hexToRgbValues(color)
              : "255, 255, 255";

            let beamH = 110 + stars * 22;
            let beamW = 4 + stars * 2.2;
            if (isUnique) {
              beamH = 210;
              beamW = 14;
            }

            let pulseSpeed = 160 - stars * 18;
            let beamPulse = Math.sin(time / pulseSpeed) * (1.0 + stars * 0.35);
            let currentWidth = Math.max(2, beamW + beamPulse);
            let alpha = 0.25 + stars * 0.08 + (isUnique ? 0.2 : 0);
            let topY = gl.y + 2 - beamH;
            let groundY = gl.y + 2;

            let pulseAlpha = 0.5 + Math.sin(time / 150) * 0.25;

            // ==========================================
            // SUB-PASS A: Rarity-Themed Ground Seals (0 - 5 & UNIQUE)
            // ==========================================
            if (isUnique) {
              // UNIQUE: Cosmic Accretion Wormhole Vortex
              ctx.save();
              ctx.strokeStyle = "rgba(0, 210, 255, 0.45)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              let spiralPoints = isEco ? 20 : 45;
              for (let i = 0; i < spiralPoints; i++) {
                let angle = i * 0.35 + time / 160;
                let r = 2.0 * Math.pow(1.075, i);
                if (r > 28) break;
                ctx.lineTo(
                  drawX + Math.cos(angle) * r,
                  groundY + Math.sin(angle) * r * 0.35,
                );
              }
              ctx.stroke();
              ctx.restore();
            } else if (stars === 5) {
              // 5-Star: Unstable Plasma Disc
              ctx.save();
              ctx.strokeStyle = `rgba(${dRgb}, ${0.5 + pulseAlpha * 0.3})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              let plasmaPoints = isEco ? 8 : 16;
              for (let i = 0; i <= plasmaPoints; i++) {
                let ang = (i * Math.PI * 2) / plasmaPoints;
                let crackle =
                  18 +
                  Math.sin(time / 50 + i) * 3 +
                  (Math.random() - 0.5) * 1.5;
                ctx.lineTo(
                  drawX + Math.cos(ang) * crackle,
                  groundY + Math.sin(ang) * crackle * 0.35,
                );
              }
              ctx.closePath();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 4) {
              // 4-Star: Rotating Golden Sun Emblem
              ctx.save();
              ctx.translate(drawX, groundY);
              ctx.rotate(time / 1400);
              ctx.strokeStyle = `rgba(${dRgb}, 0.75)`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(0, 0, 16, 5.6, 0, 0, Math.PI * 2);
              ctx.stroke();

              let spikes = isEco ? 6 : 12;
              ctx.fillStyle = `rgba(${dRgb}, 0.16)`;
              ctx.beginPath();
              for (let i = 0; i < spikes; i++) {
                let a = (i * Math.PI * 2) / spikes;
                ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14 * 0.35);
                ctx.lineTo(
                  Math.cos(a + 0.1) * 23,
                  Math.sin(a + 0.1) * 23 * 0.35,
                );
                ctx.lineTo(
                  Math.cos(a + 0.2) * 14,
                  Math.sin(a + 0.2) * 14 * 0.35,
                );
              }
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 3) {
              // 3-Star: Boiling Magma Base Ring
              ctx.save();
              ctx.fillStyle = "rgba(230, 126, 34, 0.08)";
              ctx.beginPath();
              ctx.ellipse(drawX, groundY, 20, 7, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = `rgba(${dRgb}, ${0.5 + Math.sin(time / 80) * 0.15})`;
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              let magmaPoints = isEco ? 10 : 20;
              for (let i = 0; i <= magmaPoints; i++) {
                let ang = (i * Math.PI * 2) / magmaPoints;
                let pulse = 20 + Math.sin(time / 60 + i * 3) * 1.5;
                ctx.lineTo(
                  drawX + Math.cos(ang) * pulse,
                  groundY + Math.sin(ang) * pulse * 0.35,
                );
              }
              ctx.stroke();
              ctx.restore();
            } else if (stars === 2) {
              // 2-Star: Rotating Runic Magic Seal
              ctx.save();
              ctx.translate(drawX, groundY);
              ctx.rotate(time / 1100);
              ctx.strokeStyle = `rgba(${dRgb}, 0.55)`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 18, 6.3, 0, 0, Math.PI * 2);
              ctx.stroke();

              ctx.beginPath();
              let pts = 6;
              for (let i = 0; i < pts * 2; i++) {
                let a = (i * Math.PI) / pts;
                let rad = i % 2 === 0 ? 18 : 8;
                ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad * 0.35);
              }
              ctx.closePath();
              ctx.stroke();
              ctx.restore();
            } else if (stars === 1) {
              // 1-Star: Concentric Frost Ripples
              let rippleCount = isEco ? 1 : 2;
              for (let rIdx = 0; rIdx < rippleCount; rIdx++) {
                let rippleProgress = (time / 1200 + rIdx * 0.5) % 1.0;
                let maxR = 22;
                let curR = maxR * rippleProgress;
                let rAlpha = (1.0 - rippleProgress) * 0.5;
                ctx.strokeStyle = `rgba(${dRgb}, ${rAlpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(
                  drawX,
                  groundY,
                  curR,
                  curR * 0.35,
                  0,
                  0,
                  Math.PI * 2,
                );
                ctx.stroke();
              }
            } else {
              // 0-Star: Simple Dust Ring
              ctx.strokeStyle = "rgba(120, 120, 120, 0.15)";
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.ellipse(drawX, groundY, 14, 5, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // ==========================================
            // SUB-PASS B: BACK-Plane Depth-Sorted Orbiting Sparks (z < 0)
            // ==========================================
            if (stars === 4 && !isEco) {
              let legendarySparks = 4;
              for (let i = 0; i < legendarySparks; i++) {
                let theta = time / 350 + i * ((Math.PI * 2) / legendarySparks);
                let z = Math.sin(theta);
                if (z < 0) {
                  let ox = drawX + Math.cos(theta) * 16;
                  let hProgress =
                    (time / 10 + i * (beamH / legendarySparks)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = `rgba(${dRgb}, ${0.4 + Math.abs(z) * 0.6})`;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (isUnique && !isEco) {
              let uniqueOrbs = 3;
              for (let uIdx = 0; uIdx < uniqueOrbs; uIdx++) {
                let theta = time / 280 + uIdx * ((Math.PI * 2) / uniqueOrbs);
                let z = Math.sin(theta);
                if (z < 0) {
                  let rSize = 14 + Math.sin(time / 120 + uIdx) * 3;
                  let ox = drawX + Math.cos(theta) * rSize;
                  let hProgress =
                    (time / 8 + uIdx * (beamH / uniqueOrbs)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = "rgba(142, 68, 173, 0.4)";
                  ctx.beginPath();
                  ctx.arc(ox, oy, 2.0, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            // ==========================================
            // SUB-PASS C: Primary Shaft & Atmosphere Glow
            // ==========================================
            // A. Outer Atmospheric Glow (2★+)
            if (stars >= 2 || isUnique) {
              let outerW = currentWidth * (isUnique ? 2.8 : 2.0);
              let outerGrad = ctx.createLinearGradient(
                drawX,
                groundY,
                drawX,
                topY,
              );
              outerGrad.addColorStop(0, `rgba(${dRgb}, ${alpha * 0.35})`);
              outerGrad.addColorStop(0.6, `rgba(${dRgb}, ${alpha * 0.12})`);
              outerGrad.addColorStop(1, `rgba(${dRgb}, 0)`);
              ctx.fillStyle = outerGrad;
              ctx.fillRect(drawX - outerW / 2, topY, outerW, beamH);
            }

            // B. Primary Shaft Gradient Beam
            let shaftGrad = ctx.createLinearGradient(
              drawX,
              groundY,
              drawX,
              topY,
            );
            if (isUnique) {
              shaftGrad.addColorStop(0, `rgba(232, 67, 147, ${alpha})`);
              shaftGrad.addColorStop(
                0.4,
                `rgba(142, 68, 173, ${alpha * 0.85})`,
              );
              shaftGrad.addColorStop(0.8, `rgba(0, 210, 255, ${alpha * 0.5})`);
              shaftGrad.addColorStop(1, "rgba(0, 210, 255, 0)");
            } else {
              shaftGrad.addColorStop(0, `rgba(${dRgb}, ${alpha})`);
              shaftGrad.addColorStop(0.5, `rgba(${dRgb}, ${alpha * 0.45})`);
              shaftGrad.addColorStop(1, `rgba(${dRgb}, 0)`);
            }
            ctx.fillStyle = shaftGrad;

            if (stars === 3) {
              // Flickering core for Epic
              let flickerWidth =
                currentWidth * (0.85 + Math.sin(time / 20) * 0.15);
              ctx.fillRect(drawX - flickerWidth / 2, topY, flickerWidth, beamH);
            } else {
              ctx.fillRect(drawX - currentWidth / 2, topY, currentWidth, beamH);
            }

            // C. White-Hot Inner Core Laser
            if (stars >= 1 || isUnique) {
              let coreW = Math.max(1, currentWidth * 0.3);
              let coreGrad = ctx.createLinearGradient(
                drawX,
                groundY,
                drawX,
                topY,
              );
              coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
              coreGrad.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.8})`);
              coreGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
              ctx.fillStyle = coreGrad;
              ctx.fillRect(drawX - coreW / 2, topY, coreW, beamH);
            } else {
              // 0-Star Smoky/Drifting core
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.moveTo(drawX, groundY);
              for (let sy = groundY; sy >= topY; sy -= 10) {
                let drift = Math.sin(time / 200 + sy / 15) * 1.2;
                ctx.lineTo(drawX + drift, sy);
              }
              ctx.stroke();
            }

            // ==========================================
            // SUB-PASS D: FRONT-Plane Depth-Sorted Orbiting Sparks (z >= 0) & Helix
            // ==========================================
            // 1. Helix Strands for 4★, 5★, UNIQUE
            if ((stars === 4 || stars === 5 || isUnique) && !isEco) {
              let helixSteps = isUnique ? 25 : 16;
              let hStep = beamH / helixSteps;
              ctx.lineWidth = 1.5;

              // Strand 1 (Cyan/Teal or White)
              ctx.strokeStyle = isUnique
                ? "rgba(0, 210, 255, 0.8)"
                : `rgba(255, 255, 255, 0.7)`;
              ctx.beginPath();
              for (let s = 0; s <= helixSteps; s++) {
                let ly = groundY - s * hStep;
                let phase = (s * Math.PI * 4) / helixSteps + time / 130;
                let lx = drawX + Math.sin(phase) * (currentWidth * 1.35);
                if (s === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
              }
              ctx.stroke();

              // Strand 2 (Magenta or White)
              ctx.strokeStyle = isUnique
                ? "rgba(255, 0, 127, 0.8)"
                : `rgba(255, 255, 255, 0.45)`;
              ctx.beginPath();
              for (let s = 0; s <= helixSteps; s++) {
                let ly = groundY - s * hStep;
                let phase = (s * Math.PI * 4) / helixSteps - time / 130;
                let lx = drawX + Math.sin(phase) * (currentWidth * 1.35);
                if (s === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
              }
              ctx.stroke();
            }

            // 2. Frontal Sparks Orbits
            if (stars === 4 && !isEco) {
              let legendarySparks = 4;
              for (let i = 0; i < legendarySparks; i++) {
                let theta = time / 350 + i * ((Math.PI * 2) / legendarySparks);
                let z = Math.sin(theta);
                if (z >= 0) {
                  let ox = drawX + Math.cos(theta) * 16;
                  let hProgress =
                    (time / 10 + i * (beamH / legendarySparks)) % beamH;
                  let oy = groundY - hProgress;
                  ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + z * 0.6})`;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.4, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (isUnique && !isEco) {
              let uniqueOrbs = 3;
              for (let uIdx = 0; uIdx < uniqueOrbs; uIdx++) {
                let theta = time / 280 + uIdx * ((Math.PI * 2) / uniqueOrbs);
                let z = Math.sin(theta);
                if (z >= 0) {
                  let rSize = 14 + Math.sin(time / 120 + uIdx) * 3;
                  let ox = drawX + Math.cos(theta) * rSize;
                  let hProgress =
                    (time / 8 + uIdx * (beamH / uniqueOrbs)) % beamH;
                  let oy = groundY - hProgress;

                  let grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, 4);
                  grad.addColorStop(0, "#ffffff");
                  grad.addColorStop(0.5, "rgba(0, 210, 255, 0.85)");
                  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
                  ctx.fillStyle = grad;
                  ctx.beginPath();
                  ctx.arc(ox, oy, 4, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = "#0c011a";
                  ctx.beginPath();
                  ctx.arc(ox, oy, 1.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            // 3. Custom Rarity-Themed Core Sparks
            if (stars === 5) {
              // Mythic: Lightning arcs
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.45 + Math.sin(time / 45) * 0.15})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(drawX, groundY);
              let segments = isEco ? 5 : 10;
              let segH = beamH / segments;
              for (let s = 1; s <= segments; s++) {
                let ly = groundY - s * segH;
                let lx =
                  drawX + Math.sin(time / 8 + s) * 3 * (1 - s / segments);
                ctx.lineTo(lx, ly);
              }
              ctx.stroke();
            } else if (stars === 3) {
              // Epic: Molten embers rising
              let emberCount = isEco ? 1 : 3;
              for (let i = 0; i < emberCount; i++) {
                let progress = (time / 800 + i / emberCount) % 1.0;
                let ey = groundY - progress * beamH;
                let ex = drawX + Math.sin(time / 60 + i) * 3.5;
                ctx.fillStyle = `rgba(${dRgb}, ${1.0 - progress})`;
                ctx.beginPath();
                ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (stars === 2) {
              // Magic: Arcane motes drifting
              let runeCount = isEco ? 1 : 3;
              for (let i = 0; i < runeCount; i++) {
                let progress = (time / 900 + i / runeCount) % 1.0;
                let ry = groundY - progress * beamH;
                let rx = drawX + Math.cos(time / 80 + i) * 5;
                ctx.fillStyle = `rgba(${dRgb}, ${0.85 * (1.0 - progress)})`;
                ctx.beginPath();
                ctx.arc(rx, ry, 1.4, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (stars === 1) {
              // Rare: Floating ice sparks
              let iceCount = isEco ? 1 : 2;
              for (let i = 0; i < iceCount; i++) {
                let progress = (time / 1000 + i / iceCount) % 1.0;
                let iy = groundY - progress * beamH;
                let ix = drawX + Math.sin(time / 100 + i * 5) * 4;
                ctx.fillStyle = `rgba(${dRgb}, ${0.75 * (1.0 - progress)})`;
                ctx.beginPath();
                ctx.arc(ix, iy, 1.1, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // ==========================================
            // SUB-PASS E: Top Ray & Lens Flare Burst (3★+)
            // ==========================================
            if (stars >= 3 || isUnique) {
              ctx.save();
              let flarePulse = 1.0 + Math.sin(time / 100) * 0.25;
              let flareRad = (4 + stars * 2) * flarePulse;

              let flareGrad = ctx.createRadialGradient(
                drawX,
                topY,
                0,
                drawX,
                topY,
                flareRad * 2,
              );
              flareGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
              flareGrad.addColorStop(0.4, `rgba(${dRgb}, 0.7)`);
              flareGrad.addColorStop(1, "rgba(0,0,0,0)");

              ctx.fillStyle = flareGrad;
              ctx.beginPath();
              ctx.arc(drawX, topY, flareRad * 2, 0, Math.PI * 2);
              ctx.fill();

              // Horizontal Lens Flare Cross
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * flarePulse})`;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(drawX - flareRad * 2.5, topY);
              ctx.lineTo(drawX + flareRad * 2.5, topY);
              ctx.moveTo(drawX, topY - flareRad * 1.5);
              ctx.lineTo(drawX, topY + flareRad * 1.5);
              ctx.stroke();

              if (isUnique || stars >= 5) {
                ctx.strokeStyle = isUnique ? "#00ffff" : "#ffd700";
                ctx.beginPath();
                ctx.moveTo(drawX - flareRad * 1.8, topY - flareRad * 0.8);
                ctx.lineTo(drawX + flareRad * 1.8, topY + flareRad * 0.8);
                ctx.moveTo(drawX - flareRad * 1.8, topY + flareRad * 0.8);
                ctx.lineTo(drawX + flareRad * 1.8, topY - flareRad * 0.8);
                ctx.stroke();
              }
              ctx.restore();
            }

            // ==========================================
            // SUB-PASS F: Floating Equipment Symbol
            // ==========================================
            let bob = Math.sin(time / 150) * 2.5;
            let lootY = drawY - 10 + bob;

            let img = window.getCanvasIconImage
              ? window.getCanvasIconImage(gl.item)
              : null;
            if (img && img.complete) {
              ctx.drawImage(img, drawX - 10, lootY - 10, 20, 20);
            } else {
              ctx.fillStyle = color;
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(drawX, lootY + 4 - 5);
              ctx.lineTo(drawX + 5, lootY + 4);
              ctx.lineTo(drawX, lootY + 4 + 5);
              ctx.lineTo(drawX - 5, lootY + 4);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(drawX - 1.5, lootY + 4 - 1.5, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          },
        });
      });
    }

    // B5. Sector Environmental Decorations (Culled by Viewport)
    if (
      !isHub &&
      mapInst &&
      mapInst.decorations &&
      mapInst.decorations.length > 0
    ) {
      mapInst.decorations.forEach((dec) => {
        let isWallProp =
          mapInst.grid[dec.y] &&
          mapInst.grid[dec.y][dec.x] === window.TILE_TYPES.WALL;

        depthQueue.push({
          yBase: dec.worldY + (isWallProp ? 0 : 8),
          draw: () => {
            if (window.drawSectorDecoration) {
              window.drawSectorDecoration(ctx, dec, tSize);
            }
          },
        });
      });
    }

    // C. Active Dungeon Mobs (Culled by Viewport)
    if (window.activeDungeonMobs && window.activeDungeonMobs.length > 0) {
      let activeMobs = window.activeDungeonMobs;
      for (let index = 0; index < activeMobs.length; index++) {
        let m = activeMobs[index];
        if (!isActiveMobInRenderViewport(m, camera)) continue;

        if (m.perfectStrikeTimer > 0) {
          let progress = m.perfectStrikeTimer / m.perfectStrikeMax;
          let cx = m.x + m.w / 2;
          let cy = m.y + m.h / 2;

          depthQueue.push({
            yBase: m.y + (m.h || 24) + 1,
            draw: () => {
              ctx.save();
              ctx.strokeStyle = "rgba(231, 76, 60, 0.4)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(cx, cy, 22, 0, Math.PI * 2);
              ctx.stroke();

              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.arc(cx, cy, 6 + progress * 16, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            },
          });
        }

        depthQueue.push({
          yBase: m.y + (m.h || 24),
          draw: () => {
            window.drawSingleMob(ctx, m, mobTetherRecipients);
            if (window.combatVisuals)
              window.combatVisuals.drawTargetHealthBar(ctx, m, false);
          },
        });
      }
    }

    // C2. Active Cavern Sigil Interactives (Depth-Sorted)
    if (window.cavernInteractives && window.cavernInteractives.length > 0) {
      window.cavernInteractives.forEach((item) => {
        depthQueue.push({
          yBase: item.y + (item.h || 24),
          draw: () => {
            window.drawCavernInteractive(ctx, item);
          },
        });
      });
    }

    // D. Boss Warden
    if (window.mob) {
      let bm = window.mob;
      depthQueue.push({
        yBase: bm.y + (bm.h || 48),
        draw: () => {
          if (bm.state === "telegraphing" && bm.activeAbility) {
            if (
              window.BossAIEngine &&
              typeof window.BossAIEngine.renderTelegraph === "function"
            ) {
              window.BossAIEngine.renderTelegraph(ctx, bm);
            }
          }

          window.drawSingleMob(ctx, window.mob, mobTetherRecipients);
        },
      });
    }

    // E. Player Hero
    let bounce = 0;
    let deathFrame =
      window.deathAnimationTimer > 0 ? 75 - window.deathAnimationTimer : 0;
    if (deathFrame > 0) {
      bounce = deathFrame * 0.25;
    } else if (p.isMoving) {
      bounce = Math.sin(p.walkTimer) * 2.2;
    } else {
      bounce = Math.sin(Date.now() / 350) * 1.2;
    }

    depthQueue.push({
      yBase: p.y,
      draw: () => {
        let dx = p.targetX - p.x;
        let dy = p.targetY - p.y;
        let distToTarget = Math.hypot(dx, dy);
        let ctrlMode = window.playerStats
          ? window.playerStats.controlMode || "joystick"
          : "joystick";

        if (ctrlMode === "cursor" && distToTarget > 4) {
          ctx.save();
          ctx.strokeStyle = "rgba(0, 210, 255, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.targetX, p.targetY);
          ctx.stroke();
          ctx.setLineDash([]);

          let pulse = Math.sin(Date.now() / 150) * 1.5;
          ctx.strokeStyle = "#00d2ff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 6 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "rgba(0, 210, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(p.x, p.y - 8);
        if (deathFrame > 0) {
          let tilt = Math.min(Math.PI / 2, (deathFrame / 25) * (Math.PI / 2));
          ctx.rotate(p.facing === -1 ? -tilt : tilt);
          ctx.globalAlpha = Math.max(0, 1.0 - deathFrame / 65);
        } else if (p.facing === -1) {
          ctx.scale(-1, 1);
        }

        window.drawSingleHero(
          ctx,
          0,
          0,
          0.8,
          window.equippedSlots || {},
          window.playerStats || {},
          bounce,
          {
            slashFrame: window.hero.slashFrame,
            deathAnimationTimer: window.deathAnimationTimer,
            isMainHero: true,
            isMoving: p.isMoving,
            facing: p.facing,
          },
        );
        ctx.restore();

        // Render Player Overhead Healthbar & Arcane Shield Bar
                let pHpPct = Math.max(0, Math.min(1, p.hp / p.maxHp));
                if (p.trailingHpPct === undefined) p.trailingHpPct = pHpPct;
                if (p.trailingHpPct > pHpPct) {
                  p.trailingHpPct = Math.max(pHpPct, p.trailingHpPct - 0.015);
                } else {
                  p.trailingHpPct = pHpPct;
                }

                let isLowHp = pHpPct <= 0.2 && p.hp > 0;
                let showPlayerHpBar =
                  (p.lastDamageTimer && p.lastDamageTimer > 0) || isLowHp || (p.arcaneShield > 0);

                if (showPlayerHpBar && p.hp > 0) {
                  let barW = 32;
                  let barH = 5;
                  let barX = p.x - barW / 2;
                  let barY = p.y - 28;

                  let borderCol = "#000000";
                  if (isLowHp) {
                    let pulse = Math.sin(Date.now() / 120) * 0.5 + 0.5;
                    borderCol = `rgba(231, 76, 60, ${0.4 + pulse * 0.5})`;
                  }

                  ctx.fillStyle = "rgba(10, 10, 10, 0.85)";
                  ctx.fillRect(barX, barY, barW, barH);

                  ctx.fillStyle = "#ffffff";
                  ctx.fillRect(barX, barY, barW * p.trailingHpPct, barH);

                  ctx.fillStyle = isLowHp ? "#e74c3c" : "#2ecc71";
                  ctx.fillRect(barX, barY, barW * pHpPct, barH);

                  // Cyan Arcane Shield Overlay Bar
                  if (p.arcaneShield > 0 && p.arcaneShieldMax > 0) {
                    let shieldPct = Math.min(1.0, p.arcaneShield / p.arcaneShieldMax);
                    ctx.fillStyle = "rgba(0, 210, 255, 0.85)";
                    ctx.fillRect(barX, barY, barW * shieldPct, barH);
                  }

                  ctx.strokeStyle = borderCol;
                  ctx.lineWidth = 1.2;
                  ctx.strokeRect(barX, barY, barW, barH);
                }
      },
    });

    // Execute Depth Sorting: Render North to South
    depthQueue.sort((a, b) => a.yBase - b.yBase);
    depthQueue.forEach((item) => item.draw());

    if (!isHub && window.playerStats?.combatRangeGuides === true) {
      renderCombatReachCommunication(
        ctx,
        getPlayerTargetCommunicationSnapshot({
          player: p,
          playerStats:
            typeof window.resolvePlayerStats === "function"
              ? window.resolvePlayerStats()
              : window.playerStats,
          subweapon: window.equippedSlots?.subweapon,
          map,
        }),
      );
    }

    // Render Gold Homing Particles
    if (window.goldParticles && window.goldParticles.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;

      for (let i = 0; i < window.goldParticles.length; i++) {
        let gp = window.goldParticles[i];
        let r = 4.5;
        let pulse = Math.abs(Math.sin(Date.now() / 80 + i)) * 0.3 + 0.8;

        ctx.fillStyle = "#b7950b";
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y, r * pulse + 0.6, r + 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y, r * pulse, r, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(
          gp.x - 1,
          gp.y - 1,
          r * 0.3 * pulse,
          r * 0.3,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    // Render Heart Homing Particles
    if (window.heartOrbs && window.heartOrbs.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.2;

      for (let i = 0; i < window.heartOrbs.length; i++) {
        let ho = window.heartOrbs[i];
        ctx.save();

        // Draw floor shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(ho.x, ho.y + 4, 5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Core pulsing animation
        let pulse = Math.sin(Date.now() / 100 + i) * 0.12 + 0.95;
        let size = 5.0 * pulse;

        ctx.fillStyle = "#ff4757"; // Vivid Crimson Heart Red
        ctx.beginPath();
        ctx.moveTo(ho.x, ho.y - size / 4);
        ctx.bezierCurveTo(
          ho.x - size / 2,
          ho.y - size * 0.8,
          ho.x - size,
          ho.y - size * 0.4,
          ho.x,
          ho.y + size,
        );
        ctx.bezierCurveTo(
          ho.x + size,
          ho.y - size * 0.4,
          ho.x + size / 2,
          ho.y - size * 0.8,
          ho.x,
          ho.y - size / 4,
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Micro highlight sheen
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(
          ho.x - size * 0.3,
          ho.y - size * 0.3,
          size * 0.25,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.restore();
      }
    }

    // Render XP Homing Orbs
    if (window.xpOrbs && window.xpOrbs.length > 0) {
      let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
      let camX = window.DungeonCamera ? Math.floor(window.DungeonCamera.x) : 0;
      let camY = window.DungeonCamera ? Math.floor(window.DungeonCamera.y) : 0;

      for (let i = 0; i < window.xpOrbs.length; i++) {
        let orb = window.xpOrbs[i];
        let drawX = orb.isHomingScreenSpace
          ? orb.screenX / zoom + camX
          : orb.worldX;
        let drawY = orb.isHomingScreenSpace
          ? orb.screenY / zoom + camY
          : orb.worldY;

        ctx.save();
        let r = 4.0;
        let pulse = Math.abs(Math.sin(Date.now() / 70 + i)) * 0.3 + 0.8;

        let grad = ctx.createRadialGradient(
          drawX,
          drawY,
          1,
          drawX,
          drawY,
          r * 2.2 * pulse,
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(0.35, "rgba(0, 210, 255, 0.85)");
        grad.addColorStop(0.75, "rgba(168, 85, 247, 0.6)");
        grad.addColorStop(1, "rgba(168, 85, 247, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(drawX, drawY, r * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#a855f7";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(drawX - 1, drawY - 1, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Render Active Spell Animations in World Coordinates
    if (window.renderSpellAnimations) {
      window.renderSpellAnimations(ctx);
    }

    // Render Active Projectiles in World Coordinates
    if (window.projectiles && window.projectiles.length > 0) {
      let time = Date.now();
      window.projectiles.forEach((proj) => {
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.8;

        let pr = proj.r || 5;
        let pulse = Math.sin(time / 80 + (proj.pulseOffset || 0)) * 1.5;
        let r = pr + pulse;

        if (proj.type === "thorn") {
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#a3fd83";
          ctx.fillRect(proj.x - 1, proj.y - 1, 2, 2);
        } else if (proj.type === "frost") {
          ctx.fillStyle = "#3498db";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === "fireball") {
          ctx.fillStyle = "#e67e22";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#f1c40f";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.type === "maelstrom") {
          ctx.fillStyle = "#2ecc71";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "#55efc4";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (proj.type === "tome_bolt") {
          // Neutral arcane delivery shard. A Tome's Fire/Lightning/Frost
          // identity is presented only when a legal impact actually procs it.
          renderTomeDeliveryProjectile(ctx, proj, r);
        } else if (proj.type === "void") {
          ctx.fillStyle = "#8e44ad";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r + 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#ff007f";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // Render Upgraded Polymorphic Particles (Subphase B.1 Dispatcher & Subphases B.2-B.3 All Vector Shapes)
    if (window.particles) {
      window.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha !== undefined ? pt.alpha : 1.0;
        ctx.fillStyle = pt.color || "#ffffff";

        // Dispatcher (Polymorphic Style Branching)
        if (pt.style === "circle" || !pt.style) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (pt.style === "polygon") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);

          // Draw main faceted shard body
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(size * 0.8, size * 0.5);
          ctx.lineTo(0, size * 0.3);
          ctx.lineTo(-size * 0.8, size * 0.5);
          ctx.closePath();
          ctx.fill();

          // Left facet shadow overlay to simulate 3D depth
          ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(0, size * 0.3);
          ctx.lineTo(-size * 0.8, size * 0.5);
          ctx.closePath();
          ctx.fill();
        } else if (pt.style === "streak") {
          let speed = Math.hypot(pt.vx, pt.vy);
          if (speed > 0.1) {
            ctx.lineWidth =
              (pt.size || 1.5) * (pt.scale !== undefined ? pt.scale : 1.0);
            ctx.lineCap = "round";

            let tailX = pt.x - pt.vx * 1.5;
            let tailY = pt.y - pt.vy * 1.5;

            // Generate motion blur gradient fading out at the tail (Added safe offsets to prevent identical coords)
            let grad = ctx.createLinearGradient(
              pt.x,
              pt.y,
              tailX + 0.1,
              tailY + 0.1,
            );
            grad.addColorStop(0, pt.color || "#ffffff");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
          } else {
            // Drop down to circle fallback if velocity falls to zero
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size || 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (pt.style === "elliptical_3d") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          let cosVal = Math.cos(pt.angle || 0);

          ctx.translate(pt.x, pt.y);
          if (pt.tiltAngle) {
            ctx.rotate(pt.tiltAngle);
          }

          let radiusX = size;
          let radiusY = size * Math.abs(cosVal); // squash vertical axis to simulate 3D tumbling

          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Render high-contrast metallic highlight ring
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.style === "sparkle_star") {
          let size = Math.max(
            0.1,
            (pt.size || 4) * (pt.scale !== undefined ? pt.scale : 1.0),
          );
          let innerSize = size * 0.25;

          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);

          // 1. Draw glowing radial background aura (Clamped to prevent IndexSizeError)
          let glowGrad = ctx.createRadialGradient(
            0,
            0,
            Math.max(0.05, innerSize),
            0,
            0,
            Math.max(0.1, size * 1.8),
          );
          glowGrad.addColorStop(0, pt.color || "#ffffff");
          glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw white-hot stellar core on top of glow
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.quadraticCurveTo(0, -innerSize, innerSize, 0);
          ctx.quadraticCurveTo(0, innerSize, 0, size);
          ctx.quadraticCurveTo(0, innerSize, -innerSize, 0);
          ctx.quadraticCurveTo(0, -innerSize, 0, -size);
          ctx.closePath();
          ctx.fill();
        } else if (pt.style === "glowing_orb") {
          let size = (pt.size || 3) * (pt.scale !== undefined ? pt.scale : 1.0);
          let timeVal = Date.now() * 0.004;
          let seed = pt.x * 17.3 + pt.y * 23.9;
          let breathe = 1.0 + 0.2 * Math.sin(timeVal + seed);
          let r = Math.max(0.1, size * breathe);

          ctx.translate(pt.x, pt.y);

          let grad = ctx.createRadialGradient(0, 0, r * 0.15, 0, 0, r * 2.0);
          grad.addColorStop(0, "#ffffff"); // intense center core
          grad.addColorStop(0.35, pt.color || "#ffffff"); // soft color-mapped body
          grad.addColorStop(1, "rgba(0, 0, 0, 0)"); // transparent fading halo

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Temporarily hide particles to prevent combatVisuals duplicate drawing (Subphase B.1)
    let tempParticles = window.particles;
    window.particles = [];
    if (window.combatVisuals) {
      window.combatVisuals.render(ctx);
    }
    window.particles = tempParticles;

    // Floating System Text Effects
    window.floatingTexts.forEach((ft) => {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.textAlign = "center";
      let drawX =
        ft.followPlayer && window.player
          ? window.player.x + (ft.offsetX || 0)
          : ft.x;
      let drawY =
        ft.followPlayer && window.player
          ? window.player.y + (ft.offsetY || 0)
          : ft.y;
      ctx.strokeText(ft.text, drawX, drawY);
      ctx.fillText(ft.text, drawX, drawY);
    });

    ctx.restore();

    // Render Dynamic Ambient Lighting Pass
    window.renderLightingOverlay(ctx, canvas);

    // Render Screen Vignette Overlay (Guarded with safe minimum dimensions to prevent exceptions during resizing)
    let safeW = Math.max(1, canvas.width);
    let safeH = Math.max(1, canvas.height);
    let vgInnerR = Math.max(0.1, Math.min(safeW, safeH) * 0.35);
    let vgOuterR = Math.max(0.2, Math.max(safeW, safeH) * 0.75);
    let vg = ctx.createRadialGradient(
      safeW / 2,
      safeH / 2,
      vgInnerR,
      safeW / 2,
      safeH / 2,
      vgOuterR,
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(2,1,6,0.75)");

    ctx.save();
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Render Minimap in Screen Space
    // Safe-optimization: On mobile portrait, hide the minimap during active Boss fights to prevent HUD overlap/clutter
    let isPortrait = window.innerHeight > window.innerWidth;
    let shouldHideMinimap = isPortrait && window.mob;
    if (!shouldHideMinimap && typeof window.renderMinimap === "function") {
      window.renderMinimap(ctx, canvas);
    }

    // Render Boss Health Bar in Screen Space
    if (window.currentGameState === window.GAME_STATES.DUNGEON) {
      let activeBosses = [];
      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          if (
            m.hp.gt(0) &&
            (m.type === "dungeon_boss" ||
              m.type === "dungeon_miniboss" ||
              m.isBoss)
          ) {
            activeBosses.push(m);
          }
        });
      }
      if (
        window.mob &&
        window.mob.hp.gt(0) &&
        !activeBosses.some((b) => b.id === window.mob.id)
      ) {
        activeBosses.push(window.mob);
      }

      activeBosses.forEach((bm, index) => {
        if (isPortrait) {
          window.drawPortraitBossHealthBar(ctx, bm, canvas, index);
        } else if (
          window.combatVisuals &&
          typeof window.combatVisuals.drawTargetHealthBar === "function"
        ) {
          window.combatVisuals.drawTargetHealthBar(ctx, bm, true, index);
        }
      });
    }

    // 3. Render Floating Virtual Joystick Overlay (Screen Space)
    let mode = window.playerStats
      ? window.playerStats.controlMode || "joystick"
      : "joystick";
    if (mode === "joystick" && window.joystick.active) {
      let joy = window.joystick;
      ctx.save();

      // Outer Base Ring
      ctx.fillStyle = "rgba(10, 14, 23, 0.45)";
      ctx.strokeStyle = "rgba(0, 210, 255, 0.6)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(joy.baseX, joy.baseY, joy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Thumb Stick Nub
      ctx.fillStyle = "#00d2ff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joy.currX, joy.currY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 4. Render Station Proximity Prompt Overlay (Floating directly above player in screen space)
    if (
      window.activeStationPrompt &&
      window.currentGameState === window.GAME_STATES.HUB
    ) {
      let st = window.activeStationPrompt;
      let camX = window.DungeonCamera ? window.DungeonCamera.x : 0;
      let camY = window.DungeonCamera ? window.DungeonCamera.y : 0;
      let zoom = window.DungeonCamera ? window.DungeonCamera.zoom : 1.0;
      let pScreenX = (p.x - camX) * zoom;
      let pScreenY = (p.y - camY - 50) * zoom;

      let recLoot = window.playerStats && window.playerStats.recoveryLoot;
      let hasRecovery =
        st.type === window.TILE_TYPES.STATION_PORTAL &&
        hasRecoveryAssets(recLoot);

      // Pre-allocate and reuse part configurations on the global window to enforce zero GC allocations in the loop
      if (!window._proxParts) {
        window._proxParts = [
          { text: "[ ", color: "rgba(255, 255, 255, 0.4)" },
          { text: "TAP TO ENTER: ", color: "#00d2ff" },
          { text: "", color: "#ffffff" },
          { text: "", color: "#ff7675", pulse: true },
          { text: " ]", color: "rgba(255, 255, 255, 0.4)" },
        ];
      }

      // Subphase 15: Intercept and swap prompt text if an active challenge is signed
      let hasChallenge =
        st.type === window.TILE_TYPES.STATION_PORTAL &&
        window.playerStats.activeSpecialChallenge;
      if (hasChallenge) {
        window._proxParts[1].text = "CHALLENGE ACTIVE: ";
        window._proxParts[1].color = "#ef4444"; // High-contrast crimson warning
        window._proxParts[2].text =
          window.playerStats.activeSpecialChallenge.name.toUpperCase();
        window._proxParts[3].text = " (TAP TO RUN)";
        window._proxParts[3].color = "#ff7675";
      } else {
        window._proxParts[1].text = "TAP TO ENTER: ";
        window._proxParts[1].color = "#00d2ff";
        window._proxParts[2].text = st.label.toUpperCase();
        if (hasRecovery) {
          window._proxParts[3].text = ` (RECOVER FLOOR ${recLoot.floor})`;
          window._proxParts[3].color = "#ff7675";
        } else {
          window._proxParts[3].text = "";
        }
      }

      ctx.save();
      ctx.font = "bold 10.5px monospace";

      // Calculate dynamic text width to automatically scale physical boundaries
      let totalTextWidth = 0;
      window._proxParts.forEach((part) => {
        if (part.text) {
          totalTextWidth += ctx.measureText(part.text).width;
        }
      });

      let pw = totalTextWidth + 24; // Safe padding allocation on left and right
      let ph = 32;
      let px = pScreenX - pw / 2;
      let py = pScreenY - ph / 2;

      // Draw background with sleek obsidian gradient
      let panelGrad = ctx.createLinearGradient(px, py, px, py + ph);
      panelGrad.addColorStop(0, "rgba(8, 6, 16, 0.94)");
      panelGrad.addColorStop(1, "rgba(16, 11, 28, 0.98)");
      ctx.fillStyle = panelGrad;

      // Holographic pulsing neon border
      let pulse = Math.sin(Date.now() / 180) * 0.15 + 0.85;
      ctx.strokeStyle = `rgba(0, 210, 255, ${0.4 + pulse * 0.5})`;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, [4]);
      ctx.fill();
      ctx.stroke();

      // Inner secondary decorative gold border
      ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, pw - 4, ph - 4, [3]);
      ctx.stroke();

      // Celestial Corner Crosshairs Brackets (replaces simple blocky rects)
      ctx.strokeStyle = "#00d2ff";
      ctx.lineWidth = 1.8;
      // Top-Left Bracket
      ctx.beginPath();
      ctx.moveTo(px + 6, py - 1);
      ctx.lineTo(px - 1, py - 1);
      ctx.lineTo(px - 1, py + 6);
      ctx.stroke();
      // Top-Right Bracket
      ctx.beginPath();
      ctx.moveTo(px + pw - 6, py - 1);
      ctx.lineTo(px + pw + 1, py - 1);
      ctx.lineTo(px + pw + 1, py + 6);
      ctx.stroke();
      // Bottom-Left Bracket
      ctx.beginPath();
      ctx.moveTo(px + 6, py + ph + 1);
      ctx.lineTo(px - 1, py + ph + 1);
      ctx.lineTo(px - 1, py + ph - 6);
      ctx.stroke();
      // Bottom-Right Bracket
      ctx.beginPath();
      ctx.moveTo(px + pw - 6, py + ph + 1);
      ctx.lineTo(px + pw + 1, py + ph + 1);
      ctx.lineTo(px + pw + 1, py + ph - 6);
      ctx.stroke();

      // Render clean color-segmented text
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let startX = pScreenX - totalTextWidth / 2;
      window._proxParts.forEach((part) => {
        if (!part.text) return;
        if (part.pulse) {
          let textPulse = Math.sin(Date.now() / 120) * 0.15 + 0.85;
          ctx.fillStyle = `rgba(255, 118, 117, ${textPulse})`;
        } else {
          ctx.fillStyle = part.color;
        }
        ctx.fillText(part.text, startX, pScreenY);
        startX += ctx.measureText(part.text).width;
      });
    }
  };

