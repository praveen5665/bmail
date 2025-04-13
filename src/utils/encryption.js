import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto-browserify';
import forge from 'node-forge';

// Generate a random AES key
export const generateKey = () => {
  return randomBytes(32).toString('hex');
};

// Prepare key for encryption/decryption
const prepareKey = (key) => {
  // If key is hex string, convert to buffer
  if (typeof key === 'string' && key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // If key is already a buffer, use as is
  if (Buffer.isBuffer(key)) {
    return key;
  }
  // Otherwise, use the key as is (for string keys)
  return Buffer.from(key);
};

// Encrypt data using AES-256-GCM
export const encrypt = async (data, key) => {
  try {
    // Prepare key
    const keyBuffer = prepareKey(key);
    
    // Generate random IV
    const iv = randomBytes(12);
    
    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Encrypt the data
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Return encrypted data with IV and auth tag
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      key: key.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data using AES-256-GCM
export const decrypt = async (encryptedData, key) => {
  try {
    if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Prepare key
    const keyBuffer = prepareKey(key);
    
    // Convert IV to Buffer
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Try to parse as JSON, return as string if parsing fails
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hybrid encrypt (AES + RSA)
export const hybridEncrypt = (data, publicKeyPem) => {
  try {
    // Generate a random AES key
    const aesKey = forge.random.getBytesSync(32); // 256-bit key
    
    // Create AES cipher
    const cipher = forge.cipher.createCipher('AES-CBC', aesKey);
    
    // Generate random IV
    const iv = forge.random.getBytesSync(16);
    cipher.start({iv: iv});
    
    // Add data and finish encryption
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    
    // Get encrypted data
    const encrypted = cipher.output.getBytes();
    
    // Convert public key from PEM
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // Encrypt AES key with RSA
    const encryptedKey = publicKey.encrypt(aesKey, 'RSAES-PKCS1-V1_5');
    
    // Return in the format expected by hybridDecrypt
    return {
      iv: forge.util.encode64(iv),
      key: forge.util.encode64(encryptedKey),
      data: forge.util.encode64(encrypted)
    };
  } catch (error) {
    console.error('Hybrid encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
};

// Hybrid decrypt (AES + RSA)
export const hybridDecrypt = (encryptedData, privateKeyPem) => {
  try {
    if (!encryptedData || !privateKeyPem) {
      throw new Error('Missing required parameters for decryption');
    }

    // Ensure private key is in PEM format
    let formattedPrivateKey = privateKeyPem;
    if (!privateKeyPem.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      try {
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
        formattedPrivateKey = forge.pki.privateKeyToPem(privateKey);
      } catch (error) {
        console.error('Error formatting private key:', error);
        throw new Error('Invalid private key format');
      }
    }

    // Convert private key from PEM
    const privateKey = forge.pki.privateKeyFromPem(formattedPrivateKey);

    // Decode base64 data
    const iv = forge.util.decode64(encryptedData.iv);
    const encryptedKey = forge.util.decode64(encryptedData.key);
    const encrypted = forge.util.decode64(encryptedData.data);

    // Decrypt AES key with RSA
    const aesKey = privateKey.decrypt(encryptedKey, 'RSAES-PKCS1-V1_5');

    // Create decipher
    const decipher = forge.cipher.createDecipher('AES-CBC', aesKey);
    decipher.start({iv: iv});
    decipher.update(forge.util.createBuffer(encrypted));
    const pass = decipher.finish();

    if (!pass) {
      throw new Error('Decryption failed - invalid data or key');
    }

    // Return decrypted data
    return decipher.output.toString();
  } catch (error) {
    console.error('Hybrid decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}; 