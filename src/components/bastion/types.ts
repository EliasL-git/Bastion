// ── Chart ──

export interface ChartPoint {
  time: string;
  allowed: number;
  blocked: number;
}

// ── Stats ──

export interface Stats {
  totalQueries: number;
  blockedCount: number;
  allowedCount: number;
  queriesLastHour: number;
  blockPercent: number;
  enabledLists: number;
  totalLists: number;
  blockingEnabled: boolean;
  topBlockedDomain: string;
  topBlockedCount: number;
  chartData: ChartPoint[];
}

// ── DNS Query ──

export interface QueryEntry {
  id: string;
  domain: string;
  clientIp: string;
  queryType: string;
  status: string;
  list: string | null;
  createdAt: string;
}

// ── Blocklist ──

export interface BlocklistEntry {
  id: string;
  name: string;
  enabled: boolean;
  source: string | null;
  entryCount: number;
}

// ── Allowlist ──

export interface AllowlistEntry {
  id: string;
  domain: string;
  note: string | null;
}

// ── Resolver ──

export interface ResolverStatus {
  running: boolean;
  pid: string | null;
  port: number;
  status: string;
}

// ── Block Page ──

export interface BlockPageInfo {
  domain: string;
  list: string;
  category: "ads" | "tracking" | "malware" | "custom";
  timestamp: string;
  clientIp: string;
  queryType: string;
  // CRT / cert-related info
  hasCert: boolean;
  certIssuer: string | null;
  certSubject: string | null;
  certExpiry: string | null;
}

// ── Top Domains ──

export interface TopDomainEntry {
  domain: string;
  count: number;
}

export interface TopDomainsData {
  blocked: TopDomainEntry[];
  allowed: TopDomainEntry[];
}

// ── Settings ──

export type SettingsMap = Record<string, string>;
