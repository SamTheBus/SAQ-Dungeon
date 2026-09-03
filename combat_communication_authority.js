import { isPlayerTargetableMob } from "./combat_factions.js";
import {
  SHIELD_DAGGER_CLEAR_HULL_GAP,
  TOME_CLEAR_HULL_GAP,
  getClearHullGap,
  getCombatTargetCenter,
  getPlayerClearHullReach,
  hasTomeLineOfSight,
  isTomeCombatProfile,
} from "./combat_reach.js";
import { getPeriodicEffect } from "./combat_effect_authority.js";
import {
  PRODUCTION_FIRE_TOME_BURN_PROFILE,
  PRODUCTION_FROST_CONTROL_PROFILE,
  getLastLightningChainSnapshot,
} from "./element_effect_authority.js";
import {
  getLastTomeProcSnapshot,
  getTomeIdentityPresentation,
  getTomeRotationSnapshot,
} from "./tome_rotation_authority.js";
import { getGuardPressureSnapshot } from "./shield_guard_pressure.js";
import {
  getDaggerSubtypeContract,
  isDaggerCombatProfile,
} from "./dagger_identity_contract.js";

export const FUTURE_IDLE_ATTACK_SPEED_COMMUNICATION =
  "Future Idle Expedition only — no current active-dungeon effect";

export const INACTIVE_COEFFICIENT_COMMUNICATION = Object.freeze({
  fire:
    "Burn: 15% captured resolved ATK every 1 second for 4 seconds. One state; reapplication refreshes duration without resetting tick phase.",
  frost:
    "Chill: 10% movement slow per stack, up to 4 stacks for 4 seconds. The cap Freezes ordinary targets for 1 second and elites for 0.5 seconds; bosses/minibosses instead enter a 1.5-second capped slow and restore 6% Max Arcane Barrier. Strongest slow wins with Elemental Overload.",
  Biohazard:
    "Active at 3 pieces: one 20% Corrosive Spores roll per eligible attack action; 20% captured ATK per shared Poison stack/tick; heal 5% of actual Poison tick damage within a shared 1.5% Max-HP-per-second cap.",
  Warlord:
    "Active at 3 pieces: one 25% Shattering Blows roll per eligible critical action for a same-target 50% resolved-ATK physical packet. It bypasses guard, cannot Crit, and cannot recurse.",
});

function freeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === "object") {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = key === "ref" ? value[key] : freeze(value[key]);
    }
    return Object.freeze(copy);
  }
  return value;
}

function uniqueTargets(targets, boss) {
  const result = [];
  const seen = new Set();
  for (const target of [...(targets || []), boss]) {
    if (!isPlayerTargetableMob(target) || seen.has(target)) continue;
    seen.add(target);
    result.push(target);
  }
  return result;
}

function targetLabel(target) {
  return String(
    target?.displayName ||
      target?.name ||
      target?.bossName ||
      target?.visualType ||
      target?.type ||
      "Hostile",
  );
}

export function resolveCombatCommunicationProfile({
  playerStats,
  subweapon = window.equippedSlots?.subweapon,
} = {}) {
  if (!subweapon) return "none";
  if (isTomeCombatProfile(playerStats, subweapon)) return "tome";
  if (isDaggerCombatProfile(playerStats, subweapon)) return "dagger";
  if (
    playerStats?.subType === "shield" ||
    subweapon?.subType === "shield" ||
    subweapon?.type === "shield"
  ) {
    return "shield";
  }
  return "none";
}

export function getPlayerTargetCommunicationSnapshot({
  player = window.player,
  playerStats,
  subweapon = window.equippedSlots?.subweapon,
  map = window.activeDungeonMap,
  collisionCheck = window.checkCollisionAt,
  targets = window.activeDungeonMobs,
  boss = window.mob,
} = {}) {
  if (!player) return freeze({ status: "no-player", target: null });
  const resolvedStats =
    playerStats ||
    (typeof window.resolvePlayerStats === "function"
      ? window.resolvePlayerStats()
      : window.playerStats || {});
  const profile = resolveCombatCommunicationProfile({
    playerStats: resolvedStats,
    subweapon,
  });
  if (profile === "none") {
    return freeze({
      profile: "none",
      reach: null,
      reachText: "No applicable subweapon equipped",
      status: "not-applicable",
      target: null,
    });
  }
  const tome = profile === "tome";
  const candidates = uniqueTargets(targets, boss)
    .map((target) => ({ target, gap: getClearHullGap(player, target) }))
    .sort((left, right) => left.gap - right.gap);
  const nearest = candidates[0];
  const reach = getPlayerClearHullReach(resolvedStats, subweapon);
  if (!nearest) {
    return freeze({
      profile,
      reach,
      reachText: tome
        ? `${TOME_CLEAR_HULL_GAP}px / 4 tiles clear hull gap`
        : `${SHIELD_DAGGER_CLEAR_HULL_GAP}px clear hull gap`,
      status: "no-target",
      target: null,
    });
  }
  const inRange = nearest.gap <= reach;
  const hasLineOfSight =
    !tome ||
    !inRange ||
    hasTomeLineOfSight(player, nearest.target, map, collisionCheck);
  const status = !inRange
    ? "out-of-range"
    : hasLineOfSight
      ? "valid-target"
      : "los-blocked";
  const center = getCombatTargetCenter(nearest.target);
  return freeze({
    profile,
    reach,
    reachText: tome
      ? `${TOME_CLEAR_HULL_GAP}px / 4 tiles clear hull gap`
      : `${SHIELD_DAGGER_CLEAR_HULL_GAP}px clear hull gap`,
    status,
    inRange,
    hasLineOfSight,
    gap: Number(nearest.gap.toFixed(2)),
    target: {
      id: nearest.target.id ?? null,
      label: targetLabel(nearest.target),
      x: center?.x ?? 0,
      y: center?.y ?? 0,
      ref: nearest.target,
    },
  });
}

export function getTargetPeriodicCommunicationSnapshot(
  target,
  frame = window.logicClock || 0,
) {
  const summarize = (type) => {
    const effect = getPeriodicEffect(target, type);
    const remainingFrames = effect
      ? Math.max(0, Number(effect.expiresAt || 0) - Number(frame || 0))
      : 0;
    return {
      type,
      active: Boolean(effect?.stacks > 0 && remainingFrames > 0),
      stacks: Math.max(0, Number(effect?.stacks || 0)),
      maxStacks: Math.max(0, Number(effect?.maxStacks || 5)),
      remainingFrames,
      remainingSeconds: Number((remainingFrames / 60).toFixed(1)),
      source: effect?.mechanic || null,
    };
  };
  return freeze({ poison: summarize("poison"), bleed: summarize("bleed") });
}

export function getTomeCommunicationSnapshot({
  tome = window.equippedSlots?.subweapon,
  playerStats = window.playerStats,
} = {}) {
  const identity = getTomeIdentityPresentation(tome);
  const rotation = getTomeRotationSnapshot({ tome, playerStats });
  const lastProc = getLastTomeProcSnapshot();
  const lightning = getLastLightningChainSnapshot();
  return freeze({
    identity,
    rotation,
    lastProc,
    lightning,
    fire: {
      active: Boolean(PRODUCTION_FIRE_TOME_BURN_PROFILE),
      message: INACTIVE_COEFFICIENT_COMMUNICATION.fire,
    },
    frost: {
      active: Boolean(PRODUCTION_FROST_CONTROL_PROFILE),
      message: INACTIVE_COEFFICIENT_COMMUNICATION.frost,
    },
    triad:
      lastProc?.committed && lastProc.packetCount === 3
        ? `One proc → ${lastProc.packetElements.join(" + ")} (3 packets total)`
        : "Triad Convergence: one proc → Fire + Lightning + Frost (3 packets total)",
  });
}

export function getGuardPressureCommunicationSnapshot(options = {}) {
  const pressure = getGuardPressureSnapshot(options);
  return freeze({
    ...pressure,
    pips: Array.from({ length: pressure.maxPressure }, (_, index) =>
      index < pressure.pressure ? "filled" : "empty",
    ),
    ready: pressure.pressure >= pressure.maxPressure,
    reactiveRule: "Successful Block immediately triggers a reactive Shield Bash and fills Guard Pressure.",
    proactiveRule:
      "Successful Shield main hits build Guard Pressure; the next successful main hit while full consumes it for one proactive Shield Bash.",
  });
}

export function getDaggerCommunicationSnapshot({ resolvedStats, subweapon } = {}) {
  const contract = getDaggerSubtypeContract({ resolvedStats, subweapon });
  return freeze({
    ...contract,
    poisonRule:
      contract.id === "flurry"
        ? "Poison delivery is legal through successful Flurry offhand strikes when Viper's Coating is active."
        : "No proactive Viper's Coating Poison delivery for this subtype.",
    bleedRule:
      contract.id === "main_gauche"
        ? "No proactive main-hit Bleed; this subtype is reactive Parry/Riposte only."
        : "Main-hit Bleed is legal and supplies Poison/Bleed state consumers such as Sanguine Rupture.",
  });
}

export function renderCombatReachCommunication(ctx, snapshot) {
  if (window.playerStats?.combatRangeGuides !== true) return false;
  if (!ctx || !snapshot?.target || snapshot.status === "no-target") return false;
  const player = window.player;
  if (!player) return false;
  const colors = {
    "valid-target": "#4ade80",
    "out-of-range": "#f59e0b",
    "los-blocked": "#ef4444",
  };
  const color = colors[snapshot.status] || "#94a3b8";
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(snapshot.status === "valid-target" ? [] : [5, 4]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, snapshot.reach + Number(player.radius || 9), 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(snapshot.target.x, snapshot.target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(snapshot.target.x, snapshot.target.y, 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#05030a";
  ctx.lineWidth = 3;
  const label = snapshot.status.replaceAll("-", " ").toUpperCase();
  ctx.strokeText(label, snapshot.target.x, snapshot.target.y - 18);
  ctx.fillText(label, snapshot.target.x, snapshot.target.y - 18);
  ctx.restore();
  return true;
}
