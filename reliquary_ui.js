  import {
    getReliquarySubTab,
    getSelectedAspectTrait,
    setReliquarySubTab,
    setSelectedAspectTrait,
  } from "./ui_state.js?v=1.004";

  export function switchReliquarySubTab(tabKey) {
    setReliquarySubTab(tabKey);
    window.renderReliquaryTab();
  }

  export function equipRelicItem(itemId, slotIdx) {
    let item = window.inventory.ARTIFACT.find((i) => i.id === itemId);
    if (!item) return;

    let slotKey = ["art1", "art2", "art3"][slotIdx];

    // Clear Codex Aspect in this slot
    let stats = window.playerStats;
    stats.activeRelics = stats.activeRelics || [null, null, null];
    stats.activeRelics[slotIdx] = null;

    // Equip physical artifact
    if (window.equippedSlots[slotKey]) {
      window.unequipItem(slotKey);
    }

    // Manual equip to bypass standard bag logic
    window.inventory.ARTIFACT.splice(
      window.inventory.ARTIFACT.indexOf(item),
      1,
    );
    window.equippedSlots[slotKey] = item;
    item.isEquippedSlot = slotKey;

    if (window.SoundManager) window.SoundManager.play("swing");
    window.invalidatePlayerStats();
    window.updateUI();
    window.renderReliquaryTab();
    window.saveGame();
  }

  export function renderReliquaryTab() {
    let container = document.getElementById("reliquary-content-panel");
    if (!container) return;

    let stats = window.playerStats;
    let activeRelics = stats.activeRelics || [null, null, null];
    let codex = stats.artifactCodex || {};
    let dust = stats.astralDust || 0;
    let subTab = getReliquarySubTab() || "codex";

    let activeStatsTexts = [];

    // 1. Calculate Active Multipliers
    const slotNames = ["art1", "art2", "art3"];
    for (let i = 0; i < 3; i++) {
      let slotKey = slotNames[i];
      let trait = activeRelics[i];
      let item = window.equippedSlots[slotKey];
      let slotLvl = (stats.slotUpgrades && stats.slotUpgrades[slotKey]) || 0;
      let slotMult = 1.0 + slotLvl * 0.01;

      if (item) {
        // Physical Item Power
        if (item.atk)
          activeStatsTexts.push(`ATK +${window.formatNumber(item.atk)}`);
        if (item.def)
          activeStatsTexts.push(`DEF +${window.formatNumber(item.def)}`);
        if (item.maxHp)
          activeStatsTexts.push(`HP +${window.formatNumber(item.maxHp)}`);
      } else if (trait) {
        // Codex Aspect Power
        let power = codex[trait] || 0.0;
        let baseStats = window.ARTIFACT_BASE_STATS[trait];
        if (baseStats && power > 0) {
          for (let sKey in baseStats) {
            let val = baseStats[sKey];
            let scaledVal = val * power * slotMult;
            let isPct = [
              "dropRate",
              "quality",
              "critChance",
              "critDamage",
              "block",
              "parry",
              "goldMulti",
              "idleAttackSpeed",
              "activeAttackSpeed",
              "maxHpPct",
            ].includes(sKey);
            let valStr = isPct
              ? `+${(scaledVal * 100).toFixed(1)}%`
              : `+${Math.ceil(scaledVal)}`;
            let label = window.getStatLabel
              ? window.getStatLabel(sKey)
              : sKey.toUpperCase();
            activeStatsTexts.push(`${label} ${valStr}`);
          }
        }
      }
    }
    let activeStatsSummaryStr =
      activeStatsTexts.length > 0
        ? activeStatsTexts.join(" • ")
        : "No active relic multipliers.";

    // 2. Render Left Pane (Active Slots)
    let activeSlotsHtml = "";
    const slotLabels = [
      "SACRED ALTAR SLOT 1",
      "SACRED ALTAR SLOT 2",
      "SACRED ALTAR SLOT 3",
    ];

    for (let i = 0; i < 3; i++) {
      let slotKey = slotNames[i];
      let trait = activeRelics[i];
      let item = window.equippedSlots[slotKey];
      let slotLvl = (stats.slotUpgrades && stats.slotUpgrades[slotKey]) || 0;

      if (item) {
        // Physical Item Slotted
        let col = window.getTierColor(item.statsRolled);
        let iconHtml = window.getItemIconSvg(item, 32);
        activeSlotsHtml += `
            <div class="paperdoll-slot" style="border-left: 3px solid ${col}; background: rgba(255,215,0,0.08); margin-bottom: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between; border-radius: 6px; height: 50px;">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;" onclick="event.stopPropagation(); window.showItemTooltip(event, window.equippedSlots['${slotKey}'])">
                ${iconHtml}
                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0;">
                  <span style="font-size: 8px; color: #ffd700; font-weight: bold; font-family: monospace;">${slotLabels[i]} (ITEM)</span>
                  <span style="color: #ffffff; font-weight: bold; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
                  <span style="color: #94a3b8; font-size: 8.5px; font-family: monospace;">Lv. ${item.stageLevel} • <strong style="color:#df9ffb;">Atn +${slotLvl}%</strong></span>
                </div>
              </div>
              <button class="action-btn-sm" style="background: rgba(231,76,60,0.2); border-color:#e74c3c; color:#ff7675; padding: 4px 8px; font-size: 8.5px;" onclick="event.stopPropagation(); window.unequipItem('${slotKey}')">UNSLOT</button>
            </div>
        `;
      } else if (trait) {
        // Codex Aspect Slotted
        let poolMatch = window.ARTIFACT_POOL.find((a) => a.trait === trait);
        let powerPct = Math.round((codex[trait] || 0) * 100);
        let iconHtml = window.getArtifactIconHtml(trait, 32);
        activeSlotsHtml += `
            <div class="paperdoll-slot" style="border-left: 3px solid #1abc9c; background: rgba(26,188,156,0.08); margin-bottom: 8px; padding: 10px; display: flex; align-items: center; justify-content: space-between; border-radius: 6px; height: 50px;">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;" onclick="event.stopPropagation(); window.showRelicDetails('${trait}')">
                ${iconHtml}
                <div style="display: flex; flex-direction: column; text-align: left; min-width: 0;">
                  <span style="font-size: 8px; color: #1abc9c; font-weight: bold; font-family: monospace;">${slotLabels[i]} (CODEX)</span>
                  <span style="color: #ffffff; font-weight: bold; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${poolMatch ? poolMatch.name : trait}</span>
                  <span style="color: #94a3b8; font-size: 8.5px; font-family: monospace;">Power: ${powerPct}% • <strong style="color:#df9ffb;">Atn +${slotLvl}%</strong></span>
                </div>
              </div>
              <button class="action-btn-sm" style="background: rgba(231,76,60,0.2); border-color:#e74c3c; color:#ff7675; padding: 4px 8px; font-size: 8.5px;" onclick="event.stopPropagation(); window.unassignRelic(${i})">UNSLOT</button>
            </div>
        `;
      } else {
        activeSlotsHtml += `
            <div class="paperdoll-slot empty" style="border: 1px dashed #334155; background: rgba(0,0,0,0.22); margin-bottom: 8px; padding: 12px 10px; display: flex; align-items: center; justify-content: space-between; border-radius: 6px; height: 50px;">
              <div style="display: flex; flex-direction: column; text-align: left;">
                <span style="font-size: 8px; color: #64748b; font-weight: bold; font-family: monospace;">${slotLabels[i]}</span>
                <span style="color: #64748b; font-size: 10px; font-weight: bold; font-style: italic;">[ VACANT ALTAR ]</span>
              </div>
            </div>
        `;
      }
    }

    // 3. Render Sub-Tab Bar
    let tabBarHtml = `
      <div class="shop-tab-bar" style="margin-bottom: 8px; height: 32px;">
        <button class="shop-tab-btn ${subTab === "codex" ? "active" : ""}" onclick="window.switchReliquarySubTab('codex')" style="font-size: 9.5px;">CODEX ASPECTS</button>
        <button class="shop-tab-btn ${subTab === "physical" ? "active" : ""}" onclick="window.switchReliquarySubTab('physical')" style="font-size: 9.5px;">PHYSICAL VAULT</button>
      </div>
    `;

    // 4. Render Right Pane (Library or Physical Vault)
    let rightContentHtml = "";
    if (subTab === "codex") {
      let libraryHtml = "";
      let totalUnlocked = 0;
      let selectedTrait = getSelectedAspectTrait();
      let pool = window.ARTIFACT_POOL || [];
      pool.forEach((art) => {
        let power = codex[art.trait] || 0.0;
        let isUnlocked = power > 0;
        if (isUnlocked) totalUnlocked++;
        let isSelected = art.trait === selectedTrait;
        let col = isUnlocked ? (isSelected ? "#ffd700" : "#1abc9c") : "#334155";
        let isSlotted = activeRelics.includes(art.trait);
        let assignBtns = "";
        if (isUnlocked) {
          if (isSlotted)
            assignBtns = `<span style="color:#2ecc71; font-size:7.5px; font-weight:bold; margin-top:4px;">[SLOTTED]</span>`;
          else
            assignBtns = `<div style="display:flex; gap:2px; margin-top:4px; width:100%;"><button class="action-btn-sm" style="font-size:7px; padding:2px; flex:1;" onclick="event.stopPropagation(); window.assignRelic('${art.trait}',0)">S1</button><button class="action-btn-sm" style="font-size:7px; padding:2px; flex:1;" onclick="event.stopPropagation(); window.assignRelic('${art.trait}',1)">S2</button><button class="action-btn-sm" style="font-size:7px; padding:2px; flex:1;" onclick="event.stopPropagation(); window.assignRelic('${art.trait}',2)">S3</button></div>`;
        }
        libraryHtml += `<div class="bestiary-card-item" style="border-color:${col}; opacity:${isUnlocked ? 1 : 0.4}; min-height:120px; padding:6px; background:${isSelected ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.3)"}; cursor:pointer;" onclick="window.showRelicDetails('${art.trait}')">
          <div style="font-size:7px; font-weight:bold; color:${col};">${isUnlocked ? "ASPECT" : "LOCKED"}</div>
          ${window.getArtifactIconHtml(art.trait, 28)}
          <div style="font-size:9.5px; font-weight:bold; color:#fff; margin-top:4px;">${art.name}</div>
          <div style="font-size:8px; color:#aaa; font-family:monospace;">Roll: ${Math.round(power * 100)}%</div>
          ${assignBtns}
        </div>`;
      });

      let inspectorHtml = "";
      if (selectedTrait) {
        let art = pool.find((a) => a.trait === selectedTrait);
        if (art) {
          inspectorHtml = `<div class="relic-inspector-drawer" style="padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5); border:1px solid #1abc9c; border-radius:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:#1abc9c; font-size:12px;">${art.name}</strong>
              <button class="close-btn" onclick="window.showRelicDetails(null)">CLOSE</button>
            </div>
            <p style="font-size:10px; color:#cbd5e1; margin:6px 0;">${art.breakdown || art.desc}</p>
          </div>`;
        }
      }

      rightContentHtml = `
        <strong style="color:#1abc9c; font-size:9.5px; font-family:monospace; text-transform:uppercase; margin-bottom:4px; display:block;">CODEX ASPECT LIBRARY</strong>
        ${inspectorHtml}
        <div class="bestiary-album-scrollable" style="flex:1; overflow-y:auto; touch-action:pan-y;">
          <div class="bestiary-grid" style="grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));">
            ${libraryHtml}
          </div>
        </div>
      `;
    } else {
      let physicalHtml = "";
      let artifacts = window.inventory.ARTIFACT || [];
      if (artifacts.length === 0) {
        physicalHtml = `<div style="color:#64748b; font-style:italic; text-align:center; padding:40px 10px; font-size:11px; border:1px dashed #334155; border-radius:8px;">No unequipped physical artifacts found.<br>Extract loot from dungeon runs to fill your vault!</div>`;
      } else {
        artifacts.forEach((item) => {
          let col = window.getTierColor(item.statsRolled);
          let powerPct = Math.round((item.relicPower || 1.0) * 100);
          physicalHtml += `<div class="stash-card" style="border-left:3px solid ${col}; background:rgba(0,0,0,0.4); padding:8px; margin-bottom:4px; cursor:pointer;" onclick="window.showItemTooltip(event, window.inventory.ARTIFACT.find(i=>i.id==${item.id}))">
            ${window.getItemIconSvg(item, 28)}
            <div class="item-info">
              <span class="item-title" style="color:${col}; font-size:11px;">${item.name}</span>
              <span class="item-sub" style="font-size:8.5px;">Roll Power: <strong style="color:#ffd700;">${powerPct}%</strong></span>
            </div>
            <div style="display:flex; gap:3px;">
              <button class="action-btn-sm" style="font-size:7px; padding:3px 5px;" onclick="event.stopPropagation(); window.equipRelicItem(${item.id},0)">S1</button>
              <button class="action-btn-sm" style="font-size:7px; padding:3px 5px;" onclick="event.stopPropagation(); window.equipRelicItem(${item.id},1)">S2</button>
              <button class="action-btn-sm" style="font-size:7px; padding:3px 5px;" onclick="event.stopPropagation(); window.equipRelicItem(${item.id},2)">S3</button>
              <button class="action-btn-sm action-btn-salvage" style="font-size:7px; padding:3px 5px;" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderReliquaryTab();">SLV</button>
            </div>
          </div>`;
        });
      }
      rightContentHtml = `
        <strong style="color:#ffd700; font-size:9.5px; font-family:monospace; text-transform:uppercase; margin-bottom:4px; display:block;">PHYSICAL ARTIFACT VAULT</strong>
        <div style="flex:1; overflow-y:auto; padding-right:2px; touch-action:pan-y;">
          ${physicalHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="bestiary-wrapper" style="display:flex; flex-direction:column; gap:10px; width:100%; height:100%; box-sizing:border-box;">
        <div class="bestiary-summary-banner" style="background: linear-gradient(180deg, #091a18 0%, #050a09 100%); border: 1.5px solid #1abc9c; border-radius:8px; padding:10px 14px; flex-shrink:0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; font-weight:900; color:#1abc9c; letter-spacing:1px;">SACRED RELIQUARY CODEX</span>
            <span style="font-family:monospace; font-size:10px; font-weight:bold; color:#df9ffb;">Astral Dust: ${dust.toLocaleString()}</span>
          </div>
          <div style="font-size:8.5px; font-family:monospace; color:#34d399; line-height:1.35; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px; margin-top:6px; text-align:left;">
            <strong>ACTIVE ENHANCEMENTS:</strong> ${activeStatsSummaryStr}
          </div>
        </div>

        <div class="reliquary-split-container" style="display:flex; gap:10px; flex:1; overflow:hidden;">
          <div class="reliquary-left-pane" style="width:38%; display:flex; flex-direction:column; gap:6px;">
            <strong style="color:#df9ffb; font-size:9.5px; font-family:monospace; text-transform:uppercase; border-bottom:1px solid #1e293b; padding-bottom:4px;">ACTIVE ALTAR</strong>
            <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
              ${activeSlotsHtml}
            </div>
          </div>
          <div class="reliquary-right-pane" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
            ${tabBarHtml}
            ${rightContentHtml}
          </div>
        </div>
      </div>
    `;
  }

  export function showRelicDetails(trait) {
    if (getSelectedAspectTrait() === trait) {
      setSelectedAspectTrait(null);
    } else {
      setSelectedAspectTrait(trait);
    }
    window.renderReliquaryTab();
  }

  export function assignRelic(trait, slotIndex) {
    let stats = window.playerStats;
    stats.activeRelics = stats.activeRelics || [null, null, null];

    // Unequip physical artifact in this slot
    let slotKey = ["art1", "art2", "art3"][slotIndex];
    if (window.equippedSlots[slotKey]) {
      window.unequipItem(slotKey);
    }

    // Ensure this trait isn't already assigned in another slot
    let existingIdx = stats.activeRelics.indexOf(trait);
    if (existingIdx !== -1) {
      stats.activeRelics[existingIdx] = null;
    }

    // Assign to the target slot
    stats.activeRelics[slotIndex] = trait;

    if (window.SoundManager) window.SoundManager.play("swing");
    window.invalidatePlayerStats();
    window.updateUI();
    window.renderReliquaryTab();
    window.saveGame();
  }

  export function unassignRelic(slotIndex) {
    let stats = window.playerStats;
    stats.activeRelics = stats.activeRelics || [];
    stats.activeRelics[slotIndex] = null;

    if (window.SoundManager) window.SoundManager.play("death");
    window.invalidatePlayerStats();
    window.updateUI();
    window.renderReliquaryTab();
    window.saveGame();
  }

  // Protected accessor enforcing the in-tab Aspect Inspector Drawer

