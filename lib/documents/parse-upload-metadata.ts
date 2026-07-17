import type { DocumentCategory, DocumentProjectPhase } from "@/types";
import { isDocumentCategory, isDocumentProjectPhase } from "@/lib/documents/constants";
import { parseTagsInput } from "@/lib/documents/tags";

export interface ParsedDocumentUploadMetadata {
  category?: DocumentCategory;
  description?: string | null;
  tags?: string[];
  projectPhase?: DocumentProjectPhase;
  autoAnalyze?: boolean;
}

export function parseDocumentUploadMetadata(
  formData: FormData
): ParsedDocumentUploadMetadata {
  const categoryRaw = formData.get("category");
  const phaseRaw = formData.get("projectPhase");
  const tagsRaw = formData.get("tags");
  const descriptionRaw = formData.get("description");

  return {
    category:
      typeof categoryRaw === "string" && isDocumentCategory(categoryRaw)
        ? categoryRaw
        : undefined,
    description:
      typeof descriptionRaw === "string" && descriptionRaw.trim()
        ? descriptionRaw.trim()
        : null,
    tags:
      typeof tagsRaw === "string" || Array.isArray(tagsRaw)
        ? parseTagsInput(typeof tagsRaw === "string" ? tagsRaw : null)
        : undefined,
    projectPhase:
      typeof phaseRaw === "string" && isDocumentProjectPhase(phaseRaw)
        ? phaseRaw
        : undefined,
    autoAnalyze: formData.get("autoAnalyze") !== "false",
  };
}

export function parseDocumentMetadataBody(body: Record<string, unknown>) {
  const out: {
    category?: DocumentCategory;
    description?: string | null;
    tags?: string[];
    projectPhase?: DocumentProjectPhase;
  } = {};

  if (typeof body.category === "string" && isDocumentCategory(body.category)) {
    out.category = body.category;
  }
  if (body.description === null || typeof body.description === "string") {
    out.description = body.description;
  }
  if (typeof body.tags === "string" || Array.isArray(body.tags)) {
    out.tags = parseTagsInput(body.tags as string | string[]);
  }
  if (typeof body.projectPhase === "string" && isDocumentProjectPhase(body.projectPhase)) {
    out.projectPhase = body.projectPhase;
  }

  return out;
}
