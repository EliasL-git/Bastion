import { NextResponse } from "next/server";
import { verifyPassword, getPasswordHash, createToken, setTokenCookie, isPasswordChanged } from "@/lib/auth";
import { seed } from "@/lib/seed";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || username !== "admin") {
    return NextResponse.json({ error: "Invalid username" }, { status: 401 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  let hash = await getPasswordHash();
  if (!hash) {
    await seed();
    hash = await getPasswordHash();
    if (!hash) {
      return NextResponse.json({ error: "No account configured" }, { status: 500 });
    }
  }

  const valid = await verifyPassword(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createToken();
  const passwordChanged = await isPasswordChanged();
  const res = NextResponse.json({ ok: true, passwordChanged });
  await setTokenCookie(res, token);
  return res;
}
