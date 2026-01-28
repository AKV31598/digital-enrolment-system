/**
 * ============================================================================
 * SHARED TYPES - Digital Enrolment System
 * ============================================================================
 * 
 * This file contains TypeScript types that are used by BOTH the frontend
 * and backend. By keeping types in a shared location, we ensure:
 * 
 * 1. Type Safety: The same types are used everywhere
 * 2. Consistency: No mismatch between API requests and responses
 * 3. DRY Principle: Don't Repeat Yourself - define once, use everywhere
 * 
 * These types mirror our Prisma models but are framework-agnostic,
 * making them usable in any context.
 * ============================================================================
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * Possible user roles in the system
 * 
 * HR_MANAGER: Full access to all employees and dependents
 * - Can create, read, update, delete employees
 * - Can create, read, update, delete dependents
 * - Can perform bulk uploads
 * 
 * EMPLOYEE: Limited access
 * - Can view own profile and dependents
 * - Can add/edit own dependents
 * - CANNOT delete dependents
 * - CANNOT view other employees
 */
export type UserRole = 'HR_MANAGER' | 'EMPLOYEE';

/**
 * User object as returned by the API
 * Note: Password is NEVER included in API responses
 */
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to log in a user
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Response from the login endpoint
 * Includes the JWT token and user info
 */
export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================================
// INSURANCE POLICY TYPES
// ============================================================================

/**
 * Insurance Policy object
 * Represents a group insurance policy purchased by a company
 */
export interface InsurancePolicy {
  id: number;
  policyNumber: string;
  policyName: string;
  companyName: string;
  hrManagerId: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Policy with additional statistics
 * Used in dashboard views
 */
export interface PolicyWithStats extends InsurancePolicy {
  employeeCount: number;
  memberCount: number;
}

// ============================================================================
// EMPLOYEE TYPES
// ============================================================================

/**
 * Gender options for employees and dependents
 */
export type Gender = 'Male' | 'Female' | 'Other';

/**
 * Employee object as returned by the API
 */
export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  department: string | null;
  designation: string | null;
  policyId: number;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee with their dependents included
 * Used when viewing employee details
 */
export interface EmployeeWithMembers extends Employee {
  members: Member[];
}

/**
 * Employee with policy information
 */
export interface EmployeeWithPolicy extends Employee {
  policy: InsurancePolicy;
}

/**
 * Data required to create a new employee
 * All optional fields are marked with ?
 */
export interface CreateEmployeeInput {
  employeeCode: string;         // Required: Company's employee ID
  firstName: string;            // Required
  lastName: string;             // Required
  email: string;                // Required
  phone?: string;               // Optional
  dateOfBirth?: string;         // Optional: ISO date string (YYYY-MM-DD)
  gender?: Gender;              // Optional
  department?: string;          // Optional
  designation?: string;         // Optional
  policyId: number;             // Required: Which policy to add to
}

/**
 * Data required to update an existing employee
 * All fields are optional - only include what needs to change
 */
export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  department?: string;
  designation?: string;
}

// ============================================================================
// MEMBER (DEPENDENT) TYPES
// ============================================================================

/**
 * Relationship types for dependents
 * 
 * SELF: The employee themselves (required for insurance)
 * SPOUSE: Husband/Wife of the employee
 * CHILD: Son/Daughter of the employee
 * PARENT: Father/Mother of the employee (some policies allow this)
 */
export type Relationship = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT';

/**
 * Member (Dependent) object as returned by the API
 */
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: Gender | null;
  relationship: Relationship;
  employeeId: number;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Member with their associated employee
 */
export interface MemberWithEmployee extends Member {
  employee: Employee;
}

/**
 * Data required to create a new member/dependent
 */
export interface CreateMemberInput {
  firstName: string;            // Required
  lastName: string;             // Required
  dateOfBirth?: string;         // Optional: ISO date string
  gender?: Gender;              // Optional
  relationship: Relationship;   // Required: How they're related to employee
  employeeId: number;           // Required: Which employee they belong to
}

/**
 * Data required to update an existing member
 */
export interface UpdateMemberInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  relationship?: Relationship;
}

// ============================================================================
// BULK UPLOAD TYPES
// ============================================================================

/**
 * A single row from a CSV file for bulk employee upload
 * All fields are strings because they come from CSV parsing
 */
export interface BulkEmployeeRow {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  department?: string;
  designation?: string;
}

/**
 * Result of validating a single row
 * Contains the row number, data, and any validation errors
 */
export interface BulkValidationResult {
  rowNumber: number;
  data: BulkEmployeeRow;
  isValid: boolean;
  errors: string[];  // List of error messages for this row
}

/**
 * Overall result of a bulk upload operation
 */
export interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: BulkValidationResult[];  // Only failed rows
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ApiError {
  success: false;
  error: string;
  details?: string[];
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

/**
 * Options for listing employees
 * Used for search, filtering, and pagination
 */
export interface EmployeeListOptions {
  page?: number;           // Page number (1-indexed)
  pageSize?: number;       // Items per page
  search?: string;         // Search by name or email
  department?: string;     // Filter by department
  policyId?: number;       // Filter by policy
  sortBy?: 'name' | 'employeeCode' | 'department' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Options for listing members/dependents
 */
export interface MemberListOptions {
  employeeId?: number;     // Filter by employee
  relationship?: Relationship;  // Filter by relationship type
}
