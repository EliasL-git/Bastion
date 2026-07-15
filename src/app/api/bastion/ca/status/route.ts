import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const caCert = await db.setting.findUnique({ where: { key: "ca_cert" } });
  return NextResponse.json({ exists: !!caCert });
}
