# Research: Testing Strategy for React Native + Expo

**Feature**: Add Comprehensive Test Coverage  
**Date**: 2025-12-10  
**Purpose**: Resolve technical unknowns and establish testing patterns for React Native/Expo/TypeScript stack

## Research Topics

### 1. Jest Configuration for React Native + Expo + TypeScript

**Decision**: Use `jest-expo` preset with TypeScript support

**Rationale**:
- `jest-expo` provides pre-configured mocks for all Expo modules (expo-location, expo-constants, etc.)
- Handles React Native transformations automatically
- Supports TypeScript out of the box with ts-jest
- Maintained by Expo team, ensuring compatibility with Expo SDK updates
- Eliminates need to manually mock dozens of Expo APIs

**Configuration**:
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/constants/**/*'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}']
};
```

**Alternatives Considered**:
- Plain Jest with react-native preset: Requires extensive manual Expo module mocking
- React Native Testing Library preset: Doesn't handle Expo-specific modules
- Custom configuration: Too time-consuming and error-prone

---

### 2. Testing Library Strategy for React Native

**Decision**: Use `@testing-library/react-native` for component/screen testing

**Rationale**:
- Industry standard for React Native component testing
- Encourages testing from user's perspective (queries by text, role, testID)
- Async utilities (`waitFor`, `findBy*`) handle React Native's async rendering
- Better than enzyme (deprecated) or shallow rendering (misses integration issues)
- Integrates seamlessly with Jest
- Avoids testing implementation details (internal state, private methods)

**Key Patterns**:
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Query by accessible text
const element = screen.getByText('Search');

// Query by testID for non-text elements
const button = screen.getByTestId('favorite-button');

// Async assertions
await waitFor(() => expect(screen.getByText('Loaded')).toBeTruthy());

// User interactions
fireEvent.press(button);
fireEvent.changeText(input, 'Berlin');
```

**Alternatives Considered**:
- Enzyme: Deprecated, no longer maintained, doesn't support React 18+
- React Test Renderer: Lower-level, requires more boilerplate, less intuitive queries
- Manual testing only: Not scalable, no regression detection, slow feedback loop

---

### 3. Hook Testing Strategy

**Decision**: Use `@testing-library/react-hooks` for custom hook testing

**Rationale**:
- Designed specifically for testing hooks in isolation
- `renderHook` utility eliminates need for wrapper components
- Handles hook re-renders and unmounting correctly
- Async hook testing with `waitForNextUpdate` and `waitFor`
- Can test hook dependencies and cleanup functions
- Prevents coupling tests to component implementation

**Key Patterns**:
```typescript
import { renderHook, act } from '@testing-library/react-hooks';

const { result, waitForNextUpdate } = renderHook(() => useFavorites());

// Access hook return values
expect(result.current.favorites).toEqual([]);

// Call hook functions
act(() => {
  result.current.addFavorite(mockAttraction);
});

// Wait for async state updates
await waitForNextUpdate();
```

**Alternatives Considered**:
- Testing hooks through components: Couples hook tests to UI, harder to isolate logic
- Manual hook wrapper components: More boilerplate, less intuitive
- Testing only components: Misses hook-specific logic and state management patterns

---

### 4. Mocking Strategy for External Dependencies

**Decision**: Layer-specific mocking with centralized mock configuration

**Rationale**:
- AsyncStorage: Use `@react-native-async-storage/async-storage/jest/async-storage-mock`
- expo-location: Mock with jest-expo + custom location fixtures
- axios: Use `axios-mock-adapter` for API call mocking
- React Navigation: Mock navigation prop with type-safe mock factory
- Centralized mocks in `__tests__/setup/mocks.ts` ensure consistency

**Mock Patterns**:

**AsyncStorage Mock**:
```typescript
// jest.setup.ts
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
```

**expo-location Mock**:
```typescript
// jest-expo provides base mock, customize in tests:
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  geocodeAsync: jest.fn()
}));
```

**axios Mock** (per-test):
```typescript
import MockAdapter from 'axios-mock-adapter';
const mockAxios = new MockAdapter(axios);

mockAxios.onGet('/api/attractions').reply(200, mockAttractions);
```

**Navigation Mock**:
```typescript
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn()
} as any;
```

**Alternatives Considered**:
- Manual mocks for everything: Too much boilerplate, hard to maintain
- No mocks (test against real APIs): Slow, flaky, requires network, not offline-capable
- In-memory implementations: More accurate but complex, overkill for unit tests

---

### 5. Test Data Management (Fixtures)

**Decision**: Centralized TypeScript fixture files with factory functions

**Rationale**:
- Type-safe mock data using actual TypeScript interfaces
- Factory functions enable customization while providing sensible defaults
- Centralized location prevents duplication across test files
- Easy to maintain when data models evolve
- Supports both minimal and complete data scenarios

**Fixture Pattern**:
```typescript
// __tests__/fixtures/attractions.ts
import { Attraction } from '../../src/types';

export const createMockAttraction = (overrides?: Partial<Attraction>): Attraction => ({
  id: '1',
  name: 'Brandenburg Gate',
  latitude: 52.5163,
  longitude: 13.3777,
  type: 'monument',
  description: 'Historic landmark',
  distance: 500,
  ...overrides
});

export const mockAttractions: Attraction[] = [
  createMockAttraction({ id: '1', name: 'Brandenburg Gate' }),
  createMockAttraction({ id: '2', name: 'Reichstag', latitude: 52.5186 })
];
```

**Alternatives Considered**:
- Inline test data: Duplicates data across files, hard to maintain
- JSON fixtures: Lose TypeScript type safety, harder to customize
- Test data builders (libraries): Overkill for this project size, adds dependency
- Random data generators: Can cause flaky tests, harder to debug failures

---

### 6. Coverage Measurement and Thresholds

**Decision**: 80% minimum coverage with Jest's built-in coverage tool, varying by layer

**Rationale**:
- Jest coverage uses Istanbul under the hood (industry standard)
- 80% overall provides good confidence without diminishing returns
- Layer-specific thresholds reflect testing value vs. effort:
  - Services: 90% (pure logic, high value)
  - Hooks: 85% (state management, critical)
  - Screens: 75% (UI heavy, some presentation-only code)
  - Utils: 90% (pure functions, easy to test)
- Coverage reports identify gaps and track progress
- Prevents accidentally removing tests (coverage would drop)

**Configuration**:
```javascript
coverageThresholds: {
  global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  'src/services/**/*.ts': { branches: 90, functions: 90, lines: 90, statements: 90 },
  'src/hooks/**/*.ts': { branches: 85, functions: 85, lines: 85, statements: 85 },
  'src/screens/**/*.tsx': { branches: 75, functions: 75, lines: 75, statements: 75 },
  'src/utils/**/*.ts': { branches: 90, functions: 90, lines: 90, statements: 90 }
}
```

**Alternatives Considered**:
- 100% coverage requirement: Diminishing returns, leads to meaningless tests for trivial code
- No coverage tracking: Can't measure progress or identify gaps
- Lower thresholds (60-70%): Insufficient confidence in critical business logic
- Higher thresholds (95%+): Too strict, wastes time testing presentation-only code

---

### 7. Test Organization and Naming Conventions

**Decision**: Mirror source structure in `__tests__/`, use descriptive test names with Given-When-Then

**Rationale**:
- `__tests__/` directory mirrors `src/` for easy navigation
- File naming: `[filename].test.ts` or `[filename].test.tsx`
- Test suite naming: `describe('[ComponentName/ServiceName]', ...)`
- Test case naming: `it('should [expected behavior] when [condition]', ...)`
- Group related tests with nested `describe` blocks
- Given-When-Then comments in complex tests for clarity

**Example Structure**:
```typescript
describe('FavoritesService', () => {
  describe('addFavorite', () => {
    it('should add attraction to favorites when called with valid attraction', async () => {
      // Given
      const attraction = createMockAttraction();
      
      // When
      const result = await favoritesService.addFavorite(attraction);
      
      // Then
      expect(result).toContainEqual(attraction);
    });
    
    it('should prevent duplicates when adding same attraction twice', async () => {
      // Given & When & Then
    });
  });
  
  describe('removeFavorite', () => {
    // tests...
  });
});
```

**Alternatives Considered**:
- Colocated tests (next to source files): Clutters src/ directory, harder to distinguish test from source
- Flat test structure: Hard to navigate with 20+ test files
- Minimal test names ("test 1", "test 2"): Not descriptive, hard to understand failures
- BDD-style libraries (cucumber): Overkill for unit/integration tests, adds complexity

---

### 8. Snapshot Testing Strategy

**Decision**: Limited snapshot use for complex UI structures, no snapshots for services/hooks

**Rationale**:
- Useful for: Complex component trees, style regressions, error states
- Not useful for: Services (no visual output), hooks (state is dynamic), simple components
- Snapshots catch unintended visual changes but create maintenance burden
- Use sparingly: Only 5-10 snapshots for critical screens/complex components
- Always pair with behavioral assertions (don't rely solely on snapshots)

**When to Use Snapshots**:
- ✅ HomeScreen with full attraction list (complex structure)
- ✅ MapScreen with markers (verifies all props passed correctly)
- ✅ Error states (consistent error UI across app)
- ❌ Services (no visual output)
- ❌ Hooks (dynamic state, not visual)
- ❌ Simple components (behavioral tests sufficient)

**Alternatives Considered**:
- Snapshot everything: Too brittle, frequent meaningless updates, hard to review
- No snapshots: Miss visual regressions, especially in complex component trees
- Visual regression testing (Percy/Chromatic): Too expensive, overkill for mobile app

---

## Summary of Decisions

| Topic | Decision | Key Reason |
|-------|----------|------------|
| Test Framework | Jest with jest-expo preset | Expo-optimized, minimal configuration |
| Component Testing | React Native Testing Library | Industry standard, user-centric testing |
| Hook Testing | @testing-library/react-hooks | Isolation, async handling, best practice |
| AsyncStorage | Built-in jest mock | Simple, reliable, no extra setup |
| Location Services | jest-expo + custom fixtures | Controlled test scenarios |
| API Mocking | axios-mock-adapter | Per-test flexibility, type-safe |
| Test Data | TypeScript fixture factories | Type-safe, maintainable, reusable |
| Coverage Target | 80% overall, layer-specific | Balanced confidence vs. effort |
| Test Structure | Mirror src/ in __tests__/ | Easy navigation, clear separation |
| Snapshots | Minimal (5-10 for complex UI) | Catch visual changes without burden |

## Open Questions: NONE

All technical unknowns have been resolved through research. Ready to proceed to Phase 1 design.
