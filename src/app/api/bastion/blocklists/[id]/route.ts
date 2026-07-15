import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = await db.blocklist.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(list);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updated = await db.blocklist.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.entries !== undefined && { entries: body.entries }),
    },
  });

  return NextResponse.json(updated);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = await db.blocklist.findUnique({ where: { id } });
  if (!list) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!list.source || list.source === "custom")
    return NextResponse.json({ error: "no source URL configured" }, { status: 400 });

  try {
    const res = await fetch(list.source);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const entries = text
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

    await db.blocklist.update({ where: { id }, data: { entries } });
    return NextResponse.json({ ok: true, count: entries.split("\n").filter(Boolean).length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.blocklist.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}