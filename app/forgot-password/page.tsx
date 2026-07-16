"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { useLocale } from "@/lib/i18n/use-locale";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevLink("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t("Request failed", "请求失败"));
      return;
    }

    setMessage(
      data.message ??
        t("Check your email for reset instructions.", "请查收邮件中的重置说明。")
    );
    if (data.devResetUrl) {
      setDevLink(data.devResetUrl);
    }
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
              {t("Reset Password", "重置密码")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("We'll send you a secure reset link", "我们将发送安全重置链接到您的邮箱")}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("Email", "邮箱")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                {message && <p className="text-xs text-muted-foreground">{message}</p>}
                {devLink && (
                  <p className="text-[10px] rounded-md border bg-muted/40 p-2 break-all">
                    {t("Dev reset link", "开发环境重置链接")}:{" "}
                    <Link href={devLink} className="text-primary hover:underline">
                      {devLink}
                    </Link>
                  </p>
                )}
                <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                  {loading ? t("Sending...", "发送中…") : t("Send Reset Link", "发送重置链接")}
                </Button>
              </form>
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
