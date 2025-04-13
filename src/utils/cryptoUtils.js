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

// Store private key in IndexedDB or localStorage as fallback
export const storePrivateKey = async (email, privateKey) => {
  return new Promise((resolve, reject) => {
    try {
      // First try to store in localStorage as a fallback
      try {
        localStorage.setItem(`bmail_pk_${email}`, privateKey);
        console.log('Stored private key in localStorage as fallback');
      } catch (localStorageError) {
        console.warn('Could not store in localStorage:', localStorageError);
      }
      
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using localStorage only');
        resolve(true);
        return;
      }
      
      // Open (or create) the database
      const request = window.indexedDB.open('BmailKeyStore', 1);
      
      // Handle database upgrades/creation
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create an object store if it doesn't exist
        if (!db.objectStoreNames.contains('privateKeys')) {
          db.createObjectStore('privateKeys', { keyPath: 'email' });
        }
      };
      
      // Handle success
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Start a transaction and get the object store
        const transaction = db.transaction(['privateKeys'], 'readwrite');
        const store = transaction.objectStore('privateKeys');
        
        // Add the private key to the store
        const addRequest = store.put({ email, privateKey });
        
        addRequest.onsuccess = () => {
          console.log('Successfully stored private key in IndexedDB');
          resolve(true);
        };
        
        addRequest.onerror = (e) => {
          console.error('Failed to store in IndexedDB:', e.target.error);
          // If IndexedDB failed but localStorage succeeded, still resolve
          resolve(true);
        };
      };
      
      // Handle errors
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.errorCode);
        // If localStorage succeeded, still resolve
        resolve(true);
      };
    } catch (error) {
      console.error('Error in storePrivateKey:', error);
      reject(error);
    }
  });
};

// Retrieve private key from IndexedDB or localStorage
export const getPrivateKey = async (email) => {
  return new Promise((resolve, reject) => {
    try {
      // First try to get from localStorage
      try {
        const localStorageKey = localStorage.getItem(`bmail_pk_${email}`);
        if (localStorageKey) {
          console.log('Found private key in localStorage');
          resolve(localStorageKey);
          return;
        }
      } catch (localStorageError) {
        console.warn('Could not read from localStorage:', localStorageError);
      }
      
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        reject(new Error('Your browser doesn\'t support IndexedDB and no key found in localStorage.'));
        return;
      }
      
      // Open the database
      const request = window.indexedDB.open('BmailKeyStore', 1);
      
      // Handle success
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Start a transaction and get the object store
        const transaction = db.transaction(['privateKeys'], 'readonly');
        const store = transaction.objectStore('privateKeys');
        
        // Retrieve the private key
        const getRequest = store.get(email);
        
        getRequest.onsuccess = (event) => {
          if (event.target.result) {
            console.log('Found private key in IndexedDB');
            // Also save to localStorage for future use
            try {
              localStorage.setItem(`bmail_pk_${email}`, event.target.result.privateKey);
            } catch (e) {
              console.warn('Could not save IndexedDB key to localStorage:', e);
            }
            resolve(event.target.result.privateKey);
          } else {
            reject(new Error('Private key not found for email: ' + email));
          }
        };
        
        getRequest.onerror = (e) => {
          reject(new Error('Failed to retrieve private key: ' + e.target.error));
        };
      };
      
      // Handle errors
      request.onerror = (event) => {
        reject(new Error('Database error: ' + event.target.errorCode));
      };
    } catch (error) {
      reject(error);
    }
  });
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
    
    // Encrypt the message (using RSAES PKCS#1 v1.5)
    const encrypted = publicKey.encrypt(bytes, 'RSA-OAEP', {
      md: forge.md.sha256.create()
    });
    
    // Base64 encode the encrypted message for storage/transmission
    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
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
    
    // Decrypt the message (using RSAES PKCS#1 v1.5)
    const decrypted = privateKey.decrypt(encrypted, 'RSA-OAEP', {
      md: forge.md.sha256.create()
    });
    
    // UTF-8 decode the decrypted bytes to get the original message
    return forge.util.decodeUtf8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt message: ${error.message}`);
  }
};

export const decryptWithPrivateKey = async (encryptedData, privateKeyPem) => {
  try {
    if (!encryptedData || !privateKeyPem) {
      throw new Error('Missing required parameters for decryption');
    }

    // Convert PEM to private key object
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    
    // Handle different encryption formats
    if (typeof encryptedData === 'string') {
      // Direct RSA decryption
      const encryptedBytes = forge.util.decode64(encryptedData);
      const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create()
      });
      return forge.util.decodeUtf8(decrypted);
    } else if (encryptedData.encryptedKey && encryptedData.encryptedContent) {
      // Hybrid RSA+AES format
      // First decrypt the AES key
      const encryptedKeyBytes = forge.util.decode64(encryptedData.encryptedKey);
      const decryptedKey = privateKey.decrypt(encryptedKeyBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create()
      });
      
      // Create decipher using the decrypted AES key
      const decipher = forge.cipher.createDecipher('AES-GCM', decryptedKey);
      
      // Base64 decode the encrypted content
      const encryptedContent = forge.util.decode64(encryptedData.encryptedContent);
      
      // Set IV and start decryption
      decipher.start({
        iv: forge.util.decode64(encryptedData.iv),
        tagLength: 128,
        tag: forge.util.decode64(encryptedData.tag)
      });
      
      // Update with encrypted content and finish
      decipher.update(forge.util.createBuffer(encryptedContent));
      const pass = decipher.finish();
      
      if (!pass) {
        throw new Error('Decryption failed - authentication tag mismatch');
      }
      
      // Get the decrypted content
      return decipher.output.toString('utf8');
    } else {
      throw new Error('Unsupported encryption format');
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}; 