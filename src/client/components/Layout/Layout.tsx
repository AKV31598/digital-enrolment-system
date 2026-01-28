/**
 * ============================================================================
 * LAYOUT COMPONENT - Main Application Layout
 * ============================================================================
 * 
 * This component provides the main layout structure:
 * - Left sidebar with navigation
 * - Main content area
 * 
 * The layout adapts based on user role:
 * - HR Managers see: Employees, Statistics links
 * - Employees see: Dependents link only
 * 
 * Based on the Figma design with dark navy sidebar.
 * ============================================================================
 */

import React, { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout Component
 * 
 * Wraps page content with sidebar and header.
 * Uses CSS Grid for a responsive layout.
 */
function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/**
       * Layout Grid
       * - Sidebar: Fixed width on the left
       * - Content: Takes remaining space
       */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {/* Content container with max width for readability */}
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;
