"use client";

import {
  TrendingUp, Clock, ShieldOff, Eye, Settings,
  Shield, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Stats, ResolverStatus } from "./types";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "queries", label: "Query Log", icon: Clock },
  { id: "blocklists", label: "Blocklists", icon: ShieldOff },
  { id: "allowlist", label: "Allowlist", icon: Eye },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({
  activeTab,
  onTabChange,
  onRefresh,
  stats,
  resolver,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  stats: Stats | null;
  resolver: ResolverStatus | null;
}) {
  return (
    <aside className="w-56 shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Logo / Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/50">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">Bastion</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV_ITEMS.map((item) => (
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
