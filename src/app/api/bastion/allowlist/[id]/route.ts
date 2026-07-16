import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  const { id } = await params;
  await db.allowlist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}