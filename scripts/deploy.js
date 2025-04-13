// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  console.log("Deploying EmailStorage smart contract...");

  // We get the contract to deploy
  const EmailStorage = await hre.ethers.getContractFactory("EmailStorage");
  
  // Deploy with no constructor arguments
  const emailStorage = await EmailStorage.deploy();

  // Wait for the contract to be deployed
  await emailStorage.waitForDeployment();

  const address = await emailStorage.getAddress();
  
  console.log(`EmailStorage deployed to: ${address}`);
  console.log("Update your NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local with this address");
  
  // Verify contract on block explorer (for public networks only)
  if (hre.network.name !== "localhost" && 
      hre.network.name !== "hardhat" && 
      hre.network.name !== "ganache" &&
      hre.network.name !== "ganacheCLI") {
    
    console.log("Waiting for block confirmations...");
    
    // Wait for block confirmations
    await emailStorage.deploymentTransaction().wait(6);
    
    console.log("Verifying contract...");
    
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: []
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 