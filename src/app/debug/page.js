'use client';

import { useState, useEffect } from 'react';
import { getPrivateKey } from '../../utils/cryptoUtils';
import Script from 'next/script';

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [result, setResult] = useState(null);
  const [privKeyResult, setPrivKeyResult] = useState(null);
  const [debugConsoleMessages, setDebugConsoleMessages] = useState([]);

  useEffect(() => {
    // Check session on load
    checkSession();
    
    // Override console.log to capture debug messages
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setDebugConsoleMessages(prev => [...prev, { type: 'log', message: args.join(' ') }]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setDebugConsoleMessages(prev => [...prev, { type: 'error', message: args.join(' ') }]);
      originalError(...args);
    };
    
    // Restore original console methods on cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('bmail_token');
      const userEmail = localStorage.getItem('bmail_user_email');
      
      setSessionInfo({
        hasSession: !!token,
        email: userEmail || 'None',
        token: token ? 'Present' : 'None'
      });
    } catch (err) {
      setSessionInfo({ error: err.message });
    }
  };

  const handleSignIn = async () => {
    try {
      setResult({ status: 'Loading...' });
      const email = testEmail.includes('@') ? testEmail : `${testEmail}@bmail.com`;
      
      // Call our own auth API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: testPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setResult({ success: false, message: data.error || 'Authentication failed' });
      } else {
        // Store token and email
        localStorage.setItem('bmail_token', data.token);
        localStorage.setItem('bmail_user_email', email);
        
        setResult({ 
          success: true, 
          message: 'Sign in successful',
          user: data.user 
        });
        checkSession();
      }
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
  };

  const handleSignUp = async () => {
    try {
      setResult({ status: 'Loading...' });
      const email = testEmail.includes('@') ? testEmail : `${testEmail}@bmail.com`;
      
      // Call our own auth API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password: testPassword,
          name: email.split('@')[0],
          ethAddress: '0x0000000000000000000000000000000000000000' // Placeholder
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setResult({ success: false, message: data.error || 'Registration failed' });
      } else {
        setResult({ 
          success: true, 
          message: 'Sign up successful',
          user: data.user 
        });
      }
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
  };

  const autoConfirmEmail = async () => {
    try {
      setResult({ status: 'Loading...' });
      const email = testEmail.includes('@') ? testEmail : `${testEmail}@bmail.com`;
      
      setResult({ status: 'This would confirm the email for: ' + email + '. For security reasons, this needs to be done via the server-side API with admin access.' });
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
  };

  const handleSignOut = async () => {
    try {
      setResult({ status: 'Loading...' });
      
      // Clear local storage
      localStorage.removeItem('bmail_token');
      localStorage.removeItem('bmail_user_email');
      
      setResult({ success: true, message: 'Signed out successfully' });
      checkSession();
    } catch (err) {
      setResult({ success: false, message: err.message });
    }
  };

  const checkPrivateKey = async () => {
    try {
      setPrivKeyResult({ status: 'Checking...' });
      const email = testEmail.includes('@') ? testEmail : `${testEmail}@bmail.com`;
      
      const privateKey = await getPrivateKey(email);
      setPrivKeyResult({ 
        success: true, 
        message: 'Private key found',
        keyLength: privateKey.length 
      });
    } catch (err) {
      setPrivKeyResult({ 
        success: false, 
        message: err.message 
      });
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Script src="/debugAuth.js" strategy="afterInteractive" />
      
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      {/* Session Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Session</h2>
        {sessionInfo ? (
          <div>
            <p><strong>Has Session:</strong> {sessionInfo.hasSession ? 'Yes' : 'No'}</p>
            <p><strong>Email:</strong> {sessionInfo.email}</p>
            <p><strong>Token:</strong> {sessionInfo.token}</p>
            {sessionInfo.error && <p className="text-red-500"><strong>Error:</strong> {sessionInfo.error}</p>}
          </div>
        ) : (
          <p>Loading session information...</p>
        )}
        <button 
          onClick={checkSession}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Session
        </button>
      </div>
      
      {/* Test Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="username or email@bmail.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={handleSignIn}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Sign In
            </button>
            <button 
              onClick={handleSignUp}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Sign Up
            </button>
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Sign Out
            </button>
            <button 
              onClick={autoConfirmEmail}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Confirm Email (Instructions)
            </button>
          </div>
        </div>
      </div>
      
      {/* Private Key Check */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Check Private Key</h2>
        <button 
          onClick={checkPrivateKey}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Check Private Key for Email
        </button>
        
        {privKeyResult && (
          <div className={`mt-4 p-4 rounded ${privKeyResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <p><strong>Status:</strong> {privKeyResult.message}</p>
            {privKeyResult.keyLength && (
              <p><strong>Key Length:</strong> {privKeyResult.keyLength} characters</p>
            )}
          </div>
        )}
      </div>
      
      {/* Result Output */}
      {result && (
        <div className={`bg-white p-6 rounded-lg shadow ${
          result.status ? 'bg-gray-50' : 
          result.success ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          {result.status ? (
            <p>{result.status}</p>
          ) : (
            <div>
              <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
              <p><strong>Message:</strong> {result.message}</p>
              {result.user && (
                <div className="mt-2">
                  <p><strong>User ID:</strong> {result.user.id}</p>
                  <p><strong>Email:</strong> {result.user.email}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Debug Console */}
      <div className="bg-black text-green-400 p-4 rounded-lg shadow font-mono text-sm mt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Debug Console</h2>
        <p className="text-gray-400 mb-2">Open browser console and type: window.debugAuth.testAuth()</p>
        <div className="max-h-64 overflow-y-auto">
          {debugConsoleMessages.map((log, index) => (
            <div 
              key={index} 
              className={`${log.type === 'error' ? 'text-red-400' : 'text-green-400'} mb-1`}
            >
              &gt; {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 