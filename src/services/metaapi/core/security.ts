import { logger } from '../utils/logger';
import { AuthenticationError } from './errors';

export class SecurityManager {
  private static instance: SecurityManager;
  private readonly TOKEN_KEY = 'META_API_TOKEN';
  private readonly ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
  private readonly API_KEY = import.meta.env.VITE_META_API_KEY;
  private readonly API_SECRET = import.meta.env.VITE_META_API_SECRET;

  private constructor() {
    if (!this.ENCRYPTION_KEY) {
      throw new Error('Encryption key not found in environment variables');
    }
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  public async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
        headers: {
          'auth-token': apiKey
        }
      });

      return response.ok;
    } catch (error) {
      logger.error('API key validation failed', { error });
      return false;
    }
  }

  public encryptCredentials(credentials: {
    login: string;
    password: string;
    server: string;
  }): string {
    try {
      const data = JSON.stringify(credentials);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Use Web Crypto API for encryption
      const key = this.deriveKey(this.ENCRYPTION_KEY);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      return crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        dataBuffer
      ).then(encrypted => {
        const encryptedArray = new Uint8Array(encrypted);
        const combined = new Uint8Array(iv.length + encryptedArray.length);
        combined.set(iv);
        combined.set(encryptedArray, iv.length);
        return btoa(String.fromCharCode(...combined));
      });
    } catch (error) {
      logger.error('Credential encryption failed', { error });
      throw new Error('Failed to encrypt credentials');
    }
  }

  public async decryptCredentials(encryptedData: string): Promise<{
    login: string;
    password: string;
    server: string;
  }> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      const key = await this.deriveKey(this.ENCRYPTION_KEY);
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      logger.error('Credential decryption failed', { error });
      throw new Error('Failed to decrypt credentials');
    }
  }

  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = encoder.encode('MetaAPI-Salt');
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public validateToken(token: string): boolean {
    try {
      if (!token) return false;
      
      // Verify token format (should be JWT)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Verify token expiration
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new AuthenticationError('Token expired');
      }

      return true;
    } catch (error) {
      logger.error('Token validation failed', { error });
      return false;
    }
  }

  public getRequestHeaders(token: string): Headers {
    if (!this.validateToken(token)) {
      throw new AuthenticationError('Invalid token');
    }

    return new Headers({
      'auth-token': token,
      'Content-Type': 'application/json',
      'X-API-KEY': this.API_KEY
    });
  }
}