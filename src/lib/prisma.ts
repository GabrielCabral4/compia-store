import { PrismaClient } from "@prisma/client";

// Em desenvolvimento o Next recarrega os módulos a cada alteração; guardar a
// instância no escopo global evita esgotar as conexões do banco.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
