const { existsSync, copyFileSync } = require("fs");
const { execSync } = require("child_process");
const { resolve } = require("path");

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: __dirname, stdio: "inherit" });
}

const envPath = resolve(__dirname, ".env");
const envExample = resolve(__dirname, ".env.example");
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

console.log("[setup] Starting Bastion (Next.js + DNS proxy)...");
run("node scripts/start.mjs");
