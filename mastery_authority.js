const SHIELD_NODE_IDS = Object.freeze([
  "shield_starter",
  "shield_hp",
  "shield_def",
  "shield_iron_wall",
  "shield_fortified_guard",
  "shield_impact_tremor",
  "shield_fortitude",
  "shield_retaliatory_strike",
  "shield_aegis_pulse",
  "shield_earth_breaker_bash",
  "shield_retaliation",
  "shield_stalwart_bastion",
  "shield_keystone_colossus",
  "shield_keystone_reflect",
  "shield_filler_hp_flat",
  "shield_filler_flat_def",
  "shield_inf_defense",
  "shield_inf_bash",
]);

const DAGGER_NODE_IDS = Object.freeze([
  "dagger_starter",
  "dagger_crit_chance",
  "dagger_crit_dmg",
  "dagger_offhand_precision",
  "dagger_vipers_coating",
  "dagger_parry",
  "dagger_expose_weakness",
  "dagger_shadow_flurry",
  "dagger_shadow_step",
  "dagger_noxious_bloom",
  "dagger_sanguine_rupture",
  "dagger_wind_razor_flurry",
  "dagger_keystone_assassin",
  "dagger_keystone_duellist",
  "dagger_filler_haste",
  "dagger_filler_armor_pen",
  "dagger_inf_crit",
  "dagger_inf_poison",
]);

const TOME_NODE_IDS = Object.freeze([
  "tome_starter",
  "tome_atk",
  "tome_exp",
  "tome_empowered_catalysts",
  "tome_runic_barrier",
  "tome_elemental_overload",
  "tome_arcane_syphon",
  "tome_barrier_shatter",
  "tome_spell_weaving",
  "tome_resilience",
  "tome_keystone_triad",
  "tome_keystone_singularity",
  "tome_filler_barrier_regen",
  "tome_filler_spell_crit",
  "tome_inf_spell",
  "tome_inf_intel",
]);

const UTILITY_NODE_IDS = Object.freeze([
  "utility_pioneer",
  "utility_start_weapon",
  "utility_start_armor",
  "utility_start_head_feet",
  "utility_start_ring",
  "utility_gold",
  "utility_quality",
  "utility_vitality",
  "utility_elixir",
  "utility_bag",
  "utility_soul_beacon",
  "utility_insurance",
  "utility_emergency_salvage",
  "utility_fairy_sanctuary",
  "utility_treasure_hunter",
  "utility_keystone",
  "utility_inf_gold",
  "utility_inf_drop",
]);

export const LIVE_MASTERY_NODE_IDS = Object.freeze([
  ...SHIELD_NODE_IDS,
  ...DAGGER_NODE_IDS,
  ...TOME_NODE_IDS,
  ...UTILITY_NODE_IDS,
]);

const PASSIVE_STAT_NODE_IDS = new Set([
  "shield_hp",
  "shield_def",
  "shield_iron_wall",
  "shield_fortified_guard",
  "shield_impact_tremor",
  "shield_fortitude",
  "shield_retaliatory_strike",
  "shield_aegis_pulse",
  "shield_earth_breaker_bash",
  "shield_retaliation",
  "shield_stalwart_bastion",
  "shield_keystone_colossus",
  "shield_keystone_reflect",
  "shield_filler_hp_flat",
  "shield_filler_flat_def",
  "shield_inf_defense",
  "shield_inf_bash",
  "dagger_crit_chance",
  "dagger_crit_dmg",
  "dagger_offhand_precision",
  "dagger_vipers_coating",
  "dagger_parry",
  "dagger_expose_weakness",
  "dagger_shadow_flurry",
  "dagger_shadow_step",
  "dagger_noxious_bloom",
  "dagger_sanguine_rupture",
  "dagger_wind_razor_flurry",
  "dagger_keystone_assassin",
  "dagger_keystone_duellist",
  "dagger_filler_haste",
  "dagger_filler_armor_pen",
  "dagger_inf_crit",
  "dagger_inf_poison",
  "tome_atk",
  "tome_exp",
  "tome_empowered_catalysts",
  "tome_runic_barrier",
  "tome_elemental_overload",
  "tome_arcane_syphon",
  "tome_barrier_shatter",
  "tome_spell_weaving",
  "tome_resilience",
  "tome_keystone_triad",
  "tome_keystone_singularity",
  "tome_filler_barrier_regen",
  "tome_filler_spell_crit",
  "tome_inf_spell",
  "tome_inf_intel",
  "utility_pioneer",
  "utility_gold",
  "utility_quality",
  "utility_vitality",
  "utility_bag",
  "utility_emergency_salvage",
  "utility_fairy_sanctuary",
  "utility_keystone",
  "utility_inf_gold",
  "utility_inf_drop",
]);

export const MASTERY_NODE_BINDINGS = Object.freeze(
  Object.fromEntries(
    LIVE_MASTERY_NODE_IDS.map((nodeId) => [
      nodeId,
      PASSIVE_STAT_NODE_IDS.has(nodeId) ? "canonical-stat" : "canonical-gameplay",
    ]),
  ),
);

export const LEGACY_MASTERY_NODE_MIGRATIONS = Object.freeze({
  dagger_crit: "dagger_crit_chance",
  dagger_lethal_precision: "dagger_offhand_precision",
});

export const RETIRED_MASTERY_NODE_IDS = Object.freeze([
  "shield_spiked_rim",
  "shield_keystone",
  "dagger_keystone",
  "dagger_shadow_decoy",
  "dagger_keystone_sanguine",
  "tome_keystone",
]);

const finiteRank = (value) => {
  const rank = Number(value || 0);
  return Number.isFinite(rank) && rank > 0 ? rank : 0;
};

export const getMasteryNodeRank = (playerStats, nodeId) => {
  if (!playerStats || !nodeId) return 0;
  if (nodeId.startsWith("utility_")) {
    return finiteRank(playerStats.skillTree?.[nodeId]);
  }
  return finiteRank(playerStats.subweaponMastery?.nodes?.[nodeId]);
};

export const migrateLegacyMasteryNodeIds = (playerStats) => {
  const nodes = playerStats?.subweaponMastery?.nodes;
  if (!nodes || typeof nodes !== "object") return false;
  let changed = false;

  for (const [legacyId, liveId] of Object.entries(LEGACY_MASTERY_NODE_MIGRATIONS)) {
    const legacyRank = finiteRank(nodes[legacyId]);
    if (legacyRank > finiteRank(nodes[liveId])) {
      nodes[liveId] = legacyRank;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(nodes, legacyId)) {
      delete nodes[legacyId];
      changed = true;
    }
  }

  for (const retiredId of RETIRED_MASTERY_NODE_IDS) {
    if (Object.prototype.hasOwnProperty.call(nodes, retiredId)) {
      delete nodes[retiredId];
      changed = true;
    }
  }
  return changed;
};

const multiplyBigStat = (stats, field, multiplier) => {
  const value = stats[field];
  if (value && typeof value.mul === "function") {
    stats[field] = value.mul(multiplier);
  } else {
    stats[field] = Number(value || 0) * multiplier;
  }
};

const addBigStat = (stats, field, amount) => {
  const value = stats[field];
  if (value && typeof value.add === "function") {
    stats[field] = value.add(amount);
  } else {
    stats[field] = Number(value || 0) + amount;
  }
};

export const applyCanonicalMasteryStats = (
  stats,
  { playerStats = window.playerStats, subweapon = window.equippedSlots?.subweapon } = {},
) => {
  if (!stats) return stats;
  if (stats.masteryResolutionApplied) {
    throw new Error("Canonical mastery authority cannot be applied more than once.");
  }
  stats.masteryResolutionApplied = true;
  stats.masteryResolutionPasses = 1;

  const rank = (nodeId) => getMasteryNodeRank(playerStats, nodeId);
  stats.resolvedMasteryNodeRanks = Object.fromEntries(
    LIVE_MASTERY_NODE_IDS.map((nodeId) => [nodeId, rank(nodeId)]),
  );

  const shieldHp = rank("shield_hp");
  const shieldDef = rank("shield_def");
  const shieldIronWall = rank("shield_iron_wall");
  const shieldFortifiedGuard = rank("shield_fortified_guard");
  const shieldImpactTremor = rank("shield_impact_tremor");
  const shieldFortitude = rank("shield_fortitude");
  const shieldAegisPulse = rank("shield_aegis_pulse");
  const shieldEarthBreaker = rank("shield_earth_breaker_bash");
  const shieldRetaliation = rank("shield_retaliation");
  const shieldStalwart = rank("shield_stalwart_bastion");
  const shieldFillerPercent = rank("shield_filler_hp_flat");
  const shieldFillerFlat = rank("shield_filler_flat_def");
  const shieldInfiniteDefense = rank("shield_inf_defense");
  const shieldInfiniteBash = rank("shield_inf_bash");

  stats.maxHpPct =
    (stats.maxHpPct || 0) + shieldHp * 0.04 + shieldFillerPercent * 0.04;
  addBigStat(stats, "maxHp", shieldFillerFlat * 25);
  addBigStat(stats, "def", shieldFillerFlat * 5);

  const fortitudeStacks = Math.max(0, finiteRank(playerStats?.fortitudeStacks));
  const shieldDefensePct =
    shieldDef * 0.03 +
    shieldFillerPercent * 0.03 +
    fortitudeStacks * shieldFortifiedGuard * 0.04;
  if (shieldDefensePct > 0) multiplyBigStat(stats, "def", 1 + shieldDefensePct);
  if (shieldInfiniteDefense > 0) {
    multiplyBigStat(stats, "def", Math.pow(1.02, shieldInfiniteDefense));
  }

  stats.block = (stats.block || 0) + shieldIronWall * 0.01;
  stats.blockCapBonus = (stats.blockCapBonus || 0) + shieldIronWall * 0.02;
  stats.fortifiedGuardRank = shieldFortifiedGuard;
  stats.fortifiedGuardMultiplier = shieldFortifiedGuard * 0.04;
  stats.impactTremorRank = shieldImpactTremor;
  stats.hasImpactTremor = shieldImpactTremor > 0;
  stats.impactTremorChance = shieldImpactTremor * 0.2;
  stats.blockMitigationBonus = shieldFortitude * 0.1;
  stats.hasRetaliatoryStrike = rank("shield_retaliatory_strike") > 0;
  stats.hasAegisPulse = shieldAegisPulse > 0;
  stats.aegisPulseRank = shieldAegisPulse;
  stats.aegisPulseHeal = shieldAegisPulse * 0.03;
  stats.earthBreakerBashRank = shieldEarthBreaker;
  stats.earthBreakerStunChance = shieldEarthBreaker * 0.15;
  stats.shieldRetaliationRank = shieldRetaliation;
  stats.shieldBashMultiplier =
    (stats.shieldBashMultiplier || 1) *
    (1 + shieldRetaliation * 0.15) *
    Math.pow(1.02, shieldInfiniteBash);
  stats.shieldDefScalingCounter = shieldRetaliation * 0.12;
  stats.bashAtkBonus = (stats.bashAtkBonus || 0) + shieldRetaliation * 0.15;
  stats.blockMitigation = (stats.blockMitigation || 0.7) + shieldStalwart * 0.05;
  stats.hasColossusKeystone = rank("shield_keystone_colossus") > 0;
  if (stats.hasColossusKeystone) stats.blockMitigation = 1;
  stats.hasReflectKeystone = rank("shield_keystone_reflect") > 0;
  if (stats.hasReflectKeystone) stats.reflectDamage = 1.8;

  const daggerCritChance = rank("dagger_crit_chance");
  const daggerCritDamage = rank("dagger_crit_dmg");
  const daggerOffhand = rank("dagger_offhand_precision");
  const daggerVipers = rank("dagger_vipers_coating");
  const daggerParry = rank("dagger_parry");
  const daggerExpose = rank("dagger_expose_weakness");
  const daggerShadowStep = rank("dagger_shadow_step");
  const daggerNoxious = rank("dagger_noxious_bloom");
  const daggerSanguine = rank("dagger_sanguine_rupture");
  const daggerWindRazor = rank("dagger_wind_razor_flurry");
  const daggerFillerHaste = rank("dagger_filler_haste");
  const daggerFillerArmor = rank("dagger_filler_armor_pen");
  const daggerInfiniteCrit = rank("dagger_inf_crit");
  const daggerInfinitePoison = rank("dagger_inf_poison");

  stats.critChance = (stats.critChance || 0) + daggerCritChance * 0.015;
  stats.critDamage =
    ((stats.critDamage || 1.5) + daggerCritDamage * 0.06 + daggerFillerArmor * 0.03) *
    Math.pow(1.02, daggerInfiniteCrit);
  stats.offhandPrecisionRank = daggerOffhand;
  stats.offhandDamageMultiplier = 1 + daggerOffhand * 0.08;
  stats.offhandFlurryDamageMultiplier = 1 + daggerOffhand * 0.1;
  stats.vipersCoatingLvl = daggerVipers;
  stats.hasViperCoating = daggerVipers > 0;
  stats.viperPoisonStrength = daggerVipers * 0.1;
  stats.bleedChance = (stats.bleedChance || 0) + daggerVipers * 0.05;
  stats.parry = (stats.parry || 0) + daggerParry * 0.01;
  stats.parryCapBonus = (stats.parryCapBonus || 0) + daggerParry * 0.02;
  stats.daggerParryRank = daggerParry;
  stats.exposeWeaknessLvl = daggerExpose;
  stats.hasExposeWeakness = daggerExpose > 0;
  stats.exposeWeaknessShred = daggerExpose * 0.04;
  stats.hasShadowFlurry = rank("dagger_shadow_flurry") > 0;
  stats.shadowStepLevel = daggerShadowStep;
  stats.hasShadowStep = daggerShadowStep > 0;
  stats.riposteDamage = (stats.riposteDamage || 0.8) + daggerShadowStep * 0.2;
  stats.noxiousBloomLevel = daggerNoxious;
  stats.hasNoxiousBloom = daggerNoxious > 0;
  stats.sanguineRuptureLevel = daggerSanguine;
  stats.hasSanguineRupture = daggerSanguine > 0;
  stats.sanguineRuptureMult = daggerSanguine * 1.5;
  stats.windRazorFlurryLevel = daggerWindRazor;
  stats.hasWindRazorFlurry = daggerWindRazor > 0;
  stats.hasKeystoneAssassin = rank("dagger_keystone_assassin") > 0;
  stats.hasMasterDuellist = rank("dagger_keystone_duellist") > 0;
  if (stats.hasMasterDuellist) stats.forcedMaxParryCap = 0.4;
  stats.moveSpeed = (stats.moveSpeed || playerStats?.baseMoveSpeed || 100) + daggerFillerHaste * 4;
  stats.parry += daggerFillerHaste * 0.01;
  stats.atkPct = (stats.atkPct || 0) + daggerFillerArmor * 0.04;
  stats.poisonDamageMultiplier = Math.pow(1.02, daggerInfinitePoison);
  stats.bleedDamageMultiplier = Math.pow(1.02, daggerInfinitePoison);

  const tomeAtk = rank("tome_atk");
  const tomeCatalysts = rank("tome_empowered_catalysts");
  const tomeRunicBarrier = rank("tome_runic_barrier");
  const tomeOverload = rank("tome_elemental_overload");
  const tomeSyphon = rank("tome_arcane_syphon");
  const tomeWeaving = rank("tome_spell_weaving");
  const tomeResilience = rank("tome_resilience");
  const tomeFillerBarrier = rank("tome_filler_barrier_regen");
  const tomeFillerCrit = rank("tome_filler_spell_crit");
  const tomeInfiniteSpell = rank("tome_inf_spell");
  const tomeInfiniteIntel = rank("tome_inf_intel");

  if (tomeCatalysts > 0) {
    stats.spellChance = 0.35 + tomeCatalysts * 0.05;
    stats.spellPower = 1.5 + tomeCatalysts * 0.25;
  }
  stats.atkPct = (stats.atkPct || 0) + tomeAtk * 0.035 + tomeFillerCrit * 0.02;
  stats.spellPower =
    (stats.spellPower || 1.5) *
    (1 + tomeAtk * 0.035) *
    (1 + tomeFillerBarrier * 0.04) *
    Math.pow(1.12, tomeInfiniteSpell);
  stats.experienceRateBonus = rank("tome_exp") * 0.03;
  stats.arcaneShieldBonusPct =
    (stats.arcaneShieldBonusPct || 0) +
    tomeRunicBarrier * 0.1 +
    tomeFillerBarrier * 0.01;
  stats.runicBarrierRank = tomeRunicBarrier;
  stats.hasElementalOverload = tomeOverload > 0;
  stats.overloadLevel = tomeOverload;
  stats.bonusAreaRadius =
    (stats.bonusAreaRadius || 0) + tomeOverload * 0.2 + tomeFillerBarrier * 0.05;
  stats.hasArcaneSyphon = tomeSyphon > 0;
  stats.arcaneSyphonLevel = tomeSyphon;
  stats.arcaneSyphonRate = tomeSyphon * 0.015;
  stats.hasBarrierShatter = rank("tome_barrier_shatter") > 0;
  stats.shatterIntMultiplier = 2.5;
  stats.hasSpellWeaving = tomeWeaving > 0;
  stats.spellWeavingLevel = tomeWeaving;
  stats.spellWeavingPowerPerShift = tomeWeaving * 0.15;
  stats.manaShieldingRate = tomeResilience * 0.01;
  stats.hasTriadConvergence = rank("tome_keystone_triad") > 0;
  stats.hasAethericSingularity = rank("tome_keystone_singularity") > 0;
  if (stats.hasAethericSingularity) stats.arcaneShieldBonusPct += 0.5;
  stats.critChance += tomeFillerCrit * 0.015;

  const syphonStacks = Math.max(0, finiteRank(playerStats?.syphonIntStacks));
  if (syphonStacks > 0 && tomeSyphon > 0) {
    stats.int = Number(stats.int || 5) * (1 + syphonStacks * tomeSyphon * 0.04);
  }
  const weavingStacks = Math.max(0, finiteRank(playerStats?.spellWeavingStacks));
  if (weavingStacks > 0 && tomeWeaving > 0) {
    stats.spellPower *= 1 + weavingStacks * tomeWeaving * 0.15;
  }
  if (tomeInfiniteIntel > 0) {
    const multiplier = Math.pow(1.02, tomeInfiniteIntel);
    stats.int = Number(stats.int || 5) * multiplier;
    multiplyBigStat(stats, "atk", multiplier);
  }
  if (stats.hasReflectKeystone) {
    const defenseAttack =
      stats.def && typeof stats.def.mul === "function"
        ? stats.def.mul(0.4)
        : Number(stats.def || 0) * 0.4;
    addBigStat(stats, "atk", defenseAttack);
  }
  if (stats.hasAethericSingularity) {
    addBigStat(stats, "atk", Number(stats.int || 0) * 0.8);
  }

  const utilityPioneer = rank("utility_pioneer");
  const utilityGold = rank("utility_gold");
  const utilityQuality = rank("utility_quality");
  const utilityVitality = rank("utility_vitality");
  const utilityBag = rank("utility_bag");
  const utilityEmergency = rank("utility_emergency_salvage");
  const utilityFairy = rank("utility_fairy_sanctuary");
  const utilityInfiniteGold = rank("utility_inf_gold");
  const utilityInfiniteDrop = rank("utility_inf_drop");

  stats.gold =
    (stats.gold || 1) +
    utilityPioneer * 0.05 +
    utilityGold * 0.05 +
    0.04 * Math.pow(utilityInfiniteGold, 0.65);
  stats.drop = (stats.drop || 1) + utilityPioneer * 0.05;
  stats.qly =
    (stats.qly || 1) +
    utilityQuality * 0.02 +
    0.015 * Math.pow(utilityInfiniteDrop, 0.65);
  stats.maxHpPct = (stats.maxHpPct || 0) + utilityVitality * 0.03;
  stats.moveSpeed += utilityVitality * 2;
  stats.bonusBagSpace = utilityBag * 5;
  stats.emergencySalvageRank = utilityEmergency;
  stats.emergencySalvageRate = utilityEmergency * 0.05;
  stats.fairySanctuaryRank = utilityFairy;
  stats.fairySpawnChance = utilityFairy * 0.05;
  stats.hasFortunesFavor = rank("utility_keystone") > 0;
  stats.utilityElixirRank = rank("utility_elixir");
  stats.hasSoulBeacon = rank("utility_soul_beacon") > 0;
  stats.insuranceDiscount = rank("utility_insurance") * 0.1;
  stats.treasureHunterRank = rank("utility_treasure_hunter");
  stats.starterProvisionRanks = Object.freeze({
    weapon: rank("utility_start_weapon"),
    armor: rank("utility_start_armor"),
    headFeet: rank("utility_start_head_feet"),
    ring: rank("utility_start_ring"),
    shield: rank("shield_starter"),
    dagger: rank("dagger_starter"),
    tome: rank("tome_starter"),
  });

  return stats;
};

export const getMasteryEventDepth = () => {
  if (window.playerStats?.isDungeonMode && window.player) {
    return Math.max(1, Number(window.player.depth || 1));
  }
  return Math.max(1, Math.floor(Number(window.playerStats?.stage || 1) / 5));
};

export const getMasteryTriggerMultiplier = () =>
  Math.max(1, Math.pow(getMasteryEventDepth(), 0.35));

export const getActiveSubweaponMasteryType = () => {
  const subweapon = window.equippedSlots?.subweapon;
  const subType = subweapon?.subType || subweapon?.type;
  return ["shield", "dagger", "tome"].includes(subType) ? subType : null;
};

export const awardMasteryGameplayXp = (
  subType,
  baseAmount,
  { triggerScaled = false } = {},
) => {
  if (!["shield", "dagger", "tome"].includes(subType)) return 0;
  if (!(baseAmount > 0) || typeof window.gainSubweaponXp !== "function") return 0;
  const amount = Math.round(
    Number(baseAmount) * (triggerScaled ? getMasteryTriggerMultiplier() : 1),
  );
  if (amount <= 0) return 0;
  window.gainSubweaponXp(subType, amount);
  return amount;
};

export const awardMainAttackMasteryXp = () => {
  const subType = getActiveSubweaponMasteryType();
  return subType
    ? awardMasteryGameplayXp(subType, 1, { triggerScaled: true })
    : 0;
};

export const awardSpellProcMasteryXp = (stats) => {
  if (getActiveSubweaponMasteryType() !== "tome") return 0;
  const catalystBonus = stats?.resolvedMasteryNodeRanks?.tome_empowered_catalysts || 0;
  const castBase = stats?.hasTriadConvergence ? 15 : 2 + catalystBonus;
  const syphonBase = stats?.hasArcaneSyphon ? 15 : 0;
  return awardMasteryGameplayXp("tome", 3 + castBase + syphonBase, {
    triggerScaled: true,
  });
};

export const awardWindRazorMasteryXp = (stats) => {
  const rank = stats?.windRazorFlurryLevel || 0;
  return rank > 0
    ? awardMasteryGameplayXp("dagger", 12 + rank * 4, { triggerScaled: true })
    : 0;
};

export const awardResonantAegisMasteryXp = (stats) => {
  const rank = stats?.impactTremorRank || 0;
  return rank > 0
    ? awardMasteryGameplayXp("shield", 10 + rank * 5, { triggerScaled: true })
    : 0;
};

const NON_HOSTILE_DEFEAT_TYPES = new Set([
  "wooden_barrel",
  "ancient_urn",
  "pottery_clay",
  "wooden_crate",
  "pottery",
  "clay_pot",
  "friendly_wisp",
  "wisp",
  "summon_wisp",
  "player",
]);

const BOSS_DEFEAT_TYPES = new Set([
  "boss",
  "dungeon_boss",
  "prestige_boss",
  "rift_guardian",
  "aegis_goliath",
  "chronos_arbitrator",
  "nexus_overseer",
  "gilded_vault_keeper",
  "corrosive_abomination",
  "hooktail",
  "overlord_iron_vault",
  "brimstone_colossus",
  "marcus_boss",
]);

export const calculateDefeatMasteryXp = (mob = {}) => {
  const type = mob.type || mob.visualType || "standard";
  if (NON_HOSTILE_DEFEAT_TYPES.has(type) || mob.isFriendlyWisp) return 0;
  const depth = getMasteryEventDepth();
  let baseXp = 4;
  if (BOSS_DEFEAT_TYPES.has(type) || mob.isBoss) {
    baseXp = 50 + depth * 5;
  } else if (type === "dungeon_miniboss") {
    baseXp = 20 + depth * 2;
  } else if (mob.isRare || mob.eliteAffix) {
    baseXp = 8 + Math.floor(depth * 0.4);
  }
  return baseXp * Math.max(1, Math.floor(Math.pow(depth, 0.7)));
};

export const awardDefeatMasteryXp = (mob) => {
  const subType = getActiveSubweaponMasteryType();
  const amount = calculateDefeatMasteryXp(mob);
  return subType ? awardMasteryGameplayXp(subType, amount) : 0;
};
