/**
 * ============================================================================
 * CSV PARSER UTILITY - Bulk Upload Processing
 * ============================================================================
 * 
 * This file handles all CSV parsing and validation for bulk employee uploads.
 * 
 * Features:
 * - Parse CSV text into structured data
 * - Validate each row for required fields and formats
 * - Generate detailed error reports for invalid rows
 * - Handle edge cases (empty rows, malformed data, etc.)
 * 
 * Used by HR Managers to upload multiple employees at once instead of
 * adding them one by one through the form.
 * ============================================================================
 */

import Papa from 'papaparse';
import type { BulkEmployeeRow, BulkValidationResult, Gender } from '@shared/types';

// ============================================================================
// COLUMN MAPPING
// ============================================================================

/**
 * Expected CSV column headers
 * 
 * We support flexible header names - users don't have to match exactly.
 * For example, "Employee Code", "employee_code", and "employeeCode" all work.
 * 
 * This maps possible header variations to our internal field names.
 */
const COLUMN_MAPPINGS: Record<string, string[]> = {
  employeeCode: ['employee code', 'employeecode', 'employee_code', 'emp code', 'empcode', 'id', 'employee id'],
  firstName: ['first name', 'firstname', 'first_name', 'fname', 'given name'],
  lastName: ['last name', 'lastname', 'last_name', 'lname', 'surname', 'family name'],
  email: ['email', 'email address', 'emailaddress', 'email_address', 'e-mail'],
  phone: ['phone', 'phone number', 'phonenumber', 'phone_number', 'mobile', 'contact'],
  dateOfBirth: ['date of birth', 'dateofbirth', 'dob', 'birth date', 'birthdate', 'birth_date', 'date_of_birth'],
  gender: ['gender', 'sex'],
  department: ['department', 'dept', 'division', 'team'],
  designation: ['designation', 'title', 'job title', 'position', 'role'],
};

/**
 * Required fields that must be present and non-empty
 */
const REQUIRED_FIELDS = ['employeeCode', 'firstName', 'lastName', 'email'];

/**
 * Valid gender values (case-insensitive)
 */
const VALID_GENDERS = ['male', 'female', 'other', 'm', 'f'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize a header name for matching
 * 
 * Converts "Employee Code" -> "employee code"
 * Removes extra spaces and special characters
 * 
 * @param header - The original header text
 * @returns Normalized header for comparison
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');       // Normalize spaces
}

/**
 * Map a CSV header to our internal field name
 * 
 * @param header - The CSV column header
 * @returns The internal field name or null if not recognized
 */
function mapHeaderToField(header: string): string | null {
  const normalized = normalizeHeader(header);
  
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.includes(normalized) || normalized === field.toLowerCase()) {
      return field;
    }
  }
  
  return null;
}

/**
 * Validate an email address format
 * 
 * Uses a simple regex that catches most invalid emails
 * without being overly strict (some valid emails are unusual)
 * 
 * @param email - The email to validate
 * @returns True if email format is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a date string format
 * 
 * Accepts formats:
 * - YYYY-MM-DD (ISO standard)
 * - DD/MM/YYYY (Common format)
 * - MM/DD/YYYY (US format)
 * 
 * @param dateStr - The date string to validate
 * @returns True if date format is valid
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true; // Empty is OK (optional field)
  
  // Try ISO format (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateStr)) {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
  
  // Try DD/MM/YYYY or MM/DD/YYYY
  const slashRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (slashRegex.test(dateStr)) {
    // Parse and validate
    const parts = dateStr.split('/');
    const date = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD)
 * 
 * @param dateStr - The date string in any supported format
 * @returns ISO formatted date string or undefined if empty/invalid
 */
function normalizeDateString(dateStr: string | undefined): string | undefined {
  if (!dateStr || dateStr.trim() === '') return undefined;
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert from DD/MM/YYYY or MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    // Assume MM/DD/YYYY (common in some regions)
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  
  // Try to parse as a date and convert
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return undefined;
}

/**
 * Normalize gender value to our standard format
 * 
 * @param gender - The gender string from CSV
 * @returns Normalized gender or undefined
 */
function normalizeGender(gender: string | undefined): Gender | undefined {
  if (!gender || gender.trim() === '') return undefined;
  
  const normalized = gender.toLowerCase().trim();
  
  if (normalized === 'male' || normalized === 'm') return 'Male';
  if (normalized === 'female' || normalized === 'f') return 'Female';
  if (normalized === 'other') return 'Other';
  
  return undefined;
}

// ============================================================================
// MAIN PARSING FUNCTIONS
// ============================================================================

/**
 * Parse CSV text into employee rows
 * 
 * This is the main entry point for CSV processing.
 * It parses the CSV, maps columns to our fields, and validates each row.
 * 
 * @param csvText - Raw CSV text content
 * @returns Array of validation results (includes valid and invalid rows)
 * 
 * @example
 * const results = parseEmployeeCSV(csvContent);
 * const validRows = results.filter(r => r.isValid);
 * const errors = results.filter(r => !r.isValid);
 */
export function parseEmployeeCSV(csvText: string): BulkValidationResult[] {
  // Step 1: Parse CSV using PapaParse
  const parseResult = Papa.parse<Record<string, string>>(csvText, {
    header: true,           // First row contains headers
    skipEmptyLines: true,   // Ignore blank lines
    transformHeader: (h) => h.trim(), // Remove whitespace from headers
  });
  
  // Check for parsing errors
  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
  }
  
  // Step 2: Map headers to our field names
  const headerMapping: Record<string, string> = {};
  const headers = parseResult.meta.fields || [];
  
  for (const header of headers) {
    const field = mapHeaderToField(header);
    if (field) {
      headerMapping[header] = field;
    }
  }
  
  // Step 3: Process and validate each row
  const results: BulkValidationResult[] = [];
  
  parseResult.data.forEach((row, index) => {
    // Map CSV columns to our fields
    const mappedRow: Record<string, string> = {};
    
    for (const [csvHeader, value] of Object.entries(row)) {
      const field = headerMapping[csvHeader];
      if (field) {
        mappedRow[field] = value?.trim() || '';
      }
    }
    
    // Create the employee row object
    const employeeRow: BulkEmployeeRow = {
      employeeCode: mappedRow.employeeCode || '',
      firstName: mappedRow.firstName || '',
      lastName: mappedRow.lastName || '',
      email: mappedRow.email || '',
      phone: mappedRow.phone || undefined,
      dateOfBirth: normalizeDateString(mappedRow.dateOfBirth),
      gender: mappedRow.gender || undefined,
      department: mappedRow.department || undefined,
      designation: mappedRow.designation || undefined,
    };
    
    // Validate the row
    const validationResult = validateEmployeeRow(employeeRow, index + 2); // +2 for header row and 1-indexing
    results.push(validationResult);
  });
  
  return results;
}

/**
 * Validate a single employee row
 * 
 * Checks:
 * - Required fields are present and non-empty
 * - Email format is valid
 * - Date format is valid (if provided)
 * - Gender is a valid value (if provided)
 * 
 * @param row - The employee row to validate
 * @param rowNumber - The row number (for error messages)
 * @returns Validation result with errors if any
 */
export function validateEmployeeRow(row: BulkEmployeeRow, rowNumber: number): BulkValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!row.employeeCode || row.employeeCode.trim() === '') {
    errors.push(`Row ${rowNumber}: Missing required field 'Employee Code'`);
  }
  
  if (!row.firstName || row.firstName.trim() === '') {
    errors.push(`Row ${rowNumber}: Missing required field 'First Name'`);
  }
  
  if (!row.lastName || row.lastName.trim() === '') {
    errors.push(`Row ${rowNumber}: Missing required field 'Last Name'`);
  }
  
  if (!row.email || row.email.trim() === '') {
    errors.push(`Row ${rowNumber}: Missing required field 'Email'`);
  } else if (!isValidEmail(row.email)) {
    errors.push(`Row ${rowNumber}: Invalid email format '${row.email}'`);
  }
  
  // Validate optional fields if present
  if (row.dateOfBirth && !isValidDate(row.dateOfBirth)) {
    errors.push(`Row ${rowNumber}: Invalid date format '${row.dateOfBirth}'. Use YYYY-MM-DD`);
  }
  
  if (row.gender && !VALID_GENDERS.includes(row.gender.toLowerCase())) {
    errors.push(`Row ${rowNumber}: Invalid gender '${row.gender}'. Use Male, Female, or Other`);
  }
  
  return {
    rowNumber,
    data: row,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a sample CSV template
 * 
 * Returns a CSV string that users can download as a template
 * for bulk uploading employees.
 * 
 * @returns CSV template string with headers and example row
 */
export function generateCSVTemplate(): string {
  const headers = [
    'Employee Code',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Date of Birth',
    'Gender',
    'Department',
    'Designation',
  ];
  
  const exampleRow = [
    'EMP001',
    'John',
    'Doe',
    'john.doe@company.com',
    '+91 98765 43210',
    '1990-05-15',
    'Male',
    'Engineering',
    'Software Engineer',
  ];
  
  return [
    headers.join(','),
    exampleRow.join(','),
  ].join('\n');
}

/**
 * Convert validated rows to create employee inputs
 * 
 * Transforms validated CSV rows into the format expected by
 * our employee creation API.
 * 
 * @param validRows - Array of validated employee rows
 * @param policyId - The policy ID to add employees to
 * @returns Array of employee creation inputs
 */
export function rowsToCreateInputs(
  validRows: BulkValidationResult[],
  policyId: number
) {
  return validRows
    .filter((r) => r.isValid)
    .map((r) => ({
      employeeCode: r.data.employeeCode,
      firstName: r.data.firstName,
      lastName: r.data.lastName,
      email: r.data.email,
      phone: r.data.phone,
      dateOfBirth: r.data.dateOfBirth,
      gender: normalizeGender(r.data.gender),
      department: r.data.department,
      designation: r.data.designation,
      policyId,
    }));
}
