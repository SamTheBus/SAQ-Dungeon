/* ==========================================================================
   PRIMARY PURPOSE: Procedural Sound Synthesis Engine (SoundManager).
   Generates all game audio in real-time using the Web Audio API.
   ========================================================================= */

window.SoundManager = {
  ctx: null,
  activeChannelCount: 0,
  maxConcurrent: 5,
  masterGain: null,
  sfxGain: null,
  cachedNoiseBuffer: null, // Cached to prevent real-time GC stutters on iOS
  gainPool: [],
  filterPool: [],
  gainPoolSize: 30,
  filterPoolSize: 15,

  getSafeSettings() {
    const stats = window.playerStats || {};
    return {
      mute: stats.mute ?? false,
      master: stats.volumeMaster !== undefined ? stats.volumeMaster : 0.5,
      sfx: stats.volumeSFX !== undefined ? stats.volumeSFX : 0.5,
      music: stats.volumeMusic !== undefined ? stats.volumeMusic : 0.5
    };
  },

  init() {
    // Force iOS AudioSession to "playback" category to bypass physical silent switch
    if (navigator.audioSession) {
      try {
        navigator.audioSession.type = "playback";
      } catch (e) {
        console.warn("Could not set iOS AudioSession category:", e);
      }
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        // Subphase 1.1 Dynamics Stage: Master Limiter (Threshold -12 dB, Ratio 20:1, Knee 12 dB, Attack 3ms, Release 100ms)
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(12.0, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);

        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        // Subphase 1.2: Pre-allocate Reusable GainNodes
        this.gainPool = [];
        for (let i = 0; i < this.gainPoolSize; i++) {
          let gNode = this.ctx.createGain();
          gNode.freeAt = 0;
          // Pre-connect all pooled GainNodes to sfxGain so we never allocate connections to destination at runtime
          gNode.connect(this.sfxGain);
          this.gainPool.push(gNode);
        }

        // Subphase 1.2: Pre-allocate Reusable BiquadFilterNodes
        this.filterPool = [];
        for (let i = 0; i < this.filterPoolSize; i++) {
          let fNode = this.ctx.createBiquadFilter();
          fNode.freeAt = 0;
          this.filterPool.push(fNode);
        }

        this.updateVolumes();

        // Pre-create 2 seconds of high-fidelity white noise to eliminate iOS allocation crackle
        const sampleRate = this.ctx.sampleRate;
        this.cachedNoiseBuffer = this.ctx.createBuffer(
          1,
          sampleRate * 2,
          sampleRate,
        );
        const data = this.cachedNoiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.setupVisibilitySentinel();
      } catch (e) {
        console.warn("Failed to initialize Web AudioContext:", e);
        return false;
      }
    }
    // Secure AudioContext state transitions for mobile background throttling
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => {
        console.warn(
          "AudioContext resume postponed (waiting for user gesture):",
          err,
        );
      });
    }
    return true;
  },

  updateVolumes() {
      if (!this.ctx) return;
      const settings = this.getSafeSettings();
      if (navigator.audioSession) {
        try {
          navigator.audioSession.type = settings.mute ? "ambient" : "playback";
        } catch (e) {}
      }
      const now = this.ctx.currentTime;
      const targetMaster = settings.mute ? 0 : settings.master;
      const targetSFX = settings.sfx;
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, targetMaster)),
        now,
        0.015,
      );
      this.sfxGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, targetSFX)),
        now,
        0.015,
      );
      if (
        window.MusicManager &&
        typeof window.MusicManager.updateVolume === "function"
      ) {
        window.MusicManager.updateVolume();
      }
    },

    setupVisibilitySentinel() {
      if (this.sentinelInitialized) return;
      this.sentinelInitialized = true;

      const handleVisibilityLoss = () => {
        if (this.ctx && this.masterGain) {
          const now = this.ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
          this.masterGain.gain.linearRampToValueAtTime(0, now + 0.05);
        }
        if (
          window.MusicManager &&
          typeof window.MusicManager.pause === "function"
        ) {
          window.MusicManager.pause();
        }
        if (navigator.audioSession) {
          try {
            navigator.audioSession.type = "ambient";
          } catch (e) {}
        }
      };

      const handleVisibilityGain = () => {
        if (this.ctx && this.masterGain) {
          this.updateVolumes();
          if (
            window.MusicManager &&
            typeof window.MusicManager.resume === "function"
          ) {
            window.MusicManager.resume();
          }
        }
      };

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          handleVisibilityLoss();
        } else if (document.visibilityState === "visible") {
          handleVisibilityGain();
        }
      });

      window.addEventListener("blur", handleVisibilityLoss);
      window.addEventListener("focus", handleVisibilityGain);
    },

  // Subphase 1.2: Pool Acquisition Helpers
  acquireGainNode(now, duration) {
    const releaseTime = now + duration;
    for (let i = 0; i < this.gainPool.length; i++) {
      let node = this.gainPool[i];
      if (now >= node.freeAt) {
        node.freeAt = releaseTime;
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(0, now);
        return node;
      }
    }
    // Graceful fallback if pool is fully saturated under heavy load
    let fallback = this.ctx.createGain();
    fallback.freeAt = releaseTime;
    fallback.connect(this.sfxGain);
    return fallback;
  },

  acquireFilterNode(now, duration) {
    const releaseTime = now + duration;
    for (let i = 0; i < this.filterPool.length; i++) {
      let node = this.filterPool[i];
      if (now >= node.freeAt) {
        node.freeAt = releaseTime;
        try {
          node.disconnect();
        } catch (e) {}
        node.frequency.cancelScheduledValues(now);
        node.Q.cancelScheduledValues(now);
        node.gain.cancelScheduledValues(now);
        node.type = "lowpass";
        return node;
      }
    }
    let fallback = this.ctx.createBiquadFilter();
    fallback.freeAt = releaseTime;
    return fallback;
  },

  play(type) {
      const settings = this.getSafeSettings();
      if (settings.mute) return;
      if (!this.init()) return;

    // Auto-recovery watchdog to prevent channel lockout from suspended timers or errors
    const now = this.ctx.currentTime;
    const lastPlay = this._lastPlayTime || 0;
    if (now - lastPlay > 2.0) {
      this.activeChannelCount = 0;
    }
    this._lastPlayTime = now;

    if (this.activeChannelCount >= this.maxConcurrent) return;
    this.activeChannelCount++;
    const dest = this.sfxGain;
    switch (type) {
      case "swing":
        this.playWeaponSwing(now, dest);
        break;
      case "hover":
        if (typeof this.playHover === "function") {
          this.playHover();
        } else {
          this.synthesizeSwordSwing(now, dest);
        }
        break;
      case "hit":
        this.synthesizeHit(now, dest, false);
        break;
      case "crit":
        this.synthesizeHit(now, dest, true);
        break;
      case "block":
        this.synthesizeBlock(now, dest);
        break;
      case "parry":
        this.synthesizeParry(now, dest);
        break;
      case "spell":
        this.synthesizeSpell(now, dest);
        break;
      case "spell_fire":
        this.synthesizeSpellFire(now, dest);
        break;
      case "spell_lightning":
        this.synthesizeSpellLightning(now, dest);
        break;
      case "spell_frost":
        this.synthesizeSpellFrost(now, dest);
        break;
      case "fairy":
        this.synthesizeFairy(now, dest);
        break;
      case "death":
        this.synthesizeDeath(now, dest);
        break;
      case "defeat":
        this.synthesizeDefeat(now, dest);
        break;
      case "revive":
        this.synthesizeRevive(now, dest);
        break;
    }
  },

  playWeaponSwing(now, dest) {
    let weapon = window.equippedSlots ? window.equippedSlots.weapon : null;
    let noun = weapon && weapon.noun ? weapon.noun.toLowerCase() : "";

    // Dynamic dispatch based on equipped weapon class (Phase 2 Roadmap)
    if (
      weapon &&
      (weapon.isUniqueStaff || noun.includes("staff") || noun.includes("wand"))
    ) {
      this.synthesizeStaffSwing(now, dest); // Subphase 2.4: The Staff Swing
    } else if (
      weapon &&
      (weapon.isUniqueViper ||
        noun.includes("dagger") ||
        noun.includes("stiletto") ||
        noun.includes("kris") ||
        noun.includes("baselard") ||
        noun.includes("dirk") ||
        noun.includes("gauche"))
    ) {
      this.synthesizeDaggerSwing(now, dest); // Subphase 2.2: The Dagger Swing
    } else if (
      weapon &&
      (noun.includes("warhammer") ||
        noun.includes("mace") ||
        noun.includes("axe") ||
        noun.includes("halberd"))
    ) {
      this.synthesizeBluntSwing(now, dest); // Subphase 2.3: The Blunt Swing
    } else {
      this.synthesizeSwordSwing(now, dest); // Subphase 2.1: The Sword Swing
    }
  },

  synthesizeSwordSwing(now, dest) {
    const duration = 0.18;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.Q.setValueAtTime(5.0, now);
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.12);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    const bladeOsc = this.ctx.createOscillator();
    bladeOsc.type = "triangle";
    bladeOsc.frequency.setValueAtTime(430, now);
    bladeOsc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    const bladeGain = this.acquireGainNode(now, duration);
    bladeGain.gain.setValueAtTime(0.08, now);
    bladeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    bladeOsc.connect(bladeGain);
    bladeGain.connect(gainNode);

    noiseSource.start(now);
    bladeOsc.start(now);

    noiseSource.stop(now + duration);
    bladeOsc.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeDaggerSwing(now, dest) {
    const duration = 0.08;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "highpass";
    noiseFilter.Q.setValueAtTime(1.0, now);
    noiseFilter.frequency.setValueAtTime(4500, now);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    gainNode.connect(dest);

    const tickOsc = this.ctx.createOscillator();
    tickOsc.type = "sine";
    tickOsc.frequency.setValueAtTime(2200, now);
    tickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

    const tickGain = this.acquireGainNode(now, duration);
    tickGain.gain.setValueAtTime(0.04, now);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    tickOsc.connect(tickGain);
    tickGain.connect(gainNode);

    noiseSource.start(now);
    tickOsc.start(now);

    noiseSource.stop(now + duration);
    tickOsc.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeBluntSwing(now, dest) {
    const duration = 0.26;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.24, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "lowpass";
    noiseFilter.Q.setValueAtTime(1.8, now);
    noiseFilter.frequency.setValueAtTime(350, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(70, now + 0.22);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    gainNode.connect(dest);

    const thudOsc = this.ctx.createOscillator();
    thudOsc.type = "triangle";
    thudOsc.frequency.setValueAtTime(130, now);
    thudOsc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    const thudGain = this.acquireGainNode(now, duration);
    thudGain.gain.setValueAtTime(0.22, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    thudOsc.connect(thudGain);
    thudGain.connect(gainNode);

    noiseSource.start(now);
    thudOsc.start(now);

    noiseSource.stop(now + duration);
    thudOsc.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeStaffSwing(now, dest) {
    const duration = 0.15;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Gentle Airy Resonant Tail (Bandpass Filtered white noise)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.Q.setValueAtTime(2.5, now);
    noiseFilter.frequency.setValueAtTime(1500, now);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    // 2. Aeolian Vortex Whistle (Clean Sine Wave)
    const whistleOsc = this.ctx.createOscillator();
    whistleOsc.type = "sine";
    whistleOsc.frequency.setValueAtTime(1100, now);
    whistleOsc.frequency.exponentialRampToValueAtTime(500, now + 0.12);

    const whistleGain = this.acquireGainNode(now, duration);
    whistleGain.gain.setValueAtTime(0.15, now);
    whistleGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    whistleOsc.connect(whistleGain);
    whistleGain.connect(gainNode);

    noiseSource.start(now);
    whistleOsc.start(now);

    noiseSource.stop(now + duration);
    whistleOsc.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  playChestOpen(tier = "iron_bound") {
      const settings = this.getSafeSettings();
      if (settings.mute) return;
      if (!this.init()) return;

    // Auto-recovery watchdog to prevent channel lockout from suspended timers or errors
    const now = this.ctx.currentTime;
    const lastPlay = this._lastPlayTime || 0;
    if (now - lastPlay > 2.0) {
      this.activeChannelCount = 0;
    }
    this._lastPlayTime = now;

    if (this.activeChannelCount >= this.maxConcurrent) return;
    this.activeChannelCount++;
    const dest = this.sfxGain;

    if (tier === "iron_bound") {
      this.synthesizeIronChestOpen(now, dest);
    } else if (tier === "gilded") {
      this.synthesizeGildedChestOpen(now, dest);
    } else if (tier === "astral") {
      this.synthesizeAstralChestOpen(now, dest);
    } else {
      this.synthesizeIronChestOpen(now, dest);
    }
  },

  synthesizeIronChestOpen(now, dest) {
    const duration = 0.5;
    const masterGain = this.acquireGainNode(now, duration);
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(dest);

    // 1. Iron Latch Pop (Start of open: t = 0.0s)
    const latchOsc1 = this.ctx.createOscillator();
    latchOsc1.type = "sine";
    latchOsc1.frequency.setValueAtTime(480, now);

    const latchOsc2 = this.ctx.createOscillator();
    latchOsc2.type = "triangle";
    latchOsc2.frequency.setValueAtTime(710, now);

    const latchGain = this.acquireGainNode(now, 0.08);
    latchGain.gain.setValueAtTime(0, now);
    latchGain.gain.linearRampToValueAtTime(0.22, now + 0.003);
    latchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    latchOsc1.connect(latchGain);
    latchOsc2.connect(latchGain);
    latchGain.connect(masterGain);

    // 2. Gritty Wood Creak (Starts at t = 0.05s)
    const creakTime = now + 0.05;
    const creakDuration = 0.45;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const creakFilter = this.acquireFilterNode(creakTime, creakDuration);
    creakFilter.type = "lowpass";
    creakFilter.Q.setValueAtTime(4.5, creakTime);
    creakFilter.frequency.setValueAtTime(250, creakTime);

    // Modulate filter frequency with a low-frequency oscillator to model gritty wooden friction
    const lfo = this.ctx.createOscillator();
    lfo.type = "triangle";
    lfo.frequency.setValueAtTime(14, creakTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(110, creakTime);

    lfo.connect(lfoGain);
    lfoGain.connect(creakFilter.frequency);

    const creakGain = this.acquireGainNode(creakTime, creakDuration);
    creakGain.gain.setValueAtTime(0, creakTime);
    creakGain.gain.linearRampToValueAtTime(0.2, creakTime + 0.05);
    creakGain.gain.exponentialRampToValueAtTime(
      0.0001,
      creakTime + creakDuration,
    );

    noiseSource.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(masterGain);

    latchOsc1.start(now);
    latchOsc2.start(now);
    noiseSource.start(creakTime);
    lfo.start(creakTime);

    latchOsc1.stop(now + 0.08);
    latchOsc2.stop(now + 0.08);
    noiseSource.stop(creakTime + creakDuration);
    lfo.stop(creakTime + creakDuration);

    setTimeout(
      () => {
        try {
          lfo.disconnect();
          lfoGain.disconnect();
        } catch (e) {}
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeGildedChestOpen(now, dest) {
    const duration = 1.0;
    const masterGain = this.acquireGainNode(now, duration);
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(dest);

    // 1. Polished Wood Friction Creak (Starts at t = 0.0s)
    const creakDuration = 0.4;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const creakFilter = this.acquireFilterNode(now, creakDuration);
    creakFilter.type = "lowpass";
    creakFilter.Q.setValueAtTime(2.0, now);
    creakFilter.frequency.setValueAtTime(350, now);

    // Modulate with a smoother, slower LFO (8Hz, 40Hz depth)
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(8, now);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(40, now);

    lfo.connect(lfoGain);
    lfoGain.connect(creakFilter.frequency);

    const creakGain = this.acquireGainNode(now, creakDuration);
    creakGain.gain.setValueAtTime(0, now);
    creakGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    creakGain.gain.exponentialRampToValueAtTime(0.0001, now + creakDuration);

    noiseSource.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(masterGain);

    noiseSource.start(now);
    lfo.start(now);
    noiseSource.stop(now + creakDuration);
    lfo.stop(now + creakDuration);

    // 2. Bright Major-Triad Gold Chime (Arpeggio: C5, E5, G5, C6)
    const chimeNotes = [523.25, 659.25, 783.99, 1046.5];
    const chimeDelay = 0.055;
    const chimeDuration = 0.55;
    const chimeOscillators = [];

    chimeNotes.forEach((freq, idx) => {
      let timeOffset = now + 0.08 + idx * chimeDelay;
      let osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, timeOffset);

      let gNode = this.acquireGainNode(timeOffset, chimeDuration);
      gNode.gain.setValueAtTime(0, timeOffset);
      gNode.gain.linearRampToValueAtTime(0.06, timeOffset + 0.01);
      gNode.gain.exponentialRampToValueAtTime(
        0.0001,
        timeOffset + chimeDuration,
      );

      osc.connect(gNode);
      gNode.connect(masterGain);

      osc.start(timeOffset);
      osc.stop(timeOffset + chimeDuration);
      chimeOscillators.push(osc);
    });

    // 3. Coin-Rattle Cascade
    const coinFreqs = [1800, 2400, 2900, 3200];
    const coinDelay = 0.04;
    const coinOscillators = [];

    coinFreqs.forEach((freq, idx) => {
      let timeOffset = now + 0.18 + idx * coinDelay;
      let osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, timeOffset);

      let gNode = this.acquireGainNode(timeOffset, 0.05);
      gNode.gain.setValueAtTime(0, timeOffset);
      gNode.gain.linearRampToValueAtTime(0.08, timeOffset + 0.002);
      gNode.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.04);

      osc.connect(gNode);
      gNode.connect(masterGain);

      osc.start(timeOffset);
      osc.stop(timeOffset + 0.05);
      coinOscillators.push(osc);
    });

    setTimeout(
      () => {
        try {
          lfo.disconnect();
          lfoGain.disconnect();
        } catch (e) {}
        coinOscillators.forEach((osc) => {
          try {
            osc.disconnect();
          } catch (e) {}
        });
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeAstralChestOpen(now, dest) {
    const duration = 1.4;
    const masterGain = this.acquireGainNode(now, duration);
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(dest);

    // 1. FM Frequency Riser
    const modOsc = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    modOsc.frequency.setValueAtTime(15, now);
    modGain.gain.setValueAtTime(150, now);

    const carrierOsc = this.ctx.createOscillator();
    carrierOsc.type = "sine";
    carrierOsc.frequency.setValueAtTime(120, now);
    carrierOsc.frequency.exponentialRampToValueAtTime(800, now + 0.8);

    modOsc.connect(modGain);
    modGain.connect(carrierOsc.frequency);

    const fmGain = this.acquireGainNode(now, 0.8);
    fmGain.gain.setValueAtTime(0, now);
    fmGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    fmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    carrierOsc.connect(fmGain);
    fmGain.connect(masterGain);

    modOsc.start(now);
    carrierOsc.start(now);
    modOsc.stop(now + 0.8);
    carrierOsc.stop(now + 0.8);

    // 2. Crystal Sweep (Glimmering Major Triad)
    const sweepNotes = [1046.5, 1318.51, 1567.98, 2093.0];
    const sweepDelay = 0.08;
    const sweepDuration = 0.7;
    const sweepOscillators = [];

    sweepNotes.forEach((freq, idx) => {
      let timeOffset = now + 0.3 + idx * sweepDelay;
      let osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, timeOffset);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 1.5,
        timeOffset + sweepDuration,
      );

      let gNode = this.acquireGainNode(timeOffset, sweepDuration);
      gNode.gain.setValueAtTime(0, timeOffset);
      gNode.gain.linearRampToValueAtTime(0.06, timeOffset + 0.02);
      gNode.gain.exponentialRampToValueAtTime(
        0.0001,
        timeOffset + sweepDuration,
      );

      osc.connect(gNode);
      gNode.connect(masterGain);

      osc.start(timeOffset);
      osc.stop(timeOffset + sweepDuration);
      sweepOscillators.push(osc);
    });

    // 3. Deep Sub-Bass Hum
    const subOsc = this.ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(65, now + 0.1);
    subOsc.frequency.linearRampToValueAtTime(45, now + duration);

    const subGain = this.acquireGainNode(now, duration);
    subGain.gain.setValueAtTime(0, now + 0.1);
    subGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(masterGain);

    subOsc.start(now + 0.1);
    subOsc.stop(now + duration);

    setTimeout(
      () => {
        try {
          modOsc.disconnect();
          modGain.disconnect();
          carrierOsc.disconnect();
          subOsc.disconnect();
        } catch (e) {}
        sweepOscillators.forEach((osc) => {
          try {
            osc.disconnect();
          } catch (e) {}
        });
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeHit(now, dest, isCrit = false) {
    const duration = isCrit ? 0.16 : window.randFloat(0.08, 0.12);
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isCrit ? 0.45 : 0.32, now + 0.008);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(window.randFloat(1100, 1500), now);
    noiseFilter.frequency.linearRampToValueAtTime(
      window.randFloat(300, 450),
      now + duration,
    );
    noiseFilter.Q.setValueAtTime(3.5, now);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gainNode);

    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(window.randFloat(240, 310), now);
    osc.frequency.linearRampToValueAtTime(
      window.randFloat(70, 95),
      now + duration,
    );
    const oscGain = this.acquireGainNode(now, duration);
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(isCrit ? 0.2 : 0.12, now + 0.006);
    oscGain.gain.linearRampToValueAtTime(0, now + duration * 0.85);

    osc.connect(oscGain);
    oscGain.connect(gainNode);

    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + duration);
    osc.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeFleshImpact(now, dest, isCrit = false, pitchFactor = 1.0) {
    const duration = isCrit ? 0.2 : 0.12;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isCrit ? 0.35 : 0.22, now + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Low Thud Transient (Triangle wave thwack)
    const thudOsc = this.ctx.createOscillator();
    thudOsc.type = "triangle";
    thudOsc.frequency.setValueAtTime(150 * pitchFactor, now);
    thudOsc.frequency.exponentialRampToValueAtTime(
      50 * pitchFactor,
      now + 0.06,
    );

    const thudGain = this.acquireGainNode(now, duration);
    thudGain.gain.setValueAtTime(0.24, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    thudOsc.connect(thudGain);
    thudGain.connect(gainNode);

    // 2. Low-Mid Bandpass Noise Burst (Meaty impact squish)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.Q.setValueAtTime(2.0, now);
    noiseFilter.frequency.setValueAtTime(600 * pitchFactor, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(
      250 * pitchFactor,
      now + 0.08,
    );

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(isCrit ? 0.25 : 0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    // 3. High-Register Critical Splat ring (Critical hit only)
    if (isCrit) {
      const splatOsc = this.ctx.createOscillator();
      splatOsc.type = "sine";
      splatOsc.frequency.setValueAtTime(950 * pitchFactor, now);
      splatOsc.frequency.exponentialRampToValueAtTime(
        450 * pitchFactor,
        now + 0.12,
      );

      const splatGain = this.acquireGainNode(now, duration);
      splatGain.gain.setValueAtTime(0.12, now);
      splatGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      splatOsc.connect(splatGain);
      splatGain.connect(gainNode);

      splatOsc.start(now);
      splatOsc.stop(now + duration);
    }

    thudOsc.start(now);
    noiseSource.start(now);

    thudOsc.stop(now + duration);
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeMetalImpact(now, dest, isCrit = false, pitchFactor = 1.0) {
    const duration = isCrit ? 0.32 : 0.24;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isCrit ? 0.32 : 0.18, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Sharp Hard-Surface Impact Transient (Highpass white noise)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(3500 * pitchFactor, now);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(isCrit ? 0.22 : 0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    // 2. High-Q Inharmonic Metal Ring (Dual-oscillators)
    const metalFilter = this.acquireFilterNode(now, duration);
    metalFilter.type = "bandpass";
    metalFilter.Q.setValueAtTime(8.0, now); // high resonance
    metalFilter.frequency.setValueAtTime(1400 * pitchFactor, now);
    metalFilter.frequency.linearRampToValueAtTime(
      1200 * pitchFactor,
      now + duration,
    );

    const osc1 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1400 * pitchFactor, now);

    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1980 * pitchFactor, now);

    const chimeGain = this.acquireGainNode(now, duration);
    chimeGain.gain.setValueAtTime(0.24, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.95);

    osc1.connect(metalFilter);
    osc2.connect(metalFilter);
    metalFilter.connect(chimeGain);
    chimeGain.connect(gainNode);

    noiseSource.start(now);
    osc1.start(now);
    osc2.start(now);

    noiseSource.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    setTimeout(
      () => {
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeShatterImpact(now, dest, isCrit = false, pitchFactor = 1.0) {
    const duration = isCrit ? 0.22 : 0.14;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(isCrit ? 0.3 : 0.18, now + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Clay-Cracking Noise Burst (Bandpass noise)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.Q.setValueAtTime(1.2, now);
    noiseFilter.frequency.setValueAtTime(1000 * pitchFactor, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(
      400 * pitchFactor,
      now + 0.08,
    );

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(isCrit ? 0.28 : 0.16, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    gainNode.connect(dest);

    // 2. High-Register Shard Resonances (Random-pitched sine pings)
    const pingsCount = isCrit ? 3 : 1;
    const pingOscillators = [];
    const pingGains = [];

    for (let i = 0; i < pingsCount; i++) {
      let delay = i * 0.015;
      let pingFreq = (1200 + Math.random() * 2300) * pitchFactor; // 1200Hz to 3500Hz
      let pingDur = 0.04 + Math.random() * 0.04; // 40ms to 80ms

      let osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pingFreq, now + delay);

      let gNode = this.acquireGainNode(now, duration);
      gNode.gain.setValueAtTime(0, now);
      gNode.gain.setValueAtTime(0, now + delay);
      gNode.gain.linearRampToValueAtTime(0.08, now + delay + 0.002);
      gNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + pingDur);

      osc.connect(gNode);
      gNode.connect(gainNode);

      osc.start(now + delay);
      osc.stop(now + delay + pingDur + 0.05);

      pingOscillators.push(osc);
      pingGains.push(gNode);
    }

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        pingOscillators.forEach((osc) => {
          try {
            osc.disconnect();
          } catch (e) {}
        });
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  playHitImpact(isCrit = false, targetType = "flesh") {
      const settings = this.getSafeSettings();
      if (settings.mute) return;
      if (!this.init()) return;

    // Auto-recovery watchdog to prevent channel lockout from suspended timers or errors
    const now = this.ctx.currentTime;
    const lastPlay = this._lastPlayTime || 0;
    if (now - lastPlay > 2.0) {
      this.activeChannelCount = 0;
    }
    this._lastPlayTime = now;

    if (this.activeChannelCount >= this.maxConcurrent) return;
    this.activeChannelCount++;
    const dest = this.sfxGain;

    // Subphase 3.4 Asymptotic Combo Pitch-Compressor Tracking
    const nowMs = Date.now();
    const lastHit = this.lastHitTime || 0;
    if (nowMs - lastHit < 1200) {
      this.comboCount = Math.min(8, (this.comboCount || 0) + 1);
    } else {
      this.comboCount = 0;
    }
    this.lastHitTime = nowMs;

    // Asymptotic multiplier curve: P(combo) = 1.0 + (0.25 * combo) / (combo + 3)
    let pitchFactor = 1.0 + (0.25 * this.comboCount) / (this.comboCount + 3.0);
    // Subtle +/- 1.5% micro-detuning prevents auditory repetition patterns and prevents neurological listening fatigue
    pitchFactor *= 1.0 + (Math.random() - 0.5) * 0.03;

    if (targetType === "flesh") {
      this.synthesizeFleshImpact(now, dest, isCrit, pitchFactor);
    } else if (targetType === "metal") {
      this.synthesizeMetalImpact(now, dest, isCrit, pitchFactor);
    } else if (targetType === "shatter") {
      this.synthesizeShatterImpact(now, dest, isCrit, pitchFactor);
    } else {
      this.synthesizeFleshImpact(now, dest, isCrit, pitchFactor);
    }
  },

  synthesizeBlock(now, dest) {
    const duration = 0.16;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.004); // Boosted from 0.11
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const baseOsc = this.ctx.createOscillator();
    baseOsc.type = "triangle";
    baseOsc.frequency.setValueAtTime(130, now);
    baseOsc.frequency.linearRampToValueAtTime(45, now + 0.09);
    const baseGain = this.acquireGainNode(now, duration);
    baseGain.gain.setValueAtTime(0, now);
    baseGain.gain.linearRampToValueAtTime(0.14, now + 0.005); // Boosted from 0.06
    baseGain.gain.linearRampToValueAtTime(0, now + 0.09);
    baseOsc.connect(baseGain);
    baseGain.connect(gainNode);

    const ironChime1 = this.ctx.createOscillator();
    ironChime1.type = "sine";
    ironChime1.frequency.setValueAtTime(440, now);
    const ironChime2 = this.ctx.createOscillator();
    ironChime2.type = "sine";
    ironChime2.frequency.setValueAtTime(659.25, now);
    const chimeGain = this.acquireGainNode(now, duration);
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.09, now + 0.005); // Boosted from 0.03
    chimeGain.gain.linearRampToValueAtTime(0, now + duration);
    ironChime1.connect(chimeGain);
    ironChime2.connect(chimeGain);
    chimeGain.connect(gainNode);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1400, now);
    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.005); // Boosted from 0.02
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.06);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    baseOsc.start(now);
    ironChime1.start(now);
    ironChime2.start(now);
    noiseSource.start(now);
    baseOsc.stop(now + duration);
    ironChime1.stop(now + duration);
    ironChime2.stop(now + duration);
    noiseSource.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeParry(now, dest) {
    const duration = 0.45;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.24, now + 0.004); // Boosted from 0.09
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const frequencies = [880, 1046.5, 1318.5, 1760];
    const oscillators = [];
    const metalGain = this.acquireGainNode(now, duration);
    metalGain.gain.setValueAtTime(0, now);
    metalGain.gain.linearRampToValueAtTime(0.12, now + 0.005); // Boosted from 0.04
    metalGain.gain.linearRampToValueAtTime(0, now + 0.32);
    frequencies.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(
        f + window.randFloat(-10, 10),
        now + 0.18,
      );
      osc.connect(metalGain);
      oscillators.push(osc);
    });

    const pingOsc = this.ctx.createOscillator();
    pingOsc.type = "triangle";
    pingOsc.frequency.setValueAtTime(2400, now);
    pingOsc.frequency.linearRampToValueAtTime(1100, now + 0.045);
    const pingGain = this.acquireGainNode(now, duration);
    pingGain.gain.setValueAtTime(0, now);
    pingGain.gain.linearRampToValueAtTime(0.14, now + 0.003); // Boosted from 0.05
    pingGain.gain.linearRampToValueAtTime(0, now + 0.045);
    pingOsc.connect(pingGain);
    pingGain.connect(gainNode);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3200, now);
    noiseFilter.Q.setValueAtTime(3.5, now);
    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.05, now + 0.005); // Boosted from 0.018
    noiseGain.gain.linearRampToValueAtTime(0, now + duration);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    metalGain.connect(gainNode);

    oscillators.forEach((o) => o.start(now));
    pingOsc.start(now);
    noiseSource.start(now);
    oscillators.forEach((o) => o.stop(now + duration));
    pingOsc.stop(now + duration);
    noiseSource.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeSpell(now, dest) {
    const duration = 0.55;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Shifting Chord (Detuned chorus/unison effect)
    const freqs = [329.63, 392.0, 493.88, 587.33];
    const oscillators = [];
    const chordGain = this.acquireGainNode(now, duration);
    chordGain.gain.setValueAtTime(0.15, now);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const bpFilter = this.acquireFilterNode(now, duration);
    bpFilter.type = "bandpass";
    bpFilter.frequency.setValueAtTime(400, now);
    bpFilter.frequency.exponentialRampToValueAtTime(3200, now + 0.45);
    bpFilter.Q.setValueAtTime(6.0, now);

    // Filter frequency modulation (Arcane Swirl LFO)
    const lfo = this.ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(14, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, now);

    lfo.connect(lfoGain);
    lfoGain.connect(bpFilter.frequency);

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(f + (idx * 2 - 3), now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + duration);
      osc.connect(bpFilter);
      oscillators.push(osc);
    });

    bpFilter.connect(chordGain);
    chordGain.connect(gainNode);

    // 2. High-Frequency Shimmer Sparkles
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.Q.setValueAtTime(8.0, now);
    noiseFilter.frequency.setValueAtTime(6000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1500, now + 0.4);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    lfo.start(now);
    oscillators.forEach((osc) => osc.start(now));
    noiseSource.start(now);

    lfo.stop(now + duration);
    oscillators.forEach((osc) => osc.stop(now + duration));
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        try {
          lfo.disconnect();
          lfoGain.disconnect();
        } catch (e) {}
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeSpellFire(now, dest) {
    const duration = 0.5;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Molten Core Expansion (Dual low-register pitch dropping thuds)
    const boomOsc1 = this.ctx.createOscillator();
    boomOsc1.type = "triangle";
    boomOsc1.frequency.setValueAtTime(140, now);
    boomOsc1.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    const boomOsc2 = this.ctx.createOscillator();
    boomOsc2.type = "sawtooth";
    boomOsc2.frequency.setValueAtTime(85, now);
    boomOsc2.frequency.exponentialRampToValueAtTime(25, now + 0.2);

    const boomFilter = this.acquireFilterNode(now, duration);
    boomFilter.type = "lowpass";
    boomFilter.frequency.setValueAtTime(160, now);

    const boomGain = this.acquireGainNode(now, duration);
    boomGain.gain.setValueAtTime(0.22, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    boomOsc1.connect(boomFilter);
    boomOsc2.connect(boomFilter);
    boomFilter.connect(boomGain);
    boomGain.connect(gainNode);

    // 2. Embers Combustion & Hiss
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    // 3. Popping Crackles (Micro transient bursts)
    const crackleCount = 4;
    const crackleOscillators = [];
    for (let i = 0; i < crackleCount; i++) {
      let offset = now + 0.05 + i * 0.08 + Math.random() * 0.04;
      let osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1800 + Math.random() * 600, offset);

      let gNode = this.acquireGainNode(offset, 0.02);
      gNode.gain.setValueAtTime(0, offset);
      gNode.gain.linearRampToValueAtTime(0.06, offset + 0.001);
      gNode.gain.exponentialRampToValueAtTime(0.0001, offset + 0.015);

      osc.connect(gNode);
      gNode.connect(gainNode);

      osc.start(offset);
      osc.stop(offset + 0.02);
      crackleOscillators.push(osc);
    }

    boomOsc1.start(now);
    boomOsc2.start(now);
    noiseSource.start(now);

    boomOsc1.stop(now + 0.3);
    boomOsc2.stop(now + 0.3);
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        try {
          boomOsc1.disconnect();
          boomOsc2.disconnect();
          boomFilter.disconnect();
          noiseFilter.disconnect();
        } catch (e) {}
        crackleOscillators.forEach((osc) => {
          try {
            osc.disconnect();
          } catch (e) {}
        });
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeSpellLightning(now, dest) {
    const duration = 0.28;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.26, now + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Sawtooth Electrical Zap with AM Modulator
    const zapOsc = this.ctx.createOscillator();
    zapOsc.type = "sawtooth";
    zapOsc.frequency.setValueAtTime(1600, now);
    zapOsc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

    const zapGain = this.acquireGainNode(now, duration);
    zapGain.gain.setValueAtTime(0.14, now);
    zapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    const AMMod = this.ctx.createOscillator();
    AMMod.type = "square";
    AMMod.frequency.setValueAtTime(32, now);
    const AMGain = this.ctx.createGain();
    AMGain.gain.setValueAtTime(0.6, now);

    AMMod.connect(AMGain);
    AMGain.connect(zapGain.gain);

    zapOsc.connect(zapGain);
    zapGain.connect(gainNode);

    // 2. Highpass Static Crackle Discharge
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(2200, now);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.24, now + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    zapOsc.start(now);
    AMMod.start(now);
    noiseSource.start(now);

    zapOsc.stop(now + 0.2);
    AMMod.stop(now + 0.2);
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        try {
          zapOsc.disconnect();
          AMMod.disconnect();
          AMGain.disconnect();
          noiseFilter.disconnect();
        } catch (e) {}
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeSpellFrost(now, dest) {
    const duration = 0.65;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Shimmering Glacial Triad Sweep
    const freqs = [1046.5, 1318.51, 1567.98, 2093.0];
    const oscillators = [];

    const chimeGain = this.acquireGainNode(now, duration);
    chimeGain.gain.setValueAtTime(0.08, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f + (idx * 4 - 6), now);
      osc.frequency.linearRampToValueAtTime(f * 0.94, now + duration);
      osc.connect(chimeGain);
      oscillators.push(osc);
    });
    chimeGain.connect(gainNode);

    // 2. Glacial Wind Frost Friction
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const noiseFilter = this.acquireFilterNode(now, duration);
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(2800, now);
    noiseFilter.Q.setValueAtTime(4.5, now);

    const windLFO = this.ctx.createOscillator();
    windLFO.type = "sine";
    windLFO.frequency.setValueAtTime(5, now);
    const windLFOGain = this.ctx.createGain();
    windLFOGain.gain.setValueAtTime(300, now);

    windLFO.connect(windLFOGain);
    windLFOGain.connect(noiseFilter.frequency);

    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.85);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    oscillators.forEach((o) => o.start(now));
    windLFO.start(now);
    noiseSource.start(now);

    oscillators.forEach((o) => o.stop(now + duration));
    windLFO.stop(now + duration);
    noiseSource.stop(now + duration);

    setTimeout(
      () => {
        try {
          windLFO.disconnect();
          windLFOGain.disconnect();
          noiseFilter.disconnect();
        } catch (e) {}
        this.activeChannelCount = Math.max(0, this.activeChannelCount - 1);
      },
      duration * 1000 + 40,
    );
  },

  synthesizeFairy(now, dest) {
    const notes = [987.77, 1318.51, 1975.53];
    const noteLength = 0.05;
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.045;
      const osc = this.ctx.createOscillator();
      const noteGain = this.acquireGainNode(noteTime, noteLength);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);
      noteGain.gain.setValueAtTime(0, noteTime);
      noteGain.gain.linearRampToValueAtTime(0.18, noteTime + 0.005); // Boosted from 0.06
      noteGain.gain.linearRampToValueAtTime(0, noteTime + noteLength);
      osc.connect(noteGain);
      osc.start(noteTime);
      osc.stop(noteTime + noteLength);
    });
    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      250,
    );
  },

  synthesizeDeath(now, dest) {
    const duration = 0.35;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.24, now + 0.01); // Boosted from 0.09
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const lowOsc = this.ctx.createOscillator();
    lowOsc.type = "triangle";
    lowOsc.frequency.setValueAtTime(120, now);
    lowOsc.frequency.linearRampToValueAtTime(25, now + 0.12);
    const lowGain = this.acquireGainNode(now, duration);
    lowGain.gain.setValueAtTime(0, now);
    lowGain.gain.linearRampToValueAtTime(0.14, now + 0.01); // Boosted from 0.05
    lowGain.gain.linearRampToValueAtTime(0, now + 0.15);
    lowOsc.connect(lowGain);
    lowGain.connect(gainNode);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.cachedNoiseBuffer;

    const lpFilter = this.acquireFilterNode(now, duration);
    lpFilter.type = "lowpass";
    lpFilter.frequency.setValueAtTime(600, now);
    lpFilter.frequency.linearRampToValueAtTime(80, now + duration);
    const noiseGain = this.acquireGainNode(now, duration);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.01); // Boosted from 0.04
    noiseGain.gain.linearRampToValueAtTime(0, now + duration);
    noiseSource.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    const soulOsc = this.ctx.createOscillator();
    soulOsc.type = "sine";
    soulOsc.frequency.setValueAtTime(800, now);
    soulOsc.frequency.linearRampToValueAtTime(100, now + duration);
    const soulGain = this.acquireGainNode(now, duration);
    soulGain.gain.setValueAtTime(0, now);
    soulGain.gain.linearRampToValueAtTime(0.04, now + 0.01); // Boosted from 0.015
    soulGain.gain.linearRampToValueAtTime(0, now + duration);
    soulOsc.connect(soulGain);
    soulGain.connect(gainNode);

    lowOsc.start(now);
    noiseSource.start(now);
    soulOsc.start(now);
    lowOsc.stop(now + duration);
    noiseSource.stop(now + duration);
    soulOsc.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeDefeat(now, dest) {
    const duration = 1.6;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.36, now + 0.05); // Boosted from 0.18
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const freqs = [87.31, 110.0, 130.81, 174.61];
    const oscillators = [];
    const lowpass = this.acquireFilterNode(now, duration);
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(350, now);
    lowpass.frequency.linearRampToValueAtTime(80, now + duration);
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.99, now + duration);
      osc.connect(lowpass);
      oscillators.push(osc);
    });

    const subOsc = this.ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(43.65, now);
    const subGain = this.acquireGainNode(now, 0.8);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.24, now + 0.02); // Boosted from 0.1
    subGain.gain.linearRampToValueAtTime(0, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(gainNode);

    lowpass.connect(gainNode);

    oscillators.forEach((o) => o.start(now));
    subOsc.start(now);
    oscillators.forEach((o) => o.stop(now + duration));
    subOsc.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  synthesizeRevive(now, dest) {
    const duration = 1.8;
    const gainNode = this.acquireGainNode(now, duration);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.32, now + 0.15); // Boosted from 0.15
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const noteTime = now + delay;
      const chimeOsc = this.ctx.createOscillator();
      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(freq, noteTime);
      const chimeGain = this.acquireGainNode(noteTime, 0.6);
      chimeGain.gain.setValueAtTime(0, noteTime);
      chimeGain.gain.linearRampToValueAtTime(0.12, noteTime + 0.01); // Boosted from 0.035
      chimeGain.gain.linearRampToValueAtTime(0, noteTime + 0.6);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(gainNode);
      chimeOsc.start(noteTime);
      chimeOsc.stop(noteTime + 0.65);
    });

    const padOsc1 = this.ctx.createOscillator();
    padOsc1.type = "triangle";
    padOsc1.frequency.setValueAtTime(130.81, now);
    const padOsc2 = this.ctx.createOscillator();
    padOsc2.type = "triangle";
    padOsc2.frequency.setValueAtTime(164.81, now);
    const padGain = this.acquireGainNode(now, duration);
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.14, now + 0.4); // Boosted from 0.06
    padGain.gain.linearRampToValueAtTime(0, now + duration);
    padOsc1.connect(padGain);
    padOsc2.connect(padGain);

    padOsc1.start(now);
    padOsc2.start(now);
    padOsc1.stop(now + duration);
    padOsc2.stop(now + duration);

    setTimeout(
      () =>
        (this.activeChannelCount = Math.max(0, this.activeChannelCount - 1)),
      duration * 1000 + 40,
    );
  },

  playCoinCollect() {
    if (!this.init()) return;
    let audioCtx = this.ctx;

    let nowMs = Date.now();
    let lastCollect = window.SoundManager.lastCoinCollectTime || 0;
    let cascadeIdx = window.SoundManager.coinCascadeIndex || 0;

    // Faster micro-throttle (35ms) to handle click storms cleanly while keeping feedback instant
    if (nowMs - lastCollect < 35) return;

    // High-fidelity major pentatonic scale register for positive progression feedback
    const scale = [659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51, 1567.98];

    if (nowMs - lastCollect < 300) {
      cascadeIdx = (cascadeIdx + 1) % scale.length;
    } else {
      cascadeIdx = 0;
    }

    window.SoundManager.lastCoinCollectTime = nowMs;
    window.SoundManager.coinCascadeIndex = cascadeIdx;

    const settings = window.SoundManager.getSafeSettings();
        let finalVol = settings.master * settings.sfx;
        if (settings.mute || finalVol <= 0) return;

    let now = audioCtx.currentTime;
    let activeNodes = [];
    let destNode = this.sfxGain;

    // Synthesizes a snappy, rattling Tap Titans 2 style coin collect sound
    const playTapTitansStyleCoin = (startTime, baseFreq, volFactor) => {
      // 1. High-Pass Foley Noise (Models the dry, physical sliding friction of coins)
      let noiseBuffer = window.SoundManager.cachedNoiseBuffer;
      if (noiseBuffer) {
        let noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        let bandpass = audioCtx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.Q.setValueAtTime(5.0, startTime);
        // Rapid downward frequency sweep mimics physical friction settling
        bandpass.frequency.setValueAtTime(5000, startTime);
        bandpass.frequency.exponentialRampToValueAtTime(1500, startTime + 0.05);

        let noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0, startTime);
        noiseGain.gain.linearRampToValueAtTime(
          finalVol * 0.14 * volFactor,
          startTime + 0.001,
        );
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045); // Snappy, clean rustle

        noiseSource.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(destNode);

        noiseSource.start(startTime);
        noiseSource.stop(startTime + 0.06);
        activeNodes.push(noiseSource, bandpass, noiseGain);
      }

      // 2. High-Pitch Metallic Click (The instant, crisp "clink" of coin impact)
      let clickOsc1 = audioCtx.createOscillator();
      let clickOsc2 = audioCtx.createOscillator();
      clickOsc1.type = "sine";
      clickOsc2.type = "sine";

      // Precise inharmonic frequencies representing high-frequency metallic edge
      let clickFreq1 = baseFreq * 2.82;
      let clickFreq2 = baseFreq * 4.15;

      clickOsc1.frequency.setValueAtTime(clickFreq1 * 1.15, startTime);
      clickOsc1.frequency.exponentialRampToValueAtTime(
        clickFreq1,
        startTime + 0.01,
      );
      clickOsc2.frequency.setValueAtTime(clickFreq2 * 1.15, startTime);
      clickOsc2.frequency.exponentialRampToValueAtTime(
        clickFreq2,
        startTime + 0.01,
      );

      let clickGain = audioCtx.createGain();
      clickGain.gain.setValueAtTime(0, startTime);
      clickGain.gain.linearRampToValueAtTime(
        finalVol * 0.12 * volFactor,
        startTime + 0.001,
      );
      clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025); // Damped almost instantly

      clickOsc1.connect(clickGain);
      clickOsc2.connect(clickGain);
      clickGain.connect(destNode);

      clickOsc1.start(startTime);
      clickOsc2.start(startTime);
      clickOsc1.stop(startTime + 0.04);
      clickOsc2.stop(startTime + 0.04);
      activeNodes.push(clickOsc1, clickOsc2, clickGain);

      // 3. Resonant Gold Ring (The pure, rewarding body of the coin)
      let ringOsc = audioCtx.createOscillator();
      ringOsc.type = "sine";

      ringOsc.frequency.setValueAtTime(baseFreq * 1.05, startTime);
      ringOsc.frequency.exponentialRampToValueAtTime(
        baseFreq,
        startTime + 0.015,
      );

      let ringGain = audioCtx.createGain();
      ringGain.gain.setValueAtTime(0, startTime);
      ringGain.gain.linearRampToValueAtTime(
        finalVol * 0.18 * volFactor,
        startTime + 0.002,
      );
      ringGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09); // Short, clean ring to avoid fatigue

      // Low-frequency filter to keep the audio pristine during heavy click storms
      let ringFilter = audioCtx.createBiquadFilter();
      ringFilter.type = "highpass";
      ringFilter.frequency.setValueAtTime(250, startTime);

      ringOsc.connect(ringFilter);
      ringFilter.connect(ringGain);
      ringGain.connect(destNode);

      ringOsc.start(startTime);
      ringOsc.stop(startTime + 0.11);
      activeNodes.push(ringOsc, ringFilter, ringGain);
    };

    // Jitter pitch slightly (+/- 6Hz) for unique sound instances
    let baseFreq = scale[cascadeIdx] + (Math.random() * 12 - 6);

    // Primary strike
    playTapTitansStyleCoin(now, baseFreq, 1.0);

    // Secondary micro-delayed strike (ultra-tight 18ms clatter for organic coin interaction)
    let bounceDelay = 0.018;
    let bounceFreq = baseFreq * 1.22 + (Math.random() * 10 - 5); // Harmonic major-third step up
    playTapTitansStyleCoin(now + bounceDelay, bounceFreq, 0.65);

    // Safely cleanup all scheduled nodes
    setTimeout(() => {
      activeNodes.forEach((node) => {
        try {
          node.disconnect();
        } catch (err) {}
      });
    }, 220);
  },
};

/* --- PROCEDURAL LOOT DROP ACOUSTIC SYNTHESIZER --- */
window.SoundManager.playLootDrop = function (stars) {
  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  let s = parseInt(stars, 10);
  if (isNaN(s)) {
    if (stars === "UNIQUE") s = 5;
    else s = 0;
  }
  s = Math.max(0, Math.min(5, s));

  let decayDuration = 0.25 * Math.exp(0.35 * s);
  decayDuration = Math.max(0.2, Math.min(1.8, decayDuration));

  let activeOscillatorsCount = 1 + Math.floor(s * 0.6);

  let lfoRate = 4.0 + s * 1.5;
  let lfoDepth = Math.max(0, (s - 2) * 5.0);

  let baseFreq = 261.63;
  if (s === 1) baseFreq = 329.63;
  if (s === 2) baseFreq = 392.0;
  if (s === 3) baseFreq = 523.25;
  if (s === 4) baseFreq = 659.25;
  if (s === 5) baseFreq = 783.99;

  const chordMultipliers = [1.0, 1.25, 1.5, 1.875];

  let masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(finalVol * 0.12, now + 0.015); // Slightly lowered for headroom
  masterGain.gain.linearRampToValueAtTime(0, now + decayDuration);
  masterGain.connect(window.SoundManager.sfxGain);

  let lfo = null;
  let lfoGain = null;
  if (lfoDepth > 0) {
    lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(lfoRate, now);
    lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(lfoDepth, now);
    lfo.connect(lfoGain);
    lfo.start(now);
  }

  let oscillators = [];
  for (let i = 0; i < activeOscillatorsCount; i++) {
    let osc = audioCtx.createOscillator();
    let mult = chordMultipliers[i] || 1.0;
    let targetFreq = baseFreq * mult;

    if (i > 0) {
      osc.detune.setValueAtTime((i % 2 === 0 ? 5 : -5) * (s * 0.5), now);
    }

    if (s >= 4) {
      osc.type = i % 2 === 0 ? "triangle" : "sine";
    } else {
      osc.type = "sine";
    }

    osc.frequency.setValueAtTime(targetFreq, now);

    if (lfoGain) {
      lfoGain.connect(osc.frequency);
    }

    let delayOffset = 0;
    if (s >= 3 && i > 0) {
      delayOffset = i * 0.075;
    }

    let oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.setValueAtTime(0, now + delayOffset);
    oscGain.gain.linearRampToValueAtTime(
      0.85 / activeOscillatorsCount, // Calibrated gain
      now + delayOffset + 0.02,
    );
    oscGain.gain.linearRampToValueAtTime(0, now + decayDuration);

    osc.connect(oscGain);
    oscGain.connect(masterGain);

    osc.start(now + delayOffset);
    osc.stop(now + decayDuration + 0.1);
    oscillators.push(osc);
  }

  setTimeout(
    () => {
      if (lfo) lfo.disconnect();
      if (lfoGain) lfoGain.disconnect();
      oscillators.forEach((osc) => osc.disconnect());
      masterGain.disconnect();
    },
    (decayDuration + 0.5) * 1000,
  );
};

/* --- TACTILE INTERFACE SYNTHESIZER & AUTO-BINDINGS --- */

// Track timestamp to prevent sweep fatigue
window.SoundManager.lastHoverTime = 0;

// 1. Synthesize a Satisfying, Soft, "Bubbly Pop" Button Click
window.SoundManager.playClick = function () {
  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Primary bubble pop: short, upward-sweeping pure sine wave
  let osc1 = audioCtx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(450, now);
  osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.035);

  let gain1 = audioCtx.createGain();
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(finalVol * 0.18, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  osc1.connect(gain1);
  gain1.connect(window.SoundManager.sfxGain);

  // Secondary bubble pop: tiny companion offset to complete the bubbly "pop" texture
  let osc2 = audioCtx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(700, now + 0.01);
  osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.03);

  let gain2 = audioCtx.createGain();
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0, now + 0.01);
  gain2.gain.linearRampToValueAtTime(finalVol * 0.1, now + 0.014);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc2.connect(gain2);
  gain2.connect(window.SoundManager.sfxGain);

  osc1.start(now);
  osc1.stop(now + 0.06);
  osc2.start(now + 0.01);
  osc2.stop(now + 0.06);

  setTimeout(() => {
    osc1.disconnect();
    gain1.disconnect();
    osc2.disconnect();
    gain2.disconnect();
  }, 150);
};

// 2. Synthesize Reward/Purchase "Gold Chime & Settle" Sound
window.SoundManager.playPurchase = function () {
  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Phase A: Rewarding upward pentatonic cascade (magical transition)
  const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
  const noteDelay = 0.035; // Fast, cascading roll
  const oscs = [];
  const gains = [];

  notes.forEach((freq, index) => {
    let osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + index * noteDelay);

    let gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.setValueAtTime(0, now + index * noteDelay);
    gainNode.gain.linearRampToValueAtTime(
      finalVol * 0.06, // Calibrated gain
      now + index * noteDelay + 0.01,
    );
    gainNode.gain.linearRampToValueAtTime(0, now + index * noteDelay + 0.22);

    osc.connect(gainNode);
    gainNode.connect(window.SoundManager.sfxGain);

    oscs.push(osc);
    gains.push(gainNode);
  });

  // Phase B: High-resonance crystal "coin ring" at the cascade's peak
  let coinOsc1 = audioCtx.createOscillator();
  let coinOsc2 = audioCtx.createOscillator();
  coinOsc1.type = "sine";
  coinOsc2.type = "sine";
  coinOsc1.frequency.setValueAtTime(2600, now + 0.12);
  coinOsc2.frequency.setValueAtTime(3900, now + 0.12);

  let coinGain = audioCtx.createGain();
  coinGain.gain.setValueAtTime(0, now);
  coinGain.gain.setValueAtTime(0, now + 0.12);
  coinGain.gain.linearRampToValueAtTime(finalVol * 0.09, now + 0.125); // Calibrated gain
  coinGain.gain.linearRampToValueAtTime(0, now + 0.12 + 0.18);

  coinOsc1.connect(coinGain);
  coinOsc2.connect(coinGain);
  coinGain.connect(window.SoundManager.sfxGain);

  coinOsc1.start(now + 0.12);
  coinOsc2.start(now + 0.12);
  coinOsc1.stop(now + 0.35);
  coinOsc2.stop(now + 0.35);

  // Phase C: Warm structural "settle" (subtle bass anchor indicating a resolved transaction)
  let settleOsc = audioCtx.createOscillator();
  settleOsc.type = "triangle";
  settleOsc.frequency.setValueAtTime(140, now + 0.05);
  settleOsc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

  let settleGain = audioCtx.createGain();
  settleGain.gain.setValueAtTime(0, now);
  settleGain.gain.setValueAtTime(0, now + 0.05);
  settleGain.gain.linearRampToValueAtTime(finalVol * 0.11, now + 0.08); // Calibrated gain
  settleGain.gain.linearRampToValueAtTime(0, now + 0.28);

  settleOsc.connect(settleGain);
  settleGain.connect(window.SoundManager.sfxGain);

  settleOsc.start(now + 0.05);
  settleOsc.stop(now + 0.35);

  setTimeout(() => {
    oscs.forEach((o) => o.disconnect());
    gains.forEach((g) => g.disconnect());
    coinOsc1.disconnect();
    coinOsc2.disconnect();
    coinGain.disconnect();
    settleOsc.disconnect();
    settleGain.disconnect();
  }, 500);
};

// 3. Synthesize Ethereal Hover Glide (with fatigue throttle)
window.SoundManager.playHover = function () {
  let nowMs = Date.now();
  if (nowMs - window.SoundManager.lastHoverTime < 120) return;
  window.SoundManager.lastHoverTime = nowMs;

  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;
  let duration = 0.11;

  let osc = audioCtx.createOscillator();
  osc.type = "sine";

  osc.frequency.setValueAtTime(659.25, now);
  osc.frequency.linearRampToValueAtTime(1318.51, now + 0.075);

  let gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(finalVol * 0.02, now + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gainNode);
  gainNode.connect(window.SoundManager.sfxGain);

  osc.start(now);
  osc.stop(now + duration + 0.05);

  setTimeout(
    () => {
      osc.disconnect();
      gainNode.disconnect();
    },
    (duration + 0.1) * 1000,
  );
};

// 4. Synthesize Sigil Sack Opening Chime sequence
window.SoundManager.playSigilSackOpen = function () {
  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Cloth/drawstring rustle burst (bandpass-filtered white noise)
  let rustleDuration = 0.12;
  let noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = window.SoundManager.cachedNoiseBuffer; // Safe zero-allocation cache lookup

  let noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1000, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(300, now + rustleDuration);
  noiseFilter.Q.setValueAtTime(2, now);

  let noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + rustleDuration);

  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(window.SoundManager.sfxGain);
  noiseNode.start(now);
  noiseNode.stop(now + rustleDuration + 0.05);

  // Heavy Sigil Stone Tumbling (resonance thump)
  let thudOsc = audioCtx.createOscillator();
  thudOsc.type = "triangle";
  thudOsc.frequency.setValueAtTime(160, now + 0.04);
  thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.14);

  let thudGain = audioCtx.createGain();
  thudGain.gain.setValueAtTime(0, now);
  thudGain.gain.setValueAtTime(0, now + 0.04);
  thudGain.gain.linearRampToValueAtTime(finalVol * 0.18, now + 0.05); // Calibrated gain
  thudGain.gain.linearRampToValueAtTime(0, now + 0.16);

  thudOsc.connect(thudGain);
  thudGain.connect(window.SoundManager.sfxGain);
  thudOsc.start(now + 0.04);
  thudOsc.stop(now + 0.2);

  // Rising detuned magical sigil glow (Fifth Interval: C4/G4 -> C5/G5)
  let sweepDur = 0.35;
  let sweepOsc1 = audioCtx.createOscillator();
  let sweepOsc2 = audioCtx.createOscillator();
  sweepOsc1.type = "sine";
  sweepOsc2.type = "sine";

  sweepOsc1.frequency.setValueAtTime(261.63, now + 0.08);
  sweepOsc1.frequency.exponentialRampToValueAtTime(
    523.25,
    now + 0.08 + sweepDur,
  );
  sweepOsc2.frequency.setValueAtTime(392.0, now + 0.08);
  sweepOsc2.frequency.exponentialRampToValueAtTime(
    783.99,
    now + 0.08 + sweepDur,
  );

  let sweepGain = audioCtx.createGain();
  sweepGain.gain.setValueAtTime(0, now);
  sweepGain.gain.setValueAtTime(0, now + 0.08);
  sweepGain.gain.linearRampToValueAtTime(finalVol * 0.09, now + 0.18); // Calibrated gain
  sweepGain.gain.linearRampToValueAtTime(0, now + 0.08 + sweepDur);

  sweepOsc1.connect(sweepGain);
  sweepOsc2.connect(sweepGain);
  sweepGain.connect(window.SoundManager.sfxGain);

  sweepOsc1.start(now + 0.08);
  sweepOsc2.start(now + 0.08);
  sweepOsc1.stop(now + 0.08 + sweepDur + 0.05);
  sweepOsc2.stop(now + 0.08 + sweepDur + 0.05);

  setTimeout(() => {
    noiseNode.disconnect();
    noiseFilter.disconnect();
    noiseGain.disconnect();
    thudOsc.disconnect();
    thudGain.disconnect();
    sweepOsc1.disconnect();
    sweepOsc2.disconnect();
    sweepGain.disconnect();
  }, 600);
};

// 5. Synthesize Monster Card Pack Opening sequence
window.SoundManager.playCardPackOpen = function () {
  if (!window.SoundManager.init()) return;
  let audioCtx = window.SoundManager.ctx;

  const settings = window.SoundManager.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Foil pack tearing sound (amplitude-modulated white noise)
  let tearDur = 0.18;
  let tearNode = audioCtx.createBufferSource();
  tearNode.buffer = window.SoundManager.cachedNoiseBuffer; // Safe zero-allocation cache lookup

  let tearFilter = audioCtx.createBiquadFilter();
  tearFilter.type = "highpass";
  tearFilter.frequency.setValueAtTime(3500, now);

  let tearGain = audioCtx.createGain();
  tearGain.gain.setValueAtTime(0, now);
  tearGain.gain.linearRampToValueAtTime(finalVol * 0.18, now + 0.015);
  tearGain.gain.exponentialRampToValueAtTime(0.0001, now + tearDur);

  tearNode.connect(tearFilter);
  tearFilter.connect(tearGain);
  tearGain.connect(window.SoundManager.sfxGain);
  tearNode.start(now);
  tearNode.stop(now + tearDur + 0.05);

  // dealt card flicks (3 quick sweep slips)
  const playCardFlick = (time, pitch) => {
    let flickOsc = audioCtx.createOscillator();
    flickOsc.type = "sine";
    flickOsc.frequency.setValueAtTime(pitch, time);
    flickOsc.frequency.exponentialRampToValueAtTime(pitch * 0.5, time + 0.03);

    let flickGain = audioCtx.createGain();
    flickGain.gain.setValueAtTime(0, time);
    flickGain.gain.linearRampToValueAtTime(finalVol * 0.08, time + 0.003);
    flickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    flickOsc.connect(flickGain);
    flickGain.connect(window.SoundManager.sfxGain);
    flickOsc.start(time);
    flickOsc.stop(time + 0.04);

    setTimeout(() => {
      flickOsc.disconnect();
      flickGain.disconnect();
    }, 100);
  };

  playCardFlick(now + 0.06, 800);
  playCardFlick(now + 0.11, 1000);
  playCardFlick(now + 0.16, 1200);

  // Card Reveal Final snap (payoff thump)
  let snapOsc = audioCtx.createOscillator();
  snapOsc.type = "triangle";
  snapOsc.frequency.setValueAtTime(600, now + 0.22);
  snapOsc.frequency.exponentialRampToValueAtTime(150, now + 0.27);

  let snapGain = audioCtx.createGain();
  snapGain.gain.setValueAtTime(0, now);
  snapGain.gain.setValueAtTime(0, now + 0.22);
  snapGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.223); // Calibrated gain
  snapGain.gain.linearRampToValueAtTime(0, now + 0.27);

  snapOsc.connect(snapGain);
  snapGain.connect(window.SoundManager.sfxGain);
  snapOsc.start(now + 0.22);
  snapOsc.stop(now + 0.32);

  // Sparkling card reveal chime (rising bubbly sweep)
  let chimeOsc = audioCtx.createOscillator();
  chimeOsc.type = "sine";
  chimeOsc.frequency.setValueAtTime(880, now + 0.22);
  chimeOsc.frequency.exponentialRampToValueAtTime(2200, now + 0.22 + 0.25);

  let chimeGain = audioCtx.createGain();
  chimeGain.gain.setValueAtTime(0, now);
  chimeGain.gain.setValueAtTime(0, now + 0.22);
  chimeGain.gain.linearRampToValueAtTime(finalVol * 0.11, now + 0.25); // Calibrated gain
  chimeGain.gain.linearRampToValueAtTime(0, now + 0.22 + 0.3);

  chimeOsc.connect(chimeGain);
  chimeGain.connect(window.SoundManager.sfxGain);
  chimeOsc.start(now + 0.22);
  chimeOsc.stop(now + 0.22 + 0.35);

  setTimeout(() => {
    tearNode.disconnect();
    tearFilter.disconnect();
    tearGain.disconnect();
    snapOsc.disconnect();
    snapGain.disconnect();
    chimeOsc.disconnect();
    chimeGain.disconnect();
  }, 700);
};

// 6. Centralized Non-Blocking DOM Event Delegator with Fallbacks
window.SoundManager.unlockMobileAudio = function () {
  if (!this.ctx) {
    this.init();
  }
  if (this.ctx) {
    if (this.ctx.state === "suspended") {
      this.ctx
        .resume()
        .then(() => {
          // Play a tiny, silent 1-sample buffer to completely unblock Apple's hardware engine
          try {
            let buffer = this.ctx.createBuffer(1, 1, 22050);
            let source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
          } catch (e) {
            console.warn("Failed to play silent kickstart buffer:", e);
          }
          this.updateVolumes();
          if (
            window.MusicManager &&
            typeof window.MusicManager.init === "function"
          ) {
            window.MusicManager.init();
          }
        })
        .catch((err) => {
          console.warn("Failed to resume AudioContext:", err);
        });
    } else {
      if (
        window.MusicManager &&
        typeof window.MusicManager.init === "function"
      ) {
        window.MusicManager.init();
      }
    }
  }
};

window.SoundManager.initTactileFeedback = function () {
  const triggerUnlock = () => {
    window.SoundManager.unlockMobileAudio();
  };

  // Non-blocking listeners to reliably unlock and keep the Web Audio context awake on mobile interactions
  document.addEventListener("pointerdown", triggerUnlock, { passive: true });
  document.addEventListener("touchstart", triggerUnlock, { passive: true });
  document.addEventListener("click", triggerUnlock, { passive: true });

  document.addEventListener("click", function (e) {
    if (!e.target || typeof e.target.closest !== "function") return;

    // A. Detect Sigil Sack Opening triggers
    let sackTarget = e.target.closest(
      ".open-sack, .sigil-sack, .bag-open, [class*='sigil-sack'], [id*='sigil-sack'], [class*='sack-open'], [id*='sack-open']",
    );
    if (sackTarget) {
      window.SoundManager.playSigilSackOpen();
      return;
    }

    // B. Detect Monster Card Pack Opening triggers
    let packTarget = e.target.closest(
      ".open-pack, .card-pack, .monster-pack, [class*='card-pack'], [id*='card-pack'], [class*='pack-open'], [id*='pack-open']",
    );
    if (packTarget) {
      window.SoundManager.playCardPackOpen();
      return;
    }

    // C. Detect Purchases / Upgrades / Gold Sinks / PP / QP Upgrades
    let purchaseTarget = e.target.closest(
      ".btn-buy, .buy-btn, .purchase-btn, .shop-item-buy, .gold-sink, .gold-sink-btn, .pp-upgrade, .qp-upgrade, .upgrade-btn, .btn-upgrade, [class*='buy-btn'], [class*='purchase'], [class*='upgrade'], [id*='buy'], [id*='upgrade']",
    );
    if (purchaseTarget) {
      window.SoundManager.playPurchase();
      return;
    }

    // D. Detect Normal Action Clicks (Tabs, Selectors, Slots, General Buttons, and any standard interactive elements)
    let clickTarget = e.target.closest(
      "button, [class*='btn'], .btn-action, .tab-btn, .sub-tab-btn, .slots-card, .forge-anvil-button, .custom-select-trigger, .custom-select-option",
    );
    if (clickTarget) {
      window.SoundManager.playClick();
    }
  });

  // Listen globally using pointerover for delegated hover tracking with deduplication
  document.addEventListener(
    "pointerover",
    function (e) {
      if (!e.target || typeof e.target.closest !== "function") return;

      let target = e.target.closest(
        "button, [class*='btn'], .bag-item, .slots-card, .tab-btn, .sub-tab-btn, .shop-row, .active-effect-badge, .hub-card, .bestiary-card-item",
      );
      if (target && target !== window.SoundManager.lastHoveredElement) {
        window.SoundManager.lastHoveredElement = target;
        window.SoundManager.playHover();
      }
    },
    true,
  );

  document.addEventListener(
    "pointerout",
    function (e) {
      if (!e.target || typeof e.target.closest !== "function") return;
      let target = e.target.closest(
        "button, [class*='btn'], .bag-item, .slots-card, .tab-btn, .sub-tab-btn, .shop-row, .active-effect-badge, .hub-card, .bestiary-card-item",
      );
      if (target && target === window.SoundManager.lastHoveredElement) {
        window.SoundManager.lastHoveredElement = null;
      }
    },
    true,
  );
};

window.SoundManager.playCardPickup = function () {
  if (!this.init()) return;
  let audioCtx = this.ctx;
  const settings = this.getSafeSettings();
  let finalVol = settings.master * settings.sfx;
  if (settings.mute || finalVol <= 0) return;

  let now = audioCtx.currentTime;

  // Snappy, shimmering pentatonic chime sequence (C5, G5, C6, G6, C7)
  const scale = [523.25, 783.99, 1046.5, 1567.98, 2093.0];
  const duration = 0.6;

  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(finalVol * 0.15, now + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  masterGain.connect(this.sfxGain);

  const oscillators = [];
  scale.forEach((freq, idx) => {
    let delay = idx * 0.04;
    let osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + delay);

    let gNode = audioCtx.createGain();
    gNode.gain.setValueAtTime(0, now);
    gNode.gain.setValueAtTime(0, now + delay);
    gNode.gain.linearRampToValueAtTime(0.12, now + delay + 0.005);
    gNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.18);

    osc.connect(gNode);
    gNode.connect(masterGain);

    osc.start(now + delay);
    osc.stop(now + delay + 0.25);
    oscillators.push(osc);
  });

  setTimeout(
    () => {
      oscillators.forEach((osc) => {
        try {
          osc.disconnect();
        } catch (e) {}
      });
      masterGain.disconnect();
    },
    (duration + 0.1) * 1000,
  );
};

// Auto-register listener bindings on script load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    window.SoundManager.initTactileFeedback();
  });
} else {
  window.SoundManager.initTactileFeedback();
}

/* ==========================================================================
   INTERACTIVE ADAPTIVE BGM ENGINE (MusicManager)
   Loads and decodes local audio files dynamically into Web Audio buffers
   to prevent iOS Safari lockscreen hijacking.
   ========================================================================== */

window.MusicManager = {
  ctx: null,
  source: null,
  gainNode: null,
  trackGainNode: null,
  synthFilter: null,
  activeBuffer: null,
  initialized: false,
  isLoading: false,
  isPaused: false,
  currentTrackIndex: 0,
  proceduralNodes: [],
  isProcedural: false,
  watcherIntervalId: null,
    activeChordNotes: [],

    // Lookahead Scheduler Clock Registers
    schedulerActive: false,
  schedulerTimeoutId: null,
  tempo: 50,
  lookahead: 0.1, // schedule 100ms in advance
  scheduleInterval: 25, // check clock every 25ms
  nextNoteTime: 0.0,
  currentStep: 0,
  currentBGMState: "HUB",

  // Playlist array: easily add more track filenames here in the future!
  tracks: ["music.mp3"],

  init() {
    if (this.initialized) return;
    if (!window.SoundManager || !window.SoundManager.ctx) return;
    this.ctx = window.SoundManager.ctx;
    this.initialized = true;

    // Create the sweepable Lowpass Filter for Music Swells (Warmed up for cozy C418 vibes)
          this.synthFilter = this.ctx.createBiquadFilter();
          this.synthFilter.type = "lowpass";
          this.synthFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
          this.synthFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.gainNode = this.ctx.createGain();
    this.updateVolume();

    // Connect Filter to Gain, and Gain to Main Destination
    this.synthFilter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Dedicated track gain node to balance recorded BGM vs procedural BGM
    this.trackGainNode = this.ctx.createGain();
    this.trackGainNode.gain.setValueAtTime(0.35, this.ctx.currentTime); // Hard balanced to 35% of peak
    this.trackGainNode.connect(this.gainNode);

    this.loadTrack();
    this.startStateWatcher();
  },

  async loadTrack() {
    if (this.isLoading || this.activeBuffer) return;
    this.isLoading = true;
    const trackUrl = this.tracks[this.currentTrackIndex];
    try {
      const response = await fetch(trackUrl);
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      this.activeBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn(`[MusicManager] Failed to load track: ${trackUrl}`, err);
    } finally {
      this.isLoading = false;
    }
  },

  startStateWatcher() {
    if (this.watcherIntervalId) return;
    this.watcherIntervalId = setInterval(() => {
      this.tickState();
    }, 250);
  },

  tickState() {
      if (!this.ctx || this.isPaused) return;

      const states = window.GAME_STATES || { HUB: 0, DUNGEON: 1 };
      const isDungeon = window.currentGameState === states.DUNGEON;

      if (isDungeon) {
        if (this.source) {
          this.fadeOutAndStopSource();
        }
        if (!this.isProcedural) {
          this.startProcedural();
        }
        this.updateBGMState();
      } else {
        if (this.activeBuffer) {
          if (this.isProcedural) {
            this.stopProcedural();
          }
          if (!this.source && !this.isLoading) {
            this.startSource();
          }
        } else {
          // Fallback to playing procedural music continuously in the Hub if no MP3 loaded
          if (!this.isProcedural) {
            this.startProcedural();
          }
          this.updateBGMState();
        }
      }
    },

  play() {
    if (!this.initialized) {
      this.init();
      return;
    }
    this.isPaused = false;
    this.tickState();
  },

  startSource() {
    if (!this.ctx || !this.activeBuffer || this.isPaused || this.source) return;

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.activeBuffer;

    if (this.tracks.length === 1) {
      this.source.loop = true;
    } else {
      this.source.loop = false;
      this.source.onended = () => {
        if (!this.isPaused && !this.isLoading) {
          this.nextTrack();
        }
      };
    }

    // Connect source to our dedicated, volume-balanced track gain node
    this.source.connect(this.trackGainNode);

    // Fade in the MP3 track cleanly over 1.5s to 0.35 peak level
    const fadeTime = 1.5;
    const now = this.ctx.currentTime;
    this.trackGainNode.gain.cancelScheduledValues(now);
    this.trackGainNode.gain.setValueAtTime(0.0001, now);
    this.trackGainNode.gain.exponentialRampToValueAtTime(0.35, now + fadeTime);

    this.source.start(0);
  },

  fadeOutAndStopSource() {
    if (!this.source) return;
    const currentSource = this.source;
    this.source = null; // Detach immediately to prevent cross-ticks

    const fadeTime = 1.0;
    const now = this.ctx.currentTime;
    this.trackGainNode.gain.cancelScheduledValues(now);
    this.trackGainNode.gain.setValueAtTime(this.trackGainNode.gain.value, now);
    this.trackGainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + fadeTime,
    );

    setTimeout(
      () => {
        try {
          currentSource.stop();
        } catch (e) {}
        try {
          currentSource.disconnect();
        } catch (e) {}
      },
      fadeTime * 1000 + 50,
    );
  },

  stopSource() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {}
      this.source.disconnect();
      this.source = null;
    }
    if (this.ctx && this.trackGainNode) {
      const now = this.ctx.currentTime;
      this.trackGainNode.gain.cancelScheduledValues(now);
      this.trackGainNode.gain.setValueAtTime(0, now);
    }
  },

  pause() {
    this.isPaused = true;
    this.stopSource();
    this.stopProcedural();
  },

  resume() {
    if (this.initialized && this.isPaused) {
      this.isPaused = false;
      this.tickState();
    }
  },

  nextTrack() {
    if (this.tracks.length <= 1) return;
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    this.play();
  },

  playTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    if (this.currentTrackIndex === index && this.source) return; // Already playing
    this.currentTrackIndex = index;
    this.play();
  },

  updateVolume() {
      if (!this.ctx || !this.gainNode) return;
      let now = this.ctx.currentTime;
      const settings = window.SoundManager.getSafeSettings();
      let finalVol = settings.mute ? 0 : settings.master * settings.music;
      this.gainNode.gain.setTargetAtTime(finalVol, now, 0.015);
    },

  startProcedural() {
    if (this.isProcedural) return;
    this.isProcedural = true;
    this.proceduralNodes = [];

    this.startScheduler();
  },

  stopProcedural() {
    this.isProcedural = false;
    this.stopScheduler();
    if (this.proceduralNodes) {
      this.proceduralNodes.forEach((node) => {
        try {
          node.stop();
        } catch (e) {}
        try {
          node.disconnect();
        } catch (e) {}
      });
      this.proceduralNodes = [];
    }
  },

  startScheduler() {
      if (this.schedulerActive) return;
      this.schedulerActive = true;
      this.nextNoteTime = this.ctx.currentTime;
      this.currentStep = 0;
      this.barCount = 0;

      const runScheduler = () => {
      if (!this.schedulerActive || this.isPaused) return;

      this.updateBGMState();

      while (this.nextNoteTime < this.ctx.currentTime + this.lookahead) {
        this.scheduleStep(this.currentStep, this.nextNoteTime);
        this.advanceStep();
      }

      this.schedulerTimeoutId = setTimeout(runScheduler, this.scheduleInterval);
    };

    runScheduler();
  },

  stopScheduler() {
      this.schedulerActive = false;
      if (this.schedulerTimeoutId) {
        clearTimeout(this.schedulerTimeoutId);
        this.schedulerTimeoutId = null;
      }
    },

    synthesizePianoPing(time) {
          if (!this.ctx || !this.activeChordNotes || this.activeChordNotes.length === 0) return;

          const baseNote = this.activeChordNotes[Math.floor(Math.random() * this.activeChordNotes.length)];
          const octaveShift = Math.random() < 0.5 ? 2.0 : 4.0;
          const freq = baseNote * octaveShift;

          const duration = 1.0; // Snappy retro decay
          const pingGain = this.ctx.createGain();
          pingGain.gain.setValueAtTime(0, time);
          pingGain.gain.linearRampToValueAtTime(0.045, time + 0.003); // Retro snap attack
          pingGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

          pingGain.connect(this.synthFilter);

          // Retro Vibrato LFO (6.5Hz frequency, depth of 6Hz detuning)
          const vibratoOsc = this.ctx.createOscillator();
          vibratoOsc.frequency.setValueAtTime(6.5, time);
          const vibratoGain = this.ctx.createGain();
          vibratoGain.gain.setValueAtTime(6.0, time);

          // Melodic retro square-wave oscillator
          const osc1 = this.ctx.createOscillator();
          osc1.type = "square";

          // Fast pitch sliding chip-chirp at the beginning of the note
          osc1.frequency.setValueAtTime(freq * 1.12, time);
          osc1.frequency.exponentialRampToValueAtTime(freq, time + 0.012);

          // Chiptune Echo (A secondary, micro-delayed, quieter square-wave echo)
          const delayTime = 0.16; // 160ms delay
          const echoGain = this.ctx.createGain();
          echoGain.gain.setValueAtTime(0, time + delayTime);
          echoGain.gain.linearRampToValueAtTime(0.015, time + delayTime + 0.003);
          echoGain.gain.exponentialRampToValueAtTime(0.0001, time + delayTime + 0.6);
          echoGain.connect(this.synthFilter);

          const echoOsc = this.ctx.createOscillator();
          echoOsc.type = "square";
          echoOsc.frequency.setValueAtTime(freq, time + delayTime);

          vibratoOsc.connect(vibratoGain);
          vibratoGain.connect(osc1.frequency);
          vibratoGain.connect(echoOsc.frequency);

          osc1.connect(pingGain);
          echoOsc.connect(echoGain);

          vibratoOsc.start(time);
          osc1.start(time);
          echoOsc.start(time + delayTime);

          vibratoOsc.stop(time + duration + delayTime);
          osc1.stop(time + duration);
          echoOsc.stop(time + delayTime + 0.7);

          setTimeout(() => {
            try {
              vibratoOsc.disconnect();
              vibratoGain.disconnect();
              osc1.disconnect();
              pingGain.disconnect();
              echoOsc.disconnect();
              echoGain.disconnect();
            } catch (e) {}
          }, (duration + delayTime) * 1000 + 100);
        },

  advanceStep() {
      // 16th note step calculation based on current tempo
      const stepDuration = 60.0 / this.tempo / 4.0;
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
      if (this.currentStep === 0) {
        this.barCount = ((this.barCount || 0) + 1) % 4;
      }
    },

  scheduleStep(step, time) {
      // Chords are scheduled on Step 0 of Bar 0 (once every 4 bars)
      if (step === 0 && (this.barCount === 0 || this.barCount === undefined)) {
        this.playProceduralPad(time);
      }

      const state = this.currentBGMState;

      if (state === "BOSS") {
        // BOSS STATE: Relentless, Driving, High-Velocity Chiptune Action

        // 1. Pounding Double-Kick Drum Pattern
        if (step === 0 || step === 4 || step === 8 || step === 10 || step === 12 || step === 14) {
          this.synthesizeKick(time);
        }
        // 2. Snare Backbeats with Double Snare Rolls
        if (step === 4 || step === 12 || step === 14 || step === 15) {
          this.synthesizeSnare(time);
        }
        // 3. Fast 16th-note Chiptune Hi-Hats
        this.synthesizeHiHat(time, step % 2 === 0 ? 0.045 : 0.02);

        // 4. Frantic, continuous 16th-note walking bassline
        this.synthesizeBasslineNote(
          time,
          this.currentDronePitch || 73.42,
          step,
          0.045
        );

        // 5. Intense, high-speed melody cascades (rapid arpeggios on almost all steps)
        const melodicStep = step % 2 === 0 ? 0.85 : 0.35;
        if (Math.random() < melodicStep) {
          this.synthesizePianoPing(time);
        }

      } else if (state === "COMBAT") {
        // COMBAT STATE: Highly Syncopated, Energetic Groove

        // 1. Driving Syncopated Kick
        if (step === 0 || step === 8 || step === 11) {
          this.synthesizeKick(time);
        }
        // 2. Snare Backbeat on beats 2 and 4
        if (step === 4 || step === 12) {
          this.synthesizeSnare(time);
        }
        // 3. Shuffling Double-Time Hats
        if (step % 2 === 0) {
          this.synthesizeHiHat(time, 0.04);
        } else if (Math.random() < 0.3) {
          this.synthesizeHiHat(time, 0.015);
        }

        // 4. Rolling 8th-note walking bassline on even steps
        if (step % 2 === 0) {
          this.synthesizeBasslineNote(
            time,
            this.currentDronePitch || 73.42,
            step,
            0.04
          );
        }

        // 5. Melodic arpeggio cascades on upbeats and accents
        if (step % 2 === 0 && Math.random() < 0.6) {
          this.synthesizePianoPing(time);
        }

      } else if (state === "EXPLORE") {
        // EXPLORE STATE: Relaxed, Adventurous Dungeon Exploration

        // 1. Minimalistic Kick Drum for steady forward momentum
        if (step === 0 || step === 8) {
          this.synthesizeKick(time);
        }
        // 2. Snares only on Step 12 to resolve the bar
        if (step === 12) {
          this.synthesizeSnare(time);
        }
        // 3. Crisp Hi-Hats on quarter notes to keep timing
        if (step === 0 || step === 4 || step === 8 || step === 12) {
          this.synthesizeHiHat(time, 0.03);
        }

        // 4. Steady, bouncy walking bass on key interval steps
        if (step === 0 || step === 4 || step === 8 || step === 12) {
          this.synthesizeBasslineNote(
            time,
            this.currentDronePitch || 73.42,
            step,
            0.025
          );
        }

        // 5. Semi-frequent melodic retro pings
        if ((step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14) && Math.random() < 0.45) {
          this.synthesizePianoPing(time);
        }

      } else if (state === "HUB") {
        // HUB STATE: Whimsical, Peaceful Town/Safezone Atmosphere

        // 1. Slow, bouncy walking bassline on downbeats (super soft)
        if (step === 0 || step === 8) {
          this.synthesizeBasslineNote(
            time,
            this.currentDronePitch || 73.42,
            step,
            0.015
          );
        }
        // 2. Calm, sparse melodic sequences
        if ((step === 0 || step === 4 || step === 8 || step === 12) && Math.random() < 0.3) {
          this.synthesizePianoPing(time);
        }
        // 3. Playful environmental drips
        if ((step === 6 || step === 14) && Math.random() < 0.15) {
          this.synthesizeWaterDrip(time);
        }

      } else if (state === "LOW_HP") {
              // LOW_HP STATE: Heavy tension focus - Relaxed cinematic pace

              // 1. Heartbeat on Beats 1 and 3 (Steps 0 and 8)
              if (step === 0 || step === 8) {
                this.synthesizeHeartbeat(time, "lub");
              }
              // "dub" on steps 2 and 10 to establish a natural physiological 8th-note delay
              if (step === 2 || step === 10) {
                this.synthesizeHeartbeat(time, "dub");
              }
            }
    },

  updateBGMState() {
      if (!this.ctx) return;

      let targetState = "HUB";
      const p = window.player;
      const states = window.GAME_STATES || { HUB: 0, DUNGEON: 1 };

      if (window.currentGameState === states.DUNGEON) {
        targetState = "EXPLORE";

        // Secure BigNum checks to prevent property exceptions
        const hasBoss = window.mob && window.mob.hp && typeof window.mob.hp.gt === "function" ? window.mob.hp.gt(0) : (window.mob && window.mob.hp > 0);
        const hasCombat = window.mobs && window.mobs.some((m) => m.isAggroed);

        if (hasBoss) {
          targetState = "BOSS";
        } else if (hasCombat) {
          targetState = "COMBAT";
        }

        // Arbitrary precision math safeguard to translate BigNum and standard ratio checks seamlessly
        if (p && p.hp !== undefined && p.maxHp !== undefined) {
          let hpRatio = 1.0;
          if (typeof p.hp.toNumber === "function" && typeof p.maxHp.toNumber === "function") {
            hpRatio = p.hp.toNumber() / p.maxHp.toNumber();
          } else if (typeof p.hp === "object" && p.hp !== null && p.maxHp !== null) {
            const hpVal = Number(p.hp.m) * Math.pow(10, Number(p.hp.e) || 0);
            const maxHpVal = Number(p.maxHp.m) * Math.pow(10, Number(p.maxHp.e) || 0);
            hpRatio = maxHpVal > 0 ? hpVal / maxHpVal : 1.0;
          } else {
            hpRatio = Number(p.hp) / Number(p.maxHp);
          }

          if (hpRatio <= 0.3) {
                          targetState = "LOW_HP";
                          const ratio = Math.max(0, Math.min(0.3, hpRatio));
                          // Dynamically scale tempo: 30% HP -> 110 BPM, 0% HP -> 175 BPM
                          this.tempo = 110 + (1.0 - (ratio / 0.3)) * 65;
                        }
        }
      }

      if (this.currentBGMState !== targetState) {
        this.transitionToState(targetState);
      }
    },

  transitionToState(newState) {
      this.currentBGMState = newState;
      const now = this.ctx.currentTime;

      this.synthFilter.frequency.cancelScheduledValues(now);

      if (newState === "HUB") {
        this.tempo = 92; // Breezy retro hub pacing
        this.synthFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.4); // Bright chiptune open
      } else if (newState === "EXPLORE") {
        this.tempo = 112; // Adventurous underground tempo
        this.synthFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
      } else if (newState === "COMBAT") {
        this.tempo = 124; // Energetic battle tempo
        // COMBAT SWELL: Instantly sweeps open the filter cutoff to add brightness and raw bite
        this.synthFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.5);
      } else if (newState === "BOSS") {
        this.tempo = 135; // Fast-paced boss showdown pacing
        // BOSS SWELL: Maximizes high-register square wave frequencies for intense 8-bit metal energy
        this.synthFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
      } else if (newState === "LOW_HP") {
                    // LOW-HP CHOKE: Muffles ambient sounds to emphasize the raw heartbeat and adrenaline tinnitus
                    this.synthFilter.frequency.setTargetAtTime(320, now, 0.1);
                  }
    },

  playProceduralPad(time) {
      if (!this.ctx || this.isPaused) return;

      const duration = (60.0 / this.tempo) * 16.0 + 1.5;

      const chords = [
        { notes: [130.81, 164.81, 196.00, 261.63], drone: 65.41 }, // C Major Chord
        { notes: [146.83, 174.61, 220.00, 293.66], drone: 73.42 }, // D minor Chord
        { notes: [164.81, 196.00, 246.94, 329.63], drone: 82.41 }, // E minor Chord
        { notes: [174.61, 220.00, 261.63, 349.23], drone: 87.31 }, // F Major Chord
      ];

      const chordIndex = (this.proceduralChordIndex || 0) % chords.length;
      this.proceduralChordIndex = ((this.proceduralChordIndex || 0) + 1) % chords.length;
      const chord = chords[chordIndex];
      this.currentDronePitch = chord.drone;
      this.activeChordNotes = chord.notes;

      const chordGain = this.ctx.createGain();
      chordGain.gain.setValueAtTime(0, time);
      chordGain.gain.linearRampToValueAtTime(0.018, time + 1.0); // Pillowy background level
      chordGain.gain.setValueAtTime(0.018, time + (duration - 1.5));
      chordGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      chordGain.connect(this.synthFilter);

      const stepNodes = [];

      // Warm Sine Sub-Bass (eliminates buzzing drone)
      const droneOsc = this.ctx.createOscillator();
      droneOsc.type = "sine";
      droneOsc.frequency.setValueAtTime(chord.drone, time);
      droneOsc.connect(chordGain);
      droneOsc.start(time);
      droneOsc.stop(time + duration);
      stepNodes.push(droneOsc);

      // Warm chord pads using pure sines to blend beautifully in the background
      chord.notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, time);
        osc.connect(chordGain);
        osc.start(time);
        osc.stop(time + duration);
        stepNodes.push(osc);
      });

      this.proceduralNodes.push(...stepNodes);

      setTimeout(
        () => {
          stepNodes.forEach((node) => {
            try { node.stop(); } catch (e) {}
            try { node.disconnect(); } catch (e) {}
            const idx = this.proceduralNodes.indexOf(node);
            if (idx !== -1) {
              this.proceduralNodes.splice(idx, 1);
            }
          });
          try {
            chordGain.disconnect();
          } catch (e) {}
        },
        duration * 1000 + 500,
      );
    },

  synthesizeKick(time) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(170, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.24, time + 0.004); // Fast solid chiptune kick transient
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

      osc.connect(gainNode);
      gainNode.connect(this.gainNode);

      osc.start(time);
      osc.stop(time + 0.13);

      setTimeout(() => {
        osc.disconnect();
        gainNode.disconnect();
      }, 200);
    },

    synthesizeSnare(time) {
      if (!this.ctx || !window.SoundManager || !window.SoundManager.cachedNoiseBuffer) return;

      const duration = 0.14;
      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0, time);
      snareGain.gain.linearRampToValueAtTime(0.12, time + 0.004);
      snareGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      snareGain.connect(this.synthFilter);

      // Classic game console white noise snare highpass-filtered at 1200Hz
      const source = this.ctx.createBufferSource();
      source.buffer = window.SoundManager.cachedNoiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(1200, time);

      source.connect(noiseFilter);
      noiseFilter.connect(snareGain);

      // Fast-dropping triangle body underneath noise
      const bodyOsc = this.ctx.createOscillator();
      bodyOsc.type = "triangle";
      bodyOsc.frequency.setValueAtTime(240, time);
      bodyOsc.frequency.exponentialRampToValueAtTime(95, time + 0.05);

      const bodyGain = this.ctx.createGain();
      bodyGain.gain.setValueAtTime(0, time);
      bodyGain.gain.linearRampToValueAtTime(0.16, time + 0.004);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(snareGain);

      source.start(time);
      bodyOsc.start(time);

      source.stop(time + duration);
      bodyOsc.stop(time + duration);

      setTimeout(() => {
        source.disconnect();
        noiseFilter.disconnect();
        bodyOsc.disconnect();
        bodyGain.disconnect();
        snareGain.disconnect();
      }, 250);
    },

    synthesizeHiHat(time, customVol = 0.03) {
      if (!window.SoundManager || !window.SoundManager.cachedNoiseBuffer) return;
      const source = this.ctx.createBufferSource();
      source.buffer = window.SoundManager.cachedNoiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(8000, time); // Highly highpass-centric retro sound
      filter.Q.setValueAtTime(5.0, time);

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(customVol * 2.2, time + 0.001); // Bright chiptune hat sweep
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.synthFilter);

      source.start(time);
      source.stop(time + 0.05);

      setTimeout(() => {
        source.disconnect();
        filter.disconnect();
        gainNode.disconnect();
      }, 100);
    },

    synthesizeBasslineNote(time, pitch, step, vol = 0.05) {
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = "triangle";

        let actualPitch = pitch;
        if (step === 2 || step === 10) {
          actualPitch = pitch * 1.5;
        } else if (step === 6 || step === 14) {
          actualPitch = pitch * 2.0;
        } else if (step === 4 || step === 12) {
          actualPitch = pitch * 1.25;
        }

        osc.frequency.setValueAtTime(actualPitch, time);

        // Calculate dynamic decay based on step duration to force a clean staccato gap
        const stepDuration = 60.0 / this.tempo / 4.0;
        const decayTime = stepDuration * 0.8; // Note fully decays within 80% of step length

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(vol * 1.3, time + 0.004); // Snappy 8-bit punch
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decayTime);

        osc.connect(gainNode);
        gainNode.connect(this.synthFilter);

        osc.start(time);
        osc.stop(time + stepDuration);

        setTimeout(() => {
          osc.disconnect();
          gainNode.disconnect();
        }, 250);
      },

    synthesizeWaterDrip(time) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = "square"; // Playful retro drip tone
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(1800, time + 0.035);

      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(0.015, time + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

      osc.connect(gainNode);
      gainNode.connect(this.synthFilter);

      osc.start(time);
      osc.stop(time + 0.08);

      setTimeout(() => {
        osc.disconnect();
        gainNode.disconnect();
      }, 150);
    },

    synthesizeHeartbeat(time, type) {
              if (!this.ctx) return;

              // 1. Dual-register pressure thud
              const oscLow = this.ctx.createOscillator();
              const oscMid = this.ctx.createOscillator();
              const localFilter = this.ctx.createBiquadFilter();
              const gainNode = this.ctx.createGain();

              oscLow.type = "sine";
              oscMid.type = "triangle";

              // Elevated frequencies to guarantee audibility on mobile devices and consumer speakers (which roll off below 80 Hz)
                        const baseFreq = type === "lub" ? 72 : 84;
                        const decay = type === "lub" ? 0.16 : 0.11;
                        const peakVol = type === "lub" ? 0.38 : 0.26; // Softened to a deep cinematic pulse to reduce raw anxiety

              oscLow.frequency.setValueAtTime(baseFreq, time);
              oscLow.frequency.exponentialRampToValueAtTime(35, time + decay);

              oscMid.frequency.setValueAtTime(baseFreq * 1.8, time); // High register harmonic step-up to guarantee physical presence
              oscMid.frequency.exponentialRampToValueAtTime(45, time + decay);

              // Resonant lowpass filter retaining warmth in the 100-200 Hz region, removing synthetic buzz while preserving impact
              localFilter.type = "lowpass";
              localFilter.frequency.setValueAtTime(220, time);
              localFilter.frequency.exponentialRampToValueAtTime(70, time + decay);
              localFilter.Q.setValueAtTime(3.0, time);

              gainNode.gain.setValueAtTime(0, time);
              gainNode.gain.linearRampToValueAtTime(peakVol, time + 0.003);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, time + decay);

              oscLow.connect(localFilter);
              oscMid.connect(localFilter);
              localFilter.connect(gainNode);
              gainNode.connect(this.gainNode);

              oscLow.start(time);
              oscMid.start(time);
              oscLow.stop(time + decay + 0.05);
              oscMid.stop(time + decay + 0.05);

          // 2. Audio Pumping Effect: Momentarily chokes the soundtrack filter to simulate rush of blood
          const ambientTarget = 320;
          const plungeTarget = type === "lub" ? 140 : 200;
          const recoveryTime = type === "lub" ? 0.18 : 0.12;

          this.synthFilter.frequency.cancelScheduledValues(time);
          this.synthFilter.frequency.setValueAtTime(ambientTarget, time);
          this.synthFilter.frequency.exponentialRampToValueAtTime(plungeTarget, time + 0.025);
          this.synthFilter.frequency.exponentialRampToValueAtTime(ambientTarget, time + recoveryTime);

          setTimeout(() => {
            try {
              oscLow.disconnect();
              oscMid.disconnect();
              localFilter.disconnect();
              gainNode.disconnect();
            } catch (e) {}
          }, (decay + 0.1) * 1000);
        },

    playLowHPTensionRing(time) {
              // Permanently disabled to eliminate high-pitched anxiety whines
            },
        };
