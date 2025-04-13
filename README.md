# Bmail - Blockchain Email System

Bmail is a decentralized email platform built on Ethereum blockchain that provides secure, censorship-resistant communication with encrypted content storage on IPFS.

## Features

- **Decentralized Architecture**: No central authority controls your emails
- **Blockchain Security**: Messages are recorded on Ethereum blockchain for immutability
- **End-to-End Encryption**: Email content is encrypted and stored on IPFS
- **Wallet-Based Identity**: Use your Ethereum wallet as your email identity
- **Traditional Email Features**: Send, receive, star messages, and save drafts

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Blockchain**: Ethereum, Solidity Smart Contracts
- **Storage**: IPFS/Pinata for encrypted content storage
- **Web3 Integration**: Ethers.js, Web3Modal

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask or other Ethereum wallet browser extension
- Ethereum test network tokens (Sepolia)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd bmail
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
   NEXT_PUBLIC_INFURA_IPFS_PROJECT_ID=<your-infura-ipfs-project-id>
   NEXT_PUBLIC_INFURA_IPFS_PROJECT_SECRET=<your-infura-ipfs-project-secret>
   NEXT_PUBLIC_PINATA_API_KEY=<your-pinata-api-key>
   NEXT_PUBLIC_PINATA_API_SECRET=<your-pinata-api-secret>
   NEXT_PUBLIC_RPC_URL=<ethereum-rpc-url>
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Smart Contract Deployment

To deploy the smart contract:

1. Install Hardhat:

   ```
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. Configure Hardhat:

   ```
   npx hardhat init
   ```

3. Deploy the contract:

   ```
   npm run deploy
   ```

4. Update the contract address in your `.env.local` file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
