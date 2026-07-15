"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SettingsTab, ResolverStatus } from "../components";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [resolver, setResolver] = useState<ResolverStatus | null>(null);
  const [serverIp, setServerIp] = useState("localhost");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [settingsRes, resolverRes] = await Promise.all([
      fetch("/api/bastion/settings"),
      fetch("/api/bastion/resolver").catch(() => null),
    ]);
    setSettings(await settingsRes.json());
    if (resolverRes) setResolver(await resolverRes.json());
    try { const h = await fetch("/api/bastion/hostname"); const d = await h.json(); setServerIp(d.ip); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggle = async (key: string, value: boolean) => {
    await fetch("/api/bastion/toggle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setSettings((prev) => ({ ...prev, [key]: String(value) }));
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    await fetch("/api/bastion/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <SettingsTab
      settings={settings}
      onToggle={handleToggle}
      onUpdateSetting={handleUpdateSetting}
      resolver={resolver}
      serverIp={serverIp}
    />
  );
}
