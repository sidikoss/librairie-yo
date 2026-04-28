// src/tests/format.test.js
// Tests unitaires pour les utilitaires de formatage

import { describe, it, expect } from 'vitest';
import {
  formatGNF,
  sanitizeText,
  normalizePhone,
  isValidPhone,
  clamp,
} from '../utils/format';

describe('formatGNF', () => {
  it('should format numbers with French locale', () => {
    expect(formatGNF(1000)).toBe('1\u202f000 GNF');
    expect(formatGNF(1000000)).toBe('1\u202f000\u202f000 GNF');
  });

  it('should handle decimal values', () => {
    expect(formatGNF(1234.56)).toBe('1\u202f234,56 GNF');
  });

  it('should handle null and undefined', () => {
    expect(formatGNF(null)).toBe('0 GNF');
    expect(formatGNF(undefined)).toBe('0 GNF');
    expect(formatGNF(0)).toBe('0 GNF');
  });

  it('should convert string numbers', () => {
    expect(formatGNF('5000')).toBe('5\u202f000 GNF');
  });
});

describe('sanitizeText', () => {
  it('should remove dangerous characters', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });
});

describe('normalizePhone', () => {
  it('should remove non-digit characters', () => {
    expect(normalizePhone('+224 612345678')).toBe('224612345678');
    expect(normalizePhone('(+224) 612-345-678')).toBe('224612345678');
  });

  it('should handle null and undefined', () => {
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
    expect(normalizePhone('')).toBe('');
  });
});

describe('isValidPhone', () => {
  it('should validate correct Guinean phone numbers', () => {
    expect(isValidPhone('612345678')).toBe(true);
    expect(isValidPhone('224612345678')).toBe(true);
    expect(isValidPhone('+224612345678')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abcdefgh')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  it('should accept valid international formats', () => {
    expect(isValidPhone('+2246123456789')).toBe(true);
    expect(isValidPhone('2246123456789')).toBe(true);
  });
});

describe('clamp', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle edge cases', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});