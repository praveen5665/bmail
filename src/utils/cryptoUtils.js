'use client';

import forge from 'node-forge';

// Generate a new RSA key pair
export const generateKeyPair = () => {
  return new Promise((resolve, reject) => {
    try {
      // Generate a new RSA key pair with 2048 bits
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      
      // Convert to PEM format for storage
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      
      resolve({ 
        privateKey: privateKeyPem, 
        publicKey: publicKeyPem 
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Initialize IndexedDB
const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bmail_keys', 1);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains('private_keys')) {
        db.createObjectStore('private_keys', { keyPath: 'email' });
      }
    };
  });
};

// Store private key in IndexedDB
export const storePrivateKey = async (email, privateKey) => {
  try {
    // Ensure private key is in PEM format
    let formattedPrivateKey = privateKey;
    if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      try {
        // Try to parse and reformat the key
        const key = forge.pki.privateKeyFromPem(privateKey);
        formattedPrivateKey = forge.pki.privateKeyToPem(key);
      } catch (error) {
        console.error('Error formatting private key:', error);
        throw new Error('Invalid private key format');
      }
    }
    
    // Initialize IndexedDB
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['private_keys'], 'readwrite');
      const store = transaction.objectStore('private_keys');
      
      const request = store.put({
        email,
        privateKey: formattedPrivateKey
      });
      
      request.onsuccess = () => {
        // Also store in localStorage as a backup
        localStorage.setItem(`bmail_private_key_${email}`, formattedPrivateKey);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error storing private key:', event.target.error);
        // Fallback to localStorage
        localStorage.setItem(`bmail_private_key_${email}`, formattedPrivateKey);
        resolve(true);
      };
    });
  } catch (error) {
    console.error('Error in storePrivateKey:', error);
    // Fallback to localStorage
    localStorage.setItem(`bmail_private_key_${email}`, privateKey);
    return true;
  }
};

// Get private key from IndexedDB
export const getPrivateKey = async (email) => {
  try {
    // Initialize IndexedDB
    const db = await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['private_keys'], 'readonly');
      const store = transaction.objectStore('private_keys');
      
      const request = store.get(email);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.privateKey) {
          resolve(result.privateKey);
        } else {
          // Try localStorage as fallback
          const fallbackKey = localStorage.getItem(`bmail_private_key_${email}`);
          if (fallbackKey) {
            resolve(fallbackKey);
          } else {
            resolve(null);
          }
        }
      };
      
      request.onerror = (event) => {
        console.error('Error getting private key:', event.target.error);
        // Try localStorage as fallback
        const fallbackKey = localStorage.getItem(`bmail_private_key_${email}`);
        if (fallbackKey) {
          resolve(fallbackKey);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error in getPrivateKey:', error);
    // Try localStorage as fallback
    const fallbackKey = localStorage.getItem(`bmail_private_key_${email}`);
    if (fallbackKey) {
      return fallbackKey;
    }
    return null;
  }
};

// Store public key in the database
export const storePublicKey = async (email, publicKey) => {
  try {
    // Store in localStorage as a temporary solution
    localStorage.setItem(`bmail_pubk_${email}`, publicKey);
    
    // In a real implementation, this would store in a database
    // For now, we'll just log that we're storing it
    console.log(`Storing public key for ${email}`);
    
    return true;
  } catch (error) {
    console.error('Error storing public key:', error);
    throw error;
  }
};

// Get public key for a user
export const getPublicKey = async (email) => {
  try {
    // Try to get from localStorage first
    const publicKey = localStorage.getItem(`bmail_pubk_${email}`);
    
    if (publicKey) {
      return publicKey;
    }
    
    // If not in localStorage, try to fetch from API
    try {
      const response = await fetch(`/api/users/publicKey?email=${encodeURIComponent(email)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.publicKey) {
          // Store in localStorage for future use
          localStorage.setItem(`bmail_pubk_${email}`, data.publicKey);
          return data.publicKey;
        }
      }
    } catch (apiError) {
      console.warn('Error fetching public key from API:', apiError);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting public key:', error);
    return null;
  }
};

// Encrypt a message with a recipient's public key
export const encryptMessage = (message, publicKeyPem) => {
  try {
    // Convert PEM to a public key object
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // UTF-8 encode the message
    const bytes = forge.util.encodeUtf8(message);
    
    // Encrypt the message using RSAES PKCS#1 v1.5 padding
    const encrypted = publicKey.encrypt(bytes, 'RSAES-PKCS1-V1_5');
    
    // Base64 encode the encrypted message for storage/transmission
    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt message: ${error.message}`);
  }
};

// Decrypt a message with the user's private key
export const decryptMessage = (encryptedBase64, privateKeyPem) => {
  try {
    if (!encryptedBase64 || !privateKeyPem) {
      throw new Error('Missing required parameters for decryption');
    }

    // Convert PEM to a private key object
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    
    // Base64 decode the encrypted message
    const encrypted = forge.util.decode64(encryptedBase64);
    
    // Decrypt the message using RSAES PKCS#1 v1.5 padding
    const decrypted = privateKey.decrypt(encrypted, 'RSAES-PKCS1-V1_5');
    
    // UTF-8 decode the decrypted bytes to get the original message
    return forge.util.decodeUtf8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt message: ${error.message}`);
  }
}; 