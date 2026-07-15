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

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  architect: "Architect",
  engineer: "Engineer",
  consultant: "Consultant",
  project_manager: "Project Manager",
  owner: "Owner / 甲方",
  viewer: "Viewer",
};

export function AccountSettingsCard() {
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
      setError(data.error ?? "Password change failed");
      return;
    }

    setMessage("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div>
          <h3 className="text-sm font-medium">Account</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {session?.user?.name} · {session?.user?.email}
          </p>
          <Badge variant="outline" className="mt-2 capitalize">
            {ROLE_LABELS[role] ?? role}
          </Badge>
        </div>

        {permissions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Role permissions</p>
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
          <p className="text-xs font-medium">Change password</p>
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input id="confirmNewPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="h-9" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {message && <p className="text-xs text-emerald-500">{message}</p>}
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
