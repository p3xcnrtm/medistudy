import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { pdfjs } from 'react-pdf';

// CRITICAL FIX: Polyfill 'process' for browser environments (Vite/Railway)
// We ensure 'process.env' exists so the app doesn't crash when accessing it.
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!window.process) {
    // @ts-ignore
    window.process = { env: {} };
  }
  // @ts-ignore
  if (!window.process.env) {
    // @ts-ignore
    window.process.env = {};
  }

  // RAILWAY / VITE SUPPORT BRIDGE
  // Modern bundlers (Vite) often only expose env vars prefixed with VITE_
  // and hang them off import.meta.env.
  // We bridge them to process.env.API_KEY so the strict Google GenAI SDK usage works.
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      // Check for common variations used in Railway/Vite deployments
      const fallbackKey = import.meta.env.API_KEY || import.meta.env.VITE_API_KEY || import.meta.env.REACT_APP_API_KEY;
      
      // @ts-ignore
      if (fallbackKey && !window.process.env.API_KEY) {
        // @ts-ignore
        window.process.env.API_KEY = fallbackKey;
        console.log("MediStudy: API Key bridged from environment.");
      }
    }
  } catch (e) {
    console.debug("Env bridge check skipped:", e);
  }
}

// Configure PDF.js worker
// Modern pdfjs-dist versions (v4+) use .mjs for the worker in the build directory.
// We must point to the .mjs file to avoid 404s and "Failed to fetch dynamically imported module" errors.
try {
  if (pdfjs.version) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  } else {
    // Fallback to a known compatible version if version detection fails
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn("PDF Worker initialization warning:", e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);