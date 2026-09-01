  import {
    getActiveBagTab,
    getActiveProfileMobileTab,
  } from "./ui_state.js?v=1.004";
import { getActiveDungeonMap } from "./dungeon_map.js?v=1.010";

  // --- LOOT SATCHEL & VAULT TOGGLE ---
  export function renderBagModalContent() {
    let listEl = document.getElementById("bag-items-list");
    let modal = document.getElementById("bag-modal");
    let headerEl = modal ? modal.querySelector(".modal-header span") : null;
    if (!listEl) return;

    let tab = getActiveBagTab() || "EQUIP";
    let displayList = window.player.bag || [];
    let maxBag =
      typeof window.getMaxBagSlots === "function"
        ? window.getMaxBagSlots()
        : 20;

    if (headerEl) {
      let countColor = displayList.length > maxBag ? "#ef4444" : "var(--text-gold-amber)";
      headerEl.innerHTML = `CARRIED EXPEDITION SATCHEL <span style="font-size:10px; color:${countColor}; font-family:monospace; margin-left:6px;">(${displayList.length} / ${maxBag} Items)</span>`;
    }

    if (tab === "EQUIP") {
      let filteredList = displayList.filter((item) => item.type !== "sigil");
      if (filteredList.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">Satchel has no carried gear.<br>Defeat monsters and open chests in the dungeon to gather equipment!</div>`;
        return;
      }

      let map = getActiveDungeonMap();
      let isNearMerchant = false;
      if (map && map.merchantTile && window.player) {
        let mcx = map.merchantTile.x * map.tileSize + map.tileSize / 2;
        let mcy = map.merchantTile.y * map.tileSize + map.tileSize / 2;
        let dist = Math.hypot(window.player.x - mcx, window.player.y - mcy);
        if (dist <= 110) {
          isNearMerchant = true;
        }
      }

      listEl.innerHTML = filteredList
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#00d2ff";
          let typeLabel = (item.subType || item.type || "ITEM").toUpperCase();
          let starsLabel =
            item.statsRolled === "UNIQUE"
              ? "UNIQUE"
              : `${item.statsRolled || 0} STAR`;
          let iconHtml = window.getItemIconSvg
            ? window.getItemIconSvg(item, 32)
            : "";
          let isInsured = !!item.locked;

        let setName = window.getItemSetName ? window.getItemSetName(item) : (item.setName || null);
        let setBadge = "";
        if (setName && setCounts[setName]) {
           let setDef = window.SET_DEFINITIONS ? window.SET_DEFINITIONS[setName] : null;
           let maxSet = (setDef && setDef.bonuses) ? setDef.bonuses[setDef.bonuses.length-1].count : 3;
           setBadge = `<span class="set-badge">${setName} [${setCounts[setName]}/${maxSet}]</span>`;
        }

          let statPreview = [];
          if (item.atk)
            statPreview.push(
              `ATK +${window.formatNumber ? window.formatNumber(item.atk) : item.atk}`,
            );
          if (item.def)
            statPreview.push(
              `DEF +${window.formatNumber ? window.formatNumber(item.def) : item.def}`,
            );
          if (item.maxHp)
            statPreview.push(
              `HP +${window.formatNumber ? window.formatNumber(item.maxHp) : item.maxHp}`,
            );
          let statStr =
            statPreview.length > 0 ? statPreview.join(" | ") : `${starsLabel}`;

          let sellBtn = "";
          if (isNearMerchant) {
            let sellValue = window.calculateDungeonSellValue(item);
            sellBtn = `<button class="action-btn-sm" style="background: linear-gradient(180deg, #d97706, #b45309); border-color: #fbbf24; color: #fff;" onclick="event.stopPropagation(); window.sellItemToDungeonMerchant(${item.id});">SELL (${window.formatNumber(sellValue)})</button>`;
          }

          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderBagModalContent();">SALVAGE</button>`;
          let boundTag = isInsured
            ? `<span style="font-size:8px; color:#34d399; font-family:monospace; font-weight:bold;">[BOUND]</span>`
            : "";

          let actualIdx = window.player.bag.findIndex((i) => i.id === item.id);

          return `
                            <div class="stash-card" style="border-left: 3.5px solid ${col}; cursor: pointer; padding: 6px 10px; background: rgba(15, 23, 42, 0.85); border-radius: 6px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;" onclick="window.showItemTooltip(event, window.player.bag[${actualIdx}])">
                              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                                ${iconHtml}
                                <div class="item-info" style="display: flex; flex-direction: column; min-width: 0;">
                                  <span class="item-title" style="color:${col}; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                                  <span class="item-sub" style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">${typeLabel} • LV.${item.stageLevel || 1}</span>
                                  <span class="item-sub" style="font-size: 8.5px; color: #2ecc71; font-family: monospace; font-weight: bold;">${statStr}</span>
                                </div>
                              </div>
                              <div class="item-actions" style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                                ${boundTag}
                                <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
                                ${sellBtn}
                                ${salvageBtn}
                              </div>
                            </div>
                          `;
        })
        .join("");
    } else if (tab === "SIGIL") {
      let filteredList = displayList.filter((item) => item.type === "sigil");
      if (filteredList.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">Satchel has no carried sigils.<br>Slay floor bosses or open Cavern Sigil Sacks to acquire run sigils!</div>`;
        return;
      }

      let map = getActiveDungeonMap();
      let isNearMerchant = false;
      if (map && map.merchantTile && window.player) {
        let mcx = map.merchantTile.x * map.tileSize + map.tileSize / 2;
        let mcy = map.merchantTile.y * map.tileSize + map.tileSize / 2;
        let dist = Math.hypot(window.player.x - mcx, window.player.y - mcy);
        if (dist <= 110) {
          isNearMerchant = true;
        }
      }

      listEl.innerHTML = filteredList
        .map((item) => {
          let col = window.getTierColor
            ? window.getTierColor(item.statsRolled)
            : "#00d2ff";
          let iconHtml = window.getItemIconSvg
            ? window.getItemIconSvg(item, 32)
            : "";

          let sellBtn = "";
          if (isNearMerchant) {
            let sellValue = window.calculateDungeonSellValue(item);
            sellBtn = `<button class="action-btn-sm" style="background: linear-gradient(180deg, #d97706, #b45309); border-color: #fbbf24; color: #fff;" onclick="event.stopPropagation(); window.sellItemToDungeonMerchant(${item.id});">SELL (${window.formatNumber(sellValue)})</button>`;
          }

          let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderBagModalContent();">SALVAGE</button>`;
          let actualIdx = window.player.bag.findIndex((i) => i.id === item.id);

          return `
                <div class="stash-card" style="border-left: 3.5px solid ${col}; cursor: pointer; padding: 6px 10px; background: rgba(15, 23, 42, 0.85); border-radius: 6px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between;" onclick="window.showItemTooltip(event, window.player.bag[${actualIdx}])">
                  <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    ${iconHtml}
                    <div class="item-info" style="display: flex; flex-direction: column; min-width: 0;">
                      <span class="item-title" style="color:${col}; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</span>
                      <span class="item-sub" style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">SIGIL • LV.${item.stageLevel || 1}</span>
                      <span class="item-sub" style="font-size: 8.5px; color: #a855f7; font-family: monospace; font-weight: bold;">Focus: +${((item.rewardMultiplier || 0) * 100).toFixed(0)}% Rewards</span>
                    </div>
                  </div>
                  <div class="item-actions" style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                    ${sellBtn}
                    ${salvageBtn}
                  </div>
                </div>
              `;
        })
        .join("");
    } else if (tab === "USE") {
      let useObj = window.inventory.USE || {};
      let keys = Object.keys(useObj).filter((k) => useObj[k] > 0);

      if (keys.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">No consumable elixirs, scrolls, or sacks owned.<br>Craft elixirs at the Alchemy Shop or earn sacks from Daily Quests!</div>`;
        return;
      }

      listEl.innerHTML = keys
        .map((k) => {
          let count = useObj[k];
          let data = window.useDex[k] || {
            desc: "Consumable Item",
            color: "#2ecc71",
          };
          let col = data.color || "#2ecc71";
          let iconHtml = window.getUseIconHtml
            ? window.getUseIconHtml(k, 28)
            : "";

          return `
                        <div class="consumable-card" style="border-left: 3px solid ${col}; display: flex; align-items: center; gap: 8px; cursor: pointer;"
                             onmouseenter="window.showConsumableTooltip(event, '${k}')"
                             onmouseleave="window.hideTooltip()"
                             onclick="window.showConsumableTooltip(event, '${k}')">
                          ${iconHtml}
                          <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                              <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                              <span style="color:#ffffff; font-family:monospace; font-weight:bold; font-size:11px; margin-left:4px;">x${count}</span>
                            </div>
                            <div style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.3;">${data.desc}</div>
                          </div>
                          <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.useConsumableItem('${k}');">USE</button>
                        </div>
                      `;
        })
        .join("");
    } else if (tab === "ETC") {
      let etcObj = window.inventory.ETC || {};
      let pendingScraps = window.player.pendingScraps || {};

      let allKeys = Array.from(
        new Set([...Object.keys(etcObj), ...Object.keys(pendingScraps)]),
      );
      allKeys = allKeys.filter(
        (k) => (etcObj[k] || 0) > 0 || (pendingScraps[k] || 0) > 0,
      );

      if (allKeys.length === 0) {
        listEl.innerHTML = `<div style="font-size:10.5px; color:#64748b; font-style:italic; padding:24px; text-align:center; background:rgba(0,0,0,0.3); border:1px dashed #1e293b; border-radius:6px;">No materials or Monster Souls in satchel.<br>Slay monsters in dungeon runs to harvest souls and scraps!</div>`;
        return;
      }

      const matColors = {
        "Monster Soul": "#a0aec0",
        "Luminous Soul": "#ffb6c1",
        "Rare Scrap": "#3498db",
        "Magic Scrap": "#9b59b6",
        "Epic Scrap": "#e67e22",
        "Legendary Scrap": "#f1c40f",
        "Mythic Scrap": "#e74c3c",
        "Eridium Shard": "#8e44ad",
        "Gacha Key": "#f1c40f",
        "Glimmering Gachapon Key": "#00d2ff",
        "Ancient Core": "#e74c3c",
        "Overlord's Sigil": "#1abc9c",
        "Astral Essence": "#9b59b6",
        "Catalyst Core": "#2ecc71",
      };

      listEl.innerHTML = allKeys
        .map((k) => {
          let vaultCount = etcObj[k] || 0;
          let pendingCount = pendingScraps[k] || 0;
          let col = matColors[k] || "#00d2ff";
          let desc = window.etcDex[k] || "Crafting Material";
          let iconHtml = window.getEtcIconHtml
            ? window.getEtcIconHtml(k, 28)
            : "";

          let countLabel =
            pendingCount > 0
              ? `<span style="color:#2ecc71; font-weight:bold;">+${pendingCount} Run</span> <span style="color:#aaa;">(${vaultCount} Vault)</span>`
              : `<span style="color:#ffffff; font-weight:bold;">${vaultCount}</span>`;

          return `
                    <div class="material-card" style="border-left: 3.5px solid ${col}; display: flex; align-items: center; gap: 8px;">
                      ${iconHtml}
                      <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                          <span style="color:${col}; font-weight:bold; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                          <span style="font-family:monospace; font-size:10px;">${countLabel}</span>
                        </div>
                        <div style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.3;">${desc}</div>
                      </div>
                    </div>
                  `;
        })
        .join("");
    }
  }

  export function toggleLootBag() {
    window.hideTooltip();
    let modal = document.getElementById("profile-modal");
    if (!modal) return;

    let isCurrentlyOpen =
      modal.style.display === "flex" || modal.style.display === "block";
    let isCurrentlyOnSatchel = getActiveProfileMobileTab() === "satchel";

    if (isCurrentlyOpen && isCurrentlyOnSatchel) {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      if (
        window.SkillTreeManager &&
        typeof window.SkillTreeManager.stopAnimationLoop === "function"
      ) {
        window.SkillTreeManager.stopAnimationLoop();
      }
      if (typeof window.stopBestiaryAnimLoop === "function") {
        window.stopBestiaryAnimLoop();
      }
    } else {
      modal.style.display = "flex";
      window.switchProfileTab("satchel");
      window.renderProfileModal();
    }
  }

  export function openSigilPickerModal() {
    let modal = document.getElementById("sigil-picker-modal");
    if (!modal) return;
    modal.style.display = "flex";
    window.renderSigilPickerList();
  }

  export function closeSigilPickerModal() {
    let modal = document.getElementById("sigil-picker-modal");
    if (modal) {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
    }
  }

  export function selectDeploymentSigil(sigilId) {
    window.state.selectedDeploymentSigilId = sigilId ? Number(sigilId) : null;
    window.closeSigilPickerModal();
    window.renderDeploymentModal();
  }

  export function renderSigilPickerList() {
    let container = document.getElementById("sigil-picker-list");
    if (!container) return;

    let sigils = window.inventory.SIGIL || [];
    let currentSigilId = window.state.selectedDeploymentSigilId;

    let html = `
            <div class="sigil-vault-card none-slotted ${!currentSigilId ? "selected" : ""}" onclick="window.selectDeploymentSigil(null)">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#cbd5e1; font-weight:bold; font-size:11px;">[ NO CAVERN SIGIL SLOTTED ]</span>
                ${!currentSigilId ? '<span style="color:#34d399; font-size:9px; font-weight:bold; font-family:monospace;">[ACTIVE]</span>' : '<button class="action-btn-sm" style="background:#0284c7; border-color:#38bdf8;">SELECT</button>'}
              </div>
              <span style="font-size:8.5px; color:#94a3b8; font-family:monospace; margin-top:3px; display:block;">Deploy without environmental modifiers or reward multipliers.</span>
            </div>
          `;

    if (sigils.length === 0) {
      html += `<div style="font-size:10.5px; color:#64748b; font-style:italic; text-align:center; padding:30px; background:rgba(0,0,0,0.3); border:1px dashed #3b0764; border-radius:8px;">No Cavern Sigils found in inventory.<br>Slay floor bosses or open Cavern Sigil Sacks to acquire run sigils!</div>`;
    } else {
      sigils.forEach((sig) => {
        let isSelected = sig.id === currentSigilId;
        let col = window.getTierColor(sig.statsRolled);

        let buffDescs = (sig.buffs || [])
          .map(
            (b) =>
              `<span style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#34d399; font-size:8.5px; font-family:monospace; padding:2px 6px; border-radius:4px;">+ ${b.name}: ${b.desc}</span>`,
          )
          .join(" ");

        let debuffDescs = (sig.debuffs || [])
          .map(
            (d) =>
              `<span style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#f87171; font-size:8.5px; font-family:monospace; padding:2px 6px; border-radius:4px;">- ${d.name}: ${d.desc}</span>`,
          )
          .join(" ");

        html += `
                <div class="sigil-vault-card ${isSelected ? "selected" : ""}" style="border-left: 4px solid ${col};" onclick="window.selectDeploymentSigil(${sig.id})">
                  <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      ${window.getEquipIconHtml(sig, 28)}
                      <div style="display:flex; flex-direction:column; text-align:left;">
                        <span style="color:${col}; font-weight:800; font-size:12px;">${sig.name}</span>
                        <span style="font-size:8.5px; color:#94a3b8; font-family:monospace;">${sig.statsRolled}★ ${window.getTierName(sig.statsRolled)}</span>
                      </div>
                    </div>
                    ${isSelected ? '<span style="color:#34d399; font-size:9.5px; font-weight:bold; font-family:monospace;">[SLOTTED]</span>' : '<button class="action-btn-sm action-btn-equip" style="padding:4px 8px; font-size:8.5px;">SLOT SIGIL</button>'}
                  </div>

                  <div style="display:flex; flex-direction:column; gap:4px; text-align:left;">
                    <div style="display:flex; flex-wrap:wrap; gap:4px;">
                      ${buffDescs}
                      ${debuffDescs}
                    </div>
                    <div style="display:flex; gap:12px; margin-top:4px; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.08); font-family:monospace; font-size:9px;">
                      <span style="color:#38bdf8; font-weight:bold;">Focus Multiplier: +${((sig.rewardMultiplier || 0) * 100).toFixed(0)}%</span>
                      ${sig.qualityBoost > 0 ? `<span style="color:#e879f9; font-weight:bold;">Quality Boost: +${((sig.qualityBoost || 0) * 100).toFixed(0)}%</span>` : ""}
                    </div>
                  </div>
                </div>
              `;
      });
    }

    container.innerHTML = html;
  }

  export function closeDeploymentModal() {
    let modal = document.getElementById("deployment-modal");
    if (modal) {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
    }
  }

