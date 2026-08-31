/* ==========================================================================
   PRIMARY PURPOSE: Skyrim-Style Branching Skill Constellation Engine.
   Renders 2D branching node graphs with vector icons and celestial connections.
   ========================================================================= */

  // Global defensive fallback to prevent TypeError crashes during destructive confirmations
  let showCustomConfirm = window.showCustomConfirm;
  if (typeof window.showCustomConfirm !== "function") {
    showCustomConfirm = function (
      title,
      message,
      confirmText,
      cancelText,
      color,
      onConfirm,
    ) {
      // Strip HTML tags for clean fallback presentation
      let plainText = message.replace(/<[^>]*>/g, "");
      if (confirm(`${title}\n\n${plainText}`)) {
        if (typeof onConfirm === "function") onConfirm();
      }
    };
    window.showCustomConfirm = showCustomConfirm;
  }

  const getSubweaponXpRequired = function (level) {
    if (level <= 50) {
      // Heavier base (1000) with lower growth (18%) to prevent early surge and late wall
      return Math.round(1000 * Math.pow(1.18, level - 1));
    } else {
      // Linear scaling after level 50 for infinite progression
      return Math.round(3800000 + (level - 50) * 250000);
    }
  };
  window.getSubweaponXpRequired = getSubweaponXpRequired;

  const gainSubweaponXp = function (subType, amount) {
    if (!window.playerStats || !window.playerStats.subweaponMastery) return;
    let mast = window.playerStats.subweaponMastery[subType];
    if (!mast) return;

    // Determine equivalent current floor played
    let playerLevel = window.playerStats.level || 1;
    let currentFloor = 1;
    if (window.playerStats.isDungeonMode && window.player) {
      currentFloor = window.player.depth || 1;
    } else {
      currentFloor = Math.max(
        1,
        Math.floor((window.playerStats.stage || 1) / 5),
      );
    }

    // --- NEW RPG LEVEL BRACKET SCALING ---
    let multiplier = 1.0;

    // 1. Hero Triviality Check (Anti-Boss Cheese)
    // If Hero is 20+ levels above the floor, gain 0 XP
    if (playerLevel - currentFloor > 20) {
      multiplier = 0;
    } else {
      // 2. Weapon Sweet Spot Bracket
      let diff = currentFloor - mast.level;
      if (diff > 5) {
        // "Fighting Up" Bonus: +10% per level above the sweet spot (max +100%)
        let bonus = Math.min(1.0, (diff - 5) * 0.1);
        multiplier = 1.0 + bonus;
      } else if (diff < -5) {
        // "Bullying" Penalty: -10% per level below the sweet spot (min 10%)
        let penalty = Math.min(0.9, (Math.abs(diff) - 5) * 0.1);
        multiplier = Math.max(0.1, 1.0 - penalty);
      }
    }

    // Store multiplier for UI feedback
    window.lastXpMultiplier = multiplier;

    let scaledAmount = amount * multiplier;

    // Accumulate fractional XP to prevent precision drift
    mast.fractionalXp = (mast.fractionalXp || 0) + scaledAmount;
    let integerXp = Math.floor(mast.fractionalXp);
    if (integerXp > 0) {
      mast.xp += integerXp;
      mast.fractionalXp -= integerXp;
    } else {
      return; // Safe exit: insufficient fractional XP accumulated
    }

    let req = window.getSubweaponXpRequired(mast.level);
    let leveledUp = false;

    while (mast.xp >= req) {
      mast.xp -= req;
      mast.level++;
      mast.sp++;
      leveledUp = true;
      req = window.getSubweaponXpRequired(mast.level);
    }

    if (leveledUp) {
      let label = subType.charAt(0).toUpperCase() + subType.slice(1);
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `✦ ${label} Mastery Level Up! Reached Level ${mast.level}! (+1 SP)`,
          window.SKILL_TREE_DATA[subType]?.color || "#ffd700",
        );
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("revive");
      }
      if (typeof window.spawnFloatingText === "function" && window.player) {
        window.spawnFloatingText(
          window.player.x,
          window.player.y - 30,
          `${label} Mastery LV. ${mast.level}!`,
          window.SKILL_TREE_DATA[subType]?.color || "#ffd700",
          true,
        );
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }
      if (typeof window.saveGame === "function") {
        window.saveGame();
      }
    }
  };
  window.gainSubweaponXp = gainSubweaponXp;

  const SKILL_TREE_DATA = {
    shield: {
      id: "shield",
      name: "Shield Mastery",
      subtitle: "Bulwark & Counter Strike",
      color: "#38bdf8",
      nodes: [
        {
          id: "shield_starter",
          name: "Vanguard Provision",
          iconKey: "shield_starter",
          x: 50,
          y: 88,
          tier: 1,
          maxRank: 1,
          costPerRank: 0,
          isStarterToggle: true,
          starterType: "shield",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Shield equipped if offhand is empty. (Requires Hero Level 2)",
        },
        {
          id: "shield_hp",
          name: "Ironclad Resilience",
          iconKey: "shield_hp",
          x: 25,
          y: 72,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["shield_starter"],
          desc: "Increases Maximum HP by +4% per rank.",
          getStatText: (rank) => `+${rank * 4}% Max HP`,
        },
        {
          id: "shield_def",
          name: "Heavy Plating",
          iconKey: "shield_def",
          x: 75,
          y: 72,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["shield_starter"],
          desc: "Increases Defense by +3% per rank.",
          getStatText: (rank) => `+${rank * 3}% Defense`,
        },
        {
          id: "shield_iron_wall",
          name: "Iron Wall",
          iconKey: "shield_block",
          x: 15,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["shield_hp"],
          desc: "Increases base Block Rate by +1% and maximum Block Cap by +2% per rank.",
          getStatText: (rank) =>
            `+${rank}% Block Rate & +${rank * 2}% Block Cap`,
        },
        {
          id: "shield_fortified_guard",
          name: "Fortified Guard",
          iconKey: "shield_def",
          x: 35,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["shield_hp"],
          desc: "Taking damage builds Fortitude (+4%/+8%/+12% Defense per stack, max 5 stacks, 6s duration).",
          getStatText: (rank) => `+${rank * 4}% Def per stack (max 5)`,
        },
        {
          id: "shield_impact_tremor",
          name: "Resonant Aegis",
          iconKey: "shield_starter",
          x: 65,
          y: 48,
          tier: 2,
          maxRank: 2,
          costPerRank: 1,
          prereqs: ["shield_def"],
          desc: "Blocking has a 20%/40% chance to trigger Resonant Aegis, releasing a vibrational ring dealing 120% Defense as AoE physical damage and pushing enemies back.",
          getStatText: (rank) => `${rank * 20}% Vibrational Ring Chance`,
        },
        {
          id: "shield_fortitude",
          name: "Fortified Stance",
          iconKey: "shield_fortitude",
          x: 85,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["shield_def"],
          desc: "Reduces incoming damage taken when Blocking by +10% per rank.",
          getStatText: (rank) => `-${rank * 10}% Damage Taken on Block`,
        },
        {
          id: "shield_retaliatory_strike",
          name: "Retaliatory Strike",
          iconKey: "shield_fortitude",
          x: 15,
          y: 28,
          tier: 3,
          maxRank: 1,
          costPerRank: 2,
          prereqs: ["shield_fortified_guard"],
          desc: "Successful blocks guarantee a Critical Strike on your next main-hand attack.",
          getStatText: () => "Guaranteed Crit after blocking",
        },
        {
          id: "shield_aegis_pulse",
          name: "Aegis Pulse",
          iconKey: "shield_hp",
          x: 35,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["shield_fortified_guard"],
          desc: "Every 5th successful block emits a wave restoring 3%/6% Max HP.",
          getStatText: (rank) => `Heal ${rank * 3}% Max HP on 5th Block`,
        },
        {
          id: "shield_earth_breaker_bash",
          name: "Earth-Breaker Bash",
          iconKey: "shield_bash",
          x: 65,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["shield_impact_tremor"],
          desc: "Shield Bashes trigger ground tremors, expanding your bash into a 45-degree frontal cone and granting a 15%/30% chance to stun enemies for 1.5s.",
          getStatText: (rank) => `Cone Area & +${rank * 15}% Stun Chance`,
        },
        {
          id: "shield_retaliation",
          name: "Spike Retaliation",
          iconKey: "shield_bash",
          x: 85,
          y: 28,
          tier: 3,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["shield_fortitude"],
          desc: "Shield Bashes deal +15% base damage and additional +12% Defense-scaling counter damage per rank.",
          getStatText: (rank) =>
            `+${rank * 15}% Bash Dmg & +${rank * 12}% Def-scaling`,
        },
        {
          id: "shield_stalwart_bastion",
          name: "Stalwart Bastion",
          iconKey: "shield_block",
          x: 50,
          y: 28,
          tier: 3,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["shield_fortified_guard", "shield_impact_tremor"],
          desc: "Increases base Block Mitigation by +5% per rank (base block mitigation increases from 70% up to 85%).",
          getStatText: (rank) => `+${rank * 5}% Block Mitigation`,
        },
        {
          id: "shield_keystone_colossus",
          name: "Bulwark Colossus",
          iconKey: "shield_keystone",
          x: 30,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["shield_retaliatory_strike"],
          desc: "Blocking mitigates 100% of damage (instead of 70%). Converts 10% of blocked damage into bonus Attack Power for 10s.",
          getStatText: () => "100% Block Mitigation & 10% Atk Conversion",
        },
        {
          id: "shield_keystone_reflect",
          name: "Reflective Singularity",
          iconKey: "shield_keystone",
          x: 70,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["shield_earth_breaker_bash"],
          desc: "Adds 40% of total Defense directly to main weapon Attack Power, and Shield Bash reflects 180% Defense on block.",
          getStatText: () => "+40% Def to Attack & 180% Bash Reflect",
        },
        {
          id: "shield_filler_hp_flat",
          name: "Bastion's Grace",
          iconKey: "shield_hp",
          x: 50,
          y: 58,
          maxRank: 3,
          costPerRank: 1,
          tier: 2,
          prereqs: ["shield_starter"],
          desc: "Augments the shield arm with physical conditioning, increasing Maximum HP by +4% and Defense by +3% per rank.",
          getStatText: (rank) => `+${rank * 4}% Max HP & +${rank * 3}% Defense`,
        },
        {
          id: "shield_filler_flat_def",
          name: "Unyielding Fortitude",
          iconKey: "shield_def",
          x: 50,
          y: 38,
          maxRank: 3,
          costPerRank: 2,
          tier: 3,
          prereqs: ["shield_filler_hp_flat"],
          desc: "Forges thick defensive resilience, granting +5 flat Defense and +25 flat Max HP per rank.",
          getStatText: (rank) => `+${rank * 5} Def & +${rank * 25} Max HP`,
        },
        {
          id: "shield_inf_defense",
          name: "Endless Bastion",
          iconKey: "shield_def",
          x: 30,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["shield_keystone_colossus"],
          desc: "Ascend with the Endless Bastion to infinitely compound your total Defense.",
          getStatText: (rank) =>
            `x${Math.pow(1.02, rank).toFixed(2)} Compounding Defense (+2% per rank)`,
        },
        {
          id: "shield_inf_bash",
          name: "Spike Resonance",
          iconKey: "shield_bash",
          x: 70,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["shield_keystone_reflect"],
          desc: "Ascend with the Spike Resonance to infinitely compound your Shield Bash & Counter-Attack damage.",
          getStatText: (rank) =>
            `x${Math.pow(1.02, rank).toFixed(2)} Compounding Shield Bash & Counter damage (+2% per rank)`,
        },
      ],
    },
    dagger: {
      id: "dagger",
      name: "Dagger Mastery",
      subtitle: "Lethality & Riposte",
      color: "#a855f7",
      nodes: [
        {
          id: "dagger_starter",
          name: "Shadow Blade Provision",
          iconKey: "dagger_starter",
          x: 50,
          y: 88,
          tier: 1,
          maxRank: 1,
          costPerRank: 0,
          isStarterToggle: true,
          starterType: "dagger",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Dagger equipped if offhand is empty. (Requires Hero Level 2)",
        },
        {
          id: "dagger_crit_chance",
          name: "Lethal Precision",
          iconKey: "dagger_crit",
          x: 25,
          y: 72,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Chance by +1.5% per rank.",
          getStatText: (rank) => `+${(rank * 1.5).toFixed(1)}% Crit Chance`,
        },
        {
          id: "dagger_crit_dmg",
          name: "Critical Ferocity",
          iconKey: "dagger_crit_dmg",
          x: 75,
          y: 72,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Damage multiplier by +6% per rank.",
          getStatText: (rank) => `+${rank * 6}% Crit Damage`,
        },
        {
          id: "dagger_offhand_precision",
          name: "Offhand Precision",
          iconKey: "dagger_starter",
          x: 15,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit_chance"],
          desc: "Offhand strikes deal +8% damage, and increase offhand flurry double-strike damage by +10% per rank.",
          getStatText: (rank) =>
            `+${rank * 8}% Offhand Strike Dmg & +${rank * 10}% Flurry`,
        },
        {
          id: "dagger_vipers_coating",
          name: "Viper's Coating",
          iconKey: "dagger_bleed",
          x: 35,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit_chance"],
          desc: "Offhand Strikes apply stacking Poison (10%/20%/30% Atk/sec) and have a +5% chance per rank to cause Sanguine Bleeding.",
          getStatText: (rank) =>
            `Poison: ${rank * 10}% Atk/sec & +${rank * 5}% Bleed`,
        },
        {
          id: "dagger_parry",
          name: "Nimble Reflexes",
          iconKey: "dagger_parry",
          x: 65,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit_dmg"],
          desc: "Increases base Parry Rate by +1% and maximum Parry Cap by +2% per rank.",
          getStatText: (rank) =>
            `+${rank}% Parry Rate & +${rank * 2}% Parry Cap`,
        },
        {
          id: "dagger_expose_weakness",
          name: "Expose Weakness",
          iconKey: "dagger_crit",
          x: 85,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit_dmg"],
          desc: "Offhand strikes shred 4%/8%/12% of enemy Defense for 5s.",
          getStatText: (rank) => `Shred ${rank * 4}% Enemy Armor`,
        },
        {
          id: "dagger_shadow_flurry",
          name: "Shadow Flurry",
          iconKey: "dagger_riposte",
          x: 15,
          y: 28,
          tier: 3,
          maxRank: 1,
          costPerRank: 2,
          prereqs: ["dagger_offhand_precision"],
          desc: "Main weapon Critical Strikes trigger a guaranteed Offhand Strike with +50% Critical Damage.",
          getStatText: () => "Offhand Strike on Crit with +50% Crit Dmg",
        },
        {
          id: "dagger_shadow_step",
          name: "Shadow Step",
          iconKey: "dagger_parry",
          x: 35,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["dagger_parry"],
          desc: "Parrying increases Movement Speed by +15%/+30% and Attack Speed by +10%/+20% for 4s. Boosts Riposte damage by +20% per rank.",
          getStatText: (rank) =>
            `+${rank * 15}% Spd, +${rank * 10}% Atk Spd & +${rank * 20}% Riposte`,
        },
        {
          id: "dagger_noxious_bloom",
          name: "Noxious Bloom",
          iconKey: "dagger_bleed",
          x: 50,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["dagger_vipers_coating", "dagger_parry"],
          desc: "Slaying an enemy suffering from Bleed or Poison triggers a Noxious Bloom, releasing a toxic gas cloud that reduces adjacent enemy Defenses by 15% and ticks damage.",
          getStatText: (rank) => `Vapor Area & +${rank * 15}% Cloud Damage`,
        },
        {
          id: "dagger_sanguine_rupture",
          name: "Sanguine Rupture",
          iconKey: "dagger_bleed",
          x: 65,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["dagger_expose_weakness"],
          desc: "Parrying a poisoned or bleeding target detonates DoTs for 150%/300% remaining damage instantly.",
          getStatText: (rank) =>
            `Detonate DoTs for ${rank * 150}% remaining Dmg`,
        },
        {
          id: "dagger_wind_razor_flurry",
          name: "Wind-Razor Flurry",
          iconKey: "dagger_riposte",
          x: 85,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["dagger_parry"],
          desc: "Landing 3 critical strikes in a row or executing a perfect parry unleashes a forward-flying Crescent Wind Razor that pierces through all enemies.",
          getStatText: (rank) =>
            `Crescent Piercing Waves & +${rank * 20}% Wind Damage`,
        },
        {
          id: "dagger_keystone_assassin",
          name: "Shadow Assassin",
          iconKey: "dagger_keystone",
          x: 30,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["dagger_shadow_flurry"],
          desc: "Reaching 5 Poison stacks triggers a 3-strike Shadow Flurry (100% Attack Power per strike, bypassing 50% Defense).",
          getStatText: () => "Flurry Detonation at 5 Poison Stacks",
        },
        {
          id: "dagger_keystone_duellist",
          name: "Master Duellist",
          iconKey: "dagger_keystone",
          x: 70,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["dagger_shadow_step"],
          desc: "Raises Parry Cap to 40%. Parries negate 100% damage AND spawn a Shadow Decoy that attacks alongside you for 4 seconds.",
          getStatText: () => "40% Parry Cap, 100% Negation & Shadow Decoy",
        },
        {
          id: "dagger_filler_haste",
          name: "Fleetfoot",
          iconKey: "dagger_parry",
          x: 50,
          y: 58,
          maxRank: 3,
          costPerRank: 1,
          tier: 2,
          prereqs: ["dagger_starter"],
          desc: "Develops swift offensive movements, increasing Movement Speed by +4 and Parry Rate by +1% per rank.",
          getStatText: (rank) => `+${rank * 4} Speed & +${rank}% Parry Rate`,
        },
        {
          id: "dagger_filler_armor_pen",
          name: "Serrated Blades",
          iconKey: "dagger_crit",
          x: 50,
          y: 38,
          maxRank: 3,
          costPerRank: 2,
          tier: 3,
          prereqs: ["dagger_filler_haste"],
          desc: "Sharpens blade edges to locate anatomical weaknesses, increasing Attack Power by +4% and Critical Strike Damage multiplier by +3% per rank.",
          getStatText: (rank) =>
            `+${rank * 4}% Attack & +${rank * 3}% Crit Damage`,
        },
        {
          id: "dagger_inf_crit",
          name: "Lethal Infinitum",
          iconKey: "dagger_crit_dmg",
          x: 30,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["dagger_keystone_assassin"],
          desc: "Ascend with the Lethal Infinitum to infinitely compound your Critical Strike Damage multiplier.",
          getStatText: (rank) =>
            `x${Math.pow(1.02, rank).toFixed(2)} Compounding Critical Strike Damage (+2% per rank)`,
        },
        {
          id: "dagger_inf_poison",
          name: "Toxic Osmosis",
          iconKey: "dagger_bleed",
          x: 70,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["dagger_keystone_duellist"],
          desc: "Ascend with the Toxic Osmosis to infinitely compound your Poison and Bleed DoT tick damage.",
          getStatText: (rank) =>
            `x${Math.pow(1.02, rank).toFixed(2)} Compounding Poison & Bleed tick damage (+2% per rank)`,
        },
      ],
    },
    tome: {
      id: "tome",
      name: "Tome Mastery",
      subtitle: "Arcane & Spellcraft",
      color: "#3498db",
      nodes: [
        {
          id: "tome_starter",
          name: "Codex Apprentice Provision",
          iconKey: "tome_starter",
          x: 50,
          y: 88,
          tier: 1,
          maxRank: 1,
          costPerRank: 0,
          isStarterToggle: true,
          starterType: "tome",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Tome equipped if offhand is empty. (Requires Hero Level 2)",
        },
        {
          id: "tome_atk",
          name: "Arcane Focus",
          iconKey: "tome_atk",
          x: 25,
          y: 70,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["tome_starter"],
          desc: "Increases All Attack and Spell Power by +3.5% per rank.",
          getStatText: (rank) =>
            `+${(rank * 3.5).toFixed(1)}% Attack & Spell Power`,
        },
        {
          id: "tome_exp",
          name: "Mind Expansion",
          iconKey: "tome_exp",
          x: 75,
          y: 70,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["tome_starter"],
          desc: "Increases experience gained from defeated monsters by +3% per rank.",
          getStatText: (rank) => `+${rank * 3}% XP Gain Multiplier`,
        },
        {
          id: "tome_empowered_catalysts",
          name: "Empowered Catalysts",
          iconKey: "tome_starter",
          x: 15,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["tome_atk"],
          desc: "Increases Tome Spell Proc Chance to 40%/45%/50% and Spell Power to 175%/200%/225% Attack.",
          getStatText: (rank) =>
            `Proc: ${35 + rank * 5}%, Power: ${150 + rank * 25}% Atk`,
        },
        {
                  id: "tome_runic_barrier",
                  name: "Runic Shielding",
                  iconKey: "tome_barrier",
                  x: 38,
                  y: 48,
                  tier: 2,
                  maxRank: 3,
                  costPerRank: 1,
                  prereqs: ["tome_atk"],
                  desc: "Grants +10%/+20%/+30% Max HP as Arcane Shield Capacity.",
                  getStatText: (rank) => `+${rank * 10}% Max HP as Arcane Shield`,
                },
        {
                  id: "tome_elemental_overload",
                  name: "Elemental Overload",
                  iconKey: "tome_proc",
                  x: 62,
                  y: 48,
                  tier: 2,
                  maxRank: 2,
                  costPerRank: 1,
                  prereqs: ["tome_exp"],
                  desc: "Fireball deals 35%/70% splash; Chain Zap bounces +1/+2 times; Frost Nova slows by 20%/40%. Increases Area Radius by +20% per rank.",
                  getStatText: (rank) => `Overload Level ${rank} & +${rank * 20}% Area Radius`,
                },
        {
                  id: "tome_arcane_syphon",
                  name: "Arcane Syphon",
                  iconKey: "tome_power",
                  x: 85,
                  y: 48,
                  tier: 2,
                  maxRank: 3,
                  costPerRank: 1,
                  prereqs: ["tome_exp"],
                  desc: "Spell procs recharge 1.5%/3.0%/4.5% Arcane Shield (50% overflows to HP if Shield is full) & grant +4%/+8%/+12% INT for 6s.",
                  getStatText: (rank) =>
                    `Recharge ${(rank * 1.5).toFixed(1)}% Arcane Shield & +${rank * 4}% INT`,
                },
                {
                  id: "tome_barrier_shatter",
                  name: "Shield Shatter",
                  iconKey: "tome_keystone",
                  x: 20,
                  y: 28,
                  tier: 3,
                  maxRank: 1,
                  costPerRank: 2,
                  prereqs: ["tome_runic_barrier"],
                  desc: "When Arcane Shield is fully depleted by an attack, it detonates an Arcane Nova dealing 250% INT as AoE Magic Damage.",
                  getStatText: () => "250% INT Nova on Arcane Shield Depletion",
                },
        {
          id: "tome_spell_weaving",
          name: "Spell Weaving",
          iconKey: "tome_proc",
          x: 50,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["tome_elemental_overload"],
          desc: "Shifting between different elemental spell casts boosts Spell Power by +15%/+30% per shift.",
          getStatText: (rank) => `+${rank * 15}% Spell Power on element shift`,
        },
        {
                  id: "tome_resilience",
                  name: "Mana Shielding",
                  iconKey: "tome_power",
                  x: 80,
                  y: 28,
                  tier: 3,
                  maxRank: 3,
                  costPerRank: 2,
                  prereqs: ["tome_arcane_syphon"],
                  desc: "Casting any spell instantly recharges 1%/2%/3% Arcane Shield.",
                  getStatText: (rank) => `Recharge +${rank}% Arcane Shield on Spell Cast`,
                },
        {
          id: "tome_keystone_triad",
          name: "Triad Convergence",
          iconKey: "tome_keystone",
          x: 35,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["tome_spell_weaving"],
          desc: "Tome Spells cast Fireball, Chain Zap, and Frost Nova simultaneously on every spell proc!",
          getStatText: () => "Simultaneous Triple Element Casts",
        },
        {
                  id: "tome_keystone_singularity",
                  name: "Aetheric Singularity",
                  iconKey: "tome_keystone",
                  x: 65,
                  y: 12,
                  tier: 4,
                  maxRank: 1,
                  costPerRank: 5,
                  isKeystone: true,
                  prereqs: ["tome_barrier_shatter"],
                  desc: "Grants +50% Max HP as Arcane Shield Capacity. 80% of total INT is added directly to Attack Power.",
                  getStatText: () => "+50% Shield Capacity & +80% INT to Atk",
                },
        {
                  id: "tome_filler_barrier_regen",
                  name: "Aether Flow",
                  iconKey: "tome_barrier",
                  x: 50,
                  y: 58,
                  maxRank: 3,
                  costPerRank: 1,
                  tier: 2,
                  prereqs: ["tome_starter"],
                  desc: "Refines mana channels to stabilize spell output, increasing Spell Power by +4%, Arcane Barrier by +1%, and Area Radius by +5% per rank.",
                  getStatText: (rank) =>
                    `+${rank * 4}% Spell Power, +${rank}% Barrier & +${rank * 5}% Area Radius`,
                },
        {
          id: "tome_filler_spell_crit",
          name: "Runic Spark",
          iconKey: "tome_proc",
          x: 50,
          y: 38,
          maxRank: 3,
          costPerRank: 2,
          tier: 3,
          prereqs: ["tome_filler_barrier_regen"],
          desc: "Engraves unstable elemental runes, increasing Critical Strike Chance by +1.5% and Attack Power by +2% per rank.",
          getStatText: (rank) =>
            `+${(rank * 1.5).toFixed(1)}% Crit Chance & +${rank * 2}% Attack`,
        },
        {
                  id: "tome_inf_spell",
                  name: "Arcane Singularity",
                  iconKey: "tome_atk",
                  x: 35,
                  y: 3,
                  maxRank: Infinity,
                  isInfinite: true,
                  tier: 5,
                  getCostForRank: (rank) =>
                    Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
                  prereqs: ["tome_keystone_triad"],
                  desc: "Ascend with the Arcane Singularity to infinitely compound your overall Spell Power.",
                  getStatText: (rank) =>
                    `x${Math.pow(1.12, rank).toFixed(2)} Spell Power`,
                },
        {
          id: "tome_inf_intel",
          name: "Aetheric Infusion",
          iconKey: "tome_power",
          x: 65,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["tome_keystone_singularity"],
          desc: "Ascend with the Aetheric Infusion to infinitely compound your Intelligence & Magic damage.",
          getStatText: (rank) =>
            `x${Math.pow(1.02, rank).toFixed(2)} Compounding Intelligence & Magic damage (+2% per rank)`,
        },
      ],
    },
    utility: {
      id: "utility",
      name: "Utility & Survival",
      subtitle: "Explorer & Adventurer",
      color: "#2ecc71",
      nodes: [
        {
          id: "utility_pioneer",
          name: "Pioneer's Instinct",
          iconKey: "utility_pioneer",
          x: 50,
          y: 88,
          currency: "global",
          maxRank: 1,
          costPerRank: 2,
          prereqs: [],
          desc: "Grants +5% Gold Multiplier and +5% Drop Rate.",
          getStatText: () => "+5% Gold & +5% Drop Rate",
        },
        {
          id: "utility_start_weapon",
          name: "Blade Provisioner",
          iconKey: "utility_start_weapon",
          x: 18,
          y: 68,
          currency: "global",
          maxRank: 3,
          getCostForRank: (rank) => rank * 2 + 1,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with a Main Hand Weapon if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Weapon`,
        },
        {
          id: "utility_start_armor",
          name: "Armorsmith Provisioner",
          iconKey: "utility_start_armor",
          x: 36,
          y: 68,
          currency: "global",
          maxRank: 3,
          getCostForRank: (rank) => rank * 2 + 1,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Chest/Overall Armor if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Armor`,
        },
        {
          id: "utility_start_head_feet",
          name: "Vanguard Helm & Greaves",
          iconKey: "utility_start_head_feet",
          x: 64,
          y: 68,
          currency: "global",
          maxRank: 3,
          getCostForRank: (rank) => rank * 2 + 1,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Helmet and Boots if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Helm/Boots`,
        },
        {
          id: "utility_start_ring",
          name: "Signet Provisioner",
          iconKey: "utility_start_ring",
          x: 82,
          y: 68,
          currency: "global",
          maxRank: 3,
          getCostForRank: (rank) => rank * 2 + 1,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Ring(s) if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Rings`,
        },
        {
          id: "utility_gold",
          name: "Scavenger's Avarice",
          iconKey: "utility_gold",
          x: 22,
          y: 46,
          currency: "global",
          maxRank: 5,
          costPerRank: 2,
          prereqs: ["utility_start_weapon", "utility_start_armor"],
          desc: "Increases Gold Multiplier by +5% per rank.",
          getStatText: (rank) => `+${rank * 5}% Gold Multiplier`,
        },
        {
          id: "utility_quality",
          name: "Scavenger's Eye",
          iconKey: "utility_quality",
          x: 40,
          y: 46,
          currency: "global",
          maxRank: 5,
          costPerRank: 2,
          prereqs: ["utility_start_armor"],
          desc: "Increases Equipment Drop Quality by +2% per rank.",
          getStatText: (rank) => `+${rank * 2}% Drop Quality`,
        },
        {
          id: "utility_vitality",
          name: "Pioneer's Vigor",
          iconKey: "utility_vitality",
          x: 60,
          y: 46,
          currency: "global",
          maxRank: 5,
          costPerRank: 2,
          prereqs: ["utility_start_head_feet"],
          desc: "Increases Max Health by +3% and Movement Speed by +2 per rank.",
          getStatText: (rank) => `+${rank * 3}% Max HP & +${rank * 2} Speed`,
        },
        {
          id: "utility_elixir",
          name: "Field Medic",
          iconKey: "utility_elixir",
          x: 78,
          y: 46,
          currency: "global",
          maxRank: 3,
          costPerRank: 4,
          prereqs: ["utility_start_head_feet", "utility_start_ring"],
          desc: "Start every run with active Basic Elixir effects (+10% Atk/HP/Def/Speed) for the entire run duration.",
          getStatText: (rank) => `${rank} Active Elixir Effects for Entire Run`,
        },
        {
          id: "utility_bag",
          name: "Satchel Expansion",
          iconKey: "utility_bag",
          x: 32,
          y: 28,
          currency: "global",
          maxRank: 3,
          costPerRank: 4,
          prereqs: ["utility_quality"],
          desc: "Increases carried satchel equipment capacity by +5 slots per rank.",
          getStatText: (rank) => `+${rank * 5} Satchel Slots`,
        },
        {
          id: "utility_soul_beacon",
          name: "Soul Beacon",
          iconKey: "utility_vitality",
          x: 50,
          y: 28,
          currency: "global",
          maxRank: 1,
          costPerRank: 5,
          prereqs: ["utility_quality", "utility_vitality"],
          desc: "Guarantees that your dropped Recovery Chest always spawns safely inside the exit Portal Room, farthest from the portal.",
          getStatText: () => "Recovery Chest spawns in Portal Room",
        },
        {
          id: "utility_insurance",
          name: "Insurance Underwriter",
          iconKey: "utility_insurance",
          x: 68,
          y: 28,
          currency: "global",
          maxRank: 3,
          costPerRank: 4,
          prereqs: ["utility_vitality", "utility_elixir"],
          desc: "Reduces Gold insurance premium costs by -10% per rank.",
          getStatText: (rank) => `-${rank * 10}% Insurance Premium Cost`,
        },
        {
          id: "utility_emergency_salvage",
          name: "Emergency Evac",
          iconKey: "utility_insurance",
          x: 18,
          y: 28,
          currency: "global",
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["utility_gold", "utility_quality"],
          desc: "Retains a portion of carried Run Gold, Scraps, and Monster Souls upon defeat in dungeons.",
          getStatText: (rank) =>
            `Retain +${rank * 5}% Gold, Scraps & Souls on Death`,
        },
        {
          id: "utility_fairy_sanctuary",
          name: "Fairy Sanctuary",
          iconKey: "utility_pioneer",
          x: 82,
          y: 28,
          currency: "global",
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["utility_vitality", "utility_elixir"],
          desc: "Grants a chance for a Glimmering Fairy to spawn on each dungeon floor.",
          getStatText: (rank) => `+${rank * 5}% Glimmering Fairy Spawn Chance`,
        },
        {
          id: "utility_treasure_hunter",
          name: "Relic Hunter",
          iconKey: "utility_quality",
          x: 32,
          y: 12,
          currency: "global",
          maxRank: 3,
          getCostForRank: (rank) => (rank === 1 ? 6 : rank === 2 ? 12 : 20),
          prereqs: ["utility_bag"],
          desc: "Increases the chance for chests found in runs to spawn as prestigious Gilded Reliquaries or Astral Vaults.",
          getStatText: (rank) => {
            if (rank === 1) return "3% Gilded Reliquary, 0% Astral Vault";
            if (rank === 2) return "6% Gilded Reliquary, 0.5% Astral Vault";
            return "9% Gilded Reliquary, 1% Astral Vault";
          },
        },
        {
          id: "utility_keystone",
          name: "Fortune's Favor",
          iconKey: "utility_keystone",
          x: 50,
          y: 12,
          currency: "global",
          maxRank: 1,
          costPerRank: 10,
          isKeystone: true,
          prereqs: ["utility_treasure_hunter", "utility_insurance"],
          desc: "Slaying a Rare or Boss monster grants +50% Gold Multiplier for 15 seconds.",
          getStatText: () => "+50% Gold Multiplier on Rare/Boss Kill",
        },
        {
          id: "utility_inf_gold",
          name: "Gilded Emperor",
          iconKey: "utility_gold",
          x: 35,
          y: 3,
          currency: "global",
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(3, Math.round(3 * Math.pow(1.18, rank - 1))),
          prereqs: ["utility_keystone"],
          desc: "Ascend with the Gilded Emperor to infinitely scale your Gold Multiplier with a soft-cap curve.",
          getStatText: (rank) =>
            `+${(4.0 * Math.pow(rank, 0.65)).toFixed(1)}% Gold Multiplier`,
        },
        {
          id: "utility_inf_drop",
          name: "Astral Prospector",
          iconKey: "utility_quality",
          x: 65,
          y: 3,
          currency: "global",
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(3, Math.round(3 * Math.pow(1.18, rank - 1))),
          prereqs: ["utility_keystone"],
          desc: "Ascend with the Astral Prospector to infinitely scale your overall Drop Quality with a soft-cap curve.",
          getStatText: (rank) =>
            `+${(1.5 * Math.pow(rank, 0.65)).toFixed(1)}% Drop Quality`,
        },
      ],
    },
  };
  window.SKILL_TREE_DATA = SKILL_TREE_DATA;

  const SkillTreeManager = {
    selectedNodeId: "shield_starter",
    animFrameId: null,
    panX: 0,
    panY: 0,
    zoom: 0.75,
    minZoom: 0.35,
    maxZoom: 1.8,
    initializedPosition: false,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    hasPanned: false,

    centerOnStarter() {
      let viewport = document.querySelector(".constellation-viewport");
      if (!viewport) return;
      let w = viewport.clientWidth;
      let h = viewport.clientHeight;

      // Targets the virtual coordinates of the starter node (600, 880)
      this.zoom = 0.75;
      this.panX = w / 2 - 600 * this.zoom;
      this.panY = h * 0.7 - 880 * this.zoom;
      this.updatePanTransform();
    },

    getSkillLevel(nodeId) {
      if (!window.playerStats) return 0;

      const isSubweaponNode =
        nodeId.startsWith("shield_") ||
        nodeId.startsWith("dagger_") ||
        nodeId.startsWith("tome_");

      if (isSubweaponNode) {
        if (!window.playerStats.subweaponMastery) {
          window.playerStats.subweaponMastery = {
            shield: { xp: 0, level: 1, sp: 0, spentSp: 0 },
            dagger: { xp: 0, level: 1, sp: 0, spentSp: 0 },
            tome: { xp: 0, level: 1, sp: 0, spentSp: 0 },
            nodes: {},
          };
        }
        if (!window.playerStats.subweaponMastery.nodes) {
          window.playerStats.subweaponMastery.nodes = {};
        }
        return window.playerStats.subweaponMastery.nodes[nodeId] || 0;
      }

      if (!window.playerStats.skillTree) return 0;
      let val = window.playerStats.skillTree[nodeId];
      if (typeof val === "boolean") return val ? 1 : 0;
      return typeof val === "number" ? val : 0;
    },

    getNodeCostForRank(node, rank) {
      if (!node) return 1;
      if (typeof node.getCostForRank === "function") {
        return node.getCostForRank(rank);
      }
      return node.costPerRank !== undefined ? node.costPerRank : 1;
    },

    getSpentPointsInTree(treeId) {
      let tree = window.SKILL_TREE_DATA[treeId];
      if (!tree || !window.playerStats) return 0;
      let total = 0;
      tree.nodes.forEach((node) => {
        let level = this.getSkillLevel(node.id);
        for (let r = 1; r <= level; r++) {
          total += this.getNodeCostForRank(node, r);
        }
      });
      return total;
    },

    getTotalEarnedMP() {
      if (!window.playerStats) return 0;
      let levelMP = (window.playerStats.level || 1) - 1;
      let floorMP = Math.floor((window.playerStats.maxFloorCleared || 0) / 4);
      return levelMP + floorMP;
    },

    getTotalSpentMP() {
      return this.getSpentPointsInTree("utility");
    },

    getUnspentMP() {
      if (!window.playerStats) return 0;
      let total = window.playerStats.usp || 0;
      if (window.playerStats.subweaponMastery) {
        total += window.playerStats.subweaponMastery.shield?.sp || 0;
        total += window.playerStats.subweaponMastery.dagger?.sp || 0;
        total += window.playerStats.subweaponMastery.tome?.sp || 0;
      }
      return total;
    },

    getUnspentPointsForTree(treeId) {
      if (treeId === "utility") {
        return window.playerStats.usp || 0;
      }
      if (!window.playerStats.subweaponMastery) return 0;
      return window.playerStats.subweaponMastery[treeId]?.sp || 0;
    },

    isNodeUnlocked(treeId, node) {
      if (node.isStarterToggle && (window.playerStats.level || 1) < 2) {
        return false;
      }
      if (treeId === "utility") {
        if (!node.prereqs || node.prereqs.length === 0) return true;
        return node.prereqs.some((pId) => this.getSkillLevel(pId) > 0);
      }

      // Mastery SP spend threshold validation
      let spent = this.getSpentPointsInTree(treeId);
      let reqSpend = 0;
      if (node.tier === 2) reqSpend = 3;
      else if (node.tier === 3) reqSpend = 7;
      else if (node.tier === 4) reqSpend = 12;
      else if (node.tier === 5) reqSpend = 15;

      if (spent < reqSpend) return false;

      // Keystone Mutually Exclusive Check (Tier 4)
      if (node.tier === 4) {
        let sibling = window.SKILL_TREE_DATA[treeId].nodes.find(
          (n) => n.tier === 4 && n.id !== node.id,
        );
        if (sibling && this.getSkillLevel(sibling.id) > 0) {
          return false;
        }
      }

      if (node.prereqs && node.prereqs.length > 0) {
        return node.prereqs.some((pId) => this.getSkillLevel(pId) > 0);
      }
      return true;
    },

    upgradeSkill(nodeId) {
      if (!window.playerStats) return false;
      let targetNode = null;
      let targetTreeId = null;

      for (let tId in window.SKILL_TREE_DATA) {
        let node = window.SKILL_TREE_DATA[tId].nodes.find(
          (n) => n.id === nodeId,
        );
        if (node) {
          targetNode = node;
          targetTreeId = tId;
          break;
        }
      }

      if (!targetNode) return false;

      let currentRank = this.getSkillLevel(nodeId);
      if (currentRank >= targetNode.maxRank) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast("Node already at max rank!", "#e74c3c");
        }
        return false;
      }

      if (targetNode.isStarterToggle && (window.playerStats.level || 1) < 2) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "Requires Hero Level 2 or higher to unlock!",
            "#e74c3c",
          );
        }
        return false;
      }

      if (!this.isNodeUnlocked(targetTreeId, targetNode)) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "Spend requirement or prerequisite node(s) required!",
            "#e74c3c",
          );
        }
        return false;
      }

      let nextRankCost = this.getNodeCostForRank(targetNode, currentRank + 1);
      let unspent = this.getUnspentPointsForTree(targetTreeId);
      if (unspent < nextRankCost) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast("Insufficient Skill Points!", "#e74c3c");
        }
        return false;
      }

      if (targetTreeId === "utility") {
        window.playerStats.usp = Math.max(
          0,
          (window.playerStats.usp || 0) - nextRankCost,
        );
        window.playerStats.skillTree[nodeId] = currentRank + 1;
      } else {
        let mast = window.playerStats.subweaponMastery[targetTreeId];
        mast.sp -= nextRankCost;
        mast.spentSp += nextRankCost;
        window.playerStats.subweaponMastery.nodes[nodeId] = currentRank + 1;
      }

      if (typeof window.invalidatePlayerStats === "function") {
        window.invalidatePlayerStats();
      }
      if (typeof window.updateUI === "function") {
        window.updateUI();
      }
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("spell");
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `✦ Upgraded ${targetNode.name} (${this.getSkillLevel(nodeId)}/${targetNode.maxRank})!`,
          "#2ecc71",
        );
      }
      if (typeof window.saveGame === "function") {
        window.saveGame();
      }

      this.renderSkillTreeUI();
      return true;
    },

    toggleStarterSubweapon(type) {
      if (!window.playerStats) return;
      if (window.playerStats.activeStarterSubweapon === type) {
        window.playerStats.activeStarterSubweapon = "none";
      } else {
        window.playerStats.activeStarterSubweapon = type;
      }
      if (typeof window.saveGame === "function") window.saveGame();
      if (typeof window.updateUI === "function") window.updateUI();
      this.renderSkillTreeUI();
    },

    resetSkillTree(treeId) {
      if (!window.playerStats) return;
      let spent = this.getSpentPointsInTree(treeId);
      if (spent <= 0) {
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            "No points spent in this tree to refund!",
            "#e74c3c",
          );
        }
        return;
      }

      let treeName = window.SKILL_TREE_DATA[treeId].name;
      window.showCustomConfirm(
        `Reset ${treeName}`,
        `Are you sure you want to refund spent points (${spent} SP) in ${treeName}? This action is free.`,
        "Reset Tree",
        "Cancel",
        "#a855f7",
        () => {
          if (treeId === "utility") {
            let tree = window.SKILL_TREE_DATA.utility;
            tree.nodes.forEach((node) => {
              window.playerStats.skillTree[node.id] = 0;
            });
            window.playerStats.usp = (window.playerStats.usp || 0) + spent;
          } else {
            let mast = window.playerStats.subweaponMastery[treeId];
            let tree = window.SKILL_TREE_DATA[treeId];
            tree.nodes.forEach((node) => {
              window.playerStats.subweaponMastery.nodes[node.id] = 0;
            });
            mast.sp += spent;
            mast.spentSp = 0;
          }

          if (typeof window.invalidatePlayerStats === "function") {
            window.invalidatePlayerStats();
          }
          if (typeof window.updateUI === "function") {
            window.updateUI();
          }
          if (
            window.SoundManager &&
            typeof window.SoundManager.play === "function"
          ) {
            window.SoundManager.play("revive");
          }
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast(
              `Refunded ${spent} Skill Points!`,
              "#2ecc71",
            );
          }
          if (typeof window.saveGame === "function") {
            window.saveGame();
          }
          this.renderSkillTreeUI();
        },
      );
    },

    switchSkillTreeTab(treeId) {
      window.activeSkillTreeTab = treeId;
      this.initializedPosition = false; // Reset to force re-centering
      this.hasPanned = false;
      let tree = window.SKILL_TREE_DATA[treeId];
      if (tree && tree.nodes.length > 0) {
        this.selectedNodeId = tree.nodes[0].id;
      }
      this.renderSkillTreeUI();
    },

    selectNode(nodeId) {
      if (this.hasPanned) {
        this.hasPanned = false;
        return;
      }
      this.selectedNodeId = nodeId;
      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("hover");
      }
      this.renderSkillTreeUI();
    },

    initViewportPan() {
      let viewport = document.querySelector(".constellation-viewport");
      if (!viewport || viewport.dataset.panInitialized) return;
      viewport.dataset.panInitialized = "true";

      this.activePointers = [];
      this.lastPinchDist = null;

      viewport.addEventListener("pointerdown", (e) => {
        if (
          e.target.closest(".selected-node-dock") ||
          e.target.closest("button")
        )
          return;

        this.activePointers.push(e);
        this.isPanning = true;
        this.hasPanned = false;

        if (this.activePointers.length === 1) {
          this.touchStartX = e.clientX;
          this.touchStartY = e.clientY;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
        } else if (this.activePointers.length === 2) {
          let p1 = this.activePointers[0];
          let p2 = this.activePointers[1];
          this.lastPinchDist = Math.hypot(
            p1.clientX - p2.clientX,
            p1.clientY - p2.clientY,
          );
        }
      });

      viewport.addEventListener("pointermove", (e) => {
        if (!this.isPanning) return;

        let idx = this.activePointers.findIndex(
          (p) => p.pointerId === e.pointerId,
        );
        if (idx !== -1) {
          this.activePointers[idx] = e;
        }

        let rect = viewport.getBoundingClientRect();

        if (this.activePointers.length === 2) {
          let p1 = this.activePointers[0];
          let p2 = this.activePointers[1];
          let dist = Math.hypot(
            p1.clientX - p2.clientX,
            p1.clientY - p2.clientY,
          );

          if (this.lastPinchDist) {
            let ratio = dist / this.lastPinchDist;
            let midX = (p1.clientX + p2.clientX) / 2;
            let midY = (p1.clientY + p2.clientY) / 2;

            let virtualX = (midX - rect.left - this.panX) / this.zoom;
            let virtualY = (midY - rect.top - this.panY) / this.zoom;

            this.zoom = Math.max(
              this.minZoom,
              Math.min(this.maxZoom, this.zoom * ratio),
            );

            this.panX = midX - rect.left - virtualX * this.zoom;
            this.panY = midY - rect.top - virtualY * this.zoom;

            this.hasPanned = true;
            this.updatePanTransform();
          }
          this.lastPinchDist = dist;
        } else if (this.activePointers.length === 1) {
          let dx = e.clientX - this.dragStartX;
          let dy = e.clientY - this.dragStartY;

          let totalDx = e.clientX - this.touchStartX;
          let totalDy = e.clientY - this.touchStartY;

          if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
            if (!this.hasPanned) {
              this.hasPanned = true;
              try {
                viewport.setPointerCapture(e.pointerId);
              } catch (err) {}
            }
          }

          if (this.hasPanned) {
            this.panX += dx;
            this.panY += dy;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            this.updatePanTransform();
          }
        }
      });

      const stopPan = (e) => {
        this.activePointers = this.activePointers.filter(
          (p) => p.pointerId !== e.pointerId,
        );
        if (this.activePointers.length < 2) {
          this.lastPinchDist = null;
        }
        if (this.activePointers.length === 0) {
          this.isPanning = false;
        }
        try {
          viewport.releasePointerCapture(e.pointerId);
        } catch (err) {}
      };

      viewport.addEventListener("pointerup", stopPan);
      viewport.addEventListener("pointercancel", stopPan);

      viewport.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();

          let rect = viewport.getBoundingClientRect();
          let mouseX = e.clientX - rect.left;
          let mouseY = e.clientY - rect.top;

          let virtualX = (mouseX - this.panX) / this.zoom;
          let virtualY = (mouseY - this.panY) / this.zoom;

          let zoomFactor = 1.12;
          let nextZoom =
            e.deltaY < 0 ? this.zoom * zoomFactor : this.zoom / zoomFactor;

          this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, nextZoom));

          this.panX = mouseX - virtualX * this.zoom;
          this.panY = mouseY - virtualY * this.zoom;

          this.updatePanTransform();
        },
        { passive: false },
      );
    },

    updatePanTransform() {
      let nodesLayer = document.querySelector(".constellation-nodes-layer");
      if (nodesLayer) {
        nodesLayer.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        nodesLayer.style.transformOrigin = "0 0";
      }
      let canvas = document.getElementById("skill-constellation-canvas");
      if (canvas) {
        canvas.style.transform = "none";
      }
      let activeTreeId = window.activeSkillTreeTab || "shield";
      let activeTree = window.SKILL_TREE_DATA[activeTreeId];
      if (activeTree) {
        this.drawConstellationCanvas(activeTree);
      }
    },

    renderSkillTreeUI() {
      let container = document.getElementById("mastery-content-panel");
      if (!container) return;

      let activeTreeId = window.activeSkillTreeTab || "shield";
      let activeTree = window.SKILL_TREE_DATA[activeTreeId];
      if (!activeTree) return;

      if (!activeTree.nodes.some((n) => n.id === this.selectedNodeId)) {
        this.selectedNodeId = activeTree.nodes[0].id;
      }

      let unspentPoints = this.getUnspentPointsForTree(activeTreeId);

      // Tree Selector Sub-Tabs
      let treeTabsHtml = Object.values(window.SKILL_TREE_DATA)
        .map((tree) => {
          let isActive = tree.id === activeTreeId;
          let treeSpent = this.getSpentPointsInTree(tree.id);
          let activeClass = isActive ? "active" : "";
          let rgb = window.hexToRgbValues
            ? window.hexToRgbValues(tree.color)
            : "56, 189, 248";

          return `
              <button class="tree-tab-btn ${activeClass}" style="${isActive ? `border-color:${tree.color}; background:rgba(${rgb},0.2); color:#fff;` : ""}" onclick="window.SkillTreeManager.switchSkillTreeTab('${tree.id}')">
                <span>${tree.name}</span>
                <span class="tree-tab-spent" style="color:${tree.color};">(${treeSpent} SP)</span>
              </button>
            `;
        })
        .join("");

      // Header Banner with separate progress parameters
      let headerHtml = "";
      if (activeTreeId === "utility") {
        let earnedMP = this.getTotalEarnedMP();
        let spentMP = this.getSpentPointsInTree("utility");
        headerHtml = `
                <div class="skill-tree-mp-banner">
            <div class="mp-info-group">
              <span class="mp-label">UTILITY SKILL POINTS BALANCE</span>
              <span class="mp-balance"><strong style="color:#2ecc71;">${unspentPoints} USP</strong> AVAILABLE <span style="color:#94a3b8; font-size:9px;">(${spentMP} / ${earnedMP} Spent)</span></span>
            </div>
            <button class="action-btn-sm action-btn-salvage" onclick="window.SkillTreeManager.resetSkillTree('utility')">RESET UTILITY</button>
          </div>
        `;
      } else {
        let mast = window.playerStats.subweaponMastery[activeTreeId];
        let requiredXp = window.getSubweaponXpRequired(mast.level);
        let percent = mast.level >= 40 ? 100 : (mast.xp / requiredXp) * 100;
        let progressText =
          mast.level >= 40
            ? "MAX MASTERY"
            : `${mast.xp} / ${requiredXp} XP (${Math.round(percent)}%)`;
        headerHtml = `
          <div class="skill-tree-mp-banner">
            <div class="mp-info-group" style="flex:1; margin-right:16px;">
              <span class="mp-label" style="color:${activeTree.color}; text-transform:uppercase;">${activeTree.name} LEVEL ${mast.level}</span>
              <div class="gacha-pity-bg" style="width: 100%; height: 6px; margin: 3px 0 2px 0; background:#06040a;">
                <div class="gacha-pity-fill" style="width:${percent}%; height:100%; background:${activeTree.color};"></div>
              </div>
              <span style="font-size:8.5px; color:#94a3b8; font-family:monospace;">${progressText}</span>
            </div>
            <div class="mp-info-group" style="text-align:right; margin-right:12px; flex-shrink:0;">
              <span class="mp-label">AVAILABLE SKILL POINTS</span>
              <span class="mp-balance" style="color:#ffffff;"><strong style="color:${activeTree.color};">${mast.sp} SP</strong></span>
            </div>
            <button class="action-btn-sm action-btn-salvage" style="flex-shrink:0;" onclick="window.SkillTreeManager.resetSkillTree('${activeTreeId}')">RESET TREE</button>
          </div>
        `;
      }

      // Render Nodes HTML Overlay Sockets
      let nodesHtml = activeTree.nodes
        .map((node) => {
          let currentRank = this.getSkillLevel(node.id);
          let isMax = node.isInfinite ? false : currentRank >= node.maxRank;
          let isUnlocked = this.isNodeUnlocked(activeTreeId, node);
          let isSelected = this.selectedNodeId === node.id;

          let iconSvg = window.getSkillIconSvg
            ? window.getSkillIconSvg(node.iconKey, 30)
            : "";
          let rgb = window.hexToRgbValues
            ? window.hexToRgbValues(activeTree.color)
            : "56, 189, 248";

          let borderCol = isSelected
            ? "#ffffff"
            : isUnlocked
              ? currentRank > 0
                ? activeTree.color
                : "#64748b"
              : "#1e293b";
          let bgCol = isUnlocked
            ? currentRank > 0
              ? `rgba(${rgb}, 0.35)`
              : "rgba(15, 23, 42, 0.95)"
            : "rgba(10, 14, 23, 0.85)";

          let rankBadge = node.isInfinite
            ? `Rank ${currentRank}`
            : `${currentRank}/${node.maxRank}`;

          // Map percentages into an uncrowded 1200px x 1000px virtual canvas
          let vx = (node.x / 100) * 1200;
          let vy = (node.y / 100) * 1000;

          return `
                    <div class="constellation-node ${isSelected ? "selected" : ""} ${node.isKeystone ? "keystone" : ""}" style="left:${vx}px; top:${vy}px; position: absolute; transform: translate(-50%, -50%);" onclick="window.SkillTreeManager.selectNode('${node.id}')">
                      <div class="node-icon-socket" style="border-color:${borderCol}; background:${bgCol}; ${isSelected ? `box-shadow: 0 0 16px ${activeTree.color};` : ""}">
                        ${iconSvg}
                        <span class="node-rank-tag" style="background:${currentRank > 0 ? activeTree.color : "#1e293b"}; color:#ffffff;">${rankBadge}</span>
                      </div>
                      <span class="node-label-title" style="color:${isUnlocked ? (currentRank > 0 ? "#ffffff" : "#94a3b8") : "#475569"};">${node.name}</span>
                    </div>
                  `;
        })
        .join("");

      // Selected Node Detail Dock
      let selectedNode =
        activeTree.nodes.find((n) => n.id === this.selectedNodeId) ||
        activeTree.nodes[0];
      let selRank = this.getSkillLevel(selectedNode.id);
      let selUnlocked = this.isNodeUnlocked(activeTreeId, selectedNode);
      let selMax = selectedNode.isInfinite
        ? false
        : selRank >= selectedNode.maxRank;
      let nextCost = this.getNodeCostForRank(selectedNode, selRank + 1);
      let selCanAfford = unspentPoints >= nextCost;

      let reqText = "LOCKED";
      let lockHintHtml = "";
      if (!selUnlocked) {
        if (activeTreeId === "utility") {
          let missingPrereqs = (selectedNode.prereqs || []).filter(
            (pId) => this.getSkillLevel(pId) === 0,
          );
          if (missingPrereqs.length > 0) {
            let pNode = activeTree.nodes.find(
              (n) => n.id === missingPrereqs[0],
            );
            let pName = pNode ? pNode.name.toUpperCase() : "PREREQUISITE";
            reqText = `REQ: ${pName}`;
            lockHintHtml = `<div style="color: #ef4444; font-size: 9px; font-family: monospace; font-weight: bold; margin-top: 4px;">REQUIRES SKILL: ${pName}</div>`;
          } else {
            reqText = "LOCKED";
          }
        } else {
          let spent = this.getSpentPointsInTree(activeTreeId);
          let reqSpend = 0;
          if (selectedNode.tier === 2) reqSpend = 3;
          else if (selectedNode.tier === 3) reqSpend = 7;
          else if (selectedNode.tier === 4) reqSpend = 12;
          else if (selectedNode.tier === 5) reqSpend = 15;

          if (spent < reqSpend) {
            reqText = `T${selectedNode.tier} REQ`;
            lockHintHtml = `<div style="color: #ef4444; font-size: 9px; font-family: monospace; font-weight: bold; margin-top: 4px;">REQUIRES ${reqSpend} TOTAL POINTS SPENT IN THIS TREE (CURRENTLY: ${spent})</div>`;
          } else {
            let missingPrereqs = (selectedNode.prereqs || []).filter(
              (pId) => this.getSkillLevel(pId) === 0,
            );
            if (missingPrereqs.length > 0) {
              let pNode = activeTree.nodes.find(
                (n) => n.id === missingPrereqs[0],
              );
              let pName = pNode ? pNode.name.toUpperCase() : "PREREQUISITE";
              reqText = `REQ: ${pName}`;
              lockHintHtml = `<div style="color: #ef4444; font-size: 9px; font-family: monospace; font-weight: bold; margin-top: 4px;">REQUIRES SKILL: ${pName}</div>`;
            } else {
              reqText = "LOCKED";
            }
          }
        }
      } else {
        reqText = `UPGRADE (+1 RANK / ${nextCost} SP)`;
      }

      let actionBtnHtml = "";
      if (selectedNode.isStarterToggle) {
        if (selRank === 0) {
          let isLvlLocked = (window.playerStats.level || 1) < 2;
          let btnText = isLvlLocked
            ? "LOCKED (REQUIRES LEVEL 2)"
            : `UNLOCK STARTER (${nextCost} SP)`;
          actionBtnHtml = `
                                  <button class="skill-buy-btn" ${selUnlocked && selCanAfford && !isLvlLocked ? "" : "disabled"} onclick="window.SkillTreeManager.upgradeSkill('${selectedNode.id}')">
                                    ${btnText}
                                  </button>
                                `;
        } else {
          let activeStarter = window.playerStats
            ? window.playerStats.activeStarterSubweapon
            : "none";
          let isEquippedToggle = activeStarter === selectedNode.starterType;
          actionBtnHtml = `
                            <button class="skill-toggle-btn ${isEquippedToggle ? "active-toggle" : ""}" onclick="window.SkillTreeManager.toggleStarterSubweapon('${selectedNode.starterType}')">
                              ${isEquippedToggle ? "STARTER EQUIPPED [ON]" : "ENABLE STARTER [OFF]"}
                            </button>
                          `;
        }
      } else {
        if (selMax) {
          actionBtnHtml = `<button class="skill-buy-btn maxed" disabled>MAX RANK REACHED</button>`;
        } else {
          actionBtnHtml = `
                            <button class="skill-buy-btn" ${selUnlocked && selCanAfford ? "" : "disabled"} onclick="window.SkillTreeManager.upgradeSkill('${selectedNode.id}')">
                              ${reqText}
                            </button>
                          `;
        }
      }

      let activeStatText =
        selRank > 0 && selectedNode.getStatText
          ? selectedNode.getStatText(selRank)
          : "";
      let nextStatText =
        !selMax && selectedNode.getStatText
          ? selectedNode.getStatText(selRank + 1)
          : "";

      let detailDockHtml = `
                <div class="selected-node-dock" style="border-top: 2px solid ${activeTree.color};">
                  <div class="dock-info">
                    <div class="dock-header">
                      <span class="dock-title" style="color:${activeTree.color};">${selectedNode.name}</span>
                      <span class="dock-rank" style="color:#ffffff;">Rank ${selRank} / ${selectedNode.maxRank}</span>
                    </div>
                    <div class="dock-desc">${selectedNode.desc}</div>
                    ${lockHintHtml}
                    ${activeStatText ? `<div class="dock-stat-active">Current: ${activeStatText}</div>` : ""}
                    ${nextStatText ? `<div class="dock-stat-next">Next Rank: ${nextStatText}</div>` : ""}
                  </div>
                  <div class="dock-action">
                    ${actionBtnHtml}
                  </div>
                </div>
              `;

      container.innerHTML = `
                      <div class="skill-tree-wrapper">
                        ${headerHtml}
                        <div class="tree-selector-bar">
                          ${treeTabsHtml}
                        </div>
                        <div class="constellation-viewport" style="position: relative; overflow: hidden; width: 100%; height: 100%; touch-action: none;">
                          <canvas id="skill-constellation-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                          <div class="constellation-nodes-layer" style="position: absolute; top: 0; left: 0; width: 1200px; height: 1000px; transform: translate(${this.panX}px, ${this.panY}px) scale(${this.zoom}); transform-origin: 0 0;">
                            ${nodesHtml}
                          </div>
                          ${detailDockHtml}
                        </div>
                      </div>
                    `;

      setTimeout(() => {
        this.initViewportPan();
        if (!this.initializedPosition) {
          this.centerOnStarter();
          this.initializedPosition = true;
        } else {
          this.updatePanTransform();
        }
        this.startAnimationLoop();
      }, 20);
    },

    startAnimationLoop() {
      this.stopAnimationLoop();
      const loop = () => {
        let modal = document.getElementById("mastery-modal");
        if (
          !modal ||
          modal.style.display === "none" ||
          modal.style.display === ""
        ) {
          this.stopAnimationLoop();
          return;
        }
        let activeTreeId = window.activeSkillTreeTab || "shield";
        let activeTree = window.SKILL_TREE_DATA[activeTreeId];
        if (activeTree) {
          this.drawConstellationCanvas(activeTree);
        }
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    },

    stopAnimationLoop() {
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    },

    drawConstellationCanvas(activeTree) {
      let canvas = document.getElementById("skill-constellation-canvas");
      if (!canvas) return;
      let parentEl = canvas.parentElement;
      if (!parentEl) return;

      canvas.width = parentEl.clientWidth;
      canvas.height = parentEl.clientHeight;

      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let w = canvas.width;
      let h = canvas.height;
      let time = Date.now();

      // 1. Celestial Stardust Background
      ctx.fillStyle = "#070913";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 30; i++) {
        let starX = (Math.sin(i * 12.3 + time / 8000) * 0.5 + 0.5) * w;
        let starY = (Math.cos(i * 45.1 + time / 6000) * 0.5 + 0.5) * h;
        let starAlpha = 0.2 + Math.sin(time / 400 + i) * 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
        ctx.beginPath();
        ctx.arc(starX, starY, (i % 3) * 0.5 + 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render Constellation Branch Lines translated by Pan Offset
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      let rgb = window.hexToRgbValues
        ? window.hexToRgbValues(activeTree.color)
        : "56, 189, 248";

      activeTree.nodes.forEach((node) => {
        if (node.prereqs && node.prereqs.length > 0) {
          node.prereqs.forEach((pId) => {
            let parentNode = activeTree.nodes.find((n) => n.id === pId);
            if (!parentNode) return;

            // Map drawing coordinates to match the spacious 1200x1000 virtual layout
            let x1 = (parentNode.x / 100) * 1200;
            let y1 = (parentNode.y / 100) * 1000;
            let x2 = (node.x / 100) * 1200;
            let y2 = (node.y / 100) * 1000;

            let parentRank = this.getSkillLevel(parentNode.id);
            let childRank = this.getSkillLevel(node.id);

            ctx.save();
            if (parentRank > 0 && childRank > 0) {
              // Active Unlocked Constellation Branch
              ctx.strokeStyle = activeTree.color;
              ctx.lineWidth = 2.5;
              ctx.shadowBlur = 10;
              ctx.shadowColor = activeTree.color;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              // Flowing Stardust Motes on Line
              let energyProgress = (time / 1200 + (node.x + node.y)) % 1.0;
              let ex = x1 + (x2 - x1) * energyProgress;
              let ey = y1 + (y2 - y1) * energyProgress;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
              ctx.fill();
            } else if (parentRank > 0) {
              // Available Branch (Highly visible solid themed line)
              ctx.strokeStyle = `rgba(${rgb}, 0.55)`;
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            } else {
              // Locked Branch (Themed clearly-visible dashed guidelines)
              ctx.strokeStyle = `rgba(${rgb}, 0.28)`;
              ctx.lineWidth = 1.6;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
            ctx.restore();
          });
        }
      });

      ctx.restore();
    },
  };
  window.SkillTreeManager = SkillTreeManager;

// Retroactive migration for separate Utility SP (USP)
if (window.playerStats && window.playerStats.usp === undefined) {
  let maxLvl = Math.max(
    1,
    window.playerStats.maxLevel || 1,
    window.playerStats.level || 1,
  );
  let spentUtility = window.SkillTreeManager.getSpentPointsInTree("utility");
  window.playerStats.usp = Math.max(0, (maxLvl - 1) * 1 - spentUtility);

  let spentAttribute =
    (window.playerStats.spAllocations?.spStr || 0) +
    (window.playerStats.spAllocations?.spDex || 0) +
    (window.playerStats.spAllocations?.spInt || 0);
  window.playerStats.sp = Math.max(0, (maxLvl - 1) * 3 - spentAttribute);

  if (typeof window.saveGame === "function") {
    window.saveGame();
  }
}

let resolvePlayerStats = window.resolvePlayerStats;
  if (
    resolvePlayerStats &&
    !resolvePlayerStats.__wrappedBySkills
  ) {
    const originalResolve = resolvePlayerStats;
    resolvePlayerStats = function (isDraft = false) {
      let rawStats = originalResolve ? originalResolve(isDraft) : {};
      if (!rawStats) return rawStats;

      // Shallow clone to protect persistent base stats from compounding reference mutations!
            let stats = { ...rawStats };

            const safeNum = (val, fallback = 0) => {
              if (val === null || val === undefined) return fallback;
              if (typeof val === "number")
                return Number.isFinite(val) ? val : fallback;
              if (typeof val === "object") {
                if (typeof val.toNumber === "function") {
                  let res = val.toNumber();
                  if (typeof res === "number" && Number.isFinite(res))
                    return res;
                }
                if (typeof val.valueOf === "function") {
                  let v = val.valueOf();
                  if (typeof v === "number" && Number.isFinite(v)) return v;
                }
                if (val.m !== undefined && val.e !== undefined) {
                  let res = val.m * Math.pow(10, val.e);
                  if (Number.isFinite(res)) return res;
                }
              }
              let parsed = parseFloat(val);
              return Number.isFinite(parsed) ? parsed : fallback;
            };

            const safeBigNum = (val, fallback = 0) =>
              BigNum.from(val === null || val === undefined ? fallback : val);

            // Preserve infinitely scaling combat stats as BigNum values.
            stats.int = safeNum(stats.int, 5);
            stats.atk = safeBigNum(stats.atk, 15);
            stats.def = safeBigNum(stats.def, 5);
            stats.maxHp = safeBigNum(stats.maxHp, 100);
            stats.spellPower = safeNum(stats.spellPower, 1.5);

            let getLevel = (id) =>
              window.SkillTreeManager ? window.SkillTreeManager.getSkillLevel(id) : 0;

            // Apply Tome Spell Scaling & Type mapping
            if (window.equippedSlots && window.equippedSlots.subweapon) {
              let sub = window.equippedSlots.subweapon;
              if (
                sub.type === "tome" ||
                sub.subType === "tome" ||
                (sub.name && sub.name.toLowerCase().includes("lexicon"))
              ) {
                stats.spellType = sub.spellType || "fire";

                let basePower = safeNum(stats.spellPower, 1.5);
                if (stats.spellType === "tri") {
                  stats.spellPower = basePower * 0.8;
                } else if (stats.spellType.startsWith("dual_")) {
                  stats.spellPower = basePower * 0.9;
                } else {
                  stats.spellPower = basePower;
                }
              }
            }

            // --- SUBWEAPON BRANCHING CONSTELLATION NODES ---

            // 1. Shield Tree Branching Nodes
            let shieldHpLvl = getLevel("shield_hp");
            if (shieldHpLvl > 0) {
              stats.maxHp = stats.maxHp.mul(1 + shieldHpLvl * 0.04);
            }
            let shieldDefLvl = getLevel("shield_def");
            if (shieldDefLvl > 0) {
              stats.def = stats.def.mul(1 + shieldDefLvl * 0.03);
            }
            let shieldIronWallLvl = getLevel("shield_iron_wall");
            if (shieldIronWallLvl > 0) {
              stats.block = (stats.block || 0.0) + shieldIronWallLvl * 0.01;
              stats.maxBlockCap =
                (stats.maxBlockCap || 0.3) + shieldIronWallLvl * 0.02;
            }
            let shieldFortifiedGuardLvl = getLevel("shield_fortified_guard");
            if (
              shieldFortifiedGuardLvl > 0 &&
              window.playerStats &&
              window.playerStats.fortitudeTimer > 0 &&
              window.playerStats.fortitudeStacks > 0
            ) {
              stats.def = stats.def.mul(
                1 +
                  window.playerStats.fortitudeStacks *
                    shieldFortifiedGuardLvl *
                    0.04,
              );
            }
            let shieldImpactTremorLvl = getLevel("shield_impact_tremor");
            if (shieldImpactTremorLvl > 0) {
              stats.resonantAegisChance = shieldImpactTremorLvl * 0.2;
            }
            let shieldFortitudeLvl = getLevel("shield_fortitude");
            if (shieldFortitudeLvl > 0) {
              stats.blockMitigationBonus = shieldFortitudeLvl * 0.1;
            }
            let shieldRetaliationLvl = getLevel("shield_retaliation");
            if (shieldRetaliationLvl > 0) {
              stats.shieldBashMultiplier =
                (stats.shieldBashMultiplier || 1.0) + shieldRetaliationLvl * 0.15;
              stats.shieldDefScalingCounter = shieldRetaliationLvl * 0.12;
            }
            if (getLevel("shield_keystone_colossus") > 0) {
              stats.colossusBlock = true;
            }
            if (getLevel("shield_keystone_reflect") > 0) {
              stats.atk = stats.atk.add(stats.def.mul(0.4));
              stats.reflectSingularityActive = true;
            }

            // 2. Dagger Tree Branching Nodes
            let daggerCritLvl = getLevel("dagger_crit");
            if (daggerCritLvl > 0) {
              stats.critChance = (stats.critChance || 0.05) + daggerCritLvl * 0.015;
            }
            let daggerCritDmgLvl = getLevel("dagger_crit_dmg");
            if (daggerCritDmgLvl > 0) {
              stats.critDamage = (stats.critDamage || 1.5) + daggerCritDmgLvl * 0.06;
            }
            let daggerLethalPrecisionLvl = getLevel("dagger_lethal_precision");
            if (daggerLethalPrecisionLvl > 0) {
              stats.offhandDmgMultiplier =
                (stats.offhandDmgMultiplier || 1.0) + daggerLethalPrecisionLvl * 0.08;
              stats.offhandFlurryMultiplier =
                (stats.offhandFlurryMultiplier || 1.0) +
                daggerLethalPrecisionLvl * 0.1;
            }
            let daggerVipersCoatingLvl = getLevel("dagger_vipers_coating");
            if (daggerVipersCoatingLvl > 0) {
              stats.vipersCoatingLvl = daggerVipersCoatingLvl;
            }
            let daggerParryLvl = getLevel("dagger_parry");
            if (daggerParryLvl > 0) {
              stats.parry = (stats.parry || 0.0) + daggerParryLvl * 0.01;
              stats.maxParryCap = (stats.maxParryCap || 0.3) + daggerParryLvl * 0.02;
            }
            let daggerExposeWeaknessLvl = getLevel("dagger_expose_weakness");
            if (daggerExposeWeaknessLvl > 0) {
              stats.exposeWeaknessLvl = daggerExposeWeaknessLvl;
            }
            if (getLevel("dagger_shadow_flurry") > 0) {
              stats.hasShadowFlurry = true;
            }
            let daggerShadowStepLvl = getLevel("dagger_shadow_step");
            if (daggerShadowStepLvl > 0) {
              stats.shadowStepLvl = daggerShadowStepLvl;
            }
            let daggerSanguineRuptureLvl = getLevel("dagger_sanguine_rupture");
            if (daggerSanguineRuptureLvl > 0) {
              stats.sanguineRuptureLvl = daggerSanguineRuptureLvl;
            }
            let daggerWindRazorFlurryLvl = getLevel("dagger_wind_razor_flurry");
            if (daggerWindRazorFlurryLvl > 0) {
              stats.windRazorFlurryLvl = daggerWindRazorFlurryLvl;
            }
            if (getLevel("dagger_keystone_assassin") > 0) {
              stats.hasKeystoneAssassin = true;
            }
            if (getLevel("dagger_keystone_duellist") > 0) {
              stats.maxParryCap = 0.4;
              stats.hasKeystoneDuellist = true;
            }

            // Auto-initialize base Dagger attributes if equipped
            if (
              window.equippedSlots &&
              window.equippedSlots.subweapon &&
              (window.equippedSlots.subweapon.type === "dagger" ||
                window.equippedSlots.subweapon.subType === "dagger")
            ) {
              stats.subType = "dagger";
              stats.offhandChance = stats.offhandChance || 0.35;
              stats.offhandDmg = stats.offhandDmg || 0.45;
            }

            // Auto-initialize base Tome attributes if equipped
            if (
              window.equippedSlots &&
              window.equippedSlots.subweapon &&
              (window.equippedSlots.subweapon.type === "tome" ||
                window.equippedSlots.subweapon.subType === "tome" ||
                (window.equippedSlots.subweapon.name &&
                  window.equippedSlots.subweapon.name.toLowerCase().includes("lexicon")))
            ) {
              let sub = window.equippedSlots.subweapon;
              stats.subType = "tome";
              stats.baseBarrierPct = sub.baseBarrierPct || 0.25;
              stats.barrierRechargeDelay = sub.barrierRechargeDelay || 3.0;
              stats.barrierRegenRate = sub.barrierRegenRate || 0.10;
            }

            // 3. Tome Tree Branching Nodes
            let tomeAtkLvl = getLevel("tome_atk");
            if (tomeAtkLvl > 0) {
              stats.atk = stats.atk.mul(1 + tomeAtkLvl * 0.035);
              stats.spellPower = safeNum(stats.spellPower, 1.5) * (1 + tomeAtkLvl * 0.035);
            }
            let tomeExpLvl = getLevel("tome_exp");
            if (tomeExpLvl > 0) {
              stats.expGainMultiplier =
                (stats.expGainMultiplier || 1.0) + tomeExpLvl * 0.03;
            }
            let tomeEmpoweredCatalystsLvl = getLevel("tome_empowered_catalysts");
            if (tomeEmpoweredCatalystsLvl > 0) {
              stats.spellChance = 0.35 + tomeEmpoweredCatalystsLvl * 0.05;
              stats.spellPower = 1.5 + tomeEmpoweredCatalystsLvl * 0.25;
            }
            let tomeRunicBarrierLvl = getLevel("tome_runic_barrier");
            if (tomeRunicBarrierLvl > 0) {
              stats.arcaneShieldBonusPct = (stats.arcaneShieldBonusPct || 0) + tomeRunicBarrierLvl * 0.10;
            }
            let tomeElementalOverloadLvl = getLevel("tome_elemental_overload");
            if (tomeElementalOverloadLvl > 0) {
              stats.hasElementalOverload = true;
              stats.overloadLevel = tomeElementalOverloadLvl;
              stats.bonusAreaRadius = (stats.bonusAreaRadius || 0) + tomeElementalOverloadLvl * 0.20;
            }
            let tomeArcaneSyphonLvl = getLevel("tome_arcane_syphon");
            if (tomeArcaneSyphonLvl > 0) {
              stats.hasArcaneSyphon = true;
              stats.arcaneSyphonLevel = tomeArcaneSyphonLvl;
            }
            if (getLevel("tome_barrier_shatter") > 0) {
              stats.hasBarrierShatter = true;
              stats.shatterIntMultiplier = 2.5;
            }
            let tomeSpellWeavingLvl = getLevel("tome_spell_weaving");
            if (tomeSpellWeavingLvl > 0) {
              stats.hasSpellWeaving = true;
              stats.spellWeavingLevel = tomeSpellWeavingLvl;
            }
            let tomeResilienceLvl = getLevel("tome_resilience");
            if (tomeResilienceLvl > 0) {
              stats.manaShieldingRecharge = tomeResilienceLvl * 0.01;
            }
            if (getLevel("tome_keystone_triad") > 0) {
              stats.hasTriadConvergence = true;
            }
            if (getLevel("tome_keystone_singularity") > 0) {
              stats.arcaneShieldBonusPct = (stats.arcaneShieldBonusPct || 0) + 0.50;
              stats.atk = stats.atk.add(BigNum.from(safeNum(stats.int, 5)).mul(0.8));
            }

            // --- STANDARD FILLER SKILLS RESOLUTION ---

            // 1. Shield Tree Fillers
            let stalwartBastionLvl = getLevel("shield_stalwart_bastion");
            if (stalwartBastionLvl > 0) {
              stats.blockMitigation =
                (stats.blockMitigation || 0.7) + stalwartBastionLvl * 0.05;
            }

            let shieldFiller1 = getLevel("shield_filler_hp_flat");
            if (shieldFiller1 > 0) {
              stats.maxHp = stats.maxHp.mul(1 + shieldFiller1 * 0.04);
              stats.def = stats.def.mul(1 + shieldFiller1 * 0.03);
            }
            let shieldFiller2 = getLevel("shield_filler_flat_def");
            if (shieldFiller2 > 0) {
              stats.def = stats.def.add(shieldFiller2 * 5);
              stats.maxHp = stats.maxHp.add(shieldFiller2 * 25);
            }

            // 2. Dagger Tree Fillers
            let daggerFiller1 = getLevel("dagger_filler_haste");
            if (daggerFiller1 > 0) {
              let baseSpd = safeNum(window.playerStats?.baseMoveSpeed, 100);
              stats.moveSpeed = safeNum(stats.moveSpeed, baseSpd) * (1 + (daggerFiller1 * 4) / 100);
              stats.parry = (stats.parry || 0.0) + daggerFiller1 * 0.01;
            }
            let daggerFiller2 = getLevel("dagger_filler_armor_pen");
            if (daggerFiller2 > 0) {
              stats.atk = stats.atk.mul(1 + daggerFiller2 * 0.04);
              stats.critDamage = (stats.critDamage || 1.5) + daggerFiller2 * 0.03;
            }

            // 3. Tome Tree Fillers
            let tomeFiller1 = getLevel("tome_filler_barrier_regen");
            if (tomeFiller1 > 0) {
              stats.spellPower = safeNum(stats.spellPower, 1.5) + tomeFiller1 * 0.04;
              stats.arcaneBarrier = (stats.arcaneBarrier || 0.2) + tomeFiller1 * 0.01;
              stats.bonusAreaRadius = (stats.bonusAreaRadius || 0) + tomeFiller1 * 0.05;
            }
            let tomeFiller2 = getLevel("tome_filler_spell_crit");
            if (tomeFiller2 > 0) {
              stats.critChance = (stats.critChance || 0.05) + tomeFiller2 * 0.015;
              stats.atk = stats.atk.mul(1 + tomeFiller2 * 0.02);
            }

            // --- INFINITE ASCENSION SKILLS RESOLUTION ---

            // 1. Shield Tree Compounding
            let EndlessBastionLvl = getLevel("shield_inf_defense");
            if (EndlessBastionLvl > 0) {
              stats.def = stats.def.mul(
                BigNum.from(1.1).pow(EndlessBastionLvl),
              );
            }
            let SpikeResonanceLvl = getLevel("shield_inf_bash");
            if (SpikeResonanceLvl > 0) {
              stats.shieldBashMultiplier =
                (stats.shieldBashMultiplier || 1.0) *
                Math.pow(1.12, SpikeResonanceLvl);
            }

            // 2. Dagger Tree Compounding
            let LethalInfinitumLvl = getLevel("dagger_inf_crit");
            if (LethalInfinitumLvl > 0) {
              stats.critDamage =
                (stats.critDamage || 1.5) * Math.pow(1.12, LethalInfinitumLvl);
            }
            let ToxicOsmosisLvl = getLevel("dagger_inf_poison");
            if (ToxicOsmosisLvl > 0) {
              stats.poisonDamageMultiplier =
                (stats.poisonDamageMultiplier || 1.0) *
                Math.pow(1.1, ToxicOsmosisLvl);
              stats.bleedDamageMultiplier =
                (stats.bleedDamageMultiplier || 1.0) * Math.pow(1.1, ToxicOsmosisLvl);
            }

            // 3. Tome Tree Compounding
            let ArcaneSingularityLvl = getLevel("tome_inf_spell");
            if (ArcaneSingularityLvl > 0) {
              stats.spellPower =
                safeNum(stats.spellPower, 1.5) * Math.pow(1.12, ArcaneSingularityLvl);
              let infRadiusBonus = 0.02 * Math.pow(ArcaneSingularityLvl, 0.65);
              stats.bonusAreaRadius = (stats.bonusAreaRadius || 0) + infRadiusBonus;
            }
            let AethericInfusionLvl = getLevel("tome_inf_intel");
            if (AethericInfusionLvl > 0) {
              stats.atk = stats.atk.mul(
                BigNum.from(1.1).pow(AethericInfusionLvl),
              );
              stats.int = safeNum(stats.int, 5) * Math.pow(1.1, AethericInfusionLvl);
            }

            // 4. Utility Tree Soft-Capped Power-Law Scaling (Protects game economy)
            let GildedEmperorLvl = getLevel("utility_inf_gold");
            if (GildedEmperorLvl > 0) {
              let goldBonus = 0.04 * Math.pow(GildedEmperorLvl, 0.65);
              stats.gold = (stats.gold || 1.0) + goldBonus;
            }
            let AstralProspectorLvl = getLevel("utility_inf_drop");
            if (AstralProspectorLvl > 0) {
              let dropBonus = 0.015 * Math.pow(AstralProspectorLvl, 0.65);
              stats.qly = (stats.qly || 1.0) + dropBonus;
            }
            stats.emergencySalvageRate = getLevel("utility_emergency_salvage") * 0.05;
            stats.fairySpawnChance = getLevel("utility_fairy_sanctuary") * 0.05;

            // Compute Max Arcane Barrier Pool Capacity safely
            if (stats.subType === "tome" || (stats.baseBarrierPct && stats.baseBarrierPct > 0)) {
              let effInt = Math.max(0, safeNum(stats.int, 5) - 5);
              let intBonus = Math.min(0.15, (effInt * 0.15) / (effInt + 150));
              let totalBarrierPct = (stats.baseBarrierPct || 0.25) + intBonus + (stats.arcaneShieldBonusPct || 0);
              let maxHpVal = stats.maxHp.toFiniteNumber(
                Number.MAX_VALUE / 16,
              );
              stats.arcaneShieldMax = Math.max(0, Math.round(maxHpVal * totalBarrierPct));
            } else {
              stats.arcaneShieldMax = 0;
            }

            // Apply active timers and modifications
            if (window.playerStats) {
              if (
                window.playerStats.colossusAtkBonusTimer > 0 &&
                window.playerStats.colossusAtkBonusVal > 0
              ) {
                stats.atk = stats.atk.add(
                  safeBigNum(window.playerStats.colossusAtkBonusVal, 0),
                );
              }
              if (
                window.playerStats.shadowStepTimer > 0 &&
                window.playerStats.shadowStepLevel > 0
              ) {
                let baseSpd = safeNum(window.playerStats.baseMoveSpeed, 100);
                stats.moveSpeed =
                  safeNum(stats.moveSpeed, baseSpd) *
                  (1 + window.playerStats.shadowStepLevel * 0.15);
              }
              if (
                window.playerStats.syphonIntTimer > 0 &&
                window.playerStats.syphonIntStacks > 0 &&
                stats.arcaneSyphonLevel > 0
              ) {
                stats.int =
                  safeNum(stats.int, 5) *
                  (1 +
                    window.playerStats.syphonIntStacks *
                      stats.arcaneSyphonLevel *
                      0.04);
              }
              if (
                window.playerStats.spellWeavingTimer > 0 &&
                window.playerStats.spellWeavingStacks > 0 &&
                stats.spellWeavingLevel > 0
              ) {
                stats.spellPower =
                  safeNum(stats.spellPower, 1.5) *
                  (1 +
                    window.playerStats.spellWeavingStacks *
                      stats.spellWeavingLevel *
                      0.15);
              }
            }

            return stats;
    };
    window.resolvePlayerStats = resolvePlayerStats;
    window.resolvePlayerStats.__wrappedBySkills = true;
  }

export {
  showCustomConfirm,
  getSubweaponXpRequired,
  gainSubweaponXp,
  SKILL_TREE_DATA,
  SkillTreeManager,
  resolvePlayerStats,
};
