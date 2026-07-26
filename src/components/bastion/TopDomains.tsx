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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Ban className="h-4 w-4 text-rose-400" /> Top Blocked</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.blocked.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-4 text-center text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
                <span className="truncate font-mono text-xs text-foreground">{extractDomain(d.domain)}</span>
              </div>
              <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">{d.count.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Globe className="h-4 w-4 text-emerald-400" /> Top Allowed</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.allowed.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary/50">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-4 text-center text-[11px] font-semibold text-muted-foreground">{i + 1}</span>
                <span className="truncate font-mono text-xs text-foreground">{extractDomain(d.domain)}</span>
              </div>
              <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">{d.count.toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
