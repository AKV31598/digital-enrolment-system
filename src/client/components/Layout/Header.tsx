/**
 * ============================================================================
 * HEADER COMPONENT - Page Header with Breadcrumbs
 * ============================================================================
 * 
 * The header appears at the top of the main content area.
 * It shows:
 * - Current page title / breadcrumbs
 * - User greeting
 * - Quick actions (optional)
 * 
 * The header provides context about where the user is in the app.
 * ============================================================================
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { HiOutlineChevronRight } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

/**
 * Breadcrumb item type
 */
interface BreadcrumbItem {
  name: string;
  href?: string;
}

/**
 * Generate breadcrumbs from current path
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  segments.forEach((segment, index) => {
    // Convert segment to readable name
    let name = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Handle special cases
    if (segment === 'employees') {
      name = 'Employees';
    } else if (segment === 'dependents') {
      name = 'Dependents';
    } else if (segment === 'add') {
      name = 'Add Employee';
    } else if (segment === 'bulk-upload') {
      name = 'Bulk Upload';
    } else if (!isNaN(Number(segment))) {
      // It's an ID, skip adding href
      name = 'Details';
    }
    
    // Build href for navigation (except last item)
    const href = index < segments.length - 1 
      ? '/' + segments.slice(0, index + 1).join('/')
      : undefined;
    
    breadcrumbs.push({ name, href });
  });
  
  return breadcrumbs;
}

/**
 * Header Component
 */
function Header() {
  const { user } = useAuth();
  const location = useLocation();
  
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard';
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div>
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
                )}
                {crumb.href ? (
                  <a 
                    href={crumb.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {crumb.name}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {crumb.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
          
          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            {pageTitle}
          </h1>
        </div>
        
        {/* User Greeting */}
        <div className="text-right">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="text-gray-900 font-medium">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
