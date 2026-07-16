"use client";

import {
  TrendingUp, Clock, ShieldOff, Eye, Settings,
  Shield, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Stats, ResolverStatus, SettingsMap } from "./types";

export function Sidebar({
  activeTab,
  onTabChange,
  onRefresh,
  stats,
  resolver,
  settings,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  stats: Stats | null;
  resolver: ResolverStatus | null;
  settings: SettingsMap;
}) {
  // Component visibility (default on if not set)
  const compQueryLog   = settings.comp_query_log !== "false";
  const compBlocklists = settings.comp_blocklists !== "false";
  const compAllowlist  = settings.comp_allowlist !== "false";

  const NAV_ITEMS = [
    { id: "overview",   label: "Overview",   icon: TrendingUp },
    { id: "queries",    label: "Query Log",  icon: Clock,     hidden: !compQueryLog },
    { id: "blocklists", label: "Blocklists", icon: ShieldOff, hidden: !compBlocklists },
    { id: "allowlist",  label: "Allowlist",  icon: Eye,       hidden: !compAllowlist },
    { id: "settings",   label: "Settings",   icon: Settings },
  ] as const;

  return (
    <aside className="w-56 shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Logo / Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/50">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Bastion</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV_ITEMS
          .filter((item) => !("hidden" in item && item.hidden))
          .map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                activeTab === item.id
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
      </nav>

      {/* Bottom area: refresh + resolver status */}
      <div className="px-3 py-3 border-t border-border/50 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs h-8"
          onClick={onRefresh}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>

        {resolver && (
          <div className="flex items-center gap-1.5 px-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                resolver.running ? "bg-emerald-500" : "bg-red-500"
              )}
            />
            <span className="text-[11px] text-muted-foreground truncate">
              {resolver.running ? `${resolver.status} :${resolver.port}` : "Resolver Down"}
            </span>
          </div>
        )}

        {stats && (
          <div className="text-[11px] text-muted-foreground px-2 leading-relaxed">
            <div className="flex justify-between">
              <span>Blocked</span>
              <span className="font-medium tabular-nums">{stats.blockedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Queries</span>
              <span className="font-medium tabular-nums">{stats.totalQueries}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
