import { getEmailStorageContract } from './web3Config';
import { uploadToIPFS, getFromIPFS } from './ipfsService';
import { ethers } from 'ethers';
import { isValidStaker } from './stakingService';

// Send email
export const sendEmail = async (recipientEmail, subject, content) => {
  try {
    // Upload content to IPFS (plain data, no encryption)
    const ipfsResult = await uploadToIPFS({
      subject,
      content,
      timestamp: Date.now()
    });

    if (!ipfsResult || !ipfsResult.success) {
      throw new Error(`Failed to upload to IPFS: ${ipfsResult?.error || 'Unknown error'}`);
    }

    // Get contract instance
    const contractResult = await getEmailStorageContract();
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    const contract = contractResult.contract;
    
    // Get recipient's Ethereum address
    let recipientAddress;
    try {
      // Try to get the address from the API
      const response = await fetch(`/api/users/ethAddress?email=${encodeURIComponent(recipientEmail)}`);
      if (response.ok) {
        const data = await response.json();
        recipientAddress = data.ethAddress;
      } else {
        throw new Error(`Failed to get recipient address for ${recipientEmail}`);
      }
    } catch (error) {
      console.error('Error getting recipient address:', error);
      throw new Error(`Could not find recipient address: ${error.message}`);
    }
    
    // Send email via smart contract
    const tx = await contract.sendEmail(
      recipientAddress,
      ipfsResult.hash
    );
    
    const receipt = await tx.wait();
    console.log('Transaction receipt:', receipt);
    
    // Get emailId from the receipt
    let emailId;
    
      // Try to find the EmailSent event
    const emailSentEvent = receipt.logs.find(log => {
      try {
        const parsedLog = contract.interface.parseLog(log);
        return parsedLog && parsedLog.name === 'EmailSent';
      } catch (e) {
        return false;
      }
    });
    
    if (emailSentEvent) {
      try {
        const parsedLog = contract.interface.parseLog(emailSentEvent);
        emailId = parsedLog.args.emailId.toString();
        console.log('Found emailId from EmailSent event:', emailId);
      } catch (e) {
        console.error('Error parsing EmailSent event:', e);
      }
    }
    
    // If we couldn't get the emailId from the event, use a fallback
    if (!emailId) {
      // Fallback: Get the latest email ID for the recipient
      console.log('No EmailSent event found, getting latest email ID for recipient');
      const emailIds = await contract.getUserEmails(recipientAddress);
      if (emailIds && emailIds.length > 0) {
        // Get the latest email ID (assuming they're ordered by ID)
        emailId = emailIds[emailIds.length - 1].toString();
        console.log('Found emailId from getUserEmails:', emailId);
      } else {
        console.warn('No email IDs found for recipient');
        emailId = 'unknown';
      }
    }
    
    return {
      success: true,
      emailId,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Save email as draft
export const saveDraft = async (recipientEmail, emailContent) => {
  try {
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
    
    // Upload content to IPFS
    const ipfsResult = await uploadToIPFS(emailContent);
    
    if (!ipfsResult.success) {
      throw new Error(`Failed to upload to IPFS: ${ipfsResult.error}`);
    }
    
    const ipfsHash = ipfsResult.hash;
    
    // Save the draft via smart contract
    const contractResult = await getEmailStorageContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    const tx = await contract.saveDraft(recipientAddress, ipfsHash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Extract email ID from event
    const event = receipt.events?.find(e => e.event === 'EmailSent');
    const emailId = event ? event.args.emailId.toString() : null;
    
    return {
      success: true,
      emailId,
      txHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update email status (read, starred, draft)
export const updateEmailStatus = async (emailId, isRead, isStarred, isDraft) => {
  try {
    const contractResult = await getEmailStorageContract();
    
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    
    const contract = contractResult.contract;
    
    // Convert emailId to BigInt
    const bigIntEmailId = typeof emailId === 'bigint' ? emailId : BigInt(emailId);
    
    // Call the contract function to update email status
    const tx = await contract.updateEmailStatus(bigIntEmailId, isRead, isStarred, isDraft);
      await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating email status:', error);
    return { success: false, error: error.message };
  }
};

// Get all emails for a user
export const getUserEmails = async (userAddress) => {
  try {
    const contractResult = await getEmailStorageContract();
    
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
    
    const contractResult = await getEmailStorageContract();
    
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
    const [
      sender,
      recipient,
      ipfsHash,
      timestamp,
      isRead,
      isStarred,
      isDraft
    ] = await contract.getEmail(bigIntEmailId);
    
    if (!ipfsHash) {
      console.error('No email found for ID:', emailId);
      return { success: false, error: 'Email not found' };
    }
    
    // Convert BigInt values to regular numbers/strings where needed
    const email = {
      id: Number(bigIntEmailId),
      sender,
      recipient,
      ipfsHash,
      timestamp: new Date(Number(timestamp) * 1000), // Convert BigInt to number for timestamp
      isRead,
      isStarred,
      isDraft,
    };
    
    return { success: true, email };
  } catch (error) {
    console.error('Error getting email details:', error);
    return { success: false, error: error.message };
  }
};

// Get user's emails with content
export const getUserEmailsWithContent = async (userEmailOrAddress) => {
  try {
    console.log('getUserEmailsWithContent called with:', userEmailOrAddress);

    // Get contract instance
    const contractResult = await getEmailStorageContract();
    if (!contractResult.success) {
      console.error('Failed to get contract instance:', contractResult.error);
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    const contract = contractResult.contract;
    console.log('Contract instance obtained successfully');
    
    // Determine if we have an email or an address
    let userAddress;
    
    // Check if it's an email (contains @) or an address (starts with 0x)
    if (userEmailOrAddress.includes('@')) {
      console.log('Input is an email, trying to get address from localStorage');
      // It's an email, try to get the address from localStorage
      userAddress = localStorage.getItem('bmail_user_address');
      console.log('Address from localStorage:', userAddress);
      
      // If not in localStorage, try to get it from the API
      if (!userAddress) {
        console.log('Address not found in localStorage, trying API');
        try {
          const response = await fetch(`/api/users/ethAddress?email=${encodeURIComponent(userEmailOrAddress)}`);
          if (response.ok) {
            const data = await response.json();
            userAddress = data.ethAddress;
            console.log('Address from API:', userAddress);
          } else {
            console.warn('API request failed:', response.status);
          }
        } catch (error) {
          console.warn('Failed to get address from API:', error);
        }
      }
    } else {
      // It's already an address
      console.log('Input is already an address');
      userAddress = userEmailOrAddress;
    }
    
    // If we still don't have an address, try to get it from localStorage
    if (!userAddress) {
      console.log('Still no address, trying localStorage again');
      userAddress = localStorage.getItem('bmail_user_address');
      console.log('Address from localStorage (second attempt):', userAddress);
    }
    
    if (!userAddress) {
      console.error('No user address found after all attempts');
      throw new Error('User address not found. Please reconnect your wallet.');
    }
    
    console.log('Using address for getUserEmails:', userAddress);
    
    // Get email IDs for the user
    console.log('Calling contract.getUserEmails...');
    const emailIds = await contract.getUserEmails(userAddress);
    console.log('Email IDs retrieved:', emailIds);
    
    // Sort email IDs in descending order (newest first)
    const sortedEmailIds = emailIds.map(id => id.toString()).sort((a, b) => b - a);
    console.log('Sorted email IDs:', sortedEmailIds);
    
    // Get details for each email
    console.log('Starting to fetch details for each email...');
    const emails = await Promise.all(
      sortedEmailIds.map(async (emailId) => {
        try {
          console.log('Fetching details for email ID:', emailId);
          const [
            sender,
            recipient,
            ipfsHash,
            timestamp,
            isRead,
            isStarred,
            isDraft
          ] = await contract.getEmail(emailId);
          console.log('Email details:', {
            sender,
            recipient,
            ipfsHash,
            timestamp,
            isRead,
            isStarred,
            isDraft
          });
          
          console.log('Fetching IPFS content for hash:', ipfsHash);
          const ipfsContent = await getFromIPFS(ipfsHash);
          console.log('IPFS content:', ipfsContent);
          
          // Return the plain content without decryption
          return {
            id: emailId,
            from: sender,
            to: recipient,
            timestamp: timestamp.toString(),
            content: ipfsContent.content,
            isRead,
            isStarred,
            isDraft
          };
        } catch (error) {
          console.warn(`Failed to fetch email ${emailId}:`, error);
          return {
            id: emailId,
            error: 'Failed to fetch email content'
          };
        }
      })
    );
    
    console.log('All emails processed, returning results');
    return {
      success: true,
      emails
    };
  } catch (error) {
    console.error('Error getting user emails with content:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get email details with content
export const getEmailDetailsWithContent = async (emailId) => {
  try {
    // Get contract instance
    const contractResult = await getEmailStorageContract();
    if (!contractResult.success) {
      throw new Error(`Failed to get contract instance: ${contractResult.error}`);
    }
    const contract = contractResult.contract;
    
    // Get email details from contract
    const [
      sender,
      recipient,
      ipfsHash,
      timestamp,
      isRead,
      isStarred,
      isDraft
    ] = await contract.getEmail(emailId);
    
    // Check if we have a valid IPFS hash
    if (!ipfsHash) {
      console.error('Unexpected email structure: missing IPFS hash');
      throw new Error('Email data structure is not as expected');
    }
    
    // Get content from IPFS
    const ipfsContent = await getFromIPFS(ipfsHash);
    
    // Check if ipfsContent has the expected structure
    if (!ipfsContent || !ipfsContent.content) {
      console.error('Unexpected IPFS content structure:', ipfsContent);
      throw new Error('IPFS content structure is not as expected');
    }
    
      return {
        success: true,
      email: {
        id: emailId,
        from: sender,
        to: recipient,
        timestamp: timestamp.toString(),
        content: ipfsContent.content,
        isRead,
        isStarred,
        isDraft
      }
    };
  } catch (error) {
    console.error('Error getting email details:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 