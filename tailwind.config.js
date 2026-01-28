/**
 * ============================================================================
 * TAILWIND CSS CONFIGURATION - Digital Enrolment System
 * ============================================================================
 * 
 * Tailwind is our utility-first CSS framework. This configuration extends
 * the default theme with custom colors, fonts, and other design tokens
 * that match our Figma design specifications.
 * 
 * Design System Colors (from Figma):
 * - Sidebar: Dark Navy (#1E2A4A)
 * - Primary: Blue (#3B82F6)
 * - Success: Green (#22C55E)
 * - Error: Red (#EF4444)
 * - Background: Light Gray (#F3F4F6)
 * ============================================================================
 */

/** @type {import('tailwindcss').Config} */
export default {
  /*
   * ========== Content Paths ==========
   * Tell Tailwind which files to scan for class names.
   * It will only include CSS for classes it finds in these files.
   */
  content: [
    './src/client/index.html',
    './src/client/**/*.{js,ts,jsx,tsx}',
  ],
  
  /*
   * ========== Theme Extensions ==========
   * Extend (not replace) the default Tailwind theme with our custom values
   */
  theme: {
    extend: {
      /*
       * Custom Colors
       * -------------
       * These match our Figma design and provide semantic naming.
       * Usage: bg-sidebar, text-primary, border-success, etc.
       */
      colors: {
        // Sidebar navigation background
        sidebar: {
          DEFAULT: '#1E2A4A',      // Main sidebar color
          light: '#2D3E5F',        // Hover state
          dark: '#151D33',         // Active state
        },
        
        // Primary brand color (buttons, links, active states)
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',          // Main primary
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        
        // Success states (confirmations, positive actions)
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',          // Main success
          600: '#16A34A',
          700: '#15803D',
        },
        
        // Error/danger states (deletions, warnings)
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',          // Main danger
          600: '#DC2626',
          700: '#B91C1C',
        },
        
        // Warning states
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',          // Main warning
          600: '#D97706',
          700: '#B45309',
        },
      },
      
      /*
       * Custom Fonts
       * ------------
       * We use a professional sans-serif stack for the UI.
       * The 'display' font is for headings, 'body' for content.
       */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      /*
       * Box Shadows
       * -----------
       * Custom shadows for cards, modals, and elevated elements
       */
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'sidebar': '4px 0 6px -1px rgb(0 0 0 / 0.1)',
      },
      
      /*
       * Border Radius
       * -------------
       * Consistent border radius values across the app
       */
      borderRadius: {
        'card': '0.5rem',
        'button': '0.375rem',
        'input': '0.375rem',
        'modal': '0.75rem',
      },
      
      /*
       * Spacing
       * -------
       * Custom spacing values for consistent layout
       */
      spacing: {
        'sidebar': '16rem',        // 256px - width of sidebar
        'header': '4rem',          // 64px - height of header
      },
      
      /*
       * Animations
       * ----------
       * Custom animations for UI interactions
       */
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  
  /*
   * ========== Plugins ==========
   * Additional Tailwind plugins can be added here
   */
  plugins: [],
};
