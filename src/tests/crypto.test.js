// src/tests/crypto.test.js
// Tests unitaires pour les utilitaires de chiffrement

import { describe, it, expect } from 'vitest';
import {
  hashPIN,
  hashSensitiveData,
  validatePINFormat,
  generateSecureToken,
  secureCompare,
} from '../utils/crypto';

describe('hashPIN', () => {
  it('should hash a valid 4-digit PIN', async () => {
    const hash = await hashPIN('1234');
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('should produce consistent hashes for same input', async () => {
    const hash1 = await hashPIN('1234');
    const hash2 = await hashPIN('1234');
    expect(hash1).toBe(hash2);
  });

  it.skip('should produce different hashes for different PINs (requires Web Crypto API)', async () => {
    const hash1 = await hashPIN('1234');
    const hash2 = await hashPIN('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('should reject PIN with wrong length', async () => {
    await expect(hashPIN('12')).rejects.toThrow('Le PIN doit contenir exactement 4 chiffres');
    await expect(hashPIN('12345')).rejects.toThrow('Le PIN doit contenir exactement 4 chiffres');
  });

  it('should clean non-numeric characters', async () => {
    const hash = await hashPIN('12a34');
    expect(hash).toHaveLength(64);
  });
});

describe('validatePINFormat', () => {
  it('should validate correct 4-digit PIN', () => {
    expect(validatePINFormat('1234')).toEqual({ valid: true, pin: '1234' });
  });

  it('should reject PIN with letters', () => {
    const result = validatePINFormat('12a4');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject PIN with wrong length', () => {
    expect(validatePINFormat('123')).toEqual({ valid: false, error: 'Le PIN doit contenir 4 chiffres' });
    expect(validatePINFormat('12345')).toEqual({ valid: false, error: 'Le PIN doit contenir 4 chiffres' });
  });

  it('should handle null and undefined', () => {
    expect(validatePINFormat(null)).toEqual({ valid: false, error: 'PIN requis' });
    expect(validatePINFormat(undefined)).toEqual({ valid: false, error: 'PIN requis' });
    expect(validatePINFormat('')).toEqual({ valid: false, error: 'PIN requis' });
  });

  it('should clean non-digit characters', () => {
    expect(validatePINFormat('12 34')).toEqual({ valid: true, pin: '1234' });
  });
});

describe('generateSecureToken', () => {
  it('should generate token of specified length', () => {
    expect(generateSecureToken(16)).toHaveLength(16);
    expect(generateSecureToken(32)).toHaveLength(32);
    expect(generateSecureToken(64)).toHaveLength(64);
  });

  it('should generate unique tokens', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);
    expect(token1).not.toBe(token2);
  });

  it('should use default length of 32', () => {
    expect(generateSecureToken()).toHaveLength(32);
  });
});

describe('secureCompare', () => {
  it('should compare identical strings', () => {
    expect(secureCompare('hello', 'hello')).toBe(true);
  });

  it('should fail for different strings', () => {
    expect(secureCompare('hello', 'world')).toBe(false);
  });

  it('should handle different lengths', () => {
    expect(secureCompare('hello', 'hell')).toBe(false);
    expect(secureCompare('a', 'aaa')).toBe(false);
  });

  it('should handle non-string inputs', () => {
    expect(secureCompare(null, 'test')).toBe(false);
    expect(secureCompare('test', null)).toBe(false);
    expect(secureCompare(123, '123')).toBe(false);
  });
});

describe('hashSensitiveData', () => {
  it('should hash data with salt', async () => {
    const hash = await hashSensitiveData('test-data', 'my-salt');
    expect(hash).toHaveLength(64);
  });

  it.skip('should produce different hashes with different salts (requires Web Crypto API)', async () => {
    const hash1 = await hashSensitiveData('test-data', 'salt1');
    const hash2 = await hashSensitiveData('test-data', 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  it('should use default salt if not provided', async () => {
    const hash = await hashSensitiveData('test-data');
    expect(hash).toHaveLength(64);
  });
});