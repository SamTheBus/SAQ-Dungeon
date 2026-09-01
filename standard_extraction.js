function normalizeQuantity(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatGold(value, formatNumber) {
  if (typeof formatNumber === "function") return formatNumber(value || 0);
  if (value && typeof value.toFiniteNumber === "function") {
    return value.toFiniteNumber().toLocaleString();
  }
  return String(Number(value) || 0);
}

function describeMaterials(materials) {
  if (!materials.length) return "none";
  return materials
    .map((entry) => `${entry.quantity}x ${entry.name}`)
    .join(", ");
}

function aggregateMaterials(materialGroups) {
  let totals = new Map();
  for (const group of materialGroups) {
    for (const entry of group) {
      totals.set(entry.name, (totals.get(entry.name) || 0) + entry.quantity);
    }
  }
  return [...totals.entries()].map(([name, quantity]) => ({ name, quantity }));
}

export function isStandardSuccessfulExtractionMode(stats = window.playerStats) {
  return !!(
    stats &&
    !stats.activeSpecialChallenge &&
    !stats.isRiftMode &&
    !stats.isCrucibleMode
  );
}

export function getStandardExtractionPreview({
  player = window.player,
  playerStats = window.playerStats,
  groundLoot = window.groundLoot,
  groundMaterials = window.groundMaterials,
} = {}) {
  let extractedItems = (player?.bag || []).filter(
    (item) => item && !item.isStarterItem,
  );
  let securedCollectedMaterials = Object.entries(player?.pendingScraps || {})
    .map(([name, quantity]) => ({ name, quantity: normalizeQuantity(quantity) }))
    .filter((entry) => entry.quantity > 0);
  let forfeitedGroundItems = (groundLoot || [])
    .map((entry) => entry?.item)
    .filter(Boolean);
  let securedGroundMaterials = (groundMaterials || [])
    .map((entry) => ({
      name: entry?.name || "Unknown Material",
      quantity: normalizeQuantity(entry?.qty),
    }))
    .filter((entry) => entry.quantity > 0);
  let securedMaterials = aggregateMaterials([
    securedCollectedMaterials,
    securedGroundMaterials,
  ]);

  return {
    mode: "standard",
    result: "success",
    success: true,
    isAbandon: false,
    assets: {
      extractedItems,
      securedGold: playerStats?.runGold || 0,
      securedMaterials,
      securedCollectedMaterials,
      securedGroundMaterials,
      forfeitedGroundItems,
      recoveryChestCreated: false,
    },
  };
}

export function describeStandardExtractionOutcome(
  outcome,
  { formatNumber } = {},
) {
  let assets = outcome?.assets || {};
  let extractedItems = assets.extractedItems || [];
  let securedMaterials = assets.securedMaterials || [];
  let securedCollectedMaterials = assets.securedCollectedMaterials || [];
  let securedGroundMaterials = assets.securedGroundMaterials || [];
  let forfeitedGroundItems = assets.forfeitedGroundItems || [];

  return {
    securedItems: pluralize(extractedItems.length, "carried item"),
    securedGold: `${formatGold(assets.securedGold, formatNumber)} run Gold`,
    securedMaterials: describeMaterials(securedMaterials),
    securedCollectedMaterials: describeMaterials(securedCollectedMaterials),
    securedGroundMaterials: describeMaterials(securedGroundMaterials),
    forfeitedItems: pluralize(
      forfeitedGroundItems.length,
      "uncollected ground item",
    ),
  };
}

export function buildStandardExtractionConfirmation(
  outcome,
  { formatNumber } = {},
) {
  let description = describeStandardExtractionOutcome(outcome, {
    formatNumber,
  });
  return [
    `<strong>ITEMS:</strong> Secure ${description.securedItems}; forfeit ${description.forfeitedItems}.`,
    `<strong>RUN GOLD:</strong> Secure all ${description.securedGold}.`,
    `<strong>MATERIALS:</strong> Secure ${description.securedCollectedMaterials} already collected and ${description.securedGroundMaterials} still on the ground through the existing material counters.`,
    "<strong>RECOVERY CHEST:</strong> None is created by a successful extraction.",
  ].join("<br><br>");
}

export function buildStandardExtractionSummary(
  outcome,
  { formatNumber } = {},
) {
  let description = describeStandardExtractionOutcome(outcome, {
    formatNumber,
  });
  return `Secured ${description.securedItems}, all ${description.securedGold}, and these materials: ${description.securedMaterials}. Forfeited ${description.forfeitedItems}. No Recovery Chest created. (+25% Bonus XP)`;
}

export function getStandardExtractionPortalRule() {
  return "Extraction secures carried satchel items, collected run Gold, and materials. Uncollected ground items are forfeited; no Recovery Chest is created.";
}
