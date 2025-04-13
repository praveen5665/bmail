# Bmail Setup Guide

This guide will help you set up the Bmail project for local development, focusing on the smart contract integration.

## Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Basic knowledge of Ethereum and smart contracts

## Getting Started

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Compile the smart contract**:

   ```bash
   npm run compile
   ```

3. **Generate the contract ABI for frontend**:

   ```bash
   npm run generate-abi
   ```

   Or run both steps at once:

   ```bash
   npm run setup
   ```

## Local Blockchain Development

### Option 1: Using Ganache CLI (Built-in)

1. **Start the local Ganache blockchain**:

   ```bash
   npm run ganache
   ```

   This will start a local blockchain on `http://127.0.0.1:8545` with 10 pre-funded accounts.

2. **Deploy the contract to the local blockchain**:

   ```bash
   npm run deploy:ganache
   ```

3. **Update your environment variables**:
   Copy the contract address from the deployment output and add it to your `.env.local` file:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
   NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
   ```

### Option 2: Using Ganache GUI

1. **Download and install Ganache**: https://trufflesuite.com/ganache/

2. **Launch Ganache GUI** and create a new workspace

3. **Configure Hardhat**:
   The default configuration already includes settings for Ganache GUI (running on port 7545).

4. **Deploy the contract**:
   ```bash
   npx hardhat run scripts/deploy.js --network ganache
   ```

## Connect MetaMask to Local Blockchain

1. **Open MetaMask** in your browser

2. **Add a new network** with the following details:

   - Network Name: Ganache Local
   - RPC URL: http://127.0.0.1:8545 (or 7545 for Ganache GUI)
   - Chain ID: 1337
   - Currency Symbol: ETH

3. **Import a test account**:
   - In MetaMask, click "Import Account"
   - Paste a private key from your Ganache instance
   - If using CLI, the private keys are displayed in the console when you start Ganache
   - If using GUI, click the key icon next to any account to copy its private key

## Run the Frontend

Start the Next.js development server:

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to interact with the application.

## Testing the Smart Contract

Run the test suite to verify the contract functionality:

```bash
npm test
```

## Notes for Production Deployment

For production deployment, you should:

1. **Deploy to a testnet first**:

   ```bash
   npm run deploy
   ```

   This will deploy to the Sepolia testnet (requires configuration of private keys).

2. **Configure environment variables** for production with proper IPFS/Pinata credentials

3. **Enable proper security measures** for handling private keys and sensitive data
