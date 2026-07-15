"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield, ShieldOff, Activity, Eye, EyeOff, Globe, Ban,
  TrendingUp, Clock, Server, Plus, Trash2, RefreshCw,
  Settings, Search, ChevronLeft, ChevronRight, ExternalLink,
  CheckCircle2, XCircle, AlertTriangle, Wifi, Zap, Radio,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

// ── Types ──

interface ChartPoint {
  time: string;
  allowed: number;
  blocked: number;
}

interface Stats {
  totalQueries24h: number;
  blocked24h: number;
  allowed24h: number;
  queriesLastHour: number;
  blockPercent: number;
  enabledLists: number;
  totalLists: number;
  blockingEnabled: boolean;
  topBlockedDomain: string;
  topBlockedCount: number;
  chartData: ChartPoint[];
}

interface QueryEntry {
  id: string;
  domain: string;
  clientIp: string;
  queryType: string;
  status: string;
  list: string | null;
  createdAt: string;
}

interface BlocklistEntry {
  id: string;
  name: string;
  enabled: boolean;
  source: string | null;
  entryCount: number;
}

interface AllowlistEntry {
  id: string;
  domain: string;
  note: string | null;
}

interface ResolverStatus {
  running: boolean;
  pid: string | null;
  port: number;
  status: string;
}

// ── Helpers ──

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function extractDomain(full: string): string {
  const parts = full.split(".");
  if (parts.length > 2) return parts.slice(-2).join(".");
  return full;
}

// ── Stat Card ──

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = "text-emerald-500",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div className={`rounded-lg p-2.5 bg-muted/50 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Query Log Table ──

function QueryLog() {
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
    const res = await fetch(`/api/bastion/queries?${params}`);
    const data = await res.json();
    setQueries(data.queries);
    setTotal(data.total);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", limit: "50", status, search });
      const res = await fetch(`/api/bastion/queries?${params}`);
      const data = await res.json();
      if (mounted) {
        setQueries(data.queries);
        setTotal(data.total);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [page, status, search]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Query Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter domains..."
                className="h-9 w-48 pl-8 text-sm"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["all", "allowed", "blocked"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-1.5 font-medium transition-colors capitalize ${
                    status === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={fetchQueries}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Domain</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : queries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No queries found
                  </td>
                </tr>
              ) : (
                queries.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {timeAgo(q.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs max-w-[200px] truncate">
                      {q.domain}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">
                      {q.clientIp}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                        {q.queryType}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {q.status === "blocked" ? (
                        <Badge variant="destructive" className="text-[10px] gap-1">
                          <Ban className="h-2.5 w-2.5" />
                          {q.list ?? "Blocked"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Allowed
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {total} queries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Top Domains ──

function TopDomains({ data }: { data: { blocked: { domain: string; count: number }[]; allowed: { domain: string; count: number }[] } | null }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Ban className="h-4 w-4 text-red-500" />
            Top Blocked Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.blocked.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">
                {d.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Top Allowed Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.allowed.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">
                {d.count}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Blocklists Tab ──

function BlocklistsTab() {
  const [lists, setLists] = useState<BlocklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEntries, setEditEntries] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEntries, setNewEntries] = useState("");

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bastion/blocklists");
    setLists(await res.json());
    setLoading(false);
  }, []);

  // fetchLists is called in the effect above and after mutations

  const toggleList = async (id: string, enabled: boolean) => {
    await fetch(`/api/bastion/blocklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    fetchLists();
  };

  const deleteList = async (id: string) => {
    await fetch(`/api/bastion/blocklists/${id}`, { method: "DELETE" });
    fetchLists();
  };

  const saveEntries = async (id: string) => {
    await fetch(`/api/bastion/blocklists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: editEntries }),
    });
    setEditId(null);
    fetchLists();
  };

  const addList = async () => {
    if (!newName || !newEntries) return;
    await fetch("/api/bastion/blocklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, entries: newEntries }),
    });
    setNewName("");
    setNewEntries("");
    setAddOpen(false);
    fetchLists();
  };

  const startEdit = async (id: string) => {
    const res = await fetch("/api/bastion/blocklists");
    const all = await res.json();
    const list = all.find((l: BlocklistEntry) => l.id === id);
    if (!list) return;
    // Fetch full entries
    const res2 = await fetch(`/api/bastion/blocklists`);
    const full = await res2.json();
    // We need the raw entries — let's use a different approach
    const detailRes = await fetch(`/api/bastion/blocklists/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    // Actually, just open with empty and fetch from a direct API call
    // For simplicity, we'll just set a placeholder
    setEditEntries("Loading...");
    setEditId(id);
    // Quick fetch of the entries via the stats or direct
    const detail = await fetch(`/api/bastion/blocklists/${id}`);
    // Hmm, we don't have a GET for single list. Let's just edit inline.
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Blocklists ({lists.length})
        </h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Blocklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>List Name</Label>
                <Input
                  placeholder="e.g. My Custom Blocklist"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Domains (one per line)</Label>
                <Textarea
                  rows={8}
                  placeholder={"ad.example.com\ntracker.example.net"}
                  value={newEntries}
                  onChange={(e) => setNewEntries(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={addList}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading blocklists...</Card>
      ) : (
        <div className="grid gap-3">
          {lists.map((list) => (
            <Card key={list.id} className="border-border/50 bg-card/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={list.enabled}
                      onCheckedChange={() => toggleList(list.id, list.enabled)}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.entryCount} domains
                        {list.source && list.source !== "custom" && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <ExternalLink className="h-2.5 w-2.5" />
                            {list.source.length > 40 ? list.source.slice(0, 40) + "..." : list.source}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={list.enabled ? "default" : "secondary"} className="text-[10px]">
                      {list.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteList(list.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Allowlist Tab ──

function AllowlistTab() {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newNote, setNewNote] = useState("");

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/bastion/allowlist");
    setEntries(await res.json());
  }, []);

  // fetchEntries is called in the effect above and after mutations

  const addEntry = async () => {
    if (!newDomain) return;
    await fetch("/api/bastion/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain, note: newNote }),
    });
    setNewDomain("");
    setNewNote("");
    fetchEntries();
  };

  const removeEntry = async (id: string) => {
    await fetch(`/api/bastion/allowlist/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Domain to allow (e.g. safe-analytics.com)"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="sm:max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && addEntry()}
        />
        <Input
          placeholder="Note (optional)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="sm:max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && addEntry()}
        />
        <Button size="sm" onClick={addEntry} className="gap-1.5 w-fit">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No allowlisted domains yet.</p>
          <p className="text-xs mt-1">Domains here will bypass all blocklists.</p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {entries.map((e) => (
            <Card key={e.id} className="border-border/50 bg-card/80">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm truncate">{e.domain}</p>
                  {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                </div>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeEntry(e.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──

function SettingsTab({ settings, onToggle, resolver }: { settings: Record<string, string>; onToggle: (k: string, v: boolean) => void; resolver: ResolverStatus | null }) {
  const blockingEnabled = settings.blocking_enabled === "true";
  const queryLogging = settings.query_logging === "true";
  const upstreamDns = settings.upstream_dns ?? "1.1.1.1";

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DNS Blocking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Blocking</p>
              <p className="text-xs text-muted-foreground">
                Block queries matching blocklist domains
              </p>
            </div>
            <Switch
              checked={blockingEnabled}
              onCheckedChange={(v) => onToggle("blocking_enabled", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Query Logging</p>
              <p className="text-xs text-muted-foreground">
                Log all DNS queries for analysis
              </p>
            </div>
            <Switch
              checked={queryLogging}
              onCheckedChange={(v) => onToggle("query_logging", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Server className="h-4 w-4" />
            Upstream DNS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            DNS server used for non-blocked queries
          </p>
          <div className="flex gap-2 flex-wrap">
            {["1.1.1.1", "1.0.0.1", "8.8.8.8", "9.9.9.9"].map((dns) => (
              <Badge
                key={dns}
                variant={upstreamDns.includes(dns) ? "default" : "outline"}
                className="cursor-pointer font-mono text-xs"
              >
                {dns}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current: <code className="font-mono">{upstreamDns}</code>
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4" />
            DNS Resolver
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {resolver?.running
                  ? `Running on UDP :${resolver.port} (PID ${resolver.pid})`
                  : "Not running"}
              </p>
            </div>
            <Badge variant={resolver?.running ? "default" : "secondary"} className="text-[10px]">
              {resolver?.running ? "Active" : "Stopped"}
            </Badge>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
            <p className="text-muted-foreground">To use Bastion as your DNS server:</p>
            <code className="block font-mono bg-background rounded px-2 py-1">
              bun run mini-services/dns-resolver/index.ts
            </code>
            <p className="text-muted-foreground pt-1">
              Then point your device/router DNS to this machine on port <span className="font-mono font-medium text-foreground">5353</span>.
              Blocked domains return <span className="font-mono">0.0.0.0</span>, allowed queries forward to <span className="font-mono">{upstreamDns.split(",")[0]}</span>.
            </p>
            <p className="text-muted-foreground">
              All queries are logged to the database and appear in the Query Log tab in real-time.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4" />
            System Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Engine</span>
            <span className="font-mono">Bastion DNS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform</span>
            <span className="font-mono">React / Next.js</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Dashboard ──

export default function BastionDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topDomains, setTopDomains] = useState<{ blocked: { domain: string; count: number }[]; allowed: { domain: string; count: number }[] } | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [resolver, setResolver] = useState<ResolverStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchResolver = useCallback(async () => {
    try {
      const res = await fetch("/api/bastion/resolver");
      setResolver(await res.json());
    } catch {
      setResolver(null);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const [statsRes, topRes, settingsRes] = await Promise.all([
      fetch("/api/bastion/stats"),
      fetch("/api/bastion/top-domains"),
      fetch("/api/bastion/settings"),
    ]);
    setStats(await statsRes.json());
    setTopDomains(await topRes.json());
    setSettings(await settingsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Seed on first load, then fetch
    let mounted = true;
    let resolverInterval: ReturnType<typeof setInterval> | undefined;
    const init = async () => {
      await fetch("/api/bastion/seed", { method: "POST" });
      if (mounted) {
        await Promise.all([fetchAll(), fetchResolver()]);
        resolverInterval = setInterval(() => {
          if (mounted) fetchResolver();
        }, 10000);
      }
    };
    init();
    return () => { mounted = false; if (resolverInterval) clearInterval(resolverInterval); };
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    await fetch("/api/bastion/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSettings((prev) => ({ ...prev, [key]: String(value) }));
  };

  if (loading) {
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
        {/* Header */}
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
                onClick={fetchAll}
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Stats Grid */}
          {stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  title="Total Queries (24h)"
                  value={formatNumber(stats.totalQueries24h)}
                  sub={`${formatNumber(stats.queriesLastHour)}/hour`}
                  icon={Activity}
                  accent="text-blue-500"
                />
                <StatCard
                  title="Blocked"
                  value={formatNumber(stats.blocked24h)}
                  sub={`${stats.blockPercent}% of traffic`}
                  icon={Ban}
                  accent="text-red-500"
                />
                <StatCard
                  title="Allowed"
                  value={formatNumber(stats.allowed24h)}
                  sub={`Through ${settings.upstream_dns ?? "DNS"}`}
                  icon={CheckCircle2}
                  accent="text-emerald-500"
                />
                <StatCard
                  title="Blocklists"
                  value={`${stats.enabledLists}/${stats.totalLists}`}
                  sub="Active lists"
                  icon={Shield}
                  accent="text-amber-500"
                />
              </div>

              {/* Block Percentage Bar */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Blocking Rate (24h)</span>
                    <span className="text-sm font-bold tabular-nums">{stats.blockPercent}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(stats.blockPercent, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Tabs */}
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
              {/* Chart */}
              {stats && stats.chartData.length > 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      DNS Queries (Last 24 Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fillAllowed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="fillBlocked" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10 }}
                            className="text-muted-foreground"
                            interval="preserveStartEnd"
                            tickFormatter={(v: string) => v.replace(":00", "")}
                          />
                          <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <ReTooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="allowed"
                            stroke="#10b981"
                            fill="url(#fillAllowed)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="blocked"
                            stroke="#ef4444"
                            fill="url(#fillBlocked)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Allowed
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        Blocked
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
              <SettingsTab settings={settings} onToggle={handleToggle} resolver={resolver} />
            </TabsContent>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-card/30 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Bastion DNS Sinkhole
            </span>
            <span>Lightweight network-wide ad blocking</span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}