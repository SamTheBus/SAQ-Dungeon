  // --- HERO PROFILE & STASH MANAGEMENT ENGINE ---
  export function getItemIconSvg(item, size = 28) {
    if (!item) return "";
    let itemName = typeof item === "string" ? item : item.name || "";

    // Check if it's an ETC material
    if (window.etcDex && window.etcDex[itemName]) {
      if (typeof window.getEtcIconHtml === "function") {
        return window.getEtcIconHtml(itemName, size);
      }
    }
    // Check if it's a USE consumable
    if (window.useDex && window.useDex[itemName]) {
      if (typeof window.getUseIconHtml === "function") {
        return window.getUseIconHtml(itemName, size);
      }
    }

    if (typeof window.getEquipIconHtml === "function") {
      return window.getEquipIconHtml(item, size);
    }
    let col = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";
    let label = (item.subType || item.type || "EQ").slice(0, 2).toUpperCase();
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:rgba(0,0,0,0.4); border:1px solid ${col}; border-radius:4px; font-weight:bold; font-size:9px; color:${col}; flex-shrink:0;">${label}</span>`;
  }

  window.UIManager = window.UIManager || {};
  export const UIManager = window.UIManager;
  window.tooltipHideTimeoutId = null;
  window.slotLongPressTimeout = null;
  window.isSlotLongPressActive = false;

  // --- HIDE TOOLTIPS WITH DESKTOP GRACE PERIOD & IMMEDIATE DISMISS ---
  window.UIManager.hideTooltip = function (immediate = false) {
    if (window.tooltipHideTimeoutId) {
      clearTimeout(window.tooltipHideTimeoutId);
      window.tooltipHideTimeoutId = null;
    }
    const doHide = () => {
      [
        "game-tooltip",
        "etc-tooltip",
        "stat-tooltip",
        "log-item-tooltip",
      ].forEach((id) => {
        let el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
      window.activeStatTooltip = null;
    };
    if (immediate) {
      doHide();
    } else {
      window.tooltipHideTimeoutId = setTimeout(doHide, 150);
    }
  };
  export const hideTooltip = (immediate = false) =>
    window.UIManager.hideTooltip(immediate);

  // --- POSITION TOOLTIP WITH BOUNDARY CLAMPING ---
  window.UIManager.positionTooltip = function (e, tt) {
    if (window.tooltipHideTimeoutId) {
      clearTimeout(window.tooltipHideTimeoutId);
      window.tooltipHideTimeoutId = null;
    }
    let containerEl = document.getElementById("game-container");
    let container = containerEl
      ? containerEl.getBoundingClientRect()
      : { left: 0, top: 0 };

    let clientX =
      e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let clientY =
      e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    let ttWidth = tt.offsetWidth;
    let ttHeight = tt.offsetHeight;
    let padding = 10;

    let vx, vy;
    const isLandscapeMobile =
      window.innerHeight <= 550 && window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 600 || isLandscapeMobile;

    if (isMobile) {
      let isComparison = tt.querySelector(".compare-border") !== null;
      if (isComparison) {
        tt.style.fontSize = "9.5px";
        tt.querySelectorAll(".tooltip-card").forEach((card) => {
          card.style.padding = "6px 8px";
        });
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "10.5px";
          title.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "8.5px";
          sub.style.marginBottom = "2px";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "9px";
          line.style.marginBottom = "1px";
        });
        ttWidth = tt.offsetWidth;
        ttHeight = tt.offsetHeight;
      } else {
        tt.style.fontSize = "";
        tt.querySelectorAll(".tooltip-card").forEach((card) => {
          card.style.padding = "";
        });
        tt.querySelectorAll(".tt-title").forEach((title) => {
          title.style.fontSize = "";
          title.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
          sub.style.fontSize = "";
          sub.style.marginBottom = "";
        });
        tt.querySelectorAll(".tt-stat-line").forEach((line) => {
          line.style.fontSize = "";
          line.style.marginBottom = "";
        });
      }

      vx = (window.innerWidth - ttWidth) / 2;
      vy = clientY + 18;

      if (vy + ttHeight > window.innerHeight) {
        vy = clientY - ttHeight - 18;
      }
      if (vy < padding) vy = padding;

      let spaceAvailable = window.innerHeight - 2 * padding;
      if (ttHeight > spaceAvailable) {
        tt.style.maxHeight = spaceAvailable + "px";
        tt.style.overflowY = "auto";
        vy = padding;
      } else {
        tt.style.maxHeight = "";
        tt.style.overflowY = "";
      }
    } else {
      tt.style.fontSize = "";
      tt.style.maxHeight = "";
      tt.style.overflowY = "";
      tt.querySelectorAll(".tooltip-card").forEach((card) => {
        card.style.padding = "";
      });
      tt.querySelectorAll(".tt-title").forEach((title) => {
        title.style.fontSize = "";
        title.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-subtitle").forEach((sub) => {
        sub.style.fontSize = "";
        sub.style.marginBottom = "";
      });
      tt.querySelectorAll(".tt-stat-line").forEach((line) => {
        line.style.fontSize = "";
        line.style.marginBottom = "";
      });

      vx = clientX + 15;
      vy = clientY + 15;

      if (vx + ttWidth > window.innerWidth) vx = clientX - ttWidth - 15;
      if (vy + ttHeight > window.innerHeight) vy = clientY - ttHeight - 15;

      if (vx < 5) vx = 5;
      if (vy < 5) vy = 5;
    }

    let x = vx - container.left;
    let y = vy - container.top;

    tt.style.left = x + "px";
    tt.style.top = y + "px";
  };
  export const positionTooltip = (e, tt) => window.UIManager.positionTooltip(e, tt);

  // --- PREVENT TOOLTIP EVENT LEAKS ---
  export function preventTooltipLeaks(id) {
    let el = document.getElementById(id);
    if (!el) return;

    let startY = 0;
    let startX = 0;
    let isScrolling = false;

    el.addEventListener("mouseenter", () => {
      if (window.tooltipHideTimeoutId) {
        clearTimeout(window.tooltipHideTimeoutId);
        window.tooltipHideTimeoutId = null;
      }
    });
    el.addEventListener("mouseleave", () => {
      window.hideTooltip();
    });

    const handleStart = (clientX, clientY) => {
      startY = clientY;
      startX = clientX;
      isScrolling = false;
    };

    const handleMove = (clientX, clientY) => {
      let diffY = Math.abs(clientY - startY);
      let diffX = Math.abs(clientX - startX);
      if (diffY > 8 || diffX > 8) {
        isScrolling = true;
      }
    };

    const handleEnd = (e) => {
      if (isScrolling) return;

      if (
        e.target.closest("summary") ||
        e.target.closest("details") ||
        e.target.closest("button") ||
        e.target.closest("select") ||
        e.target.closest("option") ||
        e.target.closest("label") ||
        e.target.closest("input")
      ) {
        return;
      }

      e.preventDefault();
      window.hideTooltip();
    };

    el.addEventListener(
      "pointerdown",
      (e) => {
        e.stopPropagation();
        handleStart(e.clientX, e.clientY);
      },
      { passive: false },
    );

    el.addEventListener(
      "pointermove",
      (e) => {
        e.stopPropagation();
        handleMove(e.clientX, e.clientY);
      },
      { passive: true },
    );

    el.addEventListener(
      "pointerup",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );

    el.addEventListener(
      "touchstart",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        e.stopPropagation();
        if (e.touches && e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true },
    );

    el.addEventListener(
      "touchend",
      (e) => {
        e.stopPropagation();
        handleEnd(e);
      },
      { passive: false },
    );
  }

  // --- MOBILE LONG-PRESS SLOT GESTURE ---
  export function startSlotLongPress(e, slotKey) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    window.isSlotLongPressActive = false;
    if (window.slotLongPressTimeout) clearTimeout(window.slotLongPressTimeout);

    let target = e.currentTarget;
    target.style.transform = "scale(0.95)";
    target.style.transition = "transform 0.1s";

    let startX = e.clientX;
    let startY = e.clientY;

    const cancelOnMove = (moveEvent) => {
      let diffX = Math.abs(moveEvent.clientX - startX);
      let diffY = Math.abs(moveEvent.clientY - startY);
      if (diffX > 8 || diffY > 8) {
        if (window.slotLongPressTimeout) {
          clearTimeout(window.slotLongPressTimeout);
          window.slotLongPressTimeout = null;
        }
        target.style.transform = "none";
        target.removeEventListener("pointermove", cancelOnMove);
      }
    };
    target.addEventListener("pointermove", cancelOnMove);

    window.slotLongPressTimeout = setTimeout(() => {
      window.isSlotLongPressActive = true;
      target.style.transform = "none";
      target.removeEventListener("pointermove", cancelOnMove);

      let mockEvent = {
        clientX: startX,
        clientY: startY,
        stopPropagation: () => {},
        preventDefault: () => {},
      };

      if (typeof window.showSlotTooltip === "function") {
        window.showSlotTooltip(mockEvent, slotKey);
      }

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 450);
  }

  export function endSlotLongPress(e) {
    if (window.slotLongPressTimeout) {
      clearTimeout(window.slotLongPressTimeout);
      window.slotLongPressTimeout = null;
    }
    if (e && e.currentTarget) {
      e.currentTarget.style.transform = "none";
    }
  }

  // --- SHOW TOOLTIP HANDLERS ---
  export function showItemTooltip(e, item) {
    if (!item) return;
    if (e && e.stopPropagation) e.stopPropagation();

    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    if (item.type === "card") {
      let cardKey = item.cardKey;
      let cardData = (window.MONSTER_CARDS_DATA &&
        window.MONSTER_CARDS_DATA[cardKey]) || {
        name: item.name || "Monster Card",
        set: "Whispering Woods",
      };
      let setColors = {
        "Whispering Woods": "#2ecc71",
        "Mountain Peaks": "#3498db",
        "Inferno Depths": "#e74c3c",
        "Fungal Swamp": "#1abc9c",
        "Void Singularity": "#9b59b6",
        "Cosmic Wardens": "#f1c40f",
      };
      let setCol = setColors[cardData.set] || "#ffd700";
      let iconHtml = window.getItemIconSvg
        ? window.getItemIconSvg(item, 44)
        : "";
      let ownedQty =
        (window.playerStats &&
          window.playerStats.monsterCards &&
          window.playerStats.monsterCards[cardKey]) ||
        1;

      tt.innerHTML = `
            <div class="tooltip-card" style="border: 2px solid ${setCol}; border-radius: 6px; background: rgba(10, 8, 20, 0.96); padding: 12px; width: 250px; box-sizing: border-box;">
              <div style="font-size: 8px; font-weight: bold; color: ${setCol}; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
                [ BESTIARY CARD • ${cardData.set.toUpperCase()} ]
              </div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                ${iconHtml}
                <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
                  <span class="tt-title" style="color: ${setCol}; font-weight: bold; font-size: 13px; margin: 0;">${cardData.name || item.name}</span>
                  <span style="color: #94a3b8; font-size: 9px; font-family: monospace;">Collected: <strong style="color: #ffffff;">x${ownedQty}</strong></span>
                </div>
              </div>
              <div style="font-size: 9.5px; color: #cbd5e1; font-family: monospace; line-height: 1.4; text-align: left;">
                <strong style="color: #ffd700; display: block; margin-bottom: 2px;">[ALBUM AFFILIATION]</strong>
                Belongs to the <strong>${cardData.set}</strong> set. Collect all set cards to unlock passive set bonuses in the Bestiary Album!
              </div>
            </div>
          `;
      tt.style.borderColor = setCol;
      tt.style.display = "block";
      window.positionTooltip(e, tt);
      return;
    }

    tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  export function showConsumableTooltip(e, name) {
    if (e && e.stopPropagation) e.stopPropagation();
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    let data = (window.useDex && window.useDex[name]) || {
      desc: "Consumable Item",
      color: "#2ecc71",
    };

    let col = data.color || "#2ecc71";
    let iconHtml = window.getUseIconHtml ? window.getUseIconHtml(name, 36) : "";

    let effectText = "";
    if (name.includes("Attack Elixir")) {
      let pct = name.includes("Supernal")
        ? "35%"
        : name.includes("Greater")
          ? "20%"
          : "10%";
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Increases Attack Power by <strong style="color: #2ecc71;">+${pct}</strong> for the next <strong style="color: #f1c40f;">${runs}</strong> run(s).`;
    } else if (name.includes("Vitality Elixir")) {
      let pct = name.includes("Supernal")
        ? "35%"
        : name.includes("Greater")
          ? "20%"
          : "10%";
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Increases Maximum HP by <strong style="color: #e74c3c;">+${pct}</strong> for the next <strong style="color: #f1c40f;">${runs}</strong> run(s).`;
    } else if (name.includes("Armored Elixir")) {
      let pct = name.includes("Supernal")
        ? "35%"
        : name.includes("Greater")
          ? "20%"
          : "10%";
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Increases Defense by <strong style="color: #3498db;">+${pct}</strong> for the next <strong style="color: #f1c40f;">${runs}</strong> run(s).`;
    } else if (name.includes("Haste Elixir")) {
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Increases Movement Speed for the next <strong style="color: #f1c40f;">${runs}</strong> run(s).`;
    } else if (name.includes("Double XP Elixir")) {
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Doubles all gained Experience (XP) by <strong style="color: #a855f7;">+100%</strong> for the next <strong style="color: #f1c40f;">${runs}</strong> run(s).`;
    } else if (name.includes("Double Drop Elixir")) {
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Adds <strong style="color: #22c55e;">+100%</strong> to eligible random monster equipment, Monster Soul/material, Cavern Sigil, and Monster Card chance multipliers for the next <strong style="color: #f1c40f;">${runs}</strong> run(s). Each chance caps at 100%; guaranteed and direct rewards are unchanged.`;
    } else if (name.includes("Drop Quality Elixir")) {
      let runs = name.includes("Supernal")
        ? "3"
        : name.includes("Greater")
          ? "2"
          : "1";
      effectText = `Adds <strong style="color: #3b82f6;">+50% Drop Quality</strong> for the next <strong style="color: #f1c40f;">${runs}</strong> run(s), improving higher-rarity odds among equipment tiers already unlocked. It does not unlock rarity tiers or create a minimum rarity.`;
    } else if (name.includes("SP Reset Scroll")) {
      effectText = `Instantly resets and <strong style="color: #9b59b6;">refunds all uncommitted and committed Attribute SP allocations</strong> back to your character pool.`;
    } else if (name.includes("Cavern Sigil Sack")) {
      effectText = `Guarantees <strong style="color: #c084fc;">1x random Cavern Sigil</strong> scaled to peak progression, with its star roll affected by your resolved Drop Quality without unlocking future tiers.`;
    } else if (name === "Monster Card Sack") {
      effectText = `Guarantees <strong style="color: #ffd700;">5x random Monster Cards</strong> added to your Bestiary Album. Complete sets to earn massive passive milestone bonuses.`;
    } else if (name === "Astral Singularity Cache") {
      effectText = `Unseals a <strong style="color: #a855f7;">highly valuable Unique Equipment Item</strong> scaled to peak stage level, along with potential material caches.`;
    } else if (name === "Astral Artifact Cache") {
      effectText = `Guarantees <strong style="color: #1abc9c;">1x Rare Artifact</strong> and unseals <strong style="color: #2ecc71;">2 to 4 Catalyst Cores</strong> directly into your stash.`;
    } else if (name === "Daily Reward Sack") {
      effectText = `Standardized Daily Reward. Guarantees <strong style="color: #ffd700;">1 QP</strong> and <strong style="color: #38bdf8;">1x Equipment</strong> scaled to Lifetime Peak Stage. Equipment rarity uses your resolved Drop Quality and currently unlocked tiers; extra loot rolls remain separate.`;
    } else if (name.includes("Sack") || name.includes("Crate")) {
      effectText = `Guarantees <strong style="color: #f1c40f;">1x Equipment item</strong> scaled to peak stage plus <strong style="color: #34d399;">1 to 2 basic elixirs</strong>. Equipment rarity uses resolved Drop Quality and only tiers unlocked at peak progression.`;
    } else {
      effectText = data.desc || "Consumable Item";
    }

    tt.innerHTML = `
        <div class="tooltip-card" style="border: 2px solid ${col}; border-radius: 6px; background: rgba(10, 8, 20, 0.96); padding: 12px; width: 250px; box-sizing: border-box;">
          <div style="font-size: 8px; font-weight: bold; color: ${col}; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
            [ CONSUMABLE ITEM ]
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
            ${iconHtml}
            <div style="display: flex; flex-direction: column; min-width: 0; text-align: left;">
              <span class="tt-title" style="color: ${col}; font-weight: bold; font-size: 13px; margin: 0; border: none; padding: 0;">${name}</span>
              <span style="color: #94a3b8; font-size: 9px; font-family: monospace;">Consumable</span>
            </div>
          </div>
          <div style="font-size: 9.5px; color: #cbd5e1; font-family: monospace; line-height: 1.4; text-align: left;">
            <strong style="color: #ffd700; display: block; margin-bottom: 2px;">EFFECT:</strong>
            ${effectText}
          </div>
        </div>
      `;
    tt.style.borderColor = col;
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  export function showModifierTooltip(e, id, isBuff, customDesc = null) {
    if (e && e.stopPropagation) e.stopPropagation();
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    let mod = isBuff
      ? (window.CAVERN_BUFFS || []).find((x) => x.id === id)
      : (window.CAVERN_DEBUFFS || []).find((x) => x.id === id);

    if (!mod) return;

    let color = isBuff ? "#10b981" : "#ef4444";
    let prefix = isBuff ? "MUTATOR BUFF" : "MUTATOR DEBUFF";
    let desc = customDesc || mod.desc;

    tt.innerHTML = `
        <div class="tooltip-card" style="border: 2px solid ${color}; border-radius: 6px; background: rgba(10, 2, 2, 0.95); padding: 12px; width: 240px; box-sizing: border-box;">
          <div style="font-size: 8px; font-weight: bold; color: ${isBuff ? "#34d399" : "#ff7675"}; font-family: monospace; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
            [ ${prefix} ]
          </div>
          <div class="tt-title" style="color: ${color}; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 6px; font-weight: bold; font-size: 12px; font-family: monospace; text-transform: uppercase;">
            ${mod.name}
          </div>
          <div class="tt-desc" style="color: #cbd5e1; font-size: 10px; line-height: 1.4; font-family: monospace; white-space: normal;">
            ${desc}
          </div>
        </div>
      `;
    tt.style.borderColor = color;
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  export function showInventoryTooltip(e, itemId) {
    if (
      e &&
      e.target &&
      e.target.closest &&
      (e.target.closest("button") || e.target.closest(".btn-action"))
    )
      return;
    e.stopPropagation();

    let item =
      (window.inventory &&
        window.inventory.EQUIP &&
        window.inventory.EQUIP.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.SIGIL &&
        window.inventory.SIGIL.find((i) => i.id === itemId)) ||
      (window.frozenItemDb && window.frozenItemDb[itemId]);

    if (!item) return;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  export function showSlotTooltip(e, slot) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.equippedSlots) return;
    let item = window.equippedSlots[slot];
    if (!item) return;
    item.isEquippedSlot = slot;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  export function showForgeTooltip(e, itemId) {
    if (
      e &&
      e.target &&
      e.target.closest &&
      (e.target.closest("button") || e.target.closest(".btn-action"))
    )
      return;
    e.stopPropagation();

    let item =
      (window.inventory &&
        window.inventory.EQUIP &&
        window.inventory.EQUIP.find((i) => i.id === itemId)) ||
      (window.inventory &&
        window.inventory.ARTIFACT &&
        window.inventory.ARTIFACT.find((i) => i.id === itemId));

    if (!item && window.equippedSlots) {
      for (let k in window.equippedSlots) {
        if (window.equippedSlots[k] && window.equippedSlots[k].id === itemId) {
          item = window.equippedSlots[k];
          item.isEquippedSlot = k;
          break;
        }
      }
    }
    if (!item) return;
    let tt = document.getElementById("game-tooltip");
    if (!tt) return;

    tt.innerHTML = window.buildGeneralTooltipHtml(item, false);
    tt.style.borderColor = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#3498db";
    tt.style.display = "block";
    window.positionTooltip(e, tt);
  }

  // --- DUAL-RING COMPARISON TOGGLE ---
  export function toggleRingComparisonSlot(e, itemId) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    window.state.preferredRingComparisonSlot =
      (window.state.preferredRingComparisonSlot || "ring1") === "ring1"
        ? "ring2"
        : "ring1";

    let tt = document.getElementById("game-tooltip");
    if (tt && tt.style.display === "block" && itemId) {
      let item = null;

      // Broad search across all potential inventory, equipped, and bag states
      if (window.inventory && window.inventory.EQUIP) {
        item = window.inventory.EQUIP.find((i) => i.id === itemId);
      }
      if (!item && window.player && window.player.bag) {
        item = window.player.bag.find((i) => i.id === itemId);
      }
      if (!item && window.equippedSlots) {
        for (let k in window.equippedSlots) {
          if (
            window.equippedSlots[k] &&
            window.equippedSlots[k].id === itemId
          ) {
            item = window.equippedSlots[k];
            break;
          }
        }
      }
      if (!item && window.frozenItemDb) {
        item = window.frozenItemDb[itemId];
      }

      if (item) {
        tt.innerHTML = window.buildGeneralTooltipHtml(item, true);
        tt.style.borderColor = window.getTierColor
          ? window.getTierColor(item.statsRolled)
          : "#3498db";
      }
    }
  }

  // Global Outside-Tap Tooltip Dismissal Handler
  document.addEventListener("pointerdown", function (e) {
    ["game-tooltip", "etc-tooltip", "stat-tooltip", "log-item-tooltip"].forEach(
      (id) => {
        let tt = document.getElementById(id);
        if (tt && tt.style.display !== "none" && tt.style.display !== "") {
          if (!e.target.closest(`#${id}`)) {
            window.UIManager.hideTooltip(true);
          }
        }
      },
    );
  });

  // Attach event leak protection on ready
  document.addEventListener("DOMContentLoaded", () => {
    window.preventTooltipLeaks("game-tooltip");
    window.preventTooltipLeaks("etc-tooltip");
    window.preventTooltipLeaks("stat-tooltip");
  });

