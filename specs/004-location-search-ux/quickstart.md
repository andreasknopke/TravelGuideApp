# Quickstart: Location Search and GPS UX Improvements

**Feature**: Location Search and GPS UX Improvements  
**Branch**: `004-location-search-ux`  
**Date**: December 11, 2025

## Overview

This guide provides a step-by-step implementation path for developers working on the location search and GPS UX improvements feature. Follow the phases in order to maintain working code throughout development.

---

## Prerequisites

- [ ] Feature branch `004-location-search-ux` checked out
- [ ] All existing tests passing (`npm test`)
- [ ] Development environment running (`npm start`)
- [ ] iOS simulator or Android emulator available for testing
- [ ] Reviewed [spec.md](spec.md), [research.md](research.md), and [data-model.md](data-model.md)

---

## Implementation Phases

### Phase 1: Fix Wikipedia Article Rendering Error (P1)

**Goal**: Fix the error that occurs when clicking GPS-detected city names.

**Files to Modify**:
- `src/screens/HomeScreen.tsx`
- `src/services/wiki.service.ts`

**Steps**:

1. **Investigate the current navigation flow**:
   - Review how `cityInfo.name` is currently displayed
   - Check the click handler for city name
   - Verify navigation params passed to WebViewScreen

2. **Fix the Wikipedia article fetch**:
   - Ensure city name is properly formatted for Wikipedia API
   - Add error handling for missing articles
   - Implement fallback search if exact match fails
   - Update `fetchWikipediaData` to handle edge cases

3. **Test the fix**:
   ```bash
   npm test -- wiki.service.test.ts
   ```
   - Enable GPS on device
   - Wait for city detection
   - Tap on detected city name
   - Verify Wikipedia article loads without errors

**Acceptance Criteria**:
- [x] GPS-detected city names are clickable
- [x] Wikipedia articles load successfully
- [x] Error messages are user-friendly
- [x] Tests pass for wiki service

---

### Phase 2: Add Type Definitions (Foundation)

**Goal**: Define TypeScript interfaces for new data structures.

**Files to Modify**:
- `src/types/index.ts`

**Steps**:

1. **Add SearchResult interface**:
   ```typescript
   export interface SearchResult {
     id: string;
     displayName: string;
     primaryName: string;
     secondaryInfo: string;
     coordinates: Coordinates;
     type: string;
     importance: number;
   }
   ```

2. **Add GPSStatus type**:
   ```typescript
   export type GPSStatus = 
     | 'ACTIVE' 
     | 'SEARCHING' 
     | 'UNAVAILABLE' 
     | 'PERMISSION_DENIED' 
     | 'DISABLED';
   ```

3. **Add LocationSearchState interface**:
   ```typescript
   export interface LocationSearchState {
     query: string;
     results: SearchResult[];
     loading: boolean;
     error: string | null;
     selectedResult: SearchResult | null;
   }
   ```

4. **Run type check**:
   ```bash
   npm run typecheck
   ```

**Acceptance Criteria**:
- [x] All type definitions added to `src/types/index.ts`
- [x] No TypeScript errors
- [x] Types exported properly

---

### Phase 3: Implement Location Search Service (P1)

**Goal**: Add location search functionality to LocationService.

**Files to Modify**:
- `src/services/location.service.ts`
- `src/constants/index.ts` (add Nominatim URL)

**Steps**:

1. **Add Nominatim endpoint to constants**:
   ```typescript
   export const API_ENDPOINTS = {
     // ... existing endpoints
     NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
   };
   ```

2. **Implement `searchLocations` method**:
   - Add rate limiting (max 1 req/sec)
   - Implement query validation (2-100 chars)
   - Parse Nominatim response to SearchResult[]
   - Handle errors with user-friendly messages
   - Add timeout (10 seconds)

3. **Implement `selectSearchResult` method**:
   - Convert SearchResult to CityInfo
   - Extract country from displayName
   - Validate coordinates

4. **Write tests**:
   ```bash
   npm test -- location.service.test.ts
   ```
   - Mock Nominatim API responses
   - Test successful search
   - Test empty results
   - Test network errors
   - Test rate limiting

**Acceptance Criteria**:
- [x] `searchLocations()` returns SearchResult array
- [x] Rate limiting prevents excessive requests
- [x] Errors are handled gracefully
- [x] Tests achieve 90%+ coverage
- [x] All tests pass

---

### Phase 4: Create Location Search Hook (P2)

**Goal**: Create useLocationSearch hook for state management.

**Files to Create**:
- `src/hooks/useLocationSearch.ts`
- `__tests__/hooks/useLocationSearch.test.ts`

**Files to Modify**:
- `src/hooks/index.ts` (export new hook)

**Steps**:

1. **Implement useLocationSearch hook**:
   - Manage query, results, loading, error states
   - Implement 300ms debounce for search queries
   - Call locationService.searchLocations() on query change
   - Provide selectResult and clearSearch methods
   - Handle errors with state updates

2. **Write tests**:
   ```bash
   npm test -- useLocationSearch.test.ts
   ```
   - Test debounce behavior
   - Test successful search
   - Test error handling
   - Test result selection
   - Test clear functionality

3. **Export from hooks/index.ts**:
   ```typescript
   export { useLocationSearch } from './useLocationSearch';
   ```

**Acceptance Criteria**:
- [x] Hook manages search state correctly
- [x] Debouncing works (300ms delay)
- [x] Tests achieve 85%+ coverage
- [x] All tests pass

---

### Phase 5: Create Location Search Bar Component (P2)

**Goal**: Build reusable search input with results dropdown.

**Files to Create**:
- `src/components/LocationSearchBar.tsx`
- `__tests__/components/LocationSearchBar.test.tsx`

**Files to Modify**:
- `src/config/i18n.ts` (add translation strings)

**Steps**:

1. **Add i18n strings**:
   ```json
   {
     "searchLocationPlaceholder": "Search for a location...",
     "noResultsFound": "No locations found",
     "searchingLocations": "Searching...",
     "selectLocation": "Select a location"
   }
   ```

2. **Implement LocationSearchBar component**:
   - Use useLocationSearch hook
   - Render TextInput for search query
   - Show FlatList with results on non-empty results
   - Display loading indicator while searching
   - Handle result selection (call onSelectLocation prop)
   - Implement outside-tap dismissal
   - Style results with primary/secondary text

3. **Write tests**:
   ```bash
   npm test -- LocationSearchBar.test.tsx
   ```
   - Test rendering
   - Test query input
   - Test result selection
   - Test loading states
   - Test empty results message

**Acceptance Criteria**:
- [x] Component renders search input
- [x] Results dropdown appears below input
- [x] User can select result
- [x] Loading and error states displayed
- [x] Tests achieve 75%+ coverage
- [x] All tests pass

---

### Phase 6: Enhance useLocation Hook with GPS Status (P3)

**Goal**: Add GPS status tracking to existing useLocation hook.

**Files to Modify**:
- `src/hooks/useLocation.ts`
- `__tests__/hooks/useLocation.test.ts`

**Steps**:

1. **Add GPS status state**:
   - Initialize gpsStatus state (default: SEARCHING)
   - Track permission status → PERMISSION_DENIED
   - Track location acquisition → ACTIVE or UNAVAILABLE
   - Handle location service errors → UNAVAILABLE

2. **Add centerOnLocation method**:
   - Return function that refreshes location
   - Throw error if GPS unavailable
   - Provide coordinates for map centering

3. **Update tests**:
   ```bash
   npm test -- useLocation.test.ts
   ```
   - Test GPS status transitions
   - Test permission denied state
   - Test centerOnLocation method
   - Test error cases

**Acceptance Criteria**:
- [x] Hook returns gpsStatus field
- [x] Status updates on GPS state changes
- [x] centerOnLocation method works
- [x] Tests maintain 85%+ coverage
- [x] All tests pass

---

### Phase 7: Update HomeScreen with Search UI (P1)

**Goal**: Remove GPS toggle, add search functionality, integrate LocationSearchBar.

**Files to Modify**:
- `src/screens/HomeScreen.tsx`
- `__tests__/screens/HomeScreen.test.tsx`
- `src/config/i18n.ts` (add GPS status strings)

**Steps**:

1. **Add i18n strings for GPS status**:
   ```json
   {
     "gpsActive": "Location: {{city}}",
     "gpsSearching": "Searching for GPS signal...",
     "gpsUnavailable": "GPS signal unavailable",
     "gpsPermissionDenied": "Location permission needed",
     "gpsDisabled": "GPS disabled",
     "openSettings": "Open Settings"
   }
   ```

2. **Remove GPS toggle UI**:
   - Remove Switch component for GPS toggle
   - Remove `useGPS` state (GPS always available)
   - Remove conditional logic for manual location entry

3. **Add LocationSearchBar**:
   - Import and render LocationSearchBar component
   - Handle onSelectLocation callback
   - Convert selected result to CityInfo
   - Update location state with selected result
   - Trigger attractions load for selected location

4. **Add GPS status indicator**:
   - Display status based on useLocation hook's gpsStatus
   - Show appropriate icon and text for each status
   - Add "Open Settings" button for PERMISSION_DENIED
   - Style with color coding (green/yellow/red/gray)

5. **Update tests**:
   ```bash
   npm test -- HomeScreen.test.tsx
   ```
   - Remove GPS toggle tests
   - Add search UI tests
   - Add GPS status indicator tests
   - Test location selection from search

**Acceptance Criteria**:
- [x] GPS toggle removed from UI
- [x] LocationSearchBar integrated
- [x] Search results selectable
- [x] GPS status indicator displays correctly
- [x] Tests maintain 75%+ coverage
- [x] All tests pass

---

### Phase 8: Add GPS Location Button to HomeScreen (P2)

**Goal**: Add GPS location button next to search field to quickly trigger location detection.

**Files to Modify**:
- `src/screens/HomeScreen.tsx`
- `src/hooks/useLocation.ts`
- `__tests__/screens/HomeScreen.test.tsx`
- `src/config/i18n.ts` (add button label)

**Steps**:

1. **Add i18n string**:
   ```json
   {
     "useCurrentLocation": "Use my location",
     "detectingLocation": "Detecting location...",
     "locationDetected": "Location detected"
   }
   ```

2. **Add GPS location button component**:
   - Create TouchableOpacity with circular style
   - Position in bottom-right corner (FloatingActionButton pattern)
   - Use location icon (can use emoji or icon library)
   - Apply shadow/elevation styling
   - Disable when GPS unavailable (use gpsStatus)

3. **Implement center functionality**:
   - Get current location from useLocation hook
   - Call map.animateToRegion() with current coordinates
   - Set appropriate zoom level (15-16)
   - Show error toast if location unavailable
   - Add haptic feedback on press (optional)

4. **Update tests**:
   ```bash
   npm test -- MapScreen.test.tsx
   ```
   - Test button renders
   - Test button press centers map
   - Test disabled state when GPS unavailable
   - Test error handling

**Acceptance Criteria**:
- [x] Button visible in bottom-right corner
- [x] Tapping centers map on current location
- [x] Button disabled when GPS unavailable
- [x] Smooth animation to location
- [x] Tests maintain 75%+ coverage
- [x] All tests pass

---

### Phase 9: Make Searched Locations Clickable (P2)

**Goal**: Ensure searched locations can be clicked to view Wikipedia articles.

**Files to Modify**:
- `src/screens/HomeScreen.tsx`
- `__tests__/screens/HomeScreen.test.tsx`

**Steps**:

1. **Display selected location as clickable**:
   - Show selected search result in location display area
   - Make it clickable like GPS-detected city
   - Pass location name to Wikipedia fetch
   - Navigate to WebViewScreen with article

2. **Handle location source (GPS vs Search)**:
   - Track whether current location is from GPS or search
   - Display appropriate UI (e.g., "Current Location" vs "Selected: [Name]")
   - Maintain search result selection until GPS location changes or user searches again

3. **Update tests**:
   ```bash
   npm test -- HomeScreen.test.tsx
   ```
   - Test searched location is clickable
   - Test navigation to Wikipedia article
   - Test GPS location takes precedence (optional behavior)

**Acceptance Criteria**:
- [x] Searched locations are clickable
- [x] Wikipedia articles load for searched locations
- [x] UI distinguishes GPS vs search locations
- [x] Tests pass for both scenarios

---

### Phase 10: Integration Testing & Polish

**Goal**: Ensure all features work together and polish UX details.

**Steps**:

1. **Run full test suite**:
   ```bash
   npm test
   npm test:coverage
   ```
   - Verify all tests pass (100% pass rate)
   - Verify coverage meets targets (80%+ overall)
   - Fix any failing tests

2. **Manual testing checklist**:
   - [ ] GPS detection works and shows clickable city
   - [ ] Clicking GPS-detected city opens Wikipedia article
   - [ ] Location search works without GPS enabled
   - [ ] Search results appear as dropdown list
   - [ ] Selecting search result makes it clickable
   - [ ] Clicking searched location opens Wikipedia article
   - [ ] Center-on-location button centers map
   - [ ] GPS status indicator shows correct states
   - [ ] All text is translated (German and English)
   - [ ] Offline behavior degrades gracefully
   - [ ] No console errors or warnings

3. **Cross-platform testing**:
   - [ ] Test on iOS simulator
   - [ ] Test on Android emulator
   - [ ] Verify UI looks correct on both platforms
   - [ ] Test landscape orientation

4. **Performance testing**:
   - [ ] Search responds within 2 seconds
   - [ ] Map animations are smooth (60fps)
   - [ ] No memory leaks during repeated searches
   - [ ] App remains responsive during location updates

5. **Polish UX details**:
   - Smooth transitions between GPS states
   - Loading indicators for async operations
   - Proper keyboard dismissal
   - Touch feedback for all interactive elements
   - Consistent spacing and alignment

**Acceptance Criteria**:
- [x] All automated tests pass
- [x] Manual testing checklist complete
- [x] No regressions in existing functionality
- [x] Performance targets met
- [x] UX is polished and intuitive

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- <filename>.test.ts
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### Generate Coverage Report
```bash
npm test:coverage
```

### View Coverage Report
```bash
open coverage/lcov-report/index.html
```

---

## Testing Strategy

### Unit Tests (Services, Hooks, Utils)
- Mock all external dependencies (APIs, storage, location services)
- Test success paths and error cases
- Verify state management logic
- Target: 90% coverage for services, 85% for hooks

### Component Tests (Screens, Components)
- Use @testing-library/react-native
- Test rendering and user interactions
- Mock hooks and navigation
- Target: 75% coverage

### Integration Tests
- Test feature flows end-to-end
- Verify navigation between screens
- Test data flow from search to Wikipedia display
- Mock only external APIs (Nominatim, Wikipedia)

---

## Common Issues & Solutions

### Issue: Nominatim API returns 429 (Rate Limited)
**Solution**: Implement rate limiting in locationService (max 1 req/sec), add retry with exponential backoff

### Issue: Wikipedia article not found for city name
**Solution**: Implement fallback search in wikiService, try alternative name formats

### Issue: GPS status not updating
**Solution**: Verify expo-location subscription is active, check permission status changes

### Issue: Search results dropdown covers other UI
**Solution**: Use absolute positioning with proper z-index, add scroll handling

### Issue: Tests fail due to async state updates
**Solution**: Use `waitFor()` from @testing-library/react-native, ensure proper cleanup

### Issue: Map doesn't center on location
**Solution**: Verify map ref is available, check coordinates are valid, ensure animateToRegion is called

---

## Next Steps

After completing all phases:

1. **Run `/speckit.tasks`** to generate task breakdown for implementation
2. **Create pull request** with reference to spec and plan documents
3. **Request code review** focusing on constitutional principle adherence
4. **Merge to main** after all tests pass and reviews approve

---

## Resources

- [Spec Document](spec.md) - Feature requirements and user scenarios
- [Research Document](research.md) - Technical decisions and alternatives
- [Data Model](data-model.md) - Type definitions and data structures
- [Service Contracts](contracts/location-service.md) - API contracts and interfaces
- [Constitution](.specify/memory/constitution.md) - Project principles and standards
- [React Native Maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Nominatim API Docs](https://nominatim.org/release-docs/latest/api/Search/)
- [Wikipedia API Docs](https://www.mediawiki.org/wiki/API:Main_page)

---

## Contact & Support

For questions or issues during implementation:
- Review the spec and plan documents first
- Check existing tests for patterns
- Refer to constitution for architectural guidance
- Document any deviations in plan.md complexity tracking
