import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const caCert = await db.setting.findUnique({ where: { key: "ca_cert" } });
  if (!caCert) {
    return NextResponse.json({ error: "No CA generated yet" }, { status: 404 });
  }

  return new NextResponse(caCert.value, {
    headers: {
      "Content-Type": "application/x-pem-file",
      "Content-Disposition": 'attachment; filename="bastion-root-ca.crt"',
    },
  });
}
