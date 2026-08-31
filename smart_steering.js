    // --- ZERO-ALLOCATION TANGENTIAL STEERING & CORNER UNSTICK ENGINE ---
    const PROBE_OFFSETS_CW = [
      Math.PI / 12, // 15 deg
      Math.PI / 6, // 30 deg
      Math.PI / 4, // 45 deg
      Math.PI / 3, // 60 deg
      (5 * Math.PI) / 12, // 75 deg
      Math.PI / 2, // 90 deg
      (7 * Math.PI) / 12, // 105 deg
      (2 * Math.PI) / 3, // 120 deg
      (3 * Math.PI) / 4, // 135 deg
      (5 * Math.PI) / 6, // 150 deg
      -Math.PI / 12,
      -Math.PI / 6,
      -Math.PI / 4,
      -Math.PI / 3,
      -Math.PI / 2,
      -(2 * Math.PI) / 3,
      -(3 * Math.PI) / 4,
      Math.PI,
    ];

    const PROBE_OFFSETS_CCW = [
      -Math.PI / 12,
      -Math.PI / 6,
      -Math.PI / 4,
      -Math.PI / 3,
      -(5 * Math.PI) / 12,
      -Math.PI / 2,
      -(7 * Math.PI) / 12,
      -(2 * Math.PI) / 3,
      -(3 * Math.PI) / 4,
      -(5 * Math.PI) / 6,
      Math.PI / 12,
      Math.PI / 6,
      Math.PI / 4,
      Math.PI / 3,
      Math.PI / 2,
      (2 * Math.PI) / 3,
      (3 * Math.PI) / 4,
      Math.PI,
    ];

    export function moveEntityWithSmartSteering(
      entity,
      targetX,
      targetY,
      speed,
      map,
      radius,
    ) {
      if (!entity) return false;
      let w = entity.w || 24;
      let h = entity.h || 24;

      let cx = entity.x + w / 2;
      let cy = entity.y + h / 2;
      let dx = targetX - cx;
      let dy = targetY - cy;
      let dist = Math.hypot(dx, dy);

      if (dist < 0.5) return false;

      if (!map || !map.grid) {
        let step = Math.min(speed, dist);
        entity.x += (dx / dist) * step;
        entity.y += (dy / dist) * step;
        return true;
      }

      let baseAngle = Math.atan2(dy, dx);
      let r = radius !== undefined ? radius : w * 0.4;
      let step = Math.min(speed, dist);

      if (entity.wallFollowTimer === undefined) entity.wallFollowTimer = 0;
      if (entity.wallFollowDir === undefined)
        entity.wallFollowDir = Math.random() < 0.5 ? 1 : -1;

      // 1. If currently locked in wall-following mode, test if direct path is NOW clear
      if (entity.wallFollowTimer > 0) {
        entity.wallFollowTimer--;
        let dirVx = Math.cos(baseAngle) * step;
        let dirVy = Math.sin(baseAngle) * step;
        // Check 1.5 steps ahead along direct path to ensure we fully cleared the corner
        if (
          !window.checkCollisionAt(map, cx + dirVx * 1.5, cy + dirVy * 1.5, r)
        ) {
          entity.wallFollowTimer = 0;
          entity.x += dirVx;
          entity.y += dirVy;
          return true;
        }
      } else {
        // 2. Try Direct Step toward Target
        let vx = Math.cos(baseAngle) * step;
        let vy = Math.sin(baseAngle) * step;
        if (!window.checkCollisionAt(map, cx + vx, cy + vy, r)) {
          entity.x += vx;
          entity.y += vy;
          return true;
        }
      }

      // 3. Direct path is blocked or wallFollowTimer > 0: Probe Tangent/Wall Angles
      let offsets =
        entity.wallFollowDir > 0 ? PROBE_OFFSETS_CW : PROBE_OFFSETS_CCW;
      for (let i = 0; i < offsets.length; i++) {
        let probeAngle = baseAngle + offsets[i];
        let pVx = Math.cos(probeAngle) * step;
        let pVy = Math.sin(probeAngle) * step;

        if (!window.checkCollisionAt(map, cx + pVx, cy + pVy, r)) {
          entity.x += pVx;
          entity.y += pVy;

          // Lock wall-following momentum for 25 frames (~0.4s) to smoothly round corners
          entity.wallFollowTimer = 25;
          // Maintain consistent wall-follow direction based on chosen probe offset
          if (offsets[i] < 0) {
            entity.wallFollowDir = -1;
          } else if (offsets[i] > 0) {
            entity.wallFollowDir = 1;
          }
          return true;
        }
      }

      // 4. Axis-Decoupled Sliding Fallback if probes fail
      let vx = Math.cos(baseAngle) * step;
      let vy = Math.sin(baseAngle) * step;
      let moved = false;
      if (
        Math.abs(vx) > 0.001 &&
        !window.checkCollisionAt(map, cx + vx, cy, r)
      ) {
        entity.x += vx;
        moved = true;
      }
      if (
        Math.abs(vy) > 0.001 &&
        !window.checkCollisionAt(map, entity.x + w / 2, cy + vy, r)
      ) {
        entity.y += vy;
        moved = true;
      }

      return moved;
    }

