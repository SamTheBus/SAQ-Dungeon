export const RUN_SATCHEL_BASE_SLOTS = 20;
export const DIMENSIONAL_POUCH_BASE_SLOTS = 50;
export const SATCHEL_EXPANSION_SLOTS_PER_RANK = 5;
export const SATCHEL_EXPANSION_MAX_RANK = 3;

function clampInteger(value, min, max) {
  let normalized = Math.floor(Number(value) || 0);
  return Math.max(min, Math.min(max, normalized));
}

function getWindowValue(name, fallback) {
  return typeof window !== "undefined" && window[name] !== undefined
    ? window[name]
    : fallback;
}

export function getSatchelExpansionRank(playerStats = getWindowValue("playerStats", null)) {
  let skillTree = playerStats && playerStats.skillTree;
  return clampInteger(
    skillTree && skillTree.utility_bag,
    0,
    SATCHEL_EXPANSION_MAX_RANK,
  );
}

export function hasDimensionalPouch(options = {}) {
  let playerStats =
    options.playerStats === undefined
      ? getWindowValue("playerStats", null)
      : options.playerStats;
  let activeRelics =
    options.activeRelics === undefined
      ? (playerStats && playerStats.activeRelics) || []
      : options.activeRelics || [];
  if (activeRelics.includes("bag_space")) return true;

  let equippedSlots =
    options.equippedSlots === undefined
      ? getWindowValue("equippedSlots", null)
      : options.equippedSlots;
  if (!equippedSlots) return false;

  return ["art1", "art2", "art3"].some(
    (slotKey) => equippedSlots[slotKey]?.trait === "bag_space",
  );
}

export function getMaxBagSlots(options = {}) {
  let playerStats =
    options.playerStats === undefined
      ? getWindowValue("playerStats", null)
      : options.playerStats;
  let baseSlots = hasDimensionalPouch({
    playerStats,
    activeRelics: options.activeRelics,
    equippedSlots: options.equippedSlots,
  })
    ? DIMENSIONAL_POUCH_BASE_SLOTS
    : RUN_SATCHEL_BASE_SLOTS;
  return (
    baseSlots +
    getSatchelExpansionRank(playerStats) * SATCHEL_EXPANSION_SLOTS_PER_RANK
  );
}

export function getRunSatchelState(requiredSlots = 0, options = {}) {
  let player =
    options.player === undefined ? getWindowValue("player", null) : options.player;
  let bag = options.bag === undefined ? (player && player.bag) || [] : options.bag;
  let count = Array.isArray(bag) ? bag.length : 0;
  let capacity =
    options.capacity === undefined ? getMaxBagSlots(options) : options.capacity;
  let required = Math.max(0, Math.floor(Number(requiredSlots) || 0));
  let available = Math.max(0, capacity - count);

  return {
    count,
    capacity,
    required,
    available,
    overCapacityBy: Math.max(0, count - capacity),
    canAdd: count + required <= capacity,
  };
}

export function markRunSatchelFullEncounter() {
  let playerStats = getWindowValue("playerStats", null);
  if (!playerStats || playerStats.hasTriggeredFullBag) return;
  playerStats.hasTriggeredFullBag = true;
  let checkAchievements = getWindowValue("checkAchievements", null);
  if (typeof checkAchievements === "function") checkAchievements();
}

export function notifyRunSatchelBlocked(options = {}) {
  let count = Math.max(0, Math.floor(Number(options.count) || 0));
  let capacity = Math.max(0, Math.floor(Number(options.capacity) || 0));
  let overflow = Math.max(1, Math.floor(Number(options.overflow) || 0));
  if (options.markFullEncounter !== false) markRunSatchelFullEncounter();

  let message =
    options.message ||
    (overflow === 1
      ? `Carried Satchel Full (${count}/${capacity} Items). Free 1 slot.`
      : `Carried Satchel needs ${overflow} free slots (${count}/${capacity} Items).`);
  let pushHeaderToast = getWindowValue("pushHeaderToast", null);
  if (options.notify !== false && typeof pushHeaderToast === "function") {
    pushHeaderToast(message, "#e74c3c");
  }
  return false;
}

export function canAddToRunSatchel(requiredSlots = 1, options = {}) {
  let state = getRunSatchelState(requiredSlots, options);
  if (state.canAdd) return true;
  return notifyRunSatchelBlocked({
    ...options,
    count: state.count,
    capacity: state.capacity,
    overflow: state.count + state.required - state.capacity,
  });
}

export function evaluateRunSatchelTransition(nextCount, options = {}) {
  let current = getRunSatchelState(0, options);
  let normalizedNextCount = Math.max(0, Math.floor(Number(nextCount) || 0));
  let nextCapacity =
    options.nextCapacity === undefined
      ? getMaxBagSlots(options.nextCapacityOptions || options)
      : Math.max(0, Math.floor(Number(options.nextCapacity) || 0));
  let fits = normalizedNextCount <= nextCapacity;
  let safelyReducesLegacyOverage =
    current.overCapacityBy > 0 &&
    normalizedNextCount < current.count &&
    nextCapacity >= current.capacity;

  return {
    allowed: fits || safelyReducesLegacyOverage,
    currentCount: current.count,
    currentCapacity: current.capacity,
    nextCount: normalizedNextCount,
    nextCapacity,
    overflow: Math.max(0, normalizedNextCount - nextCapacity),
    safelyReducesLegacyOverage,
  };
}

export function canApplyRunSatchelTransition(nextCount, options = {}) {
  let transition = evaluateRunSatchelTransition(nextCount, options);
  if (transition.allowed) return true;
  return notifyRunSatchelBlocked({
    ...options,
    count: transition.currentCount,
    capacity: transition.nextCapacity,
    overflow: transition.overflow,
  });
}

export function addToRunSatchel(item, options = {}) {
  if (!item) return false;
  let player =
    options.player === undefined ? getWindowValue("player", null) : options.player;
  if (!player) return false;
  if (!Array.isArray(player.bag)) player.bag = [];
  if (!canAddToRunSatchel(1, { ...options, player, bag: player.bag })) {
    return false;
  }
  player.bag.push(item);
  return true;
}
