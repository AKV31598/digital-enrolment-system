/**
 * ============================================================================
 * MAIN APP COMPONENT - Application Root
 * ============================================================================
 * 
 * This is the root component of the application. It sets up:
 * 
 * 1. tRPC Provider - For type-safe API calls
 * 2. React Query Provider - For caching and state management
 * 3. Router - For client-side navigation
 * 4. Auth Provider - For authentication state
 * 5. Toast Notifications - For user feedback
 * 
 * Route Structure:
 * - /login - Login page (public)
 * - /employees - HR: Employee list
 * - /employees/:id - HR: Employee details
 * - /dependents - Employee: Their dependents
 * - / - Redirects based on role
 * ============================================================================
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// tRPC setup
import { trpc, queryClient, createTRPCClient } from './trpc';

// Auth context
import { AuthProvider, ProtectedRoute, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Login';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import Dependents from './pages/Dependents';
import AddEmployee from './pages/AddEmployee';
import BulkUpload from './pages/BulkUpload';

// ============================================================================
// ROLE-BASED REDIRECT COMPONENT
// ============================================================================

/**
 * RoleBasedRedirect
 * 
 * Redirects users to the appropriate page based on their role:
 * - HR Managers → /employees
 * - Employees → /dependents
 */
function RoleBasedRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on role
  if (user?.role === 'HR_MANAGER') {
    return <Navigate to="/employees" replace />;
  } else {
    return <Navigate to="/dependents" replace />;
  }
}

// ============================================================================
// APP ROUTES COMPONENT
// ============================================================================

/**
 * AppRoutes
 * 
 * Defines all the routes in the application.
 * Uses ProtectedRoute for authenticated pages.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Root redirect */}
      <Route path="/" element={<RoleBasedRedirect />} />
      
      {/* HR Manager Routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredRole="HR_MANAGER">
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employees/add"
        element={
          <ProtectedRoute requiredRole="HR_MANAGER">
            <Layout>
              <AddEmployee />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employees/bulk-upload"
        element={
          <ProtectedRoute requiredRole="HR_MANAGER">
            <Layout>
              <BulkUpload />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute requiredRole="HR_MANAGER">
            <Layout>
              <EmployeeDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Employee Routes */}
      <Route
        path="/dependents"
        element={
          <ProtectedRoute>
            <Layout>
              <Dependents />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

/**
 * App Component
 * 
 * The root component that sets up all providers and renders the app.
 * 
 * Provider Order (outside to inside):
 * 1. tRPC Provider - Handles API communication
 * 2. QueryClientProvider - Manages React Query cache
 * 3. BrowserRouter - Enables client-side routing
 * 4. AuthProvider - Manages authentication state
 * 5. AppRoutes - Renders the appropriate page
 */
function App() {
  // Create tRPC client (memoized to prevent recreation)
  const [trpcClient] = useState(() => createTRPCClient());
  
  return (
    /**
     * tRPC Provider
     * Makes the tRPC client available to all components
     */
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {/**
       * Query Client Provider
       * Makes React Query available for caching
       */}
      <QueryClientProvider client={queryClient}>
        {/**
         * Browser Router
         * Enables client-side navigation without page reloads
         */}
        <BrowserRouter>
          {/**
           * Auth Provider
           * Provides user state and auth functions
           */}
          <AuthProvider>
            {/* Main Application Routes */}
            <AppRoutes />
            
            {/**
             * Toast Notifications
             * Renders toast messages from react-hot-toast
             * Position and styling configured here
             */}
            <Toaster
              position="top-right"
              toastOptions={{
                // Default options for all toasts
                duration: 4000,
                style: {
                  background: '#1F2937',
                  color: '#F9FAFB',
                  borderRadius: '0.5rem',
                },
                // Success toast styling
                success: {
                  iconTheme: {
                    primary: '#22C55E',
                    secondary: '#F9FAFB',
                  },
                },
                // Error toast styling
                error: {
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#F9FAFB',
                  },
                },
              }}
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
