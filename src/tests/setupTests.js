// src/tests/setupTests.js
// Configuration globale pour les tests Vitest

import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

global.fetch = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
});

afterAll(() => {
  delete global.fetch;
  delete global.localStorage;
});

Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: vi.fn((options, data) => {
        const hashBuffer = new ArrayBuffer(32);
        const hashArray = new Uint8Array(hashBuffer);
        for (let i = 0; i < 32; i++) hashArray[i] = i;
        return Promise.resolve(hashBuffer);
      }),
    },
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});