import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { networkInterfaces } from "os";

export async function GET() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  const nets = networkInterfaces();
  let ip = "127.0.0.1";

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        ip = net.address;
        break;
      }
    }
    if (ip !== "127.0.0.1") break;
  }

  return NextResponse.json({ ip, hostname: ip });
}
