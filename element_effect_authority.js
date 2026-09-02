import {
  applyArcaneShieldRecharge,
  applyPeriodicEffect,
  clearPeriodicEffect,
  getPeriodicEffect,
} from "./combat_effect_authority.js?v=1.002";
import {
  hasLivingCombatHp,
  isPlayerTargetableMob,
} from "./combat_factions.js?v=1.001";
import {
  getCombatTargetCenter,
  hasCombatLineOfEffect,
} from "./combat_reach.js?v=1.001";

export const ELEMENT_AREA_BASE_RADIUS = 80;
export const LIGHTNING_CHAIN_BASE_RADIUS = 120;

export const PRODUCTION_FIRE_TOME_BURN_PROFILE = Object.freeze({
  profileId: "g6d_fire_burn_v1",
  damageBasis: "capturedResolvedAtk",
  damagePerTickMultiplier: 0.15,
  tickFrames: 60,
  durationFrames: 240,
  maxStacks: 1,
  reapplication: "refresh-preserve-tick-phase",
});
export const PRODUCTION_FROST_CONTROL_PROFILE = Object.freeze({
  profileId: "g6d_frost_control_v1",
  stackCap: 4,
  slowPerStack: 0.1,
  chillDurationFrames: 240,
  ordinaryFreezeFrames: 60,
  eliteFreezeFrames: 30,
  bossSlowFrames: 90,
  frigidReprieveBasis: "maxArcaneBarrier",
  frigidReprieveMultiplier: 0.06,
  capPhaseProcPolicy: "ignore-without-refresh-cancel-or-banking",
  movementComposition: "strongest-slow-wins",
});

export function getCanonicalElementAreaRadius(playerStats = {}) {
  const overloadRank = playerStats.hasElementalOverload
    ? Math.min(2, Math.max(0, Math.floor(Number(playerStats.overloadLevel || 0))))
    : 0;
  return (
    ELEMENT_AREA_BASE_RADIUS *
    Number(playerStats.areaRadiusMult || 1) *
    (1 + overloadRank * 0.2)
  );
}

let lastLightningChainSnapshot = Object.freeze({
  frame: 0,
  originId: null,
  orderedTargetIds: Object.freeze([]),
  hopTargetIds: Object.freeze([]),
  candidateTargetIds: Object.freeze([]),
  eligibleTargetIds: Object.freeze([]),
  stoppedReason: "not-run",
});

function currentFrame(frame) {
  return Number.isFinite(frame) ? frame : Number(window.logicClock || 0);
}

function finite(value, fallback = 0) {
  if (value && typeof value.toFiniteNumber === "function") {
    return value.toFiniteNumber();
  }
  const resolved = Number(value);
  return Number.isFinite(resolved) ? resolved : fallback;
}

function targetId(target) {
  return target?.id ?? target?.entityId ?? null;
}

function targetDistance(left, right) {
  const leftCenter = getCombatTargetCenter(left);
  const rightCenter = getCombatTargetCenter(right);
  if (!leftCenter || !rightCenter) return Infinity;
  return Math.hypot(
    leftCenter.x - rightCenter.x,
    leftCenter.y - rightCenter.y,
  );
}

function subtractDamage(target, damage) {
  if (!target || !hasLivingCombatHp(target)) return false;
  if (target.hp && typeof target.hp.sub === "function") {
    target.hp = target.hp.sub(damage);
  } else {
    target.hp = Math.max(0, finite(target.hp) - finite(damage));
  }
  target.hasTakenDamage = true;
  target.flashTimer = 6;
  return true;
}

function multiplyDamage(damage, multiplier) {
  return damage && typeof damage.mul === "function"
    ? damage.mul(multiplier)
    : finite(damage) * multiplier;
}

function uniqueCombatTargets(explicitTargets) {
  const targets = [];
  const seen = new Set();
  const add = (target) => {
    if (!target || seen.has(target)) return;
    seen.add(target);
    targets.push(target);
  };
  (explicitTargets || window.activeDungeonMobs || []).forEach(add);
  add(window.mob);
  return targets;
}

export function isElementTargetInvulnerable(target) {
  if (!target) return true;
  if (
    target.invulnerable === true ||
    target.isInvulnerable === true ||
    target.immune === true ||
    target.isImmune === true ||
    target.phaseInvulnerable === true ||
    target.isPhaseTransitioning === true ||
    target.phaseTransitioning === true ||
    Number(target.phaseTransitionTimer || 0) > 0
  ) {
    return true;
  }
  return target.actionState === "cyber_barrier";
}

export function isEligiblePlayerElementTarget(target) {
  return Boolean(
    isPlayerTargetableMob(target) &&
      !target.periodicDeathPending &&
      !target.pendingRemoval &&
      !target.markedForRemoval &&
      !isElementTargetInvulnerable(target),
  );
}

export function isBossLikeElementTarget(target) {
  return Boolean(
    target &&
      (target === window.mob ||
        target.isBoss ||
        target.isMiniboss ||
        target.type === "dungeon_boss" ||
        target.type === "dungeon_miniboss" ||
        target.type === "marcus_boss" ||
        target.visualType === "marcus"),
  );
}

function isEliteElementTarget(target) {
  return Boolean(target?.isElite || target?.eliteAffix);
}

function hasExplicitFireProfile(profile) {
  return Boolean(
    profile &&
      typeof profile.profileId === "string" &&
      profile.profileId.length > 0 &&
      Number.isFinite(Number(profile.durationFrames)) &&
      Number(profile.durationFrames) > 0 &&
      ((profile.damagePerTick !== undefined && profile.damagePerTick !== null) ||
        (Number.isFinite(Number(profile.damagePerTickMultiplier)) &&
          Number(profile.damagePerTickMultiplier) > 0)),
  );
}

function hasExplicitFrostProfile(profile) {
  const requiredPositive = [
    "stackCap",
    "chillDurationFrames",
    "ordinaryFreezeFrames",
    "eliteFreezeFrames",
    "bossSlowFrames",
  ];
  const slow = Number(profile?.slowPerStack ?? profile?.slowMagnitude);
  const reprieve = Number(
    profile?.frigidReprieveMultiplier ?? profile?.frigidReprieveAmount,
  );
  return Boolean(
    profile &&
      typeof profile.profileId === "string" &&
      profile.profileId.length > 0 &&
      requiredPositive.every(
        (key) => Number.isFinite(Number(profile[key])) && Number(profile[key]) > 0,
      ) &&
      Number.isFinite(slow) &&
      slow > 0 &&
      slow < 1 &&
      Number.isFinite(reprieve) &&
      reprieve > 0,
  );
}

function ensureElementStates(target) {
  if (!target.elementStates || typeof target.elementStates !== "object") {
    target.elementStates = {};
  }
  return target.elementStates;
}

export function clearElementStates(target) {
  if (!target) return;
  clearPeriodicEffect(target, "burn");
  if (target.elementStates) delete target.elementStates.frost;
  target.elementStates = {};
}

export function applyCanonicalFireTomeBurn(
  target,
  profile,
  {
    frame,
    sourceId = "tome_fire",
    mechanic = "tome_burning_impact",
    resolvedAtk,
  } = {},
) {
  if (!isEligiblePlayerElementTarget(target)) {
    return { applied: false, reason: "ineligible-target", effect: null };
  }
  if (!hasExplicitFireProfile(profile)) {
    return { applied: false, reason: "missing-authored-profile", effect: null };
  }
  const damagePerTick =
    profile.damagePerTick !== undefined && profile.damagePerTick !== null
      ? profile.damagePerTick
      : multiplyDamage(
          resolvedAtk,
          Number(profile.damagePerTickMultiplier),
        );
  if (!(finite(damagePerTick) > 0)) {
    return { applied: false, reason: "missing-captured-atk", effect: null };
  }
  const effect = applyPeriodicEffect(target, "burn", {
    frame: currentFrame(frame),
    damagePerStack: damagePerTick,
    durationFrames: Number(profile.durationFrames),
    tickFrames: Number(profile.tickFrames || 60),
    maxStacks: 1,
    stacks: 1,
    reapplication: "replace",
    owner: "player",
    sourceId,
    mechanic,
    targetKind: "enemy",
  });
  return {
    applied: Boolean(effect),
    reason: effect ? "applied" : "rejected",
    effect,
  };
}

export function applyCanonicalFrostControl({
  target,
  profile,
  player,
  playerStats,
  frame,
}) {
  if (!isEligiblePlayerElementTarget(target)) {
    return { applied: false, reason: "ineligible-target", transition: null };
  }
  if (!hasExplicitFrostProfile(profile)) {
    return {
      applied: false,
      reason: "missing-authored-profile",
      transition: null,
    };
  }

  const resolvedFrame = currentFrame(frame);
  const states = ensureElementStates(target);
  const existing = states.frost;
  if (
    existing &&
    (existing.phase === "freeze" || existing.phase === "boss_slow") &&
    resolvedFrame < existing.expiresAt
  ) {
    return {
      applied: false,
      reason: "cap-phase-ignored",
      transition: null,
      state: existing,
    };
  }
  const existingChill =
    existing?.phase === "chill" && resolvedFrame < existing.expiresAt
      ? existing
      : null;
  const stackCap = Math.max(1, Math.floor(Number(profile.stackCap)));
  const stacks = Math.min(stackCap, (existingChill?.stacks || 0) + 1);
  const perStackSlow = Number(
    profile.slowPerStack ?? profile.slowMagnitude,
  );
  const slowMagnitude = profile.slowPerStack !== undefined
    ? Math.min(1, perStackSlow * stacks)
    : perStackSlow;
  const baseState = {
    profileId: profile.profileId,
    phase: "chill",
    stacks,
    stackCap,
    slowPerStack: perStackSlow,
    slowMagnitude,
    appliedAt: existingChill?.appliedAt ?? resolvedFrame,
    lastAppliedAt: resolvedFrame,
    expiresAt: resolvedFrame + Number(profile.chillDurationFrames),
  };

  if (stacks < stackCap) {
    states.frost = baseState;
    return { applied: true, reason: "chill", transition: "chill", state: baseState };
  }

  if (isBossLikeElementTarget(target)) {
    const maxShield = Math.max(
      0,
      finite(playerStats?.arcaneShieldMax || player?.arcaneShieldMax || 0),
    );
    const reprieveAmount = profile.frigidReprieveMultiplier !== undefined
      ? maxShield * Number(profile.frigidReprieveMultiplier)
      : Number(profile.frigidReprieveAmount);
    const recharge = applyArcaneShieldRecharge(
      player,
      maxShield,
      reprieveAmount,
      0,
    );
    const bossState = {
      ...baseState,
      phase: "boss_slow",
      stacks: 0,
      appliedAt: resolvedFrame,
      expiresAt: resolvedFrame + Number(profile.bossSlowFrames),
      frigidReprieve: { ...recharge },
    };
    states.frost = bossState;
    const metrics = window.playerStats?.combatEffectMetrics;
    if (metrics) {
      metrics.barrierRecharge =
        Number(metrics.barrierRecharge || 0) + Number(recharge.shieldGained || 0);
      metrics.procCounts ||= {};
      metrics.procCounts.frigidReprieve =
        Number(metrics.procCounts.frigidReprieve || 0) + 1;
    }
    return {
      applied: true,
      reason: "boss-resistant",
      transition: "boss_slow",
      state: bossState,
      frigidReprieve: recharge,
    };
  }

  const freezeFrames = isEliteElementTarget(target)
    ? Number(profile.eliteFreezeFrames)
    : Number(profile.ordinaryFreezeFrames);
  const freezeState = {
    ...baseState,
    phase: "freeze",
    stacks: 0,
    appliedAt: resolvedFrame,
    expiresAt: resolvedFrame + freezeFrames,
    freezeUntil: resolvedFrame + freezeFrames,
    eliteDuration: isEliteElementTarget(target),
  };
  states.frost = freezeState;
  return {
    applied: true,
    reason: "freeze",
    transition: "freeze",
    state: freezeState,
  };
}

export function applyElementalOverloadFrostSlow(target, rank, { frame } = {}) {
  if (!isEligiblePlayerElementTarget(target)) {
    return { applied: false, reason: "ineligible-target", state: null };
  }
  const resolvedRank = Math.min(2, Math.max(0, Math.floor(Number(rank || 0))));
  if (resolvedRank < 1) {
    return { applied: false, reason: "inactive-rank", state: null };
  }

  const resolvedFrame = currentFrame(frame);
  const states = ensureElementStates(target);
  const existing = states.elementalOverloadFrost;
  const slowMagnitude = resolvedRank === 1 ? 0.2 : 0.4;
  const state = {
    source: "elemental_overload",
    phase: "overload_slow",
    rank: resolvedRank,
    slowMagnitude,
    movementMultiplier: 1 - slowMagnitude,
    stackingRule: "non-stacking-reapplication",
    appliedAt: existing?.appliedAt ?? resolvedFrame,
    lastAppliedAt: resolvedFrame,
    applicationCount: Number(existing?.applicationCount || 0) + 1,
  };
  states.elementalOverloadFrost = state;
  return { applied: true, reason: "non-stacking-reapplication", state };
}

export function advanceCanonicalElementStates(targets, frame) {
  const resolvedFrame = currentFrame(frame);
  const uniqueTargets = new Set((targets || []).filter(Boolean));
  for (const target of uniqueTargets) {
    if (!hasLivingCombatHp(target)) {
      clearElementStates(target);
      continue;
    }
    const frost = target.elementStates?.frost;
    if (frost && resolvedFrame >= frost.expiresAt) {
      delete target.elementStates.frost;
    }
  }
}

function getFrostProfileMovementMultiplier(target, frame) {
  const frost = target?.elementStates?.frost;
  const resolvedFrame = currentFrame(frame);
  if (!frost || resolvedFrame >= frost.expiresAt) return 1;
  if (frost.phase === "freeze") return 0;
  if (frost.phase === "chill" || frost.phase === "boss_slow") {
    return Math.max(0, 1 - Number(frost.slowMagnitude || 0));
  }
  return 1;
}

function getElementalOverloadFrostMovementMultiplier(target) {
  const overload = target?.elementStates?.elementalOverloadFrost;
  const multiplier = Number(overload?.movementMultiplier);
  return Number.isFinite(multiplier)
    ? Math.max(0, Math.min(1, multiplier))
    : 1;
}

export function getFrostMovementMultiplier(target, frame) {
  return Math.min(
    getElementalOverloadFrostMovementMultiplier(target),
    getFrostProfileMovementMultiplier(target, frame),
  );
}

export function getFrostMovementCompositionSnapshot(target, frame) {
  const resolvedFrame = currentFrame(frame);
  const overload = target?.elementStates?.elementalOverloadFrost;
  const frost = target?.elementStates?.frost;
  const profileActive = Boolean(frost && resolvedFrame < frost.expiresAt);
  return readonlyCopy({
    compositionRule: "strongest-slow-wins",
    elementalOverload: overload
      ? {
          active: true,
          rank: overload.rank,
          slowMagnitude: overload.slowMagnitude,
          movementMultiplier: overload.movementMultiplier,
          stackingRule: overload.stackingRule,
          applicationCount: overload.applicationCount,
          lastAppliedAt: overload.lastAppliedAt,
        }
      : { active: false, movementMultiplier: 1 },
    chillFreeze: profileActive
      ? {
          active: true,
          phase: frost.phase,
          slowMagnitude: frost.slowMagnitude,
          movementMultiplier: getFrostProfileMovementMultiplier(target, frame),
          remainingFrames: frost.expiresAt - resolvedFrame,
          bossConverted: frost.phase === "boss_slow",
        }
      : { active: false, movementMultiplier: 1, bossConverted: false },
    effectiveMovementMultiplier: getFrostMovementMultiplier(target, frame),
  });
}

function readonlyCopy(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(readonlyCopy));
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, readonlyCopy(entry)]),
    ),
  );
}

export function getElementStateSnapshot(target, frame) {
  const resolvedFrame = currentFrame(frame);
  const burn = getPeriodicEffect(target, "burn");
  const frost = target?.elementStates?.frost;
  return readonlyCopy({
    burn: burn
      ? {
          active: true,
          sourceId: burn.sourceId,
          mechanic: burn.mechanic,
          stacks: burn.stacks,
          remainingFrames: Math.max(0, burn.expiresAt - resolvedFrame),
          nextTickInFrames: Math.max(0, burn.nextTickAt - resolvedFrame),
        }
      : { active: false },
    frost: frost && resolvedFrame < frost.expiresAt
      ? {
          active: true,
          phase: frost.phase,
          stacks: frost.stacks,
          stackCap: frost.stackCap,
          slowMagnitude: frost.slowMagnitude,
          remainingFrames: frost.expiresAt - resolvedFrame,
          eliteDuration: Boolean(frost.eliteDuration),
          frigidReprieve: frost.frigidReprieve || null,
        }
      : { active: false },
    elementalOverloadFrost: target?.elementStates?.elementalOverloadFrost
      ? {
          active: true,
          rank: target.elementStates.elementalOverloadFrost.rank,
          slowMagnitude: target.elementStates.elementalOverloadFrost.slowMagnitude,
          movementMultiplier:
            target.elementStates.elementalOverloadFrost.movementMultiplier,
          stackingRule: target.elementStates.elementalOverloadFrost.stackingRule,
          applicationCount:
            target.elementStates.elementalOverloadFrost.applicationCount,
        }
      : { active: false },
  });
}

function targetsInSecondaryArea({
  originTarget,
  radius,
  targets,
  map,
  collisionCheck,
  includeOrigin = true,
}) {
  return uniqueCombatTargets(targets)
    .filter((target) => includeOrigin || target !== originTarget)
    .filter(isEligiblePlayerElementTarget)
    .filter((target) => targetDistance(originTarget, target) <= radius)
    .filter((target) =>
      hasCombatLineOfEffect(originTarget, target, map, collisionCheck),
    );
}

function resolveFireSecondary(context) {
  const {
    originTarget,
    spellDamage,
    playerStats,
    map,
    collisionCheck,
    targets,
    fireProfile,
    frame,
  } = context;
  const radius = getCanonicalElementAreaRadius(playerStats);
  const areaTargets = targetsInSecondaryArea({
    originTarget,
    radius,
    targets,
    map,
    collisionCheck,
  });
  const burnResults = areaTargets.map((target) => ({
    target,
    ...applyCanonicalFireTomeBurn(target, fireProfile, {
      frame,
      resolvedAtk: playerStats?.atk,
    }),
  }));
  const splashHits = [];
  if (playerStats?.hasElementalOverload) {
    const splashDamage = multiplyDamage(
      spellDamage,
      Number(playerStats.overloadLevel) === 1 ? 0.35 : 0.7,
    );
    for (const target of areaTargets) {
      if (target === originTarget) continue;
      if (subtractDamage(target, splashDamage)) {
        splashHits.push({ target, damage: splashDamage });
      }
    }
  }
  return {
    element: "fire",
    radius,
    areaTargetIds: areaTargets.map(targetId),
    burnTargetIds: burnResults.filter((result) => result.applied).map((result) => targetId(result.target)),
    burnGated: !hasExplicitFireProfile(fireProfile),
    splashHits,
  };
}

function resolveFrostSecondary(context) {
  const {
    originTarget,
    player,
    playerStats,
    map,
    collisionCheck,
    targets,
    frostProfile,
    frame,
  } = context;
  const radius = getCanonicalElementAreaRadius(playerStats);
  const primaryResult = applyCanonicalFrostControl({
    target: originTarget,
    profile: frostProfile,
    player,
    playerStats,
    frame,
  });
  const areaTargets = playerStats?.hasElementalOverload
    ? targetsInSecondaryArea({
        originTarget,
        radius,
        targets,
        map,
        collisionCheck,
      })
    : [];
  const areaResults = [];
  for (const target of areaTargets) {
    if (target !== originTarget) {
      areaResults.push({
        target,
        ...applyCanonicalFrostControl({
          target,
          profile: frostProfile,
          player,
          playerStats,
          frame,
        }),
      });
    }
    if (playerStats?.hasElementalOverload) {
      applyElementalOverloadFrostSlow(target, playerStats.overloadLevel, {
        frame,
      });
    }
  }
  return {
    element: "frost",
    radius,
    primaryResult,
    areaTargetIds: areaTargets.map(targetId),
    chilledTargetIds: [
      ...(primaryResult.applied ? [targetId(originTarget)] : []),
      ...areaResults.filter((result) => result.applied).map((result) => targetId(result.target)),
    ],
    frostGated: !hasExplicitFrostProfile(frostProfile),
    overloadSlowMagnitude: playerStats?.hasElementalOverload
      ? Number(playerStats.overloadLevel) === 1
        ? 0.2
        : 0.4
      : 0,
    overloadStackingRule: playerStats?.hasElementalOverload
      ? "non-stacking-reapplication"
      : "inactive",
  };
}

function setLastLightningChain({
  frame,
  originTarget,
  orderedTargets,
  candidateTargets,
  eligibleTargets,
  stoppedReason,
}) {
  lastLightningChainSnapshot = readonlyCopy({
    frame: currentFrame(frame),
    originId: targetId(originTarget),
    orderedTargetIds: orderedTargets.map(targetId),
    hopTargetIds: orderedTargets.slice(1).map(targetId),
    candidateTargetIds: candidateTargets.map(targetId),
    eligibleTargetIds: eligibleTargets.map(targetId),
    stoppedReason,
  });
  return lastLightningChainSnapshot;
}

function resolveLightningSecondary(context) {
  const {
    originTarget,
    spellDamage,
    playerStats,
    map,
    collisionCheck,
    targets,
    frame,
  } = context;
  const radius =
    LIGHTNING_CHAIN_BASE_RADIUS * Number(playerStats?.areaRadiusMult || 1);
  const orderedTargets = [originTarget];
  const seen = new Set(orderedTargets);
  const candidateTargets = uniqueCombatTargets(targets);
  const eligibleTargets = candidateTargets.filter(isEligiblePlayerElementTarget);
  const hopHits = [];
  let currentTarget = originTarget;
  let remainingHops = 1 + Math.max(0, Math.floor(Number(playerStats?.overloadLevel || 0)));
  let stoppedReason = "hop-budget-complete";

  while (remainingHops > 0) {
    const nextTarget = candidateTargets
      .filter((target) => !seen.has(target))
      .filter(isEligiblePlayerElementTarget)
      .map((target) => ({ target, distance: targetDistance(currentTarget, target) }))
      .filter((candidate) => candidate.distance <= radius)
      .filter((candidate) =>
        hasCombatLineOfEffect(
          currentTarget,
          candidate.target,
          map,
          collisionCheck,
        ),
      )
      .sort((left, right) => {
        if (left.distance !== right.distance) return left.distance - right.distance;
        return String(targetId(left.target)).localeCompare(String(targetId(right.target)));
      })[0]?.target;

    if (!nextTarget) {
      stoppedReason = "no-visible-eligible-target";
      break;
    }
    if (!subtractDamage(nextTarget, spellDamage)) {
      stoppedReason = "target-became-ineligible";
      break;
    }
    seen.add(nextTarget);
    orderedTargets.push(nextTarget);
    hopHits.push({ from: currentTarget, target: nextTarget, damage: spellDamage });
    currentTarget = nextTarget;
    remainingHops--;
  }

  return {
    element: "lightning",
    radius,
    hopHits,
    chain: setLastLightningChain({
      frame,
      originTarget,
      orderedTargets,
      candidateTargets,
      eligibleTargets,
      stoppedReason,
    }),
  };
}

export function presentTomeElementSecondaryResult(result) {
  if (!result) return;
  for (const hit of result.splashHits || []) {
    window.combatVisuals?.spawnDamageEffect?.(
      hit.target.x + (hit.target.w || 24) / 2,
      hit.target.y + (hit.target.h || 24) / 2,
      hit.damage,
      "fire",
      false,
    );
  }
  for (const hit of result.hopHits || []) {
    const fromCenter = getCombatTargetCenter(hit.from);
    const targetCenter = getCombatTargetCenter(hit.target);
    window.combatVisuals?.spawnDamageEffect?.(
      targetCenter.x,
      targetCenter.y,
      hit.damage,
      "lightning",
      false,
    );
    window.cavernInteractives ||= [];
    const arcId = Number.isFinite(Number(window.idCounter)) ? Number(window.idCounter) : 0;
    window.idCounter = arcId + 1;
    window.cavernInteractives.push({
      id: arcId,
      type: "lightning_arc",
      x: fromCenter.x,
      y: fromCenter.y,
      x2: targetCenter.x,
      y2: targetCenter.y,
      life: 15,
    });
  }
  for (const targetIdValue of result.areaTargetIds || []) {
    const target = uniqueCombatTargets().find(
      (candidate) => targetId(candidate) === targetIdValue,
    );
    if (result.element === "frost" && target) {
      window.combatVisuals?.spawnParticles?.(
        target.x + (target.w || 24) / 2,
        target.y + (target.h || 24) / 2,
        8,
        "void_orb",
        1,
      );
    }
  }
}

export function resolveTomeElementSecondaryEffect(context) {
  if (!context?.originTarget || !isEligiblePlayerElementTarget(context.originTarget)) {
    return { element: context?.element || null, skipped: "ineligible-origin" };
  }
  let result;
  if (context.element === "fire") result = resolveFireSecondary(context);
  else if (context.element === "frost") result = resolveFrostSecondary(context);
  else if (context.element === "lightning") result = resolveLightningSecondary(context);
  else result = { element: context.element, skipped: "unsupported-element" };
  if (context.present !== false) presentTomeElementSecondaryResult(result);
  return result;
}

export function getLastLightningChainSnapshot() {
  return lastLightningChainSnapshot;
}
