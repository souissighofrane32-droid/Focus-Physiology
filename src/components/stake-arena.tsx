import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/app-store";

const SUBJECTS = ["Biology", "Physiology", "Calculus", "History"] as const;

export function StakeArena() {
  const pomodoro = useAppStore((s) => s.pomodoro);
  const [joined, setJoined] = useState(false);
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("Physiology");
  const [stake, setStake] = useState(50);
  const [left, setLeft] = useState(1800);
  const [mine, setMine] = useState(0);
  const [rival, setRival] = useState(0);
  const [winner, setWinner] = useState<null | "you" | "rival">(null);
  const mineRef = useRef(0);
  const rivalRef = useRef(0);
  mineRef.current = mine;
  rivalRef.current = rival;

  useEffect(() => {
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
      setRival((r) => r + (Math.random() > 0.55 ? 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [joined, winner, pomodoro.run]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-xl font-semibold">Study Stake Arena</h1>
      <p className="text-sm text-muted">
        Compete with friends. Highest study time wins the pot. Four subject tables — pick a group,
        set a stake, then join.
      </p>
      <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 text-center">
        {!joined ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-sm ${
                    subject === s ? "border-coral bg-paper-2" : "border-line"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <label className="text-sm text-muted">
              Stake
              <input
                type="number"
                min={10}
                max={200}
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                className="ml-2 w-20 rounded-[var(--radius-sm)] border border-line bg-paper px-2 py-1 tabular-nums"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setJoined(true);
                setLeft(1800);
                setMine(0);
                setRival(0);
                setWinner(null);
              }}
              className="mt-5 w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-coral-ink"
            >
              Join Match
            </button>
            <p className="mt-3 text-xs text-muted">
              {subject} table · simulated pot ${stake * 2}
            </p>
          </>
        ) : winner ? (
          <>
            <p className="font-display text-2xl">
              {winner === "you" ? "You take the pot" : "Rival takes the pot"}
            </p>
            <p className="mt-2 text-sm text-muted">
              You {Math.floor(mine / 60)}m · Rival {Math.floor(rival / 60)}m · ${stake * 2}
            </p>
            <button
              type="button"
              onClick={() => setJoined(false)}
              className="mt-4 rounded-full bg-ink px-5 py-2 text-sm text-paper"
            >
              New match
            </button>
          </>
        ) : (
          <>
            <div className="font-display text-3xl tabular-nums text-coral">
              {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </div>
            <p className="mt-1 text-xs text-muted">{subject} table · pot ${stake * 2}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-md)] bg-paper p-3">
                <div className="text-xs text-muted">You</div>
                <div className="font-semibold tabular-nums">{Math.floor(mine / 60)}m {mine % 60}s</div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-paper p-3">
                <div className="text-xs text-muted">Rival</div>
                <div className="font-semibold tabular-nums">
                  {Math.floor(rival / 60)}m {rival % 60}s
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Start the dashboard timer to score focus minutes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
