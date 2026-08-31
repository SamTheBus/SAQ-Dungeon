/* ========================================================================== 
   PRIMARY PURPOSE: Owns the canonical, identity-stable live player actor.
   ========================================================================== */

const createInitialPlayer = () => ({
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  radius: 9,
  speed: 3.0,
  hp: 100,
  maxHp: 100,
  atk: 15,
  def: 5,
  bag: [],
  stash: [],
  pendingScraps: {},
  depth: 1,
  facing: 1,
});

export const player =
  window.player ?? window.topDownPlayer ?? createInitialPlayer();

window.player = player;
window.topDownPlayer = player;

export const getPlayer = function () {
  return player;
};
