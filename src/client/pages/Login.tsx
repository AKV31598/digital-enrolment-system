/**
 * ============================================================================
 * LOGIN PAGE - User Authentication
 * ============================================================================
 * 
 * The login page where users enter their credentials.
 * 
 * Features:
 * - Username and password input
 * - Form validation
 * - Error handling
 * - Redirect after successful login
 * 
 * After login:
 * - HR Managers go to /employees
 * - Employees go to /dependents
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineOfficeBuilding, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function Login() {
  // ========== State ==========
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // ========== Hooks ==========
  const { login, isAuthenticated, isHRManager, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // ========== Redirect if Already Logged In ==========
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(isHRManager ? '/employees' : '/dependents', { replace: true });
    }
  }, [isLoading, isAuthenticated, isHRManager, navigate]);
  
  // ========== Form Submit Handler ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(username, password);
      toast.success('Welcome back!');
      // Navigation is handled by the useEffect above
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar via-sidebar-dark to-primary-900 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
              <HiOutlineOfficeBuilding className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Digital Enrolment System
            </h1>
            <p className="text-gray-500 mt-2">
              Sign in to manage Account
            </p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-danger-50 text-danger-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">
              
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700"> </p>
                <p className="text-gray-500"> </p>
                <p className="text-gray-500"> </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700"> </p>
                <p className="text-gray-500"> </p>
                <p className="text-gray-500"> </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          &copy;PrishaPolicy
        </p>
      </div>
    </div>
  );
}

export default Login;
