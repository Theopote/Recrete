import type { DocumentAsset, DocumentProjectPhase } from "@/types";
import { parseTagsFromStorage, serializeTagsForStorage } from "@/lib/documents/tags";

export type DocumentMetadataUpdate = Partial<
  Pick<DocumentAsset, "category" | "description" | "projectPhase">
> & {
  tags?: string[];
};

export type AddDocumentInput = Omit<
  DocumentAsset,
  "id" | "projectId" | "createdAt" | "updatedAt"
> & {
  versionGroupId?: string;
  versionNumber?: number;
  isCurrentVersion?: boolean;
};

/** Backfill governance fields for legacy records. */
export function normalizeDocumentAsset(doc: DocumentAsset): DocumentAsset {
  const tags =
    doc.tags ??
    (typeof (doc as DocumentAsset & { tags?: unknown }).tags === "undefined"
      ? []
      : parseTagsFromStorage(
          typeof doc.tags === "string" ? doc.tags : undefined
        ));

  return {
    ...doc,
    tags,
    projectPhase: doc.projectPhase ?? "general",
    versionGroupId: doc.versionGroupId ?? doc.id,
    versionNumber: doc.versionNumber ?? 1,
    isCurrentVersion: doc.isCurrentVersion ?? true,
  };
}

export function isCurrentProjectDocument(doc: DocumentAsset): boolean {
  return normalizeDocumentAsset(doc).isCurrentVersion !== false;
}

export function applyNewDocumentDefaults(
  input: Omit<AddDocumentInput, "versionGroupId" | "versionNumber" | "isCurrentVersion">,
  options: { id: string; versionGroupId?: string; versionNumber?: number; isCurrentVersion?: boolean }
): Omit<DocumentAsset, "projectId" | "createdAt" | "updatedAt"> {
  const versionGroupId = options.versionGroupId ?? options.id;

  return {
    ...input,
    id: options.id,
    tags: input.tags ?? [],
    projectPhase: input.projectPhase ?? "general",
    versionGroupId,
    versionNumber: options.versionNumber ?? 1,
    isCurrentVersion: options.isCurrentVersion ?? true,
  };
}

export function documentVersionLabel(doc: DocumentAsset, locale: "en" | "zh" = "en"): string {
  const normalized = normalizeDocumentAsset(doc);
  const n = normalized.versionNumber ?? 1;
  return locale === "zh" ? `v${n}` : `v${n}`;
}

export function nextDocumentVersionNumber(versions: DocumentAsset[]): number {
  if (versions.length === 0) return 1;
  return Math.max(...versions.map((v) => normalizeDocumentAsset(v).versionNumber ?? 1)) + 1;
}

export function serializeDocumentForPrisma(doc: Partial<DocumentAsset>) {
  return {
    ...doc,
    tags:
      doc.tags !== undefined
        ? serializeTagsForStorage(doc.tags)
        : undefined,
  };
}

export function defaultPhaseForProjectStatus(
  status: import("@/types").ProjectStatus
): DocumentProjectPhase {
  switch (status) {
    case "survey":
      return "survey";
    case "diagnosis":
      return "diagnosis";
    case "strategy":
      return "strategy";
    case "design":
      return "design";
    case "construction":
      return "construction";
    default:
      return "general";
  }
}
