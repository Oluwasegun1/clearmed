import { PrismaClient } from '@/lib/generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limits.
// We check if a key model (like orgRole) exists on the cached instance;
// if not (e.g. after schema migration), we create a fresh client.

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    // If schema was migrated but client in global memory is missing new models, recreate it
    if (!('orgRole' in globalForPrisma.prisma)) {
      globalForPrisma.prisma = undefined;
    }
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}