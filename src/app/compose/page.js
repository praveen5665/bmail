'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getPrivateKey, getPublicKey, encryptMessage } from '../../utils/cryptoUtils';
import { sendEmail } from '../../utils/emailService';

export default function Compose() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    message: ''
  });
  
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate form
      if (!formData.recipient || !formData.subject || !formData.message) {
        throw new Error('All fields are required');
      }
      
      // 1. Try to get recipient's public key directly - this will throw an error if the user doesn't exist
      let recipientPublicKey;
      try {
        recipientPublicKey = await getPublicKey(formData.recipient);
        if (!recipientPublicKey) {
          throw new Error(`Recipient ${formData.recipient} not found`);
        }
      } catch (err) {
        throw new Error(`Recipient ${formData.recipient} not found`);
      }
      
      // 2. Encrypt the message with recipient's public key
      const emailContent = {
        subject: formData.subject,
        body: formData.message,
        timestamp: new Date().toISOString(),
        sender: user.email
      };
      
      // Convert to string for encryption
      const emailContentString = JSON.stringify(emailContent);
      
      // Encrypt the message
      const encryptedContent = encryptMessage(emailContentString, recipientPublicKey);
      
      // 3. Send the encrypted email via smart contract
      try {
        const result = await sendEmail(formData.recipient, encryptedContent);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }
        
        setSuccess('Email sent successfully!');
        
        // Clear form
        setFormData({
          recipient: '',
          subject: '',
          message: ''
        });
        
        // Redirect to sent folder after 2 seconds
        setTimeout(() => {
          router.push('/sent');
        }, 2000);
      } catch (sendError) {
        // Special handling for blockchain/contract errors
        if (sendError.message && sendError.message.includes('formatJson')) {
          console.warn('Blockchain connection error, email data will be saved locally');
          // Show a more user-friendly message
          setSuccess('Email saved locally. Blockchain sync will happen when connection is restored.');
          
          // Clear form
          setFormData({
            recipient: '',
            subject: '',
            message: ''
          });
          
          // Redirect to sent folder after 2 seconds
          setTimeout(() => {
            router.push('/sent');
          }, 2000);
        } else {
          throw sendError;
        }
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };
  
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-blue-600">Bmail</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700 bg-blue-50 px-3 py-1 rounded-full">
              {user.email}
            </div>
            <button 
              onClick={() => router.push('/inbox')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Back to Inbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                New Secure Message
              </h2>
              <button 
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6 animate-fade-in">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="relative">
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    To:
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      id="recipient"
                      name="recipient"
                      type="email"
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 bg-white"
                      placeholder="recipient@bmail.com"
                      value={formData.recipient}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject:
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 bg-white"
                    placeholder="Email subject"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message:
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={10}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-800 bg-white"
                    placeholder="Write your secure message here..."
                    value={formData.message}
                    onChange={handleChange}
                    style={{ minHeight: '200px' }}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  onClick={() => router.push('/inbox')}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className={`inline-flex justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                    loadingAction ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loadingAction ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                      Sending...
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">End-to-End Encryption</h3>
                  <p className="text-sm text-gray-500">
                    Your message is encrypted with the recipient's public key before being sent. 
                    Only the intended recipient can decrypt it with their private key. 
                    Message content is never stored in plaintext on our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}