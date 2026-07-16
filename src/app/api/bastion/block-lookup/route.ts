import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req); if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "domain query parameter required" }, { status: 400 });
  }

  // Check all enabled blocklists for a matching domain
  const lists = await db.blocklist.findMany({ where: { enabled: true } });

  let matchedList: string | null = null;
  let matchedCategory = "custom";
  const lower = domain.toLowerCase();

  for (const list of lists) {
    const entries = list.entries.split("\n").map((e) => e.trim().toLowerCase()).filter(Boolean);
    // Check exact match and subdomain match
    const isMatch = entries.some(
      (entry) => lower === entry || lower.endsWith("." + entry) || lower.endsWith("/" + entry)
    );
    if (isMatch) {
      matchedList = list.name;
      // Infer category from list name
      const name = list.name.toLowerCase();
      if (name.includes("malware") || name.includes("phishing") || name.includes("ransomware")) {
        matchedCategory = "malware";
      } else if (name.includes("track") || name.includes("analytics")) {
        matchedCategory = "tracking";
      } else if (name.includes("ad")) {
        matchedCategory = "ads";
      }
      break;
    }
  }

  // Check allowlist (overrides block)
  const allowlisted = await db.allowlist.findFirst({
    where: {
      domain: {
        contains: lower,
      },
    },
  });

  const blocked = !!matchedList && !allowlisted;

  return NextResponse.json({
    domain,
    blocked,
    list: matchedList,
    category: matchedCategory,
    allowlisted: !!allowlisted,
    allowlistNote: allowlisted?.note ?? null,
    // CRT: we return the info that would be shown on a block page
    // The actual CRT/cert check would happen in the UI via crt.sh API
    timestamp: new Date().toISOString(),
  });
}
