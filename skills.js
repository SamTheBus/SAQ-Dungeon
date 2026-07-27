/* ==========================================================================
   PRIMARY PURPOSE: Skyrim-Style Branching Skill Constellation Engine.
   Renders 2D branching node graphs with vector icons and celestial connections.
   ========================================================================= */

(function () {
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
          maxRank: 1,
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "shield",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Shield equipped if offhand is empty."
        },
        {
          id: "shield_hp",
          name: "Ironclad Resilience",
          iconKey: "shield_hp",
          x: 28,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["shield_starter"],
          desc: "Increases Maximum HP by +4% per rank.",
          getStatText: (rank) => `+${rank * 4}% Max HP`
        },
        {
          id: "shield_block",
          name: "Iron Wall",
          iconKey: "shield_block",
          x: 50,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["shield_starter"],
          desc: "Increases base Block Rate by +1% per rank.",
          getStatText: (rank) => `+${rank}% Block Rate`
        },
        {
          id: "shield_def",
          name: "Heavy Plating",
          iconKey: "shield_def",
          x: 72,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["shield_starter"],
          desc: "Increases Defense by +3% per rank.",
          getStatText: (rank) => `+${rank * 3}% Defense`
        },
        {
          id: "shield_bash",
          name: "Shield Bash",
          iconKey: "shield_bash",
          x: 32,
          y: 45,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["shield_hp", "shield_block"],
          desc: "Increases Shield Bash counter attack damage by +15% per rank.",
          getStatText: (rank) => `+${rank * 15}% Shield Bash Damage`
        },
        {
          id: "shield_fortitude",
          name: "Fortified Stance",
          iconKey: "shield_fortitude",
          x: 50,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["shield_block"],
          desc: "Reduces incoming damage taken when Blocking by +10% per rank.",
          getStatText: (rank) => `-${rank * 10}% Damage Taken on Block`
        },
        {
          id: "shield_retaliation",
          name: "Spike Retaliation",
          iconKey: "shield_bash",
          x: 68,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["shield_def", "shield_block"],
          desc: "Shield Bashes deal additional Defense-scaling counter damage.",
          getStatText: (rank) => `+${rank * 12}% Extra Def-scaling Bash Damage`
        },
        {
          id: "shield_keystone",
          name: "Unbreakable Bulwark",
          iconKey: "shield_keystone",
          x: 50,
          y: 18,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["shield_fortitude", "shield_retaliation"],
          desc: "Blocking an attack triggers an AoE shockwave dealing 150% Defense damage to nearby enemies.",
          getStatText: () => "AoE Shockwave on Block"
        }
      ]
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
          maxRank: 1,
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "dagger",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Dagger equipped if offhand is empty."
        },
        {
          id: "dagger_crit",
          name: "Lethal Precision",
          iconKey: "dagger_crit",
          x: 28,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Chance by +1.5% per rank.",
          getStatText: (rank) => `+${(rank * 1.5).toFixed(1)}% Crit Chance`
        },
        {
          id: "dagger_parry",
          name: "Nimble Reflexes",
          iconKey: "dagger_parry",
          x: 50,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases base Parry Rate by +1% per rank.",
          getStatText: (rank) => `+${rank}% Parry Rate`
        },
        {
          id: "dagger_crit_dmg",
          name: "Savage Ferocity",
          iconKey: "dagger_crit_dmg",
          x: 72,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["dagger_starter"],
          desc: "Increases Critical Strike Damage multiplier by +6% per rank.",
          getStatText: (rank) => `+${rank * 6}% Crit Damage`
        },
        {
          id: "dagger_bleed",
          name: "Sanguine Edge",
          iconKey: "dagger_bleed",
          x: 32,
          y: 45,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["dagger_crit", "dagger_parry"],
          desc: "Increases Bleed DoT chance on dagger strikes by +5% per rank.",
          getStatText: (rank) => `+${rank * 5}% Bleed Chance`
        },
        {
          id: "dagger_riposte",
          name: "Lethal Riposte",
          iconKey: "dagger_riposte",
          x: 50,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["dagger_parry"],
          desc: "Increases Riposte counter strike Critical Damage by +20% per rank.",
          getStatText: (rank) => `+${rank * 20}% Riposte Crit Damage`
        },
        {
          id: "dagger_flurry",
          name: "Offhand Flurry",
          iconKey: "dagger_bleed",
          x: 68,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["dagger_crit_dmg", "dagger_parry"],
          desc: "Increases offhand double-strike chance and damage.",
          getStatText: (rank) => `+${rank * 10}% Offhand Double-Strike Dmg`
        },
        {
          id: "dagger_keystone",
          name: "Viper's Shadow Dance",
          iconKey: "dagger_keystone",
          x: 50,
          y: 18,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["dagger_riposte", "dagger_flurry"],
          desc: "Parrying an attack grants 100% Crit Chance on your next 2 strikes and applies 2 stacks of Sanguine Bleed.",
          getStatText: () => "Guaranteed Crits & Bleed on Parry"
        }
      ]
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
          maxRank: 1,
          costPerRank: 1,
          isStarterToggle: true,
          starterType: "tome",
          prereqs: [],
          desc: "Start dungeon runs with a Common (0★) Starter Tome equipped if offhand is empty."
        },
        {
          id: "tome_atk",
          name: "Arcane Focus",
          iconKey: "tome_atk",
          x: 28,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["tome_starter"],
          desc: "Increases All Attack and Spell Power by +3.5% per rank.",
          getStatText: (rank) => `+${(rank * 3.5).toFixed(1)}% Attack & Spell Power`
        },
        {
          id: "tome_barrier",
          name: "Aetheric Shielding",
          iconKey: "tome_barrier",
          x: 50,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["tome_starter"],
          desc: "Increases Arcane Barrier damage absorption by +2% per rank.",
          getStatText: (rank) => `+${rank * 2}% Arcane Barrier Absorption`
        },
        {
          id: "tome_exp",
          name: "Mind Expansion",
          iconKey: "tome_exp",
          x: 72,
          y: 68,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["tome_starter"],
          desc: "Increases experience gained from defeated monsters by +3% per rank.",
          getStatText: (rank) => `+${rank * 3}% XP Gain Multiplier`
        },
        {
          id: "tome_proc",
          name: "Spell Weaver",
          iconKey: "tome_proc",
          x: 32,
          y: 45,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["tome_atk", "tome_barrier"],
          desc: "Increases Tome spell cast proc chance by +3% per rank.",
          getStatText: (rank) => `+${rank * 3}% Spell Proc Chance`
        },
        {
          id: "tome_power",
          name: "Elemental Resonance",
          iconKey: "tome_power",
          x: 50,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["tome_barrier"],
          desc: "Increases Spell Power for Fireball, Chain Zap, and Frost Nova by +12% per rank.",
          getStatText: (rank) => `+${rank * 12}% Spell Power`
        },
        {
          id: "tome_resilience",
          name: "Mana Shielding",
          iconKey: "tome_power",
          x: 68,
          y: 45,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["tome_exp", "tome_barrier"],
          desc: "Casting spells restores 2% of Max Health per rank.",
          getStatText: (rank) => `Heals +${rank * 2}% Max HP on Spell Cast`
        },
        {
          id: "tome_keystone",
          name: "Aetheric Overload",
          iconKey: "tome_keystone",
          x: 50,
          y: 18,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["tome_power", "tome_resilience"],
          desc: "Tome spell casts have a 15% chance to cast Fireball, Chain Zap, and Frost Nova simultaneously.",
          getStatText: () => "15% Triple-Element Burst Chance"
        }
      ]
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
          maxRank: 1,
          costPerRank: 1,
          prereqs: [],
          desc: "Grants +5% Gold Multiplier and +5% Drop Rate.",
          getStatText: () => "+5% Gold & +5% Drop Rate"
        },
        {
          id: "utility_start_weapon",
          name: "Blade Provisioner",
          iconKey: "utility_start_weapon",
          x: 18,
          y: 68,
          maxRank: 3,
          getCostForRank: (rank) => rank * 2,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with a Main Hand Weapon if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Weapon`
        },
        {
          id: "utility_start_armor",
          name: "Armorsmith Provisioner",
          iconKey: "utility_start_armor",
          x: 36,
          y: 68,
          maxRank: 3,
          getCostForRank: (rank) => rank * 2,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Chest/Overall Armor if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Armor`
        },
        {
          id: "utility_start_head_feet",
          name: "Vanguard Helm & Greaves",
          iconKey: "utility_start_head_feet",
          x: 64,
          y: 68,
          maxRank: 3,
          getCostForRank: (rank) => rank * 2,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Helmet and Boots if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Helm/Boots`
        },
        {
          id: "utility_start_ring",
          name: "Signet Provisioner",
          iconKey: "utility_start_ring",
          x: 82,
          y: 68,
          maxRank: 3,
          getCostForRank: (rank) => rank * 2,
          prereqs: ["utility_pioneer"],
          desc: "Start dungeon runs with Ring(s) if empty (Rank 1: 0★ Common, Rank 2: 1★ Rare, Rank 3: 2★ Magic).",
          getStatText: (rank) => `Provision ${rank - 1}★ Starter Rings`
        },
        {
          id: "utility_gold",
          name: "Scavenger's Avarice",
          iconKey: "utility_gold",
          x: 22,
          y: 46,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["utility_start_weapon", "utility_start_armor"],
          desc: "Increases Gold Multiplier by +5% per rank.",
          getStatText: (rank) => `+${rank * 5}% Gold Multiplier`
        },
        {
          id: "utility_quality",
          name: "Scavenger's Eye",
          iconKey: "utility_quality",
          x: 40,
          y: 46,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["utility_start_armor"],
          desc: "Increases Equipment Drop Quality by +2% per rank.",
          getStatText: (rank) => `+${rank * 2}% Drop Quality`
        },
        {
          id: "utility_vitality",
          name: "Pioneer's Vigor",
          iconKey: "utility_vitality",
          x: 60,
          y: 46,
          maxRank: 5,
          costPerRank: 1,
          prereqs: ["utility_start_head_feet"],
          desc: "Increases Max Health by +3% and Movement Speed by +2 per rank.",
          getStatText: (rank) => `+${rank * 3}% Max HP & +${rank * 2} Speed`
        },
        {
          id: "utility_elixir",
          name: "Field Medic",
          iconKey: "utility_elixir",
          x: 78,
          y: 46,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["utility_start_head_feet", "utility_start_ring"],
          desc: "Start every run with active Basic Elixir effects (+10% Atk/HP/Def/Speed) for the entire run duration.",
          getStatText: (rank) => `${rank} Active Elixir Effects for Entire Run`
        },
        {
          id: "utility_bag",
          name: "Satchel Expansion",
          iconKey: "utility_bag",
          x: 32,
          y: 28,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["utility_quality"],
          desc: "Increases carried satchel equipment capacity by +5 slots per rank.",
          getStatText: (rank) => `+${rank * 5} Satchel Slots`
        },
        {
          id: "utility_insurance",
          name: "Insurance Underwriter",
          iconKey: "utility_insurance",
          x: 68,
          y: 28,
          maxRank: 3,
          costPerRank: 2,
          prereqs: ["utility_vitality", "utility_elixir"],
          desc: "Reduces Gold insurance premium costs by -10% per rank.",
          getStatText: (rank) => `-${rank * 10}% Insurance Premium Cost`
        },
        {
          id: "utility_keystone",
          name: "Fortune's Favor",
          iconKey: "utility_keystone",
          x: 50,
          y: 12,
          maxRank: 1,
          costPerRank: 5,
          isKeystone: true,
          prereqs: ["utility_bag", "utility_insurance"],
          desc: "Slaying a Rare or Boss monster grants +50% Gold Multiplier for 15 seconds.",
          getStatText: () => "+50% Gold Multiplier on Rare/Boss Kill"
        }
      ]
    }
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
        if (!window.playerStats || !window.playerStats.skillTree) return 0;
        let val = window.playerStats.skillTree[nodeId];
        if (typeof val === "boolean") return val ? 1 : 0;
        return typeof val === "number" ? val : 0;
      },

      getNodeCostForRank(node, rank) {
              if (!node) return 1;
              if (typeof node.getCostForRank === "function") {
                return node.getCostForRank(rank);
              }
              return node.costPerRank || 1;
            },

            getSpentMPInTree(treeId) {
              let tree = window.SKILL_TREE_DATA[treeId];
              if (!tree || !window.playerStats || !window.playerStats.skillTree) return 0;
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
        let levelMP = Math.max(0, (window.playerStats.level || 1) - 1);
        let bossMP = Math.floor((window.playerStats.maxFloorCleared || 0) / 12);
        return levelMP + bossMP;
      },

      getTotalSpentMP() {
        let total = 0;
        for (let treeId in window.SKILL_TREE_DATA) {
          total += this.getSpentMPInTree(treeId);
        }
        return total;
      },

      getUnspentMP() {
        let earned = this.getTotalEarnedMP();
        let spent = this.getTotalSpentMP();
        return Math.max(0, earned - spent);
      },

      isNodeUnlocked(treeId, node) {
        if (!node.prereqs || node.prereqs.length === 0) return true;
        return node.prereqs.some((pId) => this.getSkillLevel(pId) > 0);
      },

      upgradeSkill(nodeId) {
        if (!window.playerStats) return false;
        let targetNode = null;
        let targetTreeId = null;

        for (let tId in window.SKILL_TREE_DATA) {
          let node = window.SKILL_TREE_DATA[tId].nodes.find((n) => n.id === nodeId);
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
            window.pushHeaderToast("Prerequisite node(s) required!", "#e74c3c");
          }
          return false;
        }

        let nextRankCost = this.getNodeCostForRank(targetNode, currentRank + 1);
                let unspent = this.getUnspentMP();
                if (unspent < nextRankCost) {
                  if (typeof window.pushHeaderToast === "function") {
                    window.pushHeaderToast("Insufficient Mastery Points!", "#e74c3c");
                  }
                  return false;
                }

        window.playerStats.skillTree = window.playerStats.skillTree || {};

        if (targetNode.isStarterToggle) {
          window.playerStats.skillTree[nodeId] = 1;
          window.playerStats.activeStarterSubweapon = targetNode.starterType;
        } else {
          window.playerStats.skillTree[nodeId] = currentRank + 1;
        }

        if (typeof window.invalidatePlayerStats === "function") {
          window.invalidatePlayerStats();
        }
        if (typeof window.updateUI === "function") {
          window.updateUI();
        }
        if (window.SoundManager && typeof window.SoundManager.play === "function") {
          window.SoundManager.play("spell");
        }
        if (typeof window.pushHeaderToast === "function") {
          window.pushHeaderToast(
            `✦ Upgraded ${targetNode.name} (${this.getSkillLevel(nodeId)}/${targetNode.maxRank})!`,
            "#2ecc71"
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

      resetSkillTree() {
        if (!window.playerStats) return;
        let spent = this.getTotalSpentMP();
        if (spent <= 0) {
          if (typeof window.pushHeaderToast === "function") {
            window.pushHeaderToast("No Mastery Points spent to refund!", "#e74c3c");
          }
          return;
        }

        window.showCustomConfirm(
          "Reset Skill Trees",
          `Are you sure you want to refund all spent Mastery Points (${spent} MP)? This action is free.`,
          "Reset Skills",
          "Cancel",
          "#a855f7",
          () => {
            window.playerStats.skillTree = {};
            window.playerStats.activeStarterSubweapon = "none";

            if (typeof window.invalidatePlayerStats === "function") {
              window.invalidatePlayerStats();
            }
            if (typeof window.updateUI === "function") {
              window.updateUI();
            }
            if (window.SoundManager && typeof window.SoundManager.play === "function") {
              window.SoundManager.play("revive");
            }
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(`Refunded ${spent} Mastery Points!`, "#2ecc71");
            }
            if (typeof window.saveGame === "function") {
              window.saveGame();
            }
            this.renderSkillTreeUI();
          }
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
        if (window.SoundManager && typeof window.SoundManager.play === "function") {
          window.SoundManager.play("hover");
        }
        this.renderSkillTreeUI();
      },

      initViewportPan() {
        let viewport = document.querySelector(".constellation-viewport");
        if (!viewport || viewport.dataset.panInitialized) return;
        viewport.dataset.panInitialized = "true";

        viewport.addEventListener("pointerdown", (e) => {
          if (e.target.closest(".selected-node-dock") || e.target.closest("button")) return;

          this.isPanning = true;
          this.hasPanned = false;
          this.dragStartX = e.clientX;
          this.dragStartY = e.clientY;
          try { viewport.setPointerCapture(e.pointerId); } catch(err) {}
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
            try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
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
        let container = document.getElementById("skill-tree-content-panel");
        if (!container) return;

        let activeTreeId = window.activeSkillTreeTab || "shield";
        let activeTree = window.SKILL_TREE_DATA[activeTreeId];
        if (!activeTree) return;

        if (!activeTree.nodes.some((n) => n.id === this.selectedNodeId)) {
          this.selectedNodeId = activeTree.nodes[0].id;
        }

        let earnedMP = this.getTotalEarnedMP();
        let spentMP = this.getTotalSpentMP();
        let unspentMP = this.getUnspentMP();

        // Tree Selector Sub-Tabs
        let treeTabsHtml = Object.values(window.SKILL_TREE_DATA)
          .map((tree) => {
            let isActive = tree.id === activeTreeId;
            let treeSpent = this.getSpentMPInTree(tree.id);
            let activeClass = isActive ? "active" : "";
            let rgb = window.hexToRgbValues ? window.hexToRgbValues(tree.color) : "56, 189, 248";

            return `
              <button class="tree-tab-btn ${activeClass}" style="${isActive ? `border-color:${tree.color}; background:rgba(${rgb},0.2); color:#fff;` : ""}" onclick="window.SkillTreeManager.switchSkillTreeTab('${tree.id}')">
                <span>${tree.name}</span>
                <span class="tree-tab-spent" style="color:${tree.color};">(${treeSpent} MP)</span>
              </button>
            `;
          })
          .join("");

        // Header MP Balance Banner
        let headerHtml = `
          <div class="skill-tree-mp-banner">
            <div class="mp-info-group">
              <span class="mp-label">MASTERY POINTS BALANCE</span>
              <span class="mp-balance"><strong style="color:#00d2ff;">${unspentMP} MP</strong> AVAILABLE <span style="color:#94a3b8; font-size:9px;">(${spentMP} / ${earnedMP} Spent)</span></span>
            </div>
            <button class="action-btn-sm action-btn-salvage" onclick="window.SkillTreeManager.resetSkillTree()">RESET TREES</button>
          </div>
        `;

        // Render Nodes HTML Overlay Sockets
        let nodesHtml = activeTree.nodes
          .map((node) => {
            let currentRank = this.getSkillLevel(node.id);
            let isMax = currentRank >= node.maxRank;
            let isUnlocked = this.isNodeUnlocked(activeTreeId, node);
            let isSelected = this.selectedNodeId === node.id;

            let iconSvg = window.getSkillIconSvg ? window.getSkillIconSvg(node.iconKey, 30) : "";
            let rgb = window.hexToRgbValues ? window.hexToRgbValues(activeTree.color) : "56, 189, 248";

            let borderCol = isSelected ? "#ffffff" : isUnlocked ? (currentRank > 0 ? activeTree.color : "#64748b") : "#1e293b";
            let bgCol = isUnlocked ? (currentRank > 0 ? `rgba(${rgb}, 0.35)` : "rgba(15, 23, 42, 0.95)") : "rgba(10, 14, 23, 0.85)";

            let rankBadge = node.isStarterToggle
              ? currentRank > 0 ? "[ON]" : "[OFF]"
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
        let selectedNode = activeTree.nodes.find((n) => n.id === this.selectedNodeId) || activeTree.nodes[0];
        let selRank = this.getSkillLevel(selectedNode.id);
        let selUnlocked = this.isNodeUnlocked(activeTreeId, selectedNode);
        let selMax = selRank >= selectedNode.maxRank;
        let nextCost = this.getNodeCostForRank(selectedNode, selRank + 1);
                let selCanAfford = unspentMP >= nextCost;

                let actionBtnHtml = "";
                if (selectedNode.isStarterToggle) {
                  if (selRank === 0) {
                    actionBtnHtml = `
                      <button class="skill-buy-btn" ${selUnlocked && selCanAfford ? "" : "disabled"} onclick="window.SkillTreeManager.upgradeSkill('${selectedNode.id}')">
                        UNLOCK STARTER (${nextCost} MP)
                      </button>
                    `;
                  } else {
                    let activeStarter = window.playerStats ? window.playerStats.activeStarterSubweapon : "none";
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
                    let reqText = !selUnlocked ? `LOCKED (REQ PARENT NODE)` : `UPGRADE (+1 RANK / ${nextCost} MP)`;
                    actionBtnHtml = `
                      <button class="skill-buy-btn" ${selUnlocked && selCanAfford ? "" : "disabled"} onclick="window.SkillTreeManager.upgradeSkill('${selectedNode.id}')">
                        ${reqText}
                      </button>
                    `;
                  }
                }

        let activeStatText = selRank > 0 && selectedNode.getStatText ? selectedNode.getStatText(selRank) : "";
        let nextStatText = !selMax && selectedNode.getStatText ? selectedNode.getStatText(selRank + 1) : "";

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
                  let modal = document.getElementById("profile-modal");
                  let sec = document.getElementById("profile-sec-skills");
                  if (!modal || modal.style.display === "none" || !sec || !sec.classList.contains("active-mobile-section")) {
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
              }
            };
        })();