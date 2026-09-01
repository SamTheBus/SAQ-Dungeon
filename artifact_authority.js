/* ========================================================================== 
   G.6B3: Canonical Artifact, Codex Relic, and persistent-unique authority.
   Pure helpers live here so stat, combat, persistence, and test consumers all
   resolve the same source, roll power, guard caps, and unique identity.
   ========================================================================== */

export const ARTIFACT_SLOT_KEYS = Object.freeze(["art1", "art2", "art3"]);

export const ARTIFACT_TRAIT_STATS = Object.freeze({
  frenzy: Object.freeze({ critChance: 0.03 }),
  vampirism: Object.freeze({ maxHp: 20 }),
  gold_hoard: Object.freeze({ atk: 10, goldMulti: 0.3 }),
  magic_find: Object.freeze({ dex: 5, dropRate: 0.25, quality: 0.15 }),
  move_speed: Object.freeze({ moveSpeedPct: 0.1, parry: 0.03 }),
  defense: Object.freeze({ maxHpPct: 0.06, defPct: 0.08 }),
  parry_strike: Object.freeze({ parry: 0.02 }),
  echo_strike: Object.freeze({ atk: 3 }),
  idle_spd: Object.freeze({ idleAttackSpeed: 0.15, goldMulti: 0.05 }),
  active_spd: Object.freeze({ activeAttackSpeed: 0.1, critChance: 0.03 }),
  dodge_buff: Object.freeze({ block: 0.02, parry: 0.02 }),
  extend_buffs: Object.freeze({ int: 3 }),
  bag_space: Object.freeze({ dropRate: 0.1 }),
  second_wind: Object.freeze({ str: 5, maxHp: 30 }),
  golem_stance: Object.freeze({ str: 5 }),
  fairy_wealth: Object.freeze({ goldMulti: 0.06, fairySpawn: 0.15 }),
  void_pull: Object.freeze({ dex: 3, rareSpawn: 0.2 }),
  titan_grip: Object.freeze({ block: 0.04, parry: 0.04 }),
  alchemist_alembic: Object.freeze({ int: 3 }),
  philosopher_catalyst: Object.freeze({ int: 4 }),
  cauldron_eternity: Object.freeze({ maxHpPct: 0.05 }),
  breach_adrenaline: Object.freeze({ critChance: 0.02 }),
  breach_barrier: Object.freeze({ def: 5 }),
  breach_scouting: Object.freeze({ goldMulti: 0.05 }),
  friction_kinetic: Object.freeze({ dex: 3 }),
  friction_tenacity: Object.freeze({ str: 4 }),
  friction_accretion: Object.freeze({ quality: 0.05 }),
  synergy_nexus: Object.freeze({ int: 4 }),
  synergy_sanguine: Object.freeze({ critChance: 0.03 }),
  speed_to_momentum: Object.freeze({ dex: 5 }),
  astral_expansion: Object.freeze({ int: 5, bonusAreaRadius: 0.25 }),
});

export const LIVE_ARTIFACT_TRAIT_IDS = Object.freeze(
  Object.keys(ARTIFACT_TRAIT_STATS),
);

export const LIVE_UNIQUE_DEFINITIONS = Object.freeze([
  Object.freeze({ key: "weapon_staff", flag: "isUniqueStaff" }),
  Object.freeze({ key: "weapon_sword", flag: "isUniqueSword" }),
  Object.freeze({ key: "weapon_singularity", flag: "isUniqueSingularity" }),
  Object.freeze({ key: "weapon_maelstrom", flag: "isUniqueMaelstrom" }),
  Object.freeze({ key: "shield_aegis", flag: "isUniqueAegis" }),
  Object.freeze({ key: "tome_watch", flag: "isUniqueWatch" }),
  Object.freeze({ key: "tome_chronicle", flag: "isUniqueChronicle" }),
  Object.freeze({ key: "boots_warpcore", flag: "isUniqueWarpCore" }),
  Object.freeze({ key: "helmet_tempest", flag: "isUniqueTempest" }),
  Object.freeze({ key: "dagger_viper", flag: "isUniqueViper" }),
  Object.freeze({ key: "tome_conduit", flag: "isUniqueConduit" }),
]);

const clampPower = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export function getArtifactSources({
  equippedSlots = globalThis.window?.equippedSlots,
  playerStats = globalThis.window?.playerStats,
} = {}) {
  const sources = [];
  const equipped = equippedSlots || {};
  const stats = playerStats || {};
  const activeRelics = Array.isArray(stats.activeRelics) ? stats.activeRelics : [];
  const codex = stats.artifactCodex || {};
  const slotUpgrades = stats.slotUpgrades || {};

  ARTIFACT_SLOT_KEYS.forEach((slotKey, index) => {
    const physical = equipped[slotKey];
    const attunement = 1 + Number(slotUpgrades[slotKey] || 0) * 0.01;
    if (physical?.type === "artifact" && physical.trait) {
      sources.push({
        form: "physical",
        trait: physical.trait,
        power: physical.relicPower === undefined ? 1 : clampPower(physical.relicPower),
        slotKey,
        attunement,
        temperLevel: Number(physical.temperLevel || 0),
        item: physical,
      });
      return;
    }

    const trait = activeRelics[index];
    const power = clampPower(codex[trait]);
    if (trait && power > 0) {
      sources.push({
        form: "codex",
        trait,
        power,
        slotKey,
        attunement,
        temperLevel: 0,
        item: null,
      });
    }
  });
  return sources;
}

export function getArtifactSource(trait, state = {}) {
  return getArtifactSources(state)
    .filter((source) => source.trait === trait && source.power > 0)
    .sort((left, right) => right.power - left.power)[0] || null;
}

export function checkArtifactTraitAuthority(trait, state = {}) {
  return Boolean(getArtifactSource(trait, state));
}

export function getArtifactMechanicScale(trait, state = {}) {
  return getArtifactSource(trait, state)?.power || 0;
}

export function scaleArtifactMechanic(trait, perfectValue, state = {}) {
  return Number(perfectValue || 0) * getArtifactMechanicScale(trait, state);
}

const TOTAL_FIELD_BY_STAT = Object.freeze({
  atk: "atk",
  maxHp: "maxHp",
  def: "def",
  moveSpeed: "moveSpeed",
  critChance: "critChance",
  critDamage: "critDamage",
  block: "block",
  parry: "parry",
  activeAttackSpeed: "activeAttackSpeed",
  idleAttackSpeed: "idleAttackSpeed",
  str: "str",
  dex: "dex",
  int: "int",
  atkPct: "atkPct",
  maxHpPct: "maxHpPct",
  defPct: "defPct",
  moveSpeedPct: "moveSpeedPct",
  strPct: "strPct",
  dexPct: "dexPct",
  intPct: "intPct",
  dropRate: "dropRate",
  quality: "quality",
  goldMulti: "goldMulti",
  rareSpawn: "rareSpawn",
  fairySpawn: "fairySpawn",
  bonusAreaRadius: "bonusAreaRadius",
});

const BASE_FIELD_BY_STAT = Object.freeze({
  atk: "baseAtk",
  maxHp: "baseMaxHp",
  def: "baseDef",
  moveSpeed: "baseMoveSpeed",
  critChance: "baseCritChance",
  critDamage: "baseCritDamage",
  block: "baseBlock",
  parry: "baseParry",
  activeAttackSpeed: "baseActiveSpeed",
  idleAttackSpeed: "baseIdleSpeed",
  str: "baseStr",
  dex: "baseDex",
  int: "baseInt",
});

export function resolveArtifactTraitStats(trait, power = 1, attunement = 1) {
  const result = {};
  const baseStats = ARTIFACT_TRAIT_STATS[trait] || {};
  const resolvedPower = clampPower(power);
  for (const [field, value] of Object.entries(baseStats)) {
    result[field] = Number(value) * resolvedPower * Number(attunement || 1);
  }
  return result;
}

export function resolvePhysicalArtifactStats(item, attunement = 1) {
  if (!item || item.type !== "artifact" || !ARTIFACT_TRAIT_STATS[item.trait]) {
    return {};
  }
  const authored = ARTIFACT_TRAIT_STATS[item.trait];
  const power = item.relicPower === undefined ? 1 : clampPower(item.relicPower);
  const result = {};

  for (const [field, authoredValue] of Object.entries(authored)) {
    const totalField = TOTAL_FIELD_BY_STAT[field] || field;
    const baseField = BASE_FIELD_BY_STAT[field];
    const currentTotal = Number(item[totalField] || 0);
    // Generated and legacy Artifacts store authored values in different shapes:
    // most use base*, speed traits historically used bonus*, and older fixtures
    // may expose only the resolved total. A non-zero total therefore means the
    // authored line was already materialized and must be replaced, not stacked.
    const authoredWasCopied =
      currentTotal !== 0 || (baseField && Number(item[baseField] || 0) !== 0);
    const independentRolls = authoredWasCopied
      ? currentTotal - Number(authoredValue)
      : currentTotal;
    result[field] =
      (independentRolls + Number(authoredValue) * power) * Number(attunement || 1);
  }

  for (const [field, totalField] of Object.entries(TOTAL_FIELD_BY_STAT)) {
    if (field in authored) continue;
    const value = Number(item[totalField] || 0);
    if (value !== 0) result[field] = value * Number(attunement || 1);
  }
  return result;
}

export function getCanonicalGuardCaps({
  subweapon = null,
  hasTitanGrip = false,
  blockCapBonus = 0,
  parryCapBonus = 0,
  crucibleCapBonus = 0,
  forcedMaxParryCap,
} = {}) {
  const subType = subweapon?.subType || subweapon?.type || null;
  const noun = String(subweapon?.noun || "").toLowerCase();
  let block = 0;
  let parry = 0;

  if (subType === "shield") block = hasTitanGrip ? 0.5 : 0.4;
  else if (hasTitanGrip) block = 0.2;

  if (subType === "dagger") {
    if (noun.includes("main-gauche")) parry = hasTitanGrip ? 0.55 : 0.45;
    else parry = hasTitanGrip ? 0.45 : 0.35;
  } else if (hasTitanGrip) {
    parry = 0.15;
  }

  block += Number(blockCapBonus || 0) + Number(crucibleCapBonus || 0);
  parry += Number(parryCapBonus || 0) + Number(crucibleCapBonus || 0);
  if (forcedMaxParryCap !== undefined) parry = Number(forcedMaxParryCap);
  return { block, parry };
}

export function beginArtifactStageAttempt(playerStats = globalThis.window?.playerStats) {
  if (!playerStats) return false;
  playerStats.usedSecondWind = false;
  return true;
}

export function consumePhoenixProtection({
  player,
  playerStats = globalThis.window?.playerStats,
  state = {},
} = {}) {
  if (!player || !playerStats || playerStats.usedSecondWind) return false;
  if (!checkArtifactTraitAuthority("second_wind", state)) return false;
  playerStats.usedSecondWind = true;
  player.hp = Math.max(1, Math.round(Number(player.maxHp || 1) * 0.4));
  return true;
}

export function getUniqueKeyAuthority(item) {
  if (!item || typeof item !== "object") return null;
  for (const definition of LIVE_UNIQUE_DEFINITIONS) {
    if (item[definition.flag]) return definition.key;
  }
  if (item.type === "artifact" && item.trait) return `art_${item.trait}`;
  return null;
}

export function hasUniquePassiveAuthority(
  uniqueKey,
  {
    playerStats = globalThis.window?.playerStats,
    equippedSlots = globalThis.window?.equippedSlots,
  } = {},
) {
  if (!uniqueKey) return false;
  if (playerStats?.activeSpectralResonance === uniqueKey) return true;
  const definition = LIVE_UNIQUE_DEFINITIONS.find(
    (candidate) => candidate.key === uniqueKey,
  );
  if (!definition || !equippedSlots) return false;
  return Object.values(equippedSlots).some((item) => Boolean(item?.[definition.flag]));
}

export function getCompassPath(map, player, tileTypes = globalThis.window?.TILE_TYPES) {
  if (!map?.grid?.length || !player || !tileTypes) return [];
  const height = map.grid.length;
  const width = map.grid[0]?.length || 0;
  const tileSize = Number(map.tileSize || 32);
  const start = {
    x: Math.max(0, Math.min(width - 1, Math.floor(Number(player.x || 0) / tileSize))),
    y: Math.max(0, Math.min(height - 1, Math.floor(Number(player.y || 0) / tileSize))),
  };
  const targets = new Set([
    tileTypes.CHEST_SPAWN,
    tileTypes.DUNGEON_MERCHANT,
    tileTypes.DESCENT_PORTAL,
    tileTypes.EXTRACTION_ZONE,
  ]);
  const blocked = new Set([tileTypes.VOID, tileTypes.WALL]);
  const keyOf = (x, y) => `${x},${y}`;
  const queue = [start];
  const parents = new Map([[keyOf(start.x, start.y), null]]);
  let destination = null;

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const tile = map.grid[current.y]?.[current.x];
    const isOpenedChest =
      tile === tileTypes.CHEST_SPAWN &&
      map.openedChests?.has?.(keyOf(current.x, current.y));
    if (
      (current.x !== start.x || current.y !== start.y) &&
      targets.has(tile) &&
      !isOpenedChest
    ) {
      destination = current;
      break;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const key = keyOf(x, y);
      if (parents.has(key) || blocked.has(map.grid[y]?.[x])) continue;
      parents.set(key, current);
      queue.push({ x, y });
    }
  }

  if (!destination) return [];
  const path = [];
  for (let cursor = destination; cursor; cursor = parents.get(keyOf(cursor.x, cursor.y))) {
    path.push(cursor);
  }
  return path.reverse();
}
