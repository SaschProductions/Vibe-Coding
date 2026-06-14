const DEFAULT_CUE = {
  type: "tone",
  waveform: "sine",
  startFrequency: 320,
  endFrequency: 260,
  duration: 0.08,
  gain: 0.08
};

const CUES = {
  shoot: {
    type: "tone",
    waveform: "square",
    startFrequency: 620,
    endFrequency: 920,
    duration: 0.06,
    gain: 0.1
  },
  enemyHit: {
    type: "tone",
    waveform: "sawtooth",
    startFrequency: 180,
    endFrequency: 90,
    duration: 0.07,
    gain: 0.12
  },
  enemyDestroyed: {
    type: "burst",
    waveform: "triangle",
    startFrequency: 160,
    endFrequency: 48,
    duration: 0.18,
    gain: 0.16
  },
  playerHit: {
    type: "tone",
    waveform: "sawtooth",
    startFrequency: 130,
    endFrequency: 70,
    duration: 0.16,
    gain: 0.18
  },
  skill: {
    type: "tone",
    waveform: "sine",
    startFrequency: 280,
    endFrequency: 980,
    duration: 0.42,
    gain: 0.14
  },
  warning: {
    type: "tone",
    waveform: "square",
    startFrequency: 220,
    endFrequency: 220,
    duration: 0.12,
    gain: 0.08
  },
  levelClear: {
    type: "jingle",
    waveform: "triangle",
    notes: [440, 660, 880],
    duration: 0.36,
    gain: 0.12
  },
  levelFail: {
    type: "jingle",
    waveform: "sawtooth",
    notes: [220, 165, 110],
    duration: 0.42,
    gain: 0.13
  },
  campaignComplete: {
    type: "jingle",
    waveform: "triangle",
    notes: [392, 523, 659, 784],
    duration: 0.64,
    gain: 0.14
  }
};

export function createAudioSettings() {
  return { muted: false, volume: 0.28 };
}

export function toggleMute(settings) {
  settings.muted = !settings.muted;
  return settings;
}

export function soundCue(name) {
  return CUES[name] || DEFAULT_CUE;
}

export function createAudioEngine({ AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext } = {}) {
  const settings = createAudioSettings();
  let context = null;
  let master = null;
  let warningGate = 0;

  function ensureContext() {
    if (!AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      master = context.createGain();
      master.gain.value = settings.volume;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume();
    master.gain.value = settings.muted ? 0 : settings.volume;
    return context;
  }

  function applyMuteState() {
    if (master) master.gain.value = settings.muted ? 0 : settings.volume;
  }

  function playTone(cue, startAt = 0) {
    const audioContext = ensureContext();
    if (!audioContext || settings.muted) return;
    const now = audioContext.currentTime + startAt;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = cue.waveform || "sine";
    oscillator.frequency.setValueAtTime(cue.startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, cue.endFrequency), now + cue.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue.gain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cue.duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + cue.duration + 0.02);
  }

  function playJingle(cue) {
    const notes = cue.notes || [cue.startFrequency];
    const step = cue.duration / notes.length;
    notes.forEach((note, index) => {
      playTone({
        ...cue,
        startFrequency: note,
        endFrequency: note * 1.04,
        duration: step * 0.86
      }, index * step);
    });
  }

  function playBurst(cue) {
    playTone(cue);
    playTone({ ...cue, startFrequency: cue.startFrequency * 1.6, endFrequency: cue.endFrequency * 1.2, gain: cue.gain * 0.55, duration: cue.duration * 0.7 }, 0.025);
  }

  function play(name) {
    if (settings.muted) return;
    const cue = soundCue(name);
    if (cue.type === "jingle") playJingle(cue);
    else if (cue.type === "burst") playBurst(cue);
    else playTone(cue);
  }

  function playWarning() {
    const now = Date.now();
    if (now < warningGate) return;
    warningGate = now + 1400;
    play("warning");
  }

  return {
    settings,
    unlock: ensureContext,
    play,
    playWarning,
    toggleMute: () => {
      const nextSettings = toggleMute(settings);
      applyMuteState();
      return nextSettings;
    }
  };
}
