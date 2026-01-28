/**
 * ============================================================================
 * PRISMA CLIENT SINGLETON - Database Access
 * ============================================================================
 * 
 * This file creates and exports a single Prisma Client instance to be used
 * throughout the application. We use the singleton pattern to avoid creating
 * multiple database connections, which could lead to:
 * 
 * 1. Connection pool exhaustion
 * 2. Memory leaks in development (due to hot reloading)
 * 3. Inconsistent database states
 * 
 * How it works:
 * - In development: We store the client on the global object to survive
 *   hot reloads (when the file is re-executed, we reuse the existing client)
 * - In production: We create a single instance that's used throughout
 * 
 * Usage:
 *   import { prisma } from './db';
 *   const users = await prisma.user.findMany();
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';

/**
 * Extend the global namespace to include our prisma client
 * This is needed for TypeScript to recognize the global variable
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create the Prisma Client instance
 * 
 * Configuration options:
 * - log: Controls what Prisma logs to the console
 *   - 'query': Log all SQL queries (useful for debugging)
 *   - 'info': General information
 *   - 'warn': Warnings
 *   - 'error': Error messages
 * 
 * In development, we enable query logging to help debug database issues.
 * In production, we only log warnings and errors for performance.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']  // Verbose logging in dev
      : ['warn', 'error'],                   // Minimal logging in prod
  });
};

/**
 * The singleton Prisma Client instance
 * 
 * Logic:
 * 1. If we already have a global instance, use it (for dev hot reload)
 * 2. Otherwise, create a new instance
 * 3. In development, store it on global for reuse
 */
export const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, preserve the client across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * 
 * When the application is terminated (SIGINT, SIGTERM), we need to
 * properly close the database connection to prevent connection leaks.
 * 
 * This is especially important in containerized environments where
 * the application might be restarted frequently.
 */
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...');
  await prisma.$disconnect();
  console.log('✅ Database connection closed');
});
