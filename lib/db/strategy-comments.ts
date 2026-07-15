import "server-only";

import { shouldUseDatabase } from "@/lib/db/resolve";
import { prisma } from "@/lib/db/prisma";
import { generateId } from "@/lib/mock-data";

export interface StrategyReviewComment {
  id: string;
  projectId: string;
  strategyId: string;
  authorId: string;
  authorName: string;
  content: string;
  riskTag?: string | null;
  mentionedUserIds: string[];
  createdAt: Date;
}

const memoryComments: StrategyReviewComment[] = [];

type PrismaWithStrategyComments = typeof prisma & {
  strategyReviewComment: {
    findMany: (args: {
      where: { projectId: string; strategyId: string };
      orderBy: { createdAt: "asc" };
    }) => Promise<
      Array<{
        id: string;
        projectId: string;
        strategyId: string;
        authorId: string;
        authorName: string;
        content: string;
        riskTag: string | null;
        mentionedUserIds: string[];
        createdAt: Date;
      }>
    >;
    create: (args: {
      data: {
        projectId: string;
        strategyId: string;
        authorId: string;
        authorName: string;
        content: string;
        riskTag: string | null;
        mentionedUserIds: string[];
      };
    }) => Promise<{
      id: string;
      projectId: string;
      strategyId: string;
      authorId: string;
      authorName: string;
      content: string;
      riskTag: string | null;
      mentionedUserIds: string[];
      createdAt: Date;
    }>;
  };
};

const dbComments = prisma as PrismaWithStrategyComments;

export async function listStrategyComments(
  projectId: string,
  strategyId: string
): Promise<StrategyReviewComment[]> {
  if (await shouldUseDatabase()) {
    const rows = await dbComments.strategyReviewComment.findMany({
      where: { projectId, strategyId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapRow);
  }

  return memoryComments
    .filter((c) => c.projectId === projectId && c.strategyId === strategyId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function addStrategyComment(input: {
  projectId: string;
  strategyId: string;
  authorId: string;
  authorName: string;
  content: string;
  riskTag?: string | null;
  mentionedUserIds?: string[];
}): Promise<StrategyReviewComment> {
  if (await shouldUseDatabase()) {
    const row = await dbComments.strategyReviewComment.create({
      data: {
        projectId: input.projectId,
        strategyId: input.strategyId,
        authorId: input.authorId,
        authorName: input.authorName,
        content: input.content,
        riskTag: input.riskTag ?? null,
        mentionedUserIds: input.mentionedUserIds ?? [],
      },
    });
    return mapRow(row);
  }

  const comment: StrategyReviewComment = {
    id: generateId("scomment"),
    projectId: input.projectId,
    strategyId: input.strategyId,
    authorId: input.authorId,
    authorName: input.authorName,
    content: input.content,
    riskTag: input.riskTag ?? null,
    mentionedUserIds: input.mentionedUserIds ?? [],
    createdAt: new Date(),
  };
  memoryComments.push(comment);
  return comment;
}

export function clearStrategyCommentsMemory(): void {
  memoryComments.length = 0;
}

function mapRow(row: {
  id: string;
  projectId: string;
  strategyId: string;
  authorId: string;
  authorName: string;
  content: string;
  riskTag: string | null;
  mentionedUserIds: string[];
  createdAt: Date;
}): StrategyReviewComment {
  return {
    id: row.id,
    projectId: row.projectId,
    strategyId: row.strategyId,
    authorId: row.authorId,
    authorName: row.authorName,
    content: row.content,
    riskTag: row.riskTag,
    mentionedUserIds: row.mentionedUserIds,
    createdAt: row.createdAt,
  };
}
