export function shouldResolveInterruptedDungeonRun(playerStats, player) {
  if (playerStats?.dungeonRunInProgress === true) return true;

  if (Array.isArray(player?.bag) && player.bag.length > 0) return true;

  if (
    player?.pendingScraps &&
    Object.values(player.pendingScraps).some((quantity) => quantity > 0)
  ) {
    return true;
  }

  // Engine 1.0 saves predate the explicit run marker. A standard active sigil
  // was only assigned when deployment began; challenge sigils are assigned at
  // contract signing, so they are intentionally excluded from this fallback.
  return Boolean(
    playerStats?.activeDungeonSigil && !playerStats?.activeSpecialChallenge,
  );
}

export function calculateEmergencySalvageGold(runGold, salvageRatio) {
  let ratio = Number(salvageRatio);
  if (!runGold || !Number.isFinite(ratio) || ratio <= 0) {
    return runGold?.mul ? runGold.mul(0) : 0;
  }
  return runGold.mul(ratio).floor();
}
