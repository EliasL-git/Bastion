"use client";

import { Shield } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Bastion DNS Sinkhole
        </span>
        <span>Lightweight network-wide ad blocking</span>
      </div>
    </footer>
  );
}
