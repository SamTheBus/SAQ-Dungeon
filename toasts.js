  // --- TOUCH / POINTER SWIPE NOTIFICATION DISMISSAL ENGINE ---
  export function attachToastSwipeHandlers(toast, onClickCallback) {
    let startX = 0,
      startY = 0;
    let deltaX = 0,
      deltaY = 0;
    let isDragging = false;
    let startTime = 0;
    let mode = null;

    toast.addEventListener("pointerdown", (e) => {
      // Guard: Abort swipe/drag capturing if clicking the quick equip button
      if (e.target.closest("button")) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      deltaX = 0;
      deltaY = 0;
      startTime = Date.now();
      mode = null;
      toast.style.transition = "none";
      try {
        toast.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    toast.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      deltaX = e.clientX - startX;
      deltaY = e.clientY - startY;

      if (!mode) {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
          mode = "up";
        } else if (
          Math.abs(deltaX) > 8 &&
          Math.abs(deltaX) >= Math.abs(deltaY)
        ) {
          mode = "side";
        }
      }

      if (mode === "up") {
        let moveY = Math.min(0, deltaY);
        let alpha = Math.max(0, 1 - Math.abs(moveY) / 100);
        let container = document.getElementById("toast-container");
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            t.style.transition = "none";
            t.style.transform = `translateY(${moveY}px)`;
            t.style.opacity = alpha;
          });
        }
      } else if (mode === "side") {
        let alpha = Math.max(0, 1 - Math.abs(deltaX) / 180);
        toast.style.transform = `translateX(${deltaX}px)`;
        toast.style.opacity = alpha;
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        toast.releasePointerCapture(e.pointerId);
      } catch (err) {}

      let elapsed = Date.now() - startTime;
      let distY = deltaY;
      let distX = deltaX;

      if (Math.abs(distX) < 5 && Math.abs(distY) < 5) {
        toast.style.transition = "all 0.2s ease";
        toast.style.transform = "";
        toast.style.opacity = "1";
        if (typeof onClickCallback === "function") {
          onClickCallback(e);
        }
        return;
      }

      let container = document.getElementById("toast-container");

      if (mode === "up" && (distY < -30 || (elapsed < 250 && distY < -15))) {
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            if (t.dismissTimeout) clearTimeout(t.dismissTimeout);
            t.style.transition =
              "transform 0.22s ease-in, opacity 0.22s ease-in";
            t.style.transform = `translateY(-120px)`;
            t.style.opacity = "0";
            setTimeout(() => {
              if (t.parentNode) t.parentNode.removeChild(t);
              window.processToastQueue();
            }, 220);
          });
        }
      } else if (
        mode === "side" &&
        (Math.abs(distX) > 40 || (elapsed < 250 && Math.abs(distX) > 20))
      ) {
        if (toast.dismissTimeout) clearTimeout(toast.dismissTimeout);
        let exitX = distX > 0 ? 350 : -350;
        toast.style.transition =
          "transform 0.22s ease-in, opacity 0.22s ease-in";
        toast.style.transform = `translateX(${exitX}px)`;
        toast.style.opacity = "0";
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
          window.processToastQueue();
        }, 220);
      } else {
        if (container) {
          let allToasts = container.querySelectorAll(
            ".item-toast, .header-toast",
          );
          allToasts.forEach((t) => {
            t.style.transition =
              "transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), opacity 0.2s ease";
            t.style.transform = "";
            t.style.opacity = "1";
          });
        }
      }
    };

    toast.addEventListener("pointerup", endDrag);
    toast.addEventListener("pointercancel", endDrag);
  }

  window.toastQueue = window.toastQueue || [];

  export function processToastQueue() {
    let container = document.getElementById("toast-container");
    if (!container) return;

    let activeToasts = container.querySelectorAll(".item-toast, .header-toast");
    let activeCount = Array.from(activeToasts).filter(
      (t) => !t.classList.contains("toast-fade-out"),
    ).length;

    if (activeCount >= 3) return; // Cap at 3 concurrent visible notifications
    if (window.toastQueue.length === 0) return;

    let nextRequest = window.toastQueue.shift();
    if (nextRequest.type === "item") {
      window.executePushItemToast(nextRequest.item);
    } else if (nextRequest.type === "material") {
      window.executePushMaterialToast(
        nextRequest.name,
        nextRequest.qty,
        nextRequest.color,
      );
    } else if (nextRequest.type === "header") {
      window.executePushHeaderToast(
        nextRequest.msg,
        nextRequest.color,
        nextRequest.onClick,
      );
    }

    setTimeout(window.processToastQueue, 50);
  }

  // --- ITEM PICKUP TOAST NOTIFICATION ENGINE ---
  export function pushToast(item) {
    if (!item) return;
    let container = document.getElementById("toast-container");
    if (container) {
      let existingToast = Array.from(
        container.querySelectorAll(".item-toast"),
      ).find(
        (t) =>
          t.dataset.itemName === item.name &&
          !t.classList.contains("toast-fade-out"),
      );

      if (existingToast) {
        let currentQty = parseInt(existingToast.dataset.itemQty, 10) || 0;
        let newQty = currentQty + 1;
        existingToast.dataset.itemQty = newQty;

        let lootHeaderEl = existingToast.querySelector(".toast-loot-header");
        let countEl = existingToast.querySelector(".toast-count-val");

        if (lootHeaderEl) lootHeaderEl.innerText = `+${newQty} LOOT`;
        if (countEl) countEl.innerText = `x${newQty}`;

        existingToast.classList.remove("toast-pop-bump");
        void existingToast.offsetWidth;
        existingToast.classList.add("toast-pop-bump");

        if (existingToast.dismissTimeout) {
          clearTimeout(existingToast.dismissTimeout);
        }

        if (
          window.SoundManager &&
          typeof window.SoundManager.playLootDrop === "function"
        ) {
          window.SoundManager.playLootDrop(item.statsRolled);
        }

        existingToast.dismissTimeout = setTimeout(() => {
          existingToast.classList.add("toast-fade-out");
          setTimeout(() => {
            if (existingToast.parentNode) {
              existingToast.parentNode.removeChild(existingToast);
              window.processToastQueue();
            }
          }, 300);
        }, 2800);

        return;
      }
    }

    // Merge duplicate drop items waiting in queue
    let existingInQueue = window.toastQueue.find(
      (q) => q.type === "item" && q.item.name === item.name,
    );
    if (existingInQueue) {
      existingInQueue.qty = (existingInQueue.qty || 1) + 1;
      return;
    }

    window.toastQueue.push({ type: "item", item: item, qty: 1 });
    window.processToastQueue();
  }

  export function executePushItemToast(item) {
    let container = document.getElementById("toast-container");
    if (!container) return;

    let col = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";
    let iconHtml = window.getItemIconSvg ? window.getItemIconSvg(item, 26) : "";

    let toast = document.createElement("div");
    toast.className = "item-toast";
    toast.style.borderColor = col;
    toast.dataset.itemName = item.name;
    toast.dataset.itemQty = 1;

    // Allow clicking the main body of the toast to compare/inspect the loot
    toast.setAttribute(
      "onclick",
      `window.showItemTooltip(event, window.frozenItemDb[${item.id}])`,
    );
    toast.style.cursor = "pointer";

    // Determine if target slots are currently occupied
    let isSlotOccupied = false;
    if (window.equippedSlots) {
      let t = item.type;
      if (t === "weapon" && window.equippedSlots.weapon) isSlotOccupied = true;
      else if (t === "helmet" && window.equippedSlots.helmet)
        isSlotOccupied = true;
      else if (t === "boots" && window.equippedSlots.boots)
        isSlotOccupied = true;
      else if (
        ["subweapon", "shield", "dagger", "tome"].includes(t) &&
        window.equippedSlots.subweapon
      )
        isSlotOccupied = true;
      else if (
        t === "chest" &&
        (window.equippedSlots.chest || window.equippedSlots.overall)
      )
        isSlotOccupied = true;
      else if (
        t === "leggings" &&
        (window.equippedSlots.leggings || window.equippedSlots.overall)
      )
        isSlotOccupied = true;
      else if (
        t === "overall" &&
        (window.equippedSlots.overall ||
          window.equippedSlots.chest ||
          window.equippedSlots.leggings)
      )
        isSlotOccupied = true;
      else if (
        t === "ring" &&
        window.equippedSlots.ring1 &&
        window.equippedSlots.ring2
      )
        isSlotOccupied = true;
      else if (
        t === "artifact" &&
        window.equippedSlots.art1 &&
        window.equippedSlots.art2 &&
        window.equippedSlots.art3
      )
        isSlotOccupied = true;
    }

    // Robust check for quick-equips: Equipment of Rare (1*) or higher, or Uniques (or any equipment if slot is occupied to allow quick swap)
    let canQuickEquip = false;
    let equipTypes = [
      "weapon",
      "subweapon",
      "shield",
      "dagger",
      "tome",
      "helmet",
      "chest",
      "leggings",
      "overall",
      "boots",
      "ring",
      "artifact",
    ];
    let stars =
      typeof item.statsRolled === "number"
        ? item.statsRolled
        : parseInt(item.statsRolled, 10);
    if (isNaN(stars)) stars = 0;

    let isUnique =
      typeof window.isItemUnique === "function" && window.isItemUnique(item);

    if (equipTypes.includes(item.type)) {
      if (isUnique || stars >= 1 || isSlotOccupied) {
        canQuickEquip = true;
      }
    }

    let quickEquipBtn = "";
    if (canQuickEquip && !item.wasAutoEquipped) {
      let isHub = window.currentGameState === window.GAME_STATES.HUB;
      let btnText = isSlotOccupied ? "SWAP" : "EQUIP";
      quickEquipBtn = `
                    <button class="action-btn-sm action-btn-equip" style="margin-left: 8px; flex-shrink: 0; font-size: 8.5px; font-weight: 900; padding: 3px 7px; background: linear-gradient(180deg, #10b981 0%, #047857 100%); border: 1.5px solid #34d399; border-radius: 4px; color: #fff; cursor: pointer; box-shadow: 0 0 8px rgba(52, 211, 153, 0.45);"
                            onpointerdown="event.stopPropagation();"
                            onclick="event.stopPropagation(); window.handleQuickEquipToast(this, ${item.id}, ${isHub});">
                      ${btnText}
                    </button>
                  `;
    }

    toast.innerHTML = `
                ${iconHtml}
                <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
                  <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${col}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
                    <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                      <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                      <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
                    </svg>
                    <span class="toast-loot-header">+1 LOOT</span>
                    ${item.wasAutoEquipped ? `<span style="background:#2ecc71; color:#05030a; font-weight:900; font-size:7px; padding:1px 3px; border-radius:2px; font-family:monospace; margin-left:5px; letter-spacing:0.5px; line-height:1;">AUTO-EQUIPPED</span>` : ""}
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
                    <span style="color:${col}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span>
                    <span class="toast-count-val" style="color:${col}; font-family:monospace; font-weight:800; flex-shrink:0;">x1</span>
                  </div>
                </div>
                ${quickEquipBtn}
              `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast);

    if (
      window.SoundManager &&
      typeof window.SoundManager.playLootDrop === "function"
    ) {
      window.SoundManager.playLootDrop(item.statsRolled);
    }

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          window.processToastQueue();
        }
      }, 300);
    }, 2800);
  }

  export function handleQuickEquipToast(btnElement, itemId, isHub) {
    if (isHub) {
      window.equipFromStash(itemId);
    } else {
      window.equipFromBag(itemId);
    }

    btnElement.disabled = true;
    btnElement.style.background = "#10b981";
    btnElement.style.borderColor = "#34d399";
    let wasSwap = btnElement.innerText.trim() === "SWAP";
    btnElement.innerText = wasSwap ? "SWAPPED" : "EQUIPPED";

    let toast = btnElement.closest(".item-toast");
    if (toast) {
      if (toast.dismissTimeout) clearTimeout(toast.dismissTimeout);
      toast.dismissTimeout = setTimeout(() => {
        toast.classList.add("toast-fade-out");
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
            window.processToastQueue();
          }
        }, 300);
      }, 500); // Trigger fast 500ms exit fade
    }
  }

  export function pushMaterialToast(name, qty, customColor = null) {
    if (!name || qty <= 0) return;
    let container = document.getElementById("toast-container");
    if (container) {
      let existingToast = Array.from(
        container.querySelectorAll(".item-toast"),
      ).find(
        (t) =>
          t.dataset.itemName === name &&
          !t.classList.contains("toast-fade-out"),
      );

      if (existingToast) {
        let currentQty = parseInt(existingToast.dataset.itemQty, 10) || 0;
        let newQty = currentQty + qty;
        existingToast.dataset.itemQty = newQty;

        let lootHeaderEl = existingToast.querySelector(".toast-loot-header");
        let countEl = existingToast.querySelector(".toast-count-val");

        if (lootHeaderEl) lootHeaderEl.innerText = `+${newQty} LOOT`;
        if (countEl) countEl.innerText = `x${newQty}`;

        existingToast.classList.remove("toast-pop-bump");
        void existingToast.offsetWidth;
        existingToast.classList.add("toast-pop-bump");

        if (existingToast.dismissTimeout) {
          clearTimeout(existingToast.dismissTimeout);
        }

        existingToast.dismissTimeout = setTimeout(() => {
          existingToast.classList.add("toast-fade-out");
          setTimeout(() => {
            if (existingToast.parentNode) {
              existingToast.parentNode.removeChild(existingToast);
              window.processToastQueue();
            }
          }, 300);
        }, 2500);

        return;
      }
    }

    let existingInQueue = window.toastQueue.find(
      (q) => q.type === "material" && q.name === name,
    );
    if (existingInQueue) {
      existingInQueue.qty += qty;
      return;
    }

    window.toastQueue.push({
      type: "material",
      name: name,
      qty: qty,
      color: customColor,
    });
    window.processToastQueue();
  }

  export function executePushMaterialToast(name, qty, customColor) {
    let container = document.getElementById("toast-container");
    if (!container) return;

    let color = customColor;
    if (!color) {
      if (window.useDex && window.useDex[name] && window.useDex[name].color) {
        color = window.useDex[name].color;
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
        color = matColors[name] || "#00d2ff";
      }
    }

    let iconHtml = "";
    if (window.getEtcIconHtml && window.etcDex && window.etcDex[name]) {
      iconHtml = window.getEtcIconHtml(name, 26);
    } else if (window.getUseIconHtml && window.useDex && window.useDex[name]) {
      iconHtml = window.getUseIconHtml(name, 26);
    }

    let toast = document.createElement("div");
    toast.className = "item-toast";
    toast.style.borderColor = color;
    toast.dataset.itemName = name;
    toast.dataset.itemQty = qty;

    toast.innerHTML = `
              ${iconHtml}
              <div class="toast-info" style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
                <div style="display:flex; align-items:center; font-size:8.5px; font-weight:800; color:${color}; text-transform:uppercase; letter-spacing:0.5px; line-height:1;">
                  <svg width="11" height="11" viewBox="0 0 64 64" style="display:inline-block; vertical-align:middle; margin-right:4px; flex-shrink:0;">
                    <path d="M32 18 C20 18, 10 22, 10 38 C10 50, 18 56, 32 58 C46 58, 54 50, 54 38 C54 22, 44 18, 32 18 Z" fill="#a05a2c" stroke="#111" stroke-width="4" />
                    <path d="M22 22 Q32 26, 42 22" fill="none" stroke="#ffd700" stroke-width="5" stroke-linecap="round" />
                  </svg>
                  <span class="toast-loot-header">+${qty} LOOT</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f1f5f9; line-height:1.2;">
                  <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${name}</span>
                  <span class="toast-count-val" style="color:${color}; font-family:monospace; font-weight:800; flex-shrink:0;">x${qty}</span>
                </div>
              </div>
            `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast);

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          window.processToastQueue();
        }
      }, 300);
    }, 2500);
  }

  export function pushHeaderToast(msg, color = "#00d2ff", onClick = null) {
    window.toastQueue.push({
      type: "header",
      msg: msg,
      color: color,
      onClick: onClick,
    });
    window.processToastQueue();
  }

  export function executePushHeaderToast(msg, color, onClick) {
    let container = document.getElementById("toast-container");
    if (!container) return;

    let toast = document.createElement("div");
    toast.className = "header-toast";
    toast.style.borderColor = color;
    toast.style.boxShadow = `0 10px 30px rgba(0,0,0,0.9), 0 0 12px ${color}44`;

    let isBound = msg.includes("SOUL BOUND") || msg.includes("Protected");
    let isUnbound = msg.includes("UNBOUND") || msg.includes("At Risk");

    let iconSvg = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
            <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="${color}22"/>
            ${isBound ? `<path d="M9 12l2 2 4-4" stroke="${color}" stroke-width="2.5"/>` : isUnbound ? `<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>` : `<circle cx="12" cy="12" r="3" fill="${color}"/>`}
          </svg>
        `;

    toast.innerHTML = `
          ${iconSvg}
          <div style="display:flex; flex-direction:column; min-width:0; flex:1; text-align:left;">
            <span style="color:${color}; font-weight:800; font-size:10.5px; font-family:monospace; line-height:1.2; letter-spacing:0.5px;">${msg}</span>
          </div>
        `;

    container.appendChild(toast);
    window.attachToastSwipeHandlers(toast, onClick);

    toast.dismissTimeout = setTimeout(() => {
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
          window.processToastQueue();
        }
      }, 2800);
    }, 2800);
  }

