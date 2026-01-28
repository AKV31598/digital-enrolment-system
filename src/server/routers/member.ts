/**
 * ============================================================================
 * MEMBER ROUTER - Dependent/Family Member Management
 * ============================================================================
 * 
 * This router handles all member (dependent) operations:
 * 
 * Procedures:
 * - listByEmployee: Get all dependents for an employee
 * - getById: Get a specific member
 * - create: Add a new dependent
 * - update: Update dependent information
 * - delete: Remove a dependent (HR ONLY!)
 * 
 * KEY BUSINESS RULE:
 * - HR Managers: Full CRUD access to all members
 * - Employees: Can CREATE and UPDATE their own dependents
 * - Employees: CANNOT DELETE dependents (only HR can remove from policy)
 * 
 * This is a critical security requirement from the task specification!
 * ============================================================================
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, hrProcedure } from '../trpc';

// ============================================================================
// ZOD SCHEMAS - Input Validation
// ============================================================================

/**
 * Schema for listing members by employee
 */
const listByEmployeeSchema = z.object({
  employeeId: z.number(),
});

/**
 * Schema for getting a single member
 */
const getByIdSchema = z.object({
  id: z.number(),
});

/**
 * Schema for creating a new member/dependent
 * 
 * Relationship types:
 * - SELF: The employee themselves (usually auto-created)
 * - SPOUSE: Husband/Wife
 * - CHILD: Son/Daughter
 * - PARENT: Father/Mother (some policies include parents)
 */
const createSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  relationship: z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT']),
  employeeId: z.number(),
});

/**
 * Schema for updating a member
 */
const updateSchema = z.object({
  id: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  relationship: z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT']).optional(),
});

/**
 * Schema for deleting a member
 */
const deleteSchema = z.object({
  id: z.number(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user can access a specific employee's data
 * 
 * @param userRole - The current user's role
 * @param userId - The current user's ID
 * @param employee - The employee record to check access for
 * @returns boolean - True if access is allowed
 */
function canAccessEmployee(
  userRole: string,
  userId: number,
  employee: { userId: number | null }
): boolean {
  // HR Managers can access any employee
  if (userRole === 'HR_MANAGER') return true;
  
  // Employees can only access their own data
  return employee.userId === userId;
}

// ============================================================================
// MEMBER ROUTER
// ============================================================================

export const memberRouter = router({
  /**
   * ========================================================================
   * LIST MEMBERS BY EMPLOYEE
   * ========================================================================
   * 
   * Returns all dependents for a specific employee.
   * 
   * Access Control:
   * - HR Managers can view any employee's dependents
   * - Employees can only view their own dependents
   * 
   * @input { employeeId: number }
   * @output Member[] - Array of dependents
   */
  listByEmployee: protectedProcedure
    .input(listByEmployeeSchema)
    .query(async ({ ctx, input }) => {
      // First, get the employee to check access
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.employeeId },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      // Check if user has access to this employee's data
      if (!canAccessEmployee(ctx.user.role, ctx.user.userId, employee)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own dependents',
        });
      }
      
      // Fetch all members for this employee
      const members = await ctx.prisma.member.findMany({
        where: { employeeId: input.employeeId },
        orderBy: [
          // Sort: SELF first, then alphabetically by relationship
          { relationship: 'asc' },
          { firstName: 'asc' },
        ],
      });
      
      return members;
    }),

  /**
   * ========================================================================
   * GET MEMBER BY ID
   * ========================================================================
   * 
   * Returns a single member's details.
   * 
   * @input { id: number }
   * @output Member
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.member.findUnique({
        where: { id: input.id },
        include: {
          employee: true, // Include employee to check access
        },
      });
      
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }
      
      // Check access
      if (!canAccessEmployee(ctx.user.role, ctx.user.userId, member.employee)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this member',
        });
      }
      
      return member;
    }),

  /**
   * ========================================================================
   * CREATE MEMBER (Dependent)
   * ========================================================================
   * 
   * Adds a new dependent to an employee's policy.
   * 
   * Access Control:
   * - HR Managers can add dependents to any employee
   * - Employees can add dependents to themselves only
   * 
   * Business Rules:
   * - Only one SELF record per employee
   * - Only one SPOUSE per employee (typically)
   * 
   * @input CreateMemberInput
   * @output The created member
   */
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the employee to check access
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.employeeId },
        include: {
          members: true, // Get existing members for validation
        },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      // Check access
      if (!canAccessEmployee(ctx.user.role, ctx.user.userId, employee)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only add dependents to your own policy',
        });
      }
      
      // Business rule: Only one SELF record per employee
      if (input.relationship === 'SELF') {
        const hasSelf = employee.members.some((m) => m.relationship === 'SELF');
        if (hasSelf) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Employee already has a SELF record',
          });
        }
      }
      
      // Business rule: Only one SPOUSE per employee
      if (input.relationship === 'SPOUSE') {
        const hasSpouse = employee.members.some((m) => m.relationship === 'SPOUSE');
        if (hasSpouse) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Employee already has a spouse registered',
          });
        }
      }
      
      // Create the member
      const member = await ctx.prisma.member.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender,
          relationship: input.relationship,
          employeeId: input.employeeId,
          createdById: ctx.user.userId, // Track who created this
        },
      });
      
      console.log(`✅ Created member: ${member.firstName} ${member.lastName} (${member.relationship})`);
      
      return member;
    }),

  /**
   * ========================================================================
   * UPDATE MEMBER
   * ========================================================================
   * 
   * Updates an existing member's information.
   * 
   * Access Control:
   * - HR Managers can update any member
   * - Employees can update their own dependents
   * 
   * @input UpdateMemberInput
   * @output The updated member
   */
  update: protectedProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // Get the member with employee to check access
      const existing = await ctx.prisma.member.findUnique({
        where: { id },
        include: { employee: true },
      });
      
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }
      
      // Check access
      if (!canAccessEmployee(ctx.user.role, ctx.user.userId, existing.employee)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own dependents',
        });
      }
      
      // Build update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      
      if (updateData.firstName !== undefined) data.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) data.lastName = updateData.lastName;
      if (updateData.gender !== undefined) data.gender = updateData.gender;
      if (updateData.relationship !== undefined) data.relationship = updateData.relationship;
      if (updateData.dateOfBirth !== undefined) {
        data.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
      }
      
      // Update the member
      const member = await ctx.prisma.member.update({
        where: { id },
        data,
      });
      
      console.log(`✏️ Updated member: ${member.firstName} ${member.lastName}`);
      
      return member;
    }),

  /**
   * ========================================================================
   * DELETE MEMBER - HR ONLY!
   * ========================================================================
   * 
   * Removes a dependent from the policy.
   * 
   * ⚠️ CRITICAL: This is HR ONLY!
   * Employees CANNOT delete dependents - this is a key business rule.
   * Once someone is added to a policy, only HR can remove them.
   * 
   * @input { id: number }
   * @output { success: true }
   */
  delete: hrProcedure  // <-- Note: hrProcedure, not protectedProcedure!
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => {
      // Check member exists
      const member = await ctx.prisma.member.findUnique({
        where: { id: input.id },
        include: { employee: true },
      });
      
      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }
      
      // Prevent deleting SELF record (would orphan the employee)
      if (member.relationship === 'SELF') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete the employee\'s own (SELF) record. Delete the employee instead.',
        });
      }
      
      // Delete the member
      await ctx.prisma.member.delete({
        where: { id: input.id },
      });
      
      console.log(`🗑️ Deleted member: ${member.firstName} ${member.lastName} from employee ${member.employee.firstName} ${member.employee.lastName}`);
      
      return { success: true };
    }),

  /**
   * ========================================================================
   * GET MEMBER COUNTS BY RELATIONSHIP
   * ========================================================================
   * 
   * Returns statistics about member types for an employee.
   * Useful for dashboards and summaries.
   * 
   * @input { employeeId: number }
   * @output { self: number, spouse: number, children: number, parents: number, total: number }
   */
  getStats: protectedProcedure
    .input(listByEmployeeSchema)
    .query(async ({ ctx, input }) => {
      // Check access first
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.employeeId },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      if (!canAccessEmployee(ctx.user.role, ctx.user.userId, employee)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this data',
        });
      }
      
      // Count members by relationship
      const members = await ctx.prisma.member.findMany({
        where: { employeeId: input.employeeId },
        select: { relationship: true },
      });
      
      const stats = {
        self: 0,
        spouse: 0,
        children: 0,
        parents: 0,
        total: members.length,
      };
      
      for (const member of members) {
        switch (member.relationship) {
          case 'SELF':
            stats.self++;
            break;
          case 'SPOUSE':
            stats.spouse++;
            break;
          case 'CHILD':
            stats.children++;
            break;
          case 'PARENT':
            stats.parents++;
            break;
        }
      }
      
      return stats;
    }),
});
