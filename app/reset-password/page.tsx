"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { useLocale } from "@/lib/i18n/use-locale";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t("Missing reset token", "缺少重置令牌"));
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("Reset failed", "重置失败"));
      return;
    }

    router.push("/login?reset=1");
  };

  return (
    <AuthPageShell>
      <div className="min-h-screen flex items-center justify-center bg-grid-pattern bg-grid p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t("Set New Password", "设置新密码")}
            </h1>
          </div>

          <Card>
            <CardContent className="p-6">
              {!token ? (
                <p className="text-xs text-destructive">
                  {t(
                    "Invalid reset link. Request a new one from the forgot password page.",
                    "重置链接无效，请从忘记密码页面重新申请。"
                  )}
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{t("New Password", "新密码")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">{t("Confirm Password", "确认密码")}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-9"
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                    {loading ? t("Updating...", "更新中…") : t("Update Password", "更新密码")}
                  </Button>
                </form>
              )}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  {t("Back to sign in", "返回登录")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageShell>
  );
}

function ResetPasswordFallback() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex items-center justify-center">
      {t("Loading...", "加载中…")}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
