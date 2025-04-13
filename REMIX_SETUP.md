# Bmail Smart Contract Deployment Guide

This guide will walk you through deploying the Bmail EmailStorage smart contract using Remix Ethereum IDE, Ganache GUI for local blockchain, and MetaMask for wallet connection.

## Prerequisites

- [Ganache GUI](https://trufflesuite.com/ganache/) installed
- [MetaMask](https://metamask.io/download/) browser extension installed
- Internet browser with access to [Remix Ethereum IDE](https://remix.ethereum.org/)

## Setup Process

### 1. Start Ganache GUI

1. Launch Ganache GUI application
2. Create a new workspace or use the default "Quickstart" workspace
3. Note the RPC SERVER URL (typically `http://127.0.0.1:7545`)
4. Note the first account's address and private key (click the key icon next to an account to view the private key)

### 2. Configure MetaMask to Connect to Ganache

1. Open MetaMask in your browser
2. Click on the network dropdown at the top
3. Select "Add Network" and then "Add a network manually"
4. Fill in the following details:
   - Network Name: `Ganache Local`
   - New RPC URL: `http://127.0.0.1:7545` (from Ganache GUI)
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
5. Click "Save"
6. Switch to this new "Ganache Local" network

### 3. Import a Ganache Account to MetaMask

1. In MetaMask, click on your account icon in the top-right corner
2. Select "Import Account"
3. Select "Private Key" as the import method
4. Copy the private key from Ganache GUI (without the "0x" prefix)
5. Paste it into MetaMask and click "Import"
6. You should now see the account with 100 ETH balance

### 4. Deploy the Smart Contract Using Remix

1. Open [Remix Ethereum IDE](https://remix.ethereum.org/) in your browser
2. Create a new file in the contracts folder named `EmailStorage.sol`
3. Copy the entire EmailStorage contract code into this file
4. Compile the contract:
   - Go to the "Solidity Compiler" tab (2nd icon)
   - Select compiler version `0.8.0` or compatible
   - Click "Compile EmailStorage.sol"
5. Deploy the contract:
   - Go to the "Deploy & Run Transactions" tab (3rd icon)
   - In the "ENVIRONMENT" dropdown, select "Injected Provider - MetaMask"
   - MetaMask will prompt you to connect - approve this connection
   - Select "EmailStorage" from the "CONTRACT" dropdown
   - Click "Deploy"
   - Confirm the transaction in MetaMask
6. After deployment, note the contract address from the "Deployed Contracts" section

### 5. Interact with the Contract in Remix

1. The deployed contract will appear in the "Deployed Contracts" section
2. Expand it to see all available functions
3. Test basic functions:
   - Try sending an email using the `sendEmail` function
   - Try getting emails using the `getUserEmails` function
   - Try updating email status using the `updateEmailStatus` function

### 6. Configure the Frontend Application

1. Create a `.env.local` file in your project root with the following content:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=<your-deployed-contract-address>
   NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
   ```
2. Update the `contracts/EmailStorage.json` file with the ABI from Remix:
   - In Remix, go to the "Solidity Compiler" tab
   - Click the "ABI" button to copy the ABI
   - Create or update the `contracts/EmailStorage.json` file with:
   ```json
   {
     "abi": [paste-abi-here],
     "bytecode": ""
   }
   ```

### 7. Run the Frontend Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser to `http://localhost:3000`
3. Click "Connect Wallet" to connect to MetaMask
4. Approve the connection in MetaMask
5. You should now be connected and able to interact with the contract!

## Troubleshooting

- **MetaMask not connecting to Ganache**: Make sure Ganache is running and you've configured the correct RPC URL in MetaMask
- **MetaMask shows 0 ETH balance**: Make sure you've imported a Ganache account correctly and you're on the "Ganache Local" network
- **Contract functions failing**: Check that you're using the correct account in MetaMask and the contract is properly deployed
- **Network errors**: Ensure Ganache is running and your MetaMask is connected to the Ganache network

## Next Steps

After successfully deploying locally with Remix and Ganache:

1. Test all contract functions thoroughly
2. Consider deploying to a testnet (Sepolia, Goerli) for wider testing
3. Implement full frontend functionality with the deployed contract
4. Consider using truffle/hardhat for more advanced development needs
