import { ethers } from 'ethers';

// Minimal valid ABI for the EmailStorage contract
const EmailStorageABI = [
  "function sendEmail(address recipient, string ipfsHash) public returns (uint256)",
  "function getEmail(uint256 emailId) public view returns (address sender, address recipient, string ipfsHash, uint256 timestamp, bool isRead, bool isStarred, bool isDraft)",
  "function getUserEmails(address user) public view returns (uint256[])",
  "function updateEmailStatus(uint256 emailId, bool isRead, bool isStarred, bool isDraft) public",
  "function saveDraft(address recipient, string ipfsHash) public returns (uint256)",
  "function stakingContract() public view returns (address)",
  "function minStakeToSendEmail() public view returns (uint256)",
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

// Minimal valid ABI for the StakingContract
const StakingContractABI = [
  "function stake() external payable",
  "function unstake() external",
  "function claimReward() external",
  "function calculateReward(address staker) public view returns (uint256)",
  "function isValidStaker(address staker) external view returns (bool)",
  "function getStakeDetails(address staker) external view returns (uint256 amount, uint256 startTime, uint256 endTime, bool active, uint256 lastRewardClaim, uint256 currentReward)",
  "function minStakeAmount() public view returns (uint256)",
  "function stakingPeriod() public view returns (uint256)",
  "function rewardRate() public view returns (uint256)",
  "function totalStaked() public view returns (uint256)",
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "staker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "staker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Unstaked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "staker",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "name": "RewardClaimed",
    "type": "event"
  }
];

// Contract addresses - replace with your deployed contract addresses
const EMAIL_STORAGE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;

// Get EmailStorage contract instance
export const getEmailStorageContract = async () => {
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
    const contract = new ethers.Contract(EMAIL_STORAGE_ADDRESS, EmailStorageABI, signer);
    
    return { success: true, contract };
  } catch (error) {
    console.error('Error getting EmailStorage contract:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect to the blockchain'
    };
  }
};

// Get StakingContract instance
export const getStakingContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum wallet detected");
    }

    console.log("Initializing contract connection...");

    // Request account access if needed
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("Connected accounts:", accounts);
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect your wallet.");
    }

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log("Provider created");

    // Get network info
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);

    const signer = await provider.getSigner();
    console.log("Signer created");
    
    if (!signer) {
      throw new Error("Failed to get signer from provider");
    }
    
    // Verify we can get the signer's address
    const signerAddress = await signer.getAddress();
    console.log("Signer address:", signerAddress);
    
    if (!signerAddress) {
      throw new Error("Could not get signer address");
    }
    
    if (!process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS) {
      throw new Error("Staking contract address not configured");
    }
    
    console.log("Contract address:", process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS);
    
    // Create contract instance with signer
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS,
      StakingContractABI,
      signer
    );
    
    console.log("Contract instance created");
    
    // Verify the contract is properly initialized
    try {
      const minStake = await contract.minStakeAmount();
      console.log("Contract initialized successfully. Min stake:", minStake.toString());
    } catch (error) {
      console.error("Contract initialization test failed:", error);
      throw new Error("Failed to initialize contract. Please check the contract address.");
    }
    
    return { contract, signer };
  } catch (error) {
    console.error("Error getting staking contract:", error);
    throw error;
  }
};

// Connect wallet and show account selection modal
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // First check if we already have accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      // If we already have accounts, return the first one
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
      
      // If no accounts, request them (this will show the account selector modal)
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      return newAccounts[0];
    } catch (error) {
      // If the error is about a pending request, wait a bit and try again
      if (error.code === -32002) {
        console.log('Wallet request already pending, waiting...');
        // Wait for 2 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try again with eth_accounts first
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          
          if (accounts && accounts.length > 0) {
            return accounts[0];
          }
        } catch (innerError) {
          console.error('Error on retry:', innerError);
        }
      }
      
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