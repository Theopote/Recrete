import type { IssuePriority, SiteIssue } from "@/types";
import { pickBilingual, type BilingualString } from "@/lib/i18n/bilingual";
import type { AppLocale } from "@/lib/i18n/locale";
import type { MepClashItem } from "@/lib/ai/agents/mep-agent";
import { addIssue } from "@/lib/db/repository";

const ISSUE_KEY_PREFIX = "[mep:";

export function mepClashIssueKey(clashId: string): string {
  return `${ISSUE_KEY_PREFIX}${clashId}]`;
}

function clashPriorityToIssuePriority(priority: MepClashItem["priority"]): IssuePriority {
  if (priority === "critical") return "urgent";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  return "low";
}

function buildIssueTitle(clash: MepClashItem, locale: AppLocale): string {
  return `${mepClashIssueKey(clash.id)} ${pickBilingual(locale, clash.title)}`;
}

function buildIssueDescription(clash: MepClashItem, locale: AppLocale): string {
  const primary = pickBilingual(locale, clash.description);
  const remediation = clash.remediation ? pickBilingual(locale, clash.remediation) : null;
  return remediation ? `${primary}\n\n→ ${remediation}` : primary;
}

export function isDuplicateMepClashIssue(existing: SiteIssue[], clashId: string): boolean {
  const key = mepClashIssueKey(clashId);
  return existing.some(
    (issue) =>
      issue.category === "mep_conflict" &&
      issue.status !== "closed" &&
      issue.status !== "resolved" &&
      issue.title.startsWith(key)
  );
}

export async function persistMepClashIssues(input: {
  projectId: string;
  clashes: MepClashItem[];
  existingIssues?: SiteIssue[];
  locale?: AppLocale;
}): Promise<{ created: SiteIssue[]; skipped: number }> {
  const { projectId, clashes, existingIssues = [], locale = "zh" } = input;
  const created: SiteIssue[] = [];
  let skipped = 0;

  for (const clash of clashes) {
    if (isDuplicateMepClashIssue(existingIssues, clash.id)) {
      skipped += 1;
      continue;
    }

    const issue = await addIssue(projectId, {
      title: buildIssueTitle(clash, locale),
      category: "mep_conflict",
      priority: clashPriorityToIssuePriority(clash.priority),
      location: pickBilingual(locale, clash.location),
      description: buildIssueDescription(clash, locale),
      photoUrl: null,
      assignedToId: null,
      aiDetected: true,
      relatedInsightId: null,
      dueDate: null,
    });

    created.push(issue);
    existingIssues.push(issue);
  }

  return { created, skipped };
}

export function formatClashSummary(
  clashes: MepClashItem[],
  locale: AppLocale
): BilingualString {
  const critical = clashes.filter((c) => c.priority === "critical" || c.priority === "high").length;
  if (clashes.length === 0) {
    return {
      en: "No rule-based pipeline clashes detected with current inputs.",
      zh: "根据当前输入，未检测到规则型管线冲突。",
    };
  }
  return {
    en: `${clashes.length} potential clash(es) detected${critical > 0 ? ` (${critical} high/critical)` : ""}.`,
    zh: `检测到 ${clashes.length} 处潜在管线冲突${critical > 0 ? `（${critical} 处高/严重）` : ""}。`,
  };
}
