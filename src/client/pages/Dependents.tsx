/**
 * ============================================================================
 * DEPENDENTS PAGE - Employee View of Their Dependents
 * ============================================================================
 * 
 * This page is for employees to view and manage their own dependents.
 * 
 * Features:
 * - View policy information
 * - List of dependents
 * - Add new dependent
 * - Edit dependent
 * - CANNOT delete dependents (HR only)
 * 
 * Based on the Figma "Dependents Page" design.
 * ============================================================================
 */

import React, { useState } from 'react';
import { 
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification
} from 'react-icons/hi';
import { trpc } from '../trpc';
import { useAuth } from '../context/AuthContext';
import AddMemberModal from '../components/AddMemberModal';

/**
 * Format date for display
 */
function formatDate(date: Date | string | null): string {
  if (!date) return 'Not provided';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get badge color for relationship type
 */
function getRelationshipBadge(relationship: string) {
  const styles: Record<string, string> = {
    SELF: 'badge-primary',
    SPOUSE: 'badge-success',
    CHILD: 'badge-warning',
    PARENT: 'badge-gray',
  };
  return styles[relationship] || 'badge-gray';
}

function Dependents() {
  const { user } = useAuth();
  
  // ========== State ==========
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  
  // ========== Queries ==========
  const { data: employee, isLoading, refetch } = trpc.employee.getCurrent.useQuery();
  
  // ========== Loading State ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading your information...</p>
        </div>
      </div>
    );
  }
  
  // ========== No Employee Record ==========
  if (!employee) {
    return (
      <div className="text-center py-12">
        <HiOutlineUserGroup className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="mt-4 text-xl font-medium text-gray-900">No Employee Record Found</h2>
        <p className="mt-2 text-gray-500">Please contact HR to set up your employee record.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Policy Information Card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
            <HiOutlineShieldCheck className="w-6 h-6 text-success-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Your Insurance Policy</h2>
            <p className="text-gray-500 mt-1">{employee.policy?.policyName}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <HiOutlineIdentification className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Policy Number</p>
                  <p className="font-medium">{employee.policy?.policyNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{employee.policy?.companyName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="font-medium">{employee.members?.length || 0} members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dependents Section */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Dependents</h2>
            <p className="text-sm text-gray-500">Family members covered under your policy</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Dependent
          </button>
        </div>
        
        {employee.members?.length === 0 ? (
          // Empty State
          <div className="p-12 text-center">
            <HiOutlineUserGroup className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No dependents added</h3>
            <p className="mt-2 text-gray-500">Add your family members to cover them under your policy</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mt-4 inline-flex items-center gap-2"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Add First Dependent
            </button>
          </div>
        ) : (
          // Dependents Table
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Name</th>
                <th className="table-header-cell">Relationship</th>
                <th className="table-header-cell">Gender</th>
                <th className="table-header-cell">Date of Birth</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {employee.members?.map((member) => (
                <tr key={member.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <span className="font-medium">
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  </td>
                  
                  <td className="table-cell">
                    <span className={getRelationshipBadge(member.relationship)}>
                      {member.relationship}
                    </span>
                  </td>
                  
                  <td className="table-cell text-gray-500">
                    {member.gender || '-'}
                  </td>
                  
                  <td className="table-cell text-gray-500">
                    {formatDate(member.dateOfBirth)}
                  </td>
                  
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-2">
                      {/* Employees can edit their dependents */}
                      <button
                        onClick={() => setEditMember(member)}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-5 h-5" />
                      </button>
                      
                      {/* Employees CANNOT delete dependents */}
                      {/* Show info tooltip instead */}
                      {member.relationship !== 'SELF' && (
                        <div 
                          className="p-2 text-gray-300 cursor-not-allowed"
                          title="Contact HR to remove dependents"
                        >
                          <span className="text-xs text-gray-400 italic">Contact HR to remove</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Important Note for Employees */}
        <div className="px-6 py-4 bg-warning-50 border-t border-warning-100">
          <p className="text-sm text-warning-700">
            <strong>Note:</strong> To remove a dependent from your policy, please contact your HR Manager.
            Only HR can remove members from the insurance policy.
          </p>
        </div>
      </div>
      
      {/* Add/Edit Member Modal */}
      {(showAddModal || editMember) && (
        <AddMemberModal
          employeeId={employee.id}
          member={editMember}
          onClose={() => {
            setShowAddModal(false);
            setEditMember(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditMember(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default Dependents;
