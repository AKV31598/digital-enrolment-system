/**
 * ============================================================================
 * REACT ENTRY POINT - Application Bootstrap
 * ============================================================================
 * 
 * This is where React takes control of the page.
 * 
 * What happens here:
 * 1. Import React and ReactDOM
 * 2. Import global styles (Tailwind CSS)
 * 3. Import the main App component
 * 4. Mount the app to the DOM
 * 
 * This file should be kept minimal - all app logic is in App.tsx
 * ============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Tailwind CSS and global styles
import './styles/index.css';

/**
 * Get the root DOM element
 * This is the <div id="root"> in index.html
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has <div id="root"></div>');
}

/**
 * Create React root and render the app
 * 
 * React 18 uses createRoot instead of ReactDOM.render
 * This enables concurrent features and automatic batching
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Render the application
 * 
 * StrictMode enables additional development checks:
 * - Warns about deprecated lifecycle methods
 * - Warns about legacy string refs
 * - Detects unexpected side effects
 * - Warns about legacy context API
 * 
 * These checks only run in development, not production.
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
