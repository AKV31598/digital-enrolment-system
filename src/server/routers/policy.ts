/**
 * ============================================================================
 * POLICY ROUTER - Insurance Policy Management
 * ============================================================================
 * 
 * This router handles insurance policy operations:
 * 
 * Procedures:
 * - list: Get all policies (HR only)
 * - getById: Get a specific policy with statistics
 * - getCurrent: Get the policy for the current employee
 * 
 * In this application, policies are pre-created and managed externally.
 * This router mainly provides read access to policy information.
 * 
 * Future enhancements could include:
 * - Create policy (admin only)
 * - Update policy details
 * - Policy analytics
 * ============================================================================
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, hrProcedure } from '../trpc';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const getByIdSchema = z.object({
  id: z.number(),
});

// ============================================================================
// POLICY ROUTER
// ============================================================================

export const policyRouter = router({
  /**
   * ========================================================================
   * LIST POLICIES
   * ========================================================================
   * 
   * Returns all insurance policies managed by the current HR user.
   * HR Manager only.
   * 
   * @output Policy[] with employee counts
   */
  list: hrProcedure
    .query(async ({ ctx }) => {
      // Get policies managed by this HR user
      const policies = await ctx.prisma.insurancePolicy.findMany({
        where: {
          hrManagerId: ctx.user.userId,
        },
        include: {
          _count: {
            select: {
              employees: true, // Count of employees in each policy
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Also get member counts for each policy
      const policiesWithStats = await Promise.all(
        policies.map(async (policy) => {
          // Count total members across all employees in this policy
          const memberCount = await ctx.prisma.member.count({
            where: {
              employee: {
                policyId: policy.id,
              },
            },
          });
          
          return {
            ...policy,
            employeeCount: policy._count.employees,
            memberCount,
          };
        })
      );
      
      return policiesWithStats;
    }),

  /**
   * ========================================================================
   * GET POLICY BY ID
   * ========================================================================
   * 
   * Returns a specific policy with detailed statistics.
   * 
   * Access Control:
   * - HR Managers can view any policy they manage
   * - Employees can view the policy they belong to
   * 
   * @input { id: number }
   * @output Policy with statistics
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const policy = await ctx.prisma.insurancePolicy.findUnique({
        where: { id: input.id },
        include: {
          hrManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      });
      
      if (!policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Insurance policy not found',
        });
      }
      
      // Access control for employees
      if (ctx.user.role === 'EMPLOYEE') {
        // Check if this employee belongs to this policy
        const employee = await ctx.prisma.employee.findUnique({
          where: { userId: ctx.user.userId },
        });
        
        if (!employee || employee.policyId !== input.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own policy',
          });
        }
      }
      
      // Get additional statistics
      const memberCount = await ctx.prisma.member.count({
        where: {
          employee: {
            policyId: input.id,
          },
        },
      });
      
      // Get department breakdown
      const departmentStats = await ctx.prisma.employee.groupBy({
        by: ['department'],
        where: {
          policyId: input.id,
          department: { not: null },
        },
        _count: true,
      });
      
      return {
        ...policy,
        employeeCount: policy._count.employees,
        memberCount,
        departmentBreakdown: departmentStats.map((d) => ({
          department: d.department,
          count: d._count,
        })),
      };
    }),

  /**
   * ========================================================================
   * GET CURRENT EMPLOYEE'S POLICY
   * ========================================================================
   * 
   * Returns the policy for the currently logged-in employee.
   * Convenience method so employees don't need to know their policy ID.
   * 
   * @output Policy with basic statistics
   */
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      // Find the employee record for current user
      const employee = await ctx.prisma.employee.findUnique({
        where: { userId: ctx.user.userId },
        include: {
          policy: {
            include: {
              _count: {
                select: {
                  employees: true,
                },
              },
            },
          },
        },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No employee record found for your account',
        });
      }
      
      if (!employee.policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No policy found for your employee record',
        });
      }
      
      return {
        ...employee.policy,
        employeeCount: employee.policy._count.employees,
      };
    }),

  /**
   * ========================================================================
   * GET POLICY STATISTICS (Dashboard)
   * ========================================================================
   * 
   * Returns aggregated statistics for a policy.
   * Used for dashboard displays.
   * 
   * @input { id: number }
   * @output Statistics object
   */
  getStats: hrProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const policy = await ctx.prisma.insurancePolicy.findUnique({
        where: { id: input.id },
      });
      
      if (!policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Policy not found',
        });
      }
      
      // Get various counts
      const employeeCount = await ctx.prisma.employee.count({
        where: { policyId: input.id },
      });
      
      const memberCount = await ctx.prisma.member.count({
        where: {
          employee: { policyId: input.id },
        },
      });
      
      // Members by relationship
      const membersByRelationship = await ctx.prisma.member.groupBy({
        by: ['relationship'],
        where: {
          employee: { policyId: input.id },
        },
        _count: true,
      });
      
      // Recent additions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentEmployees = await ctx.prisma.employee.count({
        where: {
          policyId: input.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      });
      
      const recentMembers = await ctx.prisma.member.count({
        where: {
          employee: { policyId: input.id },
          createdAt: { gte: thirtyDaysAgo },
        },
      });
      
      return {
        policyId: input.id,
        policyName: policy.policyName,
        companyName: policy.companyName,
        employeeCount,
        memberCount,
        membersByRelationship: membersByRelationship.map((m) => ({
          relationship: m.relationship,
          count: m._count,
        })),
        recentAdditions: {
          employees: recentEmployees,
          members: recentMembers,
          period: '30 days',
        },
      };
    }),
});
