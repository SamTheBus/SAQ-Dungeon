/* ==========================================================================
   PRIMARY PURPOSE: Procedural Item Generation, Unique Styling,
   Sack Management, Forge/Crafting, and Shop Transaction Logic.
   ========================================================================= */
window.getRarityMultiplier = function (stars) {
  if (stars === "UNIQUE" || stars === "unique") return 10.0;
  const multipliers = [1.0, 1.8, 3.2, 4.5, 6.0, 8.0];
  return multipliers[stars] || 1.0;
};

window.isItemUnique = function (item) {
  if (!item) return false;
  return !!(
    item.isUniqueStaff ||
    item.isUniqueSword ||
    item.isUniqueSingularity ||
    item.isUniqueMaelstrom ||
    item.isUniqueAegis ||
    item.isUniqueWatch ||
    item.isUniqueChronicle ||
    item.isUniqueWarpCore ||
    item.isUniqueTempest ||
    item.isUniqueViper ||
    item.isUniqueConduit ||
    item.type === "artifact" ||
    item.statsRolled === "UNIQUE"
  );
};

window.getUniqueKey = function (item) {
  if (!item) return null;
  if (item.type === "artifact" || item.statsRolled === "UNIQUE") {
    return "art_" + item.trait;
  }
  if (item.isUniqueStaff) return "weapon_staff";
  if (item.isUniqueSword) return "weapon_sword";
  if (item.isUniqueSingularity) return "weapon_singularity";
  if (item.isUniqueMaelstrom) return "weapon_maelstrom";
  if (item.isUniqueAegis) return "shield_aegis";
  if (item.isUniqueWatch) return "tome_watch";
  if (item.isUniqueChronicle) return "tome_chronicle";
  if (item.isUniqueWarpCore) return "boots_warpcore";
  if (item.isUniqueTempest) return "helmet_tempest";
  return null;
};

// --- COMPARISON TARGET RESOLUTION ---
window.getEquippedItemForComparison = function (type) {
  let slotKey = type;
  if (type === "overall") {
    if (window.equippedSlots && window.equippedSlots.overall) {
      window.equippedSlots.overall.isEquippedSlot = "overall";
      return window.equippedSlots.overall;
    }
    return window.getCombinedEquippedTorso();
  }
  if (type === "chest" || type === "leggings") {
    if (window.equippedSlots && window.equippedSlots.overall) {
      window.equippedSlots.overall.isEquippedSlot = "overall";
      return window.equippedSlots.overall;
    }
    slotKey = type;
  }
  if (type === "ring") {
    slotKey =
      (window.state && window.state.preferredRingComparisonSlot) || "ring1";
  }
  let item = window.equippedSlots ? window.equippedSlots[slotKey] : null;
  if (item) {
    item.isEquippedSlot = slotKey;
  }
  return item;
};

window.getCombinedEquippedTorso = function () {
  if (!window.equippedSlots) return null;
  let chest = window.equippedSlots.chest;
  let leggings = window.equippedSlots.leggings;
  if (!chest && !leggings) return null;
  let maxStars = Math.max(
    chest ? (chest.statsRolled === "UNIQUE" ? 5 : chest.statsRolled || 0) : 0,
    leggings
      ? leggings.statsRolled === "UNIQUE"
        ? 5
        : leggings.statsRolled || 0
      : 0,
  );
  return {
    id: "virtual_combined",
    name: "Equipped Chest + Leggings",
    type: "overall",
    statsRolled: maxStars,
    temperLevel: 0,
    stageLevel: 1,
    atk: (chest?.atk || 0) + (leggings?.atk || 0),
    maxHp: (chest?.maxHp || 0) + (leggings?.maxHp || 0),
    def: (chest?.def || 0) + (leggings?.def || 0),
    moveSpeed: (chest?.moveSpeed || 0) + (leggings?.moveSpeed || 0),
    critChance: (chest?.critChance || 0) + (leggings?.critChance || 0),
    critDamage: (chest?.critDamage || 0) + (leggings?.critDamage || 0),
    block: (chest?.block || 0) + (leggings?.block || 0),
    parry: (chest?.parry || 0) + (leggings?.parry || 0),
    str: (chest?.str || 0) + (leggings?.str || 0),
    dex: (chest?.dex || 0) + (leggings?.dex || 0),
    int: (chest?.int || 0) + (leggings?.int || 0),
    baseAtk: (chest?.baseAtk || 0) + (leggings?.baseAtk || 0),
    baseMaxHp: (chest?.baseMaxHp || 0) + (leggings?.baseMaxHp || 0),
    baseDef: (chest?.baseDef || 0) + (leggings?.baseDef || 0),
  };
};

window.getComparisonDeltaBadge = function (item) {
  if (item.type === "artifact") return "";
  let eq = window.getEquippedItemForComparison(item.type);
  if (!eq)
    return ` <span style="color:#2ecc71; font-weight:bold; font-size:9px;">[▲ NEW]</span>`;
  return "";
};

// --- GENERAL TOOLTIP BUILDER ---
window.buildGeneralTooltipHtml = function (item, isBagItem = false) {
  let eq = isBagItem ? window.getEquippedItemForComparison(item.type) : null;
  let html = "";

  if (eq && eq.id !== item.id) {
    html += `<div class="tooltip-card compare-border" style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);">${window.generateItemCardHtml(eq, null, true)}</div>`;
    html += `<div class="tooltip-card" style="border: 2px solid transparent;">${window.generateItemCardHtml(item, eq, false)}</div>`;
  } else {
    let isEquipped = isBagItem ? false : item.isEquippedSlot != null;
    let activeStyle = isEquipped
      ? `style="box-shadow: 0 0 16px rgba(231, 76, 60, 0.4), inset 0 0 10px rgba(192, 57, 43, 0.2); border: 2px solid rgba(192, 57, 43, 0.7); border-radius: 6px; background: rgba(10, 2, 2, 0.95);"`
      : ``;
    html += `<div class="tooltip-card" ${activeStyle}>${window.generateItemCardHtml(item, null, isEquipped)}</div>`;
  }

  if (isBagItem && item.type === "ring") {
    let otherSlot =
      ((window.state && window.state.preferredRingComparisonSlot) ||
        "ring1") === "ring1"
        ? "ring2"
        : "ring1";
    let otherLabel = otherSlot === "ring1" ? "Ring Slot 1" : "Ring Slot 2";
    html += `
      <div style="width: 100%; text-align: center; margin-top: 8px; border-top: 1px dashed #333; padding-top: 8px; z-index: 50100; position: relative;">
        <button class="btn-action" style="background: #9b59b6; font-size: 10px; padding: 4px 10px;" onpointerdown="event.stopPropagation();" ontouchstart="event.stopPropagation();" onclick="window.toggleRingComparisonSlot(event, ${item.id})">
          ⟲ Compare with ${otherLabel}
        </button>
      </div>
    `;
  }

  return `<div class="tooltip-flex-container" style="flex-wrap: wrap;">${html}</div>`;
};

// --- ITEM CARD TEMPLATE HTML GENERATOR ---
window.generateItemCardHtml = function (
  item,
  compareItem = null,
  isEquipped = false,
) {
  if (!item) return "";
  let toggleId = `${item.id}_${isEquipped ? "eq" : "bag"}_${Math.floor(Math.random() * 100000)}`;
  let html = `
    <style>
      #attune-toggle-${toggleId}:checked ~ .base-stats-grid .attuned-val { display: none !important; }
      #attune-toggle-${toggleId}:checked ~ .base-stats-grid .raw-val { display: inline !important; }
      #attune-toggle-${toggleId}:checked ~ .attune-label { color: #7f8c8d !important; border-color: #334155 !important; background: rgba(255,255,255,0.02) !important; }
      #attune-toggle-${toggleId}:not(:checked) ~ .attune-label { color: #2ecc71 !important; border-color: #2ecc71 !important; background: rgba(46, 204, 113, 0.1) !important; }
    </style>
    <input type="checkbox" id="attune-toggle-${toggleId}" style="display:none;" />
  `;
  let specialtyHtml = "";

  let slotMult = 1.0;
  if (item.isEquippedSlot) {
    let slotLvl =
      (window.playerStats &&
        window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[item.isEquippedSlot]) ||
      0;
    slotMult = 1.0 + slotLvl * 0.01;
  }

  let temperTag =
    item.temperLevel > 0
      ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
      : "";
  let lockTag = item.locked ? " [LOCKED]" : "";

  if (isEquipped) {
    html += `
      <div style="position: absolute; top: 0; right: 12px; background: linear-gradient(180deg, #e74c3c, #c0392b); border: 1px solid #ff4d4d; border-top: none; border-radius: 0 0 4px 4px; color: #fff; font-size: 8px; font-weight: 800; padding: 2px 6px; text-transform: uppercase; letter-spacing: 1px; z-index: 10; line-height: 1;">
        [EQUIPPED]
      </div>
    `;
  }

  if (item.type === "sigil") {
    let color = window.getTierColor(item.statsRolled);
    let buffDescs = (item.buffs || [])
      .map(
        (b) =>
          `<div style="color:#2ecc71; font-size:10px; margin-bottom:2px;">• ✦ <strong>${b.name}</strong>: ${b.desc}</div>`,
      )
      .join("");
    let debuffDescs = (item.debuffs || [])
      .map(
        (d) =>
          `<div style="color:#e74c3c; font-size:10px; margin-bottom:2px;">• ◈ <strong>${d.name}</strong>: ${d.desc}</div>`,
      )
      .join("");

    return `
      <div class="tt-title" style="color:${color}; white-space:normal;">${item.name}${lockTag}</div>
      <div style="text-align:center; margin: 10px 0;">${window.getEquipIconHtml ? window.getEquipIconHtml(item, 56) : ""}</div>
      <div class="tt-subtitle">CAVERN SIGIL | <span style="color:${color}; font-weight:bold;">${item.statsRolled}★ ${window.getTierName(item.statsRolled)}</span></div>
      <div style="background:#090b0e; border:1px solid #222; border-radius:6px; padding:8px 10px; margin-top:8px;">
        <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px;">[ SIGIL MODIFIERS ]</strong>
        ${buffDescs}${debuffDescs}
        <div style="border-top:1px dashed #222; margin-top:6px; padding-top:6px; display:flex; flex-direction:column; gap:2px; font-family:monospace; font-size:9.5px;">
          <span style="color:#3498db; font-weight:bold;">✦ Focus Rewards: +${((item.rewardMultiplier || 0) * 100).toFixed(0)}% Multiplier</span>
          ${item.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold;">✦ Quality Boost: +${((item.qualityBoost || 0) * 100).toFixed(0)}% Drop Quality</span>` : ""}
        </div>
      </div>
    `;
  }

  let isUnique = window.isItemUnique(item);
  let uniqueStyle = window.getUniqueItemStyle
    ? window.getUniqueItemStyle(item)
    : null;
  let runicBadge = isUnique
    ? `<div style="color: #f1c40f; font-family: monospace; font-weight: 800; font-size: 10px; margin-bottom: 6px; letter-spacing: 2px; text-transform: uppercase;">✦ UBER UNIQUE ✦</div>`
    : ``;

  let iconIllustration = "";
  if (item.type === "artifact") {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getArtifactIconHtml ? window.getArtifactIconHtml(item.trait, 56) : ""}</div>`;
  } else if (isUnique) {
    iconIllustration = `<div style="text-align:center; margin: 10px 0;">${window.getUniqueIconHtml ? window.getUniqueIconHtml(item, 56) : ""}</div>`;
  }

  let tierColor = window.getTierColor(item.statsRolled);
  let titleColor = item.type === "artifact" ? "#1abc9c" : tierColor;
  let labelDisplay = item.type.toUpperCase();
  if (item.type === "subweapon" && item.subType) {
    labelDisplay = `SUBWEAPON (${item.subType.toUpperCase()})`;
  }

  let tierStrDisplay =
    item.statsRolled === "UNIQUE"
      ? "UNIQUE"
      : `${item.statsRolled}★ ${window.getTierName(item.statsRolled)}`;
  let subtitle =
    item.type === "artifact"
      ? "Unique Artifact"
      : `${labelDisplay} | <span style="color:${tierColor}; font-weight:bold;">${tierStrDisplay}</span>`;

  html += `<div class="tt-title" style="color:${isUnique ? "#1abc9c" : titleColor}; white-space:normal;">${item.name}${temperTag}${lockTag}</div>`;
  html += runicBadge;
  html += iconIllustration;
  html += `<div class="tt-subtitle">${subtitle}</div>`;

  if (slotMult > 1.0) {
    let pctBonus = Math.round((slotMult - 1.0) * 100);
    html += `
      <label for="attune-toggle-${toggleId}" class="attune-label" style="font-size: 10px; font-weight: bold; margin-top: 4px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid #2ecc71; border-radius: 4px; padding: 2px 6px; cursor: pointer; user-select: none; width: fit-content; margin-left: auto; margin-right: auto; text-transform: uppercase;">
        Slot Attunement: +${pctBonus}% Stats Applied (Tap for Raw)
      </label>
    `;
  }

  // --- SUBWEAPON SPECIALTIES ---
  if (item.type === "subweapon") {
    let rgbVals = window.hexToRgbValues
      ? window.hexToRgbValues(tierColor)
      : "127, 140, 141";
    if (item.subType === "shield") {
      let reflectDmg = Math.round((item.reflectDamage || 1.0) * 100);
      let blockCapBonus = Math.round((item.blockCapBonus || 0.02) * 100);
      let bashFormulaStr = `${reflectDmg}% Defense`;
      if (item.bashAtkBonus > 0) {
        bashFormulaStr = `${reflectDmg}% Def + ${Math.round(item.bashAtkBonus * 100)}% Atk`;
      }

      specialtyHtml = `
                    <div style="border: 1px solid ${tierColor}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; margin: 6px 0;">
                      <div style="color:${tierColor}; font-weight: 900; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        ${window.getUiIconSvg ? window.getUiIconSvg("block", 12) : "✦"} <span>BULWARK & BASH METRICS</span>
                      </div>
                      <div style="color: #cbd5e1; margin-bottom: 4px;">
                        Blocks completely negate damage (Cap: 20%-28%). Every Block triggers a Shield Bash counter.
                      </div>
                      <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px; display: flex; flex-direction: column; gap: 2px; font-family: monospace; font-size: 9.5px;">
                        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Shield Bash Power:</span> <strong style="color:#3498db;">${bashFormulaStr}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Block Cap Bonus:</span> <strong style="color:#2ecc71;">+${blockCapBonus}% Cap</strong></div>
                      </div>
                    </div>
                  `;
    } else if (item.subType === "dagger") {
      let riposteDmg = Math.round((item.riposteDamage || 0.8) * 100);
      let bleedChance = Math.round((item.bleedChance || 0) * 100);
      let offhandChance = Math.round((item.offhandChance || 0) * 100);
      let offhandDmg = Math.round((item.offhandDmg || 0.35) * 100);
      let mitigationPct = Math.round((item.parryMitigation || 0.6) * 100);

      let metricLines = [
        `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Parry Mitigation:</span> <strong style="color:#3498db;">${mitigationPct}% Damage</strong></div>`,
        `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Riposte Counter:</span> <strong style="color:#a855f7;">${riposteDmg}% Attack</strong></div>`,
      ];
      if (bleedChance > 0) {
        metricLines.push(
          `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Bleed Chance:</span> <strong style="color:#e74c3c;">${bleedChance}% per swing</strong></div>`,
        );
      }
      if (offhandChance > 0) {
        metricLines.push(
          `<div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Offhand Double-Strike:</span> <strong style="color:#2ecc71;">${offhandChance}% (${offhandDmg}% Dmg)</strong></div>`,
        );
      }

      specialtyHtml = `
                    <div style="border: 1px solid ${tierColor}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; margin: 6px 0;">
                      <div style="color:${tierColor}; font-weight: 900; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        ${window.getUiIconSvg ? window.getUiIconSvg("parry", 12) : "✦"} <span>RIPOSTE & COMBAT METRICS</span>
                      </div>
                      <div style="color: #cbd5e1; margin-bottom: 4px;">
                        Parries mitigate ${mitigationPct}% of incoming damage (Cap: 15%-35%) and trigger an automatic Riposte counter strike.
                      </div>
                      <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px; display: flex; flex-direction: column; gap: 2px; font-family: monospace; font-size: 9.5px;">
                        ${metricLines.join("")}
                      </div>
                    </div>
                  `;
    } else if (item.subType === "tome") {
      let nameMap = {
        fire: "Fireball",
        lightning: "Chain Zap",
        frost: "Frost Nova",
        tri: "Tri-Element Burst",
      };
      let spellName = nameMap[item.spellType || "tri"] || "Arcane Burst";
      let spellChance = Math.round(
        (item.spellChance !== undefined ? item.spellChance : 0.33) * 100,
      );
      let spellPower = Math.round((item.spellPower || 1.5) * 100);

      specialtyHtml = `
                    <div style="border: 1px solid ${tierColor}44; border-radius:6px; background: rgba(${rgbVals}, 0.04); padding: 6px 10px; font-size: 10px; line-height: 1.4; text-align: left; margin: 6px 0;">
                      <div style="color:${tierColor}; font-weight: 900; font-size: 9.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                        ${window.getUiIconSvg ? window.getUiIconSvg("barrier", 12) : "✦"} <span>ARCANE BARRIER & SPELL METRICS</span>
                      </div>
                      <div style="color: #cbd5e1; margin-bottom: 4px;">
                        Absorbs 20% to 35% of damage (scales with INT) before Defense checks.
                      </div>
                      <div style="border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px; display: flex; flex-direction: column; gap: 2px; font-family: monospace; font-size: 9.5px;">
                        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Active Spell:</span> <strong style="color:#f1c40f;">${spellName}</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Proc Chance:</span> <strong style="color:#2ecc71;">${spellChance}% per swing</strong></div>
                        <div style="display:flex; justify-content:space-between;"><span style="color:#94a3b8;">Spell Power:</span> <strong style="color:#3498db;">${spellPower}% Attack</strong></div>
                      </div>
                    </div>
                  `;
    }
  }

  // --- PREMIUM BASE STATS & CORE METRICS GRID ---
  if (
    item.id !== "dummy" &&
    item.type !== "artifact" &&
    item.type !== "sigil"
  ) {
    let gridBadges = [];

    if (item.type === "subweapon") {
      if (item.subType === "tome") {
        let spellChance = Math.round(
          (item.spellChance !== undefined ? item.spellChance : 0.33) * 100,
        );
        let spellPower = Math.round((item.spellPower || 1.5) * 100);
        gridBadges.push({
          label: "Damage",
          raw: window.formatNumber(item.baseAtk),
          attuned: window.formatNumber(Math.ceil(item.baseAtk * slotMult)),
          icon: window.getUiIconSvg("atk", 13),
        });
        gridBadges.push({
          label: "INT",
          raw: `+${item.baseInt || 0}`,
          attuned: `+${Math.ceil((item.baseInt || 0) * slotMult)}`,
          icon: window.getUiIconSvg("int", 13),
        });
        gridBadges.push({
          label: "Spell %",
          raw: `${spellChance}%`,
          attuned: `${spellChance}%`,
          icon: window.getUiIconSvg("activeAttackSpeed", 13),
        });
        gridBadges.push({
          label: "Spell Dmg",
          raw: `${spellPower}% Atk`,
          attuned: `${spellPower}% Atk`,
          icon: window.getUiIconSvg("critDamage", 13),
        });

        let tomeDesc =
          "Spells trigger with equal 33.3% chance between Fireball (Burst Dmg), Chain Zap (3x Lightning Bounce), and Frost Nova (AoE Slow). Absorbs 20%-35% of incoming damage before Defense.";
        let tomeTitle = "✦ Arcane Triad Array & Barrier:";
        let tomeTitleColor = "#9b59b6";
        if (item.spellType === "fire") {
          tomeTitle = "✦ Fireball Burst & Barrier:";
          tomeTitleColor = "#e67e22";
          tomeDesc =
            "Launches concentrated Fireball bursts dealing heavy burst damage. Absorbs 20%-35% of incoming damage before Defense.";
        } else if (item.spellType === "lightning") {
          tomeTitle = "✦ Chain Zap Arcs & Barrier:";
          tomeTitleColor = "#f1c40f";
          tomeDesc =
            "Triggers rapid Chain Zap electrical arcs with high proc frequency. Absorbs 20%-35% of incoming damage before Defense.";
        } else if (item.spellType === "frost") {
          tomeTitle = "✦ Glacial Frost Nova & Barrier:";
          tomeTitleColor = "#3498db";
          tomeDesc =
            "Emits Glacial Frost Novas dealing area frost damage. Absorbs 20%-35% of incoming damage before Defense.";
        }

        specialtyHtml = `
                  <div style="font-size: 9.5px; color: #cbd5e1; line-height: 1.4; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
                    <strong style="color: ${tomeTitleColor}; display: block; margin-bottom: 2px;">${tomeTitle}</strong>
                    ${tomeDesc}
                  </div>
                `;
      } else if (item.subType === "shield") {
        let reflectDmg = Math.round((item.reflectDamage ?? 1.0) * 100);
        let blockPct = Math.round((item.baseBlock ?? 0.08) * 100);
        gridBadges.push({
          label: "Armor",
          raw: window.formatNumber(item.baseDef),
          attuned: window.formatNumber(Math.ceil(item.baseDef * slotMult)),
          icon: window.getUiIconSvg("def", 13),
        });
        gridBadges.push({
          label: "STR",
          raw: `+${item.baseStr || 0}`,
          attuned: `+${Math.ceil((item.baseStr || 0) * slotMult)}`,
          icon: window.getUiIconSvg("str", 13),
        });
        gridBadges.push({
          label: "Block %",
          raw: `${blockPct}%`,
          attuned: `${Math.round(blockPct * slotMult)}%`,
          icon: window.getUiIconSvg("block", 13),
        });
        gridBadges.push({
          label: "Bash Dmg",
          raw: `${reflectDmg}% Def`,
          attuned: `${reflectDmg}% Def`,
          icon: window.getUiIconSvg("atk", 13),
        });

        let shieldTitle = "✦ Bulwark Specialty:";
        let shieldDesc =
          "Blocks completely negate damage (20%-28% cap). Every block triggers a Shield Bash counter scaling with Defense.";
        if (item.subArchetype === "tower") {
          shieldTitle = "✦ Fortress Tower Bulwark:";
          shieldDesc =
            "Heavy defensive tower shield. Expands Block Cap up to 28% and triggers massive Defense-scaling Shield Bashes (120%-200% Def).";
        } else if (item.subArchetype === "buckler") {
          shieldTitle = "✦ Deflective Buckler Counter:";
          shieldDesc =
            "Agile reactive shield with elevated base Block Rate. Shield Bashes deal hybrid damage scaling with 60% Defense + 50% Attack.";
        }

        specialtyHtml = `
                          <div style="font-size: 9.5px; color: #cbd5e1; line-height: 1.4; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
                            <strong style="color: #3498db; display: block; margin-bottom: 2px;">${shieldTitle}</strong>
                            ${shieldDesc}
                          </div>
                        `;
      } else if (item.subType === "dagger") {
        let riposteDmg = Math.round((item.riposteDamage ?? 0.8) * 100);
        let parryPct = Math.round((item.baseParry ?? 0.06) * 100);
        gridBadges.push({
          label: "Damage",
          raw: window.formatNumber(item.baseAtk),
          attuned: window.formatNumber(Math.ceil(item.baseAtk * slotMult)),
          icon: window.getUiIconSvg("atk", 13),
        });
        gridBadges.push({
          label: "DEX",
          raw: `+${item.baseDex || 0}`,
          attuned: `+${Math.ceil((item.baseDex || 0) * slotMult)}`,
          icon: window.getUiIconSvg("dex", 13),
        });
        gridBadges.push({
          label: "Parry %",
          raw: `${parryPct}%`,
          attuned: `${Math.round(parryPct * slotMult)}%`,
          icon: window.getUiIconSvg("parry", 13),
        });
        gridBadges.push({
          label: "Riposte",
          raw: `${riposteDmg}% Atk`,
          attuned: `${riposteDmg}% Atk`,
          icon: window.getUiIconSvg("critDamage", 13),
        });

        let daggerTitle = "✦ Riposte & Bleed Specialty:";
        let daggerDesc =
          "Parries mitigate 60% of damage (15%-35% cap) and trigger an automatic Riposte counter strike + Bleed DoT.";
        if (item.subArchetype === "main_gauche") {
          daggerTitle = "✦ Main-Gauche Parry Mastery:";
          daggerDesc =
            "Defensive parrying dagger. Mitigates 75% of incoming damage on parry and expands maximum Parry Cap up to 35%.";
        } else if (item.subArchetype === "stiletto") {
          daggerTitle = "✦ Stiletto Lethal Piercing & Bleed:";
          daggerDesc =
            "Precision piercing dagger. Strikes apply defense-bypassing Bleed DoTs (35%-55% chance) and deal heavy Riposte counters (100% Atk).";
        } else if (item.subArchetype === "flurry") {
          daggerTitle = "✦ Dual-Strike Flurry Dagger:";
          daggerDesc =
            "High-speed offhand blade. Swings trigger 50%-75% Offhand Double-Strikes (45% Atk) with bonus bleed chances.";
        }

        specialtyHtml = `
                          <div style="font-size: 9.5px; color: #cbd5e1; line-height: 1.4; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
                            <strong style="color: #a855f7; display: block; margin-bottom: 2px;">${daggerTitle}</strong>
                            ${daggerDesc}
                          </div>
                        `;
      }
    } else {
      if (item.baseAtk > 0)
        gridBadges.push({
          label: "Damage",
          raw: window.formatNumber(item.baseAtk),
          attuned: window.formatNumber(Math.ceil(item.baseAtk * slotMult)),
          icon: window.getUiIconSvg("atk", 13),
        });
      if (item.baseDef > 0)
        gridBadges.push({
          label: "Armor",
          raw: window.formatNumber(item.baseDef),
          attuned: window.formatNumber(Math.ceil(item.baseDef * slotMult)),
          icon: window.getUiIconSvg("def", 13),
        });
      if (item.baseMaxHp > 0)
        gridBadges.push({
          label: "Max HP",
          raw: window.formatNumber(item.baseMaxHp),
          attuned: window.formatNumber(Math.ceil(item.baseMaxHp * slotMult)),
          icon: window.getUiIconSvg("maxHp", 13),
        });
      if (item.baseMoveSpeed > 0)
        gridBadges.push({
          label: "Speed",
          raw: window.formatNumber(item.baseMoveSpeed),
          attuned: window.formatNumber(
            Math.ceil(item.baseMoveSpeed * slotMult),
          ),
          icon: window.getUiIconSvg("moveSpeed", 13),
        });
      if (item.baseBlock > 0)
        gridBadges.push({
          label: "Block",
          raw: Math.round(item.baseBlock * 100) + "%",
          attuned: Math.round(item.baseBlock * slotMult * 100) + "%",
          icon: window.getUiIconSvg("block", 13),
        });
      if (item.baseParry > 0)
        gridBadges.push({
          label: "Parry",
          raw: Math.round(item.baseParry * 100) + "%",
          attuned: Math.round(item.baseParry * slotMult * 100) + "%",
          icon: window.getUiIconSvg("parry", 13),
        });
      if (item.baseStr > 0)
        gridBadges.push({
          label: "STR",
          raw: `+${item.baseStr}`,
          attuned: `+${Math.ceil(item.baseStr * slotMult)}`,
          icon: window.getUiIconSvg("str", 13),
        });
      if (item.baseDex > 0)
        gridBadges.push({
          label: "DEX",
          raw: `+${item.baseDex}`,
          attuned: `+${Math.ceil(item.baseDex * slotMult)}`,
          icon: window.getUiIconSvg("dex", 13),
        });
      if (item.baseInt > 0)
        gridBadges.push({
          label: "INT",
          raw: `+${item.baseInt}`,
          attuned: `+${Math.ceil(item.baseInt * slotMult)}`,
          icon: window.getUiIconSvg("int", 13),
        });
    }

    if (gridBadges.length > 0) {
      let cols = Math.min(gridBadges.length, 4);
      html += `<div class="base-stats-grid" style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 6px; margin: 8px 0; display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">`;
      gridBadges.forEach((b) => {
        let isChanged = b.raw !== b.attuned;
        let attunedColor = isChanged ? "#2ecc71" : "#f5f6fa";
        html += `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; background: rgba(255, 255, 255, 0.02); padding: 4px 2px; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.04);">
              <span style="font-size: 7.5px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${b.label}</span>
              <div style="font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 3px; line-height: 1;">
                ${b.icon}
                <span class="attuned-val" style="color:${attunedColor}; white-space: nowrap;">${b.attuned}</span>
                <span class="raw-val" style="color:#f5f6fa; white-space: nowrap; display:none;">${b.raw}</span>
              </div>
            </div>
          `;
      });
      html += `</div>`;
    }
  }

  if (item.type === "artifact") {
    html += `<div class="tt-trait">${item.breakdown || item.desc}</div>`;
  } else {
    if (isUnique && item.desc) {
      html += `<div class="tt-stat-line" style="color:#ffeaa7; margin-bottom: 10px; line-height:1.4; padding:6px; border:1px dashed #1abc9c; background:rgba(0,0,0,0.4); border-radius:4px;"><strong>[ Unique Effect ]:</strong> ${item.desc}</div>`;
    }
    if (item.totalEnchants > 0) {
      html += `<div style="color:#9b59b6; font-size:10px; font-weight:bold; margin-bottom:6px; letter-spacing:0.5px; border: 1px dashed #9b59b6; padding: 3px; border-radius: 3px; background: rgba(155, 89, 182, 0.05); text-align: center;">MYSTICAL ENCHANTS: ${item.totalEnchants} ACTIVE</div>`;
    }
    html += `<div style="font-weight:bold; color:#aaa; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">[ AFFIXES ]</div>`;
  }

  // --- EXPLICIT AFFIXES ---
  if (item.id !== "dummy") {
    let affixes = [];
    let rangeLines = [];
    const statsKeys = [
      { key: "atk", label: "Attack", baseKey: "baseAtk" },
      { key: "maxHp", label: "Max HP", baseKey: "baseMaxHp" },
      { key: "def", label: "Defense", baseKey: "baseDef" },
      { key: "moveSpeed", label: "Move Speed", baseKey: "baseMoveSpeed" },
      { key: "str", label: "STR", baseKey: "baseStr" },
      { key: "dex", label: "DEX", baseKey: "baseDex" },
      { key: "int", label: "INT", baseKey: "baseInt" },
      {
        key: "critChance",
        label: "Crit Chance",
        isPct: true,
        baseKey: "baseCritChance",
      },
      {
        key: "critDamage",
        label: "Crit Multi",
        isPct: true,
        baseKey: "baseCritDamage",
      },
      { key: "block", label: "Block Rate", isPct: true, baseKey: "baseBlock" },
      { key: "parry", label: "Parry Rate", isPct: true, baseKey: "baseParry" },
      {
        key: "activeAttackSpeed",
        label: "Active Atk Spd",
        isPct: true,
        baseKey: "baseActiveSpeed",
      },
      {
        key: "idleAttackSpeed",
        label: "Idle Atk Spd",
        isPct: true,
        baseKey: "baseIdleSpeed",
      },
      { key: "dropRate", label: "Drop Rate", isPct: true },
      { key: "quality", label: "Drop Quality", isPct: true },
      { key: "goldMulti", label: "Gold Multi", isPct: true },
    ];

    statsKeys.forEach((s) => {
      let totalVal = item[s.key] || 0;
      let baseVal =
        item.type !== "artifact" && s.baseKey ? item[s.baseKey] || 0 : 0;
      let affixVal = totalVal - baseVal;

      if (affixVal > 0.0001) {
        let displayVal = s.isPct
          ? `+${Math.floor(affixVal * 100)}%`
          : `+${window.formatNumber(affixVal)}`;
        if (slotMult > 1.0) {
          let scaledVal = affixVal * slotMult;
          let scaledStr = s.isPct
            ? `+${Math.floor(scaledVal * 100)}%`
            : `+${window.formatNumber(scaledVal)}`;
          displayVal += ` <span style="color:#2ecc71; font-size:10px; font-weight:bold;">(➔ ${scaledStr})</span>`;
        }

        let iconSvg = window.getUiIconSvg
          ? window.getUiIconSvg(s.key, 11)
          : "✦";
        let rangeStr = window.formatStatRangeStr
          ? window.formatStatRangeStr(item, s.key, s.isPct)
          : "";

        if (rangeStr) {
          rangeLines.push(`
            <div style="font-size: 9.5px; color: #aaa; display: flex; justify-content: space-between; align-items: center; font-family: monospace; background: rgba(0,0,0,0.22); padding: 4px 6px; border-radius: 4px; border: 1px solid #111;">
              <span style="color: #94a3b8; font-weight: bold; display: flex; align-items: center; gap: 4px;">${iconSvg} ${s.label} Range:</span>
              <span>${rangeStr}</span>
            </div>
          `);
        }

        affixes.push(
          `<div class="tt-stat-line" style="color:${s.key === "critChance" || s.key === "critDamage" ? "#e67e22" : "#ecf0f1"}; font-weight: bold;">• ${iconSvg} ${s.label}: ${displayVal}</div>`,
        );
      }
    });

    if (affixes.length > 0) {
      html += affixes.join("");
    } else if (item.type !== "artifact") {
      html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No extra affixes.</div>`;
    }

    let setName = window.getItemSetName ? window.getItemSetName(item) : null;
    if (setName && window.SET_DEFINITIONS && window.SET_DEFINITIONS[setName]) {
      let setDef = window.SET_DEFINITIONS[setName];

      let currentSetCount = 0;
      if (window.equippedSlots) {
        const eligibleSetSlots = [
          "weapon",
          "subweapon",
          "helmet",
          "chest",
          "leggings",
          "overall",
          "boots",
        ];
        eligibleSetSlots.forEach((slot) => {
          let eqItem = window.equippedSlots[slot];
          if (eqItem) {
            let eqSetName = window.getItemSetName
              ? window.getItemSetName(eqItem)
              : null;
            if (eqSetName === setName) {
              currentSetCount += slot === "overall" ? 2 : 1;
            }
          }
        });
      }

      html += `<div style="margin-top:10px; padding-top:6px; border-top:1px dashed #555;">`;
      html += `<div style="font-weight:bold; color:#f1c40f; font-size:10px;">✦ SET: ${setDef.name} <span style="color:#aaa; font-size:9px; font-weight:normal;">(${currentSetCount} Equipped)</span></div>`;
      setDef.bonuses.forEach((b) => {
        let isActive = currentSetCount >= b.count;
        let color = isActive ? "#2ecc71" : "#64748b";
        let weightStyle = isActive
          ? "font-weight:bold;"
          : "font-weight:normal; opacity:0.65;";
        html += `<div style="font-size:9px; color:${color}; ${weightStyle} margin-top:2px;">• (${b.count} pieces): ${b.desc}</div>`;
      });
      html += `</div>`;
    }
  }

  // --- NET CHANGE COMPARED TO EQUIPPED ---
  if (compareItem) {
    html += `<div style="font-weight:bold; color:#3498db; margin-top:8px; margin-bottom:4px; border-bottom: 1px solid #333; padding-bottom: 2px;">Net Change:</div>`;
    let hasDiffs = false;
    let statsList = [
      { key: "atk" },
      { key: "maxHp" },
      { key: "def" },
      { key: "moveSpeed" },
      { key: "str" },
      { key: "dex" },
      { key: "int" },
      { key: "critChance", isPct: true },
      { key: "critDamage", isPct: true },
      { key: "block", isPct: true },
      { key: "parry", isPct: true },
    ];

    statsList.forEach((s) => {
      let val = item[s.key] || 0;
      let eqVal = compareItem[s.key] || 0;
      let diff = val - eqVal;
      if (Math.abs(diff) > 0.001) {
        hasDiffs = true;
        let isPositive = diff > 0;
        let color = isPositive ? "#2ecc71" : "#e74c3c";
        let sign = diff > 0 ? "+" : "";
        let diffStr = s.isPct
          ? sign + Math.round(diff * 100) + "%"
          : sign + window.formatNumber(diff);
        let sLabel = window.getStatLabel ? window.getStatLabel(s.key) : s.key;
        let iconSvg = window.getUiIconSvg
          ? window.getUiIconSvg(s.key, 11)
          : "✦";

        html += `<div class="tt-stat-line" style="color:${color}; font-weight:bold; white-space:nowrap;">• ${iconSvg} ${sLabel}: ${diffStr}</div>`;
      }
    });
    if (!hasDiffs)
      html += `<div class="tt-stat-line" style="color:#7f8c8d; font-style:italic;">No net difference.</div>`;
  }

  // --- COLLAPSIBLE ADVANCED DETAILS DRAWER ---
  if (
    specialtyHtml ||
    (typeof rangeLines !== "undefined" && rangeLines.length > 0)
  ) {
    let specialtySecHtml = specialtyHtml
      ? `<div style="margin-bottom: 8px;">${specialtyHtml}</div>`
      : "";
    let rangeSecHtml =
      typeof rangeLines !== "undefined" && rangeLines.length > 0
        ? `<div>
               <strong style="color: #a855f7; display: block; font-size: 9.5px; margin-bottom: 4px; text-transform: uppercase;">Affix Roll Ranges:</strong>
               <div style="display: flex; flex-direction: column; gap: 4px;">
                 ${rangeLines.join("")}
               </div>
             </div>`
        : "";

    html += `
          <details class="tooltip-advanced-details" style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 8px;" onclick="event.stopPropagation();">
            <summary style="font-size: 9.5px; color: #a855f7; cursor: pointer; user-select: none; font-weight: bold; text-align: center; list-style: none; display: flex; align-items: center; justify-content: center; gap: 4px; outline: none;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transform:translateY(1px);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Show Specialty & Roll Ranges
            </summary>
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
              ${specialtySecHtml}
              ${rangeSecHtml}
            </div>
          </details>
        `;
  }

  if (uniqueStyle) {
    if (uniqueStyle.lore) {
      html += `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #555; color: #ffb6c1; font-size: 9.5px; line-line-height: 1.35; font-style: italic;"><i>${uniqueStyle.lore}</i></div>`;
    }
    let animationStyle = item.isUniqueSingularity
      ? " animation: voidSingularityShimmer 4s infinite ease-in-out;"
      : "";
    html = `<div style="position: relative; background: ${uniqueStyle.bg}; border: 2px solid ${uniqueStyle.border}; box-shadow: inset 0 0 20px ${uniqueStyle.shadow}, 0 0 15px ${uniqueStyle.glow}; padding: 16px 12px 12px 12px; border-radius: 4px; box-sizing: border-box; width: 100%;${animationStyle}">
      ${runicBadge}
      ${html}
    </div>`;
  }

  return html;
};

window.executeSpectralShatter = function (id) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let item =
    window.inventory.EQUIP.find((i) => i.id === id) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === id));
  if (!item) return;

  let uniqueKey = window.getUniqueKey(item);
  if (!uniqueKey) return;

  let isUnlocked = window.playerStats.spectralCodex.includes(uniqueKey);
  if (isUnlocked) return;

  let costGold = 1000000000; // 1 Billion Gold
  let costShards = 250;
  let costCores = 5;
  let costEridium = 5;

  let playerShards = window.playerStats.astralShards || 0;
  let playerCores = window.inventory.ETC["Catalyst Core"] || 0;
  let playerEridium = window.inventory.ETC["Eridium Shard"] || 0;
  let playerGold = BigNum.from(window.playerStats.coins);

  if (
    playerGold.lt(costGold) ||
    playerShards < costShards ||
    playerCores < costCores ||
    playerEridium < costEridium
  ) {
    window.pushHeaderToast(
      "❌ Insufficient resources for Spectral Shatter!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "Spectral Shatter",
    `Are you sure you want to sacrifice <strong>1,000,000,000 Gold</strong> and your premium materials to shatter <strong>${item.name}</strong> and permanently secure its passive into your Codex?`,
    "Shatter Essence",
    "Cancel",
    "#e74c3c",
    function () {
      // Deduct gold
      window.playerStats.coins = playerGold.sub(costGold);
      if (window.playerStats.coins.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }

      // Deduct materials
      window.playerStats.astralShards -= costShards;

      window.inventory.ETC["Catalyst Core"] -= costCores;
      if (window.inventory.ETC["Catalyst Core"] === 0)
        delete window.inventory.ETC["Catalyst Core"];

      window.inventory.ETC["Eridium Shard"] -= costEridium;
      if (window.inventory.ETC["Eridium Shard"] === 0)
        delete window.inventory.ETC["Eridium Shard"];

      // Perform standard salvage yield of 1 to 2x Astral Essence
      let yieldAmount = Math.floor(Math.random() * 2) + 1;
      window.addEtcDrop("Astral Essence", yieldAmount);

      // Add to codex
      window.playerStats.spectralCodex.push(uniqueKey);

      // Remove the item from inventory
      let eqIndex = window.inventory.EQUIP.findIndex((i) => i.id === id);
      if (eqIndex !== -1) {
        window.inventory.EQUIP.splice(eqIndex, 1);
      } else {
        let artIndex = window.inventory.ARTIFACT.findIndex((i) => i.id === id);
        if (artIndex !== -1) {
          window.inventory.ARTIFACT.splice(artIndex, 1);
        }
      }

      // Clear selected item
      window.forgeSelectedItem = null;

      // Play audio and show animations
      if (window.SoundManager) window.SoundManager.play("death");
      if (window.spawnTemperParticles) window.spawnTemperParticles(true);

      window.pushHeaderToast(`✦ Codex Unlocked: ${item.name}!`, "#e74c3c");
      window.pushLog(
        `<strong style='color:#e74c3c;'>[CODEX]</strong> Shattered <span style='color:${window.getTierColor(item.statsRolled)};'>${item.name}</span>! Passive unlocked permanently. Gained +${yieldAmount}x Astral Essence as salvage.`,
      );

      window.updateUI();
      window.renderInventory();
      window.renderForgeTab();
      window.saveGame();
    },
  );
};

window.PitySystem = {
  increment() {
    window.playerStats.lootPityCounter =
      (window.playerStats.lootPityCounter || 0) + 1;
  },
  reset() {
    window.playerStats.lootPityCounter = 0;
  },
  getEffectiveRate(baseRate) {
    // Only apply in Dungeons to preserve Campaign balance
    if (!window.playerStats.isDungeonMode) return baseRate;
    let counter = window.playerStats.lootPityCounter || 0;
    return baseRate * (1 + counter * 0.05); // Each failed kill adds +5% base rate
  },
};

window.getSlotUpgradeCost = function (slotKey, currentLevel) {
  let targetLevel = currentLevel + 1; // 1 to 100
  let gold = BigNum.from(0);
  if (targetLevel <= 10) {
    gold = BigNum.from(2500).mul(BigNum.from(1.35).pow(targetLevel));
  } else if (targetLevel <= 30) {
    let costAt10 = BigNum.from(2500).mul(BigNum.from(1.35).pow(10));
    gold = costAt10.mul(BigNum.from(3.55).pow(targetLevel - 10));
  } else {
    let costAt30 = BigNum.from(100000).mul(BigNum.from(2.25).pow(30));
    gold = costAt30.mul(BigNum.from(3.0).pow(targetLevel - 30));
  }

  let materials = [];
  if (targetLevel <= 10) {
    // Copper Attunement (Lv. 1 - 10)
    materials.push({
      name: "Monster Soul",
      qty: Math.floor(15 * Math.pow(1.25, targetLevel)),
    });
  } else if (targetLevel <= 25) {
    // Iron Attunement (Lv. 11 - 25)
    materials.push({
      name: "Monster Soul",
      qty: Math.floor(1000 * Math.pow(1.2, targetLevel - 10)),
    });
    materials.push({
      name: "Rare Scrap",
      qty: Math.floor(15 * Math.pow(1.25, targetLevel - 10)),
    });
  } else if (targetLevel <= 45) {
    // Steel Attunement (Lv. 26 - 45)
    materials.push({
      name: "Luminous Soul",
      qty: Math.floor(5 * Math.pow(1.18, targetLevel - 25)),
    });
    materials.push({
      name: "Magic Scrap",
      qty: Math.floor(25 * Math.pow(1.22, targetLevel - 25)),
    });
  } else if (targetLevel <= 70) {
    // Mythril Attunement (Lv. 46 - 70)
    materials.push({
      name: "Epic Scrap",
      qty: Math.floor(50 * Math.pow(1.16, targetLevel - 45)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(1 * Math.pow(1.15, targetLevel - 45)),
    });
  } else if (targetLevel <= 90) {
    // Celestial Attunement (Lv. 71 - 90)
    materials.push({
      name: "Legendary Scrap",
      qty: Math.floor(250 * Math.pow(1.15, targetLevel - 70)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(5 * Math.pow(1.16, targetLevel - 70)),
    });
  } else if (targetLevel <= 100) {
    // Void Singularity Attunement (Lv. 91 - 100)
    materials.push({
      name: "Mythic Scrap",
      qty: Math.floor(500 * Math.pow(1.15, targetLevel - 90)),
    });
    materials.push({
      name: "Astral Shards",
      qty: Math.floor(15 * Math.pow(1.16, targetLevel - 90)),
    });
  }

  return { gold, materials };
};

window.forgeSelectedItem = null;
window.forgeMode = "temper";

window.enchantSelectedItem = null;
window.enchantMode = "enchant";

window.setEnchantMode = function (mode) {
  window.enchantMode = mode;
  const modes = ["enchant", "purge", "set", "shatter"];
  modes.forEach((m) => {
    let el = document.getElementById("btn-enchant-mode-" + m);
    if (el) {
      el.className = "forge-mode-btn";
      el.style.background = "rgba(15, 23, 42, 0.8)";
    }
  });

  let activeEl = document.getElementById("btn-enchant-mode-" + mode);
  if (activeEl) {
    activeEl.className = "forge-mode-btn active";
    if (mode === "enchant")
      activeEl.style.background = "rgba(168, 85, 247, 0.35)";
    if (mode === "purge") activeEl.style.background = "rgba(192, 57, 43, 0.35)";
    if (mode === "set") activeEl.style.background = "rgba(46, 204, 113, 0.35)";
    if (mode === "shatter")
      activeEl.style.background = "rgba(230, 126, 34, 0.35)";
  }

  if (typeof window.renderEnchantmentTab === "function") {
    window.renderEnchantmentTab();
  }
};

window.toggleEnchantmentModal = function () {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let modal = document.getElementById("enchantment-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    modal.style.display = "flex";
    window.setEnchantMode(window.enchantMode || "enchant");
  } else {
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
  }
};

window.selectEnchantItem = function (id) {
  let item =
    (window.inventory.EQUIP &&
      window.inventory.EQUIP.find((i) => i.id === id)) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === id));

  if (!item && window.equippedSlots) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
        item = window.equippedSlots[k];
        item.isEquippedSlot = k;
        break;
      }
    }
  }

  window.enchantSelectedItem = item;
  window.forgeSelectedItem = item;
  if (typeof window.renderEnchantmentTab === "function") {
    window.renderEnchantmentTab();
  }
};

window.renderEnchantInstructionPane = function (detailEl, mode) {
  let modeInfo = {
    enchant: {
      title: "Celestial Enchantment",
      desc: "Infuse powerful celestial magic into high-tier attuned gear. Enchanting picks a random active stat line and boosts its value by +25%!",
      color: "#9b59b6",
      tip: "Magic (2*) holds 1, Epic (3*) holds 2, Legendary (4*) holds 3, and Mythic (5*) holds 4 maximum enchantments.",
    },
    purge: {
      title: "Arcane Purge",
      desc: "Dispel and clear active enchantments from an item, restoring its stats to their original pre-enchanted baseline so you can re-enchant.",
      color: "#c0392b",
      tip: "Resetting enchantments frees up all slots, but spent materials are non-refundable.",
    },
    set: {
      title: "Set Resonance Matrix",
      desc: "Shift the named set affiliation (e.g. Vanguard, Colossus, Midas) on your gear to complete matching 2-piece and 3-piece set bonuses.",
      color: "#2ecc71",
      tip: "Equipping matching sets provides massive multipliers to Attack, Health, Defense, and Crit stats!",
    },
    shatter: {
      title: "Spectral Shatter",
      desc: "Sacrifice unequipped Unique weapons, armor, or relics to permanently unlock their active passive effects inside your Spectral Codex!",
      color: "#e74c3c",
      tip: "Unlocking a passive inside the Codex allows you to activate its unique modifiers without needing to equip the item!",
    },
  };

  let info = modeInfo[mode] || modeInfo.enchant;

  detailEl.innerHTML = `
    <div style="display:flex; flex-direction:column; text-align:left; gap:10px;">
      <div>
        <div style="font-weight:bold; font-size:14px; color:${info.color}; border-bottom:1.5px solid #222; padding-bottom:6px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">
          ${info.title}
        </div>
        <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal;">
          ${info.desc}
        </p>
      </div>
      <div style="border-left:3px solid ${info.color}; background:rgba(255,255,255,0.01); padding:6px 10px; border-radius:0 4px 4px 0; font-size:10.5px; color:#e2e8f0; line-height:1.4; white-space:normal;">
        <b>TIP:</b> ${info.tip}
      </div>
    </div>
  `;
};

window.renderEnchantmentTab = function () {
  let listEl = document.getElementById("enchant-list");
  let detailEl = document.getElementById("enchant-details");
  if (!listEl || !detailEl) return;

  let mode = window.enchantMode || "enchant";
  let eligibleItems = [];

  if (mode === "enchant") {
    for (let key in window.equippedSlots) {
      let eq = window.equippedSlots[key];
      if (
        eq &&
        eq.type !== "sigil" &&
        (eq.statsRolled >= 2 || window.isItemUnique(eq))
      ) {
        eligibleItems.push({ ...eq, isEquippedSlot: key });
      }
    }
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((item) => {
        if (
          item &&
          item.type !== "sigil" &&
          (item.statsRolled >= 2 || window.isItemUnique(item))
        ) {
          eligibleItems.push(item);
        }
      });
    }
  } else if (mode === "purge") {
    for (let key in window.equippedSlots) {
      let eq = window.equippedSlots[key];
      if (eq && eq.totalEnchants > 0) {
        eligibleItems.push({ ...eq, isEquippedSlot: key });
      }
    }
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((item) => {
        if (item && item.totalEnchants > 0) {
          eligibleItems.push(item);
        }
      });
    }
  } else if (mode === "set") {
    for (let key in window.equippedSlots) {
      let eq = window.equippedSlots[key];
      if (
        eq &&
        eq.type !== "artifact" &&
        eq.statsRolled !== "UNIQUE" &&
        eq.type !== "sigil"
      ) {
        eligibleItems.push({ ...eq, isEquippedSlot: key });
      }
    }
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((item) => {
        if (
          item &&
          item.type !== "artifact" &&
          item.statsRolled !== "UNIQUE" &&
          item.type !== "sigil"
        ) {
          eligibleItems.push(item);
        }
      });
    }
  } else if (mode === "shatter") {
    if (window.inventory && window.inventory.EQUIP) {
      window.inventory.EQUIP.forEach((item) => {
        if (item && item.type !== "sigil" && window.isItemUnique(item)) {
          eligibleItems.push(item);
        }
      });
    }
    if (window.inventory && window.inventory.ARTIFACT) {
      window.inventory.ARTIFACT.forEach((item) => {
        if (item && window.isItemUnique(item)) {
          eligibleItems.push(item);
        }
      });
    }
  }

  if (eligibleItems.length === 0) {
    let emptyMsg = "No eligible gear found.";
    if (mode === "enchant") {
      emptyMsg =
        "No eligible gear found.<br><br>Only Magic (2*), Epic (3*), Legendary (4*), Mythic (5*), and Unique gear can be enchanted.";
    } else if (mode === "purge") {
      emptyMsg =
        "No enchanted gear found.<br><br>Infuse celestial enchantments on eligible items in Enchantment mode first.";
    } else if (mode === "set") {
      emptyMsg = "No set-compatible gear found in equipment or inventory.";
    } else if (mode === "shatter") {
      emptyMsg =
        "No unequipped Unique items found.<br><br>Only unequipped Unique weapons, armor, or relics can be shattered into the Spectral Codex.";
    }

    listEl.innerHTML = `<div style="color:#64748b; font-style:italic; text-align:center; padding:30px 10px; font-size:11px;">${emptyMsg}</div>`;
    window.renderEnchantInstructionPane(detailEl, mode);
    return;
  }

  if (
    !window.enchantSelectedItem ||
    !eligibleItems.some((i) => i.id === window.enchantSelectedItem.id)
  ) {
    window.enchantSelectedItem = eligibleItems[0];
    window.forgeSelectedItem = eligibleItems[0];
  }

  listEl.innerHTML = eligibleItems
    .map((item) => {
      let isSelected =
        window.enchantSelectedItem && window.enchantSelectedItem.id === item.id;
      let nameColor = window.getTierColor(item.statsRolled);
      let maxEnc = window.getMaxEnchants ? window.getMaxEnchants(item) : 0;
      let curEnc = item.totalEnchants || 0;

      let slotsBadges = "";
      if (maxEnc > 0) {
        for (let s = 0; s < maxEnc; s++) {
          slotsBadges +=
            s < curEnc
              ? `<span style="color:#00d2ff; font-weight:bold;">+</span>`
              : `<span style="color:#334155;">.</span>`;
        }
      }

      let bgStyle = isSelected
        ? "background: rgba(0, 210, 255, 0.15);"
        : "background: rgba(15, 23, 42, 0.65);";
      let borderCol = isSelected ? "#00d2ff" : "#202632";
      let eqBadge = item.isEquippedSlot
        ? `<span style="background:#c0392b; color:#fff; padding:1px 3px; border-radius:2px; font-size:8px; font-weight:bold; margin-right:4px;">EQ</span>`
        : "";

      let subLabel = `LV.${item.stageLevel || 1}`;
      if (mode === "enchant" || mode === "purge") {
        subLabel += ` • ${curEnc}/${maxEnc} Enchanted`;
      } else if (mode === "set") {
        subLabel += ` • ${item.setName || "No Set"}`;
      } else if (mode === "shatter") {
        let uniqueKey = window.getUniqueKey(item);
        let isUnlocked =
          window.playerStats.spectralCodex &&
          window.playerStats.spectralCodex.includes(uniqueKey);
        subLabel += ` • Codex: ${isUnlocked ? "UNLOCKED" : "LOCKED"}`;
      }

      return `
        <div class="bag-item-forge" style="border: 1.5px solid ${borderCol}; border-left: 4px solid ${nameColor} !important; ${bgStyle} display: flex; align-items: center; padding: 7px 10px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; transition: all 0.15s;" onclick="window.selectEnchantItem(${item.id})">
          <div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>
          <div style="flex:1; min-width:0; text-align:left;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:bold; color:${nameColor}; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${item.name}</span>
              <span style="font-size:10px; font-family:monospace;">${slotsBadges}</span>
            </div>
            <div style="font-size:9.5px; color:#aaa; margin-top:2px;">${eqBadge}${subLabel}</div>
          </div>
        </div>
      `;
    })
    .join("");

  let item = window.enchantSelectedItem;
  window.forgeSelectedItem = item;
  let nameColor = window.getTierColor(item.statsRolled);

  if (mode === "enchant") {
    let maxEnc = window.getMaxEnchants ? window.getMaxEnchants(item) : 0;
    let curEnc = item.totalEnchants || 0;
    let slotKey =
      item.isEquippedSlot ||
      (item.type === "subweapon" ? "subweapon" : item.type);
    let slotLevel =
      (window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[slotKey]) ||
      0;
    let isFullyTempered = slotLevel >= 50;
    let essenceOwned = window.inventory.ETC["Astral Essence"] || 0;

    let essenceColor = essenceOwned >= 1 ? "#00d2ff" : "#e74c3c";
    let attuneColor = isFullyTempered ? "#2ecc71" : "#e74c3c";

    let statusHtml = "";
    if (!isFullyTempered) {
      statusHtml = `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding:15px; border:1px dashed #e74c3c; background:rgba(231,76,60,0.05); border-radius:6px; margin-bottom:12px; font-size:11px;">SLOT ATTUNEMENT LEVEL 50 REQUIRED<br><span style="color:#aaa; font-weight:normal;">Current ${slotKey.toUpperCase()} slot attunement: [${slotLevel}/100]. Attune this slot to Level 50+ in the Forge before enchanting.</span></div>`;
    } else if (curEnc >= maxEnc) {
      statusHtml = `<div style="color:#2ecc71; font-weight:bold; text-align:center; padding:15px; border:1px dashed #2ecc71; background:rgba(46,204,113,0.05); border-radius:6px; margin-bottom:12px; font-size:11px;">MAXIMUM ENCHANTMENTS REACHED (${maxEnc}/${maxEnc})<br><span style="color:#aaa; font-weight:normal;">Switch to PURGE mode to reset active enchantments and re-enchant.</span></div>`;
    }

    let canEnchant = isFullyTempered && curEnc < maxEnc && essenceOwned >= 1;

    detailEl.innerHTML = `
      <div style="font-weight:bold; font-size:13px; color:${nameColor}; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:10px; text-align:left;">${item.name}</div>
      <div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Enchantment Slots: <span style="color:#fff; font-weight:bold;">${curEnc} / ${maxEnc} Active</span></div>

      <div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.3); border:1px solid #1e293b; padding:8px; border-radius:6px; font-size:10.5px; line-height:1.45; margin-bottom:12px;">
        <strong style="color:#00d2ff; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px;">CELESTIAL REQUIREMENTS:</strong>
        <div style="color:${attuneColor};">• Slot Attunement: Level 50+ Required (Current: Lv. ${slotLevel})</div>
        <div style="color:${essenceColor};">• 1x Astral Essence Required (Owned: ${essenceOwned})</div>
        <div style="color:#a855f7;">• Boosts 1 random active stat parameter by +25%!</div>
      </div>

      ${statusHtml}

      <button class="forge-anvil-button" style="width:100%; border-color:#00d2ff; background:linear-gradient(135deg, #0284c7, #3b0764); margin-bottom:10px;" ${canEnchant ? "" : "disabled"} onclick="window.enchantItem()">Infuse Celestial Enchantment</button>
    `;
  } else if (mode === "purge") {
    let curEnc = item.totalEnchants || 0;
    let resetGoldCost = 1000 * (item.stageLevel || 1) * (item.statsRolled || 1);
    let goldOwned = BigNum.from(window.playerStats.coins || 0);
    let goldColor = goldOwned.gte(resetGoldCost) ? "#f1c40f" : "#e74c3c";

    detailEl.innerHTML = `
      <div style="font-weight:bold; font-size:13px; color:${nameColor}; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:10px; text-align:left;">${item.name}</div>
      <div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Active Enchantments to Purge: <span style="color:#9b59b6; font-weight:bold;">${curEnc}</span></div>
      <div style="font-size:11px; color:${goldColor}; margin-bottom:15px; text-align:left;">• ${resetGoldCost.toLocaleString()} Gold Required (Owned: ${window.formatNumber(goldOwned)})</div>
      <div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px; text-align:left;">[NOTICE] Restores all enchanted parameters to their original pre-enchanted baseline. Material essences are non-refundable.</div>
      <button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background:linear-gradient(135deg, #c0392b, #111);" ${goldOwned.gte(resetGoldCost) && curEnc > 0 ? "" : "disabled"} onclick="window.resetItemEnchants()">Purge Enchantments</button>
    `;
  } else if (mode === "set") {
    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + (item.statsRolled || 1) * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;
    let goldOwned = BigNum.from(window.playerStats.coins || 0);

    let goldColor = goldOwned.gte(costGold) ? "#f1c40f" : "#e74c3c";
    let soulsColor = ownedSouls >= soulCost ? "#bdc3c7" : "#e74c3c";

    detailEl.innerHTML = `
      <div style="font-weight:bold; font-size:13px; color:${nameColor}; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:10px; text-align:left;">${item.name}</div>
      <div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Current Set Resonance: <span style="color:#2ecc71; font-weight:bold;">${item.setName || "None"}</span></div>
      <div style="font-size:11px; color:${goldColor}; margin-bottom:3px; text-align:left;">• ${window.formatNumber(costGold)} Gold Required</div>
      <div style="font-size:11px; color:${soulsColor}; margin-bottom:10px; text-align:left;">• ${soulCost}x Monster Soul (Owned: ${ownedSouls.toLocaleString()})</div>
      <div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px; text-align:left;">Randomly rolls a different Set matrix affiliation!</div>
      <button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background:linear-gradient(135deg, #1b2a1e, #111);" ${goldOwned.gte(costGold) && ownedSouls >= soulCost ? "" : "disabled"} onclick="window.rerollItemSet()">Re-Resonate Set</button>

      <div style="margin-top:15px; padding:12px; background:#111; border:1px dashed #2ecc71; border-radius:6px; text-align:left;">
        <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:6px; text-transform:uppercase;">Set Re-Resonance Pool:</div>
        <div style="font-size:9.5px; color:#fff; display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-family:monospace; background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; max-height:110px; overflow-y:auto;">
          <div>✦ Vanguard (+Atk)</div>
          <div>✦ Colossus (+HP)</div>
          <div>✦ Bastion (+Def)</div>
          <div>✦ Windrunner (+Spd)</div>
          <div>✦ Wraith (+Crit%)</div>
          <div>✦ Reaver (+CritDmg)</div>
          <div>✦ Dreadnought (+Block)</div>
          <div>✦ Duellist (+Parry)</div>
          <div>✦ Scholar (+INT)</div>
          <div>✦ Berserker (+STR)</div>
          <div>✦ Scout (+DEX)</div>
          <div>✦ Fortune (+Gold/Drop)</div>
          <div>✦ Mystic (+Qly/INT)</div>
          <div>✦ Alchemist (+HP/Atk)</div>
          <div>✦ Midas' Legacy (+Gold)</div>
          <div>✦ Biohazard (Poison)</div>
          <div>✦ Warlord (Shatter)</div>
          <div>✦ Void-Touched (Frenzy)</div>
        </div>
      </div>
    `;
  } else if (mode === "shatter") {
    let uniqueKey = window.getUniqueKey(item);
    let isUnlocked =
      window.playerStats.spectralCodex &&
      window.playerStats.spectralCodex.includes(uniqueKey);

    let costGold = 1000000000;
    let costShards = 250;
    let costCores = 5;
    let costEridium = 5;

    let playerShards = window.playerStats.astralShards || 0;
    let playerCores = window.inventory.ETC["Catalyst Core"] || 0;
    let playerEridium = window.inventory.ETC["Eridium Shard"] || 0;
    let playerGold = BigNum.from(window.playerStats.coins || 0);

    let goldColor = playerGold.gte(costGold) ? "#2ecc71" : "#e74c3c";
    let shardsColor = playerShards >= costShards ? "#9b59b6" : "#e74c3c";
    let coresColor = playerCores >= costCores ? "#2ecc71" : "#e74c3c";
    let eridiumColor = playerEridium >= costEridium ? "#8e44ad" : "#e74c3c";

    let canAfford =
      playerGold.gte(costGold) &&
      playerShards >= costShards &&
      playerCores >= costCores &&
      playerEridium >= costEridium;

    detailEl.innerHTML = `
      <div style="font-weight:bold; font-size:13px; color:${nameColor}; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:10px; text-align:left;">${item.name}</div>
      <div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Codex Status: ${isUnlocked ? `<span style="color:#2ecc71; font-weight:bold;">UNLOCKED [OK]</span>` : `<span style="color:#e74c3c; font-weight:bold;">LOCKED [X]</span>`}</div>

      <div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.3); border:1px solid #222; padding:8px; border-radius:6px; font-size:11px; line-height:1.45; margin-bottom:12px;">
        <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px;">SPECTRAL SHATTER RECIPE:</strong>
        <div style="color:${goldColor};">• ${window.formatNumber(costGold)} Gold (Owned: ${window.formatNumber(playerGold)})</div>
        <div style="color:${shardsColor};">• ${costShards}x Astral Shards (Owned: ${playerShards})</div>
        <div style="color:${coresColor};">• ${costCores}x Catalyst Core (Owned: ${playerCores})</div>
        <div style="color:${eridiumColor};">• ${costEridium}x Eridium Shard (Owned: ${playerEridium})</div>
      </div>

      ${
        isUnlocked
          ? `<div style="color:#2ecc71; font-weight:bold; text-align:center; padding:10px; font-size:11px; border:1px dashed #2ecc71; background:rgba(46,204,113,0.05); border-radius:4px; margin-bottom:12px;">This Unique's passive effect is already active inside your permanent Spectral Codex!</div>
             <button class="forge-anvil-button" style="width:100%; border-color:#222; background:#333; color:#666;" disabled>Already Unlocked</button>`
          : `<div style="color:#f1c40f; font-size:10px; line-height:1.4; text-align:left; background:rgba(241,196,15,0.05); border:1px dashed #f1c40f; padding:8px; border-radius:4px; margin-bottom:12px;">
               <strong>ASTRAL EXTRACTION ACTIVE:</strong><br>
               This process permanently shatters and destroys the physical item to unlock its passive. You will receive its standard salvage payload of <b>1 to 2x Astral Essences</b> as a bonus!
             </div>
             <button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background:linear-gradient(135deg, #c0392b, #4a154b);" ${canAfford ? "" : "disabled"} onclick="window.executeSpectralShatter(${item.id})">Shatter Unique Essence</button>`
      }
    `;
  }
};

window.hexToRgbCache = window.hexToRgbCache || {};

window.hexToRgbValues = function (hex) {
  if (!hex || hex.charAt(0) !== "#") return "30, 41, 59";
  if (!window.hexToRgbCache[hex]) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    window.hexToRgbCache[hex] = `${r}, ${g}, ${b}`;
  }
  return window.hexToRgbCache[hex];
};

// Initialize window.ItemFactory Namespace to encapsulate item math and properties
window.ItemFactory = {
  // Universal Set generation roller with targeted theme biases for Dungeons and Rift hunts
  rollSetForItem(isBoss, isRare, isDungeon, currentDungeon) {
    let setChance = 0.15; // 15% base rate
    if (isDungeon) setChance = 0.4;
    else if (isBoss) setChance = 0.3;
    else if (isRare) setChance = 0.25;

    if (Math.random() > setChance) return null;

    let setKeys = [
      "Vanguard",
      "Colossus",
      "Bastion",
      "Windrunner",
      "Wraith",
      "Reaver",
      "Dreadnought",
      "Duellist",
      "Scholar",
      "Berserker",
      "Scout",
      "Fortune",
      "Mystic",
      "Alchemist",
      "Midas",
      "Biohazard",
      "Warlord",
      "VoidTouched",
    ];

    // 70% chance to respect regional theme layout
    if (Math.random() < 0.7) {
      if (isDungeon && currentDungeon) {
        let themes = { equip: "Warlord", gold: "Midas", mat: "Biohazard" };
        if (themes[currentDungeon]) return themes[currentDungeon];
      }
      if (window.playerStats.isUberBoss) {
        return "VoidTouched";
      }
    }

    return setKeys[Math.floor(Math.random() * setKeys.length)];
  },
};

// Legacy Compatibility Aliases to protect existing cross-file references
window.rollSetForItem = (isBoss, isRare, isDungeon, currentDungeon) =>
  window.ItemFactory.rollSetForItem(isBoss, isRare, isDungeon, currentDungeon);

// Calculates gold expenses for set re-resonating
window.getSetRerollGoldCost = function (item) {
  let itemLvlMultiplier = BigNum.from(1.045).pow(
    Math.max(0, (item.stageLevel - 1) * 5),
  );
  return BigNum.from(100)
    .mul(itemLvlMultiplier)
    .mul(BigNum.from(1.5).pow(item.statsRolled));
};

window.generateForgePreviewHtml = function (item, currentLvl, nextLvl) {
  if (!item) {
    return `
      <div style="margin-top:12px; padding:10px; background:rgba(0,0,0,0.3); border:1px dashed #334155; border-radius:6px; font-size:10.5px; color:#94a3b8; text-align:center;">
        No item currently equipped in this slot.<br>Attunement multiplier (+${currentLvl}%) will apply automatically upon equipping!
      </div>
    `;
  }

  let curMult = 1.0 + currentLvl * 0.01;
  let nextMult = 1.0 + nextLvl * 0.01;
  let tierColor = window.getTierColor(item.statsRolled);

  let statsList = [
    {
      key: "baseAtk",
      label: "Base Weapon Damage",
      icon: window.getUiIconSvg("atk", 11),
    },
    {
      key: "baseDef",
      label: "Base Defense",
      icon: window.getUiIconSvg("def", 11),
    },
    {
      key: "baseMaxHp",
      label: "Base Max Life",
      icon: window.getUiIconSvg("maxHp", 11),
    },
    {
      key: "baseInt",
      label: "Base Intelligence",
      icon: window.getUiIconSvg("int", 11),
    },
    {
      key: "baseStr",
      label: "Base Strength",
      icon: window.getUiIconSvg("str", 11),
    },
    {
      key: "baseDex",
      label: "Base Dexterity",
      icon: window.getUiIconSvg("dex", 11),
    },
    {
      key: "baseMoveSpeed",
      label: "Base Speed",
      icon: window.getUiIconSvg("moveSpeed", 11),
    },
  ];

  let lines = "";
  statsList.forEach((s) => {
    let rawVal = item[s.key] || 0;
    if (rawVal > 0) {
      let curVal = Math.ceil(rawVal * curMult);
      let newVal = Math.ceil(rawVal * nextMult);
      let diff = newVal - curVal;
      lines += `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10.5px; background:rgba(0,0,0,0.35); padding:5px 8px; border-radius:4px; margin-bottom:3px; border:1px solid #1e293b;">
          <span style="color:#94a3b8; font-weight:600; display:flex; align-items:center; gap:4px;">${s.icon} ${s.label}</span>
          <span style="font-family:monospace;">
            <span style="color:#cbd5e1;">${window.formatNumber(curVal)}</span> ➔
            <strong style="color:#ffffff;">${window.formatNumber(newVal)}</strong>
            <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${window.formatNumber(diff)})</span>
          </span>
        </div>
      `;
    }
  });

  return `
    <div style="margin-top:10px; padding:10px; background:rgba(15, 23, 42, 0.7); border:1px solid ${tierColor}55; border-radius:6px;">
      <div style="color:${tierColor}; font-weight:bold; font-size:11px; margin-bottom:6px; border-bottom:1px solid #1e293b; padding-bottom:4px; text-transform:uppercase; letter-spacing:0.5px; display:flex; justify-content:space-between;">
        <span>Equipped: ${item.name}</span>
        <span style="font-family:monospace; font-size:9.5px;">+${currentLvl}% ➔ +${nextLvl}%</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:2px;">
        ${lines || '<div style="color:#64748b; font-style:italic; text-align:center; padding:6px; font-size:10px;">No base parameters scaled by attunement.</div>'}
      </div>
    </div>
  `;
};

// Generates highly detailed comparison layouts for Temper and Tier Up forge previews
window.getForgeDiffLines = function (item, previewItem) {
  let diffLines = "";

  // 1. Render Base parameters comparative
  let baseStatsToCompare = [
    {
      key: "baseAtk",
      icon: window.getUiIconSvg("atk", 11),
      label: "Base Weapon Damage",
    },
    {
      key: "baseDef",
      icon: window.getUiIconSvg("def", 11),
      label: "Base Defense",
    },
    {
      key: "baseMaxHp",
      icon: window.getUiIconSvg("maxHp", 11),
      label: "Base Max Life",
    },
    {
      key: "baseInt",
      icon: window.getUiIconSvg("int", 11),
      label: "Base Intelligence",
    },
  ];
  baseStatsToCompare.forEach((s) => {
    let curVal = item[s.key] || 0;
    let newVal = previewItem[s.key] || 0;
    let diff = newVal - curVal;
    if (diff > 0.001) {
      diffLines += `
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; background:rgba(26,188,156,0.06); padding:6px 8px; border-radius:3px; margin-bottom:4px; border:1px solid #1abc9c;">
                      <span style="color:#1abc9c; font-weight:bold;">${s.icon} ${s.label}</span>
                      <span style="font-family:monospace;">
                          <span style="color:#7f8c8d;">${window.formatNumber(curVal)}</span> ➔
                          <strong style="color:#fff;">${window.formatNumber(newVal)}</strong>
                          <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${window.formatNumber(diff)})</span>
                      </span>
                  </div>
              `;
    }
  });

  // 2. Render combined total / affix parameters comparative
  let statsToCompare = [
    {
      key: "atk",
      icon: window.getUiIconSvg("atk", 11),
      label: "Attack Total",
      isPct: false,
    },
    {
      key: "maxHp",
      icon: window.getUiIconSvg("maxHp", 11),
      label: "Max HP Total",
      isPct: false,
    },
    {
      key: "def",
      icon: window.getUiIconSvg("def", 11),
      label: "Defense Total",
      isPct: false,
    },
    {
      key: "moveSpeed",
      icon: window.getUiIconSvg("moveSpeed", 11),
      label: "Move Speed",
      isPct: false,
    },
    {
      key: "str",
      icon: window.getUiIconSvg("str", 11),
      label: "STR",
      isPct: false,
    },
    {
      key: "dex",
      icon: window.getUiIconSvg("dex", 11),
      label: "DEX",
      isPct: false,
    },
    {
      key: "int",
      icon: window.getUiIconSvg("int", 11),
      label: "INT",
      isPct: false,
    },
    {
      key: "critChance",
      icon: window.getUiIconSvg("critChance", 11),
      label: "Crit Chance",
      isPct: true,
    },
    {
      key: "critDamage",
      icon: window.getUiIconSvg("critDamage", 11),
      label: "Crit Multi",
      isPct: true,
    },
    {
      key: "block",
      icon: window.getUiIconSvg("block", 11),
      label: "Block Rate",
      isPct: true,
    },
    {
      key: "parry",
      icon: window.getUiIconSvg("parry", 11),
      label: "Parry Rate",
      isPct: true,
    },
    {
      key: "dropRate",
      icon: window.getUiIconSvg("dropRate", 11),
      label: "Drop Rate",
      isPct: true,
    },
    {
      key: "quality",
      icon: window.getUiIconSvg("quality", 11),
      label: "Drop Quality",
      isPct: true,
    },
    {
      key: "goldMulti",
      icon: window.getUiIconSvg("goldMulti", 11),
      label: "Gold Multi",
      isPct: true,
    },
    {
      key: "rareSpawn",
      icon: window.getUiIconSvg("rareSpawn", 11),
      label: "Rare Spawn",
      isPct: true,
      isDoublePct: true,
    },
    {
      key: "fairySpawn",
      icon: window.getUiIconSvg("fairySpawn", 11),
      label: "Fairy Spawn",
      isPct: true,
    },
    {
      key: "activeAttackSpeed",
      icon: window.getUiIconSvg("activeAttackSpeed", 11),
      label: "Active Atk Spd",
      isPct: true,
    },
    {
      key: "idleAttackSpeed",
      icon: window.getUiIconSvg("idleAttackSpeed", 11),
      label: "Idle Atk Spd",
      isPct: true,
    },
  ];
  statsToCompare.forEach((s) => {
    let curVal = item[s.key] || 0;
    let newVal = previewItem[s.key] || 0;
    let diff = newVal - curVal;
    if (Math.abs(diff) > 0.0001) {
      let curValStr = s.isPct
        ? s.isDoublePct
          ? (curVal * 100).toFixed(2) + "%"
          : Math.round(curVal * 100) + "%"
        : window.formatNumber(curVal);
      let newValStr = s.isPct
        ? s.isDoublePct
          ? (newVal * 100).toFixed(2) + "%"
          : Math.round(newVal * 100) + "%"
        : window.formatNumber(newVal);
      let diffStr = s.isPct
        ? s.isDoublePct
          ? (diff * 100).toFixed(2) + "%"
          : Math.round(diff * 100) + "%"
        : window.formatNumber(diff);

      diffLines += `
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; background:rgba(0,0,0,0.4); padding:6px 8px; border-radius:3px; margin-bottom:4px; border:1px solid #333;">
                    <span style="color:#aaa;">${s.icon} ${s.label}</span>
                    <span style="font-family:monospace;">
                        <span style="color:#7f8c8d;">${curValStr}</span> ➔
                        <strong style="color:#fff;">${newValStr}</strong>
                        <span style="color:#2ecc71; font-weight:bold; margin-left:4px;">(+${diffStr})</span>
                    </span>
                </div>
            `;
    }
  });

  return diffLines;
};

// Renders the entire Blacksmith and Enchanter selection pane with custom comparison values
window.renderForgeTab = function () {
  let listEl = document.getElementById("forge-list");
  let detailEl = document.getElementById("forge-details");
  if (!listEl || !detailEl) return;

  window.playerStats.slotUpgrades = window.playerStats.slotUpgrades || {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
  };

  if (window.forgeMode === "temper") {
    let slotsKeys = [
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
    let slotsLabels = {
      weapon: "Weapon Slot",
      subweapon: "Offhand Slot",
      helmet: "Helmet Slot",
      chest: "Chest Slot",
      leggings: "Leggings Slot",
      overall: "Overall Slot",
      boots: "Boots Slot",
      ring1: "Ring Slot 1",
      ring2: "Ring Slot 2",
      art1: "Artifact Slot 1",
      art2: "Artifact Slot 2",
      art3: "Artifact Slot 3",
    };

    listEl.innerHTML = slotsKeys
      .map((key) => {
        let lvl = window.playerStats.slotUpgrades[key] || 0;
        let isSelected = window.state.selectedForgeSlot === key;
        let equippedItem = window.equippedSlots[key];
        let tierColor = equippedItem
          ? window.getTierColor(equippedItem.statsRolled)
          : "#475569";
        let itemNameHtml = equippedItem
          ? `<span style="color:${tierColor}; font-weight:bold;">${equippedItem.name}</span>`
          : `<span style="color:#64748b; font-style:italic;">[Empty Slot]</span>`;

        let iconSvg = window.getItemIconSvg
          ? window.getItemIconSvg(equippedItem, 28)
          : "";
        let borderCol = isSelected ? tierColor : "#202632";
        let rgbVals = window.hexToRgbValues
          ? window.hexToRgbValues(tierColor)
          : "71, 85, 105";
        let bg = isSelected
          ? `background: rgba(${rgbVals}, 0.18); box-shadow: inset 0 0 10px rgba(${rgbVals}, 0.25);`
          : "background: rgba(15, 23, 42, 0.75);";

        return `
                <div class="forge-slot-card" style="border: 1.5px solid ${borderCol}; border-left: 4.5px solid ${tierColor} !important; ${bg}" onclick="window.selectForgeSlot('${key}')">
                  <div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${iconSvg || `<div class="empty-slot-icon">--</div>`}</div>
                  <div style="flex:1; text-align:left; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <strong style="color:${equippedItem ? tierColor : "#94a3b8"}; font-size:11.5px;">${slotsLabels[key]}</strong>
                      <span style="font-family:monospace; font-size:9.5px; color:#fff; font-weight:bold; background:rgba(0,0,0,0.4); padding:1px 5px; border-radius:3px; border:1px solid rgba(255,255,255,0.1);">Lv. ${lvl}/100</span>
                    </div>
                    <div style="font-size:9.5px; color:#94a3b8; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${itemNameHtml}</div>
                  </div>
                </div>
              `;
      })
      .join("");

    let slotKey = window.state.selectedForgeSlot || "weapon";
    let lvl = window.playerStats.slotUpgrades[slotKey] || 0;
    let displayLabel = slotsLabels[slotKey];
    let selectedEqItem = window.equippedSlots[slotKey];
    let selectedTierColor = selectedEqItem
      ? window.getTierColor(selectedEqItem.statsRolled)
      : "#f97316";

    if (lvl >= 100) {
      detailEl.innerHTML = `
                <div style="font-weight:bold; font-size:13px; color:${selectedTierColor}; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px;">${displayLabel}</div>
                <div style="color:#2ecc71; font-weight:bold; text-align:center; padding: 25px 0; font-size:12px;">MAXIMUM ATTUNEMENT REACHED (Lv. 100)<br><br><span style="color:#aaa; font-weight:normal;">This slot's equipped items now receive an absolute +100% (2.0x) stat multiplier!</span></div>
              `;
      return;
    }

    let cost = window.getSlotUpgradeCost(slotKey, lvl);
    let goldCost = cost.gold;
    let goldOwned = BigNum.from(window.playerStats.coins || 0);
    let goldColor = goldOwned.gte(goldCost) ? "#2ecc71" : "#e74c3c";

    let materialsHtml = cost.materials
      .map((mat) => {
        let owned =
          window.inventory.ETC[mat.name] || window.inventory.USE[mat.name] || 0;
        let isAfford = owned >= mat.qty;
        let color = isAfford ? "#34d399" : "#f87171";
        return `<div style="font-size:10.5px; color:${color}; margin-bottom:3px; font-family:monospace;">• ${mat.qty}x ${mat.name} (Owned: ${owned.toLocaleString()})</div>`;
      })
      .join("");

    let canAfford =
      goldOwned.gte(goldCost) &&
      cost.materials.every(
        (m) =>
          (window.inventory.ETC[m.name] || window.inventory.USE[m.name] || 0) *
            1 >=
          m.qty,
      );

    let liveComparisonHtml = window.generateForgePreviewHtml(
      selectedEqItem,
      lvl,
      lvl + 1,
    );

    detailEl.innerHTML = `
              <div style="font-weight:bold; font-size:13px; color:${selectedTierColor}; border-bottom:1px solid #334155; padding-bottom:4px; margin-bottom:10px; text-align:left; letter-spacing:0.5px;">${displayLabel.toUpperCase()}</div>
              <div style="font-size:11px; margin-bottom:8px; color:#cbd5e1; text-align:left; font-family:monospace;">Slot Attunement Multiplier: <span style="color:#fff; font-weight:bold;">+${lvl}% ➔ <span style="color:#2ecc71;">+${lvl + 1}%</span></span></div>
              <div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${lvl}%; background:linear-gradient(90deg, #ea580c, #f59e0b);"></div></div>

              <div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.35); border:1px solid #1e293b; padding:10px; border-radius:6px; margin-bottom:12px;">
                <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:9.5px; letter-spacing:0.5px;">ATTUNEMENT REQUIREMENTS:</strong>
                <div style="font-size:10.5px; color:${goldColor}; margin-bottom:3px; font-family:monospace;">• ${window.formatNumber(goldCost)} Gold Required (Owned: ${window.formatNumber(goldOwned)})</div>
                ${materialsHtml}
              </div>

              ${liveComparisonHtml}

              <button class="forge-anvil-button" style="width:100%; margin-top:14px; border-color:#ea580c; background:linear-gradient(135deg, #c2410c, #451a03);" ${canAfford ? "" : "disabled"} onclick="window.temperItem()" onpointerdown="window.temperItem()">Harness Heat & Attune Slot</button>
            `;
    return;
  }

  // Draw displays for the remaining modes
  let allValidItems = [
    ...window.inventory.EQUIP.filter((item) => item.type !== "sigil"),
    ...(window.inventory.ARTIFACT || []),
  ];
  for (let key in window.equippedSlots) {
    if (window.equippedSlots[key]) {
      let eqClone = { ...window.equippedSlots[key], isEquippedSlot: key };
      allValidItems.push(eqClone);
    }
  }

  if (allValidItems.length === 0) {
    listEl.innerHTML =
      "<div style='color:#666;text-align:center;padding-top:40px;'>No gear.</div>";
  } else {
    listEl.innerHTML = allValidItems
      .map((item) => {
        let isArt = item.type === "artifact";
        if (
          (window.forgeMode === "reforge" || window.forgeMode === "tier") &&
          isArt
        )
          return "";

        let nameColor = window.getTierColor(item.statsRolled);
        let temperTag = item.temperLevel > 0 ? ` [+${item.temperLevel}]` : "";
        let lockTag = item.locked ? " 🔒" : "";

        let isSelected =
          window.forgeSelectedItem && window.forgeSelectedItem.id === item.id;
        let itemBorderColor = isSelected ? nameColor : "#202632";
        let itemBg = isSelected
          ? `background: rgba(${window.hexToRgbValues(nameColor)}, 0.15); box-shadow: inset 0 0 10px rgba(${window.hexToRgbValues(nameColor)}, 0.22), 0 0 12px rgba(${window.hexToRgbValues(nameColor)}, 0.15);`
          : "background: rgba(15, 17, 26, 0.65);";

        let uniqueStyleStr = "";
        let uniqueStyle = window.getUniqueItemStyle(item);
        if (uniqueStyle) {
          uniqueStyleStr = isSelected
            ? `background: ${uniqueStyle.bg}; border: 1.5px solid ${nameColor}; box-shadow: inset 0 0 10px ${nameColor}55, 0 0 14px ${nameColor}33;`
            : `background: ${uniqueStyle.bg}; border: 1.5px solid ${uniqueStyle.border}; box-shadow: inset 0 0 6px ${uniqueStyle.shadow}, 0 0 8px ${uniqueStyle.glow};`;
        }
        let finalStyle = uniqueStyleStr
          ? uniqueStyleStr
          : `border: 1.5px solid ${itemBorderColor}; border-left: 4px solid ${nameColor} !important; ${itemBg}`;
        let inlineStyle = `style="${finalStyle} display: flex; align-items: center; padding: 6px 10px; margin-bottom: 6px; border-radius: 6px; cursor: pointer; transition: all 0.18s ease-in-out;"`;

        let eqBadge = item.isEquippedSlot
          ? `<span style="background:#c0392b; color:white; padding:1px 3px; border-radius:2px; font-size:8px; font-weight:bold; margin-right:4px;">EQ</span> `
          : "";
        let rarityLabel = isArt ? "UNIQUE" : `${item.statsRolled}★`;
        let iconBox = `<div style="margin-right:8px; display:inline-flex; align-items:center; flex-shrink:0;">${window.getEquipIconHtml(item, 28)}</div>`;

        // Configured onpointerdown as the primary selector to bypass mobile click-swallows
        return `<div class="bag-item-forge" ${inlineStyle} onpointerdown="window.selectForgeItem(${item.id}); window.showForgeTooltip(event, ${item.id});" onmouseenter="window.showForgeTooltip(event, ${item.id})" onmouseleave="window.hideTooltip()" onclick="window.selectForgeItem(${item.id})">
                            ${iconBox}
                            <div style="flex:1; min-width:0; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; margin-bottom:1px;">
                        <span style="font-weight:bold; color:${nameColor}; font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${item.name}${temperTag}</span>
                        ${lockTag ? `<span style="font-size:9.5px;">${lockTag}</span>` : ""}
                    </div>
                    <div style="font-size:9.5px; color:#aaa; display:flex; align-items:center; gap:4px; font-family:monospace; line-height:1;">
                        ${eqBadge}
                        <span>${item.type.toUpperCase()} • ${rarityLabel}</span>
                    </div>
                </div>
            </div>`;
      })
      .join("");
  }

  // Context-Aware Instructions Revamp
  if (
    !window.forgeSelectedItem ||
    ((window.forgeMode === "reforge" ||
      window.forgeMode === "tier" ||
      window.forgeMode === "enchant" ||
      window.forgeMode === "reset_enchant" ||
      window.forgeMode === "set") &&
      window.forgeSelectedItem.type === "artifact") ||
    (window.forgeMode === "shatter" &&
      !window.isItemUnique(window.forgeSelectedItem))
  ) {
    let mode = window.forgeMode || "temper";

    // 1. Hand-Drawn Warning Vector Icon (No emojis)
    let warningIconSvg = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      `;

    // 2. Build Ineligible Item Warning Banners
    let warningHtml = "";
    if (window.forgeSelectedItem) {
      if (window.forgeSelectedItem.type === "artifact") {
        warningHtml = `
            <div style="background:rgba(231,76,60,0.06); border:1.5px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; text-align:center; color:#ff7675; line-height:1.4; white-space:normal; display:flex; align-items:center; justify-content:center; gap:4px;">
              <div>
                ${warningIconSvg} <b>INELIGIBLE ITEM:</b> Unique Artifacts cannot be modified in <b>${mode.toUpperCase().replace("_", " ")}</b> mode! Select a standard weapon or armor piece.
              </div>
            </div>
          `;
      } else if (
        mode === "shatter" &&
        !window.isItemUnique(window.forgeSelectedItem)
      ) {
        warningHtml = `
            <div style="background:rgba(231,76,60,0.06); border:1.5px dashed #e74c3c; border-radius:6px; padding:10px; margin-bottom:12px; font-size:11px; text-align:center; color:#ff7675; line-height:1.4; white-space:normal; display:flex; align-items:center; justify-content:center; gap:4px;">
              <div>
                ${warningIconSvg} <b>INELIGIBLE ITEM:</b> Only Unique equipment can be shattered into the Codex! Select a Unique Weapon, Subweapon, or Armor piece.
              </div>
            </div>
          `;
      }
    }

    // 3. Mini Vector Icons for Mode Headers (No emojis)
    let attunementHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>`;
    let reforgeHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>`;
    let tierHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e67e22" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" /></svg>`;
    let setHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>`;
    let enchantHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9b59b6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>`;
    let resetHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><path d="M12 2v20M17 5l-5-5-5 5" /></svg>`;
    let shatterHeaderSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);"><polygon points="12,2 22,12 12,22 2,12" /></svg>`;

    // 4. Map Dynamic Tutorial Metadata per active mode
    let tutorials = {
      temper: {
        title: "Slot Attunement",
        desc: "Attuning a gear slot permanently multiplies the stats of any item equipped in that slot. This multiplier is bound to the slot itself and persists across item swaps and prestige resets!",
        icon: attunementHeaderSvg,
        color: "#9b59b6",
        steps: [
          "Select a target equipment slot from the list on the right.",
          "Check the Gold and Material requirements below.",
          "Click 'Harness Heat' to upgrade the slot level (+1% stats per level).",
        ],
        tip: "Highly attuned slots (e.g. Lv. 50+) make even common items extremely powerful!",
      },
      reforge: {
        title: "Attribute Reforger",
        desc: "Re-roll individual affix modifiers on your equipment to customize your stats. Perfect for tuning Crit, Block, or Speed.",
        icon: reforgeHeaderSvg,
        color: "#8e44ad",
        steps: [
          "Select a piece of equipment from the list on the right.",
          "Choose the specific modifier line you wish to re-roll.",
          "Click 'Execute Reforge' to spin for a new random modifier.",
        ],
        tip: "Once you reforge a line, all other lines on that item become permanently locked! Reforging requires 1x <b>Overlord's Sigil</b> and Gold.",
      },
      tier: {
        title: "Star Quality Awakening",
        desc: "Ascend the star quality (0★ to 5★) of your weapons and armor. Increasing rarity unlocks new slots for random bonus modifiers.",
        icon: tierHeaderSvg,
        color: "#e67e22",
        steps: [
          "Select an under-5★ item from the list on the right.",
          "Gather the required Eridium Shards and tier-matching scraps.",
          "Click 'Awaken Rarity' to elevate its tier and unlock a new random stat line!",
        ],
        tip: "In addition to a new modifier, Tiering Up increases the item's base parameters by +10%!",
      },
      set: {
        title: "Set Resonance Matrix",
        desc: "Shift the named set affiliation (e.g. Vanguard, Colossus) on your gear to complete matching 2-piece and 3-piece set bonuses.",
        icon: setHeaderSvg,
        color: "#2ecc71",
        steps: [
          "Select any set-affinity equipment piece from the right.",
          "Ensure you have enough Monster Souls and Gold.",
          "Click 'Re-Resonate Set' to roll a different set bonus at random.",
        ],
        tip: "Equipping matching sets provides massive multipliers to Attack, Health, Defense, and Crit stats!",
      },
      enchant: {
        title: "Celestial Enchantment",
        desc: "Infuse powerful magical runes into high-tier attuned equipment. Enchanting targets an existing stat line at random and amplifies its value by a whopping +25%!",
        icon: enchantHeaderSvg,
        color: "#9b59b6",
        steps: [
          "Select a 2★+ item equipped in a slot attuned to at least Level 50.",
          "Ensure you have 1x <b>Overlord's Sigil</b> available.",
          "Click 'Infuse Enchantment' to roll a +25% boost on one of its stats.",
        ],
        tip: "Magic (2★) holds 1, Epic (3★) holds 2, Legendary (4★) holds 3, and Mythic (5★) holds 4 maximum enchantments.",
      },
      reset_enchant: {
        title: "Arcane Purge",
        desc: "Dispel and clear active enchantments from an item, restoring its stats to their original pre-enchanted baseline so you can re-enchant.",
        icon: resetHeaderSvg,
        color: "#c0392b",
        steps: [
          "Select an enchanted item from the list on the right.",
          "Review the Gold cost required to purge the magical seals.",
          "Click 'Purge Enchantments' to safely wipe the runes.",
        ],
        tip: "Resetting enchantments frees up all slots, but spent materials are non-refundable.",
      },
      shatter: {
        title: "Spectral Shatter",
        desc: "Sacrifice unequipped Unique weapons or armor to permanently unlock their active passive effects inside your Spectral Codex!",
        icon: shatterHeaderSvg,
        color: "#e74c3c",
        steps: [
          "Select an unequipped Unique item from the list on the right.",
          "Check the high-end material and Gold costs below.",
          "Click 'Shatter Unique Essence' to extract its passive into your permanent Codex.",
        ],
        tip: "Unlocking a passive inside the Codex allows you to activate its unique modifiers without needing to equip the item!",
      },
    };

    let tut = tutorials[mode] || tutorials.temper;

    // 5. Retrieve Live Crafting Material Balances
    let goldOwned = window.playerStats.coins || 0;
    let mSouls = window.inventory.ETC["Monster Soul"] || 0;
    let lSouls = window.inventory.ETC["Luminous Soul"] || 0;
    let eridium = window.inventory.ETC["Eridium Shard"] || 0;
    let essence = window.inventory.ETC["Astral Essence"] || 0;
    let sigils = window.inventory.ETC["Overlord's Sigil"] || 0;
    let cores = window.inventory.ETC["Catalyst Core"] || 0;

    let rareScrap = window.inventory.ETC["Rare Scrap"] || 0;
    let magicScrap = window.inventory.ETC["Magic Scrap"] || 0;
    let epicScrap = window.inventory.ETC["Epic Scrap"] || 0;
    let legendaryScrap = window.inventory.ETC["Legendary Scrap"] || 0;
    let mythicScrap = window.inventory.ETC["Mythic Scrap"] || 0;

    // 6. Draw Crisp 12px Miniature Vector Icons for Materials Grid (No emojis)
    let goldSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><circle cx="6" cy="6" r="5" fill="#f1c40f" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="none" stroke="#b7950b" stroke-width="0.6"/></svg>`;
    let mSoulsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 C6 1.5, 2 6, 2 9 C2 11, 3.8 11.5, 6 11.5 C8.2 11.5, 10 11, 10 9 C10 6, 6 1.5, 6 1.5 Z" fill="#a0aec0" stroke="#000" stroke-width="0.8"/></svg>`;
    let lSoulsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 C6 1.5, 2 6, 2 9 C2 11, 3.8 11.5, 6 11.5 C8.2 11.5, 10 11, 10 9 C10 6, 6 1.5, 6 1.5 Z" fill="#ffb6c1" stroke="#000" stroke-width="0.8"/></svg>`;
    let eridiumSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="6,1 11,6 6,11 1,6" fill="#8e44ad" stroke="#000" stroke-width="0.8"/></svg>`;
    let essenceSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="6,1 8,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4,4.5" fill="#9b59b6" stroke="#000" stroke-width="0.8"/></svg>`;
    let sigilsSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M6 1.5 L9.5 5 L8 9 L6 11.5 L4 9 L2.5 5 Z" fill="#1abc9c" stroke="#000" stroke-width="0.8"/></svg>`;
    let coresSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><rect x="2.2" y="2.2" width="7.6" height="7.6" rx="1" fill="#2ecc71" stroke="#000" stroke-width="0.8"/><rect x="4.5" y="4.5" width="3" height="3" fill="#fff" stroke="#111" stroke-width="0.5"/></svg>`;
    let rareScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#3498db" stroke="#000" stroke-width="0.8"/></svg>`;
    let magicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#9b59b6" stroke="#000" stroke-width="0.8"/></svg>`;
    let epicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#e67e22" stroke="#000" stroke-width="0.8"/></svg>`;
    let legendaryScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#f1c40f" stroke="#000" stroke-width="0.8"/></svg>`;
    let mythicScrapSvg = `<svg width="12" height="12" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle; flex-shrink:0;"><polygon points="2,5 5,1 10,3 8,10 3,9" fill="#e74c3c" stroke="#000" stroke-width="0.8"/></svg>`;

    let materialsList = [
      {
        name: "Gold Coins",
        qty: goldOwned,
        color: "#f1c40f",
        isBigNum: true,
        svg: goldSvg,
      },
      { name: "Monster Souls", qty: mSouls, color: "#a0aec0", svg: mSoulsSvg },
      { name: "Luminous Souls", qty: lSouls, color: "#ffb6c1", svg: lSoulsSvg },
      {
        name: "Eridium Shards",
        qty: eridium,
        color: "#8e44ad",
        svg: eridiumSvg,
      },
      {
        name: "Astral Essence",
        qty: essence,
        color: "#9b59b6",
        svg: essenceSvg,
      },
      {
        name: "Overlord Sigils",
        qty: sigils,
        color: "#1abc9c",
        svg: sigilsSvg,
      },
      { name: "Catalyst Cores", qty: cores, color: "#2ecc71", svg: coresSvg },
      {
        name: "Rare Scraps",
        qty: rareScrap,
        color: "#3498db",
        svg: rareScrapSvg,
      },
      {
        name: "Magic Scraps",
        qty: magicScrap,
        color: "#9b59b6",
        svg: magicScrapSvg,
      },
      {
        name: "Epic Scraps",
        qty: epicScrap,
        color: "#e67e22",
        svg: epicScrapSvg,
      },
      {
        name: "Legendary Scraps",
        qty: legendaryScrap,
        color: "#f1c40f",
        svg: legendaryScrapSvg,
      },
      {
        name: "Mythic Scraps",
        qty: mythicScrap,
        color: "#e74c3c",
        svg: mythicScrapSvg,
      },
    ];

    // Build the non-wrapping responsive inventory grid (fading unowned slots to opacity 0.35)
    let matGridHtml = `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; font-family:monospace; font-size:10px; text-align:left;">`;
    materialsList.forEach((m) => {
      let countText = m.isBigNum
        ? window.formatNumber(m.qty)
        : m.qty.toLocaleString();
      let hasItem = m.isBigNum ? BigNum.from(m.qty).gt(0) : m.qty > 0;
      let textColor = hasItem ? "#f1f5f9" : "#444";
      let qtyColor = hasItem ? m.color : "#444";
      let opacity = hasItem ? "1.0" : "0.35";

      matGridHtml += `
          <div style="background:rgba(0,0,0,0.45); border:1px solid #222; border-radius:4px; padding:3px 6px; display:flex; justify-content:space-between; align-items:center; opacity:${opacity}; min-width:0; box-sizing:border-box;">
            <div style="display:flex; align-items:center; gap:4px; min-width:0; flex:1;">
              ${m.svg}
              <span style="color:${textColor}; font-size:8.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; flex:1;">${m.name}</span>
            </div>
            <strong style="color:${qtyColor}; font-size:9px; font-family:monospace; margin-left:4px; flex-shrink:0;">${countText}</strong>
          </div>
        `;
    });
    matGridHtml += `</div>`;

    // Mini Tag / Label Vector for the Materials Header (No emojis)
    let headerIconSvg = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px; transform:translateY(-1px);">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      `;

    // 7. Assemble the Revamped Left Info Panel
    detailEl.innerHTML = `
        <div style="display:flex; flex-direction:column; text-align:left; gap:10px; animation: toastFadeIn 0.25s ease-out;">
            ${warningHtml}

            <div>
                <div style="font-weight:bold; font-size:14px; color:${tut.color}; border-bottom:1.5px solid #222; padding-bottom:6px; margin-bottom:8px; display:flex; align-items:center; gap:6px; text-transform:uppercase; letter-spacing:0.5px;">
                    <span>${tut.icon} ${tut.title}</span>
                </div>
                <p style="font-size:11px; color:#cbd5e1; line-height:1.45; margin:0 0 10px 0; white-space:normal;">
                    ${tut.desc}
                </p>
            </div>

            <!-- Dynamic Step-by-Step Instructions -->
            <div style="background:rgba(0,0,0,0.22); border:1px solid #222; border-radius:6px; padding:10px;">
                <strong style="color:#df9ffb; font-size:9.5px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📋 Forging Instructions:</strong>
                <div style="display:flex; flex-direction:column; gap:4px; font-size:10.5px; color:#aaa; line-height:1.35;">
                    ${tut.steps.map((step, idx) => `<div>${idx + 1}. ${step}</div>`).join("")}
                </div>
            </div>

            <!-- Mode Highlight Tip -->
            <div style="border-left:3px solid ${tut.color}; background:rgba(255,255,255,0.01); padding:6px 10px; border-radius:0 4px 4px 0; font-size:10.5px; color:#e2e8f0; line-height:1.4; white-space:normal; margin-bottom:4px;">
                <b>TIP:</b> ${tut.tip}
            </div>

            <!-- Materials Inventory -->
            <div style="border-top:1px dashed #333; padding-top:10px; margin-top:4px;">
                <strong style="color:#ffd700; font-size:9.5px; display:block; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${headerIconSvg} MATERIALS INVENTORY:</strong>
                ${matGridHtml}
            </div>
        </div>
      `;
    return;
  }

  let item = window.forgeSelectedItem;
  let titleColor = window.getTierColor(item.statsRolled);
  let temperTag =
    item.temperLevel > 0
      ? ` <span style="color:#2ecc71;">[+${item.temperLevel}]</span>`
      : "";
  let html = `<div style="font-weight:bold; font-size:13px; color:${titleColor}; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px;">${item.name}${temperTag}</div>`;

  let previewHtml = "";
  let previewItem = JSON.parse(JSON.stringify(item));

  if (window.forgeMode === "shatter") {
    let uniqueKey = window.getUniqueKey(item);
    let isUnlocked = window.playerStats.spectralCodex.includes(uniqueKey);

    let costGold = 1000000000; // 1 Billion Gold
    let costShards = 250;
    let costCores = 5;
    let costEridium = 5;

    let playerShards = window.playerStats.astralShards || 0;
    let playerCores = window.inventory.ETC["Catalyst Core"] || 0;
    let playerEridium = window.inventory.ETC["Eridium Shard"] || 0;
    let playerGold = BigNum.from(window.playerStats.coins);

    let goldColor = playerGold.gte(costGold) ? "#2ecc71" : "#e74c3c";
    let shardsColor = playerShards >= costShards ? "#9b59b6" : "#e74c3c";
    let coresColor = playerCores >= costCores ? "#2ecc71" : "#e74c3c";
    let eridiumColor = playerEridium >= costEridium ? "#8e44ad" : "#e74c3c";

    let canAfford =
      playerGold.gte(costGold) &&
      playerShards >= costShards &&
      playerCores >= costCores &&
      playerEridium >= costEridium;

    html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa; text-align:left;">Codex Status: ${isUnlocked ? `<span style="color:#2ecc71; font-weight:bold;">UNLOCKED ✓</span>` : `<span style="color:#e74c3c; font-weight:bold;">LOCKED 🔒</span>`}</div>`;

    html += `<div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.3); border:1px solid #222; padding:8px; border-radius:6px; font-size:11px; line-height:1.45; margin-bottom:12px;">
        <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:4px; text-transform:uppercase; font-size:9.5px;">⚡ SPECTRAL SHATTER RECIPE:</strong>
        <div style="color:${goldColor};">• ${window.formatNumber(costGold)} Gold (Owned: ${window.formatNumber(playerGold)})</div>
        <div style="color:${shardsColor};">• ${costShards}x Astral Shards (Owned: ${playerShards})</div>
        <div style="color:${coresColor};">• ${costCores}x Catalyst Core (Owned: ${playerCores})</div>
        <div style="color:${eridiumColor};">• ${costEridium}x Eridium Shard (Owned: ${playerEridium})</div>
      </div>`;

    if (isUnlocked) {
      html += `<div style="color:#2ecc71; font-weight:bold; text-align:center; padding:10px; font-size:11px; border:1px dashed #2ecc71; background:rgba(46,204,113,0.05); border-radius:4px; margin-bottom:12px;">✓ This Unique's passive effect is already active inside your permanent Spectral Codex!</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#222; background:#333; color:#666;" disabled>Already Unlocked</button>`;
    } else {
      html += `<div style="color:#f1c40f; font-size:10px; line-height:1.4; text-align:left; background:rgba(241,196,15,0.05); border:1px dashed #f1c40f; padding:8px; border-radius:4px; margin-bottom:12px;">
          💡 <strong>ASTRAL EXTRACTION ACTIVE:</strong><br>
          This process permanently shatters and destroys the physical item to unlock its passive. You will receive its standard salvage payload of <b>1 to 2x Astral Essences</b> as a bonus!
        </div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background:linear-gradient(135deg, #c0392b, #4a154b);" ${canAfford ? "" : "disabled"} onclick="window.executeSpectralShatter(${item.id})">✦ Shatter Unique Essence</button>`;
    }
  } else if (window.forgeMode === "temper") {
    let maxT = window.getMaxTemper(
      window.forgeSelectedItem.statsRolled,
      window.forgeSelectedItem.type,
    );
    if (item.temperLevel >= maxT) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0;">MAXIMUM TEMPER LIMIT REACHED</div>`;
    } else {
      let costGold = window.getTemperGoldCost(item);
      let scrapReqAmount = window.getRequiredScrapAmountForTemper(item);
      let scrapReq = window.getRequiredScrapForTemper(item);
      let failChance = item.temperLevel * 5;
      let playerScrap = window.inventory.ETC[scrapReq] || 0;
      let goldColor =
        window.playerStats.coins >= costGold ? "#f1c40f" : "#e74c3c";
      let scrapColor = playerScrap >= scrapReqAmount ? "#bdc3c7" : "#e74c3c";

      previewItem.temperLevel++;
      window.recalculateItemStats(previewItem);

      // Fetch correctly generated item property comparative differences
      let diffLines = window.getForgeDiffLines(item, previewItem);

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Temper Cap: <span style="color:#fff;">${item.temperLevel} / ${maxT}</span></div>`;
      let pct = (item.temperLevel / maxT) * 100;
      html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%"></div></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
      html += `<div style="font-size:11px; color:${scrapColor}; margin-bottom:10px;">• ${scrapReqAmount.toLocaleString()}x ${scrapReq} (Owned: ${playerScrap.toLocaleString()})</div>`;
      html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ ${failChance}% Chance to Fail</div>`;
      html += `<button class="forge-anvil-button" style="width:100%;" ${window.playerStats.coins >= costGold && playerScrap >= scrapReqAmount ? "" : "disabled"} onclick="window.temperItem()">Harness Heat</button>`;

      previewHtml = `
                    <div style="margin-top:15px; padding:12px; background:#111; border:1px solid #3498db; border-radius:6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                        <div style="color:#3498db; font-weight:bold; font-size:11.5px; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">📈 Tempering Preview ([+${item.temperLevel}] ➔ [+${previewItem.temperLevel}])</div>
                        <div style="display:flex; flex-direction:column; gap:4px;">
                            ${diffLines || '<div style="color:#7f8c8d; font-style:italic; text-align:center; padding:10px;">No stat modifications.</div>'}
                        </div>
                    </div>
                `;
    }
  } else if (window.forgeMode === "reforge") {
    let bonusKeys = [
      "bonusAtk",
      "bonusMaxHp",
      "bonusDef",
      "bonusMoveSpeed",
      "bonusCritChance",
      "bonusCritDamage",
      "bonusBlock",
      "bonusParry",
      "bonusActiveSpeed",
      "bonusIdleSpeed",
      "bonusStr",
      "bonusDex",
      "bonusInt",
    ];
    let activeBonuses = bonusKeys.filter((k) => item[k] !== 0);

    if (activeBonuses.length === 0) {
      html += `<div style="color:#94a3b8; font-size:11px; text-align:center; padding:25px 10px; font-style:italic;">This item has no extra affix lines to reforge!</div>`;
    } else {
      let costGold = Math.floor(
        150 * item.stageLevel * Math.pow(2, item.statsRolled),
      );
      let ownedSigils =
        window.inventory && window.inventory.ETC
          ? window.inventory.ETC["Overlord's Sigil"] || 0
          : 0;

      let canAffordGold = BigNum.from(window.playerStats.coins).gte(costGold);
      let canAffordSigil = ownedSigils >= 1;

      let goldColor = canAffordGold ? "#34d399" : "#f87171";
      let sigilColor = canAffordSigil ? "#34d399" : "#f87171";

      if (!item.reforgedProperty) {
        html += `<div style="font-size:10.5px; color:#cbd5e1; margin-bottom:10px; text-align:left; line-height:1.4;">Select a modifier line below to prepare for reforging. <i>(Executing reforge will permanently lock all other lines!)</i></div>`;

        let affixButtonsHtml = activeBonuses
          .map((bKey) => {
            let isPct = [
              "bonusCritChance",
              "bonusCritDamage",
              "bonusBlock",
              "bonusParry",
              "bonusActiveSpeed",
              "bonusIdleSpeed",
            ].includes(bKey);
            let valText = isPct
              ? `${Math.round(item[bKey] * 100)}%`
              : item[bKey] > 0
                ? `+${item[bKey]}`
                : `${item[bKey]}`;

            let isSelected = item.tempReforgeProp === bKey;
            let borderCol = isSelected ? "#a855f7" : "#334155";
            let bgStyle = isSelected
              ? "background: rgba(168, 85, 247, 0.2);"
              : "background: rgba(15, 23, 42, 0.75);";

            let iconKey = bKey.replace("bonus", "");
            iconKey = iconKey.charAt(0).toLowerCase() + iconKey.slice(1);
            let iconSvg = window.getUiIconSvg
              ? window.getUiIconSvg(iconKey, 12)
              : "";

            let radioDot = isSelected
              ? `<span style="width:8px; height:8px; border-radius:50%; background:#a855f7; display:inline-block;"></span>`
              : `<span style="width:8px; height:8px; border-radius:50%; border:1px solid #64748b; display:inline-block;"></span>`;

            return `
              <div class="reforge-affix-option" style="border:1.5px solid ${borderCol}; ${bgStyle}" onclick="window.selectReforgeStat('${bKey}')">
                <div style="display:flex; align-items:center; gap:6px;">
                  ${radioDot}
                  ${iconSvg}
                  <span style="font-weight:bold; color:#f1f5f9; font-size:11px;">${window.getStatLabel(bKey)}</span>
                </div>
                <strong style="color:#a855f7; font-family:monospace; font-size:11px;">${valText}</strong>
              </div>
            `;
          })
          .join("");

        html += `<div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">${affixButtonsHtml}</div>`;

        if (item.tempReforgeProp) {
          let rProp = item.tempReforgeProp;

          html += `
              <div class="reforge-req-box">
                <strong style="color:#a855f7; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:9.5px; letter-spacing:0.5px;">REFORGE REQUIREMENTS:</strong>
                <div style="font-size:10.5px; color:${goldColor}; margin-bottom:3px; font-family:monospace;">• ${window.formatNumber(costGold)} Gold Required</div>
                <div style="font-size:10.5px; color:${sigilColor}; margin-bottom:6px; font-family:monospace;">• 1x Overlord's Sigil (Owned: ${ownedSigils.toLocaleString()})</div>
              </div>
              <button class="forge-anvil-button" style="width:100%; border-color:#a855f7; background:linear-gradient(135deg, #6b21a8, #3b0764);" ${canAffordGold && canAffordSigil ? "" : "disabled"} onclick="window.reforgeItemStat()">Execute Reforge on ${window.getStatLabel(rProp)}</button>
            `;
        }
      } else {
        let rProp = item.reforgedProperty;
        let isPct = [
          "bonusCritChance",
          "bonusCritDamage",
          "bonusBlock",
          "bonusParry",
          "bonusActiveSpeed",
          "bonusIdleSpeed",
        ].includes(rProp);
        let valText = isPct
          ? `${Math.round(item[rProp] * 100)}%`
          : item[rProp] > 0
            ? `+${item[rProp]}`
            : `${item[rProp]}`;

        html += `
            <div class="reforge-locked-banner">
              <span style="color:#a855f7; font-weight:900; font-size:10px; letter-spacing:0.5px; text-transform:uppercase; display:block; margin-bottom:4px;">REFORGIBLE SLOT (LOCKED):</span>
              <strong style="color:#34d399; font-size:12px; font-family:monospace;">${window.getStatLabel(rProp)} (${valText})</strong>
              <span style="font-size:8.5px; color:#94a3b8; display:block; margin-top:4px;">(All other affix lines on this item are permanently locked!)</span>
            </div>

            <div class="reforge-req-box">
              <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:9.5px; letter-spacing:0.5px;">RE-ROLL REQUIREMENTS:</strong>
              <div style="font-size:10.5px; color:${goldColor}; margin-bottom:3px; font-family:monospace;">• ${window.formatNumber(costGold)} Gold Required</div>
              <div style="font-size:10.5px; color:${sigilColor}; margin-bottom:6px; font-family:monospace;">• 1x Overlord's Sigil (Owned: ${ownedSigils.toLocaleString()})</div>
            </div>

            <button class="forge-anvil-button" style="width:100%; margin-top:10px; border-color:#a855f7; background:linear-gradient(135deg, #6b21a8, #3b0764);" ${canAffordGold && canAffordSigil ? "" : "disabled"} onclick="window.reforgeItemStat()">Re-Roll Locked Modifier</button>
          `;
      }
    }
  } else if (window.forgeMode === "tier") {
    if (item.statsRolled >= 5) {
      html += `<div style="color:#f87171; font-weight:900; text-align:center; padding:25px 10px; border:1px dashed #ef4444; background:rgba(239,68,68,0.1); border-radius:8px;">MAXIMUM STAR RARITY REACHED (5★ MYTHIC)</div>`;
    } else {
      let currentStars = item.statsRolled;
      let targetStars = currentStars + 1;
      let costGold = targetStars * 2500;
      let shardReq = targetStars;
      let scrapReqAmount = targetStars * 5;
      let targetScrapName = window.getScrapYieldName(targetStars);

      let playerShards =
        window.inventory && window.inventory.ETC
          ? window.inventory.ETC["Eridium Shard"] || 0
          : 0;
      let playerScraps =
        window.inventory && window.inventory.ETC
          ? window.inventory.ETC[targetScrapName] || 0
          : 0;

      let canAffordGold = BigNum.from(window.playerStats.coins).gte(costGold);
      let canAffordShards = playerShards >= shardReq;
      let canAffordScraps = playerScraps >= scrapReqAmount;

      let goldColor = canAffordGold ? "#34d399" : "#f87171";
      let shardColor = canAffordShards ? "#34d399" : "#f87171";
      let scrapColor = canAffordScraps ? "#34d399" : "#f87171";

      let curColor = window.getTierColor(currentStars);
      let nextColor = window.getTierColor(targetStars);

      previewItem.statsRolled++;
      window.scaleItemBonusStats(
        previewItem,
        currentStars,
        previewItem.statsRolled,
      );
      window.recalculateItemStats(previewItem);

      let diffLines = window.getForgeDiffLines(item, previewItem);

      html += `
            <div class="awaken-transition-card">
              <span class="awaken-star-badge" style="color:${curColor}; border-color:${curColor}; background:${curColor}15;">${currentStars}★ ${window.getTierName(currentStars)}</span>
              <span style="color:#f1c40f; font-weight:bold; font-size:12px;">➔</span>
              <span class="awaken-star-badge" style="color:${nextColor}; border-color:${nextColor}; background:${nextColor}15;">${targetStars}★ ${window.getTierName(targetStars)}</span>
            </div>

            <div style="margin-top:10px; text-align:left; background:rgba(0,0,0,0.35); border:1px solid #1e293b; padding:10px; border-radius:6px; margin-bottom:12px;">
              <strong style="color:#f97316; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:9.5px; letter-spacing:0.5px;">AWAKENING REQUIREMENTS:</strong>
              <div style="font-size:10.5px; color:${goldColor}; margin-bottom:3px; font-family:monospace;">• ${window.formatNumber(costGold)} Gold Required</div>
              <div style="font-size:10.5px; color:${shardColor}; margin-bottom:3px; font-family:monospace;">• ${shardReq}x Eridium Shard (Owned: ${playerShards})</div>
              <div style="font-size:10.5px; color:${scrapColor}; margin-bottom:6px; font-family:monospace;">• ${scrapReqAmount}x ${targetScrapName} (Owned: ${playerScraps})</div>
              <div style="font-size:9.5px; color:#34d399; font-weight:bold; font-family:monospace; border-top:1px dashed #334155; padding-top:4px;">✦ 100% Awakening Success Guaranteed</div>
            </div>

            <button class="forge-anvil-button" style="width:100%; border-color:#ea580c; background:linear-gradient(135deg, #ea580c, #7c2d12);" ${canAffordGold && canAffordShards && canAffordScraps ? "" : "disabled"} onclick="window.temperItem()">Awaken Rarity & Unlock Modifier</button>
          `;

      previewHtml = `
            <div class="awaken-preview-card">
              <div style="color:#f97316; font-weight:900; font-size:11px; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>
                <span>AWAKENING PREVIEW (${currentStars}★ ➔ ${targetStars}★)</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:4px;">
                ${diffLines || '<div style="color:#94a3b8; font-style:italic; text-align:center; padding:10px;">Base parameters scaling up.</div>'}
                <div style="margin-top:6px; padding:8px; background:rgba(234,88,12,0.12); border:1px dashed #f97316; border-radius:6px; font-size:9.5px; color:#f1f5f9; text-align:left; line-height:1.35;">
                  <strong style="color:#f97316; display:block; margin-bottom:2px;">✦ UNLOCKED PERK:</strong>
                  Permanently increases item base stats by +10% and immediately unlocks 1 new random affix modifier!
                </div>
              </div>
            </div>
          `;
    }
  } else if (window.forgeMode === "enchant") {
    let maxEnchants = window.getMaxEnchants(item);
    let currentEnchants = item.totalEnchants || 0;

    let slotKey = item.type === "subweapon" ? "subweapon" : item.type;
    let slotLevel =
      (window.playerStats.slotUpgrades &&
        window.playerStats.slotUpgrades[slotKey]) ||
      0;
    let isFullyTempered = slotLevel >= 50;

    if (maxEnchants === 0) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM QUALITY CANNOT HOLD ENCHANTMENTS.<br><br><span style="color:#aaa; font-weight:normal;">Only Magic (2★), Epic (3★), Legendary (4★), and Mythic (5★) items can hold enchantments.</span></div>`;
    } else if (!isFullyTempered) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">SLOT ATTUNEMENT LEVEL 50 REQUIRED<br><br><span style="color:#aaa; font-weight:normal;">Current Slot Attunement Level: [${slotLevel}/100]. Attune this slot to at least Level 50 before infusing cosmic enchantments.</span></div>`;
    } else if (currentEnchants >= maxEnchants) {
      html += `<div style="color:#e74c3c; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">MAXIMUM ENCHANTMENT LIMIT REACHED (${maxEnchants}/${maxEnchants})<br><br><span style="color:#aaa; font-weight:normal;">Reset this item's enchantments in "Reset Enchants" mode to enchant again.</span></div>`;
    } else {
      let playerSigil = window.inventory.ETC["Overlord's Sigil"] || 0;
      let sigilColor = playerSigil >= 1 ? "#2ecc71" : "#e74c3c";

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Enchantment Slots: <span style="color:#fff; font-weight:bold;">${currentEnchants} / ${maxEnchants}</span></div>`;
      let pct = (currentEnchants / maxEnchants) * 100;
      html += `<div class="forge-progress-bg"><div class="forge-progress-fill" style="width:${pct}%; background: linear-gradient(90deg, #9b59b6, #e84393);"></div></div>`;
      html += `<div style="font-size:11px; color:${sigilColor}; margin-bottom:15px;">• 1x Overlord's Sigil Required (Owned: ${playerSigil})</div>`;
      html += `<div style="font-size:11px; color:#9b59b6; font-weight:bold; margin-bottom:15px;">🔮 Randomly boosts one active parameter by +25%!</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#9b59b6; background: linear-gradient(135deg, #4a154b, #1a0221);" ${playerSigil >= 1 ? "" : "disabled"} onclick="window.enchantItem()">Infuse Enchantment</button>`;
    }
  } else if (window.forgeMode === "reset_enchant") {
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants === 0) {
      html += `<div style="color:#7f8c8d; font-weight:bold; text-align:center; padding: 20px 0; font-size:11px;">THIS ITEM HAS NO ACTIVE ENCHANTMENTS</div>`;
    } else {
      let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
      let goldColor = BigNum.from(window.playerStats.coins).gte(resetGoldCost)
        ? "#f1c40f"
        : "#e74c3c";

      html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Active Enchantments to Purge: <span style="color:#9b59b6; font-weight:bold;">${currentEnchants}</span></div>`;
      html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:15px;">• ${resetGoldCost.toLocaleString()} Gold Required (Owned: ${window.formatNumber(window.playerStats.coins)})</div>`;
      html += `<div style="font-size:11px; color:#e74c3c; font-weight:bold; margin-bottom:15px;">⚠️ Restores all enchanted parameters to their original pre-enchanted values. Material scraps are non-refundable.</div>`;
      html += `<button class="forge-anvil-button" style="width:100%; border-color:#e74c3c; background: linear-gradient(135deg, #c0392b, #111);" ${BigNum.from(window.playerStats.coins).gte(resetGoldCost) ? "" : "disabled"} onclick="window.resetItemEnchants()">Purge Enchantments</button>`;
    }
  } else if (window.forgeMode === "set") {
    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + item.statsRolled * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;

    let goldColor = BigNum.from(window.playerStats.coins).gte(costGold)
      ? "#f1c40f"
      : "#e74c3c";
    let soulsColor = ownedSouls >= soulCost ? "#bdc3c7" : "#e74c3c";

    html += `<div style="font-size:11px; margin-bottom:10px; color:#aaa;">Current Set Resonance: <span style="color:#2ecc71; font-weight:bold;">${item.setName || "None"}</span></div>`;
    html += `<div style="font-size:11px; color:${goldColor}; margin-bottom:3px;">• ${window.formatNumber(costGold)} Gold Required</div>`;
    html += `<div style="font-size:11px; color:${soulsColor}; margin-bottom:10px;">• ${soulCost}x Monster Soul (Owned: ${ownedSouls.toLocaleString()})</div>`;
    html += `<div style="font-size:11px; color:#2ecc71; font-weight:bold; margin-bottom:15px;">✨ Randomly rolls a different Set bonus!</div>`;
    html += `<button class="forge-anvil-button" style="width:100%; border-color:#2ecc71; background: linear-gradient(135deg, #1b2a1e, #111);" ${BigNum.from(window.playerStats.coins).gte(costGold) && ownedSouls >= soulCost ? "" : "disabled"} onclick="window.rerollItemSet()">Re-Resonate Set</button>`;

    previewHtml = `
                        <div style="margin-top:15px; padding:12px; background:#111; border:1px dashed #2ecc71; border-radius:6px;">
                            <div style="color:#2ecc71; font-weight:bold; font-size:11px; margin-bottom:6px; text-transform:uppercase;">✨ Set re-resonance Pool:</div>
                            <p style="font-size:10px; color:#aaa; margin-bottom:8px; line-height:1.4;">
                                Your item will abandon its current set affiliation and attune to one of these legendary set matrices at random:
                            </p>
                            <div style="font-size:9.5px; color:#fff; display:grid; grid-template-columns: 1fr 1fr; gap:4px; font-family:monospace; background:rgba(0,0,0,0.3); padding:8px; border-radius:4px; max-height:110px; overflow-y:auto;">
                                <div>🛡️ Vanguard (+Atk)</div>
                                <div>💖 Colossus (+HP)</div>
                                <div>🛡️ Bastion (+Def)</div>
                                <div>👟 Windrunner (+Spd)</div>
                                <div>✨ Wraith (+Crit%)</div>
                                <div>💥 Reaver (+CritDmg)</div>
                                <div>🧱 Dreadnought (+Block)</div>
                                <div>⚡ Duellist (+Parry)</div>
                                <div>🧠 Scholar (+INT)</div>
                                <div>💪 Berserker (+STR)</div>
                                <div>🎯 Scout (+DEX)</div>
                                <div>🍀 Fortune (+Gold/Drop)</div>
                                <div>🔮 Mystic (+Qly/INT)</div>
                                <div>🧪 Alchemist (+HP/Atk)</div>
                                <div>👑 Midas' Legacy (+Gold)</div>
                                <div>🧪 Biohazard (Poison)</div>
                                <div>⚔️ Warlord (Shatter)</div>
                                <div>🌌 Void-Touched (Frenzy)</div>
                            </div>
                        </div>
                    `;
  }

  if (
    window.forgeMode === "enchant" &&
    item.temperLevel >= window.getMaxTemper(item.statsRolled, item.type) &&
    item.totalEnchants < window.getMaxEnchants(item) &&
    window.getMaxEnchants(item) > 0
  ) {
    previewHtml = `<div style="margin-top:15px; padding:10px; background:#111; border:1px dashed #9b59b6; border-radius:4px; font-size:11px; color:#ccc; text-align:center;">
                    * Enchanting will permanently snapshot pre-enchant stats, then select 1 parameter at random to scale by <b>+25%</b>.
                </div>`;
  }

  detailEl.innerHTML = html + previewHtml;
};

// --- UNIQUE STYLE SYSTEM ---

// Append Unique Style System directly inside the ItemFactory namespace
Object.assign(window.ItemFactory, {
  getUniqueItemStyle(item) {
    if (!item) return null;
    let isUnique =
      item.isUniqueStaff ||
      item.isUniqueSword ||
      item.isUniqueSingularity ||
      item.isUniqueMaelstrom ||
      item.isUniqueAegis ||
      item.isUniqueWatch ||
      item.isUniqueChronicle ||
      item.isUniqueWarpCore ||
      item.isUniqueTempest;
    if (!isUnique) return null;

    let bg = "";
    let border = "";
    let shadow = "";
    let glow = "";
    let lore = "";

    if (item.isUniqueSword) {
      bg = "linear-gradient(135deg, #1f0303, #070000)";
      border = "#960018";
      shadow = "#5c000c";
      glow = "rgba(150,0,24,0.4)";
      lore = `"Forged in the veins of the first red dragon, this blade sings a silent, thirsty song. It does not merely cut flesh; it harvests the soul's very current."`;
    } else if (item.isUniqueStaff) {
      bg = "linear-gradient(135deg, #1c0e00, #070200)";
      border = "#e67e22";
      shadow = "#853c00";
      glow = "rgba(230,126,34,0.4)";
      lore = `"Born of a feather plucked from the solar phoenix, its core burns with the warmth of a thousand dying suns. Even in the deepest cold of the void, its fire never falters."`;
    } else if (item.isUniqueSingularity) {
      bg = "linear-gradient(135deg, #0d011a 0%, #1c0529 50%, #030008 100%)";
      border = "#8e44ad";
      shadow = "inset 0 0 12px #510a74, 0 0 15px rgba(232, 67, 147, 0.25)";
      glow = "rgba(142, 68, 173, 0.5)";
      lore = `"This colossal blade harbors the core of a collapsed dying star, pulling the surrounding space into a constant state of gravitational collapse."`;
    } else if (item.isUniqueMaelstrom) {
      bg = "linear-gradient(135deg, #031d0d, #010803)";
      border = "#2ecc71";
      shadow = "#145a32";
      glow = "rgba(46,204,113,0.4)";
      lore = `"Whispers of forgotten gales dance along its razor edge, gathering strength with every swing until the wind itself becomes a solid, cutting force."`;
    } else if (item.isUniqueAegis) {
      bg = "linear-gradient(135deg, #021a2c, #00080f)";
      border = "#3498db";
      shadow = "#1a5276";
      glow = "rgba(52,152,219,0.4)";
      lore = `"A shield constructed of hyper-dense matter harvested from the Event Horizon. It bends local gravity fields to completely arrest kinetic impacts."`;
    } else if (item.isUniqueWatch) {
      bg = "linear-gradient(135deg, #221c03, #0a0800)";
      border = "#f1c40f";
      shadow = "#7d6608";
      glow = "rgba(241,196,15,0.4)";
      lore = `"A complex clockwork matrix that acts as a localized anchor in time. It beats in harmony with your lifeline, stretching fractions of seconds."`;
    } else if (item.isUniqueChronicle) {
      bg = "linear-gradient(135deg, #1f1b0a, #0b0903)";
      border = "#f39c12";
      shadow = "#7e5109";
      glow = "rgba(243,156,18,0.4)";
      lore = `"An ancient, soul-bound lexicon recording every rise and fall of your past incarnations. To read its pages is to remember power long forgotten."`;
    } else if (item.isUniqueWarpCore) {
      bg = "linear-gradient(135deg, #001a1a, #000707)";
      border = "#1abc9c";
      shadow = "#0e6251";
      glow = "rgba(26,188,156,0.4)";
      lore = `"Fitted with micro-singularity thrusters that distort spatial geometry directly ahead of your stride, allowing you to cross landscapes in a single heartbeat."`;
    } else if (item.isUniqueTempest) {
      bg = "linear-gradient(135deg, #03212c, #000c0f)";
      border = "#00d2ff";
      shadow = "#005077";
      glow = "rgba(0,210,255,0.4)";
      lore = `"Stolen from the peaks of the Storm-Warden's spire, this circlet channels wild static friction, responding to bodily trauma with localized lightning strikes."`;
    }
    return { bg, border, shadow, glow, lore };
  },
});

// Legacy Compatibility Aliases to protect references
window.getUniqueItemStyle = (item) =>
  window.ItemFactory.getUniqueItemStyle(item);

// Append Item Generation and Procedural Naming inside ItemFactory
Object.assign(window.ItemFactory, {
  createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars = 0,
    allowedTraits = null,
  ) {
    let originalType = chosenType;
    if (
      chosenType === "shield" ||
      chosenType === "dagger" ||
      chosenType === "tome"
    ) {
      chosenType = "subweapon";
    }

    let item = {
      id: window.idCounter++,
      name: "",
      type: chosenType,
      statsRolled: statLinesCount,
      temperLevel: 0,
      stageLevel: stageScale,
      atk: 0,
      maxHp: 0,
      def: 0,
      moveSpeed: 0,
      critChance: 0,
      critDamage: 0,
      block: 0,
      parry: 0,
      dropRate: 0,
      quality: 0,
      goldMulti: 0,
      rareSpawn: 0,
      fairySpawn: 0,
      activeAttackSpeed: 0,
      idleAttackSpeed: 0,
      baseAtk: 0,
      baseMaxHp: 0,
      baseDef: 0,
      baseMoveSpeed: 0,
      baseBlock: 0,
      baseParry: 0,
      baseInt: 0,
      bonusAtk: 0,
      bonusMaxHp: 0,
      bonusDef: 0,
      bonusMoveSpeed: 0,
      bonusCritChance: 0,
      bonusCritDamage: 0,
      bonusBlock: 0,
      bonusParry: 0,
      bonusActiveSpeed: 0,
      bonusIdleSpeed: 0,
      bonusStr: 0,
      bonusDex: 0,
      bonusInt: 0,
      str: 0,
      dex: 0,
      int: 0,
      strPct: 0,
      dexPct: 0,
      intPct: 0,
      trait: null,
      desc: "",
      breakdown: "",
      noun: "",
      setName: null,
    };

    if (chosenType === "subweapon") {
      const subTypes = ["shield", "dagger", "tome"];
      item.subType =
        originalType === "subweapon"
          ? subTypes[Math.floor(Math.random() * subTypes.length)]
          : originalType;
    }

    if (chosenType !== "artifact") {
      let nounList = window.slotNouns[chosenType];
      if (chosenType === "subweapon") {
        nounList = window.slotNouns.subweapon[item.subType];
      }
      item.noun = nounList
        ? nounList[Math.floor(Math.random() * nounList.length)]
        : chosenType.toUpperCase();
    }

    if (chosenType === "ring") {
      // Procedurally assign a wildcard ring type based on its slot noun
      if (item.noun.includes("Signet")) item.subType = "signet";
      else if (item.noun.includes("Loop")) item.subType = "loop";
      else if (item.noun.includes("Band")) item.subType = "band";
      else item.subType = "seal";
    }

    let prestigeMult = 1.0;

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = window.getEffectiveStage(stageScale * 5);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    // Apply baseline attribute values matching slot configurations (Slot-Specific Base Stats)
    if (chosenType !== "artifact") {
      let baseRarityMult = window.getRarityMultiplier(statLinesCount);
      if (chosenType === "weapon") {
        item.baseAtk = Math.ceil(2.5 * repScale * baseRarityMult);
      } else if (chosenType === "chest" || chosenType === "overall") {
        let overallMult = chosenType === "overall" ? 1.8 : 1.0;
        item.baseDef = Math.ceil(1.5 * repScale * baseRarityMult * overallMult);
        item.baseMaxHp = Math.ceil(
          6.0 * repScale * baseRarityMult * overallMult,
        );
      } else if (chosenType === "helmet" || chosenType === "leggings") {
        item.baseDef = Math.ceil(0.7 * repScale * baseRarityMult);
        item.baseMaxHp = Math.ceil(3.0 * repScale * baseRarityMult);
      } else if (item.type === "boots") {
        item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);
        item.baseMoveSpeed = Math.ceil(1.0 * stageScale);
      } else if (item.type === "ring") {
        // Decoupled Wildcard Implicit Ring Generation - Supplemental, balanced linear scaling
        let flatRoll = Math.random();
        if (flatRoll < 0.33) {
          item.implicitType = "atk";
          item.baseAtk = Math.ceil(0.6 * repScale * baseRarityMult);
        } else if (flatRoll < 0.66) {
          item.implicitType = "maxHp";
          item.baseMaxHp = Math.ceil(1.5 * repScale * baseRarityMult);
        } else {
          item.implicitType = "def";
          item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);
        }

        let pctRoll = Math.random();
        let scaleFactor = Math.pow(stageScale, 0.8);
        if (pctRoll < 0.16) {
          item.atkPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.32) {
          item.maxHpPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.48) {
          item.defPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.64) {
          item.strPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else if (pctRoll < 0.8) {
          item.dexPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        } else {
          item.intPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        }
      } else if (item.type === "subweapon") {
        // Standard subweapon base stats are computed dynamically during recalculation.
      }
    }

    if (chosenType === "sigil") {
      let stars = statLinesCount;
      let rewardMult = 0.1 + stars * 0.15;
      let qlyBoost = stars >= 3 ? (stars - 2) * 0.1 : 0.0;

      let buffsCount = Math.max(1, Math.min(3, Math.floor(stars / 2) + 1));
      let availableBuffs = [...(window.CAVERN_BUFFS || [])];
      let selectedBuffs = [];
      for (let i = 0; i < buffsCount && availableBuffs.length > 0; i++) {
        let randIdx = Math.floor(Math.random() * availableBuffs.length);
        selectedBuffs.push(availableBuffs.splice(randIdx, 1)[0]);
      }

      let debuffsCount = Math.max(1, Math.min(3, Math.floor(stars / 2) + 1));
      let availableDebuffs = [...(window.CAVERN_DEBUFFS || [])];
      let selectedDebuffs = [];
      for (let i = 0; i < debuffsCount && availableDebuffs.length > 0; i++) {
        let randIdx = Math.floor(Math.random() * availableDebuffs.length);
        selectedDebuffs.push(availableDebuffs.splice(randIdx, 1)[0]);
      }

      item.name = `Cavern Sigil (Lv. ${stageScale})`;
      item.statsRolled = stars;
      item.buffs = selectedBuffs;
      item.debuffs = selectedDebuffs;
      item.rewardMultiplier = rewardMult;
      item.qualityBoost = qlyBoost;
      return item;
    }

    if (chosenType === "artifact") {
      let filterPool = window.ARTIFACT_POOL;
      if (allowedTraits && allowedTraits.length > 0) {
        filterPool = window.ARTIFACT_POOL.filter((a) =>
          allowedTraits.includes(a.trait),
        );
        if (filterPool.length === 0) filterPool = window.ARTIFACT_POOL;
      }
      let chosenArt = filterPool[Math.floor(Math.random() * filterPool.length)];
      item.name = `${chosenArt.name} (Lv. ${stageScale})`;
      item.trait = chosenArt.trait;
      item.desc = chosenArt.desc;
      item.breakdown = chosenArt.breakdown;
      item.statsRolled = "UNIQUE";
      item.baseAtk = chosenArt.atk || 0;
      item.baseMaxHp = chosenArt.maxHp || 0;
      item.baseDef = chosenArt.def || 0;
      item.baseMoveSpeed = chosenArt.moveSpeed || 0;
      item.baseCritChance = chosenArt.critChance || 0;
      item.bonusCritDamage = chosenArt.critDamage || 0;
      item.baseBlock = chosenArt.block || 0;
      item.baseParry = chosenArt.parry || 0;
      item.bonusActiveSpeed = chosenArt.activeAttackSpeed || 0;
      item.bonusIdleSpeed = chosenArt.idleAttackSpeed || 0;
      item.dropRate = chosenArt.dropRate || 0;
      item.quality = chosenArt.quality || 0;
      item.goldMulti = chosenArt.goldMulti || 0;
      item.rareSpawn = chosenArt.rareSpawn || 0;
      item.fairySpawn = chosenArt.fairySpawn || 0;
      item.baseStr = chosenArt.str || 0;
      item.baseDex = chosenArt.dex || 0;
      item.baseInt = chosenArt.int || 0;
      statLinesCount = 3;
    }

    // Determine target pool configuration matching this slot type (Slot-Specific Pools)
    let pool = [];
    if (chosenType === "artifact") {
      pool = [
        "dropRate",
        "quality",
        "goldMulti",
        "rareSpawn",
        "fairySpawn",
        "str",
        "dex",
        "int",
      ];
    } else if (chosenType === "weapon") {
      pool = ["critChance", "critDamage", "activeSpd", "idleSpd"];
    } else if (chosenType === "chest" || chosenType === "overall") {
      pool = ["maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "helmet") {
      pool = ["critChance", "activeSpd", "idleSpd"];
    } else if (chosenType === "leggings") {
      pool = ["maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "boots") {
      pool = ["moveSpeed", "idleSpd", "activeSpd"];
    } else if (chosenType === "ring") {
      // Rings act as the dedicated Flat Base Suffix Engine (restricted strictly to flat rolls)
      pool = ["atk", "maxHp", "def", "str", "dex", "int"];
    } else if (chosenType === "subweapon") {
      if (item.subType === "shield") pool = ["block", "moveSpeed"];
      else if (item.subType === "dagger")
        pool = ["parry", "critChance", "moveSpeed"];
      else if (item.subType === "tome")
        pool = ["critDamage", "activeSpd", "idleSpd", "critChance"];
    }

    pool.sort(() => Math.random() - 0.5);
    // Differentiate flat stats (exponentially scaled) from percentage stats (mildly scaled) to prevent breaking caps
    let rarityMult =
      chosenType === "artifact"
        ? 1.45
        : window.getRarityMultiplier(statLinesCount);
    let pctRarityMult =
      chosenType === "artifact" ? 1.45 : 1 + statLinesCount * 0.15;
    if (chosenType === "overall") {
      rarityMult *= 1.8;
      pctRarityMult *= 1.8;
    }
    let actualStatLines = chosenType === "artifact" ? 3 : statLinesCount;

    for (let i = 0; i < actualStatLines; i++) {
      if (pool.length === 0) break;
      let selectedStat = pool.pop();
      let expBase = expScale; // Controlled exponential base aligned with stage scale * 5

      if (selectedStat === "atk") {
        item.bonusAtk += Math.ceil(
          window.randFloat(0.04, 0.08) * expBase * rarityMult,
        );
      } else if (selectedStat === "maxHp") {
        item.bonusMaxHp += Math.ceil(
          window.randFloat(0.12, 0.24) * expBase * rarityMult,
        );
      } else if (selectedStat === "def") {
        item.bonusDef += Math.ceil(
          window.randFloat(0.04, 0.08) * expBase * rarityMult,
        );
      } else if (selectedStat === "moveSpeed") {
        item.bonusMoveSpeed += Math.ceil(
          window.randInt(1, 2) * stageScale * pctRarityMult * prestigeMult,
        );
      } else if (selectedStat === "critChance") {
        let rolled =
          window.randFloat(0.01, 0.025) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusCritChance += parseFloat(Math.min(0.2, rolled).toFixed(4));
      } else if (selectedStat === "critDamage") {
        let rolled =
          window.randFloat(0.03, 0.06) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusCritDamage += parseFloat(rolled.toFixed(4));
      } else if (selectedStat === "block") {
        let rolled =
          window.randFloat(0.005, 0.015) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
      } else if (selectedStat === "parry") {
        let rolled =
          window.randFloat(0.005, 0.015) *
          Math.sqrt(stageScale) *
          pctRarityMult *
          prestigeMult;
        item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
      } else if (selectedStat === "activeSpd") {
        let sScale = Math.pow(stageScale, 0.3);
        let rMult = 1 + statLinesCount * 0.08;
        let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        item.bonusActiveSpeed += parseFloat(
          (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
        );
      } else if (selectedStat === "idleSpd") {
        let sScale = Math.pow(stageScale, 0.3);
        let rMult = 1 + statLinesCount * 0.08;
        let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
        item.bonusIdleSpeed += parseFloat(
          (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
        );
      } else if (selectedStat === "str") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusStr += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "dex") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusDex += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "int") {
        let flatStatRarityMult = 1 + statLinesCount * 0.25;
        item.bonusInt += Math.ceil(
          window.randInt(1, 3) *
            Math.pow(stageScale, 1.1) *
            flatStatRarityMult *
            prestigeMult,
        );
      } else if (selectedStat === "dropRate") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.dropRate += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "quality") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.quality += parseFloat(
          (
            window.randFloat(0.01, 0.03) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "goldMulti") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.goldMulti += parseFloat(
          (
            window.randFloat(0.02, 0.05) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "rareSpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.rareSpawn += parseFloat(
          (
            window.randFloat(0.002, 0.006) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      } else if (selectedStat === "fairySpawn") {
        let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageScale) - 1) * 0.12;
        item.fairySpawn += parseFloat(
          (
            window.randFloat(0.02, 0.06) *
            pctRarityMult *
            prestigeMult *
            utilityScale
          ).toFixed(4),
        );
      }
    }

    item.atk = (item.baseAtk || 0) + item.bonusAtk;
    item.maxHp = (item.baseMaxHp || 0) + item.bonusMaxHp;
    item.def = (item.baseDef || 0) + item.bonusDef;
    item.moveSpeed = (item.baseMoveSpeed || 0) + item.bonusMoveSpeed;
    item.critChance = (item.baseCritChance || 0) + item.bonusCritChance;
    item.critDamage = (item.baseCritDamage || 0) + item.bonusCritDamage;
    item.block = (item.baseBlock || 0) + item.bonusBlock;
    item.parry = (item.baseParry || 0) + item.bonusParry;
    item.str = (item.baseStr || 0) + item.bonusStr;
    item.dex = (item.baseDex || 0) + item.bonusDex;
    item.int = (item.baseInt || 0) + item.bonusInt;
    item.activeAttackSpeed = item.bonusActiveSpeed;
    item.idleAttackSpeed = item.bonusIdleSpeed;

    // Initialize pristine unmutated baseline values for exact scaling
    item.rawBaseAtk = item.baseAtk || 0;
    item.rawBaseDef = item.baseDef || 0;
    item.rawBaseMaxHp = item.baseMaxHp || 0;
    item.rawBaseInt = item.baseInt || 0;
    item.rawBaseMoveSpeed = item.baseMoveSpeed || 0;
    item.rawBaseBlock = item.baseBlock || 0;
    item.rawBaseParry = item.baseParry || 0;

    item.baseGoldMulti = item.goldMulti || 0;
    item.baseDropRate = item.dropRate || 0;
    item.baseQuality = item.quality || 0;
    item.baseRareSpawn = item.rareSpawn || 0;
    item.baseFairySpawn = item.fairySpawn || 0;

    if (chosenType !== "artifact") {
      let isDungeon = window.playerStats.isDungeonMode;
      let isBoss =
        window.playerStats.isBossMode || window.playerStats.isUberBoss;
      let isRare = window.mob ? !!window.mob.isRare : false;
      item.setName = window.rollSetForItem(
        isBoss,
        isRare,
        isDungeon,
        window.playerStats.currentDungeon,
      );
    }

    if (statLinesCount === 5 && chosenType !== "artifact") {
      if (Math.random() < 0.005) {
        if (chosenType === "weapon") {
          let weapons = ["staff", "sword", "singularity", "maelstrom"];
          let selected = weapons[Math.floor(Math.random() * weapons.length)];
          item.setName = null;
          if (selected === "staff") {
            item.isUniqueStaff = true;
            item.noun = "Phoenix Staff";
            item.name = `Phoenix Ignition Staff (Lv. ${stageScale})`;
            item.desc =
              "Launches penetrating fireballs that deal 25% Attack damage (3s Cooldown).";
          } else if (selected === "sword") {
            item.isUniqueSword = true;
            item.noun = "Sanguine Reaver";
            item.name = `Crimson Sanguine Reaver (Lv. ${stageScale})`;
            item.desc =
              "Strikes apply stacking Bleed (Max 5). Strikes at max stacks triggers Rupture, dealing 300% weapon damage and siphoning 10% Max HP.";
          } else if (selected === "singularity") {
            item.isUniqueSingularity = true;
            item.noun = "Singularity Greatsword";
            item.name = `Void-Sovereign Greatsword (Lv. ${stageScale})`;
            item.desc =
              "Glows for 7s every 30s. Tap during window to enter 5s Storing state, then detonates spatial collapse.";
          } else if (selected === "maelstrom") {
            item.isUniqueMaelstrom = true;
            item.noun = "Maelstrom Glaive";
            item.name = `Maelstrom Gale-Glaive (Lv. ${stageScale})`;
            item.desc =
              "Critical strikes project piercing wind gales. Casting gales grants +10% Active & Idle Attack Speed for 6s (stacks up to 3x).";
          }
        } else if (chosenType === "subweapon") {
          let subOptions = ["aegis", "watch", "chronicle"];
          if (item.subType === "dagger") {
            subOptions = ["viper"];
          } else if (item.subType === "shield") {
            subOptions = ["aegis"];
          } else if (item.subType === "tome") {
            subOptions = ["watch", "chronicle", "conduit"];
          }
          let selected =
            subOptions[Math.floor(Math.random() * subOptions.length)];
          item.setName = null;
          if (selected === "aegis") {
            item.subType = "shield";
            item.isUniqueAegis = true;
            item.noun = "Void-Warped Aegis";
            item.name = `Void-Warped Bulwark (Lv. ${stageScale})`;
            item.desc =
              "Blocks trigger gravity blasts scaling with Defense. Can be absorbed into Singularity vortex.";
          } else if (selected === "watch") {
            item.subType = "tome";
            item.isUniqueWatch = true;
            item.noun = "Chronos Pocket-Watch";
            item.name = `Chronos Dial-Watch (Lv. ${stageScale})`;
            item.desc =
              "Triggers 4s Temporal Fracture every 20s. Accelerates attack speeds by 15% and slows enemies by 25%.";
          } else if (selected === "chronicle") {
            item.subType = "tome";
            item.isUniqueChronicle = true;
            item.noun = "Chronicle of the Ascended";
            item.name = `Chronicle of Past Lives (Lv. ${stageScale})`;
            item.desc =
              "Boosts XP gain by +200% and bypasses level locks while below 75% peak level.";
          } else if (selected === "conduit") {
            item.subType = "tome";
            item.isUniqueConduit = true;
            item.noun = "Conduit Lexicon";
            item.name = `Conduit of the Lexicon (Lv. ${stageScale})`;
            item.desc =
              "Periodically projects an Aetheric Conduit on the field (15s Cooldown). Discharging it casts triple elemental spells & resets cooldowns.";
          } else if (selected === "viper") {
            item.subType = "dagger";
            item.isUniqueViper = true;
            item.noun = "Perfect Stiletto";
            item.name = `Viper's Perfect Stiletto (Lv. ${stageScale})`;
            item.desc =
              "Critical strikes have a 25% chance to trigger a Perfect Strike reticle. Tapping it within 2s deals 5x defense-bypassing damage and inflicts a toxic poison sting.";
          }
        } else if (chosenType === "boots") {
          item.isUniqueWarpCore = true;
          item.noun = "Warp-Core Greaves";
          item.name = `Warp-Core Greaves (Lv. ${stageScale})`;
          item.desc =
            "Time Dilation: Attacks speed up by +1% for every 1% of target missing health (up to +99%). Boss kills grant 4s of Maximum Haste.";
        } else if (chosenType === "helmet") {
          item.isUniqueTempest = true;
          item.noun = "Crown of Tempests";
          item.name = `Crown of Crackling Tempests (Lv. ${stageScale})`;
          item.desc =
            "Taking damage has 15% chance to call thunderbolt dealing 150% Attack power and stuns.";
        }
      }
    }

    if (
      !item.isUniqueStaff &&
      !item.isUniqueSword &&
      !item.isUniqueSingularity &&
      !item.isUniqueMaelstrom &&
      !item.isUniqueAegis &&
      !item.isUniqueWatch &&
      !item.isUniqueChronicle &&
      !item.isUniqueWarpCore &&
      !item.isUniqueTempest
    ) {
      item.name = this.buildProceduralName(item);
    }
    window.recalculateItemStats(item); // Run full calculations and initialize raw base stats before return
    return item;
  },

  buildProceduralName(item) {
    if (item.statsRolled === "UNIQUE") return item.name;
    let stars = item.statsRolled;

    // Prioritize the Set Name as the theme prefix if it exists!
    let themeName = item.setName || "Standard";

    if (!item.setName && stars > 0) {
      const nomenclature = {
        bonusAtk: "Fierce",
        bonusMaxHp: "Grizzled",
        bonusDef: "Hardened",
        bonusMoveSpeed: "Fleet",
        bonusCritChance: "Precise",
        bonusCritDamage: "Savage",
        bonusBlock: "Stalwart",
        bonusParry: "Nimble",
        bonusStr: "Heavy",
        bonusDex: "Swift",
        bonusInt: "Erudite",
        bonusActiveSpeed: "Hasty",
        bonusIdleSpeed: "Slothful",
      };

      let highestKey = null;
      let maxVal = 0;
      Object.keys(nomenclature).forEach((k) => {
        if (item[k] && item[k] > maxVal) {
          maxVal = item[k];
          highestKey = k;
        }
      });
      if (highestKey) themeName = nomenclature[highestKey];
    }

    return `${themeName} ${item.noun} (Lv. ${item.stageLevel})`;
  },
});

// Legacy Compatibility Aliases to protect references
window.createItemObject = (
  chosenType,
  statLinesCount,
  stageScale,
  minStars = 0,
  allowedTraits = null,
) =>
  window.ItemFactory.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    minStars,
    allowedTraits,
  );
window.buildProceduralName = (item) =>
  window.ItemFactory.buildProceduralName(item);

// --- STAT RANGES & PREVIEWS ---

// Encapsulate getStatBaseRange directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  getStatBaseRange(item, statKey) {
    let stageLevel = item.stageLevel || 1;
    let isArt = item.type === "artifact";
    let rarityMult = isArt ? 1.45 : 1 + (item.statsRolled || 0) * 0.15;

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = stageLevel * 5;
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    let repScale = Math.pow(repGrowth, repStage);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    let min = 0;
    let max = 0;

    // Aligned with core roll ranges (Atk: 0.15~0.35, HP: 0.4~1.2, Def: 0.15~0.35) to prevent out-of-bounds rendering
    if (
      statKey === "atk" &&
      (item.bonusAtk > 0 || item.type === "weapon" || isArt)
    ) {
      min += Math.ceil(0.15 * expScale * rarityMult);
      max += Math.ceil(0.35 * expScale * rarityMult);
    } else if (statKey === "maxHp" && (item.bonusMaxHp > 0 || isArt)) {
      min += Math.ceil(0.4 * hpDefExpScale * rarityMult);
      max += Math.ceil(1.2 * hpDefExpScale * rarityMult);
    } else if (statKey === "def" && (item.bonusDef > 0 || isArt)) {
      min += Math.ceil(0.15 * hpDefExpScale * rarityMult);
      max += Math.ceil(0.35 * hpDefExpScale * rarityMult);
    } else if (statKey === "moveSpeed" && item.bonusMoveSpeed > 0) {
      min += Math.ceil(1 * stageLevel * rarityMult);
      max += Math.ceil(2 * stageLevel * rarityMult);
    } else if (statKey === "str" && (item.bonusStr > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "dex" && (item.bonusDex > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "int" && (item.bonusInt > 0 || isArt)) {
      min += Math.ceil(1 * Math.pow(stageLevel, 1.2) * rarityMult);
      max += Math.ceil(3 * Math.pow(stageLevel, 1.2) * rarityMult);
    } else if (statKey === "critChance" && item.bonusCritChance > 0) {
      min += 0.01 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.025 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "critDamage" && item.bonusCritDamage > 0) {
      min += 0.03 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.06 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "block" && item.bonusBlock > 0) {
      min += 0.005 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "parry" && item.bonusParry > 0) {
      min += 0.005 * Math.sqrt(stageLevel) * rarityMult;
      max += 0.015 * Math.sqrt(stageLevel) * rarityMult;
    } else if (statKey === "activeAttackSpeed" && item.bonusActiveSpeed > 0) {
      let sScale = Math.pow(stageLevel, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      min += 0.01 * sScale * rMult;
      max += 0.03 * sScale * rMult;
    } else if (statKey === "idleAttackSpeed" && item.bonusIdleSpeed > 0) {
      let sScale = Math.pow(stageLevel, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      min += 0.01 * sScale * rMult;
      max += 0.03 * sScale * rMult;
    } else if (statKey === "rareSpawn" && item.rareSpawn > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.002 * rarityMult * utilityScale;
      max += 0.006 * rarityMult * utilityScale;
    } else if (statKey === "dropRate" && item.dropRate > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.05 * rarityMult * utilityScale;
    } else if (statKey === "quality" && item.quality > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.01 * rarityMult * utilityScale;
      max += 0.03 * rarityMult * utilityScale;
    } else if (statKey === "goldMulti" && item.goldMulti > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.05 * rarityMult * utilityScale;
    } else if (statKey === "fairySpawn" && item.fairySpawn > 0) {
      let utilityScale = 1.0 + Math.sqrt(Math.max(1, stageLevel) - 1) * 0.12;
      min += 0.02 * rarityMult * utilityScale;
      max += 0.06 * rarityMult * utilityScale;
    }

    const unscaledStats = ["activeAttackSpeed", "idleAttackSpeed"];
    if (!unscaledStats.includes(statKey)) {
      let prestigeMult = 1.0;
      min *= prestigeMult;
      max *= prestigeMult;
    }

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
      if (isArt) {
        let artMultiplier = Math.pow(1.15, tempers);
        min *= artMultiplier;
        max *= artMultiplier;

        if (statKey === "atk") {
          min += tempers * 15;
          max += tempers * 15;
        } else if (statKey === "maxHp") {
          min += tempers * 100;
          max += tempers * 100;
        } else if (statKey === "def") {
          min += tempers * 10;
          max += tempers * 10;
        } else if (["str", "dex", "int"].includes(statKey)) {
          min += tempers * 3;
          max += tempers * 3;
        } else if (statKey === "goldMulti") {
          min += tempers * 0.05;
          max += tempers * 0.05;
        } else if (statKey === "dropRate") {
          min += tempers * 0.03;
          max += tempers * 0.03;
        } else if (statKey === "quality") {
          min += tempers * 0.02;
          max += tempers * 0.02;
        } else if (statKey === "fairySpawn") {
          min += tempers * 0.02;
          max += tempers * 0.02;
        } else if (statKey === "rareSpawn") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "critChance") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (["parry", "block"].includes(statKey)) {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (["idleAttackSpeed", "activeAttackSpeed"].includes(statKey)) {
          min += tempers * 0.03;
          max += tempers * 0.03;
        } else if (statKey === "moveSpeed") {
          min += tempers;
          max += tempers;
        } else if (statKey === "critDamage") {
          min += tempers * 0.025;
          max += tempers * 0.025;
        }
      } else {
        if (
          [
            "atk",
            "maxHp",
            "def",
            "str",
            "dex",
            "int",
            "activeAttackSpeed",
            "idleAttackSpeed",
          ].includes(statKey)
        ) {
          let multiplier = 1 + tempers * 0.08;
          min *= multiplier;
          max *= multiplier;
        }
        if (statKey === "moveSpeed") {
          min += tempers;
          max += tempers;
        } else if (statKey === "critChance") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "critDamage") {
          min += tempers * 0.015;
          max += tempers * 0.015;
        } else if (statKey === "block") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "parry") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "dropRate") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "quality") {
          min += tempers * 0.005;
          max += tempers * 0.005;
        } else if (statKey === "goldMulti") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        } else if (statKey === "rareSpawn") {
          min += tempers * 0.001;
          max += tempers * 0.001;
        } else if (statKey === "fairySpawn") {
          min += tempers * 0.01;
          max += tempers * 0.01;
        }
      }
    }

    if (item.enchantments && item.enchantments[statKey]) {
      let count = item.enchantments[statKey];
      let multiplier = Math.pow(1.25, count);
      const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
      if (integerStats.includes(statKey)) {
        min = Math.ceil(min * multiplier);
        max = Math.ceil(max * multiplier);
      } else {
        min = parseFloat((min * multiplier).toFixed(4));
        max = parseFloat((max * multiplier).toFixed(4));
      }
    }

    return { min, max };
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatBaseRange = (item, statKey) =>
  window.ItemFactory.getStatBaseRange(item, statKey);
// Encapsulate formatStatRangeStr directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  formatStatRangeStr(item, statKey, isPct = false) {
    let range = this.getStatBaseRange(item, statKey);
    if (range.min === 0 && range.max === 0) return "";

    let minStr, maxStr;
    if (statKey === "rareSpawn") {
      minStr = (range.min * 100).toFixed(2) + "%";
      maxStr = (range.max * 100).toFixed(2) + "%";
    } else if (isPct) {
      minStr = Math.floor(range.min * 100) + "%";
      maxStr = Math.floor(range.max * 100) + "%";
    } else if (
      statKey === "activeAttackSpeed" ||
      statKey === "idleAttackSpeed"
    ) {
      minStr = Math.round(range.min * 100) + "%";
      maxStr = Math.round(range.max * 100) + "%";
    } else if (
      ["dropRate", "quality", "goldMulti", "fairySpawn"].includes(statKey)
    ) {
      minStr = Math.floor(range.min * 100) + "%";
      maxStr = Math.floor(range.max * 100) + "%";
    } else {
      minStr = window.formatNumber(range.min);
      maxStr = window.formatNumber(range.max);
    }

    if (minStr === maxStr) {
      return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr}]</span>`;
    }

    return ` <span style="color:#7f8c8d; font-size:9px;">[${minStr} - ${maxStr}]</span>`;
  },
});

// Legacy Compatibility Aliases to protect references
window.formatStatRangeStr = (item, statKey, isPct) =>
  window.ItemFactory.formatStatRangeStr(item, statKey, isPct);

// Append Math Scaling Directly inside window.ItemFactory
Object.assign(window.ItemFactory, {
  scaleItemBonusStats(item, oldStars, newStars) {
    if (
      item.type === "artifact" ||
      oldStars === "UNIQUE" ||
      newStars === "UNIQUE"
    )
      return;
    let oldFlatMult = window.getRarityMultiplier(oldStars);
    let newFlatMult = window.getRarityMultiplier(newStars);
    let flatRatio = newFlatMult / oldFlatMult;

    let oldPctMult = 1 + oldStars * 0.15;
    let newPctMult = 1 + newStars * 0.15;
    let pctRatio = newPctMult / oldPctMult;

    const flatKeys = [
      "bonusAtk",
      "bonusMaxHp",
      "bonusDef",
      "bonusStr",
      "bonusDex",
      "bonusInt",
    ];

    const pctKeys = [
      "bonusMoveSpeed",
      "bonusCritChance",
      "bonusCritDamage",
      "bonusBlock",
      "bonusParry",
      "bonusActiveSpeed",
      "bonusIdleSpeed",
    ];

    flatKeys.forEach((k) => {
      if (item[k]) {
        item[k] = Math.ceil(item[k] * flatRatio);
      }
    });

    pctKeys.forEach((k) => {
      if (item[k]) {
        if (
          [
            "bonusCritChance",
            "bonusCritDamage",
            "bonusBlock",
            "bonusParry",
          ].includes(k)
        ) {
          item[k] = parseFloat((item[k] * pctRatio).toFixed(4));
        } else if (["bonusActiveSpeed", "bonusIdleSpeed"].includes(k)) {
          item[k] = Math.floor(item[k] * pctRatio);
        } else {
          item[k] = Math.ceil(item[k] * pctRatio);
        }
      }
    });
  },
});

// Legacy Compatibility Aliases to protect references
window.scaleItemBonusStats = (item, oldStars, newStars) =>
  window.ItemFactory.scaleItemBonusStats(item, oldStars, newStars);

// Append Stat Recalculation directly inside ItemFactory
Object.assign(window.ItemFactory, {
  recalculateItemStats(item) {
    if (!item || typeof item !== "object") return;
    if (item.type === "tome") {
      item.type = "subweapon";
      item.subType = "tome";
    }
    let stageScale = item.stageLevel || 1;
    item.bonusAtk = item.bonusAtk || 0;
    item.bonusMaxHp = item.bonusMaxHp || 0;
    item.bonusDef = item.bonusDef || 0;
    item.bonusMoveSpeed = item.bonusMoveSpeed || 0;
    item.bonusCritChance = item.bonusCritChance || 0;
    item.bonusCritDamage = item.bonusCritDamage || 0;
    item.bonusBlock = item.bonusBlock || 0;
    item.bonusParry = item.bonusParry || 0;
    item.bonusActiveSpeed = item.bonusActiveSpeed || 0;
    item.bonusIdleSpeed = item.bonusIdleSpeed || 0;
    item.bonusStr = item.bonusStr || 0;
    item.bonusDex = item.bonusDex || 0;
    item.bonusInt = item.bonusInt || 0;

    // Direct-Alignment Scaling Model: Mapped on 5-stage increments
    let repStage = window.getEffectiveStage((item.stageLevel || 1) * 5);
    let repGrowth = 1.045 + (repStage * 0.04) / (repStage + 200);
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let repScale = Math.pow(repGrowth, repStage * 0.95);

    let expScale = repScale;
    let hpDefExpScale = repScale;

    let prestigeCount = window.playerStats.prestigeCount || 0;
    let prestigeMult = 1.0;

    // Dynamic base scaling transitions for standard slot configurations
    if (item.type !== "artifact" && !window.isItemUnique(item)) {
      // Reset base stats first to avoid double-compounding
      item.baseAtk = 0;
      item.baseMaxHp = 0;
      item.baseDef = 0;
      item.baseMoveSpeed = 0;
      item.baseBlock = 0;
      item.baseParry = 0;
      item.baseInt = 0;
      item.baseStr = 0;
      item.baseDex = 0;
      item.atkPct = 0;
      item.maxHpPct = 0;
      item.defPct = 0;
      item.moveSpeedPct = 0;
      item.strPct = 0;
      item.dexPct = 0;
      item.intPct = 0;
      item.baseCritChance = 0;
      item.baseCritDamage = 0;

      let stars = item.statsRolled || 0;
      let baseRarityMult = window.getRarityMultiplier(stars); // Apply new non-linear rarity multiplier on recalculation
      let noun = item.noun ? item.noun.toLowerCase() : "";

      if (
        item.type === "weapon" &&
        !item.isUniqueStaff &&
        !item.isUniqueSword &&
        !item.isUniqueSingularity &&
        !item.isUniqueMaelstrom
      ) {
        let baseVal = Math.ceil(2.5 * repScale * baseRarityMult);
        if (noun.includes("greatsword") || noun.includes("claymore")) {
          item.baseAtk = Math.ceil(baseVal * 1.15);
          item.baseCritDamage = 0.15;
        } else if (noun.includes("longsword") || noun.includes("broadsword")) {
          item.baseAtk = Math.ceil(baseVal * 0.95);
          item.baseCritChance = 0.04;
        } else if (noun.includes("halberd") || noun.includes("battleaxe")) {
          item.baseAtk = Math.ceil(baseVal * 1.2);
          item.atkPct = 0.05;
        } else if (noun.includes("warhammer") || noun.includes("mace")) {
          item.baseAtk = Math.ceil(baseVal * 1.1);
          item.baseStr = Math.ceil(0.8 * stageScale * baseRarityMult);
        } else {
          item.baseAtk = baseVal;
        }
      } else if (item.type === "chest" || item.type === "overall") {
        let overallMult = item.type === "overall" ? 1.8 : 1.0;
        let baseDefVal = Math.ceil(
          1.5 * repScale * baseRarityMult * overallMult,
        );
        let baseHpVal = Math.ceil(
          6.0 * repScale * baseRarityMult * overallMult,
        );

        if (
          noun.includes("cuirass") ||
          noun.includes("plate_mail") ||
          noun.includes("full_plate")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 1.3);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
          item.defPct = 0.04;
        } else if (noun.includes("hauberk") || noun.includes("chain_mail")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseBlock = 0.02;
        } else if (
          noun.includes("brigandine") ||
          noun.includes("doublet") ||
          noun.includes("trenchcoat")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 0.7);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
          item.maxHpPct = 0.05;
        } else if (noun.includes("exosuit")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.maxHpPct = 0.06;
        } else if (noun.includes("robes")) {
          item.baseDef = Math.ceil(baseDefVal * 0.6);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.4);
          item.baseInt = Math.ceil(2.0 * stageScale * baseRarityMult);
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "helmet" && !item.isUniqueTempest) {
        let baseDefVal = Math.ceil(0.7 * repScale * baseRarityMult);
        let baseHpVal = Math.ceil(3.0 * repScale * baseRarityMult);

        if (noun.includes("greathelm") || noun.includes("visor")) {
          item.baseDef = Math.ceil(baseDefVal * 1.25);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.85);
          item.defPct = 0.03;
        } else if (
          noun.includes("armet") ||
          noun.includes("bascinet") ||
          noun.includes("barbuta")
        ) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseParry = 0.02;
        } else if (noun.includes("circlet") || noun.includes("coif")) {
          item.baseDef = Math.ceil(baseDefVal * 0.65);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.35);
          item.baseCritChance = 0.03;
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "leggings") {
        let baseDefVal = Math.ceil(0.7 * repScale * baseRarityMult);
        let baseHpVal = Math.ceil(3.0 * repScale * baseRarityMult);

        if (noun.includes("legplates")) {
          item.baseDef = Math.ceil(baseDefVal * 1.2);
          item.baseMaxHp = Math.ceil(baseHpVal * 0.8);
          item.defPct = 0.03;
        } else if (noun.includes("greaves")) {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
          item.baseBlock = 0.02;
        } else if (noun.includes("chausses") || noun.includes("cuisses")) {
          item.baseDef = Math.ceil(baseDefVal * 0.7);
          item.baseMaxHp = Math.ceil(baseHpVal * 1.3);
          item.baseParry = 0.03;
        } else {
          item.baseDef = baseDefVal;
          item.baseMaxHp = baseHpVal;
        }
      } else if (item.type === "boots" && !item.isUniqueWarpCore) {
        let baseDefVal = Math.ceil(0.35 * repScale * baseRarityMult);
        let baseSpdVal = Math.ceil(1.0 * stageScale);

        if (
          noun.includes("sabatons") ||
          noun.includes("steel_boots") ||
          noun.includes("steel")
        ) {
          item.baseDef = Math.ceil(baseDefVal * 1.4);
          item.baseMoveSpeed = Math.ceil(baseSpdVal * 0.8);
          item.defPct = 0.03;
        } else if (noun.includes("sollerets")) {
          item.baseDef = baseDefVal;
          item.baseMoveSpeed = baseSpdVal;
          item.baseParry = 0.02;
        } else if (noun.includes("treads")) {
          item.baseDef = Math.ceil(baseDefVal * 0.6);
          item.baseMoveSpeed = Math.ceil(baseSpdVal * 1.35);
          item.moveSpeedPct = 0.04;
        } else {
          item.baseDef = baseDefVal;
          item.baseMoveSpeed = baseSpdVal;
        }
      } else if (item.type === "ring") {
        if (item.implicitType === undefined) {
          if (item.baseAtk > 0) item.implicitType = "atk";
          else if (item.baseMaxHp > 0) item.implicitType = "maxHp";
          else item.implicitType = "def";
        }
        if (item.implicitType === "atk")
          item.baseAtk = Math.ceil(0.6 * repScale * baseRarityMult);
        else if (item.implicitType === "maxHp")
          item.baseMaxHp = Math.ceil(1.5 * repScale * baseRarityMult);
        else if (item.implicitType === "def")
          item.baseDef = Math.ceil(0.35 * repScale * baseRarityMult);

        let scaleFactor = Math.pow(stageScale, 0.8);
        if (item.atkPct > 0)
          item.atkPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.maxHpPct > 0)
          item.maxHpPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.defPct > 0)
          item.defPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.strPct > 0)
          item.strPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.dexPct > 0)
          item.dexPct = parseFloat((0.04 * scaleFactor).toFixed(4));
        if (item.intPct > 0)
          item.intPct = parseFloat((0.04 * scaleFactor).toFixed(4));
      } else if (
        item.type === "subweapon" &&
        !item.isUniqueAegis &&
        !item.isUniqueWatch &&
        !item.isUniqueChronicle &&
        !item.isUniqueConduit &&
        !item.isUniqueViper
      ) {
        if (item.subType === "shield") {
          item.baseDef = Math.ceil(1.0 * repScale * baseRarityMult);
          item.baseStr = Math.ceil(1.5 * stageScale * baseRarityMult);
          let noun = item.noun ? item.noun.toLowerCase() : "";
          let stars =
            typeof item.statsRolled === "number" ? item.statsRolled : 0;

          if (noun.includes("tower")) {
            item.subArchetype = "tower";
            item.baseBlock = 0.08 + stars * 0.01;
            item.blockCapBonus = 0.04 + stars * 0.008;
            item.reflectDamage = 1.2 + stars * 0.16; // 120% - 200% Def
            item.bashAtkBonus = 0;
          } else if (noun.includes("buckler")) {
            item.subArchetype = "buckler";
            item.baseBlock = 0.12 + stars * 0.015;
            item.blockCapBonus = 0.02 + stars * 0.005;
            item.reflectDamage = 0.6 + stars * 0.08; // 60% Def
            item.bashAtkBonus = 0.5; // +50% Atk
          } else {
            item.subArchetype = "vanguard";
            item.baseBlock = 0.08 + stars * 0.01;
            item.blockCapBonus = 0.02 + stars * 0.006;
            item.reflectDamage = 1.0 + stars * 0.12; // 100% Def
            item.bashAtkBonus = 0;
          }
        } else if (item.subType === "dagger") {
          item.baseAtk = Math.ceil(0.8 * repScale * baseRarityMult);
          item.baseDex = Math.ceil(1.5 * stageScale * baseRarityMult);
          let noun = item.noun ? item.noun.toLowerCase() : "";
          let stars =
            typeof item.statsRolled === "number" ? item.statsRolled : 0;

          if (noun.includes("main")) {
            item.subArchetype = "main_gauche";
            item.baseParry = 0.1 + stars * 0.012;
            item.parryCapBonus = 0.1 + stars * 0.01; // 10% - 15% bonus parry cap
            item.parryMitigation = 0.75; // 75% damage mitigation on parry
            item.riposteDamage = 0.8 + stars * 0.08;
            item.bleedChance = 0;
            item.offhandChance = 0;
            item.offhandDmg = 0.35;
          } else if (noun.includes("stiletto")) {
            item.subArchetype = "stiletto";
            item.baseParry = 0.06 + stars * 0.008;
            item.parryCapBonus = 0.02;
            item.parryMitigation = 0.6;
            item.riposteDamage = 1.0 + stars * 0.12; // 100% Atk
            item.bleedChance = 0.35 + stars * 0.04; // 35% - 55% Bleed
            item.offhandChance = 0;
            item.offhandDmg = 0.35;
          } else {
            item.subArchetype = "flurry";
            item.baseParry = 0.06 + stars * 0.008;
            item.parryCapBonus = 0.02;
            item.parryMitigation = 0.6;
            item.riposteDamage = 0.8 + stars * 0.08;
            item.offhandChance = 0.5 + stars * 0.05; // 50% - 75% Offhand Chance
            item.offhandDmg = 0.45; // 45% Atk
            item.bleedChance = 0.15;
          }
        } else if (item.subType === "tome") {
          item.baseInt = Math.ceil(1.5 * stageScale * baseRarityMult);
          item.baseAtk = Math.ceil(0.4 * repScale * baseRarityMult);
          let noun = item.noun ? item.noun.toLowerCase() : "";
          let stars =
            typeof item.statsRolled === "number" ? item.statsRolled : 0;
          if (noun.includes("grimoire")) item.spellType = "fire";
          else if (noun.includes("codex")) item.spellType = "lightning";
          else if (noun.includes("lexicon")) item.spellType = "frost";
          else if (noun.includes("spellbook") || noun.includes("chronicle"))
            item.spellType = "tri";
          else if (!item.spellType) item.spellType = "tri";

          if (item.spellType === "fire") {
            item.spellChance = Math.min(0.5, 0.25 + stars * 0.02);
            item.spellPower = 1.8 + stars * 0.2;
          } else if (item.spellType === "lightning") {
            item.spellChance = Math.min(0.6, 0.38 + stars * 0.03);
            item.spellPower = 1.2 + stars * 0.15;
          } else if (item.spellType === "frost") {
            item.spellChance = Math.min(0.5, 0.3 + stars * 0.025);
            item.spellPower = 1.45 + stars * 0.15;
          } else {
            item.spellChance = Math.min(0.5, 0.33 + stars * 0.02);
            item.spellPower = 1.5 + stars * 0.18;
          }
        }
      }
    } else if (item.type === "artifact") {
      // Artifact parameters are managed statically on drop; preserve them as is
    } else {
      // Reset all stats to build deterministic static unique profiles
      item.baseAtk = 0;
      item.baseMaxHp = 0;
      item.baseDef = 0;
      item.baseMoveSpeed = 0;
      item.baseBlock = 0;
      item.baseParry = 0;
      item.baseInt = 0;
      item.baseStr = 0;
      item.baseDex = 0;
      item.atkPct = 0;
      item.maxHpPct = 0;
      item.defPct = 0;
      item.moveSpeedPct = 0;
      item.strPct = 0;
      item.dexPct = 0;
      item.intPct = 0;
      item.baseCritChance = 0;
      item.baseCritDamage = 0;

      item.bonusAtk = 0;
      item.bonusMaxHp = 0;
      item.bonusDef = 0;
      item.bonusMoveSpeed = 0;
      item.bonusCritChance = 0;
      item.bonusCritDamage = 0;
      item.bonusBlock = 0;
      item.bonusParry = 0;
      item.bonusActiveSpeed = 0;
      item.bonusIdleSpeed = 0;
      item.bonusStr = 0;
      item.bonusDex = 0;
      item.bonusInt = 0;

      if (item.isUniqueStaff) {
        item.baseInt = Math.ceil(20 * stageScale * 10.0);
        item.baseAtk = Math.ceil(8 * stageScale * 10.0);
        item.intPct = 0.15;
        item.bonusAtk = Math.ceil(0.3 * expScale * 10.0);
        item.bonusInt = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.02 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.05 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
      } else if (item.isUniqueSword) {
        item.baseAtk = Math.ceil(30 * stageScale * 10.0);
        item.baseCritChance = 0.08;
        item.bonusAtk = Math.ceil(0.35 * expScale * 10.0);
        item.bonusStr = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.025 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.06 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.025 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
      } else if (item.isUniqueSingularity) {
        item.baseAtk = Math.ceil(40 * stageScale * 10.0);
        item.baseCritDamage = 0.3;
        item.bonusAtk = Math.ceil(0.4 * expScale * 10.0);
        item.bonusStr = Math.ceil(4 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritDamage = parseFloat(
          (0.08 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusDef = Math.ceil(0.2 * hpDefExpScale * 10.0);
        item.bonusMaxHp = Math.ceil(0.6 * hpDefExpScale * 10.0);
      } else if (item.isUniqueMaelstrom) {
        item.baseAtk = Math.ceil(25 * stageScale * 10.0);
        item.moveSpeedPct = 0.12;
        item.bonusAtk = Math.ceil(0.3 * expScale * 10.0);
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.03 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.03 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusMoveSpeed = Math.ceil(1.5 * stageScale * 1.75);
      } else if (item.isUniqueAegis) {
        item.baseDef = Math.ceil(15 * stageScale * 10.0);
        item.baseBlock = 0.1;
        item.bonusDef = Math.ceil(0.25 * hpDefExpScale * 10.0);
        item.bonusMaxHp = Math.ceil(0.8 * hpDefExpScale * 10.0);
        item.bonusBlock = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusStr = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueWatch) {
        item.baseInt = Math.ceil(15 * stageScale * 10.0);
        item.baseAtk = Math.ceil(5 * stageScale * 10.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusMoveSpeed = Math.ceil(1.2 * stageScale * 1.75);
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueChronicle) {
        item.baseInt = Math.ceil(15 * stageScale * 10.0);
        item.baseAtk = Math.ceil(5 * stageScale * 10.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusMaxHp = Math.ceil(0.5 * hpDefExpScale * 10.0);
        item.bonusDef = Math.ceil(0.15 * hpDefExpScale * 10.0);
        item.bonusStr = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueConduit) {
        item.baseInt = Math.ceil(20 * stageScale * 10.0);
        item.baseAtk = Math.ceil(6 * stageScale * 10.0);
        item.bonusInt = Math.ceil(4 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusActiveSpeed = parseFloat(
          (0.025 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusCritChance = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.04 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusDex = Math.ceil(2 * Math.pow(stageScale, 1.2) * 2.25);
      } else if (item.isUniqueViper) {
        item.baseAtk = Math.ceil(12 * stageScale * 10.0);
        item.baseParry = 0.08;
        item.bonusAtk = Math.ceil(0.25 * expScale * 10.0);
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusCritChance = parseFloat(
          (0.02 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusCritDamage = parseFloat(
          (0.05 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusParry = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
      } else if (item.isUniqueWarpCore) {
        item.baseDef = Math.ceil(3.5 * stageScale * 10.0);
        item.baseMoveSpeed = Math.ceil(3.0 * stageScale);
        item.bonusMoveSpeed = Math.ceil(2.0 * stageScale * 1.75);
        item.bonusActiveSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusIdleSpeed = parseFloat(
          (0.02 * Math.pow(stageScale, 0.3) * 1.4).toFixed(4),
        );
        item.bonusDex = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusMaxHp = Math.ceil(0.3 * hpDefExpScale * 10.0);
      } else if (item.isUniqueTempest) {
        item.baseDef = Math.ceil(7.0 * stageScale * 10.0);
        item.baseMaxHp = Math.ceil(30.0 * stageScale * 10.0);
        item.bonusMaxHp = Math.ceil(0.5 * hpDefExpScale * 10.0);
        item.bonusDef = Math.ceil(0.15 * hpDefExpScale * 10.0);
        item.bonusInt = Math.ceil(3 * Math.pow(stageScale, 1.2) * 2.25);
        item.bonusParry = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
        item.bonusBlock = parseFloat(
          (0.015 * Math.sqrt(stageScale) * 1.75).toFixed(4),
        );
      }
    }

    // Sum combined totals using standard base values
    item.atk = (item.baseAtk || 0) + item.bonusAtk;
    item.maxHp = (item.baseMaxHp || 0) + item.bonusMaxHp;
    item.def = (item.baseDef || 0) + item.bonusDef;
    item.moveSpeed = (item.baseMoveSpeed || 0) + item.bonusMoveSpeed;
    item.critChance = (item.baseCritChance || 0) + item.bonusCritChance;
    item.critDamage = (item.baseCritDamage || 0) + item.bonusCritDamage;
    item.block = (item.baseBlock || 0) + item.bonusBlock;
    item.parry = (item.baseParry || 0) + item.bonusParry;
    item.activeAttackSpeed =
      (item.baseActiveSpeed || 0) + item.bonusActiveSpeed;
    item.idleAttackSpeed = (item.baseIdleSpeed || 0) + item.bonusIdleSpeed;
    item.str = (item.baseStr || 0) + item.bonusStr;
    item.dex = (item.baseDex || 0) + item.bonusDex;
    item.int = (item.baseInt || 0) + item.bonusInt;

    let tempers = item.temperLevel || 0;
    if (tempers > 0) {
      let isArt = item.type === "artifact";
      if (isArt) {
        let artMultiplier = Math.pow(1.15, tempers);
        item.atk = Math.round(item.atk * artMultiplier) + tempers * 15;
        item.maxHp = Math.round(item.maxHp * artMultiplier) + tempers * 100;
        item.def = Math.round(item.def * artMultiplier) + tempers * 10;
        item.str = Math.round(item.str * artMultiplier) + tempers * 3;
        item.dex = Math.round(item.dex * artMultiplier) + tempers * 3;
        item.int = Math.round(item.int * artMultiplier) + tempers * 3;

        if (item.goldMulti > 0)
          item.goldMulti = parseFloat(
            (item.goldMulti + tempers * 0.05).toFixed(4),
          );
        if (item.dropRate > 0)
          item.dropRate = parseFloat(
            (item.dropRate + tempers * 0.03).toFixed(4),
          );
        if (item.quality > 0)
          item.quality = parseFloat((item.quality + tempers * 0.02).toFixed(4));
        if (item.fairySpawn > 0)
          item.fairySpawn = parseFloat(
            (item.fairySpawn + tempers * 0.02).toFixed(4),
          );
        if (item.rareSpawn > 0)
          item.rareSpawn = parseFloat(
            (item.rareSpawn + tempers * 0.01).toFixed(4),
          );
        if (item.critChance > 0)
          item.critChance = parseFloat(
            (item.critChance + tempers * 0.01).toFixed(4),
          );
        if (item.parry > 0)
          item.parry = parseFloat((item.parry + tempers * 0.005).toFixed(4));
        if (item.block > 0)
          item.block = parseFloat((item.block + tempers * 0.005).toFixed(4));
        if (item.idleAttackSpeed > 0)
          item.idleAttackSpeed = parseFloat(
            (item.idleAttackSpeed + tempers * 0.03).toFixed(4),
          );
        if (item.activeAttackSpeed > 0)
          item.activeAttackSpeed = parseFloat(
            (item.activeAttackSpeed + tempers * 0.03).toFixed(4),
          );
        if (item.moveSpeed > 0) item.moveSpeed += tempers;
        if (item.critDamage > 0)
          item.critDamage = parseFloat(
            (item.critDamage + tempers * 0.025).toFixed(4),
          );
      } else {
        let multiplier = 1 + tempers * 0.08;
        // Scale internal base parameter properties once (no double-scaling!)
        if (item.baseAtk > 0)
          item.baseAtk = Math.round(item.baseAtk * multiplier);
        if (item.baseDef > 0)
          item.baseDef = Math.round(item.baseDef * multiplier);
        if (item.baseMaxHp > 0)
          item.baseMaxHp = Math.round(item.baseMaxHp * multiplier);
        if (item.baseInt > 0)
          item.baseInt = Math.round(item.baseInt * multiplier);

        // Scale combined totals once (including bonus components)
        if (item.atk > 0 || item.type === "weapon")
          item.atk = Math.round(item.atk * multiplier);
        if (item.maxHp > 0) item.maxHp = Math.round(item.maxHp * multiplier);
        if (item.def > 0) item.def = Math.round(item.def * multiplier);
        if (item.str > 0) item.str = Math.round(item.str * multiplier);
        if (item.dex > 0) item.dex = Math.round(item.dex * multiplier);
        if (item.int > 0) item.int = Math.round(item.int * multiplier);

        if (item.moveSpeed > 0) item.moveSpeed += tempers;
        if (item.critChance > 0)
          item.critChance = parseFloat(
            (item.critChance + tempers * 0.005).toFixed(4),
          );
        if (item.critDamage > 0)
          item.critDamage = parseFloat(
            (item.critDamage + tempers * 0.015).toFixed(4),
          );
        if (item.block > 0)
          item.block = parseFloat((item.block + tempers * 0.005).toFixed(4));
        if (item.parry > 0)
          item.parry = parseFloat((item.parry + tempers * 0.005).toFixed(4));
        if (item.dropRate > 0)
          item.dropRate = parseFloat(
            (item.dropRate + tempers * 0.01).toFixed(4),
          );
        if (item.quality > 0)
          item.quality = parseFloat(
            (item.quality + tempers * 0.005).toFixed(4),
          );
        if (item.goldMulti > 0)
          item.goldMulti = parseFloat(
            (item.goldMulti + tempers * 0.01).toFixed(4),
          );
        if (item.rareSpawn > 0)
          item.rareSpawn = parseFloat(
            (item.rareSpawn + tempers * 0.001).toFixed(4),
          );
        if (item.fairySpawn > 0)
          item.fairySpawn = parseFloat(
            (item.fairySpawn + tempers * 0.01).toFixed(4),
          );
        if (item.activeAttackSpeed > 0)
          item.activeAttackSpeed = parseFloat(
            (item.bonusActiveSpeed * (1 + tempers * 0.08)).toFixed(4),
          );
        if (item.idleAttackSpeed > 0)
          item.idleAttackSpeed = parseFloat(
            (item.bonusIdleSpeed * (1 + tempers * 0.08)).toFixed(4),
          );
      }
    }

    if (item.enchantments) {
      for (let statKey in item.enchantments) {
        let count = item.enchantments[statKey];
        let multiplier = Math.pow(1.25, count);
        const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
        if (integerStats.includes(statKey)) {
          item[statKey] = Math.ceil(item[statKey] * multiplier);
        } else {
          item[statKey] = parseFloat((item[statKey] * multiplier).toFixed(4));
        }
      }
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.recalculateItemStats = function (item) {
  // Directly routing to the main dynamic recalculator solves a legacy bug where upgraded item base stats remained permanently flat
  window.ItemFactory.recalculateItemStats(item);
};

// Append Item Upgrade Logic directly inside ItemFactory
Object.assign(window.ItemFactory, {
  addRandomStatLineToItem(item) {
    let pool = [];
    if (item.type === "ring") {
      pool = ["atk", "maxHp", "def", "str", "dex", "int"];
    } else if (item.type === "artifact") {
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
        "str",
        "dex",
        "int",
      ];
    } else {
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
      ];
    }
    if (item.type === "subweapon") {
      if (item.subType === "shield")
        pool = ["block", "atk", "maxHp", "def", "str"];
      else if (item.subType === "dagger")
        pool = ["parry", "atk", "critChance", "dex"];
      else if (item.subType === "tome")
        pool = ["critDamage", "int", "activeSpd", "idleSpd"];
    }

    pool = pool.filter((stat) => {
      if (stat === "atk" && item.bonusAtk > 0) return false;
      if (stat === "maxHp" && item.bonusMaxHp > 0) return false;
      if (stat === "def" && item.bonusDef > 0) return false;
      if (stat === "moveSpeed" && item.bonusMoveSpeed > 0) return false;
      if (stat === "critChance" && item.bonusCritChance > 0) return false;
      if (stat === "critDamage" && item.bonusCritDamage > 0) return false;
      if (stat === "block" && item.bonusBlock > 0) return false;
      if (stat === "parry" && item.bonusParry > 0) return false;
      if (stat === "activeSpd" && item.bonusActiveSpeed > 0) return false;
      if (stat === "idleSpd" && item.bonusIdleSpeed > 0) return false;
      if (stat === "str" && item.bonusStr > 0) return false;
      if (stat === "dex" && item.bonusDex > 0) return false;
      if (stat === "int" && item.bonusInt > 0) return false;
      return true;
    });

    if (pool.length === 0) {
      pool = [
        "critChance",
        "critDamage",
        "block",
        "parry",
        "atk",
        "maxHp",
        "def",
        "moveSpeed",
        "activeSpd",
        "idleSpd",
        "str",
        "dex",
        "int",
      ];
    }

    let selectedStat = pool[Math.floor(Math.random() * pool.length)];
    let stageScale = item.stageLevel || 1;
    let effStageScale = window.getEffectiveStage(stageScale * 5) / 10;
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let expScale = Math.pow(1.18, effStageScale) * Math.pow(effStageScale, 2.2);
    let hpDefExpScale =
      Math.pow(1.16, effStageScale) * Math.pow(effStageScale, 2.2);
    let rarityMult = 1 + item.statsRolled * 0.15;
    let prestigeMult = Math.pow(1.08, window.playerStats.prestigeCount || 0);

    if (selectedStat === "atk")
      item.bonusAtk += Math.ceil(
        window.randFloat(0.15, 0.35) * expScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "maxHp")
      item.bonusMaxHp += Math.ceil(
        window.randFloat(0.4, 1.2) * hpDefExpScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "def")
      item.bonusDef += Math.ceil(
        window.randFloat(0.15, 0.35) *
          hpDefExpScale *
          rarityMult *
          prestigeMult,
      );
    else if (selectedStat === "moveSpeed")
      item.bonusMoveSpeed += Math.ceil(
        window.randInt(1, 2) * stageScale * rarityMult * prestigeMult,
      );
    else if (selectedStat === "critChance") {
      let rolled =
        window.randFloat(0.01, 0.025) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusCritChance += parseFloat(Math.min(0.2, rolled).toFixed(4));
    } else if (selectedStat === "critDamage") {
      let rolled =
        window.randFloat(0.03, 0.06) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusCritDamage += parseFloat(rolled.toFixed(4));
    } else if (selectedStat === "block") {
      let rolled =
        window.randFloat(0.005, 0.015) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusBlock += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "parry") {
      let rolled =
        window.randFloat(0.005, 0.015) *
        Math.sqrt(stageScale) *
        rarityMult *
        prestigeMult;
      item.bonusParry += parseFloat(Math.min(0.15, rolled).toFixed(4));
    } else if (selectedStat === "activeSpd") {
      item.bonusActiveSpeed += parseFloat(
        (
          window.randFloat(0.04, 0.1) *
          Math.sqrt(stageScale) *
          rarityMult *
          prestigeMult
        ).toFixed(4),
      );
    } else if (selectedStat === "idleSpd") {
      item.bonusIdleSpeed += parseFloat(
        (
          window.randFloat(0.04, 0.1) *
          Math.sqrt(stageScale) *
          rarityMult *
          prestigeMult
        ).toFixed(4),
      );
    } else if (selectedStat === "str")
      item.bonusStr += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );
    else if (selectedStat === "dex")
      item.bonusDex += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );
    else if (selectedStat === "int")
      item.bonusInt += Math.ceil(
        window.randInt(1, 3) *
          Math.pow(stageScale, 1.2) *
          pctRarityMult *
          prestigeMult,
      );

    window.recalculateItemStats(item);
  },
});

// Legacy Compatibility Aliases to protect references
window.addRandomStatLineToItem = (item) =>
  window.ItemFactory.addRandomStatLineToItem(item);

// --- INVENTORY LOCKS & EQUIP ACTIONS ---

window.toggleLock = function (id) {
  let item =
    window.inventory.EQUIP.find((i) => i.id === id) ||
    (window.inventory.ARTIFACT &&
      window.inventory.ARTIFACT.find((i) => i.id === id)) ||
    (window.inventory.SIGIL && window.inventory.SIGIL.find((i) => i.id === id));
  if (!item) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
        item = window.equippedSlots[k];
        break;
      }
    }
  }
  if (item) {
    item.locked = !item.locked;
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        item.locked
          ? "[INSURED] Item Locked & Protected!"
          : "[UNINSURED] Item Unlocked & At Risk!",
        item.locked ? "#2ecc71" : "#e74c3c",
      );
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.saveGame === "function") window.saveGame();
  }
};

// Append equipItem inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  equipItem(id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let isArtifactSack = false;
    let index = window.inventory.EQUIP.findIndex((i) => i.id === id);
    if (index === -1 && window.inventory.ARTIFACT) {
      index = window.inventory.ARTIFACT.findIndex((i) => i.id === id);
      if (index !== -1) isArtifactSack = true;
    }
    if (index === -1) return;
    let item = isArtifactSack
      ? window.inventory.ARTIFACT[index]
      : window.inventory.EQUIP[index];

    // Level requirements removed

    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function")
      oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "overall") {
      if (window.equippedSlots.chest) {
        delete window.equippedSlots.chest.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.chest);
        window.equippedSlots.chest = null;
      }
      if (window.equippedSlots.leggings) {
        delete window.equippedSlots.leggings.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.leggings);
        window.equippedSlots.leggings = null;
      }
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.overall);
      }
      window.equippedSlots.overall = item;
      item.isEquippedSlot = "overall";
    } else if (item.type === "chest" || item.type === "leggings") {
      if (window.equippedSlots.overall) {
        delete window.equippedSlots.overall.isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots.overall);
        window.equippedSlots.overall = null;
      }
      if (window.equippedSlots[item.type]) {
        delete window.equippedSlots[item.type].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[item.type]);
      }
      window.equippedSlots[item.type] = item;
      item.isEquippedSlot = item.type;
    } else if (item.type === "artifact") {
      // Prevent equipping duplicate artifacts in core bag slot clicking
      let isAlreadyEquipped = ["art1", "art2", "art3"].some(
        (slot) =>
          window.equippedSlots[slot] &&
          window.equippedSlots[slot].trait === item.trait,
      );
      if (isAlreadyEquipped) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "❌ You cannot equip duplicate artifacts!",
            "#e74c3c",
          );
        }
        return;
      }

      if (!window.equippedSlots.art1) {
        window.equippedSlots.art1 = item;
        item.isEquippedSlot = "art1";
      } else if (!window.equippedSlots.art2) {
        window.equippedSlots.art2 = item;
        item.isEquippedSlot = "art2";
      } else {
        if (window.equippedSlots.art3) {
          delete window.equippedSlots.art3.isEquippedSlot;
          window.inventory.ARTIFACT.push(window.equippedSlots.art3);
        }
        window.equippedSlots.art3 = item;
        item.isEquippedSlot = "art3";
      }
    } else if (item.type === "ring") {
      let slotKey = !window.equippedSlots.ring1
        ? "ring1"
        : !window.equippedSlots.ring2
          ? "ring2"
          : "ring1";
      if (window.equippedSlots[slotKey]) {
        delete window.equippedSlots[slotKey].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[slotKey]);
      }
      window.equippedSlots[slotKey] = item;
      item.isEquippedSlot = slotKey;
    } else {
      if (window.equippedSlots[item.type]) {
        delete window.equippedSlots[item.type].isEquippedSlot;
        window.inventory.EQUIP.push(window.equippedSlots[item.type]);
      }
      window.equippedSlots[item.type] = item;
      item.isEquippedSlot = item.type;
    }

    if (isArtifactSack) {
      window.inventory.ARTIFACT.splice(index, 1);
    } else {
      window.inventory.EQUIP.splice(index, 1);
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    window.state.paperDollDirty = true;
    window.state.inventoryDirty = true;
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.equipItem = (id) => window.GameState.equipItem(id);

// Append unequipItem inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  unequipItem(slotKey) {
    let maxBag = window.getMaxBagSlots ? window.getMaxBagSlots() : 20;
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let item = window.equippedSlots[slotKey];
    if (!item) return;

    delete item.isEquippedSlot;
    let oldMaxHp = 100;
    if (typeof window.resolvePlayerStats === "function")
      oldMaxHp = window.resolvePlayerStats().maxHp;

    if (item.type === "artifact") {
      if (window.inventory.ARTIFACT.length >= maxBag) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`Artifact Sack Full!`, "#e74c3c");
        return;
      }
      window.equippedSlots[slotKey] = null;
      window.inventory.ARTIFACT.push(item);
    } else {
      if (window.inventory.EQUIP.length >= maxBag) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(`Inventory Full!`, "#e74c3c");
        return;
      }
      window.equippedSlots[slotKey] = null;
      window.inventory.EQUIP.push(item);
    }

    if (typeof window.invalidatePlayerStats === "function")
      window.invalidatePlayerStats();
    if (typeof window.updateUI === "function") window.updateUI();

    if (typeof window.checkAchievements === "function")
      window.checkAchievements();
    window.state.paperDollDirty = true;
    window.state.inventoryDirty = true;
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.unequipItem = (slotKey) => window.GameState.unequipItem(slotKey);

window.executeSalvageItemLogic = function (
  item,
  id,
  isEquipped,
  slotToClear,
  isArtifactSack,
  isSigilSack,
) {
  if (window.playerStats.pendingClanProgress) {
    window.playerStats.pendingClanProgress.salvage =
      (window.playerStats.pendingClanProgress.salvage || 0) + 1;
  }

  if (isEquipped) {
    window.equippedSlots[slotToClear] = null;
  } else if (isArtifactSack) {
    window.inventory.ARTIFACT.splice(
      window.inventory.ARTIFACT.indexOf(item),
      1,
    );
  } else if (isSigilSack) {
    window.inventory.SIGIL.splice(window.inventory.SIGIL.indexOf(item), 1);
  } else {
    window.inventory.EQUIP.splice(window.inventory.EQUIP.indexOf(item), 1);
  }
  window.playerStats.itemsSalvaged =
    (window.playerStats.itemsSalvaged || 0) + 1;

  if (typeof window.progressMission === "function") {
    window.progressMission("salvage", 1);
  }

  let rolledTier = item.statsRolled;
  let scrapsGained = [];
  let isArt = item.type === "artifact";
  let scrapName = isArt
    ? "Astral Essence"
    : window.getScrapYieldName(rolledTier);
  let yieldAmount = isArt
    ? Math.floor(Math.random() * 2) + 1
    : Math.floor(Math.random() * 3) + 1;

  let inDungeonRun = window.currentGameState !== window.GAME_STATES.HUB;

  if (inDungeonRun) {
    if (!window.player.pendingScraps) window.player.pendingScraps = {};
    window.player.pendingScraps[scrapName] =
      (window.player.pendingScraps[scrapName] || 0) + yieldAmount;
  } else if (typeof window.addEtcDrop === "function") {
    window.addEtcDrop(scrapName, yieldAmount, true);
  }
  scrapsGained.push({ name: scrapName, qty: yieldAmount });

  if (!isArt) {
    for (let t = rolledTier - 1; t >= 0; t--) {
      if (Math.random() < 0.6) {
        let lowerYield = Math.floor(Math.random() * 2) + 1;
        let lowerName = window.getScrapYieldName(t);
        if (inDungeonRun) {
          if (!window.player.pendingScraps) window.player.pendingScraps = {};
          window.player.pendingScraps[lowerName] =
            (window.player.pendingScraps[lowerName] || 0) + lowerYield;
        } else if (typeof window.addEtcDrop === "function") {
          window.addEtcDrop(lowerName, lowerYield, true);
        }
        scrapsGained.push({ name: lowerName, qty: lowerYield });
      }
    }
  }

  scrapsGained.forEach((s) => {
    if (typeof window.pushMaterialToast === "function") {
      window.pushMaterialToast(s.name, s.qty);
    }
  });

  let cvs = document.getElementById("gameCanvas");
  let w = cvs ? cvs.width : 750;
  let h = cvs ? cvs.height : 250;
  for (let i = 0; i < 30; i++) {
    if (window.particles && window.ParticlePool) {
      window.particles.push(
        window.ParticlePool.get(
          w / 2,
          h / 2,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          Math.random() * 3 + 1.5,
          isArt ? "#9b59b6" : Math.random() > 0.5 ? "#bdc3c7" : "#e74c3c",
          1,
          35,
          0.25,
          true,
        ),
      );
    }
  }

  let logReport = scrapsGained.map((s) => `x${s.qty} ${s.name}`).join(", ");
  if (inDungeonRun) {
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e74c3c;'>[RUN SALVAGE]</span> Salvaged ${item.name} into run satchel: ${logReport} (Secured upon Extraction)`,
      );
  } else {
    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e74c3c;'>[SALVAGE]</span> Dismantled ${item.name} yielding: ${logReport}`,
      );
  }
  if (window.forgeSelectedItem && window.forgeSelectedItem.id === id) {
    window.forgeSelectedItem = null;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  }

  if (typeof window.resolvePlayerStats === "function") {
    let newMaxHp = window.resolvePlayerStats().maxHp;
    let ba = BigNum.from(window.playerStats.currentHp);
    let bb = BigNum.from(newMaxHp);
    window.playerStats.currentHp = ba.gt(bb) ? bb : ba;
  }
  if (typeof window.checkAchievements === "function")
    window.checkAchievements();
  window.state.paperDollDirty = true;
  window.state.inventoryDirty = true;
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.renderInventory === "function") window.renderInventory();
  if (typeof window.saveGame === "function") window.saveGame();
};

window.salvageItem = function (id) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let item = window.inventory.EQUIP.find((i) => i.id === id);
  let isEquipped = false;
  let slotToClear = null;
  let isArtifactSack = false;
  let isSigilSack = false;

  if (!item && window.inventory.ARTIFACT) {
    item = window.inventory.ARTIFACT.find((i) => i.id === id);
    if (item) isArtifactSack = true;
  }
  if (!item && window.inventory.SIGIL) {
    item = window.inventory.SIGIL.find((i) => i.id === id);
    if (item) isSigilSack = true;
  }
  if (!item) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
        item = window.equippedSlots[k];
        isEquipped = true;
        slotToClear = k;
        break;
      }
    }
  }
  if (!item) return;

  if (item.locked) {
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("Cannot salvage a Locked item!", "#e74c3c");
    return;
  }

  // Anti-Exploit: Untempered starter gear cannot be salvaged for free materials
  if (item.isStarterItem && (item.temperLevel || 0) === 0 && !item.reforgedProperty && !item.totalEnchants) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("[SYSTEM] Untempered starter gear cannot be salvaged.", "#e74c3c");
    }
    return;
  }

  // Check if item is Unique and not yet unlocked in Spectral Codex
  if (typeof window.isItemUnique === "function" && window.isItemUnique(item)) {
    let uniqueKey = window.getUniqueKey(item);
    let isUnlocked =
      window.playerStats.spectralCodex &&
      window.playerStats.spectralCodex.includes(uniqueKey);

    if (!isUnlocked && typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "⚠️ Unique Not in Codex",
        `This Unique item (<strong>${item.name}</strong>) is not yet unlocked in your Spectral Codex.<br><br>Salvaging it now will forfeit its active passive in your Codex. Are you sure you want to salvage it for materials instead?`,
        "Yes, Salvage",
        "Cancel",
        "#e74c3c",
        () => {
          window.executeSalvageItemLogic(
            item,
            id,
            isEquipped,
            slotToClear,
            isArtifactSack,
            isSigilSack,
          );
        },
      );
      return;
    }
  }

  window.executeSalvageItemLogic(
    item,
    id,
    isEquipped,
    slotToClear,
    isArtifactSack,
    isSigilSack,
  );
};

// Append checkAutoSalvage inside window.GameState namespace
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  checkAutoSalvage(item, silent = false) {
      if (!item || item.type === "artifact" || item.statsRolled === "UNIQUE")
        return false;
      if (item.isStarterItem && (item.temperLevel || 0) === 0 && !item.reforgedProperty)
        return false;
    if (
      window.playerStats.autoSalvageThreshold === undefined ||
      window.playerStats.autoSalvageThreshold < 0
    )
      return false;

    if (item.statsRolled <= window.playerStats.autoSalvageThreshold) {
      let rolledTier = item.statsRolled;
      let scrapName = window.getScrapYieldName(rolledTier);
      let yieldAmount = Math.floor(Math.random() * 3) + 1;
      let activeHarvest = [];

      if (typeof window.addEtcDrop === "function")
        window.addEtcDrop(scrapName, yieldAmount);
      activeHarvest.push(`x${yieldAmount} ${scrapName}`);

      for (let t = rolledTier - 1; t >= 0; t--) {
        if (Math.random() < 0.6) {
          let lowerYield = Math.floor(Math.random() * 2) + 1;
          let lowerName = window.getScrapYieldName(t);
          if (typeof window.addEtcDrop === "function")
            window.addEtcDrop(lowerName, lowerYield);
          activeHarvest.push(`x${lowerYield} ${lowerName}`);
        }
      }

      window.playerStats.itemsSalvaged =
        (window.playerStats.itemsSalvaged || 0) + 1;

      if (!silent) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>[AUTO-SALVAGE]</span> Automatically deconstructed ${item.name} into: ${activeHarvest.join(", ")}`,
          );
        if (typeof window.pushToast === "function")
          window.pushToast(
            item.name,
            item.statsRolled,
            window.getTierColor(item.statsRolled),
            true,
            1,
            `⚡ Auto-Salvaged: <span style="color:#e74c3c;">${item.name}</span>`,
            null,
            false,
            item,
          );
      }
      return true;
    }
    return false;
  },
});

// Legacy Compatibility Aliases to protect references
window.checkAutoSalvage = (item, silent) =>
  window.GameState.checkAutoSalvage(item, silent);

// --- FORGE ENGINE ACTIONS & CRAFTING MATH ---

// Initialize the ForgeManager namespace and define getMaxTemper
window.ForgeManager = {
  getMaxTemper(stars, type = "") {
    if (stars === "UNIQUE") return 6;
    // Shifted design restriction: maximum temper matches stars rating tier + 1
    return stars + 1;
  },
};

// Legacy Compatibility Aliases to protect references
window.getMaxTemper = (stars, type = "") =>
  window.ForgeManager.getMaxTemper(stars, type);

// Append getRequiredScrapForTemper inside ForgeManager
Object.assign(window.ForgeManager, {
  getRequiredScrapForTemper(item) {
    if (!item) return "Monster Soul";
    if (item.type === "artifact" || item.statsRolled === "UNIQUE")
      return "Catalyst Core";

    const scraps = [
      "Monster Soul",
      "Rare Scrap",
      "Magic Scrap",
      "Epic Scrap",
      "Legendary Scrap",
      "Mythic Scrap",
    ];
    let tierIndex = item.temperLevel || 0;
    return scraps[tierIndex] || "Mythic Scrap";
  },
});

// Legacy Compatibility Aliases to protect references
window.getRequiredScrapForTemper = (item) =>
  window.ForgeManager.getRequiredScrapForTemper(item);

// Append getRequiredScrapAmountForTemper inside ForgeManager
Object.assign(window.ForgeManager, {
  getRequiredScrapAmountForTemper(item) {
    if (!item) return 1;
    let isArtifact = item.type === "artifact" || item.statsRolled === "UNIQUE";
    let targetLevel = (item.temperLevel || 0) + 1;

    if (isArtifact) {
      if (targetLevel <= 2) return 1;
      if (targetLevel <= 4) return 2;
      return 3;
    }

    let stageScaleFactor = 1 + Math.floor((item.stageLevel || 1) / 15);
    const baseAmounts = [50, 20, 10, 5, 3, 1];
    let baseAmount = baseAmounts[item.temperLevel] || 1;
    return baseAmount * stageScaleFactor;
  },
});

// Legacy Compatibility Aliases to protect references
window.getRequiredScrapAmountForTemper = (item) =>
  window.ForgeManager.getRequiredScrapAmountForTemper(item);

// Append getTemperGoldCost inside ForgeManager
Object.assign(window.ForgeManager, {
  getTemperGoldCost(item) {
    let baseCost = item.type === "artifact" ? 1000 : 100;
    let itemLvlMultiplier = BigNum.from(1.045).pow(
      Math.max(0, (item.stageLevel - 1) * 5),
    );
    return BigNum.from(baseCost)
      .mul(BigNum.from(1.5).pow(item.temperLevel))
      .mul(itemLvlMultiplier);
  },
});

// Legacy Compatibility Aliases to protect references
window.getTemperGoldCost = (item) =>
  window.ForgeManager.getTemperGoldCost(item);

// Append getTierUpScrapName inside ForgeManager
Object.assign(window.ForgeManager, {
  getTierUpScrapName(stars) {
    if (stars === 5) return "Mythic Scrap";
    if (stars === 4) return "Legendary Scrap";
    if (stars === 3) return "Epic Scrap";
    if (stars === 2) return "Magic Scrap";
    if (stars === 1) return "Rare Scrap";
    return "Monster Soul";
  },
});

// Legacy Compatibility Aliases to protect references
window.getTierUpScrapName = (stars) =>
  window.ForgeManager.getTierUpScrapName(stars);

// Append getMaxEnchants inside ForgeManager
Object.assign(window.ForgeManager, {
  getMaxEnchants(item) {
    if (item.statsRolled === "UNIQUE" || !item.statsRolled) return 0;
    if (item.statsRolled === 2) return 1;
    if (item.statsRolled === 3) return 2;
    if (item.statsRolled === 4) return 3;
    if (item.statsRolled === 5) return 4;
    return 0;
  },
});

// Legacy Compatibility Aliases to protect references
window.getMaxEnchants = (item) => window.ForgeManager.getMaxEnchants(item);

// Append Enchantment Helpers inside ForgeManager
Object.assign(window.ForgeManager, {
  getEnchantmentSymbol(count) {
    if (!count || count <= 0) return "";
    if (count === 1) return "✦";
    if (count === 2) return "✹";
    if (count === 3) return "❂";
    return "🌌";
  },

  getStatEnchantSuffix(item, statKey) {
    if (item.enchantments && item.enchantments[statKey]) {
      let count = item.enchantments[statKey];
      let symbol = this.getEnchantmentSymbol(count);
      return ` <span style="color:#9b59b6; font-weight:bold;" title="Enchanted ${count} time(s)">${symbol}</span>`;
    }
    return "";
  },
});

// Legacy Compatibility Aliases to protect references
window.getEnchantmentSymbol = (count) =>
  window.ForgeManager.getEnchantmentSymbol(count);
window.getStatEnchantSuffix = (item, statKey) =>
  window.ForgeManager.getStatEnchantSuffix(item, statKey);

// Append getStatIcon inside ForgeManager
Object.assign(window.ForgeManager, {
  getStatIcon(stat) {
    return window.getUiIconSvg(stat, 12) || "❖";
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatIcon = (stat) => window.ForgeManager.getStatIcon(stat);

// --- FORGE UI INTERACTIONS ---

// Append selectForgeItem inside ForgeManager
Object.assign(window.ForgeManager, {
  selectForgeItem(id) {
    let item =
      window.inventory.EQUIP.find((i) => i.id === id) ||
      (window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === id));
    if (!item) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === id) {
          item = window.equippedSlots[k];
          break;
        }
      }
    }
    window.forgeSelectedItem = item;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
  selectForgeSlot(slotKey) {
    window.state.selectedForgeSlot = slotKey;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectForgeItem = (id) => window.ForgeManager.selectForgeItem(id);
window.selectForgeSlot = (slotKey) =>
  window.ForgeManager.selectForgeSlot(slotKey);

window.toggleForgeModal = function () {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let modal = document.getElementById("forge-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    modal.style.display = "flex";
    window.setForgeMode(window.forgeMode || "temper");
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  } else {
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
  }
};

// Append setForgeMode inside ForgeManager
Object.assign(window.ForgeManager, {
  setForgeMode(mode) {
    window.forgeMode = mode;
    const modes = ["temper", "reforge", "tier"];
    modes.forEach((m) => {
      let el = document.getElementById("btn-mode-" + m);
      if (el) {
        el.className = "forge-mode-btn";
        el.style.background = "rgba(15, 23, 42, 0.8)";
      }
    });

    let activeEl = document.getElementById("btn-mode-" + mode);
    if (activeEl) {
      activeEl.className = "forge-mode-btn active";
      if (mode === "temper")
        activeEl.style.background = "rgba(41, 128, 185, 0.35)";
      if (mode === "reforge")
        activeEl.style.background = "rgba(142, 68, 173, 0.35)";
      if (mode === "tier")
        activeEl.style.background = "rgba(230, 126, 34, 0.35)";
    }

    // Register visited sub-tab
    if (window.playerStats && window.playerStats.visitedSubTabs) {
      let subTabKey = "forge_" + mode;
      if (!window.playerStats.visitedSubTabs.includes(subTabKey)) {
        window.playerStats.visitedSubTabs.push(subTabKey);
      }
    }

    // Evaluate triggers on every single forge mode change
    setTimeout(() => {
      if (window.HoorTutorial) {
        window.HoorTutorial.checkTriggers();
      }
    }, 100);

    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.setForgeMode = (mode) => window.ForgeManager.setForgeMode(mode);

// Append switchForgeStation inside ForgeManager
Object.assign(window.ForgeManager, {
  switchForgeStation(station) {
    let bm = document.getElementById("blacksmith-modes");
    let em = document.getElementById("enchanter-modes");

    let btnBlacksmith = document.getElementById("btn-forge-station-blacksmith");
    let btnEnchanter = document.getElementById("btn-forge-station-enchanter");

    if (station === "blacksmith") {
      if (btnBlacksmith) btnBlacksmith.classList.add("active");
      if (btnEnchanter) btnEnchanter.classList.remove("active");

      if (bm) {
        bm.classList.remove("hidden");
        bm.style.removeProperty("display");
      }
      if (em) {
        em.classList.add("hidden");
        em.style.removeProperty("display");
      }
      window.setForgeMode("temper");
    } else {
      if (btnBlacksmith) btnBlacksmith.classList.remove("active");
      if (btnEnchanter) btnEnchanter.classList.add("active");

      if (bm) {
        bm.classList.add("hidden");
        bm.style.removeProperty("display");
      }
      if (em) {
        em.classList.remove("hidden");
        em.style.removeProperty("display");
      }
      window.setForgeMode("enchant");
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.switchForgeStation = (station) =>
  window.ForgeManager.switchForgeStation(station);

// Append changeAutoSalvage inside ForgeManager
Object.assign(window.ForgeManager, {
  changeAutoSalvage(val) {
    window.playerStats.autoSalvageThreshold = parseInt(val, 10);
    if (typeof window.saveGame === "function") window.saveGame();
    if (typeof window.updateSalvagePadUI === "function")
      window.updateSalvagePadUI();
    if (typeof window.pushHeaderToast === "function") {
      let tierText = val == -1 ? "Disabled" : `${val}★ and under`;
      window.pushHeaderToast(
        `Auto-Salvage Threshold set to: ${tierText}`,
        "#2ecc71",
      );
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.changeAutoSalvage = (val) => window.ForgeManager.changeAutoSalvage(val);

// Append selectBulkSalvageRarity inside ForgeManager
Object.assign(window.ForgeManager, {
  selectBulkSalvageRarity(val) {
    window.state.bulkSalvageTarget = parseInt(val, 10);
    if (typeof window.updateSalvagePadUI === "function")
      window.updateSalvagePadUI();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectBulkSalvageRarity = (val) =>
  window.ForgeManager.selectBulkSalvageRarity(val);

// Append triggerBulkSalvage inside ForgeManager
Object.assign(window.ForgeManager, {
  triggerBulkSalvage() {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let maxStars =
      window.state.bulkSalvageTarget !== undefined
        ? window.state.bulkSalvageTarget
        : 0;

    let targetItems = window.inventory.EQUIP.filter(
      (item) =>
        !item.locked &&
        item.statsRolled !== "UNIQUE" &&
        item.statsRolled <= maxStars,
    );
    if (targetItems.length === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "No eligible unlocked items found under this rarity!",
          "#e74c3c",
        );
      return;
    }

    let label =
      maxStars === 0
        ? "Common Gear (0★)"
        : window.getTierName(maxStars) + " & Under";

    if (typeof window.showCustomConfirm === "function") {
      window.showCustomConfirm(
        "Bulk Deconstruct",
        `Are you sure you want to bulk salvage ${targetItems.length} unlocked items (${label})?`,
        "Deconstruct",
        "Cancel",
        "#e74c3c",
        () => {
          let bulkScrapsHarvested = {};
          function incrementScrap(name, amount) {
            if (!bulkScrapsHarvested[name]) bulkScrapsHarvested[name] = 0;
            bulkScrapsHarvested[name] += amount;
            if (typeof window.addEtcDrop === "function")
              window.addEtcDrop(name, amount, true);
          }

          targetItems.forEach((item) => {
            let rolledTier = item.statsRolled;
            let scrapName = window.getScrapYieldName(rolledTier);
            let yieldAmount = Math.floor(Math.random() * 3) + 1;

            incrementScrap(scrapName, yieldAmount);

            for (let t = rolledTier - 1; t >= 0; t--) {
              if (Math.random() < 0.6) {
                let lowerYield = Math.floor(Math.random() * 2) + 1;
                let lowerName = window.getScrapYieldName(t);
                incrementScrap(lowerName, lowerYield);
              }
            }

            if (
              window.forgeSelectedItem &&
              window.forgeSelectedItem.id === item.id
            ) {
              window.forgeSelectedItem = null;
            }
          });

          window.playerStats.itemsSalvaged =
            (window.playerStats.itemsSalvaged || 0) + targetItems.length;

          if (typeof window.progressMission === "function") {
            window.progressMission("salvage", targetItems.length);
          }
          if (window.playerStats.pendingClanProgress) {
            window.playerStats.pendingClanProgress.salvage =
              (window.playerStats.pendingClanProgress.salvage || 0) +
              targetItems.length;
          }

          let targetIds = new Set(targetItems.map((item) => item.id));
          window.inventory.EQUIP = window.inventory.EQUIP.filter(
            (item) => !targetIds.has(item.id),
          );

          let cvs = document.getElementById("gameCanvas");
          let w = cvs ? cvs.width : 750;
          let h = cvs ? cvs.height : 250;
          for (let i = 0; i < 45; i++) {
            if (window.particles && window.ParticlePool) {
              let partLife = Math.floor(Math.random() * 30 + 15);
              window.particles.push(
                window.ParticlePool.get(
                  w / 2 + (Math.random() - 0.5) * 120,
                  h / 2 + (Math.random() - 0.5) * 40,
                  (Math.random() - 0.5) * 12,
                  (Math.random() - 0.7) * 9,
                  Math.random() * 3.5 + 1.5,
                  Math.random() > 0.5 ? "#7f8c8d" : "#e74c3c",
                  1,
                  partLife,
                  0.25,
                  true,
                ),
              );
            }
          }

          let outputReport = Object.keys(bulkScrapsHarvested)
            .map((k) => `x${bulkScrapsHarvested[k]} ${k}`)
            .join(", ");

          if (typeof window.pushLog === "function")
            window.pushLog(
              `<span style='color:#e74c3c;'>[BULK SALVAGE]</span> Dismantled ${targetItems.length} items. Harvested: ${outputReport}`,
            );
          if (typeof window.pushHeaderToast === "function")
            window.pushHeaderToast(
              "♻️ Bulk Salvaged " + targetItems.length + " Items!",
              "#e74c3c",
            );

          if (typeof window.resolvePlayerStats === "function") {
            let newMaxHp = window.resolvePlayerStats().maxHp;
            window.playerStats.currentHp = Math.max(
              1,
              Math.min(
                newMaxHp,
                Math.floor(
                  (window.playerStats.currentHp / oldMaxHp) * newMaxHp,
                ),
              ),
            );
          }

          if (typeof window.checkAchievements === "function")
            window.checkAchievements();
          if (typeof window.updateUI === "function") window.updateUI();
          if (typeof window.renderInventory === "function")
            window.renderInventory();
          if (typeof window.renderForgeTab === "function")
            window.renderForgeTab();
          if (typeof window.saveGame === "function") window.saveGame();
        },
      );
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.triggerBulkSalvage = () => window.ForgeManager.triggerBulkSalvage();

// --- FORGE CRAFTING PROCESSES ---

// Append temperItem inside ForgeManager
Object.assign(window.ForgeManager, {
  temperItem() {
    if (window.forgeMode === "temper") {
      let slotKey = window.state.selectedForgeSlot || "weapon";
      window.playerStats.slotUpgrades = window.playerStats.slotUpgrades || {
        weapon: 0,
        subweapon: 0,
        helmet: 0,
        chest: 0,
        leggings: 0,
        overall: 0,
        boots: 0,
        ring1: 0,
        ring2: 0,
        art1: 0,
        art2: 0,
        art3: 0,
      };
      let curLvl = window.playerStats.slotUpgrades[slotKey] || 0;
      if (curLvl >= 100) return;

      let cost = window.getSlotUpgradeCost(slotKey, curLvl);
      let coins = BigNum.from(window.playerStats.coins);
      if (coins.lt(cost.gold)) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            "❌ Not enough Gold to attune slot!",
            "#e74c3c",
          );
        return;
      }

      for (let mat of cost.materials) {
        let owned =
          window.inventory.ETC[mat.name] || window.inventory.USE[mat.name] || 0;
        if (owned < mat.qty) {
          if (typeof window.pushHeaderToast === "function")
            window.pushHeaderToast(
              `❌ Lacking required ${mat.name}!`,
              "#e74c3c",
            );
          return;
        }
      }

      // Deduct resources
      window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
        cost.gold,
      );
      if (window.playerStats.coins.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }

      for (let mat of cost.materials) {
        if (window.inventory.ETC[mat.name] !== undefined) {
          window.inventory.ETC[mat.name] -= mat.qty;
          if (window.inventory.ETC[mat.name] === 0)
            delete window.inventory.ETC[mat.name];
        } else if (window.inventory.USE[mat.name] !== undefined) {
          window.inventory.USE[mat.name] -= mat.qty;
          if (window.inventory.USE[mat.name] === 0)
            delete window.inventory.USE[mat.name];
        }
      }

      window.playerStats.slotUpgrades[slotKey]++;

            // Recalculate statistics for the equipped item on the fly and trigger redraw flags
            let eqItem = window.equippedSlots[slotKey];
            if (eqItem) {
              if (eqItem.isStarterItem) {
                delete eqItem.isStarterItem; // Permanently promote starter item into standard gear
              }
              window.recalculateItemStats(eqItem);
            }
      window.state.paperDollDirty = true;
      window.invalidatePlayerStats();

      window.playerStats.totalTempers =
        (window.playerStats.totalTempers || 0) + 1;

      if (window.playerStats.pendingClanProgress) {
        window.playerStats.pendingClanProgress.tempers =
          (window.playerStats.pendingClanProgress.tempers || 0) + 1;
      }
      if (typeof window.progressMission === "function") {
        window.progressMission("tempers", 1);
      }

      let displayKey = slotKey.toUpperCase();
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style='color:#e67e22;'>[FORGE]</span> Successfully attuned the <strong style='color:#f1c40f;'>${displayKey} SLOT</strong> to Level ${window.playerStats.slotUpgrades[slotKey]}!`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `🔨 Attuned ${displayKey} to Lv. ${window.playerStats.slotUpgrades[slotKey]}!`,
          "#2ecc71",
        );
      if (typeof window.spawnTemperParticles === "function")
        window.spawnTemperParticles(true);
      if (typeof window.checkAchievements === "function")
        window.checkAchievements();
    } else if (window.forgeMode === "tier") {
      if (window.forgeSelectedItem.statsRolled >= 5) return;
      let currentStars = window.forgeSelectedItem.statsRolled;
      let targetStars = currentStars + 1;
      let costGold = targetStars * 2500;
      let shardReq = targetStars;
      let scrapReqAmount = targetStars * 5;
      let targetScrapName = window.getScrapYieldName(targetStars);

      let playerShards = window.inventory.ETC["Eridium Shard"] || 0;
      let playerScraps = window.inventory.ETC[targetScrapName] || 0;
      let coins = BigNum.from(window.playerStats.coins);

      if (coins.lt(costGold)) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough Gold to Tier Up!</span>`,
          );
        return;
      }
      if (playerShards < shardReq) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough Eridium Shards!</span>`,
          );
        return;
      }
      if (playerScraps < scrapReqAmount) {
        if (typeof window.pushLog === "function")
          window.pushLog(
            `<span style='color:#e74c3c;'>Not enough ${targetScrapName}!</span>`,
          );
        return;
      }

      window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
        costGold,
      );
      window.inventory.ETC["Eridium Shard"] -= shardReq;
      if (window.inventory.ETC["Eridium Shard"] === 0)
        delete window.inventory.ETC["Eridium Shard"];

      window.inventory.ETC[targetScrapName] -= scrapReqAmount;
      if (window.inventory.ETC[targetScrapName] === 0)
        delete window.inventory.ETC[targetScrapName];

      window.scaleItemBonusStats(
        window.forgeSelectedItem,
        currentStars,
        targetStars,
      );

      window.forgeSelectedItem.statsRolled++;
      window.addRandomStatLineToItem(window.forgeSelectedItem);
      window.forgeSelectedItem.name = window.buildProceduralName(
        window.forgeSelectedItem,
      );

      if (typeof window.pushLog === "function")
        window.pushLog(
          `<span style='color:#e67e22;'>[FORGE]</span> Successfully Tiered Up ${window.forgeSelectedItem.name} to ${window.forgeSelectedItem.statsRolled}★!`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "⭐ Tier Up! " + window.forgeSelectedItem.statsRolled + "★",
          "#e67e22",
        );
      if (typeof window.spawnTemperParticles === "function")
        window.spawnTemperParticles(true);
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.temperItem = () => window.ForgeManager.temperItem();

// Append enchantItem inside ForgeManager
Object.assign(window.ForgeManager, {
  enchantItem() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;

    let slotKey =
      item.isEquippedSlot ||
      (item.type === "subweapon" ? "subweapon" : item.type);
    let slotLevel = 0;

    if (item.type === "ring" && !item.isEquippedSlot) {
      // Check the highest of your two ring slots for unequipped inventory rings
      slotLevel = Math.max(
        window.playerStats.slotUpgrades.ring1 || 0,
        window.playerStats.slotUpgrades.ring2 || 0,
      );
    } else {
      slotLevel =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[slotKey]) ||
        0;
    }

    if (slotLevel < 50) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `Slot Attunement Level 50 Required! (${slotLevel}/50)`,
          "#e74c3c",
        );
      return;
    }

    let maxEnchants = this.getMaxEnchants(item);
    let currentEnchants = item.totalEnchants || 0;
    if (currentEnchants >= maxEnchants) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Max Enchantments Reached!", "#e74c3c");
      return;
    }

    let playerEssence = window.inventory.ETC["Astral Essence"] || 0;
    if (playerEssence < 1) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Requires 1 Astral Essence!", "#e74c3c");
      return;
    }

    let validStats = [];
    const ENCHANTABLE_STATS = [
      "atk",
      "maxHp",
      "def",
      "moveSpeed",
      "critChance",
      "critDamage",
      "block",
      "parry",
      "str",
      "dex",
      "int",
      "activeAttackSpeed",
      "idleAttackSpeed",
    ];
    ENCHANTABLE_STATS.forEach((stat) => {
      if (stat === "activeAttackSpeed" || stat === "idleAttackSpeed") {
        if (item[stat] < 0) validStats.push(stat);
      } else {
        if (item[stat] > 0) validStats.push(stat);
      }
    });

    if (validStats.length === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          "This item has no stat lines to enchant!",
          "#e74c3c",
        );
      return;
    }

    window.inventory.ETC["Astral Essence"]--;
    if (window.inventory.ETC["Astral Essence"] === 0)
      delete window.inventory.ETC["Astral Essence"];

    if (!item.originalStats) {
      item.originalStats = {
        atk: item.atk,
        maxHp: item.maxHp,
        def: item.def,
        moveSpeed: item.moveSpeed,
        critChance: item.critChance,
        critDamage: item.critDamage,
        block: item.block,
        parry: item.parry,
        activeAttackSpeed: item.activeAttackSpeed,
        idleAttackSpeed: item.idleAttackSpeed,
        str: item.str,
        dex: item.dex,
        int: item.int,
      };
    }

    let selectedStat =
      validStats[Math.floor(Math.random() * validStats.length)];

    item.enchantments = item.enchantments || {};
    item.enchantments[selectedStat] =
      (item.enchantments[selectedStat] || 0) + 1;
    item.totalEnchants = (item.totalEnchants || 0) + 1;
    window.playerStats.totalEnchants =
      (window.playerStats.totalEnchants || 0) + 1;
    if (typeof window.checkAchievements === "function")
      window.checkAchievements();

    const integerStats = ["atk", "maxHp", "def", "str", "dex", "int"];
    if (integerStats.includes(selectedStat)) {
      item[selectedStat] = Math.ceil(item[selectedStat] * 1.25);
    } else {
      item[selectedStat] = parseFloat((item[selectedStat] * 1.25).toFixed(4));
    }

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#9b59b6;'>[ENCHANTER]</span> Successfully infused <strong style='color:#9b59b6;'>${this.getStatIcon(selectedStat)} ${selectedStat.toUpperCase()}</strong> by 25% on ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(
        `🔮 Enchanted: +25% ${selectedStat.toUpperCase()}!`,
        "#9b59b6",
      );

    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 35; i++) {
      if (window.particles && window.ParticlePool) {
        window.particles.push(
          window.ParticlePool.get(
            w / 2,
            h / 2,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            Math.random() * 3 + 1,
            "#9b59b6",
            1,
            40,
            0.25,
            true,
          ),
        );
      }
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.enchantItem = () => window.ForgeManager.enchantItem();

// Append resetItemEnchants inside ForgeManager
Object.assign(window.ForgeManager, {
  resetItemEnchants() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (!item.totalEnchants || item.totalEnchants === 0) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("No enchants to reset!", "#e74c3c");
      return;
    }

    let resetGoldCost = 1000 * item.stageLevel * (item.statsRolled || 1);
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(resetGoldCost)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Not enough Gold to reset!", "#e74c3c");
      return;
    }

    window.playerStats.coins = coins.sub(resetGoldCost);

    if (item.originalStats) {
      for (let key in item.originalStats) {
        item[key] = item.originalStats[key];
      }
      delete item.originalStats;
    }
    delete item.enchantments;
    item.totalEnchants = 0;

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e74c3c;'>[ENCHANTER]</span> Purged all enchantments from ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(`🧹 Purged Enchantments!`, "#e74c3c");

    let cvs = document.getElementById("gameCanvas");
    let w = cvs ? cvs.width : 750;
    let h = cvs ? cvs.height : 250;
    for (let i = 0; i < 35; i++) {
      if (window.particles && window.ParticlePool) {
        window.particles.push(
          window.ParticlePool.get(
            w / 2,
            h / 2,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            Math.random() * 2 + 1,
            "#7f8c8d",
            1,
            30,
            0.25,
            true,
          ),
        );
      }
    }

    if (typeof window.resolvePlayerStats === "function") {
      let newMaxHp = window.resolvePlayerStats().maxHp;
      window.playerStats.currentHp = Math.min(
        window.playerStats.currentHp,
        newMaxHp,
      );
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.resetItemEnchants = () => window.ForgeManager.resetItemEnchants();

// Append getStatLabel inside ForgeManager
Object.assign(window.ForgeManager, {
  getStatLabel(propKey) {
    const labels = {
      bonusAtk: "Attack",
      bonusMaxHp: "Max HP",
      bonusDef: "Defense",
      bonusMoveSpeed: "Move Speed",
      bonusCritChance: "Crit Chance",
      bonusCritDamage: "Crit Multi",
      bonusBlock: "Block Rate",
      bonusParry: "Parry Rate",
      bonusActiveSpeed: "Active Atk Spd",
      bonusIdleSpeed: "Idle Atk Spd",
      bonusStr: "Strength",
      bonusDex: "Dexterity",
      bonusInt: "Intelligence",

      atk: "Attack",
      maxHp: "Max HP",
      def: "Defense",
      moveSpeed: "Move Speed",
      critChance: "Crit Chance",
      critDamage: "Crit Multi",
      block: "Block Rate",
      parry: "Parry Rate",
      activeAttackSpeed: "Active Atk Spd",
      idleAttackSpeed: "Idle Atk Spd",
      str: "Strength",
      dex: "Dexterity",
      int: "Intelligence",

      // Medal/Title stats mapping
      drop: "Drop Rate",
      qly: "Drop Quality",
      gold: "Gold Multiplier",
      xpRate: "XP Rate",
      fairySpawn: "Fairy Spawn Rate",
      rareSpawn: "Rare Spawn Rate",
    };
    return labels[propKey] || propKey;
  },
});

// Legacy Compatibility Aliases to protect references
window.getStatLabel = (propKey) => window.ForgeManager.getStatLabel(propKey);

// Append lockForgeStat inside ForgeManager
Object.assign(window.ForgeManager, {
  lockForgeStat(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.reforgedProperty = propKey;
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("Stat line locked for Reforging!", "#f1c40f");
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.lockForgeStat = (propKey) => window.ForgeManager.lockForgeStat(propKey);

// Append selectReforgeStat inside ForgeManager
Object.assign(window.ForgeManager, {
  selectReforgeStat(propKey) {
    if (!window.forgeSelectedItem) return;
    window.forgeSelectedItem.tempReforgeProp = propKey;
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
  },
});

// Legacy Compatibility Aliases to protect references
window.selectReforgeStat = (propKey) =>
  window.ForgeManager.selectReforgeStat(propKey);

// Append reforgeItemStat inside ForgeManager
Object.assign(window.ForgeManager, {
  reforgeItemStat() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (window.playerStats.pendingClanProgress) {
      window.playerStats.pendingClanProgress.reforges =
        (window.playerStats.pendingClanProgress.reforges || 0) + 1;
    }

    if (!item.reforgedProperty) {
      if (!item.tempReforgeProp) {
        if (typeof window.pushHeaderToast === "function")
          window.pushHeaderToast(
            "Select a stat line to re-roll first!",
            "#e74c3c",
          );
        return;
      }
      item.reforgedProperty = item.tempReforgeProp;
    }

    let rProp = item.reforgedProperty;
    let itemLvlMultiplier = Math.pow(
      1.045,
      Math.max(0, (item.stageLevel - 1) * 5),
    );
    let costGold = Math.floor(
      150 * itemLvlMultiplier * Math.pow(2, item.statsRolled),
    );

    let ownedSigil = window.inventory.ETC["Overlord's Sigil"] || 0;
    let coins = BigNum.from(window.playerStats.coins);

    if (coins.lt(costGold)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Not enough Gold!", "#e74c3c");
      return;
    }
    if (ownedSigil < 1) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("Requires 1 Overlord's Sigil!", "#e74c3c");
      return;
    }

    window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
      costGold,
    );
    window.inventory.ETC["Overlord's Sigil"]--;
    if (window.inventory.ETC["Overlord's Sigil"] === 0)
      delete window.inventory.ETC["Overlord's Sigil"];

    item[rProp] = 0;

    let mapping = {
      bonusAtk: "atk",
      bonusMaxHp: "maxHp",
      bonusDef: "def",
      bonusMoveSpeed: "moveSpeed",
      bonusCritChance: "critChance",
      bonusCritDamage: "critDamage",
      bonusBlock: "block",
      bonusParry: "parry",
      bonusActiveSpeed: "activeAttackSpeed",
      bonusIdleSpeed: "idleAttackSpeed",
      bonusStr: "str",
      bonusDex: "dex",
      bonusInt: "int",
    };

    let possiblePool = Object.keys(mapping);
    if (item.type === "subweapon") {
      if (item.subType === "shield")
        possiblePool = [
          "bonusBlock",
          "bonusAtk",
          "bonusMaxHp",
          "bonusDef",
          "bonusStr",
        ];
      else if (item.subType === "dagger")
        possiblePool = [
          "bonusParry",
          "bonusAtk",
          "bonusCritChance",
          "bonusDex",
        ];
      else if (item.subType === "tome")
        possiblePool = [
          "bonusCritDamage",
          "bonusInt",
          "bonusActiveSpeed",
          "bonusIdleSpeed",
        ];
    }

    let activeBonuses = possiblePool.filter(
      (k) =>
        k !== rProp &&
        item[k] !== 0 &&
        item[k] !== undefined &&
        item[k] !== null,
    );
    let eligiblePool = possiblePool.filter((k) => !activeBonuses.includes(k));
    if (eligiblePool.length === 0) eligiblePool = possiblePool;

    let newProp = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    let stageScale = item.stageLevel || 1;
    let effStageScale = window.getEffectiveStage(stageScale * 5) / 10;
    // Mapped on 5-stage scale to align with the standard campaign progression curve
    let expScale = Math.pow(1.58, effStageScale);
    let hpDefExpScale = Math.pow(1.56, effStageScale);
    let rarityMult = 1 + item.statsRolled * 0.15;
    let rolledValue = 0;

    if (newProp === "bonusAtk")
      rolledValue = Math.ceil(
        window.randFloat(0.15, 0.35) * expScale * rarityMult,
      );
    else if (newProp === "bonusMaxHp")
      rolledValue = Math.ceil(
        window.randFloat(0.4, 1.2) * hpDefExpScale * rarityMult,
      );
    else if (newProp === "bonusDef")
      rolledValue = Math.ceil(
        window.randFloat(0.15, 0.35) * hpDefExpScale * rarityMult,
      );
    else if (newProp === "bonusMoveSpeed")
      rolledValue = Math.ceil(window.randInt(1, 2) * stageScale * rarityMult);
    else if (newProp === "bonusCritChance")
      rolledValue = parseFloat(
        Math.min(
          0.2,
          window.randFloat(0.01, 0.025) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusCritDamage")
      rolledValue = parseFloat(
        (
          window.randFloat(0.03, 0.06) *
          Math.sqrt(stageScale) *
          rarityMult
        ).toFixed(4),
      );
    else if (newProp === "bonusBlock")
      rolledValue = parseFloat(
        Math.min(
          0.15,
          window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusParry")
      rolledValue = parseFloat(
        Math.min(
          0.15,
          window.randFloat(0.005, 0.015) * Math.sqrt(stageScale) * rarityMult,
        ).toFixed(4),
      );
    else if (newProp === "bonusActiveSpeed") {
      let sScale = Math.pow(stageScale, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
      rolledValue = parseFloat(
        (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
      );
    } else if (newProp === "bonusIdleSpeed") {
      let sScale = Math.pow(stageScale, 0.3);
      let rMult = 1 + item.statsRolled * 0.08;
      let pMult = Math.pow(1.02, window.playerStats.prestigeCount || 0);
      rolledValue = parseFloat(
        (window.randFloat(0.01, 0.03) * sScale * rMult * pMult).toFixed(4),
      );
    } else if (newProp === "bonusStr")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusDex")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);
    else if (newProp === "bonusInt")
      rolledValue = Math.ceil(window.randInt(1, 3) * stageScale * rarityMult);

    item[newProp] = rolledValue;
        item.reforgedProperty = newProp;
        if (item.isStarterItem) {
          delete item.isStarterItem; // Permanently promote starter item into standard gear
        }

    window.recalculateItemStats(item);
    item.name = window.buildProceduralName(item);
    window.playerStats.totalReforges =
      (window.playerStats.totalReforges || 0) + 1;
    if (typeof window.progressMission === "function")
      window.progressMission("reforges", 1);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#e67e22;'>[FORGE]</span> Reforged modifier into <strong style='color:#2ecc71;'>${this.getStatLabel(newProp)} (+${rolledValue})</strong> on ${item.name}!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast("🔨 Stat Reforged!", "#2ecc71");

    if (typeof window.spawnTemperParticles === "function")
      window.spawnTemperParticles(true);
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderInventory === "function") window.renderInventory();
    if (typeof window.renderForgeTab === "function") window.renderForgeTab();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.reforgeItemStat = () => window.ForgeManager.reforgeItemStat();

// ==========================================================================
// --- MARKET & SHOP TRANSACTION LOGIC ---
// ==========================================================================

window.buyGachaCrate = function () {
  window.openGachaModal();
};

window.rollGachaCrateItem = function (
  isGlimmering = false,
  useStandardForGlimmering = false,
) {
  let p = window.resolvePlayerStats();
  let maxBag = window.getMaxBagSlots();

  let keyName = isGlimmering
    ? useStandardForGlimmering
      ? "Gacha Key"
      : "Glimmering Gachapon Key"
    : "Gacha Key";
  let keysNeeded = isGlimmering && useStandardForGlimmering ? 10 : 1;
  let keys = window.inventory.ETC[keyName] || 0;
  if (keys < keysNeeded) {
    return { error: `Insufficient ${keyName}s!` };
  }

  let allowArtifact = Math.random() < (isGlimmering ? 0.05 : 0.01);
  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
    "ring",
  ];
  let chosenType = allowArtifact
    ? "artifact"
    : types[Math.floor(Math.random() * types.length)];

  if (chosenType === "artifact") {
    if (window.inventory.ARTIFACT.length >= maxBag) {
      return { error: "Artifact Sack Full!" };
    }
  } else {
    if (window.inventory.EQUIP.length >= maxBag) {
      return { error: "Inventory Full!" };
    }
  }

  // Deduct key & save state
  window.inventory.ETC[keyName] -= keysNeeded;
  if (window.inventory.ETC[keyName] === 0) delete window.inventory.ETC[keyName];

  // --- PITY COUNTER ENGINE ---
  let isPityTriggered = false;
  if (isGlimmering) {
    window.playerStats.glimmeringPity =
      (window.playerStats.glimmeringPity || 0) + 1;
    if (window.playerStats.glimmeringPity >= 25) {
      isPityTriggered = true;
      window.playerStats.glimmeringPity = 0;
    }
  } else {
    window.playerStats.vendingPity = (window.playerStats.vendingPity || 0) + 1;
    if (window.playerStats.vendingPity >= 50) {
      isPityTriggered = true;
      window.playerStats.vendingPity = 0; // Reset pity
    }
  }

  let statLinesCount = 1;
  if (isPityTriggered) {
    statLinesCount = 5; // Guaranteed Mythic
  } else {
    let vendingLvl = window.playerStats.vendingQLevel || 0;
    let effectiveVendingLvl =
      vendingLvl * window.getMilestoneMultiplier(vendingLvl);
    let peakRunStage =
      window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
    let probs = window.calculateRarityProbabilities(
      p.qly + effectiveVendingLvl * 0.01,
      true,
      peakRunStage,
    );
    let roll = Math.random() * 100;
    let cumulative = 0;

    if (roll < (cumulative += probs[5])) {
      statLinesCount = 5;
      if (isGlimmering) {
        window.playerStats.glimmeringPity = 0;
      } else {
        window.playerStats.vendingPity = 0; // Natural pull resets pity
      }
    } else if (roll < (cumulative += probs[4])) {
      statLinesCount = 4;
    } else if (roll < (cumulative += probs[3])) {
      statLinesCount = 3;
    } else if (roll < (cumulative += probs[2])) {
      statLinesCount = 2;
    } else {
      statLinesCount = 1;
    }
  }

  let peakRunStage = window.playerStats.lifetimePeakStage || 1;
  let stageScale = Math.floor((peakRunStage - 1) / 5) + 1;
  let newItem = window.createItemObject(
    chosenType,
    statLinesCount,
    stageScale,
    0,
  );

  if (newItem.type === "artifact") {
    window.inventory.ARTIFACT.push(newItem);
  } else {
    window.inventory.EQUIP.push(newItem);
  }

  // Store inside active pull history log
  window.playerStats.gachaHistory = window.playerStats.gachaHistory || [];
  window.playerStats.gachaHistory.unshift(newItem);
  if (window.playerStats.gachaHistory.length > 5) {
    window.playerStats.gachaHistory.pop();
  }
  window.frozenItemDb[newItem.id] = window.cloneItemForTooltip(newItem);

  if (typeof window.logHighTierPull === "function") {
    window.logHighTierPull(newItem);
  }

  window.checkAchievements();
  window.saveGame();
  return { item: newItem };
};

// --- MERCHANT & TRANSACTION OPERATIONS ---

window.getGoldUpgradeCost = function (type, level) {
  let lvl = Math.max(0, level || 0);
  if (type === "vending") {
    return BigNum.from(15000).mul(BigNum.from(1.75).pow(lvl));
  } else if (type === "shop") {
    return BigNum.from(30000).mul(BigNum.from(1.95).pow(lvl));
  } else if (type === "global") {
    return BigNum.from(100000).mul(BigNum.from(2.25).pow(lvl));
  }
  return BigNum.from(10000);
};

window.activeShopTab = "gear";

window.updateShopHeaderWallet = function () {
  let goldEl = document.getElementById("shop-wallet-gold");
  let soulsEl = document.getElementById("shop-wallet-souls");
  if (goldEl && window.playerStats) {
    goldEl.innerText = window.formatNumber(window.playerStats.coins || 0);
  }
  if (soulsEl && window.inventory && window.inventory.ETC) {
    let souls = window.inventory.ETC["Monster Soul"] || 0;
    soulsEl.innerText = souls.toLocaleString();
  }
};

window.toggleShopModal = function () {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let modal = document.getElementById("shop-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    modal.style.display = "flex";
    if (
      !window.playerStats.shopItems ||
      window.playerStats.shopItems.length === 0
    ) {
      window.refreshShopStock(true);
    }
    window.updateShopHeaderWallet();
    window.switchShopTab(window.activeShopTab || "gear");
  } else {
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
  }
};

window.switchShopTab = function (tabKey) {
  window.activeShopTab = tabKey;
  ["gear", "alchemy", "sinks"].forEach((t) => {
    let btn = document.getElementById(`shop-tab-${t}`);
    if (btn) btn.classList.toggle("active", t === tabKey);
  });

  window.updateShopHeaderWallet();

  let content = document.getElementById("shop-content-panel");
  if (!content) return;

  if (tabKey === "gear") {
    window.renderMarketShop();
  } else if (tabKey === "alchemy") {
    window.renderMysticalShop();
  } else if (tabKey === "sinks") {
    window.renderGoldUpgrades();
  }
};

window.refreshShopStock = function (force = false) {
  let now = Date.now();
  let nextRefresh = window.playerStats.shopRefreshTime || 0;

  if (
    !force &&
    now < nextRefresh &&
    window.playerStats.shopItems &&
    window.playerStats.shopItems.length > 0
  ) {
    return;
  }

  let peakRunStage =
    window.playerStats.maxFloorCleared || window.playerStats.stage || 1;
  let stageScale = peakRunStage;
  let shopLvl = window.playerStats.shopQLevel || 0;

  let types = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
    "ring",
  ];
  let stock = [];

  for (let i = 0; i < 4; i++) {
    let chosenType = types[Math.floor(Math.random() * types.length)];
    let probs = window.calculateRarityProbabilities(
      1.0 + shopLvl * 0.02,
      false,
      stageScale,
    );
    let roll = Math.random() * 100;
    let cumulative = 0;
    let stars = 0;

    for (let s = 5; s >= 0; s--) {
      cumulative += probs[s];
      if (roll <= cumulative) {
        stars = s;
        break;
      }
    }

    let item = window.createItemObject(chosenType, stars, stageScale, 0);
    let costMult = 250 * (1 + stageScale * 0.65) * Math.pow(1.65, stars);
    item.cost = BigNum.from(Math.ceil(costMult));
    item.purchased = false;
    stock.push(item);
  }

  window.playerStats.shopItems = stock;
  window.playerStats.shopRefreshTime = now + 3600000; // 1 hour
  if (typeof window.saveGame === "function") window.saveGame();
};

window.executeManualShopRefresh = function () {
  let soulsOwned =
    window.inventory && window.inventory.ETC
      ? window.inventory.ETC["Monster Soul"] || 0
      : 0;
  if (soulsOwned < 50) {
    window.pushHeaderToast(
      "[X] Requires 50 Monster Souls to refresh!",
      "#e74c3c",
    );
    return;
  }

  window.inventory.ETC["Monster Soul"] -= 50;
  if (window.inventory.ETC["Monster Soul"] === 0) {
    delete window.inventory.ETC["Monster Soul"];
  }

  window.refreshShopStock(true);
  window.updateShopHeaderWallet();
  window.pushHeaderToast("✦ Merchant Inventory Refreshed!", "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("swing");
  window.renderMarketShop();
};

window.renderMarketShop = function () {
  let content = document.getElementById("shop-content-panel");
  if (!content) return;

  let items = window.playerStats.shopItems || [];
  let soulsOwned =
    window.inventory && window.inventory.ETC
      ? window.inventory.ETC["Monster Soul"] || 0
      : 0;

  let now = Date.now();
  let refreshTime = window.playerStats.shopRefreshTime || 0;
  let remainingMs = Math.max(0, refreshTime - now);
  let remainingMins = Math.floor(remainingMs / 60000);
  let remainingSecs = Math.floor((remainingMs % 60000) / 1000);
  let timerStr = `${remainingMins}m ${remainingSecs < 10 ? "0" : ""}${remainingSecs}s`;

  let itemsHtml = items
    .map((item, idx) => {
      let col = window.getTierColor(item.statsRolled);
      let isPurchased = !!item.purchased;
      let costText = window.formatNumber(item.cost);
      let canAfford = BigNum.from(window.playerStats.coins).gte(item.cost);

      let eq = window.getEquippedItemForComparison(item.type);
      let deltasHtml = "";
      if (eq && !isPurchased) {
        let deltaParts = [];
        let diffAtk = (item.atk || 0) - (eq.atk || 0);
        let diffDef = (item.def || 0) - (eq.def || 0);
        let diffHp = (item.maxHp || 0) - (eq.maxHp || 0);

        if (diffAtk > 0)
          deltaParts.push(
            `<span style="color:#2ecc71;">▲ +${window.formatNumber(diffAtk)} ATK</span>`,
          );
        else if (diffAtk < 0)
          deltaParts.push(
            `<span style="color:#e74c3c;">▼ ${window.formatNumber(diffAtk)} ATK</span>`,
          );

        if (diffDef > 0)
          deltaParts.push(
            `<span style="color:#2ecc71;">▲ +${window.formatNumber(diffDef)} DEF</span>`,
          );
        else if (diffDef < 0)
          deltaParts.push(
            `<span style="color:#e74c3c;">▼ ${window.formatNumber(diffDef)} DEF</span>`,
          );

        if (diffHp > 0)
          deltaParts.push(
            `<span style="color:#2ecc71;">▲ +${window.formatNumber(diffHp)} HP</span>`,
          );
        else if (diffHp < 0)
          deltaParts.push(
            `<span style="color:#e74c3c;">▼ ${window.formatNumber(diffHp)} HP</span>`,
          );

        if (deltaParts.length > 0) {
          deltasHtml = `<div class="shop-card-deltas">${deltaParts.join(" • ")}</div>`;
        }
      }

      let statSummary = [];
      if (item.atk > 0)
        statSummary.push(
          `${window.getUiIconSvg("atk", 10)} +${window.formatNumber(item.atk)}`,
        );
      if (item.def > 0)
        statSummary.push(
          `${window.getUiIconSvg("def", 10)} +${window.formatNumber(item.def)}`,
        );
      if (item.maxHp > 0)
        statSummary.push(
          `${window.getUiIconSvg("maxHp", 10)} +${window.formatNumber(item.maxHp)}`,
        );
      if (item.critChance > 0)
        statSummary.push(
          `${window.getUiIconSvg("critChance", 10)} +${Math.round(item.critChance * 100)}%`,
        );

      let btnHtml = isPurchased
        ? `<button class="shop-buy-btn sold-out" disabled>SOLD OUT</button>`
        : `<button class="shop-buy-btn ${canAfford ? "affordable" : "unaffordable"}" ${canAfford ? "" : "disabled"} onclick="event.stopPropagation(); window.buyShopItem(${idx});">
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#f1c40f" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="none" stroke="#b7950b" stroke-width="0.6"/></svg>
            <span>BUY (${costText})</span>
          </button>`;

      return `
      <div class="shop-showcase-card ${isPurchased ? "card-sold-out" : ""}" style="border-left: 4px solid ${col};" onclick="window.showItemTooltip(event, window.playerStats.shopItems[${idx}])">
        <div class="shop-card-left">
          <div class="shop-card-icon-container" style="border-color:${col};">
            ${window.getEquipIconHtml(item, 38)}
          </div>
          <div class="shop-card-details">
            <div class="shop-card-title-row">
              <span class="shop-card-name" style="color:${col};">${item.name}</span>
              <span class="shop-card-tier-badge" style="color:${col}; border-color:${col}55; background:${col}15;">${item.statsRolled}★ ${window.getTierName(item.statsRolled)}</span>
            </div>
            <div class="shop-card-type-row">
              <span>${(item.subType || item.type || "EQUIP").toUpperCase()} • LV.${item.stageLevel || 1}</span>
            </div>
            <div class="shop-card-stats-row">
              ${statSummary.join("  ")}
            </div>
            ${deltasHtml}
          </div>
        </div>
        <div class="shop-card-right">
          ${btnHtml}
        </div>
      </div>
    `;
    })
    .join("");

  content.innerHTML = `
    <!-- Vendor Banner Quote -->
    <div class="merchant-banner-quote">
      <div class="merchant-avatar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div class="merchant-quote-content">
        <span class="merchant-speaker">MARCUS THE WANDERING VENDOR</span>
        <span class="merchant-dialogue">"Greetings, Hero! Direct imports straight from the deepest caverns. Inspected, tuned, and ready for battle."</span>
      </div>
    </div>

    <!-- Restock Control Bar -->
    <div class="shop-restock-bar">
      <div class="restock-timer-info">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Auto-Restock in: <strong style="color:#38bdf8;">${timerStr}</strong></span>
      </div>
      <button class="shop-refresh-btn" onclick="window.executeManualShopRefresh()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
        <span>RESTOCK (50 Souls)</span>
      </button>
    </div>

    <div class="shop-showcase-list">
      ${itemsHtml || '<div style="color:#64748b; font-style:italic; text-align:center; padding:25px;">Merchant Marcus is restocking his display counter...</div>'}
    </div>
  `;
};

window.renderMysticalShop = function () {
  let content = document.getElementById("shop-content-panel");
  if (!content) return;

  let mysticalList = (window.MYSTICAL_STOCK || [])
    .map((item, idx) => {
      let costVal =
        item.currency === "Gold"
          ? BigNum.from(item.cost).mul(window.playerStats.level || 1)
          : item.cost;
      let costStr =
        item.currency === "Gold"
          ? window.formatNumber(costVal)
          : costVal.toLocaleString();

      let canAfford = false;
      if (item.currency === "Gold") {
        canAfford = BigNum.from(window.playerStats.coins).gte(costVal);
      } else {
        let owned =
          window.inventory && window.inventory.ETC
            ? window.inventory.ETC["Luminous Soul"] || 0
            : 0;
        canAfford = owned >= item.cost;
      }

      let iconHtml = window.getUseIconHtml
        ? window.getUseIconHtml(item.name, 36)
        : "";
      if (!iconHtml && window.getEtcIconHtml) {
        iconHtml = window.getEtcIconHtml(item.name, 36);
      }

      let currencyIcon =
        item.currency === "Gold"
          ? `<svg width="11" height="11" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle;"><circle cx="6" cy="6" r="5" fill="#f1c40f" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="none" stroke="#b7950b" stroke-width="0.6"/></svg>`
          : `<svg width="11" height="11" viewBox="0 0 12 12" style="display:inline-block; vertical-align:middle;"><path d="M6 1.5 C6 1.5, 2 6, 2 9 C2 11, 3.8 11.5, 6 11.5 C8.2 11.5, 10 11, 10 9 C10 6, 6 1.5, 6 1.5 Z" fill="#ffb6c1" stroke="#000" stroke-width="0.8"/></svg>`;

      return `
      <div class="mystical-trade-card" style="border-left: 3.5px solid ${item.color || "#00d2ff"};">
        <div class="mystical-card-left">
          <div class="mystical-icon-box" style="border-color:${item.color || "#00d2ff"};">
            ${iconHtml}
          </div>
          <div class="mystical-card-details">
            <span class="mystical-card-title" style="color:${item.color || "#fff"};">${item.name}</span>
            <span class="mystical-card-desc">${item.desc}</span>
          </div>
        </div>
        <div class="mystical-card-right">
          <button class="shop-buy-btn ${canAfford ? "affordable" : "unaffordable"}" ${canAfford ? "" : "disabled"} onclick="window.buyMysticalItem(${idx})">
            ${currencyIcon}
            <span>${costStr} ${item.currency.toUpperCase()}</span>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  let transmutationsHtml = (window.POTION_TRANSMUTATIONS || [])
    .map((t, idx) => {
      let owned =
        window.inventory && window.inventory.USE
          ? window.inventory.USE[t.req] || 0
          : 0;
      let canBrew = owned >= t.amount;
      let resultIcon = window.getUseIconHtml
        ? window.getUseIconHtml(t.result, 36)
        : "";

      let reqColor = canBrew ? "#34d399" : "#f87171";

      return `
      <div class="alchemy-workbench-card" style="border-left: 3.5px solid ${t.color || "#2ecc71"};">
        <div class="alchemy-card-left">
          <div class="alchemy-icon-box" style="border-color:${t.color || "#2ecc71"};">
            ${resultIcon}
          </div>
          <div class="alchemy-card-details">
            <span class="alchemy-card-title" style="color:${t.color || "#2ecc71"};">${t.result}</span>
            <div class="alchemy-recipe-nodes">
              <span class="recipe-req-label">Required Ingredient:</span>
              <span class="recipe-ingredient-chip" style="border-color:${reqColor}; background:${canBrew ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)"}; color:${reqColor};">
                ${t.amount}x ${t.req} (Owned: ${owned})
              </span>
            </div>
          </div>
        </div>
        <div class="alchemy-card-right">
          <button class="shop-buy-btn ${canBrew ? "affordable" : "unaffordable"}" ${canBrew ? "" : "disabled"} onclick="window.transmutePotion(${idx})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 2v5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7V2"/><path d="M8.5 2h7"/></svg>
            <span>BREW ELIXIR</span>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  let pStats =
    typeof window.resolvePlayerStats === "function"
      ? window.resolvePlayerStats()
      : {};
  let intVal = pStats.int || 5;
  let effectiveInt = Math.max(0, intVal - 5);
  let preservationPct = Math.round(
    ((effectiveInt * 0.5) / (effectiveInt + 95)) * 100,
  );
  let potencyPct = (effectiveInt * 0.5).toFixed(1);

  content.innerHTML = `
    <!-- Section 1: Mystical Trades -->
    <div class="alchemy-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>
      <span>MYSTICAL RELIC EXCHANGE</span>
    </div>
    <div class="mystical-trades-list">
      ${mysticalList}
    </div>

    <!-- Section 2: Alchemy Transmutation Workbench -->
    <div class="alchemy-section-header" style="margin-top: 14px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5"><path d="M10 2v5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7V2"/><path d="M8.5 2h7"/></svg>
      <span>ALCHEMICAL TRANSMUTATION WORKBENCH</span>
      <span class="alchemy-int-note">(INT: ${intVal} • Preservation: ${preservationPct}% • Potency: +${potencyPct}%)</span>
    </div>
    <div class="alchemy-workbench-list">
      ${transmutationsHtml}
    </div>
  `;
};

window.renderGoldUpgrades = function () {
  let content = document.getElementById("shop-content-panel");
  if (!content) return;

  let p = window.playerStats;

  let sinks = [
    {
      type: "shop",
      title: "MERCHANT STOCK QUALITY",
      field: "shopQLevel",
      desc: "Improves star-rating probabilities for weapons and armor sold in the Equipment Market.",
      statBonus: `+${(p.shopQLevel || 0) * 2}% Quality Chance`,
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    },
    {
      type: "vending",
      title: "GACHAPON MACHINE TIER",
      field: "vendingQLevel",
      desc: "Elevates high-star drop rates when spinning the Arcade Gachapon machine.",
      statBonus: `+${(p.vendingQLevel || 0) * 1}% Gacha Quality`,
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>`,
    },
    {
      type: "global",
      title: "GLOBAL EXTRACTION QUALITY",
      field: "globalQLevel",
      desc: "Increases baseline item drop quality and star rolls across all dungeon runs.",
      statBonus: `+${(p.globalQLevel || 0) * 1}% Global Drop Quality`,
      iconSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    },
  ];

  let cardsHtml = sinks
    .map((s) => {
      let curLvl = p[s.field] || 0;
      let cost = window.getGoldUpgradeCost(s.type, curLvl);
      let costText = window.formatNumber(cost);
      let canAfford = BigNum.from(p.coins).gte(cost);

      let maxLvlCap = 50;
      let progressPct = Math.min(100, (curLvl / maxLvlCap) * 100);

      return `
      <div id="sink-card-${s.type}" class="commerce-ledger-card">
        <div class="ledger-card-header">
          <div class="ledger-icon-box">
            ${s.iconSvg}
          </div>
          <div class="ledger-header-info">
            <div class="ledger-title-row">
              <span class="ledger-card-title">${s.title}</span>
              <span class="ledger-level-badge">LV. ${curLvl}</span>
            </div>
            <span class="ledger-card-desc">${s.desc}</span>
            <div class="ledger-progress-bar">
              <div class="ledger-progress-fill" style="width:${progressPct}%;"></div>
            </div>
          </div>
        </div>

        <div class="ledger-card-footer">
          <div class="ledger-return-badge">
            <span class="return-label">ACTIVE RETURN:</span>
            <strong class="return-val">${s.statBonus}</strong>
          </div>
          <button class="shop-buy-btn ${canAfford ? "affordable" : "unaffordable"}" ${canAfford ? "" : "disabled"} onclick="window.buyGoldUpgrade('${s.type}')">
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#f1c40f" stroke="#000" stroke-width="0.8"/><circle cx="6" cy="6" r="2.5" fill="none" stroke="#b7950b" stroke-width="0.6"/></svg>
            <span>INVEST (${costText})</span>
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  content.innerHTML = `
    <div class="alchemy-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5"><path d="M12 2v20M17 5l-5-5-5 5"/><circle cx="12" cy="12" r="10"/></svg>
      <span>IMPERIAL COMMERCE CONTRACTS & PERMANENT PERKS</span>
    </div>
    <div class="commerce-ledger-list">
      ${cardsHtml}
    </div>
  `;
};

window.buyShopItem = function (index) {
  let item = window.playerStats.shopItems[index];
  if (!item || item.purchased) return;

  let coins = BigNum.from(window.playerStats.coins);
  let cost = BigNum.from(item.cost);
  if (coins.lt(cost)) {
    window.pushHeaderToast("[X] Insufficient Gold!", "#e74c3c");
    return;
  }

  let maxBag = window.getMaxBagSlots();
  if (window.inventory.EQUIP.length >= maxBag) {
    window.pushHeaderToast("[X] Inventory Full!", "#e74c3c");
    return;
  }

  window.playerStats.coins = coins.sub(cost);
  item.purchased = true;

  if (window.playerStats.coins.eq(0)) {
    window.playerStats.hasTriggeredExactChange = true;
  }

  window.inventory.EQUIP.push(item);
  window.frozenItemDb[item.id] = window.cloneItemForTooltip(item);

  window.pushHeaderToast(`✦ Purchased ${item.name}!`, "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("fairy");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration(
      "alchemy",
      window.getTierColor(item.statsRolled),
      item.statsRolled,
    );
  }

  window.updateUI();
  window.updateShopHeaderWallet();
  window.renderMarketShop();
  if (typeof window.renderInventory === "function") window.renderInventory();
  window.saveGame();
};

window.buyMysticalItem = function (index) {
  let item = window.MYSTICAL_STOCK[index];
  let cost = item.cost;
  let currency = item.currency;

  if (currency === "Gold") {
    cost = BigNum.from(item.cost).mul(window.playerStats.level || 1);
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(cost)) {
      window.pushHeaderToast("[X] Insufficient Gold!", "#e74c3c");
      return;
    }
    window.playerStats.coins = coins.sub(cost);
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }
  } else if (currency === "Luminous Soul") {
    let owned = window.inventory.ETC["Luminous Soul"] || 0;
    if (owned < cost) {
      window.pushHeaderToast("[X] Insufficient Luminous Souls!", "#e74c3c");
      return;
    }
    window.inventory.ETC["Luminous Soul"] -= cost;
    if (window.inventory.ETC["Luminous Soul"] === 0) {
      delete window.inventory.ETC["Luminous Soul"];
    }
  }

  if (
    item.name === "Gacha Key" ||
    item.name === "Astral Essence" ||
    item.name === "Catalyst Core"
  ) {
    window.addEtcDrop(item.name, 1);
  } else {
    window.addUseDrop(item.name, 1);
  }

  window.pushHeaderToast(`✦ Purchased ${item.name}!`, "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("fairy");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", item.color || "#9b59b6", 3);
  }

  window.updateUI();
  window.updateShopHeaderWallet();
  window.renderMysticalShop();
  if (typeof window.renderInventory === "function") window.renderInventory();
  window.saveGame();
};

window.buyGoldUpgrade = function (type) {
  let p = window.playerStats;
  let levelField =
    type === "vending"
      ? "vendingQLevel"
      : type === "shop"
        ? "shopQLevel"
        : "globalQLevel";
  let curLvl = p[levelField] || 0;
  let costBig = window.getGoldUpgradeCost(type, curLvl);

  let coins = BigNum.from(p.coins);
  if (coins.lt(costBig)) {
    window.pushHeaderToast("[X] Insufficient Gold!", "#e74c3c");
    return;
  }

  p.coins = coins.sub(costBig);
  p[levelField] = curLvl + 1;

  if (p.coins.eq(0)) {
    p.hasTriggeredExactChange = true;
  }

  window.pushHeaderToast("✦ Upgrade Acquired!", "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("spell");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("upgrade", "#f1c40f", 4);
  }

  window.updateUI();
  window.updateShopHeaderWallet();
  window.renderGoldUpgrades();

  let cardEl = document.getElementById(`sink-card-${type}`);
  if (cardEl) {
    cardEl.classList.add("sink-upgraded-flash");
    setTimeout(() => {
      let checkEl = document.getElementById(`sink-card-${type}`);
      if (checkEl) checkEl.classList.remove("sink-upgraded-flash");
    }, 600);
  }

  if (typeof window.checkAchievements === "function") {
    window.checkAchievements();
  }
  window.saveGame();
};

window.transmutePotion = function (index) {
  let recipe = window.POTION_TRANSMUTATIONS[index];
  if (!recipe) return;

  let ownedCount = window.inventory.USE[recipe.req] || 0;
  if (ownedCount < recipe.amount) {
    window.pushHeaderToast("❌ Insufficient ingredients!", "#e74c3c");
    return;
  }

  window.inventory.USE[recipe.req] -= recipe.amount;
  if (window.inventory.USE[recipe.req] === 0) {
    delete window.inventory.USE[recipe.req];
  }

  window.addUseDrop(recipe.result, 1);

  window.pushHeaderToast(`🧪 Brewed ${recipe.result}!`, "#2ecc71");
  window.SoundManager.play("spell");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", recipe.color || "#2ecc71", 3);
  }

  window.updateUI();
  window.updateShopHeaderWallet();
  window.renderInventory();
  window.renderMysticalShop();
  window.saveGame();
};

// Append rerollItemSet inside ForgeManager
Object.assign(window.ForgeManager, {
  rerollItemSet() {
    if (!window.forgeSelectedItem) return;
    let item = window.forgeSelectedItem;
    if (item.type === "artifact" || item.statsRolled === "UNIQUE") return;

    let costGold = window.getSetRerollGoldCost(item);
    let soulCost = 25 + item.statsRolled * 25;
    let ownedSouls = window.inventory.ETC["Monster Soul"] || 0;
    let coins = BigNum.from(window.playerStats.coins);

    if (coins.lt(costGold)) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("❌ Not enough Gold!", "#e74c3c");
      return;
    }
    if (ownedSouls < soulCost) {
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast("❌ Not enough Monster Souls!", "#e74c3c");
      return;
    }

    window.playerStats.coins = BigNum.from(window.playerStats.coins).sub(
      costGold,
    );
    window.inventory.ETC["Monster Soul"] -= soulCost;
    if (window.inventory.ETC["Monster Soul"] === 0) {
      delete window.inventory.ETC["Monster Soul"];
    }

    let setKeys = [
      "Vanguard",
      "Colossus",
      "Bastion",
      "Windrunner",
      "Wraith",
      "Reaver",
      "Dreadnought",
      "Duellist",
      "Scholar",
      "Berserker",
      "Scout",
      "Fortune",
      "Mystic",
      "Alchemist",
      "Midas",
      "Biohazard",
      "Warlord",
      "VoidTouched",
    ];

    // Roll a set that is different from the current one
    let filtered = setKeys.filter((k) => k !== item.setName);
    if (filtered.length === 0) filtered = setKeys;
    let newSet = filtered[Math.floor(Math.random() * filtered.length)];

    item.setName = newSet;
    item.name = window.buildProceduralName(item);

    if (typeof window.pushLog === "function")
      window.pushLog(
        `<span style='color:#2ecc71;'>[FORGE]</span> Successfully re-rolled set resonance of ${item.noun} to <strong style='color:#2ecc71;'>${newSet} Set</strong>!`,
      );
    if (typeof window.pushHeaderToast === "function")
      window.pushHeaderToast(`✨ Set Resonated: ${newSet}!`, "#2ecc71");

    if (typeof window.spawnTemperParticles === "function")
      window.spawnTemperParticles(true);
    if (window.SoundManager) window.SoundManager.play("spell");

    window.updateUI();
    window.renderInventory();
    window.renderForgeTab();
    window.saveGame();
  },
});

// Legacy Compatibility Aliases to protect references
window.rerollItemSet = () => window.ForgeManager.rerollItemSet();

window.buyAstralShopItem = function (index) {
  let item = window.ASTRAL_SHOP_STOCK[index];
  if (!item) return;

  let ownedShards = window.playerStats.astralShards || 0;
  if (ownedShards < item.cost) {
    window.pushHeaderToast("❌ Insufficient Astral Shards!", "#e74c3c");
    return;
  }

  if (item.isTitle) {
    let unlocked = window.playerStats.unlockedTitles || [];
    if (unlocked.includes("astral_conqueror")) {
      window.pushHeaderToast("❌ Already unlocked this title!", "#e74c3c");
      return;
    }
    window.playerStats.astralShards -= item.cost;
    window.playerStats.unlockedTitles = window.playerStats.unlockedTitles || [];
    window.playerStats.unlockedTitles.push("astral_conqueror");
    window.playerStats.equippedTitle = "astral_conqueror"; // Auto-equip title
  } else {
    window.playerStats.astralShards -= item.cost;
    const useItems = [
      "Double Drop Elixir",
      "Drop Quality Elixir",
      "Monster Card Sack",
    ];
    if (useItems.includes(item.name)) {
      window.addUseDrop(item.name, 1);
    } else {
      window.addEtcDrop(item.name, 1);
    }
  }

  window.pushHeaderToast(`🛒 Purchased ${item.name}!`, "#2ecc71");
  if (window.SoundManager) window.SoundManager.play("fairy");

  if (window.spawnPurchaseCelebration) {
    window.spawnPurchaseCelebration("alchemy", item.color, 3);
  }

  window.updateUI();
  window.renderInventory();
  window.renderAstralShop();
  window.saveGame();
};

// --- PROC-GEN CAVERN SIGIL APPLICATION SLOTTER ---
window.executeSlotCavernSigil = function (id) {
  let sigil = window.inventory.SIGIL.find((item) => item.id === id);
  if (!sigil) return;

  window.state.slottedCavernSigil = sigil;
  let win = document.getElementById("sigil-swap-window");
  if (win) win.remove();

  if (typeof window.hideTooltip === "function") window.hideTooltip();
  if (typeof window.updateUI === "function") window.updateUI();
};

// --- ENDGAME PARAGON INFUSION MATRIX SYSTEM ---
window.recalculateAllInventoryItems = function () {
  let allItems = [];
  if (window.equippedSlots) {
    for (let k in window.equippedSlots) {
      if (window.equippedSlots[k]) allItems.push(window.equippedSlots[k]);
    }
  }
  if (window.inventory) {
    if (window.inventory.EQUIP) allItems.push(...window.inventory.EQUIP);
    if (window.inventory.ARTIFACT) allItems.push(...window.inventory.ARTIFACT);
  }
  if (window.player) {
    if (window.player.stash) allItems.push(...window.player.stash);
    if (window.player.bag) allItems.push(...window.player.bag);
  }

  allItems.forEach((item) => {
    if (item && typeof item === "object") {
      window.recalculateItemStats(item);
    }
  });
};

// Immediate execution after script load
window.recalculateAllInventoryItems();

window.executeParagonUpgrade = function () {
  let p = window.playerStats;
  let parLevel = p.paragonLevel || 0;

  // Exponential scaling requirements matching endgame curves
  let costGold = BigNum.from(1000000).mul(BigNum.from(1.5).pow(parLevel));
  let costMythic = Math.floor(50 * Math.pow(1.3, parLevel));
  let costLegendary = Math.floor(150 * Math.pow(1.3, parLevel));
  let costEpic = Math.floor(350 * Math.pow(1.3, parLevel));
  let costCores = Math.floor(10 * Math.pow(1.15, parLevel));

  let goldOwned = BigNum.from(p.coins || 0);
  let mythicScrapsOwned = window.inventory.ETC["Mythic Scrap"] || 0;
  let legendaryScrapsOwned = window.inventory.ETC["Legendary Scrap"] || 0;
  let epicScrapsOwned = window.inventory.ETC["Epic Scrap"] || 0;
  let coresOwned = window.inventory.ETC["Catalyst Core"] || 0;

  if (
    goldOwned.lt(costGold) ||
    mythicScrapsOwned < costMythic ||
    legendaryScrapsOwned < costLegendary ||
    epicScrapsOwned < costEpic ||
    coresOwned < costCores
  ) {
    window.pushHeaderToast(
      "[Error] Insufficient resources for Paragon Infusion!",
      "#e74c3c",
    );
    return;
  }

  window.showCustomConfirm(
    "[Paragon] Infusion Matrix",
    `Are you sure you want to sacrifice these resources to fuse Paragon Level ${parLevel + 1}?`,
    "Infuse Matrix",
    "Cancel",
    "#ff007f",
    function () {
      p.coins = goldOwned.sub(costGold);

      window.inventory.ETC["Mythic Scrap"] -= costMythic;
      if (window.inventory.ETC["Mythic Scrap"] === 0)
        delete window.inventory.ETC["Mythic Scrap"];

      window.inventory.ETC["Legendary Scrap"] -= costLegendary;
      if (window.inventory.ETC["Legendary Scrap"] === 0)
        delete window.inventory.ETC["Legendary Scrap"];

      window.inventory.ETC["Epic Scrap"] -= costEpic;
      if (window.inventory.ETC["Epic Scrap"] === 0)
        delete window.inventory.ETC["Epic Scrap"];

      window.inventory.ETC["Catalyst Core"] -= costCores;
      if (window.inventory.ETC["Catalyst Core"] === 0)
        delete window.inventory.ETC["Catalyst Core"];

      p.paragonLevel = parLevel + 1;

      window.pushHeaderToast(
        `[Paragon] Infused to Level ${p.paragonLevel}!`,
        "#ff007f",
      );
      if (window.SoundManager) window.SoundManager.play("revive");
      if (window.spawnPurchaseCelebration) {
        window.spawnPurchaseCelebration("paragon", "#ff007f", 5);
      }
      window.invalidatePlayerStats();
      window.updateUI();
      window.renderPrestigeTab();
      window.renderInventory();
      window.saveGame();
    },
  );
};

window.gachaState = {
  activeMachine: "standard", // 'standard' | 'glimmering'
  capsules: [],
  isSpinning: false,
  spinTimer: 0,
  crankAngle: 0,
  animationFrameId: null,
  hasBallDispensed: false,
};

window.toggleGachaModal = function () {
  if (typeof window.hideTooltip === "function") window.hideTooltip();
  let modal = document.getElementById("gacha-modal");
  if (!modal) return;

  if (modal.style.display === "none" || modal.style.display === "") {
    modal.style.display = "flex";
    window.switchGachaMachine(window.gachaState.activeMachine || "standard");
    window.initGachaPhysics();
  } else {
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
    if (window.gachaState.animationFrameId) {
      cancelAnimationFrame(window.gachaState.animationFrameId);
      window.gachaState.animationFrameId = null;
    }
  }
};

window.openGachaModal = function () {
  window.toggleGachaModal();
};

window.switchGachaMachine = function (machineType) {
  window.gachaState.activeMachine = machineType;
  let modal = document.getElementById("gacha-modal");
  if (!modal) return;

  let tabStd = document.getElementById("gacha-tab-standard");
  let tabGlim = document.getElementById("gacha-tab-glimmering");
  let ratesTitle = document.getElementById("gacha-rates-title");
  let ratesPct = document.getElementById("gacha-rates-percentages");

  if (machineType === "standard") {
    modal.className = "modal-overlay gacha-theme-standard";
    if (tabStd) tabStd.classList.add("active");
    if (tabGlim) tabGlim.classList.remove("active");
    if (ratesTitle) ratesTitle.innerText = "STANDARD VENDING TERMINAL";
    if (ratesPct) {
      ratesPct.innerHTML = `
                    <span style="color:#e74c3c;">5★: 1.27%</span>
                    <span style="color:#f1c40f;">4★: 5.98%</span>
                    <span style="color:#e67e22;">3★: 16.9%</span>
                    <span style="color:#9b59b6;">2★: 26.4%</span>
                    <span style="color:#3498db;">1★: 49.5%</span>
                  `;
    }
  } else {
    modal.className = "modal-overlay gacha-theme-glimmering";
    if (tabStd) tabStd.classList.remove("active");
    if (tabGlim) tabGlim.classList.add("active");
    if (ratesTitle) ratesTitle.innerText = "GLIMMERING BOOSTER TERMINAL";
    if (ratesPct) {
      ratesPct.innerHTML = `
                    <span style="color:#e74c3c;">5★: 1.3%</span>
                    <span style="color:#f1c40f;">4★: 6.0%</span>
                    <span style="color:#e67e22;">3★: 16.9%</span>
                    <span style="color:#1abc9c;">ART: 5.0%</span>
                  `;
    }
  }

  window.updateGachaBalances();
  let resultsPanel = document.getElementById("gacha-results-panel");
  if (resultsPanel) resultsPanel.style.display = "none";

  // Spawn clean, machine-aligned colored balls in the physics simulator
  window.populateGachaCapsules();
};

window.updateGachaBalances = function () {
  let panelStd = document.getElementById("gacha-panel-standard-keys");
  let panelGlim = document.getElementById("gacha-panel-glimmering-keys");
  let stdCount =
    window.inventory && window.inventory.ETC
      ? window.inventory.ETC["Gacha Key"] || 0
      : 0;
  let glimCount =
    window.inventory && window.inventory.ETC
      ? window.inventory.ETC["Glimmering Gachapon Key"] || 0
      : 0;

  if (panelStd) panelStd.innerText = stdCount;
  if (panelGlim) panelGlim.innerText = glimCount;

  let pityText = document.getElementById("gacha-pity-text");
  let pityTarget = document.getElementById("gacha-pity-target");
  let pityFill = document.getElementById("gacha-pity-fill");

  if (window.gachaState.activeMachine === "standard") {
    let current = window.playerStats.vendingPity || 0;
    let pct = Math.min(100, (current / 50) * 100);
    if (pityText) pityText.innerText = `${current} / 50`;
    if (pityTarget) pityTarget.innerText = "50";
    if (pityFill) {
      pityFill.style.width = `${pct}%`;
      pityFill.style.background = "linear-gradient(90deg, #f1c40f, #e74c3c)";
    }
  } else {
    let current = window.playerStats.glimmeringPity || 0;
    let pct = Math.min(100, (current / 25) * 100);
    if (pityText) pityText.innerText = `${current} / 25`;
    if (pityTarget) pityTarget.innerText = "25";
    if (pityFill) {
      pityFill.style.width = `${pct}%`;
      pityFill.style.background = "linear-gradient(90deg, #00d2ff, #e84393)";
    }
  }
};

window.populateGachaCapsules = function () {
  let standardCapsuleColors = [
    "#f1c40f",
    "#3498db",
    "#9b59b6",
    "#e67e22",
    "#e74c3c",
    "#2ecc71",
  ];
  let glimmeringCapsuleColors = ["#ffffff", "#e84393", "#00d2ff", "#a855f7"];
  let poolColors =
    window.gachaState.activeMachine === "standard"
      ? standardCapsuleColors
      : glimmeringCapsuleColors;

  window.gachaState.capsules = [];
  for (let i = 0; i < 18; i++) {
    let col1 = poolColors[i % poolColors.length];
    let col2 = "#ffffff";
    window.gachaState.capsules.push({
      x: 40 + Math.random() * 200,
      y: 80 + Math.random() * 50,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      radius: 7.5,
      color1: col1,
      color2: col2,
      angle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 0.05,
    });
  }
};

window.initGachaPhysics = function () {
  let canvas = document.getElementById("gacha-physics-canvas");
  if (!canvas) return;
  let ctx = canvas.getContext("2d");

  if (window.gachaState.animationFrameId) {
    cancelAnimationFrame(window.gachaState.animationFrameId);
  }

  function loop() {
    updatePhysics(canvas);
    renderPhysics(ctx, canvas);
    window.gachaState.animationFrameId = requestAnimationFrame(loop);
  }

  loop();
};

function updatePhysics(canvas) {
  let caps = window.gachaState.capsules;
  let gravity = 0.22;
  let bounceDamp = 0.55;

  // Dimensions
  let width = canvas.width;
  let height = canvas.height;
  let bottomWall = 146; // Keep above bottom rim

  // Center of the rounded dome arch
  let domeCenterX = width / 2;
  let domeCenterY = 110;
  let domeRadius = 115;

  if (window.gachaState.isSpinning) {
    window.gachaState.spinTimer--;
    if (window.gachaState.spinTimer <= 0) {
      window.gachaState.isSpinning = false;
    }
  }

  caps.forEach((c) => {
    if (window.gachaState.isSpinning) {
      // Chaotic spin forces applied directly
      c.vx += (Math.random() - 0.5) * 6;
      c.vy += -Math.random() * 3.5 - 1.5;
      c.angle += (Math.random() - 0.5) * 0.4;
    } else {
      c.vy += gravity;
      c.vx *= 0.985;
      c.vy *= 0.985;
      c.angle += c.vx * 0.02;
    }

    c.x += c.vx;
    c.y += c.vy;

    // 1. Bottom Flat Wall Collision
    if (c.y > bottomWall - c.radius) {
      c.y = bottomWall - c.radius;
      c.vy = -c.vy * bounceDamp;
      c.vx *= 0.85; // Floor drag friction
    }

    // 2. Left & Right Side Wall Boundary
    if (c.x < 18 + c.radius) {
      c.x = 18 + c.radius;
      c.vx = -c.vx * bounceDamp;
    }
    if (c.x > width - 18 - c.radius) {
      c.x = width - 18 - c.radius;
      c.vx = -c.vx * bounceDamp;
    }

    // 3. Rounded Dome Arch Upper Boundary
    if (c.y < domeCenterY) {
      let dx = c.x - domeCenterX;
      let dy = c.y - domeCenterY;
      let dist = Math.hypot(dx, dy);
      let maxDist = domeRadius - c.radius;

      if (dist > maxDist) {
        let nx = dx / dist;
        let ny = dy / dist;

        // Move ball back inside arch safely
        c.x = domeCenterX + nx * maxDist;
        c.y = domeCenterY + ny * maxDist;

        // Reflect velocity across standard normal vector
        let dot = c.vx * nx + c.vy * ny;
        c.vx = (c.vx - 2 * dot * nx) * bounceDamp;
        c.vy = (c.vy - 2 * dot * ny) * bounceDamp;
      }
    }
  });

  // 4. Elastic Particle-to-Particle Ball Collisions
  for (let i = 0; i < caps.length; i++) {
    for (let j = i + 1; j < caps.length; j++) {
      let b1 = caps[i];
      let b2 = caps[j];
      let dx = b2.x - b1.x;
      let dy = b2.y - b1.y;
      let dist = Math.hypot(dx, dy);
      let minDist = b1.radius + b2.radius;

      if (dist < minDist) {
        let overlap = minDist - dist;
        let nx = dx / dist;
        let ny = dy / dist;

        // Separate spheres cleanly
        b1.x -= nx * overlap * 0.5;
        b1.y -= ny * overlap * 0.5;
        b2.x += nx * overlap * 0.5;
        b2.y += ny * overlap * 0.5;

        // Simple elastic collision velocity swap
        let kx = b1.vx - b2.vx;
        let ky = b1.vy - b2.vy;
        let p = (2 * (nx * kx + ny * ky)) / 2;

        b1.vx -= p * nx * 0.85;
        b1.vy -= p * ny * 0.85;
        b2.vx += p * nx * 0.85;
        b2.vy += p * ny * 0.85;
      }
    }
  }
}

function renderPhysics(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the static inside floor boundary
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.rect(0, 143, canvas.width, 17);
  ctx.fill();

  window.gachaState.capsules.forEach((c) => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);

    // Double outline stroke
    ctx.strokeStyle = "#05070a";
    ctx.lineWidth = 1.5;

    // Half-half capsule splits
    ctx.fillStyle = c.color1;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius, Math.PI / 2, -Math.PI / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c.color2;
    ctx.beginPath();
    ctx.arc(0, 0, c.radius, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.stroke();

    // Center seam divider line
    ctx.beginPath();
    ctx.moveTo(0, -c.radius);
    ctx.lineTo(0, c.radius);
    ctx.stroke();

    // Specular shiny highlight glare
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.ellipse(
      -c.radius * 0.35,
      -c.radius * 0.35,
      c.radius * 0.22,
      c.radius * 0.12,
      Math.PI / 4,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.restore();
  });
}

window.triggerGachaSpin = function () {
  if (window.gachaState.isSpinning) return;

  let machine = window.gachaState.activeMachine;
  let keyName =
    machine === "standard" ? "Gacha Key" : "Glimmering Gachapon Key";
  let count =
    window.inventory && window.inventory.ETC
      ? window.inventory.ETC[keyName] || 0
      : 0;

  if (count < 1) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `[!] Requires 1x ${keyName} to spin terminal!`,
        "#e74c3c",
      );
    }
    return;
  }

  window.gachaState.isSpinning = true;
  window.gachaState.spinTimer = 70;

  if (window.SoundManager && typeof window.SoundManager.play === "function") {
    window.SoundManager.play("swing");
  }

  let dial = document.getElementById("gacha-crank-dial");
  if (dial) {
    window.gachaState.crankAngle += 360;
    dial.style.transform = `rotate(${window.gachaState.crankAngle}deg)`;
  }

  setTimeout(() => {
    let colorsList =
      window.gachaState.activeMachine === "standard"
        ? ["#f1c40f", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#2ecc71"]
        : ["#ffffff", "#e84393", "#00d2ff", "#a855f7"];
    let randomColor = colorsList[Math.floor(Math.random() * colorsList.length)];

    let dropCap = document.getElementById("gacha-falling-capsule");
    if (dropCap) {
      dropCap.style.background = `linear-gradient(135deg, ${randomColor} 50%, #ffffff 50%)`;
      dropCap.style.display = "block";
      setTimeout(() => {
        dropCap.style.display = "none";
      }, 400);
    }

    setTimeout(() => {
      let binBall = document.getElementById("gacha-dropped-ball");
      if (binBall) {
        binBall.style.background = `linear-gradient(135deg, ${randomColor} 50%, #ffffff 50%)`;
        binBall.style.display = "block";
      }

      let binBox = document.querySelector(".gacha-dispenser-bin");
      if (binBox) {
        binBox.classList.add("bin-active-flash");
        setTimeout(() => binBox.classList.remove("bin-active-flash"), 600);
      }

      setTimeout(() => {
        let isGlim = window.gachaState.activeMachine === "glimmering";
        window.triggerGachaPull(isGlim, false);

        let binBall = document.getElementById("gacha-dropped-ball");
        if (binBall) binBall.style.display = "none";
      }, 500);
    }, 300);
  }, 650);
};

window.triggerGachaPull = function (isGlimmering, useStandardForGlimmering) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();

  let result = window.rollGachaCrateItem(
    isGlimmering,
    useStandardForGlimmering,
  );
  if (result.error) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(`[!] ${result.error}`, "#e74c3c");
    }
    return;
  }

  let item = result.item;
  if (!item) return;

  window.updateGachaBalances();
  if (typeof window.updateUI === "function") window.updateUI();

  if (window.SoundManager && typeof window.SoundManager.play === "function") {
    window.SoundManager.play("fairy");
  }

  let color = window.getTierColor(item.statsRolled);
  if (typeof window.spawnPurchaseCelebration === "function") {
    window.spawnPurchaseCelebration("gacha", color, item.statsRolled);
  }

  let resultsPanel = document.getElementById("gacha-results-panel");
  if (resultsPanel) {
    resultsPanel.style.display = "block";

    let starsLabel =
      item.statsRolled === "UNIQUE"
        ? "UNIQUE ARTIFACT"
        : `${item.statsRolled || 0}★ ${window.getTierName(item.statsRolled)}`;
    let iconHtml = window.getEquipIconHtml
      ? window.getEquipIconHtml(item, 52)
      : "";

    let statSummary = [];
    if (item.atk > 0)
      statSummary.push(
        `${window.getUiIconSvg("atk", 10)} +${window.formatNumber(item.atk)}`,
      );
    if (item.def > 0)
      statSummary.push(
        `${window.getUiIconSvg("def", 10)} +${window.formatNumber(item.def)}`,
      );
    if (item.maxHp > 0)
      statSummary.push(
        `${window.getUiIconSvg("maxHp", 10)} +${window.formatNumber(item.maxHp)}`,
      );
    if (item.critChance > 0)
      statSummary.push(
        `${window.getUiIconSvg("critChance", 10)} +${Math.round(item.critChance * 100)}%`,
      );

    resultsPanel.innerHTML = `
      <div class="gacha-results-card" style="border-color:${color}; box-shadow: 0 0 20px ${color}44;">
        <span class="results-header-tag" style="color:${color};">✦ CAPSULE UNBOXED ✦</span>
        <div style="margin: 4px 0;">${iconHtml}</div>
        <span class="results-item-title" style="color:${color};">${item.name}</span>
        <span style="font-size: 8.5px; color: #94a3b8; font-family: monospace;">${starsLabel} • LV.${item.stageLevel || 1}</span>
        ${statSummary.length > 0 ? `<div style="font-size: 9px; color: #e2e8f0; font-family: monospace; display: flex; gap: 8px; margin-top: 2px;">${statSummary.join("  ")}</div>` : ""}
      </div>
    `;
  }

  if (typeof window.pushHeaderToast === "function") {
    window.pushHeaderToast(`✦ Unboxed: ${item.name}!`, color);
  }
};

if (typeof window.cloneItemForTooltip !== "function") {
  window.cloneItemForTooltip = function (item) {
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  };
}
