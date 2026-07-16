"use client";

import { useState, useEffect, useCallback } from "react";
import type { Stats, QueryEntry, BlocklistEntry, AllowlistEntry, ResolverStatus, SettingsMap, TopDomainsData } from "./types";

// ── Fetch wrapper ──

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

// ── useStats ──

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await json<Stats>("/api/bastion/stats");
      setStats(data);
    } catch {
      // keep old data
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, refresh };
}

// ── useTopDomains ──

export function useTopDomains() {
  const [data, setData] = useState<TopDomainsData | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await json<TopDomainsData>("/api/bastion/top-domains"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { topDomains: data, refresh };
}

// ── useSettings ──

export function useSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});

  const refresh = useCallback(async () => {
    try {
      setSettings(await json<SettingsMap>("/api/bastion/settings"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async (key: string, value: boolean) => {
    await json("/api/bastion/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSettings((prev) => ({ ...prev, [key]: String(value) }));
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    await json("/api/bastion/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { settings, refresh, toggle, updateSetting };
}

// ── useResolver ──

export function useResolver() {
  const [resolver, setResolver] = useState<ResolverStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      setResolver(await json<ResolverStatus>("/api/bastion/resolver"));
    } catch {
      setResolver(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { resolver, refresh };
}

// ── useQueries ──

export function useQueries() {
  const [queries, setQueries] = useState<QueryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / 50);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "50",
      status,
      search,
    });
    const data = await json<{ queries: QueryEntry[]; total: number }>(
      `/api/bastion/queries?${params}`
    );
    setQueries(data.queries);
    setTotal(data.total);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const goToPage = useCallback((p: number) => setPage(p), []);
  const setFilterStatus = useCallback((s: string) => { setStatus(s); setPage(1); }, []);
  const setFilterSearch = useCallback((s: string) => { setSearch(s); setPage(1); }, []);

  return {
    queries, page, total, totalPages, loading,
    status, search,
    refresh: fetchQueries,
    goToPage, setFilterStatus, setFilterSearch,
  };
}

// ── useBlocklists ──

export function useBlocklists() {
  const [lists, setLists] = useState<BlocklistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      setLists(await json<BlocklistEntry[]>("/api/bastion/blocklists"));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const toggle = useCallback(async (id: string, enabled: boolean) => {
    await json(`/api/bastion/blocklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    fetchLists();
  }, [fetchLists]);

  const remove = useCallback(async (id: string) => {
    await json(`/api/bastion/blocklists/${id}`, { method: "DELETE" });
    fetchLists();
  }, [fetchLists]);

  const add = useCallback(async (name: string, entries: string, source?: string) => {
    await json("/api/bastion/blocklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entries, source: source ?? "custom" }),
    });
    fetchLists();
  }, [fetchLists]);

  const updateEntries = useCallback(async (id: string, entries: string) => {
    await json(`/api/bastion/blocklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    fetchLists();
  }, [fetchLists]);

  return { lists, loading, toggle, remove, add, updateEntries, refresh: fetchLists };
}

// ── useAllowlist ──

export function useAllowlist() {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    try {
      setEntries(await json<AllowlistEntry[]>("/api/bastion/allowlist"));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const add = useCallback(async (domain: string, note?: string) => {
    if (!domain) return;
    await json("/api/bastion/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, note }),
    });
    fetchEntries();
  }, [fetchEntries]);

  const remove = useCallback(async (id: string) => {
    await json(`/api/bastion/allowlist/${id}`, { method: "DELETE" });
    fetchEntries();
  }, [fetchEntries]);

  return { entries, add, remove, refresh: fetchEntries };
}
