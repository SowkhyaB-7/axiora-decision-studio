import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCEPT_ATTR,
  MAX_DOCUMENT_BYTES,
  UNSUPPORTED_MESSAGE,
  classifyFile,
  extractDocumentText,
  fileTypeLabel,
} from "@/lib/document-text";

const BUCKET = "evidence-attachments";

/**
 * Files attached to one work item. Extracted text is stored as document
 * content only: it is shown as the file's own words, never as confirmed fact,
 * and it never rewrites the item's steps.
 */
export function SupportingMaterials({ workItemId }: { workItemId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const key = ["work-attachments", workItemId];

  const list = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_item_attachments")
        .select("*")
        .eq("work_item_id", workItemId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You're not signed in");
      const failures: string[] = [];
      for (const file of files) {
        const kind = classifyFile(file);
        if (!kind) { failures.push(`${file.name}: ${UNSUPPORTED_MESSAGE}`); continue; }
        if (file.size === 0) { failures.push(`${file.name}: That file is empty.`); continue; }
        if (file.size > MAX_DOCUMENT_BYTES) { failures.push(`${file.name}: That file is larger than 10 MB.`); continue; }
        let text: string | null = null;
        try { text = (await extractDocumentText(file)).text; } catch { text = null; }
        const path = `${auth.user.id}/work/${workItemId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
        if (upErr) { failures.push(`${file.name}: upload failed.`); continue; }
        const { error } = await supabase.from("work_item_attachments").insert({
          work_item_id: workItemId,
          owner_id: auth.user.id,
          filename: file.name,
          file_type: fileTypeLabel(kind),
          storage_path: path,
          extracted_text: text,
        });
        if (error) {
          await supabase.storage.from(BUCKET).remove([path]);
          failures.push(`${file.name}: couldn't be saved.`);
        }
      }
      return { failures, total: files.length };
    },
    onSuccess: async ({ failures, total }) => {
      await queryClient.invalidateQueries({ queryKey: key });
      failures.forEach((f) => toast.error(f));
      const ok = total - failures.length;
      if (ok > 0) toast.success(ok === 1 ? "File attached" : `${ok} files attached`);
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  const remove = useMutation({
    mutationFn: async (row: { id: string; storage_path: string }) => {
      const { error } = await supabase.from("work_item_attachments").delete().eq("id", row.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      toast.success("Attachment removed");
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't remove that file"),
  });

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data) return toast.error("Couldn't open that file");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const rows = list.data ?? [];

  return (
    <div className="mt-8 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Supporting materials</p>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={upload.isPending} onClick={() => inputRef.current?.click()}>
          {upload.isPending ? <Loader2 className="animate-spin" /> : <Paperclip />} Attach file
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          aria-label="Attach supporting file"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) upload.mutate(files);
          }}
        />
      </div>
      {list.isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">PDF, DOCX or TXT, up to 10 MB each.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="rounded-md border border-border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate" title={row.filename}>{row.filename}</span>
                <span className="text-[11px] font-semibold text-muted-foreground">{row.file_type}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Open ${row.filename}`} onClick={() => openFile(row.storage_path)}>
                  <ExternalLink />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove ${row.filename}`} disabled={remove.isPending} onClick={() => remove.mutate(row)}>
                  <Trash2 />
                </Button>
              </div>
              {row.extracted_text ? (
                <div className="mt-1.5 pl-6">
                  <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setOpenId(openId === row.id ? null : row.id)}>
                    {openId === row.id ? "Hide text from this file" : "Show text from this file"}
                  </button>
                  {openId === row.id && (
                    <>
                      <p className="mt-1 text-[11px] text-muted-foreground">The file's own words, not checked or interpreted by Axiora.</p>
                      <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">{row.extracted_text.slice(0, 4000)}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-1 pl-6 text-xs text-muted-foreground">Stored, but its text couldn't be read.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
