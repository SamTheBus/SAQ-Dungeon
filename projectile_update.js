import {
  isFriendlyCombatMob,
  isPlayerTargetableMob,
} from "./combat_factions.js?v=1.001";

const projectileOverlaps = (proj, target, defaultRadius) => {
  const targetX = target.x + (target.w || 0) / 2;
  const targetY = target.y + (target.h || 0) / 2;
  const targetRadius = target.radius || (target.w || defaultRadius * 2) * 0.45;
  return Math.hypot(targetX - proj.x, targetY - proj.y) < proj.r + targetRadius;
};

const findPlayerProjectileTarget = (proj) => {
  const candidates = [];
  const seen = new Set();
  const addCandidate = (candidate) => {
    if (!isPlayerTargetableMob(candidate) || seen.has(candidate)) return;
    seen.add(candidate);
    candidates.push(candidate);
  };

  (window.activeDungeonMobs || []).forEach(addCandidate);
  addCandidate(window.mob);
  return candidates.find((candidate) => projectileOverlaps(proj, candidate, 12));
};

const spawnProjectileImpact = (proj, particleCount = 6) => {
  if (!window.combatVisuals) return;
  if (typeof window.combatVisuals.spawnProjectileImpact === "function") {
    window.combatVisuals.spawnProjectileImpact(
      proj.x,
      proj.y,
      proj.type || "standard",
    );
  } else {
    window.combatVisuals.spawnParticles(
      proj.x,
      proj.y,
      particleCount,
      "default",
      3,
    );
  }
};

  export const updateActiveProjectiles = function (p, map, checkCollisionAt) {
    // Update Active Projectiles and Test Player & Wall Hitboxes
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
      let proj = window.projectiles[i];
      proj.life--;

      // Custom Boomerang Shield Kinematics
      if (proj.type === "boomerang" && window.mob) {
        let bm = window.mob;
        let bCx = bm.x + bm.w / 2;
        let bCy = bm.y + bm.h / 2;
        let bdx = bCx - proj.x;
        let bdy = bCy - proj.y;
        let bdist = Math.hypot(bdx, bdy);
        if (bdist > 0) {
          proj.vx += (bdx / bdist) * 0.24;
          proj.vy += (bdy / bdist) * 0.24;
        }
        let speed = Math.hypot(proj.vx, proj.vy);
        if (speed > 5.5) {
          proj.vx = (proj.vx / speed) * 5.5;
          proj.vy = (proj.vy / speed) * 5.5;
        }
      }

      // Custom Coin Barrage Ricochet Physics: Bounce up to 2 times against wall segments
      if (proj.type === "coin_barrage") {
        let hitX = checkCollisionAt(map, proj.x + proj.vx, proj.y, proj.r);
        let hitY = checkCollisionAt(map, proj.x, proj.y + proj.vy, proj.r);

        if (hitX || hitY) {
          proj.bounces = (proj.bounces || 0) + 1;
          if (proj.bounces > 2) {
            // Destroy on 3rd bounce
            window.projectiles.splice(i, 1);
            continue;
          }

          if (hitX) {
            proj.vx = -proj.vx;
          }
          if (hitY) {
            proj.vy = -proj.vy;
          }

          // Spark clink particles on bounce
          if (window.combatVisuals && window.combatVisuals.particlePool) {
            for (let s = 0; s < 4; s++) {
              let pt = window.combatVisuals.particlePool.get(
                proj.x,
                proj.y,
                (Math.random() - 0.5) * 2.0,
                (Math.random() - 0.5) * 2.0,
                window.randFloat(1.0, 2.2),
                "#ffd700",
                0.85,
                15,
                0.1,
                true,
                0,
              );
              pt.style = "ellipse";
              window.particles.push(pt);
            }
          }

          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function" &&
            Math.random() < 0.3
          ) {
            window.SoundManager.play("block");
          }
        }
      }

      proj.x += proj.vx;
      proj.y += proj.vy;

      // Spawning Style-Mapped Projectile Trails (Subphase C.3)
      if (window.particles && window.ParticlePool && Math.random() < 0.45) {
        let color = "#ffffff";
        let style = "circle";
        let pSize = window.randFloat(1.2, 2.4);
        let gravity = 0;
        let drag = 1.0;
        let spinSpeed = 0;
        let scaleDecay = 0.04;

        if (proj.type === "fireball") {
          color = Math.random() < 0.5 ? "#f97316" : "#fef08a";
          style = "streak";
          gravity = -0.04; // drift upward slightly
        } else if (proj.type === "coin_barrage") {
          color = "#ffd700";
          style = "elliptical_3d";
          scaleDecay = 0.05;
          spinSpeed = window.randFloat(0.12, 0.34);
        } else if (proj.type === "frost") {
          color = Math.random() < 0.5 ? "#38bdf8" : "#ffffff";
          style = "polygon";
          spinSpeed = window.randFloat(-0.15, 0.15);
        } else if (proj.type === "void" || proj.type === "boss_nova") {
          color = Math.random() < 0.5 ? "#a855f7" : "#e879f9";
          style = "sparkle_star";
          scaleDecay = 0.055;
        } else if (proj.type === "coin_barrage") {
          // Beautiful, spinning golden coin projectile
          ctx.translate(proj.x, proj.y);
          ctx.rotate(time / 100 + (proj.pulseOffset || 0));

          ctx.fillStyle = "#b7950b";
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            r + 0.5,
            r * Math.abs(Math.sin(time / 140)) + 0.5,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            r,
            r * Math.abs(Math.sin(time / 140)),
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          // Specular shine
          ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
          ctx.beginPath();
          ctx.ellipse(
            -r * 0.3,
            -r * 0.3,
            r * 0.25,
            r * 0.15,
            Math.PI / 4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (proj.type === "frost") {
          color = Math.random() < 0.5 ? "#22c55e" : "#15803d";
          style = "polygon";
          spinSpeed = window.randFloat(-0.22, 0.22);
        } else if (proj.type === "maelstrom") {
          color = "#a3fd83";
          style = "streak";
          drag = 0.95;
        }

        let pLife = window.randInt(11, 20);
        let pt = window.ParticlePool.get(
          proj.x - proj.vx * 0.35,
          proj.y - proj.vy * 0.35,
          -proj.vx * 0.15 + window.randFloat(-0.3, 0.3),
          -proj.vy * 0.15 + window.randFloat(-0.3, 0.3),
          pSize,
          color,
          0.72,
          pLife,
          pLife,
          gravity,
          true,
          drag,
        );
        pt.style = style;
        if (spinSpeed) pt.spinSpeed = spinSpeed;
        pt.scaleDecay = scaleDecay;
        window.particles.push(pt);
      }

      if (map && map.grid && checkCollisionAt(map, proj.x, proj.y, proj.r)) {
        spawnProjectileImpact(proj);
        window.projectiles.splice(i, 1);
        continue;
      }

      if (proj.owner === "player") {
        const hitMob = findPlayerProjectileTarget(proj);
        if (hitMob) {
          hitMob.hp = hitMob.hp.sub(proj.damage);
          hitMob.flashTimer = 6;
          hitMob.hasTakenDamage = true;
          hitMob.lastHitTime = window.logicClock || 0;
          spawnProjectileImpact(proj, 8);
          window.projectiles.splice(i, 1);
          continue;
        }
      } else if (proj.targetFriendlyId !== undefined) {
        const friendlyTarget = (window.activeDungeonMobs || []).find(
          (mob) => mob.id === proj.targetFriendlyId && isFriendlyCombatMob(mob),
        );
        if (friendlyTarget && projectileOverlaps(proj, friendlyTarget, 12)) {
          friendlyTarget.hp = friendlyTarget.hp.sub(proj.damage);
          friendlyTarget.flashTimer = 6;
          spawnProjectileImpact(proj, 8);
          window.projectiles.splice(i, 1);
          continue;
        }
      }

      let projDist = Math.hypot(p.x - proj.x, p.y - proj.y);
      if (proj.owner !== "player" && projDist < proj.r + (p.radius || 9)) {
        window.damagePlayer(proj.damage, null);
        spawnProjectileImpact(proj, 8);
        window.projectiles.splice(i, 1);
        if (p.hp <= 0) window.startDeathSequence();
        continue;
      }

      if (proj.life <= 0) {
        if (
          window.combatVisuals &&
          typeof window.combatVisuals.spawnProjectileImpact === "function"
        ) {
          window.combatVisuals.spawnProjectileImpact(
            proj.x,
            proj.y,
            proj.type || "standard",
          );
        }
        window.projectiles.splice(i, 1);
      }
    }
  };
