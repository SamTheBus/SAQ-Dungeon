/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 1.02; // Release Version 1.0.02 (Sigil & Calamity Overhaul)
window.MIN_COMPATIBLE_VERSION = 1.0; // Hard reset epoch threshold

// --- GLOBAL COMBAT BALANCE CONSTANTS ---
window.BOSS_GUARD_PENETRATION = 0.35; // 35% damage seepage / rate reduction
window.DEFLECTION_FATIGUE_FRAMES = 30; // 0.5s at 60 FPS
window.COUNTER_COOLDOWN_FRAMES = 60; // 1.0s Internal Cooldown (ICD) against bosses

window.BigNumMin = function (a, b) {  let ba = BigNum.from(a);
  let bb = BigNum.from(b);
  return ba.gt(bb) ? bb : ba;
};

// Core Security: HTML Sanitizer to prevent XSS injection in user lists
window.escapeHTML = function (str) {
  if (!str) return "";
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        tag
      ] || tag,
  );
};

window.triggerCombatState = function () {
  if (window.playerStats) {
    window.playerStats.combatTimer = 300; // Flag player as active in combat for 5 seconds (300 frames)
  }
};

// Global Custom Confirmation Modal Handler
window.showCustomConfirm = function (
  title,
  message,
  confirmText,
  cancelText,
  color,
  onConfirm,
) {
  if (typeof window.hideTooltip === "function") window.hideTooltip();

  let modal = document.getElementById("confirm-modal");
  let card = document.getElementById("confirm-modal-card");
  let titleEl = document.getElementById("confirm-modal-title");
  let bodyEl = document.getElementById("confirm-modal-body");
  let okBtn = document.getElementById("confirm-modal-ok-btn");
  let cancelBtn = document.getElementById("confirm-modal-cancel-btn");

  if (!modal || !card || !titleEl || !bodyEl || !okBtn || !cancelBtn) {
    // Safe fallback in case DOM is not fully ready
    let plainText = message.replace(/<[^>]*>/g, "");
    if (confirm(`${title}\n\n${plainText}`)) {
      if (typeof onConfirm === "function") onConfirm();
    }
    return;
  }

  // Configure custom content and thematic styles
  titleEl.innerHTML = window.escapeHTML(title);
  titleEl.style.color = color || "#ffd700";
  bodyEl.innerHTML = message; // Raw HTML supported for custom layouts
  card.style.borderColor = color || "#ffd700";

  okBtn.innerHTML = window.escapeHTML(confirmText || "PROCEED");
  cancelBtn.innerHTML = window.escapeHTML(cancelText || "CANCEL");

  if (color) {
    okBtn.style.background = `linear-gradient(180deg, ${color} 0%, #111116 100%)`;
    okBtn.style.borderColor = color;
  } else {
    okBtn.style.background = "";
    okBtn.style.borderColor = "";
  }

  // Re-bind listeners safely via cloning to prevent multi-triggering
  let newOkBtn = okBtn.cloneNode(true);
  let newCancelBtn = cancelBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  newOkBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
    if (typeof onConfirm === "function") onConfirm();
  });

  newCancelBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    modal.style.display = "none";
    window.lastModalCloseTime = Date.now();
  });

  modal.style.display = "flex";
};

window.uiIconSvgCache = window.uiIconSvgCache || {};

window.getUiIconSvg = function (key, size = 12) {
  let cacheKey = `${key}_${size}`;
  if (window.uiIconSvgCache[cacheKey] !== undefined) {
    return window.uiIconSvgCache[cacheKey];
  }
  let icon = window.AssetCatalog.uiIcons[key];
  if (!icon) {
    window.uiIconSvgCache[cacheKey] = "";
    return "";
  }
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${icon.color}" fill-opacity="${icon.opacity}" stroke="${icon.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; transform: translateY(-1.5px); line-height: 1; margin-right: 3px;">${icon.path}</svg>`;
  window.uiIconSvgCache[cacheKey] = svg;
  return svg;
};

// --- SYSTEM UTILS ---

window.initSPDraft = function () {
  if (
    window.draftSPAllocations === undefined ||
    window.draftSPAllocations === null
  ) {
    window.draftSPAllocations = { spStr: 0, spDex: 0, spInt: 0 };
    window.draftSP = window.playerStats.sp || 0;
  }
};

window.stageSP = function (statKey, amount) {
  let p = window.playerStats;
  if (!p) return;
  window.initSPDraft();

  let key = "sp" + statKey;
  if (amount > 0) {
    let addAmt = Math.min(amount, window.draftSP);
    if (addAmt <= 0) return;
    window.draftSPAllocations[key] =
      (window.draftSPAllocations[key] || 0) + addAmt;
    window.draftSP -= addAmt;
  } else if (amount < 0) {
    let subAmt = Math.min(
      Math.abs(amount),
      window.draftSPAllocations[key] || 0,
    );
    if (subAmt <= 0) return;
    window.draftSPAllocations[key] -= subAmt;
    window.draftSP += subAmt;
  }

  if (window.SoundManager && typeof window.SoundManager.play === "function") {
    window.SoundManager.play("hover");
  }

  if (typeof window.invalidatePlayerStats === "function") {
    window.invalidatePlayerStats();
  }

  if (typeof window.renderProfileModal === "function") {
    window.renderProfileModal();
  }
};

window.resetDraftSP = function () {
  if (window.draftSPAllocations) {
    let stagedTotal =
      (window.draftSPAllocations.spStr || 0) +
      (window.draftSPAllocations.spDex || 0) +
      (window.draftSPAllocations.spInt || 0);
    window.draftSP = (window.draftSP || 0) + stagedTotal;
    window.draftSPAllocations = { spStr: 0, spDex: 0, spInt: 0 };
  }

  if (typeof window.invalidatePlayerStats === "function") {
    window.invalidatePlayerStats();
  }

  if (typeof window.renderProfileModal === "function") {
    window.renderProfileModal();
  }
};

window.confirmSP = function () {
  let p = window.playerStats;
  if (!p) return;
  window.initSPDraft();

  let draft = window.draftSPAllocations;
  if (!draft) return;

  let totalStaged =
    (draft.spStr || 0) + (draft.spDex || 0) + (draft.spInt || 0);
  if (totalStaged <= 0) return;

  p.spAllocations = p.spAllocations || { spStr: 0, spDex: 0, spInt: 0 };
  p.spAllocations.spStr = (p.spAllocations.spStr || 0) + (draft.spStr || 0);
  p.spAllocations.spDex = (p.spAllocations.spDex || 0) + (draft.spDex || 0);
  p.spAllocations.spInt = (p.spAllocations.spInt || 0) + (draft.spInt || 0);

  p.sp = Math.max(0, p.sp - totalStaged);

  window.draftSPAllocations = { spStr: 0, spDex: 0, spInt: 0 };
  window.draftSP = p.sp;

  if (window.SoundManager && typeof window.SoundManager.play === "function") {
    window.SoundManager.play("revive");
  }

  if (typeof window.pushHeaderToast === "function") {
    window.pushHeaderToast("[Attributes] Confirmed and committed!", "#2ecc71");
  }

  if (typeof window.invalidatePlayerStats === "function") {
    window.invalidatePlayerStats();
  }

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }

  if (typeof window.renderProfileModal === "function") {
    window.renderProfileModal();
  }

  if (typeof window.saveGame === "function") {
    window.saveGame();
  }
};

window.ParticlePool = window.ParticlePool || {
  pool: [],
  get(
    x,
    y,
    vx,
    vy,
    radius,
    color,
    alpha = 1,
    life = 30,
    maxLife = 30,
    gravity = 0.1,
    fade = true,
  ) {
    let p = this.pool.pop() || {};
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.radius = radius;
    p.color = color;
    p.alpha = alpha;
    p.life = life;
    p.maxLife = maxLife || life;
    p.gravity = gravity !== undefined ? gravity : 0.1;
    p.fade = fade !== undefined ? fade : true;
    return p;
  },
  recycle(p) {
    if (this.pool.length < 500) this.pool.push(p);
  },
};

window.CombatEffectPool = window.CombatEffectPool || {
  pool: [],
  get(
    type,
    x,
    y,
    vx,
    vy,
    amount,
    color,
    life = 40,
    gravity = 0,
    text = null,
    isCumulative = false,
  ) {
    let e = this.pool.pop() || {};
    e.type = type || "slash";
    e.x = x;
    e.y = y;
    e.vx = vx;
    e.vy = vy;
    e.amount = amount;
    e.color = color || "#ffffff";
    e.life = life;
    e.maxLife = life;
    e.gravity = gravity;
    e.text = text || (amount !== undefined ? window.formatNumber(amount) : "");
    e.isCumulative = isCumulative;
    return e;
  },
  recycle(e) {
    if (this.pool.length < 200) this.pool.push(e);
  },
};

window.getEffectiveStage = function (stage) {
  let s = Number(stage);
  if (isNaN(s) || s < 1) s = 1;
  // Smoothed, continuously dampening sub-exponential transition post-100 to avoid sudden cliffs
  return s <= 100 ? s : 100 + Math.pow(s - 100, 0.7) * 1.5;
};

window.isValidCheckpoint = function (floor) {
  if (floor === 1) return true;
  let prev = floor - 1;
  return prev % 12 === 4 || prev % 12 === 8 || prev % 12 === 0;
};

window.getMilestoneMultiplier = function (level) {
  let milestones = Math.floor(level / 10);
  // Asymptotic square-root scaling dampens late-game stat inflation while preserving milestone achievements
  return 1.0 + Math.sqrt(milestones) * 0.25;
};

window.getBountyRerollCost = function (peakStage, rerollsToday) {
  let s = Math.max(1, Math.floor(peakStage || 1));
  let r = Math.max(0, Math.floor(rerollsToday || 0));

  // Gold Cost: 15000 * (1.09^S) * (3^R)
  let goldBase = BigNum.from(15000);
  let stageFactor = BigNum.from(1.09).pow(s);
  let rerollFactor = BigNum.from(3.0).pow(r);
  let goldCost = goldBase.mul(stageFactor).mul(rerollFactor);

  // Soul Cost: (25 + Math.floor(10 * (s / 10)^1.2)) * (2.5^r)
  let soulBase = 25 + Math.floor(10 * Math.pow(s / 10, 1.2));
  let soulCost = Math.round(soulBase * Math.pow(2.5, r));

  return {
    gold: goldCost,
    souls: soulCost,
  };
};

window.isWeeklyQuestUnlocked = function () {
  if (!window.playerStats) return false;
  return (
    (window.playerStats.maxFloorCleared || 0) >= 12 ||
    (window.playerStats.prestigeCount || 0) > 0
  );
};

window.calculateRenownForStageRange = function (fromStage, toStage) {
  if (toStage <= fromStage) return 0;
  let start = Math.max(0, fromStage);
  let end = toStage;
  let delta = end - start;
  if (delta > 2000) {
    const F = (s) => 5 * s + 1.25 * Math.pow(s, 1.6);
    return Math.max(1, Math.floor(F(end) - F(start)));
  } else {
    let total = 0;
    for (let s = start + 1; s <= end; s++) {
      total += Math.max(1, Math.floor(5 + 2 * Math.pow(s, 0.6)));
    }
    return total;
  }
};

function getCardTier(count) {
  let thresholds = window.CARD_UPGRADE_THRESHOLDS || [1, 25, 50, 150, 300, 750];
  let t = -1;
  for (let idx = 0; idx < thresholds.length; idx++) {
    if (count >= thresholds[idx]) t = idx;
    else break;
  }
  return t;
}
window.getCardTier = getCardTier;

function getCardValue(base, tier) {
  if (tier < 0) return 0;
  return base * (1 + 0.6 * tier);
}
window.getCardValue = getCardValue;

function getUtilityCardValue(tier) {
  if (tier < 0) return 0;
  const rates = [0.02, 0.04, 0.06, 0.08, 0.11, 0.15];
  return rates[tier] || 0;
}
window.getUtilityCardValue = getUtilityCardValue;

// High-performance arbitrary-precision scientific notation library for infinite scalability
class BigNum {
  constructor(m = 0, e = 0) {
    this.m = m;
    this.e = e;
    this.normalize();
  }

  valueOf() {
    return this.m * Math.pow(10, this.e);
  }

  normalize() {
    if (this.m === 0) {
      this.e = 0;
      return this;
    }
    let absM = Math.abs(this.m);
    if (absM >= 10) {
      let shift = Math.floor(Math.log10(absM));
      this.m /= Math.pow(10, shift);
      this.e += shift;
    } else if (absM < 1) {
      let shift = Math.floor(Math.log10(absM));
      this.m /= Math.pow(10, shift);
      this.e += shift;
    }
    // Prevent floating-point precision drift
    this.m = Math.round(this.m * 1e12) / 1e12;
    if (this.m === 0) this.e = 0;
    return this;
  }

  static from(val) {
    if (val instanceof BigNum) return val;
    if (
      val &&
      typeof val === "object" &&
      val.m !== undefined &&
      val.e !== undefined
    ) {
      return new BigNum(val.m, val.e);
    }
    if (typeof val === "number") return BigNum.fromNumber(val);
    if (typeof val === "string") {
      let parts = val.toLowerCase().split("e");
      if (parts.length === 2) {
        return new BigNum(parseFloat(parts[0]), parseInt(parts[1], 10));
      }
      return BigNum.fromNumber(parseFloat(val));
    }
    return new BigNum(0, 0);
  }

  static fromNumber(num) {
    if (num === 0 || isNaN(num) || !isFinite(num)) return new BigNum(0, 0);
    let e = Math.floor(Math.log10(Math.abs(num)));
    let m = num / Math.pow(10, e);
    return new BigNum(m, e);
  }

  add(other) {
    let b = BigNum.from(other);
    if (this.m === 0) return b;
    if (b.m === 0) return this;

    let diff = this.e - b.e;
    if (diff >= 15) return this; // Other is too small to affect this
    if (diff <= -15) return b; // This is too small to affect other

    let newM = this.m + b.m * Math.pow(10, -diff);
    return new BigNum(newM, this.e);
  }

  sub(other) {
    let b = BigNum.from(other);
    if (this.m === 0) return new BigNum(-b.m, b.e);
    if (b.m === 0) return this;

    let diff = this.e - b.e;
    if (diff >= 15) return this;
    if (diff <= -15) return new BigNum(-b.m, b.e);

    let newM = this.m - b.m * Math.pow(10, -diff);
    return new BigNum(newM, this.e);
  }

  mul(other) {
    let b = BigNum.from(other);
    return new BigNum(this.m * b.m, this.e + b.e);
  }

  div(other) {
    let b = BigNum.from(other);
    if (b.m === 0) throw new Error("Division by zero in BigNum");
    return new BigNum(this.m / b.m, this.e - b.e);
  }

  // Fast binary exponentiation for infinite scale exponents
  pow(power) {
    let p = Math.floor(power);
    if (p < 0)
      throw new Error("Negative powers not supported in lightweight BigNum");
    let result = new BigNum(1, 0);
    let base = this;
    while (p > 0) {
      if (p % 2 === 1) result = result.mul(base);
      base = base.mul(base);
      p = Math.floor(p / 2);
    }
    return result;
  }

  compareTo(other) {
    let b = BigNum.from(other);
    // Both are zero
    if (this.m === 0 && b.m === 0) return 0;
    // Signs are different
    if (this.m > 0 && b.m <= 0) return 1;
    if (this.m < 0 && b.m >= 0) return -1;
    if (this.m === 0) {
      return b.m > 0 ? -1 : 1;
    }
    if (b.m === 0) {
      return this.m > 0 ? 1 : -1;
    }

    // Both are positive
    if (this.m > 0 && b.m > 0) {
      if (this.e !== b.e) return this.e > b.e ? 1 : -1;
      if (this.m !== b.m) return this.m > b.m ? 1 : -1;
      return 0;
    }

    // Both are negative (larger exponent means more negative, hence smaller)
    if (this.m < 0 && b.m < 0) {
      if (this.e !== b.e) return this.e > b.e ? -1 : 1;
      if (this.m !== b.m) return this.m > b.m ? 1 : -1;
      return 0;
    }
    return 0;
  }

  gt(other) {
    return this.compareTo(other) > 0;
  }
  gte(other) {
    return this.compareTo(other) >= 0;
  }
  lt(other) {
    return this.compareTo(other) < 0;
  }
  lte(other) {
    return this.compareTo(other) <= 0;
  }
  eq(other) {
    return this.compareTo(other) === 0;
  }
}

window.BigNum = BigNum;

window.formatNumber = function (val) {
  if (val === null || val === undefined) return "0";
  let b = BigNum.from(val);
  if (b.m === 0) return "0";

  // Format small values directly
  if (b.e < 3) {
    let num = b.m * Math.pow(10, b.e);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  }

  const standardSuffixes = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
  ];

  let i = Math.floor(b.e / 3);
  let rem = b.e % 3;
  let displayVal = b.m * Math.pow(10, rem);

  if (i < standardSuffixes.length) {
    return `${displayVal.toFixed(2)}${standardSuffixes[i]}`;
  }

  // Alphabetical suffix generator (aa - zz, then aaa - zzz)
  let baseAlpha = i - standardSuffixes.length;
  let suffix = "";
  if (baseAlpha < 676) {
    let char1 = String.fromCharCode(97 + Math.floor(baseAlpha / 26));
    let char2 = String.fromCharCode(97 + (baseAlpha % 26));
    suffix = char1 + char2;
  } else {
    let temp = baseAlpha - 676;
    let char1 = String.fromCharCode(97 + Math.floor(temp / 676));
    let char2 = String.fromCharCode(97 + Math.floor((temp % 676) / 26));
    let char3 = String.fromCharCode(97 + (temp % 26));
    suffix = char1 + char2 + char3;
  }
  suffix = suffix.toUpperCase();

  return `${displayVal.toFixed(2)}${suffix}`;
};

window.randInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
window.randFloat = (min, max) => Math.random() * (max - min) + min;

window.rarityProbCache = window.rarityProbCache || {};

// Universal Normalized Weight-Based Rarity Probability Solver
window.calculateRarityProbabilities = function (
  qly = 1.0,
  isGacha = false,
  floorNumber = 1,
) {
  let fl = isGacha
    ? Math.max(1, Number(floorNumber) || 1)
    : window.playerStats.maxFloorCleared || 0;
  let cacheKey = `${qly}_${isGacha}_${fl}`;
  if (window.rarityProbCache[cacheKey]) {
    return window.rarityProbCache[cacheKey];
  }

  let weights = [0, 0, 0, 0, 0, 0]; // 0★ to 5★

  let maxAllowedTier = 0;
  if (isGacha) {
    if (fl >= 300) maxAllowedTier = 5;
    else if (fl >= 175) maxAllowedTier = 4;
    else if (fl >= 100) maxAllowedTier = 3;
    else if (fl >= 30) maxAllowedTier = 2;
    else if (fl >= 10) maxAllowedTier = 1;
  } else {
    if (fl >= 120) maxAllowedTier = 5;
    else if (fl >= 72) maxAllowedTier = 4;
    else if (fl >= 48) maxAllowedTier = 3;
    else if (fl >= 24) maxAllowedTier = 2;
    else if (fl >= 12) maxAllowedTier = 1;
  }

  if (isGacha) {
    weights[0] = maxAllowedTier === 0 ? 100 : 0;
    weights[1] = maxAllowedTier >= 1 ? 60 / Math.pow(qly, 0.4) : 0;
    weights[2] = maxAllowedTier >= 2 ? 25 * Math.pow(qly, 0.4) : 0;
    weights[3] = maxAllowedTier >= 3 ? 12 * Math.pow(qly, 0.8) : 0;
    weights[4] = maxAllowedTier >= 4 ? 3 * Math.pow(qly, 1.2) : 0;
    weights[5] =
      maxAllowedTier >= 5
        ? Math.min(
            2.5,
            0.2 * Math.pow((fl - 300) / 100 + 1, 1.2) * Math.pow(qly, 1.5),
          )
        : 0;
  } else {
    weights[0] = 80.0 / Math.pow(qly, 0.5);
    weights[1] = maxAllowedTier >= 1 ? 15.0 * Math.pow(qly, 0.2) : 0;
    weights[2] = maxAllowedTier >= 2 ? 4.0 * Math.pow(qly, 0.4) : 0;
    weights[3] = maxAllowedTier >= 3 ? 0.9 * Math.pow(qly, 0.6) : 0;
    weights[4] = maxAllowedTier >= 4 ? 0.1 * Math.pow(qly, 1.0) : 0;
    weights[5] =
      maxAllowedTier >= 5
        ? Math.min(
            1.0,
            0.01 * Math.pow((fl - 300) / 100 + 1, 1.3) * Math.pow(qly, 1.4),
          )
        : 0;
  }

  let totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return [100, 0, 0, 0, 0, 0];

  let result = weights.map((w) => (w / totalWeight) * 100);
  window.rarityProbCache[cacheKey] = result;
  return result;
};

window.rollItemRarity = function (stageLevel = 1, qly = 1.0, isGacha = false) {
  let probs = window.calculateRarityProbabilities(qly, isGacha, stageLevel);
  let roll = Math.random() * 100;
  let cumulative = 0;

  for (let stars = 5; stars >= 0; stars--) {
    cumulative += probs[stars];
    if (roll <= cumulative) {
      return stars;
    }
  }
  return 0;
};

window.rollSigilRarity = function (maxStars, qly = 1.0) {
  let weights = [];
  let totalWeight = 0;
  for (let i = 0; i <= maxStars; i++) {
    let w = (i + 1) * Math.pow(qly, i * 0.4);
    weights.push(w);
    totalWeight += w;
  }
  let roll = Math.random() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i <= maxStars; i++) {
    cumulative += weights[i];
    if (roll <= cumulative) return i;
  }
  return 0;
};

window.getDepthQualityMultiplier = function (stage) {
  let s = Number(stage);
  if (isNaN(s) || s < 1) s = 1;
  // Asymptotic scaling: smoothly scales from 1.0 up to a hard cap of 2.0
  // Half-height of the maximum bonus is reached at stage 150
  return 1.0 + (s - 1) / (s + 150);
};

// Initialize transaction-safe GameState manager
window.GameState = window.GameState || {};
Object.assign(window.GameState, {
  gainXp(amount) {
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return;

    let p = window.resolvePlayerStats();
    let finalAmount = amt.mul(p.xpRate || 1.0);
    window.playerStats.xp = BigNum.from(window.playerStats.xp || 0).add(
      finalAmount,
    );
    let leveledUp = false;

    let xp = BigNum.from(window.playerStats.xp);
    let xpReq = BigNum.from(window.playerStats.xpReq || 100);

    // Process potential consecutive level-ups via a loop
    while (xp.gte(xpReq)) {
      xp = xp.sub(xpReq);
      window.playerStats.level++;

      // Initialize maxLevel safety fallback
      window.playerStats.maxLevel = Math.max(
        window.playerStats.maxLevel || 1,
        window.playerStats.level - 1,
      );

      if (window.playerStats.level > window.playerStats.maxLevel) {
        window.playerStats.maxLevel = window.playerStats.level;
        window.playerStats.sp += 3; // Award 3 Attribute SP per peak level
        window.playerStats.usp = (window.playerStats.usp || 0) + 1; // Award 1 Utility SP per peak level

        if (window.draftSP !== undefined && window.draftSP !== null) {
          window.draftSP += 3;
        }
      }

      // Calculate next xpReq safely using BigNum exponential power scaling
      xpReq = BigNum.from(600).mul(
        BigNum.from(1.55).pow(window.playerStats.level - 1),
      );
      leveledUp = true;
    }

    if (leveledUp) {
      window.playerStats.xp = xp;
      window.playerStats.xpReq = xpReq;
    }

    window.triggerLevelUpEffect = function () {
      let p = window.player;
      if (!p) return;

      p.levelUpTimer = 90; // Lasts 90 frames (~1.5s) and tracks player position

      if (window.combatVisuals) {
        window.combatVisuals.spawnBeam(p.x, "#ffd700", 90, true, 0);
        window.combatVisuals.spawnBeam(
          p.x,
          "rgba(0, 210, 255, 0.7)",
          75,
          true,
          -14,
        );
        window.combatVisuals.spawnBeam(
          p.x,
          "rgba(0, 210, 255, 0.7)",
          75,
          true,
          14,
        );
        window.combatVisuals.spawnBeam(
          p.x,
          "rgba(232, 121, 249, 0.6)",
          60,
          true,
          -24,
        );
        window.combatVisuals.spawnBeam(
          p.x,
          "rgba(232, 121, 249, 0.6)",
          60,
          true,
          24,
        );
        window.combatVisuals.triggerScreenShake(4, 14);
      }
    };

    if (leveledUp) {
      window.triggerLevelUpEffect();

      // Check if they reached Level 13 for the first time to trigger Clan Hall Unlock
      if (
        window.playerStats.level >= 13 &&
        !window.playerStats.hasTriggeredLevel13Unlock
      ) {
        window.playerStats.hasTriggeredLevel13Unlock = true;
        setTimeout(() => {
          if (typeof window.playGlobalUnlockAnimation === "function") {
            window.playGlobalUnlockAnimation("CLAN HALL UNLOCKED", "✦", () => {
              if (typeof window.toggleMenuHub === "function") {
                window.toggleMenuHub(); // Pop open the Hub so the padlock shatters right over the locked button!
              }
            });
          }
        }, 1500);
      }

      // Check if they reached Level 25 for the first time to trigger Rift Altar Unlock
      if (
        window.playerStats.level >= 25 &&
        !window.playerStats.hasTriggeredLevel25Unlock
      ) {
        window.playerStats.hasTriggeredLevel25Unlock = true;
        setTimeout(() => {
          if (typeof window.playGlobalUnlockAnimation === "function") {
            window.playGlobalUnlockAnimation("RIFT ALTAR UNLOCKED", "✦", () => {
              if (typeof window.switchTab === "function") {
                window.switchTab("activities");
              }
            });
          }
        }, 1500); // Trigger shortly after the level-up flash settles
      }

      window.invalidatePlayerStats();
      let p = window.resolvePlayerStats();

      if (window.player) {
        let newMaxHp =
          p.maxHp && p.maxHp.valueOf
            ? p.maxHp.valueOf()
            : Number(p.maxHp || 100);
        window.player.maxHp = Math.round(newMaxHp);

        // Restore 25% Max HP burst on level up instead of full 100% refill
        let healBurst = Math.round(newMaxHp * 0.25);
        window.player.hp = Math.min(newMaxHp, window.player.hp + healBurst);
        window.playerStats.currentHp = BigNum.from(window.player.hp);

        window.player.atk =
          p.atk && p.atk.valueOf ? p.atk.valueOf() : Number(p.atk || 15);
        window.player.def =
          p.def && p.def.valueOf ? p.def.valueOf() : Number(p.def || 5);
      }

      if (window.SoundManager) window.SoundManager.play("revive");
      if (typeof window.pushLog === "function") {
        window.pushLog(
          `<strong style="color:#d946ef;">LEVEL UP! Reached Level ${window.playerStats.level}! (+3 Attribute SP, +1 Utility SP)</strong>`,
        );
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `Level Up! Reached Level ${window.playerStats.level}! (+3 Attribute SP, +1 Utility SP)`,
          "#d946ef",
        );
      }
      if (typeof window.spawnFloatingText === "function" && window.player) {
        let px = window.player.x;
        let py = window.player.y;
        window.spawnFloatingText(
          px,
          py - 20,
          `LEVEL UP! (LV.${window.playerStats.level})`,
          "#d946ef",
          true,
        );
        window.spawnFloatingText(
          px,
          py - 32,
          "+15 HP  +3 ATK  +1.5 DEF",
          "#2ecc71",
          true,
        );
        window.spawnFloatingText(
          px,
          py - 44,
          "+3 ASP / +1 USP AVAILABLE",
          "#00d2ff",
          true,
        );
      }
      if (typeof window.checkAchievements === "function") {
        window.checkAchievements();
      }
      // Evaluate tutorial triggers immediately after level-up animations/sounds settle
      setTimeout(() => {
        if (window.HoorTutorial) {
          window.HoorTutorial.checkTriggers();
        }
      }, 1000);
    }

    if (typeof window.updateUI === "function") {
      window.updateUI();
    }
  },

  addCoins(amount) {
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return;
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(amt);
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);
    if (typeof window.updateUI === "function") window.updateUI();
  },

  spendCoins(amount) {
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return false;
    let coins = BigNum.from(window.playerStats.coins);
    if (coins.lt(amt)) return false;
    window.playerStats.coins = coins.sub(amt);
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }
    if (typeof window.updateUI === "function") window.updateUI();
    return true;
  },

  spendRunOrVaultGold(amount) {
    let amt = BigNum.from(amount);
    if (amt.lte(0)) return false;
    let inDungeonRun = window.currentGameState !== window.GAME_STATES.HUB;

    if (inDungeonRun) {
      let pocket = BigNum.from(window.playerStats.runGold || 0);
      if (pocket.lt(amt)) return false;
      window.playerStats.runGold = pocket.sub(amt);
      if (window.playerStats.runGold.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }
    } else {
      let coins = BigNum.from(window.playerStats.coins || 0);
      if (coins.lt(amt)) return false;
      window.playerStats.coins = coins.sub(amt);
      if (window.playerStats.coins.eq(0)) {
        window.playerStats.hasTriggeredExactChange = true;
      }
    }

    if (typeof window.updateUI === "function") window.updateUI();
    return true;
  },
});

// Legacy Compatibility Aliases to protect references
window.gainXp = (amount, isOffline) =>
  window.GameState.gainXp(amount, isOffline);
window.addCoins = (amount) => window.GameState.addCoins(amount);
window.spendCoins = (amount) => window.GameState.spendCoins(amount);

window.absorbGoldParticle = function (amount, isDungeon, isCrucible) {
  let amt = BigNum.from(amount);
  if (amt.lte(0)) return;

  if (isCrucible) {
    window.playerStats.crucibleAccumulatedGold =
      (window.playerStats.crucibleAccumulatedGold || 0) + amount;
  } else {
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);

    if (isDungeon) {
      window.playerStats.runGold = BigNum.from(
        window.playerStats.runGold || 0,
      ).add(amt);
      window.playerStats.dungeonAccumulatedGold =
        (window.playerStats.dungeonAccumulatedGold || 0) + amount;
    } else {
      window.playerStats.coins = BigNum.from(window.playerStats.coins || 0).add(
        amt,
      );
    }

    if (typeof window.progressMission === "function") {
      window.progressMission("gold", amount);
    }
  }

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }
};

window.getAchievementProgress = function (ach) {
  if (!window.playerStats) return 0;
  if (ach.reqType === "kills")
    return window.playerStats.totalLifetimeKills || 0;
  if (ach.reqType === "floor") return window.playerStats.maxFloorCleared || 0;
  if (ach.reqType === "gold") return window.playerStats.totalGoldEarned || 0;
  if (ach.reqType === "extract")
    return window.playerStats.successfulExtractions || 0;
  if (ach.reqType === "salvage") return window.playerStats.itemsSalvaged || 0;
  if (ach.reqType === "temper") return window.playerStats.totalTempers || 0;
  if (ach.reqType === "reforges") return window.playerStats.totalReforges || 0;
  if (ach.reqType === "enchant") return window.playerStats.totalEnchants || 0;
  if (ach.reqType === "deflections")
    return window.playerStats.totalDeflections || 0;
  if (ach.reqType === "rare_spawns")
    return window.playerStats.rareSpawnsSlain || 0;
  if (ach.reqType === "single_hit")
    return window.playerStats.peakSingleHit || 0;
  if (ach.reqType === "gold_upgrades") {
    return (
      (window.playerStats.vendingQLevel || 0) +
      (window.playerStats.shopQLevel || 0) +
      (window.playerStats.globalQLevel || 0) +
      ((window.playerStats.maxFlaskCharges || 1) - 1) +
      (window.playerStats.flaskPotencyLevel || 0)
    );
  }

  if (ach.isSingleTier) {
    if (ach.id === "sing_murphys_law") {
      let slots = Object.values(window.playerStats.slotUpgrades || {});
      return slots.some((lvl) => lvl >= 50) ? 1 : 0;
    }
    if (ach.id === "sing_recovery") {
      return window.playerStats.hasTriggeredRecovery ? 1 : 0;
    }
    if (ach.id === "sing_soul_bound") {
      return window.playerStats.hasTriggeredSoulBound ? 1 : 0;
    }
    if (ach.id === "sing_unified_set") {
      if (!window.equippedSlots) return 0;
      let setCounts = {};
      const slots = [
        "weapon",
        "subweapon",
        "helmet",
        "chest",
        "leggings",
        "overall",
        "boots",
      ];
      slots.forEach((s) => {
        let item = window.equippedSlots[s];
        if (item && window.getItemSetName) {
          let setName = window.getItemSetName(item);
          if (setName) {
            setCounts[setName] =
              (setCounts[setName] || 0) + (s === "overall" ? 2 : 1);
          }
        }
      });
      return Object.values(setCounts).some((count) => count >= 3) ? 1 : 0;
    }
    if (ach.id === "sing_golden_touch") {
      if (!window.equippedSlots) return 0;
      let arts = [
        window.equippedSlots.art1,
        window.equippedSlots.art2,
        window.equippedSlots.art3,
      ];
      let count = arts.filter((a) => a && (a.goldMulti || 0) > 0).length;
      return count >= 3 ? 1 : 0;
    }
    if (ach.id === "sing_full_bag") {
      return window.playerStats.hasTriggeredFullBag ? 1 : 0;
    }
    if (ach.id === "sing_overkill") {
      return window.playerStats.hasTriggeredOverkill ? 1 : 0;
    }
    if (ach.id === "sing_exact_change") {
      return window.playerStats.hasTriggeredExactChange ? 1 : 0;
    }
    if (ach.id === "sing_night_owl") {
      let hr = new Date().getHours();
      return hr >= 0 && hr < 4 && window.playerStats.hasTriggeredNightOwl
        ? 1
        : 0;
    }
    if (ach.id === "sing_early_bird") {
      let hr = new Date().getHours();
      return hr >= 5 && hr < 8 && window.playerStats.hasTriggeredEarlyBird
        ? 1
        : 0;
    }
    if (ach.id === "sing_weekend_warrior") {
      let day = new Date().getDay();
      return (day === 0 || day === 6) &&
        window.playerStats.hasTriggeredWeekendWarrior
        ? 1
        : 0;
    }
  }
  return 0;
};

window.recalculateAchievementTotals = function () {
  let totals = {
    atk: 0,
    maxHp: 0,
    def: 0,
    moveSpeed: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    drop: 0,
    qly: 0,
    gold: 0,
    str: 0,
    dex: 0,
    int: 0,
    fairySpawn: 0,
    rareSpawn: 0,
    expPct: 0,
    potDurationPct: 0,
    potStrengthPct: 0,
    atkPct: 0,
    maxHpPct: 0,
    defPct: 0,
    moveSpeedPct: 0,
    strPct: 0,
    dexPct: 0,
    intPct: 0,
    idleSpeedPct: 0,
    activeSpeedPct: 0,
  };
  if (window.playerStats.unlockedAchievements) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats) {
        for (let k in ach.stats) {
          if (totals[k] !== undefined) totals[k] += ach.stats[k];
        }
      }
    });
  }
  window.playerStats.cachedAchievementBonusTotals = totals;
};

window.checkAchievements = function () {
  if (!window.playerStats.unlockedAchievements)
    window.playerStats.unlockedAchievements = [];
  if (!window.playerStats.achievementTimestamps)
    window.playerStats.achievementTimestamps = {};

  let activeBuffs = 0;
  if (
    (window.playerStats.atkPotionRuns || 0) > 0 ||
    (window.playerStats.atkPotionTimer || 0) > 0
  )
    activeBuffs++;
  if (
    (window.playerStats.hpPotionRuns || 0) > 0 ||
    (window.playerStats.hpPotionTimer || 0) > 0
  )
    activeBuffs++;
  if (
    (window.playerStats.defPotionRuns || 0) > 0 ||
    (window.playerStats.defPotionTimer || 0) > 0
  )
    activeBuffs++;
  if (
    (window.playerStats.hastePotionRuns || 0) > 0 ||
    (window.playerStats.hastePotionTimer || 0) > 0
  )
    activeBuffs++;
  if (window.playerStats.frenzyTimer > 0) activeBuffs++;
  if (window.playerStats.adrenalineTimer > 0) activeBuffs++;
  window.playerStats.peakSimultaneousBuffs = Math.max(
    window.playerStats.peakSimultaneousBuffs || 0,
    activeBuffs,
  );

  let unlockedAny = false;
  window.AchievementsData.forEach((ach) => {
    if (window.playerStats.unlockedAchievements.includes(ach.id)) return;
    let progress = window.getAchievementProgress(ach);
    let targetValue = ach.isSingleTier ? 1 : ach.reqValue;
    let isUnlocked = false;
    if (progress instanceof BigNum) {
      isUnlocked = progress.gte(targetValue);
    } else {
      isUnlocked = progress >= targetValue;
    }
    if (isUnlocked) {
      window.playerStats.unlockedAchievements.push(ach.id);
      window.playerStats.achievementTimestamps =
        window.playerStats.achievementTimestamps || {};
      window.playerStats.achievementTimestamps[ach.id] = Date.now();
      if (!window.playerStats.unviewedAchievements)
        window.playerStats.unviewedAchievements = [];
      if (!window.playerStats.unviewedAchievements.includes(ach.id)) {
        window.playerStats.unviewedAchievements.push(ach.id);
      }
      unlockedAny = true;

      let currentAchId = ach.id;
      if (typeof window.pushLog === "function")
        window.pushLog(
          `<strong style="color:#f1c40f;">CHALLENGE ACHIEVED: [${ach.name}]!</strong> - ${ach.desc}`,
        );
      if (typeof window.pushHeaderToast === "function")
        window.pushHeaderToast(
          `Milestone Unlocked: ${ach.name}! (Click to View)`,
          "#f1c40f",
          function () {
            if (typeof window.navigateToAchievement === "function")
              window.navigateToAchievement(currentAchId);
          },
        );
    }
  });
  if (unlockedAny) {
    window.recalculateAchievementTotals();
    if (
      typeof window.resolvePlayerStats === "function" &&
      typeof window.updateUI === "function"
    ) {
      let p = window.resolvePlayerStats();
      window.playerStats.currentHp = window.playerStats.currentHp.gt(p.maxHp)
        ? p.maxHp
        : window.playerStats.currentHp;
      window.updateUI();
      if (typeof window.renderInventory === "function")
        window.renderInventory();
      if (typeof window.saveGame === "function") window.saveGame();
    }
  }
};

window.isCavernEffectActive = function (id) {
  if (
    window.currentGameState === window.GAME_STATES.DUNGEON &&
    window.playerStats.activeDungeonSigil
  ) {
    let sig = window.playerStats.activeDungeonSigil;
    if (sig.buffs && sig.buffs.some((b) => b.id === id)) return true;
    if (sig.debuffs && sig.debuffs.some((d) => d.id === id)) return true;
  }
  if (window.playerStats.isCrucibleMode) {
    if (
      window.playerStats.crucibleActiveBuff &&
      window.playerStats.crucibleActiveBuff.id === id
    )
      return true;
    if (
      window.playerStats.crucibleActiveDebuff &&
      window.playerStats.crucibleActiveDebuff.id === id
    )
      return true;
  }
  return false;
};

window.checkArtifactTrait = function (trait) {
  if (
    window.playerStats &&
    window.playerStats.activeRelics &&
    window.playerStats.activeRelics.includes(trait)
  ) {
    return true;
  }
  if (!window.equippedSlots) return false;
  return (
    (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait) ||
    (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait) ||
    (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
  );
};

window.getArtifactTemperLevel = function (trait) {
  if (window.playerStats && window.playerStats.activeRelics) {
    let idx = window.playerStats.activeRelics.indexOf(trait);
    if (idx !== -1) {
      let slotKey = ["art1", "art2", "art3"][idx];
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[slotKey]) ||
        0;
      return Math.floor(slotLvl / 10); // Converts slot levels 0-100 to temper levels 0-10 dynamically
    }
  }
  if (!window.equippedSlots) return 0;
  if (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait)
    return window.equippedSlots.art1.temperLevel || 0;
  if (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait)
    return window.equippedSlots.art2.temperLevel || 0;
  if (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
    return window.equippedSlots.art3.temperLevel || 0;
  return 0;
};

window.hasUniquePassive = function (uniqueKey) {
  if (
    window.playerStats &&
    window.playerStats.activeSpectralResonance === uniqueKey
  )
    return true;
  if (!window.equippedSlots) return false;

  switch (uniqueKey) {
    case "weapon_staff":
      return !!(
        window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueStaff
      );
    case "weapon_sword":
      return !!(
        window.equippedSlots.weapon && window.equippedSlots.weapon.isUniqueSword
      );
    case "weapon_singularity":
      return !!(
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueSingularity
      );
    case "weapon_maelstrom":
      return !!(
        window.equippedSlots.weapon &&
        window.equippedSlots.weapon.isUniqueMaelstrom
      );
    case "shield_aegis":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueAegis
      );
    case "tome_watch":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueWatch
      );
    case "tome_chronicle":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueChronicle
      );
    case "boots_warpcore":
      return !!(
        window.equippedSlots.boots &&
        window.equippedSlots.boots.isUniqueWarpCore
      );
    case "helmet_tempest":
      return !!(
        window.equippedSlots.helmet &&
        window.equippedSlots.helmet.isUniqueTempest
      );
    case "dagger_viper":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueViper
      );
    case "tome_conduit":
      return !!(
        window.equippedSlots.subweapon &&
        window.equippedSlots.subweapon.isUniqueConduit
      );
    default:
      return false;
  }
};

window.getItemSetName = function (item) {
  if (!item || item.type === "artifact" || item.statsRolled === "UNIQUE")
    return null;
  return item.setName || null;
};

window.getMaxBagSlots = function () {
  let base = window.checkArtifactTrait("bag_space") ? 50 : 20;
  let missionBag =
    ((window.playerStats.missionUpgrades &&
      window.playerStats.missionUpgrades.bag) ||
      0) * 10;
  return base + missionBag;
};

window.getTierName = function (stars) {
  if (stars === "UNIQUE") return "Unique Artifact";
  const tiers = ["Common", "Rare", "Magic", "Epic", "Legendary", "Mythic"];
  return tiers[stars] || "Unknown";
};

window.getTierColor = function (stars) {
  if (stars === "UNIQUE") return "#1abc9c";
  const colors = [
    "#ffffff",
    "#3498db",
    "#9b59b6",
    "#e67e22",
    "#f1c40f",
    "#e74c3c",
  ];
  return colors[stars] || "#fff";
};

window.getScrapYieldName = function (stars) {
  if (stars === "UNIQUE") return "Astral Essence";
  const scraps = [
    "Monster Soul",
    "Rare Scrap",
    "Magic Scrap",
    "Epic Scrap",
    "Legendary Scrap",
    "Mythic Scrap",
  ];
  return scraps[stars] || "Monster Soul";
};

// --- CORE STATS RESOLVER WITH CACHING ---
window.cachedPlayerStats = null;
window.playerStatsDirty = true;

window.invalidatePlayerStats = function () {
  window.playerStatsDirty = true;
};

window.updateUI = function () {
  window.invalidatePlayerStats();
  let resolved = window.resolvePlayerStats();

  if (window.player && resolved) {
    let oldMaxHp = window.player.maxHp || 100;
    let newMaxHp = Math.round(
      resolved.maxHp && resolved.maxHp.valueOf
        ? resolved.maxHp.valueOf()
        : Number(resolved.maxHp || 100),
    );
    window.player.maxHp = newMaxHp;

    if (window.currentGameState === window.GAME_STATES.HUB) {
      window.player.hp = newMaxHp;
    } else if (newMaxHp > oldMaxHp) {
      window.player.hp = Math.min(
        newMaxHp,
        window.player.hp + (newMaxHp - oldMaxHp),
      );
    } else {
      window.player.hp = Math.min(window.player.hp, newMaxHp);
    }

    if (resolved.atk)
      window.player.atk = resolved.atk.valueOf
        ? resolved.atk.valueOf()
        : Number(resolved.atk || 15);
    if (resolved.def)
      window.player.def = resolved.def.valueOf
        ? resolved.def.valueOf()
        : Number(resolved.def || 5);
    if (resolved.moveSpeed) {
      window.player.speed = resolved.moveSpeed * 0.38; // Bind actual character movement speed to resolved stats
    }
  }

  if (typeof window.updateHUD === "function") {
    window.updateHUD();
  }

  let profileModal = document.getElementById("profile-modal");
  if (
    profileModal &&
    profileModal.style.display !== "none" &&
    typeof window.renderProfileModal === "function"
  ) {
    window.renderProfileModal();
  }
};

window.ARTIFACT_BASE_STATS = {
  frenzy: { critChance: 0.03 },
  vampirism: { maxHp: 20 },
  gold_hoard: { atk: 10, goldMulti: 0.3 },
  magic_find: { dex: 5, dropRate: 0.25, quality: 0.15 },
  move_speed: { moveSpeedPct: 0.1, parry: 0.03 },
  defense: { maxHpPct: 0.06, defPct: 0.08 },
  parry_strike: { parry: 0.02 },
  echo_strike: { atk: 3 },
  idle_spd: { idleAttackSpeed: 0.15, goldMulti: 0.05 },
  active_spd: { activeAttackSpeed: 0.1, critChance: 0.03 },
  dodge_buff: { block: 0.02, parry: 0.02 },
  extend_buffs: { int: 3 },
  bag_space: { dropRate: 0.1 },
  second_wind: { str: 5, maxHp: 30 },
  golem_stance: { str: 5 },
  fairy_wealth: { goldMulti: 0.06, fairySpawn: 0.15 },
  void_pull: { dex: 3, rareSpawn: 0.2 },
  titan_grip: { block: 0.04, parry: 0.04 },
  alchemist_alembic: { int: 3 },
  philosopher_catalyst: { int: 4 },
  cauldron_eternity: { maxHpPct: 0.05 },

  // --- PHASE 3 BASE RELIC MODIFIERS ---
  breach_adrenaline: { critChance: 0.02 },
  breach_barrier: { def: 5 },
  breach_scouting: { goldMulti: 0.05 },
  friction_kinetic: { dex: 3 },
  friction_tenacity: { str: 4 },
  friction_accretion: { quality: 0.05 },
  synergy_nexus: { int: 4 },
  synergy_sanguine: { critChance: 0.03 },
};

window.resolvePlayerStats = function (useDraft = false) {
  if (!useDraft && !window.playerStatsDirty && window.cachedPlayerStats) {
    return window.cachedPlayerStats;
  }

  let p = {
    atk: BigNum.from(0),
    maxHp: BigNum.from(0),
    def: BigNum.from(0),
    moveSpeed: window.playerStats.baseMoveSpeed,
    idleAttackSpeed: window.playerStats.baseIdleSpeed,
    activeAttackSpeed: window.playerStats.baseActiveSpeed,
    drop: window.playerStats.baseDrop,
    qly: window.playerStats.baseQuality,
    gold: window.playerStats.baseGold,
    critChance: window.playerStats.baseCritChance,
    critDamage: window.playerStats.baseCritDamage,
    block: window.playerStats.baseBlock,
    parry: window.playerStats.baseParry,
    rareSpawn: window.playerStats.baseRareSpawn,
    str: window.playerStats.baseStr,
    dex: window.playerStats.baseDex,
    int: window.playerStats.baseInt,
    fairySpawn: window.playerStats.baseFairySpawn,
    arcaneBarrier: 0.0,
    xpRate: 1.0,
    inDilationField: window.player ? window.player.inDilationField : false,
    crucibleSelfDmgReduction: 1.0,
    crucibleCritHeal: 0.0,
    crucibleEchoChance: 0.0,
    crucibleCapBonus: 0.0,
    crucibleShardMult: 1.0,
    crucibleSpellChanceBonus: 0.0,
    crucibleDaggerBleed: 0,
    activeSpeedPct: 0,
    idleSpeedPct: 0,
    atkPct: 0,
    maxHpPct: 0,
  };

  // Secure Local Slot Bonus Matrix to prevent runaway persistent state compounding
  p.crucibleSlotBonuses = {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
    ring1: 0,
    ring2: 0,
  };

  // Passive cumulative title multipliers applied prior to other calculations
  if (window.playerStats.unlockedTitles) {
    window.playerStats.unlockedTitles.forEach((tKey) => {
      let tData = window.TITLES_DATA[tKey];
      if (tData && tData.stats) {
        for (let sKey in tData.stats) {
          if (p[sKey] !== undefined) {
            p[sKey] += tData.stats[sKey];
          }
        }
      }
    });
  }

  if (!window.playerStats.cachedAchievementBonusTotals) {
    window.recalculateAchievementTotals();
  }
  let aT = window.playerStats.cachedAchievementBonusTotals;

  p.def = BigNum.from(p.def).add(aT.def);
  let flatSpeedBonus = aT.moveSpeed || 0;
  p.critChance += aT.critChance;
  p.critDamage += aT.critDamage;
  p.block += aT.block;
  p.parry += aT.parry;
  p.drop += aT.drop;
  p.qly += aT.qly;
  p.gold += aT.gold;
  p.str += aT.str;
  p.dex += aT.dex;
  p.int += aT.int;
  p.fairySpawn += aT.fairySpawn;
  p.rareSpawn += aT.rareSpawn;

  // Calculate Card Stats
  let cards = window.playerStats.monsterCards || {};
  let cardAtkPct = 0;
  let cardHpPct = 0;
  let cardDefPct = 0;
  let cardFlatSpeed = 0;
  let cardCritChance = 0;
  let cardCritDamage = 0;
  let cardParry = 0;
  let cardXpRate = 0;
  let cardDrop = 0;
  let cardGold = 0;
  let cardRareSpawn = 0;

  for (let cardKey in window.MONSTER_CARDS_DATA) {
    let count = cards[cardKey] || 0;
    let tier = window.getCardTier(count);
    if (tier >= 0) {
      let cardData = window.MONSTER_CARDS_DATA[cardKey];
      let val = window.getCardValue(cardData.baseVal, tier);

      switch (cardData.baseStat) {
        case "atk":
          cardAtkPct += val;
          break;
        case "maxHp":
          cardHpPct += val;
          break;
        case "def":
          cardDefPct += val;
          break;
        case "moveSpeed":
          cardFlatSpeed += val;
          break;
        case "critChance":
          cardCritChance += val;
          break;
        case "critDamage":
          cardCritDamage += val;
          break;
        case "parry":
          cardParry += val;
          break;
        case "xpRate":
          cardXpRate += val;
          break;
        case "dropRate":
          cardDrop += val;
          break;
        case "gold":
          cardGold += val;
          break;
        case "rareSpawn":
          cardRareSpawn += val;
          break;
      }
    }
  }

  // Calculate Set Bonuses (The "Weakest Link" Rule)
  let activeSetBonuses = {};
  for (let setName in window.CARD_SETS_DATA) {
    let setData = window.CARD_SETS_DATA[setName];
    let minTier = Infinity;
    let allOwned = true;

    for (let cKey of setData.cards) {
      let count = cards[cKey] || 0;
      let t = window.getCardTier(count);
      if (t < 0) {
        allOwned = false;
        break;
      }
      if (t < minTier) {
        minTier = t;
      }
    }

    if (allOwned) {
      let multiplier = 1.0 + 0.5 * minTier;
      activeSetBonuses[setData.statKey] = multiplier;
    }
  }

  if (activeSetBonuses["xpRate"]) {
    cardXpRate += 0.05 * activeSetBonuses["xpRate"];
  }
  if (activeSetBonuses["defPctBonus"]) {
    cardDefPct += 0.05 * activeSetBonuses["defPctBonus"];
  }
  if (activeSetBonuses["atkPctBonus"]) {
    cardAtkPct += 0.05 * activeSetBonuses["atkPctBonus"];
  }
  if (activeSetBonuses["maxHpPctBonus"]) {
    cardHpPct += 0.05 * activeSetBonuses["maxHpPctBonus"];
  }
  if (activeSetBonuses["qly"]) {
    p.qly += 0.05 * activeSetBonuses["qly"];
  }
  let attributeSetMult = 1.0;
  if (activeSetBonuses["attributesMult"]) {
    attributeSetMult += 0.05 * activeSetBonuses["attributesMult"];
  }

  // Apply Card Utility and Combat Stats
  flatSpeedBonus += cardFlatSpeed;
  p.critChance += cardCritChance;
  p.critDamage += cardCritDamage;
  p.parry += cardParry;
  p.drop += cardDrop;
  p.gold += cardGold;
  p.rareSpawn += cardRareSpawn;

  let achAtkPct = 1.0 + aT.atkPct + cardAtkPct;
  let achMaxHpPct = 1.0 + aT.maxHpPct + cardHpPct;
  let achDefPct = 1.0 + aT.defPct + cardDefPct;
  let achMoveSpeedPct = 1.0 + aT.moveSpeedPct;
  let achStrPct = (1.0 + aT.strPct) * attributeSetMult;
  let achDexPct = (1.0 + aT.dexPct) * attributeSetMult;
  let achIntPct = (1.0 + aT.intPct) * attributeSetMult;

  let committed = window.playerStats.spAllocations || {
    spStr: 0,
    spDex: 0,
    spInt: 0,
  };
  let draft =
    useDraft && window.draftSPAllocations
      ? window.draftSPAllocations
      : { spStr: 0, spDex: 0, spInt: 0 };
  p.str += ((committed.spStr || 0) + (draft.spStr || 0)) * 1;
  p.dex += ((committed.spDex || 0) + (draft.spDex || 0)) * 1;
  p.int += ((committed.spInt || 0) + (draft.spInt || 0)) * 1;

  let paragonLevel = window.playerStats.paragonLevel || 0;
  let paragonMult = 1.0 + paragonLevel * 0.005; // Compounding +0.5% attributes per Paragon Level

  achStrPct *= paragonMult;
  achDexPct *= paragonMult;
  achIntPct *= paragonMult;

  // Apply active run-only Crucible Draft deck modifiers (Capped at 10)
  if (
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleDraftDeck
  ) {
    window.playerStats.crucibleDraftDeck.slice(0, 10).forEach((cardId) => {
      let card = window.CRUCIBLE_DRAFT_POOL.find((c) => c.id === cardId);
      if (card) card.apply(p);
    });
  }

  let flatGearAtk = BigNum.from(0);
  let flatGearHp = BigNum.from(0);
  let flatGearDef = BigNum.from(0);
  let itemAtkPct = 0;
  let itemHpPct = 0;
  let itemDefPct = 0;
  let itemSpdPct = 0;
  let itemStrPct = 0;
  let itemDexPct = 0;
  let itemIntPct = 0;
  let idleSpeedPct = 0.0 + (aT.idleSpeedPct || 0) + (p.idleSpeedPct || 0);
  let activeSpeedPct = 0.0 + (aT.activeSpeedPct || 0) + (p.activeSpeedPct || 0);

  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (item) {
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[key]) ||
        0;
      let runBonus =
        (window.playerStats.isCrucibleMode &&
          p.crucibleSlotBonuses &&
          p.crucibleSlotBonuses[key]) ||
        0;
      let slotMult = 1.0 + slotLvl * 0.01 + runBonus;

      // Flat base additions from Forge Slot Attunements (completely level-independent!)
      if (key === "weapon") flatGearAtk = flatGearAtk.add(slotLvl * 15);
      if (key === "chest" || key === "leggings" || key === "overall") {
        flatGearHp = flatGearHp.add(slotLvl * 50);
        flatGearDef = flatGearDef.add(slotLvl * 10);
      }
      if (key === "ring1" || key === "ring2") {
        flatGearAtk = flatGearAtk.add(slotLvl * 10);
        flatGearHp = flatGearHp.add(slotLvl * 30);
      }
      if (key === "boots") {
        flatSpeedBonus += slotLvl * 2;
      }

      // Flat item stats (safely handled regardless of source type)
      flatGearAtk = flatGearAtk.add(BigNum.from(item.atk || 0).mul(slotMult));
      flatGearHp = flatGearHp.add(BigNum.from(item.maxHp || 0).mul(slotMult));
      flatGearDef = flatGearDef.add(BigNum.from(item.def || 0).mul(slotMult));
      flatSpeedBonus += (item.moveSpeed || 0) * slotMult;

      let itemIdleSpeed = item.idleAttackSpeed || 0;
      if (itemIdleSpeed < 0) itemIdleSpeed = Math.abs(itemIdleSpeed) * 0.05;
      idleSpeedPct += itemIdleSpeed * slotMult;

      let itemActiveSpeed = item.activeAttackSpeed || 0;
      if (itemActiveSpeed < 0)
        itemActiveSpeed = Math.abs(itemActiveSpeed) * 0.05;
      activeSpeedPct += itemActiveSpeed * slotMult;

      p.drop += (item.dropRate || 0) * slotMult;
      p.qly += (item.quality || 0) * slotMult;
      p.gold += (item.goldMulti || 0) * slotMult;
      p.critChance += (item.critChance || 0) * slotMult;
      p.critDamage += (item.critDamage || 0) * slotMult;
      p.block += (item.block || 0) * slotMult;
      p.parry += (item.parry || 0) * slotMult;
      p.str += (item.str || 0) * slotMult;
      p.dex += (item.dex || 0) * slotMult;
      p.int += (item.int || 0) * slotMult;
      p.rareSpawn += (item.rareSpawn || 0) * slotMult;
      p.fairySpawn += (item.fairySpawn || 0) * slotMult;

      if (item.atkPct) itemAtkPct += item.atkPct * slotMult;
      if (item.maxHpPct) itemHpPct += item.maxHpPct * slotMult;
      if (item.defPct) itemDefPct += item.defPct * slotMult;
      if (item.moveSpeedPct) itemSpdPct += item.moveSpeedPct * slotMult;
      if (item.strPct) itemStrPct += item.strPct * slotMult;
      if (item.dexPct) itemDexPct += item.dexPct * slotMult;
      if (item.intPct) itemIntPct += item.intPct * slotMult;

      // Commented out to prevent flat-to-percentage double-dipping in late game
      // itemAtkPct += (BigNum.from(item.bonusAtk || 0).div(100).mul(slotMult).valueOf());
      // itemHpPct += (BigNum.from(item.bonusMaxHp || 0).div(100).mul(slotMult).valueOf());
      // itemDefPct += (BigNum.from(item.bonusDef || 0).div(100).mul(slotMult).valueOf());
    }
  }

  // Calculate Virtual Codex Relics stats and apply their slot attunements
  if (
    window.playerStats &&
    window.playerStats.activeRelics &&
    window.ARTIFACT_BASE_STATS
  ) {
    const relicSlotsKeys = ["art1", "art2", "art3"];
    relicSlotsKeys.forEach((slotKey, idx) => {
      let trait = window.playerStats.activeRelics[idx];
      if (trait) {
        let savedPower = window.playerStats.artifactCodex[trait] || 0.0;
        if (savedPower > 0) {
          let slotLvl =
            (window.playerStats.slotUpgrades &&
              window.playerStats.slotUpgrades[slotKey]) ||
            0;
          let runBonus =
            (window.playerStats.isCrucibleMode &&
              p.crucibleSlotBonuses &&
              p.crucibleSlotBonuses[slotKey]) ||
            0;
          let slotMult = 1.0 + slotLvl * 0.01 + runBonus;

          let baseStats = window.ARTIFACT_BASE_STATS[trait];
          if (baseStats) {
            for (let sKey in baseStats) {
              let val = baseStats[sKey];
              let scaledVal = val * savedPower * slotMult;

              if (
                sKey === "atk" ||
                sKey === "maxHp" ||
                sKey === "def" ||
                sKey === "str" ||
                sKey === "dex" ||
                sKey === "int"
              ) {
                if (sKey === "atk") flatGearAtk = flatGearAtk.add(scaledVal);
                else if (sKey === "maxHp")
                  flatGearHp = flatGearHp.add(scaledVal);
                else if (sKey === "def")
                  flatGearDef = flatGearDef.add(scaledVal);
                else p[sKey] += Math.ceil(scaledVal);
              } else if (sKey === "moveSpeedPct") {
                itemSpdPct += scaledVal;
              } else if (sKey === "idleAttackSpeed") {
                idleSpeedPct += Math.abs(scaledVal);
              } else if (sKey === "activeAttackSpeed") {
                activeSpeedPct += Math.abs(scaledVal);
              } else if (sKey === "maxHpPct") {
                itemHpPct += scaledVal;
              } else if (sKey === "defPct") {
                itemDefPct += scaledVal;
              } else if (p[sKey] !== undefined) {
                p[sKey] += scaledVal;
              }
            }
          }
        }
      }
    });
  }

  if (
    window.checkArtifactTrait("golem_stance") &&
    window.playerStats.currentHp / p.maxHp >= 0.8
  )
    itemAtkPct += 0.2;

  let setCounts = {};
  const eligibleSetSlots = [
    "weapon",
    "subweapon",
    "helmet",
    "chest",
    "leggings",
    "overall",
    "boots",
  ];
  eligibleSetSlots.forEach((slot) => {
    let item = window.equippedSlots[slot];
    if (item) {
      let setName = window.getItemSetName(item);
      if (setName)
        setCounts[setName] =
          (setCounts[setName] || 0) + (slot === "overall" ? 2 : 1);
    }
  });

  let setCtx = {
    atk: 0,
    maxHp: 0,
    moveSpeed: 0,
    idleSpeedPct: 0,
    activeSpeedPct: 0,
    critChance: 0,
    critDamage: 0,
    block: 0,
    parry: 0,
    atkPctBonus: 0,
    maxHpPctBonus: 0,
    defPctBonus: 0,
    flatDefBonus: 0,
    str: 0,
    dex: 0,
    int: 0,
    gold: 0,
    drop: 0,
    qly: 0,
    rareSpawn: 0,
    hasCorrosiveSet: false,
    hasShatterSet: false,
    hasSingularitySet: false,
  };
  for (let setName in setCounts) {
    let count = setCounts[setName];
    let setDef = window.SET_DEFINITIONS[setName];
    if (setDef)
      setDef.bonuses.forEach((b) => {
        if (count >= b.count) b.apply(setCtx);
      });
  }

  p.atk = p.atk.add(BigNum.from(setCtx.atk));
  p.maxHp = p.maxHp.add(BigNum.from(setCtx.maxHp));
  flatSpeedBonus += setCtx.moveSpeed || 0;
  idleSpeedPct += setCtx.idleSpeedPct;
  activeSpeedPct += setCtx.activeSpeedPct;
  p.critChance += setCtx.critChance;
  p.critDamage += setCtx.critDamage;
  p.block += setCtx.block;
  p.parry += setCtx.parry;

  p.str += setCtx.str;
  p.dex += setCtx.dex;
  p.int += setCtx.int;
  p.gold += setCtx.gold;
  p.drop += setCtx.drop;
  p.qly += setCtx.qly;
  p.rareSpawn += setCtx.rareSpawn;
  p.hasCorrosiveSet = setCtx.hasCorrosiveSet;
  p.hasShatterSet = setCtx.hasShatterSet;
  p.hasSingularitySet = setCtx.hasSingularitySet;

  achAtkPct += setCtx.atkPctBonus;
  achMaxHpPct += setCtx.maxHpPctBonus;
  achDefPct += setCtx.defPctBonus;

  p.str = Math.floor(p.str * achStrPct);
  p.dex = Math.floor(p.dex * achDexPct);
  p.int = Math.floor(p.int * achIntPct);

  let effectiveStr = Math.max(0, p.str - 5);
  let effectiveDex = Math.max(0, p.dex - 5);
  let effectiveInt = Math.max(0, p.int - 5);

  // Apply Dexterity Attribute Matrix points to Move Speed, Crit Chance, and Crit Multiplier
  p.critChance += effectiveDex * 0.001; // +0.1% Crit Chance per point
  p.critDamage += effectiveDex * 0.005; // +0.5% Crit Multiplier per point
  flatSpeedBonus += effectiveDex * 1.0; // +1% Speed per point

  // Dynamically adjust offensive percentage scaling based on equipped subweapon archetype
  let activeSubForPct = window.equippedSlots
    ? window.equippedSlots.subweapon
    : null;
  let activeSubTypeForPct = activeSubForPct
    ? activeSubForPct.subType || activeSubForPct.type
    : null;
  let mainStatAtkPct = 0;

  if (activeSubTypeForPct === "dagger") {
    mainStatAtkPct = effectiveDex * 0.001;
  } else if (activeSubTypeForPct === "tome") {
    mainStatAtkPct = effectiveInt * 0.001;
  } else {
    mainStatAtkPct = effectiveStr * 0.001;
  }

  // Synchronized with the latest balance formulas in resolvePlayerStats()
  itemAtkPct += mainStatAtkPct;
  itemHpPct += effectiveStr * 0.001; // Vitality remains bound to physical strength (STR)

  // --- CALCULATE SECURE EXPONENTIAL CHARACTER-BOUND BASE STATS ---
  let levelScale = BigNum.from(1.025).pow(window.playerStats.level - 1);

  let activeSub = window.equippedSlots ? window.equippedSlots.subweapon : null;
  let activeSubType = activeSub ? activeSub.subType || activeSub.type : null;
  let strWeight = 5;
  let dexWeight = 2;
  let intWeight = 1;

  if (activeSubType === "dagger") {
    strWeight = 2;
    dexWeight = 5;
    intWeight = 1;
  } else if (activeSubType === "tome") {
    strWeight = 2;
    dexWeight = 1;
    intWeight = 5;
  }

  let allocStr = p.str - 5;
  let allocDex = p.dex - 5;
  let allocInt = p.int - 5;

  let baseCharAtk = BigNum.from(10 + (window.playerStats.level - 1) * 3)
    .mul(levelScale)
    .add(Math.max(0, allocStr) * 2.5 + Math.max(0, allocDex) * 1);
  let baseCharHp = BigNum.from(100 + (window.playerStats.level - 1) * 15)
    .mul(levelScale)
    .add(Math.max(0, allocStr) * 10);
  let baseCharDef = BigNum.from((window.playerStats.level - 1) * 1.5)
    .mul(levelScale)
    .add(Math.max(0, allocInt) * 0.2);

  p.atk = baseCharAtk.add(flatGearAtk);
  p.maxHp = baseCharHp.add(flatGearHp);
  let flatTotalDef = baseCharDef
    .add(flatGearDef)
    .add(BigNum.from(setCtx.flatDefBonus));

  // Suffixes multipliers applied on total flat base
  p.atk = p.atk.mul(1.0 + itemAtkPct).mul(achAtkPct);
  p.maxHp = p.maxHp.mul(1.0 + itemHpPct).mul(achMaxHpPct);
  p.moveSpeed =
    window.playerStats.baseMoveSpeed *
    (1 + flatSpeedBonus / 100) *
    (achMoveSpeedPct + itemSpdPct + (setCtx.moveSpeedPctBonus || 0));

  // Calculate Arcane Barrier for Inspected Player holding a Tome
  let insSub = window.equippedSlots.subweapon;
  if (insSub && insSub.subType === "tome") {
    let insEffInt = Math.max(0, p.int - 5);
    let insIntBonus = Math.min(0.15, (insEffInt * 0.15) / (insEffInt + 150));
    p.arcaneBarrier = 0.2 + insIntBonus;
  }

  let defMultiplier = 1.0 + setCtx.defPctBonus;
  for (let key in window.equippedSlots) {
    let item = window.equippedSlots[key];
    if (
      item &&
      ["chest", "leggings", "overall", "helmet"].includes(item.type)
    ) {
      let slotLvl =
        (window.playerStats.slotUpgrades &&
          window.playerStats.slotUpgrades[key]) ||
        0;
      let stars = item.statsRolled === "UNIQUE" ? 5 : item.statsRolled || 0;
      defMultiplier += stars * 0.03 + slotLvl * 0.01;
    }
  }
  p.def = flatTotalDef.mul(defMultiplier + itemDefPct).mul(achDefPct);

  // Apply Active Skill Tree Passive Modifiers
  if (window.SkillTreeManager) {
    let st = window.SkillTreeManager;

    // --- SHIELD MASTERY (BASTION TREE) ---
    let shieldHpRank = st.getSkillLevel("shield_hp");
    if (shieldHpRank > 0) p.maxHpPct = (p.maxHpPct || 0) + shieldHpRank * 0.04;

    let shieldDefRank = st.getSkillLevel("shield_def");
    if (shieldDefRank > 0)
      p.defPctBonus = (p.defPctBonus || 0) + shieldDefRank * 0.03;

    let spikedRimRank = st.getSkillLevel("shield_spiked_rim");
    if (spikedRimRank > 0) {
      p.reflectDamage = [0.6, 0.8, 1.0][spikedRimRank - 1];
    }

    let ironWallRank = st.getSkillLevel("shield_iron_wall");
    if (ironWallRank > 0) {
      p.block += ironWallRank * 0.01; // Restored +1% Block Rate per rank
      p.blockCapBonus = (p.blockCapBonus || 0) + ironWallRank * 0.02; // Restored Block Cap expansion
    }

    let impactTremorRank = st.getSkillLevel("shield_impact_tremor");
    if (impactTremorRank > 0) {
      p.hasImpactTremor = true;
      p.impactTremorChance = impactTremorRank * 0.2;
    }

    let fortifiedGuardRank = st.getSkillLevel("shield_fortified_guard");
    if (fortifiedGuardRank > 0) {
      p.fortifiedGuardMultiplier = fortifiedGuardRank * 0.04;
    }

    let shieldFortitudeRank = st.getSkillLevel("shield_fortitude");
    if (shieldFortitudeRank > 0) {
      p.blockMitigationBonus = shieldFortitudeRank * 0.1; // Restored -10% damage taken on block per rank
    }

    if (st.getSkillLevel("shield_retaliatory_strike") > 0) {
      p.hasRetaliatoryStrike = true;
    }

    let aegisPulseRank = st.getSkillLevel("shield_aegis_pulse");
    if (aegisPulseRank > 0) {
      p.hasAegisPulse = true;
      p.aegisPulseHeal = aegisPulseRank * 0.03;
    }

    let shieldRetaliationRank = st.getSkillLevel("shield_retaliation");
    if (shieldRetaliationRank > 0) {
      p.reflectDamage = (p.reflectDamage || 1.0) + shieldRetaliationRank * 0.12;
      p.bashAtkBonus = (p.bashAtkBonus || 0) + shieldRetaliationRank * 0.15; // Restored +15% Shield Bash base damage per rank
    }

    if (st.getSkillLevel("shield_keystone_colossus") > 0) {
      p.blockMitigation = 1.0;
      p.hasColossusKeystone = true;
    }

    if (st.getSkillLevel("shield_keystone_reflect") > 0) {
      p.hasReflectKeystone = true;
      p.reflectDamage = 1.8;
    }

    // --- DAGGER MASTERY (SHADOW & VENOM TREE) ---
    let daggerCritRank = st.getSkillLevel("dagger_crit");
    if (daggerCritRank > 0) p.critChance += daggerCritRank * 0.015; // Restored Crit Chance bonus

    let daggerCritDmgRank = st.getSkillLevel("dagger_crit_dmg");
    if (daggerCritDmgRank > 0) p.critDamage += daggerCritDmgRank * 0.06; // Restored Crit Damage multiplier

    let lethalPrecisionRank = st.getSkillLevel("dagger_lethal_precision");
    if (lethalPrecisionRank > 0) {
      p.offhandChance = [0.48, 0.56, 0.65][lethalPrecisionRank - 1];
      p.offhandDmg = [0.4, 0.48, 0.55][lethalPrecisionRank - 1];
      p.flurryDamageBonus = lethalPrecisionRank * 0.1; // Restored +10% Offhand Flurry damage per rank
    }

    let vipersCoatingRank = st.getSkillLevel("dagger_vipers_coating");
    if (vipersCoatingRank > 0) {
      p.hasViperCoating = true;
      p.viperPoisonStrength = vipersCoatingRank * 0.1;
      p.bleedChance = (p.bleedChance || 0) + vipersCoatingRank * 0.05; // Restored Bleed DoT chance
    }

    let daggerParryRank = st.getSkillLevel("dagger_parry");
    if (daggerParryRank > 0) {
      p.parry += daggerParryRank * 0.01; // Restored base parry chance
      p.parryCapBonus = (p.parryCapBonus || 0) + daggerParryRank * 0.02; // Restored Parry Cap expansion
    }

    let shadowStepRank = st.getSkillLevel("dagger_shadow_step");
    if (shadowStepRank > 0) {
      p.hasShadowStep = true;
      p.shadowStepLevel = shadowStepRank;
      p.riposteDamage = (p.riposteDamage || 0.8) + shadowStepRank * 0.2; // Restored +20% Riposte Damage per rank
    }

    let exposeWeaknessRank = st.getSkillLevel("dagger_expose_weakness");
    if (exposeWeaknessRank > 0) {
      p.hasExposeWeakness = true;
      p.exposeWeaknessShred = exposeWeaknessRank * 0.04;
    }

    if (st.getSkillLevel("dagger_shadow_flurry") > 0) {
      p.hasShadowFlurry = true;
    }

    let SanguineRuptureRank = st.getSkillLevel("dagger_sanguine_rupture");
    if (SanguineRuptureRank > 0) {
      p.hasSanguineRupture = true;
      p.sanguineRuptureMult = SanguineRuptureRank * 1.5;
    }

    if (st.getSkillLevel("dagger_keystone_assassin") > 0) {
      p.hasShadowAssassin = true;
    }

    if (st.getSkillLevel("dagger_keystone_duellist") > 0) {
      p.hasMasterDuellist = true;
      p.parryCapBonus = (p.parryCapBonus || 0) + 0.15;
    }

    // --- TOME MASTERY (ARCHMAGE ARCANA TREE) ---
    let tomeAtkRank = st.getSkillLevel("tome_atk");
    if (tomeAtkRank > 0) p.atkPct = (p.atkPct || 0) + tomeAtkRank * 0.035; // Restored base Spell Power/Atk %

    let tomeExpRank = st.getSkillLevel("tome_exp");
    if (tomeExpRank > 0) p.xpRate += tomeExpRank * 0.03; // Restored XP Gain boost

    let empoweredCatalystsRank = st.getSkillLevel("tome_empowered_catalysts");
    if (empoweredCatalystsRank > 0) {
      p.spellChance = [0.4, 0.45, 0.5][empoweredCatalystsRank - 1];
      p.spellPower = [1.75, 2.0, 2.25][empoweredCatalystsRank - 1];
    }

    let runicShieldingRank = st.getSkillLevel("tome_runic_barrier");
    if (runicShieldingRank > 0 && p.arcaneBarrier > 0) {
      p.arcaneBarrier = [0.24, 0.28, 0.32][runicShieldingRank - 1];
      p.arcaneBarrierCap = 0.4;
    }

    let elementalOverloadRank = st.getSkillLevel("tome_elemental_overload");
    if (elementalOverloadRank > 0) {
      p.hasElementalOverload = true;
      p.overloadLevel = elementalOverloadRank;
    }

    let arcaneSyphonRank = st.getSkillLevel("tome_arcane_syphon");
    if (arcaneSyphonRank > 0) {
      p.hasArcaneSyphon = true;
      p.arcaneSyphonLevel = arcaneSyphonRank;
    }

    if (st.getSkillLevel("tome_barrier_shatter") > 0) {
      p.hasBarrierShatter = true;
    }

    let spellWeavingRank = st.getSkillLevel("tome_spell_weaving");
    if (spellWeavingRank > 0) {
      p.hasSpellWeaving = true;
      p.spellWeavingPower = spellWeavingRank * 0.15;
    }

    let resilienceRank = st.getSkillLevel("tome_resilience");
    if (resilienceRank > 0) {
      p.manaShieldingHeal = resilienceRank * 0.02; // Restored +2% Max HP heal on spell cast
    }

    if (st.getSkillLevel("tome_keystone_triad") > 0) {
      p.hasTriadConvergence = true;
    }

    if (st.getSkillLevel("tome_keystone_singularity") > 0) {
      p.arcaneBarrier = 0.45;
      p.hasAethericSingularity = true;
    }

    // --- UTILITY TREE (GLOBAL MP) ---
    let pioneerRank = st.getSkillLevel("utility_pioneer");
    if (pioneerRank > 0) {
      p.gold += 0.05;
      p.drop += 0.05;
    }

    let utilityGoldRank = st.getSkillLevel("utility_gold");
    if (utilityGoldRank > 0) p.gold += utilityGoldRank * 0.05;

    let qualityRank = st.getSkillLevel("utility_quality");
    if (qualityRank > 0) p.qly += qualityRank * 0.02;

    let utilityVitalityRank = st.getSkillLevel("utility_vitality");
    if (utilityVitalityRank > 0) {
      p.maxHpPct = (p.maxHpPct || 0) + utilityVitalityRank * 0.03;
      flatSpeedBonus += utilityVitalityRank * 2.0;
    }

    let bagRank = st.getSkillLevel("utility_bag");
    if (bagRank > 0) {
      p.bonusBagSpace = (p.bonusBagSpace || 0) + bagRank * 5;
    }
  }

  // Fortitude stack decay
  if (window.playerStats.fortitudeTimer > 0) {
    window.playerStats.fortitudeTimer--;
    if (window.playerStats.fortitudeTimer <= 0) {
      window.playerStats.fortitudeStacks = 0;
    }
  }
  if ((window.playerStats.fortitudeStacks || 0) > 0) {
    let multiplier =
      window.playerStats.fortitudeStacks * (p.fortifiedGuardMultiplier || 0.04);
    p.defPctBonus = (p.defPctBonus || 0) + multiplier;
  }

  // Arcane Syphon stack decay
  if (window.playerStats.syphonIntTimer > 0) {
    window.playerStats.syphonIntTimer--;
    if (window.playerStats.syphonIntTimer <= 0) {
      window.playerStats.syphonIntStacks = 0;
    }
  }
  if ((window.playerStats.syphonIntStacks || 0) > 0) {
    let multiplier =
      window.playerStats.syphonIntStacks * ((p.arcaneSyphonLevel || 1) * 0.04);
    p.intPctBonus = (p.intPctBonus || 0) + multiplier;
  }

  // Spell Weaving stack decay
  if (window.playerStats.spellWeavingTimer > 0) {
    window.playerStats.spellWeavingTimer--;
    if (window.playerStats.spellWeavingTimer <= 0) {
      window.playerStats.spellWeavingStacks = 0;
    }
  }
  if ((window.playerStats.spellWeavingStacks || 0) > 0) {
    let extraPower =
      window.playerStats.spellWeavingStacks * (p.spellWeavingPower || 0.15);
    p.spellPower = (p.spellPower || 1.5) + extraPower;
  }

  // Bulwark Colossus AP temporary bonus
  if (window.playerStats.colossusApTimer > 0) {
    window.playerStats.colossusApTimer--;
    if (window.playerStats.colossusApTimer <= 0) {
      window.playerStats.colossusApBonus = 0;
    }
  }
  if ((window.playerStats.colossusApBonus || 0) > 0) {
    p.atk = p.atk.add(window.playerStats.colossusApBonus);
  }

  // Shadow Step speed/haste bonus
  if (window.playerStats.shadowStepTimer > 0) {
    window.playerStats.shadowStepTimer--;
    if (window.playerStats.shadowStepTimer > 0) {
      let lvl = p.shadowStepLevel || 1;
      p.moveSpeed *= 1.0 + lvl * 0.15;
      activeSpeedPct += lvl * 0.1;
      idleSpeedPct += lvl * 0.1;
    }
  }

  // Fortune's Favor Keystone Gold Multiplier Timer
  if (window.playerStats.fortunesFavorTimer > 0) {
    window.playerStats.fortunesFavorTimer--;
    p.gold += 0.5; // +50% Gold Multiplier
  }

  // Viper's Shadow Dance Keystone 100% Crit Chance Charges
  if (window.playerStats.viperShadowDanceCharges > 0) {
    p.critChance = 1.0;
  }

  // Apply Cavern Sigil Active Modifiers (Dungeon Mode)
  if (
    window.playerStats.isDungeonMode &&
    window.playerStats.activeDungeonSigil
  ) {
    let activeSig = window.playerStats.activeDungeonSigil;
    p.qly += activeSig.qualityBoost || 0;
    p.gold += activeSig.rewardMultiplier || 0;
    p.drop += activeSig.rewardMultiplier || 0;

    activeSig.buffs.forEach((b) => {
      if (b.type === "stat" && b.statKey) {
        if (b.statKey === "atk") p.atk = p.atk.mul(1 + b.value);
        else if (b.statKey === "maxHp") p.maxHp = p.maxHp.mul(1 + b.value);
        else if (b.statKey === "def") p.def = p.def.mul(1 + b.value);
        else if (b.statKey === "moveSpeed")
          p.moveSpeed = Math.max(1.0, p.moveSpeed * (1 + b.value));
        else if (b.statKey === "critChance")
          p.critChance = Math.max(0.0, p.critChance + b.value);
        else if (b.statKey === "critDamage")
          p.critDamage = Math.max(0.0, p.critDamage + b.value);
        else if (b.statKey === "block") {
          p.block = Math.max(0.0, p.block + b.value);
          p.parry = Math.max(0.0, p.parry + b.value);
        }
      } else {
        // Legacy/Event Fallbacks
        if (b.id === "swift_strikes") {
          p.idleAttackSpeed = Math.max(
            10,
            Math.round(p.idleAttackSpeed / 1.25),
          );
          p.activeAttackSpeed = Math.max(
            4,
            Math.round(p.activeAttackSpeed / 1.25),
          );
        } else if (b.id === "giant_might") {
          p.atk = p.atk.mul(1.3);
        } else if (b.id === "iron_aegis") {
          p.def = p.def.mul(1.35);
        } else if (b.id === "vital_fountain") {
          p.maxHp = p.maxHp.mul(1.4);
        } else if (b.id === "unstable_surge") {
          p.critChance += 0.15;
        } else if (b.id === "shatter_frenzy") {
          p.critDamage += 0.5;
        } else if (b.id === "deflection_vortex") {
          p.block += 0.1;
          p.parry += 0.1;
        } else if (b.id === "arcane_infusion") {
          p.arcaneBarrier = Math.min(0.5, p.arcaneBarrier + 0.15);
        } else if (b.id === "treasure_finder") {
          p.gold += 0.5;
        } else if (b.id === "lucky_winds") {
          p.fairySpawn += 0.4;
        } else if (b.id === "void_call") {
          p.rareSpawn += 0.5;
        } else if (b.id === "scavenger_insight") {
          p.drop += 0.5;
        } else if (b.id === "artisan_luck") {
          p.qly += 0.25;
        }
      }
    });

    if (!(window.playerStats.purifiedAegisTimer > 0)) {
      activeSig.debuffs.forEach((d) => {
        if (d.type === "stat" && d.statKey) {
          if (d.statKey === "atk")
            p.atk = p.atk.mul(Math.max(0.1, 1 + d.value));
          else if (d.statKey === "maxHp")
            p.maxHp = p.maxHp.mul(Math.max(0.1, 1 + d.value));
          else if (d.statKey === "def")
            p.def = p.def.mul(Math.max(0.1, 1 + d.value));
          else if (d.statKey === "moveSpeed")
            p.moveSpeed = Math.max(1.0, p.moveSpeed * (1 + d.value));
          else if (d.statKey === "critChance")
            p.critChance = Math.max(0.0, p.critChance + d.value);
        } else {
          // Legacy/Event Fallbacks
          if (d.id === "iron_gaze") {
            p.idleAttackSpeed = Math.round(p.idleAttackSpeed * 1.2);
            p.activeAttackSpeed = Math.round(p.activeAttackSpeed * 1.2);
          } else if (d.id === "shattered_armour") {
            p.def = p.def.mul(0.75);
          } else if (d.id === "frail_vessel") {
            p.maxHp = p.maxHp.mul(0.8);
          } else if (d.id === "dull_blades") {
            p.atk = p.atk.mul(0.8);
          } else if (d.id === "heavy_mist") {
            p.moveSpeed = Math.max(1.0, p.moveSpeed * 0.7);
          } else if (d.id === "blind_spot") {
            p.critChance = Math.max(0.0, p.critChance - 0.1);
          } else if (d.id === "feeble_mind") {
            p.arcaneBarrier = 0.0;
          } else if (d.id === "curse_greed") {
            p.gold = Math.max(0.1, p.gold - 0.4);
          } else if (d.id === "lead_boots") {
            p.block = Math.max(0.0, p.block - 0.08);
            p.parry = Math.max(0.0, p.parry - 0.08);
          }
        }
      });
    }
  }

  let potStrengthMultiplier = 1.0 + effectiveInt * 0.005; // +0.5% Potion Potency per INT point
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.potStrengthPct)
        potStrengthMultiplier += ach.stats.potStrengthPct;
    });
  }
  if (window.checkArtifactTrait("alchemist_alembic"))
    potStrengthMultiplier += 0.3;

  if (window.playerStats.astralAwakeningTimer > 0) {
    p.atk = p.atk.mul(2.0);
    activeSpeedPct += 0.15;
    idleSpeedPct += 0.15;
  } else if (window.playerStats.sparkChainCount > 0) {
    p.atk = p.atk.mul(1.0 + window.playerStats.sparkChainCount * 0.1);
  }

  let hasAtkPot =
    (window.playerStats.atkPotionRuns || 0) > 0 ||
    (window.playerStats.atkPotionTimer || 0) > 0;
  let hasHpPot =
    (window.playerStats.hpPotionRuns || 0) > 0 ||
    (window.playerStats.hpPotionTimer || 0) > 0;
  let hasDefPot =
    (window.playerStats.defPotionRuns || 0) > 0 ||
    (window.playerStats.defPotionTimer || 0) > 0;
  let hasHastePot =
    (window.playerStats.hastePotionRuns || 0) > 0 ||
    (window.playerStats.hastePotionTimer || 0) > 0;
  let hasDropPot =
    (window.playerStats.dropPotionRuns || 0) > 0 ||
    (window.playerStats.dropPotionTimer || 0) > 0;
  let hasQlyPot =
    (window.playerStats.qlyPotionRuns || 0) > 0 ||
    (window.playerStats.qlyPotionTimer || 0) > 0;

  if (hasAtkPot)
    p.atk = p.atk.mul(
      1 + (window.playerStats.atkPotionStrength || 0.1) * potStrengthMultiplier,
    );
  if (hasHpPot)
    p.maxHp = p.maxHp.mul(
      1 + (window.playerStats.hpPotionStrength || 0.1) * potStrengthMultiplier,
    );
  if (hasDefPot)
    p.def = p.def.mul(
      1 + (window.playerStats.defPotionStrength || 0.1) * potStrengthMultiplier,
    );

  if (hasHastePot) {
    let tier = window.playerStats.hastePotionStrength || 1;
    flatSpeedBonus += Math.ceil(3 * tier * potStrengthMultiplier);
    activeSpeedPct += 0.1 * tier * potStrengthMultiplier;
    idleSpeedPct += 0.1 * tier * potStrengthMultiplier;
  }

  if (hasDropPot) {
    p.drop += 1.0 * potStrengthMultiplier;
  }
  if (hasQlyPot) {
    p.qly += 0.5 * potStrengthMultiplier;
  }

  if (window.checkArtifactTrait("move_speed")) flatSpeedBonus += 10;
  if (window.checkArtifactTrait("gold_hoard")) p.gold += 0.5;
  if (window.checkArtifactTrait("idle_spd")) idleSpeedPct += 0.35;
  if (window.checkArtifactTrait("active_spd")) activeSpeedPct += 0.25;

  // Kinetic Friction Turbine dynamic attack speed injection
  if (window.checkArtifactTrait("friction_kinetic")) {
    let slotLvl = window.getArtifactTemperLevel
      ? window.getArtifactTemperLevel("friction_kinetic")
      : 0;
    let slotMult = 1.0 + slotLvl * 0.01;
    let charges = window.playerStats.kineticFrictionCharges || 0;
    let bonusSpeedPct = 0.005 * charges * slotMult;
    activeSpeedPct += bonusSpeedPct;
    idleSpeedPct += bonusSpeedPct;
  }

  if (
    window.hasUniquePassive("tome_watch") &&
    window.playerStats.watchActiveTimer > 0
  ) {
    idleSpeedPct += 0.15;
    activeSpeedPct += 0.15;
  }
  if (
    window.checkArtifactTrait("cauldron_eternity") &&
    (hasAtkPot || hasHpPot || hasDefPot || hasHastePot)
  ) {
    idleSpeedPct += 0.08;
  }

  let finalIdleDivisor = Math.max(0.1, 1 + idleSpeedPct);
  let finalActiveDivisor = Math.max(0.1, 1 + activeSpeedPct);
  p.idleAttackSpeed = Math.max(10, Math.round(60 / finalIdleDivisor));
  p.activeAttackSpeed = Math.max(4, Math.round(15 / finalActiveDivisor));

  if (p.inDilationField) {
    p.idleAttackSpeed = Math.round(p.idleAttackSpeed * 1.67);
    p.activeAttackSpeed = Math.round(p.activeAttackSpeed * 1.67);
  }

  if (
    window.hasUniquePassive("boots_warpcore") &&
    window.playerStats.warpCoreSprintTimer > 0
  ) {
    p.idleAttackSpeed = 10;
    p.activeAttackSpeed = 4;
  }

  if (window.playerStats.frenzyTimer > 0) {
    p.critChance = 1.0;
    p.critDamage += 0.5;
    p.activeAttackSpeed = 4;
    p.idleAttackSpeed = 15;
  }

  let maxBlockCap = 0.40; // Elevated base block cap
    let maxParryCap = 0.35; // Elevated base parry cap

    let subItem = window.equippedSlots ? window.equippedSlots.subweapon : null;
    let hasShield =
      subItem && (subItem.subType === "shield" || subItem.type === "shield");
    let hasDagger =
      subItem && (subItem.subType === "dagger" || subItem.type === "dagger");
    let hasTitanGrip =
      window.checkArtifactTrait && window.checkArtifactTrait("titan_grip");

    if (hasShield) {
      maxBlockCap = hasTitanGrip ? 0.50 : 0.40;
    } else if (hasTitanGrip) {
      maxBlockCap = 0.20;
    } else {
      p.block = 0.0;
    }

    if (hasDagger) {
      let noun = subItem.noun ? subItem.noun.toLowerCase() : "";
      if (noun.includes("main-gauche")) {
        maxParryCap = hasTitanGrip ? 0.55 : 0.45;
      } else {
        maxParryCap = hasTitanGrip ? 0.45 : 0.35;
      }
    } else if (hasTitanGrip) {
      maxParryCap = 0.15;
    } else {
      p.parry = 0.0;
    }

    maxBlockCap += p.crucibleCapBonus || 0;
    maxParryCap += p.crucibleCapBonus || 0;
    maxBlockCap += p.blockCapBonus || 0;
    maxParryCap += p.parryCapBonus || 0;

    // STR and DEX Attribute Scaling
    if (p.block > 0.0) {
      p.block += effectiveStr * 0.001; // +0.1% raw block rate per STR point
    }
    if (p.parry > 0.0) {
      p.parry += effectiveDex * 0.001; // +0.1% raw parry rate per DEX point
    }

    p.rawBlock = p.block;
    p.rawParry = p.parry;
    p.maxBlockCap = maxBlockCap;
    p.maxParryCap = maxParryCap;

    // Asymptotic Soft-Cap Curve Processing (S = 50% of the maximum Cap C)
    let sBlock = maxBlockCap * 0.5;
    if (p.block > sBlock) {
      let excess = p.block - sBlock;
      let range = maxBlockCap - sBlock;
      p.block = sBlock + range * (excess / (excess + range));
    }

    let sParry = maxParryCap * 0.5;
    if (p.parry > sParry) {
      let excess = p.parry - sParry;
      let range = maxParryCap - sParry;
      p.parry = sParry + range * (excess / (excess + range));
    }

  // Calculate Tome passive Arcane Barrier
  let hasTome =
    subItem && (subItem.subType === "tome" || subItem.type === "tome");
  if (hasTome) {
    // Base 20% absorption, scaling up to 35% with INT
    let intBonus = Math.min(0.15, (effectiveInt * 0.15) / (effectiveInt + 150));
    p.arcaneBarrier = 0.2 + intBonus;
  } else {
    p.arcaneBarrier = 0.0;
  }

  let rawRare = p.rareSpawn;
  let limit = window.checkArtifactTrait("void_pull") ? 0.1 : 0.075;
  let excessRare = Math.max(0, rawRare - 0.01);
  let scale = limit - 0.01;
  p.rareSpawn = 0.01 + (excessRare * scale) / (excessRare + scale);

  if (!window.playerStats.isCrucibleMode && !window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 3;
  } else if (window.playerStats.isCrucibleMode) {
    window.playerStats.targetsRequired = 3;
  } else if (window.playerStats.isDungeonMode) {
    window.playerStats.targetsRequired = 3;
  }

  if (
    window.hasUniquePassive("boots_warpcore") &&
    window.mob &&
    window.mob.hp > 0
  ) {
    let hpPct = window.mob.hp / window.mob.maxHp;
    let missingHpPct = 1.0 - hpPct;
    let speedBonus = Math.min(0.99, missingHpPct);
    idleSpeedPct += speedBonus;
    activeSpeedPct += speedBonus;
  }

  if (window.playerStats.maelstromSpeedTimer > 0) {
    window.playerStats.maelstromSpeedTimer--;
    if (window.playerStats.maelstromSpeedTimer <= 0) {
      window.playerStats.maelstromSpeedStacks = 0;
    }
  }
  if (window.playerStats.maelstromSpeedStacks > 0) {
    idleSpeedPct += window.playerStats.maelstromSpeedStacks * 0.1;
    activeSpeedPct += window.playerStats.maelstromSpeedStacks * 0.1;
  }

  let activeShardsList = window.activeRiftOrbs
    ? window.activeRiftOrbs.filter((orb) => orb.type === "anomalous_shard")
    : [];
  if (activeShardsList.length > 0) {
    activeSpeedPct -= activeShardsList.length * 0.1;
  }

  if (
    window.hasUniquePassive("tome_chronicle") &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    window.playerStats.bypassGearLockActive = true;
  } else {
    window.playerStats.bypassGearLockActive = false;
  }

  // Space Upgrades scaled with compounding milestones
  let globalLvl = window.playerStats.globalQLevel || 0;
  let effectiveGlobalLvl = globalLvl * window.getMilestoneMultiplier(globalLvl);
  p.drop += effectiveGlobalLvl * 0.01;
  p.qly += effectiveGlobalLvl * 0.01;

  let goldLvl = window.playerStats.prestigeUpgrades?.gold || 0;
  let prestigeGoldBonus =
    goldLvl * 0.25 * window.getMilestoneMultiplier(goldLvl);
  p.gold += prestigeGoldBonus;

  let dropLvl = window.playerStats.prestigeUpgrades?.drop || 0;
  let prestigeDropBonus =
    dropLvl * 0.05 * window.getMilestoneMultiplier(dropLvl);
  p.drop += prestigeDropBonus;

  let expLvl = window.playerStats.prestigeUpgrades?.exp || 0;
  let prestigeExpBonus = expLvl * 0.1 * window.getMilestoneMultiplier(expLvl);
  p.xpRate += prestigeExpBonus;

  let fairyLvl = window.playerStats.prestigeUpgrades?.fairy || 0;
  let prestigeFairyBonus =
    fairyLvl * 0.05 * window.getMilestoneMultiplier(fairyLvl);
  p.fairySpawn += prestigeFairyBonus;

  let missionGoldBonus = (window.playerStats.missionUpgrades?.gold || 0) * 0.05;
  p.gold += missionGoldBonus;

  if (window.playerStats.dropPotionTimer > 0) {
    p.drop += window.playerStats.dropPotionStrength || 1.0;
  }
  if (window.playerStats.qlyPotionTimer > 0) {
    p.qly += window.playerStats.qlyPotionStrength || 0.5;
  }

  let expBonusMult =
    1.0 + (window.playerStats.prestigeUpgrades?.exp || 0) * 0.1;

  let wisdom = Math.min(
    30,
    window.playerStats.clanSkills?.aetheric_wisdom || 0,
  );
  expBonusMult += wisdom * 0.01 + cardXpRate;

  if (
    window.hasUniquePassive("tome_chronicle") &&
    !window.playerStats.isDungeonMode &&
    !window.playerStats.isCrucibleMode
  ) {
    let historicalPeakLvl =
      window.playerStats.historicalPeakLvl || window.playerStats.level;
    if (window.playerStats.level < Math.floor(historicalPeakLvl * 0.75)) {
      expBonusMult += 2.0;
    }
  }
  if (window.playerStats.unlockedAchievements && window.AchievementsData) {
    window.playerStats.unlockedAchievements.forEach((id) => {
      let ach = window.AchievementsData.find((a) => a.id === id);
      if (ach && ach.stats && ach.stats.expPct) {
        expBonusMult += ach.stats.expPct;
      }
    });
  }
  let hasXpPot =
    (window.playerStats.xpPotionRuns || 0) > 0 ||
    (window.playerStats.xpPotionTimer || 0) > 0;
  if (hasXpPot) {
    let potStrengthMultiplier = 1.0;
    if (window.playerStats.unlockedAchievements && window.AchievementsData) {
      window.playerStats.unlockedAchievements.forEach((id) => {
        let ach = window.AchievementsData.find((a) => a.id === id);
        if (ach && ach.stats && ach.stats.potStrengthPct)
          potStrengthMultiplier += ach.stats.potStrengthPct;
      });
    }
    if (window.checkArtifactTrait("alchemist_alembic"))
      potStrengthMultiplier += 0.3;

    expBonusMult +=
      (window.playerStats.xpPotionStrength || 1.0) * potStrengthMultiplier;
  }
  p.xpRate = parseFloat(expBonusMult.toFixed(2));

  if (p.hasReflectKeystone) {
    let defVal = p.def.valueOf ? p.def.valueOf() : Number(p.def || 0);
    p.atk = p.atk.add(Math.round(defVal * 0.4));
  }
  if (p.hasAethericSingularity) {
    p.atk = p.atk.add(Math.round(p.int * 0.8));
  }

  let activeStage = window.playerStats.stage;
  if (window.playerStats.isDungeonMode && window.playerStats.currentDungeon) {
    activeStage =
      window.playerStats.currentDungeonStage[
        window.playerStats.currentDungeon
      ] || 1;
  } else if (window.playerStats.isUberBoss) {
    let riftLvl = window.playerStats.activeRiftLevel || 1;
    activeStage = 50 + riftLvl * 10;
  }
  let stageScale = Math.floor((activeStage - 1) / 10) + 1;

  let attkLvl = window.playerStats.prestigeUpgrades?.atk || 0;
  let effectiveAtkLvl = attkLvl * window.getMilestoneMultiplier(attkLvl);
  let prestigeAtkMult = Math.pow(1.12, effectiveAtkLvl);

  let fortLvl = window.playerStats.prestigeUpgrades?.fort || 0;
  let effectiveFortLvl = fortLvl * window.getMilestoneMultiplier(fortLvl);
  let prestigeHpMult = Math.pow(1.1, effectiveFortLvl);
  let prestigeDefMult = Math.pow(1.05, effectiveFortLvl);

  let missionAtkMult =
    1.0 + (window.playerStats.missionUpgrades?.atk || 0) * 0.02;
  let missionHpMult =
    1.0 + (window.playerStats.missionUpgrades?.hp || 0) * 0.03;

  p.atk = p.atk
    .mul(prestigeAtkMult)
    .mul(missionAtkMult)
    .mul(1.0 + (p.atkPct || 0));
  p.maxHp = p.maxHp
    .mul(prestigeHpMult)
    .mul(missionHpMult)
    .mul(1.0 + (p.maxHpPct || 0));

  // --- SUBPHASE 6: ABYSSAL DECAY SOUL SIPHON ---
  if (window.playerStats && window.playerStats.abyssalDecayAccumulated > 0) {
    p.maxHp = p.maxHp.sub(window.playerStats.abyssalDecayAccumulated);
    if (p.maxHp.lt(10)) p.maxHp = BigNum.from(10); // Enforce minimum boundary
  }
  // ---------------------------------------------

  p.def = p.def.mul(prestigeDefMult);

  // Apply Crucible Active Run Modifiers
  if (
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleActiveBuff
  ) {
    let b = window.playerStats.crucibleActiveBuff;
    let d =
      window.playerStats.purifiedAegisTimer > 0
        ? null
        : window.playerStats.crucibleActiveDebuff;
    let isBuffInfused = window.playerStats.crucibleInfusedType === "buff";
    let isDebuffInfused = window.playerStats.crucibleInfusedType === "debuff";

    let buffStrength = isBuffInfused ? 1.5 : 1.0;
    let debuffStrength = isDebuffInfused ? 1.5 : 1.0;

    if (b.id === "swift_strikes") {
      p.idleAttackSpeed = Math.max(
        10,
        Math.round(p.idleAttackSpeed / (1.0 + 0.25 * buffStrength)),
      );
      p.activeAttackSpeed = Math.max(
        4,
        Math.round(p.activeAttackSpeed / (1.0 + 0.25 * buffStrength)),
      );
    } else if (b.id === "giant_might") {
      p.atk = p.atk.mul(1.0 + 0.3 * buffStrength);
    } else if (b.id === "iron_aegis") {
      p.def = p.def.mul(1.0 + 0.35 * buffStrength);
    } else if (b.id === "vital_fountain") {
      p.maxHp = p.maxHp.mul(1.0 + 0.4 * buffStrength);
    } else if (b.id === "unstable_surge") {
      p.critChance += 0.15 * buffStrength;
    } else if (b.id === "shatter_frenzy") {
      p.critDamage += 0.5 * buffStrength;
    } else if (b.id === "deflection_vortex") {
      p.block += 0.1 * buffStrength;
      p.parry += 0.1 * buffStrength;
    } else if (b.id === "arcane_infusion") {
      p.arcaneBarrier = Math.min(0.5, p.arcaneBarrier + 0.15 * buffStrength);
    } else if (b.id === "treasure_finder") {
      p.gold += 0.5 * buffStrength;
    } else if (b.id === "lucky_winds") {
      p.fairySpawn += 0.4 * buffStrength;
    } else if (b.id === "void_call") {
      p.rareSpawn += 0.5 * buffStrength;
    } else if (b.id === "scavenger_insight") {
      p.drop += 0.5 * buffStrength;
    } else if (b.id === "artisan_luck") {
      p.qly += 0.25 * buffStrength;
    }

    if (d) {
      if (d.id === "iron_gaze") {
        p.idleAttackSpeed = Math.round(
          p.idleAttackSpeed * (1.0 + 0.2 * debuffStrength),
        );
      } else if (d.id === "shattered_armour") {
        p.def = p.def.mul(Math.max(0.1, 1.0 - 0.25 * debuffStrength));
      } else if (d.id === "frail_vessel") {
        p.maxHp = p.maxHp.mul(Math.max(0.1, 1.0 - 0.2 * debuffStrength));
      } else if (d.id === "dull_blades") {
        p.atk = p.atk.mul(Math.max(0.1, 1.0 - 0.2 * debuffStrength));
      } else if (d.id === "heavy_mist") {
        p.moveSpeed = Math.max(
          1.0,
          p.moveSpeed * Math.max(0.1, 1.0 - 0.3 * debuffStrength),
        );
      } else if (d.id === "blind_spot") {
        p.critChance = Math.max(0.0, p.critChance - 0.1 * debuffStrength);
      } else if (d.id === "feeble_mind") {
        p.arcaneBarrier = 0.0;
      } else if (d.id === "curse_greed") {
        p.gold = Math.max(0.1, p.gold - 0.4 * debuffStrength);
      } else if (d.id === "lead_boots") {
        p.block = Math.max(0.0, p.block - 0.08 * debuffStrength);
        p.parry = Math.max(0.0, p.parry - 0.08 * debuffStrength);
      }
    }
  }

  let phalanx = Math.min(50, window.playerStats.clanSkills?.steel_phalanx || 0);
  let well = Math.min(50, window.playerStats.clanSkills?.vitality_well || 0);
  let accord = Math.min(
    30,
    window.playerStats.clanSkills?.prosperity_accord || 0,
  );
  let guidance = Math.min(
    30,
    window.playerStats.clanSkills?.voyagers_guidance || 0,
  );

  p.atk = p.atk.mul(1.0 + phalanx * 0.005);
  p.def = p.def.mul(1.0 + phalanx * 0.005);
  p.maxHp = p.maxHp.mul(1.0 + well * 0.008);
  p.gold += accord * 0.01;
  p.drop += guidance * 0.005;
  p.qly += guidance * 0.005;

  if (
    isNaN(p.idleAttackSpeed) ||
    p.idleAttackSpeed <= 0 ||
    !isFinite(p.idleAttackSpeed)
  )
    p.idleAttackSpeed = 60;
  if (
    isNaN(p.activeAttackSpeed) ||
    p.activeAttackSpeed <= 0 ||
    !isFinite(p.activeAttackSpeed)
  )
    p.activeAttackSpeed = 15;

  let rawDropBonus = p.drop - 1.0;
  if (rawDropBonus > 1.0) {
    let softCapLimit = 4.0;
    p.drop =
      1.0 +
      1.0 +
      ((rawDropBonus - 1.0) * softCapLimit) /
        (rawDropBonus - 1.0 + softCapLimit);
  }

  let rawGoldBonus = p.gold - 1.0;
  if (rawGoldBonus > 4.0) {
    let softCapLimit = 12.0;
    p.gold =
      1.0 +
      4.0 +
      ((rawGoldBonus - 4.0) * softCapLimit) /
        (rawGoldBonus - 4.0 + softCapLimit);
  }

  let rawQlyBonus = p.qly - 1.0;
  if (rawQlyBonus > 2.0) {
    let softCapLimit = 3.0;
    p.qly =
      1.0 +
      2.0 +
      ((rawQlyBonus - 2.0) * softCapLimit) / (rawQlyBonus - 2.0 + softCapLimit);
  }

  window.playerStats.crucibleSelfDmgReduction = p.crucibleSelfDmgReduction;

  subItem = window.equippedSlots ? window.equippedSlots.subweapon : null;
  if (subItem) {
    p.subType = subItem.subType || subItem.type;
    p.subArchetype = subItem.subArchetype || null;
    if (
      p.subType === "tome" ||
      subItem.type === "tome" ||
      subItem.isUniqueWatch ||
      subItem.isUniqueChronicle ||
      subItem.isUniqueConduit
    ) {
      p.subType = "tome";
      p.spellType = subItem.spellType || "tri";
      p.spellChance =
        subItem.spellChance !== undefined ? subItem.spellChance : 0.33;
      p.spellPower = subItem.spellPower || 1.5;
    } else {
      p.spellType = subItem.spellType || null;
      p.spellChance = subItem.spellChance || 0;
      p.spellPower = subItem.spellPower || 1.0;
    }
    p.riposteDamage = subItem.riposteDamage || 0.8;
    p.bleedChance = subItem.bleedChance || 0;
    p.offhandChance = subItem.offhandChance || 0;
    p.offhandDmg = subItem.offhandDmg || 0.35;
    p.reflectDamage = subItem.reflectDamage || 1.0;
    p.bashAtkBonus = subItem.bashAtkBonus || 0;
    p.parryMitigation = subItem.parryMitigation || 0.6;
    p.blockCapBonus = subItem.blockCapBonus || 0;
    p.parryCapBonus = subItem.parryCapBonus || 0;
  } else {
    p.subType = null;
    p.spellType = null;
    p.spellChance = 0;
    p.spellPower = 1.0;
    p.riposteDamage = 0.8;
    p.bleedChance = 0;
    p.offhandChance = 0;
    p.offhandDmg = 0.35;
    p.reflectDamage = 0.4;
  }

  // --- SUBPHASE 3: SPECIAL CAVERN SIGIL MUTATORS PIPELINE ---
  let subItemRef = window.equippedSlots ? window.equippedSlots.subweapon : null;
  let hasShieldRef =
    subItemRef &&
    (subItemRef.subType === "shield" || subItemRef.type === "shield");
  let hasDaggerRef =
    subItemRef &&
    (subItemRef.subType === "dagger" || subItemRef.type === "dagger");
  let hasTitanGripRef =
    window.checkArtifactTrait && window.checkArtifactTrait("titan_grip");

  if (window.isCavernEffectActive("aetheric_surge")) {
    if (p.subType === "tome") {
      p.spellPower = (p.spellPower || 1.5) * 1.75;
      p.spellChance = (p.spellChance || 0.33) + 0.2;
    } else if (p.subType === "shield") {
      p.reflectDamage = (p.reflectDamage || 1.0) * 2.0;
      p.bashAtkBonus = (p.bashAtkBonus || 0) * 2.0;
      p.blockCapBonus = (p.blockCapBonus || 0) + 0.15;

      let maxBlockCap = hasTitanGripRef ? 0.25 : 0.2;
      maxBlockCap += (p.blockCapBonus || 0) + (p.crucibleCapBonus || 0);
      p.rawBlock = p.rawBlock !== undefined ? p.rawBlock : p.block;
      p.block = p.rawBlock > maxBlockCap ? maxBlockCap : p.rawBlock;
    } else if (p.subType === "dagger") {
      p.riposteDamage = (p.riposteDamage || 0.8) * 3.0;
      p.parryCapBonus = (p.parryCapBonus || 0) + 0.15;

      let maxParryCap = 0.15;
      let noun = subItemRef
        ? subItemRef.noun
          ? subItemRef.noun.toLowerCase()
          : ""
        : "";
      if (noun.includes("main-gauche")) {
        maxParryCap = hasTitanGripRef ? 0.35 : 0.3;
      } else {
        maxParryCap = hasTitanGripRef ? 0.3 : 0.15;
      }
      maxParryCap += (p.parryCapBonus || 0) + (p.crucibleCapBonus || 0);
      p.rawParry = p.rawParry !== undefined ? p.rawParry : p.parry;
      p.parry = p.rawParry > maxParryCap ? maxParryCap : p.rawParry;
    }
  }

  if (window.isCavernEffectActive("weapon_lock")) {
    p.atk = BigNum.from(1);

    p.spellChance = (p.spellChance || 0) * 2.0;
    p.offhandChance = (p.offhandChance || 0) * 2.0;
    p.block = (p.block || 0) * 2.0;
    p.parry = (p.parry || 0) * 2.0;

    if (hasShieldRef) {
      let maxBlockCap = hasTitanGripRef ? 0.25 : 0.2;
      maxBlockCap += (p.blockCapBonus || 0) + (p.crucibleCapBonus || 0);
      let doubledCap = maxBlockCap * 2.0;
      if (p.block > doubledCap) p.block = doubledCap;
    }
    if (hasDaggerRef) {
      let maxParryCap = 0.15;
      let noun = subItemRef
        ? subItemRef.noun
          ? subItemRef.noun.toLowerCase()
          : ""
        : "";
      if (noun.includes("main-gauche")) {
        maxParryCap = hasTitanGripRef ? 0.35 : 0.3;
      } else {
        maxParryCap = hasTitanGripRef ? 0.3 : 0.15;
      }
      maxParryCap += (p.parryCapBonus || 0) + (p.crucibleCapBonus || 0);
      let doubledCap = maxParryCap * 2.0;
      if (p.parry > doubledCap) p.parry = doubledCap;
    }

    p.activeAttackSpeed = Math.max(2, Math.round(p.activeAttackSpeed / 2.0));
    p.idleAttackSpeed = Math.max(5, Math.round(p.idleAttackSpeed / 2.0));
  }
  // ----------------------------------------------------------

  // --- PHASE 3 ACTIVE ARTIFACT MODIFIERS RESOLUTION ---
  if (window.playerStats) {
    let floorActiveTicks = window.playerStats.floorActiveTicks || 0;

    // 1. Breacher's Adrenaline Glass
    if (window.checkArtifactTrait("breach_adrenaline")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("breach_adrenaline")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      let decayRatio = Math.max(0, 1.0 - floorActiveTicks / 1800); // Linear decay over 30s
      if (decayRatio > 0) {
        p.moveSpeed *= 1.0 + 0.4 * decayRatio * slotMult;
        p.critChance += 0.25 * decayRatio * slotMult;
      }
    }

    // 2. Scout's Cartographic Compass
    if (window.checkArtifactTrait("breach_scouting")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("breach_scouting")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      if (floorActiveTicks < 900) {
        // Active during the first 15s
        p.drop += 0.5 * slotMult;
      }
    }

    // 3. Kinetic Friction Turbine (Attack power scaling)
    if (window.checkArtifactTrait("friction_kinetic")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("friction_kinetic")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      let charges = window.playerStats.kineticFrictionCharges || 0;
      if (charges > 0) {
        p.atk = p.atk.mul(1.0 + 0.005 * charges * slotMult);
      }
    }

    // 4. Obsidian Core of Tenacity
    if (window.checkArtifactTrait("friction_tenacity")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("friction_tenacity")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      let stacks = window.playerStats.tenacityStacks || 0;
      if (stacks > 0) {
        p.def = p.def.mul(1.0 + 0.02 * stacks * slotMult);
        p.blockMitigationBonus =
          (p.blockMitigationBonus || 0) + 0.015 * stacks * slotMult;
        p.parryMitigation =
          (p.parryMitigation || 0.6) + 0.015 * stacks * slotMult;
      }
    }

    // 5. Void Accretion Engine (+3% damage every 10s, max 30%)
    if (window.checkArtifactTrait("friction_accretion")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("friction_accretion")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      let accretionStacks = Math.min(10, Math.floor(floorActiveTicks / 600));
      if (accretionStacks > 0) {
        p.atk = p.atk.mul(1.0 + 0.03 * accretionStacks * slotMult);
      }
    }

    // 6. Nexus Harmonizer (Temporary block/parry tome buff)
    if (window.checkArtifactTrait("synergy_nexus")) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("synergy_nexus")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      if (window.playerStats.nexusTomeShieldTimer > 0) {
        p.block += 0.05 * slotMult;
        p.parry += 0.05 * slotMult;
      }
    }
  }

  if (!useDraft) {
    window.cachedPlayerStats = p;
    window.playerStatsDirty = false;
  }

  return p;
};

// --- REAL-TIME COMBAT DAMAGE RESOLUTION PIPELINE ---
window.damagePlayer = function (rawDmg, sourceMob = null) {
  let p = window.player;
  if (!p || p.hp <= 0) return 0;

  // Transition into active combat state
  if (typeof window.triggerCombatState === "function") {
    window.triggerCombatState();
  }

  // Aegis Infiltration Glyph overshield (Absorbs 100% Max HP, decays 5% Max HP/sec)
  if (window.checkArtifactTrait("breach_barrier")) {
    let floorActiveTicks =
      (window.playerStats && window.playerStats.floorActiveTicks) || 0;
    let decayRatio = Math.max(0, 1.0 - floorActiveTicks / 1200);
    if (decayRatio > 0) {
      let slotLvl = window.getArtifactTemperLevel
        ? window.getArtifactTemperLevel("breach_barrier")
        : 0;
      let slotMult = 1.0 + slotLvl * 0.01;
      let maxHpVal =
        p.maxHp && p.maxHp.valueOf ? p.maxHp.valueOf() : Number(p.maxHp || 100);
      window.playerStats.overshieldConsumed =
        window.playerStats.overshieldConsumed || 0;
      let maxOvershield = maxHpVal * slotMult;
      let currentOvershield = Math.max(
        0,
        maxOvershield * decayRatio - window.playerStats.overshieldConsumed,
      );
      if (currentOvershield > 0) {
        let absorbedByOvershield = Math.min(rawDmg, currentOvershield);
        rawDmg -= absorbedByOvershield;
        window.playerStats.overshieldConsumed += absorbedByOvershield;
        if (window.spawnFloatingText) {
          window.spawnFloatingText(
            p.x,
            p.y - 20,
            `[OVERSHIELD] -${Math.round(absorbedByOvershield)}`,
            "#34d399",
          );
        }
        if (rawDmg <= 0) return 0;
      }
    }
  }

  let pStats =
      typeof window.resolvePlayerStats === "function"
        ? window.resolvePlayerStats()
        : {};

    let isBoss = sourceMob && (
      sourceMob.type === "dungeon_boss" ||
      sourceMob.type === "dungeon_miniboss" ||
      sourceMob.isBoss ||
      sourceMob.type === "marcus_boss"
    );

    let activeParry = pStats.parry || 0;
    let activeBlock = pStats.block || 0;

    // Safeguard 1: Crushing Blows (Boss Guard Penetration)
    if (isBoss) {
      let pen = 1.0 - (window.BOSS_GUARD_PENETRATION || 0.35);
      activeParry *= pen;
      activeBlock *= pen;
    }

    // Safeguard 2: Deflection Fatigue (Halves active rates if active)
    if (window.playerStats && window.playerStats.deflectionFatigueTimer > 0) {
      activeParry *= 0.5;
      activeBlock *= 0.5;
    }

    // Intercept Specter Doom Instant-Kill Strike
  if (rawDmg instanceof BigNum && rawDmg.e > 100) {
    p.hp = 0;
    window.spawnFloatingText(
      p.x,
      p.y - 15,
      `-${window.formatNumber(rawDmg)}`,
      "#e74c3c",
    );
    if (sourceMob) {
      window.playerStats.killedByMob = { ...sourceMob };
      window.playerStats.killedBy = sourceMob.name || "Calamity Specter";
    } else {
      window.playerStats.killedByMob = null;
      window.playerStats.killedBy = "Calamity Specter";
    }
    window.playerStats.deathCount = (window.playerStats.deathCount || 0) + 1;
    if (typeof window.startDeathSequence === "function") {
      window.startDeathSequence();
    }
    return 0;
  }

  // Step 1: Arcane Barrier Absorption (Tomes)
  let absorbed = 0;
  if (pStats.arcaneBarrier && pStats.arcaneBarrier > 0) {
    absorbed = Math.floor(rawDmg * pStats.arcaneBarrier);
    if (absorbed > 0) {
      // Gain +10 Tome Mastery XP on Arcane Barrier Absorption
      if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 10);

      // Barrier Shatter accumulated charge check
      if (pStats.hasBarrierShatter) {
        window.playerStats.barrierAbsorbedDmg =
          (window.playerStats.barrierAbsorbedDmg || 0) + absorbed;
        if (window.playerStats.barrierAbsorbedDmg >= p.maxHp) {
          window.playerStats.barrierAbsorbedDmg = 0; // consume
          let intVal = pStats.int || 5;
          let shatterDmg = BigNum.from(intVal).mul(2.5);
          if (window.activeDungeonMobs) {
            window.activeDungeonMobs.forEach((otherMob) => {
              if (
                Math.hypot(
                  p.x - (otherMob.x + otherMob.w / 2),
                  p.y - (otherMob.y + otherMob.h / 2),
                ) <= 100
              ) {
                otherMob.hp = otherMob.hp.sub(shatterDmg);
                otherMob.flashTimer = 8;
                if (window.combatVisuals) {
                  window.combatVisuals.spawnDamageEffect(
                    otherMob.x + otherMob.w / 2,
                    otherMob.y + otherMob.h / 2,
                    shatterDmg,
                    "crit",
                    false,
                  );
                }
              }
            });
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(p.x, p.y, 25, "void_orb", 5);
            window.combatVisuals.triggerScreenShake(6, 12);
          }
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(
              p.x,
              p.y - 25,
              "BARRIER SHATTER DETONATION!",
              "#9b59b6",
              true,
            );
          }
        }
      }

      if (window.SoundManager) window.SoundManager.play("spell");
      if (window.combatVisuals) {
        window.combatVisuals.spawnParticles(p.x, p.y - 12, 10, "void_orb", 2.5);
      }
      if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
        window.RenderEngine.spawnDamageEffect(
          p.x,
          p.y - 22,
          absorbed,
          "barrier",
          false,
        );
      }
    }
  }

  let remainingDmg = Math.max(1, rawDmg - absorbed);

  // Soft-capped asymptotic damage reduction based on Defense to prevent 1-damage trivialization exploits
  let currentFloor = window.player ? window.player.depth || 1 : 1;
  let defenseConstant = 15 + currentFloor * 5;
  let defenseDR = (pStats.def || 0) / ((pStats.def || 0) + defenseConstant);
  defenseDR = Math.min(0.85, defenseDR); // Cap armor damage reduction at 85% maximum
  let netDmg = Math.max(1, remainingDmg * (1 - defenseDR));

  // Step 2: Parry Check (Daggers)
    if (activeParry > 0 && Math.random() < activeParry) {
      // Reset Deflection Fatigue Timer
      if (window.playerStats) {
        window.playerStats.deflectionFatigueTimer = window.DEFLECTION_FATIGUE_FRAMES || 30;
      }
    if (window.checkArtifactTrait && window.checkArtifactTrait("dodge_buff")) {
      window.playerStats.adrenalineTimer = 360;
    }

    // Gain +10 Dagger Mastery XP on Parry
    if (window.gainSubweaponXp) window.gainSubweaponXp("dagger", 10);

    if (typeof window.progressMission === "function") {
      window.progressMission("deflections", 1);
    }

    let parryMitigation = pStats.hasMasterDuellist
          ? 1.0
          : pStats.parryMitigation || 0.6;

        // Boss Guard Penetration seeps a fraction of the damage through your mitigation
        if (isBoss) {
          parryMitigation *= (1.0 - (window.BOSS_GUARD_PENETRATION || 0.35));
        }

        let parriedDmg = Math.max(0, Math.round(netDmg * (1.0 - parryMitigation)));
    p.hp = Math.max(0, p.hp - parriedDmg);

    if (
      parriedDmg > 0 &&
      window.isCavernEffectActive &&
      window.isCavernEffectActive("abyssal_decay")
    ) {
      let decay = Math.round(parriedDmg * 0.15);
      if (decay > 0) {
        window.playerStats.abyssalDecayAccumulated =
          (window.playerStats.abyssalDecayAccumulated || 0) + decay;
        window.invalidatePlayerStats();
        let pStatsLocal = window.resolvePlayerStats();
        p.maxHp = Math.round(
          pStatsLocal.maxHp.valueOf
            ? pStatsLocal.maxHp.valueOf()
            : Number(pStatsLocal.maxHp || 100),
        );
        p.hp = Math.min(p.hp, p.maxHp);
        window.playerStats.currentHp = BigNum.from(p.hp);
        window.spawnFloatingText(
          p.x,
          p.y - 28,
          "MAX HP DECAYED -" + decay,
          "#8e44ad",
          true,
        );
      }
    }

    p.lastDamageTimer = 180;
    window.playerStats.totalDeflections =
      (window.playerStats.totalDeflections || 0) + 1;

    // Nexus Harmonizer: Dagger parries reset Field Flask cooldown
    if (
      window.checkArtifactTrait("synergy_nexus") &&
      pStats.subType === "dagger" &&
      window.playerStats
    ) {
      window.playerStats.flaskCooldownTimer = 0;
      if (window.spawnFloatingText) {
        window.spawnFloatingText(
          p.x,
          p.y - 20,
          "FLASK COOLDOWN RESET!",
          "#34d399",
        );
      }
    }

    if (pStats.hasMasterDuellist) {
      window.playerStats.shadowDecoyTimer = 240; // Spawn Shadow Decoy (4 seconds)
      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 25,
          "SHADOW DECOY SUMMONED!",
          "#a855f7",
        );
      }
    }

    if (window.SoundManager) window.SoundManager.play("parry");
    if (window.combatVisuals)
      window.combatVisuals.spawnDamageEffect(
        p.x,
        p.y - 15,
        parriedDmg,
        "parry",
        false,
        p,
      );

    if (pStats.hasShadowStep) {
          window.playerStats.shadowStepTimer = 240; // Shadow Step speed burst active
        }

        // Safeguard 3: Counter-Attack Internal Cooldown
            let canCounter = !(isBoss && window.playerStats.counterCooldownTimer > 0);

            if (canCounter && sourceMob && sourceMob.hp && sourceMob.hp.gt && sourceMob.hp.gt(0)) {
              if (isBoss && window.playerStats) {
                window.playerStats.counterCooldownTimer = window.COUNTER_COOLDOWN_FRAMES || 60;
              }
      let mobCx = sourceMob.x + (sourceMob.w || 24) / 2;
      let mobCy = sourceMob.y + (sourceMob.h || 24) / 2;

      // Apply Directional Riposte Recoil Impulse
      let rDx = mobCx - p.x;
      let rDy = mobCy - p.y;
      let rDist = Math.hypot(rDx, rDy);
      if (rDist > 0) {
        sourceMob.recoilX = (rDx / rDist) * 8;
        sourceMob.recoilY = (rDy / rDist) * 8;
      }

      // Sanguine Rupture DoT explosion detonation on parry
      if (
        pStats.hasSanguineRupture &&
        ((sourceMob.bleedStacks || 0) > 0 || (sourceMob.poisonStacks || 0) > 0)
      ) {
        let dotCount =
          (sourceMob.bleedStacks || 0) + (sourceMob.poisonStacks || 0);
        let detonationDmg = BigNum.from(pStats.atk || 15)
          .mul(dotCount)
          .mul(pStats.sanguineRuptureMult || 1.5);
        sourceMob.hp = sourceMob.hp.sub(detonationDmg);
        sourceMob.bleedStacks = 0; // consume
        sourceMob.poisonStacks = 0; // consume
        sourceMob.flashTimer = 8;

        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            mobCx,
            mobCy - 15,
            "SANGUINE RUPTURE DETONATION!",
            "#e74c3c",
          );
        }

        if (window.combatVisuals) {
          window.combatVisuals.spawnDamageEffect(
            mobCx,
            mobCy,
            detonationDmg,
            "crit",
            true,
            sourceMob,
          );
          window.combatVisuals.spawnParticles(
            mobCx,
            mobCy,
            20,
            "magma_elemental",
            4,
          );
        }
        if (
          window.SoundManager &&
          typeof window.SoundManager.play === "function"
        ) {
          window.SoundManager.play("spell_fire");
        }
      }

      let riposteDmg = BigNum.from(pStats.atk || 15).mul(
        pStats.riposteDamage || 0.8,
      );
      sourceMob.hp = sourceMob.hp.sub(riposteDmg);
      sourceMob.flashTimer = 6;

      if (window.combatVisuals) {
        window.combatVisuals.spawnDamageEffect(
          mobCx,
          mobCy,
          riposteDmg,
          "parry_counter",
          false,
          sourceMob,
        );
      }

      // Dagger Keystone: Viper's Shadow Dance (100% Crit Charges & Bleed Stacks on Parry)
      if (
        window.SkillTreeManager &&
        window.SkillTreeManager.getSkillLevel("dagger_keystone") > 0
      ) {
        window.playerStats.viperShadowDanceCharges = 2;
        let bleedTick = BigNum.from(pStats.atk || 15).mul(0.5);
        sourceMob.hp = sourceMob.hp.sub(bleedTick);
        sourceMob.flashTimer = 8;
        if (window.combatVisuals) {
          window.combatVisuals.spawnDamageEffect(
            mobCx,
            mobCy - 10,
            bleedTick,
            "bleed",
            false,
          );
        }
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 25,
            "VIPER'S SHADOW DANCE (100% CRIT)",
            "#a855f7",
          );
        }
      }
      if (sourceMob.hp.lte(0)) {
        let rewardGold = Math.floor(
          15 * (1 + (window.player ? window.player.depth : 1) * 0.5),
        );
        let rewardXp = Math.floor(
          15 + (window.player ? window.player.depth : 1) * 4,
        );
        window.spawnHomingGold(mobCx, mobCy, rewardGold);
        window.spawnHomingXp(mobCx, mobCy, rewardXp);
      }
    }
    if (typeof window.updateHUD === "function") window.updateHUD();
    return parriedDmg;
  }

  // Step 3: Block Check (Shields)
    if (activeBlock > 0 && Math.random() < activeBlock) {
      // Reset Deflection Fatigue Timer
      if (window.playerStats) {
        window.playerStats.deflectionFatigueTimer = window.DEFLECTION_FATIGUE_FRAMES || 30;
      }
    if (window.checkArtifactTrait && window.checkArtifactTrait("dodge_buff")) {
      window.playerStats.adrenalineTimer = 360;
    }

    // Gain +16 Shield Mastery XP on Block
    if (window.gainSubweaponXp) window.gainSubweaponXp("shield", 16);

    if (typeof window.progressMission === "function") {
      window.progressMission("deflections", 1);
    }

    // Fortitude stack acquisition on block / damage
    if (pStats.fortifiedGuardMultiplier > 0) {
      let prevStacks = window.playerStats.fortitudeStacks || 0;
      window.playerStats.fortitudeStacks = Math.min(5, prevStacks + 1);
      window.playerStats.fortitudeTimer = 360; // 6 seconds

      if (
        window.playerStats.fortitudeStacks > prevStacks &&
        typeof window.spawnFloatingText === "function"
      ) {
        window.spawnFloatingText(
          p.x,
          p.y - 20,
          `FORTITUDE (${window.playerStats.fortitudeStacks}/5)`,
          "#38bdf8",
          true,
        );
      }
    }

    window.playerStats.recentBlockTime = Date.now();
    p.lastDamageTimer = 180;
    window.playerStats.totalDeflections =
      (window.playerStats.totalDeflections || 0) + 1;

    if (window.SoundManager) window.SoundManager.play("block");

    let baseMitigation = 0.7 + (pStats.blockMitigationBonus || 0); // Applies restored Fortified Stance 10%-30% block mitigation bonus
        let blockMitigation = pStats.hasColossusKeystone
          ? 1.0
          : Math.min(0.95, baseMitigation);

        // Boss Guard Penetration seeps a fraction of the damage through your mitigation
        if (isBoss) {
          blockMitigation *= (1.0 - (window.BOSS_GUARD_PENETRATION || 0.35));
        }

        let blockedDmg = Math.max(0, Math.round(netDmg * (1.0 - blockMitigation)));
    let savings = netDmg - blockedDmg;
    p.hp = Math.max(0, p.hp - blockedDmg);

    if (
      blockedDmg > 0 &&
      window.isCavernEffectActive &&
      window.isCavernEffectActive("abyssal_decay")
    ) {
      let decay = Math.round(blockedDmg * 0.15);
      if (decay > 0) {
        window.playerStats.abyssalDecayAccumulated =
          (window.playerStats.abyssalDecayAccumulated || 0) + decay;
        window.invalidatePlayerStats();
        let pStatsLocal = window.resolvePlayerStats();
        p.maxHp = Math.round(
          pStatsLocal.maxHp.valueOf
            ? pStatsLocal.maxHp.valueOf()
            : Number(pStatsLocal.maxHp || 100),
        );
        p.hp = Math.min(p.hp, p.maxHp);
        window.playerStats.currentHp = BigNum.from(p.hp);
        window.spawnFloatingText(
          p.x,
          p.y - 28,
          "MAX HP DECAYED -" + decay,
          "#8e44ad",
          true,
        );
      }
    }

    if (pStats.hasColossusKeystone && savings > 0) {
      window.playerStats.colossusApBonus =
        (window.playerStats.colossusApBonus || 0) + Math.round(savings * 0.1);
      window.playerStats.colossusApTimer = 600; // 10s at 60 FPS
    }

    if (pStats.hasAegisPulse) {
      window.playerStats.aegisPulseCount =
        (window.playerStats.aegisPulseCount || 0) + 1;
      if (window.playerStats.aegisPulseCount >= 5) {
        window.playerStats.aegisPulseCount = 0;
        let healAmt = Math.round(p.maxHp * pStats.aegisPulseHeal);
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(
            p.x,
            p.y - 20,
            `+${healAmt} HP (AEGIS PULSE)`,
            "#2ecc71",
            true,
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnParticles(p.x, p.y, 15, "slag_slime", 3);
        }
      }
    }

    if (pStats.hasRetaliatoryStrike) {
          window.playerStats.retaliatoryStrikeActive = true;
        }

        // Safeguard 3: Counter-Attack Internal Cooldown
            let canCounter = !(isBoss && window.playerStats.counterCooldownTimer > 0);

            if (canCounter && pStats.hasImpactTremor && Math.random() < pStats.impactTremorChance) {
              if (isBoss && window.playerStats) {
                window.playerStats.counterCooldownTimer = window.COUNTER_COOLDOWN_FRAMES || 60;
              }
      let shockwaveDmg = BigNum.from(pStats.def || 5).mul(1.2);
      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          let dist = Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2));
          if (dist <= 75) {
            m.hp = m.hp.sub(shockwaveDmg);
            m.flashTimer = 8;
            let dx = m.x + m.w / 2 - p.x;
            let dy = m.y + m.h / 2 - p.y;
            let dDist = Math.hypot(dx, dy);
            if (dDist > 0) {
              m.recoilX = (dx / dDist) * 12;
              m.recoilY = (dy / dDist) * 12;
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                m.x + m.w / 2,
                m.y + m.h / 2,
                shockwaveDmg,
                "counter",
                false,
              );
            }
          }
        });
      }
      if (window.combatVisuals) {
        window.combatVisuals.spawnParticles(p.x, p.y, 15, "animated_armor", 3);
        window.combatVisuals.triggerScreenShake(4, 8);
      }
    }

    if (window.combatVisuals)
          window.combatVisuals.spawnDamageEffect(
            p.x,
            p.y - 15,
            blockedDmg,
            "block",
            false,
            p,
          );

        // Safeguard 3: Counter-Attack Internal Cooldown
            let canCounterShield = !(isBoss && window.playerStats.counterCooldownTimer > 0);

            if (canCounterShield && sourceMob && sourceMob.hp && sourceMob.hp.gt && sourceMob.hp.gt(0)) {
              if (isBoss && window.playerStats) {
                window.playerStats.counterCooldownTimer = window.COUNTER_COOLDOWN_FRAMES || 60;
              }
      // Gain +10 Shield Mastery XP on Shield Bash reflect
      if (window.gainSubweaponXp) window.gainSubweaponXp("shield", 10);

      // Nexus Harmonizer: Shields have 20% cast-on-block spell chance
      if (
        window.checkArtifactTrait("synergy_nexus") &&
        pStats.subType === "shield" &&
        Math.random() < 0.2
      ) {
        let spellDmg = BigNum.from(pStats.atk || 15)
          .mul(pStats.spellPower || 1.5)
          .mul(0.5);
        sourceMob.hp = sourceMob.hp.sub(spellDmg);
        sourceMob.flashTimer = 8;
        let spellType = pStats.spellType || "tri";
        if (spellType === "tri")
          spellType = ["fire", "lightning", "frost"][
            Math.floor(Math.random() * 3)
          ];
        if (window.castVisualSpell) {
          window.castVisualSpell(
            spellType,
            p,
            sourceMob,
            pStats,
            pStats.hasElementalOverload,
          );
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnDamageEffect(
            sourceMob.x + sourceMob.w / 2,
            sourceMob.y + sourceMob.h / 2,
            spellDmg,
            "spell_" + spellType,
            false,
            sourceMob,
          );
        }
      }

      let defBash = BigNum.from(pStats.def || 5).mul(
        pStats.reflectDamage || 1.0,
      );
      let atkBash = BigNum.from(pStats.atk || 15).mul(pStats.bashAtkBonus || 0);
      let reflectDmg = defBash.add(atkBash);

      if (reflectDmg.gt(0)) {
        sourceMob.hp = sourceMob.hp.sub(reflectDmg);
        sourceMob.flashTimer = 6;

        // Apply Bulwark Stagger / Knockback impulse to the attacking monster
        let mCx = sourceMob.x + (sourceMob.w || 24) / 2;
        let mCy = sourceMob.y + (sourceMob.h || 24) / 2;
        let bDx = mCx - p.x;
        let bDy = mCy - p.y;
        let bDist = Math.hypot(bDx, bDy);
        if (bDist > 0) {
          sourceMob.recoilX = (bDx / bDist) * 12;
          sourceMob.recoilY = (bDy / bDist) * 12;
        }

        if (window.combatVisuals) {
          window.combatVisuals.spawnDamageEffect(
            mCx,
            mCy,
            reflectDmg,
            "counter",
            false,
            sourceMob,
          );
        }
      }
    }

    // Shield Keystone: Unbreakable Bulwark AoE Shockwave on Block (Respects Safeguard 3 ICD)
        if (
          canCounterShield &&
          window.SkillTreeManager &&
          window.SkillTreeManager.getSkillLevel("shield_keystone") > 0
        ) {
      let shockwaveDmg = BigNum.from(pStats.def || 5).mul(1.5);
      if (window.activeDungeonMobs) {
        window.activeDungeonMobs.forEach((m) => {
          let dist = Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2));
          if (dist <= 64) {
            m.hp = m.hp.sub(shockwaveDmg);
            m.flashTimer = 8;
            if (window.combatVisuals) {
              window.combatVisuals.spawnDamageEffect(
                m.x + m.w / 2,
                m.y + m.h / 2,
                shockwaveDmg,
                "counter",
                false,
              );
            }
          }
        });
      }
      if (window.combatVisuals) {
        window.combatVisuals.spawnParticles(p.x, p.y, 18, "animated_armor", 4);
        window.combatVisuals.triggerScreenShake(6, 10);
      }
    }

    if (typeof window.updateHUD === "function") window.updateHUD();
    return 0;
  }

  // Step 4: Unmitigated Damage Hit
  let finalDmg = Math.max(1, Math.round(netDmg));
  p.hp = Math.max(0, p.hp - finalDmg);

  if (
    window.isCavernEffectActive &&
    window.isCavernEffectActive("abyssal_decay")
  ) {
    let decay = Math.round(finalDmg * 0.15);
    if (decay > 0) {
      window.playerStats.abyssalDecayAccumulated =
        (window.playerStats.abyssalDecayAccumulated || 0) + decay;
      window.invalidatePlayerStats();
      let pStatsLocal = window.resolvePlayerStats();
      p.maxHp = Math.round(
        pStatsLocal.maxHp.valueOf
          ? pStatsLocal.maxHp.valueOf()
          : Number(pStatsLocal.maxHp || 100),
      );
      p.hp = Math.min(p.hp, p.maxHp);
      window.playerStats.currentHp = BigNum.from(p.hp);
      window.spawnFloatingText(
        p.x,
        p.y - 28,
        "MAX HP DECAYED -" + decay,
        "#8e44ad",
        true,
      );
    }
  }

  p.lastDamageTimer = 180;
  window.spawnFloatingText(p.x, p.y - 15, `-${finalDmg}`, "#e74c3c");

  // Crown of Tempests Thunderbolt Counter
  if (
    window.hasUniquePassive &&
    window.hasUniquePassive("helmet_tempest") &&
    Math.random() < 0.15 &&
    sourceMob &&
    sourceMob.hp
  ) {
    let boltDmg = BigNum.from(pStats.atk || 15).mul(1.5);
    sourceMob.hp = sourceMob.hp.sub(boltDmg);
    sourceMob.flashTimer = 8;
    sourceMob.attackCooldown = 90;
    let mobCx = sourceMob.x + (sourceMob.w || 24) / 2;
    let mobCy = sourceMob.y + (sourceMob.h || 24) / 2;

    if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
      window.RenderEngine.spawnDamageEffect(
        mobCx,
        mobCy,
        boltDmg,
        "lightning",
        true,
      );
    }
    if (window.combatVisuals) {
      window.combatVisuals.spawnBeam(mobCx, "#00d2ff", 30, false);
      window.combatVisuals.triggerScreenShake(4, 8);
    }
    if (window.SoundManager) window.SoundManager.play("spell_lightning");
  }

  if (p.hp <= 0) {
    // Phoenix Ankh Second Wind Interceptor
    if (
      window.checkArtifactTrait &&
      window.checkArtifactTrait("second_wind") &&
      !window.playerStats.usedSecondWind
    ) {
      window.playerStats.usedSecondWind = true;
      p.hp = Math.round(p.maxHp * 0.4);
      if (typeof window.spawnFloatingText === "function") {
        window.spawnFloatingText(
          p.x,
          p.y - 30,
          "SECOND WIND (ANKH REVIVE)",
          "#ff7675",
          true,
        );
      }
      if (window.combatVisuals) {
        window.combatVisuals.spawnBeam(p.x, "#ff7675", 60, true);
        window.combatVisuals.spawnParticles(
          p.x,
          p.y - 10,
          30,
          "gold_dungeon",
          4,
        );
      }
      if (window.SoundManager) window.SoundManager.play("revive");
      if (typeof window.updateHUD === "function") window.updateHUD();
      return 0;
    }

    if (sourceMob) {
      window.playerStats.killedByMob = { ...sourceMob };
      window.playerStats.killedBy = sourceMob.name || "Dungeon Monster";
    } else {
      window.playerStats.killedByMob = null;
      window.playerStats.killedBy = "Environmental Hazard";
    }
    window.playerStats.deathCount = (window.playerStats.deathCount || 0) + 1;
    if (typeof window.startDeathSequence === "function") {
      window.startDeathSequence();
    }
  }

  if (window.SoundManager) window.SoundManager.play("hit");
  if (typeof window.updateHUD === "function") window.updateHUD();

  return finalDmg;
};

// --- INITIAL GLOBAL STATE ---

window.CRUCIBLE_DRAFT_POOL = [
  // --- STANDARD UPGRADES (Infinite Stacking) ---
  {
    id: "steel_resolve",
    name: "Steel Resolve",
    desc: "Permanently fortifies your physical armor, adding +15% to your Defense.",
    apply: (p) => {
      p.defPctBonus = (p.defPctBonus || 0) + 0.15;
    },
    modifiersDisplay: { buff: "15% Defense" },
  },
  {
    id: "sharpened_edge",
    name: "Sharpened Edge",
    desc: "Sharpens weapon precision, adding +15% to your Attack Power.",
    apply: (p) => {
      p.atkPctBonus = (p.atkPctBonus || 0) + 0.15;
    },
    modifiersDisplay: { buff: "15% Attack" },
  },
  {
    id: "hearty_const",
    name: "Hearty Constitution",
    desc: "Increases structural stamina, adding +15% to your Maximum HP.",
    apply: (p) => {
      p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.15;
    },
    modifiersDisplay: { buff: "15% Max HP" },
  },
  {
    id: "swift_foot",
    name: "Swift Footwork",
    desc: "Increases Movement Speed by +10% and adds +3% base Parry Rate.",
    apply: (p) => {
      p.moveSpeedPctBonus = (p.moveSpeedPctBonus || 0) + 0.1;
      p.parry = (p.parry || 0) + 0.03;
    },
    modifiersDisplay: { buff: "10% Speed / 3% Parry" },
  },
  {
    id: "astral_attune",
    name: "Astral Attunement",
    desc: "Attunes your matrix, gaining +25% bonus Astral Shards on wave clears.",
    apply: (p) => {
      p.crucibleShardMult = (p.crucibleShardMult || 1.0) + 0.25;
    },
    modifiersDisplay: { buff: "25% Shards" },
  },

  // --- CORRUPTED UPGRADES (Max 3 Stacks, High-Risk / High-Return) ---
  {
    id: "glass_cannon",
    name: "Glass Cannon",
    desc: "Increases Attack Power by +45%, but slashes your Max HP by -15%.",
    isCorrupted: true,
    apply: (p) => {
      p.atkPctBonus = (p.atkPctBonus || 0) + 0.45;
      p.maxHpPctBonus = (p.maxHpPctBonus || 0) - 0.15;
    },
    modifiersDisplay: { buff: "45% Attack", debuff: "15% Max HP" },
  },
  {
    id: "lead_sentinel",
    name: "Lead Sentinel",
    desc: "Increases Defense by +40% and Block by +5%, but slows you by -12%.",
    isCorrupted: true,
    apply: (p) => {
      p.defPctBonus = (p.defPctBonus || 0) + 0.4;
      p.block = (p.block || 0) + 0.05;
      p.moveSpeedPctBonus = (p.moveSpeedPctBonus || 0) - 0.12;
    },
    modifiersDisplay: { buff: "40% Defense / 5% Block", debuff: "12% Speed" },
  },
  {
    id: "vampiric_pact",
    name: "Vampiric Pact",
    desc: "Heals you for 1.0% of damage dealt on hit, but you take +15% more damage from all sources.",
    isCorrupted: true,
    apply: (p) => {
      p.crucibleCritHeal = (p.crucibleCritHeal || 0) + 0.01;
      p.crucibleSelfDmgReduction = (p.crucibleSelfDmgReduction || 1.0) * 1.15;
    },
    modifiersDisplay: { buff: "1.0% Lifesteal", debuff: "15% Damage Taken" },
  },
  {
    id: "brittle_goliath",
    name: "Brittle Goliath",
    desc: "Increases Max HP by +50%, but decreases your total Defense by -50%.",
    isCorrupted: true,
    apply: (p) => {
      p.maxHpPctBonus = (p.maxHpPctBonus || 0) + 0.5;
      p.defPctBonus = (p.defPctBonus || 0) - 0.5;
    },
    modifiersDisplay: { buff: "50% Max HP", debuff: "50% Defense" },
  },
  {
    id: "unstable_comb",
    name: "Unstable Combustion",
    desc: "Critical strikes trigger a 150% Attack splash blast, but you take 1% of the dealt damage as self-backlash.",
    isCorrupted: true,
    apply: (p) => {
      p.crucibleCritSplash = (p.crucibleCritSplash || 0) + 1.5;
      p.crucibleBacklash = (p.crucibleBacklash || 0) + 0.01;
    },
    modifiersDisplay: {
      buff: "150% Splash on Crit",
      debuff: "1% Backlash Damage",
    },
  },

  // --- MYTHIC / SINGULAR UPGRADES (Max 1 Stack, Game-Changers) ---
  {
    id: "brimstone_core",
    name: "Brimstone Core",
    desc: "Emits a fire aura dealing 50% Attack/sec to adjacent foes, but caps your maximum Movement Speed at 6.",
    isMythic: true,
    isSingular: true,
    apply: (p) => {
      p.hasBrimstoneCore = true;
      p.moveSpeedLimit = 6;
    },
    modifiersDisplay: {
      buff: "50% Fire Aura/sec",
      debuff: "Speed Capped at 6",
    },
  },
  {
    id: "mirage_array",
    name: "Mirage Array",
    desc: "A permanent spectral clone mimics your slashes at 40% damage, but you can no longer Block or Parry.",
    isMythic: true,
    isSingular: true,
    apply: (p) => {
      p.hasMirageArray = true;
      p.block = 0;
      p.parry = 0;
    },
    modifiersDisplay: {
      buff: "+40% Ghost Slashes",
      debuff: "Block & Parry Disabled",
    },
  },
  {
    id: "thunder_backlash",
    name: "Thunderlord's Backlash",
    desc: "Every 10th attack strikes up to 3 targets for 400% damage, but you take 5% of the dealt damage as feedback.",
    isMythic: true,
    isSingular: true,
    apply: (p) => {
      p.hasThunderBacklash = true;
    },
    modifiersDisplay: {
      buff: "400% Bolt / 10 hits",
      debuff: "5% Feedback Damage",
    },
  },
  {
    id: "alchemical_catalyst",
    name: "Alchemical Catalyst",
    desc: "Active elixir strengths are doubled (+100% bonus), but your Field Flask is disabled.",
    isMythic: true,
    isSingular: true,
    apply: (p) => {
      p.potStrengthPct = (p.potStrengthPct || 0) + 1.0;
      p.maxFlaskCharges = 0;
      p.flaskCharges = 0;
    },
    modifiersDisplay: { buff: "2x Potion Potency", debuff: "Flask Disabled" },
  },
];

window.playerStats = {
  // --- PHASE 2 ACTIVE TRACKERS ---
  floorActiveTicks: 0,
  kineticFrictionCharges: 0,
  kineticDistanceTraveled: 0,
  kineticStillTimer: 0,
  combatTimer: 0,
  tenacityStacks: 0,
  activeCombatTicks: 0,
  outOfCombatTicks: 0,

  hasTriggeredOnslaughtUnlock: false,
  isCrucibleMode: false,
  crucibleWave: 1,
  cruciblePeak: 0,
  crucibleDraftDeck: [],
  astralShards: 0,
  crucibleAccumulatedShards: 0,
  crucibleAccumulatedCores: 0,
  crucibleAccumulatedLoot: [],
  subweaponMastery: {
    shield: { xp: 0, level: 1, sp: 0, spentSp: 0 },
    dagger: { xp: 0, level: 1, sp: 0, spentSp: 0 },
    tome: { xp: 0, level: 1, sp: 0, spentSp: 0 },
    nodes: {
      shield_spiked_rim: 0,
      shield_iron_wall: 0,
      shield_impact_tremor: 0,
      shield_fortified_guard: 0,
      shield_retaliatory_strike: 0,
      shield_aegis_pulse: 0,
      shield_keystone_colossus: 0,
      shield_keystone_reflect: 0,
      dagger_lethal_precision: 0,
      dagger_vipers_coating: 0,
      dagger_shadow_step: 0,
      dagger_expose_weakness: 0,
      dagger_shadow_flurry: 0,
      dagger_sanguine_rupture: 0,
      dagger_keystone_assassin: 0,
      dagger_keystone_duellist: 0,
      tome_empowered_catalysts: 0,
      tome_runic_barrier: 0,
      tome_elemental_overload: 0,
      tome_arcane_syphon: 0,
      tome_barrier_shatter: 0,
      tome_spell_weaving: 0,
      tome_keystone_triad: 0,
      tome_keystone_singularity: 0,
    },
  },
  masteryPoints: 0,
  activeStarterSubweapon: "none",
  skillTree: {},
  recoveryLoot: null,
  currentRunEnemyStrength: 1.0,
  currentRunDropRateBonus: 0.0,
  currentRunDropQualityBonus: 0.0,
  currentRunGoldBonus: 0.0,
  hasUsedFreeInsurance: false,
  maxLevel: 1,
  lastDailyLoginDayStr: "",
  loginStreak: 0,
  loginClaimedToday: false,
  renown: 0,
  slotUpgrades: {
    weapon: 0,
    subweapon: 0,
    helmet: 0,
    chest: 0,
    leggings: 0,
    overall: 0,
    boots: 0,
    ring1: 0,
    ring2: 0,
    art1: 0,
    art2: 0,
    art3: 0,
  },
  crucibleAccumulatedGold: 0,
  crucibleAccumulatedXp: 0,
  crucibleDraftDeck: [],
  crucibleAccumulatedLoot: [],
  dungeonAccumulatedGold: 0,
  dungeonAccumulatedXp: 0,
  dungeonAccumulatedLoot: [],
  hasRefundedLegacyTempers: false,
  level: 1,
  xp: new BigNum(0, 0),
  xpReq: new BigNum(350, 0),
  sp: 0,
  usp: 0, // Separate Utility Skill Points
  spAllocations: {
    spHp: 0,
    spAtk: 0,
    spDef: 0,
    spCrit: 0,
    spCritDmg: 0,
    spBlock: 0,
    spParry: 0,
    spSpd: 0,
    spStr: 0,
    spDex: 0,
    spInt: 0,
  },
  vendingQLevel: 0,
  shopQLevel: 0,
  globalQLevel: 0,
  missionTokens: 0,
  missionUpgrades: { gold: 0, atk: 0, hp: 0 },
  vendingPity: 0,
  stickyCanvas: true,
  baseStr: 5,
  baseDex: 5,
  baseInt: 5,
  baseAtk: 10,
  baseMaxHp: 100,
  baseDef: 0,
  baseMoveSpeed: 8,
  baseIdleSpeed: 60,
  baseActiveSpeed: 15,
  baseDrop: 1.0,
  baseQuality: 1.0,
  baseGold: 1.0,
  baseCritChance: 0.05,
  baseCritDamage: 1.5,
  baseBlock: 0.0,
  baseParry: 0.0,
  baseRareSpawn: 0.01,
  baseFairySpawn: 1.0,
  currentHp: new BigNum(100, 0),
  coins: new BigNum(0, 0),
  stage: 1,
  maxStage: 1,
  killCount: 0,
  totalLifetimeKills: 0,
  successfulExtractions: 0,
  rareSpawnsSlain: 0,
  totalDeflections: 0,
  peakSingleHit: 0,
  hasTriggeredRecovery: false,
  hasTriggeredFullBag: false,
  hasTriggeredSoulBound: false,
  bossKillRegistry: {
    arachnid_treant: 0,
    aegis_goliath: 0,
    chronos_arbitrator: 0,
    nexus_overseer: 0,
    gilded_vault_keeper: 0,
    corrosive_abomination: 0,
    hooktail: 0,
    overlord_iron_vault: 0,
  },
  targetsRequired: 3, // Reduced from 5 to 3 for snappier stage runs
  isBossMode: false,
  isFarmingLoop: false,
  isUberBoss: false,
  currentUberBoss: "guardian",
  frenzyTimer: 0,
  frenzyKillCount: 0,
  adrenalineTimer: 0,
  usedSecondWind: false,
  isDungeonMode: false,
  currentDungeon: null,
  dungeonWave: 1,
  dungeonKeys: 5,
  nextDungeonKeyTime: 0,
  shopRefreshTime: 0,
  shopItems: [],
  atkPotionRuns: 0,
  atkPotionTimer: 0,
  atkPotionStrength: 0.1,
  hpPotionRuns: 0,
  hpPotionTimer: 0,
  hpPotionStrength: 0.1,
  defPotionRuns: 0,
  defPotionTimer: 0,
  defPotionStrength: 0.1,
  hastePotionRuns: 0,
  hastePotionTimer: 0,
  hastePotionStrength: 1,
  xpPotionRuns: 0,
  xpPotionTimer: 0,
  xpPotionStrength: 1.0,
  dropPotionRuns: 0,
  dropPotionTimer: 0,
  dropPotionStrength: 1.0,
  qlyPotionRuns: 0,
  qlyPotionTimer: 0,
  qlyPotionStrength: 0.5,
  autoSalvageThreshold: -1,
  volumeMaster: 0.5,
  volumeSFX: 0.8,
  volumeMusic: 0.5,
  mute: false,
  ecoMode: false,
  fairiesClicked: 0,
  deathCount: 0,
  lootPityCounter: 0,
  dungeonPeaks: { equip: 1, gold: 1, mat: 1 },
  currentDungeonStage: { equip: 1, gold: 1, mat: 1 },
  astralShards: 0,
  crucibleWave: 1,
  cruciblePeak: 1,
  crucibleRunActive: false,
  crucibleAccumulatedShards: 0,
  crucibleAccumulatedCores: 0,
  crucibleActiveBuff: null,
  crucibleActiveDebuff: null,
  crucibleInfusedType: "none",
  crucibleLootMult: 1.0,
  crucibleStartWave: 1,
  isCrucibleMode: false,
  crucibleKills: 0,
  runKills: 0,
  runGold: 0,
  runXp: 0,
  killedBy: "Unknown Foe",
  killedByMob: null,
  prestigePoints: 0,
  prestigeUpgrades: {
    bag: 0,
    gold: 0,
    exp: 0,
    drop: 0,
    atk: 0,
    fort: 0,
    fairy: 0,
  },
  prestigeCount: 0,
  lifetimePeakStage: 1,
  isPrestigeBossMode: false,
  prestigeApproachTimer: 0,
  highestRiftLevel: 0,
  activeRift: null,
  abyssalDecayAccumulated: 0,
  activeRiftLevel: 1,
  peakSingleHit: 0,
  maxFairyClicksInWindow: 0,
  totalDeflections: 0,
  peakSimultaneousBuffs: 0,
  totalReforges: 0,
  peakSingleGoldDrop: 0,
  rareSpawnsSlain: 0,
  maxCanvasClicksInWindow: 0,
  sessionPlaytime: 0,
  activityTimer: 0,
  fairyClicksWindow: [],
  canvasClicksWindow: [],
  recentHeals: [], // Track siphoned heals in a sliding 1,000ms window
  pendingClanProgress: {
    kills: 0,
    rifts: 0,
    prestige: 0,
    dungeons: 0,
    fairies: 0,
    tempers: 0,
    reforges: 0,
    potions: 0,
    salvage: 0,
    crits: 0,
    renown: 0,
  },

  // Achievement Checkpoint Flags
  hasTriggeredMurphysLaw: false,
  hasTriggeredAgainstOdds: false,
  hasTriggeredLuckySeven: false,
  hasTriggeredBackFromBrink: false,
  hasTriggeredElementalConvergence: false,
  hasTriggeredLookMaNoHands: false,
  hasTriggeredOverkill: false,
  hasTriggeredSpeedrun: false,
  hasTriggeredExactChange: false,
  hasTriggeredUnfortunateSoul: false,
  hasTriggeredAlchemicalSynthesis: false,
  hasTriggeredPatientShepherd: false,
  hasTriggeredBareFists: false,
  hasTriggeredPerfectDeflection: false,
  hasTriggeredWitchingHour: false,
  hasTriggeredHighNoon: false,
  hasTriggeredAethericRecharge: false,
  hasTriggeredNightOwl: false,
  hasTriggeredEarlyBird: false,
  hasTriggeredCoffeeRun: false,
  hasTriggeredWeekendWarrior: false,
  hasTriggeredPhoenixRising: false,
  hasTriggeredPerfectDeflection: false,
  hasTriggeredWitchingHour: false,
  hasTriggeredTimeCapsule: false,
  hasTriggeredAethericRecharge: false,
  hasClickedThisBattle: false,
  damageTakenThisBattle: 0,
  ankhTriggeredThisBattle: false,
  purifiedAegisTimer: 0,
  apathyDecayStacks: 0,
  apathyDecayTimer: 0,
  astralAwakeningTimer: 0,
  sparkChainCount: 0,
  dailyMissions: [],
  weeklyMissions: [],
  monsterCards: {},
  astralDust: 0,
  activeRelics: [],
  artifactCodex: {}, // Stores unlocked traits and their highest shattered roll: e.g. { frenzy: 0.85 }
  dailyRerollsDone: 0, // Reset daily at 12:00 AM PST/PDT
  lastDailyResetTime: 0,
  lastWeeklyResetTime: 0,
  dailyRewardClaimed: false,
  weeklyRewardClaimed: false,
  unviewedAchievements: [],
  selectedPrestigeStage: 80,
  unlockedCheckpoints: [1],
  selectedCheckpoint: 1,
  maxFloorCleared: 0,
  unlockedTitles: [],
  tutorialStep: 0,
  completedTutorialSteps: [],
  visitedTabs: [],
  visitedSubTabs: [],
  hasTriggeredLevel13Unlock: false,
  hasTriggeredLevel25Unlock: false,
  hasTriggeredPrestigeUnlock: false,
  equippedTitle: null,
  achievementTimestamps: {},
  claimedMailIds: [],
  unlockedSkins: ["default"],
  equippedCostume: "knight",
  unlockedCostumes: ["knight"],
  playerName: "Hero",
  clanId: null,
  activeSpecialChallenge: null,
  bountyRerollsToday: 0,
  audioSessionMode: "ambient",
  clanName: null,
  clanEmblem: null,
  clanLevel: 1,
  clanSkills: {
    steel_phalanx: 0,
    vitality_well: 0,
    prosperity_accord: 0,
    voyagers_guidance: 0,
    aetheric_wisdom: 0,
    clan_supply_depot: 0,
  },
  clanContribution: 0,
  paragonLevel: 0,
  spectralCodex: [],
  activeSpectralResonance: null,
  projectSpectralCosmetic: true,
  totalGoldEarned: new BigNum(0, 0),
  showDpsOverlay: true,
  dpsOverlayX: null,
  dpsOverlayY: null,
  chatFloatingMode: false,
  chatX: null,
  chatY: null,
  controlMode: "cursor",
  enableLighting: true,
  flaskCharges: 1,
  maxFlaskCharges: 1,
  flaskPotency: 0.25,
  flaskCooldownTimer: 0,
  flaskSpeedBurst: false,
  flaskX: null,
  flaskY: null,
  editHudMode: false,
};

window.toggleControlMode = function () {
  let current = window.playerStats.controlMode || "joystick";
  window.playerStats.controlMode =
    current === "joystick" ? "cursor" : "joystick";

  // Cleanly reset coordinates to prevent character snapping to old target destinations
  if (window.player) {
    window.player.targetX = window.player.x;
    window.player.targetY = window.player.y;
  }

  if (window.updateHUD) window.updateHUD();
};

// Initialize the QuestSystem namespace and define generateDailyMissions
window.QuestSystem = {
  getScaledTarget(type, peakStage) {
    let s = Math.max(1, Math.floor(peakStage || 1));
    let maxBag =
      typeof window.getMaxBagSlots === "function"
        ? window.getMaxBagSlots()
        : 20;
    let maxFlask =
      (window.playerStats && window.playerStats.maxFlaskCharges) || 1;

    switch (type) {
      // Daily Targets
      case "kills":
        return 150 + s * 5;
      case "rares":
        return 3 + Math.floor(s / 30);
      case "pottery":
        return 20 + s * 1;
      case "salvage":
        return 10 + Math.floor(s / 20);
      case "bag":
        return 8 + Math.floor(maxBag / 4);
      case "flask":
        return 2 + Math.floor(maxFlask / 2);

      // Weekly Targets
      case "rifts":
        return 5 + Math.floor(s / 40);
      case "dungeons":
        return 30 + Math.floor(s / 2);
      case "deflections":
        return 100 + s * 5;
      case "spells":
        return 80 + s * 4;
      case "luminous":
        return 8 + Math.floor(s / 25);
      case "contracts":
        return 3 + Math.floor(s / 100);

      default:
        return 10;
    }
  },

  generateDailyMissions() {
    let pool = [
      {
        type: "kills",
        label: "Purge standard dungeon monsters",
        unit: "monsters",
      },
      { type: "rares", label: "Eradicate wild rare spawns", unit: "rares" },
      {
        type: "pottery",
        label: "Shatter breakable clay pots, urns, or barrels",
        unit: "props",
      },
      {
        type: "salvage",
        label: "Salvage unwanted collected gear",
        unit: "items",
      },
      {
        type: "bag",
        label: "Extract successfully with a heavily laden satchel",
        unit: "items",
      },
      {
        type: "flask",
        label: "Deploy emergency Field Flask restorative charges",
        unit: "uses",
      },
    ];

    pool.sort(() => Math.random() - 0.5);
    let selected = pool.slice(0, 6);

    let peakStage =
      window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
    window.playerStats.dailyMissions = selected.map((m, idx) => {
      let target = window.QuestSystem.getScaledTarget(m.type, peakStage);
      let goldReward = BigNum.from(100).mul(BigNum.from(1.05).pow(peakStage));
      let xpReward = BigNum.from(20).mul(BigNum.from(1.04).pow(peakStage));

      return {
        id: `daily_${idx + 1}`,
        type: m.type,
        desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
        current: 0,
        target: target,
        goldReward: { m: goldReward.m, e: goldReward.e },
        xpReward: { m: xpReward.m, e: xpReward.e },
        treat: "Daily Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },

  generateWeeklyMissions() {
    let pool = [
      {
        type: "rifts",
        label: "Eradicate Altar Rift Guardians",
        unit: "guardians",
      },
      { type: "dungeons", label: "Clear deep Dungeon floors", unit: "floors" },
      {
        type: "deflections",
        label: "Execute tactical Blocks or Parries",
        unit: "deflections",
      },
      {
        type: "spells",
        label: "Trigger offhand Tome Spell Procs",
        unit: "spells",
      },
      {
        type: "luminous",
        label: "Harvest wild Luminous Souls from rare spawns",
        unit: "souls",
      },
      {
        type: "contracts",
        label: "Complete Special Cavern Challenge Contracts",
        unit: "contracts",
      },
    ];

    pool.sort(() => Math.random() - 0.5);
    let selected = pool.slice(0, 3);

    let peakStage =
      window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
    window.playerStats.weeklyMissions = selected.map((m, idx) => {
      let target = window.QuestSystem.getScaledTarget(m.type, peakStage);
      let goldReward = BigNum.from(800).mul(BigNum.from(1.05).pow(peakStage));
      let xpReward = BigNum.from(150).mul(BigNum.from(1.04).pow(peakStage));

      return {
        id: `weekly_${idx + 1}`,
        type: m.type,
        desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
        current: 0,
        target: target,
        goldReward: { m: goldReward.m, e: goldReward.e },
        xpReward: { m: xpReward.m, e: xpReward.e },
        treat: "Weekly Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },
};

// Legacy Compatibility Aliases to protect references
window.generateDailyMissions = () => window.QuestSystem.generateDailyMissions();
window.generateWeeklyMissions = () =>
  window.QuestSystem.generateWeeklyMissions();

// Append rerollBountyBoard inside window.QuestSystem
Object.assign(window.QuestSystem, {
  rerollBountyBoard() {
    let r = window.playerStats.bountyRerollsToday || 0;
    if (r >= 3) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "Maximum of 3 manual board re-rolls per day reached!",
          "#e74c3c",
        );
      }
      return;
    }

    let peakStage =
      window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
    let cost = window.getBountyRerollCost(peakStage, r);

    let goldOwned = BigNum.from(window.playerStats.coins || 0);
    let soulsOwned =
      (window.inventory &&
        window.inventory.ETC &&
        window.inventory.ETC["Monster Soul"]) ||
      0;

    if (goldOwned.lt(cost.gold)) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast("Not enough Gold for board re-roll!", "#e74c3c");
      }
      return;
    }
    if (soulsOwned < cost.souls) {
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          "Not enough Monster Souls for board re-roll!",
          "#e74c3c",
        );
      }
      return;
    }

    // Deduct resources
    window.playerStats.coins = goldOwned.sub(cost.gold);
    if (window.playerStats.coins.eq(0)) {
      window.playerStats.hasTriggeredExactChange = true;
    }

    window.inventory.ETC["Monster Soul"] -= cost.souls;
    if (window.inventory.ETC["Monster Soul"] === 0) {
      delete window.inventory.ETC["Monster Soul"];
    }

    // Increment re-roll tracker
    window.playerStats.bountyRerollsToday = r + 1;

    // Regenerate active missions & Special Challenges
    this.generateDailyMissions();
    if (window.isWeeklyQuestUnlocked()) {
      this.generateWeeklyMissions();
    }
    if (
      window.ChallengeEngine &&
      typeof window.ChallengeEngine.generateRandomChallenges === "function"
    ) {
      window.ChallengeEngine.generateRandomChallenges();
    }

    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast("Board Re-rolled Successfully!", "#2ecc71");
    }
    if (window.SoundManager && typeof window.SoundManager.play === "function") {
      window.SoundManager.play("revive");
    }

    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.renderBountyBoard === "function")
      window.renderBountyBoard();
    if (typeof window.saveGame === "function") window.saveGame();
  },
});

window.rerollBountyBoard = () => window.QuestSystem.rerollBountyBoard();

// Legacy Compatibility Aliases to protect references
window.generateWeeklyMissions = () =>
  window.QuestSystem.generateWeeklyMissions();

// Append checkAndResetMissions inside window.QuestSystem
Object.assign(window.QuestSystem, {
  checkAndResetMissions() {
    let now = Date.now();

    // Fully Timezone-Aware PST/PDT Date Resolution
    let ptString = new Date(now).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    let ptDate = new Date(ptString);
    let currentDayStr = ptDate.toLocaleDateString("en-US"); // e.g. "6/25/2026"

    // Check Daily reset against absolute Pacific date string
    if (
      !window.playerStats.lastDailyResetDayStr ||
      window.playerStats.lastDailyResetDayStr !== currentDayStr
    ) {
      this.generateDailyMissions();
      window.playerStats.lastDailyResetDayStr = currentDayStr;
      window.playerStats.lastDailyResetTime = now;
      window.playerStats.dailyRewardClaimed = false;
      window.playerStats.dailyRerollsDone = 0; // Reset active re-roll tracker daily
      window.playerStats.bountyRerollsToday = 0; // Reset active re-roll count daily
      if (typeof window.pushLog === "function")
        window.pushLog(
          "<span style='color:#2ecc71; font-weight:bold;'>[SYSTEM] Clan Daily Board refreshed! Reset at 12:00 AM PST/PDT. Complete at least 5 for a grand treat!</span>",
        );
    }

    // Check Weekly reset (Monday 12:00 AM PST/PDT)
    let dayOfWeek = ptDate.getDay(); // 0 is Sunday, 1 is Monday...
    let daysSinceMonday = (dayOfWeek + 6) % 7; // Days elapsed since last Monday
    let lastMondayDate = new Date(ptDate);
    lastMondayDate.setDate(ptDate.getDate() - daysSinceMonday);
    let lastMondayStr = lastMondayDate.toLocaleDateString("en-US");

    if (window.isWeeklyQuestUnlocked()) {
      if (
        !window.playerStats.lastWeeklyResetMondayStr ||
        window.playerStats.lastWeeklyResetMondayStr !== lastMondayStr
      ) {
        this.generateWeeklyMissions();
        window.playerStats.lastWeeklyResetMondayStr = lastMondayStr;
        window.playerStats.lastWeeklyResetTime = now;
        window.playerStats.weeklyRewardClaimed = false;

        // Add this line below:
        window.playerStats.weeklyClanCrateClaimed = false;

        if (typeof window.pushLog === "function")
          window.pushLog(
            "<span style='color:#9b59b6; font-weight:bold;'>[SYSTEM] Clan Weekly Board refreshed!</span>",
          );
      }
    } else {
      window.playerStats.weeklyMissions = [];
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.checkAndResetMissions = () => window.QuestSystem.checkAndResetMissions();

// Append progressMission inside window.QuestSystem
Object.assign(window.QuestSystem, {
  progressMission(type, amount) {
    if (window.isGamePaused) return;
    let updated = false;

    if (window.playerStats.dailyMissions) {
      window.playerStats.dailyMissions.forEach((m) => {
        if (m.type === type && !m.completed) {
          m.current = Math.min(m.target, m.current + amount);
          if (m.current >= m.target) {
            m.completed = true;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(`📅 Daily Done: ${m.desc}!`, "#2ecc71");
            }
          }
          updated = true;
        }
      });
    }

    if (window.isWeeklyQuestUnlocked() && window.playerStats.weeklyMissions) {
      window.playerStats.weeklyMissions.forEach((m) => {
        if (m.type === type && !m.completed) {
          m.current = Math.min(m.target, m.current + amount);
          if (m.current >= m.target) {
            m.completed = true;
            if (typeof window.pushHeaderToast === "function") {
              window.pushHeaderToast(`📆 Weekly Done: ${m.desc}!`, "#9b59b6");
            }
          }
          updated = true;
        }
      });
    }

    if (updated) {
      if (typeof window.updateUI === "function") window.updateUI();
    }
  },
});

// Legacy Compatibility Aliases to protect references
window.progressMission = (type, amount) =>
  window.QuestSystem.progressMission(type, amount);

window.equippedSlots = {
  weapon: null,
  subweapon: null,
  helmet: null,
  chest: null,
  leggings: null,
  overall: null,
  boots: null,
  ring1: null,
  ring2: null,
  art1: null,
  art2: null,
  art3: null,
};
window.inventory = { EQUIP: [], ARTIFACT: [], SIGIL: [], ETC: {}, USE: {} };
window.logsHistory = [];
window.frozenItemDb = {};
window.idCounter = 0;
window.hero = {
  x: 40,
  y: 205,
  w: 25,
  h: 35,
  attackTimer: 0,
  slashFrame: false,
};
window.mob = null;
window.effects = [];
window.particles = [];
window.beams = [];
window.snowflakes = [];
window.bgScenery = [];
window.fgScenery = [];
window.activeRiftOrbs = [];
window.activeFairies = [];
window.damageHistory = [];
window.projectiles = [];
window.goldParticles = [];
window.heartOrbs = [];
window.groundLoot = [];
window.groundMaterials = [];
window.groundScroll = 0;
window.logicClock = 0;
window.spacePressed = false;
window.state = {
  autoAttack: true,
  efficiency: 1.0,
  currentSubTab: "EQUIP",
  currentActivitiesSubTab: "DUNGEONS",
  preferredRingComparisonSlot: "ring1",
};
window.isGamePaused = false;
window.isCloudSynced = false;
window.reviveTimer = 0;
window.deathAnimationTimer = 0;
window.deathMaxFrames = 90;
window.lastUpdateTime = Date.now();
window.sessionStartTime = Date.now();
window.respawnIntervalId = null;
window.recalculateXpRequirement = function () {
  window.playerStats.xpReq = BigNum.from(600).mul(
    BigNum.from(1.55).pow(window.playerStats.level - 1),
  );
};
// Expose the manual boss rechallenge actuator to the DOM window
window.rechallengeBoss = function () {
  let p = window.resolvePlayerStats();
  window.playerStats.currentHp = p.maxHp;
  window.playerStats.isFarmingLoop = false;
  window.playerStats.isBossMode = false;
  window.playerStats.killCount = 0;
  window.mob = null;
  window.projectiles = [];
  window.hero.x = 40;
  if (typeof window.updateUI === "function") window.updateUI();
};

// --- PERSISTENT SAVE & LOAD ENGINE ---
window.saveGame = function () {
  try {
    if (!window.playerStats) return;

    if (window.player && window.inventory && window.inventory.EQUIP) {
      window.player.stash = window.inventory.EQUIP;
    }

    let saveData = {
      playerStats: { ...window.playerStats },
      equippedSlots: window.equippedSlots || {},
      inventory: window.inventory || {
        EQUIP: [],
        ARTIFACT: [],
        SIGIL: [],
        ETC: {},
        USE: {},
      },
      stash: window.player && window.player.stash ? window.player.stash : [],
      bag: window.player && window.player.bag ? window.player.bag : [],
      pendingScraps:
        window.player && window.player.pendingScraps
          ? window.player.pendingScraps
          : {},
      version: window.GAME_VERSION || 1.0,
    };

    if (saveData.playerStats.xp)
      saveData.playerStats.xp = {
        m: saveData.playerStats.xp.m,
        e: saveData.playerStats.xp.e,
      };
    if (saveData.playerStats.xpReq)
      saveData.playerStats.xpReq = {
        m: saveData.playerStats.xpReq.m,
        e: saveData.playerStats.xpReq.e,
      };
    if (saveData.playerStats.currentHp)
      saveData.playerStats.currentHp = {
        m: saveData.playerStats.currentHp.m,
        e: saveData.playerStats.currentHp.e,
      };
    if (saveData.playerStats.coins)
      saveData.playerStats.coins = {
        m: saveData.playerStats.coins.m,
        e: saveData.playerStats.coins.e,
      };
    if (saveData.playerStats.runGold)
      saveData.playerStats.runGold = {
        m: saveData.playerStats.runGold.m,
        e: saveData.playerStats.runGold.e,
      };
    if (saveData.playerStats.totalGoldEarned)
      saveData.playerStats.totalGoldEarned = {
        m: saveData.playerStats.totalGoldEarned.m,
        e: saveData.playerStats.totalGoldEarned.e,
      };
    if (
      saveData.playerStats.recoveryLoot &&
      saveData.playerStats.recoveryLoot.gold
    ) {
      saveData.playerStats.recoveryLoot.gold = {
        m: saveData.playerStats.recoveryLoot.gold.m,
        e: saveData.playerStats.recoveryLoot.gold.e,
      };
    }

    // Subphase 13: Serialize Special Challenge rewards safely without mutating live memory references
    if (saveData.playerStats.activeSpecialChallenge) {
      let challengeCopy = JSON.parse(
        JSON.stringify(saveData.playerStats.activeSpecialChallenge),
      );
      if (challengeCopy.rewards) {
        let r = challengeCopy.rewards;
        if (r.gold)
          r.gold = { m: BigNum.from(r.gold).m, e: BigNum.from(r.gold).e };
        if (r.xp) r.xp = { m: BigNum.from(r.xp).m, e: BigNum.from(r.xp).e };
      }
      saveData.playerStats.activeSpecialChallenge = challengeCopy;
    }

    localStorage.setItem("extraction_crawler_save", JSON.stringify(saveData));
  } catch (err) {
    console.warn("Failed to save game to localStorage:", err);
  }
};

window.hydrateCavernSigils = function () {
  if (!window.inventory) return;
  if (!window.inventory.SIGIL) {
    window.inventory.SIGIL = [];
  }

  // Subphase 13: Reusable high-quality sigil hydrator
  window.hydrateSingleSigil = function (sig) {
    if (!sig) return;
    if (sig.statsRolled === undefined) {
      sig.statsRolled = 1;
    }
    if (sig.buffs) {
      sig.buffs = sig.buffs.map((b) => {
        if (typeof b === "string") {
          return {
            id: "giant_might",
            name: "Giant Might",
            desc: b,
            type: "stat",
            statKey: "atk",
            value: 0.1,
            minStars: 0,
          };
        }
        let match = (window.CAVERN_BUFFS || []).find((ref) => ref.id === b.id);
        if (match) {
          b.type = b.type || match.type;
          b.statKey = b.statKey || match.statKey;
          b.minStars = b.minStars !== undefined ? b.minStars : match.minStars;
          if (b.type === "stat" && b.value === undefined) {
            b.value = window.rollSigilStatValue
              ? window.rollSigilStatValue(b.statKey, sig.statsRolled, true)
              : 0.1;
          }
          if (window.formatSigilStatDesc && b.type === "stat") {
            b.desc = window.formatSigilStatDesc(b.statKey, b.value, true);
          } else {
            b.desc = b.desc || match.desc;
          }
        }
        return b;
      });
    } else {
      sig.buffs = [];
    }
    if (sig.debuffs) {
      sig.debuffs = sig.debuffs.map((d) => {
        if (typeof d === "string") {
          return {
            id: "dull_blades",
            name: "Dull Blades",
            desc: d,
            type: "stat",
            statKey: "atk",
            value: -0.1,
            minStars: 0,
            dangerRating: 5,
          };
        }
        let match = (window.CAVERN_DEBUFFS || []).find(
          (ref) => ref.id === d.id,
        );
        if (match) {
          d.type = d.type || match.type;
          d.statKey = d.statKey || match.statKey;
          d.minStars = d.minStars !== undefined ? d.minStars : match.minStars;
          d.dangerRating =
            d.dangerRating !== undefined ? d.dangerRating : match.dangerRating;
          if (d.type === "stat" && d.value === undefined) {
            d.value = window.rollSigilStatValue
              ? window.rollSigilStatValue(d.statKey, sig.statsRolled, false)
              : -0.1;
          }
          if (window.formatSigilStatDesc && d.type === "stat") {
            d.desc = window.formatSigilStatDesc(d.statKey, d.value, false);
          } else {
            d.desc = d.desc || match.desc;
          }
        }
        return d;
      });
    } else {
      sig.debuffs = [];
    }
    if (sig.rewardMultiplier === undefined) {
      sig.rewardMultiplier = 1.0;
    }
    if (sig.qualityBoost === undefined) {
      sig.qualityBoost = 0.0;
    }
  };

  window.inventory.SIGIL.forEach((sig) => {
    window.hydrateSingleSigil(sig);
  });

  if (window.playerStats && window.playerStats.activeDungeonSigil) {
    window.hydrateSingleSigil(window.playerStats.activeDungeonSigil);
  }
};

window.renderBestiaryAlbum = function () {
  let container = document.getElementById("album-content-panel");
  if (!container) return;

  let cards = window.playerStats.monsterCards || {};
  let totalCards = Object.keys(window.MONSTER_CARDS_DATA).length;
  let unlockedCount = 0;

  for (let cKey in window.MONSTER_CARDS_DATA) {
    if ((cards[cKey] || 0) > 0) {
      unlockedCount++;
    }
  }

  let progressPct = Math.round((unlockedCount / totalCards) * 100) || 0;

  // Compile active passive stats from cards
  let activeBonusTexts = [];
  let statLabels = {
    atk: "Attack Power",
    maxHp: "Maximum HP",
    def: "Defense Armor",
    moveSpeed: "Movement Speed",
    critChance: "Critical Strike Chance",
    critDamage: "Critical Strike Damage",
    block: "Block Rate",
    parry: "Parry Rate",
    xpRate: "XP Rate Multiplier",
    dropRate: "Drop Rate Mod",
    gold: "Gold Multiplier",
    rareSpawn: "Rare Spawn Rate",
  };

  // Re-accumulate card stat values
  let accumulatedStats = {};
  for (let cKey in window.MONSTER_CARDS_DATA) {
    let count = cards[cKey] || 0;
    let tier = window.getCardTier(count);
    if (tier >= 0) {
      let cardData = window.MONSTER_CARDS_DATA[cKey];
      let val = window.getCardValue(cardData.baseVal, tier);
      accumulatedStats[cardData.baseStat] =
        (accumulatedStats[cardData.baseStat] || 0) + val;
    }
  }

  // Append active Set Resonance bonuses
  for (let setName in window.CARD_SETS_DATA) {
    let setData = window.CARD_SETS_DATA[setName];
    let minTier = Infinity;
    let allOwned = true;
    for (let cKey of setData.cards) {
      let count = cards[cKey] || 0;
      let t = window.getCardTier(count);
      if (t < 0) {
        allOwned = false;
        break;
      }
      if (t < minTier) minTier = t;
    }
    if (allOwned) {
      let multiplier = 1.0 + 0.5 * minTier;
      let val = 0.05 * multiplier;
      accumulatedStats[setData.statKey] =
        (accumulatedStats[setData.statKey] || 0) + val;
    }
  }

  for (let sKey in accumulatedStats) {
    let val = accumulatedStats[sKey];
    if (val > 0) {
      let isPct = [
        "dropRate",
        "qly",
        "critChance",
        "critDamage",
        "block",
        "parry",
        "gold",
        "xpRate",
        "rareSpawn",
        "maxHp",
        "def",
        "atk",
        "defPctBonus",
        "atkPctBonus",
        "maxHpPctBonus",
        "attributesMult",
      ].includes(sKey);
      let valStr = isPct ? `+${(val * 100).toFixed(1)}%` : `+${val}`;
      let label = statLabels[sKey] || sKey.toUpperCase();
      activeBonusTexts.push(`${label} ${valStr}`);
    }
  }
  let activeBonusStr =
    activeBonusTexts.length > 0
      ? activeBonusTexts.join(" • ")
      : "No active card bonuses yet.";

  // Build Set Containers
  let setsHtml = "";
  let setKeys = [
    "Whispering Woods",
    "Mountain Peaks",
    "Inferno Depths",
    "Fungal Swamp",
    "Void Singularity",
    "Cosmic Wardens",
  ];

  const rankNames = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const rankColors = [
    "#b2bec3",
    "#cd7f32",
    "#bdc3c7",
    "#ffd700",
    "#e5e7eb",
    "#00ffff",
  ];

  setKeys.forEach((setName) => {
    let setData = window.CARD_SETS_DATA[setName];
    let minTier = Infinity;
    let ownedSetCount = 0;

    for (let cKey of setData.cards) {
      let count = cards[cKey] || 0;
      let t = window.getCardTier(count);
      if (t >= 0) {
        ownedSetCount++;
        if (t < minTier) minTier = t;
      } else {
        minTier = -1;
      }
    }

    let isSetComplete = ownedSetCount === setData.cards.length;
    let setResonanceText = "";
    let setHeaderColor = isSetComplete ? "#ffd700" : "#64748b";

    if (isSetComplete) {
      let mult = 1.0 + 0.5 * minTier;
      setResonanceText = `<span style="color:#2ecc71; font-weight:bold; font-size:9.5px; font-family:monospace;">RESONANCE: ${rankNames[minTier]} (x${mult.toFixed(1)} Bonus)</span>`;
    } else {
      setResonanceText = `<span style="color:#64748b; font-size:9.5px; font-family:monospace;">RESONANCE: INACTIVE (${ownedSetCount}/${setData.cards.length})</span>`;
    }

    let cardsGridHtml = setData.cards
      .map((cKey) => {
        let count = cards[cKey] || 0;
        let tier = window.getCardTier(count);
        let cardData = window.MONSTER_CARDS_DATA[cKey];
        let cost = cardData.set === "Cosmic Wardens" ? 250 : 50;
        let dustOwned = window.playerStats.astralDust || 0;
        let canCraft = dustOwned >= cost;

        if (tier >= 0) {
          let cardColor = rankColors[tier] || "#ffd700";
          let val = window.getCardValue(cardData.baseVal, tier);
          let isPct = cardData.isPct;
          let valStr = isPct ? `+${(val * 100).toFixed(1)}%` : `+${val}`;
          let iconHtml = window.getEquipIconHtml(
            { type: "card", cardKey: cKey },
            36,
          );

          let thresholds = window.CARD_UPGRADE_THRESHOLDS;
          let nextThreshold = thresholds[tier + 1];
          let progressText = "";
          let progressPct = 0;

          if (nextThreshold !== undefined) {
            progressText = `${count} / ${nextThreshold}`;
            progressPct = Math.min(100, (count / nextThreshold) * 100);
          } else {
            progressText = "MAX RANK";
            progressPct = 100;
          }

          return `
              <div class="bestiary-card-item unlocked-card" style="border-color:${cardColor}; background:rgba(0,0,0,0.5); box-shadow: inset 0 0 10px ${cardColor}15;">
                <div style="font-size:7px; color:${cardColor}; font-weight:bold; font-family:monospace; text-transform:uppercase;">${rankNames[tier]} RANK</div>
                <div style="margin:4px 0;">${iconHtml}</div>
                <div class="bestiary-card-title" style="color:#ffffff;">${cardData.name.split(" Card")[0]}</div>
                <div style="font-size:8.5px; color:#2ecc71; font-family:monospace; font-weight:bold;">${statLabels[cardData.baseStat] || cardData.baseStat}: ${valStr}</div>

                <div style="width:100%; margin-top:6px;">
                  <div class="gacha-pity-bg" style="width:100%; height:4px; background:#06040a;">
                    <div class="gacha-pity-fill" style="width:${progressPct}%; height:100%; background:${cardColor};"></div>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px; font-family:monospace; font-size:7px; width:100%;">
                    <button class="action-btn-sm" style="font-size:6px; padding:1.5px 4px; margin:0; line-height:1.2; background:${canCraft ? "#3b0764" : "#1e293b"}; border-color:${canCraft ? "#a855f7" : "#334155"}; color:${canCraft ? "#df9ffb" : "#64748b"};" ${canCraft ? "" : "disabled"} onclick="event.stopPropagation(); window.craftCard('${cKey}')">CRAFT (${cost} D)</button>
                    <span style="color:#94a3b8; font-size:7.5px;">${progressText}</span>
                  </div>
                </div>
              </div>
            `;
        } else {
          let iconHtml = `<span style="display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; background:rgba(255,255,255,0.01); border:1px dashed #334155; border-radius:4px; font-weight:bold; font-size:16px; color:#334155; flex-shrink:0;">?</span>`;
          let craftBtnHtml = `<button class="action-btn-sm" style="font-size:7px; padding:2.5px 6px; margin:0; line-height:1.2; background:${canCraft ? "linear-gradient(180deg, #10b981, #047857)" : "#1e293b"}; border-color:${canCraft ? "#34d399" : "#334155"}; color:${canCraft ? "#ffffff" : "#64748b"}; width:100%; margin-top:4px;" ${canCraft ? "" : "disabled"} onclick="event.stopPropagation(); window.craftCard('${cKey}')">CRAFT (${cost} Dust)</button>`;

          return `
              <div class="bestiary-card-item locked-card" style="border-color:#1e293b; background:rgba(10,14,23,0.3); min-height:145px; display:flex; flex-direction:column; justify-content:space-between;">
                <div style="font-size:7px; color:#475569; font-weight:bold; font-family:monospace;">LOCKED</div>
                <div style="margin:4px 0; opacity:0.25; filter:grayscale(1);">${iconHtml}</div>
                <div class="bestiary-card-title" style="color:#475569;">${cardData.name.split(" Card")[0]}</div>
                <div style="font-size:8.5px; color:#475569; font-family:monospace;">${statLabels[cardData.baseStat] || cardData.baseStat}: LOCKED</div>
                <div style="width:100%;">
                  <div class="gacha-pity-bg" style="width:100%; height:4px; background:#06040a;">
                    <div class="gacha-pity-fill" style="width:0%;"></div>
                  </div>
                  ${craftBtnHtml}
                </div>
              </div>
            `;
        }
      })
      .join("");

    setsHtml += `
          <div style="margin-bottom:16px;">
            <div class="bestiary-set-header" style="border-bottom: 1.5px solid ${isSetComplete ? "rgba(212,175,55,0.3)" : "rgba(51,65,85,0.3)"}; padding-bottom:4px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:${setHeaderColor}; font-size:11.5px; text-transform:uppercase; letter-spacing:0.8px;">${setData.name}</strong>
              ${setResonanceText}
            </div>
            <div class="bestiary-grid">
              ${cardsGridHtml}
            </div>
          </div>
        `;
  });

  container.innerHTML = `
        <div class="bestiary-wrapper" style="display:flex; flex-direction:column; gap:10px; width:100%; height:100%;">
          <!-- Unlocked Count & Summary Banner -->
          <div class="bestiary-summary-banner" style="background: linear-gradient(180deg, #1e172e 0%, #0d0918 100%); border: 1.5px solid #d4af37; border-radius:8px; padding:10px 14px; display:flex; flex-direction:column; gap:6px; flex-shrink:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <span style="font-size:11px; font-weight:900; color:#ffd700; letter-spacing:1px; text-transform:uppercase;">MONSTER CARD COLLECTION</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="font-family:monospace; font-size:10px; font-weight:bold; color:#00ffff; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; border:1px solid rgba(0,210,255,0.3);">${unlockedCount} / ${totalCards} Unlocked (${progressPct}%)</span>
                <span style="font-family:monospace; font-size:10px; font-weight:bold; color:#df9ffb; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px; border:1px solid rgba(168,85,247,0.3);">Dust: ${(window.playerStats.astralDust || 0).toLocaleString()}</span>
                <button class="action-btn-sm action-btn-salvage" style="font-size:8px; padding:3px 6px; margin:0; line-height:1.2;" onclick="event.stopPropagation(); window.salvageAllDuplicateCards();">SALVAGE EXTRA COPIES</button>
              </div>
            </div>
            <div class="gacha-pity-bg" style="width:100%; height:6px; background:#06040a;">
              <div class="gacha-pity-fill" style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, #f59e0b, #10b981);"></div>
            </div>
            <div style="font-size:8.5px; font-family:monospace; color:#34d399; line-height:1.35; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px; word-break:break-word; text-align:left;">
              <strong>COMBINED BESTIARY PASSIVES:</strong> ${activeBonusStr}
            </div>
          </div>
          <!-- Album Scrollable Area -->
          <div class="bestiary-album-scrollable" style="flex:1; overflow-y:auto; padding-right:2px; touch-action:pan-y;">
            ${setsHtml}
          </div>
        </div>
      `;
};

window.craftCard = function (cKey) {
  let cardData = window.MONSTER_CARDS_DATA[cKey];
  if (!cardData) return;

  let cost = cardData.set === "Cosmic Wardens" ? 250 : 50;
  let dustOwned = window.playerStats.astralDust || 0;

  if (dustOwned < cost) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        `❌ Not enough Astral Dust! Requires ${cost} Dust (Owned: ${dustOwned})`,
        "#e74c3c",
      );
    }
    return;
  }

  window.showCustomConfirm(
    "Craft Monster Card",
    `Spend <strong style="color:#df9ffb;">${cost} Astral Dust</strong> to forge 1x <strong>${cardData.name}</strong>?`,
    "Craft Card",
    "Cancel",
    "#a855f7",
    function () {
      window.playerStats.astralDust = Math.max(
        0,
        (window.playerStats.astralDust || 0) - cost,
      );
      window.playerStats.monsterCards[cKey] =
        (window.playerStats.monsterCards[cKey] || 0) + 1;

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("revive");
      }
      if (typeof window.spawnTemperParticles === "function") {
        window.spawnTemperParticles(true);
      }

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(`Forged 1x ${cardData.name}!`, "#2ecc71");
      }

      window.updateUI();
      window.renderBestiaryAlbum();
      window.saveGame();
    },
  );
};

window.salvageAllDuplicateCards = function () {
  let cards = window.playerStats.monsterCards || {};
  let totalDustYield = 0;
  let totalCardsSalvaged = 0;

  for (let cKey in window.MONSTER_CARDS_DATA) {
    let count = cards[cKey] || 0;
    if (count > 1) {
      let extra = count - 1;
      let cardData = window.MONSTER_CARDS_DATA[cKey];
      let isBoss = cardData.set === "Cosmic Wardens";
      let valuePerCard = isBoss ? 5 : 1;

      totalDustYield += extra * valuePerCard;
      totalCardsSalvaged += extra;
    }
  }

  if (totalCardsSalvaged === 0) {
    if (typeof window.pushHeaderToast === "function") {
      window.pushHeaderToast(
        "No duplicate cards available to salvage!",
        "#e74c3c",
      );
    }
    return;
  }

  window.showCustomConfirm(
    "Salvage Duplicate Cards",
    `Are you sure you want to dismantle <strong>${totalCardsSalvaged} spare card(s)</strong>? This will permanently recycle all extra copies (leaving 1 copy of each unlocked card) and yield <strong style="color:#df9ffb;">+${totalDustYield} Astral Dust</strong>.<br><br><span style="color:#e74c3c; font-weight:bold;">Warning: If you had upgraded card ranks, reducing card counts down to 1 will reset those card ranks back to Iron (Tier 0).</span>`,
    "Salvage Cards",
    "Cancel",
    "#e74c3c",
    function () {
      for (let cKey in window.MONSTER_CARDS_DATA) {
        let count = cards[cKey] || 0;
        if (count > 1) {
          cards[cKey] = 1;
        }
      }
      window.playerStats.astralDust =
        (window.playerStats.astralDust || 0) + totalDustYield;

      if (
        window.SoundManager &&
        typeof window.SoundManager.play === "function"
      ) {
        window.SoundManager.play("death");
      }
      if (typeof window.spawnTemperParticles === "function") {
        window.spawnTemperParticles(true);
      }

      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `Recycled ${totalCardsSalvaged} duplicate card(s) for +${totalDustYield} Astral Dust!`,
          "#2ecc71",
        );
      }

      window.updateUI();
      window.renderBestiaryAlbum();
      window.saveGame();
    },
  );
};

window.openMonsterCardSackAnimation = function (rolledCards) {
  window.isGamePaused = true;
  let overlay = document.createElement("div");
  overlay.id = "card-opening-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(4, 3, 9, 0.95)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "45000";
  overlay.style.backdropFilter = "blur(12px)";
  overlay.style.fontFamily = "monospace";
  overlay.style.color = "#f1f5f9";
  overlay.style.boxSizing = "border-box";
  overlay.style.padding = "20px";
  document.body.appendChild(overlay);

  let style = document.createElement("style");
  style.innerHTML = `
      .unboxing-grid {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin: 20px 0;
        perspective: 1000px;
      }
      .card-container {
        width: 110px;
        height: 165px;
        perspective: 1000px;
        cursor: pointer;
      }
      .card-flipper {
        position: relative;
        width: 100%;
        height: 100%;
        transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        transform-style: preserve-3d;
      }
      .card-container.flipped .card-flipper {
        transform: rotateY(180deg);
      }
      .card-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 8px;
        border: 1.5px solid;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      }
      .card-back {
        background: linear-gradient(135deg, #1e1b4b 0%, #090514 100%);
        border-color: #ffd700;
      }
      .card-front {
        background: #110d22;
        transform: rotateY(180deg);
      }
      .collect-btn-container {
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }
      .collect-btn-container.show {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }
    `;
  document.head.appendChild(style);

  let cardsHtml = rolledCards
    .map((cKey, idx) => {
      let cardData = window.MONSTER_CARDS_DATA[cKey];
      let setColors = {
        "Whispering Woods": "#2ecc71",
        "Mountain Peaks": "#3498db",
        "Inferno Depths": "#e74c3c",
        "Fungal Swamp": "#1abc9c",
        "Void Singularity": "#9b59b6",
        "Cosmic Wardens": "#f1c40f",
      };
      let color = setColors[cardData.set] || "#ffd700";
      let iconHtml = window.getEquipIconHtml(
        { type: "card", cardKey: cKey },
        42,
      );
      let ownedCount = window.playerStats.monsterCards[cKey] || 0;

      return `
        <div class="card-container" id="card-item-${idx}" onclick="window.flipUnboxedCard(this, ${idx})">
          <div class="card-flipper">
            <!-- Back -->
            <div class="card-face card-back" style="border-color:#ffd700; box-shadow: inset 0 0 10px rgba(241,196,15,0.15), 0 4px 10px rgba(0,0,0,0.6);">
              <div style="font-size:7px; color:#f1c40f; text-transform:uppercase; letter-spacing:0.8px; font-weight:900;">BESTIARY</div>
              <div style="width:24px; height:24px; border:1px dashed #f1c40f; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <span style="color:#f1c40f; font-size:12px;">✦</span>
              </div>
              <div style="font-size:6.5px; color:#aaa;">TAP TO REVEAL</div>
            </div>
            <!-- Front -->
            <div class="card-face card-front" style="border-color:${color}; box-shadow: inset 0 0 10px ${color}15, 0 4px 10px rgba(0,0,0,0.6);">
              <div style="font-size:7px; color:${color}; font-weight:bold; text-transform:uppercase; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%;">${cardData.set}</div>
              <div style="margin:4px 0;">${iconHtml}</div>
              <div style="font-size:8px; font-weight:bold; color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%;">${cardData.name}</div>
              <div style="font-size:7px; color:#94a3b8; font-family:monospace; background:rgba(0,0,0,0.4); border-radius:3px; padding:1px 5px;">Owned: ${ownedCount}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  overlay.innerHTML = `
      <div style="text-align:center; max-width:650px; width:95%; animation: toastFadeIn 0.3s ease-out;">
        <h2 style="margin:0 0 4px 0; color:#ffd700; letter-spacing:3px; text-transform:uppercase; font-size:18px; text-shadow:0 0 10px rgba(241,196,15,0.3);">✦ BOOSTER UNBOXED! ✦</h2>
        <div style="font-size:10px; color:#94a3b8; margin-bottom:15px; text-transform:uppercase; letter-spacing:0.8px;">Tap each card to break the runic seal</div>

        <div class="unboxing-grid">
          ${cardsHtml}
        </div>

        <div class="collect-btn-container" id="collect-btn-container" style="margin-top:15px;">
          <button onclick="document.getElementById('card-opening-overlay').remove(); window.isGamePaused=false; window.updateUI();" style="background:#ffd700; color:#111; border:none; padding:10.5px 24px; font-weight:bold; font-size:11px; border-radius:4px; cursor:pointer; box-shadow:0 0 12px rgba(241,196,15,0.4); text-transform:uppercase; letter-spacing:1px; width:100%; max-width:260px;">Store in Album</button>
        </div>
      </div>
    `;

  let flippedCount = 0;
  window.flipUnboxedCard = function (el, idx) {
    if (el.classList.contains("flipped")) return;
    el.classList.add("flipped");

    if (
      window.SoundManager &&
      typeof window.SoundManager.playClick === "function"
    ) {
      window.SoundManager.playClick();
    }

    flippedCount++;
    if (flippedCount >= 5) {
      let collectContainer = document.getElementById("collect-btn-container");
      if (collectContainer) {
        collectContainer.classList.add("show");
      }
    }
  };
};

window.loadGame = function () {
  try {
    let saved = localStorage.getItem("extraction_crawler_save");
    if (!saved) return;
    let parsed = JSON.parse(saved);
    if (!parsed) return;

    if (parsed.playerStats) {
      Object.assign(window.playerStats, parsed.playerStats);

      // Ensure stage and lifetimePeakStage are synchronized with maxFloorCleared
      let maxClearedFloor = window.playerStats.maxFloorCleared || 1;
      window.playerStats.stage = Math.max(
        window.playerStats.stage || 1,
        maxClearedFloor,
      );
      window.playerStats.lifetimePeakStage = Math.max(
        window.playerStats.lifetimePeakStage || 1,
        maxClearedFloor,
      );

      // Safe Migration for Phase 2 Trackers
      window.playerStats.floorActiveTicks =
        window.playerStats.floorActiveTicks || 0;
      window.playerStats.kineticFrictionCharges =
        window.playerStats.kineticFrictionCharges || 0;
      window.playerStats.kineticDistanceTraveled =
        window.playerStats.kineticDistanceTraveled || 0;
      window.playerStats.kineticStillTimer =
        window.playerStats.kineticStillTimer || 0;
      window.playerStats.combatTimer = window.playerStats.combatTimer || 0;
      window.playerStats.tenacityStacks =
        window.playerStats.tenacityStacks || 0;
      window.playerStats.activeCombatTicks =
        window.playerStats.activeCombatTicks || 0;
      window.playerStats.outOfCombatTicks =
        window.playerStats.outOfCombatTicks || 0;
      window.playerStats.overshieldConsumed =
        window.playerStats.overshieldConsumed || 0;
      window.playerStats.nexusTomeShieldTimer =
        window.playerStats.nexusTomeShieldTimer || 0;

      window.playerStats.recoveryLoot = parsed.playerStats.recoveryLoot || null;
      window.playerStats.monsterCards = parsed.playerStats.monsterCards || {};
      window.playerStats.astralDust = parsed.playerStats.astralDust || 0;
      window.playerStats.hasTriggeredOnslaughtUnlock =
        parsed.playerStats.hasTriggeredOnslaughtUnlock || false;
      window.playerStats.isCrucibleMode =
        parsed.playerStats.isCrucibleMode || false;

      // Subphase 13: Safely Hydrate Active Special Challenge BigNum Rewards
      if (
        window.playerStats.activeSpecialChallenge &&
        window.playerStats.activeSpecialChallenge.rewards
      ) {
        let r = window.playerStats.activeSpecialChallenge.rewards;
        if (r.gold) r.gold = BigNum.from(r.gold);
        if (r.xp) r.xp = BigNum.from(r.xp);
      }
      window.playerStats.crucibleWave = parsed.playerStats.crucibleWave || 1;
      window.playerStats.cruciblePeak = parsed.playerStats.cruciblePeak || 0;
      window.playerStats.crucibleDraftDeck =
        parsed.playerStats.crucibleDraftDeck || [];
      window.playerStats.astralShards = parsed.playerStats.astralShards || 0;
      window.playerStats.crucibleAccumulatedShards =
        parsed.playerStats.crucibleAccumulatedShards || 0;
      window.playerStats.crucibleAccumulatedCores =
        parsed.playerStats.crucibleAccumulatedCores || 0;
      window.playerStats.crucibleAccumulatedLoot =
        parsed.playerStats.crucibleAccumulatedLoot || [];
      window.playerStats.crucibleStartWave =
        parsed.playerStats.crucibleStartWave || 1;
      window.playerStats.crucibleActiveTab =
        parsed.playerStats.crucibleActiveTab || "setup";
      window.playerStats.pendingCrucibleDrafts =
        parsed.playerStats.pendingCrucibleDrafts || 0;

      // Backward Compatibility Migration: convert real-time timers to run charges
      const potKeys = ["atk", "hp", "def", "haste", "xp", "drop", "qly"];
      potKeys.forEach((key) => {
        let timerKey = key + "PotionTimer";
        let runKey = key + "PotionRuns";
        if (
          window.playerStats[runKey] === undefined ||
          window.playerStats[runKey] === null
        ) {
          let timerVal = window.playerStats[timerKey] || 0;
          window.playerStats[runKey] =
            timerVal > 0 ? Math.max(1, Math.ceil(timerVal / 18000)) : 0;
        }
        window.playerStats[timerKey] = 0;
      });

      window.playerStats.xp = BigNum.from(window.playerStats.xp || 0);
      window.playerStats.xpReq = BigNum.from(window.playerStats.xpReq || 350);
      window.playerStats.currentHp = BigNum.from(
        window.playerStats.currentHp || 100,
      );
      window.playerStats.coins = BigNum.from(window.playerStats.coins || 0);
      window.playerStats.runGold = BigNum.from(window.playerStats.runGold || 0);

      if (
        window.playerStats.recoveryLoot &&
        window.playerStats.recoveryLoot.gold
      ) {
        window.playerStats.recoveryLoot.gold = BigNum.from(
          window.playerStats.recoveryLoot.gold,
        );
      }

      // Fallback initializer for Boss Kill progress tracking
      window.playerStats.bossKillRegistry = window.playerStats
        .bossKillRegistry || {
        arachnid_treant: 0,
        aegis_goliath: 0,
        chronos_arbitrator: 0,
        nexus_overseer: 0,
        gilded_vault_keeper: 0,
        corrosive_abomination: 0,
        hooktail: 0,
        overlord_iron_vault: 0,
      };

      // Fallback initializers for separate Utility SP
      if (window.playerStats.usp === undefined) {
        window.playerStats.usp = 0;
      }

      // Fallback initializers for Artifact Codex properties
      if (window.playerStats.activeRelics === undefined) {
        window.playerStats.activeRelics = [];
      }
      if (window.playerStats.artifactCodex === undefined) {
        window.playerStats.artifactCodex = {};
      }

      // Fallback initializers for Special Challenges and Bounty Boards
      if (window.playerStats.activeSpecialChallenge === undefined) {
        window.playerStats.activeSpecialChallenge = null;
      }
      if (window.playerStats.bountyRerollsToday === undefined) {
        window.playerStats.bountyRerollsToday = 0;
      }
      if (window.playerStats.abyssalDecayAccumulated === undefined) {
        window.playerStats.abyssalDecayAccumulated = 0;
      }

      // Backward Compatibility: Migrate legacy slot attunement or reforge quests
      let hasLegacyDailies =
        window.playerStats.dailyMissions &&
        window.playerStats.dailyMissions.some(
          (m) => m.type === "tempers" || m.type === "reforges",
        );
      let hasLegacyWeeklies =
        window.playerStats.weeklyMissions &&
        window.playerStats.weeklyMissions.some(
          (m) => m.type === "tempers" || m.type === "reforges",
        );

      if (
        hasLegacyDailies ||
        !window.playerStats.dailyMissions ||
        window.playerStats.dailyMissions.length === 0
      ) {
        window.QuestSystem.generateDailyMissions();
      }
      if (
        hasLegacyWeeklies ||
        (window.isWeeklyQuestUnlocked() &&
          (!window.playerStats.weeklyMissions ||
            window.playerStats.weeklyMissions.length === 0))
      ) {
        window.QuestSystem.generateWeeklyMissions();
      }

      // Safely hydrate serialized BigNum rewards back into live instances
      if (window.playerStats.dailyMissions) {
        window.playerStats.dailyMissions.forEach((m) => {
          if (m.goldReward) m.goldReward = BigNum.from(m.goldReward);
          if (m.xpReward) m.xpReward = BigNum.from(m.xpReward);
        });
      }
      if (window.playerStats.weeklyMissions) {
        window.playerStats.weeklyMissions.forEach((m) => {
          if (m.goldReward) m.goldReward = BigNum.from(m.goldReward);
          if (m.xpReward) m.xpReward = BigNum.from(m.xpReward);
        });
      }

      // Fallback initializers for Field Flask properties
      if (window.playerStats.maxFlaskCharges === undefined)
        window.playerStats.maxFlaskCharges = 1;
      if (window.playerStats.flaskCharges === undefined)
        window.playerStats.flaskCharges = window.playerStats.maxFlaskCharges;
      if (window.playerStats.flaskPotency === undefined)
        window.playerStats.flaskPotency = 0.25;
      if (window.playerStats.flaskCooldownTimer === undefined)
        window.playerStats.flaskCooldownTimer = 0;
      if (window.playerStats.flaskX === undefined)
        window.playerStats.flaskX = null;
      if (window.playerStats.flaskY === undefined)
        window.playerStats.flaskY = null;
      window.playerStats.totalGoldEarned = BigNum.from(
        window.playerStats.totalGoldEarned || 0,
      );

      // Fallback initializers for Subweapon Mastery
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
      const defaultNodes = [
        "shield_spiked_rim",
        "shield_iron_wall",
        "shield_impact_tremor",
        "shield_fortified_guard",
        "shield_retaliatory_strike",
        "shield_aegis_pulse",
        "shield_keystone_colossus",
        "shield_keystone_reflect",
        "dagger_lethal_precision",
        "dagger_vipers_coating",
        "dagger_shadow_step",
        "dagger_expose_weakness",
        "dagger_shadow_flurry",
        "dagger_sanguine_rupture",
        "dagger_keystone_assassin",
        "dagger_keystone_duellist",
        "tome_empowered_catalysts",
        "tome_runic_barrier",
        "tome_elemental_overload",
        "tome_arcane_syphon",
        "tome_barrier_shatter",
        "tome_spell_weaving",
        "tome_keystone_triad",
        "tome_keystone_singularity",
      ];
      defaultNodes.forEach((nodeId) => {
        if (window.playerStats.subweaponMastery.nodes[nodeId] === undefined) {
          window.playerStats.subweaponMastery.nodes[nodeId] = 0;
        }
      });

      // Backfill starting stage checkpoints for beaten boss/mini-boss floors
      let maxCleared = window.playerStats.maxFloorCleared || 0;
      let checkpoints = new Set(window.playerStats.unlockedCheckpoints || [1]);
      checkpoints.add(1);
      for (let f = 4; f <= maxCleared; f += 4) {
        checkpoints.add(f + 1);
      }
      window.playerStats.unlockedCheckpoints = Array.from(checkpoints)
        .filter(window.isValidCheckpoint)
        .sort((a, b) => a - b);
    }

    if (parsed.equippedSlots) {
      window.equippedSlots = parsed.equippedSlots;

      // Safe Migration: Unequip physical artifacts from art1, art2, art3 slots on load and deposit in bag/stash
      const relicSlots = ["art1", "art2", "art3"];
      let migratedAny = false;
      relicSlots.forEach((slotKey) => {
        let item = window.equippedSlots[slotKey];
        if (item) {
          delete item.isEquippedSlot;
          if (!window.inventory) {
            window.inventory = {
              EQUIP: [],
              ARTIFACT: [],
              SIGIL: [],
              ETC: {},
              USE: {},
            };
          }
          if (!window.inventory.ARTIFACT) {
            window.inventory.ARTIFACT = [];
          }
          window.inventory.ARTIFACT.push(item);
          window.equippedSlots[slotKey] = null;
          migratedAny = true;
        }
      });

      if (migratedAny && typeof window.saveGame === "function") {
        window.saveGame();
      }
    }

    // Safe Skill Tree Migration & Fallback Initialization
    if (window.playerStats.activeStarterSubweapon === undefined) {
      window.playerStats.activeStarterSubweapon = "none";
    }
    if (!window.playerStats.skillTree) {
      window.playerStats.skillTree = {};
    }

    if (parsed.inventory) {
      window.inventory = parsed.inventory;
      if (typeof window.hydrateCavernSigils === "function") {
        window.hydrateCavernSigils();
      }
    }

    // Merge Stash and Inventory EQUIP arrays cleanly to prevent empty array overwrites
    let itemMap = new Map();
    let savedEquip = (window.inventory && window.inventory.EQUIP) || [];
    let savedStash = parsed.stash || [];

    savedEquip.forEach((item) => {
      if (item && item.id !== undefined) itemMap.set(item.id, item);
    });
    savedStash.forEach((item) => {
      if (item && item.id !== undefined && !itemMap.has(item.id))
        itemMap.set(item.id, item);
    });

    let mergedItems = Array.from(itemMap.values());
    if (!window.inventory)
      window.inventory = {
        EQUIP: [],
        ARTIFACT: [],
        SIGIL: [],
        ETC: {},
        USE: {},
      };
    window.inventory.EQUIP = mergedItems;

    if (window.player) {
      window.player.stash = window.inventory.EQUIP;
      if (parsed.bag && Array.isArray(parsed.bag)) {
        window.player.bag = parsed.bag;
      }
      window.player.pendingScraps = parsed.pendingScraps || {};
    }

    if (typeof window.recalculateItemStats === "function") {
      let allItems = [
        ...Object.values(window.equippedSlots || {}),
        ...(window.inventory?.EQUIP || []),
        ...(window.inventory?.ARTIFACT || []),
        ...(window.player?.stash || []),
        ...(window.player?.bag || []),
      ];
      allItems.forEach((item) => {
        if (item && typeof item === "object" && item.type) {
          window.recalculateItemStats(item);
        }
      });
    }

    if (typeof window.invalidatePlayerStats === "function") {
      window.invalidatePlayerStats();
    }
    if (typeof window.updateUI === "function") {
      window.updateUI();
    }
  } catch (err) {
    console.warn("Failed to load game from localStorage:", err);
  }
};

// Auto-load saved state on boot
window.loadGame();

window.calculateCumulativeOnslaughtShards = function (startWave) {
  let totalShards = 0;
  let totalGold = 0;
  let totalXp = 0;

  for (let w = 1; w < startWave; w++) {
    totalShards += Math.floor(5 * Math.pow(w, 1.15));
    totalGold += Math.floor(100 * Math.pow(w, 1.25));
    totalXp += Math.floor(250 * Math.pow(w, 1.1));
  }

  return {
    shards: Math.floor(totalShards * 0.7),
    gold: Math.floor(totalGold * 0.7),
    xp: Math.floor(totalXp * 0.7),
  };
};
window.changeOnslaughtStartWave = function (waveVal) {
  window.playerStats.crucibleStartWave = parseInt(waveVal, 10) || 1;
  window.renderDeploymentModal();
};

window.renderDeploymentModal = function () {
  if (typeof window.renderDeploymentModal === "function") {
    // Falls back seamlessly to the fully unified version loaded in main.js
    window.renderDeploymentModal();
  }
};
