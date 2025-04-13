'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { sendEmail, getEmailDetailsWithContent } from '../../utils/emailService';

export default function Compose() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [draftId, setDraftId] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }

    const id = searchParams.get('id');
    if (id) {
      setDraftId(id);
      fetchEmail(id);
    }
  }, [loading, user, router, searchParams]);

  const fetchEmail = async (id) => {
    setLoadingEmail(true);
    setError(null);

    try {
      const result = await getEmailDetailsWithContent(id);
      if (result.success && result.email) {
        setTo(result.email.to || '');
        setSubject(result.email.content?.subject || '');
        setContent(result.email.content?.content || '');
      } else {
        setError('Failed to load email draft');
      }
    } catch (err) {
      console.error('Error fetching email:', err);
      setError('Failed to load email draft');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!to || !subject || !content) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const result = await sendEmail(to, subject, content, draftId);
      if (result.success) {
        router.push('/sent');
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.back()}
                  className="mr-3 text-white hover:text-gray-200 transition-colors"
                  aria-label="Go back"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-white">New Message</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.back()}
                  className="px-3 py-1 text-sm bg-indigo-700 text-white rounded-md hover:bg-indigo-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="px-4 py-1 text-sm bg-white text-indigo-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            <div className="p-6 space-y-6">

              {/* To Field */}
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="text"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Recipient's email address"
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition sm:text-sm"
                  required
                />
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition sm:text-sm"
                  required
                />
              </div>

              {/* Message Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message here..."
                  rows={12}
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition sm:text-sm resize-none"
                  required
                ></textarea>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
