/**
 * ============================================================================
 * POSTCSS CONFIGURATION
 * ============================================================================
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * We use it to process Tailwind CSS directives (@tailwind, @apply, etc.)
 * and add vendor prefixes for browser compatibility.
 * 
 * Plugins:
 * - tailwindcss: Processes Tailwind directives and generates utility classes
 * - autoprefixer: Adds vendor prefixes (-webkit-, -moz-, etc.) automatically
 * ============================================================================
 */

export default {
  plugins: {
    // Process Tailwind CSS
    tailwindcss: {},
    
    // Add vendor prefixes for browser compatibility
    autoprefixer: {},
  },
};
