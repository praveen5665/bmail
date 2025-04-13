// This script is a placeholder for use with Hardhat
// You'll need to install and configure Hardhat before running this script

const hre = require("hardhat");

async function main() {
  console.log("Deploying EmailStorage smart contract...");

  // We get the contract factory
  const EmailStorage = await hre.ethers.getContractFactory("EmailStorage");
  
  // Deploy the contract
  const emailStorage = await EmailStorage.deploy();
  
  // Wait for deployment to complete
  await emailStorage.waitForDeployment();
  
  const address = await emailStorage.getAddress();
  
  console.log(`EmailStorage deployed to: ${address}`);
  console.log("Update your NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local with this address");
  
  // Verify the contract on Etherscan (if on a public network)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await emailStorage.deploymentTransaction().wait(6);
    
    console.log("Verifying contract on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: []
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