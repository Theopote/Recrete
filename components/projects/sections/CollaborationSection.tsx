"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";
import type {
  CollaborationReview,
  CollaborationSummary,
  ProjectStakeholder,
  StakeholderParty,
} from "@/types/collaboration";
import {
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Handshake,
} from "lucide-react";
import { RoleGate } from "@/components/auth/RoleGate";
import { useLocale } from "@/lib/i18n/use-locale";

const PARTY_LABELS: Record<StakeholderParty, string> = {
  owner: "Owner",
  design_team: "Design Team",
  structure_consultant: "Structure Consultant",
  mep_consultant: "MEP Consultant",
  heritage_authority: "Heritage Authority",
  contractor: "Contractor",
  government: "Government",
};

const PARTY_LABELS_ZH: Record<StakeholderParty, string> = {
  owner: "甲方",
  design_team: "设计团队",
  structure_consultant: "结构顾问",
  mep_consultant: "机电顾问",
  heritage_authority: "文保专家",
  contractor: "施工方",
  government: "政府部门",
};

const STATUS_CONFIG = {
  pending: { en: "Pending", zh: "待启动", color: "bg-muted text-muted-foreground", icon: Clock },
  in_review: { en: "In Review", zh: "评审中", color: "bg-blue-500/15 text-blue-400", icon: MessageSquare },
  negotiating: { en: "Negotiating", zh: "协商中", color: "bg-amber-500/15 text-amber-400", icon: Handshake },
  approved: { en: "Approved", zh: "已通过", color: "bg-emerald-500/15 text-emerald-400", icon: CheckCircle2 },
  rejected: { en: "Rejected", zh: "已驳回", color: "bg-red-500/15 text-red-400", icon: AlertCircle },
};

interface CollaborationSectionProps {
  project: ProjectWithRelations;
  initialSummary?: CollaborationSummary;
}

export function CollaborationSection({ project, initialSummary }: CollaborationSectionProps) {
  const { t } = useLocale();
  const [summary, setSummary] = useState<CollaborationSummary | null>(initialSummary ?? null);
  const [loading, setLoading] = useState(!initialSummary);
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/collaboration`);
      if (res.ok) {
        const data = await res.json();
        setSummary(parseSummary(data));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
    return <div className="text-sm text-muted-foreground">{t("Loading collaboration data...", "加载协同数据...")}</div>;
  }

  if (!summary) {
    return (
      <EmptyState
        icon={Users}
        title={t("No collaboration data", "暂无协同数据")}
        description={t("Unable to load stakeholder reviews.", "无法加载参与方评审数据。")}
        action={{ label: t("Retry", "重试"), onClick: loadSummary }}
      />
    );
  }

  const handleComment = async (reviewId: string) => {
    if (!commentText.trim()) return;
    const res = await fetch(
      `/api/projects/${project.id}/collaboration/reviews/${reviewId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          content: commentText,
          party: "design_team",
        }),
      }
    );
    if (res.ok) {
      setCommentText("");
      await loadSummary();
    }
  };

  const handleApprove = async (reviewId: string, party: StakeholderParty) => {
    const res = await fetch(
      `/api/projects/${project.id}/collaboration/reviews/${reviewId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", party, approved: true }),
      }
    );
    if (res.ok) await loadSummary();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Multi-Party Collaboration"
        titleZh="多方协同评审"
        description="Stakeholder identification, review workflows, and negotiation tracking across design, structure, heritage, and owner parties."
        descriptionZh="识别项目多方参与主体，跟踪方案/诊断/报告的协同评审与协商谈判流程。"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("Stakeholders", "参与方")} value={summary.stakeholders.length} />
        <StatCard label={t("Pending Review", "待评审")} value={summary.pendingCount} accent="text-amber-400" />
        <StatCard label={t("Negotiating", "协商中")} value={summary.negotiatingCount} accent="text-blue-400" />
        <StatCard label={t("Approved", "已通过")} value={summary.approvedCount} accent="text-emerald-400" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-copper" />
            {t("Project Stakeholders", "项目参与方")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.stakeholders.map((s) => (
              <StakeholderCard key={s.id} stakeholder={s} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">{t("Review Items", "评审事项")}</h3>
        {summary.reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={t("No reviews yet", "暂无评审事项")}
            description={t(
              "Reviews will appear when strategies or diagnosis items enter the approval workflow.",
              "当策略或诊断项进入审批流程后，评审事项将显示在此处。"
            )}
          />
        ) : (
          summary.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              expanded={activeReview === review.id}
              onToggle={() => setActiveReview(activeReview === review.id ? null : review.id)}
              commentText={activeReview === review.id ? commentText : ""}
              onCommentChange={setCommentText}
              onComment={() => handleComment(review.id)}
              onApprove={(party) => handleApprove(review.id, party)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums mt-1", accent)}>{value}</p>
    </div>
  );
}

function StakeholderCard({ stakeholder }: { stakeholder: ProjectStakeholder }) {
  const { t, label } = useLocale();
  return (
    <div className="rounded-md border p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{stakeholder.name}</span>
        {stakeholder.isLead && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-copper/15 text-copper">{t("Lead", "负责人")}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label(PARTY_LABELS, PARTY_LABELS_ZH, stakeholder.party)}</p>
      {stakeholder.organization && (
        <p className="text-[10px] text-muted-foreground/70">{stakeholder.organization}</p>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  expanded,
  onToggle,
  commentText,
  onCommentChange,
  onComment,
  onApprove,
}: {
  review: CollaborationReview;
  expanded: boolean;
  onToggle: () => void;
  commentText: string;
  onCommentChange: (v: string) => void;
  onComment: () => void;
  onApprove: (party: StakeholderParty) => void;
}) {
  const { t, label } = useLocale();
  const config = STATUS_CONFIG[review.status];
  const StatusIcon = config.icon;
  const approvedCount = review.approvals.filter((a) => a.approved).length;
  const totalRequired = review.requiredParties.length;

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{review.targetTitle}</CardTitle>
            <p className="text-[10px] text-muted-foreground capitalize">
              {review.targetType.replace(/_/g, " ")} · {approvedCount}/{totalRequired} {t("approvals", "项已通过")}
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium shrink-0", config.color)}>
            <StatusIcon className="h-3 w-3" />
            {t(config.en, config.zh)}
          </span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {review.approvals.map((a) => (
              <div key={a.party} className="flex items-center justify-between rounded border p-2 text-xs">
                <span>{label(PARTY_LABELS, PARTY_LABELS_ZH, a.party)}</span>
                <div className="flex items-center gap-2">
                  {a.approved ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {a.approvedBy}
                    </span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">{t("Pending", "待审批")}</span>
                      <RoleGate anyOf={["approve_strategy", "manage_collaboration"]}>
                        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => onApprove(a.party)}>
                          {t("Approve", "通过")}
                        </Button>
                      </RoleGate>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {review.negotiationPoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-amber-400">{t("Negotiation Points", "协商要点")}</h4>
              {review.negotiationPoints.map((np) => (
                <div key={np.id} className="rounded border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-xs font-medium">{np.topic}</p>
                  {np.positions.map((pos, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground">
                      <span className="text-foreground">{label(PARTY_LABELS, PARTY_LABELS_ZH, pos.party)}:</span> {pos.stance}
                      <span className="ml-2 opacity-60">({pos.priority.replace(/_/g, " ")})</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {review.comments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium">{t("Comments", "评论")}</h4>
              {review.comments.map((c) => (
                <div key={c.id} className="rounded border p-2 space-y-0.5">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{c.authorName}</span>
                    <span>· {label(PARTY_LABELS, PARTY_LABELS_ZH, c.party)}</span>
                  </div>
                  <p className="text-xs">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={t("Add a review comment...", "添加评审评论...")}
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs"
            />
            <Button size="sm" onClick={onComment}>{t("Comment", "评论")}</Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function parseSummary(data: CollaborationSummary): CollaborationSummary {
  return {
    ...data,
    stakeholders: data.stakeholders.map((s) => ({
      ...s,
      joinedAt: new Date(s.joinedAt),
    })),
    reviews: data.reviews.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      dueDate: r.dueDate ? new Date(r.dueDate) : null,
      comments: r.comments.map((c) => ({ ...c, createdAt: new Date(c.createdAt) })),
      negotiationPoints: r.negotiationPoints.map((n) => ({
        ...n,
        updatedAt: new Date(n.updatedAt),
      })),
      approvals: r.approvals.map((a) => ({
        ...a,
        approvedAt: a.approvedAt ? new Date(a.approvedAt) : null,
      })),
    })),
  };
}
