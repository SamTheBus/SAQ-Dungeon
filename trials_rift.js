import { setCurrentGameState } from "./runtime_state.js?v=1.002";
import { getActiveDungeonMap } from "./dungeon_map.js?v=1.004";
import { setPrimaryMob } from "./encounter_state.js?v=1.004";

  export function openTrialsAltarModal() {
    let modal = document.getElementById("trials-altar-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "trials-altar-modal";
      modal.className = "modal-overlay";
      modal.style.display = "none";
      document.getElementById("game-container").appendChild(modal);

      modal.addEventListener("pointerdown", function (e) {
        if (e.target === modal) {
          e.stopPropagation();
          modal.style.display = "none";
          window.lastModalCloseTime = Date.now();
          if (typeof window.hideTooltip === "function") window.hideTooltip();
        }
      });
    }

    modal.style.display = "flex";

    if (window.state.trialsAltarActiveTab === undefined) {
      window.state.trialsAltarActiveTab = "onslaught";
    }
    if (window.playerStats.activeRiftLevel === undefined) {
      window.playerStats.activeRiftLevel = 1;
    }
    if (window.playerStats.selectedRiftGuardian === undefined) {
      window.playerStats.selectedRiftGuardian = "aegis_goliath";
    }

    let maxSelectableRift = Math.min(
      100,
      (window.playerStats.highestRiftLevelCleared || 0) + 1,
    );
    window.playerStats.activeRiftLevel = Math.min(
      maxSelectableRift,
      window.playerStats.activeRiftLevel || 1,
    );

    window.renderTrialsAltarModal();
  }

  export function switchTrialsAltarTab(tabKey) {
    window.state.trialsAltarActiveTab = tabKey;
    window.renderTrialsAltarModal();
  }

  export function changeRiftLevel(val) {
    let maxSelectableRift = Math.min(
      100,
      (window.playerStats.highestRiftLevelCleared || 0) + 1,
    );
    window.playerStats.activeRiftLevel = Math.max(
      1,
      Math.min(maxSelectableRift, parseInt(val, 10) || 1),
    );
    window.renderTrialsAltarModal();
  }

  export function changeRiftGuardian(val) {
    window.playerStats.selectedRiftGuardian = val;
    window.renderTrialsAltarModal();
  }

  export function renderTrialsAltarModal() {
    let modal = document.getElementById("trials-altar-modal");
    if (!modal) return;

    let activeTab = window.state.trialsAltarActiveTab || "onslaught";
    let isCrucibleUnlocked = (window.playerStats.maxFloorCleared || 0) >= 36;
    let isRiftsUnlocked = (window.playerStats.level || 1) >= 25;

    let tabsHtml = `
                  <div class="forge-mode-bar" style="margin-bottom: 12px; display: flex; gap: 6px;">
                    <button class="forge-mode-btn ${activeTab === "onslaught" ? "active" : ""}" onclick="window.switchTrialsAltarTab('onslaught')" style="flex: 1;">
                      ONSLAUGHT ARENA
                    </button>
                    <button class="forge-mode-btn ${activeTab === "rifts" ? "active" : ""}" onclick="window.switchTrialsAltarTab('rifts')" style="flex: 1;">
                      RIFT GUARDIAN TRIALS
                    </button>
                  </div>
                `;

    let contentHtml = "";

    if (activeTab === "onslaught") {
      if (!isCrucibleUnlocked) {
        contentHtml = `
                      <div style="padding: 30px; text-align: center; color: #94a3b8; font-family: monospace; font-size: 11px; line-height: 1.5; border: 1.5px dashed #475569; border-radius: 6px; background: rgba(0,0,0,0.22); margin-top: 10px;">
                        <span style="color: #ef4444; font-weight: bold; display: block; margin-bottom: 6px; font-size: 12px;">[ ONSLAUGHT LOCKED ]</span>
                        The Arena remains sealed under covenant locks.<br>
                        Defeat the Sector 3 Overlord (Clear Floor 36) to claim access.
                      </div>
                    `;
      } else {
        let maxPeak = window.playerStats.cruciblePeak || 1;
        let selectedWave = window.playerStats.crucibleStartWave || 1;

        let waveOptions = [1];
        for (let wave = 5; wave <= maxPeak; wave += 5) {
          waveOptions.push(wave);
        }
        waveOptions = Array.from(new Set(waveOptions)).sort((a, b) => a - b);

        let optionsMarkup = waveOptions
          .map((w) => {
            let isSelected = w === selectedWave ? "selected" : "";
            let tag = w === 1 ? "Initiation Wave" : `Wave ${w}`;
            return `<option value="${w}" ${isSelected}>Wave ${w} (${tag})</option>`;
          })
          .join("");

        let dividend = window.calculateCumulativeOnslaughtShards(selectedWave);

        contentHtml = `
                      <div class="trials-altar-layout">
                        <!-- Left Column: Controls -->
                        <div class="trials-pane">
                          <div class="deploy-pane-header">
                            <span>ARENA CONFIGURATION</span>
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 4px; text-align: left; font-family: monospace;">
                            <label style="font-weight: bold; color: #94a3b8; font-size: 8.5px;">STARTING WAVE MILESTONE</label>
                            <select id="deploy-wave-select" class="wave-milestone-select" onchange="window.changeOnslaughtStartWave(this.value)" style="background: #1a1523; border: 1.5px solid #581c87; color: #e9d5ff; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 11px; width: 100%; outline: none; cursor: pointer;">
                              ${optionsMarkup}
                            </select>
                          </div>

                          ${
                            selectedWave > 1
                              ? `
                          <div style="background: rgba(168, 85, 247, 0.08); border: 1.5px dashed rgba(168,85,247,0.25); border-radius: 6px; padding: 10px; line-height: 1.4; color: #e9d5ff; font-family: monospace; font-size: 9.5px; text-align: left;">
                            <strong style="color: #ffd700; display: block; margin-bottom: 4px;">[70% SKIP DIVIDEND]</strong>
                            <span>Instant starting rewards:</span>
                            <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                              <div style="color: #00ffff;">+ ${dividend.shards.toLocaleString()} Shards</div>
                              <div style="color: #ffd700;">+ ${window.formatNumber(dividend.gold)} Gold</div>
                              <div style="color: #c084fc;">+ ${window.formatNumber(dividend.xp)} XP</div>
                            </div>
                          </div>
                          `
                              : ""
                          }
                        </div>

                        <!-- Right Column: Details & Launch -->
                        <div class="trials-pane" style="justify-content: space-between;">
                          <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
                            <div class="deploy-pane-header">
                              <span>TRIAL OVERVIEW</span>
                            </div>
                            <p style="font-size: 10.5px; color: #cbd5e1; line-height: 1.5; margin: 0; font-family: monospace;">
                              Enter the infinite onslaught arena. Test your survival limitations against scaling hordes of localized sector monsters.
                            </p>
                            <div style="background: rgba(0, 0, 0, 0.35); border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 8px 10px; font-family: monospace; font-size: 9.5px; color: #94a3b8; line-height: 1.45;">
                              <strong style="color: #a855f7; display: block; margin-bottom: 2px;">[ARENA CONDITIONS]</strong>
                              • Slay all wave targets to progress.<br>
                              • Draft upgrades are active every 5 waves.<br>
                              • No equipment loss on failure.
                            </div>
                          </div>

                          <button class="action-btn" style="width: 100%; margin: 0;" onclick="window.launchOnslaughtArena()">
                            LAUNCH ONSLAUGHT ARENA
                          </button>
                        </div>
                      </div>
                    `;
      }
    } else {
      if (!isRiftsUnlocked) {
        contentHtml = `
                      <div style="padding: 30px; text-align: center; color: #94a3b8; font-family: monospace; font-size: 11px; line-height: 1.5; border: 1.5px dashed #475569; border-radius: 6px; background: rgba(0,0,0,0.22); margin-top: 10px;">
                        <span style="color: #ef4444; font-weight: bold; display: block; margin-bottom: 6px; font-size: 12px;">[ TRIALS LOCKED ]</span>
                        The Rift Altar remains bound by high-tier magical seals.<br>
                        Reach Character Level 25 to initiate the trial summons.
                      </div>
                    `;
      } else {
        let L = window.playerStats.activeRiftLevel || 1;
        let selectedGuardian =
          window.playerStats.selectedRiftGuardian || "aegis_goliath";
        let coresCount =
          (window.inventory &&
            window.inventory.ETC &&
            window.inventory.ETC["Ancient Core"]) ||
          0;
        let canAfford = coresCount >= 1;

        let repScale = Math.pow(1.05, 35);
        let baseHp =
          selectedGuardian === "aegis_goliath"
            ? 400
            : selectedGuardian === "chronos_arbitrator"
              ? 300
              : 350;
        let baseAtk =
          selectedGuardian === "aegis_goliath"
            ? 18
            : selectedGuardian === "chronos_arbitrator"
              ? 22
              : 20;

        let hpScalar = (1 + 0.15 * L) * Math.pow(1.08, L);
        let atkScalar = (1 + 0.08 * L) * Math.pow(1.05, L);

        let projectedHp = Math.round(baseHp * repScale * hpScalar);
        let projectedAtk = Math.round(baseAtk * repScale * atkScalar);

        let xpReward = Math.round(250 * Math.pow(L, 0.85));
        let shardsReward = Math.floor(15 + 3.0 * L);
        let dustReward = Math.floor(30 + 6.0 * L);
        let coreMin = Math.floor(L / 10);
        let coreMaxChance = (L % 10) * 10;
        let essenceChance = Math.min(100, Math.round((0.05 + 0.018 * L) * 100));

        let subweaponType = "none";
        if (window.equippedSlots && window.equippedSlots.subweapon) {
          let sub = window.equippedSlots.subweapon;
          subweaponType = sub.subType || sub.type || "none";
        }
        let isMasteryActive = ["shield", "dagger", "tome"].includes(
          subweaponType,
        );
        let masteryLabel = isMasteryActive
          ? subweaponType.toUpperCase() + " MASTERY"
          : "ACTIVE SUBWEAPON";

        contentHtml = `
                      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 6px 12px; margin-bottom: 10px; font-family: monospace; font-size: 10.5px;">
                        <span style="color: #94a3b8; font-weight: bold;">PORTAL BALANCE:</span>
                        <strong style="color: #ffd700;">${coresCount} Ancient Cores</strong>
                      </div>

                      <div class="trials-altar-layout">
                        <!-- Left Column: Selection Panel -->
                        <div class="trials-pane">
                          <div class="deploy-pane-header">
                            <span>GUARDIAN SELECT</span>
                          </div>

                          <div style="display: flex; flex-direction: column; gap: 5px;">
                            <button class="trial-selection-btn ${selectedGuardian === "aegis_goliath" ? "active" : ""}" onclick="window.changeRiftGuardian('aegis_goliath')">
                              AEGIS GOLIATH
                            </button>
                            <button class="trial-selection-btn ${selectedGuardian === "chronos_arbitrator" ? "active" : ""}" onclick="window.changeRiftGuardian('chronos_arbitrator')">
                              CHRONOS ARBITRATOR
                            </button>
                            <button class="trial-selection-btn ${selectedGuardian === "nexus_overseer" ? "active" : ""}" onclick="window.changeRiftGuardian('nexus_overseer')">
                              NEXUS OVERSEER
                            </button>
                          </div>

                          <div style="border-top: 1px dashed rgba(255,255,255,0.08); margin-top: 6px; padding-top: 6px;"></div>

                          <div style="display: flex; flex-direction: column; gap: 2px; text-align: left; font-family: monospace;">
                                            <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; font-weight: bold;">
                                              <span>RIFT LEVEL:</span>
                                              <strong style="color: #00ffff;">Level ${L}</strong>
                                            </div>
                                            <input type="range" min="1" max="${Math.min(100, (window.playerStats.highestRiftLevelCleared || 0) + 1)}" value="${L}" style="width: 100%; accent-color: #a855f7; margin-top: 2px;" oninput="window.changeRiftLevel(this.value)">
                                          </div>

                                          ${(function () {
                                            let maxSelectable = Math.min(
                                              100,
                                              (window.playerStats
                                                .highestRiftLevelCleared || 0) +
                                                1,
                                            );
                                            if (
                                              L >= maxSelectable &&
                                              maxSelectable < 100
                                            ) {
                                              return `
                                                <div style="color: #f1c40f; font-size: 8px; font-family: monospace; font-weight: bold; text-align: center; margin-top: 6px; background: rgba(241,196,15,0.06); padding: 4px; border-radius: 4px; border: 1px dashed rgba(241,196,15,0.3); line-height: 1.25;">
                                                  Clear Level ${maxSelectable} to unlock Level ${maxSelectable + 1}
                                                </div>
                                              `;
                                            } else if (maxSelectable >= 100) {
                                              return `
                                                <div style="color: #2ecc71; font-size: 8px; font-family: monospace; font-weight: bold; text-align: center; margin-top: 6px; line-height: 1.25;">
                                                  Max Difficulty Unlocked!
                                                </div>
                                              `;
                                            }
                                            return "";
                                          })()}
                                        </div>

                        <!-- Right Column: Stats & Projected Rewards -->
                        <div class="trials-pane" style="justify-content: space-between;">
                          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; font-family: monospace; font-size: 9.5px;">
                            <div class="deploy-pane-header">
                              <span>TRIAL PROJECTIONS</span>
                            </div>

                            <div style="background: rgba(0,0,0,0.3); border: 1px solid #1e293b; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2.5px;">
                              <div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Health:</span> <strong style="color:#ffffff;">${window.formatNumber(projectedHp)} HP</strong></div>
                              <div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Attack:</span> <strong style="color:#ef4444;">${window.formatNumber(projectedAtk)} ATK</strong></div>
                            </div>

                            <div style="background: rgba(16, 12, 28, 0.4); border: 1.5px dashed rgba(168,85,247,0.25); border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 2px;">
                              <strong style="color: #ffd700; display: block; margin-bottom: 2px; font-size: 8.5px; letter-spacing: 0.5px;">[ EXPECTED PAYLOAD ]</strong>
                              <div style="display: flex; justify-content: space-between;"><span style="color:#c084fc;">${masteryLabel} XP:</span> <strong style="color:#ffffff;">+${xpReward.toLocaleString()} XP</strong></div>
                              <div style="display: flex; justify-content: space-between;"><span style="color:#00ffff;">Astral Shards:</span> <strong style="color:#00ffff;">+${shardsReward.toLocaleString()}</strong></div>
                              <div style="display: flex; justify-content: space-between;"><span style="color:#a855f7;">Astral Dust:</span> <strong style="color:#a855f7;">+${dustReward.toLocaleString()}</strong></div>
                              <div style="display: flex; justify-content: space-between;">
                                <span style="color:#2ecc71;">Catalyst Cores:</span>
                                <strong style="color:#2ecc71;">
                                  +${coreMin}${coreMaxChance > 0 ? ` (${coreMaxChance}% for +1)` : ""}
                                </strong>
                              </div>
                              <div style="display: flex; justify-content: space-between;"><span style="color:#df9ffb;">Astral Essence:</span> <strong style="color:#df9ffb;">${essenceChance}% Chance</strong></div>
                            </div>

                            ${
                              !isMasteryActive
                                ? `
                            <div style="background: rgba(239, 68, 60, 0.08); border: 1px dashed #ef4444; border-radius: 4px; padding: 4px 8px; font-size: 7.5px; color: #f87171; line-height: 1.2; margin-top: 2px;">
                              [!] No active subweapon equipped. You will not earn Mastery XP!
                            </div>`
                                : ""
                            }
                          </div>

                          <button id="btn-rift-summon" class="action-btn" style="width: 100%; margin: 0;" ${canAfford ? "" : "disabled"} onclick="window.executeRiftSummon()">
                            SUMMON RIFT GUARDIAN
                          </button>
                        </div>
                      </div>
                    `;
      }
    }

    modal.innerHTML = `
                  <div class="modal-card trials-altar-card" style="box-sizing: border-box;">
                    <div class="modal-header">
                      <span>Altar of Trials</span>
                      <button class="close-btn" onclick="document.getElementById('trials-altar-modal').style.display='none'; window.lastModalCloseTime = Date.now();">CLOSE</button>
                    </div>
                    <div class="modal-body" style="overflow-y: auto;">
                      ${tabsHtml}
                      ${contentHtml}
                    </div>
                  </div>
                `;
  }

  export function launchOnslaughtArena() {
    let modal = document.getElementById("trials-altar-modal");
    if (modal) modal.style.display = "none";

    window.playerStats.activePortalEvent = "onslaught";
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "Portal primed! Step into the Portal to initiate Onslaught.",
        "#a855f7",
      );
    }
  }

  export function executeRiftSummon() {
    let coresCount =
      (window.inventory &&
        window.inventory.ETC &&
        window.inventory.ETC["Ancient Core"]) ||
      0;
    if (coresCount < 1) {
      window.pushHeaderToast(
        "[X] You need at least 1x Ancient Core to summon a Rift Guardian!",
        "#ef4444",
      );
      return;
    }

    // Deduct exactly 1x Ancient Core
    window.inventory.ETC["Ancient Core"]--;
    if (window.inventory.ETC["Ancient Core"] <= 0) {
      delete window.inventory.ETC["Ancient Core"];
    }

    let modal = document.getElementById("trials-altar-modal");
    if (modal) modal.style.display = "none";

    window.playerStats.activePortalEvent = "rift";

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "Rift Summon primed! Step into the Portal to begin the duel.",
        "#00ffff",
      );
    }
  }

  export function launchRiftDuel() {
    // Configure Rift State
    window.playerStats.isRiftMode = true;
    window.playerStats.isCrucibleMode = false;
    window.playerStats.activeSpecialChallenge = null;
    window.playerStats.activeDungeonSigil = null;

    // Clear active primed event
    window.playerStats.activePortalEvent = "expedition";

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }
    if (window.combatVisuals) {
      let p = window.player;
      if (p) {
        window.combatVisuals.spawnBeam(p.x, "#a855f7", 60, true);
        window.combatVisuals.spawnParticles(
          p.x,
          p.y,
          30,
          "calamity_specter",
          5.0,
        );
        window.combatVisuals.triggerScreenShake(8, 14);
      }
    }

    // Start Dungeon Run on Floor 84 Baseline parameters
    setCurrentGameState(window.GAME_STATES.DUNGEON);
    window.player.depth = 84;
    window.player.bag = [];
    window.fatiguePenalty = 0;
    window.playerStats.abyssalDecayAccumulated = 0;

    if (typeof window.refillFlaskCharges === "function") {
      window.refillFlaskCharges(true);
    }

    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }

    window.loadDungeonFloor(window.player.depth);
  }

  export function spawnRiftGuardianEncounter(tileX, tileY) {
    let map = getActiveDungeonMap();
    let tileSize = map ? map.tileSize : 32;
    let L = window.playerStats.activeRiftLevel || 1;
    let type = window.playerStats.selectedRiftGuardian || "aegis_goliath";

    let baseHp = BigNum.from(
      type === "aegis_goliath"
        ? 400
        : type === "chronos_arbitrator"
          ? 300
          : 350,
    );
    let baseAtk = BigNum.from(
      type === "aegis_goliath" ? 18 : type === "chronos_arbitrator" ? 22 : 20,
    );

    let repScale = BigNum.from(1.05).pow(35);
    let hpDiffGrowth = BigNum.from(1.08).pow(L);
    let hpLinearScale = BigNum.from(1 + 0.15 * L);

    let atkDiffGrowth = BigNum.from(1.05).pow(L);
    let atkLinearScale = BigNum.from(1 + 0.08 * L);

    let finalHp = baseHp.mul(repScale).mul(hpDiffGrowth).mul(hpLinearScale);
    let finalAtk = baseAtk.mul(repScale).mul(atkDiffGrowth).mul(atkLinearScale);

    let bossName =
      type === "aegis_goliath"
        ? "Aegis Goliath"
        : type === "chronos_arbitrator"
          ? "Chronos Arbitrator"
          : "Nexus Overseer";

    setPrimaryMob({
      id: window.idCounter++,
      type: "dungeon_boss",
      name: bossName + ` (Rift Lvl ${L})`,
      visualType: type,
      hp: finalHp,
      maxHp: finalHp,
      atk: finalAtk.toFiniteNumber(Number.MAX_VALUE / 16),
      x: tileX * tileSize - 16,
      y: tileY * tileSize - 16,
      w: 64,
      h: 64,
      flashTimer: 0,
      isStopped: false,
      bossTileX: tileX,
      bossTileY: tileY,
      state: "idle",
      telegraphTimer: 0,
      maxTelegraphTimer: 65,
      activeAbility: null,
      targetX: 0,
      targetY: 0,
      attackCooldown: 60,
      moveset:
        type === "aegis_goliath"
          ? ["magnetic_pull", "boomerang_shield", "shield_bash"]
          : type === "chronos_arbitrator"
            ? ["slam", "dilation_field"]
            : ["slam", "control_glitch"],
      facing: -1,
      isRiftGuardian: true,
    });

    window.spawnFloatingText(
      window.player.x,
      window.player.y - 25,
      `${bossName.toUpperCase()} AWAKENED`,
      "#ff007f",
    );
  }

