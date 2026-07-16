"use client";

import { Shield, AlertTriangle, Settings, Mail, ExternalLink, MessageSquare, FileKey, CheckCircle2, Clock, Server } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";

function BlockedContent() {
  const params = useSearchParams();
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason");

  const [contact, setContact] = useState<{
    enabled: boolean;
    label: string;
    type: string;
    value: string;
  } | null>(null);

  const [caStatus, setCaStatus] = useState<{ exists: boolean } | null>(null);

  // Customizable text from settings
  const [pageTitle, setPageTitle] = useState("Domain Blocked");
  const [pageMessage, setPageMessage] = useState("Your network uses a blocking service");

  useEffect(() => {
    fetch("/api/bastion/settings")
      .then((r) => r.json())
      .then((s) => {
        // Contact info
        if (s.contact_enabled === "true") {
          setContact({
            enabled: true,
            label: s.contact_label || "Contact IT Support",
            type: s.contact_type || "text",
            value: s.contact_value || "",
          });
        }
        // Customizable text
        if (s.block_page_title) setPageTitle(s.block_page_title);
        if (s.block_page_message) setPageMessage(s.block_page_message);
      })
      .catch(() => {});

    // Check CA status
    fetch("/api/bastion/ca/status")
      .then((r) => r.json())
      .then((s) => setCaStatus(s))
      .catch(() => {});
  }, []);

  function ContactLink({
    label,
    type,
    value,
  }: {
    label: string;
    type: string;
    value: string;
  }) {
    const Icon = type === "email" ? Mail : type === "url" ? ExternalLink : MessageSquare;
    if (type === "email") {
      return (
        <a
          href={`mailto:${value}`}
          className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </a>
      );
    }
    if (type === "url") {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </a>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {value}
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 border-2 border-border flex items-center justify-center rounded-2xl bg-card shadow-sm">
          <Shield className="h-10 w-10 text-destructive" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground">{pageMessage}</p>
        </div>

        {/* Blocked Domain Card */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                Blocked Domain
              </p>
              <code className="text-sm font-mono font-semibold bg-muted/50 rounded px-2 py-1 block break-all">
                {domain}
              </code>
            </div>
          </div>

          {reason ? (
            <div className="flex items-center justify-between text-xs border-t border-border pt-3">
              <span className="text-muted-foreground">Blocked by</span>
              <span className="font-medium text-foreground bg-destructive/5 px-2 py-0.5 rounded">
                {reason}
              </span>
            </div>
          ) : caStatus?.exists ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                Blocked via Bastion with <span className="font-medium text-foreground">signed TLS certificate</span>
              </span>
            </div>
          ) : null}

          {!reason && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Settings className="h-3 w-3" />
                Set up Certificate Authority to see block reasons
              </Link>
            </div>
          )}
        </div>

        {/* CA Status Indicator */}
        {caStatus?.exists && reason && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-left shadow-sm">
            <div className="flex items-center gap-2">
              <FileKey className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Secure Block Page</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" />
                TLS Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              This page was delivered with a dynamically generated TLS certificate signed
              by the Bastion root CA. Your connection to this blocked domain is secure.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Generated on request
              </span>
              <span className="inline-flex items-center gap-1">
                <Server className="h-3 w-3" />
                Bastion DNS
              </span>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {contact && contact.value && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">
              This domain was blocked by your network administrator.
            </p>
            <ContactLink label={contact.label} type={contact.type} value={contact.value} />
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground border-t border-border pt-4">
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
