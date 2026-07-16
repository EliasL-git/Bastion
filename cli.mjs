#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";
import { existsSync, copyFileSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname);

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

function killOnPort(port) {
  try {
    const result = execSync(
      `netstat -ano | findstr "LISTENING" | findstr ":${port} "`,
      { encoding: "utf8", timeout: 3000 },
    );
    for (const line of result.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0") {
        try { process.kill(parseInt(pid, 10)); } catch {}
      }
    }
  } catch {}
}

function findPids(port) {
  const pids = [];
  try {
    const result = execSync(
      `netstat -ano | findstr "${port}"`,
      { encoding: "utf8", timeout: 3000 },
    );
    for (const line of result.trim().split("\n")) {
      const parts = line.trim().split(/\s+/);
      const pid = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(pid)) pids.push(pid);
    }
  } catch {}
  return pids;
}

function getPidFile() {
  return resolve(root, ".bastion-pids");
}

function savePids(pids) {
  writeFileSync(getPidFile(), pids.join("\n"), "utf-8");
}

function loadPids() {
  try {
    return readFileSync(getPidFile(), "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

const command = process.argv[2];

if (command === "setup") {
  const envPath = resolve(root, ".env");
  const envExample = resolve(root, ".env.example");
  if (!existsSync(envPath)) {
    console.log("[setup] Creating .env from .env.example");
    copyFileSync(envExample, envPath);
  }
  console.log("[setup] Generating Prisma client...");
  run("npx prisma generate");
  console.log("[setup] Pushing database schema...");
  run("npx prisma db push");
  console.log("[setup] Seeding admin account...");
  run("node prisma/seed-admin.js");
  console.log("[setup] Done.");
} else if (command === "start") {
  killOnPort(4455);
  killOnPort(53);
  killOnPort(80);
  killOnPort(443);

  const dns = spawn("node", ["dns-proxy.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
  });

  const nextjs = spawn("node", [".next/standalone/server.js"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: { ...process.env, NODE_ENV: "production" },
  });

  savePids([dns.pid, nextjs.pid]);

  process.on("SIGINT", () => {
    dns.kill();
    nextjs.kill();
    process.exit();
  });
  process.on("SIGTERM", () => {
    dns.kill();
    nextjs.kill();
    process.exit();
  });
} else if (command === "stop") {
  console.log("[stop] Stopping Bastion services...");
  const pids = loadPids();
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
    } catch {}
  }
  killOnPort(4455);
  killOnPort(53);
  killOnPort(80);
  killOnPort(443);
  try { unlinkSync(getPidFile()); } catch {}
  console.log("[stop] Done.");
} else if (command === "status") {
  const nextPids = findPids(":4455 ");
  const dnsPids = findPids(":53 ");
  const httpPids = findPids(":80 ");
  const httpsPids = findPids(":443 ");

  console.log("Service          Port  PID       Status");
  console.log("─────────────────────────────────────────");
  const row = (name, port, pids) => {
    const pid = pids.length > 0 ? pids[0] : "—";
    const status = pids.length > 0 ? "running" : "stopped";
    console.log(`${name.padEnd(16)} ${String(port).padEnd(5)} ${String(pid).padEnd(9)} ${status}`);
  };
  row("Next.js", 4455, nextPids);
  row("DNS proxy", 53, dnsPids);
  row("HTTP redirect", 80, httpPids);
  row("HTTPS redirect", 443, httpsPids);
} else if (command === "dev") {
  killOnPort(4455);
  killOnPort(53);
  killOnPort(80);
  killOnPort(443);
  run("node scripts/start.mjs");
} else {
  console.log(`
Usage: bastion-dns <command>

Commands:
  setup    Initial setup — create .env, generate Prisma, push DB, seed admin
  start    Start production services (Next.js + DNS proxy)
  stop     Stop all Bastion services
  status   Show service status
  dev      Start in development mode
`);
}
