import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Link as LinkIcon,
  Paperclip,
  Upload,
  X,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import {
  EVIDENCE_TYPES,
  EVIDENCE_STRENGTHS,
  ALLOWED_ATTACHMENT_ACCEPT,
  todayISO,
  isFutureDate,
  type EvidenceRow,
} from "@/lib/evidence";
import {
  useEvidenceDimension,
  useEvidenceList,
  useEvidenceMutations,
  uploadAttachment,
  removeAttachment,
  getAttachmentSignedUrl,
  type EvidenceInput,
} from "@/hooks/use-evidence";

type Props = {
  boardId: string;
  dimensionName: string;
  title: string;
  description: string;
  icon: ReactNode;
};

type Attachment = { path: string; name: string };

type FormState = {
  id?: string;
  title: string;
  description: string;
  evidence_type: string;
  evidence_date: string;
  evidence_strength: string;
  source_url: string;
  notes: string;
  attachments: Attachment[];
};

const emptyForm: FormState = {
  title: "",
  description: "",
  evidence_type: "",
  evidence_date: "",
  evidence_strength: "",
  source_url: "",
  notes: "",
  attachments: [],
};

function nameFromPath(p: string): string {
  const base = p.split("/").pop() ?? p;
  // Strip the crypto.randomUUID() prefix we add on upload ("<uuid>-<name>")
  return base.replace(/^[0-9a-f-]{36}-/i, "");
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function EvidenceSection({
  boardId,
  dimensionName,
  title,
  description,
  icon,
}: Props) {
  const dimensionQuery = useEvidenceDimension(boardId, dimensionName);
  const dimensionId = dimensionQuery.data?.id;
  const listQuery = useEvidenceList(dimensionId);
  const { create, update, remove } = useEvidenceMutations(boardId, dimensionId);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<EvidenceRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EvidenceRow | null>(null);

  const rows = listQuery.data ?? [];

  const openNew = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (r: EvidenceRow) => {
    const paths = [
      ...(r.attachment_paths ?? []),
      ...(r.attachment_path && !(r.attachment_paths ?? []).includes(r.attachment_path)
        ? [r.attachment_path]
        : []),
    ];
    setForm({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      evidence_type: r.evidence_type ?? "",
      evidence_date: r.evidence_date ?? "",
      evidence_strength: r.evidence_strength ?? "",
      source_url: r.source_url ?? "",
      notes: r.notes ?? "",
      attachments: paths.map((p) => ({ path: p, name: nameFromPath(p) })),
    });
    setFormOpen(true);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !dimensionId) return;
    setUploading(true);
    const uploaded: Attachment[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          const path = await uploadAttachment(file, dimensionId);
          uploaded.push({ path, name: file.name });
        } catch (e) {
          toast.error(
            `${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`,
          );
        }
      }
      if (uploaded.length > 0) {
        setForm((f) => ({ ...f, attachments: [...f.attachments, ...uploaded] }));
        toast.success(
          uploaded.length === 1
            ? "File uploaded"
            : `${uploaded.length} files uploaded`,
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const target = form.attachments[index];
    if (!target) return;
    await removeAttachment(target.path).catch(() => {});
    setForm((f) => ({
      ...f,
      attachments: f.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");
    if (!form.evidence_type) return toast.error("Evidence type is required");
    if (!form.evidence_date) return toast.error("Evidence date is required");
    if (isFutureDate(form.evidence_date))
      return toast.error("Evidence date cannot be in the future.");

    const paths = form.attachments.map((a) => a.path);
    const payload: EvidenceInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      evidence_type: form.evidence_type,
      evidence_date: form.evidence_date,
      evidence_strength: form.evidence_strength || null,
      source_url: form.source_url.trim() || null,
      notes: form.notes.trim() || null,
      attachment_path: paths[0] ?? null,
      attachment_paths: paths,
    };

    try {
      if (form.id) {
        await update.mutateAsync({ id: form.id, input: payload });
        toast.success("Evidence updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Evidence added");
      }
      setFormOpen(false);
      setForm(emptyForm);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };


  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove.mutateAsync(pendingDelete);
      toast.success("Evidence deleted");
      setPendingDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const openSignedUrl = async (path: string) => {
    try {
      const url = await getAttachmentSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open file");
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-muted">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Readiness
              </div>
              <div className="font-display text-lg">
                {dimensionQuery.data?.readiness_level ?? "Not Analyzed"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Evidence
              </div>
              <div className="font-display text-lg">{rows.length}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">Evidence</h2>
            <p className="text-xs text-muted-foreground">
              {rows.length} {rows.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            disabled={!dimensionId}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> Add Evidence
          </button>
        </div>

        {listQuery.isLoading || dimensionQuery.isLoading ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : listQuery.error ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {listQuery.error instanceof Error
              ? listQuery.error.message
              : "Failed to load evidence"}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium">No Evidence Added Yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Start by adding customer interviews, analytics, documents, or
              stakeholder feedback that informs this dimension.
            </p>
            <button
              type="button"
              onClick={openNew}
              disabled={!dimensionId}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> Add Evidence
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start gap-4 px-6 py-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted">
                  {r.attachment_path || (r.attachment_paths?.length ?? 0) > 0 ? (
                    <Paperclip className="h-4 w-4 text-accent" />
                  ) : r.source_url ? (
                    <LinkIcon className="h-4 w-4 text-accent" />
                  ) : (
                    <FileText className="h-4 w-4 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {r.evidence_type && (
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {r.evidence_type}
                      </span>
                    )}
                    {r.evidence_strength && (
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {r.evidence_strength}
                      </span>
                    )}
                    {r.evidence_date && <span>{fmtDate(r.evidence_date)}</span>}
                    {r.updated_at && (
                      <span className="text-[11px]">
                        · Updated {fmtDate(r.updated_at)}
                      </span>
                    )}
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
                    onClick={() => setPendingDelete(r)}
                    className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formOpen && (
        <Modal
          onClose={() => setFormOpen(false)}
          title={form.id ? "Edit Evidence" : "Add Evidence"}
        >
          <div className="space-y-4">
            <Field label="Title" required>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </Field>

            <Field label="Description" required>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Evidence Type" required>
                <select
                  value={form.evidence_type}
                  onChange={(e) =>
                    setForm({ ...form, evidence_type: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">Select…</option>
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Evidence Date" required>
                <input
                  type="date"
                  value={form.evidence_date}
                  max={todayISO()}
                  onChange={(e) =>
                    setForm({ ...form, evidence_date: e.target.value })
                  }
                  className={inputCls}
                />
                {form.evidence_date && isFutureDate(form.evidence_date) && (
                  <p className="mt-1 text-[11px] text-destructive">
                    Evidence date cannot be in the future.
                  </p>
                )}
              </Field>

            </div>

            <Field label="Evidence Strength">
              <select
                value={form.evidence_strength}
                onChange={(e) =>
                  setForm({ ...form, evidence_strength: e.target.value })
                }
                className={inputCls}
              >
                <option value="">Select…</option>
                {EVIDENCE_STRENGTHS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Source / Link">
              <input
                type="url"
                placeholder="https://…"
                value={form.source_url}
                onChange={(e) =>
                  setForm({ ...form, source_url: e.target.value })
                }
                className={inputCls}
              />
            </Field>

            <Field label="Attachments">
              {form.attachments.length > 0 && (
                <ul className="mb-2 space-y-1.5">
                  {form.attachments.map((a, i) => (
                    <li
                      key={`${a.path}-${i}`}
                      className="flex items-center justify-between rounded-md border border-border bg-surface-muted px-3 py-2 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{a.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void removeAttachmentAt(i)}
                        className="rounded-md p-1 hover:bg-surface"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 py-4 text-xs text-muted-foreground hover:bg-surface-muted">
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    {form.attachments.length > 0
                      ? "Add More Files"
                      : "Choose Files (max 20 MB each)"}
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept={ALLOWED_ATTACHMENT_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    void handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="mt-1 text-[11px] text-muted-foreground">
                PDF, DOCX, XLSX, PPTX, PNG, JPG, JPEG, CSV, TXT
              </p>
            </Field>


            <Field label="Notes">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || uploading}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {form.id ? "Save Changes" : "Add Evidence"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal onClose={() => setViewing(null)} title={viewing.title}>
          <div className="space-y-3 text-sm">
            {viewing.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {viewing.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              {viewing.evidence_type && (
                <span className="rounded-full border border-border px-2 py-0.5">
                  {viewing.evidence_type}
                </span>
              )}
              {viewing.evidence_strength && (
                <span className="rounded-full border border-border px-2 py-0.5">
                  {viewing.evidence_strength}
                </span>
              )}
              {viewing.evidence_date && (
                <span className="rounded-full border border-border px-2 py-0.5">
                  {fmtDate(viewing.evidence_date)}
                </span>
              )}
            </div>
            {viewing.source_url && (
              <a
                href={viewing.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {viewing.source_url}
              </a>
            )}
            {(() => {
              const paths = [
                ...(viewing.attachment_paths ?? []),
                ...(viewing.attachment_path &&
                !(viewing.attachment_paths ?? []).includes(viewing.attachment_path)
                  ? [viewing.attachment_path]
                  : []),
              ];
              if (paths.length === 0) return null;
              return (
                <div>
                  <div className="text-xs font-medium">
                    Attachments ({paths.length})
                  </div>
                  <ul className="mt-1 space-y-1">
                    {paths.map((p, i) => (
                      <li key={`${p}-${i}`}>
                        <button
                          type="button"
                          onClick={() => openSignedUrl(p)}
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {nameFromPath(p)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {viewing.notes && (
              <div>
                <div className="text-xs font-medium">Notes</div>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {viewing.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)} title="Delete This Evidence?">
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              This will permanently delete "{pendingDelete.title}" and its
              attachments. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={remove.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                {remove.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const inputCls =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
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
