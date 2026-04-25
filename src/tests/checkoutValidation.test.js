// src/tests/checkoutValidation.test.js
// Tests unitaires pour la validation du checkout

import { describe, it, expect } from 'vitest';
import {
  extractPaymentReference,
  validateCheckoutForm,
} from '../features/checkout/checkoutValidation';

describe('extractPaymentReference', () => {
  it('should extract simple alphanumeric reference', () => {
    expect(extractPaymentReference('A58452')).toBe('A58452');
    expect(extractPaymentReference('TX123456')).toBe('TX123456');
  });

  it('should extract reference from text format', () => {
    const result = extractPaymentReference('payment reference: A58452');
    expect(result).toBe('A58452');
  });

  it('should extract last segment from dotted format', () => {
    const result = extractPaymentReference('PP260417.2018.A58452');
    expect(result).toBe('A58452');
  });

  it('should handle Orange Money format', () => {
    const result = extractPaymentReference('reference: TX12345 orange money');
    expect(result).toBe('TX12345');
  });

  it('should handle empty input', () => {
    expect(extractPaymentReference('')).toBe('');
    expect(extractPaymentReference(null)).toBe('');
    expect(extractPaymentReference(undefined)).toBe('');
  });

  it('should remove quotes from reference', () => {
    expect(extractPaymentReference('"A58452"')).toBe('A58452');
    expect(extractPaymentReference("'TX123'")).toBe('TX123');
  });

  it('should handle references with underscores and dashes', () => {
    expect(extractPaymentReference('TX_123_456')).toBe('TX_123_456');
    expect(extractPaymentReference('TX-123-456')).toBe('TX-123-456');
  });
});

describe('validateCheckoutForm', () => {
  const validForm = {
    name: 'Test User',
    phone: '612345678',
    pin: '1234',
  };

  it('should pass with valid form for orange_money', () => {
    const errors = validateCheckoutForm({ ...validForm, mode: 'orange_money' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should pass with valid form for whatsapp', () => {
    const errors = validateCheckoutForm({ ...validForm, mode: 'whatsapp' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require name', () => {
    const errors = validateCheckoutForm({ ...validForm, name: '' });
    expect(errors.name).toBe('Nom requis');
  });

  it('should require valid phone', () => {
    const errors = validateCheckoutForm({ ...validForm, phone: '123' });
    expect(errors.phone).toBe('Numéro de téléphone invalide');
  });

  it('should require 4-digit PIN for orange_money', () => {
    const errors = validateCheckoutForm({ ...validForm, pin: '123', mode: 'orange_money' });
    expect(errors.pin).toBe('PIN à 4 chiffres requis');
  });

  it('should require 4-digit PIN for whatsapp', () => {
    const errors = validateCheckoutForm({ ...validForm, pin: '12', mode: 'whatsapp' });
    expect(errors.pin).toBe('PIN à 4 chiffres requis');
  });

  it('should not require PIN for other modes', () => {
    const errors = validateCheckoutForm({ ...validForm, pin: '12', mode: 'card' });
    expect(errors.pin).toBeUndefined();
  });

  it('should return empty errors object for valid form', () => {
    const errors = validateCheckoutForm(validForm);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});