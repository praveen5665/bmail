import { Buffer } from 'buffer';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto-browserify';

// Generate a random encryption key
export const generateKey = () => {
  return randomBytes(32).toString('hex');
};

// Validate and convert key to proper format
const prepareKey = (key) => {
  if (!key) {
    throw new Error('Encryption key is required');
  }
  
  // If key is already a hex string of correct length, use it directly
  if (typeof key === 'string' && /^[0-9a-f]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // If key is a hex string but wrong length, pad or truncate
  if (typeof key === 'string' && /^[0-9a-f]+$/.test(key)) {
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length < 32) {
      // Pad with zeros if too short
      const paddedKey = Buffer.alloc(32);
      keyBuffer.copy(paddedKey);
      return paddedKey;
    } else if (keyBuffer.length > 32) {
      // Truncate if too long
      return keyBuffer.slice(0, 32);
    }
    return keyBuffer;
  }
  
  // If key is not a hex string, hash it
  const keyBuffer = Buffer.from(String(key));
  if (keyBuffer.length < 32) {
    // Pad with zeros if too short
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    return paddedKey;
  } else if (keyBuffer.length > 32) {
    // Truncate if too long
    return keyBuffer.slice(0, 32);
  }
  return keyBuffer;
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
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
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