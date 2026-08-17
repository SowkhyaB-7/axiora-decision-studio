import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { extractEvidence } from "@/lib/ai.functions";
import {
  ACCEPT_ATTR,
  extractDocumentText,
  fileTypeLabel,
  type DocKind,
} from "@/lib/document-text";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  DIRECTIONS,
  DIRECTION_LABEL,
  STRENGTHS,
  STRENGTH_LABEL,
  type Category,
  type Direction,
  type Strength,
} from "@/lib/verdict";
import { cn } from "@/lib/utils";

type Draft = {
  title: string;
  category: Category | "";
  direction: Direction | "";
  strength: Strength | "";
  takeaway: string;
};

const EMPTY: Draft = {
  title: "",
  category: "",
  direction: "",
  strength: "",
  takeaway: "",
};

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

type SourceDoc = { file: File; kind: DocKind };

export function EvidenceQuickAdd({
  decisionId,
  onClose,
}: {
  decisionId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const runExtract = useServerFn(extractEvidence);
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"text" | "document">("text");
  const [rawText, setRawText] = useState("");
  const [doc, setDoc] = useState<SourceDoc | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [uncertain, setUncertain] = useState<string[]>([]);
  const [structured, setStructured] = useState(false);
  const [usedAi, setUsedAi] = useState(false);

  const resetStructure = () => {
    setStructured(false);
    setDraft(EMPTY);
    setUncertain([]);
  };

  const readDoc = useMutation({
    mutationFn: async (file: File) => extractDocumentText(file),
    onSuccess: (res, file) => {
      setDoc({ file, kind: res.kind });
      setRawText(res.text);
      resetStructure();
    },
    onError: (e: Error, file) => {
      setDoc(null);
      setRawText("");
      toast.error(e.message, {
        description: `Couldn't use ${file.name}. Try another file, or paste the text instead.`,
      });
    },
  });

  const extractMut = useMutation({
    mutationFn: async () => runExtract({ data: { rawText, decisionId } }),
    onSuccess: (res) => {
      setDraft({
        title: res.title ?? "",
        category: res.category ?? "",
        direction: res.direction ?? "",
        strength: res.strength ?? "",
        takeaway: res.takeaway ?? "",
      });
      setUncertain(res.uncertain);
      setStructured(true);
      setUsedAi(true);
      if (res.uncertain.length) {
        toast.message("Some fields need your judgement", {
          description:
            "Axiora left the fields it couldn't read from your note for you to fill in.",
        });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't read that note"),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      let storagePath: string | null = null;
      if (doc) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("You're not signed in");
        const path = `${auth.user.id}/${decisionId}/${Date.now()}-${doc.file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("evidence-attachments")
          .upload(path, doc.file, { contentType: doc.file.type || undefined });
        if (upErr) throw upErr;
        storagePath = path;
      }
      const { error } = await supabase.from("evidence_items").insert({
        decision_id: decisionId,
        raw_text: rawText.trim(),
        title: draft.title.trim(),
        category: draft.category as Category,
        direction: draft.direction as Direction,
        strength: draft.strength as Strength,
        takeaway: draft.takeaway.trim() || null,
        extraction_source: usedAi ? "AI_ASSISTED" : "MANUAL",
        source_type: doc ? "DOCUMENT" : "PASTED_TEXT",
        source_filename: doc?.file.name ?? null,
        source_file_type: doc ? fileTypeLabel(doc.kind) : null,
        source_storage_path: storagePath,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["decision", decisionId] });
      await qc.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Evidence added");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't save that evidence"),
  });

  const complete =
    rawText.trim().length > 0 &&
    draft.title.trim().length > 0 &&
    draft.category &&
    draft.direction &&
    draft.strength;

  const pickMode = (next: "text" | "document") => {
    if (next === mode) return;
    setMode(next);
    setRawText("");
    setDoc(null);
    resetStructure();
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg">Add Evidence</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Paste a note or hand Axiora a document. Axiora structures it; you
            confirm it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 inline-flex rounded-md border border-border p-0.5">
        {(
          [
            ["text", "Paste text"],
            ["document", "Upload document"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => pickMode(value)}
            className={cn(
              "rounded px-3 py-1.5 text-sm",
              mode === value
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-surface-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={6}
          placeholder="e.g. Call with Head of Ops at Northwind: they'd pay for the copilot but only if audit logs ship with it. Two of their teams already tried a workaround."
          className={cn(inputClass, "mt-4 resize-y font-normal")}
        />
      ) : (
        <div className="mt-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) readDoc.mutate(file);
            }}
            className={cn(
              "rounded-lg border border-dashed p-6 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            <p className="text-sm text-foreground/80">
              Drop a document here or{" "}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="text-primary underline"
              >
                choose a file
              </button>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, DOCX, or TXT · up to 10 MB
            </p>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) readDoc.mutate(file);
              }}
            />
          </div>

          {readDoc.isPending && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading the document…
            </p>
          )}

          {doc && !readDoc.isPending && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-surface-muted/60 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{doc.file.name}</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                {fileTypeLabel(doc.kind)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDoc(null);
                  setRawText("");
                  resetStructure();
                }}
                className="ml-auto rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label="Remove document"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {rawText && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-primary">
                Show extracted text
              </summary>
              <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-muted/60 p-3 text-sm leading-relaxed text-foreground/80">
                {rawText}
              </p>
            </details>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!rawText.trim() || extractMut.isPending}
          onClick={() => extractMut.mutate()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {extractMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Structure With Axiora
        </button>
        <button
          type="button"
          disabled={!rawText.trim()}
          onClick={() => {
            setStructured(true);
            setUsedAi(false);
          }}
          className="rounded-md border border-border px-3.5 py-2 text-sm text-foreground/80 hover:bg-surface-muted disabled:opacity-50"
        >
          Fill In Myself
        </button>
      </div>

      {structured && (
        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <Field label="Title" flagged={uncertain.includes("title")}>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Short factual headline"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Area" flagged={uncertain.includes("category")}>
              <Select
                value={draft.category}
                onChange={(v) => setDraft({ ...draft, category: v as Category })}
                options={CATEGORIES.map((c) => ({
                  value: c,
                  label: CATEGORY_LABEL[c],
                }))}
              />
            </Field>
            <Field label="Direction" flagged={uncertain.includes("direction")}>
              <Select
                value={draft.direction}
                onChange={(v) => setDraft({ ...draft, direction: v as Direction })}
                options={DIRECTIONS.map((d) => ({
                  value: d,
                  label: DIRECTION_LABEL[d],
                }))}
              />
            </Field>
            <Field label="Strength" flagged={uncertain.includes("strength")}>
              <Select
                value={draft.strength}
                onChange={(v) => setDraft({ ...draft, strength: v as Strength })}
                options={STRENGTHS.map((s) => ({
                  value: s,
                  label: STRENGTH_LABEL[s],
                }))}
              />
            </Field>
          </div>

          <Field label="Takeaway" flagged={uncertain.includes("takeaway")}>
            <textarea
              rows={2}
              className={cn(inputClass, "resize-y")}
              value={draft.takeaway}
              onChange={(e) => setDraft({ ...draft, takeaway: e.target.value })}
              placeholder="One sentence stating only what this note says"
            />
          </Field>

          {doc && (
            <p className="text-xs text-muted-foreground">
              Source: {doc.file.name} ({fileTypeLabel(doc.kind)})
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!complete || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Evidence
            </button>
            {!complete && (
              <span className="text-xs text-muted-foreground">
                Title, area, direction and strength are required.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  flagged,
  children,
}: {
  label: string;
  flagged?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {flagged && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] normal-case tracking-normal text-accent">
            Needs your judgement
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
