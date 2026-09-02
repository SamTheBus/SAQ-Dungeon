export const DAGGER_SUBTYPE_CONTRACTS = Object.freeze({
  flurry: Object.freeze({
    id: "flurry",
    label: "Flurry",
    mainBleedEligible: true,
    offhandEligible: true,
    viperCoatingEligible: true,
    role: "fastest Poison delivery through successful offhand strikes; main Bleed remains legal",
  }),
  stiletto: Object.freeze({
    id: "stiletto",
    label: "Stiletto",
    mainBleedEligible: true,
    offhandEligible: false,
    viperCoatingEligible: false,
    role: "primary Bleed application and Sanguine Rupture setup",
  }),
  main_gauche: Object.freeze({
    id: "main_gauche",
    label: "Main-gauche",
    mainBleedEligible: false,
    offhandEligible: false,
    viperCoatingEligible: false,
    role: "reactive Parry/Riposte identity; no forced proactive Poison or Bleed",
  }),
});

function normalizedText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\s-]+/g, "_");
}

export function resolveDaggerSubtypeIdentity({
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
} = {}) {
  const candidates = [
    subweapon?.daggerSubtype,
    subweapon?.subArchetype,
    subweapon?.archetype,
    subweapon?.noun,
    subweapon?.name,
    resolvedStats?.daggerSubtype,
    resolvedStats?.subArchetype,
  ].map(normalizedText);

  for (const candidate of candidates) {
    if (candidate.includes("main_gauche") || candidate.includes("maingauche")) {
      return "main_gauche";
    }
    if (candidate.includes("stiletto")) return "stiletto";
    if (candidate.includes("flurry")) return "flurry";
  }

  return "flurry";
}

export function getDaggerSubtypeContract(options = {}) {
  return DAGGER_SUBTYPE_CONTRACTS[resolveDaggerSubtypeIdentity(options)];
}

export function isDaggerCombatProfile(
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
) {
  return (
    resolvedStats?.subType === "dagger" ||
    subweapon?.subType === "dagger" ||
    subweapon?.type === "dagger"
  );
}

export function canApplyDaggerMainBleed({
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
} = {}) {
  if (!isDaggerCombatProfile(resolvedStats, subweapon)) return false;
  return (
    getDaggerSubtypeContract({ resolvedStats, subweapon }).mainBleedEligible &&
    Number(resolvedStats?.bleedChance || 0) > 0
  );
}

export function canExecuteDaggerOffhand({
  resolvedStats,
  subweapon = window.equippedSlots?.subweapon,
} = {}) {
  if (!isDaggerCombatProfile(resolvedStats, subweapon)) return false;
  return (
    getDaggerSubtypeContract({ resolvedStats, subweapon }).offhandEligible &&
    Number(resolvedStats?.offhandChance || 0) > 0
  );
}

export function canApplyVipersCoating(options = {}) {
  return getDaggerSubtypeContract(options).viperCoatingEligible;
}
