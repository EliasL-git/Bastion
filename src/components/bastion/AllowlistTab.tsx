"use client";

import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAllowlist } from "./hooks";
import { useState } from "react";

export function AllowlistTab() {
  const { entries, add, remove } = useAllowlist();
  const [newDomain, setNewDomain] = useState("");
  const [newNote, setNewNote] = useState("");

  const handleAdd = () => { add(newDomain, newNote || undefined); setNewDomain(""); setNewNote(""); };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/60">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <Input placeholder="Domain to allow (e.g. safe-analytics.com)" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="border-border/60 bg-secondary/50 sm:max-w-xs" />
          <Input placeholder="Note (optional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="border-border/60 bg-secondary/50 sm:max-w-xs" />
          <Button size="sm" onClick={handleAdd} className="w-fit gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Add</Button>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card className="border-border/60 bg-card/60 py-10 text-center text-muted-foreground"><p>No allowlisted domains yet.</p><p className="mt-1 text-xs">Domains here will bypass all blocklists.</p></Card>
      ) : (
        <div className="grid gap-2">
          {entries.map((e) => (
            <Card key={e.id} className="border-border/60 bg-card/60 transition-all hover:border-emerald-500/20">
              <CardContent className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-emerald-400">{e.domain}</p>
                  {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400" onClick={() => remove(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
