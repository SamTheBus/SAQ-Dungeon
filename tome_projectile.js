import {
  TOME_CLEAR_HULL_GAP,
  TOME_PROJECTILE_RADIUS,
  getCombatTargetCenter,
  getCombatTargetRadius,
  getPlayerCombatRadius,
} from "./combat_reach.js";
import { isPlayerTargetableMob } from "./combat_factions.js";
import { renderRandom } from "./render_rng.js";
import { recordTomeDeliveryCommunication } from "./tome_delivery_communication.js";

// Provisional presentation/feel value for G.6C1. Gameplay reach is distance-capped.
export const TOME_PROJECTILE_SPEED = 8;
export const TOME_PROJECTILE_VISUAL_PROFILE = "arcane_delivery";

export function renderTomeDeliveryProjectile(ctx, projectile, radius) {
  const r = Number(radius || projectile?.r || 5);
  const angle = Math.atan2(
    Number(projectile?.vy || 0),
    Number(projectile?.vx || 0),
  );
  ctx.translate(Number(projectile?.x || 0), Number(projectile?.y || 0));
  ctx.rotate(angle);
  ctx.shadowColor = "#8b5cf6";
  ctx.shadowBlur = 7;
  ctx.fillStyle = "#6d28d9";
  ctx.beginPath();
  ctx.moveTo(r + 3, 0);
  ctx.lineTo(-r, r * 0.72);
  ctx.lineTo(-r * 0.45, 0);
  ctx.lineTo(-r, -r * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 1.25;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f5d0fe";
  ctx.beginPath();
  ctx.moveTo(r * 0.45, 0);
  ctx.lineTo(-r * 0.42, r * 0.25);
  ctx.lineTo(-r * 0.12, 0);
  ctx.lineTo(-r * 0.42, -r * 0.25);
  ctx.closePath();
  ctx.fill();
}

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
    // The delivery bolt is the neutral carrier for a primary Tome attack.
    // Element selection remains impact/proc authority and must not be implied here.
    visualProfile: TOME_PROJECTILE_VISUAL_PROFILE,
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
  recordTomeDeliveryCommunication("launched", { projectile });
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
