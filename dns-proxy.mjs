import dgram from "node:dgram";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import { networkInterfaces } from "node:os";
import forge from "node-forge";
import { PrismaClient } from "@prisma/client";
import * as dnsPacket from "dns-packet";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DNS_PORT = parseInt(process.env.DNS_PORT || "53", 10);
const HTTP_PORT = parseInt(process.env.REDIRECT_PORT || "80", 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_REDIRECT_PORT || "443", 10);
const BASTION_PORT = parseInt(process.env.BASTION_PORT || "4455", 10);
const LISTEN_ADDR = "0.0.0.0";

let LAN_IP = "127.0.0.1";
for (const name of Object.keys(networkInterfaces())) {
  for (const net of networkInterfaces()[name] ?? []) {
    if (net.family === "IPv4" && !net.internal) { LAN_IP = net.address; break; }
  }
  if (LAN_IP !== "127.0.0.1") break;
}

// Load .env for Prisma
try {
  const envPath = resolve(__dirname, ".env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {}

const prisma = new PrismaClient();

let blockedDomains = new Set();
let blockedSources = new Map();
let allowedDomains = new Set();
let blockingEnabled = true;
let queryLogging = true;
let upstreamServers = ["1.1.1.1"];
let lastRefresh = 0;
const REFRESH_INTERVAL = 5000;

async function refreshLists() {
  try {
    const [blocklists, allowlist, settings] = await Promise.all([
      prisma.blocklist.findMany({ where: { enabled: true } }),
      prisma.allowlist.findMany(),
      prisma.setting.findMany(),
    ]);

    blockedDomains = new Set();
    blockedSources = new Map();
    for (const list of blocklists) {
      for (const line of list.entries.split("\n")) {
        const domain = line.trim().toLowerCase();
        if (domain && !domain.startsWith("#") && !domain.startsWith("/")) {
          blockedDomains.add(domain);
          blockedSources.set(domain, list.name);
        }
      }
    }

    allowedDomains = new Set(allowlist.map((e) => e.domain.toLowerCase()));

    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    blockingEnabled = settingsMap.blocking_enabled !== "false";
    queryLogging = settingsMap.query_logging !== "false";
    upstreamServers = (settingsMap.upstream_dns || "1.1.1.1")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    caCertPem = settingsMap.ca_cert || null;
    caKeyPem = settingsMap.ca_key || null;

    lastRefresh = Date.now();

    console.log(`[dns-proxy] Lists refreshed: ${blockedDomains.size} blocked, ${allowedDomains.size} allowed, ${ensureCA() ? "CA loaded" : "no CA"}, ${blockingEnabled ? "blocking ON" : "blocking OFF"}`);
  } catch (err) {
    console.error("[dns-proxy] Refresh error:", err.message);
  }
}

function isBlocked(domain) {
  const d = domain.toLowerCase();
  if (allowedDomains.has(d)) return false;
  if (blockedDomains.has(d)) return true;
  for (const blocked of blockedDomains) {
    if (d.endsWith("." + blocked) || d === blocked) return true;
  }
  return false;
}

function getBlockReason(domain) {
  const d = domain.toLowerCase();
  if (allowedDomains.has(d)) return null;
  if (blockedSources.has(d)) return blockedSources.get(d);
  for (const blocked of blockedDomains) {
    if (d.endsWith("." + blocked)) return blockedSources.get(blocked) || "blocklist";
  }
  return null;
}

function getUpstream() {
  return upstreamServers[Math.floor(Math.random() * upstreamServers.length)] || "1.1.1.1";
}

function createSinkholeResponse(query, reason) {
  const question = query.questions[0];

  if (question.type === "A") {
    return dnsPacket.encode({
      type: "response",
      id: query.id,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: query.questions,
      answers: [{ name: question.name, type: "A", class: "IN", ttl: 60, data: LAN_IP }],
    });
  }

  if (question.type === "AAAA") {
    return dnsPacket.encode({
      type: "response",
      id: query.id,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: query.questions,
      answers: [{ name: question.name, type: "AAAA", class: "IN", ttl: 60, data: "::" }],
    });
  }

  return dnsPacket.encode({
    type: "response",
    id: query.id,
    flags: dnsPacket.RECURSION_DESIRED,
    questions: query.questions,
    answers: [{ name: question.name, type: "CNAME", class: "IN", ttl: 60, data: "blocked.local" }],
  });
}

function forwardToUpstream(msg) {
  return new Promise((resolve, reject) => {
    const sock = dgram.createSocket("udp4");
    const ip = getUpstream();
    const timeout = setTimeout(() => {
      sock.close();
      reject(new Error("Upstream timeout"));
    }, 5000);

    sock.once("message", (response) => {
      clearTimeout(timeout);
      sock.close();
      resolve(response);
    });

    sock.once("error", (err) => {
      clearTimeout(timeout);
      sock.close();
      reject(err);
    });

    sock.send(msg, 53, ip, (err) => {
      if (err) {
        clearTimeout(timeout);
        sock.close();
        reject(err);
      }
    });
  });
}

const server = dgram.createSocket("udp4");

server.on("message", async (msg, rinfo) => {
  try {
    if (Date.now() - lastRefresh > REFRESH_INTERVAL) {
      await refreshLists();
    }

    const query = dnsPacket.decode(msg);
    const question = query.questions?.[0];
    if (!question) return;

    const domain = question.name.replace(/\.$/, "");

    if (blockingEnabled && isBlocked(domain)) {
      const reason = getBlockReason(domain);
      console.log(`[dns-proxy] BLOCKED ${domain} from ${rinfo.address} (${reason})`);
      const response = createSinkholeResponse(query, reason);
      server.send(response, rinfo.port, rinfo.address);

      if (queryLogging) {
        await prisma.dnsQuery
          .create({
            data: {
              domain,
              clientIp: rinfo.address,
              queryType: question.type,
              status: "blocked",
              list: reason,
              createdAt: new Date(),
            },
          })
          .catch(() => {});
      }
      return;
    }

    const upstreamResponse = await forwardToUpstream(msg);
    server.send(upstreamResponse, rinfo.port, rinfo.address);

    if (queryLogging) {
      console.log(`[dns-proxy] ALLOWED ${domain} via ${getUpstream()}`);
      await prisma.dnsQuery
        .create({
          data: {
            domain,
            clientIp: rinfo.address,
            queryType: question.type,
            status: "allowed",
            list: null,
            createdAt: new Date(),
          },
        })
        .catch(() => {});
    }
  } catch (err) {
    if (err.code === "ENOTFOUND" || err.message?.includes("refused")) {
      // Upstream not reachable - return SERVFAIL
      try {
        const query = dnsPacket.decode(msg);
        const servfail = dnsPacket.encode({
          type: "response",
          id: query.id,
          flags: dnsPacket.RECURSION_DESIRED,
          rcode: 2,
          questions: query.questions,
          answers: [],
        });
        server.send(servfail, rinfo.port, rinfo.address);
      } catch {}
    }
  }
});

server.on("error", (err) => {
  console.error("[dns-proxy] Server error:", err.message);
});

server.on("listening", () => {
  const addr = server.address();
  console.log(`[dns-proxy] DNS proxy listening on UDP ${addr.address}:${addr.port}`);
});

let httpServer = null;
let httpsServer = null;
let caCertPem = null;
let caKeyPem = null;
const domainCertCache = new Map();
const DOMAIN_CERT_TTL = 3600000; // 1 hour

function ensureCA() {
  if (caCertPem && caKeyPem) return true;
  return false;
}

function generateDomainCert(domain) {
  const cached = domainCertCache.get(domain);
  if (cached && Date.now() - cached.time < DOMAIN_CERT_TTL) return cached;

  const caCert = forge.pki.certificateFromPem(caCertPem);
  const caKey = forge.pki.privateKeyFromPem(caKeyPem);

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = Date.now().toString(16) + Math.random().toString(16).slice(2, 6);
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{ name: "commonName", value: domain }];
  cert.setSubject(attrs);
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    { name: "subjectAltName", altNames: [{ type: 2, value: domain }] },
  ]);

  cert.sign(caKey, forge.md.sha256.create());

  const result = {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
    time: Date.now(),
  };
  domainCertCache.set(domain, result);
  return result;
}

function redirectHandler(req, res) {
  const host = req.headers.host?.split(":")[0] || "unknown";
  const reason = getBlockReason(host);
  let location = `http://${LAN_IP}:${BASTION_PORT}/blocked?domain=${encodeURIComponent(host)}`;
  if (ensureCA() && reason) location += `&reason=${encodeURIComponent(reason)}`;
  res.writeHead(302, { Location: location });
  res.end();
}

function generateSelfSignedCert() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{ name: "commonName", value: "bastion.local" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    cert: forge.pki.certificateToPem(cert),
    key: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

async function start() {
  await refreshLists();

  server.bind(DNS_PORT, LISTEN_ADDR);

  // HTTP redirect server (port 80) for non-HTTPS sites
  httpServer = http.createServer(redirectHandler);
  httpServer.listen(HTTP_PORT, LISTEN_ADDR, () => {
    console.log(`[dns-proxy] HTTP redirect on port ${HTTP_PORT} → :${BASTION_PORT}/blocked`);
  });

  // HTTPS redirect server (port 443) with optional CA-based SNI certs
  try {
    if (ensureCA()) {
      const fallbackCert = generateDomainCert("bastion.local");
      httpsServer = https.createServer(
        {
          key: fallbackCert.key,
          cert: fallbackCert.cert,
          SNICallback: (domain, cb) => {
            try {
              const d = generateDomainCert(domain);
              const ctx = tls.createSecureContext({ key: d.key, cert: d.cert });
              cb(null, ctx);
            } catch (err) {
              cb(err);
            }
          },
        },
        redirectHandler,
      );
      httpsServer.listen(HTTPS_PORT, LISTEN_ADDR, () => {
        console.log(`[dns-proxy] HTTPS redirect on port ${HTTPS_PORT} (CA-signed certs)`);
      });
    } else {
      const { cert, key } = generateSelfSignedCert();
      httpsServer = https.createServer({ key, cert }, redirectHandler);
      httpsServer.listen(HTTPS_PORT, LISTEN_ADDR, () => {
        console.log(`[dns-proxy] HTTPS redirect on port ${HTTPS_PORT} (self-signed cert)`);
      });
    }
  } catch (err) {
    console.log(`[dns-proxy] Could not start HTTPS redirect: ${err.message}`);
  }
}

function stop() {
  return new Promise((resolve) => {
    server.close();
    if (httpServer) httpServer.close();
    if (httpsServer) httpsServer.close();
    prisma.$disconnect().catch(() => {});
    resolve();
  });
}

start();

process.on("SIGINT", () => stop().then(() => process.exit(0)));
process.on("SIGTERM", () => stop().then(() => process.exit(0)));
