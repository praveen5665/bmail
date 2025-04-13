const fs = require('fs');
const path = require('path');

// Run this script after compiling the contract to extract the ABI
async function main() {
  try {
    // Make sure contracts are compiled first
    if (!fs.existsSync('./artifacts/contracts/EmailStorage.sol/EmailStorage.json')) {
      console.error('Contract artifacts not found. Please compile the contracts first with: npm run compile');
      process.exit(1);
    }

    // Read the compiled contract artifacts
    const artifactPath = path.resolve('./artifacts/contracts/EmailStorage.sol/EmailStorage.json');
    const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Extract ABI and bytecode
    const abi = contractArtifact.abi;
    const bytecode = contractArtifact.bytecode;

    // Create the contract JSON file that the frontend will use
    const contractJSON = {
      abi,
      bytecode
    };

    // Create the contracts directory if it doesn't exist
    if (!fs.existsSync('./contracts')) {
      fs.mkdirSync('./contracts');
    }

    // Write to file
    fs.writeFileSync(
      './contracts/EmailStorage.json',
      JSON.stringify(contractJSON, null, 2)
    );

    console.log('Contract ABI generated successfully at contracts/EmailStorage.json');
  } catch (error) {
    console.error('Error generating ABI:', error);
    process.exit(1);
  }
}

main(); 