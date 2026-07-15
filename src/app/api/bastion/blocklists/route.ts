import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const lists = await db.blocklist.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      enabled: true,
      source: true,
      entries: true,
    },
  });

  const withCounts = lists.map((l) => ({
    id: l.id,
    name: l.name,
    enabled: l.enabled,
    source: l.source,
    entryCount: l.entries.split("\n").filter(Boolean).length,
  }));

  return NextResponse.json(withCounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, source, entries } = body;

  if (!name || !entries) {
    return NextResponse.json({ error: "name and entries required" }, { status: 400 });
  }

  const list = await db.blocklist.create({
    data: { name, source: source ?? "custom", entries },
  });

  return NextResponse.json(list, { status: 201 });
}