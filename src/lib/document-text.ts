/**
 * Browser-side document text extraction.
 *
 * A document is only ever a different way of *supplying* evidence text. Once
 * the text is out, it goes through exactly the same AI extraction pipeline as
 * pasted text — there is no second evidence path.
 */

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export type DocKind = "pdf" | "docx" | "txt";

const EXT_KIND: Record<string, DocKind> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "txt",
};

export const ACCEPT_ATTR =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export const UNSUPPORTED_MESSAGE =
  "Unsupported file type. Upload a PDF, DOCX, or TXT file.";

export const FAILED_MESSAGE = "Couldn't read this document.";

export function classifyFile(file: File): DocKind | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_KIND[ext] ?? null;
}

export function fileTypeLabel(kind: DocKind): string {
  return kind === "pdf" ? "PDF" : kind === "docx" ? "DOCX" : "TXT";
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  const limit = Math.min(doc.numPages, 40);
  for (let i = 1; i <= limit; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((it) => ("str" in it ? (it.str as string) : ""))
        .join(" "),
    );
  }
  return pages.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mod = (await import(
    /* @vite-ignore */ "mammoth/mammoth.browser.js"
  )) as unknown as {
    default?: {
      extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    extractRawText?: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const extractRawText = mod.extractRawText ?? mod.default?.extractRawText;
  if (!extractRawText) throw new Error(FAILED_MESSAGE);
  const buf = await file.arrayBuffer();
  const res = await extractRawText({ arrayBuffer: buf });
  return res.value;
}

/** Throws a user-facing Error when the file is unusable. */
export async function extractDocumentText(
  file: File,
): Promise<{ kind: DocKind; text: string }> {
  const kind = classifyFile(file);
  if (!kind) throw new Error(UNSUPPORTED_MESSAGE);
  if (file.size === 0) throw new Error("That file is empty.");
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error("That file is larger than 10 MB.");

  let text: string;
  try {
    text =
      kind === "pdf"
        ? await extractPdf(file)
        : kind === "docx"
          ? await extractDocx(file)
          : await file.text();
  } catch {
    throw new Error(FAILED_MESSAGE);
  }

  const cleaned = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (cleaned.length < 40) throw new Error(FAILED_MESSAGE);
  return { kind, text: cleaned.slice(0, 20000) };
}
