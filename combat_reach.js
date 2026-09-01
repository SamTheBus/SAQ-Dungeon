export const PLAYER_COMBAT_RADIUS = 9;
export const SHIELD_DAGGER_CLEAR_HULL_GAP = 20;
export const TOME_CLEAR_HULL_GAP = 128;
export const TOME_PROJECTILE_RADIUS = 4;

const MAX_INDEXED_TARGET_RADIUS = 64;
const LOS_SAMPLE_STEP = 4;

export function getCombatTargetCenter(target) {
  if (!target) return null;
  const width = Number.isFinite(Number(target.w)) ? Number(target.w) : 24;
  const height = Number.isFinite(Number(target.h)) ? Number(target.h) : 24;
  return {
    x: Number(target.x || 0) + width / 2,
    y: Number(target.y || 0) + height / 2,
  };
}

export function getCombatTargetRadius(target, fallback = 12) {
  const explicitRadius = Number(target?.combatRadius ?? target?.radius);
  if (Number.isFinite(explicitRadius) && explicitRadius > 0) {
    return explicitRadius;
  }

  const width = Number(target?.w);
  const height = Number(target?.h);
  const resolvedWidth = Number.isFinite(width) && width > 0 ? width : fallback * 2;
  const resolvedHeight = Number.isFinite(height) && height > 0 ? height : resolvedWidth;
  return Math.max(resolvedWidth, resolvedHeight) * 0.45;
}

export function getPlayerCombatRadius(player) {
  const radius = Number(player?.radius);
  return Number.isFinite(radius) && radius > 0 ? radius : PLAYER_COMBAT_RADIUS;
}

export function isTomeCombatProfile(
  playerStats,
  subweapon = window.equippedSlots?.subweapon,
) {
  return (
    playerStats?.subType === "tome" ||
    subweapon?.subType === "tome" ||
    subweapon?.type === "tome"
  );
}

export function getPlayerClearHullReach(playerStats, subweapon) {
  return isTomeCombatProfile(playerStats, subweapon)
    ? TOME_CLEAR_HULL_GAP
    : SHIELD_DAGGER_CLEAR_HULL_GAP;
}

export function getClearHullGap(player, target) {
  const center = getCombatTargetCenter(target);
  if (!player || !center) return Infinity;
  const centerDistance = Math.hypot(
    Number(player.x || 0) - center.x,
    Number(player.y || 0) - center.y,
  );
  return Math.max(
    0,
    centerDistance - getPlayerCombatRadius(player) - getCombatTargetRadius(target),
  );
}

function fallbackCollisionCheck(map, testX, testY, radius) {
  if (!map?.grid || !Number.isFinite(Number(map.tileSize))) return false;
  const tileSize = Number(map.tileSize);
  const minTileX = Math.floor((testX - radius) / tileSize);
  const maxTileX = Math.floor((testX + radius) / tileSize);
  const minTileY = Math.floor((testY - radius) / tileSize);
  const maxTileY = Math.floor((testY + radius) / tileSize);
  const mapHeight = Number(map.height || map.grid.length);
  const mapWidth = Number(map.width || map.grid[0]?.length || 0);
  const wallTile = window.TILE_TYPES?.WALL ?? 2;
  const voidTile = window.TILE_TYPES?.VOID ?? 0;

  for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
      if (
        tileY < 0 ||
        tileY >= mapHeight ||
        tileX < 0 ||
        tileX >= mapWidth
      ) {
        return true;
      }
      const tile = map.grid[tileY][tileX];
      if (tile === wallTile || tile === voidTile) return true;
    }
  }
  return false;
}

export function hasTomeLineOfSight(
  player,
  target,
  map,
  collisionCheck = window.checkCollisionAt,
) {
  if (!map?.grid) return true;
  const center = getCombatTargetCenter(target);
  if (!player || !center) return false;

  const dx = center.x - Number(player.x || 0);
  const dy = center.y - Number(player.y || 0);
  const centerDistance = Math.hypot(dx, dy);
  if (centerDistance <= 0) return true;

  const unitX = dx / centerDistance;
  const unitY = dy / centerDistance;
  const startOffset = Math.min(
    centerDistance,
    getPlayerCombatRadius(player) + TOME_PROJECTILE_RADIUS,
  );
  const endOffset = Math.max(
    startOffset,
    centerDistance - getCombatTargetRadius(target) - TOME_PROJECTILE_RADIUS,
  );
  const traceLength = Math.max(0, endOffset - startOffset);
  const sampleCount = Math.max(1, Math.ceil(traceLength / LOS_SAMPLE_STEP));
  const check =
    typeof collisionCheck === "function"
      ? collisionCheck
      : fallbackCollisionCheck;

  for (let sample = 0; sample <= sampleCount; sample++) {
    const distance = startOffset + (traceLength * sample) / sampleCount;
    const testX = Number(player.x || 0) + unitX * distance;
    const testY = Number(player.y || 0) + unitY * distance;
    if (check(map, testX, testY, TOME_PROJECTILE_RADIUS)) return false;
  }
  return true;
}

export function hasCombatLineOfEffect(
  source,
  target,
  map,
  collisionCheck = window.checkCollisionAt,
) {
  if (!source || !target) return false;
  if (source === target) return true;
  const sourceCenter = getCombatTargetCenter(source);
  if (!sourceCenter) return false;
  return hasTomeLineOfSight(
    {
      x: sourceCenter.x,
      y: sourceCenter.y,
      radius: getCombatTargetRadius(source),
    },
    target,
    map,
    collisionCheck,
  );
}

export function canPlayerReachCombatTarget({
  player,
  target,
  playerStats,
  subweapon,
  map,
  collisionCheck,
}) {
  if (!player || !target) return false;
  const clearHullReach = getPlayerClearHullReach(playerStats, subweapon);
  if (getClearHullGap(player, target) > clearHullReach) return false;
  if (!isTomeCombatProfile(playerStats, subweapon)) return true;
  return hasTomeLineOfSight(player, target, map, collisionCheck);
}

export function getIndexedCombatReachQueryRadius(player, playerStats, subweapon) {
  return (
    getPlayerClearHullReach(playerStats, subweapon) +
    getPlayerCombatRadius(player) +
    MAX_INDEXED_TARGET_RADIUS
  );
}
