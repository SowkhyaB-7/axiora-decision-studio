import { useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  EVIDENCE_BUCKET,
  validateAttachment,
  type EvidenceRow,
} from "@/lib/evidence";

/** Query key helpers so callers stay consistent across the app. */
export const evidenceKeys = {
  list: (dimensionId: string | undefined | null) =>
    ["evidence", "list", dimensionId ?? "none"] as const,
  counts: (boardId: string) => ["evidence-counts", boardId] as const,
  dimension: (boardId: string, name: string) =>
    ["dim", boardId, name] as const,
};

export function useEvidenceDimension(boardId: string, dimensionName: string) {
  return useQuery({
    queryKey: evidenceKeys.dimension(boardId, dimensionName),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_dimensions")
        .select("id, status, readiness_level")
        .eq("board_id", boardId)
        .eq("dimension_name", dimensionName)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useEvidenceList(dimensionId: string | undefined | null) {
  return useQuery({
    queryKey: evidenceKeys.list(dimensionId),
    enabled: !!dimensionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("dimension_id", dimensionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EvidenceRow[];
    },
  });
}

export type EvidenceInput = {
  title: string;
  description: string;
  evidence_type: string;
  evidence_date: string; // yyyy-mm-dd
  evidence_strength: string | null;
  source_url: string | null;
  notes: string | null;
  attachment_path: string | null;
  attachment_paths: string[];
};

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/** Uploads an attachment to the user's namespaced folder in the private bucket. */
export async function uploadAttachment(
  file: File,
  dimensionId: string,
): Promise<string> {
  const err = validateAttachment(file);
  if (err) throw new Error(err);
  const uid = await currentUserId();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${uid}/${dimensionId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

export async function removeAttachment(path: string): Promise<void> {
  if (!path) return;
  await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
}

export async function getAttachmentSignedUrl(
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export function useEvidenceMutations(
  boardId: string,
  dimensionId: string | undefined | null,
) {
  const qc = useQueryClient();

  const markAnalysisOutdated = useCallback(async () => {
    // Only mark Outdated when a prior analysis existed. Never overwrite
    // states like "Never Analyzed" or "Outdated" itself.
    await supabase
      .from("decision_boards")
      .update({ analysis_status: "Outdated" } as never)
      .eq("id", boardId)
      .eq("analysis_status", "Analysis Complete");
  }, [boardId]);

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: evidenceKeys.list(dimensionId) }),
      qc.invalidateQueries({ queryKey: evidenceKeys.counts(boardId) }),
      qc.invalidateQueries({ queryKey: ["board", boardId] }),
      qc.invalidateQueries({ queryKey: ["boards", "mine"] }),
    ]);
  }, [qc, boardId, dimensionId]);

  const create = useMutation({
    mutationFn: async (input: EvidenceInput) => {
      if (!dimensionId) throw new Error("Dimension not ready");
      const { error } = await supabase.from("evidence").insert({
        dimension_id: dimensionId,
        title: input.title,
        description: input.description || null,
        evidence_type: input.evidence_type,
        evidence_date: input.evidence_date,
        evidence_strength: input.evidence_strength,
        source_url: input.source_url,
        attachment_path: input.attachment_path,
        attachment_paths: input.attachment_paths,
        notes: input.notes,
      } as never);
      if (error) throw error;
      await markAnalysisOutdated();
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (args: { id: string; input: EvidenceInput }) => {
      const { error } = await supabase
        .from("evidence")
        .update({
          title: args.input.title,
          description: args.input.description || null,
          evidence_type: args.input.evidence_type,
          evidence_date: args.input.evidence_date,
          evidence_strength: args.input.evidence_strength,
          source_url: args.input.source_url,
          attachment_path: args.input.attachment_path,
          attachment_paths: args.input.attachment_paths,
          notes: args.input.notes,
        } as never)
        .eq("id", args.id);
      if (error) throw error;
      await markAnalysisOutdated();
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (row: EvidenceRow) => {
      const paths = [
        ...(row.attachment_paths ?? []),
        ...(row.attachment_path && !(row.attachment_paths ?? []).includes(row.attachment_path)
          ? [row.attachment_path]
          : []),
      ];
      for (const p of paths) {
        await removeAttachment(p).catch(() => {});
      }
      const { error } = await supabase.from("evidence").delete().eq("id", row.id);
      if (error) throw error;
      await markAnalysisOutdated();
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
