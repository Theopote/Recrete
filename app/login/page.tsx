"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { DEMO_PASSWORD } from "@/lib/auth/demo-users";
import { useLocale } from "@/lib/i18n/use-locale";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");
  const [email, setEmail] = useState("lin.wei@recrete.io");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(t("Invalid email or password", "邮箱或密码不正确"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <AuthPageShell>
      <div className="min-h-screen flex items-center justify-center bg-grid-pattern bg-grid p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Recrete · 砼憶</h1>
            <p className="text-xs text-muted-foreground">
              {t("AI Copilot for Existing Building Renovation", "面向既有建筑更新的 AI 设计助手")}
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("Password", "密码")}</Label>
                    <Link href="/forgot-password" className="text-[10px] text-primary hover:underline">
                      {t("Forgot password?", "忘记密码？")}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
                {registered && (
                  <p className="text-xs text-emerald-500">
                    {t("Account created. Please sign in.", "账号已创建，请登录。")}
                  </p>
                )}
                {reset && (
                  <p className="text-xs text-emerald-500">
                    {t("Password updated. Please sign in.", "密码已更新，请登录。")}
                  </p>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                  {loading ? t("Signing in...", "登录中…") : t("Sign In", "登录")}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("No account?", "还没有账号？")}{" "}
                <Link href="/register" className="text-primary hover:underline">
                  {t("Create one", "立即注册")}
                </Link>
              </p>

              <div className="mt-6 rounded-md bg-muted/50 p-3 text-[10px] text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{t("Demo accounts", "演示账号")}</p>
                <p>lin.wei@recrete.io — {t("Architect", "建筑师")}</p>
                <p>chen.hao@recrete.io — {t("Engineer", "工程师")}</p>
                <p>zhang.mei@recrete.io — {t("Project Manager", "项目经理")}</p>
                <p>wang.fang@xian.gov.cn — {t("Owner", "业主")}</p>
                <p>liu.ming@heritage.cn — {t("Heritage Consultant", "文保顾问")}</p>
                <p className="pt-1">
                  {t("Password", "密码")}:{" "}
                  <code className="bg-muted px-1 rounded">{DEMO_PASSWORD}</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageShell>
  );
}

function LoginFallback() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex items-center justify-center">
      {t("Loading...", "加载中…")}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
