'use client';

import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-gray-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        <div className="space-y-3">
          <Link href="/" className="w-full btn-primary block">
            <Home className="w-4 h-4 mr-2" />
            Go to homepage
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full btn-outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
} 