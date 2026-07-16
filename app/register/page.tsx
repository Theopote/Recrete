"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { useLocale } from "@/lib/i18n/use-locale";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("Registration failed", "注册失败"));
      return;
    }

    router.push("/login?registered=1");
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
              {t("Create Account", "创建账号")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("Join Recrete · 砼憶", "加入 Recrete · 砼憶")}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("Name", "姓名")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
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
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("Password", "密码")}</Label>
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
                  {loading ? t("Creating account...", "创建中…") : t("Create Account", "创建账号")}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("Already have an account?", "已有账号？")}{" "}
                <Link href="/login" className="text-primary hover:underline">
                  {t("Sign in", "登录")}
                </Link>
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground text-center">
                {t(
                  "New accounts receive the viewer role by default. Contact your PM for elevated access.",
                  "新账号默认为 viewer 角色，如需更高权限请联系项目经理。"
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageShell>
  );
}
