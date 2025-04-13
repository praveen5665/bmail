import { NextResponse } from 'next/server';
import { loginUser } from '../../../../utils/authUtils';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Ensure email has correct format
    const formattedEmail = email.includes('@') ? email : `${email}@bmail.com`;
    
    // Login user
    const result = await loginUser({ email: formattedEmail, password });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid credentials' },
      { status: 401 }
    );
  }
} 