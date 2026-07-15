"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Shield, ShieldOff, Activity, Ban, CheckCircle2,
  TrendingUp, Globe, Users, BarChart3,
} from "lucide-react";
import {
  StatCard, formatNumber, TopDomains, ClientInsights,
  QueryTypeChart, Stats,
} from "./components";

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topDomains, setTopDomains] = useState<{ blocked: { domain: string; count: number }[]; allowed: { domain: string; count: number }[] } | null>(null);
  const [range, setRange] = useState("24h");

  const fetchAll = useCallback(async () => {
    const [statsRes, topRes] = await Promise.all([
      fetch(`/api/bastion/stats?range=${range}`),
      fetch("/api/bastion/top-domains"),
    ]);
    setStats(await statsRes.json());
    setTopDomains(await topRes.json());
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="space-y-6">
      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard title="Total Queries" value={formatNumber(stats.totalQueries)} sub={`${formatNumber(stats.queriesLastHour)}/hour`} icon={Activity} />
            <StatCard title="Blocked" value={formatNumber(stats.blockedCount)} sub={`${stats.blockPercent}% of traffic`} icon={Ban} />
            <StatCard title="Allowed" value={formatNumber(stats.allowedCount)} sub={`${formatNumber(stats.uniqueClients)} unique clients`} icon={CheckCircle2} />
            <StatCard title="Blocklists" value={`${stats.enabledLists}/${stats.totalLists}`} sub="Active lists" icon={Shield} />
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">Blocking Rate ({range})</span>
                  <span className="text-sm font-bold tabular-nums">{stats.blockPercent}%</span>
                </div>
                <div className="flex rounded-md border border-border overflow-hidden text-xs">
                  {(["24h", "7d"] as const).map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        range === r ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground"
                      }`}>{r === "24h" ? "24 Hours" : "7 Days"}</button>
                  ))}
                </div>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(stats.blockPercent, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {stats && stats.chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              DNS Queries ({range === "7d" ? "Last 7 Days" : "Last 24 Hours"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillAllowed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="allowed" stroke="#3b82f6" fill="url(#fillAllowed)" strokeWidth={2} />
                  <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#fillBlocked)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" />Allowed</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="h-2.5 w-2.5 rounded-full bg-red-500" />Blocked</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><TopDomains data={topDomains} /></div>
        <div className="space-y-4">
          {stats && <ClientInsights clients={stats.topClients} />}
          {stats && <QueryTypeChart data={stats.queryTypeDistribution} />}
        </div>
      </div>
    </div>
  );
}
