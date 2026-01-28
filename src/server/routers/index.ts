/**
 * ============================================================================
 * MAIN ROUTER - Combines All Sub-Routers
 * ============================================================================
 * 
 * This is the root router that combines all feature routers into one.
 * It's the single entry point for all tRPC procedures.
 * 
 * Structure:
 * - auth.*     → Authentication (login, logout, me)
 * - employee.* → Employee CRUD operations
 * - member.*   → Dependent/family member operations
 * - policy.*   → Insurance policy information
 * 
 * How it works:
 * When the client calls `trpc.employee.list.query()`, tRPC:
 * 1. Parses the path: "employee.list"
 * 2. Finds the employee router
 * 3. Finds the list procedure
 * 4. Executes it with the provided input
 * 
 * The AppRouter type is exported and used by the client to get
 * full type safety across the network boundary.
 * ============================================================================
 */

import { router } from '../trpc';
import { authRouter } from './auth';
import { employeeRouter } from './employee';
import { memberRouter } from './member';
import { policyRouter } from './policy';

/**
 * Main Application Router
 * 
 * This combines all sub-routers into a single router that handles
 * all API requests. Each sub-router is mounted at a specific path:
 * 
 * - /api/trpc/auth.*     → authRouter
 * - /api/trpc/employee.* → employeeRouter
 * - /api/trpc/member.*   → memberRouter
 * - /api/trpc/policy.*   → policyRouter
 */
export const appRouter = router({
  /**
   * Authentication Router
   * Handles: login, logout, me (current user)
   * 
   * Example calls:
   * - trpc.auth.login.mutate({ username, password })
   * - trpc.auth.logout.mutate()
   * - trpc.auth.me.query()
   */
  auth: authRouter,
  
  /**
   * Employee Router
   * Handles: CRUD operations for employees
   * 
   * Example calls:
   * - trpc.employee.list.query({ page: 1, pageSize: 10 })
   * - trpc.employee.create.mutate({ firstName, lastName, ... })
   * - trpc.employee.bulkCreate.mutate({ csvContent, policyId })
   * - trpc.employee.delete.mutate({ id: 123 })
   */
  employee: employeeRouter,
  
  /**
   * Member Router
   * Handles: CRUD operations for dependents/family members
   * 
   * Example calls:
   * - trpc.member.listByEmployee.query({ employeeId: 1 })
   * - trpc.member.create.mutate({ firstName, relationship, employeeId })
   * - trpc.member.delete.mutate({ id: 456 }) // HR only!
   */
  member: memberRouter,
  
  /**
   * Policy Router
   * Handles: Insurance policy information
   * 
   * Example calls:
   * - trpc.policy.list.query()
   * - trpc.policy.getById.query({ id: 1 })
   * - trpc.policy.getStats.query({ id: 1 })
   */
  policy: policyRouter,
});

/**
 * Export the router type
 * 
 * This type is imported by the client to create a fully typed tRPC client.
 * It contains the complete type information for all procedures, including:
 * - Input types (what parameters each procedure accepts)
 * - Output types (what each procedure returns)
 * - Which procedures are queries vs mutations
 * 
 * Usage in client:
 * ```typescript
 * import type { AppRouter } from '@server/routers';
 * const trpc = createTRPCReact<AppRouter>();
 * ```
 */
export type AppRouter = typeof appRouter;
