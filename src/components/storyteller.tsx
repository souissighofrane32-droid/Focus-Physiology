import { useRef, useState } from "react";
import { BookOpen, Camera, FileText, Loader2, ScrollText, Upload } from "lucide-react";
import { extractPdfText } from "@/lib/pdf-text";
import { extractNotesFromImage, generateQuest, localQuestFromNotes } from "@/lib/quest";
import { stressEngine } from "@/lib/stress-engine";
import { useAppStore } from "@/store/app-store";

type Mode = "paste" | "upload" | "camera";

const SAMPLE = `The cardiovascular system delivers oxygen and nutrients to tissues.
The heart has four chambers: two atria and two ventricles.
Deoxygenated blood returns via the vena cava to the right atrium, then the right ventricle pumps it to the lungs.
Oxygenated blood returns to the left atrium and the left ventricle pumps it into the aorta.
Stroke volume times heart rate equals cardiac output.
Baroreceptors in the carotid sinus help regulate blood pressure.
The SA node is the pacemaker of the heart.`;

export function Storyteller() {
  const notes = useAppStore((s) => s.notes);
  const setNotes = useAppStore((s) => s.setNotes);
  const quest = useAppStore((s) => s.quest);
  const setQuest = useAppStore((s) => s.setQuest);
  const generating = useAppStore((s) => s.generating);
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setQuestions = useAppStore((s) => s.setQuestions);
  const setTab = useAppStore((s) => s.setTab);
  const [mode, setMode] = useState<Mode>("paste");
  const [status, setStatus] = useState("");
  const [camOn, setCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const startCam = async () => {
    try {
      if (useAppStore.getState().stress.on) await stressEngine.stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 },
        audio: false,
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
    const dataUrl = c.toDataURL("image/jpeg", 0.7);
    setStatus("Reading the page…");
    const res = await extractNotesFromImage({ data: { imageDataUrl: dataUrl } });
    if (res.ok) {
      setNotes(notes ? `${notes}\n\n${res.text}` : res.text);
      setMode("paste");
      stopCam();
      setStatus("Notes captured. Review them, then transform into a story.");
    } else {
      setStatus(res.error);
    }
  };

  const onUpload = async (file: File) => {
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
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("read fail"));
          r.readAsDataURL(file);
        });
        const res = await extractNotesFromImage({ data: { imageDataUrl: dataUrl } });
        if (res.ok) {
          setNotes(res.text);
          setMode("paste");
          setStatus("Image notes extracted. Review, then transform into a story.");
        } else setStatus(res.error);
      } else {
        const text = await file.text();
        setNotes(text.slice(0, 8000));
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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-[var(--radius-xl)] border border-line bg-card p-5 shadow-[0_10px_30px_rgba(61,44,46,0.06)] sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-coral text-coral-ink">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">
              Lore-Craft Lesson Storyteller
            </h1>
            <p className="text-sm text-muted">
              Paste or upload your medical notes. The AI will generate a unique story on this
              page — it will not jump to the farm.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["paste", "Paste Notes"],
              ["upload", "Upload PDF"],
              ["camera", "Camera Snap"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                if (id !== "camera") stopCam();
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === id
                  ? "bg-coral text-coral-ink"
                  : "border border-line bg-paper text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "paste" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your medical or study notes here…"
            className="mt-4 h-48 w-full resize-none rounded-[var(--radius-md)] border border-line bg-paper px-4 py-3 text-sm text-ink outline-none ring-coral/30 focus:ring-2"
          />
        )}

        {mode === "upload" && (
          <label className="mt-4 flex h-48 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-line bg-paper text-sm text-muted">
            <Upload className="mb-2 size-7 text-coral" />
            PDF, image, or text file
            <input
              type="file"
              accept=".pdf,image/*,.txt,.md"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
          </label>
        )}

        {mode === "camera" && (
          <div className="mt-4 space-y-3">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-ink">
              <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
            </div>
            <div className="flex gap-2">
              {!camOn ? (
                <button
                  type="button"
                  onClick={() => void startCam()}
                  className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink"
                >
                  <Camera className="size-4" /> Open camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void capture()}
                    className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-coral-ink"
                  >
                    Capture page
                  </button>
                  <button
                    type="button"
                    onClick={stopCam}
                    className="rounded-full border border-line px-4 py-2 text-sm"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {status && <p className="mt-3 text-sm text-muted">{status}</p>}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={generating}
            onClick={() => void transform()}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-coral py-3 text-sm font-semibold text-coral-ink disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Writing story…
              </>
            ) : (
              <>
                <ScrollText className="size-4" /> Transform into RPG Quest
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setNotes(SAMPLE);
              setMode("paste");
              setStatus("Sample physiology notes loaded. Press Transform to write the story.");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line px-4 py-3 text-sm font-medium"
          >
            <FileText className="size-4" /> Sample notes
          </button>
        </div>
      </section>

      {quest && (
        <section className="space-y-3 rounded-[var(--radius-xl)] border border-line bg-card p-5 sm:p-7">
          <p className="text-xs font-medium tracking-wide text-coral uppercase">Your story</p>
          <h2 className="font-display text-lg font-semibold">{quest.title}</h2>
          {quest.chapters.map((ch) => (
            <article key={ch.title} className="border-t border-line pt-3">
              <h3 className="mb-1 text-sm font-semibold text-coral">{ch.title}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{ch.text}</p>
            </article>
          ))}
          <p className="text-xs text-muted">
            {quest.questions.length} quiz challenges ready for the farm. Open RPG World when you
            want to play — this story stays here.
          </p>
          <button
            type="button"
            onClick={() => setTab("rpg")}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
          >
            Play this quest on the farm
          </button>
        </section>
      )}
    </div>
  );
}
