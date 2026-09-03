import { awardSpellProcMasteryXp } from "./mastery_authority.js";
import { resolveTomeProcSustain } from "./combat_effect_authority.js";
import {
  PRODUCTION_FIRE_TOME_BURN_PROFILE,
  PRODUCTION_FROST_CONTROL_PROFILE,
  isEligiblePlayerElementTarget,
  presentTomeElementSecondaryResult,
  resolveTomeElementSecondaryEffect,
} from "./element_effect_authority.js";

export const TOME_ELEMENT_ORDER = Object.freeze([
  "fire",
  "lightning",
  "frost",
]);

const ELEMENT_LABELS = Object.freeze({
  fire: "Fire",
  lightning: "Lightning",
  frost: "Frost",
});

const SPELL_TYPE_ELEMENTS = Object.freeze({
  fire: Object.freeze(["fire"]),
  lightning: Object.freeze(["lightning"]),
  frost: Object.freeze(["frost"]),
  dual_fire_lightning: Object.freeze(["fire", "lightning"]),
  dual_fire_frost: Object.freeze(["fire", "frost"]),
  dual_lightning_frost: Object.freeze(["lightning", "frost"]),
  tri: TOME_ELEMENT_ORDER,
});

const DEFAULT_TOME_SPELL_TYPE = "tri";
const SPELL_WEAVING_STACK_CAP = 4;
export const SPELL_WEAVING_DURATION_FRAMES = 240;

let rotationState = {
  signature: null,
  spellType: DEFAULT_TOME_SPELL_TYPE,
  elements: TOME_ELEMENT_ORDER,
  cursor: 0,
  lastResetReason: "initial",
  resetCount: 0,
};
let sourceEventCounter = 0;
let lastProcSnapshot = Object.freeze({
  sourceEventId: 0,
  anchor: null,
  packetElements: Object.freeze([]),
  sourceEventCounts: Object.freeze({
    rotationSelections: 0,
    rotationAdvancements: 0,
    weavingEvaluations: 0,
    syphonEvents: 0,
    manaShieldingEvents: 0,
    nexusEvents: 0,
    masteryEvents: 0,
  }),
});

function normalizedSpellType(source) {
  const raw =
    typeof source === "string"
      ? source
      : source?.spellType || source?.persistedSpellType;
  return Object.hasOwn(SPELL_TYPE_ELEMENTS, raw)
    ? raw
    : DEFAULT_TOME_SPELL_TYPE;
}

function normalizePersistedElementArray(source) {
  if (!Array.isArray(source?.spellElements)) return null;
  const elements = source.spellElements
    .map((element) => String(element || "").toLowerCase())
    .filter((element) => TOME_ELEMENT_ORDER.includes(element));
  if (elements.length < 1 || elements.length > 3) return null;
  if (new Set(elements).size !== elements.length) return null;
  return elements;
}

function identityFor(source) {
  const explicitSpellType =
    typeof source === "string"
      ? source
      : source?.spellType || source?.persistedSpellType;
  const authoredSpellType = normalizedSpellType(source);
  const persistedElements =
    explicitSpellType === "tri"
      ? TOME_ELEMENT_ORDER
      : normalizePersistedElementArray(source);
  const spellType = persistedElements
    ? String(source?.spellType || "persisted_list")
    : authoredSpellType;
  const elements = Object.freeze(
    persistedElements || [...SPELL_TYPE_ELEMENTS[spellType]],
  );
  const itemId = source?.id ?? source?.itemId ?? "unidentified-tome";
  return Object.freeze({
    itemId,
    spellType,
    elements,
    signature: `${String(itemId)}|${spellType}|${elements.join(",")}`,
  });
}

function frozenSnapshot(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => frozenSnapshot(entry)));
  }
  if (value && typeof value === "object") {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [
          key,
          frozenSnapshot(entry),
        ]),
      ),
    );
  }
  return value;
}

function mutablePlayerStats(playerStats) {
  return playerStats || window.playerStats || null;
}

function currentIdentitySource(source, resolvedStats) {
  return (
    source ||
    window.equippedSlots?.subweapon ||
    resolvedStats ||
    DEFAULT_TOME_SPELL_TYPE
  );
}

function synchronizeRotation(source) {
  const identity = identityFor(source);
  if (rotationState.signature !== identity.signature) {
    resetTomeRotation({ tome: source, reason: "identity-change" });
  }
  return identity;
}

export function resolvePersistedTomeElementList(source) {
  return Object.freeze([...identityFor(source).elements]);
}

export function formatTomeElementSequence(source) {
  const labels = resolvePersistedTomeElementList(source).map(
    (element) => ELEMENT_LABELS[element],
  );
  return `${labels.join(" → ")} → repeat`;
}

export function getTomeIdentityPresentation(source) {
  const identity = identityFor(source);
  const labels = identity.elements.map((element) => ELEMENT_LABELS[element]);
  const kind =
    labels.length === 1 ? "Single" : labels.length === 2 ? "Dual" : "Tri";
  return frozenSnapshot({
    kind,
    spellType: identity.spellType,
    elements: [...identity.elements],
    sequence: `${labels.join(" → ")} → repeat`,
    title: `${kind} ${labels.join(" + ")} Attunement`,
  });
}

export function resetTomeRotation({
  tome = window.equippedSlots?.subweapon,
  reason = "manual",
} = {}) {
  const identity = identityFor(tome || DEFAULT_TOME_SPELL_TYPE);
  rotationState = {
    signature: identity.signature,
    spellType: identity.spellType,
    elements: identity.elements,
    cursor: 0,
    lastResetReason: reason,
    resetCount: rotationState.resetCount + 1,
  };
  return getTomeRotationSnapshot({ tome });
}

export function getTomeRotationSnapshot({
  tome = window.equippedSlots?.subweapon,
  playerStats = window.playerStats,
} = {}) {
  const identity = identityFor(tome || DEFAULT_TOME_SPELL_TYPE);
  const isActiveIdentity = rotationState.signature === identity.signature;
  const cursor = isActiveIdentity
    ? rotationState.cursor % identity.elements.length
    : 0;
  const stats = mutablePlayerStats(playerStats) || {};
  return frozenSnapshot({
    spellType: identity.spellType,
    elements: [...identity.elements],
    cursor,
    currentElement: identity.elements[cursor],
    nextElement: identity.elements[cursor],
    previousSuccessfulAnchor: stats.lastSpellCastType || null,
    spellWeavingStacks: Math.max(
      0,
      Math.min(SPELL_WEAVING_STACK_CAP, Number(stats.spellWeavingStacks || 0)),
    ),
    spellWeavingTimer: Math.max(0, Number(stats.spellWeavingTimer || 0)),
    lastResetReason: isActiveIdentity
      ? rotationState.lastResetReason
      : "unsynchronized-identity",
    resetCount: rotationState.resetCount,
  });
}

export function commitSuccessfulTomeProcAnchor({
  tome,
  resolvedStats,
  playerStats = window.playerStats,
} = {}) {
  const identitySource = currentIdentitySource(tome, resolvedStats);
  const identity = synchronizeRotation(identitySource);
  const cursorBefore = rotationState.cursor % identity.elements.length;
  const anchor = identity.elements[cursorBefore];
  const stats = mutablePlayerStats(playerStats);
  const previousAnchor = stats?.lastSpellCastType || null;
  const weavingEnabled = resolvedStats?.hasSpellWeaving === true;
  const changedAnchor = Boolean(previousAnchor && previousAnchor !== anchor);
  const stacksBefore = Math.max(
    0,
    Math.min(
      SPELL_WEAVING_STACK_CAP,
      Number(stats?.spellWeavingStacks || 0),
    ),
  );
  let stacksAfter = stacksBefore;

  if (stats && weavingEnabled) {
    if (changedAnchor) {
      stacksAfter = Math.min(SPELL_WEAVING_STACK_CAP, stacksBefore + 1);
      stats.spellWeavingStacks = stacksAfter;
      stats.spellWeavingTimer = SPELL_WEAVING_DURATION_FRAMES;
    }
    stats.lastSpellCastType = anchor;
  }

  rotationState.cursor = (cursorBefore + 1) % identity.elements.length;
  return frozenSnapshot({
    anchor,
    previousAnchor,
    changedAnchor: weavingEnabled && changedAnchor,
    weavingEvaluated: weavingEnabled,
    stacksBefore,
    stacksAfter,
    stackAdded: stacksAfter - stacksBefore,
    timerFrames: Number(stats?.spellWeavingTimer || 0),
    cursorBefore,
    cursorAfter: rotationState.cursor,
    nextElement: identity.elements[rotationState.cursor],
  });
}

export function advanceSpellWeavingTimer(
  playerStats = window.playerStats,
) {
  const stats = mutablePlayerStats(playerStats);
  if (!stats) {
    return frozenSnapshot({ timerFrames: 0, stacks: 0, expired: false });
  }
  const before = Math.max(0, Number(stats.spellWeavingTimer || 0));
  if (before > 0) {
    stats.spellWeavingTimer = before - 1;
    if (stats.spellWeavingTimer === 0) {
      stats.spellWeavingStacks = 0;
    }
  }
  return frozenSnapshot({
    timerFrames: Math.max(0, Number(stats.spellWeavingTimer || 0)),
    stacks: Math.max(0, Number(stats.spellWeavingStacks || 0)),
    expired: before > 0 && Number(stats.spellWeavingTimer || 0) === 0,
  });
}

function toFiniteDamage(value) {
  if (value && typeof value.toFiniteNumber === "function") {
    return value.toFiniteNumber(Number.MAX_VALUE / 16);
  }
  if (value && typeof value.toNumber === "function") return value.toNumber();
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function subtractPrimaryDamage(target, damage) {
  if (!target?.hp) return false;
  if (typeof target.hp.sub === "function") target.hp = target.hp.sub(damage);
  else target.hp -= toFiniteDamage(damage);
  return true;
}

function spellDamageFrom(resolvedStats) {
  return BigNum.from(resolvedStats?.atk || 15).mul(
    resolvedStats?.spellPower || 1.5,
  );
}

function countSustainEvents(events, mechanic) {
  return (events || []).filter((event) => event.mechanic === mechanic).length;
}

export function resolveCanonicalTomeSpellProcEvent({
  player,
  resolvedStats,
  playerStats = window.playerStats,
  tome = window.equippedSlots?.subweapon,
  originTarget,
  targets = window.activeDungeonMobs,
  map = window.activeDungeonMap,
  collisionCheck = window.checkCollisionAt,
  frame = window.logicClock,
  progressMission = false,
  present = true,
  spellDamage,
  awardMastery = awardSpellProcMasteryXp,
  resolveSustain = resolveTomeProcSustain,
  resolveSecondary = resolveTomeElementSecondaryEffect,
} = {}) {
  if (!isEligiblePlayerElementTarget(originTarget)) {
    return frozenSnapshot({ committed: false, reason: "illegal-hostile-impact" });
  }

  const anchorEvent = commitSuccessfulTomeProcAnchor({
    tome,
    resolvedStats,
    playerStats,
  });
  const packetElements = resolvedStats?.hasTriadConvergence
    ? TOME_ELEMENT_ORDER
    : Object.freeze([anchorEvent.anchor]);
  const damage = spellDamage || spellDamageFrom(resolvedStats);

  awardMastery(resolvedStats);
  if (progressMission && typeof window.progressMission === "function") {
    window.progressMission("spells", 1);
  }
  const sustainEvents = resolveSustain(player, resolvedStats, playerStats);
  const packetResults = [];
  for (const element of packetElements) {
    subtractPrimaryDamage(originTarget, damage);
    packetResults.push(
      resolveSecondary({
        element,
        originTarget,
        spellDamage: damage,
        player,
        playerStats: resolvedStats,
        targets,
        map,
        collisionCheck,
        frame,
        fireProfile:
          resolvedStats?.fireTomeBurnProfile ??
          PRODUCTION_FIRE_TOME_BURN_PROFILE,
        frostProfile:
          resolvedStats?.frostControlProfile ??
          PRODUCTION_FROST_CONTROL_PROFILE,
        present: false,
      }),
    );
  }
  originTarget.flashTimer = 8;

  sourceEventCounter++;
  const sourceEventCounts = {
    rotationSelections: 1,
    rotationAdvancements: 1,
    weavingEvaluations: 1,
    syphonEvents: countSustainEvents(sustainEvents, "arcane_syphon"),
    manaShieldingEvents: countSustainEvents(sustainEvents, "mana_shielding"),
    nexusEvents: countSustainEvents(sustainEvents, "nexus"),
    masteryEvents: 1,
  };
  const summary = frozenSnapshot({
    committed: true,
    sourceEventId: sourceEventCounter,
    anchor: anchorEvent.anchor,
    packetElements: [...packetElements],
    packetCount: packetElements.length,
    anchorEvent,
    sourceEventCounts,
    originTargetId: originTarget.id ?? null,
    damagePerPacket: toFiniteDamage(damage),
  });
  lastProcSnapshot = summary;

  const result = {
    summary,
    damage,
    packetResults,
    sustainEvents,
    player,
    resolvedStats,
    originTarget,
  };
  if (present) presentCanonicalTomeSpellProcEvent(result);
  return result;
}

export function presentCanonicalTomeSpellProcEvent(result) {
  if (!result?.summary?.committed) return false;
  const {
    summary,
    damage,
    packetResults,
    sustainEvents,
    player,
    resolvedStats,
    originTarget,
  } = result;
  const centerX = originTarget.x + (originTarget.w || 24) / 2;
  const centerY = originTarget.y + (originTarget.h || 24) / 2;

  summary.packetElements.forEach((element, index) => {
    const secondaryResult = packetResults[index];
    window.castVisualSpell?.(
      element,
      player,
      originTarget,
      resolvedStats,
      resolvedStats?.hasTriadConvergence || resolvedStats?.hasElementalOverload,
    );
    window.RenderEngine?.spawnDamageEffect?.(
      centerX + (summary.packetCount > 1 ? (index - 1) * 12 : 0),
      centerY - 12 - (summary.packetCount > 1 ? index * 6 : 0),
      damage,
      element,
      false,
    );
    const frostTransition =
      element === "frost"
        ? secondaryResult?.primaryResult?.transition || "chill"
        : "spell";
    window.spawnTomeImpactVisual?.(
      centerX + (summary.packetCount > 1 ? (index - 1) * 12 : 0),
      centerY,
      element,
      {
        phase: frostTransition,
        chainCount: secondaryResult?.hopHits?.length || 0,
        playAudio: summary.packetCount === 1 || index === 0,
      },
    );
    presentTomeElementSecondaryResult(secondaryResult);
  });

  if (summary.anchorEvent.stackAdded > 0) {
    window.spawnFloatingText?.(
      player.x,
      player.y - 22,
      `SPELL WEAVING (${summary.anchorEvent.stacksAfter}/${SPELL_WEAVING_STACK_CAP})`,
      "#38bdf8",
      true,
    );
  }
  sustainEvents.forEach((event, index) => {
    if (event.mechanic === "nexus") return;
    const label =
      event.mechanic === "arcane_syphon" ? "SYPHON" : "MANA SHIELD";
    const parts = [];
    if (event.shieldGained > 0) parts.push(`+${event.shieldGained} SHIELD`);
    if (event.hpHealed > 0) parts.push(`+${event.hpHealed} HP`);
    if (parts.length > 0) {
      window.spawnFloatingText?.(
        player.x,
        player.y - 12 - index * 5,
        `${parts.join(" / ")} (${label})`,
        "#00ffff",
        true,
      );
    }
  });
  return true;
}

export function getLastTomeProcSnapshot() {
  return lastProcSnapshot;
}
