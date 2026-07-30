/* ==========================================================================
   PRIMARY PURPOSE: Skyrim-Style Branching Skill Constellation Engine.
   Renders 2D branching node graphs with vector icons and celestial connections.
   ========================================================================= */

(function () {
  // Global defensive fallback to prevent TypeError crashes during destructive confirmations
  if (typeof window.showCustomConfirm !== "function") {
    window.showCustomConfirm = function (
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
  }

  window.getSubweaponXpRequired = function (level) {
    return Math.round(250 * Math.pow(1.5, level - 1));
  };

  window.gainSubweaponXp = function (subType, amount) {
    if (!window.playerStats || !window.playerStats.subweaponMastery) return;
    let mast = window.playerStats.subweaponMastery[subType];
    if (!mast) return;

    if (mast.level >= 40) {
      mast.xp = 0;
      return;
    }

    mast.xp += amount;
    let req = window.getSubweaponXpRequired(mast.level);
    let leveledUp = false;

    while (mast.xp >= req && mast.level < 40) {
      mast.xp -= req;
      mast.level++;
      mast.sp++;
      leveledUp = true;
      req = window.getSubweaponXpRequired(mast.level);
    }

    if (leveledUp) {
      if (mast.level >= 40) {
        mast.xp = 0;
      }

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

  window.SKILL_TREE_DATA = {
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
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "shield",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Shield equipped if offhand is empty.",
        },
        {
          id: "shield_hp",
          name: "Ironclad Resilience",
          iconKey: "shield_hp",
          x: 25,
          y: 70,
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
          y: 70,
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
          x: 38,
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
          name: "Impact Tremor",
          iconKey: "shield_starter",
          x: 62,
          y: 48,
          tier: 2,
          maxRank: 2,
          costPerRank: 1,
          prereqs: ["shield_def"],
          desc: "Blocking has 20%/40% chance to trigger a shockwave dealing 120% Defense as AoE physical damage and pushing enemies back.",
          getStatText: (rank) => `${rank * 20}% Shockwave Chance`,
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
          x: 20,
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
          x: 50,
          y: 28,
          tier: 3,
          maxRank: 2,
          costPerRank: 2,
          prereqs: ["shield_impact_tremor"],
          desc: "Every 5th successful block emits a wave restoring 3%/6% Max HP.",
          getStatText: (rank) => `Heal ${rank * 3}% Max HP on 5th Block`,
        },
        {
          id: "shield_retaliation",
          name: "Spike Retaliation",
          iconKey: "shield_bash",
          x: 80,
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
          id: "shield_keystone_colossus",
          name: "Bulwark Colossus",
          iconKey: "shield_keystone",
          x: 35,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 3,
          isKeystone: true,
          prereqs: ["shield_retaliatory_strike"],
          desc: "Blocking mitigates 100% of damage (instead of 70%). Converts 10% of blocked damage into bonus Attack Power for 10s.",
          getStatText: () => "100% Block Mitigation & 10% Atk Conversion",
        },
        {
          id: "shield_keystone_reflect",
          name: "Reflective Singularity",
          iconKey: "shield_keystone",
          x: 65,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 3,
          isKeystone: true,
          prereqs: ["shield_aegis_pulse"],
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
          x: 35,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["shield_keystone_colossus"],
          desc: "Ascend with the Endless Bastion to infinitely compound your total Defense.",
          getStatText: (rank) =>
            `x${Math.pow(1.1, rank).toFixed(2)} Compounding Defense (+10% per rank)`,
        },
        {
          id: "shield_inf_bash",
          name: "Spike Resonance",
          iconKey: "shield_bash",
          x: 65,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["shield_keystone_reflect"],
          desc: "Ascend with the Spike Resonance to infinitely compound your Shield Bash & Counter-Attack damage.",
          getStatText: (rank) =>
            `x${Math.pow(1.12, rank).toFixed(2)} Compounding Shield Bash & Counter damage (+12% per rank)`,
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
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "dagger",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Dagger equipped if offhand is empty.",
        },
        {
          id: "dagger_crit",
          name: "Lethal Precision",
          iconKey: "dagger_crit",
          x: 25,
          y: 70,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Chance by +1.5% per rank.",
          getStatText: (rank) => `+${(rank * 1.5).toFixed(1)}% Crit Chance`,
        },
        {
          id: "dagger_crit_dmg",
          name: "Savage Ferocity",
          iconKey: "dagger_crit_dmg",
          x: 75,
          y: 70,
          tier: 1,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Damage multiplier by +6% per rank.",
          getStatText: (rank) => `+${rank * 6}% Crit Damage`,
        },
        {
          id: "dagger_lethal_precision",
          name: "Offhand Precision",
          iconKey: "dagger_starter",
          x: 15,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit"],
          desc: "Offhand strikes deal +8% damage, and increase offhand flurry double-strike damage by +10% per rank.",
          getStatText: (rank) =>
            `+${rank * 8}% Offhand Strike Dmg & +${rank * 10}% Flurry`,
        },
        {
          id: "dagger_vipers_coating",
          name: "Viper's Coating",
          iconKey: "dagger_bleed",
          x: 38,
          y: 48,
          tier: 2,
          maxRank: 3,
          costPerRank: 1,
          prereqs: ["dagger_crit"],
          desc: "Offhand Strikes apply stacking Poison (10%/20%/30% Atk/sec) and have a +5% chance per rank to cause Sanguine Bleeding.",
          getStatText: (rank) =>
            `Poison: ${rank * 10}% Atk/sec & +${rank * 5}% Bleed`,
        },
        {
          id: "dagger_parry",
          name: "Nimble Reflexes",
          iconKey: "dagger_parry",
          x: 62,
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
          x: 20,
          y: 28,
          tier: 3,
          maxRank: 1,
          costPerRank: 2,
          prereqs: ["dagger_lethal_precision"],
          desc: "Main weapon Critical Strikes trigger a guaranteed Offhand Strike with +50% Critical Damage.",
          getStatText: () => "Offhand Strike on Crit with +50% Crit Dmg",
        },
        {
          id: "dagger_shadow_step",
          name: "Shadow Step",
          iconKey: "dagger_parry",
          x: 50,
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
          id: "dagger_sanguine_rupture",
          name: "Sanguine Rupture",
          iconKey: "dagger_bleed",
          x: 80,
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
          id: "dagger_keystone_assassin",
          name: "Shadow Assassin",
          iconKey: "dagger_keystone",
          x: 35,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 3,
          isKeystone: true,
          prereqs: ["dagger_shadow_flurry"],
          desc: "Reaching 5 Poison stacks triggers a 3-strike Shadow Flurry (100% Attack Power per strike, bypassing 50% Defense).",
          getStatText: () => "Flurry Detonation at 5 Poison Stacks",
        },
        {
          id: "dagger_keystone_duellist",
          name: "Master Duellist",
          iconKey: "dagger_keystone",
          x: 65,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 3,
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
          x: 35,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["dagger_keystone_assassin"],
          desc: "Ascend with the Lethal Infinitum to infinitely compound your Critical Strike Damage multiplier.",
          getStatText: (rank) =>
            `x${Math.pow(1.12, rank).toFixed(2)} Compounding Critical Strike Damage (+12% per rank)`,
        },
        {
          id: "dagger_inf_poison",
          name: "Toxic Osmosis",
          iconKey: "dagger_bleed",
          x: 65,
          y: 3,
          maxRank: Infinity,
          isInfinite: true,
          tier: 5,
          getCostForRank: (rank) =>
            Math.max(2, Math.round(2 * Math.pow(1.18, rank - 1))),
          prereqs: ["dagger_keystone_duellist"],
          desc: "Ascend with the Toxic Osmosis to infinitely compound your Poison and Bleed DoT tick damage.",
          getStatText: (rank) =>
            `x${Math.pow(1.1, rank).toFixed(2)} Compounding Poison & Bleed tick damage (+10% per rank)`,
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
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "tome",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Tome equipped if offhand is empty.",
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
          desc: "Increases Arcane Barrier base absorption to 24%/28%/32% (up to 40% cap).",
          getStatText: (rank) => `Absorb: ${20 + rank * 4}%, Cap: 40%`,
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
          desc: "Fireball deals 35%/70% splash; Chain Zap bounces +1/+2 times; Frost Nova slows by 20%/40%.",
          getStatText: (rank) => `Overload Level ${rank} Spell Effects`,
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
          desc: "Spell procs restore 1%/2%/3% Max HP and grant +4%/+8%/+12% INT for 6s (stacks 3x).",
          getStatText: (rank) =>
            `Restore ${rank}% HP & +${rank * 4}% INT on Spell Proc`,
        },
        {
          id: "tome_barrier_shatter",
          name: "Barrier Shatter",
          iconKey: "tome_keystone",
          x: 20,
          y: 28,
          tier: 3,
          maxRank: 1,
          costPerRank: 2,
          prereqs: ["tome_runic_barrier"],
          desc: "Storing 100% absorbed damage in Arcane Barrier detonates an explosion dealing 250% INT as Magic Damage.",
          getStatText: () => "Explosive Shield Shatter at 100% Absorbed",
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
          desc: "Casting spells restores an additional 2% of Max Health per rank.",
          getStatText: (rank) => `Heals +${rank * 2}% Max HP on Spell Cast`,
        },
        {
          id: "tome_keystone_triad",
          name: "Triad Convergence",
          iconKey: "tome_keystone",
          x: 35,
          y: 12,
          tier: 4,
          maxRank: 1,
          costPerRank: 3,
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
          costPerRank: 3,
          isKeystone: true,
          prereqs: ["tome_barrier_shatter"],
          desc: "Arcane Barrier absorbs an absolute 45% of damage. While active, 80% of total INT is added directly to Attack Power.",
          getStatText: () => "45% Fixed Barrier & +80% INT to Atk",
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
          desc: "Refines mana channels to stabilize spell output, increasing Spell Power by +4% and Arcane Barrier by +1% per rank.",
          getStatText: (rank) =>
            `+${rank * 4}% Spell Power & +${rank}% Barrier`,
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
            `x${Math.pow(1.12, rank).toFixed(2)} Compounding Spell Power (+12% per rank)`,
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
            `x${Math.pow(1.1, rank).toFixed(2)} Compounding Intelligence & Magic damage (+10% per rank)`,
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

  window.SkillTreeManager = {
    selectedNodeId: "shield_starter",
    animFrameId: null,
    panX: 0,
    panY: 0,
    isPanning: false,
    dragStartX: 0,
    dragStartY: 0,
    hasPanned: false,

    getSkillLevel(nodeId) {
      if (!window.playerStats) return 0;

      const isSubweaponNode = [
        "shield_starter",
        "shield_hp",
        "shield_def",
        "shield_iron_wall",
        "shield_fortified_guard",
        "shield_impact_tremor",
        "shield_fortitude",
        "shield_retaliatory_strike",
        "shield_aegis_pulse",
        "shield_retaliation",
        "shield_keystone_colossus",
        "shield_keystone_reflect",

        "dagger_starter",
        "dagger_crit",
        "dagger_crit_dmg",
        "dagger_lethal_precision",
        "dagger_vipers_coating",
        "dagger_parry",
        "dagger_expose_weakness",
        "dagger_shadow_flurry",
        "dagger_shadow_step",
        "dagger_sanguine_rupture",
        "dagger_keystone_assassin",
        "dagger_keystone_duellist",

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
      ].includes(nodeId);

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
      return window.playerStats.sp || 0;
    },

    getUnspentPointsForTree(treeId) {
      if (treeId === "utility") {
        return window.playerStats.sp || 0;
      }
      if (!window.playerStats.subweaponMastery) return 0;
      return window.playerStats.subweaponMastery[treeId]?.sp || 0;
    },

    isNodeUnlocked(treeId, node) {
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
        window.playerStats.sp -= nextRankCost;
        if (window.draftSP !== undefined && window.draftSP !== null) {
          window.draftSP = window.playerStats.sp;
        }
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
            window.playerStats.sp += spent;
            if (window.draftSP !== undefined && window.draftSP !== null) {
              window.draftSP = window.playerStats.sp;
            }
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
      this.panX = 0;
      this.panY = 0;
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

      viewport.addEventListener("pointerdown", (e) => {
        if (
          e.target.closest(".selected-node-dock") ||
          e.target.closest("button")
        )
          return;

        this.isPanning = true;
        this.hasPanned = false;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        try {
          viewport.setPointerCapture(e.pointerId);
        } catch (err) {}
      });

      viewport.addEventListener("pointermove", (e) => {
        if (!this.isPanning) return;
        let dx = e.clientX - this.dragStartX;
        let dy = e.clientY - this.dragStartY;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          this.hasPanned = true;
        }

        this.panX += dx;
        this.panY += dy;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;

        this.updatePanTransform();
      });

      const stopPan = (e) => {
        if (this.isPanning) {
          this.isPanning = false;
          try {
            viewport.releasePointerCapture(e.pointerId);
          } catch (err) {}
        }
      };

      viewport.addEventListener("pointerup", stopPan);
      viewport.addEventListener("pointercancel", stopPan);
    },

    updatePanTransform() {
      let nodesLayer = document.querySelector(".constellation-nodes-layer");
      if (nodesLayer) {
        nodesLayer.style.transform = `translate(${this.panX}px, ${this.panY}px)`;
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
              <span class="mp-balance"><strong style="color:#2ecc71;">${unspentPoints} SP</strong> AVAILABLE <span style="color:#94a3b8; font-size:9px;">(${spentMP} / ${earnedMP} Spent)</span></span>
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

          return `
              <div class="constellation-node ${isSelected ? "selected" : ""} ${node.isKeystone ? "keystone" : ""}" style="left:${node.x}%; top:${node.y}%;" onclick="window.SkillTreeManager.selectNode('${node.id}')">
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

      let actionBtnHtml = "";
      if (selectedNode.isStarterToggle) {
        if (selRank === 0) {
          actionBtnHtml = `
                      <button class="skill-buy-btn" ${selUnlocked && selCanAfford ? "" : "disabled"} onclick="window.SkillTreeManager.upgradeSkill('${selectedNode.id}')">
                        UNLOCK STARTER (${nextCost} SP)
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
          let reqText = !selUnlocked
            ? `LOCKED (T${selectedNode.tier} REQ)`
            : `UPGRADE (+1 RANK / ${nextCost} SP)`;
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
            <div class="constellation-viewport">
              <canvas id="skill-constellation-canvas"></canvas>
              <div class="constellation-nodes-layer" style="transform: translate(${this.panX}px, ${this.panY}px);">
                ${nodesHtml}
              </div>
              ${detailDockHtml}
            </div>
          </div>
        `;

      setTimeout(() => {
        this.initViewportPan();
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

      activeTree.nodes.forEach((node) => {
        if (node.prereqs && node.prereqs.length > 0) {
          node.prereqs.forEach((pId) => {
            let parentNode = activeTree.nodes.find((n) => n.id === pId);
            if (!parentNode) return;

            let x1 = (parentNode.x / 100) * w;
            let y1 = (parentNode.y / 100) * h;
            let x2 = (node.x / 100) * w;
            let y2 = (node.y / 100) * h;

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
              // Available Branch
              ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            } else {
              // Locked Branch
              ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
              ctx.lineWidth = 1.2;
              ctx.setLineDash([4, 4]);
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
})();
