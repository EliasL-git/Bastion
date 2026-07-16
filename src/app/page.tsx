"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Clock, ShieldOff, Eye, Settings,
  Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useStats, useTopDomains, useSettings, useResolver } from "@/components/bastion/hooks";

export default function BastionDashboard() {
  const { stats, loading: statsLoading, refresh: refreshStats } = useStats();
  const { topDomains, refresh: refreshTop } = useTopDomains();
  const { settings, refresh: refreshSettings, toggle } = useSettings();
  const { resolver, refresh: refreshResolver } = useResolver();
  const [activeTab, setActiveTab] = useState("overview");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Seed on first load
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

  // Wait for initial data
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
        <DashboardHeader resolver={resolver} stats={stats} onRefresh={handleRefresh} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          <StatsGrid stats={stats} settings={settings} />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="queries" className="gap-1.5 text-xs sm:text-sm">
                <Clock className="h-3.5 w-3.5" />
                Query Log
              </TabsTrigger>
              <TabsTrigger value="blocklists" className="gap-1.5 text-xs sm:text-sm">
                <ShieldOff className="h-3.5 w-3.5" />
                Blocklists
              </TabsTrigger>
              <TabsTrigger value="allowlist" className="gap-1.5 text-xs sm:text-sm">
                <Eye className="h-3.5 w-3.5" />
                Allowlist
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <DnsChart stats={stats} />
              <TopDomains data={topDomains} />
            </TabsContent>

            <TabsContent value="queries" className="mt-6">
              <QueryLog />
            </TabsContent>

            <TabsContent value="blocklists" className="mt-6">
              <BlocklistsTab />
            </TabsContent>

            <TabsContent value="allowlist" className="mt-6">
              <AllowlistTab />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsTab settings={settings} onToggle={toggle} resolver={resolver} />
            </TabsContent>
          </Tabs>
        </main>

        <DashboardFooter />
      </div>
    </TooltipProvider>
  );
}
