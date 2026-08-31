import "./entity_id.js?v=1.002";
import "./runtime_state.js?v=1.002";
import "./encounter_state.js?v=1.004";
import { getPlayer } from "./player_runtime.js?v=1.001";

import {
  MYSTICAL_STOCK,
  POTION_TRANSMUTATIONS,
  etcDex,
  useDex,
  ARTIFACT_POOL,
  SET_DEFINITIONS,
  AchievementsData,
  slotNouns,
  COSMETIC_SKINS,
  COSMETIC_COSTUMES,
  CAVERN_BUFFS,
  CAVERN_DEBUFFS,
  ASTRAL_SHOP_STOCK,
  TITLES_DATA,
  CARD_UPGRADE_THRESHOLDS,
  MONSTER_CARDS_DATA as BASE_MONSTER_CARDS_DATA,
  CARD_SETS_DATA,
  TILE_TYPES,
  DUNGEON_CONFIG,
  GAME_STATES,
  BOSS_BAR_THEMES,
} from "./constants.js?v=1.043";
import * as dataApi from "./data.js?v=1.071";
import * as assetApi from "./assets.js?v=1.043";
import * as audioApi from "./audio.js?v=1.045";
import * as itemsApi from "./items.js?v=1.046";
import { openCavernSigilSackAnimation } from "./sigil_sack_animation.js?v=1.002";
import {
  updateDpsOverlayStyle,
  updateDpsOverlayPosition,
  initDpsOverlayDrag,
} from "./dps_overlay_ui.js?v=1.004";
import {
  toggleEcoMode,
  updateEcoModeStyle,
  toggleLighting,
  updateLightingStyle,
  forceReloadCacheBust,
  requestWipeSaveData,
} from "./system_controls.js?v=1.002";
import { drawSingleHero } from "./hero_renderer.js?v=1.002";
import { calculateActiveDps } from "./active_dps.js?v=1.002";
import { drawSingleMob } from "./mob_renderer.js?v=1.010";
import {
  drawJaggedLine,
  RenderEngine,
  getStageTier,
  spawnDeathParticles,
  spawnTemperParticles,
  spawnPurchaseCelebration,
  spawnDamageEffect,
  renderNemesisPreview,
} from "./entity_render_effects.js?v=1.002";
import {
  PARTICLE_THEMES as entityParticleThemes,
  combatVisuals as entityCombatVisuals,
  ParticlePool as entityParticlePool,
  spawnCombatImpactParticles as entitySpawnCombatImpactParticles,
} from "./entity_particle_core.js?v=1.003";
import {
  activeSpellAnims,
  activeSpellLights,
  spawnVisualSpell,
  spawnSpellLight,
  spawnResonantAegisRipple as spellVisualsSpawnResonantAegisRipple,
  spawnAegisPulseVisual,
  spawnNoxiousBloomVisual,
  spawnSanguineRuptureVisual,
  spawnShadowDecoyVisual,
  spawnArcaneSyphonVisual,
  spawnBarrierShatterVisual,
  spawnEarthBreakerBashVisual,
  spawnWindRazor,
  castVisualSpell,
  updateSpellAnimations,
  renderSpellAnimations,
} from "./spell_visuals.js?v=1.003";
import {
  showCustomConfirm as skillsShowCustomConfirm,
  getSubweaponXpRequired,
  gainSubweaponXp,
  SKILL_TREE_DATA,
  SkillTreeManager,
  resolvePlayerStats as skillsResolvePlayerStats,
} from "./skills.js?v=1.004";
import {
  drawBreakableProp,
  DungeonMapGenerator,
  DungeonCamera,
  activeDungeonMap,
  preRenderStaticMap,
  drawDungeonPortalTile,
  renderTopDownMap,
  renderMinimap,
} from "./dungeon_map.js?v=1.004";
import {
  createCalamitySigil,
  signSpecialChallengeContract,
  abandonSpecialChallenge,
  ChallengeEngine,
} from "./challenges.js?v=1.004";
import { MONSTER_CARDS_DATA } from "./bestiary_data.js?v=1.004";
import { spawnFloatingText } from "./floating_text.js?v=1.003";
import { moveEntityWithSmartSteering } from "./smart_steering.js?v=1.005";
import {
  toggleEditHudMode,
  updateEditHudModeStyle,
  toggleSettingsModal,
} from "./settings_ui.js?v=1.006";
import {
  attachToastSwipeHandlers,
  processToastQueue,
  pushToast,
  executePushItemToast,
  handleQuickEquipToast,
  pushMaterialToast,
  executePushMaterialToast,
  pushHeaderToast,
  executePushHeaderToast,
} from "./toasts.js?v=1.007";
import {
  getItemIconSvg,
  UIManager,
  hideTooltip,
  positionTooltip,
  preventTooltipLeaks,
  startSlotLongPress,
  endSlotLongPress,
  showItemTooltip,
  showConsumableTooltip,
  showModifierTooltip,
  showInventoryTooltip,
  showSlotTooltip,
  showForgeTooltip,
  toggleRingComparisonSlot,
} from "./tooltips.js?v=1.008";
import {
  updateFlaskCooldownHUDOnly,
  updateHUD,
  getChallengeObjectiveText,
  updateHudBuffTray,
} from "./hud.js?v=1.011";
import { renderLightingOverlay } from "./lighting.js?v=1.011";
import {
  switchBagTab,
  switchStashTab,
  switchProfileTab,
  navigateToAchievement,
  toggleProfileModal,
  } from "./profile_navigation.js?v=1.015";
import {
  renderBestiaryAlbum,
  stopBestiaryAnimLoop,
  startBestiaryAnimLoop,
  claimBestiarySetReward,
} from "./bestiary_ui.js?v=1.012";
import {
  switchReliquarySubTab,
  equipRelicItem,
  renderReliquaryTab,
  showRelicDetails,
  assignRelic,
  unassignRelic,
} from "./reliquary_ui.js?v=1.014";
import {
  switchAchievementFilter,
  renderAchievementsTab,
} from "./achievements_ui.js?v=1.017";
import {
  toggleBountyModal,
  switchBountyTab,
  selectBountyQuest,
  claimQuestReward,
  renderBountyBoard,
  selectBounty,
} from "./bounty_board.js?v=1.017";
import {
  renderBagModalContent,
  toggleLootBag,
  openSigilPickerModal,
  closeSigilPickerModal,
  selectDeploymentSigil,
  renderSigilPickerList,
  closeDeploymentModal,
  } from "./bag_sigil_ui.js?v=1.021";
import {
  renderProfileModal,
  tryAutoEquip,
  equipFromBag,
  equipFromStash,
  unequipToStash,
  salvageFromStash,
  calculateInsurancePremium,
  calculateRunInsuranceTotals,
  toggleInsurance,
  } from "./profile_stash.js?v=1.023";
import {
  spawnChestEruptionParticles,
  isChestOpened,
  getChestTierAt,
  getChestProgress,
  dispenseChestLootAt,
  setChestOpened,
} from "./chests.js?v=1.019";
import {
  getMobPoolForDepth,
  refillFlaskCharges,
  useDungeonFlask,
  initFlaskButtonDrag,
  resetFlaskButtonPosition,
} from "./mob_pool_flask.js?v=1.019";
import {
  triggerOnslaughtShatterAnimation,
  getOnslaughtSpawnPosition,
  getOnslaughtMobTypeForWave,
  getOnslaughtBossForWave,
  spawnHomingHearts,
  updateHeartOrbs,
  spawnOnslaughtWave,
} from "./onslaught.js?v=1.025";
import {
  openTrialsAltarModal,
  switchTrialsAltarTab,
  changeRiftLevel,
  changeRiftGuardian,
  renderTrialsAltarModal,
  launchOnslaughtArena,
  executeRiftSummon,
  launchRiftDuel,
  spawnRiftGuardianEncounter,
} from "./trials_rift.js?v=1.026";
import {
  spawnGroundLoot,
  updateGroundLoot,
  rechargePlayerArcaneShield,
  addGoldFloatingText,
  triggerGravitationalVacuum,
  spawnHomingGold,
  updateGoldParticles,
  updateHeroBuffParticles,
} from "./world_loot.js?v=1.023";
import {
  updateCavernEffects,
  spawnCavernInteractive,
  triggerCavernTouch,
  triggerCavernShatter,
  drawCavernInteractive,
} from "./cavern_systems.js?v=1.025";
import {
  spawnResonantAegisRipple,
  spawnCombatImpactParticles,
} from "./combat_effects.js?v=1.024";
import {
  handleVanguardBlockTrigger,
  handleVanguardParryTrigger,
  checkAndSpawnNoxiousBloom,
  triggerWindRazorStrike,
} from "./defense_hooks.js?v=1.029";
import { rollTomeSpells } from "./tome_item_hook.js?v=1.026";
import {
  loadHub,
  enterDungeonRun,
  openHubPortalModal,
  switchDeployTab,
  renderAstralShop,
  openDeploymentModal,
  changeDeploymentFloor,
  changeDeploymentSigil,
  renderDeploymentModal,
  toggleDeploymentInsurance,
  executeDeployment,
  spawnBossEncounter,
  onBossDefeated,
  loadDungeonFloor,
  interactWithStation,
  requestAbandonRun,
  openPortalChoiceModal,
  checkRecoveryChestUnclaimed,
  executePortalDescend,
  executePortalExtract,
  decrementPotionRunCharges,
  triggerExtraction,
  startDeathSequence,
} from "./lifecycle.js?v=1.039";
import { BossAIEngine } from "./boss_ai.js?v=1.046";
import {
  openTactileSackCrateAnimation,
  openMonsterCardSackAnimation,
} from "./unboxing.js?v=1.033";
import { updateActiveProjectiles } from "./projectile_update.js?v=1.031";
import { updateCombatPeriodic } from "./combat_periodic.js?v=1.034";
import { updateCombatHazards } from "./combat_hazards.js?v=1.035";
import { updateCombatTargeting } from "./combat_targeting.js?v=1.036";
import { resolvePlayerAttack } from "./player_attack.js?v=1.038";
import { updateStandardMobCombat } from "./mob_combat.js?v=1.045";
import { updateBossCombat } from "./boss_combat.js?v=1.041";
import { updateDungeonCombat } from "./dungeon_combat.js?v=1.044";
import { updateGame } from "./game_update.js?v=1.039";
import { renderGame } from "./game_render.js?v=1.045";
import { startGameLoop } from "./game_loop.js?v=1.041";
import {
  checkOrientation,
  drawPortraitBossHealthBar,
  resizeCanvas,
  checkCollisionAt,
  isAnyMenuOpen,
  spawnCalamitySpecter,
  spawnHomingXp,
  updateXpOrbs,
  addDungeonRunScrap,
  spawnGroundMaterial,
  updateGroundMaterials,
  executeMysticalTrade,
  addEtcDrop,
  addUseDrop,
  useConsumableItem,
  destroyBreakableProp,
  fitConstellationTreeToViewport,
  openSkillTree,
  toggleMasteryModal,
  toggleMute,
  updateMasterVolume,
  updateSfxVolume,
  updateBgmVolume,
} from "./main.js?v=1.007";

window.MYSTICAL_STOCK ??= MYSTICAL_STOCK;
window.POTION_TRANSMUTATIONS ??= POTION_TRANSMUTATIONS;
window.etcDex ??= etcDex;
window.useDex ??= useDex;
window.ARTIFACT_POOL ??= ARTIFACT_POOL;
window.SET_DEFINITIONS ??= SET_DEFINITIONS;
window.AchievementsData ??= AchievementsData;
window.slotNouns ??= slotNouns;
window.COSMETIC_SKINS ??= COSMETIC_SKINS;
window.COSMETIC_COSTUMES ??= COSMETIC_COSTUMES;
window.CAVERN_BUFFS ??= CAVERN_BUFFS;
window.CAVERN_DEBUFFS ??= CAVERN_DEBUFFS;
window.ASTRAL_SHOP_STOCK ??= ASTRAL_SHOP_STOCK;
window.TITLES_DATA ??= TITLES_DATA;
window.CARD_UPGRADE_THRESHOLDS ??= CARD_UPGRADE_THRESHOLDS;
window.MONSTER_CARDS_DATA ??= BASE_MONSTER_CARDS_DATA;
window.CARD_SETS_DATA ??= CARD_SETS_DATA;
window.TILE_TYPES ??= TILE_TYPES;
window.DUNGEON_CONFIG ??= DUNGEON_CONFIG;
window.GAME_STATES ??= GAME_STATES;
window.BOSS_BAR_THEMES ??= BOSS_BAR_THEMES;
window.getPlayer = getPlayer;
for (const [name, value] of Object.entries(dataApi)) {
  if (!(name in window)) window[name] = value;
}
for (const [name, value] of Object.entries(assetApi)) {
  if (!(name in window)) window[name] = value;
}
for (const [name, value] of Object.entries(audioApi)) {
  if (!(name in window)) window[name] = value;
}
for (const [name, value] of Object.entries(itemsApi)) {
  if (!(name in window)) window[name] = value;
}
window.openCavernSigilSackAnimation = openCavernSigilSackAnimation;
window.updateDpsOverlayStyle = updateDpsOverlayStyle;
window.updateDpsOverlayPosition = updateDpsOverlayPosition;
window.initDpsOverlayDrag = initDpsOverlayDrag;
window.toggleEcoMode = toggleEcoMode;
window.updateEcoModeStyle = updateEcoModeStyle;
window.toggleLighting = toggleLighting;
window.updateLightingStyle = updateLightingStyle;
window.forceReloadCacheBust = forceReloadCacheBust;
window.requestWipeSaveData = requestWipeSaveData;
window.drawSingleHero = drawSingleHero;
window.calculateActiveDps = calculateActiveDps;
window.drawSingleMob = drawSingleMob;
window.drawJaggedLine = drawJaggedLine;
window.RenderEngine = RenderEngine;
window.getStageTier = getStageTier;
window.spawnDeathParticles = spawnDeathParticles;
window.spawnTemperParticles = spawnTemperParticles;
window.spawnPurchaseCelebration = spawnPurchaseCelebration;
window.spawnDamageEffect = spawnDamageEffect;
window.renderNemesisPreview = renderNemesisPreview;
window.PARTICLE_THEMES ??= entityParticleThemes;
window.combatVisuals ??= entityCombatVisuals;
window.ParticlePool ??= entityParticlePool;
window.spawnCombatImpactParticles ??= entitySpawnCombatImpactParticles;
window.activeSpellAnims = activeSpellAnims;
window.activeSpellLights = activeSpellLights;
window.spawnVisualSpell = spawnVisualSpell;
window.spawnSpellLight = spawnSpellLight;
window.spawnResonantAegisRipple = spellVisualsSpawnResonantAegisRipple;
window.spawnAegisPulseVisual = spawnAegisPulseVisual;
window.spawnNoxiousBloomVisual = spawnNoxiousBloomVisual;
window.spawnSanguineRuptureVisual = spawnSanguineRuptureVisual;
window.spawnShadowDecoyVisual = spawnShadowDecoyVisual;
window.spawnArcaneSyphonVisual = spawnArcaneSyphonVisual;
window.spawnBarrierShatterVisual = spawnBarrierShatterVisual;
window.spawnEarthBreakerBashVisual = spawnEarthBreakerBashVisual;
window.spawnWindRazor = spawnWindRazor;
window.castVisualSpell = castVisualSpell;
window.updateSpellAnimations = updateSpellAnimations;
window.renderSpellAnimations = renderSpellAnimations;
window.showCustomConfirm = skillsShowCustomConfirm;
window.getSubweaponXpRequired = getSubweaponXpRequired;
window.gainSubweaponXp = gainSubweaponXp;
window.SKILL_TREE_DATA = SKILL_TREE_DATA;
window.SkillTreeManager = SkillTreeManager;
if (skillsResolvePlayerStats) {
  window.resolvePlayerStats = skillsResolvePlayerStats;
}
window.drawBreakableProp = drawBreakableProp;
window.DungeonMapGenerator = DungeonMapGenerator;
window.DungeonCamera ??= DungeonCamera;
window.activeDungeonMap ??= activeDungeonMap;
window.preRenderStaticMap = preRenderStaticMap;
window.drawDungeonPortalTile = drawDungeonPortalTile;
window.renderTopDownMap = renderTopDownMap;
window.renderMinimap = renderMinimap;
window.ItemFactory ??= {};
window.ItemFactory.createCalamitySigil = createCalamitySigil;
window.signSpecialChallengeContract = signSpecialChallengeContract;
window.abandonSpecialChallenge = abandonSpecialChallenge;
window.ChallengeEngine ??= ChallengeEngine;
window.MONSTER_CARDS_DATA = MONSTER_CARDS_DATA;
window.spawnFloatingText = spawnFloatingText;
window.moveEntityWithSmartSteering = moveEntityWithSmartSteering;
window.toggleEditHudMode = toggleEditHudMode;
window.updateEditHudModeStyle = updateEditHudModeStyle;
window.toggleSettingsModal = toggleSettingsModal;
window.attachToastSwipeHandlers = attachToastSwipeHandlers;
window.processToastQueue = processToastQueue;
window.pushToast = pushToast;
window.executePushItemToast = executePushItemToast;
window.handleQuickEquipToast = handleQuickEquipToast;
window.pushMaterialToast = pushMaterialToast;
window.executePushMaterialToast = executePushMaterialToast;
window.pushHeaderToast = pushHeaderToast;
window.executePushHeaderToast = executePushHeaderToast;
window.getItemIconSvg = getItemIconSvg;
window.UIManager = UIManager;
window.hideTooltip = hideTooltip;
window.positionTooltip = positionTooltip;
window.preventTooltipLeaks = preventTooltipLeaks;
window.startSlotLongPress = startSlotLongPress;
window.endSlotLongPress = endSlotLongPress;
window.showItemTooltip = showItemTooltip;
window.showConsumableTooltip = showConsumableTooltip;
window.showModifierTooltip = showModifierTooltip;
window.showInventoryTooltip = showInventoryTooltip;
window.showSlotTooltip = showSlotTooltip;
window.showForgeTooltip = showForgeTooltip;
window.toggleRingComparisonSlot = toggleRingComparisonSlot;
window.updateFlaskCooldownHUDOnly = updateFlaskCooldownHUDOnly;
window.updateHUD = updateHUD;
window.getChallengeObjectiveText = getChallengeObjectiveText;
window.updateHudBuffTray = updateHudBuffTray;
window.renderLightingOverlay = renderLightingOverlay;
window.switchBagTab = switchBagTab;
window.switchStashTab = switchStashTab;
window.switchProfileTab = switchProfileTab;
window.navigateToAchievement = navigateToAchievement;
window.toggleProfileModal = toggleProfileModal;
window.renderBestiaryAlbum = renderBestiaryAlbum;
window.stopBestiaryAnimLoop = stopBestiaryAnimLoop;
window.startBestiaryAnimLoop = startBestiaryAnimLoop;
window.claimBestiarySetReward = claimBestiarySetReward;
window.switchReliquarySubTab = switchReliquarySubTab;
window.equipRelicItem = equipRelicItem;
window.renderReliquaryTab = renderReliquaryTab;
window.showRelicDetails = showRelicDetails;
window.assignRelic = assignRelic;
window.unassignRelic = unassignRelic;
window.switchAchievementFilter = switchAchievementFilter;
window.renderAchievementsTab = renderAchievementsTab;
window.toggleBountyModal = toggleBountyModal;
window.switchBountyTab = switchBountyTab;
window.selectBountyQuest = selectBountyQuest;
window.claimQuestReward = claimQuestReward;
window.renderBountyBoard = renderBountyBoard;
window.selectBounty = selectBounty;
window.renderBagModalContent = renderBagModalContent;
window.toggleLootBag = toggleLootBag;
window.openSigilPickerModal = openSigilPickerModal;
window.closeSigilPickerModal = closeSigilPickerModal;
window.selectDeploymentSigil = selectDeploymentSigil;
window.renderSigilPickerList = renderSigilPickerList;
window.closeDeploymentModal = closeDeploymentModal;
window.renderProfileModal = renderProfileModal;
window.tryAutoEquip = tryAutoEquip;
window.equipFromBag = equipFromBag;
window.equipFromStash = equipFromStash;
window.unequipToStash = unequipToStash;
window.salvageFromStash = salvageFromStash;
window.calculateInsurancePremium = calculateInsurancePremium;
window.calculateRunInsuranceTotals = calculateRunInsuranceTotals;
window.toggleInsurance = toggleInsurance;
window.spawnChestEruptionParticles = spawnChestEruptionParticles;
window.isChestOpened = isChestOpened;
window.getChestTierAt = getChestTierAt;
window.getChestProgress = getChestProgress;
window.dispenseChestLootAt = dispenseChestLootAt;
window.setChestOpened = setChestOpened;
window.getMobPoolForDepth = getMobPoolForDepth;
window.refillFlaskCharges = refillFlaskCharges;
window.useDungeonFlask = useDungeonFlask;
window.initFlaskButtonDrag = initFlaskButtonDrag;
window.resetFlaskButtonPosition = resetFlaskButtonPosition;
window.triggerOnslaughtShatterAnimation = triggerOnslaughtShatterAnimation;
window.getOnslaughtSpawnPosition = getOnslaughtSpawnPosition;
window.getOnslaughtMobTypeForWave = getOnslaughtMobTypeForWave;
window.getOnslaughtBossForWave = getOnslaughtBossForWave;
window.spawnHomingHearts = spawnHomingHearts;
window.updateHeartOrbs = updateHeartOrbs;
window.spawnOnslaughtWave = spawnOnslaughtWave;
window.openTrialsAltarModal = openTrialsAltarModal;
window.switchTrialsAltarTab = switchTrialsAltarTab;
window.changeRiftLevel = changeRiftLevel;
window.changeRiftGuardian = changeRiftGuardian;
window.renderTrialsAltarModal = renderTrialsAltarModal;
window.launchOnslaughtArena = launchOnslaughtArena;
window.executeRiftSummon = executeRiftSummon;
window.launchRiftDuel = launchRiftDuel;
window.spawnRiftGuardianEncounter = spawnRiftGuardianEncounter;
window.spawnGroundLoot = spawnGroundLoot;
window.updateGroundLoot = updateGroundLoot;
window.rechargePlayerArcaneShield = rechargePlayerArcaneShield;
window.addGoldFloatingText = addGoldFloatingText;
window.triggerGravitationalVacuum = triggerGravitationalVacuum;
window.spawnHomingGold = spawnHomingGold;
window.updateGoldParticles = updateGoldParticles;
window.updateHeroBuffParticles = updateHeroBuffParticles;
window.updateCavernEffects = updateCavernEffects;
window.spawnCavernInteractive = spawnCavernInteractive;
window.triggerCavernTouch = triggerCavernTouch;
window.triggerCavernShatter = triggerCavernShatter;
window.drawCavernInteractive = drawCavernInteractive;
window.spawnResonantAegisRipple = spawnResonantAegisRipple;
window.spawnCombatImpactParticles = spawnCombatImpactParticles;
window.handleVanguardBlockTrigger = handleVanguardBlockTrigger;
window.handleVanguardParryTrigger = handleVanguardParryTrigger;
window.checkAndSpawnNoxiousBloom = checkAndSpawnNoxiousBloom;
window.triggerWindRazorStrike = triggerWindRazorStrike;
window.rollTomeSpells = rollTomeSpells;
window.loadHub = loadHub;
window.enterDungeonRun = enterDungeonRun;
window.openHubPortalModal = openHubPortalModal;
window.switchDeployTab = switchDeployTab;
window.renderAstralShop = renderAstralShop;
window.openDeploymentModal = openDeploymentModal;
window.changeDeploymentFloor = changeDeploymentFloor;
window.changeDeploymentSigil = changeDeploymentSigil;
window.renderDeploymentModal = renderDeploymentModal;
window.toggleDeploymentInsurance = toggleDeploymentInsurance;
window.executeDeployment = executeDeployment;
window.spawnBossEncounter = spawnBossEncounter;
window.onBossDefeated = onBossDefeated;
window.loadDungeonFloor = loadDungeonFloor;
window.interactWithStation = interactWithStation;
window.requestAbandonRun = requestAbandonRun;
window.openPortalChoiceModal = openPortalChoiceModal;
window.checkRecoveryChestUnclaimed = checkRecoveryChestUnclaimed;
window.executePortalDescend = executePortalDescend;
window.executePortalExtract = executePortalExtract;
window.decrementPotionRunCharges = decrementPotionRunCharges;
window.triggerExtraction = triggerExtraction;
window.startDeathSequence = startDeathSequence;
window.BossAIEngine = BossAIEngine;
window.openTactileSackCrateAnimation = openTactileSackCrateAnimation;
window.openMonsterCardSackAnimation = openMonsterCardSackAnimation;
window.updateActiveProjectiles = updateActiveProjectiles;
window.updateCombatPeriodic = updateCombatPeriodic;
window.updateCombatHazards = updateCombatHazards;
window.updateCombatTargeting = updateCombatTargeting;
window.resolvePlayerAttack = resolvePlayerAttack;
window.updateStandardMobCombat = updateStandardMobCombat;
window.updateBossCombat = updateBossCombat;
window.updateDungeonCombat = updateDungeonCombat;
window.updateGame = updateGame;
window.renderGame = renderGame;
window.startGameLoop = startGameLoop;
window.checkOrientation = checkOrientation;
window.drawPortraitBossHealthBar = drawPortraitBossHealthBar;
window.resizeCanvas = resizeCanvas;
window.checkCollisionAt = checkCollisionAt;
window.isAnyMenuOpen = isAnyMenuOpen;
window.spawnCalamitySpecter = spawnCalamitySpecter;
window.spawnHomingXp = spawnHomingXp;
window.updateXpOrbs = updateXpOrbs;
window.addDungeonRunScrap = addDungeonRunScrap;
window.spawnGroundMaterial = spawnGroundMaterial;
window.updateGroundMaterials = updateGroundMaterials;
window.executeMysticalTrade = executeMysticalTrade;
window.addEtcDrop = addEtcDrop;
window.addUseDrop = addUseDrop;
window.useConsumableItem = useConsumableItem;
window.destroyBreakableProp = destroyBreakableProp;
window.fitConstellationTreeToViewport = fitConstellationTreeToViewport;
window.openSkillTree = openSkillTree;
window.toggleMasteryModal = toggleMasteryModal;
window.toggleMute = toggleMute;
window.updateMasterVolume = updateMasterVolume;
window.updateSfxVolume = updateSfxVolume;
window.updateBgmVolume = updateBgmVolume;

const engineSaveResetInfo = dataApi.getEngineSaveResetInfo();
if (engineSaveResetInfo) {
  pushHeaderToast(
    "ENGINE 1.0: Incompatible save reset. A fresh game was initialized.",
    "#f59e0b",
  );
}
