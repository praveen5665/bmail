import { ethers } from 'ethers';

// Minimal valid ABI for the EmailStorage contract
const EmailStorageABI = [
  "function sendEmail(address recipient, string ipfsHash) public returns (uint256)",
  "function getEmail(uint256 emailId) public view returns (address sender, address recipient, string ipfsHash, uint256 timestamp, bool isRead, bool isStarred, bool isDraft)",
  "function getUserEmails(address user) public view returns (uint256[])",
  "function updateEmailStatus(uint256 emailId, bool isRead, bool isStarred, bool isDraft) public",
  "function saveDraft(address recipient, string ipfsHash) public returns (uint256)",
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "emailId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "EmailSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "emailId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isRead",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isStarred",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isDraft",
        "type": "bool"
      }
    ],
    "name": "EmailStatusUpdated",
    "type": "event"
  }
];

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// Get contract instance
export const getContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, EmailStorageABI, signer);
    
    return { success: true, contract };
  } catch (error) {
    console.error('Error getting contract:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to the blockchain'
    };
  }
};

// Connect wallet and show account selection modal
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // First, disconnect any existing connections by clearing permissions
      // This will force MetaMask to show the account selection dialog
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      // After permissions are reset, request accounts again
      // This will show the account selector modal
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      return accounts[0];
    } catch (error) {
      console.error('Error connecting to wallet', error);
      throw error;
    }
  } else {
    // If no wallet is detected, return a mock address for testing
    const mockAddress = '0x' + '1'.repeat(40); // Mock address 0x1111...
    console.warn('No Ethereum wallet detected. Using mock address:', mockAddress);
    return mockAddress;
  }
}; 