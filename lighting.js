import { getActiveDungeonMap } from "./dungeon_map.js?v=1.010";

  let lightingCanvas = null;
  let lightingCtx = null;

  export function renderLightingOverlay(mainCtx, mainCanvas) {
    if (!window.playerStats) return;
    let hasShroudedSight =
      typeof window.isCavernEffectActive === "function" &&
      window.isCavernEffectActive("shrouded_sight");
    if (window.playerStats.enableLighting === false && !hasShroudedSight)
      return;
    if (window.playerStats.ecoMode && !hasShroudedSight) return;

    if (!lightingCanvas) {
      lightingCanvas = document.createElement("canvas");
      lightingCtx = lightingCanvas.getContext("2d");
    }

    if (
      lightingCanvas.width !== mainCanvas.width ||
      lightingCanvas.height !== mainCanvas.height
    ) {
      lightingCanvas.width = mainCanvas.width;
      lightingCanvas.height = mainCanvas.height;
    }

    let map = getActiveDungeonMap();
    if (!map || !map.grid) return;

    let camera = window.DungeonCamera;
    let camX = camera ? camera.x : 0;
    let camY = camera ? camera.y : 0;
    let zoom = camera ? camera.zoom : 1.0;
    let viewW = mainCanvas.width;
    let viewH = mainCanvas.height;

    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let ambientColor = "#e8e2f4";

    if (hasShroudedSight && !isHub) {
      ambientColor = "#000000"; // Dynamic pitch-black void coverage
    } else if (!isHub) {
      let depth = window.player ? window.player.depth || 1 : 1;
      let sector = Math.floor((depth - 1) / 12);
      if (window.playerStats && window.playerStats.activeSpecialChallenge) {
        sector = window.playerStats.activeSpecialChallenge.primaryTarget.tier;
      }
      if (sector === 0) ambientColor = "#a8bca8";
      else if (sector === 1) ambientColor = "#a0b4cc";
      else if (sector === 2) ambientColor = "#cc9888";
      else if (sector === 3) ambientColor = "#a0ccb0";
      else ambientColor = "#9888cc";
    }

    // 1. Fill entire screen lightmap directly with ambientColor (source-over)
    lightingCtx.globalCompositeOperation = "source-over";
    lightingCtx.fillStyle = ambientColor;
    lightingCtx.fillRect(0, 0, viewW, viewH);

    // Apply World Camera Transform to Lighting Context
    lightingCtx.save();
    lightingCtx.scale(zoom, zoom);
    lightingCtx.translate(-Math.floor(camX), -Math.floor(camY));

    // Bounding box with 200px padding for frustum culling offscreen lights
        let pad = 200;
        let minCamX = camX - pad;
        let maxCamX = camX + viewW / zoom + pad;
        let minCamY = camY - pad;
        let maxCamY = camY + viewH / zoom + pad;

        // 3. Collect Light Emitters in World Coordinates (Zero-Allocation Array Reuse)
        if (!window._sharedLightsArray) window._sharedLightsArray = [];
        let lights = window._sharedLightsArray;
        lights.length = 0;

        // Active Spell Lights (temporary glows)
    if (window.activeSpellLights) {
      window.activeSpellLights.forEach((sl) => {
        if (
          sl.x >= minCamX &&
          sl.x <= maxCamX &&
          sl.y >= minCamY &&
          sl.y <= maxCamY
        ) {
          lights.push({
            x: sl.x,
            y: sl.y,
            r: sl.radius,
            innerColor: sl.innerColor,
            outerColor: sl.outerColor,
          });
        }
      });
    }

    // Player Hero Light
    let p = window.player;
    if (p && p.hp > 0) {
      let flicker = Math.sin(Date.now() / 90) * 4;
      let pRadius = hasShroudedSight ? 200 + flicker : 230 + flicker; // Calibrated to 200px spotlight
      lights.push({
        x: p.x,
        y: p.y - 8,
        r: pRadius,
        innerColor: hasShroudedSight
          ? "rgba(255, 255, 245, 1.0)"
          : "rgba(255, 248, 230, 0.98)",
        outerColor: hasShroudedSight
          ? "rgba(215, 150, 70, 0.6)"
          : "rgba(235, 200, 150, 0.45)",
        isPlayerLight: true, // Flagged for custom multi-stop rendering
      });
    }

    // Hub Stations Light
    if (isHub && map.stations) {
      let tileSize = map.tileSize;
      let time = Date.now();
      map.stations.forEach((st) => {
        let sx = st.x * tileSize + tileSize / 2;
        let sy = st.y * tileSize + tileSize / 2;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          if (st.type === window.TILE_TYPES.STATION_FORGE) {
            let forgeFlicker =
              Math.sin(time / 70) * 12 + Math.cos(time / 110) * 8;
            lights.push({
              x: sx - 6,
              y: sy - 4,
              r: 200 + forgeFlicker,
              innerColor: "rgba(255, 210, 130, 1.0)",
              outerColor: "rgba(249, 115, 22, 0.65)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_PORTAL) {
            let pEvent = window.playerStats.activePortalEvent || "expedition";
            let inner = "rgba(224, 242, 254, 1.0)";
            let outer = "rgba(56, 189, 248, 0.55)";
            let radius = 150;

            if (pEvent === "onslaught") {
              inner = "rgba(255, 180, 100, 1.0)";
              outer = "rgba(249, 115, 22, 0.65)";
            } else if (pEvent === "rift") {
              inner = "rgba(243, 104, 224, 1.0)";
              outer = "rgba(168, 85, 247, 0.65)";
            }

            lights.push({
              x: sx,
              y: sy,
              r: radius,
              innerColor: inner,
              outerColor: outer,
            });
          } else if (st.type === window.TILE_TYPES.STATION_ENCHANT) {
            lights.push({
              x: sx,
              y: sy,
              r: 150,
              innerColor: "rgba(224, 242, 254, 1.0)",
              outerColor: "rgba(168, 85, 247, 0.55)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_INN) {
            lights.push({
              x: sx,
              y: sy,
              r: 120,
              innerColor: "rgba(180, 255, 200, 0.95)",
              outerColor: "rgba(46, 204, 113, 0.45)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_GACHAPON) {
            let gachaFlicker =
              Math.sin(time / 120) * 10 + Math.cos(time / 80) * 5;
            lights.push({
              x: sx,
              y: sy - 8,
              r: 180 + gachaFlicker,
              innerColor: "rgba(0, 210, 255, 0.95)",
              outerColor: "rgba(232, 121, 249, 0.55)",
            });
          } else if (st.type === window.TILE_TYPES.STATION_SHOP) {
            let shopFlicker =
              Math.sin(time / 140) * 8 + Math.cos(time / 90) * 4;
            lights.push({
              x: sx,
              y: sy - 6,
              r: 175 + shopFlicker,
              innerColor: "rgba(255, 220, 130, 0.98)",
              outerColor: "rgba(230, 126, 34, 0.50)",
            });
          }
        }
      });
    }

    // Dungeon Map Special Tiles
    if (!isHub) {
      let tileSize = map.tileSize;
      let startCol = Math.max(0, Math.floor(camX / tileSize));
      let endCol = Math.min(
        map.width - 1,
        Math.ceil((camX + viewW / zoom) / tileSize),
      );
      let startRow = Math.max(0, Math.floor(camY / tileSize));
      let endRow = Math.min(
        map.height - 1,
        Math.ceil((camY + viewH / zoom) / tileSize),
      );

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let tile = map.grid[r][c];
          let sx = c * tileSize + tileSize / 2;
          let sy = r * tileSize + tileSize / 2;

          if (
            sx >= minCamX &&
            sx <= maxCamX &&
            sy >= minCamY &&
            sy <= maxCamY
          ) {
            if (tile === window.TILE_TYPES.DESCENT_PORTAL) {
              lights.push({
                x: sx,
                y: sy,
                r: 140,
                innerColor: "rgba(230, 190, 255, 1.0)",
                outerColor: "rgba(168, 85, 247, 0.50)",
              });
            } else if (tile === window.TILE_TYPES.EXTRACTION_ZONE) {
              lights.push({
                x: sx,
                y: sy,
                r: 150,
                innerColor: "rgba(190, 245, 255, 1.0)",
                outerColor: "rgba(0, 210, 255, 0.55)",
              });
            } else if (tile === window.TILE_TYPES.BOSS_GATE) {
              lights.push({
                x: sx,
                y: sy,
                r: 150,
                innerColor: "rgba(255, 180, 180, 1.0)",
                outerColor: "rgba(231, 76, 60, 0.55)",
              });
            } else if (tile === window.TILE_TYPES.CHEST_SPAWN) {
              lights.push({
                x: sx,
                y: sy,
                r: 90,
                innerColor: "rgba(255, 240, 180, 0.95)",
                outerColor: "rgba(255, 215, 0, 0.45)",
              });
            }
          }
        }
      }
    }

    // Wall Torches Light
    if (map.torches && !hasShroudedSight) {
      // Extinguish torches under Shrouded Sight
      let tileSize = map.tileSize;
      let time = Date.now();
      map.torches.forEach((t) => {
        let sx = t.x * tileSize + tileSize / 2;
        let sy = t.y * tileSize + tileSize - 8;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          let torchFlicker = Math.sin(time / 70 + t.x * 3) * 10;
          lights.push({
            x: sx,
            y: sy,
            r: 190 + torchFlicker,
            innerColor: "rgba(255, 245, 200, 1.0)",
            outerColor: "rgba(255, 140, 30, 0.65)",
          });
        }
      });
    }

    // Sector Decorations Light
    if (map.decorations) {
      map.decorations.forEach((dec) => {
        if (
          dec.light &&
          dec.worldX >= minCamX &&
          dec.worldX <= maxCamX &&
          dec.worldY >= minCamY &&
          dec.worldY <= maxCamY
        ) {
          let radius = dec.light.radius || 80;
          let time = Date.now();
          if (dec.light.pulseType === "flicker") {
            radius += Math.sin(time / 70 + dec.x * 3) * 6;
          } else if (dec.light.pulseType === "wave") {
            radius += Math.sin(time / 180 + dec.x) * 8;
          } else if (dec.light.pulseType === "strobe") {
            radius += Math.sin(time / 50) * 10;
          }
          lights.push({
            x: dec.worldX,
            y: dec.worldY,
            r: radius,
            innerColor: dec.light.innerColor,
            outerColor: dec.light.outerColor,
          });
        }
      });
    }
    if (!isHub && map.grid) {
      let depth = window.player ? window.player.depth || 1 : 1;
      let sector = Math.floor((depth - 1) / 12);
      if (window.playerStats && window.playerStats.activeSpecialChallenge) {
        sector = window.playerStats.activeSpecialChallenge.primaryTarget.tier;
      }
      let tileSize = map.tileSize;
      let time = Date.now();

      let startCol = Math.max(0, Math.floor(minCamX / tileSize));
      let endCol = Math.min(map.width - 1, Math.ceil(maxCamX / tileSize));
      let startRow = Math.max(0, Math.floor(minCamY / tileSize));
      let endRow = Math.min(map.height - 1, Math.ceil(maxCamY / tileSize));

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (map.grid[r][c] === window.TILE_TYPES.FLOOR) {
            let tileHash =
              Math.abs(Math.sin(c * 17.123 + r * 43.51) * 43758.5453) % 1.0;
            let sx = c * tileSize + tileSize / 2;
            let sy = r * tileSize + tileSize / 2;

            if (sector === 2 && tileHash > 0.88) {
              // Lava Vent Light
              let pulse = Math.sin(time / 150 + tileHash * 10) * 10;
              lights.push({
                x: sx,
                y: sy,
                r: 65 + pulse,
                innerColor: "rgba(254, 240, 138, 0.9)",
                outerColor: "rgba(249, 115, 22, 0.45)",
              });
            } else if (sector === 3 && tileHash > 0.85) {
              // Toxic Spore Puddle Light
              lights.push({
                x: sx,
                y: sy,
                r: 50,
                innerColor: "rgba(167, 243, 208, 0.8)",
                outerColor: "rgba(52, 211, 153, 0.35)",
              });
            } else if (sector >= 4 && tileHash > 0.85) {
              // Void Tear Singularity Light
              let pulse = Math.cos(time / 180 + tileHash * 5) * 8;
              lights.push({
                x: sx,
                y: sy,
                r: 60 + pulse,
                innerColor: "rgba(245, 208, 254, 0.85)",
                outerColor: "rgba(232, 121, 249, 0.4)",
              });
            }
          }
        }
      }
    }

    // Active Mobs & Boss Lights
    if (window.activeDungeonMobs) {
      window.activeDungeonMobs.forEach((m) => {
        let sx = m.x + m.w / 2;
        let sy = m.y + m.h / 2;
        if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
          if (m.isRare) {
            // Rares emit a dim pulsing alert ring in the dark
            lights.push({
              x: sx,
              y: sy,
              r: hasShroudedSight ? 40 : 90,
              innerColor: "rgba(255, 240, 180, 0.85)",
              outerColor: "rgba(241, 196, 15, 0.25)",
            });
          } else if (!hasShroudedSight) {
            lights.push({
              x: sx,
              y: sy,
              r: 50,
              innerColor: "rgba(255, 200, 200, 0.70)",
              outerColor: "rgba(231, 76, 60, 0.25)",
            });
          }
        }
      });
    }

    if (window.mob) {
      let bm = window.mob;
      let sx = bm.x + bm.w / 2;
      let sy = bm.y + bm.h / 2;
      if (sx >= minCamX && sx <= maxCamX && sy >= minCamY && sy <= maxCamY) {
        let r = bm.type === "dungeon_boss" ? 200 : 150;
        let bRadius = hasShroudedSight ? r * 0.55 : r; // Slightly dim boss aura
        lights.push({
          x: sx,
          y: sy,
          r: bRadius,
          innerColor: "rgba(255, 210, 210, 0.9)",
          outerColor: "rgba(231, 76, 60, 0.40)",
        });
      }
    }

    // Gold Particles Light
    if (window.goldParticles) {
      window.goldParticles.forEach((gp) => {
        if (
          gp.x >= minCamX &&
          gp.x <= maxCamX &&
          gp.y >= minCamY &&
          gp.y <= maxCamY
        ) {
          lights.push({
            x: gp.x,
            y: gp.y,
            r: 30,
            innerColor: "rgba(255, 245, 180, 0.80)",
            outerColor: "rgba(255, 215, 0, 0.30)",
          });
        }
      });
    }

    // XP Orbs Light
    if (window.xpOrbs) {
      window.xpOrbs.forEach((orb) => {
        if (!orb.isHomingScreenSpace) {
          if (
            orb.worldX >= minCamX &&
            orb.worldX <= maxCamX &&
            orb.worldY >= minCamY &&
            orb.worldY <= maxCamY
          ) {
            lights.push({
              x: orb.worldX,
              y: orb.worldY,
              r: 35,
              innerColor: "rgba(230, 200, 255, 0.85)",
              outerColor: "rgba(168, 85, 247, 0.40)",
            });
          }
        }
      });
    }

    // Additive Light Blend Pass in World Coordinates
    lightingCtx.globalCompositeOperation = "lighter";
    lights.forEach((light) => {
      let { x, y, r, innerColor, outerColor, isPlayerLight } = light;
      let safeR = Math.max(0.1, r);
      let grad = lightingCtx.createRadialGradient(x, y, 0, x, y, safeR);

      if (isPlayerLight && hasShroudedSight) {
        // High-contrast, multi-stop radial gradient for Shrouded Sight: bright center, progressive transition
        grad.addColorStop(0, "rgba(255, 255, 250, 1.0)"); // White-hot center core
        grad.addColorStop(0.18, "rgba(255, 240, 195, 0.98)"); // Highly illuminated center ring
        grad.addColorStop(0.45, "rgba(225, 155, 75, 0.65)"); // Smooth golden mid-glow
        grad.addColorStop(0.75, "rgba(145, 80, 25, 0.22)"); // Soft twilight buffer
        grad.addColorStop(1.0, "rgba(0, 0, 0, 0)"); // Falloff edge
      } else {
        grad.addColorStop(0, innerColor);
        grad.addColorStop(0.4, outerColor);
        grad.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      }

      lightingCtx.fillStyle = grad;
      lightingCtx.beginPath();
      lightingCtx.arc(x, y, r, 0, Math.PI * 2);
      lightingCtx.fill();
    });

    lightingCtx.restore();

    // 4. Multiplicative Overlay Pass on Main Canvas in 1:1 Screen Space
    mainCtx.save();
    mainCtx.globalCompositeOperation = "multiply";
    mainCtx.drawImage(lightingCanvas, 0, 0);
    mainCtx.restore();
  }
