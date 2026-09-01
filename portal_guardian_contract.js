export const MARCUS_ROBBERY_STATES = Object.freeze({
  AVAILABLE: "available",
  ACTIVE: "active",
  RESOLVED: "resolved",
});

export function getStandardPortalTraversalState(map, playerStats) {
  const guardianLocked = Boolean(map && map.portalLocked);
  const marcusRobberyActive = Boolean(
    (map && map.marcusRobberyState === MARCUS_ROBBERY_STATES.ACTIVE) ||
      (playerStats && playerStats.robbingMarcusActive),
  );
  const traversalLocked = guardianLocked || marcusRobberyActive;

  return {
    guardianLocked,
    guardianComplete: !guardianLocked,
    marcusRobberyActive,
    traversalLocked,
    visualLocked: traversalLocked,
    reason: marcusRobberyActive
      ? "marcus"
      : guardianLocked
        ? "guardian"
        : null,
  };
}

export function beginMarcusRobberyState(map, playerStats) {
  if (!map || !playerStats) {
    return { changed: false, reason: "missing-state" };
  }
  if (map.marcusRobberyState === MARCUS_ROBBERY_STATES.ACTIVE) {
    return { changed: false, reason: "already-active" };
  }
  if (map.marcusRobberyState === MARCUS_ROBBERY_STATES.RESOLVED) {
    return { changed: false, reason: "already-resolved" };
  }

  map.marcusRobberyState = MARCUS_ROBBERY_STATES.ACTIVE;
  playerStats.robbingMarcusActive = true;
  return {
    changed: true,
    reason: "started",
    portal: getStandardPortalTraversalState(map, playerStats),
  };
}

export function completeMarcusRobberyState(map, playerStats) {
  if (!map || !playerStats) {
    return { changed: false, reason: "missing-state" };
  }
  const alreadyResolved =
    map.marcusRobberyState === MARCUS_ROBBERY_STATES.RESOLVED &&
    !playerStats.robbingMarcusActive;
  if (alreadyResolved) {
    return {
      changed: false,
      reason: "already-resolved",
      portal: getStandardPortalTraversalState(map, playerStats),
    };
  }

  map.marcusRobberyState = MARCUS_ROBBERY_STATES.RESOLVED;
  playerStats.robbingMarcusActive = false;
  return {
    changed: true,
    reason: "resolved",
    portal: getStandardPortalTraversalState(map, playerStats),
  };
}
