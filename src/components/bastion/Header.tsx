"use client";

import { Shield, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ResolverStatus, Stats } from "./types";

export function DashboardHeader({ resolver, stats }: { resolver: ResolverStatus | null; stats: Stats | null }) {
  const protectedMode = stats?.blockingEnabled ?? false;
  const resolverRunning = resolver?.running ?? false;

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-glow-sm">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">Bastion</span>
              <Badge variant="outline" className="hidden border-border/60 text-[10px] font-medium tracking-wide text-muted-foreground sm:inline-flex">DNS SINKHOLE</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {resolver && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5">
                    <Radio className={`h-3.5 w-3.5 ${resolverRunning ? "text-emerald-400" : "text-muted-foreground"}`} />
                    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">DNS</span>
                    <span className={`text-xs font-semibold tabular-nums ${resolverRunning ? "text-emerald-400" : "text-muted-foreground"}`}>:{resolver.port}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${resolverRunning ? "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" : "bg-rose-500"}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {resolverRunning ? `Resolver running (PID ${resolver.pid}) on UDP :${resolver.port}` : "DNS resolver is not running"}
                </TooltipContent>
              </Tooltip>
            )}

            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${protectedMode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${protectedMode ? "bg-emerald-400" : "bg-rose-400"}`} />
              {protectedMode ? "Protection Active" : "Protection Disabled"}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
