import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../utils/mongoConnect';
import User from '../../../../models/User';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('ethAddress');
    
    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ ethAddress: user.ethAddress });
  } catch (error) {
    console.error('Error retrieving Ethereum address:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve Ethereum address' },
      { status: 500 }
    );
  }
} 