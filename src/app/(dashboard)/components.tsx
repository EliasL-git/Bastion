"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
  import {
  Shield, ShieldOff, Activity, Eye, Globe, Ban,
  TrendingUp, Clock, Server, Plus, Trash2, RefreshCw,
  Settings, Search, ChevronLeft, ChevronRight, ExternalLink,
  CheckCircle2, Download, Wifi, Radio, Monitor, BarChart3,
  PenLine, Save, LogOut, Gauge, Users, BookOpen, Laptop, Smartphone,
  Mail, MessageSquare,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

export const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export interface ChartPoint { time: string; allowed: number; blocked: number }
export interface TopClient { clientIp: string; total: number; blockedCount: number; allowedCount: number }
export interface QueryTypeDist { type: string; count: number }

export interface Stats {
  totalQueries: number; blockedCount: number; allowedCount: number;
  queriesLastHour: number; uniqueClients: number; blockPercent: number;
  enabledLists: number; totalLists: number; blockingEnabled: boolean;
  topBlockedDomain: string; topBlockedCount: number;
  topClients: TopClient[]; queryTypeDistribution: QueryTypeDist[];
  chartData: ChartPoint[]; range: string;
}

export interface QueryEntry { id: string; domain: string; clientIp: string; queryType: string; status: string; list: string | null; createdAt: string }
export interface BlocklistEntry { id: string; name: string; enabled: boolean; source: string | null; entryCount: number }
export interface AllowlistEntry { id: string; domain: string; note: string | null }
export interface ResolverStatus { running: boolean; pid: string | null; port: number; status: string }

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function extractDomain(full: string): string {
  const parts = full.split(".");
  if (parts.length > 2) return parts.slice(-2).join(".");
  return full;
}

export function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function StatCard({ title, value, sub, icon: Icon }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="rounded-lg p-2.5 bg-muted/50 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QueryLog({ refreshInterval }: { refreshInterval: number }) {
  const [queries, setQueries] = useState<QueryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalPages = Math.ceil(total / 50);

  const fetchQueries = useCallback(async (p: number, s: string, q: string) => {
    const params = new URLSearchParams({ page: String(p), limit: "50", status: s, search: q });
    const res = await fetch(`/api/bastion/queries?${params}`);
    const data = await res.json();
    setQueries(data.queries);
    setTotal(data.total);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => { setLoading(true); await fetchQueries(page, status, search); if (mounted) setLoading(false); };
    load();
    return () => { mounted = false; };
  }, [page, status, search, fetchQueries]);

  useEffect(() => {
    if (refreshInterval <= 0) { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } return; }
    intervalRef.current = setInterval(() => { fetchQueries(1, status, search); }, refreshInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshInterval, status, search, fetchQueries]);

  const handleRefresh = () => fetchQueries(page, status, search);

  const exportCsv = async () => {
    const params = new URLSearchParams({ page: "1", limit: String(total), status, search });
    const res = await fetch(`/api/bastion/queries?${params}`);
    const data = await res.json();
    const header = "Time,Domain,Client IP,Type,Status,List";
    const rows = data.queries.map((q: QueryEntry) => [q.createdAt, q.domain, q.clientIp, q.queryType, q.status, q.list ?? ""].map(csvEscape).join(","));
    const blob = new Blob([header, ...rows].join("\n"), { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bastion-queries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Query Log
            {refreshInterval > 0 && <span className="flex items-center gap-1 text-xs text-emerald-600 font-normal"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span>}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search domain or IP..." className="h-9 w-40 lg:w-52 pl-8 text-sm" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["all", "allowed", "blocked"] as const).map((s) => (
                <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-2.5 py-1.5 font-medium transition-colors capitalize ${
                    status === s ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground"
                  }`}>{s}</button>
              ))}
            </div>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={exportCsv}><Download className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Export CSV</TooltipContent></Tooltip>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleRefresh}>
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
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : queries.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No queries found</td></tr>
              ) : (
                queries.map((q) => (
                  <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums whitespace-nowrap">{timeAgo(q.createdAt)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs max-w-[200px] truncate">{q.domain}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">{q.clientIp}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{q.queryType}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {q.status === "blocked" ? (
                        <Badge variant="destructive" className="text-[10px] gap-1"><Ban className="h-2.5 w-2.5" />{q.list ?? "Blocked"}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-2.5 w-2.5" />Allowed</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{total} queries</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-xs px-2 tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopDomains({ data }: { data: { blocked: { domain: string; count: number }[]; allowed: { domain: string; count: number }[] } | null }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" />Top Blocked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.blocked.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">{d.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-emerald-500" />Top Allowed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.allowed.slice(0, 7).map((d, i) => (
            <div key={d.domain} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                <span className="font-mono text-xs truncate">{extractDomain(d.domain)}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums ml-2">{d.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientInsights({ clients }: { clients: TopClient[] }) {
  if (!clients || clients.length === 0) return null;
  const maxTotal = Math.max(...clients.map(c => c.total));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Top Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {clients.map((c) => (
          <div key={c.clientIp}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono text-muted-foreground">{c.clientIp}</span>
              <span className="tabular-nums">{c.total} queries</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(c.allowedCount / maxTotal) * 100}%` }} />
              <div className="h-full bg-red-500 transition-all" style={{ width: `${(c.blockedCount / maxTotal) * 100}%` }} />
            </div>
            <div className="flex gap-3 text-[10px] text-muted-foreground mt-0.5">
              <span>{c.allowedCount} allowed</span>
              <span>{c.blockedCount} blocked</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function QueryTypeChart({ data }: { data: QueryTypeDist[] }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Query Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 5, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} className="text-muted-foreground" width={55} />
              <ReTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BlocklistsTab() {
  const [lists, setLists] = useState<BlocklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEntries, setEditEntries] = useState("");
  const [editName, setEditName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newEntries, setNewEntries] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/bastion/blocklists");
    setLists(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const toggleList = async (id: string, enabled: boolean) => {
    await fetch(`/api/bastion/blocklists/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled }) });
    fetchLists();
  };

  const deleteList = async (id: string) => {
    await fetch(`/api/bastion/blocklists/${id}`, { method: "DELETE" });
    fetchLists();
  };

  const saveEntries = async (id: string) => {
    await fetch(`/api/bastion/blocklists/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries: editEntries, name: editName }) });
    setEditId(null);
    fetchLists();
  };

  const addList = async () => {
    if (!newName) return;
    await fetch("/api/bastion/blocklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, source: newSource || "custom", entries: newEntries }),
    });
    setNewName(""); setNewSource(""); setNewEntries(""); setAddOpen(false);
    fetchLists();
  };

  const startEdit = async (id: string) => {
    const res = await fetch(`/api/bastion/blocklists/${id}`);
    const list = await res.json();
    setEditName(list.name); setEditEntries(list.entries); setEditId(id);
  };

  const downloadList = (list: BlocklistEntry) => {
    const blob = new Blob([`${list.name}\n\n${list.entries}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${list.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const refreshList = async (id: string) => {
    setRefreshing(id);
    try {
      await fetch(`/api/bastion/blocklists/${id}`, { method: "POST" });
    } catch {}
    setRefreshing(null);
    fetchLists();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Blocklists ({lists.length})</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Blocklist</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>List Name</Label><Input placeholder="e.g. OISD Big" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Source URL <span className="text-muted-foreground font-normal">(domains fetched automatically)</span></Label><Input placeholder="https://big.oisd.nl/domains" value={newSource} onChange={(e) => setNewSource(e.target.value)} className="font-mono text-xs" /></div>
              {newSource ? (
                <p className="text-xs text-muted-foreground">Domains will be fetched from the URL. The textarea below is optional for manual additions.</p>
              ) : null}
              <div className="space-y-2"><Label>Manual Domains <span className="text-muted-foreground font-normal">(optional if URL is set)</span></Label><Textarea rows={8} placeholder={"ad.example.com\ntracker.example.net"} value={newEntries} onChange={(e) => setNewEntries(e.target.value)} className="font-mono text-xs" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
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
            <Card key={list.id}>
              <CardContent className="p-4">
                {editId === list.id ? (
                  <div className="space-y-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm font-medium" />
                    <Textarea rows={8} value={editEntries} onChange={(e) => setEditEntries(e.target.value)} className="font-mono text-xs" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => saveEntries(list.id)} className="gap-1"><Save className="h-3.5 w-3.5" /> Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch checked={list.enabled} onCheckedChange={() => toggleList(list.id, list.enabled)} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{list.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.entryCount} domains
                          {list.source && list.source !== "custom" && (
                            <span className="ml-2 inline-flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" />{list.source.length > 40 ? list.source.slice(0, 40) + "..." : list.source}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {list.source && list.source !== "custom" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => refreshList(list.id)} disabled={refreshing === list.id}>
                              <RefreshCw className={`h-3.5 w-3.5 ${refreshing === list.id ? "animate-spin" : ""}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Refresh from source</TooltipContent>
                        </Tooltip>
                      )}
                      <Badge variant={list.enabled ? "default" : "secondary"} className="text-[10px]">{list.enabled ? "Active" : "Disabled"}</Badge>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => startEdit(list.id)}><PenLine className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => downloadList(list)}><Download className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Download</TooltipContent></Tooltip>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteList(list.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function AllowlistTab() {
  const [entries, setEntries] = useState<AllowlistEntry[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newNote, setNewNote] = useState("");

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/bastion/allowlist");
    setEntries(await res.json());
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async () => {
    if (!newDomain) return;
    await fetch("/api/bastion/allowlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: newDomain, note: newNote }) });
    setNewDomain(""); setNewNote(""); fetchEntries();
  };

  const removeEntry = async (id: string) => {
    await fetch(`/api/bastion/allowlist/${id}`, { method: "DELETE" });
    fetchEntries();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Domain to allow" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} className="sm:max-w-xs" onKeyDown={(e) => e.key === "Enter" && addEntry()} />
        <Input placeholder="Note (optional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="sm:max-w-xs" onKeyDown={(e) => e.key === "Enter" && addEntry()} />
        <Button size="sm" onClick={addEntry} className="gap-1.5 w-fit"><Plus className="h-3.5 w-3.5" /> Add</Button>
      </div>
      {entries.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No allowlisted domains yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Domains here bypass all blocklists.</p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm truncate">{e.domain}</p>
                  {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeEntry(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SetupGuideDialog({ serverIp, port }: { serverIp: string; port: number }) {
  const [platform, setPlatform] = useState("windows");
  const IP = serverIp || "localhost";

  const guides: Record<string, { icon: React.ElementType; title: string; steps: string[]; note?: string }> = {
    windows: {
      icon: Monitor, title: "Windows",
      steps: [
        `Open Control Panel → Network and Sharing Center → Change adapter settings`,
        `Right-click your network connection → Properties`,
        `Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties`,
        `Select "Use the following DNS server addresses"`,
        `Set Preferred DNS server to ${IP}`,
        `Set Alternate DNS server to 1.1.1.1 (fallback)`,
        `Click OK and close all windows`,
        `Run ipconfig /flushdns in Command Prompt to clear cache`,
      ],
      note: "Changes take effect immediately. No restart required.",
    },
    macos: {
      icon: Laptop, title: "macOS",
      steps: [
        `Open System Settings → Network`,
        `Select your active connection (Wi-Fi or Ethernet) → Details`,
        `Click the DNS tab`,
        `Click the + button and add ${IP}`,
        `Remove any existing DNS entries or keep ${IP} as the first`,
        `Click OK → Apply`,
      ],
      note: "You may need to flush DNS cache: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder",
    },
    linux: {
      icon: Monitor, title: "Linux",
      steps: [
        `Edit /etc/resolv.conf with sudo: sudo nano /etc/resolv.conf`,
        `Replace contents with:`,
        `  nameserver ${IP}`,
        `  nameserver 1.1.1.1`,
        `Save and exit (Ctrl+X, Y, Enter)`,
        `For NetworkManager: nmcli con mod "Connection Name" ipv4.dns "${IP}"`,
        `For systemd-resolved: sudo resolvectl dns <interface> ${IP}`,
      ],
      note: "Changes via resolv.conf may be overwritten by NetworkManager or systemd-resolved on reboot.",
    },
    router: {
      icon: Wifi, title: "Router",
      steps: [
        `Open your router's admin panel (usually http://192.168.1.1 or http://192.168.0.1)`,
        `Find the DHCP or LAN settings section`,
        `Look for "DNS Server" or "Primary DNS" field`,
        `Set Primary/Preferred DNS to ${IP}`,
        `Set Secondary/Alternate DNS to 1.1.1.1`,
        `Save/Apply the settings`,
        `Reboot the router if prompted`,
      ],
      note: "Setting DNS at the router level will apply Bastion to ALL devices on your network automatically.",
    },
    android: {
      icon: Smartphone, title: "Android",
      steps: [
        `Open Settings → Wi-Fi`,
        `Long-press your connected network → Modify Network`,
        `Expand "Advanced options"`,
        `Change "IP settings" from DHCP to Static`,
        `Set DNS 1 to ${IP}`,
        `Set DNS 2 to 1.1.1.1`,
        `Tap Save`,
      ],
      note: "Some Android versions use Private DNS (DNS over TLS) which bypasses manual DNS. Disable Private DNS in Settings → Connections → More connection settings.",
    },
    ios: {
      icon: Smartphone, title: "iOS / iPadOS",
      steps: [
        `Open Settings → Wi-Fi`,
        `Tap the (i) icon next to your connected network`,
        `Scroll down and tap "Configure DNS"`,
        `Change from Automatic to Manual`,
        `Tap "Add Server" and enter ${IP}`,
        `Remove any existing DNS servers`,
        `Tap Save in the top-right corner`,
      ],
      note: "iOS DNS settings are per-network (Wi-Fi). Each network must be configured separately.",
    },
  };

  const current = guides[platform];
  const Icon = current.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Setup Guide</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Device Setup Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Point your device or router to <span className="font-mono font-medium text-foreground">{IP}:{port}</span> as the DNS server to start blocking ads and trackers network-wide.
          </p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(guides).map(([key, g]) => {
              const GIcon = g.icon;
              return (
                <Button key={key} variant={platform === key ? "default" : "outline"} size="sm" onClick={() => setPlatform(key)} className="gap-1.5">
                  <GIcon className="h-3.5 w-3.5" />{g.title}
                </Button>
              );
            })}
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Icon className="h-4 w-4" />{current.title}</p>
            <ol className="space-y-1.5">
              {current.steps.map((step, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-foreground font-medium shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {current.note && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{current.note}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CaInstallGuide({ serverIp }: { serverIp: string }) {
  const [platform, setPlatform] = useState("windows");

  const guides: Record<string, { icon: React.ElementType; title: string; steps: string[] }> = {
    windows: {
      icon: Monitor, title: "Windows",
      steps: [
        `Download bastion-root-ca.crt from the CA card above`,
        `Method 1 — Right-click the .crt file → Install Certificate:`,
        `  a. Select "Local Machine" → Next`,
        `  b. Choose "Place all certificates in the following store" → Browse`,
        `  c. Select "Trusted Root Certification Authorities" → OK → Finish`,
        `  d. Click Yes on the security warning`,
        `Method 2 — Using certlm.msc (if method 1 fails):`,
        `  a. Press Win+R, type certlm.msc → Enter`,
        `  b. Expand "Trusted Root Certification Authorities" → Certificates`,
        `  c. Right-click → All Tasks → Import → Next`,
        `  d. Browse to bastion-root-ca.crt → Next → Finish`,
        `Method 3 — PowerShell (one-liner, run as Admin):`,
        `  Import-Certificate -FilePath "$env:USERPROFILE\\Downloads\\bastion-root-ca.crt" -CertStoreLocation Cert:\\LocalMachine\\Root`,
        `Close and reopen all browser windows`,
        `The CA is now trusted — blocked HTTPS sites redirect without warnings`,
      ],
    },
    macos: {
      icon: Laptop, title: "macOS",
      steps: [
        `Download bastion-root-ca.crt from the CA card above`,
        `Double-click the .crt file in Downloads → Keychain Access opens`,
        `Locate "Bastion Root CA" in the login keychain list`,
        `Double-click the certificate → expand the Trust section`,
        `Set "When using this certificate" to "Always Trust"`,
        `Close the window → enter your password to save`,
        `The CA is now trusted — restart your browser`,
      ],
    },
    linux: {
      icon: Monitor, title: "Linux",
      steps: [
        `Download bastion-root-ca.crt from the CA card above`,
        `System-wide install (requires sudo):`,
        `  sudo cp ~/Downloads/bastion-root-ca.crt /usr/local/share/ca-certificates/`,
        `  sudo update-ca-certificates`,
        `Firefox (uses its own store):`,
        `  Preferences → Privacy & Security → Certificates → View Certificates`,
        `  Authorities → Import → select .crt`,
        `  Check "Trust this CA to identify websites" → OK`,
        `Chrome/Chromium (uses system store on most distros):`,
        `  If it still warns: Settings → Privacy & Security → Security`,
        `  Manage certificates → Authorities → Import`,
        `Restart your browser after installing`,
      ],
    },
    android: {
      icon: Smartphone, title: "Android",
      steps: [
        `Download bastion-root-ca.crt on your device`,
        `Open Settings → Security → Encryption & credentials`,
        `Tap "Install a certificate" → "CA certificate"`,
        `Navigate to Downloads and select bastion-root-ca.crt`,
        `Tap "Install anyway" on the warning → enter your PIN`,
        `The CA is trusted for apps targeting Android 7+`,
        `Restart Chrome if it's open`,
      ],
    },
    ios: {
      icon: Smartphone, title: "iOS / iPadOS",
      steps: [
        `Download bastion-root-ca.crt using Safari on your device`,
        `Go to Settings → General → VPN & Device Management`,
        `Tap the "Bastion Root CA" profile → Install (enter passcode)`,
        `Then go to Settings → General → About → Certificate Trust Settings`,
        `Enable the toggle next to "Bastion Root CA"`,
        `The CA is now trusted system-wide on iOS`,
      ],
    },
  };

  const current = guides[platform];
  const Icon = current.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Install Guide</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-4 w-4" /> Install CA Certificate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Install the Bastion Root CA on each device so that blocked HTTPS sites redirect
            without browser security warnings.
          </p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(guides).map(([key, g]) => {
              const GIcon = g.icon;
              return (
                <Button key={key} variant={platform === key ? "default" : "outline"} size="sm" onClick={() => setPlatform(key)} className="gap-1.5">
                  <GIcon className="h-3.5 w-3.5" />{g.title}
                </Button>
              );
            })}
          </div>
          <div className="rounded-lg bg-muted/30 border border-border p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2"><Icon className="h-4 w-4" />{current.title}</p>
            <ol className="space-y-1.5">
              {current.steps.map((step, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-foreground font-medium shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsTab({ settings, onToggle, onUpdateSetting, resolver, serverIp }: {
  settings: Record<string, string>; onToggle: (k: string, v: boolean) => void; onUpdateSetting: (k: string, v: string) => void; resolver: ResolverStatus | null; serverIp: string;
}) {
  const blockingEnabled = settings.blocking_enabled === "true";
  const queryLogging = settings.query_logging === "true";
  const upstreamDns = settings.upstream_dns ?? "1.1.1.1";
  const dnsPort = 53;
  const [dnsInput, setDnsInput] = useState(upstreamDns);
  const [caExists, setCaExists] = useState(false);
  const [caGenerating, setCaGenerating] = useState(false);
  useEffect(() => { setDnsInput(upstreamDns); }, [upstreamDns]);

  const checkCaStatus = useCallback(async () => {
    try { const r = await fetch("/api/bastion/ca/status"); const d = await r.json(); setCaExists(d.exists); } catch {}
  }, []);
  useEffect(() => { checkCaStatus(); }, [checkCaStatus]);

  const generateCa = async () => {
    setCaGenerating(true);
    try { await fetch("/api/bastion/ca/generate", { method: "POST" }); await checkCaStatus(); } catch {}
    setCaGenerating(false);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4" />DNS Blocking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Enable Blocking</p><p className="text-xs text-muted-foreground">Block queries matching blocklist domains</p></div>
            <Switch checked={blockingEnabled} onCheckedChange={(v) => onToggle("blocking_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Query Logging</p><p className="text-xs text-muted-foreground">Log all DNS queries for analysis</p></div>
            <Switch checked={queryLogging} onCheckedChange={(v) => onToggle("query_logging", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Server className="h-4 w-4" />Upstream DNS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">DNS servers used for non-blocked queries (comma-separated)</p>
          <div className="flex gap-2">
            <Input value={dnsInput} onChange={(e) => setDnsInput(e.target.value)} placeholder="1.1.1.1, 1.0.0.1" className="font-mono text-sm" />
            <Button variant="outline" size="sm" onClick={() => onUpdateSetting("upstream_dns", dnsInput)} className="shrink-0 gap-1"><Save className="h-3.5 w-3.5" /> Save</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["1.1.1.1, 1.0.0.1", "8.8.8.8, 8.8.4.4", "9.9.9.9, 149.112.112.112"].map((dns) => (
              <Badge key={dns} variant="outline" className="cursor-pointer font-mono text-xs" onClick={() => setDnsInput(dns)}>{dns}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Radio className="h-4 w-4" />DNS Resolver</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">{resolver?.running ? `Running on UDP :${resolver.port}` : "Not running"}</p>
            </div>
            <Badge variant={resolver?.running ? "default" : "secondary"} className="text-[10px]">{resolver?.running ? "Active" : "Stopped"}</Badge>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-2">
            <p className="text-muted-foreground">The built-in DNS proxy starts automatically with Bastion.</p>
            <p className="text-muted-foreground">
              Point your device/router DNS to <span className="font-mono font-medium text-foreground">{serverIp}:{dnsPort}</span>.
            </p>
            <div className="pt-1">
              <SetupGuideDialog serverIp={serverIp} port={dnsPort} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />Contact Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Show a contact message on the block page so users can report false positives.
          </p>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Enable Contact Card</p><p className="text-xs text-muted-foreground">Show contact info on blocked domain pages</p></div>
            <Switch checked={settings.contact_enabled === "true"} onCheckedChange={(v) => onToggle("contact_enabled", v)} />
          </div>
          {settings.contact_enabled === "true" && (
            <div className="space-y-3 border-t border-border pt-3">
              <div className="space-y-2">
                <Label>Button / Link Label</Label>
                <Input value={settings.contact_label || "Contact IT Support"} onChange={(e) => onUpdateSetting("contact_label", e.target.value)} placeholder="Contact IT Support" />
              </div>
              <div className="space-y-2">
                <Label>Contact Type</Label>
                <div className="flex rounded-md border border-border overflow-hidden text-xs w-fit">
                  {(["email", "url", "text"] as const).map((t) => (
                    <button key={t} onClick={() => onUpdateSetting("contact_type", t)}
                      className={`px-3 py-1.5 font-medium capitalize ${
                        (settings.contact_type || "text") === t ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted text-muted-foreground"
                      }`}>
                      {t === "email" ? <><Mail className="h-3 w-3 inline mr-1" />Email</> : t === "url" ? <><ExternalLink className="h-3 w-3 inline mr-1" />URL</> : <><MessageSquare className="h-3 w-3 inline mr-1" />Text</>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input value={settings.contact_value || ""} onChange={(e) => onUpdateSetting("contact_value", e.target.value)}
                  placeholder={settings.contact_type === "email" ? "it@company.com" : settings.contact_type === "url" ? "https://helpdesk.company.com" : "Call 555-0123 or visit IT desk"} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4" />Certificate Authority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Generate a root CA so blocked HTTPS sites redirect without browser warnings.
            The blocklist name will automatically appear on the block page when CA is active.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">CA Status</p>
              <p className="text-xs text-muted-foreground">{caExists ? "Root CA generated" : "Not generated"}</p>
            </div>
            <Badge variant={caExists ? "default" : "secondary"} className="text-[10px]">{caExists ? "Ready" : "Missing"}</Badge>
          </div>
          <div className="flex gap-2">
            {caExists ? (
              <>
                <a href="/api/bastion/ca/download" download="bastion-root-ca.crt">
                  <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Download CA</Button>
                </a>
                <CaInstallGuide serverIp={serverIp} />
              </>
            ) : (
              <Button size="sm" onClick={generateCa} disabled={caGenerating} className="gap-1.5">
                <Shield className="h-3.5 w-3.5" /> {caGenerating ? "Generating..." : "Generate Root CA"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><Wifi className="h-4 w-4" />System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Engine</span><span className="font-mono">Bastion DNS</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">0.1.0</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
