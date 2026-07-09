import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Users,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Link as LinkIcon,
  FileText,
  StickyNote,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/boards/$id/customer-validation")({
  head: () => ({
    meta: [{ title: "Customer Validation — Axiora" }],
  }),
  component: CustomerValidation,
});

type EvidenceRow = {
  id: string;
  title: string;
  description: string | null;
  evidence_type: string | null;
  evidence_strength: string | null;
  recency: string | null;
  notes: string | null;
  file_url: string | null;
  dimension_id: string;
  created_at: string;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  evidence_type: "file" | "link" | "note";
  evidence_strength: "Strong" | "Moderate" | "Weak" | "";
  recency: "This week" | "This month" | "This quarter" | "Older" | "";
  notes: string;
  file_url: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  evidence_type: "note",
  evidence_strength: "",
  recency: "",
  notes: "",
  file_url: "",
};

function CustomerValidation() {
  const { id: boardId } = Route.useParams();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<EvidenceRow | null>(null);

  const dimensionQuery = useQuery({
    queryKey: ["dim", boardId, "customer_validation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_dimensions")
        .select("id, status, readiness_level")
        .eq("board_id", boardId)
        .eq("dimension_name", "customer_validation")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const dimensionId = dimensionQuery.data?.id;

  const evidenceQuery = useQuery({
    queryKey: ["evidence", dimensionId],
    enabled: !!dimensionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("dimension_id", dimensionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EvidenceRow[];
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: EvidenceRow) => {
    setForm({
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      evidence_type: (row.evidence_type as FormState["evidence_type"]) ?? "note",
      evidence_strength: (row.evidence_strength as FormState["evidence_strength"]) ?? "",
      recency: (row.recency as FormState["recency"]) ?? "",
      notes: row.notes ?? "",
      file_url: row.file_url ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!dimensionId) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        dimension_id: dimensionId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        evidence_type: form.evidence_type,
        evidence_strength: form.evidence_strength || null,
        recency: form.recency || null,
        notes: form.notes.trim() || null,
        file_url: form.file_url.trim() || null,
      };
      if (form.id) {
        const { error } = await supabase.from("evidence").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Evidence updated");
      } else {
        const { error } = await supabase.from("evidence").insert(payload);
        if (error) throw error;
        toast.success("Evidence added");
      }
      setShowForm(false);
      setForm(emptyForm);
      await qc.invalidateQueries({ queryKey: ["evidence", dimensionId] });
      await qc.invalidateQueries({ queryKey: ["evidence-counts", boardId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: EvidenceRow) => {
    if (!confirm(`Delete "${row.title}"?`)) return;
    const { error } = await supabase.from("evidence").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Evidence deleted");
    await qc.invalidateQueries({ queryKey: ["evidence", dimensionId] });
    await qc.invalidateQueries({ queryKey: ["evidence-counts", boardId] });
  };

  const rows = evidenceQuery.data ?? [];

  return (
    <AppShell title="Customer Validation" subtitle="Evidence from interviews, feedback, and usage">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/boards/$id"
          params={{ id: boardId }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to board
        </Link>

        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-muted">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl md:text-4xl">Customer Validation</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Collect interviews, usage signals, and feedback that validate demand.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Readiness</div>
              <div className="font-display text-2xl">
                {dimensionQuery.data?.readiness_level ?? "Not Analyzed"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold">Evidence cards</h2>
              <p className="text-xs text-muted-foreground">{rows.length} recorded</p>
            </div>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add evidence
            </button>
          </div>

          {evidenceQuery.isLoading ? (
            <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No evidence yet. Add your first evidence card to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const Icon =
                  r.evidence_type === "file" ? FileText : r.evidence_type === "link" ? LinkIcon : StickyNote;
                return (
                  <li key={r.id} className="flex items-start gap-4 px-6 py-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {r.evidence_strength && (
                          <span className="rounded-full border border-border px-2 py-0.5">
                            {r.evidence_strength}
                          </span>
                        )}
                        {r.recency && <span>{r.recency}</span>}
                        <span>· {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewing(r)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={form.id ? "Edit evidence" : "Add evidence"}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium">Type</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["file", "link", "note"] as const).map((t) => {
                  const Icon = t === "file" ? Upload : t === "link" ? LinkIcon : StickyNote;
                  const sel = form.evidence_type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, evidence_type: t })}
                      className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs capitalize ${
                        sel
                          ? "border-accent bg-accent/5 text-accent"
                          : "border-border bg-surface hover:bg-surface-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {(form.evidence_type === "file" || form.evidence_type === "link") && (
              <div>
                <label className="text-xs font-medium">
                  {form.evidence_type === "file" ? "File URL" : "Link URL"}
                </label>
                <input
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {form.evidence_type === "file" && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Paste a hosted file URL. File uploads coming soon.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Evidence strength</label>
                <select
                  value={form.evidence_strength}
                  onChange={(e) =>
                    setForm({ ...form, evidence_strength: e.target.value as FormState["evidence_strength"] })
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select…</option>
                  <option>Strong</option>
                  <option>Moderate</option>
                  <option>Weak</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Recency</label>
                <select
                  value={form.recency}
                  onChange={(e) => setForm({ ...form, recency: e.target.value as FormState["recency"] })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select…</option>
                  <option>This week</option>
                  <option>This month</option>
                  <option>This quarter</option>
                  <option>Older</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">Notes</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {form.id ? "Save" : "Add evidence"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal onClose={() => setViewing(null)} title={viewing.title}>
          <div className="space-y-3 text-sm">
            {viewing.description && <p className="text-muted-foreground">{viewing.description}</p>}
            <div className="flex flex-wrap gap-2 text-xs">
              {viewing.evidence_type && (
                <span className="rounded-full border border-border px-2 py-0.5 capitalize">
                  {viewing.evidence_type}
                </span>
              )}
              {viewing.evidence_strength && (
                <span className="rounded-full border border-border px-2 py-0.5">{viewing.evidence_strength}</span>
              )}
              {viewing.recency && (
                <span className="rounded-full border border-border px-2 py-0.5">{viewing.recency}</span>
              )}
            </div>
            {viewing.file_url && (
              <a
                href={viewing.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" /> {viewing.file_url}
              </a>
            )}
            {viewing.notes && (
              <div>
                <div className="text-xs font-medium">Notes</div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{viewing.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm">
      <div className="mt-16 w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
