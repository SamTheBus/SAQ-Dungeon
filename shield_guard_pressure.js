import { isPlayerTargetableMob } from "./combat_factions.js";
import {
  getCombatTargetCenter,
  hasCombatLineOfEffect,
} from "./combat_reach.js";

export const GUARD_PRESSURE_MAX = 3;
export const EARTH_BREAKER_BASH_RANGE = 60;
export const EARTH_BREAKER_CONE_HALF_ANGLE = 0.45;
export const EARTH_BREAKER_STUN_FRAMES = 90;

let shieldBashEventCounter = 0;
let lastShieldBashSnapshot = Object.freeze({
  eventId: null,
  source: null,
  applied: false,
  targetIds: Object.freeze([]),
  xpAwards: 0,
});

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function equipmentKey(subweapon = window.equippedSlots?.subweapon) {
  if (!subweapon) return "none";
  return String(
    subweapon.fingerprint ||
      subweapon.id ||
      `${subweapon.type || ""}:${subweapon.name || subweapon.noun || ""}`,
  );
}

function floorKey(player = window.player) {
  return String(player?.depth ?? window.currentFloor ?? "none");
}

function getState({
  playerStats = window.playerStats,
  subweapon = window.equippedSlots?.subweapon,
  player = window.player,
} = {}) {
  if (!playerStats) return null;
  const nextEquipmentKey = equipmentKey(subweapon);
  const nextFloorKey = floorKey(player);
  const current = playerStats.guardPressureState;
  if (
    !current ||
    current.equipmentKey !== nextEquipmentKey ||
    current.floorKey !== nextFloorKey
  ) {
    playerStats.guardPressureState = {
      value: 0,
      equipmentKey: nextEquipmentKey,
      floorKey: nextFloorKey,
    };
  }
  return playerStats.guardPressureState;
}

function isShieldProfile(resolvedStats, subweapon) {
  return (
    resolvedStats?.subType === "shield" ||
    subweapon?.subType === "shield" ||
    subweapon?.type === "shield"
  );
}

function readonlyPressureSnapshot(state, applied, reason) {
  return Object.freeze({
    applied,
    reason,
    pressure: Math.max(0, Math.min(GUARD_PRESSURE_MAX, state?.value || 0)),
    maxPressure: GUARD_PRESSURE_MAX,
  });
}

export function getGuardPressureSnapshot(options = {}) {
  const playerStats = options.playerStats ?? window.playerStats;
  const subweapon = options.subweapon ?? window.equippedSlots?.subweapon;
  const player = options.player ?? window.player;
  const current = playerStats?.guardPressureState;
  const state =
    current &&
    current.equipmentKey === equipmentKey(subweapon) &&
    current.floorKey === floorKey(player)
      ? current
      : null;
  return readonlyPressureSnapshot(state, false, "read_only");
}

export function resetGuardPressure(options = {}) {
  const state = getState(options);
  if (state) state.value = 0;
  return readonlyPressureSnapshot(state, true, options.reason || "explicit_reset");
}

export function fillGuardPressureFromBlock({
  playerStats = window.playerStats,
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
  player = window.player,
} = {}) {
  const state = getState({ playerStats, subweapon, player });
  if (!state || !isShieldProfile(resolvedStats, subweapon)) {
    if (state) state.value = 0;
    return readonlyPressureSnapshot(state, false, "not_shield_equipped");
  }
  state.value = GUARD_PRESSURE_MAX;
  return readonlyPressureSnapshot(state, true, "successful_block");
}

function bigNumber(value) {
  return BigNum.from(value ?? 0);
}

export function calculateCanonicalShieldBashDamage(resolvedStats = {}) {
  const defensePacket = bigNumber(resolvedStats.def || 5).mul(
    finiteNumber(resolvedStats.reflectDamage, 1),
  );
  const attackPacket = bigNumber(resolvedStats.atk || 15).mul(
    finiteNumber(resolvedStats.bashAtkBonus, 0),
  );
  const masteryMultiplier = Math.max(
    0,
    finiteNumber(resolvedStats.shieldBashMultiplier, 1),
  );
  const masteryDefensePacket = bigNumber(resolvedStats.def || 5).mul(
    Math.max(0, finiteNumber(resolvedStats.shieldDefScalingCounter, 0)),
  );
  return defensePacket
    .add(attackPacket)
    .mul(masteryMultiplier)
    .add(masteryDefensePacket);
}

function targetId(target, fallbackIndex) {
  return String(target?.id ?? `anonymous-${fallbackIndex}`);
}

function uniqueTargets(originTarget, targets) {
  const result = [];
  const seenObjects = new Set();
  for (const target of [originTarget, ...(targets || []), window.mob]) {
    if (!target || seenObjects.has(target)) continue;
    seenObjects.add(target);
    result.push(target);
  }
  return result;
}

function targetIsBoss(target) {
  return Boolean(
      target?.isBoss ||
      target?.isMiniboss ||
      target?.type === "dungeon_boss" ||
      target?.type === "dungeon_miniboss" ||
      target?.type === "boss" ||
      target?.type === "marcus_boss" ||
      target?.isPortalGuardian,
  );
}

function inEarthBreakerCone({ player, target, attackAngle, range, halfAngle }) {
  const center = getCombatTargetCenter(target);
  if (!center) return false;
  const dx = center.x - finiteNumber(player?.x);
  const dy = center.y - finiteNumber(player?.y);
  if (Math.hypot(dx, dy) > range) return false;
  const targetAngle = Math.atan2(dy, dx);
  const difference = Math.abs(
    Math.atan2(
      Math.sin(targetAngle - attackAngle),
      Math.cos(targetAngle - attackAngle),
    ),
  );
  return difference <= halfAngle;
}

function hasBashLineOfEffect(player, target, map, collisionCheck) {
  return hasCombatLineOfEffect(
    {
      x: finiteNumber(player?.x) - 1,
      y: finiteNumber(player?.y) - 1,
      w: 2,
      h: 2,
      radius: finiteNumber(player?.radius, 9),
    },
    target,
    map,
    collisionCheck,
  );
}

function applyBashImpactState({ player, target }) {
  const center = getCombatTargetCenter(target);
  if (!center) return;
  target.flashTimer = 8;
  const dx = center.x - finiteNumber(player?.x);
  const dy = center.y - finiteNumber(player?.y);
  const distance = Math.hypot(dx, dy);
  if (distance > 0) {
    target.recoilX = (dx / distance) * 12;
    target.recoilY = (dy / distance) * 12;
  }
}

function presentBash({ target, damage, earthBreaker }) {
  const center = getCombatTargetCenter(target);
  if (!center) return;
  window.combatVisuals?.spawnDamageEffect?.(
    center.x,
    center.y,
    damage,
    earthBreaker ? "shield_bash" : "counter",
    false,
    target,
  );
  window.spawnMeleeFeelImpact?.(
    center.x,
    center.y,
    "shield",
    false,
    null,
    false,
    "bash",
  );
}

export function resolveCanonicalShieldBash({
  source = "reactive_block",
  player = window.player,
  resolvedStats = window.resolvePlayerStats?.() || {},
  subweapon = window.equippedSlots?.subweapon,
  originTarget,
  targets = window.activeDungeonMobs || [],
  map = window.activeDungeonMap,
  collisionCheck = window.checkCollisionAt,
  random = Math.random,
  present = true,
  awardXp = true,
} = {}) {
  const eventId = `shield-bash-${++shieldBashEventCounter}`;
  const originCenter = getCombatTargetCenter(originTarget);
  if (
    !player ||
    !originCenter ||
    !isShieldProfile(resolvedStats, subweapon)
  ) {
    lastShieldBashSnapshot = Object.freeze({
      eventId,
      source,
      applied: false,
      reason: "ineligible_source",
      targetIds: Object.freeze([]),
      xpAwards: 0,
    });
    return lastShieldBashSnapshot;
  }

  const damage = calculateCanonicalShieldBashDamage(resolvedStats);
  const earthBreakerRank = Math.max(
    0,
    Math.floor(finiteNumber(resolvedStats.earthBreakerBashRank, 0)),
  );
  const earthBreaker = earthBreakerRank > 0;
  const areaMultiplier = Math.max(
    0.1,
    finiteNumber(resolvedStats.areaRadiusMult, 1),
  );
  const attackAngle = Math.atan2(
    originCenter.y - finiteNumber(player.y),
    originCenter.x - finiteNumber(player.x),
  );
  const range = EARTH_BREAKER_BASH_RANGE * areaMultiplier;
  const halfAngle = EARTH_BREAKER_CONE_HALF_ANGLE * areaMultiplier;
  const hitTargets = [];
  const hitIds = new Set();

  for (const [index, target] of uniqueTargets(originTarget, targets).entries()) {
    if (!isPlayerTargetableMob(target)) continue;
    if (!earthBreaker && target !== originTarget) continue;
    if (
      earthBreaker &&
      !inEarthBreakerCone({ player, target, attackAngle, range, halfAngle })
    ) {
      continue;
    }
    if (!hasBashLineOfEffect(player, target, map, collisionCheck)) continue;
    const id = targetId(target, index);
    if (hitIds.has(id)) continue;
    hitIds.add(id);

    target.hp = target.hp.sub(damage);
    target.hasTakenDamage = true;
    target.lastDamageSource = "player_shield_bash";
    if (
      earthBreaker &&
      !targetIsBoss(target) &&
      random() < Math.max(0, finiteNumber(resolvedStats.earthBreakerStunChance, 0))
    ) {
      target.speedMultiplier = 0;
      target.stunTimer = EARTH_BREAKER_STUN_FRAMES;
    }
    hitTargets.push(target);
    applyBashImpactState({ player, target });
    if (present) {
      presentBash({
        target,
        damage,
        earthBreaker,
      });
    }
  }

  let xpAwards = 0;
  if (hitTargets.length > 0 && awardXp && window.gainSubweaponXp) {
    window.gainSubweaponXp("shield", 10);
    xpAwards = 1;
  }
  if (present && earthBreaker && hitTargets.length > 0) {
    window.spawnEarthBreakerBashVisual?.(
      finiteNumber(player.x),
      finiteNumber(player.y),
      attackAngle,
    );
  }

  lastShieldBashSnapshot = Object.freeze({
    eventId,
    source,
    applied: hitTargets.length > 0,
    reason: hitTargets.length > 0 ? "resolved" : "no_eligible_target",
    earthBreaker,
    damage: finiteNumber(damage, String(damage)),
    targetIds: Object.freeze(
      hitTargets.map((target, index) => targetId(target, index)),
    ),
    xpAwards,
  });
  return lastShieldBashSnapshot;
}

export function resolveSuccessfulShieldMainAttack({
  playerStats = window.playerStats,
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
  player = window.player,
  target,
  ...bashOptions
} = {}) {
  const state = getState({ playerStats, subweapon, player });
  if (!state || !isShieldProfile(resolvedStats, subweapon)) {
    if (state) state.value = 0;
    return Object.freeze({
      ...readonlyPressureSnapshot(state, false, "not_shield_equipped"),
      bash: null,
    });
  }

  if (state.value >= GUARD_PRESSURE_MAX) {
    state.value = 0;
    const bash = resolveCanonicalShieldBash({
      source: "guard_pressure",
      player,
      resolvedStats,
      subweapon,
      originTarget: target,
      ...bashOptions,
    });
    window.spawnGuardPressureVisual?.(
      finiteNumber(player?.x),
      finiteNumber(player?.y),
      0,
      GUARD_PRESSURE_MAX,
    );
    return Object.freeze({
      ...readonlyPressureSnapshot(state, true, "full_pressure_consumed"),
      bash,
    });
  }

  state.value = Math.min(GUARD_PRESSURE_MAX, state.value + 1);
  window.spawnGuardPressureVisual?.(
    finiteNumber(player?.x),
    finiteNumber(player?.y),
    state.value,
    GUARD_PRESSURE_MAX,
  );
  return Object.freeze({
    ...readonlyPressureSnapshot(state, true, "successful_main_attack"),
    bash: null,
  });
}

export function getLastShieldBashSnapshot() {
  return lastShieldBashSnapshot;
}
