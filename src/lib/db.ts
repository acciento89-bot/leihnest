import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { db?: PrismaClient };
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://leihnest:leihnest@localhost:5432/leihnest" });
export const db = globalForPrisma.db ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
