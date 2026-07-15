import { NextResponse } from "next/server";
import { requireAuth, isPasswordChanged, getPasswordHash } from "@/lib/auth";
import { seed } from "@/lib/seed";

export async function GET() {
  const hash = await getPasswordHash();
  if (!hash) {
    await seed();
  }

  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const passwordChanged = await isPasswordChanged();

  return NextResponse.json({
    user: "admin",
    passwordChanged,
  });
}
