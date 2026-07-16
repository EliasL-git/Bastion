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
  const {
    queries, page, total, totalPages, loading,
    status, search,
    refresh, goToPage, setFilterStatus, setFilterSearch,
  } = useQueries();

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
                onChange={(e) => setFilterSearch(e.target.value)}
              />
            </div>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              {(["all", "allowed", "blocked"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
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
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={refresh}>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {total} queries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2 tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
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
