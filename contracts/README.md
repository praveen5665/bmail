# Decentralized Email Storage Smart Contract

This smart contract provides the core functionality for a decentralized email system built on Ethereum blockchain.

## Purpose

The `EmailStorage` contract enables users to:

1. Send encrypted emails with content stored on IPFS/Pinata
2. Save email drafts
3. Mark emails as read or starred
4. Retrieve their email history

## Contract Structure

### Email Data Structure

- `sender`: Ethereum address of the sender
- `recipient`: Ethereum address of the recipient
- `ipfsHash`: Hash pointing to the encrypted email content on IPFS/Pinata
- `timestamp`: When the email was sent
- `isRead`: Whether the email has been read
- `isStarred`: Whether the email has been starred
- `isDraft`: Whether the email is a draft

### Main Functions

1. `sendEmail`: Sends an email to a recipient
2. `saveDraft`: Saves an email as a draft
3. `updateEmailStatus`: Updates email status (read, starred, draft)
4. `getUserEmails`: Gets all email IDs associated with a user
5. `getEmail`: Retrieves full details of a specific email

## Security Features

- Emails are encrypted and stored on IPFS, not on the blockchain
- Only the IPFS hash is stored on-chain
- Only sender and recipient can access email metadata
- Only sender and recipient can update email status

## Integration with Next.js Frontend

This contract serves as the backend for the decentralized email application. The Next.js frontend will interact with this contract through Web3 libraries to provide a user-friendly email interface.
