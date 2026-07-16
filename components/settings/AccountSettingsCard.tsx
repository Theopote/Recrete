"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";
import type { ProjectAction } from "@/lib/auth/permissions";
import { useLocale } from "@/lib/i18n/use-locale";

const ROLE_LABELS: Record<UserRole, { en: string; zh: string }> = {
  admin: { en: "Administrator", zh: "管理员" },
  architect: { en: "Architect", zh: "建筑师" },
  engineer: { en: "Engineer", zh: "工程师" },
  consultant: { en: "Consultant", zh: "顾问" },
  project_manager: { en: "Project Manager", zh: "项目经理" },
  owner: { en: "Owner", zh: "甲方" },
  viewer: { en: "Viewer", zh: "只读" },
};

export function AccountSettingsCard() {
  const { t } = useLocale();
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<ProjectAction[]>([]);
  const [role, setRole] = useState<UserRole>("viewer");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setRole(data.role as UserRole);
        setPermissions(data.permissions as ProjectAction[]);
      })
      .catch(() => undefined);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t("Password change failed", "密码修改失败"));
      return;
    }

    setMessage(t("Password updated successfully", "密码已更新"));
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const roleLabel = ROLE_LABELS[role]
    ? t(ROLE_LABELS[role].en, ROLE_LABELS[role].zh)
    : role;

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div>
          <h3 className="text-sm font-medium">{t("Account", "账户")}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {session?.user?.name} · {session?.user?.email}
          </p>
          <Badge variant="outline" className="mt-2 capitalize">
            {roleLabel}
          </Badge>
        </div>

        {permissions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("Role permissions", "角色权限")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {permissions.map((action) => (
                <Badge key={action} variant="outline" className="text-[10px] font-normal">
                  {action.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium">{t("Change password", "修改密码")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">{t("Current password", "当前密码")}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">{t("New password", "新密码")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword">{t("Confirm new password", "确认新密码")}</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="h-9"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-emerald-500">{message}</p>}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? t("Saving...", "保存中...") : t("Update Password", "更新密码")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
