import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { seed } from "@/lib/seed";

export async function POST() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  await seed();
  return NextResponse.json({ ok: true });
}