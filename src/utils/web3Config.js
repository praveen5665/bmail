import { ethers } from 'ethers';

// Minimal valid ABI for the EmailStorage contract
const EmailStorageABI = [
  "function sendEmail(address recipient, string ipfsHash) public returns (uint256)",
  "function getEmail(uint256 emailId) public view returns (address sender, address recipient, string ipfsHash, uint256 timestamp, bool isRead, bool isStarred, bool isDraft)",
  "function getUserEmails(address user) public view returns (uint256[])",
  "function markAsRead(uint256 emailId) public",
  "function toggleStar(uint256 emailId) public",
  "function saveAsDraft(address recipient, string ipfsHash) public returns (uint256)",
  "function updateDraft(uint256 emailId, string ipfsHash) public",
  "function deleteDraft(uint256 emailId) public",
  "event EmailSent(uint256 indexed emailId, address indexed sender, address indexed recipient, string ipfsHash, uint256 timestamp)",
  "event EmailRead(uint256 indexed emailId)",
  "event EmailStarred(uint256 indexed emailId, bool starred)",
  "event DraftSaved(uint256 indexed emailId, address indexed sender, address indexed recipient, string ipfsHash, uint256 timestamp)",
  "event DraftUpdated(uint256 indexed emailId, string ipfsHash)",
  "event DraftDeleted(uint256 indexed emailId)"
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