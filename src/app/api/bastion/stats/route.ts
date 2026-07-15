import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total, blocked, allowed, queriesLastHour, uniqueClients, uniqueBlockedDomains] = await Promise.all([
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${dayAgo}`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${dayAgo} AND status = 'blocked'`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${dayAgo} AND status = 'allowed'`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM DnsQuery WHERE createdAt >= ${new Date(now.getTime() - 60 * 60 * 1000)}`,
    db.$queryRaw<Array<{ ip: string }>>`SELECT DISTINCT clientIp as ip FROM DnsQuery WHERE createdAt >= ${dayAgo} LIMIT 1`,
    db.$queryRaw<Array<{ domain: string; count: number }>>`
      SELECT domain, CAST(COUNT(*) AS INTEGER) as count
      FROM DnsQuery
      WHERE createdAt >= ${dayAgo} AND status = 'blocked'
      GROUP BY domain
      ORDER BY count DESC
      LIMIT 1
    `,
  ]);

  const [blocklists, totalLists, blockingEnabledRow] = await Promise.all([
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM Blocklist WHERE enabled = 1`,
    db.$queryRaw<Array<{ c: number }>>`SELECT CAST(COUNT(*) AS INTEGER) as c FROM Blocklist`,
    db.$queryRaw<Array<{ value: string }>>`SELECT value FROM Setting WHERE key = 'blocking_enabled' LIMIT 1`,
  ]);

  // Queries per hour for chart
  const hourlyData = await db.$queryRaw<Array<{ hour: string; status: string; cnt: number }>>`
    SELECT
      strftime('%Y-%m-%d %H:00', createdAt) as hour,
      status,
      CAST(COUNT(*) AS INTEGER) as cnt
    FROM DnsQuery
    WHERE createdAt >= ${dayAgo}
    GROUP BY hour, status
    ORDER BY hour ASC
  `;

  // Pivot into chart-friendly format
  const hourMap = new Map<string, { allowed: number; blocked: number }>();
  for (let h = 23; h >= 0; h--) {
    const d = new Date(now.getTime() - h * 3600 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd} ${hh}:00`;
    hourMap.set(key, { allowed: 0, blocked: 0 });
  }
  for (const row of hourlyData) {
    const entry = hourMap.get(row.hour);
    if (entry) {
      if (row.status === "blocked") entry.blocked = Number(row.cnt);
      else entry.allowed = Number(row.cnt);
    }
  }

  const chartData = Array.from(hourMap.entries()).map(([hour, counts]) => {
    const label = hour.split(" ")[1] + ":00";
    return { time: label, allowed: counts.allowed, blocked: counts.blocked };
  });

  const t = Number(total[0]?.c ?? 0);
  const b = Number(blocked[0]?.c ?? 0);
  const a = Number(allowed[0]?.c ?? 0);
  const blockPercent = t > 0 ? Math.round((b / t) * 1000) / 10 : 0;

  return NextResponse.json({
    totalQueries24h: t,
    blocked24h: b,
    allowed24h: a,
    queriesLastHour: Number(queriesLastHour[0]?.c ?? 0),
    uniqueClients: uniqueClients.length,
    blockPercent,
    enabledLists: Number(blocklists[0]?.c ?? 0),
    totalLists: Number(totalLists[0]?.c ?? 0),
    blockingEnabled: blockingEnabledRow[0]?.value === "true",
    topBlockedDomain: uniqueBlockedDomains[0]?.domain ?? "—",
    topBlockedCount: Number(uniqueBlockedDomains[0]?.count ?? 0),
    chartData,
  });
}