import {
  TOME_CLEAR_HULL_GAP,
  TOME_PROJECTILE_RADIUS,
  getCombatTargetCenter,
  getCombatTargetRadius,
  getPlayerCombatRadius,
} from "./combat_reach.js?v=1.001";
import { isPlayerTargetableMob } from "./combat_factions.js?v=1.001";
import { renderRandom } from "./render_rng.js?v=1.000";

// Provisional presentation/feel value for G.6C1. Gameplay reach is distance-capped.
export const TOME_PROJECTILE_SPEED = 8;

function snapshotAttackStats(playerStats) {
  return { ...(playerStats || {}) };
}

export function launchTomeAttackProjectile({
  player,
  playerStats,
  target,
  map,
}) {
  const center = getCombatTargetCenter(target);
  if (!player || !center || !isPlayerTargetableMob(target)) return null;

  const dx = center.x - Number(player.x || 0);
  const dy = center.y - Number(player.y || 0);
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return null;

  const maxTravelDistance =
    TOME_CLEAR_HULL_GAP + getPlayerCombatRadius(player);
  const projectile = {
    owner: "player",
    type: "tome_bolt",
    x: Number(player.x || 0),
    y: Number(player.y || 0),
    vx: (dx / distance) * TOME_PROJECTILE_SPEED,
    vy: (dy / distance) * TOME_PROJECTILE_SPEED,
    r: TOME_PROJECTILE_RADIUS,
    life: Math.ceil(maxTravelDistance / TOME_PROJECTILE_SPEED) + 2,
    distanceTraveled: 0,
    maxTravelDistance,
    intendedTargetId: target.id,
    attackStats: snapshotAttackStats(playerStats),
    sourcePlayer: player,
    sourceMap: map || null,
    pulseOffset: renderRandom() * Math.PI * 2,
  };

  if (!Array.isArray(window.projectiles)) window.projectiles = [];
  window.projectiles.push(projectile);
  return projectile;
}

export function resolveTomeProjectileImpact(projectile, target) {
  if (!projectile || !isPlayerTargetableMob(target)) return false;
  const player = projectile.sourcePlayer || window.player;
  const playerStats = projectile.attackStats || {};
  if (!player) return false;

  if (target === window.mob) {
    if (typeof window.updateBossCombat !== "function") return false;
    window.updateBossCombat(
      player,
      playerStats,
      projectile.sourceMap || window.activeDungeonMap,
      {
        tomeProjectileImpact: true,
        impactTarget: target,
      },
    );
    return true;
  }

  if (typeof window.resolvePlayerAttack !== "function") return false;
  const center = getCombatTargetCenter(target);
    window.resolvePlayerAttack(
    player,
    playerStats,
    {
      obj: target,
      type: "mob",
      x: center.x,
      y: center.y,
      radius: getCombatTargetRadius(target),
    },
    {
      tomeProjectileImpact: true,
      activeDungeonMap: projectile.sourceMap || window.activeDungeonMap,
    },
  );
  return true;
}
