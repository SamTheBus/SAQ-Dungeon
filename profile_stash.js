  import {
    getActiveProfileMobileTab,
    getActiveStashTab,
  } from "./ui_state.js?v=1.004";
  import { formatActiveAttackCadence } from "./attack_speed_contract.js?v=1.001";
  import { getMasteryNodeRank } from "./mastery_authority.js?v=1.003";
  import { resetTomeRotation } from "./tome_rotation_authority.js?v=1.001";

  export function renderProfileModal() {
    let statsListEl = document.getElementById("profile-stats-list");
    let paperdollEl = document.getElementById("paperdoll-grid");
    let stashListEl = document.getElementById("profile-stash-list");
    let stashCountEl = document.getElementById("profile-stash-count");
    let spCountEl = document.getElementById("profile-sp-count");
    let matrixGridEl = document.getElementById("attribute-matrix-grid");
    let headerTitleEl = document.getElementById("profile-header-title");

    if (!statsListEl || !paperdollEl || !stashListEl) return;

    // Slot Sanity Check: Ensure equipped items match valid slot types
    if (window.equippedSlots) {
      const validSlotTypes = {
        weapon: ["weapon"],
        subweapon: ["subweapon", "shield", "dagger", "tome"],
        helmet: ["helmet"],
        chest: ["chest"],
        leggings: ["leggings"],
        overall: ["overall"],
        boots: ["boots"],
        ring1: ["ring"],
        ring2: ["ring"],
        art1: ["artifact"],
        art2: ["artifact"],
        art3: ["artifact"],
      };

      for (let slotKey in window.equippedSlots) {
        let item = window.equippedSlots[slotKey];
        if (item) {
          let allowed = validSlotTypes[slotKey] || [slotKey];
          if (!allowed.includes(item.type)) {
            window.equippedSlots[slotKey] = null;
            if (!window.player.stash) window.player.stash = [];
            window.player.stash.push(item);
          }
        }
      }
    }

    let isHub = window.currentGameState === window.GAME_STATES.HUB;
    let stats = window.playerStats || {};
    let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    if (headerTitleEl) {
      headerTitleEl.innerText = isHub
        ? "HERO CREST & VAULT"
        : `EXPEDITION OVERVIEW (FLOOR ${window.player.depth || 1})`;
    }

    // Initialize SP Draft State
    if (typeof window.initSPDraft === "function") window.initSPDraft();
    let curSP = window.draftSP !== undefined ? window.draftSP : stats.sp || 0;
    let draftAlloc = window.draftSPAllocations || {
      spStr: 0,
      spDex: 0,
      spInt: 0,
    };
    let committedAlloc = stats.spAllocations || {
      spStr: 0,
      spDex: 0,
      spInt: 0,
    };

    let hasStaged =
      (draftAlloc.spStr || 0) > 0 ||
      (draftAlloc.spDex || 0) > 0 ||
      (draftAlloc.spInt || 0) > 0;
    if (spCountEl) spCountEl.innerText = `${curSP} SP`;

    // Explicitly invalidate cache to force a fresh baseline evaluation
    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }

    let curStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats(false)
        : {};
    let draftStats =
      hasStaged && typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats(true)
        : curStats;

    if (matrixGridEl) {
      let canSpend1 = curSP >= 1;
      let canSpend5 = curSP >= 5;

      let renderAttrCard = (
        name,
        desc,
        attrKey,
        committedCount,
        stagedCount,
        iconType,
      ) => {
        let totalCount = committedCount + stagedCount;
        let stagedBadge =
          stagedCount > 0
            ? `<span class="attr-staged-val">(+${stagedCount})</span>`
            : "";
        let sub1Disabled = stagedCount < 1 ? "disabled" : "";
        let isStaged = stagedCount > 0;
        let iconSvg =
          typeof window.getUiIconSvg === "function"
            ? window.getUiIconSvg(iconType, 13)
            : "";

        return `
                  <div class="attr-card ${isStaged ? "staged-active" : ""}">
                    <div class="attr-card-header">
                      <div class="attr-title-group">
                        ${iconSvg}
                        <span class="attr-name">${name}</span>
                      </div>
                      <div class="attr-count-badge">
                        <span class="attr-total-val">${totalCount}</span>
                        ${stagedBadge}
                      </div>
                    </div>
                    <div class="attr-desc">${desc}</div>
                    <div class="attr-btn-bar">
                      <button class="sp-btn sp-btn-sub" ${sub1Disabled} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', -1)" onclick="event.stopPropagation();">-1</button>
                      <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', 1)" onclick="event.stopPropagation();">+1</button>
                      <button class="sp-btn sp-btn-add" ${canSpend5 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', 5)" onclick="event.stopPropagation();">+5</button>
                      <button class="sp-btn sp-btn-add" ${canSpend1 ? "" : "disabled"} onpointerdown="event.stopPropagation(); window.stageSP('${attrKey}', ${curSP})" onclick="event.stopPropagation();">MAX</button>
                    </div>
                  </div>
                `;
      };

      let confirmBarHtml = hasStaged
        ? `
                    <div style="display:flex; gap:6px; margin-top:6px;">
                      <button class="action-btn" style="flex:1; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #10b981 0%, #047857 100%); border-color:#34d399;" onpointerdown="event.stopPropagation(); window.confirmSP()" onclick="event.stopPropagation();">CONFIRM ATTRIBUTES</button>
                      <button class="action-btn" style="flex:0.4; margin-top:0; padding:8px; font-size:10px; background:linear-gradient(180deg, #ef4444 0%, #b91c1c 100%); border-color:#f87171;" onpointerdown="event.stopPropagation(); window.resetDraftSP()" onclick="event.stopPropagation();">RESET</button>
                    </div>
                  `
        : "";

      matrixGridEl.innerHTML = `
                        ${renderAttrCard("STRENGTH", "+10 Max HP, +2.5 Attack Power, & +0.1% Raw Block Rate", "Str", committedAlloc.spStr || 0, draftAlloc.spStr || 0, "str")}
                        ${renderAttrCard("DEXTERITY", "+0.1% Crit, +0.5% Crit Multi, +1 Move Speed, & +0.1% Raw Parry Rate", "Dex", committedAlloc.spDex || 0, draftAlloc.spDex || 0, "dex")}
                        ${renderAttrCard("INTELLIGENCE", "+1 Defense, +0.5% Potion Power, Arcane Barrier, & Alchemical Preservation", "Int", committedAlloc.spInt || 0, draftAlloc.spInt || 0, "int")}
                        ${confirmBarHtml}
                      `;
    }

    // 1. Render Character Stats (With live draft preview diffs)
    let iconSvg = (key) =>
      typeof window.getUiIconSvg === "function"
        ? window.getUiIconSvg(key, 12)
        : "";

    let formatStatValWithDiff = (
      key,
      curVal,
      draftVal,
      isPct = false,
      pctDecimals = 1,
    ) => {
      let usesBigNum =
        !isPct &&
        ((curVal && typeof curVal === "object" && curVal.m !== undefined) ||
          (draftVal &&
            typeof draftVal === "object" &&
            draftVal.m !== undefined));
      if (usesBigNum) {
        let curBig = BigNum.from(curVal || 0).round();
        let curStr = window.formatNumber(curBig);
        if (!hasStaged) return curStr;

        let draftBig = BigNum.from(draftVal || 0).round();
        let diffBig = draftBig.sub(curBig);
        if (diffBig.eq(0)) return curStr;

        let isIncrease = diffBig.gt(0);
        let draftStr = window.formatNumber(draftBig);
        let diffStr = `${isIncrease ? "+" : ""}${window.formatNumber(diffBig)}`;
        let color = isIncrease ? "#2ecc71" : "#e74c3c";
        return `<span style="color:#aaa;">${curStr}</span> ➔ <strong style="color:#fff;">${draftStr}</strong> <span style="color:${color}; font-size:8.5px;">(${diffStr})</span>`;
      }

      let curNum =
        curVal && curVal.valueOf ? curVal.valueOf() : Number(curVal || 0);
      let draftNum =
        draftVal && draftVal.valueOf
          ? draftVal.valueOf()
          : Number(draftVal || 0);

      let curStr = isPct
        ? (curNum * 100).toFixed(pctDecimals) + "%"
        : window.formatNumber(Math.round(curNum));
      if (!hasStaged) return curStr;

      let diff = draftNum - curNum;
      if (Math.abs(diff) < 0.0001) return curStr;

      let draftStr = isPct
        ? (draftNum * 100).toFixed(pctDecimals) + "%"
        : window.formatNumber(Math.round(draftNum));
      let diffStr = isPct
        ? (diff > 0 ? "+" : "") + (diff * 100).toFixed(pctDecimals) + "%"
        : (diff > 0 ? "+" : "") + window.formatNumber(Math.round(diff));
      let color = diff > 0 ? "#2ecc71" : "#e74c3c";

      return `<span style="color:#aaa;">${curStr}</span> ➔ <strong style="color:#fff;">${draftStr}</strong> <span style="color:${color}; font-size:8.5px;">(${diffStr})</span>`;
    };

    statsListEl.innerHTML = `
                                  <div class="stat-line"><span class="stat-label">${iconSvg("atk")} ATTACK</span><span class="stat-val">${formatStatValWithDiff("atk", curStats.atk, draftStats.atk)}</span></div>
                                                                    <div class="stat-line"><span class="stat-label">${iconSvg("def")} DEFENSE</span><span class="stat-val">${formatStatValWithDiff("def", curStats.def, draftStats.def)}</span></div>
                                                                    <div class="stat-line"><span class="stat-label">${iconSvg("maxHp")} MAX HP</span><span class="stat-val">${formatStatValWithDiff("maxHp", curStats.maxHp, draftStats.maxHp)}</span></div>
                                                                    <div class="stat-line">
                                                                      <span class="stat-label">${iconSvg("moveSpeed")} MOVE SPEED</span>
                                                                      <span class="stat-val">
                                                                        ${formatStatValWithDiff("moveSpeed", curStats.moveSpeed, draftStats.moveSpeed, false)}
                                                                        ${(function () {
                                                                          let rawSpd =
                                                                            curStats.rawSpeedBonus ||
                                                                            0;
                                                                          if (
                                                                            rawSpd >
                                                                            1.5
                                                                          ) {
                                                                            let excessPct =
                                                                              Math.round(
                                                                                (rawSpd -
                                                                                  1.5) *
                                                                                  100,
                                                                              );
                                                                            let relicMult =
                                                                              window.getArtifactMechanicScale
                                                                                ? window.getArtifactMechanicScale(
                                                                                    "speed_to_momentum",
                                                                                  )
                                                                                : 1;
                                                                            let conversionText =
                                                                              window.checkArtifactTrait(
                                                                                "speed_to_momentum",
                                                                              )
                                                                                ? `Converts to +${(excessPct * 2.5 * relicMult).toFixed(1)}% Crit Damage via Kinetic Momentum Converter.`
                                                                                : "Equip and attune the Kinetic Momentum Converter to convert this overflow into damage!";
                                                                            return ` <span style="color:#ffd700; font-size:8.5px;" title="Physical speed capped at 2.5x base. ${excessPct}% excess speed. ${conversionText}">[Capped +${excessPct}% Overflow]</span>`;
                                                                          }
                                                                          return "";
                                                                        })()}
                                                                      </span>
                                                                    </div>
                                                                    <div class="stat-line">
                                                                      <span class="stat-label">${iconSvg("critChance")} CRIT CHANCE</span>
                                                                      <span class="stat-val">
                                                                        ${formatStatValWithDiff("critChance", curStats.critChance, draftStats.critChance, true, 1)}
                                                                        ${(function () {
                                                                          let rawCrit =
                                                                            curStats.rawCritChance ||
                                                                            0;
                                                                          if (
                                                                            rawCrit >
                                                                            1.0
                                                                          ) {
                                                                            let excessPct =
                                                                              Math.round(
                                                                                (rawCrit -
                                                                                  1.0) *
                                                                                  100,
                                                                              );
                                                                            return ` <span style="color:#ffd700; font-size:8.5px;" title="Crit chance capped at 100%. ${excessPct}% excess converted to +${excessPct * 2}% Crit Damage.">[Capped +${excessPct}% Overflow]</span>`;
                                                                          }
                                                                          return "";
                                                                        })()}
                                                                      </span>
                                                                    </div>
                                                                    <div class="stat-line"><span class="stat-label">${iconSvg("critDamage")} CRIT MULTI</span><span class="stat-val">${formatStatValWithDiff("critDamage", curStats.critDamage, draftStats.critDamage, true, 1)}</span></div>
                                  <div class="stat-line" title="Active attacks use a 60-frame simulation clock. +% Active Attack Speed is haste: it lowers the 15-frame base recovery to a 4-frame minimum."><span class="stat-label">${iconSvg("activeAttackSpeed")} ACTIVE ATTACK CADENCE</span><span class="stat-val">${formatActiveAttackCadence(curStats.activeAttackSpeed)}</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("block")} BLOCK RATE</span><span class="stat-val">${formatStatValWithDiff("block", curStats.block, draftStats.block, true, 1)} (Cap: ${formatStatValWithDiff("maxBlockCap", curStats.maxBlockCap, draftStats.maxBlockCap, true, 1)})</span></div>
                                                                    <div class="stat-line"><span class="stat-label">${iconSvg("parry")} PARRY RATE</span><span class="stat-val">${formatStatValWithDiff("parry", curStats.parry, draftStats.parry, true, 1)} (Cap: ${formatStatValWithDiff("maxParryCap", curStats.maxParryCap, draftStats.maxParryCap, true, 1)})</span></div>
                                  <div class="stat-line"><span class="stat-label">${iconSvg("barrier")} BARRIER</span><span class="stat-val">${formatStatValWithDiff("arcaneBarrier", curStats.arcaneBarrier, draftStats.arcaneBarrier, true, 1)}</span></div>
                                                                    <div class="stat-line" title="Drop Rate multiplies eligible random monster equipment, Monster Soul/material, Cavern Sigil, and Monster Card chances. Each chance caps at 100%. Guaranteed, chest, cache, milestone, and direct rewards are unchanged."><span class="stat-label">${iconSvg("dropRate")} DROP RATE</span><span class="stat-val">${formatStatValWithDiff("drop", curStats.drop, draftStats.drop, true, 0)}</span></div>
                                                                    <div class="stat-line" title="Drop Quality improves the odds of higher equipment rarities that are currently unlocked. It does not unlock rarity tiers. It also affects eligible Cavern Sigil, artifact-trait, gacha, shop, and reward quality checks; named minimum-rarity, pity, and guaranteed rewards remain separate rules."><span class="stat-label">${iconSvg("quality")} DROP QUALITY</span><span class="stat-val">${formatStatValWithDiff("qly", curStats.qly, draftStats.qly, true, 0)}</span></div>
                                                                    <div class="stat-line"><span class="stat-label">${iconSvg("goldMulti")} GOLD MULTI</span><span class="stat-val">${formatStatValWithDiff("gold", curStats.gold, draftStats.gold, true, 0)}</span></div>
                                                                  `;

    // 2. Render Paperdoll Equipment Slots
    let slotKeys = [
      { key: "weapon", label: "WEAPON" },
      { key: "subweapon", label: "OFFHAND" },
      { key: "helmet", label: "HELMET" },
      { key: "chest", label: "CHEST" },
      { key: "leggings", label: "LEGS" },
      { key: "overall", label: "OVERALL" },
      { key: "boots", label: "BOOTS" },
      { key: "ring1", label: "RING 1" },
      { key: "ring2", label: "RING 2" },
    ];

    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    // Calculate Set Counts for UI badges
    let setCounts = {};
    const eligibleSetSlots = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
    eligibleSetSlots.forEach(slot => {
      let item = window.equippedSlots[slot];
      if (item) {
        let setName = window.getItemSetName ? window.getItemSetName(item) : (item.setName || null);
        if (setName) setCounts[setName] = (setCounts[setName] || 0) + (slot === "overall" ? 2 : 1);
      }
    });

    paperdollEl.innerHTML = slotKeys
      .map((s) => {
        let item = window.equippedSlots[s.key];
        let lvl =
          (window.playerStats.slotUpgrades &&
            window.playerStats.slotUpgrades[s.key]) ||
          0;
        let attunementHtml =
          lvl > 0
            ? `<span style="background: rgba(168, 85, 247, 0.2); color: #df9ffb; border: 1px solid rgba(168, 85, 247, 0.4); padding: 1.5px 4px; border-radius: 3px; font-size: 8px; font-weight:bold; font-family:monospace; margin-left: auto; margin-right: 6px; flex-shrink: 0; line-height: 1;">ATN +${lvl}%</span>`
            : "";

        if (!item) {
          return `
                                        <div class="paperdoll-slot" style="display: flex; align-items: center; justify-content: space-between;">
                                          <div style="display: flex; flex-direction: column; text-align: left;">
                                            <span class="slot-label" style="width: auto;">${s.label}</span>
                                            <span style="font-size:8.5px; color:#475569; font-style:italic;">[EMPTY SLOT]</span>
                                          </div>
                                          ${attunementHtml}
                                        </div>
                                      `;
        }

        let col = window.getTierColor
          ? window.getTierColor(item.statsRolled)
          : "#00d2ff";
        let starsLabel =
          item.statsRolled === "UNIQUE"
            ? "UNIQUE"
            : `${item.statsRolled || 0} STAR`;
        let iconHtml = window.getItemIconSvg(item, 28);
        let isInsured = !!item.locked;

        let setName = window.getItemSetName ? window.getItemSetName(item) : (item.setName || null);
        let setBadge = "";
        if (setName && setCounts[setName]) {
           let setDef = window.SET_DEFINITIONS ? window.SET_DEFINITIONS[setName] : null;
           let maxSet = (setDef && setDef.bonuses) ? setDef.bonuses[setDef.bonuses.length-1].count : 3;
           setBadge = `<span class="set-badge">${setName} [${setCounts[setName]}/${maxSet}]</span>`;
        }

        let insureBtn = `<button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>`;

        let actionHtml = isHub
          ? `
                        ${insureBtn}
                        <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                      `
          : `
                        <button class="action-btn-sm" onclick="event.stopPropagation(); window.unequipToStash('${s.key}')">UNEQUIP</button>
                      `;

        return `
                                      <div class="paperdoll-slot" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, window.equippedSlots['${s.key}'])">
                                        ${iconHtml}
                                        <div class="item-info">
                                          <span class="item-title" style="color:${col};">${item.name} ${setBadge}</span>
                                          <span class="item-sub">LV.${item.stageLevel || 1} • ${starsLabel} ${lvl > 0 ? `<strong style="color: #df9ffb;">(ATN +${lvl}%)</strong>` : ""}</span>
                                        </div>
                                        <div class="item-actions">
                                          ${actionHtml}
                                        </div>
                                      </div>
                                    `;
      })
      .join("");

    // 3. Render Right Panel (Vault & Satchel with Categories)
    let stashTab = getActiveStashTab() || "EQUIP";
    let sectionHeaderEl = document.getElementById("profile-satchel-title");

    if (stashTab === "EQUIP") {
      let rawList = isHub
        ? window.inventory.EQUIP || []
        : window.player.bag || [];
      let displayList = rawList.filter((item) => item.type !== "sigil");

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `${isHub ? "EQUIPMENT VAULT" : "CARRIED GEAR"} (<span id="profile-stash-count">${displayList.length}</span>)`;
      }

      if (displayList.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">${isHub ? "Storage vault is empty.<br>Extract loot from dungeon runs to store items here!" : "No items collected yet on this run.<br>Defeat monsters and open chests to find loot!"}</div>`;
      } else {
        stashListEl.innerHTML = displayList
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
              ? window.getItemIconSvg(item, 28)
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
              statPreview.length > 0
                ? statPreview.join(" | ")
                : `${starsLabel}`;

            let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderProfileModal();">SALVAGE</button>`;

            let actionsHtml = isHub
              ? `
                                        <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>
                                        <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromStash(${item.id})">EQUIP</button>
                                        ${salvageBtn}
                                      `
              : `
                                        <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.equipFromBag(${item.id})">EQUIP</button>
                                        ${salvageBtn}
                                      `;

            let actualIdx = isHub
              ? window.inventory.EQUIP.findIndex((i) => i.id === item.id)
              : window.player.bag.findIndex((i) => i.id === item.id);

            return `
                                          <div class="stash-card" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, ${isHub ? "window.inventory.EQUIP" : "window.player.bag"}[${actualIdx}])">
                                            ${iconHtml}
                            <div class="item-info">
                              <span class="item-title" style="color:${col};">${item.name} ${setBadge}</span>
                              <span class="item-sub">${typeLabel} • LV.${item.stageLevel || 1}</span>
                              <span class="item-sub" style="color:#2ecc71;">${statStr}</span>
                            </div>
                            <div class="item-actions">
                              ${actionsHtml}
                            </div>
                          </div>
                        `;
          })
          .join("");
      }
    } else if (stashTab === "SIGIL") {
      let displayList = isHub
        ? window.inventory.SIGIL || []
        : (window.player.bag || []).filter((item) => item.type === "sigil");

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `${isHub ? "SIGIL VAULT" : "CARRIED SIGILS"} (<span id="profile-stash-count">${displayList.length}</span>)`;
      }

      if (displayList.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">${isHub ? "Sigil vault is empty.<br>Extract sigils from dungeon runs to store them here!" : "No sigils collected yet on this run."}</div>`;
      } else {
        stashListEl.innerHTML = displayList
          .map((item, idx) => {
            let col = window.getTierColor
              ? window.getTierColor(item.statsRolled)
              : "#00d2ff";
            let iconHtml = window.getItemIconSvg
              ? window.getItemIconSvg(item, 28)
              : "";
            let isInsured = !!item.locked;

        let setName = window.getItemSetName ? window.getItemSetName(item) : (item.setName || null);
        let setBadge = "";
        if (setName && setCounts[setName]) {
           let setDef = window.SET_DEFINITIONS ? window.SET_DEFINITIONS[setName] : null;
           let maxSet = (setDef && setDef.bonuses) ? setDef.bonuses[setDef.bonuses.length-1].count : 3;
           setBadge = `<span class="set-badge">${setName} [${setCounts[setName]}/${maxSet}]</span>`;
        }

            let salvageBtn = `<button class="action-btn-sm action-btn-salvage" onclick="event.stopPropagation(); window.salvageItem(${item.id}); window.renderProfileModal();">SALVAGE</button>`;

            let arrayName = isHub
              ? "window.inventory.SIGIL"
              : "window.player.bag";
            let tooltipIdx = isHub
              ? idx
              : window.player.bag.findIndex((i) => i.id === item.id);

            let boundTag = isInsured
              ? `<span style="font-size:8px; color:#34d399; font-family:monospace; font-weight:bold;">[BOUND]</span>`
              : "";
            let actionsHtml = isHub
              ? `
                    <button class="action-btn-sm ${isInsured ? "action-btn-insured" : "action-btn-insure"}" onclick="event.stopPropagation(); window.toggleInsurance(${item.id})">${isInsured ? "[ BOUND ]" : "SOUL BIND"}</button>
                    ${salvageBtn}
                  `
              : `
                    ${salvageBtn}
                  `;

            return `
                  <div class="stash-card" style="border-left:3px solid ${col}; cursor:pointer;" onclick="window.showItemTooltip(event, ${arrayName}[${tooltipIdx}])">
                    ${iconHtml}
                    <div class="item-info">
                      <span class="item-title" style="color:${col};">${item.name} ${setBadge}</span>
                      <span class="item-sub">SIGIL • LV.${item.stageLevel || 1}</span>
                      <span class="item-sub" style="color:#a855f7;">Focus: +${((item.rewardMultiplier || 0) * 100).toFixed(0)}% Rewards</span>
                    </div>
                    <div class="item-actions">
                      ${actionsHtml}
                    </div>
                  </div>
                `;
          })
          .join("");
      }
    } else if (stashTab === "USE") {
      let useObj = window.inventory.USE || {};
      let keys = Object.keys(useObj).filter((k) => useObj[k] > 0);

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `CONSUMABLES (<span id="profile-stash-count">${keys.length}</span>)`;
      }

      if (keys.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">No consumable elixirs, scrolls, or sacks owned.<br>Craft elixirs at the Alchemy Shop or earn sacks from Daily Quests!</div>`;
      } else {
        stashListEl.innerHTML = keys
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
                                        <span style="color:${col}; font-weight:bold; font-size:10.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                                        <span style="color:#ffffff; font-family:monospace; font-weight:bold; font-size:10.5px; margin-left:4px;">x${count}</span>
                                      </div>
                                      <div style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.2;">${data.desc}</div>
                                    </div>
                                    <button class="action-btn-sm action-btn-equip" onclick="event.stopPropagation(); window.useConsumableItem('${k}');">USE</button>
                                  </div>
                                `;
          })
          .join("");
      }
    } else if (stashTab === "ETC") {
      let etcObj = window.inventory.ETC || {};
      let pendingScraps = window.player.pendingScraps || {};

      let allKeys = Array.from(
        new Set([...Object.keys(etcObj), ...Object.keys(pendingScraps)]),
      );
      allKeys = allKeys.filter(
        (k) => (etcObj[k] || 0) > 0 || (pendingScraps[k] || 0) > 0,
      );

      if (sectionHeaderEl) {
        sectionHeaderEl.innerHTML = `MATERIALS & SOULS (<span id="profile-stash-count">${allKeys.length}</span>)`;
      }

      if (allKeys.length === 0) {
        stashListEl.innerHTML = `<div style="font-size:10px; color:#94a3b8; font-style:italic; text-align:center; padding:20px 10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; margin: 6px 0;">No materials or Monster Souls owned.<br>Slay monsters in dungeon runs to harvest souls and scraps!</div>`;
      } else {
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

        stashListEl.innerHTML = allKeys
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
                                  <div class="material-card" style="border-left: 3px solid ${col}; display: flex; align-items: center; gap: 8px;">
                                                                      ${iconHtml}
                                                                      <div style="display:flex; flex-direction:column; min-width:0; flex:1;">
                                                                        <div style="display:flex; justify-content:space-between; align-items:center;">
                                                                          <span style="color:${col}; font-weight:bold; font-size:10.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${k}</span>
                                                                          <span style="font-family:monospace; font-size:9.5px; margin-left:4px;">${countLabel}</span>
                                                                        </div>
                                                                        <div style="font-size:8px; color:#94a3b8; font-family:monospace; margin-top:2px; line-height:1.2;">${desc}</div>
                                                                      </div>
                                                                    </div>
                                                                  `;
          })
          .join("");
      }
    }

    if (getActiveProfileMobileTab() === "skills" && window.SkillTreeManager) {
      window.SkillTreeManager.renderSkillTreeUI();
    }
  }

  export function tryAutoEquip(item) {
    if (!item || !window.equippedSlots) return false;

    let targetSlot = null;
    let type = item.type;

    if (type === "weapon" || type === "helmet" || type === "boots") {
      if (!window.equippedSlots[type]) targetSlot = type;
    } else if (
      type === "subweapon" ||
      type === "shield" ||
      type === "dagger" ||
      type === "tome"
    ) {
      if (!window.equippedSlots.subweapon) targetSlot = "subweapon";
    } else if (type === "ring") {
      if (!window.equippedSlots.ring1) targetSlot = "ring1";
      else if (!window.equippedSlots.ring2) targetSlot = "ring2";
    } else if (type === "chest") {
      if (!window.equippedSlots.overall && !window.equippedSlots.chest) {
        targetSlot = "chest";
      }
    } else if (type === "leggings") {
      if (!window.equippedSlots.overall && !window.equippedSlots.leggings) {
        targetSlot = "leggings";
      }
    } else if (type === "overall") {
      if (
        !window.equippedSlots.chest &&
        !window.equippedSlots.leggings &&
        !window.equippedSlots.overall
      ) {
        targetSlot = "overall";
      }
    } else if (type === "artifact") {
      let isAlreadyEquipped = ["art1", "art2", "art3"].some(
        (s) =>
          window.equippedSlots[s] &&
          window.equippedSlots[s].trait === item.trait,
      );
      if (!isAlreadyEquipped) {
        if (!window.equippedSlots.art1) targetSlot = "art1";
        else if (!window.equippedSlots.art2) targetSlot = "art2";
        else if (!window.equippedSlots.art3) targetSlot = "art3";
      }
    }

    if (targetSlot) {
      window.equippedSlots[targetSlot] = item;
      item.isEquippedSlot = targetSlot;
      item.wasAutoEquipped = true;
      if (targetSlot === "subweapon") {
        resetTomeRotation({ tome: item, reason: "tome-auto-equip" });
      }
      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }
      return true;
    }
    return false;
  }

  export function equipFromBag(itemId) {
    window.hideTooltip();
    if (!window.player.bag) window.player.bag = [];
    let bag = window.player.bag;
    let idx = bag.findIndex((i) => i.id == itemId);
    if (idx === -1) return false;

    let item = bag[idx];
    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    let slotKey = item.type;
    let displacementSlotKeys = [];
    if (
      item.type === "shield" ||
      item.type === "dagger" ||
      item.type === "tome" ||
      item.type === "subweapon"
    ) {
      slotKey = "subweapon";
    } else if (item.type === "ring") {
      slotKey = !window.equippedSlots.ring1 ? "ring1" : "ring2";
    } else if (item.type === "artifact") {
      slotKey = !window.equippedSlots.art1
        ? "art1"
        : !window.equippedSlots.art2
          ? "art2"
          : !window.equippedSlots.art3
            ? "art3"
            : "art1";
    } else if (item.type === "overall") {
      slotKey = "overall";
      displacementSlotKeys.push("chest", "leggings");
    } else if (item.type === "chest" || item.type === "leggings") {
      slotKey = item.type;
      displacementSlotKeys.push("overall");
    }

    displacementSlotKeys.push(slotKey);
    displacementSlotKeys = [...new Set(displacementSlotKeys)];
    let displacedItems = displacementSlotKeys
      .map((key) => window.equippedSlots[key])
      .filter(Boolean);
    let prospectiveSlots = { ...window.equippedSlots };
    displacementSlotKeys.forEach((key) => {
      prospectiveSlots[key] = null;
    });
    prospectiveSlots[slotKey] = item;

    let nextCount = bag.length - 1 + displacedItems.length;
    let nextCapacity = window.getMaxBagSlots({
      equippedSlots: prospectiveSlots,
    });
    let transition = window.evaluateRunSatchelTransition(nextCount, {
      bag,
      nextCapacity,
    });
    if (!transition.allowed) {
      let capacityShrinks = nextCapacity < transition.currentCapacity;
      window.notifyRunSatchelBlocked({
        count: bag.length,
        capacity: nextCapacity,
        overflow: transition.overflow,
        markFullEncounter: !capacityShrinks,
        message: capacityShrinks
          ? `Cannot remove Dimensional Pouch: remove ${transition.overflow} carried item${transition.overflow === 1 ? "" : "s"} first.`
          : `Cannot equip ${item.name}: this swap needs ${transition.overflow} more satchel slot${transition.overflow === 1 ? "" : "s"}.`,
      });
      return false;
    }

    bag.splice(idx, 1);
    displacementSlotKeys.forEach((key) => {
      let displaced = window.equippedSlots[key];
      if (!displaced) return;
      delete displaced.isEquippedSlot;
      bag.push(displaced);
      window.equippedSlots[key] = null;
    });
    window.equippedSlots[slotKey] = item;
    item.isEquippedSlot = slotKey;
    if (slotKey === "subweapon") {
      resetTomeRotation({ tome: item, reason: "tome-bag-equip" });
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("swing");
    }
    if (typeof window.saveGame === "function") window.saveGame();
    if (typeof window.renderProfileModal === "function")
      window.renderProfileModal();
    let bagModal = document.getElementById("bag-modal");
    if (bagModal && bagModal.style.display !== "none") {
      window.toggleLootBag();
      window.toggleLootBag();
    }
    return true;
  }

  export function equipFromStash(itemId) {
    window.hideTooltip();
    if (!window.player.stash) window.player.stash = [];
    let stash = window.player.stash;
    let idx = stash.findIndex((i) => i.id == itemId);
    if (idx === -1) return;

    let item = stash[idx];
    if (!window.equippedSlots) {
      window.equippedSlots = {
        weapon: null,
        subweapon: null,
        helmet: null,
        chest: null,
        leggings: null,
        overall: null,
        boots: null,
        ring1: null,
        ring2: null,
        art1: null,
        art2: null,
        art3: null,
      };
    }

    // Determine destination slot key
    let slotKey = item.type;

    if (
      item.type === "shield" ||
      item.type === "dagger" ||
      item.type === "tome" ||
      item.type === "subweapon"
    ) {
      slotKey = "subweapon";
    } else if (item.type === "ring") {
      slotKey = !window.equippedSlots.ring1 ? "ring1" : "ring2";
    } else if (item.type === "artifact") {
      slotKey = !window.equippedSlots.art1
        ? "art1"
        : !window.equippedSlots.art2
          ? "art2"
          : !window.equippedSlots.art3
            ? "art3"
            : "art1";
    } else if (item.type === "overall") {
      if (window.equippedSlots.chest) {
        delete window.equippedSlots.chest.isEquippedSlot;
        stash.push(window.equippedSlots.chest);
        window.equippedSlots.chest = null;
      }
      if (window.equippedSlots.leggings) {
        delete window.equippedSlots.leggings.isEquippedSlot;
        stash.push(window.equippedSlots.leggings);
        window.equippedSlots.leggings = null;
      }
      slotKey = "overall";
    } else if (item.type === "chest" || item.type === "leggings") {
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        stash.push(window.equippedSlots.overall);
        window.equippedSlots.overall = null;
      }
      slotKey = item.type;
    }

    // Swap currently equipped item into stash
    let currentEquipped = window.equippedSlots[slotKey];
    if (currentEquipped) {
      delete currentEquipped.isEquippedSlot;
      stash.push(currentEquipped);
    }
    window.equippedSlots[slotKey] = item;
    item.isEquippedSlot = slotKey;
    stash.splice(idx, 1);
    if (slotKey === "subweapon") {
      resetTomeRotation({ tome: item, reason: "tome-stash-equip" });
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("swing");
    }

    if (typeof window.saveGame === "function") window.saveGame();
  }

  export function unequipToStash(slotKey) {
    if (typeof window.unequipItem === "function") {
      window.unequipItem(slotKey);
    }
  }

  export function salvageFromStash(itemId) {
    window.hideTooltip();
    if (!window.player.stash) window.player.stash = [];
    let stash = window.player.stash;
    let idx = stash.findIndex((i) => i.id == itemId);
    if (idx === -1) return;

    let item = stash[idx];
    stash.splice(idx, 1);

    let rolledTier = item.statsRolled || 0;
    let scrapName = window.getScrapYieldName
      ? window.getScrapYieldName(rolledTier)
      : "Monster Soul";
    let yieldAmount = Math.floor(Math.random() * 3) + 1;

    if (!window.inventory) window.inventory = {};
    if (!window.inventory.ETC) window.inventory.ETC = {};
    window.inventory.ETC[scrapName] =
      (window.inventory.ETC[scrapName] || 0) + yieldAmount;

    if (window.spawnFloatingText) {
      window.spawnFloatingText(
        window.player.x,
        window.player.y - 15,
        `+${yieldAmount} ${scrapName}`,
        "#e74c3c",
      );
    }

    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("death");
    }

    if (typeof window.saveGame === "function") window.saveGame();
    window.updateHUD();
    window.renderProfileModal();
  }

  export function calculateInsurancePremium(item) {
    if (!item) return BigNum.from(0);
    let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
    let W_R = 1 + stars;
    let stageLvl = item.stageLevel || 1;
    return BigNum.from(100).mul(W_R).mul(BigNum.from(1.05).pow(stageLvl));
  }

  export function calculateRunInsuranceTotals() {
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
    let premiums = [];

    allSlots.forEach((slotKey) => {
      let item = window.equippedSlots[slotKey];
      if (item && item.locked && !item.isStarterItem) {
        premiums.push({
          item: item,
          cost: window.calculateInsurancePremium(item),
        });
      }
    });

    premiums.sort((a, b) => b.cost.compareTo(a.cost));

    let totalPremium = BigNum.from(0);
    let totalSoulsCost = 0;

    let getItemSoulCost = function (item) {
      if (!item) return 0;
      let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
      let stageLvl = item.stageLevel || 1;
      let baseCost = 5 + stars * 5;
      let scaleFactor = 1.0 + (stageLvl - 1) * 0.1;
      return Math.max(1, Math.round(baseCost * scaleFactor));
    };

    if (premiums.length >= 2) {
      totalPremium = totalPremium.add(premiums[1].cost);
      totalSoulsCost += getItemSoulCost(premiums[1].item);
    }
    if (premiums.length >= 3) {
      totalPremium = totalPremium.add(premiums[2].cost);
      totalSoulsCost += getItemSoulCost(premiums[2].item);
    }

    // Insurance Underwriter Skill Tree Discount
    {
      let insuranceDiscount =
        getMasteryNodeRank(window.playerStats, "utility_insurance") * 0.1;
      if (insuranceDiscount > 0 && totalPremium.gt(0)) {
        let discountMult = 1.0 - insuranceDiscount;
        totalPremium = totalPremium.mul(discountMult);
      }
    }

    return {
      totalPremium,
      totalSoulsCost,
      waivedItem: premiums[0] ? premiums[0].item : null,
      insuredCount: premiums.length,
    };
  }

  export function toggleInsurance(itemId) {
    window.hideTooltip();

    if (window.currentGameState !== window.GAME_STATES.HUB) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "[!] Soul Binding can only be configured at the Deployment Altar in the Hub!",
          "#e74c3c",
        );
      }
      return;
    }

    let allItems = [];
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k]) allItems.push(window.equippedSlots[k]);
    }
    if (window.player && window.player.stash)
      allItems.push(...window.player.stash);
    if (window.player && window.player.bag) allItems.push(...window.player.bag);
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((i) => {
        if (!allItems.includes(i)) allItems.push(i);
      });
    }

    let targetItem = allItems.find((i) => i.id == itemId);
    if (!targetItem) return;

    let isEquipped = false;
    for (let k in window.equippedSlots) {
      if (
        window.equippedSlots[k] &&
        window.equippedSlots[k].id === targetItem.id
      ) {
        isEquipped = true;
        break;
      }
    }

    if (isEquipped && !targetItem.locked) {
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
      let equippedInsuredCount = allSlots.filter(
        (s) => window.equippedSlots[s] && window.equippedSlots[s].locked,
      ).length;
      if (equippedInsuredCount >= 3) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "[!] Maximum of 3 insured equipped items per run!",
            "#e74c3c",
          );
        }
        return;
      }
    }

    targetItem.locked = !targetItem.locked;

    if (typeof window.pushHeaderToast === "function") {
      if (targetItem.locked) {
        window.pushHeaderToast(
          `[ SOUL INSURED ] Protected ${targetItem.name}!`,
          "#2ecc71",
        );
      } else {
        window.pushHeaderToast(
          `[UNBOUND] ${targetItem.name} At Risk on Death!`,
          "#e74c3c",
        );
      }
    }

    if (typeof window.saveGame === "function") window.saveGame();
    window.renderProfileModal();
  }

