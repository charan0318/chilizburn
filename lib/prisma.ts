import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function shouldPreferDirectUrl(): boolean {
  if (process.env.PRISMA_PREFER_DIRECT === "true") {
    return true;
  }

  if (process.env.PRISMA_PREFER_DIRECT === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

const connectionString = shouldPreferDirectUrl()
  ? process.env.DIRECT_URL ?? process.env.DATABASE_URL
  : process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to initialize Prisma client");
}

const adapter = new PrismaPg({ connectionString });
const shouldLogPrismaErrors = process.env.PRISMA_LOG_ERRORS === "true";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: shouldLogPrismaErrors ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
