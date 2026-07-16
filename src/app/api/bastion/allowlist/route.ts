import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  const entries = await db.allowlist.findMany({ orderBy: { domain: "asc" } });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const auth = await requireAuth(req); if (!auth.ok) return auth.response;
  const { domain, note } = await req.json();
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });

  const entry = await db.allowlist.create({ data: { domain, note } });
  return NextResponse.json(entry, { status: 201 });
}