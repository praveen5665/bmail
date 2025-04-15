import { ethers } from 'ethers';

// Check if contract is deployed at the specified address
export const checkContractDeployment = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum wallet detected");
    }

    // Create provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get network information
    const network = await provider.getNetwork();
    console.log("Connected to network:", network);
    
    // Check if the contract addresses are valid
    const contractAddresses = {
      emailStorage: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      staking: process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS
    };
    
    console.log("Contract addresses:", contractAddresses);
    
    // Check if the contracts are deployed
    const results = {};
    
    for (const [name, address] of Object.entries(contractAddresses)) {
      if (!address) {
        results[name] = { deployed: false, error: "Address not configured" };
        continue;
      }
      
      try {
        // Check if the address is valid
        if (!ethers.isAddress(address)) {
          results[name] = { deployed: false, error: "Invalid address format" };
          continue;
        }
        
        // Get the code at the address
        const code = await provider.getCode(address);
        
        // If the code is "0x" or "0x0", the contract is not deployed
        if (code === "0x" || code === "0x0") {
          results[name] = { deployed: false, error: "No code at address" };
        } else {
          results[name] = { deployed: true, codeLength: code.length };
        }
      } catch (error) {
        results[name] = { deployed: false, error: error.message };
      }
    }
    
    console.log("Contract deployment check results:", results);
    return results;
  } catch (error) {
    console.error("Error checking contract deployment:", error);
    return { error: error.message };
  }
}; 