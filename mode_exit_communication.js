import { calculateEmergencySalvageGold } from "./run_recovery.js?v=1.002";
import { getMasteryNodeRank } from "./mastery_authority.js?v=1.003";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function pendingMaterialEntries(includeGround = false) {
  let totals = {};
  for (let name in window.player?.pendingScraps || {}) {
    let quantity = Math.max(
      0,
      Math.floor(Number(window.player.pendingScraps[name]) || 0),
    );
    if (quantity > 0) totals[name] = (totals[name] || 0) + quantity;
  }

  if (includeGround) {
    for (let drop of window.groundMaterials || []) {
      if (!drop?.name) continue;
      if (drop.name === "Luminous Soul" || drop.name.includes("Key")) continue;
      let quantity = Math.max(0, Math.floor(Number(drop.qty) || 0));
      if (quantity > 0) totals[drop.name] = (totals[drop.name] || 0) + quantity;
    }
  }

  return Object.entries(totals).map(([name, quantity]) => ({
    name,
    quantity,
  }));
}

function formatMaterials(entries) {
  if (!entries || entries.length === 0) return "none";
  return entries
    .map((entry) => `${entry.quantity}x ${entry.name}`)
    .join(", ");
}

function currentEquippedItems() {
  return Object.values(window.equippedSlots || {}).filter(Boolean);
}

function safeModeRetreatPreview(mode) {
  let equippedCount = currentEquippedItems().length;
  let carriedCount = (window.player?.bag || []).filter(Boolean).length;
  let runGold = BigNum.from(window.playerStats?.runGold || 0);
  let materials = pendingMaterialEntries(false);
  let groundItemCount = (window.groundLoot || []).filter(
    (entry) => entry?.item,
  ).length;
  let groundMaterialCount = (window.groundMaterials || []).filter(
    Boolean,
  ).length;
  let groundText =
    groundItemCount + groundMaterialCount > 0
      ? `${plural(groundItemCount, "uncollected ground item")} and ${plural(groundMaterialCount, "uncollected ground-material drop")} will be left behind.`
      : "No uncollected ground drops are present.";

  let modeName = mode === "rift" ? "Rift Trial" : "Onslaught";
  let modeSpecific =
    mode === "rift"
      ? "The Rift Guardian remains undefeated and no Rift-clear reward is granted."
      : `Already-earned Onslaught rewards are banked once: ${formatAmount(window.playerStats?.crucibleAccumulatedShards || 0)} Astral Shards and ${formatAmount(window.playerStats?.crucibleAccumulatedCores || 0)} Catalyst Cores.`;

  let html = `
    <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-family:monospace; font-size:10px; line-height:1.5;">
      <div><strong style="color:#81ecec;">ITEMS:</strong> All ${equippedCount} equipped items remain equipped; all ${carriedCount} carried items are secured to permanent inventory.</div>
      <div><strong style="color:#ffd166;">RUN GOLD:</strong> All ${escapeHtml(formatAmount(runGold))} run Gold is secured.</div>
      <div><strong style="color:#c4b5fd;">MATERIALS:</strong> All pending materials are secured (${escapeHtml(formatMaterials(materials))}).</div>
      <div><strong style="color:#94a3b8;">GROUND:</strong> ${escapeHtml(groundText)}</div>
      <div><strong style="color:#a3fd83;">MODE RESULT:</strong> ${escapeHtml(modeSpecific)}</div>
      <div><strong style="color:#fca5a5;">RECOVERY CHEST:</strong> None is created because no equipped or carried asset is lost.</div>
    </div>
  `;

  let plainText = [
    `${modeName} voluntary retreat:`,
    `All ${equippedCount} equipped items remain equipped; all ${carriedCount} carried items are secured.`,
    `All ${formatAmount(runGold)} run Gold is secured.`,
    `All pending materials are secured (${formatMaterials(materials)}).`,
    groundText,
    modeSpecific,
    "No Recovery Chest is created.",
    "Continue?",
  ].join("\n");

  return {
    mode,
    title: `Retreat from ${modeName}`,
    confirmLabel: "RETREAT SAFELY",
    color: mode === "rift" ? "#00ffff" : "#a855f7",
    html,
    plainText,
  };
}

function challengeRetreatPreview() {
  let equipped = currentEquippedItems();
  let carried = (window.player?.bag || []).filter(
    (item) => item && !item.isStarterItem,
  );
  let soulBoundCount = [...equipped, ...carried].filter(
    (item) => !item.isStarterItem && item.locked,
  ).length;
  let atRiskCount = [...equipped, ...carried].filter(
    (item) => !item.isStarterItem && !item.locked,
  ).length;
  let starterCount = [...equipped, ...(window.player?.bag || [])].filter(
    (item) => item?.isStarterItem,
  ).length;
  let groundItemCount = (window.groundLoot || []).filter(
    (entry) => entry?.item,
  ).length;

  let salvageRatio = Math.max(
    0,
    getMasteryNodeRank(window.playerStats, "utility_emergency_salvage") * 0.05,
  );
  let totalGold = BigNum.from(window.playerStats?.runGold || 0);
  let securedGold = calculateEmergencySalvageGold(totalGold, salvageRatio);
  let lostGold = totalGold.sub(securedGold);
  let materials = pendingMaterialEntries(true);
  let securedMaterials = materials
    .map((entry) => ({
      name: entry.name,
      quantity: Math.floor(entry.quantity * salvageRatio),
    }))
    .filter((entry) => entry.quantity > 0);
  let lostMaterials = materials
    .map((entry) => ({
      name: entry.name,
      quantity:
        entry.quantity - Math.floor(entry.quantity * salvageRatio),
    }))
    .filter((entry) => entry.quantity > 0);
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

  let itemRule = `${plural(soulBoundCount, "Soul Bound item")} survive; ${plural(atRiskCount, "uninsured equipped/carried item")} are permanently lost.`;
  let groundRule =
    groundItemCount > 0
      ? `${plural(groundItemCount, "uncollected item drop")} will be collected into the loss calculation under the same Soul Bound/uninsured rule.`
      : "No uncollected item drops are present.";
  let starterRule =
    starterCount > 0
      ? `${plural(starterCount, "temporary starter item")} vanish; a basic weapon is reissued only if no weapon remains.`
      : "A basic weapon is reissued only if no weapon remains after losses.";
  let directMaterialRule = directlySecuredGroundMaterials.length
    ? ` Special/key drops secured directly: ${formatMaterials(directlySecuredGroundMaterials)}.`
    : "";

  let html = `
    <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-family:monospace; font-size:10px; line-height:1.5;">
      <div><strong style="color:#fca5a5;">ITEMS:</strong> ${escapeHtml(itemRule)} ${escapeHtml(groundRule)}</div>
      <div><strong style="color:#cbd5e1;">STARTER GEAR:</strong> ${escapeHtml(starterRule)}</div>
      <div><strong style="color:#ffd166;">RUN GOLD:</strong> ${escapeHtml(formatAmount(securedGold))} of ${escapeHtml(formatAmount(totalGold))} secured by Emergency Evac; ${escapeHtml(formatAmount(lostGold))} forfeited.</div>
      <div><strong style="color:#c4b5fd;">MATERIALS:</strong> Secured: ${escapeHtml(formatMaterials(securedMaterials))}. Forfeited: ${escapeHtml(formatMaterials(lostMaterials))}.${escapeHtml(directMaterialRule)}</div>
      <div><strong style="color:#ef4444;">CONTRACT:</strong> The Special Contract fails and its completion rewards are forfeited.</div>
      <div><strong style="color:#ef4444;">RECOVERY CHEST:</strong> None. Challenge losses are permanent.</div>
    </div>
  `;

  let plainText = [
    "Special Challenge voluntary retreat:",
    itemRule,
    groundRule,
    starterRule,
    `${formatAmount(securedGold)} of ${formatAmount(totalGold)} run Gold is secured; ${formatAmount(lostGold)} is forfeited.`,
    `Materials secured: ${formatMaterials(securedMaterials)}. Materials forfeited: ${formatMaterials(lostMaterials)}.${directMaterialRule}`,
    "The contract fails and its rewards are forfeited.",
    "No Recovery Chest is created; Challenge losses are permanent.",
    "Continue?",
  ].join("\n");

  return {
    mode: "challenge",
    title: "Abandon Special Contract",
    confirmLabel: "ABANDON CONTRACT",
    color: "#ef4444",
    html,
    plainText,
  };
}

export function getActiveModeRetreatPreview() {
  if (window.playerStats?.isRiftMode) return safeModeRetreatPreview("rift");
  if (window.playerStats?.isCrucibleMode) {
    return safeModeRetreatPreview("onslaught");
  }
  if (window.playerStats?.activeSpecialChallenge) {
    return challengeRetreatPreview();
  }
  return null;
}

export function requestActiveModeVoluntaryRetreat(onConfirm) {
  let preview = getActiveModeRetreatPreview();
  if (!preview) return false;

  if (typeof window.showCustomConfirm === "function") {
    window.showCustomConfirm(
      preview.title,
      preview.html,
      preview.confirmLabel,
      "CANCEL",
      preview.color,
      onConfirm,
    );
  } else if (confirm(preview.plainText)) {
    onConfirm();
  }
  return true;
}

function summaryElements() {
  return {
    modal: document.getElementById("summary-modal"),
    title: document.getElementById("summary-title"),
    subtitle: document.getElementById("summary-subtitle"),
    list: document.getElementById("summary-loot-list"),
    button: document.getElementById("summary-action-btn"),
    nemesis: document.getElementById("death-nemesis-card"),
  };
}

function materialOutcomeRows(materials, label, color) {
  if (!materials || materials.length === 0) {
    return `<div style="color:#64748b;">${escapeHtml(label)}: none</div>`;
  }
  return materials
    .map(
      (entry) => `
        <div style="background:#0c0d14; border:1px solid #1e293b; border-left:3px solid ${color}; padding:6px 9px; border-radius:4px; display:flex; justify-content:space-between; gap:12px;">
          <span style="color:#cbd5e1;">${escapeHtml(entry.name)}</span>
          <strong style="color:${color};">${escapeHtml(label)} ${escapeHtml(entry.quantity)}</strong>
        </div>`,
    )
    .join("");
}

function safeAssetSummary(outcome) {
  let assets = outcome.assets;
  return `
    <div style="background:rgba(16,185,129,0.06); border:1px dashed #10b981; border-radius:6px; padding:9px 11px; line-height:1.55; color:#a7f3d0;">
      <strong>[SAFE-MODE COMMITMENT]</strong><br>
      Equipped gear remained equipped. ${plural(assets.carriedItems.length, "carried item")} secured to permanent inventory.<br>
      ${escapeHtml(formatAmount(assets.securedGold))} run Gold secured. Pending materials secured: ${escapeHtml(formatMaterials(assets.securedMaterials))}.<br>
      ${plural(assets.forfeitedGroundItemCount, "uncollected ground item")} and ${plural(assets.forfeitedGroundMaterialCount, "uncollected ground-material drop")} left behind.<br>
      No Recovery Chest created; no equipped or carried asset was lost.
    </div>
  `;
}

export function renderSafeModeExitSummary(outcome) {
  let elements = summaryElements();
  if (!elements.modal || !elements.title || !elements.list) return false;
  if (elements.nemesis) elements.nemesis.style.display = "none";

  let result = outcome.isAbandon
    ? "retreat"
    : outcome.success
      ? "success"
      : "defeat";

  if (outcome.mode === "rift") {
    let guardian = escapeHtml(outcome.guardianName);
    if (result === "success") {
      elements.title.innerText = "RIFT TRIAL CLEARED";
      elements.title.style.color = "#2ecc71";
      if (elements.subtitle) {
        elements.subtitle.innerText = `Victory | ${outcome.guardianName} defeated | Rift Level ${outcome.level}`;
      }
    } else if (result === "retreat") {
      elements.title.innerText = "RIFT TRIAL RETREAT";
      elements.title.style.color = "#f59e0b";
      if (elements.subtitle) {
        elements.subtitle.innerText = `Voluntary retreat | ${outcome.guardianName} remains undefeated | Rift Level ${outcome.level}`;
      }
    } else {
      elements.title.innerText = "RIFT TRIAL FAILED";
      elements.title.style.color = "#e74c3c";
      if (elements.subtitle) {
        elements.subtitle.innerText = `Defeat | ${outcome.guardianName} defeated you | Rift Level ${outcome.level}`;
      }
    }

    let rewardHtml =
      result === "success"
        ? `
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div><strong style="color:#a3fd83;">Mastery XP:</strong> +${outcome.rewards.masteryXp.toLocaleString()}</div>
            <div><strong style="color:#00ffff;">Astral Shards:</strong> +${outcome.rewards.shards.toLocaleString()}</div>
            <div><strong style="color:#a855f7;">Astral Dust:</strong> +${outcome.rewards.dust.toLocaleString()}</div>
            <div><strong style="color:#2ecc71;">Catalyst Cores:</strong> +${outcome.rewards.catalystCores}</div>
            <div><strong style="color:#df9ffb;">Astral Essence:</strong> +${outcome.rewards.astralEssence}</div>
          </div>`
        : `<div style="color:#f87171;"><strong>[NO RIFT-CLEAR REWARD]</strong> ${result === "retreat" ? "The trial was left voluntarily." : `${guardian} was not defeated.`}</div>`;

    elements.list.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-family:monospace; font-size:10px;">${rewardHtml}${safeAssetSummary(outcome)}</div>
    `;
    if (elements.button) elements.button.innerText = "RETURN TO HUB ALTAR";
  } else {
    let resultLabel =
      result === "success"
        ? "ONSLAUGHT COMPLETE"
        : result === "retreat"
          ? "ONSLAUGHT RETREAT"
          : "ONSLAUGHT DEFEAT";
    elements.title.innerText = resultLabel;
    elements.title.style.color =
      result === "success" ? "#2ecc71" : result === "retreat" ? "#f59e0b" : "#e74c3c";
    if (elements.subtitle) {
      let lead =
        result === "success"
          ? "Successful conclusion"
          : result === "retreat"
            ? "Voluntary retreat"
            : "Defeated in the arena";
      elements.subtitle.innerText = `${lead} | ${outcome.wavesCleared} waves cleared | Personal Best: Wave ${outcome.personalBest}`;
    }
    elements.list.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px; text-align:left; font-family:monospace; font-size:10px;">
        <div><strong style="color:#df9ffb;">Waves cleared:</strong> ${outcome.wavesCleared}</div>
        <div><strong style="color:#00ffff;">Already-earned Astral Shards banked once:</strong> +${outcome.rewards.shards}</div>
        <div><strong style="color:#2ecc71;">Already-earned Catalyst Cores banked once:</strong> +${outcome.rewards.catalystCores}</div>
        ${safeAssetSummary(outcome)}
      </div>
    `;
    if (elements.button) {
      elements.button.innerText = "RETURN TO ADVENTURER'S HUB";
    }
  }

  elements.modal.style.display = "flex";
  return true;
}

function itemRows(items, prefix, status, color) {
  return (items || [])
    .map(
      (item) => `
        <div style="background:#0c0d14; border:1px solid #1e293b; border-left:3px solid ${color}; padding:6px 9px; border-radius:4px; display:flex; justify-content:space-between; gap:12px;">
          <span style="color:${color};">${escapeHtml(prefix)} ${escapeHtml(item.name)}</span>
          <strong style="color:${color};">${escapeHtml(status)}</strong>
        </div>`,
    )
    .join("");
}

export function renderChallengeExitSummary(outcome) {
  let elements = summaryElements();
  if (!elements.modal || !elements.title || !elements.list) return false;
  if (elements.nemesis && outcome.result !== "defeat") {
    elements.nemesis.style.display = "none";
  }

  let result = outcome.result;
  if (result === "success") {
    elements.title.innerText = "SPECIAL CONTRACT COMPLETE";
    elements.title.style.color = "#2ecc71";
    if (elements.subtitle) {
      elements.subtitle.innerText = `Victory | ${outcome.challengeName} completed | All carried assets secured`;
    }
    elements.list.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:7px; text-align:left; font-family:monospace; font-size:10px;">
        <div><strong style="color:#2ecc71;">Carried items secured:</strong> ${outcome.assets.extractedItems.length}</div>
        <div><strong style="color:#ffd166;">Run Gold secured:</strong> ${escapeHtml(formatAmount(outcome.assets.securedGold))}</div>
        <div><strong style="color:#c4b5fd;">Pending materials secured:</strong> ${escapeHtml(formatMaterials(outcome.assets.securedMaterials))}</div>
        <div><strong style="color:#00ffff;">Contract rewards:</strong> ${escapeHtml(formatAmount(outcome.rewards.gold))} Gold, ${escapeHtml(formatAmount(outcome.rewards.xp))} XP, ${outcome.rewards.shards} Astral Shards, ${outcome.rewards.cores} Catalyst Cores</div>
        <div style="color:#94a3b8;">No Recovery Chest created; nothing from the successful contract exit was lost.</div>
        ${itemRows(outcome.assets.extractedItems, "[EXTRACTED]", "SECURED", "#2ecc71")}
        ${materialOutcomeRows(outcome.assets.securedMaterials, "SECURED", "#c4b5fd")}
      </div>
    `;
  } else {
    let retreat = result === "retreat";
    elements.title.innerText = retreat
      ? "SPECIAL CONTRACT ABANDONED"
      : "SPECIAL CONTRACT FAILED";
    elements.title.style.color = retreat ? "#f59e0b" : "#e74c3c";
    if (elements.subtitle) {
      elements.subtitle.innerText = `${retreat ? "Voluntary retreat" : "Defeat"} | ${outcome.challengeName} failed | Permanent losses; no Recovery Chest`;
    }
    elements.list.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:7px; text-align:left; font-family:monospace; font-size:10px;">
        ${itemRows(outcome.assets.savedSoulBoundItems, "[SOUL BOUND]", "SAVED", "#2ecc71")}
        ${itemRows(outcome.assets.provisionedItems, "[PROVISIONED]", "REISSUED", "#81ecec")}
        ${itemRows(outcome.assets.lostItems, "[UNINSURED]", "LOST", "#ef4444")}
        <div><strong style="color:#ffd166;">Run Gold:</strong> ${escapeHtml(formatAmount(outcome.assets.securedGold))} secured by Emergency Evac; ${escapeHtml(formatAmount(outcome.assets.lostGold))} permanently lost.</div>
        <div><strong style="color:#c4b5fd;">Materials secured:</strong> ${escapeHtml(formatMaterials(outcome.assets.securedMaterials))}</div>
        <div><strong style="color:#f87171;">Materials permanently lost:</strong> ${escapeHtml(formatMaterials(outcome.assets.lostMaterials))}</div>
        <div style="color:#ef4444;"><strong>[NO RECOVERY]</strong> No Recovery Chest was created. Contract rewards were forfeited.</div>
      </div>
    `;
  }

  if (elements.button) elements.button.innerText = "RETURN TO ADVENTURER'S HUB";
  elements.modal.style.display = "flex";
  return true;
}
