import { db } from "@/lib/db";
import { NextResponse } from "next/server";

async function fetchUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const text = await res.text();
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.startsWith("/") && !l.startsWith("!"))
      .map((l) => {
        if (l.startsWith("0.0.0.0 ") || l.startsWith("127.0.0.1 ") || l.startsWith(":: ")) {
          return l.split(/\s+/)[1]?.trim() || l;
        }
        if (l.startsWith("||") && l.endsWith("^")) return l.slice(2, -1);
        return l.replace(/^\.+/, "").replace(/\.$/, "");
      })
      .filter(Boolean)
      .join("\n");
  } catch {
    return null;
  }
}

export async function GET() {
  const lists = await db.blocklist.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      enabled: true,
      source: true,
      entries: true,
    },
  });

  const withCounts = lists.map((l) => ({
    id: l.id,
    name: l.name,
    enabled: l.enabled,
    source: l.source,
    entryCount: l.entries.split("\n").filter(Boolean).length,
  }));

  return NextResponse.json(withCounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, source, entries } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  let finalEntries = entries || "";

  if ((!finalEntries || !finalEntries.trim()) && source && source !== "custom") {
    const fetched = await fetchUrl(source);
    if (fetched) finalEntries = fetched;
  }

  const list = await db.blocklist.create({
    data: { name, source: source ?? "custom", entries: finalEntries },
  });

  return NextResponse.json(list, { status: 201 });
}