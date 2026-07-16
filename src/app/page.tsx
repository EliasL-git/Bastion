"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Clock, ShieldOff, Eye, Settings,
  Shield,
} from "lucide-react";
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
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const { topDomains, refresh: refreshTop } = useTopDomains();
  const { settings, refresh: refreshSettings, toggle } = useSettings();
  const { resolver, refresh: refreshResolver } = useResolver();
  const [activeTab, setActiveTab] = useState("overview");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await fetch("/api/bastion/seed", { method: "POST" });
      } catch { /* ignore */ }
      if (mounted) setInitialLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, []);

  const handleRefresh = useCallback(() => {
    refreshStats();
    refreshTop();
    refreshSettings();
    refreshResolver();
  }, [refreshStats, refreshTop, refreshSettings, refreshResolver]);

  const ready = !initialLoading && stats !== null;

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="h-8 w-8 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading Bastion...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader resolver={resolver} stats={stats} />

        <div className="flex flex-1">
          {/* Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onRefresh={handleRefresh}
            stats={stats}
            resolver={resolver}
          />

          {/* Main content */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 space-y-6 min-w-0">
            <StatsGrid stats={stats} settings={settings} />

            {activeTab === "overview" && (
              <div className="space-y-6">
                <DnsChart stats={stats} />
                <TopDomains data={topDomains} />
              </div>
            )}

            {activeTab === "queries" && <QueryLog />}
            {activeTab === "blocklists" && <BlocklistsTab />}
            {activeTab === "allowlist" && <AllowlistTab />}
            {activeTab === "settings" && (
              <SettingsTab settings={settings} onToggle={toggle} resolver={resolver} />
            )}
          </main>
        </div>

        <DashboardFooter />
      </div>
    </TooltipProvider>
  );
}
