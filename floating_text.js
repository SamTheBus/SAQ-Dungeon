export function spawnFloatingText(
  x,
  y,
  text,
  color,
  followPlayer = false,
) {
  let p = window.player;
  window.floatingTexts.push({
    x: x,
    y: y,
    offsetX: p ? x - p.x : 0,
    offsetY: p ? y - p.y : -20,
    text: text,
    color: color,
    life: 55,
    maxLife: 55,
    followPlayer: followPlayer,
  });
}
