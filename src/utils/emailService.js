import { getContract } from './web3Config';
import { encryptContent, uploadToIPFS, getFromIPFS } from './ipfsService';
import { decryptMessage as decryptWithPrivateKey, getPrivateKey, getPublicKey } from './cryptoUtils';
import { ethers } from 'ethers';

// Send an email - browser-friendly implementation
export const sendEmail = async (recipientEmail, emailContent) => {
  try {
    // 0. Get recipient's public key and address
    const recipientPublicKey = await getPublicKey(recipientEmail);
    
    if (!recipientPublicKey) {
      throw new Error(`Recipient ${recipientEmail} public key not found`);
    }
    
    // Get recipient's Ethereum address from the API
    const response = await fetch(`/api/users/ethAddress?email=${encodeURIComponent(recipientEmail)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to retrieve recipient data for ${recipientEmail}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.ethAddress) {
      throw new Error(`Recipient ${recipientEmail} wallet address not found`);
    }
    
    const recipientAddress = data.ethAddress;
    
    // 1. Encrypt the email content with recipient's public key
    const { encryptedContent, encryptionKey } = await encryptContent(emailContent, recipientPublicKey);
    
    // 2. Upload to IPFS and get hash
    const ipfsResult = await uploadToIPFS(encryptedContent, encryptionKey);
    
    if (!ipfsResult.success) {
      throw new Error(`Failed to upload to IPFS: ${ipfsResult.error}`);
    }
    
    const ipfsHash = ipfsResult.hash;
    
    // 3. Send the email via smart contract
    const contractResult = await getContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    
    // For the contract call we use the recipient's Ethereum address
    const tx = await contract.sendEmail(recipientAddress, ipfsHash);
    
    // 4. Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // 5. Extract email ID from event or use transaction hash as fallback
    let emailId = null;
    
    // Check if receipt has logs (events)
    if (receipt.logs && receipt.logs.length > 0) {
      // Try to find the EmailSent event
      const event = receipt.logs.find(log => {
        // Check if this log is for the EmailSent event
        // The first topic is the event signature hash
        return log.topics && log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes("EmailSent(address,uint256,string)"));
      });
      
      if (event) {
        // Decode the event data
        const decodedEvent = contract.interface.parseLog(event);
        emailId = decodedEvent.args.emailId.toString();
      }
    }
    
    // If we couldn't find the event, use the transaction hash as a fallback
    if (!emailId) {
      console.warn('Could not find EmailSent event in transaction receipt, using transaction hash as fallback');
      emailId = receipt.hash;
    }
    
    return { success: true, emailId, ipfsHash, txHash: receipt.hash };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Save email as draft
export const saveDraft = async (recipientEmail, emailContent) => {
  try {
    // 0. Get recipient's public key and address
    const recipientPublicKey = await getPublicKey(recipientEmail);
    
    if (!recipientPublicKey) {
      throw new Error(`Recipient ${recipientEmail} public key not found`);
    }
    
    // Get recipient's Ethereum address from the API
    const response = await fetch(`/api/users/ethAddress?email=${encodeURIComponent(recipientEmail)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to retrieve recipient data for ${recipientEmail}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.ethAddress) {
      throw new Error(`Recipient ${recipientEmail} wallet address not found`);
    }
    
    const recipientAddress = data.ethAddress;
    
    // 1. Encrypt the content with recipient's public key
    const { encryptedContent, encryptionKey } = await encryptContent(emailContent, recipientPublicKey);
    
    // 2. Upload to IPFS
    const ipfsResult = await uploadToIPFS(encryptedContent, encryptionKey);
    
    if (!ipfsResult.success) {
      throw new Error(`Failed to upload to IPFS: ${ipfsResult.error}`);
    }
    
    const ipfsHash = ipfsResult.hash;
    
    // 3. Save the draft via smart contract
    const contractResult = await getContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    const tx = await contract.saveAsDraft(recipientAddress, ipfsHash);
    
    // 4. Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // 5. Extract email ID from event or use transaction hash as fallback
    let emailId = null;
    
    // Check if receipt has logs (events)
    if (receipt.logs && receipt.logs.length > 0) {
      // Try to find the DraftSaved event
      const event = receipt.logs.find(log => {
        // Check if this log is for the DraftSaved event
        return log.topics && log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes("DraftSaved(address,uint256,string)"));
      });
      
      if (event) {
        // Decode the event data
        const decodedEvent = contract.interface.parseLog(event);
        emailId = decodedEvent.args.emailId.toString();
      }
    }
    
    // If we couldn't find the event, use the transaction hash as a fallback
    if (!emailId) {
      console.warn('Could not find DraftSaved event in transaction receipt, using transaction hash as fallback');
      emailId = receipt.hash;
    }
    
    return { success: true, emailId, ipfsHash, txHash: receipt.hash };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false, error: error.message };
  }
};

// Update email status (read, starred, draft)
export const updateEmailStatus = async (emailId, isRead, isStarred, isDraft) => {
  try {
    const contractResult = await getContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    
    // Convert emailId to BigInt
    const bigIntEmailId = typeof emailId === 'bigint' ? emailId : BigInt(emailId);
    
    // Call the appropriate contract functions based on the status
    if (isRead) {
      const tx = await contract.markAsRead(bigIntEmailId);
      await tx.wait();
    }
    
    if (isStarred !== undefined) {
      const tx = await contract.toggleStar(bigIntEmailId);
      await tx.wait();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating email status:', error);
    return { success: false, error: error.message };
  }
};

// Get all emails for a user
export const getUserEmails = async (userAddress) => {
  try {
    const contractResult = await getContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    const rawEmailIds = await contract.getUserEmails(userAddress);
    
    // Convert BigInt values to regular numbers
    const emailIds = rawEmailIds.map(id => Number(id));
    
    return { success: true, emailIds };
  } catch (error) {
    console.error('Error getting user emails:', error);
    return { success: false, error: error.message };
  }
};

// Get details of a specific email
export const getEmailDetails = async (emailId) => {
  try {
    if (emailId === undefined || emailId === null) {
      console.error('Invalid email ID provided:', emailId);
      return { success: false, error: 'Email ID is required' };
    }
    
    const contractResult = await getContract();
    
    if (!contractResult.success) {
      console.error('Failed to get contract instance:', contractResult.error);
      return { success: false, error: 'Contract not available' };
    }
    
    const contract = contractResult.contract;
    
    // Verify we got a valid contract instance
    if (!contract || typeof contract.getEmail !== 'function') {
      console.error('Invalid contract instance or missing getEmail function');
      return { success: false, error: 'Contract not properly initialized' };
    }
    
    // Convert emailId to BigInt if it's a string or number
    const bigIntEmailId = typeof emailId === 'bigint' ? emailId : BigInt(emailId);
    
    // Get email details from contract
    const emailDetails = await contract.getEmail(bigIntEmailId);
    
    if (!emailDetails) {
      console.error('No email found for ID:', emailId);
      return { success: false, error: 'Email not found' };
    }
    
    // Convert BigInt values to regular numbers/strings where needed
    const email = {
      id: Number(bigIntEmailId),
      sender: emailDetails[0],
      recipient: emailDetails[1],
      ipfsHash: emailDetails[2],
      timestamp: new Date(Number(emailDetails[3]) * 1000), // Convert BigInt to number for timestamp
      isRead: emailDetails[4],
      isStarred: emailDetails[5],
      isDraft: emailDetails[6],
    };
    
    return { success: true, email };
  } catch (error) {
    console.error('Error getting email details:', error);
    return { success: false, error: error.message };
  }
};

// Get all emails for a user with their content
export const getUserEmailsWithContent = async (userAddress) => {
  try {
    if (!userAddress) {
      console.error('No user address provided');
      return { success: false, error: 'User address is required' };
    }

    const contractResult = await getContract();
    
    if (!contractResult.success) {
      console.error('Failed to get contract instance:', contractResult.error);
      return { success: false, error: 'Contract not available' };
    }
    
    const contract = contractResult.contract;
    
    // Get all email IDs for the user
    const emailIds = await contract.getUserEmails(userAddress);
    
    if (!emailIds || !Array.isArray(emailIds)) {
      console.error('Invalid email IDs returned from contract');
      return { success: false, error: 'Failed to get email IDs' };
    }
    
    // Convert BigInt values to regular numbers
    const numericEmailIds = emailIds.map(id => Number(id));
    
    // Get details for each email
    const emails = [];
    for (const emailId of numericEmailIds) {
      try {
        // Get email details from blockchain
        const { success, email, error } = await getEmailDetails(emailId);
        
        if (!success) {
          console.warn(`Failed to get details for email ${emailId}:`, error);
          continue;
        }
        
        // Get content from IPFS
        const { success: ipfsSuccess, data: encryptedContent, error: ipfsError } = await getFromIPFS(email.ipfsHash);
        
        if (!ipfsSuccess || !encryptedContent) {
          console.warn(`Failed to get content from IPFS for email ${emailId}:`, ipfsError);
          email.decryptedContent = null;
          email.decryptionError = ipfsError || 'Failed to retrieve content from IPFS';
          emails.push(email);
          continue;
        }
        
        // Decrypt the content
        const { success: decryptSuccess, content: decryptedContent, error: decryptError } = await decryptEmailContent(encryptedContent);
        
        if (!decryptSuccess) {
          console.warn(`Failed to decrypt content for email ${emailId}:`, decryptError);
          email.decryptedContent = null;
          email.decryptionError = decryptError || 'Failed to decrypt content';
        } else {
          email.decryptedContent = decryptedContent;
          email.decryptionError = null;
        }
        
        emails.push(email);
      } catch (emailError) {
        console.warn(`Error processing email ${emailId}:`, emailError);
        // Continue with next email
        continue;
      }
    }
    
    return { success: true, emails };
  } catch (error) {
    console.error('Error getting user emails with content:', error);
    return { success: false, error: error.message };
  }
};

// Decrypt email content using the user's private key
async function decryptEmailContent(encryptedContentJSON) {
  try {
    // Get user email from localStorage
    const userEmail = localStorage.getItem('bmail_user_email');
    if (!userEmail) {
      throw new Error('User not authenticated');
    }

    // Get private key
    const privateKey = await getPrivateKey(userEmail);
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    // Parse the encrypted content
    let encryptedData;
    try {
      encryptedData = typeof encryptedContentJSON === 'string' 
        ? JSON.parse(encryptedContentJSON)
        : encryptedContentJSON;
    } catch (error) {
      throw new Error('Invalid encrypted content format');
    }

    // Check which encryption format is used
    if (encryptedData.encrypted && encryptedData.iv && encryptedData.authTag) {
      // New format (AES-256-GCM)
      const { decrypt } = await import('./encryption');
      const decryptedContent = await decrypt(encryptedData, privateKey);
      return {
        success: true,
        content: decryptedContent
      };
    } else if (encryptedData.encryptedContent && encryptedData.encryptedKey) {
      // Old format (RSA + AES hybrid)
      const decryptedContent = await decryptWithPrivateKey(encryptedData, privateKey);
      return {
        success: true,
        content: decryptedContent
      };
    } else {
      throw new Error('Invalid encryption format');
    }
  } catch (error) {
    console.error('Error decrypting email content:', error);
    return {
      success: false,
      error: error.message || 'Failed to decrypt email content'
    };
  }
}

// Get details of a specific email with decrypted content
export const getEmailDetailsWithDecryption = async (emailId) => {
  try {
    // 1. Get email details from blockchain
    const { success, email, error } = await getEmailDetails(emailId);
    
    if (!success) {
      throw new Error(error);
    }
    
    // 2. Retrieve email content from IPFS
    try {
      const ipfsResult = await getFromIPFS(email.ipfsHash);
      
      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'Failed to retrieve content from IPFS');
      }
      
      // 3. Decrypt the content using the user's private key
      const decryptionResult = await decryptEmailContent(ipfsResult.data);
      
      if (!decryptionResult.success) {
        email.decryptedContent = null;
        email.decryptionError = decryptionResult.error;
      } else {
        email.decryptedContent = decryptionResult.content;
        email.decryptionError = null;
      }
    } catch (decryptionError) {
      console.warn('Could not decrypt email content:', decryptionError);
      email.decryptedContent = null;
      email.decryptionError = decryptionError.message;
    }
    
    return { success: true, email };
  } catch (error) {
    console.error('Error fetching email with decryption:', error);
    return { success: false, error: error.message };
  }
}; 