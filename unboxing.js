import {
  setCurrentGameState,
  setGamePaused,
} from "./runtime_state.js?v=1.002";
import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";

  export const openTactileSackCrateAnimation = function (name, newItem, elixirs) {
    setGamePaused(true);
    let overlay = document.createElement("div");
    overlay.id = "tactile-opening-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(4, 3, 9, 0.94)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "45000";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.fontFamily = "monospace";
    overlay.style.color = "#f1f5f9";
    overlay.style.boxSizing = "border-box";
    overlay.style.padding = "20px";
    document.body.appendChild(overlay);

    let isCrate =
      name.toLowerCase().includes("crate") ||
      name.toLowerCase().includes("chest");
    let color = window.getTierColor(newItem.statsRolled);
    let stars = newItem.statsRolled;

    let style = document.createElement("style");
    style.innerHTML = `
        .tactile-anim-wrapper {
          position: relative;
          width: 300px;
          height: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .tactile-runic-circle {
          position: absolute;
          width: 260px;
          height: 260px;
          border: 2px dashed rgba(212, 175, 55, 0.25);
          border-radius: 50%;
          animation: runicSpin 15s linear infinite;
        }
        .unboxing-vessel-container {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 180px;
          cursor: pointer;
        }
        .vessel-shake {
          animation: crateViolentShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .crate-lid-fly {
          animation: lidFly 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .sack-string-untie {
          animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .sack-neck-open {
          animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
        }
        .portal-blast-active {
          position: absolute;
          width: 10px;
          height: 10px;
          background: radial-gradient(circle, #fff 0%, ${color} 60%, transparent 100%);
          border-radius: 50%;
          opacity: 0;
          transform: scale(0);
          animation: portalErupt 0.6s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
        }
        .unboxed-card-showcase {
          opacity: 0;
          transform: scale(0.85);
          animation: itemShow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.6s;
        }
        @keyframes runicSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crateViolentShake {
          0% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.1) rotate(-15deg); }
          30% { transform: scale(1.1) rotate(15deg); }
          45% { transform: scale(1.1) rotate(-15deg); }
          60% { transform: scale(1.1) rotate(12deg); }
          75% { transform: scale(1.05) rotate(-6deg); }
          90% { transform: scale(1.02) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes lidFly {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-140px) rotate(180deg) scale(0.5); opacity: 0; }
        }
        @keyframes stringUntie {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(18px) scale(0.3); opacity: 0; }
        }
        @keyframes neckOpen {
          0% { transform: scaleX(1) scaleY(1); }
          100% { transform: scaleX(1.4) scaleY(0.6) translateY(3px); }
        }
        @keyframes portalErupt {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(25); }
        }
        @keyframes itemShow {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `;
    document.head.appendChild(style);

    let vesselSvg = "";
    if (isCrate) {
      vesselSvg = `
          <svg class="crate-svg vessel-shake" width="140" height="140" viewBox="0 0 64 64" style="overflow: visible !important;">
            <ellipse cx="32" cy="58" rx="24" ry="4" fill="rgba(0,0,0,0.55)" />
            <rect x="10" y="24" width="44" height="32" rx="4" fill="#a0522d" stroke="#000" stroke-width="2.5" />
            <line x1="21" y1="24" x2="21" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="32" y1="24" x2="32" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="43" y1="24" x2="43" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="12" y1="26" x2="52" y2="54" stroke="#3d1d0b" stroke-width="3" />
            <rect x="10" y="24" width="8" height="8" fill="#ffd700" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="24" width="8" height="8" fill="#ffd700" stroke="#000" stroke-width="1.2" />
            <rect x="10" y="48" width="8" height="8" fill="#ffd700" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="48" width="8" height="8" fill="#ffd700" stroke="#000" stroke-width="1.2" />
            <rect x="28" y="28" width="8" height="11" rx="1.5" fill="#ffd700" stroke="#000" stroke-width="1.5" />
            <circle cx="32" cy="33" r="1.5" fill="#111" />
            <rect id="crate-lid" x="8" y="16" width="48" height="8" rx="1.5" fill="#a0522d" stroke="#000" stroke-width="2.5" style="transform-origin: 32px 20px;" />
          </svg>
        `;
    } else {
      vesselSvg = `
          <svg class="sack-svg vessel-shake" width="130" height="130" viewBox="0 0 64 64" style="overflow: visible !important;">
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />
            <path id="sack-neck" d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="#a05a2c" stroke="#000" stroke-width="1.8" style="transform-origin: 32px 28px;" />
            <path id="sack-neck-r" d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="#a05a2c" stroke="#000" stroke-width="1.8" style="transform-origin: 32px 28px;" />
            <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="#a05a2c" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />
            <g id="sack-string" style="transform-origin: 32px 28px;">
              <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="#ffd700" stroke-width="3.5" stroke-linecap="round" />
              <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
            </g>
          </svg>
        `;
    }

    overlay.innerHTML = `
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
          <div class="tactile-anim-wrapper">
            <div class="tactile-runic-circle"></div>
            <div id="portal-blast" class="portal-blast-active" style="display: none;"></div>
            <div class="unboxing-vessel-container" id="unboxing-vessel-container">
              ${vesselSvg}
            </div>
          </div>
          <div style="font-size: 14px; font-weight: 900; color:#ffd700; letter-spacing: 3px; text-shadow: 0 0 8px rgba(241,196,15,0.4); text-transform: uppercase;">✦ UNBOXING ${name.toUpperCase()}... ✦</div>
        </div>
      `;

    setTimeout(() => {
      let lid = document.getElementById("crate-lid");
      let str = document.getElementById("sack-string");
      let neckL = document.getElementById("sack-neck");
      let neckR = document.getElementById("sack-neck-r");
      let blast = document.getElementById("portal-blast");

      if (lid) lid.classList.add("crate-lid-fly");
      if (str) str.classList.add("sack-string-untie");
      if (neckL) neckL.classList.add("sack-neck-open");
      if (neckR) neckR.classList.add("sack-neck-open");

      if (blast) blast.style.display = "block";

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }

      if (window.particles && window.ParticlePool) {
        let colors = isCrate
          ? ["#a0522d", "#8b4513", "#ffd700"]
          : ["#a05a2c", "#7d471b", "#00f0ff"];
        for (let i = 0; i < 24; i++) {
          let angle = Math.random() * Math.PI * 2;
          let speed = window.randFloat(2, 6);
          let pt = window.ParticlePool.get(
            overlay.offsetWidth / 2,
            overlay.offsetHeight / 2 - 40,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - window.randFloat(1, 3),
            window.randFloat(1.5, 4),
            colors[Math.floor(Math.random() * colors.length)],
            1,
            window.randInt(20, 40),
          );
          window.particles.push(pt);
        }
      }

      setTimeout(() => {
        let vesselContainer = document.getElementById(
          "unboxing-vessel-container",
        );
        if (vesselContainer) vesselContainer.style.display = "none";

        let elixirsHtml = elixirs
          .map((e) => {
            let eData = window.useDex[e] || {
              color: "#2ecc71",
              desc: "Elixir",
            };
            return `
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid ${eData.color}; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 9.5px; text-align: left; width: 100%; box-sizing: border-box; margin-top: 4px;">
                <div style="flex-shrink: 0;">${window.getUseIconHtml ? window.getUseIconHtml(e, 24) : ""}</div>
                <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                  <span style="color:${eData.color}; font-weight:bold;">✦ Gained: ${e}</span>
                  <span style="color:#94a3b8; font-size:8px;">${eData.desc}</span>
                </div>
              </div>
            `;
          })
          .join("");

        overlay.innerHTML = `
            <div class="unboxed-card-showcase" style="background:#15121b; border:3px solid ${color}; border-radius:12px; width:95%; max-width:400px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:20px; box-sizing:border-box;">
              <h2 style="margin:0 0 10px 0; color:${color}; letter-spacing:2px; text-transform:uppercase; font-size:18px;">✦ LOOT SECURED! ✦</h2>
              <div style="height:2px; background:linear-gradient(90deg, transparent, ${color}, transparent); margin-bottom:15px;"></div>
              <div style="text-align:center; margin-bottom:12px;">${window.getEquipIconHtml(newItem, 48)}</div>
              <h3 style="color:${color}; font-size:14px; margin:0 0 4px 0;">${newItem.name}</h3>
              <span style="font-size:10px; color:#aaa; font-family:monospace; display:block; margin-bottom:12px;">Quality: ${stars}★ ${window.getTierName(stars)}</span>

              <div style="background:#090610; border:1px solid #333; border-radius:6px; padding:12px; text-align:left; margin-bottom:15px; box-sizing:border-box;">
                <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">[ EARNED PAYLOAD ]</strong>
                <span style="color:#ffffff; display:block; font-size:10.5px; font-weight:bold; margin-bottom:6px;">• ${newItem.name} (Lv. ${newItem.stageLevel || 1})</span>
                ${elixirsHtml}
              </div>

              <button onclick="document.getElementById('tactile-opening-overlay').remove(); window.isGamePaused=false; window.updateUI();" style="background:${color}; color:${stars === 4 || stars === 1 ? "#fff" : "#111"}; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 0 10px ${color}55;">Store in Satchel</button>
            </div>
          `;
      }, 600);
    }, 800);
  };

  // --- STAGE 1: BOOSTER PACK VIEW ---
  export const openMonsterCardSackAnimation = function (rolledCards) {
    setGamePaused(true);

    // Create the modal overlay
    let overlay = document.createElement("div");
    overlay.id = "card-opening-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(4, 3, 9, 0.96)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "45000";
    overlay.style.backdropFilter = "blur(12px)";
    overlay.style.fontFamily = "monospace";
    overlay.style.color = "#f1f5f9";
    overlay.style.boxSizing = "border-box";
    overlay.style.padding = "20px";
    overlay.style.userSelect = "none";
    overlay.style.webkitUserSelect = "none";
    document.body.appendChild(overlay);

    // Card Level Projections Formula aligned perfectly with Bestiary Ranks
    window.calculateCardLevelInfo = function (totalOwned) {
      let thresholds = window.CARD_UPGRADE_THRESHOLDS || [
        1, 25, 100, 300, 750, 1500, 2500,
      ];
      let rankNames = [
        "Bronze",
        "Iron",
        "Silver",
        "Gold",
        "Platinum",
        "Diamond",
        "Mythic",
      ];

      let tier = window.getCardTier(totalOwned);
      if (tier < 0) {
        return {
          tier: -1,
          level: "Locked",
          nextLevelReq: thresholds[0],
          prevLevelReq: 0,
          currentProgress: totalOwned,
          neededForNext: thresholds[0],
          percent: 0,
          rankName: "Locked",
        };
      }

      let nextReq = thresholds[tier + 1];
      let prevReq = thresholds[tier];

      if (nextReq === undefined) {
        return {
          tier: tier,
          level: rankNames[tier],
          nextLevelReq: prevReq,
          prevLevelReq: prevReq,
          currentProgress: totalOwned,
          neededForNext: prevReq,
          percent: 100,
          rankName: rankNames[tier],
        };
      }

      let currentProgress = totalOwned;
      let neededForNext = nextReq;
      let percent = Math.min(100, (currentProgress / neededForNext) * 100);

      return {
        tier: tier,
        level: rankNames[tier],
        nextLevelReq: nextReq,
        prevLevelReq: prevReq,
        currentProgress: currentProgress,
        neededForNext: neededForNext,
        percent: percent,
        rankName: rankNames[tier],
      };
    };

    // Aggregating duplicates pulled in this pack
    let uniquePulls = [];
    rolledCards.forEach((key) => {
      let match = uniquePulls.find((p) => p.key === key);
      if (match) {
        match.qty++;
      } else {
        uniquePulls.push({ key: key, qty: 1 });
      }
    });

    // Expand Dynamic CSS styles block to support fanning display, flips, progress transitions, and badges
    let style = document.createElement("style");
    style.id = "booster-stage1-styles";
    style.innerHTML = `
                .booster-pack-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 15px;
                  animation: packFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .booster-pack-view {
                  position: relative;
                  width: 240px;
                  height: 350px;
                  perspective: 1000px;
                  transition: transform 0.6s ease-in-out, opacity 0.6s ease-in-out;
                }
                .booster-pack-view.ripped {
                  animation: packRippedShatter 0.6s ease-out forwards;
                }
                @keyframes packRippedShatter {
                  0% { transform: scale(1) rotate(0deg); opacity: 1; }
                  20% { transform: scale(1.05) rotate(-5deg); }
                  40% { transform: scale(1.1) rotate(5deg); }
                  100% { transform: scale(1.2) rotate(0deg); opacity: 0; }
                }
                .booster-pack-body {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  width: 100%;
                  height: 312px;
                  background: linear-gradient(135deg, #181128 0%, #0d0918 100%);
                  border: 3px solid #d4af37;
                  border-radius: 0 0 10px 10px;
                  box-shadow: 0 15px 45px rgba(0,0,0,0.9), inset 0 0 20px rgba(212,175,55,0.12);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: space-between;
                  padding: 24px 16px;
                  box-sizing: border-box;
                  transition: transform 0.2s ease-out;
                }
                .booster-pack-view.ripped .booster-pack-body {
                  animation: bodySlideDown 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
                }
                @keyframes bodySlideDown {
                  0% { transform: translateY(0); opacity: 1; }
                  100% { transform: translateY(120px); opacity: 0; }
                }
                .booster-pack-top {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 44px;
                  background: linear-gradient(180deg, #d4af37 0%, #311042 100%);
                  border: 3px solid #d4af37;
                  border-bottom: 2.5px solid #000000;
                  border-radius: 10px 10px 0 0;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                  transition: filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
                  z-index: 15;
                }
                .booster-pack-view.ripped .booster-pack-top {
                  animation: topFlyOff 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
                }
                @keyframes topFlyOff {
                  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                  100% { transform: translateY(-180px) rotate(120deg) scale(0.4); opacity: 0; }
                }
                .booster-pack-top:hover {
                  filter: brightness(1.18);
                  transform: translateY(-2px);
                  box-shadow: 0 6px 14px rgba(212,175,55,0.4);
                }
                .booster-pack-top:active {
                  transform: translateY(0);
                }
                .booster-pack-top-label {
                  color: #ffffff;
                  font-size: 9px;
                  font-weight: 900;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                  text-shadow: 0 1px 3px #000;
                  animation: pulseText 1.5s infinite ease-in-out;
                }
                @keyframes packFadeIn {
                  0% { opacity: 0; transform: scale(0.9) translateY(12px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes pulseText {
                  0%, 100% { opacity: 0.6; }
                  50% { opacity: 1; }
                }

                /* --- STAGE 3 CARDS FANNING OUT AND FLIPPING --- */
                .fanned-deck-container {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 12px;
                  justify-content: center;
                  align-items: center;
                  width: 100%;
                  max-width: 900px;
                  margin-top: 10px;
                  animation: cardsRevealDelay 0.4s ease-out forwards;
                }
                @keyframes cardsRevealDelay {
                  0% { opacity: 0; transform: scale(0.9); }
                  100% { opacity: 1; transform: scale(1); }
                }
                .unboxing-card-container {
                  width: 140px;
                  height: 220px;
                  perspective: 1000px;
                  position: relative;
                }
                .unboxing-card-inner {
                  position: relative;
                  width: 100%;
                  height: 100%;
                  text-align: center;
                  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                  transform-style: preserve-3d;
                }
                .unboxing-card-container.flipped .unboxing-card-inner {
                  transform: rotateY(180deg);
                }
                .unboxing-card-front, .unboxing-card-back {
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  -webkit-backface-visibility: hidden;
                  backface-visibility: hidden;
                  border-radius: 8px;
                  box-shadow: 0 6px 20px rgba(0,0,0,0.85);
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  box-sizing: border-box;
                  padding: 8px;
                }
                .unboxing-card-back {
                  background: linear-gradient(135deg, #181128 0%, #07050d 100%);
                  border: 2px solid #8c6d3b;
                  color: #ffd700;
                  justify-content: center;
                }
                .card-back-pattern {
                  width: 100%;
                  height: 100%;
                  border: 1.5px dashed rgba(212, 175, 55, 0.3);
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 80%);
                }
                .card-back-sigil {
                  font-size: 36px;
                  text-shadow: 0 0 10px rgba(212,175,55,0.4);
                  animation: pulseText 2s infinite ease-in-out;
                }
                .unboxing-card-front {
                  background: linear-gradient(180deg, #1b162b 0%, #0c0816 100%);
                  border: 2.5px solid #475569;
                  transform: rotateY(180deg);
                  justify-content: space-between;
                }
                .card-set-banner {
                  width: 100%;
                  font-family: monospace;
                  font-size: 7.5px;
                  font-weight: 900;
                  color: #ffffff;
                  padding: 2px 4px;
                  border-radius: 3px;
                  text-align: center;
                  text-transform: uppercase;
                  text-shadow: 0 1px 2px #000;
                }
                .card-image-box {
                  width: 64px;
                  height: 64px;
                  background: rgba(0, 0, 0, 0.4);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  border-radius: 6px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 4px 0;
                  box-shadow: inset 0 2px 6px rgba(0,0,0,0.8);
                }
                .card-name {
                  font-size: 10.5px;
                  font-weight: 900;
                  color: #ffffff;
                  text-shadow: 0 1px 2px #000;
                  margin-bottom: 2px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  width: 100%;
                }
                .card-level-display {
                  font-size: 8px;
                  font-family: monospace;
                  color: #94a3b8;
                }
                .card-level-num {
                  color: #df9ffb;
                  font-weight: bold;
                }
                .card-progress-bar-container {
                  width: 100%;
                  height: 12px;
                  background: #090c10;
                  border: 1px solid #1e293b;
                  border-radius: 4px;
                  overflow: hidden;
                  position: relative;
                  margin-top: 4px;
                }
                .card-progress-bar-fill {
                  height: 100%;
                  background: linear-gradient(90deg, #a855f7 0%, #00ffff 100%);
                  width: 0%;
                }
                .card-progress-text {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-family: monospace;
                  font-size: 7.5px;
                  font-weight: bold;
                  color: #ffffff;
                  text-shadow: 0 1px 1px #000;
                }
                .card-qty-badge {
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: linear-gradient(135deg, #ffd700 0%, #b45309 100%);
                  color: #000;
                  border: 1.5px solid #ffffff;
                  border-radius: 10px;
                  font-family: monospace;
                  font-size: 8.5px;
                  font-weight: 900;
                  padding: 1.5px 5px;
                  box-shadow: 0 3px 6px rgba(0,0,0,0.6);
                  animation: toastBump 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
                  animation-delay: 0.2s;
                  z-index: 10;
                }
                .card-levelup-flash {
                  position: absolute;
                  bottom: 24px;
                  background: rgba(46, 204, 113, 0.95);
                  color: #ffffff;
                  font-family: monospace;
                  font-weight: 900;
                  font-size: 8px;
                  padding: 2px 8px;
                  border-radius: 3px;
                  border: 1px solid #ffffff;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                  z-index: 10;
                  letter-spacing: 0.5px;
                }
                @keyframes lvlUpPulse {
                  0%, 100% { transform: scale(1) translateY(0); filter: brightness(1); }
                  50% { transform: scale(1.08) translateY(-2px); filter: brightness(1.2); }
                }
              `;
    document.head.appendChild(style);

    // Build the booster pack DOM layout
    overlay.innerHTML = `
                <div class="booster-pack-container" id="booster-pack-container">
                  <div class="booster-pack-view" id="booster-pack-view">
                    <div class="booster-pack-top" id="booster-pack-top" onclick="window.initiateTearSequence(this)">
                      <span class="booster-pack-top-label">✦ TEAR OPEN ✦</span>
                    </div>
                    <div class="booster-pack-body">
                      <div style="font-size:10px; color:#d4af37; font-weight:900; letter-spacing:1px; text-transform:uppercase; font-family:monospace;">Guild Altar</div>
                      <div style="width:52px; height:52px; border:2px dashed #d4af37; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 20px 0;">
                        <span style="color:#d4af37; font-size:22px;">✦</span>
                      </div>
                      <div style="font-size:13px; font-weight:900; color:#df9ffb; letter-spacing:2px; text-transform:uppercase; text-shadow:0 0 8px rgba(168,85,247,0.4);">Monster Pack</div>
                      <div style="font-size:8px; color:#64748b; font-family:monospace; margin-top:10px;">Contains 5 Sealed Bestiary Cards</div>
                    </div>
                  </div>
                  <div style="font-size:10px; color:#64748b; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:5px;">[ BOOSTER ALIGNED ]</div>
                </div>
              `;

    // Handler to execute Stage 2 (Tear Open and automatic Stage 3 transition)
    window.initiateTearSequence = function (topElement) {
      let view = document.getElementById("booster-pack-view");
      if (!view || view.classList.contains("ripped")) return;
      view.classList.add("ripped");

      // Play rip sound
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("swing");
      }

      // Spawn custom starburst particles at the tear seam
      if (window.particles && window.ParticlePool) {
        let rect = view.getBoundingClientRect();
        let overlayRect = overlay.getBoundingClientRect();

        let ripX = rect.left - overlayRect.left + rect.width / 2;
        let ripY = rect.top - overlayRect.top + 44;

        let colors = ["#ffd700", "#ff007f", "#a855f7", "#00ffff"];
        for (let i = 0; i < 40; i++) {
          let angle = Math.random() * Math.PI * 2;
          let speed = window.randFloat(3.0, 7.5);
          let pt = window.ParticlePool.get(
            ripX,
            ripY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - window.randFloat(1.5, 4.0),
            window.randFloat(2.0, 4.5),
            colors[Math.floor(Math.random() * colors.length)],
            1.0,
            window.randInt(25, 50),
          );
          pt.style = "polygon";
          pt.angle = Math.random() * Math.PI * 2;
          pt.spinSpeed = window.randFloat(-0.25, 0.25);
          pt.scaleDecay = 0.015;
          window.particles.push(pt);
        }
      }

      // Once rip completes, immediately launch Stage 3
      setTimeout(() => {
        let packContainer = document.getElementById("booster-pack-container");
        if (packContainer) packContainer.remove();

        window.beginDeckFanningReveal();
      }, 550);
    };

    // Progress bar transitions and level up logic builder
    window.animateCardProgress = function (cardEl, prevOwned, totalOwned) {
      let barFill = cardEl.querySelector(".card-progress-bar-fill");
      let progressText = cardEl.querySelector(".card-progress-text");
      let lvlNum = cardEl.querySelector(".card-level-num");
      let lvlUpFlash = cardEl.querySelector(".card-levelup-flash");

      let prevInfo = window.calculateCardLevelInfo(prevOwned);
      let newInfo = window.calculateCardLevelInfo(totalOwned);

      // Intitialize at previous count
      barFill.style.width = prevInfo.percent + "%";

      setTimeout(() => {
        barFill.style.transition = "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)";

        if (newInfo.tier > prevInfo.tier) {
          // Animate to full first
          barFill.style.width = "100%";

          setTimeout(() => {
            // Level up triggers
            if (lvlNum) lvlNum.innerText = newInfo.level + " Rank";
            if (lvlUpFlash) {
              lvlUpFlash.style.display = "block";
              lvlUpFlash.style.animation = "lvlUpPulse 1.2s ease-out infinite";
            }

            // Instant reset back to 0 width
            barFill.style.transition = "none";
            barFill.style.width = "0%";

            if (progressText) {
              progressText.innerText =
                newInfo.percent === 100
                  ? "MAX"
                  : `${newInfo.currentProgress} / ${newInfo.neededForNext}`;
            }

            // Force layout reflow
            void barFill.offsetWidth;

            // Animate from 0 to new percentage progress
            barFill.style.transition =
              "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
            barFill.style.width = newInfo.percent + "%";

            // Level up sound
            if (
              window.SoundManager &&
              typeof window.SoundManager.play === "function"
            ) {
              window.SoundManager.play("spell");
            }
          }, 850);
        } else {
          // Standard progress update
          barFill.style.width = newInfo.percent + "%";
          if (progressText) {
            progressText.innerText =
              newInfo.percent === 100
                ? "MAX"
                : `${newInfo.currentProgress} / ${newInfo.neededForNext}`;
          }
        }
      }, 250);
    };

    // Fanning Out Reveal Deck Generator
    window.beginDeckFanningReveal = function () {
      let deckMarkup = uniquePulls
        .map((pull) => {
          let key = pull.key;
          let qty = pull.qty;

          let cardData = window.MONSTER_CARDS_DATA[key] || {
            name: key.charAt(0).toUpperCase() + key.slice(1).replace("_", " "),
            set: "Whispering Woods",
          };

          const setColors = {
            "Whispering Woods": "#2ecc71",
            "Mountain Peaks": "#3498db",
            "Inferno Depths": "#e74c3c",
            "Fungal Swamp": "#1abc9c",
            "Void Singularity": "#9b59b6",
            "Cosmic Wardens": "#f1c40f",
          };
          let setCol = setColors[cardData.set] || "#ffd700";

          let totalOwned = window.playerStats.monsterCards[key] || 0;
          let prevCount = Math.max(0, totalOwned - qty);
          let prevInfo = window.calculateCardLevelInfo(prevCount);

          return `
                    <div class="unboxing-card-container" data-card-key="${key}" data-prev-owned="${prevCount}" data-total-owned="${totalOwned}" data-set="${cardData.set}">
                      <div class="unboxing-card-inner">
                        <!-- CARD BACK -->
                        <div class="unboxing-card-back">
                          <div class="card-back-pattern">
                            <div class="card-back-sigil">✦</div>
                          </div>
                        </div>
                        <!-- CARD FRONT -->
                        <div class="unboxing-card-front" style="border-color: ${setCol};">
                          <div class="card-set-banner" style="background-color: ${setCol};">${cardData.set.toUpperCase()}</div>
                          <div class="card-image-box">
                            <canvas class="unboxing-card-canvas" width="64" height="64" data-visual-type="${key}"></canvas>
                          </div>
                          <div class="card-name">${cardData.name}</div>
                                                    <div class="card-level-display"><span class="card-level-num">${prevInfo.level} Rank</span></div>
                                                    <div class="card-progress-bar-container">
                            <div class="card-progress-bar-fill"></div>
                            <div class="card-progress-text"></div>
                          </div>
                          ${qty > 1 ? `<div class="card-qty-badge">x${qty}</div>` : ""}
                          <div class="card-levelup-flash" style="display: none;">LEVEL UP!</div>
                        </div>
                      </div>
                    </div>
                  `;
        })
        .join("");

      overlay.innerHTML = `
                  <div style="text-align: center; color: white;">
                    <div class="fanned-deck-container" id="fanned-deck-container">
                      ${deckMarkup}
                    </div>
                    <button id="collect-haul-btn" class="action-btn" style="display: none; width: 220px; margin: 15px auto 0 auto; background: linear-gradient(180deg, #10b981 0%, #047857 100%); border-color: #34d399;" onclick="window.collectUnboxedHaul()">COLLECT HAUL</button>
                  </div>
                `;

      // Start local unboxing cards graphics rendering loops
      window.startUnboxingCardAnimLoop();

      // Staggered sequential automatic reveal
      let cardContainers = document.querySelectorAll(
        ".unboxing-card-container",
      );
      cardContainers.forEach((cardEl, index) => {
        setTimeout(() => {
          cardEl.classList.add("flipped");

          let prev = parseInt(cardEl.dataset.prevOwned, 10);
          let total = parseInt(cardEl.dataset.totalOwned, 10);

          // Play card flip sound
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("swing");
          }

          // Spawn colored splash particles around card
          let rect = cardEl.getBoundingClientRect();
          let overlayRect = overlay.getBoundingClientRect();
          let cardX = rect.left - overlayRect.left + rect.width / 2;
          let cardY = rect.top - overlayRect.top + rect.height / 2;

          let setColors = {
            "Whispering Woods": "#2ecc71",
            "Mountain Peaks": "#3498db",
            "Inferno Depths": "#e74c3c",
            "Fungal Swamp": "#1abc9c",
            "Void Singularity": "#9b59b6",
            "Cosmic Wardens": "#f1c40f",
          };
          let setCol = setColors[cardEl.dataset.set] || "#ffd700";

          if (window.particles && window.ParticlePool) {
            for (let pIdx = 0; pIdx < 14; pIdx++) {
              let angle = Math.random() * Math.PI * 2;
              let speed = window.randFloat(1.5, 3.8);
              let pt = window.ParticlePool.get(
                cardX,
                cardY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                window.randFloat(1.5, 3.0),
                setCol,
                0.85,
                window.randInt(15, 30),
              );
              window.particles.push(pt);
            }
          }

          // Trigger progress bar animations
          window.animateCardProgress(cardEl, prev, total);

          // Once the final card finishes revealing, render the "Collect Haul" button
          if (index === cardContainers.length - 1) {
            setTimeout(() => {
              let collectBtn = document.getElementById("collect-haul-btn");
              if (collectBtn) {
                collectBtn.style.display = "block";
                collectBtn.style.animation =
                  "toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
              }
            }, 900);
          }
        }, index * 600); // 600ms stagger
      });
    };

    // Unboxing Graphics Loops
    window.unboxingCardAnimFrameId = null;
    window.startUnboxingCardAnimLoop = function () {
      if (window.unboxingCardAnimFrameId)
        cancelAnimationFrame(window.unboxingCardAnimFrameId);

      function renderStep() {
        let overlay = document.getElementById("card-opening-overlay");
        if (!overlay) {
          window.unboxingCardAnimFrameId = null;
          return;
        }

        let canvases = document.querySelectorAll(".unboxing-card-canvas");
        let time = Date.now();

        canvases.forEach((canvas) => {
          let container = canvas.closest(".unboxing-card-container");
          if (!container || !container.classList.contains("flipped")) return;

          let ctx = canvas.getContext("2d");
          if (!ctx) return;

          let type = canvas.dataset.visualType;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          let mobTypeVal = "mob";
          let visualTierVal = 0;

          if (type === "aegis_goliath") {
            mobTypeVal = "aegis_goliath";
            visualTierVal = 1;
          } else if (type === "chronos_arbitrator") {
            mobTypeVal = "chronos_arbitrator";
            visualTierVal = 5;
          } else if (type === "nexus_overseer") {
            mobTypeVal = "nexus_overseer";
            visualTierVal = 6;
          } else if (type === "hooktail") {
            mobTypeVal = "prestige_boss";
            visualTierVal = 7;
          } else if (type === "arachnid_treant") {
            mobTypeVal = "dungeon_boss";
            visualTierVal = 0;
          } else if (type === "overlord_iron_vault") {
            mobTypeVal = "dungeon_boss";
            visualTierVal = 2;
          } else if (type === "corrosive_abomination") {
            mobTypeVal = "dungeon_boss";
            visualTierVal = 3;
          } else if (type === "void_overseer") {
            mobTypeVal = "dungeon_boss";
            visualTierVal = 4;
          } else if (type === "gilded_vault_keeper") {
            mobTypeVal = "dungeon_boss";
            visualTierVal = 1;
          }

          let mockMob = {
            visualType: type,
            type: mobTypeVal,
            visualTier: visualTierVal,
            x: canvas.width / 2 - 16,
            y: canvas.height / 2 - 12,
            w: 32,
            h: 32,
            facing: 1,
            walkTimer: time / 150,
            hopTimer: Math.floor(time / 50) % 30,
            flashTimer: 0,
            buffStacks: { haste: 0, def: 0, atk: 0 },
            buffTimers: { haste: 0, def: 0, atk: 0 },
          };

          if (typeof window.drawSingleMob === "function") {
            window.drawSingleMob(ctx, mockMob);
          }
        });

        window.unboxingCardAnimFrameId = requestAnimationFrame(renderStep);
      }
      window.unboxingCardAnimFrameId = requestAnimationFrame(renderStep);
    };

    window.stopUnboxingCardAnimLoop = function () {
      if (window.unboxingCardAnimFrameId) {
        cancelAnimationFrame(window.unboxingCardAnimFrameId);
        window.unboxingCardAnimFrameId = null;
      }
    };

    // Emergency Retreat Strategic Extraction
    window.requestAbandonRun = function () {
      if (window.currentGameState !== window.GAME_STATES.DUNGEON) return;

      let p = window.player;
      let stats = window.playerStats;
      if (!p || !stats) return;

      let activeChallenge = stats.activeSpecialChallenge;
      let runGold = stats.runGold || 0;
      let bag = p.bag || [];
      let bagKeepCount = activeChallenge ? 0 : Math.floor(bag.length * 0.5);

      let msg = "";
      if (activeChallenge) {
        msg =
          "This active Special Challenge is highly unstable! If you retreat now, you will keep all equipped gear, but forfeit ALL carried bag loot and run gold. Confirm retreat?";
      } else {
        msg =
          'Are you sure you want to retreat to the Hub?<br><br>• You keep <strong>100%</strong> of equipped items (uninsured or not).<br>• You keep <strong style="color:#ffd700;">50%</strong> of your carried bag (randomly selected; the rest is lost).<br>• You lose <strong style="color:#ef4444;">50%</strong> of your run gold/souls from this floor.';
      }

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "INITIATE EXTRACTION RETREAT",
          msg,
          "RETREAT TO HUB",
          "STAY AND FIGHT",
          "#e74c3c",
          function () {
            window.executeRetreatToHub(bagKeepCount);
          },
        );
      } else {
        if (confirm(msg.replace(/<br>/g, "\\n").replace(/<[^>]*>/g, ""))) {
          window.executeRetreatToHub(bagKeepCount);
        }
      }
    };

    window.executeRetreatToHub = function (bagKeepCount) {
      let p = window.player;
      let stats = window.playerStats;
      if (!p || !stats) return;

      // 1. Process Gold/Souls Retention (Keep 50%)
      let runGold = stats.runGold || 0;
      let retainedGold = Math.floor(runGold * 0.5);
      stats.coins = BigNum.from(stats.coins || 0).add(retainedGold);

      // 2. Process Bag Loot Retention
      let bag = p.bag || [];
      let retainedBag = [];
      if (bagKeepCount > 0 && bag.length > 0) {
        let shuffled = [...bag].sort(() => Math.random() - 0.5);
        retainedBag = shuffled.slice(0, bagKeepCount);
      }

      if (!window.inventory.EQUIP) window.inventory.EQUIP = [];
      retainedBag.forEach((item) => {
        window.inventory.EQUIP.push(item);
      });

      // 3. Clear run temporary states
      stats.runGold = 0;
      p.bag = [];
      p.depth = 1;
      window.calamitySpecterActive = false;
      window.floorTimeElapsed = 0;

      // Cleanly load the Hub
      setCurrentGameState(window.GAME_STATES.HUB);
      let map = getActiveDungeonMap();
      if (map) {
        map.generateHub();
      }

      if (typeof window.refillFlaskCharges === "function") {
        window.refillFlaskCharges(true);
      }

      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }

      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.saveGame === "function") window.saveGame();

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("death");
      }

      // Redirect to Summary Screen showing salvage list
      let summaryModal = document.getElementById("summary-modal");
      let summaryTitle = document.getElementById("summary-title");
      let summarySub = document.getElementById("summary-subtitle");
      let lootList = document.getElementById("summary-loot-list");

      if (summaryModal && summaryTitle && summarySub && lootList) {
        summaryTitle.innerText = "RETREAT SUCCESSFUL";
        summaryTitle.style.color = "#f1c40f";
        summarySub.innerText = `You retreated with equipped gear. Salvaged ${retainedBag.length} items & ${retainedGold} Gold.`;

        lootList.innerHTML = retainedBag
          .map((item) => {
            let col = window.getTierColor
              ? window.getTierColor(item.statsRolled)
              : "#ffd700";
            return `<div class="loot-item" style="color:${col}; font-family:monospace; margin-bottom:4px;">[SALVAGED] ${item.name}</div>`;
          })
          .join("");

        summaryModal.style.display = "flex";
      } else {
        window.loadHub();
      }
    };

    // Collection Exit Handler
    window.collectUnboxedHaul = function () {
      window.stopUnboxingCardAnimLoop();

      let styleEl = document.getElementById("booster-stage1-styles");
      if (styleEl) styleEl.remove();

      let overlay = document.getElementById("card-opening-overlay");
      if (overlay) overlay.remove();

      setGamePaused(false);
      if (typeof window.updateUI === "function") window.updateUI();
      if (typeof window.saveGame === "function") window.saveGame();
    };
  };
