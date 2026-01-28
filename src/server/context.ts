/**
 * ============================================================================
 * tRPC CONTEXT - Request Context Setup
 * ============================================================================
 * 
 * This file creates the "context" for each tRPC request. The context is an
 * object that's available to all tRPC procedures and contains:
 * 
 * 1. The Prisma database client
 * 2. The authenticated user (if any)
 * 3. Any other request-specific data we might need
 * 
 * How it works:
 * - Every tRPC request goes through createContext first
 * - We extract the JWT token from cookies or Authorization header
 * - We verify the token and attach the user to the context
 * - Procedures can then access ctx.user to check authentication
 * 
 * Why Context Matters:
 * - Procedures can check if user is logged in: if (!ctx.user) throw error
 * - Procedures can check user role: if (ctx.user.role !== 'HR_MANAGER')
 * - Procedures can access database: await ctx.prisma.employee.findMany()
 * ============================================================================
 */

import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma } from './db';
import { verifyToken, extractTokenFromHeader, type DecodedToken } from './utils/auth';

/**
 * The shape of our context object
 * 
 * This interface tells TypeScript what's available in ctx.*
 * It's used by all procedures to know what they can access.
 */
export interface Context {
  /**
   * Prisma database client
   * Use this to query and mutate the database
   * 
   * @example
   * const employees = await ctx.prisma.employee.findMany();
   */
  prisma: typeof prisma;
  
  /**
   * The authenticated user (if any)
   * 
   * This is null if:
   * - No token was provided
   * - The token is invalid
   * - The token has expired
   * 
   * @example
   * if (!ctx.user) {
   *   throw new TRPCError({ code: 'UNAUTHORIZED' });
   * }
   * console.log('User ID:', ctx.user.userId);
   */
  user: DecodedToken | null;
}

/**
 * Create the context for a tRPC request
 * 
 * This function is called for EVERY tRPC request before any procedure runs.
 * It extracts authentication info and sets up the context.
 * 
 * Token lookup order:
 * 1. Check cookies first (for web browser sessions)
 * 2. Fall back to Authorization header (for API clients)
 * 
 * @param opts - Express request/response objects from tRPC adapter
 * @returns The context object available to all procedures
 */
export function createContext({ req, res }: CreateExpressContextOptions): Context {
  // Try to get token from cookie first
  // Cookies are automatically sent by the browser on every request
  let token = req.cookies?.token;
  
  // If no cookie, try Authorization header
  // This is how API clients (mobile apps, other services) send tokens
  if (!token) {
    token = extractTokenFromHeader(req.headers.authorization);
  }
  
  // Verify the token and get user info
  let user: DecodedToken | null = null;
  
  if (token) {
    // verifyToken returns null if token is invalid or expired
    user = verifyToken(token);
    
    // Optional: Log authentication for debugging
    if (user) {
      console.log(`🔐 Authenticated request from: ${user.username} (${user.role})`);
    } else {
      console.log('🔒 Invalid or expired token provided');
    }
  }
  
  // Return the context object
  return {
    prisma,
    user,
  };
}

/**
 * Type alias for context creation
 * 
 * This type is used by tRPC internally to infer the context type
 * from the createContext function.
 */
export type CreateContext = typeof createContext;
