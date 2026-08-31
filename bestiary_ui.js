  // --- BESTIARY ALBUM RENDERER & ANIMATION LOOP ---
  export function renderBestiaryAlbum() {
    let container = document.getElementById("bestiary-album-content");
    if (!container) {
      let sec = document.getElementById("profile-sec-album");
      if (sec) {
        sec.innerHTML = `<div id="bestiary-album-content" style="width:100%; height:100%; display:flex; flex-direction:column; box-sizing:border-box;"></div>`;
        container = document.getElementById("bestiary-album-content");
      }
    }
    if (!container) return;

    let db = window.MONSTER_CARDS_DATA || {};
    let owned = (window.playerStats && window.playerStats.monsterCards) || {};
    let dust = (window.playerStats && window.playerStats.astralDust) || 0;
    let claimedSets =
      (window.playerStats && window.playerStats.claimedBestiarySets) || {};

    let totalCards = Object.keys(db).length;
    let unlockedCardsCount = 0;

    // Calculate total combined bestiary passives
    let combinedPassives = {};

    Object.keys(db).forEach((key) => {
      let card = db[key];
      let count = owned[key] || 0;
      if (count > 0) {
        unlockedCardsCount++;
        let tier =
          typeof window.getCardTier === "function"
            ? window.getCardTier(count)
            : 0;
        let rank = Math.max(1, tier + 1);
        let statKey = card.statKey || card.bonusStat || card.stat || "maxHp";
        let baseVal =
          card.perRank || card.baseVal || card.val || card.bonusVal || 1;
        let totalStatVal = baseVal * rank;

        combinedPassives[statKey] =
          (combinedPassives[statKey] || 0) + totalStatVal;
      }
    });

    let passivesList = [];
    for (let sKey in combinedPassives) {
      let val = combinedPassives[sKey];
      let isPct =
        [
          "drop",
          "qly",
          "critChance",
          "critDamage",
          "block",
          "parry",
          "gold",
          "expPct",
        ].includes(sKey) ||
        (db[sKey] && db[sKey].isPct);

      let label = window.getStatLabel
        ? window.getStatLabel(sKey)
        : sKey.toUpperCase();
      let valStr = isPct
        ? `+${(val * 100).toFixed(1)}%`
        : `+${Math.round(val)}`;
      passivesList.push(`${label}: ${valStr}`);
    }

    let passivesSummaryStr =
      passivesList.length > 0
        ? passivesList.join(" • ")
        : "No active card bonuses yet.";

    let pctUnlocked =
      totalCards > 0 ? Math.round((unlockedCardsCount / totalCards) * 100) : 0;

    // Group cards by Set
    const SET_ORDER = [
      "Whispering Woods",
      "Mountain Peaks",
      "Inferno Depths",
      "Fungal Swamp",
      "Void Singularity",
      "Temporal Sanctorum",
      "Cyberspace Nexus",
      "Guardian Wardens",
      "Cosmic Overlords",
    ];

    const SET_COLORS = {
      "Whispering Woods": "#2ecc71",
      "Mountain Peaks": "#3498db",
      "Inferno Depths": "#e74c3c",
      "Fungal Swamp": "#1abc9c",
      "Void Singularity": "#9b59b6",
      "Temporal Sanctorum": "#e879f9",
      "Cyberspace Nexus": "#00ffff",
      "Guardian Wardens": "#f59e0b",
      "Cosmic Overlords": "#f1c40f",
    };

    let setGroups = {};
    SET_ORDER.forEach((setName) => {
      setGroups[setName] = [];
    });

    Object.keys(db).forEach((key) => {
      let card = db[key];
      let setName = card.set || "Whispering Woods";
      if (!setGroups[setName]) setGroups[setName] = [];
      setGroups[setName].push({ key: key, ...card });
    });

    let setsHtml = "";

    SET_ORDER.forEach((setName) => {
      let cards = setGroups[setName] || [];
      if (cards.length === 0) return;

      let setCol = SET_COLORS[setName] || "#ffd700";
      let setOwnedCount = cards.filter((c) => (owned[c.key] || 0) > 0).length;
      let isSetComplete = setOwnedCount === cards.length;
      let isClaimed = !!claimedSets[setName];

      let resonanceStatus = "";
      if (isClaimed) {
        resonanceStatus = `<span style="color:#2ecc71; font-weight:bold;">RESONANCE: CLAIMED (+2 Sacks, +50 Dust)</span>`;
      } else if (isSetComplete) {
        resonanceStatus = `<button class="action-btn-sm" style="background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#ffd700; color:#fff; font-weight:900;" onclick="event.stopPropagation(); window.claimBestiarySetReward('${setName}')">CLAIM SET BONUS</button>`;
      } else {
        resonanceStatus = `<span style="color:#64748b;">RESONANCE: INACTIVE (${setOwnedCount}/${cards.length})</span>`;
      }

      let cardsGridHtml = cards
        .map((card) => {
          let count = owned[card.key] || 0;
          let isUnlocked = count > 0;
          let tier = isUnlocked
            ? typeof window.getCardTier === "function"
              ? window.getCardTier(count)
              : 0
            : -1;
          let rank = isUnlocked ? Math.max(1, tier + 1) : 0;

          let rankNames = [
            "BRONZE RANK",
            "IRON RANK",
            "SILVER RANK",
            "GOLD RANK",
            "PLATINUM RANK",
            "DIAMOND RANK",
            "MYTHIC RANK",
          ];
          let rankLabel = isUnlocked
            ? rankNames[tier] || "MYTHIC RANK"
            : "LOCKED";

          let statKey = card.statKey || card.bonusStat || card.stat || "maxHp";
          let statName =
            card.statName ||
            card.statLabel ||
            (window.getStatLabel ? window.getStatLabel(statKey) : "Bonus");
          let baseVal =
            card.perRank || card.baseVal || card.val || card.bonusVal || 1;
          let isPct =
            card.isPct ||
            [
              "drop",
              "qly",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "gold",
              "expPct",
            ].includes(statKey);

          let bonusValText = "";
          if (isUnlocked) {
            let mult =
              (window.SET_CARD_MULTIPLIERS &&
                window.SET_CARD_MULTIPLIERS[card.set]) ||
              1.0;
            let totalVal =
              (typeof window.getCardValue === "function"
                ? window.getCardValue(baseVal, tier)
                : baseVal) * mult;
            let formattedVal = isPct
              ? `+${(totalVal * 100).toFixed(1)}%`
              : `+${Math.round(totalVal)}`;
            bonusValText = `<span style="color:#2ecc71; font-weight:bold;">${statName}: ${formattedVal}</span>`;
          } else {
            bonusValText = `<span style="color:#64748b;">${statName}: LOCKED</span>`;
          }

          let thresholds = window.CARD_UPGRADE_THRESHOLDS || [
            1, 25, 100, 300, 750, 1500, 2500,
          ];
          let nextReq = isUnlocked
            ? thresholds[tier + 1] || thresholds[thresholds.length - 1]
            : 1;
          let progressPct = isUnlocked
            ? Math.min(100, Math.round((count / nextReq) * 100))
            : 0;

          return `
              <div class="bestiary-card-item ${isUnlocked ? "unlocked-card" : "locked-card"}" style="border-color: ${isUnlocked ? setCol : "#334155"}; background: ${isUnlocked ? "rgba(18, 14, 28, 0.85)" : "rgba(8, 6, 14, 0.6)"};">
                <div style="font-size: 7.5px; font-weight: 900; color: ${isUnlocked ? setCol : "#64748b"}; font-family: monospace; text-transform: uppercase;">
                  ${rankLabel}
                </div>

                <div style="width: 64px; height: 64px; margin: 4px 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
                  <canvas class="bestiary-card-canvas" width="64" height="64" data-visual-type="${card.key}" data-unlocked="${isUnlocked}"></canvas>
                </div>

                <div class="bestiary-card-title" style="color: ${isUnlocked ? "#ffffff" : "#94a3b8"};">${card.name}</div>
                <div style="font-size: 8.5px; font-family: monospace; margin: 2px 0;">${bonusValText}</div>

                <div style="width: 100%; height: 4px; background: #06040a; border-radius: 2px; overflow: hidden; margin: 4px 0;">
                  <div style="width: ${progressPct}%; height: 100%; background: ${setCol}; transition: width 0.3s ease;"></div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; font-family: monospace; font-size: 8px; color: #94a3b8;">
                  <span>${count} / ${nextReq}</span>
                  <span style="color:#64748b;">${card.hint || ""}</span>
                </div>
              </div>
            `;
        })
        .join("");

      setsHtml += `
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid ${setCol}; padding-bottom: 4px; margin-bottom: 8px; font-family: monospace; font-size: 10.5px;">
              <strong style="color: ${setCol}; text-transform: uppercase; letter-spacing: 1px;">${setName.toUpperCase()} SET</strong>
              <div style="font-size: 9px;">${resonanceStatus}</div>
            </div>
            <div class="bestiary-grid">
              ${cardsGridHtml}
            </div>
          </div>
        `;
    });

    container.innerHTML = `
        <div class="bestiary-wrapper" style="display:flex; flex-direction:column; gap:10px; width:100%; height:100%; box-sizing:border-box;">
          <!-- Top Summary Banner -->
          <div style="background: linear-gradient(180deg, #181226 0%, #0a0712 100%); border: 1.5px solid #d4af37; border-radius: 8px; padding: 10px 14px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.8);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 900; color: #ffd700; letter-spacing: 1px; text-transform: uppercase;">MONSTER CARD COLLECTION</span>
              <div style="display: flex; gap: 8px; align-items: center; font-family: monospace; font-size: 9.5px;">
                <span style="background: rgba(0,0,0,0.4); border: 1px solid #38bdf8; color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${unlockedCardsCount} / ${totalCards} Unlocked (${pctUnlocked}%)</span>
                <span style="background: rgba(0,0,0,0.4); border: 1px solid #a855f7; color: #df9ffb; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Dust: ${dust.toLocaleString()}</span>
              </div>
            </div>
            <div style="width: 100%; height: 6px; background: #080610; border-radius: 3px; overflow: hidden; border: 1px solid #334155; margin-bottom: 6px;">
              <div style="width: ${pctUnlocked}%; height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #ffd700 100%); transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 8.5px; font-family: monospace; color: #34d399; line-height: 1.35; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px; text-align: left;">
              <strong>COMBINED BESTIARY PASSIVES:</strong> ${passivesSummaryStr}
            </div>
          </div>

          <!-- Scrollable Cards Sets List -->
          <div style="flex: 1; overflow-y: auto; padding-right: 4px; touch-action: pan-y;">
            ${setsHtml}
          </div>
        </div>
      `;

    if (typeof window.startBestiaryAnimLoop === "function") {
      window.startBestiaryAnimLoop();
    }
  }

  // --- BESTIARY ANIMATED VIEWPORT LOOP & SET REWARD HANDLERS ---
  window.bestiaryAnimFrameId = null;

  export function stopBestiaryAnimLoop() {
    if (window.bestiaryAnimFrameId) {
      cancelAnimationFrame(window.bestiaryAnimFrameId);
      window.bestiaryAnimFrameId = null;
    }
  }

  export function startBestiaryAnimLoop() {
    window.stopBestiaryAnimLoop();

    function step() {
      let albumSec = document.getElementById("profile-sec-album");
      if (!albumSec || !albumSec.classList.contains("active-mobile-section")) {
        window.bestiaryAnimFrameId = null;
        return;
      }

      let canvases = document.querySelectorAll(".bestiary-card-canvas");
      let time = Date.now();

      canvases.forEach((canvas) => {
        let type = canvas.dataset.visualType;
        let isUnlocked = canvas.dataset.unlocked === "true";
        let ctx = canvas.getContext("2d");
        if (!ctx) return;

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

        if (isUnlocked) {
          if (typeof window.drawSingleMob === "function") {
            window.drawSingleMob(ctx, mockMob);
          }
        } else {
          // Render Undiscovered Dark Silhouette
          ctx.save();
          if (typeof window.drawSingleMob === "function") {
            window.drawSingleMob(ctx, mockMob);
          }
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = "rgba(5, 3, 12, 0.94)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Glowing ? Overlay
          ctx.globalCompositeOperation = "source-over";
          ctx.font = "bold 18px monospace";
          ctx.fillStyle = "rgba(255, 215, 0, 0.75)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("?", canvas.width / 2, canvas.height / 2 + 2);
          ctx.restore();
        }
      });

      window.bestiaryAnimFrameId = requestAnimationFrame(step);
    }

    window.bestiaryAnimFrameId = requestAnimationFrame(step);
  }

  export function claimBestiarySetReward(setKey) {
    if (!window.playerStats) return;
    if (!window.playerStats.claimedBestiarySets) {
      window.playerStats.claimedBestiarySets = {};
    }

    if (window.playerStats.claimedBestiarySets[setKey]) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("[!] Set rewards already claimed!", "#e74c3c");
      }
      return;
    }

    let setCards = Object.keys(window.MONSTER_CARDS_DATA).filter(
      (k) => window.MONSTER_CARDS_DATA[k].set === setKey,
    );

    let ownedMap = window.playerStats.monsterCards || {};
    let isComplete = setCards.every((k) => (ownedMap[k] || 0) >= 1);

    if (!isComplete) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Complete the full card set to claim rewards!",
          "#e74c3c",
        );
      }
      return;
    }

    window.playerStats.claimedBestiarySets[setKey] = true;

    // Award +2x Monster Card Sacks
    window.addUseDrop("Monster Card Sack", 2, false);

    // Award +50 Astral Dust
    window.playerStats.astralDust = (window.playerStats.astralDust || 0) + 50;

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `✦ Claimed ${setKey} Set Bonus (+2 Sacks, +50 Astral Dust)!`,
        "#ffd700",
      );
    }

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderBestiaryAlbum === "function")
      window.renderBestiaryAlbum();
    if (typeof window.saveGame === "function") window.saveGame();
  }

