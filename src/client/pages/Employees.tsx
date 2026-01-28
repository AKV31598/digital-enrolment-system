/**
 * ============================================================================
 * EMPLOYEES PAGE - HR Manager Employee List
 * ============================================================================
 * 
 * This page displays all employees for HR Managers.
 * 
 * Features:
 * - Paginated employee list
 * - Search by name/email
 * - Filter by department
 * - Actions: View, Edit, Delete
 * - Add employee buttons (single + bulk)
 * 
 * Based on the Figma "Employees Page" design.
 * ============================================================================
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiOutlinePlus, 
  HiOutlineUpload, 
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineUserGroup
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { trpc } from '../trpc';

/**
 * Format date for display
 */
function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Employees() {
  const navigate = useNavigate();
  
  // ========== State ==========
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const pageSize = 10;
  
  // ========== Queries ==========
  const { 
    data, 
    isLoading, 
    refetch 
  } = trpc.employee.list.useQuery({
    page,
    pageSize,
    search: search || undefined,
  });
  
  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success('Employee deleted successfully');
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setDeleteId(null);
    },
  });
  
  // ========== Handlers ==========
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };
  
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this employee? All their dependents will also be deleted.')) {
      setDeleteId(id);
      deleteMutation.mutate({ id });
    }
  };
  
  // ========== Render ==========
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-500">
            Manage employees and their insurance policy members
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            to="/employees/bulk-upload"
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlineUpload className="w-5 h-5" />
            Bulk Import
          </Link>
          <Link
            to="/employees/add"
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Employee
          </Link>
        </div>
      </div>
      
      {/* Search & Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or employee code..."
              className="form-input pl-10 w-full"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSearchInput('');
                setPage(1);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>
      
      {/* Employee Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          // Loading State
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
            <p className="mt-4 text-gray-500">Loading employees...</p>
          </div>
        ) : !data?.data.length ? (
          // Empty State
          <div className="p-12 text-center">
            <HiOutlineUserGroup className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No employees found</h3>
            <p className="mt-2 text-gray-500">
              {search 
                ? 'Try a different search term' 
                : 'Get started by adding your first employee'}
            </p>
            {!search && (
              <Link to="/employees/add" className="btn-primary mt-4 inline-flex items-center gap-2">
                <HiOutlinePlus className="w-5 h-5" />
                Add Employee
              </Link>
            )}
          </div>
        ) : (
          // Table
          <>
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Employee</th>
                  <th className="table-header-cell">Employee Code</th>
                  <th className="table-header-cell">Department</th>
                  <th className="table-header-cell">Members</th>
                  <th className="table-header-cell">Added On</th>
                  <th className="table-header-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {data.data.map((employee) => (
                  <tr key={employee.id} className="table-row">
                    {/* Employee Info */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Employee Code */}
                    <td className="table-cell">
                      <span className="badge-gray">{employee.employeeCode}</span>
                    </td>
                    
                    {/* Department */}
                    <td className="table-cell text-gray-500">
                      {employee.department || '-'}
                    </td>
                    
                    {/* Member Count */}
                    <td className="table-cell">
                      <span className="badge-primary">
                        {employee._count?.members || 0} members
                      </span>
                    </td>
                    
                    {/* Created Date */}
                    <td className="table-cell text-gray-500">
                      {formatDate(employee.createdAt)}
                    </td>
                    
                    {/* Actions */}
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/employees/${employee.id}`)}
                          className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          disabled={deleteId === employee.id}
                          className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Employee"
                        >
                          {deleteId === employee.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-danger-500" />
                          ) : (
                            <HiOutlineTrash className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} employees
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-2 disabled:opacity-50"
                  >
                    <HiOutlineChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="flex items-center px-4 text-sm text-gray-700">
                    Page {page} of {data.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="btn-secondary p-2 disabled:opacity-50"
                  >
                    <HiOutlineChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Employees;
