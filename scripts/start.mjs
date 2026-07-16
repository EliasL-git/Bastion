import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    const result = execSync(
      `taskkill /F /T /PID ${proc.pid}`,
      { encoding: "utf8", timeout: 3000 },
    );
    console.log(`[start] Killed PID ${proc.pid} and children`);
  } catch {}
}

killOnPort(4455);
killOnPort(53);
killOnPort(80);
killOnPort(443);

const nextjs = spawn("npx", ["next", "dev", "-p", "4455"], {
  stdio: "inherit",
  shell: true,
  cwd: root,
});

const dns = spawn("node", ["dns-proxy.mjs"], {
  stdio: "inherit",
  shell: true,
  cwd: root,
});

let closing = false;

function cleanup() {
  if (closing) return;
  closing = true;
  console.log("\n[start] Shutting down...");
  killProcessTree(nextjs);
  killProcessTree(dns);
  killOnPort(4455);
  killOnPort(53);
  killOnPort(80);
  killOnPort(443);
  setTimeout(() => process.exit(0), 1000);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

nextjs.on("exit", (code) => {
  console.log(`[start] Next.js exited (code ${code})`);
  cleanup();
});

dns.on("exit", (code) => {
  console.log(`[start] DNS proxy exited (code ${code})`);
  cleanup();
});
