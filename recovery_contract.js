function recoveryGold(record) {
  return BigNum.from(record?.gold || 0);
}

export function getRecoveryItemCount(record) {
  return Array.isArray(record?.items) ? record.items.filter(Boolean).length : 0;
}

export function hasRecoveryAssets(record) {
  return getRecoveryItemCount(record) > 0 || recoveryGold(record).gt(0);
}

export function getRecoveryRecordForFloor(floor) {
  let record = window.playerStats?.recoveryLoot;
  if (!record || record.floor !== floor || !hasRecoveryAssets(record)) {
    return null;
  }
  return record;
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

export function describeRecoveryAssets(record) {
  let parts = [];
  let itemCount = getRecoveryItemCount(record);
  let gold = recoveryGold(record);
  if (itemCount > 0) {
    parts.push(`${itemCount} lost item${itemCount === 1 ? "" : "s"}`);
  }
  if (gold.gt(0)) parts.push(`${formatAmount(gold)} lost Gold`);
  return parts.length > 0 ? parts.join(" and ") : "no recoverable assets";
}

export function commitRecoveryChestOverwrite(floor) {
  let record = getRecoveryRecordForFloor(floor);
  if (!record) return false;

  let outcome = {
    floor: record.floor,
    items: Array.isArray(record.items) ? record.items.filter(Boolean) : [],
    gold: recoveryGold(record),
  };

  window.playerStats.recoveryLoot = null;
  if (typeof window.saveGame === "function") window.saveGame();
  return outcome;
}
