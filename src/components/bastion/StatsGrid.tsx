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

export function StatsGrid({
  stats,
  settings,
}: {
  stats: Stats;
  settings: SettingsMap;
}) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Queries (24h)"
          value={formatNumber(stats.totalQueries24h)}
          sub={`${formatNumber(stats.queriesLastHour)}/hour`}
          icon={Activity}
          accent="text-blue-500"
        />
        <StatCard
          title="Blocked"
          value={formatNumber(stats.blocked24h)}
          sub={`${stats.blockPercent}% of traffic`}
          icon={Ban}
          accent="text-red-500"
        />
        <StatCard
          title="Allowed"
          value={formatNumber(stats.allowed24h)}
          sub={`Through ${settings.upstream_dns ?? "DNS"}`}
          icon={CheckCircle2}
          accent="text-emerald-500"
        />
        <StatCard
          title="Blocklists"
          value={`${stats.enabledLists}/${stats.totalLists}`}
          sub="Active lists"
          icon={Shield}
          accent="text-amber-500"
        />
      </div>

      {/* Block Percentage Bar */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Blocking Rate (24h)</span>
            <span className="text-sm font-bold tabular-nums">{stats.blockPercent}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(stats.blockPercent, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
