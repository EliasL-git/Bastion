import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

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
}
