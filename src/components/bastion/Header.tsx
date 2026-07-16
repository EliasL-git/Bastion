"use client";

import {
  Shield, Activity, Ban, CheckCircle2, Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import type { ResolverStatus, Stats } from "./types";

export function DashboardHeader({
  resolver,
  stats,
  onRefresh,
}: {
  resolver: ResolverStatus | null;
  stats: Stats | null;
  onRefresh: () => void;
}) {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">Bastion</span>
          </div>
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
            DNS Sinkhole
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {resolver && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Radio className={`h-3.5 w-3.5 ${resolver.running ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  <span className={`text-[10px] font-medium hidden md:inline ${resolver.running ? "text-emerald-600" : "text-muted-foreground"}`}>
                    DNS :{resolver.port} {resolver.running ? "Active" : "Stopped"}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {resolver.running
                  ? `Resolver running (PID ${resolver.pid}) on UDP :${resolver.port}`
                  : "DNS resolver is not running"}
              </TooltipContent>
            </Tooltip>
          )}
          {stats && (
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${stats.blockingEnabled ? "bg-emerald-500" : "bg-red-500"}`} />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {stats.blockingEnabled ? "Protection Active" : "Protection Disabled"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
