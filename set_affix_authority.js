/* ========================================================================== 
   G.6B4: Canonical set thresholds, set capstone status, potion duration, and
   equipment-affix domain communication.
   ========================================================================== */

export const SET_ELIGIBLE_SLOTS = Object.freeze([
  "weapon",
  "subweapon",
  "helmet",
  "chest",
  "leggings",
  "overall",
  "boots",
]);

export const SET_CAPSTONE_CONTRACTS = Object.freeze({
  Biohazard: Object.freeze({
    status: "unresolved-design",
    threshold: 3,
    flag: "hasCorrosiveSet",
    reason:
      "Inactive — poison rank/damage and life-steal rate/cap are not authored.",
  }),
  Warlord: Object.freeze({
    status: "unresolved-design",
    threshold: 3,
    flag: "hasShatterSet",
    reason: "Inactive — the secondary-hit damage coefficient is not authored.",
  }),
  VoidTouched: Object.freeze({
    status: "functional",
    threshold: 3,
    flag: "hasSingularitySet",
    reason: "Functional — Rare spawning triggers the canonical 5-second Frenzy.",
  }),
});

export const POTION_BASE_DURATION_FRAMES = 18000;

export const POTION_TIMER_TYPES = Object.freeze([
  Object.freeze({ runKey: "atkPotionRuns", timerKey: "atkPotionTimer", name: "Attack Elixir" }),
  Object.freeze({ runKey: "hpPotionRuns", timerKey: "hpPotionTimer", name: "Vitality Elixir" }),
  Object.freeze({ runKey: "defPotionRuns", timerKey: "defPotionTimer", name: "Armored Elixir" }),
  Object.freeze({ runKey: "hastePotionRuns", timerKey: "hastePotionTimer", name: "Haste Elixir" }),
  Object.freeze({ runKey: "xpPotionRuns", timerKey: "xpPotionTimer", name: "Double XP Elixir" }),
  Object.freeze({ runKey: "dropPotionRuns", timerKey: "dropPotionTimer", name: "Double Drop Elixir" }),
  Object.freeze({ runKey: "qlyPotionRuns", timerKey: "qlyPotionTimer", name: "Drop Quality Elixir" }),
]);

const AFFIX_DOMAIN_ROWS = [
  ["atk", "Attack", ["ring"], "active/global offense", "functional"],
  ["maxHp", "Max HP", ["chest", "overall", "leggings", "ring"], "global survival", "functional"],
  ["def", "Defense", ["chest", "overall", "leggings", "ring"], "global survival", "functional"],
  ["str", "STR", ["chest", "overall", "leggings", "ring", "artifact"], "global attribute", "functional"],
  ["dex", "DEX", ["chest", "overall", "leggings", "ring", "artifact"], "global attribute", "functional"],
  ["int", "INT", ["chest", "overall", "leggings", "ring", "artifact"], "global attribute", "functional"],
  ["atkPct", "Attack Power", ["ring", "authored-passive"], "global derived stat", "functional"],
  ["maxHpPct", "Max HP", ["ring", "authored-passive"], "global derived stat", "functional"],
  ["defPct", "Defense", ["ring", "authored-passive"], "global derived stat", "functional"],
  ["moveSpeedPct", "Move Speed", ["authored-passive"], "global movement", "functional"],
  ["strPct", "STR", ["ring", "authored-passive"], "global attribute", "functional"],
  ["dexPct", "DEX", ["ring", "authored-passive"], "global attribute", "functional"],
  ["intPct", "INT", ["ring", "authored-passive"], "global attribute", "functional"],
  ["critChance", "Crit Chance", ["weapon", "helmet", "ring", "dagger", "tome"], "combat", "functional"],
  ["critDamage", "Crit Multiplier", ["weapon", "tome"], "combat", "functional"],
  ["block", "Block Rate", ["shield"], "incoming defense", "functional"],
  ["parry", "Parry Rate", ["dagger"], "incoming defense", "functional"],
  ["activeAttackSpeed", "Active Attack Speed", ["weapon", "helmet", "boots", "tome"], "active combat only", "functional"],
  ["idleAttackSpeed", "Idle Attack Speed (Idle only)", ["weapon", "helmet", "boots", "tome"], "Idle-only", "intentionally-idle-only"],
  ["moveSpeed", "Move Speed", ["boots", "ring", "shield", "dagger"], "global movement", "functional"],
  ["bonusAreaRadius", "Global AoE Radius (supported effects only)", ["helmet", "ring", "shield", "dagger", "tome"], "accepted G.6B3 global AoE consumers", "functional"],
  ["dropRate", "Eligible Monster Drop Rate", ["artifact"], "economy only", "functional"],
  ["quality", "Unlocked-tier Drop Quality", ["artifact"], "economy only", "functional"],
  ["goldMulti", "Gold Multiplier", ["artifact"], "economy only", "functional"],
  ["rareSpawn", "Rare Spawn Rate", ["artifact"], "spawn economy only", "functional"],
  ["fairySpawn", "Fairy Spawn Rate", ["artifact"], "spawn economy only", "functional"],
];

export const EQUIPMENT_AFFIX_DOMAIN_TRUTH = Object.freeze(
  AFFIX_DOMAIN_ROWS.map(([field, label, legalPools, domain, status]) =>
    Object.freeze({ field, label, legalPools: Object.freeze(legalPools), domain, status }),
  ),
);

const AFFIX_PRESENTATION_BY_FIELD = Object.freeze(
  Object.fromEntries(EQUIPMENT_AFFIX_DOMAIN_TRUTH.map((row) => [row.field, row])),
);

function createSetContext() {
  return {
    atk: 0,
    maxHp: 0,
    moveSpeed: 0,
    moveSpeedPctBonus: 0,
    idleSpeedPct: 0,
    activeSpeedPct: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    atkPctBonus: 0,
    maxHpPctBonus: 0,
    defPctBonus: 0,
    flatDefBonus: 0,
    str: 0,
    dex: 0,
    int: 0,
    strPctBonus: 0,
    dexPctBonus: 0,
    intPctBonus: 0,
    potionDurationPct: 0,
    gold: 0,
    drop: 0,
    qly: 0,
    rareSpawn: 0,
    hasCorrosiveSet: false,
    hasShatterSet: false,
    hasSingularitySet: false,
  };
}

export function countEquippedSetPieces({
  equippedSlots = globalThis.window?.equippedSlots,
  getItemSetName = globalThis.window?.getItemSetName,
} = {}) {
  const counts = {};
  if (!equippedSlots || typeof getItemSetName !== "function") return counts;
  for (const slot of SET_ELIGIBLE_SLOTS) {
    const item = equippedSlots[slot];
    if (!item) continue;
    const setName = getItemSetName(item);
    if (!setName) continue;
    counts[setName] = (counts[setName] || 0) + (slot === "overall" ? 2 : 1);
  }
  return counts;
}

export function resolveCanonicalSetState({
  setDefinitions = globalThis.window?.SET_DEFINITIONS,
  equippedSlots = globalThis.window?.equippedSlots,
  getItemSetName = globalThis.window?.getItemSetName,
} = {}) {
  const definitions = setDefinitions || {};
  const counts = countEquippedSetPieces({ equippedSlots, getItemSetName });
  const stats = createSetContext();
  const thresholds = {};

  for (const [setKey, definition] of Object.entries(definitions)) {
    const count = Number(counts[setKey] || 0);
    const appliedCounts = new Set();
    thresholds[setKey] = [];
    (definition?.bonuses || []).forEach((bonus, thresholdIndex) => {
      const threshold = Number(bonus?.count || 0);
      const active = count >= threshold;
      const duplicate = appliedCounts.has(threshold);
      if (active && !duplicate && typeof bonus?.apply === "function") {
        bonus.apply(stats);
        appliedCounts.add(threshold);
      }
      thresholds[setKey].push({
        threshold,
        thresholdIndex,
        active,
        applied: active && !duplicate,
      });
    });
  }

  const authoredCapstoneFlags = {
    hasCorrosiveSet: Boolean(stats.hasCorrosiveSet),
    hasShatterSet: Boolean(stats.hasShatterSet),
    hasSingularitySet: Boolean(stats.hasSingularitySet),
  };
  for (const contract of Object.values(SET_CAPSTONE_CONTRACTS)) {
    if (contract.status === "unresolved-design") stats[contract.flag] = false;
  }

  return {
    counts,
    thresholds,
    stats,
    authoredCapstoneFlags,
    capstones: SET_CAPSTONE_CONTRACTS,
  };
}

export function getSetThresholdPresentation(setKey, bonus, thresholdIndex = 0) {
  const threshold = Number(bonus?.count || 0);
  const prefix = thresholdIndex > 0 ? "Additional: " : "";
  const capstone = SET_CAPSTONE_CONTRACTS[setKey];
  const isCapstone = capstone && threshold === capstone.threshold;
  return {
    description: `${prefix}${String(bonus?.desc || "")}`,
    status: isCapstone ? capstone.status : "functional",
    note: isCapstone ? capstone.reason : "",
  };
}

export function getAffixDomainPresentation(field) {
  return AFFIX_PRESENTATION_BY_FIELD[field] || null;
}

export function getCanonicalPotionDurationFrames(resolvedStats = {}) {
  const durationBonus = Math.max(0, Number(resolvedStats.potionDurationPct || 0));
  return Math.round(POTION_BASE_DURATION_FRAMES * (1 + durationBonus));
}

export function advanceCanonicalPotionTimers({
  playerStats,
  isDungeon,
  resolvedStats = {},
  onActivated = () => {},
  onExpired = () => {},
} = {}) {
  if (!playerStats || !isDungeon) return { activated: [], expired: [] };
  const activated = [];
  const expired = [];
  const durationFrames = getCanonicalPotionDurationFrames(resolvedStats);

  for (const potion of POTION_TIMER_TYPES) {
    if (
      Number(playerStats[potion.timerKey] || 0) <= 0 &&
      Number(playerStats[potion.runKey] || 0) > 0
    ) {
      playerStats[potion.runKey]--;
      playerStats[potion.timerKey] = durationFrames;
      activated.push(potion);
      onActivated(potion, durationFrames);
    }

    if (Number(playerStats[potion.timerKey] || 0) > 0) {
      playerStats[potion.timerKey]--;
      if (playerStats[potion.timerKey] === 0) {
        expired.push(potion);
        onExpired(potion);
      }
    }
  }
  return { activated, expired, durationFrames };
}

export function triggerVoidTouchedRareFrenzy({
  isRare,
  resolvedStats,
  playerStats,
  chronoExtensionFrames = 0,
} = {}) {
  if (!isRare || !resolvedStats?.hasSingularitySet || !playerStats) return false;
  const duration = 300 + Math.max(0, Math.round(Number(chronoExtensionFrames || 0)));
  playerStats.frenzyTimer = Math.max(Number(playerStats.frenzyTimer || 0), duration);
  return true;
}
