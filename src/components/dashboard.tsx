import { Pause, Play } from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

export function Dashboard() {
  const pomodoro = useAppStore((s) => s.pomodoro);
  const setPomodoro = useAppStore((s) => s.setPomodoro);
  const player = useAppStore((s) => s.player);
  const quest = useAppStore((s) => s.quest);
  const setTab = useAppStore((s) => s.setTab);

  useEffect(() => {
    if (!pomodoro.run) return;
    const t = window.setInterval(() => {
      setPomodoro((p) => {
        if (p.s > 0) return { ...p, s: p.s - 1 };
        if (p.m > 0) return { ...p, m: p.m - 1, s: 59 };
        return { m: 5, s: 0, run: false };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [pomodoro.run, setPomodoro]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Focus Physiology</h1>
        <p className="text-sm text-muted">Study in a valley. Harvest what you remember.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-5 text-center">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">Focus timer</div>
          <div className="mt-2 font-display text-4xl tabular-nums text-coral">
            {String(pomodoro.m).padStart(2, "0")}:{String(pomodoro.s).padStart(2, "0")}
          </div>
          <button
            type="button"
            onClick={() => setPomodoro((p) => ({ ...p, run: !p.run }))}
            className="mt-4 inline-flex size-11 items-center justify-center rounded-full bg-coral text-coral-ink"
            aria-label={pomodoro.run ? "Pause timer" : "Start timer"}
          >
            {pomodoro.run ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-5 text-center">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">Farmer</div>
          <div className="mt-3 font-display text-2xl">Lv. {player.level}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full bg-coral"
              style={{ width: `${(player.xp / (player.level * 60)) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted tabular-nums">
            {player.xp}/{player.level * 60} XP · HP {player.hp}/{player.maxHp}
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-line bg-card p-5">
          <div className="text-xs font-medium tracking-wide text-muted uppercase">Current quest</div>
          <p className="mt-3 font-display text-lg leading-snug">
            {quest ? quest.title : "No story yet"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {quest
              ? `${quest.chapters.length} chapters · ${quest.questions.length} challenges`
              : "Open Storyteller, add notes, then transform."}
          </p>
          <button
            type="button"
            onClick={() => setTab(quest ? "rpg" : "story")}
            className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            {quest ? "Continue on the farm" : "Open Storyteller"}
          </button>
        </div>
      </div>
    </div>
  );
}
