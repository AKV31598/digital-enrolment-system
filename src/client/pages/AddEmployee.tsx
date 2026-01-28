/**
 * ============================================================================
 * ADD EMPLOYEE PAGE - Single Employee Entry Form
 * ============================================================================
 * 
 * This page allows HR Managers to add a single new employee.
 * 
 * Features:
 * - Form for employee details
 * - Validation
 * - Success redirect to employee list
 * 
 * Based on the Figma "Add Employee / Single Entry" design.
 * ============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { trpc } from '../trpc';

function AddEmployee() {
  const navigate = useNavigate();
  
  // ========== Form State ==========
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    department: '',
    designation: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ========== Get Policy (for now, use the first available) ==========
  const { data: policies } = trpc.policy.list.useQuery();
  const policyId = policies?.[0]?.id || 1;
  
  // ========== Create Mutation ==========
  const createMutation = trpc.employee.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Employee ${data.firstName} ${data.lastName} added successfully!`);
      navigate('/employees');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // ========== Handlers ==========
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = 'Employee code is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    createMutation.mutate({
      employeeCode: formData.employeeCode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: (formData.gender as 'Male' | 'Female' | 'Other') || undefined,
      department: formData.department || undefined,
      designation: formData.designation || undefined,
      policyId,
    });
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link 
        to="/employees" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
        Back to Employees
      </Link>
      
      {/* Form Card */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Employee</h2>
          <p className="text-sm text-gray-500">Fill in the details to add a new employee to the policy</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Employee Code & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="employeeCode" className="form-label">
                Employee Code <span className="text-danger-500">*</span>
              </label>
              <input
                id="employeeCode"
                name="employeeCode"
                type="text"
                value={formData.employeeCode}
                onChange={handleChange}
                className={`form-input ${errors.employeeCode ? 'border-danger-500' : ''}`}
                placeholder="e.g., EMP001"
              />
              {errors.employeeCode && (
                <p className="form-error">{errors.employeeCode}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-danger-500' : ''}`}
                placeholder="john@company.com"
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>
          </div>
          
          {/* Row 2: First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="form-label">
                First Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`form-input ${errors.firstName ? 'border-danger-500' : ''}`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="form-error">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="form-label">
                Last Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`form-input ${errors.lastName ? 'border-danger-500' : ''}`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="form-error">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          {/* Row 3: Phone & Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </div>
            
            <div>
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
          
          {/* Row 4: Gender & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="department" className="form-label">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Engineering"
              />
            </div>
          </div>
          
          {/* Row 5: Designation */}
          <div>
            <label htmlFor="designation" className="form-label">
              Designation
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              value={formData.designation}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Software Engineer"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Link to="/employees" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Adding...
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-5 h-5" />
                  Add Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployee;
