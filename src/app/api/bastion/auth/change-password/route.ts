import { NextResponse } from "next/server";
import { verifyPassword, getPasswordHash, hashPassword, setPasswordHash, setPasswordChanged, requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
  }

  const hash = await getPasswordHash();
  if (!hash) {
    return NextResponse.json({ error: "No account configured" }, { status: 500 });
  }

  const valid = await verifyPassword(currentPassword, hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await setPasswordHash(newHash);
  await setPasswordChanged(true);

  return NextResponse.json({ ok: true });
}
