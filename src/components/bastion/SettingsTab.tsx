"use client";

import { useState, useEffect } from "react";
import {
  Shield, Server, Radio, Zap, Sliders,
  Box, FileKey,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ComponentsTab } from "./ComponentsTab";
import { BlockPageTab } from "./BlockPageTab";
import type { ResolverStatus, SettingsMap } from "./types";

type SubTab = "general" | "components" | "block-page";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "general",    label: "General",    icon: Sliders },
  { id: "components", label: "Components", icon: Box },
  { id: "block-page", label: "Block Page", icon: FileKey },
];

export function SettingsTab({
  settings,
  onToggle,
  resolver,
  updateSetting,
}: {
  settings: SettingsMap;
  onToggle: (key: string, value: boolean) => void;
  resolver: ResolverStatus | null;
  updateSetting: (key: string, value: string) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("general");

  const blockingEnabled = settings.blocking_enabled === "true";
  const queryLogging = settings.query_logging === "true";
  const upstreamDns = settings.upstream_dns ?? "1.1.1.1";

  // ── Component visibility checks (default on) ──
  const compQueryLog   = settings.comp_query_log !== "false";
  const compBlockPage  = settings.comp_block_page !== "false";

  // ── Only show tabs whose components are enabled ──
  const visibleTabs = SUB_TABS.filter((tab) => {
    if (tab.id === "block-page") return compBlockPage;
    return true; // general and components are always visible
  });

  // ── If the current tab was hidden (component toggled off), redirect to general ──
  const currentTabVisible = visibleTabs.some((t) => t.id === subTab);
  useEffect(() => {
    if (!currentTabVisible) {
      setSubTab("general");
    }
  }, [currentTabVisible]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Sub-tab navigation ── */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              subTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {subTab === "general" && (
        <div className="space-y-6">
          {/* DNS Blocking */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                DNS Blocking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Blocking</p>
                  <p className="text-xs text-muted-foreground">
                    Block queries matching blocklist domains
                  </p>
                </div>
                <Switch
                  checked={blockingEnabled}
                  onCheckedChange={(v) => onToggle("blocking_enabled", v)}
                />
              </div>

              {/* Only show Query Logging toggle when the Query Log component is enabled */}
              {compQueryLog && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Query Logging</p>
                    <p className="text-xs text-muted-foreground">
                      Log all DNS queries for analysis
                    </p>
                  </div>
                  <Switch
                    checked={queryLogging}
                    onCheckedChange={(v) => onToggle("query_logging", v)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upstream DNS */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Upstream DNS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                DNS server used for non-blocked queries
              </p>
              <div className="flex gap-2 flex-wrap">
                {["1.1.1.1", "1.0.0.1", "8.8.8.8", "9.9.9.9"].map((dns) => (
                  <Badge
                    key={dns}
                    variant={upstreamDns.includes(dns) ? "default" : "outline"}
                    className="cursor-pointer font-mono text-xs"
                  >
                    {dns}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Current: <code className="font-mono">{upstreamDns}</code>
              </p>
            </CardContent>
          </Card>

          {/* DNS Resolver */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4" />
                DNS Resolver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {resolver?.running
                      ? `Running on UDP :${resolver.port} (PID ${resolver.pid})`
                      : "Not running"}
                  </p>
                </div>
                <Badge variant={resolver?.running ? "default" : "secondary"} className="text-[10px]">
                  {resolver?.running ? "Active" : "Stopped"}
                </Badge>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
                <p className="text-muted-foreground">The DNS resolver starts automatically with <code className="font-mono text-foreground">npm run dev</code>.</p>
                <p className="text-muted-foreground">
                  Point your device/router DNS to{" "}
                  <span className="font-mono font-medium text-foreground">{resolver?.lanIp || "this machine"}</span>{" "}
                  on port{" "}
                  <span className="font-mono font-medium text-foreground">53</span>.
                  Blocked domains redirect to the block page, allowed queries
                  forward to <span className="font-mono">{upstreamDns.split(",")[0]}</span>.
                </p>
                <p className="text-muted-foreground">
                  All queries are logged to the database and appear in the Query Log in real-time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engine</span>
                <span className="font-mono">Bastion DNS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-mono">0.2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-mono">React / Next.js</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Components ── */}
      {subTab === "components" && (
        <ComponentsTab settings={settings} onToggle={onToggle} />
      )}

      {/* ── Block Page ── */}
      {subTab === "block-page" && (
        <BlockPageTab settings={settings} updateSetting={updateSetting} />
      )}
    </div>
  );
}
