"use client";

import { Shield, ShieldOff, ArrowLeft, ExternalLink, Clock, Globe, Server, Lock, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";

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

const categoryConfig: Record<string, { label: string; color: string }> = {
  ads: { label: "Ad / Tracking Network", color: "text-orange-600" },
  tracking: { label: "User Tracking", color: "text-purple-600" },
  malware: { label: "Malware / Phishing", color: "text-red-600" },
  custom: { label: "Custom Blocklist", color: "text-blue-600" },
};

function classifyCategory(listName: string): string {
  const n = listName.toLowerCase();
  if (n.includes("malware") || n.includes("phishing") || n.includes("ransomware")) return "malware";
  if (n.includes("track") || n.includes("analytics")) return "tracking";
  if (n.includes("ad")) return "ads";
  return "custom";
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
  const cat = lookup ? categoryConfig[lookup.category] ?? categoryConfig.custom : null;

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
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Domain search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Check a domain (e.g. doubleclick.net)"
                className="pl-9"
                value={searchDomain}
                onChange={(e) => setSearchDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>Check</Button>
          </div>

          {loading ? (
            <Card className="p-12 text-center">
              <Shield className="h-8 w-8 mx-auto text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground mt-3">Looking up domain info...</p>
            </Card>
          ) : lookup ? (
            <>
              {/* Blocked Banner */}
              {lookup.blocked ? (
                <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-6 flex items-start gap-4">
                  <div className="rounded-full p-3 bg-red-500/10 shrink-0">
                    <ShieldOff className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                      Domain Blocked
                      <Badge variant="destructive" className="text-[10px]">
                        Blocked
                      </Badge>
                    </h1>
                    <code className="block text-lg font-mono mt-2 bg-background/80 rounded px-3 py-1.5 break-all">
                      {decodedDomain}
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      This domain matches an entry in{" "}
                      <span className="font-medium text-foreground">{lookup.list}</span>
                      {cat && (
                        <Badge variant="outline" className={`ml-2 text-[10px] ${cat.color}`}>
                          {cat.label}
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              ) : lookup.allowlisted ? (
                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 flex items-start gap-4">
                  <div className="rounded-full p-3 bg-emerald-500/10 shrink-0">
                    <Shield className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                      Domain is Allowlisted
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                        Allowed
                      </Badge>
                    </h1>
                    <code className="block text-lg font-mono mt-2 bg-background/80 rounded px-3 py-1.5 break-all">
                      {decodedDomain}
                    </code>
                    {lookup.allowlistNote && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: {lookup.allowlistNote}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      This domain is in the allowlist and will bypass all blocklists.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 flex items-start gap-4">
                  <div className="rounded-full p-3 bg-emerald-500/10 shrink-0">
                    <Shield className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                      Domain is Safe
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                        Not Blocked
                      </Badge>
                    </h1>
                    <code className="block text-lg font-mono mt-2 bg-background/80 rounded px-3 py-1.5 break-all">
                      {decodedDomain}
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      This domain is not matched by any active blocklist.
                    </p>
                  </div>
                </div>
              )}

              {/* Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Query Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Domain</span>
                      <code className="font-mono text-xs text-right max-w-[200px] truncate">{lookup.domain}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant={lookup.blocked ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {lookup.blocked ? "Blocked" : lookup.allowlisted ? "Allowlisted" : "Allowed"}
                      </Badge>
                    </div>
                    {lookup.list && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Matched List</span>
                        <span className="font-medium text-xs text-right">{lookup.list}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Checked At</span>
                      <span className="text-xs text-right">
                        {new Date(lookup.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      TLS / CRT Certificate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {certInfo ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issuer</span>
                          <span className="text-xs text-right max-w-[220px] truncate" title={certInfo.issuer ?? ""}>
                            {certInfo.issuer ?? "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subject</span>
                          <span className="text-xs text-right max-w-[220px] truncate" title={certInfo.subject ?? ""}>
                            {certInfo.subject ?? "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires</span>
                          <span className={`text-xs text-right ${certInfo.expiry && new Date(certInfo.expiry) < new Date() ? "text-red-500" : ""}`}>
                            {certInfo.expiry ? new Date(certInfo.expiry).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valid</span>
                          <Badge
                            variant={certInfo.valid ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {certInfo.valid ? "Valid" : "Expired"}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2">
                        Certificate info could not be retrieved from crt.sh.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(`https://crt.sh/?q=${encodeURIComponent(decodedDomain)}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  View on crt.sh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => window.open(`https://www.virustotal.com/gui/domain/${encodeURIComponent(decodedDomain)}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  VirusTotal
                </Button>
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Enter a domain above to check its blocking status.</p>
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
