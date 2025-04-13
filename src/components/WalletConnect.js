'use client';

import { useState, useEffect } from 'react';
import { connectWallet } from '../utils/web3Config';

export default function WalletConnect() {
  const [account, setAccount] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
        }
      });
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    
    try {
      // This will show MetaMask account selection modal
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (err) {
      console.error('Connection error:', err);
      setError('Failed to connect wallet. ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setAccount('');
    // There's no actual "disconnect" method in MetaMask, 
    // so we just clear our local state
  };

  const handleSwitchAccount = async () => {
    setConnecting(true);
    setError('');
    
    try {
      // This will force the account selection modal
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (err) {
      console.error('Account switch error:', err);
      setError('Failed to switch account. ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center justify-center">
      {!account ? (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            {formatAddress(account)}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleSwitchAccount}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Switch Account
            </button>
            <button 
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mt-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 