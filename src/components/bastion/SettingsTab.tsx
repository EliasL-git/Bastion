"use client";

import { useState, useEffect } from "react";
import { Shield, Server, Radio, Zap, Sliders, Box, FileKey } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ComponentsTab } from "./ComponentsTab";
import { BlockPageTab } from "./BlockPageTab";
import type { ResolverStatus, SettingsMap } from "./types";

type SubTab = "general" | "components" | "block-page";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "components", label: "Components", icon: Box },
  { id: "block-page", label: "Block Page", icon: FileKey },
];

export function SettingsTab({ settings, onToggle, resolver, updateSetting }: {
  settings: SettingsMap;
  onToggle: (key: string, value: boolean) => void;
  resolver: ResolverStatus | null;
  updateSetting: (key: string, value: string) => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("general");
  const blockingEnabled = settings.blocking_enabled === "true";
  const queryLogging = settings.query_logging === "true";
  const upstreamDns = settings.upstream_dns ?? "1.1.1.1";
  const compBlockPage = settings.comp_block_page !== "false";
  const compQueryLog = settings.comp_query_log !== "false";

  const visibleTabs = SUB_TABS.filter((tab) => (tab.id === "block-page" ? compBlockPage : true));
  const currentTabVisible = visibleTabs.some((t) => t.id === subTab);
  useEffect(() => { if (!currentTabVisible) setSubTab("general"); }, [currentTabVisible]);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex w-fit gap-1 rounded-lg border border-border/60 bg-card/60 p-1">
        {visibleTabs.map((tab) => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all", subTab === tab.id ? "bg-primary/10 text-primary shadow-glow-sm" : "text-muted-foreground hover:text-foreground")}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {subTab === "general" && (
        <div className="space-y-5">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Shield className="h-4 w-4 text-primary" /> DNS Blocking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Enable Blocking</p><p className="text-xs text-muted-foreground">Block queries matching blocklist domains</p></div>
                <Switch checked={blockingEnabled} onCheckedChange={(v) => onToggle("blocking_enabled", v)} />
              </div>
              {compQueryLog && (
                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div><p className="text-sm font-medium">Query Logging</p><p className="text-xs text-muted-foreground">Log all DNS queries for analysis</p></div>
                  <Switch checked={queryLogging} onCheckedChange={(v) => onToggle("query_logging", v)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Server className="h-4 w-4 text-info" /> Upstream DNS</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">DNS server used for non-blocked queries</p>
              <div className="flex flex-wrap gap-2">
                {["1.1.1.1", "1.0.0.1", "8.8.8.8", "9.9.9.9"].map((dns) => (
                  <Badge key={dns} variant={upstreamDns.includes(dns) ? "default" : "outline"} className="cursor-pointer font-mono text-xs">{dns}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Current: <code className="font-mono text-foreground">{upstreamDns}</code></p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Radio className="h-4 w-4 text-emerald-400" /> DNS Resolver</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Status</p><p className="text-xs text-muted-foreground">{resolver?.running ? `Running on UDP :${resolver.port} (PID ${resolver.pid})` : "Not running"}</p></div>
                <Badge variant="outline" className={`text-[10px] ${resolver?.running ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-border/60 bg-secondary/50 text-muted-foreground"}`}>{resolver?.running ? "Active" : "Stopped"}</Badge>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <p>The DNS resolver starts automatically with <code className="font-mono text-foreground">npm run dev</code>.</p>
                <p className="mt-1">Point your device/router DNS to <span className="font-mono font-medium text-foreground">{resolver?.lanIp || "this machine"}</span> on port <span className="font-mono font-medium text-foreground">53</span>. Blocked domains redirect to the block page, allowed queries forward to <span className="font-mono">{upstreamDns.split(",")[0]}</span>.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Zap className="h-4 w-4 text-warning" /> System Info</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Engine</span><span className="font-mono">Bastion DNS</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">0.2.0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-mono">React / Next.js</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === "components" && <ComponentsTab settings={settings} onToggle={onToggle} />}
      {subTab === "block-page" && <BlockPageTab settings={settings} updateSetting={updateSetting} />}
    </div>
  );
}
