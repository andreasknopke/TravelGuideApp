# Service Contracts: Location Search

**Feature**: Location Search and GPS UX Improvements  
**Date**: December 11, 2025

## LocationService Contract

### Method: searchLocations()

Search for locations by name and return a list of matching results.

**Signature**:
```typescript
async searchLocations(query: string, limit?: number): Promise<SearchResult[]>
```

**Request Parameters**:
```typescript
{
  query: string;      // Search query (2-100 characters, trimmed)
  limit?: number;     // Max results (default: 10, max: 20)
}
```

**Response**:
```typescript
SearchResult[] // Array of matching locations, sorted by importance (descending)

interface SearchResult {
  id: string;              // Unique identifier (OSM place_id)
  displayName: string;     // Full formatted name (e.g., "Berlin, Germany")
  primaryName: string;     // Main name (e.g., "Berlin")
  secondaryInfo: string;   // Disambiguation (e.g., "Germany, Capital city")
  coordinates: {
    latitude: number;      // -90 to 90
    longitude: number;     // -180 to 180
  };
  type: string;            // Location type (city, town, village, landmark, etc.)
  importance: number;      // Relevance score (0.0 to 1.0)
}
```

**Error Cases**:
```typescript
// Network timeout (>10s)
throw new Error('Search timed out. Please try again.');

// Network unavailable
throw new Error('No internet connection. Please check your network.');

// API rate limit exceeded
throw new Error('Too many searches. Please wait a moment.');

// Invalid query
throw new Error('Please enter a valid location name.');

// Empty query
throw new Error('Please enter a location to search.');
```

**Behavior**:
- Trims and validates query string
- Returns empty array for queries < 2 characters
- Limits results to specified `limit` parameter
- Implements rate limiting (max 1 request per second)
- Caches results for identical queries (1 hour TTL) - optional enhancement
- Times out after 10 seconds
- Filters out results with invalid coordinates

**Side Effects**:
- Makes HTTP request to Nominatim API
- May trigger error notification service for critical errors

---

### Method: selectSearchResult()

Convert a SearchResult to CityInfo format for consistency with GPS-detected locations.

**Signature**:
```typescript
selectSearchResult(result: SearchResult): CityInfo
```

**Request Parameters**:
```typescript
{
  result: SearchResult;  // Selected search result
}
```

**Response**:
```typescript
CityInfo // Normalized location information

interface CityInfo {
  name: string;        // Location name (from result.primaryName)
  country: string;     // Extracted from result.secondaryInfo or displayName
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
```

**Error Cases**:
```typescript
// Invalid or missing result
throw new Error('Invalid search result provided.');

// Missing required fields
throw new Error('Search result is incomplete.');
```

**Behavior**:
- Extracts country from secondaryInfo or displayName
- Normalizes coordinates to CityInfo format
- Returns consistent structure regardless of source (GPS vs search)

**Side Effects**: None (pure transformation function)

---

### Method: getCurrentLocation() - Enhanced

Existing method with GPS status enhancement.

**Added Response Fields**:
```typescript
{
  // ... existing location data
  gpsStatus: GPSStatus;  // Current GPS tracking state
}
```

**GPS Status Values**:
- `'ACTIVE'` - GPS enabled, signal available, tracking
- `'SEARCHING'` - GPS enabled, acquiring signal
- `'UNAVAILABLE'` - GPS enabled, signal unavailable
- `'PERMISSION_DENIED'` - Location permissions not granted
- `'DISABLED'` - GPS disabled

**Behavior Changes**:
- Returns GPS status alongside location data
- Includes null location when GPS unavailable but indicates status
- Emits status change events for UI updates

---

## WikiService Contract

### Method: fetchWikipediaData() - Enhanced Error Handling

Existing method with improved error handling and city name normalization.

**Signature** (unchanged):
```typescript
async fetchWikipediaData(location: string, language?: Language): Promise<WikitravelData>
```

**Enhanced Behavior**:
- Attempts exact match first
- Falls back to search API if exact match fails
- Handles redirects automatically
- Returns structured error data instead of throwing

**Enhanced Response**:
```typescript
WikitravelData // Article data with error metadata

interface WikitravelData {
  title: string;
  extract: string;
  coordinates: { lat: number; lon: number } | null;
  error?: {                    // [NEW] Optional error details
    code: string;              // Error code (e.g., 'NOT_FOUND', 'NETWORK')
    message: string;           // User-friendly message
    canRetry: boolean;         // Whether user should retry
  };
}
```

**Error Handling Strategy**:
1. Article not found → Return error with suggestion to refine search
2. Network timeout → Return error with retry suggestion
3. API unavailable → Return error with offline message
4. Ambiguous title → Attempt search and use best match

**Side Effects**:
- Triggers error notification service for user-facing errors
- Logs errors for debugging

---

## Hook Contracts

### useLocationSearch Hook

Custom hook for managing location search state.

**Signature**:
```typescript
function useLocationSearch(): UseLocationSearchResult
```

**Return Type**:
```typescript
interface UseLocationSearchResult {
  query: string;                          // Current search query
  results: SearchResult[];                // Search results array
  loading: boolean;                       // Search in progress
  error: string | null;                   // Error message if failed
  selectedResult: SearchResult | null;    // Currently selected result
  
  // Actions
  setQuery: (query: string) => void;      // Update search query
  selectResult: (result: SearchResult) => void;  // Select a result
  clearSearch: () => void;                // Clear search state
}
```

**Behavior**:
- Debounces `setQuery` calls by 300ms
- Automatically triggers search when query changes
- Manages loading and error states
- Provides clear/reset functionality
- Does not trigger search for queries < 2 characters

**Side Effects**:
- Calls locationService.searchLocations()
- Updates component state on query/result changes

---

### useLocation Hook - Enhanced

Existing hook with GPS status additions.

**Added Return Fields**:
```typescript
interface UseLocationResult {
  // ... existing fields
  gpsStatus: GPSStatus;                           // Current GPS state
  refreshLocation: () => Promise<void>;           // Trigger GPS detection
}
```

**New Method: refreshLocation()**:
- Returns a promise that resolves when location is acquired
- Throws error if GPS unavailable or permissions denied
- Triggers fresh GPS location detection

**Behavior Changes**:
- Tracks GPS status changes via expo-location events
- Emits status updates when GPS state changes
- Provides on-demand GPS location refresh

---

## API Contracts

### Nominatim Search API

**External API**: OpenStreetMap Nominatim

**Endpoint**:
```
GET https://nominatim.openstreetmap.org/search
```

**Request Parameters**:
```typescript
{
  q: string;              // Search query
  format: 'json';         // Response format
  limit: number;          // Max results (1-50)
  addressdetails: 1;      // Include address breakdown
  accept-language: string; // Preferred language (optional)
}
```

**Request Headers**:
```typescript
{
  'User-Agent': string;  // Required: APP_CONFIG.USER_AGENT
}
```

**Response Schema**:
```typescript
Array<{
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
    state?: string;
    // ... other fields
  };
  type: string;
  importance: number;
  icon?: string;
}>
```

**Rate Limits**:
- Maximum 1 request per second
- Burst allowance: None (strict enforcement)
- Exceeded limit: HTTP 429 Too Many Requests

**Error Responses**:
- 400 Bad Request: Invalid parameters
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: API issue
- Network timeout: 10 seconds

**Usage Requirements**:
- Must include User-Agent header
- Respect rate limits
- Cache results when possible
- Follow attribution requirements (already in app)

---

## Component Contracts

### LocationSearchBar Component (New)

Reusable search input component with results dropdown.

**Props**:
```typescript
interface LocationSearchBarProps {
  onSelectLocation: (result: SearchResult) => void;  // Called when user selects result
  placeholder?: string;                              // Search input placeholder
  autoFocus?: boolean;                               // Auto-focus on mount
  style?: StyleProp<ViewStyle>;                      // Custom container style
}
```

**Emitted Events**:
```typescript
// onSelectLocation
(result: SearchResult) => void

// Triggered when user taps a search result
// Provides full SearchResult object for handling
```

**Internal State**:
- Manages search query and results via useLocationSearch hook
- Shows/hides dropdown based on results availability
- Handles keyboard dismissal
- Manages focus states

**Behavior**:
- Debounces input by 300ms
- Shows loading indicator while searching
- Displays up to 10 results
- Closes dropdown on selection or outside tap
- Shows "No results" message when appropriate
- Clears results on input clear

---

## Event Contracts

### GPS Status Change Event

**Event Type**: Custom event emitted by useLocation hook

**Event Data**:
```typescript
{
  previousStatus: GPSStatus;
  currentStatus: GPSStatus;
  timestamp: number;        // Unix timestamp
  location?: Coordinates;   // Current location if available
}
```

**When Emitted**:
- GPS permission granted/denied
- Signal acquired/lost
- GPS enabled/disabled by user
- Location service error

**Subscribers**:
- GPS status indicator component
- Center-on-location button
- Error notification service (for critical status changes)

---

## Testing Contracts

### Mock Contracts

**LocationService Mock**:
```typescript
{
  searchLocations: jest.fn().mockResolvedValue([
    // ... mock SearchResult array
  ]),
  selectSearchResult: jest.fn().mockReturnValue({
    // ... mock CityInfo
  }),
  getCurrentLocation: jest.fn().mockResolvedValue({
    // ... mock location with gpsStatus
  })
}
```

**Nominatim API Mock**:
```typescript
// Using axios-mock-adapter
mockAdapter.onGet('https://nominatim.openstreetmap.org/search')
  .reply(200, [
    // ... mock Nominatim response
  ]);
```

**Expected Test Scenarios**:
1. Successful search with multiple results
2. Empty search results
3. Network error during search
4. Rate limit exceeded (429)
5. GPS status transitions
6. Search result selection and Wikipedia lookup
7. Debounce behavior verification
8. Center-on-location with/without GPS

---

## Backward Compatibility

### Breaking Changes
None. All changes are additive or internal enhancements.

### Migration Required
None. Existing functionality remains unchanged.

### Deprecated APIs
None. No APIs are being deprecated.

### Version Compatibility
- Minimum Expo SDK: 54.x (unchanged)
- Minimum React Native: 0.81.5 (unchanged)
- Minimum iOS: 13.0 (unchanged)
- Minimum Android: API 26 (unchanged)
