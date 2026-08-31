const profileNavigationState = {
  activeBagTab: "EQUIP",
  activeStashTab: "EQUIP",
  activeProfileMobileTab: "stats",
};

const achievementState = {
  filter: "all",
};

const bountyBoardState = {
  activeTab: "challenges",
  selectedBountyId: null,
  selectedQuestId: null,
};

const reliquaryState = {
  subTab: "codex",
  selectedAspectTrait: null,
};

export function getActiveBagTab() {
  return profileNavigationState.activeBagTab;
}

export function setActiveBagTab(tabKey) {
  profileNavigationState.activeBagTab = tabKey;
}

export function getActiveStashTab() {
  return profileNavigationState.activeStashTab;
}

export function setActiveStashTab(tabKey) {
  profileNavigationState.activeStashTab = tabKey;
}

export function getActiveProfileMobileTab() {
  return profileNavigationState.activeProfileMobileTab;
}

export function setActiveProfileMobileTab(tabKey) {
  profileNavigationState.activeProfileMobileTab = tabKey;
}

export function getAchievementFilter() {
  return achievementState.filter;
}

export function setAchievementFilter(filterKey) {
  achievementState.filter = filterKey;
}

export function getBountyActiveTab() {
  return bountyBoardState.activeTab;
}

export function setBountyActiveTab(tabKey) {
  bountyBoardState.activeTab = tabKey;
}

export function getSelectedBountyId() {
  return bountyBoardState.selectedBountyId;
}

export function setSelectedBountyId(bountyId) {
  bountyBoardState.selectedBountyId = bountyId;
}

export function getSelectedQuestId() {
  return bountyBoardState.selectedQuestId;
}

export function setSelectedQuestId(questId) {
  bountyBoardState.selectedQuestId = questId;
}

export function getReliquarySubTab() {
  return reliquaryState.subTab;
}

export function setReliquarySubTab(tabKey) {
  reliquaryState.subTab = tabKey;
}

export function getSelectedAspectTrait() {
  return reliquaryState.selectedAspectTrait;
}

export function setSelectedAspectTrait(trait) {
  reliquaryState.selectedAspectTrait = trait;
}
