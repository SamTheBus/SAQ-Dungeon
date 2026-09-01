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
} from "./encounter_state.js?v=1.007";
import { resetCombatHazardRuntimeState } from "./combat_hazards.js?v=1.035";
import {
  calculateEmergencySalvageGold,
  shouldResolveInterruptedDungeonRun,
} from "./run_recovery.js?v=1.002";
import {
  captureStandardRunEntryLoadout,
  isStandardVoluntaryRetreatMode,
  requestStandardVoluntaryRetreat,
} from "./standard_retreat.js?v=1.000";
import {
  buildStandardExtractionConfirmation,
  buildStandardExtractionSummary,
  getStandardExtractionPortalRule,
  getStandardExtractionPreview,
  isStandardSuccessfulExtractionMode,
} from "./standard_extraction.js?v=1.000";
import {
  finalizeOnslaughtModeExit,
  finalizeRiftModeExit,
  isSafeModeExitFinalized,
  resetSafeModeExitAuthority,
} from "./safe_mode_finalization.js?v=1.001";
import {
  renderChallengeExitSummary,
  renderSafeModeExitSummary,
  requestActiveModeVoluntaryRetreat,
} from "./mode_exit_communication.js?v=1.002";
import {
  commitRecoveryChestOverwrite,
  describeRecoveryAssets,
  getRecoveryRecordForFloor,
  hasRecoveryAssets,
} from "./recovery_contract.js?v=1.000";
import {
  buildStandardMobComposition,
  getDeploymentItemRiskPresentation,
  getInitialStandardRangedCooldown,
  hasUninsuredPermanentEquipment,
  normalizeProvisionedStarterItem,
  selectStandardMobSpawns,
} from "./opening_fairness.js?v=1.000";
import { getStandardPortalTraversalState } from "./portal_guardian_contract.js?v=1.000";
import { getMasteryNodeRank } from "./mastery_authority.js?v=1.003";
import { triggerVoidTouchedRareFrenzy } from "./set_affix_authority.js?v=1.000";
import { resetTomeRotation } from "./tome_rotation_authority.js?v=1.001";

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
            normalizeProvisionedStarterItem(starterSword, {
              noun: "Broadsword",
              name: "Novice Blade (Starter)",
              recalculate: window.recalculateItemStats,
            });
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
    resetSafeModeExitAuthority();
    window.playerStats.dungeonRunInProgress = true;
    let startFloorNum = Math.max(1, Number(startFloor) || 1);
    window.player.depth = startFloorNum;
    window.player.bag = [];
    window.playerStats.robbingMarcusActive = false;
    window.playerStats.abyssalDecayAccumulated = 0; // Clear accumulated siphoned HP

    if (typeof window.refillFlaskCharges === "function") {
      window.refillFlaskCharges(true);
    }

    let provisionRanks = {
      weapon: getMasteryNodeRank(window.playerStats, "utility_start_weapon"),
      armor: getMasteryNodeRank(window.playerStats, "utility_start_armor"),
      headFeet: getMasteryNodeRank(
        window.playerStats,
        "utility_start_head_feet",
      ),
      ring: getMasteryNodeRank(window.playerStats, "utility_start_ring"),
    };
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
      normalizeProvisionedStarterItem(starterItem, {
        name: `Starter ${activeStarter.charAt(0).toUpperCase() + activeStarter.slice(1)}`,
        recalculate: window.recalculateItemStats,
      });
      window.equippedSlots.subweapon = starterItem;
      starterItem.isEquippedSlot = "subweapon";
    }

    // 2. Main Hand Weapon Provisioning (utility_start_weapon: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
    if (window.equippedSlots && !window.equippedSlots.weapon) {
      let weapRank = provisionRanks.weapon || 0;
      if (weapRank > 0) {
        let stars = Math.min(2, weapRank - 1);
        let item = window.createItemObject(
          "weapon",
          stars,
          starterStageScale,
          0,
        );
        normalizeProvisionedStarterItem(item, {
          noun: "Broadsword",
          name: `Provisioned ${window.getTierName(stars)} Blade`,
          recalculate: window.recalculateItemStats,
        });
        window.equippedSlots.weapon = item;
        item.isEquippedSlot = "weapon";
      }
    }

    // 3. Chest/Overall Armor Provisioning (utility_start_armor: Rank 1 -> 0★, Rank 2 -> 1★, Rank 3 -> 2★)
    if (
      window.equippedSlots &&
      !window.equippedSlots.chest &&
      !window.equippedSlots.overall
    ) {
      let armorRank = provisionRanks.armor || 0;
      if (armorRank > 0) {
        let stars = Math.min(2, armorRank - 1);
        let item = window.createItemObject(
          "overall",
          stars,
          starterStageScale,
          0,
        );
        normalizeProvisionedStarterItem(item, {
          name: `Provisioned ${window.getTierName(stars)} Plate Suit`,
          recalculate: window.recalculateItemStats,
        });

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
    if (window.equippedSlots) {
      let hfRank = provisionRanks.headFeet || 0;
      if (hfRank > 0) {
        let stars = Math.min(2, hfRank - 1);
        if (!window.equippedSlots.helmet) {
          let helm = window.createItemObject(
            "helmet",
            stars,
            starterStageScale,
            0,
          );
          normalizeProvisionedStarterItem(helm, {
            name: `Provisioned ${window.getTierName(stars)} Helm`,
            recalculate: window.recalculateItemStats,
          });
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
          normalizeProvisionedStarterItem(boots, {
            name: `Provisioned ${window.getTierName(stars)} Boots`,
            recalculate: window.recalculateItemStats,
          });
          window.equippedSlots.boots = boots;
          boots.isEquippedSlot = "boots";
        }
      }
    }

    // 5. Ring Provisioning (utility_start_ring)
    if (window.equippedSlots) {
      let ringRank = provisionRanks.ring || 0;
      if (ringRank > 0) {
        let stars = Math.min(2, ringRank - 1);
        if (!window.equippedSlots.ring1) {
          let ring1 = window.createItemObject(
            "ring",
            stars,
            starterStageScale,
            0,
          );
          normalizeProvisionedStarterItem(ring1, {
            name: `Provisioned ${window.getTierName(stars)} Band`,
            recalculate: window.recalculateItemStats,
          });
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
          normalizeProvisionedStarterItem(ring2, {
            name: `Provisioned ${window.getTierName(stars)} Signet`,
            recalculate: window.recalculateItemStats,
          });
          window.equippedSlots.ring2 = ring2;
          ring2.isEquippedSlot = "ring2";
        }
      }
    }

    // Hook 2: Field Medic Run-Long Basic Elixir Effects
    {
      let medicRank = getMasteryNodeRank(window.playerStats, "utility_elixir");
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

    // Capture after all entry provisioning so the authoritative standard
    // retreat contract protects exactly what crossed the run boundary.
    captureStandardRunEntryLoadout();

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
              rec && rec.floor === startFloor && hasRecoveryAssets(rec)
                ? " [RECOVERY CHEST]"
                : "";

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
        if (hasRecoveryAssets(rec)) {
          recBannerHtml = `
                          <div style="width: 100%; background: rgba(231, 76, 60, 0.15); border: 1.5px dashed #e74c3c; border-radius: 6px; padding: 6px 10px; font-family: monospace; font-size: 9.5px; color: #ff7675; text-align: left; box-sizing: border-box;">
                            <strong style="color: #f1c40f; display: block; font-size: 10px; margin-bottom: 1px;">[RECOVERY ALERT] UNCLAIMED RECOVERY CHEST</strong>
                            <span>${describeRecoveryAssets(rec)} on Floor ${rec.floor}. Reach this floor again to return them to an active run.</span>
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
        let riskPresentation = getDeploymentItemRiskPresentation(item);
        let cardStatusClass = riskPresentation.statusClass;
        let btnStatusClass = isLocked ? "active" : "";
        let detailText = riskPresentation.detail
          ? riskPresentation.detail
          : `LV.${item.stageLevel || 1} • Soul Bond: ${window.formatNumber(rawPremium)} Gold`;
        let insuranceAction = riskPresentation.canToggleInsurance
          ? `onclick="event.stopPropagation(); window.toggleDeploymentInsurance('${slotKey}')"`
          : `disabled aria-disabled="true"`;

        itemsHtml += `
                      <div class="deploy-gear-card ${cardStatusClass}" style="border-left: 3.5px solid ${col};">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; cursor: pointer;" onclick="event.stopPropagation(); window.showSlotTooltip(event, '${slotKey}');" onmouseenter="window.showSlotTooltip(event, '${slotKey}')" onmouseleave="window.hideTooltip()">
                          ${window.getEquipIconHtml(item, 28)}
                          <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                            <span style="color:${col}; font-weight: bold; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                            <span style="font-size: 8.5px; color: ${item.isStarterItem ? "#67e8f9" : "#94a3b8"}; font-family: monospace;">${detailText}</span>
                          </div>
                        </div>
                        <button class="tactical-insure-btn ${btnStatusClass}" ${insuranceAction}>
                          ${riskPresentation.label}
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
        let hasPermanentRisk = hasUninsuredPermanentEquipment(
          window.equippedSlots,
        );
        let hasStarterProvision = Object.values(window.equippedSlots).some(
          (item) => item?.isStarterItem,
        );
        btnDeploySecure.disabled = !canAfford || !canAffordSouls;
        btnDeploySecure.innerText =
          totals.insuredCount > 0
            ? `DESCEND INTO DUNGEON (BOUND ${totals.insuredCount}/3)`
            : hasPermanentRisk
              ? "DESCEND INTO DUNGEON (UNPROTECTED)"
              : hasStarterProvision
                ? "DESCEND INTO DUNGEON (STARTER PROVISIONED)"
                : "DESCEND INTO DUNGEON (NO GEAR AT RISK)";
      }
    }
  };

  export const toggleDeploymentInsurance = function (slotKey) {
    let item = window.equippedSlots[slotKey];
    if (!item) return;
    if (item.isStarterItem) {
      delete item.locked;
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[TEMPORARY] Starter gear cannot be Soul Bound; a basic weapon is reissued if needed.",
          "#67e8f9",
        );
      }
      window.renderDeploymentModal();
      return;
    }

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
        !window.equippedSlots[s].isStarterItem &&
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
    let hasPermanentRisk = hasUninsuredPermanentEquipment(
      window.equippedSlots,
    );

    if (
      !isCrucible &&
      totals.insuredCount === 0 &&
      hasPermanentRisk &&
      !bypassWarning
    ) {
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

    resetSafeModeExitAuthority();
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

    if (window.checkArtifactTrait?.("frenzy")) {
      window.playerStats.frenzyKillCount =
        (window.playerStats.frenzyKillCount || 0) + 1;
      if (window.playerStats.frenzyKillCount >= 15) {
        window.playerStats.frenzyKillCount = 0;
        const frenzyDuration = window.scaleArtifactMechanic
          ? window.scaleArtifactMechanic("frenzy", 300)
          : 300;
        const chronoExtension = window.scaleArtifactMechanic
          ? window.scaleArtifactMechanic("extend_buffs", 180)
          : 0;
        window.playerStats.frenzyTimer = Math.round(
          frenzyDuration + chronoExtension,
        );
      }
    }

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

    resetTomeRotation({
      tome: window.equippedSlots?.subweapon,
      reason: "floor-stage-entry",
    });

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
      if (typeof window.beginArtifactStageAttempt === "function") {
        window.beginArtifactStageAttempt(window.playerStats);
      } else {
        window.playerStats.usedSecondWind = false;
      }
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
    let fairyChance =
      getMasteryNodeRank(window.playerStats, "utility_fairy_sanctuary") * 0.05;
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

      let standardMobSpawns = selectStandardMobSpawns({
        depth,
        spawns: map.mobSpawns,
        isChallenge,
        isRift,
        isCrucible: window.playerStats.isCrucibleMode,
      });
      let mobComposition = buildStandardMobComposition({
        depth,
        spawns: standardMobSpawns,
        isChallenge,
        isRift,
        isCrucible: window.playerStats.isCrucibleMode,
        rollMobInfo: () => window.getMobPoolForDepth(depth),
      });

      standardMobSpawns.forEach((sp, spawnIndex) => {
        let mobInfo = mobComposition[spawnIndex];
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
          name:
            window.MONSTER_CARDS_DATA?.[mobInfo.type]?.name ||
            mobInfo.type.replaceAll("_", " "),
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
          rangedCooldown: getInitialStandardRangedCooldown({
            depth,
            isChallenge,
            isRift,
            isCrucible: window.playerStats.isCrucibleMode,
            randomInt: window.randInt,
          }),
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
        triggerVoidTouchedRareFrenzy({
          isRare,
          resolvedStats: pStats,
          playerStats: window.playerStats,
          chronoExtensionFrames:
            typeof window.scaleArtifactMechanic === "function"
              ? window.scaleArtifactMechanic("extend_buffs", 180)
              : 0,
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
      triggerVoidTouchedRareFrenzy({
        isRare,
        resolvedStats: pStats,
        playerStats: window.playerStats,
        chronoExtensionFrames:
          typeof window.scaleArtifactMechanic === "function"
            ? window.scaleArtifactMechanic("extend_buffs", 180)
            : 0,
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

    if (isStandardVoluntaryRetreatMode()) {
      requestStandardVoluntaryRetreat();
      return;
    }

    requestActiveModeVoluntaryRetreat(function () {
      window.triggerExtraction(false, true);
    });
  };

  export const openPortalChoiceModal = function () {
    let modal = document.getElementById("portal-modal");
    let titleEl = document.getElementById("portal-modal-title");
    let subEl = document.getElementById("portal-modal-subtitle");
    let descendBtn = document.getElementById("portal-btn-descend");
    let extractBtn = document.getElementById("portal-btn-extract");

    if (!modal) return;

    let depth = window.player.depth || 1;
    let nextFloor = depth + 1;

    let isMiniBossNext = nextFloor % 12 === 4 || nextFloor % 12 === 8;
    let isMajorBossNext = nextFloor % 12 === 0;

    let isMiniBossCurrent = depth % 12 === 4 || depth % 12 === 8;
    let isMajorBossCurrent = depth % 12 === 0;

    let isChallenge = window.playerStats.activeSpecialChallenge !== null;
    let isRift = window.playerStats.isRiftMode === true;
    let isStandardExtraction = isStandardSuccessfulExtractionMode();

    if (extractBtn) extractBtn.innerText = "EXTRACT & SECURE LOOT";

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

      if (isStandardExtraction) {
        if (subEl) {
          subEl.innerText = `${subEl.innerText} ${getStandardExtractionPortalRule()}`;
        }
        if (extractBtn) extractBtn.innerText = "EXTRACT CARRIED LOOT";
      }
    }

    modal.style.display = "flex";
  };

  export const checkRecoveryChestUnclaimed = function () {
    return Boolean(getRecoveryRecordForFloor(window.player?.depth));
  };

  export const executePortalDescend = function (bypassWarning = false) {
    const portalState = getStandardPortalTraversalState(
      window.activeDungeonMap,
      window.playerStats,
    );
    if (portalState.traversalLocked) {
      let p = window.player;
      if (window.logicClock % 60 === 0) {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          portalState.reason === "marcus"
            ? "PORTAL SEALED: DEFEAT MARCUS!"
            : "PORTAL SEALED: DEFEAT THE SENTINEL!",
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
      let rec = getRecoveryRecordForFloor(window.player?.depth);
      let recoverySummary = describeRecoveryAssets(rec);

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unclaimed Recovery Chest",
          `WARNING: Your Recovery Chest still contains ${recoverySummary} on this floor. Descending without claiming it will permanently clear this recovery record. Proceed anyway?`,
          "DESCEND WITHOUT LOOT",
          "RETURN TO FIND IT",
          "#e74c3c",
          function () {
            if (commitRecoveryChestOverwrite(window.player?.depth)) {
              window.executePortalDescend(true);
            }
          },
        );
      } else {
        if (
          confirm(
            `WARNING: Your Recovery Chest still contains ${recoverySummary}. Descending will permanently clear this recovery record. Proceed anyway?`,
          )
        ) {
          if (commitRecoveryChestOverwrite(window.player?.depth)) {
            window.executePortalDescend(true);
          }
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

  export const executePortalExtract = function (
    bypassWarning = false,
    standardExtractionConfirmed = false,
  ) {
    const portalState = getStandardPortalTraversalState(
      window.activeDungeonMap,
      window.playerStats,
    );
    if (portalState.traversalLocked) {
      let p = window.player;
      if (window.logicClock % 60 === 0) {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          portalState.reason === "marcus"
            ? "PORTAL SEALED: DEFEAT MARCUS!"
            : "PORTAL SEALED: DEFEAT THE SENTINEL!",
          "#ef4444",
        );
        if (window.combatVisuals) {
          window.combatVisuals.triggerScreenShake(3, 6);
        }
        if (window.SoundManager) window.SoundManager.play("block");
      }
      return;
    }

    if (
      isStandardSuccessfulExtractionMode() &&
      !standardExtractionConfirmed
    ) {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";
      let preview = getStandardExtractionPreview();
      let confirmation = buildStandardExtractionConfirmation(preview, {
        formatNumber: window.formatNumber,
      });

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Confirm Standard Extraction",
          confirmation,
          "SECURE CARRIED LOOT",
          "KEEP EXPLORING",
          "#2ecc71",
          function () {
            window.executePortalExtract(bypassWarning, true);
          },
        );
      } else if (
        confirm(
          confirmation
            .replaceAll("<br>", "\n")
            .replace(/<[^>]*>/g, ""),
        )
      ) {
        window.executePortalExtract(bypassWarning, true);
      }
      return;
    }

    if (window.checkRecoveryChestUnclaimed() && !bypassWarning) {
      let modal = document.getElementById("portal-modal");
      if (modal) modal.style.display = "none";
      let rec = getRecoveryRecordForFloor(window.player?.depth);
      let recoverySummary = describeRecoveryAssets(rec);

      if (typeof window.showCustomConfirm === "function") {
        window.showCustomConfirm(
          "Unclaimed Recovery Chest",
          `WARNING: Your Recovery Chest still contains ${recoverySummary} on this floor. Extracting without claiming it will permanently clear this recovery record. Proceed anyway?`,
          "EXTRACT WITHOUT LOOT",
          "RETURN TO FIND IT",
          "#e74c3c",
          function () {
            if (commitRecoveryChestOverwrite(window.player?.depth)) {
              window.executePortalExtract(true, standardExtractionConfirmed);
            }
          },
        );
      } else {
        if (
          confirm(
            `WARNING: Your Recovery Chest still contains ${recoverySummary}. Extracting will permanently clear this recovery record. Proceed anyway?`,
          )
        ) {
          if (commitRecoveryChestOverwrite(window.player?.depth)) {
            window.executePortalExtract(true, standardExtractionConfirmed);
          }
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
    if (isSafeModeExitFinalized()) return false;

    let challengeAtExit = window.playerStats.activeSpecialChallenge || null;
    let riftOutcome = window.playerStats.isRiftMode
      ? finalizeRiftModeExit(success, isAbandon)
      : null;
    let onslaughtOutcome =
      !riftOutcome && window.playerStats.isCrucibleMode
        ? finalizeOnslaughtModeExit(success, isAbandon)
        : null;

    if (!riftOutcome && !onslaughtOutcome) {
      window.playerStats.dungeonRunInProgress = false;
      window.playerStats.standardRunEntryLoadoutIds = [];
      window.decrementPotionRunCharges();
      window.playerStats.activeDungeonSigil = null; // Clear and consume active Sigil on run end
    }

    let activeRunGold = BigNum.from(window.playerStats.runGold || 0);

    // --- RIFT MODE EXTRACTION INTERCEPT ---
    if (riftOutcome) {
      renderSafeModeExitSummary(riftOutcome);
      return riftOutcome;
    }

    // --- ONSLAUGHT / CRUCIBLE MODE EXTRACTION INTERCEPT ---
    if (onslaughtOutcome) {
      renderSafeModeExitSummary(onslaughtOutcome);
      return onslaughtOutcome;
    }

    let isStandardSuccessfulExtraction =
      success && isStandardSuccessfulExtractionMode(window.playerStats);
    let standardExtractionOutcome = isStandardSuccessfulExtraction
      ? getStandardExtractionPreview()
      : null;
    let directlySecuredGroundMaterials = (window.groundMaterials || [])
      .filter(
        (drop) =>
          drop?.name &&
          (drop.name === "Luminous Soul" || drop.name.includes("Key")),
      )
      .map((drop) => ({
        name: drop.name,
        quantity: Math.max(0, Math.floor(Number(drop.qty) || 0)),
      }))
      .filter((entry) => entry.quantity > 0);

    if (isStandardSuccessfulExtraction) {
      // A standard successful extraction secures only loot already collected
      // into the run satchel. Uncollected ground items are deliberately
      // forfeited; materials keep their established counter routing below.
      window.groundLoot = [];
    } else {
      // Preserve the established collection contract for non-standard-success
      // consumers (standard loss and Special Challenge finalization).
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
    let provisionedItems = [];
    let lostItems = [];
    let retainedGold = BigNum.from(0);
    let retainedScraps = [];

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

      if (typeof window.progressMission === "function") {
        if (window.player && window.player.bag) {
          window.progressMission("bag", window.player.bag.length);
        }
        if (window.playerStats.activeSpecialChallenge) {
          window.progressMission("contracts", 1);
        }
      }

      // Subphase 16: Claim Contract rewards and clear active challenge states
      let challenge = challengeAtExit;
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
        } else if (standardExtractionOutcome) {
          subEl.innerText = buildStandardExtractionSummary(
            standardExtractionOutcome,
            { formatNumber: window.formatNumber },
          );
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
      let salvageRatio =
        getMasteryNodeRank(window.playerStats, "utility_emergency_salvage") *
        0.05;

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
                retainedScraps.push({ name: sName, quantity: retQty });
              }
            }
          }
        }

        if (retainedGold.gt(0) || retainedScraps.length > 0) {
          let retainedScrapText = retainedScraps
            .map((entry) => `${entry.quantity}x ${entry.name}`)
            .join(", ");
          let toastMsg = `✦ Emergency Evac (${Math.round(salvageRatio * 100)}%): Saved ${retainedGold.gt(0) ? window.formatNumber(retainedGold) + " Gold" : ""}${retainedGold.gt(0) && retainedScraps.length > 0 ? " & " : ""}${retainedScrapText} to Vault!`;
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
              normalizeProvisionedStarterItem(starterSword, {
                noun: "Broadsword",
                name: "Novice Blade (Starter)",
                recalculate: window.recalculateItemStats,
              });
              starterSword.isEquippedSlot = "weapon";
              window.equippedSlots.weapon = starterSword;
              provisionedItems.push(starterSword);
            }

      // Corpse Recovery: Store lost items and lost gold in Recovery Loot object for next attempt
      let challengeActive = challengeAtExit !== null;
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
      if (challengeAtExit) {
        if (typeof window.pushLog === "function") {
          window.pushLog(
            `<strong style='color:#e74c3c;'>[CONTRACT FAILED]</strong> Failed Special Contract: <span style='color:#ef4444;'>${challengeAtExit.name}</span>.`,
          );
        }
        window.playerStats.activeSpecialChallenge = null;
        window.playerStats.activeDungeonSigil = null;
      }

      if (window.inventory) window.inventory.EQUIP = window.player.stash;
      if (typeof window.saveGame === "function") window.saveGame();
    }

    if (challengeAtExit) {
      let retainedMaterialCounts = new Map(
        retainedScraps.map((entry) => [entry.name, entry.quantity]),
      );
      let securedMaterials = success
        ? pendingScrapsList.map((entry) => ({
            name: entry.name,
            quantity: entry.count,
          }))
        : retainedScraps.map((entry) => ({ ...entry }));
      securedMaterials.push(...directlySecuredGroundMaterials);

      let lostMaterials = success
        ? []
        : pendingScrapsList
            .map((entry) => ({
              name: entry.name,
              quantity:
                entry.count - (retainedMaterialCounts.get(entry.name) || 0),
            }))
            .filter((entry) => entry.quantity > 0);

      let challengeOutcome = {
        mode: "challenge",
        result: isAbandon ? "retreat" : success ? "success" : "defeat",
        success,
        isAbandon,
        challengeName: challengeAtExit.name,
        rewards: {
          gold: challengeAtExit.rewards.gold,
          xp: challengeAtExit.rewards.xp,
          shards: challengeAtExit.rewards.shards,
          cores: challengeAtExit.rewards.cores,
        },
        assets: {
          extractedItems: success ? extractedLoot : [],
          savedSoulBoundItems: success ? [] : savedInsuredItems,
          provisionedItems: success ? [] : provisionedItems,
          lostItems: success ? [] : lostItems,
          securedGold: success ? activeRunGold : retainedGold,
          lostGold: success ? BigNum.from(0) : activeRunGold,
          securedMaterials,
          lostMaterials,
          recoveryChestCreated: false,
        },
      };

      renderChallengeExitSummary(challengeOutcome);
      return challengeOutcome;
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

      let forfeitedItemsHtml = (
        standardExtractionOutcome?.assets?.forfeitedGroundItems || []
      )
        .map(
          (item) => `
                <div style="background:#1a0a0a; border:1px solid #4a1515; border-left:3px solid #e74c3c; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                  <span style="color:#e74c3c; text-decoration:line-through;">${item.name}</span>
                  <span style="color:#ff7675; font-family:monospace;">FORFEITED ON GROUND</span>
                </div>
              `,
        )
        .join("");

      let standardCommitmentHtml = standardExtractionOutcome
        ? `<div style="color:#bdc3c7; font-size:10px; margin-top:6px; border-top:1px dashed #333; padding-top:6px;">${standardExtractionOutcome.assets.forfeitedGroundItems.length} uncollected ground item(s) forfeited. Ground materials were secured through material counters. No Recovery Chest created.</div>`
        : "";

      listEl.innerHTML =
        lootHtml || scrapsHtml || forfeitedItemsHtml || standardCommitmentHtml
          ? `<div style="display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;">${lootHtml}${scrapsHtml}${forfeitedItemsHtml}${standardCommitmentHtml}</div>`
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

      let provisionedHtml = provisionedItems
        .map(
          (i) => `
                  <div style="background:#07181a; border:1px solid #164e63; border-left:3px solid #22d3ee; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between;">
                    <span style="color:#81ecec; font-weight:bold;">[ PROVISIONED ] ${i.name}</span>
                    <span style="color:#67e8f9; font-family:monospace;">REISSUED</span>
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
                    ${provisionedHtml}
                    ${lostHtml}
                    ${savedInsuredItems.length === 0 && provisionedItems.length === 0 && lostItems.length === 0 ? '<div style="color:#aaa; font-size:10px;">No gear lost.</div>' : ""}
                  </div>
                  <div style="color:#e74c3c; font-weight:bold; font-size:11px; margin-top:8px; border-top:1px dashed #333; padding-top:6px;">
                    ${activeRunGold.gt(0) ? `Collected Run Gold (${window.formatNumber(activeRunGold)}) was lost in the depths!` : "No Run Gold was secured."}
                  </div>
                `;
    }

    if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";

    summaryModal.style.display = "flex";
    return standardExtractionOutcome || undefined;
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

