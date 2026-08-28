import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { C as BookOpen, S as Camera, _ as FileText, b as ChevronLeft, c as Plus, d as Notebook, f as Music, g as HeartPulse, h as Heart, i as Trophy, l as Play, m as LayoutDashboard, n as Volume2, o as Sword, p as LoaderCircle, r as Upload, s as ScrollText, t as VolumeX, u as Pause, v as ChevronUp, w as Activity, x as ChevronDown, y as ChevronRight } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BVk9tdPz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "focus-physiology-v1";
var defaultPlayer = {
	hp: 100,
	maxHp: 100,
	xp: 0,
	level: 1,
	atk: 16,
	zones: 1
};
var defaultTasks = [
	{
		id: "1",
		title: "Cardiovascular system",
		status: "todo"
	},
	{
		id: "2",
		title: "Renal physiology",
		status: "progress"
	},
	{
		id: "3",
		title: "Neurotransmitters",
		status: "mastered"
	}
];
var defaultStress = {
	on: false,
	level: 0,
	bpm: null,
	label: "off",
	face: false
};
var useAppStore = create((set) => ({
	tab: "story",
	setTab: (tab) => set({ tab }),
	notes: "",
	setNotes: (notes) => set({ notes }),
	quest: null,
	setQuest: (quest) => set({ quest }),
	generating: false,
	setGenerating: (generating) => set({ generating }),
	player: defaultPlayer,
	setPlayer: (p) => set((s) => ({ player: typeof p === "function" ? p(s.player) : p })),
	questions: [],
	setQuestions: (questions) => set({ questions }),
	tasks: defaultTasks,
	setTasks: (t) => set((s) => ({ tasks: typeof t === "function" ? t(s.tasks) : t })),
	pomodoro: {
		m: 25,
		s: 0,
		run: false
	},
	setPomodoro: (p) => set((s) => ({ pomodoro: typeof p === "function" ? p(s.pomodoro) : p })),
	stress: defaultStress,
	setStress: (stress) => set({ stress }),
	musicPlaying: false,
	setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
	musicMuted: false,
	setMusicMuted: (musicMuted) => set({ musicMuted }),
	musicManual: false,
	setMusicManual: (musicManual) => set({ musicManual })
}));
function hydrateAppStore() {
	if (typeof window === "undefined") return;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const d = JSON.parse(raw);
		useAppStore.setState({
			notes: typeof d.notes === "string" ? d.notes : "",
			quest: d.quest ?? null,
			questions: Array.isArray(d.questions) ? d.questions : [],
			player: d.player ?? defaultPlayer,
			tasks: Array.isArray(d.tasks) ? d.tasks : defaultTasks
		});
	} catch {}
}
if (typeof window !== "undefined") useAppStore.subscribe((s) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			notes: s.notes,
			quest: s.quest,
			questions: s.questions,
			player: s.player,
			tasks: s.tasks
		}));
	} catch {}
});
var CHORDS = [
	[
		130.81,
		196,
		329.63,
		493.88
	],
	[
		110,
		164.81,
		261.63,
		392
	],
	[
		87.31,
		174.61,
		220,
		329.63
	],
	[
		98,
		146.83,
		196,
		293.66
	]
];
var BELLS = [
	261.63,
	293.66,
	329.63,
	392,
	440,
	523.25
];
var CalmMusic = class {
	ctx = null;
	master = null;
	bus = null;
	playing = false;
	muted = false;
	manual = false;
	latched = false;
	chord = 0;
	voices = [];
	chordTimer = 0;
	schedTimer = 0;
	nextBell = 0;
	unsub = null;
	built = false;
	unlock() {
		this.ensure();
		const ctx = this.ctx;
		if (ctx && ctx.state === "suspended") ctx.resume();
	}
	ensure() {
		if (this.ctx) return;
		const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "playback" });
		this.ctx = ctx;
		const master = ctx.createGain();
		master.gain.value = .42;
		master.connect(ctx.destination);
		this.master = master;
		const bus = ctx.createGain();
		bus.gain.value = 0;
		bus.connect(master);
		this.bus = bus;
		this.wireProbe();
	}
	wireProbe() {
		window.__calmMusic = {
			isPlaying: () => this.playing,
			isMuted: () => this.muted,
			start: () => this.start(true),
			stop: () => this.stop(),
			unlock: () => this.unlock()
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
			const high = s.stress.on && (s.stress.level >= 58 || s.stress.label === "elevated" || s.stress.label === "high");
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
	start(manual) {
		this.ensure();
		this.unlock();
		if (manual) this.manual = true;
		if (this.playing) {
			this.applyMute();
			return;
		}
		this.playing = true;
		this.buildGraph();
		const ctx = this.ctx;
		const bus = this.bus;
		bus.gain.cancelScheduledValues(ctx.currentTime);
		bus.gain.setTargetAtTime(this.muted ? 0 : 1, ctx.currentTime, 1.4);
		this.nextBell = ctx.currentTime + 1.6;
		this.tickBells();
		this.chordTimer = window.setInterval(() => this.nextChord(), 1e4);
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
			bus.gain.setTargetAtTime(0, ctx.currentTime, .9);
		}
		window.clearInterval(this.chordTimer);
		window.clearTimeout(this.schedTimer);
		useAppStore.getState().setMusicPlaying(false);
		useAppStore.getState().setMusicManual(false);
	}
	setMuted(muted) {
		this.muted = muted;
		useAppStore.getState().setMusicMuted(muted);
		this.applyMute();
	}
	applyMute() {
		const ctx = this.ctx;
		const bus = this.bus;
		if (!ctx || !bus || !this.playing) return;
		bus.gain.cancelScheduledValues(ctx.currentTime);
		bus.gain.setTargetAtTime(this.muted ? 0 : 1, ctx.currentTime, .08);
	}
	buildGraph() {
		if (this.built || !this.ctx || !this.bus) return;
		const ctx = this.ctx;
		const filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 680;
		filter.Q.value = .65;
		filter.connect(this.bus);
		const fLfo = ctx.createOscillator();
		fLfo.frequency.value = .05;
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
			g.gain.value = i === 0 ? .18 : i === 1 ? .14 : .09;
			const lfo = ctx.createOscillator();
			lfo.frequency.value = .06 + i * .02;
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
		sg.gain.value = .07;
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
			last = last * .97 + white * .03;
			ch[i] = last;
		}
		noise.buffer = buf;
		noise.loop = true;
		const bp = ctx.createBiquadFilter();
		bp.type = "bandpass";
		bp.frequency.value = 420;
		bp.Q.value = .5;
		const ng = ctx.createGain();
		ng.gain.value = .045;
		noise.connect(bp);
		bp.connect(ng);
		ng.connect(this.bus);
		noise.start();
		this.built = true;
	}
	nextChord() {
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
	tickBells() {
		if (!this.playing || !this.ctx || !this.bus) return;
		const now = this.ctx.currentTime;
		while (this.nextBell < now + 1.4) {
			this.fireBell(this.nextBell);
			this.nextBell += 2.6 + Math.random() * 2.4;
		}
		this.schedTimer = window.setTimeout(() => this.tickBells(), 400);
	}
	fireBell(when) {
		const ctx = this.ctx;
		const bus = this.bus;
		if (!ctx || !bus) return;
		const osc = ctx.createOscillator();
		osc.type = "sine";
		osc.frequency.value = BELLS[Math.random() * BELLS.length | 0];
		const g = ctx.createGain();
		g.gain.setValueAtTime(1e-4, when);
		g.gain.exponentialRampToValueAtTime(.07, when + .03);
		g.gain.exponentialRampToValueAtTime(1e-4, when + 2.8);
		osc.connect(g);
		g.connect(bus);
		osc.start(when);
		osc.stop(when + 3);
		osc.onended = () => {
			osc.disconnect();
			g.disconnect();
		};
	}
};
var calmMusic = new CalmMusic();
var PROC_W = 160;
var PROC_H = 120;
var SAMPLE_MS = 40;
var WARMUP_MS = 3500;
var BUF = 160;
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function meanStd(xs) {
	if (!xs.length) return {
		mean: 0,
		std: 0
	};
	const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
	const v = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length;
	return {
		mean,
		std: Math.sqrt(v)
	};
}
var StressEngine = class {
	stream = null;
	video = null;
	canvas = null;
	ctx = null;
	raf = 0;
	running = false;
	lastSample = 0;
	startedAt = 0;
	greens = [];
	acBuf = [];
	ema = 0;
	emaReady = false;
	peaks = [];
	lastPeakAt = 0;
	prevGray = null;
	motion = 0;
	level = 28;
	bpm = null;
	face = false;
	roi = {
		x: 48,
		y: 16,
		w: 64,
		h: 32
	};
	faceTick = 0;
	preview = null;
	mini = null;
	detector = null;
	ensureDom() {
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
	bindPreview(el) {
		this.preview = el;
		this.pipe(el);
	}
	bindMini(el) {
		this.mini = el;
		this.pipe(el);
	}
	pipe(el) {
		if (!el) return;
		if (this.stream) {
			el.srcObject = this.stream;
			el.play().catch(() => {});
		}
	}
	async start() {
		if (this.running) return;
		this.ensureDom();
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: 320,
					height: 240,
					frameRate: { ideal: 24 }
				},
				audio: false
			});
		} catch {
			this.publish({
				on: false,
				level: 0,
				bpm: null,
				label: "off",
				face: false
			});
			throw new Error("Camera permission was denied.");
		}
		const video = this.video;
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
			face: false
		});
		const tick = (now) => {
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
			face: false
		});
	}
	publish(s) {
		useAppStore.getState().setStress(s);
	}
	sample(now) {
		if (now - this.lastSample < SAMPLE_MS) return;
		this.lastSample = now;
		const video = this.video;
		const ctx = this.ctx;
		if (!video || !ctx || video.readyState < 2) return;
		ctx.drawImage(video, 0, 0, PROC_W, PROC_H);
		const data = ctx.getImageData(0, 0, PROC_W, PROC_H).data;
		this.faceTick++;
		if (this.faceTick % 12 === 1) this.updateFace(video);
		const roi = this.roi;
		let gSum = 0;
		let rSum = 0;
		let n = 0;
		for (let y = roi.y | 0; y < roi.y + roi.h; y += 2) for (let x = roi.x | 0; x < roi.x + roi.w; x += 2) {
			if (x < 0 || y < 0 || x >= PROC_W || y >= PROC_H) continue;
			const i = (y * PROC_W + x) * 4;
			rSum += data[i];
			gSum += data[i + 1];
			n++;
		}
		if (!n) return;
		const g = gSum / n;
		const r = rSum / n;
		const skinish = r > 40 && g > 30 && r > g * .7;
		this.face = skinish;
		if (!this.emaReady) {
			this.ema = g;
			this.emaReady = true;
		} else this.ema = this.ema * .92 + g * .08;
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
		if (prev > last && prev > prev2 && prev > std * .55 && now - this.lastPeakAt > 420) {
			this.lastPeakAt = now;
			this.peaks.push(now);
			if (this.peaks.length > 10) this.peaks.shift();
		}
		if (this.peaks.length >= 3) {
			const iv = [];
			for (let i = 1; i < this.peaks.length; i++) iv.push(this.peaks[i] - this.peaks[i - 1]);
			const { mean, std: ivStd } = meanStd(iv);
			if (mean > 400 && mean < 1500) this.bpm = Math.round(6e4 / mean);
			else this.bpm = this.bpm;
			this._ivStd = ivStd / 1e3;
		}
		const warming = now - this.startedAt < WARMUP_MS;
		const lit = r + g > 90 && std > .12;
		let label = "warming";
		let raw = this.level;
		if (!warming) {
			if (!lit) {
				label = "need-light";
				raw = this.level * .96 + .88;
			} else {
				const hrScore = clamp(((this.bpm ?? 72) - 64) / 52, 0, 1);
				const motionScore = clamp(this.motion / 14, 0, 1);
				const hrvScore = clamp(this._ivStd / .22, 0, 1);
				raw = 100 * (.42 * hrScore + .38 * motionScore + .2 * hrvScore);
				if (raw < 32) label = "calm";
				else if (raw < 58) label = "steady";
				else if (raw < 78) label = "elevated";
				else label = "high";
			}
		}
		this.level = this.level * .82 + raw * .18;
		this.publish({
			on: true,
			level: Math.round(this.level),
			bpm: warming ? null : this.bpm,
			label,
			face: this.face
		});
	}
	_ivStd = .12;
	frameMotion(data) {
		const gw = 40;
		const gh = 30;
		const gray = /* @__PURE__ */ new Float32Array(1200);
		const sx = PROC_W / gw;
		const sy = PROC_H / gh;
		for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
			const px = Math.min(159, x * sx | 0);
			const i = (Math.min(119, y * sy | 0) * PROC_W + px) * 4;
			gray[y * gw + x] = data[i] * .3 + data[i + 1] * .59 + data[i + 2] * .11;
		}
		let diff = 0;
		if (this.prevGray && this.prevGray.length === gray.length) {
			for (let i = 0; i < gray.length; i++) diff += Math.abs(gray[i] - this.prevGray[i]);
			diff /= gray.length;
		}
		this.prevGray = gray;
		return diff;
	}
	async updateFace(video) {
		const w = video.videoWidth;
		const h = video.videoHeight;
		if (!w || !h) return;
		try {
			const wFD = window.FaceDetector;
			if (wFD && !this.detector) this.detector = new wFD({
				fastMode: true,
				maxDetectedFaces: 1
			});
			if (!this.detector) return;
			const b = (await this.detector.detect(video))[0]?.boundingBox;
			if (!b) return;
			const sx = PROC_W / w;
			const sy = PROC_H / h;
			this.roi = {
				x: clamp((b.x + b.width * .22) * sx, 4, 140),
				y: clamp((b.y + b.height * .1) * sy, 4, 104),
				w: clamp(b.width * .56 * sx, 24, 80),
				h: clamp(b.height * .2 * sy, 12, 40)
			};
		} catch {}
	}
};
var stressEngine = new StressEngine();
var LABEL = {
	off: "Off",
	warming: "Reading pulse…",
	calm: "Valley calm",
	steady: "Focused",
	elevated: "Elevated",
	high: "High stress",
	"need-light": "Need more light"
};
function StressSensorCard() {
	const stress = useAppStore((s) => s.stress);
	const musicPlaying = useAppStore((s) => s.musicPlaying);
	const musicMuted = useAppStore((s) => s.musicMuted);
	const videoRef = (0, import_react.useRef)(null);
	const [err, setErr] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		stressEngine.bindPreview(videoRef.current);
		return () => stressEngine.bindPreview(null);
	}, []);
	const toggle = async () => {
		calmMusic.unlock();
		setErr("");
		setBusy(true);
		try {
			if (stress.on) await stressEngine.stop();
			else await stressEngine.start();
		} catch (e) {
			setErr(e instanceof Error ? e.message : "Camera unavailable.");
		} finally {
			setBusy(false);
		}
	};
	const fill = stress.label === "high" || stress.level >= 78 ? "bg-danger" : stress.level >= 58 ? "bg-coral" : "bg-leaf";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-[0_10px_30px_rgba(61,44,46,0.06)] sm:p-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-coral text-coral-ink",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartPulse, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Webcam stress sensor"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Reads pulse from your face. When stress rises, a valley lullaby fades in."
				})] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: busy,
				onClick: () => void toggle(),
				className: "rounded-full bg-coral px-4 py-2 text-sm font-semibold text-coral-ink disabled:opacity-60",
				children: stress.on ? "Stop sensor" : "Start sensor"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 md:grid-cols-[220px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: videoRef,
						muted: true,
						playsInline: true,
						className: "aspect-[4/3] w-full object-cover",
						style: { transform: "scaleX(-1)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-0 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[52%] w-[46%] rounded-full border-2 border-coral-ink/70" })
					}),
					!stress.on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 flex items-center justify-center bg-ink/55 px-3 text-center text-xs text-coral-ink",
						children: "Sit in the light. Keep your face in the oval."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col justify-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-medium tracking-wide text-muted uppercase",
							children: "Stress"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-4xl tabular-nums text-ink",
							children: stress.on ? stress.level : "—"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Pulse"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-display text-2xl tabular-nums",
								children: [stress.bpm ? `${stress.bpm}` : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-sm text-muted",
									children: "bpm"
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-2.5 overflow-hidden rounded-full bg-paper-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `h-full ${fill} transition-[width] duration-300`,
							style: { width: `${stress.on ? stress.level : 0}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-4 text-leaf" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: LABEL[stress.label]
							}),
							stress.on && !stress.face && stress.label !== "warming" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: "· face the camera"
							})
						]
					}),
					err && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: err
					}),
					(stress.label === "elevated" || stress.label === "high" || musicPlaying) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreatheCoach, {
						playing: musicPlaying,
						muted: musicMuted
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								calmMusic.unlock();
								if (musicPlaying && !stress.on) calmMusic.stop();
								else useAppStore.getState().setMusicManual(true);
							},
							className: "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music, { className: "size-3.5" }), musicPlaying && !stress.on ? "Stop sample" : "Play calm music"]
						}), musicPlaying && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								calmMusic.unlock();
								calmMusic.setMuted(!musicMuted);
							},
							className: "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium",
							children: [musicMuted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-3.5" }), musicMuted ? "Unmute" : "Mute"]
						})]
					})
				]
			})]
		})]
	});
}
function BreatheCoach({ playing, muted }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stress-breathe size-9 rounded-full bg-leaf/25 ring-2 ring-leaf/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-ink",
			children: ["Breathe in 4 · hold 4 · out 6.", playing && !muted ? " Valley music is playing." : playing && muted ? " Music is muted." : " Music will fade in."]
		})]
	});
}
function StressBar() {
	const stress = useAppStore((s) => s.stress);
	const setTab = useAppStore((s) => s.setTab);
	const musicPlaying = useAppStore((s) => s.musicPlaying);
	const musicMuted = useAppStore((s) => s.musicMuted);
	const miniRef = (0, import_react.useRef)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		stressEngine.bindMini(miniRef.current);
		return () => stressEngine.bindMini(null);
	}, []);
	const toggle = async () => {
		calmMusic.unlock();
		setBusy(true);
		try {
			if (stress.on) await stressEngine.stop();
			else await stressEngine.start();
		} catch {
			setTab("dashboard");
		} finally {
			setBusy(false);
		}
	};
	const fill = stress.label === "high" || stress.level >= 78 ? "bg-danger" : stress.level >= 58 ? "bg-coral" : "bg-leaf";
	const badge = stress.label === "off" ? "Valley calm" : stress.label === "warming" ? "Reading pulse" : stress.label === "need-light" ? "Need light" : stress.label === "high" ? "High stress" : stress.label === "elevated" ? "Elevated" : stress.label === "steady" ? "Focused" : "Valley calm";
	const badgeClass = stress.label === "high" || stress.label === "elevated" ? "bg-danger/15 text-danger" : stress.label === "steady" ? "bg-coral/15 text-coral" : "bg-leaf/15 text-leaf";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-1 items-center gap-2 sm:gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTab("dashboard"),
				className: `shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`,
				children: badge
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-paper-2 sm:block md:max-w-48",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full ${fill} transition-[width] duration-300`,
					style: { width: `${stress.on ? stress.level : 8}%` }
				})
			}),
			stress.on && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "hidden text-xs tabular-nums text-muted sm:inline",
				children: [stress.level, stress.bpm ? ` · ${stress.bpm} bpm` : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: miniRef,
				muted: true,
				playsInline: true,
				className: `size-7 shrink-0 rounded-full object-cover ${stress.on ? "ring-1 ring-line" : "hidden"}`,
				style: { transform: "scaleX(-1)" },
				"aria-hidden": true
			}),
			musicPlaying && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-label": musicMuted ? "Unmute calm music" : "Mute calm music",
				onClick: () => {
					calmMusic.unlock();
					calmMusic.setMuted(!musicMuted);
				},
				className: "inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-leaf",
				children: [musicMuted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: musicMuted ? "Muted" : "Music"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: busy,
				onClick: () => void toggle(),
				className: "shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium",
				children: stress.on ? "Stop" : "Start sensor"
			})
		]
	});
}
function Dashboard() {
	const pomodoro = useAppStore((s) => s.pomodoro);
	const setPomodoro = useAppStore((s) => s.setPomodoro);
	const player = useAppStore((s) => s.player);
	const quest = useAppStore((s) => s.quest);
	const setTab = useAppStore((s) => s.setTab);
	const stress = useAppStore((s) => s.stress);
	(0, import_react.useEffect)(() => {
		if (!pomodoro.run) return;
		const t = window.setInterval(() => {
			setPomodoro((p) => {
				if (p.s > 0) return {
					...p,
					s: p.s - 1
				};
				if (p.m > 0) return {
					...p,
					m: p.m - 1,
					s: 59
				};
				return {
					m: 5,
					s: 0,
					run: false
				};
			});
		}, 1e3);
		return () => window.clearInterval(t);
	}, [pomodoro.run, setPomodoro]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold text-ink",
				children: "Focus Physiology"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Study in a valley. Harvest what you remember."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[var(--radius-xl)] border border-line bg-card p-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Focus timer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 font-display text-4xl tabular-nums text-coral",
								children: [
									String(pomodoro.m).padStart(2, "0"),
									":",
									String(pomodoro.s).padStart(2, "0")
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPomodoro((p) => ({
									...p,
									run: !p.run
								})),
								className: "mt-4 inline-flex size-11 items-center justify-center rounded-full bg-coral text-coral-ink",
								"aria-label": pomodoro.run ? "Pause timer" : "Start timer",
								children: pomodoro.run ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[var(--radius-xl)] border border-line bg-card p-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Farmer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 font-display text-2xl",
								children: ["Lv. ", player.level]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-2 overflow-hidden rounded-full bg-paper-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-coral",
									style: { width: `${player.xp / (player.level * 60) * 100}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-muted tabular-nums",
								children: [
									player.xp,
									"/",
									player.level * 60,
									" XP · HP ",
									player.hp,
									"/",
									player.maxHp
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[var(--radius-xl)] border border-line bg-card p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-medium tracking-wide text-muted uppercase",
								children: "Current quest"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-display text-lg leading-snug",
								children: quest ? quest.title : "No story yet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: quest ? `${quest.chapters.length} chapters · ${quest.questions.length} challenges` : "Open Storyteller, add notes, then transform."
							}),
							stress.on && stress.level >= 72 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-danger",
								children: "Pulse is up — take a breath before the farm."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setTab(quest ? "rpg" : "story"),
								className: "mt-4 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper",
								children: quest ? "Continue on the farm" : "Open Storyteller"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StressSensorCard, {})
		]
	});
}
var GAME_KEYS = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Space"
]);
function buildMap() {
	const W = 52;
	const g = Array.from({ length: 24 }, (_, y) => Array.from({ length: W }, (_, x) => {
		if (y === 0 || y === 23 || x === 0 || x === 51) return "#";
		return (x + y) % 7 === 0 ? "," : ".";
	}));
	const set = (x, y, ch) => {
		if (y > 0 && y < 23 && x > 0 && x < 51) g[y][x] = ch;
	};
	const rect = (x, y, w, h, ch) => {
		for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, ch);
	};
	rect(3, 2, 7, 5, "~");
	rect(3, 16, 6, 5, "~");
	rect(20, 3, 7, 4, "H");
	rect(20, 7, 7, 1, "F");
	set(23, 7, "=");
	rect(38, 8, 7, 4, "B");
	rect(38, 12, 7, 1, "F");
	rect(8, 9, 6, 4, "C");
	rect(32, 15, 5, 3, "C");
	rect(14, 18, 4, 2, "C");
	for (let x = 23; x <= 41; x++) set(x, 13, "=");
	for (let y = 7; y <= 13; y++) set(23, y, "=");
	for (let x = 10; x <= 23; x++) set(x, 8, "=");
	for (let y = 8; y <= 12; y++) set(10, y, "=");
	for (let x = 10; x <= 16; x++) set(x, 12, "=");
	for (const [x, y] of [
		[5, 8],
		[6, 9],
		[16, 3],
		[17, 4],
		[30, 3],
		[31, 4],
		[44, 4],
		[45, 5],
		[4, 13],
		[15, 15],
		[28, 18],
		[46, 16],
		[47, 17],
		[35, 5],
		[12, 20]
	]) set(x, y, "T");
	for (const [x, y] of [
		[14, 5],
		[15, 6],
		[27, 5],
		[28, 6],
		[7, 14],
		[18, 16],
		[34, 7],
		[42, 18],
		[25, 16],
		[36, 20]
	]) set(x, y, "*");
	rect(40, 14, 4, 3, "o");
	set(18, 6, "W");
	set(36, 13, "R");
	return g.map((row) => row.join(""));
}
var LAYOUT = buildMap();
var MAP_COLS = LAYOUT[0].length;
var MAP_ROWS = LAYOUT.length;
var WORLD_W = MAP_COLS * 16;
var WORLD_H = MAP_ROWS * 16;
var SOLID = /* @__PURE__ */ new Set([
	"#",
	"T",
	"H",
	"B",
	"F",
	"~",
	"W"
]);
function tileAt(tx, ty) {
	if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return "#";
	return LAYOUT[ty][tx];
}
function solidAtPixel(px, py) {
	return SOLID.has(tileAt(Math.floor(px / 16), Math.floor(py / 16)));
}
function blocked(x, y, r = 4) {
	return solidAtPixel(x - r, y - r) || solidAtPixel(x + r, y - r) || solidAtPixel(x - r, y + r) || solidAtPixel(x + r, y + r);
}
function radialDeadzone(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
var FarmEngine = class {
	canvas;
	ctx;
	buffer;
	bctx;
	keys = /* @__PURE__ */ new Set();
	player = {
		x: 376,
		y: 152,
		facing: 1,
		walk: 0,
		dir: 2
	};
	cam = {
		x: 0,
		y: 0
	};
	crops = [];
	critters = [];
	particles = [];
	floats = [];
	time = 0;
	running = false;
	raf = 0;
	last = 0;
	combatLock = false;
	iFrames = 0;
	coins = 0;
	harvested = 0;
	currentSpeed = 0;
	onCombat;
	joystick = {
		active: false,
		dx: 0,
		dy: 0
	};
	joyOrigin = {
		x: 48,
		y: 132
	};
	pointerIds = /* @__PURE__ */ new Map();
	npc = {
		x: 344,
		y: 132,
		wave: 0
	};
	constructor(canvas, onCombat) {
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("No 2d context");
		this.ctx = ctx;
		this.buffer = document.createElement("canvas");
		this.buffer.width = 320;
		this.buffer.height = 180;
		const bctx = this.buffer.getContext("2d");
		if (!bctx) throw new Error("No buffer");
		this.bctx = bctx;
		this.onCombat = onCombat;
		this.seed();
	}
	seed() {
		this.crops = [];
		for (let ty = 0; ty < MAP_ROWS; ty++) for (let tx = 0; tx < MAP_COLS; tx++) if (tileAt(tx, ty) === "C") this.crops.push({
			x: tx * 16 + 8,
			y: ty * 16 + 8,
			ripe: true,
			regen: 0,
			kind: (tx + ty) % 3
		});
		this.critters = [
			{
				id: 1,
				x: 192,
				y: 80,
				dir: .4,
				bob: 0,
				kind: "slime",
				hp: 40,
				maxHp: 40,
				name: "Leaf Slime",
				alive: true
			},
			{
				id: 2,
				x: 544,
				y: 64,
				dir: 1.2,
				bob: 1,
				kind: "slime",
				hp: 48,
				maxHp: 48,
				name: "Crop Wisp",
				alive: true
			},
			{
				id: 3,
				x: 704,
				y: 288,
				dir: 2.1,
				bob: 2,
				kind: "slime",
				hp: 56,
				maxHp: 56,
				name: "Orchard Slime",
				alive: true
			},
			{
				id: 4,
				x: 112,
				y: 288,
				dir: 3.4,
				bob: .5,
				kind: "slime",
				hp: 44,
				maxHp: 44,
				name: "Path Sprite",
				alive: true
			},
			{
				id: 101,
				x: 656,
				y: 240,
				dir: 0,
				bob: 0,
				kind: "chicken",
				hp: 1,
				maxHp: 1,
				name: "Hen",
				alive: true
			},
			{
				id: 102,
				x: 672,
				y: 256,
				dir: 1,
				bob: 1,
				kind: "chicken",
				hp: 1,
				maxHp: 1,
				name: "Hen",
				alive: true
			},
			{
				id: 103,
				x: 640,
				y: 256,
				dir: 2,
				bob: 2,
				kind: "chicken",
				hp: 1,
				maxHp: 1,
				name: "Hen",
				alive: true
			}
		];
	}
	attach() {
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
		document.addEventListener("visibilitychange", this.onBlur);
		this.canvas.addEventListener("pointerdown", this.onPointerDown);
		this.canvas.addEventListener("pointermove", this.onPointerMove);
		this.canvas.addEventListener("pointerup", this.onPointerUp);
		this.canvas.addEventListener("pointercancel", this.onPointerUp);
		window.__controlsTest = {
			getYaw: () => this.player.dir === 1 ? Math.PI : 0,
			getSpeed: () => this.currentSpeed,
			setKeys: (codes) => {
				this.keys.clear();
				for (const c of codes) this.keys.add(c);
			},
			getPos: () => ({
				x: this.player.x,
				y: this.player.y
			})
		};
	}
	detach() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.onBlur);
		document.removeEventListener("visibilitychange", this.onBlur);
		this.canvas.removeEventListener("pointerdown", this.onPointerDown);
		this.canvas.removeEventListener("pointermove", this.onPointerMove);
		this.canvas.removeEventListener("pointerup", this.onPointerUp);
		this.canvas.removeEventListener("pointercancel", this.onPointerUp);
		if (window.__controlsTest) delete window.__controlsTest;
		this.stop();
	}
	onKeyDown = (e) => {
		const t = e.target;
		if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
		this.keys.add(e.code);
		if (GAME_KEYS.has(e.code)) e.preventDefault();
	};
	onKeyUp = (e) => {
		this.keys.delete(e.code);
	};
	onBlur = () => {
		this.keys.clear();
		this.joystick.active = false;
		this.joystick.dx = 0;
		this.joystick.dy = 0;
	};
	canvasToLocal(e) {
		const r = this.canvas.getBoundingClientRect();
		return {
			x: (e.clientX - r.left) / r.width * 320,
			y: (e.clientY - r.top) / r.height * 180
		};
	}
	onPointerDown = (e) => {
		const p = this.canvasToLocal(e);
		if (p.x < 134.4 && p.y > 81) {
			this.canvas.setPointerCapture(e.pointerId);
			this.joystick = {
				active: true,
				dx: 0,
				dy: 0
			};
			this.joyOrigin = {
				x: p.x,
				y: p.y
			};
			this.pointerIds.set(e.pointerId, { kind: "joy" });
		}
	};
	onPointerMove = (e) => {
		if (!this.pointerIds.has(e.pointerId)) return;
		const p = this.canvasToLocal(e);
		let dx = p.x - this.joyOrigin.x;
		let dy = p.y - this.joyOrigin.y;
		const m = Math.hypot(dx, dy);
		if (m < 6) {
			this.joystick.dx = 0;
			this.joystick.dy = 0;
			return;
		}
		const scale = Math.min(1, (m - 6) / 26);
		this.joystick.dx = dx / m * scale;
		this.joystick.dy = dy / m * scale;
	};
	onPointerUp = (e) => {
		if (!this.pointerIds.has(e.pointerId)) return;
		this.pointerIds.delete(e.pointerId);
		this.joystick.active = false;
		this.joystick.dx = 0;
		this.joystick.dy = 0;
	};
	start() {
		if (this.running) return;
		this.running = true;
		this.last = performance.now();
		const tick = (now) => {
			if (!this.running) return;
			const dt = Math.min(.05, (now - this.last) / 1e3);
			this.last = now;
			this.update(dt);
			this.draw();
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}
	stop() {
		this.running = false;
		cancelAnimationFrame(this.raf);
	}
	defeatEnemy(id) {
		const e = this.critters.find((x) => x.id === id);
		if (e && e.kind === "slime") {
			e.alive = false;
			this.burst(e.x, e.y, "#E53935");
			this.coins += 8;
			this.floats.push({
				x: e.x,
				y: e.y - 8,
				life: .9,
				text: "+8"
			});
		}
		this.releaseCombat();
	}
	releaseCombat() {
		this.combatLock = false;
		this.iFrames = 1.4;
		const s = this.critters.find((c) => c.kind === "slime" && c.alive);
		if (s) {
			const dx = this.player.x - s.x;
			const dy = this.player.y - s.y;
			const m = Math.hypot(dx, dy) || 1;
			const nx = this.player.x + dx / m * 22;
			const ny = this.player.y + dy / m * 22;
			if (!blocked(nx, this.player.y)) this.player.x = nx;
			if (!blocked(this.player.x, ny)) this.player.y = ny;
		}
	}
	burst(x, y, color) {
		for (let i = 0; i < 8; i++) {
			const a = i / 8 * Math.PI * 2;
			this.particles.push({
				x,
				y,
				vx: Math.cos(a) * 28,
				vy: Math.sin(a) * 28,
				life: .35,
				color
			});
		}
	}
	pollGamepad() {
		const pads = navigator.getGamepads?.() ?? [];
		for (const pad of pads) {
			if (!pad) continue;
			const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
			if (Math.hypot(stick.x, stick.y) > .05) return stick;
			let x = 0;
			let y = 0;
			if (pad.buttons[14]?.pressed) x -= 1;
			if (pad.buttons[15]?.pressed) x += 1;
			if (pad.buttons[12]?.pressed) y -= 1;
			if (pad.buttons[13]?.pressed) y += 1;
			if (x || y) return {
				x,
				y
			};
		}
		return {
			x: 0,
			y: 0
		};
	}
	update(dt) {
		this.time += dt;
		if (this.iFrames > 0) this.iFrames -= dt;
		this.npc.wave += dt;
		let mx = 0;
		let my = 0;
		if (!this.combatLock) {
			if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) mx -= 1;
			if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) mx += 1;
			if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) my -= 1;
			if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) my += 1;
			if (this.joystick.active) {
				mx += this.joystick.dx;
				my += this.joystick.dy;
			}
			const pad = this.pollGamepad();
			mx += pad.x;
			my += pad.y;
		}
		const mag = Math.hypot(mx, my);
		if (mag > 1) {
			mx /= mag;
			my /= mag;
		}
		this.currentSpeed = mag > .05 ? 68 * Math.min(1, mag) : 0;
		if (Math.abs(mx) > Math.abs(my)) this.player.dir = mx < 0 ? 1 : 2;
		else if (Math.abs(my) > .05) this.player.dir = my < 0 ? 3 : 0;
		if (mx !== 0) this.player.facing = mx < 0 ? -1 : 1;
		if (mag > .05) this.player.walk += dt * 9;
		else this.player.walk = 0;
		if (!this.combatLock && mag > .05) {
			const nx = this.player.x + mx * 68 * dt;
			const ny = this.player.y + my * 68 * dt;
			if (!blocked(nx, this.player.y)) this.player.x = nx;
			if (!blocked(this.player.x, ny)) this.player.y = ny;
			this.player.x = Math.max(20, Math.min(WORLD_W - 16 - 4, this.player.x));
			this.player.y = Math.max(20, Math.min(WORLD_H - 16 - 4, this.player.y));
		}
		this.cam.x = this.player.x - 160;
		this.cam.y = this.player.y - 90;
		this.cam.x = Math.max(0, Math.min(WORLD_W - 320, this.cam.x));
		this.cam.y = Math.max(0, Math.min(WORLD_H - 180, this.cam.y));
		for (const c of this.crops) {
			if (!c.ripe) {
				c.regen -= dt;
				if (c.regen <= 0) c.ripe = true;
				continue;
			}
			if (this.combatLock) continue;
			if (Math.hypot(c.x - this.player.x, c.y - this.player.y) < 10) {
				c.ripe = false;
				c.regen = 7 + Math.random() * 4;
				this.harvested += 1;
				this.coins += 2;
				this.burst(c.x, c.y, c.kind === 0 ? "#EC407A" : c.kind === 1 ? "#FFEE58" : "#66BB6A");
				this.floats.push({
					x: c.x,
					y: c.y - 6,
					life: .7,
					text: "+2"
				});
			}
		}
		for (const e of this.critters) {
			if (!e.alive) continue;
			e.bob += dt;
			const speed = e.kind === "chicken" ? 22 : 16;
			e.dir += (Math.random() - .5) * dt * 3;
			const ex = e.x + Math.cos(e.dir) * speed * dt;
			const ey = e.y + Math.sin(e.dir) * speed * dt;
			if (!blocked(ex, e.y, 3)) e.x = ex;
			else e.dir += Math.PI * .6;
			if (!blocked(e.x, ey, 3)) e.y = ey;
			if (e.kind !== "slime" || this.combatLock || this.iFrames > 0) continue;
			if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 11) {
				this.combatLock = true;
				this.currentSpeed = 0;
				try {
					this.onCombat({
						id: e.id,
						name: e.name,
						hp: e.hp,
						maxHp: e.maxHp
					});
				} catch {
					this.combatLock = false;
				}
			}
		}
		for (const p of this.particles) {
			p.life -= dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += 40 * dt;
		}
		this.particles = this.particles.filter((p) => p.life > 0);
		for (const f of this.floats) {
			f.life -= dt;
			f.y -= 18 * dt;
		}
		this.floats = this.floats.filter((f) => f.life > 0);
	}
	draw() {
		const ctx = this.bctx;
		ctx.imageSmoothingEnabled = false;
		const ox = Math.floor(this.cam.x);
		const oy = Math.floor(this.cam.y);
		const t0 = Math.max(0, Math.floor(ox / 16) - 1);
		const t1 = Math.min(MAP_COLS, Math.ceil((ox + 320) / 16) + 1);
		const r0 = Math.max(0, Math.floor(oy / 16) - 1);
		const r1 = Math.min(MAP_ROWS, Math.ceil((oy + 180) / 16) + 1);
		for (let ty = r0; ty < r1; ty++) for (let tx = t0; tx < t1; tx++) this.drawTile(ctx, tileAt(tx, ty), tx * 16 - ox, ty * 16 - oy, tx, ty);
		for (const c of this.crops) {
			if (!c.ripe) continue;
			this.drawCrop(ctx, c.x - ox, c.y - oy, c.kind);
		}
		const drawables = [];
		drawables.push({
			y: this.npc.y,
			draw: () => this.drawNpc(ctx, this.npc.x - ox, this.npc.y - oy)
		});
		for (const e of this.critters) {
			if (!e.alive) continue;
			drawables.push({
				y: e.y,
				draw: () => {
					if (e.kind === "slime") this.drawSlime(ctx, e.x - ox, e.y - oy + Math.sin(e.bob * 4) * 1.4);
					else this.drawChicken(ctx, e.x - ox, e.y - oy, e);
				}
			});
		}
		drawables.push({
			y: this.player.y,
			draw: () => this.drawFarmer(ctx, this.player.x - ox, this.player.y - oy)
		});
		drawables.sort((a, b) => a.y - b.y);
		for (const d of drawables) d.draw();
		for (const p of this.particles) this.px(ctx, p.x - ox, p.y - oy, 2, 2, p.color);
		ctx.imageSmoothingEnabled = false;
		ctx.font = "8px sans-serif";
		ctx.textAlign = "center";
		for (const f of this.floats) {
			ctx.globalAlpha = Math.max(0, f.life);
			ctx.fillStyle = "#fff8f4";
			ctx.fillText(f.text, Math.round(f.x - ox), Math.round(f.y - oy));
			ctx.globalAlpha = 1;
		}
		this.drawHud(ctx);
		const out = this.ctx;
		out.imageSmoothingEnabled = false;
		out.clearRect(0, 0, this.canvas.width, this.canvas.height);
		out.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
	}
	px(ctx, x, y, w, h, c) {
		ctx.fillStyle = c;
		ctx.fillRect(Math.round(x), Math.round(y), w, h);
	}
	drawTile(ctx, t, x, y, tx, ty) {
		const grassA = (tx + ty) % 2 === 0 ? "#7CB342" : "#8BC34A";
		const grassB = (tx + ty) % 2 === 0 ? "#689F38" : "#7CB342";
		if (t === "~") {
			const w = .5 + .5 * Math.sin(this.time * 2 + tx * .4 + ty * .3);
			this.px(ctx, x, y, 16, 16, w > .5 ? "#4FC3F7" : "#29B6F6");
			this.px(ctx, x + 3, y + 6, 5, 1, "#E1F5FE");
			this.px(ctx, x + 8, y + 10, 4, 1, "#81D4FA");
			return;
		}
		if (t === "=") {
			this.px(ctx, x, y, 16, 16, "#D7CCC8");
			this.px(ctx, x + 1, y + 1, 14, 14, "#C4A574");
			this.px(ctx, x + 5, y + 7, 2, 2, "#A1887F");
			return;
		}
		if (t === "H") {
			this.px(ctx, x, y, 16, 16, "#A1887F");
			this.px(ctx, x, y, 16, 7, "#8D3B2F");
			this.px(ctx, x + 2, y + 7, 12, 9, "#D7CCC8");
			this.px(ctx, x + 6, y + 10, 4, 6, "#5D4037");
			this.px(ctx, x + 3, y + 9, 3, 3, "#81D4FA");
			return;
		}
		if (t === "B") {
			this.px(ctx, x, y, 16, 16, "#A1887F");
			this.px(ctx, x, y, 16, 6, "#6D4C41");
			this.px(ctx, x + 2, y + 6, 12, 10, "#BCAAA4");
			this.px(ctx, x + 6, y + 10, 4, 6, "#4E342E");
			return;
		}
		if (t === "F") {
			this.px(ctx, x, y, 16, 16, grassA);
			this.px(ctx, x + 1, y + 6, 14, 2, "#8D6E63");
			this.px(ctx, x + 2, y + 3, 2, 10, "#6D4C41");
			this.px(ctx, x + 12, y + 3, 2, 10, "#6D4C41");
			return;
		}
		if (t === "T") {
			this.px(ctx, x, y, 16, 16, grassB);
			this.px(ctx, x + 6, y + 9, 4, 7, "#5D4037");
			this.px(ctx, x + 2, y + 2, 12, 10, "#2E7D32");
			this.px(ctx, x + 4, y + 0, 8, 7, "#388E3C");
			this.px(ctx, x + 5, y + 3, 3, 3, "#1B5E20");
			return;
		}
		if (t === "C") {
			this.px(ctx, x, y, 16, 16, "#8D6E63");
			this.px(ctx, x + 1, y + 1, 14, 14, "#6D4C41");
			this.px(ctx, x + 2, y + 2, 12, 12, "#795548");
			return;
		}
		if (t === "*") {
			this.px(ctx, x, y, 16, 16, grassA);
			this.px(ctx, x + 6, y + 8, 2, 5, "#558B2F");
			this.px(ctx, x + 5, y + 5, 4, 4, "#EC407A");
			this.px(ctx, x + 6, y + 6, 2, 2, "#FFF59D");
			return;
		}
		if (t === "o") {
			this.px(ctx, x, y, 16, 16, "#A1887F");
			this.px(ctx, x + 1, y + 4, 14, 10, "#BCAAA4");
			this.px(ctx, x + 2, y + 2, 12, 3, "#8D6E63");
			return;
		}
		if (t === "W") {
			this.px(ctx, x, y, 16, 16, grassA);
			this.px(ctx, x + 3, y + 4, 10, 10, "#90A4AE");
			this.px(ctx, x + 5, y + 6, 6, 6, "#4FC3F7");
			return;
		}
		if (t === "R") {
			this.px(ctx, x, y, 16, 16, grassA);
			const pulse = .5 + .5 * Math.sin(this.time * 3);
			this.px(ctx, x + 4, y + 3, 8, 10, pulse > .5 ? "#CE93D8" : "#AB47BC");
			this.px(ctx, x + 6, y + 6, 4, 4, "#F3E5F5");
			return;
		}
		if (t === "#") {
			this.px(ctx, x, y, 16, 16, "#5D4037");
			this.px(ctx, x + 1, y + 1, 14, 14, "#6D4C41");
			this.px(ctx, x + 4, y + 4, 3, 3, "#8D6E63");
			return;
		}
		this.px(ctx, x, y, 16, 16, t === "," ? grassB : grassA);
		if ((tx * 3 + ty * 7) % 6 === 0) this.px(ctx, x + 4, y + 9, 1, 2, "#AED581");
	}
	drawCrop(ctx, x, y, kind) {
		const px = Math.round(x - 8);
		const py = Math.round(y - 8);
		if (kind === 0) {
			this.px(ctx, px + 6, py + 8, 2, 5, "#558B2F");
			this.px(ctx, px + 4, py + 4, 6, 5, "#EC407A");
			this.px(ctx, px + 6, py + 5, 2, 2, "#FFF59D");
		} else if (kind === 1) {
			this.px(ctx, px + 5, py + 6, 6, 7, "#FDD835");
			this.px(ctx, px + 6, py + 4, 4, 3, "#F9A825");
		} else {
			this.px(ctx, px + 4, py + 5, 3, 8, "#66BB6A");
			this.px(ctx, px + 9, py + 4, 3, 9, "#43A047");
			this.px(ctx, px + 7, py + 3, 2, 2, "#E53935");
		}
	}
	drawFarmer(ctx, x, y) {
		const f = this.player.facing;
		const step = Math.floor(this.player.walk) % 2;
		const bob = this.player.walk ? step ? 1 : 0 : 0;
		const px = Math.round(x - 6);
		const py = Math.round(y - 14 - bob);
		this.px(ctx, px + 4, py + 16, 3, 2, "#4E342E");
		this.px(ctx, px + 8, py + 16, 3, 2, "#4E342E");
		if (step) this.px(ctx, px + 3, py + 16, 3, 2, "#4E342E");
		this.px(ctx, px + 3, py + 10, 7, 6, "#1565C0");
		this.px(ctx, px + 2, py + 11, 2, 4, "#FFCC80");
		this.px(ctx, px + 9, py + 11, 2, 4, "#FFCC80");
		this.px(ctx, px + 4, py + 4, 5, 6, "#FFCC80");
		this.px(ctx, px + 3, py + 1, 7, 4, "#6D4C41");
		this.px(ctx, px + 2, py, 9, 2, "#5D4037");
		this.px(ctx, px + (f < 0 ? 3 : 6), py + 6, 2, 2, "#3E2723");
		this.px(ctx, px + 5, py + 8, 3, 1, "#E07A5F");
	}
	drawNpc(ctx, x, y) {
		const px = Math.round(x - 6);
		const py = Math.round(y - 14);
		this.px(ctx, px + 3, py + 10, 7, 6, "#6A1B9A");
		this.px(ctx, px + 4, py + 4, 5, 6, "#FFCC80");
		this.px(ctx, px + 3, py + 1, 7, 4, "#F4C7B8");
		this.px(ctx, px + 2, py, 9, 2, "#E07A5F");
		this.px(ctx, px + 4, py + 16, 3, 2, "#4E342E");
		this.px(ctx, px + 8, py + 16, 3, 2, "#4E342E");
		if (Math.hypot(this.player.x - this.npc.x, this.player.y - this.npc.y) < 22) {
			this.px(ctx, px - 6, py - 12, 28, 10, "#fffdfb");
			ctx.fillStyle = "#3d2c2e";
			ctx.font = "7px sans-serif";
			ctx.textAlign = "left";
			ctx.fillText("Harvest crops!", px - 4, py - 5);
		}
	}
	drawSlime(ctx, x, y) {
		const px = Math.round(x - 7);
		const py = Math.round(y - 8);
		this.px(ctx, px + 2, py + 4, 12, 8, "#E53935");
		this.px(ctx, px + 4, py + 2, 8, 4, "#EF5350");
		this.px(ctx, px + 4, py + 6, 2, 2, "#fff");
		this.px(ctx, px + 9, py + 6, 2, 2, "#fff");
		this.px(ctx, px + 5, py + 7, 1, 1, "#212121");
		this.px(ctx, px + 10, py + 7, 1, 1, "#212121");
	}
	drawChicken(ctx, x, y, e) {
		const px = Math.round(x - 5);
		const py = Math.round(y - 6 + Math.sin(e.bob * 6) * .6);
		this.px(ctx, px + 2, py + 3, 8, 6, "#FFF8E1");
		this.px(ctx, px + 8, py + 2, 4, 4, "#FFF8E1");
		this.px(ctx, px + 11, py + 3, 2, 2, "#F9A825");
		this.px(ctx, px + 5, py + 1, 2, 2, "#E53935");
		this.px(ctx, px + 3, py + 9, 2, 2, "#F9A825");
		this.px(ctx, px + 7, py + 9, 2, 2, "#F9A825");
	}
	drawHud(ctx) {
		this.px(ctx, 6, 6, 78, 14, "rgba(61,44,46,0.45)");
		ctx.fillStyle = "#fff8f4";
		ctx.font = "8px sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(`Coins ${this.coins}  Crops ${this.harvested}`, 10, 16);
		if (this.joystick.active) {
			this.px(ctx, this.joyOrigin.x - 16, this.joyOrigin.y - 16, 32, 32, "rgba(255,255,255,0.22)");
			this.px(ctx, this.joyOrigin.x - 4 + this.joystick.dx * 12, this.joyOrigin.y - 4 + this.joystick.dy * 12, 8, 8, "rgba(61,44,46,0.55)");
		}
	}
};
var FALLBACK = [
	{
		q: "What is the powerhouse of the cell?",
		a: "Mitochondria",
		options: [
			"Mitochondria",
			"Nucleus",
			"Ribosome",
			"Golgi apparatus"
		]
	},
	{
		q: "Which hormone lowers blood sugar?",
		a: "Insulin",
		options: [
			"Insulin",
			"Glucagon",
			"Cortisol",
			"Adrenaline"
		]
	},
	{
		q: "Basic unit of life?",
		a: "Cell",
		options: [
			"Cell",
			"Atom",
			"Tissue",
			"Organ"
		]
	}
];
function FarmGame() {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const questions = useAppStore((s) => s.questions);
	const questionsRef = (0, import_react.useRef)(questions);
	questionsRef.current = questions;
	const player = useAppStore((s) => s.player);
	const setPlayer = useAppStore((s) => s.setPlayer);
	const stress = useAppStore((s) => s.stress);
	const musicPlaying = useAppStore((s) => s.musicPlaying);
	const [combat, setCombat] = (0, import_react.useState)(null);
	const combatRef = (0, import_react.useRef)(null);
	combatRef.current = combat;
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const fit = () => {
			const cssW = Math.max(1, wrap.clientWidth);
			const cssH = Math.round(cssW * (180 / 320));
			const dpr = window.devicePixelRatio || 1;
			const intScale = Math.max(2, Math.floor(dpr * (cssW / 320)));
			canvas.width = 320 * intScale;
			canvas.height = 180 * intScale;
			canvas.style.width = `${cssW}px`;
			canvas.style.height = `${cssH}px`;
		};
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(wrap);
		const engine = new FarmEngine(canvas, (payload) => {
			const pool = questionsRef.current.length ? questionsRef.current : FALLBACK;
			const qs = Array.from({ length: 3 }, (_, i) => pool[i % pool.length]);
			setCombat({
				...payload,
				q: 0,
				answered: false,
				qs
			});
		});
		engine.attach();
		engine.start();
		engineRef.current = engine;
		return () => {
			engine.detach();
			engineRef.current = null;
			ro.disconnect();
		};
	}, []);
	const hold = (code, down) => {
		const e = engineRef.current;
		if (!e) return;
		if (down) e.keys.add(code);
		else e.keys.delete(code);
	};
	const answer = (opt) => {
		const cur = combatRef.current;
		if (!cur || cur.answered) return;
		const correct = opt === cur.qs[cur.q].a;
		const nextHp = correct ? Math.max(0, cur.hp - (player.atk + 8)) : cur.hp;
		setCombat({
			...cur,
			answered: correct ? "ok" : "bad",
			hp: nextHp
		});
		if (!correct) setPlayer((p) => ({
			...p,
			hp: Math.max(0, p.hp - 12)
		}));
		window.setTimeout(() => {
			const live = combatRef.current;
			if (!live) return;
			if (correct && nextHp <= 0) {
				engineRef.current?.defeatEnemy(live.id);
				setPlayer((p) => {
					const xp = p.xp + 28;
					const up = xp >= p.level * 60;
					return {
						...p,
						xp: up ? 0 : xp,
						level: up ? p.level + 1 : p.level,
						maxHp: up ? p.maxHp + 12 : p.maxHp,
						hp: up ? p.maxHp + 12 : Math.min(p.hp + 18, p.maxHp),
						atk: up ? p.atk + 3 : p.atk,
						zones: p.zones + 1
					};
				});
				setCombat(null);
				return;
			}
			if (live.q >= 2) {
				engineRef.current?.releaseCombat();
				setCombat(null);
				return;
			}
			setCombat({
				...live,
				q: live.q + 1,
				answered: false,
				hp: nextHp
			});
		}, 620);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl font-semibold text-ink",
					children: "Valley Farm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Walk, harvest crops, bump a red slime to quiz."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-card px-3 py-2 text-xs tabular-nums",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-danger",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "size-3.5" }),
								" ",
								player.hp,
								"/",
								player.maxHp
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Lv.", player.level] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [
								player.xp,
								"/",
								player.level * 60,
								" XP"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: wrapRef,
				className: "relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink shadow-[0_12px_32px_rgba(61,44,46,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						tabIndex: 0,
						className: "block w-full touch-none",
						style: { imageRendering: "pixelated" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-x-0 bottom-0 hidden p-3 md:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-full bg-ink/55 px-3 py-1 text-center text-[11px] text-coral-ink",
							children: "WASD or arrows to walk · harvest glowing crops · bump a red slime to battle"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-3 bottom-3 flex flex-col items-center gap-1 md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
							code: "ArrowUp",
							onHold: hold,
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
									code: "ArrowLeft",
									onHold: hold,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
									code: "ArrowDown",
									onHold: hold,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
									code: "ArrowRight",
									onHold: hold,
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5" })
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted md:hidden",
				children: "Use the pad or drag on the left side of the farm to walk."
			}),
			stress.on && stress.level >= 72 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 py-2 text-sm",
				children: [
					"Pulse is up. ",
					musicPlaying ? "Calm music is playing. " : "",
					"Walk slowly and breathe out longer than in."
				]
			}),
			combat && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-display text-lg font-semibold",
								children: ["vs ", combat.name]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 h-2 overflow-hidden rounded-full bg-paper-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-danger transition-all",
									style: { width: `${combat.hp / combat.maxHp * 100}%` }
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-3 text-sm font-medium",
							children: [
								"Q",
								combat.q + 1,
								"/3 · ",
								combat.qs[combat.q].q
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: combat.qs[combat.q].options.map((opt) => {
								const marked = combat.answered && opt === combat.qs[combat.q].a;
								const wrong = combat.answered === "bad" && opt !== combat.qs[combat.q].a;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: Boolean(combat.answered),
									onClick: () => answer(opt),
									className: `w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition ${marked ? "border-ok bg-ok/10" : wrong ? "opacity-60" : "border-line bg-paper hover:border-coral"}`,
									children: opt
								}, opt);
							})
						})
					]
				})
			})
		]
	});
}
function Pad({ code, onHold, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "flex size-11 touch-none items-center justify-center rounded-full border border-line bg-card/90 text-ink shadow",
		onPointerDown: (e) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			onHold(code, true);
		},
		onPointerUp: () => onHold(code, false),
		onPointerCancel: () => onHold(code, false),
		children: icon
	});
}
var SUBJECTS = [
	"Biology",
	"Physiology",
	"Calculus",
	"History"
];
function StakeArena() {
	const pomodoro = useAppStore((s) => s.pomodoro);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const [subject, setSubject] = (0, import_react.useState)("Physiology");
	const [stake, setStake] = (0, import_react.useState)(50);
	const [left, setLeft] = (0, import_react.useState)(1800);
	const [mine, setMine] = (0, import_react.useState)(0);
	const [rival, setRival] = (0, import_react.useState)(0);
	const [winner, setWinner] = (0, import_react.useState)(null);
	const mineRef = (0, import_react.useRef)(0);
	const rivalRef = (0, import_react.useRef)(0);
	mineRef.current = mine;
	rivalRef.current = rival;
	(0, import_react.useEffect)(() => {
		if (!joined || winner) return;
		const t = window.setInterval(() => {
			setLeft((s) => {
				if (s <= 1) {
					setWinner(mineRef.current >= rivalRef.current ? "you" : "rival");
					return 0;
				}
				return s - 1;
			});
			if (pomodoro.run) setMine((m) => m + 1);
			setRival((r) => r + (Math.random() > .55 ? 1 : 0));
		}, 1e3);
		return () => window.clearInterval(t);
	}, [
		joined,
		winner,
		pomodoro.run
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-semibold",
				children: "Study Stake Arena"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Compete with friends. Highest study time wins the pot. Four subject tables — pick a group, set a stake, then join."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-[var(--radius-xl)] border border-line bg-card p-6 text-center",
				children: !joined ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 grid grid-cols-2 gap-2",
						children: SUBJECTS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSubject(s),
							className: `rounded-[var(--radius-md)] border px-3 py-2.5 text-sm ${subject === s ? "border-coral bg-paper-2" : "border-line"}`,
							children: s
						}, s))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "text-sm text-muted",
						children: ["Stake", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 10,
							max: 200,
							value: stake,
							onChange: (e) => setStake(Number(e.target.value)),
							className: "ml-2 w-20 rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1 tabular-nums"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setJoined(true);
							setLeft(1800);
							setMine(0);
							setRival(0);
							setWinner(null);
						},
						className: "mt-5 w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-coral-ink",
						children: "Join Match"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted",
						children: [
							subject,
							" table · simulated pot $",
							stake * 2
						]
					})
				] }) : winner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: winner === "you" ? "You take the pot" : "Rival takes the pot"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"You ",
							Math.floor(mine / 60),
							"m · Rival ",
							Math.floor(rival / 60),
							"m · $",
							stake * 2
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setJoined(false),
						className: "mt-4 rounded-full bg-ink px-5 py-2 text-sm text-paper",
						children: "New match"
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-display text-3xl tabular-nums text-coral",
						children: [
							Math.floor(left / 60),
							":",
							String(left % 60).padStart(2, "0")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted",
						children: [
							subject,
							" table · pot $",
							stake * 2
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-[var(--radius-md)] bg-paper p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted",
								children: "You"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-semibold tabular-nums",
								children: [
									Math.floor(mine / 60),
									"m ",
									mine % 60,
									"s"
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-[var(--radius-md)] bg-paper p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted",
								children: "Rival"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-semibold tabular-nums",
								children: [
									Math.floor(rival / 60),
									"m ",
									rival % 60,
									"s"
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted",
						children: "Start the dashboard timer to score focus minutes."
					})
				] })
			})
		]
	});
}
async function extractPdfText(file) {
	const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
	const worker = await import("./pdf.worker.min-C4v1Kq3M.mjs");
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	const data = await file.arrayBuffer();
	const doc = await pdfjs.getDocument({ data }).promise;
	const max = Math.min(doc.numPages, 8);
	const parts = [];
	for (let i = 1; i <= max; i++) {
		const line = (await (await doc.getPage(i)).getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
		if (line) parts.push(line);
	}
	return parts.join("\n\n").slice(0, 8e3);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FALLBACK_QUESTIONS = [
	{
		q: "What is the powerhouse of the cell?",
		a: "Mitochondria",
		options: [
			"Mitochondria",
			"Nucleus",
			"Ribosome",
			"Golgi apparatus"
		]
	},
	{
		q: "Which hormone lowers blood sugar?",
		a: "Insulin",
		options: [
			"Insulin",
			"Glucagon",
			"Cortisol",
			"Adrenaline"
		]
	},
	{
		q: "What is the basic unit of life?",
		a: "Cell",
		options: [
			"Cell",
			"Atom",
			"Tissue",
			"Organ"
		]
	},
	{
		q: "Which organ produces bile?",
		a: "Liver",
		options: [
			"Liver",
			"Pancreas",
			"Stomach",
			"Kidney"
		]
	},
	{
		q: "What does DNA stand for?",
		a: "Deoxyribonucleic acid",
		options: [
			"Deoxyribonucleic acid",
			"Diribonucleic acid",
			"Dual nucleic acid",
			"Deoxyribose acid"
		]
	},
	{
		q: "Resting membrane potential of a typical neuron?",
		a: "-70 mV",
		options: [
			"-70 mV",
			"0 mV",
			"+30 mV",
			"-90 mV"
		]
	}
];
function shuffle(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
function localQuestFromNotes(notes) {
	const clean = notes.replace(/\s+/g, " ").trim();
	const snippet = clean.slice(0, 220) || "the quiet laws of the living body";
	const sentences = clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 24 && s.length < 180).slice(0, 8);
	return {
		title: "The Valley of Quiet Study",
		sourcePreview: snippet,
		questions: sentences.length >= 4 ? sentences.slice(0, 6).map((s, i) => {
			const words = s.replace(/[^\w\s]/g, "").split(" ").filter((w) => w.length > 4);
			const key = words[Math.min(2, words.length - 1)] ?? "knowledge";
			return {
				q: `From your notes: ${s.replace(new RegExp(key, "i"), "______")}`,
				a: key,
				options: shuffle([
					key,
					words[0] ?? "tissue",
					words[1] ?? "organ",
					FALLBACK_QUESTIONS[i % FALLBACK_QUESTIONS.length].a
				]).slice(0, 4)
			};
		}) : FALLBACK_QUESTIONS,
		chapters: [
			{
				title: "Chapter 1 — The Gate",
				text: `Dawn settles over a small valley farm. A wooden gate creaks open as you step onto the dirt path, a satchel of notes at your side.\n\nThe first page reads: “${snippet}${clean.length > 220 ? "…" : ""}”\n\nA breeze moves the wheat. Somewhere beyond the orchard, red slimes wait to test whether you truly understand what you carry. This is not a dungeon. It is a farm that remembers.`
			},
			{
				title: "Chapter 2 — The Orchard",
				text: `Apple trees lean over the path. A farmer-spirit in a straw hat nods as you pass.\n\n“Knowledge is a crop,” they say. “You plant it, you tend it, then you harvest it under pressure.”\n\n${sentences[0] ? `You murmur a line from class: “${sentences[0]}” The trees seem to listen.` : "You walk the rows and let the facts settle into your hands."}\n\nRed slimes bounce between the parsnips — forgotten facts given form. Walk into one only when you are ready to prove you remember.`
			},
			{
				title: "Chapter 3 — The Cottage",
				text: `Smoke lifts from a stone chimney. Inside the cottage, a chalkboard is covered in the same ideas as your notes, rewritten as riddles.\n\n${sentences[1] ? `One riddle is almost a copy of your page: “${sentences[1]}”` : "You copy a few lines into your journal."}\n\nYour hands feel steadier. The valley is teaching you by making you live the lesson, not recite it. Chickens fuss in the coop. Crops glow when they are ready to pick.`
			},
			{
				title: "Chapter 4 — The Far Field",
				text: `At the edge of the farm a lantern marks the next field. Harvest the rows. Answer the guardians. Keep walking.\n\n${sentences[2] ? `The last note in your satchel is the one you came for: “${sentences[2]}”` : "You are not cramming. You are walking a path."}\n\nEvery correct answer is a step west, toward harvest. When you are ready, leave this story and step onto the farm.`
			}
		]
	};
}
var generateQuest = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("700ae570ae81c755876adb38318d8f06d8b7a3b45f1eb495b27aafeb4d70e036"));
var extractNotesFromImage = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("c4335f0788cca946a59208c303074130e9d0f19a079f26fe75cc71a5e8c6c78d"));
var SAMPLE = `The cardiovascular system delivers oxygen and nutrients to tissues.
The heart has four chambers: two atria and two ventricles.
Deoxygenated blood returns via the vena cava to the right atrium, then the right ventricle pumps it to the lungs.
Oxygenated blood returns to the left atrium and the left ventricle pumps it into the aorta.
Stroke volume times heart rate equals cardiac output.
Baroreceptors in the carotid sinus help regulate blood pressure.
The SA node is the pacemaker of the heart.`;
function Storyteller() {
	const notes = useAppStore((s) => s.notes);
	const setNotes = useAppStore((s) => s.setNotes);
	const quest = useAppStore((s) => s.quest);
	const setQuest = useAppStore((s) => s.setQuest);
	const generating = useAppStore((s) => s.generating);
	const setGenerating = useAppStore((s) => s.setGenerating);
	const setQuestions = useAppStore((s) => s.setQuestions);
	const setTab = useAppStore((s) => s.setTab);
	const [mode, setMode] = (0, import_react.useState)("paste");
	const [status, setStatus] = (0, import_react.useState)("");
	const [camOn, setCamOn] = (0, import_react.useState)(false);
	const videoRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const stopCam = () => {
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		setCamOn(false);
	};
	const startCam = async () => {
		try {
			if (useAppStore.getState().stress.on) await stressEngine.stop();
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "environment",
					width: 640,
					height: 480
				},
				audio: false
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
			setCamOn(true);
			setStatus("");
		} catch {
			setStatus("Camera permission was denied.");
		}
	};
	const capture = async () => {
		const video = videoRef.current;
		if (!video) return;
		const c = document.createElement("canvas");
		c.width = 640;
		c.height = 480;
		const ctx = c.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, 640, 480);
		const dataUrl = c.toDataURL("image/jpeg", .7);
		setStatus("Reading the page…");
		const res = await extractNotesFromImage({ data: { imageDataUrl: dataUrl } });
		if (res.ok) {
			setNotes(notes ? `${notes}\n\n${res.text}` : res.text);
			setMode("paste");
			stopCam();
			setStatus("Notes captured. Review them, then transform into a story.");
		} else setStatus(res.error);
	};
	const onUpload = async (file) => {
		setStatus("Reading file…");
		try {
			if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
				const text = await extractPdfText(file);
				if (!text.trim()) {
					setStatus("No selectable text in that PDF. Try paste, or a text-based PDF.");
					return;
				}
				setNotes(text);
				setMode("paste");
				setStatus(`Loaded ${file.name}. This page stays on the story — press Transform when ready.`);
			} else if (file.type.startsWith("image/")) {
				const res = await extractNotesFromImage({ data: { imageDataUrl: await new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve(String(r.result));
					r.onerror = () => reject(/* @__PURE__ */ new Error("read fail"));
					r.readAsDataURL(file);
				}) } });
				if (res.ok) {
					setNotes(res.text);
					setMode("paste");
					setStatus("Image notes extracted. Review, then transform into a story.");
				} else setStatus(res.error);
			} else {
				const text = await file.text();
				setNotes(text.slice(0, 8e3));
				setMode("paste");
				setStatus("File loaded. Review, then transform into a story.");
			}
		} catch {
			setStatus("Could not read that file.");
		}
	};
	const transform = async () => {
		if (!notes.trim()) {
			setStatus("Paste, upload, or capture notes first.");
			return;
		}
		const local = localQuestFromNotes(notes);
		setQuest(local);
		setQuestions(local.questions);
		setGenerating(true);
		setStatus("Writing your valley story…");
		try {
			const res = await generateQuest({ data: { notes } });
			const next = res && "quest" in res && res.quest ? res.quest : local;
			setQuest(next);
			setQuestions(next.questions?.length ? next.questions : local.questions);
			setStatus("");
		} catch {
			setStatus("Showing the local story below.");
		} finally {
			setGenerating(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-[0_10px_30px_rgba(61,44,46,0.06)] sm:p-7",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-coral text-coral-ink",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-xl font-semibold text-ink",
						children: "Lore-Craft Lesson Storyteller"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Paste or upload your medical notes. The AI will generate a unique story on this page — it will not jump to the farm."
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [
						["paste", "Paste Notes"],
						["upload", "Upload PDF"],
						["camera", "Camera Snap"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setMode(id);
							if (id !== "camera") stopCam();
						},
						className: `rounded-full px-4 py-2 text-sm font-medium transition ${mode === id ? "bg-coral text-coral-ink" : "border border-line bg-paper text-ink"}`,
						children: label
					}, id))
				}),
				mode === "paste" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: notes,
					onChange: (e) => setNotes(e.target.value),
					placeholder: "Paste your medical or study notes here…",
					className: "mt-4 h-48 w-full resize-none rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none ring-coral/30 focus:ring-2"
				}),
				mode === "upload" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 flex h-48 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-line bg-paper text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "mb-2 size-7 text-coral" }),
						"PDF, image, or text file",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".pdf,image/*,.txt,.md",
							className: "sr-only",
							onChange: (e) => {
								const f = e.target.files?.[0];
								if (f) onUpload(f);
							}
						})
					]
				}),
				mode === "camera" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-hidden rounded-[var(--radius-md)] border border-line bg-ink",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: videoRef,
							playsInline: true,
							muted: true,
							className: "aspect-video w-full object-cover"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: !camOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void startCam(),
							className: "inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-4" }), " Open camera"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void capture(),
							className: "rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink",
							children: "Capture page"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: stopCam,
							className: "rounded-full border border-line px-4 py-2 text-sm",
							children: "Close"
						})] })
					})]
				}),
				status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: status
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: generating,
						onClick: () => void transform(),
						className: "flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-coral py-3 text-sm font-semibold text-coral-ink disabled:opacity-60",
						children: generating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " Writing story…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "size-4" }), " Transform into RPG Quest"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setNotes(SAMPLE);
							setMode("paste");
							setStatus("Sample physiology notes loaded. Press Transform to write the story.");
						},
						className: "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line px-4 py-3 text-sm font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }), " Sample notes"]
					})]
				})
			]
		}), quest && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-3 rounded-[var(--radius-xl)] border border-line bg-card p-5 sm:p-7",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium tracking-wide text-coral uppercase",
					children: "Your story"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: quest.title
				}),
				quest.chapters.map((ch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "border-t border-line pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mb-1 text-sm font-semibold text-coral",
						children: ch.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "whitespace-pre-line text-sm leading-relaxed text-ink",
						children: ch.text
					})]
				}, ch.title)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [quest.questions.length, " quiz challenges ready for the farm. Open RPG World when you want to play — this story stays here."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("rpg"),
					className: "rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper",
					children: "Play this quest on the farm"
				})
			]
		})]
	});
}
var COLS = [
	{
		id: "todo",
		label: "To-do"
	},
	{
		id: "progress",
		label: "In progress"
	},
	{
		id: "mastered",
		label: "Mastered"
	}
];
function TaskBoard() {
	const tasks = useAppStore((s) => s.tasks);
	const setTasks = useAppStore((s) => s.setTasks);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-xl font-semibold",
				children: "Lesson board"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					const title = window.prompt("Task title");
					if (!title) return;
					setTasks((ts) => [...ts, {
						id: String(Date.now()),
						title,
						status: "todo"
					}]);
				},
				className: "inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 md:grid-cols-3",
			children: COLS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-44 rounded-[var(--radius-xl)] border border-line bg-card p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 text-xs font-medium tracking-wide text-muted uppercase",
					children: col.label
				}), tasks.filter((t) => t.status === col.id).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 rounded-[var(--radius-md)] border border-line bg-paper p-2.5 text-sm",
					children: [t.title, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-1",
						children: [col.id !== "todo" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-full bg-sky px-2 py-0.5 text-xs",
							onClick: () => setTasks((ts) => ts.map((x) => x.id === t.id ? {
								...x,
								status: col.id === "progress" ? "todo" : "progress"
							} : x)),
							children: "Back"
						}), col.id !== "mastered" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-full bg-paper-2 px-2 py-0.5 text-xs",
							onClick: () => setTasks((ts) => ts.map((x) => x.id === t.id ? {
								...x,
								status: col.id === "todo" ? "progress" : "mastered"
							} : x)),
							children: "Next"
						})]
					})]
				}, t.id))]
			}, col.id))
		})]
	});
}
var NAV = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: LayoutDashboard
	},
	{
		id: "story",
		label: "Storyteller Quest",
		icon: BookOpen
	},
	{
		id: "rpg",
		label: "RPG World",
		icon: Sword
	},
	{
		id: "stake",
		label: "Stake Arena",
		icon: Trophy
	},
	{
		id: "tasks",
		label: "Tasks",
		icon: Notebook
	}
];
function AppShell() {
	const tab = useAppStore((s) => s.tab);
	const setTab = useAppStore((s) => s.setTab);
	(0, import_react.useEffect)(() => {
		hydrateAppStore();
		return calmMusic.attach();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/80 px-3 py-2 backdrop-blur sm:px-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StressBar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-xs text-muted lg:inline",
					children: "Walk, read, remember."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "hidden w-56 shrink-0 flex-col gap-1 p-3 md:flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2 px-2 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FoxMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-sm font-semibold leading-tight",
							children: "Focus"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-muted",
							children: "Physiology"
						})] })]
					}), NAV.map((n) => {
						const Icon = n.icon;
						const on = tab === n.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTab(n.id),
							className: `flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${on ? "bg-coral text-coral-ink" : "text-ink hover:bg-paper-2"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), n.label]
						}, n.id);
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex-1 overflow-y-auto p-4 pb-24 md:p-6",
					children: [
						tab === "dashboard" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {}),
						tab === "story" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Storyteller, {}),
						tab === "rpg" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FarmGame, {}),
						tab === "stake" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StakeArena, {}),
						tab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskBoard, {})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-card/95 py-2 md:hidden",
				children: NAV.map((n) => {
					const Icon = n.icon;
					const on = tab === n.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": n.label,
						onClick: () => setTab(n.id),
						className: `flex size-11 items-center justify-center rounded-[var(--radius-md)] ${on ? "bg-coral text-coral-ink" : "text-muted"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
					}, n.id);
				})
			})
		]
	});
}
function FoxMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "size-9",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "10",
				fill: "#F4C7B8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 14 L10 6 L15 12 L17 12 L22 6 L24 14 C24 22 8 22 8 14Z",
				fill: "#E07A5F"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "13",
				cy: "15",
				r: "1.4",
				fill: "#3D2C2E"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "19",
				cy: "15",
				r: "1.4",
				fill: "#3D2C2E"
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
