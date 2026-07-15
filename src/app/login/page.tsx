"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      if (res.ok) {
        const data = await res.json();
        router.push(data.passwordChanged ? "/" : "/change-password");
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bastion/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); setLoading(false); return; }
      router.push(data.passwordChanged ? "/" : "/change-password");
    } catch { setError("Connection error"); setLoading(false); }
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
              <Shield className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Bastion</h1>
            <p className="text-sm text-muted-foreground">Enter your admin credentials</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="username" type="text" placeholder="admin"
                      value={username} onChange={(e) => setUsername(e.target.value)} className="pl-9" autoFocus />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••••••"
                      value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || !username || !password}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
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
