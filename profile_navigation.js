  import {
    getActiveProfileMobileTab,
    setAchievementFilter,
    setActiveBagTab,
    setActiveProfileMobileTab,
    setActiveStashTab,
  } from "./ui_state.js";

  export function switchBagTab(tabKey) {
    setActiveBagTab(tabKey);
    ["EQUIP", "SIGIL", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`bag-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderBagModalContent();
  }

  export function switchStashTab(tabKey) {
    setActiveStashTab(tabKey);
    ["EQUIP", "SIGIL", "USE", "ETC"].forEach((t) => {
      let btn = document.getElementById(`stash-tab-${t.toLowerCase()}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
    });
    window.renderProfileModal();
  }

  export function switchProfileTab(tabKey) {
    setActiveProfileMobileTab(tabKey);
    const tabs = [
      "stats",
      "gear",
      "satchel",
      "relics",
      "album",
      "achievements",
    ];
    tabs.forEach((t) => {
      let btn = document.getElementById(`profile-tab-${t}`);
      let sec = document.getElementById(`profile-sec-${t}`);
      if (btn) btn.classList.toggle("active", t === tabKey);
      if (sec) sec.classList.toggle("active-mobile-section", t === tabKey);
    });
    let profileCard = document.querySelector(".profile-card");
    if (profileCard) {
      profileCard.classList.toggle(
        "skills-fullscreen-mode",
        tabKey === "achievements" || tabKey === "album" || tabKey === "relics",
      );
    }
    if (tabKey === "achievements") {
      window.renderAchievementsTab();
    } else if (tabKey === "album") {
      if (typeof window.renderBestiaryAlbum === "function") {
        window.renderBestiaryAlbum();
      }
    } else if (tabKey === "relics") {
      if (typeof window.renderReliquaryTab === "function") {
        window.renderReliquaryTab();
      }
    }
    window.renderProfileModal();
  }

  export function navigateToAchievement(id) {
    if (typeof window.hideTooltip === "function") window.hideTooltip();
    let modal = document.getElementById("profile-modal");
    if (modal) {
      modal.style.display = "flex";
    }

    // Auto-switch to correct category filter before loading tab
    let ach = window.AchievementsData.find((a) => a.id === id);
    if (ach) {
      let cat = "all";
      if (ach.isSingleTier) cat = "sing";
      else if (ach.reqType === "kills") cat = "slayer";
      else if (ach.reqType === "floor") cat = "floor";
      else if (ach.reqType === "gold") cat = "hoarder";
      else if (ach.reqType === "extract") cat = "extract";
      else if (ach.reqType === "salvage") cat = "salvage";
      else if (["temper", "reforges", "enchant"].includes(ach.reqType))
        cat = "forge";
      else if (
        ["deflections", "rare_spawns", "single_hit", "gold_upgrades"].includes(
          ach.reqType,
        )
      )
        cat = "misc";

      setAchievementFilter(cat);
    }

    window.switchProfileTab("achievements");

    // Smooth scroll and pulse high-contrast highlight on the targeted card
    setTimeout(() => {
      let card = document.getElementById(`ach-card-${id}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.remove("ach-highlight-pulse");
        void card.offsetWidth; // trigger reflow
        card.classList.add("ach-highlight-pulse");
      }
    }, 250);
  }

  export function toggleProfileModal() {
    window.hideTooltip();
    let modal = document.getElementById("profile-modal");
    if (!modal) return;

    if (modal.style.display === "none" || modal.style.display === "") {
      modal.style.display = "flex";
      window.switchProfileTab(getActiveProfileMobileTab() || "stats");
      window.renderProfileModal();
    } else {
      modal.style.display = "none";
      window.lastModalCloseTime = Date.now();
      let profileCard = document.querySelector(".profile-card");
      if (profileCard) {
        profileCard.classList.remove("skills-fullscreen-mode");
      }
      if (
        window.SkillTreeManager &&
        typeof window.SkillTreeManager.stopAnimationLoop === "function"
      ) {
        window.SkillTreeManager.stopAnimationLoop();
      }
      if (typeof window.stopBestiaryAnimLoop === "function") {
        window.stopBestiaryAnimLoop();
      }
    }
  }

