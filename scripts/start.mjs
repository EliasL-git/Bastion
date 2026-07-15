import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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
  nextjs.kill("SIGTERM");
  dns.kill("SIGTERM");
  setTimeout(() => process.exit(0), 2000);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

nextjs.on("exit", (code) => {
  console.log(`[start] Next.js exited (code ${code})`);
  cleanup();
});

dns.on("exit", (code) => {
  console.log(`[start] DNS proxy exited (code ${code})`);
  cleanup();
});
