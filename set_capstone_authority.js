import {
  BIOHAZARD_POISON_HEALING_PROFILE,
  applyPlayerPoison,
} from "./combat_effect_authority.js?v=1.002";
import {
  isElementTargetInvulnerable,
  isEligiblePlayerElementTarget,
} from "./element_effect_authority.js?v=1.003";

export const BIOHAZARD_CAPSTONE_PROFILE = Object.freeze({
  profileId: "g6d_biohazard_v1",
  triggerChance: 0.2,
  damageBasis: "capturedResolvedAtk",
  poisonDamagePerStackMultiplier: 0.2,
  poisonHealingFraction: BIOHAZARD_POISON_HEALING_PROFILE.healingFraction,
  healingCapMaxHpPerSecond:
    BIOHAZARD_POISON_HEALING_PROFILE.capMaxHpPerSecond,
  healingCapWindowFrames: BIOHAZARD_POISON_HEALING_PROFILE.capWindowFrames,
  poolRule: "maxActiveViperOrBiohazardCoefficient",
});

export const WARLORD_CAPSTONE_PROFILE = Object.freeze({
  profileId: "g6d_warlord_v1",
  triggerChance: 0.25,
  damageBasis: "resolvedAtk",
  secondaryPacketMultiplier: 0.5,
  packetType: "sameTargetSecondaryPhysical",
});

const STAGGER_PHASES = new Set([
  "chrono_rewind",
  "taxation",
  "molten_shield",
]);

function finite(value, fallback = 0) {
  if (value && typeof value.toFiniteNumber === "function") {
    return value.toFiniteNumber(Number.MAX_VALUE / 16);
  }
  const resolved = Number(value);
  return Number.isFinite(resolved) ? resolved : fallback;
}

function damageValue(value) {
  return typeof BigNum !== "undefined" && BigNum.from
    ? BigNum.from(value || 0)
    : finite(value);
}

function multiply(value, multiplier) {
  return value && typeof value.mul === "function"
    ? value.mul(multiplier)
    : finite(value) * multiplier;
}

function isLiving(target) {
  if (!target || target.hp === undefined || target.hp === null) return false;
  return target.hp && typeof target.hp.gt === "function"
    ? target.hp.gt(0)
    : Number(target.hp) > 0;
}

function metrics() {
  const state = window.playerStats?.combatEffectMetrics;
  if (!state) return null;
  state.procCounts ||= {};
  state.secondaryDamage ||= 0;
  state.secondaryDamageByMechanic ||= {};
  return state;
}

function recordProc(name, count = 1) {
  const state = metrics();
  if (!state) return;
  state.procCounts[name] = (state.procCounts[name] || 0) + count;
}

function physicalDamageTakenMultiplier(target) {
  const explicit = [
    target?.physicalDamageTakenMultiplier,
    target?.defenseResistanceMultiplier,
    target?.defenseDamageTakenMultiplier,
    target?.damageTakenMultiplier,
  ].find((value) => Number.isFinite(Number(value)));
  if (explicit !== undefined) {
    return Math.max(0, Number(explicit));
  }
  const resistance = Number(
    target?.physicalResistance ??
      target?.resistances?.physical ??
      target?.resistance ??
      0,
  );
  return Number.isFinite(resistance)
    ? Math.max(0, 1 - Math.max(0, Math.min(1, resistance)))
    : 1;
}

function subtractClamped(target, field, damage) {
  const before = Math.max(0, finite(target?.[field]));
  const requested = Math.max(0, finite(damage));
  const actual = Math.min(before, requested);
  if (target?.[field] && typeof target[field].sub === "function") {
    target[field] = target[field].sub(damage);
    if (target[field].lte?.(0)) target[field] = damageValue(0);
  } else if (target) {
    target[field] = Math.max(0, before - requested);
  }
  return actual;
}

export function resolveBiohazardAttackAction({
  target,
  resolvedStats,
  frame = window.logicClock || 0,
  random = Math.random,
} = {}) {
  if (!resolvedStats?.hasCorrosiveSet) {
    return { qualified: false, rolled: false, proc: false, reason: "inactive-set" };
  }
  if (!isEligiblePlayerElementTarget(target)) {
    return { qualified: false, rolled: false, proc: false, reason: "ineligible-target" };
  }
  const roll = random();
  recordProc("biohazardRolls");
  if (roll >= BIOHAZARD_CAPSTONE_PROFILE.triggerChance) {
    return { qualified: true, rolled: true, roll, proc: false, reason: "roll-failed" };
  }
  const effect = applyPlayerPoison(target, resolvedStats, {
    frame,
    rank: 1,
    mechanic: "biohazard_corrosive_spores",
    poisonSourceKey: "biohazard",
    authoredCoefficient:
      BIOHAZARD_CAPSTONE_PROFILE.poisonDamagePerStackMultiplier,
    capturedAtk: resolvedStats.atk,
  });
  const proc = Boolean(effect);
  if (proc) recordProc("biohazardProcs");
  return {
    qualified: true,
    rolled: true,
    roll,
    proc,
    reason: proc ? "applied" : "application-rejected",
    effect,
  };
}

export function resolveWarlordCriticalAction({
  target,
  resolvedStats,
  isCritical,
  random = Math.random,
} = {}) {
  if (!resolvedStats?.hasShatterSet) {
    return { qualified: false, rolled: false, proc: false, reason: "inactive-set" };
  }
  if (!isCritical) {
    return { qualified: false, rolled: false, proc: false, reason: "non-critical-action" };
  }
  if (!target) {
    return { qualified: false, rolled: false, proc: false, reason: "missing-target" };
  }
  const roll = random();
  recordProc("warlordRolls");
  if (roll >= WARLORD_CAPSTONE_PROFILE.triggerChance) {
    return { qualified: true, rolled: true, roll, proc: false, reason: "roll-failed" };
  }

  const rawDamage = multiply(
    damageValue(resolvedStats.atk),
    WARLORD_CAPSTONE_PROFILE.secondaryPacketMultiplier,
  );
  if (!isLiving(target) || isElementTargetInvulnerable(target)) {
    recordProc("warlordProcs");
    return {
      qualified: true,
      rolled: true,
      roll,
      proc: true,
      applied: false,
      reason: !isLiving(target) ? "dead-target" : "invulnerable-target",
      rawDamage,
      damage: damageValue(0),
      actualDamage: 0,
      canCrit: false,
      canRecurse: false,
    };
  }

  let mitigationMultiplier = physicalDamageTakenMultiplier(target);
  if (target.actionState === "bark_shield") mitigationMultiplier *= 0.1;
  const damage = multiply(rawDamage, mitigationMultiplier);
  const field =
    STAGGER_PHASES.has(target.actionState) && target.staggerShield != null
      ? "staggerShield"
      : "hp";
  const actualDamage = subtractClamped(target, field, damage);
  target.hasTakenDamage = actualDamage > 0 || target.hasTakenDamage;
  target.flashTimer = actualDamage > 0 ? 6 : target.flashTimer;

  recordProc("warlordProcs");
  const state = metrics();
  if (state) {
    state.secondaryDamage += actualDamage;
    state.secondaryDamageByMechanic.warlord =
      (state.secondaryDamageByMechanic.warlord || 0) + actualDamage;
  }
  return {
    qualified: true,
    rolled: true,
    roll,
    proc: true,
    applied: actualDamage > 0,
    reason: actualDamage > 0 ? "applied" : "fully-mitigated",
    rawDamage,
    damage,
    actualDamage,
    mitigationMultiplier,
    affectedPool: field,
    sameTarget: true,
    guardBypassed: true,
    canCrit: false,
    canRecurse: false,
    canTriggerSecondarySystems: false,
  };
}

export function resolveCanonicalSetCapstoneAttackAction(context = {}) {
  return {
    biohazard: resolveBiohazardAttackAction(context),
    warlord: resolveWarlordCriticalAction(context),
  };
}

export function presentSetCapstoneAttackAction(result, target) {
  if (result?.biohazard?.proc && typeof window.spawnFloatingText === "function") {
    window.spawnFloatingText(
      target.x + (target.w || 24) / 2,
      target.y - 16,
      "CORROSIVE SPORES",
      "#2ecc71",
    );
  }
  if (result?.warlord?.applied && window.RenderEngine?.spawnDamageEffect) {
    window.RenderEngine.spawnDamageEffect(
      target.x + (target.w || 24) / 2,
      target.y + (target.h || 24) / 2 - 8,
      result.warlord.damage,
      "static",
      false,
      target,
    );
  }
  return Boolean(result?.biohazard?.proc || result?.warlord?.applied);
}
