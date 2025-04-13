import { JSEncrypt } from 'jsencrypt';
import CryptoJS from 'crypto-js';

// Generate a new RSA key pair
export const generateKeyPair = () => {
  const jsEncrypt = new JSEncrypt({ default_key_size: 2048 });
  const privateKey = jsEncrypt.getPrivateKey();
  const publicKey = jsEncrypt.getPublicKey();
  
  return { privateKey, publicKey };
};

// Save keys to local storage (private key should be more securely stored in production)
export const saveKeysToStorage = (privateKey, publicKey) => {
  localStorage.setItem('bmail_private_key', privateKey);
  localStorage.setItem('bmail_public_key', publicKey);
};

// Get keys from local storage
export const getKeysFromStorage = () => {
  const privateKey = localStorage.getItem('bmail_private_key');
  const publicKey = localStorage.getItem('bmail_public_key');
  
  return { privateKey, publicKey };
};

// Generate a random AES key
const generateAESKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(); // 256-bit key
};

// Encrypt with AES
const encryptWithAES = (message, key) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

// Decrypt with AES
const decryptWithAES = (encryptedMessage, key) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Hybrid encrypt (RSA + AES) for large messages
export const encryptWithPublicKey = (publicKey, message) => {
  try {
    // 1. Generate a random AES key
    const aesKey = generateAESKey();
    
    // 2. Encrypt the message with AES
    const encryptedMessage = encryptWithAES(message, aesKey);
    
    // 3. Encrypt the AES key with RSA
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encryptedKey = encrypt.encrypt(aesKey);
    
    if (!encryptedKey) {
      throw new Error('RSA encryption failed');
    }
    
    // 4. Return both the encrypted key and encrypted message
    return JSON.stringify({
      encryptedKey: encryptedKey,
      encryptedMessage: encryptedMessage
    });
  } catch (error) {
    console.error('Error encrypting message:', error);
    throw error;
  }
};

// Hybrid decrypt (RSA + AES)
export const decryptWithPrivateKey = (privateKey, encryptedPackage) => {
  try {
    // 1. Parse the encrypted package
    let parsed;
    try {
      parsed = JSON.parse(encryptedPackage);
    } catch (e) {
      // If it's not a JSON object, it might be using the old format
      // For backwards compatibility, try to decrypt directly
      const decrypt = new JSEncrypt();
      decrypt.setPrivateKey(privateKey);
      const decrypted = decrypt.decrypt(encryptedPackage);
      if (!decrypted) {
        throw new Error('Decryption failed - incompatible format');
      }
      return decrypted;
    }
    
    const { encryptedKey, encryptedMessage } = parsed;
    
    // 2. Decrypt the AES key with RSA
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    const aesKey = decrypt.decrypt(encryptedKey);
    
    if (!aesKey) {
      throw new Error('RSA decryption failed');
    }
    
    // 3. Decrypt the message with AES
    const decryptedMessage = decryptWithAES(encryptedMessage, aesKey);
    
    if (!decryptedMessage) {
      throw new Error('AES decryption failed');
    }
    
    return decryptedMessage;
  } catch (error) {
    console.error('Error decrypting message:', error);
    throw error;
  }
}; 