'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EmailLayout({ children, title, emailCount, activeTab }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                  {emailCount} {emailCount === 1 ? 'email' : 'emails'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push('/compose')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Compose
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <Link 
                href="/inbox" 
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'inbox' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                }`}
              >
                Inbox
              </Link>
              <Link 
                href="/sent" 
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'sent' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                }`}
              >
                Sent
              </Link>
              <Link 
                href="/starred" 
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'starred' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                }`}
              >
                Starred
              </Link>
              <Link 
                href="/drafts" 
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'drafts' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                }`}
              >
                Drafts
              </Link>
              <Link 
                href="/staking" 
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'staking' 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                }`}
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