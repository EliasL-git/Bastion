"use client";

import { TrendingUp, Clock, ShieldOff, Eye, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Stats, ResolverStatus, SettingsMap } from "./types";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "queries", label: "Query Log", icon: Clock },
  { id: "blocklists", label: "Blocklists", icon: ShieldOff },
  { id: "allowlist", label: "Allowlist", icon: Eye },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ activeTab, onTabChange, onRefresh, stats, resolver, settings }: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  stats: Stats | null;
  resolver: ResolverStatus | null;
  settings: SettingsMap;
}) {
  const compQueryLog = settings.comp_query_log !== "false";
  const compBlocklists = settings.comp_blocklists !== "false";
  const compAllowlist = settings.comp_allowlist !== "false";

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.id === "queries") return compQueryLog;
    if (item.id === "blocklists") return compBlocklists;
    if (item.id === "allowlist") return compAllowlist;
    return true;
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border/60 bg-card/50">
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              activeTab === item.id ? "bg-primary/10 text-primary shadow-glow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="space-y-3 border-t border-border/60 p-3">
        <Button variant="outline" size="sm" className="w-full gap-2 border-border/60 bg-secondary/50 text-xs hover:bg-secondary hover:text-foreground" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </Button>

        {stats && (
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span>Blocked</span>
              <span className="font-semibold tabular-nums text-rose-400">{stats.blockedCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Queries</span>
              <span className="font-semibold tabular-nums text-foreground">{stats.totalQueries.toLocaleString()}</span>
            </div>
          </div>
        )}

        {resolver && (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
            <span className={cn("h-2 w-2 rounded-full", resolver.running ? "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" : "bg-rose-500")} />
            <span className="truncate text-[11px] text-muted-foreground">{resolver.running ? `${resolver.status} :${resolver.port}` : "Resolver Down"}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
