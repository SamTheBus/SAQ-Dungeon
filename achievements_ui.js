  import {
    getAchievementFilter,
    setAchievementFilter,
  } from "./ui_state.js";

  export function switchAchievementFilter(filterKey) {
    setAchievementFilter(filterKey);
    window.renderAchievementsTab();
  }

  export function renderAchievementsTab() {
    let container = document.getElementById("achievements-content-panel");
    if (!container) return;

    let unlocked = window.playerStats.unlockedAchievements || [];
    let timestamps = window.playerStats.achievementTimestamps || {};
    let totals = window.playerStats.cachedAchievementBonusTotals || {};

    let totalCount = window.AchievementsData.length;
    let unlockedCount = unlocked.length;
    let progressPct = Math.round((unlockedCount / totalCount) * 100) || 0;

    // Compile active passive stats
    let activeBonusTexts = [];
    for (let sKey in totals) {
      let val = totals[sKey];
      if (val > 0) {
        let isPct = [
          "drop",
          "qly",
          "critChance",
          "critDamage",
          "block",
          "parry",
          "gold",
          "fairySpawn",
          "rareSpawn",
          "expPct",
          "potDurationPct",
          "potStrengthPct",
          "atkPct",
          "maxHpPct",
          "defPct",
          "moveSpeedPct",
          "strPct",
          "dexPct",
          "intPct",
          "idleSpeedPct",
          "activeSpeedPct",
        ].includes(sKey);
        let valStr = isPct ? `+${(val * 100).toFixed(1)}%` : `+${val}`;
        let label = window.getStatLabel ? window.getStatLabel(sKey) : sKey;
        activeBonusTexts.push(`${label} ${valStr}`);
      }
    }
    let activeBonusStr =
      activeBonusTexts.length > 0
        ? activeBonusTexts.join(" • ")
        : "No active milestone bonuses yet.";

    // Achievements Category Filter Options
    let activeFilter = getAchievementFilter() || "all";
    let filters = [
      { key: "all", label: "ALL" },
      { key: "slayer", label: "SLAYER" },
      { key: "floor", label: "EXPLORER" },
      { key: "hoarder", label: "WEALTH" },
      { key: "extract", label: "SURVIVOR" },
      { key: "salvage", label: "SALVAGER" },
      { key: "forge", label: "CRAFTING" },
      { key: "misc", label: "TACTICAL" },
      { key: "sing", label: "VALOR FEATS" },
    ];

    let filterBarHtml = `
    <div class="ach-filter-bar">
      ${filters
        .map((f) => {
          let isActive = f.key === activeFilter;
          return `
          <button class="ach-filter-btn ${isActive ? "active" : ""}" onclick="window.switchAchievementFilter('${f.key}')">
            ${f.label}
          </button>
        `;
        })
        .join("")}
    </div>
  `;

    // Filter the achievements list
    let filteredAchs = window.AchievementsData.filter((ach) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "sing") return !!ach.isSingleTier;

      let cat = "";
      if (ach.reqType === "kills") cat = "slayer";
      else if (ach.reqType === "floor") cat = "floor";
      else if (ach.reqType === "gold") cat = "hoarder";
      else if (ach.reqType === "extract") cat = "extract";
      else if (ach.reqType === "salvage") cat = "salvage";
      else if (["temper", "reforges", "enchant"].includes(ach.reqType))
        cat = "forge";
      else if (
        ["deflections", "rare_spawns", "single_hit", "gold_upgrades"].includes(
          ach.reqType,
        )
      )
        cat = "misc";

      return cat === activeFilter;
    });

    // Render cards
    let cardsHtml = filteredAchs
      .map((ach) => {
        let isUnlocked = unlocked.includes(ach.id);
        let timeStr = "";
        if (isUnlocked && timestamps[ach.id]) {
          timeStr = new Date(timestamps[ach.id]).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        // Process Rewards Text
        let rewardsList = [];
        if (ach.stats) {
          for (let sKey in ach.stats) {
            let val = ach.stats[sKey];
            let isPct = [
              "drop",
              "qly",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "gold",
              "fairySpawn",
              "rareSpawn",
              "expPct",
              "potDurationPct",
              "potStrengthPct",
              "atkPct",
              "maxHpPct",
              "defPct",
              "moveSpeedPct",
              "strPct",
              "dexPct",
              "intPct",
              "idleSpeedPct",
              "activeSpeedPct",
            ].includes(sKey);
            let valStr = isPct ? `+${(val * 100).toFixed(0)}%` : `+${val}`;
            let label = window.getStatLabel ? window.getStatLabel(sKey) : sKey;
            rewardsList.push(`${label} ${valStr}`);
          }
        }
        let rewardsStr =
          rewardsList.length > 0
            ? `Reward: ${rewardsList.join(", ")}`
            : "Cosmetic Award";

        // Progress bar for locked achievements
        let progressHtml = "";
        if (!isUnlocked) {
          let progress = window.getAchievementProgress(ach);
          let progressNum =
            progress instanceof BigNum
              ? progress.valueOf()
              : Number(progress || 0);
          let targetNum = ach.isSingleTier ? 1 : Number(ach.reqValue || 1);

          let pct =
            Math.max(0, Math.min(100, (progressNum / targetNum) * 100)) || 0;
          let displayProgress =
            progress instanceof BigNum
              ? window.formatNumber(progress)
              : progressNum.toLocaleString();
          let displayTarget = ach.isSingleTier
            ? "1"
            : ach.reqValue.toLocaleString();

          progressHtml = `
        <div class="ach-progress-box">
          <div class="ach-progress-bar-bg">
            <div class="ach-progress-bar-fill" style="width:${pct}%;"></div>
          </div>
          <div class="ach-progress-text">${displayProgress} / ${displayTarget}</div>
        </div>
      `;
        }

        let badgeHtml = window.getAchievementBadgeHtml
          ? window.getAchievementBadgeHtml(ach, isUnlocked, 34)
          : "";

        return `
      <div id="ach-card-${ach.id}" class="ach-card ${isUnlocked ? "unlocked" : "locked"}">
        <div class="ach-badge-box">
          ${badgeHtml}
        </div>
        <div class="ach-info">
          <div class="ach-title-row">
            <span class="ach-title">${ach.name}</span>
            <span class="ach-status-tag ${isUnlocked ? "tag-unlocked" : "tag-locked"}">
              ${isUnlocked ? `UNLOCKED • ${timeStr}` : "LOCKED"}
            </span>
          </div>
          <span class="ach-desc">${ach.desc}</span>
          <span class="ach-reward-badge" style="color: ${isUnlocked ? "#34d399" : "#64748b"};">
            ${rewardsStr}
          </span>
          ${progressHtml}
        </div>
      </div>
    `;
      })
      .join("");

    container.innerHTML = `
    <div class="ach-wrapper">
      <!-- Unlocked Count & Summary Banner -->
      <div class="ach-summary-banner">
        <div class="ach-summary-header">
          <span class="ach-summary-title">EXTRACTION CHALLENGES</span>
          <span class="ach-summary-count">${unlockedCount} / ${totalCount} Cleared (${progressPct}%)</span>
        </div>
        <div class="ach-total-bar">
          <div class="ach-total-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="ach-active-bonuses">
          <strong>COMBINED MILESTONE PASSIVES:</strong> ${activeBonusStr}
        </div>
      </div>

      <!-- Filters Bar -->
      ${filterBarHtml}

      <!-- Unlocked/Locked Cards List -->
      <div class="ach-list">
        ${cardsHtml || '<div style="color:#64748b; font-style:italic; text-align:center; padding:30px;">No challenges match this filter category.</div>'}
      </div>
    </div>
  `;
  }

