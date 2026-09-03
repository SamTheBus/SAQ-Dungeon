import { getArtifactMechanicScale } from "./artifact_authority.js";

export const COMBAT_EFFECT_CLOCK_HZ = 60;

export const BIOHAZARD_POISON_HEALING_PROFILE = Object.freeze({
  profileId: "g6d_biohazard_v1",
  healingFraction: 0.05,
  capMaxHpPerSecond: 0.015,
  capWindowFrames: 60,
});

function resolvedArtifactScale(trait) {
  const scale = getArtifactMechanicScale(trait);
  if (scale > 0) return scale;
  return typeof window.checkArtifactTrait === "function" &&
    window.checkArtifactTrait(trait)
    ? 1
    : 0;
}

export const PERIODIC_EFFECT_CONTRACT = Object.freeze({
  poison: Object.freeze({
    maxStacks: 5,
    durationFrames: 600,
    tickFrames: 60,
    refreshMode: "add-and-refresh",
  }),
  bleed: Object.freeze({
    maxStacks: 5,
    durationFrames: 600,
    tickFrames: 60,
    refreshMode: "add-and-refresh",
  }),
  burn: Object.freeze({
    maxStacks: 1,
    durationFrames: null,
    tickFrames: 60,
    refreshMode: "source-defined",
    dormantWithoutAuthoredSource: true,
  }),
});

const TARGET_PERIODIC_EFFECTS = ["poison", "bleed", "burn"];

export function getCanonicalSpellPacketElements(hasTriadConvergence, ordinaryElement) {
  return hasTriadConvergence
    ? ["fire", "lightning", "frost"]
    : [ordinaryElement];
}

function currentFrame(frame) {
  return Number.isFinite(frame) ? frame : window.logicClock || 0;
}

function toFiniteNumber(value, fallback = 0) {
  if (value && typeof value.toFiniteNumber === "function") {
    return value.toFiniteNumber();
  }
  const finite = Number(value);
  return Number.isFinite(finite) ? finite : fallback;
}

function toDamageValue(value) {
  return typeof BigNum !== "undefined" && BigNum.from
    ? BigNum.from(value || 0)
    : toFiniteNumber(value);
}

function multiplyDamage(value, multiplier) {
  return value && typeof value.mul === "function"
    ? value.mul(multiplier)
    : value * multiplier;
}

function addDamage(left, right) {
  return left && typeof left.add === "function"
    ? left.add(right)
    : toFiniteNumber(left) + toFiniteNumber(right);
}

function zeroDamage() {
  return toDamageValue(0);
}

function ensureCombatEffectMetrics() {
  if (!window.playerStats) return null;
  const metrics = (window.playerStats.combatEffectMetrics ||= {
    dotDamage: 0,
    dotDamageByEffect: { poison: 0, bleed: 0, burn: 0 },
    dotTicks: { poison: 0, bleed: 0, burn: 0 },
    procCounts: {},
    barrierRecharge: 0,
    hpSustain: 0,
    secondaryDamage: 0,
    secondaryDamageByMechanic: {},
    biohazardHealingEligibleDamage: 0,
    biohazardHealingPotential: 0,
    biohazardHealing: 0,
    biohazardHealingCap: 0,
    biohazardHealingCapSaturatedTicks: 0,
  });
  metrics.dotDamage ||= 0;
  metrics.dotDamageByEffect ||= { poison: 0, bleed: 0, burn: 0 };
  metrics.dotTicks ||= { poison: 0, bleed: 0, burn: 0 };
  metrics.procCounts ||= {};
  metrics.barrierRecharge ||= 0;
  metrics.hpSustain ||= 0;
  metrics.secondaryDamage ||= 0;
  metrics.secondaryDamageByMechanic ||= {};
  metrics.biohazardHealingEligibleDamage ||= 0;
  metrics.biohazardHealingPotential ||= 0;
  metrics.biohazardHealing ||= 0;
  metrics.biohazardHealingCap ||= 0;
  metrics.biohazardHealingCapSaturatedTicks ||= 0;
  return metrics;
}

function recordProc(procName, count = 1) {
  const metrics = ensureCombatEffectMetrics();
  if (!metrics) return;
  metrics.procCounts[procName] = (metrics.procCounts[procName] || 0) + count;
}

export function resetCombatEffectMetrics(playerStats = window.playerStats) {
  if (!playerStats) return null;
  playerStats.combatEffectMetrics = {
    dotDamage: 0,
    dotDamageByEffect: { poison: 0, bleed: 0, burn: 0 },
    dotTicks: { poison: 0, bleed: 0, burn: 0 },
    procCounts: {},
    barrierRecharge: 0,
    hpSustain: 0,
    secondaryDamage: 0,
    secondaryDamageByMechanic: {},
    biohazardHealingEligibleDamage: 0,
    biohazardHealingPotential: 0,
    biohazardHealing: 0,
    biohazardHealingCap: 0,
    biohazardHealingCapSaturatedTicks: 0,
  };
  return playerStats.combatEffectMetrics;
}

function isAlive(target) {
  if (!target || target.hp === undefined || target.hp === null) return false;
  return target.hp && typeof target.hp.gt === "function"
    ? target.hp.gt(0)
    : target.hp > 0;
}

function subtractDamage(target, damage) {
  const before = Math.max(0, toFiniteNumber(target?.hp));
  const requested = Math.max(0, toFiniteNumber(damage));
  const actualDamage = Math.min(before, requested);
  if (target.hp && typeof target.hp.sub === "function") {
    target.hp = target.hp.sub(damage);
    if (target.hp.lte?.(0)) target.hp = toDamageValue(0);
  } else {
    target.hp = Math.max(0, before - requested);
  }
  return { before, requested, actualDamage, after: Math.max(0, before - actualDamage) };
}

function ensureEffects(target) {
  if (!target.periodicEffects || typeof target.periodicEffects !== "object") {
    target.periodicEffects = {};
  }
  return target.periodicEffects;
}

function syncLegacyTargetFields(target, effectType, effect) {
  if (!target) return;
  const stacks = effect ? effect.stacks : 0;
  if (effectType === "poison") {
    target.poisonStacks = stacks;
    target.poisonLevel = effect ? effect.rank || 1 : 0;
  } else if (effectType === "bleed") {
    target.bleedStacks = stacks;
    target.bleedTimer = effect
      ? Math.max(0, effect.expiresAt - currentFrame())
      : 0;
  } else if (effectType === "burn") {
    target.burnStacks = stacks;
    target.isBurning = stacks > 0;
  }
}

function syncLegacyPlayerPoison(player, effect, frame) {
  const stacks = effect ? effect.stacks : 0;
  const remaining = effect ? Math.max(0, effect.expiresAt - frame) : 0;
  player.poisonStacks = stacks;
  player.poisonTimer = remaining;
  player.poisonTickTimer = effect
    ? Math.max(0, effect.tickFrames - (effect.nextTickAt - frame))
    : 0;
  if (window.playerStats) {
    window.playerStats.poisonStacks = stacks;
    window.playerStats.poisonTimer = remaining;
  }
}

export function getPeriodicEffect(target, effectType) {
  return target?.periodicEffects?.[effectType] || null;
}

export function hasPeriodicEffect(target, effectType) {
  const effect = getPeriodicEffect(target, effectType);
  return !!(effect && effect.stacks > 0);
}

export function getActivePeriodicEffectCount(target) {
  return TARGET_PERIODIC_EFFECTS.reduce(
    (count, effectType) => count + (hasPeriodicEffect(target, effectType) ? 1 : 0),
    0,
  );
}

export function getActivePoisonBleedStackCount(target) {
  return ["poison", "bleed"].reduce(
    (count, effectType) => count + (getPeriodicEffect(target, effectType)?.stacks || 0),
    0,
  );
}

export function clearPeriodicEffect(target, effectType) {
  if (!target) return null;
  const effects = ensureEffects(target);
  const removed = effects[effectType] || null;
  delete effects[effectType];
  if (target === window.player && effectType === "poison") {
    syncLegacyPlayerPoison(target, null, currentFrame());
  } else {
    syncLegacyTargetFields(target, effectType, null);
  }
  return removed;
}

export function clearAllPeriodicEffects(target) {
  if (!target) return;
  for (const effectType of TARGET_PERIODIC_EFFECTS) {
    clearPeriodicEffect(target, effectType);
  }
  target.periodicEffects = {};
}

export function applyPeriodicEffect(target, effectType, options = {}) {
  if (!target || !TARGET_PERIODIC_EFFECTS.includes(effectType)) return null;
  const contract = PERIODIC_EFFECT_CONTRACT[effectType];
  const durationFrames = options.durationFrames ?? contract.durationFrames;
  const damagePerStack = options.damagePerStack;
  if (
    !Number.isFinite(durationFrames) ||
    durationFrames <= 0 ||
    damagePerStack === undefined ||
    damagePerStack === null
  ) {
    return null;
  }

  const frame = currentFrame(options.frame);
  const effects = ensureEffects(target);
  const existing = effects[effectType];
  const tickFrames = options.tickFrames || contract.tickFrames;
  const maxStacks = options.maxStacks || contract.maxStacks;
  const addedStacks = Math.max(1, Math.floor(options.stacks || 1));
  const replace = options.reapplication === "replace";
  const nextStacks = replace
    ? Math.min(maxStacks, addedStacks)
    : Math.min(maxStacks, (existing?.stacks || 0) + addedStacks);

  const effect = {
    type: effectType,
    stacks: nextStacks,
    maxStacks,
    durationFrames,
    tickFrames,
    appliedAt: existing?.appliedAt ?? frame,
    lastAppliedAt: frame,
    expiresAt:
      options.reapplication === "extend" && existing
        ? existing.expiresAt + durationFrames
        : frame + durationFrames,
    nextTickAt: existing?.nextTickAt ?? options.nextTickAt ?? frame + tickFrames,
    damagePerStack: toDamageValue(damagePerStack),
    rank: options.rank || existing?.rank || 1,
    owner: options.owner || existing?.owner || "player",
    sourceId: options.sourceId || existing?.sourceId || null,
    mechanic: options.mechanic || existing?.mechanic || effectType,
    targetKind: options.targetKind || existing?.targetKind || "enemy",
  };
  effects[effectType] = effect;

  if (effect.targetKind === "player") {
    syncLegacyPlayerPoison(target, effect, frame);
  } else {
    syncLegacyTargetFields(target, effectType, effect);
  }
  return effect;
}

export function applyPlayerPoison(target, pStats, options = {}) {
  const rank = Math.max(1, options.rank || 1);
  const poisonMultiplier = pStats?.poisonDamageMultiplier || 1;
  const authoredCoefficient = Number(
    options.authoredCoefficient ?? 0.1 * rank * poisonMultiplier,
  );
  const capturedAtk = toDamageValue(
    options.capturedAtk ?? pStats?.atk ?? window.player?.atk ?? 15,
  );
  const damagePerStack = multiplyDamage(
    capturedAtk,
    authoredCoefficient,
  );
  const frame = currentFrame(options.frame);
  const durationFrames = options.durationFrames || 600;
  const existingSources = getPeriodicEffect(target, "poison")?.poisonSources || {};
  const poisonSources = Object.fromEntries(
    Object.entries(existingSources).filter(([, source]) =>
      Number(source?.expiresAt || 0) >= frame,
    ),
  );
  const sourceKey = String(
    options.poisonSourceKey || options.mechanic || "player_poison",
  );
  poisonSources[sourceKey] = {
    sourceKey,
    mechanic: options.mechanic || "player_poison",
    sourceId: options.sourceId || sourceKey,
    authoredCoefficient,
    capturedAtk,
    damagePerStack,
    rank,
    appliedAt: frame,
    expiresAt: frame + durationFrames,
  };
  const effect = applyPeriodicEffect(target, "poison", {
    ...options,
    frame,
    rank,
    damagePerStack,
    durationFrames,
    maxStacks: 5,
    owner: "player",
    targetKind: "enemy",
  });
  if (effect) {
    effect.poisonSources = poisonSources;
    const strongest = Object.values(poisonSources).sort((left, right) => {
      if (right.authoredCoefficient !== left.authoredCoefficient) {
        return right.authoredCoefficient - left.authoredCoefficient;
      }
      if (right.rank !== left.rank) return right.rank - left.rank;
      return right.appliedAt - left.appliedAt;
    })[0];
    if (strongest) {
      effect.damagePerStack = toDamageValue(strongest.damagePerStack);
      effect.activePoisonSource = strongest.sourceKey;
      effect.activeAuthoredCoefficient = strongest.authoredCoefficient;
      effect.rank = strongest.rank;
      effect.mechanic = strongest.mechanic;
      effect.sourceId = strongest.sourceId;
    }
    recordProc("poisonApplications");
  }
  return effect;
}

export function applyPlayerBleed(target, pStats, options = {}) {
  const bleedMultiplier = pStats?.bleedDamageMultiplier || 1;
  const damagePerStack = multiplyDamage(
    toDamageValue(pStats?.atk || window.player?.atk || 15),
    0.05 * bleedMultiplier,
  );
  const effect = applyPeriodicEffect(target, "bleed", {
    ...options,
    damagePerStack,
    durationFrames: options.durationFrames || 600,
    maxStacks: 5,
    owner: "player",
    targetKind: "enemy",
  });
  if (effect) recordProc("bleedApplications");
  return effect;
}

export function applyHostilePlayerPoison(player, options = {}) {
  const damagePerStack = Math.max(1, Math.round((player.maxHp || 1) * 0.012));
  return applyPeriodicEffect(player, "poison", {
    ...options,
    damagePerStack,
    durationFrames: options.durationFrames || 240,
    tickFrames: options.tickFrames || 60,
    maxStacks: options.maxStacks || 5,
    owner: "enemy",
    targetKind: "player",
    mechanic: options.mechanic || "hostile_poison",
  });
}

function recordPeriodicMetric(effectType, damage) {
  const metrics = ensureCombatEffectMetrics();
  if (!metrics) return;
  const amount = toFiniteNumber(damage);
  metrics.dotDamage += amount;
  metrics.dotDamageByEffect[effectType] =
    (metrics.dotDamageByEffect[effectType] || 0) + amount;
  metrics.dotTicks[effectType] = (metrics.dotTicks[effectType] || 0) + 1;
}

function emitPeriodicPresentation(target, effectType, damage) {
  if (target === window.player) {
    if (typeof window.spawnFloatingText === "function") {
      window.spawnFloatingText(
        target.x,
        target.y - 16,
        `-${Math.round(toFiniteNumber(damage))} ${effectType.toUpperCase()}`,
        effectType === "poison" ? "#2ecc71" : "#e74c3c",
        true,
      );
    }
    return;
  }
  target.flashTimer = 4;
  if (window.combatVisuals?.spawnDamageEffect) {
    window.combatVisuals.spawnDamageEffect(
      target.x + (target.w || 24) / 2,
      target.y + (target.h || 24) / 2,
      damage,
      effectType,
      false,
      target,
    );
  }
}

function periodicDamageTakenMultiplier(target, effectType) {
  const explicit = [
    target?.[`${effectType}DamageTakenMultiplier`],
    target?.periodicDamageTakenMultiplier,
    target?.damageTakenMultiplier,
  ].find((value) => Number.isFinite(Number(value)));
  return explicit === undefined ? 1 : Math.max(0, Number(explicit));
}

function resolveActivePoisonSource(effect, frame) {
  if (!effect?.poisonSources) return null;
  effect.poisonSources = Object.fromEntries(
    Object.entries(effect.poisonSources).filter(([, source]) =>
      Number(source?.expiresAt || 0) >= frame,
    ),
  );
  const strongest = Object.values(effect.poisonSources).sort((left, right) => {
    if (right.authoredCoefficient !== left.authoredCoefficient) {
      return right.authoredCoefficient - left.authoredCoefficient;
    }
    if (right.rank !== left.rank) return right.rank - left.rank;
    return right.appliedAt - left.appliedAt;
  })[0] || null;
  if (strongest) {
    effect.damagePerStack = toDamageValue(strongest.damagePerStack);
    effect.activePoisonSource = strongest.sourceKey;
    effect.activeAuthoredCoefficient = strongest.authoredCoefficient;
    effect.rank = strongest.rank;
    effect.mechanic = strongest.mechanic;
    effect.sourceId = strongest.sourceId;
  }
  return strongest;
}

export function resolveBiohazardPoisonHealing({
  player,
  playerStats = window.playerStats,
  resolvedStats,
  actualDamage,
  frame,
} = {}) {
  const eligibleDamage = Math.max(0, toFiniteNumber(actualDamage));
  if (
    !resolvedStats?.hasCorrosiveSet ||
    !player ||
    !playerStats ||
    !(toFiniteNumber(player.hp) > 0) ||
    eligibleDamage <= 0
  ) {
    return {
      eligible: false,
      eligibleDamage,
      potentialHeal: 0,
      actualHeal: 0,
      capRemaining: 0,
      capped: false,
    };
  }
  const resolvedFrame = currentFrame(frame);
  const maxHp = Math.max(0, toFiniteNumber(player.maxHp || resolvedStats.maxHp));
  const cap = maxHp * BIOHAZARD_POISON_HEALING_PROFILE.capMaxHpPerSecond;
  const ledger = (playerStats.biohazardRecentHeals ||= []).filter(
    (entry) =>
      Number.isFinite(entry.frame) &&
      entry.frame <= resolvedFrame &&
      resolvedFrame - entry.frame < BIOHAZARD_POISON_HEALING_PROFILE.capWindowFrames,
  );
  playerStats.biohazardRecentHeals = ledger;
  const used = ledger.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const capRemaining = Math.max(0, cap - used);
  const potentialHeal =
    eligibleDamage * BIOHAZARD_POISON_HEALING_PROFILE.healingFraction;
  const missingHp = Math.max(0, maxHp - toFiniteNumber(player.hp));
  const actualHeal = Math.min(potentialHeal, capRemaining, missingHp);
  if (actualHeal > 0) {
    if (player.hp && typeof player.hp.add === "function") {
      player.hp = player.hp.add(actualHeal);
    } else {
      player.hp = toFiniteNumber(player.hp) + actualHeal;
    }
    ledger.push({ frame: resolvedFrame, amount: actualHeal });
  }
  const state = ensureCombatEffectMetrics();
  if (state) {
    state.biohazardHealingEligibleDamage += eligibleDamage;
    state.biohazardHealingPotential += potentialHeal;
    state.biohazardHealing += actualHeal;
    state.biohazardHealingCap = cap;
    state.hpSustain += actualHeal;
    if (potentialHeal > actualHeal && capRemaining <= potentialHeal) {
      state.biohazardHealingCapSaturatedTicks++;
    }
    if (actualHeal > 0) recordProc("biohazardHealingTicks");
  }
  return {
    eligible: true,
    eligibleDamage,
    potentialHeal,
    actualHeal,
    cap,
    capRemaining: Math.max(0, capRemaining - actualHeal),
    capped: potentialHeal > actualHeal && capRemaining <= potentialHeal,
  };
}

function advanceTargetEffect(
  target,
  effectType,
  frame,
  { player = null, resolvedStats = null } = {},
) {
  const effect = getPeriodicEffect(target, effectType);
  if (!effect) return [];
  const tickEvents = [];

  while (frame >= effect.nextTickAt && effect.nextTickAt <= effect.expiresAt) {
    if (!isAlive(target)) break;
    if (effectType === "poison") resolveActivePoisonSource(effect, effect.nextTickAt);
    const rawDamage = multiplyDamage(effect.damagePerStack, effect.stacks);
    const damage = multiplyDamage(
      rawDamage,
      periodicDamageTakenMultiplier(target, effectType),
    );
    const applied = subtractDamage(target, damage);
    const biohazardHealing =
      effectType === "poison" && effect.owner === "player"
        ? resolveBiohazardPoisonHealing({
            player,
            resolvedStats,
            actualDamage: applied.actualDamage,
            frame: effect.nextTickAt,
          })
        : null;
    const event = {
      type: effectType,
      frame: effect.nextTickAt,
      damage,
      rawDamage,
      actualDamage: applied.actualDamage,
      stacks: effect.stacks,
      owner: effect.owner,
      sourceId: effect.sourceId,
      mechanic: effect.mechanic,
      activePoisonSource: effect.activePoisonSource || null,
      activeAuthoredCoefficient: effect.activeAuthoredCoefficient || null,
      biohazardHealing,
      lethal: !isAlive(target),
    };
    tickEvents.push(event);
    target.lastDamageAttribution = {
      kind: "periodic",
      effectType,
      owner: effect.owner,
      sourceId: effect.sourceId,
      mechanic: effect.mechanic,
      frame: effect.nextTickAt,
      damage: applied.actualDamage,
    };
    if (event.lethal) target.periodicDeathPending = true;
    if (effect.owner === "player") {
      recordPeriodicMetric(effectType, applied.actualDamage);
    }
    emitPeriodicPresentation(target, effectType, applied.actualDamage);
    effect.nextTickAt += effect.tickFrames;
  }

  if (
    !target.periodicDeathPending &&
    frame >= effect.expiresAt &&
    effect.nextTickAt > effect.expiresAt
  ) {
    clearPeriodicEffect(target, effectType);
  } else if (effect.targetKind === "player") {
    syncLegacyPlayerPoison(target, effect, frame);
  } else {
    syncLegacyTargetFields(target, effectType, effect);
  }
  return tickEvents;
}

export function advanceCanonicalPeriodicEffects(
  targets,
  player,
  frame,
  resolvedStats = null,
) {
  const resolvedFrame = currentFrame(frame);
  const uniqueTargets = new Set((targets || []).filter(Boolean));
  const events = [];
  for (const target of uniqueTargets) {
    for (const effectType of TARGET_PERIODIC_EFFECTS) {
      events.push(
        ...advanceTargetEffect(target, effectType, resolvedFrame, {
          player,
          resolvedStats,
        }),
      );
    }
  }
  if (player) {
    if (
      !hasPeriodicEffect(player, "poison") &&
      (player.poisonStacks || 0) > 0 &&
      (player.poisonTimer || 0) > 0
    ) {
      applyHostilePlayerPoison(player, {
        frame: resolvedFrame,
        stacks: player.poisonStacks,
        maxStacks: Math.max(3, player.poisonStacks),
        durationFrames: player.poisonTimer,
        nextTickAt:
          resolvedFrame + Math.max(1, 60 - (player.poisonTickTimer || 0)),
        mechanic: "hydrated_hostile_poison",
        reapplication: "replace",
      });
    }
    for (const effectType of TARGET_PERIODIC_EFFECTS) {
      events.push(...advanceTargetEffect(player, effectType, resolvedFrame));
    }
    if (!isAlive(player) && typeof window.startDeathSequence === "function") {
      window.startDeathSequence();
    }
  }
  return events;
}

export function getRemainingPeriodicDamage(target, effectTypes = ["poison", "bleed"], frame) {
  const resolvedFrame = currentFrame(frame);
  let total = zeroDamage();
  for (const effectType of effectTypes) {
    const effect = getPeriodicEffect(target, effectType);
    if (!effect) continue;
    const ticksRemaining = Math.max(
      0,
      Math.floor((effect.expiresAt - Math.max(resolvedFrame, effect.nextTickAt)) / effect.tickFrames) + 1,
    );
    total = addDamage(
      total,
      multiplyDamage(effect.damagePerStack, effect.stacks * ticksRemaining),
    );
  }
  return total;
}

export function detonateRemainingPeriodicDamage(
  target,
  multiplier,
  effectTypes = ["poison", "bleed"],
  frame,
) {
  const stacksConsumed = effectTypes.reduce(
    (sum, effectType) => sum + (getPeriodicEffect(target, effectType)?.stacks || 0),
    0,
  );
  const remaining = getRemainingPeriodicDamage(target, effectTypes, frame);
  const damage = multiplyDamage(remaining, multiplier || 1);
  for (const effectType of effectTypes) clearPeriodicEffect(target, effectType);
  if (toFiniteNumber(damage) > 0) {
    subtractDamage(target, damage);
    target.lastDamageAttribution = {
      kind: "detonation",
      effectType: "poison_bleed",
      owner: "player",
      mechanic: "sanguine_rupture",
      frame: currentFrame(frame),
      damage: toFiniteNumber(damage),
    };
    if (!isAlive(target)) target.periodicDeathPending = true;
  }
  return { damage, remaining, stacksConsumed };
}

export function applyArcaneShieldRecharge(player, maxShield, amount, overflowToHpRate = 0) {
  const capacity = Math.max(0, toFiniteNumber(maxShield));
  const requested = Math.max(0, toFiniteNumber(amount));
  if (!player || player.hp <= 0 || capacity <= 0 || requested <= 0) {
    return { requested, shieldGained: 0, hpHealed: 0, discarded: requested };
  }
  const beforeShield = Math.min(capacity, Math.max(0, toFiniteNumber(player.arcaneShield)));
  const shieldGained = Math.min(requested, capacity - beforeShield);
  player.arcaneShield = beforeShield + shieldGained;
  const overflow = requested - shieldGained;
  const missingHp = Math.max(0, player.maxHp - player.hp);
  const hpHealed = Math.min(
    missingHp,
    Math.max(0, Math.round(overflow * overflowToHpRate)),
  );
  player.hp += hpHealed;
  return {
    requested,
    shieldGained,
    hpHealed,
    discarded: overflow - (overflowToHpRate > 0 ? overflow : 0),
  };
}

export function resolveTomeProcSustain(player, pStats, playerStats = window.playerStats) {
  const events = [];
  if (!player || !playerStats) return events;
  recordProc("tomeSpellProcs");
  if (pStats?.hasTriadConvergence) recordProc("triadPackets", 3);
  const maxShield = Math.max(
    0,
    toFiniteNumber(pStats?.arcaneShieldMax || player.arcaneShieldMax || 0),
  );

  if (pStats?.hasArcaneSyphon && pStats.arcaneSyphonRate > 0) {
    const requested = Math.round(maxShield * pStats.arcaneSyphonRate);
    const result = applyArcaneShieldRecharge(player, maxShield, requested, 0.5);
    playerStats.syphonIntStacks = Math.min(
      3,
      (playerStats.syphonIntStacks || 0) + 1,
    );
    playerStats.syphonIntTimer = 360;
    events.push({ mechanic: "arcane_syphon", ...result });
    recordProc("arcaneSyphon");
  }

  if (pStats?.manaShieldingRate > 0) {
    const requested = Math.round(maxShield * pStats.manaShieldingRate);
    events.push({
      mechanic: "mana_shielding",
      ...applyArcaneShieldRecharge(player, maxShield, requested, 0),
    });
    recordProc("manaShielding");
  }

  if (typeof window.checkArtifactTrait === "function" && window.checkArtifactTrait("synergy_nexus")) {
    playerStats.nexusTomeShieldTimer = 180;
    events.push({ mechanic: "nexus", durationFrames: 180 });
    recordProc("nexus");
  }
  const metrics = ensureCombatEffectMetrics();
  if (metrics) {
    for (const event of events) {
      metrics.barrierRecharge += event.shieldGained || 0;
      metrics.hpSustain += event.hpHealed || 0;
    }
  }
  return events;
}

export function resolveOnHitArtifactEffects({
  target,
  damage,
  player,
  playerStats = window.playerStats,
  frame,
  random = Math.random,
}) {
  const result = {
    vampirismHeal: 0,
    echoProc: false,
    echoDamage: zeroDamage(),
  };
  if (!target || !player || !playerStats) return result;
  const resolvedFrame = currentFrame(frame);

  if (typeof window.checkArtifactTrait === "function" && window.checkArtifactTrait("vampirism")) {
    playerStats.recentHeals = (playerStats.recentHeals || []).filter((entry) => {
      return Number.isFinite(entry.frame) && resolvedFrame - entry.frame < 60;
    });
    const healedInWindow = playerStats.recentHeals.reduce(
      (sum, entry) => sum + entry.amt,
      0,
    );
    const vampirismScale = resolvedArtifactScale("vampirism");
    const allowedByCap = Math.max(
      0,
      player.maxHp * 0.03 * vampirismScale - healedInWindow,
    );
    const rawHeal = Math.max(
      0,
      Math.round(toFiniteNumber(damage) * 0.005 * vampirismScale),
    );
    const actualHeal = Math.min(
      Math.max(0, player.maxHp - player.hp),
      allowedByCap,
      rawHeal,
    );
    if (actualHeal > 0) {
      player.hp += actualHeal;
      playerStats.recentHeals.push({ frame: resolvedFrame, amt: actualHeal });
      result.vampirismHeal = actualHeal;
    }
  }

  if (
    typeof window.checkArtifactTrait === "function" &&
    window.checkArtifactTrait("echo_strike") &&
    random() < 0.3 * resolvedArtifactScale("echo_strike")
  ) {
    result.echoProc = true;
    result.echoDamage = multiplyDamage(toDamageValue(damage), 0.25);
    subtractDamage(target, result.echoDamage);
  }

  const metrics = ensureCombatEffectMetrics();
  if (metrics) {
    const procCounts = metrics.procCounts;
    if (result.echoProc) procCounts.echoStrike = (procCounts.echoStrike || 0) + 1;
    if (result.vampirismHeal > 0) {
      procCounts.vampirism = (procCounts.vampirism || 0) + 1;
    }
    metrics.hpSustain += result.vampirismHeal;
  }
  return result;
}
