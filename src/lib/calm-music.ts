import { useAppStore } from "@/store/app-store";

const CHORDS: number[][] = [
  [130.81, 196.0, 329.63, 493.88],
  [110.0, 164.81, 261.63, 392.0],
  [87.31, 174.61, 220.0, 329.63],
  [98.0, 146.83, 196.0, 293.66],
];

const BELLS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

type Probe = {
  isPlaying: () => boolean;
  isMuted: () => boolean;
  start: () => void;
  stop: () => void;
  unlock: () => void;
};

declare global {
  interface Window {
    __calmMusic?: Probe;
  }
}

class CalmMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private playing = false;
  private muted = false;
  private manual = false;
  private latched = false;
  private chord = 0;
  private voices: OscillatorNode[] = [];
  private chordTimer = 0;
  private schedTimer = 0;
  private nextBell = 0;
  private unsub: (() => void) | null = null;
  private built = false;

  unlock() {
    this.ensure();
    const ctx = this.ctx;
    if (ctx && ctx.state === "suspended") void ctx.resume();
  }

  private ensure() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC({ latencyHint: "playback" });
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.42;
    master.connect(ctx.destination);
    this.master = master;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(master);
    this.bus = bus;
    this.wireProbe();
  }

  private wireProbe() {
    window.__calmMusic = {
      isPlaying: () => this.playing,
      isMuted: () => this.muted,
      start: () => this.start(true),
      stop: () => this.stop(),
      unlock: () => this.unlock(),
    };
  }

  attach() {
    if (this.unsub) return this.unsub;
    const onVis = () => {
      if (document.visibilityState === "visible") this.unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    this.unsub = useAppStore.subscribe((s) => {
      if (s.musicMuted !== this.muted) {
        this.muted = s.musicMuted;
        this.applyMute();
      }
      const high =
        s.stress.on &&
        (s.stress.level >= 58 || s.stress.label === "elevated" || s.stress.label === "high");
      const released = !s.stress.on || s.stress.level < 42;

      if (s.musicManual && !this.playing) {
        this.start(true);
        return;
      }
      if (high) {
        this.latched = true;
        if (!this.playing) this.start(false);
        return;
      }
      if (this.playing && !this.manual && (released || !s.stress.on)) {
        this.latched = false;
        this.stop();
      }
    });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      this.unsub?.();
      this.unsub = null;
    };
  }

  start(manual: boolean) {
    this.ensure();
    this.unlock();
    if (manual) this.manual = true;
    if (this.playing) {
      this.applyMute();
      return;
    }
    this.playing = true;
    this.buildGraph();
    const ctx = this.ctx!;
    const bus = this.bus!;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(this.muted ? 0 : 1, ctx.currentTime, 1.4);
    this.nextBell = ctx.currentTime + 1.6;
    this.tickBells();
    this.chordTimer = window.setInterval(() => this.nextChord(), 10000);
    useAppStore.getState().setMusicPlaying(true);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    this.manual = false;
    const ctx = this.ctx;
    const bus = this.bus;
    if (ctx && bus) {
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.9);
    }
    window.clearInterval(this.chordTimer);
    window.clearTimeout(this.schedTimer);
    useAppStore.getState().setMusicPlaying(false);
    useAppStore.getState().setMusicManual(false);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    useAppStore.getState().setMusicMuted(muted);
    this.applyMute();
  }

  private applyMute() {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus || !this.playing) return;
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(this.muted ? 0 : 1, ctx.currentTime, 0.08);
  }

  private buildGraph() {
    if (this.built || !this.ctx || !this.bus) return;
    const ctx = this.ctx;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 680;
    filter.Q.value = 0.65;
    filter.connect(this.bus);

    const fLfo = ctx.createOscillator();
    fLfo.frequency.value = 0.05;
    const fGain = ctx.createGain();
    fGain.gain.value = 240;
    fLfo.connect(fGain);
    fGain.connect(filter.frequency);
    fLfo.start();

    const tones = CHORDS[0];
    this.voices = tones.map((hz, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? "sine" : "triangle";
      osc.frequency.value = hz;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.18 : i === 1 ? 0.14 : 0.09;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.02;
      const lg = ctx.createGain();
      lg.gain.value = 5 + i;
      lfo.connect(lg);
      lg.connect(osc.detune);
      osc.connect(g);
      g.connect(filter);
      osc.start();
      lfo.start();
      return osc;
    });

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 65.41;
    const sg = ctx.createGain();
    sg.gain.value = 0.07;
    sub.connect(sg);
    sg.connect(this.bus);
    sub.start();
    this.voices.push(sub);

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < ch.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.97 + white * 0.03;
      ch[i] = last;
    }
    noise.buffer = buf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.5;
    const ng = ctx.createGain();
    ng.gain.value = 0.045;
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(this.bus);
    noise.start();

    this.built = true;
  }

  private nextChord() {
    if (!this.playing || !this.ctx) return;
    this.chord = (this.chord + 1) % CHORDS.length;
    const tones = CHORDS[this.chord];
    const t = this.ctx.currentTime;
    for (let i = 0; i < tones.length; i++) {
      const osc = this.voices[i];
      if (!osc) continue;
      osc.frequency.setTargetAtTime(tones[i], t, 2.2);
    }
    const sub = this.voices[4];
    if (sub) sub.frequency.setTargetAtTime(tones[0] / 2, t, 2.2);
  }

  private tickBells() {
    if (!this.playing || !this.ctx || !this.bus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    while (this.nextBell < now + 1.4) {
      this.fireBell(this.nextBell);
      this.nextBell += 2.6 + Math.random() * 2.4;
    }
    this.schedTimer = window.setTimeout(() => this.tickBells(), 400);
  }

  private fireBell(when: number) {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = BELLS[(Math.random() * BELLS.length) | 0];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.07, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 2.8);
    osc.connect(g);
    g.connect(bus);
    osc.start(when);
    osc.stop(when + 3);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }
}

export const calmMusic = new CalmMusic();
