const ganache = require("ganache");
const fs = require("fs");

// Define server options
const serverOptions = {
  wallet: {
    mnemonic: "test test test test test test test test test test test junk",
    totalAccounts: 10
  },
  logging: {
    quiet: false
  },
  chain: {
    chainId: 1337,
    networkId: 1337,
    hardfork: "london",
    vmErrorsOnRPCResponse: true
  },
  miner: {
    blockTime: 0,
    defaultGasPrice: 20000000000
  }
};

// Create a server
const server = ganache.server(serverOptions);

// Start the server
server.listen(8545, async (err) => {
  if (err) {
    console.error(err);
    return;
  }
  
  console.log("Ganache started on port 8545");
  
  // Get provider for interacting with the blockchain
  const provider = server.provider;
  
  // Get accounts
  const accounts = await provider.request({ method: "eth_accounts", params: [] });
  
  console.log("Available Accounts:");
  accounts.forEach((account, i) => {
    console.log(`(${i}) ${account} (100 ETH)`);
  });
  
  console.log("\nPrivate Keys:");
  const privateKeys = await provider.request({ method: "eth_private_keys", params: [] });
  Object.entries(privateKeys).forEach(([address, privateKey], i) => {
    console.log(`(${i}) ${privateKey} (for ${address})`);
  });
  
  console.log("\nMnemonic: test test test test test test test test test test test junk");
  console.log("\nRPC URL: http://127.0.0.1:8545");
  console.log("Chain ID: 1337");
  
  // Optional: Save accounts info to a file for reference
  const accountsInfo = {
    mnemonic: "test test test test test test test test test test test junk",
    accounts: accounts,
    privateKeys: privateKeys,
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 1337
  };
  
  fs.writeFileSync("ganache-accounts.json", JSON.stringify(accountsInfo, null, 2));
  console.log("\nAccount info saved to ganache-accounts.json");
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Shutting down Ganache...');
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    console.log('Ganache stopped');
    process.exit(0);
  });
}); 