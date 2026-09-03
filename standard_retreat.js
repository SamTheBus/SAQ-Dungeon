import { calculateEmergencySalvageGold } from "./run_recovery.js";

const ENTRY_LOADOUT_FIELD = "standardRunEntryLoadoutIds";
const EMERGENCY_HAUL_SELECT_ID = "standard-retreat-emergency-haul-select";

function getItemId(item) {
  if (!item || item.id === undefined || item.id === null) return null;
  return String(item.id);
}

function escapeHtml(value) {
  if (typeof window.escapeHTML === "function") {
    return window.escapeHTML(String(value ?? ""));
  }
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function formatAmount(value) {
  if (typeof window.formatNumber === "function") {
    return window.formatNumber(value);
  }
  let amount = BigNum.from(value || 0);
  if (typeof amount.toFiniteNumber === "function") {
    return amount.toFiniteNumber().toLocaleString();
  }
  return String(Number(amount) || 0);
}

function getEntryIdSet() {
  let ids = window.playerStats?.[ENTRY_LOADOUT_FIELD];
  return new Set(Array.isArray(ids) ? ids.map(String) : []);
}

function classifyItem(item, entryIds) {
  let itemId = getItemId(item);
  if (itemId !== null && entryIds.has(itemId)) return "entry";
  if (item?.locked) return "soul-bound";
  return "at-risk";
}

function addItemToPermanentInventory(item) {
  if (!item || !window.player) return;
  if (!window.inventory) {
    window.inventory = {
      EQUIP: [],
      ARTIFACT: [],
      SIGIL: [],
      ETC: {},
      USE: {},
    };
  }
  if (!window.player.stash) window.player.stash = [];

  if (item.type === "sigil") {
    if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
    window.inventory.SIGIL.push(item);
  } else if (item.type === "artifact") {
    if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
    window.inventory.ARTIFACT.push(item);
  } else {
    window.player.stash.push(item);
  }
}

export function isStandardVoluntaryRetreatMode() {
  let stats = window.playerStats;
  return !!(
    stats &&
    !stats.activeSpecialChallenge &&
    !stats.isRiftMode &&
    !stats.isCrucibleMode
  );
}

export function captureStandardRunEntryLoadout() {
  if (!window.playerStats) return [];
  if (!isStandardVoluntaryRetreatMode()) {
    window.playerStats[ENTRY_LOADOUT_FIELD] = [];
    return [];
  }

  let ids = Object.values(window.equippedSlots || {})
    .map(getItemId)
    .filter((id) => id !== null);
  window.playerStats[ENTRY_LOADOUT_FIELD] = [...new Set(ids)];
  return [...window.playerStats[ENTRY_LOADOUT_FIELD]];
}

export function getStandardVoluntaryRetreatPreview() {
  let entryIds = getEntryIdSet();
  let entryItems = [];
  let soulBoundItems = [];
  let atRiskEquippedItems = [];
  let emergencyHaulCandidates = [];

  Object.values(window.equippedSlots || {}).forEach((item) => {
    if (!item) return;
    let classification = classifyItem(item, entryIds);
    if (classification === "entry") entryItems.push(item);
    else if (classification === "soul-bound") soulBoundItems.push(item);
    else atRiskEquippedItems.push(item);
  });

  (window.player?.bag || []).forEach((item) => {
    if (!item) return;
    let classification = classifyItem(item, entryIds);
    if (classification === "entry") entryItems.push(item);
    else if (classification === "soul-bound") soulBoundItems.push(item);
    else emergencyHaulCandidates.push(item);
  });

  let totalGold = BigNum.from(window.playerStats?.runGold || 0);
  let securedGold = calculateEmergencySalvageGold(totalGold, 0.25);
  let materialResults = [];
  for (let name in window.player?.pendingScraps || {}) {
    let total = Math.max(0, Math.floor(Number(window.player.pendingScraps[name]) || 0));
    if (total <= 0) continue;
    let secured = Math.floor(total * 0.25);
    materialResults.push({
      name,
      total,
      secured,
      forfeited: total - secured,
    });
  }

  return {
    entryIds,
    entryItems,
    soulBoundItems,
    atRiskEquippedItems,
    emergencyHaulCandidates,
    totalGold,
    securedGold,
    forfeitedGold: totalGold.sub(securedGold),
    materialResults,
  };
}

function buildResourceRows(preview) {
  let goldRow = `
    <div style="display:flex; justify-content:space-between; gap:12px;">
      <span>Run Gold</span>
      <strong style="color:#34d399;">${escapeHtml(formatAmount(preview.securedGold))} secured</strong>
      <span style="color:#f87171;">${escapeHtml(formatAmount(preview.forfeitedGold))} forfeited</span>
    </div>`;
  let materialRows = preview.materialResults
    .map(
      (material) => `
        <div style="display:flex; justify-content:space-between; gap:12px;">
          <span>${escapeHtml(material.name)}</span>
          <strong style="color:#34d399;">${material.secured} secured</strong>
          <span style="color:#f87171;">${material.forfeited} forfeited</span>
        </div>`,
    )
    .join("");
  if (!materialRows) {
    materialRows = '<div style="color:#94a3b8;">No pending run materials.</div>';
  }
  return `${goldRow}${materialRows}`;
}

function buildConfirmationHtml(preview) {
  let candidates = preview.emergencyHaulCandidates;
  let haulControl = candidates.length
    ? `
      <label for="${EMERGENCY_HAUL_SELECT_ID}" style="display:block; margin-bottom:5px; color:#f1c40f; font-weight:bold;">Emergency Haul — choose exactly one carried item</label>
      <select id="${EMERGENCY_HAUL_SELECT_ID}" style="width:100%; padding:7px; color:#f8fafc; background:#111827; border:1px solid #f1c40f; border-radius:4px;">
        ${candidates
          .map(
            (item) =>
              `<option value="${escapeHtml(getItemId(item))}">${escapeHtml(item.name || "Unnamed Item")}</option>`,
          )
          .join("")}
      </select>`
    : '<div style="color:#94a3b8;">Emergency Haul: no at-risk carried item is available.</div>';

  return `
    <div style="display:flex; flex-direction:column; gap:10px; text-align:left; line-height:1.45;">
      <div><strong style="color:#34d399;">${preview.entryItems.length} entry-loadout item${preview.entryItems.length === 1 ? "" : "s"} preserved.</strong> Entry gear remains safe even if moved into the satchel.</div>
      <div><strong style="color:#81ecec;">${preview.soulBoundItems.length} additional Soul Bound item${preview.soulBoundItems.length === 1 ? "" : "s"} preserved.</strong></div>
      <div style="padding:8px; background:#0f172a; border:1px solid #334155; border-radius:5px;">${haulControl}</div>
      <div style="display:flex; flex-direction:column; gap:4px; padding:8px; background:#07140f; border:1px solid #14532d; border-radius:5px;">
        <strong>25% run resources secured</strong>
        ${buildResourceRows(preview)}
      </div>
      <div style="color:#f87171;"><strong>Forfeited:</strong> ${preview.atRiskEquippedItems.length} run-acquired equipped item${preview.atRiskEquippedItems.length === 1 ? "" : "s"}, every unchosen at-risk carried item, and the resource amounts shown above.</div>
      <div style="color:#f87171;"><strong>No Recovery Chest is created.</strong> Forfeited assets cannot be recovered.</div>
    </div>`;
}

function renderResultItem(item, label, color) {
  return `
    <div style="background:#101014; border:1px solid #333; border-left:3px solid ${color}; padding:5px 8px; border-radius:4px; font-size:10px; display:flex; justify-content:space-between; gap:10px;">
      <span style="color:${color}; font-weight:bold;">${escapeHtml(item?.name || "Unnamed Item")}</span>
      <span style="color:${color}; font-family:monospace;">${label}</span>
    </div>`;
}

function renderStandardRetreatSummary(result) {
  let summaryModal = document.getElementById("summary-modal");
  let titleEl = document.getElementById("summary-title");
  let subEl = document.getElementById("summary-subtitle");
  let listEl = document.getElementById("summary-loot-list");
  let btnEl = document.getElementById("summary-action-btn");
  let nemesisCard = document.getElementById("death-nemesis-card");

  if (nemesisCard) nemesisCard.style.display = "none";
  if (titleEl) {
    titleEl.innerText = "VOLUNTARY RETREAT COMPLETE";
    titleEl.style.color = "#f1c40f";
  }
  if (subEl) {
    let haulName = result.emergencyHaulItem
      ? result.emergencyHaulItem.name
      : "none available";
    subEl.innerText = `Preserved ${result.entryItems.length} entry-loadout items and ${result.soulBoundItems.length} additional Soul Bound items; Emergency Haul: ${haulName}; secured ${formatAmount(result.securedGold)} of ${formatAmount(result.totalGold)} run Gold. No Recovery Chest created.`;
  }
  if (listEl) {
    let preservedHtml = result.entryItems
      .map((item) => renderResultItem(item, "ENTRY SAFE", "#34d399"))
      .join("");
    let soulBoundHtml = result.soulBoundItems
      .map((item) => renderResultItem(item, "SOUL BOUND", "#81ecec"))
      .join("");
    let haulHtml = result.emergencyHaulItem
      ? renderResultItem(result.emergencyHaulItem, "EMERGENCY HAUL", "#f1c40f")
      : "";
    let forfeitedHtml = result.forfeitedItems
      .map((item) => renderResultItem(item, "FORFEITED", "#f87171"))
      .join("");
    listEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:4px; max-height:200px; overflow-y:auto;">
        ${preservedHtml}${soulBoundHtml}${haulHtml}${forfeitedHtml}
        ${!preservedHtml && !soulBoundHtml && !haulHtml && !forfeitedHtml ? '<div style="color:#94a3b8;">No carried gear was present.</div>' : ""}
      </div>
      <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px; padding-top:7px; border-top:1px dashed #475569; font-size:10px;">
        ${buildResourceRows(result)}
        <strong style="color:#f87171; margin-top:4px;">NO RECOVERY CHEST — forfeited assets are gone.</strong>
      </div>`;
  }
  if (btnEl) btnEl.innerText = "RETURN TO ADVENTURER'S HUB";
  if (summaryModal) summaryModal.style.display = "flex";
}

export function finalizeStandardVoluntaryRetreat(emergencyHaulItemId = null) {
  if (
    !isStandardVoluntaryRetreatMode() ||
    !window.playerStats?.dungeonRunInProgress ||
    !window.player
  ) {
    return false;
  }

  let preview = getStandardVoluntaryRetreatPreview();
  let chosenId =
    emergencyHaulItemId === undefined || emergencyHaulItemId === null
      ? null
      : String(emergencyHaulItemId);
  let emergencyHaulItem =
    chosenId === null
      ? null
      : preview.emergencyHaulCandidates.find(
          (item) => getItemId(item) === chosenId,
        ) || null;

  if (preview.emergencyHaulCandidates.length > 0 && !emergencyHaulItem) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "[!] Choose one carried item for your Emergency Haul.",
        "#f1c40f",
      );
    }
    return false;
  }

  let entryItems = [];
  let soulBoundItems = [];
  let forfeitedItems = [];
  let entryIds = preview.entryIds;

  for (let slotKey in window.equippedSlots || {}) {
    let item = window.equippedSlots[slotKey];
    if (!item) continue;
    let classification = classifyItem(item, entryIds);
    if (classification === "entry") {
      entryItems.push(item);
    } else if (classification === "soul-bound") {
      soulBoundItems.push(item);
    } else {
      forfeitedItems.push(item);
      delete item.isEquippedSlot;
      window.equippedSlots[slotKey] = null;
    }
  }

  let haulConsumed = false;
  (window.player.bag || []).forEach((item) => {
    if (!item) return;
    let classification = classifyItem(item, entryIds);
    if (classification === "entry") {
      entryItems.push(item);
      addItemToPermanentInventory(item);
    } else if (classification === "soul-bound") {
      soulBoundItems.push(item);
      addItemToPermanentInventory(item);
    } else if (!haulConsumed && item === emergencyHaulItem) {
      haulConsumed = true;
      addItemToPermanentInventory(item);
    } else {
      forfeitedItems.push(item);
    }
  });
  window.player.bag = [];

  if (preview.securedGold.gt(0)) {
    window.playerStats.coins = BigNum.from(
      window.playerStats.coins || 0,
    ).add(preview.securedGold);
  }
  preview.materialResults.forEach((material) => {
    if (material.secured > 0 && typeof window.addEtcDrop === "function") {
      window.addEtcDrop(material.name, material.secured, true);
    }
  });

  window.playerStats.runGold = BigNum.from(0);
  window.playerStats.runXp = BigNum.from(0);
  window.player.pendingScraps = {};
  window.playerStats.dungeonRunInProgress = false;
  window.playerStats.activeDungeonSigil = null;
  window.playerStats.robbingMarcusActive = false;
  window.playerStats.abyssalDecayAccumulated = 0;
  window.playerStats[ENTRY_LOADOUT_FIELD] = [];

  // Ground drops were never carried and cannot be collected after the result
  // screen as an unintended second haul.
  window.groundLoot = [];
  window.groundMaterials = [];

  if (typeof window.decrementPotionRunCharges === "function") {
    window.decrementPotionRunCharges();
  }
  if (window.inventory) window.inventory.EQUIP = window.player.stash;

  let result = {
    entryItems,
    soulBoundItems,
    emergencyHaulItem: haulConsumed ? emergencyHaulItem : null,
    forfeitedItems,
    totalGold: preview.totalGold,
    securedGold: preview.securedGold,
    forfeitedGold: preview.forfeitedGold,
    materialResults: preview.materialResults,
  };
  renderStandardRetreatSummary(result);

  if (typeof window.invalidatePlayerStats === "function") {
    window.invalidatePlayerStats();
  }
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.saveGame === "function") window.saveGame();
  return result;
}

export function requestStandardVoluntaryRetreat() {
  let preview = getStandardVoluntaryRetreatPreview();
  let confirmationHtml = buildConfirmationHtml(preview);
  let defaultChoiceId = getItemId(preview.emergencyHaulCandidates[0]);

  let confirmRetreat = function () {
    let choiceSelect = document.getElementById(EMERGENCY_HAUL_SELECT_ID);
    let chosenId = choiceSelect ? choiceSelect.value : defaultChoiceId;
    finalizeStandardVoluntaryRetreat(chosenId);
  };

  if (typeof window.showCustomConfirm === "function") {
    window.showCustomConfirm(
      "Standard Voluntary Retreat",
      confirmationHtml,
      "CONFIRM RETREAT",
      "STAY IN DUNGEON",
      "#e67e22",
      confirmRetreat,
    );
    return true;
  }

  let candidateNames = preview.emergencyHaulCandidates
    .map((item, index) => `${index + 1}. ${item.name || "Unnamed Item"}`)
    .join("\n");
  let chosenId = defaultChoiceId;
  if (
    preview.emergencyHaulCandidates.length > 1 &&
    typeof window.prompt === "function"
  ) {
    let answer = window.prompt(
      `Choose one Emergency Haul item:\n${candidateNames}`,
      "1",
    );
    if (answer === null) return false;
    let selected = preview.emergencyHaulCandidates[Number(answer) - 1];
    if (!selected) return false;
    chosenId = getItemId(selected);
  }

  let plainSummary = `Preserve ${preview.entryItems.length} entry-loadout items and ${preview.soulBoundItems.length} additional Soul Bound items. Secure ${formatAmount(preview.securedGold)} of ${formatAmount(preview.totalGold)} run Gold and 25% of each pending material. Keep one Emergency Haul item${candidateNames ? `:\n${candidateNames}` : ": none available"}. Forfeit the remainder. No Recovery Chest will be created. Continue?`;
  if (typeof window.confirm === "function" && window.confirm(plainSummary)) {
    return finalizeStandardVoluntaryRetreat(chosenId);
  }
  return false;
}
