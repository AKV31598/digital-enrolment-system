/**
 * ============================================================================
 * AUTHENTICATION CONTEXT - User State Management
 * ============================================================================
 * 
 * This context provides authentication state and functions to the entire app.
 * 
 * What it manages:
 * - Current user information
 * - Login/logout functions
 * - Loading states
 * - Token persistence
 * 
 * How to use:
 * ```tsx
 * // In a component
 * const { user, login, logout, isLoading } = useAuth();
 * 
 * if (isLoading) return <Loading />;
 * if (!user) return <Navigate to="/login" />;
 * ```
 * 
 * Authentication Flow:
 * 1. On app load, check localStorage for existing token
 * 2. If token exists, validate it with /auth/me endpoint
 * 3. If valid, set user state; if invalid, clear token
 * 4. On login, store token and set user state
 * 5. On logout, clear token and user state
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../trpc';
import type { UserRole } from '../../shared/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User object structure
 * Contains all info about the authenticated user
 */
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  // Employee-specific fields (if user is an employee)
  employee?: {
    id: number;
    employeeCode: string;
    department: string | null;
    designation: string | null;
    policyId: number;
  } | null;
}

/**
 * Auth context value
 * What's available to consumers of this context
 */
interface AuthContextValue {
  /** The currently logged-in user, or null if not authenticated */
  user: User | null;
  
  /** Whether we're currently checking authentication status */
  isLoading: boolean;
  
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  
  /** Whether the user is an HR Manager */
  isHRManager: boolean;
  
  /** Whether the user is an Employee */
  isEmployee: boolean;
  
  /** Log in with username and password */
  login: (username: string, password: string) => Promise<void>;
  
  /** Log out the current user */
  logout: () => void;
  
  /** Refresh user data from the server */
  refetchUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * Create the context with undefined default
 * We'll throw an error if used outside the provider
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Wrap your app with this to provide authentication state.
 * Should be placed high in the component tree, inside the tRPC provider.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // ========== State ==========
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading (checking token)
  
  // ========== tRPC Mutations ==========
  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();
  
  // ========== Derived State ==========
  const isAuthenticated = user !== null;
  const isHRManager = user?.role === 'HR_MANAGER';
  const isEmployee = user?.role === 'EMPLOYEE';
  
  // ========== Check Existing Token on Mount ==========
  /**
   * When the app loads, check if there's a valid token in localStorage.
   * If so, fetch the user data. If not (or invalid), clear any stale data.
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, not logged in
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to get current user with the stored token
        const userData = await utils.auth.me.fetch();
        
        setUser({
          id: userData.id,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          employee: userData.employee,
        });
      } catch (error) {
        // Token is invalid or expired, clear it
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [utils.auth.me]);
  
  // ========== Login Function ==========
  /**
   * Log in with username and password
   * 
   * @param username - The user's username
   * @param password - The user's password
   * @throws Error if login fails
   */
  const login = useCallback(async (username: string, password: string) => {
    const result = await loginMutation.mutateAsync({ username, password });
    
    // Store the token
    localStorage.setItem('token', result.token);
    
    // Set the user state
    setUser({
      id: result.user.id,
      username: result.user.username,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
      role: result.user.role,
      employee: null, // Will be fetched separately if needed
    });
    
    // Invalidate all queries to refetch with new auth
    await utils.invalidate();
  }, [loginMutation, utils]);
  
  // ========== Logout Function ==========
  /**
   * Log out the current user
   * Clears token and user state, redirects to login
   */
  const logout = useCallback(() => {
    // Try to notify server (non-blocking)
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // Clear local state regardless of server response
        localStorage.removeItem('token');
        setUser(null);
        
        // Clear all cached queries
        utils.invalidate();
      },
    });
    
    // Clear immediately for responsive UI
    localStorage.removeItem('token');
    setUser(null);
  }, [logoutMutation, utils]);
  
  // ========== Refresh User Function ==========
  /**
   * Refresh user data from the server
   * Useful after profile updates
   */
  const refetchUser = useCallback(async () => {
    try {
      const userData = await utils.auth.me.fetch();
      
      setUser({
        id: userData.id,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        employee: userData.employee,
      });
    } catch (error) {
      // If refresh fails, user might be logged out
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [utils.auth.me]);
  
  // ========== Context Value ==========
  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    isHRManager,
    isEmployee,
    login,
    logout,
    refetchUser,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * useAuth Hook
 * 
 * Access authentication context from any component.
 * Must be used within an AuthProvider.
 * 
 * @example
 * const { user, isHRManager, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  /** If specified, only allow users with this role */
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute Component
 * 
 * Wrap routes that require authentication.
 * Redirects to login if not authenticated.
 * 
 * @example
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 * } />
 * 
 * // With role requirement
 * <Route path="/hr/employees" element={
 *   <ProtectedRoute requiredRole="HR_MANAGER">
 *     <EmployeesList />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Check role requirement
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'HR_MANAGER') {
        navigate('/employees', { replace: true });
      } else {
        navigate('/dependents', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, navigate]);
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  // Don't render if role doesn't match
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }
  
  return <>{children}</>;
}
