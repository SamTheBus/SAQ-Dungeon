import "./entity_id.js";
import "./runtime_state.js";
import "./encounter_state.js";
import { getPlayer } from "./player_runtime.js";
import {
  requestShadowDash,
  resetShadowDash,
  updateShadowDashHud,
  initShadowDashButtonDrag,
} from "./shadow_dash.js";

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
} from "./constants.js";
import * as dataApi from "./data.js";
import * as assetApi from "./assets.js";
import * as audioApi from "./audio.js";
import * as itemsApi from "./items.js";
import { openCavernSigilSackAnimation } from "./sigil_sack_animation.js";
import {
  updateDpsOverlayStyle,
  updateDpsOverlayPosition,
  initDpsOverlayDrag,
} from "./dps_overlay_ui.js";
import {
  toggleEcoMode,
  updateEcoModeStyle,
  toggleLighting,
  updateLightingStyle,
  toggleCombatRangeGuides,
  updateCombatRangeGuidesStyle,
  forceReloadCacheBust,
  requestWipeSaveData,
} from "./system_controls.js";
import { drawSingleHero } from "./hero_renderer.js";
import { calculateActiveDps } from "./active_dps.js";
import { drawSingleMob } from "./mob_renderer.js";
import {
  drawJaggedLine,
  RenderEngine,
  getStageTier,
  spawnDeathParticles,
  spawnTemperParticles,
  spawnPurchaseCelebration,
  spawnDamageEffect,
  renderNemesisPreview,
} from "./entity_render_effects.js";
import {
  PARTICLE_THEMES as entityParticleThemes,
  combatVisuals as entityCombatVisuals,
  ParticlePool as entityParticlePool,
  spawnCombatImpactParticles as entitySpawnCombatImpactParticles,
} from "./entity_particle_core.js";
import {
  activeSpellAnims,
  activeSpellLights,
  spawnVisualSpell,
  spawnSpellLight,
  spawnResonantAegisRipple as spellVisualsSpawnResonantAegisRipple,
  spawnPortalSealBreakVisual,
  spawnShadowDashVisual,
  spawnMeleeFeelImpact,
  spawnTomeImpactVisual,
  spawnGuardPressureVisual,
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
} from "./spell_visuals.js";
import {
  showCustomConfirm as skillsShowCustomConfirm,
  getSubweaponXpRequired,
  gainSubweaponXp,
  SKILL_TREE_DATA,
  SkillTreeManager,
  resolvePlayerStats as skillsResolvePlayerStats,
} from "./skills.js";
import {
  drawBreakableProp,
  DungeonMapGenerator,
  DungeonCamera,
  activeDungeonMap,
  preRenderStaticMap,
  drawDungeonPortalTile,
  renderTopDownMap,
  renderMinimap,
} from "./dungeon_map.js";
import {
  createCalamitySigil,
  signSpecialChallengeContract,
  abandonSpecialChallenge,
  ChallengeEngine,
} from "./challenges.js";
import { MONSTER_CARDS_DATA } from "./bestiary_data.js";
import { spawnFloatingText } from "./floating_text.js";
import { moveEntityWithSmartSteering } from "./smart_steering.js";
import {
  toggleEditHudMode,
  updateEditHudModeStyle,
  toggleSettingsModal,
} from "./settings_ui.js";
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
} from "./toasts.js";
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
} from "./tooltips.js";
import {
  updateFlaskCooldownHUDOnly,
  updateHUD,
  getChallengeObjectiveText,
  updateHudBuffTray,
  renderDungeonDepthLabel,
} from "./hud.js";
import { renderLightingOverlay } from "./lighting.js";
import {
  switchBagTab,
  switchStashTab,
  switchProfileTab,
  navigateToAchievement,
  toggleProfileModal,
  } from "./profile_navigation.js";
import {
  renderBestiaryAlbum,
  stopBestiaryAnimLoop,
  startBestiaryAnimLoop,
  claimBestiarySetReward,
} from "./bestiary_ui.js";
import {
  switchReliquarySubTab,
  equipRelicItem,
  renderReliquaryTab,
  showRelicDetails,
  assignRelic,
  unassignRelic,
} from "./reliquary_ui.js";
import {
  switchAchievementFilter,
  renderAchievementsTab,
} from "./achievements_ui.js";
import {
  toggleBountyModal,
  switchBountyTab,
  selectBountyQuest,
  claimQuestReward,
  renderBountyBoard,
  selectBounty,
} from "./bounty_board.js";
import {
  renderBagModalContent,
  toggleLootBag,
  openSigilPickerModal,
  closeSigilPickerModal,
  selectDeploymentSigil,
  renderSigilPickerList,
  closeDeploymentModal,
  } from "./bag_sigil_ui.js";
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
  } from "./profile_stash.js";
import {
  spawnChestEruptionParticles,
  isChestOpened,
  getChestTierAt,
  getChestProgress,
  dispenseChestLootAt,
  setChestOpened,
} from "./chests.js";
import {
  getMobPoolForDepth,
  refillFlaskCharges,
  useDungeonFlask,
  initFlaskButtonDrag,
  resetFlaskButtonPosition,
} from "./mob_pool_flask.js";
import {
  triggerOnslaughtShatterAnimation,
  getOnslaughtSpawnPosition,
  getOnslaughtMobTypeForWave,
  getOnslaughtBossForWave,
  spawnHomingHearts,
  updateHeartOrbs,
  spawnOnslaughtWave,
} from "./onslaught.js";
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
} from "./trials_rift.js";
import {
  spawnGroundLoot,
  updateGroundLoot,
  rechargePlayerArcaneShield,
  addGoldFloatingText,
  triggerGravitationalVacuum,
  spawnHomingGold,
  updateGoldParticles,
  updateHeroBuffParticles,
} from "./world_loot.js";
import {
  updateCavernEffects,
  spawnCavernInteractive,
  triggerCavernTouch,
  triggerCavernShatter,
  drawCavernInteractive,
} from "./cavern_systems.js";
import { spawnCombatImpactParticles } from "./combat_effects.js";
import {
  handleVanguardBlockTrigger,
  handleVanguardParryTrigger,
  checkAndSpawnNoxiousBloom,
  triggerWindRazorStrike,
} from "./defense_hooks.js";
import { rollTomeSpells } from "./tome_item_hook.js";
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
} from "./lifecycle.js";
import { BossAIEngine } from "./boss_ai.js";
import {
  openTactileSackCrateAnimation,
  openMonsterCardSackAnimation,
} from "./unboxing.js";
import { updateActiveProjectiles } from "./projectile_update.js";
import { updateCombatPeriodic } from "./combat_periodic.js";
import { updateCombatHazards } from "./combat_hazards.js";
import {
  PLAYER_COMBAT_RADIUS,
  SHIELD_DAGGER_CLEAR_HULL_GAP,
  TOME_CLEAR_HULL_GAP,
  TOME_PROJECTILE_RADIUS,
  canPlayerReachCombatTarget,
  getClearHullGap,
  hasCombatLineOfEffect,
  hasTomeLineOfSight,
  isTomeCombatProfile,
} from "./combat_reach.js";
import {
  ELEMENT_AREA_BASE_RADIUS,
  LIGHTNING_CHAIN_BASE_RADIUS,
  PRODUCTION_FIRE_TOME_BURN_PROFILE,
  PRODUCTION_FROST_CONTROL_PROFILE,
  advanceCanonicalElementStates,
  applyCanonicalFireTomeBurn,
  applyCanonicalFrostControl,
  applyElementalOverloadFrostSlow,
  clearElementStates,
  getCanonicalElementAreaRadius,
  getElementStateSnapshot,
  getFrostMovementMultiplier,
  getFrostMovementCompositionSnapshot,
  getLastLightningChainSnapshot,
  isEligiblePlayerElementTarget,
  resolveTomeElementSecondaryEffect,
} from "./element_effect_authority.js";
import {
  BIOHAZARD_CAPSTONE_PROFILE,
  WARLORD_CAPSTONE_PROFILE,
  presentSetCapstoneAttackAction,
  resolveBiohazardAttackAction,
  resolveCanonicalSetCapstoneAttackAction,
  resolveWarlordCriticalAction,
} from "./set_capstone_authority.js";
import {
  TOME_PROJECTILE_SPEED,
  TOME_PROJECTILE_VISUAL_PROFILE,
  launchTomeAttackProjectile,
  renderTomeDeliveryProjectile,
  resolveTomeProjectileImpact,
} from "./tome_projectile.js";
import {
  TOME_ELEMENT_ORDER,
  SPELL_WEAVING_DURATION_FRAMES,
  resolvePersistedTomeElementList,
  formatTomeElementSequence,
  getTomeIdentityPresentation,
  resetTomeRotation,
  getTomeRotationSnapshot,
  commitSuccessfulTomeProcAnchor,
  advanceSpellWeavingTimer,
  resolveCanonicalTomeSpellProcEvent,
  presentCanonicalTomeSpellProcEvent,
  getLastTomeProcSnapshot,
} from "./tome_rotation_authority.js";
import {
  GUARD_PRESSURE_MAX,
  EARTH_BREAKER_BASH_RANGE,
  EARTH_BREAKER_CONE_HALF_ANGLE,
  EARTH_BREAKER_STUN_FRAMES,
  getGuardPressureSnapshot,
  resetGuardPressure,
  fillGuardPressureFromBlock,
  calculateCanonicalShieldBashDamage,
  resolveCanonicalShieldBash,
  resolveSuccessfulShieldMainAttack,
  getLastShieldBashSnapshot,
} from "./shield_guard_pressure.js";
import {
  DAGGER_SUBTYPE_CONTRACTS,
  resolveDaggerSubtypeIdentity,
  getDaggerSubtypeContract,
  isDaggerCombatProfile,
  canApplyDaggerMainBleed,
  canExecuteDaggerOffhand,
  canApplyVipersCoating,
} from "./dagger_identity_contract.js";
import {
  FUTURE_IDLE_ATTACK_SPEED_COMMUNICATION,
  INACTIVE_COEFFICIENT_COMMUNICATION,
  getDaggerCommunicationSnapshot,
  getGuardPressureCommunicationSnapshot,
  getPlayerTargetCommunicationSnapshot,
  resolveCombatCommunicationProfile,
  getTargetPeriodicCommunicationSnapshot,
  getTomeCommunicationSnapshot,
  renderCombatReachCommunication,
} from "./combat_communication_authority.js";
import {
  classifyTomeProjectileBlock,
  getTomeDeliveryCommunicationSnapshot,
  recordTomeDeliveryCommunication,
} from "./tome_delivery_communication.js";
import { updateCombatTargeting } from "./combat_targeting.js";
import { resolvePlayerAttack } from "./player_attack.js";
import {
  ensureMobBuffState,
  updateStandardMobCombat,
} from "./mob_combat.js";
import { updateBossCombat } from "./boss_combat.js";
import { updateDungeonCombat } from "./dungeon_combat.js";
import { updateGame } from "./game_update.js";
import { renderGame } from "./game_render.js";
import { startGameLoop } from "./game_loop.js";
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
} from "./main.js";

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
window.toggleCombatRangeGuides = toggleCombatRangeGuides;
window.updateCombatRangeGuidesStyle = updateCombatRangeGuidesStyle;
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
window.spawnPortalSealBreakVisual = spawnPortalSealBreakVisual;
window.spawnShadowDashVisual = spawnShadowDashVisual;
window.spawnMeleeFeelImpact = spawnMeleeFeelImpact;
window.spawnTomeImpactVisual = spawnTomeImpactVisual;
window.spawnGuardPressureVisual = spawnGuardPressureVisual;
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
window.renderDungeonDepthLabel = renderDungeonDepthLabel;
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
window.spawnCombatImpactParticles = spawnCombatImpactParticles;
window.requestShadowDash = requestShadowDash;
window.resetShadowDash = resetShadowDash;
window.updateShadowDashHud = updateShadowDashHud;
window.initShadowDashButtonDrag = initShadowDashButtonDrag;
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
window.PLAYER_COMBAT_RADIUS = PLAYER_COMBAT_RADIUS;
window.SHIELD_DAGGER_CLEAR_HULL_GAP = SHIELD_DAGGER_CLEAR_HULL_GAP;
window.TOME_CLEAR_HULL_GAP = TOME_CLEAR_HULL_GAP;
window.TOME_PROJECTILE_RADIUS = TOME_PROJECTILE_RADIUS;
window.TOME_PROJECTILE_SPEED = TOME_PROJECTILE_SPEED;
window.TOME_PROJECTILE_VISUAL_PROFILE = TOME_PROJECTILE_VISUAL_PROFILE;
window.canPlayerReachCombatTarget = canPlayerReachCombatTarget;
window.getClearHullGap = getClearHullGap;
window.hasCombatLineOfEffect = hasCombatLineOfEffect;
window.hasTomeLineOfSight = hasTomeLineOfSight;
window.isTomeCombatProfile = isTomeCombatProfile;
window.ELEMENT_AREA_BASE_RADIUS = ELEMENT_AREA_BASE_RADIUS;
window.LIGHTNING_CHAIN_BASE_RADIUS = LIGHTNING_CHAIN_BASE_RADIUS;
window.PRODUCTION_FIRE_TOME_BURN_PROFILE = PRODUCTION_FIRE_TOME_BURN_PROFILE;
window.PRODUCTION_FROST_CONTROL_PROFILE = PRODUCTION_FROST_CONTROL_PROFILE;
window.advanceCanonicalElementStates = advanceCanonicalElementStates;
window.applyCanonicalFireTomeBurn = applyCanonicalFireTomeBurn;
window.applyCanonicalFrostControl = applyCanonicalFrostControl;
window.applyElementalOverloadFrostSlow = applyElementalOverloadFrostSlow;
window.clearElementStates = clearElementStates;
window.getCanonicalElementAreaRadius = getCanonicalElementAreaRadius;
window.getElementStateSnapshot = getElementStateSnapshot;
window.getFrostMovementMultiplier = getFrostMovementMultiplier;
window.getFrostMovementCompositionSnapshot = getFrostMovementCompositionSnapshot;
window.getLastLightningChainSnapshot = getLastLightningChainSnapshot;
window.isEligiblePlayerElementTarget = isEligiblePlayerElementTarget;
window.resolveTomeElementSecondaryEffect = resolveTomeElementSecondaryEffect;
window.BIOHAZARD_CAPSTONE_PROFILE = BIOHAZARD_CAPSTONE_PROFILE;
window.WARLORD_CAPSTONE_PROFILE = WARLORD_CAPSTONE_PROFILE;
window.resolveBiohazardAttackAction = resolveBiohazardAttackAction;
window.resolveWarlordCriticalAction = resolveWarlordCriticalAction;
window.resolveCanonicalSetCapstoneAttackAction =
  resolveCanonicalSetCapstoneAttackAction;
window.presentSetCapstoneAttackAction = presentSetCapstoneAttackAction;
window.launchTomeAttackProjectile = launchTomeAttackProjectile;
window.renderTomeDeliveryProjectile = renderTomeDeliveryProjectile;
window.resolveTomeProjectileImpact = resolveTomeProjectileImpact;
window.TOME_ELEMENT_ORDER = TOME_ELEMENT_ORDER;
window.SPELL_WEAVING_DURATION_FRAMES = SPELL_WEAVING_DURATION_FRAMES;
window.resolvePersistedTomeElementList = resolvePersistedTomeElementList;
window.formatTomeElementSequence = formatTomeElementSequence;
window.getTomeIdentityPresentation = getTomeIdentityPresentation;
window.resetTomeRotation = resetTomeRotation;
window.getTomeRotationSnapshot = getTomeRotationSnapshot;
window.commitSuccessfulTomeProcAnchor = commitSuccessfulTomeProcAnchor;
window.advanceSpellWeavingTimer = advanceSpellWeavingTimer;
window.resolveCanonicalTomeSpellProcEvent = resolveCanonicalTomeSpellProcEvent;
window.presentCanonicalTomeSpellProcEvent = presentCanonicalTomeSpellProcEvent;
window.getLastTomeProcSnapshot = getLastTomeProcSnapshot;
window.GUARD_PRESSURE_MAX = GUARD_PRESSURE_MAX;
window.EARTH_BREAKER_BASH_RANGE = EARTH_BREAKER_BASH_RANGE;
window.EARTH_BREAKER_CONE_HALF_ANGLE = EARTH_BREAKER_CONE_HALF_ANGLE;
window.EARTH_BREAKER_STUN_FRAMES = EARTH_BREAKER_STUN_FRAMES;
window.getGuardPressureSnapshot = getGuardPressureSnapshot;
window.resetGuardPressure = resetGuardPressure;
window.fillGuardPressureFromBlock = fillGuardPressureFromBlock;
window.calculateCanonicalShieldBashDamage = calculateCanonicalShieldBashDamage;
window.resolveCanonicalShieldBash = resolveCanonicalShieldBash;
window.resolveSuccessfulShieldMainAttack = resolveSuccessfulShieldMainAttack;
window.getLastShieldBashSnapshot = getLastShieldBashSnapshot;
window.DAGGER_SUBTYPE_CONTRACTS = DAGGER_SUBTYPE_CONTRACTS;
window.resolveDaggerSubtypeIdentity = resolveDaggerSubtypeIdentity;
window.getDaggerSubtypeContract = getDaggerSubtypeContract;
window.isDaggerCombatProfile = isDaggerCombatProfile;
window.canApplyDaggerMainBleed = canApplyDaggerMainBleed;
window.canExecuteDaggerOffhand = canExecuteDaggerOffhand;
window.canApplyVipersCoating = canApplyVipersCoating;
window.FUTURE_IDLE_ATTACK_SPEED_COMMUNICATION = FUTURE_IDLE_ATTACK_SPEED_COMMUNICATION;
window.INACTIVE_COEFFICIENT_COMMUNICATION = INACTIVE_COEFFICIENT_COMMUNICATION;
window.getDaggerCommunicationSnapshot = getDaggerCommunicationSnapshot;
window.getGuardPressureCommunicationSnapshot = getGuardPressureCommunicationSnapshot;
window.getPlayerTargetCommunicationSnapshot = getPlayerTargetCommunicationSnapshot;
window.resolveCombatCommunicationProfile = resolveCombatCommunicationProfile;
window.getTargetPeriodicCommunicationSnapshot = getTargetPeriodicCommunicationSnapshot;
window.getTomeCommunicationSnapshot = getTomeCommunicationSnapshot;
window.renderCombatReachCommunication = renderCombatReachCommunication;
window.classifyTomeProjectileBlock = classifyTomeProjectileBlock;
window.getTomeDeliveryCommunicationSnapshot = getTomeDeliveryCommunicationSnapshot;
window.recordTomeDeliveryCommunication = recordTomeDeliveryCommunication;
window.updateCombatTargeting = updateCombatTargeting;
window.resolvePlayerAttack = resolvePlayerAttack;
window.updateStandardMobCombat = updateStandardMobCombat;
window.ensureMobBuffState = ensureMobBuffState;
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
