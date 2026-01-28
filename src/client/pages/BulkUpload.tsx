/**
 * ============================================================================
 * BULK UPLOAD PAGE - CSV Import for Multiple Employees
 * ============================================================================
 * 
 * This page allows HR Managers to upload multiple employees via CSV.
 * 
 * Features:
 * - Drag and drop file upload
 * - CSV preview
 * - Validation with error display
 * - Download template
 * - Progress indication
 * 
 * Based on the Figma "Bulk Employee Entry" design.
 * ============================================================================
 */

import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  HiOutlineArrowLeft,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineDocumentText
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { trpc } from '../trpc';

function BulkUpload() {
  const navigate = useNavigate();
  
  // ========== State ==========
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  // ========== Get Policy ==========
  const { data: policies } = trpc.policy.list.useQuery();
  const policyId = policies?.[0]?.id || 1;
  
  // ========== Upload Mutation ==========
  const uploadMutation = trpc.employee.bulkCreate.useMutation({
    onSuccess: (data) => {
      setUploadResult(data);
      if (data.success) {
        toast.success(`Successfully added ${data.successCount} employees!`);
      } else {
        toast.error(`Upload completed with ${data.failedCount} errors`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // ========== File Drop Handler ==========
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    
    if (!csvFile) return;
    
    // Check file type
    if (!csvFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    // Check file size (max 5MB)
    if (csvFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setFile(csvFile);
    setUploadResult(null);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      
      // Parse for preview (first 5 rows)
      const lines = content.split('\n').filter(line => line.trim());
      const preview = lines.slice(0, 6).map(line => 
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
      setPreviewData(preview);
    };
    reader.readAsText(csvFile);
  }, []);
  
  // ========== Dropzone ==========
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });
  
  // ========== Upload Handler ==========
  const handleUpload = () => {
    if (!csvContent) {
      toast.error('Please select a file first');
      return;
    }
    
    uploadMutation.mutate({
      csvContent,
      policyId,
    });
  };
  
  // ========== Clear File ==========
  const handleClear = () => {
    setFile(null);
    setCsvContent('');
    setPreviewData([]);
    setUploadResult(null);
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <Link 
        to="/employees" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
        Back to Employees
      </Link>
      
      {/* Upload Card */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bulk Upload Employees</h2>
            <p className="text-sm text-gray-500">Upload a CSV file to add multiple employees at once</p>
          </div>
          
          {/* Download Template */}
          <a
            href="/api/download/csv-template"
            download="employee_template.csv"
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlineDownload className="w-5 h-5" />
            Download Template
          </a>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Dropzone */}
          {!file && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <HiOutlineUpload className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">
                {isDragActive 
                  ? 'Drop the CSV file here...' 
                  : 'Drag and drop a CSV file here, or click to browse'
                }
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Maximum file size: 5MB
              </p>
            </div>
          )}
          
          {/* Selected File */}
          {file && !uploadResult && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <HiOutlineDocumentText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB • {previewData.length - 1} rows detected
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="p-2 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              
              {/* Preview Table */}
              {previewData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Preview (first 5 rows)
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewData[0]?.map((header, i) => (
                            <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewData.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {cell || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex justify-end gap-4">
                <button onClick={handleClear} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="btn-primary flex items-center gap-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiOutlineUpload className="w-5 h-5" />
                      Upload Employees
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`p-6 rounded-xl ${uploadResult.success ? 'bg-success-50' : 'bg-warning-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    uploadResult.success ? 'bg-success-100' : 'bg-warning-100'
                  }`}>
                    {uploadResult.success ? (
                      <HiOutlineCheck className="w-6 h-6 text-success-600" />
                    ) : (
                      <HiOutlineExclamation className="w-6 h-6 text-warning-600" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      uploadResult.success ? 'text-success-700' : 'text-warning-700'
                    }`}>
                      {uploadResult.success ? 'Upload Successful!' : 'Upload Completed with Errors'}
                    </h3>
                    <p className={uploadResult.success ? 'text-success-600' : 'text-warning-600'}>
                      {uploadResult.successCount} of {uploadResult.totalRows} employees added successfully
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Error Details */}
              {uploadResult.errors?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Errors ({uploadResult.failedCount})
                  </h3>
                  <div className="border border-danger-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {uploadResult.errors.map((error: any, index: number) => (
                        <div 
                          key={index}
                          className="px-4 py-3 border-b border-danger-100 last:border-b-0 bg-danger-50"
                        >
                          <p className="text-sm font-medium text-danger-700">
                            Row {error.rowNumber}: {error.data.firstName} {error.data.lastName}
                          </p>
                          <ul className="mt-1 text-sm text-danger-600">
                            {error.errors.map((err: string, i: number) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-4">
                <button onClick={handleClear} className="btn-secondary">
                  Upload Another File
                </button>
                <Link to="/employees" className="btn-primary">
                  Go to Employees
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">CSV Format Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>Required columns:</strong> Employee Code, First Name, Last Name, Email</li>
          <li>• <strong>Optional columns:</strong> Phone, Date of Birth (YYYY-MM-DD), Gender, Department, Designation</li>
          <li>• The first row must contain column headers</li>
          <li>• Each subsequent row represents one employee</li>
          <li>• Download the template above for the correct format</li>
        </ul>
      </div>
    </div>
  );
}

export default BulkUpload;
