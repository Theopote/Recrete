"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { usePermissions } from "@/hooks/use-permissions";
import type { ProjectWithRelations } from "@/types";
import type { ProjectDeletionSummary } from "@/types/project-lifecycle";
import { Archive, Loader2, Trash2 } from "lucide-react";

interface ProjectLifecyclePanelProps {
  project: ProjectWithRelations;
}

export function ProjectLifecyclePanel({ project }: ProjectLifecyclePanelProps) {
  const { t } = useLocale();
  const { can } = usePermissions();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [summary, setSummary] = useState<ProjectDeletionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isArchived = project.status === "archived";
  const isDeletableStatus = isArchived || project.status === "completed";
  const canArchive = can("archive_project") && !isArchived && project.status !== "completed";
  const canDelete = can("delete_project") && isDeletableStatus;

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/deletion-summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary ?? null);
      }
    } finally {
      setLoadingSummary(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (isDeletableStatus && canDelete) {
      void loadSummary();
    }
  }, [isDeletableStatus, canDelete, loadSummary]);

  if (!canArchive && !canDelete && !isArchived) return null;

  const handleArchive = async () => {
    const ok = window.confirm(
      t(
        `Archive project "${project.name}"? It will be hidden from active lists but all data is kept.`,
        `归档项目「${project.name}」？将从活跃列表隐藏，但所有数据保留。`
      )
    );
    if (!ok) return;

    setArchiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("Archive failed", "归档失败"));
        return;
      }
      router.refresh();
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmCode.trim() !== project.code) {
      setError(t("Project code does not match", "项目编号不匹配"));
      return;
    }

    const ok = window.confirm(
      t(
        "This permanently deletes the project and ALL related data. This cannot be undone.",
        "将永久删除项目及全部关联数据，且无法恢复。"
      )
    );
    if (!ok) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode: confirmCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("Delete failed", "删除失败"));
        return;
      }
      router.push("/projects");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Archive className="h-4 w-4" />
          {t("Project Lifecycle", "项目生命周期")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("Status", "状态")}:</span>
          <Badge variant="outline">{project.status}</Badge>
          {isArchived && (
            <span className="text-muted-foreground">
              {t("Hidden from active project lists", "已从活跃项目列表隐藏")}
            </span>
          )}
        </div>

        {error && <p className="text-destructive">{error}</p>}

        {canArchive && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <p className="font-medium">{t("Archive project", "归档项目")}</p>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                "Use when the project is completed or terminated. Data remains accessible from archived lists.",
                "适用于项目竣工或终止。数据仍可在归档列表中查阅。"
              )}
            </p>
            <div>
              <Label className="text-[10px]">{t("Reason (optional)", "原因（可选）")}</Label>
              <Input
                className="mt-1 h-8 text-xs"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("e.g. Client terminated contract", "如：甲方终止合同")}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleArchive} disabled={archiving}>
              {archiving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t("Archive Project", "归档项目")}
            </Button>
          </div>
        )}

        {canDelete && (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="font-medium text-destructive flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              {t("Permanent delete", "永久删除")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                "Only for archived projects. Removes all documents, BIM, diagnosis, strategies, and reports.",
                "仅适用于已归档项目。将删除全部文档、BIM、诊断、方案与报告。"
              )}
            </p>

            {loadingSummary ? (
              <p className="text-muted-foreground">{t("Loading summary…", "加载摘要…")}</p>
            ) : summary ? (
              <ul className="text-muted-foreground space-y-0.5">
                <li>
                  {t("Documents", "文档")}: {summary.documentCount}
                </li>
                <li>
                  {t("Diagnosis items", "诊断项")}: {summary.diagnosisCount}
                </li>
                <li>
                  {t("Strategies", "方案")}: {summary.strategyCount}
                </li>
                <li>
                  {t("Reports", "报告")}: {summary.reportCount}
                </li>
                <li>
                  {t("BIM models", "BIM 模型")}: {summary.bimModelCount}
                </li>
              </ul>
            ) : null}

            {!summary?.canPermanentDelete && summary?.deleteBlockReason && (
              <p className="text-destructive">{summary.deleteBlockReason}</p>
            )}

            <div>
              <Label className="text-[10px]">
                {t(`Type project code "${project.code}" to confirm`, `输入项目编号「${project.code}」以确认`)}
              </Label>
              <Input
                className="mt-1 h-8 text-xs font-mono"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={project.code}
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || confirmCode.trim() !== project.code}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t("Delete Permanently", "永久删除")}
            </Button>
          </div>
        )}

        {isArchived && !canDelete && (
          <p className="text-muted-foreground">
            {t(
              "Contact an admin or project manager to permanently delete this project.",
              "如需永久删除，请联系管理员或项目经理。"
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
