import { PrismaClient } from '@prisma/client';

// Script 用的 PrismaClient（單例，避免 ts-node 多次 import 時重覆連線）
const globalForPrisma = global as unknown as { _scriptPrisma?: PrismaClient };

export const prisma =
  globalForPrisma._scriptPrisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (!globalForPrisma._scriptPrisma) {
  globalForPrisma._scriptPrisma = prisma;
}
