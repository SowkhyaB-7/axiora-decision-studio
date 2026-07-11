import type { DimensionKey } from "@/lib/dimensions";

export const EVIDENCE_TYPES = [
  "Customer Interview",
  "Customer Feedback",
  "Support Ticket",
  "Usage Analytics",
  "Survey",
  "Sales Call",
  "Prototype Test",
  "Competitor Insight",
  "Market Research",
  "Stakeholder Feedback",
  "Other",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STRENGTHS = ["Weak", "Medium", "Strong"] as const;
export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "csv",
  "txt",
] as const;

export const ALLOWED_ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTENSIONS.map(
  (e) => `.${e}`,
).join(",");

export const EVIDENCE_BUCKET = "evidence-attachments";

export function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export function validateAttachment(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) return "File exceeds 20 MB limit";
  const ext = getExtension(file.name);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number])) {
    return `Unsupported file type .${ext}`;
  }
  return null;
}

export type EvidenceRow = {
  id: string;
  dimension_id: string;
  title: string;
  description: string | null;
  evidence_type: string | null;
  evidence_strength: string | null;
  evidence_date: string | null;
  recency: string | null;
  source_url: string | null;
  attachment_path: string | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
};

// All five dimensions use the same reusable Evidence Engine.
export const ENABLED_EVIDENCE_DIMENSIONS: DimensionKey[] = [
  "customer_validation",
  "product_technical",
  "business",
  "operational",
  "stakeholder_alignment",
];
