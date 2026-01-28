/**
 * ============================================================================
 * EMPLOYEE DETAILS PAGE - View and Manage Employee & Dependents
 * ============================================================================
 * 
 * This page shows detailed information about a specific employee
 * and allows HR to manage their dependents.
 * 
 * Features:
 * - Employee profile information
 * - List of dependents (members)
 * - Add new dependent
 * - Edit dependent
 * - Delete dependent (HR only)
 * 
 * Based on the Figma "Employees/Dependents" design.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineUserGroup
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { trpc } from '../trpc';
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

function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const employeeId = parseInt(id || '0');
  
  // ========== State ==========
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // ========== Queries ==========
  const { data: employee, isLoading, refetch } = trpc.employee.getById.useQuery(
    { id: employeeId },
    { enabled: !!employeeId }
  );
  
  const deleteMemberMutation = trpc.member.delete.useMutation({
    onSuccess: () => {
      toast.success('Dependent removed successfully');
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteId(null);
    },
  });
  
  // ========== Handlers ==========
  const handleDeleteMember = (memberId: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this policy?`)) {
      setDeleteId(memberId);
      deleteMemberMutation.mutate({ id: memberId });
    }
  };
  
  // ========== Loading State ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading employee details...</p>
        </div>
      </div>
    );
  }
  
  // ========== Not Found ==========
  if (!employee) {
    return (
      <div className="text-center py-12">
        <HiOutlineUser className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="mt-4 text-xl font-medium text-gray-900">Employee not found</h2>
        <p className="mt-2 text-gray-500">The employee you're looking for doesn't exist.</p>
        <Link to="/employees" className="btn-primary mt-4 inline-flex items-center gap-2">
          <HiOutlineArrowLeft className="w-5 h-5" />
          Back to Employees
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link 
        to="/employees" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
        Back to Employees
      </Link>
      
      {/* Employee Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-semibold text-primary-600">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <HiOutlineUser className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{employee.firstName} {employee.lastName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HiOutlineBriefcase className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Employee Code</p>
                <p className="font-medium">{employee.employeeCode}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HiOutlineMail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HiOutlinePhone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{employee.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{employee.department || 'Not assigned'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dependents Section */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dependents</h2>
            <p className="text-sm text-gray-500">Family members under this policy</p>
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No dependents yet</h3>
            <p className="mt-2 text-gray-500">Add family members to this employee's policy</p>
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
                      <button
                        onClick={() => setEditMember(member)}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-5 h-5" />
                      </button>
                      
                      {/* Can't delete SELF record */}
                      {member.relationship !== 'SELF' && (
                        <button
                          onClick={() => handleDeleteMember(member.id, `${member.firstName} ${member.lastName}`)}
                          disabled={deleteId === member.id}
                          className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove from policy"
                        >
                          {deleteId === member.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger-500" />
                          ) : (
                            <HiOutlineTrash className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Add/Edit Member Modal */}
      {(showAddModal || editMember) && (
        <AddMemberModal
          employeeId={employeeId}
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

export default EmployeeDetails;
