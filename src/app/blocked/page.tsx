"use client";

import { Shield, AlertTriangle, Settings, Mail, ExternalLink, MessageSquare } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";

function BlockedContent() {
  const params = useSearchParams();
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason");
  const [contact, setContact] = useState<{ enabled: boolean; label: string; type: string; value: string } | null>(null);

  useEffect(() => {
    fetch("/api/bastion/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.contact_enabled === "true") {
          setContact({
            enabled: true,
            label: s.contact_label || "Contact IT Support",
            type: s.contact_type || "text",
            value: s.contact_value || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  function ContactLink({ label, type, value }: { label: string; type: string; value: string }) {
    const Icon = type === "email" ? Mail : type === "url" ? ExternalLink : MessageSquare;
    if (type === "email") {
      return (
        <a href={`mailto:${value}`} className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs">
          <Icon className="h-3 w-3" />{label}
        </a>
      );
    }
    if (type === "url") {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs">
          <Icon className="h-3 w-3" />{label}
        </a>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />{value}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 border border-border flex items-center justify-center rounded-xl bg-card">
          <Shield className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Domain Blocked</h1>
          <p className="text-sm text-muted-foreground">Your network uses Bastion, a blocking service</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span className="font-mono text-foreground break-all">{domain}</span>
          </div>
          {reason ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
              <span>Blocked by</span>
              <span className="font-medium text-foreground">{reason}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
              <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline">
                <Settings className="h-3 w-3" />
                Set up Certificate Authority to see block reasons
              </Link>
            </div>
          )}
        </div>

        {contact && contact.value && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground">This domain was blocked by your network administrator.</p>
            <ContactLink label={contact.label} type={contact.type} value={contact.value} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Bastion DNS Sinkhole &mdash; Network-wide ad blocking
        </p>
      </div>
    </main>
  );
}

export default function BlockedPage() {
  return (
    <Suspense>
      <BlockedContent />
    </Suspense>
  );
}
