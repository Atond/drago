import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mount = await prisma.mount.findFirst();
  console.log("Sample Mount:");
  console.log(mount);
}

main().finally(() => prisma.$disconnect());
