/* ==========================================================================
   PRIMARY PURPOSE: Stores static, declarative, and immutable game databases
   including items, sets, cosmetics, achievements, and modifiers.
   ========================================================================= */

window.MYSTICAL_STOCK = [
  {
    name: "SP Reset Scroll",
    cost: 2500,
    currency: "Gold",
    color: "#9b59b6",
    desc: "Refunds spent Skill Points from the Attribute Matrix.",
  },
  {
    name: "Gacha Key",
    cost: 15,
    currency: "Luminous Soul",
    color: "#f1c40f",
    desc: "Trade 15 rare Luminous Souls for 1 Vending Gacha Key.",
  },
  {
    name: "Astral Essence",
    cost: 10,
    currency: "Luminous Soul",
    color: "#9b59b6",
    desc: "Trade 10 rare Luminous Souls for 1 Astral Essence.",
  },
];

window.POTION_TRANSMUTATIONS = [
  {
    result: "Greater Attack Elixir",
    req: "Attack Elixir",
    amount: 3,
    color: "#10b981",
    desc: "Transmute 3x Attack Elixir into 1x Greater Attack Elixir.",
  },
  {
    result: "Supernal Attack Elixir",
    req: "Greater Attack Elixir",
    amount: 3,
    color: "#00ffcc",
    desc: "Transmute 3x Greater Attack Elixir into 1x Supernal Attack Elixir.",
  },
  {
    result: "Greater Vitality Elixir",
    req: "Vitality Elixir",
    amount: 3,
    color: "#f43f5e",
    desc: "Transmute 3x Vitality Elixir into 1x Greater Vitality Elixir.",
  },
  {
    result: "Supernal Vitality Elixir",
    req: "Greater Vitality Elixir",
    amount: 3,
    color: "#ff0055",
    desc: "Transmute 3x Greater Vitality Elixir into 1x Supernal Vitality Elixir.",
  },
  {
    result: "Greater Armored Elixir",
    req: "Armored Elixir",
    amount: 3,
    color: "#00d2ff",
    desc: "Transmute 3x Armored Elixir into 1x Greater Armored Elixir.",
  },
  {
    result: "Supernal Armored Elixir",
    req: "Greater Armored Elixir",
    amount: 3,
    color: "#38bdf8",
    desc: "Transmute 3x Greater Armored Elixir into 1x Supernal Armored Elixir.",
  },
  {
    result: "Greater Haste Elixir",
    req: "Haste Elixir",
    amount: 3,
    color: "#fbbf24",
    desc: "Transmute 3x Haste Elixir into 1x Greater Haste Elixir.",
  },
  {
    result: "Supernal Haste Elixir",
    req: "Greater Haste Elixir",
    amount: 3,
    color: "#ffaa00",
    desc: "Transmute 3x Greater Haste Elixir into 1x Supernal Haste Elixir.",
  },
];

window.etcDex = {
  "Eridium Shard":
    "A glowing, alien fragment used in the Forge to Tier Up an item's Star Rarity.",
  "Glimmering Gachapon Key":
    "Premium fused Key. Guarantees 3-5★ Equipment drops with a heavily elevated 5.0% Unique Artifact chance.",
  "Gacha Key":
    "Guaranteed drop from Guardians. Used at the Vending Machine for a gear roll.",
  "Ancient Core":
    "Rare drop from Stage Bosses. Sacrifice 1 at the Altar to summon a Guardian.",
  "Overlord's Sigil":
    "Guaranteed drop from the Equipment Dungeon Overlord. Spent at the Forge to lock and re-roll equipment modifiers.",
  "Astral Essence":
    "A pulsing, cosmic residue extracted by salvaging Unique Artifacts. Spent at the Forge to imbed powerful enchantments (+25% stat boost) on high-tier gear.",
  "Catalyst Core":
    "Earned in the Crucible or bought from the Alchemy Shop. Spent at the Forge to temper Unique Artifacts.",
  "Monster Soul":
    "A dark, swirling essence harvested from fallen standard monsters. Spent for basic forging and trades.",
  "Luminous Soul":
    "A radiant, pure soul dropped by rare monsters. Extremely valuable for advanced mystical trades.",
  "Mythic Scrap":
    "A perfect fragment of mythic-tier gear. Highly sought after for end-game tempering.",
  "Legendary Scrap":
    "A piece of legendary-tier material, essential for high-level tempering.",
  "Epic Scrap":
    "A sturdy piece of epic-tier material used in mid-to-high level tempering.",
  "Magic Scrap": "A glowing magical fragment utilized for mid-tier tempering.",
  "Rare Scrap":
    "A clean scrap of rare metal, useful for early-to-mid-tier tempering.",
};

window.useDex = {
  "Astral Singularity Cache": {
    desc: "A locked container vibrating with concentrated void energy. Unboxes a guaranteed 5★ Uber Unique weapon, offhand, or armor scaled to your lifetime peak stage.",
    color: "#a855f7",
  },
  "Astral Artifact Cache": {
    desc: "A pristine crystalline box containing a guaranteed random Unique Artifact, plus 2 to 4 Catalyst Cores.",
    color: "#1abc9c",
  },
  "Weekly Clan Supply Crate": {
    desc: "A special supply crate issued weekly to active guild members. Can be upgraded through the Clan Skills 'Supply Depot' research card to unlock massive bonus rewards like Catalyst Cores, Ancient Cores, and guaranteed high-rarity item rolls!",
    color: "#ffaa00",
  },
  "Clan Reward Sack": {
    desc: "Standardised Clan Reward. Consume to initiate untying. Guarantees 1 QP, 1x Equipment scaled to Lifetime Peak Stage, and rolls extra loot with consecutive item chances!",
    color: "#f1c40f",
  },
  "Clan Weekly Sack": {
    desc: "Venerable Clan Weekly Reward. Consume to break the seal. Guarantees 3 QP, 1x Ancient Core, 1x Overlord's Sigil, 1x Eridium Shard, and 3x Legendary Scraps!",
    color: "#9b59b6",
  },
  "Daily Reward Sack": {
    desc: "Standardised Daily Reward. Consume to initiate untying. Guarantees 1 QP, 1x Equipment scaled to Lifetime Peak Stage, and rolls extra loot with consecutive item chances!",
    color: "#f1c40f",
  },
  "Weekly Reward Sack": {
    desc: "Venerable Weekly Reward. Consume to break the seal. Guarantees 3 QP, 1x Ancient Core, 1x Overlord's Sigil, 1x Eridium Shard, and 3x Legendary Scraps!",
    color: "#9b59b6",
  },
  "Cavern Sigil Sack": {
    desc: "A heavy velvet pouch bound with golden cords and sealed with runic stitches. Consuming it unties the cords, triggering an elemental transmutation that releases a random 1★ to 5★ Cavern Sigil.",
    color: "#9b59b6",
  },
  "SP Reset Scroll": {
    desc: "Refunds spent Skill Points from the Attribute Matrix.",
    color: "#9b59b6",
  },
  "PP Reset Scroll": {
    desc: "Refunds spent Prestige Points from the Ascension Altar.",
    color: "#e67e22",
  },
  "Attack Elixir": {
    desc: "Increases Attack Power by +10% for 1 Run.",
    color: "#2ecc71",
  },
  "Greater Attack Elixir": {
    desc: "Increases Attack Power by +20% for 2 Runs.",
    color: "#10b981",
  },
  "Supernal Attack Elixir": {
    desc: "Increases Attack Power by +35% for 3 Runs.",
    color: "#00ffcc",
  },
  "Vitality Elixir": {
    desc: "Increases Max HP by +10% for 1 Run.",
    color: "#e74c3c",
  },
  "Greater Vitality Elixir": {
    desc: "Increases Max HP by +20% for 2 Runs.",
    color: "#f43f5e",
  },
  "Supernal Vitality Elixir": {
    desc: "Increases Max HP by +35% for 3 Runs.",
    color: "#ff0055",
  },
  "Armored Elixir": {
    desc: "Increases Defense by +10% for 1 Run.",
    color: "#3498db",
  },
  "Greater Armored Elixir": {
    desc: "Increases Defense by +20% for 2 Runs.",
    color: "#00d2ff",
  },
  "Supernal Armored Elixir": {
    desc: "Increases Defense by +35% for 3 Runs.",
    color: "#38bdf8",
  },
  "Haste Elixir": {
    desc: "Increases movement speed and attack recovery by +10% for 1 Run.",
    color: "#f1c40f",
  },
  "Greater Haste Elixir": {
    desc: "Increases movement speed and attack recovery by +20% for 2 Runs.",
    color: "#fbbf24",
  },
  "Supernal Haste Elixir": {
    desc: "Increases movement speed and attack recovery by +35% for 3 Runs.",
    color: "#ffaa00",
  },
  "Double XP Elixir": {
    desc: "Doubles all acquired experience gains (+100% EXP) for 1 Run.",
    color: "#c084fc",
  },
  "Double Drop Elixir": {
    desc: "Doubles current drop rate multiplier (+100%) for 1 Run.",
    color: "#34d399",
  },
  "Drop Quality Elixir": {
    desc: "Boosts item drop quality checks by +50% for 1 Run.",
    color: "#f472b6",
  },
};

window.ARTIFACT_POOL = [
  {
    name: "Berserker Stone",
    trait: "frenzy",
    desc: "Grants Frenzy Mode for 5s every 15 kills. Passive +3% Crit Chance.",
    breakdown:
      "<strong>Frenzy Buff Breakdown:</strong><br>• Trigger Requirement: <span style='color:#2ecc71;'>Reduced to 15 kills</span><br>• Active Atk Spd: Max Haste (4-frame cap)<br>• Crit Chance: <span style='color:#e67e22;'>100% Guaranteed</span><br>• Crit Multi: <span style='color:#f1c40f;'>+30% Extra Multiplier</span><br>• Passive: <span style='color:#e67e22;'>+3% Base Crit Chance</span>",
    critChance: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Blood-Soaked Chalice",
    trait: "vampirism",
    desc: "Heals 0.5% of damage dealt on hit (Capped at 3% Max HP per second globally). Passive +20 Max HP.",
    breakdown:
      "<strong>Vampirism Breakdown:</strong><br>• Life Steal: <span style='color:#e74c3c;'>0.5% of total slash damage</span> directly heals your HP pool.<br>• Global Ceiling: <span style='color:#aaa;'>Capped at 3% of Max HP per second</span> to prevent speed-exploited immortality.<br>• Passive: <span style='color:#e74c3c;'>+20 Flat Max HP</span>",
    maxHp: 20,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Philosopher's Anchor",
    trait: "gold_hoard",
    desc: "Permanent x1.30 Gold Multiplier bonus. Passive +10 Attack.",
    breakdown:
      "<strong>Hoard Breakdown:</strong><br>• Gold: Multiplies direct gold drops from mobs and bosses by flat <span style='color:#f1c40f;'>+30%</span>.<br>• Passive: <span style='color:#f1c40f;'>+10 Flat Attack</span> to support combat pacing.",
    atk: 10,
    dropRate: 0,
    quality: 0,
    goldMulti: 0.3,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Gilded Scarab",
    trait: "magic_find",
    desc: "+25% Drop Rate and +15% Drop Quality. Passive +5 DEX.",
    breakdown:
      "<strong>Scarab Hunting Breakdown:</strong><br>• Drop Rate: <span style='color:#2ecc71;'>+25% Item Frequency</span><br>• Drop Quality: <span style='color:#9b59b6;'>+15% Higher Stat Line Probability</span><br>• Passive: <span style='color:#3498db;'>+5 Flat DEX</span>",
    dex: 5,
    dropRate: 0.25,
    quality: 0.15,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Windwalker Boots",
    trait: "move_speed",
    desc: "Grants +10% Movement Speed and +3% Parry Rate.",
    breakdown:
      "<strong>Fleet Footed:</strong><br>• Movement: Grants a massive <span style='color:#3498db;'>+10% Movement Speed</span> multiplier.<br>• Defensive: Grants <span style='color:#e74c3c;'>+3% Parry Rate</span> to evade high-stage damage.",
    moveSpeedPct: 0.1,
    parry: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Aegis Core",
    trait: "defense",
    desc: "Grants +6% Max HP and +8% Defense.",
    breakdown:
      "<strong>Iron Clad:</strong><br>• Mitigation: Grants a sturdy <span style='color:#3498db;'>+8% Defense</span> multiplier.<br>• Pool: Grants a hearty <span style='color:#e74c3c;'>+6% Max HP</span> multiplier.",
    maxHpPct: 0.06,
    defPct: 0.08,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Riposte Gauntlet",
    trait: "parry_strike",
    desc: "Parrying instantly counters for 50% damage. Passive +2% Parry Rate.",
    breakdown:
      "<strong>Lethal Deflection:</strong><br>• Counter Strike: Successful parries immediately hit back for 50% weapon power.<br>• Passive: Increases your base chance to parry by <span style='color:#e74c3c;'>+2%</span>.",
    parry: 0.02,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Phantom Blade",
    trait: "echo_strike",
    desc: "Attacks have 30% chance to hit a second time for 25% damage. Passive +3 Attack.",
    breakdown:
      "<strong>Echo Strike:</strong><br>• Phantom Hit: Every swing has a <span style='color:#9b59b6;'>30% chance</span> to trigger a secondary hit for 25% damage.<br>• Passive: <span style='color:#f1c40f;'>+3 Flat Attack</span>",
    atk: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Sloth's Blessing",
    trait: "idle_spd",
    desc: "Increases Idle Attack Speed by +15%. Passive +5% Gold Multiplier.",
    breakdown:
      "<strong>Lazy Haste:</strong><br>• Speed Increase: Attacks automatically trigger <span style='color:#3498db;'>15% faster</span>.<br>• Passive: Adds <span style='color:#f1c40f;'>+5% Gold Multiplier</span>.",
    idleAttackSpeed: 0.15,
    goldMulti: 0.05,
    dropRate: 0,
    quality: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Zealot's Charm",
    trait: "active_spd",
    desc: "Increases Active Attack Speed limit by +10%. Passive +3% Crit Chance.",
    breakdown:
      "<strong>Feverish Swings:</strong><br>• Speed Increase: Increases active clicking speed limit by <span style='color:#2ecc71;'>10%</span>.<br>• Passive: <span style='color:#e67e22;'>+3% Base Crit Chance</span>",
    activeAttackSpeed: 0.1,
    critChance: 0.03,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Survivor's Adrenaline",
    trait: "dodge_buff",
    desc: "Blocking/Parrying grants +30% Dmg for 6s. Passive +2% Block & Parry.",
    breakdown:
      "<strong>Adrenaline Rush:</strong><br>• Buff: +30% damage output temporarily on defensive procs.<br>• Passive: Adds <span style='color:#3498db;'>+2% Block Rate</span> and <span style='color:#e74c3c;'>+2% Parry Rate</span>.",
    block: 0.02,
    parry: 0.02,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Chrono Hourglass",
    trait: "extend_buffs",
    desc: "Extends all temporary buffs by 3 seconds. Passive +3 INT.",
    breakdown:
      "<strong>Chronology:</strong><br>• Buff Hold: Extends active Frenzy or Adrenaline by <span style='color:#f1c40f;'>3s</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+3 INT</span> to extend potion durations and boost defense.",
    int: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Dimensional Pouch",
    trait: "bag_space",
    desc: "Expands equipment sack capacity to 50. Passive +10% Drop Rate.",
    breakdown:
      "<strong>Bottomless Bag:</strong><br>• Space: Expanded bag capacity.<br>• Passive: Adds <span style='color:#2ecc71;'>+10% Drop Rate</span> to help fill your larger satchel.",
    dropRate: 0.1,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Phoenix Ankh",
    trait: "second_wind",
    desc: "Ignore a fatal blow once per stage attempt (40% Heal). Passive +5 STR & +30 Max HP.",
    breakdown:
      "<strong>Second Wind:</strong><br>• Survive fatal blows with <span style='color:#e74c3c;'>40% HP restored</span>.<br>• Passive: Grants <span style='color:#e74c3c;'>+5 STR</span> (+50 Max HP and +7.5 Atk) and <span style='color:#2ecc71;'>+30 Flat Max HP</span>.",
    str: 5,
    maxHp: 30,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Golem's Core",
    trait: "golem_stance",
    desc: "+20% Attack while healthy (>80% HP). Passive +5 STR.",
    breakdown:
      "<strong>Golem's Stance Breakdown:</strong><br>• High-HP Benefit: Gain a massive <span style='color:#2ecc71;'>+20% Attack Power</span> bonus while sitting above 80% HP.<br>• Passive: Adds <span style='color:#e74c3c;'>+5 STR</span> (+50 Max HP and +7.5 Atk).",
    str: 5,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Fairy Queen's Crown",
    trait: "fairy_wealth",
    desc: "+15% Fairy Spawn. Fairies have 8% chance to drop 1 Luminous Soul. Passive +6% Gold.",
    breakdown:
      "<strong>Crown of Nymphs Breakdown:</strong><br>• Pixie Swarm: Multiplies wild fairy appearance rates by <span style='color:#2ecc71;'>+15%</span>.<br>• Magical Attunement: Fairies have an <span style='color:#ffb6c1;'>8% chance</span> to drop a rare Luminous Soul when caught.<br>• Passive: Adds <span style='color:#f1c40f;'>+6% Gold Multiplier</span>.",
    goldMulti: 0.06,
    dropRate: 0,
    quality: 0,
    rareSpawn: 0,
    fairySpawn: 0.15,
  },
  {
    name: "Void Core",
    trait: "void_pull",
    desc: "+20% Rare Spawn. Defeating Rares heals 15% Max HP. Passive +3 DEX.",
    breakdown:
      "<strong>Void Pull Breakdown:</strong><br>• Hunting Grounds: Enhances rare creature spawn frequencies by <span style='color:#9b59b6;'>+20%</span>.<br>• Singularity Syphon: Slaying any Rare target immediately syphon-heals <span style='color:#e74c3c;'>15% of your Max HP</span>.<br>• Passive: Adds <span style='color:#3498db;'>+3 DEX</span>.",
    dex: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0.2,
    fairySpawn: 0,
  },
  {
    name: "Titan's Shield Grip",
    trait: "titan_grip",
    desc: "Increases Block Cap to 25% (with Shield) and Parry Cap to 30% (with Dagger). Passive +4% Block & Parry.",
    breakdown:
      "<strong>Titan's Grip Breakdown:</strong><br>• Raising Caps: Increases your Block ceiling to <span style='color:#3498db;'>25%</span> (with Shield) and Parry ceiling to <span style='color:#e74c3c;'>30%</span> (with Dagger).<br>• Passive: Adds <span style='color:#3498db;'>+4% base Block Rate</span> and <span style='color:#e74c3c;'>+4% base Parry Rate</span>.",
    block: 0.04,
    parry: 0.04,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Alchemist's Alembic",
    trait: "alchemist_alembic",
    desc: "All consumed elixirs are 15% more potent. Passive +3 INT.",
    breakdown:
      "<strong>Alchemist's Alembic Breakdown:</strong><br>• Potion Potency: Amplifies the base multipliers of all consumed potions by <span style='color:#2ecc71;'>+15%</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+3 INT</span>.",
    int: 3,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Philosopher's Catalyst",
    trait: "philosopher_catalyst",
    desc: "Consuming an elixir has a 12% chance to not consume the item. Passive +4 INT.",
    breakdown:
      "<strong>Philosopher's Catalyst Breakdown:</strong><br>• Sparing Effect: Sparing consumption check with <span style='color:#2ecc71;'>12% free use probability</span>.<br>• Passive: Adds <span style='color:#9b59b6;'>+4 INT</span>.",
    int: 4,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
  {
    name: "Cauldron of Eternity",
    trait: "cauldron_eternity",
    desc: "While any potion buff is active, reduces Idle Attack delay by 2 frames. Passive +5% Max HP.",
    breakdown:
      "<strong>Cauldron of Eternity Breakdown:</strong><br>• Haste Trigger: Attacks automatically <span style='color:#3498db;'>2 frames faster</span> while any potion effect is running.<br>• Passive: Adds a <span style='color:#e74c3c;'>+5% Max HP</span> multiplier.",
    maxHpPct: 0.05,
    dropRate: 0,
    quality: 0,
    goldMulti: 0,
    rareSpawn: 0,
    fairySpawn: 0,
  },
];

// Post-process the existing 21 artifacts to assign their tier properties & inject the 8 new artifacts
(function() {
  const tierMapping = {
    frenzy: 2,
    vampirism: 2,
    gold_hoard: 1,
    magic_find: 2,
    move_speed: 1,
    defense: 1,
    parry_strike: 2,
    echo_strike: 2,
    idle_spd: 1,
    active_spd: 2,
    dodge_buff: 2,
    extend_buffs: 2,
    bag_space: 1,
    second_wind: 3,
    golem_stance: 2,
    fairy_wealth: 2,
    void_pull: 3,
    titan_grip: 3,
    alchemist_alembic: 2,
    philosopher_catalyst: 2,
    cauldron_eternity: 2
  };
  if (window.ARTIFACT_POOL) {
    window.ARTIFACT_POOL.forEach(art => {
      art.tier = tierMapping[art.trait] || 1;
    });

    const newArtifacts = [
      {
        name: "Breacher's Adrenaline Glass",
        trait: "breach_adrenaline",
        desc: "Upon entering a new floor, gain +40% Movement Speed and +25% Critical Strike Chance, decaying over 30s. Passive +2% base Crit Chance.",
        breakdown: "<strong>Vanguard Burst:</strong><br>• Initial Speed: <span style='color:#3498db;'>+40% Move Speed</span><br>• Initial Crit: <span style='color:#f1c40f;'>+25% Crit Chance</span><br>• Decay Limit: <span style='color:#aaa;'>Linearly decays to zero over 30 seconds</span><br>• Passive: <span style='color:#2ecc71;'>+2% Base Crit Chance</span>",
        tier: 3,
        critChance: 0.02,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Aegis Infiltration Glyph",
        trait: "breach_barrier",
        desc: "Upon floor entry, immediately project an overshield equal to 100% of your Maximum HP, decaying by 5% Max HP/sec. Passive +5 flat Defense.",
        breakdown: "<strong>Breach Barrier:</strong><br>• Initial Shield: <span style='color:#34d399;'>100% Max HP Overshield</span><br>• Decay Limit: <span style='color:#aaa;'>Decays by 5% Max HP per second (depleted in 20s)</span><br>• Passive: <span style='color:#3498db;'>+5 Flat Defense</span>",
        tier: 3,
        def: 5,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Scout's Cartographic Compass",
        trait: "breach_scouting",
        desc: "For the first 15s of a floor, reveal the path to the nearest Chest, Merchant, or Portal and gain +50% Drop Rate. Passive +5% Gold Multiplier.",
        breakdown: "<strong>Cartography:</strong><br>• Radar Window: <span style='color:#ffd700;'>First 15s of any floor</span><br>• Treasure Find: <span style='color:#2ecc71;'>+50% Drop Rate during window</span><br>• Passive: <span style='color:#ffd700;'>+5% Gold Multiplier</span>",
        tier: 2,
        goldMulti: 0.05,
        dropRate: 0,
        quality: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Kinetic Friction Turbine",
        trait: "friction_kinetic",
        desc: "Generate 1 charge of Kinetic Build per 10 pixels traveled (Max 50). Each charge grants +0.5% Attack Speed and +0.5% Damage. Standing still for 1.5s dissipates charges. Passive +3 DEX.",
        breakdown: "<strong>Friction Core:</strong><br>• Charge Build: <span style='color:#3498db;'>1 charge per 10 pixels moved (Max 50)</span><br>• Active Output: <span style='color:#2ecc71;'>+0.5% Attack Speed & +0.5% Damage per charge</span><br>• Ground Friction: <span style='color:#aaa;'>Standing still for 1.5s drains 10 charges/sec</span><br>• Passive: <span style='color:#38bdf8;'>+3 DEX</span>",
        tier: 3,
        dex: 3,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Obsidian Core of Tenacity",
        trait: "friction_tenacity",
        desc: "Each second spent in active combat grants 1 stack of Tenacity (Max 15). Each stack grants +2% Defense and +1.5% Block/Parry Mitigation. Stacks decay by 1/sec out of combat. Passive +4 STR.",
        breakdown: "<strong>Tenacity Core:</strong><br>• Combat Accumulator: <span style='color:#ff7675;'>1 stack per second in active combat (Max 15)</span><br>• Defensive Stack: <span style='color:#3498db;'>+2% Defense & +1.5% Block/Parry Mitigation per stack</span><br>• Out of Combat: <span style='color:#aaa;'>Decays by 1 stack per second</span><br>• Passive: <span style='color:#e74c3c;'>+4 STR</span>",
        tier: 3,
        str: 4,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Void Accretion Engine",
        trait: "friction_accretion",
        desc: "For every 10 seconds spent on a floor, gain +3% damage (Max 30% after 100 seconds). Passive +5% Drop Quality.",
        breakdown: "<strong>Time Accretion:</strong><br>• Level Scaler: <span style='color:#9b59b6;'>+3% Damage every 10s spent on active floor</span><br>• Stage Limit: <span style='color:#aaa;'>Capped at +30% Damage (100 seconds)</span><br>• Passive: <span style='color:#df9ffb;'>+5% Drop Quality</span>",
        tier: 2,
        quality: 0.05,
        dropRate: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Nexus Harmonizer",
        trait: "synergy_nexus",
        desc: "Equipping specific offhands unlocks dual-resonance: Shields have 20% cast-on-block spell chance; Dagger parries reset Field Flask; Tomes boost Block/Parry by 5% for 3s. Passive +4 INT.",
        breakdown: "<strong>Nexus Resonance:</strong><br>• Shield: <span style='color:#3498db;'>20% chance to cast current Spell on block</span><br>• Dagger: <span style='color:#a855f7;'>Parry immediately resets Field Flask cooldown</span><br>• Tome: <span style='color:#9b59b6;'>Casting spells adds +5% Block & Parry for 3s</span><br>• Passive: <span style='color:#9b59b6;'>+4 INT</span>",
        tier: 3,
        int: 4,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      },
      {
        name: "Sanguine Catalyst",
        trait: "synergy_sanguine",
        desc: "Increases all damage dealt to targets by +8% per unique active damage-over-time effect (Poison, Bleed, Burn) active on them. Passive +3% Crit Chance.",
        breakdown: "<strong>Sanguine Catalyst:</strong><br>• DoT Scaling: <span style='color:#e74c3c;'>+8% All Damage per unique DoT active on target.</span><br>• Max Potential: <span style='color:#ff7675;'>+24% Damage with Poison, Bleed, and Burn active.</span><br>• Passive: <span style='color:#e74c3c;'>+3% base Critical Strike Chance</span>",
        tier: 2,
        critChance: 0.03,
        dropRate: 0,
        quality: 0,
        goldMulti: 0,
        rareSpawn: 0,
        fairySpawn: 0
      }
    ];

    window.ARTIFACT_POOL.push(...newArtifacts);
  }
})();

window.SET_DEFINITIONS = {
  Vanguard: {
    name: "Vanguard",
    bonuses: [
      {
        count: 2,
        desc: "+5% Attack Power",
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Attack Power", // Consolidated and scaled to percentage
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.15;
        },
      },
    ],
  },
  Colossus: {
    name: "Colossus",
    bonuses: [
      {
        count: 2,
        desc: "+8% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.08;
        },
      },
      {
        count: 3,
        desc: "+22% Max HP", // Consolidated and scaled to percentage
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.22;
        },
      },
    ],
  },
  Bastion: {
    name: "Bastion",
    bonuses: [
      {
        count: 2,
        desc: "+5% Defense",
        apply: (p) => {
          p.defPctBonus = (p.defPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+18% Defense", // Consolidated and scaled to percentage
        apply: (p) => {
          p.defPctBonus = (p.defPctBonus || 0) + 0.18;
        },
      },
    ],
  },
  Windrunner: {
    name: "Windrunner",
    bonuses: [
      {
        count: 2,
        desc: "+5% Move Speed", // Converted flat Move Speed to percentage
        apply: (p) => {
          p.moveSpeedPctBonus = (p.moveSpeedPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Move Speed, +15% Idle Attack Speed", // Converted flat Move Speed to percentage
        apply: (p) => {
          p.moveSpeedPctBonus = (p.moveSpeedPctBonus || 0) + 0.15;
          p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.15;
        },
      },
    ],
  },
  Wraith: {
    name: "Wraith",
    bonuses: [
      {
        count: 2,
        desc: "+3% Crit Chance",
        apply: (p) => {
          p.critChance += 0.03;
        },
      },
      {
        count: 3,
        desc: "+8% Crit Chance, +15% Crit Multiplier",
        apply: (p) => {
          p.critChance += 0.08;
          p.critDamage += 0.15;
        },
      },
    ],
  },
  Reaver: {
    name: "Reaver",
    bonuses: [
      {
        count: 2,
        desc: "+15% Crit Multiplier",
        apply: (p) => {
          p.critDamage += 0.15;
        },
      },
      {
        count: 3,
        desc: "+35% Crit Multiplier, +2% Crit Chance",
        apply: (p) => {
          p.critDamage += 0.35;
          p.critChance += 0.02;
        },
      },
    ],
  },
  Dreadnought: {
    name: "Dreadnought",
    bonuses: [
      {
        count: 2,
        desc: "+3% Block Rate",
        apply: (p) => {
          p.block += 0.03;
        },
      },
      {
        count: 3,
        desc: "+8% Block Rate, +6% Defense", // Converted flat Defense to percentage
        apply: (p) => {
          p.block += 0.08;
          p.defPctBonus = (p.defPctBonus || 0) + 0.06;
        },
      },
    ],
  },
  Duellist: {
    name: "Duellist",
    bonuses: [
      {
        count: 2,
        desc: "+2% Parry Rate",
        apply: (p) => {
          p.parry += 0.02;
        },
      },
      {
        count: 3,
        desc: "+6% Parry Rate, +10% Active Attack Speed",
        apply: (p) => {
          p.parry += 0.06;
          p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Scholar: {
    name: "Scholar",
    bonuses: [
      {
        count: 2,
        desc: "+5% Intelligence", // Converted flat INT to percentage
        apply: (p) => {
          p.intPctBonus = (p.intPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Intelligence, +10% Active Attack Speed", // Converted flat INT to percentage
        apply: (p) => {
          p.intPctBonus = (p.intPctBonus || 0) + 0.15;
          p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Berserker: {
    name: "Berserker",
    bonuses: [
      {
        count: 2,
        desc: "+5% Strength", // Converted flat STR to percentage
        apply: (p) => {
          p.strPctBonus = (p.strPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Strength, +10% Idle Attack Speed", // Converted flat STR to percentage
        apply: (p) => {
          p.strPctBonus = (p.strPctBonus || 0) + 0.15;
          p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.1;
        },
      },
    ],
  },
  Scout: {
    name: "Scout",
    bonuses: [
      {
        count: 2,
        desc: "+5% Dexterity", // Converted flat DEX to percentage
        apply: (p) => {
          p.dexPctBonus = (p.dexPctBonus || 0) + 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Dexterity, +8% Move Speed", // Converted flat DEX & flat Speed to percentage
        apply: (p) => {
          p.dexPctBonus = (p.dexPctBonus || 0) + 0.15;
          p.moveSpeedPctBonus = (p.moveSpeedPctBonus || 0) + 0.08;
        },
      },
    ],
  },
  Fortune: {
    name: "Fortune",
    bonuses: [
      {
        count: 2,
        desc: "+15% Gold Multiplier",
        apply: (p) => {
          p.gold += 0.15;
        },
      },
      {
        count: 3,
        desc: "+30% Gold Multiplier, +10% Drop Rate Mod",
        apply: (p) => {
          p.gold += 0.3;
          p.drop += 0.1;
        },
      },
    ],
  },
  Mystic: {
    name: "Mystic",
    bonuses: [
      {
        count: 2,
        desc: "+5% Drop Quality Mod",
        apply: (p) => {
          p.qly += 0.05;
        },
      },
      {
        count: 3,
        desc: "+15% Drop Quality Mod, +5% Intelligence", // Converted flat INT to percentage
        apply: (p) => {
          p.qly += 0.15;
          p.intPctBonus = (p.intPctBonus || 0) + 0.05;
        },
      },
    ],
  },
  Alchemist: {
    name: "Alchemist",
    bonuses: [
      {
        count: 2,
        desc: "+10% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.1;
        },
      },
      {
        count: 3,
        desc: "+10% Attack Power, +10% Potion Duration",
        apply: (p) => {
          p.atkPctBonus = (p.atkPctBonus || 0) + 0.1;
        },
      },
    ],
  },
  Midas: {
    name: "Midas' Legacy",
    bonuses: [
      {
        count: 2,
        desc: "+20% Gold Multiplier",
        apply: (p) => {
          p.gold += 0.2;
        },
      },
      {
        count: 3,
        desc: "+40% Gold Multiplier. (Midas Touch: +1% Attack per 10% Gold Mult)",
        apply: (p) => {
          p.gold += 0.4;
          let goldBonusPct = Math.floor(p.gold * 10) * 0.01;
          p.atkPctBonus = (p.atkPctBonus || 0) + goldBonusPct;
        },
      },
    ],
  },
  Biohazard: {
    name: "Biohazard",
    bonuses: [
      {
        count: 2,
        desc: "+10% Max HP",
        apply: (p) => {
          p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.1;
        },
      },
      {
        count: 3,
        desc: "Corrosive Spores: 20% chance to poison targets for DoT & Life-stealing",
        apply: (p) => {
          p.hasCorrosiveSet = true;
        },
      },
    ],
  },
  Warlord: {
    name: "Warlord",
    bonuses: [
      {
        count: 2,
        desc: "+12% Crit Damage",
        apply: (p) => {
          p.critDamage += 0.12;
        },
      },
      {
        count: 3,
        desc: "Shattering Blows: Crits have 25% chance to trigger unblockable secondary hits",
        apply: (p) => {
          p.hasShatterSet = true;
        },
      },
    ],
  },
  VoidTouched: {
    name: "Void-Touched",
    bonuses: [
      {
        count: 2,
        desc: "+1.5% Rare Spawn Rate",
        apply: (p) => {
          p.rareSpawn += 0.015;
        },
      },
      {
        count: 3,
        desc: "Singularity: Spawning a Rare instantly triggers a 5s Frenzy Mode",
        apply: (p) => {
          p.hasSingularitySet = true;
        },
      },
    ],
  },
};

window.AchievementsData = [
  // 1. SLAYERS (Monster Slayings)
  {
    id: "slayer_1",
    name: "Slayer I",
    icon: "slayer",
    desc: "Slay 50 total dungeon monsters",
    reqType: "kills",
    reqValue: 50,
    stats: { atk: 2, atkPct: 0.01 },
  },
  {
    id: "slayer_2",
    name: "Slayer II",
    icon: "slayer",
    desc: "Slay 250 total dungeon monsters",
    reqType: "kills",
    reqValue: 250,
    stats: { atk: 5, atkPct: 0.02 },
  },
  {
    id: "slayer_3",
    name: "Slayer III",
    icon: "slayer",
    desc: "Slay 1,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 1000,
    stats: { atk: 10, atkPct: 0.03 },
  },
  {
    id: "slayer_4",
    name: "Slayer IV",
    icon: "slayer",
    desc: "Slay 5,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 5000,
    stats: { atk: 25, atkPct: 0.04 },
  },
  {
    id: "slayer_5",
    name: "Slayer V",
    icon: "slayer",
    desc: "Slay 20,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 20000,
    stats: { atk: 50, atkPct: 0.05 },
  },
  {
    id: "slayer_6",
    name: "Slayer VI",
    icon: "slayer",
    desc: "Slay 50,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 50000,
    stats: { atk: 100, atkPct: 0.06 },
  },
  {
    id: "slayer_7",
    name: "Slayer VII",
    icon: "slayer",
    desc: "Slay 150,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 150000,
    stats: { atk: 250, atkPct: 0.08 },
  },
  {
    id: "slayer_8",
    name: "Slayer VIII",
    icon: "slayer",
    desc: "Slay 500,000 total dungeon monsters",
    reqType: "kills",
    reqValue: 500000,
    stats: { atk: 500, atkPct: 0.12 },
  },

  // 2. FLOOR EXPLORERS (Dungeon Depth)
  {
    id: "floor_1",
    name: "Explorer I",
    icon: "stage",
    desc: "Clear Dungeon Floor 5",
    reqType: "floor",
    reqValue: 5,
    stats: { def: 1, defPct: 0.01 },
  },
  {
    id: "floor_2",
    name: "Explorer II",
    icon: "stage",
    desc: "Clear Dungeon Floor 12 (Sector 1 Boss)",
    reqType: "floor",
    reqValue: 12,
    stats: { def: 3, defPct: 0.02 },
  },
  {
    id: "floor_3",
    name: "Explorer III",
    icon: "stage",
    desc: "Clear Dungeon Floor 24 (Sector 2 Boss)",
    reqType: "floor",
    reqValue: 24,
    stats: { def: 8, defPct: 0.03 },
  },
  {
    id: "floor_4",
    name: "Explorer IV",
    icon: "stage",
    desc: "Clear Dungeon Floor 36 (Sector 3 Boss)",
    reqType: "floor",
    reqValue: 36,
    stats: { def: 15, defPct: 0.04 },
  },
  {
    id: "floor_5",
    name: "Explorer V",
    icon: "stage",
    desc: "Clear Dungeon Floor 48 (Sector 4 Boss)",
    reqType: "floor",
    reqValue: 48,
    stats: { def: 30, defPct: 0.05 },
  },
  {
    id: "floor_6",
    name: "Explorer VI",
    icon: "stage",
    desc: "Clear Dungeon Floor 72 (Sector 6 Boss)",
    reqType: "floor",
    reqValue: 72,
    stats: { def: 60, defPct: 0.07 },
  },
  {
    id: "floor_7",
    name: "Explorer VII",
    icon: "stage",
    desc: "Clear Dungeon Floor 100",
    reqType: "floor",
    reqValue: 100,
    stats: { def: 120, defPct: 0.1 },
  },
  {
    id: "floor_8",
    name: "Explorer VIII",
    icon: "stage",
    desc: "Clear Dungeon Floor 150",
    reqType: "floor",
    reqValue: 150,
    stats: { def: 250, defPct: 0.15 },
  },

  // 3. WEALTH & TREASURY (Total Gold Earned)
  {
    id: "hoarder_1",
    name: "Hoarder I",
    icon: "hoarder",
    desc: "Earn 10,000 total Gold",
    reqType: "gold",
    reqValue: 10000,
    stats: { gold: 0.01, maxHp: 10 },
  },
  {
    id: "hoarder_2",
    name: "Hoarder II",
    icon: "hoarder",
    desc: "Earn 100,000 total Gold",
    reqType: "gold",
    reqValue: 100000,
    stats: { gold: 0.02, maxHp: 25 },
  },
  {
    id: "hoarder_3",
    name: "Hoarder III",
    icon: "hoarder",
    desc: "Earn 1,000,000 total Gold",
    reqType: "gold",
    reqValue: 1000000,
    stats: { gold: 0.03, maxHp: 60 },
  },
  {
    id: "hoarder_4",
    name: "Hoarder IV",
    icon: "hoarder",
    desc: "Earn 10,000,000 total Gold",
    reqType: "gold",
    reqValue: 10000000,
    stats: { gold: 0.04, maxHp: 150 },
  },
  {
    id: "hoarder_5",
    name: "Hoarder V",
    icon: "hoarder",
    desc: "Earn 100,000,000 total Gold",
    reqType: "gold",
    reqValue: 100000000,
    stats: { gold: 0.05, maxHp: 400 },
  },
  {
    id: "hoarder_6",
    name: "Hoarder VI",
    icon: "hoarder",
    desc: "Earn 1,000,000,000 total Gold",
    reqType: "gold",
    reqValue: 1000000000,
    stats: { gold: 0.07, maxHp: 1000 },
  },
  {
    id: "hoarder_7",
    name: "Hoarder VII",
    icon: "hoarder",
    desc: "Earn 10,000,000,000 total Gold",
    reqType: "gold",
    reqValue: 10000000000,
    stats: { gold: 0.1, maxHp: 2500 },
  },
  {
    id: "hoarder_8",
    name: "Hoarder VIII",
    icon: "hoarder",
    desc: "Earn 100,000,000,000 total Gold",
    reqType: "gold",
    reqValue: 100000000000,
    stats: { gold: 0.15, maxHp: 6000 },
  },

  // 4. EXTRACTION SURVIVORS (Successful Extractions)
  {
    id: "extract_1",
    name: "Survivor I",
    icon: "d_go",
    desc: "Complete 1 successful Extraction",
    reqType: "extract",
    reqValue: 1,
    stats: { maxHpPct: 0.01, expPct: 0.02 },
  },
  {
    id: "extract_2",
    name: "Survivor II",
    icon: "d_go",
    desc: "Complete 5 successful Extractions",
    reqType: "extract",
    reqValue: 5,
    stats: { maxHpPct: 0.02, expPct: 0.03 },
  },
  {
    id: "extract_3",
    name: "Survivor III",
    icon: "d_go",
    desc: "Complete 15 successful Extractions",
    reqType: "extract",
    reqValue: 15,
    stats: { maxHpPct: 0.03, expPct: 0.04 },
  },
  {
    id: "extract_4",
    name: "Survivor IV",
    icon: "d_go",
    desc: "Complete 40 successful Extractions",
    reqType: "extract",
    reqValue: 40,
    stats: { maxHpPct: 0.04, expPct: 0.05 },
  },
  {
    id: "extract_5",
    name: "Survivor V",
    icon: "d_go",
    desc: "Complete 100 successful Extractions",
    reqType: "extract",
    reqValue: 100,
    stats: { maxHpPct: 0.05, expPct: 0.07 },
  },
  {
    id: "extract_6",
    name: "Survivor VI",
    icon: "d_go",
    desc: "Complete 250 successful Extractions",
    reqType: "extract",
    reqValue: 250,
    stats: { maxHpPct: 0.07, expPct: 0.1 },
  },
  {
    id: "extract_7",
    name: "Survivor VII",
    icon: "d_go",
    desc: "Complete 500 successful Extractions",
    reqType: "extract",
    reqValue: 500,
    stats: { maxHpPct: 0.1, expPct: 0.12 },
  },
  {
    id: "extract_8",
    name: "Survivor VIII",
    icon: "d_go",
    desc: "Complete 1,000 successful Extractions",
    reqType: "extract",
    reqValue: 1000,
    stats: { maxHpPct: 0.15, expPct: 0.15 },
  },

  // 5. SCRAP COLLECTORS (Salvaging)
  {
    id: "salvage_1",
    name: "Collector I",
    icon: "salvage",
    desc: "Salvage 10 items",
    reqType: "salvage",
    reqValue: 10,
    stats: { drop: 0.01, qly: 0.01 },
  },
  {
    id: "salvage_2",
    name: "Collector II",
    icon: "salvage",
    desc: "Salvage 50 items",
    reqType: "salvage",
    reqValue: 50,
    stats: { drop: 0.02, qly: 0.02 },
  },
  {
    id: "salvage_3",
    name: "Collector III",
    icon: "salvage",
    desc: "Salvage 200 items",
    reqType: "salvage",
    reqValue: 200,
    stats: { drop: 0.03, qly: 0.03 },
  },
  {
    id: "salvage_4",
    name: "Collector IV",
    icon: "salvage",
    desc: "Salvage 750 items",
    reqType: "salvage",
    reqValue: 750,
    stats: { drop: 0.04, qly: 0.04 },
  },
  {
    id: "salvage_5",
    name: "Collector V",
    icon: "salvage",
    desc: "Salvage 2,500 items",
    reqType: "salvage",
    reqValue: 2500,
    stats: { drop: 0.05, qly: 0.05 },
  },
  {
    id: "salvage_6",
    name: "Collector VI",
    icon: "salvage",
    desc: "Salvage 7,500 items",
    reqType: "salvage",
    reqValue: 7500,
    stats: { drop: 0.07, qly: 0.07 },
  },
  {
    id: "salvage_7",
    name: "Collector VII",
    icon: "salvage",
    desc: "Salvage 20,000 items",
    reqType: "salvage",
    reqValue: 20000,
    stats: { drop: 0.1, qly: 0.1 },
  },
  {
    id: "salvage_8",
    name: "Collector VIII",
    icon: "salvage",
    desc: "Salvage 50,000 items",
    reqType: "salvage",
    reqValue: 50000,
    stats: { drop: 0.15, qly: 0.15 },
  },

  // 6. ATTUNEMENT MASTERS (Slot Tempering)
  {
    id: "forge_1",
    name: "Blacksmith I",
    icon: "forge",
    desc: "Attune equipment slots 5 times",
    reqType: "temper",
    reqValue: 5,
    stats: { str: 1, strPct: 0.01 },
  },
  {
    id: "forge_2",
    name: "Blacksmith II",
    icon: "forge",
    desc: "Attune equipment slots 25 times",
    reqType: "temper",
    reqValue: 25,
    stats: { str: 3, strPct: 0.02 },
  },
  {
    id: "forge_3",
    name: "Blacksmith III",
    icon: "forge",
    desc: "Attune equipment slots 100 times",
    reqType: "temper",
    reqValue: 100,
    stats: { str: 8, strPct: 0.03 },
  },
  {
    id: "forge_4",
    name: "Blacksmith IV",
    icon: "forge",
    desc: "Attune equipment slots 250 times",
    reqType: "temper",
    reqValue: 250,
    stats: { str: 18, strPct: 0.04 },
  },
  {
    id: "forge_5",
    name: "Blacksmith V",
    icon: "forge",
    desc: "Attune equipment slots 500 times",
    reqType: "temper",
    reqValue: 500,
    stats: { str: 40, strPct: 0.05 },
  },
  {
    id: "forge_6",
    name: "Blacksmith VI",
    icon: "forge",
    desc: "Attune equipment slots 1,000 times",
    reqType: "temper",
    reqValue: 1000,
    stats: { str: 80, strPct: 0.07 },
  },
  {
    id: "forge_7",
    name: "Blacksmith VII",
    icon: "forge",
    desc: "Attune equipment slots 2,500 times",
    reqType: "temper",
    reqValue: 2500,
    stats: { str: 160, strPct: 0.1 },
  },
  {
    id: "forge_8",
    name: "Blacksmith VIII",
    icon: "forge",
    desc: "Attune equipment slots 5,000 times",
    reqType: "temper",
    reqValue: 5000,
    stats: { str: 350, strPct: 0.15 },
  },

  // 7. REFORGERS (Modifier Re-rolls)
  {
    id: "refo_1",
    name: "Reforger I",
    icon: "refo",
    desc: "Reforge gear modifiers 5 times",
    reqType: "reforges",
    reqValue: 5,
    stats: { dex: 1, dexPct: 0.01 },
  },
  {
    id: "refo_2",
    name: "Reforger II",
    icon: "refo",
    desc: "Reforge gear modifiers 20 times",
    reqType: "reforges",
    reqValue: 20,
    stats: { dex: 3, dexPct: 0.02 },
  },
  {
    id: "refo_3",
    name: "Reforger III",
    icon: "refo",
    desc: "Reforge gear modifiers 50 times",
    reqType: "reforges",
    reqValue: 50,
    stats: { dex: 8, dexPct: 0.03 },
  },
  {
    id: "refo_4",
    name: "Reforger IV",
    icon: "refo",
    desc: "Reforge gear modifiers 150 times",
    reqType: "reforges",
    reqValue: 150,
    stats: { dex: 18, dexPct: 0.04 },
  },
  {
    id: "refo_5",
    name: "Reforger V",
    icon: "refo",
    desc: "Reforge gear modifiers 300 times",
    reqType: "reforges",
    reqValue: 300,
    stats: { dex: 40, dexPct: 0.05 },
  },
  {
    id: "refo_6",
    name: "Reforger VI",
    icon: "refo",
    desc: "Reforge gear modifiers 600 times",
    reqType: "reforges",
    reqValue: 600,
    stats: { dex: 80, dexPct: 0.07 },
  },
  {
    id: "refo_7",
    name: "Reforger VII",
    icon: "refo",
    desc: "Reforge gear modifiers 1,200 times",
    reqType: "reforges",
    reqValue: 1200,
    stats: { dex: 160, dexPct: 0.1 },
  },
  {
    id: "refo_8",
    name: "Reforger VIII",
    icon: "refo",
    desc: "Reforge gear modifiers 2,500 times",
    reqType: "reforges",
    reqValue: 2500,
    stats: { dex: 350, dexPct: 0.15 },
  },

  // 8. RUNIC SCRIBES (Celestial Enchantments)
  {
    id: "enchant_1",
    name: "Scribe I",
    icon: "enchant",
    desc: "Infuse 1 Celestial Enchantment",
    reqType: "enchant",
    reqValue: 1,
    stats: { int: 1, intPct: 0.01 },
  },
  {
    id: "enchant_2",
    name: "Scribe II",
    icon: "enchant",
    desc: "Infuse 5 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 5,
    stats: { int: 3, intPct: 0.02 },
  },
  {
    id: "enchant_3",
    name: "Scribe III",
    icon: "enchant",
    desc: "Infuse 20 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 20,
    stats: { int: 8, intPct: 0.03 },
  },
  {
    id: "enchant_4",
    name: "Scribe IV",
    icon: "enchant",
    desc: "Infuse 50 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 50,
    stats: { int: 18, intPct: 0.04 },
  },
  {
    id: "enchant_5",
    name: "Scribe V",
    icon: "enchant",
    desc: "Infuse 150 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 150,
    stats: { int: 40, intPct: 0.05 },
  },
  {
    id: "enchant_6",
    name: "Scribe VI",
    icon: "enchant",
    desc: "Infuse 350 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 350,
    stats: { int: 80, intPct: 0.07 },
  },
  {
    id: "enchant_7",
    name: "Scribe VII",
    icon: "enchant",
    desc: "Infuse 800 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 800,
    stats: { int: 160, intPct: 0.1 },
  },
  {
    id: "enchant_8",
    name: "Scribe VIII",
    icon: "enchant",
    desc: "Infuse 2,000 Celestial Enchantments",
    reqType: "enchant",
    reqValue: 2000,
    stats: { int: 350, intPct: 0.15 },
  },

  // 9. DEFENSIVE AEGIS (Blocks & Parries)
  {
    id: "defl_1",
    name: "Unbreakable Aegis I",
    icon: "defl",
    desc: "Deflect (Block or Parry) 25 attacks",
    reqType: "deflections",
    reqValue: 25,
    stats: { def: 2, defPct: 0.01 },
  },
  {
    id: "defl_2",
    name: "Unbreakable Aegis II",
    icon: "defl",
    desc: "Deflect (Block or Parry) 100 attacks",
    reqType: "deflections",
    reqValue: 100,
    stats: { def: 5, defPct: 0.02 },
  },
  {
    id: "defl_3",
    name: "Unbreakable Aegis III",
    icon: "defl",
    desc: "Deflect (Block or Parry) 500 attacks",
    reqType: "deflections",
    reqValue: 500,
    stats: { def: 12, defPct: 0.03 },
  },
  {
    id: "defl_4",
    name: "Unbreakable Aegis IV",
    icon: "defl",
    desc: "Deflect (Block or Parry) 2,000 attacks",
    reqType: "deflections",
    reqValue: 2000,
    stats: { def: 25, defPct: 0.04 },
  },
  {
    id: "defl_5",
    name: "Unbreakable Aegis V",
    icon: "defl",
    desc: "Deflect (Block or Parry) 7,500 attacks",
    reqType: "deflections",
    reqValue: 7500,
    stats: { def: 60, defPct: 0.05 },
  },
  {
    id: "defl_6",
    name: "Unbreakable Aegis VI",
    icon: "defl",
    desc: "Deflect (Block or Parry) 20,000 attacks",
    reqType: "deflections",
    reqValue: 20000,
    stats: { def: 120, defPct: 0.07 },
  },
  {
    id: "defl_7",
    name: "Unbreakable Aegis VII",
    icon: "defl",
    desc: "Deflect (Block or Parry) 50,000 attacks",
    reqType: "deflections",
    reqValue: 50000,
    stats: { def: 250, defPct: 0.1 },
  },
  {
    id: "defl_8",
    name: "Unbreakable Aegis VIII",
    icon: "defl",
    desc: "Deflect (Block or Parry) 100,000 attacks",
    reqType: "deflections",
    reqValue: 100000,
    stats: { def: 500, defPct: 0.15 },
  },

  // 10. RARE HUNTERS (Elites & Rare Spawns Slain)
  {
    id: "rare_s_1",
    name: "Rare Hunter I",
    icon: "rare_s",
    desc: "Slay 5 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 5,
    stats: { rareSpawn: 0.001, qly: 0.01 },
  },
  {
    id: "rare_s_2",
    name: "Rare Hunter II",
    icon: "rare_s",
    desc: "Slay 25 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 25,
    stats: { rareSpawn: 0.002, qly: 0.02 },
  },
  {
    id: "rare_s_3",
    name: "Rare Hunter III",
    icon: "rare_s",
    desc: "Slay 100 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 100,
    stats: { rareSpawn: 0.003, qly: 0.03 },
  },
  {
    id: "rare_s_4",
    name: "Rare Hunter IV",
    icon: "rare_s",
    desc: "Slay 350 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 350,
    stats: { rareSpawn: 0.004, qly: 0.04 },
  },
  {
    id: "rare_s_5",
    name: "Rare Hunter V",
    icon: "rare_s",
    desc: "Slay 1,000 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 1000,
    stats: { rareSpawn: 0.005, qly: 0.05 },
  },
  {
    id: "rare_s_6",
    name: "Rare Hunter VI",
    icon: "rare_s",
    desc: "Slay 2,500 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 2500,
    stats: { rareSpawn: 0.007, qly: 0.07 },
  },
  {
    id: "rare_s_7",
    name: "Rare Hunter VII",
    icon: "rare_s",
    desc: "Slay 7,500 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 7500,
    stats: { rareSpawn: 0.01, qly: 0.1 },
  },
  {
    id: "rare_s_8",
    name: "Rare Hunter VIII",
    icon: "rare_s",
    desc: "Slay 20,000 Rare or Elite monsters",
    reqType: "rare_spawns",
    reqValue: 20000,
    stats: { rareSpawn: 0.015, qly: 0.15 },
  },

  // 11. COLOSSUS STRIKE (Single Hit Record)
  {
    id: "hit_1",
    name: "Colossus Strike I",
    icon: "hit",
    desc: "Deal 250 single hit damage",
    reqType: "single_hit",
    reqValue: 250,
    stats: { critChance: 0.002, critDamage: 0.01 },
  },
  {
    id: "hit_2",
    name: "Colossus Strike II",
    icon: "hit",
    desc: "Deal 2,500 single hit damage",
    reqType: "single_hit",
    reqValue: 2500,
    stats: { critChance: 0.004, critDamage: 0.02 },
  },
  {
    id: "hit_3",
    name: "Colossus Strike III",
    icon: "hit",
    desc: "Deal 25,000 single hit damage",
    reqType: "single_hit",
    reqValue: 25000,
    stats: { critChance: 0.006, critDamage: 0.03 },
  },
  {
    id: "hit_4",
    name: "Colossus Strike IV",
    icon: "hit",
    desc: "Deal 250,000 single hit damage",
    reqType: "single_hit",
    reqValue: 250000,
    stats: { critChance: 0.008, critDamage: 0.04 },
  },
  {
    id: "hit_5",
    name: "Colossus Strike V",
    icon: "hit",
    desc: "Deal 2,500,000 single hit damage",
    reqType: "single_hit",
    reqValue: 2500000,
    stats: { critChance: 0.01, critDamage: 0.05 },
  },
  {
    id: "hit_6",
    name: "Colossus Strike VI",
    icon: "hit",
    desc: "Deal 25,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 25000000,
    stats: { critChance: 0.015, critDamage: 0.07 },
  },
  {
    id: "hit_7",
    name: "Colossus Strike VII",
    icon: "hit",
    desc: "Deal 250,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 250000000,
    stats: { critChance: 0.02, critDamage: 0.1 },
  },
  {
    id: "hit_8",
    name: "Colossus Strike VIII",
    icon: "hit",
    desc: "Deal 2,500,000,000 single hit damage",
    reqType: "single_hit",
    reqValue: 2500000000,
    stats: { critChance: 0.03, critDamage: 0.15 },
  },

  // 12. INVESTORS (Combined Gold Upgrades)
  {
    id: "g_up_1",
    name: "Investor I",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 5",
    reqType: "gold_upgrades",
    reqValue: 5,
    stats: { gold: 0.01, int: 1 },
  },
  {
    id: "g_up_2",
    name: "Investor II",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 15",
    reqType: "gold_upgrades",
    reqValue: 15,
    stats: { gold: 0.02, int: 3 },
  },
  {
    id: "g_up_3",
    name: "Investor III",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 30",
    reqType: "gold_upgrades",
    reqValue: 30,
    stats: { gold: 0.03, int: 8 },
  },
  {
    id: "g_up_4",
    name: "Investor IV",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 60",
    reqType: "gold_upgrades",
    reqValue: 60,
    stats: { gold: 0.04, int: 18 },
  },
  {
    id: "g_up_5",
    name: "Investor V",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 100",
    reqType: "gold_upgrades",
    reqValue: 100,
    stats: { gold: 0.05, int: 40 },
  },
  {
    id: "g_up_6",
    name: "Investor VI",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 150",
    reqType: "gold_upgrades",
    reqValue: 150,
    stats: { gold: 0.07, int: 80 },
  },
  {
    id: "g_up_7",
    name: "Investor VII",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 220",
    reqType: "gold_upgrades",
    reqValue: 220,
    stats: { gold: 0.1, int: 160 },
  },
  {
    id: "g_up_8",
    name: "Investor VIII",
    icon: "g_up",
    desc: "Combined Gold Upgrade level 300",
    reqType: "gold_upgrades",
    reqValue: 300,
    stats: { gold: 0.15, int: 350 },
  },

  // ==========================================================================
  // VALOR FEATS / SINGLE-TIER ACHIEVEMENTS
  // ==========================================================================
  {
    id: "sing_murphys_law",
    name: "Focused Attunement",
    icon: "sing",
    desc: "Attune any single equipment slot to Level 50 or higher",
    isSingleTier: true,
    stats: { qly: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_recovery",
    name: "Lost & Found",
    icon: "sing",
    desc: "Retrieve your lost equipment from a Recovery Chest in the dungeon",
    isSingleTier: true,
    stats: { drop: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_soul_bound",
    name: "Soul-Bound Veteran",
    icon: "sing",
    desc: "Soul-bind 3 equipped items at the Deployment Altar for a single run",
    isSingleTier: true,
    stats: { defPct: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_unified_set",
    name: "Unified Aesthetics",
    icon: "sing",
    desc: "Equip 3 or more pieces from the exact same named Dungeon Set",
    isSingleTier: true,
    stats: { atkPct: 0.05, defPct: 0.05 },
  },
  {
    id: "sing_golden_touch",
    name: "Golden Touch",
    icon: "sing",
    desc: "Equip 3 Gold-boosting Unique Artifacts simultaneously",
    isSingleTier: true,
    stats: { gold: 0.15, goldMulti: 0.1 },
  },
  {
    id: "sing_full_bag",
    name: "Heavy Haul",
    icon: "sing",
    desc: "Successfully extract with a completely full carried equipment satchel",
    isSingleTier: true,
    stats: { qly: 0.05, gold: 0.05 },
  },
  {
    id: "sing_overkill",
    name: "Total Overkill",
    icon: "sing",
    desc: "Deal a critical hit that exceeds a dungeon monster's max HP by 1,000%+",
    isSingleTier: true,
    stats: { critDamage: 0.15, atkPct: 0.05 },
  },
  {
    id: "sing_exact_change",
    name: "Exact Change",
    icon: "sing",
    desc: "Buy an item or upgrade that brings your Gold balance to exactly 0",
    isSingleTier: true,
    stats: { gold: 0.1, goldMulti: 0.05 },
  },
  {
    id: "sing_night_owl",
    name: "Night Owl",
    icon: "sing",
    desc: "Slay any dungeon monster between 12:00 AM and 4:00 AM local time",
    isSingleTier: true,
    stats: { critDamage: 0.05, atkPct: 0.03 },
  },
  {
    id: "sing_early_bird",
    name: "Early Bird",
    icon: "sing",
    desc: "Slay any dungeon monster between 5:00 AM and 8:00 AM local time",
    isSingleTier: true,
    stats: { expPct: 0.05, maxHpPct: 0.03 },
  },
  {
    id: "sing_weekend_warrior",
    name: "Weekend Warrior",
    icon: "sing",
    desc: "Slay monsters in the dungeon on a Saturday or Sunday",
    isSingleTier: true,
    stats: { drop: 0.05, gold: 0.05 },
  },
];

window.slotNouns = {
  weapon: [
    "Greatsword",
    "Longsword",
    "Halberd",
    "Warhammer",
    "Battleaxe",
    "Broadsword",
    "Flanged Mace",
    "Claymore",
  ],
  subweapon: {
    shield: [
      "Kite Shield",
      "Tower Shield",
      "Buckler",
      "Aegis",
      "Heater Shield",
    ],
    dagger: ["Kris", "Stiletto", "Baselard", "Dirk", "Main-Gauche"],
    tome: ["Grimoire", "Spellbook", "Codex", "Lexicon", "Chronicle"],
  },
  helmet: ["Greathelm", "Armet", "Visor"],
  chest: [
    "Hauberk",
    "Cuirass",
    "Brigandine",
    "Plate Mail",
    "Chain Mail",
    "Doublet",
  ],
  leggings: ["Greaves", "Legplates", "Chausses", "Cuisses"],
  boots: ["Sabatons", "Sollerets", "Steel Boots", "Treads"],
  overall: ["Exosuit", "Inquisitor Robes", "Full Plate Armor", "Trenchcoat"],
  ring: ["Signet Ring", "Loop Ring", "Band Ring", "Seal Ring"],
};

window.COSMETIC_SKINS = {
  default: {
    id: "default",
    name: "Steel Grey Color",
    desc: "The standard metallic iron polish of the royal guard.",
    color: "#bdc3c7",
    cost: 0,
    currency: "Gold",
  },
  void: {
    id: "void",
    name: "Abyssal Void Color",
    desc: "A swirling cosmic color that turns fabrics into deep black holes.",
    color: "#8e44ad",
    cost: 1000,
    currency: "Luminous Soul",
  },
  crimson: {
    id: "crimson",
    name: "Dragon Blood Color",
    desc: "Stained with ancient drake blood for a dark crimson finish.",
    color: "#e74c3c",
    cost: 1000,
    currency: "Luminous Soul",
  },
  gilded: {
    id: "gilded",
    name: "Royal Gold Color",
    desc: "A rich gold leaf lacquer that shines with absolute brilliance.",
    color: "#f1c40f",
    cost: 1000,
    currency: "Luminous Soul",
  },
  celestial: {
    id: "celestial",
    name: "Nebula Star Color",
    desc: "Infused with active stardust that shimmers with stellar colors.",
    color: "#00d2ff",
    cost: 1000,
    currency: "Luminous Soul",
  },
};

window.COSMETIC_COSTUMES = {
  knight: {
    id: "knight",
    name: "Knight's Armor",
    desc: "The default knight armor.",
    cost: 0,
    currency: "Gold",
    color: "#bdc3c7",
  },
  shinobi: {
    id: "shinobi",
    name: "Sleek Shinobi Garb",
    desc: "Woven from silent shadow threads. Enhances stealth profile and swift parries.",
    cost: 2500,
    currency: "Luminous Soul",
    color: "#3498db",
  },
  archmage: {
    id: "archmage",
    name: "Archmage Robes",
    desc: "Infused with residual mana to project an active arcane barrier.",
    cost: 2500,
    currency: "Luminous Soul",
    color: "#9b59b6",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Exosuit",
    desc: "Futuristic composite grid-suit driven by a pulsating neon core.",
    cost: 2500,
    currency: "Luminous Soul",
    color: "#00d2ff",
  },
  jackolantern: {
    id: "jackolantern",
    name: "Jack-O'-Lantern",
    desc: "Spooky harvest armor capped with a glowing carved pumpkin helmet. (Autumn/Halloween Seasonal)",
    cost: 1000,
    currency: "Luminous Soul",
    color: "#e67e22",
  },
  santashelper: {
    id: "santashelper",
    name: "Yule Sovereign",
    desc: "Sleek gold-trimmed charcoal plate armor paired with a majestic silver-white helmet, a glowing frost visor, a holiday velvet cloak, and a rune-bound satchel. (Winter/Holiday Seasonal)",
    cost: 1000,
    currency: "Luminous Soul",
    color: "#ff4757",
  },
  midsummer: {
    id: "midsummer",
    name: "Solstice Druid Garb",
    desc: "Leafy forest tunic with comfortable straps and a crown of seasonal wildflowers. (Summer/Solstice Seasonal)",
    cost: 1000,
    currency: "Luminous Soul",
    color: "#2ecc71",
  },
};

window.CAVERN_BUFFS = [
  // --- STAT-BASED BUFFS (Available from Tier 1 up, scaling magnitudes) ---
  {
    id: "giant_might",
    name: "Giant Might",
    desc: "Attack power increased based on star rating.",
    type: "stat",
    statKey: "atk",
    minStars: 0,
    dangerRating: 0,
  },
  {
    id: "vital_fountain",
    name: "Vital Fountain",
    desc: "Maximum health increased based on star rating.",
    type: "stat",
    statKey: "maxHp",
    minStars: 0,
    dangerRating: 0,
  },
  {
    id: "iron_aegis",
    name: "Iron Aegis",
    desc: "Armor defense increased based on star rating.",
    type: "stat",
    statKey: "def",
    minStars: 0,
    dangerRating: 0,
  },
  {
    id: "swift_strikes",
    name: "Swift Strikes",
    desc: "Movement speed increased based on star rating.",
    type: "stat",
    statKey: "moveSpeed",
    minStars: 1,
    dangerRating: 0,
  },
  {
    id: "unstable_surge",
    name: "Unstable Surge",
    desc: "Critical strike chance increased based on star rating.",
    type: "stat",
    statKey: "critChance",
    minStars: 1,
    dangerRating: 0,
  },
  {
    id: "shatter_frenzy",
    name: "Shatter Frenzy",
    desc: "Critical strike damage increased based on star rating.",
    type: "stat",
    statKey: "critDamage",
    minStars: 2,
    dangerRating: 0,
  },
  {
    id: "deflection_vortex",
    name: "Deflection Vortex",
    desc: "Block and parry rates increased based on star rating.",
    type: "stat",
    statKey: "block", // Handled by applying to both block and parry
    minStars: 2,
    dangerRating: 0,
  },

  // --- INTERACTIVE BUFFS (Locked to higher rarities) ---
  {
    id: "perfect_strike",
    name: "Perfect Strike",
    desc: "Concentric reticles appear over monsters. Strike them in alignment for 5x damage.",
    type: "interactive",
    minStars: 3,
    dangerRating: 0,
  },
  {
    id: "aetheric_conduit",
    name: "Aetheric Conduit",
    desc: "Discharging ground pylons casts a chain-lightning storm.",
    type: "interactive",
    minStars: 3,
    dangerRating: 0,
  },
  {
    id: "glimmering_pixie",
    name: "Glimmering Pixie",
    desc: "Capturing pixies triggers a random supernal potion elixir.",
    type: "interactive",
    minStars: 3,
    dangerRating: 0,
  },
  {
    id: "soul_harvest",
    name: "Soul Harvest",
    desc: "Slaying targets has a chance to animate helpful spectral wisps to distract foes.",
    type: "interactive",
    minStars: 3,
    dangerRating: 0,
  },
  {
    id: "aetheric_spark",
    name: "Aetheric Spark",
    desc: "Pulsing ground sparks spawn. Step on 5 sequentially to trigger Astral Awakening.",
    type: "interactive",
    minStars: 4,
    dangerRating: 0,
  },
  {
    id: "temporal_echo",
    name: "Temporal Echo",
    desc: "Slashes/spells leave behind echoes that strike again at 35% power after 1.2 seconds.",
    type: "interactive",
    minStars: 4,
    dangerRating: 0,
  },
  {
    id: "astral_conjunction",
    name: "Astral Conjunction",
    desc: "Upon room entry, a cosmic laser strikes a random target, spreading fire to adjacent foes.",
    type: "interactive",
    minStars: 5,
    dangerRating: 0,
  },
  {
    id: "aetheric_surge",
    name: "Aetheric Surge",
    desc: "Catalyzes class offhands. Tomes gain +75% Spell Power and +20% Spell Chance. Shields gain +100% Bash/Reflect Power and +15% Block Cap. Daggers gain 3.0x Riposte Damage and +15% Parry Cap.",
    type: "interactive",
    minStars: 4,
    dangerRating: 0,
  },
];

window.CAVERN_DEBUFFS = [
  // --- STAT-BASED PENALTIES (Scale with stars) ---
  {
    id: "dull_blades",
    name: "Dull Blades",
    desc: "Decreases Attack Power.",
    type: "stat",
    statKey: "atk",
    minStars: 0,
    dangerRating: 5,
  },
  {
    id: "frail_vessel",
    name: "Frail Vessel",
    desc: "Decreases Maximum Health.",
    type: "stat",
    statKey: "maxHp",
    minStars: 0,
    dangerRating: 5,
  },
  {
    id: "shattered_armour",
    name: "Shattered Armour",
    desc: "Decreases Defense Armor.",
    type: "stat",
    statKey: "def",
    minStars: 0,
    dangerRating: 5,
  },
  {
    id: "heavy_mist",
    name: "Heavy Mist",
    desc: "Decreases Movement Speed.",
    type: "stat",
    statKey: "moveSpeed",
    minStars: 1,
    dangerRating: 10,
  },
  {
    id: "blind_spot",
    name: "Blind Spot",
    desc: "Decreases Critical Strike Chance.",
    type: "stat",
    statKey: "critChance",
    minStars: 1,
    dangerRating: 10,
  },

  // --- INTERACTIVE HAZARDS & DEBUFFS (Locked to higher rarities) ---
  {
    id: "anomalous_shards",
    name: "Anomalous Shards",
    desc: "Slowing ground crystals erupt. Walk over and shatter them to lift the penalty.",
    type: "interactive",
    minStars: 2,
    dangerRating: 15,
  },
  {
    id: "void_rupture",
    name: "Void Rupture",
    desc: "Health-draining tears open. Smash their stabilizers to claim a protective shield.",
    type: "interactive",
    minStars: 3,
    dangerRating: 20,
  },
  {
    id: "blood_toll",
    name: "Blood Toll",
    desc: "Opening chest reliquaries siphons 12% of your current HP.",
    type: "interactive",
    minStars: 3,
    dangerRating: 15,
  },
  {
    id: "shrouded_sight",
    name: "Shrouded Sight",
    desc: "Dungeon sight is halved but chest spawn frequencies are doubled.",
    type: "interactive",
    minStars: 3,
    dangerRating: 20,
  },
  {
    id: "unstable_crust",
    name: "Unstable Crust",
    desc: "The floor slowly crumbles. Every 20 seconds, random tiles collapse into Void holes.",
    type: "interactive",
    minStars: 4,
    dangerRating: 25,
  },
  {
    id: "spreading_fatigue",
    name: "Spreading Fatigue",
    desc: "Lose 1.5% speed per second. Slay monsters or break pottery to reset back to full.",
    type: "interactive",
    minStars: 5,
    dangerRating: 30,
  },
  {
    id: "molten_slag",
    name: "Molten Slag",
    desc: "Movement builds friction charges. Reaching 100 burns you and leaves magma pools.",
    type: "interactive",
    minStars: 5,
    dangerRating: 30,
  },
  {
    id: "deaths_hour",
    name: "Death's Hour",
    desc: "Unleashes the slow-moving, wall-passing, one-hit-kill Calamity Specter onto the floor.",
    type: "interactive",
    minStars: 5,
    dangerRating: 40,
  },
  {
    id: "elite_infestation",
    name: "Elite Infestation",
    desc: "Every single spawned monster becomes an Elite with a random support affix.",
    type: "interactive",
    minStars: 5,
    dangerRating: 45,
  },
  {
    id: "slick_ice",
    name: "Slick Ice",
    desc: "Ice covers the cavern floor. Deceleration is severely reduced, causing you to slide dynamically.",
    type: "interactive",
    minStars: 2,
    dangerRating: 15,
  },
  {
    id: "magnetic_creep",
    name: "Magnetic Creep",
    desc: "Gravitational shift in the cavern pulls you slowly toward the nearest structural wall.",
    type: "interactive",
    minStars: 2,
    dangerRating: 15,
  },
  {
    id: "creeping_miasma",
    name: "Creeping Miasma",
    desc: "Poisonous miasma closes in from the room boundaries. Step outside the shrinking safe zone to take 2% Max HP damage per second.",
    type: "interactive",
    minStars: 3,
    dangerRating: 15,
  },
  {
    id: "abyssal_decay",
    name: "Abyssal Decay",
    desc: "Corrosive abyss siphons your soul. 15% of all damage taken permanently shrinks your Maximum HP for the remainder of this run.",
    type: "interactive",
    minStars: 3,
    dangerRating: 25,
  },
  {
    id: "weapon_lock",
    name: "Weapon Lock",
    desc: "A heavy curse locks your main-hand weapon, limiting its damage to 1. Offhand proc rates are doubled, and offhand cooldowns are halved.",
    type: "interactive",
    minStars: 4,
    dangerRating: 35,
  },
  {
    id: "regenerative_brood",
    name: "Regenerative Brood",
    desc: "Dungeon monsters recover 3% of their Maximum HP every 2 seconds if they have not taken damage recently.",
    type: "interactive",
    minStars: 2,
    dangerRating: 15,
  },
  {
    id: "kinetic_reflectors",
    name: "Kinetic Reflectors",
    desc: "Monsters construct active kinetic shields in front of them, deflecting all frontal attacks and reflecting 20% of the damage back to you.",
    type: "interactive",
    minStars: 3,
    dangerRating: 20,
  },
  {
    id: "spawning_division",
    name: "Spawning Division",
    desc: "Monsters fracture upon death, dividing into two minor, low-HP spores or slimes.",
    type: "interactive",
    minStars: 3,
    dangerRating: 25,
  },
];

window.ASTRAL_SHOP_STOCK = [
  {
    name: "Astral Singularity Cache",
    cost: 7500,
    color: "#a855f7",
    desc: "A locked container vibrating with concentrated void energy. Unboxes a guaranteed 5★ Uber Unique item scaled to your lifetime peak stage.",
  },
  {
    name: "Astral Artifact Cache",
    cost: 4500,
    color: "#1abc9c",
    desc: "A pristine crystalline box containing a guaranteed random Unique Artifact, plus 2-4 Catalyst Cores.",
  },
  {
    name: "Catalyst Core",
    cost: 120,
    color: "#2ecc71",
    desc: "Spent at the Forge to temper Unique Artifacts.",
  },
  {
    name: "Ancient Core",
    cost: 80,
    color: "#e74c3c",
    desc: "Sacrifice at the Altar to summon a Guardian.",
  },
  {
    name: "Overlord's Sigil",
    cost: 180,
    color: "#1abc9c",
    desc: "Spent at the Forge to lock and re-roll equipment modifiers.",
  },
  {
    name: "Luminous Soul",
    cost: 150,
    color: "#ffb6c1",
    desc: "A radiant, pure soul used for advanced mystical trades.",
  },
  {
    name: "Legendary Scrap",
    cost: 400,
    color: "#f1c40f",
    desc: "A piece of legendary-tier material, essential for high-level tempering.",
  },
  {
    name: "Mythic Scrap",
    cost: 1200,
    color: "#e74c3c",
    desc: "A perfect fragment of mythic-tier gear. Highly sought after for end-game tempering.",
  },
  {
    name: "Double Drop Elixir",
    cost: 250,
    color: "#22c55e",
    desc: "Doubles global drop rate multiplier (+100%) for 1 Run.",
  },
  {
    name: "Drop Quality Elixir",
    cost: 350,
    color: "#ec4899",
    desc: "Boosts drop quality checks (+50% Qly) for 1 Run.",
  },
  {
    name: "Monster Card Sack",
    cost: 500,
    color: "#a855f7",
    desc: "A card binder containing 5 random collectible cards for your Bestiary Album.",
  },
  {
    name: "Astral Conqueror",
    cost: 25000,
    color: "#9b59b6",
    isTitle: true,
    desc: "An exclusive permanent title badge of cosmic victory. Grants +10% Attack, +10% Max HP, and +5% Active/Idle Speed multiplier.",
  },
];

window.TITLES_DATA = {
  hoors_beta_boi: {
    id: "hoors_beta_boi",
    name: "Hoor's Beta Boi",
    desc: "Recognized as a dedicated foundational tester of the realm.",
    color: "#ff007f",
    icon: "🏅",
    stats: {
      drop: 0.05,
      qly: 0.05,
    },
  },
  astral_conqueror: {
    id: "astral_conqueror",
    name: "Astral Conqueror",
    desc: "Wielder of dimensional singularity vectors.",
    color: "#9b59b6",
    icon: "🌌",
    stats: {
      atkPct: 0.1,
      maxHpPct: 0.1,
      activeSpeedPct: 0.05,
      idleSpeedPct: 0.05,
    },
    received: "Purchased from the Astral Shop for 25,000 Astral Shards.",
  },
};

window.CARD_UPGRADE_THRESHOLDS = [1, 50, 150, 300, 750, 1800];

window.MONSTER_CARDS_DATA = {
  // Whispering Woods (T0)
  slime: {
    name: "Slime Card",
    baseStat: "maxHp",
    baseVal: 0.02,
    isPct: true,
    desc: "Bubbly slime membrane increases Maximum HP.",
    set: "Whispering Woods",
  },
  sprout: {
    name: "Sprout Card",
    baseStat: "def",
    baseVal: 0.02,
    isPct: true,
    desc: "Rooted earth defenses improve overall Defense.",
    set: "Whispering Woods",
  },
  thorn_wyrm: {
    name: "Thorn Wyrm Card",
    baseStat: "critChance",
    baseVal: 0.005,
    isPct: true,
    desc: "Thorn-sharp instincts sharpen Critical Strike Chance.",
    set: "Whispering Woods",
  },

  // Mountain Peaks (T1)
  golem: {
    name: "Golem Card",
    baseStat: "def",
    baseVal: 0.025,
    isPct: true,
    desc: "Solid granite skin bolsters Defense.",
    set: "Mountain Peaks",
  },
  wyrmling: {
    name: "Wyrmling Card",
    baseStat: "atk",
    baseVal: 0.02,
    isPct: true,
    desc: "Draconic fire embers augment Attack Power.",
    set: "Mountain Peaks",
  },
  gargoyle: {
    name: "Gargoyle Card",
    baseStat: "parry",
    baseVal: 0.005,
    isPct: true,
    desc: "Lithic wings snap open to improve Parry Rate.",
    set: "Mountain Peaks",
  },

  // Inferno Depths (T2)
  magma_elemental: {
    name: "Magma Elemental Card",
    baseStat: "atk",
    baseVal: 0.025,
    isPct: true,
    desc: "Searing lava flow amplifies Attack Power.",
    set: "Inferno Depths",
  },
  lava_serpent: {
    name: "Lava Serpent Card",
    baseStat: "critDamage",
    baseVal: 0.015,
    isPct: true,
    desc: "Coiled molten pressure increases Critical Damage multipliers.",
    fill: true,
    set: "Inferno Depths",
  },
  hell_bat: {
    name: "Hell Bat",
    baseKey: "hell_bat",
    name: "Hell Bat Card",
    desc: "Flits erratically, creating chaotic critical openings.",
    stats: { critChance: 0.005 },
    isPct: true,
    baseStat: "critChance",
    baseVal: 0.005,
    set: "Inferno Depths",
  },

  // Fungal Swamp (T3)
  swamp_basilisk: {
    name: "Swamp Basilisk Card",
    baseStat: "maxHp",
    baseVal: 0.025,
    isPct: true,
    desc: "Primordial swamp vigor inflates Maximum HP.",
    set: "Fungal Swamp",
  },
  toxic_fly: {
    name: "Toxic Fly Card",
    baseStat: "moveSpeed",
    baseVal: 1.5,
    isPct: false,
    desc: "Wing flutter speeds up your Movement Speed.",
    set: "Fungal Swamp",
  },
  marsh_ghost: {
    name: "Marsh Ghost Card",
    baseStat: "xpRate",
    baseVal: 0.02,
    isPct: true,
    desc: "Ethereal wisdom amplifies your acquired experience (XP Rate).",
    set: "Fungal Swamp",
  },

  // Void Singularity (T4)
  void_orb: {
    name: "Void Orb Card",
    baseStat: "dropRate",
    baseVal: 0.02,
    isPct: true,
    desc: "Gravitational collapse pulls more loot into your sack.",
    set: "Void Singularity",
  },
  void_crawler: {
    name: "Void Crawler Card",
    baseStat: "rareSpawn",
    baseVal: 0.002,
    isPct: true,
    desc: "Spacial tears draw out more Rare Spawns.",
    set: "Void Singularity",
  },
  void_spectre: {
    name: "Void Spectre Card",
    baseStat: "gold",
    baseVal: 0.02,
    isPct: true,
    desc: "Cosmic echoes multiply all acquired Gold.",
    set: "Void Singularity",
  },

  // Cosmic Wardens (Bosses)
  aegis_goliath: {
    name: "Aegis Goliath Card",
    baseStat: "def",
    baseVal: 0.05, // Increased from 0.03 to 0.05 (+5% base Defense)
    isPct: true,
    desc: "Event Horizon shielding significantly increases Defense.",
    set: "Cosmic Wardens",
  },
  chronos_arbitrator: {
    name: "Chronos Arbitrator Card",
    baseStat: "moveSpeed",
    baseVal: 5.0, // Increased from 2.5 to 5.0 (+5.0 base Movement Speed)
    isPct: false,
    desc: "Temporal dilation accelerates Movement Speed.",
    set: "Cosmic Wardens",
  },
  nexus_overseer: {
    name: "Nexus Overseer Card",
    baseStat: "atk",
    baseVal: 0.05, // Increased from 0.03 to 0.05 (+5% base Attack Power)
    isPct: true,
    desc: "Glitch code injections significantly increase Attack Power.",
    set: "Cosmic Wardens",
  },
  overlord_iron_vault: {
    name: "Iron Overlord Card",
    baseStat: "atk",
    baseVal: 0.05,
    isPct: true,
    desc: "Unbreakable steel spikes increase Attack Power.",
    set: "Cosmic Wardens",
  },
  gilded_vault_keeper: {
    name: "Gilded Vault Keeper Card",
    baseStat: "gold",
    baseVal: 0.05,
    isPct: true,
    desc: "Gilded ancient chest increases gold earnings.",
    set: "Cosmic Wardens",
  },
  corrosive_abomination: {
    name: "Corrosive Abomination Card",
    baseStat: "maxHp",
    baseVal: 0.05,
    isPct: true,
    desc: "Dense alchemical sludges increase Maximum HP.",
    set: "Cosmic Wardens",
  },
  hooktail: {
    name: "Hooktail Card",
    baseStat: "atk",
    baseVal: 0.08,
    isPct: true,
    desc: "The Scarlet Calamity's blazing presence drastically augments your Attack Power.",
    set: "Cosmic Wardens",
  },
};

window.CARD_SETS_DATA = {
  "Whispering Woods": {
    name: "Whispering Woods Set",
    theme: "XP Rate Multiplier",
    statKey: "xpRate",
    cards: ["slime", "sprout", "thorn_wyrm"],
  },
  "Mountain Peaks": {
    name: "Mountain Peaks Set",
    theme: "Global Defense",
    statKey: "defPctBonus",
    cards: ["golem", "wyrmling", "gargoyle"],
  },
  "Inferno Depths": {
    name: "Inferno Depths Set",
    theme: "Global Attack",
    statKey: "atkPctBonus",
    cards: ["magma_elemental", "lava_serpent", "hell_bat"],
  },
  "Fungal Swamp": {
    name: "Fungal Swamp Set",
    theme: "Global Max HP",
    statKey: "maxHpPctBonus",
    cards: ["swamp_basilisk", "toxic_fly", "marsh_ghost"],
  },
  "Void Singularity": {
    name: "Void Singularity Set",
    theme: "Global Drop Quality",
    statKey: "qly",
    cards: ["void_orb", "void_crawler", "void_spectre"],
  },
  "Cosmic Wardens": {
    name: "Cosmic Wardens Set",
    theme: "All Core Attributes (STR/DEX/INT)",
    statKey: "attributesMult", // Special handler in data.js to scale str, dex, int
    cards: [
      "aegis_goliath",
      "chronos_arbitrator",
      "nexus_overseer",
      "overlord_iron_vault",
      "gilded_vault_keeper",
      "corrosive_abomination",
      "hooktail",
    ],
  },
};

window.useDex["Monster Card Sack"] = {
  desc: "A heavy, dust-covered burlap booster pack sealed with a runic wax stamp. Tearing it open dispenses a booster pack of 5 random cards for your Bestiary Album. Duplicates are spent on card rank elevations.",
  color: "#a855f7",
};

/* ==========================================================================
   TOP-DOWN DUNGEON & ADVENTURER'S HUB CONSTANTS
   ========================================================================= */

window.TILE_TYPES = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  SPAWN_PLAYER: 4,
  EXTRACTION_ZONE: 5,
  CHEST_SPAWN: 6,
  MOB_SPAWN: 7,
  DESCENT_PORTAL: 8,
  BOSS_GATE: 9,
  STATION_PORTAL: 10,
  STATION_FORGE: 11,
  STATION_ENCHANT: 12,
  STATION_INN: 13,
  STATION_GACHAPON: 14,
  RECOVERY_CHEST: 15,
  POTTERY_SPAWN: 16,
  STATION_SHOP: 17,
  DUNGEON_MERCHANT: 18,
  DUNGEON_MERCHANT_PEDESTAL: 19,
  STATION_BOUNTY: 20,
};

window.DUNGEON_CONFIG = {
  BASE_WIDTH: 40,
  BASE_HEIGHT: 24,
  TILE_SIZE: 32,
  MIN_ROOM_SIZE: 5,
  MAX_ROOM_SIZE: 10,
};

window.GAME_STATES = {
  HUB: "HUB",
  DUNGEON: "DUNGEON",
};

window.currentGameState = window.GAME_STATES.HUB;

window.player = {
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
};
window.topDownPlayer = window.player;

window.BOSS_BAR_THEMES = {
  aegis_goliath: {
    title: "AEGIS GOLIATH",
    subtitle: "COSMIC SHIELD WARDEN",
    primaryColor: "#00d2ff",
    secondaryColor: "#3498db",
    coreColor: "#e0f2fe",
    bgDark: "#050c18",
    borderColor: "#00d2ff",
  },
  chronos_arbitrator: {
    title: "CHRONOS ARBITRATOR",
    subtitle: "THE CLOCKWORK GOD",
    primaryColor: "#f1c40f",
    secondaryColor: "#d35400",
    coreColor: "#ffeaa7",
    bgDark: "#1c120c",
    borderColor: "#d4af37",
  },
  nexus_overseer: {
    title: "NEXUS OVERSEER",
    subtitle: "CYBERSPACE SINGULARITY",
    primaryColor: "#ff007f",
    secondaryColor: "#00f0ff",
    coreColor: "#ffffff",
    bgDark: "#09090e",
    borderColor: "#ff007f",
  },
  gilded_vault_keeper: {
    title: "GILDED VAULT KEEPER",
    subtitle: "MIDAS TREASURY OVERSEER",
    primaryColor: "#ffd700",
    secondaryColor: "#b58700",
    coreColor: "#fff1a8",
    bgDark: "#1e1107",
    borderColor: "#ffd700",
  },
  corrosive_abomination: {
    title: "CORROSIVE ABOMINATION",
    subtitle: "TOXIC SLUDGE OVERSEER",
    primaryColor: "#2ecc71",
    secondaryColor: "#00ff88",
    coreColor: "#a3fd83",
    bgDark: "#091a10",
    borderColor: "#2ecc71",
  },
  hooktail: {
    title: "HOOKTAIL",
    subtitle: "THE SCARLET DRAGON CALAMITY",
    primaryColor: "#ff3300",
    secondaryColor: "#e74c3c",
    coreColor: "#ffeaa7",
    bgDark: "#1c0404",
    borderColor: "#ff3300",
  },
  overlord_iron_vault: {
    title: "OVERLORD IRON VAULT",
    subtitle: "THE UNBREAKABLE STEEL OVERLORD",
    primaryColor: "#e67e22",
    secondaryColor: "#7f8c8d",
    coreColor: "#ffeaa7",
    bgDark: "#151922",
    borderColor: "#bdc3c7",
  },
};
