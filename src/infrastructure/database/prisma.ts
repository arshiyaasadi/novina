// Prisma is currently disabled in this project but kept for future use
// All Prisma client initialization and usage is commented out to avoid deployment dependencies

// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Mock/stub export to prevent import errors when Prisma is disabled (intentionally untyped).
export const prisma = null as any;

