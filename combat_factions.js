export function hasLivingCombatHp(entity) {
  if (!entity || entity.hp === undefined || entity.hp === null) return false;
  if (typeof entity.hp.gt === "function") return entity.hp.gt(0);
  return Number(entity.hp) > 0;
}

export function isFriendlyCombatMob(entity) {
  return Boolean(entity?.isFriendlyWisp && hasLivingCombatHp(entity));
}

export function isPlayerTargetableMob(entity) {
  return Boolean(
    entity &&
      !entity.isSpecter &&
      !entity.isFriendlyWisp &&
      hasLivingCombatHp(entity),
  );
}
