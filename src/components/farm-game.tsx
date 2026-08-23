import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
} from "lucide-react";
import { FarmEngine, VIEW_H, VIEW_W, type CombatPayload } from "@/game/farm-engine";
import { useAppStore } from "@/store/app-store";
import type { QuestQuestion } from "@/lib/quest";

const FALLBACK: QuestQuestion[] = [
  {
    q: "What is the powerhouse of the cell?",
    a: "Mitochondria",
    options: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"],
  },
  {
    q: "Which hormone lowers blood sugar?",
    a: "Insulin",
    options: ["Insulin", "Glucagon", "Cortisol", "Adrenaline"],
  },
  {
    q: "Basic unit of life?",
    a: "Cell",
    options: ["Cell", "Atom", "Tissue", "Organ"],
  },
];

type CombatState = CombatPayload & {
  q: number;
  answered: false | "ok" | "bad";
  qs: QuestQuestion[];
};

export function FarmGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FarmEngine | null>(null);
  const questions = useAppStore((s) => s.questions);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const player = useAppStore((s) => s.player);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const combatRef = useRef<CombatState | null>(null);
  combatRef.current = combat;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const fit = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.round(cssW * (VIEW_H / VIEW_W));
      const dpr = window.devicePixelRatio || 1;
      const intScale = Math.max(2, Math.floor(dpr * (cssW / VIEW_W)));
      canvas.width = VIEW_W * intScale;
      canvas.height = VIEW_H * intScale;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    const engine = new FarmEngine(canvas, (payload) => {
      const pool = questionsRef.current.length ? questionsRef.current : FALLBACK;
      const qs = Array.from({ length: 3 }, (_, i) => pool[i % pool.length]);
      setCombat({ ...payload, q: 0, answered: false, qs });
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

  const hold = (code: string, down: boolean) => {
    const e = engineRef.current;
    if (!e) return;
    if (down) e.keys.add(code);
    else e.keys.delete(code);
  };

  const answer = (opt: string) => {
    const cur = combatRef.current;
    if (!cur || cur.answered) return;
    const correct = opt === cur.qs[cur.q].a;
    const nextHp = correct ? Math.max(0, cur.hp - (player.atk + 8)) : cur.hp;
    setCombat({ ...cur, answered: correct ? "ok" : "bad", hp: nextHp });
    if (!correct) {
      setPlayer((p) => ({ ...p, hp: Math.max(0, p.hp - 12) }));
    }
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
            zones: p.zones + 1,
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
      setCombat({ ...live, q: live.q + 1, answered: false, hp: nextHp });
    }, 620);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Valley Farm</h1>
          <p className="text-sm text-muted">Walk, harvest crops, bump a red slime to quiz.</p>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-card px-3 py-2 text-xs tabular-nums">
          <span className="inline-flex items-center gap-1 text-danger">
            <Heart className="size-3.5" /> {player.hp}/{player.maxHp}
          </span>
          <span>Lv.{player.level}</span>
          <span className="text-muted">
            {player.xp}/{player.level * 60} XP
          </span>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-ink shadow-[0_12px_32px_rgba(61,44,46,0.08)]"
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className="block w-full touch-none"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden p-3 md:block">
          <p className="rounded-full bg-ink/55 px-3 py-1 text-center text-[11px] text-coral-ink">
            WASD or arrows to walk · harvest glowing crops · bump a red slime to battle
          </p>
        </div>
        <div className="absolute right-3 bottom-3 flex flex-col items-center gap-1 md:hidden">
          <Pad code="ArrowUp" onHold={hold} icon={<ChevronUp className="size-5" />} />
          <div className="flex gap-1">
            <Pad code="ArrowLeft" onHold={hold} icon={<ChevronLeft className="size-5" />} />
            <Pad code="ArrowDown" onHold={hold} icon={<ChevronDown className="size-5" />} />
            <Pad code="ArrowRight" onHold={hold} icon={<ChevronRight className="size-5" />} />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted md:hidden">
        Use the pad or drag on the left side of the farm to walk.
      </p>

      {combat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-xl">
            <div className="mb-3 text-center">
              <div className="font-display text-lg font-semibold">vs {combat.name}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full bg-danger transition-all"
                  style={{ width: `${(combat.hp / combat.maxHp) * 100}%` }}
                />
              </div>
            </div>
            <p className="mb-3 text-sm font-medium">
              Q{combat.q + 1}/3 · {combat.qs[combat.q].q}
            </p>
            <div className="space-y-2">
              {combat.qs[combat.q].options.map((opt) => {
                const marked = combat.answered && opt === combat.qs[combat.q].a;
                const wrong = combat.answered === "bad" && opt !== combat.qs[combat.q].a;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={Boolean(combat.answered)}
                    onClick={() => answer(opt)}
                    className={`w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-sm transition ${
                      marked
                        ? "border-ok bg-ok/10"
                        : wrong
                          ? "opacity-60"
                          : "border-line bg-paper hover:border-coral"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Pad({
  code,
  onHold,
  icon,
}: {
  code: string;
  onHold: (code: string, down: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex size-11 touch-none items-center justify-center rounded-full border border-line bg-card/90 text-ink shadow"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(code, true);
      }}
      onPointerUp={() => onHold(code, false)}
      onPointerCancel={() => onHold(code, false)}
    >
      {icon}
    </button>
  );
}
