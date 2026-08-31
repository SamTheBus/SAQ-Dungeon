import {
  getIsGamePaused,
  setCurrentGameState,
  setGamePaused,
} from "./runtime_state.js?v=1.002";
import {
  addActiveDungeonMob,
  resetEncounterState,
  setActiveDungeonMobs,
  setPrimaryMob,
} from "./encounter_state.js?v=1.004";
import { resetCombatHazardRuntimeState } from "./combat_hazards.js?v=1.035";
import {
  calculateEmergencySalvageGold,
  shouldResolveInterruptedDungeonRun,
} from "./run_recovery.js?v=1.002";

  export const loadHub = function () {
    const resolvedInterruptedRun = shouldResolveInterruptedDungeonRun(
      window.playerStats,
      window.player,
    );
    if (resolvedInterruptedRun) {
      // Map/combat state is intentionally not persisted, so an interrupted run
      // cannot be resumed safely. Resolve it through the normal abandon rules
      // before any hub initialization can touch carried loot.
      triggerExtraction(false, true);
    }

    if (window.nemesisAnimFrameId) {
      cancelAnimationFrame(window.nemesisAnimFrameId);
      window.nemesisAnimFrameId = null;
    }
    setCurrentGameState(window.GAME_STATES.HUB);
    window.playerStats.isCrucibleMode = false;
    window.playerStats.robbingMarcusActive = false;
    window.deathAnimationTimer = 0;
    resetCombatHazardRuntimeState();
    window.playerStats.abyssalDecayAccumulated = 0; // Clear accumulated siphoned HP

    // Clear active dungeon combat entities and gold particles
    resetEncounterState();
    window.goldParticles = [];
    window.heartOrbs = [];
    window.projectiles = [];
    if (window.activeDungeonMap) {
      window.activeDungeonMap.openedChests = new Set();
    }

    // Vacuum uncollected ground loot and materials on hub load
    if (window.groundLoot && window.groundLoot.length > 0) {
      window.groundLoot.forEach((gl) => {
        if (gl && gl.item) {
          let isEquipped = window.tryAutoEquip
            ? window.tryAutoEquip(gl.item)
            : false;
          if (!isEquipped && window.player) {
            if (gl.item.type === "artifact") {
              if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
              window.inventory.ARTIFACT.push(gl.item);
            } else {
              if (!window.player.stash) window.player.stash = [];
              window.player.stash.push(gl.item);
            }
          }
        }
      });
      window.groundLoot = [];
    }

    if (window.groundMaterials && window.groundMaterials.length > 0) {
      window.groundMaterials.forEach((gm) => {
        if (gm) {
          if (gm.name === "Luminous Soul" || gm.name.includes("Key")) {
            window.addEtcDrop(gm.name, gm.qty, true);
          } else if (window.player) {
            if (!window.player.pendingScraps) window.player.pendingScraps = {};
            window.player.pendingScraps[gm.name] =
              (window.player.pendingScraps[gm.name] || 0) + gm.qty;
          }
        }
      });
      window.groundMaterials = [];
    }

    let summaryModal = document.getElementById("summary-modal");
    if (summaryModal && !resolvedInterruptedRun) {
      summaryModal.style.display = "none";
    }

    let map = window.activeDungeonMap.generateHub();
    let tileSize = map.tileSize;

    window.player.hp = window.player.maxHp;
    if (typeof window.refillFlaskCharges === "function") {
      window.refillFlaskCharges(true);
    }
    window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
    window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;

    // Trigger Altar Shattering animation upon first return to Hub after clearing Floor 36
    if (
      (window.playerStats.maxFloorCleared || 0) >= 36 &&
      !window.playerStats.hasTriggeredOnslaughtUnlock
    ) {
      window.playerStats.hasTriggeredOnslaughtUnlock = true;
      if (typeof window.triggerOnslaughtShatterAnimation === "function") {
        window.triggerOnslaughtShatterAnimation();
      }
    }

    if (!window.inventory)
          window.inventory = {
            EQUIP: [],
            ARTIFACT: [],
            SIGIL: [],
            ETC: {},
            USE: {},
          };
        if (!window.player.stash || window.player.stash.length === 0) {
          window.player.stash = window.inventory.EQUIP || [];
        }
        window.inventory.EQUIP = window.player.stash;

        if (!window.equippedSlots.weapon) {
          let stashWeaponIdx = window.player.stash.findIndex((i) => i.type === "weapon");
          if (stashWeaponIdx !== -1) {
            let w = window.player.stash.splice(stashWeaponIdx, 1)[0];
            window.equippedSlots.weapon = w;
            w.isEquippedSlot = "weapon";
          } else {
            let starterSword = window.createItemObject("weapon", 0, 1, 0);
            starterSword.noun = "Broadsword";
            starterSword.name = "Novice Blade (Starter)";
            starterSword.isStarterItem = true;
            starterSword.isEquippedSlot = "weapon";
            window.equippedSlots.weapon = starterSword;
          }
        }

    window.updateHUD();
    window.spawnFloatingText(
      window.player.x,
      window.player.y - 20,
      "ADVENTURER'S HUB",
      "#00d2ff",
    );
  };

  export const enterDungeonRun = function (startFloor = 1) {
    setCurrentGameState(window.GAME_STATES.DUNGEON);
    window.playerStats.dungeonRunInProgress = true;
    let startFloorNum = Math.max(1, Number(startFloor) || 1);
    window.player.depth = startFloorNum;
    window.player.bag = [];
    window.playerStats.robbingMarcusActive = false;
    window.playerStats.abyssalDecayAccumulated = 0; // Clear accumulated siphoned HP

    if (typeof window.refillFlaskCharges === "function") {
      window.refillFlaskCharges(true);
    }

    let st = window.SkillTreeManager;
        let starterStageScale = window.getFloorItemLevel ? window.getFloorItemLevel(startFloorNum) : Math.floor(startFloorNum / 4) + 1;

    // 1. Offhand Starter Provisioning
    let activeStarter = window.playerStats
      ? window.playerStats.activeStarterSubweapon
      : "none";
    if (
      activeStarter &&
      activeStarter !== "none" &&
      window.equippedSlots &&
      !window.equippedSlots.subweapon
    ) {
      let starterItem = window.createItemObject(
        activeStarter,
        0,
        starterStageScale,
        0,
      );
      starterItem.name = `Starter ${activeStarter.charAt(0).toUpperCase() + activeStarter.slice(1)}`;
      starterItem.isStarterItem = true;
      window.equippedSlots.subweapon = starterItem;
      starterItem.isEquippedSlot = "subweapon";
    }

    // 2. Main Hand Weapon Provisioning (utility_start_weapon: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
    if (st && window.equippedSlots && !window.equippedSlots.weapon) {
      let weapRank = st.getSkillLevel("utility_start_weapon");
      if (weapRank > 0) {
        let stars = Math.min(2, weapRank - 1);
        let item = window.createItemObject(
          "weapon",
          stars,
          starterStageScale,
          0,
        );
        item.noun = "Broadsword"; // Aligns graphic asset with "Blade" nomenclature
        item.name = `Provisioned ${window.getTierName(stars)} Blade`;
        item.isStarterItem = true;
        window.equippedSlots.weapon = item;
        item.isEquippedSlot = "weapon";
      }
    }

    // 3. Chest/Overall Armor Provisioning (utility_start_armor: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
    if (
      st &&
      window.equippedSlots &&
      !window.equippedSlots.chest &&
      !window.equippedSlots.overall
    ) {
      let armorRank = st.getSkillLevel("utility_start_armor");
      if (armorRank > 0) {
        let stars = Math.min(2, armorRank - 1);
        let item = window.createItemObject(
          "overall",
          stars,
          starterStageScale,
          0,
        );
        item.name = `Provisioned ${window.getTierName(stars)} Plate Suit`;
        item.isStarterItem = true;

        // Safe unequip of leggings if equipped to prevent slot overlap
        if (window.equippedSlots.leggings) {
          let leggingsItem = window.equippedSlots.leggings;
          delete leggingsItem.isEquippedSlot;
          if (!window.player.stash) window.player.stash = [];
          window.player.stash.push(leggingsItem);
          window.equippedSlots.leggings = null;
        }

        window.equippedSlots.overall = item;
        item.isEquippedSlot = "overall";
      }
    }

    // 4. Helmet & Boots Provisioning (utility_start_head_feet)
    if (st && window.equippedSlots) {
      let hfRank = st.getSkillLevel("utility_start_head_feet");
      if (hfRank > 0) {
        let stars = Math.min(2, hfRank - 1);
        if (!window.equippedSlots.helmet) {
          let helm = window.createItemObject(
            "helmet",
            stars,
            starterStageScale,
            0,
          );
          helm.name = `Provisioned ${window.getTierName(stars)} Helm`;
          helm.isStarterItem = true;
          window.equippedSlots.helmet = helm;
          helm.isEquippedSlot = "helmet";
        }
        if (!window.equippedSlots.boots) {
          let boots = window.createItemObject(
            "boots",
            stars,
            starterStageScale,
            0,
          );
          boots.name = `Provisioned ${window.getTierName(stars)} Boots`;
          boots.isStarterItem = true;
          window.equippedSlots.boots = boots;
          boots.isEquippedSlot = "boots";
        }
      }
    }

    // 5. Ring Provisioning (utility_start_ring)
    if (st && window.equippedSlots) {
      let ringRank = st.getSkillLevel("utility_start_ring");
      if (ringRank > 0) {
        let stars = Math.min(2, ringRank - 1);
        if (!window.equippedSlots.ring1) {
          let ring1 = window.createItemObject(
            "ring",
            stars,
            starterStageScale,
            0,
          );
          ring1.name = `Provisioned ${window.getTierName(stars)} Band`;
          ring1.isStarterItem = true;
          window.equippedSlots.ring1 = ring1;
          ring1.isEquippedSlot = "ring1";
        }
        if (!window.equippedSlots.ring2) {
          let ring2 = window.createItemObject(
            "ring",
            stars,
            starterStageScale,
            0,
          );
          ring2.name = `Provisioned ${window.getTierName(stars)} Signet`;
          ring2.isStarterItem = true;
          window.equippedSlots.ring2 = ring2;
          ring2.isEquippedSlot = "ring2";
        }
      }
    }

    // Hook 2: Field Medic Run-Long Basic Elixir Effects
    if (window.SkillTreeManager) {
      let medicRank = window.SkillTreeManager.getSkillLevel("utility_elixir");
      if (medicRank > 0) {
        const basicElixirs = [
          {
            key: "atkPotionRuns",
            name: "Attack Elixir (+10% Atk)",
            strKey: "atkPotionStrength",
            val: 0.1,
            color: "#2ecc71",
          },
          {
            key: "hpPotionRuns",
            name: "Vitality Elixir (+10% Max HP)",
            strKey: "hpPotionStrength",
            val: 0.1,
            color: "#e74c3c",
          },
          {
            key: "defPotionRuns",
            name: "Armored Elixir (+10% Def)",
            strKey: "defPotionStrength",
            val: 0.1,
            color: "#3498db",
          },
          {
            key: "hastePotionRuns",
            name: "Haste Elixir (+10% Speed)",
            strKey: "hastePotionStrength",
            val: 1,
            color: "#f1c40f",
          },
        ];

        const basicElixirKeys = [
          "atkPotionRuns",
          "hpPotionRuns",
          "defPotionRuns",
          "hastePotionRuns",
        ];

        // Only trigger Field Medic if the player does NOT already have any active premium/consumed elixirs
        let hasActiveElixir = basicElixirKeys.some(
          (k) =>
            (window.playerStats[k] || 0) > 0 ||
            (window.playerStats[k.replace("Runs", "Timer")] || 0) > 0,
        );

        if (!hasActiveElixir) {
          // Clear any lingering Field Medic elixirs from previous runs to enforce exactly 1 active elixir limit
          basicElixirKeys.forEach((k) => {
            window.playerStats[k] = 0;
          });

          let shuffled = [...basicElixirs].sort(() => Math.random() - 0.5);
          let pot = shuffled[0]; // Select exactly 1 random elixir effect

          // Set the runs duration to exactly 1 run
          window.playerStats[pot.key] = 1;

          // Scale the potion's potency linearly based on the purchased rank (Rank 1: +10%, Rank 2: +15%, Rank 3: +20%)
          let strength =
            pot.key === "hastePotionRuns"
              ? 1 + (medicRank - 1) * 0.5
              : 0.1 + (medicRank - 1) * 0.05;

          window.playerStats[pot.strKey] = strength;

          let pctText =
            pot.key === "hastePotionRuns"
              ? `+${Math.round(strength * 10)}% Speed`
              : `+${Math.round(strength * 100)}% ${pot.key === "atkPotionRuns" ? "Atk" : pot.key === "hpPotionRuns" ? "Max HP" : "Def"}`;
          let potName = `${pot.key === "atkPotionRuns" ? "Attack" : pot.key === "hpPotionRuns" ? "Vitality" : pot.key === "defPotionRuns" ? "Armored" : "Haste"} Elixir (${pctText})`;

          let appliedNames = [potName];

          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `✦ Field Medic Active: ${appliedNames.join(", ")}!`,
              "#34d399",
            );
          }
        }
      }
    }

    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }

    window.loadDungeonFloor(window.player.depth);
  };

  export const openHubPortalModal = function () {
    let modal = document.getElementById("deployment-modal");
    if (!modal) return;

    let checkpoints = window.playerStats.unlockedCheckpoints || [1];
    window.state.deploymentFloor = checkpoints[checkpoints.length - 1] || 1;
    window.state.selectedDeploymentSigilId = null;

    modal.style.display = "flex";

    let isCrucible = window.playerStats.isCrucibleMode;
    let isChallenge = window.playerStats.activeSpecialChallenge !== null;
    let titleEl = document.getElementById("deploy-modal-title");
    let subtitleEl = document.getElementById("deploy-modal-subtitle");
    let tabBtnExchange = document.getElementById("deploy-tab-btn-exchange");
    let tabBtnSetup = document.getElementById("deploy-tab-btn-setup");
    let tabContainer = document.querySelector(".deploy-tab-bar");

    if (isCrucible) {
      if (titleEl) titleEl.innerText = "ONSLAUGHT ALTAR";
      if (subtitleEl) subtitleEl.innerText = "CHALLENGE THE ONSLAUGHT ARENA";
      if (tabBtnSetup) tabBtnSetup.innerText = "ARENA SETUP";
      if (tabBtnExchange) tabBtnExchange.style.display = "inline-block";
      if (tabContainer) {
        tabContainer.style.display = ""; // Reset inline override to use stylesheet layout
      }
    } else if (isChallenge) {
      if (titleEl) titleEl.innerText = "SPECIAL CHALLENGE ALTAR";
      if (subtitleEl) subtitleEl.innerText = "PREPARE FOR DANGEROUS DESCENT";
      if (tabBtnExchange) tabBtnExchange.style.display = "none";
      if (tabContainer) {
        tabContainer.style.display = "none"; // Hide tab bar
      }
    } else {
      if (titleEl) titleEl.innerText = "DUNGEON EXPEDITION ALTAR";
      if (subtitleEl) subtitleEl.innerText = "PREPARE FOR DUNGEON DESCENT";
      if (tabBtnSetup) tabBtnSetup.innerText = "EXPEDITION SETUP";
      if (tabBtnExchange) tabBtnExchange.style.display = "none";
      if (tabContainer) {
        tabContainer.style.display = "none"; // Hide entire tab bar in standard campaign
      }
    }

    if (typeof window.switchDeployTab === "function") {
      window.switchDeployTab("setup");
    } else {
      window.renderDeploymentModal();
    }
  };

  export const switchDeployTab = function (tabKey) {
    let setupBtn = document.getElementById("deploy-tab-btn-setup");
    let exchangeBtn = document.getElementById("deploy-tab-btn-exchange");
    let setupContent = document.getElementById("deploy-setup-content");
    let exchangeContent = document.getElementById("deploy-exchange-content");

    if (tabKey === "setup") {
      if (setupBtn) setupBtn.classList.add("active");
      if (exchangeBtn) exchangeBtn.classList.remove("active");
      if (setupContent) {
        setupContent.style.display = "block";
        setupContent.classList.remove("hidden");
      }
      if (exchangeContent) {
        exchangeContent.style.display = "none";
        exchangeContent.classList.add("hidden");
      }
      window.renderDeploymentModal();
    } else {
      if (setupBtn) setupBtn.classList.remove("active");
      if (exchangeBtn) exchangeBtn.classList.add("active");
      if (setupContent) {
        setupContent.style.display = "none";
        setupContent.classList.add("hidden");
      }
      if (exchangeContent) {
        exchangeContent.style.display = "flex";
        exchangeContent.classList.remove("hidden");
      }
      window.renderAstralShop();
    }
  };

  export const renderAstralShop = function () {
    let grid = document.getElementById("astral-shop-grid");
    let display = document.getElementById("astral-shards-display");
    if (display) {
      display.innerText = (
        window.playerStats.astralShards || 0
      ).toLocaleString();
    }
    if (!grid) return;

    let stock = window.ASTRAL_SHOP_STOCK || [];
    let ownedShards = window.playerStats.astralShards || 0;

    grid.innerHTML = stock
      .map((item, idx) => {
        let canAfford = ownedShards >= item.cost;
        let isPurchased = false;

        if (item.isTitle) {
          let unlocked = window.playerStats.unlockedTitles || [];
          if (unlocked.includes("astral_conqueror")) {
            isPurchased = true;
          }
        }

        let btnHtml = "";
        if (isPurchased) {
          btnHtml = `<button class="astral-buy-btn" style="background: #334155;" disabled>OWNED</button>`;
        } else {
          btnHtml = `<button class="astral-buy-btn" ${canAfford ? "" : "disabled"} onclick="window.buyAstralShopItem(${idx})">
            BUY (${item.cost})
          </button>`;
        }

        return `
          <div class="astral-shop-card" style="border-left: 3px solid ${item.color || "#a855f7"};">
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
              <span class="astral-shop-cost">${item.cost} Shards</span>
              ${btnHtml}
            </div>
          </div>
        `;
      })
      .join("");
  };

  export const openDeploymentModal = function (startFloor) {
    window.openHubPortalModal();
  };

  export const changeDeploymentFloor = function (floorVal) {
    window.state.deploymentFloor = parseInt(floorVal, 10) || 1;
    window.renderDeploymentModal();
  };

  export const changeDeploymentSigil = function (sigilIdVal) {
    window.state.selectedDeploymentSigilId = sigilIdVal
      ? parseInt(sigilIdVal, 10)
      : null;
    window.renderDeploymentModal();
  };

  export const renderDeploymentModal = function () {
    let selectorsPanel = document.getElementById("deployment-selectors-panel");
    if (selectorsPanel) {
      let isCrucible = window.playerStats.isCrucibleMode;
      let isChallenge = window.playerStats.activeSpecialChallenge !== null;

      if (isCrucible) {
        let maxPeak = window.playerStats.cruciblePeak || 1;
        let selectedWave = window.playerStats.crucibleStartWave || 1;

        let waveOptions = [];
        waveOptions.push(1);
        for (let wave = 5; wave <= maxPeak; wave += 5) {
          waveOptions.push(wave);
        }
        waveOptions = Array.from(new Set(waveOptions)).sort((a, b) => a - b);

        let optionsMarkup = waveOptions
          .map((w) => {
            let isSelected = w === selectedWave ? "selected" : "";
            let tag = w === 1 ? "Initiation Wave" : `Milestone Wave`;
            return `<option value="${w}" ${isSelected}>Wave ${w} (${tag})</option>`;
          })
          .join("");

        let dividend = window.calculateCumulativeOnslaughtShards(selectedWave);

        selectorsPanel.innerHTML = `
                <div class="deploy-pane-header">
                  <span>ONSLAUGHT PARAMETERS</span>
                  <span class="deploy-risk-tag" style="border-color:#a855f7; color:#a855f7; background:rgba(168,85,247,0.1);">ARENA</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                  <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                    <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">1. STARTING WAVE MILESTONE</label>
                    <select id="deploy-wave-select" class="wave-milestone-select" onchange="window.changeOnslaughtStartWave(this.value)">
                      ${optionsMarkup}
                    </select>
                  </div>

                  ${
                    selectedWave > 1
                      ? `
                  <div style="background: rgba(168, 85, 247, 0.1); border: 1.5px dashed #a855f7; border-radius: 6px; padding: 10px; text-align: left; font-family: monospace; font-size: 9.5px; line-height: 1.4; color: #e9d5ff;">
                    <strong style="color: #ffd700; display: block; margin-bottom: 4px;">[70% SKIP DIVIDEND REWARD]</strong>
                    <span>Bypassing Waves 1 to ${selectedWave - 1} instantly awards:</span>
                    <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
                      <div style="color: #00ffff;">+ ${dividend.shards.toLocaleString()} Astral Shards</div>
                      <div style="color: #ffd700;">+ ${window.formatNumber(dividend.gold)} Gold</div>
                      <div style="color: #c084fc;">+ ${window.formatNumber(dividend.xp)} Experience (XP)</div>
                    </div>
                  </div>
                  `
                      : ""
                  }
                </div>
              `;
      } else if (isChallenge) {
        let challenge = window.playerStats.activeSpecialChallenge;
        let sigil =
          window.playerStats.activeDungeonSigil ||
          window.ItemFactory.createCalamitySigil(challenge.id);

        window.state.deploymentFloor = 1;

        let col = window.getTierColor(sigil.statsRolled);
        let buffPills = (sigil.buffs || [])
          .map((b) => {
            return `<span class="recipe-ingredient-chip" style="border-color:#34d399; background:rgba(52,211,153,0.12); color:#34d399; font-size:8px; font-family:monospace; padding:1px 4px; border-radius:3px; cursor:help;" onpointerdown="window.showModifierTooltip(event, '${b.id}', true, '${b.desc}')" onmouseenter="window.showModifierTooltip(event, '${b.id}', true, '${b.desc}')" onmouseleave="window.hideTooltip()">+ ${b.name}</span>`;
          })
          .join(" ");
        let debuffPills = (sigil.debuffs || [])
          .map((d) => {
            return `<span class="recipe-ingredient-chip" style="border-color:#f87171; background:rgba(239,68,68,0.12); color:#f87171; font-size:8px; font-family:monospace; padding:1px 4px; border-radius:3px; cursor:help;" onpointerdown="window.showModifierTooltip(event, '${d.id}', false, '${d.desc}')" onmouseenter="window.showModifierTooltip(event, '${d.id}', false, '${d.desc}')" onmouseleave="window.hideTooltip()">- ${d.name}</span>`;
          })
          .join(" ");

        let sigilSlotHtml = `
            <div class="deploy-sigil-card-slot" style="border-color:${col}; cursor:default; flex-direction:column; align-items:stretch; gap:6px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                  ${window.getEquipIconHtml(sigil, 24)}
                  <div style="display:flex; flex-direction:column; min-width:0;">
                    <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${sigil.name}</span>
                    <span style="color:#aaa; font-size:8px; font-family:monospace;">${sigil.statsRolled}★ ${window.getTierName(sigil.statsRolled)}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:3px; border-top:1px dashed rgba(255,255,255,0.08); padding-top:4px;">
                ${buffPills} ${debuffPills}
              </div>
            </div>
          `;

        selectorsPanel.innerHTML = `
            <div class="deploy-pane-header">
              <span>CONTRACT PARAMETERS</span>
              <span class="deploy-risk-tag" style="border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.1);">LOCKED</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
              <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">1. TARGET DUNGEON FLOOR ${effBadge}</label>
                <div style="background: #0f172a; color: #ffd700; border: 1px solid #1e293b; padding: 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 11px; width: 100%;">Floor 1 (Contract Core Entry)</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">2. CONTRACT SIGIL</label>
                ${sigilSlotHtml}
              </div>
            </div>
          `;
      } else {
        let checkpoints = (
          window.playerStats.unlockedCheckpoints || [1]
        ).filter(window.isValidCheckpoint);
        let selectedFloor = window.state.deploymentFloor || 1;
        let rec = window.playerStats && window.playerStats.recoveryLoot;

        let effBadge = "";
        let activeSub = window.equippedSlots && window.equippedSlots.subweapon;
        if (activeSub) {
          let subType = activeSub.subType || activeSub.type;
          let mast = window.playerStats.subweaponMastery[subType];
          let pLevel = window.playerStats.level || 1;
          if (mast) {
            if (pLevel - selectedFloor > 20) { effBadge = ` <span style="color:#ef4444; font-size:9px; font-weight:bold;">[TRIVIAL (0 XP)]</span>`; }
            else {
              let diff = selectedFloor - mast.level;
              if (diff > 5) { let bonus = Math.min(100, (diff - 5) * 10); effBadge = ` <span style="color:#38bdf8; font-size:9px; font-weight:bold;">[HEROIC +${bonus}% XP]</span>`; }
              else if (diff < -5) { let penalty = Math.min(90, (Math.abs(diff) - 5) * 10); effBadge = ` <span style="color:#facc15; font-size:9px; font-weight:bold;">[INEFFICIENT -${penalty}%]</span>`; }
              else { effBadge = ` <span style="color:#4ade80; font-size:9px; font-weight:bold;">[IDEAL XP]</span>`; }
            }
          }
        }
        let floorOptions = checkpoints
          .map((startFloor) => {
            let sectorNum = Math.floor((startFloor - 1) / 12) + 1;
            let isSelected = startFloor === selectedFloor ? "selected" : "";
            let recBadge =
              rec && rec.floor === startFloor ? " [RECOVERY CHEST]" : "";

            let tag =
              startFloor === 1
                ? "Start"
                : (startFloor - 1) % 12 === 0
                  ? `Sector ${sectorNum} Start`
                  : `Post Mini-Boss`;
            return `<option value="${startFloor}" ${isSelected}>Floor ${startFloor} (${tag})${recBadge}</option>`;
          })
          .join("");

        let recBannerHtml = "";
        if (rec && rec.items && rec.items.length > 0) {
          recBannerHtml = `
                          <div style="width: 100%; background: rgba(231, 76, 60, 0.15); border: 1.5px dashed #e74c3c; border-radius: 6px; padding: 6px 10px; font-family: monospace; font-size: 9.5px; color: #ff7675; text-align: left; box-sizing: border-box;">
                            <strong style="color: #f1c40f; display: block; font-size: 10px; margin-bottom: 1px;">[RECOVERY ALERT] UNCLAIMED LOST GEAR</strong>
                            <span>${rec.items.length} item(s) lost on Floor ${rec.floor}. Reach this floor again to retrieve them!</span>
                          </div>
                        `;
        }

        let selectedSigilId = window.state.selectedDeploymentSigilId;
        let activeSigil = selectedSigilId
          ? (window.inventory.SIGIL || []).find((s) => s.id === selectedSigilId)
          : null;

        let sigilSlotHtml = "";
        if (activeSigil) {
          let col = window.getTierColor(activeSigil.statsRolled);
          let buffPills = (activeSigil.buffs || [])
            .map(
              (b) =>
                `<span style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-size: 8px; font-family: monospace; padding: 1px 4px; border-radius: 3px; cursor: help;" onpointerdown="window.showModifierTooltip(event, '${b.id}', true, '${b.desc}')" onmouseenter="window.showModifierTooltip(event, '${b.id}', true, '${b.desc}')" onmouseleave="window.hideTooltip()">+ ${b.name}</span>`,
            )
            .join(" ");
          let debuffPills = (activeSigil.debuffs || [])
            .map(
              (d) =>
                `<span style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; font-size: 8px; font-family: monospace; padding: 1px 4px; border-radius: 3px; cursor: help;" onpointerdown="window.showModifierTooltip(event, '${d.id}', false, '${d.desc}')" onmouseenter="window.showModifierTooltip(event, '${d.id}', false, '${d.desc}')" onmouseleave="window.hideTooltip()">- ${d.name}</span>`,
            )
            .join(" ");

          sigilSlotHtml = `
                <div class="deploy-sigil-card-slot" onclick="window.openSigilPickerModal()" style="border-color:${col}; cursor:pointer; flex-direction:column; align-items:stretch; gap:6px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:6px; min-width:0;">
                      ${window.getEquipIconHtml(activeSigil, 24)}
                      <div style="display:flex; flex-direction:column; min-width:0;">
                        <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${activeSigil.name}</span>
                        <span style="color:#aaa; font-size:8px; font-family:monospace;">${activeSigil.statsRolled}★ ${window.getTierName(activeSigil.statsRolled)}</span>
                      </div>
                    </div>
                    <button class="action-btn-sm" style="background:#3b0764; border-color:#a855f7; color:#df9ffb; font-size:8px; padding:3px 8px;" onclick="event.stopPropagation(); window.openSigilPickerModal();">SWAP</button>
                  </div>
                  <div style="display:flex; flex-wrap:wrap; gap:3px; border-top:1px dashed rgba(255,255,255,0.08); padding-top:4px;">
                    ${buffPills} ${debuffPills}
                  </div>
                </div>
              `;
        } else {
          sigilSlotHtml = `
                <div class="deploy-sigil-card-slot empty" onclick="window.openSigilPickerModal()" style="cursor:pointer; padding:12px 10px;">
                  <span style="color:#64748b; font-size:10px; font-weight:bold; font-style:italic;">[ NO SIGIL INFUSED ]</span>
                  <button class="action-btn-sm" style="background:#0284c7; border-color:#38bdf8; color:#fff; font-size:8px; padding:4px 8px;" onclick="event.stopPropagation(); window.openSigilPickerModal();">INFUSE SIGIL</button>
                </div>
              `;
        }

        selectorsPanel.innerHTML = `
                      ${recBannerHtml}
                      <div class="deploy-pane-header">
                        <span>EXPEDITION & SIGIL SETUP</span>
                        <span class="deploy-risk-tag" style="border-color:#f1c40f; color:#f1c40f; background:rgba(241,196,15,0.1);">DESTINATION</span>
                      </div>
                      <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                          <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">1. TARGET DUNGEON FLOOR ${effBadge}</label>
                          <select id="deploy-floor-select" style="background: #1e293b; color: #ffd700; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 11px; width: 100%; outline: none;" onchange="window.changeDeploymentFloor(this.value)">
                            ${floorOptions}
                          </select>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
                          <label style="font-family: monospace; font-size: 8.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase;">2. CAVERN SIGIL ALTAR</label>
                          ${sigilSlotHtml}
                        </div>
                      </div>
                    `;
      }
    }

    let container = document.getElementById("deployment-gear-list");
    if (!container) return;

    let allSlots = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let itemsHtml = "";

    allSlots.forEach((slotKey) => {
      let item = window.equippedSlots[slotKey];
      if (item) {
        let col = window.getTierColor(item.statsRolled);
        let isLocked = !!item.locked;
        let rawPremium = window.calculateInsurancePremium(item);

        let cardStatusClass = isLocked ? "is-insured" : "is-uninsured";
        let btnStatusClass = isLocked ? "active" : "";

        itemsHtml += `
                      <div class="deploy-gear-card ${cardStatusClass}" style="border-left: 3.5px solid ${col};">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer;" onclick="event.stopPropagation(); window.showSlotTooltip(event, '${slotKey}');" onmouseenter="window.showSlotTooltip(event, '${slotKey}')" onmouseleave="window.hideTooltip()">
                          ${window.getEquipIconHtml(item, 28)}
                          <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                            <span style="color:${col}; font-weight: bold; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                            <span style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">LV.${item.stageLevel || 1} • Soul Bond: ${window.formatNumber(rawPremium)} Gold</span>
                          </div>
                        </div>
                        <button class="tactical-insure-btn ${btnStatusClass}" onclick="event.stopPropagation(); window.toggleDeploymentInsurance('${slotKey}')">
                          ${isLocked ? "[ SOUL INSURED ]" : "[ AT RISK ]"}
                        </button>
                      </div>
                    `;
      }
    });

    if (!itemsHtml) {
      itemsHtml = `<div style="font-size: 10px; color: #64748b; font-style: italic; text-align: center; padding: 25px;">No gear currently equipped. Risking no items in cavern!</div>`;
    }

    container.innerHTML = itemsHtml;

    let totals = window.calculateRunInsuranceTotals();
    let statsContainer = document.getElementById("deployment-stats-panel");
    if (statsContainer) {
      let premiumText = window.formatNumber(totals.totalPremium);
      let wallet = BigNum.from(window.playerStats.coins);
      let canAfford = wallet.gte(totals.totalPremium);
      let premiumColor = canAfford ? "#ffd700" : "#ef4444";

      let soulsOwned =
        window.inventory && window.inventory.ETC
          ? window.inventory.ETC["Monster Soul"] || 0
          : 0;
      let canAffordSouls = soulsOwned >= totals.totalSoulsCost;
      let soulsColor = canAffordSouls ? "#34d399" : "#ef4444";

      let activeSigil = null;
      if (window.state.selectedDeploymentSigilId) {
        activeSigil = (window.inventory.SIGIL || []).find(
          (s) => s.id === window.state.selectedDeploymentSigilId,
        );
      }

      let sigilDetailsHtml = "";
      if (activeSigil) {
        let buffList = (activeSigil.buffs || [])
          .map(
            (b) =>
              `<div style="color: #34d399;">+ [✦] ${b.name}: ${b.desc}</div>`,
          )
          .join("");
        let debuffList = (activeSigil.debuffs || [])
          .map(
            (d) =>
              `<div style="color: #f87171;">- [◈] ${d.name}: ${d.desc}</div>`,
          )
          .join("");
        sigilDetailsHtml = `
            <div style="border-top: 1px dashed rgba(255,255,255,0.1); margin: 6px 0; padding-top: 6px;"></div>
            <strong style="color: #c084fc; font-size: 8.5px; letter-spacing: 0.8px; text-transform: uppercase;">[ ACTIVE SIGIL MODIFIERS ]</strong>
            ${buffList}
            ${debuffList}
            <div style="display:flex; gap:12px; margin-top:3px; font-family:monospace; font-size:9px;">
              <span style="color: #38bdf8; font-weight: bold;">Focus Multiplier: +${(activeSigil.rewardMultiplier * 100).toFixed(0)}%</span>
              ${activeSigil.qualityBoost > 0 ? `<span style="color: #e879f9; font-weight: bold;">Quality Boost: +${(activeSigil.qualityBoost * 100).toFixed(0)}%</span>` : ""}
            </div>
          `;
      }

      // 3-Segment Insured Gauge Bar
      let gaugeSegments = "";
      for (let i = 1; i <= 3; i++) {
        let isFilled = i <= totals.insuredCount;
        let color = isFilled ? "#10b981" : "#334155";
        gaugeSegments += `<div style="flex:1; height:6px; background:${color}; border-radius:2px; transition:all 0.2s;"></div>`;
      }

      statsContainer.innerHTML = `
                  <div style="display: flex; flex-direction: column; gap: 4px; text-align: left; font-family: monospace; font-size: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="color: #ffd700; font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;">[ EXPEDITION PROTECTION BREAKDOWN ]</strong>
                      <span style="color:#10b981; font-weight:bold;">${totals.insuredCount} / 3 Max Bound</span>
                    </div>
                    <div style="display:flex; gap:4px; margin:2px 0 6px 0;">
                      ${gaugeSegments}
                    </div>
                    <div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Soul Binding Cost:</span> <strong style="color:${premiumColor};">${premiumText} Gold</strong></div>
                    ${totals.totalSoulsCost > 0 ? `<div style="display: flex; justify-content: space-between;"><span style="color:#94a3b8;">Monster Souls Required:</span> <strong style="color:${soulsColor};">${totals.totalSoulsCost} Souls (Owned: ${soulsOwned})</strong></div>` : ""}
                    ${totals.waivedItem ? `<div style="font-size: 8.5px; color: #34d399; text-align: right; font-style: italic;">[Waived Protection Slot: ${totals.waivedItem.name}]</div>` : ""}
                    ${sigilDetailsHtml}
                  </div>
                `;

      let btnDeploySecure = document.getElementById("btn-deploy-secure");
      if (btnDeploySecure) {
        btnDeploySecure.disabled = !canAfford || !canAffordSouls;
        btnDeploySecure.innerText =
          totals.insuredCount > 0
            ? `DESCEND INTO DUNGEON (BOUND ${totals.insuredCount}/3)`
            : "DESCEND INTO DUNGEON (UNPROTECTED)";
      }
    }
  };

  export const toggleDeploymentInsurance = function (slotKey) {
    let item = window.equippedSlots[slotKey];
    if (!item) return;

    let allSlots = [
      "weapon",
      "subweapon",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring1",
      "ring2",
      "art1",
      "art2",
      "art3",
    ];
    let currentlyInsuredCount = allSlots.filter(
      (s) =>
        window.equippedSlots[s] &&
        window.equippedSlots[s].locked &&
        s !== slotKey,
    ).length;

    if (!item.locked && currentlyInsuredCount >= 3) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] You can only insure up to 3 items per run!",
          "#e74c3c",
        );
      }
      window.renderDeploymentModal();
      return;
    }

    item.locked = !item.locked;
    window.renderDeploymentModal();
  };

  export const executeDeployment = function (bypassWarning = false) {
    let totals = window.calculateRunInsuranceTotals();
    let isCrucible = window.playerStats.isCrucibleMode;

    if (!isCrucible && totals.insuredCount === 0 && !bypassWarning) {
      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unprotected Descent",
          "<span style='color: #e74c3c;'><strong>WARNING:</strong> You are descending without soul binding any equipped gear!</span><br><br>If you fall in battle, all uninsured items will be permanently lost. Are you sure you want to proceed?",
          "DESCEND ANYWAY",
          "CANCEL",
          "#e74c3c",
          function () {
            window.executeDeployment(true);
          },
        );
      } else {
        if (
          confirm(
            "WARNING: You are descending without soul binding any equipped gear! If you fall in battle, all uninsured items will be permanently lost. Proceed?",
          )
        ) {
          window.executeDeployment(true);
        }
      }
      return;
    }

    let wallet = BigNum.from(window.playerStats.coins);
    let soulsOwned =
      window.inventory && window.inventory.ETC
        ? window.inventory.ETC["Monster Soul"] || 0
        : 0;

    if (!isCrucible) {
      if (wallet.lt(totals.totalPremium)) {
        window.pushHeaderToast(
          "[X] Insufficient Gold for insurance premium!",
          "#e74c3c",
        );
        return;
      }
      if (soulsOwned < totals.totalSoulsCost) {
        window.pushHeaderToast(
          "[X] Insufficient Monster Souls for insurance premium!",
          "#e74c3c",
        );
        return;
      }

      if (totals.totalPremium.gt(0)) {
        window.playerStats.coins = wallet.sub(totals.totalPremium);
        if (window.playerStats.coins.eq(0)) {
          window.playerStats.hasTriggeredExactChange = true;
        }
      }

      if (totals.insuredCount >= 3) {
        window.playerStats.hasTriggeredSoulBound = true;
      }

      if (totals.totalSoulsCost > 0) {
        window.inventory.ETC["Monster Soul"] -= totals.totalSoulsCost;
        if (window.inventory.ETC["Monster Soul"] === 0) {
          delete window.inventory.ETC["Monster Soul"];
        }
      }

      // Consume & Slot selected sigil
      let selectedSigilId = window.state.selectedDeploymentSigilId;
      let activeSigil = null;
      if (selectedSigilId && window.inventory.SIGIL) {
        let idx = window.inventory.SIGIL.findIndex(
          (s) => s.id === selectedSigilId,
        );
        if (idx !== -1) {
          activeSigil = window.inventory.SIGIL[idx];
          window.inventory.SIGIL.splice(idx, 1);
        }
      }

      // Subphase 15: Protect Calamity Sigil from being overwritten by null during special challenge launch
      if (!window.playerStats.activeSpecialChallenge) {
        window.playerStats.activeDungeonSigil = activeSigil;
      }
    }

    if (!isCrucible) {
      window.playerStats.dungeonRunInProgress = true;
    }
    if (typeof window.saveGame === "function") window.saveGame();

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }
    if (window.combatVisuals) {
      let p = window.player;
      if (p) {
        window.combatVisuals.spawnBeam(p.x, "#00f3ff", 60, true, 0);
        window.combatVisuals.spawnParticles(p.x, p.y, 25, "animated_armor", 4);
        window.combatVisuals.triggerScreenShake(6, 10);
      }
    }

    let modal = document.getElementById("deployment-modal");
    if (modal) modal.style.display = "none";

    window.playerStats.activePortalEvent = "expedition"; // Reset active primed portal events on deployment

    if (isCrucible) {
      setCurrentGameState(window.GAME_STATES.DUNGEON);
      window.playerStats.crucibleWave =
        window.playerStats.crucibleStartWave || 1;
      window.playerStats.crucibleAccumulatedShards = 0;
      window.playerStats.crucibleAccumulatedCores = 0;

      if (window.playerStats.crucibleWave > 1) {
        let dividend = window.calculateCumulativeOnslaughtShards(
          window.playerStats.crucibleWave,
        );
        window.playerStats.crucibleAccumulatedShards = dividend.shards;
        window.playerStats.coins = BigNum.from(window.playerStats.coins).add(
          dividend.gold,
        );
        window.playerStats.totalGoldEarned = BigNum.from(
          window.playerStats.totalGoldEarned || 0,
        ).add(dividend.gold);
        if (typeof window.gainXp === "function") {
          window.gainXp(dividend.xp);
        }
      }

      window.playerStats.crucibleDraftDeck = [];
      window.playerStats.pendingCrucibleDrafts = 3;
      window.loadDungeonFloor(1);
    } else {
      window.enterDungeonRun(window.state.deploymentFloor);
    }
  };

  export const spawnBossEncounter = function (tileX, tileY, bossTier = "major") {
    let map = window.activeDungeonMap;
    let tileSize = map ? map.tileSize : 32;

    let depth = window.player.depth || 1;
    let isMini = bossTier === "mini";
    let isMarcus = bossTier === "marcus";

    let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;
    let activeChallenge = window.playerStats.activeSpecialChallenge;
    let scaleStage = depth;

    if (activeChallenge) {
      let baseScale =
        activeChallenge.baseScaleStage ||
        window.playerStats.lifetimePeakStage ||
        1;
      scaleStage = baseScale + (depth - 1) * 2;
    }

    // Aligned with exponential item scaling to maintain a tight, balanced progression curve
    // Robbery Anti-Farming: Bounded to maximum of current stage or peak stage with a 1.25x penalty scaling multiplier
    let repStage;
    if (isMarcus) {
      let peak =
        window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
      let effectiveDepth = Math.max(scaleStage, peak) * 1.25;
      let peakSIdx = Math.floor((effectiveDepth - 1) / 12);
      repStage = window.getEffectiveStage(
        effectiveDepth * 1.25 + peakSIdx * 12.0,
      );
    } else {
      repStage =
        typeof window.getEffectiveStage === "function"
          ? window.getEffectiveStage(scaleStage)
          : scaleStage;
    }

    let repScale = Math.pow(1.012, repStage) * (1 + 0.015 * repStage);
    let densityFactor = 1 + 0.005 * repStage;

    let localStep = (scaleStage - 1) % 12;
    let sawtoothMod = isMarcus ? 1.0 : 0.85 + 0.03 * localStep;

    let bossHp = isMarcus
      ? 1200 * repScale * densityFactor * sawtoothMod
      : isMini
        ? 800 * repScale * densityFactor * sawtoothMod
        : 2000 * repScale * densityFactor * sawtoothMod;
    let bossAtk = isMarcus
      ? 32 * repScale * sawtoothMod
      : isMini
        ? 18 * repScale * sawtoothMod
        : 26 * repScale * sawtoothMod;

    bossHp = Math.round(bossHp * enemyScale);
    bossAtk = Math.round(bossAtk * enemyScale);

    // Apply progression floors (baseline minimums) to ensure engaging combat scaling (Lowered floors and scaling multiplier to eliminate bloated HP pools)
    let bossHpFloor = isMarcus ? 1400 : isMini ? 350 : 650;
    let bossAtkFloor = isMarcus ? 30 : isMini ? 12 : 18;
    bossHp = Math.max(
      Math.round(bossHpFloor * (1 + scaleStage * 0.02)),
      bossHp,
    );
    bossAtk = Math.max(
      Math.round(bossAtkFloor * (1 + scaleStage * 0.01)),
      bossAtk,
    );

    if (activeChallenge) {
      let challengeScale = 1.0 + activeChallenge.riskRating / 30;
      bossHp = Math.round(bossHp * challengeScale);
      bossAtk = Math.round(bossAtk * challengeScale);
    }

    let tier =
      typeof window.getStageTier === "function" ? window.getStageTier() : 0;
    let isDungeon = window.playerStats.isDungeonMode;
    let dType = window.playerStats.currentDungeon || "gold";

    let bossName = isMini ? "Guard Warden" : "Dungeon Overlord";
    let vType = null;

    if (bossTier === "marcus") {
      bossName = "Marcus the Outlaw";
      vType = "marcus";
      if (window.playerStats) {
        window.playerStats.robbingMarcusActive = true;
      }
    } else if (activeChallenge && activeChallenge.primaryTarget) {
      let pTar = activeChallenge.primaryTarget;
      bossName = isMini ? "Guard " + pTar.name : pTar.name;
      vType = pTar.visualType;
      tier = pTar.tier;
    } else if (isDungeon) {
      if (dType === "gold") {
        bossName = isMini ? "Treasury Guard" : "Gilded Vault Keeper";
        vType = "gilded_vault_keeper";
      } else if (dType === "mat") {
        bossName = isMini ? "Sludge Sentinel" : "Corrosive Abomination";
        vType = "corrosive_abomination";
      } else if (dType === "equip") {
        bossName = isMini ? "Iron Golem" : "Overlord Iron Vault";
        vType = "overlord_iron_vault";
      }
    } else if (window.playerStats.isUberBoss) {
      let uType = window.playerStats.currentUberBoss || "guardian";
      if (uType === "guardian") {
        bossName = "Aegis Goliath";
        vType = "aegis_goliath";
      } else if (uType === "chronos" || uType === "arbitrator") {
        bossName = "Chronos Arbitrator";
        vType = "chronos_arbitrator";
      } else if (uType === "nexus") {
        bossName = "Nexus Overseer";
        vType = "nexus_overseer";
      }
    } else {
      const names = [
        "Arachnid Treant",
        "Aegis Goliath",
        "Brimstone Colossus",
        "Corrosive Abomination",
        "Void Overseer",
        "Chronos Arbitrator",
        "Nexus Overseer",
      ];
      const types = [
        "arachnid_treant",
        "aegis_goliath",
        "overlord_iron_vault",
        "corrosive_abomination",
        "void_overseer",
        "chronos_arbitrator",
        "nexus_overseer",
      ];
      bossName = isMini
        ? "Guard " + (names[tier] || "Warden")
        : names[tier] || "Dungeon Overlord";
      vType = types[tier] || "arachnid_treant";
    }

    setPrimaryMob({
      type: isMarcus
        ? "marcus_boss"
        : isMini
          ? "dungeon_miniboss"
          : "dungeon_boss",
      name: bossName,
      visualType: vType,
      hp: BigNum.from(bossHp),
      maxHp: BigNum.from(bossHp),
      atk: bossAtk,
      x: tileX * tileSize - (isMini ? 4 : 16),
      y: tileY * tileSize - (isMini ? 4 : 16),
      w: isMini ? 40 : 64,
      h: isMini ? 40 : 64,
      flashTimer: 0,
      isStopped: false, // Engages immediately upon theft trigger
      bossTileX: tileX,
      bossTileY: tileY,
      state: "idle",
      telegraphTimer: 0,
      maxTelegraphTimer: isMini ? 80 : 65,
      activeAbility: null,
      targetX: 0,
      targetY: 0,
      attackCooldown: 60,
      moveset: isMarcus
        ? ["lasso", "barrage", "inversion"]
        : isMini
          ? ["slam", "charge"]
          : ["slam", "nova", "charge"],
      facing: -1,
      speedMultiplier: isMarcus ? 1.25 : 1.0, // Moves 25% faster
    });

    window.spawnFloatingText(
      window.player.x,
      window.player.y - 25,
      `${bossName.toUpperCase()} ENGAGED`,
      isMini ? "#e67e22" : "#e74c3c",
    );
  };

  export const onBossDefeated = function (tileX, tileY) {
    let map = window.activeDungeonMap;
    let depth = window.player.depth || 1;

    // Refill Field Flask charges upon defeating a boss
    window.refillFlaskCharges(false);

    let isChallenge = window.playerStats.activeSpecialChallenge !== null;
    let isCrucible = window.playerStats.isCrucibleMode;

    if (!isChallenge && !isCrucible) {
      let nextCheckpoint = depth + 1;
      window.playerStats.unlockedCheckpoints = window.playerStats
        .unlockedCheckpoints || [1];
      if (
        window.isValidCheckpoint(nextCheckpoint) &&
        !window.playerStats.unlockedCheckpoints.includes(nextCheckpoint)
      ) {
        window.playerStats.unlockedCheckpoints.push(nextCheckpoint);
      }
      window.playerStats.unlockedCheckpoints =
        window.playerStats.unlockedCheckpoints
          .filter(window.isValidCheckpoint)
          .sort((a, b) => a - b);
      window.playerStats.maxFloorCleared = Math.max(
        window.playerStats.maxFloorCleared || 0,
        depth,
      );
      window.playerStats.stage = Math.max(window.playerStats.stage || 1, depth);
      window.playerStats.lifetimePeakStage = Math.max(
        window.playerStats.lifetimePeakStage || 1,
        depth,
      );

      // Trigger first-time challenge generation upon clearing Floor 12 (or higher)
      if (depth >= 12 && !window.playerStats.hasTriggeredChallengesUnlock) {
        window.playerStats.hasTriggeredChallengesUnlock = true;
        if (
          window.ChallengeEngine &&
          typeof window.ChallengeEngine.generateRandomChallenges === "function"
        ) {
          window.ChallengeEngine.generateRandomChallenges();
        }
      }
    }
    if (typeof window.saveGame === "function") window.saveGame();

    if (
      map &&
      map.grid &&
      map.grid[tileY] &&
      map.grid[tileY][tileX] !== undefined
    ) {
      if (window.playerStats.isRiftMode) {
        map.grid[tileY][tileX] = window.TILE_TYPES.EXTRACTION_ZONE;
        window.spawnFloatingText(
          window.player.x,
          window.player.y - 25,
          "RIFT GUARDIAN SLAIN - PORTAL EXTRACT ACTIVE",
          "#00ffff",
        );
      } else if (window.playerStats.activeSpecialChallenge) {
        if (depth < 4) {
          // Floors 1-3: Slaying the Warden opens the locked descent portal to the next stage
          map.grid[tileY][tileX] = window.TILE_TYPES.DESCENT_PORTAL;
          window.spawnFloatingText(
            window.player.x,
            window.player.y - 25,
            "WARDEN SLAIN - DESCENT PORTAL ACTIVE",
            "#ffd700",
          );
        } else {
          // Floor 4: Both Overlords are defeated! Spawn Special Coffer (Astral Vault) & exit portal
          map.grid[tileY][tileX] = window.TILE_TYPES.CHEST_SPAWN;
          map.chestTiers[`${tileX},${tileY}`] = "astral";

          // Safe positioning of exit portal 2 tiles away from Special Coffer
          let exitY = tileY + 2 < map.height - 1 ? tileY + 2 : tileY - 2;
          map.grid[exitY][tileX] = window.TILE_TYPES.EXTRACTION_ZONE;

          window.spawnFloatingText(
            window.player.x,
            window.player.y - 25,
            "VICTORY! SPECIAL COFFER DISPENSED",
            "#ffd700",
          );
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "✦ Special Coffer spawned! Claim your loot and extract!",
              "#ffd700",
            );
          }
        }
      } else {
        // Standard campaign boss progression
        map.grid[tileY][tileX] = window.TILE_TYPES.EXTRACTION_ZONE;
        window.spawnFloatingText(
          window.player.x,
          window.player.y - 25,
          "CHECKPOINT UNLOCKED - EXTRACTION OPEN",
          "#00d2ff",
        );
      }
    }
  };

  setActiveDungeonMobs([]);

  export const loadDungeonFloor = function (depth) {
    if (!window.activeDungeonMap) return;

    // Synchronize stage progress with current depth
    if (window.playerStats) {
      window.playerStats.stage = Math.max(window.playerStats.stage || 1, depth);
      window.playerStats.lifetimePeakStage = Math.max(
        window.playerStats.lifetimePeakStage || 1,
        depth,
      );
    }

    // Reset floor-specific active trackers
    if (window.playerStats) {
      window.playerStats.floorActiveTicks = 0;
      window.playerStats.kineticFrictionCharges = 0;
      window.playerStats.kineticDistanceTraveled = 0;
      window.playerStats.kineticStillTimer = 0;
      window.playerStats.combatTimer = 0;
      window.playerStats.tenacityStacks = 0;
      window.playerStats.activeCombatTicks = 0;
      window.playerStats.outOfCombatTicks = 0;
      window.playerStats.overshieldConsumed = 0;
      window.playerStats.nexusTomeShieldTimer = 0;
    }

    // Strict Extraction Rules: Discard and reset uncollected floor state
    window.groundLoot = [];
    window.groundMaterials = [];
    window.goldParticles = [];
    window.heartOrbs = [];
    window.xpOrbs = [];
    window.cavernInteractives = [];
    resetEncounterState();
    window.projectiles = [];
    window.floorTimeElapsed = 0;
    window.calamitySpecterActive = false;
    resetCombatHazardRuntimeState();
    if (window.activeDungeonMap) {
      window.activeDungeonMap.openedChests = new Set();
    }

    let isMiniBoss = false;
    let isMajorBoss = false;
    let map;

    let isChallenge = window.playerStats.activeSpecialChallenge !== null;
    let isRift = window.playerStats.isRiftMode === true;

    if (isChallenge) {
      if (depth === 4) {
        map = window.activeDungeonMap.generateBossArena();
      } else {
        map = window.activeDungeonMap.generate(depth);
      }
    } else if (window.playerStats.isCrucibleMode) {
      map = window.activeDungeonMap.generateOnslaughtArena();
      window.state.onslaughterWaveLock = false;
      setTimeout(() => {
        window.spawnOnslaughtWave(window.playerStats.crucibleWave || 1);
      }, 100);
    } else if (isRift) {
      map = window.activeDungeonMap.generateBossArena();
    } else {
      isMiniBoss = depth % 12 === 4 || depth % 12 === 8;
      isMajorBoss = depth % 12 === 0;

      if (isMiniBoss || isMajorBoss) {
        map = window.activeDungeonMap.generateBossArena();
      } else {
        map = window.activeDungeonMap.generate(depth);
      }
    }
    let tileSize = map.tileSize;

    window.player.x = map.spawnTile.x * tileSize + tileSize / 2;
    window.player.y = map.spawnTile.y * tileSize + tileSize / 2;
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;

    // Fairy Sanctuary Spawn Check
    let fairyLevel = window.SkillTreeManager
      ? window.SkillTreeManager.getSkillLevel("utility_fairy_sanctuary")
      : 0;
    let fairyChance = fairyLevel * 0.05;
    if (
      fairyChance > 0 &&
      Math.random() < fairyChance &&
      !isMiniBoss &&
      !isMajorBoss &&
      !window.playerStats.isCrucibleMode &&
      !isRift
    ) {
      let fPos = window.getOnslaughtSpawnPosition
        ? window.getOnslaughtSpawnPosition(map)
        : { x: Math.floor(map.width / 2), y: Math.floor(map.height / 2) };
      let fTileSize = map.tileSize || 32;
      window.cavernInteractives = window.cavernInteractives || [];
      window.cavernInteractives.push({
        id: window.idCounter++,
        type: "glimmering_fairy",
        x: fPos.x * fTileSize + fTileSize / 2,
        y: fPos.y * fTileSize + fTileSize / 2,
        w: 18,
        h: 18,
        isTriggeredByTouch: true,
        life: 1800,
        maxLife: 1800,
        angleSeed: Math.random() * 100,
      });
    }

    // Spawning Bosses (Warden, Major, Mini, or Rift Guardian)
    if (isRift) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnRiftGuardianEncounter(cx, cy);
    } else if (isChallenge) {
      if (depth === 4) {
        window.ChallengeEngine.spawnTwinBosses(map);
      } else {
        // Spawn the floor's Guardian Warden right at the exit portal tile to block descent
        window.spawnBossEncounter(
          map.extractionTile.x,
          map.extractionTile.y,
          "mini",
        );
      }
    } else if (isMajorBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "major");
    } else if (isMiniBoss) {
      let cx = Math.floor(map.width / 2);
      let cy = Math.floor(map.height / 2);
      window.spawnBossEncounter(cx, cy, "mini");
    }

    // Spawning Standard Monsters (Enabled on all standard floors + Floors 1-3 of Challenges)
    let shouldSpawnStandardMobs =
      !isMiniBoss &&
      !isMajorBoss &&
      !window.playerStats.isCrucibleMode &&
      !isRift &&
      (depth < 4 || !isChallenge);

    if (shouldSpawnStandardMobs && map.mobSpawns) {
      let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;
      let activeChallenge = window.playerStats.activeSpecialChallenge;
      let scaleStage = depth;

      if (activeChallenge) {
        let baseScale =
          activeChallenge.baseScaleStage ||
          window.playerStats.lifetimePeakStage ||
          1;
        scaleStage = baseScale + (depth - 1) * 2;
      }

      // Aligned with exponential item scaling to maintain a tight, balanced progression curve
      let repStage =
        typeof window.getEffectiveStage === "function"
          ? window.getEffectiveStage(scaleStage)
          : scaleStage;
      let repScale = Math.pow(1.012, repStage) * (1 + 0.015 * repStage);
      let densityFactor = 1 + 0.005 * repStage;

      let localStep = (scaleStage - 1) % 12;
      let sawtoothMod = 0.85 + 0.03 * localStep;

      let mobHpVal = Math.floor(
        100 * repScale * densityFactor * sawtoothMod * enemyScale,
      );
      let mobAtkVal = Math.floor(12 * repScale * sawtoothMod * enemyScale);

      // Apply solid baseline floors to prevent early-game trivialization (Gentler scaling to align with balanced HP curves)
      let mobHpFloor = Math.min(100, 25 + scaleStage * 5.0);
      let mobAtkFloor = Math.min(10, 4 + scaleStage * 0.3);
      mobHpVal = Math.max(
        Math.round(mobHpFloor * (1 + scaleStage * 0.025)),
        mobHpVal,
      );
      mobAtkVal = Math.max(
        Math.round(mobAtkFloor * (1 + scaleStage * 0.01)),
        mobAtkVal,
      );

      if (activeChallenge) {
        let challengeScale = 1.0 + activeChallenge.riskRating / 35;
        mobHpVal = Math.floor(mobHpVal * challengeScale);
        mobAtkVal = Math.floor(mobAtkVal * challengeScale);
      }

      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let rareRate = pStats.rareSpawn !== undefined ? pStats.rareSpawn : 0.01;

      map.mobSpawns.forEach((sp) => {
        let mobInfo = window.getMobPoolForDepth(depth);
        let isRare = Math.random() < rareRate;

        // Roll Elite Support Affixes on higher floors (Sector-Bridged Step Model)
        let eliteAffix = null;
        let isEliteInfested =
          typeof window.isCavernEffectActive === "function" &&
          window.isCavernEffectActive("elite_infestation");

        let affixChance = 0.0;
        if (isEliteInfested) {
          affixChance = 1.0;
        } else if (depth >= 85) {
          affixChance = 0.35; // Sector 6+ (Floors 85+): 35%
        } else if (depth >= 49) {
          affixChance = 0.2; // Sector 5 (Floors 49-84): 20%
        } else if (depth >= 37) {
          affixChance = 0.12; // Sector 4 (Floors 37-48): 12%
        } else if (depth >= 25) {
          affixChance = 0.07; // Sector 3 (Floors 25-36): 7%
        } else if (depth >= 13) {
          affixChance = 0.03; // Sector 2 (Floors 13-24): 3%
        } else {
          affixChance = 0.0; // Sector 1 (Floors 1-12): 0%
        }

        if (Math.random() < affixChance) {
          const affixes = [
            "vitality_weaver",
            "iron_citadel",
            "swift_commander",
            "blood_berserker",
            "nullifier",
            "web_weaver",
            "glacial_warden",
            "slag_shaper",
            "toxic_decay",
          ];
          eliteAffix = affixes[Math.floor(Math.random() * affixes.length)];
        }

        let finalHp = mobHpVal;
                let finalAtk = mobAtkVal;
                let isElite = !!eliteAffix;

                if (isElite && isRare) {
                  finalHp = Math.round(finalHp * 2.5);
                  finalAtk = Math.round(finalAtk * 1.6);
                } else if (isElite) {
                  finalHp = Math.round(finalHp * 1.5);
                  finalAtk = Math.round(finalAtk * 1.25);
                } else if (isRare) {
                  finalHp = Math.round(finalHp * 1.75);
                  finalAtk = Math.round(finalAtk * 1.35);
                }

                // Nullifier Elites disable offhands, so they receive a 35% HP reduction to allow quick bursting
                if (eliteAffix === "nullifier") {
                  finalHp = Math.round(finalHp * 0.65);
                }

        let rangedTypes = [
          "thorn_wyrm",
          "wyrmling",
          "magma_elemental",
          "toxic_fly",
          "void_orb",
        ];
        let isRanged = rangedTypes.includes(mobInfo.type);
        let projType =
          mobInfo.type === "thorn_wyrm"
            ? "thorn"
            : mobInfo.type === "wyrmling"
              ? "frost"
              : mobInfo.type === "magma_elemental"
                ? "fireball"
                : mobInfo.type === "toxic_fly"
                  ? "maelstrom"
                  : "void";

        let spawnX = sp.x * tileSize;
        let spawnY = sp.y * tileSize;

        addActiveDungeonMob({
          id: window.idCounter++,
          type: "mob",
          visualTier: mobInfo.tier,
          visualType: mobInfo.type,
          x: spawnX,
          y: spawnY,
          homeX: spawnX,
          homeY: spawnY,
          w: 24,
          h: 24,
          hp: BigNum.from(finalHp),
          maxHp: BigNum.from(finalHp),
          atk: finalAtk,
          flashTimer: 0,
          attackCooldown: 0,
          rangedCooldown: window.randInt(30, 90),
          isRanged: isRanged,
          projectileType: projType,
          moveProfile:
            mobInfo.type === "golem" || mobInfo.type === "corroded_golem"
              ? "relentless"
              : "standard",
          facing: -1,
          isRare: isRare,
          isElite: isElite,
          eliteAffix: eliteAffix,
          buffStacks: { haste: 0, def: 0, atk: 0 },
          buffTimers: { haste: 0, def: 0, atk: 0 },
          buffDecayTimers: { haste: 0, def: 0, atk: 0 },
          wanderTimer: window.randInt(40, 120),
          wanderVx: 0,
          wanderVy: 0,
          isWandering: false,
          hopTimer: window.randInt(0, 29),
        });
      });
    }

    // Wave Clearance Reward Dispatcher
    window.onOnslaughtWaveClear = function () {
      let currentWave = window.playerStats.crucibleWave || 1;

      // Base Shard reward: scaled logarithmically with wave depth
      let shardReward = Math.floor(currentWave * 1.2 + Math.log(currentWave));
      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      if (pStats.crucibleShardMult) {
        shardReward = Math.floor(shardReward * pStats.crucibleShardMult);
      }
      window.playerStats.crucibleAccumulatedShards =
        (window.playerStats.crucibleAccumulatedShards || 0) + shardReward;

      // Milestone Rewards (Every 5th Wave)
      if (currentWave % 5 === 0) {
        window.playerStats.crucibleAccumulatedShards += 5; // +5 flat milestone shards
        // Guaranteed 1 Catalyst Core for every 5th wave boss defeated
        window.playerStats.crucibleAccumulatedCores =
          (window.playerStats.crucibleAccumulatedCores || 0) + 1;

        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `[MILESTONE] Wave ${currentWave} Cleared! Gained +5 Bonus Shards & +1 Catalyst Core!`,
            "#ffd700",
          );
        }
      } else {
        // 10% Chance for Catalyst Core on standard waves
        if (Math.random() < 0.1) {
          window.playerStats.crucibleAccumulatedCores =
            (window.playerStats.crucibleAccumulatedCores || 0) + 1;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              "[REWARD] Gained +1 Catalyst Core!",
              "#2ecc71",
            );
          }
        }
      }

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[WAVE CLEAR] Wave ${currentWave} Cleared! Gained +${shardReward} Astral Shards.`,
          "#00d2ff",
        );
      }

      if (typeof window.saveGame === "function") window.saveGame();

      // Trigger draft card overlay selection OR auto-advance wave immediately
      if (currentWave % 5 === 0) {
        if (typeof window.triggerOnslaughtDraft === "function") {
          window.triggerOnslaughtDraft();
        } else {
          // Fallback before draft selection UI is built in Phase 4
          window.advanceOnslaughtWave();
        }
      } else {
        setTimeout(() => {
          window.advanceOnslaughtWave();
        }, 1500);
      }
    };

    window.advanceOnslaughtWave = function () {
      window.playerStats.crucibleWave =
        (window.playerStats.crucibleWave || 1) + 1;
      window.state.onslaughterWaveLock = false;

      if (typeof window.saveGame === "function") window.saveGame();
      if (typeof window.updateUI === "function") window.updateUI();

      window.spawnOnslaughtWave(window.playerStats.crucibleWave);
    };

    // Rule-Based Unique Draft Selector
    window.getOnslaughtDraftChoices = function () {
      let deck = window.playerStats.crucibleDraftDeck || [];
      let pool = window.CRUCIBLE_DRAFT_POOL || [];

      // Filter cards out of pool if stacking or singularity caps have been reached
      let eligible = pool.filter((card) => {
        let count = deck.filter((id) => id === card.id).length;
        if (card.isMythic || card.isSingular) {
          return count < 1; // Singular/Mythic can only be drafted once
        }
        if (card.isCorrupted) {
          return count < 3; // Corrupted can only be drafted 3 times max
        }
        return true; // Standard cards stack infinitely
      });

      // Shuffle and pick 3 unique cards at random
      eligible.sort(() => Math.random() - 0.5);
      return eligible.slice(0, 3);
    };

    // DOM-Based Drafting Panel Overlay
    window.triggerOnslaughtDraft = function () {
      let container = document.getElementById("game-container");
      if (!container) return;

      // Freeze game loops
      window.onslaughterSavePauseState = getIsGamePaused();
      setGamePaused(true);

      // Roll choices
      let choices = window.getOnslaughtDraftChoices();
      if (choices.length === 0) {
        // Fallback if all caps have been met across the entire database
        setGamePaused(window.onslaughterSavePauseState || false);
        window.advanceOnslaughtWave();
        return;
      }

      // Create self-contained overlay element
      let overlay = document.createElement("div");
      overlay.id = "onslaught-draft-overlay";
      overlay.className = "onslaught-draft-overlay";

      // Inject dedicated, non-leaking local styles
      let styleHtml = `
                <style>
                  .onslaught-draft-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at center, rgba(16, 12, 28, 0.96) 0%, rgba(4, 3, 9, 0.99) 80%);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    z-index: 55000;
                    font-family: monospace;
                    color: #e2e8f0;
                    user-select: none;
                    -webkit-user-select: none;
                    box-sizing: border-box;
                    padding: 20px;
                    animation: draftFadeIn 0.3s ease-out;
                  }
                  .onslaught-draft-title {
                    font-size: 16px;
                    font-weight: 900;
                    color: #ffd700;
                    letter-spacing: 2.2px;
                    text-shadow: 0 2px 4px #000;
                    margin-bottom: 2px;
                    text-transform: uppercase;
                  }
                  .onslaught-draft-subtitle {
                    font-size: 10px;
                    color: #94a3b8;
                    margin-bottom: 20px;
                    letter-spacing: 0.5px;
                  }
                  .onslaught-draft-cards-container {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    align-items: stretch;
                    max-width: 900px;
                    width: 90%;
                  }
                  .draft-card {
                    flex: 1;
                    background: linear-gradient(180deg, #130d22 0%, #07050d 100%);
                    border: 1.5px solid #475569;
                    border-radius: 8px;
                    padding: 16px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    cursor: pointer;
                    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.6);
                    min-width: 140px;
                    max-width: 240px;
                    box-sizing: border-box;
                  }
                  .draft-card:hover {
                    transform: translateY(-4px);
                  }
                  .draft-card.standard {
                    border-color: #38bdf8;
                  }
                  .draft-card.standard:hover {
                    box-shadow: 0 0 15px rgba(56, 189, 248, 0.35);
                  }
                  .draft-card.corrupted {
                    border-color: #e67e22;
                  }
                  .draft-card.corrupted:hover {
                    box-shadow: 0 0 15px rgba(230, 126, 34, 0.35);
                  }
                  .draft-card.mythic {
                    border-color: #a855f7;
                  }
                  .draft-card.mythic:hover {
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
                  }
                  .draft-card-name {
                    font-size: 11.5px;
                    font-weight: 900;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    line-height: 1.2;
                  }
                  .draft-card-tier {
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 6px;
                    border-radius: 3px;
                    margin-bottom: 12px;
                    border: 1px solid;
                    text-transform: uppercase;
                    line-height: 1;
                  }
                  .draft-card.standard .draft-card-name { color: #38bdf8; }
                  .draft-card.standard .draft-card-tier { color: #38bdf8; border-color: rgba(56,189,248,0.3); background: rgba(56,189,248,0.06); }
                  .draft-card.corrupted .draft-card-name { color: #e67e22; }
                  .draft-card.corrupted .draft-card-tier { color: #e67e22; border-color: rgba(230,126,34,0.3); background: rgba(230,126,34,0.06); }
                  .draft-card.mythic .draft-card-name { color: #a855f7; }
                  .draft-card.mythic .draft-card-tier { color: #a855f7; border-color: rgba(168,85,247,0.3); background: rgba(168,85,247,0.06); }

                  .draft-card-desc {
                    font-size: 9.5px;
                    color: #cbd5e1;
                    line-height: 1.4;
                    margin-bottom: 8px;
                    flex: 1;
                    white-space: normal;
                  }
                  .draft-card-modifier-group {
                    width: 100%;
                    border-top: 1px dashed rgba(255,255,255,0.08);
                    padding-top: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    text-align: left;
                  }
                  .draft-mod-line {
                    font-size: 9px;
                    font-weight: bold;
                    font-family: monospace;
                  }
                  .draft-mod-line.buff { color: #34d399; }
                  .draft-mod-line.debuff { color: #f87171; }

                  @keyframes draftFadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                  }
                </style>
              `;

      // Render each rolled draft choice cards inside horizontal flex layout
      let cardsHtml = choices
        .map((card) => {
          let typeClass =
            card.isMythic || card.isSingular
              ? "mythic"
              : card.isCorrupted
                ? "corrupted"
                : "standard";
          let tierLabel =
            card.isMythic || card.isSingular
              ? "Mythic"
              : card.isCorrupted
                ? "Corrupted"
                : "Standard";

          // Display current cards drafted stacking indicators
          let deck = window.playerStats.crucibleDraftDeck || [];
          let count = deck.filter((id) => id === card.id).length;
          let stackBadge =
            card.isMythic || card.isSingular
              ? ""
              : card.isCorrupted
                ? ` (${count}/3)`
                : ` (${count}x)`;

          // Parse explicit card modifier displays
          let modLinesHtml = "";
          if (card.modifiersDisplay) {
            let lines = [];
            if (card.modifiersDisplay.buff) {
              lines.push(
                `<div class="draft-mod-line buff">[BUFF] + ${card.modifiersDisplay.buff}</div>`,
              );
            }
            if (card.modifiersDisplay.debuff) {
              lines.push(
                `<div class="draft-mod-line debuff">[DEBUFF] - ${card.modifiersDisplay.debuff}</div>`,
              );
            }
            modLinesHtml = `<div class="draft-card-modifier-group">${lines.join("")}</div>`;
          }

          return `
                    <div class="draft-card ${typeClass}" onclick="event.stopPropagation(); window.selectOnslaughtDraftCard('${card.id}')">
                      <span class="draft-card-name">${card.name}</span>
                      <span class="draft-card-tier">${tierLabel}${stackBadge}</span>
                      <p class="draft-card-desc">${card.desc}</p>
                      ${modLinesHtml}
                    </div>
                  `;
        })
        .join("");

      overlay.innerHTML = `
                ${styleHtml}
                <div class="onslaught-draft-title">Draft Potion Matrix</div>
                <div class="onslaught-draft-subtitle">Choose one upgrade to attune your matrix for the next 5 waves</div>
                <div class="onslaught-draft-cards-container">
                  ${cardsHtml}
                </div>
              `;

      container.appendChild(overlay);

      // Prevent pointer events leaking down onto active game canvas
      overlay.addEventListener("pointerdown", (e) => e.stopPropagation());
      overlay.addEventListener("touchstart", (e) => e.stopPropagation());
    };

    // Selection Resolution Handler
    window.selectOnslaughtDraftCard = function (cardId) {
      // If drafting an 11th card (deck is full), transition into overwrite screen
      let deck = window.playerStats.crucibleDraftDeck || [];
      if (deck.length >= 10) {
        window.triggerOnslaughtReplaceCard(cardId);
        return; // Intercept! Do not push or conclude yet
      }

      let overlay = document.getElementById("onslaught-draft-overlay");
      if (overlay) {
        overlay.remove();
      }

      // Push selection to run deck
      window.playerStats.crucibleDraftDeck =
        window.playerStats.crucibleDraftDeck || [];
      window.playerStats.crucibleDraftDeck.push(cardId);

      // Play click sound feedback
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }

      // Recalculate statistics to immediately apply card effects
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }

      // Proceed with concluding draft selection
      window.concludeDraftSelection();
    };

    window.triggerOnslaughtReplaceCard = function (newCardId) {
      let overlay = document.getElementById("onslaught-draft-overlay");
      if (!overlay) return;

      let newCard = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === newCardId);
      if (!newCard) return;

      let deck = window.playerStats.crucibleDraftDeck || [];

      // Render active 10 cards inside the replace container
      let cardsMarkup = deck
        .map((activeCardId, idx) => {
          let card = window.CRUCIBLE_DRAFT_POOL.find(
            (c) => c.id === activeCardId,
          );
          if (!card) return "";

          return `
                              <div class="replace-card-row" onclick="event.stopPropagation(); window.replaceOnslaughtDraftCard(${idx}, '${newCardId}')">
                                <div class="replace-card-title">
                                  <span class="replace-card-idx">Slot ${idx + 1}</span>
                                  <span style="margin-left: 8px;">${card.name}</span>
                                </div>
                                <div class="replace-card-stats">${card.desc}</div>
                              </div>
                            `;
        })
        .join("");

      overlay.innerHTML = `
                            <style>
                              .replace-view-container {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                width: 100%;
                                max-width: 600px;
                                animation: draftFadeIn 0.25s ease-out;
                              }
                              .replace-view-header {
                                font-size: 14px;
                                font-weight: bold;
                                color: #ef4444;
                                letter-spacing: 1.5px;
                                text-transform: uppercase;
                                margin-bottom: 4px;
                                text-shadow: 0 2px 4px #000;
                              }
                              .replace-view-subtitle {
                                font-size: 9.5px;
                                color: #94a3b8;
                                margin-bottom: 12px;
                                text-align: center;
                              }
                              .incoming-card-showcase {
                                background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
                                border: 2px solid #a855f7;
                                border-radius: 8px;
                                padding: 12px;
                                width: 100%;
                                margin-bottom: 16px;
                                text-align: center;
                                box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
                              }
                              .incoming-label {
                                font-size: 8px;
                                font-weight: bold;
                                color: #a855f7;
                                letter-spacing: 1px;
                                text-transform: uppercase;
                                margin-bottom: 4px;
                                display: block;
                              }
                              .incoming-title {
                                font-size: 12px;
                                font-weight: 900;
                                color: #fff;
                                margin-bottom: 2px;
                              }
                              .incoming-desc {
                                font-size: 9.5px;
                                color: #cbd5e1;
                                line-height: 1.35;
                              }
                              .replace-grid-title {
                                font-size: 9px;
                                font-weight: bold;
                                color: #e2e8f0;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                margin-bottom: 6px;
                                align-self: flex-start;
                                width: 100%;
                                border-bottom: 1px solid rgba(255,255,255,0.08);
                                padding-bottom: 4px;
                              }
                            </style>
                            <div class="replace-view-container">
                              <div class="replace-view-header">Matrix Deck Full!</div>
                              <div class="replace-view-subtitle">Your matrix deck has a strict 10-card cap. Select an active card to discard and overwrite.</div>

                              <!-- Showcase the newly drafted card -->
                              <div class="incoming-card-showcase">
                                <span class="incoming-label">Incoming Card</span>
                                <div class="incoming-title">${newCard.name}</div>
                                <p class="incoming-desc">${newCard.desc}</p>
                              </div>

                              <div class="replace-grid-title">Active Deck Cards (Select one to overwrite)</div>
                              <div class="replace-cards-grid" style="width: 100%; max-height: 240px;">
                                ${cardsMarkup}
                              </div>
                            </div>
                          `;
    };

    window.replaceOnslaughtDraftCard = function (idx, newCardId) {
      let overlay = document.getElementById("onslaught-draft-overlay");
      if (overlay) {
        overlay.remove();
      }

      // Overwrite selected index in deck
      window.playerStats.crucibleDraftDeck[idx] = newCardId;

      // Play click sound feedback
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }

      // Recalculate statistics to immediately apply card effects
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }

      // Proceed with concluding draft selection
      window.concludeDraftSelection();
    };

    window.concludeDraftSelection = function () {
      if (window.playerStats.pendingCrucibleDrafts > 0) {
        window.playerStats.pendingCrucibleDrafts--;
        if (window.playerStats.pendingCrucibleDrafts > 0) {
          // Trigger next sequential pre-run draft
          window.triggerOnslaughtDraft();
        } else {
          // Bypassed drafts are fully concluded; unpause game loop and spawn starting wave
          setGamePaused(window.onslaughterSavePauseState || false);
          window.spawnOnslaughtWave(window.playerStats.crucibleWave);
        }
      } else {
        // Standard end-of-wave draft complete; unpause loop and advance wave
        setGamePaused(window.onslaughterSavePauseState || false);
        window.advanceOnslaughtWave();
      }
    };

    if (map && map.revealSightRadius) {
      let originalReveal = map.revealSightRadius;
      map.revealSightRadius = function (px, py, intBonus) {
        originalReveal.call(this, px, py, intBonus);
      };
    }

    // 6. Spawn Floor Sentinel if Portal is Locked (Standard Floors Only)
    if (
      map.portalLocked &&
      !isMiniBoss &&
      !isMajorBoss &&
      !window.playerStats.isCrucibleMode &&
      !isRift
    ) {
      let fLvl = depth;
      let enemyScale = window.playerStats.currentRunEnemyStrength || 1.0;
      let sIdx = Math.floor((fLvl - 1) / 12);
      let repStage = window.getEffectiveStage(fLvl * 1.25 + sIdx * 12.0);
      let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);

      // Apply Sawtooth Pacing Curve
      let localStep = (fLvl - 1) % 12;
      let sawtoothMod = 0.8 + 0.045 * localStep;
      let repScale = Math.pow(repGrowth, repStage * 0.95) * sawtoothMod;

      // Sentinels are 2x as tough as regular floor mobs
      let sentinelHp = Math.round(80 * repScale * enemyScale);
      let sentinelAtk = Math.round(11 * repScale * enemyScale);

      // Apply solid baseline floors to prevent early-game trivialization (Balanced to eliminate health pool bloat)
      let sentinelHpFloor = 100;
      let sentinelAtkFloor = 14;
      sentinelHp = Math.max(
        Math.round(sentinelHpFloor * (1 + fLvl * 0.025)),
        sentinelHp,
      );
      sentinelAtk = Math.max(
        Math.round(sentinelAtkFloor * (1 + fLvl * 0.01)),
        sentinelAtk,
      );

      let sector = Math.floor((depth - 1) / 12);
      let mobInfo = window.getMobPoolForDepth(depth);

      const sentinelNames = [
        "Oakheart Sentinel",
        "Glacial Sentinel",
        "Smelt-Iron Sentinel",
        "Basilisk Sentinel",
        "Singularity Sentinel",
        "Clockwork Sentinel",
        "Nexus Sentinel",
      ];
      let name = sentinelNames[sector] || "Floor Sentinel";

      let pStats =
        typeof window.resolvePlayerStats === "function"
          ? window.resolvePlayerStats()
          : {};
      let rareRate = pStats.rareSpawn !== undefined ? pStats.rareSpawn : 0.01;
      let isRare = Math.random() < rareRate;
      let isElite = true; // Sentinels are Elites by default

      let finalHp = sentinelHp;
      let finalAtk = sentinelAtk;

      if (isElite && isRare) {
        finalHp = Math.round(finalHp * 2.5);
        finalAtk = Math.round(finalAtk * 1.6);
      } else if (isElite) {
        finalHp = Math.round(finalHp * 1.5);
        finalAtk = Math.round(finalAtk * 1.25);
      }

      addActiveDungeonMob({
        id: window.idCounter++,
        type: "mob",
        isPortalSentinel: true,
        isElite: isElite,
        isRare: isRare,
        eliteAffix:
          sector === 0
            ? "web_weaver"
            : sector === 1
              ? "glacial_warden"
              : sector === 2
                ? "slag_shaper"
                : sector === 3
                  ? "toxic_decay"
                  : null,
        visualTier: mobInfo.tier,
        visualType: mobInfo.type,
        name: isRare ? `RARE ${name.toUpperCase()}` : name,
        x: map.extractionTile.x * tileSize + 4,
        y: map.extractionTile.y * tileSize + 4,
        w: 24,
        h: 24,
        hp: BigNum.from(finalHp),
        maxHp: BigNum.from(finalHp),
        atk: finalAtk,
        flashTimer: 0,
        attackCooldown: 0,
        discovered: true,
        hopTimer: 0,
      });
    }

    window.updateHUD();
    let floorTitle = isMajorBoss
      ? `FLOOR ${depth} - MAJOR DUNGEON BOSS`
      : isMiniBoss
        ? `FLOOR ${depth} - MINI BOSS WARDEN`
        : `FLOOR ${depth} DESCENT`;

    window.spawnFloatingText(
      window.player.x,
      window.player.y - 20,
      floorTitle,
      isMajorBoss ? "#e74c3c" : isMiniBoss ? "#e67e22" : "#00d2ff",
    );
  };

  export const interactWithStation = function (stationType) {
    if (stationType === window.TILE_TYPES.STATION_PORTAL) {
      let activeEvent = window.playerStats.activePortalEvent || "expedition";
      if (activeEvent === "onslaught") {
        window.playerStats.isCrucibleMode = true;
        window.openHubPortalModal();
      } else if (activeEvent === "rift") {
        let L = window.playerStats.activeRiftLevel || 1;
        let gName = (window.playerStats.selectedRiftGuardian || "aegis_goliath")
          .replace("_", " ")
          .toUpperCase();

        window.showCustomConfirm(
          "ENTER THE RIFT",
          `Step through the portal to duel <strong style="color:#00ffff;">${gName}</strong> (Rift Level ${L})?`,
          "ENTER DUEL",
          "CANCEL",
          "#a855f7",
          function () {
            window.launchRiftDuel();
          },
        );
      } else {
        window.playerStats.isCrucibleMode = false;
        window.openHubPortalModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_FORGE) {
      if (typeof window.toggleForgeModal === "function") {
        window.toggleForgeModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_ENCHANT) {
      if (typeof window.toggleEnchantmentModal === "function") {
        window.toggleEnchantmentModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_GACHAPON) {
      if (typeof window.openGachaModal === "function") {
        window.openGachaModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_SHOP) {
      if (typeof window.toggleShopModal === "function") {
        window.toggleShopModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_BOUNTY) {
      if (typeof window.toggleBountyModal === "function") {
        window.toggleBountyModal();
      }
    } else if (stationType === window.TILE_TYPES.STATION_INN) {
      if (typeof window.openTrialsAltarModal === "function") {
        window.openTrialsAltarModal();
      }
    }
  };

  export const requestAbandonRun = function () {
    if (window.currentGameState === window.GAME_STATES.HUB) return;

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Retreat to Hub",
        "Are you sure you want to abandon the current run?<br><br><span style='color: #e74c3c;'><strong>WARNING:</strong> All uninsured equipped gear and items in your carried satchel will be permanently lost!</span>",
        "RETREAT",
        "CANCEL",
        "#e74c3c",
        function () {
          window.triggerExtraction(false, true);
        },
      );
    } else {
      if (
        confirm(
          "Are you sure you want to retreat? All uninsured equipped gear and items in your carried satchel will be permanently lost!",
        )
      ) {
        window.triggerExtraction(false, true);
      }
    }
  };

  export const openPortalChoiceModal = function () {
    let modal = document.getElementById("portal-modal");
    let titleEl = document.getElementById("portal-modal-title");
    let subEl = document.getElementById("portal-modal-subtitle");
    let descendBtn = document.getElementById("portal-btn-descend");

    if (!modal) return;

    let depth = window.player.depth || 1;
    let nextFloor = depth + 1;

    let isMiniBossNext = nextFloor % 12 === 4 || nextFloor % 12 === 8;
    let isMajorBossNext = nextFloor % 12 === 0;

    let isMiniBossCurrent = depth % 12 === 4 || depth % 12 === 8;
    let isMajorBossCurrent = depth % 12 === 0;

    let isChallenge = window.playerStats.activeSpecialChallenge !== null;
    let isRift = window.playerStats.isRiftMode === true;

    if (isRift) {
      if (titleEl) titleEl.innerText = "RIFT TRIAL COMPLETED!";
      if (subEl)
        subEl.innerText =
          "You have successfully defeated the Rift Guardian! Tap Extract to secure your legendary mastery rewards!";
      if (descendBtn) descendBtn.style.display = "none";
    } else if (isChallenge && depth >= 4) {
      if (titleEl) titleEl.innerText = "CONTRACT COMPLETED!";
      if (subEl)
        subEl.innerText =
          "You have successfully conquered all 4 floors of the Special Challenge! Tap Extract to secure your legendary rewards!";
      if (descendBtn) descendBtn.style.display = "none";
    } else {
      if (descendBtn) descendBtn.style.display = "inline-block";
      if (titleEl) {
        if (isMajorBossCurrent) {
          titleEl.innerText = `DUNGEON SECTOR CLEARED (FLOOR ${depth})`;
        } else if (isMiniBossCurrent) {
          titleEl.innerText = `MINI BOSS DEFEATED (FLOOR ${depth})`;
        } else {
          titleEl.innerText = `DUNGEON PORTAL (FLOOR ${depth})`;
        }
      }

      if (isMajorBossNext) {
        if (subEl)
          subEl.innerText = `Floor ${depth} Cleared! Major Dungeon Boss awaits on Floor ${nextFloor}!`;
        if (descendBtn) {
          descendBtn.innerText = `ENTER MAJOR BOSS ARENA (FLOOR ${nextFloor})`;
          descendBtn.style.background =
            "linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)";
          descendBtn.style.borderColor = "#f87171";
        }
      } else if (isMiniBossNext) {
        if (subEl)
          subEl.innerText = `Floor ${depth} Cleared! Mini Guard Boss awaits on Floor ${nextFloor}!`;
        if (descendBtn) {
          descendBtn.innerText = `ENTER MINI BOSS ARENA (FLOOR ${nextFloor})`;
          descendBtn.style.background =
            "linear-gradient(180deg, #f97316 0%, #c2410c 100%)";
          descendBtn.style.borderColor = "#fb923c";
        }
      } else if (isMajorBossCurrent) {
        if (subEl)
          subEl.innerText = `Sector Boss Slayed! Checkpoint unlocked for Floor ${nextFloor}.`;
        if (descendBtn) {
          descendBtn.innerText = `DESCEND TO SECTOR ${Math.floor(depth / 12) + 1} (FLOOR ${nextFloor})`;
          descendBtn.style.background =
            "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)";
          descendBtn.style.borderColor = "#c084fc";
        }
      } else {
        if (subEl)
          subEl.innerText = `Floor ${depth} Cleared. Choose your path:`;
        if (descendBtn) {
          descendBtn.innerText = `DESCEND TO FLOOR ${nextFloor}`;
          descendBtn.style.background =
            "linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)";
          descendBtn.style.borderColor = "#c084fc";
        }
      }
    }

    modal.style.display = "flex";
  };

  export const checkRecoveryChestUnclaimed = function () {
    let rec = window.playerStats && window.playerStats.recoveryLoot;
    if (
      rec &&
      rec.floor === window.player.depth &&
      rec.items &&
      rec.items.length > 0
    ) {
      return true;
    }
    return false;
  };

  export const executePortalDescend = function (bypassWarning = false) {
    if (window.activeDungeonMap.portalLocked) {
      let p = window.player;
      if (window.logicClock % 60 === 0) {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          "PORTAL SEALED: DEFEAT THE SENTINEL!",
          "#ef4444",
        );
        if (window.combatVisuals) {
          window.combatVisuals.triggerScreenShake(3, 6);
        }
        if (window.SoundManager) window.SoundManager.play("block");
      }
      return;
    }

    if (window.checkRecoveryChestUnclaimed() && !bypassWarning) {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unclaimed Recovery Chest",
          "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! If you descend without claiming it, your lost items and Gold will be permanently overwritten. Proceed anyway?",
          "DESCEND WITHOUT LOOT",
          "RETURN TO FIND IT",
          "#e74c3c",
          function () {
            window.executePortalDescend(true);
          },
        );
      } else {
        if (
          confirm(
            "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! Proceed anyway?",
          )
        ) {
          window.executePortalDescend(true);
        }
      }
      return;
    }

    let modal = document.getElementById("portal-modal");
    if (modal) modal.style.display = "none";

    let p = window.player;
    let map = window.activeDungeonMap;
    if (map && map.grid && p) {
      let tx = Math.floor(p.x / map.tileSize);
      let ty = Math.floor(p.y / map.tileSize);
      if (map.grid[ty] && map.grid[ty][tx] !== undefined) {
        map.grid[ty][tx] = window.TILE_TYPES.FLOOR;
      }
    }

    if (typeof window.progressMission === "function") {
      window.progressMission("dungeons", 1);
    }

    window.player.depth++;
    window.loadDungeonFloor(window.player.depth);
  };

  export const executePortalExtract = function (bypassWarning = false) {
    if (window.activeDungeonMap.portalLocked) {
      let p = window.player;
      if (window.logicClock % 60 === 0) {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          "PORTAL SEALED: DEFEAT THE SENTINEL!",
          "#ef4444",
        );
        if (window.combatVisuals) {
          window.combatVisuals.triggerScreenShake(3, 6);
        }
        if (window.SoundManager) window.SoundManager.play("block");
      }
      return;
    }

    if (window.checkRecoveryChestUnclaimed() && !bypassWarning) {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unclaimed Recovery Chest",
          "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! If you extract without claiming it, your lost items and Gold will be permanently overwritten. Proceed anyway?",
          "EXTRACT WITHOUT LOOT",
          "RETURN TO FIND IT",
          "#e74c3c",
          function () {
            window.executePortalExtract(true);
          },
        );
      } else {
        if (
          confirm(
            "WARNING: Your dropped Recovery Chest is still unclaimed on this floor! Proceed anyway?",
          )
        ) {
          window.executePortalExtract(true);
        }
      }
      return;
    }

    let modal = document.getElementById("portal-modal");
    if (modal) modal.style.display = "none";

    let p = window.player;
    let map = window.activeDungeonMap;
    if (map && map.grid && p) {
      let tx = Math.floor(p.x / map.tileSize);
      let ty = Math.floor(p.y / map.tileSize);
      if (map.grid[ty] && map.grid[ty][tx] !== undefined) {
        map.grid[ty][tx] = window.TILE_TYPES.FLOOR;
      }
    }

    if (typeof window.progressMission === "function") {
      window.progressMission("dungeons", 1);
    }

    window.triggerExtraction(true);
  };

  export const decrementPotionRunCharges = function () {
    let p = window.playerStats;
    if (!p) return;

    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};
    let effectiveInt = Math.max(0, (pStats.int || 5) - 5);
    let preservationChance = (effectiveInt * 0.5) / (effectiveInt + 95);

    const potTypes = [
      {
        runKey: "atkPotionRuns",
        timerKey: "atkPotionTimer",
        name: "Attack Elixir",
      },
      {
        runKey: "hpPotionRuns",
        timerKey: "hpPotionTimer",
        name: "Vitality Elixir",
      },
      {
        runKey: "defPotionRuns",
        timerKey: "defPotionTimer",
        name: "Armored Elixir",
      },
      {
        runKey: "hastePotionRuns",
        timerKey: "hastePotionTimer",
        name: "Haste Elixir",
      },
      {
        runKey: "xpPotionRuns",
        timerKey: "xpPotionTimer",
        name: "Double XP Elixir",
      },
      {
        runKey: "dropPotionRuns",
        timerKey: "dropPotionTimer",
        name: "Double Drop Elixir",
      },
      {
        runKey: "qlyPotionRuns",
        timerKey: "qlyPotionTimer",
        name: "Drop Quality Elixir",
      },
    ];

    let preservedList = [];
    potTypes.forEach((pot) => {
      let currentRuns = (p[pot.runKey] || 0) + (p[pot.timerKey] > 0 ? 1 : 0);
      p[pot.timerKey] = 0;

      if (currentRuns > 0) {
        if (Math.random() < preservationChance) {
          preservedList.push(pot.name);
          p[pot.runKey] = currentRuns;
        } else {
          p[pot.runKey] = Math.max(0, currentRuns - 1);
        }
      }
    });

    if (preservedList.length > 0) {
      let pctStr = Math.round(preservationChance * 100);
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `[Alchemical Preservation ${pctStr}%] Preserved charge on: ${preservedList.join(", ")}!`,
          "#34d399",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        try {
          window.SoundManager.play("potion");
        } catch (e) {
          window.SoundManager.play("spell");
        }
      }
    }
  };

  export const triggerExtraction = function (success = true, isAbandon = false) {
    window.playerStats.dungeonRunInProgress = false;
    window.decrementPotionRunCharges();
    window.playerStats.activeDungeonSigil = null; // Clear and consume active Sigil on run end

    let activeRunGold = BigNum.from(window.playerStats.runGold || 0);

    // --- RIFT MODE EXTRACTION INTERCEPT ---
    if (window.playerStats.isRiftMode) {
      let summaryModal = document.getElementById("summary-modal");
      let titleEl = document.getElementById("summary-title");
      let subEl = document.getElementById("summary-subtitle");
      let listEl = document.getElementById("summary-loot-list");
      let btnEl = document.getElementById("summary-action-btn");
      let nemesisCard = document.getElementById("death-nemesis-card");

      if (!summaryModal || !titleEl || !listEl) return;

      if (nemesisCard) nemesisCard.style.display = "none";

      let L = window.playerStats.activeRiftLevel || 1;
      let gName = (window.playerStats.selectedRiftGuardian || "aegis_goliath")
        .replace("_", " ")
        .toUpperCase();

      if (success) {
        window.playerStats.highestRiftLevelCleared = Math.max(
          window.playerStats.highestRiftLevelCleared || 0,
          L,
        );

        titleEl.innerText = "RIFT TRIAL CLEARED";
        titleEl.style.color = "#2ecc71";
        if (subEl) subEl.innerText = `${gName} Defeated | Rift Level ${L}`;

        // Compute rewards using balanced power curves
        let xpGranted = Math.round(250 * Math.pow(L, 0.85));
        let shardsGranted = Math.floor(15 + 3.0 * L);
        let dustGranted = Math.floor(30 + 6.0 * L);

        // Catalyst Cores: Math.floor(L/10) + fractional chance of (L % 10) * 10%
        let coreCount = Math.floor(L / 10);
        let remainder = L % 10;
        if (remainder > 0 && Math.random() < remainder * 0.1) {
          coreCount++;
        }

        // Astral Essence chance: min(100%, 5% + 1.8% * L)
        let essenceChance = Math.min(1.0, 0.05 + 0.018 * L);
        let gotEssence = Math.random() < essenceChance;

        // Apply rewards
        window.playerStats.astralShards =
          (window.playerStats.astralShards || 0) + shardsGranted;
        window.playerStats.astralDust =
          (window.playerStats.astralDust || 0) + dustGranted;

        if (coreCount > 0) {
          window.addEtcDrop("Catalyst Core", coreCount, true);
        }
        if (gotEssence) {
          window.addEtcDrop("Astral Essence", 1, true);
        }

        // Gain Subweapon Mastery XP
        if (window.equippedSlots && window.equippedSlots.subweapon) {
          let sub = window.equippedSlots.subweapon;
          let subType = sub.subType || sub.type || "shield";
          if (["shield", "dagger", "tome"].includes(subType)) {
            window.gainSubweaponXp(subType, xpGranted);
          }
        }

        let rewardListHtml = `
            <div style="display:flex; flex-direction:column; gap:6px; text-align:left; font-family:monospace; font-size:11px;">
              <div style="background:#091a10; border:1px solid #10b981; border-left:4px solid #2ecc71; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#a3fd83; font-weight:bold;">[MASTERY XP] Mastery XP Gained:</span>
                <strong style="color:#ffffff; font-size:12px;">+${xpGranted.toLocaleString()} XP</strong>
              </div>
              <div style="background:#0c0d14; border:1px solid #1e293b; border-left:4px solid #00ffff; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#94a3b8; font-weight:bold;">[VAULT] Astral Shards Secured:</span>
                <strong style="color:#00ffff; font-size:12px;">+${shardsGranted.toLocaleString()} Shards</strong>
              </div>
              <div style="background:#0d0615; border:1px solid #4c1d95; border-left:4px solid #a855f7; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#cbd5e1; font-weight:bold;">[VAULT] Astral Dust Secured:</span>
                <strong style="color:#a855f7; font-size:12px;">+${dustGranted.toLocaleString()} Dust</strong>
              </div>
              ${
                coreCount > 0
                  ? `
              <div style="background:#0a100d; border:1px solid #06241a; border-left:4px solid #2ecc71; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#64748b; font-weight:bold;">[MATERIAL] Catalyst Cores:</span>
                <strong style="color:#2ecc71; font-size:12px;">+${coreCount} Cores</strong>
              </div>`
                  : ""
              }
              ${
                gotEssence
                  ? `
              <div style="background:#0a0c1a; border:1px solid #3b0764; border-left:4px solid #df9ffb; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#94a3b8; font-weight:bold;">[MATERIAL] Astral Essence:</span>
                <strong style="color:#df9ffb; font-size:12px;">+1 Essence</strong>
              </div>`
                  : ""
              }
            </div>
          `;
        listEl.innerHTML = rewardListHtml;
      } else {
        titleEl.innerText = "RIFT TRIAL FAILED";
        titleEl.style.color = "#e74c3c";
        if (subEl) subEl.innerText = `${gName} Defeated You | Rift Level ${L}`;

        listEl.innerHTML = `
            <div style="background:rgba(231,76,60,0.06); border:1px dashed #ef4444; border-radius:6px; padding:12px; text-align:center; font-family:monospace; font-size:10px; line-height:1.5; color:#f87171;">
              <strong>[RIFT TRIAL PENALTY EXEMPTION]</strong><br><br>
              All equipped gear and inventory items are 100% safe and have been preserved intact.<br>
              Practice your timing, refine your build, and challenge the Rift Altar again!
            </div>
          `;
      }

      if (btnEl) btnEl.innerText = "RETURN TO HUB ALTAR";
      summaryModal.style.display = "flex";

      // Reset Rift State
      window.playerStats.isRiftMode = false;

      if (typeof window.saveGame === "function") window.saveGame();
      return;
    }

    // --- ONSLAUGHT / CRUCIBLE MODE EXTRACTION INTERCEPT ---
    if (window.playerStats.isCrucibleMode) {
      let summaryModal = document.getElementById("summary-modal");
      let titleEl = document.getElementById("summary-title");
      let subEl = document.getElementById("summary-subtitle");
      let listEl = document.getElementById("summary-loot-list");
      let btnEl = document.getElementById("summary-action-btn");
      let nemesisCard = document.getElementById("death-nemesis-card");

      if (!summaryModal || !titleEl || !listEl) return;

      // Hide nemesis card since Arena death is a standard progression conclusion
      if (nemesisCard) nemesisCard.style.display = "none";

      let wavesCleared = Math.max(
        0,
        (window.playerStats.crucibleWave || 1) - 1,
      );
      let shardsSecured = window.playerStats.crucibleAccumulatedShards || 0;
      let coresSecured = window.playerStats.crucibleAccumulatedCores || 0;

      // Secure resources permanently to the Vault database
      window.playerStats.astralShards =
        (window.playerStats.astralShards || 0) + shardsSecured;
      if (coresSecured > 0 && typeof window.addEtcDrop === "function") {
        window.addEtcDrop("Catalyst Core", coresSecured, true);
      }

      // Update personal best peak waves survived
      window.playerStats.cruciblePeak = Math.max(
        window.playerStats.cruciblePeak || 0,
        wavesCleared,
      );

      titleEl.innerText = "ONSLAUGHT CONCLUDED";
      titleEl.style.color = "#a855f7";

      if (subEl) {
        subEl.innerText = `Waves Survived: ${wavesCleared} | Personal Best: Wave ${window.playerStats.cruciblePeak}`;
      }

      // Render clean, informative summary panel with NO Emojis
      listEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto; text-align:left; font-family:monospace; font-size:11px;">
          <div style="background:#0e0a1a; border:1px solid #3b0764; border-left:4px solid #a855f7; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#df9ffb; font-weight:bold;">[PERFORMANCE] Waves Cleared:</span>
            <strong style="color:#ffffff; font-size:12px;">${wavesCleared} Waves</strong>
          </div>
          <div style="background:#0c0d14; border:1px solid #1e293b; border-left:4px solid #00ffff; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#94a3b8; font-weight:bold;">[REWARD] Astral Shards Gained:</span>
            <strong style="color:#00ffff; font-size:12px;">+${shardsSecured} Shards</strong>
          </div>
          <div style="background:#0a100d; border:1px solid #06241a; border-left:4px solid #2ecc71; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#64748b; font-weight:bold;">[REWARD] Catalyst Cores Gained:</span>
            <strong style="color:#2ecc71; font-size:12px;">+${coresSecured} Cores</strong>
          </div>
          <div style="background:rgba(255,255,255,0.01); border:1px dashed #334155; padding:8px 12px; border-radius:6px; text-align:center; color:#94a3b8; font-size:9.5px; line-height:1.45;">
            [SAFE ZONE PROTECTION ACTIVE]<br>
            As a trial of pure skill, no equipped gear or items from your carried satchel were at risk of being lost. All items are 100% protected and safe.
          </div>
        </div>
      `;

      if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";
      summaryModal.style.display = "flex";

      if (typeof window.saveGame === "function") window.saveGame();
      return;
    }

    // Vacuum any remaining ground items and materials into satchel before extraction processing
    if (window.groundLoot && window.groundLoot.length > 0) {
      window.groundLoot.forEach((gl) => {
        if (gl && gl.item) {
          let isEquipped = window.tryAutoEquip
            ? window.tryAutoEquip(gl.item)
            : false;
          if (!isEquipped && window.player) {
            if (!window.player.bag) window.player.bag = [];
            window.player.bag.push(gl.item);
          }
        }
      });
      window.groundLoot = [];
    }

    if (window.groundMaterials && window.groundMaterials.length > 0) {
      window.groundMaterials.forEach((gm) => {
        if (gm) {
          if (gm.name === "Luminous Soul" || gm.name.includes("Key")) {
            window.addEtcDrop(gm.name, gm.qty, true);
          } else if (window.player) {
            if (!window.player.pendingScraps) window.player.pendingScraps = {};
            window.player.pendingScraps[gm.name] =
              (window.player.pendingScraps[gm.name] || 0) + gm.qty;
          }
        }
      });
      window.groundMaterials = [];
    }
    let summaryModal = document.getElementById("summary-modal");
    let titleEl = document.getElementById("summary-title");
    let subEl = document.getElementById("summary-subtitle");
    let listEl = document.getElementById("summary-loot-list");
    let btnEl = document.getElementById("summary-action-btn");
    let nemesisCard = document.getElementById("death-nemesis-card");
    let killerNameEl = document.getElementById("death-killer-name");

    if (!summaryModal || !titleEl || !listEl) return;

    if (!success && !isAbandon) {
      if (nemesisCard) nemesisCard.style.display = "flex";
      if (killerNameEl) {
        killerNameEl.innerText = (
          window.playerStats.killedBy || "UNKNOWN FOE"
        ).toUpperCase();
      }
      setTimeout(() => {
        if (window.RenderEngine && window.RenderEngine.renderNemesisPreview) {
          window.RenderEngine.renderNemesisPreview(
            window.playerStats.killedByMob,
          );
        }
      }, 50);
    } else {
      if (nemesisCard) nemesisCard.style.display = "none";
    }

    let extractedLoot = [...(window.player.bag || [])].filter(
      (item) => !item.isStarterItem,
    );
    let savedInsuredItems = [];
    let lostItems = [];

    let pendingScrapsList = [];
    if (window.player && window.player.pendingScraps) {
      for (let sName in window.player.pendingScraps) {
        let count = window.player.pendingScraps[sName];
        if (count > 0) {
          pendingScrapsList.push({ name: sName, count: count });
        }
      }
    }

    if (success) {
      titleEl.innerText = "EXTRACTION SUCCESSFUL";
      titleEl.style.color = "#2ecc71";

      window.playerStats.successfulExtractions =
        (window.playerStats.successfulExtractions || 0) + 1;
      let maxBag =
        typeof window.getMaxBagSlots === "function"
          ? window.getMaxBagSlots()
          : 20;
      if (extractedLoot.length >= maxBag) {
        window.playerStats.hasTriggeredFullBag = true;
      }

      if (typeof window.progressMission === "function") {
        if (window.player && window.player.bag) {
          window.progressMission("bag", window.player.bag.length);
        }
        if (window.playerStats.activeSpecialChallenge) {
          window.progressMission("contracts", 1);
        }
      }

      // Subphase 16: Claim Contract rewards and clear active challenge states
      let challenge = window.playerStats.activeSpecialChallenge;
      if (challenge) {
        let goldReward = BigNum.from(challenge.rewards.gold);
        let xpReward = BigNum.from(challenge.rewards.xp);

        window.playerStats.coins = BigNum.from(
          window.playerStats.coins || 0,
        ).add(goldReward);
        if (typeof window.gainXp === "function") {
          window.gainXp(xpReward);
        }
        window.playerStats.astralShards =
          (window.playerStats.astralShards || 0) + challenge.rewards.shards;
        if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop("Catalyst Core", challenge.rewards.cores, true);
        }

        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `✦ Contract Completed! Gained +${window.formatNumber(goldReward)} Gold, +${challenge.rewards.shards} Shards!`,
            "#ffd700",
          );
        }

        window.playerStats.activeSpecialChallenge = null;
        window.playerStats.activeDungeonSigil = null;
      }

      // Deposit pending run scraps into permanent inventory
      pendingScrapsList.forEach((s) => {
        if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop(s.name, s.count, true);
        }
      });
      window.player.pendingScraps = {};

      // Commit volatile run pocket gold safely into permanent Vault coins!
      window.playerStats.coins = BigNum.from(window.playerStats.coins || 0).add(
        activeRunGold,
      );
      window.playerStats.runGold = BigNum.from(0);

      // Award +25% Extraction Bonus XP on total run earnings (base XP already gained in-run)
      let runXp = BigNum.from(window.playerStats.runXp || 0);
      let bonusXp = runXp.mul(0.25).floor();

      if (bonusXp.gt(0) && typeof window.gainXp === "function") {
        window.gainXp(bonusXp);
      }
      window.playerStats.runXp = BigNum.from(0);

      if (subEl) {
        if (challenge) {
          subEl.innerText = `Contract Complete! Secured ${extractedLoot.length} items, ${window.formatNumber(BigNum.from(challenge.rewards.gold).add(activeRunGold))} Gold & ${pendingScrapsList.length} scraps!`;
        } else {
          subEl.innerText = `Secured ${extractedLoot.length} items, ${window.formatNumber(activeRunGold)} Gold & ${pendingScrapsList.length} scraps to Vault! (+25% Bonus XP)`;
        }
      }

      // Save carried bag items permanently to Stash and sync inventory (Separating Gear from Cavern Sigils)
      extractedLoot.forEach((item) => {
        if (item.type === "sigil") {
          if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
          window.inventory.SIGIL.push(item);
        } else if (item.type === "artifact") {
          if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
          window.inventory.ARTIFACT.push(item);
        } else {
          window.player.stash.push(item);
        }
      });
      window.player.bag = [];
      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    } else {
      let salvageRank = window.SkillTreeManager
        ? window.SkillTreeManager.getSkillLevel("utility_emergency_salvage")
        : 0;
      let salvageRatio = salvageRank * 0.05; // 5% to 25%

      let retainedGold = BigNum.from(0);
      let retainedScraps = [];

      if (salvageRatio > 0) {
        // 1. Gold Salvage
        if (activeRunGold.gt(0)) {
          retainedGold = calculateEmergencySalvageGold(
            activeRunGold,
            salvageRatio,
          );
          if (retainedGold.gt(0)) {
            window.playerStats.coins = BigNum.from(
              window.playerStats.coins || 0,
            ).add(retainedGold);
            activeRunGold = activeRunGold.sub(retainedGold);
          }
        }

        // 2. Scraps & Souls Salvage
        if (window.player && window.player.pendingScraps) {
          for (let sName in window.player.pendingScraps) {
            let qty = window.player.pendingScraps[sName] || 0;
            if (qty > 0) {
              let retQty = Math.floor(qty * salvageRatio);
              if (retQty > 0) {
                window.addEtcDrop(sName, retQty, true);
                window.player.pendingScraps[sName] -= retQty;
                retainedScraps.push(`${retQty}x ${sName}`);
              }
            }
          }
        }

        if (retainedGold.gt(0) || retainedScraps.length > 0) {
          let toastMsg = `✦ Emergency Evac (${salvageRank * 5}%): Saved ${retainedGold.gt(0) ? window.formatNumber(retainedGold) + " Gold" : ""}${retainedGold.gt(0) && retainedScraps.length > 0 ? " & " : ""}${retainedScraps.join(", ")} to Vault!`;
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(toastMsg, "#34d399");
          }
        }
      }

      window.player.pendingScraps = {};
      titleEl.innerText = isAbandon ? "RUN ABANDONED" : "CRITICAL DEFEAT";
      titleEl.style.color = isAbandon ? "#e67e22" : "#e74c3c";

      // Reset active run pocket gold
      window.playerStats.runGold = BigNum.from(0);

      // Process Carried Bag Items (Locked items survive in Stash)
      extractedLoot.forEach((item) => {
        if (item.locked) {
          savedInsuredItems.push(item);
          if (item.type === "artifact") {
            if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
            window.inventory.ARTIFACT.push(item);
          } else {
            window.player.stash.push(item);
          }
        } else {
          lostItems.push(item);
        }
      });
      window.player.bag = [];

      // Process Equipped Gear (Unlocked gear is lost on defeat, untempered starter items vanish silently)
      for (let slotKey in window.equippedSlots) {
        let eqItem = window.equippedSlots[slotKey];
        if (eqItem) {
          if (eqItem.isStarterItem) {
            // Starter items are temporary and vanish silently on defeat/abandon
            window.equippedSlots[slotKey] = null;
          } else if (eqItem.locked) {
            savedInsuredItems.push(eqItem);
          } else {
            lostItems.push(eqItem);
            window.equippedSlots[slotKey] = null;
          }
        }
      }

      // Safety Net: Ensure player is never left without a weapon option
            let hasWeapon =
              window.equippedSlots.weapon ||
              window.player.stash.some((i) => i.type === "weapon");
            if (!hasWeapon) {
              let starterSword = window.createItemObject("weapon", 0, 1, 0);
              starterSword.noun = "Broadsword"; // Aligns graphic asset with "Blade" nomenclature
              starterSword.name = "Novice Blade (Starter)";
              starterSword.isStarterItem = true;
              starterSword.isEquippedSlot = "weapon";
              window.equippedSlots.weapon = starterSword;
              savedInsuredItems.push(starterSword);
            }

      // Corpse Recovery: Store lost items and lost gold in Recovery Loot object for next attempt
      let challengeActive = window.playerStats.activeSpecialChallenge !== null;
      if (
        !isAbandon &&
        !challengeActive &&
        (lostItems.length > 0 || activeRunGold.gt(0))
      ) {
        let deathFloor = window.player.depth || 1;
        window.playerStats.recoveryLoot = {
          floor: deathFloor,
          items: lostItems,
          gold: activeRunGold,
        };

        let reportParts = [];
        if (lostItems.length > 0) reportParts.push(`${lostItems.length} items`);
        if (activeRunGold.gt(0))
          reportParts.push(`${window.formatNumber(activeRunGold)} Gold`);

        if (typeof window.pushLog === "function") {
          window.pushLog(
            `<strong style='color:#e74c3c;'>[LOOT RECOVERY]</strong> Left ${reportParts.join(" and ")} in a Recovery Chest on Floor ${deathFloor}. Retrieve it on your next attempt!`,
          );
        }
      } else if (!isAbandon) {
        window.playerStats.recoveryLoot = null;
      }

      if (subEl) {
        if (challengeActive) {
          subEl.innerText =
            "Special Contract Failed! Unlocked gear and gold permanently lost (No Recovery allowed on Contracts).";
        } else if (
          !isAbandon &&
          (lostItems.length > 0 || activeRunGold.gt(0))
        ) {
          let reportParts = [];
          if (lostItems.length > 0)
            reportParts.push(`${lostItems.length} items`);
          if (activeRunGold.gt(0))
            reportParts.push(`${window.formatNumber(activeRunGold)} Gold`);
          subEl.innerText = `Unlocked gear & gold lost (${reportParts.join(" & ")}) placed in a Recovery Chest on Floor ${window.player.depth || 1}!`;
        } else {
          subEl.innerText = `Unlocked gear & gold lost. Insured items (${savedInsuredItems.length}) & 100% Vault Gold saved!`;
        }
      }

      // Clear special challenge on defeat
      if (window.playerStats.activeSpecialChallenge) {
        if (typeof window.pushLog === "function") {
          window.pushLog(
            `<strong style='color:#e74c3c;'>[CONTRACT FAILED]</strong> Failed Special Contract: <span style='color:#ef4444;'>${window.playerStats.activeSpecialChallenge.name}</span>.`,
          );
        }
        window.playerStats.activeSpecialChallenge = null;
        window.playerStats.activeDungeonSigil = null;
      }

      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    }

    // Render summary breakdown
    if (success) {
      let lootHtml = extractedLoot
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#2ecc71";
          return `
                <div style="background:#111; border:1px solid #333; border-left:3px solid ${col}; padding:6px 10px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between;">
                  <span style="color:${col}; font-weight:bold;">${item.name}</span>
                  <span style="color:#2ecc71; font-family:monospace;">EXTRACTED ITEM</span>
                </div>
              `;
        })
        .join("");

      let scrapsHtml = pendingScrapsList
        .map(
          (s) => `
                <div style="background:#0a1a10; border:1px solid #1e4620; border-left:3px solid #f1c40f; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                  <span style="color:#f1c40f; font-weight:bold;">x${s.count} ${s.name}</span>
                  <span style="color:#2ecc71; font-family:monospace;">EXTRACTED SCRAP</span>
                </div>
              `,
        )
        .join("");

      listEl.innerHTML =
        lootHtml || scrapsHtml
          ? `<div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">${lootHtml}${scrapsHtml}</div>`
          : `<div style="color:#7f8c8d; font-style:italic; padding:10px; text-align:center;">No carried loot extracted.<br><span style="color:#f1c40f; font-weight:bold;">100% Collected Gold Secured in Wallet!</span></div>`;
    } else {
      let savedHtml = savedInsuredItems
        .map(
          (i) => `
                  <div style="background:#0a1a10; border:1px solid #1e4620; border-left:3px solid #2ecc71; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                    <span style="color:#2ecc71; font-weight:bold;">[ SOUL INSURED ] ${i.name}</span>
                    <span style="color:#81ecec; font-family:monospace;">SAVED</span>
                  </div>
                `,
        )
        .join("");

      let lostHtml = lostItems
        .map(
          (i) => `
            <div style="background:#1a0a0a; border:1px solid #4a1515; border-left:3px solid #e74c3c; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
              <span style="color:#e74c3c; text-decoration:line-through;">${i.name}</span>
              <span style="color:#ff7675; font-family:monospace;">LOST</span>
            </div>
          `,
        )
        .join("");

      listEl.innerHTML = `
                  <div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">
                    ${savedHtml}
                    ${lostHtml}
                    ${savedInsuredItems.length === 0 && lostItems.length === 0 ? '<div style="color:#aaa; font-size:10px;">No gear lost.</div>' : ""}
                  </div>
                  <div style="color:#e74c3c; font-weight:bold; font-size:11px; margin-top:8px; border-top:1px dashed #333; padding-top:6px;">
                    ${activeRunGold.gt(0) ? `Collected Run Gold (${window.formatNumber(activeRunGold)}) was lost in the depths!` : "No Run Gold was secured."}
                  </div>
                `;
    }

    if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";

    summaryModal.style.display = "flex";
  };

  export const startDeathSequence = function () {
    if (window.deathAnimationTimer > 0) return;
    window.deathAnimationTimer = 75; // 75-frame (~1.25s) collapse animation

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }
    if (window.combatVisuals) {
      window.combatVisuals.triggerScreenShake(12, 20);
    }
    let p = window.player;
    if (p && window.RenderEngine && window.RenderEngine.spawnDeathParticles) {
      window.RenderEngine.spawnDeathParticles(p.x, p.y, "player");
    }
  };

