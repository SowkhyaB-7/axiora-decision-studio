import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS } from "@/lib/dimensions";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/boards/new")({
  head: () => ({
    meta: [{ title: "New Decision Board — Axiora" }],
  }),
  component: NewBoard,
});

const templates = [
  { key: "blank", name: "Blank board", meta: "Start from scratch", featured: false },
  { key: "feature_launch", name: "Feature launch", meta: "Product · 5 sections", featured: true },
  { key: "pricing_change", name: "Pricing change", meta: "Revenue · 6 sections", featured: false },
  { key: "deprecation", name: "Deprecation", meta: "Lifecycle · 4 sections", featured: false },
];

const DECISION_TYPES: { value: string; label: string; available: boolean }[] = [
  { value: "Launch Readiness", label: "Launch Readiness", available: true },
  { value: "Feature Prioritization", label: "Feature Prioritization", available: false },
  { value: "Pricing Decision", label: "Pricing Decision", available: false },
  { value: "Product Sunset", label: "Product Sunset", available: false },
  { value: "Build vs Buy", label: "Build vs Buy", available: false },
  { value: "Market Expansion", label: "Market Expansion", available: false },
];

function NewBoard() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [decisionType, setDecisionType] = useState<string>("Launch Readiness");
  const [targetDate, setTargetDate] = useState("");
  const [template, setTemplate] = useState<string>("feature_launch");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Decision title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Decision description is required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        toast.error("You must be signed in to create a board");
        setSubmitting(false);
        return;
      }
      const { data, error } = await supabase
        .from("decision_boards")
        .insert({
          title: title.trim(),
          description: description.trim(),
          owner_id: userData.user.id,
          target_date: targetDate || null,
          status: "Draft",
          template,
          decision_type: decisionType,
        } as never)
        .select("id")
        .single();
      if (error || !data) {
        toast.error(error?.message ?? "Failed to create board");
        setSubmitting(false);
        return;
      }

      // Seed the 5 assessment dimensions
      const { error: dimErr } = await supabase.from("assessment_dimensions").insert(
        DIMENSIONS.map((d) => ({
          board_id: data.id,
          dimension_name: d.key,
          status: "not_started",
        })),
      );
      if (dimErr) {
        toast.error(dimErr.message);
        setSubmitting(false);
        return;
      }

      toast.success("Decision board created");
      navigate({ to: "/boards/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create board");
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="New Decision Board" subtitle="Set up the scope, dimensions, and collaborators">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        <div className="rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-5 md:px-8">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Step 1 of 3 · Board setup
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">Create decision board</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              A board frames the decision. Axiora will help you gather evidence across five dimensions.
            </p>
          </div>

          <div className="space-y-8 p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Decision title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="e.g. Should we launch the AI copilot to enterprise customers in Q1?"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Context</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  required
                  placeholder="Briefly describe the decision, its scope, and why now."
                  className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Decision owner</label>
                <select
                  disabled
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option>You (signed-in user)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target decision date</label>
                <div className="relative mt-2">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Decision type</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="Launch">Launch</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Choose a template</h2>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {templates.map((t) => {
                  const selected = template === t.key;
                  return (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setTemplate(t.key)}
                      className={`text-left rounded-lg border p-4 transition-colors ${
                        selected
                          ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                          : "border-border bg-surface hover:border-foreground/20"
                      }`}
                    >
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.meta}</div>
                      {t.featured && (
                        <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-accent">
                          Recommended
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">Assessment dimensions</h2>
                <span className="text-xs text-muted-foreground">All 5 enabled by default</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {DIMENSIONS.map((d) => (
                  <label
                    key={d.key}
                    className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-surface-muted"
                  >
                    <input type="checkbox" defaultChecked disabled className="mt-1 h-4 w-4 accent-[color:var(--accent)]" />
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-muted">
                      <d.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold">Visibility</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-lg border border-accent bg-accent/5 p-4 ring-1 ring-accent/30">
                  <input type="radio" name="vis" defaultChecked className="mt-1" />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4" /> Team
                    </div>
                    <div className="text-xs text-muted-foreground">Only invited teammates can view and edit.</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                  <input type="radio" name="vis" className="mt-1" />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4" /> Organization
                    </div>
                    <div className="text-xs text-muted-foreground">Anyone in Axiora Labs can discover this board.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    Create board <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
