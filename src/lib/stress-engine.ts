import { useAppStore, type StressState } from "@/store/app-store";

const PROC_W = 160;
const PROC_H = 120;
const SAMPLE_MS = 40;
const WARMUP_MS = 3500;
const BUF = 160;

type FaceBox = { x: number; y: number; w: number; h: number };

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function meanStd(xs: number[]) {
  if (!xs.length) return { mean: 0, std: 0 };
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
  return { mean, std: Math.sqrt(v) };
}

class StressEngine {
  stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private running = false;
  private lastSample = 0;
  private startedAt = 0;
  private greens: number[] = [];
  private acBuf: number[] = [];
  private ema = 0;
  private emaReady = false;
  private peaks: number[] = [];
  private lastPeakAt = 0;
  private prevGray: Float32Array | null = null;
  private motion = 0;
  private level = 28;
  private bpm: number | null = null;
  private face = false;
  private roi: FaceBox = { x: 48, y: 16, w: 64, h: 32 };
  private faceTick = 0;
  private preview: HTMLVideoElement | null = null;
  private mini: HTMLVideoElement | null = null;
  private detector: { detect: (v: HTMLVideoElement) => Promise<{ boundingBox: DOMRectReadOnly }[]> } | null =
    null;

  private ensureDom() {
    if (this.video) return;
    const video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;
    video.autoplay = true;
    video.setAttribute("playsinline", "true");
    this.video = video;
    const canvas = document.createElement("canvas");
    canvas.width = PROC_W;
    canvas.height = PROC_H;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
  }

  bindPreview(el: HTMLVideoElement | null) {
    this.preview = el;
    this.pipe(el);
  }

  bindMini(el: HTMLVideoElement | null) {
    this.mini = el;
    this.pipe(el);
  }

  private pipe(el: HTMLVideoElement | null) {
    if (!el) return;
    if (this.stream) {
      el.srcObject = this.stream;
      void el.play().catch(() => {});
    }
  }

  async start() {
    if (this.running) return;
    this.ensureDom();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240, frameRate: { ideal: 24 } },
        audio: false,
      });
    } catch {
      this.publish({
        on: false,
        level: 0,
        bpm: null,
        label: "off",
        face: false,
      });
      throw new Error("Camera permission was denied.");
    }
    const video = this.video!;
    video.srcObject = this.stream;
    await video.play().catch(() => {});
    this.pipe(this.preview);
    this.pipe(this.mini);
    this.running = true;
    this.startedAt = performance.now();
    this.greens = [];
    this.acBuf = [];
    this.peaks = [];
    this.emaReady = false;
    this.level = 28;
    this.bpm = null;
    this.prevGray = null;
    this.publish({
      on: true,
      level: 0,
      bpm: null,
      label: "warming",
      face: false,
    });
    const tick = (now: number) => {
      if (!this.running) return;
      this.sample(now);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  async stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    if (this.preview) this.preview.srcObject = null;
    if (this.mini) this.mini.srcObject = null;
    this.publish({
      on: false,
      level: 0,
      bpm: null,
      label: "off",
      face: false,
    });
  }

  private publish(s: StressState) {
    useAppStore.getState().setStress(s);
  }

  private sample(now: number) {
    if (now - this.lastSample < SAMPLE_MS) return;
    this.lastSample = now;
    const video = this.video;
    const ctx = this.ctx;
    if (!video || !ctx || video.readyState < 2) return;

    ctx.drawImage(video, 0, 0, PROC_W, PROC_H);
    const img = ctx.getImageData(0, 0, PROC_W, PROC_H);
    const data = img.data;

    this.faceTick++;
    if (this.faceTick % 12 === 1) {
      void this.updateFace(video);
    }

    const roi = this.roi;
    let gSum = 0;
    let rSum = 0;
    let n = 0;
    for (let y = roi.y | 0; y < roi.y + roi.h; y += 2) {
      for (let x = roi.x | 0; x < roi.x + roi.w; x += 2) {
        if (x < 0 || y < 0 || x >= PROC_W || y >= PROC_H) continue;
        const i = (y * PROC_W + x) * 4;
        rSum += data[i];
        gSum += data[i + 1];
        n++;
      }
    }
    if (!n) return;
    const g = gSum / n;
    const r = rSum / n;
    const skinish = r > 40 && g > 30 && r > g * 0.7;
    this.face = skinish;

    if (!this.emaReady) {
      this.ema = g;
      this.emaReady = true;
    } else {
      this.ema = this.ema * 0.92 + g * 0.08;
    }
    const ac = g - this.ema;
    this.greens.push(g);
    this.acBuf.push(ac);
    if (this.greens.length > BUF) {
      this.greens.shift();
      this.acBuf.shift();
    }

    this.motion = this.frameMotion(data);

    const { std } = meanStd(this.acBuf.slice(-80));
    const last = this.acBuf.at(-1) ?? 0;
    const prev = this.acBuf.at(-2) ?? 0;
    const prev2 = this.acBuf.at(-3) ?? 0;
    const minGap = 420;
    if (prev > last && prev > prev2 && prev > std * 0.55 && now - this.lastPeakAt > minGap) {
      this.lastPeakAt = now;
      this.peaks.push(now);
      if (this.peaks.length > 10) this.peaks.shift();
    }
    if (this.peaks.length >= 3) {
      const iv: number[] = [];
      for (let i = 1; i < this.peaks.length; i++) iv.push(this.peaks[i] - this.peaks[i - 1]);
      const { mean, std: ivStd } = meanStd(iv);
      if (mean > 400 && mean < 1500) this.bpm = Math.round(60000 / mean);
      else this.bpm = this.bpm;
      this._ivStd = ivStd / 1000;
    }

    const warming = now - this.startedAt < WARMUP_MS;
    const lit = r + g > 90 && std > 0.12;
    let label: StressState["label"] = "warming";
    let raw = this.level;

    if (!warming) {
      if (!lit) {
        label = "need-light";
        raw = this.level * 0.96 + 22 * 0.04;
      } else {
        const hr = this.bpm ?? 72;
        const hrScore = clamp((hr - 64) / 52, 0, 1);
        const motionScore = clamp(this.motion / 14, 0, 1);
        const hrvScore = clamp(this._ivStd / 0.22, 0, 1);
        raw = 100 * (0.42 * hrScore + 0.38 * motionScore + 0.2 * hrvScore);
        if (raw < 32) label = "calm";
        else if (raw < 58) label = "steady";
        else if (raw < 78) label = "elevated";
        else label = "high";
      }
    }

    this.level = this.level * 0.82 + raw * 0.18;
    this.publish({
      on: true,
      level: Math.round(this.level),
      bpm: warming ? null : this.bpm,
      label,
      face: this.face,
    });
  }

  private _ivStd = 0.12;

  private frameMotion(data: Uint8ClampedArray) {
    const gw = 40;
    const gh = 30;
    const gray = new Float32Array(gw * gh);
    const sx = PROC_W / gw;
    const sy = PROC_H / gh;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const px = Math.min(PROC_W - 1, (x * sx) | 0);
        const py = Math.min(PROC_H - 1, (y * sy) | 0);
        const i = (py * PROC_W + px) * 4;
        gray[y * gw + x] = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      }
    }
    let diff = 0;
    if (this.prevGray && this.prevGray.length === gray.length) {
      for (let i = 0; i < gray.length; i++) diff += Math.abs(gray[i] - this.prevGray[i]);
      diff /= gray.length;
    }
    this.prevGray = gray;
    return diff;
  }

  private async updateFace(video: HTMLVideoElement) {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    try {
      const wFD = (
        window as unknown as {
          FaceDetector?: new (o: { fastMode: boolean; maxDetectedFaces: number }) => {
            detect: (v: HTMLVideoElement) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
          };
        }
      ).FaceDetector;
      if (wFD && !this.detector) {
        this.detector = new wFD({ fastMode: true, maxDetectedFaces: 1 });
      }
      if (!this.detector) return;
      const faces = await this.detector.detect(video);
      const b = faces[0]?.boundingBox;
      if (!b) return;
      const sx = PROC_W / w;
      const sy = PROC_H / h;
      this.roi = {
        x: clamp((b.x + b.width * 0.22) * sx, 4, PROC_W - 20),
        y: clamp((b.y + b.height * 0.1) * sy, 4, PROC_H - 16),
        w: clamp(b.width * 0.56 * sx, 24, 80),
        h: clamp(b.height * 0.2 * sy, 12, 40),
      };
    } catch {
      /* FaceDetector is optional */
    }
  }
}

export const stressEngine = new StressEngine();
