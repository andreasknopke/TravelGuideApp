# Quickstart: Testing Infrastructure

**Feature**: Add Comprehensive Test Coverage  
**Date**: 2025-12-10  
**Audience**: Developers implementing the test suite

## Prerequisites

- Node.js 14+ and npm/yarn installed
- TypeScript 5.9.3 configured
- React Native 0.81.5 + Expo 54.x project
- Existing source code in `src/` directory

## Installation (10 minutes)

### 1. Install Test Dependencies

```bash
npm install --save-dev \
  jest@29 \
  jest-expo@^54.0.0 \
  @testing-library/react-native@^12.4.0 \
  @testing-library/jest-native@^5.4.3 \
  @testing-library/react-hooks@^8.0.1 \
  @types/jest@^29.5.0 \
  axios-mock-adapter@^1.22.0
```

**Why these dependencies**:
- `jest`: Test runner and assertion library
- `jest-expo`: Expo-specific Jest preset with built-in mocks
- `@testing-library/react-native`: Component testing utilities
- `@testing-library/jest-native`: Custom matchers for React Native
- `@testing-library/react-hooks`: Hook testing utilities
- `@types/jest`: TypeScript types for Jest
- `axios-mock-adapter`: API mocking for axios

### 2. Create Jest Configuration

Create `jest.config.js` in project root:

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

### 3. Create Test Directory Structure

```bash
mkdir -p __tests__/{setup,fixtures,services,hooks,screens,utils}
```

### 4. Create Jest Setup File

Create `__tests__/setup/jest.setup.ts`:

```typescript
import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
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

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

### 5. Add Test Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:unit": "jest __tests__/(services|hooks|utils)",
    "test:integration": "jest __tests__/screens"
  }
}
```

## Writing Your First Test (15 minutes)

### Example 1: Service Test

Create `__tests__/services/favorites.service.test.ts`:

```typescript
import favoritesService from '../../src/services/favorites.service';
import { Attraction } from '../../src/types';

// Mock fixture
const mockAttraction: Attraction = {
  id: '1',
  name: 'Test Landmark',
  latitude: 52.52,
  longitude: 13.405,
  type: 'monument',
  description: 'Test description',
  distance: 100
};

describe('FavoritesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addFavorite', () => {
    it('should add attraction to favorites when called with valid attraction', async () => {
      // Given
      const initialFavorites = await favoritesService.getFavorites();
      
      // When
      const result = await favoritesService.addFavorite(mockAttraction);
      
      // Then
      expect(result).toHaveLength(initialFavorites.length + 1);
      expect(result).toContainEqual(mockAttraction);
    });

    it('should prevent duplicates when adding same attraction twice', async () => {
      // Given
      await favoritesService.addFavorite(mockAttraction);
      
      // When
      const result = await favoritesService.addFavorite(mockAttraction);
      
      // Then
      const count = result.filter(a => a.id === mockAttraction.id).length;
      expect(count).toBe(1);
    });
  });

  describe('removeFavorite', () => {
    it('should remove attraction when called with valid id', async () => {
      // Given
      await favoritesService.addFavorite(mockAttraction);
      
      // When
      const result = await favoritesService.removeFavorite(mockAttraction.id);
      
      // Then
      expect(result).not.toContainEqual(mockAttraction);
    });
  });
});
```

### Example 2: Hook Test

Create `__tests__/hooks/useFavorites.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useFavorites } from '../../src/hooks/useFavorites';

const mockAttraction = {
  id: '1',
  name: 'Test Landmark',
  latitude: 52.52,
  longitude: 13.405,
  type: 'monument',
  description: 'Test',
  distance: 100
};

describe('useFavorites', () => {
  it('should load favorites on mount', async () => {
    // Given & When
    const { result, waitForNextUpdate } = renderHook(() => useFavorites());
    
    // Then
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.favorites).toBeDefined();
  });

  it('should add favorite when addFavorite is called', async () => {
    // Given
    const { result, waitForNextUpdate } = renderHook(() => useFavorites());
    await waitForNextUpdate();
    
    // When
    act(() => {
      result.current.addFavorite(mockAttraction);
    });
    await waitForNextUpdate();
    
    // Then
    expect(result.current.favorites).toContainEqual(mockAttraction);
  });
});
```

### Example 3: Screen Test

Create `__tests__/screens/HomeScreen.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/screens/HomeScreen';
import { createMockNavigation } from '../setup/mocks';

describe('HomeScreen', () => {
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render attractions list when data is loaded', async () => {
    // Given & When
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    // Then
    await waitFor(() => {
      expect(getByText(/attractions/i)).toBeTruthy();
    });
  });

  it('should navigate to details when attraction is pressed', async () => {
    // Given
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => getByText(/brandenburg/i));
    
    // When
    fireEvent.press(getByText(/brandenburg/i));
    
    // Then
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'Details',
      expect.any(Object)
    );
  });
});
```

## Running Tests (2 minutes)

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (for development)
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

Output:
```
PASS  __tests__/services/favorites.service.test.ts
PASS  __tests__/hooks/useFavorites.test.ts
PASS  __tests__/screens/HomeScreen.test.tsx

Test Suites: 3 passed, 3 total
Tests:       8 passed, 8 total
Time:        12.5s

Coverage:
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
src/services/                 |   92.5  |   88.3   |   95.0  |  92.1
src/hooks/                    |   87.2  |   82.1   |   89.3  |  86.8
src/screens/                  |   78.4  |   71.2   |   80.1  |  77.9
```

### Run Only Unit Tests (fast)
```bash
npm run test:unit
```

### Run Only Integration Tests
```bash
npm run test:integration
```

## Common Patterns

### Mocking API Calls

```typescript
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mockAxios = new MockAdapter(axios);

// Success response
mockAxios.onGet('/api/attractions').reply(200, mockAttractions);

// Error response
mockAxios.onGet('/api/attractions').reply(500, { error: 'Server error' });

// Timeout
mockAxios.onGet('/api/attractions').timeout();
```

### Mocking Location Permissions

```typescript
import * as Location from 'expo-location';

// Grant permission
(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
  status: 'granted',
  granted: true
});

// Deny permission
(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
  status: 'denied',
  granted: false
});
```

### Testing Async Operations

```typescript
it('should handle async data fetching', async () => {
  // Option 1: await
  const result = await service.fetchData();
  expect(result).toBeDefined();
  
  // Option 2: resolves matcher
  await expect(service.fetchData()).resolves.toBeDefined();
  
  // Option 3: waitFor from testing library
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  // Setup error
  mockAxios.onGet('/api/data').reply(500);
  
  // Option 1: try-catch
  try {
    await service.fetchData();
    fail('Should have thrown error');
  } catch (error) {
    expect(error.message).toContain('Server error');
  }
  
  // Option 2: rejects matcher
  await expect(service.fetchData()).rejects.toThrow('Server error');
});
```

## Troubleshooting

### Issue: "Cannot find module"
**Solution**: Check `moduleFileExtensions` in jest.config.js includes 'ts', 'tsx'

### Issue: "Timeout - Async callback was not invoked"
**Solution**: Increase timeout: `jest.setTimeout(15000)` or add `done` callback

### Issue: "Invariant Violation: TurboModuleRegistry"
**Solution**: Ensure `jest-expo` preset is configured correctly

### Issue: Tests pass locally but fail in CI
**Solution**: Use `npm run test:ci` which sets `--ci` flag for deterministic behavior

### Issue: Flaky tests (pass/fail randomly)
**Solution**: 
- Clear mocks in `beforeEach`
- Avoid hardcoded timeouts (use `waitFor`)
- Check for race conditions in async code

## Next Steps

1. ✅ Setup complete - ready to write tests
2. 📝 Create fixtures in `__tests__/fixtures/` for reusable test data
3. 🧪 Write service tests first (fastest, highest value)
4. 🪝 Add hook tests next (state management validation)
5. 🖥️ Write screen tests last (slowest, but validates user flows)
6. 📊 Monitor coverage: `npm run test:coverage`
7. 🔄 Add tests to CI/CD pipeline

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest Expect Matchers](https://jestjs.io/docs/expect)
- [jest-expo GitHub](https://github.com/expo/expo/tree/main/packages/jest-expo)

## Time Estimates

- **Setup (one-time)**: 10-15 minutes
- **First service test**: 15-20 minutes
- **First hook test**: 10-15 minutes
- **First screen test**: 20-30 minutes
- **Per additional test**: 5-10 minutes (once patterns established)
- **Total for all tests**: 20-30 hours (spread across implementation)

**Coverage milestone**: After first 10 hours, expect 50-60% coverage. After 20 hours, reach 80% target.
