"use client";

import {
  LayoutDashboard, BarChart3, AreaChart, Globe,
  ScrollText, ShieldOff, Eye, FileKey, Menu,
  Puzzle, Lock, Power, PowerOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SettingsMap } from "./types";

interface ComponentDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  core: boolean;
  settingsKey: string;
  version: string;
  category: "core" | "analytics" | "filtering" | "interface";
}

const COMPONENTS: ComponentDef[] = [
  // ── Core ──
  {
    id: "sidebar",     name: "Sidebar",       description: "Main navigation sidebar with all page links",
    icon: Menu,            core: true,  settingsKey: "", version: "1.0.0", category: "core",
  },
  {
    id: "header",      name: "Header",        description: "Top bar with Bastion branding, resolver status & protection badge",
    icon: LayoutDashboard, core: true,  settingsKey: "", version: "1.0.0", category: "core",
  },
  {
    id: "footer",      name: "Footer",        description: "Bottom bar with version and system information",
    icon: LayoutDashboard, core: true,  settingsKey: "", version: "1.0.0", category: "core",
  },
  {
    id: "stats_grid",  name: "Stats Grid",    description: "Summary statistics cards showing queries, blocked count & block rate",
    icon: BarChart3,       core: true,  settingsKey: "", version: "1.0.0", category: "core",
  },
  // ── Analytics ──
  {
    id: "dns_chart",   name: "DNS Timeline",          description: "24-hour chart of allowed vs blocked DNS query volume",
    icon: AreaChart,   core: false, settingsKey: "comp_dns_chart",   version: "1.1.0", category: "analytics",
  },
  {
    id: "top_domains", name: "Top Domains",           description: "Most frequently blocked and most frequently allowed domains",
    icon: Globe,       core: false, settingsKey: "comp_top_domains", version: "1.0.0", category: "analytics",
  },
  // ── Filtering ──
  {
    id: "query_log",   name: "Query Log",             description: "Searchable, filterable table of all DNS queries with status and client info",
    icon: ScrollText,  core: false, settingsKey: "comp_query_log",   version: "1.2.0", category: "filtering",
  },
  {
    id: "blocklists",  name: "Blocklists",            description: "Manage blocklist sources, add custom domains and review blocked entries",
    icon: ShieldOff,   core: false, settingsKey: "comp_blocklists",  version: "1.1.0", category: "filtering",
  },
  {
    id: "allowlist",   name: "Allowlist",             description: "Manage allowed domains that bypass DNS blocking entirely",
    icon: Eye,         core: false, settingsKey: "comp_allowlist",   version: "1.0.0", category: "filtering",
  },
  // ── Interface ──
  {
    id: "block_page",  name: "Block Page",            description: "End-user block page with TLS certificate generation and contact info",
    icon: FileKey,     core: false, settingsKey: "comp_block_page",  version: "1.0.0", category: "interface",
  },
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  core:      { label: "System",    color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-700" },
  analytics: { label: "Analytics", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-700" },
  filtering: { label: "Filtering", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700" },
  interface: { label: "Interface", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-700" },
};

const CATEGORY_ORDER: (keyof typeof CATEGORY_META)[] = ["core", "analytics", "filtering", "interface"];

export function ComponentsTab({
  settings,
  onToggle,
}: {
  settings: SettingsMap;
  onToggle: (key: string, value: boolean) => void;
}) {
  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = COMPONENTS.filter((c) => c.category === cat);
      return acc;
    },
    {} as Record<string, ComponentDef[]>,
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (!items?.length) return null;
        const meta = CATEGORY_META[cat];
        const isCore = cat === "core";

        return (
          <section key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
              <div className="h-px flex-1 bg-border/50" />
              <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                {items.length} plugin{items.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Plugin cards grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((comp) => {
                const enabled = isCore || settings[comp.settingsKey] !== "false";

                return (
                  <Card
                    key={comp.id}
                    className={cn(
                      "group relative border-border/50 transition-all duration-200",
                      !isCore && "hover:border-border",
                      !isCore && enabled
                        ? "bg-card/80 hover:bg-card"
                        : "bg-card/40",
                      !isCore && !enabled && "opacity-55",
                    )}
                  >
                    {/* Status accent bar */}
                    <div
                      className={cn(
                        "absolute top-0 left-0 right-0 h-0.5 rounded-t-lg",
                        isCore
                          ? "bg-slate-400"
                          : enabled
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/20",
                      )}
                    />

                    <CardContent className="p-4">
                      {/* Header row: icon + toggle */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                            isCore
                              ? "bg-slate-500/10 border-slate-200 dark:bg-slate-500/20 dark:border-slate-700"
                              : enabled
                                ? "bg-emerald-500/10 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-700"
                                : "bg-muted/50 border-border",
                          )}
                        >
                          <comp.icon
                            className={cn(
                              "h-4 w-4",
                              isCore
                                ? "text-slate-500 dark:text-slate-400"
                                : enabled
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground",
                            )}
                          />
                        </div>

                        {/* Toggle or lock */}
                        {isCore ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">System</span>
                          </div>
                        ) : (
                          <Switch
                            checked={enabled}
                            onCheckedChange={(v) => onToggle(comp.settingsKey, v)}
                            className="shrink-0"
                          />
                        )}
                      </div>

                      {/* Name & description */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "text-sm font-medium",
                            !isCore && !enabled && "text-muted-foreground",
                          )}>
                            {comp.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono text-muted-foreground/60 px-1 py-0 h-4"
                          >
                            v{comp.version}
                          </Badge>
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          enabled ? "text-muted-foreground" : "text-muted-foreground/60",
                        )}>
                          {comp.description}
                        </p>
                      </div>

                      {/* Footer: status + category */}
                      <div className="mt-3 flex items-center justify-between">
                        {/* Status indicator */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full",
                              isCore
                                ? "bg-slate-400"
                                : enabled
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground/30",
                            )}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {isCore ? "Always active" : enabled ? "Active" : "Disabled"}
                          </span>
                        </div>

                        {/* Category tag */}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium",
                            meta.color,
                          )}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
