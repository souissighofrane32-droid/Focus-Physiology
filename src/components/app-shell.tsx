import { useEffect } from "react";
import {
  BookOpen,
  LayoutDashboard,
  Notebook,
  Sword,
  Trophy,
} from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { FarmGame } from "@/components/farm-game";
import { StakeArena } from "@/components/stake-arena";
import { Storyteller } from "@/components/storyteller";
import { StressBar } from "@/components/stress-sensor";
import { TaskBoard } from "@/components/task-board";
import { calmMusic } from "@/lib/calm-music";
import { hydrateAppStore, useAppStore, type TabId } from "@/store/app-store";

const NAV: { id: TabId; label: string; icon: typeof BookOpen }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "story", label: "Storyteller Quest", icon: BookOpen },
  { id: "rpg", label: "RPG World", icon: Sword },
  { id: "stake", label: "Stake Arena", icon: Trophy },
  { id: "tasks", label: "Tasks", icon: Notebook },
];

export function AppShell() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);

  useEffect(() => {
    hydrateAppStore();
    return calmMusic.attach();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-card/80 px-3 py-2 backdrop-blur sm:px-4">
        <StressBar />
        <span className="hidden text-xs text-muted lg:inline">Walk, read, remember.</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 flex-col gap-1 p-3 md:flex">
          <div className="mb-3 flex items-center gap-2 px-2 py-2">
            <FoxMark />
            <div>
              <div className="font-display text-sm font-semibold leading-tight">Focus</div>
              <div className="text-[11px] text-muted">Physiology</div>
            </div>
          </div>
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = tab === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${
                  on ? "bg-coral text-coral-ink" : "text-ink hover:bg-paper-2"
                }`}
              >
                <Icon className="size-4" />
                {n.label}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6">
          {tab === "dashboard" && <Dashboard />}
          {tab === "story" && <Storyteller />}
          {tab === "rpg" && <FarmGame />}
          {tab === "stake" && <StakeArena />}
          {tab === "tasks" && <TaskBoard />}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-card/95 py-2 md:hidden">
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = tab === n.id;
          return (
            <button
              key={n.id}
              type="button"
              aria-label={n.label}
              onClick={() => setTab(n.id)}
              className={`flex size-11 items-center justify-center rounded-[var(--radius-md)] ${
                on ? "bg-coral text-coral-ink" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function FoxMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#F4C7B8" />
      <path d="M8 14 L10 6 L15 12 L17 12 L22 6 L24 14 C24 22 8 22 8 14Z" fill="#E07A5F" />
      <circle cx="13" cy="15" r="1.4" fill="#3D2C2E" />
      <circle cx="19" cy="15" r="1.4" fill="#3D2C2E" />
    </svg>
  );
}
