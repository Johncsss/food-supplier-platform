'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong!
        </h1>
        
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full btn-primary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
          
          <Link href="/" className="w-full btn-outline block">
            <Home className="w-4 h-4 mr-2" />
            Go to homepage
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Error details (development only)
            </summary>
            <pre className="mt-2 text-xs text-gray-500 bg-gray-100 p-3 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 