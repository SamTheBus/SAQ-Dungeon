const FINALIZED_FIELD = "safeModeExitFinalized";
const FINALIZING_FIELD = "safeModeExitFinalizing";

function ensureInventory() {
  if (!window.inventory) {
    window.inventory = {
      EQUIP: [],
      ARTIFACT: [],
      SIGIL: [],
      ETC: {},
      USE: {},
    };
  }
  if (!window.player.stash) window.player.stash = [];
  if (!window.inventory.ARTIFACT) window.inventory.ARTIFACT = [];
  if (!window.inventory.SIGIL) window.inventory.SIGIL = [];
  if (!window.inventory.ETC) window.inventory.ETC = {};
}

function secureCarriedItem(item) {
  if (!item) return;
  ensureInventory();
  delete item.isEquippedSlot;
  if (item.type === "sigil") {
    window.inventory.SIGIL.push(item);
  } else if (item.type === "artifact") {
    window.inventory.ARTIFACT.push(item);
  } else {
    window.player.stash.push(item);
  }
}

function depositMaterial(name, quantity) {
  let amount = Math.max(0, Math.floor(Number(quantity) || 0));
  if (amount <= 0) return 0;
  if (typeof window.addEtcDrop === "function") {
    window.addEtcDrop(name, amount, true);
  } else {
    ensureInventory();
    window.inventory.ETC[name] =
      (window.inventory.ETC[name] || 0) + amount;
  }
  return amount;
}

function resolveSafeModeVolatileAssets() {
  ensureInventory();

  let carriedItems = [...(window.player.bag || [])].filter(Boolean);
  carriedItems.forEach(secureCarriedItem);
  window.player.bag = [];

  let securedMaterials = [];
  for (let name in window.player.pendingScraps || {}) {
    let quantity = depositMaterial(name, window.player.pendingScraps[name]);
    if (quantity > 0) securedMaterials.push({ name, quantity });
  }
  window.player.pendingScraps = {};

  let securedGold = BigNum.from(window.playerStats.runGold || 0);
  if (securedGold.gt(0)) {
    window.playerStats.coins = BigNum.from(
      window.playerStats.coins || 0,
    ).add(securedGold);
  }
  window.playerStats.runGold = BigNum.from(0);
  window.playerStats.runXp = BigNum.from(0);

  let forfeitedGroundItemCount = (window.groundLoot || []).filter(
    (entry) => entry?.item,
  ).length;
  let forfeitedGroundMaterialCount = (window.groundMaterials || []).filter(
    Boolean,
  ).length;
  window.groundLoot = [];
  window.groundMaterials = [];

  window.playerStats.dungeonRunInProgress = false;
  window.playerStats.activeDungeonSigil = null;
  window.playerStats.standardRunEntryLoadoutIds = [];
  window.playerStats.robbingMarcusActive = false;
  window.playerStats.abyssalDecayAccumulated = 0;

  if (typeof window.decrementPotionRunCharges === "function") {
    window.decrementPotionRunCharges();
  }
  window.inventory.EQUIP = window.player.stash;

  return {
    carriedItems,
    securedGold,
    securedMaterials,
    forfeitedGroundItemCount,
    forfeitedGroundMaterialCount,
  };
}

function beginFinalization(expectedMode) {
  let stats = window.playerStats;
  if (!stats || !window.player) return false;
  if (stats[FINALIZED_FIELD] || stats[FINALIZING_FIELD]) return false;
  if (expectedMode === "rift" && !stats.isRiftMode) return false;
  if (expectedMode === "onslaught" && !stats.isCrucibleMode) return false;
  stats[FINALIZING_FIELD] = true;
  return true;
}

function completeFinalization() {
  window.playerStats[FINALIZING_FIELD] = false;
  window.playerStats[FINALIZED_FIELD] = true;
  if (typeof window.invalidatePlayerStats === "function") {
    window.invalidatePlayerStats();
  }
  if (typeof window.updateUI === "function") window.updateUI();
  if (typeof window.saveGame === "function") window.saveGame();
}

function abortFinalization() {
  if (window.playerStats) window.playerStats[FINALIZING_FIELD] = false;
}

export function resetSafeModeExitAuthority() {
  if (!window.playerStats) return;
  window.playerStats[FINALIZED_FIELD] = false;
  window.playerStats[FINALIZING_FIELD] = false;
}

export function isSafeModeExitFinalized() {
  return window.playerStats?.[FINALIZED_FIELD] === true;
}

export function finalizeRiftModeExit(success = true, isAbandon = false) {
  if (!beginFinalization("rift")) return false;

  try {
    let stats = window.playerStats;
    let level = stats.activeRiftLevel || 1;
    let guardianName = (stats.selectedRiftGuardian || "aegis_goliath")
      .replaceAll("_", " ")
      .toUpperCase();
    let rewards = {
      masteryXp: 0,
      shards: 0,
      dust: 0,
      catalystCores: 0,
      astralEssence: 0,
    };

    if (success) {
      stats.highestRiftLevelCleared = Math.max(
        stats.highestRiftLevelCleared || 0,
        level,
      );

      rewards.masteryXp = Math.round(250 * Math.pow(level, 0.85));
      rewards.shards = Math.floor(15 + 3.0 * level);
      rewards.dust = Math.floor(30 + 6.0 * level);
      rewards.catalystCores = Math.floor(level / 10);
      let remainder = level % 10;
      if (remainder > 0 && Math.random() < remainder * 0.1) {
        rewards.catalystCores++;
      }
      if (Math.random() < Math.min(1.0, 0.05 + 0.018 * level)) {
        rewards.astralEssence = 1;
      }

      stats.astralShards = (stats.astralShards || 0) + rewards.shards;
      stats.astralDust = (stats.astralDust || 0) + rewards.dust;
      depositMaterial("Catalyst Core", rewards.catalystCores);
      depositMaterial("Astral Essence", rewards.astralEssence);

      let subweapon = window.equippedSlots?.subweapon;
      let subType = subweapon?.subType || subweapon?.type || "shield";
      if (
        subweapon &&
        ["shield", "dagger", "tome"].includes(subType) &&
        typeof window.gainSubweaponXp === "function"
      ) {
        window.gainSubweaponXp(subType, rewards.masteryXp);
      }
    }

    let assets = resolveSafeModeVolatileAssets();
    stats.isRiftMode = false;
    completeFinalization();
    return {
      mode: "rift",
      result: isAbandon ? "retreat" : success ? "success" : "defeat",
      success,
      isAbandon,
      level,
      guardianName,
      rewards,
      assets,
    };
  } catch (error) {
    abortFinalization();
    throw error;
  }
}

export function finalizeOnslaughtModeExit(
  success = true,
  isAbandon = false,
) {
  if (!beginFinalization("onslaught")) return false;

  try {
    let stats = window.playerStats;
    let wavesCleared = Math.max(0, (stats.crucibleWave || 1) - 1);
    let shardsSecured = stats.crucibleAccumulatedShards || 0;
    let coresSecured = stats.crucibleAccumulatedCores || 0;

    stats.astralShards = (stats.astralShards || 0) + shardsSecured;
    depositMaterial("Catalyst Core", coresSecured);
    stats.cruciblePeak = Math.max(stats.cruciblePeak || 0, wavesCleared);

    let assets = resolveSafeModeVolatileAssets();

    // Clear every Onslaught accumulator before exposing the committed result.
    stats.crucibleAccumulatedShards = 0;
    stats.crucibleAccumulatedCores = 0;
    stats.crucibleDraftDeck = [];
    stats.pendingCrucibleDrafts = 0;
    stats.crucibleWave = 1;
    stats.crucibleSelfDmgReduction = 1.0;
    stats.isCrucibleMode = false;
    if (window.state) window.state.onslaughterWaveLock = false;

    completeFinalization();
    return {
      mode: "onslaught",
      result: isAbandon ? "retreat" : success ? "success" : "defeat",
      success,
      isAbandon,
      wavesCleared,
      personalBest: stats.cruciblePeak,
      rewards: {
        shards: shardsSecured,
        catalystCores: coresSecured,
      },
      assets,
    };
  } catch (error) {
    abortFinalization();
    throw error;
  }
}
