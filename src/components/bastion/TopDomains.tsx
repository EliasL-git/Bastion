"use client";

import { Ban, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopDomainsData } from "./types";

function extractDomain(full: string): string {
  const parts = full.split(".");
  if (parts.length > 2) return parts.slice(-2).join(".");
  return full;
}

export function TopDomains({ data }: { data: TopDomainsData | null }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Ban className="h-4 w-4 text-red-500" />
            Top Blocked Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.blocked.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">
                {d.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Top Allowed Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.allowed.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">
                {d.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
