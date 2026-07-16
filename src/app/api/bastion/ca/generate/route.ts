import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import forge from "node-forge";

export async function POST() {
  const auth = await requireAuth(); if (!auth.ok) return auth.response;
  try {
    const keys = forge.pki.rsa.generateKeyPair(4096);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString(16);
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    const attrs = [
      { name: "commonName", value: "Bastion Root CA" },
      { name: "organizationName", value: "Bastion DNS" },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      { name: "basicConstraints", cA: true, critical: true },
      { name: "keyUsage", keyCertSign: true, cRLSign: true, critical: true },
    ]);

    cert.sign(keys.privateKey, forge.md.sha256.create());

    const caCert = forge.pki.certificateToPem(cert);
    const caKey = forge.pki.privateKeyToPem(keys.privateKey);

    await db.setting.upsert({ where: { key: "ca_cert" }, update: { value: caCert }, create: { key: "ca_cert", value: caCert } });
    await db.setting.upsert({ where: { key: "ca_key" }, update: { value: caKey }, create: { key: "ca_key", value: caKey } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
