"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { usePermissions } from "@/hooks/use-permissions";
import type { Project } from "@/types";
import type { ProjectLifecycleAuditEntry } from "@/types/project-lifecycle";
import { Archive, Loader2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ArchivedProjectsPanel() {
  const { t } = useLocale();
  const { can } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [audits, setAudits] = useState<ProjectLifecycleAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmCodes, setConfirmCodes] = useState<Record<string, string>>({});

  const canDelete = can("delete_project");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [projRes, auditRes] = await Promise.all([
          fetch("/api/projects?status=archived"),
          fetch("/api/organization/project-lifecycle-audit?limit=10"),
        ]);
        if (cancelled) return;
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(Array.isArray(data) ? data : []);
        }
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAudits(data.audits ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (project: Project) => {
    const code = confirmCodes[project.id]?.trim();
    if (code !== project.code) return;

    const ok = window.confirm(
      t(
        `Permanently delete "${project.name}" and all related data?`,
        `永久删除「${project.name}」及全部关联数据？`
      )
    );
    if (!ok) return;

    setDeletingId(project.id);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode: code }),
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Archive className="h-4 w-4" />
          {t("Archived Projects", "已归档项目")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <p className="text-muted-foreground leading-relaxed">
          {t(
            "Archived projects are hidden from the main project list. Permanent deletion requires admin or project manager role.",
            "已归档项目不会出现在主项目列表。永久删除需管理员或项目经理权限。"
          )}
        </p>

        {loading ? (
          <p className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("Loading…", "加载中…")}
          </p>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground">{t("No archived projects", "暂无已归档项目")}</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/projects/${project.id}?section=overview`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-muted-foreground font-mono">{project.code}</p>
                    <p className="text-muted-foreground">{project.location}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {formatDate(new Date(project.updatedAt))}
                  </span>
                </div>

                {canDelete && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-1 border-t">
                    <div className="flex-1">
                      <Label className="text-[10px]">
                        {t("Confirm code", "确认编号")}: {project.code}
                      </Label>
                      <Input
                        className="mt-1 h-8 text-xs font-mono"
                        value={confirmCodes[project.id] ?? ""}
                        onChange={(e) =>
                          setConfirmCodes((prev) => ({ ...prev, [project.id]: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={
                        deletingId === project.id ||
                        confirmCodes[project.id]?.trim() !== project.code
                      }
                      onClick={() => handleDelete(project)}
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {t("Delete", "删除")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {audits.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="font-medium">{t("Recent lifecycle actions", "最近生命周期操作")}</p>
            <ul className="space-y-1 text-muted-foreground">
              {audits.map((audit) => (
                <li key={audit.id}>
                  {formatDate(audit.createdAt)} · {audit.performedByName} · {audit.action} ·{" "}
                  {audit.projectName} ({audit.projectCode})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
