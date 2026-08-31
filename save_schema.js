/* ========================================================================== 
   ENGINE 1.0 SAVE SCHEMA — PURE CODEC FOUNDATION

   This module deliberately has no imports, global writes, or storage access.
   data.js owns the active serializer and transactional hydration boundary.
   ========================================================================== */

export const ENGINE_SAVE_SCHEMA_VERSION = 1;

export const ENGINE_SAVE_ROOT_FIELDS = Object.freeze([
  "schemaVersion",
  "gameVersion",
  "playerStats",
  "equippedSlots",
  "inventory",
  "bag",
  "pendingScraps",
]);

export const ENGINE_INVENTORY_FIELDS = Object.freeze([
  "EQUIP",
  "ARTIFACT",
  "SIGIL",
  "ETC",
  "USE",
]);

export const ENGINE_EQUIPMENT_SLOT_FIELDS = Object.freeze([
  "weapon",
  "subweapon",
  "helmet",
  "chest",
  "leggings",
  "overall",
  "boots",
  "ring1",
  "ring2",
  "art1",
  "art2",
  "art3",
]);

export const ENGINE_RETIRED_PLAYER_STAT_FIELDS = Object.freeze([
  "claimedMailIds",
  "clanContribution",
  "clanEmblem",
  "clanId",
  "clanLevel",
  "clanName",
  "crucibleAccumulatedGold",
  "crucibleAccumulatedLoot",
  "crucibleAccumulatedXp",
  "crucibleActiveTab",
  "crucibleKills",
  "crucibleLootMult",
  "crucibleRunActive",
  "currentRunDropQualityBonus",
  "currentRunDropRateBonus",
  "currentRunGoldBonus",
  "dungeonAccumulatedGold",
  "dungeonAccumulatedLoot",
  "dungeonAccumulatedXp",
  "dungeonKeys",
  "dungeonPeaks",
  "dungeonWave",
  "hasTriggeredAethericRecharge",
  "hasTriggeredPerfectDeflection",
  "hasTriggeredPrestigeUnlock",
  "hasTriggeredWitchingHour",
  "hasUsedFreeInsurance",
  "isFarmingLoop",
  "isPrestigeBossMode",
  "killCount",
  "maxStage",
  "nextDungeonKeyTime",
  "pendingClanProgress",
  "prestigeApproachTimer",
  "runKills",
  "selectedPrestigeStage",
  "targetsRequired",
  "weeklyClanCrateClaimed",
]);

export const ENGINE_COMPATIBILITY_FOSSIL_FIELDS = Object.freeze([
  "clanSkills",
  "crucibleActiveBuff",
  "crucibleActiveDebuff",
  "crucibleInfusedType",
  "currentDungeon",
  "currentDungeonStage",
  "currentUberBoss",
  "isBossMode",
  "isDungeonMode",
  "isUberBoss",
  "prestigeCount",
  "prestigePoints",
  "prestigeUpgrades",
]);

export const ENGINE_RUNTIME_ONLY_PLAYER_STAT_FIELDS = Object.freeze([
  "absorbedBarrierDamage",
  "activeCombatTicks",
  "activityTimer",
  "adrenalineTimer",
  "aegisPulseCount",
  "ankhTriggeredThisBattle",
  "apathyDecayStacks",
  "apathyDecayTimer",
  "astralAwakeningTimer",
  "atkPotionTimer",
  "abyssalDecayAccumulated",
  "barrierRechargeTimer",
  "blockCount",
  "bypassGearLockActive",
  "cachedAchievementBonusTotals",
  "canvasClicksWindow",
  "colossusApBonus",
  "colossusApTimer",
  "colossusAtkBonusTimer",
  "colossusAtkBonusVal",
  "combatTimer",
  "conduitSpawnTimer",
  "counterCooldownTimer",
  "critStreak",
  "crucibleAccumulatedCores",
  "crucibleAccumulatedShards",
  "crucibleDraftDeck",
  "crucibleSelfDmgReduction",
  "crucibleWave",
  "currentHp",
  "currentRunEnemyStrength",
  "damageTakenThisBattle",
  "deflectionFatigueTimer",
  "defPotionTimer",
  "dropPotionTimer",
  "fairyClicksWindow",
  "flaskCharges",
  "flaskCooldownTimer",
  "flaskSpeedBurst",
  "flaskUseCooldownTimer",
  "floorActiveTicks",
  "fortitudeStacks",
  "fortitudeTimer",
  "fortunesFavorTimer",
  "frenzyKillCount",
  "frenzyTimer",
  "galeResonanceTimer",
  "guaranteedCrit",
  "hastePotionTimer",
  "hpPotionTimer",
  "hasClickedThisBattle",
  "isCrucibleMode",
  "isRiftMode",
  "killedBy",
  "killedByMob",
  "kineticDistanceTraveled",
  "kineticFrictionCharges",
  "kineticStillTimer",
  "lastSpellCastType",
  "maelstromSpeedStacks",
  "maelstromSpeedTimer",
  "nexusTomeShieldTimer",
  "outOfCombatTicks",
  "overshieldConsumed",
  "pendingCrucibleDrafts",
  "phoenixStaffTimer",
  "poisonStacks",
  "poisonTimer",
  "purifiedAegisTimer",
  "qlyPotionTimer",
  "recentBlockTime",
  "recentHeals",
  "recentParryTime",
  "retaliatoryStrikeActive",
  "retaliatoryStrikeCharged",
  "retaliatoryStrikeReady",
  "robbingMarcusActive",
  "runXp",
  "scarfWeight",
  "shadowDecoyTimer",
  "shadowStepLevel",
  "shadowStepTimer",
  "sparkChainCount",
  "spellWeavingLvl",
  "spellWeavingStacks",
  "spellWeavingTimer",
  "syphonIntStacks",
  "syphonIntTimer",
  "tenacityStacks",
  "thunderlordCount",
  "usedSecondWind",
  "viperShadowDanceCharges",
  "warpCoreSprintTimer",
  "watchActiveTimer",
  "watchCycleTimer",
  "xpPotionTimer",
]);

export const ENGINE_DERIVED_OR_OBSOLETE_PLAYER_STAT_FIELDS = Object.freeze([
  "activeRift",
  "baseActiveSpeed",
  "baseAreaRadius",
  "baseAtk",
  "baseBlock",
  "baseCritChance",
  "baseCritDamage",
  "baseDef",
  "baseDex",
  "baseDrop",
  "baseFairySpawn",
  "baseGold",
  "baseIdleSpeed",
  "baseInt",
  "baseMaxHp",
  "baseMoveSpeed",
  "baseParry",
  "baseQuality",
  "baseRareSpawn",
  "baseStr",
  "chatFloatingMode",
  "chatX",
  "chatY",
  "completedTutorialSteps",
  "currentFloor",
  "editHudMode",
  "exposeWeaknessLvl",
  "fairiesClicked",
  "hasRefundedLegacyTempers",
  "hasTriggeredAgainstOdds",
  "hasTriggeredAlchemicalSynthesis",
  "hasTriggeredBackFromBrink",
  "hasTriggeredBareFists",
  "hasTriggeredCoffeeRun",
  "hasTriggeredElementalConvergence",
  "hasTriggeredHighNoon",
  "hasTriggeredLookMaNoHands",
  "hasTriggeredLuckySeven",
  "hasTriggeredMurphysLaw",
  "hasTriggeredPatientShepherd",
  "hasTriggeredPhoenixRising",
  "hasTriggeredSpeedrun",
  "hasTriggeredTimeCapsule",
  "hasTriggeredUnfortunateSoul",
  "highestRiftLevel",
  "historicalPeakLvl",
  "lastDailyLoginDayStr",
  "loginClaimedToday",
  "loginStreak",
  "masteryPoints",
  "maxCanvasClicksInWindow",
  "maxFairyClicksInWindow",
  "missionTokens",
  "selectedCheckpoint",
  "sessionPlaytime",
  "stage",
  "stickyCanvas",
  "tutorialStep",
  "unlockedCostumes",
  "unlockedSkins",
  "visitedTabs",
]);

const MAX_STRING_LENGTH = 4096;
const MAX_RECORD_ENTRIES = 4096;
const MAX_ARRAY_LENGTH = 5000;
const FORBIDDEN_RECORD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const rule = (kind, options = {}) => Object.freeze({ kind, ...options });
const numberRule = rule("number");
const integerRule = rule("integer");
const booleanRule = rule("boolean");
const stringRule = rule("string");
const bigNumRule = rule("bigNum");
const statsRolledRule = rule("statsRolled");
const nullable = (valueRule) => rule("nullable", { valueRule });
const arrayOf = (itemRule, maxLength = MAX_ARRAY_LENGTH) =>
  rule("array", { itemRule, maxLength });
const recordOf = (valueRule, maxEntries = MAX_RECORD_ENTRIES) =>
  rule("record", { valueRule, maxEntries });
const objectOf = (fields, required = []) =>
  rule("object", {
    fields: Object.freeze({ ...fields }),
    required: Object.freeze([...required]),
  });

const stringArrayRule = arrayOf(stringRule);
const numberArrayRule = arrayOf(numberRule);
const numberRecordRule = recordOf(numberRule);
const booleanRecordRule = recordOf(booleanRule);

const ENCHANTABLE_ITEM_STAT_FIELDS = Object.freeze([
  "activeAttackSpeed",
  "atk",
  "block",
  "critChance",
  "critDamage",
  "def",
  "dex",
  "idleAttackSpeed",
  "int",
  "maxHp",
  "moveSpeed",
  "parry",
  "str",
]);

const itemStatSnapshotFields = Object.fromEntries(
  ENCHANTABLE_ITEM_STAT_FIELDS.map((field) => [field, numberRule]),
);
const itemStatSnapshotRule = objectOf(itemStatSnapshotFields);

const sigilModifierRule = objectOf({
  id: stringRule,
  name: stringRule,
  desc: stringRule,
  type: stringRule,
  statKey: stringRule,
  value: numberRule,
  minStars: integerRule,
  dangerRating: numberRule,
});

const ITEM_NUMBER_FIELDS = Object.freeze([
  "activeAttackSpeed",
  "atk",
  "atkPct",
  "barrierRechargeDelay",
  "barrierRegenRate",
  "baseActiveSpeed",
  "baseAtk",
  "baseBarrierPct",
  "baseBlock",
  "baseCritChance",
  "baseCritDamage",
  "baseDef",
  "baseDex",
  "baseDropRate",
  "baseFairySpawn",
  "baseGoldMulti",
  "baseIdleSpeed",
  "baseInt",
  "baseMaxHp",
  "baseMoveSpeed",
  "baseParry",
  "baseQuality",
  "baseRareSpawn",
  "baseStr",
  "bashAtkBonus",
  "bleedChance",
  "block",
  "blockCapBonus",
  "bonusActiveSpeed",
  "bonusAreaRadius",
  "bonusAtk",
  "bonusBlock",
  "bonusCritChance",
  "bonusCritDamage",
  "bonusDef",
  "bonusDex",
  "bonusIdleSpeed",
  "bonusInt",
  "bonusMaxHp",
  "bonusMoveSpeed",
  "bonusParry",
  "bonusStr",
  "critChance",
  "critDamage",
  "def",
  "defPct",
  "dex",
  "dexPct",
  "dropRate",
  "fairySpawn",
  "goldMulti",
  "idleAttackSpeed",
  "int",
  "intPct",
  "maxHp",
  "maxHpPct",
  "moveSpeed",
  "moveSpeedPct",
  "offhandChance",
  "offhandDmg",
  "parry",
  "parryCapBonus",
  "parryMitigation",
  "quality",
  "qualityBoost",
  "rareSpawn",
  "rawBaseAtk",
  "rawBaseBlock",
  "rawBaseDef",
  "rawBaseInt",
  "rawBaseMaxHp",
  "rawBaseMoveSpeed",
  "rawBaseParry",
  "reflectDamage",
  "relicPower",
  "rewardMultiplier",
  "riposteDamage",
  "spellChance",
  "spellPower",
  "stageLevel",
  "str",
  "strPct",
  "temperLevel",
  "totalEnchants",
]);

const ITEM_STRING_FIELDS = Object.freeze([
  "breakdown",
  "color",
  "currency",
  "desc",
  "implicitPctType",
  "implicitType",
  "isEquippedSlot",
  "name",
  "noun",
  "reforgedProperty",
  "setName",
  "spellType",
  "subArchetype",
  "subType",
  "tempReforgeProp",
  "trait",
  "type",
]);

const ITEM_BOOLEAN_FIELDS = Object.freeze([
  "isCalamitySigil",
  "isDungeonShop",
  "isItemOfTheDay",
  "isStarterItem",
  "isTitle",
  "isUniqueAegis",
  "isUniqueChronicle",
  "isUniqueConduit",
  "isUniqueMaelstrom",
  "isUniqueSingularity",
  "isUniqueStaff",
  "isUniqueSword",
  "isUniqueTempest",
  "isUniqueViper",
  "isUniqueWarpCore",
  "isUniqueWatch",
  "locked",
  "purchased",
  "wasAutoEquipped",
]);

const itemFieldRules = {
  id: integerRule,
  statsRolled: statsRolledRule,
  cost: bigNumRule,
  buffs: arrayOf(sigilModifierRule, 32),
  debuffs: arrayOf(sigilModifierRule, 32),
  enchantments: itemStatSnapshotRule,
  originalStats: itemStatSnapshotRule,
};
ITEM_NUMBER_FIELDS.forEach((field) => {
  itemFieldRules[field] = numberRule;
});
ITEM_STRING_FIELDS.forEach((field) => {
  itemFieldRules[field] = nullable(stringRule);
});
ITEM_BOOLEAN_FIELDS.forEach((field) => {
  itemFieldRules[field] = booleanRule;
});
itemFieldRules.name = stringRule;
itemFieldRules.type = stringRule;

const itemRule = objectOf(itemFieldRules, ["id", "name", "type"]);

export const ENGINE_ITEM_FIELDS = Object.freeze(
  Object.keys(itemFieldRules).sort(),
);

const equipmentSlotRules = Object.fromEntries(
  ENGINE_EQUIPMENT_SLOT_FIELDS.map((field) => [field, nullable(itemRule)]),
);
const equippedSlotsRule = objectOf(
  equipmentSlotRules,
  ENGINE_EQUIPMENT_SLOT_FIELDS,
);

const inventoryRule = objectOf(
  {
    EQUIP: arrayOf(itemRule),
    ARTIFACT: arrayOf(itemRule),
    SIGIL: arrayOf(itemRule),
    ETC: numberRecordRule,
    USE: numberRecordRule,
  },
  ENGINE_INVENTORY_FIELDS,
);

const subweaponTrackRule = objectOf({
  xp: numberRule,
  level: numberRule,
  sp: numberRule,
  spentSp: numberRule,
});

const subweaponMasteryRule = objectOf(
  {
    shield: subweaponTrackRule,
    dagger: subweaponTrackRule,
    tome: subweaponTrackRule,
    nodes: numberRecordRule,
  },
  ["shield", "dagger", "tome", "nodes"],
);

const slotUpgradesRule = objectOf(
  Object.fromEntries(
    ENGINE_EQUIPMENT_SLOT_FIELDS.map((field) => [field, numberRule]),
  ),
);

const spAllocationsRule = objectOf(
  Object.fromEntries(
    [
      "spHp",
      "spAtk",
      "spDef",
      "spCrit",
      "spCritDmg",
      "spBlock",
      "spParry",
      "spSpd",
      "spStr",
      "spDex",
      "spInt",
    ].map((field) => [field, numberRule]),
  ),
);

const missionUpgradesRule = objectOf({
  gold: numberRule,
  atk: numberRule,
  hp: numberRule,
});

const missionRule = objectOf(
  {
    id: stringRule,
    type: stringRule,
    desc: stringRule,
    current: numberRule,
    target: numberRule,
    goldReward: bigNumRule,
    xpReward: bigNumRule,
    treat: stringRule,
    treatQty: numberRule,
    completed: booleanRule,
    claimed: booleanRule,
  },
  ["id", "type", "current", "target", "goldReward", "xpReward"],
);

const challengeTargetRule = objectOf(
  {
    name: stringRule,
    visualType: stringRule,
    tier: rule("stringOrNumber"),
  },
  ["name", "visualType", "tier"],
);

const challengeRewardsRule = objectOf(
  {
    gold: bigNumRule,
    xp: bigNumRule,
    shards: numberRule,
    cores: numberRule,
  },
  ["gold", "xp", "shards", "cores"],
);

const challengeRule = objectOf(
  {
    id: stringRule,
    name: stringRule,
    desc: stringRule,
    tierId: stringRule,
    tierName: stringRule,
    tierColor: stringRule,
    baseScaleStage: numberRule,
    riskRating: numberRule,
    rewardMultiplier: numberRule,
    qualityBoost: numberRule,
    buffs: stringArrayRule,
    debuffs: stringArrayRule,
    rewards: challengeRewardsRule,
    primaryTarget: challengeTargetRule,
    secondaryTarget: nullable(challengeTargetRule),
  },
  ["id", "name", "rewards", "primaryTarget"],
);

const recoveryLootRule = objectOf(
  {
    floor: numberRule,
    items: arrayOf(itemRule),
    gold: bigNumRule,
  },
  ["floor", "items", "gold"],
);

const PLAYER_BIG_NUM_FIELDS = Object.freeze([
  "coins",
  "runGold",
  "totalGoldEarned",
  "xp",
  "xpReq",
]);

const PLAYER_NUMBER_FIELDS = Object.freeze([
  "activeRiftLevel",
  "astralDust",
  "astralShards",
  "atkPotionRuns",
  "atkPotionStrength",
  "autoSalvageThreshold",
  "bountyRerollsToday",
  "cruciblePeak",
  "crucibleStartWave",
  "dailyRerollsDone",
  "deathCount",
  "defPotionRuns",
  "defPotionStrength",
  "dropPotionRuns",
  "dropPotionStrength",
  "flaskPotency",
  "flaskPotencyLevel",
  "globalQLevel",
  "glimmeringPity",
  "hastePotionRuns",
  "hastePotionStrength",
  "highestRiftLevelCleared",
  "hpPotionRuns",
  "hpPotionStrength",
  "itemsSalvaged",
  "lastDailyResetTime",
  "lastWeeklyResetTime",
  "level",
  "lifetimePeakStage",
  "lootPityCounter",
  "maxFlaskCharges",
  "maxFloorCleared",
  "maxLevel",
  "paragonLevel",
  "peakSimultaneousBuffs",
  "peakSingleGoldDrop",
  "peakSingleHit",
  "qlyPotionRuns",
  "qlyPotionStrength",
  "rareSpawnsSlain",
  "renown",
  "shopQLevel",
  "shopRefreshTime",
  "sp",
  "successfulExtractions",
  "totalDeflections",
  "totalEnchants",
  "totalLifetimeKills",
  "totalReforges",
  "totalTempers",
  "usp",
  "vendingPity",
  "vendingQLevel",
  "volumeMaster",
  "volumeMusic",
  "volumeSFX",
  "xpPotionRuns",
  "xpPotionStrength",
]);

const PLAYER_BOOLEAN_FIELDS = Object.freeze([
  "dailyRewardClaimed",
  "dungeonRunInProgress",
  "ecoMode",
  "enableLighting",
  "hasTriggeredChallengesUnlock",
  "hasTriggeredEarlyBird",
  "hasTriggeredExactChange",
  "hasTriggeredFullBag",
  "hasTriggeredLevel13Unlock",
  "hasTriggeredLevel25Unlock",
  "hasTriggeredNightOwl",
  "hasTriggeredOnslaughtUnlock",
  "hasTriggeredOverkill",
  "hasTriggeredRecovery",
  "hasTriggeredSoulBound",
  "hasTriggeredWeekendWarrior",
  "mixWithBackground",
  "mute",
  "projectSpectralCosmetic",
  "showDpsOverlay",
  "weeklyRewardClaimed",
]);

const PLAYER_STRING_FIELDS = Object.freeze([
  "activePortalEvent",
  "activeStarterSubweapon",
  "controlMode",
  "equippedCostume",
  "lastDailyResetDayStr",
  "lastWeeklyResetMondayStr",
  "playerName",
  "selectedRiftGuardian",
]);

const playerStatRules = {
  subweaponMastery: subweaponMasteryRule,
  skillTree: numberRecordRule,
  slotUpgrades: slotUpgradesRule,
  spAllocations: spAllocationsRule,
  missionUpgrades: missionUpgradesRule,
  recoveryLoot: nullable(recoveryLootRule),
  bossKillRegistry: numberRecordRule,
  shopItems: arrayOf(itemRule),
  dailyMissions: arrayOf(missionRule, 64),
  weeklyMissions: arrayOf(missionRule, 64),
  monsterCards: numberRecordRule,
  claimedBestiarySets: booleanRecordRule,
  activeRelics: stringArrayRule,
  artifactCodex: numberRecordRule,
  unviewedAchievements: stringArrayRule,
  unlockedAchievements: stringArrayRule,
  achievementTimestamps: numberRecordRule,
  unlockedCheckpoints: numberArrayRule,
  unlockedTitles: stringArrayRule,
  visitedSubTabs: stringArrayRule,
  activeSpecialChallenge: nullable(challengeRule),
  activeDungeonSigil: nullable(itemRule),
  proceduralChallenges: recordOf(challengeRule, 128),
  spectralCodex: stringArrayRule,
  activeSpectralResonance: nullable(stringRule),
  firstClearBosses: numberArrayRule,
  gachaHistory: arrayOf(itemRule, 32),
  equippedTitle: nullable(stringRule),
  dpsOverlayX: nullable(numberRule),
  dpsOverlayY: nullable(numberRule),
  flaskX: nullable(numberRule),
  flaskY: nullable(numberRule),
};

PLAYER_BIG_NUM_FIELDS.forEach((field) => {
  playerStatRules[field] = bigNumRule;
});
PLAYER_NUMBER_FIELDS.forEach((field) => {
  playerStatRules[field] = numberRule;
});
PLAYER_BOOLEAN_FIELDS.forEach((field) => {
  playerStatRules[field] = booleanRule;
});
PLAYER_STRING_FIELDS.forEach((field) => {
  playerStatRules[field] = stringRule;
});

const playerStatsRule = objectOf(playerStatRules, [
  "level",
  "xp",
  "xpReq",
  "coins",
]);

export const ENGINE_PLAYER_STAT_BIG_NUM_FIELDS = PLAYER_BIG_NUM_FIELDS;
export const ENGINE_PLAYER_STAT_FIELDS = Object.freeze(
  Object.keys(playerStatRules).sort(),
);

const rootRule = objectOf(
  {
    schemaVersion: rule("schemaVersion"),
    gameVersion: rule("gameVersion"),
    playerStats: playerStatsRule,
    equippedSlots: equippedSlotsRule,
    inventory: inventoryRule,
    bag: arrayOf(itemRule),
    pendingScraps: numberRecordRule,
  },
  ENGINE_SAVE_ROOT_FIELDS,
);

export class EngineSaveSchemaError extends Error {
  constructor(code, path, message) {
    super(`${path}: ${message}`);
    this.name = "EngineSaveSchemaError";
    this.code = code;
    this.path = path;
  }
}

const fail = (code, path, message) => {
  throw new EngineSaveSchemaError(code, path, message);
};

const isPlainRecord = (value) => {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const assertSafeRecordKey = (key, path) => {
  if (
    key.length === 0 ||
    key.length > 128 ||
    FORBIDDEN_RECORD_KEYS.has(key)
  ) {
    fail("unsafe-key", path, `unsupported record key ${JSON.stringify(key)}`);
  }
};

const normalizeBigNumWire = (value, path) => {
  if (!isPlainRecord(value)) {
    fail("invalid-big-num", path, "expected a plain {m,e} object");
  }
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "e" || keys[1] !== "m") {
    fail("invalid-big-num", path, "expected exactly the m and e members");
  }
  const m = value.m;
  const e = value.e;
  if (!Number.isFinite(m) || !Number.isSafeInteger(e)) {
    fail("invalid-big-num", path, "m must be finite and e a safe integer");
  }
  if (m === 0) return { m: 0, e: 0 };
  if (Math.abs(m) < 1 || Math.abs(m) >= 10) {
    fail("invalid-big-num", path, "mantissa must be normalized to [1,10)");
  }
  return { m, e };
};

export const encodeEngineBigNum = function (value, path = "value") {
  if (value === null || typeof value !== "object") {
    fail("invalid-big-num", path, "expected a BigNum-compatible object");
  }
  if (!Object.hasOwn(value, "m") || !Object.hasOwn(value, "e")) {
    fail("invalid-big-num", path, "expected own m and e members");
  }
  return normalizeBigNumWire({ m: value.m, e: value.e }, path);
};

export const hydrateEngineBigNum = function (
  value,
  createBigNum,
  path = "value",
) {
  if (typeof createBigNum !== "function") {
    fail("missing-big-num-factory", path, "createBigNum must be a function");
  }
  const wire = normalizeBigNumWire(value, path);
  return createBigNum(wire.m, wire.e);
};

const withComposite = (value, path, context, operation) => {
  if (context.seen.has(value)) {
    fail("cyclic-value", path, "cyclic values are not supported");
  }
  context.seen.add(value);
  try {
    return operation();
  } finally {
    context.seen.delete(value);
  }
};

const cloneByRule = (value, valueRule, path, context) => {
  switch (valueRule.kind) {
    case "number":
      if (!Number.isFinite(value)) {
        fail("invalid-number", path, "expected a finite number");
      }
      return value;
    case "integer":
      if (!Number.isSafeInteger(value)) {
        fail("invalid-integer", path, "expected a safe integer");
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") {
        fail("invalid-boolean", path, "expected a boolean");
      }
      return value;
    case "string":
      if (typeof value !== "string" || value.length > MAX_STRING_LENGTH) {
        fail("invalid-string", path, "expected a bounded string");
      }
      return value;
    case "gameVersion":
      if (
        typeof value !== "string" ||
        value.length === 0 ||
        value.length > 64
      ) {
        fail("invalid-game-version", path, "expected a non-empty version string");
      }
      return value;
    case "stringOrNumber":
      if (typeof value === "string") {
        return cloneByRule(value, stringRule, path, context);
      }
      return cloneByRule(value, numberRule, path, context);
    case "statsRolled":
      if (value === "UNIQUE") return value;
      if (!Number.isInteger(value) || value < 0 || value > 5) {
        fail("invalid-item-rarity", path, "expected UNIQUE or an integer from 0 to 5");
      }
      return value;
    case "schemaVersion":
      if (value !== ENGINE_SAVE_SCHEMA_VERSION) {
        fail(
          "unsupported-schema",
          path,
          `expected schemaVersion ${ENGINE_SAVE_SCHEMA_VERSION}`,
        );
      }
      return ENGINE_SAVE_SCHEMA_VERSION;
    case "bigNum":
      if (context.mode === "encode") return encodeEngineBigNum(value, path);
      if (context.mode === "hydrate") {
        return hydrateEngineBigNum(value, context.createBigNum, path);
      }
      return normalizeBigNumWire(value, path);
    case "nullable":
      if (value === null) return null;
      return cloneByRule(value, valueRule.valueRule, path, context);
    case "array":
      if (!Array.isArray(value) || value.length > valueRule.maxLength) {
        fail("invalid-array", path, "expected a bounded array");
      }
      return withComposite(value, path, context, () =>
        value.map((entry, index) =>
          cloneByRule(entry, valueRule.itemRule, `${path}[${index}]`, context),
        ),
      );
    case "record":
      if (!isPlainRecord(value)) {
        fail("invalid-record", path, "expected a plain object record");
      }
      return withComposite(value, path, context, () => {
        const keys = Object.keys(value).sort();
        if (keys.length > valueRule.maxEntries) {
          fail("record-too-large", path, "record exceeds the entry limit");
        }
        const output = {};
        keys.forEach((key) => {
          assertSafeRecordKey(key, path);
          output[key] = cloneByRule(
            value[key],
            valueRule.valueRule,
            `${path}.${key}`,
            context,
          );
        });
        return output;
      });
    case "object":
      if (!isPlainRecord(value)) {
        fail("invalid-object", path, "expected a plain object");
      }
      return withComposite(value, path, context, () => {
        valueRule.required.forEach((field) => {
          if (!Object.hasOwn(value, field) || value[field] === undefined) {
            fail("missing-field", `${path}.${field}`, "required field is missing");
          }
        });
        const output = {};
        Object.keys(valueRule.fields)
          .sort()
          .forEach((field) => {
            if (!Object.hasOwn(value, field) || value[field] === undefined) return;
            output[field] = cloneByRule(
              value[field],
              valueRule.fields[field],
              `${path}.${field}`,
              context,
            );
          });
        return output;
      });
    default:
      fail("unknown-rule", path, `unknown schema rule ${valueRule.kind}`);
  }
};

const cloneRoot = (value, mode, createBigNum = null) =>
  cloneByRule(value, rootRule, "save", {
    mode,
    createBigNum,
    seen: new WeakSet(),
  });

export const buildEngineSaveSnapshot = function (runtime) {
  if (!runtime || typeof runtime !== "object") {
    fail("invalid-runtime", "runtime", "expected a runtime snapshot input");
  }
  const source = {
    schemaVersion: ENGINE_SAVE_SCHEMA_VERSION,
    gameVersion: String(runtime.gameVersion ?? ""),
    playerStats: runtime.playerStats,
    equippedSlots: runtime.equippedSlots,
    inventory: runtime.inventory,
    bag: runtime.bag,
    pendingScraps: runtime.pendingScraps,
  };
  return cloneRoot(source, "encode");
};

export const normalizeEngineSavePayload = function (payload) {
  return cloneRoot(payload, "wire");
};

export const hydrateEngineSavePayload = function (payload, createBigNum) {
  return cloneRoot(payload, "hydrate", createBigNum);
};

export const tryNormalizeEngineSavePayload = function (payload) {
  try {
    return { ok: true, value: normalizeEngineSavePayload(payload), error: null };
  } catch (error) {
    if (!(error instanceof EngineSaveSchemaError)) throw error;
    return {
      ok: false,
      value: null,
      error: Object.freeze({
        name: error.name,
        code: error.code,
        path: error.path,
        message: error.message,
      }),
    };
  }
};

const sortKeysDeep = (value) => {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!isPlainRecord(value)) return value;
  const output = {};
  Object.keys(value)
    .sort()
    .forEach((key) => {
      output[key] = sortKeysDeep(value[key]);
    });
  return output;
};

export const stableStringifyEngineSave = function (payload) {
  return JSON.stringify(sortKeysDeep(normalizeEngineSavePayload(payload)));
};
