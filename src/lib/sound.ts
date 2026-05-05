// Lightweight Web Audio synth — zero assets, zero dependencies.
// All sounds are generated on the fly; nothing to download or host.
// Toggle persisted in localStorage so the user's choice survives refresh.

const STORAGE_KEY = "sound:muted";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = true; // default OFF until user opts in (autoplay friendly)
const listeners = new Set<(m: boolean) => void>();

// Eruption ambience nodes (kept around so we can stop/start cleanly)
let eruptionLowOsc: OscillatorNode | null = null;
let eruptionNoise: AudioBufferSourceNode | null = null;
let eruptionGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as WindowWithWebkit;
    const Ctor = window.AudioContext || w.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
  }
  // Resume if suspended (Safari/iOS require gesture)
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  // Default: muted ON (sound off) until user opts in
  muted = stored === null ? true : stored === "1";
}

export function isMuted(): boolean {
  return muted;
}

export function subscribeMute(cb: (m: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  }
  const c = getCtx();
  if (c && masterGain) {
    masterGain.gain.cancelScheduledValues(c.currentTime);
    masterGain.gain.linearRampToValueAtTime(v ? 0 : 1, c.currentTime + 0.18);
  }
  listeners.forEach((cb) => cb(v));
}

export function toggleMuted() {
  setMuted(!muted);
}

// Build a 1s noise buffer used by whoosh + rumble
function makeNoiseBuffer(c: AudioContext, seconds = 1): AudioBuffer {
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// Crystal blip — used on legend star clicks
export function playBlip() {
  if (muted) return;
  const c = getCtx();
  if (!c || !masterGain) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(880, t0);
  o.frequency.exponentialRampToValueAtTime(1320, t0 + 0.06);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  o.connect(g).connect(masterGain);
  o.start(t0);
  o.stop(t0 + 0.22);
}

// Soft thud — used on planet click
export function playTap() {
  if (muted) return;
  const c = getCtx();
  if (!c || !masterGain) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(180, t0);
  o.frequency.exponentialRampToValueAtTime(80, t0 + 0.18);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.22, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  o.connect(g).connect(masterGain);
  o.start(t0);
  o.stop(t0 + 0.26);
}

// Hyperspace whoosh — used on planet transitions
export function playWhoosh() {
  if (muted) return;
  const c = getCtx();
  if (!c || !masterGain) return;
  const t0 = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.8);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, t0);
  filter.frequency.exponentialRampToValueAtTime(3200, t0 + 0.55);
  filter.Q.value = 6;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.22, t0 + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
  noise.connect(filter).connect(g).connect(masterGain);
  noise.start(t0);
  noise.stop(t0 + 0.75);
}

// Volcanic rumble — looping ambience for the "Moi" star eruption
export function startEruptionRumble() {
  if (muted) {
    // still set up so unmute later starts it; but skip building if unused
    return;
  }
  const c = getCtx();
  if (!c || !masterGain) return;
  if (eruptionGain) return; // already running
  const t0 = c.currentTime;

  eruptionGain = c.createGain();
  eruptionGain.gain.setValueAtTime(0, t0);
  eruptionGain.gain.linearRampToValueAtTime(0.05, t0 + 1.5);
  eruptionGain.connect(masterGain);

  // Sub-bass drone
  eruptionLowOsc = c.createOscillator();
  eruptionLowOsc.type = "sawtooth";
  eruptionLowOsc.frequency.value = 48;
  const lowGain = c.createGain();
  lowGain.gain.value = 0.35;
  // Slow LFO on the bass to make it feel alive
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.4;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(eruptionLowOsc.frequency);
  eruptionLowOsc.connect(lowGain).connect(eruptionGain);
  eruptionLowOsc.start(t0);
  lfo.start(t0);

  // Filtered noise for crackle/lava bubble
  eruptionNoise = c.createBufferSource();
  eruptionNoise.buffer = makeNoiseBuffer(c, 4);
  eruptionNoise.loop = true;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 220;
  noiseFilter.Q.value = 2;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.5;
  eruptionNoise.connect(noiseFilter).connect(noiseGain).connect(eruptionGain);
  eruptionNoise.start(t0);
}

export function stopEruptionRumble() {
  const c = getCtx();
  if (!c || !eruptionGain) return;
  const t = c.currentTime;
  eruptionGain.gain.cancelScheduledValues(t);
  eruptionGain.gain.setValueAtTime(eruptionGain.gain.value, t);
  eruptionGain.gain.linearRampToValueAtTime(0, t + 0.6);
  const lowOsc = eruptionLowOsc;
  const noise = eruptionNoise;
  const gain = eruptionGain;
  eruptionLowOsc = null;
  eruptionNoise = null;
  eruptionGain = null;
  window.setTimeout(() => {
    try {
      lowOsc?.stop();
      noise?.stop();
      gain.disconnect();
    } catch {
      // ignore double-stop errors
    }
  }, 700);
}
