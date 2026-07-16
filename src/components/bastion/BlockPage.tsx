"use client";

import { Shield, ShieldOff, Globe, AlertTriangle, ExternalLink, Clock, Server, FileText, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BlockPageInfo } from "./types";

const categoryColors: Record<string, string> = {
  ads: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  tracking: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  malware: "bg-red-500/10 text-red-600 border-red-500/20",
  custom: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const categoryLabels: Record<string, string> = {
  ads: "Ad / Tracking Network",
  tracking: "User Tracking",
  malware: "Malware / Phishing",
  custom: "Custom Blocklist",
};

const categoryIcons: Record<string, React.ElementType> = {
  ads: ShieldOff,
  tracking: AlertTriangle,
  malware: AlertTriangle,
  custom: Shield,
};

export function BlockPagePanel({ info }: { info: BlockPageInfo }) {
  const CategoryIcon = categoryIcons[info.category] ?? Shield;
  const colorClass = categoryColors[info.category] ?? categoryColors.custom;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header banner */}
      <div className={`px-5 py-4 flex items-center gap-3 ${info.category === "malware" ? "bg-red-500/10" : info.category === "ads" ? "bg-orange-500/10" : "bg-purple-500/10"}`}>
        <div className={`rounded-full p-2.5 ${colorClass}`}>
          <CategoryIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Domain Blocked</h3>
          <p className="text-xs text-muted-foreground">
            This domain was blocked by an active blocklist
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto text-[10px] gap-1">
          <ShieldOff className="h-2.5 w-2.5" />
          Blocked
        </Badge>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Blocked Domain */}
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Blocked Domain
          </p>
          <div className="flex items-center gap-2">
            <code className="text-base font-mono font-semibold bg-muted/50 rounded px-2 py-1 break-all">
              {info.domain}
            </code>
            <Badge variant="outline" className={`text-[10px] ${colorClass}`}>
              {categoryLabels[info.category] ?? "Custom"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Block Reason Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ShieldOff className="h-3 w-3" />
              Matching List
            </p>
            <p className="text-sm font-medium">{info.list}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Blocked At
            </p>
            <p className="text-sm">{new Date(info.timestamp).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Query Type
            </p>
            <Badge variant="outline" className="font-mono text-[10px] w-fit">
              {info.queryType}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Server className="h-3 w-3" />
              Client IP
            </p>
            <code className="text-xs font-mono">{info.clientIp}</code>
          </div>
        </div>

        <Separator />

        {/* CRT / Certificate Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className={`h-4 w-4 ${info.hasCert ? "text-emerald-500" : "text-muted-foreground"}`} />
            <p className="text-sm font-semibold">TLS Certificate Information</p>
          </div>
          {info.hasCert ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Issuer</p>
                <p className="text-xs font-mono truncate" title={info.certIssuer ?? ""}>
                  {info.certIssuer ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</p>
                <p className="text-xs font-mono truncate" title={info.certSubject ?? ""}>
                  {info.certSubject ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expires</p>
                <p className={`text-xs font-medium ${info.certExpiry && new Date(info.certExpiry) < new Date() ? "text-red-500" : ""}`}>
                  {info.certExpiry ? new Date(info.certExpiry).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                No TLS certificate detected for this domain. The connection was blocked before any TLS handshake occurred.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <FileText className="h-3 w-3" />
            View Raw Query
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <ExternalLink className="h-3 w-3" />
            Whois Lookup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Compact inline block badge for tables ──

export function BlockInfoBadge({
  list,
  category,
}: {
  list: string;
  category?: string;
}) {
  const colorClass = category ? (categoryColors[category] ?? "bg-muted/50") : "bg-muted/50";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}>
      <ShieldOff className="h-2.5 w-2.5" />
      {list}
    </span>
  );
}
