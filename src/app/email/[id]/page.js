'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { getEmailDetailsWithDecryption, updateEmailStatus } from '../../../utils/emailService';

export default function EmailDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, loading, signOut } = useAuth();
  
  const [email, setEmail] = useState(null);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [error, setError] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push('/signin');
      return;
    }
    
    if (user && id) {
      fetchEmailDetails();
    }
  }, [loading, user, id, router]);
  
  const fetchEmailDetails = async () => {
    setLoadingEmail(true);
    setError(null);
    
    try {
      const result = await getEmailDetailsWithDecryption(id);
      
      if (result.success) {
        // Convert any Set objects to arrays before setting state
        const sanitizedEmail = {
          ...result.email,
          decryptedContent: result.email.decryptedContent ? 
            (typeof result.email.decryptedContent === 'object' ? 
              JSON.parse(JSON.stringify(result.email.decryptedContent)) : 
              result.email.decryptedContent) : 
            null
        };
        
        setEmail(sanitizedEmail);
        setIsStarred(result.email.isStarred);
        
        // Mark as read if not already
        if (!result.email.isRead && result.email.sender !== user.ethAddress) {
          try {
            await updateEmailStatus(id, true, result.email.isStarred, result.email.isDraft);
          } catch (statusError) {
            console.warn('Failed to mark email as read:', statusError);
            // Don't set error state for non-critical errors
          }
        }
      } else {
        setError(result.error || 'Failed to load email');
      }
    } catch (err) {
      console.error('Error fetching email details:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoadingEmail(false);
    }
  };
  
  const toggleStar = async () => {
    try {
      const newValue = !isStarred;
      setIsStarred(newValue);
      
      const result = await updateEmailStatus(id, email.isRead, newValue, email.isDraft);
      
      if (!result.success) {
        // Revert UI if operation failed
        setIsStarred(email.isStarred);
        console.error('Failed to update star status:', result.error);
      }
    } catch (err) {
      // Revert UI if operation failed
      setIsStarred(email.isStarred);
      console.error('Error updating star status:', err);
    }
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const parseEmailContent = (email) => {
    if (!email || !email.decryptedContent) return { subject: 'No subject', body: 'No content available' };
    
    try {
      if (typeof email.decryptedContent === 'object') {
        return {
          subject: email.decryptedContent.subject || 'No subject',
          body: email.decryptedContent.body || '',
          sender: email.decryptedContent.sender
        };
      }
      
      // Try to parse as JSON
      try {
        const content = JSON.parse(email.decryptedContent);
        return {
          subject: content.subject || 'No subject',
          body: content.body || '',
          sender: content.sender
        };
      } catch {
        // If not JSON, use as plain text
        return {
          subject: 'Message',
          body: email.decryptedContent
        };
      }
    } catch (error) {
      console.error('Error parsing email content:', error);
      return { subject: 'Error', body: 'Could not parse email content' };
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  const content = email ? parseEmailContent(email) : { subject: 'Loading...', body: '' };
  const isSent = email && email.sender === user.ethAddress;
  const isDraft = email && email.isDraft;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Bmail</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              {user.email}
            </div>
            <button 
              onClick={signOut}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <button 
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 mb-6 font-medium"
              onClick={() => router.push('/compose')}
            >
              Compose
            </button>
            <nav className="space-y-1">
              <a href="/inbox" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Inbox
              </a>
              <a href="/sent" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Sent
              </a>
              <a href="/drafts" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Drafts
              </a>
              <a href="/starred" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
                Starred
              </a>
            </nav>
          </div>

          {/* Email Detail */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <div className="flex items-center">
                {isDraft && (
                  <button 
                    className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md"
                    onClick={() => router.push(`/compose?draft=${id}`)}
                  >
                    Continue Draft
                  </button>
                )}
                {!isDraft && (
                  <button 
                    className="ml-3 px-3 py-1 text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md"
                    onClick={() => router.push(`/compose?reply=${id}`)}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
            
            {loadingEmail ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading email...</p>
              </div>
            ) : error ? (
              <div className="p-8">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : email ? (
              <div className="divide-y divide-gray-200">
                <div className="px-6 py-4">
                  <div className="flex justify-between">
                    <h2 className="text-xl font-bold">{content.subject}</h2>
                    <button 
                      onClick={toggleStar}
                      className="text-gray-400 hover:text-yellow-400"
                    >
                      <span className={`text-2xl ${isStarred ? 'text-yellow-400' : ''}`}>★</span>
                    </button>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <div>
                      {isSent ? (
                        <p className="text-sm text-gray-600">To: {email.recipient}</p>
                      ) : (
                        <p className="text-sm text-gray-600">From: {email.sender}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatDate(email.timestamp)}</p>
                    </div>
                    
                    {isDraft && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-6">
                  <div className="prose max-w-none">
                    {content.body.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 