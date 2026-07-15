const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const prisma = new PrismaClient();
  const existing = await prisma.setting.findUnique({ where: { key: "password_hash" } });
  if (!existing) {
    const hash = await bcrypt.hash("admin", 12);
    await prisma.setting.createMany({
      data: [
        { key: "password_hash", value: hash },
        { key: "password_changed", value: "false" },
      ],
    });
    console.log("[seed] Default admin account created (password: admin)");
  } else {
    console.log("[seed] Admin account already exists");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
