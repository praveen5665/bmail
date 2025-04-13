import { NextResponse } from 'next/server';
import { getUserPublicKey } from '../../../../utils/authUtils';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const ethAddress = searchParams.get('ethAddress');
    
    if (!email && !ethAddress) {
      return NextResponse.json(
        { error: 'Email or Ethereum address required' },
        { status: 400 }
      );
    }
    
    const identifier = email || ethAddress;
    const publicKey = await getUserPublicKey(identifier);
    
    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Public key fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve public key' },
      { status: error.message.includes('not found') ? 404 : 500 }
    );
  }
} 