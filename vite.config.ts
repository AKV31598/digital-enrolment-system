/**
 * ============================================================================
 * VITE CONFIGURATION - Digital Enrolment System
 * ============================================================================
 * 
 * Vite is our build tool and development server for the React frontend.
 * It provides:
 * - Lightning-fast Hot Module Replacement (HMR)
 * - Out-of-the-box TypeScript support
 * - Optimized production builds
 * 
 * Key configurations:
 * - React plugin for JSX transformation
 * - Proxy setup to forward API calls to our Express server
 * - Path aliases matching our tsconfig.json
 * ============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  /*
   * ========== Plugins ==========
   * React plugin enables:
   * - JSX transformation
   * - Fast Refresh (HMR for React)
   * - Automatic JSX runtime
   */
  plugins: [react()],
  
  /*
   * ========== Path Resolution ==========
   * Define aliases so we can use clean imports:
   * import { trpc } from '@client/trpc' instead of relative paths
   */
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './src/server'),
      '@client': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  
  /*
   * ========== Root Directory ==========
   * Tell Vite where to find the index.html file
   */
  root: './src/client',
  
  /*
   * ========== Development Server ==========
   * Configure the dev server settings
   */
  server: {
    // Port for the frontend dev server
    port: 5173,
    
    /*
     * Proxy Configuration
     * -------------------
     * This is CRUCIAL for development. When the frontend makes API calls
     * to /api/trpc/*, Vite will forward them to our Express server
     * running on port 3000. This avoids CORS issues during development.
     * 
     * Example:
     * Frontend calls: http://localhost:5173/api/trpc/employee.list
     * Vite proxies to: http://localhost:3000/api/trpc/employee.list
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  
  /*
   * ========== Build Configuration ==========
   * Settings for production builds
   */
  build: {
    // Output directory (relative to project root, not src/client)
    outDir: '../../dist/client',
    
    // Empty the output directory before building
    emptyOutDir: true,
    
    /*
     * Source Maps
     * -----------
     * We enable source maps so that if errors occur in production,
     * we can trace them back to the original TypeScript code
     */
    sourcemap: true,
  },
  
  /*
   * ========== Optimization ==========
   * Configure how dependencies are pre-bundled
   */
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev startup
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
