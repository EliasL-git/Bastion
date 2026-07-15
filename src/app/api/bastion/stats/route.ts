import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "24h";
  const rangeHours = range === "7d" ? 168 : 24;

  const now = new Date();
  const rangeAgo = new Date(now.getTime() - rangeHours * 60 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [total, blocked, allowed, queriesLastHour, topBlockedDomains, topClients, queryTypes, uniqueClientsCount] = await Promise.all([
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${rangeAgo}`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${rangeAgo} AND status = 'blocked'`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${rangeAgo} AND status = 'allowed'`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${hourAgo}`,
    db.$queryRaw<Array<{ domain: string; count: number }>>`
      SELECT domain, CAST(COUNT(*) AS INTEGER) as count
      FROM DnsQuery
      WHERE createdAt >= ${rangeAgo} AND status = 'blocked'
      GROUP BY domain ORDER BY count DESC LIMIT 1
    `,
    db.$queryRaw<Array<{ clientIp: string; total: number; blockedCount: number; allowedCount: number }>>`
      SELECT clientIp, CAST(COUNT(*) AS INTEGER) as total,
        CAST(SUM(CASE WHEN status='blocked' THEN 1 ELSE 0 END) AS INTEGER) as blockedCount,
        CAST(SUM(CASE WHEN status='allowed' THEN 1 ELSE 0 END) AS INTEGER) as allowedCount
      FROM DnsQuery
      WHERE createdAt >= ${rangeAgo}
      GROUP BY clientIp ORDER BY total DESC LIMIT 5
    `,
    db.$queryRaw<Array<{ queryType: string; count: number }>>`
      SELECT queryType, CAST(COUNT(*) AS INTEGER) as count
      FROM DnsQuery
      WHERE createdAt >= ${rangeAgo}
      GROUP BY queryType ORDER BY count DESC
    `,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(DISTINCT clientIp) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${rangeAgo}`,
  ]);

  const [blocklists, totalLists, blockingEnabledRow] = await Promise.all([
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM Blocklist WHERE enabled = 1`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM Blocklist`,
    db.$queryRaw<Array<{ value: string }>>`SELECT value FROM Setting WHERE key = 'blocking_enabled' LIMIT 1`,
  ]);

  // Queries per hour/day for chart
  const timeFormat = range === "7d" ? "'D'" : "'%H:00'";
  const timeColumn = range === "7d"
    ? `strftime('%Y-%m-%d', createdAt)`
    : `strftime('%Y-%m-%d %H:00', createdAt)`;

  const timeData = await db.$queryRawUnsafe<Array<{ period: string; status: string; cnt: number }>>(
    `SELECT ${timeColumn} as period, status, CAST(COUNT(*) AS INTEGER) as cnt
     FROM DnsQuery WHERE createdAt >= ? GROUP BY period, status ORDER BY period ASC`,
    rangeAgo
  );

  // Pivot into chart-friendly format
  const timeMap = new Map<string, { allowed: number; blocked: number }>();

  if (range === "7d") {
    for (let d = rangeHours / 24 - 1; d >= 0; d--) {
      const dt = new Date(now.getTime() - d * 24 * 3600 * 1000);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      timeMap.set(key, { allowed: 0, blocked: 0 });
    }
  } else {
    for (let h = 23; h >= 0; h--) {
      const d = new Date(now.getTime() - h * 3600 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
      timeMap.set(key, { allowed: 0, blocked: 0 });
    }
  }

  for (const row of timeData) {
    const entry = timeMap.get(row.period);
    if (entry) {
      if (row.status === "blocked") entry.blocked = Number(row.cnt);
      else entry.allowed = Number(row.cnt);
    }
  }

  const chartData = Array.from(timeMap.entries()).map(([period, counts]) => {
    const label = range === "7d" ? period.split("-").slice(1).join("/") : period.split(" ")[1];
    return { time: label, allowed: counts.allowed, blocked: counts.blocked };
  });

  const t = Number(total[0]?.c ?? 0);
  const b = Number(blocked[0]?.c ?? 0);
  const a = Number(allowed[0]?.c ?? 0);
  const blockPercent = t > 0 ? Math.round((b / t) * 1000) / 10 : 0;

  return NextResponse.json({
    totalQueries: t,
    blockedCount: b,
    allowedCount: a,
    queriesLastHour: Number(queriesLastHour[0]?.c ?? 0),
    uniqueClients: Number(uniqueClientsCount[0]?.c ?? 0),
    blockPercent,
    enabledLists: Number(blocklists[0]?.c ?? 0),
    totalLists: Number(totalLists[0]?.c ?? 0),
    blockingEnabled: blockingEnabledRow[0]?.value === "true",
    topBlockedDomain: topBlockedDomains[0]?.domain ?? "—",
    topBlockedCount: Number(topBlockedDomains[0]?.count ?? 0),
    topClients: topClients.map((c: any) => ({
      clientIp: c.clientIp,
      total: Number(c.total),
      blockedCount: Number(c.blockedCount),
      allowedCount: Number(c.allowedCount),
    })),
    queryTypeDistribution: queryTypes.map((qt: any) => ({
      type: qt.queryType,
      count: Number(qt.count),
    })),
    chartData,
    range,
  });
}