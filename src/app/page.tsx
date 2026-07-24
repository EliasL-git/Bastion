"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardHeader } from "@/components/bastion/Header";
import { DashboardFooter } from "@/components/bastion/Footer";
import { StatsGrid } from "@/components/bastion/StatsGrid";
import { DnsChart } from "@/components/bastion/DnsChart";
import { TopDomains } from "@/components/bastion/TopDomains";
import { QueryLog } from "@/components/bastion/QueryLog";
import { BlocklistsTab } from "@/components/bastion/BlocklistsTab";
import { AllowlistTab } from "@/components/bastion/AllowlistTab";
import { SettingsTab } from "@/components/bastion/SettingsTab";
import { Sidebar } from "@/components/bastion/Sidebar";
import { useStats, useTopDomains, useSettings, useResolver } from "@/components/bastion/hooks";

export default function BastionDashboard() {
  const { stats, refresh: refreshStats } = useStats();
  const { topDomains, refresh: refreshTop } = useTopDomains();
  const { settings, refresh: refreshSettings, toggle, updateSetting } = useSettings();
  const { resolver, refresh: refreshResolver } = useResolver();
  const [activeTab, setActiveTab] = useState("overview");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const res = await fetch("/api/bastion/seed", { method: "POST" });
        if (res.status === 401) {
          await fetch("/api/bastion/auth/logout", { method: "POST" });
          window.location.href = "/login";
          return;
        }
      } catch { /* ignore */ }
      if (mounted) setInitialLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleRefresh = useCallback(() => {
    refreshStats(); refreshTop(); refreshSettings(); refreshResolver();
  }, [refreshStats, refreshTop, refreshSettings, refreshResolver]);

  const ready = !initialLoading && stats !== null;
  const compDnsChart = settings.comp_dns_chart !== "false";
  const compTopDomains = settings.comp_top_domains !== "false";
  const compQueryLog = settings.comp_query_log !== "false";
  const compBlocklists = settings.comp_blocklists !== "false";
  const compAllowlist = settings.comp_allowlist !== "false";

  useEffect(() => {
    if (
      (activeTab === "queries" && !compQueryLog) ||
      (activeTab === "blocklists" && !compBlocklists) ||
      (activeTab === "allowlist" && !compAllowlist)
    ) setActiveTab("overview");
  }, [activeTab, compQueryLog, compBlocklists, compAllowlist]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-glow">
            <Shield className="h-6 w-6 animate-pulse text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Bastion...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader resolver={resolver} stats={stats} />
        <div className="flex flex-1">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onRefresh={handleRefresh} stats={stats} resolver={resolver} settings={settings} />
          <main className="min-w-0 flex-1 bg-grid px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-5">
              <StatsGrid stats={stats} settings={settings} />
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {compDnsChart && <DnsChart stats={stats} />}
                  {compTopDomains && <TopDomains data={topDomains} />}
                  {!compDnsChart && !compTopDomains && (
                    <div className="rounded-xl border border-border/60 bg-card/60 py-10 text-center text-sm text-muted-foreground">
                      <p>All overview components are disabled.</p>
                      <p className="mt-1 text-xs">Enable them in Settings → Components.</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "queries" && compQueryLog && <QueryLog />}
              {activeTab === "blocklists" && compBlocklists && <BlocklistsTab />}
              {activeTab === "allowlist" && compAllowlist && <AllowlistTab />}
              {activeTab === "settings" && <SettingsTab settings={settings} onToggle={toggle} resolver={resolver} updateSetting={updateSetting} />}
            </div>
          </main>
        </div>
        <DashboardFooter />
      </div>
    </TooltipProvider>
  );
}
