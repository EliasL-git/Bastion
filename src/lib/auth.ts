import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_NAME = "bastion_token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

async function getSecret(): Promise<Uint8Array> {
  let setting = await db.setting.findUnique({ where: { key: "auth_secret" } });
  if (!setting) {
    const secret = crypto.randomUUID() + crypto.randomUUID();
    await db.setting.upsert({
      where: { key: "auth_secret" },
      update: { value: secret },
      create: { key: "auth_secret", value: secret },
    });
    setting = { key: "auth_secret", value: secret };
  }
  return new TextEncoder().encode(setting.value);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(): Promise<string> {
  const secret = await getSecret();
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = await getSecret();
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function getPasswordHash(): Promise<string | null> {
  const setting = await db.setting.findUnique({ where: { key: "password_hash" } });
  return setting?.value ?? null;
}

export async function setPasswordHash(hash: string): Promise<void> {
  await db.setting.upsert({
    where: { key: "password_hash" },
    update: { value: hash },
    create: { key: "password_hash", value: hash },
  });
}

export async function isPasswordChanged(): Promise<boolean> {
  const setting = await db.setting.findUnique({ where: { key: "password_changed" } });
  return setting?.value === "true";
}

export async function setPasswordChanged(val: boolean): Promise<void> {
  await db.setting.upsert({
    where: { key: "password_changed" },
    update: { value: String(val) },
    create: { key: "password_changed", value: String(val) },
  });
}

export async function requireAuth(
  request?: Request
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  let token: string | undefined;

  if (request) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TOKEN_NAME}=([^;]*)`));
    token = match?.[1];
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(TOKEN_NAME)?.value;
  }

  if (!token || !(await verifyToken(token))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true };
}

export async function setTokenCookie(response: NextResponse, token: string): Promise<void> {
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearTokenCookie(response: NextResponse): Promise<void> {
  response.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
