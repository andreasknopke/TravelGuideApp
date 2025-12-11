# Implementation Plan: Location Search and GPS UX Improvements

**Branch**: `004-location-search-ux` | **Date**: December 11, 2025 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-location-search-ux/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix Wikipedia article rendering errors for GPS-detected cities and improve location search UX by: (1) enabling search functionality regardless of GPS state, (2) displaying search results as a selectable list with disambiguation, (3) making searched locations clickable for Wikipedia access, (4) adding a quick GPS location button next to the search field, and (5) providing clear GPS tracking status indicators. The technical approach will enhance existing location services, add geocoding search with result presentation, and improve UI feedback patterns.

## Technical Context

**Language/Version**: TypeScript 5.9.3, React Native 0.81.5  
**Primary Dependencies**: Expo 54.x (expo-location 19.0.7), React Navigation 6.x, axios 1.6.0, react-native-maps 1.20.1, i18next 23.7.0  
**Storage**: AsyncStorage (@react-native-async-storage/async-storage 2.2.0) for favorites and map data  
**Testing**: Jest 29.7.0 with @testing-library/react-native 12.9.0, axios-mock-adapter 1.22.0  
**Target Platform**: iOS 13+, Android 8.0+ (API 26+) via Expo managed workflow  
**Project Type**: Mobile (React Native) with single codebase for iOS/Android  
**Performance Goals**: <2s search response time, 60fps map animations, <500ms Wikipedia article load (perceived)  
**Constraints**: Offline-first (map/location must work without network), i18n for all UI text (DE/EN), 80%+ test coverage  
**Scale/Scope**: Single-screen modifications (HomeScreen primary), 3 services enhanced (location, wiki, error-notification), ~500-800 LOC changes estimated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Phase 0) ✅

- [x] **Principle I (User-First Experience)**: Enhances UX by removing GPS toggle friction, adding search results feedback, clear GPS status indicators, and quick GPS location button. All changes prioritize intuitive interaction patterns. ✅
- [x] **Principle II (Cross-Platform Consistency)**: Uses React Native/Expo cross-platform APIs (expo-location, react-native-maps). No platform-specific implementations required. ✅
- [x] **Principle III (Offline-First)**: Maintains offline capability for cached locations/articles. Search requires network but degrades gracefully with clear error messages. GPS functionality remains offline-capable. ✅
- [x] **Principle IV (API Integration Standards)**: Wikipedia article fix and location search will be isolated in locationService and wikiService with proper error handling, caching, and fallback mechanisms. ✅
- [x] **Principle V (i18n)**: All new UI text (search results, GPS status indicators, error messages, button labels) will be externalized through i18next system for DE/EN support. ✅
- [x] **Principle VI (Test-Driven Quality)**: Will maintain 80%+ overall coverage (currently 86.43%). New features will include unit tests for services, integration tests for hooks, and screen tests for UI interactions. All existing tests must continue passing. ✅

**Initial Gate Status**: ✅ PASS - All constitutional principles aligned. No violations to justify.

---

### Post-Design Check (After Phase 1) ✅

- [x] **Principle I (User-First Experience)**: 
  - ✅ LocationSearchBar component provides instant feedback with debounced search
  - ✅ GPS status indicator uses color coding and clear text for accessibility
  - ✅ Quick GPS location button provides easy access to location detection
  - ✅ Search results show disambiguation info (city + country + type)
  - ✅ All interactions have proper loading states and error messages

- [x] **Principle II (Cross-Platform Consistency)**:
  - ✅ All components use React Native core components (TextInput, FlatList, TouchableOpacity)
  - ✅ No platform-specific code required in implementation
  - ✅ UI patterns work identically on iOS and Android
  - ✅ Safe area insets handled for iOS notches

- [x] **Principle III (Offline-First)**:
  - ✅ GPS tracking works without network (expo-location is offline-capable)
  - ✅ Cached Wikipedia articles remain accessible offline
  - ✅ Search gracefully indicates network requirement
  - ✅ Error messages distinguish between offline and other failures
  - ✅ Map centering works offline with GPS-only

- [x] **Principle IV (API Integration Standards)**:
  - ✅ Nominatim search isolated in locationService.searchLocations()
  - ✅ Rate limiting implemented (1 req/sec) per API requirements
  - ✅ Proper error handling for network timeouts and API failures
  - ✅ User-Agent header included per Nominatim requirements
  - ✅ Wikipedia service enhanced with fallback search logic
  - ✅ All external APIs mocked in tests (axios-mock-adapter)

- [x] **Principle V (i18n)**:
  - ✅ All new strings added to i18n configuration:
    - Search placeholder, no results message, loading text
    - GPS status messages (5 states)
    - Center button label and error messages
    - Error messages for search failures
  - ✅ Both German and English translations required in implementation
  - ✅ String keys follow existing patterns (e.g., `gpsActive`, `searchLocationPlaceholder`)

- [x] **Principle VI (Test-Driven Quality)**:
  - ✅ Test plan covers all new components, hooks, and services
  - ✅ Coverage targets: Services 90%, Hooks 85%, Components 75%, Overall 80%
  - ✅ All tests pass requirement maintained (no broken tests)
  - ✅ Test fixtures defined for SearchResult, GPS states
  - ✅ Mock contracts specified for Nominatim API and locationService
  - ✅ Integration tests planned for search → Wikipedia flow
  - ✅ Manual testing checklist included in quickstart

**Post-Design Gate Status**: ✅ PASS - All constitutional principles validated in design. Implementation ready to proceed.

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
src/
├── components/              # [NEW] Reusable UI components
│   └── LocationSearchBar.tsx      # Search input with results dropdown
├── hooks/
│   ├── useLocation.ts              # [MODIFY] Add GPS status state
│   └── useLocationSearch.ts        # [NEW] Location search hook
├── screens/
│   ├── HomeScreen.tsx              # [MODIFY] Remove GPS toggle, add search UI, GPS status, GPS button
│   └── MapScreen.tsx               # No changes needed for US5
├── services/
│   ├── location.service.ts         # [MODIFY] Add searchLocation with results list
│   ├── wiki.service.ts             # [MODIFY] Fix rendering error, handle edge cases
│   └── error-notification.service.ts # [MODIFY] Add GPS status error messages
└── types/
    └── index.ts                    # [MODIFY] Add SearchResult, GPSStatus types

__tests__/
├── components/
│   └── LocationSearchBar.test.tsx  # [NEW] Search component tests
├── hooks/
│   ├── useLocation.test.ts         # [MODIFY] Add GPS status tests
│   └── useLocationSearch.test.ts   # [NEW] Search hook tests
├── screens/
│   ├── HomeScreen.test.tsx         # [MODIFY] Update for new UX
│   └── MapScreen.test.tsx          # [MODIFY] Add center button tests
└── services/
    ├── location.service.test.ts    # [MODIFY] Add search tests
    └── wiki.service.test.ts        # [MODIFY] Add error case tests
```

**Structure Decision**: Mobile single-project structure (existing pattern maintained). All changes within existing `src/` hierarchy. New `components/` directory created for reusable LocationSearchBar. Services extended for search functionality while maintaining current architecture (no new service layers).

## Complexity Tracking

> **No constitutional violations - this section intentionally left empty.**

All constitutional principles are satisfied without requiring architectural compromises or exceptions.
