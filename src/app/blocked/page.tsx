"use client";

import { Shield, AlertTriangle, Settings, Mail, ExternalLink, MessageSquare, FileKey, CheckCircle2, Clock, Server } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";

function ContactLink({ label, type, value }: { label: string; type: string; value: string }) {
  const Icon = type === "email" ? Mail : type === "url" ? ExternalLink : MessageSquare;
  if (type === "email") return <a href={`mailto:${value}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Icon className="h-3.5 w-3.5" />{label}</a>;
  if (type === "url") return <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Icon className="h-3.5 w-3.5" />{label}</a>;
  return <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-3.5 w-3.5" />{value}</span>;
}

function BlockedContent() {
  const params = useSearchParams();
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason");
  const [contact, setContact] = useState<{ enabled: boolean; label: string; type: string; value: string } | null>(null);
  const [caStatus, setCaStatus] = useState<{ exists: boolean } | null>(null);
  const [pageTitle, setPageTitle] = useState("Domain Blocked");
  const [pageMessage, setPageMessage] = useState("Your network uses a blocking service");

  useEffect(() => {
    fetch("/api/bastion/settings").then((r) => r.json()).then((s) => {
      if (s.contact_enabled === "true") setContact({ enabled: true, label: s.contact_label || "Contact IT Support", type: s.contact_type || "text", value: s.contact_value || "" });
      if (s.block_page_title) setPageTitle(s.block_page_title);
      if (s.block_page_message) setPageMessage(s.block_page_message);
    }).catch(() => {});
    fetch("/api/bastion/ca/status").then((r) => r.json()).then((s) => setCaStatus(s)).catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-card/60 shadow-glow-sm"><Shield className="h-10 w-10 text-rose-400" /></div>
        <div className="space-y-2"><h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1><p className="text-sm text-muted-foreground">{pageMessage}</p></div>

        <div className="space-y-4 rounded-xl border border-border/60 bg-card/60 p-5 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocked Domain</p>
              <code className="block break-all rounded-md bg-secondary/50 px-2 py-1 font-mono text-sm font-semibold">{domain}</code>
            </div>
          </div>
          {reason ? (
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs"><span className="text-muted-foreground">Blocked by</span><span className="rounded bg-rose-500/10 px-2 py-0.5 font-medium text-rose-400">{reason}</span></div>
          ) : caStatus?.exists ? (
            <div className="flex items-center gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span>Blocked via Bastion with <span className="font-medium text-foreground">signed TLS certificate</span></span></div>
          ) : null}
          {!reason && (
            <div className="flex items-center justify-center gap-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline"><Settings className="h-3 w-3" />Set up Certificate Authority to see block reasons</Link>
            </div>
          )}
        </div>

        {caStatus?.exists && reason && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left shadow-sm">
            <div className="flex items-center gap-2"><FileKey className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium">Secure Block Page</span><span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" /> TLS Active</span></div>
            <p className="text-xs text-muted-foreground">This page was delivered with a dynamically generated TLS certificate signed by the Bastion root CA. Your connection to this blocked domain is secure.</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Generated on request</span><span className="inline-flex items-center gap-1"><Server className="h-3 w-3" />Bastion DNS</span></div>
          </div>
        )}

        {contact && contact.value && (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">This domain was blocked by your network administrator.</p>
            <ContactLink label={contact.label} type={contact.type} value={contact.value} />
          </div>
        )}

        <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">Bastion DNS Sinkhole &mdash; Network-wide ad blocking</p>
      </div>
    </main>
  );
}

export default function BlockedPage() {
  return (
    <Suspense><BlockedContent /></Suspense>
  );
}
