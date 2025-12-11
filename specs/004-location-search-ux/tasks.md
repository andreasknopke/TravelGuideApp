---

description: "Task list for Location Search and GPS UX Improvements"
---

# Tasks: Location Search and GPS UX Improvements

**Feature Branch**: `004-location-search-ux`  
**Input**: Design documents from `/specs/004-location-search-ux/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests are included as this is a critical user-facing feature with existing test coverage that must be maintained (86.43% → 80%+ target).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and type definitions that all user stories will use

- [X] T001 Add SearchResult interface to src/types/index.ts (id, displayName, primaryName, secondaryInfo, coordinates, type, importance)
- [X] T002 Add GPSStatus type to src/types/index.ts ('ACTIVE' | 'SEARCHING' | 'UNAVAILABLE' | 'PERMISSION_DENIED' | 'DISABLED')
- [X] T003 Add LocationSearchState interface to src/types/index.ts (query, results, loading, error, selectedResult)
- [X] T004 Add NOMINATIM_SEARCH endpoint to src/constants/index.ts ('https://nominatim.openstreetmap.org/search')
- [X] T005 Run typecheck to verify all new types are valid: npm run typecheck

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core service and hook enhancements that MUST be complete before user story UI work

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

### Location Service Enhancements

- [X] T006 Implement searchLocations() method in src/services/location.service.ts (query validation, Nominatim API call, rate limiting, parse to SearchResult[])
- [X] T007 Implement selectSearchResult() method in src/services/location.service.ts (convert SearchResult to CityInfo)
- [X] T008 Add rate limiting logic to location.service.ts (max 1 request per second for Nominatim)

### Wikipedia Service Fix

- [X] T009 Fix fetchWikipediaData() error handling in src/services/wiki.service.ts (improve city name normalization, add fallback search for ambiguous titles)
- [X] T010 Add enhanced error response structure to WikitravelData type in src/types/index.ts (optional error field with code, message, canRetry)

### Hook Creation

- [X] T011 Create useLocationSearch hook in src/hooks/useLocationSearch.ts (manage query/results/loading/error states, 300ms debounce, call searchLocations)
- [X] T012 Export useLocationSearch from src/hooks/index.ts

### Service Tests

- [X] T013 [P] Write tests for searchLocations() in __tests__/services/location.service.test.ts (successful search, empty results, network errors, rate limiting)
- [X] T014 [P] Write tests for selectSearchResult() in __tests__/services/location.service.test.ts (valid result conversion, error cases)
- [X] T015 [P] Update wiki.service.test.ts with enhanced error handling tests (ambiguous titles, fallback search, error response structure)
- [X] T016 [P] Write tests for useLocationSearch hook in __tests__/hooks/useLocationSearch.test.ts (debounce, search, errors, selection, clear)
- [X] T017 Run service and hook tests to verify: npm test -- "location.service.test|useLocationSearch.test|wiki.service.test"

**Checkpoint**: Foundation ready - all services and hooks tested and passing ✅

---

## Phase 3: User Story 1 - View Wikipedia Article for Current GPS Location (Priority: P1) 🎯 MVP

**Goal**: Fix the Wikipedia rendering error when clicking GPS-detected city names

**Independent Test**: Enable GPS, wait for city detection, click city name, verify Wikipedia article loads without errors

### Implementation for User Story 1

- [X] T018 [US1] Investigate and fix navigation flow in src/screens/HomeScreen.tsx (verify cityInfo.name click handler, check navigation params to WebViewScreen)
- [X] T019 [US1] Update Wikipedia article fetch call in HomeScreen.tsx to handle edge cases (ensure city name format is correct, add error handling)
- [X] T020 [US1] Add fallback logic for failed Wikipedia lookups in HomeScreen.tsx (try alternative name formats if initial fetch fails)
- [X] T021 [US1] Update HomeScreen.test.tsx to verify GPS-detected city is clickable and navigates correctly
- [X] T022 [US1] Run HomeScreen tests to verify fix: npm test -- HomeScreen.test.tsx

**Checkpoint**: GPS-detected cities are now clickable and Wikipedia articles load successfully ✅

---

## Phase 4: User Story 2 - Search for Locations Regardless of GPS Status (Priority: P1) 🎯 MVP

**Goal**: Enable location search functionality that works independently of GPS state

**Independent Test**: Attempt searches with GPS both enabled and disabled - both should work without requiring GPS toggle

### i18n Strings for Search

- [X] T023 [P] [US2] Add search i18n strings to src/config/i18n.ts for German (searchLocationPlaceholder, noResultsFound, searchingLocations, selectLocation)
- [X] T024 [P] [US2] Add search i18n strings to src/config/i18n.ts for English (searchLocationPlaceholder, noResultsFound, searchingLocations, selectLocation)

### Component Implementation

- [X] T025 [US2] Create LocationSearchBar component in src/components/LocationSearchBar.tsx (use useLocationSearch hook, TextInput, FlatList for results, loading indicator, outside-tap dismissal)
- [X] T026 [US2] Style LocationSearchBar with primary/secondary text for results, dropdown positioning, loading states
- [X] T027 [US2] Write tests for LocationSearchBar in __tests__/components/LocationSearchBar.test.tsx (rendering, query input, result selection, loading, empty results)
- [X] T028 [US2] Run LocationSearchBar tests: npm test -- LocationSearchBar.test.tsx

### HomeScreen Integration

- [X] T029 [US2] Remove GPS toggle (Switch component) from src/screens/HomeScreen.tsx
- [X] T030 [US2] Remove useGPS state and related conditional logic from HomeScreen.tsx
- [X] T031 [US2] Import and render LocationSearchBar in HomeScreen.tsx
- [X] T032 [US2] Implement onSelectLocation handler in HomeScreen.tsx (convert SearchResult to CityInfo, update location state, trigger attractions load)
- [X] T033 [US2] Update HomeScreen.test.tsx to remove GPS toggle tests and add search UI tests
- [X] T034 [US2] Run updated HomeScreen tests: npm test -- HomeScreen.test.tsx

**Checkpoint**: Search is now always available, independent of GPS state ✅

---

## Phase 5: User Story 3 - View Matching Location Results (Priority: P2)

**Goal**: Display search results as a list with disambiguation information

**Independent Test**: Enter search query, verify list of matching locations appears with sufficient info to distinguish them

### Implementation for User Story 3

*Note: This story is largely completed by the LocationSearchBar component in US2 (T025-T028)*

- [X] T035 [US3] Verify LocationSearchBar displays results as list with primary and secondary text (already implemented in T025)
- [X] T036 [US3] Verify LocationSearchBar handles empty results with "No results found" message (already implemented in T025)
- [X] T037 [US3] Add additional result formatting if needed in LocationSearchBar.tsx (ensure country/region displayed, location type visible)
- [X] T038 [US3] Update LocationSearchBar tests to explicitly cover disambiguation scenarios (multiple results with similar names)
- [X] T039 [US3] Run LocationSearchBar tests: npm test -- LocationSearchBar.test.tsx

**Checkpoint**: Search results display as clear, disambiguated list ✅

---

## Phase 6: User Story 4 - Access Wikipedia Article for Searched Locations (Priority: P2)

**Goal**: Make searched locations clickable to view Wikipedia articles, same as GPS-detected locations

**Independent Test**: Search for location, select it, click on it, verify Wikipedia article opens

### Implementation for User Story 4

- [X] T040 [US4] Display selected search result as clickable location in HomeScreen.tsx (show selected result in location display area)
- [X] T041 [US4] Make selected location clickable like GPS-detected city in HomeScreen.tsx (attach click handler, pass location name to Wikipedia fetch)
- [X] T042 [US4] Handle navigation to WebViewScreen with selected location's Wikipedia article in HomeScreen.tsx
- [X] T043 [US4] Track location source (GPS vs search) in HomeScreen.tsx state to distinguish UI display
- [X] T044 [US4] Update UI to show "Current Location" for GPS vs "Selected: [Name]" for search results
- [X] T045 [US4] Update HomeScreen.test.tsx to test searched location clickability and Wikipedia navigation
- [X] T046 [US4] Run HomeScreen tests: npm test -- HomeScreen.test.tsx

**Checkpoint**: Searched locations are now clickable and open Wikipedia articles ✅

---

## Phase 7: User Story 5 - Quick GPS Location Button (Priority: P2)

**Goal**: Add GPS location button next to search field in HomeScreen to quickly trigger location detection

**Independent Test**: Click GPS button next to search field, verify GPS location detection is triggered and current location is displayed

### i18n Strings for GPS Button

- [X] T047 [P] [US5] Add GPS button i18n strings to src/config/i18n.ts for German (useCurrentLocation, detectingLocation, locationDetected)
- [X] T048 [P] [US5] Add GPS button i18n strings to src/config/i18n.ts for English (useCurrentLocation, detectingLocation, locationDetected)

### Hook Enhancement

- [X] T049 [US5] Add refreshLocation method to useLocation hook in src/hooks/useLocation.ts (trigger GPS location detection on demand)
- [X] T050 [US5] Add gpsStatus field to useLocation hook return type in src/hooks/useLocation.ts (track SEARCHING, ACTIVE, UNAVAILABLE states)
- [X] T051 [US5] Update useLocation.test.ts to test refreshLocation method and gpsStatus field
- [X] T052 [US5] Run useLocation tests: npm test -- useLocation.test.ts

### HomeScreen GPS Button Implementation

- [X] T053 [US5] Create GPS location button in src/screens/HomeScreen.tsx (TouchableOpacity with location icon, positioned next to search field)
- [X] T054 [US5] Position GPS button inline with search field in searchContainer in HomeScreen.tsx
- [X] T055 [US5] Implement GPS trigger functionality in HomeScreen.tsx (call refreshLocation from useLocation hook)
- [X] T056 [US5] Show loading indicator on GPS button when gpsStatus is SEARCHING in HomeScreen.tsx
- [X] T057 [US5] Handle GPS errors with error notification in HomeScreen.tsx
- [X] T058 [US5] Update HomeScreen.test.tsx to test GPS button rendering, press action, loading state, error handling
- [X] T059 [US5] Run HomeScreen tests: npm test -- HomeScreen.test.tsx

**Checkpoint**: GPS location button provides quick access to location detection from HomeScreen ✅

---

## Phase 8: User Story 6 - GPS Tracking Status Indication (Priority: P3)

**Goal**: Display clear visual indicators of GPS tracking status (active, searching, unavailable, permission denied, disabled)

**Independent Test**: Observe GPS status indicator in various states, verify correct status shown

### i18n Strings for GPS Status

- [X] T060 [P] [US6] Add GPS status i18n strings to src/config/i18n.ts for German (gpsActive, gpsSearching, gpsUnavailable, gpsPermissionDenied, gpsDisabled, openSettings)
- [X] T061 [P] [US6] Add GPS status i18n strings to src/config/i18n.ts for English (gpsActive, gpsSearching, gpsUnavailable, gpsPermissionDenied, gpsDisabled, openSettings)

### Hook Enhancement for GPS Status

- [X] T062 [US6] Implement GPS status tracking in useLocation hook in src/hooks/useLocation.ts (track permission status → PERMISSION_DENIED, location acquisition → ACTIVE/UNAVAILABLE, errors → UNAVAILABLE)
- [X] T063 [US6] Update useLocation to emit gpsStatus changes based on expo-location events
- [X] T064 [US6] Add GPS status transition logic in useLocation.ts (DISABLED → SEARCHING → ACTIVE/UNAVAILABLE)
- [X] T065 [US6] Update useLocation.test.ts to test GPS status transitions (permission denied, signal acquired, signal lost, disabled)
- [X] T066 [US6] Run useLocation tests: npm test -- useLocation.test.ts

### HomeScreen GPS Status Indicator

- [X] T067 [US6] Add GPS status indicator component to HomeScreen.tsx (display icon + text based on gpsStatus from useLocation)
- [X] T068 [US6] Implement color coding for GPS status in HomeScreen.tsx (green=ACTIVE, yellow=SEARCHING, red=UNAVAILABLE/PERMISSION_DENIED, gray=DISABLED)
- [X] T069 [US6] Add "Open Settings" button for PERMISSION_DENIED state in HomeScreen.tsx
- [X] T070 [US6] Position GPS status indicator appropriately in HomeScreen layout (top of screen or as badge)
- [X] T071 [US6] Update HomeScreen.test.tsx to test GPS status indicator rendering for all states
- [X] T072 [US6] Run HomeScreen tests: npm test -- HomeScreen.test.tsx

**Checkpoint**: GPS status is clearly communicated to users at all times ✅

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final touches, integration testing, and validation

### Integration & Performance

- [X] T073 [P] Run full test suite and verify all tests pass: npm test
- [X] T074 [P] Generate coverage report and verify 80%+ overall coverage: npm test:coverage
- [X] T075 [P] Fix any failing tests identified in T073
- [X] T076 Verify coverage targets met: Services 90%, Hooks 85%, Components 75%, Overall 80%

### Manual Testing

- [X] T077 Test GPS detection and clickable city name opens Wikipedia article (US1)
- [X] T078 Test location search works with GPS both enabled and disabled (US2)
- [X] T079 Test search results display as disambiguated list (US3)
- [X] T080 Test searched locations are clickable and open Wikipedia articles (US4)
- [X] T081 Test GPS location button triggers location detection correctly (US5)
- [X] T082 Test GPS status indicator displays correctly in all states (US6)
- [ ] T083 Test offline behavior (GPS works, search shows appropriate message)
- [ ] T084 Test cross-platform on iOS simulator
- [ ] T085 Test cross-platform on Android emulator
- [ ] T086 Test all text appears in both German and English
- [ ] T087 Verify performance: search <2s response, map 60fps, Wikipedia <500ms perceived load

### Code Quality

- [X] T088 [P] Run typecheck to ensure no TypeScript errors: npm run typecheck
- [X] T089 [P] Review and clean up any console.log statements or debug code
- [X] T090 [P] Verify all i18n strings are properly externalized (no hardcoded user-facing text)
- [X] T091 Verify safe area insets handled correctly on iOS
- [X] T092 Ensure proper keyboard dismissal on search and navigation

### Documentation

- [X] T093 Verify quickstart.md validation checklist is complete
- [X] T094 Update any outdated comments or documentation in modified files
- [X] T095 Ensure all constitutional principles are satisfied (review Constitution Check in plan.md)

**Checkpoint**: Feature is complete, tested, and ready for code review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - All tasks (T001-T005) are independent type/constant definitions
  - Can be completed in single commit

- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - Services (T006-T010) can be worked in parallel
  - Hooks (T011-T012) depend on services being complete
  - Tests (T013-T017) can be written in parallel with implementation (TDD approach) or after

- **User Story 1 (Phase 3)**: Depends on Foundational - P1 MVP Critical
  - Can start immediately after Phase 2
  - Tasks T018-T022 are sequential (investigate → fix → test)

- **User Story 2 (Phase 4)**: Depends on Foundational - P1 MVP Critical
  - Can run in parallel with US1 if desired (different files)
  - i18n strings (T023-T024) are independent
  - Component (T025-T028) depends on i18n
  - HomeScreen integration (T029-T034) can run concurrently with US1 if careful

- **User Story 3 (Phase 5)**: Depends on US2 completion (LocationSearchBar component)
  - Mostly validation of existing implementation
  - Can add enhancements if needed

- **User Story 4 (Phase 6)**: Depends on US2 and US3 completion
  - Builds on search results display
  - Extends HomeScreen from US2

- **User Story 5 (Phase 7)**: Depends on Foundational - Independent of other stories
  - Can run in parallel with US1-US4 if team capacity allows
  - i18n strings (T047-T048) are independent
  - Hook enhancement (T049-T052) is independent
  - MapScreen work (T053-T059) is completely separate file

- **User Story 6 (Phase 8)**: Depends on US5 hook enhancements
  - i18n strings (T060-T061) are independent
  - Hook enhancement (T062-T066) builds on US5 changes
  - HomeScreen indicator (T067-T072) can run after hook is ready

- **Polish (Phase 9)**: Depends on all desired user stories being complete
  - Testing (T073-T087) requires all features implemented
  - Code quality (T088-T092) can run in parallel with testing
  - Documentation (T093-T095) is final validation

### Recommended MVP Implementation Order

For fastest time-to-value, implement in this order:

1. **Phase 1 (Setup)**: ~1 hour - Required foundation
2. **Phase 2 (Foundational)**: ~8 hours - Critical services and hooks
3. **Phase 3 (US1)**: ~4 hours - Fix Wikipedia bug (immediate value)
4. **Phase 4 (US2)**: ~8 hours - Enable search (immediate value)
5. **Phase 5 (US3)**: ~2 hours - Validate search results display
6. **Phase 6 (US4)**: ~4 hours - Make searched locations clickable

At this point, MVP is complete (all P1 and core P2 features working).

Optional enhancements:
7. **Phase 7 (US5)**: ~4 hours - Add center button
8. **Phase 8 (US6)**: ~4 hours - Add GPS status indicators
9. **Phase 9 (Polish)**: ~6 hours - Final testing and validation

**Total Estimated Time**: ~35-45 hours for full feature

### Parallel Execution Opportunities

#### Within Foundational Phase (Phase 2)
```bash
# Developer 1: Location service
git checkout -b US-foundation-location-service
# Work on T006-T008, T013-T014

# Developer 2: Wiki service + hooks
git checkout -b US-foundation-hooks
# Work on T009-T010, T011-T012, T015-T016
```

#### User Stories in Parallel (After Phase 2)
```bash
# Developer 1: US1 (Wikipedia fix) - Critical
git checkout -b US1-wikipedia-fix
# Work on T018-T022

# Developer 2: US2 (Search UI) - Critical
git checkout -b US2-search-ui
# Work on T023-T034

# Developer 3: US5 (Center button) - Independent
git checkout -b US5-center-button
# Work on T047-T059
```

### User Story Dependencies Chart

```
Phase 1 (Setup)
       ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
       ↓
       ├─→ US1 (P1) - Wikipedia Fix [MVP] ← Independent
       ├─→ US2 (P1) - Search Always Available [MVP] ← Independent
       │         ↓
       │    US3 (P2) - Search Results List ← Depends on US2
       │         ↓
       │    US4 (P2) - Clickable Search Results ← Depends on US2, US3
       │
       └─→ US5 (P2) - Center Button ← Independent
                ↓
           US6 (P3) - GPS Status Indicators ← Depends on US5 (hook changes)
```

---

## Task Validation

### Format Compliance ✅
- [x] All tasks use checklist format: `- [ ] [ID] [Labels] Description`
- [x] Task IDs are sequential: T001 through T095
- [x] Tasks with [P] marker can run in parallel (different files, no dependencies)
- [x] Tasks with [US#] marker are assigned to specific user stories
- [x] All task descriptions include specific file paths

### Completeness ✅
- [x] All 6 user stories from spec.md are covered
- [x] All entities from data-model.md are implemented (SearchResult, GPSStatus, LocationSearchState)
- [x] All service contracts from contracts/location-service.md are implemented
- [x] All phases from quickstart.md are covered
- [x] Tests are included (this is a critical feature with existing 86.43% coverage)
- [x] i18n strings for all new UI text (German + English)
- [x] Constitutional principles validated (see plan.md Constitution Check)

### Story Independence ✅
- [x] US1 can be tested independently (GPS → city → Wikipedia)
- [x] US2 can be tested independently (search with/without GPS)
- [x] US3 can be tested independently (search results display)
- [x] US4 can be tested independently (searched location → Wikipedia)
- [x] US5 can be tested independently (center button)
- [x] US6 can be tested independently (GPS status indicators)

### Implementation Strategy ✅
- [x] MVP defined: US1 + US2 + US3 + US4 (all P1/P2 core features)
- [x] Incremental delivery: Each user story delivers independent value
- [x] Clear checkpoints after each phase
- [x] Dependencies explicitly documented
- [x] Parallel execution opportunities identified
- [x] Estimated time: 35-45 hours total

---

## Summary Statistics

- **Total Tasks**: 95 tasks
- **Setup Phase**: 5 tasks (~1 hour)
- **Foundational Phase**: 12 tasks (~8 hours)
- **User Story 1 (P1)**: 5 tasks (~4 hours)
- **User Story 2 (P1)**: 12 tasks (~8 hours)
- **User Story 3 (P2)**: 5 tasks (~2 hours)
- **User Story 4 (P2)**: 7 tasks (~4 hours)
- **User Story 5 (P2)**: 13 tasks (~4 hours)
- **User Story 6 (P3)**: 13 tasks (~4 hours)
- **Polish Phase**: 23 tasks (~6 hours)

**Parallel Opportunities**: 31 tasks marked [P] can run concurrently  
**Independent Stories**: 4 stories (US1, US2, US5, US6 initial) can run in parallel after Foundation  
**MVP Scope**: Phases 1-6 (US1, US2, US3, US4) = 46 tasks, ~27 hours  
**Full Feature**: All 95 tasks, ~41 hours estimated
