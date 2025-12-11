# Test Configuration API Contract

**Version**: 1.0.0  
**Feature**: Add Comprehensive Test Coverage  
**Date**: 2025-12-10

## Overview

This document defines the contracts for test configuration files that must be created to enable the test suite.

---

## Contract 1: Jest Configuration (`jest.config.js`)

### Purpose
Configure Jest test runner with React Native/Expo preset and TypeScript support.

### Required Exports

```typescript
interface JestConfig {
  preset: string;                    // Must be 'jest-expo'
  setupFilesAfterEnv: string[];      // Path to jest.setup.ts
  transformIgnorePatterns: string[]; // Patterns for module transformation
  collectCoverageFrom: string[];     // Files to include in coverage
  coverageThresholds: CoverageThresholds;
  testMatch: string[];               // Test file patterns
  moduleNameMapper?: Record<string, string>; // Optional path aliases
}

interface CoverageThresholds {
  global: ThresholdSet;
  [filePattern: string]: ThresholdSet; // Layer-specific thresholds
}

interface ThresholdSet {
  branches: number;   // Minimum branch coverage %
  functions: number;  // Minimum function coverage %
  lines: number;      // Minimum line coverage %
  statements: number; // Minimum statement coverage %
}
```

### Required Configuration

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*'
  ],
  coverageThresholds: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    'src/services/**/*.ts': { branches: 90, functions: 90, lines: 90, statements: 90 },
    'src/hooks/**/*.ts': { branches: 85, functions: 85, lines: 85, statements: 85 },
    'src/screens/**/*.tsx': { branches: 75, functions: 75, lines: 75, statements: 75 },
    'src/utils/**/*.ts': { branches: 90, functions: 90, lines: 90, statements: 90 }
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx']
};
```

### Validation Rules

- ✅ Preset must be 'jest-expo' (enables Expo mocking)
- ✅ Setup file must exist at specified path
- ✅ Global coverage thresholds must be ≥ 80%
- ✅ Layer-specific thresholds must match research.md decisions
- ✅ Test file pattern must match __tests__ directory structure

---

## Contract 2: Jest Setup File (`__tests__/setup/jest.setup.ts`)

### Purpose
Configure global test environment, mocks, and utilities before any tests run.

### Required Configuration

```typescript
// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  }
}));

// Set up testing library globals
import '@testing-library/jest-native/extend-expect';

// Global test timeout (for async operations)
jest.setTimeout(10000);

// Silence console warnings in tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

### Validation Rules

- ✅ AsyncStorage mock must be configured before any tests
- ✅ Expo modules used in app must be mocked
- ✅ Testing library matchers must be extended
- ✅ Test timeout must be sufficient for async operations (≥ 5000ms)

---

## Contract 3: Mock Factory (`__tests__/setup/mocks.ts`)

### Purpose
Provide reusable mock implementations for common test scenarios.

### Required Exports

```typescript
// Navigation mock factory
export function createMockNavigation<T extends object = any>(): MockNavigation {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
    reset: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getState: jest.fn()
  } as MockNavigation;
}

// Route mock factory
export function createMockRoute<T extends object>(
  name: string,
  params?: T
): MockRoute<T> {
  return {
    key: `${name}-${Math.random()}`,
    name,
    params
  } as MockRoute<T>;
}

// Axios mock helper
export function mockAxiosSuccess<T>(url: string, data: T): void {
  const axios = require('axios');
  axios.get.mockResolvedValueOnce({ data, status: 200 });
}

export function mockAxiosError(url: string, error: Error): void {
  const axios = require('axios');
  axios.get.mockRejectedValueOnce(error);
}

// Location permission mock
export function mockLocationPermission(status: 'granted' | 'denied'): void {
  const Location = require('expo-location');
  Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
    status,
    granted: status === 'granted',
    canAskAgain: status === 'denied',
    expires: 'never'
  });
}

// Current location mock
export function mockCurrentLocation(
  latitude: number,
  longitude: number
): void {
  const Location = require('expo-location');
  Location.getCurrentPositionAsync.mockResolvedValueOnce({
    coords: {
      latitude,
      longitude,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 0,
      heading: 0,
      speed: 0
    },
    timestamp: Date.now()
  });
}
```

### Validation Rules

- ✅ Navigation mocks must implement all methods used in app
- ✅ Mock factories must return type-safe objects
- ✅ Axios mocks must match actual API response structure
- ✅ Location mocks must match expo-location types

---

## Contract 4: Fixture Factory (`__tests__/fixtures/attractions.ts`)

### Purpose
Provide reusable test data conforming to application types.

### Required Exports

```typescript
import { Attraction } from '../../src/types';

// Factory function with overrides
export function createMockAttraction(
  overrides?: Partial<Attraction>
): Attraction {
  return {
    id: '1',
    name: 'Brandenburg Gate',
    latitude: 52.5163,
    longitude: 13.3777,
    type: 'monument',
    description: 'Historic neoclassical monument',
    distance: 500,
    wikiUrl: 'https://en.wikipedia.org/wiki/Brandenburg_Gate',
    ...overrides
  };
}

// Predefined fixtures for common scenarios
export const mockAttractions: Attraction[] = [
  createMockAttraction({ id: '1', name: 'Brandenburg Gate' }),
  createMockAttraction({ 
    id: '2', 
    name: 'Reichstag', 
    latitude: 52.5186,
    longitude: 13.3762
  }),
  createMockAttraction({ 
    id: '3', 
    name: 'Berlin Cathedral',
    latitude: 52.5191,
    longitude: 13.4012
  })
];

// Empty state fixture
export const emptyAttractions: Attraction[] = [];

// Edge case: Very far attraction
export const farAwayAttraction = createMockAttraction({
  id: 'far',
  name: 'Tokyo Tower',
  latitude: 35.6586,
  longitude: 139.7454,
  distance: 8918000 // ~8918 km from Berlin
});
```

### Validation Rules

- ✅ Factory function must accept Partial<T> for overrides
- ✅ Default values must be realistic and valid
- ✅ Must provide fixtures for: normal, empty, and edge cases
- ✅ All fixtures must pass TypeScript type checking

---

## Contract 5: Package.json Test Scripts

### Purpose
Define npm scripts for running tests with various configurations.

### Required Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:unit": "jest __tests__/(services|hooks|utils)",
    "test:integration": "jest __tests__/screens",
    "test:update-snapshots": "jest --updateSnapshot"
  }
}
```

### Validation Rules

- ✅ `test` runs all tests with no flags (fast feedback)
- ✅ `test:watch` enables watch mode for development
- ✅ `test:coverage` generates coverage report
- ✅ `test:ci` optimized for CI/CD (deterministic, parallelized)
- ✅ `test:unit` and `test:integration` allow layer-specific testing

---

## Contract 6: Test File Naming and Structure

### Purpose
Ensure consistent test file organization and naming.

### File Naming Convention

```
Source File              → Test File
src/services/foo.ts      → __tests__/services/foo.test.ts
src/hooks/useFoo.ts      → __tests__/hooks/useFoo.test.ts
src/screens/FooScreen.tsx → __tests__/screens/FooScreen.test.tsx
src/utils/foo.ts         → __tests__/utils/foo.test.ts
```

### Test File Structure Template

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ServiceClass } from '../../src/services/service-class';
import { createMockX } from '../fixtures/x';
import { mockAxiosSuccess } from '../setup/mocks';

describe('ServiceClass', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Given (Arrange)
      const mockData = createMockX();
      mockAxiosSuccess('/api/endpoint', mockData);
      
      // When (Act)
      const result = await ServiceClass.methodName();
      
      // Then (Assert)
      expect(result).toEqual(mockData);
    });
    
    it('should handle errors when [error condition]', async () => {
      // Given, When, Then...
    });
  });
});
```

### Validation Rules

- ✅ Test files must mirror source structure
- ✅ Test files must have `.test.ts` or `.test.tsx` extension
- ✅ Each test file must have single top-level `describe` block matching file name
- ✅ Tests must use descriptive names: "should [behavior] when [condition]"
- ✅ Complex tests should use Given-When-Then comments
- ✅ Each test file must clean up mocks in `beforeEach` or `afterEach`

---

## Summary

All contracts are **required** for the test suite to function correctly. Deviations from these contracts may cause:
- Tests failing to run
- Coverage not being collected
- Mocks not working correctly
- Flaky or inconsistent test results

Contracts are validated through:
- TypeScript compilation (type safety)
- Jest execution (runtime behavior)
- Coverage reports (threshold enforcement)
