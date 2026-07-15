"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPasswordPage() {
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
      setError(data.error ?? "Request failed");
      return;
    }

    setMessage(data.message ?? "Check your email for reset instructions.");
    if (data.devResetUrl) {
      setDevLink(data.devResetUrl);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid-pattern bg-grid p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-xs text-muted-foreground">We&apos;ll send you a secure reset link</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-9" />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {message && <p className="text-xs text-muted-foreground">{message}</p>}
              {devLink && (
                <p className="text-[10px] rounded-md border bg-muted/40 p-2 break-all">
                  Dev reset link: <Link href={devLink} className="text-primary hover:underline">{devLink}</Link>
                </p>
              )}
              <Button type="submit" variant="copper" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
