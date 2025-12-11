# Implementation Plan: Add Comprehensive Test Coverage

**Branch**: `001-add-tests` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-add-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement comprehensive test coverage for Travel Guide App to achieve 80% overall code coverage with minimum thresholds: Services (90%), Hooks (85%), Screens (75%), Utils (90%). Use Jest + React Native Testing Library + jest-expo preset with TypeScript. All external dependencies (AsyncStorage, expo-location, API calls) must be mocked for offline test execution. Test suite must complete in <60 seconds and pass 100% reliably. Current status: 241/272 tests passing (88.6%), 86.43% coverage achieved.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with React Native 0.81.5 + Expo 54.x  
**Primary Dependencies**: Jest 29.7.0, React Native Testing Library 12.9.0, jest-expo 54.0.14, axios-mock-adapter 1.22.0  
**Storage**: AsyncStorage (@react-native-async-storage/async-storage 2.2.0) for persistence  
**Testing**: Jest with jest-expo preset, @testing-library/react-hooks 8.0.1 for hook testing  
**Target Platform**: React Native mobile (iOS 15+ / Android 8+), testable without emulators  
**Project Type**: Mobile application (React Native + Expo)  
**Performance Goals**: Test suite execution <60 seconds, 60fps UI animations, <200ms API response handling  
**Constraints**: Offline-capable tests (all external dependencies mocked), zero test flakiness, 100% pass rate required  
**Scale/Scope**: 
- Source files: 25 TypeScript modules (8 services, 3 hooks, 6 screens, 2 utils, 6 config/types)
- Test files: 18 test suites, 272 total tests
- Current coverage: 86.43% overall (Services: 98.79%, Hooks: 100%, Utils: 100%, Screens: 72.17%)
- Current status: 241/272 passing (88.6%), 31 failures to fix

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: User-First Experience ✅
- **Status**: PASS
- **Validation**: Test suite improves developer experience with <60s execution time (currently 15.4s). Fast feedback loop enables rapid iteration. Test documentation provides clear guidance for new developers.
- **Requirement**: Performance and accessibility for developers maintaining/extending the codebase.

### Principle II: Cross-Platform Consistency ✅
- **Status**: PASS
- **Validation**: Tests use jest-expo preset which handles platform-specific mocks automatically. Test suite is platform-agnostic and validates functional behavior consistently across iOS and Android without requiring platform-specific test variants.
- **Requirement**: Tests must run identically on both platforms.

### Principle III: Offline-First Architecture ✅
- **Status**: PASS
- **Validation**: All external dependencies mocked (AsyncStorage, expo-location, axios APIs). Test suite runs completely offline without network access. Location services use mock implementations without GPS requirements.
- **Requirement**: Tests must execute without network connectivity.

### Principle IV: API Integration Standards ✅
- **Status**: PASS
- **Validation**: Service layer tests validate API integrations (wiki, attractions, openai) with proper error handling, timeout scenarios, and fallback mechanisms. Mocks use axios-mock-adapter for isolation. API rate limiting and caching strategies are tested.
- **Requirement**: API integrations must be testable in isolation with proper error handling.

### Principle V: Internationalization (i18n) ✅
- **Status**: PASS
- **Validation**: i18n mocks configured for German and English in jest.setup.ts. Screen tests validate i18n key usage (t('key') pattern). SettingsScreen tests validate language switching behavior. No hardcoded user-facing strings in test assertions.
- **Requirement**: Tests must validate i18n functionality for all supported languages.

### Principle VI: Test-Driven Quality ⚠️
- **Status**: PARTIAL COMPLIANCE - BLOCKING VIOLATIONS
- **Validation**: 
  - ✅ Coverage thresholds exceeded: Overall 86.43% (target 80%), Services 98.79% (target 90%), Hooks 100% (target 85%), Utils 100% (target 90%)
  - ❌ **CRITICAL**: Only 241/272 tests passing (88.6%) - **31 tests failing**
  - ⚠️ Screens at 72.17% coverage (target 75% - need +2.83%)
  - ✅ Test execution time: 15.4s (well under 60s target)
  - ✅ Zero flakiness verified through multiple runs
- **Requirement**: ALL tests MUST pass (non-negotiable). This is a constitutional mandate.
- **Blocking Issues**: 
  1. **31 failing tests** must be fixed before merge (primarily HomeScreen and DetailsScreen)
  2. **Screen coverage gap** of 2.83% must be closed
- **Remediation**: Fix failing tests by debugging root causes (product bugs vs test issues), add minimal tests to reach 75% screen coverage threshold.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# React Native + Expo Mobile Application Structure
src/
├── services/              # API integration and business logic (8 files)
│   ├── attractions.service.ts
│   ├── favorites.service.ts
│   ├── interests.service.ts
│   ├── location.service.ts
│   ├── openai.service.ts
│   ├── storage.service.ts
│   ├── wiki.service.ts
│   └── index.ts
├── hooks/                 # React state management (3 files)
│   ├── useAttractions.ts
│   ├── useFavorites.ts
│   ├── useLocation.ts
│   └── index.ts
├── screens/               # UI components (6 files)
│   ├── DetailsScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── HomeScreen.tsx
│   ├── MapScreen.tsx
│   ├── SettingsScreen.tsx
│   └── WebViewScreen.tsx
├── utils/                 # Pure functions (1 file)
│   └── distance.ts
├── config/                # Configuration (2 files)
│   ├── i18n.ts
│   └── index.ts
├── types/                 # TypeScript definitions (2 files)
│   ├── index.ts
│   └── navigation.ts
├── constants/             # App constants (1 file)
│   └── index.ts
└── App.tsx                # Root component

__tests__/                 # Test infrastructure (mirrors src/)
├── services/              # Service unit tests (7 files)
│   ├── attractions.service.test.ts
│   ├── favorites.service.test.ts
│   ├── interests.service.test.ts
│   ├── location.service.test.ts
│   ├── openai.service.test.ts
│   ├── storage.service.test.ts
│   └── wiki.service.test.ts
├── hooks/                 # Hook integration tests (3 files)
│   ├── useAttractions.test.ts
│   ├── useFavorites.test.ts
│   └── useLocation.test.ts
├── screens/               # Screen integration tests (6 files)
│   ├── DetailsScreen.test.tsx
│   ├── FavoritesScreen.test.tsx
│   ├── HomeScreen.test.tsx
│   ├── MapScreen.test.tsx
│   ├── SettingsScreen.test.tsx
│   └── WebViewScreen.test.tsx
├── utils/                 # Utility unit tests (1 file)
│   └── distance.test.ts
├── fixtures/              # Test data factories (3 files)
│   ├── apiResponses.ts
│   ├── attractions.ts
│   └── locations.ts
├── setup/                 # Test configuration (3 files)
│   ├── jest.setup.ts      # Global test setup and mocks
│   ├── mocks.ts           # Centralized mock implementations
│   └── smoke.test.ts      # Basic smoke test
└── README.md              # Test documentation

# Configuration files at root
jest.config.js             # Jest configuration with coverage thresholds
tsconfig.json              # TypeScript compiler config
package.json               # Dependencies and test scripts
```

**Structure Decision**: Standard React Native project structure with colocated test directory. Test files mirror source structure for easy navigation. Fixtures and setup separated into dedicated directories for reusability. This follows React Native + Expo conventions and enables efficient test discovery.

## Complexity Tracking

**Constitution Principle VI Violation**: 31 failing tests (88.6% pass rate vs required 100%)

**Justification**: Implementation phase substantially complete with 86.43% overall coverage achieved (exceeds 80% target). Constitution amendment adding Principle VI occurred mid-implementation. Current violations are:
1. **Test failures (31/272)**: Primarily in HomeScreen (21 failures) and DetailsScreen tests due to async timing, mock lifecycle, and rendering edge cases
2. **Screen coverage gap (72.17% vs 75% target)**: Missing 2.83% due to uncovered error boundaries and edge case UI paths

**Mitigation Plan**:
1. Debug and fix 31 failing tests by analyzing error messages, fixing product bugs or test mocks
2. Add targeted tests for uncovered screen code paths (error states, edge cases)
3. Verify 100% pass rate across multiple test runs
4. Estimated effort: 4-6 hours to achieve full compliance

**Trade-off Analysis**: Proceeding with planning despite violations enables parallel work on test fixes while documenting implementation approach. Plan provides roadmap for achieving constitutional compliance. Alternative of blocking all planning until 100% pass rate would delay documentation of lessons learned and patterns established during implementation.

**Acceptable because**: 
- Core infrastructure complete and validated (services, hooks, utils all passing)
- Path to compliance clear and achievable
- Plan documents both current state and remediation steps
- Constitution violation is temporary and actively being addressed

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 31 failing tests (Principle VI) | Mid-implementation when constitution amended; infrastructure complete but edge cases remain | Blocking planning until 100% pass would delay documentation of working patterns and prevent parallel remediation work |
| Screen coverage 72.17% vs 75% | Error boundaries and edge case UI paths require additional targeted tests | Lower threshold would violate constitution; higher priority to fix failing tests first |

---

## Phase 1 Post-Design Constitution Re-check

*Re-evaluated after research.md, data-model.md, contracts/, and quickstart.md generation*

### Changes from Initial Check

**No new violations introduced**. Phase 1 design outputs (data model, API contracts, quickstart guide) align with all constitutional principles:

- ✅ **Principle I**: Quickstart guide provides clear developer experience with <10 minute setup
- ✅ **Principle II**: Test patterns documented as platform-agnostic (jest-expo handles platform differences)
- ✅ **Principle III**: Contracts specify offline-capable mocks for all external dependencies
- ✅ **Principle IV**: API service test contracts validate isolation and error handling
- ✅ **Principle V**: i18n testing patterns documented in quickstart and data model
- ⚠️ **Principle VI**: Pre-existing violations remain (31 failing tests, screen coverage gap)

**Recommendation**: Proceed to Phase 2 (task breakdown) while actively fixing test failures in parallel. Design is constitutionally sound; implementation execution needs remediation.

---
