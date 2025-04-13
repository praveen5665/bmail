import { NextResponse } from 'next/server';

/**
 * IPFS Proxy API - helps bypass CORS restrictions when fetching from IPFS gateways
 * 
 * This is especially useful in local development when public IPFS gateways
 * may block requests from localhost due to CORS policies.
 */
export async function GET(request) {
  // Extract the IPFS hash from the query parameters
  const url = new URL(request.url);
  const ipfsHash = url.searchParams.get('hash');
  
  if (!ipfsHash) {
    return NextResponse.json(
      { error: 'Missing IPFS hash parameter' },
      { status: 400 }
    );
  }
  
  // List of IPFS gateways to try
  const gateways = [
    `https://ipfs.io/ipfs/${ipfsHash}`,
    `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
    `https://ipfs.infura.io/ipfs/${ipfsHash}`,
    `https://gateway.ipfs.io/ipfs/${ipfsHash}`,
    `https://dweb.link/ipfs/${ipfsHash}`
  ];
  
  // Mock response for development with test hashes
  if (ipfsHash.startsWith('Qm') && ipfsHash.length < 30) {
    return NextResponse.json({
      encrypted: true,
      content: "MOCK_ENCRYPTED_CONTENT_FROM_PROXY",
      timestamp: Date.now(),
      algorithm: 'RSA-2048'
    });
  }
  
  let lastError = null;
  
  // Try each gateway until one works
  for (const gateway of gateways) {
    try {
      const response = await fetch(gateway, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      console.warn(`Proxy failed to fetch from ${gateway}:`, error.message);
      lastError = error;
      // Continue to next gateway
    }
  }
  
  // If we reach here, all gateways failed
  return NextResponse.json(
    { error: 'Failed to retrieve content from IPFS', message: lastError?.message },
    { status: 502 }
  );
} 