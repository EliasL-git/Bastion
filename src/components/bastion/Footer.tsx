"use client";

import { Shield } from "lucide-react";

export function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/50">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between px-4 sm:px-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary" /> Bastion DNS</span>
        <span>Network-wide ad blocking &amp; tracking protection</span>
      </div>
    </footer>
  );
}
