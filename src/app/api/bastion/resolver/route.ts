import { NextResponse } from "next/server";
import dgram from "node:dgram";
import * as dnsPacket from "dns-packet";

export async function GET() {
  try {
    const sock = dgram.createSocket("udp4");
    const running = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        sock.close();
        resolve(false);
      }, 2000);

      sock.once("message", () => {
        clearTimeout(timeout);
        sock.close();
        resolve(true);
      });

      sock.once("error", () => {
        clearTimeout(timeout);
        sock.close();
        resolve(false);
      });

      const query = dnsPacket.encode({
        type: "query",
        id: Math.floor(Math.random() * 65535),
        flags: dnsPacket.RECURSION_DESIRED,
        questions: [{ name: "bastion-healthcheck.local", type: "A", class: "IN" }],
      });

      sock.send(query, 53, "127.0.0.1", (err) => {
        if (err) {
          clearTimeout(timeout);
          sock.close();
          resolve(false);
        }
      });
    });

    return NextResponse.json({
      running,
      pid: null,
      port: 53,
      status: running ? "active" : "stopped",
    });
  } catch {
    return NextResponse.json({ running: false, pid: null, port: 53, status: "unknown" });
  }
}
