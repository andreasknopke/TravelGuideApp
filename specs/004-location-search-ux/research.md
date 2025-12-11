# Research: Location Search and GPS UX Improvements

**Feature**: Location Search and GPS UX Improvements  
**Date**: December 11, 2025  
**Phase**: 0 - Research & Discovery

## Research Questions

1. What is causing the Wikipedia article rendering error for GPS-detected cities?
2. Which geocoding/location search API should be used for location search functionality?
3. What UI patterns work best for displaying search results with disambiguation?
4. How should GPS tracking status be indicated to users?
5. What is the standard pattern for "center on current location" buttons in map UIs?

---

## Finding 1: Wikipedia Article Rendering Error

**Research Question**: What is causing the Wikipedia article rendering error for GPS-detected cities?

**Decision**: The issue is likely in the navigation flow or error handling when city names are clicked.

**Rationale**: 
- Current code shows that `cityInfo` is obtained via `reverseGeocode` in `useLocation` hook
- The city name is displayed but clicking it may not be properly wired to the Wikipedia fetch
- `wikiService.fetchWikipediaData()` exists but may not be called with correct city name format
- Error handling in `wikiService` shows it catches errors but may return error state that UI doesn't handle properly

**Investigation Findings**:
- `HomeScreen.tsx` displays city name from `cityInfo` but click handler needs verification
- `wikiService.fetchWikipediaData()` handles Wikipedia API calls with proper error handling
- Need to ensure city name from reverse geocode matches Wikipedia article title format
- May need to implement search/redirect logic for ambiguous city names

**Implementation Approach**:
- Verify navigation flow from city name click to Wikipedia article display
- Ensure proper error handling and user feedback for failed Wikipedia lookups
- Add fallback search if exact city name doesn't match Wikipedia article
- Test with various city name formats (with/without country, special characters)

**Alternatives Considered**:
- Using Wikitravel API instead of Wikipedia (rejected: Wikipedia has better coverage and reliability)
- Pre-fetching Wikipedia articles on location detection (rejected: unnecessary network usage)
- Caching failed lookups (considered: add as enhancement if performance issues arise)

---

## Finding 2: Location Search API Selection

**Research Question**: Which geocoding/location search API should be used for location search functionality?

**Decision**: Use OpenStreetMap Nominatim API for location search

**Rationale**:
- Free and open-source with no API key required (removes configuration complexity)
- Returns structured results with display names, coordinates, and disambiguation info
- Well-documented JSON API with simple HTTP requests (integrates easily with axios)
- Respects privacy (no tracking unlike Google Places)
- Good coverage worldwide, essential for travel app
- Supports multiple result formats suitable for dropdown display

**API Details**:
- Endpoint: `https://nominatim.openstreetmap.org/search`
- Query parameters: `q` (search string), `format=json`, `limit=10`, `addressdetails=1`
- Returns: Array of results with `display_name`, `lat`, `lon`, `type`, `importance`
- Rate limit: 1 request/second (enforced by User-Agent requirement)
- Requirements: Must include User-Agent header (already configured in APP_CONFIG)

**Alternatives Considered**:
- Google Places API: Better quality but requires API key, billing setup, and has cost implications
- Mapbox Geocoding: High quality but requires API key and has usage limits on free tier
- HERE Geocoding: Good but complex setup and less familiar to developers
- Apple/Google native geocoding: Platform-specific, doesn't provide search results list

**Implementation Notes**:
- Implement rate limiting (max 1 req/sec) in locationService
- Cache recent search results to reduce API calls
- Implement debouncing (300-500ms) for search input to avoid excessive requests
- Handle network errors gracefully with offline message

---

## Finding 3: Search Results UI Pattern

**Research Question**: What UI patterns work best for displaying search results with disambiguation?

**Decision**: Dropdown list below search input with structured result cards

**Rationale**:
- Familiar pattern from web browsers, mobile app stores, and mapping apps
- Allows users to see multiple results without leaving current screen
- Results can be tapped to select, with immediate visual feedback
- Easy to implement with FlatList component in React Native
- Supports keyboard navigation patterns on tablets/devices with keyboards

**Result Display Format**:
```
[Icon] Primary Name
       Secondary Info (Country, Region, Type)
```

**Structure**:
- Primary text: Location name (e.g., "Berlin")
- Secondary text: Disambiguation info (e.g., "Germany, Capital city")
- Optional icon: Location type indicator (city, landmark, region)
- Sort by relevance (Nominatim provides `importance` score)

**Interaction Pattern**:
1. User types in search box
2. Results appear below search input after 300ms debounce
3. Tapping a result selects it, closes dropdown, and updates map
4. Selected location becomes clickable like GPS-detected location
5. Clear/cancel button to dismiss search results

**Alternatives Considered**:
- Modal overlay with full-screen results: Too intrusive for simple search
- Separate search results screen: Extra navigation step, reduces discoverability
- Auto-complete with single result: Doesn't handle ambiguous queries well
- Map-based results with pins: Confusing when showing global search results

**Implementation Notes**:
- Use conditional rendering to show/hide results dropdown
- Implement outside-click/tap dismissal using Pressable overlay
- Include loading indicator while search is in progress
- Show "No results found" message for empty results
- Limit to 10 results to maintain performance and usability

---

## Finding 4: GPS Tracking Status Indication

**Research Question**: How should GPS tracking status be indicated to users?

**Decision**: Combination of icon + text status indicator with color coding

**Rationale**:
- Users need immediate visual feedback about GPS state without reading text
- Color coding provides quick recognition (green=active, yellow=searching, red=error, gray=off)
- Icon + text accommodates different user preferences and accessibility needs
- Non-intrusive but always visible when relevant

**Status States**:
1. **Active Tracking** (Green): GPS enabled, signal available, tracking user
   - Icon: Filled location pin with pulse animation
   - Text: "Location: [City Name]" or "Tracking active"
   
2. **Searching** (Yellow/Orange): GPS enabled, waiting for signal
   - Icon: Location pin with loading spinner
   - Text: "Searching for GPS signal..."
   
3. **Error/Unavailable** (Red): GPS enabled but signal unavailable
   - Icon: Location pin with warning/slash
   - Text: "GPS signal unavailable"
   
4. **Permission Denied** (Red): GPS permissions not granted
   - Icon: Location pin with lock/warning
   - Text: "Location permission needed" with settings button
   
5. **Disabled** (Gray): GPS intentionally turned off
   - Icon: Outlined location pin
   - Text: "GPS disabled"

**Placement**: Top of screen (status bar area or below) or as badge on location button

**Alternatives Considered**:
- Toast/snackbar notifications: Too transient for persistent state info
- Only icon without text: Not accessible, unclear for new users
- Settings-style toggle with state: Takes too much screen space
- Modal on state change: Too intrusive for frequent updates

**Implementation Notes**:
- Use expo-location status events to track GPS state changes
- Implement smooth transitions between states (avoid jarring changes)
- Include haptic feedback for state changes on mobile
- Ensure color choices meet WCAG contrast requirements
- Consider animation/pulse effect for "searching" state

---

## Finding 5: Center-on-Location Button Pattern

**Research Question**: What is the standard pattern for "center on current location" buttons in map UIs?

**Decision**: Floating action button (FAB) with location icon in bottom-right corner

**Rationale**:
- Industry standard across Google Maps, Apple Maps, and most mapping apps
- Always accessible regardless of map zoom/pan state
- Thumb-reachable on mobile devices (right-handed users)
- Doesn't obscure map content (floats above)
- Clear affordance through standard location icon

**Button Characteristics**:
- Shape: Circular FAB
- Size: 48-56pt (meets minimum touch target size)
- Icon: Standard location/crosshair icon
- Position: Bottom-right, with 16-24pt margin from edges
- Elevation: Shadow/elevation effect to indicate it's floating
- Background: White or theme primary color with good contrast

**Behavior**:
1. **Initial state**: Shows outline location icon
2. **Tap**: Centers map on current GPS location, animates map movement
3. **Active tracking**: Icon becomes filled/solid to indicate following
4. **No GPS**: Button disabled (grayed out) or shows error state
5. **Subsequent tap while centered**: Toggles between following mode and static center

**Visual Feedback**:
- Ripple/press effect on tap
- Brief scale animation on successful center
- Pulse/glow effect when actively tracking
- Disabled state when GPS unavailable

**Alternatives Considered**:
- Toolbar button (top): Less reachable, not standard pattern
- Bottom-left position: Conflicts with navigation controls
- Double-tap map to center: Hidden affordance, not discoverable
- Gesture (pinch with 3 fingers): Too complex, poor discoverability

**Implementation Notes**:
- Use react-native-maps' `animateToRegion` for smooth centering
- Include appropriate zoom level (e.g., 15-16 for city level)
- Add pitch/heading reset to north-up orientation
- Ensure button respects safe area insets on iOS
- Test button position doesn't overlap with attribution/legal text

---

## Implementation Summary

### Key Technical Decisions

1. **Wikipedia Error Fix**: Review and fix navigation flow + error handling in Wikipedia article display
2. **Search API**: OpenStreetMap Nominatim with proper rate limiting and caching
3. **Search UI**: Dropdown list with structured result cards, 300ms debounce, max 10 results
4. **GPS Status**: Icon + text with 5-state color-coded system (Active, Searching, Error, Permission, Disabled)
5. **Center Button**: Circular FAB in bottom-right corner with standard location icon behavior

### Dependencies Required

- No new dependencies needed
- All functionality implementable with existing Expo/React Native/React Navigation stack
- OpenStreetMap Nominatim is free HTTP API (no SDK required)

### Risk Mitigation

- **Rate Limiting**: Implement 1 req/sec limit for Nominatim, add debouncing
- **Network Errors**: Comprehensive error handling with user-friendly messages
- **GPS Reliability**: Multiple status states to inform users of tracking state
- **Performance**: Limit search results to 10, use FlatList for efficient rendering
- **Testing**: Mock all external APIs (Wikipedia, Nominatim) for reliable test suite

### Cross-Cutting Concerns

- **i18n**: All new strings must be added to i18n configuration (DE/EN)
- **Offline**: Search requires network but degrades gracefully; GPS continues working offline
- **Accessibility**: Ensure color contrast, touch target sizes, and screen reader labels
- **Testing**: Maintain 80%+ coverage, add tests for all new components/services/hooks
