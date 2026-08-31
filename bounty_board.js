  import {
    getBountyActiveTab,
    getSelectedBountyId,
    getSelectedQuestId,
    setBountyActiveTab,
    setSelectedBountyId,
    setSelectedQuestId,
  } from "./ui_state.js?v=1.004";

  // Subphase 14: Bounty Board UI Toggle & Dynamic Ledger Binding
  export function toggleBountyModal() {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let modal = document.getElementById("bounty-modal");
    if (!modal) return;

    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      window.renderBountyBoard();
    } else {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
    }
  }

  export function switchBountyTab(tabKey) {
    setBountyActiveTab(tabKey);
    ["challenges", "dailies", "weeklies"].forEach((t) => {
      let btn = document.getElementById("bounty-tab-" + t);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderBountyBoard();
  }

  export function selectBountyQuest(questId) {
    setSelectedQuestId(questId);
    window.renderBountyBoard();
  }

  export function claimQuestReward(questId, isWeekly) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let list = isWeekly
      ? window.playerStats.weeklyMissions
      : window.playerStats.dailyMissions;
    if (!list) return;

    let quest = list.find((q) => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    quest.claimed = true;

    // Hydrate BigNum rewards
    let goldReward = BigNum.from(quest.goldReward);
    let xpReward = BigNum.from(quest.xpReward);

    // Add Gold and XP
    window.playerStats.coins = BigNum.from(window.playerStats.coins || 0).add(
      goldReward,
    );
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }
    if (typeof window.gainXp === "function") {
      window.gainXp(xpReward);
    }

    // Add the "Reward Sack" item (Daily or Weekly)
    window.addUseDrop(quest.treat, quest.treatQty || 1, false);

    // Add Monster Card Sack rewards (+1x for Daily, +2x for Weekly Guild Quests)
    let cardSackQty = isWeekly ? 2 : 1;
    window.addUseDrop("Monster Card Sack", cardSackQty, false);

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(`Claimed Reward: ${quest.desc}!`, "#2ecc71");
    }
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderBountyBoard === "function")
      window.renderBountyBoard();
    if (typeof window.saveGame === "function") window.saveGame();
  }

  export function renderBountyBoard() {
    let leftPane = document.getElementById("bounty-list-pane");
    let rightPane = document.getElementById("bounty-details-pane");
    if (!leftPane || !rightPane) return;

    let tab = getBountyActiveTab() || "challenges";

    if (tab === "challenges") {
      let isChallengesUnlocked =
        (window.playerStats.maxFloorCleared || 0) >= 12 ||
        (window.playerStats.lifetimePeakStage || 0) >= 12 ||
        (window.playerStats.stage || 1) >= 12;
      if (!isChallengesUnlocked) {
        leftPane.innerHTML = `
            <div style="color:#64748b; font-style:italic; text-align:center; padding:30px 10px; font-size:10px; font-family:monospace; line-height:1.45;">
              [ CONTRACTS LOCKED ]<br><br>
              Clear Floor 12 (Sector 1 Boss) to unlock Special Cavern Contracts.
            </div>
          `;
        rightPane.innerHTML = `
            <div style="display:flex; flex-direction:column; text-align:left; gap:10px; height:100%; font-family:monospace;">
              <div style="font-weight:900; font-size:13.5px; color:#e74c3c; border-bottom:1.5px solid rgba(231,76,60,0.3); padding-bottom:6px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">
                Special Contracts Locked
              </div>
              <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal;">
                Special Cavern Contracts introduce dangerous high-risk, high-reward modifiers to the dungeon. To unlock these mercenary bounties, you must first prove your strength:
              </p>
              <div style="background:rgba(231,76,60,0.05); border:1px dashed #e74c3c; border-radius:6px; padding:10px; font-size:10.5px; line-height:1.4; color:#ff7675;">
                • Clear Floor 12 (Defeat the Sector 1 Guardian Boss)
              </div>
              <button class="action-btn" style="width:100%; margin-top:auto; background:#1e293b; border-color:#334155; color:#64748b;" disabled>EXPEDITION UNDERWAY</button>
            </div>
          `;
        return;
      }

      let database = window.SPECIAL_CHALLENGES_DATABASE || {};
      let keys = Object.keys(database);

      let selectedBountyId = getSelectedBountyId();
      if (!selectedBountyId || !database[selectedBountyId]) {
        selectedBountyId = keys[0];
        setSelectedBountyId(selectedBountyId);
      }

      let activeBountyId = selectedBountyId;

      // Render Re-roll button with dynamically scaling progression cost
      let r = window.playerStats.bountyRerollsToday || 0;
      let peakStage =
        window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
      let rerollCost = window.getBountyRerollCost(peakStage, r);
      let costStr = `${window.formatNumber(rerollCost.gold)} G / ${rerollCost.souls} Souls`;

      let rerollBtnHtml =
        r >= 3
          ? `<div style="background:#0e0a14; border:1px solid #334155; border-radius:6px; padding:6px 10px; font-family:monospace; font-size:9px; color:#64748b; text-align:center; margin-bottom:8px; text-transform:uppercase;">MAX DAILY RE-ROLLS REACHED</div>`
          : `<button class="shop-refresh-btn" style="width:100%; margin-bottom:8px; display:flex; justify-content:center; gap:6px; background:linear-gradient(180deg,#7f1c1d,#450a0a); border-color:#e74c3c; line-height:1.2; padding:6px;" onclick="event.stopPropagation(); window.rerollBountyBoard();">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform:translateY(0.5px);"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    <span>RE-ROLL BOARD (${costStr})</span>
                  </button>`;

      let timeDiffs = window.getPacificTimeDiffs
        ? window.getPacificTimeDiffs()
        : { dailyMs: 0, weeklyMs: 0 };
      let dailyTimerStr = window.formatRemainingTime
        ? window.formatRemainingTime(timeDiffs.dailyMs)
        : "0s";
      let timerHtml = `<div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.2); border-radius:6px; padding:6px 10px; font-family:monospace; font-size:9.5px; color:#ffd700; text-align:center; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>BOARD RESET IN:</span>
          <strong style="color:#ffffff;">${dailyTimerStr}</strong>
        </div>`;

      // Render Left Pane (Ledger List)
      let listMarkup = keys
        .map((key) => {
          let challenge = database[key];
          let isSelected = key === activeBountyId;
          let isSigned =
            window.playerStats.activeSpecialChallenge &&
            window.playerStats.activeSpecialChallenge.id === key;

          let cardStyle = isSelected
            ? "background: rgba(231, 76, 60, 0.15); border-color: #ffd700;"
            : "background: rgba(15, 23, 42, 0.65); border-color: #334155;";

          return `
                <div class="bounty-ledger-row" style="${cardStyle} border-left: 4px solid #e74c3c; padding: 10px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; transition: all 0.15s;" onclick="event.stopPropagation(); window.selectBounty('${key}')">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color: #f1f5f9; font-size: 11.5px;">${challenge.name}</strong>
                    <span style="font-family: monospace; font-size: 9px; color: #ff7675; font-weight: bold;">RR ${challenge.riskRating}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 4px;">
                    <span style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">Multi: +${Math.round((challenge.rewardMultiplier - 1) * 100)}%</span>
                    ${isSigned ? '<span style="color:#2ecc71; font-size:8.5px; font-weight:bold; font-family:monospace;">[ACTIVE]</span>' : ""}
                  </div>
                </div>
              `;
        })
        .join("");

      leftPane.innerHTML = rerollBtnHtml + timerHtml + listMarkup;

      // Render Right Pane (Contract Details)
      let activeChallenge = database[activeBountyId];
      if (activeChallenge) {
        let isSignedThis =
          window.playerStats.activeSpecialChallenge &&
          window.playerStats.activeSpecialChallenge.id === activeBountyId;
        let isAnySigned = window.playerStats.activeSpecialChallenge !== null;

        let buffPills = (activeChallenge.buffs || [])
          .map((bId) => {
            let b = (window.CAVERN_BUFFS || []).find((x) => x.id === bId);
            return b
              ? `<span style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #34d399; font-size: 8px; font-family: monospace; padding: 2px 5px; border-radius: 4px; cursor: help;" onpointerdown="window.showModifierTooltip(event, '${b.id}', true)" onmouseenter="window.showModifierTooltip(event, '${b.id}', true)" onmouseleave="window.hideTooltip()">+ ${b.name}</span>`
              : "";
          })
          .join(" ");

        let debuffPills = (activeChallenge.debuffs || [])
          .map((dId) => {
            let d = (window.CAVERN_DEBUFFS || []).find((x) => x.id === dId);
            return d
              ? `<span style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; color: #f87171; font-size: 8px; font-family: monospace; padding: 2px 5px; border-radius: 4px; cursor: help;" onpointerdown="window.showModifierTooltip(event, '${d.id}', false)" onmouseenter="window.showModifierTooltip(event, '${d.id}', false)" onmouseleave="window.hideTooltip()">- ${d.name}</span>`
              : "";
          })
          .join(" ");

        let goldRewardText = window.formatNumber(
          BigNum.from(activeChallenge.rewards.gold),
        );
        let xpRewardText = window.formatNumber(
          BigNum.from(activeChallenge.rewards.xp),
        );

        let actionBtnHtml = "";
        if (isSignedThis) {
          actionBtnHtml = `
                  <button class="action-btn" style="width:100%; margin-top:12px; background:linear-gradient(180deg, #dc2626 0%, #991b1b 100%); border-color:#f87171;" onclick="event.stopPropagation(); window.abandonSpecialChallenge(); window.renderBountyBoard();">
                    ABANDON ACTIVE CONTRACT
                  </button>
                `;
        } else if (isAnySigned) {
          actionBtnHtml = `
                  <button class="action-btn" style="width:100%; margin-top:12px; background:#1e293b; border-color:#334155; color:#64748b;" disabled>
                    ANOTHER CONTRACT IS RUNNING
                  </button>
                `;
        } else {
          actionBtnHtml = `
                  <button class="action-btn" style="width:100%; margin-top:12px; background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#34d399;" onclick="event.stopPropagation(); window.signSpecialChallengeContract('${activeBountyId}')">
                    SIGN SPECIAL CONTRACT
                  </button>
                `;
        }

        rightPane.innerHTML = `
                <div style="display:flex; flex-direction:column; text-align:left; gap:10px; height:100%;">
                  <div>
                    <div style="font-weight:900; font-size:13.5px; color:#ffd700; border-bottom:1.5px solid rgba(212,175,55,0.3); padding-bottom:6px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">
                      ${activeChallenge.name}
                    </div>
                    <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal; font-family:Georgia, serif; font-style:italic;">
                      "${activeChallenge.desc}"
                    </p>
                  </div>

                  <!-- Risk Rating & Focus Modifiers -->
                                    <div style="background:rgba(0,0,0,0.45); border:1px solid #334155; border-radius:6px; padding:10px; display:flex; flex-direction:column; gap:4.5px; font-family:monospace; font-size:9.5px;">
                                      <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Contract Tier:</span> <strong style="color:${activeChallenge.tierColor || "#ffd700"}; text-transform:uppercase;">${activeChallenge.tierName || "Veteran"} (x${activeChallenge.tierId === "squire" ? "0.8" : activeChallenge.tierId === "calamity" ? "1.25" : "1.0"} Scale)</strong></div>
                                      <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Contract Level:</span> <strong style="color:#ffffff;">Floor ${activeChallenge.baseScaleStage || 1}</strong></div>
                                      <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Risk Rating:</span> <strong style="color:#ff7675;">${activeChallenge.riskRating} (HIGH DANGER)</strong></div>
                                      <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Focus Rewards:</span> <strong style="color:#00ffff;">+${Math.round((activeChallenge.rewardMultiplier - 1) * 100)}% Multiplier</strong></div>
                                      <div style="display:flex; justify-content:space-between;"><span style="color:#e879f9;">Quality Boost:</span> <strong style="color:#ff007f;">+${Math.round(activeChallenge.qualityBoost * 100)}% Quality</strong></div>
                                    </div>

                                    <!-- Dynamic Warning Matrix -->
                                    ${(function () {
                                      let peak =
                                        window.playerStats.lifetimePeakStage ||
                                        window.playerStats.stage ||
                                        1;
                                      let cLvl =
                                        activeChallenge.baseScaleStage || 1;
                                      if (cLvl > peak) {
                                        return `<div style="background: rgba(231, 76, 60, 0.1); border: 1px dashed #ef4444; border-radius: 4px; padding: 6px 8px; font-size: 8.5px; line-height: 1.35; color: #f87171;">
                                          ✦ WARNING: This contract is highly over-leveled (Floor ${cLvl} vs Peak ${peak}). Upgrade and attune gear slots at the forge before attempting.
                                        </div>`;
                                      } else if (cLvl < peak) {
                                        return `<div style="background: rgba(16, 185, 129, 0.1); border: 1px dashed #10b981; border-radius: 4px; padding: 6px 8px; font-size: 8.5px; line-height: 1.35; color: #34d399;">
                                          ✦ SECURE: Safe tactical run (Floor ${cLvl} vs Peak ${peak}). Excellent for reliable material extraction.
                                        </div>`;
                                      } else {
                                        return `<div style="background: rgba(245, 158, 11, 0.08); border: 1px dashed #fb923c; border-radius: 4px; padding: 6px 8px; font-size: 8.5px; line-height: 1.35; color: #fb923c;">
                                          ✦ BALANCED: Standard challenge rating. Perfectly aligned with your current progression peak.
                                        </div>`;
                                      }
                                    })()}

                                    <!-- Mutator Seals -->
                                    <div style="display:flex; flex-direction:column; gap:6px;">
                                      <strong style="color:#38bdf8; font-family:monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.5px;">Active Cavern Mutators:</strong>
                                      <div style="display:flex; flex-wrap:wrap; gap:4px;">
                                        ${buffPills} ${debuffPills}
                                      </div>
                                    </div>

                  <!-- Guaranteed Completion Rewards -->
                  <div style="background:rgba(0,0,0,0.3); border:1px dashed rgba(255,255,255,0.1); border-radius:6px; padding:8px 10px; text-align:left; font-family:monospace; font-size:10px; margin-top:auto;">
                    <strong style="color:#ffd700; display:block; margin-bottom:4px; font-size:9.5px; letter-spacing:0.5px;">[ GUARANTEED CONTRACT REWARDS ]</strong>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                      <div style="color:#f1c40f;">+ ${goldRewardText} Gold Coins</div>
                      <div style="color:#c084fc;">+ ${xpRewardText} Experience (XP)</div>
                      <div style="color:#00ffff;">+ ${activeChallenge.rewards.shards} Astral Shards</div>
                      <div style="color:#2ecc71;">+ ${activeChallenge.rewards.cores} Catalyst Cores</div>
                    </div>
                  </div>

                  ${actionBtnHtml}
                </div>
              `;
      }
    } else {
      // Render Dailies or Weeklies
      let isWeekly = tab === "weeklies";

      // If weekly tab is selected but requirements are not met, display clear locked UX
      if (isWeekly && !window.isWeeklyQuestUnlocked()) {
        let timeDiffs = window.getPacificTimeDiffs
          ? window.getPacificTimeDiffs()
          : { dailyMs: 0, weeklyMs: 0 };
        let weeklyTimerStr = window.formatRemainingTime
          ? window.formatRemainingTime(timeDiffs.weeklyMs)
          : "0s";
        let timerHtml = `<div style="background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.2); border-radius:6px; padding:6px 10px; font-family:monospace; font-size:9.5px; color:#a855f7; text-align:center; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <span>WEEKLY RESET IN:</span>
              <strong style="color:#ffffff;">${weeklyTimerStr}</strong>
            </div>`;

        leftPane.innerHTML =
          timerHtml +
          `
                          <div style="color:#64748b; font-style:italic; text-align:center; padding:30px 10px; font-size:10px; font-family:monospace; line-height:1.45;">
                            [ WEEKLY LOCK ]<br><br>
                            Clear Floor 12 (Sector 1 Boss) or reach Prestige to unlock Weekly Guild Quests.
                          </div>
                        `;
        rightPane.innerHTML = `
                          <div style="display:flex; flex-direction:column; text-align:left; gap:10px; height:100%; font-family:monospace;">
                            <div style="font-weight:900; font-size:13.5px; color:#e74c3c; border-bottom:1.5px solid rgba(231,76,60,0.3); padding-bottom:6px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">
                              Weekly Guild Contracts Locked
                            </div>
                            <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal;">
                              The Weekly Guild Board is currently bound by high-tier magical seals. To lift the seals and earn prestigious weekly sacks, you must complete either of the following milestones:
                            </p>
                            <div style="background:rgba(231,76,60,0.05); border:1px dashed #e74c3c; border-radius:6px; padding:10px; font-size:10.5px; line-height:1.4; color:#ff7675;">
                              • Clear Floor 12 (Defeat the Sector 1 Guardian Boss)
                            </div>
                            <button class="action-btn" style="width:100%; margin-top:auto; background:#1e293b; border-color:#334155; color:#64748b;" disabled>EXPEDITION UNDERWAY</button>
                          </div>
                        `;
        return;
      }

      let list = isWeekly
        ? window.playerStats.weeklyMissions || []
        : window.playerStats.dailyMissions || [];

      // Dynamic On-the-Fly Generator: If unlocked but empty, generate them immediately
      if (isWeekly && window.isWeeklyQuestUnlocked() && list.length === 0) {
        window.QuestSystem.generateWeeklyMissions();
        list = window.playerStats.weeklyMissions || [];
      }

      let timeDiffs = window.getPacificTimeDiffs
        ? window.getPacificTimeDiffs()
        : { dailyMs: 0, weeklyMs: 0 };
      let resetTimerStr = window.formatRemainingTime
        ? window.formatRemainingTime(
            isWeekly ? timeDiffs.weeklyMs : timeDiffs.dailyMs,
          )
        : "0s";
      let timerHtml = `<div style="background:rgba(${isWeekly ? "168,85,247" : "56,189,248"},0.06); border:1px solid rgba(${isWeekly ? "168,85,247" : "56,189,248"},0.2); border-radius:6px; padding:6px 10px; font-family:monospace; font-size:9.5px; color:${isWeekly ? "#a855f7" : "#00d2ff"}; text-align:center; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>${isWeekly ? "WEEKLY" : "DAILY"} RESET IN:</span>
            <strong style="color:#ffffff;">${resetTimerStr}</strong>
          </div>`;

      if (!list || list.length === 0) {
        leftPane.innerHTML =
          timerHtml +
          `<div style="color:#64748b; font-style:italic; text-align:center; padding:30px 10px; font-size:11px;">No active quests rolled. Check back after reset!</div>`;
        rightPane.innerHTML = `<div style="color:#64748b; font-style:italic; text-align:center; padding:30px 10px; font-size:11px;">Select a quest from the list.</div>`;
        return;
      }

      let selectedQuestId = getSelectedQuestId();
      if (!selectedQuestId || !list.some((q) => q.id === selectedQuestId)) {
        selectedQuestId = list[0].id;
        setSelectedQuestId(selectedQuestId);
      }

      let activeQuestId = selectedQuestId;

      // Render Left Pane (Quests List)
      let listMarkup = list
        .map((q) => {
          let isSelected = q.id === activeQuestId;
          let pct = Math.min(100, (q.current / q.target) * 100);

          let borderCol = isSelected ? "#38bdf8" : "#334155";
          let bgStyle = isSelected
            ? "background: rgba(56, 189, 248, 0.12);"
            : "background: rgba(15, 23, 42, 0.65);";

          let statusText = q.claimed
            ? `<span style="color:#64748b; font-size:8.5px; font-family:monospace; font-weight:bold;">[CLAIMED]</span>`
            : q.completed
              ? `<span style="color:#2ecc71; font-size:8.5px; font-family:monospace; font-weight:bold;">[COMPLETED]</span>`
              : `<span style="color:#94a3b8; font-size:8.5px; font-family:monospace;">${q.current.toLocaleString()} / ${q.target.toLocaleString()}</span>`;

          return `
                    <div class="bounty-ledger-row" style="${bgStyle} border-color:${borderCol}; border-left:4px solid ${q.completed ? "#10b981" : "#475569"}; padding:10px; margin-bottom:6px; border-radius:6px; cursor:pointer; transition:all 0.15s;" onclick="event.stopPropagation(); window.selectBountyQuest('${q.id}')">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:#f1f5f9; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px; text-align:left;">${q.desc.split(" (")[0]}</strong>
                        ${statusText}
                      </div>
                      <div class="gacha-pity-bg" style="width:100%; height:4px; margin-top:6px; background:#06040a;">
                        <div class="gacha-pity-fill" style="width:${pct}%; height:100%; background:${q.completed ? "#10b981" : "#38bdf8"};"></div>
                      </div>
                    </div>
                  `;
        })
        .join("");

      leftPane.innerHTML = timerHtml + listMarkup;

      // Render Right Pane (Selected Quest Details)
      let q = list.find((q) => q.id === activeQuestId);
      if (q) {
        let pct = Math.min(100, (q.current / q.target) * 100);
        let goldRewardText = window.formatNumber(BigNum.from(q.goldReward));
        let xpRewardText = window.formatNumber(BigNum.from(q.xpReward));

        let iconHtml = window.getUseIconHtml
          ? window.getUseIconHtml(q.treat, 40)
          : "";

        let claimBtnHtml = "";
        if (q.claimed) {
          claimBtnHtml = `<button class="action-btn" style="width:100%; margin-top:12px; background:#0f172a; border-color:#1e293b; color:#64748b;" disabled>REWARD CLAIMED</button>`;
        } else if (q.completed) {
          claimBtnHtml = `
                  <button class="action-btn" style="width:100%; margin-top:12px; background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#34d399;" onclick="event.stopPropagation(); window.claimQuestReward('${q.id}', ${isWeekly})">
                    CLAIM GUILD REWARD
                  </button>
                `;
        } else {
          claimBtnHtml = `<button class="action-btn" style="width:100%; margin-top:12px; background:#1e293b; border-color:#334155; color:#64748b;" disabled>QUEST IN PROGRESS</button>`;
        }

        rightPane.innerHTML = `
                <div style="display:flex; flex-direction:column; text-align:left; gap:10px; height:100%;">
                  <div>
                    <div style="font-weight:900; font-size:13.5px; color:#ffd700; border-bottom:1.5px solid rgba(212,175,55,0.3); padding-bottom:6px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.8px;">
                      ${isWeekly ? "WEEKLY GUILD QUEST" : "DAILY GUILD QUEST"}
                    </div>
                    <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal; font-family:monospace;">
                      ${q.desc}
                    </p>
                  </div>

                  <!-- Quest Progress Card -->
                  <div style="background:rgba(0,0,0,0.45); border:1px solid #334155; border-radius:6px; padding:10px; display:flex; flex-direction:column; gap:4px; font-family:monospace; font-size:9.5px;">
                    <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Current Progress:</span> <strong style="color:#38bdf8;">${q.current.toLocaleString()} / ${q.target.toLocaleString()}</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Completion Ratio:</span> <strong style="color:#2ecc71;">${Math.round(pct)}%</strong></div>
                    <div class="gacha-pity-bg" style="width:100%; height:6px; margin-top:4px; background:#06040a;">
                      <div class="gacha-pity-fill" style="width:${pct}%; height:100%; background:${q.completed ? "#10b981" : "#38bdf8"};"></div>
                    </div>
                  </div>

                  <!-- Reward Sacks Showcase -->
                  <div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.22); border:1.5px dashed rgba(255,255,255,0.06); padding:8px 10px; border-radius:6px; margin-top:4px;">
                    <div style="border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.02); padding:4px; border-radius:4px; display:flex; flex-shrink:0;">
                      ${iconHtml}
                    </div>
                    <div style="display:flex; flex-direction:column; text-align:left; min-width:0;">
                      <strong style="color:#f1c40f; font-size:10px; font-family:monospace; letter-spacing:0.5px;">${q.treat.toUpperCase()}</strong>
                      <span style="font-size:8.5px; color:#cbd5e1; line-height:1.25; font-family:monospace; white-space:normal;">Unlocks random scaled equipment, keys, or scraps upon consumption.</span>
                    </div>
                  </div>

                  <!-- Completion Rewards Card -->
                  <div style="background:rgba(0,0,0,0.3); border:1px dashed rgba(255,255,255,0.1); border-radius:6px; padding:8px 10px; text-align:left; font-family:monospace; font-size:10px; margin-top:auto;">
                    <strong style="color:#ffd700; display:block; margin-bottom:4px; font-size:9.5px; letter-spacing:0.5px;">[ QUEST GUILD REWARDS ]</strong>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                      <div style="color:#f1c40f;">+ ${goldRewardText} Gold Coins</div>
                      <div style="color:#c084fc;">+ ${xpRewardText} Experience (XP)</div>
                      <div style="color:#9b59b6;">+ ${q.treatQty || 1}x ${q.treat}</div>
                    </div>
                  </div>

                  ${claimBtnHtml}
                </div>
              `;
      }
    }
  }

  export function selectBounty(id) {
    setSelectedBountyId(id);
    window.renderBountyBoard();
  }

