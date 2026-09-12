import 'reflect-metadata';
import { jest as jestGlobals } from '@jest/globals';

Object.defineProperty(globalThis, 'jest', {
  configurable: true,
  value: jestGlobals,
});
