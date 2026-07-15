import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const OISD_URL = "https://big.oisd.nl/domains";

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
        return l.replace(/^\.+/, "").replace(/\.$/, "");
      })
      .filter(Boolean)
      .join("\n");
  } catch {
    return null;
  }
}

export async function seed() {
  const existingHash = await db.setting.findUnique({ where: { key: "password_hash" } });
  if (!existingHash) {
    const defaultHash = await hashPassword("admin");
    await db.setting.createMany({
      data: [
        { key: "password_hash", value: defaultHash },
        { key: "password_changed", value: "false" },
      ],
    });
    console.log("[bastion] Default admin account created (password: admin)");
  }

  const defaults = [
    { key: "upstream_dns", value: "1.1.1.1, 1.0.0.1" },
    { key: "blocking_enabled", value: "true" },
    { key: "query_logging", value: "true" },
  ];

  for (const s of defaults) {
    const existing = await db.setting.findUnique({ where: { key: s.key } });
    if (!existing) await db.setting.create({ data: s });
  }

  // Seed default blocklist from OISD
  const existingList = await db.blocklist.findFirst({ where: { name: "OISD Big" } });
  if (!existingList) {
    console.log("[bastion] Fetching default blocklist from OISD...");
    const entries = await fetchUrl(OISD_URL);
    await db.blocklist.create({
      data: {
        name: "OISD Big",
        enabled: true,
        source: OISD_URL,
        entries: entries || "",
      },
    });
    if (entries) {
      const count = entries.split("\n").filter(Boolean).length;
      console.log(`[bastion] Default blocklist seeded with ${count} domains`);
    } else {
      console.log("[bastion] Could not fetch OISD — source URL set, entries empty. Use Refresh in Settings to populate.");
    }
  }
}
