const openCavernSigilSackAnimation = function (newItem) {
    let overlay = document.createElement("div");
    overlay.id = "sack-opening-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.92)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "45000";
    overlay.style.backdropFilter = "blur(8px)";
    document.body.appendChild(overlay);

    let color = window.getTierColor(newItem.statsRolled);
    let stars = newItem.statsRolled;

    overlay.innerHTML = `
        <style>
          .cavern-anim-wrapper {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .cavern-runic-circle {
            position: absolute;
            width: 260px;
            height: 260px;
            border: 2px dashed rgba(168, 85, 247, 0.4);
            border-radius: 50%;
            animation: runicSpin 15s linear infinite;
          }
          .cavern-runic-circle::before {
            content: "";
            position: absolute;
            top: 10px; left: 10px; right: 10px; bottom: 10px;
            border: 1px dashed rgba(0, 210, 255, 0.25);
            border-radius: 50%;
            animation: runicSpinReverse 8s linear infinite;
          }
          .sack-anim-container {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 180px;
          }
          .sack-svg {
            animation: sackViolentShake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            overflow: visible !important;
          }
          .sack-string {
            animation: stringUntie 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
            animation-delay: 0.5s;
          }
          .sack-neck {
            animation: neckOpen 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.25) forwards;
            animation-delay: 0.52s;
          }
          .portal-blast {
            position: absolute;
            width: 10px;
            height: 10px;
            background: radial-gradient(circle, #fff 0%, ${color} 60%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            transform: scale(0);
            animation: portalErupt 0.6s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
            animation-delay: 0.55s;
            pointer-events: none;
          }

          @keyframes runicSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes runicSpinReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes sackViolentShake {
            0% { transform: scale(1) rotate(0deg); }
            10% { transform: scale(1.1) rotate(-12deg); }
            20% { transform: scale(1.1) rotate(14deg); }
            30% { transform: scale(1.1) rotate(-14deg); }
            40% { transform: scale(1.1) rotate(12deg); }
            50% { transform: scale(1.1) rotate(-8deg); }
            60% { transform: scale(1.05) rotate(6deg); }
            70% { transform: scale(1.02) rotate(-3deg); }
            80% { transform: scale(1.01) rotate(1deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          @keyframes stringUntie {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(18px) scale(0.3); opacity: 0; }
          }
          @keyframes neckOpen {
            0% { transform: scaleX(1) scaleY(1); }
            100% { transform: scaleX(1.4) scaleY(0.6) translateY(3px); }
          }
          @keyframes portalErupt {
            0% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: scale(25); }
          }
        </style>
        <div style="text-align:center; color:white; animation: toastFadeIn 0.3s ease-out;">
          <div class="cavern-anim-wrapper">
            <div class="cavern-runic-circle"></div>
            <div class="portal-blast"></div>
            <div class="sack-anim-container">
                        <svg class="sack-svg" width="130" height="130" viewBox="0 0 64 64">
                          <defs>
                            <!-- Luxurious Void Velvet Body Gradient -->
                            <linearGradient id="g_premium_velvet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#7d3c98" />
                              <stop offset="60%" stop-color="#4a154b" />
                              <stop offset="100%" stop-color="#110521" />
                            </linearGradient>
                            <!-- Glowing Magic Celestial Teal Lining -->
                            <linearGradient id="g_magic_celestial" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#00ffff" />
                              <stop offset="100%" stop-color="#008b8b" />
                            </linearGradient>
                            <!-- Polished Gold Metallic Gradient -->
                            <linearGradient id="g_polished_gold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="#ffeaa7" />
                              <stop offset="50%" stop-color="#f1c40f" />
                              <stop offset="100%" stop-color="#9a7d0a" />
                            </linearGradient>
                            <!-- Dark shadow mask for folds -->
                            <linearGradient id="g_fold_shadow" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stop-color="rgba(0,0,0,0.4)" />
                              <stop offset="100%" stop-color="rgba(0,0,0,0)" />
                            </linearGradient>
                          </defs>

                          <!-- Soft Blurred Base Drop-Shadow -->
                          <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />

                          <!-- Flared Open Neck Sleeve with Glow -->
                          <g class="sack-neck" style="transform-origin: 32px 28px;">
                            <!-- Glowing Teal Lining Inside -->
                            <path d="M20 16 C25 9, 39 9, 44 16 C39 12, 25 12, 20 16 Z" fill="url(#g_magic_celestial)" opacity="0.8" style="filter: drop-shadow(0 0 3px #00ffff);" />
                            <!-- Left Flared Neck Sleeve -->
                            <path d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Right Flared Neck Sleeve -->
                            <path d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="1.8" />
                            <!-- Fold lines on the collar -->
                            <path d="M24 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                            <path d="M40 28 Q32 22, 32 16" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" />
                          </g>

                          <!-- Main Velvet Pouch Body -->
                          <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="url(#g_premium_velvet)" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />

                          <!-- Organic Fabric Creases & Depth Shadows -->
                          <path d="M11 38 Q18 42, 32 38" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
                          <path d="M32 18 Q23 35, 18 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" />
                          <path d="M32 18 Q41 35, 46 51" fill="none" stroke="url(#g_fold_shadow)" stroke-width="3" transform="scale(-1, 1) translate(-64, 0)" />

                          <!-- Glowing Cyber-Teal Runic Medallion (Sigil) on Front -->
                          <!-- Outer magic orbit ring -->
                          <circle cx="32" cy="40" r="10" fill="none" stroke="#00ffff" stroke-dasharray="2.5 3" stroke-width="1.2" opacity="0.8" style="filter: drop-shadow(0 0 4px #00ffff);" />
                          <!-- Metallic gold backing plate -->
                          <circle cx="32" cy="40" r="7.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.5" />
                          <!-- White-hot glowing core glyph -->
                          <polygon points="32,35.5 35.5,40 32,44.5 28.5,40" fill="#ffffff" stroke="#00ffff" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #00ffff);" />

                          <!-- Cinched Braided Gold String & Loops -->
                          <g class="sack-string" style="transform-origin: 32px 28px;">
                            <!-- Main Cinch Band -->
                            <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="url(#g_polished_gold)" stroke-width="3.5" stroke-linecap="round" />
                            <path d="M24 29 Q32 32, 40 29" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" />

                            <!-- Left Ribbon Loop -->
                            <path d="M28 29 Q21 26, 25 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />
                            <!-- Right Ribbon Loop -->
                            <path d="M36 29 Q43 26, 39 33 Z" fill="url(#g_polished_gold)" stroke="#000" stroke-width="1.2" />

                            <!-- Central Tie Knot Node -->
                            <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
                            <circle cx="32" cy="29.2" r="1" fill="#fff" opacity="0.6" />

                            <!-- Left Hanging String Strand -->
                            <path d="M30 30 Q24 40, 18 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="18" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />

                            <!-- Right Hanging String Strand -->
                            <path d="M34 30 Q40 40, 46 43" fill="none" stroke="url(#g_polished_gold)" stroke-width="2.2" stroke-linecap="round" />
                            <circle cx="46" cy="43" r="1.5" fill="url(#g_polished_gold)" stroke="#000" stroke-width="0.8" />
                          </g>
                        </svg>
                      </div>
          </div>
          <div style="font-size: 14px; font-weight: 900; color:#9b59b6; letter-spacing: 3px; text-shadow: 0 0 8px rgba(155,89,182,0.5); text-transform: uppercase;">TRANSMUTING CAVERN SIGIL...</div>
        </div>
      `;

    setTimeout(() => {
      let buffDescs = newItem.buffs
        .map(
          (b) =>
            `<span style="color:#2ecc71; display:block; font-size:10px; margin-bottom:2px;">• ✦ ${b.name}: ${b.desc}</span>`,
        )
        .join("");
      let debuffDescs = newItem.debuffs
        .map(
          (d) =>
            `<span style="color:#e74c3c; display:block; font-size:10px; margin-bottom:2px;">• ◈ ${d.name}: ${d.desc}</span>`,
        )
        .join("");

      overlay.innerHTML = `
              <div style="background:#15121b; border:3px solid ${color}; border-radius:12px; width:95%; max-width:400px; box-shadow:0 15px 45px rgba(0,0,0,0.95); text-align:center; padding:20px; animation: toastFadeIn 0.3s;">
                <h2 style="margin:0 0 10px 0; color:${color}; letter-spacing:2px; text-transform:uppercase; font-size:18px;">✦ SIGIL UNBOXED! ✦</h2>
                <div style="height:2px; background:linear-gradient(90deg, transparent, ${color}, transparent); margin-bottom:15px;"></div>
                <div style="text-align:center; margin-bottom:12px;">${window.getEquipIconHtml(newItem, 48)}</div>
                <h3 style="color:${color}; font-size:14px; margin:0 0 4px 0;">${newItem.name}</h3>
                <span style="font-size:10px; color:#aaa; font-family:monospace; display:block; margin-bottom:12px;">Quality: ${stars}★ ${window.getTierName(stars)}</span>

                <div style="background:#090610; border:1px solid #333; border-radius:6px; padding:12px; text-align:left; margin-bottom:15px; line-height:1.45;">
                              <strong style="color:#f1c40f; font-family:monospace; display:block; margin-bottom:6px; text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">[ SIGIL MODIFIERS ]</strong>
                              ${buffDescs}
                              ${debuffDescs}
                              <div style="border-top:1px dashed #333; margin-top:8px; padding-top:6px; display:flex; flex-direction:column; gap:2px; font-family:monospace; font-size:9.5px;">
                                <span style="color:#3498db; font-weight:bold;">✦ Focus Rewards: +${(newItem.rewardMultiplier * 100).toFixed(0)}% Gold/Loot Multiplier</span>
                                ${newItem.qualityBoost > 0 ? `<span style="color:#ff007f; font-weight:bold;">✦ Quality Boost: +${(newItem.qualityBoost * 100).toFixed(0)}% Drop Quality</span>` : ""}
                              </div>
                            </div>

                <button onclick="document.getElementById('sack-opening-overlay').remove(); window.setPauseState(false); window.updateUI(); window.renderInventory();" style="background:${color}; color:${stars === 4 || stars === 1 ? "#fff" : "#111"}; border:none; padding:10px; font-weight:bold; font-size:12px; border-radius:4px; cursor:pointer; width:100%; box-shadow:0 0 10px ${color}55;">Store in Sigil Sack</button>
                              </div>
                            `;
    }, 1100);
};

export { openCavernSigilSackAnimation };
