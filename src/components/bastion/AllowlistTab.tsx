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

  const handleAdd = () => {
    add(newDomain, newNote || undefined);
    setNewDomain("");
    setNewNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Domain to allow (e.g. safe-analytics.com)"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="sm:max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Input
          placeholder="Note (optional)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="sm:max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd} className="gap-1.5 w-fit">
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
                  onClick={() => remove(e.id)}
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
