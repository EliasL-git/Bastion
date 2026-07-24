"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/bastion/auth/me").then(async (res) => {
      if (res.ok) { const data = await res.json(); router.push(data.passwordChanged ? "/" : "/change-password"); }
      else setChecking(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bastion/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); setLoading(false); return; }
      router.push(data.passwordChanged ? "/" : "/change-password");
    } catch { setError("Connection error"); setLoading(false); }
  };

  if (checking) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-glow"><Shield className="h-6 w-6 animate-pulse text-primary" /></div>
    </div>
  );

  return (
    <main className="flex min-h-screen w-full bg-background">
      <section className="z-10 flex w-full flex-col justify-between border-r border-border/60 bg-background p-8 lg:w-1/2">
        <div />
        <div className="mx-auto w-full max-w-[400px] space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-glow"><Shield className="h-7 w-7 text-primary-foreground" /></div>
            <h1 className="text-2xl font-bold tracking-tight">Bastion</h1>
            <p className="text-sm text-muted-foreground">Enter your admin credentials</p>
          </div>
          <Card className="border-border/60 bg-card/60">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="username">Username</Label>
                  <div className="relative"><User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="username" type="text" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} className="border-border/60 bg-secondary/50 pl-9" autoFocus /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="password">Password</Label>
                  <div className="relative"><Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="border-border/60 bg-secondary/50 pl-9 pr-9" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                </div>
                {error && <div className="flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</div>}
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading || !username || !password}>{loading ? "Signing in..." : "Sign in"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <footer className="flex justify-center space-x-4 text-sm text-muted-foreground">
          <a className="transition-colors hover:text-foreground" href="#">Documentation</a>
          <a className="transition-colors hover:text-foreground" href="#">Support</a>
        </footer>
      </section>
      <section className="hidden flex-col items-center justify-center bg-grid lg:flex lg:w-1/2">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-border/60 bg-card/60"><Shield className="h-12 w-12 text-primary" /></div>
          <h2 className="text-xl font-semibold">Network-wide ad blocking</h2>
          <p className="mt-2 text-sm text-muted-foreground">Real-time DNS filtering, query logging, and blocklist management.</p>
        </div>
      </section>
    </main>
  );
}
