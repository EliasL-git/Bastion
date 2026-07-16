import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const auth = await requireAuth(req); if (!auth.ok) return auth.response;
  try {
    const { queries } = await req.json();
    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Use a transaction for batch insert
    await db.$transaction(
      queries.map((q: { domain: string; clientIp: string; queryType: string; status: string; list: string | null }) =>
        db.dnsQuery.create({
          data: {
            domain: q.domain,
            clientIp: q.clientIp,
            queryType: q.queryType,
            status: q.status,
            list: q.list,
          },
        })
      )
    );

    return NextResponse.json({ ok: true, logged: queries.length });
  } catch {
    return NextResponse.json({ ok: false, error: "log failed" }, { status: 500 });
  }
}