'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function NotFound() {
  // This script helps with GitHub Pages subpath routing
  useEffect(() => {
    // When deployed on GitHub Pages, this script handles redirects
    // For example: /finance/sip-calculator -> /finance/sip-calculator.html
    const pathname = window.location.pathname;
    
    // Extract the path after /finance/
    const basePath = '/finance';
    if (pathname.startsWith(basePath)) {
      const actualPath = pathname.substring(basePath.length);
      
      // Check if we need to redirect
      if (actualPath && !actualPath.includes('.')) {
        // Redirect to the same path but with .html extension
        window.location.href = `${basePath}${actualPath}.html`;
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-6">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link href="/" className="btn-primary inline-block">
          Return to Home
        </Link>
      </div>
    </div>
  );
} 