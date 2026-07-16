"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, ShieldCheck, Download, Plus, Trash2,
  Mail, ExternalLink, MessageSquare, Eye, RefreshCw,
  AlertTriangle, CheckCircle2, FileKey, Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SettingsMap } from "./types";

// ── Fetch helper ──

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── CA Status ──

interface CaStatus {
  exists: boolean;
}

// ── Blocked Page Preview ──

function BlockedPagePreview({
  domain,
  reason,
  contact,
}: {
  domain: string;
  reason: string;
  contact: { enabled: boolean; label: string; type: string; value: string } | null;
}) {
  const ContactIcon = contact?.type === "email" ? Mail : contact?.type === "url" ? ExternalLink : MessageSquare;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Block Page Preview
        </CardTitle>
        <CardDescription className="text-xs">
          How the block page appears to end users
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Preview frame */}
        <div className="bg-background min-h-[280px] flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="mx-auto w-14 h-14 border border-border flex items-center justify-center rounded-xl bg-card">
              <Shield className="h-7 w-7 text-destructive" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Domain Blocked</h2>
              <p className="text-xs text-muted-foreground">
                Your network uses a blocking service
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="font-mono text-xs break-all">{domain}</span>
              </div>
              {reason ? (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-2">
                  <span>Blocked by</span>
                  <span className="font-medium text-foreground">{reason}</span>
                </div>
              ) : null}
            </div>

            {contact?.enabled && contact.value ? (
              <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
                <p className="text-[11px] text-muted-foreground">
                  This domain was blocked by your network administrator.
                </p>
                <div className="inline-flex items-center gap-1.5 text-primary text-xs">
                  <ContactIcon className="h-3 w-3" />
                  <span>{contact.label}</span>
                </div>
              </div>
            ) : null}

            <p className="text-[10px] text-muted-foreground">
              Bastion DNS Sinkhole &mdash; Network-wide ad blocking
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ──

export function BlockPageTab({
  settings,
  updateSetting,
}: {
  settings: SettingsMap;
  updateSetting: (key: string, value: string) => void;
}) {
  // CA state
  const [caStatus, setCaStatus] = useState<CaStatus | null>(null);
  const [caLoading, setCaLoading] = useState(false);
  const [caGenerating, setCaGenerating] = useState(false);
  const [caError, setCaError] = useState<string | null>(null);

  // Contact settings state
  const contactEnabled = settings.contact_enabled === "true";
  const contactLabel = settings.contact_label ?? "Contact IT Support";
  const contactType = settings.contact_type ?? "email";
  const contactValue = settings.contact_value ?? "";

  // Block page custom message
  const blockTitle = settings.block_page_title ?? "Domain Blocked";
  const blockMessage = settings.block_page_message ?? "Your network uses a blocking service";

  // ── Check CA status ──

  const checkCaStatus = useCallback(async () => {
    setCaLoading(true);
    setCaError(null);
    try {
      const data = await apiJson<CaStatus>("/api/bastion/ca/status");
      setCaStatus(data);
    } catch (err: any) {
      setCaError(err.message);
    }
    setCaLoading(false);
  }, []);

  useEffect(() => {
    checkCaStatus();
  }, [checkCaStatus]);

  // ── Generate CA ──

  const generateCa = useCallback(async () => {
    setCaGenerating(true);
    setCaError(null);
    try {
      await apiJson("/api/bastion/ca/generate", { method: "POST" });
      setCaStatus({ exists: true });
    } catch (err: any) {
      setCaError(err.message);
    }
    setCaGenerating(false);
  }, []);

  // ── Download CA ──

  const downloadCa = useCallback(() => {
    window.open("/api/bastion/ca/download", "_blank");
  }, []);

  // ── Contact type icon ──

  const ContactIcon = contactType === "email" ? Mail : contactType === "url" ? ExternalLink : MessageSquare;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── CA Certificate Section ── */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileKey className="h-4 w-4" />
            Certificate Authority (CA)
          </CardTitle>
          <CardDescription className="text-xs">
            A root CA lets Bastion generate trusted TLS certificates on-the-fly,
            so blocked HTTPS domains show a branded block page instead of a browser
            certificate warning. Users install the CA once on their devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {caLoading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : caStatus?.exists ? (
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {caStatus?.exists ? "CA Certificate Ready" : "No CA Certificate"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {caStatus?.exists
                    ? "Bastion can now sign per-domain certificates for HTTPS interception"
                    : "Generate a root CA to enable HTTPS block pages with valid TLS certs"}
                </p>
              </div>
            </div>
            <Badge
              variant={caStatus?.exists ? "default" : "secondary"}
              className="text-[10px]"
            >
              {caStatus?.exists ? "Active" : "Missing"}
            </Badge>
          </div>

          {caError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {caError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!caStatus?.exists ? (
              <Button
                size="sm"
                onClick={generateCa}
                disabled={caGenerating}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                {caGenerating ? "Generating..." : "Generate Root CA"}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={downloadCa}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download CA Certificate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateCa}
                  disabled={caGenerating}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={checkCaStatus}
              disabled={caLoading}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Status
            </Button>
          </div>

          {/* Instructions */}
          {caStatus?.exists && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Globe className="h-3 w-3" />
                Install on client devices
              </p>
              <p className="text-muted-foreground">
                Download the CA certificate and install it as a trusted root on each device
                that uses Bastion as its DNS. On macOS, double-click the .crt file and add
                it to the System keychain as trusted. On Windows, import it into
                &quot;Trusted Root Certification Authorities&quot;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Block Page Appearance ── */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Block Page Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Customize what end users see when they visit a blocked domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Page Title</Label>
            <Input
              value={blockTitle}
              onChange={(e) => updateSetting("block_page_title", e.target.value)}
              className="h-8 text-sm"
              placeholder="Domain Blocked"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Page Message</Label>
            <Input
              value={blockMessage}
              onChange={(e) => updateSetting("block_page_message", e.target.value)}
              className="h-8 text-sm"
              placeholder="Your network uses a blocking service"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Contact Info Section ── */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact Information
          </CardTitle>
          <CardDescription className="text-xs">
            Show users how to reach the network administrator when a domain is blocked
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable contact */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show Contact Info</p>
              <p className="text-xs text-muted-foreground">
                Display contact details on the block page
              </p>
            </div>
            <Switch
              checked={contactEnabled}
              onCheckedChange={(v) => updateSetting("contact_enabled", String(v))}
            />
          </div>

          {contactEnabled && (
            <div className="space-y-3 pl-0 border-l-2 border-primary/20 pl-3">
              {/* Label */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Button / Link Label</Label>
                <Input
                  value={contactLabel}
                  onChange={(e) => updateSetting("contact_label", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Contact IT Support"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Contact Type</Label>
                <Select
                  value={contactType}
                  onValueChange={(v) => updateSetting("contact_type", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Email
                      </span>
                    </SelectItem>
                    <SelectItem value="url">
                      <span className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" />
                        URL / Website
                      </span>
                    </SelectItem>
                    <SelectItem value="text">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        Text / Phone
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {contactType === "email"
                    ? "Email Address"
                    : contactType === "url"
                      ? "Website URL"
                      : "Contact Value"}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ContactIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={contactValue}
                    onChange={(e) => updateSetting("contact_value", e.target.value)}
                    className="h-8 text-sm"
                    placeholder={
                      contactType === "email"
                        ? "admin@example.com"
                        : contactType === "url"
                          ? "https://support.example.com"
                          : "+1-555-0123"
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Block Page Preview ── */}
      <BlockedPagePreview
        domain="ads.example.com"
        reason="StevenBlack Unified Ads"
        contact={
          contactEnabled
            ? { enabled: true, label: contactLabel, type: contactType, value: contactValue }
            : null
        }
      />
    </div>
  );
}
