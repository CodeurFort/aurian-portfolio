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
let eruptionBreath: OscillatorNode | null = null;
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

// Minimalist transition swell — soft sine swoop, no noise. ~0.25s, very low.
export function playWhoosh() {
  if (muted) return;
  const c = getCtx();
  if (!c || !masterGain) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(520, t0);
  o.frequency.exponentialRampToValueAtTime(280, t0 + 0.22);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.06, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
  o.connect(g).connect(masterGain);
  o.start(t0);
  o.stop(t0 + 0.32);
}

// Quiet "breathing" pad for the eruption planet — sober, ambient, no noise.
// Two sine layers with very slow gain pulsing; sits just under the threshold
// of attention rather than dominating the soundstage.
export function startEruptionRumble() {
  if (muted) return;
  const c = getCtx();
  if (!c || !masterGain) return;
  if (eruptionGain) return; // already running
  const t0 = c.currentTime;

  eruptionGain = c.createGain();
  eruptionGain.gain.setValueAtTime(0, t0);
  eruptionGain.gain.linearRampToValueAtTime(0.018, t0 + 2.0); // very low ceiling
  eruptionGain.connect(masterGain);

  // Soft low sine — no sawtooth grit
  eruptionLowOsc = c.createOscillator();
  eruptionLowOsc.type = "sine";
  eruptionLowOsc.frequency.value = 110;
  eruptionLowOsc.connect(eruptionGain);
  eruptionLowOsc.start(t0);

  // Slow gain LFO on the master eruption gain — gentle breathing, ~12s cycle
  const breath = c.createOscillator();
  breath.type = "sine";
  breath.frequency.value = 0.08;
  const breathDepth = c.createGain();
  breathDepth.gain.value = 0.008;
  breath.connect(breathDepth).connect(eruptionGain.gain);
  breath.start(t0);

  eruptionBreath = breath;
}

export function stopEruptionRumble() {
  const c = getCtx();
  if (!c || !eruptionGain) return;
  const t = c.currentTime;
  eruptionGain.gain.cancelScheduledValues(t);
  eruptionGain.gain.setValueAtTime(eruptionGain.gain.value, t);
  eruptionGain.gain.linearRampToValueAtTime(0, t + 0.8);
  const lowOsc = eruptionLowOsc;
  const breath = eruptionBreath;
  const gain = eruptionGain;
  eruptionLowOsc = null;
  eruptionBreath = null;
  eruptionGain = null;
  window.setTimeout(() => {
    try {
      lowOsc?.stop();
      breath?.stop();
      gain.disconnect();
    } catch {
      // ignore double-stop errors
    }
  }, 900);
}
