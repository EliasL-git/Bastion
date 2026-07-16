"use client";

import { useState } from "react";
import { ShieldOff, Plus, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useBlocklists } from "./hooks";

export function BlocklistsTab() {
  const { lists, loading, toggle, remove, add, refresh } = useBlocklists();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEntries, setNewEntries] = useState("");

  const handleAdd = async () => {
    if (!newName || !newEntries) return;
    await add(newName, newEntries);
    setNewName("");
    setNewEntries("");
    setAddOpen(false);
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
              <Button onClick={handleAdd}>Create</Button>
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
                      onCheckedChange={() => toggle(list.id, list.enabled)}
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
                      onClick={() => remove(list.id)}
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
