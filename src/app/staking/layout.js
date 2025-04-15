'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function StakingLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // If not authenticated, redirect to sign in
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, show a loading state (will redirect to sign in)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Staking</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/inbox')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Inbox
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <Link 
                href="/inbox" 
                className="px-3 py-2 text-sm font-medium border-b-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent"
              >
                Inbox
              </Link>
              <Link 
                href="/sent" 
                className="px-3 py-2 text-sm font-medium border-b-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent"
              >
                Sent
              </Link>
              <Link 
                href="/starred" 
                className="px-3 py-2 text-sm font-medium border-b-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent"
              >
                Starred
              </Link>
              <Link 
                href="/drafts" 
                className="px-3 py-2 text-sm font-medium border-b-2 text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent"
              >
                Drafts
              </Link>
              <Link 
                href="/staking" 
                className="px-3 py-2 text-sm font-medium border-b-2 text-indigo-600 border-indigo-600"
              >
                Staking
              </Link>
            </div>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
} 