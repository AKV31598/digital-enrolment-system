/**
 * ============================================================================
 * tRPC INITIALIZATION - Core tRPC Setup
 * ============================================================================
 * 
 * This file initializes tRPC and creates reusable building blocks:
 * 
 * 1. The tRPC instance with our context type
 * 2. The router creator for grouping procedures
 * 3. Procedures with different protection levels:
 *    - publicProcedure: Anyone can call (login, health check)
 *    - protectedProcedure: Must be logged in
 *    - hrProcedure: Must be HR Manager
 *    - employeeProcedure: Must be Employee (or HR with employee context)
 * 
 * What is tRPC?
 * -------------
 * tRPC lets you build type-safe APIs without schemas. When you define a
 * procedure on the server, the client automatically knows the input/output
 * types. No code generation, no OpenAPI specs, just TypeScript.
 * 
 * Key Concepts:
 * - Procedure: A single API endpoint (query or mutation)
 * - Router: A group of related procedures
 * - Middleware: Code that runs before procedures (auth checks, logging)
 * ============================================================================
 */

import { initTRPC, TRPCError } from '@trpc/server';
//import superjson from 'superjson';
import type { Context } from './context';

/**
 * Initialize tRPC with our context type
 * 
 * Configuration:
 * - context: Our Context type (prisma + user)
 * - transformer: SuperJSON for serializing dates, Maps, Sets, etc.
 * 
 * Why SuperJSON?
 * JSON doesn't support Date objects, Maps, Sets, BigInts, etc.
 * SuperJSON automatically handles serialization/deserialization of these types.
 * Without it, dates would become strings and you'd need manual conversion.
 */
const t = initTRPC.context<Context>().create({
  //transformer: superjson,
  
  /**
   * Error formatting
   * 
   * This controls how errors are sent to the client.
   * In development, we include more details for debugging.
   * In production, we hide internal details for security.
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Include stack trace in development only
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});

/**
 * Create a router
 * 
 * Routers group related procedures together.
 * Export this to use in your router files.
 * 
 * @example
 * // In auth.ts
 * export const authRouter = router({
 *   login: publicProcedure.mutation(...),
 *   logout: protectedProcedure.mutation(...),
 * });
 */
export const router = t.router;

/**
 * Merge multiple routers
 * 
 * Used to combine all sub-routers into one main router.
 */
export const mergeRouters = t.mergeRouters;

// ============================================================================
// MIDDLEWARE DEFINITIONS
// ============================================================================

/**
 * Logging middleware
 * 
 * Logs every procedure call with timing information.
 * Useful for debugging and performance monitoring.
 * 
 * Example log output:
 * [TRPC] employee.list started
 * [TRPC] employee.list completed in 45ms
 */
const loggerMiddleware = t.middleware(async ({ path, next }) => {
  const start = Date.now();
  console.log(`[TRPC] ${path} started`);
  
  const result = await next();
  
  const duration = Date.now() - start;
  console.log(`[TRPC] ${path} completed in ${duration}ms`);
  
  return result;
});

/**
 * Authentication middleware
 * 
 * Checks if the user is logged in. If not, throws an UNAUTHORIZED error.
 * Used by protectedProcedure to ensure only authenticated users can access.
 * 
 * This is the gatekeeper - it runs BEFORE your procedure code.
 */
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  // Check if user is present in context (set by createContext)
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }
  
  // User is authenticated, continue to the procedure
  // We narrow the type so procedures know user is definitely not null
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now TypeScript knows user is not null
    },
  });
});

/**
 * HR Manager authorization middleware
 * 
 * Checks if the authenticated user has the HR_MANAGER role.
 * Must be used AFTER isAuthenticated (user must exist).
 * 
 * Used for operations only HR should perform:
 * - Delete employees
 * - Delete dependents
 * - Bulk upload
 */
const isHRManager = t.middleware(async ({ ctx, next }) => {
  // First ensure user is authenticated
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }
  
  // Then check their role
  if (ctx.user.role !== 'HR_MANAGER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only HR Managers can perform this action',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Employee authorization middleware
 * 
 * Checks if the authenticated user has the EMPLOYEE role.
 * Used for employee-specific operations.
 */
const isEmployee = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }
  
  if (ctx.user.role !== 'EMPLOYEE') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This action is only available for employees',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// ============================================================================
// PROCEDURE DEFINITIONS
// ============================================================================

/**
 * Public procedure
 * 
 * No authentication required. Anyone can call these.
 * Use sparingly - most endpoints should require auth.
 * 
 * Examples:
 * - Login
 * - Health check
 * - Public information
 */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/**
 * Protected procedure
 * 
 * Requires authentication. Any logged-in user can call.
 * Use for general authenticated operations.
 * 
 * Examples:
 * - Get current user
 * - View dashboard
 * - Logout
 */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isAuthenticated);

/**
 * HR Manager procedure
 * 
 * Requires HR_MANAGER role. Only HR users can call.
 * Use for sensitive HR operations.
 * 
 * Examples:
 * - Create/delete employees
 * - Delete dependents
 * - Bulk upload
 * - View all employees
 */
export const hrProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isHRManager);

/**
 * Employee procedure
 * 
 * Requires EMPLOYEE role. Only employees can call.
 * Use for employee-specific operations.
 * 
 * Examples:
 * - View own profile
 * - Add own dependents
 * - Update own dependents
 */
export const employeeProcedure = t.procedure
  .use(loggerMiddleware)
  .use(isEmployee);
