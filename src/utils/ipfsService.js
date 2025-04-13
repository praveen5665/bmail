import { Buffer } from 'buffer';

// Upload content to IPFS using Pinata API
export const uploadToIPFS = async (data) => {
  try {
    console.log('Uploading content to IPFS:', data);
    
    // Convert data to string if it's an object
    const content = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([content], { type: 'application/json' }));
    
    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinata API error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('IPFS upload result:', result);
    
    return {
      success: true,
      hash: result.IpfsHash
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get content from IPFS using Pinata gateway
export const getFromIPFS = async (hash) => {
  try {
    console.log('Getting content from IPFS with hash:', hash);
    
    // Get from Pinata gateway
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve from IPFS: ${response.statusText}`);
    }
    
    const data = await response.text();
    
    // Try to parse as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(data);
      console.log('Successfully parsed IPFS data as JSON');
    } catch {
      console.log('IPFS data is not JSON, returning as string');
      return { content: data };
    }
    
    // Return the parsed data
    return { content: parsedData };
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error('Failed to retrieve from IPFS');
  }
}; 