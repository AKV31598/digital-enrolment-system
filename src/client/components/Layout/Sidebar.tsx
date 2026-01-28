/**
 * ============================================================================
 * SIDEBAR COMPONENT - Navigation Menu
 * ============================================================================
 * 
 * The sidebar provides navigation throughout the application.
 * It displays different menu items based on the user's role.
 * 
 * Design:
 * - Dark navy background (#1E2A4A) matching Figma
 * - Logo/brand at top
 * - Navigation links in the middle
 * - User info and logout at bottom
 * 
 * Role-based navigation:
 * - HR Manager: Home, Employees, Statistics
 * - Employee: Dependents only
 * ============================================================================
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiOutlineUsers, 
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

/**
 * Navigation item type
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Sidebar Component
 */
function Sidebar() {
  const { user, isHRManager, logout } = useAuth();
  const location = useLocation();
  
  /**
   * Navigation items based on role
   * HR Managers see employee management
   * Employees see only their dependents
   */
  const navItems: NavItem[] = isHRManager
    ? [
        { name: 'Employees', href: '/employees', icon: HiOutlineUsers },
        // { name: 'Statistics', href: '/statistics', icon: HiOutlineChartBar },
      ]
    : [
        { name: 'Dependents', href: '/dependents', icon: HiOutlineUserGroup },
      ];
  
  /**
   * Check if a nav item is currently active
   */
  const isActive = (href: string): boolean => {
    if (href === '/employees') {
      return location.pathname.startsWith('/employees');
    }
    return location.pathname === href;
  };
  
  return (
    <aside className="w-64 bg-sidebar flex flex-col shadow-sidebar">
      {/**
       * Logo / Brand Section
       * Shows company name and optional logo
       */}
      <div className="p-6 border-b border-sidebar-light">
        <div className="flex items-center gap-3">
          {/* Logo Icon */}
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <HiOutlineOfficeBuilding className="w-6 h-6 text-white" />
          </div>
          
          {/* Brand Name */}
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">
              PrishaPolicy
            </h1>
            <p className="text-gray-400 text-xs">
              Digital Enrolment
            </p>
          </div>
        </div>
      </div>
      
      {/**
       * Navigation Links
       * Main menu items
       */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${active
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:bg-sidebar-light hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/**
       * User Section
       * Shows current user info and logout button
       */}
      <div className="p-4 border-t border-sidebar-light">
        {/* User Info */}
        <div className="px-4 py-3 mb-2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            
            {/* Name & Role */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {isHRManager ? 'HR Manager' : 'Employee'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-gray-300 hover:bg-sidebar-light hover:text-white
            transition-colors duration-200
          "
        >
          <HiOutlineLogout className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
