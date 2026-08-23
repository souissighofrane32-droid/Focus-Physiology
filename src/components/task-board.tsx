import { Plus } from "lucide-react";
import { useAppStore, type TaskItem } from "@/store/app-store";

const COLS: { id: TaskItem["status"]; label: string }[] = [
  { id: "todo", label: "To-do" },
  { id: "progress", label: "In progress" },
  { id: "mastered", label: "Mastered" },
];

export function TaskBoard() {
  const tasks = useAppStore((s) => s.tasks);
  const setTasks = useAppStore((s) => s.setTasks);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Lesson board</h1>
        <button
          type="button"
          onClick={() => {
            const title = window.prompt("Task title");
            if (!title) return;
            setTasks((ts) => [
              ...ts,
              { id: String(Date.now()), title, status: "todo" },
            ]);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink"
        >
          <Plus className="size-4" /> Add
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {COLS.map((col) => (
          <div
            key={col.id}
            className="min-h-44 rounded-[var(--radius-xl)] border border-line bg-card p-3"
          >
            <div className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
              {col.label}
            </div>
            {tasks
              .filter((t) => t.status === col.id)
              .map((t) => (
                <div
                  key={t.id}
                  className="mb-2 rounded-[var(--radius-md)] border border-line bg-paper p-2.5 text-sm"
                >
                  {t.title}
                  <div className="mt-2 flex gap-1">
                    {col.id !== "todo" && (
                      <button
                        type="button"
                        className="rounded-full bg-sky px-2 py-0.5 text-xs"
                        onClick={() =>
                          setTasks((ts) =>
                            ts.map((x) =>
                              x.id === t.id
                                ? {
                                    ...x,
                                    status: col.id === "progress" ? "todo" : "progress",
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        Back
                      </button>
                    )}
                    {col.id !== "mastered" && (
                      <button
                        type="button"
                        className="rounded-full bg-paper-2 px-2 py-0.5 text-xs"
                        onClick={() =>
                          setTasks((ts) =>
                            ts.map((x) =>
                              x.id === t.id
                                ? {
                                    ...x,
                                    status: col.id === "todo" ? "progress" : "mastered",
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
