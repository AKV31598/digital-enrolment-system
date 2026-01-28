/**
 * ============================================================================
 * ADD MEMBER MODAL - Add/Edit Dependent Form
 * ============================================================================
 * 
 * Modal component for adding or editing a dependent (family member).
 * Used by both HR Managers and Employees.
 * 
 * Features:
 * - Add new dependent
 * - Edit existing dependent
 * - Form validation
 * - Relationship type selection
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { trpc } from '../trpc';

interface AddMemberModalProps {
  employeeId: number;
  member?: any; // Existing member for edit mode
  onClose: () => void;
  onSuccess: () => void;
}

function AddMemberModal({ employeeId, member, onClose, onSuccess }: AddMemberModalProps) {
  const isEditMode = !!member;
  
  // ========== Form State ==========
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    relationship: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ========== Initialize form for edit mode ==========
  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        dateOfBirth: member.dateOfBirth 
          ? new Date(member.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: member.gender || '',
        relationship: member.relationship || '',
      });
    }
  }, [member]);
  
  // ========== Mutations ==========
  const createMutation = trpc.member.create.useMutation({
    onSuccess: () => {
      toast.success('Dependent added successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.member.update.useMutation({
    onSuccess: () => {
      toast.success('Dependent updated successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  
  // ========== Handlers ==========
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (isEditMode) {
      updateMutation.mutate({
        id: member.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: (formData.gender as 'Male' | 'Female' | 'Other') || undefined,
        relationship: formData.relationship as any,
      });
    } else {
      createMutation.mutate({
        employeeId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: (formData.gender as 'Male' | 'Female' | 'Other') || undefined,
        relationship: formData.relationship as any,
      });
    }
  };
  
  // ========== Render ==========
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Edit Dependent' : 'Add New Dependent'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name */}
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
              placeholder="Enter first name"
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName}</p>
            )}
          </div>
          
          {/* Last Name */}
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
              placeholder="Enter last name"
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="form-error">{errors.lastName}</p>
            )}
          </div>
          
          {/* Relationship */}
          <div>
            <label htmlFor="relationship" className="form-label">
              Relationship <span className="text-danger-500">*</span>
            </label>
            <select
              id="relationship"
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className={`form-input ${errors.relationship ? 'border-danger-500' : ''}`}
              disabled={isLoading || (isEditMode && member?.relationship === 'SELF')}
            >
              <option value="">Select relationship</option>
              <option value="SPOUSE">Spouse</option>
              <option value="CHILD">Child</option>
              <option value="PARENT">Parent</option>
            </select>
            {errors.relationship && (
              <p className="form-error">{errors.relationship}</p>
            )}
            {isEditMode && member?.relationship === 'SELF' && (
              <p className="text-sm text-gray-500 mt-1">SELF relationship cannot be changed</p>
            )}
          </div>
          
          {/* Date of Birth */}
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
              disabled={isLoading}
            />
          </div>
          
          {/* Gender */}
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
              disabled={isLoading}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {isEditMode ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-5 h-5" />
                  {isEditMode ? 'Save Changes' : 'Add Dependent'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
