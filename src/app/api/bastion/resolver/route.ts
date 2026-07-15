import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `http://127.0.0.1:5353/?XTransformPort=5353`,
      { signal: AbortSignal.timeout(2000) }
    ).catch(() => null);

    // If we get any response at all, the port is open (DNS doesn't speak HTTP,
    // but a connection attempt to an open port won't fail with ECONNREFUSED)
    // Better: check if the process is running
    const { execSync } = require("child_process");
    let running = false;
    let pid = "";

    try {
      const out = execSync("pgrep -f 'bastion-dns\\|dns-resolver'").toString().trim();
      if (out) {
        running = true;
        pid = out.split("\n")[0];
      }
    } catch {
      running = false;
    }

    return NextResponse.json({
      running,
      pid,
      port: 5353,
      status: running ? "active" : "stopped",
    });
  } catch {
    return NextResponse.json({ running: false, pid: null, port: 5353, status: "unknown" });
  }
}