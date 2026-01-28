/**
 * ============================================================================
 * AUTHENTICATION UTILITIES - Digital Enrolment System
 * ============================================================================
 * 
 * This file contains all authentication-related utilities:
 * 
 * 1. Password Hashing - Securely store passwords using bcrypt
 * 2. JWT Token Management - Create and verify authentication tokens
 * 3. User Verification - Check if a token is valid and get user info
 * 
 * Security Best Practices Used:
 * - Passwords are NEVER stored in plain text
 * - JWT tokens expire after 7 days (configurable)
 * - Salt rounds of 10 for bcrypt (balance of security and speed)
 * ============================================================================
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '@shared/types';

/**
 * JWT Secret Key
 * 
 * IMPORTANT: In production, this should be:
 * 1. A long, random string
 * 2. Stored in environment variables
 * 3. NEVER committed to source control
 * 
 * For development, we use a default value, but this should
 * be replaced with a secure secret in production.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Token expiration time
 * 
 * '7d' means the token expires 7 days after creation
 * After expiration, users must log in again
 * 
 * Consider shorter times (1d, 4h) for higher security applications
 */
const TOKEN_EXPIRY = '7d';

/**
 * Bcrypt salt rounds
 * 
 * Higher = more secure but slower
 * - 10: ~100ms to hash (good balance for most apps)
 * - 12: ~300ms (higher security, noticeable delay)
 * - 14: ~1s (very secure, but slow)
 */
const SALT_ROUNDS = 10;

// ============================================================================
// PASSWORD HASHING FUNCTIONS
// ============================================================================

/**
 * Hash a plain text password
 * 
 * This function takes a plain text password and returns a secure hash
 * that can be safely stored in the database.
 * 
 * How bcrypt works:
 * 1. Generates a random "salt" (extra random data)
 * 2. Combines password + salt
 * 3. Applies the hash algorithm SALT_ROUNDS times
 * 4. Returns a string containing the salt and hash together
 * 
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: "$2a$10$N9qo8uLOickgx2ZMRZoMy..."
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 * 
 * Used during login to verify the user's password is correct.
 * 
 * How it works:
 * 1. Extracts the salt from the stored hash
 * 2. Hashes the provided password with the same salt
 * 3. Compares the two hashes
 * 4. Returns true if they match, false otherwise
 * 
 * @param password - The plain text password to check
 * @param hash - The stored hash from the database
 * @returns Promise<boolean> - True if password matches
 * 
 * @example
 * const isValid = await comparePassword('userInput', storedHash);
 * if (!isValid) throw new Error('Invalid password');
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKEN TYPES
// ============================================================================

/**
 * The data we store inside the JWT token
 * 
 * Keep this minimal - tokens are sent with every request,
 * so large payloads increase network traffic.
 * 
 * We store just enough to identify the user and their permissions.
 */
export interface JWTPayload {
  userId: number;       // User's database ID
  username: string;     // Username for logging/debugging
  role: UserRole;       // Role for quick permission checks
}

/**
 * Full payload including JWT standard claims
 * This is what jwt.verify() returns
 */
export interface DecodedToken extends JWTPayload {
  iat: number;  // Issued At (timestamp)
  exp: number;  // Expiration (timestamp)
}

// ============================================================================
// JWT TOKEN FUNCTIONS
// ============================================================================

/**
 * Generate a JWT token for a user
 * 
 * Called after successful login to create an authentication token.
 * The token should be sent with every authenticated request.
 * 
 * Token structure (base64 encoded):
 * - Header: Algorithm & token type
 * - Payload: Our JWTPayload data
 * - Signature: Verifies the token wasn't tampered with
 * 
 * @param user - The user to create a token for
 * @returns string - The JWT token
 * 
 * @example
 * const token = generateToken(user);
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export function generateToken(user: { id: number; username: string; role: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as UserRole,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * 
 * Called on every authenticated request to:
 * 1. Check the token is valid (not tampered with)
 * 2. Check the token hasn't expired
 * 3. Extract user information from the token
 * 
 * @param token - The JWT token to verify
 * @returns DecodedToken | null - The decoded payload or null if invalid
 * 
 * @example
 * const decoded = verifyToken(token);
 * if (!decoded) return res.status(401).json({ error: 'Invalid token' });
 * console.log('User ID:', decoded.userId);
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    // Token is invalid or expired
    // Common errors:
    // - jwt expired: Token has passed its expiration time
    // - invalid signature: Token was tampered with
    // - jwt malformed: Token structure is invalid
    return null;
  }
}

/**
 * Extract token from Authorization header
 * 
 * Tokens are typically sent in the Authorization header as:
 * "Bearer <token>"
 * 
 * This function extracts just the token part.
 * 
 * @param authHeader - The full Authorization header value
 * @returns string | null - The token or null if not found
 * 
 * @example
 * const token = extractTokenFromHeader('Bearer eyJhbGc...');
 * // Returns: "eyJhbGc..."
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  // Check if it follows the "Bearer <token>" format
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if a user has the HR Manager role
 * 
 * Used throughout the application to verify permissions before
 * allowing operations that only HR should perform.
 * 
 * @param role - The user's role
 * @returns boolean - True if user is an HR Manager
 * 
 * @example
 * if (!isHRManager(user.role)) {
 *   throw new Error('Only HR Managers can delete employees');
 * }
 */
export function isHRManager(role: string): boolean {
  return role === 'HR_MANAGER';
}

/**
 * Check if a user has the Employee role
 * 
 * @param role - The user's role
 * @returns boolean - True if user is an Employee
 */
export function isEmployee(role: string): boolean {
  return role === 'EMPLOYEE';
}

/**
 * Check if a user can access a specific employee's data
 * 
 * HR Managers can access any employee's data.
 * Employees can only access their own data.
 * 
 * @param userRole - The current user's role
 * @param userId - The current user's ID
 * @param targetEmployeeUserId - The target employee's user ID (may be null)
 * @returns boolean - True if access is allowed
 * 
 * @example
 * if (!canAccessEmployee(user.role, user.id, employee.userId)) {
 *   throw new Error('Access denied');
 * }
 */
export function canAccessEmployee(
  userRole: string,
  userId: number,
  targetEmployeeUserId: number | null
): boolean {
  // HR Managers can access any employee
  if (isHRManager(userRole)) return true;
  
  // Employees can only access themselves
  if (targetEmployeeUserId === null) return false;
  return userId === targetEmployeeUserId;
}
