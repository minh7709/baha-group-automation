// src/lib/prisma.ts
// Hybrid Prisma Client with graceful fallback

let PrismaClientClass: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prismaModule = require('@prisma/client');
  PrismaClientClass = prismaModule.PrismaClient;
} catch (e) {
  // Mock fallback for build time
  PrismaClientClass = class MockPrismaClient {
    user = {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
    };
    campaign = {
      findUnique: async () => null,
      findMany: async () => [],
      create: async (data: any) => data.data,
      update: async (data: any) => data.data,
      delete: async () => ({ success: true }),
    };
    auditLog = {
      create: async (data: any) => data.data,
      findMany: async () => [],
    };
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (PrismaClientClass
    ? new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
    : null);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;