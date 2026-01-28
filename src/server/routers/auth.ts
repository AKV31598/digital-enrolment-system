/**
 * ============================================================================
 * AUTHENTICATION ROUTER - Login, Logout, and User Info
 * ============================================================================
 * 
 * This router handles all authentication-related operations:
 * 
 * Procedures:
 * - login: Authenticate with username/password, receive JWT token
 * - logout: Clear authentication (invalidate session)
 * - me: Get current user information
 * 
 * Authentication Flow:
 * 1. User submits username/password to login procedure
 * 2. We verify credentials against the database (bcrypt)
 * 3. If valid, we generate a JWT token and return it
 * 4. Client stores token and sends it with future requests
 * 5. Protected procedures verify the token and allow access
 * 
 * Security Notes:
 * - Passwords are compared using bcrypt (timing-attack resistant)
 * - Tokens expire after 7 days (configurable in auth.ts)
 * - Failed login attempts don't reveal if username exists
 * ============================================================================
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { comparePassword, generateToken } from '../utils/auth';
import type { UserRole } from '../../shared/types';

/**
 * Zod Schema: Login Input
 * 
 * Validates the login request data:
 * - username: Required, at least 1 character
 * - password: Required, at least 1 character
 * 
 * Zod automatically rejects invalid inputs before our code runs.
 */
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Authentication Router
 * 
 * Contains all authentication-related procedures.
 * Mounted at /api/trpc/auth.*
 */
export const authRouter = router({
  /**
   * ========================================================================
   * LOGIN PROCEDURE
   * ========================================================================
   * 
   * Authenticates a user with username and password.
   * Returns a JWT token on success.
   * 
   * Endpoint: POST /api/trpc/auth.login
   * Access: Public (no authentication required)
   * 
   * @input { username: string, password: string }
   * @output { token: string, user: User }
   * 
   * Error Cases:
   * - Invalid credentials: Returns generic error (doesn't reveal if user exists)
   * - Validation error: Zod automatically handles malformed input
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      // Step 1: Find user by username
      // We include password because we need it for comparison
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username },
      });
      
      // Step 2: Check if user exists
      // Note: We use a generic error message for security
      // Saying "user not found" would let attackers know valid usernames
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }
      
      // Step 3: Verify password using bcrypt
      // bcrypt.compare is timing-attack resistant
      const isPasswordValid = await comparePassword(input.password, user.password);
      
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }
      
      // Step 4: Generate JWT token
      // Token contains: userId, username, role
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });
      
      // Step 5: Return token and user info (excluding password!)
      console.log(`✅ User ${user.username} logged in successfully`);
      
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role as UserRole,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    }),

  /**
   * ========================================================================
   * LOGOUT PROCEDURE
   * ========================================================================
   * 
   * Logs out the current user.
   * 
   * In a stateless JWT system, logout is handled client-side by:
   * - Removing the token from storage
   * - Clearing cookies
   * 
   * This procedure exists for completeness and can be used to:
   * - Log the logout event
   * - Implement token blacklisting (advanced)
   * - Clear server-side sessions (if implemented)
   * 
   * Endpoint: POST /api/trpc/auth.logout
   * Access: Protected (must be logged in)
   * 
   * @output { success: true }
   */
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Log the logout for audit purposes
      console.log(`👋 User ${ctx.user.username} logged out`);
      
      // In a more complex system, we might:
      // - Add the token to a blacklist
      // - Clear server-side session data
      // - Revoke refresh tokens
      
      return { success: true };
    }),

  /**
   * ========================================================================
   * ME PROCEDURE
   * ========================================================================
   * 
   * Returns the current authenticated user's information.
   * 
   * Used by the frontend to:
   * - Check if the user is still logged in
   * - Get user details for display
   * - Determine what features to show based on role
   * 
   * Endpoint: GET /api/trpc/auth.me
   * Access: Protected (must be logged in)
   * 
   * @output User (current user's data)
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch fresh user data from database
      // (Token data might be stale if user updated their profile)
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.userId },
        // Include employee info if this user is an employee
        include: {
          employee: {
            include: {
              policy: true,  // Include their insurance policy info
            },
          },
        },
      });
      
      if (!user) {
        // This shouldn't happen (token is valid but user deleted)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User account not found',
        });
      }
      
      // Return user data (excluding password!)
      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as UserRole,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Include employee data if available
        employee: user.employee ? {
          id: user.employee.id,
          employeeCode: user.employee.employeeCode,
          department: user.employee.department,
          designation: user.employee.designation,
          policyId: user.employee.policyId,
          policy: user.employee.policy,
        } : null,
      };
    }),
});
