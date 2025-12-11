# Data Model: Test Infrastructure

**Feature**: Add Comprehensive Test Coverage  
**Date**: 2025-12-10  
**Purpose**: Define test-related entities and their relationships

## Overview

This feature doesn't introduce user-facing data entities but rather testing infrastructure. The "entities" here are test-related constructs that enable validation of existing application entities.

## Test Entities

### TestSuite

Represents a collection of related tests for a specific module.

**Attributes**:
- `name`: string - Name of the test suite (e.g., "FavoritesService", "HomeScreen")
- `type`: 'unit' | 'integration' | 'snapshot' - Category of tests
- `layer`: 'service' | 'hook' | 'screen' | 'util' - Application layer being tested
- `testCases`: TestCase[] - Individual test cases in the suite
- `coverageTarget`: number - Percentage coverage goal for this suite

**Relationships**:
- Contains many TestCase entities
- Maps to one source file being tested

**Validation Rules**:
- Name must match source file name (e.g., "favorites.service.test.ts" tests "favorites.service.ts")
- Coverage target must align with layer (services: 90%, hooks: 85%, screens: 75%, utils: 90%)
- All test cases must have unique descriptions within suite

---

### TestCase

Represents an individual test within a test suite.

**Attributes**:
- `description`: string - Human-readable description (e.g., "should add attraction when called with valid data")
- `type`: 'behavioral' | 'error-handling' | 'edge-case' | 'snapshot' - Test category
- `arrange`: MockSetup[] - Setup actions (mocks, fixtures)
- `act`: Action - Function or user interaction being tested
- `assert`: Assertion[] - Expected outcomes
- `isAsync`: boolean - Whether test involves async operations

**Relationships**:
- Belongs to one TestSuite
- Uses zero or more MockSetup entities
- Contains one or more Assertion entities

**Validation Rules**:
- Description must be unique within parent test suite
- Must have at least one assertion
- Async tests must use await or return promise
- Should follow Given-When-Then pattern for complex scenarios

---

### MockSetup

Represents configuration for a mocked dependency.

**Attributes**:
- `target`: string - Dependency being mocked (e.g., "AsyncStorage", "expo-location", "axios")
- `behavior`: MockBehavior - How the mock should behave
- `scope`: 'global' | 'suite' | 'test' - When mock is active
- `returnValue`: any - What the mock returns (for success cases)
- `error`: Error | null - What the mock throws (for error cases)

**Mock Behaviors**:
- `SUCCESS`: Returns `returnValue` on invocation
- `ERROR`: Throws `error` on invocation  
- `TIMEOUT`: Simulates network timeout
- `EMPTY`: Returns empty result ([], null, undefined)

**Relationships**:
- Used by zero or more TestCase entities
- May reference Fixture entities for return values

**Validation Rules**:
- Global mocks defined in `jest.setup.ts`
- Suite/test-scoped mocks must be cleaned up after use
- Error mocks must provide meaningful error objects
- Success mocks must return data matching actual API contracts

---

### Fixture

Represents reusable test data.

**Attributes**:
- `name`: string - Fixture identifier (e.g., "mockBerlinAttraction", "mockLocationPermissionDenied")
- `type`: string - TypeScript type this fixture implements (e.g., "Attraction", "Location", "PermissionResponse")
- `data`: object - The actual mock data
- `variant`: 'minimal' | 'complete' | 'invalid' | 'edge-case' - Data completeness
- `factory`: Function | null - Optional factory function for customization

**Relationships**:
- Used by zero or more MockSetup entities
- Used by zero or more TestCase entities
- References TypeScript types from main application

**Validation Rules**:
- Must match TypeScript type definition (validated at compile time)
- Factory functions must return valid instances of the type
- Minimal variants include only required fields
- Complete variants include all optional fields with realistic values

---

### Assertion

Represents an expected outcome in a test.

**Attributes**:
- `type`: 'equality' | 'truthiness' | 'error' | 'call' | 'snapshot' - Assertion category
- `expected`: any - Expected value or condition
- `matcher`: string - Jest matcher used (e.g., "toBe", "toEqual", "toThrow", "toHaveBeenCalledWith")
- `message`: string | null - Optional custom failure message

**Assertion Types**:
- **Equality**: Compare values (`toBe`, `toEqual`, `toStrictEqual`)
- **Truthiness**: Boolean checks (`toBeTruthy`, `toBeFalsy`, `toBeDefined`)
- **Error**: Exception validation (`toThrow`, `rejects.toThrow`)
- **Call**: Mock verification (`toHaveBeenCalled`, `toHaveBeenCalledWith`)
- **Snapshot**: Visual/structure matching (`toMatchSnapshot`)

**Relationships**:
- Belongs to one TestCase
- May reference Fixture entities for expected values

**Validation Rules**:
- Equality assertions must use `toEqual` for objects (deep comparison)
- Error assertions must specify expected error message or type
- Call assertions require mocked functions
- Snapshot assertions should be paired with behavioral assertions

---

### CoverageReport

Represents test coverage metrics.

**Attributes**:
- `file`: string - Source file path
- `layer`: 'service' | 'hook' | 'screen' | 'util' - Application layer
- `lines`: CoverageMetric - Line coverage
- `branches`: CoverageMetric - Branch coverage
- `functions`: CoverageMetric - Function coverage
- `statements`: CoverageMetric - Statement coverage
- `timestamp`: Date - When coverage was measured

**CoverageMetric**:
- `covered`: number - Number covered
- `total`: number - Total number
- `percentage`: number - Coverage percentage (covered / total * 100)

**Relationships**:
- One per source file
- Aggregated into layer-level and global coverage

**Validation Rules**:
- All percentages must be >= layer-specific thresholds
- Services: 90% minimum
- Hooks: 85% minimum
- Screens: 75% minimum
- Utils: 90% minimum
- Global: 80% minimum average

---

## Entity Relationships Diagram

```
TestSuite (1) ──── (N) TestCase
                      │
                      ├── (N) MockSetup ──── (N) Fixture
                      │
                      └── (N) Assertion ──── (0..N) Fixture

CoverageReport (1) ──── (1) Source File
```

## Test Data State Transitions

### MockSetup Lifecycle
1. **Defined** → Mock created with behavior specification
2. **Active** → Mock intercepting calls during test execution
3. **Verified** → Assertions check mock was called correctly
4. **Cleaned** → Mock reset/restored after test

### TestCase Lifecycle
1. **Pending** → Test defined but not executed
2. **Running** → Test currently executing
3. **Passed** → All assertions succeeded
4. **Failed** → One or more assertions failed
5. **Skipped** → Test temporarily disabled

### CoverageReport Lifecycle
1. **Collecting** → Coverage instrumentation active during test run
2. **Complete** → All tests finished, coverage calculated
3. **Validated** → Coverage checked against thresholds
4. **Reported** → Coverage data formatted and displayed

## Notes

- Test entities are ephemeral (exist only during test execution)
- Fixtures are static (defined in code, version controlled)
- Coverage reports are generated artifacts (can be saved for historical tracking)
- All entities use TypeScript types for compile-time validation
