import { Buffer } from 'buffer';
import { encrypt, generateKey } from './encryption';

// Pinata IPFS configuration
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

// Encrypt content for IPFS storage
export const encryptContent = async (content, recipientPublicKey) => {
  try {
    // Generate a random encryption key for AES-256-GCM
    const encryptionKey = generateKey();
    
    // Encrypt the content with AES-256-GCM
    const encryptedContent = await encrypt(content, encryptionKey);
    
    // Encrypt the AES key with the recipient's public key
    const encryptedKey = encryptMessage(encryptionKey, recipientPublicKey);
    
    // Return the encrypted content and key
    return {
      encryptedContent,
      encryptionKey: encryptedKey
    };
  } catch (error) {
    console.error('Error encrypting content:', error);
    throw new Error('Failed to encrypt content');
  }
};

// Upload content to IPFS using Pinata API
export const uploadToIPFS = async (content, encryptionKey) => {
  try {
    // Convert content to JSON string if it's an object
    const contentString = typeof content === 'object' ? JSON.stringify(content) : content;
    
    // Create a FormData object to send the file
    const formData = new FormData();
    const file = new Blob([contentString], { type: 'application/json' });
    formData.append('file', file, 'email-content.json');
    
    // Set options for pinning
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: formData
    };
    
    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata API error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    return { 
      success: true, 
      hash: result.IpfsHash 
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to upload to IPFS' 
    };
  }
};

// Get content from IPFS using Pinata gateway
export const getFromIPFS = async (hash) => {
  try {
    // Use Pinata gateway to retrieve content
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { 
      success: true, 
      data 
    };
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to retrieve from IPFS' 
    };
  }
}; 