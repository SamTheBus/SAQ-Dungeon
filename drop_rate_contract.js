export const MONSTER_DROP_DOMAINS = Object.freeze({
  EQUIPMENT: "equipment",
  MATERIAL: "material",
  SIGIL: "sigil",
  CARD: "card",
});

const ELIGIBLE_DOMAINS = new Set(Object.values(MONSTER_DROP_DOMAINS));

export const DROP_RATE_PLAYER_RULE =
  "Drop Rate multiplies eligible random monster equipment, Monster Soul/material, Cavern Sigil, and Monster Card chances. Each chance caps at 100%. Guaranteed, chest, cache, milestone, and direct rewards are unchanged.";

function normalizeFiniteNonNegative(value, fallback) {
  let numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
}

export function getResolvedDropRateMultiplier(source) {
  let candidate =
    typeof source === "number" ? source : source?.drop;
  return normalizeFiniteNonNegative(candidate, 1);
}

export function calculateEligibleMonsterDropChance(
  baseChance,
  dropRateSource,
  domain,
) {
  if (!ELIGIBLE_DOMAINS.has(domain)) {
    throw new RangeError(`Ineligible monster Drop Rate domain: ${domain}`);
  }

  let normalizedBaseChance = normalizeFiniteNonNegative(baseChance, 0);
  let multiplier = getResolvedDropRateMultiplier(dropRateSource);
  return Math.min(1, normalizedBaseChance * multiplier);
}

export function rollEligibleMonsterDrop(
  baseChance,
  dropRateSource,
  domain,
  random = Math.random,
) {
  return (
    normalizeFiniteNonNegative(random(), 1) <
    calculateEligibleMonsterDropChance(baseChance, dropRateSource, domain)
  );
}
