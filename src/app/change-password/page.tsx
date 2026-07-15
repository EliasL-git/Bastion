"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/bastion/auth/me").then(async (res) => {
      if (!res.ok) { router.push("/login"); return; }
      const data = await res.json();
      if (data.passwordChanged) { router.push("/"); return; }
      setChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (newPassword.length < 4) { setError("New password must be at least 4 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    const res = await fetch("/api/bastion/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to change password"); return; }
    setSuccess(true);
    setTimeout(() => router.push("/"), 1500);
  };

  const handleLogout = async () => {
    await fetch("/api/bastion/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Shield className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <main className="flex w-full min-h-screen bg-background">
      <section className="w-full lg:w-1/2 flex flex-col justify-between p-8 z-10 border-r border-border bg-background">
        <div />

        <div className="w-full max-w-[400px] mx-auto space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto w-12 h-12 border border-border flex items-center justify-center rounded-md bg-card mb-2">
              <KeyRound className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Change Password</h1>
            <p className="text-sm text-muted-foreground">You must change the default password before continuing</p>
          </div>

          <Card>
            <CardContent className="p-6">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium">Password changed successfully!</p>
                  <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Password</Label>
                    <Input id="current" type="password" placeholder="Default: admin" value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input id="new-pw" type={showPw ? "text" : "password"} placeholder="At least 4 characters"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-9" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input id="confirm" type={showPw ? "text" : "password"} placeholder="Re-enter new password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                    {loading ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <button onClick={handleLogout} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3 w-3" /> Back to login
            </button>
          </div>
        </div>

        <footer className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <a className="hover:text-foreground transition-colors" href="#">Documentation</a>
          <a className="hover:text-foreground transition-colors" href="#">Support</a>
        </footer>
      </section>

      <section className="hidden lg:flex w-1/2 items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-24 w-24 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground/40 text-sm">Network-wide ad blocking</p>
        </div>
      </section>
    </main>
  );
}
