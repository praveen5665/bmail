import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../utils/authUtils';
import connectToDatabase from '../../../../utils/mongoConnect';
import User from '../../../../models/User';

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    await connectToDatabase();
    
    const { publicKey } = await request.json();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }
    
    // Update user's public key
    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { publicKey },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
} 