'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getUserEmailsWithContent } from '../../utils/emailService';

export default function Inbox() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [error, setError] = useState(null);

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
      if (!user || !user.address) {
        throw new Error('No Ethereum address available. Please ensure your wallet is connected.');
      }
      
      // Get user's emails from blockchain and IPFS
      const result = await getUserEmailsWithContent(user.address);
      
      if (result.success) {
        // Format emails for display
        const formattedEmails = result.emails
          .filter(email => email.recipient === user.address) // Only show received emails in inbox
          .map(email => {
            // Try to extract subject and excerpt from decrypted content
            let subject = 'No subject';
            let excerpt = 'No content available';
            
            if (email.decryptedContent) {
              if (typeof email.decryptedContent === 'object') {
                subject = email.decryptedContent.subject || 'No subject';
                excerpt = email.decryptedContent.body?.substring(0, 100) || 'No content';
              } else if (typeof email.decryptedContent === 'string') {
                // Try to parse as JSON
                try {
                  const content = JSON.parse(email.decryptedContent);
                  subject = content.subject || 'No subject';
                  excerpt = content.body?.substring(0, 100) || 'No content';
                } catch {
                  // If not JSON, use as plain text
                  subject = 'Message';
                  excerpt = email.decryptedContent.substring(0, 100);
                }
              }
            }
            
            return {
              id: email.id,
              sender: email.sender,
              subject,
              excerpt,
              timestamp: new Date(email.timestamp), 
              isRead: email.isRead,
              isStarred: email.isStarred,
              isDraft: email.isDraft
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
          
        setEmails(formattedEmails);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoadingEmails(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

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
              <a href="/inbox" className="block px-3 py-2 bg-blue-50 text-blue-700 rounded-md font-medium">
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

          {/* Email List */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Inbox</h2>
              <div className="text-sm text-gray-500">
                {emails.length} message{emails.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loadingEmails ? (
              <div className="p-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No emails in your inbox</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <li key={email.id} className="hover:bg-gray-50 transition-colors">
                    <a 
                      href={`/email/${email.id}`} 
                      className={`block px-6 py-4 ${!email.isRead ? 'font-semibold' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{email.sender}</p>
                          <p className={`text-md ${!email.isRead ? 'font-semibold' : ''}`}>
                            {email.isStarred && <span className="text-yellow-400 mr-1">★</span>}
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{email.excerpt}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {email.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 