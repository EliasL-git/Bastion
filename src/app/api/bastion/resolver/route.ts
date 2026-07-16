import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { execSync } from "node:child_process";
import { networkInterfaces } from "node:os";

export async function GET() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  let pid: number | null = null;
  try {
    const output = execSync(
      `netstat -ano | findstr "UDP" | findstr ":53 "`,
      { encoding: "utf8", timeout: 3000 },
    );
    for (const line of output.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      const found = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(found)) { pid = found; break; }
    }
  } catch {}

  const running = pid !== null;

  let lanIp = "127.0.0.1";
  for (const name of Object.keys(networkInterfaces())) {
    for (const net of networkInterfaces()[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) { lanIp = net.address; break; }
    }
    if (lanIp !== "127.0.0.1") break;
  }

  return NextResponse.json({
    running,
    pid,
    port: 53,
    status: running ? "active" : "stopped",
    lanIp,
  });
}
