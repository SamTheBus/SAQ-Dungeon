export const OPENING_RANGED_GRACE_TICKS = 180;
export const FLOOR_ONE_MAX_RANGED_MOBS = 2;
export const FLOOR_ONE_MAX_RANGED_PER_ROOM = 1;
export const FLOOR_ONE_MAX_STANDARD_MOBS = 12;

const FLOOR_ONE_MELEE_TYPES = ["slime", "sprout"];

export function isStandardFloorOne({
  depth,
  isChallenge = false,
  isRift = false,
  isCrucible = false,
} = {}) {
  return (
    Number(depth) === 1 &&
    !isChallenge &&
    !isRift &&
    !isCrucible
  );
}

export function buildStandardMobComposition({
  depth,
  spawns = [],
  isChallenge = false,
  isRift = false,
  isCrucible = false,
  rollMobInfo,
  random = Math.random,
} = {}) {
  if (typeof rollMobInfo !== "function") return [];

  const openingFloor = isStandardFloorOne({
    depth,
    isChallenge,
    isRift,
    isCrucible,
  });
  let rangedCount = 0;
  const rangedRooms = new Set();

  return spawns.map((spawn) => {
    const rolled = rollMobInfo(spawn) || { tier: 0, type: "slime" };
    if (!openingFloor || rolled.type !== "thorn_wyrm") return rolled;

    const roomKey = spawn?.room ?? "unknown";
    const exceedsFloorCap = rangedCount >= FLOOR_ONE_MAX_RANGED_MOBS;
    const exceedsRoomCap =
      (rangedRooms.has(roomKey) ? 1 : 0) >= FLOOR_ONE_MAX_RANGED_PER_ROOM;

    if (exceedsFloorCap || exceedsRoomCap) {
      const fallbackIndex = Math.min(
        FLOOR_ONE_MELEE_TYPES.length - 1,
        Math.floor(Math.max(0, Number(random()) || 0) * FLOOR_ONE_MELEE_TYPES.length),
      );
      return {
        ...rolled,
        type: FLOOR_ONE_MELEE_TYPES[fallbackIndex],
      };
    }

    rangedCount++;
    rangedRooms.add(roomKey);
    return rolled;
  });
}

export function selectStandardMobSpawns({
  depth,
  spawns = [],
  isChallenge = false,
  isRift = false,
  isCrucible = false,
} = {}) {
  if (
    !isStandardFloorOne({ depth, isChallenge, isRift, isCrucible }) ||
    spawns.length <= FLOOR_ONE_MAX_STANDARD_MOBS
  ) {
    return [...spawns];
  }

  const roomBuckets = new Map();
  spawns.forEach((spawn, index) => {
    const roomKey = spawn?.room ?? `unknown-${index}`;
    if (!roomBuckets.has(roomKey)) roomBuckets.set(roomKey, []);
    roomBuckets.get(roomKey).push(spawn);
  });

  const selected = [];
  const buckets = [...roomBuckets.values()];
  while (selected.length < FLOOR_ONE_MAX_STANDARD_MOBS) {
    let added = false;
    for (const bucket of buckets) {
      if (bucket.length === 0) continue;
      selected.push(bucket.shift());
      added = true;
      if (selected.length >= FLOOR_ONE_MAX_STANDARD_MOBS) break;
    }
    if (!added) break;
  }
  return selected;
}

export function getInitialStandardRangedCooldown({
  depth,
  isChallenge = false,
  isRift = false,
  isCrucible = false,
  randomInt,
} = {}) {
  const roll = typeof randomInt === "function" ? randomInt : (() => 60);
  if (
    isStandardFloorOne({ depth, isChallenge, isRift, isCrucible })
  ) {
    return OPENING_RANGED_GRACE_TICKS + roll(0, 120);
  }
  return roll(30, 90);
}

export function canStandardMobApplyOpeningPressure({
  depth,
  floorActiveTicks = 0,
  isChallenge = false,
  isRift = false,
  isCrucible = false,
} = {}) {
  if (!isStandardFloorOne({ depth, isChallenge, isRift, isCrucible })) {
    return true;
  }
  return Number(floorActiveTicks || 0) >= OPENING_RANGED_GRACE_TICKS;
}

export function canStandardMobFireRanged(options = {}) {
  return canStandardMobApplyOpeningPressure(options);
}

export function normalizeProvisionedStarterItem(
  item,
  {
    name,
    noun,
    recalculate,
  } = {},
) {
  if (!item || typeof item !== "object") return item;

  if (noun) item.noun = noun;
  item.setName = null;
  delete item.locked;
  item.isStarterItem = true;

  if (typeof recalculate === "function") recalculate(item);
  if (name) item.name = name;
  return item;
}

export function getDeploymentItemRiskPresentation(item) {
  if (item?.isStarterItem) {
    return {
      statusClass: "is-provisioned",
      label: "[ TEMPORARY ]",
      detail: "Provisioned for this run; reissued only if no weapon remains",
      canToggleInsurance: false,
    };
  }

  const isLocked = Boolean(item?.locked);
  return {
    statusClass: isLocked ? "is-insured" : "is-uninsured",
    label: isLocked ? "[ SOUL INSURED ]" : "[ AT RISK ]",
    detail: null,
    canToggleInsurance: true,
  };
}

export function hasUninsuredPermanentEquipment(equippedSlots = {}) {
  return Object.values(equippedSlots).some(
    (item) => item && !item.isStarterItem && !item.locked,
  );
}
