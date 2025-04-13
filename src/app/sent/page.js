'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getUserEmailsWithContent, updateEmailStatus } from '../../utils/emailService';
import EmailLayout from '../../components/EmailLayout';

export default function Sent() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, starred
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/signin');
    } else if (user) {
      fetchEmails();
    }
  }, [loading, user, router]);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    setError(null);
    
    try {
      if (!user || !user.ethAddress) {
        setError("No wallet address found. Please connect your wallet.");
        setLoadingEmails(false);
        return;
      }
      
      // Get user's emails from blockchain and IPFS
      const result = await getUserEmailsWithContent(user.ethAddress);
      
      if (result.success && result.emails.length > 0) {
        console.log('Emails found:', result.emails);
        // Filter emails where the current user is the sender (case-insensitive)
        const sentEmails = result.emails.filter(email => 
          email.from && email.from.toLowerCase() === user.ethAddress.toLowerCase()
        );
        console.log('Filtered sent emails:', sentEmails);
        setEmails(sentEmails);
      } else {
        console.log('No emails found or error:', result);
        setEmails([]);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      let errorMessage = 'Failed to load emails';
      
      if (err.message?.includes('contract')) {
        errorMessage = 'Smart contract connection issue. Development mode is using mock data.';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (err.message?.includes('wallet')) {
        errorMessage = 'Wallet connection issue. Please reconnect your wallet.';
      }
      
      setError(errorMessage);
    } finally {
      setLoadingEmails(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const filteredEmails = emails.filter(email => {
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const subject = typeof email.content === 'object' 
        ? (email.content.subject || '').toLowerCase() 
        : '';
      const content = typeof email.content === 'object' 
        ? (email.content.content || '').toLowerCase() 
        : (email.content || '').toLowerCase();
      
      if (!subject.includes(searchLower) && !content.includes(searchLower)) {
        return false;
      }
    }
    
    // Apply category filter
    if (filter === 'unread' && email.isRead) {
      return false;
    }
    if (filter === 'starred' && !email.isStarred) {
      return false;
    }
    
    return true;
  });

  const toggleStar = async (emailId, currentStarredStatus) => {
    try {
      // Find the email in the state
      const emailIndex = emails.findIndex(email => email.id === emailId);
      if (emailIndex === -1) return;
      
      const email = emails[emailIndex];
      
      // Update the email status
      const result = await updateEmailStatus(
        emailId,
        email.isRead,
        !currentStarredStatus,
        email.isDraft
      );
      
      if (result.success) {
        // Update the local state
        const updatedEmails = [...emails];
        updatedEmails[emailIndex] = {
          ...email,
          isStarred: !currentStarredStatus
        };
        setEmails(updatedEmails);
      } else {
        console.error('Failed to update star status:', result.error);
      }
    } catch (err) {
      console.error('Error updating star status:', err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.push('/signin')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmailLayout title="Sent" emailCount={filteredEmails.length} activeTab="sent">
      {/* Search and Filter */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-40 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="starred">Starred</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="divide-y divide-gray-200">
        {loadingEmails ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sent emails</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by composing a new email.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/compose')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Compose New Email
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredEmails.map((email, index) => (
              <li 
                key={`${email.id}-${index}`} 
                className="hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => router.push(`/email/${email.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(email.id, email.isStarred);
                          }}
                          className="focus:outline-none"
                        >
                          {email.isStarred ? (
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <p className={`text-sm font-medium ${!email.isRead ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                            To: {email.to}
                          </p>
                          {!email.isRead && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {typeof email.content === 'object' ? email.content.subject : 'Message'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {typeof email.content === 'object' 
                            ? (email.content.content || email.content.body || 'No content')
                            : (typeof email.content === 'string' ? email.content : 'No content')}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <p className="text-sm text-gray-500">
                        {formatDate(email.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </EmailLayout>
  );
}