import { getActiveDungeonMap } from "./dungeon_map.js?v=1.010";
import { hasRecoveryAssets } from "./recovery_contract.js?v=1.000";

  export function updateFlaskCooldownHUDOnly() {
    let stats = window.playerStats || {};
    let flaskBtn = document.getElementById("hud-flask-button");
    let cdRing = document.getElementById("hud-flask-cooldown-ring");
    let cdText = document.getElementById("hud-flask-cd-text");

    if (flaskBtn && cdRing) {
      let cdTimer = stats.flaskCooldownTimer || 0;
      let totalCircumference = 81.68;
      if (cdTimer > 0) {
        let cdProgress = cdTimer / 2700; // 2700 frames = 45.0s
        let offset = totalCircumference * (1 - cdProgress);
        cdRing.setAttribute("stroke-dashoffset", offset.toFixed(2));
        cdRing.style.display = "block";

        if (cdText) {
          let secLeft = (cdTimer / 60).toFixed(1);
          cdText.innerText = `${secLeft}s`;
        }
        flaskBtn.classList.add("flask-on-cooldown");
      } else {
        cdRing.setAttribute("stroke-dashoffset", totalCircumference.toFixed(2));
        cdRing.style.display = "none";
        if (cdText) cdText.innerText = "";
        flaskBtn.classList.remove("flask-on-cooldown");
      }
    }
  }

  // --- HUD UPDATER ---
  export function updateHUD() {
    let nameEl = document.getElementById("hud-player-name");
    let lvlEl = document.getElementById("hud-player-level");
    let hpFill = document.getElementById("hp-bar-fill");
    let hpText = document.getElementById("hp-text");
    let xpFill = document.getElementById("xp-bar-fill");
    let xpText = document.getElementById("xp-text");
    let goldText = document.getElementById("gold-text");
    let depthLabel = document.getElementById("hud-depth-label");
    let objectiveLabel = document.getElementById("hud-objective-label");
    let bagCount = document.getElementById("hud-bag-count");
    let abandonBtn = document.getElementById("btn-abandon-run");
    let ctrlSettingBtn = document.getElementById("btn-settings-control");
    let muteSettingBtn = document.getElementById("btn-settings-mute");

    let p = window.player;
    let stats = window.playerStats || {};
    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let mode = stats.controlMode || "joystick";

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : null;
    if (pStats && pStats.maxHp && p) {
      let resolvedMax = Math.round(
        BigNum.from(pStats.maxHp).toFiniteNumber(Number.MAX_VALUE / 16),
      );
      if (p.maxHp !== resolvedMax) {
        let diff = resolvedMax - p.maxHp;
        p.maxHp = resolvedMax;
        if (isHub) {
          p.hp = resolvedMax;
        } else if (diff > 0) {
          p.hp = Math.min(resolvedMax, p.hp + diff);
        } else {
          p.hp = Math.min(p.hp, resolvedMax);
        }
      }
      if (pStats.atk)
        p.atk = BigNum.from(pStats.atk).toFiniteNumber(
          Number.MAX_VALUE / 16,
        );
      if (pStats.def)
        p.def = BigNum.from(pStats.def).toFiniteNumber(
          Number.MAX_VALUE / 16,
        );
    }

    if (nameEl) nameEl.innerText = stats.playerName || "HERO";
    if (lvlEl) lvlEl.innerText = `LV.${stats.level || 1}`;

    let roundedHp = Math.round(p.hp);
    let roundedMaxHp = Math.round(p.maxHp);
    if (hpFill)
      hpFill.style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
    if (hpText) hpText.innerText = `${roundedHp} / ${roundedMaxHp}`;

    // Update XP Bar Track
    let curXp = BigNum.from(stats.xp || 0);
    let reqXp = BigNum.from(stats.xpReq || 350);
    let xpRatio = 0;
    if (reqXp.gt(0)) {
      let div = curXp.div(reqXp);
      xpRatio = Math.max(
        0,
        Math.min(1, div.m * Math.pow(10, Math.min(15, div.e))),
      );
    }
    if (xpFill) xpFill.style.width = `${(xpRatio * 100).toFixed(1)}%`;
    if (xpText)
      xpText.innerText = `${window.formatNumber(curXp)} / ${window.formatNumber(reqXp)}`;
    if (goldText) {
      let displayedGold = isHub ? stats.coins || 0 : stats.runGold || 0;
      goldText.innerText = window.formatNumber
        ? window.formatNumber(displayedGold)
        : displayedGold;
    }
    let activeChallenge = window.playerStats.activeSpecialChallenge;

    // Toggle No-Recovery Warning Badge Visibility
    let noRecBadge = document.getElementById("hud-no-recovery-badge");
    if (noRecBadge) {
      noRecBadge.style.display =
        activeChallenge && !isHub ? "inline-block" : "none";
    }

    if (depthLabel) {
      if (isHub) {
        depthLabel.innerText = "ADVENTURER'S HUB";
      } else if (stats.isRiftMode) {
        let gName = (stats.selectedRiftGuardian || "aegis_goliath")
          .replace("_", " ")
          .toUpperCase();
        depthLabel.innerText = `${gName} [RIFT TRIAL LEVEL ${stats.activeRiftLevel || 1}]`;
      } else if (activeChallenge) {
        // Subphase 19: Display active special challenge name and progress
        depthLabel.innerText = `${activeChallenge.name.toUpperCase()} [STAGE ${p.depth} OF 4]`;
      } else {
                let text = window.playerStats.isCrucibleMode ? `ONSLAUGHT WAVE ${window.playerStats.crucibleWave || 1}` : `DUNGEON FLOOR ${p.depth}`;
        if (window.lastXpMultiplier !== undefined) {
          let mult = window.lastXpMultiplier;
          if (mult === 0) { text += ` <span style="color:#ef4444; font-size:9px;">[TRIVIAL]</span>`; }
          else if (mult > 1.0) { let bonus = Math.round((mult - 1.0) * 100); text += ` <span style="color:#38bdf8; font-size:9px;">[HEROIC +${bonus}%]</span>`; }
          else if (mult < 1.0) { let penalty = Math.round((1.0 - mult) * 100); text += ` <span style="color:#facc15; font-size:9px;">[-${penalty}% XP]</span>`; }
          else { text += ` <span style="color:#4ade80; font-size:9px;">[IDEAL XP]</span>`; }
        }

        let rec = window.playerStats && window.playerStats.recoveryLoot;
        if (rec && rec.floor === p.depth && hasRecoveryAssets(rec)) {
          text += " [RECOVERY ACTIVE]";
        }
        depthLabel.innerText = text;
      }
    }
    if (objectiveLabel) {
      if (isHub) {
        objectiveLabel.innerText = "Select a Station or Portal";
      } else if (stats.isRiftMode) {
        objectiveLabel.innerText = window.mob
          ? "Slay the Rift Guardian!"
          : "Step into the Extraction Portal";
      } else if (activeChallenge) {
        // Subphase 19: Display active special challenge objective tracker
        objectiveLabel.innerText = window.getChallengeObjectiveText();
      } else {
        objectiveLabel.innerText = window.playerStats.isCrucibleMode
          ? "Defeat all active wave targets!"
          : "Find the Extraction Zone";
      }
    }

    let bagBtn = document.getElementById("btn-bag-toggle");
    if (bagBtn) {
      let count = isHub
        ? p.stash
          ? p.stash.length
          : 0
        : p.bag
          ? p.bag.length
          : 0;
      let label = isHub ? "VAULT" : "SATCHEL";
      let countText = isHub
        ? `${count}`
        : `${count}/${window.getMaxBagSlots ? window.getMaxBagSlots() : 20}`;
      bagBtn.innerHTML = `${label} (<span id="hud-bag-count">${countText}</span>)`;
    } else if (bagCount) {
      let count = isHub
        ? p.stash
          ? p.stash.length
          : 0
        : p.bag
          ? p.bag.length
          : 0;
      bagCount.innerText = isHub
        ? count
        : `${count}/${window.getMaxBagSlots ? window.getMaxBagSlots() : 20}`;
    }

    if (ctrlSettingBtn) {
      ctrlSettingBtn.innerText =
        mode === "cursor"
          ? "MODE: CURSOR (TOUCH TO MOVE)"
          : "MODE: JOYSTICK (DRAG THUMB)";
    }

    if (muteSettingBtn) {
      muteSettingBtn.innerText = stats.mute ? "AUDIO: MUTED" : "AUDIO: ENABLED";
    }

    let bountyBtn = document.getElementById("btn-bounty-toggle");
    if (bountyBtn) {
      bountyBtn.style.display = isHub ? "inline-block" : "none";
    }

    if (abandonBtn) {
      abandonBtn.style.display = isHub ? "none" : "inline-block";
    }

    // Update Quick-Slot Field Flask HUD Button
    let flaskBtn = document.getElementById("hud-flask-button");
    let fillRect = document.getElementById("hud-flask-fill-rect");
    let cdRing = document.getElementById("hud-flask-cooldown-ring");
    let cdText = document.getElementById("hud-flask-cd-text");
    let flaskBadge = document.getElementById("hud-flask-count-badge");

    if (flaskBtn) {
      let charges = stats.flaskCharges !== undefined ? stats.flaskCharges : 1;
      let maxCharges = stats.maxFlaskCharges || 1;
      let cdTimer = stats.flaskCooldownTimer || 0;

      if (flaskBadge) flaskBadge.innerText = `${charges}/${maxCharges}`;

      // 1. Dynamic Liquid Fill Level
      if (fillRect) {
        let fillPct = maxCharges > 0 ? charges / maxCharges : 0;
        let fillHeight = Math.round(52 * fillPct);
        let fillY = 6 + (52 - fillHeight);
        fillRect.setAttribute("y", fillY);
        fillRect.setAttribute("height", fillHeight);
      }

      // 2. Radial Sweeping 360 Degree Cooldown Ring & Countdown Text
      if (typeof window.updateFlaskCooldownHUDOnly === "function") {
        window.updateFlaskCooldownHUDOnly();
      }

      if (charges <= 0) {
        flaskBtn.classList.add("flask-empty");
      } else {
        flaskBtn.classList.remove("flask-empty");
      }

      // Apply saved position coordinates
      if (
        typeof stats.flaskX === "number" &&
        typeof stats.flaskY === "number" &&
        !flaskBtn.isDragging
      ) {
        flaskBtn.style.left = stats.flaskX + "px";
        flaskBtn.style.top = stats.flaskY + "px";
        flaskBtn.style.bottom = "auto";
        flaskBtn.style.right = "auto";
      } else if (!flaskBtn.isDragging) {
        const isLandscapeMobile =
          window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
        const isMobile = window.innerWidth <= 600 || isLandscapeMobile;
        if (isMobile) {
          flaskBtn.style.left = "env(safe-area-inset-left, 24px)";
          flaskBtn.style.right = "auto";
          flaskBtn.style.bottom = "env(safe-area-inset-bottom, 36px)";
          flaskBtn.style.top = "auto";
        } else {
          flaskBtn.style.left = "24px";
          flaskBtn.style.right = "auto";
          flaskBtn.style.bottom = "36px";
          flaskBtn.style.top = "auto";
        }
      }
    }

    if (typeof window.updateHudBuffTray === "function") {
      window.updateHudBuffTray();
    }

    // Mastery/MP Alert Badge
    let masteryBtn = document.getElementById("btn-skills-toggle");
    if (masteryBtn) {
      let unspentMP = window.SkillTreeManager
        ? window.SkillTreeManager.getUnspentMP()
        : 0;
      let existingMpBadge = masteryBtn.querySelector(".hud-alert-badge");
      if (unspentMP > 0) {
        if (!existingMpBadge) {
          existingMpBadge = document.createElement("span");
          existingMpBadge.className = "hud-alert-badge";
          masteryBtn.appendChild(existingMpBadge);
        }
        existingMpBadge.innerText = unspentMP;
      } else if (existingMpBadge) {
        existingMpBadge.remove();
      }
    }

    // Hero Pod/SP Alert Badge
    let heroPod = document.querySelector(".hud-hero-pod");
    if (heroPod) {
      let unspentSP = stats.sp || 0;
      let existingSpBadge = heroPod.querySelector(".hud-alert-badge");
      if (unspentSP > 0) {
        if (!existingSpBadge) {
          existingSpBadge = document.createElement("span");
          existingSpBadge.className = "hud-alert-badge";
          heroPod.appendChild(existingSpBadge);
        }
        existingSpBadge.innerText = unspentSP;
      } else if (existingSpBadge) {
        existingSpBadge.remove();
      }
    }

    // Bounty Board/Unclaimed Quests Alert Badge
    if (bountyBtn) {
      let unclaimedCount = 0;
      if (window.playerStats.dailyMissions) {
        unclaimedCount += window.playerStats.dailyMissions.filter(
          (q) => q.completed && !q.claimed,
        ).length;
      }
      if (window.playerStats.weeklyMissions) {
        unclaimedCount += window.playerStats.weeklyMissions.filter(
          (q) => q.completed && !q.claimed,
        ).length;
      }

      let existingBountyBadge = bountyBtn.querySelector(".hud-alert-badge");
      if (unclaimedCount > 0 && isHub) {
        // Only display badge alerts while resting in the Hub
        if (!existingBountyBadge) {
          existingBountyBadge = document.createElement("span");
          existingBountyBadge.className = "hud-alert-badge";
          bountyBtn.appendChild(existingBountyBadge);
        }
        existingBountyBadge.innerText = unclaimedCount;
      } else if (existingBountyBadge) {
        existingBountyBadge.remove();
      }
    }
  }

  // Subphase 19: Evaluation helper for active Special Challenge objectives
  export function getChallengeObjectiveText() {
    let challenge = window.playerStats.activeSpecialChallenge;
    if (!challenge) return "";
    let depth = window.player.depth || 1;

    if (depth < 4) {
      let isWardenAlive =
        window.mob !== null && window.mob.type === "dungeon_miniboss";
      return isWardenAlive
        ? "[Clear Portal Guardian: 0/1]"
        : "[Clear Portal Guardian: 1/1 - Descent Portal Open!]";
    } else {
      // Floor 4: Slay twin bosses (which reside in activeDungeonMobs)
      let bossesCount = window.activeDungeonMobs
        ? window.activeDungeonMobs.filter(
            (m) => m.type === "dungeon_boss" || m.type === "dungeon_miniboss",
          ).length
        : 0;
      if (
        window.mob &&
        (window.mob.type === "dungeon_boss" ||
          window.mob.type === "dungeon_miniboss")
      ) {
        if (!window.activeDungeonMobs.some((m) => m.id === window.mob.id)) {
          bossesCount++;
        }
      }

      if (bossesCount > 0) {
        return `[Slay Twin Overlords: ${2 - bossesCount}/2]`;
      } else {
        let isCofferOpened = false;
        let map = getActiveDungeonMap();
        if (map && map.openedChests) {
          isCofferOpened = map.openedChests.size > 0;
        }
        return isCofferOpened
          ? "[Objective Complete: Enter Extraction Portal!]"
          : "[Slay Twin Overlords: 2/2 - Claim Special Coffer!]";
      }
    }
  }

  export function updateHudBuffTray() {
    let tray = document.getElementById("hud-buff-tray");
    if (!tray) return;

    let stats = window.playerStats || {};
    let p = window.player || {};
    let badges = [];

    // --- PLAYER DEBUFFS (POISON, SNARE, GLITCH) ---
    let poisonTimer = p.poisonTimer || stats.poisonTimer || 0;
    let poisonStacks = p.poisonStacks || stats.poisonStacks || 0;
    if (poisonTimer > 0 && poisonStacks > 0) {
      let secLeft = (poisonTimer / 60).toFixed(1);
      badges.push({
        label: `POISON x${poisonStacks}`,
        val: `${secLeft}s`,
        col: "#2ecc71",
        isDebuff: true,
        title: `Poisoned (${poisonStacks} Stack(s)): Taking periodic toxic damage!`,
      });
    }

    let snareTimer = p.snareTimer || stats.snareTimer || 0;
    if (snareTimer > 0) {
      let secLeft = (snareTimer / 60).toFixed(1);
      badges.push({
        label: "SNARED",
        val: `${secLeft}s`,
        col: "#f59e0b",
        isDebuff: true,
        title: "Snared (-60% Movement Speed)",
      });
    }

    let glitchTimer = p.glitchTimer || stats.glitchTimer || 0;
    if (glitchTimer > 0) {
      let secLeft = (glitchTimer / 60).toFixed(1);
      badges.push({
        label: "GLITCHED",
        val: `${secLeft}s`,
        col: "#ff007f",
        isDebuff: true,
        title: "Control Glitch (Inverted Movement Controls)",
      });
    }

    let getAtkCol = (s) =>
      s >= 0.35 ? "#00ffcc" : s >= 0.2 ? "#10b981" : "#2ecc71";
    let getHpCol = (s) =>
      s >= 0.35 ? "#ff0055" : s >= 0.2 ? "#f43f5e" : "#e74c3c";
    let getDefCol = (s) =>
      s >= 0.35 ? "#38bdf8" : s >= 0.2 ? "#00d2ff" : "#3498db";
    let getHasteCol = (s) =>
      s >= 3 ? "#ffaa00" : s >= 2 ? "#fbbf24" : "#f1c40f";

    if ((stats.atkPotionRuns || 0) > 0 || (stats.atkPotionTimer || 0) > 0) {
      let col = getAtkCol(stats.atkPotionStrength || 0.1);
      let valStr =
        stats.atkPotionTimer > 0
          ? `${Math.ceil(stats.atkPotionTimer / 60)}s`
          : `${stats.atkPotionRuns}R`;
      badges.push({
        label: "ATK",
        val: valStr,
        col: col,
        title: `Attack Elixir (+${Math.round((stats.atkPotionStrength || 0.1) * 100)}% Atk, ${stats.atkPotionRuns} run(s) left)`,
      });
    }

    if ((stats.hpPotionRuns || 0) > 0 || (stats.hpPotionTimer || 0) > 0) {
      let col = getHpCol(stats.hpPotionStrength || 0.1);
      let valStr =
        stats.hpPotionTimer > 0
          ? `${Math.ceil(stats.hpPotionTimer / 60)}s`
          : `${stats.hpPotionRuns}R`;
      badges.push({
        label: "HP",
        val: valStr,
        col: col,
        title: `Vitality Elixir (+${Math.round((stats.hpPotionStrength || 0.1) * 100)}% Max HP, ${stats.hpPotionRuns} run(s) left)`,
      });
    }

    if ((stats.defPotionRuns || 0) > 0 || (stats.defPotionTimer || 0) > 0) {
      let col = getDefCol(stats.defPotionStrength || 0.1);
      let valStr =
        stats.defPotionTimer > 0
          ? `${Math.ceil(stats.defPotionTimer / 60)}s`
          : `${stats.defPotionRuns}R`;
      badges.push({
        label: "DEF",
        val: valStr,
        col: col,
        title: `Armored Elixir (+${Math.round((stats.defPotionStrength || 0.1) * 100)}% Def, ${stats.defPotionRuns} run(s) left)`,
      });
    }

    if ((stats.hastePotionRuns || 0) > 0 || (stats.hastePotionTimer || 0) > 0) {
      let col = getHasteCol(stats.hastePotionStrength || 1);
      let valStr =
        stats.hastePotionTimer > 0
          ? `${Math.ceil(stats.hastePotionTimer / 60)}s`
          : `${stats.hastePotionRuns}R`;
      badges.push({
        label: "SPD",
        val: valStr,
        col: col,
        title: `Haste Elixir (+Speed, ${stats.hastePotionRuns} run(s) left)`,
      });
    }

    if ((stats.xpPotionRuns || 0) > 0 || (stats.xpPotionTimer || 0) > 0) {
      let valStr =
        stats.xpPotionTimer > 0
          ? `${Math.ceil(stats.xpPotionTimer / 60)}s`
          : `${stats.xpPotionRuns}R`;
      badges.push({
        label: "2x XP",
        val: valStr,
        col: "#c084fc",
        title: `Double XP Elixir (+100% XP, ${stats.xpPotionRuns} run(s) left)`,
      });
    }

    if ((stats.dropPotionRuns || 0) > 0 || (stats.dropPotionTimer || 0) > 0) {
      let valStr =
        stats.dropPotionTimer > 0
          ? `${Math.ceil(stats.dropPotionTimer / 60)}s`
          : `${stats.dropPotionRuns}R`;
      badges.push({
        label: "DROP +100%",
        val: valStr,
        col: "#34d399",
        title: `Double Drop Elixir (+100% eligible random monster equipment/material/sigil/card chance multiplier; each chance caps at 100%; guaranteed/direct rewards unchanged; ${stats.dropPotionRuns} run(s) left)`,
      });
    }

    if ((stats.qlyPotionRuns || 0) > 0 || (stats.qlyPotionTimer || 0) > 0) {
      let valStr =
        stats.qlyPotionTimer > 0
          ? `${Math.ceil(stats.qlyPotionTimer / 60)}s`
          : `${stats.qlyPotionRuns}R`;
      badges.push({
        label: "QLY",
        val: valStr,
        col: "#f472b6",
        title: `Drop Quality Elixir (+50% Drop Quality, ${stats.qlyPotionRuns} run(s) left). Improves higher-rarity odds among currently unlocked tiers; does not unlock tiers or create a minimum rarity.`,
      });
    }

    if (stats.frenzyTimer > 0) {
      badges.push({
        label: "FRENZY",
        val: `${Math.ceil(stats.frenzyTimer / 60)}s`,
        col: "#f1c40f",
        title: `Frenzy Mode Active (${Math.ceil(stats.frenzyTimer / 60)}s)`,
      });
    }

    if (stats.adrenalineTimer > 0) {
      badges.push({
        label: "ADRENALINE",
        val: `${Math.ceil(stats.adrenalineTimer / 60)}s`,
        col: "#e67e22",
        title: `Adrenaline Rush (+30% Damage, ${Math.ceil(stats.adrenalineTimer / 60)}s)`,
      });
    }

    if (stats.fortunesFavorTimer > 0) {
      badges.push({
        label: "FORTUNE",
        val: `${Math.ceil(stats.fortunesFavorTimer / 60)}s`,
        col: "#ffd700",
        title: `Fortune's Favor (+50% Gold, ${Math.ceil(stats.fortunesFavorTimer / 60)}s)`,
      });
    }

    if (stats.astralAwakeningTimer > 0) {
      badges.push({
        label: "ASTRAL",
        val: `${Math.ceil(stats.astralAwakeningTimer / 60)}s`,
        col: "#00d2ff",
        title: `Astral Awakening (+100% Damage, ${Math.ceil(stats.astralAwakeningTimer / 60)}s)`,
      });
    }

    if (stats.purifiedAegisTimer > 0) {
      badges.push({
        label: "AEGIS",
        val: `${Math.ceil(stats.purifiedAegisTimer / 60)}s`,
        col: "#2ecc71",
        title: `Purified Aegis (+50% Def, ${Math.ceil(stats.purifiedAegisTimer / 60)}s)`,
      });
    }

    if ((stats.viperShadowDanceCharges || 0) > 0) {
      badges.push({
        label: "VIPER",
        val: `${stats.viperShadowDanceCharges}x`,
        col: "#a855f7",
        title: `Viper's Shadow Dance (${stats.viperShadowDanceCharges} 100% Crit Strike(s))`,
      });
    }

    if (badges.length === 0) {
      tray.innerHTML = "";
      tray.style.display = "none";
      return;
    }

    tray.style.display = "flex";
    tray.innerHTML = badges
      .map(
        (b) => `
                        <div class="hud-buff-badge ${b.isDebuff ? "hud-debuff-badge" : ""}" style="border-color:${b.col}; box-shadow: 0 0 8px ${b.col}55; background: ${b.isDebuff ? "rgba(20, 8, 14, 0.92)" : "rgba(10, 8, 20, 0.88)"};" title="${b.title}">
                          <span class="buff-label" style="color:${b.col}; font-weight: 800;">${b.label}</span>
                          <span class="buff-runs" style="color:#ffffff; font-family: monospace;">${b.val}</span>
                        </div>
                      `,
      )
      .join("");
  }

