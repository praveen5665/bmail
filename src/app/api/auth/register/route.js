import { NextResponse } from 'next/server';
import { registerUser } from '../../../../utils/authUtils';

export async function POST(request) {
  try {
    const { name, email, password, ethAddress, publicKey } = await request.json();
    
    // Validate required fields
    if (!name || !email || !password || !ethAddress || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!email.endsWith('@bmail.com')) {
      return NextResponse.json(
        { error: 'Email must end with @bmail.com' },
        { status: 400 }
      );
    }
    
    // Register user
    const result = await registerUser({ name, email, password, ethAddress, publicKey });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register user' },
      { status: error.message.includes('exists') ? 409 : 500 }
    );
  }
} 