// This script is a placeholder for use with Hardhat
// You'll need to install and configure Hardhat before running this script

const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy StakingContract first
  const StakingContract = await ethers.getContractFactory("StakingContract");
  
  // Parameters for StakingContract
  const minStakeAmount = ethers.parseEther("0.01"); // 0.01 ETH minimum stake
  const stakingPeriod = 30 * 24 * 60 * 60; // 30 days in seconds
  const rewardRate = 500; // 5% annual reward rate (500 basis points)
  
  const stakingContract = await StakingContract.deploy(
    minStakeAmount,
    stakingPeriod,
    rewardRate
  );
  
  await stakingContract.waitForDeployment();
  const stakingContractAddress = await stakingContract.getAddress();
  
  console.log(`StakingContract deployed to: ${stakingContractAddress}`);
  
  // Deploy EmailStorage with reference to StakingContract
  const EmailStorage = await ethers.getContractFactory("EmailStorage");
  
  // Parameters for EmailStorage
  const minStakeToSendEmail = ethers.parseEther("0.005"); // 0.005 ETH minimum stake to send email
  
  const emailStorage = await EmailStorage.deploy(
    stakingContractAddress,
    minStakeToSendEmail
  );
  
  await emailStorage.waitForDeployment();
  const emailStorageAddress = await emailStorage.getAddress();
  
  console.log(`EmailStorage deployed to: ${emailStorageAddress}`);
  
  // Log deployment information
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`StakingContract: ${stakingContractAddress}`);
  console.log(`EmailStorage: ${emailStorageAddress}`);
  console.log(`Min Stake Amount: ${ethers.formatEther(minStakeAmount)} ETH`);
  console.log(`Staking Period: ${stakingPeriod / (24 * 60 * 60)} days`);
  console.log(`Reward Rate: ${rewardRate / 100}%`);
  console.log(`Min Stake to Send Email: ${ethers.formatEther(minStakeToSendEmail)} ETH`);
  
  // Verify the contract on Etherscan (if on a public network)
  if (ethers.network.name !== "localhost" && ethers.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await emailStorage.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    
    try {
      await ethers.run("verify:verify", {
        address: emailStorageAddress,
        constructorArguments: [stakingContractAddress, minStakeToSendEmail]
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 