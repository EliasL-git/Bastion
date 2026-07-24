"use client";

import { Activity, Search, RefreshCw, ChevronLeft, ChevronRight, Ban, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueries } from "./hooks";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function QueryLog() {
  const { queries, page, total, totalPages, loading, status, search, refresh, goToPage, setFilterStatus, setFilterSearch } = useQueries();

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><Activity className="h-4 w-4 text-primary" /> Query Log</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Filter domains..." className="h-9 w-48 border-border/60 bg-secondary/50 pl-8 text-sm" value={search} onChange={(e) => setFilterSearch(e.target.value)} />
            </div>
            <div className="flex overflow-hidden rounded-md border border-border/60 text-xs">
              {(["all", "allowed", "blocked"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 font-medium capitalize transition-colors ${status === s ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{s}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-9 w-9 border-border/60 bg-secondary/50 p-0" onClick={refresh}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="max-h-[440px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur-sm">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domain</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Client</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground">Loading queries...</td></tr>
              ) : queries.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground">No queries found</td></tr>
              ) : (
                queries.map((q) => (
                  <tr key={q.id} className="border-b border-border/40 transition-colors hover:bg-secondary/30">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs tabular-nums text-muted-foreground">{timeAgo(q.createdAt)}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs">{q.domain}</td>
                    <td className="hidden px-4 py-2.5 text-xs tabular-nums text-muted-foreground md:table-cell">{q.clientIp}</td>
                    <td className="hidden px-4 py-2.5 lg:table-cell"><Badge variant="outline" className="border-border/60 px-1.5 py-0 text-[10px] font-mono">{q.queryType}</Badge></td>
                    <td className="px-4 py-2.5">
                      {q.status === "blocked" ? (
                        <Badge className="gap-1 border-rose-500/20 bg-rose-500/10 text-[10px] text-rose-400 hover:bg-rose-500/20"><Ban className="h-2.5 w-2.5" />{q.list ?? "Blocked"}</Badge>
                      ) : (
                        <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-400 hover:bg-emerald-500/20"><CheckCircle2 className="h-2.5 w-2.5" /> Allowed</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
            <span className="text-xs text-muted-foreground">{total.toLocaleString()} queries</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 border-border/60 bg-secondary/50" disabled={page <= 1} onClick={() => goToPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="px-2 text-xs tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-7 w-7 border-border/60 bg-secondary/50" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
