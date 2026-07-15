"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield, Activity, Clock, Ban, Eye, Settings,
  TrendingUp, Radio, LogOut, RefreshCw, Menu, X,
} from "lucide-react";
import { ResolverStatus } from "./components";

const navItems = [
  { href: "/", label: "Overview", icon: TrendingUp },
  { href: "/queries", label: "Query Log", icon: Clock },
  { href: "/blocklists", label: "Blocklists", icon: Ban },
  { href: "/allowlist", label: "Allowlist", icon: Eye },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [resolver, setResolver] = useState<ResolverStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blockingEnabled, setBlockingEnabled] = useState(false);

  const fetchResolver = useCallback(async () => {
    try { const r = await fetch("/api/bastion/resolver"); const d = await r.json(); setResolver(d); } catch { setResolver(null); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const authRes = await fetch("/api/bastion/auth/me");
      if (!authRes.ok) { router.push("/login"); return; }
      const authData = await authRes.json();
      if (!authData.passwordChanged) { router.push("/change-password"); return; }
      if (mounted) setAuthenticated(true);
      if (mounted) {
        await fetchResolver();
        try { const s = await fetch("/api/bastion/settings").then(r => r.json()); setBlockingEnabled(s.blocking_enabled === "true"); } catch {}
      }
    };
    init();
    const interval = setInterval(() => { if (mounted) fetchResolver(); }, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [fetchResolver, router]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="h-8 w-8 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading Bastion...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-56 border-r border-border/50 bg-card/95 backdrop-blur-md flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
          <div className="h-14 flex items-center gap-2 px-4 border-b border-border/50 shrink-0">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">Bastion</span>
            <Badge variant="outline" className="text-[10px] ml-auto">DNS</Badge>
          </div>

          <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border/50 space-y-2">
            {resolver && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Radio className={`h-3 w-3 ${resolver.running ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                <span className={resolver.running ? "text-emerald-600" : ""}>
                  DNS :{resolver.port} {resolver.running ? "Active" : "Stopped"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <div className={`h-2 w-2 rounded-full ${blockingEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
              <span>{blockingEnabled ? "Protected" : "Disabled"}</span>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground"
              onClick={async () => { await fetch("/api/bastion/auth/logout", { method: "POST" }); router.push("/login"); }}>
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 gap-3">
            <button className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-muted/50" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 ml-auto">
              {resolver && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Radio className={`h-3.5 w-3.5 ${resolver.running ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                      <span className={`text-[10px] font-medium hidden sm:inline ${resolver.running ? "text-emerald-600" : "text-muted-foreground"}`}>
                        DNS :{resolver.port} {resolver.running ? "Active" : "Stopped"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{resolver.running ? `Resolver running (PID ${resolver.pid})` : "DNS resolver is not running"}</TooltipContent>
                </Tooltip>
              )}
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${blockingEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="text-[10px] text-muted-foreground hidden sm:inline">{blockingEnabled ? "Protected" : "Disabled"}</span>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>

          <footer className="border-t border-border/50 bg-card/30 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />Bastion DNS Sinkhole</span>
              <span>Network-wide ad blocking</span>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
