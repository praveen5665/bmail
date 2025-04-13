'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();

  // Check for user token on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('bmail_token');
        if (storedToken) {
          setToken(storedToken);
          await fetchUserDetails(storedToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('bmail_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch user details with token
  const fetchUserDetails = async (authToken) => {
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      
      // Ensure the user object has the address property
      const userData = {
        ...data.user,
        address: data.user.ethAddress || data.user.address // Try both properties
      };
      
      if (!userData.address) {
        console.error('No Ethereum address found for user');
        throw new Error('No Ethereum address associated with account');
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  };

  // Sign up a new user
  const signUp = async ({ name, email, password, walletAddress, publicKey }) => {
    try {
      // Validate email format
      if (!email.endsWith('@bmail.com')) {
        throw new Error('Email must end with @bmail.com');
      }

      console.log('Signing up user...');
      
      // Register user via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          ethAddress: walletAddress,
          publicKey: publicKey // Now accepting the publicKey parameter
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Store token
      localStorage.setItem('bmail_token', data.token);
      setToken(data.token);
      setUser(data.user);

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in a user
  const signIn = async ({ email, password }) => {
    try {
      // Format email with @bmail.com if needed
      const formattedEmail = email.includes('@') ? email : `${email}@bmail.com`;
      
      // Validate email format
      if (!formattedEmail.endsWith('@bmail.com')) {
        throw new Error('Email must end with @bmail.com');
      }

      console.log('Signing in user...');
      
      // Login user via API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formattedEmail,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Store token
      localStorage.setItem('bmail_token', data.token);
      setToken(data.token);
      
      // Ensure the user object has the address property
      const userData = {
        ...data.user,
        address: data.user.ethAddress || data.user.address // Try both properties
      };
      
      if (!userData.address) {
        throw new Error('No Ethereum address associated with account');
      }
      
      setUser(userData);

      return { success: true, data: { ...data, user: userData } };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out a user
  const signOut = async () => {
    try {
      // Clear token and user
      localStorage.removeItem('bmail_token');
      setToken(null);
      setUser(null);
      
      router.push('/signin');
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user's public key
  const updatePublicKey = async (publicKey) => {
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ publicKey })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update public key');
      }
      
      setUser({...user, publicKey});
      return { success: true };
    } catch (error) {
      console.error('Update public key error:', error);
      return { success: false, error: error.message };
    }
  };

  // Context value
  const value = {
    user,
    loading,
    token,
    signUp,
    signIn,
    signOut,
    updatePublicKey
  };

  // Return provider with values and children
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 