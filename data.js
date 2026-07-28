/* ==========================================================================
   PRIMARY PURPOSE: Stores global game state, constant dictionaries,
   initial global state, and system utility functions.
   ========================================================================= */

window.GAME_VERSION = 1.0; // Release Version 1.0.00
window.MIN_COMPATIBLE_VERSION = 1.0; // Hard reset epoch threshold

window.BigNumMin = function (a, b) {
  let ba = BigNum.from(a);
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

// Global Custom Confirmation Modal Handler
window.showCustomConfirm = function (title, message, confirmText, cancelText, color, onConfirm) {
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

window.getMilestoneMultiplier = function (level) {
  let milestones = Math.floor(level / 10);
  // Asymptotic square-root scaling dampens late-game stat inflation while preserving milestone achievements
  return 1.0 + Math.sqrt(milestones) * 0.25;
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
        window.playerStats.sp += 3; // Award 3 SP per peak level

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
          `<strong style="color:#d946ef;">LEVEL UP! Reached Level ${window.playerStats.level}! (+3 SP)</strong>`,
        );
      }
      if (typeof window.pushHeaderToast === "function") {
        window.pushHeaderToast(
          `Level Up! Reached Level ${window.playerStats.level}! (+3 SP)`,
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
          "+3 SP AVAILABLE",
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
    window.playerStats.coins = BigNum.from(window.playerStats.coins).add(amt);
    window.playerStats.totalGoldEarned = BigNum.from(
      window.playerStats.totalGoldEarned || 0,
    ).add(amt);

    if (isDungeon) {
      window.playerStats.dungeonAccumulatedGold =
        (window.playerStats.dungeonAccumulatedGold || 0) + amount;
    }

    if (window.playerStats.runGold !== undefined) {
      window.playerStats.runGold += amount;
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
  if (ach.reqType === "kills") return window.playerStats.totalLifetimeKills || 0;
  if (ach.reqType === "floor") return window.playerStats.maxFloorCleared || 0;
  if (ach.reqType === "gold") return window.playerStats.totalGoldEarned || 0;
  if (ach.reqType === "extract") return window.playerStats.successfulExtractions || 0;
  if (ach.reqType === "salvage") return window.playerStats.itemsSalvaged || 0;
  if (ach.reqType === "temper") return window.playerStats.totalTempers || 0;
  if (ach.reqType === "reforges") return window.playerStats.totalReforges || 0;
  if (ach.reqType === "enchant") return window.playerStats.totalEnchants || 0;
  if (ach.reqType === "deflections") return window.playerStats.totalDeflections || 0;
  if (ach.reqType === "rare_spawns") return window.playerStats.rareSpawnsSlain || 0;
  if (ach.reqType === "single_hit") return window.playerStats.peakSingleHit || 0;
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
      const slots = ["weapon", "subweapon", "helmet", "chest", "leggings", "overall", "boots"];
      slots.forEach((s) => {
        let item = window.equippedSlots[s];
        if (item && window.getItemSetName) {
          let setName = window.getItemSetName(item);
          if (setName) {
            setCounts[setName] = (setCounts[setName] || 0) + (s === "overall" ? 2 : 1);
          }
        }
      });
      return Object.values(setCounts).some((count) => count >= 3) ? 1 : 0;
    }
    if (ach.id === "sing_golden_touch") {
      if (!window.equippedSlots) return 0;
      let arts = [window.equippedSlots.art1, window.equippedSlots.art2, window.equippedSlots.art3];
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
      return (hr >= 0 && hr < 4) && window.playerStats.hasTriggeredNightOwl ? 1 : 0;
    }
    if (ach.id === "sing_early_bird") {
      let hr = new Date().getHours();
      return (hr >= 5 && hr < 8) && window.playerStats.hasTriggeredEarlyBird ? 1 : 0;
    }
    if (ach.id === "sing_weekend_warrior") {
      let day = new Date().getDay();
      return (day === 0 || day === 6) && window.playerStats.hasTriggeredWeekendWarrior ? 1 : 0;
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
    window.playerStats.isDungeonMode &&
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
  if (!window.equippedSlots) return false;
  return (
    (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait) ||
    (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait) ||
    (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
  );
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

window.getArtifactTemperLevel = function (trait) {
  if (!window.equippedSlots) return 0;
  if (window.equippedSlots.art1 && window.equippedSlots.art1.trait === trait)
    return window.equippedSlots.art1.temperLevel || 0;
  if (window.equippedSlots.art2 && window.equippedSlots.art2.trait === trait)
    return window.equippedSlots.art2.temperLevel || 0;
  if (window.equippedSlots.art3 && window.equippedSlots.art3.trait === trait)
    return window.equippedSlots.art3.temperLevel || 0;
  return 0;
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

    window.player.atk =
      resolved.atk && resolved.atk.valueOf
        ? resolved.atk.valueOf()
        : Number(resolved.atk || 15);
    window.player.def =
      resolved.def && resolved.def.valueOf
        ? resolved.def.valueOf()
        : Number(resolved.def || 5);
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
  p.moveSpeed += aT.moveSpeed;
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

  let achAtkPct = 1.0 + aT.atkPct;
  let achMaxHpPct = 1.0 + aT.maxHpPct;
  let achDefPct = 1.0 + aT.defPct;
  let achMoveSpeedPct = 1.0 + aT.moveSpeedPct;
  let achStrPct = 1.0 + aT.strPct;
  let achDexPct = 1.0 + aT.dexPct;
  let achIntPct = 1.0 + aT.intPct;

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

  // Apply active run-only Crucible Draft deck modifiers
  if (
    window.playerStats.isCrucibleMode &&
    window.playerStats.crucibleDraftDeck
  ) {
    window.playerStats.crucibleDraftDeck.forEach((cardId) => {
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
        p.moveSpeed += slotLvl * 2;
      }

      // Flat item stats (safely handled regardless of source type)
      flatGearAtk = flatGearAtk.add(BigNum.from(item.atk || 0).mul(slotMult));
      flatGearHp = flatGearHp.add(BigNum.from(item.maxHp || 0).mul(slotMult));
      flatGearDef = flatGearDef.add(BigNum.from(item.def || 0).mul(slotMult));
      p.moveSpeed += (item.moveSpeed || 0) * slotMult;

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
  p.moveSpeed += setCtx.moveSpeed;
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
  p.moveSpeed += effectiveDex * 1.0; // +1 Move Speed per point

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
    .add(Math.max(0, allocInt) * 1);

  p.atk = baseCharAtk.add(flatGearAtk);
  p.maxHp = baseCharHp.add(flatGearHp);
  let flatTotalDef = baseCharDef
    .add(flatGearDef)
    .add(BigNum.from(setCtx.flatDefBonus));

  // Suffixes multipliers applied on total flat base
  p.atk = p.atk.mul(1.0 + itemAtkPct).mul(achAtkPct);
  p.maxHp = p.maxHp.mul(1.0 + itemHpPct).mul(achMaxHpPct);
  p.moveSpeed =
    p.moveSpeed *
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
      if (shieldDefRank > 0) p.defPctBonus = (p.defPctBonus || 0) + shieldDefRank * 0.03;

      let spikedRimRank = st.getSkillLevel("shield_spiked_rim");
      if (spikedRimRank > 0) {
        p.reflectDamage = [0.60, 0.80, 1.00][spikedRimRank - 1];
      }

      let ironWallRank = st.getSkillLevel("shield_iron_wall");
      if (ironWallRank > 0) {
        p.block += ironWallRank * 0.01; // Restored +1% Block Rate per rank
        p.blockCapBonus = (p.blockCapBonus || 0) + ironWallRank * 0.02; // Restored Block Cap expansion
      }

      let impactTremorRank = st.getSkillLevel("shield_impact_tremor");
      if (impactTremorRank > 0) {
        p.hasImpactTremor = true;
        p.impactTremorChance = impactTremorRank * 0.20;
      }

      let fortifiedGuardRank = st.getSkillLevel("shield_fortified_guard");
      if (fortifiedGuardRank > 0) {
        p.fortifiedGuardMultiplier = fortifiedGuardRank * 0.04;
      }

      let shieldFortitudeRank = st.getSkillLevel("shield_fortitude");
      if (shieldFortitudeRank > 0) {
        p.blockMitigationBonus = shieldFortitudeRank * 0.10; // Restored -10% damage taken on block per rank
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
        p.reflectDamage = 1.80;
      }

      // --- DAGGER MASTERY (SHADOW & VENOM TREE) ---
      let daggerCritRank = st.getSkillLevel("dagger_crit");
      if (daggerCritRank > 0) p.critChance += daggerCritRank * 0.015; // Restored Crit Chance bonus

      let daggerCritDmgRank = st.getSkillLevel("dagger_crit_dmg");
      if (daggerCritDmgRank > 0) p.critDamage += daggerCritDmgRank * 0.06; // Restored Crit Damage multiplier

      let lethalPrecisionRank = st.getSkillLevel("dagger_lethal_precision");
      if (lethalPrecisionRank > 0) {
        p.offhandChance = [0.48, 0.56, 0.65][lethalPrecisionRank - 1];
        p.offhandDmg = [0.40, 0.48, 0.55][lethalPrecisionRank - 1];
        p.flurryDamageBonus = lethalPrecisionRank * 0.10; // Restored +10% Offhand Flurry damage per rank
      }

      let vipersCoatingRank = st.getSkillLevel("dagger_vipers_coating");
      if (vipersCoatingRank > 0) {
        p.hasViperCoating = true;
        p.viperPoisonStrength = vipersCoatingRank * 0.10;
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
        p.riposteDamage = (p.riposteDamage || 0.8) + shadowStepRank * 0.20; // Restored +20% Riposte Damage per rank
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
        p.sanguineRuptureMult = SanguineRuptureRank * 1.50;
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
        p.spellChance = [0.40, 0.45, 0.50][empoweredCatalystsRank - 1];
        p.spellPower = [1.75, 2.00, 2.25][empoweredCatalystsRank - 1];
      }

      let runicShieldingRank = st.getSkillLevel("tome_runic_barrier");
      if (runicShieldingRank > 0 && p.arcaneBarrier > 0) {
        p.arcaneBarrier = [0.24, 0.28, 0.32][runicShieldingRank - 1];
        p.arcaneBarrierCap = 0.40;
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
        p.moveSpeed += utilityVitalityRank * 2.0;
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
      let multiplier = window.playerStats.fortitudeStacks * (p.fortifiedGuardMultiplier || 0.04);
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
      let multiplier = window.playerStats.syphonIntStacks * ((p.arcaneSyphonLevel || 1) * 0.04);
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
      let extraPower = window.playerStats.spellWeavingStacks * (p.spellWeavingPower || 0.15);
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
        p.moveSpeed *= (1.0 + lvl * 0.15);
        activeSpeedPct += lvl * 0.10;
        idleSpeedPct += lvl * 0.10;
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
      if (b.id === "swift_strikes") {
        p.idleAttackSpeed = Math.max(10, Math.round(p.idleAttackSpeed / 1.25));
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
    });

    if (!(window.playerStats.purifiedAegisTimer > 0)) {
      activeSig.debuffs.forEach((d) => {
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
    p.moveSpeed += Math.ceil(3 * tier * potStrengthMultiplier);
    activeSpeedPct += 0.1 * tier * potStrengthMultiplier;
    idleSpeedPct += 0.1 * tier * potStrengthMultiplier;
  }

  if (hasDropPot) {
    p.drop += 1.0 * potStrengthMultiplier;
  }
  if (hasQlyPot) {
    p.qly += 0.5 * potStrengthMultiplier;
  }

  if (window.checkArtifactTrait("move_speed")) p.moveSpeed += 10;
  if (window.checkArtifactTrait("gold_hoard")) p.gold += 0.5;
  if (window.checkArtifactTrait("idle_spd")) idleSpeedPct += 0.35;
  if (window.checkArtifactTrait("active_spd")) activeSpeedPct += 0.25;

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

  let maxBlockCap = 0.2;
  let maxParryCap = 0.15;

  let subItem = window.equippedSlots ? window.equippedSlots.subweapon : null;
  let hasShield =
    subItem && (subItem.subType === "shield" || subItem.type === "shield");
  let hasDagger =
    subItem && (subItem.subType === "dagger" || subItem.type === "dagger");
  let hasTitanGrip =
    window.checkArtifactTrait && window.checkArtifactTrait("titan_grip");

  if (hasShield) {
    maxBlockCap = hasTitanGrip ? 0.25 : 0.2;
  } else if (hasTitanGrip) {
    maxBlockCap = 0.1;
  } else {
    p.block = 0.0;
  }

  if (hasDagger) {
    let noun = subItem.noun ? subItem.noun.toLowerCase() : "";
    if (noun.includes("main-gauche")) {
      maxParryCap = hasTitanGrip ? 0.35 : 0.3;
    } else {
      maxParryCap = hasTitanGrip ? 0.3 : 0.15;
    }
  } else if (hasTitanGrip) {
    maxParryCap = 0.08;
  } else {
    p.parry = 0.0;
  }

  maxBlockCap += p.crucibleCapBonus || 0;
  maxParryCap += p.crucibleCapBonus || 0;

  p.rawBlock = p.block;
  p.rawParry = p.parry;

  if (p.block > maxBlockCap) p.block = maxBlockCap;
  if (p.parry > maxParryCap) p.parry = maxParryCap;

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
  expBonusMult += wisdom * 0.01;

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
      p.atk = p.atk.add(Math.round(defVal * 0.40));
    }
    if (p.hasAethericSingularity) {
      p.atk = p.atk.add(Math.round(p.int * 0.80));
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
  let pStats =
    typeof window.resolvePlayerStats === "function"
      ? window.resolvePlayerStats()
      : {};

  // Step 1: Arcane Barrier Absorption (Tomes)
    let absorbed = 0;
    if (pStats.arcaneBarrier && pStats.arcaneBarrier > 0) {
      absorbed = Math.floor(rawDmg * pStats.arcaneBarrier);
      if (absorbed > 0) {
        // Gain +10 Tome Mastery XP on Arcane Barrier Absorption
        if (window.gainSubweaponXp) window.gainSubweaponXp("tome", 10);

        // Barrier Shatter accumulated charge check
        if (pStats.hasBarrierShatter) {
          window.playerStats.barrierAbsorbedDmg = (window.playerStats.barrierAbsorbedDmg || 0) + absorbed;
          if (window.playerStats.barrierAbsorbedDmg >= p.maxHp) {
            window.playerStats.barrierAbsorbedDmg = 0; // consume
            let intVal = pStats.int || 5;
            let shatterDmg = BigNum.from(intVal).mul(2.50);
            if (window.activeDungeonMobs) {
              window.activeDungeonMobs.forEach((otherMob) => {
                if (Math.hypot(p.x - (otherMob.x + otherMob.w / 2), p.y - (otherMob.y + otherMob.h / 2)) <= 100) {
                  otherMob.hp = otherMob.hp.sub(shatterDmg);
                  otherMob.flashTimer = 8;
                  if (window.combatVisuals) {
                    window.combatVisuals.spawnDamageEffect(otherMob.x + otherMob.w / 2, otherMob.y + otherMob.h / 2, shatterDmg, "crit", false);
                  }
                }
              });
            }
            if (window.combatVisuals) {
              window.combatVisuals.spawnParticles(p.x, p.y, 25, "void_orb", 5);
              window.combatVisuals.triggerScreenShake(6, 12);
            }
            if (typeof window.spawnFloatingText === "function") {
              window.spawnFloatingText(p.x, p.y - 25, "BARRIER SHATTER DETONATION!", "#9b59b6", true);
            }
          }
        }

        if (window.SoundManager) window.SoundManager.play("spell");
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
  let netDmg = Math.max(1, remainingDmg - (pStats.def || 0));

  // Step 2: Parry Check (Daggers)
     if (pStats.parry && Math.random() < pStats.parry) {
       if (window.checkArtifactTrait && window.checkArtifactTrait("dodge_buff")) {
         window.playerStats.adrenalineTimer = 360;
       }

       // Gain +25 Dagger Mastery XP on Parry
       if (window.gainSubweaponXp) window.gainSubweaponXp("dagger", 25);

       let parryMitigation = pStats.hasMasterDuellist ? 1.0 : (pStats.parryMitigation || 0.6);
       let parriedDmg = Math.max(0, Math.round(netDmg * (1.0 - parryMitigation)));
       p.hp = Math.max(0, p.hp - parriedDmg);
       p.lastDamageTimer = 180;
       window.playerStats.totalDeflections = (window.playerStats.totalDeflections || 0) + 1;

       if (pStats.hasMasterDuellist) {
         window.playerStats.shadowDecoyTimer = 240; // Spawn Shadow Decoy (4 seconds)
         if (typeof window.spawnFloatingText === "function") {
           window.spawnFloatingText(p.x, p.y - 25, "SHADOW DECOY SUMMONED!", "#a855f7");
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

       if (sourceMob && sourceMob.hp && sourceMob.hp.gt && sourceMob.hp.gt(0)) {
         // Sanguine Rupture Dot explosion detonation on parry
         if (pStats.hasSanguineRupture && ((sourceMob.bleedStacks || 0) > 0 || (sourceMob.poisonStacks || 0) > 0)) {
           let dotCount = (sourceMob.bleedStacks || 0) + (sourceMob.poisonStacks || 0);
           let detonationDmg = BigNum.from(pStats.atk || 15).mul(dotCount).mul(pStats.sanguineRuptureMult || 1.50);
           sourceMob.hp = sourceMob.hp.sub(detonationDmg);
           sourceMob.bleedStacks = 0; // consume
           sourceMob.poisonStacks = 0; // consume
           sourceMob.flashTimer = 8;
           let mobCx = sourceMob.x + sourceMob.w / 2;
           let mobCy = sourceMob.y + sourceMob.h / 2;
           if (window.combatVisuals) {
             window.combatVisuals.spawnDamageEffect(
               mobCx,
               mobCy,
               detonationDmg,
               "crit",
               true,
               sourceMob
             );
             window.combatVisuals.spawnParticles(mobCx, mobCy, 20, "magma_elemental", 4);
           }
           if (window.SoundManager && typeof window.SoundManager.play === "function") {
             window.SoundManager.play("spell_fire");
           }
         }

         let riposteDmg = BigNum.from(pStats.atk || 15).mul(
           pStats.riposteDamage || 0.8,
         );
         sourceMob.hp = sourceMob.hp.sub(riposteDmg);
         sourceMob.flashTimer = 6;
         let mobCx = sourceMob.x + sourceMob.w / 2;
         let mobCy = sourceMob.y + sourceMob.h / 2;
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
        if (pStats.block && Math.random() < pStats.block) {
          if (window.checkArtifactTrait && window.checkArtifactTrait("dodge_buff")) {
            window.playerStats.adrenalineTimer = 360;
          }

          // Gain +15 Shield Mastery XP on Block
          if (window.gainSubweaponXp) window.gainSubweaponXp("shield", 15);

          // Fortitude stack acquisition on block / damage
          if (pStats.fortifiedGuardMultiplier > 0) {
            window.playerStats.fortitudeStacks = Math.min(5, (window.playerStats.fortitudeStacks || 0) + 1);
            window.playerStats.fortitudeTimer = 360; // 6 seconds
          }

          p.lastDamageTimer = 180;
          window.playerStats.totalDeflections = (window.playerStats.totalDeflections || 0) + 1;

          if (window.SoundManager) window.SoundManager.play("block");

          let baseMitigation = 0.70 + (pStats.blockMitigationBonus || 0); // Applies restored Fortified Stance 10%-30% block mitigation bonus
          let blockMitigation = pStats.hasColossusKeystone ? 1.0 : Math.min(0.95, baseMitigation);
      let blockedDmg = Math.max(0, Math.round(netDmg * (1.0 - blockMitigation)));
      let savings = netDmg - blockedDmg;
      p.hp = Math.max(0, p.hp - blockedDmg);

      if (pStats.hasColossusKeystone && savings > 0) {
        window.playerStats.colossusApBonus = (window.playerStats.colossusApBonus || 0) + Math.round(savings * 0.1);
        window.playerStats.colossusApTimer = 600; // 10s at 60 FPS
      }

      if (pStats.hasAegisPulse) {
        window.playerStats.aegisPulseCount = (window.playerStats.aegisPulseCount || 0) + 1;
        if (window.playerStats.aegisPulseCount >= 5) {
          window.playerStats.aegisPulseCount = 0;
          let healAmt = Math.round(p.maxHp * pStats.aegisPulseHeal);
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          if (typeof window.spawnFloatingText === "function") {
            window.spawnFloatingText(p.x, p.y - 20, `+${healAmt} HP (AEGIS PULSE)`, "#2ecc71", true);
          }
          if (window.combatVisuals) {
            window.combatVisuals.spawnParticles(p.x, p.y, 15, "slag_slime", 3);
          }
        }
      }

      if (pStats.hasRetaliatoryStrike) {
        window.playerStats.retaliatoryStrikeActive = true;
      }

      if (pStats.hasImpactTremor && Math.random() < pStats.impactTremorChance) {
        let shockwaveDmg = BigNum.from(pStats.def || 5).mul(1.20);
        if (window.activeDungeonMobs) {
          window.activeDungeonMobs.forEach((m) => {
            let dist = Math.hypot(p.x - (m.x + m.w / 2), p.y - (m.y + m.h / 2));
            if (dist <= 75) {
              m.hp = m.hp.sub(shockwaveDmg);
              m.flashTimer = 8;
              let dx = (m.x + m.w / 2) - p.x;
              let dy = (m.y + m.h / 2) - p.y;
              let dDist = Math.hypot(dx, dy);
              if (dDist > 0) {
                m.recoilX = (dx / dDist) * 12;
                m.recoilY = (dy / dDist) * 12;
              }
              if (window.combatVisuals) {
                window.combatVisuals.spawnDamageEffect(m.x + m.w / 2, m.y + m.h / 2, shockwaveDmg, "counter", false);
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

      if (sourceMob && sourceMob.hp && sourceMob.hp.gt && sourceMob.hp.gt(0)) {
        // Gain +10 Shield Mastery XP on Shield Bash reflect
        if (window.gainSubweaponXp) window.gainSubweaponXp("shield", 10);

        let defBash = BigNum.from(pStats.def || 5).mul(
          pStats.reflectDamage || 1.0,
        );
        let atkBash = BigNum.from(pStats.atk || 15).mul(pStats.bashAtkBonus || 0);
        let reflectDmg = defBash.add(atkBash);

        if (reflectDmg.gt(0)) {
          sourceMob.hp = sourceMob.hp.sub(reflectDmg);
          sourceMob.flashTimer = 6;
          if (window.combatVisuals) {
            window.combatVisuals.spawnDamageEffect(
              sourceMob.x + sourceMob.w / 2,
              sourceMob.y + sourceMob.h / 2,
              reflectDmg,
              "counter",
              false,
              sourceMob,
            );
          }
        }
      }

    // Shield Keystone: Unbreakable Bulwark AoE Shockwave on Block
    if (
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
    p.lastDamageTimer = 180;
    window.spawnFloatingText(p.x, p.y - 15, `-${finalDmg}`, "#e74c3c");

    // Crown of Tempests Thunderbolt Counter
    if (window.hasUniquePassive && window.hasUniquePassive("helmet_tempest") && Math.random() < 0.15 && sourceMob && sourceMob.hp) {
      let boltDmg = BigNum.from(pStats.atk || 15).mul(1.5);
      sourceMob.hp = sourceMob.hp.sub(boltDmg);
      sourceMob.flashTimer = 8;
      sourceMob.attackCooldown = 90;
      let mobCx = sourceMob.x + (sourceMob.w || 24) / 2;
      let mobCy = sourceMob.y + (sourceMob.h || 24) / 2;

      if (window.RenderEngine && window.RenderEngine.spawnDamageEffect) {
        window.RenderEngine.spawnDamageEffect(mobCx, mobCy, boltDmg, "lightning", true);
      }
      if (window.combatVisuals) {
        window.combatVisuals.spawnBeam(mobCx, "#00d2ff", 30, false);
        window.combatVisuals.triggerScreenShake(4, 8);
      }
      if (window.SoundManager) window.SoundManager.play("spell_lightning");
    }

    if (p.hp <= 0) {
      // Phoenix Ankh Second Wind Interceptor
      if (window.checkArtifactTrait && window.checkArtifactTrait("second_wind") && !window.playerStats.usedSecondWind) {
        window.playerStats.usedSecondWind = true;
        p.hp = Math.round(p.maxHp * 0.4);
        if (typeof window.spawnFloatingText === "function") {
          window.spawnFloatingText(p.x, p.y - 30, "SECOND WIND (ANKH REVIVE)", "#ff7675", true);
        }
        if (window.combatVisuals) {
          window.combatVisuals.spawnBeam(p.x, "#ff7675", 60, true);
          window.combatVisuals.spawnParticles(p.x, p.y - 10, 30, "gold_dungeon", 4);
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
  {
    id: "overcharge",
    name: "Overcharge",
    desc: "+20% Crit Multiplier, +2.5% Crit Chance",
    apply: (p) => {
      p.critDamage = (p.critDamage || 0) + 0.2;
      p.critChance = (p.critChance || 0) + 0.025;
    },
  },
  {
    id: "sanguine_tide",
    name: "Sanguine Tide",
    desc: "Heal 1.5% Max HP on every Critical Strike hit",
    apply: (p) => {
      p.crucibleCritHeal = (p.crucibleCritHeal || 0) + 0.015;
    },
  },
  {
    id: "phantom_echo",
    name: "Phantom Echo",
    desc: "+15% chance to trigger secondary Phantom Strike (deals 35% damage)",
    apply: (p) => {
      p.crucibleEchoChance = (p.crucibleEchoChance || 0) + 0.15;
    },
  },
  {
    id: "titans_wall",
    name: "Titan's Wall",
    desc: "+8% base armor and +3% Block/Parry cap limits",
    apply: (p) => {
      p.defPctBonus = (p.defPctBonus || 0) + 0.08;
      p.crucibleCapBonus = (p.crucibleCapBonus || 0) + 0.03;
    },
  },
  {
    id: "temporal_accel",
    name: "Temporal Acceleration",
    desc: "+15% Active & Idle Attack Speed multipliers",
    apply: (p) => {
      p.activeSpeedPct = (p.activeSpeedPct || 0) + 0.15;
      p.idleSpeedPct = (p.idleSpeedPct || 0) + 0.15;
    },
  },
  {
    id: "astral_attune",
    name: "Astral Attunement",
    desc: "Earn +25% Astral Shards from this run",
    apply: (p) => {
      p.crucibleShardMult = (p.crucibleShardMult || 1.0) + 0.25;
    },
  },
  {
    id: "slot_weapon",
    name: "Bladesmith's Touch",
    desc: "+15% to all stats of the equipped Weapon slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.weapon = (p.crucibleSlotBonuses.weapon || 0) + 0.15;
    },
  },
  {
    id: "slot_subweapon",
    name: "Aegis Convergence",
    desc: "+15% to all stats of the equipped Subweapon (Offhand) slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.subweapon =
        (p.crucibleSlotBonuses.subweapon || 0) + 0.15;
    },
  },
  {
    id: "slot_helmet",
    name: "Crown Alignment",
    desc: "+15% to all stats of the equipped Helmet slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.helmet = (p.crucibleSlotBonuses.helmet || 0) + 0.15;
    },
  },
  {
    id: "slot_torso",
    name: "Fortress Plate",
    desc: "+15% to all stats of equipped Chest and Overall slots for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.chest = (p.crucibleSlotBonuses.chest || 0) + 0.15;
      p.crucibleSlotBonuses.overall =
        (p.crucibleSlotBonuses.overall || 0) + 0.15;
    },
  },
  {
    id: "slot_leggings",
    name: "Reinforced Chausses",
    desc: "+15% to all stats of the equipped Leggings slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.leggings =
        (p.crucibleSlotBonuses.leggings || 0) + 0.15;
    },
  },
  {
    id: "slot_boots",
    name: "Mercury Wings",
    desc: "+15% to all stats of the equipped Boots slot for this run",
    apply: (p) => {
      p.crucibleSlotBonuses.boots = (p.crucibleSlotBonuses.boots || 0) + 0.15;
    },
  },
  {
    id: "aegis_bastion",
    name: "Stalwart Bastion",
    desc: "+3% Block & Parry Rate, and +5% Max HP. HP bonus is doubled (+10% total) if wielding a Shield.",
    apply: (p) => {
      p.block = (p.block || 0) + 0.03;
      p.parry = (p.parry || 0) + 0.03;
      let hpBonus =
        window.equippedSlots.subweapon?.subType === "shield" ? 0.1 : 0.05;
      p.maxHpPctBonus = (p.maxHpPctBonus || 0) + hpBonus;
    },
  },
  {
    id: "poison_tip",
    name: "Viper's Precision",
    desc: "+4% Crit Chance. Your critical hits apply 1 stack of Sanguine Bleed. Applied stacks are doubled to 2 if wielding a Dagger.",
    apply: (p) => {
      p.critChance = (p.critChance || 0) + 0.04;
      let bleedAmt =
        window.equippedSlots.subweapon?.subType === "dagger" ? 2 : 1;
      p.crucibleDaggerBleed = (p.crucibleDaggerBleed || 0) + bleedAmt;
    },
  },
  {
    id: "catalyst_resonance",
    name: "Aetheric Focus",
    desc: "+8% Spell & Tome damage. Wielding a Tome also increases Arcane Barrier absorption by +5% and extends barrier caps.",
    apply: (p) => {
      p.crucibleSpellChanceBonus = (p.crucibleSpellChanceBonus || 0) + 0.08;
      if (window.equippedSlots.subweapon?.subType === "tome") {
        p.arcaneBarrier = (p.arcaneBarrier || 0) + 0.05;
      }
    },
  },
];

window.playerStats = {
  subweaponMastery: {
    shield: { xp: 0, level: 1, sp: 0, spentSp: 0 },
    dagger: { xp: 0, level: 1, sp: 0, spentSp: 0 },
    tome:   { xp: 0, level: 1, sp: 0, spentSp: 0 },
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
      tome_keystone_singularity: 0
    }
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
  baseMoveSpeed: 10,
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
  controlMode: "joystick",
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
  generateDailyMissions() {
    let pool = [
      {
        type: "kills",
        label: "Slay monsters",
        targetBase: 300,
        unit: "monsters",
      },
      {
        type: "rares",
        label: "Slay rare spawns",
        targetBase: 5,
        unit: "rares",
      },
      {
        type: "gold",
        label: "Collect Gold",
        targetBase: 2500,
        stageScale: true,
        unit: "Gold",
      },
      {
        type: "fairies",
        label: "Catch wild fairies",
        targetBase: 8,
        unit: "fairies",
      },
      {
        type: "tempers",
        label: "Attune equipment slots",
        targetBase: 1,
        unit: "slots",
      },
      {
        type: "reforges",
        label: "Reforge gear modifiers",
        targetBase: 2,
        unit: "reforges",
      },
      {
        type: "dungeons",
        label: "Clear Dungeon floors",
        targetBase: 5,
        unit: "floors",
      },
      {
        type: "salvage",
        label: "Salvage gear items",
        targetBase: 15,
        unit: "items",
      },
      {
        type: "elixirs",
        label: "Consume active elixirs",
        targetBase: 3,
        unit: "elixirs",
      },
      {
        type: "active_clicks",
        label: "Manually click canvas",
        targetBase: 250,
        unit: "clicks",
      },
    ];

    pool.sort(() => Math.random() - 0.5);
    let selected = pool.slice(0, 6);

    let stage = window.playerStats.stage || 1;
    window.playerStats.dailyMissions = selected.map((m, idx) => {
      let target = m.targetBase;
      if (m.stageScale) {
        target = Math.ceil(m.targetBase * Math.pow(1.045, stage));
      }
      return {
        id: `daily_${idx + 1}`,
        type: m.type,
        desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
        current: 0,
        target: target,
        treat: "Daily Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },
};

// Legacy Compatibility Aliases to protect cross-file references
window.generateDailyMissions = () => window.QuestSystem.generateDailyMissions();

// Append generateWeeklyMissions inside window.QuestSystem
Object.assign(window.QuestSystem, {
  generateWeeklyMissions() {
    let pool = [
      {
        type: "rifts",
        label: "Slay Rift Guardians",
        targetBase: 10, // Increased from 3
        unit: "guardians",
      },
      {
        type: "dungeons",
        label: "Ascend Dungeon floors",
        targetBase: 50, // Increased from 15
        unit: "floors",
      },
      {
        type: "gold",
        label: "Amass extreme wealth",
        targetBase: 150000, // Increased from 15000
        stageScale: true,
        unit: "Gold",
      },
      {
        type: "kills",
        label: "Execute massive purges",
        targetBase: 15000, // Increased from 1500
        unit: "enemies",
      },
      {
        type: "tempers",
        label: "Master slot attunement",
        targetBase: 40, // Increased from 15
        unit: "slots",
      },
    ];

    pool.sort(() => Math.random() - 0.5);
    let selected = pool.slice(0, 3);

    let peakStage =
      window.playerStats.lifetimePeakStage || window.playerStats.stage || 1;
    window.playerStats.weeklyMissions = selected.map((m, idx) => {
      let target = m.targetBase;
      if (m.stageScale) {
        target = Math.ceil(m.targetBase * Math.pow(1.045, peakStage));
      }
      return {
        id: `weekly_${idx + 1}`,
        type: m.type,
        desc: `${m.label} (${target.toLocaleString()} ${m.unit})`,
        current: 0,
        target: target,
        treat: "Weekly Reward Sack",
        treatQty: 1,
        completed: false,
        claimed: false,
      };
    });
  },
});

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
      if (typeof window.pushLog === "function")
        window.pushLog(
          "<span style='color:#2ecc71; font-weight:bold;'>📅 [SYSTEM] Clan Daily Board refreshed! Reset at 12:00 AM PST/PDT. Complete at least 5 for a grand treat!</span>",
        );
    }

    // Check Weekly reset (Monday 12:00 AM PST/PDT)
    let dayOfWeek = ptDate.getDay(); // 0 is Sunday, 1 is Monday...
    let daysSinceMonday = (dayOfWeek + 6) % 7; // Days elapsed since last Monday
    let lastMondayDate = new Date(ptDate);
    lastMondayDate.setDate(ptDate.getDate() - daysSinceMonday);
    let lastMondayStr = lastMondayDate.toLocaleDateString("en-US");

    if (window.playerStats.prestigeCount > 0) {
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
            "<span style='color:#9b59b6; font-weight:bold;'>📅 [SYSTEM] Clan Weekly Board refreshed!</span>",
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

    if (
      window.playerStats.prestigeCount > 0 &&
      window.playerStats.weeklyMissions
    ) {
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
    if (saveData.playerStats.totalGoldEarned)
      saveData.playerStats.totalGoldEarned = {
        m: saveData.playerStats.totalGoldEarned.m,
        e: saveData.playerStats.totalGoldEarned.e,
      };

    localStorage.setItem("extraction_crawler_save", JSON.stringify(saveData));
  } catch (err) {
    console.warn("Failed to save game to localStorage:", err);
  }
};

window.loadGame = function () {
  try {
    let raw = localStorage.getItem("extraction_crawler_save");
    if (!raw) return;

    let parsed = JSON.parse(raw);
    if (!parsed) return;

    if (parsed.playerStats) {
      Object.assign(window.playerStats, parsed.playerStats);
      window.playerStats.recoveryLoot = parsed.playerStats.recoveryLoot || null;

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

            // Fallback initializers for Field Flask properties
                                    if (window.playerStats.maxFlaskCharges === undefined) window.playerStats.maxFlaskCharges = 1;
                                    if (window.playerStats.flaskCharges === undefined) window.playerStats.flaskCharges = window.playerStats.maxFlaskCharges;
                                    if (window.playerStats.flaskPotency === undefined) window.playerStats.flaskPotency = 0.25;
                                    if (window.playerStats.flaskCooldownTimer === undefined) window.playerStats.flaskCooldownTimer = 0;
                                    if (window.playerStats.flaskX === undefined) window.playerStats.flaskX = null;
                                    if (window.playerStats.flaskY === undefined) window.playerStats.flaskY = null;
                              window.playerStats.totalGoldEarned = BigNum.from(
                                window.playerStats.totalGoldEarned || 0,
                              );

                        // Fallback initializers for Subweapon Mastery
                        if (!window.playerStats.subweaponMastery) {
                          window.playerStats.subweaponMastery = {
                            shield: { xp: 0, level: 1, sp: 0, spentSp: 0 },
                            dagger: { xp: 0, level: 1, sp: 0, spentSp: 0 },
                            tome:   { xp: 0, level: 1, sp: 0, spentSp: 0 },
                            nodes: {}
                          };
                        }
                        if (!window.playerStats.subweaponMastery.nodes) {
                          window.playerStats.subweaponMastery.nodes = {};
                        }
                        const defaultNodes = [
                          "shield_spiked_rim", "shield_iron_wall", "shield_impact_tremor", "shield_fortified_guard",
                          "shield_retaliatory_strike", "shield_aegis_pulse", "shield_keystone_colossus", "shield_keystone_reflect",
                          "dagger_lethal_precision", "dagger_vipers_coating", "dagger_shadow_step", "dagger_expose_weakness",
                          "dagger_shadow_flurry", "dagger_sanguine_rupture", "dagger_keystone_assassin", "dagger_keystone_duellist",
                          "tome_empowered_catalysts", "tome_runic_barrier", "tome_elemental_overload", "tome_arcane_syphon",
                          "tome_barrier_shatter", "tome_spell_weaving", "tome_keystone_triad", "tome_keystone_singularity"
                        ];
                        defaultNodes.forEach(nodeId => {
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
      window.playerStats.unlockedCheckpoints = Array.from(checkpoints).sort(
        (a, b) => a - b,
      );
    }

    if (parsed.equippedSlots) {
      window.equippedSlots = parsed.equippedSlots;
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
