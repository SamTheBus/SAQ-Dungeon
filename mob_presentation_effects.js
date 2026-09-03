import {
  renderRandFloat,
  renderRandInt,
  renderRandom,
} from "./render_rng.js";

export function emitBerserkBossEmber(m, centerX) {
  if (
    renderRandom() < 0.18 &&
    !window.isGamePaused &&
    window.ParticlePool &&
    window.particles
  ) {
    let pt = window.ParticlePool.get(
      centerX + renderRandFloat(-10, 10),
      m.y - 4 + renderRandFloat(-4, 4),
      renderRandFloat(-0.3, 0.3),
      -renderRandFloat(0.4, 1.2),
      renderRandFloat(1.0, 2.2),
      "#e74c3c",
      0.8,
      renderRandInt(15, 30),
      -0.01,
      true,
    );
    pt.style = "glowing_orb";
    pt.scaleDecay = 0.02;
    window.particles.push(pt);
  }
}

export function emitRareEliteEmber(m, centerX, centerY) {
  if (
    renderRandom() < 0.12 &&
    !window.isGamePaused &&
    window.ParticlePool &&
    window.particles
  ) {
    let angle = renderRandom() * Math.PI * 2;
    let radius = renderRandFloat(m.w * 0.2, m.w * 0.7);
    let ex = centerX + Math.cos(angle) * radius;
    let ey = centerY + Math.sin(angle) * radius * 0.45;
    let color = renderRandom() < 0.5 ? "#2ecc71" : "#a855f7";
    let pt = window.ParticlePool.get(
      ex,
      ey,
      renderRandFloat(-0.2, 0.2),
      -renderRandFloat(0.4, 1.2),
      renderRandFloat(1.2, 2.4),
      color,
      0.85,
      renderRandInt(15, 30),
      -0.01,
      true,
    );
    pt.style = "glowing_orb";
    pt.scaleDecay = 0.02;
    window.particles.push(pt);
  }
}

export function emitHoardMimicSpark(progress, tier, centerX, centerY) {
  if (
    progress > 0.4 &&
    renderRandom() < 0.15 &&
    window.particles.length < 250 &&
    !window.isGamePaused
  ) {
    let color =
      tier === "iron_bound"
        ? "#e67e22"
        : tier === "gilded"
          ? "#ffd700"
          : "#00ffff";
    window.particles.push(
      window.ParticlePool.get(
        centerX + renderRandFloat(-8, 8),
        centerY - 4,
        renderRandFloat(-1, 1),
        -renderRandFloat(1, 2.5),
        renderRandFloat(1, 2.2),
        color,
        0.9,
        renderRandInt(15, 30),
        0.15,
        true,
      ),
    );
  }
}

export function emitWyrmlingFrostVapor(m, centerX, headY) {
  if (
    m.flashTimer === 0 &&
    !window.isGamePaused &&
    renderRandom() < 0.22
  ) {
    if (window.particles && window.ParticlePool) {
      let pt = window.ParticlePool.get(
        centerX + renderRandFloat(-4, 4),
        headY + 2,
        renderRandFloat(-1.2, -0.4),
        renderRandFloat(-0.3, 0.3),
        renderRandFloat(1.5, 3.2),
        "#ffffff",
        0.7,
        renderRandInt(15, 25),
        0,
        true,
      );
      pt.style = "glowing_orb";
      pt.scaleDecay = 0.04;
      window.particles.push(pt);
    }
  }
}

export function emitLavaSerpentEmber(centerX, centerY) {
  if (
    renderRandom() < 0.15 &&
    window.particles.length < 200 &&
    !window.isGamePaused
  ) {
    window.particles.push({
      x: centerX + renderRandFloat(0, 15),
      y: centerY - 6,
      vx: -renderRandFloat(0.5, 1.5),
      vy: -renderRandFloat(1, 2.5),
      radius: renderRandFloat(1, 2),
      color: "rgba(230, 126, 34, 0.4)",
      alpha: 0.8,
      life: renderRandInt(15, 30),
    });
  }
}

export function emitCursedBladeParticle(m, centerX, centerY) {
  if (
    m.flashTimer === 0 &&
    !window.isGamePaused &&
    renderRandom() < 0.2 &&
    window.particles.length < 250
  ) {
    window.particles.push(
      window.ParticlePool.get(
        centerX + renderRandFloat(-15, 15),
        centerY + renderRandFloat(-15, 15),
        renderRandFloat(-0.5, 0.5),
        -renderRandFloat(1, 2),
        renderRandFloat(1.5, 3),
        "#9b59b6",
        0.8,
        renderRandInt(15, 30),
      ),
    );
  }
}

export function emitCalamitySpecterParticle(m, centerX, centerY) {
  if (
    m.flashTimer === 0 &&
    renderRandom() < 0.45 &&
    window.particles.length < 250
  ) {
    window.particles.push(
      window.ParticlePool.get(
        centerX + renderRandFloat(-10, 10),
        centerY + renderRandFloat(-10, 10),
        renderRandFloat(-0.4, 0.4),
        -renderRandFloat(0.5, 1.8),
        renderRandFloat(1.5, 3.2),
        renderRandom() < 0.5 ? "#7c3aed" : "#ff0055",
        0.85,
        renderRandInt(20, 35),
        0,
        true,
      ),
    );
  }
}

export function emitGoldDungeonIdolSpark(idolX, idolY) {
  if (
    !window.isGamePaused &&
    renderRandom() < 0.22 &&
    window.particles.length < 250
  ) {
    window.particles.push({
      x: idolX + renderRandFloat(-10, 10),
      y: idolY + 4,
      vx: renderRandFloat(-1.8, 1.8),
      vy: -renderRandFloat(1.2, 3.2),
      radius: renderRandFloat(2, 4.2),
      color: renderRandom() > 0.4 ? "#f1c40f" : "#ff5500",
      alpha: 0.95,
      life: renderRandInt(25, 45),
    });
  }
}

export function emitHooktailSegmentSmoke(
  m,
  segmentX,
  segmentY,
  scaleX,
  scaleY,
  hoverY,
) {
  if (
    !window.isGamePaused &&
    renderRandom() < 0.2 &&
    window.particles.length < 200
  ) {
    window.particles.push({
      x: m.x + segmentX * scaleX,
      y: m.y + hoverY + segmentY * scaleY - 30,
      vx: renderRandFloat(-0.4, 0.2),
      vy: -renderRandFloat(1.2, 2.2),
      gravity: -0.06,
      radius: renderRandFloat(3.0, 5.0),
      growth: 0.15,
      color: "rgba(30, 30, 35, 0.65)",
      alpha: 0.75,
      fade: true,
      maxLife: 80,
      life: renderRandInt(60, 80),
    });
  }
}
