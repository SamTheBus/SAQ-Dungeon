/* ==========================================================================
   PRIMARY PURPOSE: Centralized Declarative Vector Asset Catalog (AssetCatalog).
   Houses all procedural paths, gradients, and rendering blueprints.
   ========================================================================= */

window.AssetCatalog = {
  // Helper to compile inner SVG pathways into a unified, responsive HTML wrapper
  compile(
    viewBox,
    innerHtml,
    size = 32,
    bg = "rgba(170, 170, 170, 0.12)",
    border = "#444",
  ) {
    const shadow = "inset 0 0 6px rgba(0, 0, 0, 0.6)";
    return `
      <span style="
        background: ${bg}; 
        border: 1px solid ${border}; 
        border-radius: 4px; 
        padding: 4px; 
        display: inline-flex; 
        align-items: center; 
        justify-content: center; 
        width: ${size}px; 
        height: ${size}px; 
        box-shadow: ${shadow};
      ">
        <svg viewBox="${viewBox}" width="100%" height="100%" style="display:block;">
          ${innerHtml}
        </svg>
      </span>
    `;
  },

  uiIcons: {
    atk: {
      color: "#e74c3c",
      path: `<path d="M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2" />`,
      opacity: "0",
    },
    maxHp: {
      color: "#e74c3c",
      path: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />`,
      opacity: "0.15",
    },
    def: {
      color: "#3498db",
      path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
      opacity: "0.15",
    },
    moveSpeed: {
      color: "#3498db",
      path: `<path d="M6 5h5v6l8 4c2 1 2 4-1 4H6V5zm3 2h2M9 9h2" />`,
      opacity: "0",
    },
    critChance: {
      color: "#f1c40f",
      path: `<path d="M12 2 Q12 12, 2 12 Q12 12, 12 22 Q12 12, 22 12 Z" />`,
      opacity: "0",
    },
    critDamage: {
      color: "#e67e22",
      path: `<path d="M12 2l3 5.5 5.5-3-3 5.5 5.5 3-5.5 3 3 5.5-5.5-3-3 5.5-3-5.5-5.5 3 3-5.5-5.5-3 5.5-3-3-5.5 5.5 3z" />`,
      opacity: "0",
    },
    block: {
      color: "#3498db",
      path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />`,
      opacity: "0.15",
    },
    parry: {
      color: "#9b59b6",
      path: `<path d="M4 20L20 4M4 20L2 22M5 15L9 19M20 20L4 4M20 20L22 22M15 19L19 15" />`,
      opacity: "0",
    },
    str: {
      color: "#e74c3c",
      path: `<path d="M18 10h-2V8c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2h2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z" />`,
      opacity: "0.15",
    },
    dex: {
      color: "#e67e22",
      path: `<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 1v4 M12 19v4 M1 12h4 M19 12h4" />`,
      opacity: "0.15",
    },
    int: {
      color: "#9b59b6",
      path: `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /><path d="M12 8v8 M8 12h8" />`,
      opacity: "0.15",
    },
    activeAttackSpeed: {
      color: "#e74c3c",
      path: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />`,
      opacity: "0.15",
    },
    idleAttackSpeed: {
      color: "#3498db",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />`,
      opacity: "0",
    },
    dropRate: {
      color: "#2ecc71",
      path: `<path d="M16 10c-1-1.5-2.5-2-4-2s-3 .5-4 2C6 12, 4 15, 4 19c0 4 3.5 6 8 6s8-2 8-6C20 15, 18 12, 16 10z M12 6a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 6z" />`,
      opacity: "0.15",
    },
    quality: {
      color: "#ec4899",
      path: `<path d="M6 3h12l4 6-10 12L2 9z" />`,
      opacity: "0.15",
    },
    goldMulti: {
      color: "#f1c40f",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 8v8M9 10h6M9 13h6" />`,
      opacity: "0.15",
    },
    gold: {
      color: "#f1c40f",
      path: `<circle cx="12" cy="12" r="10" /><path d="M12 8v8M9 10h6M9 13h6" />`,
      opacity: "0.15",
    },
    rareSpawn: {
      color: "#e67e22",
      path: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.82 2.15L7 14.14 2 9.27l6.91-1.01L12 2z" />`,
      opacity: "0.15",
    },
    fairySpawn: {
      color: "#ffb6c1",
      path: `<path d="M12 2c-.5 5-4 8-8 8 4 0 7.5 3 8 8 .5-5 4-8 8-8-4 0-7.5-3-8-8z" />`,
      opacity: "0.15",
    },
    barrier: {
      color: "#9b59b6",
      path: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />`,
      opacity: "0.15",
    },
    xpRate: {
      color: "#a855f7",
      path: `<circle cx="12" cy="12" r="10" /><path d="M17 13l-5-5-5 5M17 17l-5-5-5 5" />`,
      opacity: "0.15",
    },
  },

  // Declarative database of custom multi-stop gradients
  gradients: {
    equip(id, color) {
      return `
        <defs>
          <linearGradient id="grad_eq_${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="60%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#475569"/>
          </linearGradient>
        </defs>
      `;
    },
    weapon(id, color) {
      return `
        <defs>
          <linearGradient id="grad_weap_${id}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#555555"/>
          </linearGradient>
        </defs>
      `;
    },
    shield(id, color) {
      return `
        <defs>
          <linearGradient id="grad_sh_${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}"/>
            <stop offset="100%" stop-color="#2c3e50"/>
          </linearGradient>
        </defs>
      `;
    },
    liquid(id, color) {
      return `
            <defs>
              <linearGradient id="grad_liq_${id}" x1="0" y1="100%" x2="0" y2="0%">
                <stop offset="0%" stop-color="rgba(0, 0, 0, 0.55)"/>
                <stop offset="25%" stop-color="${color}"/>
                <stop offset="75%" stop-color="${color}"/>
                <stop offset="92%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="rgba(255, 255, 255, 0.85)"/>
              </linearGradient>
              <radialGradient id="grad_glow_${id}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7"/>
                <stop offset="50%" stop-color="${color}" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
              </radialGradient>
            </defs>
          `;
    },
  },

  // Blueprints for procedurally rendering generic equipment based on slots
  genericEquipment: {
    // --- SPECIALIZED NOUN Blueprints ---
    greatsword(id, color) {
      return `
            <defs>
              <!-- Massive blade light facet -->
              <linearGradient id="gs_blade_l_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Massive blade shadow facet -->
              <linearGradient id="gs_blade_s_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#334155"/>
              </linearGradient>
              <!-- Ricasso dark steel leather wrap -->
              <linearGradient id="gs_ricasso_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#555555"/>
                <stop offset="100%" stop-color="#2c3e50"/>
              </linearGradient>
              <!-- Long grip leather wrap -->
              <linearGradient id="gs_hilt_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
            </defs>

            <!-- Left Heavy Blade (Shadow + Parierhaken parrying hook) -->
            <path d="M16 2 L13.5 3.5 L13.5 14 L11.5 14.5 L14 15 L14 19 L16 19 Z" fill="url(#gs_blade_s_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Right Heavy Blade (Light + Parierhaken parrying hook) -->
            <path d="M16 2 L18.5 3.5 L18.5 14 L20.5 14.5 L18 15 L18 19 L16 19 Z" fill="url(#gs_blade_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Specular Highlight Sheen -->
            <polygon points="16,2 18.0,3.5 17.5,13.5 16,13.5" fill="rgba(255,255,255,0.45)" />

            <!-- Ricasso (Blunt base wrap) -->
            <rect x="14" y="15.8" width="4" height="3.2" fill="url(#gs_ricasso_${id})" stroke="#05070a" stroke-width="1.5" />

            <!-- Left Guard Side Ring (Seitenring) -->
            <circle cx="10" cy="19.5" r="3.2" fill="none" stroke="${color}" stroke-width="1.8" />

            <!-- Right Guard Side Ring (Seitenring) -->
            <circle cx="22" cy="19.5" r="3.2" fill="none" stroke="${color}" stroke-width="1.8" />

            <!-- Imposing Straight Crossguard -->
            <path d="M7 19.5 L25 19.5 L23 21.5 L9 21.5 Z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Long Two-Handed Grip -->
            <rect x="14.2" y="21.5" width="3.6" height="7" fill="url(#gs_hilt_${id})" stroke="#05070a" stroke-width="1.5" />
            <!-- Grip Ribs/Spacers -->
            <line x1="14.2" y1="23.2" x2="17.8" y2="23.2" stroke="#05070a" stroke-width="1" />
            <line x1="14.2" y1="25.0" x2="17.8" y2="25.0" stroke="#05070a" stroke-width="1" />
            <line x1="14.2" y1="26.8" x2="17.8" y2="26.8" stroke="#05070a" stroke-width="1" />

            <!-- Faceted Octagonal Pommel with Inset Gem -->
            <polygon points="16,28.5 18.8,30 16,31.5 13.2,30" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
            <circle cx="16" cy="30" r="0.8" fill="#ffffff" />
          `;
    },
    warhammer(id, color) {
      return `
          <line x1="16" y1="12" x2="16" y2="30" stroke="#5c3a21" stroke-width="2.5" stroke-linecap="round" />
          <rect x="9" y="4" width="14" height="8" rx="2" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
          <path d="M7 6 L9 6 L9 10 L7 10 Z" fill="${color}" stroke="#000" stroke-width="1" />
          <path d="M23 6 L25 6 L25 10 L23 10 Z" fill="${color}" stroke="#000" stroke-width="1" />
          <polygon points="16,1 18,4 14,4" fill="${color}" stroke="#000" stroke-width="1" />
          <line x1="16" y1="12" x2="16" y2="20" stroke="${color}" stroke-width="1" />
        `;
    },
    battleaxe(id, color) {
      return `
          <line x1="16" y1="6" x2="16" y2="30" stroke="#4d2f12" stroke-width="2.5" stroke-linecap="round" />
          <path d="M16 8 Q7 4, 10 14 Q14 18, 16 16" fill="${color}" stroke="#000" stroke-width="1.8" />
          <path d="M16 8 Q25 4, 22 14 Q18 18, 16 16" fill="${color}" stroke="#000" stroke-width="1.8" />
          <circle cx="16" cy="12" r="2.5" fill="#f1c40f" stroke="#000" stroke-width="1.2" />
          <polygon points="16,3 18,6 14,3" fill="#bdc3c7" stroke="#000" stroke-width="1" />
        `;
    },
    broadsword(id, color) {
      return `
            <defs>
              <!-- Steel blade light gradient -->
              <linearGradient id="bs_blade_l_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#bdc3c7"/>
              </linearGradient>
              <!-- Steel blade shadow gradient -->
              <linearGradient id="bs_blade_s_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#95a5a6"/>
                <stop offset="100%" stop-color="#7f8c8d"/>
              </linearGradient>
              <!-- Hilt leather wrap gradient -->
              <linearGradient id="bs_hilt_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#4e3629"/>
                <stop offset="100%" stop-color="#2b1a11"/>
              </linearGradient>
            </defs>

            <!-- Basket crossguard backplate -->
            <path d="M11 20 L21 20 L19 23 L13 23 Z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Left Blade Side (Shadow Side) -->
            <path d="M16 2 L13 3 L14 20 L16 20 Z" fill="url(#bs_blade_s_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Right Blade Side (Light Side) -->
            <path d="M16 2 L19 3 L18 20 L16 20 Z" fill="url(#bs_blade_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Specular Highlight Sheen (Gleam) -->
            <polygon points="16,2 17.5,3.2 16.8,18 16,18" fill="rgba(255,255,255,0.45)" />

            <!-- Heavy crossguard overlay -->
            <path d="M9 20h14v2.5H9z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Wrapped Leather Grip -->
            <rect x="14" y="22.5" width="4" height="6" fill="url(#bs_hilt_${id})" stroke="#05070a" stroke-width="1.5" />
            <!-- Grip Ribs -->
            <line x1="14" y1="24" x2="18" y2="24" stroke="#05070a" stroke-width="1" />
            <line x1="14" y1="26" x2="18" y2="26" stroke="#05070a" stroke-width="1" />
            <line x1="14" y1="28" x2="18" y2="28" stroke="#05070a" stroke-width="1" />

            <!-- Weighted Pommel Gem (Scales with rarity color) -->
            <circle cx="16" cy="29.5" r="2.2" fill="${color}" stroke="#05070a" stroke-width="1.8" />
            <circle cx="15.2" cy="28.7" r="0.6" fill="#ffffff" />
          `;
    },
    longsword(id, color) {
      return `
            <defs>
              <!-- Steel blade light gradient (slender sheen) -->
              <linearGradient id="ls_blade_l_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="60%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Steel blade shadow gradient -->
              <linearGradient id="ls_blade_s_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
              <!-- Slender handle leather wrap -->
              <linearGradient id="ls_hilt_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#2d3748"/>
                <stop offset="100%" stop-color="#1a202c"/>
              </linearGradient>
            </defs>

            <!-- Left Slender Blade Side (Shadow Side) -->
            <path d="M16 2 L14.5 4 L14.5 21 L16 21 Z" fill="url(#ls_blade_s_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Right Slender Blade Side (Light Side) -->
            <path d="M16 2 L17.5 4 L17.5 21 L16 21 Z" fill="url(#ls_blade_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Specular Highlight Sheen -->
            <polygon points="16,2 17.0,4 16.8,19 16,19" fill="rgba(255,255,255,0.4)" />

            <!-- Slender Curved Crossguard (Gold/Iron accent base) -->
            <path d="M9.5 20.5 Q16 18.5 22.5 20.5 L21.5 22.5 Q16 21.0 10.5 22.5 Z" fill="${color}" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Hand-and-a-Half Grip -->
            <rect x="14.5" y="22.5" width="3" height="7.5" fill="url(#ls_hilt_${id})" stroke="#05070a" stroke-width="1.2" />
            <!-- Grip cord wraps -->
            <line x1="14.5" y1="24.5" x2="17.5" y2="24.5" stroke="#05070a" stroke-width="0.8" />
            <line x1="14.5" y1="26.5" x2="17.5" y2="26.5" stroke="#05070a" stroke-width="0.8" />
            <line x1="14.5" y1="28.5" x2="17.5" y2="28.5" stroke="#05070a" stroke-width="0.8" />

            <!-- Diamond Pommel (Scales with rarity color) -->
            <polygon points="16,29.5 18.2,31 16,32.5 13.8,31" fill="${color}" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <circle cx="16" cy="31" r="0.8" fill="#ffffff" />
          `;
    },
    halberd(id, color) {
      return `
              <line x1="16" y1="12" x2="16" y2="30" stroke="#5c3a21" stroke-width="2" />
              <path d="M16 2 L18 8 H14 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.2" />
              <path d="M16 8 Q23 6, 22 13 Q18 15, 16 14 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
              <path d="M16 9 L11 11 L16 13 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.2" />
            `;
    },
    flanged_mace(id, color) {
      return `
              <line x1="16" y1="12" x2="16" y2="30" stroke="#2c3e50" stroke-width="2.5" />
              <rect x="13" y="4" width="6" height="10" rx="1" fill="#7f8c8d" stroke="#000" stroke-width="1.5" />
              <path d="M10 5 L13 7 V11 L10 13 Z" fill="${color}" stroke="#000" stroke-width="1" />
              <path d="M22 5 L19 7 V11 L22 13 Z" fill="${color}" stroke="#000" stroke-width="1" />
              <polygon points="16,1 18,4 14,4" fill="#95a5a6" stroke="#000" stroke-width="1" />
            `;
    },
    claymore(id, color) {
      return `
            <defs>
              <!-- Broad, imposing blade light facet -->
              <linearGradient id="cm_blade_l_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="#e2e8f0"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Broad blade shadow facet -->
              <linearGradient id="cm_blade_s_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
              <!-- Heavy leather-wrapped grip -->
              <linearGradient id="cm_hilt_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#3d1d0b"/>
              </linearGradient>
            </defs>

            <!-- Left Heavy Blade Side (Shadow Side) -->
            <path d="M16 2 L13.5 3.5 L14 19 L16 19 Z" fill="url(#cm_blade_s_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Right Heavy Blade Side (Light Side) -->
            <path d="M16 2 L18.5 3.5 L18 19 L16 19 Z" fill="url(#cm_blade_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Specular Highlight Sheen -->
            <polygon points="16,2 18.0,3.5 17.2,18 16,18" fill="rgba(255,255,255,0.4)" />

            <!-- Left Forward-Sloping Quillon -->
            <path d="M16 19 L8.5 22.8 L9.2 24.6 L16 21.2 Z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
            <circle cx="7.8" cy="23.4" r="1.8" fill="${color}" stroke="#05070a" stroke-width="1.5" />

            <!-- Right Forward-Sloping Quillon -->
            <path d="M16 19 L23.5 22.8 L22.8 24.6 L16 21.2 Z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
            <circle cx="24.2" cy="23.4" r="1.8" fill="${color}" stroke="#05070a" stroke-width="1.5" />

            <!-- Center Guard Block -->
            <path d="M11.5 19h9v2.5h-9z" fill="${color}" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Long Two-Handed Grip -->
            <rect x="14.2" y="21.5" width="3.6" height="6.5" fill="url(#cm_hilt_${id})" stroke="#05070a" stroke-width="1.5" />
            <line x1="14.2" y1="23.2" x2="17.8" y2="23.2" stroke="#05070a" stroke-width="1" />
            <line x1="14.2" y1="25.0" x2="17.8" y2="25.0" stroke="#05070a" stroke-width="1" />
            <line x1="14.2" y1="26.8" x2="17.8" y2="26.8" stroke="#05070a" stroke-width="1" />

            <!-- Weighted Wheel Pommel with Inset Rarity Gem -->
            <circle cx="16" cy="29.8" r="2.8" fill="#55555d" stroke="#05070a" stroke-width="1.8" />
            <circle cx="16" cy="29.8" r="1.5" fill="${color}" stroke="#05070a" stroke-width="1.2" />
            <circle cx="15.4" cy="29.2" r="0.5" fill="#ffffff" />
          `;
    },
    kite_shield(id, color) {
      return `
            <defs>
              <!-- Steel rim gradient -->
              <linearGradient id="ks_rim_${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
              <!-- Inner plate light gradient -->
              <linearGradient id="ks_face_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Inner plate shadow gradient -->
              <linearGradient id="ks_face_s_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
            </defs>

            <!-- Outer Steel Rim -->
            <path d="M7 5 Q16 3, 25 5 Q23 18, 16 29 Q9 18, 7 5 Z" fill="url(#ks_rim_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Inner Plate (Shadow - Left side) -->
            <path d="M16 5.5 Q11.5 4.5, 8.5 6 Q10.2 17.5, 16 27 Z" fill="url(#ks_face_s_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Inner Plate (Light - Right side) -->
            <path d="M16 5.5 Q20.5 4.5, 23.5 6 Q21.8 17.5, 16 27 Z" fill="url(#ks_face_l_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Specular Highlight (Gleam) -->
            <path d="M16 5.5 Q19.5 4.5, 21.5 6 Q20.2 15, 16 23 Z" fill="rgba(255,255,255,0.22)" />

            <!-- Central Heraldic Cross (Scales with Rarity Color) -->
            <path d="M15 8 H17 V12 H21 V14 H17 V24 H15 V14 H11 V12 H15 Z" fill="${color}" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />

            <!-- Center Core Gem Glistening -->
            <circle cx="16" cy="13" r="1.5" fill="#ffffff" opacity="0.8" />

            <!-- Steel Rim Rivets (Left side) -->
            <circle cx="9" cy="7" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="10.5" cy="13" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="12.8" cy="19" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="14.8" cy="24" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />

            <!-- Steel Rim Rivets (Right side) -->
            <circle cx="23" cy="7" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="21.5" cy="13" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="19.2" cy="19" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="17.2" cy="24" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
          `;
    },
    tower_shield(id, color) {
      return `
            <defs>
              <!-- Heavy steel rim gradient -->
              <linearGradient id="ts_rim_${id}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#cbd5e1"/>
                <stop offset="50%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#334155"/>
              </linearGradient>
              <!-- Face light gradient -->
              <linearGradient id="ts_face_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Face shadow gradient -->
              <linearGradient id="ts_face_s_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
            </defs>

            <!-- Heavy Rectangular Rim -->
            <rect x="7" y="4" width="18" height="24" rx="3" fill="url(#ts_rim_${id})" stroke="#05070a" stroke-width="1.8" />

            <!-- Inner Plate (Shadow - Left side) -->
            <path d="M16 6 V26 H9.5 V6 Z" fill="url(#ts_face_s_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Inner Plate (Light - Right side) -->
            <path d="M16 6 V26 H22.5 V6 Z" fill="url(#ts_face_l_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Specular Highlight (Gleam) -->
            <polygon points="16,6.5 21,6.5 21,25.5 16,25.5" fill="rgba(255,255,255,0.15)" />

            <!-- Reinforced Horizontal Plate Band (Rarity Colored) -->
            <path d="M7 14.5 H25 V17.5 H7 Z" fill="${color}" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Reinforced Vertical Plate Band (Rarity Colored) -->
            <path d="M14.5 4 H17.5 V28 H14.5 Z" fill="${color}" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Heavy Central Boss Dome -->
            <circle cx="16" cy="16" r="3.8" fill="url(#ts_rim_${id})" stroke="#05070a" stroke-width="1.5" />
            <circle cx="16" cy="16" r="1.8" fill="${color}" stroke="#05070a" stroke-width="1.2" />
            <circle cx="15.2" cy="15.2" r="0.6" fill="#ffffff" />

            <!-- Heavy Corner Rivets (Left) -->
            <circle cx="9" cy="6" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="9" cy="16" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="9" cy="26" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />

            <!-- Heavy Corner Rivets (Right) -->
            <circle cx="23" cy="6" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="23" cy="16" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="23" cy="26" r="1.2" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
          `;
    },
    buckler(id, color) {
      return `
            <defs>
              <!-- Steel rim gradient -->
              <linearGradient id="bk_rim_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
              <!-- Inner face light gradient -->
              <linearGradient id="bk_face_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Inner face shadow gradient -->
              <linearGradient id="bk_face_s_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
            </defs>

            <!-- Outer Steel Rim -->
            <circle cx="16" cy="16" r="11" fill="url(#bk_rim_${id})" stroke="#05070a" stroke-width="1.8" />

            <!-- Inner Face (Shadow - Left side) -->
            <circle cx="16" cy="16" r="8.2" fill="url(#bk_face_s_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Inner Face (Light - Right side, drawn via arc boundary) -->
            <path d="M16 7.8 A8.2 8.2 0 0 1 16 24.2 Z" fill="url(#bk_face_l_${id})" />

            <!-- Specular Highlight (Gleam) -->
            <path d="M16 7.8 A8.2 8.2 0 0 1 21.8 11.8 Z" fill="rgba(255,255,255,0.22)" />

            <!-- Radiating Reinforcing Spikes (Crosshair array, Rarity Colored) -->
            <!-- Top Spike -->
            <polygon points="16,4.5 17.5,8 14.5,8" fill="${color}" stroke="#05070a" stroke-width="1.0" stroke-linejoin="round" />
            <!-- Right Spike -->
            <polygon points="27.5,16 24,17.5 24,14.5" fill="${color}" stroke="#05070a" stroke-width="1.0" stroke-linejoin="round" />
            <!-- Bottom Spike -->
            <polygon points="16,27.5 17.5,24 14.5,24" fill="${color}" stroke="#05070a" stroke-width="1.0" stroke-linejoin="round" />
            <!-- Left Spike -->
            <polygon points="4.5,16 8,17.5 8,14.5" fill="${color}" stroke="#05070a" stroke-width="1.0" stroke-linejoin="round" />

            <!-- Central Heavy Steel Boss Dome -->
            <circle cx="16" cy="16" r="4.2" fill="url(#bk_rim_${id})" stroke="#05070a" stroke-width="1.2" />
            <circle cx="16" cy="16" r="2.2" fill="${color}" stroke="#05070a" stroke-width="1.0" />
            <circle cx="15.2" cy="15.2" r="0.6" fill="#ffffff" />

            <!-- Spike Rivets -->
            <circle cx="16" cy="10" r="0.8" fill="#cbd5e1" stroke="#05070a" stroke-width="0.5" />
            <circle cx="22" cy="16" r="0.8" fill="#cbd5e1" stroke="#05070a" stroke-width="0.5" />
            <circle cx="16" cy="22" r="0.8" fill="#cbd5e1" stroke="#05070a" stroke-width="0.5" />
            <circle cx="10" cy="16" r="0.8" fill="#cbd5e1" stroke="#05070a" stroke-width="0.5" />
          `;
    },
    heater_shield(id, color) {
      return `
            <defs>
              <!-- Steel rim gradient -->
              <linearGradient id="hs_rim_${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#475569"/>
              </linearGradient>
              <!-- Inner plate light gradient -->
              <linearGradient id="hs_face_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="100%" stop-color="#94a3b8"/>
              </linearGradient>
              <!-- Inner plate shadow gradient -->
              <linearGradient id="hs_face_s_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
            </defs>

            <!-- Outer Steel Rim -->
            <path d="M6 5 H26 V14 C26 22, 16 29, 16 29 C16 29, 6 22, 6 14 Z" fill="url(#hs_rim_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Inner Plate (Shadow - Left side) -->
            <path d="M16 6.5 H8 V14 C8 20.8, 16 27, 16 27 Z" fill="url(#hs_face_s_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Inner Plate (Light - Right side) -->
            <path d="M16 6.5 H24 V14 C24 20.8, 16 27, 16 27 Z" fill="url(#hs_face_l_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Specular Highlight (Gleam) -->
            <path d="M16 6.5 H22 V14 C22 19, 16 24, 16 24 Z" fill="rgba(255,255,255,0.22)" />

            <!-- Central Heraldic Cross (Scales with Rarity Color) -->
            <path d="M15 8 H17 V12 H20 V14 H17 V21 H15 V14 H12 V12 H15 Z" fill="${color}" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />

            <!-- Center Core Gem Glistening -->
            <circle cx="16" cy="13" r="1.5" fill="#ffffff" opacity="0.8" />

            <!-- Steel Rim Rivets (Left side) -->
            <circle cx="8" cy="7" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="8" cy="13" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="11" cy="20" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="14" cy="25" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />

            <!-- Steel Rim Rivets (Right side) -->
            <circle cx="24" cy="7" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="24" cy="13" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="21" cy="20" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
            <circle cx="18" cy="25" r="1.0" fill="#cbd5e1" stroke="#05070a" stroke-width="0.8" />
          `;
    },
    aegis(id, color) {
      return `
              ${window.AssetCatalog.gradients.shield(id, color)}
              <path d="M16 3 L27 8 L24 22 L16 29 L8 22 L5 8 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
              <circle cx="16" cy="16" r="5" fill="none" stroke="#fff" stroke-dasharray="3 1.5" stroke-width="1.2" />
              <circle cx="16" cy="16" r="3.2" fill="${color}" stroke="#000" stroke-width="1" />
            `;
    },
    kris(id, color) {
      return `
              <!-- Wavy kris blade -->
              <path d="M16 4 Q19 7, 16 10 Q13 13, 16 16 L17 19 L15 19 L14 16 Q17 13, 14 10 Q11 7, 14 4 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" stroke-linejoin="round" />
              <rect x="11" y="19" width="10" height="2.2" rx="0.5" fill="${color}" stroke="#000" stroke-width="1" />
              <path d="M14.5 21 L13 26 Q16 29, 19 26 L17.5 21 Z" fill="#4a2711" stroke="#000" stroke-width="1" />
            `;
    },
    stiletto(id, color) {
      return `
              <!-- Ultra thin piercing needle stiletto blade -->
              <path d="M15.5 3 H16.5 L17 19 H15 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.5" />
              <rect x="11" y="19" width="10" height="2" rx="0.5" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14.5" y="21" width="3" height="7" rx="0.5" fill="#111" stroke="#000" stroke-width="1" />
              <circle cx="16" cy="28.5" r="1.5" fill="${color}" stroke="#000" stroke-width="0.8" />
            `;
    },
    baselard(id, color) {
      return `
              <!-- Straight broad diamond blade -->
              <path d="M16 4 L18 8 L17 19 H15 L14 8 Z" fill="#95a5a6" stroke="#000" stroke-width="1.8" />
              <!-- H-shaped hilt guard -->
              <rect x="10" y="19" width="12" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14.5" y="21.5" width="3" height="5" fill="#4a2306" stroke="#000" stroke-width="1" />
              <!-- H-shaped pommel -->
              <rect x="11" y="26.5" width="10" height="2.5" fill="${color}" stroke="#000" stroke-width="1" />
            `;
    },
    dirk(id, color) {
      return `
              <!-- Single edged heavy dirk blade -->
              <path d="M15 4 L17.5 7 L17.5 19 H14.5 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
              <rect x="12" y="19" width="8" height="2" fill="${color}" stroke="#000" stroke-width="1" />
              <rect x="14" y="21" width="4" height="6.5" fill="#5c3a21" stroke="#000" stroke-width="1" />
              <circle cx="16" cy="28" r="1.8" fill="${color}" stroke="#000" stroke-width="0.8" />
            `;
    },
    main_gauche(id, color) {
      return `
              <!-- Main Gauche curved guard dagger -->
              <path d="M16 4 L17.8 8 L17 19 H15 L14.2 8 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
              <!-- Ornate curved crossguard -->
              <path d="M9 19 Q16 16, 23 19" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" />
              <!-- Finger protection basket ring -->
              <path d="M13 19 C13 23, 19 23, 19 19" fill="none" stroke="${color}" stroke-width="1.5" />
              <rect x="14.5" y="21" width="3" height="6" fill="#111" stroke="#000" stroke-width="1" />
            `;
    },
    grimoire(id, color) {
      return `
                <defs>
                  <!-- Cel-shaded cover face: light and dark splits -->
                  <linearGradient id="gr_cover_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#2d0044" />
                    <stop offset="100%" stop-color="#1b002c" />
                  </linearGradient>
                  <linearGradient id="gr_cover_s_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#140020" />
                    <stop offset="100%" stop-color="#08000d" />
                  </linearGradient>
                  <!-- Metal plating corner guards & clasps -->
                  <linearGradient id="gr_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffe875" />
                    <stop offset="50%" stop-color="#9c7a10" />
                    <stop offset="100%" stop-color="#5a4504" />
                  </linearGradient>
                  <!-- Dynamic core magic aura glow -->
                  <radialGradient id="gr_glow_core_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
                    <stop offset="40%" stop-color="${color}" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Drop projection shadow (Subtle back lift) -->
                <rect x="6" y="5" width="22" height="24" rx="2.5" fill="rgba(0,0,0,0.4)" />

                <!-- Book spine base & bind wraps -->
                <rect x="5" y="4" width="5" height="24" rx="1.5" fill="#08000d" stroke="#05070a" stroke-width="1.8" />
                <!-- Spine Horizontal Ribbing -->
                <line x1="5" y1="8" x2="10" y2="8" stroke="url(#gr_brass_${id})" stroke-width="1.5" />
                <line x1="5" y1="13" x2="10" y2="13" stroke="url(#gr_brass_${id})" stroke-width="1.5" />
                <line x1="5" y1="18" x2="10" y2="18" stroke="url(#gr_brass_${id})" stroke-width="1.5" />
                <line x1="5" y1="23" x2="10" y2="23" stroke="url(#gr_brass_${id})" stroke-width="1.5" />

                <!-- Stacked Parchment Page Edges (Visible at the right and bottom) -->
                <!-- Base page block -->
                <rect x="9.5" y="4.5" width="16.5" height="23" fill="#eae1c8" />
                <!-- Page layering lines -->
                <line x1="26" y1="5" x2="26" y2="27" stroke="#9e957e" stroke-width="1" stroke-dasharray="1 1" />
                <line x1="10" y1="27.5" x2="26" y2="27.5" stroke="#9e957e" stroke-width="1" stroke-dasharray="1 1" />

                <!-- Main Leather Cover Face (Highlight / Light Side) -->
                <path d="M10 4 L25.5 4 L25.5 28 L10 28 Z" fill="url(#gr_cover_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Cel-shaded Cover Split (Shadow / Dark Side overlay) -->
                <path d="M10 4 L17 4 L10 28 Z" fill="url(#gr_cover_s_${id})" stroke="#05070a" stroke-width="1.2" opacity="0.9" />

                <!-- Gilded Corner Brackets (Top-Right & Bottom-Right Protection Plates) -->
                <!-- Top Right Guard -->
                <polygon points="21,4 25.5,4 25.5,8.5" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="23.5" cy="6" r="0.6" fill="#fff" />
                <!-- Bottom Right Guard -->
                <polygon points="21,28 25.5,28 25.5,23.5" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="23.5" cy="26" r="0.6" fill="#fff" />

                <!-- Dynamic Magic Spell Circle Radial Glow -->
                <circle cx="18" cy="16" r="7.5" fill="url(#gr_glow_core_${id})" opacity="0.85" />

                <!-- Central Occult Hex-Ring / Runic Sigil -->
                <circle cx="18" cy="16" r="5" fill="none" stroke="url(#gr_brass_${id})" stroke-width="1" />
                <circle cx="18" cy="16" r="3.8" fill="none" stroke="${color}" stroke-width="0.8" stroke-dasharray="1.5 1.5" />
                <!-- Star of Knowledge glyph -->
                <polygon points="18,12.5 19.5,15.5 21.5,16 19.8,17.5 20.2,19.5 18,18.2 15.8,19.5 16.2,17.5 14.5,16 16.5,15.5" fill="#ffffff" stroke="${color}" stroke-width="0.6" />
                <circle cx="18" cy="16" r="1" fill="#ffffff" />

                <!-- Strap-lock plate & lock mechanism -->
                <!-- Leather security strap -->
                <rect x="23.5" y="13.5" width="3" height="5" fill="#5c3a21" stroke="#05070a" stroke-width="1" />
                <!-- Forbidden Padlock Base -->
                <rect x="24.5" y="11.5" width="4" height="9" rx="1" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="1.2" />
                <!-- Central Seal Gem (Pulsating Tier Color) -->
                <circle cx="26.5" cy="16" r="1" fill="${color}" stroke="#05070a" stroke-width="0.6" />
                <circle cx="26.2" cy="15.7" r="0.3" fill="#fff" />
              `;
    },
    codex(id, color) {
      return `
                <defs>
                  <!-- Cel-shaded Wood cover grain -->
                  <linearGradient id="cx_wood_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#4d290c" />
                    <stop offset="100%" stop-color="#2e1805" />
                  </linearGradient>
                  <!-- Heavy brass frame and fixtures -->
                  <linearGradient id="cx_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffe875" />
                    <stop offset="50%" stop-color="#9c7a10" />
                    <stop offset="100%" stop-color="#5a4504" />
                  </linearGradient>
                  <!-- Dynamic steam-engine kinetic glow -->
                  <radialGradient id="cx_glow_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="45%" stop-color="${color}" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Drop shadow projection -->
                <rect x="6" y="5" width="21" height="24" rx="2.5" fill="rgba(0,0,0,0.4)" />

                <!-- Spine binding wraps -->
                <rect x="5" y="4" width="5" height="24" rx="1.5" fill="#1c0f07" stroke="#05070a" stroke-width="1.8" />
                <line x1="5" y1="9" x2="10" y2="9" stroke="url(#cx_brass_${id})" stroke-width="1.2" />
                <line x1="5" y1="16" x2="10" y2="16" stroke="url(#cx_brass_${id})" stroke-width="1.2" />
                <line x1="5" y1="23" x2="10" y2="23" stroke="url(#cx_brass_${id})" stroke-width="1.2" />

                <!-- Yellowed Relic Parchment Sheet Layers (Visible right & bottom) -->
                <rect x="9.5" y="4.5" width="16" height="23" fill="#eae1c8" />
                <line x1="25.5" y1="5" x2="25.5" y2="27" stroke="#9e957e" stroke-width="1" stroke-dasharray="1 1" />
                <line x1="10" y1="27" x2="25.5" y2="27" stroke="#9e957e" stroke-width="1" stroke-dasharray="1 1" />

                <!-- Core Wood Cover Face -->
                <path d="M10 4 L25 4 L25 28 L10 28 Z" fill="url(#cx_wood_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Heavy Brass Binding Plates (Top & Bottom reinforcing bands) -->
                <path d="M10 4 H25 V7.5 H10 Z" fill="url(#cx_brass_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M10 24.5 H25 V28 H10 Z" fill="url(#cx_brass_${id})" stroke="#05070a" stroke-width="1.2" />
                <!-- Rivet Details -->
                <circle cx="12" cy="5.8" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />
                <circle cx="17.5" cy="5.8" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />
                <circle cx="23" cy="5.8" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />
                <circle cx="12" cy="26.2" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />
                <circle cx="17.5" cy="26.2" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />
                <circle cx="23" cy="26.2" r="0.6" fill="#fff" stroke="#05070a" stroke-width="0.3" />

                <!-- Steampunk Conduit Pipe Accents -->
                <path d="M10 11.5 H14" stroke="#05070a" stroke-width="1" stroke-linecap="round" />
                <path d="M22 11.5 H25" stroke="#05070a" stroke-width="1" stroke-linecap="round" />

                <!-- Dynamic Kinetic Pressure Center Core Glow -->
                <circle cx="18" cy="16" r="6" fill="url(#cx_glow_${id})" opacity="0.85" />

                <!-- Master Brass 8-Tooth Cog Assembly -->
                <g stroke="url(#cx_brass_${id})" stroke-width="1.8" stroke-linecap="round">
                  <line x1="18" y1="10" x2="18" y2="22" />
                  <line x1="12" y1="16" x2="24" y2="16" />
                  <line x1="13.7" y1="11.7" x2="22.3" y2="20.3" />
                  <line x1="13.7" y1="20.3" x2="22.3" y2="11.7" />
                </g>
                <!-- Solid gear plate covering the crosshairs to create teeth spokes -->
                <circle cx="18" cy="16" r="4.5" fill="#0c0702" stroke="#05070a" stroke-width="1.2" />
                <!-- Hot glowing energy core matching rarity -->
                <circle cx="18" cy="16" r="2.2" fill="${color}" stroke="#fff" stroke-width="0.8" />

                <!-- Secondary Interlocking Mini Brass Cog Assembly -->
                <g stroke="url(#cx_brass_${id})" stroke-width="1.2" stroke-linecap="round" opacity="0.85">
                  <line x1="13" y1="18.5" x2="13" y2="24.5" />
                  <line x1="10" y1="21.5" x2="16" y2="21.5" />
                  <line x1="10.8" y1="19.3" x2="15.2" y2="23.7" />
                  <line x1="10.8" y1="23.7" x2="15.2" y2="19.3" />
                </g>
                <circle cx="13" cy="21.5" r="2.2" fill="#0c0702" stroke="#05070a" stroke-width="1" />
                <circle cx="13" cy="21.5" r="0.8" fill="#fff" />
              `;
    },
    lexicon(id, color) {
      return `
                <defs>
                  <!-- Academic royal velvet cover gradient -->
                  <linearGradient id="lx_velvet_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#255182" />
                    <stop offset="100%" stop-color="#0e2035" />
                  </linearGradient>
                  <!-- Polished gold emboss/filigrees -->
                  <linearGradient id="lx_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffe875" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#8a6d1c" />
                  </linearGradient>
                  <!-- Dynamic magical iris lens glow -->
                  <radialGradient id="lx_iris_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="55%" stop-color="${color}" />
                    <stop offset="100%" stop-color="#05070a" />
                  </radialGradient>
                </defs>

                <!-- Drop shadow projection -->
                <rect x="6" y="5" width="21" height="24" rx="2.5" fill="rgba(0,0,0,0.4)" />

                <!-- Hanging Silk Bookmark Ribbon (Dangles from page margins) -->
                <path d="M13.5 25.5 L13.5 30.5 Q14.5 31.5, 15.5 30.5 L15.5 25.5 Z" fill="#e74c3c" stroke="#05070a" stroke-width="0.8" />

                <!-- Spine binding wraps -->
                <rect x="5" y="4" width="5" height="24" rx="1.5" fill="#0b172a" stroke="#05070a" stroke-width="1.8" />
                <!-- Heavy Gilded Spine Ribs -->
                <line x1="5" y1="9" x2="10" y2="9" stroke="url(#lx_gold_${id})" stroke-width="1.5" />
                <line x1="5" y1="16" x2="10" y2="16" stroke="url(#lx_gold_${id})" stroke-width="1.5" />
                <line x1="5" y1="23" x2="10" y2="23" stroke="url(#lx_gold_${id})" stroke-width="1.5" />

                <!-- Layered Academic Ivory Page Edges (Visible right & bottom) -->
                <rect x="9.5" y="4.5" width="16" height="23" fill="#faf6eb" />
                <line x1="25.5" y1="5" x2="25.5" y2="27" stroke="#c2bdae" stroke-width="1" stroke-dasharray="1 1" />
                <line x1="10" y1="27" x2="25.5" y2="27" stroke="#c2bdae" stroke-width="1" stroke-dasharray="1 1" />

                <!-- Royal Blue Velvet Cover Plate -->
                <path d="M10 4 L25 4 L25 28 L10 28 Z" fill="url(#lx_velvet_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Ornate Gold-Embossed Corner Reinforcements -->
                <!-- Top Right Guard -->
                <polygon points="21,4 25,4 25,8" fill="url(#lx_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="23.5" cy="5.5" r="0.4" fill="#fff" />
                <!-- Bottom Right Guard -->
                <polygon points="21,28 25,28 25,24" fill="url(#lx_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="23.5" cy="26.5" r="0.4" fill="#fff" />

                <!-- Gilded Scholarly Eye of Wisdom Frame -->
                <path d="M11.5 16 Q17.5 10.5, 23.5 16 Q17.5 21.5, 11.5 16 Z" fill="none" stroke="url(#lx_gold_${id})" stroke-width="1.5" stroke-linejoin="round" />
                <!-- Eye Whites (Sclera) -->
                <path d="M12.5 16 Q17.5 11.5, 22.5 16 Q17.5 20.5, 12.5 16 Z" fill="#ffffff" stroke="#05070a" stroke-width="0.8" />
                <!-- Dynamic Glowing Iris (Reflects rarity color with reflective white gloss) -->
                <circle cx="17.5" cy="16" r="3.2" fill="url(#lx_iris_${id})" stroke="#05070a" stroke-width="0.8" />
                <!-- Piercing Pupil -->
                <circle cx="17.5" cy="16" r="1.2" fill="#000000" />
                <!-- Specular Light Reflection Glint -->
                <circle cx="16.5" cy="15" r="0.6" fill="#ffffff" />
              `;
    },
    chronicle(id, color) {
      return `
                <defs>
                  <!-- Aged mahogany relic leather gradient -->
                  <linearGradient id="ch_relic_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#4a1a02" />
                    <stop offset="100%" stop-color="#140600" />
                  </linearGradient>
                  <!-- Antique gold/brass for hourglass frames -->
                  <linearGradient id="ch_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffd54f" />
                    <stop offset="50%" stop-color="#b7950b" />
                    <stop offset="100%" stop-color="#5d4037" />
                  </linearGradient>
                  <!-- Glowing cosmic sand reserves -->
                  <linearGradient id="ch_sand_${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="${color}" />
                  </linearGradient>
                </defs>

                <!-- Drop shadow projection -->
                <rect x="6" y="5" width="21" height="24" rx="2.5" fill="rgba(0,0,0,0.4)" />

                <!-- Spine binding wraps with antique gold rivets -->
                <rect x="5" y="4" width="5" height="24" rx="1.5" fill="#1c0700" stroke="#05070a" stroke-width="1.8" />
                <circle cx="7.5" cy="8" r="0.8" fill="url(#ch_gold_${id})" stroke="#05070a" stroke-width="0.4" />
                <circle cx="7.5" cy="16" r="0.8" fill="url(#ch_gold_${id})" stroke="#05070a" stroke-width="0.4" />
                <circle cx="7.5" cy="24" r="0.8" fill="url(#ch_gold_${id})" stroke="#05070a" stroke-width="0.4" />

                <!-- Yellowed & Weathered Stacked Pages (Visible right & bottom) -->
                <rect x="9" y="4.5" width="16" height="23" fill="#dfd0b0" />
                <!-- Uneven aging layers -->
                <line x1="25" y1="5" x2="25" y2="27" stroke="#8c7a56" stroke-width="1.2" stroke-dasharray="2 1.5" />
                <line x1="10" y1="27" x2="25" y2="27" stroke="#8c7a56" stroke-width="1.2" stroke-dasharray="2 1.5" />

                <!-- Mahogany Relic Leather Cover Face -->
                <path d="M10 4 L24 4 L24 28 L10 28 Z" fill="url(#ch_relic_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Cracked Leather Creases (Visual aging detail) -->
                <path d="M10 10 L14 7" stroke="#05070a" stroke-width="1.2" opacity="0.65" stroke-linecap="round" />
                <path d="M11 22 L14 25" stroke="#05070a" stroke-width="1.2" opacity="0.65" stroke-linecap="round" />
                <path d="M19 5 L22 8" stroke="#05070a" stroke-width="1.2" opacity="0.65" stroke-linecap="round" />
                <path d="M19 27 L22 24" stroke="#05070a" stroke-width="1.2" opacity="0.65" stroke-linecap="round" />

                <!-- Temporal Gravity Orbit Halo (Dotted background cycle) -->
                <circle cx="17" cy="16" r="7.5" fill="none" stroke="${color}" stroke-width="1" stroke-dasharray="2 3" opacity="0.75" />

                <!-- Hourglass Support Frame (Braces & Pillars) -->
                <!-- Top & Bottom Braces -->
                <rect x="13.5" y="9" width="7" height="1.8" fill="url(#ch_gold_${id})" stroke="#05070a" stroke-width="0.8" rx="0.3" />
                <rect x="13.5" y="21.2" width="7" height="1.8" fill="url(#ch_gold_${id})" stroke="#05070a" stroke-width="0.8" rx="0.3" />
                <!-- Left & Right Bracing Pillars -->
                <line x1="14" y1="10.8" x2="14" y2="21.2" stroke="url(#ch_gold_${id})" stroke-width="1" />
                <line x1="20" y1="10.8" x2="20" y2="21.2" stroke="url(#ch_gold_${id})" stroke-width="1" />

                <!-- Hourglass Glass Bulbs Shape -->
                <path d="M14.5 10.8 Q17 16, 14.5 21.2 M19.5 10.8 Q17 16, 19.5 21.2" stroke="rgba(255,255,255,0.4)" stroke-width="1" fill="none" />

                <!-- Glowing Cosmic Sand Reserves -->
                <!-- Upper sand funnel (Draining downwards) -->
                <polygon points="14.8,11.2 19.2,11.2 17.5,14.5" fill="url(#ch_sand_${id})" stroke="#05070a" stroke-width="0.5" />
                <!-- Lower sand pile (Amassing in the base) -->
                <path d="M15,20.8 C15,19 19,19 19,20.8 Z" fill="url(#ch_sand_${id})" stroke="#05070a" stroke-width="0.5" />
                <!-- Sand trickle flow line -->
                <line x1="17" y1="14.5" x2="17" y2="19.2" stroke="${color}" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.9" />

                <!-- Glass Reflection glare highlights -->
                <path d="M15.5 11.5 Q16.5 13, 16 13.8" stroke="#fff" stroke-width="0.6" stroke-linecap="round" opacity="0.6" fill="none" />
                <path d="M18.5 20.5 Q17.5 19, 18 18.2" stroke="#fff" stroke-width="0.6" stroke-linecap="round" opacity="0.6" fill="none" />
              `;
    },
    greathelm(id, color) {
      return `
                <defs>
                  <!-- Right side: bright polished steel plates -->
                  <linearGradient id="gh_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#f8fafc" />
                    <stop offset="60%" stop-color="#94a3b8" />
                    <stop offset="100%" stop-color="#475569" />
                  </linearGradient>
                  <!-- Left side: cold, shadowed dark iron plates -->
                  <linearGradient id="gh_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569" />
                    <stop offset="100%" stop-color="#1e293b" />
                  </linearGradient>
                  <!-- Crusader cross plate: gold/bronze trim -->
                  <linearGradient id="gh_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#8a6d1c" />
                  </linearGradient>
                  <!-- Plume crest color interpolation matching tier rarity -->
                  <linearGradient id="gh_plume_${id}" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stop-color="${color}" />
                    <stop offset="70%" stop-color="${color}" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="#ffffff" />
                  </linearGradient>
                </defs>

                <!-- Flowing Feather Plume Crest (Flowing backwards & left) -->
                <path d="M16 8 C11 4, 7 5, 4 10 C8 5, 12 6, 16 8 Z" fill="url(#gh_plume_${id})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />
                <path d="M16 8 C13 2, 9 2, 6 6 C10 2, 13 4, 16 8 Z" fill="url(#gh_plume_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />

                <!-- Left Helmet Plate (Shadowed Side) -->
                <path d="M16 8 H9 V23 L16 29 Z" fill="url(#gh_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Right Helmet Plate (Highlighted Side) -->
                <path d="M16 8 H23 V23 L16 29 Z" fill="url(#gh_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Center welding weld seam line -->
                <line x1="16" y1="8" x2="16" y2="29" stroke="#05070a" stroke-width="1" opacity="0.4" />

                <!-- Solid Crusader Cross Visor Plate (Reinforcement Brass Overlay) -->
                <path d="M14.5 9 H17.5 V12 H21.5 V15 H17.5 V23.5 H14.5 V15 H10.5 V12 H14.5 Z" fill="url(#gh_brass_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Narrow Vision Eye Slits (Inset inside the crossbar) -->
                <rect x="11.2" y="13" width="3.2" height="1.2" fill="#05070a" rx="0.3" />
                <rect x="17.6" y="13" width="3.2" height="1.2" fill="#05070a" rx="0.3" />
                <!-- Glowing Eyes of Power (Pulsating dynamic rarity color) -->
                                <circle cx="12.8" cy="13.6" r="0.6" fill="${color}" />
                                <circle cx="19.2" cy="13.6" r="0.6" fill="${color}" />
                              `;
    },
    armet(id, color) {
      return `
                <defs>
                  <!-- Polished outer plate-steel gradients -->
                  <linearGradient id="ar_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="45%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                  </linearGradient>
                  <!-- Cold blue-grey shadowed steel gradients -->
                  <linearGradient id="ar_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569" />
                    <stop offset="100%" stop-color="#1e293b" />
                  </linearGradient>
                  <!-- Brass locks and pivots -->
                  <linearGradient id="ar_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#5d4037" />
                  </linearGradient>
                  <!-- Pressurized dynamic magical pressure vent glow -->
                  <radialGradient id="ar_glow_vent_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="45%" stop-color="${color}" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Anatomical Skullcap Dome: Left Plate (Shadow) -->
                <path d="M16 4.2 C11 4.5, 9 6, 9 10 L8 23 L16 29 Z" fill="url(#ar_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Anatomical Skullcap Dome: Right Plate (Highlighted) -->
                <path d="M16 4.2 C21 4.5, 23 6, 23 10 L24 23 L16 29 Z" fill="url(#ar_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Gilded Skullcap Comb Ridge with Inset Rarity Jewel -->
                <path d="M14.5 5 C14.5 2, 17.5 2, 17.5 5 L16 8 Z" fill="url(#ar_brass_${id})" stroke="#05070a" stroke-width="1" />
                <circle cx="16" cy="3" r="1" fill="${color}" stroke="#05070a" stroke-width="0.5" />

                <!-- Articulated Sparrow's Beak Visor: Left Beak Facet (Shadow) -->
                <path d="M9 11.5 Q16 6.5, 16 19.5 L10.5 19 Z" fill="url(#ar_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Articulated Sparrow's Beak Visor: Right Beak Facet (Highlighted) -->
                <path d="M16 19.5 Q16 6.5, 23 11.5 L21.5 19 Z" fill="url(#ar_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Visor center beak line seam -->
                <line x1="16" y1="7.2" x2="16" y2="19.5" stroke="#05070a" stroke-width="1" opacity="0.25" />

                <!-- Gilded Pivot Hinges with Rarity-Core Rivets -->
                <circle cx="9" cy="12" r="1.5" fill="url(#ar_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="9" cy="12" r="0.6" fill="${color}" />
                <circle cx="23" cy="12" r="1.5" fill="url(#ar_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="23" cy="12" r="0.6" fill="${color}" />

                <!-- Beveled Eye Vision Slots (Inset into Beak facets) -->
                <polygon points="10.8,12 15,13.5 15,12 10.8,11.5" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
                <polygon points="21.2,12 17,13.5 17,12 21.2,11.5" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
                <!-- Glowing ocular focus glints -->
                <circle cx="12.6" cy="12.2" r="0.5" fill="${color}" />
                <circle cx="19.4" cy="12.2" r="0.5" fill="${color}" />

                <!-- Glowing Magically Pressurized Breathing Vents -->
                <!-- Backplate Glows -->
                <circle cx="13" cy="16.5" r="2" fill="url(#ar_glow_vent_${id})" opacity="0.8" />
                <circle cx="19" cy="16.5" r="2" fill="url(#ar_glow_vent_${id})" opacity="0.8" />
                <!-- Angled Cheek Vent Slits -->
                <line x1="11.5" y1="15.5" x2="13.5" y2="17.5" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
                <line x1="13.5" y1="15.5" x2="15" y2="17" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
                <line x1="20.5" y1="15.5" x2="18.5" y2="17.5" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
                <line x1="18.5" y1="15.5" x2="17" y2="17" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />

                <!-- Bottom Neck Guard articulating flange line -->
                <path d="M8.5 24 C12 22, 20 22, 23.5 24" stroke="#05070a" stroke-width="1.5" fill="none" opacity="0.3" />
              `;
    },
    bascinet(id, color) {
      return `
                <defs>
                  <!-- Mirror-polished high-shine steel gradient -->
                  <linearGradient id="ba_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="50%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#475569" />
                  </linearGradient>
                  <!-- Cold blue-grey shadowed steel gradient -->
                  <linearGradient id="ba_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569" />
                    <stop offset="100%" stop-color="#1e293b" />
                  </linearGradient>
                  <!-- Antique gold/brass for joints & borders -->
                  <linearGradient id="ba_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#5d4037" />
                  </linearGradient>
                  <!-- Pressurized dynamic magical snout exhaust glow -->
                  <radialGradient id="ba_glow_snout_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="45%" stop-color="${color}" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Conical Skullcap Dome: Left Facet (Shadow) -->
                <path d="M16 3 C12 4, 9 7, 9 12 L8 23 L16 29 Z" fill="url(#ba_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Conical Skullcap Dome: Right Facet (Highlighted) -->
                <path d="M16 3 C20 4, 23 7, 23 12 L24 23 L16 29 Z" fill="url(#ba_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Gilded Crown Spike Socket & Rarity Jewel -->
                <polygon points="15,3 17,3 16,1" fill="url(#ba_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="16" cy="1" r="0.6" fill="${color}" />

                <!-- Pointed Houndskull Visor Face: Left Side (Shadow) -->
                <path d="M10 11 L16 15 L16 24 L12 20 Z" fill="url(#ba_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Pointed Houndskull Visor Face: Right Side (Highlighted) -->
                <path d="M22 11 L16 15 L16 24 L20 20 Z" fill="url(#ba_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Visor pivot joints at temples -->
                <circle cx="10" cy="11.5" r="1.2" fill="url(#ba_gold_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="22" cy="11.5" r="1.2" fill="url(#ba_gold_${id})" stroke="#05070a" stroke-width="0.5" />

                <!-- Angled vision squint slots -->
                <polygon points="11,12.5 15,13.5 14.8,14.5 11,13.5" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
                <polygon points="21,12.5 17,13.5 17.2,14.5 21,13.5" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
                <!-- Glowing focus sparks -->
                <circle cx="13" cy="13.2" r="0.5" fill="${color}" />
                <circle cx="19" cy="13.2" r="0.5" fill="${color}" />

                <!-- Magical breathing vents background pressure glows -->
                <circle cx="14" cy="19.5" r="2.2" fill="url(#ba_glow_snout_${id})" opacity="0.8" />
                <circle cx="18" cy="19.5" r="2.2" fill="url(#ba_glow_snout_${id})" opacity="0.8" />

                <!-- Punched metal respiration ports -->
                <circle cx="14" cy="18.5" r="0.8" fill="#05070a" />
                <circle cx="18" cy="18.5" r="0.8" fill="#05070a" />
                <circle cx="13.5" cy="20.5" r="0.8" fill="#05070a" />
                <circle cx="18.5" cy="20.5" r="0.8" fill="#05070a" />
                <circle cx="15.5" cy="22.2" r="0.8" fill="#05070a" />
                <circle cx="16.5" cy="22.2" r="0.8" fill="#05070a" />

                <!-- Decorative neckguard aventail verveilles collar -->
                <path d="M8 23 C12 21.5, 20 21.5, 24 23" fill="none" stroke="url(#ba_gold_${id})" stroke-width="1.8" />
              `;
    },
    barbuta(id, color) {
      return `
                <defs>
                  <!-- Sleek polished blue-grey steel plate gradient -->
                  <linearGradient id="bb_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="50%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#475569" />
                  </linearGradient>
                  <!-- Deep, rich slate-iron shadow gradient -->
                  <linearGradient id="bb_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569" />
                    <stop offset="100%" stop-color="#1e293b" />
                  </linearGradient>
                  <!-- Polished gold-brass for the faceplate trim & rivets -->
                  <linearGradient id="bb_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#8a6d1c" />
                  </linearGradient>
                </defs>

                <!-- Corinthian Skullcap: Left Half (Shadow Side) -->
                <path d="M16 4 C11 4.5, 9 6, 9 10 L8 24 L16 29 Z" fill="url(#bb_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Corinthian Skullcap: Right Half (Highlighted Side) -->
                <path d="M16 4 C21 4.5, 23 6, 23 10 L24 24 L16 29 Z" fill="url(#bb_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Gilded Crown Comb Ridge with embedded dynamic rarity groove -->
                <path d="M15 4 C15 2.5, 17 2.5, 17 4 L16.5 10 H15.5 Z" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <line x1="16" y1="3.2" x2="16" y2="9" stroke="${color}" stroke-width="0.8" stroke-linecap="round" />

                <!-- Dark Void Helmet Interior (Deep shadow base) -->
                <path d="M12 10 H20 V16 L17 16 V24 H15 V16 L12 16 Z" fill="#05070a" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />

                <!-- Gilded T-Shaped Opening Outer Trim Frame -->
                <path d="M12 10 H20 V16 L17 16 V24 H15 V16 L12 16 Z" fill="none" stroke="url(#bb_gold_${id})" stroke-width="1.2" stroke-linejoin="round" />

                <!-- Piercing Ocular Focus Sparks (Pulsating dynamic rarity color inside void) -->
                <circle cx="14" cy="13.5" r="0.6" fill="${color}" />
                <circle cx="18" cy="13.5" r="0.6" fill="${color}" />
                <!-- Ocular Glint Highlight -->
                <circle cx="13.8" cy="13.3" r="0.2" fill="#fff" />
                <circle cx="17.8" cy="13.3" r="0.2" fill="#fff" />

                <!-- Decorative Cheek Lining Rivets (Tracks inner liner margin) -->
                <!-- Left Side Rivets -->
                <circle cx="9.5" cy="15" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
                <circle cx="9.2" cy="19" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
                <circle cx="9.5" cy="23" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
                <!-- Right Side Rivets -->
                <circle cx="22.5" cy="15" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
                <circle cx="22.8" cy="19" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
                <circle cx="22.5" cy="23" r="0.6" fill="url(#bb_gold_${id})" stroke="#05070a" stroke-width="0.3" />
              `;
    },
    circlet(id, color) {
      return `
                <defs>
                  <!-- Silver/Platinum band gradient -->
                  <linearGradient id="ci_plat_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="50%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                  </linearGradient>
                  <!-- Royal gold band & filigree gradient -->
                  <linearGradient id="ci_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275" />
                    <stop offset="50%" stop-color="#d4af37" />
                    <stop offset="100%" stop-color="#8a6d1c" />
                  </linearGradient>
                  <!-- Faceted gemstone radial gradient mapping rarity -->
                  <radialGradient id="ci_gem_${id}" cx="50%" cy="30%" r="50%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="45%" stop-color="${color}" />
                    <stop offset="100%" stop-color="#090d16" />
                  </radialGradient>
                  <!-- Soft magic background aura glow -->
                  <radialGradient id="ci_halo_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.6" />
                    <stop offset="100%" stop-color="${color}" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Soft Magic Back Glow (Centers on the teardrop gem) -->
                <circle cx="16" cy="12.5" r="7.5" fill="url(#ci_halo_${id})" />

                <!-- Woven Double-Band Tiara Base -->
                <!-- Gold Band (lower sweeping loop) -->
                <path d="M5.5 17 Q16 22, 26.5 17" fill="none" stroke="url(#ci_gold_${id})" stroke-width="1.8" stroke-linecap="round" />
                <!-- Platinum Band (upper woven sweeping loop) -->
                <path d="M5.5 18 Q16 13, 26.5 18" fill="none" stroke="url(#ci_plat_${id})" stroke-width="1.2" stroke-linecap="round" />

                <!-- Central Elven Gold Filigree Crown Base -->
                <path d="M11 16 Q16 8, 21 16 L19 18 Q16 12, 13 18 Z" fill="url(#ci_gold_${id})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />

                <!-- Top Crown Jewel Peak -->
                <polygon points="16,5.5 18.5,8.5 13.5,8.5" fill="url(#ci_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="16" cy="5.2" r="1.2" fill="url(#ci_gem_${id})" stroke="#05070a" stroke-width="0.6" />

                <!-- Suspended Teardrop Gemstone (Brooch-style center anchor) -->
                <path d="M16 10 C14 13.5, 14 16, 16 16 C18 16, 18 13.5, 16 10 Z" fill="url(#ci_gem_${id})" stroke="#05070a" stroke-width="1.0" />
                <!-- Specular Glint Highlight -->
                <ellipse cx="15.5" cy="12.5" rx="0.5" ry="1.2" fill="#ffffff" transform="rotate(-15 15.5 12.5)" />

                <!-- Gilded Symmetrical Wing Gem Sockets -->
                <!-- Left Wing Gem -->
                <circle cx="10" cy="16.5" r="2.2" fill="url(#ci_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="10" cy="16.5" r="1.2" fill="url(#ci_gem_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="9.6" cy="16.1" r="0.4" fill="#fff" />
                <!-- Right Wing Gem -->
                <circle cx="22" cy="16.5" r="2.2" fill="url(#ci_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="22" cy="16.5" r="1.2" fill="url(#ci_gem_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="21.6" cy="16.1" r="0.4" fill="#fff" />

                <!-- Floating Magical Stardust Halo (Orbiting above peak points) -->
                <circle cx="16" cy="3" r="0.6" fill="${color}" opacity="0.85" />
                <circle cx="12" cy="4.5" r="0.6" fill="${color}" opacity="0.65" />
                <circle cx="20" cy="4.5" r="0.6" fill="${color}" opacity="0.65" />
                <circle cx="8.5" cy="7" r="0.6" fill="${color}" opacity="0.45" />
                <circle cx="23.5" cy="7" r="0.6" fill="${color}" opacity="0.45" />
              `;
    },
    coif(id, color) {
      return `
            <defs>
              <!-- Steel mail mesh light gradient -->
              <linearGradient id="cf_mail_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Dark steel mail shadow gradient -->
              <linearGradient id="cf_mail_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Quilted leather lining gradient -->
              <linearGradient id="cf_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
              <!-- Brass/Gold strap fixtures -->
              <linearGradient id="cf_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Draped Shoulder Mantle (Shadow Left Side) -->
            <path d="M16 4 C10 4, 7 8, 7 14 L5 24 L16 29 Z" fill="url(#cf_mail_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Draped Shoulder Mantle (Light Right Side) -->
            <path d="M16 4 C22 4, 25 8, 25 14 L27 24 L16 29 Z" fill="url(#cf_mail_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Interlocking Chainmail Texture Pattern Lines -->
            <path d="M8 12 Q16 10, 24 12 M7 16 Q16 14, 25 16 M6 20 Q16 18, 26 20 M6 24 Q16 22, 26 24" fill="none" stroke="#05070a" stroke-width="1" stroke-dasharray="2 1.5" opacity="0.6" />

            <!-- Quilted Gambeson Padded Face Cutout Interior -->
            <path d="M12 11 C12 7, 20 7, 20 11 L20 19 C20 22, 12 22, 12 19 Z" fill="url(#cf_leather_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Quilted Diamond Stitching on Leather Liner -->
            <path d="M13 10 L19 16 M13 14 L18 19 M17 10 L12 15 M19 13 L13 19" stroke="#3d1d0b" stroke-width="0.8" opacity="0.8" />

            <!-- Deep Shadow Void Inside Face Hole -->
            <ellipse cx="16" cy="14" rx="2.8" ry="3.8" fill="#05070a" />
            <circle cx="15" cy="13.5" r="0.5" fill="${color}" />
            <circle cx="17" cy="13.5" r="0.5" fill="${color}" />

            <!-- Reinforced Brow Leather Band with Rarity Stitching -->
            <path d="M9.5 9 Q16 7.5, 22.5 9" fill="none" stroke="url(#cf_leather_${id})" stroke-width="2.2" stroke-linecap="round" />
            <path d="M9.5 9 Q16 7.5, 22.5 9" fill="none" stroke="${color}" stroke-width="0.8" stroke-linecap="round" stroke-dasharray="1.5 1.5" />

            <!-- Gilded Forehead Plate & Gem Anchor -->
            <polygon points="16,6.5 17.5,8.5 14.5,8.5" fill="url(#cf_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="6.2" r="1" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="5.9" r="0.3" fill="#ffffff" />
          `;
    },
    visor(id, color) {
      return `
            <defs>
              <!-- Polished outer plate steel gradients -->
              <linearGradient id="vr_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Shadowed steel gradients -->
              <linearGradient id="vr_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Brass/Gold hinge and pivot fixtures -->
              <linearGradient id="vr_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
              <!-- Breathing vent pressure glow -->
              <radialGradient id="vr_glow_vent_${id}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="${color}"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Main Skullcap Dome: Left Facet (Shadow Side) -->
            <path d="M16 4 C11 4.5, 9 6, 9 10 L8 23 L16 29 Z" fill="url(#vr_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Skullcap Dome: Right Facet (Highlight Side) -->
            <path d="M16 4 C21 4.5, 23 6, 23 10 L24 23 L16 29 Z" fill="url(#vr_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Gilded Crest Comb Ridge -->
            <path d="M15 4.5 C15 2.5, 17 2.5, 17 4.5 L16.5 9.5 H15.5 Z" fill="url(#vr_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="3.5" r="0.8" fill="${color}" stroke="#05070a" stroke-width="0.4" />

            <!-- Pivoting Face Visor Plate: Left Facet (Shadow) -->
            <path d="M8.5 10 L16 11.5 L16 23 L10.5 21 Z" fill="url(#vr_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Pivoting Face Visor Plate: Right Facet (Highlight) -->
            <path d="M23.5 10 L16 11.5 L16 23 L21.5 21 Z" fill="url(#vr_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Brow Hinge Reinforcement Band -->
            <path d="M8.5 10.2 Q16 8.5, 23.5 10.2 L23 12 Q16 10.5, 9 12 Z" fill="url(#vr_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Side Temple Pivot Hinge Pins -->
            <circle cx="8" cy="11" r="1.8" fill="url(#vr_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="8" cy="11" r="0.8" fill="${color}" />
            <circle cx="24" cy="11" r="1.8" fill="url(#vr_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="24" cy="11" r="0.8" fill="${color}" />

            <!-- Angled Vision Slits (Eye Openings) -->
            <polygon points="10,13 15,14 15,12.5 10,12" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
            <polygon points="22,13 17,14 17,12.5 22,12" fill="#05070a" stroke="#05070a" stroke-width="0.5" />
            <!-- Ocular Focus Sparks -->
            <circle cx="12" cy="13" r="0.5" fill="${color}" />
            <circle cx="20" cy="13" r="0.5" fill="${color}" />

            <!-- Pressurized Breathing Vents Backglow -->
            <ellipse cx="16" cy="18" rx="4" ry="2" fill="url(#vr_glow_vent_${id})" opacity="0.8" />

            <!-- Respiration Slit Breathers -->
            <line x1="12" y1="16.5" x2="20" y2="16.5" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
            <line x1="12.5" y1="18.5" x2="19.5" y2="18.5" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
            <line x1="13.5" y1="20.5" x2="18.5" y2="20.5" stroke="#05070a" stroke-width="1.2" stroke-linecap="round" />
          `;
    },
    cuirass(id, color) {
      return `
            <defs>
              <!-- Polished outer plate steel gradients -->
              <linearGradient id="cr_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Cold shadowed steel gradients -->
              <linearGradient id="cr_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Gold/Brass trim and rivets -->
              <linearGradient id="cr_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
              <!-- Core crest energy glow -->
              <radialGradient id="cr_glow_core_${id}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="${color}"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Left Pauldron (Shadowed Shoulder Guard) -->
            <path d="M4 11 C4 6, 11 7, 11 13 L8 16 Z" fill="url(#cr_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M3 11 Q8 9, 10 13" fill="none" stroke="url(#cr_brass_${id})" stroke-width="1.5" />

            <!-- Right Pauldron (Highlighted Shoulder Guard) -->
            <path d="M28 11 C28 6, 21 7, 21 13 L24 16 Z" fill="url(#cr_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M29 11 Q24 9, 22 13" fill="none" stroke="url(#cr_brass_${id})" stroke-width="1.5" />

            <!-- Main Breastplate Body: Left Facet (Shadow) -->
            <path d="M16 6 L9 8 L8 21 L16 26 Z" fill="url(#cr_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Breastplate Body: Right Facet (Highlight) -->
            <path d="M16 6 L23 8 L24 21 L16 26 Z" fill="url(#cr_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Central Ridge Seam (Tapul) -->
            <line x1="16" y1="6" x2="16" y2="26" stroke="#05070a" stroke-width="1.2" opacity="0.4" />

            <!-- Fluted Anatomical Chest Ridges -->
            <path d="M11 11 Q16 13, 21 11" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.3" />
            <path d="M10 15 Q16 17, 22 15" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.3" />
            <path d="M10 19 Q16 21, 22 19" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.3" />

            <!-- Neck Gorget Plate Collar -->
            <path d="M11 6 Q16 9, 21 6 L20 8 Q16 10, 12 8 Z" fill="url(#cr_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Central Core Emblem / Rarity Diamond Crest -->
            <circle cx="16" cy="15" r="4" fill="url(#cr_glow_core_${id})" opacity="0.85" />
            <polygon points="16,11.5 18.8,15 16,18.5 13.2,15" fill="${color}" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
            <circle cx="16" cy="15" r="1" fill="#ffffff" />

            <!-- Bottom Fauld / Waist Plate Trims -->
            <path d="M8 21 Q16 24, 24 21 L23 23.5 Q16 26, 9 23.5 Z" fill="url(#cr_brass_${id})" stroke="#05070a" stroke-width="1" />
            <circle cx="10" cy="22.5" r="0.6" fill="#fff" />
            <circle cx="22" cy="22.5" r="0.6" fill="#fff" />
          `;
    },
    hauberk(id, color) {
      return `
            <defs>
              <!-- Steel chainmail light gradient -->
              <linearGradient id="hb_mail_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Steel chainmail shadow gradient -->
              <linearGradient id="hb_mail_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Leather trim & harness gradient -->
              <linearGradient id="hb_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
              <!-- Gilded brass fixtures -->
              <linearGradient id="hb_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Padded Gambeson Sleeve/Hem Base (Left Side Shadow) -->
            <path d="M5 9 L10 6 L10 24 L7 28 Z" fill="url(#hb_leather_${id})" stroke="#05070a" stroke-width="1.5" />

            <!-- Padded Gambeson Sleeve/Hem Base (Right Side Light) -->
            <path d="M27 9 L22 6 L22 24 L25 28 Z" fill="url(#hb_leather_${id})" stroke="#05070a" stroke-width="1.5" />

            <!-- Main Chainmail Body: Left Facet (Shadow) -->
            <path d="M16 6 L8 8 L7 22 L16 27 Z" fill="url(#hb_mail_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Chainmail Body: Right Facet (Highlight) -->
            <path d="M16 6 L24 8 L25 22 L16 27 Z" fill="url(#hb_mail_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Chainmail Ring Weave Dash Pattern -->
            <path d="M9 11 H23 M8 14 H24 M8 17 H24 M8 20 H24 M9 23 H23" fill="none" stroke="#05070a" stroke-width="1" stroke-dasharray="2 1.5" opacity="0.65" />

            <!-- Reinforced Neck Collar with Gilded Trim -->
            <path d="M10 6 H22 V10 C22 12, 10 12, 10 10 Z" fill="url(#hb_leather_${id})" stroke="#05070a" stroke-width="1.5" />
            <path d="M10 6 H22 V8 H10 Z" fill="url(#hb_brass_${id})" stroke="#05070a" stroke-width="0.8" />

            <!-- Central Decorative Tabard Strap & Rarity Core Gem -->
            <path d="M14 8 H18 V22 H14 Z" fill="url(#hb_leather_${id})" stroke="#05070a" stroke-width="1" />
            <circle cx="16" cy="12" r="2.2" fill="url(#hb_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="11.7" r="0.4" fill="#ffffff" />

            <!-- Cinch Belt & Brass Buckle -->
            <rect x="7" y="20" width="18" height="3" fill="url(#hb_leather_${id})" stroke="#05070a" stroke-width="1" />
            <rect x="14" y="19" width="4" height="5" rx="0.8" fill="url(#hb_brass_${id})" stroke="#05070a" stroke-width="1" />
            <rect x="15" y="20" width="2" height="3" fill="#05070a" />
          `;
    },
    brigandine(id, color) {
      return `
            <defs>
              <!-- Velvet fabric light gradient -->
              <linearGradient id="bg_velvet_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#3b82f6"/>
                <stop offset="60%" stop-color="#1d4ed8"/>
                <stop offset="100%" stop-color="#1e3a8a"/>
              </linearGradient>
              <!-- Velvet fabric shadow gradient -->
              <linearGradient id="bg_velvet_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
              <!-- Gold/Brass rivet & trim gradient -->
              <linearGradient id="bg_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
              <!-- Leather trim gradient -->
              <linearGradient id="bg_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
            </defs>

            <!-- Left Shoulder Guard (Shadow) -->
            <path d="M4 11 C4 6, 11 7, 11 13 L8 16 Z" fill="url(#bg_leather_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M3 11 Q8 9, 10 13" fill="none" stroke="url(#bg_brass_${id})" stroke-width="1.2" />

            <!-- Right Shoulder Guard (Highlight) -->
            <path d="M28 11 C28 6, 21 7, 21 13 L24 16 Z" fill="url(#bg_leather_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M29 11 Q24 9, 22 13" fill="none" stroke="url(#bg_brass_${id})" stroke-width="1.2" />

            <!-- Main Brigandine Body: Left Facet (Shadow) -->
            <path d="M16 6 L9 8 L8 21 L16 26 Z" fill="url(#bg_velvet_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Brigandine Body: Right Facet (Highlight) -->
            <path d="M16 6 L23 8 L24 21 L16 26 Z" fill="url(#bg_velvet_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- High Stiff Neck Collar -->
            <path d="M10 6 Q16 8, 22 6 L21 9 Q16 11, 11 9 Z" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Central Fastening Leather Strap & Buckles -->
            <line x1="16" y1="9" x2="16" y2="25" stroke="url(#bg_leather_${id})" stroke-width="2.5" />
            <line x1="16" y1="9" x2="16" y2="25" stroke="url(#bg_brass_${id})" stroke-width="0.8" />

            <!-- Central Clasp Rarity Gem -->
            <circle cx="16" cy="14" r="2" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="14" r="1.1" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="13.7" r="0.3" fill="#ffffff" />

            <!-- Rivet Stud Grid (Plate fastening rivets with spec glints) -->
            <!-- Row 1 -->
            <circle cx="11.5" cy="11.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="20.5" cy="11.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />
            <!-- Row 2 -->
            <circle cx="11" cy="15.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="21" cy="15.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />
            <!-- Row 3 -->
            <circle cx="11.5" cy="19.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="20.5" cy="19.5" r="1" fill="url(#bg_brass_${id})" stroke="#05070a" stroke-width="0.5" />

            <!-- Specular Highlights on Rivet Studs -->
            <circle cx="11.2" cy="11.2" r="0.3" fill="#fff" />
            <circle cx="20.2" cy="11.2" r="0.3" fill="#fff" />
            <circle cx="10.7" cy="15.2" r="0.3" fill="#fff" />
            <circle cx="20.7" cy="15.2" r="0.3" fill="#fff" />
            <circle cx="11.2" cy="19.2" r="0.3" fill="#fff" />
            <circle cx="20.2" cy="19.2" r="0.3" fill="#fff" />

            <!-- Bottom Waist Hem Band -->
            <path d="M8 21 Q16 24, 24 21 L23 23 Q16 25, 9 23 Z" fill="url(#bg_leather_${id})" stroke="#05070a" stroke-width="1" />
          `;
    },
    plate_mail(id, color) {
      return `
            <defs>
              <!-- Steel plate light gradient -->
              <linearGradient id="pm_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Steel plate shadow gradient -->
              <linearGradient id="pm_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Leather bracing strap gradient -->
              <linearGradient id="pm_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
              <!-- Gold/Brass fittings -->
              <linearGradient id="pm_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Left Pauldron (Shadowed Shoulder Guard) -->
            <path d="M4 11 C4 6, 11 7, 11 13 L8 16 Z" fill="url(#pm_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M3 11 Q8 9, 10 13" fill="none" stroke="url(#pm_brass_${id})" stroke-width="1.2" />

            <!-- Right Pauldron (Highlighted Shoulder Guard) -->
            <path d="M28 11 C28 6, 21 7, 21 13 L24 16 Z" fill="url(#pm_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M29 11 Q24 9, 22 13" fill="none" stroke="url(#pm_brass_${id})" stroke-width="1.2" />

            <!-- Laminated Segmented Horizontal Plate Stack (Shadow Left) -->
            <path d="M16 6 L9 8 L8.2 12 L16 12 Z" fill="url(#pm_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 11.5 L8.2 11.5 L8.5 16 L16 16 Z" fill="url(#pm_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 15.5 L8.5 15.5 L8.8 20 L16 20 Z" fill="url(#pm_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 19.5 L8.8 19.5 L9.5 24 L16 26 Z" fill="url(#pm_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Laminated Segmented Horizontal Plate Stack (Highlight Right) -->
            <path d="M16 6 L23 8 L23.8 12 L16 12 Z" fill="url(#pm_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 11.5 L23.8 11.5 L23.5 16 L16 16 Z" fill="url(#pm_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 15.5 L23.5 15.5 L23.2 20 L16 20 Z" fill="url(#pm_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
            <path d="M16 19.5 L23.2 19.5 L22.5 24 L16 26 Z" fill="url(#pm_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Vertical Bracing Harness Straps -->
            <rect x="11.5" y="7" width="2" height="17" fill="url(#pm_leather_${id})" stroke="#05070a" stroke-width="0.8" />
            <rect x="18.5" y="7" width="2" height="17" fill="url(#pm_leather_${id})" stroke="#05070a" stroke-width="0.8" />

            <!-- Harness Buckles & Rivets -->
            <circle cx="12.5" cy="10" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="19.5" cy="10" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="12.5" cy="15" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="19.5" cy="15" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="12.5" cy="19" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="19.5" cy="19" r="0.8" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.4" />

            <!-- Neck Gorget Collar -->
            <path d="M10 6 Q16 8.5, 22 6 L21 8.5 Q16 11, 11 8.5 Z" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Central Chest Clasp Rarity Gem -->
            <circle cx="16" cy="13.5" r="2.2" fill="url(#pm_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="13.5" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="13.2" r="0.4" fill="#ffffff" />
          `;
    },
    doublet(id, color) {
      return `
            <defs>
              <!-- Noble fabric light gradient (interpolates tier color) -->
              <linearGradient id="db_fabric_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="${color}"/>
                <stop offset="100%" stop-color="#1e1b4b"/>
              </linearGradient>
              <!-- Noble fabric shadow gradient -->
              <linearGradient id="db_fabric_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${color}"/>
                <stop offset="100%" stop-color="#0f0f23"/>
              </linearGradient>
              <!-- Gilded gold embroidery and buttons -->
              <linearGradient id="db_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Left Puffed Epaulet (Shadow) -->
            <path d="M4 11 C4 6, 11 7, 11 13 L8 16 Z" fill="url(#db_fabric_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M4 11 Q8 9, 10 13" fill="none" stroke="url(#db_gold_${id})" stroke-width="1.2" />

            <!-- Right Puffed Epaulet (Highlight) -->
            <path d="M28 11 C28 6, 21 7, 21 13 L24 16 Z" fill="url(#db_fabric_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M28 11 Q24 9, 22 13" fill="none" stroke="url(#db_gold_${id})" stroke-width="1.2" />

            <!-- Main Doublet Body: Left Facet (Shadow) -->
            <path d="M16 6 L9 8 L8 21 L16 26 Z" fill="url(#db_fabric_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Doublet Body: Right Facet (Highlight) -->
            <path d="M16 6 L23 8 L24 21 L16 26 Z" fill="url(#db_fabric_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- White Silk V-Neck Undershirt & Lapels -->
            <polygon points="12,6 16,13 20,6" fill="#f8fafc" stroke="#05070a" stroke-width="1" />
            <path d="M12 6 L16 13 L20 6" fill="none" stroke="url(#db_gold_${id})" stroke-width="1.2" />

            <!-- Center Seam Line -->
            <line x1="16" y1="13" x2="16" y2="26" stroke="#05070a" stroke-width="1" opacity="0.5" />

            <!-- Vertical Row of Gilded Buttons -->
            <circle cx="16" cy="15.5" r="1.2" fill="url(#db_gold_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="15.2" r="0.3" fill="#ffffff" />

            <circle cx="16" cy="18.5" r="1.2" fill="url(#db_gold_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="18.2" r="0.3" fill="#ffffff" />

            <circle cx="16" cy="21.5" r="1.2" fill="url(#db_gold_${id})" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="21.2" r="0.3" fill="#ffffff" />

            <!-- Gold Brooch Pin with Rarity Gem Anchor -->
            <circle cx="16" cy="12" r="2.2" fill="url(#db_gold_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="11.7" r="0.4" fill="#ffffff" />

            <!-- Bottom Hem Gold Trim -->
            <path d="M8 21 Q16 24, 24 21 L23 23 Q16 25, 9 23 Z" fill="url(#db_gold_${id})" stroke="#05070a" stroke-width="1" />
          `;
    },
    inquisitor_robes(id, color) {
      return `
            <defs>
              <!-- Robe cloth light gradient -->
              <linearGradient id="ir_cloth_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="60%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
              <!-- Robe cloth shadow gradient -->
              <linearGradient id="ir_cloth_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#020617"/>
              </linearGradient>
              <!-- Ceremonial stole / cowl accent gradient -->
              <linearGradient id="ir_accent_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#7e22ce"/>
                <stop offset="100%" stop-color="#3b0764"/>
              </linearGradient>
              <!-- Gold embroidery and seal fixtures -->
              <linearGradient id="ir_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Draped Skirt Base (Shadow Left Side) -->
            <path d="M16 14 L8 16 L6 27 L16 30 Z" fill="url(#ir_cloth_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Draped Skirt Base (Highlight Right Side) -->
            <path d="M16 14 L24 16 L26 27 L16 30 Z" fill="url(#ir_cloth_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Cloth Fold Creases -->
            <path d="M10 18 L8 27 M14 16 L12 28 M18 16 L20 28 M22 18 L24 27" stroke="#05070a" stroke-width="1" opacity="0.4" />

            <!-- Ceremonial Draped Stole / Shoulder Mantle -->
            <path d="M7 13 Q16 17, 25 13 L23 18 Q16 22, 9 18 Z" fill="url(#ir_accent_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M7 13 Q16 17, 25 13" fill="none" stroke="url(#ir_gold_${id})" stroke-width="1.2" />
            <path d="M9 18 Q16 22, 23 18" fill="none" stroke="url(#ir_gold_${id})" stroke-width="1.2" />

            <!-- Pointed Inquisitor Hood (Outer Shell) -->
            <path d="M16 3 C10 3, 9 7, 9 13 L23 13 C23 7, 22 3, 16 3 Z" fill="url(#ir_cloth_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Deep Pitch-Black Inner Hood Void -->
            <path d="M11 13 C11 8, 21 8, 21 13 Z" fill="#05070a" stroke="#05070a" stroke-width="1" />

            <!-- Piercing Eye Glints (Matching Tier Color) -->
            <circle cx="14" cy="11" r="0.6" fill="${color}" />
            <circle cx="18" cy="11" r="0.6" fill="${color}" />
            <circle cx="13.8" cy="10.8" r="0.2" fill="#ffffff" />
            <circle cx="17.8" cy="10.8" r="0.2" fill="#ffffff" />

            <!-- Inquisitorial Pectoral Cross / Seal Medallion -->
            <path d="M15 16 H17 V18 H19 V20 H17 V26 H15 V20 H13 V18 H15 Z" fill="url(#ir_gold_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
            <circle cx="16" cy="19" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="18.7" r="0.3" fill="#ffffff" />
          `;
    },
    full_plate_armor(id, color) {
      return `
            <defs>
              <!-- Polished full plate steel light gradient -->
              <linearGradient id="fp_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Shadowed full plate steel gradient -->
              <linearGradient id="fp_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Gilded gold/brass fittings -->
              <linearGradient id="fp_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
              <!-- Leather belt gradient -->
              <linearGradient id="fp_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
            </defs>

            <!-- Left Heavy Pauldron Stack (Shadow) -->
            <path d="M3 10 C3 5, 11 6, 11 12 L7 16 Z" fill="url(#fp_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M2 11 Q7 9, 10 13" fill="none" stroke="url(#fp_brass_${id})" stroke-width="1.5" />

            <!-- Right Heavy Pauldron Stack (Highlight) -->
            <path d="M29 10 C29 5, 21 6, 21 12 L25 16 Z" fill="url(#fp_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M30 11 Q25 9, 22 13" fill="none" stroke="url(#fp_brass_${id})" stroke-width="1.5" />

            <!-- Main Torso Armor: Left Facet (Shadow) -->
            <path d="M16 5 L8 7 L7 20 L16 24 Z" fill="url(#fp_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Torso Armor: Right Facet (Highlight) -->
            <path d="M16 5 L24 7 L25 20 L16 24 Z" fill="url(#fp_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Articulated Lower Fauld Lames (Skirts) -->
            <path d="M8.5 20 L16 24 L23.5 20 L25 28 L16 30 L7 28 Z" fill="url(#fp_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M16 24 L23.5 20 L25 28 L16 30 Z" fill="url(#fp_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />

            <!-- Fluted Gothic Chest Ridges -->
            <path d="M11 9 L16 14 L21 9 M11 13 L16 18 L21 13" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.35" />

            <!-- Neck Gorget Plate Collar -->
            <path d="M10 5 Q16 7.5, 22 5 L21 7.5 Q16 10, 11 7.5 Z" fill="url(#fp_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Heavy Belt & Buckle Assembly -->
            <rect x="8" y="18" width="16" height="3" fill="url(#fp_leather_${id})" stroke="#05070a" stroke-width="1" />
            <rect x="14" y="17" width="4" height="5" rx="0.8" fill="url(#fp_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Central Rarity Core Gem Clasp -->
            <circle cx="16" cy="12" r="2.2" fill="url(#fp_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="11.7" r="0.4" fill="#ffffff" />
          `;
    },
    exosuit(id, color) {
      return `
            <defs>
              <!-- Cyber alloy plate light gradient -->
              <linearGradient id="exo_metal_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#cbd5e1"/>
                <stop offset="50%" stop-color="#64748b"/>
                <stop offset="100%" stop-color="#334155"/>
              </linearGradient>
              <!-- Cyber alloy plate shadow gradient -->
              <linearGradient id="exo_metal_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#334155"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
              <!-- Reactor core radial energy glow -->
              <radialGradient id="exo_glow_core_${id}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="${color}"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Left Servo Pauldron (Shadowed Hydraulics) -->
            <path d="M3 10 C3 5, 11 6, 11 12 L7 16 Z" fill="url(#exo_metal_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <rect x="4" y="10" width="4" height="2" fill="#05070a" />

            <!-- Right Servo Pauldron (Highlighted Hydraulics) -->
            <path d="M29 10 C29 5, 21 6, 21 12 L25 16 Z" fill="url(#exo_metal_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <rect x="24" y="10" width="4" height="2" fill="#05070a" />

            <!-- Main Cyber Torso Frame: Left Facet (Shadow) -->
            <path d="M16 5 L8 7 L7 20 L16 26 Z" fill="url(#exo_metal_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Cyber Torso Frame: Right Facet (Highlight) -->
            <path d="M16 5 L24 7 L25 20 L16 26 Z" fill="url(#exo_metal_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Energy Conduit Channels (Tracing Chest Lines) -->
            <path d="M10 9 L16 14 L22 9 M10 21 L16 16 L22 21" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" />

            <!-- Radial Energy Core Reactor Backglow -->
            <circle cx="16" cy="15" r="6" fill="url(#exo_glow_core_${id})" opacity="0.85" />

            <!-- Heavy Titanium Arc Core Ring -->
            <circle cx="16" cy="15" r="4.2" fill="#0f172a" stroke="#05070a" stroke-width="1.2" />
            <circle cx="16" cy="15" r="3" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
            <circle cx="16" cy="15" r="1.2" fill="#ffffff" />

            <!-- Reinforced Abdominal Armor Plating -->
            <rect x="11" y="21" width="10" height="3" rx="1" fill="#0f172a" stroke="#05070a" stroke-width="1" />
            <line x1="13" y1="22.5" x2="19" y2="22.5" stroke="${color}" stroke-width="1" stroke-linecap="round" />
          `;
    },
    trenchcoat(id, color) {
      return `
            <defs>
              <!-- Trenchcoat leather light gradient -->
              <linearGradient id="tc_leather_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="60%" stop-color="#334155"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Trenchcoat leather shadow gradient -->
              <linearGradient id="tc_leather_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
              <!-- Lapel inner lining gradient (tier color accent) -->
              <linearGradient id="tc_lining_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="${color}"/>
                <stop offset="100%" stop-color="#0f172a"/>
              </linearGradient>
              <!-- Gold/Brass fittings -->
              <linearGradient id="tc_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Shoulder Storm Flaps (Capelet Overlay) -->
            <path d="M4 11 C4 6, 11 7, 11 13 L8 16 Z" fill="url(#tc_leather_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M28 11 C28 6, 21 7, 21 13 L24 16 Z" fill="url(#tc_leather_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Main Coat Body: Left Facet (Shadow) -->
            <path d="M16 6 L9 8 L7 27 L16 30 Z" fill="url(#tc_leather_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Main Coat Body: Right Facet (Highlight) -->
            <path d="M16 6 L23 8 L25 27 L16 30 Z" fill="url(#tc_leather_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

            <!-- Popped Collar & Wide Inner Lapels -->
            <polygon points="8,5 12,12 16,8 12,4" fill="url(#tc_lining_${id})" stroke="#05070a" stroke-width="1" />
            <polygon points="24,5 20,12 16,8 20,4" fill="url(#tc_lining_${id})" stroke="#05070a" stroke-width="1" />

            <path d="M8 5 L12 12 L16 8 M24 5 L20 12 L16 8" fill="none" stroke="url(#tc_brass_${id})" stroke-width="1.2" />

            <!-- Front Center Open Seam -->
            <line x1="16" y1="12" x2="16" y2="30" stroke="#05070a" stroke-width="1.2" />

            <!-- Double-Looped Waist Cinch Belt & Brass Buckle -->
            <rect x="8" y="18" width="16" height="3.5" fill="#05070a" stroke="#05070a" stroke-width="1" />
            <rect x="14" y="17" width="4" height="5.5" rx="1" fill="url(#tc_brass_${id})" stroke="#05070a" stroke-width="1" />
            <rect x="15" y="18.5" width="2" height="2.5" fill="#05070a" />

            <!-- Lapel Brooch Pin with Rarity Gem Anchor -->
            <circle cx="16" cy="8" r="2.2" fill="url(#tc_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="16" cy="8" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="15.7" cy="7.7" r="0.4" fill="#ffffff" />

            <!-- Storm Flap Shoulder Rivets -->
            <circle cx="9" cy="12" r="0.8" fill="url(#tc_brass_${id})" stroke="#05070a" stroke-width="0.4" />
            <circle cx="23" cy="12" r="0.8" fill="url(#tc_brass_${id})" stroke="#05070a" stroke-width="0.4" />
          `;
    },

    // --- GENERIC SLOT Blueprints ---
    weapon(id, color) {
      return `
          ${window.AssetCatalog.gradients.weapon(id, color)}
          <path d="M16 3 L19 8 L18 21 L14 21 L13 8 Z" fill="url(#grad_weap_${id})" stroke="#000" stroke-width="1.8" />
          <rect x="11" y="21" width="10" height="2.5" rx="0.5" fill="#f1c40f" stroke="#000" stroke-width="1.2" />
          <rect x="14.5" y="23.5" width="3" height="5" fill="#5c3a21" stroke="#000" stroke-width="1" />
          <circle cx="16" cy="29.5" r="1.5" fill="#f1c40f" stroke="#000" stroke-width="1" />
        `;
    },
    shield(id, color) {
      return `
        ${window.AssetCatalog.gradients.shield(id, color)}
        <path d="M6 6 Q16 4, 26 6 Q25 18, 16 28 Q7 18, 6 6 Z" fill="url(#grad_sh_${id})" stroke="#000" stroke-width="1.8" />
        <path d="M11 11 Q16 9, 21 11 L19 19 Q16 23, 16 23 Q16 23, 13 19 Z" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.55" />
      `;
    },
    dagger(id, color) {
      return `
        <path d="M16 4 L18 9 L17 19 L15 19 L14 9 Z" fill="#bdc3c7" stroke="#000" stroke-width="1.8" />
        <rect x="12" y="19" width="8" height="2" fill="${color}" stroke="#000" stroke-width="1.2" />
        <rect x="14.5" y="21" width="3" height="4" fill="#3b2f2f" stroke="#000" stroke-width="1" />
      `;
    },
    tome(id, color) {
      return `
            <!-- Heavy Leather Bound Cover -->
            <rect x="6" y="4" width="20" height="24" rx="2" fill="#2d1a0d" stroke="#000" stroke-width="1.8" />
            <!-- Book Spine Binding -->
            <rect x="6" y="4" width="4" height="24" fill="#1c0f07" stroke="#000" stroke-width="1" />
            <!-- Gold Corner Brackets -->
            <polygon points="10,4 12,4 10,6" fill="#f1c40f" />
            <polygon points="26,4 24,4 26,6" fill="#f1c40f" />
            <polygon points="10,28 12,28 10,26" fill="#f1c40f" />
            <polygon points="26,28 24,28 26,26" fill="#f1c40f" />
            <!-- Inner Page Edge line details -->
            <line x1="25" y1="5" x2="25" y2="27" stroke="#eaeaea" stroke-width="1.2" />
            <!-- Central Mystical Sphere scaling with Tier Color -->
            <circle cx="17" cy="16" r="4.5" fill="${color}" stroke="#000" stroke-width="1.2" />
            <circle cx="15.5" cy="14.5" r="1" fill="#fff" opacity="0.6" />
          `;
    },
    helmet(id, color) {
      return `
        ${window.AssetCatalog.gradients.equip(id, color)}
        <path d="M8 12 C8 6, 24 6, 24 12 L25 24 L16 30 L7 24 Z" fill="url(#grad_eq_${id})" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M15 6 L17 6 L17 30 L15 30 Z" fill="${color}" stroke="#000" stroke-width="1" />
        <path d="M8 14 L24 14 L24 17 L8 17 Z" fill="${color}" stroke="#000" stroke-width="1" />
        <path d="M10 15 H14 V21 H10 Z M18 15 H22 V21 H18 Z" fill="#000" />
        <circle cx="11" cy="24" r="1" fill="#000" /><circle cx="13" cy="24" r="1" fill="#000" />
        <circle cx="11" cy="26" r="1" fill="#000" /><circle cx="13" cy="26" r="1" fill="#000" />
        <circle cx="19" cy="24" r="1" fill="#000" /><circle cx="21" cy="24" r="1" fill="#000" />
        <circle cx="19" cy="26" r="1" fill="#000" /><circle cx="21" cy="26" r="1" fill="#000" />
      `;
    },
    chest(id, color) {
      return `
            <!-- Left & Right Shoulder Pauldrons -->
            <path d="M4 11 C4 6, 11 8, 11 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <path d="M28 11 C28 6, 21 8, 21 13 Z" fill="${color}" stroke="#000" stroke-width="1.2" />
            <!-- Main Chestplate Body with high-contrast steel shading -->
            <path d="M8 8 L24 8 L22 22 L16 26 L10 22 Z" fill="#7f8c8d" stroke="#000" stroke-width="1.8" />
            <!-- Dynamic Trim Accents matching quality tiers -->
            <path d="M11 14 H21" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
            <path d="M11 18 H21" stroke="${color}" stroke-width="2.2" stroke-linecap="round" />
          `;
    },
    leggings(id, color) {
      return `
            <defs>
              <!-- Steel leg plate light gradient -->
              <linearGradient id="lg_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Steel leg plate shadow gradient -->
              <linearGradient id="lg_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Leather strap gradient -->
              <linearGradient id="lg_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
              <!-- Gold/Brass fittings -->
              <linearGradient id="lg_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Leather Waist Belt & Hanging Suspension Tassets -->
            <rect x="7" y="5" width="18" height="3" fill="url(#lg_leather_${id})" stroke="#05070a" stroke-width="1" />
            <rect x="14" y="4" width="4" height="5" rx="0.8" fill="url(#lg_brass_${id})" stroke="#05070a" stroke-width="1" />

            <!-- Back Leather Straps (Thighs & Calves) -->
            <line x1="5" y1="12" x2="13" y2="12" stroke="url(#lg_leather_${id})" stroke-width="1.8" />
            <line x1="5" y1="24" x2="13" y2="24" stroke="url(#lg_leather_${id})" stroke-width="1.8" />
            <line x1="19" y1="12" x2="27" y2="12" stroke="url(#lg_leather_${id})" stroke-width="1.8" />
            <line x1="19" y1="24" x2="27" y2="24" stroke="url(#lg_leather_${id})" stroke-width="1.8" />

            <!-- Left Thigh & Shin Plates (Shadow Side) -->
            <path d="M7 9 H13 L12 17 H6 Z" fill="url(#lg_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M6 21 H12 L11 29 H7 Z" fill="url(#lg_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Right Thigh & Shin Plates (Highlight Side) -->
            <path d="M19 9 H25 L26 17 H20 Z" fill="url(#lg_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
            <path d="M20 21 H26 L25 29 H19 Z" fill="url(#lg_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

            <!-- Left Knee Guard Poleyn Dome -->
            <circle cx="9.5" cy="19" r="2.8" fill="url(#lg_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="9.5" cy="19" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="9.1" cy="18.6" r="0.4" fill="#ffffff" />

            <!-- Right Knee Guard Poleyn Dome -->
            <circle cx="22.5" cy="19" r="2.8" fill="url(#lg_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <circle cx="22.5" cy="19" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="22.1" cy="18.6" r="0.4" fill="#ffffff" />
          `;
    },
    greaves(id, color) {
      return `
            <defs>
              <!-- Steel greave light gradient -->
              <linearGradient id="gr_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Steel greave shadow gradient -->
              <linearGradient id="gr_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Leather strap gradient -->
              <linearGradient id="gr_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5c3a21"/>
                <stop offset="100%" stop-color="#2d1d0b"/>
              </linearGradient>
              <!-- Gold/Brass fittings -->
              <linearGradient id="gr_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Behind Calf Fastening Leather Straps -->
            <line x1="4" y1="14" x2="14" y2="14" stroke="url(#gr_leather_${id})" stroke-width="2" stroke-linecap="round" />
            <line x1="4" y1="22" x2="14" y2="22" stroke="url(#gr_leather_${id})" stroke-width="2" stroke-linecap="round" />
            <line x1="18" y1="14" x2="28" y2="14" stroke="url(#gr_leather_${id})" stroke-width="2" stroke-linecap="round" />
            <line x1="18" y1="22" x2="28" y2="22" stroke="url(#gr_leather_${id})" stroke-width="2" stroke-linecap="round" />

            <!-- Left Shin Greave Plate (Shadow Side) -->
            <path d="M5 11 L13 11 L12 28 H6 Z" fill="url(#gr_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
            <line x1="9" y1="11" x2="9" y2="28" stroke="#05070a" stroke-width="0.8" opacity="0.4" />

            <!-- Left Knee Guard Poleyn Fan Wing -->
            <path d="M4 8 Q9 5, 14 8 L13 12 H5 Z" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
            <circle cx="9" cy="9.5" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="8.7" cy="9.2" r="0.4" fill="#ffffff" />

            <!-- Right Shin Greave Plate (Highlight Side) -->
            <path d="M19 11 L27 11 L26 28 H20 Z" fill="url(#gr_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
            <line x1="23" y1="11" x2="23" y2="28" stroke="#05070a" stroke-width="0.8" opacity="0.4" />

            <!-- Right Knee Guard Poleyn Fan Wing -->
            <path d="M18 8 Q23 5, 28 8 L27 12 H19 Z" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
            <circle cx="23" cy="9.5" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
            <circle cx="22.7" cy="9.2" r="0.4" fill="#ffffff" />

            <!-- Gilded Ankle Flange Cuffs -->
            <path d="M6 26 H12 V28 H6 Z" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="0.8" />
            <path d="M20 26 H26 V28 H20 Z" fill="url(#gr_brass_${id})" stroke="#05070a" stroke-width="0.8" />
          `;
    },
    legplates(id, color) {
      return `
                <defs>
                  <!-- Steel leg plate light gradient -->
                  <linearGradient id="lp_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel leg plate shadow gradient -->
                  <linearGradient id="lp_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Leather strap gradient -->
                  <linearGradient id="lp_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#2d1d0b"/>
                  </linearGradient>
                  <!-- Gold/Brass fittings -->
                  <linearGradient id="lp_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                </defs>

                <!-- Leather Waist Belt & Harness -->
                <rect x="7" y="4" width="18" height="3" fill="url(#lp_leather_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="14" y="3" width="4" height="5" rx="0.8" fill="url(#lp_brass_${id})" stroke="#05070a" stroke-width="1" />

                <!-- Behind Calf & Thigh Harness Straps -->
                <line x1="5" y1="10" x2="13" y2="10" stroke="url(#lp_leather_${id})" stroke-width="1.8" />
                <line x1="5" y1="24" x2="13" y2="24" stroke="url(#lp_leather_${id})" stroke-width="1.8" />
                <line x1="19" y1="10" x2="27" y2="10" stroke="url(#lp_leather_${id})" stroke-width="1.8" />
                <line x1="19" y1="24" x2="27" y2="24" stroke="url(#lp_leather_${id})" stroke-width="1.8" />

                <!-- Left Segmented Plate Lames (Shadow Side) -->
                <path d="M6 8 L13 8 L12.5 12 L6.5 12 Z" fill="url(#lp_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M6.3 11.5 L12.7 11.5 L12.2 15.5 L6.8 15.5 Z" fill="url(#lp_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M6.5 20.5 L12.5 20.5 L12 24.5 L7 24.5 Z" fill="url(#lp_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M6.8 24 L12.2 24 L11.5 28.5 L7.5 28.5 Z" fill="url(#lp_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />

                <!-- Right Segmented Plate Lames (Highlight Side) -->
                <path d="M19 8 L26 8 L25.5 12 L19.5 12 Z" fill="url(#lp_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M19.3 11.5 L25.7 11.5 L25.2 15.5 L19.8 15.5 Z" fill="url(#lp_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M19.5 20.5 L25.5 20.5 L25 24.5 L20 24.5 Z" fill="url(#lp_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M19.8 24 L25.2 24 L24.5 28.5 L20.5 28.5 Z" fill="url(#lp_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />

                <!-- Left Knee Guard Poleyn Dome & Rarity Gem Core -->
                <circle cx="9.5" cy="18" r="2.8" fill="url(#lp_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="9.5" cy="18" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="9.1" cy="17.6" r="0.4" fill="#ffffff" />

                <!-- Right Knee Guard Poleyn Dome & Rarity Gem Core -->
                <circle cx="22.5" cy="18" r="2.8" fill="url(#lp_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="22.5" cy="18" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="22.1" cy="17.6" r="0.4" fill="#ffffff" />
              `;
    },
    chausses(id, color) {
      return `
                <defs>
                  <!-- Steel chainmail light gradient -->
                  <linearGradient id="ch_mail_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel chainmail shadow gradient -->
                  <linearGradient id="ch_mail_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Padded leather garter strap gradient -->
                  <linearGradient id="ch_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#2d1d0b"/>
                  </linearGradient>
                  <!-- Brass fittings & buckles -->
                  <linearGradient id="ch_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                </defs>

                <!-- Leather Waist Belt & Garter Suspension Straps -->
                <rect x="7" y="4" width="18" height="3" fill="url(#ch_leather_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="14" y="3" width="4" height="5" rx="0.8" fill="url(#ch_brass_${id})" stroke="#05070a" stroke-width="1" />

                <!-- Diagonal Garter Suspension Straps to Thighs -->
                <line x1="10" y1="7" x2="8.5" y2="11" stroke="url(#ch_leather_${id})" stroke-width="1.8" />
                <line x1="22" y1="7" x2="23.5" y2="11" stroke="url(#ch_leather_${id})" stroke-width="1.8" />

                <!-- Behind Calf & Thigh Fastening Straps -->
                <line x1="5" y1="14" x2="13" y2="14" stroke="url(#ch_leather_${id})" stroke-width="1.5" />
                <line x1="5" y1="24" x2="13" y2="24" stroke="url(#ch_leather_${id})" stroke-width="1.5" />
                <line x1="19" y1="14" x2="27" y2="14" stroke="url(#ch_leather_${id})" stroke-width="1.5" />
                <line x1="19" y1="24" x2="27" y2="24" stroke="url(#ch_leather_${id})" stroke-width="1.5" />

                <!-- Left Mail Leg (Shadow Side) -->
                <path d="M6 10 H13 L12 28 H6.5 Z" fill="url(#ch_mail_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Right Mail Leg (Highlight Side) -->
                <path d="M19 10 H26 L25.5 28 H19.5 Z" fill="url(#ch_mail_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Ring Weave Dash Texture Overlay -->
                <path d="M6.5 12.5 Q9.5 11.5, 12.5 12.5 M6.5 16 Q9.5 15, 12.5 16 M6.5 19.5 Q9.5 18.5, 12.5 19.5 M6.5 23 Q9.5 22, 12.5 23 M6.5 26.5 Q9.5 25.5, 12.5 26.5" fill="none" stroke="#05070a" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.65" />
                <path d="M19.5 12.5 Q22.5 11.5, 25.5 12.5 M19.5 16 Q22.5 15, 25.5 16 M19.5 19.5 Q22.5 18.5, 25.5 19.5 M19.5 23 Q22.5 22, 25.5 23 M19.5 26.5 Q22.5 25.5, 25.5 26.5" fill="none" stroke="#05070a" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.65" />

                <!-- Left Knee Poleyn Cup & Rarity Gem -->
                <circle cx="9.5" cy="18" r="2.8" fill="url(#ch_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="9.5" cy="18" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="9.1" cy="17.6" r="0.4" fill="#ffffff" />

                <!-- Right Knee Poleyn Cup & Rarity Gem -->
                <circle cx="22.5" cy="18" r="2.8" fill="url(#ch_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="22.5" cy="18" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="22.1" cy="17.6" r="0.4" fill="#ffffff" />

                <!-- Leather Cinch Garters around knees -->
                <path d="M6.5 18 H12.5" stroke="url(#ch_leather_${id})" stroke-width="1.2" opacity="0.4" />
                <path d="M19.5 18 H25.5" stroke="url(#ch_leather_${id})" stroke-width="1.2" opacity="0.4" />
              `;
    },
    cuisses(id, color) {
      return `
                <defs>
                  <!-- Quilted leather light gradient -->
                  <linearGradient id="cs_quilt_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#8d5b38"/>
                    <stop offset="60%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#3d2312"/>
                  </linearGradient>
                  <!-- Quilted leather shadow gradient -->
                  <linearGradient id="cs_quilt_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#3d2312"/>
                    <stop offset="100%" stop-color="#241309"/>
                  </linearGradient>
                  <!-- Steel knee plate gradient -->
                  <linearGradient id="cs_steel_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#475569"/>
                  </linearGradient>
                  <!-- Brass trim fittings -->
                  <linearGradient id="cs_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                </defs>

                <!-- Leather Waist Belt & Harness -->
                <rect x="7" y="4" width="18" height="3" fill="url(#cs_quilt_d_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="14" y="3" width="4" height="5" rx="0.8" fill="url(#cs_brass_${id})" stroke="#05070a" stroke-width="1" />

                <!-- Rear Thigh Fastening Leather Cords -->
                <line x1="5" y1="12" x2="13" y2="12" stroke="#241309" stroke-width="1.8" />
                <line x1="5" y1="23" x2="13" y2="23" stroke="#241309" stroke-width="1.8" />
                <line x1="19" y1="12" x2="27" y2="12" stroke="#241309" stroke-width="1.8" />
                <line x1="19" y1="23" x2="27" y2="23" stroke="#241309" stroke-width="1.8" />

                <!-- Left Padded Thigh Cuisse (Shadow Side) -->
                <path d="M6 8 H13 L12 27 H6.5 Z" fill="url(#cs_quilt_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Right Padded Thigh Cuisse (Highlight Side) -->
                <path d="M19 8 H26 L25.5 27 H19.5 Z" fill="url(#cs_quilt_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Quilted Diamond Stitch Pattern Overlay -->
                <path d="M6.5 10 L12.5 15 M6.5 14 L12.2 19 M6.5 18 L12 23 M6.5 22 L11.8 27 M12.5 10 L6.5 15 M12.2 14 L6.5 19 M12 18 L6.5 23 M11.8 22 L6.5 27" fill="none" stroke="#241309" stroke-width="0.8" opacity="0.8" />
                <path d="M19.5 10 L25.5 15 M19.5 14 L25.2 19 M19.5 18 L25 23 M19.5 22 L24.8 27 M25.5 10 L19.5 15 M25.2 14 L19.5 19 M25 18 L19.5 23 M24.8 22 L19.5 27" fill="none" stroke="#241309" stroke-width="0.8" opacity="0.8" />

                <!-- Brass Stitching Rivets along edges -->
                <circle cx="7" cy="9" r="0.5" fill="url(#cs_brass_${id})" />
                <circle cx="12" cy="9" r="0.5" fill="url(#cs_brass_${id})" />
                <circle cx="20" cy="9" r="0.5" fill="url(#cs_brass_${id})" />
                <circle cx="25" cy="9" r="0.5" fill="url(#cs_brass_${id})" />

                <!-- Left Steel Knee Poleyn Fan Wing & Cup -->
                <path d="M4 18 Q9 15, 14 18 L13 22 H5 Z" fill="url(#cs_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="9.5" cy="20" r="3" fill="url(#cs_steel_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="9.5" cy="20" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="9.1" cy="19.6" r="0.4" fill="#ffffff" />

                <!-- Right Steel Knee Poleyn Fan Wing & Cup -->
                <path d="M18 18 Q23 15, 28 18 L27 22 H19 Z" fill="url(#cs_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="22.5" cy="20" r="3" fill="url(#cs_steel_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="22.5" cy="20" r="1.5" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <circle cx="22.1" cy="19.6" r="0.4" fill="#ffffff" />
              `;
    },
    overall(id, color) {
      return `
                <defs>
                  <!-- Steel plate light gradient -->
                  <linearGradient id="ov_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel plate shadow gradient -->
                  <linearGradient id="ov_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Undersuit fabric light gradient -->
                  <linearGradient id="ov_cloth_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Undersuit fabric shadow gradient -->
                  <linearGradient id="ov_cloth_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                  <!-- Brass fittings & rivets -->
                  <linearGradient id="ov_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Sternum core backglow -->
                  <radialGradient id="ov_glow_core_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="40%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                  </radialGradient>
                </defs>

                <!-- Shoulder Pauldrons (Left Shadow / Right Light) -->
                <path d="M3 10 C3 5, 10 6, 10 12 L7 15 Z" fill="url(#ov_steel_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M29 10 C29 5, 22 6, 22 12 L25 15 Z" fill="url(#ov_steel_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Main Torso Undersuit (Shadow Left / Light Right) -->
                <path d="M16 5 L8 7 L7 18 L16 20 Z" fill="url(#ov_cloth_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M16 5 L24 7 L25 18 L16 20 Z" fill="url(#ov_cloth_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />

                <!-- Padded Leg Suits (Shadow Left / Light Right) -->
                <path d="M7 18 L16 20 L16 29 L6 28 Z" fill="url(#ov_cloth_d_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M25 18 L16 20 L16 29 L26 28 Z" fill="url(#ov_cloth_l_${id})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round" />

                <!-- Thigh & Shin Reinforcement Plates -->
                <path d="M7.5 19 H13 L12 27 H7 Z" fill="url(#ov_steel_d_${id})" stroke="#05070a" stroke-width="1.2" />
                <path d="M19 19 H24.5 L25 27 H19 Z" fill="url(#ov_steel_l_${id})" stroke="#05070a" stroke-width="1.2" />

                <!-- Waist Belt & Buckle Assembly -->
                <rect x="8" y="16.5" width="16" height="2.5" fill="url(#ov_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <rect x="14" y="15.5" width="4" height="4.5" rx="0.8" fill="url(#ov_brass_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="15" y="16.5" width="2" height="2.5" fill="#05070a" />

                <!-- Neck Gorget Plate Collar -->
                <path d="M10 5 Q16 7.5, 22 5 L21 7.5 Q16 9.5, 11 7.5 Z" fill="url(#ov_brass_${id})" stroke="#05070a" stroke-width="0.8" />

                <!-- Sternum Core Energy Diamond & Glow -->
                <circle cx="16" cy="11.5" r="3.5" fill="url(#ov_glow_core_${id})" opacity="0.85" />
                <polygon points="16,8.5 18.2,11.5 16,14.5 13.8,11.5" fill="${color}" stroke="#05070a" stroke-width="0.8" stroke-linejoin="round" />
                <circle cx="16" cy="11.5" r="0.8" fill="#ffffff" />

                <!-- Knee Poleyn Caps -->
                <circle cx="9.5" cy="22" r="2.2" fill="url(#ov_brass_${id})" stroke="#05070a" stroke-width="0.6" />
                <circle cx="9.5" cy="22" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.4" />
                <circle cx="22.5" cy="22" r="2.2" fill="url(#ov_brass_${id})" stroke="#05070a" stroke-width="0.6" />
                <circle cx="22.5" cy="22" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.4" />
              `;
    },
    boots(id, color) {
      return `
                <defs>
                  <!-- Leather boot light gradient -->
                  <linearGradient id="bt_leather_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#8d5b38"/>
                    <stop offset="50%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#3d2312"/>
                  </linearGradient>
                  <!-- Leather boot shadow gradient -->
                  <linearGradient id="bt_leather_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#3d2312"/>
                    <stop offset="100%" stop-color="#241309"/>
                  </linearGradient>
                  <!-- Outsole gradient -->
                  <linearGradient id="bt_sole_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#334155"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                  <!-- Brass buckle fittings -->
                  <linearGradient id="bt_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                </defs>

                <!-- Left Leather Boot (Shadow Side) -->
                <!-- Main Upper & Foot Body -->
                <path d="M4 14 L11 12 L12 21 L15 25 L13 28 L3 27 Z" fill="url(#bt_leather_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Heavy Outsole -->
                <path d="M3 27 L13 28 L14 29 L3 28.5 Z" fill="url(#bt_sole_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Flared Turned Cuff -->
                <path d="M3 10 H12 L11 14 H4 Z" fill="url(#bt_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="7.5" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <!-- Ankle Cinch Strap & Buckle -->
                <path d="M4.5 21 L12.5 22" stroke="url(#bt_leather_d_${id})" stroke-width="2" />
                <rect x="7" y="20.5" width="2.5" height="3" rx="0.5" fill="url(#bt_brass_${id})" stroke="#05070a" stroke-width="0.6" />

                <!-- Right Leather Boot (Highlight Side) -->
                <!-- Main Upper & Foot Body -->
                <path d="M17 14 L24 12 L25 21 L28 25 L26 28 L16 27 Z" fill="url(#bt_leather_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Heavy Outsole -->
                <path d="M16 27 L26 28 L27 29 L16 28.5 Z" fill="url(#bt_sole_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Flared Turned Cuff -->
                <path d="M16 10 H25 L24 14 H17 Z" fill="url(#bt_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="20.5" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <!-- Ankle Cinch Strap & Buckle -->
                <path d="M17.5 21 L25.5 22" stroke="url(#bt_leather_l_${id})" stroke-width="2" />
                <rect x="20" y="20.5" width="2.5" height="3" rx="0.5" fill="url(#bt_brass_${id})" stroke="#05070a" stroke-width="0.6" />

                <!-- Specular Sheen Highlights -->
                <path d="M18 15 L23 13.5 L23.5 19 L18.5 20 Z" fill="#ffffff" opacity="0.15" />
              `;
    },
    sabatons(id, color) {
      return `
                <defs>
                  <!-- Steel plate light gradient -->
                  <linearGradient id="sb_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel plate shadow gradient -->
                  <linearGradient id="sb_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Brass trim fittings -->
                  <linearGradient id="sb_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Ankle strap leather -->
                  <linearGradient id="sb_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#2d1d0b"/>
                  </linearGradient>
                </defs>

                <!-- Left Gothic Sabaton (Shadow Side) -->
                <!-- Ankle Collar -->
                <path d="M3 12 H11 L10 16 H4 Z" fill="url(#sb_brass_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Main Foot Lames Stack -->
                <path d="M3.5 15 L10.5 13 L12 21 L15.5 25 L12.5 28 L3 27 Z" fill="url(#sb_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Overlapping Instep Lame Seams -->
                <path d="M4 18 H11 M4.2 21 H12 M4.5 24 H13.5" stroke="#05070a" stroke-width="1" opacity="0.6" />
                <!-- Pointed Gothic Toe Cap & Rarity Gem -->
                <polygon points="15.5,25 12.5,28 10,27" fill="url(#sb_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="13.2" cy="26" r="1" fill="${color}" stroke="#05070a" stroke-width="0.4" />
                <circle cx="13" cy="25.8" r="0.3" fill="#ffffff" />

                <!-- Right Gothic Sabaton (Highlight Side) -->
                <!-- Ankle Collar -->
                <path d="M16 12 H24 L23 16 H17 Z" fill="url(#sb_brass_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Main Foot Lames Stack -->
                <path d="M16.5 15 L23.5 13 L25 21 L28.5 25 L25.5 28 L16 27 Z" fill="url(#sb_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Overlapping Instep Lame Seams -->
                <path d="M17 18 H24 M17.2 21 H25 M17.5 24 H26.5" stroke="#05070a" stroke-width="1" opacity="0.6" />
                <!-- Pointed Gothic Toe Cap & Rarity Gem -->
                <polygon points="28.5,25 25.5,28 23,27" fill="url(#sb_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="26.2" cy="26" r="1" fill="${color}" stroke="#05070a" stroke-width="0.4" />
                <circle cx="26" cy="25.8" r="0.3" fill="#ffffff" />

                <!-- Specular Facet Highlights -->
                <path d="M17 15 L22 13.5 L23.5 20 H18.5 Z" fill="#ffffff" opacity="0.2" />
              `;
    },
    sollerets(id, color) {
      return `
                <defs>
                  <!-- Steel scale plate light gradient -->
                  <linearGradient id="sl_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel scale plate shadow gradient -->
                  <linearGradient id="sl_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Brass buckle & trim fittings -->
                  <linearGradient id="sl_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Leather strap gradient -->
                  <linearGradient id="sl_leather_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#5c3a21"/>
                    <stop offset="100%" stop-color="#2d1d0b"/>
                  </linearGradient>
                </defs>

                <!-- Left Solleret Scale Assembly (Shadow Side) -->
                <!-- Ankle Strap & Buckle -->
                <path d="M4 10 H12 L11 14 H4.5 Z" fill="url(#sl_leather_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="7" y="10.5" width="3" height="3" fill="url(#sl_brass_${id})" stroke="#05070a" stroke-width="0.6" />
                <circle cx="8.5" cy="12" r="0.6" fill="${color}" />
                <!-- Overlapping Scale Foot Body -->
                <path d="M4 13.5 L11 12 L12.5 22 L15 26 L12 28 L3.5 27 Z" fill="url(#sl_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Lamination Seam Lines -->
                <path d="M4.2 17 H11.5 M4.5 20.5 H12 M4.8 24 H13.5" stroke="#05070a" stroke-width="1" opacity="0.65" />
                <!-- Toe Cap & Rivet -->
                <polygon points="15,26 12,28 9.5,27" fill="url(#sl_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="12" cy="27" r="0.5" fill="#ffffff" />

                <!-- Right Solleret Scale Assembly (Highlight Side) -->
                <!-- Ankle Strap & Buckle -->
                <path d="M16 10 H24 L23 14 H16.5 Z" fill="url(#sl_leather_${id})" stroke="#05070a" stroke-width="1" />
                <rect x="19" y="10.5" width="3" height="3" fill="url(#sl_brass_${id})" stroke="#05070a" stroke-width="0.6" />
                <circle cx="20.5" cy="12" r="0.6" fill="${color}" />
                <!-- Overlapping Scale Foot Body -->
                <path d="M16 13.5 L23 12 L24.5 22 L27 26 L24 28 L15.5 27 Z" fill="url(#sl_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Lamination Seam Lines -->
                <path d="M16.2 17 H23.5 M16.5 20.5 H24 M16.8 24 H25.5" stroke="#05070a" stroke-width="1" opacity="0.65" />
                <!-- Toe Cap & Rivet -->
                <polygon points="27,26 24,28 21.5,27" fill="url(#sl_brass_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="24" cy="27" r="0.5" fill="#ffffff" />

                <!-- Specular Facet Highlights -->
                <path d="M16.5 14 L22 12.5 L23 19 H17.5 Z" fill="#ffffff" opacity="0.2" />
              `;
    },
    steel_boots(id, color) {
      return `
                <defs>
                  <!-- Steel plate light gradient -->
                  <linearGradient id="st_steel_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#cbd5e1"/>
                    <stop offset="100%" stop-color="#64748b"/>
                  </linearGradient>
                  <!-- Steel plate shadow gradient -->
                  <linearGradient id="st_steel_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Collar brass trim -->
                  <linearGradient id="st_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Outsole gradient -->
                  <linearGradient id="st_sole_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#334155"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                </defs>

                <!-- Left Steel Boot (Shadow Side) -->
                <!-- Flared Ankle Collar & Gem -->
                <path d="M3 10 H12 L11 14 H4 Z" fill="url(#st_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="7.5" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <!-- Main Steel Body -->
                <path d="M4 14 L11 12.5 L12 21 L15 25 L12.5 28 L3 27 Z" fill="url(#st_steel_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Heavy Toe Cap Overlay -->
                <path d="M3.5 23 L13 24.5 L12.5 28 H3 Z" fill="url(#st_steel_l_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Ankle Hinge Rivets -->
                <circle cx="10" cy="18" r="0.8" fill="url(#st_brass_${id})" stroke="#05070a" stroke-width="0.4" />

                <!-- Right Steel Boot (Highlight Side) -->
                <!-- Flared Ankle Collar & Gem -->
                <path d="M16 10 H25 L24 14 H17 Z" fill="url(#st_brass_${id})" stroke="#05070a" stroke-width="1" stroke-linejoin="round" />
                <circle cx="20.5" cy="12" r="1.2" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <!-- Main Steel Body -->
                <path d="M17 14 L24 12.5 L25 21 L28 25 L25.5 28 L16 27 Z" fill="url(#st_steel_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Heavy Toe Cap Overlay -->
                <path d="M16.5 23 L26 24.5 L25.5 28 H16 Z" fill="url(#st_steel_l_${id})" stroke="#05070a" stroke-width="1" />
                <!-- Ankle Hinge Rivets -->
                <circle cx="23" cy="18" r="0.8" fill="url(#st_brass_${id})" stroke="#05070a" stroke-width="0.4" />

                <!-- Specular Reflections -->
                <path d="M18 15 L23 13.5 L23.8 20 H18.5 Z" fill="#ffffff" opacity="0.22" />
                <circle cx="23" cy="25" r="0.5" fill="#ffffff" />
              `;
    },
    treads(id, color) {
      return `
                <defs>
                  <!-- Tactical boot light gradient -->
                  <linearGradient id="tr_boot_l_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#475569"/>
                    <stop offset="60%" stop-color="#334155"/>
                    <stop offset="100%" stop-color="#1e293b"/>
                  </linearGradient>
                  <!-- Tactical boot shadow gradient -->
                  <linearGradient id="tr_boot_d_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                  <!-- Heavy rubber tread outsole gradient -->
                  <linearGradient id="tr_sole_${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#020617"/>
                  </linearGradient>
                  <!-- Eyelets & brass fittings -->
                  <linearGradient id="tr_brass_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffeaa7"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                </defs>

                <!-- Left Tread Boot (Shadow Side) -->
                <!-- Main Upper & Foot Body -->
                <path d="M4 11 L10 8 L12 21 L16 24 L14 27 L4 26 Z" fill="url(#tr_boot_d_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Deep Rubber Lugged Outsole -->
                <path d="M3.5 26 H14.5 V28.5 H3.5 Z" fill="url(#tr_sole_${id})" stroke="#05070a" stroke-width="1" />
                <path d="M5 28.5 V29.5 M8 28.5 V29.5 M11 28.5 V29.5" stroke="#05070a" stroke-width="1.2" />
                <!-- Speed Lace Hooks & Eyelets -->
                <circle cx="6.5" cy="13" r="0.8" fill="url(#tr_brass_${id})" />
                <circle cx="6.5" cy="16" r="0.8" fill="url(#tr_brass_${id})" />
                <circle cx="6.5" cy="19" r="0.8" fill="url(#tr_brass_${id})" />
                <!-- Rarity Buckle Strap -->
                <rect x="5.5" y="14.5" width="4.5" height="2" rx="0.4" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <rect x="5.5" y="17.5" width="4.5" height="2" rx="0.4" fill="${color}" stroke="#05070a" stroke-width="0.5" />

                <!-- Right Tread Boot (Highlight Side) -->
                <!-- Main Upper & Foot Body -->
                <path d="M16 11 L22 7 L24 21 L28 24 L26 27 L16 26 Z" fill="url(#tr_boot_l_${id})" stroke="#05070a" stroke-width="1.8" stroke-linejoin="round" />
                <!-- Deep Rubber Lugged Outsole -->
                <path d="M15.5 26 H26.5 V28.5 H15.5 Z" fill="url(#tr_sole_${id})" stroke="#05070a" stroke-width="1" />
                <path d="M17 28.5 V29.5 M20 28.5 V29.5 M23 28.5 V29.5" stroke="#05070a" stroke-width="1.2" />
                <!-- Speed Lace Hooks & Eyelets -->
                <circle cx="18.5" cy="13" r="0.8" fill="url(#tr_brass_${id})" />
                <circle cx="18.5" cy="16" r="0.8" fill="url(#tr_brass_${id})" />
                <circle cx="18.5" cy="19" r="0.8" fill="url(#tr_brass_${id})" />
                <!-- Rarity Buckle Strap -->
                <rect x="17.5" y="14.5" width="4.5" height="2" rx="0.4" fill="${color}" stroke="#05070a" stroke-width="0.5" />
                <rect x="17.5" y="17.5" width="4.5" height="2" rx="0.4" fill="${color}" stroke="#05070a" stroke-width="0.5" />

                <!-- Specular Highlights -->
                <path d="M17 12 L21 8.5 L22 17 H17.5 Z" fill="#ffffff" opacity="0.15" />
              `;
    },
    sigil(id, color) {
      return `
                    <defs>
                      <linearGradient id="g_sig_${id}" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="45%" stop-color="${color}"/>
                        <stop offset="100%" stop-color="#110d1a"/>
                      </linearGradient>
                    </defs>
                    <path d="M16 2 L28 10 L28 22 L16 30 L4 22 L4 10 Z" fill="url(#g_sig_${id})" stroke="#000" stroke-width="1.8" stroke-linejoin="round" />
                    <circle cx="16" cy="16" r="6.2" fill="none" stroke="#ffffff" stroke-dasharray="2 2" stroke-width="1" opacity="0.75" />
                    <path d="M16 9 L16 23 M11 16 L21 16" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
                  `;
    },
    card(id, color) {
      return `
                    <defs>
                      <linearGradient id="g_card_b_${id}" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="60%" stop-color="${color}"/>
                        <stop offset="100%" stop-color="#0c051a"/>
                      </linearGradient>
                    </defs>
                    <rect x="7" y="4" width="18" height="24" rx="2.5" fill="url(#g_card_b_${id})" stroke="#000" stroke-width="1.8" />
                    <rect x="9.5" y="6.5" width="13" height="19" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.3" />
                    <circle cx="16" cy="16" r="4.5" fill="none" stroke="#ffffff" stroke-dasharray="2 1.5" stroke-width="1" opacity="0.8" />
                    <polygon points="16,12.5 19,16 16,19.5 13,16" fill="${color}" stroke="#000" stroke-width="0.8" />
                  `;
    },
    signet_ring(id, color) {
      return `
                <defs>
                  <!-- Royal Gold Band multi-stop gradient -->
                  <linearGradient id="sn_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275"/>
                    <stop offset="40%" stop-color="#d4af37"/>
                    <stop offset="80%" stop-color="#8a6d1c"/>
                    <stop offset="100%" stop-color="#5a4504"/>
                  </linearGradient>
                  <!-- Signet Shield Gemstone gradient -->
                  <linearGradient id="sn_gem_${id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="45%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#05070a"/>
                  </linearGradient>
                  <!-- Ambient Gem backglow -->
                  <radialGradient id="sn_glow_${id}" cx="50%" cy="30%" r="50%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                  </radialGradient>
                </defs>

                <!-- Gem Ambient Glow -->
                <circle cx="16" cy="11" r="7" fill="url(#sn_glow_${id})" />

                <!-- Outer Gold Ring Band -->
                <ellipse cx="16" cy="19" rx="8.5" ry="9.5" fill="none" stroke="url(#sn_gold_${id})" stroke-width="3" />
                <!-- Inner Ring Band Depth Shadow -->
                <ellipse cx="16" cy="19" rx="7" ry="8" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.6" />

                <!-- Gold Bezel Shield Mount & Claw Prongs -->
                <path d="M9.5 8 L22.5 8 L24 13.5 L16 18.5 L8 13.5 Z" fill="url(#sn_gold_${id})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />

                <!-- Shield Faceted Gemstone -->
                <path d="M11 7.5 L21 7.5 L22.2 12.5 L16 16.5 L9.8 12.5 Z" fill="url(#sn_gem_${id})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round" />

                <!-- Inner Heraldic Engraved Diamond Emblem -->
                <polygon points="16,9.2 18.5,12 16,14.8 13.5,12" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.85" />
                <circle cx="16" cy="12" r="0.8" fill="#ffffff" />

                <!-- Specular Light Glint Highlights -->
                <polygon points="11,7.8 14,7.8 12.5,11.5" fill="#ffffff" opacity="0.6" />
                <ellipse cx="13.5" cy="9.5" rx="0.6" ry="1.2" fill="#ffffff" transform="rotate(-20 13.5 9.5)" />
              `;
    },
    loop_ring(id, color) {
      return `
                <defs>
                  <!-- Interlocking Gold Loop multi-stop gradient -->
                  <linearGradient id="lp_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275"/>
                    <stop offset="40%" stop-color="#d4af37"/>
                    <stop offset="80%" stop-color="#8a6d1c"/>
                    <stop offset="100%" stop-color="#5a4504"/>
                  </linearGradient>
                  <!-- Solitaire Gemstone gradient -->
                  <radialGradient id="lp_gem_${id}" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#07090e"/>
                  </radialGradient>
                  <!-- Solitaire Gem backglow -->
                  <radialGradient id="lp_glow_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                  </radialGradient>
                </defs>

                <!-- Gem Soft Backglow -->
                <circle cx="16" cy="10" r="7" fill="url(#lp_glow_${id})" />

                <!-- Interwoven Crossed Double Loop Bands -->
                <!-- Left Loop Band -->
                <ellipse cx="16" cy="19.5" rx="9" ry="8" fill="none" stroke="url(#lp_gold_${id})" stroke-width="2.2" transform="rotate(-12 16 19.5)" />
                <!-- Right Loop Band -->
                <ellipse cx="16" cy="19.5" rx="9" ry="8" fill="none" stroke="url(#lp_gold_${id})" stroke-width="2.2" transform="rotate(12 16 19.5)" />
                <!-- Inner Shadow Rings for woven depth -->
                <ellipse cx="16" cy="19.5" rx="7.5" ry="6.5" fill="none" stroke="#05070a" stroke-width="0.8" opacity="0.6" transform="rotate(-12 16 19.5)" />
                <ellipse cx="16" cy="19.5" rx="7.5" ry="6.5" fill="none" stroke="#05070a" stroke-width="0.8" opacity="0.6" transform="rotate(12 16 19.5)" />

                <!-- Circular Gold Bezel Crown Mount -->
                <circle cx="16" cy="10" r="5.2" fill="url(#lp_gold_${id})" stroke="#05070a" stroke-width="1.2" />

                <!-- Solitaire Gemstone -->
                <circle cx="16" cy="10" r="3.8" fill="url(#lp_gem_${id})" stroke="#05070a" stroke-width="1" />
                <ellipse cx="14.8" cy="8.8" rx="1" ry="0.6" fill="#ffffff" opacity="0.8" transform="rotate(-20 14.8 8.8)" />

                <!-- Four-Point Starburst Flare Reflection -->
                <polygon points="16,3.5 17,9 16,10 15,9" fill="#ffffff" opacity="0.85" />
                <polygon points="16,10 21.5,10 16,10 10.5,10" fill="#ffffff" opacity="0.5" />
              `;
    },
    band_ring(id, color) {
      return `
                <defs>
                  <!-- Heavy Platinum Band multi-stop gradient -->
                  <linearGradient id="bn_plat_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="40%" stop-color="#cbd5e1"/>
                    <stop offset="80%" stop-color="#64748b"/>
                    <stop offset="100%" stop-color="#334155"/>
                  </linearGradient>
                  <!-- Gold Runic Inlay gradient -->
                  <linearGradient id="bn_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Inset Gemstone Stud gradient -->
                  <radialGradient id="bn_gem_${id}" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#05070a"/>
                  </radialGradient>
                </defs>

                <!-- Wide Heavy Platinum Ring Band Base -->
                <ellipse cx="16" cy="17" rx="10.5" ry="10.5" fill="none" stroke="url(#bn_plat_${id})" stroke-width="5" />
                <!-- Outer & Inner Edge Outlines -->
                <ellipse cx="16" cy="17" rx="13" ry="13" fill="none" stroke="#05070a" stroke-width="1.2" />
                <ellipse cx="16" cy="17" rx="8" ry="8" fill="none" stroke="#05070a" stroke-width="1.2" />

                <!-- Gilded Inlaid Runic Script Groove -->
                <ellipse cx="16" cy="17" rx="10.5" ry="10.5" fill="none" stroke="url(#bn_gold_${id})" stroke-width="1.8" stroke-dasharray="3.5 2.5" />

                <!-- Flush Inset Gemstone Stud 1: Top Center Crest -->
                <circle cx="16" cy="6.5" r="2.2" fill="url(#bn_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="16" cy="6.5" r="1.4" fill="url(#bn_gem_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="15.6" cy="6.1" r="0.4" fill="#ffffff" />

                <!-- Flush Inset Gemstone Stud 2: Upper Left Arch -->
                <circle cx="9.2" cy="10" r="1.8" fill="url(#bn_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="9.2" cy="10" r="1.1" fill="url(#bn_gem_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="8.9" cy="9.7" r="0.3" fill="#ffffff" />

                <!-- Flush Inset Gemstone Stud 3: Upper Right Arch -->
                <circle cx="22.8" cy="10" r="1.8" fill="url(#bn_gold_${id})" stroke="#05070a" stroke-width="0.8" />
                <circle cx="22.8" cy="10" r="1.1" fill="url(#bn_gem_${id})" stroke="#05070a" stroke-width="0.5" />
                <circle cx="22.5" cy="9.7" r="0.3" fill="#ffffff" />

                <!-- Specular Highlight Glints -->
                <path d="M12 6 C14 5, 18 5, 20 6" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.7" />
              `;
    },
    seal_ring(id, color) {
      return `
                <defs>
                  <!-- Dark Steel Band multi-stop gradient -->
                  <linearGradient id="sl_metal_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#64748b"/>
                    <stop offset="40%" stop-color="#334155"/>
                    <stop offset="80%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                  </linearGradient>
                  <!-- Gilded Oval Bezel Rim gradient -->
                  <linearGradient id="sl_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275"/>
                    <stop offset="50%" stop-color="#d4af37"/>
                    <stop offset="100%" stop-color="#8a6d1c"/>
                  </linearGradient>
                  <!-- Arcane Seal Core gradient -->
                  <radialGradient id="sl_seal_${id}" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="55%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#05070a"/>
                  </radialGradient>
                  <!-- Ambient Seal glow -->
                  <radialGradient id="sl_glow_${id}" cx="50%" cy="30%" r="50%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                  </radialGradient>
                </defs>

                <!-- Seal Soft Backglow -->
                <ellipse cx="16" cy="10" rx="9" ry="6" fill="url(#sl_glow_${id})" />

                <!-- Heavy Dark Steel Ring Band -->
                <ellipse cx="16" cy="19" rx="8.5" ry="9.5" fill="none" stroke="url(#sl_metal_${id})" stroke-width="3" />
                <ellipse cx="16" cy="19" rx="7" ry="8" fill="none" stroke="#05070a" stroke-width="1.2" opacity="0.6" />

                <!-- Gilded Oval Bezel Mount Plate -->
                <ellipse cx="16" cy="10" rx="9" ry="6" fill="url(#sl_gold_${id})" stroke="#05070a" stroke-width="1.2" />

                <!-- Glowing Arcane Seal Core Center -->
                <ellipse cx="16" cy="10" rx="7" ry="4.2" fill="url(#sl_seal_${id})" stroke="#05070a" stroke-width="0.8" />

                <!-- Engraved 8-Point Arcane Star Sigil Emblem -->
                <polygon points="16,7 17.2,9 19.5,10 17.2,11 16,13 14.8,11 12.5,10 14.8,9" fill="#ffffff" opacity="0.85" />
                <circle cx="16" cy="10" r="0.8" fill="#ffffff" />

                <!-- Specular Glare Arc -->
                <path d="M10 8.5 C12 7, 18 7, 21 8.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />
              `;
    },
    ring(id, color) {
      return `
                <defs>
                  <!-- Gold Band multi-stop gradient -->
                  <linearGradient id="rn_gold_${id}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#fff275"/>
                    <stop offset="40%" stop-color="#d4af37"/>
                    <stop offset="80%" stop-color="#8a6d1c"/>
                    <stop offset="100%" stop-color="#5a4504"/>
                  </linearGradient>
                  <!-- Gemstone radial gradient -->
                  <radialGradient id="rn_gem_${id}" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="#05070a"/>
                  </radialGradient>
                  <!-- Gemstone soft backglow -->
                  <radialGradient id="rn_glow_${id}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.6"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                  </radialGradient>
                </defs>

                <!-- Gem Soft Backglow -->
                <circle cx="16" cy="8" r="6.5" fill="url(#rn_glow_${id})" />

                <!-- Outer Gold Ring Band -->
                <ellipse cx="16" cy="18" rx="8.5" ry="9.5" fill="none" stroke="url(#rn_gold_${id})" stroke-width="2.5" />
                <ellipse cx="16" cy="18" rx="7" ry="8" fill="none" stroke="#05070a" stroke-width="1" opacity="0.6" />

                <!-- Gold Bezel Crown & Claw Prongs -->
                <circle cx="16" cy="8" r="4.8" fill="url(#rn_gold_${id})" stroke="#05070a" stroke-width="1" />

                <!-- Central Round Gemstone -->
                <circle cx="16" cy="8" r="3.5" fill="url(#rn_gem_${id})" stroke="#05070a" stroke-width="0.8" />

                <!-- Bezel Claw Prongs -->
                <circle cx="12.5" cy="8" r="0.6" fill="url(#rn_gold_${id})" />
                <circle cx="19.5" cy="8" r="0.6" fill="url(#rn_gold_${id})" />
                <circle cx="16" cy="4.5" r="0.6" fill="url(#rn_gold_${id})" />
                <circle cx="16" cy="11.5" r="0.6" fill="url(#rn_gold_${id})" />

                <!-- Specular Light Glint -->
                <ellipse cx="14.8" cy="6.8" rx="1" ry="0.6" fill="#ffffff" opacity="0.8" transform="rotate(-20 14.8 6.8)" />
              `;
    },
  },

  // Blueprints for procedurally rendering bosses on indicators or consoles
  bosses: {
    guardian(uid) {
      return `
        <defs>
          <linearGradient id="g_goliath_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34495e"/><stop offset="100%" stop-color="#1a252f"/></linearGradient>
          <radialGradient id="g_core_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff"/><stop offset="40%" stop-color="#00d2ff"/><stop offset="100%" stop-color="#003755"/></radialGradient>
        </defs>
        <path d="M32 4 L52 14 L46 44 L32 58 L18 44 L12 14 Z" fill="url(#g_goliath_${uid})" stroke="#00d2ff" stroke-width="2.5" stroke-linejoin="round" />
        <circle cx="32" cy="30" r="10" fill="url(#g_core_${uid})" stroke="#fff" stroke-width="1.5" />
        <polygon points="26,24 20,22 24,28" fill="#e74c3c" /><polygon points="38,24 44,22 40,28" fill="#e74c3c" />
      `;
    },
    chronos(uid) {
      return `
        <defs><linearGradient id="g_chron_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#b7950b"/></linearGradient></defs>
        <circle cx="32" cy="32" r="24" fill="none" stroke="url(#g_chron_${uid})" stroke-width="3" />
        <g stroke="url(#g_chron_${uid})" stroke-width="3" stroke-linecap="round"><line x1="32" y1="4" x2="32" y2="8" /><line x1="32" y1="56" x2="32" y2="60" /><line x1="4" y1="32" x2="8" y2="32" /><line x1="56" y1="32" x2="60" y2="32" /></g>
        <circle cx="32" cy="32" r="16" fill="#111" stroke="url(#g_chron_${uid})" stroke-width="1.5" />
        <line x1="32" y1="32" x2="32" y2="20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
        <line x1="32" y1="32" x2="40" y2="32" stroke="#e67e22" stroke-width="1.5" stroke-linecap="round" />
      `;
    },
    nexus(uid) {
      return `
        <defs><linearGradient id="g_nex_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff007f"/><stop offset="100%" stop-color="#00d2ff"/></linearGradient></defs>
        <rect x="14" y="14" width="36" height="36" fill="none" stroke="url(#g_nex_${uid})" stroke-width="2" />
        <rect x="20" y="20" width="24" height="24" fill="none" stroke="#00b894" stroke-width="1.5" />
        <circle cx="32" cy="32" r="4" fill="#fff" stroke="#ff007f" stroke-width="1" />
      `;
    },
  },

  // Centralized configurations of materials and generic items
  materials: {
    "Eridium Shard"(uid) {
      return `
        <defs><linearGradient id="g_es_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e84393" /><stop offset="100%" stop-color="#8e44ad" /></linearGradient></defs>
        <path d="M16 2 L26 16 L16 30 L6 16 Z" fill="url(#g_es_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 2 L16 30" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/><path d="M6 16 L26 16" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>
      `;
    },
    "Glimmering Gachapon Key"(uid) {
      return `
        <defs><linearGradient id="g_gk_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d2ff" /><stop offset="50%" stop-color="#e84393" /><stop offset="100%" stop-color="#9b59b6" /></linearGradient></defs>
        <path d="M11 4 L14 11 L21 11 L15 15 L18 22 L11 17 L4 22 L7 15 L1 11 L8 11 Z" fill="url(#g_gk_${uid})" stroke="#000" stroke-width="1.8" />
        <circle cx="11" cy="12" r="2.5" fill="#111" stroke="#000" stroke-width="1" />
        <path d="M15 15 L27 27 L25 29 L23 27" stroke="#000" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M15.5 15.5 L26.5 26.5" stroke="url(#g_gk_${uid})" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M23.5 23.5 L21.5 25.5 M25.5 25.5 L23.5 27.5" stroke="url(#g_gk_${uid})" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    "Gacha Key"(uid) {
      return `
        <defs><linearGradient id="g_gkey_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700" /><stop offset="100%" stop-color="#b7950b" /></linearGradient></defs>
        <circle cx="11" cy="21" r="6" fill="url(#g_gkey_${uid})" stroke="#000" stroke-width="2" />
        <circle cx="11" cy="21" r="2.5" fill="#111" stroke="#000" stroke-width="1.5" />
        <path d="M15 17 L27 5 L30 8 L28 10 L26 8 L24 12 L22 10" stroke="#000" stroke-width="2" stroke-linejoin="round" fill="none" />
        <path d="M15.5 16.5 L26.5 5.5" stroke="url(#g_gkey_${uid})" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M26.5 5.5 L28.5 7.5 M24.5 7.5 L26.5 9.5" stroke="url(#g_gkey_${uid})" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    "Ancient Core"(uid) {
      return `
        <defs><radialGradient id="g_ac_${uid}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" /><stop offset="30%" stop-color="#e74c3c" /><stop offset="100%" stop-color="#960018" /></radialGradient></defs>
        <circle cx="16" cy="16" r="11" fill="url(#g_ac_${uid})" stroke="#000" stroke-width="2" />
        <path d="M5 16 L27 16" stroke="#000" stroke-width="2" /><path d="M16 5 L16 27" stroke="#000" stroke-width="2" />
        <circle cx="16" cy="16" r="4" fill="#fff" opacity="0.8" />
      `;
    },
    "Overlord's Sigil"(uid) {
      return `
        <defs><linearGradient id="g_os_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1abc9c" /><stop offset="100%" stop-color="#16a085" /></linearGradient></defs>
        <path d="M16 4 L19 14 L27 10 L24 20 L16 28 L8 20 L5 10 L13 14 Z" fill="url(#g_os_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="16" cy="16" r="3.5" fill="#fff" stroke="#000" stroke-width="1.5" />
      `;
    },
    "Astral Essence"(uid) {
      return `
        <defs><linearGradient id="g_ae_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e84393" /><stop offset="50%" stop-color="#9b59b6" /><stop offset="100%" stop-color="#3498db" /></linearGradient></defs>
        <path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" fill="url(#g_ae_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round" />
        <circle cx="16" cy="16" r="3" fill="#ffffff" opacity="0.9" />
      `;
    },
    Scrap(uid, stop1, stop2) {
      return `
        <defs><linearGradient id="g_sc_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${stop1}" /><stop offset="100%" stop-color="${stop2}" /></linearGradient></defs>
        <path d="M6 14 L16 4 L28 12 L22 26 L10 24 Z" fill="url(#g_sc_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12 10 L18 20" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-linecap="round"/>
      `;
    },
    "Luminous Soul"(uid) {
      return `
        <defs><linearGradient id="g_ls_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#fd79a8" /><stop offset="100%" stop-color="#ffb6c1" /></linearGradient></defs>
        <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#g_ls_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="13" cy="20" r="3" fill="#fff" opacity="0.6"/>
      `;
    },
    "Monster Soul"(uid) {
      return `
        <defs><linearGradient id="g_ms_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#2d3436" /><stop offset="100%" stop-color="#636e72" /></linearGradient></defs>
        <path d="M16 3 C16 3, 6 15, 6 22 C6 27, 10.5 30, 16 30 C21.5 30, 26 27, 26 22 C26 15, 16 3, 16 3 Z" fill="url(#g_ms_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M11 19 L14 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/><path d="M21 19 L18 17" stroke="#e74c3c" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    "Catalyst Core"(uid) {
      return `
        <defs><linearGradient id="g_cc_${uid}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#2ecc71" /><stop offset="50%" stop-color="#a3fd83" /><stop offset="100%" stop-color="#27ae60" /></linearGradient></defs>
        <rect x="9" y="4" width="14" height="24" rx="3" fill="url(#g_cc_${uid})" stroke="#000" stroke-width="2"/>
        <line x1="9" y1="10" x2="23" y2="10" stroke="#000" stroke-width="2"/><line x1="9" y1="22" x2="23" y2="22" stroke="#000" stroke-width="2"/>
        <rect x="13" y="13" width="6" height="6" fill="#fff" opacity="0.9" rx="1"/>
      `;
    },
  },

  // Centralized configurations of consumables, scrolls, crates, and sacks
  consumables: {
    potion(uid, color, name = "") {
      let nameLower = (name || "").toLowerCase();
      let isSupernal = nameLower.includes("supernal");
      let isGreater = nameLower.includes("greater");

      if (isSupernal) {
        // TIER 3: Ornate Royal Celestial Flask with Gold Filigree Casing & Core Rune
        return `
              ${window.AssetCatalog.gradients.liquid(uid, color)}
              <!-- Outer Gold Filigree Casing -->
              <path d="M11 5 H21 V9 L27 17 C29 23, 26 29, 21 29 H11 C6 29, 3 23, 5 17 L11 9 Z" fill="#0d0a1a" stroke="#ffd700" stroke-width="2.2" stroke-linejoin="round"/>
              <!-- Inner Glowing Liquid Pool -->
              <path d="M7 19 H25 L26 23 C27 26, 25 28, 21 28 H11 C7 28, 5 26, 6 23 Z" fill="url(#grad_liq_${uid})" stroke="#000" stroke-width="1"/>
              <!-- Gold Filigree Neck Ring -->
              <rect x="10" y="8" width="12" height="3" rx="1" fill="#ffd700" stroke="#000" stroke-width="1"/>
              <rect x="13.5" y="1" width="5" height="4" fill="#8c4118" stroke="#000" stroke-width="1.2"/>
              <!-- Central Celestial Core Diamond -->
              <polygon points="16,13 18.5,17 16,21 13.5,17" fill="#ffffff" stroke="#ffd700" stroke-width="1" />
              <!-- Glass Specular Arc -->
              <path d="M8 20 C7 23, 8 26, 10 27" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"/>
            `;
      } else if (isGreater) {
        // TIER 2: Facet-Cut Crystal Flask with Silver Collar
        return `
              ${window.AssetCatalog.gradients.liquid(uid, color)}
              <!-- Faceted Crystal Body -->
              <path d="M12 5 H20 V10 L27 17 L22 28 H10 L5 17 L12 10 Z" fill="#0f172a" stroke="#e2e8f0" stroke-width="2" stroke-linejoin="round"/>
              <!-- Liquid Fill -->
              <path d="M7 19 L12 19 L20 19 L25 19 L21.5 27 H10.5 Z" fill="url(#grad_liq_${uid})" stroke="#000" stroke-width="1"/>
              <!-- Silver Neck Band -->
              <rect x="11" y="8" width="10" height="2.5" fill="#94a3b8" stroke="#000" stroke-width="1"/>
              <rect x="13.5" y="1.5" width="5" height="3.5" fill="#78350f" stroke="#000" stroke-width="1"/>
              <!-- Specular Crystal Facet Line -->
              <line x1="8" y1="18" x2="11" y2="26" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.75"/>
            `;
      }

      // TIER 1: Standard Alchemy Glass Sphere Flask
      return `
            ${window.AssetCatalog.gradients.liquid(uid, color)}
            <!-- Round Spherical Glass Body -->
            <circle cx="16" cy="19" r="10.5" fill="#0f172a" stroke="#000" stroke-width="2"/>
            <path d="M13 4 H19 V10 H13 Z" fill="#1e293b" stroke="#000" stroke-width="1.8"/>
            <!-- Liquid Level Pool -->
            <path d="M6 18 C6 25, 26 25, 26 18 C26 24, 6 24, 6 18 Z" fill="url(#grad_liq_${uid})" stroke="#000" stroke-width="1"/>
            <circle cx="16" cy="19" r="9.2" fill="url(#grad_liq_${uid})" opacity="0.6"/>
            <!-- Cork Stopper -->
            <rect x="13.5" y="1" width="5" height="4" fill="#a0522d" stroke="#000" stroke-width="1.2"/>
            <!-- Internal Liquid Bubbles -->
            <circle cx="13" cy="21" r="1" fill="#fff" opacity="0.7"/>
            <circle cx="18" cy="17" r="1.2" fill="#fff" opacity="0.8"/>
            <!-- Specular Glass Highlight -->
            <path d="M9 14 C7 17, 7 21, 10 25" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.75"/>
          `;
    },
    scroll(uid, color) {
      return `
          <path d="M6 10 L26 6 L26 22 L6 26 Z" fill="#fdf6e2" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
          <rect x="13" y="11" width="6" height="11" transform="rotate(-11 16 16)" fill="${color}" stroke="#000" stroke-width="1.5" />
          <path d="M6 10 C6 10, 4 12, 6 14" stroke="#000" stroke-width="2" fill="none" />
          <path d="M26 6 C26 6, 28 8, 26 10" stroke="#000" stroke-width="2" fill="none" />
        `;
    },
    sack(uid, stopCol) {
      return `
            <defs>
              <linearGradient id="g_sk_b_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd54f" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="${stopCol}" />
              </linearGradient>
              <linearGradient id="g_sk_n_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ffe082" />
                <stop offset="100%" stop-color="${stopCol}" />
              </linearGradient>
              <linearGradient id="g_sk_g_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="#9a7d0a" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.5)" />

            <!-- Flared Open Neck -->
            <path d="M24 22 L20 12 C24 9, 40 9, 44 12 L40 22 Z" fill="url(#g_sk_n_${uid})" stroke="#000" stroke-width="1.8" />

            <!-- Main Sack Body -->
            <path d="M32 22 C20 22, 10 25, 10 40 C10 52, 18 58, 32 58 C46 58, 54 52, 54 40 C54 25, 44 22, 32 22 Z" fill="url(#g_sk_b_${uid})" stroke="#000" stroke-width="2" stroke-linejoin="round" />

            <!-- Creases & Highlights -->
            <path d="M12 36 C18 40, 32 36, 42 36" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.8" />
            <path d="M32 22 V58" stroke="rgba(0,0,0,0.15)" stroke-width="1.5" />

            <!-- Cinch cord rope and Knot -->
            <path d="M22 22 Q32 26, 42 22" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="3" stroke-linecap="round" />
            <path d="M24 23 Q32 26.5, 40 23" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" />
            <circle cx="32" cy="23.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />

            <!-- Dangling strings -->
            <path d="M30 24 Q24 38, 20 42" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="20" cy="42" r="1.2" fill="url(#g_sk_g_${uid})" stroke="#000" stroke-width="0.8" />
            <path d="M34 24 Q40 38, 44 42" fill="none" stroke="url(#g_sk_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="44" cy="42" r="1.2" fill="url(#g_sk_g_${uid})" stroke="#000" stroke-width="0.8" />
          `;
    },
    crate(uid) {
      return `
            <defs>
              <linearGradient id="g_cr_w_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a0522d" />
                <stop offset="100%" stop-color="#5c2e16" />
              </linearGradient>
              <linearGradient id="g_cr_m_${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd700" />
                <stop offset="100%" stop-color="#b7950b" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="24" ry="4" fill="rgba(0,0,0,0.55)" />
            <!-- Wooden Crate Chest Body -->
            <rect x="10" y="24" width="44" height="32" rx="4" fill="url(#g_cr_w_${uid})" stroke="#000" stroke-width="2.5" />
            <!-- Wood panels details -->
            <line x1="21" y1="24" x2="21" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="32" y1="24" x2="32" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="43" y1="24" x2="43" y2="56" stroke="#3d1d0b" stroke-width="1.5" />
            <!-- Diagonal crossbeam struts -->
            <line x1="12" y1="26" x2="52" y2="54" stroke="#3d1d0b" stroke-width="3" />
            <!-- Heavy corner brackets (Golden/Iron) -->
            <rect x="10" y="24" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="24" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="10" y="48" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <rect x="46" y="48" width="8" height="8" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Big Runic Lock in center -->
            <rect x="28" y="28" width="8" height="11" rx="1.5" fill="url(#g_cr_m_${uid})" stroke="#000" stroke-width="1.5" />
            <circle cx="32" cy="33" r="1.5" fill="#111" />
            <!-- Crate Lid -->
            <rect x="8" y="16" width="48" height="8" rx="1.5" fill="#a0522d" stroke="#000" stroke-width="2.5" />
            <line x1="16" y1="16" x2="16" y2="24" stroke="#3d1d0b" stroke-width="1.5" />
            <line x1="48" y1="16" x2="48" y2="24" stroke="#3d1d0b" stroke-width="1.5" />
          `;
    },
    cavern_sigil_sack(uid) {
      return `
            <defs>
              <linearGradient id="g_css_b_${uid}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7d3c98" />
                <stop offset="60%" stop-color="#4a154b" />
                <stop offset="100%" stop-color="#110521" />
              </linearGradient>
              <linearGradient id="g_css_n_${uid}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#e8a7fc" />
                <stop offset="100%" stop-color="#4a154b" />
              </linearGradient>
              <linearGradient id="g_css_g_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="50%" stop-color="#f1c40f" />
                <stop offset="100%" stop-color="#9a7d0a" />
              </linearGradient>
              <linearGradient id="g_css_m_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#00ffff" />
                <stop offset="100%" stop-color="#008b8b" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />

            <!-- Flared Open Neck -->
            <path d="M20 16 C25 9, 39 9, 44 16 C39 12, 25 12, 20 16 Z" fill="url(#g_css_m_${uid})" opacity="0.8" style="filter: drop-shadow(0 0 3px #00ffff);" />
            <path d="M24 28 L18 14 C22 10, 32 10, 32 16 L32 28 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="1.8" />
            <path d="M40 28 L46 14 C42 10, 32 10, 32 16 L32 28 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="1.8" />

            <!-- Main Velvet Pouch Body -->
            <path d="M32 18 C20 18, 11 21, 11 38 C11 51, 18 58, 32 58 C46 58, 53 51, 53 38 C53 21, 44 18, 32 18 Z" fill="url(#g_css_b_${uid})" stroke="#000" stroke-width="2.2" stroke-linejoin="round" />

            <!-- Crease Shadows -->
            <path d="M11 38 Q18 42, 32 38" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2" />
            <path d="M32 18 Q23 35, 18 51" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="3" />
            <path d="M32 18 Q41 35, 46 51" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="3" transform="scale(-1, 1) translate(-64, 0)" />

            <!-- Glowing Cyber-Teal Runic Medallion -->
            <circle cx="32" cy="40" r="10" fill="none" stroke="#00ffff" stroke-dasharray="2.5 3" stroke-width="1.2" opacity="0.8" style="filter: drop-shadow(0 0 4px #00ffff);" />
            <circle cx="32" cy="40" r="7.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="1.5" />
            <polygon points="32,35.5 35.5,40 32,44.5 28.5,40" fill="#ffffff" stroke="#00ffff" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #00ffff);" />

            <!-- Gold Cinch Band & Strings -->
            <path d="M22 28 Q32 31.5, 42 28" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="3.5" stroke-linecap="round" />
            <path d="M24 29 Q32 32, 40 29" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round" />
            <circle cx="32" cy="29.2" r="3.2" fill="#ffd700" stroke="#000" stroke-width="1.5" />
            <path d="M30 30 Q24 40, 18 43" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="18" cy="43" r="1.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="0.8" />
            <path d="M34 30 Q40 40, 46 43" fill="none" stroke="url(#g_css_g_${uid})" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="46" cy="43" r="1.5" fill="url(#g_css_g_${uid})" stroke="#000" stroke-width="0.8" />
          `;
    },
    monster_card_sack(uid) {
      return `
            <defs>
              <linearGradient id="g_mcs_b_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ff007f"/>
                <stop offset="50%" stop-color="#df9ffb" />
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
              <linearGradient id="g_mcs_g_${uid}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffeaa7" />
                <stop offset="100%" stop-color="#f1c40f" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="20" ry="3.5" fill="rgba(0,0,0,0.55)" />
            <!-- Foil Pack Base -->
            <rect x="12" y="8" width="40" height="48" rx="7" fill="url(#g_mcs_b_${uid})" stroke="#000" stroke-width="2.2" />
            <!-- Serrated Crimp Top -->
            <path d="M12 8 L18 14 L24 8 L30 14 L36 8 L42 14 L48 8 L52 8 L52 14 L12 14 Z" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Serrated Crimp Bottom -->
            <path d="M12 56 L18 50 L24 56 L30 50 L36 56 L42 50 L48 56 L52 56 L52 50 L12 50 Z" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.2" />
            <!-- Holographic Card Frame overlay -->
            <rect x="17" y="18" width="30" height="28" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.35" />
            <!-- Glowing central card symbol -->
            <circle cx="32" cy="32" r="9" fill="url(#g_mcs_g_${uid})" stroke="#000" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #f1c40f);" />
            <path d="M32 27 L32 37 M27 32 L37 32" stroke="#111" stroke-width="2" stroke-linecap="round" />
            <path d="M17 18 L24 18 M17 18 L17 25" stroke="#00d2ff" stroke-width="2" opacity="0.8" />
            <path d="M47 46 L40 46 M47 46 L47 39" stroke="#00d2ff" stroke-width="2" opacity="0.8" />
          `;
    },
  },

  // Centralized configurations of unique artifacts
  artifacts: {
    frenzy(uid) {
      return `
            <defs>
              <!-- Crystal Fiery Gradient -->
              <linearGradient id="g_fz_cryst_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#ff6b6b"/>
                <stop offset="40%" stop-color="#e74c3c"/>
                <stop offset="80%" stop-color="#900c3f"/>
                <stop offset="100%" stop-color="#4a000d"/>
              </linearGradient>
              <!-- Iron Bracket Metal Gradient -->
              <linearGradient id="g_fz_iron_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#718096"/>
                <stop offset="50%" stop-color="#4a5568"/>
                <stop offset="100%" stop-color="#1a202c"/>
              </linearGradient>
              <!-- Core Flare Radial Glow -->
              <radialGradient id="g_fz_glow_${uid}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="45%" stop-color="#ff3366"/>
                <stop offset="100%" stop-color="#ff3366" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Drop Shadow Frame -->
            <rect x="3" y="3" width="26" height="26" rx="5" fill="#080005" stroke="#05070a" stroke-width="1.8"/>

            <!-- Fiery Core Ambient Backglow -->
            <circle cx="16" cy="16" r="10" fill="url(#g_fz_glow_${uid})" opacity="0.85"/>

            <!-- Jagged Crystal Shard Facets (Dark Shadow Left) -->
            <polygon points="16,4 8,15 12,28 16,24" fill="#660014" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>

            <!-- Jagged Crystal Shard Facets (Bright Light Right) -->
            <polygon points="16,4 24,15 20,28 16,24" fill="url(#g_fz_cryst_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>

            <!-- Crystal Specular Gleam Facet Overlay -->
            <polygon points="16,4 22,14 17,23 16,22" fill="#ffffff" opacity="0.4"/>

            <!-- Lightning/Frenzy Core Fissure -->
            <path d="M16 6 L13 14 L18 17 L15 26" stroke="#f1c40f" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 6 L13 14 L18 17 L15 26" stroke="#ffffff" stroke-width="0.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Iron Binding Brackets (Top & Bottom Collars) -->
            <path d="M6 13 L26 13 L24 16 L8 16 Z" fill="url(#g_fz_iron_${uid})" stroke="#05070a" stroke-width="1" stroke-linejoin="round"/>
            <path d="M8 21 L24 21 L26 24 L6 24 Z" fill="url(#g_fz_iron_${uid})" stroke="#05070a" stroke-width="1" stroke-linejoin="round"/>

            <!-- Bracket Gold Rivets -->
            <circle cx="9" cy="14.5" r="0.8" fill="#f1c40f" stroke="#05070a" stroke-width="0.4"/>
            <circle cx="23" cy="14.5" r="0.8" fill="#f1c40f" stroke="#05070a" stroke-width="0.4"/>
            <circle cx="9" cy="22.5" r="0.8" fill="#f1c40f" stroke="#05070a" stroke-width="0.4"/>
            <circle cx="23" cy="22.5" r="0.8" fill="#f1c40f" stroke="#05070a" stroke-width="0.4"/>

            <!-- Floating Spark/Ember Nodes -->
            <circle cx="6" cy="8" r="0.7" fill="#f1c40f"/>
            <circle cx="26" cy="9" r="0.6" fill="#ff3366"/>
            <circle cx="5" cy="22" r="0.5" fill="#ff3366"/>
            <circle cx="27" cy="20" r="0.7" fill="#f1c40f"/>
          `;
    },
    vampirism(uid) {
      return `
            <defs>
              <!-- Silver Goblet Light Gradient -->
              <linearGradient id="g_vp_silver_l_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#f8fafc"/>
                <stop offset="50%" stop-color="#cbd5e1"/>
                <stop offset="100%" stop-color="#64748b"/>
              </linearGradient>
              <!-- Silver Goblet Shadow Gradient -->
              <linearGradient id="g_vp_silver_d_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#475569"/>
                <stop offset="100%" stop-color="#1e293b"/>
              </linearGradient>
              <!-- Sanguine Liquid Radial Glow -->
              <radialGradient id="g_vp_liquid_${uid}" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#ff3355"/>
                <stop offset="55%" stop-color="#c0392b"/>
                <stop offset="100%" stop-color="#4a000d"/>
              </radialGradient>
              <!-- Gold Rim Gradient -->
              <linearGradient id="g_vp_gold_${uid}" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffeaa7"/>
                <stop offset="50%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
            </defs>

            <!-- Goblet Shadow Base -->
            <ellipse cx="16" cy="29" rx="8" ry="2" fill="rgba(0,0,0,0.5)"/>

            <!-- Bat Wing Left Filigree (Shadow side) -->
            <path d="M8 8 C3 7, 2 12, 6 16 C3 18, 5 22, 10 20 Z" fill="url(#g_vp_silver_d_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>

            <!-- Bat Wing Right Filigree (Highlight side) -->
            <path d="M24 8 C29 7, 30 12, 26 16 C29 18, 27 22, 22 20 Z" fill="url(#g_vp_silver_l_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>

            <!-- Main Goblet Bowl (Shadow Left Side) -->
            <path d="M16 6 C10 6, 8 11, 8 18 C8 23, 12 26, 16 26 Z" fill="url(#g_vp_silver_d_${uid})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round"/>

            <!-- Main Goblet Bowl (Light Right Side) -->
            <path d="M16 6 C22 6, 24 11, 24 18 C24 23, 20 26, 16 26 Z" fill="url(#g_vp_silver_l_${uid})" stroke="#05070a" stroke-width="1.5" stroke-linejoin="round"/>

            <!-- Chalice Stem & Knop -->
            <rect x="14.5" y="25" width="3" height="4" fill="url(#g_vp_silver_d_${uid})" stroke="#05070a" stroke-width="1"/>
            <circle cx="16" cy="26" r="1.8" fill="url(#g_vp_gold_${uid})" stroke="#05070a" stroke-width="0.8"/>

            <!-- Chalice Flared Base -->
            <path d="M11 29 L21 29 L23 31 L9 31 Z" fill="url(#g_vp_silver_l_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>
            <line x1="9" y1="31" x2="23" y2="31" stroke="url(#g_vp_gold_${uid})" stroke-width="1"/>

            <!-- Inner Glowing Sanguine Blood Pool -->
            <ellipse cx="16" cy="11" rx="7" ry="4" fill="url(#g_vp_liquid_${uid})" stroke="#05070a" stroke-width="1"/>
            <ellipse cx="16" cy="11" rx="5" ry="2.5" fill="none" stroke="#ff3355" stroke-width="0.8" opacity="0.7"/>

            <!-- Specular Liquid Highlight Arc -->
            <path d="M11 11 C12 9, 15 8, 18 9" stroke="#ffffff" stroke-width="0.8" fill="none" opacity="0.75" stroke-linecap="round"/>

            <!-- Gilded Outer Chalice Lip Trim -->
            <ellipse cx="16" cy="6" rx="8" ry="1.8" fill="none" stroke="url(#g_vp_gold_${uid})" stroke-width="1.5"/>

            <!-- Sanguine Drip / Ember Drops -->
            <circle cx="16" cy="14" r="0.8" fill="#ffffff"/>
            <circle cx="13" cy="18" r="0.6" fill="#ff3355"/>
            <circle cx="16" cy="22" r="0.5" fill="#ff3355"/>
          `;
    },
    gold_hoard(uid) {
      return `
            <defs>
              <!-- Polished Gold Light Gradient -->
              <linearGradient id="g_gh_gold_l_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#fff275"/>
                <stop offset="45%" stop-color="#f1c40f"/>
                <stop offset="85%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#8a6d1c"/>
              </linearGradient>
              <!-- Polished Gold Shadow Gradient -->
              <linearGradient id="g_gh_gold_d_${uid}" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#d4af37"/>
                <stop offset="100%" stop-color="#5a4504"/>
              </linearGradient>
              <!-- Amber Gemstone Radial Glow -->
              <radialGradient id="g_gh_gem_${uid}" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="50%" stop-color="#f39c12"/>
                <stop offset="100%" stop-color="#7e3800"/>
              </radialGradient>
              <!-- Ambient Gold Glow -->
              <radialGradient id="g_gh_glow_${uid}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffd700" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#ffd700" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Ambient Backglow -->
            <circle cx="16" cy="16" r="11" fill="url(#g_gh_glow_${uid})"/>

            <!-- Pedestal Base (Shadow & Light facets) -->
            <path d="M9 28 L23 28 L25 30.5 L7 30.5 Z" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>
            <rect x="11" y="26" width="10" height="2" fill="url(#g_gh_gold_d_${uid})" stroke="#05070a" stroke-width="0.8"/>

            <!-- Central Vertical Column -->
            <rect x="14.8" y="10" width="2.4" height="16" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1"/>
            <circle cx="16" cy="18" r="1.5" fill="url(#g_gh_gold_d_${uid})" stroke="#05070a" stroke-width="0.6"/>

            <!-- Balanced Crossbar Beam -->
            <path d="M5 11 Q16 8, 27 11 L26.5 12.5 Q16 10, 5.5 12.5 Z" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1.2" stroke-linejoin="round"/>

            <!-- Top Finial Pivot Ring & Gem -->
            <circle cx="16" cy="6" r="2.8" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1"/>
            <circle cx="16" cy="6" r="1.5" fill="url(#g_gh_gem_${uid})" stroke="#05070a" stroke-width="0.5"/>
            <circle cx="15.6" cy="5.6" r="0.4" fill="#ffffff"/>

            <!-- Left Scale Pan & Suspension Chains -->
            <line x1="6" y1="12" x2="4" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
            <line x1="6" y1="12" x2="10" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
            <!-- Left Pan Body -->
            <path d="M3 20 C3 23, 11 23, 11 20 Z" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1"/>
            <!-- Left Pan Stacked Gold Coins -->
            <ellipse cx="7" cy="19" rx="2.5" ry="1" fill="#f1c40f" stroke="#05070a" stroke-width="0.5"/>
            <ellipse cx="7" cy="17.8" rx="2.5" ry="1" fill="#ffeaa7" stroke="#05070a" stroke-width="0.5"/>

            <!-- Right Scale Pan & Suspension Chains -->
            <line x1="26" y1="12" x2="22" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
            <line x1="26" y1="12" x2="28" y2="20" stroke="#cbd5e1" stroke-width="0.8"/>
            <!-- Right Pan Body -->
            <path d="M21 20 C21 23, 29 23, 29 20 Z" fill="url(#g_gh_gold_l_${uid})" stroke="#05070a" stroke-width="1"/>
            <!-- Right Pan Stacked Gold Coins -->
            <ellipse cx="25" cy="19" rx="2.5" ry="1" fill="#f1c40f" stroke="#05070a" stroke-width="0.5"/>
            <ellipse cx="25" cy="17.8" rx="2.5" ry="1" fill="#ffeaa7" stroke="#05070a" stroke-width="0.5"/>
            <ellipse cx="25" cy="16.6" rx="2.5" ry="1" fill="#ffffff" stroke="#05070a" stroke-width="0.5"/>

            <!-- Floating Gold Sparkles -->
            <circle cx="4" cy="15" r="0.6" fill="#ffffff"/>
            <circle cx="28" cy="14" r="0.6" fill="#ffffff"/>
            <circle cx="16" cy="23" r="0.7" fill="#ffd700"/>
          `;
    },
    magic_find(uid) {
      return `
        <defs>
          <linearGradient id="g_mf_gd_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff1a8"/><stop offset="100%" stop-color="#d4af37"/></linearGradient>
          <linearGradient id="g_mf_em_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient>
        </defs>
        <ellipse cx="16" cy="18" rx="8" ry="10" fill="url(#g_mf_gd_${uid})" stroke="#111" stroke-width="2"/>
        <circle cx="16" cy="10" r="4.2" fill="url(#g_mf_gd_${uid})" stroke="#111" stroke-width="1.8"/>
        <line x1="16" y1="10" x2="16" y2="28" stroke="#111" stroke-width="1.8"/>
        <rect x="13.2" y="13.5" width="5.6" height="8.5" rx="1.5" fill="url(#g_mf_em_${uid})" stroke="#111" stroke-width="1"/>
        <path d="M8 14 Q3 15, 6 9.5 M24 14 Q29 15, 26 9.5 M7 21 Q3 23, 5 27 M25 21 Q29 23, 27 27" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      `;
    },
    move_speed(uid) {
      return `
        <defs>
          <linearGradient id="g_ms_s_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#7f8c8d"/></linearGradient>
          <linearGradient id="g_ms_w_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#81ecec"/><stop offset="100%" stop-color="#0984e3"/></linearGradient>
        </defs>
        <path d="M10 24 L15 9 L24 15 L19 26 Z" fill="url(#g_ms_s_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M5 14 C5 10, 11 8, 14 15 C11 15, 7 13, 5 14 Z" fill="url(#g_ms_w_${uid})" stroke="#111" stroke-width="1.2"/>
        <path d="M3 18 C3 14, 9 12, 12 19 C9 19, 5 17, 3 18 Z" fill="url(#g_ms_w_${uid})" stroke="#111" stroke-width="1.2"/>
      `;
    },
    defense(uid) {
      return `
        <defs><linearGradient id="g_df_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#4ba3e3"/><stop offset="100%" stop-color="#1c304a"/></linearGradient></defs>
        <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#g_df_${uid})" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M16 7 L23 11 L20 20 L16 25 L12 20 L9 11 Z" fill="none" stroke="#fff" opacity="0.3" stroke-width="1.8"/>
        <circle cx="16" cy="15" r="3.2" fill="#fff" style="filter: drop-shadow(0 0 4px #fff);"/>
      `;
    },
    parry_strike(uid) {
      return `
        <defs><linearGradient id="g_ps_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#555555"/></linearGradient></defs>
        <path d="M7 10 L16 5 L25 10 L23 22 L16 28 L9 22 Z" fill="url(#g_ps_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <line x1="8" y1="14" x2="24" y2="14" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 10 L16 22" stroke="#111" stroke-width="3" stroke-linecap="round"/><path d="M16 10 L16 22" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
      `;
    },
    echo_strike(uid) {
      return `
        <defs><linearGradient id="g_es_b_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#020d1a"/><stop offset="100%" stop-color="#00ffcc"/></linearGradient></defs>
        <path d="M4 28 L24 8 L28 12 L8 32 Z" fill="url(#g_es_b_${uid})" stroke="rgba(0, 255, 204, 0.4)" stroke-width="1.5" style="opacity:0.45;"/>
        <path d="M8 24 L24 8 L28 12 L12 28 Z" fill="url(#g_es_b_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M12 28 L28 12" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
      `;
    },
    idle_spd(uid) {
      return `
        <defs><linearGradient id="g_is_${uid}" x1="0%" y1="0%" x2="1" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#07090c"/></linearGradient></defs>
        <circle cx="16" cy="16" r="11" fill="url(#g_is_${uid})" stroke="#ffd700" stroke-width="2.2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#e67e22" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="16" y1="16" x2="16" y2="9.5" stroke="#f1c40f" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="21.5" y2="16" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
      `;
    },
    active_spd(uid) {
      return `
        <defs><linearGradient id="g_as_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff9a6"/><stop offset="50%" stop-color="#f39c12"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs>
        <path d="M16 2 L20 10 L28 10 L22 16 L25 24 L16 19 L7 24 L10 16 L4 10 L12 10 Z" fill="url(#g_as_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="13.5" r="4.2" fill="#fff" opacity="0.3"/>
      `;
    },
    dodge_buff(uid) {
      return `
        <defs><linearGradient id="g_db_${uid}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#145a32"/></linearGradient></defs>
        <rect x="11.5" y="4" width="9" height="22" rx="4.5" fill="url(#g_db_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="13.5" y="7" width="5" height="16" fill="#fff" opacity="0.25"/>
        <line x1="10" y1="12" x2="22" y2="12" stroke="#111" stroke-width="2"/><line x1="10" y1="18" x2="22" y2="18" stroke="#111" stroke-width="2"/>
        <line x1="16" y1="26" x2="16" y2="29" stroke="#bdc3c7" stroke-width="2.5" stroke-linecap="round"/>
      `;
    },
    extend_buffs(uid) {
      return `
        <defs><linearGradient id="g_eb_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#d35400"/></linearGradient></defs>
        <path d="M7 6 L25 6 L16 16 Z" fill="url(#g_eb_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M16 16 L7 26 L25 26 Z" fill="url(#g_eb_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <circle cx="16" cy="11" r="2.2" fill="#fff" style="filter: drop-shadow(0 0 3px #fff);"/>
        <path d="M13 23 Q16 18, 19 23 Z" fill="#fff" opacity="0.8"/>
      `;
    },
    bag_space(uid) {
      return `
        <defs><linearGradient id="g_bs_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a29bfe"/><stop offset="100%" stop-color="#6c5ce7"/></linearGradient></defs>
        <rect x="6.5" y="11" width="19" height="15" rx="3.5" fill="url(#g_bs_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M11.5 11 C11.5 6, 20.5 6, 20.5 11" fill="none" stroke="#111" stroke-width="2.2"/>
        <circle cx="16" cy="18.5" r="3" fill="#111" stroke="#fff" stroke-width="1.2"/>
      `;
    },
    second_wind(uid) {
      return `
        <defs><linearGradient id="g_sw_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff7675"/><stop offset="100%" stop-color="#d63031"/></linearGradient></defs>
        <circle cx="16" cy="10" r="5" fill="none" stroke="url(#g_sw_${uid})" stroke-width="2.5" style="filter: drop-shadow(0 0 3px #ff3300);"/>
        <path d="M11 15.5 L21 15.5 L16 28.5 Z" fill="url(#g_sw_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
      `;
    },
    golem_stance(uid) {
      return `
        <defs><linearGradient id="g_gs_${uid}" x1="0%" y1="0%" x2="1" y2="1"><stop offset="0%" stop-color="#95a5a6"/><stop offset="100%" stop-color="#34495e"/></linearGradient></defs>
        <polygon points="16,3 27,10.5 27,23.5 16,29 5,23.5 5,10.5" fill="url(#g_gs_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <path d="M16 7 L23 11 L23 19 M9 19 L9 11 L16 7" fill="none" stroke="#e74c3c" stroke-width="1.8" style="filter: drop-shadow(0 0 2px #ff2200);"/>
      `;
    },
    fairy_wealth(uid) {
      return `
        <defs><linearGradient id="g_fw_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff9ff3"/><stop offset="100%" stop-color="#f368e0"/></linearGradient></defs>
        <circle cx="16" cy="16" r="10" fill="none" stroke="url(#g_fw_${uid})" stroke-width="2.8"/>
        <path d="M12 9 Q16 3, 20 9 M9 16 Q16 23, 23 16" fill="none" stroke="#fff" opacity="0.65" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="3.2" fill="#ffd700" stroke="#111" stroke-width="1.2"/>
      `;
    },
    void_pull(uid) {
      return `
        <circle cx="16" cy="16" r="11" fill="#0c001a" stroke="#8e44ad" stroke-width="2.2" style="filter: drop-shadow(0 0 5px #8e44ad);"/>
        <circle cx="16" cy="16" r="5" fill="#ff007f" style="filter: drop-shadow(0 0 4px #ff007f);"/>
      `;
    },
    titan_grip(uid) {
      return `
        <defs><linearGradient id="g_tg_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#bdc3c7"/><stop offset="100%" stop-color="#2c3e50"/></linearGradient></defs>
        <rect x="8.5" y="11" width="15" height="11.5" rx="3" fill="url(#g_tg_${uid})" stroke="#111" stroke-width="1.8"/>
        <path d="M11 11 C11 5, 21 5, 21 11" fill="none" stroke="#ffd700" stroke-width="2.2"/>
        <circle cx="11.5" cy="16.5" r="1" fill="#fff"/><circle cx="20.5" cy="16.5" r="1" fill="#fff"/>
      `;
    },
    alchemist_alembic(uid) {
      return `
        <defs><linearGradient id="g_aa_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#1abc9c"/><stop offset="100%" stop-color="#a3fd83"/></linearGradient></defs>
        <circle cx="16" cy="19.5" r="8.2" fill="url(#g_aa_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="14.5" y="6.5" width="3" height="6.5" fill="#bdc3c7" stroke="#111" stroke-width="1.2"/>
        <path d="M12 21 C12 21, 14 24, 16 24 C18 24, 20 21, 20 21" fill="none" stroke="#fff" opacity="0.4" stroke-width="1.2"/>
      `;
    },
    philosopher_catalyst(uid) {
      return `
        <defs><linearGradient id="g_pc_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#27ae60"/></linearGradient></defs>
        <polygon points="16,3.5 27.5,25 4.5,25" fill="url(#g_pc_${uid})" stroke="#111" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="16" cy="17.8" r="4.2" fill="#fff" stroke="#111" stroke-width="1.2" style="filter: drop-shadow(0 0 3px #fff);"/>
      `;
    },
    cauldron_eternity(uid) {
      return `
        <defs><linearGradient id="g_ce_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a045c"/><stop offset="100%" stop-color="#9b59b6"/></linearGradient></defs>
        <path d="M8 10.5 C8 10.5, 4 23, 16 25.5 C28 23, 24 10.5, 24 10.5 Z" fill="#1b212c" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="16" cy="10.5" rx="10" ry="2.8" fill="url(#g_ce_${uid})" stroke="#111" stroke-width="1.8"/>
        <circle cx="12" cy="10" r="1.2" fill="#fff" opacity="0.6"/><circle cx="18" cy="11" r="1.5" fill="#fff" opacity="0.8"/>
      `;
    },
  },

  // Centralized configurations of unique weapons
  uniques: {
    staff(uid) {
      return `
        <defs><linearGradient id="g_un_st_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#e67e22"/></linearGradient></defs>
        <line x1="6" y1="26" x2="26" y2="6" stroke="#853c00" stroke-width="3" stroke-linecap="round"/>
        <line x1="6" y1="26" x2="26" y2="6" stroke="url(#g_un_st_${uid})" stroke-width="1" stroke-linecap="round" style="opacity:0.4;"/>
        <circle cx="26" cy="6" r="5.2" fill="#e74c3c" stroke="#111" stroke-width="1.5" style="filter: drop-shadow(0 0 4px #e74c3c);"/><circle cx="25" cy="5" r="1.2" fill="#fff"/>
      `;
    },
    sword(uid) {
      return `
        <defs><linearGradient id="g_un_sw_${uid}" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#3a0202"/><stop offset="100%" stop-color="#ff0000"/></linearGradient></defs>
        <path d="M5 27 L25 7 L27 9 L7 29 Z" fill="url(#g_un_sw_${uid})" stroke="#111" stroke-width="1.8"/>
        <line x1="8" y1="24" x2="24" y2="8" stroke="#ff3333" stroke-width="1"/>
        <rect x="3.5" y="25" width="7" height="3.5" rx="0.5" fill="#f1c40f" stroke="#111" stroke-width="1.2" transform="rotate(45 7 27)"/>
      `;
    },
    singularity(uid) {
      return `
            <defs>
              <linearGradient id="g_un_sg_blade_${uid}" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stop-color="#090114"/>
                <stop offset="30%" stop-color="#1c0a35"/>
                <stop offset="70%" stop-color="#8e44ad"/>
                <stop offset="100%" stop-color="#e84393"/>
              </linearGradient>
              <linearGradient id="g_un_sg_edge_${uid}" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="#d1a0fc"/>
                <stop offset="100%" stop-color="#00d2ff"/>
              </linearGradient>
              <radialGradient id="g_un_sg_core_${uid}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="35%" stop-color="#ff007f"/>
                <stop offset="70%" stop-color="#8e44ad"/>
                <stop offset="100%" stop-color="rgba(142, 68, 173, 0)"/>
              </radialGradient>
            </defs>
            <!-- Background space-warp grid details -->
            <path d="M10 26 Q17 21, 21 15" fill="none" stroke="#e84393" stroke-width="0.6" opacity="0.65"/>
            <path d="M12 28 Q19 23, 23 17" fill="none" stroke="#00d2ff" stroke-width="0.6" opacity="0.55"/>
            <!-- Main Blade body -->
            <path d="M6 26 L23 9 L25 11 L8 28 Z" fill="url(#g_un_sg_blade_${uid})" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/>
            <!-- Sharp reflective cutting edge -->
            <path d="M23 9 L26 6 L25 5 L22 8 Z" fill="url(#g_un_sg_edge_${uid})" stroke="#111" stroke-width="0.8"/>
            <!-- Middle Bevel Ridge line -->
            <line x1="7" y1="27" x2="24" y2="10" stroke="#111" stroke-width="0.8"/>
            <!-- Core glowing fissure -->
            <line x1="8" y1="25" x2="21" y2="12" stroke="#ff007f" stroke-width="1" stroke-linecap="round" opacity="0.8"/>
            <!-- Guard at bottom-left -->
            <path d="M3 25 Q7 23, 11 29 L9 31 Q5 25, 3 25 Z" fill="#b7950b" stroke="#111" stroke-width="1.2"/>
            <!-- Grip -->
            <rect x="2" y="28" width="3" height="6" transform="rotate(-45 3.5 31)" fill="#4d2711" stroke="#111" stroke-width="1"/>
            <!-- Pommel -->
            <circle cx="1" cy="33.5" r="1.5" fill="#f1c40f" stroke="#111" stroke-width="0.8"/>
            <!-- Gravitational lensing accretion ring at tip -->
            <ellipse cx="26" cy="6" rx="6" ry="2.2" transform="rotate(-30 26 6)" fill="none" stroke="#ff007f" stroke-width="1.2"/>
            <ellipse cx="26" cy="6" rx="6" ry="2.2" transform="rotate(-30 26 6)" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.8"/>
            <!-- Inner black hole core -->
            <circle cx="26" cy="6" r="2.2" fill="#000000" stroke="#ff007f" stroke-width="0.8"/>
          `;
    },
    maelstrom(uid) {
      return `
        <defs><linearGradient id="g_un_ml_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#55efc4"/><stop offset="100%" stop-color="#00b894"/></linearGradient></defs>
        <line x1="6" y1="26" x2="26" y2="6" stroke="#2c3e50" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M22 10 Q28 6, 28 4 Q25 4, 18 8 Z" fill="url(#g_un_ml_${uid})" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>
      `;
    },
    aegis(uid) {
      return `
        <defs><linearGradient id="g_un_ag_${uid}" x1="0" y1="0" x2="0" y2="100%"><stop offset="0%" stop-color="#0984e3"/><stop offset="100%" stop-color="#1b1c1e"/></linearGradient></defs>
        <path d="M16 3 L27 9 L23 23 L16 29 L9 23 L5 9 Z" fill="url(#g_un_ag_${uid})" stroke="#3498db" stroke-width="2" stroke-linejoin="round" style="filter: drop-shadow(0 0 3px #3498db);"/>
        <circle cx="16" cy="16" r="3.2" fill="#fff" opacity="0.8"/>
      `;
    },
    watch(uid) {
      return `
        <defs><linearGradient id="g_un_wt_${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
        <circle cx="16" cy="16" r="10" fill="#221c03" stroke="#f1c40f" stroke-width="1.8"/>
        <circle cx="16" cy="16" r="7.5" fill="url(#g_un_wt_${uid})" stroke="#111" stroke-width="1"/>
        <line x1="16" y1="16" x2="16" y2="10.5" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="20" y2="16" stroke="#c0392b" stroke-width="1.2" stroke-linecap="round"/>
      `;
    },
    chronicle(uid) {
      return `
        <defs><linearGradient id="g_un_ch_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdf6e2"/><stop offset="100%" stop-color="#d5dbdb"/></linearGradient></defs>
        <rect x="7.5" y="5" width="17" height="22" rx="2.5" fill="#2c1d11" stroke="#ffd700" stroke-width="1.8" style="filter: drop-shadow(0 0 3px #f1c40f);"/>
        <rect x="11.5" y="8" width="9" height="16" fill="url(#g_un_ch_${uid})" stroke="#111" stroke-width="1"/>
      `;
    },
    warpcore(uid) {
      return `
        <defs><linearGradient id="g_un_wc_${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#002b2b"/><stop offset="100%" stop-color="#1abc9c"/></linearGradient></defs>
        <path d="M8 23 L14 8 L22 14 L16 27 Z" fill="url(#g_un_wc_${uid})" stroke="#111" stroke-width="1.8"/>
        <rect x="10" y="16" width="3" height="5" rx="0.5" fill="#fff" style="filter: drop-shadow(0 0 3px #00ffcc);"/>
      `;
    },
    tempest(uid) {
      return `
            <defs><linearGradient id="g_un_tp_${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a0f0ff"/><stop offset="100%" stop-color="#0080b0"/></linearGradient></defs>
            <path d="M6 21 L10 7 L14 15 L16 4 L18 15 L22 7 L26 21 Z" fill="url(#g_un_tp_${uid})" stroke="#111" stroke-width="1.8" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px #00d2ff);"/>
            <rect x="6" y="21" width="20" height="4" fill="url(#g_un_tp_${uid})" stroke="#111" stroke-width="1.8"/>
          `;
    },
  },
};

window.getAchievementBadgeHtml = function (ach, unlocked, size = 32) {
  let id = ach.id;
  let isSingle = !!ach.isSingleTier;

  let category = "";
  let tierNum = 0;

  if (isSingle) {
    category = "sing";
  } else {
    let lastUnderscore = id.lastIndexOf("_");
    if (lastUnderscore !== -1) {
      category = id.substring(0, lastUnderscore);
      tierNum = parseInt(id.substring(lastUnderscore + 1), 10);
    } else {
      category = id;
    }
  }

  let iconSvg = "";
  let glowColor = unlocked ? "#f1c40f" : "#444";
  let bgGradient = unlocked
    ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
    : "linear-gradient(135deg, #151515 0%, #0d0d0d 100%)";

  switch (category) {
    case "slayer":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linecap="round" fill="none">
              <path d="M6 26 L26 6" />
              <path d="M26 26 L6 6" />
              <path d="M12 9 L23 20" />
              <path d="M20 9 L9 20" />
            </g>
          `;
      break;
    case "hoarder":
    case "drop_g":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <ellipse cx="16" cy="22" rx="8" ry="3" />
              <ellipse cx="16" cy="16" rx="8" ry="3" />
              <ellipse cx="16" cy="10" rx="8" ry="3" />
              <path d="M8 10 V22 M24 10 V22" />
            </g>
          `;
      break;
    case "stage":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" fill="none">
              <circle cx="16" cy="16" r="10" />
              <path d="M16 6 V26 M6 16 H26" stroke-dasharray="2 2" />
              <polygon points="16,10 19,16 16,14 13,16" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "level":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M6 24 L10 10 L16 16 L22 10 L26 24 Z" />
              <circle cx="16" cy="24" r="1.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "forge":
    case "refo":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M10 20 L22 10" />
              <path d="M6 24 L10 20 L12 22 Z" fill="${unlocked ? glowColor : "none"}" />
              <rect x="18" y="4" width="8" height="8" rx="1.5" transform="rotate(45 22 8)" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "enchant":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="8" y="6" width="16" height="20" rx="1" />
              <line x1="12" y1="12" x2="20" y2="12" />
              <line x1="12" y1="16" x2="18" y2="16" />
              <circle cx="16" cy="16" r="2" stroke-dasharray="2 2" />
            </g>
          `;
      break;
    case "rift":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" fill="none">
              <circle cx="16" cy="16" r="10" stroke-dasharray="4 2" />
              <circle cx="16" cy="16" r="5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "prestige":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M16 28 C10 28, 6 22, 16 12 C26 22, 22 28, 16 28 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
              <path d="M10 18 Q16 12, 22 18" />
            </g>
          `;
      break;
    case "d_eq":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M8 8 Q16 6, 24 8 Q23 18, 16 25 Q9 18, 8 8 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
              <path d="M16 5 L16 25" />
            </g>
          `;
      break;
    case "d_go":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="6" y="10" width="20" height="16" rx="2" />
              <path d="M6 16 H26" />
              <circle cx="16" cy="13" r="1.5" />
            </g>
          `;
      break;
    case "d_ma":
    case "buff":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M12 6 H18 M13 6 V12 L8 22 A2 2 0 0 0 10 25 H22 A2 2 0 0 0 24 22 L19 12 V6" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
            </g>
          `;
      break;
    case "d_cr":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <polygon points="6,24 9,14 16,19 23,14 26,24" />
              <line x1="6" y1="24" x2="26" y2="24" />
            </g>
          `;
      break;
    case "hit":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M16 4 L19 12 L27 10 L21 16 L26 24 L16 19 L6 24 L11 16 L5 10 L13 12 Z" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.15" />
            </g>
          `;
      break;
    case "fairy":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M16 16 C10 16, 6 12, 11 8 C16 4, 16 16, 16 16 Z" />
              <path d="M16 16 C22 16, 26 12, 21 8 C16 4, 16 16, 16 16 Z" />
              <circle cx="16" cy="16" r="2.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "death":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <rect x="10" y="8" width="12" height="12" rx="4" />
              <rect x="12" y="18" width="8" height="6" rx="1" />
              <circle cx="13" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </g>
          `;
      break;
    case "salvage":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <circle cx="16" cy="16" r="8" />
              <path d="M12 12 H20 M12 20 H20 M16 12 V20" />
            </g>
          `;
      break;
    case "f_spd":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M19 4 L9 14 H16 L13 22 L23 12 H16 Z" />
            </g>
          `;
      break;
    case "defl":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="2" stroke-linejoin="round" fill="none">
              <path d="M8 6 H24 L21 21 L16 26 L11 21 Z" />
            </g>
          `;
      break;
    case "g_up":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <path d="M6 10 H26 V24 H6 Z M11 16 H15 V24 H11 Z" />
              <path d="M9 10 V6 M23 10 V6" />
            </g>
          `;
      break;
    case "rare_s":
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" fill="none">
              <circle cx="16" cy="16" r="9" />
              <circle cx="16" cy="16" r="5" />
              <circle cx="16" cy="16" r="1.5" fill="${unlocked ? glowColor : "none"}" />
            </g>
          `;
      break;
    case "sing":
    default:
      iconSvg = `
            <g stroke="${glowColor}" stroke-width="1.8" stroke-linejoin="round" fill="none">
              <polygon points="16,3 27,10.5 27,23.5 16,29 5,23.5 5,10.5" fill="${unlocked ? glowColor : "none"}" fill-opacity="0.1" />
              <circle cx="16" cy="16" r="5.5" />
            </g>
          `;
      break;
  }

  let romanNum = "";
  if (tierNum > 0) {
    const rom = [
      "",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
    ];
    romanNum = rom[tierNum] || tierNum.toString();
  }

  let romanOverlay = romanNum
    ? `<span style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              background: ${unlocked ? "#f1c40f" : "#222"};
              color: ${unlocked ? "#000" : "#888"};
              font-family: monospace;
              font-size: 8px;
              font-weight: 900;
              padding: 1px 3.5px;
              border-radius: 3px;
              border: 1px solid ${unlocked ? "#fff" : "#444"};
              box-shadow: ${unlocked ? "0 0 6px rgba(241,196,15,0.4)" : "none"};
              line-height: 1;
              z-index: 2;
            ">${romanNum}</span>`
    : "";

  return `
      <div style="position:relative; display:inline-block; width:${size}px; height:${size}px;">
        <div style="width:100%; height:100%; border-radius:6px; background:${bgGradient}; border:1.5px solid ${glowColor}; display:flex; align-items:center; justify-content:center; box-shadow:${unlocked ? "0 0 10px rgba(241,196,15,0.3)" : "none"};">
          <svg viewBox="0 0 32 32" width="80%" height="80%">
            ${iconSvg}
          </svg>
        </div>
        ${romanOverlay}
      </div>
    `;
};

window.getIconSvgData = function (itemOrName) {
  let innerSvg = "";
  let color = "#00d2ff";
  let viewBox = "0 0 32 32";
  let uid = 999;

  if (!itemOrName) return null;

  if (typeof itemOrName === "string") {
    let name = itemOrName;
    const matColors = {
      "Monster Soul": "#a0aec0",
      "Luminous Soul": "#ffb6c1",
      "Rare Scrap": "#3498db",
      "Magic Scrap": "#9b59b6",
      "Epic Scrap": "#e67e22",
      "Legendary Scrap": "#f1c40f",
      "Mythic Scrap": "#e74c3c",
      "Eridium Shard": "#8e44ad",
      "Gacha Key": "#f1c40f",
      "Glimmering Gachapon Key": "#00d2ff",
      "Ancient Core": "#e74c3c",
      "Overlord's Sigil": "#1abc9c",
      "Astral Essence": "#9b59b6",
      "Catalyst Core": "#2ecc71",
    };

    if (matColors[name]) {
      color = matColors[name];
    } else if (window.useDex && window.useDex[name]) {
      color = window.useDex[name].color || "#2ecc71";
    }

    if (window.AssetCatalog.materials && window.AssetCatalog.materials[name]) {
      innerSvg = window.AssetCatalog.materials[name](uid);
    } else if (
      name &&
      name.includes("Scrap") &&
      window.AssetCatalog.materials.Scrap
    ) {
      let stop1 = "#7f8c8d",
        stop2 = "#2c3e50";
      if (name === "Rare Scrap") {
        stop1 = "#5fa7e8";
        stop2 = "#3498db";
      } else if (name === "Magic Scrap") {
        stop1 = "#c397eb";
        stop2 = "#9b59b6";
      } else if (name === "Epic Scrap") {
        stop1 = "#f3b05a";
        stop2 = "#e67e22";
      } else if (name === "Legendary Scrap") {
        stop1 = "#fbe374";
        stop2 = "#f1c40f";
      } else if (name === "Mythic Scrap") {
        stop1 = "#f19086";
        stop2 = "#e74c3c";
      }
      innerSvg = window.AssetCatalog.materials.Scrap(uid, stop1, stop2);
    } else if (window.AssetCatalog.consumables) {
      if (
        name === "Cavern Sigil Sack" &&
        window.AssetCatalog.consumables.cavern_sigil_sack
      ) {
        innerSvg = window.AssetCatalog.consumables.cavern_sigil_sack(uid);
        viewBox = "0 0 64 64";
      } else if (
        name === "Monster Card Sack" &&
        window.AssetCatalog.consumables.monster_card_sack
      ) {
        innerSvg = window.AssetCatalog.consumables.monster_card_sack(uid);
        viewBox = "0 0 64 64";
      } else if (
        name &&
        (name.includes("Sack") || name.includes("Pouch")) &&
        window.AssetCatalog.consumables.sack
      ) {
        innerSvg = window.AssetCatalog.consumables.sack(uid, color);
        viewBox = "0 0 64 64";
      } else if (
        name &&
        (name.includes("Crate") || name.includes("Chest")) &&
        window.AssetCatalog.consumables.crate
      ) {
        innerSvg = window.AssetCatalog.consumables.crate(uid);
        viewBox = "0 0 64 64";
      } else if (
        name &&
        name.includes("Scroll") &&
        window.AssetCatalog.consumables.scroll
      ) {
        innerSvg = window.AssetCatalog.consumables.scroll(uid, color);
      } else if (
        name &&
        (name.includes("Elixir") || name.includes("Potion")) &&
        window.AssetCatalog.consumables.potion
      ) {
        innerSvg = window.AssetCatalog.consumables.potion(uid, color, name);
      }
    }
  } else {
    let item = itemOrName;
    uid = item.id || 999;
    color = window.getTierColor
      ? window.getTierColor(item.statsRolled)
      : "#00d2ff";

    if (item.type === "card" && window.AssetCatalog.genericEquipment.card) {
      let cardData = window.MONSTER_CARDS_DATA[item.cardKey];
      let setColors = {
        "Whispering Woods": "#2ecc71",
        "Mountain Peaks": "#3498db",
        "Inferno Depths": "#e74c3c",
        "Fungal Swamp": "#1abc9c",
        "Void Singularity": "#9b59b6",
        "Cosmic Wardens": "#f1c40f",
      };
      color = setColors[cardData.set] || "#ffd700";
      innerSvg = window.AssetCatalog.genericEquipment.card(uid, color);
    } else if (item.isUniqueStaff && window.AssetCatalog.uniques.staff)
      innerSvg = window.AssetCatalog.uniques.staff(uid);
    else if (item.isUniqueSword && window.AssetCatalog.uniques.sword)
      innerSvg = window.AssetCatalog.uniques.sword(uid);
    else if (
      item.isUniqueSingularity &&
      window.AssetCatalog.uniques.singularity
    )
      innerSvg = window.AssetCatalog.uniques.singularity(uid);
    else if (item.isUniqueMaelstrom && window.AssetCatalog.uniques.maelstrom)
      innerSvg = window.AssetCatalog.uniques.maelstrom(uid);
    else if (item.isUniqueAegis && window.AssetCatalog.uniques.aegis)
      innerSvg = window.AssetCatalog.uniques.aegis(uid);
    else if (item.isUniqueWatch && window.AssetCatalog.uniques.watch)
      innerSvg = window.AssetCatalog.uniques.watch(uid);
    else if (item.isUniqueChronicle && window.AssetCatalog.uniques.chronicle)
      innerSvg = window.AssetCatalog.uniques.chronicle(uid);
    else if (item.isUniqueWarpCore && window.AssetCatalog.uniques.warpcore)
      innerSvg = window.AssetCatalog.uniques.warpcore(uid);
    else if (item.isUniqueTempest && window.AssetCatalog.uniques.tempest)
      innerSvg = window.AssetCatalog.uniques.tempest(uid);
    else if (
      item.type === "artifact" &&
      item.trait &&
      window.AssetCatalog.artifacts[item.trait]
    ) {
      innerSvg = window.AssetCatalog.artifacts[item.trait](uid);
    }

    if (!innerSvg && window.AssetCatalog.genericEquipment) {
      let nounKey = (item.noun || "").toLowerCase().replace(/[\s-]/g, "_");
      let subKey = (item.subType || "").toLowerCase().replace(/[\s-]/g, "_");
      let typeKey = (item.type || "").toLowerCase().replace(/[\s-]/g, "_");

      if (nounKey && window.AssetCatalog.genericEquipment[nounKey]) {
        innerSvg = window.AssetCatalog.genericEquipment[nounKey](uid, color);
      } else if (subKey && window.AssetCatalog.genericEquipment[subKey]) {
        innerSvg = window.AssetCatalog.genericEquipment[subKey](uid, color);
      } else if (typeKey && window.AssetCatalog.genericEquipment[typeKey]) {
        innerSvg = window.AssetCatalog.genericEquipment[typeKey](uid, color);
      } else if (
        item.type === "subweapon" &&
        window.AssetCatalog.genericEquipment.shield
      ) {
        innerSvg = window.AssetCatalog.genericEquipment.shield(uid, color);
      } else {
        innerSvg = `<rect x="6" y="6" width="20" height="20" rx="3" fill="${color}" stroke="#000" stroke-width="1.8" />`;
      }
    }
  }

  if (!innerSvg) return null;
  return { innerSvg, color, viewBox };
};

window.canvasIconImageCache = window.canvasIconImageCache || {};

window.getCanvasIconImage = function (itemOrName) {
  if (!itemOrName) return null;
  let key =
    typeof itemOrName === "string"
      ? itemOrName
      : `${itemOrName.type}_${itemOrName.statsRolled || 0}_${itemOrName.name}_${itemOrName.isUniqueStaff ? "staff" : ""}_${itemOrName.isUniqueSword ? "sword" : ""}_${itemOrName.isUniqueSingularity ? "sing" : ""}_${itemOrName.isUniqueMaelstrom ? "mael" : ""}_${itemOrName.isUniqueAegis ? "aegis" : ""}_${itemOrName.isUniqueWatch ? "watch" : ""}_${itemOrName.isUniqueChronicle ? "chron" : ""}_${itemOrName.isUniqueWarpCore ? "warp" : ""}_${itemOrName.isUniqueTempest ? "temp" : ""}`;

  if (window.canvasIconImageCache[key]) {
    return window.canvasIconImageCache[key];
  }

  let data = window.getIconSvgData(itemOrName);
  if (!data) return null;

  let rgb = window.hexToRgbValues
    ? window.hexToRgbValues(data.color)
    : "170, 170, 170";
  let bg = `rgba(${rgb}, 0.15)`;

  let is64 = data.viewBox === "0 0 64 64";
  let boxSize = is64 ? 64 : 32;
  let rx = is64 ? 6 : 4;
  let strokeW = is64 ? 2.5 : 1.5;

  let svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" width="${boxSize}" height="${boxSize}">
      <rect width="${boxSize}" height="${boxSize}" rx="${rx}" fill="${bg}" stroke="${data.color}" stroke-width="${strokeW}" />
      ${data.innerSvg}
    </svg>
  `;

  let img = new Image();
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);

  window.canvasIconImageCache[key] = img;
  return img;
};

window.canvasCutoutImageCache = window.canvasCutoutImageCache || {};

window.getCanvasCutoutImage = function (itemOrName) {
  if (!itemOrName) return null;
  let key =
    typeof itemOrName === "string"
      ? itemOrName
      : `${itemOrName.type}_${itemOrName.statsRolled || 0}_${itemOrName.name}_${itemOrName.isUniqueStaff ? "staff" : ""}_${itemOrName.isUniqueSword ? "sword" : ""}_${itemOrName.isUniqueSingularity ? "sing" : ""}_${itemOrName.isUniqueMaelstrom ? "mael" : ""}_${itemOrName.isUniqueAegis ? "aegis" : ""}_${itemOrName.isUniqueWatch ? "watch" : ""}_${itemOrName.isUniqueChronicle ? "chron" : ""}_${itemOrName.isUniqueWarpCore ? "warp" : ""}_${itemOrName.isUniqueTempest ? "temp" : ""}`;

  if (window.canvasCutoutImageCache[key]) {
    return window.canvasCutoutImageCache[key];
  }

  let data = window.getIconSvgData(itemOrName);
  if (!data) return null;

  let is64 = data.viewBox === "0 0 64 64";
  let boxSize = is64 ? 64 : 32;

  let svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" width="${boxSize}" height="${boxSize}">
        ${data.innerSvg}
      </svg>
    `;

  let img = new Image();
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svgString);

  window.canvasCutoutImageCache[key] = img;
  return img;
};

window.getEquipIconHtml = function (item, size = 32) {
  let data = window.getIconSvgData(item);
  if (!data) return "";
  let rgb = window.hexToRgbValues
    ? window.hexToRgbValues(data.color)
    : "50, 50, 50";
  let bg = `rgba(${rgb}, 0.15)`;
  return window.AssetCatalog.compile(
    data.viewBox,
    data.innerSvg,
    size,
    bg,
    data.color,
  );
};

window.getEtcIconHtml = function (name, size = 32) {
  let data = window.getIconSvgData(name);
  if (!data) return "";
  let rgb = window.hexToRgbValues
    ? window.hexToRgbValues(data.color)
    : "170, 170, 170";
  let bg = `rgba(${rgb}, 0.15)`;
  return window.AssetCatalog.compile(
    data.viewBox,
    data.innerSvg,
    size,
    bg,
    data.color,
  );
};

window.getUseIconHtml = function (name, size = 32) {
  let data = window.getIconSvgData(name);
  if (!data) return "";
  let rgb = window.hexToRgbValues
    ? window.hexToRgbValues(data.color)
    : "46, 204, 113";
  let bg = `rgba(${rgb}, 0.15)`;
  return window.AssetCatalog.compile(
    data.viewBox,
    data.innerSvg,
    size,
    bg,
    data.color,
  );
};

// ==========================================================================
// --- APPENDABLE SKILL TREE SVG VECTOR ICON CATALOG ---
// Append custom vector path definitions node-by-node below!
// ==========================================================================
window.AssetCatalog.skillIcons = {
  // Tree 1: Shield Mastery Custom Vector Icons
  shield_starter: {
    color: "#38bdf8",
    path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="16" stroke="#ffffff" stroke-width="2" stroke-linecap="round" /><line x1="8" y1="12" x2="16" y2="12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />`,
    opacity: "0.2",
  },
  shield_hp: {
    color: "#ff4757",
    path: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />`,
    opacity: "0.25",
  },
  shield_def: {
    color: "#38bdf8",
    path: `<path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />`,
    opacity: "0.25",
  },
  shield_block: {
    color: "#3498db",
    path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M8 10h8v4H8z" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-width="1.2" />`,
    opacity: "0.25",
  },
  shield_bash: {
    color: "#f1c40f",
    path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#f1c40f" stroke-width="2" stroke-linecap="round" />`,
    opacity: "0.2",
  },
  shield_fortitude: {
    color: "#2ecc71",
    path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="8,14 12,10 16,14" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" />`,
    opacity: "0.25",
  },
  shield_keystone: {
    color: "#a855f7",
    path: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#a855f7" fill-opacity="0.4" /><circle cx="12" cy="12" r="9" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 2" />`,
    opacity: "0.3",
  },

  // Tree 2: Dagger Mastery Custom Vector Icons
  dagger_starter: {
    color: "#a855f7",
    path: `<path d="M12 2L15 8L13 18H11L9 8Z" fill="#a855f7" stroke="#a855f7" stroke-width="1.5" /><rect x="8" y="18" width="8" height="2" fill="#ffffff" /><rect x="11" y="20" width="2" height="4" fill="#333" /><line x1="12" y1="2" x2="12" y2="18" stroke="#ffffff" stroke-width="1" />`,
    opacity: "0.2",
  },
  dagger_crit: {
    color: "#f1c40f",
    path: `<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />`,
    opacity: "0.25",
  },
  dagger_crit_dmg: {
    color: "#e67e22",
    path: `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />`,
    opacity: "0.25",
  },
  dagger_parry: {
    color: "#c084fc",
    path: `<path d="M4 20L20 4M4 20L2 22M5 15L9 19M20 20L4 4M20 20L22 22M15 19L19 15" stroke="#c084fc" stroke-width="2.2" stroke-linecap="round" fill="none" /><circle cx="12" cy="12" r="2.5" fill="#ffffff" stroke="#c084fc" stroke-width="1" />`,
    opacity: "0.15",
  },
  dagger_bleed: {
    color: "#e74c3c",
    path: `<path d="M12 2L16 9 L14 17 H10 L8 9 Z" fill="#960018" stroke="#e74c3c" stroke-width="1.5" /><path d="M12 14 C10 17, 10 20, 12 22 C14 20, 14 17, 12 14 Z" fill="#e74c3c" stroke="#ffffff" stroke-width="0.8" />`,
    opacity: "0.25",
  },
  dagger_riposte: {
    color: "#f1c40f",
    path: `<path d="M12 2L16 10H8Z" fill="#f1c40f" stroke="#ffffff" stroke-width="1.2" /><circle cx="12" cy="12" r="8" fill="none" stroke="#f1c40f" stroke-width="1.5" stroke-dasharray="2 2" /><path d="M12 6v12M6 12h12" stroke="#e74c3c" stroke-width="1.8" />`,
    opacity: "0.2",
  },
  dagger_keystone: {
    color: "#e84393",
    path: `<path d="M8 4L11 12H5Z M16 4L19 12H13Z" fill="#e84393" stroke="#ffffff" stroke-width="1.2" /><path d="M3 18Q12 10, 21 18" fill="none" stroke="#e84393" stroke-width="2" stroke-dasharray="3 2" /><circle cx="12" cy="18" r="3" fill="#ffffff" stroke="#e84393" stroke-width="1" />`,
    opacity: "0.3",
  },

  // Tree 3: Tome Mastery Custom Vector Icons
  tome_starter: {
    color: "#3498db",
    path: `<rect x="5" y="6" width="14" height="15" rx="1.5" fill="#3498db" fill-opacity="0.3" stroke="#3498db" stroke-width="1.8" /><rect x="5" y="6" width="3" height="15" fill="#1e293b" /><circle cx="12" cy="13.5" r="2.5" fill="#ffffff" stroke="#3498db" stroke-width="1" /><path d="M12 2v3M12 21v2M2 13.5h3M21 13.5h2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />`,
    opacity: "0.2",
  },
  tome_atk: {
    color: "#e74c3c",
    path: `<path d="M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2" />`,
    opacity: "0.25",
  },
  tome_exp: {
    color: "#a855f7",
    path: `<circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />`,
    opacity: "0.2",
  },
  tome_barrier: {
    color: "#9b59b6",
    path: `<rect x="7" y="7" width="10" height="12" rx="1" fill="#9b59b6" fill-opacity="0.4" stroke="#9b59b6" stroke-width="1.5" /><circle cx="12" cy="13" r="9" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-dasharray="4 2" /><circle cx="12" cy="13" r="11" fill="none" stroke="#9b59b6" stroke-width="1" opacity="0.6" />`,
    opacity: "0.25",
  },
  tome_proc: {
    color: "#00d2ff",
    path: `<rect x="6" y="6" width="12" height="14" rx="1.5" fill="#00d2ff" fill-opacity="0.3" stroke="#00d2ff" stroke-width="1.8" /><path d="M18 4L16 9h4l-2 5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" /><circle cx="12" cy="13" r="2" fill="#ffffff" />`,
    opacity: "0.2",
  },
  tome_power: {
    color: "#f1c40f",
    path: `<circle cx="8" cy="8" r="3" fill="#e74c3c" stroke="#ffffff" stroke-width="1" /><circle cx="16" cy="8" r="3" fill="#3498db" stroke="#ffffff" stroke-width="1" /><circle cx="12" cy="15" r="3.5" fill="#f1c40f" stroke="#ffffff" stroke-width="1" /><rect x="6" y="19" width="12" height="3" fill="#333" stroke="#f1c40f" stroke-width="1" />`,
    opacity: "0.25",
  },
  tome_keystone: {
    color: "#e879f9",
    path: `<rect x="7" y="8" width="10" height="12" rx="1" fill="#e879f9" stroke="#ffffff" stroke-width="1.5" /><path d="M12 2L12 8 M4 18L8 14 M20 18L16 14" stroke="#e879f9" stroke-width="2" stroke-linecap="round" /><circle cx="12" cy="14" r="2" fill="#ffffff" />`,
    opacity: "0.3",
  },

  // Tree 4: Utility & Survival Custom Vector Icons
  utility_pioneer: {
    color: "#2ecc71",
    path: `<circle cx="12" cy="12" r="9" fill="none" stroke="#2ecc71" stroke-width="1.8" /><polygon points="12,5 15,12 12,19 9,12" fill="#ffffff" stroke="#2ecc71" stroke-width="1" /><circle cx="12" cy="12" r="2" fill="#f1c40f" />`,
    opacity: "0.2",
  },
  utility_start_weapon: {
    color: "#f1c40f",
    path: `<path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><circle cx="18" cy="18" r="3" fill="#f1c40f" />`,
    opacity: "0.25",
  },
  utility_start_armor: {
    color: "#3498db",
    path: `<path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" /><path d="M12 6v12" stroke="#ffffff" stroke-width="1.5" />`,
    opacity: "0.25",
  },
  utility_start_head_feet: {
    color: "#2ecc71",
    path: `<path d="M6 5h12v6H6z M8 13h8v6H8z" />`,
    opacity: "0.25",
  },
  utility_start_ring: {
    color: "#e879f9",
    path: `<circle cx="12" cy="12" r="7" stroke="#e879f9" stroke-width="2" fill="none" /><circle cx="12" cy="5" r="2" fill="#ffffff" />`,
    opacity: "0.25",
  },
  utility_gold: {
    color: "#f1c40f",
    path: `<circle cx="12" cy="12" r="9" fill="#f1c40f" fill-opacity="0.3" stroke="#f1c40f" stroke-width="2" /><path d="M12 7v10M9 9h6M9 14h6" stroke="#ffffff" stroke-width="1.5" />`,
    opacity: "0.2",
  },
  utility_vitality: {
    color: "#2ecc71",
    path: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />`,
    opacity: "0.25",
  },
  utility_quality: {
    color: "#ec4899",
    path: `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="none" stroke="#ec4899" stroke-width="1.8" /><polygon points="12,7 15,12 12,17 9,12" fill="#ffffff" stroke="#ec4899" stroke-width="1" />`,
    opacity: "0.25",
  },
  utility_elixir: {
    color: "#34d399",
    path: `<path d="M10 5h4v3l4 8a2 2 0 0 1-1.8 3H7.8A2 2 0 0 1 6 16l4-8V5z" fill="#34d399" fill-opacity="0.3" stroke="#34d399" stroke-width="1.8" stroke-linejoin="round" /><rect x="9" y="3" width="6" height="2" fill="#a0522d" /><circle cx="12" cy="14" r="2" fill="#ffffff" />`,
    opacity: "0.25",
  },
  utility_bag: {
    color: "#38bdf8",
    path: `<rect x="5" y="8" width="14" height="12" rx="2" fill="#38bdf8" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1.8" /><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="#ffffff" stroke-width="1.5" /><line x1="2" y1="14" x2="4" y2="14" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" /><line x1="20" y1="14" x2="22" y2="14" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />`,
    opacity: "0.2",
  },
  utility_insurance: {
    color: "#f1c40f",
    path: `<path d="M6 4h12v16H6z" fill="#f1c40f" fill-opacity="0.2" stroke="#f1c40f" stroke-width="1.8" /><path d="M12 7l4 2v4c0 3-4 5-4 5s-4-2-4-5V9l4-2z" fill="#ffffff" stroke="#f1c40f" stroke-width="1" />`,
    opacity: "0.2",
  },
  utility_keystone: {
    color: "#ffd700",
    path: `<path d="M4 16l3-8 5 4 5-4 3 8H4z" fill="#ffd700" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" /><rect x="4" y="16" width="16" height="3" fill="#ffd700" stroke="#ffffff" stroke-width="1" /><circle cx="12" cy="11" r="1.5" fill="#ffffff" />`,
    opacity: "0.35",
  },
};

window.getSkillIconSvg = function (iconKey, size = 28) {
  let icon = window.AssetCatalog.skillIcons[iconKey];
  if (!icon) {
    // Graceful procedural fallback frame for skills awaiting custom icons
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; background:rgba(0,0,0,0.4); border:1px solid #475569; border-radius:6px; flex-shrink:0;">
      <svg width="${size * 0.7}" height="${size * 0.7}" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
      </svg>
    </span>`;
  }

  let rgb = window.hexToRgbValues
    ? window.hexToRgbValues(icon.color)
    : "56, 189, 248";
  let bg = `rgba(${rgb}, 0.18)`;

  return window.AssetCatalog.compile(
    "0 0 24 24",
    `<g fill="${icon.color}" fill-opacity="${icon.opacity || "0.2"}" stroke="${icon.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon.path}</g>`,
    size,
    bg,
    icon.color,
  );
};

// Initialize the custom modular artifact SVG registry
window.NEW_ARTIFACT_SVGS = window.NEW_ARTIFACT_SVGS || {};

// Register 1.3: Breacher's Adrenaline Glass SVG
window.NEW_ARTIFACT_SVGS.breach_adrenaline = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <circle cx="32" cy="32" r="24" fill="url(#adrenaline_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="adrenaline_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff0055" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="adrenaline_fluid_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff3366" />
          <stop offset="50%" stop-color="#ff0055" />
          <stop offset="100%" stop-color="#990022" />
        </linearGradient>
        <linearGradient id="adrenaline_brass_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd700" />
          <stop offset="50%" stop-color="#b7950b" />
          <stop offset="100%" stop-color="#5d4037" />
        </linearGradient>
      </defs>
      <path d="M22 14h20v2H22z" fill="url(#adrenaline_brass_${size})" stroke="#05070a" stroke-width="1.2" />
      <path d="M22 48h20v2H22z" fill="url(#adrenaline_brass_${size})" stroke="#05070a" stroke-width="1.2" />
      <path d="M26 16 L26 24 C26 30, 20 34, 20 40 L20 46 L44 46 L44 40 C44 34, 38 30, 38 24 L38 16 Z" fill="rgba(255, 255, 255, 0.08)" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
      <path d="M22.5 38 C22.5 35, 26 33, 32 33 C38 33, 41.5 35, 41.5 38 L41.5 45 L22.5 45 Z" fill="url(#adrenaline_fluid_${size})" stroke="#ff0055" stroke-width="0.8" />
      <circle cx="28" cy="36" r="1.5" fill="#ffffff" opacity="0.9" />
      <circle cx="36" cy="32" r="1.0" fill="#ffb6c1" opacity="0.8" />
      <circle cx="32" cy="22" r="1.2" fill="#ffd700" opacity="0.95" />
      <circle cx="30" cy="28" r="0.8" fill="#ffffff" opacity="0.75" />
      <path d="M16 20 C12 24, 12 36, 20 42 C18 36, 18 24, 16 20 Z" fill="url(#adrenaline_brass_${size})" stroke="#05070a" stroke-width="1.0" />
      <path d="M48 20 C52 24, 52 36, 44 42 C46 36, 46 24, 48 20 Z" fill="url(#adrenaline_brass_${size})" stroke="#05070a" stroke-width="1.0" />
    </svg>
  `;
};

// Register 1.4: Aegis Infiltration Glyph SVG
window.NEW_ARTIFACT_SVGS.breach_barrier = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <circle cx="32" cy="32" r="24" fill="url(#barrier_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="barrier_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00f0ff" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="barrier_obsidian_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="barrier_steel_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#0284c7" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
      </defs>
      <path d="M24 12 L40 12 L52 24 L52 40 L40 52 L24 52 L12 40 L12 24 Z" fill="url(#barrier_obsidian_${size})" stroke="#05070a" stroke-width="1.5" />
      <path d="M25 14 L39 14 L50 25 L50 39 L39 50 L25 50 L14 39 L14 25 Z" stroke="url(#barrier_steel_${size})" stroke-width="1.5" fill="none" opacity="0.9" />
      <path d="M32 18 L32 24 M32 40 L32 46 M18 32 L24 32 M40 32 L46 32" stroke="#00f0ff" stroke-width="1.2" opacity="0.85" stroke-linecap="round" />
      <path d="M28 26 L36 26 L40 32 L36 38 L28 38 L24 32 Z" stroke="rgba(0, 240, 255, 0.4)" stroke-width="1.0" fill="none" />
      <path d="M29 28 C29 28, 32 29, 32 26 C32 29, 35 28, 35 28 C35 34, 32 37, 32 37 C32 37, 29 34, 29 28 Z" fill="url(#barrier_steel_${size})" stroke="#00f0ff" stroke-width="1.0" />
      <circle cx="32" cy="26" r="1.5" fill="#ffffff" />
      <circle cx="28" cy="26" r="1.0" fill="#00f0ff" />
      <circle cx="36" cy="26" r="1.0" fill="#00f0ff" />
      <circle cx="24" cy="32" r="1.0" fill="#00f0ff" />
      <circle cx="40" cy="32" r="1.0" fill="#00f0ff" />
      <circle cx="28" cy="38" r="1.0" fill="#00f0ff" />
      <circle cx="36" cy="38" r="1.0" fill="#00f0ff" />
    </svg>
  `;
};

// Register 1.5: Scout's Cartographic Compass SVG
window.NEW_ARTIFACT_SVGS.breach_scouting = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <circle cx="32" cy="32" r="24" fill="url(#scouting_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="scouting_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffd700" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="scouting_brass_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff275" />
          <stop offset="50%" stop-color="#b7950b" />
          <stop offset="100%" stop-color="#7d6608" />
        </linearGradient>
        <linearGradient id="scouting_glass_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="10" r="6" stroke="url(#scouting_brass_${size})" stroke-width="2" fill="none" />
      <rect x="30" y="14" width="4" height="4" fill="url(#scouting_brass_${size})" stroke="#05070a" stroke-width="1.0" />
      <circle cx="32" cy="36" r="22" fill="#090514" stroke="url(#scouting_brass_${size})" stroke-width="2.5" />
      <circle cx="32" cy="36" r="19" stroke="#05070a" stroke-width="1.0" fill="none" />
      <path d="M32 17 L32 55 M13 36 L51 36" stroke="#b7950b" stroke-width="0.8" opacity="0.4" />
      <circle cx="32" cy="36" r="14" stroke="#ffd700" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.5" />
      <circle cx="32" cy="36" r="8" stroke="#ffd700" stroke-width="0.8" stroke-dasharray="1,2" opacity="0.3" />
      <path d="M32 19 L32 21 M32 51 L32 53 M17 36 L19 36 M49 36 L51 36 M22.8 26.8 L24.2 28.2 M41.2 45.2 L42.6 46.6 M22.8 45.2 L24.2 43.8 M41.2 26.8 L42.6 28.2" stroke="url(#scouting_brass_${size})" stroke-width="1.2" stroke-linecap="round" />
      <path d="M41 27 L42 29 L44.5 29 L42.5 30.5 L43.2 33 L41 31.5 L38.8 33 L39.5 30.5 L37.5 29 L40 29 Z" fill="#2ecc71" stroke="#05070a" stroke-width="0.6" />
      <circle cx="41" cy="27" r="4" stroke="#2ecc71" stroke-width="0.6" stroke-dasharray="1,1" opacity="0.8" />
      <circle cx="32" cy="36" r="3" fill="url(#scouting_brass_${size})" stroke="#05070a" stroke-width="0.8" />
      <path d="M32 36 L34.5 34.5 L38.5 29.5 L34.5 37.5 Z" fill="#ffd700" stroke="#05070a" stroke-width="0.8" />
      <path d="M32 36 L29.5 37.5 L38.5 29.5 L34.5 37.5 Z" fill="#d4af37" stroke="#05070a" stroke-width="0.8" />
      <path d="M32 36 L29.5 37.5 L25.5 42.5 L29.5 34.5 Z" fill="#7f8c8d" stroke="#05070a" stroke-width="0.8" />
      <path d="M32 36 L34.5 34.5 L25.5 42.5 L29.5 34.5 Z" fill="#bdc3c7" stroke="#05070a" stroke-width="0.8" />
      <path d="M14 26 C17 19, 24 16, 32 16 C39 16, 45 19, 48 24 C40 22, 28 22, 14 26 Z" fill="url(#scouting_glass_${size})" opacity="0.65" />
    </svg>
  `;
};

// Register 1.6: Kinetic Friction Turbine SVG
window.NEW_ARTIFACT_SVGS.friction_kinetic = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <!-- Ambient back glow -->
      <circle cx="32" cy="32" r="24" fill="url(#turbine_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="turbine_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#00f3ff" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="turbine_brass_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe699" />
          <stop offset="50%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#8a6d1c" />
        </linearGradient>
        <linearGradient id="turbine_chrome_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="50%" stop-color="#b0c4de" />
          <stop offset="100%" stop-color="#4682b4" />
        </linearGradient>
      </defs>
      <!-- Outer Brass Cog Casing (Teeth) -->
      <path d="M32 10 L34 14 L30 14 Z M32 54 L34 50 L30 50 Z M10 32 L14 34 L14 30 Z M54 32 L50 34 L50 30 Z M16.5 16.5 L20.5 19.3 L18.5 21.3 Z M47.5 47.5 L43.5 44.7 L45.5 42.7 Z M16.5 47.5 L20.5 44.7 L18.5 42.7 Z M47.5 16.5 L43.5 19.3 L45.5 21.3 Z" fill="url(#turbine_brass_${size})" />
      <circle cx="32" cy="32" r="18" fill="#090615" stroke="url(#turbine_brass_${size})" stroke-width="2.5" />
      <circle cx="32" cy="32" r="15" stroke="#05070a" stroke-width="1.0" fill="none" />
      <!-- Velocity / Wind stream circular arcs -->
      <circle cx="32" cy="32" r="12" stroke="#00f3ff" stroke-width="0.8" stroke-dasharray="10,6" opacity="0.4" />
      <circle cx="32" cy="32" r="7" stroke="#00f3ff" stroke-width="0.8" stroke-dasharray="4,8" opacity="0.3" />
      <!-- Three curved chrome blades radiating from the center -->
      <path d="M32 32 C34 26, 40 23, 44 20 C40 28, 35 30, 32 32 Z" fill="url(#turbine_chrome_${size})" stroke="#05070a" stroke-width="0.6" />
      <path d="M32 32 C26 34, 23 40, 20 44 C28 40, 30 35, 32 32 Z" fill="url(#turbine_chrome_${size})" stroke="#05070a" stroke-width="0.6" />
      <path d="M32 32 C23 28, 20 20, 24 16 C25 24, 29 28, 32 32 Z" fill="url(#turbine_chrome_${size})" stroke="#05070a" stroke-width="0.6" />
      <!-- Central Axle Core -->
      <circle cx="32" cy="32" r="3.5" fill="url(#turbine_brass_${size})" stroke="#05070a" stroke-width="1.0" />
      <circle cx="32" cy="32" r="1.2" fill="#ffffff" />
      <!-- Crackling lightning/kinetic arcs -->
      <path d="M19 24 L24 23 L22 27" stroke="#00f3ff" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
      <path d="M45 40 L40 41 L42 37" stroke="#00f3ff" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
      <path d="M36 19 L33 24 L37 23" stroke="#00f3ff" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round" opacity="0.8" />
      <circle cx="21" cy="25" r="0.8" fill="#ffffff" />
      <circle cx="43" cy="39" r="0.8" fill="#ffffff" />
    </svg>
  `;
};

// Register 1.7: Obsidian Core of Tenacity SVG
window.NEW_ARTIFACT_SVGS.friction_tenacity = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <!-- Ambient back glow -->
      <circle cx="32" cy="32" r="24" fill="url(#tenacity_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="tenacity_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff4500" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="tenacity_obsidian_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1b1c24" />
          <stop offset="50%" stop-color="#0d0d12" />
          <stop offset="100%" stop-color="#050508" />
        </linearGradient>
        <linearGradient id="tenacity_iron_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a4d5c" />
          <stop offset="50%" stop-color="#2a2c35" />
          <stop offset="100%" stop-color="#14151b" />
        </linearGradient>
        <linearGradient id="tenacity_magma_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff7f50" />
          <stop offset="100%" stop-color="#ff2400" />
        </linearGradient>
      </defs>
      <!-- Base Stone (Faceted Volcanic Prism) -->
      <path d="M32 12 L46 22 L46 42 L32 52 L18 42 L18 22 Z" fill="url(#tenacity_obsidian_${size})" stroke="#05070a" stroke-width="1.5" />
      <!-- Facet shading lines to create 3D cuts -->
      <path d="M32 12 L32 32 L18 22 Z" fill="rgba(255,255,255,0.03)" />
      <path d="M32 12 L32 32 L46 22 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M18 42 L32 32 L32 52 Z" fill="rgba(0,0,0,0.4)" />
      <path d="M46 42 L32 32 L32 52 Z" fill="rgba(0,0,0,0.25)" />
      <!-- Engraved Magma/Lava pathways pulsing with heat -->
      <path d="M32 16 L32 26 L24 30 M32 26 L40 30 M32 48 L32 38 L22 34 M32 38 L42 34" stroke="url(#tenacity_magma_${size})" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
      <!-- Heavy Iron Clamps locking on top, bottom, and sides -->
      <path d="M28 10 L36 10 L38 15 L26 15 Z" fill="url(#tenacity_iron_${size})" stroke="#05070a" stroke-width="1.0" />
      <path d="M28 54 L36 54 L38 49 L26 49 Z" fill="url(#tenacity_iron_${size})" stroke="#05070a" stroke-width="1.0" />
      <path d="M14 28 L14 36 L19 34 L19 30 Z" fill="url(#tenacity_iron_${size})" stroke="#05070a" stroke-width="1.0" />
      <path d="M50 28 L50 36 L45 34 L45 30 Z" fill="url(#tenacity_iron_${size})" stroke="#05070a" stroke-width="1.0" />
      <!-- Molten rivets/plugs on the iron brackets -->
      <circle cx="32" cy="12.5" r="1.2" fill="#ff7f50" stroke="#05070a" stroke-width="0.5" />
      <circle cx="32" cy="51.5" r="1.2" fill="#ff7f50" stroke="#05070a" stroke-width="0.5" />
      <circle cx="16" cy="32" r="1.0" fill="#ff7f50" stroke="#05070a" stroke-width="0.5" />
      <circle cx="48" cy="32" r="1.0" fill="#ff7f50" stroke="#05070a" stroke-width="0.5" />
      <!-- Flaring heat spark nodes -->
      <circle cx="32" cy="32" r="1.5" fill="#ffaa00" />
      <circle cx="25" cy="22" r="0.8" fill="#ff3300" opacity="0.75" />
      <circle cx="39" cy="42" r="1.0" fill="#ff7f50" opacity="0.85" />
    </svg>
  `;
};

// Register 1.8: Void Accretion Engine SVG
window.NEW_ARTIFACT_SVGS.friction_accretion = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <!-- Ambient back glow -->
      <circle cx="32" cy="32" r="24" fill="url(#accretion_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="accretion_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="accretion_metal_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="50%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
        <linearGradient id="accretion_ring_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#ff007f" />
        </linearGradient>
      </defs>
      <!-- Outer Gyroscope Frame -->
      <circle cx="32" cy="32" r="22" stroke="url(#accretion_metal_${size})" stroke-width="2.5" />
      <!-- Inner Clockwork Ticks -->
      <circle cx="32" cy="32" r="18" stroke="#05070a" stroke-width="1.0" fill="none" />
      <path d="M32 11 L32 13 M32 51 L32 53 M14 32 L16 32 M50 32 L52 32" stroke="#a855f7" stroke-width="1.2" stroke-linecap="round" />
      <!-- Swirling cosmic gravitational accretion arms -->
      <path d="M32 16 C39 16, 44 22, 44 32 C44 42, 38 46, 32 46 C24 46, 21 40, 21 34" stroke="url(#accretion_ring_${size})" stroke-width="1.5" stroke-linecap="round" opacity="0.85" />
      <path d="M32 48 C25 48, 20 42, 20 32 C20 22, 26 18, 32 18 C40 18, 43 24, 43 30" stroke="url(#accretion_ring_${size})" stroke-width="1.0" stroke-linecap="round" opacity="0.6" />
      <!-- Event Horizon Core (Black Hole) -->
      <circle cx="32" cy="32" r="8" fill="#000000" stroke="#ff007f" stroke-width="1.8" />
      <circle cx="32" cy="32" r="4" fill="#1e1b4b" opacity="0.8" />
      <!-- High-energy static sparks and stardust nodes -->
      <circle cx="28" cy="24" r="1.0" fill="#ffffff" />
      <circle cx="38" cy="40" r="0.8" fill="#ff007f" opacity="0.85" />
      <circle cx="21" cy="34" r="1.2" fill="#00ffff" />
      <circle cx="43" cy="30" r="1.0" fill="#ffffff" />
    </svg>
  `;
};

// Register 1.9: Nexus Harmonizer SVG
window.NEW_ARTIFACT_SVGS.synergy_nexus = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <!-- Ambient back glow -->
      <circle cx="32" cy="32" r="24" fill="url(#nexus_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="nexus_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#9b59b6" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="nexus_brass_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe699" />
          <stop offset="50%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#8a6d1c" />
        </linearGradient>
        <linearGradient id="nexus_plasma_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00f3ff" />
          <stop offset="100%" stop-color="#a855f7" />
        </linearGradient>
      </defs>
      <!-- Base Trinity Triangle Frame (The Harmonizing Leylines) -->
      <path d="M32 12 L50 44 L14 44 Z" stroke="url(#nexus_brass_${size})" stroke-width="2.5" stroke-linejoin="round" fill="none" />
      <path d="M32 15 L48 42 L16 42 Z" stroke="#05070a" stroke-width="1.0" stroke-linejoin="round" fill="none" />
      <!-- Central Harmonizer Gyro-Sphere (Magical Core) -->
      <circle cx="32" cy="32" r="10" fill="#090514" stroke="url(#nexus_brass_${size})" stroke-width="1.5" />
      <circle cx="32" cy="32" r="7.5" stroke="#ff007f" stroke-width="1.0" fill="none" opacity="0.8" />
      <!-- Swirling Core Energy -->
      <circle cx="32" cy="32" r="4.5" fill="url(#nexus_plasma_${size})" />
      <!-- Leyline Channels connecting Core to Triangle Corners -->
      <path d="M32 32 L32 14 M32 32 L49 43 M32 32 L15 43" stroke="url(#nexus_plasma_${size})" stroke-width="1.5" stroke-linecap="round" />
      <!-- Corner Nodes (The Trinity Locks) -->
      <!-- Top Node: Tome -->
      <circle cx="32" cy="14" r="4" fill="#090514" stroke="url(#nexus_brass_${size})" stroke-width="1.2" />
      <rect x="30" y="12" width="4" height="4" fill="#9b59b6" stroke="#05070a" stroke-width="0.5" />
      <!-- Bottom Right Node: Dagger -->
      <circle cx="49" cy="43" r="4" fill="#090514" stroke="url(#nexus_brass_${size})" stroke-width="1.2" />
      <path d="M49 40 L51 43 L49 46 L47 43 Z" fill="#3498db" stroke="#05070a" stroke-width="0.5" />
      <!-- Bottom Left Node: Shield -->
      <circle cx="15" cy="43" r="4" fill="#090514" stroke="url(#nexus_brass_${size})" stroke-width="1.2" />
      <path d="M13 41 L17 41 L17 44 L15 46 L13 44 Z" fill="#2ecc71" stroke="#05070a" stroke-width="0.5" />
      <!-- Tiny orbital alignment nodes -->
      <circle cx="32" cy="24" r="1.2" fill="#00f3ff" />
      <circle cx="41" cy="37" r="1.2" fill="#00f3ff" />
      <circle cx="23" cy="37" r="1.2" fill="#00f3ff" />
    </svg>
  `;
};

// Register 1.10: Sanguine Catalyst SVG
window.NEW_ARTIFACT_SVGS.synergy_sanguine = function (size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <!-- Ambient back glow -->
      <circle cx="32" cy="32" r="24" fill="url(#sanguine_glow_${size})" opacity="0.15" />
      <defs>
        <radialGradient id="sanguine_glow_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff3300" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="sanguine_fluid_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ff0000" />
          <stop offset="60%" stop-color="#990000" />
          <stop offset="100%" stop-color="#4a0000" />
        </linearGradient>
        <linearGradient id="sanguine_metal_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd700" />
          <stop offset="50%" stop-color="#b7950b" />
          <stop offset="100%" stop-color="#5d4037" />
        </linearGradient>
        <linearGradient id="sanguine_glass_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.2)" />
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)" />
        </linearGradient>
      </defs>
      <!-- Ornate metal bracket capping the top -->
      <path d="M28 12 L36 12 L38 18 L26 18 Z" fill="url(#sanguine_metal_${size})" stroke="#05070a" stroke-width="1.0" />
      <rect x="29" y="10" width="6" height="3" fill="#0d0d12" stroke="url(#sanguine_metal_${size})" stroke-width="0.8" />
      <!-- Teardrop Glass Vial Body -->
      <path d="M29 18 C29 18, 24 24, 21 34 C17 44, 23 52, 32 52 C41 52, 47 44, 43 34 C40 24, 35 18, 35 18 Z" fill="rgba(255, 255, 255, 0.06)" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
      <!-- Reactant blood-red fluid inside -->
      <path d="M24.8 33.5 C21.8 42, 26 49.5, 32 49.5 C38 49.5, 42.2 42, 39.2 33.5 C36.5 25.5, 32 23, 32 23 C32 23, 27.5 25.5, 24.8 33.5 Z" fill="url(#sanguine_fluid_${size})" stroke="#ff0000" stroke-width="0.8" />
      <!-- Multi-element reactive synergy nodes floating inside -->
      <!-- Venom-Green (Poison) -->
      <circle cx="28" cy="38" r="1.5" fill="#2ecc71" stroke="#05070a" stroke-width="0.5" />
      <!-- Molten-Orange (Burn) -->
      <circle cx="36" cy="35" r="1.5" fill="#e67e22" stroke="#05070a" stroke-width="0.5" />
      <!-- Deep-Crimson (Bleed) -->
      <circle cx="31" cy="44" r="1.5" fill="#c0392b" stroke="#05070a" stroke-width="0.5" />
      <!-- Spark nodes -->
      <circle cx="27" cy="45" r="0.8" fill="#ffffff" />
      <circle cx="37" cy="43" r="1.0" fill="#f1c40f" opacity="0.8" />
      <!-- Side metallic filigree claws securing the flask -->
      <path d="M19 32 C15 36, 17 48, 25 50 C21 44, 20 36, 19 32 Z" fill="url(#sanguine_metal_${size})" stroke="#05070a" stroke-width="0.8" />
      <path d="M45 32 C49 36, 47 48, 39 50 C43 44, 44 36, 45 32 Z" fill="url(#sanguine_metal_${size})" stroke="#05070a" stroke-width="0.8" />
      <!-- Curved glass reflection glare -->
            <path d="M22.5 32 C25 25, 29 22, 32 22 C35 22, 39 25, 41.5 32 C35.5 30, 28.5 30, 22.5 32 Z" fill="url(#sanguine_glass_${size})" opacity="0.6" />
          </svg>
        `;
};

// Register 1.11: Kinetic Momentum Converter SVG
window.NEW_ARTIFACT_SVGS.speed_to_momentum = function (size) {
  return `
          <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
            <circle cx="32" cy="32" r="24" fill="url(#momentum_glow_${size})" opacity="0.15" />
            <defs>
              <radialGradient id="momentum_glow_${size}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00ffff" />
                <stop offset="100%" stop-color="#000000" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="momentum_steel_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="50%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#0369a1" />
              </linearGradient>
              <linearGradient id="momentum_gold_${size}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd700" />
                <stop offset="50%" stop-color="#d4af37" />
                <stop offset="100%" stop-color="#8a6d1c" />
              </linearGradient>
              <linearGradient id="momentum_core_${size}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="50%" stop-color="#00ffff" />
                <stop offset="100%" stop-color="#1e1b4b" />
              </linearGradient>
            </defs>
            <!-- Outer Circular Frame -->
            <circle cx="32" cy="32" r="22" stroke="url(#momentum_steel_${size})" stroke-width="2.2" />
            <circle cx="32" cy="32" r="19" stroke="#05070a" stroke-width="1.0" fill="none" />
            <!-- Vector Chevron Arrows around the edge representing speed and forward direction -->
            <path d="M12 32 L15 30 L15 34 Z M52 32 L49 30 L49 34 Z M32 12 L30 15 L34 15 Z M32 52 L30 49 L34 49 Z" fill="url(#momentum_gold_${size})" />
            <!-- Inner Gyroscope rings -->
            <circle cx="32" cy="32" r="14" stroke="#ffd700" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.6" />
            <!-- Central Converter Axle with vector wings -->
            <path d="M26 32 L32 20 L38 32 L32 44 Z" fill="rgba(255, 255, 255, 0.08)" stroke="#ffffff" stroke-width="1.2" opacity="0.75" />
            <!-- Glowing converted core -->
            <circle cx="32" cy="32" r="6" fill="url(#momentum_core_${size})" stroke="#00ffff" stroke-width="1.0" />
            <circle cx="32" cy="32" r="2" fill="#ffffff" />
            <!-- Energy transfer bolts/arcs -->
            <path d="M21 21 L26 23" stroke="#00ffff" stroke-width="1.0" stroke-linecap="round" />
            <path d="M43 43 L38 41" stroke="#00ffff" stroke-width="1.0" stroke-linecap="round" />
            <path d="M21 43 L26 41" stroke="#a855f7" stroke-width="1.0" stroke-linecap="round" />
            <path d="M43 21 L38 23" stroke="#a855f7" stroke-width="1.0" stroke-linecap="round" />
          </svg>
        `;
};

// Global interceptor hook executing modular dynamic lookups
(function () {
  const originalGetArtifactIcon = window.getArtifactIconHtml;
  window.getArtifactIconHtml = function (trait, size = 56) {
    if (window.NEW_ARTIFACT_SVGS && window.NEW_ARTIFACT_SVGS[trait]) {
      return window.NEW_ARTIFACT_SVGS[trait](size);
    }
    return originalGetArtifactIcon ? originalGetArtifactIcon(trait, size) : "";
  };
})();
