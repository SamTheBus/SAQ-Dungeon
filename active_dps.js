const ScopedDate = class extends window.Date {
  static now() {
    return window.Date.now();
  }
};
const Date = ScopedDate;
// --- MISSING DPS CALCULATOR ---
const calculateActiveDps = function () {
    const now = window.nowMs || Date.now();
    let startIdx = 0;
    // Scan forward in-place to calculate expired record counts
    while (
      startIdx < window.damageHistory.length &&
      now - window.damageHistory[startIdx].time > 3000
    ) {
      startIdx++;
    }
    if (startIdx > 0) {
      window.damageHistory.splice(0, startIdx);
    }
    if (window.damageHistory.length === 0) {
      let badge = document.getElementById("dps-overlay-badge");
      if (badge && window.playerStats && window.playerStats.showDpsOverlay) {
        badge.innerText = "DPS: 0.0";
      }
      return "0.0";
    }
    let totalDamage = 0;
    for (let i = 0; i < window.damageHistory.length; i++) {
      totalDamage += window.damageHistory[i].amount;
    }
    let avgDps = totalDamage / 3;
    let formatted = window.formatNumber(avgDps);
    let badge = document.getElementById("dps-overlay-badge");
    if (badge && window.playerStats && window.playerStats.showDpsOverlay) {
      badge.innerText = "DPS: " + formatted;
    }
    return formatted;
};

export { calculateActiveDps };
