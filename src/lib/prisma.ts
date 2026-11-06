import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getPrisma(): PrismaClient | undefined {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  return globalForPrisma.prisma;
}

export async function withPrismaRetry<T>(
  operation: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  const firstClient = getPrisma();
  if (!firstClient) {
    throw new Error('DATABASE_URL chưa được cấu hình.');
  }

  try {
    return await operation(firstClient);
  } catch (error: any) {
    const message = String(error?.message || error);
    const retryable = /closed|P1017|connection|socket/i.test(message);
    if (!retryable) throw error;

    await firstClient.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
    const nextClient = getPrisma();
    if (!nextClient) throw error;
    return operation(nextClient);
  }
}
