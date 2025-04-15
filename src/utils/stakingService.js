import { getStakingContract } from './web3Config';
import { ethers } from 'ethers';

// Helper function to retry contract calls
const retryContractCall = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} to call contract function`);
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Log more details about the error
      if (error.code) {
        console.warn(`Error code: ${error.code}`);
      }
      if (error.data) {
        console.warn(`Error data: ${error.data}`);
      }
      
      if (i < maxRetries - 1) {
        console.log(`Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("All retry attempts failed:", lastError);
  throw lastError;
};

/**
 * Get staking details for the current user
 */
export const getStakingDetails = async (address) => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    const details = await contract.getStakeDetails(address);
    
    return {
      success: true,
      stakeDetails: {
        amount: details[0].toString(),
        startTime: details[1].toString(),
        endTime: details[2].toString(),
        active: details[3],
        lastRewardClaim: details[4].toString(),
        currentReward: details[5].toString()
      }
    };
  } catch (error) {
    console.error("Error getting staking details:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get staking parameters
 */
export const getStakingParameters = async () => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    // Call the functions to get the parameters
    const [minStakeAmount, stakingPeriod, rewardRate, totalStaked] = await Promise.all([
      contract.minStakeAmount(),
      contract.stakingPeriod(),
      contract.rewardRate(),
      contract.totalStaked()
    ]);
    
    return {
      success: true,
      parameters: {
        minStakeAmount: minStakeAmount.toString(),
        stakingPeriod: stakingPeriod.toString(),
        rewardRate: rewardRate.toString(),
        totalStaked: totalStaked.toString()
      }
    };
  } catch (error) {
    console.error("Error getting staking parameters:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Stake ETH
 */
export const stake = async (amount) => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    // Convert ETH amount to Wei
    const amountInWei = ethers.parseEther(amount.toString());
    
    const tx = await contract.stake({ value: amountInWei });
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error staking:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Unstake ETH
 */
export const unstake = async () => {
  try {
    console.log("Starting unstake process...");
    
    // Get contract instance with signer
    const { contract, signer } = await getStakingContract();
    console.log("Got contract and signer");
    
    if (!signer) {
      console.error("No signer found");
      return {
        success: false,
        error: "Could not get signer. Please reconnect your wallet."
      };
    }

    // Get the signer's address
    let signerAddress;
    try {
      signerAddress = await signer.getAddress();
      console.log("Got signer address:", signerAddress);
    } catch (error) {
      console.error("Error getting signer address:", error);
      return {
        success: false,
        error: "Could not get signer address. Please reconnect your wallet."
      };
    }

    if (!signerAddress) {
      console.error("Signer address is null");
      return {
        success: false,
        error: "Could not get signer address. Please reconnect your wallet."
      };
    }
    
    // Get stake details first
    console.log("Getting stake details for address:", signerAddress);
    const details = await contract.getStakeDetails(signerAddress);
    console.log("Stake details:", details);
    
    // Check if there's an active stake
    if (!details[3]) { // details[3] is the active flag
      console.log("No active stake found");
      return {
        success: false,
        error: "No active stake found. You need to stake first before unstaking."
      };
    }
    
    // Check if staking period has ended
    const currentTime = Math.floor(Date.now() / 1000);
    console.log("Current time:", currentTime);
    console.log("Stake end time:", Number(details[2]));
    
    if (currentTime < Number(details[2])) { // details[2] is the endTime
      const remainingTime = Number(details[2]) - currentTime;
      const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60));
      console.log("Staking period not ended. Remaining days:", remainingDays);
      return {
        success: false,
        error: `Staking period has not ended yet. You can unstake in ${remainingDays} days.`
      };
    }
    
    // If all checks pass, proceed with unstaking
    console.log("Proceeding with unstake...");
    const tx = await contract.unstake();
    console.log("Unstake transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Unstake transaction confirmed:", receipt.transactionHash);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error in unstake process:", error);
    
    // Handle specific error cases
    if (error.message.includes("No Ethereum wallet detected")) {
      return {
        success: false,
        error: "Please install MetaMask or another Ethereum wallet."
      };
    } else if (error.message.includes("No accounts found")) {
      return {
        success: false,
        error: "Please connect your wallet and try again."
      };
    } else if (error.message.includes("Staking contract address not configured")) {
      return {
        success: false,
        error: "Staking contract is not properly configured. Please contact support."
      };
    } else if (error.message.includes("Failed to get signer")) {
      return {
        success: false,
        error: "Please reconnect your wallet and try again."
      };
    } else if (error.message.includes("Failed to initialize contract")) {
      return {
        success: false,
        error: "Invalid contract address. Please contact support."
      };
    }
    
    return {
      success: false,
      error: error.message || "Failed to unstake. Please try again later.",
    };
  }
};

/**
 * Claim reward
 */
export const claimReward = async () => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    const tx = await contract.claimReward();
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
    };
  } catch (error) {
    console.error("Error claiming reward:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if user is a valid staker
 */
export const isValidStaker = async (address) => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    const isValid = await contract.isValidStaker(address);
    return isValid;
  } catch (error) {
    console.error("Error checking if user is a valid staker:", error);
    return false;
  }
};

/**
 * Calculate reward for a staker
 */
export const calculateReward = async (address) => {
  try {
    const { contract } = await retryContractCall(() => getStakingContract());
    
    const reward = await contract.calculateReward(address);
    
    return {
      success: true,
      reward: ethers.formatEther(reward),
    };
  } catch (error) {
    console.error("Error calculating reward:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}; 