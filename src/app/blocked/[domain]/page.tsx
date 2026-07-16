"use client";

import {
  Shield, ShieldOff, ArrowLeft, ExternalLink, Clock, Globe,
  Server, Lock, Search, AlertTriangle, CheckCircle2,
  FileText, Ban, Bug,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BlockLookupResult {
  domain: string;
  blocked: boolean;
  list: string | null;
  category: string;
  allowlisted: boolean;
  allowlistNote: string | null;
  timestamp: string;
}

interface CertInfo {
  issuer: string | null;
  subject: string | null;
  expiry: string | null;
  valid: boolean;
}

const categoryConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ads:      { label: "Ad / Tracking Network", color: "text-orange-600",  bg: "bg-orange-500/10",  border: "border-orange-500/30" },
  tracking: { label: "User Tracking",         color: "text-purple-600",  bg: "bg-purple-500/10",  border: "border-purple-500/30" },
  malware:  { label: "Malware / Phishing",    color: "text-red-600",     bg: "bg-red-500/10",     border: "border-red-500/30" },
  custom:   { label: "Custom Blocklist",      color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/30" },
};

function classifyCategory(listName: string): string {
  const n = listName.toLowerCase();
  if (n.includes("malware") || n.includes("phishing") || n.includes("ransomware")) return "malware";
  if (n.includes("track") || n.includes("analytics")) return "tracking";
  if (n.includes("ad")) return "ads";
  return "custom";
}

function DomainSearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Check a domain (e.g. doubleclick.net)"
          className="pl-9 h-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <Button onClick={onSearch} className="h-10 px-5">
        Check
      </Button>
    </div>
  );
}

function ResultBanner({
  blocked,
  allowlisted,
  domain,
  list,
  category,
}: {
  blocked: boolean;
  allowlisted: boolean;
  domain: string;
  list: string | null;
  category: string;
}) {
  const cat = categoryConfig[category] ?? categoryConfig.custom;

  if (blocked) {
    return (
      <div className={cn("rounded-xl border-2 p-6 flex items-start gap-5", cat.border, cat.bg)}>
        <div className={cn("rounded-full p-3.5 shrink-0", cat.bg)}>
          <Ban className={cn("h-7 w-7", cat.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-xl font-bold">Domain Blocked</h1>
            <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
          </div>
          <code className="block text-base font-mono bg-background/80 rounded-lg px-3 py-2 break-all border border-border/50">
            {domain}
          </code>
          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5 flex-wrap">
            <span>This domain matched</span>
            <span className="font-medium text-foreground">{list ?? "a blocklist"}</span>
            <Badge variant="outline" className={cn("text-[10px]", cat.color)}>
              {cat.label}
            </Badge>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your network administrator has restricted access to this domain.
            If you believe this is a mistake, please contact them.
          </p>
        </div>
      </div>
    );
  }

  if (allowlisted) {
    return (
      <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 flex items-start gap-5">
        <div className="rounded-full p-3.5 bg-emerald-500/10 shrink-0">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-xl font-bold">Domain is Allowlisted</h1>
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Allowed
            </Badge>
          </div>
          <code className="block text-base font-mono bg-background/80 rounded-lg px-3 py-2 break-all border border-border/50">
            {domain}
          </code>
          <p className="text-sm text-muted-foreground mt-3">
            This domain is in the allowlist and will bypass all blocklists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 flex items-start gap-5">
      <div className="rounded-full p-3.5 bg-emerald-500/10 shrink-0">
        <Shield className="h-7 w-7 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-xl font-bold">Domain is Safe</h1>
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            Not Blocked
          </Badge>
        </div>
        <code className="block text-base font-mono bg-background/80 rounded-lg px-3 py-2 break-all border border-border/50">
          {domain}
        </code>
        <p className="text-sm text-muted-foreground mt-3">
          This domain is not matched by any active blocklist.
        </p>
      </div>
    </div>
  );
}

function CertCard({ certInfo, domain }: { certInfo: CertInfo | null; domain: string }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          TLS / CRT Certificate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {certInfo ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Issuer</p>
                <p className="text-xs font-mono truncate" title={certInfo.issuer ?? ""}>
                  {certInfo.issuer ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</p>
                <p className="text-xs font-mono truncate" title={certInfo.subject ?? ""}>
                  {certInfo.subject ?? "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expires</p>
                <p className={cn(
                  "text-xs font-medium",
                  certInfo.expiry && new Date(certInfo.expiry) < new Date() ? "text-red-500" : ""
                )}>
                  {certInfo.expiry ? new Date(certInfo.expiry).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                <Badge
                  variant={certInfo.valid ? "secondary" : "destructive"}
                  className="text-[10px]"
                >
                  {certInfo.valid ? "Valid" : "Expired"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => window.open(`https://crt.sh/?q=${encodeURIComponent(domain)}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                View on crt.sh
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <Lock className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">
              Certificate info could not be retrieved.
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              crt.sh lookup returned no results for this domain.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QueryDetailsCard({ lookup }: { lookup: BlockLookupResult }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Query Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Domain</p>
            <code className="text-xs font-mono truncate block" title={lookup.domain}>
              {lookup.domain}
            </code>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
            <Badge
              variant={lookup.blocked ? "destructive" : "secondary"}
              className="text-[10px]"
            >
              {lookup.blocked ? "Blocked" : lookup.allowlisted ? "Allowlisted" : "Allowed"}
            </Badge>
          </div>
          {lookup.list && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Matched List</p>
              <p className="text-xs font-medium truncate" title={lookup.list}>{lookup.list}</p>
            </div>
          )}
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Checked At</p>
            <p className="text-xs">{new Date(lookup.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlockPage() {
  const params = useParams();
  const router = useRouter();
  const domain = typeof params.domain === "string" ? params.domain : "";
  const [lookup, setLookup] = useState<BlockLookupResult | null>(null);
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchDomain, setSearchDomain] = useState(domain);

  const fetchInfo = async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bastion/block-lookup?domain=${encodeURIComponent(d)}`);
      const data: BlockLookupResult = await res.json();
      setLookup(data);

      // Try to fetch CRT certificate info via crt.sh
      try {
        const crtRes = await fetch(`https://crt.sh/?q=${encodeURIComponent(d)}&output=json`);
        if (crtRes.ok) {
          const crtData = await crtRes.json();
          if (Array.isArray(crtData) && crtData.length > 0) {
            const latest = crtData[0];
            setCertInfo({
              issuer: latest.issuer_name ?? null,
              subject: latest.common_name ?? d,
              expiry: latest.not_after ?? null,
              valid: !latest.not_after || new Date(latest.not_after) > new Date(),
            });
          } else {
            setCertInfo(null);
          }
        } else {
          setCertInfo(null);
        }
      } catch {
        setCertInfo(null);
      }
    } catch {
      setLookup(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (domain) fetchInfo(decodeURIComponent(domain));
  }, [domain]);

  const handleSearch = () => {
    if (searchDomain) {
      router.push(`/blocked/${encodeURIComponent(searchDomain)}`);
    }
  };

  const decodedDomain = decodeURIComponent(domain);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg tracking-tight">Bastion</span>
              </div>
              <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                Block Page
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Server className="h-3 w-3" />
              <span>DNS Sinkhole</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Search bar */}
          <DomainSearchBar
            value={searchDomain}
            onChange={setSearchDomain}
            onSearch={handleSearch}
          />

          {loading ? (
            <Card className="p-14 text-center border-border/50">
              <div className="space-y-3">
                <Shield className="h-8 w-8 mx-auto text-primary animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Looking up domain info...</p>
                  <p className="text-xs text-muted-foreground">Checking blocklists and certificate records</p>
                </div>
              </div>
            </Card>
          ) : lookup ? (
            <>
              {/* Result banner */}
              <ResultBanner
                blocked={lookup.blocked}
                allowlisted={lookup.allowlisted}
                domain={decodedDomain}
                list={lookup.list}
                category={lookup.category}
              />

              {/* Detail cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QueryDetailsCard lookup={lookup} />
                <CertCard certInfo={certInfo} domain={decodedDomain} />
              </div>

              {/* External links */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(`https://www.virustotal.com/gui/domain/${encodeURIComponent(decodedDomain)}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  VirusTotal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(`https://www.abuseipdb.com/check/${encodeURIComponent(decodedDomain)}`, "_blank")}
                >
                  <Bug className="h-3 w-3" />
                  AbuseIPDB
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => window.open(`https://dnslytics.com/domain/${encodeURIComponent(decodedDomain)}`, "_blank")}
                >
                  <FileText className="h-3 w-3" />
                  DNSlytics
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-14 text-center border-border/50">
              <div className="space-y-3">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Check a Domain</p>
                  <p className="text-xs text-muted-foreground">
                    Enter a domain above to check its blocking status and view certificate details.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </main>

        <footer className="border-t border-border/50 bg-card/30 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Bastion DNS Sinkhole — Block Page
            </span>
            <Button
              variant="link"
              size="sm"
              className="text-xs p-0 h-auto"
              onClick={() => router.push("/")}
            >
              Back to Dashboard
            </Button>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
