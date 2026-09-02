let lastDelivery = Object.freeze({
  event: "idle",
  frame: 0,
  intendedTargetId: null,
  actualTargetId: null,
  message: "No Tome bolt launched.",
});

const MESSAGES = Object.freeze({
  launched: "Neutral Tome bolt launched; damage and spell effects wait for hostile impact.",
  impact: "Tome bolt reached its intended hostile; impact resolved.",
  intercepted: "A legal hostile intercepted the Tome bolt and became the impact target.",
  "blocked-wall": "Tome bolt hit a wall; no damage, proc, sustain, or Mastery XP.",
  "blocked-void": "Tome bolt entered void geometry; no damage, proc, sustain, or Mastery XP.",
  "blocked-geometry": "Tome bolt hit blocking geometry; no damage, proc, sustain, or Mastery XP.",
  "expired-range": "Tome bolt reached its travel limit; no impact event occurred.",
  expired: "Tome bolt expired; no impact event occurred.",
});

export function recordTomeDeliveryCommunication(
  event,
  { projectile, actualTarget = null, frame = window.logicClock || 0 } = {},
) {
  lastDelivery = Object.freeze({
    event,
    frame: Number(frame || 0),
    intendedTargetId: projectile?.intendedTargetId ?? null,
    actualTargetId: actualTarget?.id ?? null,
    message: MESSAGES[event] || String(event || "Tome delivery update"),
  });
  return lastDelivery;
}

export function getTomeDeliveryCommunicationSnapshot() {
  return lastDelivery;
}

export function classifyTomeProjectileBlock(map, x, y) {
  if (!map?.grid || !Number.isFinite(Number(map.tileSize))) return "blocked-geometry";
  const tileSize = Number(map.tileSize);
  const tileX = Math.floor(Number(x || 0) / tileSize);
  const tileY = Math.floor(Number(y || 0) / tileSize);
  const tile = map.grid[tileY]?.[tileX];
  if (tile === (window.TILE_TYPES?.VOID ?? 0)) return "blocked-void";
  if (tile === (window.TILE_TYPES?.WALL ?? 2)) return "blocked-wall";
  return "blocked-geometry";
}
