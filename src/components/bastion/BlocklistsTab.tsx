"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useBlocklists } from "./hooks";

export function BlocklistsTab() {
  const { lists, loading, toggle, remove, add } = useBlocklists();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEntries, setNewEntries] = useState("");

  const handleAdd = async () => {
    if (!newName || !newEntries) return;
    await add(newName, newEntries);
    setNewName(""); setNewEntries(""); setAddOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocklists ({lists.length})</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Add List</Button>
          </DialogTrigger>
          <DialogContent className="border-border/60 bg-card">
            <DialogHeader><DialogTitle className="text-base">Add Blocklist</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label className="text-xs uppercase tracking-wide text-muted-foreground">List Name</Label><Input placeholder="e.g. My Custom Blocklist" value={newName} onChange={(e) => setNewName(e.target.value)} className="border-border/60 bg-secondary/50" /></div>
              <div className="space-y-2"><Label className="text-xs uppercase tracking-wide text-muted-foreground">Domains (one per line)</Label><Textarea rows={8} placeholder={"ad.example.com\ntracker.example.net"} value={newEntries} onChange={(e) => setNewEntries(e.target.value)} className="border-border/60 bg-secondary/50 font-mono text-xs" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" className="border-border/60 bg-secondary/50">Cancel</Button></DialogClose>
              <Button onClick={handleAdd}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="border-border/60 bg-card/60 py-10 text-center text-muted-foreground">Loading blocklists...</Card>
      ) : (
        <div className="grid gap-3">
          {lists.map((list) => (
            <Card key={list.id} className="group border-border/60 bg-card/60 transition-all hover:border-primary/20 hover:bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Switch checked={list.enabled} onCheckedChange={() => toggle(list.id, list.enabled)} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{list.name}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{list.entryCount.toLocaleString()} domains</span>
                        {list.source && list.source !== "custom" && (
                          <span className="inline-flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /><span className="max-w-[180px] truncate">{list.source.length > 40 ? list.source.slice(0, 40) + "..." : list.source}</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${list.enabled ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-border/60 bg-secondary/50 text-muted-foreground"}`}>{list.enabled ? "Active" : "Disabled"}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400" onClick={() => remove(list.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
