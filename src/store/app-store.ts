import { create } from "zustand";
import type { Quest, QuestQuestion } from "@/lib/quest";

export type TabId = "dashboard" | "story" | "rpg" | "stake" | "tasks";

export type TaskItem = {
  id: string;
  title: string;
  status: "todo" | "progress" | "mastered";
};

export type PlayerStats = {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  atk: number;
  zones: number;
};

export type StressState = {
  on: boolean;
  level: number;
  bpm: number | null;
  label: "off" | "warming" | "calm" | "steady" | "elevated" | "high" | "need-light";
  face: boolean;
};

type AppState = {
  tab: TabId;
  setTab: (t: TabId) => void;
  notes: string;
  setNotes: (n: string) => void;
  quest: Quest | null;
  setQuest: (q: Quest | null) => void;
  generating: boolean;
  setGenerating: (v: boolean) => void;
  player: PlayerStats;
  setPlayer: (p: PlayerStats | ((prev: PlayerStats) => PlayerStats)) => void;
  questions: QuestQuestion[];
  setQuestions: (q: QuestQuestion[]) => void;
  tasks: TaskItem[];
  setTasks: (t: TaskItem[] | ((prev: TaskItem[]) => TaskItem[])) => void;
  pomodoro: { m: number; s: number; run: boolean };
  setPomodoro: (
    p:
      | AppState["pomodoro"]
      | ((prev: AppState["pomodoro"]) => AppState["pomodoro"]),
  ) => void;
  stress: StressState;
  setStress: (s: StressState) => void;
  musicPlaying: boolean;
  setMusicPlaying: (v: boolean) => void;
  musicMuted: boolean;
  setMusicMuted: (v: boolean) => void;
  musicManual: boolean;
  setMusicManual: (v: boolean) => void;
};

const STORAGE_KEY = "focus-physiology-v1";

const defaultPlayer: PlayerStats = {
  hp: 100,
  maxHp: 100,
  xp: 0,
  level: 1,
  atk: 16,
  zones: 1,
};

const defaultTasks: TaskItem[] = [
  { id: "1", title: "Cardiovascular system", status: "todo" },
  { id: "2", title: "Renal physiology", status: "progress" },
  { id: "3", title: "Neurotransmitters", status: "mastered" },
];

const defaultStress: StressState = {
  on: false,
  level: 0,
  bpm: null,
  label: "off",
  face: false,
};

export const useAppStore = create<AppState>((set) => ({
  tab: "story",
  setTab: (tab) => set({ tab }),
  notes: "",
  setNotes: (notes) => set({ notes }),
  quest: null,
  setQuest: (quest) => set({ quest }),
  generating: false,
  setGenerating: (generating) => set({ generating }),
  player: defaultPlayer,
  setPlayer: (p) =>
    set((s) => ({ player: typeof p === "function" ? p(s.player) : p })),
  questions: [],
  setQuestions: (questions) => set({ questions }),
  tasks: defaultTasks,
  setTasks: (t) =>
    set((s) => ({ tasks: typeof t === "function" ? t(s.tasks) : t })),
  pomodoro: { m: 25, s: 0, run: false },
  setPomodoro: (p) =>
    set((s) => ({ pomodoro: typeof p === "function" ? p(s.pomodoro) : p })),
  stress: defaultStress,
  setStress: (stress) => set({ stress }),
  musicPlaying: false,
  setMusicPlaying: (musicPlaying) => set({ musicPlaying }),
  musicMuted: false,
  setMusicMuted: (musicMuted) => set({ musicMuted }),
  musicManual: false,
  setMusicManual: (musicManual) => set({ musicManual }),
}));

export function hydrateAppStore() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw) as Partial<AppState>;
    useAppStore.setState({
      notes: typeof d.notes === "string" ? d.notes : "",
      quest: d.quest ?? null,
      questions: Array.isArray(d.questions) ? d.questions : [],
      player: d.player ?? defaultPlayer,
      tasks: Array.isArray(d.tasks) ? d.tasks : defaultTasks,
    });
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  useAppStore.subscribe((s) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          notes: s.notes,
          quest: s.quest,
          questions: s.questions,
          player: s.player,
          tasks: s.tasks,
        }),
      );
    } catch {
      /* ignore */
    }
  });
}
