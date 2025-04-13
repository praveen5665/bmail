'use client';

import { useRouter } from 'next/navigation';

export default function About() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Bmail</h1>
          <div className="space-x-4">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => router.push('/signin')}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-100 text-blue-600 border border-blue-600 rounded-md transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Bmail</h2>
          
          <div className="prose max-w-none">
            <p className="text-lg mb-6">
              Bmail is a decentralized email platform that leverages blockchain technology and 
              cryptography to provide secure, private communication that no one can censor or intercept.
            </p>
            
            <h3 className="text-xl font-semibold mt-8 mb-4">How Bmail Works</h3>
            
            <div className="mb-8">
              <h4 className="font-medium mb-2">1. End-to-End Encryption</h4>
              <p>
                Every message is encrypted using RSA public key cryptography. When you send an email, 
                it's encrypted with the recipient's public key, ensuring only they can decrypt it with 
                their private key.
              </p>
            </div>
            
            <div className="mb-8">
              <h4 className="font-medium mb-2">2. Decentralized Storage with IPFS</h4>
              <p>
                Email content is stored on the InterPlanetary File System (IPFS), a distributed file 
                storage system. This means your emails aren't stored on any single server that could be 
                compromised or shut down.
              </p>
            </div>
            
            <div className="mb-8">
              <h4 className="font-medium mb-2">3. Blockchain-Powered Metadata</h4>
              <p>
                Email metadata (sender, recipient, timestamp) is stored on the Ethereum blockchain. 
                This creates an immutable record of communications while keeping the actual content 
                private and encrypted.
              </p>
            </div>
            
            <div className="mb-8">
              <h4 className="font-medium mb-2">4. Non-Custodial Key Management</h4>
              <p>
                Your private keys never leave your device. This means no one, not even Bmail's developers, 
                can access your emails. You alone control your encryption keys.
              </p>
            </div>
            
            <h3 className="text-xl font-semibold mt-8 mb-4">Technical Architecture</h3>
            
            <ul className="list-disc pl-6 mb-6">
              <li><strong>Front-end:</strong> Next.js and React for a responsive user interface</li>
              <li><strong>Smart Contract:</strong> Ethereum-based contract for email metadata</li>
              <li><strong>Storage:</strong> IPFS with Pinata for distributed content storage</li>
              <li><strong>Authentication:</strong> Secure login with JWT tokens</li>
              <li><strong>Encryption:</strong> RSA public-key cryptography for message security</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-8 mb-4">Privacy and Security</h3>
            
            <p className="mb-4">
              With Bmail, you get:
            </p>
            
            <ul className="list-disc pl-6 mb-6">
              <li>Protection against surveillance and data mining</li>
              <li>Censorship resistance through decentralized storage</li>
              <li>No single point of failure or attack</li>
              <li>Full ownership of your communication data</li>
              <li>Protection against phishing through wallet authentication</li>
            </ul>
            
            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <h3 className="text-xl font-semibold text-blue-800 mb-4">Ready to get started?</h3>
              <p className="mb-4">
                Join the future of secure communication today!
              </p>
              <button 
                onClick={() => router.push('/signup')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Create Your Bmail Account
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            &copy; {new Date().getFullYear()} Bmail. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 