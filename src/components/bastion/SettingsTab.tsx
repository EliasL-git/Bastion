"use client";

import { Shield, Server, Radio, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { ResolverStatus, SettingsMap } from "./types";

export function SettingsTab({
  settings,
  onToggle,
  resolver,
}: {
  settings: SettingsMap;
  onToggle: (key: string, value: boolean) => void;
  resolver: ResolverStatus | null;
}) {
  const blockingEnabled = settings.blocking_enabled === "true";
  const queryLogging = settings.query_logging === "true";
  const upstreamDns = settings.upstream_dns ?? "1.1.1.1";

  return (
    <div className="space-y-6 max-w-lg">
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
            <p className="text-muted-foreground">To use Bastion as your DNS server:</p>
            <code className="block font-mono bg-background rounded px-2 py-1">
              bun run mini-services/dns-resolver/index.ts
            </code>
            <p className="text-muted-foreground pt-1">
              Then point your device/router DNS to this machine on port{" "}
              <span className="font-mono font-medium text-foreground">5353</span>.
              Blocked domains return <span className="font-mono">0.0.0.0</span>, allowed queries
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
  );
}
