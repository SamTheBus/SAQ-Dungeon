  // --- DYNAMIC TOME PROGRESSION & MULTICAST GENERATION ---
  export function rollTomeSpells(item, stageScale, rarity) {
    let spellType = "fire"; // Default single-target starter spell

    if (stageScale >= 13) {
      if (rarity === 0 || rarity === 1) {
        const options = ["fire", "lightning", "frost"];
        spellType = options[Math.floor(Math.random() * options.length)];
      } else if (rarity === 2 || rarity === 3) {
        if (Math.random() < 0.3) {
          const dualOptions = [
            "dual_fire_lightning",
            "dual_fire_frost",
            "dual_lightning_frost",
          ];
          spellType =
            dualOptions[Math.floor(Math.random() * dualOptions.length)];
        } else {
          const options = ["fire", "lightning", "frost"];
          spellType = options[Math.floor(Math.random() * options.length)];
        }
      } else {
        let roll = Math.random();
        if (roll < 0.2) {
          spellType = "tri";
        } else if (roll < 0.6) {
          const dualOptions = [
            "dual_fire_lightning",
            "dual_fire_frost",
            "dual_lightning_frost",
          ];
          spellType =
            dualOptions[Math.floor(Math.random() * dualOptions.length)];
        } else {
          const options = ["fire", "lightning", "frost"];
          spellType = options[Math.floor(Math.random() * options.length)];
        }
      }
    }

    item.spellType = spellType;

    let spellName = "";
    let spellDesc = "";

    if (spellType === "fire") {
      spellName = "Infernal Fireball";
      spellDesc =
        "Emits powerful single-target Fireballs dealing highly concentrated fire damage.";
    } else if (spellType === "lightning") {
      spellName = "Chain Lightning";
      spellDesc =
        "Emits electrical surges that chain to 1 additional adjacent target for moderate lightning damage.";
    } else if (spellType === "frost") {
      spellName = "Glacial Frost Nova";
      spellDesc =
        "Emits sub-zero Frost Novas dealing area-of-effect frost damage and slowing enemies.";
    } else if (spellType === "dual_fire_lightning") {
      spellName = "Stormfire Catalyst";
      spellDesc =
        "Alternates between single-target Fireballs and chaining Lightning Bolts.";
    } else if (spellType === "dual_fire_frost") {
      spellName = "Frostburn Catalyst";
      spellDesc =
        "Alternates between concentrated Fireballs and slows targets with compact Frost Novas.";
    } else if (spellType === "dual_lightning_frost") {
      spellName = "Tundra Conduit";
      spellDesc =
        "Alternates between chaining Lightning Bolts and slows targets with compact Frost Novas.";
    } else if (spellType === "tri") {
      spellName = "Triad Convergence";
      spellDesc =
        "Continuously cycles between Fire, Lightning, and Frost spells for ultimate versatility.";
    }

    item.desc = `✦ ${spellName} & Barrier:\n${spellDesc}\nAbsorbs 20%-35% of incoming damage before Defense (scales with INT).`;
  }

  // Decorator Hook for createItemObject
  const originalCreateItemObject = window.createItemObject;
  window.createItemObject = function (type, rarity, stageScale, ...args) {
    let item = originalCreateItemObject
      ? originalCreateItemObject.call(this, type, rarity, stageScale, ...args)
      : null;
    if (
      item &&
      (item.type === "tome" ||
        item.subType === "tome" ||
        (item.name && item.name.toLowerCase().includes("lexicon")))
    ) {
      window.rollTomeSpells(item, stageScale, rarity);
    }
    return item;
  };

