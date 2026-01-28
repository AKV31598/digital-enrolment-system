/**
 * ============================================================================
 * EMPLOYEE ROUTER - Employee Management CRUD Operations
 * ============================================================================
 * 
 * This router handles all employee-related operations:
 * 
 * Procedures:
 * - list: Get all employees (HR only) or single employee (Employee)
 * - getById: Get a specific employee with their dependents
 * - create: Add a new employee (HR only)
 * - bulkCreate: Add multiple employees from CSV (HR only)
 * - update: Update employee information
 * - delete: Remove an employee and all their dependents (HR only)
 * 
 * Access Control:
 * - HR Managers: Full CRUD access to all employees
 * - Employees: Can only view their own profile
 * 
 * Important Business Rules:
 * - Employee code must be unique within a policy
 * - Deleting an employee cascades to delete all their dependents
 * - Bulk uploads validate all rows before inserting any
 * ============================================================================
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, hrProcedure } from '../trpc';
import { parseEmployeeCSV, rowsToCreateInputs } from '../utils/csv-parser';
import type { Gender } from '../../shared/types';

// ============================================================================
// ZOD SCHEMAS - Input Validation
// ============================================================================

/**
 * Schema for listing employees
 * Supports pagination, search, and filtering
 */
const listSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  department: z.string().optional(),
  policyId: z.number().optional(),
});

/**
 * Schema for getting a single employee
 */
const getByIdSchema = z.object({
  id: z.number(),
});

/**
 * Schema for creating a new employee
 * Required fields: employeeCode, firstName, lastName, email, policyId
 * Optional fields: phone, dateOfBirth, gender, department, designation
 */
const createSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),  // ISO date string
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  policyId: z.number(),
});

/**
 * Schema for bulk creating employees from CSV
 */
const bulkCreateSchema = z.object({
  csvContent: z.string().min(1, 'CSV content is required'),
  policyId: z.number(),
});

/**
 * Schema for updating an employee
 * All fields are optional - only include what needs to change
 */
const updateSchema = z.object({
  id: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

/**
 * Schema for deleting an employee
 */
const deleteSchema = z.object({
  id: z.number(),
});

// ============================================================================
// EMPLOYEE ROUTER
// ============================================================================

export const employeeRouter = router({
  /**
   * ========================================================================
   * LIST EMPLOYEES
   * ========================================================================
   * 
   * Returns a paginated list of employees.
   * 
   * HR Managers: See all employees across all policies they manage
   * Employees: See only themselves (redirected to getById)
   * 
   * Supports:
   * - Pagination (page, pageSize)
   * - Search by name or email
   * - Filter by department
   * - Filter by policy
   * 
   * @input { page, pageSize, search?, department?, policyId? }
   * @output { data: Employee[], total, page, pageSize, totalPages }
   */
  list: hrProcedure
    .input(listSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, department, policyId } = input;
      
      // Build the WHERE clause based on filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      
      // Search filter - search in firstName, lastName, or email
      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { employeeCode: { contains: search } },
        ];
      }
      
      // Department filter
      if (department) {
        where.department = department;
      }
      
      // Policy filter - important for multi-tenant scenarios
      if (policyId) {
        where.policyId = policyId;
      }
      
      // Count total matching records (for pagination)
      const total = await ctx.prisma.employee.count({ where });
      
      // Fetch the page of employees
      const employees = await ctx.prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,  // Offset for pagination
        take: pageSize,                // Limit
        orderBy: { createdAt: 'desc' }, // Newest first
        include: {
          // Include count of dependents for each employee
          _count: {
            select: { members: true },
          },
        },
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data: employees,
        total,
        page,
        pageSize,
        totalPages,
      };
    }),

  /**
   * ========================================================================
   * GET EMPLOYEE BY ID
   * ========================================================================
   * 
   * Returns a single employee with all their details and dependents.
   * 
   * Access Control:
   * - HR Managers can view any employee
   * - Employees can only view themselves
   * 
   * @input { id: number }
   * @output Employee with members (dependents)
   */
  getById: protectedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      // Fetch the employee with their dependents
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.id },
        include: {
          members: {
            orderBy: [
              // Sort dependents: SELF first, then by relationship
              { relationship: 'asc' },
              { createdAt: 'asc' },
            ],
          },
          policy: true,  // Include policy information
        },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      // Access control check
      // Employees can only view their own profile
      if (ctx.user.role === 'EMPLOYEE') {
        // Check if this employee is linked to the current user
        if (employee.userId !== ctx.user.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own profile',
          });
        }
      }
      
      return employee;
    }),

  /**
   * ========================================================================
   * GET CURRENT EMPLOYEE (for logged-in employees)
   * ========================================================================
   * 
   * Returns the employee record for the currently logged-in user.
   * Convenience method so employees don't need to know their employee ID.
   * 
   * @output Employee with members and policy
   */
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      // Find employee linked to current user
      const employee = await ctx.prisma.employee.findUnique({
        where: { userId: ctx.user.userId },
        include: {
          members: {
            orderBy: [
              { relationship: 'asc' },
              { createdAt: 'asc' },
            ],
          },
          policy: true,
        },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No employee record found for your account',
        });
      }
      
      return employee;
    }),

  /**
   * ========================================================================
   * CREATE EMPLOYEE
   * ========================================================================
   * 
   * Creates a new employee in the system.
   * HR Manager only.
   * 
   * Business Rules:
   * - Employee code must be unique within the policy
   * - A "SELF" member record is automatically created
   * 
   * @input CreateEmployeeInput
   * @output The created employee
   */
  create: hrProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if employee code already exists in this policy
      const existing = await ctx.prisma.employee.findUnique({
        where: {
          policyId_employeeCode: {
            policyId: input.policyId,
            employeeCode: input.employeeCode,
          },
        },
      });
      
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Employee code '${input.employeeCode}' already exists in this policy`,
        });
      }
      
      // Verify the policy exists
      const policy = await ctx.prisma.insurancePolicy.findUnique({
        where: { id: input.policyId },
      });
      
      if (!policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Insurance policy not found',
        });
      }
      
      // Create the employee with a "SELF" member record
      const employee = await ctx.prisma.employee.create({
        data: {
          employeeCode: input.employeeCode,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender,
          department: input.department,
          designation: input.designation,
          policyId: input.policyId,
          // Automatically create a "SELF" member record
          members: {
            create: {
              firstName: input.firstName,
              lastName: input.lastName,
              dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
              gender: input.gender,
              relationship: 'SELF',
              createdById: ctx.user.userId,
            },
          },
        },
        include: {
          members: true,
        },
      });
      
      console.log(`✅ Created employee: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`);
      
      return employee;
    }),

  /**
   * ========================================================================
   * BULK CREATE EMPLOYEES
   * ========================================================================
   * 
   * Creates multiple employees from CSV data.
   * HR Manager only.
   * 
   * Process:
   * 1. Parse CSV content
   * 2. Validate all rows
   * 3. Check for duplicate employee codes
   * 4. Create all valid employees in a transaction
   * 
   * @input { csvContent: string, policyId: number }
   * @output BulkUploadResult with success/failure counts
   */
  bulkCreate: hrProcedure
    .input(bulkCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { csvContent, policyId } = input;
      
      // Verify the policy exists
      const policy = await ctx.prisma.insurancePolicy.findUnique({
        where: { id: policyId },
      });
      
      if (!policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Insurance policy not found',
        });
      }
      
      // Step 1: Parse and validate CSV
      const validationResults = parseEmployeeCSV(csvContent);
      
      if (validationResults.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The uploaded file is empty or has no valid data',
        });
      }
      
      // Step 2: Separate valid and invalid rows
      const validRows = validationResults.filter((r) => r.isValid);
      const invalidRows = validationResults.filter((r) => !r.isValid);
      
      // Step 3: Check for duplicate employee codes in the database
      const employeeCodes = validRows.map((r) => r.data.employeeCode);
      const existingEmployees = await ctx.prisma.employee.findMany({
        where: {
          policyId,
          employeeCode: { in: employeeCodes },
        },
        select: { employeeCode: true },
      });
      
      const existingCodes = new Set(existingEmployees.map((e) => e.employeeCode));
      
      // Mark duplicates as invalid
      const finalValidRows = validRows.filter((r) => {
        if (existingCodes.has(r.data.employeeCode)) {
          invalidRows.push({
            ...r,
            isValid: false,
            errors: [...r.errors, `Employee code '${r.data.employeeCode}' already exists`],
          });
          return false;
        }
        return true;
      });
      
      // Step 4: Create employees in a transaction
      let successCount = 0;
      
      if (finalValidRows.length > 0) {
        // Convert rows to create inputs
        const createInputs = rowsToCreateInputs(finalValidRows, policyId);
        
        // Use transaction to ensure all-or-nothing
        await ctx.prisma.$transaction(async (tx) => {
          for (const input of createInputs) {
            await tx.employee.create({
              data: {
                employeeCode: input.employeeCode,
                firstName: input.firstName,
                lastName: input.lastName,
                email: input.email,
                phone: input.phone,
                dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
                gender: input.gender as Gender | undefined,
                department: input.department,
                designation: input.designation,
                policyId: input.policyId,
                // Create SELF member
                members: {
                  create: {
                    firstName: input.firstName,
                    lastName: input.lastName,
                    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
                    gender: input.gender as Gender | undefined,
                    relationship: 'SELF',
                    createdById: ctx.user.userId,
                  },
                },
              },
            });
            successCount++;
          }
        });
      }
      
      console.log(`📦 Bulk upload: ${successCount} created, ${invalidRows.length} failed`);
      
      return {
        success: invalidRows.length === 0,
        totalRows: validationResults.length,
        successCount,
        failedCount: invalidRows.length,
        errors: invalidRows,
      };
    }),

  /**
   * ========================================================================
   * UPDATE EMPLOYEE
   * ========================================================================
   * 
   * Updates an existing employee's information.
   * 
   * Access Control:
   * - HR Managers can update any employee
   * - Employees cannot update their own profile (must go through HR)
   * 
   * @input UpdateEmployeeInput
   * @output The updated employee
   */
  update: hrProcedure
    .input(updateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      // Check employee exists
      const existing = await ctx.prisma.employee.findUnique({
        where: { id },
      });
      
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      // Build update data (only include provided fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      
      if (updateData.firstName !== undefined) data.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) data.lastName = updateData.lastName;
      if (updateData.email !== undefined) data.email = updateData.email;
      if (updateData.phone !== undefined) data.phone = updateData.phone;
      if (updateData.gender !== undefined) data.gender = updateData.gender;
      if (updateData.department !== undefined) data.department = updateData.department;
      if (updateData.designation !== undefined) data.designation = updateData.designation;
      if (updateData.dateOfBirth !== undefined) {
        data.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
      }
      
      // Update the employee
      const employee = await ctx.prisma.employee.update({
        where: { id },
        data,
        include: {
          members: true,
        },
      });
      
      console.log(`✏️ Updated employee: ${employee.firstName} ${employee.lastName}`);
      
      return employee;
    }),

  /**
   * ========================================================================
   * DELETE EMPLOYEE
   * ========================================================================
   * 
   * Deletes an employee and ALL their dependents.
   * HR Manager only.
   * 
   * IMPORTANT: This is a destructive operation!
   * - All members (dependents) are deleted via CASCADE
   * - This cannot be undone
   * 
   * @input { id: number }
   * @output { success: true, deletedMembersCount: number }
   */
  delete: hrProcedure
    .input(deleteSchema)
    .mutation(async ({ ctx, input }) => {
      // Check employee exists and get member count
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { members: true } },
        },
      });
      
      if (!employee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Employee not found',
        });
      }
      
      const memberCount = employee._count.members;
      
      // Delete the employee (members are deleted via CASCADE)
      await ctx.prisma.employee.delete({
        where: { id: input.id },
      });
      
      console.log(`🗑️ Deleted employee: ${employee.firstName} ${employee.lastName} and ${memberCount} dependents`);
      
      return {
        success: true,
        deletedMembersCount: memberCount,
      };
    }),

  /**
   * ========================================================================
   * GET DEPARTMENTS
   * ========================================================================
   * 
   * Returns a list of unique departments for filtering.
   * Useful for populating dropdown filters.
   * 
   * @output string[] - List of department names
   */
  getDepartments: protectedProcedure
    .query(async ({ ctx }) => {
      const departments = await ctx.prisma.employee.findMany({
        where: {
          department: { not: null },
        },
        select: {
          department: true,
        },
        distinct: ['department'],
      });
      
      return departments
        .map((d) => d.department)
        .filter((d): d is string => d !== null);
    }),
});
