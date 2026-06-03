const MIN_BPM = 30;
const MAX_BPM = 240;
const STORAGE_KEY = "metronome-settings-v1";
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;

const defaults = {
  bpm: 84,
  beatsPerBar: 4,
  accent: true,
  countIn: false,
  wakeLock: true,
  sound: "soft"
};

const state = {
  ...defaults,
  isPlaying: false,
  isCountIn: false,
  currentBeat: 1,
  nextBeat: 1,
  nextNoteTime: 0,
  schedulerId: null,
  audioContext: null,
  masterGain: null,
  wakeLockSentinel: null,
  pulseTimer: null
};

const elements = {
  bpmInput: document.querySelector("#bpm-input"),
  beatDots: document.querySelector("#beat-dots"),
  beatNumber: document.querySelector("#beat-number"),
  pulseRing: document.querySelector("#pulse-ring"),
  playButton: document.querySelector("#play-button"),
  playLabel: document.querySelector("#play-label"),
  accentToggle: document.querySelector("#accent-toggle"),
  countInToggle: document.querySelector("#count-in-toggle"),
  wakeLockToggle: document.querySelector("#wake-lock-toggle"),
  beatInputs: [...document.querySelectorAll('input[name="beats"]')],
  soundInputs: [...document.querySelectorAll('input[name="sound"]')],
  stepButtons: [...document.querySelectorAll("[data-step]")]
};

function clampBpm(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return defaults.bpm;
  }
  return Math.min(MAX_BPM, Math.max(MIN_BPM, parsed));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") {
      return;
    }

    state.bpm = clampBpm(saved.bpm);
    state.beatsPerBar = [1, 2, 3, 4, 6].includes(saved.beatsPerBar) ? saved.beatsPerBar : defaults.beatsPerBar;
    state.accent = typeof saved.accent === "boolean" ? saved.accent : defaults.accent;
    state.countIn = typeof saved.countIn === "boolean" ? saved.countIn : defaults.countIn;
    state.wakeLock = typeof saved.wakeLock === "boolean" ? saved.wakeLock : defaults.wakeLock;
    state.sound = ["soft", "wood", "clear"].includes(saved.sound) ? saved.sound : defaults.sound;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSettings() {
  const settings = {
    bpm: state.bpm,
    beatsPerBar: state.beatsPerBar,
    accent: state.accent,
    countIn: state.countIn,
    wakeLock: state.wakeLock,
    sound: state.sound
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function syncControls() {
  elements.bpmInput.value = state.bpm;
  elements.accentToggle.checked = state.accent;
  elements.countInToggle.checked = state.countIn;
  elements.wakeLockToggle.checked = state.wakeLock;

  elements.beatInputs.forEach((input) => {
    input.checked = Number(input.value) === state.beatsPerBar;
  });

  elements.soundInputs.forEach((input) => {
    input.checked = input.value === state.sound;
  });

  renderBeatDots();
  updatePlaybackUi();
}

function renderBeatDots() {
  elements.beatDots.replaceChildren();
  for (let beat = 1; beat <= state.beatsPerBar; beat += 1) {
    const dot = document.createElement("span");
    dot.className = "beat-dot";
    dot.dataset.beat = String(beat);
    elements.beatDots.append(dot);
  }
  updateVisualBeat(state.currentBeat, false);
}

function updateVisualBeat(beat, animate = true) {
  state.currentBeat = beat;
  elements.beatNumber.textContent = String(beat);

  elements.beatDots.querySelectorAll(".beat-dot").forEach((dot) => {
    const isActive = Number(dot.dataset.beat) === beat;
    dot.classList.toggle("active", isActive);
    dot.classList.toggle("accent", isActive && beat === 1 && state.accent);
  });

  elements.pulseRing.classList.toggle("accent", beat === 1 && state.accent);
  if (animate) {
    elements.pulseRing.classList.remove("hit");
    window.requestAnimationFrame(() => {
      elements.pulseRing.classList.add("hit");
      clearTimeout(state.pulseTimer);
      state.pulseTimer = window.setTimeout(() => {
        elements.pulseRing.classList.remove("hit");
      }, 110);
    });
  }
}

function updatePlaybackUi() {
  elements.playButton.setAttribute("aria-pressed", String(state.isPlaying));
  elements.playLabel.textContent = state.isPlaying ? "Stop" : "Start";
  elements.playButton.setAttribute("aria-label", state.isPlaying ? "Stop metronome" : "Start metronome");
}

async function ensureAudio() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = 0.9;
    state.masterGain.connect(state.audioContext.destination);
  }

  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }
}

function soundProfile(isAccent) {
  const profiles = {
    soft: {
      frequency: isAccent ? 880 : 560,
      type: "sine",
      gain: isAccent ? 0.18 : 0.12,
      duration: 0.052
    },
    wood: {
      frequency: isAccent ? 1040 : 700,
      type: "triangle",
      gain: isAccent ? 0.2 : 0.14,
      duration: 0.038
    },
    clear: {
      frequency: isAccent ? 1320 : 880,
      type: "square",
      gain: isAccent ? 0.12 : 0.08,
      duration: 0.028
    }
  };

  return profiles[state.sound] || profiles.soft;
}

function scheduleClick(beat, time) {
  const isAccent = beat === 1 && state.accent;
  const profile = soundProfile(isAccent);
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  const filter = state.audioContext.createBiquadFilter();

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.frequency, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(state.sound === "clear" ? 2500 : 1700, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(profile.gain, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + profile.duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(state.masterGain);

  oscillator.start(time);
  oscillator.stop(time + profile.duration + 0.02);

  window.setTimeout(() => {
    updateVisualBeat(beat);
  }, Math.max(0, (time - state.audioContext.currentTime) * 1000));
}

function advanceBeat() {
  const secondsPerBeat = 60 / state.bpm;
  state.nextNoteTime += secondsPerBeat;
  state.nextBeat = state.nextBeat >= state.beatsPerBar ? 1 : state.nextBeat + 1;

  if (state.isCountIn && state.nextBeat === 1) {
    state.isCountIn = false;
    updatePlaybackUi();
  }
}

function scheduler() {
  while (state.nextNoteTime < state.audioContext.currentTime + SCHEDULE_AHEAD_SECONDS) {
    scheduleClick(state.nextBeat, state.nextNoteTime);
    advanceBeat();
  }
}

async function requestWakeLock() {
  if (!state.wakeLock || !("wakeLock" in navigator)) {
    return;
  }

  try {
    state.wakeLockSentinel = await navigator.wakeLock.request("screen");
    state.wakeLockSentinel.addEventListener("release", () => {
      state.wakeLockSentinel = null;
    });
  } catch {
    state.wakeLockSentinel = null;
  }
}

async function releaseWakeLock() {
  if (!state.wakeLockSentinel) {
    return;
  }

  try {
    await state.wakeLockSentinel.release();
  } finally {
    state.wakeLockSentinel = null;
  }
}

async function startMetronome() {
  await ensureAudio();
  state.isPlaying = true;
  state.isCountIn = state.countIn;
  state.nextBeat = 1;
  state.currentBeat = 1;
  state.nextNoteTime = state.audioContext.currentTime + 0.08;
  updateVisualBeat(1, false);
  updatePlaybackUi();
  await requestWakeLock();
  state.schedulerId = window.setInterval(scheduler, LOOKAHEAD_MS);
  scheduler();
}

async function stopMetronome() {
  state.isPlaying = false;
  state.isCountIn = false;
  window.clearInterval(state.schedulerId);
  state.schedulerId = null;
  await releaseWakeLock();
  updatePlaybackUi();
}

function setBpm(value) {
  state.bpm = clampBpm(value);
  elements.bpmInput.value = state.bpm;
  saveSettings();
}

function setBeatsPerBar(value) {
  state.beatsPerBar = Number(value);
  state.nextBeat = Math.min(state.nextBeat, state.beatsPerBar);
  state.currentBeat = Math.min(state.currentBeat, state.beatsPerBar);
  renderBeatDots();
  saveSettings();
}

function bindEvents() {
  elements.playButton.addEventListener("click", async () => {
    if (state.isPlaying) {
      await stopMetronome();
    } else {
      await startMetronome();
    }
  });

  elements.stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setBpm(state.bpm + Number(button.dataset.step));
    });
  });

  elements.bpmInput.addEventListener("change", () => {
    setBpm(elements.bpmInput.value);
  });

  elements.bpmInput.addEventListener("blur", () => {
    setBpm(elements.bpmInput.value);
  });

  elements.bpmInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      elements.bpmInput.blur();
    }
  });

  elements.beatInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        setBeatsPerBar(input.value);
      }
    });
  });

  elements.soundInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        state.sound = input.value;
        saveSettings();
      }
    });
  });

  elements.accentToggle.addEventListener("change", () => {
    state.accent = elements.accentToggle.checked;
    updateVisualBeat(state.currentBeat, false);
    saveSettings();
  });

  elements.countInToggle.addEventListener("change", () => {
    state.countIn = elements.countInToggle.checked;
    saveSettings();
  });

  elements.wakeLockToggle.addEventListener("change", async () => {
    state.wakeLock = elements.wakeLockToggle.checked;
    saveSettings();
    if (state.isPlaying && state.wakeLock) {
      await requestWakeLock();
    } else {
      await releaseWakeLock();
    }
  });

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible" && state.isPlaying && state.wakeLock) {
      await requestWakeLock();
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("service-worker.js");
  } catch {
    // The metronome still works if offline installation support is unavailable.
  }
}

loadSettings();
syncControls();
bindEvents();
registerServiceWorker();
