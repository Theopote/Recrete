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
import { DEMO_PASSWORD } from "@/lib/auth/demo-users";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-pattern bg-grid p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Recrete · 砼憶</h1>
          <p className="text-xs text-muted-foreground">
            AI Copilot for Existing Building Renovation
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            面向既有建筑更新的 AI 设计助手
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-[10px] text-primary hover:underline">
                    Forgot password?
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
                <p className="text-xs text-emerald-500">Account created. Please sign in.</p>
              )}
              {reset && (
                <p className="text-xs text-emerald-500">Password updated. Please sign in.</p>
              )}
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="text-primary hover:underline">Create one</Link>
            </p>

            <div className="mt-6 rounded-md bg-muted/50 p-3 text-[10px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Demo accounts</p>
              <p>lin.wei@recrete.io — Architect</p>
              <p>chen.hao@recrete.io — Engineer</p>
              <p>zhang.mei@recrete.io — Project Manager</p>
              <p>wang.fang@xian.gov.cn — Owner</p>
              <p>liu.ming@heritage.cn — Heritage Consultant</p>
              <p className="pt-1">Password: <code className="bg-muted px-1 rounded">{DEMO_PASSWORD}</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
