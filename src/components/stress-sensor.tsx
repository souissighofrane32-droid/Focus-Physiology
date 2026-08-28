import { useEffect, useRef, useState } from "react";
import { Activity, HeartPulse, Music, Volume2, VolumeX } from "lucide-react";
import { calmMusic } from "@/lib/calm-music";
import { stressEngine } from "@/lib/stress-engine";
import { useAppStore } from "@/store/app-store";

const LABEL: Record<string, string> = {
  off: "Off",
  warming: "Reading pulse…",
  calm: "Valley calm",
  steady: "Focused",
  elevated: "Elevated",
  high: "High stress",
  "need-light": "Need more light",
};

export function StressSensorCard() {
  const stress = useAppStore((s) => s.stress);
  const musicPlaying = useAppStore((s) => s.musicPlaying);
  const musicMuted = useAppStore((s) => s.musicMuted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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

  const fill =
    stress.label === "high" || stress.level >= 78
      ? "bg-danger"
      : stress.level >= 58
        ? "bg-coral"
        : "bg-leaf";

  return (
    <section className="rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-[0_10px_30px_rgba(61,44,46,0.06)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-coral text-coral-ink">
            <HeartPulse className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Webcam stress sensor</h2>
            <p className="text-sm text-muted">
              Reads pulse from your face. When stress rises, a valley lullaby fades in.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggle()}
          className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-coral-ink disabled:opacity-60"
        >
          {stress.on ? "Stop sensor" : "Start sensor"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink">
          <video
            ref={videoRef}
            muted
            playsInline
            className="aspect-[4/3] w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[52%] w-[46%] rounded-full border-2 border-coral-ink/70" />
          </div>
          {!stress.on && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/55 px-3 text-center text-xs text-coral-ink">
              Sit in the light. Keep your face in the oval.
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium tracking-wide text-muted uppercase">Stress</div>
              <div className="font-display text-4xl tabular-nums text-ink">
                {stress.on ? stress.level : "—"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium tracking-wide text-muted uppercase">Pulse</div>
              <div className="font-display text-2xl tabular-nums">
                {stress.bpm ? `${stress.bpm}` : "—"}
                <span className="ml-1 text-sm text-muted">bpm</span>
              </div>
            </div>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-paper-2">
            <div
              className={`h-full ${fill} transition-[width] duration-300`}
              style={{ width: `${stress.on ? stress.level : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="size-4 text-leaf" />
            <span className="font-medium">{LABEL[stress.label]}</span>
            {stress.on && !stress.face && stress.label !== "warming" && (
              <span className="text-muted">· face the camera</span>
            )}
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          {(stress.label === "elevated" || stress.label === "high" || musicPlaying) && (
            <BreatheCoach playing={musicPlaying} muted={musicMuted} />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                calmMusic.unlock();
                if (musicPlaying && !stress.on) {
                  calmMusic.stop();
                } else {
                  useAppStore.getState().setMusicManual(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium"
            >
              <Music className="size-3.5" />
              {musicPlaying && !stress.on ? "Stop sample" : "Play calm music"}
            </button>
            {musicPlaying && (
              <button
                type="button"
                onClick={() => {
                  calmMusic.unlock();
                  calmMusic.setMuted(!musicMuted);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium"
              >
                {musicMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {musicMuted ? "Unmute" : "Mute"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function BreatheCoach({ playing, muted }: { playing: boolean; muted: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper px-3 py-2">
      <div className="stress-breathe size-9 rounded-full bg-leaf/25 ring-2 ring-leaf/40" />
      <p className="text-sm text-ink">
        Breathe in 4 · hold 4 · out 6.
        {playing && !muted
          ? " Valley music is playing."
          : playing && muted
            ? " Music is muted."
            : " Music will fade in."}
      </p>
    </div>
  );
}

export function StressBar() {
  const stress = useAppStore((s) => s.stress);
  const setTab = useAppStore((s) => s.setTab);
  const musicPlaying = useAppStore((s) => s.musicPlaying);
  const musicMuted = useAppStore((s) => s.musicMuted);
  const miniRef = useRef<HTMLVideoElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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

  const fill =
    stress.label === "high" || stress.level >= 78
      ? "bg-danger"
      : stress.level >= 58
        ? "bg-coral"
        : "bg-leaf";

  const badge =
    stress.label === "off"
      ? "Valley calm"
      : stress.label === "warming"
        ? "Reading pulse"
        : stress.label === "need-light"
          ? "Need light"
          : stress.label === "high"
            ? "High stress"
            : stress.label === "elevated"
              ? "Elevated"
              : stress.label === "steady"
                ? "Focused"
                : "Valley calm";

  const badgeClass =
    stress.label === "high" || stress.label === "elevated"
      ? "bg-danger/15 text-danger"
      : stress.label === "steady"
        ? "bg-coral/15 text-coral"
        : "bg-leaf/15 text-leaf";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={() => setTab("dashboard")}
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
      >
        {badge}
      </button>
      <div className="hidden h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-paper-2 sm:block md:max-w-48">
        <div
          className={`h-full ${fill} transition-[width] duration-300`}
          style={{ width: `${stress.on ? stress.level : 8}%` }}
        />
      </div>
      {stress.on && (
        <span className="hidden text-xs tabular-nums text-muted sm:inline">
          {stress.level}
          {stress.bpm ? ` · ${stress.bpm} bpm` : ""}
        </span>
      )}
      <video
        ref={miniRef}
        muted
        playsInline
        className={`size-7 shrink-0 rounded-full object-cover ${stress.on ? "ring-1 ring-line" : "hidden"}`}
        style={{ transform: "scaleX(-1)" }}
        aria-hidden
      />
      {musicPlaying && (
        <button
          type="button"
          aria-label={musicMuted ? "Unmute calm music" : "Mute calm music"}
          onClick={() => {
            calmMusic.unlock();
            calmMusic.setMuted(!musicMuted);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-leaf"
        >
          {musicMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          <span className="hidden sm:inline">{musicMuted ? "Muted" : "Music"}</span>
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium"
      >
        {stress.on ? "Stop" : "Start sensor"}
      </button>
    </div>
  );
}
