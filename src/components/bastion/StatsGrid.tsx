"use client";

import { Activity, Ban, CheckCircle2, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "./StatCard";
import type { Stats, SettingsMap } from "./types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function StatsGrid({ stats, settings }: { stats: Stats; settings: SettingsMap }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Total Queries (24h)" value={formatNumber(stats.totalQueries)} sub={`${formatNumber(stats.queriesLastHour)}/hour`} icon={Activity} accent="text-info" />
        <StatCard title="Blocked" value={formatNumber(stats.blockedCount)} sub={`${stats.blockPercent}% of traffic`} icon={Ban} accent="text-rose-400" />
        <StatCard title="Allowed" value={formatNumber(stats.allowedCount)} sub={`Via ${settings.upstream_dns ?? "DNS"}`} icon={CheckCircle2} accent="text-emerald-400" />
        <StatCard title="Blocklists" value={`${stats.enabledLists}/${stats.totalLists}`} sub="Active lists" icon={Shield} accent="text-warning" />
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Blocking Rate (24h)</span>
            <span className="text-sm font-bold tabular-nums text-rose-400">{stats.blockPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 transition-all duration-1000" style={{ width: `${Math.min(stats.blockPercent, 100)}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
