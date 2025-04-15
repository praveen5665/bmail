'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StakingInterface from '../../components/StakingInterface';

export default function StakingPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');

  useEffect(() => {
    // Check if wallet is connected
    const checkWalletConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsConnected(true);
            setUserAddress(accounts[0]);
          } else {
            setIsConnected(false);
            setUserAddress('');
          }
        } else {
          setIsConnected(false);
          setUserAddress('');
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setIsConnected(false);
        setUserAddress('');
      }
    };

    checkWalletConnection();

    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          setUserAddress(accounts[0]);
        } else {
          setIsConnected(false);
          setUserAddress('');
        }
      });
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        setUserAddress(accounts[0]);
      } else {
        alert('Please install MetaMask or another Ethereum wallet to use this feature.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Staking Interface
        </h2>
        <p className="mt-2 text-gray-600">
          Stake ETH to participate in the email system and earn rewards
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Wallet</h3>
          <p className="text-gray-500 mb-6">
            You need to connect your Ethereum wallet to access the staking interface.
          </p>
          <button
            onClick={connectWallet}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Connected Wallet
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {userAddress}
              </p>
            </div>
          </div>
          
          <StakingInterface />
        </div>
      )}
    </div>
  );
} 