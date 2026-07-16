import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const topBlocked = await db.$queryRaw<Array<{ domain: string; _count: { id: number } }>>`
    SELECT domain, CAST(COUNT(*) AS INTEGER) as count
    FROM DnsQuery
    WHERE createdAt >= ${dayAgo} AND status = 'blocked'
    GROUP BY domain
    ORDER BY count DESC
    LIMIT 10
  `;

  const topAllowed = await db.$queryRaw<Array<{ domain: string; _count: { id: number } }>>`
    SELECT domain, CAST(COUNT(*) AS INTEGER) as count
    FROM DnsQuery
    WHERE createdAt >= ${dayAgo} AND status = 'allowed'
    GROUP BY domain
    ORDER BY count DESC
    LIMIT 10
  `;

  return NextResponse.json({
    blocked: topBlocked.map((d) => ({ domain: d.domain, count: Number((d as any).count) })),
    allowed: topAllowed.map((d) => ({ domain: d.domain, count: Number((d as any).count) })),
  });
}